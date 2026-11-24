# 모아 검증 보고서

2026-11-24 KST. **Impeccable 지침으로 다듬은 기록장 UI를 Cloudflare 공개 예시와 소유자 전용 앱에 배포했다. 전체 상용 검증 완료를 의미하지 않는다.**

## 현재 배포

- 운영 주소: https://moa-diary-web.pages.dev/
- 저장소/브랜치: `gsh4124-cyber/page-tools` / `feature/moa-integration-20261119`
- 실제 배포 코드: `334b3127e8f3df54cfb4816596b3f7021403bd6e`
- Cloudflare 배포 ID: `6e548cf7-b8a7-49e8-b157-2968ab0e3de2` / success
- source SHA-256: `66c40ecbf1d70286f92287be65aa4fec94998f2b678167165fe8fd5e2476c7fb`
- Worker SHA-256: `964de30056e7a360fd7e2a24537302320be28dcf35f82c7d4238c947ab41cbcf`

이번 소개 화면의 제공자 빌드 로그를 확인했다. 이전 소유자 입장 릴리스(fdf069f)에서는 실제 로그인 후 `/build-manifest.json`도 확인했다. 같은 코드 커밋으로 다시 만든 로컬 Worker의 SHA-256도 제공자 로그와 정확히 일치했다. 보고서만 저장하는 후속 커밋은 `[CF-Pages-Skip]`으로 재배포하지 않는다. 실제 배포 소스와 보고서 커밋을 혼동하지 않는다.

## 이번에 실제로 확인한 결과

| 검사 | 결과 / 범위 |
|---|---|
| 자동 단위·PostgreSQL 엔진·Worker | DONE · 19개, redirect/인증 저장 키 회귀 검사 포함. 로컬 PostgreSQL 엔진 검사는 hosted 서버와 구분 |
| 배포 패키지 Chrome 검사 | DONE · 7개 검사군. 실제 최종 Worker 실행, 비인증 파일 차단·304/320/390/768/1280px 3개 화면·사진에서 기록 이동·빈 날짜/기록 있는 날짜·습관 체크/초기화·키보드·선택형 로그인 창·쿠키·로그아웃. 인증 RPC는 모의 |
| 실제 앱 기기 모드 Chrome 검사 | DONE · 11개 검사군, 콘솔 미처리 오류 0. 홈/도구 화면 분리·모든 메뉴의 5개 폭·초안 유지·최근 기록/사진 열기를 추가 검사했다. 304/320/390/768/1280px, 습관 저장, 글/사진/영상/다꾸·XSS, 수정/삭제/검색/날짜, 영상 재생/정지·동작 줄이기, 암호화 미디어 백업/복원, 잘못된 파일 거부, 탭 충돌, 키보드. 격리된 임시 브라우저의 IndexedDB이며 hosted Supabase 시험이 아님 |
| 이번 실제 소유자 앱 UI | DONE · 기존 세션 재연결, 비공개 클라우드, build `66c40ecbf1d7`, 오늘/이번 주/빈 최근 기록 표시. 작성→홈→작성의 임시 제목 유지 후 비움(저장 없음), 이번 주 11/23→월간 달력·해당 날짜 기록 이동, 보관함 진입과 기록 0 확인. 새 로그인 메일/개인 기록 쓰기는 실행하지 않음 |
| 사진·긴 제목 추가 검사 | DONE · 3개 검사군, 오류 0. 임시 IndexedDB에 합성 글 2개와 실제 CC0 JPEG 2개. 최근 사진 로딩·긴 제목·모든 작업 화면의 5개 폭·키보드로 해당 기록 열기. 운영 계정에 예시를 쓰지 않음 |
| Supabase SDK 모의 계약 | DONE · 6개. 기기/계정 데이터 분리, 세션 재접속, 탭 간 로그아웃 시 최근 기록·초안·파일·복원 암호 제거, 다른 사용자 격리, 네트워크 오류 시 초안 유지. 로컬로 가로챈 API이며 hosted 서버 재시험이 아님 |
| 실제 소유자 로그인 (이전 fdf069f 릴리스) | DONE · 사용자가 Gmail 확인을 요청한 뒤 연결된 Gmail에서 수신 메일을 확인하고 링크를 실제 페이지에 입력해 인증. 링크를 저장소/증거 파일에 저장하지 않음 |
| 실제 Cloudflare 클라우드 연결 (이전 fdf069f 릴리스) | DONE · 원래 소유자의 ‘내 계정’과 ‘내 계정의 비공개 클라우드에 저장됩니다.’ 표시, 용량 조회. 새로고침 뒤에도 유지 |
| 실제 달력 (이전 fdf069f 릴리스) | DONE · 11월→12월→11월 이동, 날짜 표시, 기존 빈 기록 상태 유지 |
| 실제 비인증 문서 접근 | DONE · 최초 운영 주소 루트·app.js 방문 및 최종 배포의 별도 alias app.js 방문이 소유자 입장 화면으로 이동. 정확한 HTTP 코드/헤더 검사와 구분 |
| 실제 Supabase 재조회 (이전 체크포인트) | DONE · owner 계정 보존, health ready/protocol 2, 모아 3테이블 RLS/FORCE RLS, Storage 비공개 유지 |
| npm audit | DONE · 11월 23일 의존성 취약점 0 |
| 기존 코드 보존 | DONE · 이번 feature 작업은 moa/ 안으로 한정. 기존 세 제품·공통 tools·workflows diff 0, main에 병합하지 않음 |

실제 브라우저에서 오류 두 개를 발견해 수정했다. 첫째, Workers가 지원하지 않는 `redirect:error`를 사용해 서버 요청 이전에 실패하던 문제를 `manual`과 명시적 3xx 거부로 고쳤다. 둘째, 입장 화면과 앱의 로그인 저장 키가 달라 기기 모드로 열리던 문제를 기존 `moa-auth-v1`로 통일했다. 수정 후 실제 소유자 클라우드 연결과 재접속을 확인했다. [Workers Request 지침](https://developers.cloudflare.com/workers/runtime-apis/request/).

## 소개 화면과 다이어리 UI 개선

사용자는 사진 테이프는 유지하고 보라색과 AI가 만든 듯한 화면을 개선해 달라고 했다. [Impeccable](https://github.com/pbakaus/impeccable)의 distill/layout/typeset/craft-floor 지침을 읽고 수동 적용했다. 큰 노란 배너·격자 배경·별 장식·반복 카드·중복 바로가기를 줄였다. 흰 바탕·잉크색 본문·코랄 행동/선택 표시, 사진의 노란 테이프만 남기고 글·날짜를 먼저 읽게 했다. PC 왼쪽 메뉴와 모바일 하단 메뉴는 같은 SVG 선 아이콘/텍스트를 쓴다. 본문은 16px, 제목/보조 문구는 일관된 한국어 고딕 계층을 쓴다. 색 대비는 소스 기준 4.52 이상인 주요 조합을 확인했으나 전체 WCAG 인증은 아니다.

Impeccable `4.10.0` 설치는 npm registry DNS `ENOTFOUND`로 실패했다. context 실행기는 없었고 기존 저장소·사용자 피드백을 직접 읽는 대체 경로를 사용했다. **Impeccable CLI/context/detector 결과는 NOT_TESTED**이며 자동 설계 검사 통과로 보고하지 않는다. 외부 코드 실행·전역 설치·hook·live 모드·유료 API는 사용하지 않았다. Apache-2.0/Paul Bakaus 출처와 정확한 수동 적용 범위는 `ui/README.md`에 기록했다.

공개 예시는 광고 배너 대신 월별 기록 색인과 기록/달력/사진 탭, 날짜·제목·본문·인화 사진으로 구성했다. 합성 글임을 명시하고 예시 조작은 저장하지 않는다. 사진을 누르면 해당 날짜의 예시 일기로 이동하며 달력 선택도 동기화한다. 실제 홈은 오늘/날짜/기록 쓰기, 이번 주 7일, 최근 3개 기록 목록이다. 사진이 있는 기록에만 썸네일과 테이프를 보인다. 빈 기록을 허구로 채우지 않는다. 폼·달력·습관·보관함은 기존 메뉴에서 열며 초안과 저장 기능을 유지한다. 저장 알림이 제목을 가리는 장면을 발견해 하단으로 옮겼다. 파생 앱의 스타일을 `service.css`로 통합했다. 원본 v7과 사용자의 개별 꾸미기 데이터는 보존했다.

기존 [Day One Web](https://dayoneapp.com/guides/day-one-on-the-web/getting-started-on-the-web/), [Journey](https://journey.cloud/), [Daylio](https://daylio.net/) 흐름 참고와 [MDN CC0 예시 사진](https://github.com/mdn/interactive-examples/tree/main/live-examples/media/cc0-images) 2개를 유지한다. 로고·화면·코드를 복제하지 않았다. 예시 사진은 data URI로 내장해 외부 이미지 요청/CSP 완화가 없다.

실제 운영 주소의 앱 내 브라우저에서 clientWidth=scrollWidth=304px, 새 제목/본문/사진, 사진→11/21 바다 기록→달력 선택 동기화, 11/23 선택→아침 기록, 선택형 로그인 창·이메일 포커스·닫기를 확인했다. 메일은 보내지 않았다. 실제 배포 alias의 Chrome은 clientWidth=scrollWidth=943px이며 공개 기록장 배치를 시각 확인했다. 현재 습관 체크/초기화·빈 날짜는 최종 로컬 패키지에서 검증했고 이전 실제 호스트 결과와 구분한다.

기존 소유자 브라우저는 새로고침 뒤 정상 세션 재연결되어 새 비공개 앱으로 돌아왔다. 홈의 폼 숨김, 기록 쓰기·임시 제목 유지·비움, 이번 주 날짜에서 해당 달력/기록으로 이동, 보관함과 기록 0을 확인했다. 메뉴 키보드 이동과 보관함→홈 포인터 이동도 확인했다. 운영 계정에 글/사진/습관을 저장하거나 복원을 실행하지 않았다. 실제 최근 사진이 있는 계정의 검증은 로컬 합성 기록 검사와 구분한다. 새 이메일 로그인 전체 재실행도 아니다.

제공자 로그의 success, 코드 `334b312`, Worker SHA-256 `964de30056e7a360fd7e2a24537302320be28dcf35f82c7d4238c947ab41cbcf`를 확인했으며 같은 커밋의 로컬 재빌드와 일치했다. 최종 패키지 7개 검사군도 이 커밋의 빌드로 다시 통과했다. 로컬 앱/사진/계약 검사 파일에는 커밋 전 revision `9ca6b83`이 정확히 남아 있고, 코드가 `334b312`에 저장된 것을 구분한다. 실제 스크린샷은 `qa-evidence/hosted-journal-preview-943.jpg`, `hosted-journal-preview-304.jpg`, 로컬 합성 사진 화면은 `populated-home-390.png` 등이다. 증거 파일은 로컬에 있으며 Git에 포함하지 않는다.

최신 vault main의 START_HERE와 관련 UI/운영 원칙, Supabase active 상태와 `hwangje_ops.context_packet`의 vibecoding 실행 상태를 읽기 전용으로 확인했다. 모아 전용 work_items 검색 결과는 0행이었다. 새 실행 행을 만들거나 Supabase 설정/스키마/데이터를 바꾸지 않았다.

## 접근 보호·비용·보존

사용자 선택대로 **앱 전체와 파일은 소유자 전용**이다. 서비스 소개·명시적 예시·선택형 로그인 UI와 해당 코드만 비인증 요청에 제공한다. 공개 로그인 UI를 일반 사용자용 모아 앱으로 확대하지 않았다. 모든 앱 파일을 Worker에 내장하고 정적 fallback은 앱 없는 안내 페이지만 둔다. 정확한 소유자 UUID를 사전 검사하고, 실제 JWT 서명/프로젝트/현재 Auth 세션은 기존 `moa_account_status` RPC가 검증한다. 실패·만료·위조·다른 사용자·RPC 장애는 차단한다. 쿠키는 Secure/HttpOnly/SameSite=Strict, Origin 검사와 요청 크기 제한을 적용했다.

새 모아 프로젝트만 Fail closed로 저장했다. 자동 배포는 지정 feature 브랜치만 유지하고 다른 브랜치 미리보기를 중지했다. 빌드 감시 경로 `moa/*`도 확인했다. 초기 전체 브랜치 기본값 때문에 타 제품 feature의 모아 빌드가 실패한 이력이 있었으며, 기존 제품의 실제 배포나 코드는 변경하지 않았다. 기존 세 제품의 설정은 만지지 않았다.

PR #34의 실패 간섭도 재확인했다. 파일 감시만 제한한 뒤 만든 이전 빈 커밋은 Cloudflare의 ‘변경 파일 0개면 경로 검사 생략’ 규칙 때문에 모아 빌드를 다시 시도했다. 현재는 미리보기 분기를 None으로 막았으며, 기존 실패의 수동 재실행은 강제 빌드라 같은 실패가 남았다. 이후 파일 트리를 전혀 바꾸지 않는 검사 갱신 커밋 `8e5a90762ed6469ad2cd42c79537ad23032d948b`를 PR 브랜치에 추가했고 GitHub 비교 결과 변경 파일 0개를 확인했다. 이 새 자동 이벤트에서 모아는 실제 skipped(ID `8cf8f745-65ce-489e-9526-6c02fe3a9006`)였고, 최신 GitHub 검사에는 모아 실패가 없으며 성경 읽기 미리보기 배포는 성공했다. 새 성경 QA는 Static Guardrails·Behavior QA·Chromium/Firefox/WebKit 모바일 검사·Combined Quality Gate 모두 성공했고, Product Health Monitor도 성공했다. 기존 실패 댓글/커밋 이력은 삭제하지 않는다. 기존 제품 코드·설정, Supabase, 실제 모아 운영 배포는 변경하지 않았다. [Cloudflare 경로 필터 예외](https://developers.cloudflare.com/pages/configuration/build-watch-paths/), [분기 제어](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

기존 Workers Free의 계정 공유 100,000회/일 한도를 사용한다. 초과 시 접속이 실패할 수 있고 자동 유료 전환을 신청하지 않았다. 카드·유료 요금제·Access 결제/초과 과금 동의·새 Supabase 자원을 만들지 않았다. Access Free 결제 단계는 완료하지 않았다. Direct Upload `moa-diary`는 업로드/배포 없는 초안으로 남았고 실제 운영은 Git 연결 `moa-diary-web`이다. 기존 Sites 검토 사이트는 그대로 남겼다.

원본 v7 SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db` 일치를 자동 검사했다. 실제 소유자 기록에 시험 글·습관·미디어를 쓰거나 삭제하지 않았다. 공유 Auth 설정·비밀번호·다른 제품 데이터는 바꾸지 않았다. 이전 실제 로그인과 이번 기존 세션 자동 재연결은 정상 Auth 동작이며, 공유 인증 설정은 수정하지 않았다.

## 기존 실제 검증과 구분

11월 20일 체크포인트에서 로컬 브라우저 9개, 모의 클라우드 계약 6개, 실제 Supabase Auth/REST/RPC/GraphQL/Storage 12개를 통과했다. 실제 미디어 저장·사용자 격리·수정/삭제·암호화 백업/복원·자동 재생·세션 폐기 등을 확인했다. 추가 계정/복구/운영 기능 6개와 오류 0, 별도 빈 QA 계정으로 문서 1개/PNG 1개를 복원해 SHA-256 일치를 확인했다. 스트림 전송 시작 후 취소, 1920px 사진 최적화, 복구 메일, 탈퇴/재시작도 확인했다.

이전 버전의 실제 48/96MiB 할당량 검사 8개, 이전 Sites 배포 후 6개+정리 2개는 과거 결과다. **새 Cloudflare 호스트에서 미디어/백업/사용자 격리를 전부 다시 실행한 결과로 계산하지 않는다.** 정확한 과거 결과는 qa-results.json에 보존한다. 과거 hosted UI 스크립트 3개는 새 메뉴 동선으로 갱신하고 구문 검사했으나 이번에 실서버 실행하지 않았다.

QA 계정 4개는 이전에 암호 폐기·전역 로그아웃·영구 로그인 차단했고, QA 문서/미디어/예약/세션 0을 확인했다. 이번에 재활성화하지 않았다. 이전 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다.

## 미검증과 한계

| 항목 | 상태 / 이유 |
|---|---|
| 새 Cloudflare 호스트에서 최근 기록/사진이 있는 홈·글/미디어/수정/삭제/백업/복원/다른 사용자 계정 전체 재실행 | NOT_TESTED · 실제 소유자 데이터에 시험 내용을 쓰지 않음. 기존 hosted Supabase 결과와 구분 |
| 새 호스트의 정확한 HTTP 응답 코드·보안 헤더, 실제 logout/refresh/CSRF 요청 | NOT_TESTED · 로컬 패키지/단위 검사는 통과. 직접 네트워크 검사 명령은 DNS ENOTFOUND |
| 실제 호스트의 320/390/768/1280px | NOT_TESTED · 이번 실제 측정은 304/943px. 로컬 304/320/390/768/1280px 통과와 구분. 이전 override가 958px로 유지된 한계도 보존 |
| Impeccable 전용 CLI/context/detector·전체 접근성 인증 | NOT_TESTED · 패키지 DNS 실패. 지침 수동 적용/제품 검사/주요 색 대비 확인과 구분 |
| 새 호스트 진단 파일 다운로드 | INCONCLUSIVE · 브라우저 다운로드 이벤트 대기 시간 초과. 기능 오류로 확정하지 않음 |
| Android/iOS 실기기·네이티브 선택기·터치·키보드·코덱/메모리 | NOT_TESTED · 사용자 실기기 제공 불가 |
| 자연 만료·물리적 망 단절·모바일 OS 종료·모든 동시 쓰기 순서 | NOT_TESTED · 강제 세션/스트림 취소/잠금 검증과 구분 |
| off-site/PITR·공급자 장애·실사용 파일럿 | NOT_TESTED · 별도 비용/운영 준비 및 실제 사용자 검증 필요 |
| 기존 Sites 후보 업데이트 | BLOCKED · 이전 도구 정책 제한. Cloudflare 별도 배포로 우회 호스팅 완료 |

프로젝트 전체의 기존 advisor 경고는 별도 운영 과제다. 모아의 authenticated GraphQL 스키마 탐색과 다른 사용자 행 접근은 구분한다. 일반 공개 서비스 전 개인정보 처리방침·지원 창구·운영 책임·SMTP/백업/모니터링·실기기/파일럿 검증이 남아 있다. 현 상태는 소유자 전용 검토 운영이다.
