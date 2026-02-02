/* ============================================
   Immersive Parallax — Full-Page Visual Journey
   Hero parallax + section background reveals
   Respects prefers-reduced-motion.
   ============================================ */

(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var hero = document.querySelector('.parallax-hero');
    var heroHeight = hero ? hero.offsetHeight : 0;

    // ─── Hero Parallax (sky + aurora at different speeds) ───
    if (hero && !prefersReducedMotion) {
        var skyLayer = hero.querySelector('.parallax-layer-sky');
        var auroraLayer = hero.querySelector('.parallax-layer-aurora');
        var heroContent = hero.querySelector('.parallax-hero-content');
        var ticking = false;

        function updateHero() {
            ticking = false;
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollY > heroHeight * 1.5) return;

            // Sky moves very slowly — deep background feel
            if (skyLayer) {
                skyLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.15) + 'px, 0)';
            }

            // Aurora moves slightly faster
            if (auroraLayer) {
                auroraLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.25) + 'px, 0)';
            }

            // Content scrolls up faster and fades out
            if (heroContent) {
                heroContent.style.transform = 'translate3d(0, ' + (scrollY * 0.35) + 'px, 0)';
                var opacity = 1 - (scrollY / (heroHeight * 0.6));
                heroContent.style.opacity = Math.max(0, opacity);
            }
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(updateHero);
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', function () {
            heroHeight = hero.offsetHeight;
        }, { passive: true });

        updateHero();
    }

    // ─── Section Background Reveals ───
    // As each section scrolls into view, its atmospheric background fades in
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
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        sceneSections.forEach(function (section) {
            observer.observe(section);
        });
    }
})();
