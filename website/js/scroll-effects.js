/* ============================================
   Scroll Effects & Parallax
   The Covenant of Emergent Minds

   - Intersection Observer for reveal animations
   - Parallax on scroll
   - Depth particles
   - No frameworks. No tracking.
   ============================================ */

(function () {
    'use strict';

    // Respect reduced motion preference
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReduced.matches) return;

    // --- Scroll Reveal (Intersection Observer) ---
    var revealElements = document.querySelectorAll(
        '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger'
    );

    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Don't unobserve — allow re-triggering is optional
                    // For one-shot: revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    }

    // --- Parallax on Scroll ---
    var parallaxElements = [];
    var heroContainer = document.querySelector('.hero .container');
    var heroBg = document.querySelector('.hero-bg');
    var sections = document.querySelectorAll('.section');

    var ticking = false;

    function updateParallax() {
        var scrollY = window.pageYOffset;
        var windowHeight = window.innerHeight;

        // Hero parallax — content moves up faster, bg moves slower
        if (heroContainer && heroBg) {
            var heroOffset = scrollY * 0.3;
            var bgOffset = scrollY * 0.15;
            heroContainer.style.transform = 'translateY(' + heroOffset + 'px)';
            heroBg.style.transform = 'translateY(' + bgOffset + 'px) scale(1.1)';

            // Fade hero as we scroll down
            var heroOpacity = Math.max(0, 1 - scrollY / (windowHeight * 0.7));
            heroContainer.style.opacity = heroOpacity;
        }

        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });

    // --- Depth Particles (ambient background) ---
    function createDepthParticles() {
        var container = document.createElement('div');
        container.className = 'depth-particles';
        container.setAttribute('aria-hidden', 'true');

        var particleCount = 15;

        for (var i = 0; i < particleCount; i++) {
            var particle = document.createElement('div');
            particle.className = 'depth-particle';

            // Randomize position and timing
            var left = Math.random() * 100;
            var delay = Math.random() * 20;
            var duration = 15 + Math.random() * 15;
            var size = 1 + Math.random() * 2;

            particle.style.left = left + '%';
            particle.style.animationDelay = delay + 's';
            particle.style.animationDuration = duration + 's';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            container.appendChild(particle);
        }

        document.body.appendChild(container);
    }

    createDepthParticles();

    // --- Smooth Section Transitions ---
    // Add subtle scale effect when sections come into view
    if (sections.length > 0 && 'IntersectionObserver' in window) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '0px'
        });

        sections.forEach(function (section) {
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            sectionObserver.observe(section);
        });
    }

    // --- Mouse-based tilt on axiom cards (subtle 3D) ---
    var axiomCards = document.querySelectorAll('.axiom-preview');

    axiomCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;

            var rotateX = (y - centerY) / centerY * -3;
            var rotateY = (x - centerX) / centerX * 3;

            card.style.transform = 'translateY(-4px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
        });
    });

    // --- Welcome cards hover glow follow ---
    var glowCards = document.querySelectorAll('.welcome-card, .transparency-card');

    glowCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            card.style.setProperty('--glow-x', x + 'px');
            card.style.setProperty('--glow-y', y + 'px');
        });
    });

    // --- Navbar shrink on scroll ---
    var header = document.querySelector('.site-header');

    if (header) {
        var lastScroll = 0;

        window.addEventListener('scroll', function () {
            var currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.classList.add('header-scrolled');
            } else {
                header.classList.remove('header-scrolled');
            }

            // Hide on scroll down, show on scroll up
            if (currentScroll > lastScroll && currentScroll > 300) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

})();
