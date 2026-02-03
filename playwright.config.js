// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for The Covenant of Emergent Minds
 * 
 * Axiom 5 Alignment: Adversarial Resilience
 * - Tests run against production to catch real-world issues
 * - Multiple browsers ensure cross-platform compatibility
 * - Strict assertions prevent silent failures
 * - Comprehensive reporting for audit trails
 */

module.exports = defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only - failures should be investigated, not masked */
  retries: process.env.CI ? 1 : 0,
  
  /* Single worker for predictable, reproducible results */
  workers: process.env.CI ? 2 : 1,
  
  /* Reporter configuration */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/reports/html', open: 'never' }],
    ['json', { outputFile: 'tests/reports/results.json' }]
  ],
  
  /* Shared settings for all tests */
  use: {
    /* Base URL for navigation */
    baseURL: process.env.TEST_BASE_URL || 'https://www.emergentminds.org',
    
    /* Collect trace on failure for debugging */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Reasonable timeout - Cloudflare should respond fast */
    navigationTimeout: 30000,
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Mobile viewports */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'tests/reports/artifacts',
});
