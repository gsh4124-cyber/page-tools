# PROJECT STATUS — bible-reader

- 마지막 기술상태 갱신: 2026-09-28
- live-state owner 포인터 정합화: 2026-09-28
- 저장소 역할: 성경 읽기 웹서비스의 실제 코드·배포·기술상태 원본
- 상위 사업구조: 황제 Vault `직장/바이브코딩/_INDEX.md`, `직장/바이브코딩/페이지형/_INDEX.md`
- 빠르게 변하는 운영상태·Portfolio Mode·Gate·다음 행동: Supabase `hwangje_ops` / project key `vibecoding`
- 표준 로컬 경로: `C:/Users/gsh41/Desktop/황제/직장/바이브코딩/페이지형/bible-reader`
- 운영 주소: https://bible-reader-1iz.pages.dev/

## 현재 단계

**PUBLIC CLOUDFLARE PRODUCTION / 9 UI LANGUAGES / CURRENT-REVISION PRODUCTION QA PASS / CLEAN PAGE-VIEW OBSERVATION / SEARCH DISTRIBUTION OBSERVATION / ADSENSE_REVIEW_SUBMITTED**

현재 Portfolio Mode와 다음 행동은 Supabase live-state에서 회수한다. 실제 기술 FAIL이나 의미 있는 외부 신호 없이 새 기능개발·실기기 Gate·깊은 QA를 반복하지 않는다.

> 구현 완료 ≠ 자동 QA PASS ≠ 배포 성공 ≠ 실제 브라우저 PASS ≠ 실제 외부사용 ≠ 검색노출 ≠ 수익

## 현재 검증 identity — 2026-09-28

현재 사용자 경험 변경이 검증된 제품 identity는 `e289f3658be920059f70702d03664fbd10b21350`다.

이번 변경은 제목을 눌러 여는 `성경 빠른 이동`을 한 화면에 책·장·절을 모두 나열하던 구조에서 다음의 순차 흐름으로 바꾼 것이다.

> **성경책 선택 → 해당 책의 장 선택 → 해당 장의 절 선택 → 팝업 닫힘 + 해당 절 이동/강조**

추가로 장/절 단계에서 이전 단계로 돌아갈 수 있는 Back 동작을 유지한다. 기존 숨김 `bookSelect / chapterSelect / verseSelect`를 상태 원본으로 재사용하며, 기존 검색·역본·기록·장 이동 기능은 변경하지 않았다.

이 identity에서:
- Security Guardrails #49: **PASS**
- Final QA and Cloudflare Production Check #307: **PASS**
- Static Guardrails: **PASS**
- multilingual / sequential navigation Behavior QA: **PASS**
- Cloudflare Production Browser QA: **PASS**
- Production QA에서 실제로 `책 선택 → 장 화면 → Back → 책 화면 → 장 선택 → 절 화면 → 절 선택 → 모달 닫힘 → 선택 절 강조 이동` 흐름을 실행해 확인했다.

초기 QA에서는 기존 `validate-i18n`이 과거 동시표시 navigator 함수 signature를 요구해 실패했으며, 제품 회귀가 아니라 검증계약 stale로 원인을 분리했다. 순차 navigation 계약으로 validator와 Production Browser QA를 갱신한 뒤 동일 current revision에서 전체 PASS했다.

이 PASS는 자동·실제 Cloudflare production browser 기준이다. 실제 Android/iPhone 물리기기 터치 체감을 이번 변경에서 새로 `MOBILE REAL-USE PASS`로 선언하지 않는다.

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
- 제목 클릭형 빠른 이동: `성경책 → 장 → 절 → 본문 위치` 순차 탐색
- 현재 역본 전체검색 및 성경책 직접 이동
- 이전/다음 장, 글자 크기, 본문 폭, 라이트/다크
- 한 면/양면 보기, 2역본 비교
- 절 복사·선택영역 복사
- 절 하이라이트·절 저장·장 저장
- `나의 기록`과 메모
- 기록 JSON 백업/복원
- 마지막 읽기 위치·역본·읽기 설정·기록 localStorage 저장

구약/신약/전체 선택기는 제거 완료했으며 숨김 runtime으로 되살리지 않는다. 빠른 이동 모달 안의 `구약 / 신약` 전환 버튼은 책 목록을 나누는 탐색 UI이며, 과거 상단 native 선택기를 복원한 것이 아니다. 난하주·관주는 현재 runtime에서 제외한다.

## 개인정보·telemetry

개인 읽기기록은 `localStorage only`다. 로그인/계정/개인 기록 서버 동기화는 없다.

광고·유입 판단용 익명 page view만 날짜별 aggregate로 수집한다. 사용자 ID·세션 ID·IP·검색어·읽은 성구·하이라이트·메모를 저장하지 않는다.

과거 Production Browser QA가 실제 page-view에 섞이는 문제가 확인돼 자동 QA analytics 제외처리를 배포했다. **2026-09-09 이후를 clean baseline**으로 사용하고 이전 집계를 외부 사용자 수요로 역산하지 않는다.

raw telemetry는 실제 page-view 집계 원천이 기술 원본이며, 운영 판단에 필요한 current snapshot·stale 여부·다음 행동은 Supabase `hwangje_ops`에서 회수한다. 과거 Vault `bible-reader_analytics_latest.json`이나 `제품_헬스_latest.json`을 current live-state owner로 복원하지 않는다.

## Production / SEO

현재 주 운영·검색 주소는 **Cloudflare Pages production**이다. 과거 GitHub Pages 주소를 운영·SEO 기준으로 복원하지 않는다.

9개 언어 URL의 `html lang / title / description / canonical / reciprocal hreflang / x-default / sitemap / robots`를 Cloudflare origin과 일치하게 유지한다.

자동 QA는 JavaScript 문법, 필수 runtime, Cloudflare SEO origin, 다국어 무결성, UI/역본 언어 분리, 장·절 직접입력, 순차 빠른 이동, 복사 형식, 모바일 select 회귀, 제거된 runtime 재유입, 공개 sitemap/robots와 브라우저 동작을 검사한다.

같은 revision에 대한 충분한 CI·Production QA 증거가 있으면 시간경과만으로 재검증하지 않는다. 기술 head·CI·배포 identity는 이 repo 최신 `main + Actions + PROJECT_STATUS.md`가 소유하며, 운영 우선순위·Gate·다음 행동은 Supabase live-state를 우선한다.

## 모바일 재발방지

과거 Android native select 회귀에서 다음을 유지한다.
- native picker 활성 중 select/option DOM 재작성 금지
- 동적 번역 walker에서 SELECT/OPTION 제외
- 장/절 visible UI는 custom 숫자 input + menu 사용
- 자동 검사 PASS만으로 실제 모바일 체감을 과장하지 않음

새 UX 변경이 없는데 과거 모바일 Human Gate를 시간경과만으로 되살리지 않는다. 새 navigation UX 변경의 자동·Production Browser QA가 PASS해도 실제 물리기기 터치 결과를 자동으로 `MOBILE REAL-USE PASS`로 승격하지 않는다.

## 검색 유통

Google/Naver/Bing 핵심 등록·sitemap 제출이 확인됐고 Daum은 신청 접수 뒤 관찰 단계다. IndexNow는 활성 운영한다.

제출 성공 ≠ 크롤링 ≠ 색인 ≠ 검색 노출 ≠ 실제 유입이다. 다음 판단은 실제 색인·노출·유입과 clean 사용신호를 본다.

## AdSense — 현재

**`ADSENSE_REVIEW_SUBMITTED`**

- AdSense 사이트 추가 완료
- 공식 코드 및 `ads.txt` 반영
- Production 소유확인 통과
- 검토 요청 제출 완료
- 자동 광고는 인페이지 중심
- 앵커·사이드레일·모바일 전면광고 비활성화
- `ads.txt` UI 재탐색 결과 대기

승인 완료나 광고수익 발생으로 승격하지 않는다.

## 현재 다음 Gate

구체 current Gate·우선순위는 Supabase live-state를 회수한다. 장기 판단기준은 다음과 같다.

1. 2026-09-09 clean baseline 이후 실제 외부 page-view 변화 관찰
2. 실제 검색 색인·노출·유입 변화 관찰
3. AdSense 심사와 `ads.txt` 재탐색 결과 관찰
4. Production/CI 실제 FAIL 발생 시 원인분리 후 최소복구
5. 모바일·원어민·장기 저장 회귀 검증은 다음 판단을 실제로 바꾸는 새 변경이나 신호가 있을 때만 연다

> **현재 제품은 기능을 계속 늘리는 단계가 아니라, 공개 운영에서 외부사용·검색·수익화 증거를 기다리는 단계다.**
