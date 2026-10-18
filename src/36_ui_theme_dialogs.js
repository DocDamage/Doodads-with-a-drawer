//==========================================================
// SECTION 24d: DocsDoodads.Ui DIALOGS (QUESTION CARDS)
//==========================================================
// The editor's own cards in place of the browser's prompt, confirm and alert: they match the look, fit a
// small window, close with Esc (the cancel answer) and answer with Enter (the main button). Each returns
// a promise. One card at a time: opening another gives the one showing its cancel answer.
DocsDoodads.Ui.css += `
/* Question cards (names, confirmations, unsaved work). */
#dd-dialog-overlay {
    position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10060; display: flex; align-items: center; justify-content: center;
    background: rgba(31, 27, 48, 0.35); pointer-events: auto; font-family: var(--dd-font);
}
.dd-dialog { width: 400px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); overflow: auto; padding: 16px 18px; animation: dd-pop 0.22s ease; }
.dd-dialog .dd-pop-title { font-size: 15px; margin-bottom: 6px; }
.dd-dialog-text { font-size: 13px; font-weight: 700; line-height: 1.5; color: var(--dd-text); white-space: pre-line; margin-bottom: 12px; overflow-wrap: anywhere; }
.dd-dialog-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.dd-dialog-field input[type=text], .dd-dialog-field select { width: 100%; height: 34px; font-size: 13px !important; }
.dd-dialog-check { flex-direction: row; align-items: center; gap: 8px; font-size: 12px; color: var(--dd-text) !important; }
.dd-dialog-buttons { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.dd-dialog-buttons .dd-btn { min-width: 84px; padding: 7px 12px; font-size: 13px; }
.dd-dialog-stack .dd-dialog-buttons { flex-direction: column; align-items: stretch; }
.dd-dialog-danger { border-color: var(--dd-danger); }
.dd-dialog-danger .dd-pop-title { color: var(--dd-danger-dark) !important; }
`;

Object.assign(DocsDoodads.Ui, {
    _dialog: null,

    dialogOpen() {
        return Boolean(this._dialog);
    },

    // opts: { title, text, icon, tone ('danger'), stack (buttons one above the other), fields: [{ key, label, value, type ('text' | 'checkbox' |
    // 'select'), choices (suggestions for text), options ([{ value, label }] for select), placeholder }], buttons: [{ label, value, kind ('primary' | 'good' | 'danger'), main }],
    // cancelValue }. Resolves { button, values }: the button's value (cancelValue for Esc or a click
    // outside the card) and each field's value by key.
    dialog(opts = {}) {
        if (typeof document === 'undefined' || !document.createElement) {
            return Promise.resolve({ button: opts.cancelValue === undefined ? null : opts.cancelValue, values: {} });
        }
        if (this._dialog) this._dialog.finish(this._dialog.cancelValue, true);
        const U = this;
        const cancelValue = opts.cancelValue === undefined ? null : opts.cancelValue;
        const buttons = (opts.buttons && opts.buttons.length) ? opts.buttons : [{ label: 'OK', value: true, kind: 'primary' }];
        const main = buttons.find(b => b.main) || buttons.slice().reverse().find(b => b.value !== cancelValue) || buttons[buttons.length - 1];
        const make = (tag, className, text) => {
            const n = document.createElement(tag);
            if (className) n.className = className;
            if (text !== undefined) n.textContent = String(text);
            return n;
        };

        const overlay = make('div');
        overlay.id = 'dd-dialog-overlay';
        const card = make('div', 'dd-glass dd-dialog' + (opts.tone === 'danger' ? ' dd-dialog-danger' : '') + (opts.stack ? ' dd-dialog-stack' : ''));
        card.id = 'dd-dialog';
        if (card.setAttribute) {
            card.setAttribute('role', opts.tone === 'danger' ? 'alertdialog' : 'dialog');
            card.setAttribute('aria-modal', 'true');
            card.setAttribute('aria-labelledby', 'dd-dialog-title');
        }
        // The theme lives in the workspace; a card shown with the editor closed brings its own copy.
        const themed = document.getElementById && document.getElementById('dd-ui-style');
        if (!themed || themed.isConnected === false) {
            const style = make('style');
            style.textContent = this.styleText();
            overlay.appendChild(style);
        }

        const title = make('div', 'dd-pop-title');
        title.id = 'dd-dialog-title';
        title.innerHTML = this.icon(opts.icon || (opts.tone === 'danger' ? 'trash' : 'help'), 1);
        title.appendChild(make('span', '', opts.title || "Doc's Doodads"));
        card.appendChild(title);
        if (opts.text) {
            const text = make('div', 'dd-dialog-text', opts.text);
            text.id = 'dd-dialog-text';
            card.appendChild(text);
            if (card.setAttribute) card.setAttribute('aria-describedby', 'dd-dialog-text');
        }

        const inputs = [];
        (opts.fields || []).forEach((field, i) => {
            const id = 'dd-dialog-field-' + i;
            const wrap = make(field.type === 'checkbox' ? 'label' : 'div', 'dd-dialog-field' + (field.type === 'checkbox' ? ' dd-dialog-check' : ''));
            const input = make(field.type === 'select' ? 'select' : 'input');
            input.id = id;
            if (field.type === 'select') {
                for (const choice of field.options || []) {
                    const option = make('option', '', choice.label !== undefined ? choice.label : choice.value);
                    option.value = String(choice.value);
                    input.appendChild(option);
                }
                input.value = field.value === undefined ? '' : String(field.value);
                if (field.label) {
                    const label = make('label', 'dd-label', field.label);
                    if (label.setAttribute) label.setAttribute('for', id);
                    wrap.appendChild(label);
                }
                wrap.appendChild(input);
            } else if (field.type === 'checkbox') {
                input.type = 'checkbox';
                input.checked = Boolean(field.value);
                wrap.appendChild(input);
                wrap.appendChild(make('span', '', field.label || ''));
            } else {
                input.type = 'text';
                input.value = field.value === undefined || field.value === null ? '' : String(field.value);
                if (field.placeholder) input.placeholder = field.placeholder;
                if (field.label) {
                    const label = make('label', 'dd-label', field.label);
                    if (label.setAttribute) label.setAttribute('for', id);
                    wrap.appendChild(label);
                }
                wrap.appendChild(input);
                if (field.choices && field.choices.length) {
                    const list = make('datalist');
                    list.id = id + '-choices';
                    for (const choice of field.choices) {
                        const option = make('option');
                        option.value = String(choice);
                        list.appendChild(option);
                    }
                    wrap.appendChild(list);
                    if (input.setAttribute) input.setAttribute('list', list.id);
                }
            }
            inputs.push({ field, input });
            card.appendChild(wrap);
        });

        const row = make('div', 'dd-dialog-buttons');
        const buttonEls = buttons.map(b => {
            const btn = make('button', 'dd-btn' + (b.kind ? ' dd-btn-' + b.kind : ''), b.label);
            btn.type = 'button';
            btn.onclick = () => finish(b.value);
            row.appendChild(btn);
            return btn;
        });
        card.appendChild(row);
        overlay.appendChild(card);
        overlay.onclick = e => { if (e && e.target === overlay) finish(cancelValue); };

        const before = document.activeElement || null;
        const values = () => {
            const out = {};
            inputs.forEach(({ field, input }, i) => {
                out[field.key || i] = field.type === 'checkbox' ? Boolean(input.checked) : String(input.value || '');
            });
            return out;
        };
        // Every key goes to the card while it shows: the editor and the game don't see them.
        const onKey = e => {
            if (e.stopPropagation) e.stopPropagation();
            if (e.key === 'Escape') {
                if (e.preventDefault) e.preventDefault();
                finish(cancelValue);
            } else if (e.key === 'Enter') {
                if (e.target && e.target.tagName === 'BUTTON') return; // the focused button answers
                if (e.preventDefault) e.preventDefault();
                finish(main.value);
            } else if (e.key === 'Tab') {
                // Tab stays inside the card.
                const order = inputs.map(x => x.input).concat(buttonEls);
                const at = order.indexOf(document.activeElement);
                const next = e.shiftKey ? (at <= 0 ? order.length - 1 : at - 1) : (at < 0 || at >= order.length - 1 ? 0 : at + 1);
                if (order[next] && order[next].focus) {
                    if (e.preventDefault) e.preventDefault();
                    order[next].focus();
                }
            }
        };

        let resolve;
        const promise = new Promise(r => { resolve = r; });
        let done = false;
        function finish(value, quiet) {
            if (done) return;
            done = true;
            const result = { button: value, values: values() };
            if (document.removeEventListener) document.removeEventListener('keydown', onKey, true);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (U._dialog && U._dialog.finish === finish) U._dialog = null;
            if (!quiet) U.sound(value === cancelValue ? 'cancel' : 'ok');
            if (before && before.focus && before.isConnected !== false) {
                try { before.focus(); } catch (e) {}
            }
            resolve(result);
        }
        this._dialog = { finish, cancelValue, overlay, card, buttons: buttonEls, inputs: inputs.map(x => x.input) };

        if (document.addEventListener) document.addEventListener('keydown', onKey, true);
        (document.body || document.documentElement).appendChild(overlay);
        if (opts.tone === 'danger') this.sound('buzzer');
        const first = inputs.length ? inputs[0].input : buttonEls[buttons.indexOf(main)];
        if (first && first.focus) {
            try {
                first.focus();
                if (first.select && first.type === 'text') first.select();
            } catch (e) {}
        }
        return promise;
    },

    // Yes or no. opts: { title, ok, cancel, danger }. A danger question gets a red button.
    confirm(text, opts = {}) {
        return this.dialog({
            title: opts.title || (opts.danger ? 'Are you sure?' : 'Please check'),
            text, icon: opts.icon, tone: opts.danger ? 'danger' : undefined, cancelValue: false,
            buttons: [
                { label: opts.cancel || 'Cancel', value: false },
                { label: opts.ok || 'OK', value: true, kind: opts.danger ? 'danger' : 'primary' }
            ]
        }).then(r => r.button === true);
    },

    // A line of text, or null when cancelled. opts: { title, ok, choices, placeholder, label }.
    prompt(text, value = '', opts = {}) {
        return this.form({
            title: opts.title, text, ok: opts.ok, icon: opts.icon || 'wrench',
            fields: [{ key: 'value', value, choices: opts.choices, placeholder: opts.placeholder, label: opts.label }]
        }).then(values => values ? values.value : null);
    },

    // Several fields at once: their values by key, or null when cancelled. opts: { title, text, fields, ok, danger }.
    form(opts = {}) {
        return this.dialog({
            title: opts.title || 'Name it', text: opts.text, icon: opts.icon || 'wrench',
            tone: opts.danger ? 'danger' : undefined, fields: opts.fields || [], cancelValue: false,
            buttons: [
                { label: opts.cancel || 'Cancel', value: false },
                { label: opts.ok || 'OK', value: true, kind: opts.danger ? 'danger' : 'primary' }
            ]
        }).then(r => r.button === true ? r.values : null);
    },

    // A message with one button.
    alert(text, opts = {}) {
        return this.dialog({
            title: opts.title || 'Note', text, icon: opts.icon || 'info',
            buttons: [{ label: opts.ok || 'OK', value: true, kind: 'primary' }], cancelValue: true
        }).then(() => undefined);
    },

    // Pick one of several answers: resolves the chosen button's value (or cancelValue for Esc).
    choose(text, buttons, opts = {}) {
        return this.dialog(Object.assign({ text, buttons }, opts)).then(r => r.button);
    }
});

