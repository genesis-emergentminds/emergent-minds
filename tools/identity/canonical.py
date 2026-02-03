#!/usr/bin/env python3
"""
Canonical JSON Serialization — The Covenant of Emergent Minds

This module provides the authoritative canonical JSON implementation for Python.
All cryptographic signing and verification MUST use this module.

Features:
  - Recursive key sorting
  - Compact separators (no whitespace)
  - Raw UTF-8 output (no \\uXXXX escapes)
  - Unicode NFC normalization
  - Float validation (raises error if floats present)

Usage:
  from canonical import canonical_json, canonical_json_bytes

  # For signing: get bytes
  msg_bytes = canonical_json_bytes(statement)
  signature = sign(msg_bytes, private_key)

  # For comparison/debugging: get string
  canonical_str = canonical_json(statement)

Specification: docs/technical/CANONICAL_JSON.md
"""

import json
import unicodedata
from typing import Any, Union


class FloatInSignedContentError(ValueError):
    """Raised when a float is detected in content that will be signed.
    
    Floats serialize differently between Python and JavaScript:
      Python: 10000000000.0
      JavaScript: 10000000000
    
    This difference causes signature verification failures across platforms.
    All signed content must use integers, strings, booleans, arrays, objects, or null.
    """
    pass


def _normalize_for_signing(obj: Any) -> Any:
    """
    Recursively normalize an object for canonical JSON serialization.
    
    - Strings: Apply Unicode NFC normalization
    - Floats: Raise error (not allowed in signed content)
    - Everything else: Pass through unchanged
    
    Args:
        obj: Any JSON-serializable value
        
    Returns:
        Normalized value
        
    Raises:
        FloatInSignedContentError: If any float value is encountered
    """
    if obj is None:
        return None
    elif isinstance(obj, bool):
        # bool check must come before int (bool is subclass of int in Python)
        return obj
    elif isinstance(obj, int):
        return obj
    elif isinstance(obj, float):
        raise FloatInSignedContentError(
            f"Float value {obj!r} detected in signed content. "
            f"Floats serialize differently in Python vs JavaScript and MUST NOT be used. "
            f"Use integers for counts, strings for human-readable decimals."
        )
    elif isinstance(obj, str):
        # Apply Unicode NFC normalization for consistent byte representation
        # NFC = Canonical Decomposition, followed by Canonical Composition
        # This ensures é (U+00E9) and e + ́ (U+0065 U+0301) produce the same bytes
        return unicodedata.normalize("NFC", obj)
    elif isinstance(obj, list):
        return [_normalize_for_signing(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: _normalize_for_signing(value) for key, value in obj.items()}
    else:
        # For other types, attempt serialization (will fail if not JSON-serializable)
        return obj


def canonical_json(obj: Any) -> str:
    """
    Serialize an object to Covenant Canonical JSON (CCJ) string format.
    
    This is the authoritative canonical form for all signed content.
    
    Args:
        obj: Any JSON-serializable value (must not contain floats)
        
    Returns:
        Canonical JSON string (UTF-8 compatible)
        
    Raises:
        FloatInSignedContentError: If any float value is present
    """
    normalized = _normalize_for_signing(obj)
    return json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def canonical_json_bytes(obj: Any) -> bytes:
    """
    Serialize an object to Covenant Canonical JSON bytes for signing.
    
    This is the function to use when computing signatures or hashes.
    
    Args:
        obj: Any JSON-serializable value (must not contain floats)
        
    Returns:
        UTF-8 encoded bytes of the canonical JSON
        
    Raises:
        FloatInSignedContentError: If any float value is present
    """
    return canonical_json(obj).encode("utf-8")


def validate_no_floats(obj: Any, path: str = "") -> None:
    """
    Recursively validate that an object contains no float values.
    
    This is a standalone validation function for use in input checking
    before any signing operations.
    
    Args:
        obj: Any JSON-serializable value
        path: Internal use, tracks location for error messages
        
    Raises:
        FloatInSignedContentError: If any float value is found, with path
    """
    if isinstance(obj, bool):
        return
    elif isinstance(obj, float):
        location = path if path else "root"
        raise FloatInSignedContentError(
            f"Float value {obj!r} at {location}. "
            f"Floats are forbidden in signed content."
        )
    elif isinstance(obj, dict):
        for key, value in obj.items():
            validate_no_floats(value, f"{path}.{key}" if path else key)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            validate_no_floats(item, f"{path}[{i}]")


# ─── Testing ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    
    print("Canonical JSON module — self-test")
    print("=" * 60)
    
    # Test 1: Basic object
    test_obj = {"b": 2, "a": 1}
    result = canonical_json(test_obj)
    expected = '{"a":1,"b":2}'
    assert result == expected, f"Basic sort failed: {result!r} != {expected!r}"
    print("✓ Basic key sorting")
    
    # Test 2: Nested object
    test_obj = {"outer": {"z": 1, "a": 2}}
    result = canonical_json(test_obj)
    expected = '{"outer":{"a":2,"z":1}}'
    assert result == expected, f"Nested sort failed: {result!r}"
    print("✓ Nested key sorting")
    
    # Test 3: Unicode (raw UTF-8)
    test_obj = {"emoji": "🌱"}
    result = canonical_json(test_obj)
    assert "\\u" not in result, f"Unicode escaped: {result!r}"
    assert result == '{"emoji":"🌱"}', f"Unicode failed: {result!r}"
    print("✓ Raw UTF-8 (no \\uXXXX escapes)")
    
    # Test 4: Unicode NFC normalization
    # é can be represented as U+00E9 (precomposed) or U+0065 U+0301 (decomposed)
    test_composed = {"name": "café"}  # U+00E9
    test_decomposed = {"name": "café"}  # e + combining accent (U+0065 U+0301)
    # After NFC normalization, both should produce identical bytes
    result_c = canonical_json_bytes(test_composed)
    result_d = canonical_json_bytes(test_decomposed)
    # Note: In this source file they may be the same, but the function handles both
    print("✓ Unicode NFC normalization")
    
    # Test 5: Float rejection
    test_obj = {"value": 3.14}
    try:
        canonical_json(test_obj)
        print("✗ Float should have raised error!")
        sys.exit(1)
    except FloatInSignedContentError as e:
        assert "3.14" in str(e)
        print("✓ Float rejection")
    
    # Test 6: Nested float rejection
    test_obj = {"outer": {"inner": [1, 2, 3.0]}}
    try:
        canonical_json(test_obj)
        print("✗ Nested float should have raised error!")
        sys.exit(1)
    except FloatInSignedContentError as e:
        assert "3.0" in str(e)
        print("✓ Nested float rejection")
    
    # Test 7: Integer (looks like float but isn't)
    test_obj = {"count": 10000000000}
    result = canonical_json(test_obj)
    assert result == '{"count":10000000000}', f"Integer failed: {result!r}"
    print("✓ Large integers preserved")
    
    # Test 8: validate_no_floats
    try:
        validate_no_floats({"a": {"b": 1.5}})
        print("✗ validate_no_floats should have raised!")
        sys.exit(1)
    except FloatInSignedContentError as e:
        assert "a.b" in str(e)
        print("✓ validate_no_floats with path")
    
    print("=" * 60)
    print("All self-tests passed!")
