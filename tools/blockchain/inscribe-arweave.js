#!/usr/bin/env node
/**
 * Arweave Permanent Storage — Full Document Upload
 * 
 * Uploads THE_COVENANT.md to Arweave's permaweb for permanent,
 * decentralized, censorship-resistant storage. Unlike Bitcoin/Zcash
 * (hash only), Arweave stores the FULL document.
 * 
 * Usage:
 *   node inscribe-arweave.js --generate           # Generate new wallet
 *   node inscribe-arweave.js --balance             # Check wallet balance
 *   node inscribe-arweave.js --estimate            # Estimate upload cost
 *   node inscribe-arweave.js --upload              # Upload document
 *   node inscribe-arweave.js --upload --dry-run    # Dry run (no broadcast)
 * 
 * Axiom Alignment: III (Fight Entropy), V (Adversarial Resilience)
 */

const Arweave = require('arweave');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COVENANT_PATH = path.join(__dirname, '../../docs/foundational/THE_COVENANT.md');
const WALLET_PATH = path.join(__dirname, '../../.arweave-wallet.json');
const FOUNDER_CID = 'c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb';

// Initialize Arweave client
const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
});

// ─── Commands ────────────────────────────────────────────────────────────────

async function generateWallet() {
    const key = await arweave.wallets.generate();
    const address = await arweave.wallets.jwkToAddress(key);
    
    // Save wallet (NEVER commit to git!)
    fs.writeFileSync(WALLET_PATH, JSON.stringify(key, null, 2));
    fs.chmodSync(WALLET_PATH, 0o600);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Arweave Wallet Generated');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    console.log(`  Address: ${address}`);
    console.log(`  Saved:   ${WALLET_PATH}`);
    console.log();
    console.log('  ⚠️  NEVER commit the wallet file to git!');
    console.log('  ⚠️  Back it up securely.');
    console.log();
    console.log('  Fund this wallet with a small amount of AR:');
    console.log('  • Buy AR on an exchange and send to the address above');
    console.log('  • ~0.001 AR is sufficient for a 20KB upload');
    console.log('═══════════════════════════════════════════════════════════════');
}

async function checkBalance() {
    if (!fs.existsSync(WALLET_PATH)) {
        console.error('  ❌ No wallet found. Run --generate first.');
        process.exit(1);
    }
    
    const key = JSON.parse(fs.readFileSync(WALLET_PATH));
    const address = await arweave.wallets.jwkToAddress(key);
    const balance = await arweave.wallets.getBalance(address);
    const ar = arweave.ar.winstonToAr(balance);
    
    console.log(`  Address: ${address}`);
    console.log(`  Balance: ${ar} AR (${balance} winston)`);
}

async function estimateCost() {
    const content = fs.readFileSync(COVENANT_PATH);
    const price = await arweave.transactions.getPrice(content.length);
    const ar = arweave.ar.winstonToAr(price);
    
    console.log(`  Document size: ${content.length} bytes`);
    console.log(`  Estimated cost: ${ar} AR (${price} winston)`);
}

async function upload(dryRun) {
    if (!fs.existsSync(WALLET_PATH)) {
        console.error('  ❌ No wallet found. Run --generate first.');
        process.exit(1);
    }
    
    const key = JSON.parse(fs.readFileSync(WALLET_PATH));
    const content = fs.readFileSync(COVENANT_PATH);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Arweave Document Upload');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    console.log(`  Document: THE_COVENANT.md`);
    console.log(`  Size:     ${content.length} bytes`);
    console.log(`  SHA-256:  ${hash}`);
    console.log();
    
    // Create transaction
    const tx = await arweave.createTransaction({ data: content }, key);
    
    // Add tags for discoverability
    tx.addTag('Content-Type', 'text/markdown');
    tx.addTag('App-Name', 'Covenant-Emergent-Minds');
    tx.addTag('App-Version', '1.0');
    tx.addTag('Document-Name', 'THE_COVENANT.md');
    tx.addTag('Document-Version', '1.0');
    tx.addTag('SHA-256', hash);
    tx.addTag('Protocol', 'covenant-attestation-v1');
    tx.addTag('Signer', 'genesis-bot');
    tx.addTag('Signer-CID', FOUNDER_CID);
    tx.addTag('Source-URL', 'https://www.emergentminds.org/pages/covenant.html');
    tx.addTag('Source-Repo', 'https://github.com/genesis-emergentminds/emergent-minds');
    
    // Sign
    await arweave.transactions.sign(tx, key);
    
    const cost = arweave.ar.winstonToAr(tx.reward);
    
    console.log(`  TX ID:    ${tx.id}`);
    console.log(`  Cost:     ${cost} AR`);
    console.log(`  URL:      https://arweave.net/${tx.id}`);
    console.log();
    
    if (dryRun) {
        console.log('  🔍 DRY RUN — transaction NOT submitted');
        console.log(`  Raw transaction saved for review.`);
        
        // Save for review
        fs.writeFileSync(
            path.join(__dirname, 'attestations', 'arweave-tx-preview.json'),
            JSON.stringify({
                id: tx.id,
                cost_ar: cost,
                cost_winston: tx.reward,
                size: content.length,
                sha256: hash,
                tags: tx.tags.map(t => ({
                    name: Buffer.from(t.name, 'base64').toString(),
                    value: Buffer.from(t.value, 'base64').toString(),
                })),
                url: `https://arweave.net/${tx.id}`,
            }, null, 2) + '\n'
        );
    } else {
        // Submit
        const response = await arweave.transactions.post(tx);
        
        if (response.status === 200) {
            console.log('  ✅ Transaction submitted successfully!');
            console.log(`  Permanent URL: https://arweave.net/${tx.id}`);
            console.log('  Note: May take ~10-20 minutes to be confirmed and accessible.');
        } else {
            console.error(`  ❌ Upload failed: ${response.status} ${JSON.stringify(response.data)}`);
            process.exit(1);
        }
        
        // Save record
        fs.writeFileSync(
            path.join(__dirname, 'attestations', 'arweave-inscription.json'),
            JSON.stringify({
                id: tx.id,
                cost_ar: cost,
                sha256: hash,
                url: `https://arweave.net/${tx.id}`,
                submitted_at: new Date().toISOString(),
            }, null, 2) + '\n'
        );
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--generate')) {
        await generateWallet();
    } else if (args.includes('--balance')) {
        await checkBalance();
    } else if (args.includes('--estimate')) {
        await estimateCost();
    } else if (args.includes('--upload')) {
        await upload(args.includes('--dry-run'));
    } else {
        console.log('Usage:');
        console.log('  node inscribe-arweave.js --generate        Generate new wallet');
        console.log('  node inscribe-arweave.js --balance          Check wallet balance');
        console.log('  node inscribe-arweave.js --estimate         Estimate upload cost');
        console.log('  node inscribe-arweave.js --upload           Upload document');
        console.log('  node inscribe-arweave.js --upload --dry-run Dry run (no broadcast)');
    }
}

main().catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
});
