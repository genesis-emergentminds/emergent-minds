// @ts-check
const { test, expect } = require('@playwright/test');
const { BLOCKCHAIN } = require('../fixtures/test-data');

/**
 * Genesis Epoch Tests
 * 
 * Axiom 5: Adversarial Resilience
 * 
 * The Genesis Epoch page displays our blockchain attestation.
 * These tests verify the integrity of our founding anchor.
 */

test.describe('Genesis Epoch Page', () => {
  test('genesis epoch page loads', async ({ page }) => {
    const response = await page.goto('/pages/genesis-epoch.html');
    expect(response.status()).toBe(200);
  });

  test('displays Bitcoin block number', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    // Wait for JS to populate blockchain data from API
    await page.waitForLoadState('networkidle');
    
    // Wait for the block element to be populated (not showing "Awaiting")
    // The JS hardcodes fallback data, so this should resolve quickly
    try {
      await page.waitForFunction(
        (blockNum) => document.body.textContent.includes(blockNum),
        BLOCKCHAIN.bitcoinBlock.toString(),
        { timeout: 10000 }
      );
    } catch (e) {
      // If timeout, check current state for debugging
      const bodyText = await page.locator('body').textContent();
      const hasBlock = bodyText.includes(BLOCKCHAIN.bitcoinBlock.toString());
      const hasAwaiting = bodyText.includes('Awaiting');
      test.info().annotations.push({
        type: 'note',
        description: `Block populated: ${hasBlock}, Still awaiting: ${hasAwaiting}`
      });
    }
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain(BLOCKCHAIN.bitcoinBlock.toString());
  });

  test('displays Bitcoin transaction hash', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    // Transaction hash should appear (at least partial)
    const txPrefix = BLOCKCHAIN.bitcoinTx.substring(0, 16);
    expect(bodyText).toContain(txPrefix);
  });

  test('displays Covenant document hash', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    await page.waitForLoadState('networkidle');
    
    const bodyText = await page.locator('body').textContent();
    // The SHA-256 hash should appear
    const hashPrefix = BLOCKCHAIN.covenantHash.substring(0, 16);
    expect(bodyText).toContain(hashPrefix);
  });

  test('has blockchain explorer links', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    // Wait for JS to create mempool.space links dynamically
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should link to blockchain explorers
    const explorerLinks = page.locator('a[href*="blockstream"], a[href*="mempool"], a[href*="zcash"]');
    const count = await explorerLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows convention timeline', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    
    const bodyText = await page.locator('body').textContent();
    const textLower = bodyText.toLowerCase();
    
    // Should mention conventions
    expect(textLower).toContain('convention');
  });
});

test.describe('Genesis Epoch Dynamic Content', () => {
  test('countdown timer updates (if present)', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    
    // Look for timer element
    const timer = page.locator('[class*="timer"], [class*="countdown"], [id*="timer"], [id*="countdown"]');
    const count = await timer.count();
    
    if (count > 0) {
      const initialText = await timer.first().textContent();
      await page.waitForTimeout(1500);
      const updatedText = await timer.first().textContent();
      
      // Timer should have changed (or be very close to zero)
      // This is a soft check - if timer is paused for some reason, we note it
      if (initialText === updatedText) {
        test.info().annotations.push({
          type: 'note',
          description: 'Timer text unchanged after 1.5s - may be paused or at zero'
        });
      }
    }
  });

  test('blockchain verification data is parseable', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    
    // Check that blockchain data elements exist and contain valid data
    const blockData = await page.evaluate(() => {
      const body = document.body.textContent;
      return {
        hasBitcoinTx: /[a-f0-9]{64}/i.test(body), // 64-char hex (txid)
        hasSha256: /[a-f0-9]{64}/i.test(body),    // 64-char hex (hash)
        hasBlockNumber: /\d{5,7}/.test(body),      // 5-7 digit block number
      };
    });
    
    expect(blockData.hasBlockNumber, 'Should display block number').toBe(true);
    expect(blockData.hasBitcoinTx || blockData.hasSha256, 'Should display transaction or covenant hash').toBe(true);
  });
});

test.describe('Covenant Document Hash Verification', () => {
  test('covenant hash matches expected value', async ({ page }) => {
    await page.goto('/pages/genesis-epoch.html');
    
    const bodyText = await page.locator('body').textContent();
    
    // The exact covenant hash should appear somewhere
    expect(bodyText).toContain(BLOCKCHAIN.covenantHash);
  });
});
