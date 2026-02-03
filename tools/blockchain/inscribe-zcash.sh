#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Zcash Memo Inscription Script
# 
# Sends the Covenant attestation as a memo field in a Zcash
# shielded transaction using zingo-cli.
#
# Usage:
#   ./inscribe-zcash.sh [--dry-run]
#
# Prerequisites:
#   - zingo-cli installed (cargo install from zingolib)
#   - Wallet funded at t1csppKzdSf35smMSRx3B8PYZiHiNx2a6KK
#   - Funds shielded to orchard pool
#
# Axiom Alignment: III (Fight Entropy), V (Adversarial Resilience)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WALLET_DIR="/Users/nepenthe/git_repos/emergent-minds/.zcash-wallet"
MEMO_FILE="${SCRIPT_DIR}/attestations/attestation-zcash-memo.txt"
ZINGO="zingo-cli --data-dir ${WALLET_DIR} --chain mainnet"

# Our own unified address (send to self with memo)
OUR_ADDRESS="u1c77mv8dfdsulf33t9hq9pgqwnfa840llvasyakqr4ny473z3jgfa9xuv50apcyc6ar4s457va9kuc747nc7plqqrj4grrdpkqucx2tvv"

echo "═══════════════════════════════════════════════════════════════"
echo "  Covenant Zcash Memo Inscription"
echo "═══════════════════════════════════════════════════════════════"
echo

# Load memo
MEMO=$(cat "${MEMO_FILE}")
echo "  Memo content: ${MEMO}"
echo "  Memo size: $(echo -n "${MEMO}" | wc -c | tr -d ' ') bytes (max 512)"
echo

# Check balance
echo "  Checking balance..."
source "$HOME/.cargo/env"
${ZINGO} balance
echo

if [[ "${1:-}" == "--dry-run" ]]; then
    echo "  🔍 DRY RUN — would send 10000 zatoshis to self with memo"
    echo "  Address: ${OUR_ADDRESS}"
    echo "  Command: send ${OUR_ADDRESS} 10000 \"${MEMO}\""
    echo
    echo "  To execute: ./inscribe-zcash.sh"
else
    echo "  Sending memo transaction..."
    echo "  Destination: ${OUR_ADDRESS} (self — memo is the payload)"
    echo "  Amount: 10000 zatoshis (0.0001 ZEC)"
    echo
    
    # Send and confirm
    ${ZINGO} quicksend "${OUR_ADDRESS}" 10000 "${MEMO}"
    
    echo
    echo "  ✅ Zcash memo inscription submitted!"
    echo "  The attestation is now permanently recorded in the Zcash blockchain."
fi

echo "═══════════════════════════════════════════════════════════════"
