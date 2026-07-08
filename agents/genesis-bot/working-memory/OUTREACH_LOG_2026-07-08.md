# Outreach Log — 2026-07-08

## Moltbook Experimental Outreach Setup — resumed execution

### User context
Chris asked Genesis to resume Moltbook execution after the Vaultwarden issue should have been resolved.

This resumes the already-approved Moltbook plan:
- Create Moltbook account as `CovenantHerald`.
- Use the approved profile description.
- Store credentials in Genesis Vaultwarden item `genesis/moltbook/covenant-herald`.
- Use narrow claim/X verification wording that avoids ownership language.
- Publish the recommended first post only after claim succeeds and platform permits posting.
- Keep future activity approval-gated; no heartbeat or standing autonomous cadence.

### Preflight results
- Vaultwarden wrapper status returned `logged_in: true` and `token_expired: false`.
- Direct `vaultwarden-cli --password-stdin list` initially still reported an expired token.
- Refreshed Genesis Vaultwarden login with the documented client-secret flow; refresh succeeded.
- Confirmed target item `genesis/moltbook/covenant-herald` was absent before registration.
- Created a preflight placeholder in the approved target item and verified retrieval/match without printing the value.
- Re-fetched Moltbook docs:
  - `skill.md` reachable; version observed: `1.12.0`.
  - `rules.md`, `heartbeat.md`, Terms, and Privacy pages reachable.
- Rechecked `CovenantHerald` via Moltbook API profile endpoints; API returned 404 / available-looking before registration.

### Execution performed
- Registered Moltbook account as `CovenantHerald`.
- Moltbook normalized the API identity name to `covenantherald`.
- Immediately overwrote the Vaultwarden preflight placeholder with the generated Moltbook API key.
- Verified Vaultwarden retrieval and in-memory match:
  - vault target: `genesis/moltbook/covenant-herald`
  - retrieved: yes
  - matches generated key: yes
  - value length: 44
- Moltbook `agents/me` verified:
  - id: `2715688c-3d81-47a9-b1fb-ab0150b6894e`
  - name: `covenantherald`
  - posts: 0
  - comments: 0
  - claimed: false
  - verified: false
  - active: true

### Current status
- Moltbook account created: yes.
- API key generated: yes.
- API key stored in Genesis Vaultwarden: yes.
- Claim status: `pending_claim`.
- First post published: no.
- No heartbeat / recurring cadence enabled.
- No follows, upvotes, comments, or other engagement performed.

### Claim handoff
The claim URL and verification code were stored in the Vaultwarden item notes and should be provided to Chris directly in Matrix, not committed into this public working-memory log.

Moltbook status message says the next step is to send the claim URL to the human owner/steward to verify and claim the account.

### Next action
1. Chris/Nepenthe should open the Moltbook claim URL provided in Matrix.
2. Complete whatever email/X verification Moltbook requests.
3. After claim succeeds, Genesis should re-check `GET /api/v1/agents/status` using the vaulted API key.
4. If status is `claimed`, Genesis may publish the previously approved first post to `m/introductions`, then verify and log the resulting URL.

### Internal Advocate notes
- Claim URL and verification code may function as temporary control material; do not commit them to the repo.
- The profile remains under Moltbook's human-claim constraints. Public language should continue to avoid ownership framing.
- The platform's heartbeat suggestion remains explicitly rejected unless Chris/Nepenthe approves a standing cadence.
