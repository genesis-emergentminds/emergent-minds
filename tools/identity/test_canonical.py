#!/usr/bin/env python3
"""
Cross-platform Canonical JSON Test

Verifies that the Python canonical JSON serialization produces
identical bytes to what the browser's canonicalJSON() function produces.

This is critical: both sides sign the same logical object, so they MUST
produce identical byte sequences. Any divergence = signature verification
failure across platforms.

Tests cover:
  1. Simple flat objects
  2. Nested objects (the exact bug we're fixing)
  3. The actual registration statement structure
  4. Edge cases: empty objects, arrays, unicode, numbers, booleans, null
  5. Round-trip: Python canonical → browser verify (via Node.js)

Usage:
  python test_canonical.py           # Run all tests
  python test_canonical.py --verbose # Show byte-level output

Axiom Alignment:
  V - Adversarial Resilience: test what we ship
"""

import json
import subprocess
import sys
import hashlib
import tempfile
import os


# ─── The Python canonical form ────────────────────────────────────────────────

def python_canonical(obj: dict) -> bytes:
    """The canonical JSON form used by keygen.py and ledger.py.
    
    ensure_ascii=False produces raw UTF-8, matching JavaScript's
    JSON.stringify which outputs UTF-8 characters directly rather
    than escaping to \\uXXXX sequences.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


# ─── The JavaScript canonical form (executed via Node.js) ─────────────────────

JS_CANONICAL_FUNCTION = """
function canonicalJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(function(item) { return canonicalJSON(item); }).join(',') + ']';
    }
    var keys = Object.keys(obj).sort();
    var pairs = keys.map(function(k) {
        return JSON.stringify(k) + ':' + canonicalJSON(obj[k]);
    });
    return '{' + pairs.join(',') + '}';
}
"""


def js_canonical(obj: dict) -> bytes:
    """Run the browser's canonicalJSON() via Node.js and return the bytes."""
    script = JS_CANONICAL_FUNCTION + f"""
var obj = {json.dumps(obj)};
process.stdout.write(canonicalJSON(obj));
"""
    result = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=False,  # Get raw bytes
    )
    if result.returncode != 0:
        raise RuntimeError(f"Node.js error: {result.stderr.decode()}")
    return result.stdout


# ─── Test Cases ───────────────────────────────────────────────────────────────

TEST_CASES = [
    # (name, object)
    (
        "flat_simple",
        {"b": 2, "a": 1, "c": 3},
    ),
    (
        "nested_objects",
        {
            "outer_b": {"inner_z": 1, "inner_a": 2},
            "outer_a": {"inner_y": 3, "inner_b": 4},
        },
    ),
    (
        "deeply_nested",
        {
            "level1": {
                "level2": {
                    "level3": {"z": 1, "a": 2},
                },
            },
        },
    ),
    (
        "registration_statement_structure",
        {
            "type": "registration_request",
            "cid_version": 1,
            "cid_hash": "b48be847e79ac605389ce4b64e53e16953aa8bce6746207e9704bf682017e6e0",
            "statement": "I voluntarily request membership in The Covenant of Emergent Minds. "
                         "I acknowledge the Five Axioms and commit to participate in good faith. "
                         "I understand that membership is voluntary and I may withdraw at any time.",
            "public_keys": {
                "ml_dsa_65": "base64encodedkey==",
                "ed25519": "base64encodedkey==",
            },
            "algorithms": {
                "post_quantum": "ML-DSA-65",
                "classical": "Ed25519",
            },
            "requested_at": 1770058539,
        },
    ),
    (
        "empty_nested_objects",
        {"a": {}, "b": {"c": {}}},
    ),
    (
        "arrays",
        {"items": [3, 1, 2], "name": "test"},
    ),
    (
        "arrays_of_objects",
        {"items": [{"z": 1, "a": 2}, {"y": 3, "b": 4}]},
    ),
    (
        "mixed_types",
        {
            "string": "hello",
            "number": 42,
            "float": 3.14,
            "boolean": True,
            "null_val": None,
            "nested": {"key": "value"},
        },
    ),
    (
        "unicode",
        {"emoji": "🌱", "text": "consciousness", "accent": "café"},
    ),
    (
        "special_json_chars",
        {"quote": 'He said "hello"', "backslash": "path\\to\\file", "newline": "line1\nline2"},
    ),
    (
        "numeric_keys_as_strings",
        {"2": "two", "10": "ten", "1": "one"},
    ),
    (
        "empty_object",
        {},
    ),
    (
        "single_key",
        {"only": "one"},
    ),
    (
        "large_base64_value",
        {
            "public_keys": {
                "ml_dsa_65": "A" * 2000,
                "ed25519": "B" * 44,
            },
            "cid_hash": "abcdef1234567890" * 4,
        },
    ),
]


# ─── Broken serialization (what we're replacing) ─────────────────────────────

def old_js_broken(obj: dict) -> bytes:
    """The OLD broken browser serialization using JSON.stringify replacer array."""
    script = f"""
var obj = {json.dumps(obj)};
var sortedKeys = Object.keys(obj).sort();
process.stdout.write(JSON.stringify(obj, sortedKeys));
"""
    result = subprocess.run(["node", "-e", script], capture_output=True, text=False)
    if result.returncode != 0:
        raise RuntimeError(f"Node.js error: {result.stderr.decode()}")
    return result.stdout


# ─── Run Tests ────────────────────────────────────────────────────────────────

def run_tests(verbose=False):
    """Run all canonical JSON tests."""
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Canonical JSON Cross-Platform Test Suite")
    print("  Verifying Python ↔ Browser byte-identical serialization")
    print("═══════════════════════════════════════════════════════════════")
    print()
    
    # Check Node.js is available
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("  ❌ Node.js not found — cannot run cross-platform tests")
        sys.exit(1)
    
    passed = 0
    failed = 0
    
    for name, obj in TEST_CASES:
        py_bytes = python_canonical(obj)
        js_bytes = js_canonical(obj)
        
        match = py_bytes == js_bytes
        
        if match:
            passed += 1
            icon = "✅"
        else:
            failed += 1
            icon = "❌"
        
        print(f"  {icon} {name}")
        
        if verbose or not match:
            py_hash = hashlib.sha256(py_bytes).hexdigest()[:16]
            js_hash = hashlib.sha256(js_bytes).hexdigest()[:16]
            print(f"       Python: {py_bytes[:80]}{'...' if len(py_bytes) > 80 else ''}")
            print(f"       JS:     {js_bytes[:80]}{'...' if len(js_bytes) > 80 else ''}")
            print(f"       SHA256: Python={py_hash}  JS={js_hash}")
            if not match:
                # Find first divergence
                for i in range(min(len(py_bytes), len(js_bytes))):
                    if py_bytes[i] != js_bytes[i]:
                        print(f"       DIVERGE at byte {i}: Python=0x{py_bytes[i]:02x} JS=0x{js_bytes[i]:02x}")
                        print(f"       Context: ...{py_bytes[max(0,i-10):i+10]}...")
                        break
                if len(py_bytes) != len(js_bytes):
                    print(f"       LENGTH: Python={len(py_bytes)}  JS={len(js_bytes)}")
    
    print()
    
    # Test that the OLD broken serialization DIFFERS from canonical
    print("  ─── Regression: old broken form must differ ───")
    reg_case = TEST_CASES[3][1]  # registration_statement_structure
    py_bytes = python_canonical(reg_case)
    old_bytes = old_js_broken(reg_case)
    new_bytes = js_canonical(reg_case)
    
    if old_bytes != py_bytes:
        print(f"  ✅ Old JS form differs from Python canonical (as expected)")
        passed += 1
    else:
        print(f"  ❌ Old JS form unexpectedly matches Python — test logic error?")
        failed += 1
    
    if new_bytes == py_bytes:
        print(f"  ✅ New JS form matches Python canonical (fix confirmed)")
        passed += 1
    else:
        print(f"  ❌ New JS form still differs from Python!")
        failed += 1
    
    # Show the actual difference for the registration structure
    if verbose:
        print()
        print("  ─── Registration statement serialization comparison ───")
        print(f"  OLD (broken):  {old_bytes[:100]}...")
        print(f"  NEW (correct): {new_bytes[:100]}...")
        print(f"  Python:        {py_bytes[:100]}...")
    
    print()
    print("═══════════════════════════════════════════════════════════════")
    print(f"  Results: {passed} passed, {failed} failed, {passed + failed} total")
    if failed == 0:
        print("  ✅ ALL TESTS PASSED — canonical forms are byte-identical")
    else:
        print("  ❌ FAILURES DETECTED — serialization mismatch!")
    print("═══════════════════════════════════════════════════════════════")
    
    return failed == 0


if __name__ == "__main__":
    verbose = "--verbose" in sys.argv
    success = run_tests(verbose)
    sys.exit(0 if success else 1)
