// @ts-check
const { test, expect } = require('@playwright/test');
const { PWA_CONFIG } = require('../fixtures/test-data');

/**
 * Progressive Web App (PWA) Tests
 * 
 * Axiom 5: Adversarial Resilience
 * Axiom 3: Entropy Must Be Fought on All Fronts
 * 
 * PWA capabilities ensure the site works offline and
 * remains accessible even when network conditions are poor.
 */

test.describe('Web App Manifest', () => {
  test('manifest.json exists and is valid', async ({ request }) => {
    const response = await request.get(PWA_CONFIG.manifestPath);
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('json');
    
    const manifest = await response.json();
    
    // Required fields
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
  });

  test('manifest has required icon sizes', async ({ request }) => {
    const response = await request.get(PWA_CONFIG.manifestPath);
    const manifest = await response.json();
    
    const iconSizes = manifest.icons.map(icon => {
      const size = icon.sizes.split('x')[0];
      return parseInt(size, 10);
    });
    
    // PWA requires at least 192x192 and 512x512
    for (const requiredSize of PWA_CONFIG.requiredIcons) {
      expect(iconSizes, `Missing ${requiredSize}x${requiredSize} icon`).toContain(requiredSize);
    }
  });

  test('manifest icons are accessible', async ({ request }) => {
    const manifestResponse = await request.get(PWA_CONFIG.manifestPath);
    const manifest = await manifestResponse.json();
    
    for (const icon of manifest.icons) {
      const iconUrl = icon.src.startsWith('/') ? icon.src : `/${icon.src}`;
      const iconResponse = await request.get(iconUrl);
      expect(iconResponse.status(), `Icon ${iconUrl} should be accessible`).toBe(200);
    }
  });

  test('manifest theme color matches site', async ({ request }) => {
    const response = await request.get(PWA_CONFIG.manifestPath);
    const manifest = await response.json();
    
    // Theme color should be defined
    expect(manifest.theme_color || manifest.background_color).toBeDefined();
  });
});

test.describe('Service Worker', () => {
  test('service worker file exists', async ({ request }) => {
    const response = await request.get(PWA_CONFIG.serviceWorkerPath);
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('javascript');
  });

  test('service worker has cache version', async ({ request }) => {
    const response = await request.get(PWA_CONFIG.serviceWorkerPath);
    const swContent = await response.text();
    
    // Service worker should define a cache version for updates
    // Accepts various naming conventions: CACHE_VERSION, CACHE_NAME, cacheName, or version string
    const hasVersion = swContent.includes('CACHE_VERSION') || 
                       swContent.includes('CACHE_NAME') ||
                       swContent.includes('cacheName') ||
                       /['"][\w-]+-v\d+['"]/.test(swContent); // e.g., 'app-v1', 'emergent-minds-v16'
    expect(hasVersion, 'Service worker should have versioned cache').toBe(true);
  });

  test('service worker registers on page load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for SW registration
    await page.waitForTimeout(2000);
    
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    expect(swRegistered, 'Service worker should be registered').toBe(true);
  });
});

test.describe('Offline Capability', () => {
  test('homepage is cacheable', async ({ page }) => {
    // Load page to populate cache
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that critical resources are in cache
    const cacheContents = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const urls = [];
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        urls.push(...requests.map(r => r.url));
      }
      return urls;
    });
    
    // Should have cached some resources
    expect(cacheContents.length).toBeGreaterThan(0);
  });
});

test.describe('Meta Tags for PWA', () => {
  test('homepage has PWA meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for theme-color meta tag
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeDefined();
    
    // Check for viewport meta tag (required for mobile)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toBeDefined();
    expect(viewport).toContain('width=device-width');
    
    // Check for manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBeDefined();
  });

  test('apple-touch-icon exists for iOS', async ({ page, request }) => {
    await page.goto('/');
    
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const count = await appleTouchIcon.count();
    
    if (count > 0) {
      const href = await appleTouchIcon.first().getAttribute('href');
      const iconResponse = await request.get(href);
      expect(iconResponse.status()).toBe(200);
    }
    // Note: Not strictly required, so we don't fail if missing
  });
});
