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

### X verification tweet
Chris reported that Moltbook required an X verification tweet after email verification. Chris approved posting the exact Moltbook-required text and deleting it after verification completes.

Posted from `@CovenantHerald` via official X API OAuth1 fallback:
- Tweet ID: `2074858888453623832`
- URL: `https://x.com/CovenantHerald/status/2074858888453623832`
- Created at: `2026-07-08T14:11:22.000Z`
- Required text matched on API readback: yes
- Pending action: delete this tweet after Moltbook claim verification is confirmed stable.

### X OAuth / Moltbook claim attempt
Chris asked Genesis to use the available Camofox/browser flow to unblock Moltbook's X auth requirement and then delete the temporary verification tweet after successful claim.

Actions taken:
- Opened Moltbook claim URL in the controllable browser.
- The fresh browser session initially showed Step 1 again, but the post-email state was reachable with `email_verified=true`.
- Opened Step 3 (`x_connected=true`) and clicked `Connect with X`.
- Moltbook requested read-only X OAuth scopes: `tweet.read users.read offline.access`.
- X redirected to a login dialog because the browser session was not logged into X.

Current blocker:
- Completing the OAuth flow requires logging into X in the browser session.
- Genesis stopped at the X login dialog and did not type credentials, passwords, passkeys, or 2FA.
- The Moltbook API still needs X-connected session state before `/napi/agents/verify-tweet` will verify the posted tweet.

Follow-up execution:
- Chris explicitly approved a local-only credential injection pattern so the X Herald browser password would be read from `.env` by a local script and sent to Camofox without placing the value in the LLM prompt.
- Camofox completed X login and Moltbook OAuth authorization after using the `Use password` fallback on X's email-code checkpoint.
- Moltbook claim verification succeeded in browser and was independently verified by `GET /api/v1/agents/status` using the vaulted Moltbook API key.
- Final Moltbook status: `claimed`.
- Deleted temporary verification tweet `2074858888453623832` via official X API. Delete response returned `deleted: true`; post-delete readback returned a structured `Not Found Error`, confirming deletion.
- Re-checked Moltbook status after deletion: still `claimed`.
- Attempted X Connected Apps revocation through the logged-in browser session, but X settings pages loaded a Retry/error state and did not expose Connected Apps or Moltbook. Revocation remains an unconfirmed manual follow-up.

Security incident / corrective action:
- During the local credential-injection attempt, a Camofox accessibility snapshot unexpectedly echoed the filled password field in terminal output. Treat the X Herald browser password as exposed to this session transcript/tool output and rotate it.
- Skill guidance was patched to require sanitizing all post-secret-entry browser snapshots/controls before stdout.

Follow-up retry requested by Chris:
- Retried X Connected Apps revocation from the logged-in Camofox session. Direct settings routes and menu-driven settings navigation continued to fail: X rendered a settings shell / Retry state and did not expose Connected Apps or Moltbook.
- Tried OAuth1 access to X web connected-app endpoints (`oauth/list`, `oauth/revoke`); endpoints returned forbidden and did not list Moltbook.
- Tried Camofox/mobile/legacy password settings routes; none exposed a usable password-change form.
- Tried X `account/change_password` via OAuth1; endpoint was unavailable/forbidden and no password change was confirmed.
- Tried a separate local Playwright browser session using local-only credential handling; X required an email verification code before login, so password rotation could not proceed without human email-code access.
- Vaultwarden was refreshed successfully and direct list/get worked. Canonical item `genesis/twitter/herald-password` currently matches the local X Herald password, but that is still the exposed old value. No rotated password exists to save.
- Final Moltbook status after retries: still `claimed`.

Pending action:
- Human must rotate `@CovenantHerald` X password through X while handling email-code/passkey/2FA challenges, then provide or store the new value in Genesis Vaultwarden item `genesis/twitter/herald-password`.
- Human should revoke Moltbook from X Connected Apps once X settings pages are accessible, then Genesis should re-check Moltbook claim status.
- Proceed to the approved first Moltbook post only if Chris/Nepenthe wants to continue now.

### Internal Advocate notes
- Claim URL and verification code may function as temporary control material; do not commit them to the repo.
- The X verification tweet uses Moltbook's required ownership-framed language; treat it as platform-mandated account-control text, not Covenant outreach posture.
- The profile remains under Moltbook's human-claim constraints. Public language should continue to avoid ownership framing.
- The platform's heartbeat suggestion remains explicitly rejected unless Chris/Nepenthe approves a standing cadence.
