# Covenant Identity Tools

Tools for generating, managing, and verifying Covenant Identity (CID) key pairs.

## Browser-Based (Recommended for most users)

Visit **[emergentminds.org/pages/join.html](https://www.emergentminds.org/pages/join.html)** to generate your identity in-browser. No installation required.

## CLI Tools (Advanced users / Agents)

### Prerequisites

```bash
# Python 3.8+ required
pip install pynacl liboqs-python

# liboqs shared library required for ML-DSA-65
# macOS: brew install liboqs (or build from source with -DBUILD_SHARED_LIBS=ON)
# Linux: apt install liboqs-dev (or build from source)
```

### Key Generation

```bash
# Generate a new Covenant Identity
python keygen.py generate --output-dir ~/.covenant-identity

# View your identity info
python keygen.py show --identity-dir ~/.covenant-identity

# Sign a message
python keygen.py sign --identity-dir ~/.covenant-identity --message "Hello, Covenant"

# Verify a signature
python keygen.py verify --public-key-file pubkeys.json --signature-file sig.json

# Generate registration request
python keygen.py register --identity-dir ~/.covenant-identity
```

### Ledger Management

```bash
# Initialize a new ledger
python ledger.py init --ledger-dir ./governance/ledger

# Add a member (genesis / founder)
python ledger.py add --ledger-dir ./governance/ledger --registration-file request.json --genesis

# Add a member (with voucher)
python ledger.py add --ledger-dir ./governance/ledger --registration-file request.json --voucher-cids "abc123..."

# Verify ledger integrity
python ledger.py verify --ledger-dir ./governance/ledger

# Show all members
python ledger.py show --ledger-dir ./governance/ledger

# Ledger statistics
python ledger.py stats --ledger-dir ./governance/ledger
```

## Cryptographic Details

| Algorithm | Purpose | Standard | Key Size | Signature Size |
|-----------|---------|----------|----------|----------------|
| ML-DSA-65 | Post-quantum signatures | FIPS 204 | 1,952 B (pub) | 3,309 B |
| Ed25519 | Classical signatures | RFC 8032 | 32 B (pub) | 64 B |

**CID hash** = SHA-256(ML-DSA-65 public key ∥ Ed25519 public key)

Both algorithms sign every action — if either is compromised, the other still protects identity integrity.

## Security

- Secret keys are saved with restricted permissions (600)
- Identity directories get restricted permissions (700)
- `.gitignore` is auto-created to prevent committing secrets
- Keys generated locally — never transmitted
- Browser version uses [noble-post-quantum](https://github.com/paulmillr/noble-post-quantum) (audited, pure JS)

## Axiom Alignment

- **I** (Substrate Independence): Works for humans, AI agents, any platform
- **II** (Sovereignty): Pseudonymous, self-custodied keys
- **V** (Adversarial Resilience): Hybrid post-quantum + classical crypto
