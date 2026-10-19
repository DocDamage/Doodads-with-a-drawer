//==========================================================
// SECTION 25m: KEYBOARD SHORTCUTS CARD
//==========================================================
// More > Keyboard Shortcuts: every binding in DocsDoodads.Shortcuts, grouped, with each key as a button.
// Click it and press the new keys (Esc keeps the old ones); a key already in use asks before it moves.
// What the keys do is runShortcut, which the key handler (part 45) calls.
DocsDoodads.Ui.css += `
#dd-keys-card { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 440px; max-width: calc(100vw - 32px); max-height: calc(100vh - 110px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
#dd-keys-card .dd-keys-list { overflow-y: auto; display: flex; flex-direction: column; gap: 2px; padding-right: 2px; }
#dd-keys-card .dd-keys-group { font-size: 11px; font-weight: 900; color: var(--dd-muted); margin: 8px 0 2px; }
#dd-keys-card .dd-keys-row { display: flex; align-items: center; gap: 6px; font-size: 12px; min-height: 28px; }
#dd-keys-card .dd-keys-row > span { flex: 1; min-width: 0; }
#dd-keys-card .dd-keys-key { min-width: 92px; padding: 3px 8px; font-size: 11px; font-family: var(--dd-font); }
#dd-keys-card .dd-keys-key.dd-keys-none { color: var(--dd-faint); font-weight: 700; }
#dd-keys-card .dd-keys-key.dd-keys-wait { border-color: var(--dd-primary); color: var(--dd-primary); }
#dd-keys-card .dd-keys-fixed { min-width: 92px; text-align: center; font-size: 11px; color: var(--dd-muted); }
#dd-keys-card .dd-keys-mini { width: 24px; height: 24px; padding: 0; font-size: 12px; }
#dd-keys-card .dd-keys-changed { color: var(--dd-primary); font-weight: 900; }
`;

Object.assign(DocsDoodads.Workspace, {
    // What each row does. Returns false when the key had nothing to do (so it is left alone).
    runShortcut(id, e) {
        const D = DocsDoodads;
        const tool = name => () => { this.setPlacementTool(name); return true; };
        const actions = {
            undo: () => D.Undo.undo(),
            redo: () => D.Undo.redo(),
            save: () => D.Persistence.saveAll(),
            duplicate: () => this.duplicateSelectedDoodad(),
            copy: () => this.copySelected(),
            paste: () => this.pasteCopied(false),
            pasteInPlace: () => this.pasteCopied(true),
            selectAll: () => this.selectAllDoodads(),
            delete: () => (this.selectedEvent ? this.deleteSelectedEvent() : this.deleteSelectedDoodad()),
            palette: () => this.showCommandPalette(),
            details: () => this.toggleInspector(),
            find: () => this.focusSearch(),
            shortcuts: () => this.showShortcutsCard(),
            nextPanel: () => this.focusNextPanel(false),
            prevPanel: () => this.focusNextPanel(true),
            grid: () => this.toggleGrid(),
            collision: () => this.toggleCollisionOverlay(),
            sounds: () => this.toggleSoundOverlay(),
            speed: () => this.togglePerfOverlay(),
            toolSelect: tool(null),
            toolStamp: tool('stamp'),
            toolScatter: tool('brush'),
            toolPaint: tool('biome'),
            toolPath: tool('path'),
            toolHills: tool('terrain'),
            toolRegions: tool('region'),
            toolGrab: tool('eyedropper'),
            rooms: () => this.showRoomsCard(),
            brushSmaller: () => this.resizeBrush(-1) || false,
            brushBigger: () => this.resizeBrush(1) || false
        };
        const run = actions[id];
        if (!run) return false;
        const result = run();
        if (result === false) return false;
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        return true;
    },

    // Buttons built once at mount carry their key in the tooltip; after a change they are told again.
    shortcutTips: {
        'dd-undo-btn': ['undo', 'Undo'],
        'dd-redo-btn': ['redo', 'Redo'],
        'dd-palette-btn': ['palette', 'Type the name of any tool or setting'],
        'dd-grid-btn': ['grid', 'Show the snapping grid'],
        'dd-keys-btn': ['shortcuts', 'See and change the keyboard shortcuts'],
        'dd-select-btn': ['toolSelect', 'Select: click things on the map to change them, drag to move'],
        'dd-stamp-btn': ['toolStamp', 'Stamp: click the map to place the picked item again and again'],
        'dd-brush-btn': ['toolScatter', 'Scatter: drag over the map to sprinkle the picked item around'],
        'dd-biome-btn': ['toolPaint', 'Paint: drag to paint a mix of plants (biomes)'],
        'dd-path-btn': ['toolPath', 'Path: lay the picked item along a line you click out'],
        'dd-terrain-btn': ['toolHills', 'Hills: raise and lower the ground (3D view)'],
        'dd-region-btn': ['toolRegions', 'Regions: paint region numbers on tiles (and see terrain tags)'],
        'dd-eyedropper-btn': ['toolGrab', 'Grab: click a doodad on the map to pick up what it is made of (or Alt+click)']
    },

    shortcutTip(elementId) {
        const row = this.shortcutTips[elementId];
        if (!row) return '';
        // Select has always shown Esc, which also gets back to it.
        if (row[0] === 'toolSelect' && !DocsDoodads.Shortcuts.label('toolSelect')) return row[1] + ' (Esc)';
        return DocsDoodads.Shortcuts.tip(row[0], row[1]);
    },

    refreshShortcutTips() {
        if (typeof document === 'undefined') return;
        for (const id of Object.keys(this.shortcutTips)) {
            const el = document.getElementById(id);
            if (!el) continue;
            const tip = this.shortcutTip(id);
            // The tooltip reads data-dd-tip once it has taken over the title.
            if (el.getAttribute && el.getAttribute('data-dd-tip')) el.setAttribute('data-dd-tip', tip); else el.title = tip;
        }
        if (this.updateSaveState) this.updateSaveState(false);
    },

    // ---- The card ----
    showShortcutsCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui, S = DocsDoodads.Shortcuts;
        this.stopShortcutCapture();
        let card = document.getElementById('dd-keys-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-keys-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const keyCap = id => {
            const label = S.label(id);
            return label ? escapeHtml(label) : 'No key';
        };
        const row = s => s.fixed
            ? `<div class="dd-keys-row"><span>${escapeHtml(s.label)}</span><kbd class="dd-keys-fixed">${escapeHtml(s.keys)}</kbd><span style="flex: none; width: 54px;"></span></div>`
            : `<div class="dd-keys-row"><span class="${S.isChanged(s.id) ? 'dd-keys-changed' : ''}">${escapeHtml(s.label)}</span>
                <button class="dd-btn dd-keys-key${S.label(s.id) ? '' : ' dd-keys-none'}" type="button" data-keys="${s.id}" title="Click, then press the new keys (Esc keeps these)">${keyCap(s.id)}</button>
                <button class="dd-btn dd-keys-mini" type="button" data-clear="${s.id}" title="No key"${S.label(s.id) ? '' : ' disabled'}>×</button>
                <button class="dd-btn dd-keys-mini" type="button" data-reset="${s.id}" title="Back to ${escapeHtml(s.keys || 'no key')}"${S.isChanged(s.id) ? '' : ' disabled'}>↺</button></div>`;
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('gear', 1)} Keyboard Shortcuts</span>
                <button class="dd-btn" id="dd-keys-reset-all" type="button" title="Put every key back the way it came"${Object.keys(S.overrides()).length ? '' : ' disabled'}>Reset All</button>
                <button class="dd-btn dd-fold" id="dd-keys-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-keys-list">
                <div class="dd-keys-row"><span>Open or close the editor</span><kbd class="dd-keys-fixed">${escapeHtml(DocsDoodads.KeyChord.label(DocsDoodads.editChord))}</kbd><span style="flex: none; width: 54px;"></span></div>
                ${S.groups().map(g => `<div class="dd-keys-group">${escapeHtml(g)}</div>${S.list.filter(s => s.group === g).map(row).join('')}`).join('')}
            </div>
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Kept on this computer. The editor key is the Editor Key plugin parameter. Keys in grey depend on the tool or what is picked.</div>`;
        const all = sel => Array.from(card.querySelectorAll(sel));
        all('[data-keys]').forEach(b => { b.onclick = () => this.startShortcutCapture(b.dataset.keys, b); });
        all('[data-clear]').forEach(b => { b.onclick = () => { S.set(b.dataset.clear, ''); this.afterShortcutChange(); }; });
        all('[data-reset]').forEach(b => { b.onclick = () => this.bindShortcut(b.dataset.reset, S.find(b.dataset.reset).keys); });
        const close = document.getElementById('dd-keys-close');
        if (close) close.onclick = () => this.closeShortcutsCard();
        const resetAll = document.getElementById('dd-keys-reset-all');
        if (resetAll) resetAll.onclick = () => {
            U.confirm('Put every keyboard shortcut back the way it came?', { title: 'Reset all keys', ok: 'Reset All' }).then(yes => {
                if (!yes) return;
                S.resetAll();
                this.afterShortcutChange();
            });
        };
        return card;
    },

    closeShortcutsCard() {
        this.stopShortcutCapture();
        const card = typeof document !== 'undefined' ? document.getElementById('dd-keys-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },

    afterShortcutChange() {
        this.refreshShortcutTips();
        if (typeof document !== 'undefined' && document.getElementById('dd-keys-card')) this.showShortcutsCard();
    },

    // Waiting for the new keys: the next key press goes here and nowhere else (not the editor, not the game).
    startShortcutCapture(id, button) {
        this.stopShortcutCapture();
        if (button) {
            button.textContent = 'Press keys...';
            if (button.classList) button.classList.add('dd-keys-wait');
        }
        const onKey = e => {
            const chord = DocsDoodads.Shortcuts.chordFromEvent(e);
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            if (!chord) return; // Ctrl, Shift or Alt on its own: wait for the rest
            this.stopShortcutCapture();
            if (chord.code === 'Escape' && !chord.ctrl && !chord.shift && !chord.alt) { this.showShortcutsCard(); return; }
            this.bindShortcut(id, DocsDoodads.KeyChord.label(chord));
        };
        this._shortcutCapture = { id, onKey };
        if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', onKey, true);
    },

    stopShortcutCapture() {
        const c = this._shortcutCapture;
        this._shortcutCapture = null;
        if (c && typeof document !== 'undefined' && document.removeEventListener) document.removeEventListener('keydown', c.onKey, true);
    },

    capturingShortcut() {
        return Boolean(this._shortcutCapture);
    },

    // Bind keys to a row: a reserved key is refused, a key in use asks first. Resolves true when bound.
    bindShortcut(id, keys) {
        const S = DocsDoodads.Shortcuts, U = DocsDoodads.Ui;
        const chord = S.parse(keys);
        const label = chord ? DocsDoodads.KeyChord.label(chord) : '';
        const why = S.reserved(chord);
        if (why) {
            this.showToast(`${label} ${why}, so it can't be used here.`, 'error');
            this.afterShortcutChange();
            return Promise.resolve(false);
        }
        const other = S.conflict(id, chord);
        const done = () => { S.set(id, keys); this.afterShortcutChange(); return true; };
        if (!other) return Promise.resolve(done());
        return U.confirm(`${label} is used by "${S.find(other).label}". Use it for "${S.find(id).label}" instead? "${S.find(other).label}" will have no key.`,
            { title: 'Key in use', ok: 'Use It Here' }).then(yes => {
            if (!yes) { this.afterShortcutChange(); return false; }
            S.set(other, '');
            return done();
        });
    }
});
