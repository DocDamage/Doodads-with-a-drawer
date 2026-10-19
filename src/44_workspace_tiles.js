//==========================================================
// SECTION 25v: THE TILES TOOL (PAINTING MZ TILES)
//==========================================================
// Tiles (top bar): pick a tile from the map's tileset (A1-E tabs; drag across B-E or A5 for a block of
// tiles) and paint it on the map; autotiles take their shapes from their neighbours as in MZ's editor.
// Alt+click picks up the tile under the cursor; the Eraser takes the top tile off. Each stroke is one undo
// step, and the tiles are saved into the map file with the other map edits (DocsDoodads.Tiles).
DocsDoodads.Ui.css += `
#dd-tiles-popover { width: 420px; max-width: calc(100vw - 24px); }
#dd-tiles-popover .dd-tiles-tabs { display: flex; flex-wrap: wrap; gap: 3px; }
#dd-tiles-popover .dd-tiles-tabs .dd-btn { padding: 2px 8px; font-size: 11px; }
#dd-tiles-popover .dd-tiles-wrap { max-height: 300px; overflow: auto; border: 1px solid var(--dd-line); border-radius: 8px; background: var(--dd-field); }
#dd-tiles-popover canvas { display: block; image-rendering: pixelated; cursor: crosshair; }
`;

DocsDoodads.Ui.hints.tiles = 'Tiles: pick a tile in the card (drag for a block), then click or drag on the map. Alt+click picks up a tile; Eraser takes the top one off.';

Object.assign(DocsDoodads.Workspace, {
    tileBrush: { sheet: 1, ids: [[0]], layer: 'auto', erase: false, scale: 0.5 },

    autotileTables() {
        if (typeof Tilemap === 'undefined') return null;
        return { floor: Tilemap.FLOOR_AUTOTILE_TABLE, wall: Tilemap.WALL_AUTOTILE_TABLE, waterfall: Tilemap.WATERFALL_AUTOTILE_TABLE };
    },

    tilesetNames() {
        const ts = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileset ? $gameMap.tileset() : null;
        return (ts && ts.tilesetNames) || [];
    },

    tileMapView() {
        const m = this.liveMapData();
        if (!m) return null;
        const gm = typeof $gameMap !== 'undefined' ? $gameMap : null;
        return { width: m.width, height: m.height, data: m.data, loopX: Boolean(gm && gm.isLoopHorizontal && gm.isLoopHorizontal()), loopY: Boolean(gm && gm.isLoopVertical && gm.isLoopVertical()) };
    },

    // ---- Painting ----
    beginTileStroke(tileX, tileY) {
        if (!this.tileMapView()) return false;
        if (!this.tileBrush.erase && !(this.tileBrush.ids[0] && this.tileBrush.ids[0][0])) {
            this.showToast('Pick a tile in the Tiles card first.', 'info');
            return false;
        }
        this._tileStroke = { mapId: this.currentMapId(), changes: new Map(), last: null };
        this.tilePaintAt(tileX, tileY);
        return true;
    },

    tilePaintAt(tileX, tileY) {
        const stroke = this._tileStroke;
        const view = this.tileMapView();
        if (!stroke || !view) return 0;
        const key = tileX + ',' + tileY;
        if (stroke.last === key) return 0;
        stroke.last = key;
        const changes = DocsDoodads.Tiles.paint(view, tileX, tileY, this.tileBrush, this.autotileTables());
        for (const c of changes) {
            if (!stroke.changes.has(c.index)) stroke.changes.set(c.index, { before: c.before, after: c.after });
            else stroke.changes.get(c.index).after = c.after;
            this.setMapTile(stroke.mapId, c.index, c.after);
        }
        if (changes.length) this.afterTileEdit();
        return changes.length;
    },

    endTileStroke() {
        const stroke = this._tileStroke;
        this._tileStroke = null;
        if (!stroke) return false;
        const changes = Array.from(stroke.changes.entries()).filter(([, c]) => c.before !== c.after);
        if (!changes.length) return false;
        const set = which => { for (const [index, c] of changes) this.setMapTile(stroke.mapId, index, c[which]); this.afterTileEdit(); };
        DocsDoodads.Undo.execute({ type: 'paint_tiles', apply: () => set('after'), revert: () => set('before') });
        return true;
    },

    // Alt+click: the brush takes the top tile there (and its layer).
    pickTileAt(tileX, tileY) {
        const view = this.tileMapView();
        const top = view ? DocsDoodads.Tiles.topAt(view, tileX, tileY) : null;
        if (!top) { this.showToast('No tile there.', 'info'); return null; }
        this.tileBrush.ids = [[top.id]];
        this.tileBrush.erase = false;
        this.tileBrush.sheet = DocsDoodads.Tiles.sheetOf(top.id);
        this.renderTilePalette();
        return top;
    },

    // ---- The card ----
    renderTilePalette() {
        if (typeof document === 'undefined') return;
        const box = document.getElementById('dd-tiles-palette');
        if (!box) return;
        const T = DocsDoodads.Tiles, b = this.tileBrush;
        const names = this.tilesetNames();
        const tabs = T.sheets.map((label, i) => names[i]
            ? `<button class="dd-btn${b.sheet === i ? ' dd-btn-primary' : ''}" type="button" id="dd-tiles-sheet-${i}" title="${escapeHtml(names[i])}">${label}</button>` : '').join('');
        box.innerHTML = `
            <div class="dd-tiles-tabs">${tabs || '<span style="font-size: 11px;">This map\'s tileset has no pictures.</span>'}</div>
            <div class="dd-tiles-wrap"><canvas id="dd-tiles-canvas" width="8" height="8"></canvas></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                <label>Layer<select id="dd-tiles-layer">${[['auto', 'Automatic'], ['0', '1 (ground)'], ['1', '2 (ground overlay)'], ['2', '3 (upper)'], ['3', '4 (upper)']]
                    .map(([v, l]) => `<option value="${v}"${String(b.layer) === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
                <label style="display: flex; align-items: center; gap: 6px; margin-top: 14px;"><input type="checkbox" id="dd-tiles-erase" ${b.erase ? 'checked' : ''} /> Eraser</label>
            </div>
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Autotiles join up with their neighbours as you paint. Saved into the map file with Save; the MZ editor shows them after it reloads the project.</div>`;
        T.sheets.forEach((label, i) => {
            const btn = document.getElementById(`dd-tiles-sheet-${i}`);
            if (btn) btn.onclick = () => { this.tileBrush.sheet = i; this.renderTilePalette(); };
        });
        const layer = document.getElementById('dd-tiles-layer');
        if (layer) layer.onchange = e => { this.tileBrush.layer = e.target.value === 'auto' ? 'auto' : Number(e.target.value); };
        const erase = document.getElementById('dd-tiles-erase');
        if (erase) erase.onchange = e => { this.tileBrush.erase = Boolean(e.target.checked); };
        this.drawTileSheet();
    },

    drawTileSheet() {
        const canvas = typeof document !== 'undefined' ? document.getElementById('dd-tiles-canvas') : null;
        const name = this.tilesetNames()[this.tileBrush.sheet];
        if (!canvas || !name || typeof ImageManager === 'undefined') return;
        const bitmap = ImageManager.loadTileset(name);
        const draw = () => {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const k = this.tileBrush.scale;
            canvas.width = Math.max(1, Math.round(bitmap.width * k));
            canvas.height = Math.max(1, Math.round(bitmap.height * k));
            const ctx = canvas.getContext && canvas.getContext('2d');
            if (!ctx) return;
            ctx.imageSmoothingEnabled = false;
            const image = bitmap._image || bitmap.canvas || (bitmap._canvas);
            if (image && ctx.drawImage) ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            // The picked tiles.
            const sel = this.tileSelectionRect();
            if (sel && ctx.strokeRect) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(sel.x * tw * k + 1, sel.y * th * k + 1, sel.w * tw * k - 2, sel.h * th * k - 2);
            }
        };
        if (bitmap.isReady && !bitmap.isReady() && bitmap.addLoadListener) bitmap.addLoadListener(draw); else draw();
        const at = e => {
            const r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
            const s = this.uiScaleNow ? this.uiScaleNow() : 1;
            const tw = $gameMap.tileWidth() * this.tileBrush.scale, th = $gameMap.tileHeight() * this.tileBrush.scale;
            return { x: Math.floor(((e.clientX - r.left) / s) / tw), y: Math.floor(((e.clientY - r.top) / s) / th) };
        };
        canvas.onmousedown = e => {
            const start = at(e);
            this._tilePick = { start, end: start };
            this.pickTilesFromSheet(start, start);
            const move = ev => { if (this._tilePick) { this._tilePick.end = at(ev); this.pickTilesFromSheet(this._tilePick.start, this._tilePick.end); } };
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); this._tilePick = null; };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        };
    },

    // Tiles picked on the sheet: a block on B-E and A5; one autotile kind on A1-A4.
    pickTilesFromSheet(a, b) {
        const T = DocsDoodads.Tiles, sheet = this.tileBrush.sheet;
        if (sheet <= 3) {
            const id = T.idAt(sheet, a.x, a.y);
            if (id) this.tileBrush.ids = [[id]];
        } else {
            const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
            const rows = [];
            for (let y = y0; y <= Math.min(y1, y0 + 15); y++) {
                const row = [];
                for (let x = x0; x <= Math.min(x1, x0 + 15); x++) row.push(T.idAt(sheet, x, y));
                rows.push(row);
            }
            if (rows.length && rows[0].length) this.tileBrush.ids = rows;
        }
        this.tileBrush.erase = false;
        const erase = typeof document !== 'undefined' ? document.getElementById('dd-tiles-erase') : null;
        if (erase) erase.checked = false;
        this.drawTileSheetSelection();
    },

    drawTileSheetSelection() {
        // Redraws the sheet with the new selection box (cheap: the picture is cached by MZ).
        if (typeof document !== 'undefined' && document.getElementById('dd-tiles-canvas')) this.drawTileSheet();
    },

    // Where the brush's tiles are on the shown sheet, in tiles, or null.
    tileSelectionRect() {
        const T = DocsDoodads.Tiles, b = this.tileBrush;
        const first = b.ids[0] && b.ids[0][0];
        if (!first || T.sheetOf(first) !== b.sheet) return null;
        if (T.isAutotile(first)) {
            const p = T.kindPosition(T.kind(first));
            return { x: p.x, y: p.y, w: 2, h: b.sheet === 2 || (b.sheet === 3 && Math.floor(T.kind(first) / 8) % 2 === 1) ? 2 : 3 };
        }
        const pos = id => (b.sheet === 4 ? { x: (id - T.A5) % 8, y: Math.floor((id - T.A5) / 8) }
            : { x: ((id % 256) >= 128 ? 8 : 0) + (id % 8), y: Math.floor((id % 128) / 8) });
        const p = pos(first);
        return { x: p.x, y: p.y, w: b.ids[0].length, h: b.ids.length };
    },

    bindTilesTool() {
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-tiles-btn') : null;
        if (btn) btn.onclick = () => {
            this.setPlacementTool(this.placementTool === 'tiles' ? null : 'tiles');
            if (this.placementTool === 'tiles') this.renderTilePalette();
        };
    }
});

DocsDoodads.Workspace.toolButtons.tiles = 'dd-tiles-btn';
DocsDoodads.Workspace.toolPopovers.tiles = 'dd-tiles-popover';

DocsDoodads.Workspace.toolHooks.tiles = {
    down(e) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        if (e.altKey) { this.pickTileAt(at.tileX, at.tileY); return false; }
        return this.beginTileStroke(at.tileX, at.tileY);
    },
    move(e, stroking) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        this._tileHover = { x: at.tileX, y: at.tileY };
        if (stroking && this._tileStroke) this.tilePaintAt(at.tileX, at.tileY);
    },
    up() {
        this.endTileStroke();
    },
    // A click is handled by the stroke (down and up); nothing more.
    click() {},
    overlay(g) {
        if (this.placementTool !== 'tiles' || !this._tileHover || typeof $gameMap === 'undefined' || !$gameMap || !g) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const b = this.tileBrush;
        const w = b.erase ? 1 : (b.ids[0] || [0]).length, h = b.erase ? 1 : b.ids.length;
        const color = DocsDoodads.Ui.mapColor(b.erase ? 'brushErase' : 'brushPaint');
        g.lineStyle(2, color, 0.95);
        g.drawRect($gameMap.adjustX(this._tileHover.x) * tw, $gameMap.adjustY(this._tileHover.y) * th, w * tw, h * th);
        g.lineStyle(0);
    }
};
