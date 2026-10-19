/* ==========================================================================
   Form accessibility
   Visible errors, aria-invalid, aria-live summaries
   ========================================================================== */
(function () {
    'use strict';

    function t(key) {
        var i18n = window.CW_I18N;
        return i18n && typeof i18n.t === 'function' ? i18n.t(key) : key;
    }

    function errorElForField(field) {
        if (!field || !field.id) return null;
        return document.getElementById(field.id + '-error');
    }

    window.cwGetFieldErrorMessage = function (field) {
        if (!field || !field.validity) return t('fieldRequired');
        if (field.validity.valueMissing) return t('fieldRequired');
        if (field.type === 'email' && field.validity.typeMismatch) return t('fieldEmailInvalid');
        if (field.validity.typeMismatch || field.validity.patternMismatch) return t('fieldInvalid');
        return t('fieldRequired');
    };

    window.cwSetFieldError = function (field, message) {
        if (!field) return;
        var errorEl = errorElForField(field);
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
    };

    window.cwClearFieldError = function (field) {
        if (!field) return;
        field.removeAttribute('aria-invalid');
        var errorEl = errorElForField(field);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
    };

    window.cwClearFormErrors = function (form) {
        if (!form) return;
        form.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
            el.removeAttribute('aria-invalid');
        });
        form.querySelectorAll('.form-error').forEach(function (el) {
            el.textContent = '';
            el.hidden = true;
        });
        form.querySelectorAll('.custom-select').forEach(function (dropdown) {
            if (typeof window.cwClearCustomSelectError === 'function') {
                window.cwClearCustomSelectError(dropdown);
            }
        });
    };

    window.cwValidateForm = function (form) {
        if (!form) return false;

        window.cwClearFormErrors(form);

        var firstFocus = null;
        var invalid = false;

        form.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(function (field) {
            if (field.disabled || !field.willValidate) return;
            if (field.checkValidity()) return;

            invalid = true;
            window.cwSetFieldError(field, window.cwGetFieldErrorMessage(field));
            if (!firstFocus) firstFocus = field;
        });

        form.querySelectorAll('.custom-select').forEach(function (dropdown) {
            var hidden = dropdown.querySelector('input[type="hidden"]');
            if (!hidden || !hidden.required) return;
            if ((hidden.value || '').trim()) return;

            invalid = true;
            if (typeof window.cwSetCustomSelectError === 'function') {
                window.cwSetCustomSelectError(dropdown, t('fieldSelectRequired'));
            }
            var trigger = dropdown.querySelector('.select-trigger');
            if (!firstFocus && trigger) firstFocus = trigger;
        });

        var summary = form.querySelector('[data-form-error-summary]');
        if (invalid) {
            if (summary) {
                summary.textContent = t('formInvalidSummary');
                summary.hidden = false;
            }
            if (firstFocus && typeof firstFocus.focus === 'function') {
                firstFocus.focus();
            }
        } else if (summary) {
            summary.textContent = '';
            summary.hidden = true;
        }

        return !invalid;
    };

    window.cwBindFormErrorClear = function (form) {
        if (!form) return;
        form.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(function (field) {
            var clear = function () { window.cwClearFieldError(field); };
            field.addEventListener('input', clear);
            field.addEventListener('change', clear);
        });
    };

    window.cwSetButtonLoading = function (btn, loading) {
        if (!btn) return;
        var on = !!loading;
        btn.classList.toggle('is-loading', on);
        if (on) {
            btn.setAttribute('aria-busy', 'true');
            btn.disabled = true;
        } else {
            btn.removeAttribute('aria-busy');
            btn.disabled = false;
        }
    };
})();
