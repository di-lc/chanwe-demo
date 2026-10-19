/* ==========================================================================
   Servicios page
   Hero + service blocks + CTA motion
   Depends: GSAP, ScrollTrigger, main.js
   ========================================================================== */

(function () {
    "use strict";

    /* Page guard */
    function cwIsServiciosPage() {
        if (document.body && document.body.classList.contains("page-servicios")) return true;
        const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
        if (path.endsWith("servicios.html")) return true;
        if (path.includes("/servicios.html")) return true;
        if (path.endsWith("/servicios") || path.endsWith("/servicios/")) return true;
        const href = (window.location.href || "").toLowerCase();
        if (href.includes("servicios.html")) return true;
        return false;
    }

    if (!cwIsServiciosPage()) return;

    /* Scroll reveal */
    function cwServiciosRevealTargets(targets, triggerEl, opts) {
        if (!targets.length || !window.gsap) return;

        if (window.cwPrefersReducedMotion && window.cwPrefersReducedMotion()) {
            gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: "transform,opacity,visibility" });
            return;
        }

        const m = window.cwMotion || {};
        const duration =
            typeof opts.duration === "number"
                ? opts.duration
                : typeof m.durationEmphasis === "number"
                  ? m.durationEmphasis + 0.12
                  : 0.9;
        const ease = opts.ease || m.easeEmphasis || m.easeOutSoft || "power3.out";
        const fromY = typeof opts.fromY === "number" ? opts.fromY : 32;

        gsap.set(targets, { autoAlpha: 0, y: fromY });

        let done = false;
        const run = function () {
            if (done) return;
            done = true;
            gsap.to(targets, {
                autoAlpha: 1,
                y: 0,
                duration: duration,
                ease: ease,
                stagger: 0,
                overwrite: true,
                clearProps: "transform,opacity,visibility",
            });
        };

        const vh = window.innerHeight || 800;
        const r = triggerEl.getBoundingClientRect();
        if (r.top < vh * 0.92) {
            run();
            return;
        }

        if (typeof ScrollTrigger === "undefined") {
            run();
            return;
        }

        ScrollTrigger.create({
            trigger: triggerEl,
            start: "top 86%",
            once: true,
            onEnter: run,
        });
    }

    /* Section reveal */
    function cwServiciosRevealSection(section, opts) {
        if (!section || section.getAttribute("data-cw-servicios-reveal")) return;

        const targets = [
            section.querySelector(".cw-services__title-row"),
            section.querySelector(".cw-services__copy"),
            section.querySelector(".cw-services__includes"),
        ].filter(function (el) {
            return el && el.nodeType === 1;
        });
        if (!targets.length) return;

        section.setAttribute("data-cw-servicios-reveal", "1");
        cwServiciosRevealTargets(targets, section, opts);
    }

    /* Init */
    document.addEventListener("DOMContentLoaded", function () {
        const root = document.getElementById("servicios-content");
        if (!root || !window.gsap) return;

        /* Hero */
        if (typeof window.applyScrollReveal === "function") {
            const heroTargets = root.querySelectorAll(
                ".cw-services__hero .section-tag, .cw-services__hero .page-title, .cw-services__hero .page-lead, .cw-services__hero .cw-services__divider"
            );
            const hero = root.querySelector(".cw-services__hero");
            if (heroTargets.length && hero) window.applyScrollReveal(heroTargets, hero);
        }

        /* Service sections */
        root.querySelectorAll(".cw-services__section").forEach(function (section) {
            cwServiciosRevealSection(section, { fromY: 32 });
        });

        /* Final CTA */
        const finalCtaInner = root.querySelector(".cw-services__final-cta-inner");
        if (finalCtaInner) {
            cwServiciosRevealTargets([finalCtaInner], finalCtaInner.closest(".cw-services__final-cta") || finalCtaInner, {
                fromY: 24,
            });
        }
    });
})();
