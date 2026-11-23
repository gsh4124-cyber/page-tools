# 공개 화면 예시

`owner-access.html`과 `tools/owner-access-client.mjs`는 비로그인 방문자를 위한 소개와 체험 화면이다. 실제 비공개 앱은 기존 `index.html` / `app.mjs`이며, 이 소개 화면이 앱의 새 기능이나 실제 사용자 기록을 의미하지 않는다.

기록·달력·사진 전환, 날짜 선택, 사진에서 일기로 이동, 습관 체크는 합성 예시로 동작한다. 체크와 선택은 메모리에만 있고 새로고침하면 초기화된다. 예시는 Supabase에 저장하지 않는다. 기존 소유자 인증, 비공개 앱 파일 게이트와 계정의 기록은 그대로 보존한다.

## 참고한 공식 제품 화면

- [Day One Web](https://dayoneapp.com/guides/day-one-on-the-web/getting-started-on-the-web/): 기록·미디어·달력 전환을 한곳에 배치하는 흐름.
- [Journey](https://journey.cloud/): 사진과 글이 함께 보이는 기록의 우선순위.
- [Daylio](https://daylio.net/): 한 번 눌러 확인할 수 있는 짧은 체크 동작과 상태 피드백.

각 앱의 스크린샷, 로고나 코드를 복제하지 않았다. 모아에 없는 지도·감정 통계 등을 제공한다고 표시하지 않는다.

## 예시 사진 출처

`demo-media.json`의 JPEG 2개는 [MDN interactive-examples / cc0-images](https://github.com/mdn/interactive-examples/tree/main/live-examples/media/cc0-images)의 `grapefruit-slice-332-332.jpg`, `surfer-240-200.jpg`다. [저장소 라이선스](https://github.com/mdn/interactive-examples/blob/main/LICENSE)는 CC0 1.0 Universal이다. 실제 사용자 사진이 아니다.

Cloudflare 패키징 시 검증한 data URI를 HTML에 삽입한다. 외부 이미지 요청, 추적 스크립트, 새 공개 자산 경로나 CSP 완화 없이 기존 게이트를 유지한다. `demo-media.json` 자체는 공개 라우트에 올리지 않는다.

검증: `npm test`와 클라우드 구성 빌드 후 `node tests/owner-gateway-browser.mjs`. 후자는 실제 패키지의 게이트와 공개 예시 동작을 검사하지만, 인증 RPC는 모의 처리한다. 실제 호스트 검증과 실기기 검증 범위는 `QA_REPORT.md`를 따른다.
