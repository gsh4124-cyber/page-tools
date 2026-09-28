# PROJECT STATUS — random-ppobgi

- 마지막 기술상태 갱신: 2026-09-10
- live-state owner 포인터 정합화: 2026-09-28
- 저장소 역할: 랜덤뽑기 웹서비스의 실제 코드·배포·기술상태 원본
- 상위 사업구조: 황제 Vault `직장/바이브코딩/_INDEX.md`, `직장/바이브코딩/페이지형/_INDEX.md`
- 빠르게 변하는 운영상태·Portfolio Mode·Gate·다음 행동: Supabase `hwangje_ops` / project key `vibecoding`
- 표준 로컬 경로: `C:/Users/gsh41/Desktop/황제/직장/바이브코딩/페이지형/random-ppobgi`
- 운영 주소: https://random-ppobgi.pages.dev/

## 현재 단계

**PUBLIC PRODUCTION / 17-LANGUAGE COMPLETE / PRODUCTION QA ACTIVE / CLEAN TELEMETRY OBSERVATION / SEARCH DISTRIBUTION OBSERVATION / ADSENSE_REVIEW_SUBMITTED**

현재 Portfolio Mode와 다음 행동은 Supabase live-state에서 회수한다. 실제 기술 FAIL이나 의미 있는 외부 신호 없이 새 기능개발이나 깊은 QA를 반복하지 않는다.

> 구현 완료 ≠ CI PASS ≠ 배포 완료 ≠ Production Browser QA PASS ≠ 실제 외부사용 ≠ 검색노출 ≠ 수익

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

이름·입력문구·당첨내용·사용자 ID·세션 ID·광고 ID·쿠키는 수집하지 않는다.

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
5. 원어민 자연스러움이나 인간 시각검증은 그것이 다음 판단을 실제로 바꿀 때만 연다

> **현재 제품은 더 만드는 단계보다 외부 사용·검색·수익화 증거를 기다리는 단계다. 활동량을 만들기 위해 닫힌 기술 Gate를 반복해서 열지 않는다.**
