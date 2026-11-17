// @editor-only
//==========================================================
// SECTION 25R: ROPES IN THE EDITOR (9.3.2)
//==========================================================
// Path card → Draw a Rope Instead: press at one end and release at the other (Shift snaps to tile middles). The picked picture, if any, becomes the
// rope's texture; otherwise it is a plain cord. A selected rope shows a handle at each end and one in the middle
// for the sag; each drag is one Undo step. Details → Rope sets sag, thickness, colour, sway and hung things.
(function() {
    const D = DocsDoodads, W = D.Workspace, R = D.Rope;
    const handleRadius = 9;

    Object.assign(W, {
        ropeItems() { return this.selectionItems().filter(d => d && d.line && !d.locked); },

        ropePoint(e) {
            // Ends go where the pointer is (the top of a pole is rarely a tile corner); Shift snaps to tile middles.
            const at = this.clientToMapCoords(e.clientX, e.clientY);
            if (!e.shiftKey) return { x: Math.round(at.x), y: Math.round(at.y) };
            const snapped = this.snapToTile(at), th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            return { x: snapped.x, y: snapped.y - th / 2 };
        },

        // Map points of a rope's handles: start, end and the middle of the sag.
        ropeHandles(d) {
            const l = R.normalize(d.line), x = Number(d.x) || 0, y = Number(d.y) || 0;
            return { start: { x, y }, end: { x: x + l.x2, y: y + l.y2 }, sag: { x: x + l.x2 / 2, y: y + l.y2 / 2 + l.sag } };
        },

        ropeHandleAt(e) {
            const at = this.clientToMapCoords(e.clientX, e.clientY);
            const scale = this.ropeScreenScale();
            for (const d of this.ropeItems()) {
                const handles = this.ropeHandles(d);
                for (const name of ['end', 'sag', 'start']) {
                    if (Math.hypot(handles[name].x - at.x, handles[name].y - at.y) <= handleRadius / scale) return { d, name };
                }
            }
            return null;
        },

        // Screen pixels per map pixel, so handles keep their size when the view is zoomed.
        ropeScreenScale() {
            const ss = typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset;
            const m = ss && ss._baseSprite && ss._baseSprite.worldTransform;
            return Math.max(0.25, m ? Math.hypot(m.a, m.b) || 1 : 1);
        },

        makeRopeDoodad(from, to, asset = this.selectedAsset) {
            const d = D.standardStruct();
            const picture = asset && asset.path && asset.type !== 'prefab' && asset.category !== 'Audio' && /\.(png|jpe?g|webp)$/i.test(asset.path);
            d.bit = picture ? [3, asset.path] : [1, 0];
            if (picture) { d.frameW = asset.frameW || asset.width || 48; d.frameH = asset.frameH || asset.height || 48; }
            d.x = Math.round(from.x); d.y = Math.round(from.y);
            const x2 = Math.round(to.x - from.x), y2 = Math.round(to.y - from.y);
            d.line = R.normalize(Object.assign({}, R.defaults, { x2, y2, sag: Math.round(Math.min(96, Math.hypot(x2, y2) * 0.12)) }));
            d.depth = 'above';
            return d;
        },

        placeRope(from, to, asset) {
            if (!window.$gameMap || Math.hypot(to.x - from.x, to.y - from.y) < 8) return null;
            const d = this.makeRopeDoodad(from, to, asset);
            const mapId = $gameMap.mapId();
            const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
            D.Undo.execute(this.doodadListStep('place_rope', list, [d], true));
            if (typeof this.selectDoodad === 'function') this.selectDoodad(d);
            else { this.selectedDoodad = d; this.selectedDoodads = [d]; }
            if (this.refreshInspector) this.refreshInspector();
            return d;
        },

        startRopeTool() {
            this.setPlacementTool('rope');
            this.showToast(this.selectedAsset && this.selectedAsset.path ? `Press at one end and release at the other. ${this.selectedAsset.path.split('/').pop()} becomes the rope.`
                : 'Press at one end and release at the other for a plain cord (pick a picture first for a textured rope).');
        },

        drawRopeOverlay(g) {
            if (this.placementTool !== 'rope' || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const colour = D.Ui.mapColor('selection'), draft = this._ropeDraft;
            if (draft) {
                const a = D.mapToScreen(draft.from.x, draft.from.y), b = D.mapToScreen(draft.to.x, draft.to.y);
                g.lineStyle(2, colour, 0.9); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineStyle(0);
            }
            for (const d of this.ropeItems()) {
                const handles = this.ropeHandles(d);
                for (const name of ['start', 'end', 'sag']) {
                    const p = D.mapToScreen(handles[name].x, handles[name].y);
                    g.lineStyle(2, 0x111111, 0.6); g.beginFill(name === 'sag' ? 0xffffff : colour, 0.95);
                    g.drawCircle(p.x, p.y, name === 'sag' ? 5 : 6); g.endFill(); g.lineStyle(0);
                }
            }
        }
    });

    W.toolHooks.rope = {
        down(e) {
            const handle = this.ropeHandleAt(e);
            if (handle) {
                this._ropeDrag = { d: handle.d, name: handle.name, before: this.snapshotDoodads([handle.d]) };
                return true;
            }
            const p = this.ropePoint(e);
            this._ropeDraft = { from: p, to: { x: p.x, y: p.y } };
            return true;
        },
        move(e, stroking) {
            if (!stroking) return;
            const p = this.ropePoint(e);
            if (this._ropeDraft) { this._ropeDraft.to = p; return; }
            const drag = this._ropeDrag;
            if (!drag) return;
            const d = drag.d, l = R.normalize(d.line), endX = d.x + l.x2, endY = d.y + l.y2;
            if (drag.name === 'end') { l.x2 = Math.round(p.x - d.x); l.y2 = Math.round(p.y - d.y); }
            else if (drag.name === 'start') { d.x = Math.round(p.x); d.y = Math.round(p.y); l.x2 = Math.round(endX - d.x); l.y2 = Math.round(endY - d.y); }
            else l.sag = Math.round(Math.max(0, p.y - (d.y + l.y2 / 2)));
            d.line = R.normalize(l);
            D.Persistence.dirtyDoodads = true;
        },
        up() {
            this._suppressNextClick = true;
            const draft = this._ropeDraft, drag = this._ropeDrag;
            this._ropeDraft = null; this._ropeDrag = null;
            if (draft) this.placeRope(draft.from, draft.to);
            else if (drag) this.recordDoodadEdit([drag.d], drag.before, 'edit_rope');
        },
        overlay(g) { this.drawRopeOverlay(g); }
    };

    // Details → Rope, only when every selected doodad is a rope.
    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || !items.every(d => d && d.line)) return all;
        const presets = [{ value: '', label: 'None' }].concat(D.LightPresets.list.map(p => ({ value: p.id, label: p.label })));
        return all.concat([{ title: 'Rope', fields: [
            { key: 'line.sag', label: 'Sag (pixels)', type: 'range', min: 0, max: 256, step: 1 },
            { key: 'line.width', label: 'Thickness (plain cord)', type: 'range', min: 1, max: 16, step: 1 },
            { key: 'line.color', label: 'Colour (plain cord)', type: 'color' },
            { key: 'line.sway', label: 'Sways in the wind', type: 'range', min: 0, max: 2, step: 0.1 },
            { key: 'line.hang.path', label: 'Hung picture (img/..., blank for none)', type: 'text' },
            { key: 'line.hang.count', label: 'How many hang along it', type: 'range', min: 0, max: 24, step: 1 },
            { key: 'line.hang.light', label: 'Each one gives light', type: 'select', options: presets }
        ] }]);
    };
    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) {
        if (String(key).indexOf('line.') === 0 && d && d.line) {
            const l = R.normalize(d.line);
            return key.slice(5).split('.').reduce((value, part) => value && value[part], l);
        }
        return get.call(this, d, key);
    };
    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (String(key).indexOf('line.') === 0) {
            if (!d || !d.line) return;
            const l = R.normalize(d.line), parts = key.slice(5).split('.');
            const owner = parts.length > 1 ? l[parts[0]] : l;
            if (owner && typeof owner === 'object') owner[parts[parts.length - 1]] = value;
            d.line = R.normalize(l);
            return;
        }
        return apply.call(this, d, key, value);
    };

    // A button on the Path card starts the Rope tool.
    W.addRopeButton = function() {
        const pop = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-path-popover') : null;
        if (!pop || document.getElementById('dd-rope-btn') || typeof document.createElement !== 'function') return null;
        const button = document.createElement('button');
        button.className = 'dd-btn'; button.id = 'dd-rope-btn'; button.type = 'button';
        button.textContent = 'Draw a Rope Instead';
        button.title = 'A line between two points that sags and sways, with things hung along it';
        button.style.cssText = 'width:100%;margin-top:6px;';
        if (typeof pop.appendChild === 'function') pop.appendChild(button);
        button.onclick = () => this.startRopeTool();
        return button;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        this.addRopeButton();
        return result;
    };
})();
