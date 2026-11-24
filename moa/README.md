# 모아 (Moa)

사용자가 첨부한 v7 원본을 실제 기준으로 만든 모바일 다이어리다. 글·사진·영상, 월간 달력, 다꾸, 습관, 수정·삭제, 로그인, 사용자별 비공개 클라우드, 암호화 전체 백업·복원을 제공한다.

현재 Cloudflare 사이트: [모아 열기](https://moa-diary-web.pages.dev/). 기존 [Sites 검토 주소](https://moa-diary-20261120.gsh4124.chatgpt.site)는 그대로 보존한다. 로그인 없이 기록·달력·사진 예시와 습관 체크를 체험할 수 있다. 합성 예시는 저장되지 않는다. ‘내 모아 열기’를 선택할 때만 계정 확인 창을 열며 실제 앱과 파일은 기존 소유자만 접근한다.

[Impeccable](https://github.com/pbakaus/impeccable)의 지침을 수동 적용해 기록 중심으로 다듬었다. 큰 감성 배너·격자·반복 카드를 줄이고, 공개 화면은 월별 색인과 날짜·제목·본문·사진으로 구성했다. 실제 앱은 오늘/이번 주/최근 기록 목록, PC 왼쪽 메뉴와 모바일 하단 메뉴를 쓴다. 노란 테이프는 사진에만 남겼다. 사용자의 추가 피드백에 따라 제목/wordmark에 로컬 명조체를 쓰고, 밝은 회색 바탕·흰 종이·얇은 경계·약한 사진 그림자·10px 버튼으로 마감을 다듬었다. 모바일 다섯 메뉴의 너비와 304/320px 예시 탭 줄바꿈도 보정했다. 기본 보라색은 없애되 사용자가 이미 선택한 개별 꾸미기는 보존한다. 메뉴 이동은 초안을 비우지 않는다. [설계 기준·사진 라이선스·Impeccable 실행 제한](ui/README.md)을 기록했다.

2026-11-24 Cloudflare 배포 소스는 `4d98b735b39bd91936d7940ae8fb3bf035e009f3`, 배포 ID는 `68b52764-a240-4ef1-9bd7-996990219d98`다. 제공자 success와 로컬 재빌드 Worker 해시 일치를 확인했다. 이번 실제 브라우저에서는 공개 예시 304/943px, 탭 높이 44px, 사진에서 해당 일기 이동, 기존 소유자 세션 재연결·새 홈·작성 화면을 확인했다. 초안/주간 날짜/보관함의 이전 실제 체크포인트는 보고서에 구분했다. 이번 로컬 앱 11개/사진·긴 제목 3개/최종 패키지 7개 검사군과 단위 19개를 통과했다. 모의 SDK 계약 6개는 이전 지침 적용 릴리스 결과로 구분한다. 실제 호스트의 새 메일 로그인·미디어/복원 쓰기 전체 재실행과 실기기는 미검증이다. Impeccable CLI 설치는 npm DNS 오류로 실패했으므로 전용 자동 검사 통과를 주장하지 않는다. 기존 세 제품, Supabase 설정/데이터와 유료 자원은 변경하지 않았다. 상세 결과는 [검증 보고서](QA_REPORT.md)를 따른다.

## 원본과 보존 범위

- 원본 `reference/moa_diary_v7.html`: 33,644바이트, SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db`.
- `index.html`은 원본의 기능 섹션과 입력 계약을 계승한다. 파생 앱의 중복 inline style을 제거하고 스타일을 `service.css` 하나로 통합했다. 원본 파일은 수정하지 않았다. 초기 v7 셸을 가져오는 도구는 `tools/import_v7.py`다. 현재 홈·메뉴 구성은 canonical `index.html`과 `app.mjs`에 있으므로 가져오기 도구를 다시 실행하면 최신 UI 변경을 별도로 반영해야 한다.
- Canonical은 `gsh4124-cyber/page-tools`의 `feature/moa-integration-20261119`, 변경 범위는 `moa/`다.
- `random-ppobgi/`, `bible-reader/`, `pc-checkup/`, 공통 `tools/`, `.github/workflows/`는 변경하지 않았다. main 병합·push도 하지 않았다.

## 사용과 저장

기기 모드는 IndexedDB를 사용한다. 로그인하면 본인 클라우드 기록을 불러오며 기기 기록을 자동 전송하지 않는다. 기기 기록은 암호화 백업 후 계정에서 복원해 옮긴다. 계정 변경 시 비공개 초안·선택 파일·백업 상태를 비운다. 저장 충돌은 덮어쓰지 않고 초안을 보존한다.

이메일 회원가입 후 받은 인증 링크를 계정 화면에 붙여 넣으면 인증과 로그인을 완료한다. 비밀번호를 잊으면 복구 메일을 요청하고, 받은 복구 링크와 새 비밀번호를 입력한다. 변경 후 모든 세션을 로그아웃한다. 로그인 계정은 다른 제품과 공유하므로 비밀번호 변경은 공유 계정에도 적용된다. Auth 리디렉션·메일 설정은 바꾸지 않았다.

모아 탈퇴는 비밀번호 재확인과 `모아 탈퇴` 문구 입력 후 본인의 모아 기록·습관·첨부만 지운다. 공유 Auth 계정·다른 제품의 데이터는 보존한다. 정리가 중단되면 다시 로그인해 이어서 실행한다. 탈퇴 후 이전 세션은 차단하며, 비밀번호를 다시 확인한 뒤 명시적으로 빈 모아를 시작할 수 있다. 기기 모드의 삭제 버튼은 현재 IndexedDB 기록만 지운다. 예전 v7 원본 데이터와 내려받은 백업 파일은 별도로 남는다.

화면에 60% 이상 보이는 영상 하나만 음소거로 자동 재생한다. 화면 밖·숨긴 탭·동작 줄이기·데이터 절약 설정에서는 정지한다. 실제 코덱 지원은 브라우저에 따른다.

| 한도 | 값 |
|---|---|
| 첨부 | 기록당 6개, 파일당 25MiB |
| 기록에 연결된 미디어 | 사용자당 48MiB |
| 임시·복원 파일을 포함한 예약 | 사용자당 96MiB, 500개 |
| 글 데이터 | 2MiB, 기록 2,000개, 습관 100개 |
| 전체 백업 | 미디어 48MiB, 암호화 파일 100MiB |

백업은 AES-256-GCM, PBKDF2-SHA256 310,000회와 파일 SHA-256을 사용한다. 백업 암호는 보관·복구하지 않는다. 복원은 새 경로에 파일을 준비한 뒤 문서를 교체하고 이전 파일을 정리한다. 실패 응답이 불명확한 파일은 즉시 삭제하지 않는다. 하루 이상 지난 미사용 첨부는 아카이브의 정리 버튼으로 확인 후 지운다. 사용 중인 파일은 서버가 삭제·덮어쓰기를 막는다.

사진 용량 줄이기는 선택 기능이다. JPEG·PNG·WebP를 최대 1920px의 WebP로 변환하고 원본 기기 파일은 유지한다. GIF·영상은 변환하지 않는다. 선택한 첨부와 남은 용량, 전송 진행 상태, 최근 백업 시각을 표시한다. 오프라인 안내는 제공하지만 오프라인 클라우드 저장 대기열은 구현하지 않았다.

## Supabase 적용

기존 free 프로젝트 `afiqaibosavbjzkffggr`만 사용한다. `moa_documents`, `moa_media`, `moa_accounts`에 RLS·FORCE RLS를 적용했고, `moa-private` 버킷은 비공개다. 공개 스키마의 모아 함수는 SECURITY INVOKER다. 노출되지 않은 `moa_private`의 함수 4개만 SECURITY DEFINER이며, 실제 Auth 세션 확인과 본인 모아 탈퇴 처리에 필요한 권한을 제한한다. 모두 빈 search_path, 호출자 확인, PUBLIC 실행 권한 제거를 적용했다. 파일 작업은 Storage API로 수행한다.

| 원격 적용 버전 | 내용 / 로컬 SQL |
|---|---|
| 20261119102755 | 초기 스키마 · `db/schema.sql` |
| 20261120011359 | 예약·용량·정리 보호 · `supabase/migrations/20261120010940_moa_media_budget.sql` |
| 20261120020023 | 업로드 사전 검사 호환·완료 크기 검증 · `supabase/migrations/20261120015919_moa_upload_probe_compatibility.sql` |
| 20261120090924 | 모아 탈퇴·세션 검증·상태 · `supabase/migrations/20261120082747_moa_account_lifecycle.sql` |
| 20261120092206 | 다시 시작 후 이전 세션 차단 · `supabase/migrations/20261120092053_moa_rejoin_session_guard.sql` |
| 20261120095034 | 실제 Storage 컬럼과 변수명 충돌 수정 · `supabase/migrations/20261120092521_moa_withdrawal_variable_scope.sql` |
| 20261120105101 | 탈퇴 잠금 대기 후 쓰기 권한 재검사 · `supabase/migrations/20261120104942_moa_lifecycle_write_barrier.sql` |

적용된 SQL을 재실행하지 않는다. 기존 프로젝트의 전체 migration 이력이 이 폴더에 있지 않으며, 로컬 생성 시각과 MCP 적용 버전도 다르다. 이 폴더에서 자동 `db push/reset`을 실행하지 않는다.

Storage는 업로드 사전 검사 때 실제 크기가 없을 수 있어, 모아 버킷에만 완료 메타데이터를 검증하는 트리거를 추가했다. Storage 스키마 변경은 업그레이드 호환성 위험이 있으므로 Supabase Storage 업그레이드 후 예약·업로드·삭제 회귀 검사를 다시 해야 한다. 실제 크기 허위 신고 차단도 hosted API로 확인했다.

## 실행·검사·검토 배포

Node.js 22 이상과 Python 3, 브라우저 검사는 설치된 Chrome을 사용한다.

```text
cd moa
npm ci --ignore-scripts
npm run build
npm test
npm audit
npm run qa:browser
npm run qa:cloud-contract
node tools/serve.mjs
```

로컬 주소는 `http://127.0.0.1:4175`다. 기본 빌드는 클라우드 연결이 꺼진 기기 모드다. 공개 설정은 빌드 프로세스의 `MOA_SUPABASE_URL`, `MOA_SUPABASE_PUBLISHABLE_KEY`로 전달하거나, 숨긴 stdin을 사용하는 `node tools/build-cloud.mjs`에 전달한다. service_role/secret 키는 거부한다. 비밀번호·토큰·관리 키는 저장소에 넣지 않는다.

Sites 검토 배포는 공개 설정 빌드 후 `node tools/build-worker.mjs`로 만든다. 정적 호스팅이 `_headers`를 적용하지 않아, 작은 Worker가 CSP·no-store·MIME 보호·404·허용 메서드를 직접 응답한다. `.openai/hosting.json`의 기존 project_id와 소유자 전용 접근을 유지한다. 소스 동기화·패키징·배포에는 Sites 스킬의 공식 helper와 native 도구를 사용한다.

현재 사이트는 이전 버전 2다. 2026-11-22 사용자가 기존 비공개 사이트 업데이트를 승인했다. 소유자 전용·외부 방문자 0을 재확인했지만, 공식 소스 동기화 도구에 숨긴 입력을 전달하는 단계가 실행 승인 정책으로 거부됐다(`AskForApproval::Granular.sandbox_approval=false`). 배포 동의는 확보됐고 실행 권한이 차단된 상태다. 저장소 호스트 `git.chatgpt-team.site`로 이 사이트의 소스를 동기화하는 배포 작업만 허용되어야 한다. 업로드·버전 저장·배포 호출은 실행하지 않았다.

대체 배포는 기존 세 제품과 분리한 새 Vercel 프로젝트로 준비했다. 연결 상태는 아직 미확인이다. 계정 연결 후 요금제·소유권을 확인하고, 첫 배포 전에 Vercel Authentication의 **All Deployments**를 켜야 한다. 이 접근 보호는 현재 모든 요금제에서 별도 유료 추가 기능 없이 제공된다. [현재 보호 범위](https://vercel.com/docs/deployment-protection#all-deployments). Hobby의 개인·비상업 사용 조건을 확인하며 유료 전환·상용 요금이 필요하면 먼저 승인받는다. [요금제](https://vercel.com/docs/plans/hobby), [이용 조건](https://vercel.com/legal/terms).

현재 우선 경로는 **Cloudflare Pages**이며 Vercel 연결·프로젝트·요금제 변경은 실행하지 않았다. Cloudflare에는 새 프로젝트만 연결하고, Root Directory `moa`, Production branch `feature/moa-integration-20261119`, Build command `npm run build:cloudflare`, Build output directory `dist-cloudflare`를 사용한다. 환경 변수는 기존 공개 Supabase URL·publishable/anon 키와 `NODE_VERSION=22`다. 기존 세 프로젝트의 root·브랜치·도메인·빌드 명령은 바꾸지 않는다.

`tools/prepare-cloudflare.mjs`는 모든 앱·CSS·상태 파일을 접근 보호 Pages Worker에 내장한다. 출력은 `_worker.js`, 전체 경로를 처리하는 `_routes.json`, 앱이 없는 정적 안내 페이지 3개다. 정적 fallback으로 앱이 공개되지 않는다. 제공자 설정도 Fail closed로 저장했고 다른 브랜치의 자동 미리보기 배포를 중지했다. 빌드 감시 경로는 `moa/*`다. 소유자 전용 입장 화면과 인증 코드만 비인증 요청에 제공한다. `MOA_GATE_OWNER_ID`에 설정한 정확한 기존 Auth UUID만 통과하며, 매 요청의 JWT를 기존 `moa_account_status` RPC로 서버 검증한다. payload는 사전 필터일 뿐 서명 검증을 대체하지 않는다. 위조·만료·취소된 세션은 거부하고 RPC 장애는 503으로 차단한다. 모든 응답은 no-store·CSP를 적용한다.

Cloudflare 환경 변수에 기존 공개 URL·anon/publishable 키, `NODE_VERSION=22`, 원래 소유자 UUID의 `MOA_GATE_OWNER_ID`를 설정한다. 보호 쿠키는 Secure·HttpOnly·SameSite=Strict이며 SDK 세션 갱신·로그아웃과 동기화한다. Google 계정으로 생성되어 비밀번호가 없는 소유자는 기존 이메일로 입장 메일을 받고 링크를 붙여 넣는다. 새 회원가입·공유 Auth 리디렉션·비밀번호 변경은 필요하지 않다. 실제 소유자의 Gmail 메일 수신과 링크 인증, 클라우드 연결을 확인했다.

기존 Workers Free 한도(계정 공유 100,000회/일)를 사용한다. 한도 도달 시 접속 실패 가능성이 있으며 자동 유료 전환은 신청하지 않았다. Access Free 가입도 카드와 초과 과금 동의를 요구해 완료하지 않았다. 새 유료 요금제·카드·Access 자원은 없다. Direct Upload `moa-diary`는 업로드·배포 없는 초안으로 보존하고 Git 연결 프로젝트 `moa-diary-web`만 사용한다.

새 프로젝트만 저장소 `gsh4124-cyber/page-tools`, Root Directory `moa`, 대상 브랜치 `feature/moa-integration-20261119`를 사용한다. 공개 설정 변수 `MOA_SUPABASE_URL`, `MOA_SUPABASE_PUBLISHABLE_KEY`는 같은 기존 Supabase를 가리켜야 한다. `vercel.json`이 빌드와 출력 폴더 `dist-vercel`을 지정한다. `node tools/prepare-vercel.mjs`는 검증된 cloud 빌드를 요구하고 보안 헤더를 기존 빌드와 비교한 뒤 공개 파일 7개만 복사한다. 기기 모드 빌드·헤더 불일치는 배포 준비를 실패시킨다. 로컬 실행에서 기존 후보와 파일 해시·헤더가 일치했다. Vercel의 실제 응답·로그인·데이터 격리 검사는 연결·배포 후 실행해야 하며 아직 미검증이다.

호스팅을 옮겨도 클라우드 기록은 같은 Supabase 계정에 남는다. 새 주소의 브라우저 기기 모드 데이터는 별도 저장 공간이므로 이전 주소의 로컬 기록을 자동 이전하지 않는다. 필요하면 이전 주소에서 암호화 백업을 내려받아 새 주소에서 복원한다. 기존 사이트·Cloudflare 세 제품·DNS·main은 변경하지 않는다.

실제 hosted 검사는 `tests/live-supabase.mjs`, `tests/media-live.mjs`, `tests/auth-live.mjs`, `tests/deployment.mjs`이며 설정·임시 자격 증명은 stdin으로만 받는다. 폐기한 QA 계정을 재사용하려면 별도 준비가 필요하다.

## 검증과 남은 항목

11월 24일 현재 단위/DB/Worker 19개, 로컬 앱 11개, 사진·긴 제목 3개, 최종 패키지 7개 검사군을 통과했다. 모의 클라우드 6개는 앞선 334b312 릴리스 결과이며 이번 CSS 변경 후 재실행하지 않았다. 패키지 검사는 모의 인증이다. 이번 실제 호스트에서는 기존 세션 재연결·UI/날짜 이동을 확인했고, 원래 소유자의 메일 로그인과 달력 월 이동은 이전 릴리스에서 확인한 결과다. 이전 체크포인트에서 단위/DB/Worker 15개, 로컬 브라우저 9개 검사군, 가상 Supabase 연결 6개, 실제 Supabase 연결 12개를 통과했다. 추가로 실제 탈퇴·이전 세션 차단·재가입, 수신한 복구 메일로 비밀번호 변경, 전송을 시작한 업로드 취소, 별도 빈 QA 계정으로 암호화 파일 복원, 사진 최적화·진단·기기 삭제 등 6개 기능군과 브라우저 오류 0·시험 자료 정리를 확인했다. 이전 버전의 실제 48/96MiB 한도 검사와 배포 후 검사는 과거 체크포인트이며 이번 후보의 배포 후 검사로 계산하지 않는다.

실기기 제공 불가로 Android/iOS 실기기는 미검증이다. 자연적인 토큰 만료까지 기다린 검사, 실제 케이블/망 단절·모바일 OS 종료, 모바일 메모리·코덱 전수, ChatGPT 소유자 대화형 로그인, 독립 off-site/PITR 재해복구와 실제 사용자 파일럿은 미검증이다. 탈퇴와 동시에 진행되는 모든 쓰기 순서의 전수 시험도 하지 않았다. 새 유료 자원·별도 SMTP/PITR·요금제 변경은 하지 않았다.

QA 미디어·예약·세션·문서는 모두 0개다. QA 계정 4개는 암호를 교체·폐기하고 영구 로그인 차단했다. 이전 계정 행 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다. 기존 사용자/프로필 1개를 보존했다. 전체 결과는 [QA_REPORT.md](QA_REPORT.md), 기계 판독 결과는 [qa-results.json](qa-results.json)에 기록한다.

## 운영·복구 절차

`node tools/health-check.mjs`에 승인된 프로젝트의 `{url,key}` 공개 설정을 stdin으로 전달하면 Auth 상태와 `moa_health`를 한 번 검사한다. 이번 실제 응답은 둘 다 200이었다. 새 Worker 후보는 개인정보 없는 `/healthz`를 제공한다. 화면의 진단 파일은 빌드·연결 상태·화면 크기·오류 코드만 포함하며 이메일·기록·토큰은 포함하지 않는다. 자동 감시·알림 구독은 만들지 않았다.

중요 기록 추가 후와 변경 전에는 전체 백업을 내려받고 암호를 별도로 보관한다. 보관 주기와 별도 저장 장소는 운영자가 정해야 하며, 외부 백업 공급자는 구성하지 않았다. `node tools/recovery-drill.mjs`는 stdin의 `{backupPath,backupPassword}`로 파일을 검증한다. 실제 복원은 추가로 `{restore:true,confirmEmptyTarget:true,url,key,email,password,expectedUserId}`가 필요하다. 명시한 빈 계정만 허용하며 문서와 파일 해시를 재조회한다. 기존 데이터가 있는 계정에는 이 운영 도구를 사용하지 않는다.

출시 전 파일럿은 동의한 사용자에게 가입·기록/사진·수정/삭제·다른 기기 재조회·백업 복원의 다섯 작업을 수행하게 하고 성공 여부·소요 시간·불편을 기록한다. 아직 사용자 모집·연락이나 실제 피드백 수집은 하지 않았다.
