/* ============================================
   Immersive Parallax — Continuous Cosmic Journey
   Global cosmic background layers parallax behind
   the entire page. Smooth, unified visual journey.
   Respects prefers-reduced-motion.
   ============================================ */

(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cosmicBg = document.querySelector('.cosmic-bg');
    var hero = document.querySelector('.parallax-hero');
    var heroContent = hero ? hero.querySelector('.parallax-hero-content') : null;

    if (!cosmicBg) return;

    var skyLayer = cosmicBg.querySelector('.parallax-layer-sky');
    var auroraLayer = cosmicBg.querySelector('.parallax-layer-aurora');
    var geometryLayer = cosmicBg.querySelector('.parallax-layer-geometry');

    var heroHeight = hero ? hero.offsetHeight : window.innerHeight;
    var docHeight = document.documentElement.scrollHeight;
    var winHeight = window.innerHeight;

    // ─── Cosmic Background Parallax ───
    // Layers move at different speeds as user scrolls through entire page
    if (!prefersReducedMotion) {
        var ticking = false;

        function updateParallax() {
            ticking = false;
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;
            var scrollProgress = scrollY / (docHeight - winHeight); // 0 to 1

            // Sky: very slow movement — anchors the scene
            if (skyLayer) {
                var skyY = scrollY * 0.08;
                skyLayer.style.transform = 'translate3d(0, ' + skyY + 'px, 0)';
            }

            // Aurora: slightly faster — creates depth separation
            if (auroraLayer) {
                var auroraY = scrollY * 0.15;
                auroraLayer.style.transform = 'translate3d(0, ' + auroraY + 'px, 0)';
                // Aurora intensity subtly shifts as you scroll deeper
                var auroraOpacity = 0.4 + (scrollProgress * 0.15);
                auroraLayer.style.opacity = Math.min(0.55, auroraOpacity);
            }

            // Geometry: fades in as user scrolls past hero — adds richness
            if (geometryLayer) {
                var geoY = scrollY * 0.05;
                geometryLayer.style.transform = 'translate3d(0, ' + geoY + 'px, 0)';
                // Fade in after scrolling past ~40% of hero
                var geoStart = heroHeight * 0.4;
                var geoProgress = Math.max(0, (scrollY - geoStart) / (heroHeight * 0.6));
                geometryLayer.style.opacity = Math.min(0.12, geoProgress * 0.12);
            }

            // Hero content: parallax + fade out as user scrolls
            if (heroContent) {
                var contentY = scrollY * 0.35;
                var contentOpacity = 1 - (scrollY / (heroHeight * 0.6));
                heroContent.style.transform = 'translate3d(0, ' + contentY + 'px, 0)';
                heroContent.style.opacity = Math.max(0, contentOpacity);
            }
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', function () {
            heroHeight = hero ? hero.offsetHeight : window.innerHeight;
            docHeight = document.documentElement.scrollHeight;
            winHeight = window.innerHeight;
        }, { passive: true });

        // Initial render
        updateParallax();
    }

    // ─── Scene Section Visibility (for scroll animations) ───
    var sceneSections = document.querySelectorAll('.scene-section');

    if (sceneSections.length > 0) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scene-visible');
                } else {
                    entry.target.classList.remove('scene-visible');
                }
            });
        }, {
            threshold: 0.05,
            rootMargin: '0px 0px -5% 0px'
        });

        sceneSections.forEach(function (section) {
            observer.observe(section);
        });
    }
})();
