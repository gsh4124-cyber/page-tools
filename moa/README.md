# 모아 (Moa)

사용자가 첨부한 v7 원본을 실제 기준으로 만든 모바일 다이어리다. 글·사진·영상, 월간 달력, 다꾸, 습관, 수정·삭제, 로그인, 사용자별 비공개 클라우드, 암호화 전체 백업·복원을 제공한다.

현재 Cloudflare 사이트: [모아 열기](https://moa-diary-web.pages.dev/). 기존 [Sites 검토 주소](https://moa-diary-20261120.gsh4124.chatgpt.site)는 그대로 보존한다. 로그인 없이 기록·달력·사진 예시와 습관 체크를 체험할 수 있다. 합성 예시는 저장되지 않는다. ‘내 모아 열기’를 선택할 때만 계정 확인 창을 열며 실제 앱과 파일은 기존 소유자만 접근한다.

[Impeccable](https://github.com/pbakaus/impeccable)의 지침을 수동 적용해 기록 중심으로 다듬었다. 공개 화면은 월별 목록·기록/달력/사진 전환·날짜·글·사진 순으로 읽는다. 흰 배경과 테이프, 부드러운 모서리를 유지하면서 ‘my day’ 손글씨·감성 문구·하트·주황 분류표를 덜어냈다. ‘월요일 메모’ 같은 구체적인 일상 예시와 본문 줄바꿈을 쓰고, 사진은 왼쪽 본문 선에 맞춘다. 탭의 바깥 회색 캡슐과 습관 버튼 테두리를 없애 선택/체크 상태만 강조한다. 실제 앱도 오늘 영역의 상자/그림자를 없애 날짜·쓰기·이번 주 날짜가 먼저 보이게 했다. 본문은 중성 잉크색, 주 행동은 기존 파랑이다. 밋밋함을 줄이기 위해 날짜에만 작은 달력 조각/옅은 노랑 표시를 더하고 사진은 흰 종이 가장자리와 얕은 그림자로 마감했다. 공개 날짜는 테두리/그림자를 없애 더 은은하게 낮췄고, 글→사진 간격은 모바일24px/넓은 PC28px로 맞췄다. 홈의 빈 기록 안내에는 작은 노트 선 그림을 두며 전체 배경은 계속 흰색이다. PC 왼쪽 메뉴와 모바일 둥근 하단 메뉴, 최근 사진의 테이프, 초안 보존과 사용자의 꾸미기는 유지한다. [설계 기준·사진 라이선스·검증 제한](ui/README.md)을 기록했다.

2026-11-24 로그인 주 행동을 **Google로 계속하기 → 계정 선택 → 모아**로 바꿔 배포했다. 현재 코드 `e716e90dfbdfd78d1f685ed5addaacf46b733e7c`, Cloudflare 배포 `943e0fbe-699f-421c-8d72-c890178fd120`의 success를 확인했다. 운영 버튼이 실제 구글 계정 선택 화면으로 연결되는 것까지 확인했다. 계정 선택·동의 후 모아 복귀는 사용자 확인 대기이며 아직 실제 성공으로 계산하지 않는다. 이메일·비밀번호는 ‘다른 방법으로 로그인’ 안의 보조 경로다. 이미 로그인된 브라우저는 기존 세션으로 바로 입장한다.

기존 Google 제공자는 활성화되어 있었고 소유자 계정에도 이미 연결돼 있어, 제공자·인증 키·이전 허용 주소·공유 Site URL을 추가 변경하지 않았다. 기존 계정·일기·세 제품·요금제는 보존했다. 단위26개와 최종 Worker 브라우저13개 검사군(합성 인증, 304/320/390/768/1280px)이 통과했다. PKCE 코드 교환·URL 정리·서버 소유자 확인·잘못된 계정/취소 시 기존 세션 보존을 검사했다. 구글 제공자 토큰은 앱에 저장하지 않는다. 실제 Google 계정 선택·동의 완료와 실기기는 별도 검증이며 [검증 보고서](QA_REPORT.md)에 구분한다.

## 원본과 보존 범위

- 원본 `reference/moa_diary_v7.html`: 33,644바이트, SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db`.
- `index.html`은 원본의 기능 섹션과 입력 계약을 계승한다. 파생 앱의 중복 inline style을 제거하고 스타일을 `service.css` 하나로 통합했다. 원본 파일은 수정하지 않았다. 초기 v7 셸을 가져오는 도구는 `tools/import_v7.py`다. 현재 홈·메뉴 구성은 canonical `index.html`과 `app.mjs`에 있으므로 가져오기 도구를 다시 실행하면 최신 UI 변경을 별도로 반영해야 한다.
- Canonical은 `gsh4124-cyber/page-tools`의 `feature/moa-integration-20261119`, 변경 범위는 `moa/`다.
- `random-ppobgi/`, `bible-reader/`, `pc-checkup/`, 공통 `tools/`, `.github/workflows/`는 변경하지 않았다. main 병합·push도 하지 않았다.

## 사용과 저장

기기 모드는 IndexedDB를 사용한다. 로그인하면 본인 클라우드 기록을 불러오며 기기 기록을 자동 전송하지 않는다. 기기 기록은 암호화 백업 후 계정에서 복원해 옮긴다. 계정 변경 시 비공개 초안·선택 파일·백업 상태를 비운다. 저장 충돌은 덮어쓰지 않고 초안을 보존한다.

현재 운영 입장 화면은 Google로 계속하기 버튼으로 기존 구글 계정을 선택한다. 이메일 메일 요청은 보조 로그인 방법이다. 다음은 내부 앱의 계정 도구 설명이며 공개 회원가입을 허용한다는 뜻은 아니다. 내부 앱의 이메일 회원가입 도구는 받은 인증 링크를 계정 화면에 붙여 넣어 완료한다. 비밀번호를 잊으면 복구 메일을 요청하고, 받은 복구 링크와 새 비밀번호를 입력한다. 변경 후 모든 세션을 로그아웃한다. 로그인 계정은 다른 제품과 공유하므로 비밀번호 변경은 공유 계정에도 적용된다. 2026-11-24 모아 전용 복귀 주소 한 줄을 허용 목록에 추가했다. 공유 Site URL·메일 템플릿·인증 제공자는 바꾸지 않았다.

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

Cloudflare 환경 변수에 기존 공개 URL·anon/publishable 키, `NODE_VERSION=22`, 원래 소유자 UUID의 `MOA_GATE_OWNER_ID`를 설정한다. 보호 쿠키는 Secure·HttpOnly·SameSite=Strict이며 SDK 세션 갱신·로그아웃과 동기화한다. 기존 소유자는 Google로 계속하기에서 연결된 구글 계정을 선택한다. 이메일 방식이 필요할 때만 다른 방법으로 로그인을 연다. `https://moa-diary-web.pages.dev/__moa_auth_callback`만 Supabase 허용 목록에 추가했으며 Site URL과 기존 주소는 유지한다. Google OAuth는 PKCE로 시작한다. 콜백 URL의 코드/query를 먼저 지운 뒤 탭의 임시 증명으로 교환하며, 후보 세션은 영구 저장하지 않는다. 서버가 실제 소유자 세션을 확인한 뒤 기존 앱 저장 키로 옮긴다. Google 제공자 토큰은 저장하지 않는다. 만료된 메일은 다시 요청하고 링크 붙여넣기는 문제가 생겼을 때만 선택한다. 거부된 다른 사용자의 링크가 기존 정상 소유자 세션을 지우지 않는 회귀 검사도 추가했다. 새 회원가입·비밀번호 변경은 하지 않는다. 이전 이메일 수정에서는 실제 새 메일 클릭과 클라우드 재접속을 확인했다. 이번 Google 흐름은 실제 계정 선택 화면 연결까지 확인했으며 선택·동의 후 복귀는 아직 미검증이다.

기존 Workers Free 한도(계정 공유 100,000회/일)를 사용한다. 한도 도달 시 접속 실패 가능성이 있으며 자동 유료 전환은 신청하지 않았다. Access Free 가입도 카드와 초과 과금 동의를 요구해 완료하지 않았다. 새 유료 요금제·카드·Access 자원은 없다. Direct Upload `moa-diary`는 업로드·배포 없는 초안으로 보존하고 Git 연결 프로젝트 `moa-diary-web`만 사용한다.

새 프로젝트만 저장소 `gsh4124-cyber/page-tools`, Root Directory `moa`, 대상 브랜치 `feature/moa-integration-20261119`를 사용한다. 공개 설정 변수 `MOA_SUPABASE_URL`, `MOA_SUPABASE_PUBLISHABLE_KEY`는 같은 기존 Supabase를 가리켜야 한다. `vercel.json`이 빌드와 출력 폴더 `dist-vercel`을 지정한다. `node tools/prepare-vercel.mjs`는 검증된 cloud 빌드를 요구하고 보안 헤더를 기존 빌드와 비교한 뒤 공개 파일 7개만 복사한다. 기기 모드 빌드·헤더 불일치는 배포 준비를 실패시킨다. 로컬 실행에서 기존 후보와 파일 해시·헤더가 일치했다. Vercel의 실제 응답·로그인·데이터 격리 검사는 연결·배포 후 실행해야 하며 아직 미검증이다.

호스팅을 옮겨도 클라우드 기록은 같은 Supabase 계정에 남는다. 새 주소의 브라우저 기기 모드 데이터는 별도 저장 공간이므로 이전 주소의 로컬 기록을 자동 이전하지 않는다. 필요하면 이전 주소에서 암호화 백업을 내려받아 새 주소에서 복원한다. 기존 사이트·Cloudflare 세 제품·DNS·main은 변경하지 않는다.

실제 hosted 검사는 `tests/live-supabase.mjs`, `tests/media-live.mjs`, `tests/auth-live.mjs`, `tests/deployment.mjs`이며 설정·임시 자격 증명은 stdin으로만 받는다. 폐기한 QA 계정을 재사용하려면 별도 준비가 필요하다.

## 검증과 남은 항목

11월 24일 Google 로그인 변경에서 단위/로컬 DB/Worker26개와 최종 Worker 브라우저13개 검사군, 오류0을 확인했다. 실제 배포 Google 버튼과 구글 계정 선택 화면 연결을 확인했다. 합성 PKCE 성공·증명 누락·동의 거부·다른 계정 차단·기존 소유자 세션 보존은 로컬 최종 패키지 검증이다. 실제 Google 선택·동의 완료 후 모아 복귀는 사용자 확인 대기다.

직전 이메일 수정의 실제 새 메일→모아 복귀→새로고침 유지와 당시 운영 manifest 일치, SDK 모의 계약6개는 별도 과거 체크포인트로 보존한다. 앱11개·사진/긴 제목3개도 이전 결과다. 이번 Google 변경에서 운영 미디어/백업/격리 전체 재시험은 하지 않았다.

11월 20일 실제 Supabase 연결12개와 추가 운영6개 기능군에서는 미디어·사용자 격리·탈퇴·복구 메일·업로드 취소·별도 빈 계정 복원·정리를 확인했다. 이전 실제 48/96MiB 한도 및 배포 후 검사는 과거 결과이며, 이번 Cloudflare 로그인 수정 후 미디어/복원/격리를 다시 수행한 결과로 계산하지 않는다.

실기기 제공 불가로 Android/iOS 실기기는 미검증이다. 자연적인 토큰 만료까지 기다린 검사, 실제 케이블/망 단절·모바일 OS 종료, 모바일 메모리·코덱 전수, ChatGPT 소유자 대화형 로그인, 독립 off-site/PITR 재해복구와 실제 사용자 파일럿은 미검증이다. 탈퇴와 동시에 진행되는 모든 쓰기 순서의 전수 시험도 하지 않았다. 새 유료 자원·별도 SMTP/PITR·요금제 변경은 하지 않았다.

QA 미디어·예약·세션·문서는 모두 0개다. QA 계정 4개는 암호를 교체·폐기하고 영구 로그인 차단했다. 이전 계정 행 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다. 기존 사용자/프로필 1개를 보존했다. 전체 결과는 [QA_REPORT.md](QA_REPORT.md), 기계 판독 결과는 [qa-results.json](qa-results.json)에 기록한다.

## 운영·복구 절차

`node tools/health-check.mjs`에 승인된 프로젝트의 `{url,key}` 공개 설정을 stdin으로 전달하면 Auth 상태와 `moa_health`를 한 번 검사한다. 이번 실제 응답은 둘 다 200이었다. 새 Worker 후보는 개인정보 없는 `/healthz`를 제공한다. 화면의 진단 파일은 빌드·연결 상태·화면 크기·오류 코드만 포함하며 이메일·기록·토큰은 포함하지 않는다. 자동 감시·알림 구독은 만들지 않았다.

중요 기록 추가 후와 변경 전에는 전체 백업을 내려받고 암호를 별도로 보관한다. 보관 주기와 별도 저장 장소는 운영자가 정해야 하며, 외부 백업 공급자는 구성하지 않았다. `node tools/recovery-drill.mjs`는 stdin의 `{backupPath,backupPassword}`로 파일을 검증한다. 실제 복원은 추가로 `{restore:true,confirmEmptyTarget:true,url,key,email,password,expectedUserId}`가 필요하다. 명시한 빈 계정만 허용하며 문서와 파일 해시를 재조회한다. 기존 데이터가 있는 계정에는 이 운영 도구를 사용하지 않는다.

출시 전 파일럿은 동의한 사용자에게 가입·기록/사진·수정/삭제·다른 기기 재조회·백업 복원의 다섯 작업을 수행하게 하고 성공 여부·소요 시간·불편을 기록한다. 아직 사용자 모집·연락이나 실제 피드백 수집은 하지 않았다.
