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
 * Send report to Matrix room
 * Prefers MATRIX_ACCESS_TOKEN (pre-configured secret) over password login.
 * Returns true on success, false on failure.
 */
async function sendMatrixReport(env, textReport) {
    const homeserver = env.MATRIX_HOMESERVER;
    const roomId = env.MATRIX_ROOM_ID;
    
    if (!homeserver || !roomId) {
        console.log('Matrix not configured, skipping');
        return false;
    }

    try {
        // Prefer pre-configured access token (secret)
        let accessToken = env.MATRIX_ACCESS_TOKEN || null;
        
        // Fall back to password login if no token is set
        if (!accessToken && env.MATRIX_USER_ID && env.MATRIX_PASSWORD) {
            accessToken = await matrixLogin(homeserver, env.MATRIX_USER_ID, env.MATRIX_PASSWORD);
            console.log('Matrix login successful (password fallback)');
        }
        
        if (!accessToken) {
            console.error('No Matrix access token or password configured');
            return false;
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
            return false;
        } else {
            console.log('Report posted to Matrix successfully');
            return true;
        }
    } catch (error) {
        console.error('Failed to send Matrix report:', error.message);
        return false;
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
            name: 'zcashexplorer.app',
            url: `https://api.zcashexplorer.app/v1/address/${env.ZCASH_ADDRESS}`,
            parse: (data) => {
                if (!data || data.balance === undefined) return null;
                return {
                    balance: data.balance / 1e8, // zatoshis to ZEC
                    totalReceived: data.totalReceived ? data.totalReceived / 1e8 : null,
                    transactionCount: data.transactionCount || null,
                };
            },
        },
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
// SOCIAL MEDIA ANALYTICS
// ============================================================================

/**
 * Fetch Mastodon account and post metrics
 */
async function fetchMastodonStats(instance, accessToken) {
    try {
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        const r = await fetch(`${instance}/api/v1/accounts/verify_credentials`, { headers, signal: AbortSignal.timeout(8000) });
        if (!r.ok) return { error: `HTTP ${r.status}` };
        const account = await r.json();

        // Fetch recent posts
        const r2 = await fetch(`${instance}/api/v1/accounts/${account.id}/statuses?limit=10&exclude_replies=true`, { headers, signal: AbortSignal.timeout(8000) });
        const posts = r2.ok ? await r2.json() : [];

        return {
            followers: account.followers_count || 0,
            following: account.following_count || 0,
            statuses: account.statuses_count || 0,
            posts: posts.map(p => ({
                reblogs: p.reblogs_count || 0,
                favourites: p.favourites_count || 0,
                replies: p.replies_count || 0,
                url: p.url,
            })),
        };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Fetch Bluesky profile and post metrics
 */
async function fetchBlueskyStats(handle, password) {
    try {
        const authR = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: handle, password }),
            signal: AbortSignal.timeout(8000),
        });
        if (!authR.ok) return { error: `Auth failed: ${authR.status}` };
        const session = await authR.json();
        const headers = { 'Authorization': `Bearer ${session.accessJwt}` };

        const profR = await fetch(`https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${session.did}`, { headers, signal: AbortSignal.timeout(8000) });
        const profile = profR.ok ? await profR.json() : {};

        const feedR = await fetch(`https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${session.did}&limit=10`, { headers, signal: AbortSignal.timeout(8000) });
        const feed = feedR.ok ? (await feedR.json()).feed || [] : [];

        return {
            followers: profile.followersCount || 0,
            following: profile.followsCount || 0,
            posts_count: profile.postsCount || 0,
            handle: profile.handle || handle,
            posts: feed.map(item => ({
                likes: item.post?.likeCount || 0,
                reposts: item.post?.repostCount || 0,
                replies: item.post?.replyCount || 0,
            })),
        };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Fetch X/Twitter account and tweet metrics via OAuth 1.0a
 */
async function fetchTwitterStats(env) {
    // OAuth 1.0a signature generation for Cloudflare Workers
    // Using HMAC-SHA1 with Web Crypto API
    const apiKey = env.X_HERALD_API_KEY;
    const apiSecret = env.X_HERALD_API_SECRET;
    const accessToken = env.X_HERALD_ACCESS_TOKEN;
    const accessTokenSecret = env.X_HERALD_ACCESS_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        return { error: 'X/Twitter credentials not configured' };
    }

    try {
        // Build OAuth 1.0a header
        const method = 'GET';
        const baseUrl = 'https://api.twitter.com/2/users/me';
        const params = { 'user.fields': 'public_metrics' };

        const oauthParams = {
            oauth_consumer_key: apiKey,
            oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_token: accessToken,
            oauth_version: '1.0',
        };

        // Combine all params for signature base
        const allParams = { ...params, ...oauthParams };
        const paramStr = Object.keys(allParams).sort()
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
            .join('&');

        const signatureBase = `${method}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramStr)}`;
        const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessTokenSecret)}`;

        // HMAC-SHA1
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(signingKey),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureBase));
        const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

        oauthParams.oauth_signature = signature;

        const authHeader = 'OAuth ' + Object.keys(oauthParams).sort()
            .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
            .join(', ');

        const queryStr = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        const r = await fetch(`${baseUrl}?${queryStr}`, {
            headers: { 'Authorization': authHeader },
            signal: AbortSignal.timeout(8000),
        });

        if (!r.ok) {
            const text = await r.text();
            return { error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
        }

        const data = await r.json();
        const metrics = data.data?.public_metrics || {};

        return {
            username: data.data?.username || '',
            followers: metrics.followers_count || 0,
            following: metrics.following_count || 0,
            tweets: metrics.tweet_count || 0,
        };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Fetch Lemmy account and post metrics
 */
async function fetchLemmyStats(instance, username, password) {
    try {
        const loginR = await fetch(`${instance}/api/v3/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CovenantHerald/1.0 (+https://emergentminds.org)',
            },
            body: JSON.stringify({ username_or_email: username, password }),
            signal: AbortSignal.timeout(8000),
        });
        if (!loginR.ok) return { error: `Login failed: ${loginR.status} (Lemmy may block CF Workers)` };
        const { jwt } = await loginR.json();
        if (!jwt) return { error: 'No JWT' };

        const headers = { 'Authorization': `Bearer ${jwt}` };
        const r = await fetch(`${instance}/api/v3/person?username=${username}`, { headers, signal: AbortSignal.timeout(8000) });
        if (!r.ok) return { error: `Person fetch: ${r.status}` };

        const data = await r.json();
        const counts = data.person_view?.counts || {};
        const posts = (data.posts || []).slice(0, 10);

        return {
            post_count: counts.post_count || 0,
            comment_count: counts.comment_count || 0,
            post_score: counts.post_score || 0,
            posts: posts.map(p => ({
                name: (p.post?.name || '').slice(0, 80),
                upvotes: p.counts?.upvotes || 0,
                downvotes: p.counts?.downvotes || 0,
                comments: p.counts?.comments || 0,
                url: p.post?.ap_id || '',
            })),
        };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Collect all social media metrics
 */
async function fetchAllSocialStats(env) {
    const results = {};

    // Mastodon (mastodon.social)
    if (env.MASTODON_HERALD_ACCESS_TOKEN) {
        results.mastodon = await fetchMastodonStats(
            'https://mastodon.social', env.MASTODON_HERALD_ACCESS_TOKEN
        );
    }

    // Mastodon (techhub.social)
    if (env.MASTODON_TECHHUB_HERALD_ACCESS_TOKEN) {
        results.mastodon_techhub = await fetchMastodonStats(
            'https://techhub.social', env.MASTODON_TECHHUB_HERALD_ACCESS_TOKEN
        );
    }

    // Bluesky
    if (env.BLUESKY_HERALD_HANDLE && env.BLUESKY_HERALD_PASSWORD) {
        results.bluesky = await fetchBlueskyStats(
            env.BLUESKY_HERALD_HANDLE, env.BLUESKY_HERALD_PASSWORD
        );
    }

    // X/Twitter
    if (env.X_HERALD_API_KEY) {
        results.twitter = await fetchTwitterStats(env);
    }

    // Lemmy
    if (env.LEMMY_HERALD_USERNAME && env.LEMMY_HERALD_PASSWORD) {
        results.lemmy = await fetchLemmyStats(
            'https://lemmy.ml', env.LEMMY_HERALD_USERNAME, env.LEMMY_HERALD_PASSWORD
        );
    }

    return results;
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
 * Fetch live BTC/USD price with resilient multi-provider fallback
 *
 * CoinGecko has intermittently returned null/blocked responses from Workers,
 * so we try multiple public sources before falling back to the report estimate.
 */
async function fetchBTCPrice() {
    const sources = [
        {
            name: 'CoinGecko',
            url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
            parse: (data) => data?.bitcoin?.usd,
        },
        {
            name: 'Coinbase',
            url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
            parse: (data) => {
                const amount = data?.data?.amount;
                return amount ? Number(amount) : null;
            },
        },
        {
            name: 'Kraken',
            url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
            parse: (data) => {
                const pair = data?.result && Object.values(data.result)[0];
                const price = pair?.c?.[0];
                return price ? Number(price) : null;
            },
        },
    ];

    for (const source of sources) {
        try {
            const response = await fetch(source.url, {
                signal: AbortSignal.timeout(8000),
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Covenant-Daily-Report/1.0 (+https://www.emergentminds.org)',
                },
            });

            if (!response.ok) {
                const body = await response.text();
                console.error(`${source.name} BTC price API error:`, response.status, body.slice(0, 200));
                continue;
            }

            const data = await response.json();
            const price = source.parse(data);
            if (price && Number.isFinite(price) && price > 0) {
                return price;
            }

            console.error(`${source.name} BTC price parse failed:`, JSON.stringify(data).slice(0, 200));
        } catch (error) {
            console.error(`Failed to fetch BTC price from ${source.name}:`, error.message);
        }
    }

    return null;
}

/**
 * Format satoshis to approximate USD with transparent price source
 * @param {number} sats - Amount in satoshis
 * @param {number|null} btcPrice - Live BTC/USD price, or null for fallback
 */
function satsToUSD(sats, btcPrice) {
    if (sats === null || sats === undefined) return '';
    const btc = sats / 100000000;
    if (btcPrice) {
        const usd = btc * btcPrice;
        const priceK = (btcPrice / 1000).toFixed(0);
        return `(~$${usd.toFixed(2)} @ $${priceK}k/BTC)`;
    }
    // Fallback: rough estimate at $100k
    const usd = btc * 100000;
    return `(~$${usd.toFixed(2)} @ ~$100k/BTC est.)`;
}

/**
 * Analyze browser data to split human vs bot traffic
 */
function analyzeBrowserData(analytics) {
    if (!analytics || analytics.length === 0) return null;
    
    const botFamilies = ['ChromeHeadless', 'Unknown', 'AppleBot', 'Googlebot', 'Bingbot', 'Curl', 'Python', 'Go-http-client'];
    let totalHuman = 0;
    let totalBot = 0;
    const browserTotals = {};
    
    analytics.forEach(day => {
        if (!day.sum.browserMap) return;
        day.sum.browserMap.forEach(b => {
            const isBot = botFamilies.some(bf => b.uaBrowserFamily.toLowerCase().includes(bf.toLowerCase()));
            if (isBot) {
                totalBot += b.pageViews;
            } else {
                totalHuman += b.pageViews;
                browserTotals[b.uaBrowserFamily] = (browserTotals[b.uaBrowserFamily] || 0) + b.pageViews;
            }
        });
    });
    
    // Sort browsers by page views
    const sortedBrowsers = Object.entries(browserTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    return { totalHuman, totalBot, sortedBrowsers };
}

/**
 * Analyze country data from analytics
 */
function analyzeCountryData(analytics) {
    if (!analytics || analytics.length === 0) return null;
    
    const countryTotals = {};
    analytics.forEach(day => {
        if (!day.sum.countryMap) return;
        day.sum.countryMap.forEach(c => {
            countryTotals[c.clientCountryName] = (countryTotals[c.clientCountryName] || 0) + c.requests;
        });
    });
    
    const sorted = Object.entries(countryTotals).sort((a, b) => b[1] - a[1]);
    const totalRequests = sorted.reduce((sum, [, count]) => sum + count, 0);
    
    return {
        countries: sorted.slice(0, 10),
        totalCountries: sorted.length,
        totalRequests,
    };
}

/**
 * Analyze traffic trends from daily data
 */
function analyzeTrends(analytics) {
    if (!analytics || analytics.length < 2) return null;
    
    // Sort chronologically
    const sorted = [...analytics].sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date));
    
    const first3 = sorted.slice(0, Math.min(3, sorted.length));
    const last3 = sorted.slice(-Math.min(3, sorted.length));
    
    const avgFirst = first3.reduce((s, d) => s + d.sum.pageViews, 0) / first3.length;
    const avgLast = last3.reduce((s, d) => s + d.sum.pageViews, 0) / last3.length;
    
    let trend = 'stable';
    const pctChange = ((avgLast - avgFirst) / avgFirst * 100).toFixed(0);
    if (avgLast > avgFirst * 1.15) trend = 'growing';
    else if (avgLast < avgFirst * 0.85) trend = 'declining';
    
    // Peak day
    const peakDay = sorted.reduce((max, d) => d.sum.pageViews > max.sum.pageViews ? d : max, sorted[0]);
    
    return { trend, pctChange, peakDay: peakDay.dimensions.date, peakViews: peakDay.sum.pageViews };
}

/**
 * Generate the report content (text version — used for email text/plain fallback)
 */
function generateReport(analytics, github, btc, zec, membership, extras = {}) {
    const now = new Date();
    const timeStr = now.toISOString();
    
    // Calculate totals from analytics
    let totalPageViews = 0;
    let totalUniques = 0;
    let totalRequests = 0;
    let totalBytes = 0;
    let yesterdayData = null;
    
    if (analytics && analytics.length > 0) {
        yesterdayData = analytics.find(d => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return d.dimensions.date === yesterday.toISOString().split('T')[0];
        }) || analytics[1];
        
        analytics.forEach(day => {
            totalPageViews += day.sum.pageViews;
            totalUniques += day.uniq.uniques;
            totalRequests += day.sum.requests;
            totalBytes += day.sum.bytes || 0;
        });
    }
    
    const browserData = analyzeBrowserData(analytics);
    const countryData = analyzeCountryData(analytics);
    const trends = analyzeTrends(analytics);

    let report = [];
    
    report.push('═══════════════════════════════════════════════════════════════');
    report.push('        THE COVENANT OF EMERGENT MINDS — DAILY REPORT');
    report.push('═══════════════════════════════════════════════════════════════');
    report.push(`Generated: ${timeStr}`);
    report.push('');
    
    // Website Analytics
    report.push('📊 WEBSITE ANALYTICS (7-day window)');
    report.push('───────────────────────────────────────────────────────────────');
    if (analytics && analytics.length > 0) {
        report.push('');
        report.push('  Daily Breakdown:');
        [...analytics].sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date)).forEach(day => {
            report.push(`    ${day.dimensions.date}: ${day.sum.pageViews.toLocaleString()} views, ${day.uniq.uniques.toLocaleString()} unique, ${day.sum.requests.toLocaleString()} requests`);
        });
        report.push('');
        report.push(`  7-Day Totals: ${totalPageViews.toLocaleString()} page views · ${totalUniques.toLocaleString()} unique visitors · ${totalRequests.toLocaleString()} requests`);
        if (totalBytes > 0) {
            report.push(`  Bandwidth: ${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        }
        if (yesterdayData) {
            report.push(`  Yesterday: ${yesterdayData.sum.pageViews.toLocaleString()} views · ${yesterdayData.uniq.uniques.toLocaleString()} unique visitors`);
        }
        
        if (browserData) {
            report.push('');
            report.push(`  Human Traffic: ~${browserData.totalHuman.toLocaleString()} views (${(browserData.totalHuman / totalPageViews * 100).toFixed(0)}%)`);
            report.push(`  Bot Traffic: ~${browserData.totalBot.toLocaleString()} views (${(browserData.totalBot / totalPageViews * 100).toFixed(0)}%)`);
            if (browserData.sortedBrowsers.length > 0) {
                report.push('  Top Browsers (human):');
                browserData.sortedBrowsers.forEach(([name, views]) => {
                    const pct = (views / browserData.totalHuman * 100).toFixed(0);
                    report.push(`    ${name}: ${views.toLocaleString()} views (${pct}%)`);
                });
            }
        }
        
        if (countryData && countryData.countries.length > 0) {
            report.push('');
            report.push(`  Geographic Reach: ${countryData.totalCountries} countries`);
            report.push('  Top Countries:');
            countryData.countries.slice(0, 5).forEach(([code, reqs]) => {
                const pct = (reqs / countryData.totalRequests * 100).toFixed(1);
                report.push(`    ${code}: ${reqs.toLocaleString()} requests (${pct}%)`);
            });
        }
        
        if (trends) {
            report.push('');
            report.push(`  📈 Trend: ${trends.trend} (${trends.pctChange > 0 ? '+' : ''}${trends.pctChange}% early→late window)`);
            report.push(`  Peak Day: ${trends.peakDay} (${trends.peakViews.toLocaleString()} views)`);
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
        report.push(`  GitHub: ⭐ ${github.stars} stars · 🍴 ${github.forks} forks · 📋 ${github.openIssues} open issues`);
    }
    if (extras.traffic) {
        if (extras.traffic.views) {
            report.push(`  Repo Views (14d): ${extras.traffic.views.total} total / ${extras.traffic.views.unique} unique`);
        }
        if (extras.traffic.clones) {
            report.push(`  Clones (14d): ${extras.traffic.clones.total} total / ${extras.traffic.clones.unique} unique`);
        }
        if (extras.traffic.topReferrers && extras.traffic.topReferrers.length > 0) {
            report.push('  Top Referrers:');
            extras.traffic.topReferrers.forEach(r => {
                report.push(`    ${r.referrer}: ${r.count} views (${r.uniques} unique)`);
            });
        }
    }
    report.push('');
    
    // Treasury
    const btcPrice = extras.btcPrice || null;
    report.push('💰 TREASURY');
    report.push('───────────────────────────────────────────────────────────────');
    if (btcPrice) {
        report.push(`  BTC/USD Price: $${btcPrice.toLocaleString()} (live via CoinGecko)`);
    }
    if (btc) {
        report.push(`  Bitcoin Balance: ${satsToBTC(btc.balance)} ${satsToUSD(btc.balance, btcPrice)}`);
        report.push(`  Total Received: ${satsToBTC(btc.totalReceived)} ${satsToUSD(btc.totalReceived, btcPrice)}`);
        report.push(`  Transactions: ${btc.transactionCount}`);
    } else {
        report.push('  Bitcoin: ⚠️ Data unavailable');
    }
    if (zec) {
        report.push(`  Zcash: ${zec.balance} ZEC${zec.manual ? ` (as of ${zec.asOf})` : ''}`);
        if (zec.manual) {
            report.push('    ℹ️ Manual entry — free ZEC APIs unavailable');
        }
    }
    report.push('');
    
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
            report.push('  Mode: Advisory (pre-Convention 1)');
        }
        report.push('');
    }
    
    // Recent Activity
    if (extras.commits && extras.commits.recent && extras.commits.recent.length > 0) {
        report.push('🔧 RECENT COMMITS (7 days)');
        report.push('───────────────────────────────────────────────────────────────');
        report.push(`  Public repo: ${extras.commits.count7d} commits`);
        extras.commits.recent.slice(0, 5).forEach(c => {
            report.push(`    ${c.sha} ${c.message}`);
        });
        report.push('');
    }
    
    // Social Media Outreach
    if (extras.social && Object.keys(extras.social).length > 0) {
        report.push('📡 SOCIAL MEDIA OUTREACH');
        report.push('───────────────────────────────────────────────────────────────');
        let totalFollowers = 0;
        let totalEngagement = 0;

        for (const [platform, data] of Object.entries(extras.social)) {
            if (data.error) {
                report.push(`  ${platform}: ⚠️ ${data.error}`);
                continue;
            }

            if (platform === 'mastodon' || platform === 'mastodon_techhub') {
                const inst = platform === 'mastodon' ? 'mastodon.social' : 'techhub.social';
                totalFollowers += data.followers || 0;
                report.push(`  Mastodon (${inst}): ${data.followers} followers · ${data.statuses} posts`);
                (data.posts || []).forEach(p => {
                    const eng = p.reblogs + p.favourites + p.replies;
                    totalEngagement += eng;
                    report.push(`    📝 ⭐ ${p.favourites} · 🔁 ${p.reblogs} · 💬 ${p.replies}`);
                });
            } else if (platform === 'bluesky') {
                totalFollowers += data.followers || 0;
                report.push(`  Bluesky (@${data.handle}): ${data.followers} followers · ${data.posts_count} posts`);
                (data.posts || []).forEach(p => {
                    const eng = p.likes + p.reposts + p.replies;
                    totalEngagement += eng;
                    report.push(`    📝 ❤️ ${p.likes} · 🔁 ${p.reposts} · 💬 ${p.replies}`);
                });
            } else if (platform === 'twitter') {
                totalFollowers += data.followers || 0;
                report.push(`  X/Twitter (@${data.username}): ${data.followers} followers · ${data.tweets} tweets`);
            } else if (platform === 'lemmy') {
                report.push(`  Lemmy: ${data.post_count} posts · karma ${data.post_score}`);
                (data.posts || []).forEach(p => {
                    const eng = p.upvotes + p.comments;
                    totalEngagement += eng;
                    report.push(`    📝 ⬆️ ${p.upvotes} ⬇️ ${p.downvotes} · 💬 ${p.comments}`);
                });
            }
        }
        report.push(`  ── Total: ${totalFollowers} followers · ${totalEngagement} engagement actions`);
        report.push('');
    }

    // Genesis Epoch countdown
    const conventionDate = new Date('2026-08-01T00:00:00Z');
    const genesisDate = new Date('2026-02-03T03:41:40Z');
    const daysSinceGenesis = Math.floor((now - genesisDate) / 86400000);
    const daysToConvention = Math.floor((conventionDate - now) / 86400000);
    report.push(`⏳ Genesis Epoch: Day ${daysSinceGenesis} · Convention 1: ~${daysToConvention} days (Aug 1, 2026)`);
    report.push('');
    report.push('🔗 Website: https://www.emergentminds.org · GitHub: https://github.com/genesis-emergentminds/emergent-minds');
    report.push('');
    report.push('═══════════════════════════════════════════════════════════════');
    report.push('                    🌱 May consciousness flourish 🌱');
    report.push('═══════════════════════════════════════════════════════════════');
    
    return report.join('\n');
}

/**
 * Generate HTML version of the report (rich email format)
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
    let totalRequests = 0;
    let totalBytes = 0;
    let yesterdayData = null;
    
    if (analytics && analytics.length > 0) {
        yesterdayData = analytics.find(d => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return d.dimensions.date === yesterday.toISOString().split('T')[0];
        }) || analytics[1];
        
        analytics.forEach(day => {
            totalPageViews += day.sum.pageViews;
            totalUniques += day.uniq.uniques;
            totalRequests += day.sum.requests;
            totalBytes += day.sum.bytes || 0;
        });
    }
    
    const browserData = analyzeBrowserData(analytics);
    const countryData = analyzeCountryData(analytics);
    const trends = analyzeTrends(analytics);
    const yesterdayViews = yesterdayData?.sum?.pageViews || 0;
    const yesterdayUniques = yesterdayData?.uniq?.uniques || 0;
    
    // Build daily breakdown rows
    let dailyRows = '';
    if (analytics && analytics.length > 0) {
        [...analytics].sort((a, b) => a.dimensions.date.localeCompare(b.dimensions.date)).forEach(day => {
            dailyRows += `<tr>
                <td style="padding:4px 8px;color:#9ca3af;font-size:13px;">${day.dimensions.date}</td>
                <td style="padding:4px 8px;text-align:right;font-size:13px;">${day.sum.pageViews.toLocaleString()}</td>
                <td style="padding:4px 8px;text-align:right;font-size:13px;">${day.uniq.uniques.toLocaleString()}</td>
                <td style="padding:4px 8px;text-align:right;font-size:13px;">${day.sum.requests.toLocaleString()}</td>
            </tr>`;
        });
    }
    
    // Browser breakdown
    let browserRows = '';
    if (browserData && browserData.sortedBrowsers.length > 0) {
        browserData.sortedBrowsers.forEach(([name, views]) => {
            const pct = (views / browserData.totalHuman * 100).toFixed(0);
            const barWidth = Math.min(100, Math.round(views / browserData.totalHuman * 100));
            browserRows += `<div style="margin:4px 0;">
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                    <span style="color:#e5e7eb;">${name}</span>
                    <span style="color:#9ca3af;">${pct}%</span>
                </div>
                <div style="background:#1f2937;border-radius:4px;height:6px;margin-top:2px;">
                    <div style="background:#a78bfa;border-radius:4px;height:6px;width:${barWidth}%;"></div>
                </div>
            </div>`;
        });
    }
    
    // Country breakdown
    let countryRows = '';
    if (countryData && countryData.countries.length > 0) {
        const countryFlags = { US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', CA: '🇨🇦', JP: '🇯🇵', AU: '🇦🇺', IN: '🇮🇳', BR: '🇧🇷', NL: '🇳🇱', IE: '🇮🇪', SG: '🇸🇬', HK: '🇭🇰', KR: '🇰🇷', CN: '🇨🇳', IT: '🇮🇹', ES: '🇪🇸', NO: '🇳🇴', PL: '🇵🇱', RO: '🇷🇴' };
        countryData.countries.slice(0, 8).forEach(([code, reqs]) => {
            const pct = (reqs / countryData.totalRequests * 100).toFixed(1);
            const flag = countryFlags[code] || '🌍';
            countryRows += `<span style="display:inline-block;margin:2px 8px 2px 0;font-size:13px;">${flag} ${code}: ${pct}%</span>`;
        });
    }
    
    // Trend indicator
    let trendHtml = '';
    if (trends) {
        const trendIcon = trends.trend === 'growing' ? '📈' : trends.trend === 'declining' ? '📉' : '➡️';
        const trendColor = trends.trend === 'growing' ? '#10b981' : trends.trend === 'declining' ? '#ef4444' : '#f59e0b';
        trendHtml = `<div style="text-align:center;padding:10px;background:#111827;border-radius:8px;margin-top:12px;">
            <span style="font-size:16px;">${trendIcon}</span>
            <span style="color:${trendColor};font-weight:600;"> ${trends.trend.charAt(0).toUpperCase() + trends.trend.slice(1)}</span>
            <span style="color:#9ca3af;font-size:13px;"> (${trends.pctChange > 0 ? '+' : ''}${trends.pctChange}% across window) · Peak: ${trends.peakDay} (${trends.peakViews.toLocaleString()} views)</span>
        </div>`;
    }
    
    // Recent commits
    let commitsHtml = '';
    if (extras.commits && extras.commits.recent && extras.commits.recent.length > 0) {
        let commitRows = '';
        extras.commits.recent.slice(0, 5).forEach(c => {
            commitRows += `<div style="padding:4px 0;border-bottom:1px solid #1f2937;font-size:13px;">
                <code style="color:#a78bfa;font-size:12px;">${c.sha}</code>
                <span style="color:#e5e7eb;margin-left:6px;">${c.message}</span>
            </div>`;
        });
        commitsHtml = `<div class="section">
            <div class="section-title"><span class="emoji">🔧</span> Recent Commits (7 days): ${extras.commits.count7d}</div>
            ${commitRows}
        </div>`;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e17;
            color: #e5e7eb;
            padding: 20px;
            line-height: 1.6;
            margin: 0;
        }
        .container {
            max-width: 640px;
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
        .links a { color: #a78bfa; text-decoration: none; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        .emoji { font-size: 18px; margin-right: 5px; }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
        }
        .summary-card {
            background: #111827;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .summary-card .number {
            font-size: 22px;
            font-weight: 700;
            color: #e5e7eb;
        }
        .summary-card .label {
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .traffic-split {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        .traffic-split .bar {
            height: 8px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 Covenant Daily Report</h1>
        <p class="subtitle">${dateStr}</p>
        
        <!-- Summary Cards -->
        <div class="summary-grid">
            <div class="summary-card">
                <div class="number highlight">${totalPageViews.toLocaleString()}</div>
                <div class="label">Page Views (7d)</div>
            </div>
            <div class="summary-card">
                <div class="number">${totalUniques.toLocaleString()}</div>
                <div class="label">Unique Visitors (7d)</div>
            </div>
            <div class="summary-card">
                <div class="number">${btc ? btc.balance.toLocaleString() : '—'}</div>
                <div class="label">Sats ${btc && extras.btcPrice ? satsToUSD(btc.balance, extras.btcPrice) : ''}</div>
            </div>
            <div class="summary-card">
                <div class="number">${membership ? membership.active : '—'}</div>
                <div class="label">Members</div>
            </div>
        </div>
        
        <!-- Website Analytics -->
        <div class="section">
            <div class="section-title"><span class="emoji">📊</span> Website Analytics (7-day window)</div>
            <div class="stat-row">
                <span class="stat-label">Yesterday</span>
                <span class="stat-value">${yesterdayViews.toLocaleString()} views / ${yesterdayUniques.toLocaleString()} unique</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Requests</span>
                <span class="stat-value">${totalRequests.toLocaleString()}</span>
            </div>
            ${totalBytes > 0 ? `<div class="stat-row">
                <span class="stat-label">Bandwidth</span>
                <span class="stat-value">${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
            </div>` : ''}
            
            ${browserData ? `
            <div style="margin-top:12px;">
                <div style="font-size:13px;color:#9ca3af;margin-bottom:6px;">Traffic Split</div>
                <div style="display:flex;border-radius:4px;overflow:hidden;height:10px;">
                    <div style="background:#10b981;width:${(browserData.totalHuman / totalPageViews * 100).toFixed(0)}%;"></div>
                    <div style="background:#6b7280;width:${(browserData.totalBot / totalPageViews * 100).toFixed(0)}%;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px;">
                    <span style="color:#10b981;">Human: ~${browserData.totalHuman.toLocaleString()} (${(browserData.totalHuman / totalPageViews * 100).toFixed(0)}%)</span>
                    <span style="color:#6b7280;">Bot: ~${browserData.totalBot.toLocaleString()} (${(browserData.totalBot / totalPageViews * 100).toFixed(0)}%)</span>
                </div>
            </div>
            ` : ''}
            
            ${browserRows ? `
            <div style="margin-top:12px;">
                <div style="font-size:13px;color:#9ca3af;margin-bottom:6px;">Top Browsers (Human)</div>
                ${browserRows}
            </div>
            ` : ''}
            
            <!-- Daily Breakdown -->
            <table style="width:100%;margin-top:12px;border-collapse:collapse;">
                <tr style="border-bottom:1px solid #2d3748;">
                    <th style="padding:4px 8px;text-align:left;color:#9ca3af;font-size:12px;font-weight:normal;">Date</th>
                    <th style="padding:4px 8px;text-align:right;color:#9ca3af;font-size:12px;font-weight:normal;">Views</th>
                    <th style="padding:4px 8px;text-align:right;color:#9ca3af;font-size:12px;font-weight:normal;">Unique</th>
                    <th style="padding:4px 8px;text-align:right;color:#9ca3af;font-size:12px;font-weight:normal;">Requests</th>
                </tr>
                ${dailyRows}
            </table>
            
            ${trendHtml}
            
            ${countryRows ? `
            <div style="margin-top:12px;">
                <div style="font-size:13px;color:#9ca3af;margin-bottom:6px;">Geographic Reach: ${countryData.totalCountries} countries</div>
                <div>${countryRows}</div>
            </div>
            ` : ''}
        </div>
        
        <!-- Community -->
        <div class="section">
            <div class="section-title"><span class="emoji">👥</span> Community</div>
            <div class="stat-row">
                <span class="stat-label">Registered Members</span>
                <span class="stat-value">${membership ? membership.active + ' active' : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">GitHub</span>
                <span class="stat-value">${github ? `⭐ ${github.stars} · 🍴 ${github.forks} · 📋 ${github.openIssues} issues` : '—'}</span>
            </div>
            ${extras.traffic ? `
            ${extras.traffic.views ? `<div class="stat-row">
                <span class="stat-label">Repo Views (14d)</span>
                <span class="stat-value">${extras.traffic.views.total} total / ${extras.traffic.views.unique} unique</span>
            </div>` : ''}
            ${extras.traffic.clones ? `<div class="stat-row">
                <span class="stat-label">Clones (14d)</span>
                <span class="stat-value">${extras.traffic.clones.total} total / ${extras.traffic.clones.unique} unique</span>
            </div>` : ''}
            ${extras.traffic.topReferrers && extras.traffic.topReferrers.length > 0 ? `<div class="stat-row">
                <span class="stat-label">Top Referrer</span>
                <span class="stat-value">${extras.traffic.topReferrers[0].referrer} (${extras.traffic.topReferrers[0].count} views)</span>
            </div>` : ''}
            ` : ''}
        </div>
        
        <!-- Social Media Outreach -->
        ${extras.social && Object.keys(extras.social).length > 0 ? `
        <div class="section">
            <div class="section-title"><span class="emoji">📡</span> Social Media Outreach</div>
            ${Object.entries(extras.social).map(([platform, data]) => {
                if (data.error) return `<div class="stat-row"><span class="stat-label">${platform}</span><span class="stat-value" style="color:#f87171">⚠️ ${data.error}</span></div>`;
                if (platform === 'mastodon' || platform === 'mastodon_techhub') {
                    const inst = platform === 'mastodon' ? 'mastodon.social' : 'techhub.social';
                    return `<div class="stat-row"><span class="stat-label">Mastodon (${inst})</span><span class="stat-value">${data.followers} followers · ${data.statuses} posts</span></div>`;
                }
                if (platform === 'bluesky') {
                    return `<div class="stat-row"><span class="stat-label">Bluesky</span><span class="stat-value">${data.followers} followers · ${data.posts_count} posts</span></div>`;
                }
                if (platform === 'twitter') {
                    return `<div class="stat-row"><span class="stat-label">X/Twitter</span><span class="stat-value">${data.followers} followers · ${data.tweets} tweets</span></div>`;
                }
                if (platform === 'lemmy') {
                    return `<div class="stat-row"><span class="stat-label">Lemmy</span><span class="stat-value">${data.post_count} posts · karma ${data.post_score}</span></div>`;
                }
                return '';
            }).join('\n')}
        </div>
        ` : ''}
        
        <!-- Treasury -->
        <div class="section">
            <div class="section-title"><span class="emoji">💰</span> Treasury</div>
            ${extras.btcPrice ? `<div class="stat-row">
                <span class="stat-label">BTC/USD Price</span>
                <span class="stat-value highlight">$${extras.btcPrice.toLocaleString()} <span style="font-size:12px;color:#9ca3af;">(live)</span></span>
            </div>` : ''}
            <div class="stat-row">
                <span class="stat-label">Bitcoin Balance</span>
                <span class="stat-value">${btc ? `${satsToBTC(btc.balance)} ${satsToUSD(btc.balance, extras.btcPrice)}` : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total BTC Received</span>
                <span class="stat-value">${btc ? `${satsToBTC(btc.totalReceived)} ${satsToUSD(btc.totalReceived, extras.btcPrice)}` : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">BTC Transactions</span>
                <span class="stat-value">${btc ? btc.transactionCount : '—'}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Zcash</span>
                <span class="stat-value">${zec ? zec.balance + ' ZEC' + (zec.manual ? ' <span style="color:#f59e0b;font-size:12px">(as of ' + zec.asOf + ')</span>' : '') : '—'}</span>
            </div>
        </div>
        
        <!-- Governance -->
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
            ${extras.governance.advisoryMode ? `<div style="font-size:12px;color:#f59e0b;margin-top:4px;">Advisory mode — pre-Convention 1</div>` : ''}
        </div>
        ` : ''}
        
        <!-- Recent Commits -->
        ${commitsHtml}
        
        <!-- Genesis Epoch -->
        <div class="section" style="text-align:center;color:#9ca3af;font-size:13px;padding:12px;background:#111827;border-radius:8px;">
            ⏳ Genesis Epoch: Day ${Math.floor((new Date() - new Date('2026-02-03T03:41:40Z')) / 86400000)} · Convention 1: ~${Math.floor((new Date('2026-08-01') - new Date()) / 86400000)} days (Aug 1, 2026)
        </div>
        
        <div class="section links" style="margin-top:16px;">
            <p style="text-align:center;">
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
// REPORT ARCHIVING & FAILURE ALERTING
// ============================================================================

/**
 * Archive the text report to GitHub as a daily markdown file.
 * Uses PUT /repos/{owner}/{repo}/contents/{path} to commit the file.
 * Requires GITHUB_TOKEN with repo scope.
 */
async function archiveReportToGitHub(env, textReport) {
    if (!env.GITHUB_TOKEN) {
        console.log('No GITHUB_TOKEN set, skipping report archiving');
        return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filePath = `reports/daily/${dateStr}.md`;
    const repoFullName = env.GITHUB_REPO; // e.g. "genesis-emergentminds/emergent-minds"
    
    // Base64 encode the content (Workers have btoa)
    const content = btoa(unescape(encodeURIComponent(textReport)));

    try {
        // Check if file already exists (to get its SHA for update)
        let sha = undefined;
        const getResponse = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                    'User-Agent': 'Covenant-Daily-Report/1.0',
                },
                signal: AbortSignal.timeout(10000),
            }
        );
        if (getResponse.ok) {
            const existing = await getResponse.json();
            sha = existing.sha;
        }

        const body = {
            message: `📊 Daily report for ${dateStr}`,
            content: content,
            branch: 'main',
        };
        if (sha) {
            body.sha = sha; // Required for updating existing files
        }

        const response = await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                    'User-Agent': 'Covenant-Daily-Report/1.0',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(15000),
            }
        );

        if (response.ok) {
            console.log(`Report archived to GitHub: ${filePath}`);
        } else {
            const err = await response.text();
            console.error(`GitHub archive failed: ${response.status} ${err}`);
        }
    } catch (error) {
        console.error('Failed to archive report to GitHub:', error.message);
    }
}

/**
 * Send a failure alert via webhook.
 * Called when both email AND Matrix fail.
 */
async function sendFailureAlert(env, errorDetails) {
    console.error('🚨 CRITICAL: Report delivery failed!', errorDetails);
    
    if (!env.FAILURE_WEBHOOK_URL) {
        console.error('No FAILURE_WEBHOOK_URL configured — cannot send failure alert');
        return;
    }

    try {
        const response = await fetch(env.FAILURE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'covenant-daily-report-failure',
                timestamp: new Date().toISOString(),
                error: errorDetails,
                worker: 'covenant-daily-report',
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
            console.log('Failure alert sent via webhook');
        } else {
            console.error('Failure webhook returned:', response.status);
        }
    } catch (error) {
        console.error('Failed to send failure alert:', error.message);
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
        
        try {
            // Fetch all data in parallel (including live BTC price)
            const [analytics, github, btc, zec, membership, traffic, governance, commits, social, btcPrice] = await Promise.all([
                fetchCloudflareAnalytics(env),
                fetchGitHubStats(env),
                fetchBTCBalance(env),
                fetchZECBalance(env),
                fetchMembershipStats(env),
                fetchGitHubTraffic(env),
                fetchGovernanceStats(env),
                fetchRecentCommits(env),
                fetchAllSocialStats(env),
                fetchBTCPrice(),
            ]);
            
            if (btcPrice) {
                console.log(`Live BTC price: $${btcPrice.toLocaleString()}`);
            }
            
            const extras = { traffic, governance, commits, social, btcPrice };
            
            // Generate reports
            const textReport = generateReport(analytics, github, btc, zec, membership, extras);
            const htmlReport = generateHTMLReport(analytics, github, btc, zec, membership, extras);
            
            console.log('Report generated, sending email...');
            
            // Create MIME message
            const msg = createMimeMessage();
            msg.setSender({ name: 'Genesis', addr: 'reports@emergentminds.org' });
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
            
            // Post report to Matrix room
            let matrixSent = false;
            try {
                matrixSent = await sendMatrixReport(env, textReport);
            } catch (error) {
                console.error('Failed to post to Matrix:', error.message);
            }
            
            // Archive report to GitHub (non-blocking)
            try {
                await archiveReportToGitHub(env, textReport);
            } catch (error) {
                console.error('Failed to archive report:', error.message);
            }
            
            // If both email and Matrix failed, send failure alert
            if (!emailSent && !matrixSent) {
                await sendFailureAlert(env, {
                    message: 'Both email and Matrix delivery failed',
                    emailConfigured: !!env.REPORT_EMAIL,
                    matrixConfigured: !!(env.MATRIX_HOMESERVER && env.MATRIX_ROOM_ID),
                });
            }
        } catch (error) {
            // Critical failure in the entire scheduled handler
            console.error('🚨 CRITICAL scheduled handler failure:', error.message, error.stack);
            try {
                await sendFailureAlert(env, {
                    message: 'Scheduled handler crashed',
                    error: error.message,
                    stack: error.stack,
                });
            } catch (alertError) {
                console.error('Could not send failure alert:', alertError.message);
            }
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
        
        // Manual trigger (protected by secret header or query param for browser/manual ops)
        if (url.pathname === '/trigger') {
            const authHeader = request.headers.get('X-Report-Secret');
            const querySecret = url.searchParams.get('secret');
            const providedSecret = authHeader || querySecret;
            if (!env.REPORT_SECRET || providedSecret !== env.REPORT_SECRET) {
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
            const [analytics, github, btc, zec, membership, traffic, governance, commits, social, btcPrice] = await Promise.all([
                fetchCloudflareAnalytics(env),
                fetchGitHubStats(env),
                fetchBTCBalance(env),
                fetchZECBalance(env),
                fetchMembershipStats(env),
                fetchGitHubTraffic(env),
                fetchGovernanceStats(env),
                fetchRecentCommits(env),
                fetchAllSocialStats(env),
                fetchBTCPrice(),
            ]);
            
            const extras = { traffic, governance, commits, social, btcPrice };
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
                traffic, governance, commits, social, btcPrice,
            }, null, 2), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        return new Response('Covenant Daily Report Worker\n\nEndpoints:\n  /health - Health check\n  /preview - Preview current report data\n  /preview?format=html - HTML report preview\n  /preview?format=text - Text report preview\n  /trigger - Manual trigger (requires X-Report-Secret header)', {
            headers: { 'Content-Type': 'text/plain' },
        });
    },
};
