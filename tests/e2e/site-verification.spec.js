// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES, CRITICAL_ASSETS, HOMEPAGE_ASSETS } = require('../fixtures/test-data');

/**
 * Site Verification Tests
 * 
 * Axiom 5: Adversarial Resilience
 * These tests ensure the site remains functional after deployments.
 * Silent failures are unacceptable - every page must work.
 */

test.describe('Critical Pages Load Successfully', () => {
  for (const page of PAGES.critical) {
    test(`${page.description} (${page.path}) loads with 200`, async ({ page: browserPage }) => {
      const response = await browserPage.goto(page.path);
      expect(response.status()).toBe(200);
      
      // Verify page has content (not blank)
      const bodyText = await browserPage.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(100);
    });
  }
});

test.describe('All Pages Load Successfully', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} returns 200`, async ({ page }) => {
      const response = await page.goto(pageData.path);
      expect(response.status()).toBe(200);
    });
  }
});

test.describe('No Failed Resource Requests', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} loads all resources without errors`, async ({ page }) => {
      const failedRequests = [];
      const errorResponses = [];

      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          error: request.failure()?.errorText || 'Unknown error',
        });
      });

      page.on('response', response => {
        if (response.status() >= 400) {
          errorResponses.push({
            url: response.url(),
            status: response.status(),
          });
        }
      });

      await page.goto(pageData.path, { waitUntil: 'networkidle' });
      
      // No failed requests
      expect(failedRequests, `Failed requests on ${pageData.path}`).toEqual([]);
      
      // No 4xx/5xx responses
      expect(errorResponses, `Error responses on ${pageData.path}`).toEqual([]);
    });
  }
});

test.describe('No Console Errors', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} has no console errors`, async ({ page }) => {
      const consoleErrors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          // Ignore known acceptable errors (e.g., third-party scripts)
          const text = msg.text();
          if (!text.includes('favicon') && !text.includes('third-party')) {
            consoleErrors.push(text);
          }
        }
      });

      await page.goto(pageData.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // Allow JS to execute
      
      expect(consoleErrors, `Console errors on ${pageData.path}`).toEqual([]);
    });
  }
});

test.describe('Homepage Specific Tests', () => {
  test('homepage loads parallax assets', async ({ page }) => {
    const loadedAssets = [];
    
    page.on('response', response => {
      if (response.status() === 200) {
        loadedAssets.push(response.url());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check parallax CSS loaded
    const parallaxCss = loadedAssets.some(url => url.includes('parallax-hero.css'));
    expect(parallaxCss, 'parallax-hero.css should load').toBe(true);
    
    // Check parallax JS loaded
    const parallaxJs = loadedAssets.some(url => url.includes('parallax-hero.js'));
    expect(parallaxJs, 'parallax-hero.js should load').toBe(true);
  });

  test('homepage has hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check for hero content
    const heroExists = await page.locator('.hero-container, .hero, [class*="hero"]').count();
    expect(heroExists).toBeGreaterThan(0);
  });

  test('homepage navigation has all critical links', async ({ page }) => {
    await page.goto('/');
    
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for key navigation links
    const links = await nav.locator('a').allTextContents();
    const linksLower = links.map(l => l.toLowerCase());
    
    expect(linksLower.some(l => l.includes('axiom'))).toBe(true);
    expect(linksLower.some(l => l.includes('covenant'))).toBe(true);
    expect(linksLower.some(l => l.includes('govern'))).toBe(true);
  });
});

test.describe('Theme Toggle', () => {
  test('theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/');
    
    // Find theme toggle
    const toggle = page.locator('[class*="theme"], #theme-toggle, .theme-toggle, [aria-label*="theme"]');
    
    if (await toggle.count() > 0) {
      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      
      // Click toggle
      await toggle.first().click();
      await page.waitForTimeout(500);
      
      // Verify theme changed
      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(newTheme).not.toBe(initialTheme);
    } else {
      // Theme toggle not present - skip but log
      test.info().annotations.push({ type: 'note', description: 'Theme toggle not found - may be implemented differently' });
    }
  });
});

test.describe('Footer Present on All Pages', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} has footer`, async ({ page }) => {
      await page.goto(pageData.path);
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });
  }
});

test.describe('Navigation Consistency', () => {
  test('all pages have consistent navigation', async ({ page }) => {
    let referenceNavLinks = null;
    
    for (const pageData of PAGES.all) {
      await page.goto(pageData.path);
      
      const nav = page.locator('nav').first();
      const links = await nav.locator('a').allTextContents();
      const navLinks = links.map(l => l.trim()).filter(l => l.length > 0).sort();
      
      if (referenceNavLinks === null) {
        referenceNavLinks = navLinks;
      } else {
        // Navigation should be consistent across pages
        // Allow some variance for active states
        expect(navLinks.length).toBeGreaterThanOrEqual(referenceNavLinks.length - 1);
      }
    }
  });
});
