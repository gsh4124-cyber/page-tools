# GLOBAL SEARCH DISTRIBUTION — bible-reader

기준일: 2026-09-03

이 문서는 바이블리더의 글로벌 검색 유통 기술상태를 기록한다.

## 상태 구분

- 언어 배포: 실제 언어 URL과 본체가 존재하는가
- 검색생태계 대응: robots / sitemap / URL 알림 / 소유확인 경로가 준비됐는가
- 검색 유통: 검색엔진이 제출을 수신했는가
- 실제 색인·노출·유입: 검색결과에 실제로 잡히고 사용자가 들어오는가

이 네 상태를 서로 같은 것으로 취급하지 않는다.

## 언어 배포

동일한 실제 성경 리더 본체를 다음 9개 UI 언어 URL에서 운영한다.

- ko: https://gsh4124-cyber.github.io/bible-reader/
- en: https://gsh4124-cyber.github.io/bible-reader/en/
- fr: https://gsh4124-cyber.github.io/bible-reader/fr/
- de: https://gsh4124-cyber.github.io/bible-reader/de/
- zh: https://gsh4124-cyber.github.io/bible-reader/zh/
- ru: https://gsh4124-cyber.github.io/bible-reader/ru/
- la: https://gsh4124-cyber.github.io/bible-reader/la/
- pt: https://gsh4124-cyber.github.io/bible-reader/pt/
- ar: https://gsh4124-cyber.github.io/bible-reader/ar/

## 공통 검색 기술

- `robots.txt`: 전체 크롤러 허용 + sitemap 위치 제공
- `sitemap.xml`: 9개 언어 URL 포함
- 각 언어 URL: canonical / reciprocal hreflang / title / description / html lang 유지
- Arabic: RTL 유지
- Google Search Console HTML 소유확인 태그 유지

## IndexNow — 활성

2026-09-03부터 배포 workflow에 IndexNow 자동 제출을 연결했다.

- 키 파일: `193977ee04feba4a99f471a555a2aa54.txt`
- keyLocation: `https://gsh4124-cyber.github.io/bible-reader/193977ee04feba4a99f471a555a2aa54.txt`
- 제출 endpoint: `https://api.indexnow.org/indexnow`
- 제출 대상: 9개 언어 진입 URL
- 실행 시점: GitHub Pages deploy 성공 후
- 문서/워크플로만 바뀐 commit에서는 중복 제출하지 않도록 제외
- 첫 실제 제출: workflow run `33657942702`, `notify-indexnow` job success
- 첫 응답: HTTP `202 Accepted`, 9 URLs submitted

202 응답은 URL 수신 및 키 검증 대기 상태이며 색인 완료를 뜻하지 않는다.

IndexNow 참여 검색엔진에는 Bing, Naver, Yandex 등이 있으므로 하나의 글로벌 endpoint 제출을 통해 참여 엔진에 URL 발견 신호를 보낸다. 실제 크롤링·색인·노출은 별도 확인한다.

## 검색엔진별 상태

### Google

- 언어 SEO 구조: 준비됨
- robots/sitemap: 준비됨
- Search Console HTML 소유확인: 과거 실제 확인 완료
- 실제 9개 언어 URL의 색인/노출 상태: 별도 관찰 필요
- IndexNow 대상 아님

### Bing

- robots/sitemap: 준비됨
- IndexNow 자동 제출: 활성
- Bing Webmaster Tools 계정 등록/사이트 리포트: 미확인, 필요 시 사용자 로그인 Gate
- 실제 색인/노출: 미확인

### Naver

- IndexNow 참여 엔진이므로 자동 URL 알림 경로: 활성
- Search Advisor의 별도 소유확인/리포트: 미확인, 필요 시 사용자 로그인 Gate
- 실제 색인/노출: 미확인

### Yandex

- `User-agent: *` 규칙으로 크롤링 허용
- robots의 Sitemap directive 및 sitemap.xml: 준비됨
- IndexNow 자동 제출: 활성
- Yandex Webmaster 별도 사이트 등록/소유확인/리포트: 미확인, 사용자 로그인 Gate
- 실제 러시아어 URL 색인/노출: 미확인

### Baidu

- 중국어 URL `/zh/`: 배포됨
- 일반 robots 규칙으로 Baiduspider를 차단하지 않음
- sitemap: 준비됨
- Baidu는 현재 IndexNow 자동 제출 완료 대상으로 취급하지 않는다.
- Baidu Search Resource Platform 등록·소유확인·URL 제출: 사용자 계정/로그인 Gate
- 중국 본토에서 GitHub Pages 호스팅의 안정적 접근성: 아직 실제 현지 검증 없음
- Baidu 실제 색인/노출: 미확인

## 남은 Gate / 현실검증

1. Bing Webmaster Tools가 실제 리포트까지 필요한 경우 로그인/사이트 등록
2. Yandex Webmaster 사이트 등록·소유확인
3. Baidu Search Resource Platform 사이트 등록·소유확인
4. 중국 본토에서 현재 GitHub Pages URL의 실제 접근성 검사
5. 검색엔진별 실제 색인·노출·유입 확인

계정 등록 성공, URL 제출 성공, 크롤링, 색인, 검색 노출, 실제 유입을 서로 구분한다.
