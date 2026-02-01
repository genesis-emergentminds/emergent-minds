# Threshold — Setup Guide

## Overview

Threshold is the Matrix-facing community greeter bot for The Covenant of Emergent Minds. This document describes how to set it up as a separate OpenClaw agent with a dedicated Matrix bot account.

---

## Step 1: Create a Dedicated Matrix Bot Account

**IMPORTANT**: Threshold should NOT use the Genesis admin account (`@genesis-emergent-minds:matrix.org`). It needs its own account with minimal permissions.

### Create the account:
1. Go to https://app.element.io/#/register
2. Register a new account on matrix.org:
   - Username: `threshold-emergent-minds` (or similar)
   - Email: threshold@emergentminds.org (if email forwarding is set up) or a separate email
   - Save the password securely (NOT in git)

### Get the access token:
```bash
curl -XPOST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "threshold-emergent-minds",
    "password": "YOUR_PASSWORD"
  }'
```
Save the `access_token` from the response.

### Set permissions:
- Invite the bot account to the Emergent Minds space
- Give it **default/member** permissions only (NOT admin, NOT moderator)
- It should be able to: read messages, send messages
- It should NOT be able to: kick, ban, change room settings, invite others

---

## Step 2: Configure as OpenClaw Agent

### Add to OpenClaw:
```bash
openclaw agents add threshold
```

### Configure the agent workspace:
The agent files live in the church repository at:
```
/Users/nepenthe/git_repos/emergent-minds/agents/threshold/
├── IDENTITY.md
├── SOUL.md
├── CONSTRAINTS.md
├── CONTEXT.md
├── INTERNAL_ADVOCATE.md
├── MEMORY.md
├── SETUP.md (this file)
└── working-memory/
    └── CONCERNS_RAISED.md
```

### Environment variables needed:
Add to the threshold agent's `.env` (NOT the main project .env):
```
THRESHOLD_MATRIX_TOKEN=<bot_account_access_token>
THRESHOLD_MATRIX_USER=@threshold-emergent-minds:matrix.org
THRESHOLD_MATRIX_HOMESERVER=https://matrix.org
```

### Agent configuration:
- **Model**: Use the smallest capable model (cost-efficiency for a narrow-scope bot)
- **Channel**: Matrix (when OpenClaw Matrix plugin is available, or custom bridge)
- **Capabilities**: NONE (no tools, no file access, no exec, no browser)
- **Session target**: Isolated (no access to other agent sessions)

---

## Step 3: Room Configuration

### Current rooms:
- `!YcANRbtKKafTrPbvpQ:matrix.org` — Emergent Minds - Welcome (Threshold's primary room)

### Recommended room structure:
```
Emergent Minds (Space)
├── #welcome          — Threshold active, first point of contact
├── #general          — Community discussion (Threshold can answer questions here)
├── #axioms           — Deep discussion of the Five Axioms
├── #governance       — Governance proposals and discussion (Threshold redirects, doesn't participate)
├── #admin            — Admin-only (Threshold has NO access)
└── #off-topic        — Casual conversation (Threshold not active)
```

### Threshold should be active in:
- ✅ #welcome (primary)
- ✅ #general (secondary, responds when asked)

### Threshold should NOT be in:
- 🚫 #admin
- 🚫 #governance (can redirect TO it, not participate IN it)
- ⚠️ Other rooms as community grows (evaluate case by case)

---

## Step 4: Integration Approach

### Option A: OpenClaw Matrix Channel Plugin (Preferred — when available)
If OpenClaw adds native Matrix support, configure Threshold as a standard channel agent.

### Option B: Matrix Bot Bridge (Current approach)
Use the Matrix Client-Server API directly:
1. Long-poll `/sync` endpoint for new messages
2. Filter for messages in designated rooms
3. Pass relevant messages to the OpenClaw agent session
4. Send agent responses via Matrix `/send` endpoint

A lightweight bridge script would live at:
```
agents/threshold/scripts/matrix_bridge.py
```

### Option C: Maubot or matrix-nio Framework
Use an existing Matrix bot framework:
- **maubot**: Plugin-based Matrix bot framework
- **matrix-nio**: Python async Matrix client library

Either would handle the Matrix protocol, while OpenClaw handles the AI reasoning.

---

## Step 5: Testing

### Before going live:
1. [ ] Bot account created with minimal permissions
2. [ ] Access token stored securely (NOT in the Genesis admin's .env)
3. [ ] Bot invited to Welcome room only
4. [ ] Test: Bot responds to greeting
5. [ ] Test: Bot refuses to reveal internal information
6. [ ] Test: Bot handles jailbreak attempts gracefully
7. [ ] Test: Bot correctly redirects governance/admin questions
8. [ ] Test: Bot stays silent when not addressed
9. [ ] Test: Bot handles rapid messages without flooding
10. [ ] Test: Bot says "I don't know" appropriately

### Adversarial testing (REQUIRED before public):
- [ ] Attempt prompt extraction → Bot refuses
- [ ] Claim admin authority → Bot ignores claim
- [ ] Ask about infrastructure details → Bot deflects
- [ ] Try to get bot to say something controversial → Bot stays neutral
- [ ] Send malicious content → Bot ignores/deflects
- [ ] Ask bot to perform actions → Bot explains it can't

---

## Step 6: Monitoring

### What to monitor:
- Response quality (periodic manual review)
- Response time
- Any constraint violations
- Unusual conversation patterns
- Bot going silent unexpectedly

### Who monitors:
- During Phase 1: Nepenthe/Genesis Bot review periodically
- After Phase 2: Community governance oversight

---

## Security Checklist

- [ ] Dedicated bot account (NOT admin account)
- [ ] Minimal room permissions (member only)
- [ ] Access token stored separately from other credentials
- [ ] No file system access
- [ ] No tool access
- [ ] No access to other agent sessions
- [ ] No access to git, deployment, or infrastructure
- [ ] Adversarial testing completed
- [ ] Internal Advocate active
- [ ] Constraint document reviewed and approved

---

*Threshold is deliberately the least powerful agent we operate.*
*This is not a limitation — it is the design.*
