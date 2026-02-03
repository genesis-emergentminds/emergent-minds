/* ═══════════════════════════════════════════════════════════════
   GitHub API Wrapper — Ledger access, file checks, and commits
   ═══════════════════════════════════════════════════════════════ */

var REPO_OWNER = 'genesis-emergentminds';
var REPO_NAME = 'emergent-minds';
var API_BASE = 'https://api.github.com';

// In-memory ledger cache (5 minute TTL)
var ledgerCache = { data: null, timestamp: 0 };
var LEDGER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory proposals cache (5 minute TTL)
var proposalsCache = { data: null, timestamp: 0 };
var PROPOSALS_CACHE_TTL = 5 * 60 * 1000;

/**
 * Build GitHub API headers with authentication.
 */
function headers(token) {
    return {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'emergent-minds-api/1.0.0',
        'Content-Type': 'application/json'
    };
}

/**
 * Fetch the membership ledger from the repository (main branch).
 * Cached for 5 minutes in-memory.
 *
 * @param {string} token - GitHub PAT
 * @returns {Promise<Object>} Parsed ledger JSON
 */
export async function fetchLedger(token) {
    var now = Date.now();
    if (ledgerCache.data && (now - ledgerCache.timestamp) < LEDGER_CACHE_TTL) {
        return ledgerCache.data;
    }

    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/governance/ledger/ledger.json?ref=main';
    var resp = await fetch(url, { headers: headers(token) });

    if (!resp.ok) {
        throw new Error('Failed to fetch ledger: HTTP ' + resp.status);
    }

    var json = await resp.json();
    // GitHub returns content as base64
    var content = JSON.parse(atob(json.content));

    ledgerCache.data = content;
    ledgerCache.timestamp = now;

    return content;
}

/**
 * Find a member in the ledger by CID hash.
 *
 * @param {Object} ledger - Parsed ledger object
 * @param {string} cidHash - CID hash to look up
 * @returns {Object|null} Ledger entry or null
 */
export function findMember(ledger, cidHash) {
    var members = ledger.entries || ledger.members;
    if (!members) return null;
    for (var i = 0; i < members.length; i++) {
        if (members[i].cid_hash === cidHash) {
            return members[i];
        }
    }
    return null;
}

/**
 * Fetch the proposals index from the repository.
 * Cached for 5 minutes.
 *
 * @param {string} token - GitHub PAT
 * @returns {Promise<Object>} Parsed proposals index
 */
export async function fetchProposalsIndex(token) {
    var now = Date.now();
    if (proposalsCache.data && (now - proposalsCache.timestamp) < PROPOSALS_CACHE_TTL) {
        return proposalsCache.data;
    }

    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/governance/proposals/index.json?ref=main';
    var resp = await fetch(url, { headers: headers(token) });

    if (!resp.ok) {
        throw new Error('Failed to fetch proposals index: HTTP ' + resp.status);
    }

    var json = await resp.json();
    var content = JSON.parse(atob(json.content));

    proposalsCache.data = content;
    proposalsCache.timestamp = now;

    return content;
}

/**
 * Check whether a file already exists in the repo.
 *
 * @param {string} token - GitHub PAT
 * @param {string} path - Repository-relative file path
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(token, path) {
    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path + '?ref=main';
    var resp = await fetch(url, { headers: headers(token) });
    return resp.ok;
}

/**
 * Create a file in the repository via the GitHub Contents API.
 *
 * @param {string} token - GitHub PAT
 * @param {string} path - Repository-relative file path
 * @param {string} content - File content (will be base64-encoded)
 * @param {string} message - Commit message
 * @returns {Promise<Object>} GitHub API response with commit info
 */
export async function createFile(token, path, content, message) {
    var url = API_BASE + '/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + path;

    var body = JSON.stringify({
        message: message,
        content: btoa(content),
        branch: 'main'
    });

    var resp = await fetch(url, {
        method: 'PUT',
        headers: headers(token),
        body: body
    });

    if (!resp.ok) {
        var errBody = await resp.text();
        throw new Error('GitHub API error (' + resp.status + '): ' + errBody);
    }

    return resp.json();
}
