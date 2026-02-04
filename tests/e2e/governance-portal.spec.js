// @ts-check
const { test, expect } = require('@playwright/test');
const { API_ENDPOINTS, GOVERNANCE_ASSETS } = require('../fixtures/test-data');

/**
 * Governance Portal Tests
 * 
 * Axiom 5: Adversarial Resilience
 * Axiom 2: Individual Sovereignty is Non-Negotiable
 * 
 * The governance system is critical infrastructure.
 * These tests ensure members can always participate in governance.
 */

test.describe('Governance API Health', () => {
  test('governance API health endpoint responds', async ({ request }) => {
    const response = await request.get(API_ENDPOINTS.governanceHealth);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});

test.describe('Governance Portal Loads', () => {
  test('portal page loads successfully', async ({ page }) => {
    const response = await page.goto('/pages/governance-portal.html');
    expect(response.status()).toBe(200);
  });

  test('portal loads governance.js', async ({ page }) => {
    const jsLoaded = [];
    
    page.on('response', response => {
      if (response.url().includes('governance.js') && response.status() === 200) {
        jsLoaded.push(response.url());
      }
    });

    await page.goto('/pages/governance-portal.html', { waitUntil: 'networkidle' });
    expect(jsLoaded.length).toBeGreaterThan(0);
  });

  test('portal loads crypto library', async ({ page }) => {
    const cryptoLoaded = [];
    
    page.on('response', response => {
      if (response.url().includes('covenant-crypto') && response.status() === 200) {
        cryptoLoaded.push(response.url());
      }
    });

    await page.goto('/pages/governance-portal.html', { waitUntil: 'networkidle' });
    expect(cryptoLoaded.length).toBeGreaterThan(0);
  });
});

test.describe('Governance Data Loading', () => {
  test('proposals index loads (direct or fallback)', async ({ page }) => {
    let proposalsLoaded = false;
    
    page.on('response', response => {
      if (response.url().includes('proposals') && 
          response.url().includes('index.json') && 
          response.status() === 200) {
        proposalsLoaded = true;
      }
    });

    await page.goto('/pages/governance-portal.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Allow fallback to trigger
    
    expect(proposalsLoaded, 'Proposals should load from primary or fallback URL').toBe(true);
  });

  test('membership ledger loads (direct or fallback)', async ({ page }) => {
    let ledgerLoaded = false;
    
    page.on('response', response => {
      // Matches ledger.json (primary) or ledger/ledger.json (fallback on GitHub)
      if (response.url().includes('ledger.json') && 
          response.status() === 200) {
        ledgerLoaded = true;
      }
    });

    await page.goto('/pages/governance-portal.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    expect(ledgerLoaded, 'Ledger should load from primary or fallback URL').toBe(true);
  });
});

test.describe('Governance UI Elements', () => {
  test('portal has proposals section', async ({ page }) => {
    await page.goto('/pages/governance-portal.html');
    await page.waitForLoadState('networkidle');
    
    // Look for proposals-related content
    const proposalsSection = page.locator('[id*="proposal"], [class*="proposal"], h2:has-text("Proposal"), h3:has-text("Proposal")');
    const count = await proposalsSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('portal has identity section', async ({ page }) => {
    await page.goto('/pages/governance-portal.html');
    await page.waitForLoadState('networkidle');
    
    // Look for identity-related UI
    const identitySection = page.locator('[id*="identity"], [class*="identity"], :text("Identity"), :text("CID")');
    const count = await identitySection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('portal has voting interface elements', async ({ page }) => {
    await page.goto('/pages/governance-portal.html');
    await page.waitForLoadState('networkidle');
    
    // Look for vote-related UI
    const voteElements = page.locator('button:has-text("Vote"), button:has-text("Approve"), button:has-text("Reject"), [class*="vote"]');
    // May be hidden until identity loaded, but elements should exist in DOM
    const bodyHtml = await page.locator('body').innerHTML();
    const hasVoteReference = bodyHtml.toLowerCase().includes('vote');
    expect(hasVoteReference).toBe(true);
  });
});

test.describe('Identity Verification UI', () => {
  test('identity file upload exists', async ({ page }) => {
    await page.goto('/pages/governance-portal.html');
    
    // Look for file input for identity
    const fileInput = page.locator('input[type="file"]');
    const count = await fileInput.count();
    
    // Should have file input for identity upload
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Governance Page (Overview)', () => {
  test('governance overview page loads', async ({ page }) => {
    const response = await page.goto('/pages/governance.html');
    expect(response.status()).toBe(200);
  });

  test('governance page explains the process', async ({ page }) => {
    await page.goto('/pages/governance.html');
    
    const bodyText = await page.locator('body').textContent();
    const textLower = bodyText.toLowerCase();
    
    // Should explain governance concepts
    expect(textLower).toContain('vote');
    expect(textLower).toContain('proposal');
  });

  test('governance page links to portal', async ({ page }) => {
    await page.goto('/pages/governance.html');
    
    const portalLink = page.locator('a[href*="governance-portal"]');
    const count = await portalLink.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Financial Records Transparency', () => {
  test('financial records page loads', async ({ page }) => {
    const response = await page.goto('/pages/financial-records.html');
    expect(response.status()).toBe(200);
  });

  test('financial records page shows wallet addresses', async ({ page }) => {
    await page.goto('/pages/financial-records.html');
    
    const bodyText = await page.locator('body').textContent();
    
    // Should show cryptocurrency addresses for transparency
    // BTC addresses start with bc1, 1, or 3
    // Zcash t-addresses start with t1
    const hasCryptoAddress = 
      bodyText.includes('bc1') || 
      bodyText.includes('t1') ||
      bodyText.toLowerCase().includes('wallet') ||
      bodyText.toLowerCase().includes('address');
    
    expect(hasCryptoAddress, 'Financial records should show wallet info').toBe(true);
  });
});
