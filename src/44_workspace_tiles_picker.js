// @editor-only
//==========================================================
// SECTION 25v2: PICKING TILES FROM ANY TILESET SHEET
//==========================================================
// A tileset sheet in the Item Bag that this map's tileset doesn't use opens here: the sheet on a grid, a click
// picks one tile and a drag a block of them, and Stamp then places that piece as a doodad (the sheet cropped
// with frameX/frameY/frameW/frameH, the way a doodad shows part of a picture). Sheets the map's tileset does use
// open the Tiles tool instead (44_workspace_tiles.js), which paints MZ's own tiles.
(function() {
    const D = DocsDoodads, W = D.Workspace;
    const sizes = [16, 24, 32, 48];

    Object.assign(W, {
        tilePickSize: 0, // 0: the map's tile size

        tilePickCell() {
            const map = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            return Math.max(1, Math.floor(Number(this.tilePickSize) || map));
        },

        // A copy of the sheet's entry that places only the picked cells: rect in cells, cell in pixels.
        tilePickAsset(asset, rect, cell) {
            const r = { x: Math.max(0, Math.floor(rect.x)), y: Math.max(0, Math.floor(rect.y)), w: Math.max(1, Math.floor(rect.w)), h: Math.max(1, Math.floor(rect.h)) };
            return Object.assign({}, asset, { frameX: r.x * cell, frameY: r.y * cell, frameW: r.w * cell, frameH: r.h * cell,
                tilePick: Object.assign({ cell }, r) });
        },

        // The cells between two picked cells, kept inside the sheet.
        tilePickRect(a, b, cols, rows) {
            const clamp = (v, n) => Math.max(0, Math.min(n - 1, v));
            const x0 = clamp(Math.min(a.x, b.x), cols), y0 = clamp(Math.min(a.y, b.y), rows);
            const x1 = clamp(Math.max(a.x, b.x), cols), y1 = clamp(Math.max(a.y, b.y), rows);
            return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
        },

        closeTilePicker() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-tile-picker') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            this._tilePicker = null;
        },

        openTilePicker(asset) {
            if (typeof document === 'undefined' || !document.createElement || !asset) return null;
            const state = this._tilePicker = { asset, rect: null };
            let card = document.getElementById('dd-tile-picker');
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-tile-picker'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;top:88px;left:50%;transform:translateX(-50%);width:min(440px,calc(100vw - 32px));max-height:calc(100vh - 110px);overflow:auto;padding:12px;z-index:10040;font-size:11px;display:flex;flex-direction:column;gap:6px;';
                document.body.appendChild(card);
            }
            const name = String(asset.fileName || asset.path || '').replace(/\.(png|webp)$/i, '');
            const map = this.tilePickCell();
            const options = [0].concat(sizes.filter(s => s !== map)).map(s => `<option value="${s}"${(Number(this.tilePickSize) || 0) === s ? ' selected' : ''}>${s ? s + ' px' : map + ' px (this map)'}</option>`).join('');
            card.innerHTML = `<div class="dd-panel-head" data-dd-help="tiles-painting-mz-tiles"><span class="dd-grow">Pick Tiles: ${escapeHtml(name)}</span><button class="dd-btn" type="button" id="dd-tile-picker-close">Close</button></div>
                <div style="color:var(--dd-muted);line-height:1.4;">This sheet isn't in this map's tileset, so its tiles are placed as doodads. Click a tile, or drag across several, then click the map (Stamp).</div>
                <label style="display:flex;gap:6px;align-items:center;">Tile size <select id="dd-tile-picker-size">${options}</select></label>
                <div style="overflow:auto;max-height:60vh;background:var(--dd-field);border-radius:6px;"><canvas id="dd-tile-picker-canvas" width="8" height="8" style="display:block;image-rendering:pixelated;cursor:crosshair;"></canvas></div>
                <div id="dd-tile-picker-info" style="color:var(--dd-faint);">Nothing picked yet.</div>`;
            const node = id => document.getElementById(id);
            if (!node('dd-tile-picker-close')) return card;
            node('dd-tile-picker-close').onclick = () => this.closeTilePicker();
            node('dd-tile-picker-size').onchange = event => { this.tilePickSize = Number(event.target.value) || 0; this.openTilePicker(asset); };
            const canvas = node('dd-tile-picker-canvas'), image = new Image();
            const draw = () => {
                const ctx = canvas.getContext && canvas.getContext('2d');
                if (!ctx || !image.width) return;
                const cell = this.tilePickCell(), k = Math.min(2, Math.max(0.25, 400 / image.width));
                canvas.width = Math.round(image.width * k); canvas.height = Math.round(image.height * k);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
                for (let x = cell; x < image.width; x += cell) { ctx.beginPath(); ctx.moveTo(Math.round(x * k) + 0.5, 0); ctx.lineTo(Math.round(x * k) + 0.5, canvas.height); ctx.stroke(); }
                for (let y = cell; y < image.height; y += cell) { ctx.beginPath(); ctx.moveTo(0, Math.round(y * k) + 0.5); ctx.lineTo(canvas.width, Math.round(y * k) + 0.5); ctx.stroke(); }
                if (state.rect) {
                    // A dark edge under a bright one, so the box shows on light and dark sheets alike.
                    const box = [state.rect.x * cell * k + 1, state.rect.y * cell * k + 1, state.rect.w * cell * k - 2, state.rect.h * cell * k - 2];
                    ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 4; ctx.strokeRect(...box);
                    ctx.strokeStyle = '#2f9bff'; ctx.lineWidth = 2; ctx.strokeRect(...box);
                }
                state.k = k;
            };
            const cellAt = event => {
                const r = canvas.getBoundingClientRect(), s = this.uiScaleNow ? this.uiScaleNow() : 1, cell = this.tilePickCell();
                return { x: Math.floor(((event.clientX - r.left) / s) / (state.k || 1) / cell), y: Math.floor(((event.clientY - r.top) / s) / (state.k || 1) / cell) };
            };
            const grid = () => ({ cols: Math.max(1, Math.floor(image.width / this.tilePickCell())), rows: Math.max(1, Math.floor(image.height / this.tilePickCell())) });
            const pick = rect => {
                const cell = this.tilePickCell();
                state.rect = rect;
                draw();
                const picked = this.tilePickAsset(asset, rect, cell);
                this.selectAsset(picked);
                if (this.placementTool !== 'stamp') this.setPlacementTool('stamp');
                const info = node('dd-tile-picker-info');
                if (info) info.textContent = `Picked ${rect.w} × ${rect.h} tile(s) at ${rect.x}, ${rect.y}. Click the map to place it.`;
            };
            canvas.onmousedown = event => {
                if (!image.width) return;
                const start = cellAt(event), g = grid();
                pick(this.tilePickRect(start, start, g.cols, g.rows));
                const move = ev => pick(this.tilePickRect(start, cellAt(ev), g.cols, g.rows));
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            };
            image.onload = draw;
            image.onerror = () => { const info = node('dd-tile-picker-info'); if (info) info.textContent = 'This picture could not be read.'; };
            image.src = asset.path;
            return card;
        }
    });

    // Picking something else in the bag, or leaving the editor, closes the picker.
    const select = W.selectAsset;
    W.selectAsset = function(asset) {
        if (this._tilePicker && !(asset && asset.tilePick && asset.path === this._tilePicker.asset.path)) this.closeTilePicker();
        return select.apply(this, arguments);
    };
})();
