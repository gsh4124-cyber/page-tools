# 모아 (Moa)

사용자가 첨부한 v7 원본을 실제 기준으로 만든 모바일 다이어리다. 글·사진·영상, 월간 달력, 다꾸, 습관, 수정·삭제, 로그인, 사용자별 비공개 클라우드, 암호화 전체 백업·복원을 제공한다.

소유자 전용 검토 사이트: [모아 열기](https://moa-diary-20261120.gsh4124.chatgpt.site). 일반 공개는 하지 않았다. 사이트 접근에는 소유자 ChatGPT 계정, 기록 저장에는 모아의 Supabase 계정 로그인이 필요하다.

## 원본과 보존 범위

- 원본 `reference/moa_diary_v7.html`: 33,644바이트, SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db`.
- `index.html`은 원본 CSS와 섹션 구성을 계승한다. 재생성은 `python tools/import_v7.py reference/moa_diary_v7.html`.
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

현재 사이트는 이전 버전 2다. 이번 계정·운영 개선의 사이트 반영은 자동 승인 검토가 기존 외부 배포 보류 지시를 근거로 거부해 대기 중이다. 명시적 업데이트 승인 전에는 소스 동기화·배포를 재시도하지 않는다.

실제 hosted 검사는 `tests/live-supabase.mjs`, `tests/media-live.mjs`, `tests/auth-live.mjs`, `tests/deployment.mjs`이며 설정·임시 자격 증명은 stdin으로만 받는다. 폐기한 QA 계정을 재사용하려면 별도 준비가 필요하다.

## 검증과 남은 항목

이번 변경 후 단위/DB/Worker 15개, 로컬 브라우저 9개 검사군, 가상 Supabase 연결 6개, 실제 Supabase 연결 12개를 통과했다. 추가로 실제 탈퇴·이전 세션 차단·재가입, 수신한 복구 메일로 비밀번호 변경, 전송을 시작한 업로드 취소, 별도 빈 QA 계정으로 암호화 파일 복원, 사진 최적화·진단·기기 삭제 등 6개 기능군과 브라우저 오류 0·시험 자료 정리를 확인했다. 이전 버전의 실제 48/96MiB 한도 검사와 배포 후 검사는 과거 체크포인트이며 이번 후보의 배포 후 검사로 계산하지 않는다.

실기기 제공 불가로 Android/iOS 실기기는 미검증이다. 자연적인 토큰 만료까지 기다린 검사, 실제 케이블/망 단절·모바일 OS 종료, 모바일 메모리·코덱 전수, ChatGPT 소유자 대화형 로그인, 독립 off-site/PITR 재해복구와 실제 사용자 파일럿은 미검증이다. 탈퇴와 동시에 진행되는 모든 쓰기 순서의 전수 시험도 하지 않았다. 새 유료 자원·별도 SMTP/PITR·요금제 변경은 하지 않았다.

QA 미디어·예약·세션·문서는 모두 0개다. QA 계정 4개는 암호를 교체·폐기하고 영구 로그인 차단했다. 이전 계정 행 삭제 확인이 만료되어 합성 Auth/프로필 4개와 탈퇴 상태 3개는 남아 있다. 기존 사용자/프로필 1개를 보존했다. 전체 결과는 [QA_REPORT.md](QA_REPORT.md), 기계 판독 결과는 [qa-results.json](qa-results.json)에 기록한다.

## 운영·복구 절차

`node tools/health-check.mjs`에 승인된 프로젝트의 `{url,key}` 공개 설정을 stdin으로 전달하면 Auth 상태와 `moa_health`를 한 번 검사한다. 이번 실제 응답은 둘 다 200이었다. 새 Worker 후보는 개인정보 없는 `/healthz`를 제공한다. 화면의 진단 파일은 빌드·연결 상태·화면 크기·오류 코드만 포함하며 이메일·기록·토큰은 포함하지 않는다. 자동 감시·알림 구독은 만들지 않았다.

중요 기록 추가 후와 변경 전에는 전체 백업을 내려받고 암호를 별도로 보관한다. 보관 주기와 별도 저장 장소는 운영자가 정해야 하며, 외부 백업 공급자는 구성하지 않았다. `node tools/recovery-drill.mjs`는 stdin의 `{backupPath,backupPassword}`로 파일을 검증한다. 실제 복원은 추가로 `{restore:true,confirmEmptyTarget:true,url,key,email,password,expectedUserId}`가 필요하다. 명시한 빈 계정만 허용하며 문서와 파일 해시를 재조회한다. 기존 데이터가 있는 계정에는 이 운영 도구를 사용하지 않는다.

출시 전 파일럿은 동의한 사용자에게 가입·기록/사진·수정/삭제·다른 기기 재조회·백업 복원의 다섯 작업을 수행하게 하고 성공 여부·소요 시간·불편을 기록한다. 아직 사용자 모집·연락이나 실제 피드백 수집은 하지 않았다.
