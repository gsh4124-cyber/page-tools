# 모아 검증 보고서

2026-11-24 KST. **실제 메일이 개발용 localhost로 향하던 로그인 문제를 수정·배포하고, 새 메일의 Log In 버튼으로 운영 모아에 복귀하는 것을 확인했다.** 흰 배경·테이프·기존 앱 기록 기능은 보존했다.

## 현재 배포

- 운영 주소: https://moa-diary-web.pages.dev/
- 저장소/브랜치: `gsh4124-cyber/page-tools` / `feature/moa-integration-20261119`
- 실제 배포 코드: `96490d7a48cc6f87dd654acf13248a3ad4336046`
- Cloudflare 배포 ID: `d8ce9768-1edf-42e5-8986-2378adac5e02` / completed, success
- 앱 source SHA-256: `0977c505bd63ed6c3a9d33aaaccb082bd3a8d71da1760a8ac61b1e78ba798291`
- 로컬 최종 Worker SHA-256: `7177e258d6f650c0532469f32b21eb419d2636ae7d6e7227fe91d9a6b61f5059`

GitHub Cloudflare 검사에서 성공과 배포 ID를 확인했다. 실제 로그인한 운영 주소의 `build-manifest.json`을 읽어 위 커밋·앱 SHA-256·cloudConfigured=true 일치를 확인했다. 앱 fingerprint는 비공개 앱 파일만 계산하므로 이번 공개 인증 코드 변경에도 동일하다. 전체 Worker 해시는 로컬 최종 패키지 값이며 제공자 Worker 해시 독립 대조는 하지 않았다. 보고서 저장 커밋은 `[CF-Pages-Skip]`으로 재배포하지 않는다.

## 이번에 실제로 확인한 결과

| 검사 | 결과 / 범위 |
|---|---|
| 원인 확인 | DONE · 실제 기존 메일의 redirect_to가 `http://localhost:3000`. 프런트 요청에 emailRedirectTo가 없고 Supabase의 기존 Site URL은 localhost, Redirect URLs는 비어 있었음 |
| 허용 주소 추가 | DONE · 사용자의 ‘로그인해뒀으니 네가 해봐’ 승인 후 관리자 화면에서 `https://moa-diary-web.pages.dev/__moa_auth_callback` 한 줄 추가·저장·새로고침 확인. Site URL 유지, 기존 주소 삭제 없음 |
| 단위·PostgreSQL 엔진·Worker | DONE · 23개 통과. 콜백 파싱·동일 출처/자격 증명 형식·오류/만료·콜백 공개 경로와 기존 보호 검사. 로컬 PostgreSQL 엔진이며 hosted DB 재시험 아님 |
| 최종 배포 패키지 Chrome | DONE · 코드 `96490d7a48cc6f87dd654acf13248a3ad4336046`의 Worker 10개 검사군, 오류0. 304/320/390/768/1280px. 기존 소개/날짜/사진/습관/로그인 창/보호/로그아웃에 정확한 이메일 복귀 URL·콜백 URL 정리·SDK 세션/HttpOnly 쿠키·거부/만료를 추가. Auth API/RPC/JWT는 모의 |
| 다른 사용자 콜백의 기존 로그인 보호 | DONE · 모의 최종 패키지에서 거부된 다른 사용자 콜백 후 기존 정상 소유자 쿠키·SDK 세션·비공개 app.js 접근 유지. 실서버 다른 사용자 재시험 아님 |
| Supabase SDK 모의 계약 | DONE · 이번 작업에서 6개 통과, 오류0. 기기/계정 분리·세션 재접속·탭 로그아웃 시 비공개 상태 정리·다른 사용자 분리·네트워크 초안 보존. 빌드 메타데이터는 작업 시작07837137이며 동일 비공개 앱 SHA-256. 로컬 가로챈 API |
| 실제 새 메일 로그인 | DONE · 운영 UI에서 새 메일 요청, 08:15:48 UTC 수신, Gmail에서 실제 Log In 버튼 클릭→운영 루트의 ‘내 계정’과 기록0 표시. 주소에 인증 fragment 없음. 링크/토큰을 파일에 저장하지 않음 |
| 실제 세션 재접속 | DONE · 로그인 후 운영 모아 새로고침에도 ‘내 계정’ 유지. readonly Auth 조회의 last_sign_in_at=2026-11-24 08:18:59.006305+00로 새 인증 확인. 기존 Chrome 프로필의 새 메일 재인증이며 새 빈 프로필의 실서버 인증과 구분 |
| 실제 운영 빌드 | DONE · 보호된 운영 manifest의 현재 커밋·앱 SHA-256 일치 확인 |
| 기존 코드 보존 | DONE · 이번 변경은 moa/만. 기존 세 제품·공통 tools·workflows diff0. main 병합 없음. 실제 기록/습관/미디어 쓰기·삭제 없음 |

## 수정 동작과 보안

메일 요청에 정확한 모아 복귀 주소와 `shouldCreateUser:false`를 지정한다. 메일 클릭 시 공개 콜백에서 인증 fragment/query를 먼저 지우고, 기존 Worker/RPC로 실제 소유자·서명·현재 Auth 세션을 확인한 뒤 SDK에 세션을 저장하고 앱으로 이동한다. 파서의 JWT 형식 검사는 서버 검증을 대체하지 않는다. 확인되지 않은 다른 사용자 콜백이 기존 정상 로그인을 지우지 않도록 수정했다. 서버 확인 후 SDK 저장에 실패하면 부분 세션을 정리한다.

메일 발송 성공 후에는 ‘링크 붙여넣기’를 자동으로 요구하지 않는다. 만료/거부는 새 메일 요청을 안내하며, 붙여넣기는 ‘링크가 열리지 않나요?’의 선택형 보조 수단으로 남긴다. 기존 메일의 localhost 주소는 소급 변경되지 않으므로 열린 모아를 새로고침하고 새 메일을 받아야 한다. [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [이메일 비밀번호 없는 로그인](https://supabase.com/docs/guides/auth/auth-email-passwordless).

기존 날짜/간격 UI 검수는 직전8f5de98 릴리스 결과다. 실제 앱11개 검사군·사진/긴 제목3개는 이전 포근함 릴리스 결과이며 이번 인증 수정에서 재실행하지 않았다. 해당 상세 결과는 qa-results.json의 과거 체크포인트에 보존한다. 이번 패키지10개와 SDK 계약6개가 이 과거 결과를 대체하거나 실서버 미디어 시험을 의미하지 않는다.

이번 실제 화면은 지원되는 Windows Computer Use의 Chrome에서 검수했다. 캡처는 도구에 표시된 화면으로 확인하고 재저장하지 않았다. 기존 로컬 미리보기 PNG를 운영 화면 증거로 계산하지 않는다. 새 빈 프로필 실서버 로그인·실서버 만료/다른 사용자 링크·실제 모바일·글/미디어/백업/복원/격리 전체 재시험은 미검증이다.

## 접근 보호·비용·보존

사용자 선택대로 **앱 전체와 파일은 소유자 전용**이다. 서비스 소개·명시적 예시·선택형 로그인 UI와 해당 코드만 비인증 요청에 제공한다. 공개 로그인 UI를 일반 사용자용 모아 앱으로 확대하지 않았다. 모든 앱 파일을 Worker에 내장하고 정적 fallback은 앱 없는 안내 페이지만 둔다. 정확한 소유자 UUID를 사전 검사하고, 실제 JWT 서명/프로젝트/현재 Auth 세션은 기존 `moa_account_status` RPC가 검증한다. 실패·만료·위조·다른 사용자·RPC 장애는 차단한다. 쿠키는 Secure/HttpOnly/SameSite=Strict, Origin 검사와 요청 크기 제한을 적용했다.

새 모아 프로젝트만 Fail closed로 저장했다. 자동 배포는 지정 feature 브랜치만 유지하고 다른 브랜치 미리보기를 중지했다. 빌드 감시 경로 `moa/*`도 확인했다. 초기 전체 브랜치 기본값 때문에 타 제품 feature의 모아 빌드가 실패한 이력이 있었으며, 기존 제품의 실제 배포나 코드는 변경하지 않았다. 기존 세 제품의 설정은 만지지 않았다.

PR #34의 실패 간섭도 재확인했다. 파일 감시만 제한한 뒤 만든 이전 빈 커밋은 Cloudflare의 ‘변경 파일 0개면 경로 검사 생략’ 규칙 때문에 모아 빌드를 다시 시도했다. 현재는 미리보기 분기를 None으로 막았으며, 기존 실패의 수동 재실행은 강제 빌드라 같은 실패가 남았다. 이후 파일 트리를 전혀 바꾸지 않는 검사 갱신 커밋 `8e5a90762ed6469ad2cd42c79537ad23032d948b`를 PR 브랜치에 추가했고 GitHub 비교 결과 변경 파일 0개를 확인했다. 이 새 자동 이벤트에서 모아는 실제 skipped(ID `8cf8f745-65ce-489e-9526-6c02fe3a9006`)였고, 최신 GitHub 검사에는 모아 실패가 없으며 성경 읽기 미리보기 배포는 성공했다. 새 성경 QA는 Static Guardrails·Behavior QA·Chromium/Firefox/WebKit 모바일 검사·Combined Quality Gate 모두 성공했고, Product Health Monitor도 성공했다. 기존 실패 댓글/커밋 이력은 삭제하지 않는다. 기존 제품 코드·설정, Supabase, 실제 모아 운영 배포는 변경하지 않았다. [Cloudflare 경로 필터 예외](https://developers.cloudflare.com/pages/configuration/build-watch-paths/), [분기 제어](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

기존 Workers Free의 계정 공유 100,000회/일 한도를 사용한다. 초과 시 접속이 실패할 수 있고 자동 유료 전환을 신청하지 않았다. 카드·유료 요금제·Access 결제/초과 과금 동의·새 Supabase 자원을 만들지 않았다. Access Free 결제 단계는 완료하지 않았다. Direct Upload `moa-diary`는 업로드/배포 없는 초안으로 남았고 실제 운영은 Git 연결 `moa-diary-web`이다. 기존 Sites 검토 사이트는 그대로 남겼다.

원본 v7 SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db` 일치를 자동 검사했다. 실제 소유자 기록에 시험 글·습관·미디어를 쓰거나 삭제하지 않았다. 이번 공유 Auth 설정 변경은 사용자가 승인한 Redirect URLs의 `https://moa-diary-web.pages.dev/__moa_auth_callback` 한 줄 추가뿐이다. 추가 후 새로고침으로 목록을 확인했다. Site URL `http://localhost:3000`·메일 템플릿·인증 제공자·비밀번호·DB/RLS/Storage·다른 제품 데이터는 바꾸지 않았다. 새 로그인으로 Auth 세션과 마지막 로그인 시각은 정상 갱신됐다.

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
