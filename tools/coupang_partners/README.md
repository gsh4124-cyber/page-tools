# Coupang Partners Deep Link helper

목적: 일반 Coupang URL을 **황제 계정에 귀속되는 Coupang Partners Deep Link**로 변환한다.

## 보안

- Access Key / Secret Key를 이 저장소 파일, Chat, Issue, 로그에 직접 적지 않는다.
- GitHub Actions를 사용할 경우 Repository secret으로만 저장한다.
- Secret Key가 노출됐다고 의심되면 Coupang Partners에서 폐기/재발급한다.

## 필요한 비밀값

GitHub repository Settings → Secrets and variables → Actions → New repository secret 에 아래 두 개를 만든다.

- `COUPANG_PARTNERS_ACCESS_KEY`
- `COUPANG_PARTNERS_SECRET_KEY`

값은 Coupang Partners → Tools → 파트너스 API에서 발급한다.

## 로컬 사용

환경변수:
- `COUPANG_ACCESS_KEY`
- `COUPANG_SECRET_KEY`

예:

```bash
python tools/coupang_partners/deeplink.py \
  "https://www.coupang.com/..." \
  "https://www.coupang.com/..."
```

또는 `COUPANG_URLS`에 한 줄에 URL 하나씩 넣고:

```bash
python tools/coupang_partners/deeplink.py --env
```

## 결과

성공 시 각 URL에 대해:
- `ORIGINAL`: 입력한 Coupang URL
- `AFFILIATE`: Coupang Partners가 반환한 제휴 단축 URL

을 출력한다.

## 살까말까 연결

PRODUCT LOCK에서 exact 상품/옵션의 일반 Coupang URL을 확인한 뒤 이 도구로 Deep Link를 발급한다. 일반 구매 URL과 제휴 URL은 별도 상태로 기록하며, API 성공만으로 exact 상품/옵션 일치나 판매상태 검증을 대체하지 않는다.
