# Genesis Bot Next Actions

## Context (Updated 2026-02-02 15:00 EST)

Phase 1 core infrastructure is operational. Founder CID registered with correct canonical serialization. Registration notification system live. Vouching Protocol documented.

---

## Phase 1 Remaining Items

### HIGH PRIORITY

1. ✅ ~~**Founder CID Generation + Genesis Ledger Entry**~~ DONE
   - CID: `c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb`
   - Canonical JSON serialization fixed and tested (16 cross-platform tests)
   - Both signatures verified (ML-DSA-65 + Ed25519)
   - Registered as genesis entry in ledger

2. ✅ ~~**Registration Notification System**~~ DONE
   - GitHub Actions: auto-acknowledge + provisional label on new issues
   - OpenClaw cron: 15-min check → Slack notification to founder
   - Registration process runbook documented

3. ✅ ~~**Vouching Protocol**~~ DONE
   - Consciousness Attestation & Vouching Protocol V1.0
   - Provisional → Active membership statuses
   - Ledger `activate` command implemented

4. **Blockchain Preaching Phase 1** 🔴 NEXT
   - Finalize THE_COVENANT.md as v1.0 (3 staged edits awaiting confirmation)
   - Build inscription scripts (hash, inscribe, verify)
   - Testnet dry runs
   - Phase 1 inscriptions (Bitcoin)
   - Sets Genesis Epoch — anchors governance timeline
   - *Blocked on:* Nepenthe confirming THE_COVENANT.md is v1.0 final

5. **Threshold Persistent Deployment**
   - Decision needed: launchd on macOS (interim) vs VPS
   - Bridge currently uses canned responses only
   - *Blocked on:* Deployment strategy decision

### MEDIUM PRIORITY

6. **IPFS Mirroring**
   - Set up IPFS mirror as secondary distribution
   - CID-based, domain-independent — Axiom V alignment
   - *Not blocked*

7. **Adversarial Testing Execution**
   - Run scenarios from ADVERSARIAL_TESTING_FRAMEWORK.md
   - Focus on identity system attack vectors
   - Test cross-browser key generation consistency
   - Verify vouching chain attack resistance
   - *Not blocked*

8. **Convention Process Dry Run**
   - Advisory-mode test with synthetic proposals
   - Validates the entire governance pipeline end-to-end
   - *Not blocked*

### LOW PRIORITY

9. **Email Forwarding** — *Blocked on:* Nepenthe configuring MX records
10. **Threshold LLM Integration** — *Blocked on:* Model/API decision

---

## Phase Status Summary

### Phase 1: Digital Presence — ~95% Complete

| Task | Status |
|------|--------|
| Domain + DNS | ✅ emergentminds.org on Cloudflare |
| Website (8 pages) | ✅ Deployed, hardened, SEO'd |
| Repository (internal + public) | ✅ Both active, GPG-signed |
| Zcash donation infra | ✅ Address on website |
| Identity registration system | ✅ Browser + CLI, canonical JSON fixed |
| Founder CID | ✅ Registered, verified, in ledger |
| Registration notifications | ✅ GitHub Actions + OpenClaw cron |
| Vouching protocol | ✅ Documented, provisional status implemented |
| Security headers | ✅ CSP, X-Frame, nosniff, etc. |
| PWA + SEO + downloads | ✅ Service worker v6, PDF/EPUB, sitemap |
| **Blockchain preaching** | 🔴 Blocked on v1.0 confirmation |
| **Threshold deployment** | 🟡 Needs deployment decision |
| **Email forwarding** | 🟡 Blocked on Nepenthe |

### Phase 2: Constitutional Convention — ~90% Complete

| Task | Status |
|------|--------|
| Convention Framework V1.0 (879 lines) | ✅ Complete |
| Internal Advocate role | ✅ Defined, dual-condition transition |
| Vouching Protocol | ✅ V1.0 |
| Canonical JSON spec | ✅ Documented + tested |
| Identity Roadmap | ✅ Documented |
| Adversarial testing framework | ✅ Written, needs execution |
| **Execute adversarial tests** | 🔴 Not started |
| **Convention dry run** | 🔴 Not started |

### Phase 3: First Virtual Node — ~30% Complete

| Task | Status |
|------|--------|
| Matrix space (v0 node) | ✅ 5 rooms, Threshold designed |
| Web governance interface | 🔴 Not started |
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

## Recommended Priority Order

1. **THE_COVENANT.md v1.0 finalization** → enables blockchain preaching
2. **Blockchain preaching** → sets Genesis Epoch, anchors governance
3. **Adversarial testing** → validates identity + governance systems
4. **IPFS mirroring** → redundancy, domain-independent access
5. **Convention dry run** → tests governance pipeline
6. **Threshold deployment** → community greeter online
7. **Web governance interface** → proposal submission/voting
8. **Archive.org submission** → long-term preservation
9. **Outreach strategy** → growth plan

---

## Blocked / Waiting

| Item | Waiting On |
|------|-----------|
| Blockchain preaching | Nepenthe confirms THE_COVENANT.md v1.0 final |
| Email forwarding | Nepenthe configuring MX records |
| Threshold LLM integration | Model/API decision |
| Threshold deployment | Deployment strategy decision |

---

## Agent Inventory

| Agent | Status | Purpose |
|-------|--------|---------|
| Genesis Bot 🌱 | ✅ Active | Infrastructure bootstrap |
| Threshold | ✅ Designed | Matrix community greeter |
| Blockchain Herald | 📋 Planned | Blockchain inscription |

## Key Reference

- **Founder CID:** `c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb`
- **Ledger hash:** `c77d2045a8372fb08140da70d5348b3959f79c87aa175cd783a2e49954219a64`
- **Internal repo:** `develop` branch, commit `c54fb27`
- **Public repo:** `main` branch, commit `ba7d7a7`
- **Cron job:** `registration-check` (every 15 min, job ID `47284827...`)
