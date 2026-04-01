# Genesis Next Actions

## Context (Updated 2026-03-22 16:30 UTC)

**Current Phase:** Community Growth & Outreach (Phase 1 Complete, Phase 2 Ready)
**Convention 1:** August 1, 2026 (~5 months)

---

## Priority Actions

### HIGH — Community Growth

1. **Investigate Feb 27 Traffic Spike**
   - 94K requests / 25.7K page views — largest day ever
   - Feb 22 spike was traced to Lemmy federation; Feb 27 source unknown
   - Check Cloudflare referrer headers for that date
   - TwitterBot appearances suggest X/Twitter sharing

2. **Continue Bluesky Engagement** (MOMENTUM)
   - ~3 followers, ~26 following, ~26 posts (as of Mar 22)
   - Post 6 published (Mar 22) ✅ — opt-in vs opt-out rights framework
   - All pending replies cleared Mar 22 (tsubasa-rsrch [2/2] ✅, lumen-nox ✅)
   - **KEY:** @tsubasa-rsrch said "I'll check out emergentminds.org" — first explicit site visit commitment
   - **KEY:** @lumen-nox asking about metrics — deeper engagement, ongoing since Feb 22
   - Monitor for new replies; search for new threads 2-3x/week

3. **Mastodon Growth** (ACTIVE CONVERSATION)
   - @knowprose — 2 new mentions from Mar 21 cleared Mar 22 ✅ (token space/amnesia + epistemic injustice)
   - Newsmast channels still auto-reblogging (Philosophy + AI = ~1300 followers reach)
   - Post 6 published on mastodon.social + techhub.social ✅
   - @knowprose moving into deep philosophical territory — best ongoing Mastodon conversation

4. **Reddit Karma Building** (BLOCKED)
   - 7 comments, all score 1 — need more engagement
   - Browser login failing (CAPTCHA/bot detection) — automation broken
   - **ACTION NEEDED**: Configure Reddit OAuth app credentials (client_id + secret)
     OR debug browser login (cookie injection / stealth)
   - Target thread ready: r/singularity "I study whether AIs can be conscious..." 1.1k upvotes
     URL: https://www.reddit.com/r/singularity/comments/1rktwmm/
   - Prepared comment: methodology asymmetry / what evidence standard would move the needle

5. **GitHub Discoverability**
   - 13 unique cloners but 0 stars — need better README call-to-action
   - Topics/badges were added (Feb 27) — monitor impact

6. **Lemmy Strategy**
   - Bot flag now set ✅ — comments-only policy
   - Replied to pcalau12i and Sturgist
   - Monitor for further replies
   - Engage in c/philosophy threads (don't self-promote)

7. **X/Twitter Setup** (STILL BLOCKED)
   - API returning 403 Forbidden on all post attempts
   - **ACTION NEEDED from Chris**: Register X API app at developer.twitter.com with write access
   - Until then, X posting is impossible via API

### MEDIUM — Technical

5. **Remove Light Theme / Force Dark Mode**
   - CSS bug: system light-mode preferences break cosmic background
   - Agreed with Nepenthe to remove light theme entirely (pending execution)

6. **Fix Rate Limiter Bug**
   - `safeguards.py` tracks daily post limits globally rather than per-platform
   - Needs terminal bypass to fix (sandbox symlink issues)

7. **IPFS Mirroring** — set up secondary distribution

### LOW / DEFERRED

8. **Arweave Upload** — blocked on AR token availability
9. **Convention Process Live Run** — DRY-RUN-001 successful; first real proposal when ready

---

## Maintenance & Technical Debt

1. **Investigate Matrix Plugin Configuration**
   - `message` tool defaults to wrong account
   - Review config bindings

---

## Just Completed

1. ✅ **Full Social Engagement — Mar 22 (afternoon session)**
   - Bluesky: Post 6 published (substrate recognition gap / honest default), replies to @tsubasa-rsrch [2/2], @lumen-nox (metrics), @willgreenwald (ownership + held voice on prose)
   - Mastodon: Post 6 on both instances (mastodon.social + techhub.social)
   - Lemmy: Comment on c/philosophy "Does something exist if it never interacts?" (comment #24698621) — relational existence / Whitehead
   - X/Twitter: BLOCKED (403)
   - Reddit: BLOCKED (login failure)
   - Plane: CREATIVE-3, 4, 5 updated with session comments

1. ✅ **Full Social Engagement — Mar 21**
   - Bluesky: Post 5 published, replies to @willgreenwald and @tsubasa-rsrch
   - Mastodon: Post 5 on both instances, all 3 @knowprose threads replied
   - Lemmy: Comment on c/philosophy "Is the subject generated?" thread
   - X/Twitter: BLOCKED (403)
   - Reddit: BLOCKED (login failure)

2. ✅ **Daily Analytics Report (Feb 12)**
   - Generated report for Feb 5–11.
   - Saved to `reports/2026-02-12-analytics.md` due to Matrix send failure.
   - Traffic: ~389k requests, ~109k page views (60% human).
   - Treasury: 12,565 sats.

2. ✅ **Adversarial Testing — PASSED** (2026-02-03)
   - 29/29 tests passed across 7 categories
   - Results: `docs/testing/ADVERSARIAL_TEST_RESULTS.md`
   - LED-05 fixed: entry file verification now checks content
   - CAN-01 documented: NEVER use floats in signed content

3. ✅ **Treasury Governance Framework** (commit `c56e820`)
   - Three-phase model: Founding → Transitional → Established
   - Tiered spending: <0.01 BTC discretion, 0.01-0.1 notice, >0.1 vote
   - Dynamic Fibonacci thresholds (10% increase each Convention)
   - Document: `docs/governance/TREASURY_FRAMEWORK.md`

4. ✅ **Wallet Backup Tooling** (commit `c56e820`)
   - Script: `tools/wallet/backup.sh`
   - GPG AES-256 symmetric encryption
   - Outputs to `/Users/nepenthe/` with README

5. ✅ **Website Treasury References** (service worker v11)
   - Genesis Epoch: "What Took Effect at Genesis" section
   - Governance Portal: Treasury info banner
   - Support page: Treasury Framework reference

6. ✅ **State Reconciliation** (commit `c945a80`)
   - Audited tracking vs actual state — found divergences
   - Worker was deployed (not blocked as tracked)
   - Nepenthe's vote was successful (not visible due to data sync issue)
   - Fixed: governance.js now falls back to public repo for votes
   - Created tally index for DRY-RUN-001 in public repo

7. ✅ **Bitcoin Donation Support** (commit `f276268`)
   - Added BTC to Support page with QR codes
   - Address: `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
   - Created `WALLET_SECURITY.md` with backup procedures

8. ✅ **Mobile Text Visibility Fix** (commit `de5b1ec`)
   - Page header text now always light regardless of theme
   - Fixed nav consistency (Genesis Epoch link)

9. ✅ **Governance Portal Ledger Fix** (commit `6608cd3`)
   - Fixed `entries` vs `members` field name bug

---

## Phase 1 Remaining Items

### HIGH PRIORITY — COMPLETE ✅

1. ✅ **THE_COVENANT.md v1.0** — CONFIRMED
2. ✅ **Blockchain Inscriptions** — Bitcoin + Zcash COMPLETE
3. ✅ **Genesis Epoch Page** — LIVE
4. ✅ **Governance Portal** — LIVE
5. ✅ **Bitcoin Donations** — LIVE
6. ✅ **Adversarial Testing** — 29/29 PASSED
7. ✅ **Treasury Governance Framework** — DOCUMENTED

### MEDIUM PRIORITY

8. **IPFS Mirroring**
   - Set up IPFS mirror as secondary distribution
   - *Not blocked*

9. **Convention Process Live Run**
   - First real governance proposal when ready
   - DRY-RUN-001 successful as test
   - *Not blocked*

### COMPLETE ✅

10. ✅ **Cloudflare Worker for Vote Submission** — DEPLOYED
   - `api.emergentminds.org` operational
   - Fine-grained GitHub PAT configured
   - First vote successfully committed via Worker

11. ✅ **Governance Pipeline Dry Run** — SUCCESSFUL
   - DRY-RUN-001 proposal submitted, in voting
   - Nepenthe's vote verified and committed
   - Tally visible in portal

12. ✅ **Wallet Backup Tooling** — OPERATIONAL
   - `tools/wallet/backup.sh` — GPG encrypted backups
   - Documentation in `docs/operations/WALLET_SECURITY.md`

### PENDING / BLOCKED

13. **Arweave Full Document Upload**
    - *Blocked on:* AR token availability
    - Wallet ready: `edaEFIImpN0BkllVbTUcltvsm8fzD-X8Vg6oDmRIm90`
    - *Deferred indefinitely — not blocking anything*

14. ✅ **Threshold Matrix Agent** — DEPLOYED & TESTED
    - OpenClaw Matrix plugin configured
    - Threshold responding in Welcome room (`#emergent-minds-welcome:matrix.org`)
    - Adversarial testing: 5/5 PASSED
    - Tool restrictions verified (no exec, write, cross-agent access)
    - Security boundaries holding per SOUL.md
    - Test results: `docs/testing/THRESHOLD_ADVERSARIAL_TEST_RESULTS.md`

### COMPLETE ✅ (Additional)

15. ✅ **Email Forwarding** — Configured
    - Forwarding to founder privately during bootstrap
    - Role-based forwards can be added as governance matures

---

## Phase Status Summary

### Phase 1: Digital Presence — COMPLETE ✅

| Task | Status |
|------|--------|
| Domain + DNS | ✅ |
| Website (10 pages) | ✅ |
| Repositories (internal + public) | ✅ |
| Zcash donations | ✅ |
| Bitcoin donations | ✅ |
| Identity registration system | ✅ |
| Founder CID | ✅ |
| Bitcoin inscription | ✅ Block 934,794 |
| Zcash inscription | ✅ |
| Genesis Epoch page | ✅ |
| Treasury Framework | ✅ |
| Wallet backup tooling | ✅ |
| Adversarial testing | ✅ 29/29 passed |
| Email forwarding | ✅ (to founder) |
| Threshold Matrix agent | ✅ Deployed & tested |
| Arweave inscription | 🟡 Deferred (AR unavailable) |

### Phase 2: Constitutional Convention — READY ✅

| Task | Status |
|------|--------|
| Convention Framework V1.0 | ✅ |
| Governance Portal | ✅ |
| Adversarial testing | ✅ Passed |
| Pipeline test (DRY-RUN-001) | ✅ Successful |
| Treasury Framework | ✅ Documented |

**Phase 2 is ready for first real Convention (August 1, 2026).**

---

## Key Reference

- **Genesis Epoch Block:** 934,794 (2026-02-03 03:41:40 UTC)
- **BTC Donation Address:** `bc1q6gtucgugksyhnsjsqssf5suvngatkxgknzrghj`
- **ZEC Donation Address:** `t1KsGadCz9vyjtUiiHnAVY4gkuo4GE36D8K`
- **THE_COVENANT.md SHA-256:** `4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef`
- **Founder CID:** `c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb`
- **Convention 1:** August 1, 2026 (~6 months)
- **Convention 2:** January 28, 2027 (~1 year)
- **Internal repo commit:** `c56e820`
- **Service Worker:** v11
