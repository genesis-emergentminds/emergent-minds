# Blockchain Inscription Tools

Tools for inscribing The Covenant's attestation record on multiple blockchains, establishing the **Genesis Epoch**.

## Quick Start

```bash
cd tools/blockchain
npm install

# 1. Generate attestation record
node attestation.js

# 2. Bitcoin inscription
node inscribe-bitcoin.js --generate --testnet    # Generate testnet wallet
# Fund wallet from faucet, then:
node inscribe-bitcoin.js --testnet               # Build transaction
node inscribe-bitcoin.js --testnet --broadcast    # Broadcast

# 3. Arweave upload (full document)
node inscribe-arweave.js --generate              # Generate wallet
node inscribe-arweave.js --estimate              # Check cost
node inscribe-arweave.js --upload --dry-run      # Preview
node inscribe-arweave.js --upload                # Upload permanently
```

## What Gets Inscribed

| Chain | Data | Size | Method |
|-------|------|------|--------|
| Bitcoin | `COV1:<sha256_hash>` | 69 bytes | OP_RETURN |
| Zcash | JSON attestation record | ~168 bytes | Memo field |
| Arweave | Full THE_COVENANT.md | ~20KB | Permanent storage |

## Wallet Security

- **NEVER** commit wallet files or private keys to git
- Bitcoin WIF goes in `.env` as `BTC_TESTNET_WIF` or `BTC_MAINNET_WIF`
- Arweave wallet saved to `.arweave-wallet.json` (gitignored)
- Fund wallets with minimal amounts

## Verification

Anyone can verify the inscription:
1. Compute `SHA-256` of their copy of THE_COVENANT.md
2. Compare against the hash in the blockchain transaction
3. If they match, the document is unchanged since inscription

## Genesis Epoch

The Bitcoin block timestamp containing our OP_RETURN transaction becomes the **Genesis Epoch** — the immutable, verifiable founding moment of The Covenant, as defined in the Constitutional Convention Framework §2.
