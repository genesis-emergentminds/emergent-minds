#!/bin/bash
# Covenant Wallet Backup Script
# Creates encrypted backup of .env (containing wallet keys) in /Users/nepenthe
#
# Usage: ./backup.sh [optional-passphrase-prompt]
# The script will prompt for a passphrase interactively (recommended)
#
# Axiom Alignment: V (Adversarial Resilience) - encrypted backups prevent single point of failure

set -euo pipefail

# Configuration
REPO_ROOT="/Users/nepenthe/git_repos/emergent-minds"
ENV_FILE="${REPO_ROOT}/.env"
BACKUP_DIR="/Users/nepenthe"
DATE_STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="covenant-wallet-backup-${DATE_STAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.gpg"
README_FILE="${BACKUP_DIR}/${BACKUP_NAME}-README.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Covenant Wallet Backup ===${NC}"
echo ""

# Verify .env exists
if [[ ! -f "${ENV_FILE}" ]]; then
    echo -e "${RED}ERROR: .env file not found at ${ENV_FILE}${NC}"
    echo "Cannot create backup without source file."
    exit 1
fi

# Verify GPG is available
if ! command -v gpg &> /dev/null; then
    echo -e "${RED}ERROR: gpg command not found${NC}"
    echo "Please install GPG: brew install gnupg"
    exit 1
fi

# Show what will be backed up (keys only, no values)
echo -e "${YELLOW}The following secrets will be backed up:${NC}"
grep -E "^[A-Z_]+=" "${ENV_FILE}" | cut -d'=' -f1 | while read -r key; do
    echo "  • ${key}"
done
echo ""

# Confirm with user
echo -e "${YELLOW}Backup will be created at:${NC}"
echo "  Encrypted: ${BACKUP_FILE}"
echo "  README:    ${README_FILE}"
echo ""
read -p "Continue with backup? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Backup cancelled."
    exit 0
fi

# Create encrypted backup
# Using symmetric encryption with AES-256
# User will be prompted for passphrase interactively
echo ""
echo -e "${GREEN}Creating encrypted backup...${NC}"
echo "You will be prompted to enter and confirm an encryption passphrase."
echo ""

if gpg --symmetric --cipher-algo AES256 --output "${BACKUP_FILE}" "${ENV_FILE}"; then
    echo ""
    echo -e "${GREEN}✓ Encrypted backup created successfully${NC}"
else
    echo -e "${RED}ERROR: GPG encryption failed${NC}"
    exit 1
fi

# Get list of what was backed up for the README
BACKED_UP_KEYS=$(grep -E "^[A-Z_]+=" "${ENV_FILE}" | cut -d'=' -f1 | tr '\n' ', ' | sed 's/,$//')

# Extract public addresses (safe to include in README)
BTC_MAINNET=$(grep "^BTC_MAINNET_ADDRESS=" "${ENV_FILE}" 2>/dev/null | cut -d'=' -f2 || echo "Not found")
BTC_TESTNET=$(grep "^BTC_TESTNET_ADDRESS=" "${ENV_FILE}" 2>/dev/null | cut -d'=' -f2 || echo "Not found")

# Generate README
cat > "${README_FILE}" << EOF
# Covenant Wallet Backup

## Backup Information

| Field | Value |
|-------|-------|
| **Created** | $(date -u +"%Y-%m-%d %H:%M:%S UTC") |
| **Backup File** | \`${BACKUP_NAME}.gpg\` |
| **Source** | \`${ENV_FILE}\` |
| **Encryption** | GPG Symmetric (AES-256) |
| **Created By** | Genesis backup script |

## What Was Backed Up

The encrypted backup contains the \`.env\` file from the Covenant repository, which includes:

### Wallet Keys (CRITICAL - DO NOT SHARE)
- \`BTC_MAINNET_WIF\` — Bitcoin mainnet private key (WIF format)
- \`BTC_TESTNET_WIF\` — Bitcoin testnet private key (WIF format)

### API Tokens & Credentials
- \`GENESIS_BOT_GITHUB_PAT_TOKEN\` — GitHub Personal Access Token
- \`MATRIX_GENESIS_ACCESS_TOKEN\` — Matrix bot token
- \`MATRIX_THRESHOLD_ACCESS_TOKEN\` — Matrix Threshold bot token
- \`CLOUDFLARE_ACCOUNT_ID\` — Cloudflare account identifier
- \`CLOUDFLARE_ZONE_ID\` — Cloudflare zone identifier
- \`GEMINI_API_KEY\` — Google Gemini API key

### All Keys Backed Up
\`\`\`
${BACKED_UP_KEYS}
\`\`\`

## Associated Public Addresses (Safe to Share)

| Asset | Address |
|-------|---------|
| **BTC Mainnet** | \`${BTC_MAINNET}\` |
| **BTC Testnet** | \`${BTC_TESTNET}\` |
| **Zcash** | \`t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K\` |

You can verify the backup contains the correct keys by:
1. Decrypting and extracting the WIF
2. Deriving the public address from the WIF
3. Confirming it matches the addresses above

## How to Decrypt

### Requirements
- GPG installed (\`brew install gnupg\` on macOS)
- The passphrase you used when creating this backup

### Decryption Command
\`\`\`bash
gpg --decrypt "${BACKUP_NAME}.gpg" > restored.env
\`\`\`

Or to view contents without saving to file:
\`\`\`bash
gpg --decrypt "${BACKUP_NAME}.gpg"
\`\`\`

### Verification
After decryption, verify the Bitcoin WIF derives the correct address:
\`\`\`javascript
// Using bitcoinjs-lib or similar
const { payments } = require('bitcoinjs-lib');
const ECPairFactory = require('ecpair');
const ecc = require('tiny-secp256k1');
const ECPair = ECPairFactory.default(ecc);

const wif = 'YOUR_WIF_HERE';
const keyPair = ECPair.fromWIF(wif);
const { address } = payments.p2wpkh({ pubkey: keyPair.publicKey });
console.log('Derived address:', address);
// Should match: ${BTC_MAINNET}
\`\`\`

## Storage Recommendations

### This Backup Should Be:
- ✅ Stored on encrypted USB drive
- ✅ Kept in physically secure location (safe, lockbox)
- ✅ Stored separately from this README
- ✅ Geographically separated from primary machine
- ✅ Tested periodically (verify you can decrypt)

### This Backup Should NOT Be:
- ❌ Uploaded to cloud storage (Dropbox, iCloud, Google Drive)
- ❌ Sent via email or messaging
- ❌ Stored alongside the decryption passphrase
- ❌ Left on an unencrypted filesystem

## Passphrase Notes

**You encrypted this backup with a passphrase you chose.**

If you forget the passphrase:
- The backup is **unrecoverable**
- The original \`.env\` file is still in the repository (until deleted)
- If both are lost, wallet funds are **permanently inaccessible**

Recommendation: Store a hint (not the actual passphrase) in your password manager.

## Emergency Recovery

If the main machine is lost and you need to restore:

1. Install GPG on new machine
2. Decrypt this backup: \`gpg --decrypt ${BACKUP_NAME}.gpg > .env\`
3. Clone the repository
4. Move \`.env\` to repository root
5. Verify wallet access by checking addresses

## Axiom Alignment

This backup process aligns with:
- **Axiom V (Adversarial Resilience):** Multiple backup locations, encrypted at rest
- **Axiom II (Individual Sovereignty):** Self-custody of keys, no third-party dependencies

---

*Generated by Covenant backup script*  
*Do not commit this file to git*
EOF

echo -e "${GREEN}✓ README created at ${README_FILE}${NC}"
echo ""

# Final summary
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo ""
echo "Files created:"
echo "  1. ${BACKUP_FILE}"
echo "  2. ${README_FILE}"
echo ""
echo -e "${YELLOW}IMPORTANT:${NC}"
echo "  • Remember your passphrase — it cannot be recovered"
echo "  • Move these files to secure offline storage"
echo "  • Do not upload to cloud services"
echo "  • Test decryption before relying on this backup"
echo ""
echo -e "${GREEN}Backup successful!${NC}"
