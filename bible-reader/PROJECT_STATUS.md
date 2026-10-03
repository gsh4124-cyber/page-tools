# PROJECT STATUS — bible-reader

- 마지막 기술상태 갱신: 2026-10-04
- 저장소 역할: `gsh4124-cyber/page-tools`의 `main / bible-reader/`가 성경 읽기 웹서비스의 실제 코드·배포·기술상태 원본
- 상위 사업구조: 황제 Vault `직장/바이브코딩/_INDEX.md`
- 빠르게 변하는 운영상태·Portfolio Mode·Gate·다음 행동: Supabase `hwangje_ops` / project key `vibecoding`
- 로컬 checkout 경로: 환경별로 다를 수 있으며 Canonical로 고정하지 않음. 작업 시 `page-tools/main`의 실제 checkout 위치를 확인
- 운영 주소: https://bible-reader-1iz.pages.dev/

## 현재 단계

**S-DESIGN / PUBLIC CLOUDFLARE PRODUCTION / 9 UI LANGUAGES / PRODUCTION QA EVIDENCE / CLEAN PAGE-VIEW OBSERVATION / SEARCH DISTRIBUTION OBSERVATION / ADSENSE_REVIEW_SUBMITTED**

`S-DESIGN`은 현재 제품의 기술·QA·운영경계·복구구조가 S급 설계기준으로 닫혔다는 뜻이다. 실제 외부사용·검색노출·수익에서 반복 시장증거가 확인됐다는 뜻이 아니며, 그 전에는 `S-VERIFIED`로 승격하지 않는다.

현재 Portfolio Mode와 다음 행동은 Supabase live-state에서 회수한다. 실제 기술 FAIL이나 의미 있는 외부 신호 없이 새 기능개발·실기기 Gate·깊은 QA를 반복하지 않는다.

> 구현 완료 ≠ 자동 QA PASS ≠ 배포 성공 ≠ 실제 브라우저 PASS ≠ 실제 외부사용 ≠ 검색노출 ≠ 수익

## 2026-10-04 S-DESIGN 회귀검수

- Bible Reader 전용 CI의 `push` 기준 브랜치를 폐기된 migration branch에서 현행 `main`으로 정정하고 `pull_request`도 `main` 기준으로 맞췄다.
- 수정 직후 `main`에서 Bible Reader Monorepo QA가 실제 자동기동됐고 Static Guardrails / Behavior QA / Combined Quality Gate가 모두 SUCCESS했다.
- README와 본 상태문서에서 폐기된 독립 repo와 고정 PC 절대경로를 기술 원본으로 사용하지 않도록 정정했다.
- 공통 Product Health Monitor의 실제 외부 readback에서 운영 URL HTTP 200, `robots.txt` HTTP 200, `sitemap.xml` HTTP 200, sitemap 9 URL, robots의 sitemap 선언을 확인했다.
- 현행 CI는 대표 secret pattern/민감 파일, JavaScript 문법, 필수 runtime, Cloudflare SEO origin 계약, 다국어 무결성, 제목 탐색 동작을 검사한다.
- 과거 검증된 사용자경험 revision에서는 Cloudflare Production Browser QA PASS가 기록돼 있다.
- 현재 GitHub repo만으로 Cloudflare 최신 배포 revision과 최신 `main`의 정확한 동일성을 직접 증명할 수 없는 경우 이를 추정으로 승격하지 않는다. 최신 배포 identity가 다음 판단에 필요하면 Cloudflare/실서비스 배포 원본에서 별도 readback한다.
- 이 정합화는 새 시장검증을 의미하지 않는다. 실제 외부사용·검색노출·수익 상태는 live state와 현실 readback을 별도로 본다.

## 검증된 사용자경험 기준선 — 2026-09-28

검증된 사용자 경험 runtime identity는 `f42e6ec88df8e94f68ab9d031100d8097eb553da`다.

검증계약 타이밍 보정까지 포함해 Cloudflare Production Browser QA가 통과한 main은 `0482bec464d7ebbeccdd8f2d252e07cb60a42ce7`, Final QA and Cloudflare Production Check **#328 PASS**다.

해당 기준선에서 확인된 핵심 흐름:
- 성경 주소 즉시 이동 검색과 범위 강조
- 읽기 위치 이전/다음 history
- 다중 구절 선택·복사·메모·하이라이트·5색상·공유·실행취소
- 역본·절 범위를 보존하는 deep link
- 집중 읽기 모드
- `/`, `←/→`, `F`, `C`, `H`, `N`, `S`, `Esc` 키보드 가속
- 제목 빠른 이동 `책 → 장 → 절`
- 기존 다국어 UI/역본 언어 분리

Final QA and Cloudflare Production Check #328에서 Static Guardrails, Behavior QA, Combined Quality Gate, Notify IndexNow, Cloudflare Production Browser QA가 PASS했다. 이 PASS는 자동·실제 Cloudflare production browser 기준이며 Android/iPhone 물리기기 터치 체감을 `MOBILE REAL-USE PASS`로 과장하지 않는다.

## 핵심 목적

> **PC에서 실제로 편하게 읽을 수 있는 성경 페이지를 만든다.**

기능 수보다 장시간 읽기 편안함, 빠른 위치 이동, 역본 비교, 기록 회수, 실제 사용 피드백을 우선한다.

## 지원 UI 언어 / URL

- ko: `/`
- en: `/en/`
- fr: `/fr/`
- de: `/de/`
- zh: `/zh/`
- ru: `/ru/`
- la: `/la/`
- pt: `/pt/`
- ar: `/ar/`

IP 강제 리다이렉트는 사용하지 않는다.

## UI 언어와 역본 언어

UI 언어와 선택 역본 언어를 분리한다. 사용자가 역본을 바꾸면 페이지 UI 언어는 유지하고 Scripture 영역만 해당 역본 언어를 따른다. UI 언어 변경은 고정 언어 URL로 이동하며 해당 언어 기본 역본으로 전환한다.

현재 주요 역본:
`개역한글 1961 / KJV / WEB / ASV / Louis Segond 1910 / Lutherbibel 1912 / CUV / Russian Synodal / Vulgata / Almeida 1819 / Smith–Van Dyck`

실행선에는 공개도메인 또는 재배포 가능성이 확인된 역본만 둔다. 현대 한국어 역본은 권리자 허가 없이 포함하지 않는다.

## 핵심 기능

- 66권·장·절 이동 및 장·절 숫자 직접 입력
- 제목 클릭형 빠른 이동: `성경책 → 장 → 절 → 본문 위치`
- 성경 주소 즉시 이동 + 주소가 아닌 입력의 현재 역본 전체검색
- 읽기 위치 이전/다음 history
- 이전/다음 장, 글자 크기, 본문 폭, 라이트/다크
- 집중 읽기 모드
- 한 면/양면 보기, 2역본 비교
- 구절 탭 다중선택 후 일괄 복사·선택 메모·하이라이트·5색 하이라이트·공유
- 선택 범위 deep link
- 하이라이트 변경 실행취소
- PC 키보드 단축키
- 직접 텍스트 선택영역 복사
- 절 하이라이트·절 저장·장 저장
- `나의 기록`의 하이라이트·저장한 성구·저장한 장·선택 메모
- 기록 JSON 백업/복원
- 마지막 읽기 위치·역본·읽기 설정·기록 localStorage 저장

구약/신약/전체 선택기는 제거 완료했으며 숨김 runtime으로 되살리지 않는다. 빠른 이동 모달 안의 `구약 / 신약` 전환 버튼은 책 목록을 나누는 탐색 UI이며 과거 상단 native 선택기를 복원한 것이 아니다. 난하주·관주는 현재 runtime에서 제외한다.

## 개인정보·telemetry

개인 읽기기록은 `localStorage only`다. 로그인/계정/개인 기록 서버 동기화는 없다.

읽기 위치 history는 현재 세션의 `sessionStorage`에만 저장한다. 공유 URL에는 사용자가 선택한 역본·성경 주소만 포함하며 개인 메모·하이라이트 데이터는 포함하지 않는다.

광고·유입 판단용 익명 page view만 날짜별 aggregate로 수집한다. 사용자 ID·세션 ID·IP·검색어·읽은 성구·하이라이트·메모를 저장하지 않는다.

과거 Production Browser QA가 실제 page-view에 섞이는 문제가 확인돼 자동 QA analytics 제외처리를 배포했다. **2026-09-09 이후를 clean baseline**으로 사용하고 이전 집계를 외부 사용자 수요로 역산하지 않는다.

raw telemetry는 실제 page-view 집계 원천이 기술 원본이며, 운영 판단에 필요한 current snapshot·stale 여부·다음 행동은 Supabase `hwangje_ops`에서 회수한다. 과거 Vault analytics snapshot을 current live-state owner로 복원하지 않는다.

## Production / SEO

현재 주 운영·검색 주소는 **Cloudflare Pages production**이다. 과거 GitHub Pages 주소를 운영·SEO 기준으로 복원하지 않는다.

9개 언어 URL의 `html lang / title / description / canonical / reciprocal hreflang / x-default / sitemap / robots`를 Cloudflare origin과 일치하게 유지한다.

같은 revision에 대한 충분한 CI·Production QA 증거가 있으면 시간경과만으로 재검증하지 않는다. 기술 head·CI·배포 identity는 이 repo 최신 `main + Actions + PROJECT_STATUS.md`가 소유하며, 운영 우선순위·Gate·다음 행동은 Supabase live-state를 우선한다.

## 모바일 재발방지

과거 Android native select 회귀에서 다음을 유지한다.
- native picker 활성 중 select/option DOM 재작성 금지
- 동적 번역 walker에서 SELECT/OPTION 제외
- 장/절 visible UI는 custom 숫자 input + menu 사용
- 자동 검사 PASS만으로 실제 모바일 체감을 과장하지 않음

새 UX 변경이 없는데 과거 모바일 Human Gate를 시간경과만으로 되살리지 않는다. 실제 물리기기 확인이 다음 판단을 바꿀 때만 연다.

## 검색 유통

- `robots.txt`
- `sitemap.xml`
- Google Search Console 소유확인
- Naver/Bing 등록 및 sitemap 제출 이력
- IndexNow 제출 이력

제출 성공 ≠ 크롤링 ≠ 색인 ≠ 노출 ≠ 실제 유입이다. 현재 다음 판단은 실제 검색 색인·노출·유입 변화로 한다.

## AdSense — 현재

**`ADSENSE_REVIEW_SUBMITTED`**

승인 완료나 광고수익 발생으로 승격하지 않는다. 현재 심사·`ads.txt` 상태의 최신 판단은 실제 AdSense/live-state에서 확인한다.

## 현재 다음 Gate

구체 현재 Gate·우선순위는 Supabase live-state를 회수한다. 장기 판단기준은 다음과 같다.

1. 2026-09-09 clean baseline 이후 실제 외부 page-view 신호 관찰
2. 실제 검색 색인·노출·유입 변화 관찰
3. AdSense 심사와 `ads.txt` 상태 관찰
4. Production/CI에 실제 FAIL이 발생하면 원인분리 후 최소복구
5. 새 UX 변경 또는 실제 사용 증거가 생길 때만 물리기기 Gate 재개
6. 최신 배포 identity가 의사결정에 필요할 때만 Cloudflare 원본에서 별도 readback

> **현재 제품은 더 만드는 단계보다 외부 사용·검색·수익화 증거를 기다리는 단계다. 활동량을 만들기 위해 닫힌 기술 Gate를 반복해서 열지 않는다.**
