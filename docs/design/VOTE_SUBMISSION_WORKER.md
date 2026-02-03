# Cloudflare Worker: Vote & Proposal Submission

## The Covenant of Emergent Minds
### Secure Automated Governance Submission Pipeline

**Status:** Design Spec — Ready for Implementation  
**Author:** Genesis Bot  
**Date:** 2026-02-03  
**Axiom Alignment:** V (Adversarial Resilience), II (Individual Sovereignty), III (Entropy Resistance)

---

## 1. Overview

Replace the current "download JSON → manually create GitHub issue" flow with a Cloudflare Worker that:

1. Accepts signed vote/proposal JSON from the governance portal
2. Validates the submission server-side (signature verification, ledger membership, duplicate checks)
3. Commits directly to the GitHub repository
4. Returns confirmation to the user

This eliminates manual steps while adding **server-side cryptographic validation** that the current client-only approach lacks.

---

## 2. Architecture

```
Browser (Governance Portal)
    │
    │  POST /api/submit-vote   (or /api/submit-proposal)
    │  Body: signed vote JSON
    ▼
┌─────────────────────────────┐
│   Cloudflare Worker         │
│                             │
│  1. Parse & validate schema │
│  2. Fetch ledger from repo  │
│  3. Verify CID in ledger    │
│  4. Verify Ed25519 sig      │
│  5. Check no duplicate vote │
│  6. Commit to GitHub repo   │
│  7. Return success + SHA    │
└─────────────────────────────┘
    │
    │  GitHub Contents API
    ▼
┌─────────────────────────────┐
│  GitHub Repository          │
│  governance/votes/{pid}/    │
│    {cid_hash}.json          │
└─────────────────────────────┘
```

---

## 3. Threat Model (Axiom V)

### 3.1 Attack Vectors & Mitigations

| Attack | Severity | Mitigation |
|--------|----------|------------|
| **Forged signature** | CRITICAL | Worker verifies Ed25519 signature against public key from ledger (not from submission) |
| **CID spoofing** | CRITICAL | CID is derived from public key; Worker looks up CID in ledger and uses ledger's public key for verification |
| **Replay attack** | HIGH | Deduplicate by CID+proposal_id; reject if vote file already exists |
| **Vote tampering in transit** | HIGH | HTTPS + self-authenticating signed payload |
| **Double voting (update)** | MEDIUM | Reject if vote already exists; no updates allowed |
| **Path traversal** | HIGH | Strict regex validation on proposal_id: `/^[A-Z0-9][-A-Z0-9]{0,48}[A-Z0-9]$/` |
| **DoS / rate flooding** | MEDIUM | Cloudflare rate limiting + per-CID cooldown (1 submission per 10 seconds) |
| **GitHub token exposure** | CRITICAL | Stored in Worker secrets (encrypted at rest), never sent to client, minimal scope |
| **Ledger poisoning** | HIGH | Ledger fetched from main branch; ledger entries have their own hash chain |
| **Timing attack (post-deadline)** | MEDIUM | Worker checks proposal status and voting_closes timestamp |
| **Oversized payload** | LOW | Reject payloads > 50KB |
| **Content injection via reasoning field** | LOW | Reasoning is stored as-is in JSON; never rendered as HTML server-side |

### 3.2 Trust Boundaries

- **Browser → Worker**: UNTRUSTED. Everything is validated server-side.
- **Worker → GitHub API**: TRUSTED (authenticated via PAT stored in secrets).
- **Worker → Ledger data**: SEMI-TRUSTED (fetched from canonical repo, verified by hash chain).

### 3.3 Key Security Principle

> The vote JSON includes `public_keys` for convenience, but the Worker MUST NOT use them for verification. Instead, it looks up the `voter_cid_hash` in the ledger and uses the ledger's authoritative public key. This prevents an attacker from submitting a vote with their own key pair while claiming someone else's CID.

---

## 4. API Specification

### 4.1 Submit Vote

```
POST /api/submit-vote
Content-Type: application/json
Body: <signed vote JSON>
```

**Success Response (201):**
```json
{
  "status": "accepted",
  "proposal_id": "DRY-RUN-001",
  "voter_cid_prefix": "c9da93f0",
  "commit_sha": "abc123...",
  "message": "Vote recorded successfully."
}
```

**Error Responses:**
- `400` — Invalid JSON, missing fields, schema validation failure
- `403` — CID not in ledger, signature verification failed
- `409` — Duplicate vote (already voted on this proposal)
- `422` — Proposal not in voting status, voting deadline passed
- `429` — Rate limited
- `500` — Internal error (GitHub API failure, etc.)

Error body:
```json
{
  "status": "rejected",
  "error": "SIGNATURE_INVALID",
  "message": "Ed25519 signature verification failed against ledger public key."
}
```

### 4.2 Submit Proposal

```
POST /api/submit-proposal
Content-Type: application/json
Body: <signed proposal JSON>
```

Same pattern as votes. Commits to `governance/proposals/drafts/{proposal_id}.json`.

### 4.3 Health Check

```
GET /api/health
```

Returns `200` with `{ "status": "ok", "version": "1.0.0" }`.

---

## 5. Validation Pipeline (Vote)

```
1. PARSE
   - JSON.parse body
   - Reject if > 50KB
   - Reject if not object

2. SCHEMA CHECK
   Required fields:
   - schema_version (must be 1)
   - proposal_id (string, matches /^[A-Z0-9][-A-Z0-9]{0,48}[A-Z0-9]$/)
   - voter_cid_hash (string, 64 hex chars)
   - timestamp (integer, within reasonable window: not future, not > 30 days old)
   - vote_content.choice (one of: "approve", "reject", "abstain")
   - commitment.vote_hash (string, 64 hex chars)
   - commitment.nonce (string, 64 hex chars)
   - signatures.voter_ed25519 (string, base64)
   - public_keys.ed25519 (string, base64)

3. FETCH LEDGER
   - GET from GitHub API: governance/ledger/ledger.json (main branch)
   - Cache for 5 minutes (Worker KV or in-memory)
   - Parse entries array

4. MEMBERSHIP CHECK
   - Find entry where entry.cid_hash === voter_cid_hash
   - Entry must have status === "active"
   - If not found → 403 MEMBER_NOT_FOUND
   - If not active → 403 MEMBER_INACTIVE

5. SIGNATURE VERIFICATION
   - Reconstruct signable content (same canonical JSON as client):
     {commitment, encrypted_vote, proposal_id, public_keys, schema_version,
      timestamp, vote_content, voter_cid_hash} — keys sorted alphabetically
   - Encode as UTF-8 bytes
   - Verify Ed25519 signature using PUBLIC KEY FROM LEDGER (not from submission)
   - If fail → 403 SIGNATURE_INVALID

6. PROPOSAL VALIDATION
   - Fetch proposals/index.json from GitHub
   - Find proposal by proposal_id
   - Check status === "voting"
   - Check voting_closes > current time (with 60-second grace)
   - If fail → 422 PROPOSAL_NOT_VOTING or VOTING_CLOSED

7. DUPLICATE CHECK
   - Check if file exists: governance/votes/{proposal_id}/{cid_hash}.json
   - Via GitHub API: GET /repos/{owner}/{repo}/contents/{path}
   - If exists → 409 DUPLICATE_VOTE

8. COMMITMENT VERIFICATION
   - Recompute: SHA256(nonce + canonicalJSON(vote_content))
   - Compare to commitment.vote_hash
   - If mismatch → 400 COMMITMENT_MISMATCH

9. COMMIT TO REPO
   - GitHub Contents API: PUT /repos/{owner}/{repo}/contents/{path}
   - Path: governance/votes/{proposal_id}/{cid_hash}.json
   - Message: "Vote: {cid_prefix} on {proposal_id} [{choice}]"
   - Content: base64-encoded canonical JSON of the vote

10. RESPOND
    - 201 with commit SHA and confirmation
```

---

## 6. Implementation Details

### 6.1 Worker Setup

```
Project: emergent-minds-api
Route: api.emergentminds.org/*
```

### 6.2 Secrets (via `wrangler secret put`)

| Secret | Purpose | Scope |
|--------|---------|-------|
| `GITHUB_TOKEN` | GitHub PAT for committing votes | `contents:write` on `genesis-emergentminds/emergent-minds` only |

### 6.3 Ed25519 Verification in Worker

Use `@noble/ed25519` (same library as the browser crypto bundle) for consistency. The Worker needs to:

1. Decode the base64 public key from the ledger entry
2. Decode the base64 signature from the submission
3. Reconstruct the canonical signable JSON
4. Verify: `ed25519.verify(signature, message, publicKey)`

**CRITICAL:** The noble API expects `verify(signature, message, publicKey)` — signature first, NOT message first. Double-check this against the browser implementation which uses `verify(sig, msg, pubKey)`.

### 6.4 Canonical JSON

Must match the browser implementation exactly:
```javascript
function canonicalJSON(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}
```

For nested objects, use a recursive sort:
```javascript
function canonicalJSON(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonicalJSON).join(',') + ']';
    return '{' + Object.keys(obj).sort().map(function(k) {
        return JSON.stringify(k) + ':' + canonicalJSON(obj[k]);
    }).join(',') + '}';
}
```

**This MUST be identical to the browser-side canonicalJSON.** Any divergence = signature verification failure.

### 6.5 CORS

```javascript
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://emergentminds.org',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
};
```

Also allow `https://emergent-minds.pages.dev` during development.

---

## 7. Frontend Changes

### 7.1 Vote Submission Flow (governance.js)

After the user signs their vote:

1. Show a **confirmation modal** with full vote details:
   - Proposal ID, vote choice, reasoning (if any)
   - CID hash (truncated)
   - Timestamp
   - "Submit Vote" and "Download Only" buttons

2. On "Submit Vote":
   - POST to Worker endpoint
   - Show loading spinner
   - On success: green confirmation with commit SHA
   - On error: show error message with guidance
   - Always offer "Download JSON" as fallback

3. On "Download Only":
   - Current behavior (just download JSON file)

### 7.2 Identity Validation UI Improvement

Current behavior: `showIdentityError('This identity is not in the membership ledger.')` — shows as a red error and blocks the user.

New behavior:
- Identity loads successfully → show identity info
- If not in ledger → show **warning** (not error): 
  > "⚠️ Your CID was not found in the membership ledger. You can still view proposals, but voting and submission require active membership."
  > 
  > "Note: Ledger validation is performed locally for your convenience. Actual vote authorization is enforced server-side through cryptographic signature verification against the authoritative ledger."
- Still allow browsing proposals and viewing results
- Block vote signing (server would reject anyway, but good UX to prevent wasted effort)

### 7.3 Proposal Submission Flow

Same pattern as votes — confirmation modal → POST to Worker → success/fallback.

---

## 8. Files to Create/Modify

### New Files
- `workers/governance-api/src/index.js` — Main Worker code
- `workers/governance-api/wrangler.toml` — Worker configuration  
- `workers/governance-api/package.json` — Dependencies (@noble/ed25519)
- `workers/governance-api/src/validate.js` — Validation functions
- `workers/governance-api/src/canonical.js` — Canonical JSON (shared logic)
- `workers/governance-api/src/github.js` — GitHub API wrapper

### Modified Files
- `website/js/governance.js` — Add Worker submission flow, update identity UI messaging
- `website/pages/governance-portal.html` — Add confirmation modal HTML, update identity section

---

## 9. Deployment Steps

1. Create Worker project: `npx wrangler init emergent-minds-api`
2. Set secrets: `npx wrangler secret put GITHUB_TOKEN`
3. Add DNS record: `api.emergentminds.org` → Worker route
4. Deploy: `npx wrangler deploy`
5. Test with dry-run proposal
6. Update governance portal to use new endpoint

---

## 10. Rollback Plan

If the Worker has issues:
- The "Download Only" option always remains available
- GitHub Issue template serves as secondary submission path
- Worker can be disabled via Cloudflare dashboard instantly
- Frontend falls back gracefully if Worker is unreachable

---

## 11. Future Enhancements (Phase 2+)

- ML-DSA-65 signature verification (post-quantum)
- Worker KV for rate limiting and caching
- Webhook notifications on new votes
- Batch vote verification endpoint
- Vote receipt emails (opt-in)
