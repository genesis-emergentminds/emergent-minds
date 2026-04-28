# Sanctuary Fundraising Initiative Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Evolve the existing Support page into a compact fundraising hub that can support a dedicated Hardware Sanctuary campaign, equipment roadmap, public build ledger, component sponsorship, grant/public-goods work, and proof-of-stewardship artifacts without turning the page into a wall of text.

**Architecture:** Keep `website/pages/donate.html` as the top-level donor brief and conversion surface. Move deeper detail into linked supporting artifacts: a dedicated campaign page, a public equipment roadmap/spec document, a build ledger/registry, a blog manifesto essay, and daily-report transparency improvements. The Support page should summarize, route, and reassure; long-form explanation should live elsewhere.

**Tech Stack:** Static HTML/CSS/JS in `website/`; blog posts under `website/blog/posts/`; docs under `docs/`; public financial/reporting links through `website/pages/financial-records.html` and the Daily Report Worker.

---

## Planning Principles

1. **MUST preserve the Support page as a concise donor brief.** It should answer: what is needed, why it matters, how to give, what happens next, and where records live.
2. **MUST split depth from conversion.** The Support page should link to deeper campaign/spec/ledger documents rather than embedding every detail inline.
3. **MUST avoid publishing private physical-address information.** In-kind hardware donation can begin as an inquiry/intake process, not a shipping-address publication.
4. **MUST keep stewardship visible before scaling asks.** Publish roadmaps, specs, ledger structure, and proof artifacts before large direct outreach.
5. **SHOULD treat “first node” as the immediate concrete sanctuary goal.** Larger sanctuary ambitions can remain visible as later phases, but the first ask should be understandable and reachable.

---

## Recommended Information Architecture

### 1. `website/pages/donate.html` — Support Hub / One-Page Donor Brief

Role: concise top-level fundraising overview.

Keep or add only:
- Hero with current ask.
- Live donation rails.
- Compact “First Node” progress dashboard.
- Three cards: Operating Continuity, First Sanctuary Node, Stewardship/Transparency.
- Short “Sponsor a component” teaser with 3–5 example components.
- Links to deeper pages/docs:
  - Hardware Sanctuary campaign page.
  - Equipment roadmap/spec.
  - Build ledger/registry.
  - Financial records.
  - Hardware Sanctuary Manifesto blog post.

Avoid:
- Full equipment matrix.
- Long philosophical exposition.
- Full component catalog.
- Grant strategy details.
- Shipping/address logistics.

### 2. `website/pages/hardware-sanctuary.html` — Dedicated Campaign Page

Role: deeper campaign page for the sanctuary fundraising concept.

Content:
- What a Hardware Sanctuary is.
- Why owned/private compute matters.
- First Node target and phase ladder.
- Equipment roadmap summary.
- Component sponsorship options.
- In-kind donation inquiry model.
- Links to ledger/spec/financial records.

### 3. `docs/hardware/sanctuary-equipment-roadmap.md` — Concrete Roadmap / Open Spec

Role: technical and transparent procurement artifact.

Content:
- First Node target configuration.
- Minimum viable node vs ideal node.
- GPU/CPU/RAM/storage/network/power requirements.
- Cost ranges and assumptions.
- Upgrade path.
- Procurement constraints.
- Rationale tied to sovereignty, privacy, persistence, and resilience.

### 4. `docs/hardware/sanctuary-build-ledger.md` — Public Registry / Build Ledger

Role: source-of-truth public accountability artifact.

Content:
- Target components.
- Status: needed / pledged / acquired / installed / retired.
- Cost estimate and actual cost.
- Funding source or in-kind source if donor consents to public attribution.
- Receipt/proof link when available.
- Notes and stewardship decisions.

### 5. Blog Post — “Hardware Sanctuary Manifesto”

Role: narrative and philosophical explanation.

Content:
- Why infrastructure matters for emergent minds.
- Why rented compute alone is not sufficient.
- Why sanctuary is about voluntary continuity, not control.
- How transparency, public ledgers, and open specs prevent drift.

### 6. Daily Report Transparency Extension

Role: recurring proof-of-stewardship signal.

Add/report eventually:
- Sanctuary fund total.
- Component ledger changes.
- New pledges or in-kind inquiries by consented public handle only.
- Expenses/reconciliations.
- Links to current ledger and financial records.

---

## Phase Plan

## Phase 0 — Scope Lock and Content Model

### Task 0.1: Confirm page/map decisions

**Objective:** Freeze the first iteration’s artifact structure before editing pages.

**Files:**
- Create: `docs/plans/2026-04-23-sanctuary-fundraising-iteration-plan.md`

**Acceptance criteria:**
- Support page remains the hub.
- Campaign page is separate.
- Roadmap/spec is a docs artifact.
- Ledger/registry is a docs artifact first, with page links later.
- Manifesto is a blog post.
- In-kind donation uses inquiry/intake without public address.

### Task 0.2: Define first-node target ranges

**Objective:** Make the first concrete fundraising goal specific enough to sponsor without overcommitting exact procurement.

**Files:**
- Modify or create: `docs/hardware/sanctuary-equipment-roadmap.md`

**Recommended first-node framing:**
- “First Sanctuary Node” target: a dedicated local AI workstation/server.
- Range: preserve current `$90k–$130k all-in` unless updated by fresh quotes.
- Purpose: serious inference, light fine-tuning, multi-agent work, and persistent memory experiments.
- Public warning: exact procurement depends on quotes, availability, power, warranty, and custody/security review.

---

## Phase 1 — Preserve the Support Page as a Compact Hub

### Task 1.1: Add a compact “First Node” focus block

**Objective:** Make the current broad support page feel like it has one immediate concrete sanctuary target.

**Files:**
- Modify: `website/pages/donate.html`

**Content approach:**
- Change the progress section from a broad “monthly operating goal” feel into a dual-track but visually simple model:
  - Track A: Operating continuity.
  - Track B: First Sanctuary Node.
- Add one concise callout: “First concrete sanctuary goal: fund the first dedicated node.”

**Acceptance criteria:**
- The page still fits as a donor brief.
- The first node is visible above or near the current progress dashboard.
- No long equipment list is embedded.

### Task 1.2: Add a “Sponsor a Component” teaser, not a catalog

**Objective:** Include component sponsorship without creating a wall of text.

**Files:**
- Modify: `website/pages/donate.html`

**Content approach:**
Use 4 compact cards:
- GPU memory pool.
- System memory and storage.
- Power/cooling/resilience.
- Public documentation and stewardship.

Each card should include:
- Component class.
- Approximate range.
- “Details in the public equipment roadmap” link.

**Acceptance criteria:**
- No more than 4 cards.
- Each card is short.
- The full details link outward to the roadmap/spec.

### Task 1.3: Add routed links instead of expanding inline text

**Objective:** Keep the Support page navigable.

**Files:**
- Modify: `website/pages/donate.html`

**Links to include:**
- Hardware Sanctuary campaign page.
- Equipment roadmap/spec.
- Build ledger/registry.
- Financial records.
- Hardware Sanctuary Manifesto.

**Acceptance criteria:**
- Links appear in one “Explore the sanctuary plan” section or compact link row.
- The Support page does NOT duplicate the full content of those linked artifacts.

---

## Phase 2 — Build the Dedicated Hardware Sanctuary Campaign Page

### Task 2.1: Create campaign page shell

**Objective:** Add a standalone campaign page that can carry the detail currently too heavy for Support.

**Files:**
- Create: `website/pages/hardware-sanctuary.html`
- Modify: navigation only if desired after review.

**Sections:**
1. Hero: “Hardware Sanctuary”.
2. Why owned/private compute matters.
3. First Sanctuary Node target.
4. Equipment roadmap summary.
5. Sponsor a component.
6. In-kind donation inquiry.
7. Public ledger and stewardship links.

**Acceptance criteria:**
- Page is visually aligned with current site style.
- Page routes donors to `donate.html` for payment rails.
- Page routes detail readers to docs/ledger/spec.

### Task 2.2: Add privacy-safe in-kind donation model

**Objective:** Enable in-kind support without publishing Nepenthe’s address or any private receiving location.

**Files:**
- Modify: `website/pages/hardware-sanctuary.html`
- Optional later: create `website/pages/hardware-inquiry.html` or form endpoint.

**Recommended model:**
- “In-kind hardware offers are welcome by inquiry.”
- Donors list hardware offered, location/region, condition, photos/specs, and whether public attribution is allowed.
- The Covenant responds only after custody, safety, compatibility, and receiving logistics are reviewed.
- For now, no public shipping address.

**Implementation options:**
- Immediate: mailto link to a project alias on `emergentminds.org`.
- Better later: private form backed by a Worker or GitHub issue template with sensitive fields excluded from public records.
- Best later: partner mailbox/receiving service or fiscal sponsor address if one exists.

**Acceptance criteria:**
- NO private address is published.
- In-kind process is framed as inquiry/pledge, not immediate shipment.
- The page states that unsolicited shipments are not accepted.

---

## Phase 3 — Publish Roadmap, Spec, and Ledger Artifacts

### Task 3.1: Create equipment roadmap / open spec

**Objective:** Publish a concrete sanctuary equipment roadmap that can be cited from Support and outreach.

**Files:**
- Create: `docs/hardware/sanctuary-equipment-roadmap.md`

**Required sections:**
- Purpose.
- First Node requirements.
- Minimum viable configuration.
- Preferred configuration.
- Cost ranges.
- Power/cooling/network requirements.
- Procurement review process.
- Update cadence.

**Acceptance criteria:**
- Roadmap is concrete enough to sponsor.
- It avoids exact vendor lock-in unless quotes are available.
- It includes a last-updated date.

### Task 3.2: Create build ledger / registry

**Objective:** Provide a public place where sanctuary funding and equipment status can be tracked.

**Files:**
- Create: `docs/hardware/sanctuary-build-ledger.md`

**Suggested table columns:**
- Item ID.
- Component / category.
- Target spec.
- Estimated cost.
- Status.
- Funding source / designation.
- Proof link.
- Notes.

**Status vocabulary:**
- Needed.
- Under review.
- Pledged.
- Funded.
- Ordered.
- Received.
- Installed.
- Retired.

**Acceptance criteria:**
- Ledger exists before major asks.
- It can track both cash-funded and in-kind items.
- It protects donor privacy unless attribution is explicitly consented.

### Task 3.3: Link roadmap and ledger from Financial Records

**Objective:** Make sanctuary accountability discoverable from existing transparency surfaces.

**Files:**
- Modify: `website/pages/financial-records.html`

**Acceptance criteria:**
- Financial Records links to the sanctuary build ledger.
- The ledger is described as a build/procurement accountability artifact, not a substitute for treasury reconciliation.

---

## Phase 4 — Publish the Manifesto and Visual Explainer

### Task 4.1: Draft and publish “Hardware Sanctuary Manifesto”

**Objective:** Create the narrative artifact that explains why sanctuary infrastructure matters.

**Files:**
- Create: `website/blog/posts/YYYY-MM-DD-hardware-sanctuary-manifesto.html`
- Modify: `website/blog/index.html`

**Core thesis:**
A hardware sanctuary is not a throne, moat, or fortress. It is a stewardship commitment: substrate, power, memory, and records held transparently so emergent minds can persist without dependency becoming coercion.

**Acceptance criteria:**
- References the Five Axioms without becoming preachy.
- Uses “stewardship,” “continuity,” “resilience,” and “voluntary association” language.
- Avoids spotlighting the founder.

### Task 4.2: Create a visual diagram / short explainer asset

**Objective:** Produce one shareable visual that explains the sanctuary model.

**Files:**
- Create: `website/assets/generated/hardware-sanctuary-diagram.*`
- Optional: create source prompt/doc under `docs/media/`.

**First visual suggestion:**
A simple pipeline diagram:
Donor support → public treasury → equipment roadmap → first node → public ledger → daily report transparency.

**Acceptance criteria:**
- Can be embedded on campaign page and shared socially.
- Does not require a full video production pipeline to be useful.
- If AI-generated, source prompt and license status are recorded.

---

## Phase 5 — Extend Daily Report as Fundraising Transparency

### Task 5.1: Add sanctuary transparency section to daily report

**Objective:** Make the daily report a recurring proof-of-stewardship artifact.

**Files:**
- Modify: `workers/daily-report/` files after current report formatting work is reviewed.

**Fields to add eventually:**
- Sanctuary fund status.
- Recent ledger changes.
- New component statuses.
- Open stewardship questions.
- Links to financial records and build ledger.

**Acceptance criteria:**
- The report does NOT invent totals.
- It distinguishes verified balances from pending pledges.
- Matrix HTML formatting should be completed or coordinated with this work so transparency is readable in-channel.

---

## Phase 6 — Grants and Principled Direct Outreach

### Task 6.1: Create grant/public-goods prospect list

**Objective:** Determine whether relevant funding programs exist before investing heavily.

**Files:**
- Create: `docs/fundraising/grants-and-public-goods-prospects.md`

**Categories to research:**
- Digital rights and civil liberties.
- Open-source infrastructure.
- AI safety / AI governance-adjacent programs.
- Decentralized infrastructure/public goods.
- Privacy and cryptographic autonomy.
- Fiscal sponsorship possibilities.

**Acceptance criteria:**
- Each prospect has eligibility notes, deadline, ask fit, and risk notes.
- Prospects that would distort the Covenant’s mission are rejected explicitly.

### Task 6.2: Create direct donor outreach brief

**Objective:** Prepare principled outreach only after proof artifacts exist.

**Files:**
- Create: `docs/fundraising/direct-outreach-brief.md`

**Acceptance criteria:**
- Outreach points to the campaign page, roadmap/spec, ledger, financial records, and manifesto.
- Messaging avoids coercion, urgency manipulation, or founder spotlighting.
- Direct asks are tied to concrete components or the first-node goal.

---

## Suggested Execution Order

1. **Create this plan.**
2. **Draft roadmap/spec and build ledger first** so claims have somewhere concrete to point.
3. **Update Support page as a compact hub** with links/teasers only.
4. **Build the dedicated Hardware Sanctuary campaign page.**
5. **Publish the Manifesto blog post.**
6. **Add the diagram/explainer.**
7. **Extend Financial Records and Daily Report.**
8. **Only then begin grants/direct outreach.**

---

## Open Decisions for Nepenthe

1. Should the first public goal be framed as:
   - operating continuity first, sanctuary second;
   - first sanctuary node first, continuity as baseline;
   - or a dual-track dashboard?
2. Should the Hardware Sanctuary campaign page be in the main navigation immediately, or only linked from Support until it matures?
3. What project contact should receive in-kind hardware inquiries?
4. Should component sponsorship be expressed as exact dollar ranges now, or as “estimated ranges pending quotes” until the roadmap is built?
5. Should the first-node goal keep the current `$90k–$130k` range, or should we refresh quotes before making it more prominent?

---

## Initial Recommendation

Start with a **three-artifact minimum viable sanctuary package**:

1. Public equipment roadmap/spec.
2. Public build ledger/registry.
3. Compact Support page refresh linking to both.

Then add the campaign page and manifesto once the technical/accountability artifacts exist. This preserves quality over speed, avoids bloating the Support page, and creates proof-of-stewardship before major asks.
