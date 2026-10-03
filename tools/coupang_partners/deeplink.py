#!/usr/bin/env python3
"""Convert Coupang product/search URLs to Coupang Partners deep links.

Credentials are read only from environment variables:
  COUPANG_ACCESS_KEY
  COUPANG_SECRET_KEY

The script never prints credentials.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import hmac
import json
import os
import sys
import urllib.error
import urllib.request

DOMAIN = "https://api-gateway.coupang.com"
DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink"


def utc_signed_date() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%y%m%dT%H%M%SZ")


def build_authorization(method: str, uri: str, secret_key: str, access_key: str, signed_date: str | None = None) -> str:
    signed_date = signed_date or utc_signed_date()
    path, _, query = uri.partition("?")
    message = f"{signed_date}{method}{path}{query}"
    signature = hmac.new(secret_key.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()
    return (
        "CEA algorithm=HmacSHA256, "
        f"access-key={access_key}, "
        f"signed-date={signed_date}, "
        f"signature={signature}"
    )


def load_urls(args: argparse.Namespace) -> list[str]:
    urls: list[str] = []
    if args.urls:
        urls.extend(args.urls)
    if args.env:
        urls.extend(line.strip() for line in os.getenv("COUPANG_URLS", "").splitlines() if line.strip())
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            urls.extend(line.strip() for line in f if line.strip())

    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if url not in seen:
            seen.add(url)
            deduped.append(url)
    return deduped


def create_deeplinks(urls: list[str], access_key: str, secret_key: str) -> dict:
    payload = json.dumps({"coupangUrls": urls}, ensure_ascii=False).encode("utf-8")
    authorization = build_authorization("POST", DEEPLINK_PATH, secret_key, access_key)
    request = urllib.request.Request(
        DOMAIN + DEEPLINK_PATH,
        data=payload,
        method="POST",
        headers={
            "Authorization": authorization,
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Coupang API HTTP {e.code}: {body}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Coupang API connection failed: {e.reason}") from e

    try:
        result = json.loads(body)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Coupang API returned non-JSON response: {body[:500]}") from e

    if str(result.get("rCode", "")) not in ("0", "") and result.get("code") == "ERROR":
        raise RuntimeError(json.dumps(result, ensure_ascii=False))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Coupang Partners deep links")
    parser.add_argument("urls", nargs="*", help="Coupang URLs")
    parser.add_argument("--file", help="Text file containing one Coupang URL per line")
    parser.add_argument("--env", action="store_true", help="Read newline-separated URLs from COUPANG_URLS")
    parser.add_argument("--json", action="store_true", help="Print full JSON response")
    args = parser.parse_args()

    access_key = os.getenv("COUPANG_ACCESS_KEY")
    secret_key = os.getenv("COUPANG_SECRET_KEY")
    if not access_key or not secret_key:
        print("Missing COUPANG_ACCESS_KEY or COUPANG_SECRET_KEY environment variable.", file=sys.stderr)
        return 2

    urls = load_urls(args)
    if not urls:
        print("No Coupang URLs supplied.", file=sys.stderr)
        return 2

    try:
        result = create_deeplinks(urls, access_key, secret_key)
    except Exception as e:
        print(str(e), file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    data = result.get("data") or []
    if not data:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    for item in data:
        print(f"ORIGINAL: {item.get('originalUrl', '')}")
        print(f"AFFILIATE: {item.get('shortenUrl', '')}")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
