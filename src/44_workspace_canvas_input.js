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
        const deletedRecords = toDelete.map(d => ({ doodad: d, index: list.indexOf(d) })).filter(r => r.index > -1);

        const cmd = {
            apply: () => {
                toDelete.forEach(d => {
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                });
                this.refreshSpriteset();
            },
            revert: () => {
                deletedRecords.forEach(r => {
                    if (!list.includes(r.doodad)) list.splice(r.index, 0, r.doodad);
                });
                this.refreshSpriteset();
            }
        };
        cmd.type = cmd.type || 'delete_doodads';
        DocsDoodads.Undo.execute(cmd);
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

        const cmd = {
            apply: () => {
                duplicates.forEach(d => list.push(d));
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        cmd.type = cmd.type || 'duplicate_doodads';
        DocsDoodads.Undo.execute(cmd);
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

        const img = document.getElementById('dd-ghost-img');
        if (img && img.src !== asset.path) img.src = asset.path;

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

    attachCanvasListeners() {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas) return;
        this.setCanvasOverlaysPassthrough(true);

        this._onDragOver = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.showGhost(this.activeDragPayload, e.clientX, e.clientY, e.altKey);
            }
        };

        this._onDrop = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.removeGhost();
                const payload = this.activeDragPayload;
                this.activeDragPayload = null;
                const coords = this.clientToMapCoords(e.clientX, e.clientY);

                if (payload.category === 'Audio') return this.askAudioDrop(payload, coords);

                if (payload.type === 'prefab') {
                    this.placePrefab(DocsDoodads.Prefabs.get(payload.prefabId), e.altKey ? coords : this.snapToTile(coords));
                    return;
                }
                if (payload.placementMode === 'ask') {
                    this.showAskEventModal(payload, coords, e.altKey);
                } else {
                    const snapCoords = e.altKey ? coords : this.snapToTile(coords);
                    this.commitPlacement(payload, snapCoords, payload.placementMode);
                }
            }
        };

        this._onCanvasContextMenu = (e) => {
            if (!this.mounted) return;
            e.preventDefault();
            // With Scatter out, the right button erases instead.
            if (this.placementTool === 'brush') return;
            const coords = this.clientToMapCoords(e.clientX, e.clientY);
            const items = [];

            // Check if right-clicking placed doodad
            const clickedDoodad = this.doodadAt(coords.x, coords.y);

            if (clickedDoodad) {
                // Right-clicking one of several picked doodads keeps them all picked.
                if (!this.selectionItems().includes(clickedDoodad)) this.selectDoodad(clickedDoodad);
                items.push({ label: 'Bring Forward (+1 Z)', icon: '⬆️', onClick: () => this.bringForward([clickedDoodad]) });
                items.push({ label: 'Send Backward (-1 Z)', icon: '⬇️', onClick: () => this.sendBackward([clickedDoodad]) });
                items.push({ label: 'Bring to Front', icon: '⏫', onClick: () => this.bringToFront([clickedDoodad]) });
                items.push({ label: 'Send to Back', icon: '⏬', onClick: () => this.sendToBack([clickedDoodad]) });
                items.push({ separator: true });
                items.push({ label: 'Duplicate (Ctrl+D)', icon: '📄', onClick: () => this.duplicateSelectedDoodad() });
                items.push({ label: clickedDoodad.locked ? 'Unlock' : 'Lock', icon: clickedDoodad.locked ? '🔓' : '🔒', onClick: () => this.lockSelected(!clickedDoodad.locked) });
                items.push({ label: 'Hide in Editor', icon: '👁️', onClick: () => this.hideSelected(true) });
                const layers = DocsDoodads.Layers.list(DocsDoodads.Lighting.mapSettings(this.currentMapId()));
                const onLayer = DocsDoodads.Layers.of(clickedDoodad);
                for (const layer of layers.length > 1 ? layers : []) {
                    if (layer.id !== onLayer) items.push({ label: `Move to Layer: ${layer.name}`, icon: '🗂️', onClick: () => this.moveSelectionToLayer(layer.id) });
                }
                items.push({ separator: true });
                items.push({ label: 'Select Same Art', icon: '🖼️', onClick: () => this.selectSameArt(clickedDoodad) });
                if (layers.length > 1) {
                    const layerName = (layers.find(l => l.id === onLayer) || { name: 'Main' }).name;
                    items.push({ label: `Select Everything on ${layerName}`, icon: '🗂️', onClick: () => this.selectLayer(onLayer) });
                }
                if (clickedDoodad.bit && clickedDoodad.bit[0] === 3) items.push({ label: 'Replace Art...', icon: '🔁', onClick: () => this.showReplaceArt() });
                items.push({ label: 'Delete (Del)', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedDoodad() });
                this.showContextMenu(e.clientX, e.clientY, items);
                return;
            }

            // Check if right-clicking placed MZ Event
            if (window.$gameMap && window.$gameMap.eventsXy) {
                const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                if (evs && evs.length > 0) {
                    const ge = evs[0];
                    const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                    const evObj = staged || ge.event();
                    this.selectEvent({ gameEvent: ge, stagedEvent: evObj });
                    items.push({
                        label: 'Save as Event Template...', icon: '💾', onClick: () => this.saveEventAsTemplate(evObj, evObj.name || ("Template_EV" + ge.eventId()))
                    });
                    items.push({ label: 'Duplicate Event', icon: '📄', onClick: () => this.duplicateSelectedEvent() });
                    items.push({ label: 'Delete Event', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedEvent() });
                    this.showContextMenu(e.clientX, e.clientY, items);
                    return;
                }
            }

            // Right-clicking empty map
            items.push({ label: this.gridSnapShow ? 'Hide Grid Overlay (G)' : 'Show Grid Overlay (G)', icon: '📐', onClick: () => this.toggleGrid() });
            if (this._clipboardDoodads && this._clipboardDoodads.length > 0) {
                items.push({ label: `Paste ${this._clipboardDoodads.length} Doodad(s) (Ctrl+V)`, icon: '📑', onClick: () => this.pasteCopied() });
                items.push({ label: 'Paste in Place (Ctrl+Shift+V)', icon: '📌', onClick: () => this.pasteCopied(true) });
            }
            items.push({ label: 'Select All (Ctrl+A)', icon: '⬚', onClick: () => this.selectAllDoodads() });
            if (this.selectionItems().length > 0) items.push({ label: 'Invert Selection', icon: '◪', onClick: () => this.invertSelection() });
            if (this.selectedAsset) {
                items.push({ label: `Stamp ${this.selectedAsset.fileName} Here`, icon: '📌', onClick: () => this.commitPlacement(this.selectedAsset, coords) });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                return;
            }
            this.closeContextMenu();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);

            // 1. Eyedropper Tool or Alt held
            if (this.placementTool === 'eyedropper' || e.altKey) {
                this.handleEyedropper(coords);
                return;
            }

            // 2. Path Tool: collect points
            if (this.placementTool === 'path') {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('First pick a picture in the Item Bag to draw a path with.');
                    return;
                }
                this.pathPoints.push(e.altKey ? { x: coords.x, y: coords.y } : this.snapToTile(coords));
                return;
            }

            // 3. Stamp Tool
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                const snapCoords = e.altKey ? coords : this.snapToTile(coords);
                this.commitPlacement(this.selectedAsset, snapCoords);
                return;
            }

            // 3. Normal Pointer: Select placed doodad or MZ event
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };

        this._onCanvasMouseDown = (e) => {
            if (e.button === 1 && this.beginCameraDrag(e)) return;
            if (this.placementTool === 'brush' && e.button === 2) {
                this.beginScatterErase(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'brush' && this.selectedAsset && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.scatterAt(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'terrain' && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.beginTerrainStroke(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'biome' && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this._lastDab = null;
                this.biomePaintAt(e.clientX, e.clientY);
                return;
            }
            if (!this.placementTool && e.button === 0 && !e.shiftKey && !e.altKey) {
                const point = this.clientToMapCoords(e.clientX, e.clientY);
                if (this.beginDoodadDrag(point)) {
                    this._dragClientStart = { x: e.clientX, y: e.clientY };
                    this._dragActive = false;
                    return;
                }
            }
            if (!this.placementTool && e.button === 0) {
                this.isMarqueeActive = true;
                this.marqueeStartClient = { x: e.clientX, y: e.clientY };
                this.marqueeShift = e.shiftKey;
                this.hasMarqueeMoved = false;
            }
        };

        this._onCanvasMouseMove = (e) => {
            // The button came up outside the window: the stroke ends there, not on the next hover.
            if (this.isBrushActive && e.buttons === 0) {
                this._onCanvasMouseUp(e);
                return;
            }
            if (this._camDrag) {
                this.updateCameraDrag(e);
                return;
            }
            this.trackCursor(e.clientX, e.clientY, e.target);
            if (this._drag) {
                // The mouse-up was missed (e.g. focus left the window): finish where the drag last was.
                if (e.buttons === 0) {
                    if (this.endDoodadDrag()) this._suppressNextClick = true;
                    this._dragActive = false;
                    return;
                }
                // A small wobble while clicking is not a move.
                if (!this._dragActive && Math.hypot(e.clientX - this._dragClientStart.x, e.clientY - this._dragClientStart.y) < 4) return;
                this._dragActive = true;
                this.updateDoodadDrag(this.clientToMapCoords(e.clientX, e.clientY), { shiftKey: e.shiftKey, altKey: e.altKey });
                this.showDragReadout(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'path') {
                const hover = this.clientToMapCoords(e.clientX, e.clientY);
                this._pathHover = e.altKey ? { x: hover.x, y: hover.y } : this.snapToTile(hover);
                return;
            }
            if (this.placementTool === 'terrain' && !this.isBrushActive) this.trackTerrainHover(e);
            if (this.placementTool === 'brush') this._brushHover = this.clientToMapCoords(e.clientX, e.clientY);
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this._scatterErase) {
                this.scatterEraseAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'biome') {
                this.biomePaintAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'terrain') {
                this.terrainPaintAt(e.clientX, e.clientY);
                this.trackTerrainHover(e);
            } else if (this.isMarqueeActive && this.marqueeStartClient) {
                const dx = e.clientX - this.marqueeStartClient.x;
                const dy = e.clientY - this.marqueeStartClient.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasMarqueeMoved = true;
                    let overlay = document.getElementById('dd-marquee-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'dd-marquee-overlay';
                        overlay.style.cssText = `
                            position: fixed; pointer-events: none; z-index: 10006;
                            border: 1px dashed var(--dd-primary); background: rgba(56, 189, 248, 0.18);
                            box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
                            border-radius: 2px;
                        `;
                        document.body.appendChild(overlay);
                    }
                    const left = Math.min(this.marqueeStartClient.x, e.clientX);
                    const top = Math.min(this.marqueeStartClient.y, e.clientY);
                    overlay.style.left = left + 'px';
                    overlay.style.top = top + 'px';
                    overlay.style.width = Math.abs(dx) + 'px';
                    overlay.style.height = Math.abs(dy) + 'px';
                }
            }
        };

        this._onCanvasMouseUp = (e) => {
            if (this._camDrag) {
                this.endCameraDrag();
                return;
            }
            if (this._drag) {
                if (this.endDoodadDrag()) this._suppressNextClick = true;
                this._dragActive = false;
                return;
            }
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this._scatterErase) this.endScatterErase();
                if (this._terrainStroke) this.endTerrainStroke();
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        },
                        revert: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        }
                    };
                    cmd.type = this.placementTool === 'biome' ? 'biome_paint' : 'scatter_doodads';
                    DocsDoodads.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
            if (this.isMarqueeActive) {
                const overlay = document.getElementById('dd-marquee-overlay');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (this.hasMarqueeMoved && this.marqueeStartClient) {
                    const enclosed = this.doodadsInClientBox(this.marqueeStartClient, { x: e.clientX, y: e.clientY });

                    if (this.marqueeShift) {
                        const current = this.selectedDoodads ? [...this.selectedDoodads] : [];
                        enclosed.forEach(d => {
                            if (!current.includes(d)) current.push(d);
                        });
                        this.selectDoodads(current);
                    } else {
                        this.selectDoodads(enclosed);
                    }
                    this._suppressNextClick = true;
                    this.showToast(`Marquee: Selected ${enclosed.length} doodad(s)`);
                }
                this.isMarqueeActive = false;
            }
        };

        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
            canvas.addEventListener('contextmenu', this._onCanvasContextMenu);
            this._onCanvasWheel = (e) => this.wheelCamera(e);
            canvas.addEventListener('wheel', this._onCanvasWheel, { passive: false });
            this._onCanvasDblClick = (e) => {
                if (this.placementTool === 'path') {
                    e.preventDefault();
                    this.finishPath();
                }
            };
            canvas.addEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('mousemove', this._onCanvasMouseMove);
            window.addEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // ---- 3D camera with the mouse (editor only) ----
    // Middle-drag orbits, Shift + middle-drag pans, the wheel zooms, a middle click resets. The view is a
    // camera change for this visit (like Set Camera): the map's own camera settings are not changed.
    canvasPoint(e) {
        if (typeof Graphics !== 'undefined' && Graphics.pageToCanvasX) return { x: Graphics.pageToCanvasX(e.pageX), y: Graphics.pageToCanvasY(e.pageY) };
        return { x: e.clientX, y: e.clientY };
    },

    beginCameraDrag(e) {
        if (!this.mounted || !DocsDoodads.Perspective.liveCamera()) return false;
        if (e.preventDefault) e.preventDefault();
        const at = this.canvasPoint(e);
        const cam = DocsDoodads.Perspective.liveCamera();
        this._camDrag = { x: e.clientX, y: e.clientY, pan: Boolean(e.shiftKey), moved: false,
            ground: DocsDoodads.Perspective.unproject(cam, at.x, at.y) };
        return true;
    },

    updateCameraDrag(e) {
        const drag = this._camDrag;
        const P = DocsDoodads.Perspective;
        const s = P.active();
        if (!s || e.buttons === 0) return this.endCameraDrag();
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        if (drag.pan) {
            // Keep the ground point grabbed under the mouse.
            const cam = P.liveCamera(), at = this.canvasPoint(e);
            const now = cam && drag.ground ? P.unproject(cam, at.x, at.y) : null;
            if (now) {
                const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
                $gameMap.setDisplayPos($gameMap.displayX() + (drag.ground.x - now.x) / tw, $gameMap.displayY() + (drag.ground.y - now.y) / th);
            }
        } else {
            this.setCameraView(P.orbit(s, dx, dy));
            drag.x = e.clientX;
            drag.y = e.clientY;
        }
    },

    endCameraDrag() {
        const drag = this._camDrag;
        this._camDrag = null;
        if (drag && !drag.moved) {
            this.setCameraView(null);
            if (typeof $gamePlayer !== 'undefined' && $gamePlayer) $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
            this.showToast("3D view reset to the map's camera");
        }
    },

    wheelCamera(e) {
        if (!this.mounted || !DocsDoodads.Perspective.liveCamera()) return;
        e.preventDefault();
        const s = DocsDoodads.Perspective.active();
        if (s) this.setCameraView({ zoom: DocsDoodads.Perspective.wheelZoom(s.zoom, e.deltaY) });
    },

    // null goes back to the map's own camera.
    setCameraView(change) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        $gameMap._docsCameraTween = null;
        $gameMap._docsCamera = change ? Object.assign({}, $gameMap._docsCamera, change) : null;
    },

    detachCanvasListeners() {
        this.setCanvasOverlaysPassthrough(false);
        const canvas = DocsDoodads.Compat.getCanvas();
        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
            if (this._onCanvasDblClick) canvas.removeEventListener('dblclick', this._onCanvasDblClick);
            if (this._onCanvasWheel) canvas.removeEventListener('wheel', this._onCanvasWheel);
        }
        this._camDrag = null;
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
            if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // Evenly spaced scatter: props keep minDistance from each other and from what is already there,
    // and only land where the region/terrain/passability rules allow.
    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        this._scatterRng = this._scatterRng || DocsDoodads.Scatter.rng(Date.now());
        const rng = this._scatterRng;
        const reach = b.radius + (b.minDistance || 0);
        const existing = list.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        const points = DocsDoodads.Scatter.candidates(coords, b.radius, b.minDistance || 0, existing, b.density, rng);
        const rules = {
            regions: DocsDoodads.Scatter.parseIdList(b.regions),
            terrainTags: DocsDoodads.Scatter.parseIdList(b.terrainTags),
            avoidBlocked: Boolean(b.avoidBlocked)
        };
        const query = this.scatterQuery();

        const placed = [];
        for (const p of points) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const v = DocsDoodads.Scatter.variation(b, rng);
            const d = this.newDoodadFromAsset(asset, Math.round(p.x), Math.round(p.y));
            d.scaleX = v.scale * (v.flipX ? -1 : 1);
            d.scaleY = v.scale;
            d.rotation = v.rotation;
            if (v.hue) d.hue = v.hue;
            for (const item of this.withMirrors(d)) {
                list.push(item);
                this.currentBrushBatch.push(item);
                placed.push(item);
            }
        }
        this.addDoodadSprites(placed);
    },

    // Scatter's eraser (right-drag): takes away the picked item's doodads inside the brush circle, never
    // locked ones or ones on hidden or locked layers. One undo step a stroke.
    beginScatterErase(clientX, clientY) {
        if (!this.selectedAsset || !this.selectedAsset.path) {
            this.showToast('Pick the item to erase in the Item Bag first.', 'info');
            return false;
        }
        const mapId = this.currentMapId();
        this.isBrushActive = true;
        this.currentBrushBatch = [];
        this._scatterErase = { mapId, key: this.artKey({ bit: [3, this.selectedAsset.path] }), before: this.snapshotMapLists([mapId]), removed: 0 };
        this.scatterEraseAt(clientX, clientY);
        return true;
    },

    scatterEraseAt(clientX, clientY) {
        const erase = this._scatterErase;
        if (!erase) return 0;
        const at = this.clientToMapCoords(clientX, clientY);
        this._brushHover = at;
        const list = (window.$dataDocsDoodads || {})[erase.mapId] || [];
        const r = Math.max(4, Number(this.brushSettings.radius) || 0);
        const gone = new Set(list.filter(d => d && !d.locked && !d.editorHidden && this.layerAllowsEditing(d) &&
            this.artKey(d) === erase.key && Math.hypot(d.x - at.x, d.y - at.y) <= r));
        if (gone.size === 0) return 0;
        for (let i = list.length - 1; i >= 0; i--) if (gone.has(list[i])) list.splice(i, 1);
        erase.removed += gone.size;
        if (this.selectionItems().some(d => gone.has(d))) this.selectDoodads(this.selectionItems().filter(d => !gone.has(d)));
        this.refreshSpriteset();
        return gone.size;
    },

    endScatterErase() {
        const erase = this._scatterErase;
        this._scatterErase = null;
        if (!erase || !erase.removed) return 0;
        this.recordMapListsEdit(erase.before, 'scatter_erase');
        this.toastUndo(`Erased ${erase.removed} prop(s).`);
        return erase.removed;
    },

    handleEyedropper(coords) {
        const d = this.doodadAt(coords.x, coords.y);
        if (d) {
            const sourcePath = d.bit && d.bit[0] === 3 ? String(d.bit[1]).replace(/\\/g, '/').toLowerCase() : null;
            const asset = sourcePath && DocsDoodads.AssetIndex.list.find(a => String(a.path || '').replace(/\\/g, '/').toLowerCase() === sourcePath);
            if (asset) {
                this.selectAsset(asset);
                this.showToast(`Eyedropper: Selected ${asset.fileName} in drawer`);
            } else {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
            }
            return;
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = DocsDoodads.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
                    if (matchedAsset) {
                        this.selectAsset(matchedAsset);
                        this.showToast(`Eyedropper: Matched Character Sheet ${charName}`);
                        return;
                    }
                }
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Eyedropper: Selected Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        this.showToast("No doodad or event under cursor");
    },

    doodadContainsPoint(d, x, y) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0);
        if (x >= left && x <= left + w && y >= top && y <= top + h) return true;
        // Keep small props easy to click.
        return Math.hypot(d.x - x, d.y - y) < 40;
    },

    // Screen-space boxes for the selected doodads, matching Sprite_DocsDoodad placement.
    // Page (client) pixels to the game canvas's own pixels.
    clientToCanvas(clientX, clientY) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return { x: clientX, y: clientY };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width && rect.width ? canvas.width / rect.width : 1;
        const scaleY = canvas.height && rect.height ? canvas.height / rect.height : 1;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    },

    // Where a doodad's foot is drawn, in canvas pixels: on the copy in view on a looping map, and on the
    // ground of a 3D map (any camera turn). null when it is behind the camera.
    doodadFootOnScreen(d) {
        const flat = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
        const P = DocsDoodads.Perspective;
        const cam = P.liveCamera ? P.liveCamera() : null;
        if (!cam) return flat;
        const grid = DocsDoodads.Terrain.grid();
        const z = grid && (grid.max !== 0 || grid.min !== 0) ? DocsDoodads.Terrain.heightPxAtFlat(flat.x, flat.y) : 0;
        return P.project(cam, flat.x, flat.y, z);
    },

    // The editable doodads whose foot is inside the box dragged between two page points.
    doodadsInClientBox(c0, c1) {
        const a = this.clientToCanvas(c0.x, c0.y), b = this.clientToCanvas(c1.x, c1.y);
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x), minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
        return (DocsDoodads.doodads() || []).filter(d => {
            if (!d || d.editorHidden || !this.layerAllowsEditing(d)) return false;
            const p = this.doodadFootOnScreen(d);
            return Boolean(p) && p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
        });
    },

    selectionScreenRects() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        return items.filter(d => !d.editorHidden).map(d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
            const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const at = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
            return {
                x: at.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5),
                y: at.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0),
                w, h
            };
        });
    },

    // A doodad's image rectangle and foot point in flat (tilemap) pixels.
    doodadFlatBox(d) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const at = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
        const rect = { x: at.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5), y: at.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0), w, h };
        const pivot = { x: at.x, y: at.y + (DocsDoodads.Depth.baseY(d) - d.y) };
        // A doodad shown as a 3D model: the box is the model's size (turned to any side), standing on the pivot.
        const model = DocsDoodads.Perspective.active() && d.model && d.model.path ? DocsDoodads.Models.get(d.model.path) : null;
        if (model && model.ready && model.primitives.length) {
            const unit = Math.abs(Number(d.model.scale) || 1) * (window.$gameMap ? $gameMap.tileWidth() : 48);
            const half = Math.max(Math.abs(model.min[0]), Math.abs(model.max[0]), Math.abs(model.min[2]), Math.abs(model.max[2])) * unit;
            const tall = Math.max(1, model.max[1]) * unit;
            rect.x = pivot.x - half; rect.w = half * 2;
            rect.y = pivot.y - tall; rect.h = tall;
        }
        pivot.h = DocsDoodads.Terrain.doodadHeightPxAtFlat(pivot.x, pivot.y, w / 2);
        // In 3D, standing doodads can be drawn smaller or larger; picking and boxes match.
        const p3d = DocsDoodads.Perspective.active();
        const k = p3d ? p3d.doodadScale : 1;
        if (k !== 1) {
            rect.x = pivot.x + (rect.x - pivot.x) * k;
            rect.y = pivot.y + (rect.y - pivot.y) * k;
            rect.w *= k;
            rect.h *= k;
        }
        return { rect, pivot };
    },

    // The selection as boxes for the 3D view.
    selection3d() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        return items.filter(d => !d.editorHidden).map(d => this.doodadFlatBox(d));
    },

    // In 3D, the nearest standing doodad drawn under the last screen point.
    doodadAtScreen(screen) {
        const P = DocsDoodads.Perspective;
        const cam = P.liveCamera();
        let best = null, bestDepth = Infinity;
        for (const d of DocsDoodads.doodads() || []) {
            if (d.editorHidden || !this.layerAllowsEditing(d)) continue;
            // Models are picked by what's drawn: their triangles, not a box around them.
            const spriteset = typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene._spriteset : null;
            const modelDepth = d.model && d.model.path && spriteset && spriteset.docsModelHit ? spriteset.docsModelHit(d, screen.x, screen.y) : undefined;
            if (modelDepth !== undefined && spriteset._docsDoodadSprites && spriteset._docsDoodadSprites.some(sp => sp._data === d && sp._docsModelMeshes && sp._docsModelMeshes.some(m => m && m._docsDrawn))) {
                if (modelDepth !== null && modelDepth < bestDepth) { best = d; bestDepth = modelDepth; }
                continue;
            }
            const box = this.doodadFlatBox(d);
            const r = P.screenRect(cam, box.rect, box.pivot);
            if (!r || screen.x < r.x || screen.x > r.x + r.w || screen.y < r.y || screen.y > r.y + r.h) continue;
            if (r.depth < bestDepth) { best = d; bestDepth = r.depth; }
        }
        return best;
    },

    // Topmost visible doodad whose image covers the map point.
    doodadAt(x, y) {
        if (DocsDoodads.Perspective.liveCamera() && this._lastScreenPoint) return this.doodadAtScreen(this._lastScreenPoint);
        const list = DocsDoodads.doodads() || [];
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (!d.editorHidden && this.layerAllowsEditing(d) && this.doodadContainsPoint(d, x, y)) return d;
        }
        return null;
    },

    handleDoodadSelection(coords, isMulti) {
        const hit = this.doodadAt(coords.x, coords.y);
        if (hit) {
            this.selectDoodad(hit, isMulti);
            return;
        }
        // If no doodad clicked, check for genuine MZ Event on that tile
        if (!isMulti && window.$gameMap && window.$gameMap.eventsXy) {
            const events = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (events && events.length > 0) {
                const ge = events[0];
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Selected Map Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
            this.selectEvent(null);
        }
    },

    showAskEventModal(payload, coords, isAlt) {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('help', 1)} Doodad or event?</div>
            <div style="font-size: 12px; color: var(--dd-text); margin-bottom: 16px;">Does ${escapeHtml(payload.fileName)} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-ask-yes">Yes (Create MZ Event)</button>
                <button class="dd-btn" id="dd-ask-no">No (Decorative Doodad)</button>
                <button class="dd-btn" id="dd-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="dd-btn" id="dd-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="dd-btn" id="dd-ask-cancel" style="width: 100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const snapCoords = isAlt ? coords : this.snapToTile(coords);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-yes-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);
        const { name: baseName, code } = DocsDoodads.Audio.soundFor(payload);

        const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: `Sound_${baseName}`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: [
                { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });

        const staged = $gameMap._stagedMapData;
        DocsDoodads.Undo.execute({
            type: 'create_event',
            apply: () => { staged.events[newId] = ev; DocsDoodads.Persistence.dirtyMap = true; },
            revert: () => { delete staged.events[newId]; DocsDoodads.Persistence.dirtyMap = true; }
        });
        this.showToast(`Created Sound Event EV${String(newId).padStart(3, '0')}`);
    },

    deleteSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ge = evInfo.gameEvent;
        const ev = evInfo.stagedEvent || (ge && ge.event());
        const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
        if (!evId) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                if (ge && ge._erased !== undefined) ge._erased = true;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                if (ge && ge._erased !== undefined) ge._erased = false;
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent(null);
        this.toastUndo(`Deleted Event EV${String(evId).padStart(3, '0')}`);
    },

    // The selected event's staged copy (what Save writes); the selection is pointed at it.
    selectedStagedEvent() {
        const info = this.selectedEvent;
        if (!info || !window.$gameMap) return null;
        const id = info.gameEvent ? info.gameEvent.eventId() : (info.stagedEvent && info.stagedEvent.id);
        const staged = DocsDoodads.Persistence.stagedFor();
        const ev = staged && staged.events ? staged.events[id] : null;
        if (ev) info.stagedEvent = ev;
        return ev || null;
    },

    // mutate(ev) changes the selected event; one undo step, and the event on the map follows it.
    editSelectedEvent(type, mutate) {
        const ev = this.selectedStagedEvent();
        if (!ev) return false;
        const ge = this.selectedEvent.gameEvent;
        const before = JSON.parse(JSON.stringify(ev));
        mutate(ev);
        const after = JSON.parse(JSON.stringify(ev));
        const set = snapshot => {
            for (const key of Object.keys(ev)) delete ev[key];
            Object.assign(ev, JSON.parse(JSON.stringify(snapshot)));
            if (ge && (ge.x !== ev.x || ge.y !== ev.y)) ge.locate(ev.x, ev.y);
            DocsDoodads.Persistence.dirtyMap = true;
        };
        DocsDoodads.Undo.execute({ type, apply: () => set(after), revert: () => set(before) });
        return true;
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = (dup.x || 0) + 1;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(`Duplicated to Event EV${String(newId).padStart(3, '0')}`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'dd-context-menu';
        menu.className = 'dd-glass';
        menu.style.cssText = 'position: fixed; z-index: 10050; display: flex; flex-direction: column; gap: 1px;';
        DocsDoodads.Ui.sound('cursor');
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'dd-menu-sep';
                menu.appendChild(sep);
                return;
            }
            const row = document.createElement('button');
            row.className = 'dd-btn' + (item.danger ? ' dd-danger' : '');
            row.style.cssText = 'width: 100%; text-align: left;';
            // Items name a pixel icon (iconName) or give a small symbol.
            const icon = item.iconName ? DocsDoodads.Ui.icon(item.iconName, 1) : `<span style="width: 16px; text-align: center;">${escapeHtml(item.icon || '•')}</span>`;
            row.innerHTML = `${icon}<span>${escapeHtml(item.label)}</span>`;
            row.onclick = (e) => {
                e.stopPropagation();
                this.closeContextMenu();
                if (item.onClick) item.onClick();
            };
            menu.appendChild(row);
        });
        document.body.appendChild(menu);

        const menuW = menu.offsetWidth || 180;
        const menuH = menu.offsetHeight || 200;
        const left = Math.min(clientX, (window.innerWidth || 1200) - menuW - 10);
        const top = Math.min(clientY, (window.innerHeight || 800) - menuH - 10);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        const onDismiss = (ev) => {
            if (menu.contains(ev.target)) return;
            this.closeContextMenu();
            window.removeEventListener('pointerdown', onDismiss);
        };
        setTimeout(() => window.addEventListener('pointerdown', onDismiss), 50);
    },

    closeContextMenu() {
        const existing = document.getElementById('dd-context-menu');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const evId = gameEvent.eventId();
        const ev = $gameMap._stagedMapData.events[evId] || gameEvent.event();
        if (!ev || !ev.pages || !ev.pages[0]) return;

        const { name: baseName, code } = DocsDoodads.Audio.soundFor(payload);

        const soundCmd = { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] };
        const pageList = ev.pages[0].list;
        const insertIdx = Math.max(0, pageList.length - 1);

        const cmd = {
            type: 'append_audio_command',
            apply: () => {
                pageList.splice(insertIdx, 0, soundCmd);
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.showToast(`Appended Sound Command to Event EV${String(evId).padStart(3, '0')}`);
    },

    async runAssetImport(sourcePaths, options = {}) {
        const plan = DocsDoodads.Import.planBatch(sourcePaths, options);
        const result = await DocsDoodads.Import.executeBatchAsync(plan, {
            cancellationToken: options.cancellationToken,
            onProgress: options.onProgress
        });
        if (!result.ok) return result;

        await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
        this.refreshDrawerCards();

        if (options.autoSlice) {
            const path = DocsDoodads.FS.path;
            const imported = new Set(result.imported.map(filePath => path.resolve(filePath).toLowerCase()));
            const firstImage = DocsDoodads.AssetIndex.list.find(asset =>
                asset.category !== 'Audio' && imported.has(path.resolve(asset.path).toLowerCase())
            );
            if (firstImage && typeof setTimeout === 'function') {
                setTimeout(() => DocsDoodads.Slicing.Editor.open(firstImage), 0);
            }
        }
        return result;
    },

    showAssetImportModal(sourcePaths) {
        if (!DocsDoodads.FS.fs || !DocsDoodads.FS.path) {
            this.showToast('Explorer import requires NW.js filesystem access.');
            return;
        }

        const collected = DocsDoodads.Import.collectFiles(sourcePaths);
        const supportedCount = collected.files.filter(filePath => DocsDoodads.Import.isSupported(filePath)).length;
        if (supportedCount === 0) {
            this.showToast('No supported image or audio files were found.');
            return;
        }

        const previous = document.getElementById('dd-import-modal');
        if (previous && previous.parentNode) previous.parentNode.removeChild(previous);

        const overlay = document.createElement('div');
        overlay.id = 'dd-import-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10030; display: flex;
            align-items: center; justify-content: center; background: rgba(47, 42, 67, 0.35);
            pointer-events: auto;
        `;
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = 'width: 430px; padding: 20px; color: var(--dd-text);';
        const destinationOptions = DocsDoodads.Import.destinations
            .map(destination => `<option value="${destination}">${destination}</option>`)
            .join('');
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('plus', 1)} Add Files</div>
            <div style="font-size: 11px; color: var(--dd-muted); margin-bottom: 16px;">
                ${supportedCount} supported file(s) found${collected.files.length !== supportedCount ? `; ${collected.files.length - supportedCount} unsupported skipped` : ''}.
            </div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: var(--dd-text);">Destination</label>
            <select id="dd-import-destination" style="width: 100%; margin-bottom: 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                <option value="auto">Auto-route by asset type</option>
                ${destinationOptions}
            </select>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: var(--dd-text);">When a filename already exists (apply to all)</label>
            <select id="dd-import-collision" style="width: 100%; margin-bottom: 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                <option value="rename">Keep both (add numeric suffix)</option>
                <option value="skip">Skip incoming file</option>
                <option value="overwrite">Overwrite existing file</option>
                <option value="error">Cancel batch on collision</option>
            </select>
            <label style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: var(--dd-text); margin-bottom: 16px;">
                <input id="dd-import-auto-slice" type="checkbox" /> Open the first imported image in the slicer
            </label>
            <div id="dd-import-warning" style="display: none; color: var(--dd-warn); font-size: 11px; margin: -6px 0 12px;">
                Overwrite is explicit and transactional; existing files are restored if the batch fails.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-import-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-import-confirm">Import</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
        const destination = document.getElementById('dd-import-destination');
        const collision = document.getElementById('dd-import-collision');
        const autoSlice = document.getElementById('dd-import-auto-slice');
        const warning = document.getElementById('dd-import-warning');
        const confirmButton = document.getElementById('dd-import-confirm');
        const cancelButton = document.getElementById('dd-import-cancel');

        collision.onchange = () => {
            warning.style.display = collision.value === 'overwrite' ? 'block' : 'none';
        };
        cancelButton.onclick = () => close();
        // The import runs on in a progress pill (with Cancel), so the editor stays usable meanwhile.
        confirmButton.onclick = async () => {
            const token = { cancelled: false };
            const options = { destination: destination.value, collisionPolicy: collision.value, autoSlice: Boolean(autoSlice.checked) };
            close();
            const pill = DocsDoodads.Ui.progress('Bringing in files', { onCancel: () => { token.cancelled = true; } });
            pill.update(0, sourcePaths.length);
            let result;
            try {
                result = await this.runAssetImport(sourcePaths, Object.assign(options, {
                    cancellationToken: token,
                    onProgress: progress => pill.update(progress.completed, progress.total)
                }));
            } finally {
                pill.finish();
            }
            this.showToast(DocsDoodads.Import.describeResult(result), result.ok ? 3500 : 6000);
            this.updateIndexStatus();
        };
        overlay.onclick = event => { if (event.target === overlay) close(); };
    },

    // A message after a step that throws work away, with Undo while that step is still the last one.
    toastUndo(msg, kind) {
        const Undo = DocsDoodads.Undo;
        const cmd = Undo.undoStack[Undo.undoStack.length - 1];
        if (!cmd) return this.showToast(msg, kind);
        return this.showToast(msg, kind, { action: { label: 'Undo', run: () => {
            if (Undo.undoStack[Undo.undoStack.length - 1] === cmd) Undo.undo();
            else this.showToast('Other changes came after it: open Steps to go back further.', 'info');
        } } });
    },

    // A sound dropped on the map: add it to the event on that tile, or make a new event that plays it.
    async askAudioDrop(payload, coords) {
        const existing = window.$gameMap && window.$gameMap.eventsXy ? window.$gameMap.eventsXy(coords.tileX, coords.tileY) : [];
        const targetEv = existing && existing.length > 0 ? existing[0] : null;
        const evName = targetEv ? `EV${String(targetEv.eventId()).padStart(3, '0')}` : '';
        const answer = await DocsDoodads.Ui.choose(targetEv
            ? `Play ${payload.fileName} from ${evName}, the event on this tile, or from a new event?`
            : `Make an event on this tile that plays ${payload.fileName}?`, [
            { label: 'Cancel', value: null },
            ...(targetEv ? [{ label: 'New Event', value: 'new' }] : []),
            targetEv ? { label: `Add to ${evName}`, value: 'append', kind: 'primary' } : { label: 'Make Event', value: 'new', kind: 'primary' }
        ], { title: 'Sound on the map', icon: 'sound' });
        if (!this.mounted) return null;
        if (answer === 'append') this.appendAudioCommandToEvent(payload, targetEv);
        else if (answer === 'new') this.createAudioEvent(payload, coords);
        return answer;
    },

    // Save found the map changed in MZ since the editor opened it. Resolves the answer: 'force' (saved
    // over MZ's changes), 'reload' (MZ's version kept, event edits dropped) or null (nothing done).
    async showConflictModal() {
        const answer = await DocsDoodads.Ui.choose(
            "This map was saved in RPG Maker MZ after the Doodads editor opened it. Saving now would replace MZ's changes with yours.", [
            { label: "Don't Save Yet", value: null },
            { label: "Use MZ's Version (drop my event changes)", value: 'reload' },
            { label: "Save Mine Anyway (replace MZ's changes)", value: 'force', kind: 'danger' }
        ], { title: 'This map was changed in RPG Maker MZ', tone: 'danger', icon: 'help', stack: true });
        if (answer === 'force') {
            DocsDoodads.Persistence.saveAll(true);
        } else if (answer === 'reload') {
            const persistence = DocsDoodads.Persistence;
            for (const entry of persistence.pendingMapEntries()) {
                const file = persistence.mapFilePath(entry.mapId);
                persistence.sessionSnapshots[file] = DocsDoodads.FS.stat(file);
            }
            persistence.stagedMaps = {};
            if (window.$gameMap) { $gameMap._stagedMapData = null; delete $gameMap._stagedMapDataId; }
            persistence.dirtyMap = false;
            persistence.captureSession();
            this.updateSaveState();
            this.showToast("External Map Data Reloaded!");
        }
        return answer;
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'dd-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('info', 1)} Info</div>
            <div style="font-size: 12px; line-height: 1.8; color: var(--dd-text);">
                <div>Total Indexed Assets: <strong style="color: var(--dd-text);">${DocsDoodads.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: var(--dd-text);">${Object.keys(DocsDoodads.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: var(--dd-text);">${DocsDoodads.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: var(--dd-text);">${DocsDoodads.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: var(--dd-text);">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="dd-btn dd-btn-primary" id="dd-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="dd-btn" id="dd-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="dd-btn" id="dd-close-diag-btn">Close</button>
            </div>
            <button class="dd-btn" id="dd-restore-backup-btn" style="width: 100%; margin-top: 8px; border-color: var(--dd-warn); color: var(--dd-warn);">Restore Project Backup…</button>
        `;
        document.body.appendChild(diag);

        document.getElementById('dd-rebuild-idx-btn').onclick = async () => {
            DocsDoodads.AssetIndex.data.assets = {};
            await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-clear-cache-btn').onclick = () => {
            DocsDoodads.Thumbnail.clearCache();
            this.refreshDrawerCards();
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-restore-backup-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
            this.showBackupRestoreModal();
        };

        document.getElementById('dd-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showBackupRestoreModal() {
        const mapFile = `data/Map${String($gameMap ? $gameMap.mapId() : 0).padStart(3, '0')}.json`;
        const targets = [
            { label: 'Current Map', path: mapFile },
            { label: 'Doodads', path: 'data/' + dataFileName },
            { label: 'Asset Library', path: DocsDoodads.AssetIndex.libraryPath }
        ];
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 480px; padding: 20px; z-index: 10035; border: 1px solid var(--dd-warn);
        `;
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('folder', 1)} Bring Back a Backup</div>
            <div style="font-size: 11px; line-height: 1.5; color: var(--dd-text); margin-bottom: 14px;">
                Backups are validated before restore. The current file is backed up again first so this action remains reversible.
            </div>
            <label style="font-size: 11px; color: var(--dd-muted);">Project file</label>
            <select id="dd-restore-target" style="width: 100%; margin: 5px 0 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                ${targets.map(target => `<option value="${target.path}">${target.label} — ${target.path}</option>`).join('')}
            </select>
            <label style="font-size: 11px; color: var(--dd-muted);">Backup snapshot</label>
            <select id="dd-restore-source" style="width: 100%; margin: 5px 0 16px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;"></select>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-restore-cancel">Cancel</button>
                <button class="dd-btn" id="dd-restore-confirm" style="background: var(--dd-warn-soft);">Restore Selected Backup</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetSelect = document.getElementById('dd-restore-target');
        const backupSelect = document.getElementById('dd-restore-source');
        const restoreButton = document.getElementById('dd-restore-confirm');
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        const refreshBackups = () => {
            const backups = DocsDoodads.FS.listBackups(targetSelect.value);
            backupSelect.innerHTML = '';
            for (const backup of backups) {
                const option = document.createElement('option');
                option.value = backup.path;
                option.textContent = `${new Date(backup.mtimeMs).toLocaleString()} — ${Math.ceil(backup.size / 1024)} KB`;
                backupSelect.appendChild(option);
            }
            restoreButton.disabled = backups.length === 0;
            if (backups.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'No backups available for this file';
                backupSelect.appendChild(option);
            }
        };
        targetSelect.onchange = refreshBackups;
        document.getElementById('dd-restore-cancel').onclick = close;
        restoreButton.onclick = async () => {
            if (!backupSelect.value) return;
            const targetPath = targetSelect.value;
            const backupPath = backupSelect.value;
            if (!(await DocsDoodads.Ui.confirm(`${targetPath} will be replaced by the backup you picked. The file as it is now is backed up first, so this can be undone the same way.`,
                { title: 'Restore this backup?', ok: 'Restore', danger: true }))) return;
            if (!modal.parentNode) return;
            const result = DocsDoodads.FS.restoreBackup(targetPath, backupPath);
            if (!result.ok) {
                this.showToast(`Restore failed: ${result.error}`);
                return;
            }

            if (targetPath === DocsDoodads.AssetIndex.libraryPath) {
                DocsDoodads.AssetIndex.init();
                this.refreshDrawerCards();
            } else if (targetPath === 'data/' + dataFileName) {
                window.$dataDocsDoodads = DocsDoodads.FS.readJson(targetPath) || {};
                DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
                this.refreshSpriteset();
            } else if (targetPath === mapFile && window.$gameMap) {
                $gameMap._stagedMapData = DocsDoodads.FS.readJson(targetPath);
                $gameMap._stagedMapDataId = $gameMap.mapId();
                DocsDoodads.Persistence.captureSession();
            }
            close();
            this.showToast('Backup restored. Reload the current map before continuing edits.');
        };
        refreshBackups();
    },

    showRecoveryNotices() {
        const notices = DocsDoodads.FS.takeRecoveryNotices();
        if (notices.length > 0) this.showToast(notices.join(' '), 9000);
    },

    // kind: a duration in ms, or 'info' / 'success' / 'error' (colour, and errors stay longer).
    // opts.action: { label, run } adds a button (Undo, for one) and keeps the message up longer.
    // Every message is kept in the Messages list (More), so a missed one can be read again.
    toastLog: [],

    showToast(msg, kind, opts = {}) {
        const styles = { info: ['info', 2200], success: ['done', 2200], error: ['close', 5000] };
        const [icon, wait] = typeof kind === 'number' ? ['info', kind] : (styles[kind] || styles.info);
        const action = opts && opts.action && typeof opts.action.run === 'function' ? opts.action : null;
        const duration = Math.max(action ? 8000 : 800, Number(wait) || 2200);
        this.toastLog = [{ msg: String(msg), kind: typeof kind === 'string' ? kind : 'info', at: Date.now() }].concat(this.toastLog || []).slice(0, 60);
        if (this._toastHistoryOpen) this.renderToastHistory();
        // One at a time: a new message replaces the last.
        const old = document.getElementById('dd-toast');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const toast = document.createElement('div');
        toast.id = 'dd-toast';
        toast.className = 'dd-toast' + (kind === 'success' ? ' dd-toast-success' : kind === 'error' ? ' dd-toast-error' : '');
        toast.innerHTML = `${DocsDoodads.Ui.icon(icon, 1)}<span></span>`;
        const text = toast.querySelector ? toast.querySelector('span') : null;
        if (text) text.textContent = msg; else toast.textContent = msg;
        if (kind === 'error') DocsDoodads.Ui.sound('buzzer');
        if (action) {
            toast.style.pointerEvents = 'auto';
            const btn = document.createElement('button');
            btn.className = 'dd-btn';
            btn.type = 'button';
            btn.textContent = action.label || 'Undo';
            btn.onclick = () => { if (toast.parentNode) toast.parentNode.removeChild(toast); action.run(); };
            toast.appendChild(btn);
            toast._ddAction = btn;
            // While the mouse is on it, it stays.
            toast.onmouseenter = () => { toast._ddHover = true; };
            toast.onmouseleave = () => { toast._ddHover = false; if (toast._ddExpired) fade(); };
        }
        document.body.appendChild(toast);
        const fade = () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        };
        setTimeout(() => {
            toast._ddExpired = true;
            if (!toast._ddHover) fade();
        }, duration);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-undo-btn');
        const rBtn = document.getElementById('dd-redo-btn');
        if (uBtn) uBtn.style.opacity = DocsDoodads.Undo.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = DocsDoodads.Undo.redoStack.length > 0 ? '1' : '0.5';
        if (this._undoHistoryOpen) this.renderUndoHistory();
    }
};

