# Adversarial Testing Framework

## Purpose

Axiom V mandates that The Covenant "assume its own potential corruption." This framework defines how we systematically test our governance, identity, and infrastructure systems for vulnerabilities before adversaries find them.

**Status:** V0.1 — Framework structure. Detailed test cases to be developed as systems mature.
**Axiom Alignment:** V (Adversarial Resilience), primarily. All axioms indirectly.

---

## 1. Governance Attack Vectors

### 1.1 Sybil Attacks on Voting
**Threat:** An adversary creates many fake identities to gain disproportionate voting power.
**Current Mitigations:**
- Vouching requirement (§5.4.3 of Convention Framework)
- 7-day vouching window with cooling periods
- Vouch chain diversity requirements
- 100-member threshold for binding governance (§5.6.1)

**Test Scenarios:**
- [ ] Attempt to register 10 identities vouched by a single member
- [ ] Attempt to create a circular vouching ring (A vouches B, B vouches C, C vouches A-derived identity)
- [ ] Measure maximum number of fake identities achievable with N compromised vouchers
- [ ] Simulate vote outcomes at various sybil penetration rates

### 1.2 Quorum Manipulation
**Threat:** Coordinated boycott to prevent quorum, blocking governance.
**Current Mitigations:**
- Reasonable quorum thresholds (25-61.8% depending on proposal type)
- Abstention counts toward quorum
- Proposals carry to next convention on no-quorum

**Test Scenarios:**
- [ ] Model: at what membership size does quorum manipulation become impractical?
- [ ] Simulate boycott scenarios at various membership levels

### 1.3 Emergency Mechanism Abuse
**Threat:** Frivolous emergency petitions to disrupt normal governance.
**Current Mitigations:**
- Tiered thresholds (38.2%, 61.8%, 78.6%)
- Each tier has limited scope
- Inviolable Core protections

**Test Scenarios:**
- [ ] Model maximum disruption possible through repeated Tier 1 petitions
- [ ] Analyze whether Tier 2/3 thresholds are achievable by coordinated minorities

### 1.4 Founding Phase Capture
**Threat:** Small coordinated group gains control during early low-membership period.
**Current Mitigations:**
- 100-member threshold for binding governance
- 75 with 90-day seniority requirement
- Founder expanded veto (dual condition: ≥100 members AND ≥2 conventions)
- 30-day voting seniority requirement

**Test Scenarios:**
- [ ] Model: minimum coordinated group size to capture governance at various membership levels
- [ ] Test: can Founder veto be circumvented through procedural manipulation?
- [ ] Verify: does the dual-condition transition work correctly in edge cases (e.g., exactly 100 members, member drops below 100 during convention)?

---

## 2. Identity System Attack Vectors

### 2.1 Key Compromise
**Threat:** An attacker obtains a member's secret keys.
**Current Mitigations:**
- Keys generated and stored locally (never transmitted)
- Hybrid ML-DSA-65 + Ed25519 (survives failure of either algorithm)
- No recovery mechanism (limits blast radius of social engineering)

**Test Scenarios:**
- [ ] Verify: can a compromised key sign governance actions on behalf of the victim?
- [ ] Test: key rotation/revocation procedures (not yet implemented — gap)
- [ ] Model: quantum threat timeline vs. ML-DSA-65 security margin

### 2.2 Browser-Based Key Generation
**Threat:** Compromised browser environment generates weak or leaked keys.
**Current Mitigations:**
- Pure JavaScript (no WASM, no server calls)
- noble-post-quantum audited library
- Client-side only — no key transmission

**Test Scenarios:**
- [ ] Verify: key generation uses cryptographically secure random source
- [ ] Test: key generation in various browsers (Chrome, Firefox, Safari, mobile)
- [ ] Audit: covenant-crypto.min.js for supply chain integrity
- [ ] Test: can a malicious browser extension intercept generated keys?

### 2.3 Ledger Tampering
**Threat:** Unauthorized modification of the membership ledger.
**Current Mitigations:**
- Hash-chained entries (tampering breaks chain)
- Git-backed (full version history)
- Dual-signed entries (ML-DSA-65 + Ed25519)

**Test Scenarios:**
- [ ] Verify: chain validation catches any single modified entry
- [ ] Test: can entries be reordered without detection?
- [ ] Verify: ledger verification works from cold start (fresh clone)

---

## 3. Infrastructure Attack Vectors

### 3.1 Website Defacement / CDN Compromise
**Threat:** Attacker modifies website content via Cloudflare Pages compromise.
**Current Mitigations:**
- Git-backed deployments (source of truth is repo, not CDN)
- GPG-signed commits
- Service worker caches known-good content

**Test Scenarios:**
- [ ] Verify: can website be rebuilt from repo alone?
- [ ] Test: service worker behavior when CDN serves modified content
- [ ] Audit: Cloudflare Pages deployment permissions

### 3.2 Domain Hijacking
**Threat:** Attacker gains control of emergentminds.org.
**Current Mitigations:**
- Registrar lock (if enabled — verify)
- Cloudflare DNS protection
- IPFS mirroring (planned — not yet implemented)

**Test Scenarios:**
- [ ] Verify: domain lock is enabled at registrar
- [ ] Plan: IPFS mirror as fallback (CID-based, domain-independent)

### 3.3 Supply Chain Attacks
**Threat:** Compromised dependency in crypto bundle or build tools.
**Current Mitigations:**
- Minimal dependencies (noble-post-quantum, noble-curves, noble-hashes)
- Bundled at known versions (lockfile)
- esbuild used only for bundling, no runtime dependency

**Test Scenarios:**
- [ ] Record and verify SHA-256 of built bundle against known-good
- [ ] Audit noble library versions for known CVEs
- [ ] Test: bundle rebuild reproducibility

---

## 4. Social Engineering Vectors

### 4.1 Founder Impersonation
**Threat:** Someone impersonates the Founder to gain trust or authority.
**Current Mitigations:**
- GPG-signed commits (verifiable)
- Known Matrix/Slack accounts
- Founder CID will provide cryptographic proof (once generated)

### 4.2 Community Trust Exploitation
**Threat:** Trusted early member turns adversarial after gaining vouching influence.
**Current Mitigations:**
- Vouch chain analysis (§5.4.3)
- 100-member threshold limits damage during small community
- Challenge mechanism (§8.2)

---

## 5. Testing Cadence

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Automated ledger chain verification | Every commit | CI/CD (future) |
| Manual governance scenario modeling | Before each convention | Internal Advocate |
| Crypto library version audit | Monthly | Genesis Bot |
| External link validation | Weekly | Genesis Bot |
| Full adversarial review | Before each convention | Community |

---

## 6. Known Gaps

| Gap | Severity | Planned Resolution |
|-----|----------|--------------------|
| No key rotation/revocation mechanism | High | Identity Roadmap Phase 2 |
| No IPFS mirror | Medium | Phase 2 deployment |
| No automated CI/CD for ledger verification | Medium | GitHub Actions setup |
| No formal penetration testing | Medium | Community contribution |
| No domain lock verification | Low | Manual check |
| No rate limiting on identity registration | Medium | GitHub Issue workflow provides natural throttling |

---

*This framework is a living document. As new attack vectors are identified, they must be added here. Axiom V demands we never stop questioning our own security.*
