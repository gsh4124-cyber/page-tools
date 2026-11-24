# 공개 화면 예시

`owner-access.html`과 `tools/owner-access-client.mjs`는 비로그인 방문자를 위한 소개와 체험 화면이다. 실제 비공개 앱은 기존 `index.html` / `app.mjs`이며, 이 소개 화면이 앱의 새 기능이나 실제 사용자 기록을 의미하지 않는다.

기록·달력·사진 전환, 날짜 선택, 사진에서 일기로 이동, 습관 체크는 합성 예시로 동작한다. 체크와 선택은 메모리에만 있고 새로고침하면 초기화된다. 예시는 Supabase에 저장하지 않는다. 기존 소유자 인증, 비공개 앱 파일 게이트와 계정의 기록은 그대로 보존한다.

## 설계 기준과 Impeccable 적용

사용자는 보라색과 정형적인 AI 화면을 거절했고 사진의 테이프는 유지해 달라고 했다. 기존 다이어리의 읽기·쓰기 목적과 테이프를 보존하면서 [Impeccable](https://github.com/pbakaus/impeccable)의 [distill](https://github.com/pbakaus/impeccable/blob/main/skill/reference/distill.md), [layout](https://github.com/pbakaus/impeccable/blob/main/skill/reference/layout.md), [typeset](https://github.com/pbakaus/impeccable/blob/main/skill/reference/typeset.md), [craft floor](https://github.com/pbakaus/impeccable/blob/main/skill/reference/craft-floor.md)를 수동 적용했다. 원저작자는 Paul Bakaus, 저장소 라이선스는 Apache-2.0이다. 해당 소프트웨어 코드를 앱에 포함하거나 전용 CLI의 통과를 주장하지 않는다.

`impeccable@4.10.0`을 격리된 `qa-evidence/impeccable-tools`에 설치하려 했으나 npm registry DNS `ENOTFOUND`로 실패했다. context 실행기는 없어 실행되지 않았고, skill 지침의 수동 context 대체 경로로 기존 README·실행 코드·사용자 피드백을 읽었다. 전용 detector/context 명령은 NOT_TESTED다. 전역 설치, hook, live 모드, 권한 우회, 추가 API 비용은 사용하지 않았다.

### 목표와 구조

- 모드: Operate/Read. 처음 방문한 사람은 공개 예시로 일기장을 이해하고, 소유자는 오늘의 기록을 쓰거나 날짜별 기록을 찾는다.
- 공개 화면: 큰 감성 헤드라인과 카드 안의 카드를 없앴다. 월별 기록 색인·기록/달력/사진 탭·날짜/제목/본문/사진 순으로 읽는다. 공개 예시와 소유자 전용 범위를 명시한다.
- 실제 앱: 큰 노란 배너·격자·별 장식을 없앴다. 오늘/날짜/기록 쓰기를 한 줄의 작업 헤더에 두고, 이번 주 날짜에서 해당 기록을 연다. 최근 기록은 테두리로 나누는 목록이며 사진이 있을 때만 테이프가 붙은 썸네일을 보인다.
- 이동: PC는 왼쪽 메뉴, 모바일은 하단 메뉴다. 모바일 버튼 너비를 균등 분배하고 최소 너비를 명시해 다섯 항목이 모두 화면에 들어오게 했다. 동일한 SVG 선 아이콘과 글자 레이블을 쓴다. 작성·달력·습관·보관함 기능과 입력 초안은 유지한다.
- 빈 상태에 실제 기록처럼 보이는 데이터를 넣지 않는다. 사진/긴 제목이 있는 상태는 로컬 임시 IndexedDB에만 합성 기록을 만들어 검증한다.

### 토큰과 품질 기준

| 역할 | 기준 |
|---|---|
| 바탕/본문 | 연살구빛 흰 바탕 `#fff7f5`·흰 종이 `#fff` / 부드러운 잉크색 `#4b3e44` |
| 보조 글/주 행동 | `#796b72` / 로즈 코랄 `#9e4959`; 주 버튼은 살구핑크 `#ffdfda`와 글자 `#8c3f4b` |
| 테이프 | 사진에만 연노랑 `#efd98ac9`; 격자·반복 줄무늬 배경 없음 |
| 글자 | 제목/본문/wordmark 모두 시스템 고딕(-apple-system/BlinkMacSystemFont/Apple SD Gothic Neo/Segoe UI/Malgun Gothic). 본문 16px·보조 13~14px, 제목 24~30px/500, wordmark 28~30px/600. 명조체 제거. 사진 아래 작은 손글씨(my day)는 직접 만든 SVG 선이며, 홈에는 짧은 문구와 손그림 하트를 둔다. 외부 폰트 요청 없음 |
| 간격/형태 | 4px 기반 간격. 주 버튼과 탭은 둥근 pill, 입력18px, dialog28px. 일기장 전체34px/모바일28px. 홈30px, 최근 기록24px. 모바일 메뉴는 둥근 floating bar. 사진 테이프는 그대로 유지하며 인화지/사진 모서리만 둥글게. 웃는 꽃 SVG를 공통 wordmark에 사용 |
| 대비 | 소스 대비: 본문/종이 10.00, 보조/바탕 4.78, 주 버튼 글자/살구핑크 5.74, 코랄/흰색 5.91. 전체 WCAG 인증을 의미하지 않음 |
| 동작 | 44px 이상 주요 조작, SVG+텍스트, aria-current/pressed, 제목 포커스, 메뉴 이동 시 초안 보존. 저장 알림은 제목을 가리지 않도록 하단에 배치 |

파생 `index.html`의 중복 inline style을 없애고 실제 앱 스타일은 `service.css`로 모았다. 사용자 스스로 고른 핑크·라벤더·민트·옐로·나이트·종이 꾸미기 데이터와 원본 v7 파일은 보존한다. 기본 UI가 보라색을 사용하지 않는 것과 과거 기록의 선택한 꾸미기를 지우는 것은 구분한다.

## 참고한 공식 제품 화면

- [Day One Web](https://dayoneapp.com/guides/day-one-on-the-web/getting-started-on-the-web/): 기록·미디어·달력 전환을 한곳에 배치하는 흐름.
- [Journey](https://journey.cloud/): 사진과 글이 함께 보이는 기록의 우선순위.
- [Daylio](https://daylio.net/): 한 번 눌러 확인할 수 있는 짧은 체크 동작과 상태 피드백.

각 앱의 스크린샷, 로고나 코드를 복제하지 않았다. 모아에 없는 지도·감정 통계 등을 제공한다고 표시하지 않는다.

## 예시 사진 출처

`demo-media.json`의 JPEG 2개는 [MDN interactive-examples / cc0-images](https://github.com/mdn/interactive-examples/tree/main/live-examples/media/cc0-images)의 `grapefruit-slice-332-332.jpg`, `surfer-240-200.jpg`다. [저장소 라이선스](https://github.com/mdn/interactive-examples/blob/main/LICENSE)는 CC0 1.0 Universal이다. 실제 사용자 사진이 아니다.

Cloudflare 패키징 시 검증한 data URI를 HTML에 삽입한다. 외부 이미지 요청, 추적 스크립트, 새 공개 자산 경로나 CSP 완화 없이 기존 게이트를 유지한다. `demo-media.json` 자체는 공개 라우트에 올리지 않는다.

검증: 기기 모드 빌드 뒤 `node tests/visual-diary.mjs`는 합성 글과 실제 CC0 사진으로 긴 제목·사진·키보드·5개 폭을 검사한다. `npm test`와 클라우드 구성 빌드 후 `node tests/owner-gateway-browser.mjs`. 후자는 실제 패키지의 게이트와 공개 예시 동작을 검사하지만, 인증 RPC는 모의 처리한다. 실제 호스트 검증과 실기기 검증 범위는 `QA_REPORT.md`를 따른다.
