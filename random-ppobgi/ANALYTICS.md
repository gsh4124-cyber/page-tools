# 랜덤뽑기 익명 통계 수집 운영 기준 (2026-10-24)

## 신규 통계: 세 페이지 공통 Supabase

- 클라이언트는 기존 `/api/events` 경로로 범주값만 전송
- Cloudflare Pages Function은 유효성·출처·자동 QA 필터링 뒤 Supabase Edge Function `random-picker-event`로 전달
- Supabase 데이터 원본: `public.random_picker_events_daily`
- 사이트 배포는 기존 GitHub → Cloudflare Pages 자동 연결 그대로 유지
- **신규 통계 수집에 Cloudflare API 토큰, GitHub Actions Secret, D1 Binding이 필요하지 않음**
- 데이터베이스 관리자 키는 Supabase Edge 서버 환경에만 존재함; 브라우저 또는 GitHub 원본에 공개하지 않음
- Supabase 테이블에 RLS 활성화, 일반 방문자의 직접 읽기·쓰기는 차단

## 수집 항목

이벤트: `game_start`, `game_complete`, `reroll`, `exclude_reroll`.
차원: `event_date`, `event_name`, `method`, `input_mode`, `participant_bucket`, `result_mode`, `event_count`.

입력한 이름·번호 목록·결과 내용, 사용자/세션 식별자, IP·쿠키·리퍼러 등은 통계 테이블에 저장하지 않음.
헤드리스 브라우저, Playwright 및 `?qa=1` 검사 요청은 집계 제외.
잘못된 origin·카테고리·추가 필드는 거절하고, 저장 실패는 게임 실행을 차단하지 않음.

## 기존 D1 보존

- 기존 D1 데이터베이스 `random-ppobgi-analytics`는 삭제하지 않음
- 기존 D1 마이그레이션 파일은 과거 데이터 복구·대조용으로 보존
- 과거 D1 데이터는 **Supabase로 이전되지 않았음** (원본 조회 권한이 확보되지 않았기 때문)
- 신규 Supabase 통계는 별도 새 기준선부터 시작; 과거 데이터와 합산할 경우 중복 검증 필요
- 매일 실패하던 D1 조회 GitHub Actions 워크플로는 제거
- 다른 곳에서 사용할 수 있는 기존 Cloudflare 토큰을 임의로 삭제하지 않음

## 신규 통계 조회 (Supabase SQL)

```sql
SELECT event_date,event_name,method,SUM(event_count) AS total
FROM public.random_picker_events_daily
GROUP BY event_date,event_name,method
ORDER BY event_date DESC,event_name,method;
```

집계는 개별 사용자 수나 재방문율을 의미하지 않음.
