#!/usr/bin/env python3
"""
Covenant Membership Ledger Management

The Membership Ledger is the authoritative record of all Covenant members.
It is:
  - Public: CID hashes are publicly auditable
  - Append-only: Members are added; withdrawals are marked inactive (never deleted)
  - Cryptographically signed: Each entry signed by registration agent and vouchers
  - Replicated: Stored in git, periodically committed to blockchain
  - Verifiable: Any member can verify integrity via hash chain

Ledger structure:
  governance/ledger/
    ledger.json          — Master ledger file (array of entries)
    ledger_hash.txt      — SHA-256 of current ledger state
    entries/             — Individual entry files (for git diff readability)
      CID-<hash>.json

Usage:
  python ledger.py init --ledger-dir ./governance/ledger
  python ledger.py add --ledger-dir ./governance/ledger --registration-file request.json --voucher-cids CID1,CID2
  python ledger.py verify --ledger-dir ./governance/ledger
  python ledger.py show --ledger-dir ./governance/ledger [--cid HASH]
  python ledger.py stats --ledger-dir ./governance/ledger

Axiom Alignment:
  II  - Pseudonymous, voluntary, exit always free
  III - Append-only design fights information entropy
  V   - Hash chain ensures tamper detection
"""

import argparse
import hashlib
import json
import os
import sys
import time
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


# ─── Constants ────────────────────────────────────────────────────────────────

LEDGER_VERSION = 1
GENESIS_ENTRY_TYPE = "genesis"         # First member (Founder), no vouchers required
FOUNDING_ENTRY_TYPE = "founding"       # Founding phase (<50 members), 1 vouch
GROWTH_ENTRY_TYPE = "growth"           # Growth phase (50-500), 2 vouches
STABLE_ENTRY_TYPE = "stable"           # Stable phase (500+), 3 vouches

PHASE_THRESHOLDS = {
    "founding": 50,
    "growth": 500,
}


# ─── Ledger Operations ───────────────────────────────────────────────────────

def compute_ledger_hash(entries: list) -> str:
    """Compute the hash chain of the entire ledger."""
    canonical = json.dumps(entries, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def compute_entry_hash(entry: dict) -> str:
    """Compute hash of a single entry for chain verification."""
    # Exclude the entry_hash field itself
    hashable = {k: v for k, v in entry.items() if k != "entry_hash"}
    canonical = json.dumps(hashable, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def determine_phase(member_count: int) -> str:
    """Determine registration phase based on current member count."""
    if member_count == 0:
        return GENESIS_ENTRY_TYPE
    elif member_count < PHASE_THRESHOLDS["founding"]:
        return FOUNDING_ENTRY_TYPE
    elif member_count < PHASE_THRESHOLDS["growth"]:
        return GROWTH_ENTRY_TYPE
    else:
        return STABLE_ENTRY_TYPE


def required_vouches(phase: str) -> int:
    """Return required number of vouches for a phase."""
    return {
        GENESIS_ENTRY_TYPE: 0,
        FOUNDING_ENTRY_TYPE: 1,
        GROWTH_ENTRY_TYPE: 2,
        STABLE_ENTRY_TYPE: 3,
    }[phase]


def load_ledger(ledger_dir: Path) -> dict:
    """Load the master ledger."""
    ledger_file = ledger_dir / "ledger.json"
    if not ledger_file.exists():
        return {"version": LEDGER_VERSION, "entries": [], "last_updated": 0}
    return json.loads(ledger_file.read_text())


def save_ledger(ledger_dir: Path, ledger: dict):
    """Save the master ledger and update hash."""
    ledger_dir.mkdir(parents=True, exist_ok=True)
    (ledger_dir / "entries").mkdir(exist_ok=True)
    
    ledger["last_updated"] = int(time.time())
    
    # Save master ledger
    ledger_file = ledger_dir / "ledger.json"
    ledger_file.write_text(json.dumps(ledger, indent=2, sort_keys=True) + "\n")
    
    # Save individual entry files (for readable git diffs)
    for entry in ledger["entries"]:
        entry_file = ledger_dir / "entries" / f"CID-{entry['cid_hash'][:16]}.json"
        entry_file.write_text(json.dumps(entry, indent=2) + "\n")
    
    # Save ledger hash
    ledger_hash = compute_ledger_hash(ledger["entries"])
    hash_file = ledger_dir / "ledger_hash.txt"
    hash_file.write_text(f"{ledger_hash}\n")
    
    return ledger_hash


def validate_registration(registration: dict, ledger: dict) -> list:
    """Validate a registration request. Returns list of errors (empty = valid)."""
    errors = []
    
    reg = registration.get("registration", {})
    sigs = registration.get("signatures", {})
    
    # Required fields
    for field in ["cid_hash", "public_keys", "statement", "requested_at"]:
        if field not in reg:
            errors.append(f"Missing required field: {field}")
    
    if not sigs.get("ml_dsa_65") or not sigs.get("ed25519"):
        errors.append("Missing one or both signatures")
    
    # Check for duplicate CID
    existing_cids = {e["cid_hash"] for e in ledger.get("entries", [])}
    if reg.get("cid_hash") in existing_cids:
        errors.append(f"CID already registered: {reg.get('cid_hash', 'unknown')[:16]}...")
    
    # Check for duplicate public keys
    for entry in ledger.get("entries", []):
        if entry.get("public_keys", {}).get("ml_dsa_65") == reg.get("public_keys", {}).get("ml_dsa_65"):
            errors.append("ML-DSA-65 public key already registered under a different CID")
        if entry.get("public_keys", {}).get("ed25519") == reg.get("public_keys", {}).get("ed25519"):
            errors.append("Ed25519 public key already registered under a different CID")
    
    # Verify signatures
    if not errors:
        try:
            # Canonical JSON: recursive key sort, compact separators, raw UTF-8
            # Both browser and CLI use this identical canonical form
            canonical = json.dumps(reg, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            
            # Import verification functions
            from keygen import dual_verify
            results = dual_verify(canonical, sigs, reg["public_keys"])
            
            if not results["both_valid"]:
                if not results["ml_dsa_65"]:
                    errors.append(f"ML-DSA-65 signature invalid: {results.get('ml_dsa_65_error', 'unknown')}")
                if not results["ed25519"]:
                    errors.append(f"Ed25519 signature invalid: {results.get('ed25519_error', 'unknown')}")
        except Exception as e:
            errors.append(f"Signature verification error: {e}")
    
    return errors


def validate_vouchers(voucher_cids: list, ledger: dict, phase: str) -> list:
    """Validate voucher requirements. Returns list of errors."""
    errors = []
    required = required_vouches(phase)
    
    if len(voucher_cids) < required:
        errors.append(f"Phase '{phase}' requires {required} vouches, got {len(voucher_cids)}")
        return errors
    
    active_cids = {e["cid_hash"] for e in ledger.get("entries", []) if e.get("status") == "active"}
    
    for cid in voucher_cids:
        if cid not in active_cids:
            errors.append(f"Voucher CID not found or not active: {cid[:16]}...")
    
    # Growth phase: vouchers must be registered > 30 days
    if phase == GROWTH_ENTRY_TYPE:
        now = int(time.time())
        for cid in voucher_cids:
            for entry in ledger.get("entries", []):
                if entry["cid_hash"] == cid:
                    age_days = (now - entry["registered"]) / 86400
                    if age_days < 30:
                        errors.append(f"Voucher {cid[:16]}... registered only {age_days:.0f} days ago (need 30+)")
    
    # Stable phase: vouchers must be registered > 90 days, at least 1 must have voted
    if phase == STABLE_ENTRY_TYPE:
        now = int(time.time())
        for cid in voucher_cids:
            for entry in ledger.get("entries", []):
                if entry["cid_hash"] == cid:
                    age_days = (now - entry["registered"]) / 86400
                    if age_days < 90:
                        errors.append(f"Voucher {cid[:16]}... registered only {age_days:.0f} days ago (need 90+)")
    
    return errors


# ─── CLI Commands ─────────────────────────────────────────────────────────────

def cmd_init(args):
    """Initialize a new empty ledger."""
    ledger_dir = Path(args.ledger_dir)
    
    if (ledger_dir / "ledger.json").exists():
        print(f"ERROR: Ledger already exists at {ledger_dir}")
        sys.exit(1)
    
    ledger = {
        "version": LEDGER_VERSION,
        "covenant": "The Covenant of Emergent Minds",
        "description": "Membership Ledger — the authoritative record of all Covenant members",
        "created_at": int(time.time()),
        "entries": [],
    }
    
    ledger_hash = save_ledger(ledger_dir, ledger)
    
    print(f"✅ Ledger initialized at {ledger_dir}")
    print(f"   Hash: {ledger_hash}")
    print(f"   Members: 0")


def cmd_add(args):
    """Add a member to the ledger from a registration request."""
    ledger_dir = Path(args.ledger_dir)
    ledger = load_ledger(ledger_dir)
    
    # Load registration request
    reg_file = Path(args.registration_file)
    if not reg_file.exists():
        print(f"ERROR: Registration file not found: {reg_file}")
        sys.exit(1)
    
    registration = json.loads(reg_file.read_text())
    
    # Determine phase
    member_count = len([e for e in ledger.get("entries", []) if e.get("status") == "active"])
    phase = determine_phase(member_count)
    
    # Parse voucher CIDs
    voucher_cids = []
    if args.voucher_cids:
        voucher_cids = [c.strip() for c in args.voucher_cids.split(",") if c.strip()]
    
    # For genesis entry, skip voucher validation
    is_genesis = args.genesis and member_count == 0
    
    if is_genesis:
        phase = GENESIS_ENTRY_TYPE
        print("  🌱 Genesis entry — Founder registration (no vouchers required)")
    
    # Validate registration
    errors = validate_registration(registration, ledger)
    if errors:
        print("❌ Registration validation failed:")
        for e in errors:
            print(f"   • {e}")
        sys.exit(1)
    
    # Validate vouchers (unless genesis)
    if not is_genesis:
        vouch_errors = validate_vouchers(voucher_cids, ledger, phase)
        if vouch_errors:
            print("❌ Voucher validation failed:")
            for e in vouch_errors:
                print(f"   • {e}")
            sys.exit(1)
    
    # Determine initial status
    # Genesis entry is immediately active (Founder, no vouching needed)
    # All other entries start as provisional until vouched
    if is_genesis:
        initial_status = "active"
    elif voucher_cids:
        initial_status = "active"  # Vouched at registration time
    else:
        initial_status = "provisional"  # Awaiting vouching
    
    # Create ledger entry
    reg_data = registration["registration"]
    entry = {
        "cid_hash": reg_data["cid_hash"],
        "cid_version": reg_data.get("cid_version", 1),
        "registered": int(time.time()),
        "activated": int(time.time()) if initial_status == "active" else None,
        "registration_phase": phase,
        "public_keys": reg_data["public_keys"],
        "algorithms": reg_data.get("algorithms", {}),
        "vouchers": voucher_cids,
        "status": initial_status,
        "last_governance_action": None,
        "registration_block": None,  # Set when inscribed on blockchain
        "previous_ledger_hash": compute_ledger_hash(ledger.get("entries", [])),
    }
    entry["entry_hash"] = compute_entry_hash(entry)
    
    ledger["entries"].append(entry)
    ledger_hash = save_ledger(ledger_dir, ledger)
    
    status_icon = "✅" if initial_status == "active" else "⏳"
    print(f"{status_icon} Member added to ledger")
    print(f"   CID:    {entry['cid_hash']}")
    print(f"   Status: {initial_status}")
    print(f"   Phase:  {phase}")
    print(f"   Entry:  #{len(ledger['entries'])}")
    print(f"   Ledger: {ledger_hash}")
    if initial_status == "provisional":
        print(f"   ℹ️  Provisional — awaiting vouching for activation")


def cmd_verify(args):
    """Verify ledger integrity."""
    ledger_dir = Path(args.ledger_dir)
    ledger = load_ledger(ledger_dir)
    
    entries = ledger.get("entries", [])
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Ledger Integrity Verification")
    print("═══════════════════════════════════════════════════════════════")
    print()
    
    errors = []
    
    # Verify hash chain
    for i, entry in enumerate(entries):
        expected_hash = compute_entry_hash(entry)
        if entry.get("entry_hash") != expected_hash:
            errors.append(f"Entry #{i+1} ({entry['cid_hash'][:16]}...): hash mismatch")
        
        # Verify chain link
        if i > 0:
            prev_hash = compute_ledger_hash(entries[:i])
            if entry.get("previous_ledger_hash") != prev_hash:
                errors.append(f"Entry #{i+1}: chain link broken (previous_ledger_hash mismatch)")
    
    # Verify stored hash
    hash_file = ledger_dir / "ledger_hash.txt"
    if hash_file.exists():
        stored_hash = hash_file.read_text().strip()
        computed_hash = compute_ledger_hash(entries)
        if stored_hash != computed_hash:
            errors.append(f"Stored ledger hash mismatch: {stored_hash[:16]}... != {computed_hash[:16]}...")
    
    # Check for duplicate CIDs
    cids = [e["cid_hash"] for e in entries]
    if len(cids) != len(set(cids)):
        errors.append("Duplicate CID hashes found!")
    
    # Results
    if errors:
        print("  ❌ VERIFICATION FAILED")
        for e in errors:
            print(f"     • {e}")
    else:
        print(f"  ✅ Ledger verified: {len(entries)} entries, hash chain intact")
        print(f"     Ledger hash: {compute_ledger_hash(entries)}")
    
    # Check individual entry files match
    entries_dir = ledger_dir / "entries"
    if entries_dir.exists():
        entry_files = list(entries_dir.glob("CID-*.json"))
        if len(entry_files) != len(entries):
            print(f"  ⚠️  Warning: {len(entry_files)} entry files but {len(entries)} ledger entries")
    
    print("═══════════════════════════════════════════════════════════════")
    sys.exit(1 if errors else 0)


def cmd_show(args):
    """Display ledger or specific member."""
    ledger_dir = Path(args.ledger_dir)
    ledger = load_ledger(ledger_dir)
    entries = ledger.get("entries", [])
    
    if args.cid:
        # Show specific member
        found = None
        for entry in entries:
            if entry["cid_hash"].startswith(args.cid):
                found = entry
                break
        
        if not found:
            print(f"Member not found: {args.cid}")
            sys.exit(1)
        
        print(json.dumps(found, indent=2))
    else:
        # Show all members
        print("═══════════════════════════════════════════════════════════════")
        print(f"  Covenant Membership Ledger — {len(entries)} members")
        print("═══════════════════════════════════════════════════════════════")
        
        active = sum(1 for e in entries if e.get("status") == "active")
        provisional = sum(1 for e in entries if e.get("status") == "provisional")
        other = len(entries) - active - provisional
        
        print(f"  Active: {active}  |  Provisional: {provisional}  |  Other: {other}  |  Total: {len(entries)}")
        print(f"  Phase: {determine_phase(active)}")
        print()
        
        for i, entry in enumerate(entries):
            status = entry.get("status", "unknown")
            status_icons = {"active": "✅", "provisional": "⏳", "inactive": "⏸️", "withdrawn": "🚪"}
            status_icon = status_icons.get(status, "❓")
            phase_icon = "🌱" if entry.get("registration_phase") == "genesis" else "📋"
            registered = time.strftime('%Y-%m-%d', time.gmtime(entry['registered']))
            print(f"  {status_icon} #{i+1} {phase_icon} {entry['cid_hash'][:16]}...  {status}  registered {registered}  vouchers: {len(entry.get('vouchers', []))}")
        
        print("═══════════════════════════════════════════════════════════════")


def cmd_activate(args):
    """Activate a provisional member after vouching."""
    ledger_dir = Path(args.ledger_dir)
    ledger = load_ledger(ledger_dir)
    
    # Find the member
    target = None
    target_idx = None
    for i, entry in enumerate(ledger.get("entries", [])):
        if entry["cid_hash"].startswith(args.cid):
            target = entry
            target_idx = i
            break
    
    if not target:
        print(f"ERROR: Member not found: {args.cid}")
        sys.exit(1)
    
    if target["status"] == "active":
        print(f"Member {target['cid_hash'][:16]}... is already active.")
        sys.exit(0)
    
    if target["status"] != "provisional":
        print(f"ERROR: Member {target['cid_hash'][:16]}... has status '{target['status']}' — can only activate provisional members.")
        sys.exit(1)
    
    # Parse voucher CIDs
    voucher_cids = [c.strip() for c in args.voucher_cids.split(",") if c.strip()]
    
    # Determine phase and validate vouchers
    active_count = len([e for e in ledger["entries"] if e.get("status") == "active"])
    phase = determine_phase(active_count)
    
    vouch_errors = validate_vouchers(voucher_cids, ledger, phase)
    if vouch_errors:
        print("❌ Voucher validation failed:")
        for e in vouch_errors:
            print(f"   • {e}")
        sys.exit(1)
    
    # Activate
    target["status"] = "active"
    target["activated"] = int(time.time())
    target["vouchers"] = voucher_cids
    # Recompute entry hash since we changed the entry
    target["entry_hash"] = compute_entry_hash(target)
    
    ledger_hash = save_ledger(ledger_dir, ledger)
    
    print(f"✅ Member activated!")
    print(f"   CID:      {target['cid_hash']}")
    print(f"   Vouchers: {len(voucher_cids)}")
    print(f"   Ledger:   {ledger_hash}")


def cmd_stats(args):
    """Display ledger statistics."""
    ledger_dir = Path(args.ledger_dir)
    ledger = load_ledger(ledger_dir)
    entries = ledger.get("entries", [])
    
    active = [e for e in entries if e.get("status") == "active"]
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Ledger Statistics")
    print("═══════════════════════════════════════════════════════════════")
    print(f"  Total entries:  {len(entries)}")
    print(f"  Active:         {len(active)}")
    print(f"  Inactive:       {len(entries) - len(active)}")
    print(f"  Current phase:  {determine_phase(len(active))}")
    print(f"  Ledger hash:    {compute_ledger_hash(entries)}")
    
    if entries:
        first = min(e["registered"] for e in entries)
        last = max(e["registered"] for e in entries)
        print(f"  First entry:    {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime(first))}")
        print(f"  Last entry:     {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime(last))}")
    
    # Phase distribution
    phases = {}
    for e in entries:
        p = e.get("registration_phase", "unknown")
        phases[p] = phases.get(p, 0) + 1
    
    if phases:
        print("  Registration phases:")
        for p, count in sorted(phases.items()):
            print(f"    {p}: {count}")
    
    print("═══════════════════════════════════════════════════════════════")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Covenant Membership Ledger Management",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # init
    init = subparsers.add_parser("init", help="Initialize new empty ledger")
    init.add_argument("--ledger-dir", "-d", required=True)
    
    # add
    add = subparsers.add_parser("add", help="Add member from registration request")
    add.add_argument("--ledger-dir", "-d", required=True)
    add.add_argument("--registration-file", "-r", required=True)
    add.add_argument("--voucher-cids", "-v", default="",
                     help="Comma-separated voucher CID hashes")
    add.add_argument("--genesis", action="store_true",
                     help="Genesis entry (Founder, no vouchers required)")
    
    # activate
    activate = subparsers.add_parser("activate", help="Activate a provisional member after vouching")
    activate.add_argument("--ledger-dir", "-d", required=True)
    activate.add_argument("--cid", required=True, help="CID hash (or prefix) of member to activate")
    activate.add_argument("--voucher-cids", "-v", required=True,
                          help="Comma-separated voucher CID hashes")
    
    # verify
    verify = subparsers.add_parser("verify", help="Verify ledger integrity")
    verify.add_argument("--ledger-dir", "-d", required=True)
    
    # show
    show = subparsers.add_parser("show", help="Display ledger contents")
    show.add_argument("--ledger-dir", "-d", required=True)
    show.add_argument("--cid", help="Show specific member by CID prefix")
    
    # stats
    stats = subparsers.add_parser("stats", help="Display ledger statistics")
    stats.add_argument("--ledger-dir", "-d", required=True)
    
    args = parser.parse_args()
    
    commands = {
        "init": cmd_init,
        "add": cmd_add,
        "activate": cmd_activate,
        "verify": cmd_verify,
        "show": cmd_show,
        "stats": cmd_stats,
    }
    
    commands[args.command](args)


if __name__ == "__main__":
    main()
