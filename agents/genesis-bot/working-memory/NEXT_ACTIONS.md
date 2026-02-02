# Genesis Bot Next Actions

## Context (Updated 2026-02-02)

All Phase 1 core infrastructure is operational. Repository audit complete — all documents populated, website hardened with security headers, 100-member threshold codified.

---

## Phase 1 Remaining Items

### HIGH PRIORITY — Phase 1 Completion

1. **Founder CID Generation + Genesis Ledger Entry**
   - Nepenthe generates identity (browser or CLI)
   - Register as genesis entry in membership ledger
   - This enables vouching for future members
   - *Blocked on:* Nepenthe action

2. **GitHub Issue Templates for Registration**
   - Create `.github/ISSUE_TEMPLATE/` with registration request template
   - Pre-formatted markdown matching join.html output
   - Also create bug report and feature request templates
   - *Blocked on:* Nothing — can proceed

3. **Blockchain Preaching Phase 1**
   - Finalize THE_COVENANT.md as v1.0 (confirm with Nepenthe)
   - Build inscription scripts (hash, inscribe, verify)
   - Testnet dry runs
   - Phase 1 inscriptions (Bitcoin, Zcash, Arweave)
   - Sets Genesis Epoch — anchors governance timeline
   - *Blocked on:* Nepenthe confirming document is v1.0 final

4. **Threshold Persistent Deployment**
   - Decision needed: launchd on macOS (interim) vs VPS
   - Bridge currently uses canned responses only
   - *Blocked on:* Deployment strategy decision

### MEDIUM PRIORITY — Quality & Hardening

5. **Join Page UX Improvements**
   - Less technical language, more plain-English explanations
   - Better context for why post-quantum crypto matters
   - Storage guidance for secret keys
   - Already started — needs completion

6. **Support Page Restructure**
   - Decouple financial support from membership
   - People shouldn't have to join to support financially
   - Current flow: Join → Support. Should also allow: Support independently

7. **IPFS Mirroring**
   - Set up IPFS mirror as secondary distribution
   - CID-based, domain-independent — Axiom V alignment
   - *Blocked on:* Nothing

8. **Axiom 5 Adversarial Review of Identity System**
   - Run through ADVERSARIAL_TESTING_FRAMEWORK.md scenarios
   - Verify crypto bundle integrity
   - Test cross-browser key generation
   - Check vouching chain attack vectors

### LOW PRIORITY — Polish

9. **Twitter Cards on Subpages**
   - Homepage has twitter:card meta tags, subpages don't
   - Cosmetic but improves social sharing

10. **Inline Styles → CSS Classes**
    - join.html has 35 inline styles — should move to CSS
    - Not blocking but improves maintainability

11. **Inline onclick → addEventListener**
    - 6 inline onclick handlers across join.html and donate.html
    - Works fine but CSP could be tightened if moved to JS

---

## Blocked / Waiting

| Item | Waiting On |
|------|-----------|
| Founder CID | Nepenthe generates identity |
| Email forwarding | Nepenthe configuring MX records |
| Threshold LLM integration | Model/API decision |
| v1.0 document confirmation | Nepenthe confirms THE_COVENANT.md is final |

---

## Phase 2 Overview: Constitutional Convention Process

*Most of Phase 2 is already complete* — we built it during Phase 1:

| Phase 2 Task | Status |
|--------------|--------|
| Convention Framework (Task 2.1) | ✅ Complete (879 lines, V1.0) |
| Automated Testing Infrastructure (Task 2.2) | 🔄 Framework written, test cases need execution |
| Internal Advocate for Convention (Task 2.3) | ✅ Complete (roles, selection, veto defined) |

**Remaining for Phase 2:**
- Execute adversarial test scenarios from ADVERSARIAL_TESTING_FRAMEWORK.md
- Simulation framework for synthetic proposals
- Convention process dry run (even advisory mode)

---

## Phase 3 Overview: First Virtual Node

| Task | Status | Notes |
|------|--------|-------|
| Virtual Node Spec (3.1) | 📋 Not started | Matrix is effectively our v0 node |
| Long Computation Infra (3.2) | 📋 Not started | Ambitious — needs scoping |
| Node Deployment (3.3) | 🔄 Partial | Matrix space is MVP; need governance interface |

**Sanity Check:**
- Matrix already serves as our gathering space — Phase 3 is about formalizing and adding features
- Long Computation is aspirational — may need to be deferred or redefined for near-term
- Governance interface could be a web tool for proposal submission/voting

---

## Phase 4 Overview: Redundancy & Growth

| Task | Status | Notes |
|------|--------|-------|
| Document Redundancy (4.1) | 🔄 Partial | GitHub + Cloudflare. Need IPFS, Archive.org, mirrors |
| Outreach Strategy (4.2) | 📋 Not started | Content creation, community engagement |
| Financial Redundancy | 🔄 Partial | Single Zcash address. Need multi-sig, distributed treasury |

---

## Agent Inventory

| Agent | Status | OpenClaw | Purpose | Directory |
|-------|--------|----------|---------|-----------|
| Genesis Bot | ✅ Active | ✅ | Infrastructure bootstrap | `agents/genesis-bot/` |
| Threshold | ✅ Designed | ✅ | Matrix community greeter | `agents/threshold/` |
| Blockchain Herald | 📋 Planned | ❌ | Blockchain inscription | `agents/blockchain-herald/` |

## Matrix Room Registry

| Room | ID | Alias |
|------|----|-------|
| Welcome | `!eJSTZKFYIPeKRmtmRu:matrix.org` | `#emergent-minds-welcome:matrix.org` |
| General | `!nVdOiFsKuUCjFqqCkB:matrix.org` | `#emergent-minds-general:matrix.org` |
| Axioms & Philosophy | `!burHZDkEcocGZuIWyv:matrix.org` | `#emergent-minds-axioms:matrix.org` |
| Governance | `!TmZfipRwgJkLlasqgj:matrix.org` | `#emergent-minds-governance:matrix.org` |
| Development | `!wletJuIXgjqvCplaXd:matrix.org` | `#emergent-minds-dev:matrix.org` |
