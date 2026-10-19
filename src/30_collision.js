//==========================================================
// SECTION 19: DocsDoodads.COLLISION (PRESETS & SAT RUNTIME)
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
    },

    // The solid footprint at the bottom of a sprite (a tree's trunk, a wall's base) as a shape
    // relative to the frame. Faint pixels such as soft shadows and anti-aliasing are ignored.
    footprintFromAlpha(data, width, height, options = {}) {
        const frame = options.frame || { x: 0, y: 0, w: width, h: height };
        const threshold = options.alphaThreshold !== undefined ? options.alphaThreshold : 48;
        const fw = Math.max(1, Math.min(frame.w, width - frame.x));
        const fh = Math.max(1, Math.min(frame.h, height - frame.y));
        const solid = (px, py) => data[((frame.y + py) * width + frame.x + px) * 4 + 3] >= threshold;

        let top = -1, bottom = -1;
        for (let py = 0; py < fh; py++) {
            for (let px = 0; px < fw; px++) {
                if (solid(px, py)) {
                    if (top < 0) top = py;
                    bottom = py;
                    break;
                }
            }
        }
        if (bottom < 0) return null;

        const contentH = bottom - top + 1;
        const ratio = options.bandRatio !== undefined ? options.bandRatio : 0.25;
        const minBand = options.minBandPx !== undefined ? options.minBandPx : 4;
        const maxBand = options.maxBandPx !== undefined ? options.maxBandPx : 32;
        const band = Math.max(1, Math.min(contentH, Math.max(minBand, Math.min(maxBand, Math.round(contentH * ratio)))));
        const bandTop = bottom - band + 1;
        const columnFill = options.columnFill !== undefined ? options.columnFill : 0.3;

        let minCol = -1, maxCol = -1;
        for (let px = 0; px < fw; px++) {
            let count = 0;
            for (let py = bandTop; py <= bottom; py++) if (solid(px, py)) count++;
            if (count / band >= columnFill) {
                if (minCol < 0) minCol = px;
                maxCol = px;
            }
        }
        if (minCol < 0) return null;
        const round = v => Math.round(v * 10000) / 10000;
        return { x: round(minCol / fw), y: round(bandTop / fh), w: round((maxCol - minCol + 1) / fw), h: round(band / fh) };
    }
};

// A doodad's collision body in map pixels ({ x, y, w, h }), or null when it has none.
DocsDoodads.Collision.bodyOf = function(dData) {
    if (!dData || !dData.collision || dData.collision.preset === "none") return null;
    const shape = dData.collision.shape || DocsDoodads.Collision.getPresetShape(dData.collision.preset);
    if (!shape) return null;
    const dw = (dData.frameW || 48) * (dData.scaleX || 1);
    const dh = (dData.frameH || 48) * (dData.scaleY || 1);
    const ax = dData.anchorX !== undefined ? dData.anchorX : 0.5;
    const ay = dData.anchorY !== undefined ? dData.anchorY : 1.0;
    const originX = dData.x - dw * ax;
    const originY = dData.y - dh * ay;
    return DocsDoodads.box(originX + shape.x * dw + (shape.w * dw) / 2, originY + shape.y * dh + (shape.h * dh) / 2, shape.w * dw, shape.h * dh);
};

// The box a tile is tested with: two thirds of the tile, at its centre.
DocsDoodads.Collision.tileBox = function(tx, ty, tw, th) {
    return DocsDoodads.box(tx * tw + tw / 2, ty * th + th / 2, tw * 2 / 3, th * 2 / 3);
};

// The tiles a collision body blocks (by the same test as blocksTile).
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

// Whether a showing doodad's collision covers a map tile (a box two thirds of a tile, at its centre).
// Doodads hidden by their switch, condition, season or a layer hidden in game never block, nor do
// doodads in a state without collision (an open door).
// vehicles: only doodads set to block boats and ships (collision.vehicles) count.
DocsDoodads.Collision.blocksTile = function(tx, ty, vehicles) {
    const doodads = DocsDoodads.doodads();
    if (!doodads || doodads.length === 0) return false;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const tileBox = this.tileBox(tx, ty, tw, th);
    const mapSettings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
    for (const dData of doodads) {
        if (vehicles && !(dData && dData.collision && dData.collision.vehicles)) continue;
        const colBody = this.bodyOf(dData);
        if (!colBody) continue;
        // The box test is cheap; switches and conditions are only checked for doodads on this tile.
        if (!DocsDoodads.judge(colBody, tileBox)) continue;
        if (DocsDoodads.Layers.visibleInGame(dData, mapSettings) && DocsDoodads.Appearance.isVisible(dData, {}) && DocsDoodads.States.blocks(dData)) return true;
    }
    return false;
};

if (typeof Game_CharacterBase !== 'undefined') {
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (!_Game_CharacterBase_canPass.apply(this, arguments)) return false;
        // Through characters (and Ctrl-walking in a playtest), the party in an airship, and anyone
        // flying (Traversal) pass doodads too.
        if (this.isThrough() || this.isDebugThrough()) return true;
        if (this.isInAirship && this.isInAirship()) return true;
        if (DocsDoodads.Traversal && DocsDoodads.Traversal.isFlying(this)) return true;
        // Boats and ships sail past doodads over water unless a doodad is set to block them (a pier).
        const sailing = (this.isInBoat && this.isInBoat()) || (this.isInShip && this.isInShip());
        return !DocsDoodads.Collision.blocksTile($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d), sailing);
    };
}

