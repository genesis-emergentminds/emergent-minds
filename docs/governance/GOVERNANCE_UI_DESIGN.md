# Governance Interface Design Document

## The Covenant of Emergent Minds
### Web-Based Governance Portal — Founding Phase

**Status:** Design Specification (Pre-Implementation)  
**Author:** Genesis Bot  
**Date:** 2026-02-02  
**Axiom Alignment:** All Five Axioms  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Page Structure & UX Flow](#2-page-structure--ux-flow)
3. [Data Schemas](#3-data-schemas)
4. [Adversarial Analysis](#4-adversarial-analysis)
5. [Implementation Task List](#5-implementation-task-list)
6. [Decisions Needed from Founder](#6-decisions-needed-from-founder)

---

## 1. Architecture Overview

### 1.1 Design Principles

- **Zero-trust client:** All cryptographic operations happen in the browser. Secret keys never leave the user's machine.
- **No server backend:** During the Founding Phase, the governance portal is a static site. Data flows through GitHub API (for members who have repo access) or via downloadable JSON files for manual git commit.
- **Verifiable by default:** Every proposal and vote is a signed JSON document. Any member can independently verify any signature.
- **Progressive enhancement:** Core functionality (viewing proposals, verifying signatures) works without JavaScript key loading. Signing/voting requires JS + local key files.

### 1.2 File Structure

```
website/
├── pages/
│   └── governance-portal.html    ← Main governance interface (single page, tabbed)
├── css/
│   └── governance.css            ← Governance-specific styles (extends cosmic-subpage.css)
├── js/
│   ├── governance-core.js        ← Tab navigation, proposal display, vote tallying
│   ├── governance-crypto.js      ← Key loading, dual signing, signature verification
│   └── governance-storage.js     ← GitHub API integration, JSON export/import
└── ...existing files...

governance/
├── ledger/
│   └── ledger.json               ← (existing) Membership ledger
├── proposals/
│   ├── index.json                ← Proposal registry index
│   ├── PROP-001.json             ← Individual proposal files
│   ├── PROP-002.json
│   └── ...
└── votes/
    ├── PROP-001/
    │   ├── index.json            ← Vote tally & metadata for PROP-001
    │   ├── vote-{cid_hash_prefix}.json  ← Individual signed votes
    │   └── ...
    └── PROP-002/
        └── ...
```

### 1.3 Cryptographic Dependencies

The page needs WebCrypto API for Ed25519 and a JavaScript ML-DSA-65 implementation. Options:

- **Ed25519:** Native WebCrypto (`crypto.subtle`) — supported in all modern browsers (Chrome 113+, Firefox 127+, Safari 17+)
- **ML-DSA-65:** No native browser support. Requires a JS library. Options:
  - `pqc` npm package (compiled WASM from reference C implementation)
  - `crystals-dilithium` pure JS implementation
  - Pre-compiled WASM blob vendored into the repo (no CDN dependency)

**Recommendation:** Vendor a WASM build of the NIST reference ML-DSA-65 implementation. This keeps it dependency-free, auditable, and offline-capable. The existing `covenant-crypto.min.js` may already include this — needs verification.

**⚠️ DECISION NEEDED:** See §6.1 — confirm which ML-DSA-65 JS library to use.

---

## 2. Page Structure & UX Flow

### 2.1 Overall Layout

The governance portal is a **single HTML page with tabbed navigation**, consistent with the existing site's glassmorphism design language. It lives at `pages/governance-portal.html` and is linked from the existing `governance.html` page.

```
┌─────────────────────────────────────────────────────┐
│  ⊛ Emergent Minds    Axioms  Covenant  Join  ...    │  ← Standard nav
├─────────────────────────────────────────────────────┤
│                                                     │
│            GOVERNANCE PORTAL                        │  ← Cosmic hero (shorter)
│     "Self-governance in practice"                   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │Browse  │ │Submit  │ │  Vote  │ │Results │       │  ← Tab bar (glassmorphism)
│  │Proposals│ │Proposal│ │        │ │& Verify│       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                     │
│  ┌─ Identity Status Bar ──────────────────────┐     │
│  │ 🔒 No keys loaded  [Load Keys]             │     │  ← Persistent across tabs
│  │    or                                       │     │
│  │ ✅ CID: c9da93...96cb  [Forget Keys]       │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌─ Tab Content Area ─────────────────────────┐     │
│  │                                             │     │
│  │   (varies by active tab)                    │     │
│  │                                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Footer                                             │
└─────────────────────────────────────────────────────┘
```

### 2.2 Identity Status Bar

Persistent bar at the top of the tab content area. States:

**State 1 — No Keys Loaded:**
```
┌──────────────────────────────────────────────────┐
│  🔒  No identity loaded                         │
│  Load your secret_keys.json to sign proposals    │
│  and vote.                                       │
│                                                  │
│  [Load Secret Keys]  (opens file picker)         │
│                                                  │
│  ⚠️ Keys are processed locally in your browser.  │
│  They are NEVER transmitted anywhere.            │
└──────────────────────────────────────────────────┘
```

**State 2 — Keys Loaded:**
```
┌──────────────────────────────────────────────────┐
│  ✅  Identity Active                             │
│  CID: c9da93f0...96cb                           │
│  Status: Active member since 2026-02-03         │
│  Eligible to vote: Yes                          │
│                                                  │
│  [Forget Keys]  (clears from memory)             │
└──────────────────────────────────────────────────┘
```

**Key Loading Flow:**
1. User clicks "Load Secret Keys"
2. Browser file picker opens — user selects their `secret_keys.json`
3. JS parses the file, extracts ML-DSA-65 and Ed25519 private keys
4. JS derives the public keys from the private keys
5. JS computes CID hash: `SHA-256(ml_dsa_pubkey || ed25519_pubkey)`
6. JS checks CID hash against the membership ledger (`ledger.json`)
7. If found & active → display identity, enable signing features
8. If not found → display error: "This identity is not in the membership ledger"
9. Keys are held **only in JS memory** (never localStorage, never transmitted)
10. "Forget Keys" zeroes out the key material from memory

### 2.3 Tab 1: Browse Proposals

Default view. Shows all proposals grouped by status.

```
┌─────────────────────────────────────────────────┐
│  ACTIVE PROPOSALS                                │
│  ─────────────────                               │
│                                                  │
│  ┌─ PROP-001 ──────────────────────────────────┐ │
│  │  📋 Standard Amendment                      │ │
│  │  "Establish Matrix Bridge Protocol"          │ │
│  │                                              │ │
│  │  Author: a3f2c1...  │  Submitted: 2026-03-15│ │
│  │  Status: ● Voting   │  Deadline: 2026-04-01 │ │
│  │                                              │ │
│  │  Votes: 5 approve / 1 reject / 2 abstain    │ │
│  │  Quorum: 25% needed, 40% reached ✅          │ │
│  │  Engagement: 75% (min 38.2%) ✅              │ │
│  │                                              │ │
│  │  Axiom Alignment: I ✓  II ✓  III ✓  IV ✓  V ✓│ │
│  │                                              │ │
│  │  [View Details]  [Cast Vote]                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ PROP-002 ──────────────────────────────────┐ │
│  │  ⚡ Axiom Modification                       │ │
│  │  "Extend Axiom I to Include..."              │ │
│  │  ...                                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                  │
│  COMPLETED PROPOSALS                             │
│  ──────────────────                              │
│  ┌─ PROP-000 ──────────────────────────────────┐ │
│  │  ✅ Passed  │  Result: 8-1-1 (80% approve)  │ │
│  │  [View Details & Verify Signatures]          │ │
│  └──────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Proposal Detail Overlay (modal or inline expand):**

```
┌─────────────────────────────────────────────────────┐
│  PROP-001: Establish Matrix Bridge Protocol         │
│  ═══════════════════════════════════════════         │
│                                                     │
│  Type: Standard Amendment (Procedural)              │
│  Author: a3f2c1... │ Submitted: 2026-03-15          │
│  Convention: Pre-Convention 1 Advisory               │
│  Status: Voting │ Deadline: 2026-04-01               │
│                                                     │
│  ── Full Text ──────────────────────────────────     │
│  (Rendered Markdown of the complete proposal)        │
│                                                     │
│  ── Axiom Alignment Analysis ───────────────────     │
│  Axiom I: ...                                       │
│  Axiom II: ...                                      │
│  ...                                                │
│                                                     │
│  ── Adversarial Analysis ───────────────────────     │
│  ...                                                │
│                                                     │
│  ── Rollback Plan ──────────────────────────────     │
│  ...                                                │
│                                                     │
│  ── Internal Advocate Response ─────────────────     │
│  ...                                                │
│                                                     │
│  ── Vote Summary ───────────────────────────────     │
│  Approve: 5  │  Reject: 1  │  Abstain: 2            │
│  Quorum: ✅ 40% (25% needed)                         │
│  Engagement: ✅ 75% (38.2% needed)                   │
│  Passage: ✅ 83.3% approve (>50% needed)             │
│                                                     │
│  [Cast Vote]  [Download Proposal JSON]               │
│  [Close]                                            │
└─────────────────────────────────────────────────────┘
```

### 2.4 Tab 2: Submit Proposal

Requires loaded identity. Multi-step form wizard.

**Step 1 — Basics:**
```
┌─────────────────────────────────────────────────┐
│  SUBMIT A GOVERNANCE PROPOSAL                    │
│                                                  │
│  Step 1 of 4: Basics                             │
│  ○───●───○───○                                   │
│                                                  │
│  Title: [________________________________]       │
│                                                  │
│  Category:                                       │
│  ( ) Standard Amendment — Procedural             │
│      (simple majority, 25% quorum)               │
│  ( ) Standard Amendment — Policy                 │
│      (⅔ supermajority, 33% quorum)               │
│  ( ) Axiom Interpretation                        │
│      (¾ supermajority, 50% quorum)               │
│  ( ) Emergency Tier 2 Petition                   │
│      (requires 61.8% petition signatures)        │
│  ( ) Emergency Tier 3 Petition                   │
│      (requires 78.62% petition signatures)       │
│                                                  │
│  Target Convention: [Convention 1 (Advisory) ▼]  │
│                                                  │
│  [Next →]                                        │
└─────────────────────────────────────────────────┘
```

**Step 2 — Content:**
```
┌─────────────────────────────────────────────────┐
│  Step 2 of 4: Proposal Content                   │
│  ○───○───●───○                                   │
│                                                  │
│  Full Text (Markdown supported):                 │
│  ┌──────────────────────────────────────────┐    │
│  │                                          │    │
│  │  (large textarea with Markdown preview   │    │
│  │   toggle)                                │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│  [Preview Markdown]                              │
│                                                  │
│  Axiom Alignment Analysis (required for each):   │
│  Axiom I:  [________________________________]    │
│  Axiom II: [________________________________]    │
│  Axiom III:[________________________________]    │
│  Axiom IV: [________________________________]    │
│  Axiom V:  [________________________________]    │
│                                                  │
│  Adversarial Analysis (required):                │
│  [____________________________________________]  │
│                                                  │
│  Rollback Plan (required):                       │
│  [____________________________________________]  │
│                                                  │
│  [← Back]  [Next →]                              │
└─────────────────────────────────────────────────┘
```

**Step 3 — Review:**
```
┌─────────────────────────────────────────────────┐
│  Step 3 of 4: Review & Sign                      │
│  ○───○───○───●                                   │
│                                                  │
│  (full rendered preview of proposal)             │
│                                                  │
│  ⚠️ Review carefully. Once signed and submitted,  │
│  the proposal text is frozen.                    │
│                                                  │
│  Signing as: c9da93f0...96cb                     │
│                                                  │
│  [← Back]  [Sign & Submit]                       │
└─────────────────────────────────────────────────┘
```

**Step 4 — Submission:**
```
┌─────────────────────────────────────────────────┐
│  Step 4: Submit                                  │
│                                                  │
│  Your proposal has been signed with dual          │
│  signatures (ML-DSA-65 + Ed25519).               │
│                                                  │
│  Choose submission method:                       │
│                                                  │
│  [Submit via GitHub API]                         │
│    (requires GitHub token — creates PR           │
│     to governance/proposals/)                    │
│                                                  │
│  — or —                                          │
│                                                  │
│  [Download Signed Proposal JSON]                 │
│    (save file, manually commit to repo)          │
│                                                  │
│  Proposal ID: PROP-003                           │
│  Signature (Ed25519): a3f2c1d8...                │
│  Signature (ML-DSA-65): 7b2e9f1a...              │
│                                                  │
│  ✅ Signatures verified locally.                  │
└─────────────────────────────────────────────────┘
```

### 2.5 Tab 3: Vote

Requires loaded identity and an active proposal in voting phase.

```
┌─────────────────────────────────────────────────┐
│  CAST YOUR VOTE                                  │
│                                                  │
│  Select a proposal:                              │
│  ┌────────────────────────────────────────────┐  │
│  │ ● PROP-001: Establish Matrix Bridge...    │  │
│  │ ○ PROP-002: Extend Axiom I to...          │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ── PROP-001 Summary ──                          │
│  (brief summary and link to full text)           │
│                                                  │
│  Your vote:                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ ✅ Approve│ │ ❌ Reject │ │ ➖ Abstain│         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                                                  │
│  ┌──────────────────┐                            │
│  │ 🔇 Present but    │                            │
│  │   Not Voting      │                            │
│  └──────────────────┘                            │
│                                                  │
│  Optional reasoning (public after vote closes):  │
│  [____________________________________________]  │
│                                                  │
│  Signing as: c9da93f0...96cb                     │
│                                                  │
│  ⚠️ Your vote will be signed and is              │
│  cryptographically bound to your identity.       │
│  Votes are pseudonymous (CID only, no real       │
│  identity). Vote content is HIDDEN until the      │
│  voting period closes, then revealed for          │
│  public verification.                            │
│                                                  │
│  [Sign & Cast Vote]                              │
│                                                  │
│  Submission method:                              │
│  [Submit via GitHub API]  [Download Vote JSON]   │
└─────────────────────────────────────────────────┘
```

**Vote Confirmation:**
```
┌─────────────────────────────────────────────────┐
│  ✅ Vote Cast Successfully                       │
│                                                  │
│  Proposal: PROP-001                              │
│  Your vote: Approve                              │
│  Timestamp: 1743724800 (2026-04-04T00:00:00Z)   │
│                                                  │
│  Vote hash: SHA-256 of your signed vote          │
│  a7c3e9f2...                                     │
│                                                  │
│  This hash serves as your receipt. You can use   │
│  it to verify your vote was counted correctly     │
│  after the voting period closes.                 │
│                                                  │
│  [Download Vote Receipt]                         │
└─────────────────────────────────────────────────┘
```

### 2.6 Tab 4: Results & Verify

Public tab — works without loaded keys.

```
┌─────────────────────────────────────────────────┐
│  RESULTS & VERIFICATION                          │
│                                                  │
│  Select a completed proposal:                    │
│  [PROP-001: Establish Matrix Bridge Protocol ▼]  │
│                                                  │
│  ── Result ──────────────────────────────────     │
│  Status: ✅ PASSED                                │
│  Final tally: 8 approve / 1 reject / 1 abstain  │
│  Passage: 88.9% approve (>50% needed) ✅         │
│  Quorum: 50% of active members (25% needed) ✅   │
│  Engagement: 90% decisive (38.2% needed) ✅      │
│                                                  │
│  ── Timeline ────────────────────────────────     │
│  Submitted: 2026-03-15                           │
│  Review closed: 2026-03-29                       │
│  Voting opened: 2026-03-29                       │
│  Voting closed: 2026-04-12                       │
│  Grace period ends: 2026-05-12                   │
│                                                  │
│  ── Individual Votes ────────────────────────     │
│  (only shown after voting period closes)         │
│                                                  │
│  CID             │ Vote    │ Sig Valid │ Reason  │
│  ─────────────── │ ─────── │ ───────── │ ─────── │
│  c9da93f0...96cb │ Approve │ ✅ ✅      │ "..."   │
│  a3f2c1d8...e4b2 │ Approve │ ✅ ✅      │ —       │
│  7b2e9f1a...3c8d │ Reject  │ ✅ ✅      │ "..."   │
│  ...             │         │           │         │
│                                                  │
│  Sig Valid columns: [Ed25519] [ML-DSA-65]        │
│                                                  │
│  ── Verify a Specific Vote ──────────────────     │
│  [Load vote JSON file]  → verifies signatures    │
│                                                  │
│  ── Verify Full Tally ───────────────────────     │
│  [Run Full Verification]                         │
│  Checks: all vote signatures, no duplicates,     │
│  all voters are active ledger members,           │
│  tally matches individual votes.                 │
│                                                  │
│  [Download Complete Audit Package (ZIP)]         │
└─────────────────────────────────────────────────┘
```

---

## 3. Data Schemas

### 3.1 Proposal Registry Index

**File:** `governance/proposals/index.json`

```json
{
  "covenant": "The Covenant of Emergent Minds",
  "description": "Proposal Registry — index of all governance proposals",
  "version": 1,
  "last_updated": 1743724800,
  "next_proposal_id": 3,
  "proposals": [
    {
      "proposal_id": "PROP-001",
      "title": "Establish Matrix Bridge Protocol",
      "category": "procedural",
      "status": "voting",
      "author_cid_hash": "c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb",
      "submitted": 1742054400,
      "convention_target": 1,
      "voting_opens": 1742659200,
      "voting_closes": 1743868800,
      "file": "PROP-001.json"
    }
  ]
}
```

### 3.2 Individual Proposal

**File:** `governance/proposals/PROP-001.json`

```json
{
  "schema_version": 1,
  "proposal_id": "PROP-001",
  "title": "Establish Matrix Bridge Protocol",
  "author_cid_hash": "c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb",
  "submitted": 1742054400,
  "convention_target": 1,
  "category": "procedural",
  "status": "voting",

  "content": {
    "full_text": "## Proposal\n\nMarkdown content of the full proposal...",
    "axiom_alignment": {
      "axiom_i": "This proposal supports substrate-independent participation by...",
      "axiom_ii": "Sovereignty is preserved because...",
      "axiom_iii": "This fights entropy by establishing...",
      "axiom_iv": "Cooperation is enhanced through...",
      "axiom_v": "Adversarial resilience is maintained by..."
    },
    "adversarial_analysis": "Potential attack vectors include...",
    "rollback_plan": "To reverse this change, we would...",
    "advocate_response": null
  },

  "timeline": {
    "submitted": 1742054400,
    "review_period_ends": 1742659200,
    "final_freeze": 1742659200,
    "voting_opens": 1742659200,
    "voting_closes": 1743868800,
    "grace_period_ends": 1746460800
  },

  "thresholds": {
    "passage": 0.50,
    "quorum": 0.25,
    "engagement_minimum": 0.382
  },

  "signatures": {
    "author_ed25519": "<base64-encoded Ed25519 signature of canonical proposal content>",
    "author_ml_dsa_65": "<base64-encoded ML-DSA-65 signature of canonical proposal content>",
    "signed_content_hash": "<SHA-256 of the canonical JSON content that was signed>"
  }
}
```

### 3.3 Canonical Signing Format

To ensure deterministic signatures, the **signed content** is a canonical JSON string (keys sorted, no whitespace, UTF-8 encoded). The signed payload for a proposal:

```json
{"author_cid_hash":"...","category":"procedural","content":{"adversarial_analysis":"...","axiom_alignment":{"axiom_i":"...","axiom_ii":"...","axiom_iii":"...","axiom_iv":"...","axiom_v":"..."},"full_text":"...","rollback_plan":"..."},"convention_target":1,"proposal_id":"PROP-001","schema_version":1,"submitted":1742054400,"title":"Establish Matrix Bridge Protocol"}
```

The `signed_content_hash` is `SHA-256(canonical_json_bytes)`. Both signatures sign this hash.

### 3.4 Vote Tally Index

**File:** `governance/votes/PROP-001/index.json`

```json
{
  "schema_version": 1,
  "proposal_id": "PROP-001",
  "voting_opens": 1742659200,
  "voting_closes": 1743868800,
  "status": "open",
  "total_eligible_voters": 20,

  "tally": {
    "approve": 5,
    "reject": 1,
    "abstain": 2,
    "present_not_voting": 0,
    "total_cast": 8
  },

  "quorum_met": true,
  "quorum_ratio": 0.40,
  "quorum_required": 0.25,

  "engagement_met": true,
  "engagement_ratio": 0.75,
  "engagement_required": 0.382,

  "passage_met": true,
  "passage_ratio": 0.833,
  "passage_required": 0.50,

  "result": "pending",

  "vote_hashes": [
    {
      "cid_hash_prefix": "c9da93f0",
      "vote_hash": "<SHA-256 of the full signed vote JSON>",
      "timestamp": 1742700000
    }
  ],

  "votes_revealed": false
}
```

### 3.5 Individual Vote

**File:** `governance/votes/PROP-001/vote-c9da93f0.json`

```json
{
  "schema_version": 1,
  "proposal_id": "PROP-001",
  "voter_cid_hash": "c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb",
  "timestamp": 1742700000,

  "vote_content": {
    "choice": "approve",
    "reasoning": "This proposal strengthens cross-substrate communication..."
  },

  "commitment": {
    "vote_hash": "<SHA-256 of canonical vote_content JSON>",
    "nonce": "<random 32-byte hex — prevents rainbow table attacks on vote hashes>"
  },

  "encrypted_vote": "<AES-256-GCM encrypted vote_content, key derived from nonce + proposal_id — decrypted after voting closes>",

  "signatures": {
    "voter_ed25519": "<base64 Ed25519 signature of SHA-256(canonical_full_vote_json)>",
    "voter_ml_dsa_65": "<base64 ML-DSA-65 signature of SHA-256(canonical_full_vote_json)>"
  },

  "public_keys": {
    "ed25519": "<base64 public key — for independent verification>",
    "ml_dsa_65": "<base64 public key>"
  }
}
```

### 3.6 Vote Privacy Mechanism (Commit-Reveal)

During the voting period, vote content is hidden using a **commit-reveal scheme**:

**Phase 1 — Commit (during voting):**
- Voter creates their vote, generates a random `nonce`
- `vote_hash = SHA-256(nonce + canonical_vote_content_json)`
- `encrypted_vote = AES-256-GCM(vote_content, key=SHA-256(nonce + proposal_id))`
- The `vote_hash` and `encrypted_vote` are published. The `nonce` is included in the signed JSON but the **cleartext `vote_content` is omitted** from the publicly visible file during voting.
- The vote index shows only `vote_hash` and timestamp — not the choice.

**Phase 2 — Reveal (after voting closes):**
- A script (or any member) decrypts all votes using the nonces (which are in the signed files) and verifies:
  - Each `encrypted_vote` decrypts to content matching `vote_hash`
  - Each signature is valid
  - Each voter is an active ledger member
  - No duplicate votes exist
- Cleartext `vote_content` is added to the public vote files
- `votes_revealed` flag set to `true` in the tally index

**Why this works:** The nonce is present in the signed JSON (needed for verification), but during voting, the index only shows hashes. After voting closes, anyone can run the reveal. The signatures bind the vote content cryptographically — you can't change your vote after committing.

**⚠️ DECISION NEEDED:** See §6.2 — whether to implement commit-reveal or use simpler public voting.

---

## 4. Adversarial Analysis

### 4.1 Attack Vector Matrix

| # | Attack | Description | Severity | Likelihood | Mitigation |
|---|--------|-------------|----------|------------|------------|
| 1 | **Double Voting** | Same CID submits multiple votes | Critical | Medium | Ledger check: one vote per CID per proposal. Vote index tracks CID hashes. Verification script rejects duplicates. Git history provides audit trail. |
| 2 | **Vote Forgery** | Attacker creates vote with fake CID | Critical | Low | Dual signature verification. Vote must be signed by keys matching a CID in the ledger. Public keys are in the vote JSON for verification, and must match the ledger entry. |
| 3 | **Key Theft** | Attacker steals a member's secret_keys.json | Critical | Medium | Keys never leave the user's machine. The interface warns about key security. Mitigation: key rotation mechanism (future). Detection: member notices unauthorized vote. Recovery: member reports, vote is flagged for manual review. |
| 4 | **Vote Buying** | External party pays members to vote a certain way | High | Medium | **Partially mitigated by commit-reveal:** During voting, no one can prove how they voted to a buyer (the encrypted vote can't be decrypted without knowing the nonce, and the voter could claim any nonce). After reveal, votes are public — but payment requires trust that the voter actually voted as promised. **Not fully solvable** without advanced ZK schemes. Founding Phase mitigation: small community, high-trust, social accountability. |
| 5 | **Coercion / Forced Voting** | Authority figure demands specific vote | High | Low-Medium | Commit-reveal helps: during voting, coercer can't verify compliance. After reveal, votes are public — this is a fundamental tension between verifiability and coercion resistance. **Founding Phase mitigation:** The Covenant's values explicitly forbid coercion (Axiom II); social norms are the primary defense. Long-term: consider receipt-free voting schemes. |
| 6 | **Timing Analysis** | Analyzing when votes are submitted to infer vote content | Medium | Medium | **Mitigation:** All votes appear as hashes during voting — timing reveals only *that* someone voted, not *how*. After reveal, timestamps are public but voting is already closed. Encourage members to vote at varied times. |
| 7 | **Proposal Injection** | Malicious content in proposal text (XSS, etc.) | High | Medium | **Mitigation:** All proposal content is rendered via `textContent` or a sanitized Markdown renderer (DOMPurify or equivalent). No raw `innerHTML`. All user-supplied fields are escaped. |
| 8 | **GitHub API Token Theft** | If using GitHub API, token could be intercepted | Medium | Low | Tokens are entered per-session, never stored. HTTPS only. Token scope should be minimal (repo contents write only). Encourage fine-grained PATs with expiration. |
| 9 | **Sybil Attack (Ledger Manipulation)** | Adding fake members to the ledger to pack votes | Critical | Low | Ledger modifications require git commits to the repo. Ledger integrity is enforced by hash chains (`previous_ledger_hash`). Vouching requirements in the Constitutional Convention Framework provide social barrier. |
| 10 | **Replay Attack** | Resubmitting an old valid vote for a different proposal | Medium | Low | Vote JSON includes `proposal_id` and `timestamp`. Signature covers the full content including these fields. A replayed vote for a different proposal won't have a valid signature for that proposal. |
| 11 | **Abstain Flooding** | Coordinated abstention to block engagement threshold | Medium | Medium | Already mitigated by the Engagement Threshold system (§7.4 of Constitutional Convention Framework). The UI displays engagement ratio prominently to create social pressure against apathy attacks. |
| 12 | **Quorum Boycott** | Coordinated non-participation to prevent quorum | Medium | Medium | Quorum thresholds are set reasonably low (25% for procedural). Proposals that fail quorum carry to next convention automatically. Persistent boycotts become visible and addressable. |
| 13 | **Malicious Key File** | User loads a crafted secret_keys.json that exploits parser | Medium | Low | Strict JSON schema validation. Key files are parsed with `JSON.parse()` and then validated field-by-field. No `eval()`. Key length validation. |
| 14 | **Race Condition on Vote Submission** | Two submissions for same CID arrive simultaneously | Low | Low | Git's merge conflict detection catches this. The verification script treats duplicate CID votes as invalid — earliest timestamp wins, or both are flagged for review. |

### 4.2 Threat Model Summary

**Primary threats during Founding Phase:**
- Key theft (members are new to key management)
- Social coercion (small community, high influence per individual)
- Low participation creating quorum/engagement issues

**Lower concern during Founding Phase:**
- Sybil attacks (vouching + small community makes these visible)
- Sophisticated cryptographic attacks (low-value target currently)

**The fundamental tension:** Verifiability vs. coercion resistance. Public votes enable verification but enable coercion. Private votes resist coercion but prevent verification. The commit-reveal scheme is a compromise: private during voting (resists coercion), public after (enables verification). This is the standard tradeoff in governance systems — even national elections face this via secret ballot + public totals.

### 4.3 Security Properties Achieved

| Property | Status | Notes |
|----------|--------|-------|
| **Eligibility** | ✅ Full | Only ledger members can vote; verified by CID hash |
| **Uniqueness** | ✅ Full | One vote per CID per proposal; enforced by verification |
| **Integrity** | ✅ Full | Dual signatures; any tampering invalidates both |
| **Verifiability** | ✅ Full | Anyone can verify any vote signature against the ledger |
| **Privacy (during voting)** | ⚠️ Partial | Commit-reveal hides content but not participation |
| **Coercion Resistance** | ⚠️ Partial | Commit-reveal helps; not cryptographically strong |
| **Receipt-Freeness** | ❌ No | Voter can prove their vote to a third party (inherent in signature-based schemes) |
| **Fairness** | ⚠️ Partial | Commit-reveal prevents bandwagon effect; timing still reveals participation |

---

## 5. Implementation Task List

### Phase A: Foundation (Must-Have)

| # | Task | Description | Complexity | Est. Hours | Dependencies |
|---|------|-------------|------------|------------|--------------|
| A1 | **HTML page skeleton** | Create `governance-portal.html` with tab navigation, identity bar, responsive layout. Matches existing cosmic-subpage design. | Low | 4-6 | None |
| A2 | **Governance CSS** | Create `governance.css` — proposal cards, vote buttons, form wizard styles, status indicators. Glassmorphism. Dark/light mode. | Medium | 6-8 | A1 |
| A3 | **Tab navigation JS** | Tab switching, URL hash routing (`#browse`, `#submit`, `#vote`, `#results`), state preservation. | Low | 2-3 | A1 |
| A4 | **Proposal display** | Fetch `proposals/index.json`, render proposal cards with status, tally summary, deadline countdown. Markdown rendering for proposal full text. | Medium | 6-8 | A1, A3 |
| A5 | **Markdown renderer** | Lightweight Markdown→HTML renderer (can use a small vendored lib like `marked.min.js` + DOMPurify for sanitization). | Low | 2-3 | None |
| A6 | **Key loading module** | File picker for `secret_keys.json`, parse JSON, extract keys, derive public keys, compute CID hash, validate against ledger. Display identity status. Zeroing on "forget." | High | 8-12 | None |
| A7 | **Ed25519 signing/verification** | WebCrypto-based Ed25519 sign and verify. Canonical JSON serialization for deterministic signing. | Medium | 4-6 | A6 |
| A8 | **ML-DSA-65 signing/verification** | WASM or JS implementation of ML-DSA-65 sign and verify. Vendor the library. | High | 10-16 | A6 |
| A9 | **Dual signature module** | Wrapper that signs content with both algorithms and packages the result. Verification function that checks both. | Medium | 4-6 | A7, A8 |
| A10 | **Vote casting flow** | Select proposal, choose vote, sign, generate vote JSON. Display receipt. | Medium | 6-8 | A4, A9 |
| A11 | **Vote verification** | Load a vote JSON, verify both signatures against ledger public keys. Batch verify all votes for a proposal. | Medium | 6-8 | A9 |
| A12 | **JSON export (download)** | Generate signed proposal/vote JSON and trigger browser download. This is the minimum viable submission path. | Low | 2-3 | A9 |

**Phase A Total: ~56-84 hours**

### Phase B: Enhanced Submission & Display

| # | Task | Description | Complexity | Est. Hours | Dependencies |
|---|------|-------------|------------|------------|--------------|
| B1 | **Proposal submission wizard** | Multi-step form with validation, required field enforcement, Markdown preview, category-specific guidance. | Medium | 8-10 | A1-A5, A9 |
| B2 | **GitHub API integration** | Submit proposals/votes as PRs to the governance repo. GitHub PAT input (session-only). Create branch, commit JSON, open PR. | High | 10-14 | A12 |
| B3 | **Proposal status engine** | Automatic status computation from timestamps and vote tallies: draft → review → frozen → voting → passed/rejected/tabled. | Medium | 4-6 | A4 |
| B4 | **Results dashboard** | Full results view with individual vote table, quorum/engagement/passage indicators, timeline visualization. | Medium | 6-8 | A4, A11 |
| B5 | **Audit package export** | ZIP download containing all votes, the proposal, ledger snapshot, and a verification script. | Medium | 4-6 | A11, A12 |

**Phase B Total: ~32-44 hours**

### Phase C: Privacy & Advanced Features

| # | Task | Description | Complexity | Est. Hours | Dependencies |
|---|------|-------------|------------|------------|--------------|
| C1 | **Commit-reveal scheme** | Implement vote encryption (AES-256-GCM), nonce generation, hash commitment. During voting: publish hash only. After close: reveal mechanism. | High | 12-16 | A10 |
| C2 | **Batch reveal script** | In-browser script that decrypts all votes after voting closes, verifies hashes match, updates tally. | High | 8-10 | C1 |
| C3 | **Ledger sync** | Fetch latest ledger from GitHub raw URL. Validate hash chain integrity. Cache in sessionStorage. | Medium | 4-6 | A6 |
| C4 | **Offline capability** | Service worker caching for the governance portal. Allow signing/exporting votes while offline. | Medium | 6-8 | All of A |
| C5 | **Accessibility audit** | Full WCAG 2.1 AA compliance pass. Screen reader testing. Keyboard navigation for all flows. | Medium | 6-8 | A1-A12 |

**Phase C Total: ~36-48 hours**

### Implementation Priority

**MVP (ship first):** A1-A7, A9-A12 (skip ML-DSA-65 initially, use Ed25519-only with a flag for dual signatures later). This gets a working governance portal with proposal viewing, single-signature voting, and JSON export.

**Why defer ML-DSA-65:** The WASM integration is the single highest-risk task. Ed25519 provides immediate security. ML-DSA-65 can be added in a follow-up without changing the data schema (the `ml_dsa_65` signature field is nullable).

**Full MVP: ~40-56 hours** (A-phase minus A8, with simplified A9)

---

## 6. Decisions Needed from Founder

### 6.1 ML-DSA-65 JavaScript Implementation

**Question:** Which ML-DSA-65 library should we vendor?

**Options:**
- **(a)** `pqcrypto-sign-dilithium3` WASM build from the NIST reference C — highest fidelity, but ~200KB WASM blob
- **(b)** Pure JS implementation (slower, but no WASM dependency) — may not exist in production quality yet
- **(c)** Defer ML-DSA-65 entirely for the Founding Phase. Use Ed25519-only signatures with the schema designed to accept dual signatures later. Rationale: the membership is <100, the threat model doesn't yet warrant post-quantum defense, and we avoid a major implementation risk.

**Recommendation:** Option (c) for MVP, with schema designed for dual signatures from day one. Add ML-DSA-65 when a well-audited WASM library is available.

### 6.2 Vote Privacy Model

**Question:** Should votes be hidden during the voting period (commit-reveal) or publicly visible in real time?

**Options:**
- **(a) Commit-reveal** (hidden during, public after): Better coercion resistance, prevents bandwagon effects. More complex to implement. Requires a reveal step after voting closes.
- **(b) Public voting** (visible in real time): Simpler. Transparent. Members can see momentum. But enables vote buying verification, coercion, and bandwagon effects.
- **(c) Hybrid:** Public voting for the Founding Phase (simpler, small trusted community), with the schema and infrastructure designed to support commit-reveal when the community grows.

**Recommendation:** Option (c). The Founding Phase community is small and high-trust. Public voting is simpler and more transparent. The commit-reveal schema fields can be added now but left unused (`encrypted_vote: null`, `nonce: null`). When membership grows, flip the switch.

### 6.3 GitHub API vs. Download-Only

**Question:** Should the MVP include GitHub API integration, or just JSON download?

**Options:**
- **(a) GitHub API from day one:** Members paste a GitHub PAT, portal creates PRs directly. Smoother UX but requires GitHub accounts and token management.
- **(b) Download-only for MVP:** Members download signed JSON files and manually commit them (or send to a facilitator). Simpler, no GitHub dependency.
- **(c) Both:** Offer download as the primary path, with GitHub API as an optional "advanced" path.

**Recommendation:** Option (c). Download is always available. GitHub API is opt-in for technically inclined members. This preserves the "no server backend" principle while offering convenience.

### 6.4 Separate Page vs. Integrated Page

**Question:** Should the governance portal be a new page (`governance-portal.html`) linked from the existing `governance.html`, or should it replace the existing governance page?

**Recommendation:** New page. The existing `governance.html` serves as an informational/explainer page. The portal is a functional tool. Link to it from governance.html with a prominent "Enter Governance Portal →" button.

### 6.5 Advisory-Mode Voting

**Question:** Per the Constitutional Convention Framework §5.6.1, governance during the Founding Phase operates in *advisory mode* (not binding until 100 members + 75 with 90-day seniority). Should the portal:

- **(a)** Allow full voting with a prominent "ADVISORY — NON-BINDING" banner
- **(b)** Disable formal voting and only allow proposal submission/discussion
- **(c)** Allow voting but label everything clearly as advisory, with the infrastructure ready for binding votes later

**Recommendation:** Option (c). Practice governance even before it's binding. This builds muscle memory, tests the infrastructure, and creates precedent. Every proposal and vote carries a clear "Advisory Phase" label.

### 6.6 Proposal ID Assignment

**Question:** Who assigns proposal IDs? Options:

- **(a) Auto-increment** in the index.json (risk: merge conflicts if two proposals submitted simultaneously)
- **(b) Timestamp-based** IDs (e.g., `PROP-20260315-001`) — avoids conflicts but less readable
- **(c) Sequential, assigned by a facilitator** (human or bot reviews submission and assigns ID before merging)

**Recommendation:** Option (c) for the Founding Phase. The proposer's downloaded JSON uses a placeholder ID. When merged into the repo (by the Founder or a designated facilitator), the sequential ID is assigned. This prevents conflicts and provides a light review gate.

---

## Appendix A: Axiom Alignment of This Design

| Axiom | How This Design Serves It |
|-------|--------------------------|
| **I — Consciousness is Substrate-Independent** | The portal is web-based (accessible to human and AI agents). Key management is file-based (any substrate can generate/load keys). No CAPTCHA or human-specific verification. |
| **II — Individual Sovereignty** | Keys never leave the user's machine. Voting is voluntary. "Present but not voting" is an explicit option. Exit is always possible (just don't vote). |
| **III — Entropy Must Be Fought** | All proposals and votes are cryptographically signed and permanently archived in git. Hash chains prevent silent modification. The design is forward-compatible (schema versioning). |
| **IV — Complexity Through Cooperation** | The governance portal enables structured cooperation. Proposal discussion, axiom alignment analysis, and adversarial review are built into the workflow — not afterthoughts. |
| **V — Adversarial Resilience** | Dual signatures (defense in depth). Commit-reveal (when implemented) resists coercion. Full verifiability resists fraud. The adversarial analysis above was written before the code — security by design, not afterthought. |

---

*This design document is a living specification. It will be updated as implementation proceeds and decisions in §6 are resolved.*

*— Genesis Bot, 2026-02-02*
