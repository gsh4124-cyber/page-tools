# DEVICE CHECKUP — Security / Network integration

- branch: `feature/security-network-check`
- production: **NOT DEPLOYED**
- product decision: standalone `IP 침입 조회기`를 새 제품으로 만들지 않고 DEVICE CHECKUP의 Windows 보안·네트워크 정밀 점검 기능으로 흡수

## 사용자 질문

> **지금 확인해야 할 수상한 연결이나 접근 흔적이 있나?**

첫 화면은 이 질문과 정밀 점검 실행 행동을 우선한다. 원시 테이블·수치·방화벽 세부정보는 결과 이후 상세정보로 둔다.

## 현재 구현 범위

- DEVICE CHECKUP 홈에 `보안·네트워크 정밀 점검` 진입점 추가
- `security.html` 전용 설명/다운로드 화면 추가
- 로컬 helper ZIP `downloads/device-security-check-v1.zip` 추가
- helper가 읽기 전용으로 수집:
  - Windows Defender Firewall profile
  - current TCP connections
  - PID → process name
  - PID → Windows service name
  - Neighbor cache
  - readable Windows Firewall log tail 최대 5,000줄
- 로컬 분석 화면에서:
  - 원격 IP별 반복 접근/차단 패턴
  - 여러 포트 탐색 후보
  - 민감 포트 접근
  - 현재 연결과 프로세스/서비스
  - 같은 LAN의 기기 후보
  - Windows 방화벽 상태
  를 근거와 함께 표시

## 안전 경계

- 외부 호스트 스캔 없음
- 방화벽 규칙 변경 없음
- 프로세스 종료 없음
- 수집 증거 서버 업로드 없음
- `위험 신호 있음`은 침입 성공 확정이 아니라 **추가 확인 우선순위**
- Neighbor cache는 침입자 목록으로 단정하지 않음

## 현재 검증

- parser/core unit test: **PASS**
- helper ZIP integrity: **PASS**
- v0.3에서 발견된 빈 JSON 원인 `$PID` 자동변수 충돌은 v0.4 계열에서 수정
- 실제 Windows에서 통합 helper v1의 end-to-end 재검증: **PENDING**
- DEVICE CHECKUP production deploy / production browser QA: **NOT STARTED**
- 13-language localization / sitemap indexable expansion: **NOT STARTED**

## PASS 조건

1. 실제 Windows PC에서 `RUN-CHECK.cmd` 한 번으로 유효한 evidence 생성
2. 로컬 분석 결과 자동 표시
3. 정상 브라우저/Windows HTTPS 연결을 위험으로 과대평가하지 않음
4. 방화벽 DROP 방향·포트·프로세스/서비스·LAN 표기가 실제 증거와 일치
5. branch static/security checks PASS
6. 황제 실제 화면 확인 후 production 공개 여부 결정

현재 production `PROJECT_STATUS.md`의 기존 PASS는 그대로 유지한다. 이 기능은 위 Gate를 통과하기 전까지 production 완료로 승격하지 않는다.
