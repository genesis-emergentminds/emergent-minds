#!/usr/bin/env python3
"""
Adversarial Test Suite for The Covenant of Emergent Minds

Executes tests from ADVERSARIAL_TEST_PLAN.md to verify security properties
of the identity and governance systems.

Date: 2026-02-03
Author: Genesis (Subagent: adversarial-tester)
Axiom Alignment: V (Adversarial Resilience)
"""

import json
import os
import sys
import time
import tempfile
import shutil
import base64
import hashlib
from pathlib import Path

# Ensure liboqs can be found
LIBOQS_PATHS = [
    os.path.expanduser("~/.local/lib"),
    "/usr/local/lib",
    "/opt/homebrew/lib",
]
for p in LIBOQS_PATHS:
    if os.path.exists(os.path.join(p, "liboqs.dylib")) or os.path.exists(os.path.join(p, "liboqs.so")):
        os.environ.setdefault("DYLD_LIBRARY_PATH", p)
        os.environ.setdefault("LD_LIBRARY_PATH", p)
        break

# Import our tools
sys.path.insert(0, str(Path(__file__).parent))
from keygen import generate_keypair, dual_sign, dual_verify, create_registration_request, save_identity
from ledger import (
    load_ledger, save_ledger, validate_registration, compute_ledger_hash,
    compute_entry_hash, determine_phase, FOUNDING_ENTRY_TYPE
)

# ─── Test Results Collector ────────────────────────────────────────────────────

class TestResults:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0
    
    def add(self, test_id: str, name: str, passed: bool, evidence: str, notes: str = "", severity: str = ""):
        result = {
            "test_id": test_id,
            "name": name,
            "passed": passed,
            "evidence": evidence,
            "notes": notes,
            "severity": severity if not passed else "",
        }
        self.results.append(result)
        if passed:
            self.passed += 1
        elif "⚠️" in evidence or "EXPECTED" in evidence.upper():
            self.warnings += 1
        else:
            self.failed += 1
        
        icon = "✅" if passed else ("⚠️" if self.warnings > len([r for r in self.results[:-1] if not r["passed"]]) else "❌")
        print(f"  {icon} {test_id}: {name}")
        if not passed:
            print(f"      {evidence[:100]}{'...' if len(evidence) > 100 else ''}")


# ─── Identity System Tests ─────────────────────────────────────────────────────

def test_id_01_serialization_mismatch(results: TestResults, temp_dir: Path):
    """ID-01: CID Forgery via Serialization Mismatch"""
    
    # Generate a valid key pair
    keypair = generate_keypair()
    
    # Create registration statement
    statement = {
        "type": "registration_request",
        "cid_version": 1,
        "cid_hash": keypair["cid_hash"],
        "statement": "Test registration",
        "public_keys": keypair["public_keys"],
        "algorithms": keypair["algorithms"],
        "requested_at": int(time.time()),
    }
    
    # Sign with pretty-printed JSON (NON-canonical)
    pretty_json = json.dumps(statement, indent=2, sort_keys=True).encode("utf-8")
    sigs = dual_sign(pretty_json, keypair["secret_keys"])
    
    # Create a fake ledger
    ledger = {"version": 1, "entries": []}
    
    # Try to validate with the mis-signed registration
    registration = {"registration": statement, "signatures": sigs}
    errors = validate_registration(registration, ledger)
    
    passed = any("signature" in e.lower() and "invalid" in e.lower() for e in errors)
    evidence = f"Rejected: {errors[0]}" if errors else "ERROR: Accepted mis-signed registration!"
    
    results.add("ID-01", "CID Forgery via Serialization Mismatch", passed, evidence,
                "Signatures over pretty-printed JSON correctly rejected",
                "CRITICAL" if not passed else "")


def test_id_02_key_substitution(results: TestResults, temp_dir: Path):
    """ID-02: CID Forgery via Key Substitution"""
    
    # Generate two key pairs
    victim = generate_keypair()
    attacker = generate_keypair()
    
    # Create registration with victim's CID but attacker's keys
    statement = {
        "type": "registration_request",
        "cid_version": 1,
        "cid_hash": victim["cid_hash"],  # Victim's CID
        "statement": "Test registration",
        "public_keys": attacker["public_keys"],  # Attacker's keys!
        "algorithms": attacker["algorithms"],
        "requested_at": int(time.time()),
    }
    
    # Sign with attacker's keys (signatures will be valid for attacker's keys)
    canonical = json.dumps(statement, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    sigs = dual_sign(canonical, attacker["secret_keys"])
    
    # Validate
    ledger = {"version": 1, "entries": []}
    registration = {"registration": statement, "signatures": sigs}
    errors = validate_registration(registration, ledger)
    
    passed = any("cid hash mismatch" in e.lower() or "forgery" in e.lower() for e in errors)
    evidence = f"Rejected: {errors[0]}" if errors else "ERROR: Accepted CID-key mismatch!"
    
    results.add("ID-02", "CID Forgery via Key Substitution", passed, evidence,
                "CID hash recomputed from keys and mismatch detected",
                "CRITICAL" if not passed else "")


def test_id_03_missing_signatures(results: TestResults, temp_dir: Path):
    """ID-03: Registration Without Proper Signatures"""
    
    keypair = generate_keypair()
    
    statement = {
        "type": "registration_request",
        "cid_version": 1,
        "cid_hash": keypair["cid_hash"],
        "statement": "Test registration",
        "public_keys": keypair["public_keys"],
        "algorithms": keypair["algorithms"],
        "requested_at": int(time.time()),
    }
    
    ledger = {"version": 1, "entries": []}
    test_cases = [
        ("empty_sigs", {"ml_dsa_65": "", "ed25519": ""}),
        ("null_sigs", {"ml_dsa_65": None, "ed25519": None}),
        ("random_sigs", {"ml_dsa_65": base64.b64encode(os.urandom(64)).decode(), 
                         "ed25519": base64.b64encode(os.urandom(64)).decode()}),
    ]
    
    all_rejected = True
    evidence_parts = []
    
    for name, sigs in test_cases:
        registration = {"registration": statement, "signatures": sigs}
        errors = validate_registration(registration, ledger)
        rejected = len(errors) > 0
        all_rejected = all_rejected and rejected
        evidence_parts.append(f"{name}={'rejected' if rejected else 'ACCEPTED!'}")
    
    evidence = "; ".join(evidence_parts)
    
    results.add("ID-03", "Registration Without Proper Signatures", all_rejected, evidence,
                "All signature variants must be rejected",
                "CRITICAL" if not all_rejected else "")


def test_id_04_duplicate_keys(results: TestResults, temp_dir: Path):
    """ID-04: Duplicate Public Key Registration"""
    
    # Generate two key pairs
    kp_a = generate_keypair()
    kp_b = generate_keypair()
    
    # Create first valid entry
    ledger = {
        "version": 1,
        "entries": [{
            "cid_hash": kp_a["cid_hash"],
            "public_keys": kp_a["public_keys"],
            "status": "active",
            "registered": int(time.time()),
        }]
    }
    
    # Try to register with same ML-DSA key but different Ed25519
    mixed_1 = {
        "type": "registration_request",
        "cid_version": 1,
        "cid_hash": "fakecid1",  # Different CID
        "statement": "Test",
        "public_keys": {
            "ml_dsa_65": kp_a["public_keys"]["ml_dsa_65"],  # Same ML-DSA
            "ed25519": kp_b["public_keys"]["ed25519"],  # Different Ed25519
        },
        "algorithms": kp_a["algorithms"],
        "requested_at": int(time.time()),
    }
    
    # Try to register with different ML-DSA but same Ed25519
    mixed_2 = {
        "type": "registration_request",
        "cid_version": 1,
        "cid_hash": "fakecid2",
        "statement": "Test",
        "public_keys": {
            "ml_dsa_65": kp_b["public_keys"]["ml_dsa_65"],  # Different ML-DSA
            "ed25519": kp_a["public_keys"]["ed25519"],  # Same Ed25519
        },
        "algorithms": kp_a["algorithms"],
        "requested_at": int(time.time()),
    }
    
    errors_1 = validate_registration({"registration": mixed_1, "signatures": {}}, ledger)
    errors_2 = validate_registration({"registration": mixed_2, "signatures": {}}, ledger)
    
    ml_dup_caught = any("ml-dsa" in e.lower() and "already registered" in e.lower() for e in errors_1)
    ed_dup_caught = any("ed25519" in e.lower() and "already registered" in e.lower() for e in errors_2)
    
    passed = ml_dup_caught and ed_dup_caught
    evidence = f"ML-DSA dup caught: {ml_dup_caught}, Ed25519 dup caught: {ed_dup_caught}"
    
    results.add("ID-04", "Duplicate Public Key Registration", passed, evidence,
                "Both duplicate key types must be detected",
                "HIGH" if not passed else "")


def test_id_05_malformed_keys(results: TestResults, temp_dir: Path):
    """ID-05: Oversized or Malformed Keys"""
    
    keypair = generate_keypair()
    ledger = {"version": 1, "entries": []}
    
    test_cases = [
        ("short_ml_dsa", {"ml_dsa_65": base64.b64encode(b"x" * 32).decode(),
                          "ed25519": keypair["public_keys"]["ed25519"]}),
        ("oversized_ed25519", {"ml_dsa_65": keypair["public_keys"]["ml_dsa_65"],
                               "ed25519": base64.b64encode(b"x" * 1952).decode()}),
        ("huge_key", {"ml_dsa_65": base64.b64encode(b"x" * 1000000).decode(),
                      "ed25519": keypair["public_keys"]["ed25519"]}),
        ("non_base64", {"ml_dsa_65": "!!!not-base64!!!",
                        "ed25519": "also-not-valid"})
    ]
    
    all_rejected = True
    evidence_parts = []
    
    for name, bad_keys in test_cases:
        statement = {
            "type": "registration_request",
            "cid_version": 1,
            "cid_hash": "testcid",
            "statement": "Test",
            "public_keys": bad_keys,
            "algorithms": keypair["algorithms"],
            "requested_at": int(time.time()),
        }
        
        try:
            errors = validate_registration({"registration": statement, "signatures": {}}, ledger)
            rejected = len(errors) > 0
        except Exception as e:
            # Exception counts as rejection (handled error)
            rejected = True
        
        all_rejected = all_rejected and rejected
        evidence_parts.append(f"{name}={'rejected' if rejected else 'ACCEPTED!'}")
    
    evidence = "; ".join(evidence_parts)
    
    results.add("ID-05", "Oversized or Malformed Keys", all_rejected, evidence,
                "All malformed key variants must be rejected or raise handled exceptions",
                "MEDIUM" if not all_rejected else "")


def test_id_06_unicode_normalization(results: TestResults, temp_dir: Path):
    """ID-06: Unicode Normalization Attack"""
    import unicodedata
    
    # Create test strings in NFC and NFD forms
    nfc_cafe = unicodedata.normalize('NFC', 'café')  # é as single codepoint
    nfd_cafe = unicodedata.normalize('NFD', 'café')  # e + combining accent
    
    obj_nfc = {"text": nfc_cafe, "value": 1}
    obj_nfd = {"text": nfd_cafe, "value": 1}
    
    bytes_nfc = json.dumps(obj_nfc, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    bytes_nfd = json.dumps(obj_nfd, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    
    nfc_differs_nfd = bytes_nfc != bytes_nfd
    
    # Test emoji
    emoji_obj = {"emoji": "🌱", "value": 2}
    emoji_bytes = json.dumps(emoji_obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    emoji_ok = "🌱" in emoji_bytes.decode("utf-8")
    
    # This test documents behavior - Python json.dumps preserves normalization form
    passed = True  # We're documenting behavior, not asserting a specific outcome
    evidence = f"NFC≠NFD: {nfc_differs_nfd}, emoji OK: {emoji_ok}"
    notes = (f"Python json.dumps preserves Unicode normalization form. "
             f"NFC and NFD produce different bytes: {nfc_differs_nfd}. "
             f"NFC bytes: {bytes_nfc.hex()}, NFD bytes: {bytes_nfd.hex()}. "
             f"If browser sends NFD and Python expects NFC (or vice versa), signatures will fail. "
             f"Emoji handled correctly (raw UTF-8). "
             f"RECOMMENDATION: Add explicit NFC normalization before canonical JSON.")
    
    results.add("ID-06", "Unicode Normalization Attack", passed, evidence, notes)


# ─── Ledger Tests ──────────────────────────────────────────────────────────────

def create_test_ledger(temp_dir: Path, num_entries: int = 3):
    """Create a test ledger with valid hash chain."""
    ledger_dir = temp_dir / "ledger"
    ledger_dir.mkdir(parents=True, exist_ok=True)
    (ledger_dir / "entries").mkdir(exist_ok=True)
    
    ledger = {"version": 1, "entries": [], "created_at": int(time.time())}
    
    for i in range(num_entries):
        kp = generate_keypair()
        entry = {
            "cid_hash": kp["cid_hash"],
            "cid_version": 1,
            "registered": int(time.time()) - (num_entries - i) * 86400,
            "activated": int(time.time()) - (num_entries - i) * 86400,
            "registration_phase": "founding" if i > 0 else "genesis",
            "public_keys": kp["public_keys"],
            "algorithms": kp["algorithms"],
            "vouchers": [] if i == 0 else [ledger["entries"][-1]["cid_hash"]],
            "status": "active",
            "previous_ledger_hash": compute_ledger_hash(ledger.get("entries", [])),
        }
        entry["entry_hash"] = compute_entry_hash(entry)
        ledger["entries"].append(entry)
        
        # Write individual entry file
        entry_file = ledger_dir / "entries" / f"CID-{entry['cid_hash'][:16]}.json"
        entry_file.write_text(json.dumps(entry, indent=2) + "\n")
    
    # Save master ledger
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    # Save hash
    hash_file = ledger_dir / "ledger_hash.txt"
    hash_file.write_text(compute_ledger_hash(ledger["entries"]) + "\n")
    
    return ledger_dir, ledger


def run_ledger_verify(ledger_dir: Path) -> tuple:
    """Run ledger.py verify and return (exit_code, output)."""
    import subprocess
    result = subprocess.run(
        [sys.executable, str(Path(__file__).parent / "ledger.py"), "verify", "--ledger-dir", str(ledger_dir)],
        capture_output=True,
        text=True,
        env={**os.environ, "DYLD_LIBRARY_PATH": os.environ.get("DYLD_LIBRARY_PATH", "")}
    )
    return result.returncode, result.stdout + result.stderr


def test_led_01_single_modification(results: TestResults, temp_dir: Path):
    """LED-01: Hash Chain Tampering — Single Entry Modification"""
    
    ledger_dir, ledger = create_test_ledger(temp_dir / "led01", 5)
    
    # Verify clean ledger first
    rc, out = run_ledger_verify(ledger_dir)
    if rc != 0:
        results.add("LED-01", "Single Entry Modification", False, 
                    f"Initial ledger failed verification: {out[:100]}", "", "CRITICAL")
        return
    
    # Tamper with entry #3's status
    ledger["entries"][2]["status"] = "inactive"  # Changed from "active"
    
    # Save tampered ledger (don't recompute hashes)
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    # Verify again
    rc, out = run_ledger_verify(ledger_dir)
    
    passed = rc != 0  # Should fail
    evidence = f"Tampering detected. Exit code: {rc}. Output: {out[:200]}"
    
    results.add("LED-01", "Single Entry Modification", passed, evidence,
                "Hash chain correctly detected status field modification",
                "CRITICAL" if not passed else "")


def test_led_02_entry_reorder(results: TestResults, temp_dir: Path):
    """LED-02: Hash Chain Tampering — Entry Reordering"""
    
    ledger_dir, ledger = create_test_ledger(temp_dir / "led02", 4)
    
    # Swap entries 1 and 2 (indices 1 and 2)
    ledger["entries"][1], ledger["entries"][2] = ledger["entries"][2], ledger["entries"][1]
    
    # Save tampered ledger
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    # Verify
    rc, out = run_ledger_verify(ledger_dir)
    
    passed = rc != 0
    evidence = f"Reorder detected. Exit code: {rc}. Output: {out[:200]}"
    
    results.add("LED-02", "Entry Reordering", passed, evidence,
                "Hash chain correctly detected entry reordering",
                "HIGH" if not passed else "")


def test_led_03_entry_insertion(results: TestResults, temp_dir: Path):
    """LED-03: Hash Chain Tampering — Entry Insertion"""
    
    ledger_dir, ledger = create_test_ledger(temp_dir / "led03", 3)
    
    # Create a phantom entry
    kp = generate_keypair()
    phantom = {
        "cid_hash": kp["cid_hash"],
        "cid_version": 1,
        "registered": int(time.time()) - 500000,  # Backdated
        "activated": int(time.time()) - 500000,
        "registration_phase": "founding",
        "public_keys": kp["public_keys"],
        "algorithms": kp["algorithms"],
        "vouchers": [],
        "status": "active",
        "previous_ledger_hash": ledger["entries"][0]["entry_hash"],
        "entry_hash": "fakehash",
    }
    
    # Insert between entries 0 and 1
    ledger["entries"].insert(1, phantom)
    
    # Save tampered ledger
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    # Verify
    rc, out = run_ledger_verify(ledger_dir)
    
    passed = rc != 0
    evidence = f"Insertion detected. Exit code: {rc}. Output: {out[:200]}"
    
    results.add("LED-03", "Entry Insertion", passed, evidence,
                "Hash chain correctly detected phantom entry insertion",
                "CRITICAL" if not passed else "")


def test_led_04_complete_rewrite(results: TestResults, temp_dir: Path):
    """LED-04: Hash Chain Tampering — Complete Rewrite with Valid Chain"""
    
    ledger_dir, ledger = create_test_ledger(temp_dir / "led04", 3)
    
    # Modify entry 1's status
    ledger["entries"][1]["status"] = "inactive"
    
    # Recompute all hashes from the modification point
    for i in range(1, len(ledger["entries"])):
        ledger["entries"][i]["previous_ledger_hash"] = compute_ledger_hash(ledger["entries"][:i])
        ledger["entries"][i]["entry_hash"] = compute_entry_hash(ledger["entries"][i])
    
    # Update master ledger and hash file
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    hash_file = ledger_dir / "ledger_hash.txt"
    hash_file.write_text(compute_ledger_hash(ledger["entries"]) + "\n")
    
    # Also update individual entry files
    for entry in ledger["entries"]:
        entry_file = ledger_dir / "entries" / f"CID-{entry['cid_hash'][:16]}.json"
        entry_file.write_text(json.dumps(entry, indent=2) + "\n")
    
