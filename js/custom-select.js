/* ==========================================================================
   Custom select
   ARIA listbox + keyboard; call cwInitCustomSelects(rootSelector) per page
   ========================================================================== */
(function () {
    'use strict';

    function setListboxExpanded(dropdown, trigger, expanded) {
        dropdown.classList.toggle('active', expanded);
        if (trigger) trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function syncOptionSelected(options, opt) {
        options.forEach(function (o) {
            o.classList.remove('selected');
            o.setAttribute('aria-selected', 'false');
        });
        opt.classList.add('selected');
        opt.setAttribute('aria-selected', 'true');
    }

    function getSelectErrorEl(dropdown) {
        var hidden = dropdown.querySelector('input[type="hidden"]');
        if (hidden && hidden.id) {
            return document.getElementById(hidden.id + '-error');
        }
        return dropdown.querySelector('.form-error[data-select-error]');
    }

    window.cwClearCustomSelectError = function (dropdown) {
        if (!dropdown) return;
        var trigger = dropdown.querySelector('.select-trigger');
        if (trigger) trigger.removeAttribute('aria-invalid');
        var errorEl = getSelectErrorEl(dropdown);
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.hidden = true;
        }
    };

    window.cwSetCustomSelectError = function (dropdown, message) {
        if (!dropdown) return;
        var trigger = dropdown.querySelector('.select-trigger');
        var errorEl = getSelectErrorEl(dropdown);
        if (trigger) trigger.setAttribute('aria-invalid', 'true');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
    };

    function initCustomSelects(rootSelector) {
        if (!rootSelector || typeof rootSelector !== 'string') {
            return;
        }

        document.querySelectorAll(rootSelector).forEach(function (dropdown) {
            var trigger = dropdown.querySelector('.select-trigger');
            var options = dropdown.querySelectorAll('.select-option');
            var hiddenInput = dropdown.querySelector('input[type="hidden"]');
            var selectedText = dropdown.querySelector('.selected-text');

            if (!trigger || !hiddenInput || !selectedText || !options.length) {
                return;
            }

            function closeOthers() {
                document.querySelectorAll(rootSelector).forEach(function (d) {
                    if (d !== dropdown) {
                        setListboxExpanded(d, d.querySelector('.select-trigger'), false);
                    }
                });
            }

            function toggle() {
                var open = !dropdown.classList.contains('active');
                closeOthers();
                setListboxExpanded(dropdown, trigger, open);
            }

            function selectOption(opt) {
                var val = opt.getAttribute('data-value');
                hiddenInput.value = val || '';
                selectedText.innerText = opt.innerText;
                syncOptionSelected(options, opt);
                setListboxExpanded(dropdown, trigger, false);
                if (typeof window.cwClearCustomSelectError === 'function') {
                    window.cwClearCustomSelectError(dropdown);
                }
            }

            trigger.addEventListener('click', function (e) {
                e.preventDefault();
                toggle();
            });

            trigger.addEventListener('keydown', function (e) {
                var k = e.key;
                if (k === 'Enter' || k === ' ') {
                    e.preventDefault();
                    toggle();
                    return;
                }
                if (k === 'Escape') {
                    if (dropdown.classList.contains('active')) {
                        e.preventDefault();
                        setListboxExpanded(dropdown, trigger, false);
                    }
                    return;
                }
                if (k === 'ArrowDown' || k === 'ArrowUp') {
                    e.preventDefault();
                    var list = Array.prototype.slice.call(options);
                    if (!dropdown.classList.contains('active')) {
                        setListboxExpanded(dropdown, trigger, true);
                        var edge = k === 'ArrowDown' ? list[0] : list[list.length - 1];
                        if (edge) edge.focus();
                        return;
                    }
                    var idx = list.indexOf(document.activeElement);
                    if (idx < 0) idx = k === 'ArrowDown' ? -1 : list.length;
                    var next = k === 'ArrowDown'
                        ? list[Math.min(list.length - 1, idx + 1)]
                        : list[Math.max(0, idx - 1)];
                    if (next) next.focus();
                }
            });

            options.forEach(function (opt) {
                opt.setAttribute('tabindex', '-1');
                opt.setAttribute('aria-selected', opt.classList.contains('selected') ? 'true' : 'false');
                opt.addEventListener('click', function () {
                    selectOption(opt);
                });
                opt.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectOption(opt);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setListboxExpanded(dropdown, trigger, false);
                        trigger.focus();
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        var list = Array.prototype.slice.call(options);
                        var idx = list.indexOf(opt);
                        var next = e.key === 'ArrowDown'
                            ? list[Math.min(list.length - 1, idx + 1)]
                            : list[Math.max(0, idx - 1)];
                        if (next) next.focus();
                    }
                });
            });

            if (hiddenInput.value) {
                options.forEach(function (opt) {
                    if (opt.getAttribute('data-value') === hiddenInput.value) {
                        selectedText.innerText = opt.innerText;
                        syncOptionSelected(options, opt);
                    }
                });
            }
        });

        window.addEventListener('click', function (e) {
            if (!e.target.closest(rootSelector)) {
                document.querySelectorAll(rootSelector).forEach(function (d) {
                    setListboxExpanded(d, d.querySelector('.select-trigger'), false);
                });
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            document.querySelectorAll(rootSelector + '.active').forEach(function (d) {
                var t = d.querySelector('.select-trigger');
                setListboxExpanded(d, t, false);
                if (t) t.focus();
            });
        });
    }

    window.cwInitCustomSelects = initCustomSelects;
})();
