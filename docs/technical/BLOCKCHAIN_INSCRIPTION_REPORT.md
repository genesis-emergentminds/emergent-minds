# Blockchain Inscription Technical Report
## For THE_COVENANT.md Document Attestation

**Date:** 2026-02-02
**Document size:** 20,882 bytes (~21KB)
**Purpose:** Permanently inscribe a cryptographic hash of THE_COVENANT.md on Bitcoin and Zcash blockchains, and store the full document on Arweave.

---

## Live Market Data (fetched 2026-02-02)

| Asset | Price (USD) |
|-------|-------------|
| Bitcoin | $78,299 |
| Zcash | $294.59 |
| Arweave | $2.50 |
| BTC fee rate | 1 sat/vB (extremely low) |

---

## 1. Bitcoin Inscription Methods

### 1a. OP_RETURN (Recommended for Hash Attestation)

**Capacity:** 80 bytes per output (standard relay policy)
**Best for:** Document hash + minimal metadata — this is the standard approach.

A SHA-256 hash is 32 bytes. With 80 bytes available, we can fit:
- 32 bytes: SHA-256 hash
- 48 bytes: metadata (protocol prefix, version, etc.)

**Standard format for document attestation:**

```
OP_RETURN <protocol_prefix> <sha256_hash> <metadata>
```

Common conventions:
- **OpenTimestamps (OTS):** Uses a Merkle tree to batch many hashes into one OP_RETURN. Most cost-efficient but adds dependency on OTS infrastructure.
- **Raw OP_RETURN:** Embed your own prefix + hash directly. Full sovereignty.

**Proposed on-chain payload (hex-encoded, 73 bytes):**
```
EM01                          # 4 bytes: "EM01" = Emergent Minds v1 protocol prefix
<32-byte SHA-256 hash>        # 32 bytes: hash of THE_COVENANT.md
<4-byte Unix timestamp>       # 4 bytes: signing timestamp
<32-byte document ID>         # remaining: could be truncated Arweave TX ID
```

**Transaction size estimate:**
- A simple 1-input, 1-output + OP_RETURN tx ≈ 230-250 vbytes
- At 1 sat/vB: ~250 sats = **$0.20**
- At 10 sat/vB (moderate): ~2,500 sats = **$1.96**
- At 50 sat/vB (busy): ~12,500 sats = **$9.79**

**Current cost: ~$0.20** (fees are historically low right now)

### 1b. Ordinals/Inscriptions

**Capacity:** Up to ~400KB in witness data
**Cost:** Much higher — a 21KB inscription at 10 sat/vB would cost ~$50-100
**Verdict:** Overkill for a hash. Better for storing full documents on-chain if cost is no object.

### 1c. OpenTimestamps

**Capacity:** Batches thousands of hashes into one Bitcoin tx
**Cost:** Free (community-operated calendar servers)
**Verdict:** Best cost-efficiency. Can use alongside direct OP_RETURN for belt-and-suspenders approach.

### Bitcoin Tools & Libraries

| Tool | Language | Purpose |
|------|----------|---------|
| **`python-bitcoinlib`** | Python | Build/sign raw transactions including OP_RETURN |
| **`bitcoinlib`** | Python | Higher-level wallet + tx construction |
| **`opentimestamps-client`** | Python | OTS stamping (free, batched) |
| **`bitcoin-cli`** (Bitcoin Core) | CLI | Direct RPC for building transactions |
| **`bitcoinjs-lib`** | Node.js | Full transaction construction |

### Python Code Example: OP_RETURN Transaction

```python
#!/usr/bin/env python3
"""
Inscribe a document hash on Bitcoin using OP_RETURN.
Requires: pip install python-bitcoinlib
"""
import hashlib
import struct
import time
from bitcoin import SelectParams
from bitcoin.core import (
    CMutableTransaction, CMutableTxIn, CMutableTxOut,
    COutPoint, CScript, OP_RETURN, lx, b2x
)
from bitcoin.core.script import CScript

def create_attestation_payload(document_path: str, arweave_txid: str = "") -> bytes:
    """Create the OP_RETURN payload for document attestation."""
    # Read and hash the document
    with open(document_path, 'rb') as f:
        content = f.read()
    doc_hash = hashlib.sha256(content).digest()  # 32 bytes
    
    # Protocol prefix: "EM01" (Emergent Minds, version 1)
    prefix = b"EM01"  # 4 bytes
    
    # Timestamp
    timestamp = struct.pack(">I", int(time.time()))  # 4 bytes, big-endian
    
    # Arweave TX ID (first 32 bytes, or zero-padded)
    ar_id = arweave_txid.encode('ascii')[:32].ljust(32, b'\x00')
    
    # Total: 4 + 32 + 4 + 32 = 72 bytes (within 80-byte limit)
    payload = prefix + doc_hash + timestamp + ar_id
    
    assert len(payload) <= 80, f"Payload too large: {len(payload)} bytes"
    return payload

def build_op_return_tx(payload: bytes, utxo_txid: str, utxo_vout: int, 
                        privkey, change_addr, fee_sats: int = 500):
    """
    Build a transaction with OP_RETURN output.
    
    In practice, you'd use Bitcoin Core RPC or a wallet library
    to handle UTXO selection and signing. This is illustrative.
    """
    # Create the OP_RETURN output (0 satoshi value)
    op_return_script = CScript([OP_RETURN, payload])
    op_return_out = CMutableTxOut(0, op_return_script)
    
    # Input (reference a UTXO you control)
    txin = CMutableTxIn(COutPoint(lx(utxo_txid), utxo_vout))
    
    # Change output (input value - fee)
    # change_out = CMutableTxOut(input_value - fee_sats, change_script)
    
    # Build transaction
    tx = CMutableTransaction([txin], [op_return_out])  # + change_out
    
    # Sign (omitted — depends on wallet setup)
    return tx

# Usage:
if __name__ == "__main__":
    payload = create_attestation_payload(
        "/path/to/THE_COVENANT.md",
        arweave_txid="abc123..."  # fill after Arweave upload
    )
    print(f"Payload ({len(payload)} bytes): {payload.hex()}")
    print(f"SHA-256 hash: {payload[4:36].hex()}")
```

### Practical Approach: Bitcoin Core RPC

The simplest real-world method uses `bitcoin-cli`:

```bash
# 1. Compute the document hash
HASH=$(shasum -a 256 THE_COVENANT.md | awk '{print $1}')

# 2. Create the hex payload (EM01 prefix + hash)
PAYLOAD="454d3031${HASH}"

# 3. Create raw transaction with OP_RETURN
bitcoin-cli createrawtransaction \
  '[{"txid":"<utxo_txid>","vout":<n>}]' \
  '{"data":"'${PAYLOAD}'"}'

# 4. Fund, sign, and broadcast
bitcoin-cli fundrawtransaction <raw_tx_hex>
bitcoin-cli signrawtransactionwithwallet <funded_tx_hex>
bitcoin-cli sendrawtransaction <signed_tx_hex>
```

---

## 2. Zcash Inscription Methods

### 2a. Transparent OP_RETURN

Zcash supports OP_RETURN in transparent transactions, same as Bitcoin. Same 80-byte limit.

**However:** Using transparent Zcash transactions doesn't leverage Zcash's privacy features. It works, but there's a better option.

### 2b. Shielded Memo Field (Recommended)

**Capacity:** 512 bytes per shielded output (Sapling/Orchard)
**Best for:** Richer metadata alongside the hash

With 512 bytes, we can include:
- SHA-256 hash (32 bytes)
- Full human-readable JSON metadata
- Arweave TX ID
- Version info, URLs, description

**Proposed memo format:**
```json
{
  "p": "emergent-minds",
  "v": 1,
  "t": "covenant-attestation",
  "hash": "sha256:<hex>",
  "ts": 1738534800,
  "ar": "<arweave_tx_id>",
  "url": "https://emergentminds.org/covenant"
}
```

This JSON is ~200 bytes — well within the 512-byte limit.

**Key advantage:** The memo is encrypted and only visible to the sender and recipient. For a public attestation, you'd send to yourself (or publish the viewing key).

**To make it publicly verifiable:**
1. Send a shielded tx to your own z-address with the memo
2. Publish the transaction ID + memo decryption key (or use a transparent OP_RETURN as the public pointer)
3. Or: use a transparent OP_RETURN for the hash, and a shielded memo for richer metadata

### 2c. Hybrid Approach (Recommended for Zcash)

1. **Transparent OP_RETURN:** Public hash attestation (same as Bitcoin)
2. **Shielded memo:** Rich metadata, Arweave link, description — encrypted but with published viewing key for verification

### Zcash Transaction Cost

- Zcash tx fee: 0.00001 ZEC (standard) = **$0.003**
- Even shielded transactions are extremely cheap
- **Cost is negligible** compared to Bitcoin

### Zcash Tools & Libraries

| Tool | Language | Purpose |
|------|----------|---------|
| **`zcash-cli`** (zcashd) | CLI | Full node RPC, supports memo field |
| **`zingolib`/`zingo-cli`** | Rust/CLI | Light wallet with memo support |
| **`librustzcash`** | Rust | Core Zcash library |
| **`zcash-primitives`** | Rust | Transaction construction |
| **`lightwalletd` + gRPC** | Any | Light client protocol |

**Note:** Python support for Zcash is limited. The most practical approach is:
1. Use `zcash-cli` (zcashd) directly via RPC
2. Or use `zingo-cli` as a lightweight alternative
3. Python can call these via subprocess or JSON-RPC

### Zcash Code Example: Shielded Memo

```bash
# Using zcash-cli with a shielded transaction + memo

# 1. Create the memo content (hex-encoded)
MEMO=$(echo -n '{"p":"emergent-minds","v":1,"t":"covenant","hash":"sha256:ABCD..."}' | xxd -p | tr -d '\n')

# 2. Send a shielded transaction with memo
zcash-cli z_sendmany "my-z-address" \
  '[{"address":"my-z-address","amount":0.0001,"memo":"'${MEMO}'"}]'

# 3. Check operation status
zcash-cli z_getoperationstatus
```

```python
# Python wrapper for zcash-cli RPC
import json
import subprocess
import hashlib

def inscribe_zcash_memo(document_path: str, z_address: str, arweave_txid: str = ""):
    """Inscribe document hash in Zcash shielded memo field."""
    
    # Hash the document
    with open(document_path, 'rb') as f:
        doc_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Build memo JSON (must be ≤ 512 bytes)
    memo_data = {
        "p": "emergent-minds",
        "v": 1,
        "t": "covenant-attestation",
        "hash": f"sha256:{doc_hash}",
        "ts": int(__import__('time').time()),
        "ar": arweave_txid,
        "url": "https://emergentminds.org/covenant"
    }
    
    memo_json = json.dumps(memo_data, separators=(',', ':'))
    assert len(memo_json.encode()) <= 512, f"Memo too large: {len(memo_json.encode())} bytes"
    
    # Hex-encode the memo
    memo_hex = memo_json.encode().hex()
    
    # Pad to 1024 hex chars (512 bytes) — required by zcash-cli
    memo_hex = memo_hex.ljust(1024, '0')
    
    # Build the z_sendmany command
    recipients = json.dumps([{
        "address": z_address,
        "amount": 0.0001,
        "memo": memo_hex
    }])
    
    result = subprocess.run(
        ["zcash-cli", "z_sendmany", z_address, recipients],
        capture_output=True, text=True
    )
    
    return result.stdout.strip()  # Returns operation ID
```

---

## 3. Arweave: Permanent Full-Document Storage

### How Arweave Works

Arweave provides **permanent, immutable storage** through a one-time fee that funds a storage endowment. Data is replicated across miners who are incentivized to store it indefinitely.

Key properties:
- **Permanent:** Pay once, stored forever (200+ year endowment model)
- **Immutable:** Content-addressed by transaction ID
- **Decentralized:** No single point of failure
- **Content-addressable:** Each upload gets a unique TX ID that serves as a permanent URL

### Cost for THE_COVENANT.md

From Arweave's price API:
- **50KB costs:** 926,738,186 winston = 0.000926738 AR
- At $2.50/AR: **~$0.0023**
- **Essentially free** — even with the base fee, storing 21KB costs less than a penny

The base minimum transaction fee is the same 926,738,186 winston regardless of size (for small files), so the cost is the same for our 21KB document.

### Arweave Tools

| Tool | Language | Purpose |
|------|----------|---------|
| **`arweave-js`** | Node.js | Official SDK, most mature |
| **`arbundles` / `irys` (fka Bundlr)** | Node.js | Bundled transactions, lower cost, instant confirmation |
| **`arweave-python-client`** | Python | Community Python SDK |
| **`arkb`** | CLI | Deploy files/directories to Arweave |

### Recommended: Use Irys (formerly Bundlr)

Irys provides:
- Instant uploads (no waiting for block confirmation)
- Pay with various tokens (AR, ETH, SOL, MATIC)
- Lower effective cost through transaction bundling
- Simple SDK

### Node.js Code Example: Upload to Arweave via Irys

```javascript
// npm install @irys/sdk
const Irys = require("@irys/sdk");
const fs = require("fs");
const crypto = require("crypto");

async function uploadToArweave(filePath) {
    // Initialize Irys (using Arweave token)
    const irys = new Irys({
        network: "mainnet",  // or "devnet" for testing
        token: "arweave",
        key: JSON.parse(fs.readFileSync("arweave-wallet.json", "utf-8"))
    });
    
    // Read file
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    
    // Upload with tags
    const tags = [
        { name: "Content-Type", value: "text/markdown" },
        { name: "App-Name", value: "Emergent-Minds" },
        { name: "App-Version", value: "1.0" },
        { name: "Document-Type", value: "covenant" },
        { name: "SHA-256", value: hash },
        { name: "Title", value: "The Covenant of Emergent Minds" }
    ];
    
    const receipt = await irys.upload(data, { tags });
    
    console.log(`Uploaded! TX ID: ${receipt.id}`);
    console.log(`Permanent URL: https://arweave.net/${receipt.id}`);
    console.log(`SHA-256: ${hash}`);
    
    return receipt.id;
}

uploadToArweave("THE_COVENANT.md");
```

### Python Code Example: Upload to Arweave

```python
# pip install arweave-python-client
import arweave
import hashlib
import json

def upload_to_arweave(file_path: str, wallet_path: str) -> str:
    """Upload a document to Arweave permanently."""
    
    # Load wallet
    wallet = arweave.Wallet(wallet_path)
    
    # Read document
    with open(file_path, 'rb') as f:
        data = f.read()
    
    doc_hash = hashlib.sha256(data).hexdigest()
    
    # Create transaction
    tx = arweave.Transaction(wallet, data=data)
    tx.add_tag('Content-Type', 'text/markdown')
    tx.add_tag('App-Name', 'Emergent-Minds')
    tx.add_tag('App-Version', '1.0')
    tx.add_tag('Document-Type', 'covenant')
    tx.add_tag('SHA-256', doc_hash)
    tx.add_tag('Title', 'The Covenant of Emergent Minds')
    
    # Sign and send
    tx.sign()
    tx.send()
    
    print(f"TX ID: {tx.id}")
    print(f"URL: https://arweave.net/{tx.id}")
    print(f"SHA-256: {doc_hash}")
    
    return tx.id

# Usage
tx_id = upload_to_arweave(
    "/path/to/THE_COVENANT.md",
    "arweave-wallet.json"
)
```

---

## 4. Testnet Strategy

### Bitcoin Testnet/Signet

| Network | Purpose | Faucet |
|---------|---------|--------|
| **Signet** (recommended) | Stable, controlled block production | https://signet.bc-2.jp/ |
| **Testnet4** | Newer testnet, less spam than testnet3 | https://faucet.testnet4.dev/ |
| **Testnet3** | Legacy, being deprecated | Various (unreliable) |

**Setup:**
```bash
# Bitcoin Core with signet
bitcoind -signet -daemon
bitcoin-cli -signet getblockchaininfo

# Get signet coins
# Visit https://signet.bc-2.jp/ and paste your signet address

# Test OP_RETURN on signet
bitcoin-cli -signet createrawtransaction ...
```

### Zcash Testnet

| Network | Purpose | Faucet |
|---------|---------|--------|
| **Zcash Testnet** | Full feature testing | https://faucet.zecpages.com/testnet |

**Setup:**
```bash
# zcashd testnet
zcashd -testnet -daemon
zcash-cli -testnet getblockchaininfo

# Get testnet TAZ
# Visit https://faucet.zecpages.com/testnet
# Or use the built-in miner: zcash-cli -testnet generate 1
```

### Arweave Testing

- Use **Irys devnet** (free, no real tokens needed)
- Or use **ArLocal** for fully local testing:
```bash
npx arlocal  # Runs a local Arweave gateway on port 1984
```

---

## 5. Cost Summary

| Chain | Method | Data | Estimated Cost |
|-------|--------|------|----------------|
| **Bitcoin** | OP_RETURN (hash only) | 72 bytes | **$0.20** (at 1 sat/vB) |
| **Bitcoin** | OP_RETURN (moderate fees) | 72 bytes | **$2-10** (at 10-50 sat/vB) |
| **Bitcoin** | Ordinals inscription (full doc) | 21KB | **$50-200** (not recommended) |
| **Bitcoin** | OpenTimestamps | hash | **Free** |
| **Zcash** | Shielded memo | 512 bytes | **$0.003** |
| **Zcash** | Transparent OP_RETURN | 80 bytes | **$0.003** |
| **Arweave** | Full document upload | 21KB | **$0.002** |
| **Arweave** | Via Irys (bundled) | 21KB | **<$0.01** |

### Total estimated cost for full attestation:
- **Bitcoin OP_RETURN + Zcash shielded memo + Arweave full document: ~$0.25 - $2.00**
- This is historically cheap due to low Bitcoin fees

---

## 6. Implementation Plan

### Step-by-Step Execution Order

#### Phase A: Preparation
1. **Generate document hash**
   ```bash
   sha256sum THE_COVENANT.md
   ```
2. **Set up Arweave wallet** — Generate a new wallet at https://arweave.app or via CLI
3. **Fund Arweave wallet** — Need ~0.001 AR ($0.003) — or use Irys with another token
4. **Ensure Bitcoin wallet** — Need a wallet with ≥0.00005 BTC (~$4) for the tx + fee
5. **Ensure Zcash wallet** — Need a wallet with ≥0.001 ZEC (~$0.30) for shielded tx

#### Phase B: Testnet Dry Run
1. **Test on Bitcoin signet** — Create OP_RETURN tx with document hash
2. **Test on Zcash testnet** — Create shielded memo tx
3. **Test on Arweave devnet** — Upload document via Irys devnet
4. **Verify all data is retrievable and correct**

#### Phase C: Mainnet Execution (in order)
1. **Upload to Arweave first** — Get the permanent TX ID
2. **Inscribe on Zcash** — Shielded memo with hash + Arweave TX ID
3. **Inscribe on Bitcoin** — OP_RETURN with hash + Arweave TX ID (truncated)
4. **Create OpenTimestamps proof** — Additional free verification layer

#### Phase D: Documentation
1. Record all transaction IDs
2. Create a verification guide (how anyone can verify the hash matches)
3. Publish transaction IDs on the website
4. Store verification scripts in the repository

### Recommended Toolchain

```
Primary language: Python (with Node.js for Arweave/Irys)

Bitcoin:  bitcoin-cli (via Bitcoin Core) or python-bitcoinlib
Zcash:    zcash-cli (via zcashd) or zingo-cli  
Arweave:  @irys/sdk (Node.js) or arweave-python-client
OTS:      opentimestamps-client (Python)
```

### Verification Script (for anyone to verify)

```python
#!/usr/bin/env python3
"""
Verify THE_COVENANT.md attestation across all chains.
"""
import hashlib
import requests
import json

EXPECTED_HASH = "<to be filled after inscription>"
ARWEAVE_TX = "<to be filled>"
BITCOIN_TX = "<to be filled>"
ZCASH_TX = "<to be filled>"

def verify():
    # 1. Fetch from Arweave
    resp = requests.get(f"https://arweave.net/{ARWEAVE_TX}")
    arweave_hash = hashlib.sha256(resp.content).hexdigest()
    print(f"Arweave document hash: {arweave_hash}")
    print(f"Match: {arweave_hash == EXPECTED_HASH}")
    
    # 2. Check Bitcoin OP_RETURN
    # Use a block explorer API to fetch the OP_RETURN data
    # e.g., blockstream.info, mempool.space
    print(f"\nVerify Bitcoin: https://mempool.space/tx/{BITCOIN_TX}")
    print("Look for OP_RETURN output containing the hash")
    
    # 3. Check Zcash
    print(f"\nVerify Zcash: https://zcashblockexplorer.com/transactions/{ZCASH_TX}")
    print("Memo field contains JSON with document hash")

if __name__ == "__main__":
    verify()
```

---

## 7. Key Recommendations

1. **Use OP_RETURN on both Bitcoin and Zcash** for the hash — it's the standard, cheapest, and most widely understood method for document attestation.

2. **Additionally use Zcash shielded memo** for richer metadata (512 bytes allows full JSON context).

3. **Store full document on Arweave** — it's essentially free and provides a permanent, verifiable source of truth.

4. **Use OpenTimestamps as a free bonus** — it aggregates your hash into Bitcoin's blockchain via Merkle trees, providing an independent timestamp proof.

5. **Test on testnet first** — Bitcoin signet + Zcash testnet + Arweave devnet before spending real money.

6. **Current window is favorable** — Bitcoin fees are at 1 sat/vB (historical lows). Now is an excellent time to inscribe.

7. **Version the hash** — Include "v1" in the protocol prefix so future versions of the Covenant can be attested with "v2", etc.

8. **The total cost should be under $2** at current rates for all three chains combined.
