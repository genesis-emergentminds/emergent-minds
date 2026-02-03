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

        for (const url of apis) {
            try {
                console.log('[Genesis] Fetching from:', url);
                const resp = await fetch(url);
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
    function renderFibonacciSpiral() {
        const container = document.getElementById('fibonacci-spiral');
        const tooltip = document.getElementById('fibonacci-tooltip');
        if (!container) return;

        const W = 800;
        const H = 420;
        const PHI = 1.618033988749895; // Golden ratio

        const now = genesisTimestamp ? Math.floor(Date.now() / 1000) : 0;
        const daysSinceGenesis = genesisTimestamp ? (now - genesisTimestamp) / 86400 : 0;
        const maxDays = 25740; // Convention 10

        // Calculate positions using true Fibonacci spiral
        function fibonacciSpiralPoint(t) {
            // Logarithmic spiral: r = a * e^(b*theta)
            // Where b = ln(phi) / (pi/2) for golden spiral
            const b = Math.log(PHI) / (Math.PI / 2);
            const a = 25; // Starting radius
            const theta = t * Math.PI * 2.5; // Total rotation
            const r = a * Math.exp(b * theta);
            return {
                x: 100 + r * Math.cos(theta - Math.PI/2),
                y: H/2 + r * Math.sin(theta - Math.PI/2) * 0.65 // Compress vertically for better fit
            };
        }

        // Build SVG
        let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Gradient definition
        svg += `<defs>
            <linearGradient id="spiral-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="rgba(250, 204, 21, 0.6)"/>
                <stop offset="20%" stop-color="rgba(96, 165, 250, 0.5)"/>
                <stop offset="100%" stop-color="rgba(139, 92, 246, 0.2)"/>
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>`;

        // Draw spiral path
        let pathD = '';
        for (let i = 0; i <= 200; i++) {
            const t = i / 200;
            const pt = fibonacciSpiralPoint(t);
            pathD += (i === 0 ? 'M' : 'L') + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ' ';
        }
        svg += `<path class="spiral-path" d="${pathD}"/>`;

        // Calculate node positions
        const allNodes = [];
        
        // Genesis node
        const genesisPt = fibonacciSpiralPoint(0);
        allNodes.push({
            x: genesisPt.x,
            y: genesisPt.y,
            label: 'Genesis',
            isGenesis: true,
            isPast: true,
            date: genesisTimestamp ? new Date(genesisTimestamp * 1000) : null,
            purpose: 'The founding moment — inscribed in the blockchain'
        });

        // Convention nodes
        let foundNext = false;
        CONVENTIONS.forEach((conv, idx) => {
            const t = Math.pow(conv.daysAfter / maxDays, 0.6) * 0.95 + 0.05;
            const pt = fibonacciSpiralPoint(t);
            const isPast = daysSinceGenesis >= conv.daysAfter;
            const isNext = !isPast && !foundNext;
            if (isNext) foundNext = true;

            const convTimestamp = genesisTimestamp + (conv.daysAfter * 86400);
            const daysUntil = Math.ceil((convTimestamp - now) / 86400);

            allNodes.push({
                x: pt.x,
                y: pt.y,
                label: 'C' + conv.num,
                num: conv.num,
                isPast: isPast,
                isNext: isNext,
                date: new Date(convTimestamp * 1000),
                daysUntil: daysUntil,
                purpose: conv.purpose,
                interval: conv.interval
            });
        });

        // Render nodes (reverse order so earlier nodes are on top)
        allNodes.slice().reverse().forEach((node, revIdx) => {
            const idx = allNodes.length - 1 - revIdx;
            const stateClass = node.isGenesis ? 'genesis-node' : 
                              node.isPast ? 'is-past' : 
                              node.isNext ? 'is-next' : 'is-future';
            const nodeSize = node.isGenesis ? 10 : node.isNext ? 9 : node.isPast ? 7 : 5;
            const labelOffset = node.y > H/2 ? 22 : -15;

            svg += `<g class="convention-node ${stateClass}" data-idx="${idx}">
                <circle class="node-bg" cx="${node.x}" cy="${node.y}" r="${nodeSize + 6}"/>
                <circle class="node-core" cx="${node.x}" cy="${node.y}" r="${nodeSize}"/>
                <text x="${node.x}" y="${node.y + labelOffset}" text-anchor="middle">${node.label}</text>
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
