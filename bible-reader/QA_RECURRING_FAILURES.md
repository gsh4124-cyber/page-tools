# QA recurring failures — bible-reader

## 2026-09-03 — 장·절 직접입력 회귀

### 증상

장·절 숫자 입력칸에서 기존 `1`을 지울 수는 있었지만, `25`처럼 다른 숫자를 정상적으로 입력하기 어려웠다. 자동 동기화가 입력 중 값을 다시 쓰는 구조라 실사용 흐름이 깨졌다.

### 왜 자동 QA가 놓쳤는가

기존 자동 QA는 다음을 확인했다.

- `number-jump.js` 존재
- 장·절 입력 DOM 존재
- JS 문법
- 다국어/SEO/필수 runtime

하지만 실제 사용자 행동인 다음 흐름을 실행하지 않았다.

`기존 값 삭제 → 새 숫자 입력 → Enter 또는 blur → 실제 이동`

따라서 `CODE/CI PASS`를 기능 정상으로 과대해석했다.

### 수정 원칙

- 장·절 직접입력은 `type="text" + inputmode="numeric"`로 두어 편집 중 빈 상태와 다자리 입력을 허용한다.
- 입력 중에는 숫자 이외 문자를 제거하되 현재 장·절 선택값으로 강제 동기화하지 않는다.
- 단, 사용자가 현재 책의 최대 장 또는 현재 장의 최대 절보다 큰 숫자를 입력하면 **입력하는 즉시 표시값을 최대값으로 제한한다.** 실제 이동은 Enter 또는 blur에서 확정한다.
- 최소값 보정, 빈 값 복구, 실제 이동은 Enter 또는 blur 등 확정 시점에 처리한다.
- 드롭다운 선택과 직접입력은 둘 다 유지하고 서로의 상태를 확정 후 동기화한다.

### 필수 회귀 시나리오

1. `1` 전체 삭제 후 `25` 입력 가능
2. 최대값 이내의 여러 자리 숫자는 입력 중 유지됨
3. 최대 장이 50일 때 `51` 또는 `999` 입력 즉시 표시값이 `50`으로 제한됨
4. 최대 절이 31일 때 `32` 입력 즉시 표시값이 `31`으로 제한됨
5. 입력칸을 비운 상태는 편집 중 그대로 유지되고, Enter/blur에서 정의된 값으로 복구됨
6. 유효 숫자 + Enter로 이동
7. 유효 숫자 + blur로 이동
8. 드롭다운 선택 후 직접입력 가능
9. 직접입력 후 드롭다운 현재값 동기화
10. 책/역본/이전·다음 장 이동 후 표시값 및 최대값 동기화

이 시나리오는 정적 코드 검사만으로 `BROWSER PASS` 또는 `FULL QA PASS` 처리하지 않는다.

## 2026-09-03 — 운영 호스트와 canonical/sitemap 부분 변경 회귀

### 증상

현재 확정 운영 주소와 검색엔진 등록 실행선은 `https://gsh4124-cyber.github.io/bible-reader/`인데, 코드에서 다음 세 항목만 `https://bible-reader-1iz.pages.dev/`로 부분 변경됐다.

- 루트 `canonical / hreflang`
- `sitemap.xml`
- `robots.txt`의 Sitemap 주소

반면 다음은 기존 GitHub Pages 구조를 계속 사용하고 있었다.

- 언어별 entry HTML의 canonical/hreflang
- `/bible-reader/` 기반 runtime 라우팅
- GitHub Pages 배포 workflow
- Production Browser QA
- 익명 page-view 운영 origin
- 이미 진행 중인 Google/Naver/Daum 등 검색엔진 등록 상태

그 결과 하나의 제품이 두 운영 호스트를 동시에 가리키는 불일치가 생겼고, `Static Guardrails`와 `Behavior QA`가 실제로 실패했다.

### 원인

호스트 전환을 하나의 독립 인프라 결정으로 다루지 않고 SEO 파일 일부만 먼저 변경했다.

`canonical 변경 ≠ 운영 호스트 전환 완료`

호스트 전환은 주소 한 줄 교체가 아니라 runtime·언어 URL·analytics·검색등록·배포·QA·Vault 상태까지 함께 바뀌는 구조 변경이다.

### 복구

현재 황제 Vault의 확정 운영 주소와 검색엔진 등록 상태를 우선해 다음을 GitHub Pages 주소로 복구했다.

- `index.html` canonical/hreflang
- `sitemap.xml`
- `robots.txt`

복구 후 `Final QA and Deploy Pages` run `33756412342`에서 다음이 모두 SUCCESS였다.

- Static Guardrails
- Behavior QA
- Combined Quality Gate
- GitHub Pages deploy
- Production Browser QA
- IndexNow notify

### 재발 방지

운영 호스트를 바꿀 때는 다음을 한 묶음으로 검토한다.

1. 황제가 실제로 호스트 전환을 확정했는가
2. 현재 검색엔진 등록·색인 자산과 충돌하지 않는가
3. 루트와 모든 언어 URL의 canonical/hreflang이 같은 기준을 보는가
4. sitemap/robots가 같은 기준을 보는가
5. runtime의 base path와 언어 라우팅이 새 호스트에서 실제 작동하는가
6. analytics/외부 API의 허용 origin이 새 호스트와 일치하는가
7. 배포 pipeline이 실제 새 호스트에 현재 commit을 배포하는가
8. Production QA가 새 호스트의 현재 revision을 검사하는가
9. Vault의 공개 주소·AdSense·검색등록 상태가 함께 갱신됐는가
10. 전환 후 기존 호스트를 유지·redirect·폐기 중 무엇으로 처리할지 명시했는가

위 항목을 함께 닫기 전에는 SEO 파일 일부만 새 호스트로 먼저 바꾸지 않는다.
