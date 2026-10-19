/* ==========================================================================
   Pulse page
   Scroll reveal + card pointer glow
   ========================================================================== */

(function () {
    'use strict';

    /* Card pointer glow */
    function initPulseCardPointerGlow() {
        const cards = document.querySelectorAll('.cw-pulse__card');
        cards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
                card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
            });
        });
    }

    /* Scroll reveal */
    function initPulseScrollReveal(root) {
        if (!root || typeof window.applyScrollReveal !== 'function') return;

        const hero = root.querySelector('.cw-pulse__hero');
        const heroTargets = hero
            ? hero.querySelectorAll('.section-tag, .page-title, .page-lead, .cw-pulse__preview, .cw-pulse__divider')
            : [];
        const cols = root.querySelectorAll('.cw-pulse__col');
        const cards = root.querySelectorAll('.cw-pulse__card');
        const access = root.querySelector('.cw-pulse__access');
        const heroEls = Array.prototype.slice.call(heroTargets);
        if (heroEls.length && hero) window.applyScrollReveal(heroEls, hero);

        const bodyEls = [];
        if (cols.length) bodyEls.push.apply(bodyEls, Array.prototype.slice.call(cols));
        if (cards.length) bodyEls.push.apply(bodyEls, Array.prototype.slice.call(cards));
        if (access) bodyEls.push(access);
        const bodyTrigger = root.querySelector('.cw-pulse__grid') || access || root;
        if (bodyEls.length) window.applyScrollReveal(bodyEls, bodyTrigger);
    }

    /* Init */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-pulse')) return;

        const root = document.getElementById('pulse-content');
        if (root) initPulseScrollReveal(root);

        initPulseCardPointerGlow();

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
})();
