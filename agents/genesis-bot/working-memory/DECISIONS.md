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
