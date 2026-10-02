# GLOBAL SEARCH READINESS — random-ppobgi

- 기준일: 2026-09-03
- 목적: 랜덤뽑기의 글로벌 작업을 `언어 배포 / 검색생태계 대응 / 실제 검색 유통`으로 분리해 관리한다.
- 운영 주소: https://random-ppobgi.pages.dev/

## 1. 언어 배포

상태: **PASS**

한국어 포함 17개 언어가 동일한 8개 뽑기 게임 + 5개 게임도구 코어를 사용한다.

`ko / en / ja / es / zh / fr / de / pt / id / hi / pl / it / nl / tr / vi / th / ar`

정적 QA 및 Chromium 다국어 QA는 PASS했고, 모바일 공개화면은 황제가 직접 최신 배포를 확인했다.

## 2. 기본 검색 유통

상태: **ACTIVE**

- `robots.txt`: `User-agent: * / Allow: /`로 일반 크롤러 접근 허용
- `sitemap.xml`: 한국어 루트 + 16개 해외 언어 + 핵심 정보페이지, 총 22개 URL
- Google Search Console: VERIFIED
- IndexNow: 자동 제출 workflow 활성화
- 첫 IndexNow 실제 실행: HTTP 202 / 22개 URL 제출 성공

주의: 제출 성공은 색인·노출·유입 성공과 동일하지 않다.

## 3. 검색생태계별 상태

### Google

상태: **VERIFIED / MONITORING_READY**

Search Console 소유확인 완료. 실제 색인·노출·검색 유입은 Search Console 데이터로 후속 검증한다.

### Bing

상태: **DISCOVERY_ACTIVE / WEBMASTER_CENTRAL_GATE**

IndexNow 자동 제출로 URL 발견 경로는 활성화되어 있다. Bing Webmaster Tools는 Google Search Console에서 검증 사이트를 import할 수 있으나 로그인 작업이므로 중앙 운영 Gate다.

### Naver

상태: **CRAWL_READY / SEARCH_ADVISOR_CENTRAL_GATE**

네이버 웹검색은 별도 '검색 등록' 절차가 없어도 로봇이 자동 수집할 수 있다. Search Advisor 등록·소유확인은 수집/색인/노출 리포트를 보기 위한 운영 도구로 중앙에서 처리한다. 사이트맵은 이미 준비되어 있다.

### Daum

상태: **CENTRAL_MANUAL_GATE**

외부 등록/계정 절차가 필요한 영역은 중앙 운영에서 일괄 처리한다.

### Yandex

상태: **DISCOVERY_ACTIVE / WEBMASTER_BLOCKED_BY_DOMAIN**

Yandex 공식 문서는 IndexNow를 신규·변경 URL 알림 방법으로 지원한다. 따라서 현재 IndexNow 자동 제출은 Yandex 발견 경로에도 유효하다.

다만 Yandex Webmaster는 공식 가이드상 `자체 도메인(own domain)` 사이트만 추가할 수 있다. 현재 운영 주소가 `random-ppobgi.pages.dev` 서브도메인이므로 Webmaster 등록·성과 리포트는 현재 구조에서 BLOCKED다.

결론: 러시아어권 대응을 위해 당장 별도 코드 변경은 필요하지 않다. 자체 도메인을 도입하면 Yandex Webmaster 등록을 다시 검토한다. 현재 랜덤뽑기는 러시아어 UI 자체는 제공하지 않으므로 러시아어 추가는 별도 수요 검증 후 결정한다.

### Baidu / 중국 본토

상태: **LANGUAGE_READY / DISTRIBUTION_BLOCKED_BY_INFRA + CENTRAL_ACCOUNT_GATE**

중국어 `/zh/` UI는 이미 제공한다. Baidu Search Resource Platform은 사이트 등록·소유확인 후 링크 제출/데이터 도구를 제공하며, 제출은 발견을 빠르게 할 수 있지만 색인을 보장하지 않는다.

더 큰 제약은 현재 호스팅이다. Cloudflare 공식 문서상 `pages.dev` 기반 Pages는 중국 본토에서 제공되지 않는다. 따라서 중국어 번역이 존재해도 현재 주소를 중국 본토 시장 대응 완료로 판정하지 않는다.

중국 본토를 실제 목표시장으로 승격하려면 다음을 별도 Gate로 검토한다.

1. 자체 도메인 도입 여부
2. 중국 본토에서 안정적으로 접근 가능한 배포 경로
3. 필요 시 ICP/현지 인프라 요건
4. Baidu 계정·사이트 소유확인 및 링크 제출

현재 단계에서는 중국어 URL을 유지하되 `중국어 언어 배포 PASS / 중국 본토 검색유통 BLOCKED`로 분리한다.

## 4. 자체 도메인 Gate

현재 `pages.dev`는 일반 글로벌 운영에는 사용 가능하지만 다음 문제를 남긴다.

- Yandex Webmaster에 사이트를 추가할 수 없음
- 중국 본토 Pages 접근성 문제
- 장기적으로 브랜드/도메인 이전 시 검색자산 이관 필요 가능성

따라서 **자체 도메인 도입은 글로벌 검색생태계 확장의 다음 인프라 Gate**다. 다만 도메인 구매·비용·브랜드 결정이 필요하므로 황제 승인 없이 자동 집행하지 않는다.

자체 도메인만 붙인다고 중국 본토 문제가 자동 해결되는 것은 아니다. 중국은 접근 가능한 인프라와 현지 요건을 별도로 확인해야 한다.

## 5. 지금 코드에서 추가 변경이 필요 없는 이유

- `User-agent: *`가 이미 Baidu/Yandex 포함 일반 로봇을 허용한다.
- Sitemap 위치가 robots에 명시되어 있다.
- IndexNow 자동 제출이 활성화되어 있고 Yandex도 IndexNow를 지원한다.
- 검색엔진별로 중복 `User-agent` 규칙을 추가하는 것은 현재 이점이 없고 규칙 충돌 위험만 늘릴 수 있어 하지 않는다.

## 6. 다음 Gate

1. 중앙 운영: Naver Search Advisor / Daum / Bing Webmaster 등록
2. 실제 Search Console 및 검색엔진 데이터에서 색인·노출 확인
3. 자체 도메인 도입 여부를 비용·브랜드·글로벌 검색 효익 기준으로 결정
4. 중국 본토를 실제 우선시장으로 볼 경우 별도 호스팅/규제 검토
5. 러시아어권 실제 수요가 확인될 경우 `ru` 현지화 추가 여부 판단

## 판정

- 언어 배포: `PASS`
- 기본 검색 발견 경로: `ACTIVE`
- Google 운영도구: `VERIFIED`
- Bing/Yandex 발견 경로: `ACTIVE via IndexNow`
- Naver/Daum/Bing Webmaster: `CENTRAL_GATE`
- Yandex Webmaster: `BLOCKED_BY_PAGES_DEV_DOMAIN`
- 중국 본토 검색유통: `BLOCKED_BY_PAGES_INFRA + CENTRAL_ACCOUNT_GATE`
- 실제 색인·유입·시장성: `NOT_YET_VALIDATED`

## 2026-09-03 중앙 수동등록 실행

- Naver Search Advisor 로그인 및 사이트 등록 시작 완료.
- 발급된 소유확인 meta를 `index.html`에 추가했다.
- 저장소 commit: `ec3e40ff37bcbba444044f067544b349262b47a3`
- 실제 운영 URL에서 meta 배포 확인 완료.
- Search Advisor의 최종 소유확인 버튼 클릭 직전 Cloud Browser 연결 timeout으로 중단됐다.
- 현재 상태: `REGISTERED_PENDING_FINAL_VERIFY`
- 최종 소유확인, sitemap 제출, URL 수집 요청은 Browser 연결 복구 후 이어서 실행한다.
