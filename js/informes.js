/* ==========================================================================
   Informes page
   Listing, filters, carousel, and detail from informes/index.json
   ========================================================================== */
(function () {
    'use strict';

    var CW_I18N = window.CW_I18N || {
        locale: 'es',
        t: function (key) { return key; },
        assetPath: function (path) { return path; },
        dataPath: function (path) { return 'data/' + path; },
        setCanonicalMeta: function () {}
    };

    var POSTS_PER_PAGE = 6;
    /* Flat listing pages (slice before category groups). Set true to enable. */
    var LISTING_PAGINATION_ENABLED = false;
    var INFORMES_MOBILE_MQ = '(max-width: 1024px)';
    var CAROUSEL_DESKTOP_PAGE = 2;

    var MONTHS_ES = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
        'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
        'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    var MONTHS_SHORT_ES = {
        '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    };

    var MONTHS_SHORT_EN = {
        '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
        '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
        '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
    };

    /* State */
    var _cache = null;
    var _page = 1;
    var _filters = { categoria: '', date: '' };
    var _announceListingResults = false;

    function sidebarPressedAttr(isActive) {
        return window.cwSidebarPressedAttr
            ? window.cwSidebarPressedAttr(isActive)
            : (' aria-pressed="' + (isActive ? 'true' : 'false') + '"');
    }

    function announceListingCount(count) {
        if (!_announceListingResults || typeof window.cwAnnounceListingResults !== 'function') return;
        window.cwAnnounceListingResults(
            document.getElementById('container-informes'),
            count
        );
    }

    function markListingFiltersChanged() {
        _announceListingResults = true;
    }

    /* Utilities */
    /* Mobile: scroll listing into view after filter change */
    function scrollToInformesMain() {
        if (!window.matchMedia(INFORMES_MOBILE_MQ).matches) return;
        window.requestAnimationFrame(function () {
            var main = document.querySelector('.cw-informes__main');
            if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* Slug from query, hash, or sessionStorage */
    function getSlugParam() {
        var qs = new URLSearchParams(window.location.search).get('slug');
        if (qs) return qs;
        var hash = window.location.hash;
        if (hash && hash.length > 1) return decodeURIComponent(hash.slice(1));
        try {
            var stored = sessionStorage.getItem('cw_informe_slug');
            if (stored) { sessionStorage.removeItem('cw_informe_slug'); return stored; }
        } catch (e) { /* private browsing */ }
        return null;
    }

    /* Markdown parsers */

    function parseFrontMatter(rawText) {
        var text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        var match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        if (!match) return { meta: {}, body: text };

        var meta = {};
        match[1].split('\n').forEach(function (line) {
            if (!line.trim() || line.trim().charAt(0) === '#') return;
            var colonIdx = line.indexOf(':');
            if (colonIdx === -1) return;
            var key = line.slice(0, colonIdx).trim();
            var val = line.slice(colonIdx + 1).trim();
            if (!key) return;
            if (val.charAt(0) === '[' && val.charAt(val.length - 1) === ']') {
                meta[key] = val.slice(1, -1).split(',')
                    .map(function (v) { return v.trim().replace(/^["']|["']$/g, ''); })
                    .filter(Boolean);
            } else {
                meta[key] = val.replace(/^["']|["']$/g, '');
            }
        });
        return { meta: meta, body: match[2].trim() };
    }

    function parseBodySections(body) {
        return { resumen: body };
    }

    /* Fetch */

    var _fetchPromise = null;
    function fetchInformes() {
        if (_cache) return Promise.resolve(_cache);
        if (_fetchPromise) return _fetchPromise;

        _fetchPromise = fetch(CW_I18N.dataPath('informes/index.json'))
            .then(function (r) {
                if (!r.ok) throw new Error('informes/index.json');
                return r.json();
            })
            .then(function (slugs) {
                return Promise.all(slugs.map(function (slug) {
                    return fetch(CW_I18N.dataPath('informes/' + slug + '.md'))
                        .then(function (r) {
                            if (!r.ok) throw new Error('informes/' + slug + '.md');
                            return r.text();
                        })
                        .then(function (text) {
                            var parsed   = parseFrontMatter(text);
                            var sections = parseBodySections(parsed.body);
                            var informe  = Object.assign({}, parsed.meta, sections, { slug: slug, _body: parsed.body });
                            if (!Array.isArray(informe.tags)) informe.tags = informe.tags ? [informe.tags] : [];
                            return informe;
                        });
                }));
            })
            .then(function (informes) {
                _cache = informes;
                return informes;
            });

        return _fetchPromise;
    }

    /* Date and tags */

    function getTags(p) {
        var t = p.tags;
        if (!t) return [];
        if (Array.isArray(t)) return t.filter(Boolean);
        return String(t).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }

    function getDateKey(p) {
        var fecha = String(p.fecha || '').toLowerCase();
        var yearMatch = fecha.match(/(20\d{2})/);
        var year = yearMatch ? yearMatch[1] : '';
        var month = '';
        var name;
        for (name in MONTHS_ES) {
            if (MONTHS_ES.hasOwnProperty(name) && fecha.indexOf(name) !== -1) {
                month = MONTHS_ES[name];
                break;
            }
        }
        if (!year) return '';
        return month ? year + '-' + month : year;
    }

    function getYearKey(p) {
        var fecha = String(p.fecha || '').toLowerCase();
        var yearMatch = fecha.match(/(20\d{2})/);
        return yearMatch ? yearMatch[1] : '';
    }

    function formatDateKey(key) {
        var parts = key.split('-');
        if (parts.length < 2) return parts[0] || key;
        var months = CW_I18N.locale === 'en' ? MONTHS_SHORT_EN : MONTHS_SHORT_ES;
        return (months[parts[1]] || parts[1]) + ' ' + parts[0];
    }

    /* Cards */

    function normalizeTagToken(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function splitInformeTitulo(p) {
        var titulo = String(p.titulo || '').trim();
        var categoria = String(p.categoria || '').trim();
        var dash = titulo.match(/\s+[—–-]\s+/);

        if (dash) {
            var idx = dash.index;
            var headline = titulo.slice(idx + dash[0].length).trim();
            return {
                categoria: categoria || titulo.slice(0, idx).trim(),
                headline: headline || titulo
            };
        }

        return { categoria: categoria, headline: titulo };
    }

    var CATEGORIA_LABELS = {
        'Radar Macroeconómico': 'Radar Macro',
        'Informe Trimestral de la Economía': 'Informe Trimestral',
        'Enfoque Industrial': 'Enfoque Industrial',
        'Business Buzz': 'Business Buzz',
        'Macroeconomic Radar': 'Macro Radar',
        'Quarterly Economic Report': 'Quarterly Report',
        'Industrial Focus': 'Industrial Focus'
    };

    var CATEGORIA_DESCRIPTIONS = {
        'Radar Macroeconómico': {
            es: 'Lectura mensual de las variables que definen el escenario económico.'
        },
        'Informe Trimestral de la Economía': {
            es: 'Perspectiva integral sobre la economía, sus tendencias y próximos movimientos.'
        },
        'Enfoque Industrial': {
            es: 'Actividad, sectores y señales para comprender la transformación productiva.'
        },
        'Business Buzz': {
            es: 'Señales semanales de mercado, movimientos y temas que ganan tracción.',
            en: 'Weekly market signals, movements, and topics gaining traction.'
        },
        'Macroeconomic Radar': {
            en: 'A monthly read of the variables shaping the economic outlook.'
        },
        'Quarterly Economic Report': {
            en: 'A comprehensive view of the economy, its trends, and what comes next.'
        },
        'Industrial Focus': {
            en: 'Activity, sectors, and signals shaping the productive landscape.'
        }
    };

    function getCategoriaLabel(categoria) {
        return CATEGORIA_LABELS[categoria] || categoria;
    }

    function getCategoriaDescription(categoria) {
        var descriptions = CATEGORIA_DESCRIPTIONS[categoria];
        if (!descriptions) return '';
        return descriptions[CW_I18N.locale] || descriptions.es || descriptions.en || '';
    }

    function getInformeCardCopyNormalized(p) {
        var titles = splitInformeTitulo(p);
        return normalizeTagToken([
            p.categoria,
            titles.categoria,
            titles.headline,
            p.titulo,
            p.descripcion
        ].filter(Boolean).join(' '));
    }

    function tagIsInCardCopy(tag, copyNorm) {
        var token = normalizeTagToken(tag);
        if (!token || !copyNorm) return false;
        if (copyNorm.indexOf(token) !== -1) return true;
        var words = token.split(/\s+/).filter(function (w) {
            return w.length > 2;
        });
        if (words.length <= 1) return false;
        for (var i = 0; i < words.length; i++) {
            if (copyNorm.indexOf(words[i]) !== -1) return true;
        }
        return false;
    }

    /* Up to 3 tag pills; CSS caps visible count per breakpoint */
    function getCardDisplayTags(p) {
        var MOBILE_LIMIT = 3;
        var allTags = getTags(p);
        if (!allTags.length) return [];

        var categoriaNorm = normalizeTagToken(p.categoria);
        var copyNorm = getInformeCardCopyNormalized(p);
        var buckets = [[], [], [], []];

        allTags.forEach(function (tag, index) {
            var token = normalizeTagToken(tag);
            if (!token) return;

            var strictSkip = token === 'trimestral' || /macroeconom/.test(token) ||
                (categoriaNorm && (categoriaNorm.indexOf(token) !== -1 || token.indexOf(categoriaNorm) !== -1));
            var inCopy = tagIsInCardCopy(tag, copyNorm);
            var item = { tag: tag, index: index };

            if (!strictSkip) {
                buckets[inCopy ? 1 : 0].push(item);
            } else {
                buckets[inCopy ? 3 : 2].push(item);
            }
        });

        var seen = {};
        var result = [];
        var b;
        for (b = 0; b < 4; b++) {
            buckets[b].sort(function (a, c) { return a.index - c.index; });
            buckets[b].forEach(function (item) {
                if (result.length >= MOBILE_LIMIT) return;
                var key = normalizeTagToken(item.tag);
                if (seen[key]) return;
                seen[key] = true;
                result.push(item.tag);
            });
        }

        return result;
    }

    function buildCardTagPills(tags) {
        if (!tags || !tags.length) return '';
        var pills = tags.map(function (tag) {
            return '<span class="informe-card__tag">' + escapeHtml(tag) + '</span>';
        });
        return '<div class="informe-card__tags">' + pills.join('') + '</div>';
    }

    function buildDownloadIconHtml() {
        return [
            '<svg class="informe-card__download-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">',
            '<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>',
            '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
            '<path d="M7 11l5 5l5 -5" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
            '<path d="M12 4l0 12" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
            '</svg>'
        ].join('');
    }

    function buildInformeCard(p, opts) {
        var isPrivate = p.acceso === 'privado';
        var accessClass = isPrivate ? ' informe-card__access-pill--private' : ' informe-card__access-pill--public';
        var accessLabel = isPrivate ? CW_I18N.t('clients') : CW_I18N.t('public');
        var titles = splitInformeTitulo(p);
        var paginasText = p.paginas
            ? escapeHtml(String(p.paginas)) + ' ' + escapeHtml(CW_I18N.t('pagesShort'))
            : '';
        var cardLink = 'informe.html#' + escapeHtml(p.slug);
        var onClickAttr = ' onclick="try{sessionStorage.setItem(\'cw_informe_slug\',\'' + escapeHtml(p.slug) + '\')}catch(e){}"';
        var hasPdf = !!(p.pdf && String(p.pdf).trim());

        var coverHtml = p.portada
            ? [
                '<a href="' + cardLink + '"' + onClickAttr + ' class="informe-card__cover-link" tabindex="-1" aria-hidden="true">',
                '  <div class="informe-card__cover">',
                '    <img src="' + escapeHtml(CW_I18N.assetPath(p.portada)) + '" alt="' + escapeHtml(p.portadaAlt || '') + '" class="informe-card__img">',
                '  </div>',
                '</a>'
            ].join('\n')
            : '<div class="informe-card__cover informe-card__cover--placeholder"></div>';

        var viewLinkHtml = [
            '<a href="' + cardLink + '"' + onClickAttr + ' class="text-link informe-card__view" tabindex="-1" aria-hidden="true">',
            escapeHtml(CW_I18N.t('view')),
            '<img src="' + escapeHtml(CW_I18N.assetPath('assets/01-icons/chanwe-icons/chanwe-icon-arrow-upright-red.svg')) + '" alt="" class="text-link__icon">',
            '</a>'
        ].join('');

        var footerHtml = '';
        if (!isPrivate) {
            var actionsHtml = '';
            if (hasPdf) {
                actionsHtml = [
                    '<div class="informe-card__actions">',
                    '    <a href="' + escapeHtml(CW_I18N.assetPath(p.pdf)) + '" class="informe-card__download" download aria-label="' + escapeHtml(CW_I18N.t('downloadPdf')) + ' - ' + escapeHtml(p.titulo || '') + '">',
                    buildDownloadIconHtml(),
                    '    </a>',
                    '</div>'
                ].join('\n');
            }
            footerHtml = [
                '<div class="informe-card__footer">',
                '  ' + viewLinkHtml,
                actionsHtml,
                '</div>'
            ].join('\n');
        } else {
            footerHtml = [
                '<div class="informe-card__footer">',
                '  ' + viewLinkHtml,
                '</div>'
            ].join('\n');
        }

        var displayTags = getCardDisplayTags(p);

        var metaRowHtml = (paginasText || displayTags.length)
            ? [
                '<div class="informe-card__meta-row">',
                paginasText ? ('<span class="informe-card__pages">' + paginasText + '</span>') : '<span class="informe-card__pages" aria-hidden="true"></span>',
                buildCardTagPills(displayTags),
                '</div>'
            ].join('\n')
            : '';

        return [
            '<div class="informe-card' + (opts && opts.slide ? ' cw-carousel__slide' : '') + '" data-slug="' + escapeHtml(p.slug) + '">',
            '  <div class="informe-card__cover-stage">',
            '    <span class="informe-card__access-pill' + accessClass + '">' + escapeHtml(accessLabel) + '</span>',
            coverHtml,
            '  </div>',
            '  <div class="informe-card__body">',
            titles.categoria ? ('<p class="informe-card__cat">' + escapeHtml(getCategoriaLabel(titles.categoria)) + '</p>') : '',
            '    <h4 class="informe-card__headline">',
            '      <a href="' + cardLink + '"' + onClickAttr + ' class="informe-card__headline-link">',
            '        ' + escapeHtml(titles.headline || p.titulo || ''),
            '      </a>',
            '    </h4>',
            '    <p class="informe-card__desc">' + escapeHtml(p.descripcion || '') + '</p>',
            metaRowHtml,
            footerHtml,
            '  </div>',
            '</div>'
        ].join('\n');
    }

    /* Filters */
    function getFiltered(all) {
        return all.filter(function (p) {
            if (_filters.categoria && (p.categoria || '') !== _filters.categoria) return false;
            if (_filters.date && getYearKey(p) !== _filters.date) return false;
            return true;
        });
    }

    var CATEGORIA_ORDER = [
        'Radar Macroeconómico',
        'Informe Trimestral de la Economía',
        'Enfoque Industrial',
        'Macroeconomic Radar',
        'Quarterly Economic Report',
        'Industrial Focus',
        'Business Buzz'
    ];

    /* Carousel — shared module (js/carousel.js) */
    var _informesCarousels = [];

    function initInformesCarousels(root) {
        if (typeof window.cwInitListingCarousels !== 'function') return;
        _informesCarousels = window.cwInitListingCarousels(root, {
            mobileMq: INFORMES_MOBILE_MQ,
            desktopPage: CAROUSEL_DESKTOP_PAGE
        });
    }

    function bindInformesCarouselMq() {
        if (typeof window.cwBindListingCarouselMq === 'function') {
            window.cwBindListingCarouselMq(_informesCarousels, INFORMES_MOBILE_MQ);
        }
    }

    /* Listing */
    function applyInformesListingReveal(container) {
        if (!window.applyScrollReveal || !container) return;

        var mobile = window.matchMedia(INFORMES_MOBILE_MQ).matches;

        if (mobile) {
            container.querySelectorAll('.informes__category').forEach(function (categoryEl) {
                var header = categoryEl.querySelector('.informes__section-header');
                var carousel = categoryEl.querySelector('.cw-carousel');
                var targets = [];
                if (header) targets.push(header);
                if (carousel) targets.push(carousel);
                if (targets.length) {
                    window.applyScrollReveal(targets, categoryEl);
                }
            });
        } else {
            window.applyScrollReveal(container.querySelectorAll('.informe-card'), container);
        }

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    function renderListing(filtered) {
        var container = document.getElementById('container-informes');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = '<p class="cw-informes__empty">' + escapeHtml(CW_I18N.t('noReports')) + '</p>';
            return;
        }

        var groups = {};
        filtered.forEach(function (p) {
            var cat = p.categoria || 'Otros';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });

        var orderedCats = CATEGORIA_ORDER.filter(function (c) { return groups[c] && groups[c].length; });
        Object.keys(groups).forEach(function (c) {
            if (orderedCats.indexOf(c) === -1) orderedCats.push(c);
        });

        var html = '<div class="informes__listing-inner">';
        orderedCats.forEach(function (cat) {
            var items = groups[cat];
            var catDescription = getCategoriaDescription(cat);
            var cards = items.map(function (p) {
                return buildInformeCard(p, { slide: true });
            }).join('');

            /* Keep every report group in the same carousel shell so one-card
               sections align with the two-card rows above. */
            var catClass = ' cw-listing-category--carousel';

            html += '<section class="informes__category cw-listing-category' + catClass + '">';
            html += '<header class="informes__section-header">';
            html += '<h2 class="informes__section-title">' + escapeHtml(getCategoriaLabel(cat)) + '</h2>';
            if (catDescription) {
                html += '<p class="informes__section-description">' + escapeHtml(catDescription) + '</p>';
            }
            html += '</header>';
            html += '<div class="cw-carousel" data-cw-carousel>';
            html += '<div class="cw-carousel__visual">';
            html += '<div class="cw-carousel__viewport"><div class="cw-carousel__track">';
            html += cards;
            html += '</div></div>';
            if (typeof window.cwBuildCarouselNav === 'function') {
                html += window.cwBuildCarouselNav(
                    escapeHtml(CW_I18N.t('reportCarouselAria')) + ' - ' + escapeHtml(cat)
                );
            }
            html += '</div></div></section>';
        });
        html += '</div>';

        container.innerHTML = html;

        if (typeof window.cwBindCardPointerGlow === 'function') {
            window.cwBindCardPointerGlow(container);
        }
        initInformesCarousels(container);
        applyInformesListingReveal(container);
    }

    /* Pagination */
    function getPageRange(total, current) {
        if (total <= 7) {
            var arr = [];
            for (var i = 1; i <= total; i++) arr.push(i);
            return arr;
        }
        var pages = [1];
        if (current > 3) pages.push('…');
        var lo = Math.max(2, current - 1);
        var hi = Math.min(total - 1, current + 1);
        for (var j = lo; j <= hi; j++) pages.push(j);
        if (current < total - 2) pages.push('…');
        pages.push(total);
        return pages;
    }

    function getListingPageItems(filtered) {
        if (!LISTING_PAGINATION_ENABLED) return filtered;
        var start = (_page - 1) * POSTS_PER_PAGE;
        return filtered.slice(start, start + POSTS_PER_PAGE);
    }

    function syncListingPaginationNav(total) {
        var el = document.getElementById('informes-pagination');
        if (!el) return;
        if (!LISTING_PAGINATION_ENABLED) {
            el.hidden = true;
            el.innerHTML = '';
            return;
        }
        el.hidden = false;
        renderPagination(total);
    }

    function renderPagination(total) {
        var el = document.getElementById('informes-pagination');
        if (!el) return;

        var totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

        var chevLeft  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';
        var chevRight = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';

        var btns = [];

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
                var pg = parseInt(btn.getAttribute('data-page'), 10);
                if (!isNaN(pg) && pg >= 1 && pg <= totalPages) {
                    _page = pg;
                    renderAll();
                    scrollToInformesMain();
                }
            });
        });
    }

    /* Sidebar */
    function countBy(all, keyFn) {
        var counts = Object.create(null);
        all.forEach(function (p) {
            var key = keyFn(p);
            if (Array.isArray(key)) {
                key.forEach(function (k) { if (k) counts[k] = (counts[k] || 0) + 1; });
            } else {
                if (key) counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }

    function buildSidebarList(elId, counts, activeVal, onPick, sortFn, labelFn) {
        var el = document.getElementById(elId);
        if (!el) return;

        var keys = Object.keys(counts);
        if (!keys.length) { el.innerHTML = ''; return; }

        if (sortFn) {
            keys.sort(sortFn);
        } else {
            keys.sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
        }

        var html = keys.map(function (key) {
            var label = labelFn ? labelFn(key) : key;
            var isActive = activeVal === key;
            return [
                '<li class="cw-sidebar__item">',
                '<button type="button" class="cw-sidebar__btn' + (isActive ? ' is-active' : '') + '"' + sidebarPressedAttr(isActive) + ' data-value="' + escapeHtml(key) + '">',
                '<span class="cw-sidebar__btn-label">' + escapeHtml(label) + '</span>',
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

    function renderSidebar(all) {
        buildSidebarList(
            'sidebar-inf-categoria',
            countBy(all, function (p) { return p.categoria || ''; }),
            _filters.categoria,
            function (val) {
                markListingFiltersChanged();
                _filters.categoria = _filters.categoria === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToInformesMain();
            },
            function (a, b) {
                var ai = CATEGORIA_ORDER.indexOf(a);
                var bi = CATEGORIA_ORDER.indexOf(b);
                if (ai === -1) ai = CATEGORIA_ORDER.length;
                if (bi === -1) bi = CATEGORIA_ORDER.length;
                return ai - bi || a.localeCompare(b);
            },
            getCategoriaLabel
        );

        buildSidebarList(
            'sidebar-inf-date',
            countBy(all, getYearKey),
            _filters.date,
            function (val) {
                markListingFiltersChanged();
                _filters.date = _filters.date === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToInformesMain();
            },
            function (a, b) { return b.localeCompare(a); }
        );
    }

    /* Render all */
    function renderAll() {
        if (!_cache) return;
        var filtered = getFiltered(_cache);
        var totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
        if (_page > totalPages) _page = totalPages;
        renderListing(getListingPageItems(filtered));
        renderSidebar(_cache);
        syncListingPaginationNav(filtered.length);
        announceListingCount(filtered.length);
    }

    function showError(container, msg) {
        if (!container) return;
        container.innerHTML = '<p class="body-text" style="color:var(--primary);">' + escapeHtml(msg) + '</p>';
    }

    /* Detail */
    function renderMdBlock(key, mdText) {
        var el = document.querySelector('[data-dynamic="block"][data-key="' + key + '"]');
        if (!el) return;
        if (mdText && typeof marked !== 'undefined') {
            el.innerHTML = marked.parse(mdText);
        } else {
            el.textContent = mdText || '';
        }
    }

    function renderDetail(p) {
        cwSetTagText(p.categoria || '');
        cwSetTextByDynamic('title', p.titulo);
        cwSetTextByDynamic('lead', p.descripcion);

        var fechaEl = document.querySelector('[data-dynamic="fecha"]');
        if (fechaEl) fechaEl.textContent = p.fecha || '';

        var paginasEl = document.querySelector('[data-dynamic="paginas"]');
        if (paginasEl) paginasEl.textContent = p.paginas ? p.paginas + ' ' + CW_I18N.t('pagesLong') : '';

        var tagsEl = document.querySelector('[data-dynamic="tags"]');
        if (tagsEl) {
            var pills = getTags(p).map(function (tag) {
                return '<span class="cw-tag">' + escapeHtml(tag) + '</span>';
            });
            tagsEl.innerHTML = pills.join('');
            tagsEl.hidden = pills.length === 0;
        }

        renderMdBlock('resumen', p.resumen || p._body || '');

        var bodyEl = document.querySelector('.informe-detail__body');
        if (bodyEl) {
            var resumenEl = bodyEl.querySelector('[data-dynamic="block"][data-key="resumen"]');
            var resumenText = resumenEl ? (resumenEl.textContent || '').trim() : '';
            var resumenHtml = resumenEl
                ? (resumenEl.innerHTML || '').replace(/<[^>]*>/g, '').trim()
                : '';
            bodyEl.hidden = !(resumenText || resumenHtml);
        }

        cwSetHeroImage(p.portada || '', p.portadaAlt || '', null);

        var ctaEl = cwGetDynamicEl('cta');
        if (ctaEl) {
            if (p.pdf && p.pdf.trim() && p.acceso === 'publico') {
                var pdfLink = document.createElement('a');
                pdfLink.href = CW_I18N.assetPath(p.pdf);
                pdfLink.download = '';
                pdfLink.className = 'btn btn-primary';
                pdfLink.textContent = CW_I18N.t('downloadPdf');
                ctaEl.innerHTML = '';
                ctaEl.appendChild(pdfLink);
            } else if (p.acceso === 'privado') {
                ctaEl.innerHTML = '<p class="informe-card__unavailable" style="text-align:center;">' + escapeHtml(CW_I18N.t('privateReport')) + '</p>';
            }
        }

        var titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = (p.titulo || 'Informe') + ' | Chanwe';
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && p.descripcion) metaDesc.setAttribute('content', p.descripcion);
        var ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && p.titulo) ogTitle.setAttribute('content', p.titulo + ' | Chanwe');
        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && p.descripcion) ogDesc.setAttribute('content', p.descripcion);
        CW_I18N.setCanonicalMeta('informe.html', { slug: p.slug });

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    /* Hero scroll reveal */
    function initInformesScrollReveal(root) {
        if (!root || typeof window.applyScrollReveal !== 'function') return;
        var hero = root.querySelector('.cw-perspectivas__hero');
        var heroTargets = hero
            ? hero.querySelectorAll('.section-tag, .page-title, .page-lead, .highlight-brand')
            : [];
        var entryEls = Array.prototype.slice.call(heroTargets);
        if (entryEls.length && hero) window.applyScrollReveal(entryEls, hero);
    }

    /* Boot */
    document.addEventListener('DOMContentLoaded', function () {

        if (document.body && document.body.classList.contains('page-informes')) {
            var root = document.getElementById('informes');
            if (root) initInformesScrollReveal(root);

            fetchInformes()
                .then(function () {
                    renderAll();
                    bindInformesCarouselMq();
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('container-informes'),
                        CW_I18N.t('reportsLoadError') + ' (' + err.message + ')'
                    );
                });

            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            return;
        }

        if (document.body && document.body.classList.contains('page-informe')) {
            var slug = getSlugParam();
            if (!slug) {
                showError(
                    document.getElementById('main-content'),
                    CW_I18N.t('reportMissing')
                );
                return;
            }

            fetchInformes()
                .then(function (all) {
                    var p = all.find(function (x) { return x.slug === slug; });
                    if (!p) {
                        throw new Error(CW_I18N.locale === 'en'
                            ? 'Slug "' + slug + '" was not found in informes/index.json.'
                            : 'Slug "' + slug + '" no existe en informes/index.json.');
                    }
                    renderDetail(p);
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('main-content'),
                        CW_I18N.t('reportLoadError') + ' (' + err.message + ')'
                    );
                });
        }
    });
})();
