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
                const resp = await fetch(url);
                if (!resp.ok) continue;
                const data = await resp.json();
                if (data.confirmed && data.block_time) {
                    return {
                        confirmed: true,
                        blockHeight: data.block_height,
                        blockTime: data.block_time,
                        blockHash: data.block_hash,
                    };
                }
                return { confirmed: false };
            } catch (e) {
                continue;
            }
        }
        return { confirmed: false };
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

    // ═══ Fibonacci Spiral Visualization ═══
    function renderFibonacciSpiral() {
        const canvas = document.getElementById('fibonacci-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 400 * dpr;
        canvas.style.height = '400px';
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = 400;

        ctx.clearRect(0, 0, W, H);

        // Draw a stylized Fibonacci arc timeline
        const centerX = 60;
        const centerY = H / 2;
        const maxRadius = W - 100;

        // Background glow
        const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        glow.addColorStop(0, 'rgba(96, 165, 250, 0.05)');
        glow.addColorStop(0.5, 'rgba(139, 92, 246, 0.02)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, W, H);

        const now = genesisTimestamp ? Math.floor(Date.now() / 1000) : 0;
        const daysSinceGenesis = genesisTimestamp ? (now - genesisTimestamp) / 86400 : 0;

        // Map convention positions along an arc
        const maxDays = 25740; // Convention 10
        const arcAngle = Math.PI * 0.85; // span of the arc

        // Draw the arc path
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 200; i++) {
            const t = i / 200;
            const angle = -arcAngle / 2 + t * arcAngle;
            // Fibonacci spiral: radius grows with golden ratio
            const r = 40 + (maxRadius - 40) * Math.pow(t, 0.7);
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw convention markers
        CONVENTIONS.forEach((conv, idx) => {
            const t = conv.daysAfter / maxDays;
            const angle = -arcAngle / 2 + t * arcAngle;
            const r = 40 + (maxRadius - 40) * Math.pow(t, 0.7);
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);

            const isPast = daysSinceGenesis >= conv.daysAfter;
            const isNext = !isPast && (idx === 0 || daysSinceGenesis >= CONVENTIONS[idx - 1].daysAfter);

            // Glow for next convention
            if (isNext) {
                const nodeGlow = ctx.createRadialGradient(x, y, 0, x, y, 25);
                nodeGlow.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
                nodeGlow.addColorStop(1, 'transparent');
                ctx.fillStyle = nodeGlow;
                ctx.fillRect(x - 25, y - 25, 50, 50);
            }

            // Node
            ctx.beginPath();
            ctx.arc(x, y, isPast ? 6 : isNext ? 8 : 4, 0, Math.PI * 2);
            ctx.fillStyle = isPast ? 'rgba(96, 165, 250, 0.9)' :
                           isNext ? 'rgba(96, 165, 250, 1)' :
                           'rgba(96, 165, 250, 0.2)';
            ctx.fill();

            if (isPast || isNext) {
                ctx.beginPath();
                ctx.arc(x, y, isPast ? 6 : 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Label
            ctx.fillStyle = isPast ? 'rgba(226, 232, 240, 0.9)' :
                           isNext ? 'rgba(96, 165, 250, 1)' :
                           'rgba(148, 163, 184, 0.5)';
            ctx.font = `${isNext ? 'bold ' : ''}${isNext ? '12' : '10'}px system-ui, sans-serif`;
            ctx.textAlign = 'center';

            const labelY = y > centerY ? y + 18 : y - 12;
            ctx.fillText(`C${conv.num}`, x, labelY);

            // Time label for key conventions
            if (isNext || conv.num === 1 || conv.num === 5 || conv.num === 10) {
                ctx.font = '9px system-ui, sans-serif';
                ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
                const timeLabel = formatApproxTime(conv.daysAfter);
                ctx.fillText(timeLabel, x, labelY + (y > centerY ? 13 : -10));
            }
        });

        // Genesis marker
        const genesisX = centerX + 40 * Math.cos(-arcAngle / 2);
        const genesisY = centerY + 40 * Math.sin(-arcAngle / 2);
        ctx.beginPath();
        ctx.arc(genesisX, genesisY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.fill();
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText('Genesis', genesisX, genesisY - 14);
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
