# 모아 검증 결과

검사일: 2026-11-19 KST. 전체 판정 **PARTIAL**: 소스 구현·로컬 단위/DB 검사 완료, hosted 클라우드·실기기·최종 브라우저 재검사는 남아 있다. 외부 배포·비용·운영 DB 변경 없음.

## 기준 확인 — DONE

- 최신 `hwangje-vault/main/START_HERE.md` blob `6f7f3290d334761eda2f833eda0c34d6018bde3d`, `직장/바이브코딩/_INDEX.md`, QA·코드검증, UI·UX, AI코딩 보안, 저장소 라우팅 원문을 읽었다.
- Supabase `afiqaibosavbjzkffggr`의 상태 `ACTIVE_HEALTHY`와 `hwangje_ops.context_packet` project key `vibecoding` 실제 행을 조회했다. 일부 과거 활성 포인터는 게임 보관 결정과 불일치하여 임의로 수정하지 않았다.
- 조회 시 모아 테이블/버킷은 없었다. 운영 DB를 변경하지 않았다.
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
| 빌드 | `npm run build` 성공 | source SHA-256 `2c82032bb9fa074f1549dc8bf0ec3d720f6ffdb9d1119417181b015832b5ced9`, cloudConfigured=false |
| 기존 제품 | 세 제품 각각 security_guardrails 통과, 소스·공통 도구·기존 workflow 변경 0 | 기존 제품 재배포·전체 기능 재검사는 하지 않음 |

## 이전 개발 빌드에서 직접 실행 — DONE, 최종 빌드로 승격하지 않음

Microsoft Edge Chromium + 모바일 viewport/터치 에뮬레이션, 빌드 `d28f3bf3e997f29048dee2403de8c849f91bf1c2e661d8bed68ada40acd188ce`:

- 브라우저 9개 검사군 성공, uncaught error 0. 320/390/768/1280px 가로 넘침 없음, CSP와 404 확인.
- 습관 추가·체크·중복 거부·새로고침 보존.
- 글·사진·실제 생성 WebM 작성, 다꾸, XSS 문자열이 글로만 표시됨.
- 영상 음소거·인라인 재생, 스크롤 밖 일시정지, 동작 줄이기 시 정지.
- 제목·날짜·분류·첨부 제거 수정, 새로고침, 검색·필터·달력 날짜별 보기.
- 암호화 전체 백업 다운로드 → 기록 삭제 → 복원 → 영상/습관 재확인.
- 손상된 백업·SVG 첨부 거부 시 기존 기록 유지, 두 탭 저장 충돌 시 입력 보존.
- 계정 창·키보드 닫기와 클라우드 미설정 안내.

실제 `supabase-js`를 사용하는 브라우저 연결 검사 5개도 성공했다. API는 로컬에서 가상 응답으로 대체했다. 기기 기록 자동 전송 없음, A 저장·재조회·세션 새로고침, 로그아웃 시 기록/비공개 초안 제거, B 격리, 네트워크 장애 시 초안 유지, 별도 브라우저의 A 재조회 확인. 실제 hosted Auth나 클라우드 저장 성공으로 보고하지 않는다.

스크린샷 `qa-evidence/home-{320,390,768,1280}.png`, `entry-mobile.png`, `calendar-mobile.png`와 JSON 결과는 로컬에 보존했다(개인 데이터가 아닌 합성 시험 자료). 모바일 전체 화면은 직접 시각 확인했으며 원본의 UI 구성·색·달력·다꾸가 반영되어 있다.

## 최종 브라우저 재검사 — BLOCKED

마지막 동작 변경은 계정 전환 시 백업 암호·선택 백업 파일도 비우는 보완과 Playwright 취약점 업데이트다. build `8b9ea043f0e2`에서 두 브라우저 명령을 다시 실행했으나 앱 업데이트 이후 샌드박스가 Edge 시작을 막았다(`Target page, context or browser has been closed`, crashpad named-pipe 오류). 샌드박스 밖 실행 요청도 현재 granular approval 정책의 `sandbox_approval:false`로 자동 거절됐다. 이후 파생 HTML의 줄바꿈·끝 공백만 정규화한 최종 build는 `2c82032bb9fa`이며 단위 검사 11개와 빌드를 다시 통과했다. 통과한 이전 브라우저 JSON을 최종 빌드 결과로 덮어쓰지 않았다.

현재 Browser 스킬의 지정 `SKILL.md`가 설치 경로에 없어 문서화된 대체 브라우저 실행도 구성하지 못했다. 이 제한을 피해 별도 실행 통로를 만들지 않았다.

## 미실행·운영 잔여 — NOT_TESTED

- 운영 Supabase 스키마 적용, 실제 이메일 회원가입/인증/로그인·토큰 만료·실제 REST/RPC/Storage 두 사용자 공격 검사.
- 실제 클라우드 파일 업로드·미디어 재생·삭제·기기 간 동기화·백업 복원.
- Android/iOS 실기기 터치·네이티브 picker·코덱·저장 공간/메모리 한계.
- 대용량/중단된 업로드·스토리지 총량·미참조 파일 청소·비용 상한, 독립 off-site 운영 백업과 복원 훈련.
- 외부 호스팅 생성·출시·배포 후 readback. 사용자가 승인하지 않았다.

기존 Supabase 전체 프로젝트의 보안 advisor에는 모아와 무관한 함수 search_path·GraphQL 노출·privileged function 실행·유출 비밀번호 보호 관련 알림이 있었다. 기존 제품 보존 범위 때문에 수정하지 않았다. 이 프로젝트 전체가 보안 완료라는 의미도 아니다. 세부 remediation은 [Supabase database linter](https://supabase.com/docs/guides/database/database-linter), [Auth password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)를 참조한다.
