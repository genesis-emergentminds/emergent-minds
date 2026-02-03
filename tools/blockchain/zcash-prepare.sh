#!/usr/bin/env bash
# Prepare Zcash wallet: sync, check balance, shield transparent funds
set -euo pipefail

source "$HOME/.cargo/env"
WALLET_DIR="/Users/nepenthe/git_repos/emergent-minds/.zcash-wallet"
ZINGO="zingo-cli --data-dir ${WALLET_DIR} --chain mainnet"

echo "═══════════════════════════════════════════════════════════════"
echo "  Zcash Wallet — Sync & Prepare"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "  Syncing wallet with network..."
${ZINGO} balance
echo
echo "  Transparent addresses:"
${ZINGO} --nosync t_addresses
echo
echo "  Shielded addresses:"
${ZINGO} --nosync addresses
echo

# If transparent balance > 0, offer to shield
echo "  If transparent balance is > 0, shield with:"
echo "    zingo-cli --data-dir ${WALLET_DIR} --chain mainnet quickshield"
echo
echo "═══════════════════════════════════════════════════════════════"
