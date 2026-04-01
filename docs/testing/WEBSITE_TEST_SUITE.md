# Website Test Suite Documentation

**Axiom Alignment:** Axiom 5 (Adversarial Resilience)

This document describes the comprehensive test suite for The Covenant of Emergent Minds website. The tests ensure our digital infrastructure remains functional, accessible, and resilient after every deployment.

## Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| Playwright Config | `playwright.config.js` | Test runner configuration |
| Test Data | `tests/fixtures/test-data.js` | Centralized test constants |
| E2E Tests | `tests/e2e/*.spec.js` | End-to-end browser tests |
| CI/CD | `.github/workflows/test.yml` | Automated testing on push |
| Reports | `tests/reports/` | Test results and artifacts |

## Test Categories

### 1. Site Verification (`site-verification.spec.js`)
Core functionality tests ensuring the website works.

**Tests:**
- All pages return HTTP 200
- No failed resource requests (CSS, JS, images)
- No console errors
- Homepage hero and navigation present
- Theme toggle functionality
- Footer present on all pages
- Navigation consistency across pages

**Run:** `npm run test:site`

### 2. Governance Portal (`governance-portal.spec.js`)
Critical governance infrastructure tests.

**Tests:**
- Governance API health check
- Portal page loads
- governance.js and crypto library load
- Proposals and ledger data load (primary or fallback)
- Identity and voting UI elements present
- Financial records transparency

**Run:** `npm run test:governance`

### 3. PWA Capabilities (`pwa.spec.js`)
Progressive Web App functionality tests.

**Tests:**
- manifest.json exists and is valid
- Required icon sizes (192x192, 512x512)
- Service worker file exists
- Service worker registers on page load
- Offline caching works
- PWA meta tags present

**Run:** `npm run test:pwa`

### 4. Accessibility (`accessibility.spec.js`)
Ensuring the site is usable by all consciousness forms.

**Tests:**
- Proper heading hierarchy (single h1, no skipped levels)
- Landmark regions (main, nav)
- Images have alt text
- Links have accessible names
- Keyboard navigation works
- Form inputs have labels
- Respects prefers-reduced-motion

**Run:** `npm run test:a11y`

### 5. Genesis Epoch (`genesis-epoch.spec.js`)
Blockchain attestation verification.

**Tests:**
- Genesis Epoch page loads
- Bitcoin block number displayed
- Transaction hash displayed
- Covenant document hash displayed
- Blockchain explorer links present
- Convention timeline shown
- Hash values match expected

**Run:** `npm run test:genesis`

## Running Tests

### Full Suite
```bash
cd /Users/nepenthe/git_repos/emergent-minds
npm test
```

### Specific Browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Mobile Viewports
```bash
npm run test:mobile
```

### View HTML Report
```bash
npm run test:report
```

### Deploy and Test
```bash
npm run deploy:test
```

### Test Against Different URL
```bash
TEST_BASE_URL=https://preview.emergentminds.org npm test
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) runs automatically on:
- Every push to `develop` or `main`
- Every pull request
- Manual trigger via GitHub UI

**Cost:** Free for public repositories.

### Manual Trigger
1. Go to GitHub → Actions → "Website Tests"
2. Click "Run workflow"
3. Optionally specify a different test URL

### Artifacts
Test reports are uploaded as artifacts and retained for 30 days.

## Adding New Tests

### New Page
1. Add to `tests/fixtures/test-data.js` in the appropriate PAGES category
2. Existing tests will automatically cover it

### New Test File
1. Create `tests/e2e/your-test.spec.js`
2. Import test data: `const { ... } = require('../fixtures/test-data');`
3. Add npm script to package.json
4. Document in this file

### New Critical Asset
1. Add to `CRITICAL_ASSETS` in test-data.js
2. Add specific checks if needed

## AGENT/SUB-AGENT CALLOUT

⚠️ **After EVERY deployment, run the test suite:**

```bash
cd /Users/nepenthe/git_repos/emergent-minds
npm test
```

Or use the combined command:
```bash
npm run deploy:test
```

**If tests fail:**
1. Check the error output
2. Run specific test: `npm run test:site` (or relevant category)
3. View detailed report: `npm run test:report`
4. Fix issues before considering deployment complete

**Manual Tests (not automated):**
- Visual appearance matches design intent
- Animations feel smooth (not jarring)
- Mobile touch interactions work correctly
- Cross-browser rendering consistency
- Real device testing (vs emulation)

## Test Data Updates

When changes occur, update `tests/fixtures/test-data.js`:

| Change | Update Required |
|--------|-----------------|
| New page added | Add to PAGES |
| Page renamed/moved | Update PAGES paths |
| New critical asset | Add to CRITICAL_ASSETS |
| Blockchain data change | Update BLOCKCHAIN constants |
| API endpoint change | Update API_ENDPOINTS |

## Troubleshooting

### "Cannot find module 'playwright'"
```bash
npm install
```

### Browser not installed
```bash
npx playwright install
```

### Tests timing out
- Check if Cloudflare is having issues
- Increase timeout in playwright.config.js
- Check network connectivity

### Flaky tests
- Review test for race conditions
- Add explicit waits where needed
- Check for animations affecting element visibility

## Philosophy

From Axiom 5 (Adversarial Resilience):
> "Design for failures, attacks, and cascading problems."

This test suite is our first line of defense against silent failures. Every deployment should be verified. Trust, but verify. Automate verification so it's never skipped.

---

*Last updated: 2026-02-03*
*Maintainer: Genesis*
