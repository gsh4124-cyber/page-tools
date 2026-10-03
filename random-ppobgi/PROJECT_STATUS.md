# PROJECT STATUS — random-ppobgi

- 마지막 기술상태 갱신: 2026-10-04
- 저장소 역할: `gsh4124-cyber/page-tools`의 `main / random-ppobgi/`가 랜덤뽑기 웹서비스의 실제 코드·배포·기술상태 원본
- 상위 사업구조: 황제 Vault `직장/바이브코딩/_INDEX.md`
- 빠르게 변하는 운영상태·Portfolio Mode·Gate·다음 행동: Supabase `hwangje_ops` / project key `vibecoding`
- 로컬 checkout 경로: 환경별로 다를 수 있으며 Canonical로 고정하지 않음. 작업 시 `page-tools/main`의 실제 checkout 위치를 확인
- 운영 주소: https://random-ppobgi.pages.dev/

## 현재 단계

**S-DESIGN / PUBLIC PRODUCTION / 17-LANGUAGE COMPLETE / CURRENT-REVISION PRODUCTION QA PASS / CLEAN TELEMETRY OBSERVATION / SEARCH DISTRIBUTION OBSERVATION / ADSENSE_REVIEW_SUBMITTED**

`S-DESIGN`은 현재 제품의 기술·QA·운영경계·복구구조가 S급 설계기준으로 닫혔다는 뜻이다. 실제 외부사용·검색노출·수익에서 반복 시장증거가 확인됐다는 뜻이 아니며, 그 전에는 `S-VERIFIED`로 승격하지 않는다.

현재 Portfolio Mode와 다음 행동은 Supabase live-state에서 회수한다. 실제 기술 FAIL이나 의미 있는 외부 신호 없이 새 기능개발이나 깊은 QA를 반복하지 않는다.

> 구현 완료 ≠ CI PASS ≠ 배포 완료 ≠ Production Browser QA PASS ≠ 실제 외부사용 ≠ 검색노출 ≠ 수익

## 2026-10-04 S-DESIGN 회귀검수

- Random Ppobgi 전용 CI의 `push`/`pull_request` 기준 브랜치를 현행 `main`으로 정정했고 실제 `main` 자동기동·SUCCESS를 확인했다.
- 제품 README와 본 상태문서에서 폐기된 독립 repo/고정 PC 절대경로를 기술 원본으로 사용하지 않도록 정정했다.
- 제품 상태 감시 workflow의 Bash 예약변수 `RANDOM` 충돌을 제거했다.
- 상태 감시 workflow 자체 변경 시 `main`에서 self-verification(자기검증)이 자동기동되도록 push trigger를 추가했다.
- 수정된 현행 workflow commit에서 Product Health Monitor가 실제 SUCCESS한 것을 확인했다.
- Health Monitor의 실서비스 readback에서 Random Ppobgi URL·`robots.txt`·`sitemap.xml` 검색표면이 정상임을 확인했다.
- 보안 Guardrail은 tracked file의 대표 secret pattern과 민감 파일명을 검사한다.
- 시장 telemetry API는 same-origin POST, 고정 enum payload, 1KB body limit, 자동 QA 제외, D1 aggregate count 방식으로 제한한다.
- 과거 검증된 사용자경험 revision에서는 Production Browser Smoke와 Cloudflare exact commit deploy PASS가 기록돼 있다.
- 현재 GitHub repo에서 Cloudflare의 최신 배포 revision 자체를 직접 증명할 수 없는 경우 이를 추정으로 승격하지 않는다. 최신 배포 identity가 다음 판단에 필요하면 Cloudflare/실서비스 배포 원본에서 별도 readback한다.
- 이 정합화는 새 시장검증을 의미하지 않는다. 실제 외부사용·검색노출·수익 상태는 live state와 현실 readback을 별도로 본다.

## 2026-09-28 반복사용·공유·녹화 UX 개선

검증된 사용자 경험 revision은 `945659d0e6d688be9d3695bdc3ede892f0c3b25d`다.

추가 기능:
- 이름 참가자 목록을 최대 12개까지 브라우저 localStorage에 저장·불러오기·삭제
- 결과를 즉시 복사하거나 Web Share API로 공유하고, 미지원 환경은 클립보드로 fallback
- 최근 결과 최대 12개를 브라우저 localStorage에서 회수·삭제
- 지원 브라우저에서 `녹화 시작` → 사용자가 현재 탭/창/화면 선택 → 실제 뽑기 애니메이션·결과를 MediaRecorder로 녹화 → `녹화 종료` 또는 공유 종료 시 WebM 파일 저장
- 화면녹화 API 미지원 브라우저에서는 녹화 버튼을 비활성화하고 기능을 과장하지 않음
- 과거 GitHub Pages `/random-ppobgi/...` 경로는 가능한 진입면에서 Cloudflare production으로 path/query/hash를 보존해 넘김

녹화는 서버 스트리밍이 아니라 사용자의 브라우저가 사용자가 승인한 화면을 로컬에서 녹화하는 방식이다. 운영 사이트는 화면·당첨결과 영상을 서버에 업로드하거나 저장하지 않는다.

자동 Production QA는 화면공유 시스템 선택창 자체를 대신 승인하지 않는다. 대신 실제 production에서 화면녹화 API 계약을 모의해 녹화 시작/종료 상태, 참가자 목록 저장·복원, 결과 복사·공유 버튼, 최근 결과 기록, 모바일 overflow를 검사했다.

같은 revision 결과:
- i18n-smoke #107: **SUCCESS** — Static Guardrails / Browser Behavior QA / Combined Quality Gate 모두 PASS
- Production Browser Smoke #24: **SUCCESS**
- Security Guardrails #40: **SUCCESS**
- Cloudflare Pages exact commit deploy: **SUCCESS**

실제 OS 화면공유 선택창·권한 승인과 물리 기기의 녹화 파일 재생 품질은 자동 QA가 PASS로 과장하지 않는다. 사용 브라우저가 `getDisplayMedia + MediaRecorder`를 제공해야 하며 모바일은 브라우저별 지원 차이가 있다.

## 제품 범위

- 8개 게임 + 5개 게임도구 공통 코어
- 17개 언어 URL: `ko / en / ja / es / zh / fr / de / pt / id / hi / pl / it / nl / tr / vi / th / ar`
- 해외판도 축소 SEO 미니앱이 아니라 동일 기능 코어를 사용
- IP 강제 언어 리다이렉트 없음
- 고정 언어 URL과 검색 가능한 HTML 구조 유지

## 기술·QA 현재선

- 정적/로컬 i18n·기능 QA 운영
- Cloudflare exact revision 확인 뒤 공개 Production Browser Smoke 실행
- 대표 다국어 모바일 상호작용, 언어선택기, 한국어 leakage, 8개 picker + 5개 game tool, 실행·결과·재추첨, pageerror, overflow 등을 검사
- 같은 revision에 대한 충분한 PASS 증거가 있으면 시간경과만으로 반복 검증하지 않음
- 인간 미세 시각·원어민 자연스러움은 자동 QA가 임의 PASS하지 않음

기술 head·CI·배포 identity는 이 repo의 최신 `main + Actions + PROJECT_STATUS.md`를 우선한다. 운영 우선순위·Gate·다음 행동은 Supabase `hwangje_ops`의 현재 projection을 우선하며, 이 문서에 오래된 실행 SHA나 옛 Vault 상태 JSON을 current 값처럼 고정하지 않는다.

## 시장 telemetry

핵심 aggregate 이벤트:
- `game_start`
- `game_complete`
- `reroll`
- `exclude_reroll`

Production D1: `random-ppobgi-analytics`.

수집 payload는 허용된 범주값만 받으며 이름·입력문구·당첨내용·사용자 ID·세션 ID·광고 ID·쿠키는 수집하지 않는다.

과거 Production Browser QA가 실제 행동계측에 섞이는 문제가 확인돼 제외처리를 배포했다. **2026-09-09 이후를 clean telemetry baseline**으로 사용한다. 변경 전 수치를 외부 사용자 수요로 역산하지 않는다.

raw telemetry는 실제 D1/집계 원천이 기술 원본이며, 제품 운영 판단에 필요한 현재 snapshot·stale 여부·다음 행동은 Supabase `hwangje_ops`에서 회수한다. 과거 Vault analytics JSON을 현재 live-state owner로 복원하지 않는다.

## 검색 유통

- `robots.txt`
- `sitemap.xml`
- Google Search Console 소유확인
- Naver/Bing 핵심 등록·sitemap 제출
- Daum 신청 접수
- IndexNow 자동 제출

제출 성공 ≠ 크롤링 ≠ 색인 ≠ 노출 ≠ 실제 유입이다. 현재 다음 판단은 등록 수가 아니라 clean 실제 사용·색인·노출·유입 변화로 한다.

## AdSense — 현재

**`ADSENSE_REVIEW_SUBMITTED`**

- 사이트 추가 완료
- 공식 AdSense 코드 반영
- `ads.txt` 반영
- Production 소유확인 통과
- 검토 요청 제출 완료
- 자동 광고는 인페이지 중심
- 앵커·사이드레일·모바일 전면광고 비활성화
- `ads.txt` UI 재탐색 결과 대기

승인 완료나 광고수익 발생으로 승격하지 않는다.

## 현재 다음 Gate

구체 현재 Gate·우선순위는 Supabase live-state를 회수한다. 장기 판단기준은 다음과 같다.

1. 2026-09-09 clean baseline 이후 실제 외부 행동신호 관찰
2. 실제 검색 색인·노출·유입 변화 관찰
3. AdSense 심사와 `ads.txt` 재탐색 결과 관찰
4. Production/CI에 실제 FAIL이 발생하면 원인분리 후 최소복구
5. 실제 브라우저 화면녹화 사용에서 권한·저장·재생 문제가 발견되면 해당 증거로 재개
6. 원어민 자연스러움이나 인간 시각검증은 그것이 다음 판단을 실제로 바꿀 때만 연다

> **현재 제품은 더 만드는 단계보다 외부 사용·검색·수익화 증거를 기다리는 단계다. 활동량을 만들기 위해 닫힌 기술 Gate를 반복해서 열지 않는다.**