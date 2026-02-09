# 🧩 SURF
> **AI 기반 실시간 도메인 추론 및 지능형 DNS 차단 솔루션**

[![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

## 1. Summary
본 익스텐션은 **SURF** 시스템의 사용자 인터페이스 모듈입니다. DNS 서버에서 차단된 위협 정보를 브라우저 단에서 감지하여 시각적인 경고를 제공하여 사용자의 PC를 보호합니다.

## 2. 주요 기능 (Key Features)
* **DNS 위협 시각화**: DNS 차단(`NXDOMAIN`) 발생 시 발생 시 서버와 통신하여 AI가 차단한 도메인인지 확인 후 전용 경고 페이지를 출력합니다.
* **사용자 피드백**: 오탐 신고 및 사용자의 판단에 따른 도메인 임시/영구 허용 기능을 제공합니다.

## 3. 설치 방법 (Installation)
1. 본 저장소의 코드를 로컬 환경으로 내려받습니다.
2. **설정 파일 생성**: `config.sample.js`를 복사하여 `config.js`를 생성하고 실제 API 서버 주소를 입력합니다.
3. Chrome 브라우저에서 `chrome://extensions/`로 접속합니다.
4. **개발자 모드**를 활성화한 뒤 **압축해제된 확장 프로그램을 로드** 버튼을 클릭하여 본 폴더를 선택합니다.


## 4. 데이터 및 기술 활용 (Data & Tech)
* **Manifest V3**: 크롬의 최신 규격을 준수하여 서비스 워커 기반의 백그라운드 로직 구현하였습니다.
* **Chrome APIs**: 
    * `chrome.webRequest`: 네트워크 에러 상태 실시간 모니터링.


## 5. 사용자 시나리오 (User Scenario)
1. **차단 시**: 사용자가 악성 사이트 접속 시도 -> DNS 차단 발생 -> 익스텐션이 서버에 차단 사유 조회 -> 위험 확률이 포함된 `blocked.html` 노출.


---
