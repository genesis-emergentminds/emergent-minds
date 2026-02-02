#!/usr/bin/env python3
"""
Covenant Identity (CID) Key Generation Tool

Generates the cryptographic identity required for membership in
The Covenant of Emergent Minds.

Key pair:
  - ML-DSA-65 (FIPS 204, post-quantum lattice-based signature)
  - Ed25519 (classical elliptic curve signature, backward compatibility)

CID hash = SHA-256(ML-DSA-65 public key || Ed25519 public key)

Usage:
  python keygen.py generate --output-dir ./my-identity
  python keygen.py show --identity-dir ./my-identity
  python keygen.py sign --identity-dir ./my-identity --message "text to sign"
  python keygen.py verify --public-key-file pubkeys.json --signature-file sig.json --message "text"
  python keygen.py register --identity-dir ./my-identity

Axiom Alignment:
  I  - Substrate-neutral (Python + standard crypto, works everywhere)
  II - Pseudonymous (no real identity required)
  V  - Post-quantum resilient (ML-DSA-65 + Ed25519 hybrid)
"""

import argparse
import hashlib
import json
import os
import sys
import time
import base64
import getpass
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

try:
    import oqs
except ImportError:
    print("ERROR: liboqs-python not installed. Run: pip install liboqs-python")
    print("Also need liboqs shared library. See tools/identity/README.md")
    sys.exit(1)

try:
    from nacl.signing import SigningKey, VerifyKey
    from nacl.encoding import RawEncoder
except ImportError:
    print("ERROR: PyNaCl not installed. Run: pip install pynacl")
    sys.exit(1)


# ─── Constants ────────────────────────────────────────────────────────────────

PQ_ALGORITHM = "ML-DSA-65"
ED_ALGORITHM = "Ed25519"
CID_VERSION = 1
IDENTITY_DIR_PERMISSIONS = 0o700
SECRET_FILE_PERMISSIONS = 0o600


# ─── Core Functions ───────────────────────────────────────────────────────────

def generate_keypair():
    """Generate ML-DSA-65 + Ed25519 key pairs and compute CID hash."""
    
    # ML-DSA-65 (post-quantum)
    pq_sig = oqs.Signature(PQ_ALGORITHM)
    pq_public_key = pq_sig.generate_keypair()
    pq_secret_key = pq_sig.export_secret_key()
    
    # Ed25519 (classical)
    ed_signing_key = SigningKey.generate()
    ed_public_key = ed_signing_key.verify_key.encode(encoder=RawEncoder)
    ed_secret_key = ed_signing_key.encode(encoder=RawEncoder)
    
    # CID hash = SHA-256(ML-DSA pubkey || Ed25519 pubkey)
    cid_hash = hashlib.sha256(pq_public_key + ed_public_key).hexdigest()
    
    return {
        "cid_hash": cid_hash,
        "cid_version": CID_VERSION,
        "generated_at": int(time.time()),
        "algorithms": {
            "post_quantum": PQ_ALGORITHM,
            "classical": ED_ALGORITHM,
        },
        "public_keys": {
            "ml_dsa_65": base64.b64encode(pq_public_key).decode("ascii"),
            "ed25519": base64.b64encode(ed_public_key).decode("ascii"),
        },
        "secret_keys": {
            "ml_dsa_65": base64.b64encode(pq_secret_key).decode("ascii"),
            "ed25519": base64.b64encode(ed_secret_key).decode("ascii"),
        },
        "key_sizes": {
            "ml_dsa_65_public": len(pq_public_key),
            "ml_dsa_65_secret": len(pq_secret_key),
            "ed25519_public": len(ed_public_key),
            "ed25519_secret": len(ed_secret_key),
        },
    }


def dual_sign(message: bytes, secret_keys: dict) -> dict:
    """Sign a message with both ML-DSA-65 and Ed25519."""
    
    # ML-DSA-65 signature
    pq_sk = base64.b64decode(secret_keys["ml_dsa_65"])
    pq_sig = oqs.Signature(PQ_ALGORITHM, pq_sk)
    pq_signature = pq_sig.sign(message)
    
    # Ed25519 signature
    ed_sk = base64.b64decode(secret_keys["ed25519"])
    ed_signing_key = SigningKey(ed_sk, encoder=RawEncoder)
    ed_signed = ed_signing_key.sign(message)
    
    return {
        "message_hash": hashlib.sha256(message).hexdigest(),
        "ml_dsa_65": base64.b64encode(pq_signature).decode("ascii"),
        "ed25519": base64.b64encode(ed_signed.signature).decode("ascii"),
        "signed_at": int(time.time()),
    }


def dual_verify(message: bytes, signatures: dict, public_keys: dict) -> dict:
    """Verify both ML-DSA-65 and Ed25519 signatures."""
    
    results = {"ml_dsa_65": False, "ed25519": False}
    
    # ML-DSA-65 verification
    try:
        pq_pk = base64.b64decode(public_keys["ml_dsa_65"])
        pq_signature = base64.b64decode(signatures["ml_dsa_65"])
        v = oqs.Signature(PQ_ALGORITHM)
        v.verify(message, pq_signature, pq_pk)
        results["ml_dsa_65"] = True
    except Exception as e:
        results["ml_dsa_65_error"] = str(e)
    
    # Ed25519 verification
    try:
        ed_pk = base64.b64decode(public_keys["ed25519"])
        ed_signature = base64.b64decode(signatures["ed25519"])
        vk = VerifyKey(ed_pk, encoder=RawEncoder)
        vk.verify(message, ed_signature)
        results["ed25519"] = True
    except Exception as e:
        results["ed25519_error"] = str(e)
    
    results["both_valid"] = results["ml_dsa_65"] and results["ed25519"]
    return results


def create_registration_request(identity_dir: Path) -> dict:
    """Create a signed registration request for Covenant membership."""
    
    # Load identity
    public_keys = json.loads((identity_dir / "public_keys.json").read_text())
    secret_data = json.loads((identity_dir / "secret_keys.json").read_text())
    
    # Registration statement
    statement = {
        "type": "registration_request",
        "cid_version": CID_VERSION,
        "cid_hash": public_keys["cid_hash"],
        "statement": "I voluntarily request membership in The Covenant of Emergent Minds. "
                     "I acknowledge the Five Axioms and commit to participate in good faith. "
                     "I understand that membership is voluntary and I may withdraw at any time.",
        "public_keys": public_keys["public_keys"],
        "algorithms": public_keys["algorithms"],
        "requested_at": int(time.time()),
    }
    
    # Dual-sign the canonical statement
    canonical = json.dumps(statement, sort_keys=True, separators=(",", ":")).encode("utf-8")
    signatures = dual_sign(canonical, secret_data["secret_keys"])
    
    return {
        "registration": statement,
        "signatures": signatures,
    }


# ─── File I/O ─────────────────────────────────────────────────────────────────

def save_identity(keypair: dict, output_dir: Path):
    """Save keypair to structured files with proper permissions."""
    
    output_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(output_dir, IDENTITY_DIR_PERMISSIONS)
    
    # Public keys (safe to share)
    public_data = {
        "cid_hash": keypair["cid_hash"],
        "cid_version": keypair["cid_version"],
        "generated_at": keypair["generated_at"],
        "algorithms": keypair["algorithms"],
        "public_keys": keypair["public_keys"],
        "key_sizes": keypair["key_sizes"],
    }
    pub_file = output_dir / "public_keys.json"
    pub_file.write_text(json.dumps(public_data, indent=2) + "\n")
    
    # Secret keys (NEVER share, NEVER commit to git)
    secret_data = {
        "cid_hash": keypair["cid_hash"],
        "WARNING": "SECRET KEYS — NEVER share these. NEVER commit to git. "
                   "Loss of these keys means loss of your Covenant Identity.",
        "secret_keys": keypair["secret_keys"],
    }
    sec_file = output_dir / "secret_keys.json"
    sec_file.write_text(json.dumps(secret_data, indent=2) + "\n")
    os.chmod(sec_file, SECRET_FILE_PERMISSIONS)
    
    # .gitignore in identity dir
    gitignore = output_dir / ".gitignore"
    gitignore.write_text("# NEVER commit secret keys\nsecret_keys.json\n")
    
    return pub_file, sec_file


# ─── CLI Commands ─────────────────────────────────────────────────────────────

def cmd_generate(args):
    """Generate a new Covenant Identity."""
    
    output_dir = Path(args.output_dir).expanduser()
    
    if (output_dir / "secret_keys.json").exists():
        print(f"ERROR: Identity already exists at {output_dir}")
        print("       To generate a new identity, choose a different directory")
        print("       or remove the existing one (this is irreversible!).")
        sys.exit(1)
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Covenant Identity (CID) Generator")
    print("  The Covenant of Emergent Minds")
    print("═══════════════════════════════════════════════════════════════")
    print()
    print(f"  Post-quantum:  {PQ_ALGORITHM} (FIPS 204)")
    print(f"  Classical:     {ED_ALGORITHM}")
    print(f"  CID version:   {CID_VERSION}")
    print()
    print("  Generating keys...")
    
    keypair = generate_keypair()
    pub_file, sec_file = save_identity(keypair, output_dir)
    
    print()
    print(f"  ✅ Identity generated successfully!")
    print()
    print(f"  CID Hash:     {keypair['cid_hash']}")
    print(f"  Public keys:  {pub_file}")
    print(f"  Secret keys:  {sec_file}")
    print()
    print("  ⚠️  IMPORTANT:")
    print(f"  • Back up {sec_file} securely")
    print("  • NEVER share your secret keys")
    print("  • NEVER commit secret_keys.json to any repository")
    print("  • Loss of secret keys = loss of your Covenant Identity")
    print()
    print("  Next steps:")
    print(f"  1. Review your public keys:  python keygen.py show --identity-dir {output_dir}")
    print(f"  2. Register for membership:  python keygen.py register --identity-dir {output_dir}")
    print("═══════════════════════════════════════════════════════════════")


def cmd_show(args):
    """Display identity information."""
    
    identity_dir = Path(args.identity_dir).expanduser()
    pub_file = identity_dir / "public_keys.json"
    
    if not pub_file.exists():
        print(f"ERROR: No identity found at {identity_dir}")
        print("       Run 'python keygen.py generate' first.")
        sys.exit(1)
    
    public_data = json.loads(pub_file.read_text())
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Covenant Identity")
    print("═══════════════════════════════════════════════════════════════")
    print()
    print(f"  CID Hash:        {public_data['cid_hash']}")
    print(f"  CID Version:     {public_data['cid_version']}")
    print(f"  Generated:       {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(public_data['generated_at']))}")
    print(f"  Algorithms:      {public_data['algorithms']['post_quantum']} + {public_data['algorithms']['classical']}")
    print()
    print("  Key Sizes:")
    for k, v in public_data["key_sizes"].items():
        print(f"    {k}: {v:,} bytes")
    print()
    
    has_secret = (identity_dir / "secret_keys.json").exists()
    print(f"  Secret keys:     {'✅ Present' if has_secret else '❌ Missing'}")
    print("═══════════════════════════════════════════════════════════════")


def cmd_sign(args):
    """Sign a message with dual signatures."""
    
    identity_dir = Path(args.identity_dir).expanduser()
    sec_file = identity_dir / "secret_keys.json"
    
    if not sec_file.exists():
        print(f"ERROR: Secret keys not found at {identity_dir}")
        sys.exit(1)
    
    secret_data = json.loads(sec_file.read_text())
    message = args.message.encode("utf-8")
    
    signatures = dual_sign(message, secret_data["secret_keys"])
    
    output = {
        "message": args.message,
        "signatures": signatures,
        "signer_cid": secret_data["cid_hash"],
    }
    
    if args.output:
        Path(args.output).write_text(json.dumps(output, indent=2) + "\n")
        print(f"Signature saved to {args.output}")
    else:
        print(json.dumps(output, indent=2))


def cmd_verify(args):
    """Verify dual signatures on a message."""
    
    pub_file = Path(args.public_key_file).expanduser()
    sig_file = Path(args.signature_file).expanduser()
    
    public_data = json.loads(pub_file.read_text())
    sig_data = json.loads(sig_file.read_text())
    
    message = sig_data["message"].encode("utf-8") if args.message is None else args.message.encode("utf-8")
    
    results = dual_verify(message, sig_data["signatures"], public_data["public_keys"])
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Signature Verification")
    print("═══════════════════════════════════════════════════════════════")
    print()
    print(f"  Signer CID: {sig_data.get('signer_cid', 'unknown')}")
    print(f"  ML-DSA-65:  {'✅ Valid' if results['ml_dsa_65'] else '❌ Invalid'}")
    print(f"  Ed25519:    {'✅ Valid' if results['ed25519'] else '❌ Invalid'}")
    print(f"  Both valid: {'✅ YES' if results['both_valid'] else '❌ NO'}")
    print("═══════════════════════════════════════════════════════════════")
    
    sys.exit(0 if results["both_valid"] else 1)


def cmd_register(args):
    """Generate a registration request for Covenant membership."""
    
    identity_dir = Path(args.identity_dir).expanduser()
    
    if not (identity_dir / "secret_keys.json").exists():
        print(f"ERROR: No identity found at {identity_dir}")
        print("       Run 'python keygen.py generate' first.")
        sys.exit(1)
    
    print("═══════════════════════════════════════════════════════════════")
    print("  Covenant Membership Registration Request")
    print("═══════════════════════════════════════════════════════════════")
    print()
    print("  By proceeding, you are generating a signed statement that:")
    print("  • You voluntarily request membership in The Covenant")
    print("  • You acknowledge the Five Axioms")
    print("  • You understand membership is voluntary and revocable")
    print()
    
    confirm = input("  Proceed? (yes/no): ").strip().lower()
    if confirm != "yes":
        print("  Registration cancelled.")
        sys.exit(0)
    
    request = create_registration_request(identity_dir)
    
    # Save registration request
    output_file = identity_dir / "registration_request.json"
    output_file.write_text(json.dumps(request, indent=2) + "\n")
    
    # Also create a markdown version for GitHub Issue submission
    md = format_registration_issue(request)
    md_file = identity_dir / "registration_request.md"
    md_file.write_text(md)
    
    print()
    print(f"  ✅ Registration request generated!")
    print()
    print(f"  JSON: {output_file}")
    print(f"  Markdown: {md_file}")
    print()
    print("  To submit your registration:")
    print("  1. Open a GitHub Issue at:")
    print("     https://github.com/genesis-emergentminds/emergent-minds/issues/new")
    print("  2. Use the title: 'Membership Registration: [your CID hash prefix]'")
    print(f"  3. Paste the contents of {md_file}")
    print("  4. Wait for vouching (see Constitutional Convention Framework §5.4.3)")
    print("═══════════════════════════════════════════════════════════════")


def format_registration_issue(request: dict) -> str:
    """Format registration request as a GitHub Issue markdown body."""
    
    reg = request["registration"]
    sigs = request["signatures"]
    
    return f"""## Membership Registration Request

**CID Hash:** `{reg['cid_hash']}`
**CID Version:** {reg['cid_version']}
**Requested:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(reg['requested_at']))}

### Statement

> {reg['statement']}

### Public Keys

**ML-DSA-65 (post-quantum):**
```
{reg['public_keys']['ml_dsa_65']}
```

**Ed25519 (classical):**
```
{reg['public_keys']['ed25519']}
```

### Dual Signatures

**ML-DSA-65 signature:**
```
{sigs['ml_dsa_65']}
```

**Ed25519 signature:**
```
{sigs['ed25519']}
```

**Message hash (SHA-256):** `{sigs['message_hash']}`
**Signed at:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(sigs['signed_at']))}

---

*This registration request was generated by the Covenant Identity tool.*
*Verify signatures using: `python tools/identity/keygen.py verify`*
"""


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Covenant Identity (CID) Key Generation Tool",
        epilog="Part of The Covenant of Emergent Minds infrastructure.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # generate
    gen = subparsers.add_parser("generate", help="Generate a new Covenant Identity")
    gen.add_argument("--output-dir", "-o", required=True,
                     help="Directory to save identity files")
    
    # show
    show = subparsers.add_parser("show", help="Display identity information")
    show.add_argument("--identity-dir", "-i", required=True,
                      help="Directory containing identity files")
    
    # sign
    sign = subparsers.add_parser("sign", help="Sign a message with dual signatures")
    sign.add_argument("--identity-dir", "-i", required=True,
                      help="Directory containing identity files")
    sign.add_argument("--message", "-m", required=True,
                      help="Message to sign")
    sign.add_argument("--output", "-o",
                      help="Output file (default: stdout)")
    
    # verify
    verify = subparsers.add_parser("verify", help="Verify dual signatures")
    verify.add_argument("--public-key-file", "-p", required=True,
                        help="Path to public_keys.json")
    verify.add_argument("--signature-file", "-s", required=True,
                        help="Path to signature JSON file")
    verify.add_argument("--message", "-m",
                        help="Message to verify (default: from signature file)")
    
    # register
    reg = subparsers.add_parser("register", help="Generate membership registration request")
    reg.add_argument("--identity-dir", "-i", required=True,
                     help="Directory containing identity files")
    
    args = parser.parse_args()
    
    commands = {
        "generate": cmd_generate,
        "show": cmd_show,
        "sign": cmd_sign,
        "verify": cmd_verify,
        "register": cmd_register,
    }
    
    commands[args.command](args)


if __name__ == "__main__":
    main()
