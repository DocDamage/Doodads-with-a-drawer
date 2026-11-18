// @editor-only
//==========================================================
// SECTION 25Z: FINE-CELL COLLISION WALL BRUSH
//==========================================================
DocsDoodads.Ui.hints.walls = 'Collision: left-drag blocks, right-drag erases, Shift joins from the last point; [ and ] change size.';

Object.assign(DocsDoodads.Workspace, {
    wallBrush: { radius: 0, shape: 'round', mode: 'paint' },

    wallGrid(create) {
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (!map) return null;
        const mapId = this.currentMapId();
        const existing = DocsDoodads.Walls.get(mapId);
        if (existing || !create) return existing;
        const cell = DocsDoodads.Walls.defaultCell;
        return DocsDoodads.Walls.blank(Math.ceil(map.width() * map.tileWidth() / cell), Math.ceil(map.height() * map.tileHeight() / cell), cell, {
            loopX: Boolean(map.isLoopHorizontal && map.isLoopHorizontal()),
            loopY: Boolean(map.isLoopVertical && map.isLoopVertical())
        });
    },

    setWallSnapshot(mapId, saved) {
        DocsDoodads.Walls.set(mapId, saved ? DocsDoodads.Walls.decode(JSON.parse(JSON.stringify(saved)), DocsDoodads.Walls.loopOptions(mapId)) : null);
        DocsDoodads.Persistence.dirtyDoodads = true;
        DocsDoodads.Collision.invalidate();
        this.updateWallCount();
    },

    wallCellFromEvent(e, grid) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        return DocsDoodads.Walls.cellCoords(grid, Math.floor(at.x / grid.cell), Math.floor(at.y / grid.cell));
    },

    beginWallStroke(e) {
        const grid = this.wallGrid(true);
        if (!grid) return false;
        const mapId = this.currentMapId();
        const raw = window.$dataDocsDoodads && window.$dataDocsDoodads.walls && window.$dataDocsDoodads.walls[mapId];
        const at = this.wallCellFromEvent(e, grid);
        if (!at) return false;
        this._wallStroke = {
            mapId,
            grid,
            before: raw ? JSON.parse(JSON.stringify(raw)) : null,
            erase: e.button === 2,
            last: e.shiftKey && this._wallLastMapId === mapId && this._wallLastPoint ? this._wallLastPoint : at,
            changed: false,
            filled: false
        };
        this.paintWallsAt(e);
        return true;
    },

    paintWallsAt(e) {
        const stroke = this._wallStroke;
        if (!stroke) return 0;
        const W = DocsDoodads.Walls, at = this.wallCellFromEvent(e, stroke.grid);
        if (!at) return 0;
        let changed = 0;
        if (this.wallBrush.mode === 'fill') {
            if (stroke.filled) return 0;
            stroke.filled = true;
            changed = W.fill(stroke.grid, at.x, at.y, !stroke.erase);
        } else {
            const points = W.line(stroke.grid, stroke.last || at, at);
            for (const point of points) {
                for (const cell of W.brushCells(stroke.grid, point.x, point.y, this.wallBrush.radius, this.wallBrush.shape)) {
                    if (W.setCell(stroke.grid, cell.x, cell.y, !stroke.erase)) changed++;
                }
            }
        }
        stroke.last = at;
        this._wallLastPoint = at;
        this._wallLastMapId = stroke.mapId;
        if (changed) {
            stroke.changed = true;
            W.set(stroke.mapId, stroke.grid);
            DocsDoodads.Persistence.dirtyDoodads = true;
            DocsDoodads.Collision.invalidate();
            this.updateWallCount();
        }
        return changed;
    },

    endWallStroke() {
        const stroke = this._wallStroke;
        this._wallStroke = null;
        if (!stroke || !stroke.changed) return false;
        const raw = window.$dataDocsDoodads && window.$dataDocsDoodads.walls && window.$dataDocsDoodads.walls[stroke.mapId];
        const after = raw ? JSON.parse(JSON.stringify(raw)) : null;
        if (JSON.stringify(stroke.before) === JSON.stringify(after)) return false;
        DocsDoodads.Undo.execute({
            type: 'wall_paint',
            label: 'Collision brush stroke',
            apply: () => this.setWallSnapshot(stroke.mapId, after),
            revert: () => this.setWallSnapshot(stroke.mapId, stroke.before)
        });
        return true;
    },

    updateWallCount() {
        const label = typeof document !== 'undefined' ? document.getElementById('dd-walls-count') : null;
        if (!label) return;
        const grid = this.wallGrid(false);
        let count = 0;
        if (grid) for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.cells[y][x]) count++;
        label.textContent = count ? `${count} blocked cell${count === 1 ? '' : 's'}` : 'No painted collision on this map';
    },

    wallPictureLayers() {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        return DocsDoodads.MapLayers.list(settings).filter(layer => layer.image && layer.image !== '#fog');
    },

    renderWallPictureLayers() {
        const select = typeof document !== 'undefined' ? document.getElementById('dd-walls-picture') : null;
        if (!select) return;
        const layers = this.wallPictureLayers();
        select.innerHTML = layers.length
            ? layers.map((layer, index) => `<option value="${index}">${escapeHtml(layer.image)}</option>`).join('')
            : '<option value="">No picture layers on this map</option>';
        select.disabled = layers.length === 0;
        const button = document.getElementById('dd-walls-from-picture');
        if (button) button.disabled = layers.length === 0;
    },

    async wallsFromPicture(layer, threshold, loader) {
        if (!layer || !layer.image || layer.image === '#fog') return false;
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (!map) return false;
        const mapId = this.currentMapId();
        const mapWidth = map.width() * map.tileWidth(), mapHeight = map.height() * map.tileHeight();
        const loopX = Boolean(map.isLoopHorizontal && map.isLoopHorizontal());
        const loopY = Boolean(map.isLoopVertical && map.isLoopVertical());
        const path = `img/parallaxes/${layer.image}.png`;
        let pixels;
        try {
            pixels = await (loader || (p => this.loadPixels(p)))(path);
        } catch (error) {
            this.showToast(`Could not read picture collision: ${error.message || error}`, 'error');
            return false;
        }
        // Image decoding is asynchronous. Never apply the result to a map opened while it was loading.
        if (!this.mounted || this.currentMapId() !== mapId || typeof $gameMap === 'undefined' || !$gameMap || Number($gameMap.mapId()) !== Number(mapId)) return false;
        const old = window.$dataDocsDoodads && window.$dataDocsDoodads.walls && window.$dataDocsDoodads.walls[mapId];
        const before = old ? JSON.parse(JSON.stringify(old)) : null;
        const grid = DocsDoodads.Walls.fromAlpha(pixels.data, pixels.width, pixels.height, {
            cell: DocsDoodads.Walls.defaultCell,
            mapWidth,
            mapHeight,
            threshold,
            zoom: layer.zoom,
            imageLoopX: layer.loopX,
            imageLoopY: layer.loopY,
            loopX,
            loopY
        });
        const after = DocsDoodads.Walls.isEmpty(grid) ? null : DocsDoodads.Walls.encode(grid);
        if (JSON.stringify(before) === JSON.stringify(after)) {
            this.showToast('The picture already matches the painted collision.', 'info');
            return false;
        }
        DocsDoodads.Undo.execute({
            type: 'wall_picture',
            label: 'Collision from picture',
            apply: () => this.setWallSnapshot(mapId, after),
            revert: () => this.setWallSnapshot(mapId, before)
        });
        this.showToast(after ? `Painted collision from ${layer.image}.` : `No pixels in ${layer.image} reached that alpha threshold.`, after ? 'success' : 'info');
        return true;
    },

    bindWallsTool() {
        const byId = id => document.getElementById(id);
        const button = byId('dd-walls-btn');
        if (button) button.onclick = () => this.setPlacementTool(this.placementTool === 'walls' ? null : 'walls');
        const size = byId('dd-walls-size');
        if (size) size.oninput = e => {
            this.wallBrush.radius = Math.max(0, Math.min(16, Math.round(Number(e.target.value) || 0)));
            const value = byId('dd-walls-size-value');
            if (value) value.textContent = String(this.wallBrush.radius * 2 + 1);
        };
        const shape = byId('dd-walls-shape');
        if (shape) shape.onchange = e => { this.wallBrush.shape = e.target.value === 'square' ? 'square' : 'round'; };
        const mode = byId('dd-walls-mode');
        if (mode) mode.onchange = e => { this.wallBrush.mode = e.target.value === 'fill' ? 'fill' : 'paint'; };
        const fromPicture = byId('dd-walls-from-picture');
        if (fromPicture) fromPicture.onclick = async () => {
            const layers = this.wallPictureLayers();
            const select = byId('dd-walls-picture');
            const layer = layers[Math.max(0, Number(select && select.value) || 0)];
            const alpha = byId('dd-walls-alpha');
            await this.wallsFromPicture(layer, Math.max(0, Math.min(255, Number(alpha && alpha.value) || 48)));
        };
        this.renderWallPictureLayers();
        this.updateWallCount();
    },

    // In 3D the painted cells lie on the ground, each a quad through the camera (at most 6000 near the view).
    drawWalls3d(g, cam) {
        if (!g || !cam || (this.placementTool !== 'walls' && !this.showCollision)) return;
        const grid = this._wallStroke ? this._wallStroke.grid : this.wallGrid(false);
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (!grid || !map) return;
        const P = DocsDoodads.Perspective, T = DocsDoodads.Terrain, c = grid.cell;
        const displayX = map.displayX() * map.tileWidth(), displayY = map.displayY() * map.tileHeight();
        const reach = Math.max(Graphics.width, Graphics.height) * 2;
        const x0 = Math.floor((displayX - reach) / c), x1 = Math.ceil((displayX + Graphics.width + reach) / c);
        const y0 = Math.floor((displayY - reach) / c), y1 = Math.ceil((displayY + Graphics.height + reach) / c);
        const point = (fx, fy) => {
            const p = P.groundPoint(cam, fx, fy, T.heightPxAtFlat ? T.heightPxAtFlat(fx, fy) : 0);
            return p.visible ? P.project(cam, p.x, p.y, p.z) : null;
        };
        g.lineStyle(0);
        let drawn = 0;
        for (let viewY = y0; viewY <= y1 && drawn < 6000; viewY++) {
            for (let viewX = x0; viewX <= x1 && drawn < 6000; viewX++) {
                const cell = DocsDoodads.Walls.cellCoords(grid, viewX, viewY);
                if (!cell || !grid.cells[cell.y][cell.x]) continue;
                const fx = viewX * c - displayX, fy = viewY * c - displayY;
                const q = [point(fx, fy), point(fx + c, fy), point(fx + c, fy + c), point(fx, fy + c)];
                if (q.some(p => !p)) continue;
                g.beginFill(DocsDoodads.Ui.mapColor('blocked'), this.placementTool === 'walls' ? 0.42 : 0.28);
                g.drawPolygon([q[0].x, q[0].y, q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y]);
                g.endFill();
                drawn++;
            }
        }
    },

    drawWallsOverlay(g) {
        if (!g || (this.placementTool !== 'walls' && !this.showCollision)) return;
        if (DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera()) return;
        const grid = this._wallStroke ? this._wallStroke.grid : this.wallGrid(false);
        if (!grid) return;
        const color = DocsDoodads.Ui.mapColor('blocked');
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (!map) return;
        const displayX = map.displayX() * map.tileWidth(), displayY = map.displayY() * map.tileHeight();
        const x0 = Math.floor(displayX / grid.cell) - 1, x1 = Math.ceil((displayX + Graphics.width) / grid.cell) + 1;
        const y0 = Math.floor(displayY / grid.cell) - 1, y1 = Math.ceil((displayY + Graphics.height) / grid.cell) + 1;
        for (let viewY = y0; viewY <= y1; viewY++) {
            for (let viewX = x0; viewX <= x1; viewX++) {
                const cell = DocsDoodads.Walls.cellCoords(grid, viewX, viewY);
                if (!cell || !grid.cells[cell.y][cell.x]) continue;
                const at = { x: viewX * grid.cell + grid.cell / 2 - displayX, y: viewY * grid.cell + grid.cell / 2 - displayY };
                g.beginFill(color, this.placementTool === 'walls' ? 0.42 : 0.28);
                g.drawRect(at.x - grid.cell / 2, at.y - grid.cell / 2, grid.cell, grid.cell);
                g.endFill();
            }
        }
        if (this.placementTool === 'walls' && this._wallHover) {
            const at = DocsDoodads.mapToScreen(this._wallHover.x * grid.cell + grid.cell / 2, this._wallHover.y * grid.cell + grid.cell / 2);
            const radius = this.wallBrush.radius * grid.cell + grid.cell / 2;
            g.lineStyle(2, DocsDoodads.Ui.mapColor(this._wallStroke && this._wallStroke.erase ? 'brushErase' : 'brushPaint'), 0.95);
            if (this.wallBrush.shape === 'square') g.drawRect(at.x - radius, at.y - radius, radius * 2, radius * 2);
            else g.drawCircle(at.x, at.y, radius);
            g.lineStyle(0);
        }
    }
});

DocsDoodads.Workspace.toolButtons.walls = 'dd-walls-btn';
DocsDoodads.Workspace.toolPopovers.walls = 'dd-walls-popover';
DocsDoodads.Workspace.brushSizeSteps.walls = ['dd-walls-size', 1, 0, 16];
DocsDoodads.Workspace.toolHooks.walls = {
    buttons: [0, 2],
    down(e) { return this.beginWallStroke(e); },
    move(e, stroking) {
        const grid = this._wallStroke ? this._wallStroke.grid : this.wallGrid(false) || this.wallGrid(true);
        this._wallHover = grid ? this.wallCellFromEvent(e, grid) : null;
        if (stroking) this.paintWallsAt(e);
    },
    up() { this.endWallStroke(); },
    overlay(g) { this.drawWallsOverlay(g); }
};

// Region binding already runs during workspace setup; add the later wall controls at the same point.
const bindRegionsBeforeWalls = DocsDoodads.Workspace.bindRegionTool;
DocsDoodads.Workspace.bindRegionTool = function() {
    bindRegionsBeforeWalls.call(this);
    this.bindWallsTool();
};

// Ctrl+K finds every toolbar tool, including this one added after the map-panel part.
const paletteBeforeWalls = DocsDoodads.Workspace.paletteCommands;
DocsDoodads.Workspace.paletteCommands = function() {
    const commands = paletteBeforeWalls.call(this);
    commands.push({ label: 'Tool: Collision (paint blocked cells)', run: () => this.setPlacementTool('walls'), group: 'Map' });
    return commands;
};
