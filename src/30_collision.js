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

// Whether a showing doodad's collision covers a map tile (a box two thirds of a tile, at its centre).
// Doodads hidden by their switch, condition, season or a layer hidden in game never block.
DocsDoodads.Collision.blocksTile = function(tx, ty) {
    const doodads = DocsDoodads.doodads();
    if (!doodads || doodads.length === 0) return false;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const tileBox = DocsDoodads.box(tx * tw + tw / 2, ty * th + th / 2, tw * 2 / 3, th * 2 / 3);
    const mapSettings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
    for (const dData of doodads) {
        if (!dData || !dData.collision || dData.collision.preset === "none") continue;
        if (!DocsDoodads.Layers.visibleInGame(dData, mapSettings) || !DocsDoodads.Appearance.isVisible(dData, {})) continue;
        const shape = dData.collision.shape || DocsDoodads.Collision.getPresetShape(dData.collision.preset);
        if (!shape) continue;
        const dw = (dData.frameW || 48) * (dData.scaleX || 1);
        const dh = (dData.frameH || 48) * (dData.scaleY || 1);
        const ax = dData.anchorX !== undefined ? dData.anchorX : 0.5;
        const ay = dData.anchorY !== undefined ? dData.anchorY : 1.0;
        const originX = dData.x - dw * ax;
        const originY = dData.y - dh * ay;
        const colBody = DocsDoodads.box(originX + shape.x * dw + (shape.w * dw) / 2, originY + shape.y * dh + (shape.h * dh) / 2, shape.w * dw, shape.h * dh);
        if (DocsDoodads.judge(colBody, tileBox)) return true;
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
        return !DocsDoodads.Collision.blocksTile($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d));
    };
}

