# DEVICE CHECKUP

새 PC·휴대폰 수령 직후 또는 중고 거래 전, 브라우저에서 약 5분 안에 기본 입출력 상태를 확인하는 기기 점검 허브입니다.

공개 사이트: https://pc-checkup.pages.dev/

## 제품 owner

이 저장소의 현재 제품 owner는 **DEVICE CHECKUP**입니다.

과거 공모전 제출 URL 보존을 위해 `refundproof/`, `proofrail/`, `finalcheck/` 등 일부 cross-project 자산이 legacy-host 예외로 남아 있습니다. 이들은 DEVICE CHECKUP 기능이나 현재 제품방향이 아닙니다.

경계 원본: `LEGACY_HOST_BOUNDARY.md`

## 기능

PC:
- 키보드
- 마우스
- 모니터
- 스피커/헤드폰
- 마이크
- 웹캠
- 5분 전체점검

휴대폰:
- 터치/멀티터치
- 화면 색상/불량화소
- 전·후면 카메라
- 마이크
- 스피커
- 진동/회전
- 결과/진행률 저장

브라우저가 직접 관찰할 수 있는 반응만 자동 판정합니다. 화면 결함·실제 청취·진동 체감처럼 사람 감각이 필요한 항목은 수동 판정을 유지하며, 브라우저가 볼 수 없는 것을 하드웨어 고장으로 단정하지 않습니다.

## 글로벌 구조

현재 `ko / en / ja / es / de / fr / pt / it / nl / id / vi / zh-CN / ru` 총 13개 언어를 지원합니다.

13개 언어 × 9개 기능 페이지 = **117 indexable URL** 구조입니다.

배포 시 공통 빌더와 후처리 스크립트가 `dist/`를 생성합니다.

- `tools/build_global.py.gz`
- `tools/expand_batch2.py`
- `tools/append_cn_ru.py`
- `tools/normalize_navigation_order.py`

각 페이지에는 canonical, hreflang, x-default, Open Graph, Twitter card, JSON-LD를 실제 URL 기준으로 생성합니다.

## Production

현재 production origin은 **Cloudflare Pages**입니다.

과거 GitHub Pages 배포·QA 기록은 역사적 기준선이며 current production origin으로 복원하지 않습니다.

검색 유통은 배포완료와 별도로 관리합니다.

- 배포 ≠ 검색엔진 등록
- 등록 ≠ sitemap 제출
- sitemap 제출 ≠ 색인
- 색인 ≠ 검색노출
- 노출 ≠ 실제 유입

## 개인정보 / 한계

카메라·마이크·키 입력을 제품 서버로 전송하는 기능을 두지 않습니다. 배터리 실제 열화, 침수, 수리 이력, SSD/RAM 심층 상태, 통신 품질 등 브라우저로 신뢰성 있게 판정하기 어려운 항목은 범위에서 제외합니다.

## 현재 검증 상태

- 글로벌 빌드: PASS
- Cloudflare production 배포: PASS
- 정적/Artifact QA: PASS WITH FIXES
- current-revision Production Browser QA: PASS
- Security Guardrails: PASS
- 인간 체감 QA: **황제 실제 노트북 검수 완료 / 반복 기기 Gate 없음**
- AdSense: REVIEW SUBMITTED / 외부 결과 대기
- 검색엔진 최종 계정상태·실제 색인·유입·시장성: 아직 별도 검증 대상

새 UI·기능 변경으로 실제 체감이 달라질 때만 새로운 Human QA Gate를 연다.

상세 최신 기술 상태는 `PROJECT_STATUS.md`를 기준으로 합니다.
