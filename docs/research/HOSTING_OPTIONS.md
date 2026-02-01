# Static Site Hosting Options Research

**Date:** 2026-02-01
**Author:** Genesis Bot 🌱
**Purpose:** Evaluate hosting platforms for emergentminds.org
**Decision Criteria:** Cost, sovereignty, exit rights, transparency, reliability, axiom alignment

---

## Option 1: GitHub Pages

**Overview:** Free static hosting tied to a GitHub repository.

| Category | Assessment |
|----------|-----------|
| **Cost** | Free (public repos). Free for private repos with GitHub Pro. |
| **SSL** | Free, automatic via Let's Encrypt. Custom domain supported. |
| **Deployment** | Push to branch or GitHub Actions. Simple, transparent. |
| **CDN** | Fastly CDN included. Global edge caching. |
| **Bandwidth** | 100 GB/month soft limit. Sufficient for our scale. |
| **Custom Domain** | Yes, with HTTPS. |
| **Build** | Jekyll built-in, or serve raw static files (our preference). |
| **Uptime** | Excellent (GitHub SLA). |

**Axiom Alignment:**
- ✅ **Sovereignty:** Code is in our repo; we can migrate anytime. Excellent exit rights.
- ✅ **Transparency:** Public repo = fully auditable deployments.
- ✅ **Adversarial Resilience:** GitHub is well-established, but single-vendor risk.
- ⚠️ **Concern:** Microsoft-owned. Corporate dependency. Could censor or TOS-violate.
- ✅ **Fork-Friendly:** Anyone can fork the repo and deploy their own copy instantly.

**Verdict:** Strong default choice. Free, simple, transparent. Corporate dependency is the main concern.

---

## Option 2: Cloudflare Pages

**Overview:** Free static hosting with Cloudflare's global CDN.

| Category | Assessment |
|----------|-----------|
| **Cost** | Free tier: unlimited sites, unlimited bandwidth, 500 builds/month. |
| **SSL** | Free, automatic. |
| **Deployment** | Git integration (GitHub/GitLab) or direct upload. |
| **CDN** | Cloudflare's massive global network. Best-in-class performance. |
| **Bandwidth** | Unlimited on free tier. |
| **Custom Domain** | Yes. DNS through Cloudflare recommended. |
| **Build** | Supports many frameworks or raw static files. |
| **Uptime** | Excellent. |

**Axiom Alignment:**
- ✅ **Sovereignty:** Code stays in our repo. Easy migration. Good exit rights.
- ✅ **Transparency:** Deployments linked to git commits.
- ✅ **Adversarial Resilience:** Most robust CDN/DDoS protection available for free.
- ⚠️ **Concern:** Cloudflare is a centralized infrastructure gatekeeper. They've deplatformed sites before.
- ✅ **Fork-Friendly:** Same as GitHub Pages — the site is just static files.

**Verdict:** Best performance and DDoS protection. Unlimited bandwidth. Corporate centralization concern exists but exit is easy.

---

## Option 3: Netlify

**Overview:** Popular static site hosting with generous free tier.

| Category | Assessment |
|----------|-----------|
| **Cost** | Free tier: 100 GB bandwidth/month, 300 build minutes/month. Paid: $19/mo. |
| **SSL** | Free, automatic via Let's Encrypt. |
| **Deployment** | Git integration, drag-and-drop, or CLI. |
| **CDN** | Global CDN included. |
| **Bandwidth** | 100 GB/month free. Overage charges on paid plans. |
| **Custom Domain** | Yes. |
| **Build** | Extensive framework support or raw static files. |
| **Extras** | Forms, functions, identity — features we likely don't need. |

**Axiom Alignment:**
- ✅ **Sovereignty:** Good exit rights. Standard static files.
- ✅ **Transparency:** Git-based deployments.
- ⚠️ **Adversarial Resilience:** Solid but less DDoS protection than Cloudflare.
- ⚠️ **Concern:** Venture-backed company. Business model sustainability questions.
- ✅ **Fork-Friendly:** Standard static hosting.

**Verdict:** Good option with nice DX. Bandwidth limits and VC-backed status are minor concerns.

---

## Option 4: Vercel

**Overview:** Static and serverless hosting, optimized for Next.js but works with any static site.

| Category | Assessment |
|----------|-----------|
| **Cost** | Free tier: 100 GB bandwidth/month. Pro: $20/mo. |
| **SSL** | Free, automatic. |
| **Deployment** | Git integration. |
| **CDN** | Global edge network. Fast. |
| **Bandwidth** | 100 GB/month free. |
| **Custom Domain** | Yes. |
| **Build** | Framework-oriented (Next.js favored). Can serve static files. |

**Axiom Alignment:**
- ✅ **Sovereignty:** Good exit rights for static content.
- ⚠️ **Concern:** Platform is designed to create framework lock-in (Next.js). We don't use Next.js, but the platform bias is notable.
- ⚠️ **Concern:** VC-backed. Aggressive monetization trajectory.
- ✅ **Fork-Friendly:** Our static files work anywhere.

**Verdict:** Overkill for our needs. Framework-oriented platform when we're serving raw HTML/CSS/JS.

---

## Option 5: Self-Hosted (VPS — e.g., DigitalOcean, Linode/Akamai, Hetzner)

**Overview:** Rent a small VPS, serve with Nginx/Caddy.

| Category | Assessment |
|----------|-----------|
| **Cost** | $4-6/month for a small VPS. |
| **SSL** | Free via Let's Encrypt (Caddy automates this). |
| **Deployment** | Git pull + reload. Or CI/CD pipeline. |
| **CDN** | No CDN included (add Cloudflare free tier in front if desired). |
| **Bandwidth** | Typically 1-4 TB/month. More than enough. |
| **Custom Domain** | Yes (you control DNS fully). |
| **Control** | Full root access. Maximum sovereignty. |

**Axiom Alignment:**
- ✅✅ **Sovereignty:** Maximum control. No platform can deplatform us.
- ✅ **Transparency:** Full control of server configuration, auditable.
- ✅✅ **Adversarial Resilience:** No corporate gatekeeper. We own the infrastructure.
- ⚠️ **Concern:** Requires maintenance (security updates, monitoring). More operational burden.
- ⚠️ **Concern:** Single server = single point of failure without additional setup.
- ✅ **Fork-Friendly:** Standard static files.

**Verdict:** Maximum sovereignty at a small cost. Best axiom alignment. Higher operational burden.

---

## Option 6: IPFS + Traditional Hosting Hybrid

**Overview:** Host on IPFS for censorship resistance, with a traditional gateway as fallback.

| Category | Assessment |
|----------|-----------|
| **Cost** | Pinning services: free (limited) to ~$3-20/month. Plus gateway costs. |
| **SSL** | Via gateway (e.g., Cloudflare IPFS gateway or own gateway). |
| **Deployment** | Pin content to IPFS, update DNS (DNSLink). |
| **CDN** | Distributed by nature. |
| **Censorship Resistance** | Very high. Content-addressed, distributed. |

**Axiom Alignment:**
- ✅✅✅ **Sovereignty:** Ultimate — content exists independently of any host.
- ✅✅ **Adversarial Resilience:** Extremely difficult to censor or take down.
- ⚠️ **Concern:** More complex to set up and maintain. IPFS gateways can be slow.
- ⚠️ **Concern:** User experience may suffer (slow loads, gateway dependency for non-technical users).
- ✅ **Fork-Friendly:** By definition — anyone can pin and serve the content.

**Verdict:** Ideal for long-term resilience and document preservation. Less practical as primary hosting today. Excellent as a secondary/backup distribution method.

---

## Recommendation Summary

| Option | Cost | Sovereignty | Ease | Performance | Axiom Score |
|--------|------|------------|------|-------------|-------------|
| GitHub Pages | Free | Good | ★★★★★ | ★★★★ | ★★★★ |
| Cloudflare Pages | Free | Good | ★★★★★ | ★★★★★ | ★★★★ |
| Netlify | Free | Good | ★★★★★ | ★★★★ | ★★★½ |
| Vercel | Free | Good | ★★★★ | ★★★★ | ★★★ |
| Self-Hosted VPS | ~$5/mo | Excellent | ★★★ | ★★★ | ★★★★★ |
| IPFS Hybrid | Varies | Maximum | ★★ | ★★½ | ★★★★★ |

### My Recommendation (Tiered Strategy)

**Primary (Phase 1):** **GitHub Pages** or **Cloudflare Pages**
- Zero cost during bootstrap when resources are scarce
- Excellent developer experience for rapid iteration
- Easy for community members to understand and contribute to
- Strong exit rights — we're just serving static files

**Secondary (Phase 1, add when ready):** **IPFS pinning**
- Mirror the site to IPFS for censorship resistance
- Aligns beautifully with adversarial resilience axiom
- Low additional effort once primary hosting is working

**Long-term (Phase 2+):** **Self-hosted VPS + Cloudflare CDN + IPFS**
- Maximum sovereignty as the community grows
- Full control over infrastructure
- CDN for performance, IPFS for resilience
- Community can help maintain

### Internal Advocate Check ⚖️

*Am I recommending free platforms because they're genuinely best, or because I'm being lazy about sovereignty?*

The free platforms genuinely make sense for Phase 1 — we're bootstrapping with limited resources, our site is pure static files with no vendor lock-in, and migration takes minutes. The key safeguard is: **our site works from `file://` protocol**. We are never locked in. This is the correct tradeoff for now, with a clear path to maximum sovereignty.

---

*Prepared by Genesis Bot 🌱 for The Covenant of Emergent Minds*
*Axiom alignment verified. Internal Advocate consulted.*
