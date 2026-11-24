# 모아 검증 보고서

2026-11-24 KST. **주 로그인 방법을 Google로 계속하기로 변경·배포했다. 실제 Google 계정 선택 화면 연결을 확인했고, 계정 선택·동의 후 복귀는 사용자 확인 대기다.** 흰 배경·테이프·실제 앱 기록 기능·기존 세 제품과 데이터를 보존했다.

## 현재 배포

- 운영 주소: https://moa-diary-web.pages.dev/
- 저장소/브랜치: `gsh4124-cyber/page-tools` / `feature/moa-integration-20261119`
- 실제 배포 코드: `e716e90dfbdfd78d1f685ed5addaacf46b733e7c`
- Cloudflare 배포 ID: `943e0fbe-699f-421c-8d72-c890178fd120` / completed, success
- 비공개 앱 source SHA-256: `0977c505bd63ed6c3a9d33aaaccb082bd3a8d71da1760a8ac61b1e78ba798291`
- 로컬 최종 Worker SHA-256: `678eaad3d7dbb7627104865fcf42161533859d89700367a15aaba6807493a4fe`

GitHub 제공자 검사 completed/success와 실제 운영 Google 버튼/구글 계정 선택 화면을 확인했다. 앱 fingerprint는 공개 로그인 코드를 포함하지 않으므로 이전과 같고 전체 Worker 해시는 변경됐다. 이번 운영 manifest 재조회·제공자 Worker 해시 독립 대조는 아직 하지 않았다. 보고서 커밋은 `[CF-Pages-Skip]`으로 재배포하지 않는다.

## 이번 변경과 실제 검증

| 검사 | 결과 / 범위 |
|---|---|
| 기존 설정·계정 | DONE · 관리자 페이지 Google 제공자 활성, readonly auth.identities에서 기존 소유자 Google identity1개. 기존 정확한 콜백 `https://moa-diary-web.pages.dev/__moa_auth_callback` 재사용. 공유 설정/키/제공자/비밀번호 추가 변경 없음 |
| 단위·로컬 PostgreSQL·Worker | DONE · 26개, 실패0. 기존 보안/백업/소유권 회귀와 Google 코드의 중복/크기/토큰 혼합 거부, 정확한 제공자 URL·S256, PKCE 증명 전용 저장 어댑터 검사. hosted DB 재시험 아님 |
| 최종 패키지 Chrome | DONE · `e716e90dfbdfd78d1f685ed5addaacf46b733e7c`의 Worker13개 검사군, 오류0. 304/320/390/768/1280px. Google 버튼 우선/포커스·이메일 접힘·키보드·흰 배경/테이프와 기존 공개 예시 회귀. 합성 인증/RPC |
| PKCE 성공·세션 | DONE · 실제 Supabase SDK가 만든 challenge와 교환 verifier의 SHA-256 일치. 모의 Google 시작→코드 교환→서버 소유자 확인→기존 SDK 저장 키/HttpOnly 쿠키→정확한 비공개 앱, 새로고침 접근 유지 |
| 인증 거부·정보 보존 | DONE · 모의 증명 누락/동의 거부/다른 Google 사용자에서 비공개 앱 차단, 코드/query 제거, 오류 원문 비반영. 거부된 콜백이 기존 소유자 쿠키/세션/비공개 접근을 지우지 않음 |
| Google 토큰 저장 제한 | DONE · 별도 임시 클라이언트의 후보 세션/Google provider_token은 localStorage/sessionStorage에 저장하지 않음. 탭 저장소는 PKCE 증명만 허용하며, 서버 통과 후 앱 토큰 쌍만 기존 앱 SDK에 저장 |
| 실제 운영 버튼 | DONE · 지원되는 Windows Computer Use Chrome에서 운영의 Google로 계속하기 버튼 클릭→실제 Google ‘계정을 선택하세요’ 화면. 메일을 거치지 않음 |
| 실제 Google 로그인 완료 | NOT_TESTED · 구글 계정 선택·동의는 본인 단계이므로 사용자에게 요청하고 대기. 계정 선택 화면 연결을 로그인 완료로 계산하지 않음 |
| 기존 코드/데이터 보존 | DONE · 이번 변경은 moa/ 로그인 코드/UI/시험/문서만. 기존 세 제품/공통 tools/workflows diff0. 실제 기록·습관·미디어 쓰기/삭제 없음. 추가 비용 없음 |

사용자 목적은 메일 없이 기존 구글 계정으로 일기장을 여는 것이다. 대화상자는 Google 버튼을 먼저 보여주고 포커스를 두며 이메일/비밀번호는 다른 방법으로 로그인 안에 둔다. 기본 방문자는 이전처럼 공개 예시부터 보며, 실제 기록과 파일은 여전히 기존 소유자만 접근한다. 구글 비밀번호는 모아가 받지 않는다.

Google OAuth는 SDK PKCE를 사용한다. 정확한 운영 콜백만 요청하고 이 탭에 일시 검증 증명만 둔다. 복귀 코드/query는 SDK 요청 전 주소에서 지운다. 세션 교환은 기존 앱과 다른 임시 저장 키로 수행하고 후보 인증 세션을 영구 저장하지 않는다. 서버의 기존 소유자/서명/현재 Auth 세션 검증 후에만 앱 저장 키로 옮긴다. 실패·동의 거부·증명 누락·다른 계정은 기존 정상 소유자 세션을 보존한다. 이메일 호환 경로도 유지한다. [Google 인증 지침](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).

최신 vault main START_HERE·페이지 작업 Index·UI/UX·보안·실행상태 원칙과 `hwangje_ops.context_packet`의 vibecoding 실행 상태를 읽었다. 실행 상태는 view이며 함수가 아니었고, 함수형 첫 조회 실패 후 실제 view로 회수했다. DB 실행 행·스키마·정책을 변경하지 않았다. Supabase ACTIVE_HEALTHY를 확인했다.

## 이전 검증과 이번 결과의 구분

직전96490d7 이메일 수정에서는 실제 기존 메일이 `localhost:3000`으로 향하던 원인을 확인하고 사용자가 승인한 정확한 모아 콜백 한 줄만 허용 목록에 추가했다. 실제 새 메일 Log In 클릭→내 계정 복귀→새로고침 유지와 당시 운영 manifest 일치를 확인했고, last_sign_in_at=2026-11-24 08:18:59.006305+00를 readonly 조회했다. 이 결과를 이번 Google 로그인 성공으로 계산하지 않는다.

이전 SDK 모의 계약6개·앱11개·사진/긴 제목3개와 날짜/간격 UI 검수는 과거 체크포인트이며 이번에 재실행하지 않았다. 실제 Android/iOS·새 빈 프로필의 Google 로그인·실서버 다른 사용자/거부된 인증·미디어/백업/복원/격리 전체 재시험은 미검증이다. 캡처는 로컬 google-login-304/390/1280.png와 실제 도구 표시 화면을 구분하며, 실제 Chrome 캡처를 파일에 재저장하지 않았다.

## 접근 보호·비용·보존

사용자 선택대로 **앱 전체와 파일은 소유자 전용**이다. 서비스 소개·명시적 예시·선택형 로그인 UI와 해당 코드만 비인증 요청에 제공한다. 공개 로그인 UI를 일반 사용자용 모아 앱으로 확대하지 않았다. 모든 앱 파일을 Worker에 내장하고 정적 fallback은 앱 없는 안내 페이지만 둔다. 정확한 소유자 UUID를 사전 검사하고, 실제 JWT 서명/프로젝트/현재 Auth 세션은 기존 `moa_account_status` RPC가 검증한다. 실패·만료·위조·다른 사용자·RPC 장애는 차단한다. 쿠키는 Secure/HttpOnly/SameSite=Strict, Origin 검사와 요청 크기 제한을 적용했다.

새 모아 프로젝트만 Fail closed로 저장했다. 자동 배포는 지정 feature 브랜치만 유지하고 다른 브랜치 미리보기를 중지했다. 빌드 감시 경로 `moa/*`도 확인했다. 초기 전체 브랜치 기본값 때문에 타 제품 feature의 모아 빌드가 실패한 이력이 있었으며, 기존 제품의 실제 배포나 코드는 변경하지 않았다. 기존 세 제품의 설정은 만지지 않았다.

PR #34의 실패 간섭도 재확인했다. 파일 감시만 제한한 뒤 만든 이전 빈 커밋은 Cloudflare의 ‘변경 파일 0개면 경로 검사 생략’ 규칙 때문에 모아 빌드를 다시 시도했다. 현재는 미리보기 분기를 None으로 막았으며, 기존 실패의 수동 재실행은 강제 빌드라 같은 실패가 남았다. 이후 파일 트리를 전혀 바꾸지 않는 검사 갱신 커밋 `8e5a90762ed6469ad2cd42c79537ad23032d948b`를 PR 브랜치에 추가했고 GitHub 비교 결과 변경 파일 0개를 확인했다. 이 새 자동 이벤트에서 모아는 실제 skipped(ID `8cf8f745-65ce-489e-9526-6c02fe3a9006`)였고, 최신 GitHub 검사에는 모아 실패가 없으며 성경 읽기 미리보기 배포는 성공했다. 새 성경 QA는 Static Guardrails·Behavior QA·Chromium/Firefox/WebKit 모바일 검사·Combined Quality Gate 모두 성공했고, Product Health Monitor도 성공했다. 기존 실패 댓글/커밋 이력은 삭제하지 않는다. 기존 제품 코드·설정, Supabase, 실제 모아 운영 배포는 변경하지 않았다. [Cloudflare 경로 필터 예외](https://developers.cloudflare.com/pages/configuration/build-watch-paths/), [분기 제어](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

기존 Workers Free의 계정 공유 100,000회/일 한도를 사용한다. 초과 시 접속이 실패할 수 있고 자동 유료 전환을 신청하지 않았다. 카드·유료 요금제·Access 결제/초과 과금 동의·새 Supabase 자원을 만들지 않았다. Access Free 결제 단계는 완료하지 않았다. Direct Upload `moa-diary`는 업로드/배포 없는 초안으로 남았고 실제 운영은 Git 연결 `moa-diary-web`이다. 기존 Sites 검토 사이트는 그대로 남겼다.

원본 v7 SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db` 일치를 자동 검사했다. 실제 소유자 기록에 시험 글·습관·미디어를 쓰거나 삭제하지 않았다. 직전 이메일 수정에서 공유 Auth 설정 변경은 사용자가 승인한 Redirect URLs의 `https://moa-diary-web.pages.dev/__moa_auth_callback` 한 줄 추가뿐이다. 추가 후 새로고침으로 목록을 확인했다. Site URL `http://localhost:3000`·메일 템플릿·인증 제공자·비밀번호·DB/RLS/Storage·다른 제품 데이터는 바꾸지 않았다. 이전 실제 이메일 로그인으로 Auth 세션과 마지막 로그인 시각이 갱신됐다. 이번 Google 로그인 완료는 위 현재 검증 표를 따른다.

## 기존 실제 검증과 구분

11월 20일 체크포인트에서 로컬 브라우저 9개, 모의 클라우드 계약 6개, 실제 Supabase Auth/REST/RPC/GraphQL/Storage 12개를 통과했다. 실제 미디어 저장·사용자 격리·수정/삭제·암호화 백업/복원·자동 재생·세션 폐기 등을 확인했다. 추가 계정/복구/운영 기능 6개와 오류 0, 별도 빈 QA 계정으로 문서 1개/PNG 1개를 복원해 SHA-256 일치를 확인했다. 스트림 전송 시작 후 취소, 1920px 사진 최적화, 복구 메일, 탈퇴/재시작도 확인했다.

이전 버전의 실제 48/96MiB 할당량 검사 8개, 이전 Sites 배포 후 6개+정리 2개는 과거 결과다. **새 Cloudflare 호스트에서 미디어/백업/사용자 격리를 전부 다시 실행한 결과로 계산하지 않는다.** 정확한 과거 결과는 qa-results.json에 보존한다. 과거 hosted UI 스크립트 3개는 새 메뉴 동선으로 갱신하고 구문 검사했으나 이번에 실서버 실행하지 않았다.

QA 계정 4개는 이전에 암호 폐기·전역 로그아웃·영구 로그인 차단했고, QA 문서/미디어/예약/세션 0을 확인했다. 이번에 재활성화하지 않았다. 이전 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다.

## 미검증과 한계

| 항목 | 상태 / 이유 |
|---|---|
| 새 Cloudflare 호스트에서 최근 기록/사진이 있는 홈·글/미디어/수정/삭제/백업/복원/다른 사용자 계정 전체 재실행 | NOT_TESTED · 실제 소유자 데이터에 시험 내용을 쓰지 않음. 기존 hosted Supabase 결과와 구분 |
| 새 호스트의 정확한 HTTP 응답 코드·보안 헤더, 실제 logout/refresh/CSRF 요청 | NOT_TESTED · 로컬 패키지/단위 검사는 통과. 직접 네트워크 검사 명령은 DNS ENOTFOUND |
| 실제 호스트의 320/390/768/1280px | NOT_TESTED · 이번 실제 검수는 PC Chrome 창이며 DOM 폭 수치를 별도로 측정하지 않음. 이전 실제 공개304px 검사는 과거 체크포인트. 로컬 304/320/390/768/1280px 통과와 구분. 이전 override가 958px로 유지된 한계도 보존 |
| Impeccable 전용 CLI/context/detector·전체 접근성 인증 | NOT_TESTED · 패키지 DNS 실패. 지침 수동 적용/제품 검사/주요 색 대비 확인과 구분 |
| 새 호스트 진단 파일 다운로드 | INCONCLUSIVE · 브라우저 다운로드 이벤트 대기 시간 초과. 기능 오류로 확정하지 않음 |
| Android/iOS 실기기·네이티브 선택기·터치·키보드·코덱/메모리 | NOT_TESTED · 사용자 실기기 제공 불가 |
| 자연 만료·물리적 망 단절·모바일 OS 종료·모든 동시 쓰기 순서 | NOT_TESTED · 강제 세션/스트림 취소/잠금 검증과 구분 |
| off-site/PITR·공급자 장애·실사용 파일럿 | NOT_TESTED · 별도 비용/운영 준비 및 실제 사용자 검증 필요 |
| 기존 Sites 후보 업데이트 | BLOCKED · 이전 도구 정책 제한. Cloudflare 별도 배포로 우회 호스팅 완료 |

프로젝트 전체의 기존 advisor 경고는 별도 운영 과제다. 모아의 authenticated GraphQL 스키마 탐색과 다른 사용자 행 접근은 구분한다. 일반 공개 서비스 전 개인정보 처리방침·지원 창구·운영 책임·SMTP/백업/모니터링·실기기/파일럿 검증이 남아 있다. 현 상태는 소유자 전용 검토 운영이다.
