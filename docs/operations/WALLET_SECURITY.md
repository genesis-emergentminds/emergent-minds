# Wallet Security & Backup Procedures

## Overview

The Covenant maintains cryptocurrency wallets for receiving donations and for blockchain operations (inscriptions). This document describes security practices and backup procedures.

## Wallet Inventory

### Bitcoin Mainnet (Donations)
- **Address:** `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
- **Type:** Native SegWit (bech32, P2WPKH)
- **Purpose:** Receiving BTC donations
- **Key Storage:** WIF format in `.env` as `BTC_MAINNET_WIF`
- **Explorer:** https://mempool.space/address/bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj

### Bitcoin Testnet (Testing)
- **Address:** `tb1qs9436ukgxerzxsv5ln7gu4kyh0vf6a2hc9wtze`
- **Type:** Native SegWit (bech32, P2WPKH)
- **Purpose:** Testing inscriptions and transactions
- **Key Storage:** WIF format in `.env` as `BTC_TESTNET_WIF`

### Zcash (Donations + Inscription)
- **Address:** `t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K`
- **Type:** Transparent address (t-addr)
- **Purpose:** Receiving ZEC donations; used for Genesis Epoch memo inscription
- **Key Storage:** Managed by Nepenthe's Zcash wallet software

### Arweave (Deferred)
- **Address:** `edaEFIImpN0BkllVbTUcltvsm8fzD-X8Vg6oDmRIm90`
- **Purpose:** Future document uploads to permaweb
- **Status:** Unfunded; AR tokens not available on Nepenthe's exchanges

## Security Practices

### Current Measures

1. **Private Key Isolation**
   - All private keys stored ONLY in `.env` file
   - `.env` is in `.gitignore` (5 rules to ensure exclusion)
   - Never logged, printed, or transmitted
   - Never included in commits

2. **Access Control**
   - `.env` readable only by Nepenthe and Genesis Bot process
   - No remote access to key material
   - Keys never enter browser or client-side code

3. **Git Protection**
   - Pre-commit hooks could be added to scan for WIF patterns
   - `.gitignore` includes: `.env`, `*.env`, `.env.*`, `*.local`, `**/secrets/**`

### Recommended Backup Procedure

**CRITICAL:** The Bitcoin WIF is the ONLY way to access funds. Loss = permanent loss.

1. **Encrypted Backup**
   ```bash
   # Create encrypted backup of .env
   gpg --symmetric --cipher-algo AES256 -o env-backup-$(date +%Y%m%d).gpg .env
   ```

2. **Store Backup**
   - USB drive in secure physical location (safe, lockbox)
   - Optional: Print WIF on paper (store separately from digital backup)
   - Consider geographic separation (different physical locations)

3. **Verify Backup**
   - Test decryption: `gpg -d env-backup-YYYYMMDD.gpg`
   - Verify WIF can derive the correct address

4. **Rotation Schedule**
   - Create fresh backup after any key changes
   - Verify backups quarterly

### Future Improvements (Post-Founding Phase)

1. **Multi-Signature Wallets**
   - 2-of-3 multisig for significant holdings
   - Distribute keys across trusted stewards
   - Reduces single-point-of-failure risk

2. **Hardware Wallet Integration**
   - Move significant holdings to hardware wallet (Ledger, Trezor)
   - Keep hot wallet with minimal operational balance

3. **Transparent Spending Controls**
   - Published spending thresholds
   - Community review for large transactions
   - Time-locked transactions for major expenditures

## Transaction Signing

### Current Process

For Bitcoin transactions (using `tools/blockchain/inscribe-bitcoin.js`):
1. Script reads WIF from `.env` via `process.env.BTC_MAINNET_WIF`
2. Transaction signed locally
3. Broadcast via Blockstream API

### Security Checklist Before Signing

- [ ] Verify recipient address character by character
- [ ] Confirm amount is intentional
- [ ] Review transaction fee is reasonable
- [ ] Check network (mainnet vs testnet)
- [ ] Ensure signing machine is not compromised

## Incident Response

### If Key Compromise Suspected

1. **Immediately** sweep all funds to a new wallet
2. Generate new keys using secure, offline machine
3. Update `.env` with new keys
4. Update website donation addresses
5. Document incident in transparency records
6. Notify community via Matrix

### If .env File Lost

1. Restore from encrypted backup
2. Verify by deriving addresses from WIF
3. If no backup exists: funds are permanently lost
4. Generate new keys and update all references

## Audit Trail

All wallet-related decisions and transactions should be logged:
- Wallet creation: Documented in `BLOCKCHAIN_INSCRIPTION_PLAN.md`
- Inscriptions: TXIDs logged in `NEXT_ACTIONS.md` and Genesis Epoch page
- Donations received: Will be logged in financial records

---

*Document Status: V1.0*  
*Last Updated: 2026-02-03*  
*Axiom Alignment: V (Adversarial Resilience), II (Individual Sovereignty via self-custody)*
