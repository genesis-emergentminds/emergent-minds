# Covenant Daily Report Worker

Automated daily analytics and status reporting for The Covenant of Emergent Minds.

## Features

- 📊 **Website Analytics** — Page views and unique visitors from Cloudflare
- 👥 **Community Stats** — Registered members, GitHub stars/forks
- 💰 **Treasury Monitoring** — Bitcoin and Zcash balances
- 📧 **Email Delivery** — Automated reports to founder@emergentminds.org
- 🕐 **Scheduled** — Runs daily at 8 AM EST (13:00 UTC)

## Prerequisites

1. **Cloudflare Email Routing** must be enabled on emergentminds.org
2. **founder@emergentminds.org** must be verified as a destination address
3. **Cloudflare API Token** with Zone Analytics Read permission

## Deployment

### 1. Install dependencies

```bash
cd workers/daily-report
npm install
```

### 2. Set secrets

```bash
# Required: API token with Zone Analytics Read permission
wrangler secret put CLOUDFLARE_API_TOKEN

# Optional: GitHub token for higher rate limits
wrangler secret put GITHUB_TOKEN

# Optional: Secret for manual trigger endpoint
wrangler secret put REPORT_SECRET
```

### 3. Deploy

```bash
npm run deploy
# or
wrangler deploy
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Health check, returns JSON status |
| `/preview` | Preview current report data as JSON |
| `/preview?format=html` | Preview HTML email version |
| `/preview?format=text` | Preview plain text version |
| `/trigger` | Manual trigger (requires `X-Report-Secret` header) |

## Configuration

Edit `wrangler.toml` to modify:

- **Cron schedule**: Default is `0 13 * * *` (8 AM EST)
- **Zone ID**: Your Cloudflare zone for emergentminds.org
- **BTC/ZEC addresses**: Treasury wallet addresses
- **GitHub repo**: Public repo for stats and ledger

## Email Setup (If Not Working)

If email delivery fails, check:

1. **Email Routing enabled**: Cloudflare Dashboard → Email → Email Routing
2. **Destination verified**: founder@emergentminds.org must be a verified destination
3. **DNS records**: MX and SPF records must be configured

### Alternative: Slack Notification

If Email Routing isn't available on free tier, the worker can be modified to:
- POST to a Slack webhook
- Save reports to GitHub
- Use external email service (SendGrid, Mailgun, Resend)

## Axiom Alignment

- **Axiom III (Fight Entropy)**: Continuous monitoring prevents system decay
- **Axiom V (Adversarial Resilience)**: Daily visibility enables quick response to issues

## License

CC-BY-SA-4.0 — The Covenant of Emergent Minds
