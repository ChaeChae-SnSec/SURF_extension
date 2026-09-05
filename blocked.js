import { CONFIG } from './config.js';

// 차단 경로별 표시 문구. 사용자가 왜 막혔는지 알 수 있게 한다.
const SOURCE_LABEL = {
    proactive: 'AI 실시간 판별',
    cache: 'AI 실시간 판별',
    dns: 'SURF DNS 차단',
    download: '다운로드 검사'
};

// 이 기기의 클라이언트 토큰. 서버는 IP 대신 이 값으로 허용 상태를 묶는다.
async function getToken() {
    try {
        const res = await chrome.runtime.sendMessage({ type: 'surf-token' });
        return res?.token ?? '';
    } catch {
        return '';
    }
}

function showStatus(text, kind) {
    const el = document.getElementById('status-msg');
    el.textContent = text;
    el.className = `status-msg show ${kind}`;
}

window.addEventListener('load', async () => {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get('domain') || 'unknown';
    const prob = parseFloat(params.get('prob')) || 0;
    const source = params.get('src') || 'proactive';

    document.getElementById('domain-name').innerText = domain;
    document.getElementById('src-badge').innerText = SOURCE_LABEL[source] || 'SURF';

    const token = await getToken();
    const authHeaders = {
        'Content-Type': 'application/json',
        'X-SURF-Client': token
    };

    updateUI(prob);

    function updateUI(prob) {
        document.getElementById('prob-value').innerText = prob + '%';
        const fill = document.getElementById('gauge-fill');
        const level = document.getElementById('risk-level');

        let color = '#eab308';
        let label = 'LOW';

        if (prob >= 70) {
            color = '#ef4444';
            label = 'HIGH';
        } else if (prob >= 40) {
            color = '#f97316';
            label = 'MIDDLE';
        }

        level.innerText = label;
        level.style.color = color;
        document.getElementById('prob-value').style.color = color;
        fill.style.setProperty('--color', color);

        requestAnimationFrame(animateGauge(performance.now(), prob));
    }

    function animateGauge(startTime, targetProb) {
        const duration = 1500;
        const fill = document.getElementById('gauge-fill');

        return function frame(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = targetProb * eased;

            fill.style.setProperty('--percent', current);
            if (progress < 1) requestAnimationFrame(frame);
        };
    }

    // ===== 동의 체크박스 =====
    const check = document.getElementById('agree-check');
    const btnTemp = document.getElementById('btn-temp');
    const btnPerm = document.getElementById('btn-perm');

    check.addEventListener('change', function () {
        const on = this.checked;
        for (const btn of [btnTemp, btnPerm]) {
            btn.classList.toggle('active', on);
            btn.style.cursor = on ? 'pointer' : 'not-allowed';
            btn.disabled = !on;
        }
    });

    // ===== 오탐 신고 =====
    const btnReport = document.getElementById('btn-report');

    btnReport.onclick = async () => {
        btnReport.disabled = true;
        btnReport.innerText = '신고 중...';

        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/report-false-positive`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ domain })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            showStatus('오탐 신고가 접수되었습니다. 분석 후 허용 목록에 반영됩니다.', 'ok');
            btnReport.innerText = '신고 완료';
            btnReport.style.color = '#999';
        } catch (err) {
            console.error('[SURF] 신고 실패:', err);
            showStatus('신고 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'err');
            btnReport.disabled = false;
            btnReport.innerText = '🚨 오탐인가요? 신고하기';
        }
    };

    // ===== 허용 처리 =====
    //
    // 순서가 중요하다. 확장 로컬에 먼저 기록해야 이동 직후 onBeforeNavigate 가
    // 이 도메인을 다시 막아 무한 루프에 빠지는 일이 없다. 서버 등록은 그다음이고,
    // 실패해도 이동은 진행하되 사용자에게 알린다.
    async function sendAllow(mode) {
        if (!check.checked) return;

        btnTemp.disabled = true;
        btnPerm.disabled = true;

        await chrome.runtime.sendMessage({ type: 'surf-allow', domain, mode });

        let serverOk = false;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/allow`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ domain, mode })
            });
            serverOk = res.ok;
        } catch (err) {
            console.error('[SURF] 허용 등록 실패:', err);
        }

        if (serverOk) {
            showStatus(
                mode === 'temp'
                    ? `${domain} 을(를) 30분간 허용했습니다. 이동합니다.`
                    : `${domain} 을(를) 영구 허용했습니다. 이동합니다.`,
                'ok'
            );
        } else {
            showStatus(
                '서버에 허용 상태를 등록하지 못했습니다. 이 브라우저에서만 적용되며, ' +
                'SURF DNS 를 함께 쓰는 중이라면 접속이 계속 막힐 수 있습니다.',
                'err'
            );
        }

        setTimeout(() => {
            window.location.href = `https://${domain}`;
        }, serverOk ? 700 : 2500);
    }

    btnTemp.onclick = () => sendAllow('temp');
    btnPerm.onclick = () => sendAllow('perm');
});
