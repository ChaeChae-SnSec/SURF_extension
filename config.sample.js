// config.sample.js
// 복사해서 config.js 로 만든 뒤 실제 값을 채워 넣으세요. config.js 는 커밋되지 않습니다.
export const CONFIG = {
    // Flask API 주소. 배포 시에는 Cloudflare 터널 도메인(https://api.example.com)을 씁니다.
    API_BASE_URL: "https://YOUR_API_DOMAIN",

    // 단독 모드: DNS 설정 없이 확장이 직접 도메인을 검사합니다.
    // 발표에서 DNS 계층만으로 차단되는 장면을 보여줄 때는 false 로 끄세요.
    PROACTIVE: true,

    // 다운로드 URL 검사. manifest 에 "downloads" 권한을 추가해야 동작합니다.
    // 웹스토어 v1 제출에서는 심사 표면을 줄이려고 꺼둡니다.
    ENABLE_DOWNLOAD_SCAN: false,

    // 이 기기를 식별하는 토큰. 비워두면 설치 시 자동 생성됩니다.
    // DoH 를 함께 쓰는 기기는 DoH URL 의 ?c= 값과 반드시 같아야 합니다.
    CLIENT_TOKEN: ""
};
