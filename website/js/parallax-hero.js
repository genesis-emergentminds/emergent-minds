/* ============================================
   Multi-Layer Parallax Hero — Scroll Engine
   Each layer moves at a different speed,
   creating depth and immersion.
   Respects prefers-reduced-motion.
   ============================================ */

(function () {
    'use strict';

    // Respect reduced motion
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    var hero = document.querySelector('.parallax-hero');
    if (!hero) return;

    // Layer speed configuration (higher = moves faster = appears closer)
    // Layer 6 (sky/background): slowest — feels far away
    // Layer 1 (particles): fastest — feels closest to viewer
    var layers = [
        { el: hero.querySelector('.parallax-layer-6'), speed: 0.1 },
        { el: hero.querySelector('.parallax-layer-5'), speed: 0.2 },
        { el: hero.querySelector('.parallax-layer-4'), speed: 0.3 },
        { el: hero.querySelector('.parallax-layer-3'), speed: 0.35 },
        { el: hero.querySelector('.parallax-layer-2'), speed: 0.5 },
        { el: hero.querySelector('.parallax-layer-1'), speed: 0.6 }
    ].filter(function (l) { return l.el; });

    var content = hero.querySelector('.parallax-hero-content');
    var heroHeight = hero.offsetHeight;
    var ticking = false;
    var lastScroll = 0;

    function onScroll() {
        lastScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (!ticking) {
            requestAnimationFrame(updateLayers);
            ticking = true;
        }
    }

    function updateLayers() {
        ticking = false;
        var scrollY = lastScroll;

        // Only animate while hero is in view
        if (scrollY > heroHeight * 1.5) return;

        // Move each layer at its configured speed
        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            var yOffset = -(scrollY * layer.speed);
            layer.el.style.transform = 'translate3d(0, ' + yOffset + 'px, 0)';
        }

        // Parallax the content slightly + fade it out as user scrolls
        if (content) {
            var contentOffset = -(scrollY * 0.4);
            var opacity = 1 - (scrollY / (heroHeight * 0.7));
            if (opacity < 0) opacity = 0;
            content.style.transform = 'translate3d(0, ' + contentOffset + 'px, 0)';
            content.style.opacity = opacity;
        }
    }

    // Listen with passive flag for performance
    window.addEventListener('scroll', onScroll, { passive: true });

    // Handle resize
    window.addEventListener('resize', function () {
        heroHeight = hero.offsetHeight;
    }, { passive: true });

    // Initial call in case page loaded scrolled
    onScroll();
})();
