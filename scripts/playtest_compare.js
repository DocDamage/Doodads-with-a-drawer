'use strict';
// Compare the raw pixels kept beside each PNG. No browser, decoder or GPU is needed here.
function compare(expected, actual, options = {}) {
    const width = Number(actual.width), height = Number(actual.height);
    if (expected.width !== width || expected.height !== height) return { pass: false, reason: 'size', changed: 0, bounds: null };
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216
        || !expected.rgba || !actual.rgba || expected.rgba.length !== width * height * 4 || actual.rgba.length !== width * height * 4) {
        return { pass: false, reason: 'pixels', changed: 0, bounds: null };
    }
    const tolerance = options.tolerance === undefined ? 8 : options.tolerance;
    const allowed = options.fraction === undefined ? 0.001 : options.fraction;
    if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 255 || !Number.isFinite(allowed) || allowed < 0 || allowed > 1) throw new Error('Invalid comparison tolerance.');
    const diff = new Uint8Array(width * height * 4);
    let changed = 0, x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let pixel = 0; pixel < width * height; pixel++) {
        const i = pixel * 4;
        let different = false;
        for (let c = 0; c < 4; c++) if (Math.abs(expected.rgba[i + c] - actual.rgba[i + c]) > tolerance) different = true;
        const x = pixel % width, y = Math.floor(pixel / width);
        if (different) { changed++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        diff[i] = different ? 255 : Math.round(actual.rgba[i] * 0.2);
        diff[i + 1] = different ? 0 : Math.round(actual.rgba[i + 1] * 0.2);
        diff[i + 2] = different ? 0 : Math.round(actual.rgba[i + 2] * 0.2);
        diff[i + 3] = 255;
    }
    const bounds = changed ? { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null;
    if (bounds) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (x !== x0 && x !== x1 && y !== y0 && y !== y1) continue;
        const i = (y * width + x) * 4; diff[i] = 255; diff[i + 1] = 220; diff[i + 2] = 0;
    }
    return { pass: changed / (width * height) <= allowed, reason: null, changed, pixels: width * height, fraction: changed / (width * height), bounds, diff };
}
module.exports = { compare };
