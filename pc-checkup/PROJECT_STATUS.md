# PROJECT STATUS — DEVICE CHECKUP

- 마지막 기술상태 갱신: 2026-10-04
- 저장소 역할: `gsh4124-cyber/page-tools`의 `main / pc-checkup/`가 DEVICE CHECKUP 실제 코드·배포·기술상태 원본
- 상위 사업구조: 황제 Vault `직장/바이브코딩/_INDEX.md`, `직장/바이브코딩/페이지형/_INDEX.md`
- 빠르게 변하는 운영상태·Portfolio Mode·Gate·다음 행동: Supabase `hwangje_ops` / project key `vibecoding`
- 로컬 checkout 경로: 환경별로 다를 수 있으며 Canonical로 고정하지 않음. 작업 시 `page-tools/main`의 실제 checkout 위치를 확인
- 운영 주소: https://pc-checkup.pages.dev/

## 현재 단계

**S-DESIGN / PUBLIC PRODUCTION / GLOBAL 13-LANGUAGE DEPLOYED / HUMAN LAPTOP QA APPROVED / PRODUCTION BROWSER QA EVIDENCE / AGGREGATE PRODUCT TELEMETRY ACTIVE / SEARCH ACCOUNT STATE PARTIAL-UNVERIFIED / ADSENSE_REVIEW_SUBMITTED**

`S-DESIGN`은 현재 제품의 기술·QA·운영경계·복구구조가 S급 설계기준으로 닫혔다는 뜻이다. 실제 외부사용·검색노출·수익에서 반복 시장증거가 확인됐다는 뜻이 아니며 그 전에는 `S-VERIFIED`로 승격하지 않는다.

현재 Portfolio Mode와 다음 행동은 Supabase live-state에서 회수한다. 실제 기술 FAIL이나 의미 있는 외부 신호 없이 새 기능개발·실기기 Gate·깊은 QA를 반복하지 않는다.

> 구현 완료 ≠ 정적 QA PASS ≠ 공개 배포 ≠ Production Browser QA PASS ≠ 실제 색인·유입 ≠ 시장 성공

## 2026-10-04 S-DESIGN 회귀검수

- DEVICE CHECKUP 전용 CI의 기준 브랜치를 폐기된 migration branch에서 현행 `main`으로 정정하고 `pull_request`도 `main` 기준으로 맞췄다.
- 수정 직후 `main`에서 전용 QA가 실제 자동기동됐고 Source Guardrails / Build + Artifact QA / Combined Quality Gate가 모두 SUCCESS했다.
- 현행 Source Guardrails는 보안 guardrail, JavaScript/Python 문법, 필수 source file을 검사한다.
- 현행 Build + Artifact QA는 localized site를 실제 빌드하고 artifact, 언어/UI coverage, standalone demo packageability를 검사한다.
- 과거 검증된 사용자경험 revision에서는 Cloudflare Production Browser QA가 Chromium / Firefox / WebKit 3엔진 모두 PASS했고 실제 노트북 Human QA 승인도 기록돼 있다.
- 현재 GitHub repo만으로 Cloudflare 최신 배포 revision과 최신 `main`의 정확한 동일성을 직접 증명할 수 없는 경우 이를 추정으로 승격하지 않는다. 최신 배포 identity가 다음 판단에 필요하면 Cloudflare/실서비스 배포 원본에서 별도 readback한다.
- 이 정합화는 새 시장검증을 의미하지 않는다. 실제 외부사용·검색노출·수익 상태는 live state와 현실 readback을 별도로 본다.

## 제품 범위

PC: 키보드 / 마우스 / 모니터 / 스피커·헤드폰 / 마이크 / 웹캠 / 5분 전체점검 / 결과 요약·복사·공유 / 브라우저 밖 수동 점검 체크리스트.

휴대폰: 터치·멀티터치 / 화면 색상·불량화소 / 전·후면 카메라 / 마이크 / 스피커 / 진동·화면회전 / 결과·진행률 저장 / 다음 미확인 검사 이동 / 결과 요약·복사·공유 / 브라우저 밖 수동 점검 체크리스트.

핵심 판정 원칙:
- 브라우저가 신뢰성 있게 관찰할 수 있는 신호만 자동 판정한다.
- 화면 결함·실제 청취·진동 체감·카메라 화질처럼 사람 감각이 필요한 항목은 수동 판정을 유지한다.
- 권한 거부·브라우저 미지원만으로 하드웨어 고장을 판정하지 않는다.
- **브라우저가 볼 수 없는 것을 고장으로 판정하지 않는다.**

## 글로벌 배포

지원 언어: `ko / en / ja / es / de / fr / pt / it / nl / id / vi / zh-CN / ru`.

총 **13개 언어 × 9개 기능 페이지 = 117 indexable URL**. canonical / hreflang / x-default / Open Graph / Twitter / JSON-LD WebApplication / sitemap.xml / robots.txt 구조를 유지한다. 현재 production origin은 Cloudflare Pages다.

## 검증된 사용자경험 기준선 — 2026-09-29

verified experience revision: `94cd479128016bc475e30883d6eb69a7230b6631`

같은 revision 결과:
- Deploy DEVICE CHECKUP #253: **SUCCESS**
- Security Guardrails #94: **SUCCESS**
- Production Browser Smoke #246: **SUCCESS** — Chromium / Firefox / WebKit 모두 SUCCESS

이 기준선에서 PC·휴대폰 점검 결과 요약, 결과 복사·공유, 휴대폰 다음 미확인 검사 이동, 브라우저 밖 수동 점검 체크리스트, legacy GitHub Pages 경로→Cloudflare 연결, 개인정보 없는 aggregate telemetry가 검증됐다.

과거 `PC result summary missing` 회귀는 Cloudflare pretty URL(`/checkup`, `/mobile`)과 `.html`만 비교하던 초기화 라우팅 불일치가 원인이었고, 양쪽을 허용하는 최소수정과 stale asset 방지 후 같은 revision 3엔진 Production Browser QA PASS로 닫혔다.

## 외부 서비스/QA 경계 재발방지

- AdSense RUM의 정확한 `int64 + pagead2.googlesyndication.com + /rum.js + product frame 없음` 서명만 제3자 noise로 분리한다. Google 도메인 전체나 message-only 예외로 넓히지 않는다.
- 승인된 Google CSP reporting endpoint `https://csp.withgoogle.com`만 source attribution 근거로 허용한다. 다른 미확인 외부 origin은 계속 fail-closed한다.
- 제품 코드 frame이 있거나 출처가 불명확한 pageerror는 제품 실패로 다룬다.

## 키보드 / Fn 재발방지 핵심

- Shift / Ctrl / Alt / Meta modifier 판별: `event.code → event.location → 최소 fallback`
- Fn은 독립 고장검사가 아니라 Fn 조합 확인 보조기능
- Fn 전후 브라우저 이벤트가 같으면 `웹에서 판정 불가`; 고장으로 표현하지 않음
- modifier evidence는 `direct / assisted` 구분
- 한쪽을 직접 확인하지 않은 상태에서 좌우를 임의 추정하지 않음
- native/브라우저가 제공하지 않는 신호를 억지로 판정하지 않음

글로벌 생성 과정에서 UI 번역이 JS 함수명·DOM id·표준 key code까지 바꾸던 회귀는 생성 후 canonical 동작구조 복원 + artifact validator로 막는다.

## 인간 체감 QA

황제가 실제 노트북에서 DEVICE CHECKUP을 직접 점검하고 승인한 뒤 공개했다. 기존 제품의 인간 체감 QA는 완료된 것으로 고정한다.

실제 Android/iPhone 물리기기의 터치감·native share 동작을 새로 검증했다고 주장하지 않는다. 실제 사용 중 구체적 문제가 보고될 때만 해당 증거를 기준으로 다시 연다.

## 개인정보·telemetry

핵심 aggregate 이벤트: `pc_start / mobile_start / pc_complete / mobile_complete`.

제품 사용 흐름 판단용 집계이며 사용자 이름·입력내용·사용자 ID를 수집하지 않고 webdriver 자동 QA는 제외한다. 운영 판단에 필요한 current snapshot·stale 여부·다음 행동은 Supabase `hwangje_ops`에서 회수한다.

## 검색 유통 / AdSense

제품 코드 측면의 117 URL sitemap 구조, robots.txt, Cloudflare production origin, 검색 메타데이터는 준비돼 있다. 검색엔진 등록 중앙 Canonical은 황제 Vault `직장/바이브코딩/페이지형/검색엔진_등록_상태.md`가 소유한다.

현재 검색 판정: `SEARCH_ENGINE_FINAL_ACCOUNT_STATE_UNVERIFIED`.

등록 ≠ sitemap 제출 ≠ 크롤링 ≠ 색인 ≠ 노출 ≠ 실제 유입.

AdSense 장기 상태: `ADSENSE_REVIEW_SUBMITTED`. 승인 완료나 광고수익 발생으로 승격하지 않는다. 최신 심사·`ads.txt` 상태는 실제 AdSense/live-state에서 확인한다.

## 실패분류와 최소복구

- `SOURCE_FAIL(원본 실패)` — 기술 원본/브랜치/경로 드리프트
- `BUILD_FAIL(빌드 실패)` — 글로벌 산출물 생성 실패
- `ARTIFACT_FAIL(산출물 실패)` — locale/URL/SEO/구조 계약 실패
- `SECURITY_FAIL(보안 실패)` — secret·민감파일·예상외 전송 경계 실패
- `DEVICE_LOGIC_FAIL(기기판정 실패)` — 브라우저가 알 수 없는 것을 고장으로 오판하거나 검사 로직 회귀
- `PRODUCTION_BROWSER_FAIL(실서비스 브라우저 실패)`
- `THIRD_PARTY_BOUNDARY_FAIL(제3자 경계 실패)`
- `DELIVERY_IDENTITY_FAIL(배포 동일성 실패)`
- `TELEMETRY_FAIL(계측 실패)`
- `SEARCH_STATE_FAIL(검색상태 실패)`
- `ADSENSE_STATE_FAIL(광고상태 실패)`
- `INSUFFICIENT_MARKET_EVIDENCE(시장증거 부족)`

복구:
> **실패층 특정 → 가장 가까운 원인만 수정 → 보존해야 할 정상층을 명시 → 영향받는 QA만 재실행 → 실제 production 또는 외부상태를 필요한 범위에서 재확인**

제품 로직 실패를 광고·검색 문제로 오판하지 않고, 검색·AdSense 대기를 제품 개발 실패로 오판하지 않는다.

## 현재 다음 Gate

구체 현재 Gate·우선순위는 Supabase live-state를 회수한다. 장기 판단기준은 다음과 같다.

1. 실제 외부 `pc_start/mobile_start → pc_complete/mobile_complete` 사용신호 관찰
2. 실제 검색 색인·노출·유입 변화 관찰
3. AdSense 심사와 `ads.txt` 상태 관찰
4. Production/CI에 실제 FAIL이 발생하면 원인분리 후 최소복구
5. 새 UX 변경 또는 실제 사용 증거가 생길 때만 물리기기 Gate 재개
6. 최신 배포 identity가 의사결정에 필요할 때만 Cloudflare 원본에서 별도 readback

> **현재 제품은 더 만드는 단계보다 외부 사용·검색·수익화 증거를 기다리는 단계다. 활동량을 만들기 위해 닫힌 기술 Gate를 반복해서 열지 않는다.**

## S-DESIGN 판정

DEVICE CHECKUP이 `S-DESIGN(S급 설계완료)`이라는 뜻은:

> **현행 `page-tools/main/pc-checkup`을 기술 원본으로 잠그고 → source·build·117개 글로벌 artifact·보안·기기판정 경계를 자동검사하며 → 실제 production은 별도 브라우저 QA와 인간 체감 증거로 구분하고 → 브라우저가 관찰할 수 없는 하드웨어 상태를 고장으로 과장하지 않고 → 제3자 오류 예외를 정확한 출처 단위로 제한하며 → QA revision과 실제 배포 identity를 혼동하지 않고 → telemetry·검색·AdSense를 각각 별도 현실 상태로 취급하며 → 실패 시 가장 가까운 층만 최소복구할 수 있는 상태**

실제 외부사용·검색노출·수익의 반복 시장증거가 쌓이기 전에는 `S-VERIFIED(S급 실전검증완료)`로 올리지 않는다.
