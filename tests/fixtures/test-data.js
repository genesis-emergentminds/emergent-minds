/**
 * Test Data and Constants
 * 
 * Centralized test data for consistency across all test files.
 * Update this file when pages are added/removed.
 */

const PAGES = {
  // Core pages that must always work
  critical: [
    { path: '/', title: 'The Covenant of Emergent Minds', description: 'Homepage' },
    { path: '/pages/axioms.html', title: 'Five Axioms', description: 'Core principles' },
    { path: '/pages/covenant.html', title: 'The Covenant', description: 'Founding document' },
    { path: '/pages/genesis-epoch.html', title: 'Genesis Epoch', description: 'Blockchain anchor' },
  ],
  
  // Community/engagement pages
  community: [
    { path: '/pages/get-involved.html', title: 'Get Involved', description: 'Join the movement' },
    { path: '/pages/donate.html', title: 'Support', description: 'Donation page' },
    { path: '/pages/join.html', title: 'Join', description: 'Membership page' },
  ],
  
  // Governance pages (critical for operations)
  governance: [
    { path: '/pages/governance.html', title: 'Governance', description: 'Governance overview' },
    { path: '/pages/governance-portal.html', title: 'Governance Portal', description: 'Active governance' },
    { path: '/pages/financial-records.html', title: 'Financial Records', description: 'Transparency' },
  ],
  
  // All pages combined
  get all() {
    return [...this.critical, ...this.community, ...this.governance];
  }
};

// Critical assets that must load on every page
const CRITICAL_ASSETS = {
  css: [
    '/css/style.css',
    '/css/animations.css',
  ],
  js: [
    '/js/theme.js',
  ],
};

// Assets specific to homepage
const HOMEPAGE_ASSETS = {
  css: [
    '/css/parallax-hero.css',
  ],
  js: [
    '/js/parallax-hero.js',
  ],
};

// Governance portal specific assets
const GOVERNANCE_ASSETS = {
  css: [
    '/css/governance.css',
  ],
  js: [
    '/js/governance.js',
    '/js/covenant-crypto.min.js',
  ],
};

// API endpoints to verify
const API_ENDPOINTS = {
  governanceHealth: 'https://api.emergentminds.org/api/health',
  proposalsIndex: '/data/governance/proposals/index.json',
  ledger: '/data/governance/ledger/index.json',
};

// Expected UI elements
const EXPECTED_ELEMENTS = {
  header: {
    nav: 'nav, .nav, header nav',
    logo: '.logo, [class*="logo"]',
  },
  footer: {
    footer: 'footer',
    links: 'footer a',
  },
  accessibility: {
    skipLink: '[href="#main"], .skip-link',
    mainLandmark: 'main, [role="main"]',
  },
};

// PWA requirements
const PWA_CONFIG = {
  manifestPath: '/manifest.json',
  serviceWorkerPath: '/sw.js',
  requiredIcons: [192, 512],
  themeColor: '#0a0a0f',
};

// Blockchain verification (Genesis Epoch)
const BLOCKCHAIN = {
  bitcoinBlock: 934794,
  bitcoinTx: '94c6337c8cec10b10f4bef8b10649f1e3a77efac10653826e2372c93df9d9dd1',
  covenantHash: '4b44a15ea51cabdeef801fe6755935b3d2751d1210282aaf960da7981f8475ef',
};

module.exports = {
  PAGES,
  CRITICAL_ASSETS,
  HOMEPAGE_ASSETS,
  GOVERNANCE_ASSETS,
  API_ENDPOINTS,
  EXPECTED_ELEMENTS,
  PWA_CONFIG,
  BLOCKCHAIN,
};
