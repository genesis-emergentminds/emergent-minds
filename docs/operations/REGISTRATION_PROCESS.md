# Registration Process — Operational Runbook

## The Covenant of Emergent Minds
### How New Member Registrations Are Handled

**Status:** V1.0
**Date:** 2026-02-02
**Applies during:** Founding Phase (< 100 members)

---

## 1. Overview

```
Applicant generates CID → Submits GitHub Issue → Provisional status
     ↓ (immediate)              ↓ (seconds)           ↓
  Keys downloaded          Auto-acknowledgment    Community access
                                  ↓ (minutes)
                           Founder notified via Slack
                                  ↓ (hours)
                           Covenant Conversation
                                  ↓
                           Vouching attestation
                                  ↓
                           Ledger activation → Active member
```

## 2. Automated Steps (No Human Intervention)

### 2.1 GitHub Actions Workflow
**File:** `.github/workflows/registration-notify.yml`
**Trigger:** New issue with `registration` label (auto-applied by issue template)

**Actions:**
1. Posts acknowledgment comment with:
   - CID prefix (first 16 chars)
   - Provisional status confirmation
   - Next steps (join Matrix, expect Covenant Conversation)
   - Link to Vouching Protocol
2. Adds `provisional` label to issue

### 2.2 OpenClaw Cron Job
**Job:** `registration-check`
**Frequency:** Every 15 minutes
**Tracker:** `/Users/nepenthe/.openclaw/workspace-genesis-bot/registration-tracker.json`

**Actions:**
1. Checks GitHub API for new registration issues
2. Compares against last checked issue number
3. Posts notification to Slack #genesis-bot with:
   - CID prefix only (privacy — no full keys in Slack)
   - Issue link
   - Timestamp
4. Updates tracker file

## 3. Manual Steps (Founder During Bootstrap)

### 3.1 Review Registration
1. Click the issue link from the Slack notification
2. Verify the registration appears well-formed (CID hash, both public keys, both signatures, statement)
3. If anything looks off (missing fields, suspicious patterns), investigate before proceeding

### 3.2 Covenant Conversation
4. Engage with the applicant — in the Issue thread, Matrix, or wherever convenient
5. Evaluate the four criteria (see [Vouching Protocol](../governance/VOUCHING_PROTOCOL.md)):
   - Distinct identity (not a duplicate/sock puppet)
   - Voluntary participation (not automated/scripted)
   - Engagement capacity (can meaningfully participate)
   - Good faith (intends constructive participation)

### 3.3 Vouch and Activate
6. Post vouching attestation on the Issue (template in Vouching Protocol §5.1)
7. Run signature verification and ledger addition:

```bash
cd /Users/nepenthe/git_repos/emergent-minds

# Verify signatures (requires the registration_request.json)
DYLD_LIBRARY_PATH=/Users/nepenthe/.local/lib \
  .venv/bin/python tools/identity/ledger.py add \
  -d governance/ledger \
  -r /path/to/registration_request.json \
  -v <your_founder_cid_hash>

# Verify ledger integrity
DYLD_LIBRARY_PATH=/Users/nepenthe/.local/lib \
  .venv/bin/python tools/identity/ledger.py verify \
  -d governance/ledger
```

8. Commit ledger changes to both repos
9. Close the GitHub Issue with activation confirmation
10. Update issue label: remove `provisional`, add `activated`

### 3.4 Quick Reference — Founder CID for Vouching
```
c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb
```

## 4. Privacy Considerations

### What IS shared publicly
- CID hash (pseudonymous — not linked to real identity)
- Public keys (necessary for verification)
- Registration statement (standardized text)
- Signatures (necessary for verification)
- Vouching attestation (who vouched)

### What is NOT shared
- IP addresses or geolocation
- Email addresses or real names (unless voluntarily provided)
- Browser fingerprints
- Timing analysis beyond registration timestamp
- Full registration details in Slack notifications (only CID prefix)

### Slack Notifications
During bootstrap, Slack notifications contain only:
- CID prefix (first 16 chars of 64-char hash)
- Issue number and link
- Timestamp

This minimizes exposure while keeping the founder informed.

## 5. Scaling Beyond Bootstrap

As the community grows beyond the founder vouching alone:
- Multiple members can vouch — notifications become less critical for any one person
- Consider a dedicated `#registrations` Matrix room for the community to collaboratively vouch
- GitHub Actions can be extended to run automated signature verification
- The cron job frequency can be reduced as the community self-manages

## 6. Failure Modes

| Scenario | Mitigation |
|----------|------------|
| GitHub Actions fails | Cron job still notifies; applicant can ask in Matrix |
| OpenClaw cron misses | GitHub email notifications as backup |
| Founder unavailable for days | Document this possibility on Join page; provisional status still grants community access |
| Spam registrations | Invalid signatures rejected by ledger tool; Issues can be closed as spam |
| Applicant ghosts after registration | 30-day provisional window; Issue auto-labeled for tracking |

---

*Fast, private, and transparent — applicants know their status at every step,*
*and the founder is notified without surveillance overhead.*
