/* ==========================================================================
   Listing carousel
   Informes + Casos; desktop 2-up when category has cw-listing-category--carousel
   ========================================================================== */
(function () {
    'use strict';

    var CW_CAROUSEL_DESKTOP_PAGE = 2;
    var CW_CAROUSEL_CATEGORY = 'cw-listing-category';
    var CW_CAROUSEL_FLAG = 'cw-listing-category--carousel';

    function cwCarouselReducedMotion() {
        return window.cwPrefersReducedMotion ? window.cwPrefersReducedMotion() : false;
    }

    function cwCarouselMoveTrack(track, props) {
        if (typeof gsap === 'undefined') {
            if (props.x != null) {
                track.style.transform = 'translate3d(' + props.x + 'px,0,0)';
            } else if (props.xPercent != null) {
                track.style.transform = 'translate3d(' + props.xPercent + '%,0,0)';
            }
            return;
        }
        if (cwCarouselReducedMotion()) {
            gsap.set(track, props);
        } else {
            gsap.to(track, Object.assign({ duration: 0.7, ease: 'expo.out' }, props));
        }
    }

    function cwFormatCarouselSlideStatus(currentOneBased, total) {
        var I18N = window.CW_I18N || { t: function (key) { return key; } };
        return I18N.t('carouselSlide') + ' ' + currentOneBased + ' ' + I18N.t('of') + ' ' + total;
    }

    function cwGetOrCreateCarouselStatusEl(container) {
        var el = container.querySelector('.cw-carousel__status');
        if (!el) {
            el = document.createElement('div');
            el.className = 'cw-carousel__status';
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
            container.appendChild(el);
        }
        return el;
    }

    function cwInitCarouselA11yShell(container, options) {
        options = options || {};
        var I18N = window.CW_I18N || { t: function (key) { return key; } };
        if (!container.hasAttribute('aria-roledescription')) {
            container.setAttribute('aria-roledescription', I18N.t('carouselRoleDescription'));
        }
        if (options.ariaLabel && !container.getAttribute('aria-label')) {
            container.setAttribute('aria-label', options.ariaLabel);
        }
        return cwGetOrCreateCarouselStatusEl(container);
    }

    function cwAnnounceCarouselSlide(statusEl, currentZeroBased, total) {
        if (!statusEl || total < 1) return;
        var currentOneBased = Math.max(1, Math.min(currentZeroBased + 1, total));
        statusEl.textContent = cwFormatCarouselSlideStatus(currentOneBased, total);
    }

    function getMaxIndex(state, mobile, desktopPage) {
        if (mobile) {
            return state.slides.length - 1;
        }
        if (state.desktopCarousel) {
            return Math.max(0, Math.ceil(state.slides.length / desktopPage) - 1);
        }
        return 0;
    }

    function getDesktopScrollPx(state, desktopPage) {
        var pageStart = state.current * desktopPage;
        if (pageStart <= 0 || !state.slides.length || !state.track) return 0;
        var gap = parseFloat(getComputedStyle(state.track).gap) || 0;
        var px = 0;
        for (var i = 0; i < pageStart; i++) {
            px += state.slides[i].offsetWidth + gap;
        }
        return px;
    }

    function cwBuildCarouselNav(ariaLabel) {
        var icon = function (id) {
            return [
                '<svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">',
                '<use href="' + (window.CW_I18N && CW_I18N.assetPath
                    ? CW_I18N.assetPath('assets/01-icons/general-icons/chanwe-general-icons.sprite.svg')
                    : 'assets/01-icons/general-icons/chanwe-general-icons.sprite.svg') + '#' + id + '"></use>',
                '</svg>'
            ].join('');
        };
        var prev = (window.CW_I18N && CW_I18N.t) ? CW_I18N.t('previous') : 'Previous';
        var next = (window.CW_I18N && CW_I18N.t) ? CW_I18N.t('next') : 'Next';

        return [
            '<nav class="cw-carousel__nav" aria-label="' + ariaLabel + '">',
            '<button type="button" class="cw-carousel__nav-btn cw-carousel__nav-btn--prev" aria-label="' + prev + '">',
            icon('general-chanwe-icon-chevron-left'),
            '</button>',
            '<button type="button" class="cw-carousel__nav-btn cw-carousel__nav-btn--next" aria-label="' + next + '">',
            icon('general-chanwe-icon-chevron-right'),
            '</button>',
            '</nav>'
        ].join('');
    }

    function cwResetListingCarousels(states) {
        if (!states || !states.length) return;
        states.forEach(function (state) {
            if (!state) return;
            state.current = 0;
            if (typeof gsap !== 'undefined') {
                gsap.set(state.track, { x: 0, xPercent: 0 });
            } else {
                state.track.style.transform = '';
            }
            if (state.syncNav) state.syncNav();
        });
    }

    function cwInitListingCarousels(root, options) {
        var states = [];
        if (!root) return states;

        options = options || {};
        var mobileMq = options.mobileMq || '(max-width: 1024px)';
        var desktopPage = options.desktopPage || CW_CAROUSEL_DESKTOP_PAGE;
        var categoryClass = options.categoryClass || CW_CAROUSEL_CATEGORY;
        var carouselFlag = options.carouselFlag || CW_CAROUSEL_FLAG;

        root.querySelectorAll('[data-cw-carousel]').forEach(function (carouselEl) {
            var track = carouselEl.querySelector('.cw-carousel__track');
            var slides = carouselEl.querySelectorAll('.cw-carousel__slide');
            var prevBtn = carouselEl.querySelector('.cw-carousel__nav-btn--prev');
            var nextBtn = carouselEl.querySelector('.cw-carousel__nav-btn--next');
            var nav = carouselEl.querySelector('.cw-carousel__nav');
            if (!track || !slides.length) return;

            var categoryEl = carouselEl.closest('.' + categoryClass);
            var navLabel = nav ? nav.getAttribute('aria-label') : '';
            var statusEl = cwInitCarouselA11yShell(carouselEl, { ariaLabel: navLabel || undefined });
            var state = {
                current: 0,
                track: track,
                slides: slides,
                prevBtn: prevBtn,
                nextBtn: nextBtn,
                nav: nav,
                statusEl: statusEl,
                desktopCarousel: !!(categoryEl && categoryEl.classList.contains(carouselFlag)),
                preserveDesktopGutters: !!options.preserveDesktopGutters,
                mobileMq: mobileMq,
                desktopPage: desktopPage
            };

            state.announceSlide = function () {
                var mobile = window.matchMedia(state.mobileMq).matches;
                var maxIndex = getMaxIndex(state, mobile, state.desktopPage);
                var active = mobile || state.desktopCarousel;
                if (!active || maxIndex < 0) {
                    if (state.statusEl) state.statusEl.textContent = '';
                    return;
                }
                cwAnnounceCarouselSlide(state.statusEl, state.current, maxIndex + 1);
            };

            state.syncNav = function () {
                var mobile = window.matchMedia(state.mobileMq).matches;
                var maxIndex = getMaxIndex(state, mobile, state.desktopPage);
                var active = mobile || state.desktopCarousel;

                if (!active) {
                    if (state.nav) state.nav.hidden = true;
                    if (state.prevBtn) state.prevBtn.style.visibility = 'hidden';
                    if (state.nextBtn) state.nextBtn.style.visibility = 'hidden';
                    return;
                }

                var hasNoNavigation = maxIndex <= 0;
                var keepDesktopGutters = hasNoNavigation
                    && !mobile
                    && state.desktopCarousel
                    && state.preserveDesktopGutters;

                if (state.nav) {
                    state.nav.hidden = hasNoNavigation && !keepDesktopGutters;
                    if (hasNoNavigation) {
                        state.nav.setAttribute('aria-hidden', 'true');
                    } else {
                        state.nav.removeAttribute('aria-hidden');
                    }
                }
                if (state.prevBtn) {
                    state.prevBtn.style.visibility = state.current === 0 ? 'hidden' : 'visible';
                }
                if (state.nextBtn) {
                    state.nextBtn.style.visibility = state.current >= maxIndex ? 'hidden' : 'visible';
                }
            };

            state.move = function () {
                var mobile = window.matchMedia(state.mobileMq).matches;
                var maxIndex = getMaxIndex(state, mobile, state.desktopPage);

                if (!mobile && !state.desktopCarousel) {
                    state.current = 0;
                    if (typeof gsap !== 'undefined') {
                        gsap.set(state.track, { x: 0, xPercent: 0 });
                    } else {
                        state.track.style.transform = '';
                    }
                    state.syncNav();
                    state.announceSlide();
                    return;
                }

                if (state.current > maxIndex) state.current = maxIndex;
                if (state.current < 0) state.current = 0;

                if (!mobile && state.desktopCarousel) {
                    var px = -getDesktopScrollPx(state, state.desktopPage);
                    cwCarouselMoveTrack(state.track, { x: px, xPercent: 0 });
                } else {
                    var x = -100 * state.current;
                    cwCarouselMoveTrack(state.track, { x: 0, xPercent: x });
                }
                state.syncNav();
                state.announceSlide();
            };

            if (nextBtn) {
                nextBtn.addEventListener('click', function () {
                    var mobile = window.matchMedia(state.mobileMq).matches;
                    var maxIndex = getMaxIndex(state, mobile, state.desktopPage);
                    if (state.current < maxIndex) {
                        state.current += 1;
                        state.move();
                    }
                });
            }
            if (prevBtn) {
                prevBtn.addEventListener('click', function () {
                    if (state.current > 0) {
                        state.current -= 1;
                        state.move();
                    }
                });
            }

            state.move();
            states.push(state);
        });

        return states;
    }

    function cwBindListingCarouselMq(states, mobileMq) {
        mobileMq = mobileMq || '(max-width: 1024px)';
        var mq = window.matchMedia(mobileMq);
        var onChange = function () {
            cwResetListingCarousels(states);
            states.forEach(function (state) {
                if (state && state.move) state.move();
            });
        };

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', onChange);
        } else if (typeof mq.addListener === 'function') {
            mq.addListener(onChange);
        }

        var resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                states.forEach(function (state) {
                    if (state && state.move) state.move();
                });
            }, 150);
        });
    }

    window.cwBuildCarouselNav = cwBuildCarouselNav;
    window.cwInitListingCarousels = cwInitListingCarousels;
    window.cwResetListingCarousels = cwResetListingCarousels;
    window.cwBindListingCarouselMq = cwBindListingCarouselMq;
    window.cwFormatCarouselSlideStatus = cwFormatCarouselSlideStatus;
    window.cwInitCarouselA11yShell = cwInitCarouselA11yShell;
    window.cwAnnounceCarouselSlide = cwAnnounceCarouselSlide;
    window.CW_CAROUSEL_DESKTOP_PAGE = CW_CAROUSEL_DESKTOP_PAGE;
})();
