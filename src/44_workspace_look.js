//==========================================================
// SECTION 25d: WORKSPACE LOOK (SIZE, THEME, MAP COLOURS) AND DETAILS MEMORY
//==========================================================
// More > Look: the editor's size, theme and map colours, with a key to what each map colour means.
// Details remembers which sections were open, and pinned sections stay at the top.
DocsDoodads.Ui.css += `
#dd-look-card { position: fixed; top: 90px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 330px; max-width: calc(100vw - 32px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
#dd-look-card label { display: flex; flex-direction: column; gap: 3px; font-size: 11px; }
#dd-look-card select { width: 100%; }
#dd-look-card .dd-look-key { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 10px; font-size: 11px; color: var(--dd-muted); }
#dd-look-card .dd-swatch { display: inline-block; width: 14px; height: 6px; border-radius: 3px; margin-right: 6px; vertical-align: 2px; }
.dd-glass summary .dd-pin { margin-left: auto; border: none; background: transparent; color: var(--dd-faint); cursor: pointer; font-size: 13px; line-height: 1; padding: 0 2px; }
.dd-glass summary .dd-pin.dd-pinned { color: var(--dd-warn); }
.dd-glass summary .dd-pin:hover { color: var(--dd-primary); }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Size: the workspace is drawn larger with CSS zoom ----
    // In MZ's Chromium, rects inside a zoomed element come back in its own (unzoomed) units, so placing
    // things inside the workspace needs no conversion; only the window size (and anything placed outside
    // the workspace from a rect inside it) is converted, with these.
    uiScaleNow() {
        return DocsDoodads.Ui.uiScale();
    },

    // The window's width and height in the workspace's own units.
    roomSize() {
        const s = this.uiScaleNow();
        const w = (typeof window !== 'undefined' && window.innerWidth) || 816;
        const h = (typeof window !== 'undefined' && window.innerHeight) || 624;
        return { w: w / s, h: h / s };
    },

    applyScale() {
        const root = this.container;
        if (!root || !root.style) return;
        const s = this.uiScaleNow();
        const room = this.roomSize();
        root.style.zoom = s === 1 ? '' : String(s);
        root.style.width = s === 1 ? '100vw' : Math.floor(room.w) + 'px';
        root.style.height = s === 1 ? '100vh' : Math.floor(room.h) + 'px';
    },

    // ---- The Look card ----
    setLook(key, value) {
        const U = DocsDoodads.Ui;
        if (key === 'uiScale') value = U.scales.includes(Number(value)) ? Number(value) : 1;
        else if (key === 'theme') value = U.themes.some(t => t.value === value) ? value : 'light';
        else if (key === 'mapColors') value = value === 'safe' ? 'safe' : 'standard';
        else return false;
        U.setPref(key, value);
        U.applyLook();
        this.applyScale();
        if (this.mounted) this.layoutPanels();
        this.updateCollisionLegend();
        if (typeof document !== 'undefined' && document.getElementById('dd-look-card')) this.showLookCard();
        return true;
    },

    showLookCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui;
        let card = document.getElementById('dd-look-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-look-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const option = (value, label, current) => `<option value="${value}"${String(value) === String(current) ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        const hex = c => '#' + c.toString(16).padStart(6, '0');
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('eye', 1)} Look</span>
                <button class="dd-btn dd-fold" id="dd-look-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <label>Editor size<select id="dd-look-scale">${U.scales.map(s => option(s, Math.round(s * 100) + '%', U.uiScale())).join('')}</select></label>
            <label>Theme<select id="dd-look-theme">${U.themes.map(t => option(t.value, t.label, U.theme())).join('')}</select></label>
            <label>Map colours<select id="dd-look-colors">${option('standard', 'Standard', U.mapColorMode())}${option('safe', 'Colour-blind safe', U.mapColorMode())}</select></label>
            <div class="dd-label" style="margin: 2px 0 0;">What the map colours mean</div>
            <div class="dd-look-key" id="dd-look-key">${U.mapColorMeanings.map(([name, text]) =>
                `<div><span class="dd-swatch" style="background: ${hex(U.mapColor(name))};"></span>${escapeHtml(text)}</div>`).join('')}</div>
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Kept on this computer. Collision colours have their own key while Show Collision is on.</div>`;
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onchange = e => run(e.target.value); };
        on('dd-look-scale', v => this.setLook('uiScale', v));
        on('dd-look-theme', v => this.setLook('theme', v));
        on('dd-look-colors', v => this.setLook('mapColors', v));
        const close = document.getElementById('dd-look-close');
        if (close) close.onclick = () => this.closeLookCard();
        return card;
    },

    closeLookCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-look-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },

    // ---- Details memory: open sections stay open, pinned ones go to the top ----
    refreshInspector() {
        this.renderInspector();
        this.applyDetailsMemory(typeof document !== 'undefined' ? document.getElementById('dd-inspector-content') : null);
    },

    detailsKey(summary) {
        const text = summary ? String(summary.textContent || '') : '';
        return text.replace(/[☆★]/g, '').replace(/\s+/g, ' ').trim();
    },

    toggleDetailsPin(key) {
        const U = DocsDoodads.Ui;
        const pinned = (U.prefs().detailsPinned || []).filter(k => typeof k === 'string');
        const next = pinned.includes(key) ? pinned.filter(k => k !== key) : pinned.concat([key]);
        U.setPref('detailsPinned', next);
        this.refreshInspector();
        return next.includes(key);
    },

    applyDetailsMemory(root) {
        if (!root || typeof root.querySelectorAll !== 'function' || typeof document === 'undefined') return;
        const U = DocsDoodads.Ui;
        const prefs = U.prefs();
        const open = prefs.detailsOpen && typeof prefs.detailsOpen === 'object' ? prefs.detailsOpen : {};
        const pinned = Array.isArray(prefs.detailsPinned) ? prefs.detailsPinned : [];
        const pinnedEls = [];
        for (const d of Array.from(root.querySelectorAll('details'))) {
            // Only the outer sections: a section inside a section folds with it.
            const outer = d.parentNode && typeof d.parentNode.closest === 'function' ? d.parentNode.closest('details') : null;
            if (outer) continue;
            const summary = d.querySelector ? d.querySelector('summary') : null;
            const key = this.detailsKey(summary);
            if (!key) continue;
            if (Object.prototype.hasOwnProperty.call(open, key)) d.open = Boolean(open[key]);
            if (d.addEventListener && !d._ddRemember) {
                d._ddRemember = true;
                d.addEventListener('toggle', () => {
                    const now = Object.assign({}, U.prefs().detailsOpen || {});
                    now[key] = Boolean(d.open);
                    U.setPref('detailsOpen', now);
                });
            }
            const isPinned = pinned.includes(key);
            if (!(summary.querySelector && summary.querySelector('.dd-pin'))) {
                const pin = document.createElement('button');
                pin.type = 'button';
                pin.className = 'dd-pin' + (isPinned ? ' dd-pinned' : '');
                pin.textContent = isPinned ? '★' : '☆';
                pin.title = isPinned ? 'Unpin: back to its place' : 'Pin to the top of Details';
                pin.onclick = e => {
                    if (e && e.preventDefault) e.preventDefault();
                    if (e && e.stopPropagation) e.stopPropagation();
                    this.toggleDetailsPin(key);
                };
                summary.appendChild(pin);
            }
            if (isPinned) pinnedEls.push({ d, at: pinned.indexOf(key) });
        }
        // Pinned sections first, in the order they were pinned, ahead of the other sections beside them.
        pinnedEls.sort((a, b) => b.at - a.at);
        for (const { d } of pinnedEls) {
            const parent = d.parentNode;
            if (!parent || !parent.insertBefore) continue;
            const first = Array.from(parent.childNodes || parent.children || []).find(c => c && c.tagName === 'DETAILS');
            if (first && first !== d) parent.insertBefore(d, first);
        }
    }
});
