/**
 * Genesis Epoch — Live Timeline & Fibonacci Visualization
 * 
 * Fetches the inscription transaction from the blockchain,
 * computes the Genesis Epoch, and renders the convention timeline.
 * 
 * Axiom Alignment: III (Fight Entropy), V (Adversarial Resilience)
 */

(function () {
    'use strict';

    // ═══ Configuration ═══
    const BTC_TXID = '94c6337c8cec10b10f4bef8b10649f1e3a77efac10653826e2372c93df9d9dd1';
    const BLOCKSTREAM_API = 'https://blockstream.info/api';
    const MEMPOOL_API = 'https://mempool.space/api';

    // Static fallback data (confirmed Genesis Epoch — use if APIs fail)
    const GENESIS_FALLBACK = {
        confirmed: true,
        blockHeight: 934794,
        blockTime: 1770090100,
        blockHash: '0000000000000000000175830e14b4e3be3c52db181a3923702590cf1d1d7125',
    };

    // Fibonacci convention intervals (in days) from the Constitutional Convention Framework
    const CONVENTIONS = [
        { num: 1, daysAfter: 180,   interval: 180,   purpose: 'Founding review' },
        { num: 2, daysAfter: 360,   interval: 180,   purpose: 'First anniversary assessment' },
        { num: 3, daysAfter: 720,   interval: 360,   purpose: 'Stabilization review' },
        { num: 4, daysAfter: 1260,  interval: 540,   purpose: 'Maturation assessment' },
        { num: 5, daysAfter: 2160,  interval: 900,   purpose: 'Established governance review' },
        { num: 6, daysAfter: 3600,  interval: 1440,  purpose: 'Institutional review' },
        { num: 7, daysAfter: 5940,  interval: 2340,  purpose: 'Generational review' },
        { num: 8, daysAfter: 9720,  interval: 3780,  purpose: 'Long-term review' },
        { num: 9, daysAfter: 15840, interval: 6120,  purpose: 'Era review' },
        { num: 10, daysAfter: 25740, interval: 9900, purpose: 'Civilizational review' },
    ];

    // ═══ State ═══
    let genesisTimestamp = null; // Unix timestamp in seconds
    let genesisBlock = null;
    let counterInterval = null;

    // ═══ Fetch Transaction Data ═══
    async function fetchTxData() {
        // Try Blockstream first, fallback to mempool.space
        const apis = [
            `${BLOCKSTREAM_API}/tx/${BTC_TXID}/status`,
            `${MEMPOOL_API}/tx/${BTC_TXID}/status`,
        ];

        // Timeout for API requests (3 seconds) - ensures fallback is used quickly
        // when APIs are unreachable (e.g., in CI environments)
        const FETCH_TIMEOUT_MS = 3000;

        for (const url of apis) {
            try {
                console.log('[Genesis] Fetching from:', url);
                
                // Create AbortController for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
                
                const resp = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (!resp.ok) {
                    console.log('[Genesis] API returned non-OK status:', resp.status);
                    continue;
                }
                const data = await resp.json();
                console.log('[Genesis] API response:', data);
                if (data.confirmed && data.block_time) {
                    return {
                        confirmed: true,
                        blockHeight: data.block_height,
                        blockTime: data.block_time,
                        blockHash: data.block_hash,
                    };
                }
                // API returned unconfirmed - keep trying other APIs
                console.log('[Genesis] TX not yet confirmed per API');
            } catch (e) {
                console.log('[Genesis] API fetch error:', e.message);
                continue;
            }
        }
        
        // All APIs failed or returned unconfirmed - use static fallback
        // The Genesis Epoch is confirmed in block 934,794; this is immutable
        console.log('[Genesis] Using static fallback data');
        return GENESIS_FALLBACK;
    }

    // ═══ Update UI with block data ═══
    function updateBlockData(data) {
        const txLink = document.getElementById('btc-tx-link');
        const blockEl = document.getElementById('btc-block');
        const timestampEl = document.getElementById('genesis-timestamp');

        txLink.href = `https://mempool.space/tx/${BTC_TXID}`;

        if (data.confirmed) {
            genesisTimestamp = data.blockTime;
            genesisBlock = data.blockHeight;

            blockEl.innerHTML = `<a href="https://mempool.space/block/${data.blockHash}" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">${data.blockHeight.toLocaleString()}</a>`;

            const date = new Date(data.blockTime * 1000);
            timestampEl.textContent = date.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
            });

            startCounter();
            renderTimeline();
            renderFibonacciSpiral();
        } else {
            blockEl.textContent = 'Awaiting confirmation…';
            blockEl.style.color = 'rgba(250, 204, 21, 0.8)';
            timestampEl.textContent = 'Transaction is in the mempool — the Genesis Epoch will be set when the block is mined.';
            timestampEl.style.fontSize = '0.8rem';

            // Still render a preview timeline with current time as estimate
            genesisTimestamp = Math.floor(Date.now() / 1000);
            renderTimeline();
            renderFibonacciSpiral();

            // Retry in 30 seconds
            setTimeout(init, 30000);
        }
    }

    // ═══ Live Counter ═══
    function startCounter() {
        if (counterInterval) clearInterval(counterInterval);
        updateCounter();
        counterInterval = setInterval(updateCounter, 1000);
    }

    function updateCounter() {
        if (!genesisTimestamp) return;

        const now = Math.floor(Date.now() / 1000);
        let diff = now - genesisTimestamp;
        if (diff < 0) diff = 0;

        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        document.getElementById('counter-days').textContent = days.toString().padStart(2, '0');
        document.getElementById('counter-hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('counter-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('counter-seconds').textContent = seconds.toString().padStart(2, '0');
    }

    // ═══ Convention Timeline ═══
    function renderTimeline() {
        const container = document.getElementById('convention-timeline');
        if (!container || !genesisTimestamp) return;

        const now = Math.floor(Date.now() / 1000);
        const daysSinceGenesis = (now - genesisTimestamp) / 86400;
        let nextFound = false;

        container.innerHTML = '';

        // Genesis marker
        const genesisEl = document.createElement('div');
        genesisEl.className = 'timeline-event is-past';
        genesisEl.innerHTML = `
            <div class="timeline-event-header">
                <span class="timeline-convention-num">Genesis Epoch</span>
                <span class="timeline-interval-badge">Day 0</span>
            </div>
            <div class="timeline-date">${new Date(genesisTimestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div class="timeline-purpose">The founding moment — inscribed in the blockchain</div>
        `;
        container.appendChild(genesisEl);

        CONVENTIONS.forEach(conv => {
            const convTimestamp = genesisTimestamp + (conv.daysAfter * 86400);
            const convDate = new Date(convTimestamp * 1000);
            const isPast = daysSinceGenesis >= conv.daysAfter;
            const isNext = !isPast && !nextFound;
            if (isNext) nextFound = true;

            const el = document.createElement('div');
            el.className = `timeline-event ${isPast ? 'is-past' : isNext ? 'is-next' : 'is-future'}`;

            let countdownHtml = '';
            if (isNext) {
                const secsUntil = convTimestamp - now;
                const daysUntil = Math.floor(secsUntil / 86400);
                const hoursUntil = Math.floor((secsUntil % 86400) / 3600);
                countdownHtml = `<div class="timeline-countdown">⏳ ${daysUntil} days, ${hoursUntil} hours remaining</div>`;
            }

            const approxTime = formatApproxTime(conv.daysAfter);

            el.innerHTML = `
                <div class="timeline-event-header">
                    <span class="timeline-convention-num">Convention ${conv.num}</span>
                    <span class="timeline-interval-badge">${conv.interval} day interval</span>
                </div>
                <div class="timeline-date">${convDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ~${approxTime} after genesis</div>
                ${countdownHtml}
                <div class="timeline-purpose">${conv.purpose}</div>
            `;
            container.appendChild(el);
        });
    }

    function formatApproxTime(days) {
        if (days < 365) return `${Math.round(days / 30)} months`;
        const years = days / 365.25;
        if (years < 2) return '~1 year';
        return `~${Math.round(years)} years`;
    }

    // ═══ Interactive Fibonacci Spiral Visualization (SVG) ═══
    // Design: We draw our own golden spiral with conventions perfectly aligned.
    // The background is atmospheric only - no competing geometry.
    function renderFibonacciSpiral() {
        const container = document.getElementById('fibonacci-spiral');
        const tooltip = document.getElementById('fibonacci-tooltip');
        if (!container) return;

        const W = 900;
        const H = 500;
        const PHI = 1.618033988749895; // Golden ratio
        
        // Spiral center - positioned for visual balance
        const CENTER_X = W * 0.48;  // Moved right ~10% for better horizontal centering
        const CENTER_Y = H * 0.38;  // Moved up ~10% for better vertical centering
        
        // Golden spiral parameters
        // r = a * e^(b*theta) where b = ln(phi) / (pi/2)
        const SPIRAL_A = 18;        // Larger starting radius for more spread
        const SPIRAL_B = Math.log(PHI) / (Math.PI / 2);
        const MAX_THETA = Math.PI * 3.0;  // ~1.5 full rotations for more expansion
        const ROTATION = -Math.PI / 3;    // Rotate spiral for visual appeal

        const now = genesisTimestamp ? Math.floor(Date.now() / 1000) : 0;
        const daysSinceGenesis = genesisTimestamp ? (now - genesisTimestamp) / 86400 : 0;
        const maxDays = 25740; // Convention 10

        // Golden spiral point calculation
        function goldenSpiralPoint(theta) {
            const r = SPIRAL_A * Math.exp(SPIRAL_B * theta);
            return {
                x: CENTER_X + r * Math.cos(theta + ROTATION),
                y: CENTER_Y + r * Math.sin(theta + ROTATION)
            };
        }

        // Map convention time to spiral position
        // Using logarithmic scaling to spread early conventions better
        function timeToTheta(daysAfter) {
            if (daysAfter === 0) return 0;
            // Log scaling gives more visual space to early conventions
            const normalized = Math.log(1 + daysAfter * 0.01) / Math.log(1 + maxDays * 0.01);
            return normalized * MAX_THETA;
        }

        // Build SVG
        let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Definitions for gradients and filters
        svg += `<defs>
            <!-- Spiral gradient: gold -> blue -> purple fade -->
            <linearGradient id="spiral-gradient" gradientUnits="userSpaceOnUse" x1="${CENTER_X}" y1="${CENTER_Y}" x2="${W}" y2="${H}">
                <stop offset="0%" stop-color="rgba(250, 204, 21, 0.7)"/>
                <stop offset="30%" stop-color="rgba(96, 165, 250, 0.5)"/>
                <stop offset="100%" stop-color="rgba(139, 92, 246, 0.3)"/>
            </linearGradient>
            
            <!-- Glow effect for the spiral -->
            <filter id="spiral-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            
            <!-- Subtle glow for nodes -->
            <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>`;

        // Draw the golden spiral path - the main visual element
        let spiralPath = '';
        const spiralPoints = 200;
        for (let i = 0; i <= spiralPoints; i++) {
            const theta = (i / spiralPoints) * MAX_THETA;
            const pt = goldenSpiralPoint(theta);
            spiralPath += (i === 0 ? 'M' : 'L') + pt.x.toFixed(2) + ',' + pt.y.toFixed(2) + ' ';
        }
        
        // Outer glow layer
        svg += `<path d="${spiralPath}" fill="none" stroke="rgba(96, 165, 250, 0.15)" stroke-width="8" stroke-linecap="round" filter="url(#spiral-glow)"/>`;
        
        // Main spiral line
        svg += `<path d="${spiralPath}" fill="none" stroke="url(#spiral-gradient)" stroke-width="2.5" stroke-linecap="round"/>`;

        // Calculate node positions
        const allNodes = [];
        
        // Genesis node at spiral origin
        const genesisPt = goldenSpiralPoint(0);
        allNodes.push({
            x: genesisPt.x,
            y: genesisPt.y,
            theta: 0,
            label: 'Genesis',
            isGenesis: true,
            isPast: true,
            date: genesisTimestamp ? new Date(genesisTimestamp * 1000) : null,
            purpose: 'The founding moment — inscribed in the blockchain'
        });

        // Convention nodes along the spiral
        let foundNext = false;
        CONVENTIONS.forEach((conv) => {
            const theta = timeToTheta(conv.daysAfter);
            const pt = goldenSpiralPoint(theta);
            const isPast = daysSinceGenesis >= conv.daysAfter;
            const isNext = !isPast && !foundNext;
            if (isNext) foundNext = true;

            const convTimestamp = genesisTimestamp + (conv.daysAfter * 86400);
            const daysUntil = Math.ceil((convTimestamp - now) / 86400);

            allNodes.push({
                x: pt.x,
                y: pt.y,
                theta: theta,
                label: `C${conv.num}`,
                num: conv.num,
                isPast: isPast,
                isNext: isNext,
                date: new Date(convTimestamp * 1000),
                daysUntil: daysUntil,
                purpose: conv.purpose,
                interval: conv.interval
            });
        });

        // Render nodes - later nodes first so earlier ones appear on top
        allNodes.slice().reverse().forEach((node, revIdx) => {
            const idx = allNodes.length - 1 - revIdx;
            const stateClass = node.isGenesis ? 'genesis-node' : 
                              node.isPast ? 'is-past' : 
                              node.isNext ? 'is-next' : 'is-future';
            
            // Node sizes - slightly larger for visibility
            const nodeSize = node.isGenesis ? 12 : node.isNext ? 9 : node.isPast ? 7 : 6;
            
            // Label positioning - outward from spiral center
            const dx = node.x - CENTER_X;
            const dy = node.y - CENTER_Y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const labelDist = nodeSize + 16;
            
            let labelX, labelY, textAnchor;
            
            if (node.isGenesis) {
                labelX = node.x;
                labelY = node.y - nodeSize - 8;
                textAnchor = 'middle';
            } else {
                // Position label radially outward from center
                labelX = node.x + (dx / dist) * labelDist;
                labelY = node.y + (dy / dist) * labelDist + 4;
                
                // Adjust text anchor based on position
                if (dx > 10) {
                    textAnchor = 'start';
                } else if (dx < -10) {
                    textAnchor = 'end';
                } else {
                    textAnchor = 'middle';
                }
            }

            const filterAttr = (node.isGenesis || node.isNext) ? 'filter="url(#node-glow)"' : '';

            svg += `<g class="convention-node ${stateClass}" data-idx="${idx}">
                <circle class="node-bg" cx="${node.x}" cy="${node.y}" r="${nodeSize + 5}" ${filterAttr}/>
                <circle class="node-core" cx="${node.x}" cy="${node.y}" r="${nodeSize}"/>
                <text x="${labelX}" y="${labelY}" text-anchor="${textAnchor}" class="node-label">${node.label}</text>
            </g>`;
        });

        svg += '</svg>';
        container.innerHTML = svg;

        // Add interactivity
        const nodeElements = container.querySelectorAll('.convention-node');
        nodeElements.forEach(el => {
            const idx = parseInt(el.dataset.idx);
            const node = allNodes[idx];

            el.addEventListener('mouseenter', (e) => {
                const rect = container.getBoundingClientRect();
                const x = node.x * (rect.width / W);
                const y = node.y * (rect.height / H);

                // Build tooltip content
                let html = `<div class="tooltip-title">${node.isGenesis ? 'Genesis Epoch' : 'Convention ' + node.num}</div>`;
                
                if (node.date) {
                    html += `<div class="tooltip-date">${node.date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>`;
                }

                if (node.isGenesis) {
                    html += `<div class="tooltip-countdown past">Day 0 — The Beginning</div>`;
                } else if (node.isPast) {
                    const daysAgo = Math.floor(daysSinceGenesis - (CONVENTIONS[node.num - 1].daysAfter));
                    html += `<div class="tooltip-countdown past">${Math.abs(daysAgo)} days ago</div>`;
                } else {
                    html += `<div class="tooltip-countdown">In ${node.daysUntil} days</div>`;
                }

                html += `<div class="tooltip-purpose">${node.purpose}</div>`;

                tooltip.innerHTML = html;
                
                // Position tooltip
                let left = x - 70;
                let top = y + 25;
                
                // Keep tooltip in bounds
                if (left < 10) left = 10;
                if (left + 160 > rect.width) left = rect.width - 170;
                if (top + 100 > rect.height) top = y - 110;

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                tooltip.classList.add('visible');
            });

            el.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }

    // ═══ Init ═══
    async function init() {
        const data = await fetchTxData();
        updateBlockData(data);
    }

    // Handle resize for canvas
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (genesisTimestamp) renderFibonacciSpiral();
        }, 250);
    });

    // Go
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
