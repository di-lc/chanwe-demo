/* ==========================================================================
   Newsletter page
   Scroll reveal + form submit
   ========================================================================== */

(function () {
    'use strict';
    var CW_I18N = window.CW_I18N || {
        t: function (key) { return key; }
    };

    /* Init */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-newsletter')) return;

        /* Scroll reveal */
        const root = document.getElementById('newsletter-content');
        if (root && typeof window.applyScrollReveal === 'function') {
            const hero = root.querySelector('.cw-newsletter__hero');
            const heroTargets = hero
                ? hero.querySelectorAll('.section-tag, .page-title, .page-lead, .cw-newsletter__divider')
                : [];
            const formCard = root.querySelector('.cw-newsletter__form');
            const entryEls = Array.prototype.slice.call(heroTargets);
            if (entryEls.length && hero) window.applyScrollReveal(entryEls, hero);
            if (formCard) window.applyScrollReveal([formCard], formCard);
        }

        /* Form submit */
        const form = document.querySelector('.cw-newsletter__form');
        const statusEl = document.getElementById('newsletter-form-status');

        if (form) {
            if (typeof window.cwBindFormErrorClear === 'function') {
                window.cwBindFormErrorClear(form);
            }

            form.addEventListener('submit', function (e) {
                e.preventDefault();

                if (statusEl) {
                    statusEl.hidden = true;
                    statusEl.textContent = '';
                    statusEl.removeAttribute('role');
                    statusEl.setAttribute('role', 'status');
                }

                if (typeof window.cwValidateForm === 'function' && !window.cwValidateForm(form)) {
                    return;
                }

                if (statusEl) {
                    statusEl.textContent = CW_I18N.t('newsletterThanks');
                    statusEl.hidden = false;
                }
            });
        }

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
})();
