# PROJECT STATUS — DEVICE CHECKUP

- 마지막 갱신: 2026-09-29
- 저장소 역할: DEVICE CHECKUP 실제 코드·배포·기술상태 원본
- 저장소: `gsh4124-cyber/pc-checkup` (public)
- 현재 운영 주소: `https://pc-checkup.pages.dev/`
- 상위 사업상태: 황제 Vault `직장/바이브코딩/_INDEX.md`, `직장/바이브코딩/페이지형/_INDEX.md`

## 현재 단계

**PUBLIC PRODUCTION / GLOBAL 13-LANGUAGE DEPLOYED / ADSENSE_REVIEW_SUBMITTED / HUMAN LAPTOP QA APPROVED / CURRENT-REVISION PRODUCTION BROWSER QA PASS / AGGREGATE PRODUCT TELEMETRY ACTIVE / SEARCH ACCOUNT STATE PARTIAL-UNVERIFIED**

> 구현 완료 ≠ 정적 QA PASS ≠ 공개 배포 ≠ Production Browser QA PASS ≠ 실제 색인·유입 ≠ 시장 성공

## 제품 범위

PC:
- 키보드
- 마우스
- 모니터
- 스피커·헤드폰
- 마이크
- 웹캠
- 5분 전체점검
- 점검 결과 요약·복사·공유
- 브라우저 밖 수동 점검 체크리스트

휴대폰:
- 터치·멀티터치
- 화면 색상·불량화소
- 전·후면 카메라
- 마이크
- 스피커
- 진동·화면회전
- 결과/진행률 저장
- 다음 미확인 검사 이동
- 점검 결과 요약·복사·공유
- 브라우저 밖 수동 점검 체크리스트

공통 운영:
- legacy `gsh4124-cyber.github.io/pc-checkup/...` DEVICE CHECKUP 경로는 현재 Cloudflare Production으로 연결한다.
- `pc_start / mobile_start / pc_complete / mobile_complete` aggregate 제품 이벤트를 수집한다.
- 이벤트는 제품 사용 흐름 판단용 집계이며 사용자 이름·입력내용·사용자 ID를 수집하지 않고 webdriver 자동 QA는 제외한다.

핵심 판정 원칙:
- 브라우저가 신뢰성 있게 관찰할 수 있는 신호만 자동 판정한다.
- 화면 결함·실제 청취·진동 체감·카메라 화질처럼 사람 감각이 필요한 항목은 수동 판정을 유지한다.
- 권한 거부·브라우저 미지원만으로 하드웨어 고장을 판정하지 않는다.
- **브라우저가 볼 수 없는 것을 고장으로 판정하지 않는다.**

## 글로벌 배포

지원 언어:
`ko / en / ja / es / de / fr / pt / it / nl / id / vi / zh-CN / ru`

총 **13개 언어 × 9개 기능 페이지 = 117 indexable URL**.

검색 기본 구조:
- canonical
- hreflang
- x-default
- Open Graph / Twitter
- JSON-LD WebApplication
- sitemap.xml
- robots.txt

현재 production origin은 **Cloudflare Pages**다.

과거 GitHub Pages 기반 배포·QA 기록은 역사적 기준선이며 현재 production origin으로 복원하지 않는다.

## 자동 QA / Production QA

배포 artifact 기준으로 다음을 검사한다.
- 117 HTML / 117 sitemap URL / 13 locale 존재
- 내부 href/src 누락
- duplicate id
- canonical / hreflang / x-default
- 비한국어 raw Korean leakage
- JavaScript syntax
- 키보드 구조 invariant
- 예상하지 않은 외부 전송 / 네트워크 origin
- 대표 locale 모바일 레이아웃 / horizontal overflow
- 언어 선택기 중복·회귀
- 현재 공개 revision과 검사 revision 일치
- PC/휴대폰 결과 요약 UI, 모바일 다음 미확인 검사, legacy redirect

Production Browser Smoke는 공개 revision을 확인한 뒤 Chromium / Firefox / WebKit으로 실제 production을 검사한다.

### 2026-09-29 DEVICE CHECKUP 경험 개선 및 pretty URL 복구

추가한 경험 개선:
- PC·휴대폰 점검 결과 요약
- 결과 복사·공유
- 휴대폰 `다음 미확인 검사로 이동`
- 브라우저 밖 수동 점검 체크리스트
- legacy GitHub Pages DEVICE CHECKUP 경로 → Cloudflare Production 연결
- 개인정보 없는 aggregate 제품 telemetry

중간 Production QA에서 Chromium이 `PC result summary missing`으로 실패했다. 기존 117 URL·레이아웃·헤더 검사는 PASS했고, 새 경험 카드 검사에서만 실패했다.

ROOT_CAUSE_FIRST 결과:
- `FAIL_EVIDENCE`: exact-revision Production Browser Smoke에서 기존 사이트 검사는 PASS했지만 새 PC 결과 요약 카드가 탐지되지 않음.
- `ROOT_CAUSE`: Cloudflare가 `.html` 경로를 pretty URL 형태(`/checkup`, `/mobile`)로 정규화할 수 있는데, 새 shared runtime의 초기화 라우팅이 `checkup.html / mobile.html`만 정확히 비교해 초기화를 건너뜀.
- `PRESERVE`: 기존 하드웨어 검사·13개 언어·117 URL·검색/AdSense 구조·자동판정 원칙.
- `CHANGE_SCOPE`: `device-experience.js`의 페이지 라우팅 판별을 `.html` 유무 양쪽을 허용하도록 최소 수정. 배포 artifact의 shared runtime에는 revision query를 붙여 stale asset 재사용도 방지.
- `PASS_CRITERIA`: 동일 experience revision에서 Deploy/Guardrails 및 Chromium·Firefox·WebKit Production Browser QA가 모두 PASS하고 새 experience smoke까지 통과.

verified experience revision:
`94cd479128016bc475e30883d6eb69a7230b6631`

같은 revision 결과:
- Deploy DEVICE CHECKUP #253: **SUCCESS**
- Security Guardrails #94: **SUCCESS**
- Production Browser Smoke #246: **SUCCESS**
  - Chromium: **SUCCESS**
  - Firefox: **SUCCESS**
  - WebKit: **SUCCESS**

따라서 이번 경험 개선과 `PC result summary missing` 회귀는 **RECOVERED / CURRENT-REVISION PRODUCTION BROWSER QA PASS**로 닫는다.

### 2026-09-13 AdSense RUM pageerror 오탐 복구

`cc1d26338a7ca0b8748d536dba842794bc718296`에서 Chromium만 `Uncaught Error: int64`로 반복 실패했고, 회수한 stack의 모든 frame이 `https://pagead2.googlesyndication.com/.../rum.js`에 있었다. Firefox와 WebKit은 같은 identity에서 PASS했고 제품 코드 frame은 확인되지 않았다.

ROOT_CAUSE_FIRST 결과:
- `FAIL_EVIDENCE`: Production Browser Smoke #105 Chromium 실패, 동일 실행 Firefox/WebKit PASS, stack 전체가 AdSense `rum.js`.
- `ROOT_CAUSE`: 제품 회귀가 아니라 제3자 AdSense RUM 예외를 출처 구분 없이 제품 pageerror로 처리한 QA 경계 문제.
- `PRESERVE`: 제품 동작, 하드웨어 검사 로직, locale, 외부-origin allowlist, 미확인/제품-origin pageerror fail-closed.
- `CHANGE_SCOPE`: `tools/production-smoke.mjs`의 pageerror 분류만 수정.
- `EXPECTED_MECHANISM`: 정확히 `int64 + pagead2.googlesyndication.com + /rum.js + product frame 없음`인 경우만 third-party noise로 분류.
- `PASS_CRITERIA`: 그 서명만 제외하면서 다른 pageerror/외부-origin guard는 유지하고, 같은 repair identity의 Security Guardrails와 3-engine Production Browser Smoke가 성공.

repair commit `cf393ccaad11792d01434947b8c867cfe6b24347`에서 위 exact source-bound 분류만 추가했다. Google 도메인 전체, message-only 매칭은 추가하지 않았다.

같은 SHA 결과:
- Security Guardrails #10: **SUCCESS**
- Deploy workflow #173: **SUCCESS**
- Production Browser Smoke #107: **SUCCESS**
  - Chromium: **SUCCESS**
  - Firefox: **SUCCESS**
  - WebKit: **SUCCESS**

따라서 이 회귀는 **RECOVERED**로 닫는다.

### 2026-09-15 Google CSP reporting origin 복구

Production Browser Smoke #112에서 production `8f6ed2918ba0343095f355094a802f67e34869a0`의 `/ru/`가 `https://csp.withgoogle.com`을 예상하지 않은 외부 origin으로 관찰해 실패했다. 이 origin은 이전에도 일시적으로 관찰됐고, Google의 CSP reporting endpoint로 source attribution이 확인됐다.

ROOT_CAUSE_FIRST 결과:
- `FAIL_EVIDENCE`: Production Browser Smoke #112의 unexpected external origin `https://csp.withgoogle.com`.
- `ROOT_CAUSE`: 제품 런타임 회귀가 아니라 승인된 Google 연동의 CSP reporting endpoint가 production smoke allowlist에 빠진 QA 경계 불일치.
- `PRESERVE`: 제품 runtime/하드웨어 검사/locale/AdSense 설정, 미확인 외부 origin fail-closed, 기존 pageerror fail-closed.
- `CHANGE_SCOPE`: `tools/production-smoke.mjs` 외부-origin allowlist에 정확히 `https://csp.withgoogle.com` 하나만 추가.
- `EXPECTED_MECHANISM`: 승인된 Google CSP reporting 요청만 허용하면서 다른 미확인 외부 origin은 계속 실패시킨다.
- `PASS_CRITERIA`: 같은 repair identity에서 Security Guardrails와 Chromium/Firefox/WebKit Production Browser Smoke가 모두 PASS.

repair commit `991fe19cb604b44cf1004a38615de6cc48f38296`에서 정확히 해당 origin 하나만 추가했다.

같은 SHA 결과:
- Security Guardrails #12: **SUCCESS**
- Production Browser Smoke #113: **SUCCESS**
  - Chromium: **SUCCESS**
  - Firefox: **SUCCESS**
  - WebKit: **SUCCESS**

따라서 이 회귀는 **RECOVERED**로 닫는다.

## 키보드 / Fn 재발방지 핵심

- Shift / Ctrl / Alt / Meta modifier 판별: `event.code → event.location → 최소 fallback`
- Fn은 독립 고장검사가 아니라 **Fn 조합 확인** 보조기능
- Fn 전후 브라우저 이벤트가 같으면 `웹에서 판정 불가`; 고장으로 표현하지 않음
- modifier evidence는 `direct / assisted` 구분
- 한쪽을 직접 확인하지 않은 상태에서 좌우를 임의 추정하지 않음
- native/브라우저가 제공하지 않는 신호를 억지로 판정하지 않음

글로벌 생성 과정에서 UI 번역이 JS 함수명·DOM id·표준 key code까지 바꾸던 회귀가 있었고, 현재는 생성 후 canonical 동작구조 복원 + artifact validator로 재발을 막는다.

## 인간 체감 QA — 완료 상태

황제가 **실제 노트북에서 DEVICE CHECKUP을 직접 점검하고 승인한 뒤 공개**했다. 이 검수로 기존 제품의 인간 체감 QA는 완료된 것으로 고정한다.

2026-09-29 추가한 결과 요약·공유·모바일 다음 검사·수동 체크리스트는 실제 Cloudflare Production Browser QA로 검증했다. 실제 Android/iPhone 물리기기의 터치감·native share 동작을 새로 검증했다고 주장하지 않는다. 사용자에게 반복 기기 Gate를 요구하지 않으며, 실제 사용 중 구체적 문제가 보고될 때만 해당 증거를 기준으로 다시 연다.

## AdSense 실행 상태

`ADSENSE_REVIEW_SUBMITTED`

- AdSense 사이트 추가 완료
- 공식 AdSense 코드 반영 완료
- `ads.txt` 반영 완료
- Production 소유확인 통과
- 검토 요청 제출 완료
- 자동 광고는 인페이지 중심
- 앵커·사이드레일·모바일 전면광고 비활성화
- 개별 검사 페이지와 fullscreen 검사 화면에는 광고를 두지 않는 원칙 유지
- `ads.txt` 재탐색/심사 결과는 외부 대기

승인 완료나 광고수익 발생으로 승격하지 않는다.

## 검색 유통 상태

제품 코드 측면의 117 URL sitemap 구조, robots.txt, Cloudflare production origin, 검색 메타데이터는 준비돼 있다.

검색엔진 등록 중앙 Canonical:
`황제 Vault 직장/바이브코딩/페이지형/검색엔진_등록_상태.md`

현재 판정:
`SEARCH_ENGINE_FINAL_ACCOUNT_STATE_UNVERIFIED`

등록 ≠ sitemap 제출 ≠ 크롤링 ≠ 색인 ≠ 노출 ≠ 실제 유입.

## 현재 판정

- 구현: PASS
- 글로벌 빌드: PASS
- Cloudflare production 배포: PASS
- 정적/Artifact QA: **PASS**
- Red Team: **PASS WITH FIXES**
- current-revision Production Browser QA: **PASS** (`94cd4791...`, run #246)
- Security Guardrails: **PASS** (`94cd4791...`, run #94)
- Deploy workflow: **PASS** (`94cd4791...`, run #253)
- 경험 개선: **PASS — 결과 요약·복사·공유 / 모바일 다음 검사 / 수동 체크리스트 / legacy 연결**
- aggregate telemetry: **CONFIGURED — pc/mobile start/complete, webdriver excluded**
- 인간 체감 QA: **기존 노트북 QA APPROVED / 새 물리기기 체감은 별도 주장 안 함**
- AdSense: **REVIEW SUBMITTED / 외부 결과 대기**
- 검색엔진 최종 계정 등록상태: UNVERIFIED
- 실제 색인·유입·시장성: UNVERIFIED

## 다음 Gate

1. 실제 aggregate 사용신호 변화 관찰
2. AdSense 심사 결과와 `ads.txt` 상태 관찰
3. 검색 색인·노출·실제 유입 관찰
4. Production/CI 자동관제 지속
5. 새 기술 FAIL이나 실제 기기 문제 보고가 있을 때만 ROOT_CAUSE_FIRST로 재개

> **현재 제품은 추가 기능을 만들기 위해 계속 열어두는 단계가 아니라, 개선된 공개 제품의 실제 사용·검색·수익화 증거를 기다리는 단계다.**
