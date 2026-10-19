/* ==========================================================================
   Listing filters — shared a11y helpers (casos, perspectivas, informes)
   ========================================================================== */
(function () {
    'use strict';

    window.CW_LISTING_SEARCH_DEBOUNCE_MS = 300;

    window.cwEnsureListingLiveRegion = function (container) {
        if (!container) return null;
        var el = container.querySelector('.cw-listing__live-status');
        if (!el) {
            el = document.createElement('div');
            el.className = 'cw-listing__live-status cw-carousel__status';
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            container.insertBefore(el, container.firstChild);
        }
        return el;
    };

    window.cwAnnounceListingResults = function (container, count) {
        var I18N = window.CW_I18N || { t: function (key) { return key; } };
        var live = window.cwEnsureListingLiveRegion(container);
        if (!live) return;

        if (!count) {
            live.textContent = I18N.t('listingResultsNone');
            return;
        }

        var word = count === 1
            ? I18N.t('listingResultSingular')
            : I18N.t('listingResultPlural');
        live.textContent = count + ' ' + word;
    };

    window.cwSidebarPressedAttr = function (isActive) {
        return ' aria-pressed="' + (isActive ? 'true' : 'false') + '"';
    };
})();
