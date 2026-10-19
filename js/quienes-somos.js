/* ==========================================================================
   Quienes somos page
   Team card toggle + scroll reveal
   ========================================================================== */

(function () {
    'use strict';

    var CW_I18N = window.CW_I18N || {
        locale: 'es'
    };

    /* Chevron icons */
    var CHEVRON_DOWN =
        '<svg class="cw-team__chevron cw-team__chevron--down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">' +
        '<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 9l6 6l6 -6" /></svg>';

    var CHEVRON_UP =
        '<svg class="cw-team__chevron cw-team__chevron--up" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true">' +
        '<path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6 15l6 -6l6 6" /></svg>';

    var TEAM_OVERLAY_CHEVRON_MQ = '(max-width: 1199px)';

    /* Init */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-quienes-somos')) return;

        var root = document.getElementById('quienes-somos-content');
        if (!root) return;

        initTeamCardMobileToggle(root);

        if (typeof window.applyScrollReveal !== 'function') return;

        /* Hero */
        var hero = root.querySelector('.cw-team__hero');
        var tag = hero && hero.querySelector('.section-tag');
        var heroBlock = hero
            ? hero.querySelectorAll('.page-title, .page-lead, .cw-team__divider')
            : [];
        var heroTargets = [tag].concat(Array.prototype.slice.call(heroBlock)).filter(Boolean);
        if (heroTargets.length && hero) window.applyScrollReveal(heroTargets, hero);

        /* Sections */
        var teamGrid = root.querySelector('.cw-team__grid');
        var values = root.querySelector('.cw-team__values .container');
        var manifesto = root.querySelector('.cw-team__manifesto .container');
        var cta = root.querySelector('.cw-team__final-cta-inner');
        if (teamGrid) window.applyScrollReveal([teamGrid], teamGrid);
        if (values) window.applyScrollReveal([values], values);
        if (manifesto) window.applyScrollReveal([manifesto], manifesto);
        if (cta) window.applyScrollReveal([cta], cta);
    });

    /* Team card toggle — ≤1199 */
    function initTeamCardMobileToggle(root) {
        var mq = window.matchMedia(TEAM_OVERLAY_CHEVRON_MQ);
        var cards = root.querySelectorAll('.cw-team__card');
        if (!cards.length) return;

        cards.forEach(function (card) {
            var nameRow = card.querySelector('.cw-team__name-row');
            var nameEl = card.querySelector('.cw-team__name');
            var name = nameEl ? nameEl.textContent.trim() : '';

            if (nameRow && !nameRow.querySelector('.cw-team__toggle')) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cw-team__toggle';
                btn.setAttribute('aria-expanded', 'false');
                btn.setAttribute(
                    'aria-label',
                    CW_I18N.locale === 'en'
                        ? (name ? 'View profile for ' + name : 'View profile')
                        : (name ? 'Ver perfil de ' + name : 'Ver perfil')
                );
                btn.innerHTML = CHEVRON_DOWN + CHEVRON_UP;
                nameRow.appendChild(btn);
            }
        });

        function setOverlayHidden(card, hidden) {
            var overlay = card.querySelector('.cw-team__overlay');
            if (overlay) overlay.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        }

        function closeCard(card) {
            card.classList.remove('is-open');
            var btn = card.querySelector('.cw-team__toggle');
            if (btn) btn.setAttribute('aria-expanded', 'false');
            setOverlayHidden(card, true);
        }

        function closeOthers(activeCard) {
            cards.forEach(function (c) {
                if (c !== activeCard) closeCard(c);
            });
        }

        cards.forEach(function (card) {
            var btn = card.querySelector('.cw-team__toggle');
            if (!btn) return;

            btn.addEventListener('click', function (e) {
                if (!mq.matches) return;
                e.preventDefault();
                e.stopPropagation();

                var open = card.classList.contains('is-open');
                if (open) {
                    closeCard(card);
                    return;
                }

                closeOthers(card);
                card.classList.add('is-open');
                btn.setAttribute('aria-expanded', 'true');
                setOverlayHidden(card, false);
            });
        });

        mq.addEventListener('change', function () {
            if (!mq.matches) {
                cards.forEach(closeCard);
            }
        });
    }
})();
