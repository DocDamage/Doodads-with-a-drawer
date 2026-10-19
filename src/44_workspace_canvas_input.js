    // ---- Dragging doodads with smart guides ----
    activeGuides: [],

    beginDoodadDrag(point) {
        const hit = this.doodadAt(point.x, point.y);
        if (!hit || hit.locked) return false;
        const selection = this.selectedDoodads && this.selectedDoodads.includes(hit) ? this.selectedDoodads : null;
        if (!selection) this.selectDoodad(hit);
        const items = (this.selectedDoodads && this.selectedDoodads.length ? this.selectedDoodads : [hit]).filter(d => !d.locked);
        if (items.length === 0) return false;
        const moving = new Set(items);
        // In 3D the doodad's foot follows the mouse, keeping the offset from where it was grabbed.
        let start = { x: point.x, y: point.y }, grab = null;
        const cam = DocsDoodads.Perspective.liveCamera();
        if (cam && this._lastScreenPoint) {
            const box = this.doodadFlatBox(hit);
            const foot = DocsDoodads.Perspective.project(cam, box.pivot.x, box.pivot.y, 0);
            if (foot) {
                grab = { x: this._lastScreenPoint.x - foot.x, y: this._lastScreenPoint.y - foot.y };
                start = DocsDoodads.screenToMap(box.pivot.x, box.pivot.y);
            }
        }
        this._drag = {
            grab,
            start,
            primary: hit,
            items,
            origin: items.map(d => ({ x: d.x, y: d.y })),
            before: this.snapshotDoodads(items),
            others: (DocsDoodads.doodads() || []).filter(d => !moving.has(d) && !d.editorHidden).map(d => DocsDoodads.Guides.rectOf(d)),
            moved: false
        };
        return true;
    },

    updateDoodadDrag(point, modifiers = {}) {
        const drag = this._drag;
        if (!drag) return;
        let dx = point.x - drag.start.x;
        let dy = point.y - drag.start.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true;
        const primaryIndex = drag.items.indexOf(drag.primary);
        const primaryOrigin = drag.origin[primaryIndex >= 0 ? primaryIndex : 0];
        this.activeGuides = [];
        if (modifiers.shiftKey) {
            const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            const px = primaryOrigin.x + dx, py = primaryOrigin.y + dy;
            dx += Math.round((px - tw / 2) / tw) * tw + tw / 2 - px;
            dy += Math.round(py / th) * th - py;
        } else if (!modifiers.altKey) {
            const rects = drag.items.map((d, i) => DocsDoodads.Guides.rectOf(Object.assign({}, d, { x: drag.origin[i].x + dx, y: drag.origin[i].y + dy })));
            const tile = { w: window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48, h: window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48 };
            const snap = DocsDoodads.Guides.snap(DocsDoodads.Guides.unionRect(rects), drag.others, 6, { tile });
            dx += snap.dx;
            dy += snap.dy;
            this.activeGuides = snap.lines;
        }
        const before = drag.items.map(d => ({ x: d.x, y: d.y }));
        drag.items.forEach((d, i) => {
            d.x = Math.round(drag.origin[i].x + dx);
            d.y = Math.round(drag.origin[i].y + dy);
        });
        if (!drag.items.every(d => DocsDoodads.Terrain.allowsDoodad(d, this.currentMapId()))) {
            drag.items.forEach((d, i) => { d.x = before[i].x; d.y = before[i].y; });
            if (!drag.warned) { this.showToast(this.levelGroundMessage, 'info'); drag.warned = true; }
            return;
        }
        this.refreshSpriteset(true);
    },

    endDoodadDrag() {
        const drag = this._drag;
        this._drag = null;
        this.activeGuides = [];
        this.hideDragReadout();
        if (!drag || !drag.moved) return false;
        this.recordDoodadEdit(drag.items, drag.before, 'move_doodads');
        this.refreshInspector();
        return true;
    },

    // Extra editor overlay drawing: smart guides and the path being drawn (screen space).
    drawEditorOverlayExtras(g) {
        this.drawCollisionOverlay(g);
        this.drawSoundOverlay(g);
        this.drawReachOverlay(g);
        this.drawRegionOverlay(g);
        for (const name of Object.keys(this.toolHooks)) if (this.toolHooks[name].overlay) this.toolHooks[name].overlay.call(this, g);
        this.drawTransformHandles(g);
        let heightTiles = [];
        if (this.placementTool === 'terrain' && this._terrainHover && typeof $gameMap !== 'undefined' && $gameMap) {
            const T = DocsDoodads.Terrain, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const color = DocsDoodads.Ui.mapColor(this.terrainBrush.mode) || T.brushColors[this.terrainBrush.mode] || 0xffffff;
            heightTiles = T.brushFootprint(this._terrainHover.tileX, this._terrainHover.tileY, this.terrainBrush.radius, this.terrainBrush.falloff);
            for (const t of heightTiles) {
                // Stronger towards the centre, as the brush is (the same all over with a hard edge).
                g.lineStyle(2, color, 0.35 + 0.55 * t.weight);
                g.beginFill(color, 0.15 + 0.4 * t.weight);
                g.drawRect($gameMap.adjustX(t.x) * tw + 3, $gameMap.adjustY(t.y) * th + 3, tw - 6, th - 6);
                g.endFill();
            }
            g.lineStyle(0);
        }
        this.drawHeightLabels(g, heightTiles);
        // Scatter's circle: green to paint, red while right-dragging to erase.
        if (this.placementTool === 'brush' && this._brushHover && typeof $gameMap !== 'undefined' && $gameMap) {
            const at = DocsDoodads.mapToScreen(this._brushHover.x, this._brushHover.y);
            g.lineStyle(2, DocsDoodads.Ui.mapColor(this._scatterErase ? 'brushErase' : 'brushPaint'), 0.9);
            g.drawCircle(at.x, at.y, Math.max(4, Number(this.brushSettings.radius) || 0));
            g.lineStyle(0);
        }
        // Offsets from the screen position of the map origin's nearest copy keep lines continuous on looping maps.
        const anchor = this._drag && this._drag.primary ? this._drag.primary : (this.pathPoints && this.pathPoints[0]) || { x: 0, y: 0 };
        const anchorScreen = DocsDoodads.mapToScreen(anchor.x, anchor.y);
        const ox = anchor.x - anchorScreen.x;
        const oy = anchor.y - anchorScreen.y;
        for (const line of this.activeGuides || []) {
            // Pink: lined up with a doodad; orange: equal spacing; teal: on a tile line.
            g.lineStyle(1, DocsDoodads.Ui.mapColor(line.kind === 'spacing' ? 'guideSpacing' : line.kind === 'tile' ? 'guideTile' : 'guideAlign'), 1);
            if (line.axis === 'x') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
            else if (line.axis === 'y') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'x-gap') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'y-gap') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
        }
        const sym = this.symmetryFor();
        if (sym.mode !== 'off') {
            const at = DocsDoodads.mapToScreen(sym.axisX, sym.axisY);
            const width = typeof Graphics !== 'undefined' ? Graphics.width : 816, height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            g.lineStyle(1, DocsDoodads.Ui.mapColor('mirror'), 0.9);
            if (sym.mode === 'x' || sym.mode === 'xy') { g.moveTo(at.x, 0); g.lineTo(at.x, height); }
            if (sym.mode === 'y' || sym.mode === 'xy') { g.moveTo(0, at.y); g.lineTo(width, at.y); }
        }
        for (const r of this.historyOverlayRects()) {
            g.lineStyle(2, r.color, 0.95);
            g.drawRect(r.x, r.y, r.w, r.h);
        }
        if (this.placementTool === 'path' && this.pathPoints && this.pathPoints.length > 0) {
            const points = this.pathPoints.concat(this._pathHover ? [this._pathHover] : []);
            g.lineStyle(2, DocsDoodads.Ui.mapColor('path'), 0.9);
            points.forEach((p, i) => { if (i === 0) g.moveTo(p.x - ox, p.y - oy); else g.lineTo(p.x - ox, p.y - oy); });
            g.lineStyle(0);
            for (const s of DocsDoodads.Paths.sample(points, this.pathSettings.spacing, { smooth: this.pathSettings.smooth })) {
                g.beginFill(DocsDoodads.Ui.mapColor(s.kind === 'segment' ? 'path' : 'pathCorner'), 0.9);
                g.drawCircle(s.x - ox, s.y - oy, s.kind === 'segment' ? 3 : 5);
                g.endFill();
            }
        }
    },

    // Screen-space x/y positions of tile edges for a width x height area at the current scroll.
    // The snapping grid: the plugin's Grid Snap Width / Height, or the map's tiles.
    snapGrid() {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        return { w: gridSnapWidth > 0 ? gridSnapWidth : tw, h: gridSnapHeight > 0 ? gridSnapHeight : th, tw, th };
    },

    placementGridLines(width, height) {
        const g = this.snapGrid();
        const ox = window.$gameMap ? $gameMap.displayX() * g.tw : 0;
        const oy = window.$gameMap ? $gameMap.displayY() * g.th : 0;
        const tw = g.w, th = g.h;
        const lines = (size, offset, limit) => {
            const out = [];
            let first = ((-offset % size) + size) % size;
            for (let p = first; p < limit; p += size) out.push(Math.round(p * 100) / 100);
            return out;
        };
        return { xs: lines(tw, ox, width), ys: lines(th, oy, height) };
    },

    toggleGrid() {
        // Spriteset_Map (updateDocsEditorOverlay) draws the grid in map space, on tile edges at any scale.
        this.gridSnapShow = !this.gridSnapShow;
        this.showToast(this.gridSnapShow ? 'Grid on' : 'Grid off');
    },

    toggleInspector() {
        this.foldPanel('inspector', !this.isFolded('inspector'));
    },

    focusSearch() {
        const inp = document.getElementById('dd-search-input');
        if (inp) {
            inp.focus();
            inp.select();
        }
    },

    // Shows newly placed doodads without rebuilding the others' sprites.
    addDoodadSprites(items) {
        if (!items || items.length === 0) return;
        const spriteset = typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene._spriteset : null;
        if (spriteset && spriteset.addDocsDoodadSprites) spriteset.addDocsDoodadSprites(items);
        else this.refreshSpriteset();
    },

    // Each tile's height (in tiles) as a number on the tiles under the Hills brush. The labels are PIXI
    // text kept on the overlay and reused; the ones not needed this frame are hidden.
    drawHeightLabels(g, tiles) {
        if (!g || typeof g.addChild !== 'function' || typeof PIXI === 'undefined' || !PIXI.Text) return;
        const pool = g._ddHeightLabels = g._ddHeightLabels || [];
        const T = DocsDoodads.Terrain;
        const grid = tiles.length ? T.grid(true) : null;
        const tw = tiles.length ? $gameMap.tileWidth() : 0, th = tiles.length ? $gameMap.tileHeight() : 0;
        tiles.forEach((t, i) => {
            let label = pool[i];
            if (!label) {
                label = new PIXI.Text('', { fontFamily: 'sans-serif', fontSize: 13, fontWeight: 'bold', fill: '#ffffff', stroke: '#2f2a43', strokeThickness: 4 });
                if (label.anchor && label.anchor.set) label.anchor.set(0.5);
                pool.push(label);
                g.addChild(label);
            }
            const text = this.heightLabel(grid ? T.tileHeight(grid, t.x, t.y) : 0);
            if (label.text !== text) label.text = text;
            label.x = ($gameMap.adjustX(t.x) + 0.5) * tw;
            label.y = ($gameMap.adjustY(t.y) + 0.5) * th;
            label.visible = true;
        });
        for (let i = tiles.length; i < pool.length; i++) pool[i].visible = false;
    },

    heightLabel(h) {
        const n = Math.round((Number(h) || 0) * 100) / 100;
        return n === 0 ? '0' : String(n);
    },

    // [ and ]: the size of the tool that is out (Scatter, Paint or Hills), through its own slider.
    brushSizeSteps: { brush: ['dd-brush-rad', 10, 20, 250], biome: ['dd-biome-rad', 16, 24, 320], terrain: ['dd-terrain-radius', 1, 0, 6] },

    resizeBrush(dir) {
        const spec = this.brushSizeSteps[this.placementTool];
        const el = spec && typeof document !== 'undefined' ? document.getElementById(spec[0]) : null;
        if (!el) return false;
        const current = Number(el.value);
        const fallback = { brush: this.brushSettings.radius, biome: this.biomeSettings && this.biomeSettings.radius, terrain: this.terrainBrush.radius }[this.placementTool];
        const from = Number.isFinite(current) && el.value !== '' ? current : Number(fallback) || spec[2];
        const next = Math.max(spec[2], Math.min(spec[3], from + (dir > 0 ? spec[1] : -spec[1])));
        el.value = String(next);
        if (typeof el.oninput === 'function') el.oninput({ target: el });
        return true;
    },

    refreshSpriteset(sortOnly) {
        if (typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset) {
            if (sortOnly) {
                SceneManager._scene._spriteset.sortDocsDoodads();
            } else {
                SceneManager._scene._spriteset.addDocsDoodads();
            }
        }
    },

    // The undo step that adds doodads to a map's list (place, duplicate, paste) or takes them out (delete),
    // on the list it is made for whatever map is shown when it is redone. Taken out and brought back, each
    // returns to where it was in the list (in list order), so doodads with the same z keep their order.
    doodadListStep(type, list, items, adding) {
        const at = items.map(d => ({ d, index: list.indexOf(d) })).filter(r => adding || r.index > -1).sort((a, b) => a.index - b.index);
        const add = () => {
            if (adding) items.forEach(d => { if (!list.includes(d)) list.push(d); });
            else at.forEach(r => { if (!list.includes(r.d)) list.splice(Math.min(r.index, list.length), 0, r.d); });
            DocsDoodads.Persistence.dirtyDoodads = true;
            this.refreshSpriteset();
        };
        const remove = () => {
            items.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); });
            this.refreshSpriteset();
        };
        return { type, apply: adding ? add : remove, revert: adding ? remove : add };
    },

    deleteSelectedDoodad() {
        const items = (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : [])).filter(d => !d.locked);
        if (items.length === 0) {
            if (this.selectedDoodad && this.selectedDoodad.locked) {
                this.showToast("Cannot delete: Doodad is locked.");
            }
            return;
        }
        const mapId = (window.$gameMap && typeof window.$gameMap.mapId === 'function') ? window.$gameMap.mapId() : 0;
        const list = (window.$dataDocsDoodads && window.$dataDocsDoodads[mapId]) ? window.$dataDocsDoodads[mapId] : [];
        const toDelete = [...items];
        DocsDoodads.Undo.execute(this.doodadListStep('delete_doodads', list, toDelete, false));
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.refreshInspector();
        this.toastUndo(`Deleted ${toDelete.length} Doodad(s)`);
    },

    duplicateSelectedDoodad() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0 || !window.$gameMap) return;
        const mapId = typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const duplicates = [];

        duplicates.push(...this.cloneDoodadsForCopy(items));
        DocsDoodads.Undo.execute(this.doodadListStep('duplicate_doodads', list, duplicates, true));
        this.selectDoodads(duplicates);
        this.showToast(`Duplicated ${duplicates.length} Doodad(s)`);
    },

    // Ghost Follower Preview
    showGhost(asset, clientX, clientY, isAlt) {
        if (!this.ghostEl) {
            this.ghostEl = document.createElement('div');
            this.ghostEl.id = 'dd-map-ghost';
            this.ghostEl.style.cssText = `
                position: fixed; pointer-events: none; z-index: 10002;
                opacity: 0.65; transform: translate(-50%, -100%);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            `;
            const img = document.createElement('img');
            img.id = 'dd-ghost-img';
            img.style.cssText = 'image-rendering: pixelated; max-width: 144px; max-height: 144px;';
            this.ghostEl.appendChild(img);
            document.body.appendChild(this.ghostEl);
        }

        // img.src reads back as an absolute URL, so the path last set is kept to compare with.
        const img = document.getElementById('dd-ghost-img');
        if (img && this._ghostPath !== asset.path) {
            this._ghostPath = asset.path;
            img.src = asset.path;
        }

        let posX = clientX;
        let posY = clientY;

        if (!isAlt && window.$gameMap) {
            const coords = this.clientToMapCoords(clientX, clientY);
            const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
                const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                const tileScreen = DocsDoodads.mapToScreen(coords.tileX * tw + tw / 2, coords.tileY * th + th);
                const screenTileX = tileScreen.x * scaleX + rect.left;
                const screenTileY = tileScreen.y * scaleY + rect.top;
                posX = screenTileX;
                posY = screenTileY;
            }
        }

        this.ghostEl.style.left = posX + 'px';
        this.ghostEl.style.top = posY + 'px';
    },

    removeGhost() {
        if (this.ghostEl && this.ghostEl.parentNode) {
            this.ghostEl.parentNode.removeChild(this.ghostEl);
        }
        this.ghostEl = null;
        this._ghostPath = null;
    },

    // Bottom-centre of the tile under a map point (the default placement spot).
    // A doodad stands at the bottom middle of its grid cell; tileX / tileY are the map tile (for events).
    snapToTile(coords) {
        const g = this.snapGrid(), tw = g.tw, th = g.th;
        const tileX = coords.tileX !== undefined ? coords.tileX : Math.floor(coords.x / tw);
        const tileY = coords.tileY !== undefined ? coords.tileY : Math.floor(coords.y / th);
        if ((g.w === tw && g.h === th) || !Number.isFinite(coords.x) || !Number.isFinite(coords.y)) {
            return { x: tileX * tw + tw / 2, y: tileY * th + th, tileX, tileY };
        }
        return { x: Math.floor(coords.x / g.w) * g.w + g.w / 2, y: Math.floor(coords.y / g.h) * g.h + g.h, tileX, tileY };
    },

    clientToMapCoords(clientX, clientY) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || !window.$gameMap) return { x: 0, y: 0, tileX: 0, tileY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = (canvas.width && rect.width) ? (canvas.width / rect.width) : 1;
        const scaleY = (canvas.height && rect.height) ? (canvas.height / rect.height) : 1;
        const screenX = (clientX - rect.left) * scaleX;
        const screenY = (clientY - rect.top) * scaleY;

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        this._lastScreenPoint = { x: screenX, y: screenY };
        let mapped = DocsDoodads.screenToMap(screenX, screenY);
        if (DocsDoodads.Perspective.liveCamera()) {
            const grab = this._drag && this._drag.grab ? this._drag.grab : { x: 0, y: 0 };
            mapped = DocsDoodads.screenPointToMap(screenX - grab.x, screenY - grab.y) || this._lastGroundPoint || mapped;
            this._lastGroundPoint = mapped;
        }
        const mapPixelX = mapped.x;
        const mapPixelY = mapped.y;
        const tileX = Math.floor(mapPixelX / tw);
        const tileY = Math.floor(mapPixelY / th);
        return { x: mapPixelX, y: mapPixelY, tileX, tileY };
    },

    // Engine elements stacked above the canvas (MZ #gameVideo/#errorPrinter, MV #GameVideo/#ErrorPrinter)
    // would otherwise receive every drop and click aimed at the map.
    canvasOverlayIds: ['gameVideo', 'errorPrinter', 'GameVideo', 'ErrorPrinter'],

    setCanvasOverlaysPassthrough(enabled) {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
        if (enabled) {
            this._overlayPointerEvents = {};
            for (const id of this.canvasOverlayIds) {
                const el = document.getElementById(id);
                if (!el || !el.style) continue;
                this._overlayPointerEvents[id] = el.style.pointerEvents;
                el.style.pointerEvents = 'none';
            }
        } else if (this._overlayPointerEvents) {
            for (const [id, previous] of Object.entries(this._overlayPointerEvents)) {
                const el = document.getElementById(id);
                if (el && el.style) el.style.pointerEvents = previous;
            }
            this._overlayPointerEvents = null;
        }
    },

