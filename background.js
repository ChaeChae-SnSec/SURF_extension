import { CONFIG } from './config.js';

chrome.webRequest.onErrorOccurred.addListener(
    async (details) => {
        // 메인 프레임 에러만 감지
        if (details.type === "main_frame" && details.error === "net::ERR_NAME_NOT_RESOLVED") {
            try {
                const url = new URL(details.url);
                const domain = url.hostname;

                // 1. 서버에 확인 요청 (await를 사용하여 결과를 기다림)
                const response = await fetch(`${CONFIG.API_BASE_URL}/check?domain=${domain}`);
                const data = await response.json();

                if (data.result === "surf_blocked") {
                    // 2. 차단 기록이 확실히 있을 때만 업데이트
                    chrome.tabs.update(details.tabId, {
                        url: chrome.runtime.getURL(`blocked.html?domain=${domain}&prob=${data.prob}`)
                    });
                }
            } catch (err) {
                console.error("SURF Check Error:", err);
            }
        }
    },
    { urls: ["<all_urls>"] }
);

// --- 파일 다운로드 AI 검사 로직 ---
chrome.downloads.onCreated.addListener(async (downloadItem) => {
    // 일단 다운로드를 일시정지시켜서 검사 시간을 확보
    chrome.downloads.pause(downloadItem.id);

    const targetUrl = downloadItem.url;
    console.log("AI 분석 시작 (다운로드):", targetUrl);

    try {
        // AI 서버에 해당 URL 검사 요청
        const response = await fetch(`${CONFIG.API_BASE_URL}/check?domain=${new URL(targetUrl).hostname}`);
        const data = await response.json();

        if (data.result === "surf_blocked") {
            // 위험 판정 시: 다운로드 취소 및 차단 페이지 이동
            chrome.downloads.cancel(downloadItem.id);
            console.log("AI 차단 완료:", targetUrl);

            chrome.tabs.create({
                url: chrome.runtime.getURL(`blocked.html?domain=${new URL(targetUrl).hostname}&prob=${data.prob}&type=download`)
            });
        } else {
            // 안전 판정 시: 다운로드 재개
            chrome.downloads.resume(downloadItem.id);
            console.log("AI 검사 통과 (안전)");
        }
    } catch (err) {
        console.error("AI 검사 중 오류 발생 (기본 허용):", err);
        chrome.downloads.resume(downloadItem.id);
    }
});