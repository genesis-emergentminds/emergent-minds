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
