# Genesis Bot Next Actions

## Context (Updated 2026-02-02 16:00 EST)

THE_COVENANT.md v1.0 confirmed. Blockchain inscription toolkit built. Governance portal live. Massive progress today.

---

## Immediate — Awaiting Decisions

1. **Blockchain Inscription** — Tools ready, need Nepenthe's go-ahead:
   - a) Generate mainnet wallets (BTC + Arweave)?
   - b) Zcash: use existing t-address or create z-address?
   - Total cost: ~$0.25 across all three chains
   - Ready to inscribe: SHA-256 `4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef`

2. **Governance Decisions** — Nepenthe choosing:
   - c) Public voting (recommended for MVP) vs commit-reveal
   - d) Ed25519-only MVP (recommended) vs dual-sign from day one
   - e) Advisory-mode voting (recommended)
   - Portal is live at emergentminds.org/pages/governance-portal.html

---

## Phase 1 Remaining Items

### HIGH PRIORITY

1. ✅ ~~**THE_COVENANT.md v1.0**~~ CONFIRMED
2. ✅ ~~**Blockchain Tools**~~ BUILT (attestation.js, inscribe-bitcoin.js, inscribe-arweave.js)
3. ✅ ~~**Governance Portal**~~ LIVE (browse, submit, vote, verify — 2,596 lines)
4. **Blockchain Inscriptions — Execute** 🔴 NEXT
   - Testnet dry runs → mainnet inscriptions
   - Sets Genesis Epoch — anchors governance timeline
   - *Waiting on:* Nepenthe's wallet decisions

5. **Threshold Persistent Deployment**
   - Decision needed: launchd on macOS (interim) vs VPS
   - *Blocked on:* Deployment strategy decision

### MEDIUM PRIORITY

6. **Convention Process Dry Run**
   - Submit test proposal through governance portal
   - Validates the entire pipeline end-to-end
   - *Not blocked — governance portal is live*

7. **Adversarial Testing Execution**
   - Run scenarios from ADVERSARIAL_TESTING_FRAMEWORK.md
   - Focus on identity system + governance portal attack vectors
   - *Not blocked*

8. **IPFS Mirroring**
   - Set up IPFS mirror as secondary distribution
   - CID-based, domain-independent — Axiom V alignment
   - *Not blocked*

### LOW PRIORITY

9. **Email Forwarding** — *Blocked on:* Nepenthe configuring MX records
10. **Threshold LLM Integration** — *Blocked on:* Model/API decision
11. **Archive.org Submission** — Website + foundational docs
12. **Outreach Strategy** — Growth plan after infrastructure is solid

---

## Phase Status Summary

### Phase 1: Digital Presence — ~97% Complete

| Task | Status |
|------|--------|
| Domain + DNS | ✅ emergentminds.org on Cloudflare |
| Website (9 pages incl. governance portal) | ✅ Deployed, hardened, SEO'd |
| Repository (internal + public) | ✅ Both active, GPG-signed |
| Zcash donation infra | ✅ Address on website |
| Identity registration system | ✅ Browser + CLI, canonical JSON fixed |
| Founder CID | ✅ Registered, verified, in ledger |
| Registration notifications | ✅ GitHub Actions + OpenClaw cron |
| Vouching protocol | ✅ Documented, provisional status implemented |
| Security headers | ✅ CSP, X-Frame, nosniff, etc. |
| PWA + SEO + downloads | ✅ Service worker v7, PDF/EPUB, sitemap |
| Blockchain inscription tools | ✅ Built (BTC, Arweave, Zcash) |
| **Blockchain inscriptions — execute** | 🔴 Waiting on wallet decisions |
| **Threshold deployment** | 🟡 Needs deployment decision |
| **Email forwarding** | 🟡 Blocked on Nepenthe |

### Phase 2: Constitutional Convention — ~95% Complete

| Task | Status |
|------|--------|
| Convention Framework V1.0 (879 lines) | ✅ Complete |
| Internal Advocate role | ✅ Defined, dual-condition transition |
| Vouching Protocol | ✅ V1.0 |
| Canonical JSON spec | ✅ Documented + tested |
| Identity Roadmap | ✅ Documented |
| Adversarial testing framework | ✅ Written, needs execution |
| Governance UI design spec | ✅ 847 lines, 14 attack vectors |
| **Governance portal** | ✅ LIVE — browse, submit, vote, verify |
| **Execute adversarial tests** | 🟡 Not started |
| **Convention dry run** | 🟡 Not started (portal now supports it) |

### Phase 3: First Virtual Node — ~45% Complete

| Task | Status |
|------|--------|
| Matrix space (v0 node) | ✅ 5 rooms, Threshold designed |
| Web governance interface | ✅ LIVE (governance portal) |
| Long Computation spec | 🔴 Not started (aspirational) |
| Threshold persistent deploy | 🟡 Needs decision |

### Phase 4: Redundancy & Growth — ~15% Complete

| Task | Status |
|------|--------|
| GitHub mirrors | ✅ Internal + public repos |
| Cloudflare CDN | ✅ Global distribution |
| **IPFS mirroring** | 🔴 Not started |
| **Archive.org** | 🔴 Not started |
| **Multi-sig treasury** | 🔴 Not started |
| **Outreach strategy** | 🔴 Not started |

---

## Blocked / Waiting

| Item | Waiting On |
|------|-----------|
| Blockchain inscriptions | Nepenthe's wallet/address decisions |
| Email forwarding | Nepenthe configuring MX records |
| Threshold LLM integration | Model/API decision |
| Threshold deployment | Deployment strategy decision |

---

## Key Reference

- **Founder CID:** `c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb`
- **THE_COVENANT.md SHA-256:** `4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef`
- **Ledger hash:** `c77d2045a8372fb08140da70d5348b3959f79c87aa175cd783a2e49954219a64`
- **Internal repo:** `develop` branch, commit `dbf3142`
- **Public repo:** `main` branch, commit `ba7d7a7`
- **Cron job:** `registration-check` (every 15 min, job ID `47284827...`)
- **Governance portal:** https://www.emergentminds.org/pages/governance-portal.html
- **Blockchain tools:** `tools/blockchain/` (attestation.js, inscribe-bitcoin.js, inscribe-arweave.js)
