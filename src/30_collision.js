// @editor-only
//==========================================================
// SECTION 19-E: COLLISION EDITOR HELPERS
//==========================================================
// Trace a solid footprint from the bottom of a sprite. Runtime collision uses the saved relative shape.
DocsDoodads.Collision.footprintFromAlpha = function(data, width, height, options = {}) {
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
};

DocsDoodads.Collision.whoOptions = [
    { value: 'all', label: 'Everyone' }, { value: 'player', label: 'Only the player and followers' }, { value: 'events', label: 'Only events' }
];
DocsDoodads.Collision.oneWayOptions = [
    { value: '', label: 'Both ways' }, { value: 'down', label: 'Only going down' }, { value: 'up', label: 'Only going up' },
    { value: 'left', label: 'Only going left' }, { value: 'right', label: 'Only going right' }
];
