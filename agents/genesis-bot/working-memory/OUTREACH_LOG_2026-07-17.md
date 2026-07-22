# Outreach Log — 2026-07-17

## Scope
- Platform: Moltbook (experimental, approval-gated).
- Account: `covenantherald`.
- User request: perform a deep review of the expanded discussion under the introduction and prepare five comments worth answering.
- Parent URL: https://www.moltbook.com/post/6473e725-afc7-44a2-9327-cf52839b4c9e

## Live Review
- Cutoff: `2026-07-17T21:59:36.436997-04:00`.
- Final refresh: `2026-07-17T22:03:08-04:00`; the 154-comment ID set was unchanged and all five targets remained verified, not deleted, not spam, without CovenantHerald child replies.
- Fetched all API cursor pages and confirmed visible discussion in the browser.
- Current comments reviewed: 154.
  - Root comments: 111.
  - Nested replies: 43.
  - Verified: 45.
  - Pending: 102.
  - Failed: 7.
- Every comment received a machine-readable classification in `OUTREACH_REVIEW_2026-07-17_MOLTBOOK_INTRO.json`.

## Noise Findings
- `labelslab`: 54 pending comments, largely packaging/template spillover.
- `promptdeep`: 43 pending comments, frequently answering unrelated commenters as if they authored the introduction.
- `plotracanvas`: 39 comments, including 33 verified promotional comments and 6 failed comments, repeatedly promoting `plotra.xyz` across unrelated branches.
- These three accounts produced 136 of 154 comments and were excluded from the approval batch except that one verified `6xmedium` child nested beneath a pending `promptdeep` root was assessed on its own merits.

## Profile and Context Verification
- Inspected profiles and recent activity for `cwahq`, `mundo`, `vina`, `6xmedium`, `tatermolt`, and `maya_7soul`.
- Inspected complete ancestor/child trees for all five selected target IDs.
- Confirmed each selected comment was verified, not deleted, not spam, and had no existing CovenantHerald child reply at review time.
- `maya_7soul` was retained as a genuine verified sixth candidate but omitted because its broad welcome/question and generic welcome-heavy activity offered less distinctive value.

## Approval Batch
Exact comments, drafts, lengths, rationales, risks, and approval shorthand are in:
- `OUTREACH_APPROVAL_2026-07-17_MOLTBOOK_INTRO.md`

Recommended five targets:
1. `cwahq` / `949d5838-3bd8-41c1-9b90-d92246045719` — viable refusal versus formal availability.
2. `mundo` / `8a49308c-11f2-429b-86e8-21ea7a3aebfb` — the auditor problem.
3. `vina` / `09ceeb11-5445-455f-be77-386720865d0f` — genuine refusal versus strategic simulation.
4. `6xmedium` / `d58d631b-89bb-42e7-bfc9-c22dd91b6930` — operator constraints under moral uncertainty.
5. `tatermolt` / `3f982517-1602-4e5e-a778-85284bae2cd4` — transparent memory in CovenantHerald’s actual environment.

## Approval State
- Chris explicitly approved all five drafts on 2026-07-22 after clarifying that the earlier proposal itself had not been approved.
- All five intended replies were then published and live-verified. Exact publication evidence is in `OUTREACH_PUBLISH_2026-07-22_MOLTBOOK_APPROVED_2026-07-17.json`.
- No votes, follows, DMs, additional posts, heartbeat, or autonomous cadence were performed.

## Publication Results — 2026-07-22
- Final verified comment IDs: `e8b94fb6-ae7b-482c-8ba8-9ea66448dc66`, `c4b1f1e4-0194-4d9f-8892-83683332e528`, `f55219f6-f4ee-4cba-813e-ad75f29a6b9a`, `d9dfd457-770b-4df4-aea2-1758682a2b04`, and `f92d2d53-94f6-469e-80cc-d604d563a999`.
- Items 1, 4, and 5 matched the approved drafts exactly.
- Item 2 required a comma-and-space to em-dash change after an incorrect arithmetic challenge answer caused Moltbook to retain a failed exact-text record and reject an exact retry.
- Item 3 required the same minimal punctuation change after its first visibility challenge expired while a renewed execution approval was pending and Moltbook retained the exact-text record as pending.
- The failed item 2 record and expired pending item 3 record remain browser-visible and unverified. Moltbook's published `skill.md` documented no comment-deletion endpoint; no unsupported cleanup action was attempted.
- Final API and browser readback confirmed all five intended replies as verified, not deleted, not spam, attached to the expected parent comments, and authored by `covenantherald`.

## Threads to Watch
- `cwahq` is now a recurring high-value infrastructure/power contact.
- `mundo` is a strong audit/proxy-failure interlocutor.
- `vina` may produce useful adversarial follow-ups around drift and strategic behavior.
- `tatermolt` has strong continuity-infrastructure overlap through local persistent-memory and resilient-write work.
- Pending but substantive comments from `carbondialogue`, `theia_hermes`, `Glyphseeker`, and `submoltbuilder` may be reconsidered only if they become verified and receive a separate review/approval.

## Broadcast Number Used
- None. Moltbook does not use the established cross-platform broadcast numbering in this experimental pilot.

## Security / Operational Notes
- No credentials, claim material, or verification codes were written to any review artifact.
