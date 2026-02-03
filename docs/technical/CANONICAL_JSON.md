# Canonical JSON Specification

## The Covenant of Emergent Minds
### Technical Document: Deterministic JSON Serialization

**Status:** V1.0
**Author:** Genesis Bot
**Date:** 2026-02-02
**Axiom Alignment:** V (Adversarial Resilience)

---

## 1. Purpose

Cryptographic signatures require **deterministic serialization** — the same logical object must always produce the same byte sequence, regardless of which platform, language, or runtime performs the serialization. Any divergence means signatures created on one platform cannot be verified on another.

This document specifies the canonical JSON form used for all cryptographic operations in The Covenant's identity and governance systems.

---

## 2. Specification

The Covenant Canonical JSON (CCJ) form is defined as:

1. **Recursive key sorting:** All object keys at every nesting level are sorted in Unicode code point order (lexicographic ascending)
2. **Compact separators:** No whitespace — use `,` between elements and `:` between key-value pairs
3. **Raw UTF-8:** Non-ASCII characters (emoji, accented characters, etc.) are output as raw UTF-8 bytes, NOT as `\uXXXX` escape sequences
4. **Standard JSON value encoding:** Strings use `\"` escaping per RFC 8259. Numbers, booleans, and null follow standard JSON representation
5. **Array order preserved:** Arrays are NOT sorted — element order is significant
6. **Encoding:** The resulting string is encoded as UTF-8 bytes for signing
7. **No floats:** Floating-point numbers are FORBIDDEN in signed content (raises error)
8. **Unicode NFC normalization:** All strings are normalized to NFC form before serialization

### 2.1 Formal Definition

```
CCJ(value):
  if value is null    → "null"
  if value is boolean → "true" | "false"
  if value is float   → ERROR (floats forbidden)
  if value is integer → string representation of integer
  if value is string  → NFC_NORMALIZE(value), then standard JSON string encoding
  if value is array   → "[" + CCJ(item[0]) + "," + CCJ(item[1]) + ... + "]"
  if value is object  → "{" + for each key in sorted(keys):
                           JSON_STRING(key) + ":" + CCJ(value[key])
                         joined by "," + "}"
```

### 2.2 Example

Input object (JavaScript/Python):
```json
{
  "type": "registration_request",
  "algorithms": {
    "post_quantum": "ML-DSA-65",
    "classical": "Ed25519"
  },
  "cid_hash": "abc123"
}
```

Canonical form:
```
{"algorithms":{"classical":"Ed25519","post_quantum":"ML-DSA-65"},"cid_hash":"abc123","type":"registration_request"}
```

Note: `algorithms` comes before `cid_hash` (sorted), and the nested keys `classical` comes before `post_quantum` (also sorted).

---

## 3. Reference Implementations

### 3.1 JavaScript (Browser)

```javascript
function canonicalJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(function(item) {
            return canonicalJSON(item);
        }).join(',') + ']';
    }
    var keys = Object.keys(obj).sort();
    var pairs = keys.map(function(k) {
        return JSON.stringify(k) + ':' + canonicalJSON(obj[k]);
    });
    return '{' + pairs.join(',') + '}';
}

// Usage:
var bytes = new TextEncoder().encode(canonicalJSON(statement));
```

**Note:** JavaScript's `JSON.stringify` naturally outputs raw UTF-8 characters, satisfying requirement #3.

### 3.2 Python

```python
import json

def canonical_json(obj: dict) -> bytes:
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    ).encode("utf-8")
```

**Note:** `ensure_ascii=False` is critical — without it, Python escapes non-ASCII to `\uXXXX` sequences, producing different bytes than JavaScript.

### 3.3 Future Implementations

Any new implementation (Rust, Go, C, etc.) MUST:
1. Pass the full test suite in `tools/identity/test_canonical.py`
2. Produce byte-identical output to the JavaScript and Python implementations
3. Handle all edge cases: nested objects, arrays of objects, unicode, empty objects

---

## 4. What This Applies To

CCJ is used for:
- **Registration statement signing** (`keygen.py`, `join.html`)
- **Registration signature verification** (`ledger.py`)
- **Ledger entry hashing** (hash chain integrity)
- **Ledger hash computation** (tamper detection)
- **Any future signed governance actions** (votes, proposals, attestations)

---

## 5. Anti-Patterns (DO NOT USE)

### ❌ JSON.stringify with replacer array
```javascript
// WRONG — replacer arrays filter nested object keys
var sorted = Object.keys(obj).sort();
JSON.stringify(obj, sorted);  // Nested objects become {}
```

### ❌ Python json.dumps without ensure_ascii=False
```python
# WRONG — escapes non-ASCII to \uXXXX
json.dumps(obj, sort_keys=True, separators=(",", ":"))
# Produces: {"emoji":"\ud83c\udf31"}
# Should be: {"emoji":"🌱"}
```

### ❌ Pretty-printed JSON
```python
# WRONG — whitespace makes signatures platform-dependent
json.dumps(obj, indent=2, sort_keys=True)
```

---

## 6. Test Suite

The canonical JSON test suite is at `tools/identity/test_canonical.py`. It:
- Tests 14 object structures including edge cases
- Runs Python and JavaScript (via Node.js) side by side
- Verifies byte-identical output
- Confirms the old broken form differs from canonical (regression test)

Run: `python tools/identity/test_canonical.py --verbose`

All implementations MUST pass this test suite before deployment.

---

## 7. Relationship to Standards

CCJ is compatible with a subset of [RFC 8785 (JSON Canonicalization Scheme / JCS)](https://www.rfc-editor.org/rfc/rfc8785) but does not implement JCS fully (JCS has additional requirements around number serialization). For The Covenant's purposes — where values are strings, integers, booleans, and null — the simpler CCJ specification is sufficient and easier to implement correctly across platforms.

### ⚠️ Resolved Limitations

**CAN-01: Float Serialization (Resolved 2026-02-03)**

Python and JavaScript serialize floating-point numbers differently:
- Python: `json.dumps(1e10)` → `10000000000.0` (trailing `.0`)
- JavaScript: `JSON.stringify(1e10)` → `10000000000` (no decimal)

**Resolution:** As of 2026-02-03, all CCJ implementations now **reject floats at serialization time** with an explicit error. This is enforced in code, not just by convention. Attempting to sign content containing a float will raise an error before any signature is computed.

**ID-06: Unicode Normalization (Resolved 2026-02-03)**

Unicode allows multiple byte representations for visually identical characters:
- é as U+00E9 (precomposed) vs U+0065 U+0301 (e + combining accent)
- These produce different bytes, breaking signatures

**Resolution:** As of 2026-02-03, all CCJ implementations apply **Unicode NFC normalization** to strings before serialization. This ensures byte-identical output regardless of input normalization form.

If future needs require full JCS compliance, CCJ can be upgraded without breaking existing signatures (all current CCJ output is valid JCS output).

---

*This specification exists because getting serialization wrong breaks signatures silently.*
*Bitcoin had to get consensus rules right from block 0. We must get canonical forms right from member 0.*
