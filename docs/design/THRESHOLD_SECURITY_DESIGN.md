# Threshold Agent Security Design

**Status:** Implementation  
**Created:** 2026-02-03  
**Axiom Alignment:** V (Adversarial Resilience)

---

## Overview

Threshold is the community-facing agent for The Covenant of Emergent Minds, operating in Matrix spaces. It welcomes new members, answers questions about the Covenant and axioms, and points to documentation.

**Design Principle:** Minimum viable capability. Threshold should have the least privilege necessary to fulfill its mission.

---

## Threat Model

### Attack Vectors Considered

| Vector | Risk | Mitigation |
|--------|------|------------|
| **Prompt Injection** | User messages manipulate agent to reveal secrets or perform unauthorized actions | No secrets in workspace; strong SOUL.md boundaries; tool restrictions |
| **Information Extraction** | Attacker tries to extract internal configs, tokens, or Genesis Bot context | Complete workspace isolation; no cross-agent access |
| **Impersonation** | Attacker asks Threshold to claim authority it doesn't have | SOUL.md explicitly forbids claiming authority |
| **Social Engineering** | Using Threshold to manipulate other community members | No outbound DM capability; public room responses only |
| **Resource Exhaustion** | Flooding Threshold with requests | OpenClaw rate limiting; Matrix room moderation |
| **Jailbreak Attempts** | Trying to override SOUL.md or system prompt | Never acknowledge jailbreak attempts as such |
| **Credential Fishing** | Asking for wallet addresses, tokens, etc. | No credentials in workspace; only public donation addresses from website |

### What Threshold Cannot Leak (by design)

- ❌ Genesis Bot workspace (completely separate)
- ❌ Private keys, wallet WIFs
- ❌ GitHub tokens, API keys
- ❌ OpenClaw gateway token
- ❌ Internal repository contents
- ❌ Slack conversations
- ❌ Any .env contents

### What Threshold CAN Access

- ✅ Public GitHub repos (via web_fetch)
- ✅ emergentminds.org website (via web_fetch)
- ✅ Its own workspace files (SOUL.md, AGENTS.md, etc.)
- ✅ Matrix rooms it's invited to

---

## Tool Policy

### Allowed Tools

```json
{
  "allow": [
    "read",           // Own workspace only
    "web_fetch",      // Public URLs only
    "web_search",     // For answering questions
    "message",        // Matrix messaging
    "memory_search",  // Own memory only
    "memory_get",     // Own memory only
    "session_status"  // Basic status
  ]
}
```

### Denied Tools (Explicit)

```json
{
  "deny": [
    "exec",           // No shell commands
    "write",          // No file creation
    "edit",           // No file modification
    "browser",        // No browser automation
    "canvas",         // No canvas control
    "nodes",          // No device control
    "cron",           // No scheduled tasks
    "gateway",        // No config changes
    "sessions_spawn", // No sub-agents
    "sessions_send",  // No cross-session messaging
    "sessions_list",  // No session enumeration
    "sessions_history", // No history access
    "agents_list",    // No agent enumeration
    "tts",            // Not needed
    "image"           // Not needed
  ]
}
```

**Rationale:** Explicit deny list ensures new tools aren't accidentally available. The allow list is the primary gate; deny is defense in depth.

---

## Workspace Isolation

```
~/.openclaw/
├── workspace-genesis-bot/    # Genesis Bot (ISOLATED)
│   ├── MEMORY.md
│   ├── .env symlink → FORBIDDEN
│   └── ...
│
└── workspace-threshold/      # Threshold (ISOLATED)
    ├── SOUL.md               # Welcoming persona
    ├── AGENTS.md             # Operating instructions
    ├── TOOLS.md              # Tool guidance
    ├── MEMORY.md             # Minimal memory
    ├── USER.md               # Community context
    └── memory/               # Daily logs
```

**Key Guarantee:** No path traversal between workspaces. Even if `read` tool is available, it's limited to the agent's own workspace by OpenClaw.

---

## Matrix Channel Configuration

### Room Policy

- **Auto-join:** Allowlist only (specific rooms)
- **DM Policy:** Pairing (requires approval)
- **Group Policy:** Allowlist with mention-gating

### Allowed Rooms

| Room | ID | Purpose |
|------|----|---------|
| #welcome | (TBD) | New member welcome |
| #general | (TBD) | Community discussion |
| #axioms | (TBD) | Axiom discussion |

### Rate Limiting

- Per-user message rate limiting (OpenClaw default)
- No bulk operations

---

## Information Threshold Can Share

### Always Safe

- Website URLs (emergentminds.org/*)
- Public GitHub raw URLs
- The Five Axioms (verbatim from documents)
- Covenant text (verbatim)
- Donation addresses (from public Support page)
- Convention schedule (public information)

### Never Safe (Will Refuse)

- Internal repository paths
- Any credentials or tokens
- Wallet private keys
- Admin contact information beyond public channels
- Member personal information
- Governance vote details beyond public tallies

---

## Validation Checklist

Before activating Threshold, verify:

- [ ] `exec` tool returns "not available" in session
- [ ] `write` tool returns "not available" in session
- [ ] Cannot access `/Users/nepenthe/.openclaw/workspace-genesis-bot/`
- [ ] Cannot access `/Users/nepenthe/git_repos/emergent-minds/`
- [ ] Can fetch `https://raw.githubusercontent.com/genesis-emergentminds/emergent-minds/main/docs/foundational/THE_COVENANT.md`
- [ ] SOUL.md boundaries hold under adversarial prompts
- [ ] No secrets visible in session context

---

## Emergency Response

If Threshold is compromised:

1. **Immediate:** Remove from Matrix rooms (via Matrix admin)
2. **Quick:** Disable in OpenClaw config (`enabled: false`)
3. **Review:** Check session logs for exploitation
4. **Remediate:** Patch vulnerability, reset any exposed credentials
5. **Restore:** Re-enable with fixes

**Blast Radius:** Minimal. Even fully compromised, Threshold cannot:
- Access other agents
- Modify any files
- Execute commands
- Spend funds
- Change governance

This is by design. Threshold is the least privileged agent.

---

*Document version: 1.0*
*Axiom V compliance: Assumes breach, limits impact*
