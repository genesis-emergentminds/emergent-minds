#!/usr/bin/env node
/**
 * Bitcoin OP_RETURN Inscription Tool
 * 
 * Creates a Bitcoin transaction with an OP_RETURN output containing
 * the Covenant attestation hash. Does NOT broadcast — outputs the
 * raw transaction hex for manual review and broadcast.
 * 
 * For the Genesis Epoch inscription, we use a simple approach:
 * 1. Use BlockCypher or Blockstream API to create and sign the transaction
 * 2. Review the raw transaction
 * 3. Broadcast when ready
 * 
 * Usage:
 *   node inscribe-bitcoin.js --testnet    # Bitcoin testnet
 *   node inscribe-bitcoin.js --mainnet    # Bitcoin mainnet (requires funded wallet)
 *   node inscribe-bitcoin.js --generate   # Generate a new wallet keypair
 * 
 * Axiom Alignment: III (Fight Entropy), V (Adversarial Resilience)
 */

const bitcoin = require('bitcoinjs-lib');
const ECPairFactory = require('ecpair').default;
const ecc = require('@bitcoinerlab/secp256k1');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ECPair = ECPairFactory(ecc);

// Networks
const NETWORKS = {
    mainnet: bitcoin.networks.bitcoin,
    testnet: bitcoin.networks.testnet,
};

// API endpoints
const APIS = {
    mainnet: {
        utxo: 'https://blockstream.info/api/address/{address}/utxo',
        broadcast: 'https://blockstream.info/api/tx',
        fee: 'https://blockstream.info/api/fee-estimates',
    },
    testnet: {
        utxo: 'https://blockstream.info/testnet/api/address/{address}/utxo',
        broadcast: 'https://blockstream.info/testnet/api/tx',
        fee: 'https://blockstream.info/testnet/api/fee-estimates',
        faucet: 'https://signetfaucet.com/ or https://coinfaucet.eu/en/btc-testnet/',
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'CovenantInscriber/1.0' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                } else {
                    resolve(JSON.parse(data));
                }
            });
        }).on('error', reject);
    });
}

function httpPost(url, body) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'CovenantInscriber/1.0',
            },
        };
        const req = mod.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                } else {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ─── Wallet Management ───────────────────────────────────────────────────────

function generateWallet(networkName) {
    const network = NETWORKS[networkName];
    const keyPair = ECPair.makeRandom({ network });
    const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    const wif = keyPair.toWIF();
    
    return { address, wif, publicKey: keyPair.publicKey.toString('hex') };
}

function loadWallet(wif, networkName) {
    const network = NETWORKS[networkName];
    const keyPair = ECPair.fromWIF(wif, network);
    const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    return { keyPair, address };
}

// ─── Transaction Building ────────────────────────────────────────────────────

async function buildOpReturnTx(wif, opReturnData, networkName) {
    const network = NETWORKS[networkName];
    const api = APIS[networkName];
    const { keyPair, address } = loadWallet(wif, networkName);
    
    console.log(`  Address: ${address}`);
    console.log(`  Network: ${networkName}`);
    console.log(`  OP_RETURN data: ${opReturnData} (${Buffer.from(opReturnData).length} bytes)`);
    console.log();
    
    // Fetch UTXOs
    const utxoUrl = api.utxo.replace('{address}', address);
    console.log(`  Fetching UTXOs from ${utxoUrl}...`);
    const utxos = await httpGet(utxoUrl);
    
    if (!utxos || utxos.length === 0) {
        console.error('  ❌ No UTXOs found. Fund the address first:');
        console.error(`     Address: ${address}`);
        if (networkName === 'testnet') {
            console.error(`     Faucet: ${api.faucet}`);
        }
        process.exit(1);
    }
    
    console.log(`  Found ${utxos.length} UTXO(s), total: ${utxos.reduce((s, u) => s + u.value, 0)} sats`);
    
    // Use the largest UTXO
    const utxo = utxos.sort((a, b) => b.value - a.value)[0];
    console.log(`  Using UTXO: ${utxo.txid}:${utxo.vout} (${utxo.value} sats)`);
    
    // Estimate fee (conservative: 250 bytes * 5 sat/vbyte for testnet, higher for mainnet)
    let feeRate = 5; // sat/vbyte default
    try {
        const fees = await httpGet(api.fee);
        feeRate = Math.ceil(fees['6'] || fees['3'] || 5); // Target 6-block confirmation
        console.log(`  Fee rate: ${feeRate} sat/vbyte`);
    } catch (e) {
        console.log(`  Fee rate: ${feeRate} sat/vbyte (default, API unavailable)`);
    }
    
    // Estimated transaction size: ~150 vbytes for 1-in, 2-out (change + OP_RETURN)
    const estimatedSize = 150;
    const fee = estimatedSize * feeRate;
    const change = utxo.value - fee;
    
    if (change < 0) {
        console.error(`  ❌ Insufficient funds. Need ~${fee} sats, have ${utxo.value} sats.`);
        process.exit(1);
    }
    
    console.log(`  Fee: ${fee} sats (${estimatedSize} vbytes * ${feeRate} sat/vb)`);
    console.log(`  Change: ${change} sats → ${address}`);
    console.log();
    
    // Build transaction
    const psbt = new bitcoin.Psbt({ network });
    
    // Input
    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            script: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).output,
            value: utxo.value,
        },
    });
    
    // OP_RETURN output (no value — data only)
    const opReturnScript = bitcoin.payments.embed({ data: [Buffer.from(opReturnData)] }).output;
    psbt.addOutput({
        script: opReturnScript,
        value: 0,
    });
    
    // Change output (send remaining back to ourselves)
    if (change > 546) { // Dust limit
        psbt.addOutput({
            address: address,
            value: change,
        });
    }
    
    // Sign
    psbt.signInput(0, keyPair);
    psbt.finalizeAllInputs();
    
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();
    const txId = tx.getId();
    
    return { txHex, txId, fee, change };
}

// ─── Broadcast ───────────────────────────────────────────────────────────────

async function broadcast(txHex, networkName) {
    const api = APIS[networkName];
    console.log(`  Broadcasting to ${networkName}...`);
    const txId = await httpPost(api.broadcast, txHex);
    console.log(`  ✅ Broadcast successful!`);
    console.log(`  TX ID: ${txId}`);
    return txId;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Covenant Bitcoin Inscription Tool');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log();
    
    // Generate wallet
    if (args.includes('--generate')) {
        const networkName = args.includes('--mainnet') ? 'mainnet' : 'testnet';
        const wallet = generateWallet(networkName);
        
        console.log(`  Network:    ${networkName}`);
        console.log(`  Address:    ${wallet.address}`);
        console.log(`  Public key: ${wallet.publicKey}`);
        console.log(`  WIF:        ${wallet.wif}`);
        console.log();
        console.log('  ⚠️  SAVE THE WIF (private key) SECURELY!');
        console.log('  ⚠️  NEVER commit it to git.');
        if (networkName === 'testnet') {
            console.log();
            console.log('  Get testnet coins from:');
            console.log('    https://signetfaucet.com/');
            console.log('    https://coinfaucet.eu/en/btc-testnet/');
            console.log('    https://testnet-faucet.mempool.co/');
        }
        console.log('═══════════════════════════════════════════════════════════════');
        return;
    }
    
    // Build and optionally broadcast
    const networkName = args.includes('--mainnet') ? 'mainnet' : 'testnet';
    const shouldBroadcast = args.includes('--broadcast');
    
    // Load attestation
    const attestationFile = path.join(__dirname, 'attestations', 'attestation-compact.txt');
    if (!fs.existsSync(attestationFile)) {
        console.error('  ❌ Run `node attestation.js` first to generate attestation files.');
        process.exit(1);
    }
    const opReturnData = fs.readFileSync(attestationFile, 'utf-8').trim();
    
    // Load WIF from environment or .env file
    const wifEnvVar = networkName === 'mainnet' ? 'BTC_MAINNET_WIF' : 'BTC_TESTNET_WIF';
    let wif = process.env[wifEnvVar];
    
    if (!wif) {
        // Try loading from .env
        const envFile = path.join(__dirname, '../../.env');
        if (fs.existsSync(envFile)) {
            const envContent = fs.readFileSync(envFile, 'utf-8');
            const match = envContent.match(new RegExp(`${wifEnvVar}=(.+)`));
            if (match) wif = match[1].trim();
        }
    }
    
    if (!wif) {
        console.error(`  ❌ Set ${wifEnvVar} in environment or .env file.`);
        console.error(`     Generate a wallet: node inscribe-bitcoin.js --generate --${networkName}`);
        process.exit(1);
    }
    
    try {
        const { txHex, txId, fee, change } = await buildOpReturnTx(wif, opReturnData, networkName);
        
        console.log('  ─── Transaction Built ───');
        console.log(`  TX ID:     ${txId}`);
        console.log(`  Fee:       ${fee} sats`);
        console.log(`  Change:    ${change} sats`);
        console.log(`  Size:      ${txHex.length / 2} bytes`);
        console.log(`  Hex:       ${txHex.substring(0, 80)}...`);
        console.log();
        
        if (shouldBroadcast) {
            await broadcast(txHex, networkName);
        } else {
            console.log('  Transaction NOT broadcast. Use --broadcast to send.');
            console.log(`  Raw hex saved to: ${path.join(__dirname, 'attestations', `tx-${networkName}.hex`)}`);
            fs.writeFileSync(
                path.join(__dirname, 'attestations', `tx-${networkName}.hex`),
                txHex + '\n'
            );
        }
    } catch (err) {
        console.error(`  ❌ Error: ${err.message}`);
        process.exit(1);
    }
    
    console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
