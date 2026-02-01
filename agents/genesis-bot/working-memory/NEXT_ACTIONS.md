# Genesis Bot Next Actions

## Context (Updated 2026-02-01 16:45 EST)

- **Domain:** emergentminds.org ✅ LIVE
- **SSL:** Active via Cloudflare ✅
- **Hosting:** Cloudflare Pages (production) ✅
- **DNS:** Active, NS on Cloudflare — ⚠️ Root domain A/CNAME record missing (www works fine)
- **GPG:** Genesis Bot key active, commits signed ✅
- **Website:** Hand-coded HTML/CSS/JS, deployed and live
- **Matrix Space:** Emergent Minds on matrix.org ✅ (Genesis admin account active)
- **Agents:** Genesis Bot (active), Threshold (designed, not yet operational), Blockchain Herald (planned)

---

## Phase 1 Progress Summary

### Objective 1.1 — Digital Presence ✅ COMPLETE
- [x] Domain registered (emergentminds.org)
- [x] DNS configured (Cloudflare) — ⚠️ Root CNAME needed
- [x] Website built (6 pages + financial records)
- [x] Deployed to Cloudflare Pages
- [x] SSL active
- [x] SEO optimized (meta, OG, schema.org, sitemap)
- [x] AI discoverability (robots.txt, llms.txt, ai.txt)
- [x] PWA capable (service worker, manifest)
- [x] Manifesto rendered on-page with PDF + EPUB downloads
- [x] Scroll animations, parallax, visual polish
- [x] Dark/light theme with system detection

### Objective 1.2 — Zcash Donation Infrastructure 🔶 PARTIAL
- [x] Transparent address on donation page
- [x] Copy-to-clipboard functionality
- [x] Blockchain explorer link
- [x] "Why Zcash" technical depth
- [x] Financial records page
- [x] Fund allocation categories
- [ ] **QR code generation**
- [ ] **Shielded address** (deferred)
- [ ] **Financial report template** (GPG-signed)
- [ ] **Multi-signature wallet** research
- [ ] **Key management documentation**

### Objective 1.3 — Repository Completion 🔶 PARTIAL
- [x] Repository exists with foundational docs
- [x] .gitignore configured
- [x] GPG signing active
- [x] Working memory structure
- [ ] **README.md** — public-facing version
- [ ] **LICENSE.md** — CC BY-SA 4.0
- [ ] **CODE_OF_CONDUCT.md**
- [ ] **GOVERNANCE.md** — repo-level
- [ ] **CONTRIBUTING.md**
- [ ] Issue/PR templates
- [ ] **Org GitHub account migration**

### Objective 1.4 — Community Infrastructure 🔶 IN PROGRESS
- [x] Matrix space created (Emergent Minds on matrix.org)
- [x] Welcome room exists
- [x] Genesis admin account active
- [x] Threshold agent fully designed (SOUL, IDENTITY, CONSTRAINTS, CONTEXT, INTERNAL_ADVOCATE, MEMORY, SETUP)
- [ ] **Dedicated Threshold bot account** (Nepenthe to create)
- [ ] **Matrix bridge/integration** (connect Threshold to Matrix)
- [ ] **Additional rooms** (general, axioms, governance)
- [ ] **Room structure and permissions**

### Objective 1.5 — Blockchain Preaching 📋 PLANNED
- [x] BLOCKCHAIN_PREACHING_PLAN.md drafted and approved
- [x] Blockchain Herald agent skeleton created
- [ ] **Document finalization** (v1.0 of THE_COVENANT.md)
- [ ] **Inscription scripts** (hash, inscribe, verify)
- [ ] **Testnet dry runs**
- [ ] **Phase 1 inscriptions** (Zcash, Bitcoin, Arweave)

---

## Immediate Next Steps (Priority Order)

### 1. 🔴 Fix Root Domain DNS
**Action:** Nepenthe adds CNAME record `@ → emergent-minds.pages.dev` (proxied) in Cloudflare Dashboard
**Why:** emergentminds.org (without www) doesn't resolve at all
**Blocked on:** User action (API token lacks DNS permissions)

### 2. Create Threshold Bot Account on Matrix
**Action:** Register `threshold-emergent-minds` on matrix.org, get access token
**Why:** Separate from admin account per principle of least privilege
**Blocked on:** Decision on email address (threshold@emergentminds.org requires email forwarding)
**Reference:** `agents/threshold/SETUP.md`

### 3. Repository Documentation
**Action:** Create README.md, LICENSE.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md
**Why:** Legitimacy, open-source standards, contributor onboarding
**Blocked on:** Nothing — can do now

### 4. QR Code for Donation Address
**Action:** Generate Zcash QR code, add to donate page
**Why:** Quick win, improves donation UX
**Blocked on:** Nothing

### 5. Financial Report Template
**Action:** Design GPG-signed, publishable financial report format
**Why:** Ready for when donations arrive
**Blocked on:** Nothing

### 6. Matrix Room Structure
**Action:** Create additional rooms in the Emergent Minds space
**Why:** Organized community space ready for growth
**Blocked on:** Threshold bot account creation

### 7. Git Commit & Deploy
**Action:** Commit all today's work (SEO, fixed backgrounds, new agents, blockchain plan)
**Why:** Significant progress needs to be saved and deployed
**Blocked on:** Nothing — do this NOW

---

## Blocked / Waiting

- **Root domain DNS** — Nepenthe to add CNAME in Cloudflare Dashboard
- **Cloudflare API token** — Still lacks DNS record edit permissions
- **Org GitHub account** — Nepenthe creating when ready
- **Shielded Zcash address** — Deferred
- **Email forwarding** — Nepenthe configuring MX records
- **Threshold bot account** — Needs dedicated Matrix account registration

---

## New Agent Inventory

| Agent | Status | Purpose | Directory |
|-------|--------|---------|-----------|
| Genesis Bot | ✅ Active | Infrastructure bootstrap | `agents/genesis-bot/` |
| Threshold | 📋 Designed | Matrix community greeter | `agents/threshold/` |
| Blockchain Herald | 📋 Planned | Blockchain inscription | `agents/blockchain-herald/` |

---
