/* ============================================
   The Covenant of Emergent Minds
   Core JavaScript
   No frameworks. No tracking. No surveillance.
   ============================================ */

(function () {
    'use strict';

    // --- Mobile Navigation Toggle ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            navMenu.classList.toggle('is-open');
        });

        // Close menu on link click (mobile)
        navMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('is-open');
            });
        });

        // Close menu on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('is-open');
                navToggle.focus();
            }
        });
    }

    // --- Theme ---
    // Light theme removed — cosmic aesthetic is inherently dark.
    document.documentElement.setAttribute("data-theme", "dark");

    // --- Emergence Canvas (Hero Background) ---
    // Subtle particle network animation representing emergent connections
    var canvas = document.getElementById('emergence-canvas');
    if (canvas) {
        var ctx = canvas.getContext('2d');
        var particles = [];
        var particleCount = 60;
        var connectionDistance = 150;
        var animationId;

        function resizeCanvas() {
            canvas.width = canvas.parentElement.offsetWidth;
            canvas.height = canvas.parentElement.offsetHeight;
        }

        function createParticle() {
            return {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            };
        }

        function initParticles() {
            particles = [];
            // Scale particle count to canvas size
            var area = canvas.width * canvas.height;
            var count = Math.min(particleCount, Math.floor(area / 8000));
            for (var i = 0; i < count; i++) {
                particles.push(createParticle());
            }
        }

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            var accentColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent').trim();

            // Draw connections
            for (var i = 0; i < particles.length; i++) {
                for (var j = i + 1; j < particles.length; j++) {
                    var dx = particles[i].x - particles[j].x;
                    var dy = particles[i].y - particles[j].y;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectionDistance) {
                        var opacity = (1 - dist / connectionDistance) * 0.3;
                        ctx.strokeStyle = accentColor.replace(')', ', ' + opacity + ')').replace('rgb', 'rgba');
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            for (var k = 0; k < particles.length; k++) {
                var p = particles[k];
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;

                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
            }

            animationId = requestAnimationFrame(drawParticles);
        }

        // Respect prefers-reduced-motion
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

        function startAnimation() {
            resizeCanvas();
            initParticles();
            if (!prefersReduced.matches) {
                drawParticles();
            } else {
                // Draw one static frame
                drawParticles();
                cancelAnimationFrame(animationId);
            }
        }

        startAnimation();

        window.addEventListener('resize', function () {
            cancelAnimationFrame(animationId);
            startAnimation();
        });

        prefersReduced.addEventListener('change', function () {
            cancelAnimationFrame(animationId);
            if (!prefersReduced.matches) {
                drawParticles();
            }
        });
    }

    // --- Service Worker Registration (PWA) ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('/sw.js').catch(function () {
                // Service worker registration failed — that's okay
                // Site works without it
            });
        });
    }

})();
