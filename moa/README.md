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

이메일 회원가입 후 받은 인증 링크를 계정 화면에 붙여 넣으면 인증과 로그인을 완료한다. 다른 제품과 공유하는 Auth 리디렉션·메일 설정은 바꾸지 않았다.

화면에 60% 이상 보이는 영상 하나만 음소거로 자동 재생한다. 화면 밖·숨긴 탭·동작 줄이기·데이터 절약 설정에서는 정지한다. 실제 코덱 지원은 브라우저에 따른다.

| 한도 | 값 |
|---|---|
| 첨부 | 기록당 6개, 파일당 25MiB |
| 기록에 연결된 미디어 | 사용자당 48MiB |
| 임시·복원 파일을 포함한 예약 | 사용자당 96MiB, 500개 |
| 글 데이터 | 2MiB, 기록 2,000개, 습관 100개 |
| 전체 백업 | 미디어 48MiB, 암호화 파일 100MiB |

백업은 AES-256-GCM, PBKDF2-SHA256 310,000회와 파일 SHA-256을 사용한다. 백업 암호는 보관·복구하지 않는다. 복원은 새 경로에 파일을 준비한 뒤 문서를 교체하고 이전 파일을 정리한다. 실패 응답이 불명확한 파일은 즉시 삭제하지 않는다. 하루 이상 지난 미사용 첨부는 아카이브의 정리 버튼으로 확인 후 지운다. 사용 중인 파일은 서버가 삭제·덮어쓰기를 막는다.

## Supabase 적용

기존 free 프로젝트 `afiqaibosavbjzkffggr`만 사용한다. `moa_documents`, `moa_media`에 RLS·FORCE RLS를 적용했고, `moa-private` 버킷은 비공개다. 함수는 SECURITY INVOKER와 빈 search_path를 사용한다. 파일 업로드·다운로드·삭제는 Storage API로 수행한다.

| 원격 적용 버전 | 내용 / 로컬 SQL |
|---|---|
| 20261119102755 | 초기 스키마 · `db/schema.sql` |
| 20261120011359 | 예약·용량·정리 보호 · `supabase/migrations/20261120010940_moa_media_budget.sql` |
| 20261120020023 | 업로드 사전 검사 호환·완료 크기 검증 · `supabase/migrations/20261120015919_moa_upload_probe_compatibility.sql` |

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

실제 hosted 검사는 `tests/live-supabase.mjs`, `tests/media-live.mjs`, `tests/auth-live.mjs`, `tests/deployment.mjs`이며 설정·임시 자격 증명은 stdin으로만 받는다. 폐기한 QA 계정을 재사용하려면 별도 준비가 필요하다.

## 검증과 남은 항목

단위/DB/응답 래퍼 13개, 로컬 브라우저 9개 검사군, 가상 Supabase 연결 6개, 실제 Supabase 연결 12개, 실제 용량/복원 8개, 배포 후 6개 검사군과 2개 정리를 통과했다. 공개 회원가입 메일 수신·인증 화면, 실제 토큰 갱신·폐기와 오래된 미사용 예약 정리도 확인했다.

실기기 제공 불가로 Android/iOS 실기기는 미검증이다. 자연적인 토큰 만료까지 기다린 검사, 실제 전송 중 케이블/망 단절, 모바일 메모리·코덱 전수, ChatGPT 소유자 대화형 로그인, 독립 off-site/PITR 재해복구는 미검증이다. 새 유료 자원·별도 SMTP/PITR·요금제 변경은 하지 않았다.

QA 미디어·예약·세션은 모두 0개이며 QA 계정 4개는 암호를 교체·폐기하고 영구 로그인 차단했다. 삭제 확인이 만료되어 계정·합성 프로필과 빈 문서 행은 남아 있다. 기존 사용자/프로필 1개는 보존했다. 전체 결과는 [QA_REPORT.md](QA_REPORT.md), 기계 판독 결과는 [qa-results.json](qa-results.json)에 기록한다.
