//==========================================================
// SECTION 24e: DocsDoodads.Ui FEEDBACK (PROGRESS PILLS, TOOLTIPS)
//==========================================================
// Long jobs (indexing, packing, Auto-Slice, importing) show a small pill with a bar and Cancel, all in
// one place, and never block the editor. Buttons get a themed tooltip with their shortcut after a moment.
DocsDoodads.Ui.css += `
/* Progress pills: top right of the map. */
#dd-progress-stack { position: fixed; top: 84px; right: 16px; z-index: 10024; display: flex; flex-direction: column; gap: 6px; align-items: flex-end; pointer-events: none; }
.dd-progress {
    pointer-events: auto; display: flex; align-items: center; gap: 8px; min-width: 220px; max-width: 320px; padding: 6px 6px 6px 12px;
    border-radius: 18px; font-family: var(--dd-font); font-size: 11px; font-weight: 800; color: var(--dd-text); background: var(--dd-panel);
    border: 2px solid var(--dd-line); box-shadow: 0 3px 0 var(--dd-line), 0 8px 20px rgba(20, 16, 40, 0.22); animation: dd-rise 0.18s ease;
}
.dd-progress .dd-progress-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dd-progress .dd-progress-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dd-progress .dd-progress-track { height: 6px; border-radius: 6px; background: var(--dd-line-soft); overflow: hidden; }
.dd-progress .dd-progress-bar { height: 100%; width: 0%; border-radius: 6px; background: var(--dd-primary); transition: width 0.2s ease; }
.dd-progress.dd-progress-unknown .dd-progress-bar { width: 35%; animation: dd-progress-slide 1.1s ease-in-out infinite; }
.dd-progress .dd-btn { padding: 3px 9px; font-size: 11px; border-radius: 12px; }
@keyframes dd-progress-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }

/* Tooltips: the button's name, and its shortcut in a key cap. */
#dd-tooltip {
    position: fixed; z-index: 10070; pointer-events: none; max-width: 280px; padding: 5px 9px; border-radius: 10px;
    font-family: var(--dd-font); font-size: 11px; font-weight: 800; line-height: 1.35; color: #ffffff; background: rgba(31, 27, 48, 0.92);
    box-shadow: 0 6px 16px rgba(20, 16, 40, 0.3); animation: dd-rise 0.12s ease;
}
#dd-tooltip kbd {
    display: inline-block; margin-left: 6px; padding: 0 5px; border-radius: 5px; font-family: inherit; font-size: 10px; font-weight: 900;
    color: #2f2a43; background: #ffffff; box-shadow: 0 2px 0 #b9b3cc;
}
`;

Object.assign(DocsDoodads.Ui, {
    // ---- Progress pills ----
    // label: what is happening. opts: { onCancel (shows Cancel), delay (ms before the pill shows, so quick
    // jobs never flash one) }. Returns { update(done, total, text), finish(), cancelled }.
    progress(label, opts = {}) {
        const U = this;
        const handle = {
            label, done: 0, total: 0, text: '', cancelled: false, finished: false, el: null,
            update(done, total, text) {
                this.done = Number(done) || 0;
                this.total = Number(total) || 0;
                if (text !== undefined) this.text = String(text);
                U.drawProgress(this);
                return this;
            },
            cancel() {
                if (this.cancelled || this.finished) return;
                this.cancelled = true;
                this.text = 'Cancelling…';
                U.drawProgress(this);
                if (typeof opts.onCancel === 'function') opts.onCancel();
            },
            finish() {
                this.finished = true;
                clearTimeout(this._timer);
                if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
                this.el = null;
                U._progress = (U._progress || []).filter(h => h !== this);
                return this;
            }
        };
        handle.cancellable = typeof opts.onCancel === 'function';
        this._progress = (this._progress || []).concat([handle]);
        const show = () => { if (!handle.finished) { handle.shown = true; U.drawProgress(handle); } };
        if (opts.delay > 0) handle._timer = setTimeout(show, opts.delay); else show();
        if (handle._timer && typeof handle._timer.unref === 'function') handle._timer.unref();
        return handle;
    },

    activeProgress() {
        return (this._progress || []).slice();
    },

    progressText(h) {
        const count = h.total > 0 ? ` ${Math.min(h.done, h.total)}/${h.total}` : '';
        return h.text ? `${h.label}${count} · ${h.text}` : `${h.label}${count}`;
    },

    drawProgress(h) {
        if (!h.shown || h.finished || typeof document === 'undefined' || !document.createElement) return;
        let stack = document.getElementById('dd-progress-stack');
        if (!stack) {
            stack = document.createElement('div');
            stack.id = 'dd-progress-stack';
            (document.body || document.documentElement).appendChild(stack);
            const W = DocsDoodads.Workspace;
            if (W && W.placeReadouts) W.placeReadouts();
        }
        if (!h.el) {
            const el = document.createElement('div');
            el.className = 'dd-progress';
            const bodyEl = document.createElement('div');
            bodyEl.className = 'dd-progress-body';
            const labelEl = document.createElement('div');
            labelEl.className = 'dd-progress-label';
            const track = document.createElement('div');
            track.className = 'dd-progress-track';
            const bar = document.createElement('div');
            bar.className = 'dd-progress-bar';
            track.appendChild(bar);
            bodyEl.appendChild(labelEl);
            bodyEl.appendChild(track);
            el.appendChild(bodyEl);
            if (h.cancellable) {
                const btn = document.createElement('button');
                btn.className = 'dd-btn';
                btn.type = 'button';
                btn.textContent = 'Cancel';
                btn.onclick = () => h.cancel();
                el.appendChild(btn);
                h.cancelButton = btn;
            }
            if (el.setAttribute) { el.setAttribute('role', 'progressbar'); el.setAttribute('aria-label', h.label); }
            stack.appendChild(el);
            h.el = el; h.labelEl = labelEl; h.barEl = bar;
        }
        h.labelEl.textContent = this.progressText(h);
        const known = h.total > 0;
        if (h.el.classList) h.el.classList.toggle('dd-progress-unknown', !known);
        h.barEl.style.width = known ? Math.round(Math.min(1, h.done / h.total) * 100) + '%' : '';
        if (h.el.setAttribute && known) h.el.setAttribute('aria-valuenow', String(Math.round(Math.min(1, h.done / h.total) * 100)));
        if (h.cancelButton) h.cancelButton.disabled = h.cancelled;
    },

    // ---- Tooltips ----
    // The shortcut at the end of a title, "Save everything (Ctrl+S)" -> ['Save everything', 'Ctrl+S'].
    splitTip(title) {
        const text = String(title || '').trim();
        const m = /^(.*\S)\s*\(([^()]+)\)$/.exec(text);
        const isKey = k => /^((Ctrl|Shift|Alt)\s*\+\s*)*([A-Z0-9`\[\]]|F\d{1,2}|Esc|Del|Delete|Enter|Space|Tab|Backspace)$/.test(k);
        if (m && isKey(m[2].trim())) return [m[1].replace(/[:\s]+$/, ''), m[2].trim().replace(/\s*\+\s*/g, '+')];
        return [text, ''];
    },

    // Editor elements with a title show it as a themed tooltip after a short rest (the browser's own
    // tooltip is turned off by moving the title to data-dd-tip; screen readers keep it as aria-label).
    tooltipDelay: 450,

    tipTarget(target) {
        if (!target || typeof target.closest !== 'function') return null;
        const el = target.closest('[title], [data-dd-tip]');
        if (!el || !el.closest('#dd-asset-workspace-root, .dd-glass, #dd-dialog-overlay')) return null;
        if (el.hasAttribute && el.hasAttribute('title')) {
            const title = el.getAttribute('title');
            el.removeAttribute('title');
            if (title) {
                el.setAttribute('data-dd-tip', title);
                if (!el.hasAttribute('aria-label') && !String(el.textContent || '').trim()) el.setAttribute('aria-label', title);
            }
        }
        return el.getAttribute && el.getAttribute('data-dd-tip') ? el : null;
    },

    showTooltip(el) {
        if (typeof document === 'undefined' || !el || !el.getAttribute) return null;
        this.hideTooltip();
        const [text, keys] = this.splitTip(el.getAttribute('data-dd-tip'));
        if (!text) return null;
        const tip = document.createElement('div');
        tip.id = 'dd-tooltip';
        tip.textContent = text;
        if (keys) {
            const kbd = document.createElement('kbd');
            kbd.textContent = keys;
            tip.appendChild(kbd);
        }
        (document.body || document.documentElement).appendChild(tip);
        let r = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, right: 0, top: 0, bottom: 0 };
        // Inside the zoomed workspace, rects are in its own units: to window pixels.
        const s = el.closest && el.closest('#dd-asset-workspace-root') && this.uiScale ? this.uiScale() : 1;
        if (s !== 1) r = { left: r.left * s, right: r.right * s, top: r.top * s, bottom: r.bottom * s };
        const roomW = (typeof window !== 'undefined' && window.innerWidth) || 816;
        const roomH = (typeof window !== 'undefined' && window.innerHeight) || 624;
        const w = tip.offsetWidth || 160, h = tip.offsetHeight || 24;
        const below = r.bottom + 8 + h < roomH;
        tip.style.left = Math.round(Math.max(6, Math.min(roomW - w - 6, (r.left + r.right) / 2 - w / 2))) + 'px';
        tip.style.top = Math.round(below ? r.bottom + 8 : Math.max(6, r.top - h - 8)) + 'px';
        this._tooltip = { tip, el };
        return tip;
    },

    hideTooltip() {
        clearTimeout(this._tipTimer);
        const t = this._tooltip;
        this._tooltip = null;
        if (t && t.tip.parentNode) t.tip.parentNode.removeChild(t.tip);
    },

    installTooltips() {
        if (this._tipHandlers || typeof document === 'undefined' || !document.addEventListener) return;
        const over = e => {
            const el = this.tipTarget(e.target);
            if (!el) { if (this._tooltip || this._tipFor) { this._tipFor = null; this.hideTooltip(); } return; }
            if (this._tipFor === el) return;
            this._tipFor = el;
            this.hideTooltip();
            this._tipTimer = setTimeout(() => { if (this._tipFor === el && el.isConnected !== false) this.showTooltip(el); }, this.tooltipDelay);
        };
        const away = () => { this._tipFor = null; this.hideTooltip(); };
        this._tipHandlers = { over, away };
        document.addEventListener('mouseover', over, true);
        document.addEventListener('mousedown', away, true);
        document.addEventListener('keydown', away, true);
        document.addEventListener('wheel', away, true);
    },

    removeTooltips() {
        const h = this._tipHandlers;
        this._tipHandlers = null;
        this._tipFor = null;
        this.hideTooltip();
        if (!h || typeof document === 'undefined') return;
        document.removeEventListener('mouseover', h.over, true);
        document.removeEventListener('mousedown', h.away, true);
        document.removeEventListener('keydown', h.away, true);
        document.removeEventListener('wheel', h.away, true);
    }
});
