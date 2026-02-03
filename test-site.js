const { chromium } = require('playwright');

const PAGES = [
  '/',
  '/pages/axioms.html',
  '/pages/covenant.html',
  '/pages/get-involved.html',
  '/pages/donate.html',
  '/pages/governance.html',
  '/pages/governance-portal.html',
  '/pages/genesis-epoch.html',
  '/pages/financial-records.html',
  '/pages/join.html'
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = { passed: [], failed: [] };
  
  for (const path of PAGES) {
    const page = await context.newPage();
    const failures = [];
    
    page.on('requestfailed', req => {
      failures.push(`${req.url()} - ${req.failure().errorText}`);
    });
    
    page.on('response', res => {
      if (res.status() >= 400) {
        failures.push(`${res.url()} - HTTP ${res.status()}`);
      }
    });
    
    try {
      const url = `https://www.emergentminds.org${path}`;
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      if (response.status() !== 200) {
        failures.push(`Page returned ${response.status()}`);
      }
      
      await page.waitForTimeout(1000);
      
      if (failures.length === 0) {
        results.passed.push(path);
        console.log(`✅ ${path}`);
      } else {
        results.failed.push({ path, failures });
        console.log(`❌ ${path}`);
        failures.forEach(f => console.log(`   - ${f}`));
      }
    } catch (err) {
      results.failed.push({ path, failures: [err.message] });
      console.log(`❌ ${path} - ${err.message}`);
    }
    
    await page.close();
  }
  
  await browser.close();
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Passed: ${results.passed.length}/${PAGES.length}`);
  console.log(`Failed: ${results.failed.length}/${PAGES.length}`);
  
  if (results.failed.length > 0) {
    console.log(`\nFailed pages:`);
    results.failed.forEach(f => {
      console.log(`  ${f.path}: ${f.failures.join(', ')}`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ ALL PAGES VERIFIED SUCCESSFULLY`);
    process.exit(0);
  }
})();
