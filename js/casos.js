/* ==========================================================================
   Casos page
   Listing, filters, carousel, and detail from casos/index.json
   ========================================================================== */
(function () {
    'use strict';

    /* Config */
    const CW_I18N = window.CW_I18N || {
        t: function (key) { return key; },
        assetPath: function (path) { return path; },
        dataPath: function (path) { return 'data/' + path; },
        pageName: '',
        setCanonicalMeta: function () {}
    };

    const CASOS_MOBILE_MQ = '(max-width: 1024px)';
    const CAROUSEL_DESKTOP_PAGE = window.CW_CAROUSEL_DESKTOP_PAGE || 2;
    const POSTS_PER_PAGE = 6;
    /* Flat listing pages (slice before category groups). Set true to enable. */
    const LISTING_PAGINATION_ENABLED = false;

    const CATEGORIA_ORDER_ES = [
        'Estrategia y Negocio',
        'Datos e Inteligencia',
        'Tecnología que Potencia',
        'Optimización Financiera y Capital de Trabajo',
        'Evolución Organizacional'
    ];

    const CATEGORIA_ORDER_EN = [
        'Strategy and Business',
        'Data and Intelligence',
        'Enabling technology',
        'Financial Optimization and Working Capital',
        'Organizational Evolution'
    ];

    /* Slug and routing */
    function buildCasosSectionHeader(cat) {
        return '<header class="casos__section-header">'
            + '<h2 class="casos__section-title">' + escapeHtml(cat) + '</h2>'
            + '</header>';
    }

    function getCategoriaOrder() {
        return CW_I18N.locale === 'en' ? CATEGORIA_ORDER_EN : CATEGORIA_ORDER_ES;
    }

    function casePage(slug) {
        return 'caso-' + String(slug || '').trim() + '.html';
    }

    function isStaticCasePage(pageName) {
        return /^caso-[a-z0-9-]+\.html$/i.test(String(pageName || ''));
    }

    function getSlugParam() {
        if (document.body) {
            const bodySlug = document.body.getAttribute('data-caso-slug');
            if (bodySlug) return bodySlug;
        }

        const qs = new URLSearchParams(window.location.search).get('slug');
        if (qs) return qs;

        const hash = window.location.hash;
        if (hash && hash.length > 1) return decodeURIComponent(hash.slice(1));

        try {
            const stored = sessionStorage.getItem('cw_caso_slug');
            if (stored) { sessionStorage.removeItem('cw_caso_slug'); return stored; }
        } catch (e) { /* private browsing */ }

        const page = CW_I18N.pageName || '';
        if (isStaticCasePage(page)) return page.replace(/^caso-/, '').replace(/\.html$/i, '');

        return null;
    }

    /* State */
    let _casosCache = null;
    let _fetchPromise = null;
    let _filters = { categoria: '', query: '' };
    let _page = 1;
    let _casosCarousels = [];
    let _announceListingResults = false;

    function sidebarPressedAttr(isActive) {
        return window.cwSidebarPressedAttr
            ? window.cwSidebarPressedAttr(isActive)
            : (' aria-pressed="' + (isActive ? 'true' : 'false') + '"');
    }

    function announceListingCount(count) {
        if (!_announceListingResults || typeof window.cwAnnounceListingResults !== 'function') return;
        window.cwAnnounceListingResults(
            document.getElementById('container-casos'),
            count
        );
    }

    function markListingFiltersChanged() {
        _announceListingResults = true;
    }

    /* Markdown parsers */
    function parseFrontMatter(rawText) {
        const text = String(rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        if (!match) return { meta: {}, body: text };

        const meta = {};
        match[1].split('\n').forEach(function (line) {
            if (!line.trim() || line.trim().charAt(0) === '#') return;
            const colonIdx = line.indexOf(':');
            if (colonIdx === -1) return;
            const key = line.slice(0, colonIdx).trim();
            let val = line.slice(colonIdx + 1).trim();
            if (!key) return;
            if (val.charAt(0) === '[' && val.charAt(val.length - 1) === ']') {
                meta[key] = val.slice(1, -1).split(',')
                    .map(function (v) { return v.trim().replace(/^["']|["']$/g, ''); })
                    .filter(Boolean);
            } else {
                meta[key] = val.replace(/^["']|["']$/g, '');
            }
        });

        return { meta: meta, body: match[2] || '' };
    }

    function normalizeHeading(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    const CASE_SECTION_MAP = {
        'contexto': 'contexto',
        'context': 'contexto',
        'problema': 'problema',
        'problem': 'problema',
        'solucion': 'solucion',
        'solution': 'solucion',
        'resultado': 'resultado',
        'result': 'resultado'
    };

    function parseCaseBodySections(body) {
        const sections = { contexto: '', problema: '', solucion: '', resultado: '' };
        const text = String(body || '');
        const headingRe = /^##[ \t]+([^\n]+)/gm;
        const headings = [];
        let match;

        while ((match = headingRe.exec(text)) !== null) {
            headings.push({ text: match[1].trim(), index: match.index, end: headingRe.lastIndex });
        }

        if (headings.length === 0) {
            sections.contexto = text.trim();
            return sections;
        }

        headings.forEach(function (heading, i) {
            const contentStart = heading.end;
            const contentEnd = i + 1 < headings.length ? headings[i + 1].index : text.length;
            const content = text.slice(contentStart, contentEnd).trim();
            const normalized = normalizeHeading(heading.text);
            let key = CASE_SECTION_MAP[normalized];

            if (!key) {
                Object.keys(CASE_SECTION_MAP).some(function (candidate) {
                    if (normalized.indexOf(candidate) !== -1) {
                        key = CASE_SECTION_MAP[candidate];
                        return true;
                    }
                    return false;
                });
            }

            if (key) {
                sections[key] += (sections[key] ? '\n\n' : '') + content;
            }
        });

        return sections;
    }

    /* Fetch */
    function fetchJsonCasosFallback() {
        return fetch(CW_I18N.dataPath('casos.json'))
            .then(function (r) {
                if (!r.ok) throw new Error(CW_I18N.dataPath('casos.json'));
                return r.json();
            });
    }

    function fetchCasos() {
        if (_casosCache) return Promise.resolve(_casosCache);
        if (_fetchPromise) return _fetchPromise;

        _fetchPromise = fetch(CW_I18N.dataPath('casos/index.json'))
            .then(function (r) {
                if (!r.ok) {
                    if (r.status === 404) return fetchJsonCasosFallback();
                    throw new Error(CW_I18N.dataPath('casos/index.json'));
                }
                return r.json();
            })
            .then(function (data) {
                if (!Array.isArray(data) || (data[0] && typeof data[0] === 'object')) {
                    return data;
                }

                return Promise.all(data.map(function (slug) {
                    return fetch(CW_I18N.dataPath('casos/' + slug + '.md'))
                        .then(function (r) {
                            if (!r.ok) throw new Error(CW_I18N.dataPath('casos/' + slug + '.md'));
                            return r.text();
                        })
                        .then(function (text) {
                            const parsed = parseFrontMatter(text);
                            const sections = parseCaseBodySections(parsed.body);
                            return Object.assign({}, parsed.meta, sections, { slug: parsed.meta.slug || slug, _body: parsed.body });
                        });
                }));
            })
            .then(function (casos) {
                _casosCache = casos;
                return casos;
            });

        return _fetchPromise;
    }

    /* Utilities */
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function scrollToCasosMain() {
        if (!window.matchMedia(CASOS_MOBILE_MQ).matches) return;
        const main = document.querySelector('#casos-listagem .cw-casos__main');
        if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* Cards */
    function buildCaseCard(c, opts) {
        const slideClass = opts && opts.slide ? ' cw-carousel__slide' : '';
        const imgStyle = c.fotoStyle ? ' style="' + c.fotoStyle + '"' : '';
        const sectorHtml = (c.tag || '').trim()
            ? ('        <span class="case-card__sector">' + escapeHtml(c.tag) + '</span>')
            : '';
        const excerptHtml = (c.excerpt || '').trim()
            ? ('      <p class="case-card__text-body">' + escapeHtml(c.excerpt) + '</p>')
            : '';

        return [
            '<a href="' + escapeHtml(casePage(c.slug)) + '" class="case-card case-card--listing' + slideClass + '" data-slug="' + escapeHtml(c.slug) + '" onclick="try{sessionStorage.setItem(\'cw_caso_slug\',\'' + escapeHtml(c.slug) + '\')}catch(e){}">',
            '  <div class="case-card__img-container">',
            '    <img src="' + escapeHtml(CW_I18N.assetPath(c.foto)) + '" alt="" class="case-card__img"' + imgStyle + ' loading="lazy">',
            '  </div>',
            '  <div class="case-card__footer">',
            '    <div class="case-card__footer-top">',
            '      <div class="case-card__meta">',
            sectorHtml,
            '        <span class="case-card__location">' + escapeHtml(c.ubicacion || '') + '</span>',
            '      </div>',
            '    </div>',
            '    <div class="case-card__content">',
            '      <h3 class="case-card__h3 case-card__h3--highlight">' + escapeHtml(c.highlight || '') + '</h3>',
            '      <h4 class="case-card__h4">' + escapeHtml(c.subtitulo || '') + '</h4>',
            excerptHtml,
            '      <span class="text-link case-card__btn">',
            '        ' + escapeHtml(CW_I18N.t('fullCase')),
            '        <img src="' + escapeHtml(CW_I18N.assetPath('assets/01-icons/chanwe-icons/chanwe-icon-arrow-upright-red.svg')) + '" alt="" class="text-link__icon">',
            '      </span>',
            '    </div>',
            '  </div>',
            '</a>'
        ].join('\n');
    }

    /* Carousel — shared module (js/carousel.js) */
    function initCasosCarousels(root) {
        if (typeof window.cwInitListingCarousels !== 'function') return;
        _casosCarousels = window.cwInitListingCarousels(root, {
            mobileMq: CASOS_MOBILE_MQ,
            desktopPage: CAROUSEL_DESKTOP_PAGE
        });
    }

    function bindCasosCarouselMq() {
        if (typeof window.cwBindListingCarouselMq === 'function') {
            window.cwBindListingCarouselMq(_casosCarousels, CASOS_MOBILE_MQ);
        }
    }

    /* Filters */
    function getFiltered(all) {
        const q = (_filters.query || '').trim().toLowerCase();
        return all.filter(function (c) {
            if (_filters.categoria && (c.categoria || '') !== _filters.categoria) return false;
            if (q) {
                const hay = [
                    c.subtitulo,
                    c.highlight,
                    c.excerpt,
                    c.tag,
                    c.ubicacion,
                    c.categoria,
                    c.sector
                ].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }

    /* Listing */
    function applyCasosListingReveal(container) {
        if (!window.applyScrollReveal || !container) return;

        const mobile = window.matchMedia(CASOS_MOBILE_MQ).matches;

        if (mobile) {
            container.querySelectorAll('.casos__category').forEach(function (categoryEl) {
                const header = categoryEl.querySelector('.casos__section-header');
                const carousel = categoryEl.querySelector('.cw-carousel');
                const targets = [];
                if (header) targets.push(header);
                if (carousel) targets.push(carousel);
                if (targets.length) {
                    window.applyScrollReveal(targets, categoryEl);
                }
            });
        } else {
            window.applyScrollReveal(container.querySelectorAll('.case-card--listing'), container);
        }

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    function renderListing(filtered) {
        const container = document.getElementById('container-casos');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<p class="cw-casos__empty">' + escapeHtml(CW_I18N.t('noCases')) + '</p>';
            return;
        }

        const groups = {};
        filtered.forEach(function (c) {
            const cat = c.categoria || (CW_I18N.locale === 'en' ? 'Other' : 'Otros');
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(c);
        });

        const order = getCategoriaOrder();
        const orderedCats = order.filter(function (cat) { return groups[cat] && groups[cat].length; });
        Object.keys(groups).forEach(function (cat) {
            if (orderedCats.indexOf(cat) === -1) orderedCats.push(cat);
        });

        let html = '<div class="casos__listing-inner">';
        orderedCats.forEach(function (cat) {
            const items = groups[cat];
            const cards = items.map(function (c) {
                return buildCaseCard(c, { slide: true });
            }).join('');

            const catClass = items.length >= CAROUSEL_DESKTOP_PAGE
                ? ' cw-listing-category--carousel'
                : '';

            html += '<section class="casos__category cw-listing-category' + catClass + '">';
            html += buildCasosSectionHeader(cat);
            html += '<div class="cw-carousel" data-cw-carousel>';
            html += '<div class="cw-carousel__visual">';
            html += '<div class="cw-carousel__viewport"><div class="cw-carousel__track">';
            html += cards;
            html += '</div></div>';
            if (typeof window.cwBuildCarouselNav === 'function') {
                html += window.cwBuildCarouselNav(
                    escapeHtml(CW_I18N.t('caseCarouselAria')) + ' - ' + escapeHtml(cat)
                );
            }
            html += '</div></div></section>';
        });
        html += '</div>';

        container.innerHTML = html;
        initCasosCarousels(container);
        applyCasosListingReveal(container);
    }

    /* Pagination */
    function getPageRange(total, current) {
        if (total <= 7) {
            const arr = [];
            for (let i = 1; i <= total; i++) arr.push(i);
            return arr;
        }
        const pages = [1];
        if (current > 3) pages.push('…');
        const lo = Math.max(2, current - 1);
        const hi = Math.min(total - 1, current + 1);
        for (let j = lo; j <= hi; j++) pages.push(j);
        if (current < total - 2) pages.push('…');
        pages.push(total);
        return pages;
    }

    function getListingPageItems(filtered) {
        if (!LISTING_PAGINATION_ENABLED) return filtered;
        const start = (_page - 1) * POSTS_PER_PAGE;
        return filtered.slice(start, start + POSTS_PER_PAGE);
    }

    function renderPagination(total) {
        const el = document.getElementById('casos-pagination');
        if (!el) return;

        const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
        const chevLeft = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';
        const chevRight = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';
        const btns = [];

        btns.push(
            '<button class="cw-pagination__btn"' + (_page <= 1 ? ' disabled' : '') +
            ' data-page="' + (_page - 1) + '" aria-label="' + escapeHtml(CW_I18N.t('previous')) + '">' + chevLeft + '</button>'
        );

        getPageRange(totalPages, _page).forEach(function (p) {
            if (p === '…') {
                btns.push('<span class="cw-pagination__ellipsis">…</span>');
            } else {
                btns.push(
                    '<button class="cw-pagination__btn' + (p === _page ? ' is-active' : '') +
                    '" data-page="' + p + '" aria-label="' + escapeHtml(CW_I18N.t('page')) + ' ' + p + '">' + p + '</button>'
                );
            }
        });

        btns.push(
            '<button class="cw-pagination__btn"' + (_page >= totalPages ? ' disabled' : '') +
            ' data-page="' + (_page + 1) + '" aria-label="' + escapeHtml(CW_I18N.t('next')) + '">' + chevRight + '</button>'
        );

        el.innerHTML = btns.join('');

        el.querySelectorAll('button[data-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const pg = parseInt(btn.getAttribute('data-page'), 10);
                if (!isNaN(pg) && pg >= 1 && pg <= totalPages) {
                    _page = pg;
                    renderAll();
                    scrollToCasosMain();
                }
            });
        });
    }

    function syncListingPaginationNav(total) {
        const el = document.getElementById('casos-pagination');
        if (!el) return;
        if (!LISTING_PAGINATION_ENABLED) {
            el.hidden = true;
            el.innerHTML = '';
            return;
        }
        el.hidden = false;
        renderPagination(total);
    }

    /* Sidebar */
    function countBy(all, keyFn) {
        const counts = Object.create(null);
        all.forEach(function (item) {
            const key = keyFn(item);
            if (Array.isArray(key)) {
                key.forEach(function (k) { if (k) counts[k] = (counts[k] || 0) + 1; });
            } else if (key) {
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }

    function buildSidebarList(elId, counts, activeVal, onPick, sortFn) {
        const el = document.getElementById(elId);
        if (!el) return;

        let keys = Object.keys(counts);
        if (!keys.length) { el.innerHTML = ''; return; }

        if (sortFn) {
            keys.sort(sortFn);
        } else {
            keys.sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
        }

        const html = keys.map(function (key) {
            const isActive = activeVal === key;
            return [
                '<li class="cw-sidebar__item">',
                '<button type="button" class="cw-sidebar__btn' + (isActive ? ' is-active' : '') + '"' + sidebarPressedAttr(isActive) + ' data-value="' + escapeHtml(key) + '">',
                '<span class="cw-sidebar__btn-label">' + escapeHtml(key) + '</span>',
                '<span class="cw-sidebar__count">' + counts[key] + '</span>',
                '</button>',
                '</li>'
            ].join('');
        }).join('');

        el.innerHTML = html;

        el.querySelectorAll('button[data-value]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                btn.blur();
                onPick(btn.getAttribute('data-value') || '');
            });
        });
    }

    function buildSidebarCategorias(all) {
        const order = getCategoriaOrder();
        const rawCounts = countBy(all, function (c) { return c.categoria || ''; });
        const counts = Object.create(null);
        order.forEach(function (cat) {
            counts[cat] = rawCounts[cat] || 0;
        });

        buildSidebarList(
            'sidebar-casos-categoria',
            counts,
            _filters.categoria,
            function (val) {
                markListingFiltersChanged();
                _filters.categoria = _filters.categoria === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToCasosMain();
            },
            function (a, b) {
                return order.indexOf(a) - order.indexOf(b);
            }
        );
    }

    function renderSidebar(all) {
        buildSidebarCategorias(all);
    }

    /* URL params */
    function writeParams() {
        const url = new URL(window.location.href);
        if (_filters.categoria) url.searchParams.set('categoria', _filters.categoria);
        else url.searchParams.delete('categoria');
        if (_filters.query && _filters.query.trim()) url.searchParams.set('q', _filters.query.trim());
        else url.searchParams.delete('q');
        url.searchParams.delete('sector');
        window.history.replaceState({}, '', url.toString());
    }

    function readParams() {
        const sp = new URLSearchParams(window.location.search);
        _filters.categoria = (sp.get('categoria') || '').trim();
        _filters.query = (sp.get('q') || '').trim();
        const searchInput = document.getElementById('casos-search');
        if (searchInput) searchInput.value = _filters.query;
    }

    function syncSearchClearUi() {
        const searchWrap = document.getElementById('casos-search-wrap');
        const searchInput = document.getElementById('casos-search');
        const searchClear = document.getElementById('casos-search-clear');
        const has = !!(searchInput && searchInput.value && String(searchInput.value).trim());
        if (searchWrap) searchWrap.classList.toggle('cw-perspectivas__search--has-query', has);
        if (searchClear) searchClear.hidden = !has;
    }

    /* Render all */
    function renderAll() {
        if (!_casosCache) return;
        const filtered = getFiltered(_casosCache);
        const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
        if (_page > totalPages) _page = totalPages;
        renderListing(getListingPageItems(filtered));
        renderSidebar(_casosCache);
        syncListingPaginationNav(filtered.length);
        writeParams();
        announceListingCount(filtered.length);
    }

    /* Listing init */
    function initListingFilters(casos) {
        _casosCache = casos;
        readParams();
        syncSearchClearUi();

        const searchInput = document.getElementById('casos-search');
        const searchClear = document.getElementById('casos-search-clear');
        let searchDebounceTimer = null;
        const debounceMs = window.CW_LISTING_SEARCH_DEBOUNCE_MS || 300;

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                _filters.query = searchInput.value || '';
                _page = 1;
                syncSearchClearUi();
                markListingFiltersChanged();
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(function () {
                    renderAll();
                }, debounceMs);
            });
        }

        if (searchClear && searchInput) {
            searchClear.addEventListener('click', function () {
                searchInput.value = '';
                _filters.query = '';
                _page = 1;
                syncSearchClearUi();
                markListingFiltersChanged();
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                renderAll();
                searchInput.focus();
            });
        }

        bindCasosCarouselMq();
        renderAll();
    }

    /* Hero scroll reveal */
    function initCasosScrollReveal(root) {
        if (!root || typeof window.applyScrollReveal !== 'function') return;
        const hero = root.querySelector('.cw-perspectivas__hero');
        if (hero) {
            const heroTargets = hero.querySelectorAll('.section-tag, .page-title, .page-lead');
            if (heroTargets.length) window.applyScrollReveal(heroTargets, hero);
        }
    }

    /* Detail */
    function truncateMetaDescription(text, maxLen) {
        const s = String(text || '').trim();
        if (!s) return '';
        if (s.length <= maxLen) return s;
        return s.slice(0, Math.max(0, maxLen - 1)).trim() + '…';
    }

    function updateCasoHeadMeta(caso) {
        const title = (caso.subtitulo || (CW_I18N.locale === 'en' ? 'Case Study' : 'Caso')) + ' | Chanwe';
        const excerpt = String(caso.excerpt || '').trim();
        const desc = truncateMetaDescription(excerpt, 160) ||
            (CW_I18N.locale === 'en'
                ? 'See how Chanwe generated real results in this client case study.'
                : 'Conoce cómo Chanwe generó resultados reales en este caso de cliente.');

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', desc);

        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', desc);

        const page = CW_I18N.pageName || '';
        if (caso.slug && isStaticCasePage(page)) {
            CW_I18N.setCanonicalMeta(page);
        } else if (caso.slug) {
            CW_I18N.setCanonicalMeta('caso.html', { slug: caso.slug });
        }
    }

    function renderDetail(caso) {
        cwSetTagText(caso.detailTag || '');
        cwSetTextByDynamic('title', caso.subtitulo);
        cwSetTextByDynamic('stat', caso.highlight);
        cwSetTextByDynamic('lead', '');
        cwSetHeroImage(caso.foto, caso.fotoAlt, caso.fotoStyle);
        cwSetBlockText('contexto', caso.contexto);
        cwSetBlockText('problema', caso.problema);
        cwSetBlockText('solucion', caso.solucion);
        cwSetBlockText('resultado', caso.resultado);

        if (typeof cwSyncDetailBlocks === 'function') cwSyncDetailBlocks();

        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = (caso.subtitulo || (CW_I18N.locale === 'en' ? 'Case Study' : 'Caso')) + ' | Chanwe';

        updateCasoHeadMeta(caso);

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    function showError(container, msg) {
        if (!container) return;
        container.innerHTML = '<p class="body-text" style="color:var(--primary);">' + escapeHtml(msg) + '</p>';
    }

    /* Boot */
    document.addEventListener('DOMContentLoaded', function () {
        if (document.body && document.body.classList.contains('page-casos')) {
            const root = document.getElementById('casos-listagem');
            if (root) initCasosScrollReveal(root);

            fetchCasos()
                .then(function (casos) {
                    initListingFilters(casos);
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('container-casos'),
                        CW_I18N.t('casesLoadError') + ' (' + err.message + ')'
                    );
                });
            return;
        }

        if (document.body && document.body.classList.contains('page-caso')) {
            const slug = getSlugParam();
            if (!slug) {
                showError(
                    document.getElementById('main-content'),
                    CW_I18N.t('caseMissing')
                );
                return;
            }

            fetchCasos()
                .then(function (casos) {
                    const caso = casos.find(function (c) { return c.slug === slug; });
                    if (!caso) {
                        throw new Error(CW_I18N.locale === 'en'
                            ? 'Slug "' + slug + '" was not found in the JSON.'
                            : 'Slug "' + slug + '" no existe en el JSON.');
                    }
                    renderDetail(caso);
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('main-content'),
                        CW_I18N.t('caseLoadError') + ' (' + err.message + ')'
                    );
                });
        }
    });
})();
