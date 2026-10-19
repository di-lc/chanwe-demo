/* ==========================================================================
   Evaluación / Pulse landing page
   No scroll-hide — content always visible (deploy-safe)
   ========================================================================== */

(function () {
    'use strict';

    function revealAll(root) {
        if (!root) return;

        root.querySelectorAll('*').forEach(function (el) {
            if (el.nodeType !== 1) return;
            el.removeAttribute('data-cw-reveal');
            el.style.opacity = '';
            el.style.visibility = '';
            if (typeof gsap !== 'undefined') {
                gsap.set(el, { clearProps: 'opacity,visibility,transform,x,y,autoAlpha' });
            }
        });
    }

    function centerScrollableDiagrams(root) {
        root.querySelectorAll('.cw-eval-landing__diagram-viewport').forEach(function (viewport) {
            var image = viewport.querySelector('img');

            function centerDiagram() {
                if (viewport.scrollWidth <= viewport.clientWidth) return;
                viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
            }

            function scheduleCenter() {
                window.requestAnimationFrame(function () {
                    window.requestAnimationFrame(centerDiagram);
                });
            }

            if (!image || image.complete) {
                scheduleCenter();
            } else {
                image.addEventListener('load', scheduleCenter, { once: true });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-evaluacion')) return;

        var root = document.getElementById('eval-landing-content');
        if (!root) return;

        revealAll(root);
        centerScrollableDiagrams(root);
        window.addEventListener('load', function () {
            centerScrollableDiagrams(root);
        }, { once: true });

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
})();
