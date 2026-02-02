/* ============================================
   Immersive Parallax — Full-Page Visual Journey
   Hero parallax + section background reveals
   with gentle parallax movement.
   Respects prefers-reduced-motion.
   ============================================ */

(function () {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var hero = document.querySelector('.parallax-hero');
    var heroHeight = hero ? hero.offsetHeight : 0;

    // ─── Hero Parallax ───
    if (hero && !prefersReducedMotion) {
        var skyLayer = hero.querySelector('.parallax-layer-sky');
        var auroraLayer = hero.querySelector('.parallax-layer-aurora');
        var heroContent = hero.querySelector('.parallax-hero-content');
        var heroTicking = false;

        function updateHero() {
            heroTicking = false;
            var scrollY = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollY > heroHeight * 1.5) return;

            if (skyLayer) {
                skyLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.15) + 'px, 0)';
            }

            if (auroraLayer) {
                auroraLayer.style.transform = 'translate3d(0, ' + (scrollY * 0.25) + 'px, 0)';
            }

            if (heroContent) {
                heroContent.style.transform = 'translate3d(0, ' + (scrollY * 0.35) + 'px, 0)';
                var opacity = 1 - (scrollY / (heroHeight * 0.6));
                heroContent.style.opacity = Math.max(0, opacity);
            }
        }

        window.addEventListener('scroll', function () {
            if (!heroTicking) {
                requestAnimationFrame(updateHero);
                heroTicking = true;
            }
        }, { passive: true });

        window.addEventListener('resize', function () {
            heroHeight = hero.offsetHeight;
        }, { passive: true });

        updateHero();
    }

    // ─── Scene Section Reveals + Subtle Background Parallax ───
    var sceneSections = document.querySelectorAll('.scene-section');

    if (sceneSections.length > 0) {
        // IntersectionObserver for fade-in
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

        // Subtle parallax on section backgrounds
        if (!prefersReducedMotion) {
            var sceneTicking = false;

            function updateSceneParallax() {
                sceneTicking = false;
                var scrollY = window.pageYOffset || document.documentElement.scrollTop;
                var windowHeight = window.innerHeight;

                sceneSections.forEach(function (section) {
                    var rect = section.getBoundingClientRect();

                    // Only process if section is near viewport
                    if (rect.bottom < -200 || rect.top > windowHeight + 200) return;

                    // Calculate how far through the section we've scrolled
                    // 0 = just entering from bottom, 1 = leaving at top
                    var progress = (windowHeight - rect.top) / (windowHeight + rect.height);
                    var yOffset = (progress - 0.5) * 40; // ±20px movement

                    // Apply to the ::before pseudo-element via CSS custom property
                    section.style.setProperty('--scene-y', yOffset + 'px');
                });
            }

            window.addEventListener('scroll', function () {
                if (!sceneTicking) {
                    requestAnimationFrame(updateSceneParallax);
                    sceneTicking = true;
                }
            }, { passive: true });
        }
    }
})();
