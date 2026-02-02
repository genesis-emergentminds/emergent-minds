#!/usr/bin/env node
/**
 * Covenant Attestation Record Generator
 * 
 * Generates the attestation record that will be inscribed on-chain.
 * Computes SHA-256 hash of THE_COVENANT.md and produces both
 * the full JSON attestation and the compact 80-byte form.
 * 
 * Usage:
 *   node attestation.js [path-to-covenant.md]
 * 
 * Axiom Alignment: III (Fight Entropy), V (Adversarial Resilience)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_PATH = path.join(__dirname, '../../docs/foundational/THE_COVENANT.md');
const FOUNDER_CID = 'c9da93f07127f7e2d59a241b3889acb23a39280bf4e38c9b81f4c17187a196cb';

function generateAttestation(filePath) {
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Full attestation record (for Zcash 512-byte memo and Arweave)
    const fullAttestation = {
        protocol: 'covenant-attestation-v1',
        document: 'THE_COVENANT.md',
        version: '1.0',
        sha256: hash,
        size_bytes: content.length,
        url: 'https://www.emergentminds.org/pages/covenant.html',
        source: 'https://github.com/genesis-emergentminds/emergent-minds',
        signer: 'genesis-bot',
        signer_cid: FOUNDER_CID,
        timestamp: Math.floor(Date.now() / 1000),
    };
    
    // Compact form (80 bytes max, for Bitcoin OP_RETURN)
    // "COV1:" prefix (5 bytes) + SHA-256 hash (64 bytes) = 69 bytes — well within limit
    // The prefix identifies our protocol; the hash is self-evident as SHA-256
    const compact = `COV1:${hash}`;
    
    // Zcash memo form (fits in 512 bytes)
    const zcashMemo = JSON.stringify({
        p: 'covenant-attestation-v1',
        d: 'THE_COVENANT.md',
        v: '1.0',
        h: hash,
        s: content.length,
        u: 'emergentminds.org',
    });
    
    return {
        hash,
        fileSize: content.length,
        fullAttestation,
        compact,
        compactBytes: Buffer.from(compact).length,
        zcashMemo,
        zcashMemoBytes: Buffer.from(zcashMemo).length,
    };
}

function main() {
    const filePath = process.argv[2] || DEFAULT_PATH;
    
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }
    
    const att = generateAttestation(filePath);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Covenant Attestation Record');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    console.log(`  File:      ${filePath}`);
    console.log(`  SHA-256:   ${att.hash}`);
    console.log(`  Size:      ${att.fileSize} bytes`);
    console.log();
    console.log('  ─── Bitcoin OP_RETURN (compact, ≤80 bytes) ───');
    console.log(`  Data:      ${att.compact}`);
    console.log(`  Bytes:     ${att.compactBytes} / 80`);
    console.log(`  Fits:      ${att.compactBytes <= 80 ? '✅ YES' : '❌ NO — too long!'}`);
    console.log();
    console.log('  ─── Zcash Memo (≤512 bytes) ───');
    console.log(`  Data:      ${att.zcashMemo}`);
    console.log(`  Bytes:     ${att.zcashMemoBytes} / 512`);
    console.log(`  Fits:      ${att.zcashMemoBytes <= 512 ? '✅ YES' : '❌ NO — too long!'}`);
    console.log();
    console.log('  ─── Full Attestation (Arweave / file) ───');
    console.log(JSON.stringify(att.fullAttestation, null, 2));
    console.log();
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Save attestation files
    const outDir = path.join(__dirname, 'attestations');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    
    fs.writeFileSync(
        path.join(outDir, 'attestation-full.json'),
        JSON.stringify(att.fullAttestation, null, 2) + '\n'
    );
    fs.writeFileSync(
        path.join(outDir, 'attestation-compact.txt'),
        att.compact + '\n'
    );
    fs.writeFileSync(
        path.join(outDir, 'attestation-zcash-memo.txt'),
        att.zcashMemo + '\n'
    );
    
    console.log(`  Attestation files saved to: ${outDir}/`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main();
