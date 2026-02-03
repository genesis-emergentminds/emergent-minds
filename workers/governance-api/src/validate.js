/* ═══════════════════════════════════════════════════════════════
   Schema Validation — Vote & Proposal submissions
   ═══════════════════════════════════════════════════════════════ */

// Strict regex for proposal IDs — prevent path traversal
var PROPOSAL_ID_RE = /^[A-Z0-9][-A-Z0-9]{0,48}[A-Z0-9]$/;

// 64 hex character pattern
var HEX64_RE = /^[0-9a-f]{64}$/;

// Base64 pattern (lenient — actual verification happens in crypto)
var BASE64_RE = /^[A-Za-z0-9+/]+=*$/;

// Valid vote choices
var VALID_CHOICES = ['approve', 'reject', 'abstain'];

// Maximum payload size (50KB)
export var MAX_PAYLOAD_BYTES = 50 * 1024;

/**
 * Validate a vote submission.
 * Returns { valid: true, data: parsedVote } or { valid: false, error: code, message: string }
 */
export function validateVote(body) {
    if (!body || typeof body !== 'object') {
        return fail('INVALID_FORMAT', 'Request body must be a JSON object.');
    }

    // schema_version
    if (body.schema_version !== 1) {
        return fail('INVALID_SCHEMA', 'schema_version must be 1.');
    }

    // proposal_id
    if (typeof body.proposal_id !== 'string' || !PROPOSAL_ID_RE.test(body.proposal_id)) {
        return fail('INVALID_PROPOSAL_ID', 'proposal_id must match pattern: uppercase letters, digits, hyphens (2-50 chars).');
    }

    // voter_cid_hash
    if (typeof body.voter_cid_hash !== 'string' || !HEX64_RE.test(body.voter_cid_hash)) {
        return fail('INVALID_CID', 'voter_cid_hash must be a 64-character hex string.');
    }

    // timestamp — integer, not future, not more than 30 days old
    if (typeof body.timestamp !== 'number' || !Number.isInteger(body.timestamp)) {
        return fail('INVALID_TIMESTAMP', 'timestamp must be an integer (Unix seconds).');
    }
    var now = Math.floor(Date.now() / 1000);
    if (body.timestamp > now + 120) {
        return fail('TIMESTAMP_FUTURE', 'timestamp is in the future.');
    }
    if (body.timestamp < now - 30 * 24 * 3600) {
        return fail('TIMESTAMP_OLD', 'timestamp is more than 30 days old.');
    }

    // vote_content
    if (!body.vote_content || typeof body.vote_content !== 'object') {
        return fail('MISSING_VOTE_CONTENT', 'vote_content is required.');
    }
    if (VALID_CHOICES.indexOf(body.vote_content.choice) === -1) {
        return fail('INVALID_CHOICE', 'vote_content.choice must be one of: approve, reject, abstain.');
    }

    // commitment
    if (!body.commitment || typeof body.commitment !== 'object') {
        return fail('MISSING_COMMITMENT', 'commitment object is required.');
    }
    if (typeof body.commitment.vote_hash !== 'string' || !HEX64_RE.test(body.commitment.vote_hash)) {
        return fail('INVALID_VOTE_HASH', 'commitment.vote_hash must be a 64-character hex string.');
    }
    if (typeof body.commitment.nonce !== 'string' || !HEX64_RE.test(body.commitment.nonce)) {
        return fail('INVALID_NONCE', 'commitment.nonce must be a 64-character hex string.');
    }

    // signatures
    if (!body.signatures || typeof body.signatures !== 'object') {
        return fail('MISSING_SIGNATURES', 'signatures object is required.');
    }
    if (typeof body.signatures.voter_ed25519 !== 'string' || !BASE64_RE.test(body.signatures.voter_ed25519)) {
        return fail('INVALID_SIGNATURE', 'signatures.voter_ed25519 must be a base64 string.');
    }

    // public_keys (included for convenience, but NOT used for verification)
    if (!body.public_keys || typeof body.public_keys !== 'object') {
        return fail('MISSING_PUBLIC_KEYS', 'public_keys object is required.');
    }
    if (typeof body.public_keys.ed25519 !== 'string' || !BASE64_RE.test(body.public_keys.ed25519)) {
        return fail('INVALID_PUBLIC_KEY', 'public_keys.ed25519 must be a base64 string.');
    }

    return { valid: true, data: body };
}

/**
 * Validate a proposal submission.
 * Returns { valid: true, data: parsedProposal } or { valid: false, error: code, message: string }
 */
export function validateProposal(body) {
    if (!body || typeof body !== 'object') {
        return fail('INVALID_FORMAT', 'Request body must be a JSON object.');
    }

    // schema_version
    if (body.schema_version !== 1) {
        return fail('INVALID_SCHEMA', 'schema_version must be 1.');
    }

    // proposal_id (drafts use PROP-DRAFT)
    if (typeof body.proposal_id !== 'string' || body.proposal_id.length < 1 || body.proposal_id.length > 50) {
        return fail('INVALID_PROPOSAL_ID', 'proposal_id must be a string (1-50 chars).');
    }

    // author_cid_hash
    if (typeof body.author_cid_hash !== 'string' || !HEX64_RE.test(body.author_cid_hash)) {
        return fail('INVALID_CID', 'author_cid_hash must be a 64-character hex string.');
    }

    // title
    if (typeof body.title !== 'string' || body.title.length < 1 || body.title.length > 200) {
        return fail('INVALID_TITLE', 'title must be a string (1-200 chars).');
    }

    // submitted timestamp
    if (typeof body.submitted !== 'number' || !Number.isInteger(body.submitted)) {
        return fail('INVALID_TIMESTAMP', 'submitted must be an integer (Unix seconds).');
    }

    // content
    if (!body.content || typeof body.content !== 'object') {
        return fail('MISSING_CONTENT', 'content object is required.');
    }
    if (typeof body.content.full_text !== 'string' || body.content.full_text.length < 1) {
        return fail('MISSING_FULL_TEXT', 'content.full_text is required.');
    }

    // signatures
    if (!body.signatures || typeof body.signatures !== 'object') {
        return fail('MISSING_SIGNATURES', 'signatures object is required.');
    }
    if (typeof body.signatures.author_ed25519 !== 'string' || !BASE64_RE.test(body.signatures.author_ed25519)) {
        return fail('INVALID_SIGNATURE', 'signatures.author_ed25519 must be a base64 string.');
    }

    return { valid: true, data: body };
}

function fail(error, message) {
    return { valid: false, error: error, message: message };
}
