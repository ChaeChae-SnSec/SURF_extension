// whitelist.js
// 확장에 내장하는 정적 허용 목록.
//
// 이 목록에 걸리는 도메인은 서버로 나가지 않는다. 세 가지를 동시에 얻으려는 것이다.
//   1) 응답 속도  - 왕복이 없으니 즉시 통과
//   2) 서버 부하  - 파일럿 기간 동안 노트북 한 대가 감당해야 할 요청이 크게 준다
//   3) 프라이버시 - 흔한 사이트 방문 기록은 애초에 서버에 남지 않는다
//
// 접미사 매칭이다. "google.com" 항목은 "mail.google.com" 도 함께 통과시킨다.
// 운영하며 오탐이 나온 도메인을 여기에 추가하는 것이 가장 값싼 대응이다.
// 규모를 키우려면 Tranco 상위 목록에서 생성해 붙이면 된다.

export const STATIC_ALLOWLIST = [
    // --- 검색 · 포털 (국내) ---
    "naver.com", "naver.net", "pstatic.net", "navercorp.com",
    "daum.net", "kakao.com", "kakaocdn.net", "daumcdn.net",
    "nate.com", "zum.com",

    // --- 검색 · 포털 (해외) ---
    "google.com", "google.co.kr", "googleapis.com", "gstatic.com",
    "googleusercontent.com", "googlevideo.com", "google-analytics.com",
    "googletagmanager.com", "googlesyndication.com", "doubleclick.net",
    "youtube.com", "ytimg.com", "youtu.be",
    "bing.com", "duckduckgo.com", "yahoo.com", "baidu.com",

    // --- 소셜 · 메신저 ---
    "facebook.com", "fbcdn.net", "instagram.com", "cdninstagram.com",
    "twitter.com", "x.com", "twimg.com", "threads.net",
    "linkedin.com", "licdn.com", "reddit.com", "redd.it", "redditstatic.com",
    "discord.com", "discordapp.com", "discord.gg",
    "telegram.org", "t.me", "whatsapp.com", "slack.com", "slack-edge.com",
    "line.me", "pinterest.com", "tiktok.com", "tiktokcdn.com",

    // --- 개발 · 업무 ---
    "github.com", "githubusercontent.com", "githubassets.com", "github.io",
    "gitlab.com", "bitbucket.org", "stackoverflow.com", "stackexchange.com",
    "sstatic.net", "npmjs.com", "npmjs.org", "pypi.org", "pythonhosted.org",
    "docker.com", "docker.io", "jsdelivr.net", "unpkg.com", "cdnjs.com",
    "jquery.com", "bootstrapcdn.com", "fontawesome.com",
    "huggingface.co", "kaggle.com", "colab.research.google.com",
    "notion.so", "notion.site", "atlassian.net", "jira.com",
    "figma.com", "canva.com", "zoom.us", "webex.com",

    // --- 마이크로소프트 · 윈도우 ---
    "microsoft.com", "windows.com", "windowsupdate.com", "microsoftonline.com",
    "office.com", "office365.com", "officeppe.com", "live.com", "outlook.com",
    "msn.com", "azure.com", "azureedge.net", "sharepoint.com",
    "msftconnecttest.com", "msftncsi.com", "skype.com", "bing.net",
    "trafficmanager.net", "ax-msedge.net", "onedrive.com",

    // --- 애플 · 안드로이드 ---
    "apple.com", "icloud.com", "mzstatic.com", "cdn-apple.com",
    "android.com", "googleplay.com", "gvt1.com", "gvt2.com",

    // --- CDN · 인프라 ---
    "akamai.net", "akamaized.net", "akamaiedge.net", "edgekey.net",
    "edgesuite.net", "fastly.net", "fastlylb.net",
    "cloudflare.com", "cloudflare.net", "cloudflareinsights.com",
    "cloudfront.net", "amazonaws.com", "awsstatic.com",
    "cloudinary.com", "imgix.net", "vercel.app", "netlify.app",
    "herokuapp.com", "firebaseio.com", "firebaseapp.com",

    // --- 인증서 · 시간 동기화 (차단되면 브라우징 자체가 깨진다) ---
    "lencr.org", "letsencrypt.org", "pki.goog", "digicert.com",
    "globalsign.com", "sectigo.com", "usertrust.com", "godaddy.com",
    "entrust.net", "amazontrust.com", "ocsp.apple.com",
    "nist.gov", "pool.ntp.org", "ntp.org",

    // --- 쇼핑 · 금융 (국내) ---
    "coupang.com", "coupangcdn.com", "11st.co.kr", "gmarket.co.kr",
    "auction.co.kr", "ssg.com", "lotteon.com", "musinsa.com",
    "toss.im", "tosspayments.com", "kakaopay.com", "naverpay.com",
    "shinhan.com", "kbstar.com", "wooribank.com", "hanabank.com",
    "nonghyup.com", "ibk.co.kr", "kftc.or.kr",

    // --- 쇼핑 · 결제 (해외) ---
    "amazon.com", "amazon.co.kr", "ebay.com", "aliexpress.com",
    "paypal.com", "stripe.com", "visa.com", "mastercard.com",

    // --- 미디어 · 스트리밍 ---
    "netflix.com", "nflxvideo.net", "nflximg.net",
    "spotify.com", "scdn.co", "twitch.tv", "ttvnw.net",
    "melon.com", "genie.co.kr", "flo.co.kr", "watcha.com", "tving.com",
    "wavve.com", "disneyplus.com",

    // --- 뉴스 · 학술 · 공공 ---
    "wikipedia.org", "wikimedia.org", "wiktionary.org",
    "yna.co.kr", "chosun.com", "joongang.co.kr", "hani.co.kr",
    "donga.com", "khan.co.kr", "mk.co.kr", "hankyung.com",
    "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "reuters.com",
    "arxiv.org", "doi.org", "springer.com", "elsevier.com",
    "ieee.org", "acm.org", "nature.com", "sciencedirect.com",
    "scholar.google.com", "researchgate.net", "semanticscholar.org",
    "go.kr", "or.kr", "re.kr", "ac.kr",

    // --- 보안 벤더 (업데이트가 막히면 안 된다) ---
    "mcafee.com", "mcafee.net", "ahnlab.com", "v3.co.kr",
    "kaspersky.com", "avast.com", "norton.com", "symantec.com",
    "virustotal.com",

    // --- AI 서비스 ---
    "openai.com", "chatgpt.com", "oaistatic.com",
    "anthropic.com", "claude.ai", "gemini.google.com",
    "perplexity.ai", "midjourney.com"
];

// 접미사 매칭. "a.b.google.com" 은 "google.com" 항목에 걸린다.
// 부분 문자열 사고(예: "notgoogle.com")를 막으려고 경계에 점을 요구한다.
export function isAllowlisted(domain) {
    for (const entry of STATIC_ALLOWLIST) {
        if (domain === entry || domain.endsWith("." + entry)) return true;
    }
    return false;
}
