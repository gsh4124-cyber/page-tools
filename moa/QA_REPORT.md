# 모아 검증 보고서

2026-11-23 KST. **Cloudflare 소유자 전용 배포 완료. 전체 상용 검증 완료를 의미하지 않는다.**

## 현재 배포

- 운영 주소: https://moa-diary-web.pages.dev/
- 저장소/브랜치: `gsh4124-cyber/page-tools` / `feature/moa-integration-20261119`
- 실제 배포 코드: `fdf069f5a01f61c98b6f9bcb2eac160fcc28c74c`
- Cloudflare 배포 ID: `c72ac756-5bf3-4453-afb0-dfacfbbd9dea` / success
- source SHA-256: `f2d27b2d3ca7582703e26b0040734f2064c394833df9632e221d65fb9719d1a7`
- Worker SHA-256: `06905245b52a82a5463342f44ecf12a88d4f1e8ca974ee84f802350c9cdfc7bf`

제공자 빌드 로그와 실제 로그인 후 `/build-manifest.json`을 확인했다. 같은 코드 커밋으로 다시 만든 로컬 Worker의 SHA-256도 제공자 로그와 정확히 일치했다. 보고서만 저장하는 후속 커밋은 `[CF-Pages-Skip]`으로 재배포하지 않는다. 실제 배포 소스와 보고서 커밋을 혼동하지 않는다.

## 이번에 실제로 확인한 결과

| 검사 | 결과 / 범위 |
|---|---|
| 자동 단위·PostgreSQL 엔진·Worker | DONE · 19개, redirect/인증 저장 키 회귀 검사 포함. 로컬 PostgreSQL 엔진 검사는 hosted 서버와 구분 |
| 배포 패키지 Chrome 검사 | DONE · 4개 검사군. 실제 Worker 패키지 실행, 비인증 파일 차단·320/390/768/1280px 입장 화면·쿠키·로그아웃. 인증 RPC는 모의 |
| 실제 소유자 로그인 | DONE · 사용자가 Gmail 확인을 요청한 뒤 연결된 Gmail에서 수신 메일을 확인하고 링크를 실제 페이지에 입력해 인증. 링크를 저장소/증거 파일에 저장하지 않음 |
| 실제 Cloudflare 클라우드 연결 | DONE · 원래 소유자의 ‘내 계정’과 ‘내 계정의 비공개 클라우드에 저장됩니다.’ 표시, 용량 조회. 새로고침 뒤에도 유지 |
| 실제 달력 | DONE · 11월→12월→11월 이동, 날짜 표시, 기존 빈 기록 상태 유지 |
| 실제 비인증 문서 접근 | DONE · 최초 운영 주소 루트·app.js 방문 및 최종 배포의 별도 alias app.js 방문이 소유자 입장 화면으로 이동. 정확한 HTTP 코드/헤더 검사와 구분 |
| 실제 Supabase 재조회 | DONE · owner 계정 보존, health ready/protocol 2, 모아 3테이블 RLS/FORCE RLS, Storage 비공개 유지 |
| npm audit | DONE · 11월 23일 의존성 취약점 0 |
| 기존 코드 보존 | DONE · 이번 feature 작업은 moa/ 안으로 한정. 기존 세 제품·공통 tools·workflows diff 0, main에 병합하지 않음 |

실제 브라우저에서 오류 두 개를 발견해 수정했다. 첫째, Workers가 지원하지 않는 `redirect:error`를 사용해 서버 요청 이전에 실패하던 문제를 `manual`과 명시적 3xx 거부로 고쳤다. 둘째, 입장 화면과 앱의 로그인 저장 키가 달라 기기 모드로 열리던 문제를 기존 `moa-auth-v1`로 통일했다. 수정 후 실제 소유자 클라우드 연결과 재접속을 확인했다. [Workers Request 지침](https://developers.cloudflare.com/workers/runtime-apis/request/).

## 접근 보호·비용·보존

사용자 선택대로 **앱 전체와 파일은 소유자 전용**이다. 입장 UI와 해당 인증 코드만 비인증 요청에 제공한다. 공개 로그인 UI를 일반 사용자용 모아 앱으로 확대하지 않았다. 모든 앱 파일을 Worker에 내장하고 정적 fallback은 앱 없는 안내 페이지만 둔다. 정확한 소유자 UUID를 사전 검사하고, 실제 JWT 서명/프로젝트/현재 Auth 세션은 기존 `moa_account_status` RPC가 검증한다. 실패·만료·위조·다른 사용자·RPC 장애는 차단한다. 쿠키는 Secure/HttpOnly/SameSite=Strict, Origin 검사와 요청 크기 제한을 적용했다.

새 모아 프로젝트만 Fail closed로 저장했다. 자동 배포는 지정 feature 브랜치만 유지하고 다른 브랜치 미리보기를 중지했다. 빌드 감시 경로 `moa/*`도 확인했다. 초기 전체 브랜치 기본값 때문에 타 제품 feature의 모아 빌드가 실패한 이력이 있었으며, 기존 제품의 실제 배포나 코드는 변경하지 않았다. 기존 세 제품의 설정은 만지지 않았다.

기존 Workers Free의 계정 공유 100,000회/일 한도를 사용한다. 초과 시 접속이 실패할 수 있고 자동 유료 전환을 신청하지 않았다. 카드·유료 요금제·Access 결제/초과 과금 동의·새 Supabase 자원을 만들지 않았다. Access Free 결제 단계는 완료하지 않았다. Direct Upload `moa-diary`는 업로드/배포 없는 초안으로 남았고 실제 운영은 Git 연결 `moa-diary-web`이다. 기존 Sites 검토 사이트는 그대로 남겼다.

원본 v7 SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db` 일치를 자동 검사했다. 실제 소유자 기록에 시험 글·습관·미디어를 쓰거나 삭제하지 않았다. 공유 Auth 설정·비밀번호·다른 제품 데이터는 바꾸지 않았다. 이번 실제 로그인으로 정상 Auth 세션이 생성되는 것은 본인 확인 동작의 일부다.

## 기존 실제 검증과 구분

11월 20일 체크포인트에서 로컬 브라우저 9개, 모의 클라우드 계약 6개, 실제 Supabase Auth/REST/RPC/GraphQL/Storage 12개를 통과했다. 실제 미디어 저장·사용자 격리·수정/삭제·암호화 백업/복원·자동 재생·세션 폐기 등을 확인했다. 추가 계정/복구/운영 기능 6개와 오류 0, 별도 빈 QA 계정으로 문서 1개/PNG 1개를 복원해 SHA-256 일치를 확인했다. 스트림 전송 시작 후 취소, 1920px 사진 최적화, 복구 메일, 탈퇴/재시작도 확인했다.

이전 버전의 실제 48/96MiB 할당량 검사 8개, 이전 Sites 배포 후 6개+정리 2개는 과거 결과다. **새 Cloudflare 호스트에서 미디어/백업/사용자 격리를 전부 다시 실행한 결과로 계산하지 않는다.** 정확한 과거 결과는 qa-results.json에 보존한다.

QA 계정 4개는 이전에 암호 폐기·전역 로그아웃·영구 로그인 차단했고, QA 문서/미디어/예약/세션 0을 확인했다. 이번에 재활성화하지 않았다. 이전 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다.

## 미검증과 한계

| 항목 | 상태 / 이유 |
|---|---|
| 새 Cloudflare 호스트에서 글/미디어/수정/삭제/백업/복원/다른 사용자 계정 전체 재실행 | NOT_TESTED · 실제 소유자 데이터에 시험 내용을 쓰지 않음. 기존 hosted Supabase 결과와 구분 |
| 새 호스트의 정확한 HTTP 응답 코드·보안 헤더, 실제 logout/refresh/CSRF 요청 | NOT_TESTED · 로컬 패키지/단위 검사는 통과. 직접 네트워크 검사 명령은 DNS ENOTFOUND |
| 실제 호스트의 320/390/768/1280px | INCONCLUSIVE · 브라우저 viewport override를 요청했지만 실제 측정은 958px로 유지됨. 로컬 4개 폭 결과와 구분, override는 복구 |
| 새 호스트 진단 파일 다운로드 | INCONCLUSIVE · 브라우저 다운로드 이벤트 대기 시간 초과. 기능 오류로 확정하지 않음 |
| Android/iOS 실기기·네이티브 선택기·터치·키보드·코덱/메모리 | NOT_TESTED · 사용자 실기기 제공 불가 |
| 자연 만료·물리적 망 단절·모바일 OS 종료·모든 동시 쓰기 순서 | NOT_TESTED · 강제 세션/스트림 취소/잠금 검증과 구분 |
| off-site/PITR·공급자 장애·실사용 파일럿 | NOT_TESTED · 별도 비용/운영 준비 및 실제 사용자 검증 필요 |
| 기존 Sites 후보 업데이트 | BLOCKED · 이전 도구 정책 제한. Cloudflare 별도 배포로 우회 호스팅 완료 |

프로젝트 전체의 기존 advisor 경고는 별도 운영 과제다. 모아의 authenticated GraphQL 스키마 탐색과 다른 사용자 행 접근은 구분한다. 일반 공개 서비스 전 개인정보 처리방침·지원 창구·운영 책임·SMTP/백업/모니터링·실기기/파일럿 검증이 남아 있다. 현 상태는 소유자 전용 검토 운영이다.
