# 랜덤뽑기

결과는 랜덤, 방식은 마음대로.

- 운영 주소: https://random-ppobgi.pages.dev/
- 현재 버전: v50
- 실제 코드 저장소: `gsh4124-cyber/random-ppobgi`
- 현재 기술상태 원본: `PROJECT_STATUS.md`
- ChatGPT 실행창: `랜덤뽑기 본부`

## 표준 로컬 위치

`C:/Users/gsh41/Desktop/황제/자동 사업운영/바이브코딩/페이지형/random-ppobgi`

이 저장소는 랜덤뽑기 제품의 실제 코드와 기술상태를 관리합니다. 사업상 장기 상태와 Gate는 `gsh4124-cyber/hwangje-vault`의 바이브코딩 Canonical을 따릅니다.

## 제품

한국어 포함 17개 언어에서 동일한 코어를 사용합니다. 사다리, 룰렛, 제비, 핀볼, 경주, 캡슐, 슬롯, 폭탄의 8가지 뽑기 게임과 5종 게임 도구를 제공합니다.

해외 언어 URL은 Cloudflare Pages Function이 루트의 동일한 완제품 자산을 edge에서 직접 응답하고 공통 현지화 런타임을 적용합니다. `full-app-loader.js`는 정적 route shell의 fallback일 뿐 production 기본 경로가 아닙니다.

## 개인정보 처리

입력한 이름, 번호, 직접 입력 결과와 당첨 내용은 브라우저 안에서만 처리하며 서버에 저장하지 않습니다. 제품 개선을 위한 익명 핵심행동 합계만 집계합니다.
