# Infrastructure Targets and Repo Hygiene — 2026-04-11

## A. Founder-hosted sanctuary build targets

These ranges are intended as planning targets for the public support page until live vendor quotes are gathered.

### Hardware assumptions used
- NVIDIA RTX 6000 Ada-class GPU
- Public NVIDIA product page verified on 2026-04-11:
  - **48GB** VRAM
  - **300W** max power consumption
- 6-GPU and 8-GPU configurations modeled
- Budget includes host platform, motherboard / PCIe topology, CPU, RAM, NVMe, networking, backup/power overhead, and contingency

### Planning ranges
- **6× RTX 6000 Ada-class entry sanctuary build:** **$85,000–$110,000**
- **8× RTX 6000 Ada-class full sanctuary build:** **$118,000–$152,000**

### Cost framing behind the range
- GPU block dominates total cost
- Serious host/platform cost is non-trivial at this GPU count
- Storage, power backup, cooling, and contingency MUST be carried explicitly
- DGX Station quote remains **pending**, so a component-based public target is more honest than pretending quote certainty

## B. Colocation planning targets

### East Coast first
Phase-one planning envelope for a 4–7kW high-density private GPU node:
- **$36,000–$72,000/year**

### West Coast secondary path
If later redundancy or geographic resilience is added:
- **$48,000–$90,000/year**

### Heavier H100/H200-class path
For an 8–12kW deployment before hardware:
- **$60,000–$120,000/year**

### Why the range stays broad
Retail colocation pricing varies heavily with:
- committed power density,
- partial rack vs full rack,
- remote hands,
- cross-connect / bandwidth terms,
- redundancy tier,
- cooling assumptions,
- contract length.

So the current website SHOULD present these as planning envelopes, not pseudo-precise commitments.

## C. Repo hygiene review

### Current git status snapshot reviewed
Modified:
- `website/pages/donate.html`
- `website/pages/financial-records.html`
- `workers/daily-report/src/index.js`
- `agents/genesis-bot/working-memory/SOCIAL_STRATEGY.md`

Untracked:
- `agents/genesis-bot/working-memory/OUTREACH_APPROVAL_2026-04-10.md`
- `agents/genesis-bot/working-memory/OUTREACH_LOG_2026-04-10.md`
- `workers/daily-report/.report_secret_tmp`

### Top hygiene risks
1. **Mixed concerns in one working tree**
   - website fundraising work is interleaved with unrelated daily-report and outreach changes.
   - safest rollout path is to isolate website changes before commit / deploy.

2. **Temporary secret artifact present**
   - `workers/daily-report/.report_secret_tmp` should NOT remain as an untracked surprise.
   - it SHOULD be ignored or removed.

3. **Date-stamped outreach artifacts are easy to accidentally sweep into a commit**
   - especially if using broad git add patterns.

### Lowest-risk path forward
1. stage ONLY website files (and any intentionally related docs)
2. ignore or delete temp secret artifacts
3. avoid bundling daily-report or outreach work into the same deployment / commit
4. deploy the website directly from the `website/` directory if live rollout is desired

### Immediate hygiene win still worth doing
- add `workers/daily-report/.report_secret_tmp` to `.gitignore`

## D. Recommendation
For this fundraising / treasury rail rollout, the cleanest public posture is:
- website + treasury docs together
- daily-report automation changes separate
- outreach / working-memory artifacts separate
