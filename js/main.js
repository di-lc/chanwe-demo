/* ==========================================================================
   Main site JS
   Utilities, nav, hero, scroll reveal
   ========================================================================== */
gsap.registerPlugin(ScrollTrigger);
if (typeof ScrollToPlugin !== "undefined") {
    gsap.registerPlugin(ScrollToPlugin);
}

ScrollTrigger.config({ ignoreMobileResize: true });

function cwPrefersReducedMotion() {
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
        return false;
    }
}
window.cwPrefersReducedMotion = cwPrefersReducedMotion;

document.addEventListener("DOMContentLoaded", function () {
    if (cwPrefersReducedMotion() && document.body) {
        document.body.classList.add("cw-reduced-motion");
    }
});

/* Hero — touch pin + IO reveals; ≤480 mobile layout */
function cwIsHeroMobileLayout() {
    return window.innerWidth <= 480;
}

const CW_HERO_DESKTOP_SCROLL_SEL = ".hero > .hero__scroll-indicator";
const CW_HERO_MOBILE_SCROLL_SEL = ".hero__content > .hero__scroll-indicator--mobile";
const CW_HERO_PIN_SCROLL_PX = 1500;
/* First N source frames excluded — vertical misalignment in assets 001–005 */
const CW_HERO_FRAME_SKIP = 5;
const CW_HERO_TOTAL_FRAMES = 119;

function cwHeroGetMobileScrollCue() {
    return document.querySelector(CW_HERO_MOBILE_SCROLL_SEL);
}

const CW_HERO_COPY_ENTRY_SEL = [
    ".hero__content > .cw-hero__tag",
    ".hero__content .h1",
    ".hero__content .subtitle"
];

let cwHeroEntryDone = false;

function cwIsTouchLikeDevice() {
    try {
        return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    } catch (_) {
        return "ontouchstart" in window;
    }
}

/* Viewport accent — ≤1024 */
const CW_TABLET_MOBILE_MQ = "(max-width: 1024px)";
const CW_VIEWPORT_ACCENT_ROOT_MARGIN = "-22% 0px -22% 0px";
const CW_VIEWPORT_ACCENT_MIN_RATIO = 0.5;
const CW_SERVICES_ACCENT_ROOT_MARGIN = "-18% 0px -18% 0px";
const CW_SERVICES_ACCENT_MIN_RATIO = 0.25;

function cwIsTabletOrMobileLayout() {
    return window.matchMedia(CW_TABLET_MOBILE_MQ).matches;
}

let cwViewportAccentIo = null;

function cwSetViewportAccent(el, on) {
    if (!el) return;
    if (on) el.classList.add("cw-in-view");
    else el.classList.remove("cw-in-view");
}

function cwClearViewportAccent() {
    document.querySelectorAll(".cw-in-view").forEach(function (el) {
        el.classList.remove("cw-in-view");
    });
}

function cwDisconnectViewportAccent() {
    if (cwViewportAccentIo) {
        cwViewportAccentIo.disconnect();
        cwViewportAccentIo = null;
    }
    cwClearViewportAccent();
}

/* Viewport accent init */
function cwInitViewportAccent() {
    cwDisconnectViewportAccent();

    if (!cwIsTabletOrMobileLayout()) return;

    const scrollTargets = document.querySelectorAll(
        ".problem .problem-card, .concept__topics .card-dark"
    );
    if (!scrollTargets.length) return;

    if (typeof IntersectionObserver === "undefined") {
        scrollTargets.forEach(function (el) { cwSetViewportAccent(el, true); });
        return;
    }

    cwViewportAccentIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            const active = entry.isIntersecting
                && entry.intersectionRatio >= CW_VIEWPORT_ACCENT_MIN_RATIO;
            cwSetViewportAccent(entry.target, active);
        });
    }, {
        root: null,
        rootMargin: CW_VIEWPORT_ACCENT_ROOT_MARGIN,
        threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    scrollTargets.forEach(function (el) { cwViewportAccentIo.observe(el); });
}

/* Scroll to section */
function cwScrollToSection(targetElem, duration) {
    if (!targetElem) return;
    let targetScrollPos = targetElem.offsetTop;
    if (typeof ScrollTrigger !== "undefined") {
        try {
            const tempSt = ScrollTrigger.create({ trigger: targetElem, start: "top top" });
            targetScrollPos = tempSt.start - 80;
            tempSt.kill();
        } catch (_) {
            /* fallback to offsetTop */
        }
    }
    const dur = cwPrefersReducedMotion() ? 0 : (duration != null ? duration : 1.2);
    if (window.gsap && gsap.plugins && gsap.plugins.ScrollToPlugin) {
        gsap.to(window, {
            duration: dur,
            scrollTo: targetScrollPos,
            ease: "power3.inOut"
        });
    } else {
        window.scrollTo({
            top: targetScrollPos,
            behavior: "smooth"
        });
    }
}

/* Home scroll guard — preserve position on refresh; hero-top gets entry, not jump */
const cwHomeScrollGuard = (function () {
    const SCROLL_KEY = "cw-home-scroll-y";
    const HERO_TOP_FLAG = "cw-home-hero-top";
    const HERO_TOP_THRESHOLD = 150;
    let savedY = 0;
    let heroTopMode = false;
    let armed = false;
    let released = false;
    let refreshQueued = false;
    let restoring = false;
    let initPhase = true;
    let persistTimer = null;

    function isHome() {
        return document.body && document.body.classList.contains("page-home");
    }

    function isReload() {
        const nav = performance.getEntriesByType("navigation")[0];
        return nav && nav.type === "reload";
    }

    function hasHash() {
        const h = window.location.hash;
        return !!(h && h.length > 1);
    }

    function readStoredY() {
        try {
            const stored = sessionStorage.getItem(SCROLL_KEY);
            if (stored == null) return null;
            const y = parseInt(stored, 10);
            return Number.isFinite(y) ? y : null;
        } catch (_) {
            return null;
        }
    }

    function readHeroTopFlag() {
        try {
            return sessionStorage.getItem(HERO_TOP_FLAG) === "1";
        } catch (_) {
            return false;
        }
    }

    function isHeroAtViewportTop() {
        return isHome() && window.scrollY < HERO_TOP_THRESHOLD;
    }

    function persistHeroTopNow() {
        if (!isHome() || restoring) return;
        try {
            sessionStorage.setItem(HERO_TOP_FLAG, "1");
            sessionStorage.setItem(SCROLL_KEY, "0");
        } catch (_) { /* no-op */ }
    }

    function persistDeepScrollNow() {
        if (!isHome() || restoring) return;
        try {
            sessionStorage.removeItem(HERO_TOP_FLAG);
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        } catch (_) { /* no-op */ }
    }

    function isHeroTop() {
        return heroTopMode;
    }

    function lockHeroTop() {
        if (!isHome() || released || !isHeroTop()) return;
        if (window.scrollY !== 0) {
            restoring = true;
            window.scrollTo(0, 0);
            requestAnimationFrame(function () { restoring = false; });
        }
    }

    function persistScrollState() {
        if (!isHome() || restoring) return;
        if (isHeroAtViewportTop()) persistHeroTopNow();
        else persistDeepScrollNow();
    }

    function schedulePersist() {
        clearTimeout(persistTimer);
        persistTimer = setTimeout(persistScrollState, 100);
    }

    function resolveHeroTopOnReload(stored) {
        if (readHeroTopFlag()) return true;
        return stored != null && stored < HERO_TOP_THRESHOLD;
    }

    function release() {
        if (released) return;
        released = true;
        initPhase = false;
    }

    function arm() {
        if (!isHome()) return;
        armed = true;
        released = false;
        initPhase = true;
        heroTopMode = false;
        try {
            if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        } catch (_) { /* no-op */ }

        if (isReload()) {
            const stored = readStoredY();
            if (resolveHeroTopOnReload(stored)) {
                heroTopMode = true;
                savedY = 0;
            } else {
                savedY = stored != null ? stored : window.scrollY;
            }
        } else {
            savedY = window.scrollY;
            heroTopMode = savedY < HERO_TOP_THRESHOLD;
        }

        if (heroTopMode) {
            restoring = true;
            window.scrollTo(0, 0);
            requestAnimationFrame(function () { restoring = false; });
        } else if (isReload() && savedY > 0) {
            restoring = true;
            window.scrollTo(0, savedY);
            requestAnimationFrame(function () { restoring = false; });
        }
    }

    function rearm() {
        armed = false;
        released = false;
        initPhase = true;
        heroTopMode = isHeroAtViewportTop();
        savedY = heroTopMode ? 0 : window.scrollY;
        arm();
    }

    function getSavedY() {
        return savedY;
    }

    function shouldPlayEntry() {
        return armed && !released && isHeroTop();
    }

    function restoreScroll() {
        if (!isHome() || released) return;
        if (isHeroTop()) {
            lockHeroTop();
            return;
        }
        if (Math.abs(window.scrollY - savedY) > 1) {
            restoring = true;
            window.scrollTo(0, savedY);
            requestAnimationFrame(function () { restoring = false; });
        }
    }

    function scheduleScrollRefresh() {
        if (typeof ScrollTrigger === "undefined") return;
        if (released) {
            ScrollTrigger.update();
            if (typeof window.cwHeroSyncScrubToScroll === "function") {
                window.cwHeroSyncScrubToScroll();
            }
            return;
        }
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(function () {
            refreshQueued = false;
            if (isHeroTop()) lockHeroTop();
            else restoreScroll();
            ScrollTrigger.refresh();
            if (isHeroTop()) lockHeroTop();
            else restoreScroll();
            ScrollTrigger.update();
            requestAnimationFrame(function () {
                if (isHeroTop()) lockHeroTop();
                else restoreScroll();
                if (!isHeroTop() && typeof window.cwHeroSyncScrubToScroll === "function") {
                    window.cwHeroSyncScrubToScroll();
                }
            });
        });
    }

    function settle() {
        if (!isHome()) return;
        if (isHeroTop()) lockHeroTop();
        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
            if (isHeroTop()) lockHeroTop();
            ScrollTrigger.update();
        }
        restoreScroll();
        requestAnimationFrame(function () {
            if (isHeroTop()) lockHeroTop();
            else restoreScroll();
            if (hasHash() && !isReload()) {
                const el = document.querySelector(window.location.hash);
                if (el) cwScrollToSection(el, 0);
            }
            requestAnimationFrame(function () {
                if (!isHeroTop()) release();
            });
        });
    }

    function bindUserRelease() {
        window.addEventListener("wheel", release, { passive: true });
        window.addEventListener("touchmove", release, { passive: true });
        window.addEventListener("keydown", function (e) {
            const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
            if (keys.indexOf(e.key) !== -1) release();
        });
        window.addEventListener("scroll", function () {
            if (restoring || !isHome()) return;
            if (window.scrollY < HERO_TOP_THRESHOLD) {
                clearTimeout(persistTimer);
                persistHeroTopNow();
            } else if (!initPhase) {
                schedulePersist();
            }
            if (released || initPhase) return;
            release();
        }, { passive: true });
    }

    function bindPersistOnExit() {
        function saveOnExit() {
            if (!isHome()) return;
            persistScrollState();
        }
        window.addEventListener("beforeunload", saveOnExit);
        window.addEventListener("pagehide", saveOnExit);
    }

    bindUserRelease();
    bindPersistOnExit();

    if ("onscrollend" in window) {
        window.addEventListener("scrollend", function () {
            if (!isHome() || restoring) return;
            persistScrollState();
        }, { passive: true });
    }

    return {
        arm,
        rearm,
        restoreScroll,
        scheduleScrollRefresh,
        settle,
        shouldPlayEntry,
        getSavedY,
        isHeroTop,
        lockHeroTop,
        release,
        persistScrollState
    };
})();

window.cwHomeScheduleScrollRefresh = cwHomeScrollGuard.scheduleScrollRefresh;

if (document.body && document.body.classList.contains("page-home")) {
    cwHomeScrollGuard.arm();
}
window.addEventListener("load", function () { cwHomeScrollGuard.settle(); }, { once: true });

/* Reveal IO config */
const CW_REVEAL_IO_RATIO = 0.12;
const CW_REVEAL_IO_ROOT_MARGIN = "0px 0px -12% 0px";

function cwResolveRevealTrigger(triggerEl, targets) {
    if (triggerEl && triggerEl.nodeType === 1) return triggerEl;
    const first = targets && targets[0];
    if (!first || !first.closest) return first || null;
    return (
        first.closest(".section") ||
        first.closest("[id$='-content']") ||
        first.closest("main") ||
        first
    );
}

function cwRevealTargetsInstant(targets) {
    if (!targets.length || typeof gsap === "undefined") return;
    gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
}

function cwRevealTargets(targets, motion, stagger) {
    if (!targets.length || typeof gsap === "undefined") return;
    if (cwPrefersReducedMotion()) {
        cwRevealTargetsInstant(targets);
        return;
    }
    gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration: motion.durationEmphasis,
        ease: motion.easeOutSoft,
        stagger: stagger,
        overwrite: true,
        clearProps: "transform,opacity,visibility"
    });
}

/* Section entry reveal */
function cwRevealOnSectionEntry(targets, motion, stagger, triggerEl) {
    if (!targets.length || typeof gsap === "undefined") return;

    const trigger = cwResolveRevealTrigger(triggerEl, targets);
    if (!trigger) {
        cwRevealTargets(targets, motion, stagger);
        return;
    }

    if (typeof IntersectionObserver === "undefined") {
        cwRevealTargets(targets, motion, stagger);
        return;
    }

    let done = false;
    function runReveal() {
        if (done) return;
        done = true;
        cwRevealTargets(targets, motion, stagger);
    }

    const io = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (done || entry.target !== trigger) return;
                if (!entry.isIntersecting) return;
                if (entry.intersectionRatio < CW_REVEAL_IO_RATIO) return;
                io.disconnect();
                runReveal();
            });
        },
        {
            root: null,
            rootMargin: CW_REVEAL_IO_ROOT_MARGIN,
            threshold: [0, CW_REVEAL_IO_RATIO, 0.2, 0.35]
        }
    );

    io.observe(trigger);

    /* In view on load — IO fallback */
    requestAnimationFrame(function () {
        if (done) return;
        var rect = trigger.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.bottom <= 0 || rect.top >= vh || rect.height <= 0) return;
        var visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        if (visibleHeight / rect.height >= CW_REVEAL_IO_RATIO) runReveal();
    });
}

/* Skip reveal targets */
function cwShouldSkipRevealTarget(el) {
    if (!el || el.nodeType !== 1) return true;
    try {
        if (getComputedStyle(el).display === "contents") return true;
    } catch (_) { /* ignore */ }
    /* services__intro — block reveal */
    if (el.matches && el.matches("h2, h3") && el.closest(".services__intro")) return true;
    /* #statement — statement-story.js */
    if (el.closest && el.closest("#statement .statement__stage, #statement .statement__actions")) return true;
    /* Listing divider — desktop uses ::before */
    if (
        el.matches &&
        el.matches(".cw-listing__divider") &&
        el.closest("#perspectivas, #informes")
    ) {
        return true;
    }
    /* Article detail — no hide */
    if (el.closest && el.closest("article.detail-page")) {
        return true;
    }
    return false;
}

/* Hero canvas — home index */
const CW_HERO_SCRUB = 0.5;
const CW_HERO_TL = 100; /* timeline 0–1 */

/* Frame scrub */
function cwHeroAttachFrameScrub(timeline, frameState, lastFrameIndex, onFrame) {
    timeline.to(frameState, {
        frame: lastFrameIndex,
        snap: "frame",
        ease: "none",
        duration: CW_HERO_TL,
        onUpdate: onFrame
    }, 0);
}

/* Desktop scroll indicator */
function cwHeroAttachScrollIndicatorDesktop(parentTimeline, keyframeSpanPx) {
    const span = keyframeSpanPx;
    const indTl = gsap.timeline();
    indTl
        .set(CW_HERO_DESKTOP_SCROLL_SEL, { autoAlpha: 0, y: 20 })
        .to(CW_HERO_DESKTOP_SCROLL_SEL, {
            autoAlpha: 1,
            y: 0,
            duration: ((800 - 450) / span) * CW_HERO_TL,
            ease: "none"
        }, (450 / span) * CW_HERO_TL)
        .to(CW_HERO_DESKTOP_SCROLL_SEL, {
            autoAlpha: 0,
            y: -20,
            duration: ((1437 - 1300) / span) * CW_HERO_TL,
            ease: "none"
        }, (1300 / span) * CW_HERO_TL);
    parentTimeline.add(indTl, 0);
}

/* Mobile scrub phases */
const CW_HERO_MOBILE_COPY_FADE = 12;
const CW_HERO_MOBILE_CENTER_END = 30;
const CW_HERO_MOBILE_HIDE_AT = 84;

function cwHeroViewportCenter() {
    const vv = window.visualViewport;
    if (vv) {
        return {
            x: vv.offsetLeft + vv.width / 2,
            y: vv.offsetTop + vv.height / 2
        };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/* Hero entry — desktop stagger + actions; mobile includes scroll cue */
function cwHeroRemoveEntryPrestate() {
    if (document.body) document.body.classList.remove("cw-home-prestate");
}

function cwHeroPlayHomeEntry(timeline, onComplete) {
    if (cwIsHeroMobileLayout()) {
        timeline.fromTo(
            CW_HERO_COPY_ENTRY_SEL.concat([CW_HERO_MOBILE_SCROLL_SEL]),
            { autoAlpha: 0, y: 30, immediateRender: true },
            {
                autoAlpha: 1,
                y: 0,
                duration: 1.2,
                ease: "power2.out",
                stagger: 0.15,
                clearProps: "transform",
                immediateRender: true
            },
            "+=0.4"
        );
    } else {
        timeline
            .fromTo(CW_HERO_COPY_ENTRY_SEL,
                { autoAlpha: 0, y: 30, immediateRender: true },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    stagger: 0.15,
                    clearProps: "transform",
                    immediateRender: true
                },
                "+=0.4"
            )
            .fromTo(".hero__content .hero__actions",
                { autoAlpha: 0, y: 20, immediateRender: true },
                { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out", clearProps: "transform", immediateRender: true },
                "-=0.6"
            );
    }
    timeline.call(onComplete);
}

function cwHeroOnEntryComplete() {
    cwHeroEntryDone = true;
    cwHeroRemoveEntryPrestate();
    if (cwIsHeroMobileLayout()) {
        const ind = cwHeroGetMobileScrollCue();
        if (ind) {
            cwHeroRestoreMobileScrollCueInFlow(ind);
            cwHeroCaptureMobileCueRestY();
        }
    }
    if (typeof cwHomeScrollGuard !== "undefined") {
        cwHomeScrollGuard.release();
    }
    window.dispatchEvent(new CustomEvent("cw:heroEntryComplete"));
}

function cwHeroShowReducedMotionStatic() {
    cwHeroEntryDone = true;
    if (document.body) document.body.classList.remove("cw-home-prestate");
    const sel = CW_HERO_COPY_ENTRY_SEL.concat([
        ".hero__content .hero__actions",
        CW_HERO_DESKTOP_SCROLL_SEL,
        CW_HERO_MOBILE_SCROLL_SEL
    ]);
    if (typeof gsap !== "undefined") {
        gsap.set(sel.join(", "), { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
    } else {
        document.querySelectorAll(sel.join(", ")).forEach(function (el) {
            el.style.opacity = "1";
            el.style.visibility = "visible";
            el.style.transform = "none";
        });
    }
    const ind = cwHeroGetMobileScrollCue();
    if (ind) cwHeroRestoreMobileScrollCueInFlow(ind);
    if (typeof cwHomeScrollGuard !== "undefined") {
        cwHomeScrollGuard.release();
    }
}

function cwHeroSetEntryPrestate() {
    if (cwIsHeroMobileLayout()) {
        gsap.set(CW_HERO_COPY_ENTRY_SEL.concat([CW_HERO_MOBILE_SCROLL_SEL]), { autoAlpha: 0, y: 30 });
    } else {
        gsap.set(CW_HERO_COPY_ENTRY_SEL, { autoAlpha: 0, y: 30 });
        gsap.set(".hero__content .hero__actions", { autoAlpha: 0, y: 20 });
        gsap.set(CW_HERO_DESKTOP_SCROLL_SEL, { autoAlpha: 0, y: 15 });
    }
}

/* Mobile cue rest Y */
let cwHeroMobileCueRestY = null;

function cwHeroMeasureMobileCueCenterY(ind) {
    const r = ind.getBoundingClientRect();
    return r.top + r.height / 2;
}

function cwHeroCaptureMobileCueRestY() {
    if (!cwIsHeroMobileLayout()) return;
    const ind = cwHeroGetMobileScrollCue();
    if (!ind) return;
    cwHeroRestoreMobileScrollCueInFlow(ind);
    requestAnimationFrame(function () {
        if (!cwIsHeroMobileLayout()) return;
        cwHeroMobileCueRestY = cwHeroMeasureMobileCueCenterY(ind);
    });
}

function cwHeroRestoreMobileScrollCueInFlow(ind) {
    if (!cwIsHeroMobileLayout()) return;
    if (!ind) ind = cwHeroGetMobileScrollCue();
    if (!ind) return;
    if (typeof gsap !== "undefined") {
        gsap.set(ind, { clearProps: "transform,opacity,visibility" });
        gsap.set(ind, { y: 0, autoAlpha: 1, visibility: "visible" });
    } else {
        ind.style.transform = "";
        ind.style.opacity = "";
        ind.style.visibility = "";
    }
    ind.classList.remove("hero__scroll-indicator--parallax");
}

function cwHeroResetMobileScrollCueAtRest() {
    if (!cwIsHeroMobileLayout()) return;
    cwHeroMobileCueRestY = null;
    const ind = cwHeroGetMobileScrollCue();
    if (!ind) return;
    cwHeroRestoreMobileScrollCueInFlow(ind);
    cwHeroCaptureMobileCueRestY();
}

/* Mobile scroll cue — fade copy, rise to center */
function cwHeroMobileScrollCueSync(time) {
    if (!cwIsHeroMobileLayout() || typeof gsap === "undefined") return;
    const ind = cwHeroGetMobileScrollCue();
    if (!ind) return;

    const copyFadeEnd = CW_HERO_MOBILE_COPY_FADE;
    const centerEnd = CW_HERO_MOBILE_CENTER_END;
    const hideAt = CW_HERO_MOBILE_HIDE_AT;
    const targetY = cwHeroViewportCenter().y;

    function cueAtRest() {
        cwHeroRestoreMobileScrollCueInFlow(ind);
    }

    function cueRiseProgress(t) {
        const restY = cwHeroMobileCueRestY != null ? cwHeroMobileCueRestY : cwHeroMeasureMobileCueCenterY(ind);
        const span = Math.max(0.001, centerEnd - copyFadeEnd);
        const p = Math.min(1, Math.max(0, (t - copyFadeEnd) / span));
        const y = (targetY - restY) * p;
        gsap.set(ind, { y: y, autoAlpha: 1, visibility: "visible" });
        ind.classList.toggle("hero__scroll-indicator--parallax", p > 0.92);
    }

    if (!cwHeroEntryDone) {
        if (time <= 0) return;
        gsap.set(ind, { autoAlpha: 1, visibility: "visible", y: 0 });
        return;
    }

    if (time <= 0) {
        cueAtRest();
        cwHeroCaptureMobileCueRestY();
        return;
    }

    if (time < copyFadeEnd) {
        gsap.set(ind, { y: 0, autoAlpha: 1, visibility: "visible" });
        return;
    }

    if (time < centerEnd) {
        cueRiseProgress(time);
        return;
    }

    if (time < hideAt) {
        const restY = cwHeroMobileCueRestY != null ? cwHeroMobileCueRestY : cwHeroMeasureMobileCueCenterY(ind);
        gsap.set(ind, { y: targetY - restY, autoAlpha: 1, visibility: "visible" });
        ind.classList.add("hero__scroll-indicator--parallax");
        return;
    }

    const hideDur = CW_HERO_TL - hideAt;
    const hp = Math.min(1, (time - hideAt) / hideDur);
    const restY = cwHeroMobileCueRestY != null ? cwHeroMobileCueRestY : cwHeroMeasureMobileCueCenterY(ind);
    gsap.set(ind, { y: targetY - restY, autoAlpha: Math.max(0, 1 - hp) });
    if (hp >= 1) {
        ind.classList.remove("hero__scroll-indicator--parallax");
    }
}

/* Mobile cue — scrub sync */
function cwHeroAttachScrollIndicatorTouch(scrubTl) {
    scrubTl.eventCallback("onUpdate", function () {
        cwHeroMobileScrollCueSync(scrubTl.time());
    });
    cwHeroMobileScrollCueSync(scrubTl.time());
}

/* Touch copy fade on scrub — only after hero entry (avoids autoAlpha:1 flash at t=0) */
function cwHeroAttachCopyFadeOnTimeline(timeline, fadeDuration) {
    timeline.fromTo(
        [".hero__content > .cw-hero__tag", ".hero__content .subtitle", ".hero__content .h1"],
        { autoAlpha: 1, immediateRender: false },
        { autoAlpha: 0, duration: fadeDuration, ease: "none", stagger: 2, clearProps: "transform", immediateRender: false },
        0
    );
}

/* Desktop copy fade on scroll */
function cwHeroAttachCopyFadeDocument() {
    const fadeOutTl = gsap.timeline({
        scrollTrigger: {
            start: 80,
            end: "+=300",
            scrub: CW_HERO_SCRUB
        }
    });
    fadeOutTl
        .fromTo(".hero__actions", { autoAlpha: 1, immediateRender: false }, { autoAlpha: 0, duration: 1, immediateRender: false })
        .fromTo(
            [".hero__content > .cw-hero__tag", ".hero__content .subtitle", ".hero__content .h1"],
            { autoAlpha: 1, immediateRender: false },
            { autoAlpha: 0, duration: 1, stagger: 0.2, clearProps: "transform", immediateRender: false },
            "<0.2"
        );
}

/* Touch scroll normalize */
let cwTouchScrollNormalizeDone = false;
function cwEnableTouchScrollNormalize() {
    if (cwTouchScrollNormalizeDone || typeof ScrollTrigger === "undefined") return;
    if (!ScrollTrigger.normalizeScroll) return;
    cwTouchScrollNormalizeDone = true;
    ScrollTrigger.normalizeScroll({
        allowNestedScroll: true,
        type: "touch,pointer,wheel"
    });
}

/* Hero pin ScrollTrigger */
function cwHeroPinScrollTrigger(scrollPx, useFixedPin, hooks) {
    const cfg = {
        trigger: ".hero",
        start: "top top",
        end: `+=${scrollPx}`,
        scrub: CW_HERO_SCRUB,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
    };
    if (useFixedPin) cfg.pinType = "fixed";
    if (hooks) {
        if (hooks.onEnterBack) cfg.onEnterBack = hooks.onEnterBack;
        if (hooks.onLeaveBack) cfg.onLeaveBack = hooks.onLeaveBack;
    }
    return cfg;
}

/* Page transitions */
const CW_PAGE_EXIT_MS = 350;

function cwIsInternalNavLink(link) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank") {
        return false;
    }
    try {
        return new URL(href, window.location.href).origin === window.location.origin;
    } catch (_) {
        return false;
    }
}

function cwNavigateInternal(href, e) {
    if (e) e.preventDefault();
    if (cwPrefersReducedMotion()) {
        window.location.href = href;
        return;
    }
    document.body.classList.add("cw-page-exit");
    setTimeout(function () { window.location.href = href; }, CW_PAGE_EXIT_MS);
}

/* Enter on focused links — same path as click (native click follows; guard skips duplicate) */
let cwInternalNavFromEnter = false;

document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.defaultPrevented) return;
    const link = e.target.closest("a[href]");
    if (!link || !cwIsInternalNavLink(link)) return;
    cwInternalNavFromEnter = true;
    cwNavigateInternal(link.getAttribute("href"), e);
});

document.addEventListener("click", function (e) {
    if (cwInternalNavFromEnter) {
        cwInternalNavFromEnter = false;
        e.preventDefault();
        return;
    }
    const link = e.target.closest("a[href]");
    if (!link || !cwIsInternalNavLink(link)) return;
    cwNavigateInternal(link.getAttribute("href"), e);
});

window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.body.classList.remove("cw-page-exit");
});

/* Boot — scroll jank fix */
(() => {
    try {
        const root = document.documentElement;
        const prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        requestAnimationFrame(() => {
            root.style.scrollBehavior = prev || "";
        });
    } catch (_) {
        /* no-op */
    }
})();

/* Assessment storage hygiene */
function cwIsEvaluacionPage() {
    const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (path.endsWith("/evaluacion.html")) return true;
    return (window.location.href || "").toLowerCase().includes("evaluacion.html");
}

function cwClearAssessmentProgressStores() {
    const keys = ["chanwe_assessment_step"];
    for (let i = 1; i <= 5; i++) keys.push("chanwe_selection_" + i);
    keys.forEach((k) => {
        try {
            sessionStorage.removeItem(k);
            localStorage.removeItem(k);
        } catch (_) {
            /* no-op */
        }
    });
}

(() => {
    if (!cwIsEvaluacionPage()) {
        cwClearAssessmentProgressStores();
    }
})();

/* Detail page hooks */
function cwGetDynamicEl(name) {
    return document.querySelector('[data-dynamic="' + name + '"]');
}

function cwSetTextByDynamic(name, value) {
    const el = cwGetDynamicEl(name);
    if (el) el.textContent = value || '';
}

function cwSetBlockText(key, value) {
    const el =
        document.querySelector('[data-dynamic="block"][data-key="' + key + '"]');
    if (el) el.textContent = value || '';
}

/* Sync detail blocks */
function cwSyncDetailBlocks() {
    const blocks = document.querySelectorAll('.detail-page__body > .detail-page__block');
    if (!blocks.length) return;

    blocks.forEach(function (block) {
        const content = block.querySelector('[data-dynamic="block"]');
        const text = content
            ? (content.textContent || '').trim()
            : '';
        const html = content
            ? (content.innerHTML || '').replace(/<[^>]*>/g, '').trim()
            : '';
        block.hidden = !(text || html);
        block.classList.remove('detail-page__block--first');
    });

    const visible = document.querySelectorAll(
        '.detail-page__body > .detail-page__block:not([hidden])'
    );
    if (visible.length) visible[0].classList.add('detail-page__block--first');
}

function cwSetHeroImage(src, alt, style) {
    const img = cwGetDynamicEl('hero-img');
    if (!img) return;
    const i18n = window.CW_I18N;
    img.src = i18n && src ? i18n.assetPath(src) : (src || '');
    img.alt = alt || '';
    if (style) img.setAttribute('style', style);
}

function cwSetTagText(value) {
    const tagEl = cwGetDynamicEl('tag');
    if (!tagEl) return;
    const icon = tagEl.querySelector('img');
    const text = (value || '').trim();
    tagEl.textContent = text;
    if (icon) tagEl.prepend(icon);
    tagEl.style.display = text ? '' : 'none';
}

/* Navigation */
function cwInitNav() {
    const nav = document.getElementById('main-nav');
    const hamburger = document.querySelector('.nav__hamburger');
    const navMenu = document.querySelector('.nav__menu');
    /* Top-level nav links only */
    const navLinks = document.querySelectorAll('.nav__links > li > a.nav__link');

    if (!nav || nav.__cwNavInit) return;
    nav.__cwNavInit = true;

    /* Glass on scroll + home hero (lighter glass until next section) */
    const statement = document.getElementById("statement");
    const isHome = document.body && document.body.classList.contains("page-home");

    const updateNavGlass = () => {
        if (window.scrollY > 50) {
            nav.classList.add("scrolled");
        } else {
            nav.classList.remove("scrolled");
        }

        if (!isHome) {
            nav.classList.remove("nav--over-hero");
            return;
        }

        /* Over hero until #statement reaches the nav (next break) */
        let overHero = true;
        if (statement) {
            const navBottom = nav.getBoundingClientRect().bottom;
            overHero = statement.getBoundingClientRect().top > navBottom + 8;
        }
        nav.classList.toggle("nav--over-hero", overHero);
    };
    
    /* Sync glass on load */
    updateNavGlass();
    requestAnimationFrame(updateNavGlass);
    setTimeout(updateNavGlass, 50);
    window.addEventListener('scroll', updateNavGlass);

    /* Mobile menu */
    const updateHamburgerA11y = (expanded) => {
        const I18N = window.CW_I18N || { t: function (key) { return key; } };
        hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        hamburger.setAttribute('aria-label', expanded ? I18N.t('closeMenu') : I18N.t('openMenu'));
    };

    const setMenuOpen = (open, options) => {
        if (!hamburger || !navMenu) return;
        const focusMenuFirst = options && options.focusMenuFirst;
        const focusHamburger = options && options.focusHamburger;
        updateHamburgerA11y(open);
        hamburger.classList.toggle('active', open);
        navMenu.classList.toggle('active', open);
        document.body.classList.toggle('nav-menu-open', open);

        if (open && focusMenuFirst) {
            requestAnimationFrame(function () {
                const first = navMenu.querySelector(
                    '.nav__links a.nav__link, .nav__links button.nav__dropdown-trigger'
                );
                if (first) first.focus();
            });
        } else if (!open && focusHamburger) {
            hamburger.focus();
        }
    };

    let menuToggleFromKeyboard = false;

    const toggleMenu = (fromKeyboard) => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        if (!isExpanded) {
            setMenuOpen(true, { focusMenuFirst: fromKeyboard });
        } else {
            setMenuOpen(false, { focusHamburger: fromKeyboard });
        }
    };

    if (hamburger && navMenu) {
        updateHamburgerA11y(hamburger.getAttribute('aria-expanded') === 'true');
        hamburger.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                menuToggleFromKeyboard = true;
            }
        });
        hamburger.addEventListener('pointerdown', function () {
            menuToggleFromKeyboard = false;
        });
        hamburger.addEventListener('click', function () {
            const fromKeyboard = menuToggleFromKeyboard;
            menuToggleFromKeyboard = false;
            toggleMenu(fromKeyboard);
        });
    }

    /* Close menu on nav click */
    const closeMenuFromLink = (link) => {
        if (!navMenu.classList.contains('active')) return;
        toggleMenu(false);
        if (link && typeof link.blur === 'function') link.blur();
    };

    navLinks.forEach(link => {
        link.addEventListener('click', () => closeMenuFromLink(link));
    });

    /* Close menu on dropdown pick */
    document.querySelectorAll('.nav__dropdown .nav__dropdown-item').forEach(item => {
        item.addEventListener('click', () => closeMenuFromLink(item));
    });

    navMenu.querySelectorAll('.nav__mobile-lang-link, .mobile-nav-cta').forEach(link => {
        link.addEventListener('click', () => closeMenuFromLink(link));
    });

    /* Dropdowns — disclosure (button + link list, not menu role) */
    const dropdowns = Array.from(nav.querySelectorAll('.nav__dropdown-wrapper'));
    const isMobile = () => window.innerWidth <= 1024;
    const CW_DROPDOWN_HIDE_MS = 300;

    const closeDropdown = (wrapper, restoreFocus) => {
        const trigger = wrapper.querySelector('.nav__dropdown-trigger');
        const panel = wrapper.querySelector('.nav__dropdown');
        wrapper.classList.remove('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (panel) {
            clearTimeout(panel.__cwHideTimer);
            if (isMobile()) {
                panel.__cwHideTimer = setTimeout(function () {
                    panel.setAttribute('hidden', '');
                }, CW_DROPDOWN_HIDE_MS);
            } else {
                panel.setAttribute('hidden', '');
            }
        }
        if (restoreFocus && trigger) trigger.focus();
    };

    const closeOtherDropdowns = (currentWrapper) => {
        dropdowns.forEach(wrapper => {
            if (wrapper !== currentWrapper) closeDropdown(wrapper, false);
        });
    };

    const openDropdown = (wrapper) => {
        const trigger = wrapper.querySelector('.nav__dropdown-trigger');
        const panel = wrapper.querySelector('.nav__dropdown');
        closeOtherDropdowns(wrapper);
        if (panel) {
            clearTimeout(panel.__cwHideTimer);
            panel.removeAttribute('hidden');
        }
        wrapper.classList.add('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
    };

    const toggleDropdown = (wrapper) => {
        wrapper.classList.contains('open') ? closeDropdown(wrapper, false) : openDropdown(wrapper);
    };

    dropdowns.forEach(wrapper => {
        const trigger = wrapper.querySelector('.nav__dropdown-trigger');
        const panel = wrapper.querySelector('.nav__dropdown');
        if (!trigger || !panel) return;

        /* Desktop hover */
        wrapper.addEventListener('mouseenter', () => {
            if (!isMobile()) openDropdown(wrapper);
        });
        wrapper.addEventListener('mouseleave', () => {
            if (!isMobile()) closeDropdown(wrapper, false);
        });

        /* Click/tap trigger */
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isMobile()) {
                toggleDropdown(wrapper);
            } else {
                openDropdown(wrapper);
            }
        });
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
        dropdowns.forEach(wrapper => {
            if (!wrapper.contains(e.target)) closeDropdown(wrapper, false);
        });
    });

    /* Close on Escape — return focus to trigger */
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (isMobile()) {
            const openDropdown = dropdowns.find(function (wrapper) {
                return wrapper.classList.contains('open');
            });
            if (openDropdown) {
                closeDropdown(openDropdown, true);
                return;
            }
        }
        if (navMenu && navMenu.classList.contains('active')) {
            setMenuOpen(false, { focusHamburger: true });
            return;
        }
        dropdowns.forEach(wrapper => {
            if (wrapper.classList.contains('open')) closeDropdown(wrapper, true);
        });
    });

    window.addEventListener('resize', () => {
        if (!isMobile() && navMenu && navMenu.classList.contains('active')) {
            setMenuOpen(false);
        }
    });
}

document.addEventListener("DOMContentLoaded", cwInitNav);
window.addEventListener("cw:componentsReady", cwInitNav);

/* Home hero + canvas */
document.addEventListener("DOMContentLoaded", () => {
    /* GSAP fallback — show hero */
    if (typeof gsap === "undefined") {
        const rescue = [".hero__content > .cw-hero__tag", ".hero__content > .h1", ".hero__content > .subtitle", ".hero__content > .hero__actions", CW_HERO_DESKTOP_SCROLL_SEL, CW_HERO_MOBILE_SCROLL_SEL];
        rescue.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                el.style.opacity = "1";
                el.style.visibility = "visible";
            });
        });
        return;
    }

    /* Home only */
    const isHome = document.body && document.body.classList.contains("page-home");
    if (!isHome) return;

    /* Hero entry */
    let entryTl = gsap.timeline();

    if (cwPrefersReducedMotion()) {
        gsap.set(".section:not(#statement) .section-tag, .hero__content > .cw-hero__tag", {
            autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility"
        });
    } else {
        gsap.set(".section:not(#statement) .section-tag, .hero__content > .cw-hero__tag", { autoAlpha: 0, y: 15 });
        if (cwHomeScrollGuard.shouldPlayEntry()) {
            cwHeroSetEntryPrestate();
        }
    }

    /* Static hero — mid-page refresh: show copy; scrub owns scroll cues */
    function cwRevealHeroStatic() {
        cwHeroEntryDone = true;
        if (document.body) document.body.classList.remove("cw-home-prestate");
        const heroCopy = [".hero__content > .cw-hero__tag", ".hero__content .h1", ".hero__content .subtitle"];
        if (!cwIsHeroMobileLayout()) {
            heroCopy.push(".hero__content .hero__actions");
        }
        if (typeof gsap !== "undefined") {
            gsap.set(heroCopy, { autoAlpha: 1, y: 0, clearProps: "transform" });
        } else {
            document.querySelectorAll(heroCopy.join(", ")).forEach((el) => {
                el.style.opacity = "1";
                el.style.visibility = "visible";
                el.style.transform = "none";
            });
        }
        if (typeof window.cwHeroSyncScrubToScroll === "function") {
            window.cwHeroSyncScrubToScroll();
        }
        if (cwIsHeroMobileLayout()) {
            cwHeroResetMobileScrollCueAtRest();
            if (typeof window.cwHeroSyncScrubToScroll === "function") {
                window.cwHeroSyncScrubToScroll();
            }
        }
    }

    let cwHeroEntryStarted = false;

    function cwStartHeroEntry() {
        if (cwHeroEntryStarted) return true;

        cwHeroEntryStarted = true;
        cwHeroEntryDone = false;

        if (cwPrefersReducedMotion()) {
            cwHeroShowReducedMotionStatic();
            return true;
        }

        if (!cwHomeScrollGuard.shouldPlayEntry()) {
            cwRevealHeroStatic();
            window.dispatchEvent(new CustomEvent("cw:heroEntryComplete"));
            return true;
        }

        /* Lock prestate before anim — class stays until entry completes (GSAP inline overrides opacity) */
        cwHeroSetEntryPrestate();
        gsap.set(".section:not(#statement) .section-tag", { autoAlpha: 0, y: 15 });

        cwHeroPlayHomeEntry(entryTl, cwHeroOnEntryComplete);

        return true;
    }

    /* bfcache re-entry */
    function cwRunHomeEntry() {
        cwHomeScrollGuard.rearm();
        cwHeroEntryStarted = false;
        cwHeroEntryDone = false;
        try { entryTl.kill(); } catch (_) {}
        entryTl = gsap.timeline();
        if (cwPrefersReducedMotion()) {
            cwHeroShowReducedMotionStatic();
            cwHeroEntryStarted = true;
            return;
        }
        if (document.body) document.body.classList.add("cw-home-prestate");
        if (!cwHomeScrollGuard.shouldPlayEntry()) {
            if (document.body) document.body.classList.remove("cw-home-prestate");
            cwRevealHeroStatic();
            window.dispatchEvent(new CustomEvent("cw:heroEntryComplete"));
            cwHeroEntryStarted = true;
            return;
        }
        cwStartHeroEntry();
    }

    window.__cwRunHomeEntry = cwRunHomeEntry;

    /* bfcache — prestate on hide */
    window.addEventListener("pagehide", () => {
        if (document.body && !cwPrefersReducedMotion()) document.body.classList.add("cw-home-prestate");
    });

    cwStartHeroEntry();

    /* Canvas scrub */
    const canvas = document.getElementById("hero-video-canvas");
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const frameCount = CW_HERO_TOTAL_FRAMES - CW_HERO_FRAME_SKIP;
    const currentFrame = scrubIndex => {
        const assetNum = scrubIndex + 1 + CW_HERO_FRAME_SKIP;
        const path = `assets/04-video/frames/chanwe-frame-${assetNum.toString().padStart(3, '0')}.webp`;
        return window.CW_I18N ? window.CW_I18N.assetPath(path) : path;
    };

    const images = [];
    const obj = { frame: 0 };
    let cwHeroFrame0Ready = false;
    let cwHeroCropLocked = null;
    let cwHeroResizeRaf = 0;

    function cwHeroResetCropLock() {
        cwHeroCropLocked = null;
    }

    function cwHeroComputeCrop(img, canvasW, canvasH) {
        const hRatio = canvasW / img.naturalWidth;
        const vRatio = canvasH / img.naturalHeight;
        const ratio = Math.max(hRatio, vRatio);

        let focusX = 2.0;
        if (!mqHeroSmall.matches && window.innerWidth < 1280) {
            focusX = 1.0;
        }

        const scaledW = Math.ceil(img.naturalWidth * ratio);
        const scaledH = Math.ceil(img.naturalHeight * ratio);
        let centerShift_x = (canvasW - scaledW) / focusX;
        let centerShift_y = (canvasH - scaledH) / 2;

        if (centerShift_x + scaledW < canvasW) centerShift_x = canvasW - scaledW;
        if (centerShift_y + scaledH < canvasH) centerShift_y = canvasH - scaledH;

        return { centerShift_x, centerShift_y, scaledW, scaledH };
    }

    /* Preload scrub frames (skips misaligned assets 001–005) */
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        if (i === 0) {
            const onFrame0Ready = function () {
                cwHeroFrame0Ready = true;
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        resize(true);
                    });
                });
            };
            img.addEventListener("load", onFrame0Ready, { once: true });
            img.addEventListener("error", onFrame0Ready, { once: true });
        }
        img.src = currentFrame(i);
        images.push(img);
    }

    const mqHeroSmall = window.matchMedia("(max-width: 480px)");

    function render() {
        if (!cwHeroFrame0Ready) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        const img = images[obj.frame];
        if (!img || !img.naturalWidth || !img.naturalHeight) return;

        const crop = cwHeroComputeCrop(img, canvas.width, canvas.height);
        if (cwHeroCropLocked === null) {
            cwHeroCropLocked = {
                x: crop.centerShift_x,
                y: crop.centerShift_y
            };
        } else {
            crop.centerShift_x = cwHeroCropLocked.x;
            crop.centerShift_y = cwHeroCropLocked.y;
        }

        context.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            crop.centerShift_x,
            crop.centerShift_y,
            crop.scaledW,
            crop.scaledH
        );
    }

    const heroSection = canvas.closest(".hero");

    function resize(immediate) {
        const apply = function () {
            let w;
            let h;
            if (heroSection) {
                const rect = heroSection.getBoundingClientRect();
                w = Math.max(1, Math.ceil(rect.width));
                h = Math.max(1, Math.ceil(rect.height));
            } else {
                w = Math.max(1, window.innerWidth);
                h = Math.max(1, window.innerHeight);
            }
            canvas.width = w;
            canvas.height = h;
            render();
        };

        if (immediate) {
            if (cwHeroResizeRaf) {
                cancelAnimationFrame(cwHeroResizeRaf);
                cwHeroResizeRaf = 0;
            }
            apply();
            return;
        }

        if (cwHeroResizeRaf) cancelAnimationFrame(cwHeroResizeRaf);
        cwHeroResizeRaf = requestAnimationFrame(function () {
            cwHeroResizeRaf = 0;
            apply();
        });
    }

    window.addEventListener("resize", function () {
        cwHeroResetCropLock();
        resize(true);
    });
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", function () { resize(false); });
    }
    if (typeof mqHeroSmall.addEventListener === "function") {
        mqHeroSmall.addEventListener("change", function () {
            cwHeroResetCropLock();
            resize(true);
        });
    } else if (typeof mqHeroSmall.addListener === "function") {
        mqHeroSmall.addListener(function () {
            cwHeroResetCropLock();
            resize(true);
        });
    }
    if (heroSection && typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(function () { resize(false); });
        ro.observe(heroSection);
    }
    resize(true);

    const lastFrame = frameCount - 1;
    const isHeroMobile = cwIsHeroMobileLayout();

    if (isHeroMobile) {
        cwEnableTouchScrollNormalize();
        cwHeroMobileCueRestY = null;
    }

    obj.frame = 0;
    render();

    if (cwPrefersReducedMotion()) {
        cwHeroShowReducedMotionStatic();
        window.cwHeroSyncScrubToScroll = function () {};
        return;
    }

    let scrubTl = null;

    function cwInitHeroScrubTimeline() {
        if (scrubTl) return scrubTl;

        scrubTl = gsap.timeline({
            scrollTrigger: cwHeroPinScrollTrigger(CW_HERO_PIN_SCROLL_PX, isHeroMobile, isHeroMobile ? {
                onEnterBack: function () {
                    cwHeroResetMobileScrollCueAtRest();
                    cwHeroMobileScrollCueSync(0);
                }
            } : null)
        });

        if (isHeroMobile) {
            cwHeroAttachCopyFadeOnTimeline(scrubTl, 12);
            cwHeroAttachFrameScrub(scrubTl, obj, lastFrame, render);
            cwHeroAttachScrollIndicatorTouch(scrubTl);
            scrubTl.eventCallback("onReverseComplete", function () {
                cwHeroResetMobileScrollCueAtRest();
                cwHeroMobileScrollCueSync(0);
            });
        } else {
            cwHeroAttachFrameScrub(scrubTl, obj, lastFrame, render);
            cwHeroAttachScrollIndicatorDesktop(scrubTl, CW_HERO_PIN_SCROLL_PX);
            cwHeroAttachCopyFadeDocument();
        }

        window.cwHeroSyncScrubToScroll = function () {
            if (typeof ScrollTrigger === "undefined" || !scrubTl) return;
            ScrollTrigger.update();
            if (scrubTl.scrollTrigger) scrubTl.scrollTrigger.update();
            if (isHeroMobile) cwHeroMobileScrollCueSync(scrubTl.time());
        };

        return scrubTl;
    }

    if (isHeroMobile && cwHomeScrollGuard.shouldPlayEntry()) {
        window.addEventListener("cw:heroEntryComplete", function () {
            cwInitHeroScrubTimeline();
            if (typeof window.cwHomeScheduleScrollRefresh === "function") {
                window.cwHomeScheduleScrollRefresh();
            } else if (typeof ScrollTrigger !== "undefined") {
                ScrollTrigger.refresh();
            }
        }, { once: true });
        window.cwHeroSyncScrubToScroll = function () {};
    } else {
        cwInitHeroScrubTimeline();
    }

    if (cwHomeScrollGuard.isHeroTop()) {
        cwHomeScrollGuard.lockHeroTop();
    } else if (cwHomeScrollGuard.getSavedY() > 50) {
        cwRevealHeroStatic();
    }

    const refreshHeroScroll = () => {
        if (typeof window.cwHomeScheduleScrollRefresh === "function") {
            window.cwHomeScheduleScrollRefresh();
        } else if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    };
    window.cwRefreshHeroScroll = refreshHeroScroll;
    window.addEventListener("orientationchange", refreshHeroScroll);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", refreshHeroScroll);
    }
    images[0].addEventListener("load", function () {
        render();
        refreshHeroScroll();
    }, { once: true });

    if (isHeroMobile) {
        window.addEventListener("scrollend", function () {
            if (!document.body.classList.contains("page-home")) return;
            if (!cwIsHeroMobileLayout()) return;
            if (window.scrollY > 8) return;
            if (!scrubTl) return;
            cwHeroResetMobileScrollCueAtRest();
            cwHeroMobileScrollCueSync(scrubTl.time());
        }, { passive: true });
    }
});

/* bfcache — navbar safety */
window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    const isHome = document.body && document.body.classList.contains("page-home");
    if (isHome && typeof window.__cwRunHomeEntry === "function") {
        window.__cwRunHomeEntry();
        return;
    }

});

/* Method accordion */
document.addEventListener("DOMContentLoaded", () => {
    const methodPillars = document.querySelectorAll(".method__pillar");
    const leftImgs = document.querySelectorAll(".method__img-wrap--left .method__img");
    const centerImgs = document.querySelectorAll(".method__img-wrap--center .method__img");
    const rightImgs = document.querySelectorAll(".method__img-wrap--right .method__img");

    if (!methodPillars.length) return;

    let currentMethodIndex = 0;
    let isMethodAnimating = false;

    /* Image crossfade */
    function swapMethodTrio(nextIndex) {
        if (nextIndex === currentMethodIndex || isMethodAnimating) return;
        isMethodAnimating = true;

        const n = centerImgs.length;
        const prevIndex = (nextIndex - 1 + n) % n;
        const nextSideIndex = (nextIndex + 1) % n;

        const oldActiveImgs = document.querySelectorAll(".method__visual .method__img--active");
        const inCenter = centerImgs[nextIndex];
        const inLeft   = leftImgs[prevIndex];
        const inRight  = rightImgs[nextSideIndex];
        const nextImgs = [inLeft, inCenter, inRight];

        if (cwPrefersReducedMotion()) {
            oldActiveImgs.forEach(function (img) {
                img.classList.remove("method__img--active");
                gsap.set(img, { opacity: 0 });
            });
            nextImgs.forEach(function (img) {
                img.classList.add("method__img--active");
                gsap.set(img, { opacity: 0.85 });
            });
            currentMethodIndex = nextIndex;
            isMethodAnimating = false;
            return;
        }

        nextImgs.forEach(img => {
            gsap.set(img, { opacity: 0 });
            img.classList.add("method__img--active");
        });

        gsap.to(oldActiveImgs, {
            opacity: 0,
            duration: 0.7,
            ease: "power1.inOut",
            onComplete: () => {
                oldActiveImgs.forEach(img => {
                    img.classList.remove("method__img--active");
                    gsap.set(img, { opacity: 0 });
                });
                isMethodAnimating = false;
            }
        });

        gsap.to(nextImgs, {
            opacity: 0.85,
            duration: 0.8,
            delay: 0.15,
            ease: "power2.out",
            stagger: 0.05
        });

        currentMethodIndex = nextIndex;
    }

    function setPillarBodyA11y(body, isOpen) {
        if (isOpen) {
            body.removeAttribute("aria-hidden");
            body.inert = false;
        } else {
            body.setAttribute("aria-hidden", "true");
            body.inert = true;
        }
    }

    function openPillar(index) {
        methodPillars.forEach((pillar, i) => {
            const body    = pillar.querySelector(".method__pillar-body");
            const trigger = pillar.querySelector(".method__pillar-trigger");
            const isTarget = i === index;

            pillar.classList.toggle("method__pillar--active", isTarget);
            trigger.setAttribute("aria-expanded", isTarget ? "true" : "false");
            setPillarBodyA11y(body, isTarget);
        });
        swapMethodTrio(index);
    }

    function closePillar(index) {
        const pillar  = methodPillars[index];
        const body    = pillar.querySelector(".method__pillar-body");
        const trigger = pillar.querySelector(".method__pillar-trigger");

        pillar.classList.remove("method__pillar--active");
        trigger.setAttribute("aria-expanded", "false");
        setPillarBodyA11y(body, false);
    }

    /* Lock column heights */
    function lockVisualHeight() {
        const visualEl  = document.querySelector(".method__visual");
        const pillarsEl = document.querySelector(".method__pillars");
        if (!visualEl || !pillarsEl) return;

        const h = pillarsEl.getBoundingClientRect().height;
        if (h > 0) {
            visualEl.style.height     = h + "px";
            pillarsEl.style.minHeight = h + "px";
        }
    }

    window.addEventListener("load", lockVisualHeight);

    methodPillars.forEach((pillar, i) => {
        pillar.querySelector(".method__pillar-trigger").addEventListener("click", () => {
            if (pillar.classList.contains("method__pillar--active")) {
                closePillar(i);
            } else {
                openPillar(i);
            }
        });
    });
});

/* Concept parallax */
document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector(".concept__parallax-wrapper")) return;
    if (cwPrefersReducedMotion()) return;

    gsap.fromTo(".concept__parallax-wrapper",
        { yPercent: -2.5 },
        {
            yPercent: 2.5,
            ease: "none",
            scrollTrigger: {
                trigger: ".concept",
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        }
    );
});

/* Card pointer glow */
function cwBindCardPointerGlow(root) {
    const scope = root || document;
    scope.querySelectorAll(".card-default, .concept__topics .card-dark.group, .informe-card").forEach((card) => {
        if (card.dataset.cwPointerGlowBound === "true") return;
        card.dataset.cwPointerGlowBound = "true";
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${x}px`);
            card.style.setProperty("--mouse-y", `${y}px`);
        });
    });
}
window.cwBindCardPointerGlow = cwBindCardPointerGlow;

document.addEventListener("DOMContentLoaded", () => {
    cwBindCardPointerGlow(document);
});

/* Section background swap */
document.addEventListener("DOMContentLoaded", () => {
    /* Home — static background */
    if (document.body && document.body.classList.contains("page-home")) return;

    const root = document.documentElement;
    const cv = (name) => getComputedStyle(root).getPropertyValue(name).trim();
    const N100 = cv("--neutral-100");
    const N0 = cv("--neutral-0");

    gsap.set("body", { backgroundColor: N100 });

    const bgSections = [
        { selector: ".problem",  color: N100 },
        { selector: ".concept",  color: N0 },
        { selector: ".method",   color: N100 },
        { selector: ".services", color: N0 }
    ];

    bgSections.forEach((sec) => {
        const trigger = document.querySelector(sec.selector);
        if (!trigger) return;

        const applyBg = () => {
            if (cwPrefersReducedMotion()) {
                gsap.set("body", { backgroundColor: sec.color });
            } else {
                gsap.to("body", { backgroundColor: sec.color, duration: 1.2, ease: "power1.inOut" });
            }
        };

        ScrollTrigger.create({
            trigger,
            start: "top 50%",
            end: "bottom 50%",
            onEnter: applyBg,
            onEnterBack: applyBg
        });
    });
});

/* Anchor scroll */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = this.getAttribute('href');
            if (target === '#') return;

            const targetElem = document.querySelector(target);
            if (!targetElem) return;

            e.preventDefault();
            cwScrollToSection(targetElem, 1.2);
        });
    });
});

/* Universal scroll reveal */
document.addEventListener("DOMContentLoaded", () => {
    const isEvalLanding = document.body && document.body.classList.contains("page-evaluacion");

    /* Page-specific reveals live in per-page JS */
    const sections = document.querySelectorAll([
        ".section",
    ].join(", "));

    function cwReadCssVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name);
        const out = (v || "").toString().trim();
        return out || fallback;
    }

    function cwMsToSeconds(msString, fallbackSeconds) {
        const s = (msString || "").toString().trim();
        const n = parseFloat(s.replace("ms", ""));
        if (!Number.isFinite(n)) return fallbackSeconds;
        return Math.max(0, n / 1000);
    }

    const cwMotion = {
        durationMicro: cwMsToSeconds(cwReadCssVar("--duration-micro", "100ms"), 0.1),
        durationFast: cwMsToSeconds(cwReadCssVar("--duration-fast", "200ms"), 0.2),
        durationBase: cwMsToSeconds(cwReadCssVar("--duration-base", "300ms"), 0.3),
        durationSlow: cwMsToSeconds(cwReadCssVar("--duration-slow", "500ms"), 0.5),
        durationEmphasis: cwMsToSeconds(cwReadCssVar("--duration-emphasis", "800ms"), 0.8),
        easeStandard: cwReadCssVar("--ease-standard", "power2.out"),
        easeEmphasis: cwReadCssVar("--ease-emphasis", "power2.out"),
        easeOutSoft: cwReadCssVar("--ease-out-soft", "power2.out")
    };

    /* Expose motion tokens */
    window.cwMotion = cwMotion;

    /* Content selectors */
    const seqSelectors = [
        ".section-tag",
        ".page-title",
        ".page-lead",
        "h1",
        "h2", 
        "h3",
        "[class$='__divider']",
        ".problem__closing",
        ".problem__grid > div", 
        ".concept__intro",
        ".concept__media", 
        ".concept__topics > div",
        ".concept__micro",
        ".concept__attribution",
        ".method__pillars", 
        ".method__visual",
        ".services__intro",
        ".services__cta",
        ".services__viewport",
        ".services__nav", 
        ".contacto__grid",
        ".case-card",
        ".cases__cta-wrapper .btn",
        ".insight-row",
        ".assessment__lead",
        ".assessment__features",
        ".assessment__card",
        ".assessment__footer",
        ".final-cta__title",
        ".final-cta__body",
        ".final-cta__btn",
        ".final-cta__footer",
        ".text-center > .btn-secondary, .text-center > .btn-primary"
    ].join(", ");

    window.cwRevealContentSelectors = seqSelectors;

    /* Scroll reveal API */
    window.applyScrollReveal = function (elements, triggerEl) {
        if (!elements || !elements.length) return;
        const targets = Array.prototype.slice.call(elements).filter(function (el) {
            return el && el.nodeType === 1 && !el.hasAttribute("data-cw-reveal") && !cwShouldSkipRevealTarget(el);
        });
        if (!targets.length) return;
        targets.forEach(function (el) {
            el.setAttribute("data-cw-reveal", "1");
        });

        if (isEvalLanding || cwPrefersReducedMotion()) {
            cwRevealTargetsInstant(targets);
            return;
        }

        gsap.set(targets, { autoAlpha: 0, y: 12 });
        cwRevealOnSectionEntry(targets, cwMotion, 0.12, triggerEl);
    };

    /* CTA reveal preset */
    window.applyCtaReveal = function (elements, triggerEl) {
        if (!elements || !elements.length) return;
        const targets = Array.prototype.slice.call(elements).filter(function (el) {
            return el && el.nodeType === 1 && !el.hasAttribute("data-cw-reveal") && !cwShouldSkipRevealTarget(el);
        });
        if (!targets.length) return;
        targets.forEach(function (el) {
            el.setAttribute("data-cw-reveal", "1");
        });

        if (isEvalLanding || cwPrefersReducedMotion()) {
            cwRevealTargetsInstant(targets);
            return;
        }

        gsap.set(targets, { autoAlpha: 0, y: 12 });
        cwRevealOnSectionEntry(targets, cwMotion, 0.1, triggerEl);
    };

    if (isEvalLanding) {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
        return;
    }

    sections.forEach((section) => {
        /* Pulse eval landing — evaluacion.js owns scroll reveal */
        if (section.closest("#eval-landing-content")) return;

        /* Skip hero — canvas scrub */
        if (section.classList.contains("hero")) return;
        if (section.id === "contacto-content") return;
        /* #statement — statement-story.js */
        if (section.id === "statement") return;
        /* Listing pages — per-page JS */
        if (section.id === "perspectivas" && section.querySelector(".cw-perspectivas__layout")) return;
        if (section.id === "informes" && section.querySelector(".cw-informes__layout")) return;

        const revealElements = section.querySelectorAll(seqSelectors);
        window.applyScrollReveal(revealElements, section);
    });

    /* Interior CTA reveal */
    if (!document.body.classList.contains("page-home")) {
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        if (
            currentPage !== "newsletter.html" &&
            currentPage !== "mi-espacio.html" &&
            currentPage !== "evaluacion.html"
        ) {
            const metodologiaRoot = document.getElementById("metodologia-content");
            const serviciosRoot = document.getElementById("servicios-content");
            const ctas = document.querySelectorAll("main .btn");
            const ctaTargets = Array.prototype.slice.call(ctas).filter(function (btn) {
                if (metodologiaRoot && metodologiaRoot.contains(btn)) return false;
                if (serviciosRoot && serviciosRoot.contains(btn)) return false;
                return true;
            });
            if (ctaTargets.length) window.applyCtaReveal(ctaTargets);
        }
    }
});

/* Services carousel */
document.addEventListener("DOMContentLoaded", () => {
    const wrap = document.querySelector(".services__wrapper");
    const sls = document.querySelectorAll(".services__slide");
    const pBtn = document.querySelector(".services__nav-btn--prev");
    const nBtn = document.querySelector(".services__nav-btn--next");
    const servicesSection = document.querySelector(".services");
    const carouselEl = document.querySelector(".services__carousel");
    
    if (!wrap || !sls.length) return;

    const I18N = window.CW_I18N || { t: function (key) { return key; } };
    const formatSlideStatus = window.cwFormatCarouselSlideStatus || function (current, total) {
        return I18N.t('carouselSlide') + ' ' + current + ' ' + I18N.t('of') + ' ' + total;
    };
    const announceSlide = window.cwAnnounceCarouselSlide || function (statusEl, current, total) {
        if (!statusEl || total < 1) return;
        const oneBased = Math.max(1, Math.min(current + 1, total));
        statusEl.textContent = formatSlideStatus(oneBased, total);
    };
    let statusEl = null;
    if (carouselEl) {
        if (typeof window.cwInitCarouselA11yShell === 'function') {
            statusEl = window.cwInitCarouselA11yShell(carouselEl, {
                ariaLabel: I18N.t('servicesCarouselAria')
            });
        } else {
            carouselEl.setAttribute('aria-roledescription', I18N.t('carouselRoleDescription'));
            carouselEl.setAttribute('aria-label', I18N.t('servicesCarouselAria'));
            statusEl = document.createElement('div');
            statusEl.className = 'cw-carousel__status';
            statusEl.setAttribute('aria-live', 'polite');
            statusEl.setAttribute('aria-atomic', 'true');
            carouselEl.appendChild(statusEl);
        }
    }
    
    let current = 0;
    let servicesAccentIo = null;
    let servicesSectionVisible = false;

    function syncServicesSlideAccent() {
        if (!cwIsTabletOrMobileLayout()) {
            sls.forEach(function (slide) {
                cwSetViewportAccent(slide, false);
                slide.classList.remove("services__slide--active");
            });
            return;
        }
        sls.forEach(function (slide, i) {
            const active = servicesSectionVisible && i === current;
            cwSetViewportAccent(slide, active);
            slide.classList.toggle("services__slide--active", active);
        });
    }

    function move() {
        const slideDur = cwPrefersReducedMotion() ? 0 : 0.7;
        const slideEase = cwPrefersReducedMotion() ? "none" : "expo.out";
        gsap.to(wrap, {
            xPercent: -100 * current,
            duration: slideDur,
            ease: slideEase
        });

        if (pBtn) pBtn.style.visibility = (current === 0) ? "hidden" : "visible";
        if (nBtn) nBtn.style.visibility = (current === sls.length - 1) ? "hidden" : "visible";
        syncServicesSlideAccent();
        announceSlide(statusEl, current, sls.length);
    }

    function bindServicesSectionAccent() {
        if (servicesAccentIo) {
            servicesAccentIo.disconnect();
            servicesAccentIo = null;
        }
        if (!servicesSection || !cwIsTabletOrMobileLayout()) {
            servicesSectionVisible = false;
            syncServicesSlideAccent();
            return;
        }
        if (typeof IntersectionObserver === "undefined") {
            servicesSectionVisible = true;
            syncServicesSlideAccent();
            return;
        }
        servicesAccentIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                servicesSectionVisible = entry.isIntersecting
                    && entry.intersectionRatio >= CW_SERVICES_ACCENT_MIN_RATIO;
                syncServicesSlideAccent();
            });
        }, {
            root: null,
            rootMargin: CW_SERVICES_ACCENT_ROOT_MARGIN,
            threshold: [0, 0.15, 0.25, 0.5, 0.75, 1]
        });
        servicesAccentIo.observe(servicesSection);
    }

    if (nBtn) {
        nBtn.addEventListener("click", () => {
            if (current < sls.length - 1) {
                current++;
                move();
            }
        });
    }

    if (pBtn) {
        pBtn.addEventListener("click", () => {
            if (current > 0) {
                current--;
                move();
            }
        });
    }

    move();
    bindServicesSectionAccent();

    const accentMq = window.matchMedia(CW_TABLET_MOBILE_MQ);
    const onAccentMqChange = function () {
        cwInitViewportAccent();
        bindServicesSectionAccent();
        syncServicesSlideAccent();
    };
    if (typeof accentMq.addEventListener === "function") {
        accentMq.addEventListener("change", onAccentMqChange);
    } else if (typeof accentMq.addListener === "function") {
        accentMq.addListener(onAccentMqChange);
    }

    cwInitViewportAccent();
});
