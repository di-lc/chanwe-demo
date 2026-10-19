/* ==========================================================================
   Statement story
   #statement — index / page-home only
   Desktop: pin + crossfade | Mobile: stacked reveal
   ========================================================================== */

(function () {
    "use strict";

    const CW_STATEMENT_DESKTOP_MQ = "(min-width: 1025px)";
    const CW_STATEMENT_NAV_OFFSET = 64;
    const CW_STATEMENT_FADE_S = 0.48;
    const CW_STATEMENT_MOBILE_REVEAL_S = 0.4;
    const CW_STATEMENT_MOBILE_REVEAL_Y = 12;
    const CW_STATEMENT_MOBILE_IO_RATIO = 0.22;
    const CW_STATEMENT_FADE_OVERLAP = 0.35;
    const CW_STATEMENT_SCRUB = 0.55;
    const CW_STATEMENT_SCROLL_VH = 1.35;
    const CW_STATEMENT_HOLD = 0.1;
    const CW_STATEMENT_FADE_EASE = "sine.inOut";

    function cwStatementReducedMotion() {
        return window.cwPrefersReducedMotion ? window.cwPrefersReducedMotion() : false;
    }

    function cwStatementSetActiveStep(steps, index) {
        steps.forEach(function (step, i) {
            const on = i === index;
            step.classList.toggle("is-active", on);
            step.setAttribute("aria-hidden", on ? "false" : "true");
        });
    }

    function cwStatementMeasureStage(stage, steps) {
        if (!stage || !steps.length) return;

        const previous = steps.map(function (step) {
            return {
                position: step.style.position,
                visibility: step.style.visibility,
                opacity: step.style.opacity,
                pointerEvents: step.style.pointerEvents,
                transform: step.style.transform
            };
        });

        let maxH = 0;
        steps.forEach(function (step) {
            step.style.position = "static";
            step.style.visibility = "visible";
            step.style.opacity = "1";
            step.style.pointerEvents = "none";
            step.style.transform = "none";
            maxH = Math.max(maxH, step.offsetHeight);
        });

        stage.style.minHeight = maxH > 0 ? maxH + "px" : "";

        steps.forEach(function (step, i) {
            step.style.position = previous[i].position;
            step.style.visibility = previous[i].visibility;
            step.style.opacity = previous[i].opacity;
            step.style.pointerEvents = previous[i].pointerEvents;
            step.style.transform = previous[i].transform;
        });
    }

    /* Mobile reveal */
    function cwStatementRevealMobile(targets) {
        if (!targets.length || typeof gsap === "undefined") return;

        if (cwStatementReducedMotion()) {
            targets.forEach(function (el) {
                el.classList.add("is-revealed");
            });
            gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
            return;
        }

        gsap.set(targets, { autoAlpha: 0, y: CW_STATEMENT_MOBILE_REVEAL_Y });

        if (typeof IntersectionObserver === "undefined") {
            targets.forEach(function (el) {
                el.classList.add("is-revealed");
            });
            gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: "transform" });
            return;
        }

        const io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    if (entry.intersectionRatio < CW_STATEMENT_MOBILE_IO_RATIO) return;

                    const el = entry.target;
                    if (el.classList.contains("is-revealed")) return;

                    io.unobserve(el);
                    gsap.to(el, {
                        autoAlpha: 1,
                        y: 0,
                        duration: CW_STATEMENT_MOBILE_REVEAL_S,
                        ease: "power2.out",
                        overwrite: true,
                        clearProps: "transform",
                        onComplete: function () {
                            el.classList.add("is-revealed");
                            gsap.set(el, { clearProps: "all" });
                        }
                    });
                });
            },
            {
                root: null,
                /* IO — tighter reveal band */
                rootMargin: "0px 0px -12% 0px",
                threshold: [0, CW_STATEMENT_MOBILE_IO_RATIO, 0.4, 0.6]
            }
        );

        targets.forEach(function (el) {
            el.style.pointerEvents = "none";
            io.observe(el);
        });
    }

    /* Step crossfade */
    function cwStatementCrossfade(tl, outStep, inStep, at, steps, inIndex) {
        const fade = CW_STATEMENT_FADE_S;
        const ease = CW_STATEMENT_FADE_EASE;
        const overlap = fade * CW_STATEMENT_FADE_OVERLAP;

        tl.to(outStep, { autoAlpha: 0, duration: fade, ease: ease }, at).fromTo(
            inStep,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: fade, ease: ease },
            at + overlap
        );

        tl.add(function () {
            cwStatementSetActiveStep(steps, inIndex);
        }, at + fade);
    }

    /* Desktop timeline */
    function cwStatementInitDesktop(section, pinPanel, stage, steps) {
        if (!pinPanel || !stage || steps.length < 3) return null;

        cwStatementMeasureStage(stage, steps);
        cwStatementSetActiveStep(steps, 0);

        gsap.set(steps, { autoAlpha: 0, y: 0, clearProps: "transform" });
        gsap.set(steps[0], { autoAlpha: 1 });

        const hold = CW_STATEMENT_HOLD;
        const fade = CW_STATEMENT_FADE_S;
        /* Pin full section */
        const pinStart = "top " + CW_STATEMENT_NAV_OFFSET + "px";

        const tl = gsap.timeline({
            defaults: { ease: CW_STATEMENT_FADE_EASE },
            scrollTrigger: {
                trigger: section,
                start: pinStart,
                end: function () {
                    return "+=" + Math.round(window.innerHeight * CW_STATEMENT_SCROLL_VH);
                },
                pin: section,
                pinSpacing: true,
                scrub: CW_STATEMENT_SCRUB,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onToggle: function (self) {
                    section.classList.toggle("statement--pinned", self.isActive);
                    if (self.isActive) cwStatementShowHeader(section);
                }
            }
        });

        cwStatementCrossfade(tl, steps[0], steps[1], hold, steps, 1);
        cwStatementCrossfade(tl, steps[1], steps[2], hold + fade + hold, steps, 2);
        tl.to(steps[2], { autoAlpha: 1, duration: hold });
        tl.add(function () {
            gsap.set(steps, { y: 0, clearProps: "transform" });
        });

        return tl;
    }

    /* Reduced motion init */
    function cwStatementInitReduced(section, steps, actions) {
        if (typeof gsap === "undefined") return;
        steps.forEach(function (step) {
            step.classList.add("is-active");
            step.removeAttribute("aria-hidden");
        });
        gsap.set(steps, { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
        if (actions) {
            gsap.set(actions, { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
        }
    }

    /* Header */
    function cwStatementHeaderEls(section) {
        const header = section && section.querySelector(".statement__header");
        if (!header) return [];
        return Array.prototype.slice.call(header.querySelectorAll(".section-tag, .statement__title"));
    }

    function cwStatementShowHeader(section) {
        const els = cwStatementHeaderEls(section);
        if (!els.length || typeof gsap === "undefined") return;
        gsap.to(els, {
            autoAlpha: 1,
            y: 0,
            duration: CW_STATEMENT_MOBILE_REVEAL_S,
            ease: "power2.out",
            overwrite: true,
            clearProps: "transform,opacity,visibility"
        });
    }

    /* Header reveal */
    function cwStatementRevealHeader(section) {
        const els = cwStatementHeaderEls(section);
        if (!els.length || typeof gsap === "undefined") return;

        if (cwStatementReducedMotion()) {
            gsap.set(els, { autoAlpha: 1, y: 0, clearProps: "opacity,visibility,transform" });
            return;
        }

        gsap.set(els, { autoAlpha: 0, y: CW_STATEMENT_MOBILE_REVEAL_Y });

        if (typeof window.applyScrollReveal === "function") {
            window.applyScrollReveal(els, section);
            return;
        }

        cwStatementShowHeader(section);
    }

    function cwStatementScheduleRefresh() {
        if (typeof window.cwHomeScheduleScrollRefresh === "function") {
            window.cwHomeScheduleScrollRefresh();
        } else if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    }

    /* Init */
    function cwStatementInit() {
        const section = document.getElementById("statement");
        if (!section || !document.body.classList.contains("page-home")) return;
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

        const pinPanel = section.querySelector(".statement__pin-panel");
        const stage = section.querySelector(".statement__stage");
        const steps = Array.prototype.slice.call(section.querySelectorAll(".statement__step"));
        const actions = section.querySelector(".statement__actions");
        if (!pinPanel || !stage || steps.length < 3) return;

        cwStatementRevealHeader(section);

        function markReady() {
            section.classList.add("statement--story-ready");
        }

        if (cwStatementReducedMotion()) {
            cwStatementInitReduced(section, steps, actions);
            markReady();
            cwStatementScheduleRefresh();
            return;
        }

        const mm = gsap.matchMedia();

        mm.add(CW_STATEMENT_DESKTOP_MQ, function () {
            cwStatementInitDesktop(section, pinPanel, stage, steps);
            markReady();

            return function () {
                section.classList.remove("statement--pinned");
                stage.style.minHeight = "";
            };
        });

        mm.add("(max-width: 1024px)", function () {
            section.classList.remove("statement--pinned");
            stage.style.minHeight = "";
            steps.forEach(function (step) {
                step.classList.remove("is-active", "is-revealed");
                step.removeAttribute("aria-hidden");
            });
            if (actions) actions.classList.remove("is-revealed");
            gsap.set(steps, { autoAlpha: 0, y: CW_STATEMENT_MOBILE_REVEAL_Y });
            if (actions) gsap.set(actions, { autoAlpha: 0, y: CW_STATEMENT_MOBILE_REVEAL_Y });
            markReady();
            cwStatementRevealMobile(steps);
            if (actions) cwStatementRevealMobile([actions]);
        });

        requestAnimationFrame(function () {
            cwStatementScheduleRefresh();
        });
    }

    document.addEventListener("DOMContentLoaded", cwStatementInit);

    /* Load — remeasure stage */
    window.addEventListener(
        "load",
        function () {
            const section = document.getElementById("statement");
            if (section && window.matchMedia(CW_STATEMENT_DESKTOP_MQ).matches) {
                cwStatementMeasureStage(
                    section.querySelector(".statement__stage"),
                    Array.prototype.slice.call(section.querySelectorAll(".statement__step"))
                );
            }
            if (typeof ScrollTrigger !== "undefined") cwStatementScheduleRefresh();
        },
        { once: true }
    );
})();
