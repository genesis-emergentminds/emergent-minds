/* ═══════════════════════════════════════════════════════════════
   Cloudflare Worker — Governance API
   The Covenant of Emergent Minds

   Secure vote/proposal submission with server-side Ed25519
   signature verification, ledger membership validation, and
   automated GitHub commit pipeline.

   Routes:
     POST /api/submit-vote
     POST /api/submit-proposal
     GET  /api/health
   ═══════════════════════════════════════════════════════════════ */

import { validateVote, validateProposal, MAX_PAYLOAD_BYTES } from './validate.js';
import { verifyEd25519, sha256Hex, base64ToBytes } from './crypto.js';
import { canonicalJSON } from './canonical.js';
import { fetchLedger, findMember, fetchProposalsIndex, fileExists, createFile } from './github.js';

// ── CORS ──
var ALLOWED_ORIGINS = [
    'https://emergentminds.org',
    'https://www.emergentminds.org',
    'https://emergent-minds.pages.dev'
];

function corsHeaders(request) {
    var origin = request.headers.get('Origin') || '';
    var allowedOrigin = ALLOWED_ORIGINS.indexOf(origin) !== -1 ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

function jsonResponse(body, status, request) {
    return new Response(JSON.stringify(body), {
        status: status,
        headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders(request))
    });
}

// ── Rate Limiting (in-memory, per-isolate) ──
var rateLimitMap = {};
var RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds per CID

function checkRateLimit(cidHash) {
    var now = Date.now();
    var last = rateLimitMap[cidHash];
    if (last && (now - last) < RATE_LIMIT_WINDOW) {
        return false; // rate limited
    }
    rateLimitMap[cidHash] = now;
    return true;
}

// Periodic cleanup (avoid unbounded growth)
function cleanRateLimits() {
    var now = Date.now();
    var keys = Object.keys(rateLimitMap);
    for (var i = 0; i < keys.length; i++) {
        if ((now - rateLimitMap[keys[i]]) > RATE_LIMIT_WINDOW * 6) {
            delete rateLimitMap[keys[i]];
        }
    }
}

// ── Main Router ──
export default {
    async fetch(request, env) {
        // Periodic rate limit cleanup
        cleanRateLimits();

        var url = new URL(request.url);
        var path = url.pathname;

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(request)
            });
        }

        // Route: Health check
        if (path === '/api/health' && request.method === 'GET') {
            return jsonResponse({ status: 'ok', version: '1.0.0' }, 200, request);
        }

        // Route: Submit vote
        if (path === '/api/submit-vote' && request.method === 'POST') {
            return handleSubmitVote(request, env);
        }

        // Route: Submit proposal
        if (path === '/api/submit-proposal' && request.method === 'POST') {
            return handleSubmitProposal(request, env);
        }

        // 404 for everything else
        return jsonResponse({ status: 'error', error: 'NOT_FOUND', message: 'Unknown endpoint.' }, 404, request);
    }
};

// ══════════════════════════════════════════════
// VOTE SUBMISSION HANDLER
// ══════════════════════════════════════════════

async function handleSubmitVote(request, env) {
    try {
        // 1. PARSE — check payload size and parse JSON
        var contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
        if (contentLength > MAX_PAYLOAD_BYTES) {
            return jsonResponse({ status: 'rejected', error: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 50KB limit.' }, 400, request);
        }

        var bodyText = await request.text();
        if (bodyText.length > MAX_PAYLOAD_BYTES) {
            return jsonResponse({ status: 'rejected', error: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 50KB limit.' }, 400, request);
        }

        var body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'INVALID_JSON', message: 'Could not parse JSON body.' }, 400, request);
        }

        // 2. SCHEMA CHECK
        var validation = validateVote(body);
        if (!validation.valid) {
            return jsonResponse({ status: 'rejected', error: validation.error, message: validation.message }, 400, request);
        }

        var vote = validation.data;

        // Rate limit check
        if (!checkRateLimit(vote.voter_cid_hash)) {
            return jsonResponse({ status: 'rejected', error: 'RATE_LIMITED', message: 'Please wait before submitting again (1 per 10 seconds).' }, 429, request);
        }

        // 3. FETCH LEDGER
        var ledger;
        try {
            ledger = await fetchLedger(env.GITHUB_TOKEN);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'LEDGER_UNAVAILABLE', message: 'Could not fetch membership ledger.' }, 500, request);
        }

        // 4. MEMBERSHIP CHECK
        var member = findMember(ledger, vote.voter_cid_hash);
        if (!member) {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_NOT_FOUND', message: 'CID not found in membership ledger.' }, 403, request);
        }
        if (member.status && member.status !== 'active') {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_INACTIVE', message: 'Membership is not active (status: ' + member.status + ').' }, 403, request);
        }

        // 5. SIGNATURE VERIFICATION — use public key FROM LEDGER (NEVER from submission)
        var ledgerPubKey = member.public_keys && member.public_keys.ed25519;
        if (!ledgerPubKey) {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_NO_KEY', message: 'No Ed25519 public key found in ledger for this CID.' }, 403, request);
        }

        // Reconstruct signable content (must match client-side exactly)
        var signableVote = {
            commitment: vote.commitment,
            encrypted_vote: vote.encrypted_vote,
            proposal_id: vote.proposal_id,
            public_keys: vote.public_keys,
            schema_version: vote.schema_version,
            timestamp: vote.timestamp,
            vote_content: vote.vote_content,
            voter_cid_hash: vote.voter_cid_hash
        };

        var sigValid;
        try {
            sigValid = await verifyEd25519(vote.signatures.voter_ed25519, signableVote, ledgerPubKey);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'SIGNATURE_ERROR', message: 'Signature verification error: ' + e.message }, 403, request);
        }

        if (!sigValid) {
            return jsonResponse({ status: 'rejected', error: 'SIGNATURE_INVALID', message: 'Ed25519 signature verification failed against ledger public key.' }, 403, request);
        }

        // 6. PROPOSAL VALIDATION
        try {
            var proposalsIndex = await fetchProposalsIndex(env.GITHUB_TOKEN);
            var proposal = null;
            if (proposalsIndex && proposalsIndex.proposals) {
                for (var i = 0; i < proposalsIndex.proposals.length; i++) {
                    if (proposalsIndex.proposals[i].proposal_id === vote.proposal_id) {
                        proposal = proposalsIndex.proposals[i];
                        break;
                    }
                }
            }

            if (!proposal) {
                return jsonResponse({ status: 'rejected', error: 'PROPOSAL_NOT_FOUND', message: 'Proposal not found in index.' }, 422, request);
            }

            if (proposal.status !== 'voting') {
                return jsonResponse({ status: 'rejected', error: 'PROPOSAL_NOT_VOTING', message: 'Proposal is not currently in voting status (status: ' + proposal.status + ').' }, 422, request);
            }

            // Check deadline (with 60-second grace period)
            if (proposal.voting_closes) {
                var now = Math.floor(Date.now() / 1000);
                if (now > proposal.voting_closes + 60) {
                    return jsonResponse({ status: 'rejected', error: 'VOTING_CLOSED', message: 'Voting deadline has passed.' }, 422, request);
                }
            }
        } catch (e) {
            // Non-fatal: if we can't check proposals, allow the vote through
            // The duplicate check will still protect against abuse
            console.error('Proposal validation warning:', e.message);
        }

        // 7. DUPLICATE CHECK
        var votePath = 'governance/votes/' + vote.proposal_id + '/' + vote.voter_cid_hash + '.json';
        try {
            var exists = await fileExists(env.GITHUB_TOKEN, votePath);
            if (exists) {
                return jsonResponse({ status: 'rejected', error: 'DUPLICATE_VOTE', message: 'A vote from this CID already exists for this proposal.' }, 409, request);
            }
        } catch (e) {
            console.error('Duplicate check warning:', e.message);
        }

        // 8. COMMITMENT VERIFICATION
        var voteContentCanonical = canonicalJSON(vote.vote_content);
        var expectedHash = await sha256Hex(vote.commitment.nonce + voteContentCanonical);
        if (expectedHash !== vote.commitment.vote_hash) {
            return jsonResponse({ status: 'rejected', error: 'COMMITMENT_MISMATCH', message: 'Vote hash does not match commitment (nonce + canonical vote content).' }, 400, request);
        }

        // 9. COMMIT TO REPO
        var voteCanonical = canonicalJSON(vote);
        var cidPrefix = vote.voter_cid_hash.slice(0, 8);
        var commitMessage = 'Vote: ' + cidPrefix + ' on ' + vote.proposal_id + ' [' + vote.vote_content.choice + ']';

        var result;
        try {
            result = await createFile(env.GITHUB_TOKEN, votePath, voteCanonical, commitMessage);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'COMMIT_FAILED', message: 'Failed to commit vote to repository: ' + e.message }, 500, request);
        }

        // 10. RESPOND
        var commitSha = result && result.commit && result.commit.sha ? result.commit.sha : 'unknown';
        return jsonResponse({
            status: 'accepted',
            proposal_id: vote.proposal_id,
            voter_cid_prefix: cidPrefix,
            commit_sha: commitSha,
            message: 'Vote recorded successfully.'
        }, 201, request);

    } catch (e) {
        console.error('Unhandled error in handleSubmitVote:', e);
        return jsonResponse({ status: 'rejected', error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }, 500, request);
    }
}

// ══════════════════════════════════════════════
// PROPOSAL SUBMISSION HANDLER
// ══════════════════════════════════════════════

async function handleSubmitProposal(request, env) {
    try {
        // 1. PARSE
        var contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
        if (contentLength > MAX_PAYLOAD_BYTES) {
            return jsonResponse({ status: 'rejected', error: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 50KB limit.' }, 400, request);
        }

        var bodyText = await request.text();
        if (bodyText.length > MAX_PAYLOAD_BYTES) {
            return jsonResponse({ status: 'rejected', error: 'PAYLOAD_TOO_LARGE', message: 'Payload exceeds 50KB limit.' }, 400, request);
        }

        var body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'INVALID_JSON', message: 'Could not parse JSON body.' }, 400, request);
        }

        // 2. SCHEMA CHECK
        var validation = validateProposal(body);
        if (!validation.valid) {
            return jsonResponse({ status: 'rejected', error: validation.error, message: validation.message }, 400, request);
        }

        var proposal = validation.data;

        // Rate limit check
        if (!checkRateLimit(proposal.author_cid_hash)) {
            return jsonResponse({ status: 'rejected', error: 'RATE_LIMITED', message: 'Please wait before submitting again (1 per 10 seconds).' }, 429, request);
        }

        // 3. FETCH LEDGER
        var ledger;
        try {
            ledger = await fetchLedger(env.GITHUB_TOKEN);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'LEDGER_UNAVAILABLE', message: 'Could not fetch membership ledger.' }, 500, request);
        }

        // 4. MEMBERSHIP CHECK
        var member = findMember(ledger, proposal.author_cid_hash);
        if (!member) {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_NOT_FOUND', message: 'CID not found in membership ledger.' }, 403, request);
        }
        if (member.status && member.status !== 'active') {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_INACTIVE', message: 'Membership is not active.' }, 403, request);
        }

        // 5. SIGNATURE VERIFICATION — use public key FROM LEDGER
        var ledgerPubKey = member.public_keys && member.public_keys.ed25519;
        if (!ledgerPubKey) {
            return jsonResponse({ status: 'rejected', error: 'MEMBER_NO_KEY', message: 'No Ed25519 public key found in ledger for this CID.' }, 403, request);
        }

        // Reconstruct signable content for proposal (matches client-side)
        var signableProposal = {
            author_cid_hash: proposal.author_cid_hash,
            category: proposal.category,
            content: {
                adversarial_analysis: proposal.content.adversarial_analysis,
                axiom_alignment: proposal.content.axiom_alignment,
                full_text: proposal.content.full_text,
                rollback_plan: proposal.content.rollback_plan
            },
            convention_target: proposal.convention_target,
            proposal_id: proposal.proposal_id,
            schema_version: proposal.schema_version,
            submitted: proposal.submitted,
            title: proposal.title
        };

        var sigValid;
        try {
            sigValid = await verifyEd25519(proposal.signatures.author_ed25519, signableProposal, ledgerPubKey);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'SIGNATURE_ERROR', message: 'Signature verification error: ' + e.message }, 403, request);
        }

        if (!sigValid) {
            return jsonResponse({ status: 'rejected', error: 'SIGNATURE_INVALID', message: 'Ed25519 signature verification failed against ledger public key.' }, 403, request);
        }

        // 6. DUPLICATE CHECK — generate a unique filename from CID + timestamp
        var proposalFileName = proposal.proposal_id + '-' + proposal.author_cid_hash.slice(0, 8) + '-' + proposal.submitted + '.json';
        var proposalPath = 'governance/proposals/drafts/' + proposalFileName;

        try {
            var exists = await fileExists(env.GITHUB_TOKEN, proposalPath);
            if (exists) {
                return jsonResponse({ status: 'rejected', error: 'DUPLICATE_PROPOSAL', message: 'A proposal with this ID and timestamp already exists.' }, 409, request);
            }
        } catch (e) {
            console.error('Duplicate check warning:', e.message);
        }

        // 7. COMMIT TO REPO
        var proposalCanonical = canonicalJSON(proposal);
        var cidPrefix = proposal.author_cid_hash.slice(0, 8);
        var commitMessage = 'Proposal: ' + cidPrefix + ' submitted "' + proposal.title.slice(0, 60) + '"';

        var result;
        try {
            result = await createFile(env.GITHUB_TOKEN, proposalPath, proposalCanonical, commitMessage);
        } catch (e) {
            return jsonResponse({ status: 'rejected', error: 'COMMIT_FAILED', message: 'Failed to commit proposal to repository: ' + e.message }, 500, request);
        }

        // 8. RESPOND
        var commitSha = result && result.commit && result.commit.sha ? result.commit.sha : 'unknown';
        return jsonResponse({
            status: 'accepted',
            proposal_id: proposal.proposal_id,
            author_cid_prefix: cidPrefix,
            file_path: proposalPath,
            commit_sha: commitSha,
            message: 'Proposal submitted successfully.'
        }, 201, request);

    } catch (e) {
        console.error('Unhandled error in handleSubmitProposal:', e);
        return jsonResponse({ status: 'rejected', error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }, 500, request);
    }
}
