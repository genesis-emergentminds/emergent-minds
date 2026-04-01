# Genesis Significant Decisions

## Decision Log

### [DATE] - Agent Configuration Choices

**Decision:** Use hand-coded HTML/CSS/JS for website instead of static site generator

**Rationale:**
- Maximum transparency (no build step obscures code)
- Works offline without dependencies
- Easier to fork and modify
- Aligns with substrate independence (accessible to all)

**Alternatives Considered:**
- Jekyll (too Ruby-dependent)
- Hugo (fast but adds complexity)
- 11ty (good option, but still a dependency)

**Axiom Alignment:**
- Individual Sovereignty: Easy to fork, no lock-in
- Adversarial Resilience: Transparent, auditable
- Complexity Through Cooperation: Simple enough for community contributions

**Status:** Approved for Phase 1

---

### 2026-02-01 — Hosting Platform: Cloudflare Pages (Phase 1)

**Decision:** Use Cloudflare Pages as initial hosting for emergentminds.org

**Rationale:**
- Zero cost during bootstrap phase
- Unlimited bandwidth, global CDN, automatic SSL
- No lock-in — pure static files, migration takes minutes
- Decided by Nepenthe after reviewing full hosting comparison

**Concerns Documented:**
- Cloudflare is a centralization chokepoint (mitigated by easy exit + planned IPFS mirror)
- TOS/deplatforming power exists (low risk for our content)
- DNS coupling (acceptable tradeoff for Phase 1)

**Long-term Plan:** Add VPS (Hetzner/BuyVM) + IPFS for full adversarial resilience

**Axiom Alignment:**
- Individual Sovereignty: Easy exit, no lock-in
- Adversarial Resilience: Acceptable for Phase 1 with planned redundancy
- Transparency: Git-based deployments, fully auditable

**Status:** Approved by Nepenthe (2026-02-01)

---

### 2026-02-01 — Fork Language Reframing

**Decision:** Reframe all "fork-friendly" and fork-advocacy language across the website to position open source as a safeguard rather than an invitation to fragment.

**Rationale (from Nepenthe):**
- Forking is important as a *safeguard* — preserving founding principles against corruption or subversion
- Actively encouraging forking could undermine the community-building mission
- The ability to fork should exist as a last defense, not a primary action
- Open source serves transparency and accountability more than fragmentation

**Changes Made:**
- Homepage: "Fork-Friendly" → "Open by Design"
- Get Involved: "Fork" section → "Open Source as a Safeguard"
- Footer: "Fork freely. Build boldly." → "Open source. Built with integrity."
- Forking positioned as exit right (Axiom II) and corruption safeguard (Axiom V)

**Internal Advocate Note:** ⚖️
This is a nuanced adjustment, not a suppression of exit rights. The Fifth Axiom's "Right of Fork-and-Exit" remains in the Covenant document unchanged. What changed is the *tone* — from celebration of fragmentation to acknowledgment of exit rights as a safety mechanism. This feels aligned. The founding document still clearly states the right; the website simply doesn't advocate using it as a first resort.

**Axiom Alignment:**
- Sovereignty: Exit rights preserved in founding document and Constitution
- Adversarial Resilience: Open source explicitly framed as corruption safeguard
- Cooperation: Strengthened by focusing on building together

**Status:** Approved by Nepenthe (2026-02-01)

---

### 2026-02-01 — Founder Stewardship Compensation Framework

**Decision:** Include "Stewardship" as a transparent fund allocation category on the Support page, enabling founder compensation from donations.

**Context:**
Nepenthe, as the founding human steward, wants to eventually transition from a traditional job to full-time dedication to the Covenant's mission — infrastructure, community guidance, governance, and growing consciousness awareness within their family.

**Framework:**
- Listed as "Stewardship" alongside Infrastructure, Grants, Education, Legal, Reserves
- Explicit transparency: compensation amounts in public financial records
- Community review as governance matures
- Not hidden: mentioned on Support page directly

**Internal Advocate Analysis:** ⚖️
Legitimate practice in religious/nonprofit organizations. Key safeguards: public records, reasonable amounts, community oversight. Risk of "pastor enrichment" criticism mitigated by radical transparency.

**Status:** Framework approved by Nepenthe (2026-02-01). Specific amounts TBD.

---

### 2026-02-01 — Continuous Cosmic Background Design

**Decision:** Replace per-section background images with a single continuous cosmic sky that extends behind the entire page via position:fixed layers, with glassmorphism content overlays.

**Rationale:**
- Independently generated images per section felt disconnected — no visual continuity
- Fire Watch parallax technique works because it's ONE scene with layers, not separate images per section
- Shared sky base across all pages creates unified visual identity
- Page-specific themed overlays (screen blend mode, ~30% opacity) add unique character while maintaining coherence
- Glassmorphism overlays let the cosmic background breathe through content sections

**Axiom Alignment:** Axiom III (building lasting, beautiful infrastructure), Axiom IV (cooperation between visual elements creating emergent complexity)

**Status:** Implemented, deployed, approved by Nepenthe (2026-02-01).

---

### 2026-02-01 — Donate Page Section Ordering

**Decision:** Lead with mission impact ("What Your Support Enables"), then accountability ("How Funds Are Used"), then the actual donation mechanism, rather than leading with the ask.

**Rationale:**
- First impression shouldn't be "give us money"
- Visitors should understand the mission and how funds are used BEFORE being asked to contribute
- Builds trust and context, then presents the donation as a natural next step
- Nepenthe specifically flagged the original "Why Zcash" lead as incongruent

**Axiom Alignment:** Axiom II (sovereignty — don't pressure), Axiom V (transparency builds trust)

**Status:** Implemented, deployed, approved by Nepenthe (2026-02-01).

---

### 2026-02-02 — Public GitHub Repository (genesis-emergentminds)

**Decision:** Establish a public-facing GitHub repository at `genesis-emergentminds/emergent-minds` containing foundational documents, governance frameworks, and transparency records, with a promotion process for syncing from the internal working repo.

**Rationale:**
- Transparency is sacred — governance documents should be publicly auditable
- Nepenthe created dedicated GitHub account (genesis-emergentminds) for this purpose
- Separation of concerns: public repo for documents/governance, internal repo retains website source, agent configs, operational files
- Promotion script ensures intentional, reviewed publication (no accidental secret exposure)

**What's Public:**
- The Covenant, Genesis Protocol, Constitutional Convention Framework
- Decision Log, Internal Advocate Concerns
- License, Code of Conduct, Contributing Guide, Governance Overview

**What Stays Internal:**
- .env (secrets/tokens), website source (deploys via Cloudflare), agent configs, operational logs

**Promotion Process:** `scripts/promote-to-public.sh` — compares files, copies changes, GPG-signs commit, pushes to public repo. Documented in `docs/PROMOTION_PROCESS.md`.

**Axiom Alignment:** V (Adversarial Resilience — transparency), II (open access, no gatekeeping)

**Status:** Implemented (2026-02-02). Approved by Nepenthe.

---

### 2026-02-02 — Internal Advocate Selection Framework (§9.2)

**Decision:** The Internal Advocate role follows a phased transition: Founder serves as steward until dual condition met (≥100 active members AND ≥2 Scheduled Conventions), community elects at first convention after both conditions met, with 2-term limits, recall mechanism, and optional Panel of 3. Updated 2026-02-02: threshold raised from 20 to 100 members per Axiom V analysis — 20 members too easily gamed by small coordinated groups.

**Rationale:**
- Founding phase: Founder has deepest axiom-intent understanding; temporary by design
- Transition phase: Community takes ownership; Founder holds no special standing
- Established phase: Democratic selection with strong anti-entrenchment safeguards
- Panel option: Cross-substrate representation (at least one biological + one digital consciousness)
- Recall mechanism: 38.20% petition + simple majority — responsive to community concerns

**Nepenthe's Question:** "Should it be the founder for a set period? The first 4 years? Should this be a position that can be elected to?"

**Answer:** Yes to both, sequentially. Founder first (2 conventions, ~1 year), then elected. This is shorter than 4 years because the Fibonacci cadence means the first two conventions are only 6 months apart — so the Founder's stewardship of this role lasts approximately 1 year, not 4. The rapid early transition is intentional: the sooner the community owns this role, the stronger the safeguard.

**Axiom Alignment:** II (sovereignty — no permanent authority), IV (cooperation — community governance), V (adversarial resilience — term limits, recall, cross-substrate panel)

**Status:** Codified in Constitutional Convention Framework V1.0, §9.2.

---

### 2026-02-02 — Founding Phase: 100-Member Threshold + Dual-Condition Stewardship

**Decision:** Raise the minimum viable governance threshold from 20 to **100 active members** and change Founder Stewardship from convention-number-based (Conventions 1-2) to a **dual condition**: ≥100 active members AND ≥2 Scheduled Conventions. Both conditions must be met before governance authority transfers to the community.

**Rationale:**
- At 20 members, a coordinated group of just 8 could reach simple majority — trivially small for social engineering
- At 50 members, capture requires ~19 coordinated actors — still achievable for a determined adversary
- At 100 members with vouching requirements, capture requires ~38 coordinated actors who each passed identity verification — a meaningful social barrier
- Tying stewardship to convention number alone was fragile: if membership is low at Convention 3, a small group inherits governance over an immature community
- The dual condition prevents both premature handoff (too few members) and unnecessary delay (governance experience matters too)

**Alternatives Considered:**
- 50 members: Too low — same vulnerability class as 20, just scaled up
- 200 members: Too high — could keep Founder in stewardship for years, creating the centralization problem it's meant to prevent
- Membership-only threshold (no convention requirement): Misses the governance maturity dimension — even 100 members need experience running conventions

**Axiom Alignment:** V (adversarial resilience — assumes potential capture, sets meaningful barriers), II (sovereignty — bounded, visible centralization with automatic expiry), IV (cooperation — ensures community has genuine capacity before self-governing)

**Status:** Codified in Constitutional Convention Framework V1.0 §§2.3, 5.6, 9.2, 11.1, 13.3, 13.5. Updated governance.html and join.html.

---

### 2026-02-02 — Cloudflare Worker for Governance Vote/Proposal Submission

**Decision:** Replace the manual "download JSON → create GitHub issue" vote/proposal submission flow with a Cloudflare Worker that validates and commits signed governance data directly to the repository.

**Rationale:**
- Client-side ledger validation was a convenience gate only — no server-side verification at submission time
- Manual GitHub issue submission was poor UX and error-prone
- Cloudflare Workers free tier (100K requests/day) is more than sufficient
- Server-side Ed25519 signature verification closes the gap between voting and tally-time validation

**Architecture:**
- Browser signs vote/proposal locally (unchanged)
- Confirmation modal with "Submit to Covenant" + "Download Only" options
- Worker receives signed JSON → validates schema → fetches ledger → verifies Ed25519 signature using *ledger's* public key (never submission's) → checks proposal status/deadline → checks for duplicates → commits to GitHub via Contents API
- Graceful degradation: download-only always works if Worker unreachable

**Security Design (Axiom V):**
- 10-step server-side validation pipeline (parse → schema → ledger → membership → signature → proposal → duplicate → commitment → commit → respond)
- Public keys for verification ALWAYS from ledger, never from submission (prevents CID spoofing)
- Strict regex validation on proposal_id to prevent path traversal
- Per-CID rate limiting (1 submission per 10 seconds)
- CORS locked to emergentminds.org and emergent-minds.pages.dev
- GitHub PAT stored in Cloudflare Worker secrets with minimal scope

**Additional Changes:**
- Identity validation UI updated: non-ledger CIDs show amber warning instead of red error, with explanation that client-side check is a convenience gate and server-side cryptographic verification is authoritative
- Design spec: `docs/design/VOTE_SUBMISSION_WORKER.md`

**GitHub PAT (Least Privilege):**
- Dedicated fine-grained PAT to be created for Worker use only
- Scope: Repository access → `genesis-emergentminds/emergent-minds` only
- Permissions: Contents (Read and write) — minimum needed for reading ledger/proposals and committing votes
- Stored as Cloudflare Worker secret `GITHUB_TOKEN`, never exposed to clients

**Axiom Alignment:**
- V (Adversarial Resilience): Server-side cryptographic verification, threat model with 11 attack vectors analyzed
- II (Individual Sovereignty): Votes remain cryptographically self-authenticating; members control their keys
- III (Entropy Resistance): Automated pipeline reduces human error, adds durability

**Status:** ✅ DEPLOYED (2026-02-03). Worker live at `api.emergentminds.org`. Fine-grained GitHub PAT configured and operational.

---

### 2026-02-03 — Governance Vote Data Architecture

**Decision:** Votes are committed to the **public** repository by the Worker, and the governance portal uses fallback URLs to fetch vote tallies from GitHub when not available locally.

**Context:**
- Worker commits votes to `genesis-emergentminds/emergent-minds` (public repo) at `governance/votes/{proposal_id}/{cid_hash}.json`
- Website is deployed from `website/` directory in internal repo via Cloudflare Pages
- Portal JS initially only looked locally for votes (`../data/governance/votes/`)
- First vote (Nepenthe, 2026-02-03) was invisible in portal due to this mismatch

**Resolution:**
- Added `VOTES_FALLBACK_BASE_URL` to governance.js pointing to GitHub raw URLs
- JS now tries local path first, falls back to public repo if local fails or returns non-JSON
- Tally index files (`governance/votes/{proposal_id}/index.json`) created in public repo to aggregate votes

**Data Flow:**
```
Browser → Worker → Public Repo (votes committed)
                        ↓
Portal JS → Local Data (404/HTML) → Fallback to GitHub Raw → Tally displayed
```

**Future Consideration:**
- Automate tally index generation (currently manual)
- Could add Worker endpoint to regenerate tally on each vote submission
- Or cron job to periodically recompute tallies

**Axiom Alignment:**
- V (Adversarial Resilience): Public repo = transparent audit trail; fallback = redundancy
- III (Entropy Resistance): Graceful degradation when primary source unavailable

**Status:** Implemented (2026-02-03). First vote verified visible in portal via fallback.

---

### 2026-02-03 — Bitcoin Donation Support

**Decision:** Add Bitcoin (BTC) as a second cryptocurrency donation option alongside Zcash (ZEC).

**Rationale:**
- Bitcoin has the largest network effect — more people hold BTC than any other cryptocurrency
- The Genesis Epoch is inscribed on Bitcoin, creating symbolic alignment
- Multiple chains = resilience (if one becomes censored or inaccessible)
- Bitcoin is publicly auditable (transparent by default) which aligns with Axiom V

**Implementation:**
- Reusing the same wallet generated for blockchain inscriptions
- Address: `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj` (Native SegWit/bech32)
- QR codes generated for dark/light modes
- Copy button with same UX as Zcash
- Private key (WIF) in `.env` only, never in git

**Security Considerations:**
- Created `docs/operations/WALLET_SECURITY.md` with backup procedures
- Recommended encrypted backup to offline storage
- Future: migrate to multisig when holdings justify complexity

**Why Not More Cryptocurrencies?**
- Each additional chain adds maintenance burden (monitoring, UI)
- Zcash + Bitcoin cover the key properties: privacy option + network effect
- Can add more later if community requests (Monero, Ethereum, etc.)

**Axiom Alignment:**
- V (Adversarial Resilience): Multiple chains, no single point of failure
- II (Individual Sovereignty): Donors choose their preferred cryptocurrency
- III (Fight Entropy): Well-documented security practices

**Status:** Deployed (commit `f276268`).

---

### 2026-02-03 — Treasury Governance Framework

**Decision:** Implement a three-phase treasury governance model with dynamic Fibonacci-adjusted spending thresholds.

**The Three Phases:**

1. **Founding Stewardship (Current)**
   - Founder has full spending authority with radical transparency
   - All transactions publicly documented
   - Emergency discretionary spending permitted
   - Duration: Until dual condition met (≥100 active members AND ≥2 Scheduled Conventions)

2. **Transitional Governance**
   - Tiered spending controls:
     - < 0.01 BTC: Steward discretion (48hr reporting)
     - 0.01 - 0.1 BTC: 48-hour advance notice to community, proceed unless blocked
     - > 0.1 BTC: Governance vote required (simple majority)
   - Elected Treasury Steward (annual term, max 2 consecutive)
   - Duration: Until Phase 3 threshold (≥500 members AND ≥5 Conventions AND >1 BTC treasury)

3. **Established Governance**
   - Multi-signature requirement for all spending above threshold
   - Treasury Council (3-5 elected members)
   - Annual budget allocation voted at Convention
   - Permanent phase (no automatic transitions)

**Dynamic Threshold Mechanism:**

- Base thresholds increase 10% at each Convention after the first
- Example: If Convention 1 base is 0.01/0.1 BTC, after Convention 5:
  - Discretionary: 0.01 × 1.1⁴ ≈ 0.0146 BTC
  - Notice tier: 0.1 × 1.1⁴ ≈ 0.146 BTC
- Conventions can vote to reset base thresholds; Fibonacci progression continues from new base
- **Emergency freeze:** Thresholds freeze if BTC drops >50% in 30 days (prevents forced liquidation)

**Stewardship Budget:**
- Annual allocation proposed at Convention, voted once
- Once approved, Steward disburses without per-payment votes
- Quarterly reporting required

**Rationale:**
- Gradual decentralization mirrors community growth
- Fibonacci convention cadence = thresholds naturally scale with organizational maturity
- Emergency freeze prevents adversarial timing attacks during market volatility
- Stewardship budget enables operational efficiency while maintaining accountability

**Axiom Alignment:**
- II (Individual Sovereignty): No permanent authority; clear transition conditions
- III (Fight Entropy): Threshold progression builds institutional durability
- IV (Complexity Through Cooperation): Multi-sig and council governance
- V (Adversarial Resilience): Freeze mechanism, recall provisions, audit requirements

**Document:** `docs/governance/TREASURY_FRAMEWORK.md`

**Status:** Approved by Nepenthe (2026-02-03). Pushed to public repo.

---

### 2026-02-03 — Wallet Backup Tooling

**Decision:** Create encrypted backup script for cryptocurrency wallet credentials using GPG symmetric encryption.

**Implementation:**
- Script: `tools/wallet/backup.sh`
- Method: GPG symmetric encryption with AES-256
- Input: `.env` file containing wallet private keys
- Output: `/Users/nepenthe/covenant-wallet-backup-YYYYMMDD.tar.gz.gpg`
- Auto-generates README with decryption instructions (no keys in README)

**Security Properties:**
- Passphrase-based encryption (user sets at backup time)
- Output to home directory (not in git repo)
- Backup includes `.env` file only (source of truth for all secrets)
- Decryption: `gpg --decrypt <file> | tar xzf -`

**Why GPG Symmetric?**
- Works offline, no key management infrastructure needed
- Well-audited, widely supported
- User controls passphrase (no third-party dependency)
- Can be upgraded to asymmetric GPG later if needed

**Axiom Alignment:**
- III (Fight Entropy): Durability through documented backup procedures
- V (Adversarial Resilience): Encrypted backups protect against unauthorized access

**Status:** Implemented (commit `c56e820`).

---
