// config.sample.js
export const CONFIG = {
    // Flask API 주소.
    API_BASE_URL: "https://YOUR_API_DOMAIN",

    // 단독 모드: DNS 설정 없이 확장이 직접 도메인을 검사합니다.
    // 발표에서 DNS 계층만으로 차단되는 장면을 보여줄 때는 false 로 끄세요.
    PROACTIVE: true,

    // 이 기기를 식별하는 토큰. 비워두면 설치 시 자동 생성됩니다.
    // DoH 를 함께 쓰는 기기는 DoH URL 의 ?c= 값과 반드시 같아야 합니다.
    CLIENT_TOKEN: ""
};
