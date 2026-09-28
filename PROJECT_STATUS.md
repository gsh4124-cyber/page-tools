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

현재 사용자 경험 runtime identity는 `f42e6ec88df8e94f68ab9d031100d8097eb553da`다.

검증계약 타이밍 보정까지 포함해 Cloudflare Production Browser QA가 통과한 main은 `0482bec464d7ebbeccdd8f2d252e07cb60a42ce7`, Final QA and Cloudflare Production Check **#328 PASS**다.

이번 개선은 기존 성경 읽기·비교·기록 기능을 유지하면서 실제 장시간 읽기 흐름에 필요한 다음 기능을 한 묶음으로 완성했다.

### 1. 성경 주소 즉시 이동 검색

검색창은 주소형 입력을 먼저 해석하고, 주소가 아니면 기존 전체 본문검색으로 넘긴다.

예:
- `요14:10-12`
- `요한복음 14:10`
- `John 3:16`
- `John 14`
- 공백 없는 compact reference
- 장·절 범위

주소 이동 시 해당 책·장으로 이동하고 범위 절을 강조해 보여준다.

### 2. 읽기 위치 History

상단 도구에 이전 위치 `↶` / 다음 위치 `↷`를 추가했다.

검색·빠른 이동·기록에서 이동한 뒤 원래 읽던 위치로 되돌아갈 수 있으며, 현재 세션 안에서 읽기 위치 history를 유지한다.

### 3. 다중 구절 선택 완성

본문 구절 탭은 계속 다중 선택 방식이며 선택 후 다음 행동을 제공한다.

- 복사
- 선택 메모
- 기본 하이라이트
- 하이라이트 색상 5개: yellow / pink / green / blue / purple
- 공유
- 완료/선택 해제
- 하이라이트·색상 변경 직후 실행취소

기존 `…` 개별 구절 메뉴와 직접 텍스트 드래그 복사는 유지한다.

### 4. 공유 Deep Link

선택 구절을 공유하면 현재 역본과 절 범위를 포함한 URL을 만든다.

예시 구조:
`?v=krv1961&ref=John.14.10-12`

해당 링크를 열면 같은 책·장·절 범위로 이동하고 대상 절을 표시한다. 지원 환경에서는 시스템 공유창을 사용하고, 그렇지 않으면 링크 복사로 fallback한다.

### 5. 집중 읽기 모드

`◎` 읽기 도구로 집중 읽기 모드를 켜고 끌 수 있다.

집중 읽기에서는 상단 도구·광고·하단 이동·개별 구절 액션·절 번호 등을 숨기고 본문을 중심으로 표시한다. 화면에 항상 종료 버튼을 남겨 모바일에서도 빠져나올 수 있다.

### 6. PC 키보드 가속

기존 단축키:
- `/` 검색창 포커스
- `← / →` 이전·다음 장

추가 단축키:
- `F` 집중 읽기
- `C` 선택 구절 복사
- `H` 선택 구절 하이라이트
- `N` 선택 구절 메모
- `S` 선택 구절 공유
- `Esc` 색상창/선택/집중 읽기 종료

기존 `app.js`가 이미 소유한 `/`, `←`, `→`는 새 runtime에서 중복 처리하지 않는다.

## 현재 QA 증거

Final QA and Cloudflare Production Check **#328**에서:
- Static Guardrails: **PASS**
- Behavior QA: **PASS**
- Combined Quality Gate: **PASS**
- Notify IndexNow: **PASS**
- Cloudflare Production Browser QA: **PASS**

기존 production smoke와 신규 reader-experience production smoke를 모두 실행했다.

실제 Cloudflare Production Browser에서 확인한 흐름:
- 제목 빠른 이동 `책 → 장 → 절`
- 다중 구절 선택·복사·메모·하이라이트
- `요14:10-12` 주소 검색 및 범위 강조
- 읽기 위치 뒤로/앞으로
- 집중 읽기 진입·종료 및 절 번호 숨김
- 다중 선택 색상 하이라이트 저장
- 직전 하이라이트 실행취소
- 공유 deep link 생성 및 역본 보존
- deep link 직접 진입 후 대상 범위 표시
- `/`, `F`, `Esc` 포함 키보드 동작
- 기존 다국어 UI/역본 언어 분리

초기 새 QA에서 주소 이동 직후 range highlight가 그려지기 전에 검사해 FAIL한 건이 있었지만, 실제 이동은 정상임을 분리 확인했다. 제품 동작을 우회 수정하지 않고 검사기가 실제 렌더 완료를 기다리도록 보정한 뒤 동일 production 흐름이 PASS했다.

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

구약/신약/전체 선택기는 제거 완료했으며 숨김 runtime으로 되살리지 않는다. 빠른 이동 모달 안의 `구약 / 신약` 전환 버튼은 책 목록을 나누는 탐색 UI이며, 과거 상단 native 선택기를 복원한 것이 아니다. 난하주·관주는 현재 runtime에서 제외한다.

## 개인정보·telemetry

개인 읽기기록은 `localStorage only`다. 로그인/계정/개인 기록 서버 동기화는 없다.

읽기 위치 history는 현재 세션의 `sessionStorage`에만 저장한다. 공유 URL에는 사용자가 선택한 역본·성경 주소만 포함하며 개인 메모·하이라이트 데이터는 포함하지 않는다.

광고·유입 판단용 익명 page view만 날짜별 aggregate로 수집한다. 사용자 ID·세션 ID·IP·검색어·읽은 성구·하이라이트·메모를 저장하지 않는다.

과거 Production Browser QA가 실제 page-view에 섞이는 문제가 확인돼 자동 QA analytics 제외처리를 배포했다. **2026-09-09 이후를 clean baseline**으로 사용하고 이전 집계를 외부 사용자 수요로 역산하지 않는다.

raw telemetry는 실제 page-view 집계 원천이 기술 원본이며, 운영 판단에 필요한 current snapshot·stale 여부·다음 행동은 Supabase `hwangje_ops`에서 회수한다. 과거 Vault `bible-reader_analytics_latest.json`이나 `제품_헬스_latest.json`을 current live-state owner로 복원하지 않는다.

## Production / SEO

현재 주 운영·검색 주소는 **Cloudflare Pages production**이다. 과거 GitHub Pages 주소를 운영·SEO 기준으로 복원하지 않는다.

9개 언어 URL의 `html lang / title / description / canonical / reciprocal hreflang / x-default / sitemap / robots`를 Cloudflare origin과 일치하게 유지한다.

자동 QA는 JavaScript 문법, 필수 runtime, Cloudflare SEO origin, 다국어 무결성, UI/역본 언어 분리, 장·절 직접입력, 순차 빠른 이동, 성경 주소 범위 이동, history, 집중 읽기, 다중 구절 선택·복사·메모·하이라이트·색상·공유·deep link·undo, 키보드 단축키, 복사 형식, 모바일 select 회귀, 제거된 runtime 재유입, 공개 sitemap/robots와 브라우저 동작을 검사한다.

같은 revision에 대한 충분한 CI·Production QA 증거가 있으면 시간경과만으로 재검증하지 않는다. 기술 head·CI·배포 identity는 이 repo 최신 `main + Actions + PROJECT_STATUS.md`가 소유하며, 운영 우선순위·Gate·다음 행동은 Supabase live-state를 우선한다.

## 모바일 재발방지

과거 Android native select 회귀에서 다음을 유지한다.
- native picker 활성 중 select/option DOM 재작성 금지
- 동적 번역 walker에서 SELECT/OPTION 제외
- 장/절 visible UI는 custom 숫자 input + menu 사용
- 자동 검사 PASS만으로 실제 모바일 체감을 과장하지 않음

새 UX 변경이 없는데 과거 모바일 Human Gate를 시간경과만으로 되살리지 않는다. 새 navigation·multi-select·focus UX 변경의 자동·Production Browser QA가 PASS해도 실제 물리기기 터치 결과를 자동으로 `MOBILE REAL-USE PASS`로 승격하지 않는다.

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
5. 실제 Samsung/Android 터치 체감에서 새 navigation·multi-select·focus UX 문제가 발견되면 해당 증거로 재개
6. 모바일·원어민·장기 저장 회귀 검증은 다음 판단을 실제로 바꾸는 새 변경이나 신호가 있을 때만 연다

> **현재 제품은 기능을 계속 늘리는 단계가 아니라, 공개 운영에서 외부사용·검색·수익화 증거를 기다리는 단계다.**