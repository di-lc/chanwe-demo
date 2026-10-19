/* ==========================================================================
   Perspectivas
   Listing + detail from data/perspectivas/*.md
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

    var POSTS_PER_PAGE = 4;

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
    var _filters = { tipo: '', tag: '', date: '', industria: '' };
    var _query = '';
    var _announceListingResults = false;

    function sidebarPressedAttr(isActive) {
        return window.cwSidebarPressedAttr
            ? window.cwSidebarPressedAttr(isActive)
            : (' aria-pressed="' + (isActive ? 'true' : 'false') + '"');
    }

    function announceListingCount(count) {
        if (!_announceListingResults || typeof window.cwAnnounceListingResults !== 'function') return;
        window.cwAnnounceListingResults(
            document.getElementById('container-perspectivas'),
            count
        );
    }

    function markListingFiltersChanged() {
        _announceListingResults = true;
    }

    /* Utilities */
    /* Scroll listing to top */
    function scrollToPerspectivasMain() {
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                var main = document.querySelector('.cw-perspectivas__main');
                if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
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

    function getSlugParam() {
        /* Query string */
        var qs = new URLSearchParams(window.location.search).get('slug');
        if (qs) return qs;
        /* Hash */
        var hash = window.location.hash;
        if (hash && hash.length > 1) return decodeURIComponent(hash.slice(1));
        /* sessionStorage */
        try {
            var stored = sessionStorage.getItem('cw_perspectiva_slug');
            if (stored) { sessionStorage.removeItem('cw_perspectiva_slug'); return stored; }
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

    var SECTION_MAP = {
        'introduc': 'introduccion',
        'introduction': 'introduccion',
        'desarrollo': 'desarrollo',
        'conclus': 'conclusion',
        'conclusion': 'conclusion',
        'cierre': 'conclusion',
        'resumen': 'conclusion',
        'summary': 'conclusion'
    };

    function mapSectionHeading(headingText) {
        var headingLower = String(headingText || '').toLowerCase().trim();
        var mappedKey = null;

        for (var key in SECTION_MAP) {
            if (!SECTION_MAP.hasOwnProperty(key)) continue;
            if (headingLower === key || headingLower.indexOf(key) === 0) {
                mappedKey = SECTION_MAP[key];
                break;
            }
        }
        return mappedKey;
    }

    function parseBodySections(body) {
        var sections = { introduccion: '', desarrollo: '', conclusion: '' };
        var headingRe = /^##[ \t]+([^\n]+)/gm;
        var headings = [];
        var hMatch;
        while ((hMatch = headingRe.exec(body)) !== null) {
            headings.push({ text: hMatch[1].trim(), index: hMatch.index, end: headingRe.lastIndex });
        }

        if (headings.length === 0) {
            sections.introduccion = body;
            return sections;
        }

        /* Preamble → intro */
        var preamble = body.slice(0, headings[0].index).trim();
        sections.introduccion = preamble;

        for (var i = 0; i < headings.length; i++) {
            var contentStart = headings[i].end;
            var contentEnd   = i + 1 < headings.length ? headings[i + 1].index : body.length;
            var content      = body.slice(contentStart, contentEnd).trim();
            var mapped       = mapSectionHeading(headings[i].text);

            if (mapped) {
                sections[mapped] += (sections[mapped] ? '\n\n' : '') + content;
            } else {
                var block = '## ' + headings[i].text + '\n\n' + content;
                sections.desarrollo += (sections.desarrollo ? '\n\n' : '') + block;
            }
        }
        return sections;
    }

    /* Fetch */
    var _fetchPromise = null;
    function fetchPerspectivas() {
        if (_cache) return Promise.resolve(_cache);
        if (_fetchPromise) return _fetchPromise;

        _fetchPromise = fetch(CW_I18N.dataPath('perspectivas/index.json'))
            .then(function (r) {
                if (!r.ok) throw new Error('perspectivas/index.json');
                return r.json();
            })
            .then(function (slugs) {
                return Promise.all(slugs.map(function (slug) {
                    return fetch(CW_I18N.dataPath('perspectivas/' + slug + '.md'))
                        .then(function (r) {
                            if (!r.ok) throw new Error('perspectivas/' + slug + '.md');
                            return r.text();
                        })
                        .then(function (text) {
                            var parsed   = parseFrontMatter(text);
                            var sections = parseBodySections(parsed.body);
                            var post     = Object.assign({}, parsed.meta, sections, { slug: slug, _body: parsed.body });
                            if (!Array.isArray(post.tags)) post.tags = post.tags ? [post.tags] : [];
                            return post;
                        });
                }));
            })
            .then(function (posts) {
                _cache = posts;
                return posts;
            });

        return _fetchPromise;
    }

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

    function formatDateKey(key) {
        var parts = key.split('-');
        if (parts.length < 2) return parts[0] || key;
        var months = CW_I18N.locale === 'en' ? MONTHS_SHORT_EN : MONTHS_SHORT_ES;
        return (months[parts[1]] || parts[1]) + ' ' + parts[0];
    }

    /* Card builder */
    function buildTagPills(tags, tipo) {
        var pills = [];
        if (tipo) {
            pills.push('<span class="cw-tag cw-tag--tipo">' + escapeHtml(tipo) + '</span>');
        }
        tags.forEach(function (tag) {
            pills.push('<span class="cw-tag">' + escapeHtml(tag) + '</span>');
        });
        return pills.length
            ? '<div class="insight-row__tags">' + pills.join('') + '</div>'
            : '';
    }

    function buildPerspectivaCard(p) {
        var privateText = (p.acceso === 'privado' && p.pdf)
            ? '<span class="insight-row__private-text">' + escapeHtml(CW_I18N.t('availableClients')) + '</span>'
            : '';

        var linkRowEnd = '';
        if (p.pdf) {
            var pdfHref = CW_I18N.assetPath(p.pdf);
            linkRowEnd = [
                '      <div class="insight-row__link-row-end">',
                '        <a href="' + escapeHtml(pdfHref) + '" class="insight-row__download" target="_blank" rel="noopener" aria-label="' + escapeHtml(CW_I18N.t('downloadPdf')) + '">',
                '          <svg class="insight-row__download-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">',
                '            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>',
                '            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
                '            <path d="M7 11l5 5l5 -5" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
                '            <path d="M12 4l0 12" stroke="currentColor" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter"></path>',
                '          </svg>',
                '        </a>',
                '        ' + privateText,
                '      </div>'
            ].join('\n');
        }

        var leerBtn = (p.acceso === 'publico') ? [
            '      <a href="perspectiva.html#' + escapeHtml(p.slug) + '"' +
            ' onclick="try{sessionStorage.setItem(\'cw_perspectiva_slug\',\'' + escapeHtml(p.slug) + '\')}catch(e){}"' +
            ' class="text-link">',
            '        ' + escapeHtml(CW_I18N.t('readMore')),
            '        <img src="' + escapeHtml(CW_I18N.assetPath('assets/01-icons/chanwe-icons/chanwe-icon-arrow-upright-red.svg')) + '" alt="" class="text-link__icon">',
            '      </a>'
        ].join('\n') : '';

        var descText = p.descripcion || p.introduccion || '';
        var tagPills = buildTagPills(getTags(p), p.tipo || '');

        var linkRow = (leerBtn || linkRowEnd) ? [
            '    <div class="insight-row__link-row">',
            leerBtn,
            linkRowEnd,
            '    </div>'
        ].join('\n') : '';

        return [
            '<div class="insight-row" data-slug="' + escapeHtml(p.slug) + '">',
            '  <div class="insight-row__media">',
            '    <img src="' + escapeHtml(CW_I18N.assetPath(p.foto)) + '" alt="' + escapeHtml(p.fotoAlt || '') + '" class="insight-row__img" loading="lazy">',
            '  </div>',
            '  <div class="insight-row__content">',
            tagPills,
            '    <h4 class="insight-row__title">' + escapeHtml(p.titulo) + '</h4>',
            '    <p class="insight-row__desc">' + escapeHtml(descText) + '</p>',
            '    <div class="insight-row__meta">',
            '      <span>' + escapeHtml(p.fecha) + '</span>',
            '      <span class="insight-row__meta-sep" aria-hidden="true">&bull;</span>',
            '      <span>' + escapeHtml(p.tiempoLectura) + '</span>',
            '    </div>',
            linkRow,
            '  </div>',
            '</div>'
        ].join('\n');
    }

    /* Filtering */
    function getFiltered(all) {
        var q = _query.trim().toLowerCase();
        return all.filter(function (p) {
            if (_filters.tipo && (p.tipo || '') !== _filters.tipo) return false;
            if (_filters.tag && getTags(p).indexOf(_filters.tag) === -1) return false;
            if (_filters.date && getDateKey(p) !== _filters.date) return false;
            if (_filters.industria && (p.industria || '') !== _filters.industria) return false;
            if (q) {
                var hay = [p.titulo, p.descripcion, p.introduccion, p.fecha, p.tipo, p.industria]
                    .concat(getTags(p))
                    .filter(Boolean).join(' ').toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });
    }

    /* Listing render */
    function renderListing(filtered) {
        var container = document.getElementById('container-perspectivas');
        if (!container) return;

        var start = (_page - 1) * POSTS_PER_PAGE;
        var pageItems = filtered.slice(start, start + POSTS_PER_PAGE);

        if (pageItems.length === 0) {
            container.innerHTML = '<p class="cw-perspectivas__empty">' + escapeHtml(CW_I18N.t('noInsights')) + '</p>';
        } else {
            container.innerHTML = pageItems.map(buildPerspectivaCard).join('\n');
            if (window.applyScrollReveal) {
                var rows = container.querySelectorAll('.insight-row');
                if (rows.length) {
                    window.applyScrollReveal(rows, rows[0]);
                }
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            }
        }
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

    function renderPagination(total) {
        var el = document.getElementById('perspectivas-pagination');
        if (!el) return;

        var totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

        var chevLeft = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="butt" stroke-linejoin="miter"/></svg>';
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
                    scrollToPerspectivasMain();
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

    function buildSidebarCloud(elId, counts, activeVal, onPick) {
        var el = document.getElementById(elId);
        if (!el) return;

        var keys = Object.keys(counts).sort();
        if (!keys.length) { el.innerHTML = ''; return; }

        var html = keys.map(function (key) {
            var isActive = activeVal === key;
            return [
                '<button type="button" class="cw-tag cw-tag--filter' + (isActive ? ' is-active' : '') + '"' + sidebarPressedAttr(isActive) + ' data-value="' + escapeHtml(key) + '">',
                escapeHtml(key),
                ' <span class="cw-tag__count">(' + counts[key] + ')</span>',
                '</button>'
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
            'sidebar-tipo',
            countBy(all, function (p) { return p.tipo || ''; }),
            _filters.tipo,
            function (val) {
                markListingFiltersChanged();
                _filters.tipo = _filters.tipo === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToPerspectivasMain();
            }
        );

        buildSidebarCloud(
            'sidebar-tags',
            countBy(all, function (p) { return getTags(p); }),
            _filters.tag,
                function (val) {
                markListingFiltersChanged();
                _filters.tag = _filters.tag === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToPerspectivasMain();
            }
        );

        buildSidebarList(
            'sidebar-date',
            countBy(all, getDateKey),
            _filters.date,
            function (val) {
                markListingFiltersChanged();
                _filters.date = _filters.date === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToPerspectivasMain();
            },
            function (a, b) { return b.localeCompare(a); },
            formatDateKey
        );

        buildSidebarList(
            'sidebar-industria',
            countBy(all, function (p) { return p.industria || ''; }),
            _filters.industria,
                function (val) {
                markListingFiltersChanged();
                _filters.industria = _filters.industria === val ? '' : val;
                _page = 1;
                renderAll();
                scrollToPerspectivasMain();
            }
        );
    }

    /* Search */
    function initSearch() {
        var searchWrap = document.getElementById('perspectivas-search-wrap');
        var searchInput = document.getElementById('perspectivas-search');
        var searchClear = document.getElementById('perspectivas-search-clear');
        if (!searchInput) return;

        function syncClearUi() {
            var has = !!(searchInput.value && searchInput.value.trim());
            if (searchWrap) searchWrap.classList.toggle('cw-perspectivas__search--has-query', has);
            if (searchClear) searchClear.hidden = !has;
        }

        var searchScrollTimer = null;
        var searchDebounceTimer = null;
        var debounceMs = window.CW_LISTING_SEARCH_DEBOUNCE_MS || 300;

        searchInput.addEventListener('input', function () {
            _query = searchInput.value || '';
            _page = 1;
            syncClearUi();
            markListingFiltersChanged();
            if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(function () {
                renderAll();
                if (searchScrollTimer) clearTimeout(searchScrollTimer);
                searchScrollTimer = setTimeout(scrollToPerspectivasMain, 300);
            }, debounceMs);
        });

        if (searchClear) {
            searchClear.addEventListener('click', function () {
                searchInput.value = '';
                _query = '';
                _page = 1;
                syncClearUi();
                markListingFiltersChanged();
                if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
                renderAll();
                scrollToPerspectivasMain();
                searchInput.focus();
            });
        }
    }

    /* Render all */
    function renderAll() {
        if (!_cache) return;
        var filtered = getFiltered(_cache);
        renderListing(filtered);
        renderPagination(filtered.length);
        renderSidebar(_cache);
        announceListingCount(filtered.length);
    }

    function showError(container, msg) {
        if (!container) return;
        container.innerHTML = '<p class="body-text" style="color:var(--primary);">' + escapeHtml(msg) + '</p>';
    }

    /* Detail page */
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
        cwSetTagText(p.tipo || p.tag || '');

        cwSetTextByDynamic('stat', '');
        cwSetTextByDynamic('title', p.titulo);
        cwSetTextByDynamic('lead', p.descripcion);

        renderMdBlock('introduccion', p.introduccion);
        renderMdBlock('desarrollo',   p.desarrollo);
        renderMdBlock('conclusion',   p.conclusion);

        if (typeof cwSyncDetailBlocks === 'function') cwSyncDetailBlocks();

        cwSetHeroImage(p.foto, p.fotoAlt || '', null);

        if (p.pdf && p.pdf.trim() && p.acceso === 'publico') {
            var ctaEl = cwGetDynamicEl('cta');
            if (ctaEl) {
                var pdfLink = document.createElement('a');
                pdfLink.href = p.pdf;
                pdfLink.target = '_blank';
                pdfLink.rel = 'noopener';
                pdfLink.className = 'btn btn-secondary';
                pdfLink.href = CW_I18N.assetPath(p.pdf);
                pdfLink.textContent = CW_I18N.t('downloadPdf');
                ctaEl.insertBefore(pdfLink, ctaEl.firstChild);
            }
        }

        var titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = p.titulo + ' | Chanwe';
        var metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && p.descripcion) metaDesc.setAttribute('content', p.descripcion);
        var ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && p.titulo) ogTitle.setAttribute('content', p.titulo + ' | Chanwe');
        var ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc && p.descripcion) ogDesc.setAttribute('content', p.descripcion);
        CW_I18N.setCanonicalMeta('perspectiva.html', { slug: p.slug });

        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    /* Scroll reveal */
    function initPerspectivasScrollReveal(root) {
        if (!root || typeof window.applyScrollReveal !== 'function') return;
        var hero = root.querySelector('.cw-perspectivas__hero');
        var heroTargets = hero
            ? hero.querySelectorAll('.section-tag, .page-title, .page-lead, .highlight-brand')
            : [];
        var entryEls = Array.prototype.slice.call(heroTargets);
        if (entryEls.length) window.applyScrollReveal(entryEls, hero);
    }

    /* Init */
    document.addEventListener('DOMContentLoaded', function () {

        /* Listing */
        if (document.body && document.body.classList.contains('page-perspectivas')) {
            var root = document.getElementById('perspectivas') || document.getElementById('perspectivas-listagem');
            if (root) initPerspectivasScrollReveal(root);

            fetchPerspectivas()
                .then(function (all) {
                    renderAll();
                    initSearch();
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('container-perspectivas'),
                        CW_I18N.t('insightsLoadError') + ' (' + err.message + ')'
                    );
                });

            if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
            return;
        }

        /* Detail */
        if (document.body && document.body.classList.contains('page-perspectiva')) {
            var slug = getSlugParam();
            if (!slug) {
                showError(
                    document.getElementById('main-content'),
                    CW_I18N.t('insightMissing')
                );
                return;
            }

            fetchPerspectivas()
                .then(function (all) {
                    var p = all.find(function (x) { return x.slug === slug; });
                    if (!p) {
                        throw new Error(CW_I18N.locale === 'en'
                            ? 'Slug "' + slug + '" was not found in perspectivas/index.json.'
                            : 'Slug "' + slug + '" no existe en perspectivas/index.json.');
                    }
                    renderDetail(p);
                })
                .catch(function (err) {
                    showError(
                        document.getElementById('main-content'),
                        CW_I18N.t('insightLoadError') + ' (' + err.message + ')'
                    );
                });
        }
    });
})();
