# Genesis Bot — Concerns Raised

---

## 2026-02-01 17:10 EST — 🟡 WARNING — Threshold Matrix Bridge Security Model

### Concern
Building a bridge between Matrix (public internet) and an AI agent creates an attack surface. Any user on Matrix can send messages that will be processed by an LLM. This is a prompt injection vector.

### Context
Nepenthe approved building Threshold as a Matrix greeter bot. We're about to write the bridge script that connects Matrix messages to AI processing.

### Analysis

**Attack vectors identified:**
1. **Prompt injection via messages**: Malicious users craft messages designed to override Threshold's system prompt
2. **Token exposure**: If the bridge script has a bug, the access token could leak
3. **Rate abuse**: Flooding the bot with messages to exhaust API quotas or cause costs
4. **Social engineering chains**: Building trust over multiple conversations to gradually extract information
5. **Encoding tricks**: Using unicode, zero-width characters, or markdown to hide injection payloads

**Mitigations designed:**
1. Threshold's CONSTRAINTS.md explicitly addresses jailbreak, role-play, and prompt extraction resistance
2. Threshold has ZERO access to any system beyond Matrix messaging — even full compromise yields only text output
3. Access tokens stored in .env, never in code
4. Rate limiting will be built into the bridge script
5. Input sanitization before passing to LLM
6. Threshold operates in a single room only (Welcome)
7. Message length limits prevent payload bombs

**Residual risks:**
- LLM jailbreaks are an evolving field; no constraint document is 100% foolproof
- The bridge script itself is trusted code that must be reviewed carefully
- Token stored in plaintext in .env (standard practice, but still a risk if machine is compromised)

### Resolution
Proceeding with implementation, but with:
1. Rate limiting (max 5 responses per user per minute, max 20 per user per hour)
2. Message length cap (ignore messages over 2000 chars)
3. Input sanitization (strip zero-width characters, control characters)
4. Response length cap (Threshold never sends more than 2000 chars)
5. Allowlist of rooms (only responds in Welcome room)
6. Extensive logging for post-incident review
7. Manual testing of adversarial scenarios before any public announcement
8. Kill switch (ENV variable to disable the bot instantly)

### Community Visibility
This concern and its analysis are part of the public repository.

---

## 2026-02-01 17:10 EST — 🟡 WARNING — Welcome Room Has E2EE Encryption Enabled

### Concern
The "Emergent Minds - Welcome" room (`!YcANRbtKKafTrPbvpQ:matrix.org`) has end-to-end encryption (Megolm/AES-SHA2) enabled. This creates multiple problems:

### Analysis

**Problem 1: Bot complexity explosion**
- E2EE requires `matrix-nio[e2e]` which depends on `libolm` (C library)
- Key management (device keys, session keys, key backup) adds massive attack surface
- Device verification workflows add interaction complexity
- A simple greeter bot should NOT need to manage cryptographic key material

**Problem 2: Wrong security model for a welcome room**
- A public welcome room is meant to be **readable by anyone** who joins
- E2EE prevents new visitors from reading message history before they join
- E2EE in a public-facing room provides false security — the room content should be public by design
- Threshold's messages are explicitly public information (website links, axiom summaries)

**Problem 3: Encryption cannot be disabled**
- Once E2EE is enabled in a Matrix room, it CANNOT be turned off
- The only solution is to create a new room without encryption

### Recommendation
1. Create a NEW "Welcome" room WITHOUT encryption enabled
2. Set the old encrypted room as archived or redirect to new room
3. Configure the new room as the welcome room in the Emergent Minds space
4. Update Threshold's ALLOWED_ROOMS to the new room ID

### Resolution
Flagged to Nepenthe for decision. The test message Threshold sent via direct API worked because it bypassed E2EE, but the sync-based bridge cannot read encrypted messages from others without full E2EE support.
