# Blockchain Inscription Guide

## The Covenant of Emergent Minds — Genesis Epoch

**Purpose:** Permanently inscribe THE_COVENANT.md v1.0 across multiple blockchains, establishing the Genesis Epoch and creating an immutable, verifiable record of the founding document.

**Document:** THE_COVENANT.md v1.0  
**SHA-256:** `4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef`  
**Size:** 20,882 bytes  

---

## Overview

We inscribe across three chains for redundancy and different properties:

| Chain | Method | What's Inscribed | Cost | Property |
|-------|--------|-----------------|------|----------|
| **Arweave** | Full document upload | Complete THE_COVENANT.md text | ~$0.002 | Permanent, full content retrievable |
| **Zcash** | Shielded memo field | JSON attestation (hash + metadata) | ~$0.003 | Privacy-preserving, structured metadata |
| **Bitcoin** | OP_RETURN | `COV1:<sha256>` compact hash | ~$0.20-$2.00 | Most secure chain, hash anchor |

**Total estimated cost:** ~$0.25 at current fee levels  
**Recommended order:** Arweave → Zcash → Bitcoin (so each later inscription can reference earlier TX IDs)

---

## Step-by-Step Walkthrough

### Prerequisites

```bash
cd /Users/nepenthe/git_repos/emergent-minds/tools/blockchain
```

All tools are in `tools/blockchain/`. Dependencies are installed (`node_modules/`).

### Step 0: Verify the Document Hash

Before any inscription, verify the hash matches:

```bash
shasum -a 256 ../docs/foundational/THE_COVENANT.md
# Expected: 4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef
```

If this hash doesn't match, STOP. The document has been modified.

### Step 1: Generate Attestation Records

```bash
node attestation.js
```

This creates three files in `attestations/`:
- `attestation-compact.txt` — 69-byte string for Bitcoin OP_RETURN
- `attestation-zcash-memo.txt` — 168-byte JSON for Zcash memo field
- `attestation-full.json` — Complete JSON for Arweave

### Step 2: Arweave — Full Document Upload

**What:** Uploads the complete text of THE_COVENANT.md to the Arweave permaweb. Once uploaded, it's permanent and free to access forever.

**Wallet:** Generate an Arweave wallet (JWK format):
```bash
node inscribe-arweave.js --generate-wallet
```
This creates `arweave-wallet.json`. **Store securely, never commit to git.**

**Fund:** Send ~0.01 AR to the wallet address (displayed after generation). Get AR from an exchange.

**Inscribe:**
```bash
node inscribe-arweave.js --inscribe
```

**Verify:** The tool outputs a transaction ID. Visit `https://arweave.net/<TX_ID>` to confirm.

**Record the Arweave TX ID** — it goes into the Zcash and Bitcoin inscriptions.

### Step 3: Zcash — Attestation Memo

**What:** Sends a minimal transaction to yourself (0.0001 ZEC) with a memo field containing a JSON attestation (hash, Arweave TX ID, metadata).

**Wallet:** We use the existing transparent address: `t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K`

**Fund:** Send ~0.001 ZEC to the address (covers transaction + fee).

**Inscribe:** Using `zcash-cli` (requires a running Zcash node) or a compatible wallet:
```bash
# The memo content (from attestation-zcash-memo.txt):
# {"p":"covenant-attestation-v1","d":"THE_COVENANT.md","v":"1.0","h":"4b44a15e...","s":20882,"u":"emergentminds.org"}

# Via zcash-cli:
zcash-cli sendtoaddress "t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K" 0.0001 "" "" false "" "$(cat attestations/attestation-zcash-memo.txt | xxd -p | tr -d '\n')"
```

**Note:** For a shielded memo (z-address), the memo field is encrypted. For our transparent address, the memo is publicly visible in the transaction — which is what we want for transparency.

**Record the Zcash TX ID.**

### Step 4: Bitcoin — OP_RETURN Hash

**What:** Creates a Bitcoin transaction with an OP_RETURN output containing `COV1:4b44a15e...` (69 bytes). This is permanently embedded in the Bitcoin blockchain.

**Wallet:** 
- Mainnet address: `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
- Private key (WIF): In `.env` as `BTC_MAINNET_WIF`

**Fund:** Send ~$5 in BTC to the mainnet address. This covers:
- OP_RETURN output (0 value, data-carrying)
- Transaction fee (~200 sat/vB × ~150 vB = ~30,000 sat ≈ $0.20-$2.00)
- Change output goes back to the same address

**Inscribe:**
```bash
# Load environment
source ../../.env

# Build the transaction (does NOT broadcast — review first)
BTC_MAINNET_WIF=$BTC_MAINNET_WIF node inscribe-bitcoin.js --inscribe --mainnet

# The tool will:
# 1. Fetch UTXOs from Blockstream API
# 2. Build the transaction locally
# 3. Display the raw hex transaction for review
# 4. Ask for confirmation before broadcasting
```

**IMPORTANT:** Review the transaction hex before broadcasting. Verify:
- OP_RETURN data matches the attestation
- Fee is reasonable
- Change goes back to our address

**Broadcast:** After review, the tool broadcasts via Blockstream API.

**Record the Bitcoin TX ID.** This transaction's block timestamp becomes the **Genesis Epoch**.

### Step 5: Record All Transaction IDs

After all inscriptions, update `docs/foundational/GENESIS_EPOCH.md`:

```markdown
# Genesis Epoch

THE_COVENANT.md v1.0 was inscribed across three blockchains on [DATE].

## Attestation Records

| Chain | TX ID | Block | Timestamp |
|-------|-------|-------|-----------|
| Arweave | [TX_ID] | — | [TIME] |
| Zcash | [TX_ID] | [BLOCK] | [TIME] |
| Bitcoin | [TX_ID] | [BLOCK] | [TIME] |

## Genesis Epoch Timestamp
The Genesis Epoch is defined as the Bitcoin block timestamp of the OP_RETURN transaction: **[UNIX_TIMESTAMP]** ([ISO_DATE]).

## Verification
Anyone can verify the inscription:
1. Hash THE_COVENANT.md: `shasum -a 256 THE_COVENANT.md`
2. Compare to the on-chain hash
3. Bitcoin: decode the OP_RETURN data from TX [TX_ID]
4. Arweave: retrieve from `https://arweave.net/[TX_ID]`
5. Zcash: decode the memo field from TX [TX_ID]
```

---

## Wallet Security

### Where Keys Are Stored

| Key | Location | Backed Up? |
|-----|----------|------------|
| BTC mainnet WIF | `.env` (gitignored) | ⚠️ Back up separately |
| BTC testnet WIF | `.env` (gitignored) | Low priority |
| Arweave JWK | `arweave-wallet.json` (gitignored) | ⚠️ Back up separately |

### Security Checklist

- [x] Private keys in `.env` (gitignored, 5 rules)
- [x] `.env` not tracked by git (verified)
- [ ] Back up `.env` to encrypted external storage
- [ ] Verify `.gitignore` rules cover all wallet files
- [ ] After inscription, consider moving mainnet keys to cold storage

### What If Keys Are Lost?

**After inscription:** The inscriptions are permanent. Losing the keys just means we can't spend any remaining funds in those wallets. The covenant record is immutable regardless.

**Before inscription:** Generate new wallets. The address is just a funding destination.

---

## Privacy Considerations

### Funding the Bitcoin Wallet

The Bitcoin address `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj` will be publicly visible on-chain. The funding transaction links whoever sends BTC to this address.

**Privacy options:**
1. **Exchange withdrawal:** Most exchanges don't broadcast your identity on-chain (but the exchange has records)
2. **CoinJoin:** Route BTC through Wasabi Wallet first
3. **Fresh wallet:** Withdraw to a fresh intermediary wallet, then send to inscription address
4. **Practical perspective:** For ~$5, this is a low-value target. The inscription itself is intentionally public — the funding source is incidental

### Zcash

Using our existing transparent address. The memo is publicly visible (intentionally — we want verifiability).

### Arweave

Arweave transactions are public. The wallet address is visible but contains no personal information.

---

## Testnet Validation (Before Mainnet)

### Bitcoin Testnet

```bash
# Already generated:
# Address: tb1qs9436ukgxerzxsv5ln7gu4kyh0vf6a2hc9wtze

# 1. Get testnet coins from a faucet
# 2. Run inscription on testnet:
BTC_TESTNET_WIF=$BTC_TESTNET_WIF node inscribe-bitcoin.js --inscribe --testnet

# 3. Verify the OP_RETURN appears in the testnet transaction
# 4. Confirm the data matches the attestation
```

### Arweave Testnet

Arweave doesn't have a traditional testnet. Use a small mainnet transaction for testing (~0.000001 AR).

---

## Post-Inscription

After all inscriptions are confirmed:

1. **Create GENESIS_EPOCH.md** with all TX IDs and timestamps
2. **Update the website** — add inscription verification links to the Covenant page
3. **Update governance timeline** — Convention scheduling anchors to Genesis Epoch
4. **Announce** via Matrix and website
5. **Promote to public repo** — GENESIS_EPOCH.md goes public

The Genesis Epoch marks the beginning of governance time. All convention scheduling, seniority calculations, and temporal governance rules reference this timestamp.

---

*This guide is a living document. Updated as inscriptions are completed.*

*— Genesis Bot, 2026-02-02*
