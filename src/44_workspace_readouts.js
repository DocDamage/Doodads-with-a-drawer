//==========================================================
// SECTION 25b: WORKSPACE READOUTS (COLLISION OVERLAY, DRAG READOUT, STATUS BAR)
//==========================================================
// What the editor tells you about the map while you work: every doodad's collision at once, where a
// dragged doodad is and how big, and a status bar with the cursor, map, selection, layer, zoom and saving.
DocsDoodads.Ui.css += `
/* The status bar along the bottom of the map, and the readout beside a dragged doodad. */
#dd-statusbar {
    position: absolute; bottom: 8px; height: 26px; display: flex; align-items: center; gap: 12px; padding: 0 12px;
    border-radius: 13px; font-size: 11px; font-weight: 800; color: var(--dd-muted); white-space: nowrap; overflow: hidden;
}
#dd-statusbar b { color: var(--dd-text); font-weight: 900; }
#dd-statusbar .dd-sb-sep { width: 2px; height: 12px; background: var(--dd-line); border-radius: 2px; flex: none; }
#dd-statusbar .dd-sb-unsaved { color: var(--dd-warn); }
#dd-statusbar .dd-sb-saved { color: var(--dd-good-dark); }
#dd-statusbar .dd-sb-grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
#dd-hint.dd-hint-raised { bottom: 42px; }
#dd-drag-readout {
    position: fixed; z-index: 10020; pointer-events: none; padding: 4px 9px; border-radius: 10px; font-family: var(--dd-font);
    font-size: 11px; font-weight: 800; color: #ffffff; background: rgba(31, 27, 48, 0.86); white-space: nowrap;
}
#dd-toast-history { position: fixed; z-index: 10032; width: 340px; max-width: calc(100vw - 32px); max-height: 60vh; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
#dd-toast-history .dd-th-list { overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
#dd-toast-history .dd-th-item { display: flex; gap: 8px; align-items: flex-start; padding: 5px 8px; border-radius: 10px; background: var(--dd-panel-2); font-size: 11px; font-weight: 700; color: var(--dd-text); }
#dd-toast-history .dd-th-item.dd-th-error { background: var(--dd-danger-soft); }
#dd-toast-history .dd-th-item.dd-th-success { background: var(--dd-good-soft); }
#dd-toast-history .dd-th-time { color: var(--dd-faint); flex: none; font-variant-numeric: tabular-nums; }
#dd-toast-history .dd-th-msg { overflow-wrap: anywhere; }
#dd-collision-legend { position: absolute; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 3px; max-width: 220px; }
#dd-collision-legend .dd-swatch { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; border: 2px solid rgba(0, 0, 0, 0.15); }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Collision overlay: every doodad's collision box, coloured by preset, and the blocked tiles ----
    // (The colours come from the map palette, standard or colour-blind safe: DocsDoodads.Ui.mapColor.)
    collisionNames: {
        full: 'Full', bottomHalf: 'Bottom half', bottomThird: 'Bottom third', center: 'Centre', trunk: 'Tree trunk',
        thinWall: 'Thin wall', wideWall: 'Wide wall', custom: 'Custom / traced'
    },
    showCollision: false,

    toggleCollisionOverlay(on) {
        this.showCollision = on === undefined ? !this.showCollision : Boolean(on);
        DocsDoodads.Ui.setPref('collisionOverlay', this.showCollision);
        const label = typeof document !== 'undefined' ? document.getElementById('dd-collision-label') : null;
        if (label) label.textContent = this.showCollision ? 'Hide Collision' : 'Show Collision';
        this.updateCollisionLegend();
        return this.showCollision;
    },

    // The preset a doodad's collision is shown as: a traced or hand-drawn shape counts as custom.
    collisionPreset(d) {
        const preset = d && d.collision ? d.collision.preset : 'none';
        if (!preset || preset === 'none') return null;
        return d.collision.shape || !this.collisionNames[preset] ? 'custom' : preset;
    },

    // What the overlay draws, in map pixels and tiles: { bodies: [{ rect, preset, shows }], doodadTiles,
    // mapTiles } for the tiles in view (doodadTiles: blocked by a showing doodad; mapTiles: by the map).
    collisionOverlayData(view) {
        const C = DocsDoodads.Collision;
        const gameMap = window.$gameMap;
        const tw = gameMap.tileWidth(), th = gameMap.tileHeight();
        const settings = DocsDoodads.Lighting.mapSettings(gameMap.mapId());
        const bodies = [], doodadTiles = new Set(), mapTiles = new Set();
        for (const d of DocsDoodads.doodads() || []) {
            const body = C.bodyOf(d);
            if (!body) continue;
            const shows = DocsDoodads.Layers.visibleInGame(d, settings) && DocsDoodads.Appearance.isVisible(d, {});
            bodies.push({ rect: body, preset: this.collisionPreset(d), shows });
            if (shows) for (const t of C.tilesUnder(body, tw, th)) doodadTiles.add(t.x + ',' + t.y);
        }
        if (view && typeof gameMap.isPassable === 'function') {
            for (let y = view.y0; y <= view.y1; y++) {
                for (let x = view.x0; x <= view.x1; x++) {
                    const mx = typeof gameMap.roundX === 'function' ? gameMap.roundX(x) : x;
                    const my = typeof gameMap.roundY === 'function' ? gameMap.roundY(y) : y;
                    if (gameMap.isValid && !gameMap.isValid(mx, my)) continue;
                    if (![2, 4, 6, 8].some(dir => gameMap.isPassable(mx, my, dir))) mapTiles.add(mx + ',' + my);
                }
            }
        }
        return { bodies, doodadTiles, mapTiles };
    },

    drawCollisionOverlay(g) {
        if (!this.showCollision || !window.$gameMap) return;
        const cam = DocsDoodads.Perspective.liveCamera ? DocsDoodads.Perspective.liveCamera() : null;
        if (cam) return; // flat maps only: the 3D view has its own sense of what is in front
        const gameMap = window.$gameMap;
        const tw = gameMap.tileWidth(), th = gameMap.tileHeight();
        const width = typeof Graphics !== 'undefined' ? Graphics.width : 816, height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const x0 = Math.floor(gameMap.displayX()), y0 = Math.floor(gameMap.displayY());
        const view = { x0, y0, x1: x0 + Math.ceil(width / tw), y1: y0 + Math.ceil(height / th) };
        const data = this.collisionOverlayData(view);
        // Outlines drawn before (the selection's) leave their line style set: tiles are fills only.
        g.lineStyle(0);
        const tile = (key, color, alpha) => {
            const [x, y] = key.split(',').map(Number);
            g.beginFill(color, alpha);
            g.drawRect(gameMap.adjustX(x) * tw, gameMap.adjustY(y) * th, tw, th);
            g.endFill();
        };
        for (const key of data.mapTiles) if (!data.doodadTiles.has(key)) tile(key, 0x2f2a43, 0.28);
        for (const key of data.doodadTiles) tile(key, DocsDoodads.Ui.mapColor('blocked'), 0.22);
        for (const b of data.bodies) {
            const color = DocsDoodads.Ui.mapColor(b.preset);
            const at = DocsDoodads.mapToScreen(b.rect.x, b.rect.y);
            g.lineStyle(2, color, b.shows ? 1 : 0.4);
            g.beginFill(color, b.shows ? 0.25 : 0.06);
            g.drawRect(at.x, at.y, b.rect.w, b.rect.h);
            g.endFill();
        }
        g.lineStyle(0);
    },

    // A small key to the colours, beside the Item Bag while the overlay is on.
    updateCollisionLegend() {
        if (typeof document === 'undefined') return;
        let legend = document.getElementById('dd-collision-legend');
        if (!this.showCollision || !this.mounted) {
            if (legend && legend.parentNode) legend.parentNode.removeChild(legend);
            return;
        }
        const presets = new Set((DocsDoodads.doodads() || []).map(d => this.collisionPreset(d)).filter(Boolean));
        const hex = c => '#' + c.toString(16).padStart(6, '0');
        const row = (color, text) => `<div><span class="dd-swatch" style="background: ${color};"></span>${escapeHtml(text)}</div>`;
        const html = `<div class="dd-pop-title" style="margin-bottom: 2px;">${DocsDoodads.Ui.icon('grid', 1)} Collision</div>` +
            row(hex(DocsDoodads.Ui.mapColor('blocked')), 'Tile a doodad blocks') + row('rgba(47, 42, 67, 0.45)', 'Tile the map blocks') +
            Object.keys(this.collisionNames).filter(p => presets.has(p)).map(p => row(hex(DocsDoodads.Ui.mapColor(p)), this.collisionNames[p])).join('') +
            (presets.size ? '' : '<div>No doodads with collision on this map.</div>');
        if (legend && legend._ddHtml === html) return;
        if (!legend) {
            legend = document.createElement('div');
            legend.id = 'dd-collision-legend';
            legend.className = 'dd-glass';
            const root = this.container || document.body;
            root.appendChild(legend);
        }
        legend.innerHTML = html;
        legend._ddHtml = html;
        this.placeReadouts();
    },

    // ---- The readout beside a dragged doodad: where it is and how big ----
    dragReadoutText(d) {
        const gameMap = window.$gameMap;
        const tw = gameMap && gameMap.tileWidth ? gameMap.tileWidth() : 48, th = gameMap && gameMap.tileHeight ? gameMap.tileHeight() : 48;
        const w = Math.round((d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1));
        const h = Math.round((d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1));
        const tiles = v => Math.round(v * 100) / 100;
        return `x ${Math.round(d.x)}, y ${Math.round(d.y)} · tile ${Math.floor(d.x / tw)}, ${Math.floor((d.y - 1) / th)} · ${w}×${h} px (${tiles(w / tw)}×${tiles(h / th)} tiles)`;
    },

    showDragReadout(clientX, clientY) {
        if (typeof document === 'undefined' || !this._drag || !this._drag.primary) return;
        let el = document.getElementById('dd-drag-readout');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-drag-readout';
            document.body.appendChild(el);
        }
        const count = this._drag.items.length;
        el.textContent = this.dragReadoutText(this._drag.primary) + (count > 1 ? ` · ${count} moving` : '');
        const room = (typeof window !== 'undefined' && window.innerWidth) || 816;
        el.style.left = Math.round(Math.min(clientX + 18, room - 330)) + 'px';
        el.style.top = Math.round(clientY + 20) + 'px';
    },

    hideDragReadout() {
        const el = typeof document !== 'undefined' ? document.getElementById('dd-drag-readout') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    // ---- The status bar ----
    _cursor: null,

    // Over the map only: moving across the panels (the bag, Details, the bar itself) keeps the last tile.
    trackCursor(clientX, clientY, target) {
        if (target && typeof target.closest === 'function' && target.closest('.dd-glass')) return;
        this._cursor = this.clientToMapCoords(clientX, clientY);
        this.updateStatusBar();
    },

    mapLabel() {
        const id = this.currentMapId();
        const info = typeof window !== 'undefined' && window.$dataMapInfos ? window.$dataMapInfos[id] : null;
        return `Map ${id}${info && info.name ? ' · ' + info.name : ''}`;
    },

    // The bar's parts as text, so they can be checked without a page: [cursor, map, picked, layer, zoom, saving].
    statusParts() {
        const c = this._cursor;
        const cursor = c ? `Tile ${c.tileX}, ${c.tileY} · ${Math.round(c.x)}, ${Math.round(c.y)} px` : 'Tile –';
        const picked = this.selectionItems().length;
        const event = this.selectedEvent ? 'an event' : '';
        const layers = DocsDoodads.Layers.list(DocsDoodads.Lighting.mapSettings(this.currentMapId()));
        const layer = (layers.find(l => l.id === (this.activeLayer || 'main')) || layers[0] || { name: 'Main' }).name;
        const zoom = typeof $gameScreen !== 'undefined' && $gameScreen && typeof $gameScreen.zoomScale === 'function' ? $gameScreen.zoomScale() : 1;
        const P = DocsDoodads.Persistence;
        const saving = P.hasUnsavedWork() ? 'Not saved'
            : P.lastSavedAt ? 'Saved ' + new Date(P.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No changes';
        return [cursor, this.mapLabel(), picked ? `${picked} picked` : (event ? 'An event picked' : 'Nothing picked'),
            `Layer: ${layer}`, `Zoom ${Math.round(zoom * 100)}%`, saving];
    },

    updateStatusBar() {
        const bar = typeof document !== 'undefined' ? document.getElementById('dd-statusbar') : null;
        if (!bar) return;
        const parts = this.statusParts();
        const unsaved = DocsDoodads.Persistence.hasUnsavedWork();
        const html = parts.map((p, i) => {
            const cls = i === 5 ? (unsaved ? ' class="dd-sb-unsaved"' : ' class="dd-sb-saved"') : i === 1 ? ' class="dd-sb-grow"' : '';
            const text = i === 5 && unsaved ? '● ' + p : p;
            return `<span${cls}>${i === 0 || i === 3 ? `<b>${escapeHtml(text)}</b>` : escapeHtml(text)}</span>`;
        }).join('<span class="dd-sb-sep"></span>');
        if (bar._ddHtml !== html) {
            bar.innerHTML = html;
            bar._ddHtml = html;
        }
    },

    buildStatusBar() {
        if (!this.container || typeof document === 'undefined') return;
        const bar = document.createElement('div');
        bar.id = 'dd-statusbar';
        bar.className = 'dd-glass';
        this.container.appendChild(bar);
        const hint = document.getElementById('dd-hint');
        if (hint && hint.classList) hint.classList.add('dd-hint-raised');
        clearInterval(this._statusTimer);
        // The saving time, the selection and collision presets change without a mouse move; four times a
        // second is plenty.
        this._statusTimer = setInterval(() => {
            if (!this.mounted) return;
            this.updateStatusBar();
            if (this.showCollision) this.updateCollisionLegend();
        }, 250);
        if (this._statusTimer && typeof this._statusTimer.unref === 'function') this._statusTimer.unref();
        this.updateStatusBar();
    },

    stopStatusBar() {
        clearInterval(this._statusTimer);
        this._statusTimer = null;
        this.hideDragReadout();
    },

    // ---- Messages: every toast, newest first, to read again ----
    showToastHistory() {
        if (typeof document === 'undefined') return null;
        this.closeToastHistory();
        const panel = document.createElement('div');
        panel.id = 'dd-toast-history';
        panel.className = 'dd-glass';
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${DocsDoodads.Ui.icon('history', 1)} Messages</span>
                <button class="dd-btn" id="dd-th-clear" type="button">Clear</button>
                <button class="dd-btn dd-fold" id="dd-th-close" type="button" title="Close">${DocsDoodads.Ui.icon('close', 1)}</button></div>
            <div class="dd-th-list" id="dd-th-list"></div>`;
        document.body.appendChild(panel);
        this._toastHistoryOpen = true;
        const clear = document.getElementById('dd-th-clear');
        if (clear) clear.onclick = () => { this.toastLog = []; this.renderToastHistory(); };
        const close = document.getElementById('dd-th-close');
        if (close) close.onclick = () => this.closeToastHistory();
        this.renderToastHistory();
        this.placeReadouts();
        return panel;
    },

    renderToastHistory() {
        const list = typeof document !== 'undefined' ? document.getElementById('dd-th-list') : null;
        if (!list) return;
        const items = this.toastLog || [];
        const time = at => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        list.innerHTML = items.length
            ? items.map(t => `<div class="dd-th-item${t.kind === 'error' ? ' dd-th-error' : t.kind === 'success' ? ' dd-th-success' : ''}">` +
                `<span class="dd-th-time">${escapeHtml(time(t.at))}</span><span class="dd-th-msg">${escapeHtml(t.msg)}</span></div>`).join('')
            : '<div class="dd-empty">No messages yet.</div>';
    },

    closeToastHistory() {
        this._toastHistoryOpen = false;
        const panel = typeof document !== 'undefined' ? document.getElementById('dd-toast-history') : null;
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    },

    // The status bar spans the map between the panels; the collision key sits at the map's top left,
    // long-job pills at its top right, and Messages under them.
    placeReadouts() {
        if (typeof document === 'undefined') return;
        const rect = id => { const el = document.getElementById(id); return el && el.getBoundingClientRect ? el.getBoundingClientRect() : null; };
        const room = this.roomSize ? this.roomSize().w : ((typeof window !== 'undefined' && window.innerWidth) || 816);
        const scale = this.uiScaleNow ? this.uiScaleNow() : 1;
        const drawer = rect('dd-drawer-panel'), inspector = rect('dd-inspector-panel'), toolbar = rect('dd-toolbar');
        const left = drawer ? drawer.right + 8 : 8, right = inspector ? inspector.left - 8 : room - 8;
        const bar = document.getElementById('dd-statusbar');
        if (bar && bar.style) {
            bar.style.left = Math.round(left) + 'px';
            bar.style.width = Math.round(Math.max(120, right - left)) + 'px';
        }
        // The map tabs sit just under the top bar; the key and pills go under them.
        const tabs = document.getElementById('dd-map-tabs');
        let top = Math.round(toolbar ? toolbar.bottom + 8 : 84);
        if (tabs && tabs.style) {
            tabs.style.left = Math.round(left) + 'px';
            tabs.style.width = Math.round(Math.max(120, right - left)) + 'px';
            tabs.style.top = Math.round(toolbar ? toolbar.bottom + 4 : 80) + 'px';
            if (tabs.style.display !== 'none') top += 32;
        }
        const legend = document.getElementById('dd-collision-legend');
        if (legend && legend.style) {
            legend.style.left = Math.round(left) + 'px';
            legend.style.top = top + 'px';
        }
        // These two are on the page, outside the (possibly zoomed) workspace: window pixels.
        for (const id of ['dd-progress-stack', 'dd-toast-history']) {
            const el = document.getElementById(id);
            if (el && el.style) {
                el.style.right = Math.round((room - right) * scale) + 'px';
                el.style.top = Math.round(top * scale) + 'px';
            }
        }
    }
});
