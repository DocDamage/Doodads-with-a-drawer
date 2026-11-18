// @editor-only
//==========================================================
// SECTION 25F: TILESET FLAGS ON THE TILES CARD (9.4.1)
//==========================================================
// Tiles card → Tile Settings: each tile on the sheet wears MZ's marks for the chosen setting (○ × ☆, the four
// sides, ladder, bush, counter, damage floor, boat, ship, airship, terrain tag) and a click steps it as MZ's
// database does. One Undo step a click. The running game reads $dataTilesets, so Show Collision and Check Reach
// see a change at once. Save writes data/Tilesets.json with the rest, backed up first, and stops if the file was
// changed since it was read.
(function() {
    const D = DocsDoodads, W = D.Workspace, TF = D.TileFlags;
    const PATH = 'data/Tilesets.json';

    Object.assign(TF, {
        dirty: false,
        snapshot: null,
        warned: {},

        // The file's state when tile settings were first opened, for the changed-since-read check.
        remember() {
            if (this.snapshot === null) this.snapshot = D.FS.stat(PATH) || false;
        },

        conflict() {
            if (!this.snapshot) return false;
            const now = D.FS.stat(PATH);
            return Boolean(now && (now.mtimeMs !== this.snapshot.mtimeMs || now.size !== this.snapshot.size));
        },

        // Sets one tile's setting on a tileset: every id that shares it (an autotile's shapes). An Undo step.
        apply(tilesetId, tileId, next) {
            const tileset = typeof $dataTilesets !== 'undefined' && $dataTilesets ? $dataTilesets[tilesetId] : null;
            if (!tileset || !Array.isArray(tileset.flags)) return false;
            const ids = this.idsFor(tileId);
            const before = ids.map(id => tileset.flags[id] || 0);
            const after = ids.map(() => next);
            if (before.every((v, i) => v === after[i])) return false;
            const write = values => {
                ids.forEach((id, i) => { tileset.flags[id] = values[i]; });
                this.dirty = true;
                D.Persistence.changed();
                if (W.mounted && W.drawTileSheet) W.drawTileSheet();
            };
            D.Undo.execute({ type: 'tile_flags', label: 'Tile settings', apply: () => write(after), revert: () => write(before) });
            return true;
        }
    });

    D.Persistence.savers.push({
        name: 'Tile settings',
        dirty: () => TF.dirty,
        conflict: () => TF.conflict(),
        entries: () => [{ path: PATH, json: TF.fileText($dataTilesets) }],
        committed: () => { TF.dirty = false; TF.snapshot = D.FS.stat(PATH) || false; }
    });

    Object.assign(W, {
        tileFlagMode: null,

        // How many maps use this tileset (each map file read once, on the first change).
        countMapsUsingTileset(tilesetId) {
            const infos = D.FS.readJson('data/MapInfos.json') || [];
            const tilesets = {};
            for (const info of infos) {
                if (!info || !info.id) continue;
                const map = D.FS.readJson(D.Persistence.mapFilePath(info.id));
                if (map) tilesets[info.id] = map.tilesetId;
            }
            return TF.mapsUsing(tilesetId, tilesets);
        },

        async clickTileFlag(tileId, fx, fy, back) {
            const mode = this.tileFlagMode;
            const tilesetId = $gameMap.tilesetId();
            const tileset = $dataTilesets[tilesetId];
            if (!mode || !tileset || !tileId) return false;
            TF.remember();
            if (!TF.warned[tilesetId]) {
                const n = this.countMapsUsingTileset(tilesetId);
                const ok = await D.Ui.confirm(`${tileset.name || 'This tileset'} is used by ${n} map${n === 1 ? '' : 's'}. A change here changes all of them. Save writes data/Tilesets.json; then close and reopen the project in RPG Maker MZ (if MZ saves while it is open, it writes its own copy over these changes).`, { okLabel: 'Change It' });
                if (!ok) return false;
                TF.warned[tilesetId] = true;
            }
            const flag = tileset.flags[tileId] || 0;
            const next = TF.step(flag, mode, { allowStar: !TF.isAutotile(tileId) && tileId < 1536, side: TF.sideAt(fx, fy), back });
            return TF.apply(tilesetId, tileId, next);
        },

        // The marks over the sheet in Tile Settings.
        drawTileFlagMarks(ctx) {
            const mode = this.tileFlagMode, T = D.Tiles;
            const tileset = $dataTilesets[$gameMap.tilesetId()];
            if (!mode || !ctx || !tileset || !ctx.fillText) return;
            const tw = $gameMap.tileWidth() * this.tileBrush.scale, th = $gameMap.tileHeight() * this.tileBrush.scale;
            const sheet = this.tileBrush.sheet, cols = sheet === 4 || sheet > 4 ? (sheet === 4 ? 8 : 16) : 16, rows = 16;
            ctx.font = `bold ${Math.max(9, Math.round(th * 0.55))}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
                const id = T.idAt(sheet, x, y);
                if (!id) continue;
                const m = TF.mark(tileset.flags[id] || 0, mode);
                const cx = x * tw + tw / 2, cy = y * th + th / 2;
                ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x * tw, y * th, tw, th);
                if (m.dirs) {
                    ctx.fillStyle = '#ffffff';
                    const a = Math.max(2, tw * 0.12);
                    if (!m.dirs.up) ctx.fillRect(cx - a, y * th + 2, a * 2, a);
                    if (!m.dirs.down) ctx.fillRect(cx - a, (y + 1) * th - 2 - a, a * 2, a);
                    if (!m.dirs.left) ctx.fillRect(x * tw + 2, cy - a, a, a * 2);
                    if (!m.dirs.right) ctx.fillRect((x + 1) * tw - 2 - a, cy - a, a, a * 2);
                    continue;
                }
                ctx.fillStyle = m.on ? '#ffffff' : '#ff8080';
                ctx.fillText(m.text, cx, cy + 1);
            }
        }
    });

    // The Tiles card gains a Tile Settings choice.
    const render = W.renderTilePalette;
    W.renderTilePalette = function() {
        const result = render.apply(this, arguments);
        const box = typeof document !== 'undefined' ? document.getElementById('dd-tiles-palette') : null;
        if (!box || typeof box.insertAdjacentHTML !== 'function') return result;
        const options = [{ id: '', label: 'Paint tiles' }].concat(TF.modes)
            .map(m => `<option value="${m.id}"${(this.tileFlagMode || '') === m.id ? ' selected' : ''}>${escapeHtml(m.id ? 'Tile settings: ' + m.label : m.label)}</option>`).join('');
        const mode = TF.modes.find(m => m.id === this.tileFlagMode);
        box.insertAdjacentHTML('beforeend', `
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                <select id="dd-tile-flags-mode">${options}</select>
                ${this.tileFlagMode ? `<div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">${escapeHtml((mode && mode.hint) || 'Click to switch it on or off')}. One Undo step a click. Save writes data/Tilesets.json; close and reopen the project in RPG Maker MZ afterwards, and don't save in MZ while it is open or it puts its own copy back.</div>` : ''}
            </div>`);
        const select = document.getElementById('dd-tile-flags-mode');
        if (select) select.onchange = e => {
            this.tileFlagMode = e.target.value || null;
            if (this.tileFlagMode) TF.remember();
            this.renderTilePalette();
        };
        return result;
    };

    // In Tile Settings, the sheet is drawn with the marks and a click steps a setting instead of picking.
    const draw = W.drawTileSheet;
    W.drawTileSheet = function() {
        const result = draw.apply(this, arguments);
        const canvas = typeof document !== 'undefined' ? document.getElementById('dd-tiles-canvas') : null;
        if (!canvas || !this.tileFlagMode) return result;
        const ctx = canvas.getContext && canvas.getContext('2d');
        this.drawTileFlagMarks(ctx);
        const at = e => {
            const r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
            const s = this.uiScaleNow ? this.uiScaleNow() : 1;
            const tw = $gameMap.tileWidth() * this.tileBrush.scale, th = $gameMap.tileHeight() * this.tileBrush.scale;
            const px = ((e.clientX - r.left) / s) / tw, py = ((e.clientY - r.top) / s) / th;
            return { x: Math.floor(px), y: Math.floor(py), fx: px - Math.floor(px), fy: py - Math.floor(py) };
        };
        canvas.onmousedown = e => {
            const p = at(e);
            this.clickTileFlag(D.Tiles.idAt(this.tileBrush.sheet, p.x, p.y), p.fx, p.fy, e.button === 2);
        };
        canvas.oncontextmenu = e => { if (e.preventDefault) e.preventDefault(); };
        return result;
    };
})();
