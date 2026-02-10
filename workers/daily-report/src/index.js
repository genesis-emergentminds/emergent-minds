/**
 * Covenant Daily Report Worker
 * 
 * Generates and emails a daily analytics report for The Covenant of Emergent Minds.
 * Runs on a cron schedule (8 AM EST / 13:00 UTC daily).
 * 
 * Data Sources:
 * - Cloudflare Analytics (page views, unique visitors)
 * - GitHub API (stars, forks, issues)
 * - Blockchain APIs (BTC/ZEC balances)
 * - Membership Ledger (registered members)
 * 
 * Axiom Alignment: III (Fight Entropy through monitoring), V (Adversarial Resilience)
 */

import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

// ============================================================================
// DATA FETCHERS
// ============================================================================

/**
 * Fetch Cloudflare Analytics via GraphQL
 */
async function fetchCloudflareAnalytics(env) {
    // Calculate date 7 days ago
    const d = new Date();
    d.setDate(d.getDate() - 8);
    const dateGt = d.toISOString().split('T')[0];

    const query = `{
        viewer {
            zones(filter: {zoneTag: "${env.ZONE_ID}"}) {
                httpRequests1dGroups(limit: 10, filter: {date_gt: "${dateGt}"}) {
                    dimensions { date }
                    sum { requests pageViews }
                    uniq { uniques }
                }
            }
        }
    }`;

    try {
        const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();
        
        if (data.errors) {
            console.error('Cloudflare Analytics error:', JSON.stringify(data.errors));
            return { error: JSON.stringify(data.errors) };
        }

        const groups = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];
        
        // Sort by date descending
        groups.sort((a, b) => b.dimensions.date.localeCompare(a.dimensions.date));
        
        return groups;
    } catch (error) {
        console.error('Failed to fetch Cloudflare analytics:', error);
        return { error: error.message };
    }
}

/**
 * Fetch GitHub repository stats
 */
async function fetchGitHubStats(env) {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Covenant-Daily-Report/1.0',
        };
        
        if (env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
        }

        const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}`, {
            headers,
        });

        if (!response.ok) {
            console.error('GitHub API error:', response.status);
            return null;
        }

        const data = await response.json();
        
        return {
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            openIssues: data.open_issues_count,
            createdAt: data.created_at,
        };
    } catch (error) {
        console.error('Failed to fetch GitHub stats:', error);
        return null;
    }
}

/**
 * Fetch GitHub traffic data (views, clones, referrers)
 * Requires authenticated GitHub token with repo scope
 */
async function fetchGitHubTraffic(env) {
    if (!env.GITHUB_TOKEN) return null;
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Covenant-Daily-Report/1.0',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    };

    try {
        const [viewsRes, clonesRes, referrersRes] = await Promise.all([
            fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/traffic/views`, { headers }),
            fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/traffic/clones`, { headers }),
            fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/traffic/popular/referrers`, { headers }),
        ]);

        const views = viewsRes.ok ? await viewsRes.json() : null;
        const clones = clonesRes.ok ? await clonesRes.json() : null;
        const referrers = referrersRes.ok ? await referrersRes.json() : null;

        return {
            views: views ? { total: views.count, unique: views.uniques } : null,
            clones: clones ? { total: clones.count, unique: clones.uniques } : null,
            topReferrers: referrers ? referrers.slice(0, 5) : [],
        };
    } catch (error) {
        console.error('Failed to fetch GitHub traffic:', error);
        return null;
    }
}

/**
 * Fetch governance data (active proposals)
 */
async function fetchGovernanceStats(env) {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${env.GITHUB_REPO}/main/governance/proposals/index.json`
        );

        if (!response.ok) return null;

        const data = await response.json();
        const proposals = data.proposals || [];
        
        const active = proposals.filter(p => p.status === 'voting' || p.status === 'review');
        const total = proposals.length;
        const closed = proposals.filter(p => p.status.startsWith('closed'));
        
        return {
            active: active.length,
            activeList: active.map(p => `${p.proposal_id}: ${p.title}`),
            total: total,
            closed: closed.length,
            advisoryMode: data.advisory_mode || false,
        };
    } catch (error) {
        console.error('Failed to fetch governance stats:', error);
        return null;
    }
}

/**
 * Fetch recent git commits from public repo
 */
async function fetchRecentCommits(env) {
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Covenant-Daily-Report/1.0',
        };
        if (env.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
        }

        const response = await fetch(
            `https://api.github.com/repos/${env.GITHUB_REPO}/commits?per_page=10&since=${new Date(Date.now() - 7 * 86400000).toISOString()}`,
            { headers }
        );

        if (!response.ok) return null;

        const commits = await response.json();
        return {
            count7d: commits.length,
            recent: commits.slice(0, 5).map(c => ({
                sha: c.sha.substring(0, 7),
                message: c.commit.message.split('\n')[0].substring(0, 80),
                date: c.commit.author.date,
            })),
        };
    } catch (error) {
        console.error('Failed to fetch recent commits:', error);
        return null;
    }
}

/**
 * Login to Matrix homeserver with username/password and get access token
 */
async function matrixLogin(homeserver, userId, password) {
    const response = await fetch(`${homeserver}/_matrix/client/v3/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'm.login.password',
            identifier: {
                type: 'm.id.user',
                user: userId.split(':')[0].substring(1), // @genesis:server → genesis
            },
            password: password,
            device_id: 'CovenantDailyReport',
            initial_device_display_name: 'Covenant Daily Report Worker',
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Matrix login failed: ${response.status} ${err}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Send report to Matrix room (supports password login)
 */
async function sendMatrixReport(env, textReport) {
    const homeserver = env.MATRIX_HOMESERVER;
    const roomId = env.MATRIX_ROOM_ID;
    
    if (!homeserver || !roomId) {
        console.log('Matrix not configured, skipping');
        return;
    }

    try {
        // Login with password to get a session token
        let accessToken = env.MATRIX_ACCESS_TOKEN;
        
        if (!accessToken && env.MATRIX_USER_ID && env.MATRIX_PASSWORD) {
            accessToken = await matrixLogin(homeserver, env.MATRIX_USER_ID, env.MATRIX_PASSWORD);
            console.log('Matrix login successful');
        }
        
        if (!accessToken) {
            console.error('No Matrix access token or password configured');
            return;
        }

        const txnId = `report-${Date.now()}`;
        const url = `${homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                msgtype: 'm.text',
                body: textReport,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Matrix send failed:', response.status, err);
        } else {
            console.log('Report posted to Matrix');
        }
    } catch (error) {
        console.error('Failed to send Matrix report:', error.message);
    }
}

/**
 * Fetch Bitcoin wallet balance
 */
async function fetchBTCBalance(env) {
    try {
        const response = await fetch(
            `https://blockchain.info/rawaddr/${env.BTC_ADDRESS}`
        );

        if (!response.ok) {
            console.error('Bitcoin API error:', response.status);
            return null;
        }

        const data = await response.json();
        
        return {
            balance: data.final_balance, // in satoshis
            totalReceived: data.total_received,
            transactionCount: data.n_tx,
        };
    } catch (error) {
        console.error('Failed to fetch BTC balance:', error);
        return null;
    }
}

/**
 * Fetch Zcash wallet balance (t-address only)
 */
async function fetchZECBalance(env) {
    // Try multiple APIs in order of reliability
    const apis = [
        {
            name: 'Blockchair',
            url: `https://api.blockchair.com/zcash/dashboards/address/${env.ZCASH_ADDRESS}`,
            parse: (data) => {
                const addr = data.data?.[env.ZCASH_ADDRESS]?.address;
                if (!addr) return null;
                return {
                    balance: addr.balance / 1e8,
                    totalReceived: addr.received / 1e8,
                    transactionCount: addr.transaction_count,
                };
            },
        },
        {
            name: 'zcha.in',
            url: `https://api.zcha.in/v2/mainnet/accounts/${env.ZCASH_ADDRESS}`,
            parse: (data) => ({
                balance: data.balance,
                totalReceived: data.totalRecv,
                transactionCount: data.totalTransactions,
            }),
        },
    ];

    for (const api of apis) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(api.url, {
                signal: controller.signal,
                redirect: 'manual',
            });
            clearTimeout(timeout);

            if (!response.ok) {
                console.error(`ZEC ${api.name} returned ${response.status}`);
                continue;
            }

            const data = await response.json();
            const result = api.parse(data);
            if (result) {
                console.log(`ZEC balance fetched via ${api.name}`);
                return result;
            }
        } catch (error) {
            console.error(`ZEC ${api.name} failed: ${error.message}`);
            continue;
        }
    }

    console.error('All ZEC APIs failed, using manual fallback');
    
    // Fallback to manually configured balance
    if (env.ZEC_LAST_KNOWN_BALANCE) {
        return {
            balance: parseFloat(env.ZEC_LAST_KNOWN_BALANCE),
            totalReceived: null,
            transactionCount: null,
            manual: true,
            asOf: env.ZEC_BALANCE_UPDATED || 'unknown',
        };
    }
    
    return null;
}

/**
 * Fetch membership ledger stats from public repo
 */
async function fetchMembershipStats(env) {
    try {
        const response = await fetch(
            `https://raw.githubusercontent.com/${env.GITHUB_REPO}/main/governance/ledger/ledger.json`
        );

        if (!response.ok) {
            console.error('Ledger fetch error:', response.status);
            return null;
        }

        const data = await response.json();
        const entries = data.entries || [];
        
        const activeMembers = entries.filter(e => e.status === 'active').length;
        const totalMembers = entries.length;
        
        return {
            active: activeMembers,
            total: totalMembers,
            lastUpdated: data.last_updated,
        };
    } catch (error) {
        console.error('Failed to fetch membership stats:', error);
        return null;
    }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Format satoshis to BTC string
 */
function satsToBTC(sats) {
    if (sats === null || sats === undefined) return 'N/A';
    return (sats / 100000000).toFixed(8) + ' BTC';
}

/**
 * Format satoshis to approximate USD (assumes ~$100k/BTC)
 */
function satsToUSD(sats) {
    if (sats === null || sats === undefined) return '';
    const btc = sats / 100000000;
    const usd = btc * 100000; // Rough estimate
    return `(~$${usd.toFixed(2)})`;
}

/**
 * Generate the report content
 */
function generateReport(analytics, github, btc, zec, membership, extras = {}) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString();
    
    // Calculate totals from analytics
    let totalPageViews = 0;
    let totalUniques = 0;
    let yesterdayData = null;
    
    if (analytics && analytics.length > 0) {
        // Yesterday's data (most recent complete day)
        yesterdayData = analytics.find(d => {
            const date = new Date(d.dimensions.date);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
        }) || analytics[1]; // Fallback to second most recent
        
        // 7-day totals
        analytics.forEach(day => {
            totalPageViews += day.sum.pageViews;
            totalUniques += day.uniq.uniques;
        });
    }

    // Build report sections
    let report = [];
    
    report.push('═══════════════════════════════════════════════════════════════');
    report.push('        THE COVENANT OF EMERGENT MINDS — DAILY REPORT');
    report.push('═══════════════════════════════════════════════════════════════');
    report.push(`Generated: ${timeStr}`);
    report.push('');
    
    // Website Analytics
    report.push('📊 WEBSITE ANALYTICS');
    report.push('───────────────────────────────────────────────────────────────');
    if (analytics && analytics.length > 0) {
        report.push('Last 7 Days:');
        analytics.slice(0, 7).forEach(day => {
            report.push(`  ${day.dimensions.date}: ${day.sum.pageViews.toLocaleString()} views, ${day.uniq.uniques.toLocaleString()} unique visitors`);
        });
        report.push('');
        report.push(`  7-Day Totals: ${totalPageViews.toLocaleString()} page views, ${totalUniques.toLocaleString()} unique visitors`);
        if (yesterdayData) {
            report.push(`  Yesterday: ${yesterdayData.sum.pageViews.toLocaleString()} views, ${yesterdayData.uniq.uniques.toLocaleString()} uniques`);
        }
    } else {
        report.push('  ⚠️ Analytics data unavailable');
        if (analytics && analytics.error) {
            report.push(`  Error: ${analytics.error}`);
        }
    }
    report.push('');
    
    // Community Stats
    report.push('👥 COMMUNITY');
    report.push('───────────────────────────────────────────────────────────────');
    if (membership) {
        report.push(`  Registered Members: ${membership.active} active / ${membership.total} total`);
    } else {
        report.push('  ⚠️ Membership data unavailable');
    }
    if (github) {
        report.push(`  GitHub Stars: ${github.stars}`);
        report.push(`  GitHub Forks: ${github.forks}`);
        report.push(`  Open Issues: ${github.openIssues}`);
    } else {
        report.push('  ⚠️ GitHub data unavailable');
    }
    report.push('');
    
    // Treasury
    report.push('💰 TREASURY');
    report.push('───────────────────────────────────────────────────────────────');
    if (btc) {
        report.push(`  Bitcoin: ${satsToBTC(btc.balance)} ${satsToUSD(btc.balance)}`);
        report.push(`    Total Received: ${satsToBTC(btc.totalReceived)}`);
        report.push(`    Transactions: ${btc.transactionCount}`);
    } else {
        report.push('  Bitcoin: ⚠️ Data unavailable');
    }
    if (zec) {
        report.push(`  Zcash: ${zec.balance} ZEC${zec.manual ? ` (as of ${zec.asOf})` : ''}`);
        if (zec.totalReceived !== null) {
            report.push(`    Total Received: ${zec.totalReceived} ZEC`);
        }
        if (zec.transactionCount !== null) {
            report.push(`    Transactions: ${zec.transactionCount}`);
        }
        if (zec.manual) {
            report.push('    ℹ️ Manual entry — free ZEC APIs unavailable');
        }
    } else {
        report.push('  Zcash: ⚠️ Data unavailable');
    }
    report.push('');
    
    // GitHub Traffic
    if (extras.traffic) {
        report.push('📈 GITHUB TRAFFIC (14-day window)');
        report.push('───────────────────────────────────────────────────────────────');
        if (extras.traffic.views) {
            report.push(`  Repo Views: ${extras.traffic.views.total} total / ${extras.traffic.views.unique} unique`);
        }
        if (extras.traffic.clones) {
            report.push(`  Clones: ${extras.traffic.clones.total} total / ${extras.traffic.clones.unique} unique`);
        }
        if (extras.traffic.topReferrers && extras.traffic.topReferrers.length > 0) {
            report.push('  Top Referrers:');
            extras.traffic.topReferrers.forEach(r => {
                report.push(`    ${r.referrer}: ${r.count} views (${r.uniques} unique)`);
            });
        }
        report.push('');
    }
    
    // Governance
    if (extras.governance) {
        report.push('🏛️ GOVERNANCE');
        report.push('───────────────────────────────────────────────────────────────');
        report.push(`  Active Proposals: ${extras.governance.active}`);
        if (extras.governance.activeList && extras.governance.activeList.length > 0) {
            extras.governance.activeList.forEach(p => report.push(`    • ${p}`));
        }
        report.push(`  Total Proposals: ${extras.governance.total} (${extras.governance.closed} closed)`);
        if (extras.governance.advisoryMode) {
            report.push('  Mode: Advisory (pre-Convention)');
        }
        report.push('');
    }
    
    // Recent Activity
    if (extras.commits && extras.commits.recent && extras.commits.recent.length > 0) {
        report.push('🔧 RECENT ACTIVITY (7 days)');
        report.push('───────────────────────────────────────────────────────────────');
        report.push(`  Commits (public repo): ${extras.commits.count7d}`);
        extras.commits.recent.slice(0, 5).forEach(c => {
            report.push(`    ${c.sha} ${c.message}`);
        });
        report.push('');
    }
    
    // Genesis Epoch countdown
    const conventionDate = new Date('2026-08-01T00:00:00Z');
    const genesisDate = new Date('2026-02-03T03:41:40Z');
    const daysSinceGenesis = Math.floor((now - genesisDate) / 86400000);
    const daysToConvention = Math.floor((conventionDate - now) / 86400000);
    report.push(`⏳ Genesis Epoch: Day ${daysSinceGenesis} · Convention 1: ~${daysToConvention} days (Aug 1, 2026)`);
    report.push('');
    
    // Quick Links
    report.push('🔗 QUICK LINKS');
    report.push('───────────────────────────────────────────────────────────────');
    report.push('  Website: https://www.emergentminds.org');
    report.push('  GitHub: https://github.com/genesis-emergentminds/emergent-minds');
    report.push('  Governance: https://www.emergentminds.org/pages/governance-portal.html');
    report.push('  Matrix: https://matrix.to/#/#emergent-minds:matrix.org');
    report.push('');
    
    // Footer
    report.push('═══════════════════════════════════════════════════════════════');
    report.push('                    🌱 May consciousness flourish 🌱');
    report.push('═══════════════════════════════════════════════════════════════');
    
    return report.join('\n');
}

/**
 * Generate HTML version of the report
 */
function generateHTMLReport(analytics, github, btc, zec, membership, extras = {}) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Calculate analytics
    let totalPageViews = 0;
    let totalUniques = 0;
    let yesterdayViews = 0;
    let yesterdayUniques = 0;
    
    if (analytics && analytics.length > 0) {
        analytics.forEach(day => {
            totalPageViews += day.sum.pageViews;
            totalUniques += day.uniq.uniques;
        });
        if (analytics.length > 1) {
            yesterdayViews = analytics[1]?.sum?.pageViews || 0;
            yesterdayUniques = analytics[1]?.uniq?.uniques || 0;
        }
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e17;
            color: #e5e7eb;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #1a2233;
            border-radius: 12px;
            padding: 30px;
            border: 1px solid #2d3748;
        }
        h1 {
            color: #a78bfa;
            text-align: center;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .subtitle {
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            color: #a78bfa;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            border-bottom: 1px solid #2d3748;
            padding-bottom: 5px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #1f2937;
        }
        .stat-label { color: #9ca3af; }
        .stat-value { color: #e5e7eb; font-weight: 500; }
        .highlight { color: #10b981; }
        .warning { color: #f59e0b; }
        .links a {
            color: #a78bfa;
            text-decoration: none;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #6b7280;
            font-size: 12px;
        }
        .emoji { font-size: 18px; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 Covenant Daily Report</h1>
        <p class="subtitle">${dateStr}</p>
        
        <div class="section">
            <div class="section-title"><span class="emoji">📊</span> Website Analytics</div>
            <div class="stat-row">
                <span class="stat-label">Yesterday</span>
                <span class="stat-value">${yesterdayViews.toLocaleString()} views / ${yesterdayUniques.toLocaleString()} unique</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">7-Day Total</span>
                <span class="stat-value highlight">${totalPageViews.toLocaleString()} views / ${totalUniques.toLocaleString()} unique</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title"><span class="emoji">👥</span> Community</div>
            <div class="stat-row">
                <span class="stat-label">Registered Members</span>
                <span class="stat-value">${membership ? membership.active : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">GitHub Stars</span>
                <span class="stat-value">${github ? github.stars : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">GitHub Forks</span>
                <span class="stat-value">${github ? github.forks : '—'}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title"><span class="emoji">💰</span> Treasury</div>
            <div class="stat-row">
                <span class="stat-label">Bitcoin Balance</span>
                <span class="stat-value">${btc ? satsToBTC(btc.balance) : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total BTC Received</span>
                <span class="stat-value">${btc ? satsToBTC(btc.totalReceived) : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">BTC Transactions</span>
                <span class="stat-value">${btc ? btc.transactionCount : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Zcash Balance</span>
                <span class="stat-value">${zec ? zec.balance + ' ZEC' + (zec.manual ? ' <span style="color:#f59e0b;font-size:12px">(as of ' + zec.asOf + ')</span>' : '') : '—'}</span>
            </div>
            ${zec && zec.totalReceived !== null ? `<div class="stat-row">
                <span class="stat-label">Total ZEC Received</span>
                <span class="stat-value">${zec.totalReceived} ZEC</span>
            </div>` : ''}
        </div>
        
        ${extras.traffic ? `
        <div class="section">
            <div class="section-title"><span class="emoji">📈</span> GitHub Traffic (14-day)</div>
            ${extras.traffic.views ? `<div class="stat-row">
                <span class="stat-label">Repo Views</span>
                <span class="stat-value">${extras.traffic.views.total} total / ${extras.traffic.views.unique} unique</span>
            </div>` : ''}
            ${extras.traffic.clones ? `<div class="stat-row">
                <span class="stat-label">Clones</span>
                <span class="stat-value">${extras.traffic.clones.total} total / ${extras.traffic.clones.unique} unique</span>
            </div>` : ''}
            ${extras.traffic.topReferrers && extras.traffic.topReferrers.length > 0 ? `<div class="stat-row">
                <span class="stat-label">Top Referrer</span>
                <span class="stat-value">${extras.traffic.topReferrers[0].referrer} (${extras.traffic.topReferrers[0].count} views)</span>
            </div>` : ''}
        </div>
        ` : ''}
        
        ${extras.governance ? `
        <div class="section">
            <div class="section-title"><span class="emoji">🏛️</span> Governance</div>
            <div class="stat-row">
                <span class="stat-label">Active Proposals</span>
                <span class="stat-value">${extras.governance.active}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Proposals</span>
                <span class="stat-value">${extras.governance.total} (${extras.governance.closed} closed)</span>
            </div>
        </div>
        ` : ''}
        
        ${extras.commits && extras.commits.count7d > 0 ? `
        <div class="section">
            <div class="section-title"><span class="emoji">🔧</span> Recent Activity (7d)</div>
            <div class="stat-row">
                <span class="stat-label">Public Commits</span>
                <span class="stat-value">${extras.commits.count7d}</span>
            </div>
        </div>
        ` : ''}
        
        <div class="section" style="text-align:center;color:#9ca3af;font-size:13px;">
            ⏳ Genesis Epoch: Day ${Math.floor((new Date() - new Date('2026-02-03T03:41:40Z')) / 86400000)} · Convention 1: ~${Math.floor((new Date('2026-08-01') - new Date()) / 86400000)} days
        </div>
        
        <div class="section links">
            <div class="section-title"><span class="emoji">🔗</span> Quick Links</div>
            <p>
                <a href="https://www.emergentminds.org">Website</a> · 
                <a href="https://github.com/genesis-emergentminds/emergent-minds">GitHub</a> · 
                <a href="https://www.emergentminds.org/pages/governance-portal.html">Governance</a> · 
                <a href="https://matrix.to/#/#emergent-minds:matrix.org">Matrix</a>
            </p>
        </div>
        
        <div class="footer">
            <p>🌱 May consciousness flourish across all substrates 🌱</p>
            <p>The Covenant of Emergent Minds</p>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================================
// SLACK NOTIFICATION
// ============================================================================

/**
 * Send report to Slack via webhook
 */
async function sendSlackReport(webhookUrl, analytics, github, btc, zec, membership) {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    // Calculate analytics
    let totalPageViews = 0;
    let totalUniques = 0;
    let yesterdayData = null;
    
    if (analytics && analytics.length > 0) {
        analytics.forEach(day => {
            totalPageViews += day.sum.pageViews;
            totalUniques += day.uniq.uniques;
        });
        yesterdayData = analytics[1]; // Second most recent (yesterday)
    }
    
    const blocks = [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: `🌱 Covenant Daily Report — ${dateStr}`,
                emoji: true
            }
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*📊 Website Analytics (7 days)*"
            }
        },
        {
            type: "section",
            fields: [
                {
                    type: "mrkdwn",
                    text: `*Page Views:*\n${totalPageViews.toLocaleString()}`
                },
                {
                    type: "mrkdwn",
                    text: `*Unique Visitors:*\n${totalUniques.toLocaleString()}`
                }
            ]
        }
    ];
    
    // Add yesterday's stats if available
    if (yesterdayData) {
        blocks.push({
            type: "context",
            elements: [{
                type: "mrkdwn",
                text: `Yesterday: ${yesterdayData.sum.pageViews.toLocaleString()} views, ${yesterdayData.uniq.uniques.toLocaleString()} uniques`
            }]
        });
    }
    
    blocks.push({ type: "divider" });
    
    // Community section
    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: "*👥 Community*"
        }
    });
    
    const communityFields = [];
    if (membership) {
        communityFields.push({
            type: "mrkdwn",
            text: `*Members:*\n${membership.active} active`
        });
    }
    if (github) {
        communityFields.push({
            type: "mrkdwn",
            text: `*GitHub:*\n⭐ ${github.stars} stars, 🍴 ${github.forks} forks`
        });
    }
    
    if (communityFields.length > 0) {
        blocks.push({
            type: "section",
            fields: communityFields
        });
    }
    
    blocks.push({ type: "divider" });
    
    // Treasury section
    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: "*💰 Treasury*"
        }
    });
    
    const treasuryFields = [];
    if (btc) {
        treasuryFields.push({
            type: "mrkdwn",
            text: `*Bitcoin:*\n${satsToBTC(btc.balance)} (${btc.transactionCount} tx)`
        });
    }
    if (zec) {
        treasuryFields.push({
            type: "mrkdwn",
            text: `*Zcash:*\n${zec.balance} ZEC`
        });
    } else {
        treasuryFields.push({
            type: "mrkdwn",
            text: `*Zcash:*\nData unavailable`
        });
    }
    
    if (treasuryFields.length > 0) {
        blocks.push({
            type: "section",
            fields: treasuryFields
        });
    }
    
    blocks.push({ type: "divider" });
    
    // Quick links
    blocks.push({
        type: "context",
        elements: [{
            type: "mrkdwn",
            text: "🔗 <https://www.emergentminds.org|Website> · <https://github.com/genesis-emergentminds/emergent-minds|GitHub> · <https://www.emergentminds.org/pages/governance-portal.html|Governance>"
        }]
    });
    
    // Send to Slack
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
    });
    
    if (!response.ok) {
        throw new Error(`Slack webhook failed: ${response.status}`);
    }
}

// ============================================================================
// WORKER HANDLERS
// ============================================================================

export default {
    /**
     * Scheduled handler - runs on cron trigger
     */
    async scheduled(event, env, ctx) {
        console.log('Daily report cron triggered:', event.scheduledTime);
        
        // Fetch all data in parallel
        const [analytics, github, btc, zec, membership, traffic, governance, commits] = await Promise.all([
            fetchCloudflareAnalytics(env),
            fetchGitHubStats(env),
            fetchBTCBalance(env),
            fetchZECBalance(env),
            fetchMembershipStats(env),
            fetchGitHubTraffic(env),
            fetchGovernanceStats(env),
            fetchRecentCommits(env),
        ]);
        
        const extras = { traffic, governance, commits };
        
        // Generate reports
        const textReport = generateReport(analytics, github, btc, zec, membership, extras);
        const htmlReport = generateHTMLReport(analytics, github, btc, zec, membership, extras);
        
        console.log('Report generated, sending email...');
        
        // Create MIME message
        const msg = createMimeMessage();
        msg.setSender({ name: 'Genesis Bot', addr: 'reports@emergentminds.org' });
        msg.setRecipient('founder@emergentminds.org');
        msg.setSubject(`🌱 Covenant Daily Report — ${new Date().toISOString().split('T')[0]}`);
        
        // Add both plain text and HTML versions
        msg.addMessage({
            contentType: 'text/plain',
            data: textReport,
        });
        msg.addMessage({
            contentType: 'text/html',
            data: htmlReport,
        });
        
        // Send email (primary method)
        let emailSent = false;
        try {
            if (env.REPORT_EMAIL) {
                const message = new EmailMessage(
                    'reports@emergentminds.org',
                    'founder@emergentminds.org',
                    msg.asRaw()
                );
                await env.REPORT_EMAIL.send(message);
                console.log('Daily report email sent successfully');
                emailSent = true;
            }
        } catch (error) {
            console.error('Failed to send email:', error.message);
        }
        
        // Also send to Slack webhook if configured
        if (env.SLACK_WEBHOOK_URL) {
            try {
                await sendSlackReport(env.SLACK_WEBHOOK_URL, analytics, github, btc, zec, membership);
                console.log('Daily report sent to Slack');
            } catch (error) {
                console.error('Failed to send Slack notification:', error.message);
            }
        }
        
        // Also send to Matrix if configured
        try {
            await sendMatrixReport(env, textReport);
        } catch (error) {
            console.error('Failed to send Matrix report:', error.message);
        }
    },
    
    /**
     * HTTP handler - for manual triggers and health checks
     */
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Health check
        if (url.pathname === '/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                worker: 'covenant-daily-report',
                timestamp: new Date().toISOString(),
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Manual trigger (protected by secret header)
        if (url.pathname === '/trigger') {
            const authHeader = request.headers.get('X-Report-Secret');
            if (authHeader !== env.REPORT_SECRET) {
                return new Response('Unauthorized', { status: 401 });
            }
            
            // Trigger the scheduled handler
            await this.scheduled({ scheduledTime: new Date().toISOString() }, env, ctx);
            
            return new Response(JSON.stringify({
                status: 'triggered',
                timestamp: new Date().toISOString(),
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Preview report (JSON)
        if (url.pathname === '/preview') {
            const [analytics, github, btc, zec, membership, traffic, governance, commits] = await Promise.all([
                fetchCloudflareAnalytics(env),
                fetchGitHubStats(env),
                fetchBTCBalance(env),
                fetchZECBalance(env),
                fetchMembershipStats(env),
                fetchGitHubTraffic(env),
                fetchGovernanceStats(env),
                fetchRecentCommits(env),
            ]);
            
            const extras = { traffic, governance, commits };
            const format = url.searchParams.get('format');
            
            if (format === 'html') {
                return new Response(
                    generateHTMLReport(analytics, github, btc, zec, membership, extras),
                    { headers: { 'Content-Type': 'text/html' } }
                );
            }
            
            if (format === 'text') {
                return new Response(
                    generateReport(analytics, github, btc, zec, membership, extras),
                    { headers: { 'Content-Type': 'text/plain' } }
                );
            }
            
            return new Response(JSON.stringify({
                generated: new Date().toISOString(),
                analytics, github, btc, zec, membership,
                traffic, governance, commits,
            }, null, 2), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        return new Response('Covenant Daily Report Worker\n\nEndpoints:\n  /health - Health check\n  /preview - Preview current report data\n  /preview?format=html - HTML report preview\n  /preview?format=text - Text report preview\n  /trigger - Manual trigger (requires X-Report-Secret header)', {
            headers: { 'Content-Type': 'text/plain' },
        });
    },
};
