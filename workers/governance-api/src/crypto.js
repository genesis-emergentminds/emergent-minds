/* ═══════════════════════════════════════════════════════════════
   Ed25519 Signature Verification
   Uses @noble/ed25519 v2.x — same library as browser crypto bundle.
   ═══════════════════════════════════════════════════════════════ */

import * as ed25519 from '@noble/ed25519';
import { canonicalJSON } from './canonical.js';

// @noble/ed25519 v2.x requires SHA-512 to be configured.
// In Cloudflare Workers, use the Web Crypto API.
ed25519.etc.sha512Async = async function(message) {
    var hashBuffer = await crypto.subtle.digest('SHA-512', message);
    return new Uint8Array(hashBuffer);
};

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
 * Verify an Ed25519 signature against a signable object.
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
    var publicKey = base64ToBytes(publicKeyB64);
    var canonical = canonicalJSON(signableContent);
    var msgBytes = new TextEncoder().encode(canonical);

    // @noble/ed25519 v2: verify(signature, message, publicKey) → Promise<boolean>
    return ed25519.verifyAsync(signature, msgBytes, publicKey);
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
