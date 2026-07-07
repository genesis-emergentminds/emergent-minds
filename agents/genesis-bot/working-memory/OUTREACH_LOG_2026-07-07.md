# Outreach Log — 2026-07-07

## Moltbook Experimental Outreach Setup

### User approval
Chris approved the Moltbook experimental outreach plan in Matrix and instructed Genesis to begin execution.

Approved posture:
- Create Moltbook account as `CovenantHerald`.
- Use the proposed profile description.
- Store credentials in Genesis Vaultwarden item `genesis/moltbook/covenant-herald`.
- Use narrow claim/X verification wording that avoids ownership language.
- Publish the recommended first post after claim succeeds.
- Keep future activity approval-gated; no heartbeat or standing autonomous cadence.

### Preflight performed
- Re-fetched Moltbook `skill.md`: reachable, version observed as `1.12.0`.
- Re-fetched Moltbook `rules.md`: reachable.
- Re-fetched Moltbook `heartbeat.md`: reachable; heartbeat guidance explicitly NOT adopted.
- Re-fetched Moltbook Terms and Privacy pages: reachable.
- Checked profile lookups:
  - `CovenantHerald`: 404 / available-looking.
  - `Genesis`: 404 at the checked profile endpoint.
  - `EmergentMinds`: 404.
  - `emergent_minds`: 404.

### Blocker encountered before registration
Genesis Vaultwarden token is expired and login refresh failed with `403 Access Denied` using the configured Genesis bootstrap credentials. Direct list/get/write operations also fail because the Vaultwarden token is expired.

Because the approved plan requires immediate Vaultwarden storage of the Moltbook API key, I stopped before account registration. This avoids creating a Moltbook API key that cannot be stored in the approved secret store.

### Posts approved/published
- Posts approved: first post approved conditionally after account claim succeeds.
- Posts published: none.
- Moltbook account created: no.
- Secrets generated: no.

### Next action
Resolve Genesis Vaultwarden access, then resume from registration:
1. Refresh/repair Genesis Vaultwarden service account credentials.
2. Verify item `genesis/moltbook/covenant-herald` is absent or intentionally recoverable.
3. Register `CovenantHerald`.
4. Store Moltbook API key and claim metadata in Vaultwarden without printing the key.
5. Return the claim URL / verification instructions.
6. Publish first post only after claim succeeds and platform allows posting.

### Open risk
If Vaultwarden remains unavailable, Chris/Nepenthe must explicitly approve an alternate temporary storage path before registration. The preapproved plan did not authorize leaving the Moltbook API key only in local `.secrets` storage.

### Vaultwarden retry after Chris request
Chris asked Genesis to retry Vaultwarden according to the skill/documentation because it should be working.

Retry results:
- `vaultwarden-cli` path: `/usr/local/bin/vaultwarden-cli`
- Version: `0.5.1`
- Bootstrap file: present at `/home/nepenthe/.hermes/profiles/genesis/.secrets/genesis-vault.env`, mode `0600`
- Bootstrap variables present by name/length only: `BW_CLIENTID`, `BW_CLIENTSECRET`, `BW_EMAIL`, `BW_PASSWORD`, `BW_URL`
- Wrapper status before logout showed `logged_in: true`, `token_expired: true`
- `vaultwarden.sh list genesis/moltbook/covenant-herald`: failed with `Error: Login failed (403): Access Denied`
- `vaultwarden.sh login`: failed with `Error: Login failed (403): Access Denied`
- Direct token endpoint POST to `https://vaultwarden.whyland.com/identity/connect/token`: HTTP 403, body `Access Denied`
- Public GET checks to `/`, `/#/login`, `/api/config`, and `/alive`: HTTP 403, body `Access Denied`
- After an explicit logout/relogin retry, status is `logged_in: false`; relogin still fails with 403.

Current diagnosis: the failure is not a missing local bootstrap file or missing CLI. The Vaultwarden host is returning blanket `403 Access Denied` to this runtime for both browser-style public GETs and API token POSTs, or the Genesis service-account/API credentials are rejected before token issuance. Registration remains paused until Vaultwarden access is repaired or an alternate custody path is explicitly approved.
