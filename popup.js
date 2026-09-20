// popup.js
//
// 툴바 아이콘 팝업. 두 가지를 켜고 끈다.
//   보호 켜짐/꺼짐   전체 검사를 완전히 멈춘다.
//   단독 모드         페이지 이동 직전 즉석 판별(/predict) 여부. 꺼도 DNS 계층
//                   차단은 그대로 동작한다 (webRequest 리스너는 항상 켜져있음).
//
// 실제 판단은 background.js 가 하므로, 여기서는 chrome.storage.local 값만 읽고 쓴다.
// 초기값(첫 실행)은 background.js 의 surf-get-settings 응답으로 받는다
// — config.js 의 기본값과 로직이 중복되지 않게 하기 위함이다.

const toggle = document.getElementById('toggle');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');

const proactiveRow = document.getElementById('proactiveRow');
const proactiveSub = document.getElementById('proactiveSub');
const modeSegmented = document.getElementById('modeSegmented');
const segProactive = document.getElementById('segProactive');
const segDns = document.getElementById('segDns');

function renderEnabled(enabled) {
    toggle.checked = enabled;
    statusText.textContent = enabled ? '보호 켜짐' : '보호 꺼짐';
    statusText.className = `status-text ${enabled ? 'on' : 'off'}`;
    statusSub.textContent = enabled
        ? '악성 도메인 접속을 실시간으로 차단합니다'
        : '접속을 검사하지 않습니다';

    // 보호가 꺼지면 모드 선택도 의미가 없어지니 흐리게 표시하고 못 누르게 함.
    proactiveRow.classList.toggle('disabled', !enabled);
    segProactive.disabled = !enabled;
    segDns.disabled = !enabled;
}

let currentProactive = true;

function renderProactive(proactive) {
    currentProactive = proactive;
    segProactive.classList.toggle('active', proactive);
    segDns.classList.toggle('active', !proactive);
    proactiveSub.textContent = proactive
        ? '페이지 이동 전에 미리 검사합니다'
        : 'DNS 차단에만 의존합니다';
}

async function setProactive(proactive) {
    await chrome.storage.local.set({ surf_proactive: proactive });
    renderProactive(proactive);
}

async function init() {
    const { enabled, proactive } = await chrome.runtime.sendMessage({ type: 'surf-get-settings' });
    renderEnabled(enabled);
    renderProactive(proactive);
}

toggle.addEventListener('change', async () => {
    const enabled = toggle.checked;
    await chrome.storage.local.set({ surf_enabled: enabled });
    renderEnabled(enabled);
});

modeSegmented.addEventListener('click', () => {
    if (segProactive.disabled) return;
    setProactive(!currentProactive);
});

init();
