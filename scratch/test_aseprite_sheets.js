// scratch/test_aseprite_sheets.js
// Visual equipment sheets from Aseprite: reads a layered .aseprite walk cycle (made by Aseprite itself,
// in scratch/fixtures) and writes one MZ character sheet per layer. The sheets are compared with
// Aseprite's own per-layer exports, pixel for pixel.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log("=== Testing Aseprite Layer Sheets ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$dataDocsDoodads = {};

require('../Docs-Doodads.js');
const A = DocsDoodads.AsepriteSheets;
const fixtures = path.join(__dirname, 'fixtures');
const inflate = d => zlib.inflateSync(d);

// A small PNG reader for the comparisons (8-bit RGBA or RGB, all filter types).
function readPng(file) {
    const buf = fs.readFileSync(file);
    let pos = 8, width = 0, height = 0, colorType = 6;
    const idat = [];
    while (pos < buf.length) {
        const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
        const data = buf.subarray(pos + 8, pos + 8 + len);
        if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data[9]; }
        if (type === 'IDAT') idat.push(data);
        pos += 12 + len;
    }
    const bpp = colorType === 6 ? 4 : 3, stride = width * bpp;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const out = new Uint8Array(width * height * 4);
    const prev = new Uint8Array(stride), cur = new Uint8Array(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)];
        for (let x = 0; x < stride; x++) {
            const v = raw[y * (stride + 1) + 1 + x], a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
            let p;
            if (filter === 0) p = v; else if (filter === 1) p = v + a; else if (filter === 2) p = v + b;
            else if (filter === 3) p = v + ((a + b) >> 1);
            else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); p = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
            cur[x] = p & 255;
        }
        for (let x = 0; x < width; x++) {
            out.set(bpp === 4 ? cur.subarray(x * 4, x * 4 + 4) : [cur[x * 3], cur[x * 3 + 1], cur[x * 3 + 2], 255], (y * width + x) * 4);
        }
        prev.set(cur);
    }
    return { width, height, rgba: out };
}

// 1. Reading the file: size, layers (with the hidden one), the four direction tags, 12 frames.
const ase = A.parse(fs.readFileSync(path.join(fixtures, 'walker.aseprite')), inflate);
assert.deepStrictEqual([ase.width, ase.height, ase.depth, ase.frames.length], [16, 16, 32, 12]);
assert.deepStrictEqual(ase.layers.map(l => [l.name, l.visible]), [['Body', true], ['Hair', true], ['Hidden', false]]);
assert.deepStrictEqual(ase.tags.map(t => [t.name, t.from, t.to]), [['down', 0, 2], ['left', 3, 5], ['right', 6, 8], ['up', 9, 11]]);
assert.ok(ase.frames[1].cels.some(c => c.layer === 1 && c.link === 0), 'frame 2 of the hair is linked to frame 1');

// 2. The layout: rows down, left, right, up, three frames each.
assert.deepStrictEqual(A.plan(ase), { rows: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]], perRow: 3 });

// 3. One sheet per visible layer, single-character names, matching Aseprite's own export exactly.
const sheets = A.sheets(ase, 'Walker');
assert.deepStrictEqual(sheets.map(s => s.fileName), ['$Walker_Body.png', '$Walker_Hair.png']);
for (const sheet of sheets) {
    assert.deepStrictEqual([sheet.width, sheet.height], [48, 64]);
    const ref = readPng(path.join(fixtures, `walker_${sheet.name}_ref.png`));
    assert.deepStrictEqual([ref.width, ref.height], [48, 64]);
    let diff = 0;
    for (let i = 0; i < ref.rgba.length; i += 4) {
        const a1 = sheet.rgba[i + 3], a2 = ref.rgba[i + 3];
        if (Math.abs(a1 - a2) > 1 || (a2 > 0 && [0, 1, 2].some(k => Math.abs(sheet.rgba[i + k] - ref.rgba[i + k]) > 1))) diff++;
    }
    assert.strictEqual(diff, 0, sheet.name + ' matches Aseprite\'s export');
}
// The linked cel repeats frame 1's hair in frame 2 (row 0, column 1).
const hair = sheets[1];
const alphaAt = (sheet, x, y) => sheet.rgba[(y * sheet.width + x) * 4 + 3];
assert.strictEqual(alphaAt(hair, 16 + 3, 2), 128, 'linked hair is drawn, half transparent');

// 4. Indexed colour files give the same pictures.
const indexed = A.parse(fs.readFileSync(path.join(fixtures, 'walker_indexed.aseprite')), inflate);
assert.strictEqual(indexed.depth, 8);
const indexedSheets = A.sheets(indexed, 'Walker');
assert.deepStrictEqual(indexedSheets.map(s => s.fileName), sheets.map(s => s.fileName));
const body = sheets[0], ibody = indexedSheets[0];
for (let i = 0; i < body.rgba.length; i += 4) {
    if (body.rgba[i + 3] === 255) assert.deepStrictEqual(Array.from(ibody.rgba.subarray(i, i + 4)), Array.from(body.rgba.subarray(i, i + 4)));
}

// 5. Without tags: the first frames in order; other row lengths are named [fN].
const untagged = Object.assign({}, ase, { tags: [], frames: ase.frames.slice(0, 8) });
assert.deepStrictEqual(A.plan(untagged), { rows: [[0, 1], [2, 3], [4, 5], [6, 7]], perRow: 2 });
assert.strictEqual(A.sheets(untagged, 'Walker')[0].fileName, '$Walker_Body[f2].png');
assert.throws(() => A.plan(Object.assign({}, ase, { tags: [], frames: ase.frames.slice(0, 3) })), /at least 4 frames/);
assert.throws(() => A.parse(Buffer.from('not an aseprite file at all, just text padding to 128 bytes'.padEnd(200, '.')), inflate), /Not an Aseprite file/);

// 6. The PNG writer round-trips.
const png = A.encodePng(body.width, body.height, body.rgba, d => zlib.deflateSync(d));
const tmp = path.join(require('os').tmpdir(), 'docs_doodads_sheet_test.png');
fs.writeFileSync(tmp, png);
const back = readPng(tmp);
fs.unlinkSync(tmp);
assert.deepStrictEqual([back.width, back.height], [48, 64]);
assert.deepStrictEqual(Array.from(back.rgba), Array.from(body.rgba));

console.log("✓ Aseprite layer sheets: reading (RGBA and indexed, linked cels, tags), MZ layout, and PNG output matching Aseprite's export.");
