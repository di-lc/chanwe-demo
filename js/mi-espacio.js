/* ==========================================================================
   Mi espacio page
   Password toggle + scroll reveal
   ========================================================================== */

(function () {
    'use strict';
    var CW_I18N = window.CW_I18N || {
        t: function (key) { return key; },
        assetPath: function (path) { return path; }
    };

    /* Init */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-mi-espacio')) return;

        /* Password toggle */
        var input = document.getElementById('login-password');
        var btn = document.getElementById('toggle-password');
        var icon = document.getElementById('password-toggle-icon');
        if (input && btn && icon) {
            var srcOpen = CW_I18N.assetPath('assets/01-icons/general-icons/general-chanwe-icon-eye.svg');
            var srcClosed = CW_I18N.assetPath('assets/01-icons/general-icons/general-chanwe-icon-eye-closed.svg');

            btn.addEventListener('click', function () {
                input.type = input.type === 'password' ? 'text' : 'password';
                var visible = input.type === 'text';
                btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
                btn.setAttribute('aria-label', visible ? CW_I18N.t('hidePassword') : CW_I18N.t('showPassword'));
                icon.src = visible ? srcOpen : srcClosed;
            });
        }

        /* Scroll reveal */
        if (typeof window.applyScrollReveal === 'function') {
            var tag = document.querySelector('main > .section-tag');
            var card = document.querySelector('.login-card');
            var els = [tag, card].filter(Boolean);
            var main = document.querySelector('main');
            if (els.length) window.applyScrollReveal(els, main || card);
        }

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
})();
