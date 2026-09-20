import { CONFIG } from './config.js';
import { isAllowlisted } from './whitelist.js';

// SURF 확장은 두 가지 방식으로 차단을 잡아낸다.
//
//  단독 모드 (PROACTIVE=true)
//     webNavigation 으로 이동 직전에 도메인을 확보해 서버에 물어본다.
//     DNS 설정을 건드리지 않으므로 웹스토어에서 설치만 하면 바로 동작한다.
//
//  DNS 연동 모드
//     SURF DNS 가 NXDOMAIN 을 반환하면 webRequest 오류로 잡아낸다.
//     브라우저 밖 백그라운드 통신까지 막는 것은 이쪽만 할 수 있다.
//
// 두 경로 모두 같은 blocked.html 로 끝나므로 사용자가 보는 화면은 동일하다.

const VERDICT_TTL_MS = 30 * 60 * 1000;   // 판정 캐시 유지 시간
const NEGATIVE_TTL_MS = 6 * 60 * 60 * 1000; // 정상 판정은 더 오래 유지
const API_TIMEOUT_MS = 2500;
const BLOCK_THRESHOLD = 0;               // 서버가 boolean 을 주므로 점수는 표시용

const memCache = new Map();  // 서비스 워커가 살아있는 동안만 쓰는 L1 캐시

// ---------------------------------------------------------------- 유틸

function normalizeDomain(hostname) {
    const h = hostname.toLowerCase().replace(/\.$/, '');
    return h.startsWith('www.') ? h.slice(4) : h;
}

// 검사할 가치가 없는 대상을 걸러냄
// IP 리터럴과 단일 라벨 호스트(localhost, 사내 호스트명)는 DGA 판별 대상이 아님
function extractCheckableDomain(rawUrl) {
    let url;
    try {
        url = new URL(rawUrl);
    } catch {
        return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    const host = url.hostname;
    if (!host) return null;
    if (host === 'localhost') return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;   // IPv4
    if (host.includes(':') || host.startsWith('[')) return null; // IPv6
    if (!host.includes('.')) return null;                     // 단일 라벨

    return normalizeDomain(host);
}

// ---------------------------------------------------------------- 켜짐/꺼짐

// 팝업의 토글이 여기 값을 읽어서 사용. 키가 없으면(첫 설치) 기본값은 켜짐.
async function isExtensionEnabled() {
    const stored = await chrome.storage.local.get('surf_enabled');
    return stored.surf_enabled !== false;
}

// 단독 모드도 팝업에서 변경 가능. 키가 없으면(첫 설치) config.js 의 PROACTIVE 값을 기본값으로 사용.
// 배포 시 정해둔 기본 동작은 그대로 유지.
async function isProactiveEnabled() {
    const stored = await chrome.storage.local.get('surf_proactive');
    return stored.surf_proactive !== undefined ? stored.surf_proactive : CONFIG.PROACTIVE;
}

async function updateBadge() {
    const enabled = await isExtensionEnabled();
    await chrome.action.setBadgeText({ text: enabled ? '' : 'OFF' });
    await chrome.action.setBadgeBackgroundColor({ color: '#3a4557' });
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'surf_enabled' in changes) updateBadge();
});

updateBadge();

// ---------------------------------------------------------------- 클라이언트 토큰

// 이 기기를 식별하는 값. Redis 키가 이 토큰으로 묶이므로 허용 상태가 기기 단위로 유지. 
// DoH 를 함께 쓰는 기기는 DoH URL 의 ?c= 와 같아야 함.
async function getClientToken() {
    if (CONFIG.CLIENT_TOKEN) return CONFIG.CLIENT_TOKEN;

    const stored = await chrome.storage.local.get('client_token');
    if (stored.client_token) return stored.client_token;

    const token = crypto.randomUUID();
    await chrome.storage.local.set({ client_token: token });
    return token;
}

// ---------------------------------------------------------------- 캐시

async function getCachedVerdict(domain) {
    const hit = memCache.get(domain);
    if (hit && hit.expires > Date.now()) return hit;
    if (hit) memCache.delete(domain);

    const key = `v:${domain}`;
    const stored = await chrome.storage.session.get(key);
    const entry = stored[key];
    if (entry && entry.expires > Date.now()) {
        memCache.set(domain, entry);
        return entry;
    }
    return null;
}

async function setCachedVerdict(domain, blocked, prob) {
    const entry = {
        blocked,
        prob,
        expires: Date.now() + (blocked ? VERDICT_TTL_MS : NEGATIVE_TTL_MS)
    };
    memCache.set(domain, entry);
    await chrome.storage.session.set({ [`v:${domain}`]: entry });
}

// ---------------------------------------------------------------- 사용자 허용 상태

// 사용자가 차단 페이지에서 허용을 누르면 서버뿐 아니라 여기에도 기록.
// 이게 없으면 허용 직후 재이동에서 확장이 다시 막아 무한 루프가 됨.
async function isUserAllowed(domain) {
    const key = `allow:${domain}`;
    const stored = await chrome.storage.local.get(key);
    const until = stored[key];
    if (until === undefined) return false;
    if (until === 0) return true;              // 영구 허용
    if (until > Date.now()) return true;       // 임시 허용 유효
    await chrome.storage.local.remove(key);    // 만료분 정리
    return false;
}

async function recordUserAllow(domain, mode) {
    const until = mode === 'temp' ? Date.now() + 30 * 60 * 1000 : 0;
    await chrome.storage.local.set({ [`allow:${domain}`]: until });
    memCache.delete(domain);
    await chrome.storage.session.remove(`v:${domain}`);
}

// ---------------------------------------------------------------- 서버 조회

// 모델 추론. 서버가 죽거나 느리면 통과시킴(fail-open).
async function queryPredict(domain) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const token = await getClientToken();
        const res = await fetch(
            `${CONFIG.API_BASE_URL}/predict?domain=${encodeURIComponent(domain)}`,
            { signal: controller.signal, headers: { 'X-SURF-Client': token } }
        );
        if (!res.ok) return null;
        return await res.json();   // { blocked: bool, prob: number, domain: str }
    } catch (err) {
        console.warn('[SURF] predict 실패, 통과 처리:', domain, err.name);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

// DNS 연동 모드에서 사용. NXDOMAIN 이 우리 모델 때문인지 확인.
async function queryCheck(domain) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const token = await getClientToken();
        const res = await fetch(
            `${CONFIG.API_BASE_URL}/check?domain=${encodeURIComponent(domain)}`,
            { signal: controller.signal, headers: { 'X-SURF-Client': token } }
        );
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn('[SURF] check 실패:', domain, err.name);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

// ---------------------------------------------------------------- 차단 페이지 이동

function goToBlockPage(tabId, domain, prob, source) {
    if (tabId === undefined || tabId < 0) return;
    const url = chrome.runtime.getURL(
        `blocked.html?domain=${encodeURIComponent(domain)}&prob=${prob}&src=${source}`
    );
    chrome.tabs.update(tabId, { url }).catch(err => {
        console.warn('[SURF] 탭 이동 실패:', err.message);
    });
}

// ---------------------------------------------------------------- 단독 모드

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (!(await isExtensionEnabled())) return;
    if (!(await isProactiveEnabled())) return;
    if (details.frameId !== 0) return;        // 메인 프레임만
    if (details.tabId < 0) return;

    const domain = extractCheckableDomain(details.url);
    if (!domain) return;
    if (isAllowlisted(domain)) return;
    if (await isUserAllowed(domain)) return;

    const cached = await getCachedVerdict(domain);
    if (cached) {
        if (cached.blocked) goToBlockPage(details.tabId, domain, cached.prob, 'cache');
        return;
    }

    const verdict = await queryPredict(domain);
    if (!verdict) return;                      // fail-open

    await setCachedVerdict(domain, verdict.blocked, verdict.prob);
    if (verdict.blocked) {
        goToBlockPage(details.tabId, domain, verdict.prob, 'proactive');
    }
});

// ---------------------------------------------------------------- DNS 연동 모드

chrome.webRequest.onErrorOccurred.addListener(
    async (details) => {
        if (details.type !== 'main_frame') return;
        if (details.error !== 'net::ERR_NAME_NOT_RESOLVED') return;
        if (!(await isExtensionEnabled())) return;

        const domain = extractCheckableDomain(details.url);
        if (!domain) return;
        if (await isUserAllowed(domain)) return;

        // NXDOMAIN 은 두 경로에서 올 수 있음. 모델이 막았거나, 정말 없는 도메인이거나.
        // 서버에 차단 기록이 남아 있을 때만 차단 페이지로.
        const data = await queryCheck(domain);
        if (data && data.result === 'surf_blocked') {
            // source: "predict" 면 이 도메인이 미등록 도메인이라 우연히 NXDOMAIN이
            // 난 것뿐, 실제로는 단독 모드가 막은 것이다. DNS가 정말 막은 경우만
            // 'dns' 라벨을 붙인다.
            const src = data.source === 'predict' ? 'proactive' : 'dns';
            goToBlockPage(details.tabId, domain, data.prob, src);
        }
    },
    { urls: ['<all_urls>'] }
);

// ---------------------------------------------------------------- 차단 페이지와의 통신

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'surf-allow') {
        recordUserAllow(msg.domain, msg.mode).then(() => sendResponse({ ok: true }));
        return true;   // 비동기 응답
    }
    if (msg?.type === 'surf-token') {
        getClientToken().then(token => sendResponse({ token }));
        return true;
    }
    if (msg?.type === 'surf-get-settings') {
        Promise.all([isExtensionEnabled(), isProactiveEnabled()])
            .then(([enabled, proactive]) => sendResponse({ enabled, proactive }));
        return true;
    }
});

isProactiveEnabled().then(p => console.log('[SURF] 백그라운드 시작. 단독 모드:', p));
