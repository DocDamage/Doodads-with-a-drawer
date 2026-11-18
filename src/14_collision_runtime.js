//==========================================================
// SECTION 19-R: DOODAD COLLISION RUNTIME
//==========================================================
DocsDoodads.Collision = {
    presets: {
        none: null,
        full: { x: 0, y: 0, w: 1, h: 1 },
        bottomHalf: { x: 0, y: 0.5, w: 1, h: 0.5 },
        bottomThird: { x: 0, y: 0.67, w: 1, h: 0.33 },
        center: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
        trunk: { x: 0.35, y: 0.75, w: 0.3, h: 0.25 },
        thinWall: { x: 0, y: 0.4, w: 1, h: 0.2 },
        wideWall: { x: 0, y: 0.25, w: 1, h: 0.5 },
        custom: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }
    },

    getPresetShape(presetName) {
        return this.presets[presetName] || null;
    }
};

DocsDoodads.Collision.statePreset = function(dData) {
    if (!dData || !dData.states || !DocsDoodads.States.has(dData)) return '';
    const st = DocsDoodads.States.current(dData);
    return st && st.collisionPreset && this.presets[st.collisionPreset] !== undefined ? String(st.collisionPreset) : '';
};

DocsDoodads.Collision.bodyOf = function(dData) {
    if (!dData) return null;
    const byState = DocsDoodads.Collision.statePreset(dData);
    if (!byState && (!dData.collision || dData.collision.preset === 'none')) return null;
    const shape = byState ? DocsDoodads.Collision.getPresetShape(byState)
        : dData.collision.shape || DocsDoodads.Collision.getPresetShape(dData.collision.preset);
    if (!shape) return null;
    const dw = (dData.frameW || 48) * (dData.scaleX || 1);
    const dh = (dData.frameH || 48) * (dData.scaleY || 1);
    const ax = dData.anchorX !== undefined ? dData.anchorX : 0.5;
    const ay = dData.anchorY !== undefined ? dData.anchorY : 1.0;
    const originX = dData.x - dw * ax;
    const originY = dData.y - dh * ay;
    return DocsDoodads.box(originX + shape.x * dw + (shape.w * dw) / 2, originY + shape.y * dh + (shape.h * dh) / 2, shape.w * dw, shape.h * dh);
};

DocsDoodads.Collision.tileBox = function(tx, ty, tw, th) {
    return DocsDoodads.box(tx * tw + tw / 2, ty * th + th / 2, tw * 2 / 3, th * 2 / 3);
};

DocsDoodads.Collision.tilesUnder = function(body, tw, th) {
    if (!body) return [];
    const out = [];
    for (let ty = Math.floor(body.y / th) - 1; ty <= Math.floor((body.y + body.h) / th) + 1; ty++) {
        for (let tx = Math.floor(body.x / tw) - 1; tx <= Math.floor((body.x + body.w) / tw) + 1; tx++) {
            if (DocsDoodads.judge(body, this.tileBox(tx, ty, tw, th))) out.push({ x: tx, y: ty });
        }
    }
    return out;
};

DocsDoodads.Collision.oneWayDirs = { down: 2, left: 4, right: 6, up: 8 };

DocsDoodads.Collision.stops = function(dData, mover, d) {
    const col = dData.collision || {};
    const who = col.who || 'all';
    if (who !== 'all' && mover) {
        const party = DocsDoodads.Traversal && DocsDoodads.Traversal.isPartyMember ? DocsDoodads.Traversal.isPartyMember(mover) : false;
        const isEvent = typeof Game_Event !== 'undefined' && mover instanceof Game_Event;
        if (who === 'player' && !party) return false;
        if (who === 'events' && !isEvent) return false;
    }
    if (col.oneWay && d && this.oneWayDirs[col.oneWay] === d) return false;
    return true;
};

DocsDoodads.Collision.blocksTile = function(tx, ty, vehicles, mover, d) {
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const walls = DocsDoodads.Walls.get($gameMap.mapId());
    if (DocsDoodads.Walls.blocksTile(walls, tx, ty, tw, th)) return true;
    const doodads = DocsDoodads.doodads();
    if (!doodads || doodads.length === 0) return false;
    const here = this.grid(doodads, tw, th).tiles.get(this.tileKey(tx, ty));
    if (!here) return false;
    const mapSettings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
    for (const dData of here) {
        if (vehicles && !(dData.collision && dData.collision.vehicles)) continue;
        if ((mover || d) && dData.collision && !this.stops(dData, mover, d)) continue;
        if (DocsDoodads.Layers.visibleInGame(dData, mapSettings) && DocsDoodads.Appearance.isVisible(dData, {}) && DocsDoodads.States.blocks(dData)) return true;
    }
    return false;
};

// A step that crosses a painted line (06_walls.js blocksStep), from tile (x, y) in direction d.
DocsDoodads.Collision.blocksStep = function(x, y, d) {
    const walls = DocsDoodads.Walls.get($gameMap.mapId());
    return Boolean(walls) && DocsDoodads.Walls.blocksStep(walls, x, y, d, $gameMap.tileWidth(), $gameMap.tileHeight());
};

DocsDoodads.Collision.tileKey = function(tx, ty) {
    return (ty + 2) * 1048576 + (tx + 2);
};

DocsDoodads.Collision._bodies = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
DocsDoodads.Collision.cachedBody = function(d) {
    if (!this._bodies || !d || typeof d !== 'object') return { body: this.bodyOf(d), changed: true };
    const col = d.collision;
    const c = this._bodies.get(d);
    const sp = d.states ? this.statePreset(d) : '';
    if (c && c.col === col && c.preset === (col && col.preset) && c.shape === (col && col.shape) && c.x === d.x && c.y === d.y
        && c.fw === d.frameW && c.fh === d.frameH && c.sx === d.scaleX && c.sy === d.scaleY && c.ax === d.anchorX && c.ay === d.anchorY && c.sp === sp) {
        return { body: c.body, changed: false };
    }
    const body = this.bodyOf(d);
    this._bodies.set(d, { col, preset: col && col.preset, shape: col && col.shape, x: d.x, y: d.y, fw: d.frameW, fh: d.frameH,
        sx: d.scaleX, sy: d.scaleY, ax: d.anchorX, ay: d.anchorY, sp, body });
    return { body, changed: true };
};

DocsDoodads.Collision.grid = function(doodads, tw, th) {
    const frame = DocsDoodads.frameCount ? DocsDoodads.frameCount() : 0;
    const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
    let g = this._grid;
    const same = g && g.doodads === doodads && g.length === doodads.length && g.tw === tw && g.th === th;
    if (same && !editing && frame !== 0 && g.frame === frame && !this._dirty) return g;
    this._dirty = false;
    let changed = !same || editing;
    const bodies = new Array(doodads.length);
    for (let i = 0; i < doodads.length; i++) {
        const r = this.cachedBody(doodads[i]);
        bodies[i] = r.body;
        if (r.changed) changed = true;
    }
    if (!changed) {
        g.frame = frame;
        return g;
    }
    const tiles = new Map();
    for (let i = 0; i < doodads.length; i++) {
        if (!bodies[i]) continue;
        for (const t of this.tilesUnder(bodies[i], tw, th)) {
            const key = this.tileKey(t.x, t.y);
            const list = tiles.get(key);
            if (list) list.push(doodads[i]); else tiles.set(key, [doodads[i]]);
        }
    }
    g = this._grid = { doodads, length: doodads.length, tw, th, frame, tiles };
    return g;
};

DocsDoodads.Collision.invalidate = function() {
    this._dirty = true;
};

if (typeof Game_CharacterBase !== 'undefined') {
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (!_Game_CharacterBase_canPass.apply(this, arguments)) return false;
        if (this.isThrough() || this.isDebugThrough()) return true;
        if (this.isInAirship && this.isInAirship()) return true;
        if (DocsDoodads.Traversal && DocsDoodads.Traversal.isFlying(this)) return true;
        const sailing = (this.isInBoat && this.isInBoat()) || (this.isInShip && this.isInShip());
        const C = DocsDoodads.Collision;
        return !C.blocksTile($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d), sailing, this, d) && !C.blocksStep(x, y, d);
    };
}
