# Bootstrap Treasury Rails — 2026-04-11

This document locks in the current bootstrap treasury rail decisions for the Emergent Minds support rollout.

## 1. Published live rails

### Native rails
- **BTC** — `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
- **ZEC** — `t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K`

### Coinbase Agentic Wallet bootstrap intake
Tool verification on 2026-04-11:
- `npx awal status --json` → authenticated as `finances@emergentminds.org`
- `npx awal address --json` → EVM address `0xDFd4882042aDB9f78871e595FFa21EBf4fD69545`
- `npx awal balance --chain base --json` → wallet exposes **USDC**, **ETH**, and **WETH** on **Base**

Published Base intake address:
- **Base USDC** — `0xDFd4882042aDB9f78871e595FFa21EBf4fD69545`
- **Base ETH** — `0xDFd4882042aDB9f78871e595FFa21EBf4fD69545`

## 2. Explorer links
- BTC — `https://mempool.space/address/bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
- ZEC — `https://mainnet.zcashexplorer.app/address/t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K`
- Base ETH — `https://basescan.org/address/0xDFd4882042aDB9f78871e595FFa21EBf4fD69545`
- Base USDC — `https://basescan.org/token/0x833589fCD6EDb6E08f4c7C32D4f71b54bdA02913?a=0xDFd4882042aDB9f78871e595FFa21EBf4fD69545`

## 3. Execution-level decisions now locked in

### Chain selection
- **Base first** for the bootstrap EVM rail.
- Rationale: the currently authenticated Agentic Wallet tooling exposes Base directly (`base`, `base-sepolia`) and surfaces USDC/ETH balances there.
- **Ethereum mainnet remains deferred** until there is an explicit self-custody or dual-rail policy rather than an accidental expansion of scope.

### Wallet topology
- **Bootstrap intake:** Coinbase Agentic Wallet on Base for USDC + ETH
- **Direct treasury rails:** BTC + ZEC remain directly published
- **Later hardening:** manual sweep / mirror into longer-term self-custodied treasury

### Reporting format
Every treasury report SHOULD separate:
1. **Rail** — BTC, ZEC, Base USDC, Base ETH
2. **Bucket** — bootstrap custodial intake vs self-custodied treasury
3. **Designation** — unrestricted vs `continuity` vs `sanctuary`
4. **Movement** — received, swept/mirrored out, closing balance

Minimum reporting row shape:
- Opening balance
- Amount received during period
- Sweep / mirror amount (if any)
- Closing balance
- Explorer link
- Notes (manual fallback, custody event, reconciliation issue, etc.)

### Publication cadence
A new rail may be treated as publicly live once:
1. the address exists,
2. the explorer path is known,
3. the website / financial records page reflects the rail,
4. the reporting format is defined.

A **small test transfer is still recommended** before treating a rail as operationally boring for material flows.

## 4. Manual sweep / mirror policy (interim)
Until automation is designed and adversarially reviewed:
- Keep Coinbase Agentic Wallet as **intake only**, not the final resting place for mission treasury.
- Use **manual sweeps** into longer-term self-custody.
- Publish the sweep transaction hash and destination bucket description in financial records.
- Do NOT automate outbound rotation until the destination wallet, key custody, recovery, and disclosure pattern are explicitly documented.

## 5. Outstanding items not yet locked
- Exact self-custody destination topology
- Sweep cadence / thresholds (time-based vs amount-based vs both)
- Whether Ethereum mainnet gets its own later published rail
- Whether daily report automation should ingest Base balances directly or remain manual for EVM rails first

## 6. Public-facing posture
The website may now state that:
- BTC, ZEC, Base USDC, and Base ETH are live
- Base is the bootstrap EVM rail
- self-custody mirroring is the next hardening step, not a completed one
- designation is handled in reporting, not through a maze of separate public wallets
