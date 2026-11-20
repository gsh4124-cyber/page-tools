# 모아 최종 검증

전체 판정은 **PARTIAL**이다. 구현·기존 Supabase 적용·소유자 전용 배포와 아래 실행 검사는 DONE이며, 실기기 등 실행하지 못한 항목은 분리했다. 기준일은 2026-11-20(KST)이다.

## 검증 대상과 실행 경계

- 기능 커밋: `53c71051d313d78a11f8f9ac8a1fe2705a52c886`, 지정 feature 브랜치.
- 프런트엔드 SHA-256: `5d1b768cddf7b23c04eaab4b80c43063414a17fb82f95974495c7f117ea8600b`. 로컬 실제 클라우드 검사와 배포 후 manifest에서 일치했다. 실행이 시작된 로컬 HEAD 표시는 이전 `5312b2f`지만 작업 파일 해시가 위 기능 커밋의 빌드와 같다.
- Sites 소스: `f71cd7325d5d1e6ce45e106b6b332db06c67e505`; Worker 산출물 SHA-256 `d9e1d6b3d225d20b8373b38cb5295676e3c354e7c357141ca6ac5ab60787d684`.
- 사이트: [모아](https://moa-diary-20261120.gsh4124.chatgpt.site), 버전 2, 소유자 전용, 외부 방문자 0. 일반 공개·초대·main 배포는 하지 않았다.
- Supabase: 기존 `afiqaibosavbjzkffggr`, free, ACTIVE_HEALTHY. 새 프로젝트/branch·유료 SMTP·PITR·도메인·요금제 변경 없음.
- 원본 33,644바이트·SHA-256 `2543b60bee56acdaa30f23462a5f9a003f4881771dfdc7f1eb826bfb1f42c5db` 일치. 원본을 추정 복원하지 않았다.
- Vault 최신 main의 START_HERE blob `61d1fb8836b03ac245e0877e9b4cbde86fa8c376`, owner Index·저장소 라우팅과 관련 QA/UI/보안 원칙 확인. DB context_packet은 vibecoding open 29/active 8/waiting 21을 읽었고 운영 상태는 수정하지 않았다.

## 실제 실행 결과

| 검사 | 판정 / 증거 |
|---|---|
| 단위·실제 PostgreSQL 엔진·Worker 응답 | DONE · 13개 통과 |
| 로컬 모바일 UI | DONE · 9개 검사군, 320/390/768/1280px 넘침 없음 |
| 가상 Supabase 연결 계약 | DONE · 6개, 실제 hosted 검사와 별도 |
| 실제 Auth/REST/RPC/GraphQL/Storage | DONE · 12개 |
| 실제 용량·동시성·대용량 복원 | DONE · 8개(정리 포함) |
| 실제 회원가입·인증 메일 | DONE · 연결된 소유자 Gmail QA 별칭 수신, 받은 토큰 인증 |
| 실제 인증 UI | DONE · 모아에서 인증 링크 붙여넣기·로그인, 외부 origin 링크 거부 |
| 실제 세션 | DONE · refresh token 교체·getUser·잘못된 access token 401·전역 로그아웃 후 갱신 거부 |
| 비공개 배포 후 검사 | DONE · 기능 6개 + 정리 2개, 브라우저 오류 0 |
| npm audit | DONE · 전체 의존성 취약점 0 |

로컬 UI는 습관 추가·체크·중복 거부·재조회, 일기/사진/영상/다꾸 작성, 수정·첨부 제거, 달력·검색·분류, 암호화 백업·삭제·복원, XSS 문자열의 일반 텍스트 표시, 잘못된 복원/파일 거부, 두 탭 충돌과 초안 보존을 확인했다. 계정 전환과 다른 탭 로그아웃에서 초안·선택 파일·백업 암호·복원 파일 상태 제거도 확인했다.

실제 A/B 로그인으로 본인 데이터만 읽고 쓰는지 검사했다. 타 사용자와 비로그인의 REST/RPC/GraphQL 읽기·위조 소유권 쓰기, 파일 읽기·업로드·덮어쓰기·삭제·서명 URL, 공개 경로 접근 차단을 확인했다. PNG와 재생 가능한 VP8 WebM을 업로드하고 재조회·전체 복원 후 SHA-256을 비교했다. 화면 중앙 자동 재생과 화면 밖 정지를 확인했다.

실제 용량 검사는 크기 허위 신고·예약 없는 업로드 차단, 24MiB 예약 5개 동시 요청 중 정확히 4개 허용, 48MiB 기록 허용·추가 1바이트 RPC/직접 REST 거부, 참조 중 삭제·덮어쓰기·예약 해제 차단, 48MiB 전체 암호화 백업·96MiB 임시 공간에서 안전한 교체·해시 일치, 25MiB 초과 거부를 확인했다. 대용량 바이트 검사용 PNG 표기 합성 버퍼는 코덱 검사로 계산하지 않는다.

배포 후에는 비인증의 앱 HTML 접근 차단, manifest·CSP·nosniff, 실제 로그인, 오래된 미사용 예약 정리, PNG/WebM 저장·재조회·자동 재생, 브라우저 암호화 백업·삭제·복원·해시, 별도 B 브라우저 격리를 다시 확인했다. 오래된 예약의 생성 시각은 QA 행 하나만 25시간 전으로 조정한 시험 조건이다. 실제 25시간 대기는 하지 않았다. `qa-evidence/deployed-mobile.png`를 직접 확인했다.

## 발견한 문제와 반영

- 예약만으로는 실제 크기를 확인할 수 없는 Storage 사전 검사 때문에 정상 업로드가 막혔다. 사전 단계는 소유 예약을 검사하고, 모아 버킷 완료 시 서버 메타데이터의 크기·MIME를 검증한다. 참조 문서 직접 쓰기에도 검사를 적용했다.
- 기존 권한 정책의 OR 확장, 사용 중 파일 삭제/덮어쓰기, 동시 예약으로 한도 초과, 계정 전환 시 비공개 초안 노출 경로를 차단했다.
- 삭제 후 캐시 사본이 반환되는 현상을 발견했다. 새 업로드 cacheControl 0, 읽기 cacheNonce/no-store로 변경하고 새 요청의 삭제 결과를 확인했다. [Supabase 캐시 설명](https://supabase.com/kb/troubleshooting/storage-private-bucket-files-still-accessible-after-remove-access-or-logout).
- 최초 정적 Sites 배포에서 `_headers`가 적용되지 않았다. 작은 Worker를 추가했고 두 번째 배포의 실제 응답 헤더를 검사했다.
- 테스트 MediaRecorder를 종료하자마자 track을 중지하면 WebM이 간헐적으로 손상됐다. 먼저 프레임 인코딩·종료 flush·디코딩을 확인하는 합성 영상 생성기로 고쳤다. 실패했던 실행을 성공으로 합산하지 않았다.
- Storage 스키마의 모아 전용 검증 트리거는 향후 Supabase 업그레이드 회귀가 필요하다. 파일 메타데이터를 SQL로 삽입·삭제하는 구현은 사용하지 않는다. [Storage 스키마 운영 지침](https://supabase.com/docs/guides/storage/schema/design).

## 기존 제품·데이터 보존

본 작업 커밋 범위와 마지막 작업 파일에서 변경 경로는 `moa/`뿐이다. 기존 세 제품, 공통 tools, workflows의 diff는 0이다. 다른 작업에서 main은 `909496de84b18f0c611b2cc2efb1c2d7cd5043d3`로 진행한 것을 읽었으며 병합·덮어쓰지 않았다.

초기 적용 전후 검사는 기존 컬럼·정책·버킷·원래 프로필 해시·Auth ID의 일치를 확인했다. 이번 추가 SQL은 모아 객체와 정확히 식별한 QA 계정만 변경했다. 기존 Auth/프로필은 각각 1개로 유지되고 기존 버킷 `global-shorts-publish`의 공개 여부·100MiB·MP4 설정을 보존했다.

운영 중 테이블의 행 수는 이전 검사 Bible 45/DEVICE 10/Random 568에서 현재 46/10/580이다. 동일 시각 스냅샷이 아니므로 이번 전후 값이 같다고 보고하지 않는다. 신규 날짜/기존 서비스 활동에 따른 증가로 보이나 원인 전수 감사는 하지 않았다. 모아 SQL은 이 테이블에 쓰지 않는다.

## QA 자료 정리와 남은 제한

QA 사진·영상 0개, 예약 0개, QA 세션 0개, QA 문서의 기록 0개를 재조회했다. QA 계정 4개는 비밀번호를 새 무작위 값으로 바꿔 폐기하고, 이전 암호의 실제 로그인 거부와 전역 로그아웃을 확인한 후 영구 로그인 차단했다.

계정 행 삭제는 이전 도구 확인 만료로 BLOCKED이며 우회하지 않았다. 합성 Auth/프로필 4개와 빈 QA 문서 행은 남아 있다. 기존 사용자 1개를 변경하지 않았다.

| 미검증 / 보류 | 이유 |
|---|---|
| Android/iOS 실기기·네이티브 picker·터치·키보드·코덱/메모리 전수 | NOT_TESTED · 사용자가 실기기 제공 불가 응답, ADB 연결 0대 |
| 실제 시간 경과 후 access token 만료 | NOT_TESTED · 수동 갱신/폐기·잘못된 토큰 거부와 구분 |
| 전송 도중 실제 망/케이블 단절·모바일 OS 종료 | NOT_TESTED · 전송 시작 전 AbortController 취소와 문서 보존·예약 복구만 실행 |
| 소유자 ChatGPT 대화형 로그인 | NOT_TESTED · native 소유자 정책과 지원되는 Site service bearer로 검증 |
| 독립 off-site/PITR 재해복구 | NOT_TESTED · 사용자 암호화 백업 복원과 구분, 새 유료 자원 미생성 |
| 일반 공개 출시·실제 사용/시장 성과 | HOLD · 소유자 전용 검토 배포까지만 수행 |

프로젝트 전체 advisor의 기존 경고는 별개다. 모아 관련 경고는 authenticated GraphQL 스키마 노출이며 실제 A/B 행 격리를 확인했다. 스키마를 볼 수 있다는 것과 타 사용자 데이터를 읽을 수 있다는 것을 구분한다. 모든 보안·실기기·운영 검증이 끝났다고 주장하지 않는다.
