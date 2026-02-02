# Genesis Bot Significant Decisions

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
