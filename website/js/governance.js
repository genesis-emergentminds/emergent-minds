/* ═══════════════════════════════════════════════════════════════
   Governance Portal — The Covenant of Emergent Minds
   All crypto is client-side. Keys never leave the browser.
   ═══════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ── Constants ──
    // Primary: load from website data directory (deployed via Cloudflare Pages)
    // Fallback: try GitHub raw URL (public repo)
    var PROPOSALS_URL = '../data/governance/proposals/index.json';
    var PROPOSALS_FALLBACK_URL = 'https://raw.githubusercontent.com/genesis-emergentminds/emergent-minds/main/governance/proposals/index.json';
    var LEDGER_URL = '../data/governance/ledger.json';
    var LEDGER_FALLBACK_URL = 'https://raw.githubusercontent.com/genesis-emergentminds/emergent-minds/main/governance/ledger/ledger.json';
    var VOTES_BASE_URL = '../data/governance/votes/';

    // ── State ──
    var state = {
        identity: null,       // { cidHash, edPrivateKey, edPublicKey, memberInfo }
        proposals: null,      // proposals index object
        ledger: null,         // ledger object
        voteTallies: {},      // proposal_id → tally index
        currentTab: 'browse'
    };

    // ── Utility: Canonical JSON (matches CANONICAL_JSON.md spec) ──
    function canonicalJSON(obj) {
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

    // ── Utility: Bytes ↔ Base64 ──
    function base64ToBytes(b64) {
        var binary = atob(b64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    function bytesToBase64(bytes) {
        var binary = '';
        for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    // ── Utility: Format timestamp ──
    function formatDate(ts) {
        if (!ts) return '—';
        var d = new Date(ts * 1000);
        return d.toISOString().slice(0, 10);
    }

    function formatDateTime(ts) {
        if (!ts) return '—';
        return new Date(ts * 1000).toISOString().replace('T', ' ').replace(/\.\d+Z/, ' UTC');
    }

    // ── Utility: Safe text node creation ──
    function setText(el, text) {
        el.textContent = text;
    }

    function el(tag, attrs, children) {
        var node = document.createElement(tag);
        if (attrs) {
            Object.keys(attrs).forEach(function(k) {
                if (k === 'className') node.className = attrs[k];
                else if (k === 'dataset') {
                    Object.keys(attrs[k]).forEach(function(dk) { node.dataset[dk] = attrs[k][dk]; });
                } else node.setAttribute(k, attrs[k]);
            });
        }
        if (children) {
            (Array.isArray(children) ? children : [children]).forEach(function(c) {
                if (typeof c === 'string') node.appendChild(document.createTextNode(c));
                else if (c) node.appendChild(c);
            });
        }
        return node;
    }

    // ── Utility: Trigger download ──
    function downloadJSON(data, filename) {
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ══════════════════════════════════════════════
    // TAB NAVIGATION
    // ══════════════════════════════════════════════

    function initTabs() {
        var buttons = document.querySelectorAll('.gov-tab-btn');
        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.dataset.tab);
            });
        });

        // Read hash
        var hash = window.location.hash.replace('#', '');
        if (['browse', 'submit', 'vote', 'results'].indexOf(hash) !== -1) {
            switchTab(hash);
        } else {
            switchTab('browse');
        }

        window.addEventListener('hashchange', function() {
            var h = window.location.hash.replace('#', '');
            if (['browse', 'submit', 'vote', 'results'].indexOf(h) !== -1 && h !== state.currentTab) {
                switchTab(h);
            }
        });
    }

    function switchTab(tabId) {
        state.currentTab = tabId;
        window.location.hash = tabId;

        document.querySelectorAll('.gov-tab-btn').forEach(function(btn) {
            btn.setAttribute('aria-selected', btn.dataset.tab === tabId ? 'true' : 'false');
        });

        document.querySelectorAll('.gov-tab-panel').forEach(function(panel) {
            panel.setAttribute('aria-hidden', panel.id !== 'tab-' + tabId ? 'true' : 'false');
        });

        // Lazy-load data on first visit
        if (tabId === 'browse' && !state.proposals) loadProposals();
        if (tabId === 'vote') refreshVoteTab();
        if (tabId === 'results') refreshResultsTab();
    }

    // ══════════════════════════════════════════════
    // IDENTITY LOADING
    // ══════════════════════════════════════════════

    function initIdentity() {
        var loadBtn = document.getElementById('gov-load-keys');
        var forgetBtn = document.getElementById('gov-forget-keys');
        var fileInput = document.getElementById('gov-key-file');

        loadBtn.addEventListener('click', function() { fileInput.click(); });
        forgetBtn.addEventListener('click', forgetIdentity);
        fileInput.addEventListener('change', handleKeyFile);
    }

    function handleKeyFile(evt) {
        var file = evt.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var json = JSON.parse(e.target.result);
                processKeyFile(json);
            } catch (err) {
                showIdentityError('Invalid JSON file: ' + err.message);
            }
        };
        reader.readAsText(file);
        // Reset so same file can be re-selected
        evt.target.value = '';
    }

    function processKeyFile(json) {
        // Validate structure
        if (!json.secret_keys || !json.secret_keys.ed25519 || !json.cid_hash) {
            showIdentityError('Missing required fields. Please load your secret_keys.json file.');
            return;
        }

        var C = window.CovenantCrypto;
        if (!C) {
            showIdentityError('Crypto library not loaded. Please refresh the page.');
            return;
        }

        try {
            // Extract Ed25519 private key and derive public key
            var edPrivateKey = base64ToBytes(json.secret_keys.ed25519);
            var edPublicKey = C.ed25519.getPublicKey(edPrivateKey);

            // Extract ML-DSA-65 keys if present
            var mlPrivateKey = null;
            var mlPublicKey = null;
            if (json.secret_keys.ml_dsa_65 && C.ml_dsa65) {
                mlPrivateKey = base64ToBytes(json.secret_keys.ml_dsa_65);
                mlPublicKey = C.ml_dsa65.getPublicKey(mlPrivateKey);
            }

            // Compute CID hash: SHA-256(ml_dsa_pubkey || ed25519_pubkey)
            var cidHash;
            if (mlPublicKey) {
                var combined = new Uint8Array(mlPublicKey.length + edPublicKey.length);
                combined.set(mlPublicKey, 0);
                combined.set(edPublicKey, mlPublicKey.length);
                cidHash = C.bytesToHex(C.sha256(combined));
            } else {
                // Fallback: trust file's cid_hash (Ed25519-only identity)
                cidHash = json.cid_hash;
            }

            // Validate against ledger
            if (state.ledger) {
                var member = findMemberInLedger(cidHash);
                if (!member) {
                    showIdentityError('This identity is not in the membership ledger.');
                    return;
                }
                state.identity = {
                    cidHash: cidHash,
                    edPrivateKey: edPrivateKey,
                    edPublicKey: edPublicKey,
                    mlPrivateKey: mlPrivateKey,
                    mlPublicKey: mlPublicKey,
                    memberInfo: member
                };
            } else {
                // Ledger not loaded yet — accept identity, check later
                state.identity = {
                    cidHash: cidHash,
                    edPrivateKey: edPrivateKey,
                    edPublicKey: edPublicKey,
                    mlPrivateKey: mlPrivateKey,
                    mlPublicKey: mlPublicKey,
                    memberInfo: null
                };
                // Try loading ledger in background
                loadLedger().then(function() {
                    if (state.identity && state.ledger) {
                        var m = findMemberInLedger(state.identity.cidHash);
                        if (m) {
                            state.identity.memberInfo = m;
                            updateIdentityUI();
                        }
                    }
                });
            }

            updateIdentityUI();
        } catch (err) {
            showIdentityError('Error processing keys: ' + err.message);
        }
    }

    function findMemberInLedger(cidHash) {
        if (!state.ledger) return null;
        // Support both "entries" (current schema) and "members" (legacy)
        var members = state.ledger.entries || state.ledger.members;
        if (!members) return null;
        for (var i = 0; i < members.length; i++) {
            if (members[i].cid_hash === cidHash) {
                return members[i];
            }
        }
        return null;
    }

    function forgetIdentity() {
        if (state.identity) {
            // Zero out key material
            if (state.identity.edPrivateKey) {
                for (var i = 0; i < state.identity.edPrivateKey.length; i++) {
                    state.identity.edPrivateKey[i] = 0;
                }
            }
            if (state.identity.mlPrivateKey) {
                for (var j = 0; j < state.identity.mlPrivateKey.length; j++) {
                    state.identity.mlPrivateKey[j] = 0;
                }
            }
            state.identity = null;
        }
        updateIdentityUI();
    }

    function updateIdentityUI() {
        var bar = document.getElementById('gov-identity-bar');
        var notLoaded = document.getElementById('gov-id-not-loaded');
        var loaded = document.getElementById('gov-id-loaded');

        if (state.identity) {
            bar.classList.add('loaded');
            notLoaded.style.display = 'none';
            loaded.style.display = 'block';

            var cidEl = document.getElementById('gov-id-cid');
            setText(cidEl, state.identity.cidHash);

            var statusEl = document.getElementById('gov-id-member-status');
            if (state.identity.memberInfo) {
                var info = state.identity.memberInfo;
                var statusText = 'Status: ' + (info.status || 'Active');
                if (info.registered_at) statusText += ' since ' + formatDate(info.registered_at);
                var sigTypes = 'Ed25519';
                if (state.identity.mlPrivateKey) sigTypes = 'ML-DSA-65 + Ed25519 (dual-sign)';
                statusText += ' · Signing: ' + sigTypes;
                setText(statusEl, statusText);
            } else {
                setText(statusEl, 'Ledger not yet verified — identity loaded from file');
            }
        } else {
            bar.classList.remove('loaded');
            notLoaded.style.display = 'block';
            loaded.style.display = 'none';
        }
    }

    function showIdentityError(msg) {
        var errEl = document.getElementById('gov-id-error');
        setText(errEl, msg);
        errEl.style.display = 'block';
        setTimeout(function() { errEl.style.display = 'none'; }, 6000);
    }

    // ══════════════════════════════════════════════
    // DATA LOADING
    // ══════════════════════════════════════════════

    function loadProposals() {
        var container = document.getElementById('gov-proposals-list');
        container.innerHTML = '';
        container.appendChild(el('div', { className: 'gov-loading' }, 'Loading proposals'));

        fetch(PROPOSALS_URL)
            .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .catch(function() {
                return fetch(PROPOSALS_FALLBACK_URL)
                    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); });
            })
            .then(function(data) {
                state.proposals = data;
                renderProposals();
            })
            .catch(function() {
                container.innerHTML = '';
                container.appendChild(el('div', { className: 'gov-empty' }, [
                    el('div', { className: 'gov-empty-icon' }, '📋'),
                    el('p', null, 'No proposals yet. The governance system is ready — be the first to submit a proposal!')
                ]));
            });
    }

    function loadLedger() {
        return fetch(LEDGER_URL)
            .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .catch(function() {
                return fetch(LEDGER_FALLBACK_URL)
                    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); });
            })
            .then(function(data) {
                state.ledger = data;
                return data;
            })
            .catch(function() {
                state.ledger = null;
                return null;
            });
    }

    function loadVoteTally(proposalId) {
        var url = VOTES_BASE_URL + proposalId + '/index.json';
        return fetch(url)
            .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function(data) {
                state.voteTallies[proposalId] = data;
                return data;
            })
            .catch(function() {
                return null;
            });
    }

    // ══════════════════════════════════════════════
    // BROWSE PROPOSALS TAB
    // ══════════════════════════════════════════════

    function renderProposals() {
        var container = document.getElementById('gov-proposals-list');
        container.innerHTML = '';

        if (!state.proposals || !state.proposals.proposals || state.proposals.proposals.length === 0) {
            container.appendChild(el('div', { className: 'gov-empty' }, [
                el('div', { className: 'gov-empty-icon' }, '📋'),
                el('p', null, 'No proposals yet. Be the first to submit one!')
            ]));
            return;
        }

        var proposals = state.proposals.proposals;

        // Group by status
        var active = proposals.filter(function(p) { return ['draft', 'review', 'voting'].indexOf(p.status) !== -1; });
        var completed = proposals.filter(function(p) { return ['passed', 'rejected', 'tabled'].indexOf(p.status) !== -1; });

        if (active.length > 0) {
            container.appendChild(el('div', { className: 'gov-section-label' }, 'Active Proposals'));
            var activeList = el('div', { className: 'gov-proposal-list' });
            active.forEach(function(p) { activeList.appendChild(buildProposalCard(p)); });
            container.appendChild(activeList);
        }

        if (completed.length > 0) {
            container.appendChild(el('div', { className: 'gov-section-label' }, 'Completed Proposals'));
            var completedList = el('div', { className: 'gov-proposal-list' });
            completed.forEach(function(p) { completedList.appendChild(buildProposalCard(p)); });
            container.appendChild(completedList);
        }
    }

    function buildProposalCard(proposal) {
        var card = el('div', { className: 'gov-proposal-card', dataset: { id: proposal.proposal_id } });

        // Dry run banner
        if (proposal.dry_run) {
            card.appendChild(el('div', { className: 'gov-notice gov-notice-warn', style: 'margin-bottom: var(--space-sm); font-size: 0.8125rem; padding: var(--space-xs) var(--space-sm);' },
                '⚠️ DRY RUN — EXERCISE ONLY. Not a real proposal.'));
        }

        // Header: ID + Category
        var header = el('div', { className: 'gov-proposal-card-header' }, [
            el('span', { className: 'gov-proposal-id' }, proposal.proposal_id),
            el('span', { className: 'gov-proposal-category' }, proposal.category || 'standard')
        ]);
        card.appendChild(header);

        // Title
        var title = el('h3', { className: 'gov-proposal-title' }, proposal.title || 'Untitled Proposal');
        card.appendChild(title);

        // Meta
        var statusClass = 'gov-status gov-status-' + (proposal.status || 'draft');
        var meta = el('div', { className: 'gov-proposal-meta' }, [
            el('span', null, [
                el('span', { className: statusClass }, [
                    el('span', { className: 'gov-status-dot' }),
                    document.createTextNode(' ' + capitalize(proposal.status || 'draft'))
                ])
            ]),
            el('span', null, 'Author: ' + truncHash(proposal.author_cid_hash)),
            el('span', null, 'Submitted: ' + formatDate(proposal.submitted))
        ]);

        if (proposal.voting_closes) {
            meta.appendChild(el('span', null, 'Deadline: ' + formatDate(proposal.voting_closes)));
        }
        card.appendChild(meta);

        // Tally bar (if tally data available in state)
        var tally = state.voteTallies[proposal.proposal_id];
        if (tally && tally.tally) {
            card.appendChild(buildTallyBar(tally));
        }

        // Actions
        var actions = el('div', { className: 'gov-proposal-actions' });
        var viewBtn = el('button', { className: 'gov-btn-sm', dataset: { action: 'view', proposal: proposal.proposal_id } }, 'View Details');
        viewBtn.addEventListener('click', function() { viewProposalDetail(proposal.proposal_id); });
        actions.appendChild(viewBtn);

        if (proposal.status === 'voting' && state.identity) {
            var voteBtn = el('button', { className: 'btn btn-primary gov-btn-sm', dataset: { action: 'vote', proposal: proposal.proposal_id } }, 'Cast Vote');
            voteBtn.addEventListener('click', function() {
                switchTab('vote');
                selectProposalForVoting(proposal.proposal_id);
            });
            actions.appendChild(voteBtn);
        }
        card.appendChild(actions);

        // Load tally in background
        if (!tally) {
            loadVoteTally(proposal.proposal_id).then(function(t) {
                if (t) {
                    var existingTally = card.querySelector('.gov-tally-bar');
                    if (!existingTally) {
                        var bar = buildTallyBar(t);
                        card.insertBefore(bar, actions);
                    }
                }
            });
        }

        return card;
    }

    function buildTallyBar(tally) {
        var t = tally.tally;
        var total = t.total_cast || (t.approve + t.reject + t.abstain);
        if (total === 0) return el('div');

        var wrapper = el('div', { className: 'gov-tally-bar' });

        // Labels
        var labels = el('div', { className: 'gov-tally-labels' }, [
            el('span', null, '✅ ' + t.approve + ' approve'),
            el('span', null, '❌ ' + t.reject + ' reject'),
            el('span', null, '➖ ' + t.abstain + ' abstain')
        ]);
        wrapper.appendChild(labels);

        // Track
        var track = el('div', { className: 'gov-tally-track' });
        if (t.approve > 0) track.appendChild(el('div', { className: 'gov-tally-approve', style: 'width:' + (t.approve / total * 100) + '%' }));
        if (t.reject > 0) track.appendChild(el('div', { className: 'gov-tally-reject', style: 'width:' + (t.reject / total * 100) + '%' }));
        if (t.abstain > 0) track.appendChild(el('div', { className: 'gov-tally-abstain', style: 'width:' + (t.abstain / total * 100) + '%' }));
        wrapper.appendChild(track);

        // Quorum / engagement checks
        if (tally.quorum_met !== undefined) {
            var checks = el('div', { className: 'gov-tally-check' });
            var qClass = tally.quorum_met ? 'pass' : 'fail';
            var qIcon = tally.quorum_met ? '✅' : '❌';
            checks.appendChild(el('span', { className: qClass }, qIcon + ' Quorum: ' + Math.round((tally.quorum_ratio || 0) * 100) + '% (need ' + Math.round((tally.quorum_required || 0) * 100) + '%)'));
            wrapper.appendChild(checks);
        }

        return wrapper;
    }

    function viewProposalDetail(proposalId) {
        // Find proposal in index
        var proposal = null;
        if (state.proposals && state.proposals.proposals) {
            for (var i = 0; i < state.proposals.proposals.length; i++) {
                if (state.proposals.proposals[i].proposal_id === proposalId) {
                    proposal = state.proposals.proposals[i];
                    break;
                }
            }
        }
        if (!proposal) return;

        // Try to load full proposal JSON
        var fileName = proposal.file || (proposalId + '.json');
        var fullUrl = PROPOSALS_URL.replace('index.json', fileName);
        fetch(fullUrl)
            .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .catch(function() {
                return fetch(PROPOSALS_FALLBACK_URL.replace('index.json', fileName))
                    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); });
            })
            .then(function(full) {
                showProposalModal(full, proposal);
            })
            .catch(function() {
                // Show what we have from the index
                showProposalModal(null, proposal);
            });
    }

    function showProposalModal(fullProposal, indexEntry) {
        var overlay = document.getElementById('gov-modal-overlay');
        var modal = document.getElementById('gov-modal');
        var body = document.getElementById('gov-modal-body');
        body.innerHTML = '';

        var p = fullProposal || indexEntry;

        // Title
        var title = document.getElementById('gov-modal-title');
        setText(title, (p.proposal_id || indexEntry.proposal_id) + ': ' + (p.title || indexEntry.title));

        // Dry run notice
        if (p.dry_run || indexEntry.dry_run) {
            body.appendChild(el('div', { className: 'gov-notice gov-notice-warn' }, [
                el('strong', null, '⚠️ DRY RUN — EXERCISE ONLY'),
                el('p', null, p.dry_run_notice || 'This proposal is part of a governance infrastructure test. It is NOT a real proposal and carries no binding or advisory weight.')
            ]));
        }

        // Meta
        body.appendChild(el('div', { className: 'gov-proposal-meta' }, [
            el('span', null, 'Category: ' + capitalize(p.category || indexEntry.category || 'standard')),
            el('span', null, 'Author: ' + truncHash(p.author_cid_hash || indexEntry.author_cid_hash)),
            el('span', null, 'Status: ' + capitalize(p.status || indexEntry.status || 'draft'))
        ]));

        // Content sections (if full proposal loaded)
        if (fullProposal && fullProposal.content) {
            var c = fullProposal.content;

            if (c.full_text) {
                body.appendChild(el('h3', null, 'Full Text'));
                var textBlock = el('div', { className: 'gov-review-block' });
                var pre = el('pre', null, c.full_text);
                textBlock.appendChild(pre);
                body.appendChild(textBlock);
            }

            if (c.axiom_alignment) {
                body.appendChild(el('h3', null, 'Axiom Alignment'));
                var aa = c.axiom_alignment;
                var aaBlock = el('div', { className: 'gov-review-block' });
                ['axiom_i', 'axiom_ii', 'axiom_iii', 'axiom_iv', 'axiom_v'].forEach(function(key, idx) {
                    if (aa[key]) {
                        aaBlock.appendChild(el('p', null, [
                            el('strong', null, 'Axiom ' + (idx + 1) + ': '),
                            document.createTextNode(aa[key])
                        ]));
                    }
                });
                body.appendChild(aaBlock);
            }

            if (c.adversarial_analysis) {
                body.appendChild(el('h3', null, 'Adversarial Analysis'));
                body.appendChild(el('div', { className: 'gov-review-block' }, [el('p', null, c.adversarial_analysis)]));
            }

            if (c.rollback_plan) {
                body.appendChild(el('h3', null, 'Rollback Plan'));
                body.appendChild(el('div', { className: 'gov-review-block' }, [el('p', null, c.rollback_plan)]));
            }
        }

        // Timeline
        if (fullProposal && fullProposal.timeline) {
            body.appendChild(el('h3', null, 'Timeline'));
            var tl = fullProposal.timeline;
            var tlBlock = el('div', { className: 'gov-review-block' });
            var entries = [
                ['Submitted', tl.submitted],
                ['Review Period Ends', tl.review_period_ends],
                ['Voting Opens', tl.voting_opens],
                ['Voting Closes', tl.voting_closes],
                ['Grace Period Ends', tl.grace_period_ends]
            ];
            entries.forEach(function(pair) {
                if (pair[1]) {
                    tlBlock.appendChild(el('p', null, pair[0] + ': ' + formatDate(pair[1])));
                }
            });
            body.appendChild(tlBlock);
        }

        // Tally
        var tally = state.voteTallies[indexEntry.proposal_id];
        if (tally) {
            body.appendChild(el('h3', null, 'Vote Summary'));
            body.appendChild(buildTallyBar(tally));
        }

        // Actions
        var modalActions = el('div', { className: 'gov-proposal-actions', style: 'margin-top: var(--space-lg)' });
        if (indexEntry.status === 'voting' && state.identity) {
            var castBtn = el('button', { className: 'btn btn-primary' }, 'Cast Vote');
            castBtn.addEventListener('click', function() {
                overlay.classList.remove('active');
                switchTab('vote');
                selectProposalForVoting(indexEntry.proposal_id);
            });
            modalActions.appendChild(castBtn);
        }
        if (fullProposal) {
            var dlBtn = el('button', { className: 'btn btn-secondary' }, 'Download Proposal JSON');
            dlBtn.addEventListener('click', function() {
                downloadJSON(fullProposal, indexEntry.proposal_id + '.json');
            });
            modalActions.appendChild(dlBtn);
        }
        body.appendChild(modalActions);

        overlay.classList.add('active');
    }

    function initModal() {
        var overlay = document.getElementById('gov-modal-overlay');
        var closeBtn = document.getElementById('gov-modal-close');

        closeBtn.addEventListener('click', function() { overlay.classList.remove('active'); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.classList.remove('active');
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
            }
        });
    }

    // ══════════════════════════════════════════════
    // SUBMIT PROPOSAL TAB (WIZARD)
    // ══════════════════════════════════════════════

    var wizardStep = 0;

    function initWizard() {
        document.getElementById('gov-wiz-next-0').addEventListener('click', function() { goWizardStep(1); });
        document.getElementById('gov-wiz-back-1').addEventListener('click', function() { goWizardStep(0); });
        document.getElementById('gov-wiz-next-1').addEventListener('click', function() { goWizardStep(2); });
        document.getElementById('gov-wiz-back-2').addEventListener('click', function() { goWizardStep(1); });
        document.getElementById('gov-wiz-sign').addEventListener('click', signAndDownloadProposal);

        // Radio group styling
        document.querySelectorAll('.gov-radio-option input[type="radio"]').forEach(function(radio) {
            radio.addEventListener('change', function() {
                document.querySelectorAll('.gov-radio-option').forEach(function(opt) { opt.classList.remove('selected'); });
                radio.closest('.gov-radio-option').classList.add('selected');
            });
        });
    }

    function goWizardStep(step) {
        // Validate current step
        if (step > wizardStep) {
            if (!validateWizardStep(wizardStep)) return;
        }

        // If going to review (step 2), populate preview
        if (step === 2) populateReview();

        wizardStep = step;

        document.querySelectorAll('.gov-wizard-page').forEach(function(pg, idx) {
            pg.classList.toggle('active', idx === step);
        });

        document.querySelectorAll('.gov-wizard-step').forEach(function(s, idx) {
            s.classList.remove('active', 'completed');
            if (idx === step) s.classList.add('active');
            else if (idx < step) s.classList.add('completed');
        });
    }

    function validateWizardStep(step) {
        if (step === 0) {
            var title = document.getElementById('gov-prop-title').value.trim();
            var category = document.querySelector('input[name="gov-prop-category"]:checked');
            if (!title) { alert('Please enter a proposal title.'); return false; }
            if (!category) { alert('Please select a category.'); return false; }
            return true;
        }
        if (step === 1) {
            var fullText = document.getElementById('gov-prop-text').value.trim();
            if (!fullText) { alert('Please enter the proposal text.'); return false; }
            // Check axiom alignment
            for (var i = 1; i <= 5; i++) {
                var val = document.getElementById('gov-prop-axiom-' + i).value.trim();
                if (!val) { alert('Please provide alignment analysis for Axiom ' + i + '.'); return false; }
            }
            var adversarial = document.getElementById('gov-prop-adversarial').value.trim();
            if (!adversarial) { alert('Please provide an adversarial analysis.'); return false; }
            var rollback = document.getElementById('gov-prop-rollback').value.trim();
            if (!rollback) { alert('Please provide a rollback plan.'); return false; }
            return true;
        }
        return true;
    }

    function populateReview() {
        var rv = document.getElementById('gov-review-content');
        rv.innerHTML = '';

        var title = document.getElementById('gov-prop-title').value.trim();
        var category = document.querySelector('input[name="gov-prop-category"]:checked');
        var catVal = category ? category.value : '';

        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Title'),
            el('p', null, title)
        ]));

        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Category'),
            el('p', null, capitalize(catVal))
        ]));

        var fullText = document.getElementById('gov-prop-text').value.trim();
        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Full Text'),
            el('pre', null, fullText)
        ]));

        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Axiom Alignment'),
            el('p', null, [el('strong', null, 'I: '), document.createTextNode(document.getElementById('gov-prop-axiom-1').value.trim())]),
            el('p', null, [el('strong', null, 'II: '), document.createTextNode(document.getElementById('gov-prop-axiom-2').value.trim())]),
            el('p', null, [el('strong', null, 'III: '), document.createTextNode(document.getElementById('gov-prop-axiom-3').value.trim())]),
            el('p', null, [el('strong', null, 'IV: '), document.createTextNode(document.getElementById('gov-prop-axiom-4').value.trim())]),
            el('p', null, [el('strong', null, 'V: '), document.createTextNode(document.getElementById('gov-prop-axiom-5').value.trim())])
        ]));

        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Adversarial Analysis'),
            el('p', null, document.getElementById('gov-prop-adversarial').value.trim())
        ]));

        rv.appendChild(el('div', { className: 'gov-review-block' }, [
            el('h4', null, 'Rollback Plan'),
            el('p', null, document.getElementById('gov-prop-rollback').value.trim())
        ]));

        // Identity notice
        if (state.identity) {
            rv.appendChild(el('div', { className: 'gov-notice gov-notice-info' },
                'Signing as: ' + state.identity.cidHash));
        } else {
            rv.appendChild(el('div', { className: 'gov-notice gov-notice-warn' }, [
                el('strong', null, '⚠️ No identity loaded. '),
                document.createTextNode('Load your secret_keys.json to sign this proposal.')
            ]));
        }
    }

    function signAndDownloadProposal() {
        if (!state.identity) {
            alert('Please load your secret_keys.json first.');
            return;
        }

        var C = window.CovenantCrypto;
        if (!C) { alert('Crypto library not loaded.'); return; }

        var now = Math.floor(Date.now() / 1000);
        var category = document.querySelector('input[name="gov-prop-category"]:checked').value;

        var proposal = {
            schema_version: 1,
            proposal_id: 'PROP-DRAFT',
            title: document.getElementById('gov-prop-title').value.trim(),
            author_cid_hash: state.identity.cidHash,
            submitted: now,
            convention_target: 1,
            category: category,
            status: 'draft',
            content: {
                full_text: document.getElementById('gov-prop-text').value.trim(),
                axiom_alignment: {
                    axiom_i: document.getElementById('gov-prop-axiom-1').value.trim(),
                    axiom_ii: document.getElementById('gov-prop-axiom-2').value.trim(),
                    axiom_iii: document.getElementById('gov-prop-axiom-3').value.trim(),
                    axiom_iv: document.getElementById('gov-prop-axiom-4').value.trim(),
                    axiom_v: document.getElementById('gov-prop-axiom-5').value.trim()
                },
                adversarial_analysis: document.getElementById('gov-prop-adversarial').value.trim(),
                rollback_plan: document.getElementById('gov-prop-rollback').value.trim(),
                advocate_response: null
            },
            timeline: {
                submitted: now,
                review_period_ends: null,
                final_freeze: null,
                voting_opens: null,
                voting_closes: null,
                grace_period_ends: null
            },
            thresholds: getThresholds(category),
            signatures: {
                author_ed25519: null,
                author_ml_dsa_65: null,
                signed_content_hash: null
            }
        };

        // Build signable content (matches spec: excludes timeline, thresholds, signatures, status)
        var signable = {
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

        var canonical = canonicalJSON(signable);
        var msgBytes = new TextEncoder().encode(canonical);
        var contentHash = C.bytesToHex(C.sha256(msgBytes));

        try {
            // Ed25519 signature
            var edSig = C.ed25519.sign(msgBytes, state.identity.edPrivateKey);
            proposal.signatures.author_ed25519 = bytesToBase64(edSig);
            proposal.signatures.signed_content_hash = contentHash;

            // Verify Ed25519
            var edValid = C.ed25519.verify(edSig, msgBytes, state.identity.edPublicKey);
            if (!edValid) {
                alert('Ed25519 signature self-verification failed. Please try again.');
                return;
            }

            // ML-DSA-65 signature (dual-sign if keys available)
            if (state.identity.mlPrivateKey && C.ml_dsa65) {
                var mlSig = C.ml_dsa65.sign(msgBytes, state.identity.mlPrivateKey);
                proposal.signatures.author_ml_dsa_65 = bytesToBase64(mlSig);

                // Verify ML-DSA-65
                var mlValid = C.ml_dsa65.verify(mlSig, msgBytes, state.identity.mlPublicKey);
                if (!mlValid) {
                    alert('ML-DSA-65 signature self-verification failed. Please try again.');
                    return;
                }
            } else {
                proposal.signatures.author_ml_dsa_65 = null;
            }

            downloadJSON(proposal, 'proposal-draft-' + now + '.json');

            // Show success
            goWizardStep(3);
        } catch (err) {
            alert('Signing error: ' + err.message);
        }
    }

    function getThresholds(category) {
        var map = {
            'procedural': { passage: 0.50, quorum: 0.25, engagement_minimum: 0.382 },
            'policy': { passage: 0.667, quorum: 0.33, engagement_minimum: 0.382 },
            'axiom_interpretation': { passage: 0.75, quorum: 0.50, engagement_minimum: 0.382 },
            'emergency_t2': { passage: 0.618, quorum: 0.50, engagement_minimum: 0.382 },
            'emergency_t3': { passage: 0.7862, quorum: 0.667, engagement_minimum: 0.382 }
        };
        return map[category] || map['procedural'];
    }

    // ══════════════════════════════════════════════
    // VOTE TAB
    // ══════════════════════════════════════════════

    var selectedVote = null;

    function refreshVoteTab() {
        var selectEl = document.getElementById('gov-vote-proposal-select');
        // Clear existing options except first
        while (selectEl.options.length > 1) selectEl.remove(1);

        if (state.proposals && state.proposals.proposals) {
            var voting = state.proposals.proposals.filter(function(p) { return p.status === 'voting'; });
            voting.forEach(function(p) {
                var opt = document.createElement('option');
                opt.value = p.proposal_id;
                opt.textContent = p.proposal_id + ': ' + p.title;
                selectEl.appendChild(opt);
            });
        }
    }

    function selectProposalForVoting(proposalId) {
        var selectEl = document.getElementById('gov-vote-proposal-select');
        selectEl.value = proposalId;
        selectEl.dispatchEvent(new Event('change'));
    }

    function initVoteTab() {
        var selectEl = document.getElementById('gov-vote-proposal-select');
        selectEl.addEventListener('change', function() {
            var pid = selectEl.value;
            var detail = document.getElementById('gov-vote-detail');
            if (pid) {
                detail.style.display = 'block';
                var proposal = findProposal(pid);
                if (proposal) {
                    setText(document.getElementById('gov-vote-prop-title'), proposal.title);
                    setText(document.getElementById('gov-vote-prop-status'), capitalize(proposal.status));
                    setText(document.getElementById('gov-vote-prop-deadline'), formatDate(proposal.voting_closes));
                }
            } else {
                detail.style.display = 'none';
            }
            selectedVote = null;
            document.querySelectorAll('.gov-vote-btn').forEach(function(b) { b.setAttribute('aria-pressed', 'false'); });
        });

        document.querySelectorAll('.gov-vote-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                selectedVote = btn.dataset.choice;
                document.querySelectorAll('.gov-vote-btn').forEach(function(b) { b.setAttribute('aria-pressed', 'false'); });
                btn.setAttribute('aria-pressed', 'true');
            });
        });

        document.getElementById('gov-vote-sign').addEventListener('click', signAndDownloadVote);
    }

    function signAndDownloadVote() {
        if (!state.identity) { alert('Please load your secret_keys.json first.'); return; }

        var C = window.CovenantCrypto;
        if (!C) { alert('Crypto library not loaded.'); return; }

        var proposalId = document.getElementById('gov-vote-proposal-select').value;
        if (!proposalId) { alert('Please select a proposal.'); return; }
        if (!selectedVote) { alert('Please select your vote.'); return; }

        var now = Math.floor(Date.now() / 1000);
        var reasoning = document.getElementById('gov-vote-reasoning').value.trim();

        var voteContent = {
            choice: selectedVote,
            reasoning: reasoning || null
        };

        var vote = {
            schema_version: 1,
            proposal_id: proposalId,
            voter_cid_hash: state.identity.cidHash,
            timestamp: now,
            vote_content: voteContent,
            commitment: {
                vote_hash: null,
                nonce: null
            },
            encrypted_vote: null,
            signatures: {
                voter_ed25519: null,
                voter_ml_dsa_65: null
            },
            public_keys: {
                ed25519: bytesToBase64(state.identity.edPublicKey),
                ml_dsa_65: state.identity.mlPublicKey ? bytesToBase64(state.identity.mlPublicKey) : null
            }
        };

        // Compute vote hash (public voting MVP — no encryption)
        var voteContentCanonical = canonicalJSON(voteContent);
        var nonce = C.bytesToHex(C.randomBytes(32));
        var hashInput = new TextEncoder().encode(nonce + voteContentCanonical);
        vote.commitment.vote_hash = C.bytesToHex(C.sha256(hashInput));
        vote.commitment.nonce = nonce;

        // Sign the full vote (minus signatures field)
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

        var canonical = canonicalJSON(signableVote);
        var msgBytes = new TextEncoder().encode(canonical);

        try {
            // Ed25519 signature
            var edSig = C.ed25519.sign(msgBytes, state.identity.edPrivateKey);
            vote.signatures.voter_ed25519 = bytesToBase64(edSig);

            // Self-verify Ed25519
            var edValid = C.ed25519.verify(edSig, msgBytes, state.identity.edPublicKey);
            if (!edValid) { alert('Ed25519 signature self-verification failed.'); return; }

            // ML-DSA-65 dual-sign if keys available
            if (state.identity.mlPrivateKey && C.ml_dsa65) {
                var mlSig = C.ml_dsa65.sign(msgBytes, state.identity.mlPrivateKey);
                vote.signatures.voter_ml_dsa_65 = bytesToBase64(mlSig);

                var mlValid = C.ml_dsa65.verify(mlSig, msgBytes, state.identity.mlPublicKey);
                if (!mlValid) { alert('ML-DSA-65 signature self-verification failed.'); return; }
            } else {
                vote.signatures.voter_ml_dsa_65 = null;
            }

            var prefix = state.identity.cidHash.slice(0, 8);
            downloadJSON(vote, 'vote-' + proposalId + '-' + prefix + '.json');

            // Show confirmation
            var confirmation = document.getElementById('gov-vote-confirmation');
            confirmation.style.display = 'block';
            setText(document.getElementById('gov-vote-confirm-proposal'), proposalId);
            setText(document.getElementById('gov-vote-confirm-choice'), capitalize(selectedVote));
            setText(document.getElementById('gov-vote-confirm-time'), formatDateTime(now));
            setText(document.getElementById('gov-vote-confirm-hash'), vote.commitment.vote_hash);
        } catch (err) {
            alert('Signing error: ' + err.message);
        }
    }

    // ══════════════════════════════════════════════
    // RESULTS & VERIFY TAB
    // ══════════════════════════════════════════════

    function refreshResultsTab() {
        var selectEl = document.getElementById('gov-results-proposal-select');
        while (selectEl.options.length > 1) selectEl.remove(1);

        if (state.proposals && state.proposals.proposals) {
            state.proposals.proposals.forEach(function(p) {
                var opt = document.createElement('option');
                opt.value = p.proposal_id;
                opt.textContent = p.proposal_id + ': ' + p.title + ' (' + capitalize(p.status) + ')';
                selectEl.appendChild(opt);
            });
        }
    }

    function initResultsTab() {
        var selectEl = document.getElementById('gov-results-proposal-select');
        selectEl.addEventListener('change', function() {
            var pid = selectEl.value;
            var detail = document.getElementById('gov-results-detail');
            if (pid) {
                detail.style.display = 'block';
                loadAndShowResults(pid);
            } else {
                detail.style.display = 'none';
            }
        });

        // Verify vote file button
        document.getElementById('gov-verify-vote-btn').addEventListener('click', function() {
            document.getElementById('gov-verify-vote-file').click();
        });
        document.getElementById('gov-verify-vote-file').addEventListener('change', handleVerifyVoteFile);
    }

    function loadAndShowResults(proposalId) {
        var container = document.getElementById('gov-results-content');
        container.innerHTML = '';
        container.appendChild(el('div', { className: 'gov-loading' }, 'Loading results'));

        var proposal = findProposal(proposalId);
        loadVoteTally(proposalId).then(function(tally) {
            container.innerHTML = '';

            if (!tally) {
                container.appendChild(el('div', { className: 'gov-empty' }, [
                    el('div', { className: 'gov-empty-icon' }, '📊'),
                    el('p', null, 'No vote data available for this proposal yet.')
                ]));
                return;
            }

            // Result status
            if (tally.result && tally.result !== 'pending') {
                var resultClass = tally.result === 'passed' ? 'gov-notice-success' : 'gov-notice-error';
                container.appendChild(el('div', { className: 'gov-notice ' + resultClass }, [
                    el('strong', null, tally.result === 'passed' ? '✅ PASSED' : '❌ REJECTED')
                ]));
            }

            // Tally bar
            container.appendChild(buildTallyBar(tally));

            // Thresholds
            var thresholds = el('div', { className: 'gov-review-block', style: 'margin-top: var(--space-md)' });
            thresholds.appendChild(el('h4', null, 'Thresholds'));
            if (tally.quorum_met !== undefined) {
                thresholds.appendChild(el('p', null, (tally.quorum_met ? '✅' : '❌') + ' Quorum: ' + pct(tally.quorum_ratio) + ' (need ' + pct(tally.quorum_required) + ')'));
            }
            if (tally.engagement_met !== undefined) {
                thresholds.appendChild(el('p', null, (tally.engagement_met ? '✅' : '❌') + ' Engagement: ' + pct(tally.engagement_ratio) + ' (need ' + pct(tally.engagement_required) + ')'));
            }
            if (tally.passage_met !== undefined) {
                thresholds.appendChild(el('p', null, (tally.passage_met ? '✅' : '❌') + ' Passage: ' + pct(tally.passage_ratio) + ' (need ' + pct(tally.passage_required) + ')'));
            }
            container.appendChild(thresholds);

            // Individual votes table (if revealed)
            if (tally.votes_revealed && tally.vote_hashes && tally.vote_hashes.length > 0) {
                container.appendChild(el('h3', { style: 'margin-top: var(--space-lg); margin-bottom: var(--space-sm); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.875rem;' }, 'Individual Votes'));

                var table = el('table', { className: 'gov-results-table' });
                var thead = el('thead', null, [
                    el('tr', null, [
                        el('th', null, 'CID'),
                        el('th', null, 'Vote Hash'),
                        el('th', null, 'Timestamp')
                    ])
                ]);
                table.appendChild(thead);

                var tbody = el('tbody');
                tally.vote_hashes.forEach(function(vh) {
                    tbody.appendChild(el('tr', null, [
                        el('td', null, vh.cid_hash_prefix || '—'),
                        el('td', null, truncHash(vh.vote_hash)),
                        el('td', null, formatDate(vh.timestamp))
                    ]));
                });
                table.appendChild(tbody);
                container.appendChild(table);
            }
        });
    }

    function handleVerifyVoteFile(evt) {
        var file = evt.target.files[0];
        if (!file) return;
        evt.target.value = '';

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var vote = JSON.parse(e.target.result);
                verifyVoteSignature(vote);
            } catch (err) {
                showVerifyResult(false, 'Invalid JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    function verifyVoteSignature(vote) {
        var C = window.CovenantCrypto;
        if (!C) { showVerifyResult(false, 'Crypto library not loaded.'); return; }

        if (!vote.signatures || !vote.signatures.voter_ed25519 || !vote.public_keys || !vote.public_keys.ed25519) {
            showVerifyResult(false, 'Vote file missing signature or public key fields.');
            return;
        }

        try {
            // Reconstruct signable content
            var signable = {
                commitment: vote.commitment,
                encrypted_vote: vote.encrypted_vote,
                proposal_id: vote.proposal_id,
                public_keys: vote.public_keys,
                schema_version: vote.schema_version,
                timestamp: vote.timestamp,
                vote_content: vote.vote_content,
                voter_cid_hash: vote.voter_cid_hash
            };

            var canonical = canonicalJSON(signable);
            var msgBytes = new TextEncoder().encode(canonical);

            // Verify Ed25519
            var edPubKey = base64ToBytes(vote.public_keys.ed25519);
            var edSig = base64ToBytes(vote.signatures.voter_ed25519);
            var edValid = C.ed25519.verify(edSig, msgBytes, edPubKey);

            // Verify ML-DSA-65 (if present)
            var mlValid = null;
            if (vote.signatures.voter_ml_dsa_65 && vote.public_keys.ml_dsa_65 && C.ml_dsa65) {
                var mlPubKey = base64ToBytes(vote.public_keys.ml_dsa_65);
                var mlSig = base64ToBytes(vote.signatures.voter_ml_dsa_65);
                mlValid = C.ml_dsa65.verify(mlSig, msgBytes, mlPubKey);
            }

            var details = 'Proposal: ' + vote.proposal_id +
                '\nVoter: ' + truncHash(vote.voter_cid_hash) +
                '\nChoice: ' + (vote.vote_content ? capitalize(vote.vote_content.choice) : '—') +
                '\nTimestamp: ' + formatDateTime(vote.timestamp) +
                '\n\nEd25519: ' + (edValid ? '✅ VALID' : '❌ INVALID');

            if (mlValid !== null) {
                details += '\nML-DSA-65: ' + (mlValid ? '✅ VALID' : '❌ INVALID');
            } else {
                details += '\nML-DSA-65: — (not present)';
            }

            var allValid = edValid && (mlValid === null || mlValid);
            if (allValid) {
                showVerifyResult(true, 'Signature verification passed.\n\n' + details);
            } else {
                showVerifyResult(false, 'Signature verification FAILED. This vote may have been tampered with.\n\n' + details);
            }
        } catch (err) {
            showVerifyResult(false, 'Verification error: ' + err.message);
        }
    }

    function showVerifyResult(isValid, message) {
        var container = document.getElementById('gov-verify-result');
        container.innerHTML = '';
        var cls = isValid ? 'gov-notice gov-notice-success' : 'gov-notice gov-notice-error';
        var icon = isValid ? '✅' : '❌';
        var pre = el('pre', { style: 'white-space: pre-wrap; margin: 0; font-size: 0.875rem;' }, message);
        container.appendChild(el('div', { className: cls }, [
            el('strong', null, icon + (isValid ? ' Signature Valid' : ' Signature Invalid')),
            pre
        ]));
        container.style.display = 'block';
    }

    // ══════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════

    function capitalize(s) {
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
    }

    function truncHash(hash) {
        if (!hash) return '—';
        return hash.slice(0, 8) + '…' + hash.slice(-4);
    }

    function pct(ratio) {
        if (ratio === undefined || ratio === null) return '—';
        return Math.round(ratio * 100) + '%';
    }

    function findProposal(proposalId) {
        if (!state.proposals || !state.proposals.proposals) return null;
        for (var i = 0; i < state.proposals.proposals.length; i++) {
            if (state.proposals.proposals[i].proposal_id === proposalId) return state.proposals.proposals[i];
        }
        return null;
    }

    // ══════════════════════════════════════════════
    // INIT
    // ══════════════════════════════════════════════

    function init() {
        initTabs();
        initIdentity();
        initModal();
        initWizard();
        initVoteTab();
        initResultsTab();

        // Preload ledger
        loadLedger();

        // Load proposals on start
        loadProposals();
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
