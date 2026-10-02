from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAX_SCAN_BYTES = 2_000_000

SECRET_PATTERNS = {
    "OpenAI key": re.compile(rb"sk-[A-Za-z0-9_-]{20,}"),
    "Anthropic key": re.compile(rb"sk-ant-[A-Za-z0-9_-]{20,}"),
    "GitHub token": re.compile(rb"gh[pousr]_[A-Za-z0-9_]{30,}"),
    "AWS access key": re.compile(rb"AKIA[0-9A-Z]{16}"),
    "Google API key": re.compile(rb"AIza[0-9A-Za-z_-]{35}"),
    "Supabase secret key": re.compile(rb"sb_secret_[A-Za-z0-9_-]{20,}"),
    "Private key block": re.compile(rb"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----"),
}

SENSITIVE_EXACT = {".env", "credentials.json", "service-account.json", "service_account.json", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"}
SENSITIVE_SUFFIXES = (".pem", ".key", ".p12", ".pfx")


def fail(message: str) -> None:
    print(f"SECURITY_GUARDRAIL_FAIL: {message}")
    raise SystemExit(1)


def tracked_files() -> list[str]:
    result = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True)
    return [p.decode("utf-8") for p in result.stdout.split(b"\0") if p]


def is_sensitive_name(relative: str) -> bool:
    name = Path(relative).name.lower()
    if name in SENSITIVE_EXACT:
        return True
    if name.startswith(".env.") and name not in {".env.example", ".env.sample"}:
        return True
    if name.startswith("credentials") and name.endswith(".json"):
        return True
    if name.startswith("service-account") and name.endswith(".json"):
        return True
    if name.startswith("service_account") and name.endswith(".json"):
        return True
    return name.endswith(SENSITIVE_SUFFIXES)


def main() -> None:
    tracked = tracked_files()
    for relative in tracked:
        if is_sensitive_name(relative):
            fail(f"sensitive file is tracked: {relative}")
    for relative in tracked:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size > MAX_SCAN_BYTES:
            continue
        data = path.read_bytes()
        if b"\0" in data:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(data):
                fail(f"{label} pattern found in tracked file: {relative}")
    print(f"SECURITY_GUARDRAIL_PASS: scanned {len(tracked)} tracked paths")


if __name__ == "__main__":
    main()
