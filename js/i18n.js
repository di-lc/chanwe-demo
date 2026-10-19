/* ==========================================================================
   I18n
   Locale detection, paths, UI strings, and canonical URLs
   ========================================================================== */
(function () {
  "use strict";

  /* Config */
  var SUPPORTED = ["es", "en"];
  var DEFAULT_LOCALE = "es";
  var SITE_ORIGIN = "";

  /* Path and locale
     Supports site roots like / and GitHub Pages /chanwe-demo/ — locale may be
     the 2nd path segment, not the first. */
  function pathSegments() {
    return (window.location.pathname || "")
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean);
  }

  function localeFolderIndex() {
    var segments = pathSegments();
    for (var i = 0; i < segments.length; i++) {
      if (SUPPORTED.indexOf(segments[i].toLowerCase()) !== -1) return i;
    }
    return -1;
  }

  function currentPageName() {
    var segments = pathSegments();
    var idx = localeFolderIndex();
    // Page path after /es|en/, or after the deploy root (/chanwe-demo/…).
    var candidates = idx >= 0 ? segments.slice(idx + 1) : segments.slice();
    if (!candidates.length) return "index.html";

    var last = candidates[candidates.length - 1] || "";
    if (!last || SUPPORTED.indexOf(last.toLowerCase()) !== -1) return "index.html";
    if (last.indexOf(".") !== -1) return last;
    // Clean product URLs only; a bare folder name (repo root) is the home page.
    if (/^(?:pulse|evaluacion)$/i.test(last)) return last + ".html";
    return "index.html";
  }

  function detectLocale() {
    var explicit = document.documentElement.getAttribute("lang") ||
      (document.body && document.body.getAttribute("data-locale")) ||
      "";
    explicit = explicit.toLowerCase().slice(0, 2);
    if (SUPPORTED.indexOf(explicit) !== -1) return explicit;

    var idx = localeFolderIndex();
    if (idx >= 0) return pathSegments()[idx].toLowerCase();
    return DEFAULT_LOCALE;
  }

  /** Absolute site base ending with /, e.g. "/" or "/chanwe-demo/". */
  function siteBasePath() {
    var segments = pathSegments();
    var idx = localeFolderIndex();
    var baseSegs;
    if (idx >= 0) {
      baseSegs = segments.slice(0, idx);
    } else {
      baseSegs = segments.slice();
      var last = baseSegs[baseSegs.length - 1] || "";
      if (last && (/\.html?$/i.test(last) || /^(?:pulse|evaluacion)$/i.test(last))) {
        baseSegs.pop();
      }
    }
    return baseSegs.length ? "/" + baseSegs.join("/") + "/" : "/";
  }

  var locale = detectLocale();
  var localeIdx = localeFolderIndex();
  var pathSegment = localeIdx >= 0 ? pathSegments()[localeIdx].toLowerCase() : "";
  var isLocaleFolder = localeIdx >= 0;
  var rootPrefix = isLocaleFolder ? "../" : "";
  var siteBase = siteBasePath();

  var pageName = currentPageName();

  function isExternalPath(path) {
    return /^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(String(path || ""));
  }

  function rootPath(path) {
    path = String(path || "");
    if (!path || isExternalPath(path) || path.indexOf("../") === 0) return path;
    return rootPrefix + path;
  }

  function dataPath(path) {
    path = String(path || "").replace(/^data\//, "");
    return rootPrefix + (locale === "en" ? "data/en/" : "data/") + path;
  }

  /* UI strings */
  var STRINGS = {
    es: {
      navHomeAria: "Chanwe Inicio",
      mainNavAria: "Navegación Principal",
      products: "Productos",
      home: "Inicio",
      methodology: "Metodología",
      services: "Servicios",
      assessment: "Pulse",
      newsletter: "Newsletter",
      pulse: "Cerebro",
      insights: "Perspectivas",
      reports: "Informes",
      mySpace: "Mi Espacio",
      contact: "Contacto",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
      location: "Ubicación",
      privacy: "Privacidad",
      terms: "Términos",
      social: "Redes Sociales",
      copyright: "© 2026 Chanwe. Todos los derechos reservados.",
      all: "Todos",
      readMore: "Leer más",
      fullCase: "Ver el caso completo",
      downloadPdf: "Descargar PDF",
      download: "Descargar",
      public: "Público",
      clients: "Clientes",
      view: "Ver",
      viewReport: "Ver informe",
      privateDownload: "Descarga disponible para clientes",
      privateReport: "Este informe está disponible solo para clientes.",
      availableClients: "(Disponible para clientes)",
      previous: "Anterior",
      next: "Siguiente",
      page: "Página",
      pagesShort: "págs.",
      pagesLong: "páginas",
      noCases: "No se encontraron casos para los filtros seleccionados.",
      noInsights: "No se encontraron perspectivas para los filtros seleccionados.",
      noReports: "No se encontraron informes para los filtros seleccionados.",
      listingResultSingular: "resultado",
      listingResultPlural: "resultados",
      listingResultsNone: "0 resultados",
      caseLoadError: "No se pudo cargar el caso.",
      casesLoadError: "No se pudieron cargar los casos.",
      caseMissing: "Caso no encontrado.",
      insightLoadError: "No se pudo cargar la perspectiva.",
      insightsLoadError: "No se pudieron cargar las perspectivas.",
      insightMissing: "Perspectiva no encontrada. Falta el parámetro ?slug=",
      reportLoadError: "No se pudo cargar el informe.",
      reportsLoadError: "No se pudieron cargar los informes.",
      reportMissing: "Informe no encontrado. Falta el parámetro ?slug=",
      reportCarouselAria: "Navegar informes",
      caseCarouselAria: "Navegar casos",
      carouselSlide: "Diapositiva",
      carouselRoleDescription: "carrusel",
      servicesCarouselAria: "Líneas de servicio",
      assessmentStep: "Evaluación",
      of: "de",
      hidePassword: "Ocultar contraseña",
      showPassword: "Mostrar contraseña",
      newsletterThanks: "Gracias. El envío estará disponible próximamente.",
      fieldRequired: "Completá este campo.",
      fieldEmailInvalid: "Ingresá un email válido.",
      fieldInvalid: "Revisá el valor ingresado.",
      fieldSelectRequired: "Seleccioná una opción.",
      formInvalidSummary: "Revisá los campos marcados.",
      assessmentEmailInvalid: "Ingresá un email válido para recibir tu diagnóstico.",
      contactBodyName: "Nombre",
      contactBodyPhone: "Teléfono",
      contactBodyCompany: "Empresa",
      contactBodySubject: "Asunto",
      contactBodyMessage: "Mensaje",
      contactTrimmed: "[mensaje recortado por límite del cliente de correo]"
    },
    en: {
      navHomeAria: "Chanwe Home",
      mainNavAria: "Main Navigation",
      products: "Products",
      home: "Home",
      methodology: "Methodology",
      services: "Services",
      assessment: "Pulse",
      newsletter: "Newsletter",
      pulse: "Cerebro",
      insights: "Insights",
      reports: "Reports",
      mySpace: "My Space",
      contact: "Contact",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      location: "Location",
      privacy: "Privacy",
      terms: "Terms",
      social: "Social Media",
      copyright: "© 2026 Chanwe. All rights reserved.",
      all: "All",
      readMore: "Read more",
      fullCase: "View full case",
      downloadPdf: "Download PDF",
      download: "Download",
      public: "Public",
      clients: "Clients",
      view: "View",
      viewReport: "View report",
      privateDownload: "Download available to clients",
      privateReport: "This report is available to clients only.",
      availableClients: "(Available to clients)",
      previous: "Previous",
      next: "Next",
      page: "Page",
      pagesShort: "pp.",
      pagesLong: "pages",
      noCases: "No case studies matched the selected filters.",
      noInsights: "No insights matched the selected filters.",
      noReports: "No reports matched the selected filters.",
      listingResultSingular: "result",
      listingResultPlural: "results",
      listingResultsNone: "0 results",
      caseLoadError: "The case study could not be loaded.",
      casesLoadError: "The case studies could not be loaded.",
      caseMissing: "Case study not found.",
      insightLoadError: "The insight could not be loaded.",
      insightsLoadError: "The insights could not be loaded.",
      insightMissing: "Insight not found. Missing ?slug= parameter.",
      reportLoadError: "The report could not be loaded.",
      reportsLoadError: "The reports could not be loaded.",
      reportMissing: "Report not found. Missing ?slug= parameter.",
      reportCarouselAria: "Navigate reports",
      caseCarouselAria: "Navigate case studies",
      carouselSlide: "Slide",
      carouselRoleDescription: "carousel",
      servicesCarouselAria: "Service lines",
      assessmentStep: "Assessment",
      of: "of",
      hidePassword: "Hide password",
      showPassword: "Show password",
      newsletterThanks: "Thank you. Submissions will be available soon.",
      fieldRequired: "Please fill in this field.",
      fieldEmailInvalid: "Please enter a valid email address.",
      fieldInvalid: "Please check the value entered.",
      fieldSelectRequired: "Please select an option.",
      formInvalidSummary: "Please review the highlighted fields.",
      assessmentEmailInvalid: "Enter a valid email to receive your assessment.",
      contactBodyName: "Name",
      contactBodyPhone: "Phone",
      contactBodyCompany: "Company",
      contactBodySubject: "Subject",
      contactBodyMessage: "Message",
      contactTrimmed: "[message shortened because of email-client length limits]"
    }
  };

  /* Translation */
  function t(key) {
    return (STRINGS[locale] && STRINGS[locale][key]) ||
      (STRINGS[DEFAULT_LOCALE] && STRINGS[DEFAULT_LOCALE][key]) ||
      key;
  }

  /* URLs and meta */
  function localizedPageUrl(page, targetLocale) {
    page = page || pageName || "index.html";
    targetLocale = targetLocale || locale;

    var cleanProductPage = /^(?:pulse|evaluacion)\.html$/i.test(page)
      ? page.replace(/\.html$/i, "")
      : "";

    if (cleanProductPage) {
      if (targetLocale === "en") return siteBase + "en/" + cleanProductPage;
      return siteBase + cleanProductPage;
    }

    if (targetLocale === "en") {
      if (locale === "en") return page;
      if (pathSegment === "es") return "../en/" + page;
      return "en/" + page;
    }

    if (targetLocale === "es") {
      if (locale === "es" && pathSegment === "es") return page;
      // Primary Spanish lives at site root; /es/ is the mirrored folder.
      if (locale === "en") return "../" + page;
      return "es/" + page;
    }

    return page;
  }

  function preserveState(url) {
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    if (search && url.indexOf("?") === -1) url += search;
    if (hash && url.indexOf("#") === -1) url += hash;
    return url;
  }

  function canonicalUrl(page, targetLocale, params) {
    page = page || pageName || "index.html";
    targetLocale = targetLocale || locale;
    var base = SITE_ORIGIN + "/" + targetLocale + "/";
    var url = page === "index.html" ? base : base + page;
    if (params) {
      var qs = new URLSearchParams();
      Object.keys(params).forEach(function (key) {
        if (params[key] != null && params[key] !== "") qs.set(key, params[key]);
      });
      var s = qs.toString();
      if (s) url += "?" + s;
    }
    return url;
  }

  function setAlternateLinks(page, params) {
    page = page || pageName || "index.html";
    var entries = [
      ["es", canonicalUrl(page, "es", params)],
      ["en", canonicalUrl(page, "en", params)],
      ["x-default", canonicalUrl(page, DEFAULT_LOCALE, params)]
    ];

    entries.forEach(function (entry) {
      var lang = entry[0];
      var href = entry[1];
      var el = document.querySelector('link[rel="alternate"][hreflang="' + lang + '"]');
      if (!el) {
        el = document.createElement("link");
        el.rel = "alternate";
        el.hreflang = lang;
        document.head.appendChild(el);
      }
      el.href = href;
    });
  }

  function setCanonicalMeta(page, params) {
    var url = canonicalUrl(page, locale, params);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = url;
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", url);
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", locale);
    setAlternateLinks(page, params);
    return url;
  }

  /* Public API */
  window.CW_I18N = {
    locale: locale,
    defaultLocale: DEFAULT_LOCALE,
    supported: SUPPORTED.slice(),
    rootPrefix: rootPrefix,
    pageName: pageName,
    t: t,
    rootPath: rootPath,
    assetPath: rootPath,
    dataPath: dataPath,
    localizedPageUrl: localizedPageUrl,
    preserveState: preserveState,
    canonicalUrl: canonicalUrl,
    setCanonicalMeta: setCanonicalMeta,
    setAlternateLinks: setAlternateLinks
  };
})();
