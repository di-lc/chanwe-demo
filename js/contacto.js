/* ==========================================================================
   Contact page
   Scroll reveal, custom select, mailto form
   ========================================================================== */
(function () {
    'use strict';

    /* Config */
    var CW_I18N = window.CW_I18N || {
        t: function (key) { return key; }
    };

    var MAX_BODY = 1800;

    function isLocalDevHost() {
        var host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    }

    /** Static portfolio / GitHub Pages — no CRM, no real email. */
    function isPortfolioDemoSurface() {
        var host = window.location.hostname || '';
        if (host.endsWith('github.io')) return true;
        if (window.__CHANWE_DEMO__ === true) return true;
        if ((window.location.pathname || '').indexOf('/chanwe-demo') !== -1) return true;
        return false;
    }

    function getCrmApiBase() {
        // Never call production Chanwe CRM from this site package.
        return '/api/public';
    }

    function buildDemoSlots() {
        var out = [];
        var cursor = new Date();
        var guard = 0;
        while (out.length < 12 && guard < 21) {
            guard += 1;
            cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
            var day = cursor.getDay();
            if (day === 0 || day === 6) continue;
            ['10:00', '11:30', '15:00'].forEach(function (time) {
                var parts = time.split(':');
                var starts = new Date(cursor);
                starts.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
                var y = starts.getFullYear();
                var m = String(starts.getMonth() + 1).padStart(2, '0');
                var d = String(starts.getDate()).padStart(2, '0');
                out.push({
                    startsAt: starts.toISOString(),
                    dateKey: y + '-' + m + '-' + d,
                    time: time
                });
            });
        }
        return out;
    }

    function showDemoSuccess(successEl, messageEl, message) {
        var form = document.getElementById('contact-form');
        if (form) form.hidden = true;
        if (messageEl && message) messageEl.textContent = message;
        if (successEl) {
            successEl.hidden = false;
            successEl.focus();
        }
    }

    function normalizeFetchError(message) {
        if (message !== 'Failed to fetch') return message;
        if (!isLocalDevHost()) return message;
        return document.documentElement.lang === 'en'
            ? 'Could not reach the calendar. Run npm start in chanwe-main to test meeting times locally.'
            : 'No pudimos conectar con la agenda. En local ejecutá npm start en chanwe-main para probar los horarios.';
    }

    /* Scroll reveal */
    function initScrollReveal() {
        if (typeof window.applyScrollReveal !== 'function') return;
        var root = document.getElementById('contacto-content');
        if (!root || typeof window.cwRevealContentSelectors !== 'string') return;
        window.applyScrollReveal(root.querySelectorAll(window.cwRevealContentSelectors), root);
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }

    /* Custom dropdowns */
    function initCustomSelect() {
        if (typeof window.cwInitCustomSelects === 'function') {
            window.cwInitCustomSelects('#contact-form .custom-select');
        }
    }

    /* Contact form + optional first-meeting request */
    function initContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        var isEnglish = document.documentElement.lang === 'en';
        var booking = form.querySelector('.contacto__booking');
        var bookingToggle = document.getElementById('contacto-booking-toggle');
        var bookingOptions = document.getElementById('contacto-booking-options');
        var bookingAction = bookingToggle ? bookingToggle.querySelector('.contacto__booking-toggle-action') : null;
        var bookingStatus = document.getElementById('contacto-booking-status');
        var bookingDates = document.getElementById('contacto-booking-dates');
        var bookingDatesBar = document.getElementById('contacto-booking-dates-bar');
        var bookingDatesThumb = document.getElementById('contacto-booking-dates-thumb');
        var bookingTimes = document.getElementById('contacto-booking-times');
        var bookingSelection = document.getElementById('contacto-booking-selection');
        var startsAtInput = document.getElementById('contacto-starts-at');
        var startsAtError = document.getElementById('contacto-starts-at-error');
        var phoneInput = document.getElementById('contacto-telefono');
        var phoneRequirement = document.getElementById('contacto-telefono-requirement');
        var submitButton = form.querySelector('.contacto__submit');
        var hint = form.querySelector('.contacto__hint');
        var formNote = form.querySelector('.contacto__form-note');
        var summary = form.querySelector('[data-form-error-summary]');
        var success = document.getElementById('contacto-booking-success');
        var newRequest = document.getElementById('contacto-booking-new-request');
        var bookingMode = false;
        var slots = [];
        var activeDateKey = '';
        var slotsLoaded = false;
        if (bookingTimes) bookingTimes.setAttribute('tabindex', '-1');

        var copy = isEnglish ? {
            show: 'View times',
            hide: 'Hide times',
            optional: '(optional)',
            required: '(required to request a meeting)',
            loading: 'Loading available times…',
            empty: 'There are no available times at the moment. Please try again later.',
            loadError: 'We could not load the calendar. Please try again in a few minutes.',
            selectSlot: 'Choose an available time.',
            submit: 'Request meeting',
            submitting: 'Sending request…',
            contactSubmit: 'Send message',
            bookingHint: 'In this demo the request only appears as scheduled. Nothing is emailed.',
            bookingNote: 'Demo only — no Google Meet invite and no Chanwe notification.',
            selectedSlot: 'Tentative time:',
            contactHint: 'In this demo the message is marked as sent. No email app opens.',
            contactNote: 'Static demo: no server and no real delivery.',
            requestError: 'We could not send the request. Please try again.',
            demoBookingSuccess: 'In this demo the meeting appears as scheduled. No email was sent.',
            demoContactSuccess: 'In this demo the message appears as sent. Nobody was notified.',
            locale: 'en-US'
        } : {
            show: 'Ver horarios',
            hide: 'Ocultar horarios',
            optional: '(opcional)',
            required: '(obligatorio para solicitar una reunión)',
            loading: 'Cargando horarios disponibles…',
            empty: 'No hay horarios disponibles por el momento. Intentá nuevamente más tarde.',
            loadError: 'No pudimos cargar la agenda. Intentá nuevamente en unos minutos.',
            selectSlot: 'Elegí uno de los horarios disponibles.',
            submit: 'Solicitar reunión',
            submitting: 'Enviando solicitud…',
            contactSubmit: 'Enviar mensaje',
            bookingHint: 'En esta demo la solicitud solo aparece como agendada. No se envía correo.',
            bookingNote: 'Solo demo — sin Google Meet ni aviso a Chanwe.',
            selectedSlot: 'Horario tentativo:',
            contactHint: 'En esta demo el mensaje se marca como enviado. No se abre el correo.',
            contactNote: 'Demo estática: no hay servidor ni envío real.',
            requestError: 'No pudimos enviar la solicitud. Intentá nuevamente.',
            demoBookingSuccess: 'En esta demo la reunión aparece como agendada. No se envió ningún correo.',
            demoContactSuccess: 'En esta demo el mensaje aparece como enviado. No se notificó a nadie.',
            locale: 'es-AR'
        };

        function formatDate(startsAt, options) {
            return new Intl.DateTimeFormat(copy.locale, Object.assign({
                timeZone: 'America/Argentina/Buenos_Aires'
            }, options)).format(new Date(startsAt));
        }

        function showSummary(message) {
            if (!summary) return;
            summary.textContent = message;
            summary.hidden = false;
        }

        function clearSlotError() {
            if (startsAtInput) startsAtInput.removeAttribute('aria-invalid');
            if (startsAtError) {
                startsAtError.textContent = '';
                startsAtError.hidden = true;
            }
        }

        function clearSelectionSummary() {
            if (!bookingSelection) return;
            bookingSelection.textContent = '';
            bookingSelection.hidden = true;
        }

        function updateSelectionSummary(startsAt) {
            if (!bookingSelection) return;
            if (!startsAt) {
                clearSelectionSummary();
                return;
            }
            bookingSelection.textContent = copy.selectedSlot + ' ' + formatDate(startsAt, {
                weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            });
            bookingSelection.hidden = false;
        }

        function setSelectedSlot(startsAt, button) {
            if (startsAtInput) startsAtInput.value = startsAt;
            bookingTimes.querySelectorAll('.contacto__booking-time').forEach(function (item) {
                item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
            });
            updateSelectionSummary(startsAt);
            clearSlotError();
        }

        function renderTimes(dateKey) {
            activeDateKey = dateKey;
            if (startsAtInput) startsAtInput.value = '';
            clearSelectionSummary();
            bookingDates.querySelectorAll('.contacto__booking-date').forEach(function (button) {
                button.setAttribute('aria-pressed', button.dataset.dateKey === dateKey ? 'true' : 'false');
            });
            bookingTimes.innerHTML = '';
            slots.filter(function (slot) { return slot.dateKey === dateKey; }).forEach(function (slot) {
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'contacto__booking-time';
                button.textContent = slot.time;
                button.setAttribute('aria-pressed', 'false');
                button.setAttribute('aria-label', formatDate(slot.startsAt, {
                    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                }));
                button.addEventListener('click', function () { setSelectedSlot(slot.startsAt, button); });
                bookingTimes.appendChild(button);
            });
        }

        function setBookingGridCols(count) {
            var cols = String(Math.min(Math.max(count, 1), 7));
            if (bookingDates) bookingDates.style.setProperty('--booking-cols', cols);
            if (bookingTimes) bookingTimes.style.setProperty('--booking-cols', cols);
        }

        function syncBookingDatesScrollBar() {
            if (!bookingDates || !bookingDatesBar || !bookingDatesThumb) return;
            if (!window.matchMedia('(max-width: 768px)').matches) {
                bookingDatesBar.hidden = true;
                return;
            }
            var maxScroll = bookingDates.scrollWidth - bookingDates.clientWidth;
            if (maxScroll <= 1) {
                bookingDatesBar.hidden = true;
                bookingDatesThumb.style.width = '0';
                bookingDatesThumb.style.left = '0';
                return;
            }
            bookingDatesBar.hidden = false;
            var trackWidth = bookingDatesBar.clientWidth;
            var thumbWidth = Math.max((bookingDates.clientWidth / bookingDates.scrollWidth) * trackWidth, trackWidth * 0.2);
            var maxThumbLeft = trackWidth - thumbWidth;
            var thumbLeft = maxScroll > 0 ? (bookingDates.scrollLeft / maxScroll) * maxThumbLeft : 0;
            bookingDatesThumb.style.width = thumbWidth + 'px';
            bookingDatesThumb.style.left = thumbLeft + 'px';
        }

        function bindBookingDatesScrollBar() {
            if (!bookingDates || bookingDates.dataset.scrollbarBound === 'true') return;
            bookingDates.dataset.scrollbarBound = 'true';
            bookingDates.addEventListener('scroll', syncBookingDatesScrollBar, { passive: true });
            window.addEventListener('resize', syncBookingDatesScrollBar);
        }

        function renderSlots() {
            var dateKeys = [];
            slots.forEach(function (slot) {
                if (dateKeys.indexOf(slot.dateKey) === -1 && dateKeys.length < 7) dateKeys.push(slot.dateKey);
            });
            setBookingGridCols(dateKeys.length);
            bookingDates.innerHTML = '';
            bookingTimes.innerHTML = '';
            dateKeys.forEach(function (dateKey) {
                var representative = slots.find(function (slot) { return slot.dateKey === dateKey; });
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'contacto__booking-date';
                button.dataset.dateKey = dateKey;
                button.textContent = formatDate(representative.startsAt, { weekday: 'short', day: 'numeric', month: 'short' });
                button.setAttribute('aria-pressed', 'false');
                button.addEventListener('click', function () { renderTimes(dateKey); });
                bookingDates.appendChild(button);
            });
            if (dateKeys.length) renderTimes(dateKeys[0]);
            bindBookingDatesScrollBar();
            window.requestAnimationFrame(syncBookingDatesScrollBar);
        }

        function applyDemoSlots() {
            slots = buildDemoSlots();
            slotsLoaded = true;
            bookingStatus.classList.remove('is-error');
            bookingStatus.textContent = '';
            renderSlots();
        }

        function loadAvailability() {
            if (slotsLoaded) return Promise.resolve();
            if (isPortfolioDemoSurface()) {
                applyDemoSlots();
                return Promise.resolve();
            }
            bookingStatus.textContent = copy.loading;
            return fetch(getCrmApiBase() + '/meeting-availability', {
                headers: { Accept: 'application/json' }
            }).then(function (response) {
                return response.json().catch(function () { return {}; }).then(function (body) {
                    if (!response.ok) throw new Error(body.error || copy.loadError);
                    return body;
                });
            }).then(function (body) {
                slots = Array.isArray(body.slots) ? body.slots : [];
                slotsLoaded = true;
                bookingStatus.textContent = slots.length ? '' : copy.empty;
                renderSlots();
            }).catch(function () {
                // Static package / no CRM — keep the UI usable with fictional slots.
                applyDemoSlots();
            });
        }

        function setBookingMode(active) {
            bookingMode = Boolean(active);
            booking.classList.toggle('is-active', bookingMode);
            bookingToggle.setAttribute('aria-expanded', bookingMode ? 'true' : 'false');
            bookingOptions.hidden = !bookingMode;
            bookingAction.textContent = bookingMode ? copy.hide : copy.show;
            phoneInput.required = bookingMode;
            phoneRequirement.textContent = bookingMode ? copy.required : copy.optional;
            submitButton.textContent = bookingMode ? copy.submit : copy.contactSubmit;
            hint.textContent = bookingMode ? copy.bookingHint : copy.contactHint;
            formNote.textContent = bookingMode ? copy.bookingNote : copy.contactNote;
            if (!bookingMode) {
                startsAtInput.value = '';
                clearSlotError();
                clearSelectionSummary();
            } else {
                loadAvailability();
            }
        }

        if (typeof window.cwBindFormErrorClear === 'function') {
            window.cwBindFormErrorClear(form);
        }

        bookingToggle.addEventListener('click', function () { setBookingMode(!bookingMode); });
        if (newRequest) {
            newRequest.addEventListener('click', function () {
                window.location.href = window.location.pathname + '?meeting=1';
            });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (typeof window.cwValidateForm === 'function' && !window.cwValidateForm(form)) return;

            var fd = new FormData(form);
            var nombre = (fd.get('nombre') || '').toString().trim();
            var email = (fd.get('email') || '').toString().trim();
            var empresa = (fd.get('empresa') || '').toString().trim();
            var telefono = (fd.get('telefono') || '').toString().trim();
            var asunto = (fd.get('asunto') || '').toString().trim();
            var mensaje = (fd.get('mensaje') || '').toString().trim();

            if (!nombre || !email || !mensaje || !asunto) return;

            var successMessage = document.getElementById('contacto-booking-success-message');

            if (bookingMode) {
                var startsAt = (fd.get('starts_at') || '').toString();
                if (!startsAt) {
                    startsAtInput.setAttribute('aria-invalid', 'true');
                    startsAtError.textContent = copy.selectSlot;
                    startsAtError.hidden = false;
                    showSummary(copy.selectSlot);
                    bookingTimes.focus();
                    return;
                }

                // Portfolio / static demo: show scheduled, never call CRM or send email.
                if (isPortfolioDemoSurface()) {
                    showDemoSuccess(success, successMessage, copy.demoBookingSuccess);
                    return;
                }

                submitButton.disabled = true;
                submitButton.setAttribute('aria-busy', 'true');
                submitButton.textContent = copy.submitting;
                fetch(getCrmApiBase() + '/meeting-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        name: nombre,
                        email: email,
                        phone: telefono,
                        company: empresa,
                        role: (fd.get('rol') || '').toString().trim(),
                        linkedin: (fd.get('linkedin') || '').toString().trim(),
                        referral: (fd.get('como_nos_conociste') || '').toString().trim(),
                        subject: asunto,
                        message: mensaje,
                        startsAt: startsAt,
                        website: (fd.get('website') || '').toString()
                    })
                }).then(function (response) {
                    return response.json().catch(function () { return {}; }).then(function (body) {
                        if (!response.ok) throw new Error(body.error || copy.requestError);
                        return body;
                    });
                }).then(function () {
                    showDemoSuccess(success, successMessage, copy.demoBookingSuccess);
                }).catch(function () {
                    // No CRM on static hosts — still complete as a demo booking.
                    showDemoSuccess(success, successMessage, copy.demoBookingSuccess);
                }).finally(function () {
                    submitButton.disabled = false;
                    submitButton.removeAttribute('aria-busy');
                    submitButton.textContent = copy.submit;
                });
                return;
            }

            // Contact message: never open a real mailbox from the portfolio demo.
            showDemoSuccess(success, successMessage, copy.demoContactSuccess);
        });

        var requestedMode = new URLSearchParams(window.location.search).get('meeting');
        if (requestedMode === '1' || requestedMode === 'true') {
            setBookingMode(true);
            window.setTimeout(function () {
                booking.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }

    /* Boot */
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || !document.body.classList.contains('page-contacto')) return;
        initScrollReveal();
        initCustomSelect();
        initContactForm();
    });
})();
