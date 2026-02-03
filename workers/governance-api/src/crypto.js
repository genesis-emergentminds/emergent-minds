/* ═══════════════════════════════════════════════════════════════
   Ed25519 Signature Verification
   Uses Web Crypto API available in Cloudflare Workers.
   ═══════════════════════════════════════════════════════════════ */

import { canonicalJSON } from './canonical.js';

/**
 * Decode a base64 string to Uint8Array.
 */
export function base64ToBytes(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Convert to hex string.
 */
export function bytesToHex(bytes) {
    return Array.from(bytes).map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
}

/**
 * Verify an Ed25519 signature against a signable object using Web Crypto API.
 *
 * CRITICAL: publicKeyB64 MUST come from the ledger, NOT from the submission.
 *
 * @param {string} signatureB64 - Base64-encoded Ed25519 signature
 * @param {Object} signableContent - The object that was signed (will be canonicalised)
 * @param {string} publicKeyB64 - Base64-encoded Ed25519 public key FROM LEDGER
 * @returns {Promise<boolean>} Whether the signature is valid
 */
export async function verifyEd25519(signatureB64, signableContent, publicKeyB64) {
    var signature = base64ToBytes(signatureB64);
    var publicKeyBytes = base64ToBytes(publicKeyB64);
    var canonical = canonicalJSON(signableContent);
    var msgBytes = new TextEncoder().encode(canonical);

    // Import the public key using Web Crypto API
    var publicKey = await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        { name: 'Ed25519' },
        false,
        ['verify']
    );

    // Verify the signature
    return crypto.subtle.verify(
        { name: 'Ed25519' },
        publicKey,
        signature,
        msgBytes
    );
}

/**
 * Compute SHA-256 hash of a string.
 * Uses the Web Crypto API available in Cloudflare Workers.
 *
 * @param {string} input - String to hash
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
export async function sha256Hex(input) {
    var msgBytes = new TextEncoder().encode(input);
    var hashBuffer = await crypto.subtle.digest('SHA-256', msgBytes);
    var hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(function(b) {
        return b.toString(16).padStart(2, '0');
    }).join('');
}
