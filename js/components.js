/* ==========================================================================
   Shared components
   Nav and footer partials, i18n paths, active link state
   ========================================================================== */
(() => {
  "use strict";

  const CW_ASSET_VERSION = "20261019-2";

  /* Nav section pages */
  const CW_PRODUCT_MENU_PAGES = new Set([
    "newsletter.html",
    "pulse.html",
    "evaluacion.html",
  ]);

  const CW_PUBLICATIONS_MENU_PAGES = new Set([
    "informes.html",
    "informe.html",
    "perspectivas.html",
    "perspectiva.html",
    "casos.html",
    "caso.html",
  ]);

  /* Debug logging */
  function cwShouldLogComponentErrors() {
    try {
      const loc = window.location;
      if (!loc) return false;
      const h = (loc.hostname || "").toLowerCase();
      if (h === "localhost" || h === "127.0.0.1") return true;
      if (/\bcwDebug=1\b/.test(loc.search || "")) return true;
      if (typeof localStorage !== "undefined" && localStorage.getItem("cw_debug") === "1") return true;
    } catch (_) {
      /* ignore */
    }
    return false;
  }

  /* Fetch */
  async function loadPartial(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`Failed to load ${path}`);
    return await r.text();
  }

  /* I18n */
  function fallbackPageName() {
    const segments = (window.location.pathname || "").replace(/\\/g, "/").split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    if (!last || last === "en" || last === "es") return "index.html";
    return last.indexOf(".") === -1 ? last + ".html" : last;
  }

  function cwI18n() {
    return window.CW_I18N || {
      locale: "es",
      rootPrefix: "",
      pageName: fallbackPageName(),
      t: function (key) { return key; },
      rootPath: function (path) { return path; },
      localizedPageUrl: function (page) { return page; },
      preserveState: function (url) { return url; }
    };
  }

  function rewriteComponentRootPaths(root) {
    if (!root) return;
    const i18n = cwI18n();
    const attrs = ["href", "src"];

    attrs.forEach(function (attr) {
      root.querySelectorAll("[" + attr + "]").forEach(function (el) {
        const value = el.getAttribute(attr);
        if (!value || !/^(assets|css|js)\//.test(value)) return;
        el.setAttribute(attr, i18n.rootPath(value));
      });
    });
  }

  function prepareComponentHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    rewriteComponentRootPaths(template.content);
    return template.innerHTML;
  }

  /* Nav state */
  function initLanguageSwitch(root) {
    if (!root) return;
    const i18n = cwI18n();
    const currentPage = i18n.pageName || window.location.pathname.split("/").pop() || "index.html";

    root.querySelectorAll("[data-lang-target]").forEach(function (a) {
      const targetLocale = a.getAttribute("data-lang-target");
      if (!targetLocale) return;
      const href = i18n.preserveState(i18n.localizedPageUrl(currentPage, targetLocale));
      a.setAttribute("href", href);
      a.classList.toggle("is-active", targetLocale === i18n.locale);
      if (targetLocale === i18n.locale) {
        a.setAttribute("aria-current", "true");
      } else if (a.getAttribute("aria-current") === "true") {
        a.removeAttribute("aria-current");
      }
    });
  }

  function markActiveLinks(root, currentPage) {
    if (!root) return;

    const anchors = root.querySelectorAll("a[href]");
    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (a.hasAttribute("data-lang-target")) return;
      const hrefBase = href.split("?")[0].toLowerCase().replace(/\.html$/, "");
      const pageBase = (currentPage || "").split("?")[0].toLowerCase().replace(/\.html$/, "");
      if (hrefBase === pageBase) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else {
        a.classList.remove("active");
        if (a.getAttribute("aria-current") === "page") a.removeAttribute("aria-current");
      }
    });
  }

  function markNavGroup(root, currentPage, triggerSelector, pages, pagePatterns) {
    if (!root) return;
    const page = (currentPage || "").toLowerCase();
    const inSection = pages.has(page) || (pagePatterns || []).some(function (pattern) {
      return pattern.test(page);
    });

    const trigger = root.querySelector(triggerSelector);
    if (trigger) {
      trigger.classList.toggle("active", inSection);
      if (inSection) {
        trigger.setAttribute("aria-current", "true");
      } else if (trigger.getAttribute("aria-current") === "true") {
        trigger.removeAttribute("aria-current");
      }
    }
  }

  /* Inject */
  async function injectComponents() {
    const i18n = cwI18n();
    const currentPage = i18n.pageName || fallbackPageName();
    const partialSuffix = i18n.locale === "en" ? ".en" : "";

    const navHost = document.querySelector('[data-component="nav"]');
    const footerHost = document.querySelector('[data-component="footer"]');

    const tasks = [];
    /* InnerHTML keeps placeholder spacer height for fixed nav */
    if (navHost) {
      tasks.push(loadPartial(i18n.rootPath("partials/nav" + partialSuffix + ".html?v=" + CW_ASSET_VERSION)).then((html) => (navHost.innerHTML = prepareComponentHtml(html))));
    }
    if (footerHost) {
      tasks.push(loadPartial(i18n.rootPath("partials/footer" + partialSuffix + ".html?v=" + CW_ASSET_VERSION)).then((html) => (footerHost.innerHTML = prepareComponentHtml(html))));
    }

    if (tasks.length === 0) {
      window.dispatchEvent(new CustomEvent("cw:componentsReady", { detail: { currentPage } }));
      return;
    }

    await Promise.all(tasks);

    const navRoot = document.querySelector('[data-component-root="nav"]');
    const footerRoot = document.querySelector('[data-component-root="footer"]');
    rewriteComponentRootPaths(navRoot);
    rewriteComponentRootPaths(footerRoot);
    initLanguageSwitch(navRoot);
    markActiveLinks(navRoot, currentPage);
    markNavGroup(navRoot, currentPage, "#productos-trigger.nav__dropdown-trigger", CW_PRODUCT_MENU_PAGES);
    markNavGroup(navRoot, currentPage, "#publicaciones-trigger.nav__dropdown-trigger", CW_PUBLICATIONS_MENU_PAGES, [/^caso-[a-z0-9-]+\.html$/]);

    /* Fixed nav on body — backdrop-filter needs no wrapper */
    const skipLink = navHost ? navHost.querySelector(".skip-link") : null;
    if (navRoot && navRoot.parentElement !== document.body) {
      document.body.insertBefore(navRoot, document.body.firstChild);
    }
    if (skipLink && skipLink.parentElement !== document.body) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    const nav = document.getElementById("main-nav");
    if (nav) {
      nav.style.opacity = "1";
      nav.style.visibility = "visible";
      nav.style.transform = "none";
      if (typeof gsap !== "undefined") {
        gsap.set(nav, { clearProps: "all" });
      }
    }

    window.dispatchEvent(new CustomEvent("cw:componentsReady", { detail: { currentPage } }));
  }

  /* Boot — runs before main.js (defer, earlier script tag) */
  injectComponents().catch((err) => {
    if (cwShouldLogComponentErrors()) {
      console.warn("[Chanwe components] nav/footer inject failed:", err);
    }
  });
})();
