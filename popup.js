// popup.js
//
// 툴바 아이콘 팝업. SURF 보호를 켜고 끄는 토글만 담당한다.
// 실제 on/off 판단은 background.js 가 chrome.storage.local 의 surf_enabled 값을
// 읽어서 하므로, 여기서는 그 값을 읽고 쓰기만 하면 된다.

const toggle = document.getElementById('toggle');
const statusText = document.getElementById('statusText');
const statusSub = document.getElementById('statusSub');

function render(enabled) {
    toggle.checked = enabled;
    statusText.textContent = enabled ? '보호 켜짐' : '보호 꺼짐';
    statusText.className = `status-text ${enabled ? 'on' : 'off'}`;
    statusSub.textContent = enabled
        ? '악성 도메인 접속을 실시간으로 차단합니다'
        : '접속을 검사하지 않습니다';
}

async function init() {
    const stored = await chrome.storage.local.get('surf_enabled');
    // 키가 아예 없으면(첫 실행) 기본값은 켜짐이다.
    const enabled = stored.surf_enabled !== false;
    render(enabled);
}

toggle.addEventListener('change', async () => {
    const enabled = toggle.checked;
    await chrome.storage.local.set({ surf_enabled: enabled });
    render(enabled);
});

init();
