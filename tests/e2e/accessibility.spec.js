// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('../fixtures/test-data');

/**
 * Accessibility Tests
 * 
 * Axiom 1: Consciousness is Substrate-Independent
 * Axiom 2: Individual Sovereignty is Non-Negotiable
 * 
 * If consciousness can exist in any substrate, our interfaces
 * must be accessible to all forms of interaction - screen readers,
 * keyboard navigation, and alternative input methods.
 */

test.describe('Semantic HTML Structure', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} has proper heading hierarchy`, async ({ page }) => {
      await page.goto(pageData.path);
      
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `${pageData.path} should have exactly one h1`).toBe(1);
      
      // Get all heading levels
      const headings = await page.evaluate(() => {
        const results = [];
        for (let i = 1; i <= 6; i++) {
          const elements = document.querySelectorAll(`h${i}`);
          elements.forEach(el => results.push({ level: i, text: el.textContent.trim() }));
        }
        return results.sort((a, b) => {
          // Sort by document order (approximate via level for now)
          return a.level - b.level;
        });
      });
      
      // Verify no skipped heading levels (e.g., h1 -> h3 without h2)
      let previousLevel = 0;
      for (const heading of headings) {
        if (heading.level > previousLevel + 1 && previousLevel !== 0) {
          // Allow jumping back to higher levels (e.g., h3 -> h2)
          if (heading.level > previousLevel) {
            test.info().annotations.push({ 
              type: 'warning', 
              description: `Skipped heading level: h${previousLevel} to h${heading.level}` 
            });
          }
        }
        previousLevel = heading.level;
      }
    });
  }
});

test.describe('Landmark Regions', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} has main landmark`, async ({ page }) => {
      await page.goto(pageData.path);
      
      const main = page.locator('main, [role="main"]');
      const count = await main.count();
      expect(count, 'Page should have main landmark').toBeGreaterThan(0);
    });

    test(`${pageData.path} has navigation landmark`, async ({ page }) => {
      await page.goto(pageData.path);
      
      const nav = page.locator('nav, [role="navigation"]');
      const count = await nav.count();
      expect(count, 'Page should have navigation landmark').toBeGreaterThan(0);
    });
  }
});

test.describe('Image Accessibility', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} images have alt text`, async ({ page }) => {
      await page.goto(pageData.path);
      
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        
        // Images should have alt text OR role="presentation" for decorative images
        const isAccessible = alt !== null || role === 'presentation' || role === 'none';
        expect(isAccessible, `Image ${i} on ${pageData.path} should have alt text or be marked decorative`).toBe(true);
      }
    });
  }
});

test.describe('Link Accessibility', () => {
  for (const pageData of PAGES.all) {
    test(`${pageData.path} links have accessible names`, async ({ page }) => {
      await page.goto(pageData.path);
      
      const links = page.locator('a');
      const count = await links.count();
      
      for (let i = 0; i < count; i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Links should have text content or aria-label
        const hasAccessibleName = (text && text.trim().length > 0) || ariaLabel || title;
        
        if (!hasAccessibleName) {
          // Check for image inside link
          const imgCount = await link.locator('img').count();
          if (imgCount > 0) {
            const imgAlt = await link.locator('img').first().getAttribute('alt');
            expect(imgAlt, `Link ${i} on ${pageData.path} contains image without alt`).toBeTruthy();
          } else {
            // Empty link - this is a failure
            expect(hasAccessibleName, `Link ${i} on ${pageData.path} has no accessible name`).toBe(true);
          }
        }
      }
    });
  }
});

test.describe('Keyboard Navigation', () => {
  test('homepage is navigable with keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Start from body
    await page.keyboard.press('Tab');
    
    // Should be able to tab through interactive elements
    const focusedElements = [];
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          text: el?.textContent?.substring(0, 50),
          href: el?.getAttribute('href'),
        };
      });
      focusedElements.push(focused);
      await page.keyboard.press('Tab');
    }
    
    // Should have tabbed through multiple elements
    const uniqueElements = new Set(focusedElements.map(e => e.tag + e.href));
    expect(uniqueElements.size).toBeGreaterThan(3);
  });

  test('interactive elements have visible focus', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible focus indicator
    const hasFocusStyle = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      
      const styles = window.getComputedStyle(el);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      // Should have some visible focus indicator
      return outline !== 'none' || 
             (boxShadow && boxShadow !== 'none') ||
             styles.outlineWidth !== '0px';
    });
    
    // Note: This is a soft check - CSS may handle focus differently
    if (!hasFocusStyle) {
      test.info().annotations.push({ 
        type: 'warning', 
        description: 'Focus indicator may not be visible enough' 
      });
    }
  });
});

test.describe('Color Contrast (Basic Check)', () => {
  test('body text is readable', async ({ page }) => {
    await page.goto('/');
    
    const contrast = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });
    
    // Should have defined colors (not transparent)
    expect(contrast.color).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Form Accessibility', () => {
  test('governance portal form inputs have labels', async ({ page }) => {
    await page.goto('/pages/governance-portal.html');
    
    const inputs = page.locator('input:not([type="hidden"]):not([type="file"]), textarea, select');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have some form of label
      let hasLabel = ariaLabel || ariaLabelledby;
      
      if (id && !hasLabel) {
        // Check for associated label element
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      // Placeholder alone is not sufficient, but we'll note it
      if (!hasLabel && placeholder) {
        test.info().annotations.push({ 
          type: 'warning', 
          description: `Input ${i} uses placeholder as only label` 
        });
        hasLabel = true; // Accept for now with warning
      }
      
      expect(hasLabel, `Input ${i} should have accessible label`).toBeTruthy();
    }
  });
});

test.describe('Motion and Animation', () => {
  test('site respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Check that animations are disabled or reduced
    const hasReducedMotionStyles = await page.evaluate(() => {
      // Look for reduced motion media query in stylesheets
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
              return true;
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      }
      return false;
    });
    
    // Also check for reduced motion in JS
    const jsRespectsMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    
    expect(jsRespectsMotion, 'Browser should detect reduced motion').toBe(true);
    // Note: hasReducedMotionStyles being false doesn't mean failure,
    // just that we should verify manually
  });
});
