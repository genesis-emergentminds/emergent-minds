/* ═══════════════════════════════════════════════════════════════
   Canonical JSON — Deterministic serialisation
   MUST match the browser-side canonicalJSON in governance.js exactly.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Produce a canonical JSON string with recursively sorted keys
 * and no whitespace. Identical to the governance portal implementation.
 *
 * @param {*} obj - Value to serialise
 * @returns {string} Canonical JSON string
 */
export function canonicalJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(function(item) { return canonicalJSON(item); }).join(',') + ']';
    }
    var keys = Object.keys(obj).sort();
    var pairs = keys.map(function(k) {
        return JSON.stringify(k) + ':' + canonicalJSON(obj[k]);
    });
    return '{' + pairs.join(',') + '}';
}
