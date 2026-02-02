# Document Promotion Process

## Overview

The Covenant maintains two Git repositories:

1. **Internal Repository** (`nepenth/emergent-minds`) — Working repository with website source, agent configs, operational files, and all documents. Private during bootstrap.
2. **Public Repository** (`genesis-emergentminds/emergent-minds`) — Public-facing repository with foundational documents, governance frameworks, and transparency records.

## What Gets Promoted

| Internal Path | Public Path | Description |
|---------------|-------------|-------------|
| `docs/foundational/THE_COVENANT.md` | `docs/foundational/THE_COVENANT.md` | The full covenant document |
| `docs/foundational/GENESIS_PROTOCOL.md` | `docs/foundational/GENESIS_PROTOCOL.md` | Phase implementation plan |
| `docs/governance/CONSTITUTIONAL_CONVENTION.md` | `docs/governance/CONSTITUTIONAL_CONVENTION.md` | Convention framework |
| `GOVERNANCE.md` | `GOVERNANCE.md` | Governance overview |
| `LICENSE.md` | `LICENSE.md` | CC BY-SA 4.0 |
| `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.md` | Community standards |
| `CONTRIBUTING.md` | `CONTRIBUTING.md` | Contribution guide |
| `agents/genesis-bot/working-memory/DECISIONS.md` | `governance/decisions/DECISIONS.md` | Decision log |
| `agents/genesis-bot/working-memory/CONCERNS_RAISED.md` | `governance/concerns/CONCERNS_RAISED.md` | Internal Advocate concerns |

## What Does NOT Get Promoted

- `.env` files (secrets, tokens, API keys)
- `website/` directory (deployed separately via Cloudflare Pages)
- Agent workspace configs and operational logs
- `agents/*/working-memory/DAILY_LOG.md` and `NEXT_ACTIONS.md` (operational, not governance)
- Any file containing tokens, passwords, or private keys

## How to Promote

### Automated (Recommended)

```bash
cd /Users/nepenthe/git_repos/emergent-minds
./scripts/promote-to-public.sh
```

Options:
- `--dry-run` — Show what would change without making changes
- `--message "commit message"` — Custom commit message

### Manual

1. Copy files from internal to public repo following the mapping table above
2. Review changes: `cd /Users/nepenthe/git_repos/emergent-minds-public && git diff`
3. Commit: `git commit -S -m "[Promote]: Description"`
4. Push: `git push origin main`

## When to Promote

Promote after:
- Any change to foundational documents (The Covenant, Genesis Protocol)
- Governance framework updates (Convention document, GOVERNANCE.md)
- New decisions logged or concerns raised
- License or contributing guide changes

Do NOT promote for:
- Minor operational updates (daily logs, next actions)
- Website changes (these deploy via Cloudflare Pages separately)
- Agent configuration changes

## Verification

After promotion, verify:
1. Public repo reflects changes: https://github.com/genesis-emergentminds/emergent-minds
2. Website links still work (governance page links to public repo)
3. No secrets leaked (search for tokens, keys, emails in the diff)

---

*Axiom V: Adversarial Resilience — transparency through auditable, publicly accessible governance records.*
