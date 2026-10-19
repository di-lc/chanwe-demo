/* ==========================================================================
   Metodologia page
   Scroll reveal + final CTA + mobile swipe accordion
   ========================================================================== */

(function () {
    "use strict";

    function cwIsMetodologiaPage() {
        if (document.body && document.body.classList.contains("page-metodologia")) return true;
        const path = (window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
        if (path.endsWith("metodologia.html")) return true;
        if (path.includes("/metodologia.html")) return true;
        if (path.endsWith("/metodologia") || path.endsWith("/metodologia/")) return true;
        const href = (window.location.href || "").toLowerCase();
        if (href.includes("metodologia.html")) return true;
        return false;
    }

    if (!cwIsMetodologiaPage()) return;

    const METODOLOGIA_REVEAL_SELECTOR = [
        ".section-tag",
        ".page-title",
        ".page-lead",
        "h1",
        "h2",
        "h3",
        "[class$='__divider']",
        ".cw-metodologia__body",
        ".cw-metodologia__cycle > li",
        ".cw-metodologia__framework-note",
        ".cw-metodologia__closing-text",
    ].join(", ");

    function cwIsMobileCycle() {
        try {
            return window.matchMedia("(max-width: 768px)").matches;
        } catch (_) {
            return false;
        }
    }

    /* Mobile: progress dots for the finger-swipe accordion */
    function cwInitCycleSwipeDots() {
        const unit = document.querySelector(".cw-metodologia__cycle-unit");
        const pin = document.querySelector(".cw-metodologia__cycle-pin");
        const track = document.querySelector(".cw-metodologia__cycle");
        if (!unit || !pin || !track) return;

        const steps = Array.prototype.slice.call(track.querySelectorAll(":scope > li"));
        if (steps.length < 2) return;

        let progress = unit.querySelector(".cw-metodologia__cycle-progress");
        if (!progress) {
            progress = document.createElement("div");
            progress.className = "cw-metodologia__cycle-progress";
            progress.setAttribute("aria-hidden", "true");
            steps.forEach(function (_, i) {
                const dot = document.createElement("span");
                dot.className = "cw-metodologia__cycle-progress-dot";
                if (i === 0) dot.classList.add("is-active");
                progress.appendChild(dot);
            });
            unit.insertBefore(progress, unit.querySelector(".cw-metodologia__framework-note"));
        }

        const dots = Array.prototype.slice.call(
            progress.querySelectorAll(".cw-metodologia__cycle-progress-dot")
        );

        function syncDots() {
            if (!cwIsMobileCycle()) return;
            const card = steps[0];
            const step = card ? card.getBoundingClientRect().width + 12 : pin.clientWidth;
            const idx = Math.min(
                steps.length - 1,
                Math.max(0, Math.round(pin.scrollLeft / Math.max(1, step)))
            );
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === idx);
            });
        }

        pin.addEventListener("scroll", syncDots, { passive: true });
        window.addEventListener("resize", syncDots, { passive: true });
        syncDots();
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (typeof window.applyScrollReveal === "function") {
            const root = document.getElementById("metodologia-content");
            if (root) {
                const candidates = root.querySelectorAll(METODOLOGIA_REVEAL_SELECTOR);
                const revealNodes = Array.prototype.slice.call(candidates).filter(function (el) {
                    if (el.closest(".cw-metodologia__final-cta-inner")) return false;
                    if (
                        el.closest(".cw-metodologia__framework-note") &&
                        !el.classList.contains("cw-metodologia__framework-note")
                    ) {
                        return false;
                    }
                    return true;
                });
                if (revealNodes.length) window.applyScrollReveal(revealNodes, root);

                const finalCta = root.querySelector(".cw-metodologia__final-cta-inner");
                if (finalCta) window.applyScrollReveal([finalCta], finalCta);
            }
        }

        cwInitCycleSwipeDots();
    });
})();
