// @editor-only
// The trace belongs to the editor overlay, below its grid. It is never part of a capture.
DocsDoodads.Ui.hints.trace = 'Trace: drag the picture to move it, its corner to scale, or the round handle to turn. Lock it to paint through it.';
DocsDoodads.Ui.hints.traceFit = 'Two-point fit: click two places on the picture, then the two tiles they should match. Esc cancels.';
Object.assign(DocsDoodads.Workspace, {
    traceHere() {
        const all = window.$dataDocsDoodads && window.$dataDocsDoodads.trace;
        const mapId = this.currentMapId(), raw = all && all[mapId], revision = DocsDoodads.Trace.revision || 0;
        const cached = this._traceNormalized;
        if (cached && cached.mapId === mapId && cached.raw === raw && cached.revision === revision) return cached.value;
        const value = DocsDoodads.Trace.normalize(raw);
        this._traceNormalized = { mapId, raw, revision, value };
        return value;
    },
    traceLoop() {
        const map = window.$gameMap;
        return { w: map && map.isLoopHorizontal() ? map.width() * map.tileWidth() : 0,
            h: map && map.isLoopVertical() ? map.height() * map.tileHeight() : 0 };
    },
    applyTrace(mapId, trace) {
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (trace) {
            data.trace = data.trace || {};
            data.trace[mapId] = JSON.parse(JSON.stringify(trace));
        } else if (data.trace) {
            delete data.trace[mapId];
            if (!Object.keys(data.trace).length) delete data.trace;
        }
        DocsDoodads.Persistence.dirtyDoodads = true;
        DocsDoodads.Trace.revision = (DocsDoodads.Trace.revision || 0) + 1;
    },
    changeTrace(trace, label) {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !this.mounted) return null;
        const mapId = this.currentMapId(), all = window.$dataDocsDoodads && window.$dataDocsDoodads.trace;
        const before = all && all[mapId] ? JSON.parse(JSON.stringify(all[mapId])) : null;
        const next = trace ? DocsDoodads.Trace.normalize(trace) : null;
        if (trace && !next) throw new Error('That tracing picture is not in the editor cache.');
        if (JSON.stringify(before) === JSON.stringify(next)) return next;
        DocsDoodads.Undo.execute({ type: 'trace_picture', label: label || 'Fit tracing picture',
            apply: () => this.applyTrace(mapId, next), revert: () => this.applyTrace(mapId, before) });
        return next;
    },
    traceImageSize(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
            image.onerror = () => reject(new Error('That tracing picture could not be read.'));
            image.src = url;
        });
    },
    async importTrace(file, loader) {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !this.mounted) throw new Error('Trace pictures can be imported only in an editor playtest.');
        const F = DocsDoodads.FS, mapId = this.currentMapId(), map = window.$gameMap;
        if (!F.fs || !F.path || !map) throw new Error('Trace pictures need the desktop playtest.');
        const extension = F.path.extname(String(file)).toLowerCase().slice(1);
        if (!['png', 'jpg', 'jpeg', 'webp'].includes(extension)) throw new Error('Choose a PNG, JPEG or WebP picture.');
        const absolute = F.path.resolve(file), stat = F.fs.statSync(absolute);
        if (!stat.isFile() || stat.size > 32 * 1024 * 1024) throw new Error('Choose a picture smaller than 32 MB.');
        const bytes = F.fs.readFileSync(absolute);
        const url = require('url').pathToFileURL(absolute).href;
        const size = await (loader || (p => this.traceImageSize(p)))(url);
        if (!size || !Number.isInteger(size.width) || !Number.isInteger(size.height) || size.width < 1 || size.height < 1 || size.width > 4096 || size.height > 4096) {
            throw new Error('The tracing picture must be at most 4096 pixels on either side.');
        }
        if (!this.mounted || this.currentMapId() !== mapId) return null;
        const name = require('crypto').createHash('sha256').update(bytes).digest('hex') + '.' + extension;
        const folder = 'data/docs_doodads_cache/trace', target = folder + '/' + name;
        F.mkdirp(folder);
        if (!F.existsSync(target)) F.atomicWriteFile(target, bytes);
        const fit = DocsDoodads.Trace.fitMap(size.width, size.height, map.width() * map.tileWidth(), map.height() * map.tileHeight());
        return this.changeTrace(Object.assign({ file: target, width: size.width, height: size.height, alpha: 0.4, show: true, locked: true }, fit), 'Import tracing picture');
    },
    pickTracePicture() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !this.mounted) return false;
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.png,.jpg,.jpeg,.webp';
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file || !file.path) return;
            this.importTrace(file.path).then(trace => { if (trace) this.showTraceCard(); }).catch(error => this.showToast(error.message, 'error'));
        };
        input.click();
    },
    toggleTrace() {
        const trace = this.traceHere();
        if (!trace) { this.showTraceCard(); return false; }
        this.changeTrace(Object.assign({}, trace, { show: !trace.show }), 'Show or hide tracing picture');
        if (!trace.show) this.showToast('Tracing picture shown.', 'info');
        return !trace.show;
    },
    setTraceLocked(locked) {
        const trace = this.traceHere();
        if (!trace) return false;
        this.changeTrace(Object.assign({}, trace, { locked: Boolean(locked), show: true }), 'Lock or unlock tracing picture');
        this.setPlacementTool(locked ? null : 'trace');
        return true;
    },
    fitTraceToMap() {
        const trace = this.traceHere(), map = window.$gameMap;
        if (!trace || !map) return false;
        this.changeTrace(Object.assign({}, trace, DocsDoodads.Trace.fitMap(trace.width, trace.height, map.width() * map.tileWidth(), map.height() * map.tileHeight())), 'Fit tracing picture to map');
        this.showTraceCard();
        return true;
    },
    beginTraceFit() {
        const trace = this.traceHere();
        if (!trace || !trace.show) return false;
        this._traceFit = { mapId: this.currentMapId(), trace, source: [], target: [] };
        this.setPlacementTool('traceFit');
        this.showToast('Click the first point on the picture, then the second.', 'info');
        return true;
    },
    traceFitClick(at) {
        const fit = this._traceFit, T = DocsDoodads.Trace;
        if (!fit) return false;
        if (fit.mapId !== this.currentMapId()) { this.setPlacementTool(null); return false; }
        if (fit.source.length < 2) {
            const centre = T.point(fit.trace, { x: fit.trace.width / 2, y: fit.trace.height / 2 });
            const point = T.inverse(fit.trace, T.unwrap(at, centre, this.traceLoop()));
            if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
            if (point.x < -0.00001 || point.y < -0.00001 || point.x > fit.trace.width + 0.00001 || point.y > fit.trace.height + 0.00001) { this.showToast('Pick a point inside the picture.', 'info'); return false; }
            point.x = Math.max(0, Math.min(fit.trace.width, point.x)); point.y = Math.max(0, Math.min(fit.trace.height, point.y));
            fit.source.push(point);
            if (fit.source.length === 2) this.showToast('Now click the first target tile, then the second.', 'info');
        } else {
            const map = window.$gameMap;
            let x = Number(at.tileX), y = Number(at.tileY);
            if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
            if (map.isLoopHorizontal()) x = map.roundX(x);
            if (map.isLoopVertical()) y = map.roundY(y);
            if (!map.isValid(x, y)) { this.showToast('Choose a tile inside the map.', 'info'); return false; }
            const target = { x: (x + 0.5) * map.tileWidth(), y: (y + 0.5) * map.tileHeight() };
            fit.target.push(fit.target.length ? T.unwrap(target, fit.target[0], this.traceLoop()) : target);
            if (fit.target.length === 2) {
                const transform = T.fitTwo(fit.source[0], fit.source[1], fit.target[0], fit.target[1]);
                if (transform) this.changeTrace(Object.assign({}, fit.trace, transform, { locked: true }), 'Fit tracing picture to two tiles');
                else this.showToast('Choose two different points and two different tiles.', 'info');
                this.setPlacementTool(null);
                this.showTraceCard();
            }
        }
        return true;
    },
    beginTraceDrag(event) {
        const trace = this.traceHere(), T = DocsDoodads.Trace;
        if (!trace || trace.locked || !trace.show) return false;
        if (DocsDoodads.Perspective.liveCamera()) return false;
        const raw = this.clientToMapCoords(event.clientX, event.clientY), handles = T.handles(trace), loop = this.traceLoop();
        const near = point => { const unwrapped = T.unwrap(raw, point, loop); return Math.hypot(unwrapped.x - point.x, unwrapped.y - point.y) <= 12; };
        const mode = near(handles.scale) ? 'scale' : near(handles.rotate) ? 'rotate' : 'move';
        const reference = mode === 'scale' ? handles.scale : mode === 'rotate' ? handles.rotate : T.point(trace, { x: trace.width / 2, y: trace.height / 2 });
        const at = T.unwrap(raw, reference, loop);
        const local = T.inverse(trace, at);
        if (mode === 'move' && (local.x < 0 || local.y < 0 || local.x > trace.width || local.y > trace.height)) return false;
        this._traceDrag = { mapId: this.currentMapId(), before: trace, at, last: at, loop, mode };
        return true;
    },
    moveTraceDrag(event) {
        const drag = this._traceDrag;
        if (!drag || drag.mapId !== this.currentMapId()) return;
        const raw = this.clientToMapCoords(event.clientX, event.clientY), before = drag.before;
        const at = DocsDoodads.Trace.unwrap(raw, drag.last, drag.loop); drag.last = at;
        const next = Object.assign({}, before);
        if (drag.mode === 'move') { next.x += at.x - drag.at.x; next.y += at.y - drag.at.y; }
        else if (drag.mode === 'scale') {
            const start = Math.hypot(drag.at.x - before.x, drag.at.y - before.y);
            if (start > 0.001) next.scale *= Math.hypot(at.x - before.x, at.y - before.y) / start;
        } else {
            const centre = DocsDoodads.Trace.point(before, { x: before.width / 2, y: before.height / 2 });
            next.turn += (Math.atan2(at.y - centre.y, at.x - centre.x) - Math.atan2(drag.at.y - centre.y, drag.at.x - centre.x)) * 180 / Math.PI;
            if (event.shiftKey) next.turn = Math.round(next.turn / 15) * 15;
            const shifted = DocsDoodads.Trace.point(next, { x: before.width / 2, y: before.height / 2 });
            next.x += centre.x - shifted.x; next.y += centre.y - shifted.y;
        }
        if (drag.loop.w) next.x = ((next.x % drag.loop.w) + drag.loop.w) % drag.loop.w;
        if (drag.loop.h) next.y = ((next.y % drag.loop.h) + drag.loop.h) % drag.loop.h;
        this.applyTrace(drag.mapId, DocsDoodads.Trace.normalize(next));
    },
    endTraceDrag() {
        const drag = this._traceDrag; this._traceDrag = null;
        if (!drag) return false;
        const all = window.$dataDocsDoodads && window.$dataDocsDoodads.trace;
        const after = all && all[drag.mapId] ? JSON.parse(JSON.stringify(all[drag.mapId])) : null;
        if (JSON.stringify(after) === JSON.stringify(drag.before)) return false;
        DocsDoodads.Undo.execute({ type: 'trace_picture', label: 'Move or fit tracing picture',
            apply: () => this.applyTrace(drag.mapId, after), revert: () => this.applyTrace(drag.mapId, drag.before) });
        return true;
    },
    drawTraceHandles(g) {
        const trace = this.traceHere(), fit = this._traceFit;
        if (!trace || !trace.show || DocsDoodads.Perspective.liveCamera()) return;
        const screen = p => DocsDoodads.mapToScreen(p.x, p.y);
        if (this.placementTool === 'trace' && !trace.locked) {
            const handles = DocsDoodads.Trace.handles(trace), corners = handles.corners.map(screen);
            g.lineStyle(2, DocsDoodads.Ui.mapColor('selection'), 0.9);
            g.moveTo(corners[0].x, corners[0].y);
            for (const point of corners.slice(1).concat([corners[0]])) g.lineTo(point.x, point.y);
            const scale = screen(handles.scale), rotate = screen(handles.rotate);
            g.drawRect(scale.x - 5, scale.y - 5, 10, 10); g.drawCircle(rotate.x, rotate.y, 6);
            g.lineStyle(0);
        }
        if (fit) {
            g.lineStyle(2, DocsDoodads.Ui.mapColor('guideTile'), 1);
            for (const point of fit.source.map(p => DocsDoodads.Trace.point(fit.trace, p)).concat(fit.target)) {
                const at = screen(point); g.drawCircle(at.x, at.y, 6);
            }
            g.lineStyle(0);
        }
    },
    showTraceCard() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !this.mounted || typeof document === 'undefined') return null;
        this.closeTraceCard();
        const trace = this.traceHere(), U = DocsDoodads.Ui;
        const card = document.createElement('div'); card.id = 'dd-trace-card'; card.className = 'dd-glass';
        card.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:10045;width:360px;padding:14px;display:flex;flex-direction:column;gap:8px;max-height:80vh;overflow:auto;';
        card.innerHTML = `<div class="dd-panel-head" data-dd-help="trace-a-picture"><span class="dd-grow">Trace a Picture</span><button class="dd-btn" id="dd-trace-close">Close</button></div>
            <div>Drop a PNG, JPEG or WebP here, or choose one. The picture stays in the editor, under the grid on a flat map.</div>
            <button class="dd-btn" id="dd-trace-choose">Choose a Picture…</button>
            ${trace ? `<label>Opacity <input id="dd-trace-alpha" type="range" min="0" max="1" step="0.05" value="${trace.alpha}" /></label>
            <label>Scale <input id="dd-trace-scale" type="number" min="0.01" max="256" step="0.05" value="${trace.scale}" /></label>
            <label>Turn <input id="dd-trace-turn" type="number" min="-180" max="180" step="1" value="${trace.turn}" /></label>
            <label><input id="dd-trace-show" type="checkbox" ${trace.show ? 'checked' : ''} /> Show picture</label>
            <label><input id="dd-trace-lock" type="checkbox" ${trace.locked ? 'checked' : ''} /> Lock picture; paint through it</label>
            <button class="dd-btn" id="dd-trace-fit">Fit to Map</button><button class="dd-btn" id="dd-trace-two">Two-point Fit</button>
            <button class="dd-btn" id="dd-trace-remove">Remove Trace</button>` : '<div>No tracing picture on this map.</div>'}`;
        document.body.appendChild(card);
        const on = (id, event, fn) => { const el = document.getElementById(id); if (el) el[event] = fn; };
        on('dd-trace-close', 'onclick', () => this.closeTraceCard()); on('dd-trace-choose', 'onclick', () => this.pickTracePicture());
        for (const key of ['alpha', 'scale', 'turn', 'show']) on('dd-trace-' + key, 'onchange', event => {
            const current = this.traceHere(); if (current) this.changeTrace(Object.assign({}, current, { [key]: key === 'show' ? event.target.checked : Number(event.target.value) }));
        });
        on('dd-trace-lock', 'onchange', event => this.setTraceLocked(event.target.checked));
        on('dd-trace-fit', 'onclick', () => this.fitTraceToMap()); on('dd-trace-two', 'onclick', () => this.beginTraceFit());
        on('dd-trace-remove', 'onclick', () => { this.changeTrace(null, 'Remove tracing picture'); this.setPlacementTool(null); this.showTraceCard(); });
        card.ondragover = event => { event.preventDefault(); event.stopPropagation(); };
        card.ondrop = event => {
            event.preventDefault(); event.stopPropagation();
            const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
            if (file && file.path) this.importTrace(file.path).then(result => { if (result) this.showTraceCard(); }).catch(error => this.showToast(error.message, 'error'));
        };
        U.setHint('Unlock to move, scale or turn the tracing picture. Lock it again before painting.');
        return card;
    },
    closeTraceCard(leaving) {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-trace-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
        if (leaving) {
            const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
            if (scene && scene._spriteset && scene._spriteset._docsTraceSprite) scene._spriteset._docsTraceSprite.visible = false;
            this._traceFit = null;
        }
    }
});
DocsDoodads.Workspace.toolHooks.trace = {
    click() {}, down(event) { return this.beginTraceDrag(event); },
    move(event, stroking) { if (stroking) this.moveTraceDrag(event); }, up() { this.endTraceDrag(); },
    overlay(g) { this.drawTraceHandles(g); }
};
DocsDoodads.Workspace.toolHooks.traceFit = { click(at) { this.traceFitClick(at); } };
(function() {
    const loaded = DocsDoodads.Workspace.onMapLoaded;
    DocsDoodads.Workspace.onMapLoaded = function() {
        if (this._traceDrag) { this.applyTrace(this._traceDrag.mapId, this._traceDrag.before); this._traceDrag = null; }
        if (this.placementTool === 'trace' || this.placementTool === 'traceFit') this.setPlacementTool(null);
        this._traceFit = null; this._traceNormalized = null;
        return loaded.call(this);
    };
})();
if (typeof Spriteset_Map !== 'undefined' && typeof Sprite !== 'undefined' && typeof Bitmap !== 'undefined') {
    const updateOverlayBeforeTrace = Spriteset_Map.prototype.updateDocsEditorOverlay;
    Spriteset_Map.prototype.updateDocsEditorOverlay = function() {
        updateOverlayBeforeTrace.call(this);
        const W = DocsDoodads.Workspace, trace = editorMode && DocsDoodads.Compat.isTest() && W.mounted ? W.traceHere() : null;
        let sprite = this._docsTraceSprite;
        if (!trace || !trace.show || this._docs3d || !this._baseSprite) { if (sprite) sprite.visible = false; return; }
        if (!sprite) { sprite = this._docsTraceSprite = new PIXI.Container(); sprite._docsCopies = []; this._baseSprite.addChild(sprite); }
        const check = trace.file + ':' + (DocsDoodads.Trace.revision || 0);
        if (sprite._docsTraceCheck !== check) {
            sprite._docsTraceCheck = check;
            sprite._docsTraceMissing = Boolean(DocsDoodads.FS.fs && !DocsDoodads.FS.existsSync(trace.file));
        }
        if (sprite._docsTraceMissing) { sprite.visible = false; return; }
        if (sprite._docsFile !== trace.file) {
            const old = sprite._docsBitmap;
            sprite._docsBitmap = Bitmap.load(trace.file); sprite._docsFile = trace.file;
            if (old && typeof old.destroy === 'function') old.destroy();
        }
        const at = DocsDoodads.mapToScreen(trace.x, trace.y);
        const map = window.$gameMap, width = map.width() * map.tileWidth(), height = map.height() * map.tileHeight();
        const xs = map.isLoopHorizontal() ? [-width, 0, width] : [0], ys = map.isLoopVertical() ? [-height, 0, height] : [0];
        const corners = DocsDoodads.Trace.handles(trace).corners;
        const bounds = { left: Math.min.apply(null, corners.map(p => p.x - trace.x)), top: Math.min.apply(null, corners.map(p => p.y - trace.y)),
            right: Math.max.apply(null, corners.map(p => p.x - trace.x)), bottom: Math.max.apply(null, corners.map(p => p.y - trace.y)) };
        let count = 0;
        for (const dy of ys) for (const dx of xs) {
            let image = sprite._docsCopies[count];
            if (!image) { image = new Sprite(); sprite.addChild(image); sprite._docsCopies.push(image); }
            image.bitmap = sprite._docsBitmap; image.x = at.x + dx; image.y = at.y + dy;
            image.scale.set(trace.scale, trace.scale); image.rotation = trace.turn * Math.PI / 180;
            image.opacity = Math.round(trace.alpha * 255);
            image.visible = image.x + bounds.right >= 0 && image.y + bounds.bottom >= 0
                && image.x + bounds.left <= Graphics.width && image.y + bounds.top <= Graphics.height;
            count++;
        }
        for (let i = count; i < sprite._docsCopies.length; i++) sprite._docsCopies[i].visible = false;
        sprite.visible = true;
        const outline = this._docsSelectionOutline;
        if (outline && outline.parent === this._baseSprite) {
            const index = this._baseSprite.children.indexOf(outline);
            if (this._baseSprite.children.indexOf(sprite) > index) this._baseSprite.setChildIndex(sprite, index);
        }
    };
}
