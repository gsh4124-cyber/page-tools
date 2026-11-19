# 모아 검증 결과

검사일: 2026-11-19 KST. **기존 Supabase 적용과 실제 연결 검증은 DONE**: Auth·REST/RPC·GraphQL·비공개 Storage·사진/영상·백업 복원 12개 검사를 통과했다. 제품 전체 판정은 **PARTIAL**: 공개 회원가입/이메일 인증·실기기·외부 배포는 아직 미검증이다. 새 프로젝트·구독·비용·웹사이트 외부 배포 없이 기존 무료 프로젝트를 사용했다.

## 기준 확인 — DONE

- 최신 `hwangje-vault/main/START_HERE.md` blob `6f7f3290d334761eda2f833eda0c34d6018bde3d`, `직장/바이브코딩/_INDEX.md`, QA·코드검증, UI·UX, AI코딩 보안, 저장소 라우팅 원문을 읽었다.
- Supabase `afiqaibosavbjzkffggr`의 상태 `ACTIVE_HEALTHY`와 `hwangje_ops.context_packet` project key `vibecoding` 실제 행을 조회했다. 일부 과거 활성 포인터는 게임 보관 결정과 불일치하여 임의로 수정하지 않았다.
- 최초 조회 시 모아 테이블/버킷은 없었다. 이후 사용자 승인으로 migration `20261119102755_moa_private_diary_initial`을 적용했다. 기존 테이블·정책·버킷은 보존하고 모아 객체만 추가했다.
- v7 원본 바이트·SHA-256 일치 검사 통과. 추정 복원이 아니다.

## 최종 소스에서 실행 — DONE

| 검사 | 실제 결과 | 환경/한계 |
|---|---|---|
| `npm audit --json` | 전체 의존성 취약점 0건 | npm advisory 목록 기준. 보안 전체 보증은 아님 |
| 취약점 수정 | Playwright 1.55.0 → 1.65.1, lockfile 고정 | GHSA-7mvr-c777-76hp 개발 도구 브라우저 다운로드 인증서 검증 결함 제거 |
| `npm test` | 11개 성공, 실패 0 | Node 테스트 + PGlite PostgreSQL |
| 달력·입력 검사 | 윤년·잘못된 날짜·중복 ID·잘못된 미디어 경로/타 사용자 경로 거부 | 순수 로직 검사 |
| 백업 검사 | 사진 포함 암호화 왕복, 틀린 암호·변조·누락·URL 주입 거부 | 합성 파일 사용, 대용량/실기기 별도 |
| DB 접근 제어 | A의 생성/조회/수정, B의 읽기·수정 차단, 소유권 이전 차단 | 실제 PostgreSQL 엔진, Supabase 운영 서버 아님 |
| 비로그인·충돌 | anon 권한 거부, 익명 로그인 거부, 같은 버전 중복 저장 거부 | 테스트 Auth 함수/역할 구성 |
| 서버 입력·Storage | 잘못된 날짜·긴 글·공개 상태·타 사용자 미디어 경로 거부. 기존 permissive 정책이 있어도 제한 정책으로 타 사용자 파일 접근 차단 | Storage 카탈로그/정책을 PostgreSQL에서 시험; 실제 Storage HTTP 서비스 아님 |
| 빌드 | `npm run build` 성공 | 초기 로컬 검증 source SHA-256 `2c82032bb9fa074f1549dc8bf0ec3d720f6ffdb9d1119417181b015832b5ced9`; 적용 상태 SQL 주석만 갱신한 후 빌드 `1fac76e11ab0`도 성공. 기본 빌드는 cloudConfigured=false이며 실제 클라우드 검증은 아래 메모리 구성 빌드로 별도 실행 |
| 기존 제품 | 세 제품 각각 security_guardrails 통과, 소스·공통 도구·기존 workflow 변경 0 | 기존 제품 재배포·전체 기능 재검사는 하지 않음 |

## 최종 빌드 브라우저 검사 — DONE

Microsoft Edge Chromium + 모바일 viewport/터치 에뮬레이션. 실제 검사 대상은 commit `f3a16d4647544b7f9e2dfeadcebc37fbfbd0f881`, 빌드 `2c82032bb9fa074f1549dc8bf0ec3d720f6ffdb9d1119417181b015832b5ced9`다. 기존 `npm run qa:browser`를 현재 허용된 기본 실행 경로에서 성공적으로 실행했다.

- 브라우저 9개 검사군 성공, uncaught error 0. 320/390/768/1280px 가로 넘침 없음, CSP와 404 확인.
- 습관 추가·체크·중복 거부·새로고침 보존.
- 글·사진·실제 생성 WebM 작성, 다꾸, XSS 문자열이 글로만 표시됨.
- 영상 음소거·인라인 재생, 스크롤 밖 일시정지, 동작 줄이기 시 정지.
- 제목·날짜·분류·첨부 제거 수정, 새로고침, 검색·필터·달력 날짜별 보기.
- 암호화 전체 백업 다운로드 → 기록 삭제 → 복원 → 영상/습관 재확인.
- 손상된 백업·SVG 첨부 거부 시 기존 기록 유지, 두 탭 저장 충돌 시 입력 보존.
- 계정 창·키보드 닫기와 클라우드 미설정 안내.

실제 `supabase-js`를 사용하는 `npm run qa:cloud-contract` 브라우저 연결 검사 **6개**도 성공했다. API는 로컬에서 가상 응답으로 대체했다. 기기 기록 자동 전송 없음, A 저장·재조회·세션 새로고침, B 격리, 네트워크 장애 시 초안 유지, 별도 브라우저의 A 재조회 확인. 추가한 회귀 검사는 **다른 탭에서 로그아웃할 때 원래 탭의 비공개 제목·본문·선택 파일·백업 암호·복원 대기 파일이 모두 초기화되는지** 확인했다. 브라우저 오류 0건. 실제 hosted Auth나 클라우드 저장 성공으로 보고하지 않는다.

최종 빌드로 새로 생성한 스크린샷 `qa-evidence/home-{320,390,768,1280}.png`, `entry-mobile.png`, `calendar-mobile.png`와 JSON 결과는 로컬에 보존했다(개인 데이터가 아닌 합성 시험 자료). 최신 모바일 전체 화면과 기록 화면을 직접 시각 확인했으며 원본의 UI 구성·색·달력·다꾸가 반영되어 있다. 공유 가능한 검사 목록과 대상 identity는 `qa-results.json`에도 저장했다.

## 실행 경로 복구 — DONE

이전 실행에서는 앱 업데이트 이후 Edge 시작이 실패했고 샌드박스 밖 실행 요청도 거절되어 BLOCKED였다. 후속 실행에서 로컬 통신용 네트워크 권한을 요청·승인받은 뒤, 현재 세션의 일반 명령 실행으로 두 브라우저 검사가 성공했다. 권한 상승 실행, 샌드박스 설정 변경, 브라우저 보안 설정 완화는 사용하지 않았다.

기존 Playwright 검사 경로를 그대로 사용했다. 대안으로 준비했던 로컬 미리보기 검사 초안은 실행 증거로 사용하지 않았고 제거했다. 제품 런타임과 배포 설정은 이 QA 후속 작업에서 변경하지 않았다.

## 미실행·운영 잔여 — NOT_TESTED

- 공개 회원가입·인증 메일 전달, 시간 경과에 따른 토큰 만료/갱신.
- Android/iOS 실기기 터치·네이티브 picker·코덱·저장 공간/메모리 한계.
- 대용량/중단된 업로드·스토리지 총량·미참조 파일 청소·비용 상한, 독립 off-site 운영 백업과 복원 훈련.
- 외부 호스팅 생성·출시·배포 후 readback. 사용자가 승인하지 않았다.

## 기존 Supabase 실제 적용·검증 — DONE

프로젝트 `afiqaibosavbjzkffggr`, 플랜 `free`, 정상 상태 확인 후 모아 전용 테이블 1개·함수 2개·정책 7개·비공개 버킷 1개를 추가했다. 테이블은 RLS·FORCE RLS, RPC는 SECURITY INVOKER, 버킷은 비공개·25MB·명시적 MIME 제한이다. 기존 Auth 가입 설정은 바꾸지 않았다.

실제 검사 대상은 commit `f36282719fb6570aca9ea077652f3771343d1a86`의 실행 코드와 실제 프로젝트 공개 설정을 메모리에서 결합한 빌드 `b21c0fab923ee142350c91f7ab3b4b0724ba73dcaa9d4954c6c059d83c78cef3`다. 웹사이트 배포는 없고 로컬 서버 + 설치된 Chrome의 390×844 모바일 에뮬레이션으로 실행했다. 비밀번호·토큰·관리 키를 저장소에 추가하지 않았다. 임시 계정은 고유 QA 표식으로 SQL 준비했으며 로그인·인증 확인·REST/RPC/GraphQL/Storage 호출은 실제 Supabase 서비스에서 수행했다. 이메일을 발송하거나 JWT를 위조하지 않았다.

| 실제 검사 | 결과 |
|---|---|
| A/B 비밀번호 로그인·getUser ID 확인 | DONE |
| 본인 RPC 작성/조회·저장 충돌·비로그인 차단 | DONE |
| REST 타 사용자 읽기/수정/삽입·소유권 이전 차단 | DONE |
| GraphQL A/B 본인 행만 조회·비로그인 행 차단 | DONE |
| PNG 실제 업로드/다운로드·바이트 SHA-256 일치 | DONE |
| B/비로그인/공개 URL의 파일 읽기, 타 경로 쓰기/덮어쓰기/삭제/서명 차단, SVG 제한 | DONE |
| 실제 클라우드 암호화 백업 → 삭제 → 복원 → 재조회/해시 확인 | DONE |
| 모바일 브라우저 실제 로그인·기존 클라우드 기록 재조회 | DONE |
| PNG/WebM 실제 업로드·새로고침 후 보존 | DONE |
| 클라우드 영상 중앙 노출 시 자동 재생·화면 밖 일시정지 | DONE |
| 브라우저 암호화 백업 다운로드 → 기록 삭제 → 복원 → 사진/영상 해시 일치 | DONE |
| 별도 B 브라우저에서 A 기록 차단·B 작성 후 A에서 B 기록 차단 | DONE |

브라우저 오류 0건. 최신 캡처 `qa-evidence/hosted-mobile.png`를 직접 확인했다. 실제 미디어 로딩과 삭제 정리가 완료될 때까지 기다리도록 검사 타이밍을 보완했다. 검증 오류 출력에 임시 QA 암호가 포함된 문제는 파일 로그에서 제거하고 스크립트 출력 마스킹을 추가했다.

기존 public/hwangje_ops 컬럼·정책과 기존 버킷 설정이 동일하며, 기존 사용자 ID와 원래 프로필 데이터 해시도 동일하다. 기존 제품의 행 수는 Bible 45, DEVICE 10, Random 568로 전후 일치했다. 기존 세 제품 소스·공통 빌드·배포 workflow는 변경하지 않았다.

모아 테이블이 로그인한 사용자의 GraphQL 스키마에 보인다는 advisor 경고는 남는다. 테이블명/구조 발견과 행 접근은 구분하며, 실제 GraphQL에서도 A/B 본인 행만 보이고 비로그인은 차단되는 것을 검증했다. [관련 advisor 설명](https://supabase.com/docs/guides/database/database-linter?lint=0027_pg_graphql_authenticated_table_exposed).

임시 계정 정리: 합성 미디어 0개·테스트 세션 전역 로그아웃까지 확인했다. 계정 두 개의 삭제는 연결 도구 확인이 만료돼 아직 완료하지 않았다. 안전 조치로 두 계정의 암호를 새 무작위 값으로 교체해 폐기하고 기존 QA 암호가 거부되는 것을 실제 로그인 요청으로 확인했다. 기존 계정과 구분되는 QA 표식이 있으며 삭제/비활성 보관 방식에 대한 사용자 답변을 기다린다. 기존 계정 1개는 보존했고, 추가 QA 계정 2개와 그에 연결된 합성 프로필·문서 행만 남아 있다.

기존 Supabase 전체 프로젝트의 보안 advisor에는 모아와 무관한 함수 search_path·GraphQL 노출·privileged function 실행·유출 비밀번호 보호 관련 알림이 있었다. 기존 제품 보존 범위 때문에 수정하지 않았다. 이 프로젝트 전체가 보안 완료라는 의미도 아니다. 세부 remediation은 [Supabase database linter](https://supabase.com/docs/guides/database/database-linter), [Auth password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)를 참조한다.
