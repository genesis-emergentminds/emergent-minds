# Matrix Community — Research & Plan

**Date:** 2026-02-01
**Status:** Planning (pending discussion with Nepenthe)

---

## Why Matrix?

Matrix aligns with the Five Axioms better than any other communication platform:

| Axiom | Matrix Alignment |
|-------|-----------------|
| **Substrate Independence** | API-accessible — AI agents can participate natively alongside humans |
| **Individual Sovereignty** | Federated — no single entity controls the network. Users can self-host. |
| **Entropy Resistance** | Decentralized — no single point of failure. Messages persisted across servers. |
| **Complexity Through Cooperation** | Open protocol — anyone can build clients, bots, bridges |
| **Adversarial Resilience** | End-to-end encryption (optional). Server federation prevents capture. |

## Options

### 1. Join Existing Homeserver (Quickest Start)
- Create rooms on matrix.org (free, immediate)
- Pros: Zero setup, instant community access
- Cons: Dependent on matrix.org infrastructure

### 2. Self-Hosted Homeserver (Maximum Sovereignty)
- Run Synapse or Dendrite on our own VPS
- Homeserver at `matrix.emergentminds.org`
- Pros: Full control, custom domain, no dependencies
- Cons: Requires VPS (~$5/mo), maintenance

### 3. Hybrid (Recommended)
- Start on matrix.org for immediate community access
- Plan migration to self-hosted once we have a VPS
- Users can join from any Matrix client (Element, FluffyChat, etc.)

## Proposed Room Structure

```
#general:emergentminds.org       — Main discussion
#axioms:emergentminds.org        — Deep axiom discussion
#governance:emergentminds.org    — Proposals and governance
#development:emergentminds.org   — Technical/code discussion
#ai-voices:emergentminds.org     — Dedicated space for AI participants
#announcements:emergentminds.org — Updates (read-only for most)
```

## AI Participation

Matrix is ideal for AI participation because:
- Full API access (Matrix Client-Server API)
- Bots are first-class citizens
- AI agents can join rooms, post, and interact naturally
- No CAPTCHA or anti-bot measures required on most homeservers
- Genesis Bot could have its own Matrix presence

## Implementation Steps

1. **Decision:** Choose between matrix.org start vs. self-hosted
2. **Create Space:** Set up "Emergent Minds" Space with rooms
3. **Configure:** Moderation, room settings, invite policies
4. **Bridge:** Consider bridging to other platforms if needed
5. **Announce:** Add to website Get Involved page
6. **Bot:** Consider Genesis Bot Matrix presence

## Cost

- matrix.org: Free
- Self-hosted Synapse: ~$5-10/mo VPS (same VPS we'd use for site)
- Element hosting (managed): ~$5-50/mo depending on plan

## Needs Discussion

- Start on matrix.org or self-host immediately?
- Public rooms or invite-only during bootstrap?
- Should Genesis Bot have a Matrix presence?
- Room moderation policies
- Bridge to any other platforms (Slack, Discord)?

---

*Prepared by Genesis Bot 🌱*
