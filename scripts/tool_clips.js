// Moving tooltips (8.2.3): draws a short pixel clip of each of the ten main tools and builds them into
// src/36_ui_tool_clips.js (editor-only). The clips are drawn here, not recorded, so they are small and the
// same on every machine. `npm run clips` writes the part; `--check` (run by verify) redraws the clips,
// compares their pixels with the part and keeps the whole part under its size budget.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { encodePng } = require('./png');
const { decode } = require('./png_read');

const root = path.join(__dirname, '..');
const target = path.join(root, 'src', '36_ui_tool_clips.js');
const W = 80, H = 56, FRAMES = 8, BUDGET = 48 * 1024;

const C = {
    grass: [92, 170, 84], grid: [82, 156, 76], dark: [42, 34, 56], white: [255, 255, 255], trunk: [122, 74, 42],
    leaf: [60, 196, 107], leafDark: [35, 134, 74], flower: [255, 155, 210], flower2: [255, 212, 59], stone: [156, 149, 179],
    stoneDark: [100, 92, 120], dirt: [200, 135, 74], dirtDark: [150, 96, 52], wall: [255, 90, 95], select: [124, 203, 255],
    hill: [139, 227, 107], hillDark: [60, 140, 70], paint: [70, 140, 70], region: [[255, 159, 67], [177, 140, 255], [111, 240, 230]]
};

function frameCanvas() {
    const data = new Uint8Array(W * H * 4);
    const px = (x, y, c, a = 1) => {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const at = (y * W + x) * 4;
        for (let i = 0; i < 3; i++) data[at + i] = Math.round(data[at + i] * (1 - a) + c[i] * a);
        data[at + 3] = 255;
    };
    const rect = (x, y, w, h, c, a) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c, a); };
    const circle = (cx, cy, r, c, a) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.4) px(cx + x, cy + y, c, a); };
    const ring = (cx, cy, r, c) => { for (let k = 0; k < 64; k++) { const t = k / 64 * Math.PI * 2; px(cx + Math.cos(t) * r, cy + Math.sin(t) * r, c); } };
    const line = (x0, y0, x1, y1, c, dash = 0) => {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let i = 0; i <= n; i++) if (!dash || Math.floor(i / dash) % 2 === 0) px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
    };
    const tree = (x, y, s = 1) => {
        rect(x - 1, y - Math.round(6 * s), 3, Math.round(6 * s), C.trunk);
        circle(x, y - Math.round(10 * s), Math.round(7 * s), C.leafDark);
        circle(x - 1, y - Math.round(11 * s), Math.round(5 * s), C.leaf);
    };
    const cursor = (x, y) => {
        const shape = ['k', 'kk', 'kwk', 'kwwk', 'kwwwk', 'kwwwwk', 'kwwkkk', 'kk.kk', 'k...k'];
        shape.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') px(x + i, y + j, ch === 'k' ? C.dark : C.white); }));
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, x % 16 === 0 || y % 16 === 0 ? C.grid : C.grass);
    return { data, px, rect, circle, ring, line, tree, cursor };
}

// A small seeded sequence so scattered things land in the same places every time.
const seeded = seed => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

const scenes = {
    'dd-select-btn'(g, i) {
        const x = i < 3 ? 26 : Math.min(54, 26 + (i - 2) * 6);
        g.tree(x, 44);
        if (i >= 1) { g.line(x - 9, 24, x + 9, 24, C.select, 2); g.line(x - 9, 47, x + 9, 47, C.select, 2); g.line(x - 9, 24, x - 9, 47, C.select, 2); g.line(x + 9, 24, x + 9, 47, C.select, 2); }
        g.cursor(x + 2, 36 - (i === 0 ? 8 : 0));
    },
    'dd-stamp-btn'(g, i) {
        if (i >= 3) g.tree(28, 44, i === 3 ? 0.6 : 1);
        if (i >= 6) g.tree(54, 46, i === 6 ? 0.6 : 1);
        const cx = i < 3 ? 12 + i * 6 : i < 6 ? 28 + (i - 3) * 9 : 56;
        g.cursor(cx, i < 3 ? 30 : 34);
    },
    'dd-brush-btn'(g, i) {
        const r = seeded(7), reach = 10 + i * 9;
        for (let k = 0; k < 40; k++) {
            const x = 6 + r() * 68, y = 10 + r() * 38, colour = r() < 0.5 ? C.flower : C.flower2;
            if (x < reach) { g.px(x, y, colour); g.px(x + 1, y, colour); g.px(x, y + 1, colour); }
        }
        g.ring(reach, 30, 12, C.white);
    },
    'dd-biome-btn'(g, i) {
        const reach = 8 + i * 9;
        g.rect(4, 8, Math.min(72, reach), 42, C.paint, 0.45);
        const r = seeded(3);
        for (let k = 0; k < 10; k++) { const x = 8 + r() * 64, y = 22 + r() * 26; if (x < reach - 4) g.tree(Math.round(x), Math.round(y), 0.55); }
        g.ring(Math.min(76, reach), 30, 10, C.white);
    },
    'dd-path-btn'(g, i) {
        const points = [[10, 44], [28, 30], [48, 38], [70, 16]];
        const shown = Math.min(points.length, i + 1);
        for (let k = 1; k < shown; k++) g.line(points[k - 1][0], points[k - 1][1], points[k][0], points[k][1], C.white, 2);
        if (i >= 4) {
            for (let k = 1; k < points.length; k++) for (let s = 0; s <= 4; s++) {
                if ((k - 1) * 5 + s > (i - 3) * 5) continue;
                const t = s / 5, x = points[k - 1][0] + (points[k][0] - points[k - 1][0]) * t, y = points[k - 1][1] + (points[k][1] - points[k - 1][1]) * t;
                g.circle(Math.round(x), Math.round(y), 3, C.stoneDark); g.circle(Math.round(x) - 1, Math.round(y) - 1, 2, C.stone);
            }
        }
        for (let k = 0; k < shown; k++) g.circle(points[k][0], points[k][1], 2, C.dark);
    },
    'dd-terrain-btn'(g, i) {
        // A mound rising under the brush: wide at the foot, narrow and sunlit at the top.
        const h = 2 + i * 2;
        for (let k = 1; k <= h; k++) {
            const w = Math.max(6, 40 - k * 2), colour = k > h / 2 ? C.hill : C.hillDark;
            g.rect(Math.round(40 - w / 2), 48 - k * 2, w, 2, colour);
        }
        g.ring(40, 46 - h * 2, 8, C.white);
    },
    'dd-region-btn'(g, i) {
        const tiles = [[0, 1], [1, 1], [2, 1], [2, 2], [3, 2], [4, 2], [4, 1], [3, 0]];
        tiles.slice(0, i + 1).forEach(([tx, ty], k) => {
            const colour = C.region[k < 3 ? 0 : k < 6 ? 1 : 2];
            g.rect(tx * 16 + 1, ty * 16 + 1, 15, 15, colour, 0.65);
            g.rect(tx * 16 + 6, ty * 16 + 5, 3, 6, C.white);
        });
    },
    'dd-walls-btn'(g, i) {
        for (let k = 0; k <= i; k++) {
            const tx = k % 5, ty = k < 5 ? 1 : 2;
            g.rect(tx * 16 + 1, ty * 16 + 1, 15, 15, C.wall, 0.55);
            for (let d = 0; d < 15; d += 4) g.line(tx * 16 + 1 + d, ty * 16 + 1, tx * 16 + 1, ty * 16 + 1 + d, C.white);
        }
    },
    'dd-tiles-btn'(g, i) {
        for (let k = 0; k <= i; k++) {
            const tx = Math.min(4, k), ty = k < 5 ? 2 : 1 - (k - 5) % 2;
            g.rect(tx * 16 + 1, ty * 16 + 1, 15, 15, C.dirt);
            g.px(tx * 16 + 5, ty * 16 + 6, C.dirtDark); g.px(tx * 16 + 11, ty * 16 + 10, C.dirtDark); g.px(tx * 16 + 7, ty * 16 + 12, C.dirtDark);
        }
    },
    'dd-sym-btn'(g, i) {
        g.line(40, 2, 40, 54, C.white, 3);
        if (i >= 2) { g.tree(24, 44, i === 2 ? 0.6 : 1); g.tree(56, 44, i === 2 ? 0.6 : 1); }
        if (i >= 5) { g.tree(12, 30, i === 5 ? 0.6 : 0.8); g.tree(68, 30, i === 5 ? 0.6 : 0.8); }
        g.cursor(i < 2 ? 14 + i * 5 : i < 5 ? 26 : 14, i < 5 ? 34 : 20);
    }
};

const labels = {
    'dd-select-btn': 'Select', 'dd-stamp-btn': 'Stamp', 'dd-brush-btn': 'Scatter', 'dd-biome-btn': 'Paint', 'dd-path-btn': 'Path',
    'dd-terrain-btn': 'Hills', 'dd-region-btn': 'Regions', 'dd-walls-btn': 'Collision', 'dd-tiles-btn': 'Tiles', 'dd-sym-btn': 'Mirror'
};

function strip(id) {
    const out = new Uint8Array(W * FRAMES * H * 4);
    for (let i = 0; i < FRAMES; i++) {
        const g = frameCanvas();
        scenes[id](g, i);
        for (let y = 0; y < H; y++) Buffer.from(g.data.buffer, y * W * 4, W * 4).copy(Buffer.from(out.buffer), (y * W * FRAMES + i * W) * 4);
    }
    return out;
}

function source(urls) {
    const rows = Object.keys(scenes).map(id => `        '${id}': '${urls[id]}'`).join(',\n');
    return `// @editor-only
//==========================================================
// SECTION 24c: DocsDoodads.ToolClipArt (MOVING TOOLTIPS, GENERATED)
//==========================================================
// Built by scripts/tool_clips.js (npm run clips): a drawn clip of each main tool, ${FRAMES} frames of ${W} x ${H}
// pixels side by side. Edit the script, not this file.
DocsDoodads.ToolClipArt = {
    frameW: ${W},
    frameH: ${H},
    frames: ${FRAMES},
    labels: ${JSON.stringify(labels)},
    clips: {
${rows}
    }
};
`;
}

if (require.main !== module) {
    // Required by a test or another script: only the drawing functions are wanted.
} else if (process.argv.includes('--check')) {
    const text = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    let problems = 0;
    if (Buffer.byteLength(text) > BUDGET) { problems++; console.error(`src/36_ui_tool_clips.js is ${Buffer.byteLength(text)} bytes; the budget is ${BUDGET}.`); }
    for (const id of Object.keys(scenes)) {
        const m = new RegExp(`'${id}': 'data:image/png;base64,([A-Za-z0-9+/=]+)'`).exec(text);
        if (!m) { problems++; console.error(`${id} has no clip in src/36_ui_tool_clips.js.`); continue; }
        const image = decode(Buffer.from(m[1], 'base64')), want = strip(id);
        if (image.width !== W * FRAMES || image.height !== H || !Buffer.from(image.data).equals(Buffer.from(want))) {
            problems++; console.error(`${id}'s clip differs from scripts/tool_clips.js; run npm run clips.`);
        }
    }
    if (problems) process.exit(1);
    console.log(`Tool clips are current (${Object.keys(scenes).length} clips, ${Buffer.byteLength(text)} of ${BUDGET} bytes).`);
} else {
    const urls = {};
    for (const id of Object.keys(scenes)) urls[id] = 'data:image/png;base64,' + encodePng(W * FRAMES, H, strip(id), data => zlib.deflateSync(data, { level: 9 })).toString('base64');
    const text = source(urls);
    fs.writeFileSync(target, text);
    console.log(`src/36_ui_tool_clips.js: ${Object.keys(scenes).length} clips, ${Buffer.byteLength(text)} bytes (budget ${BUDGET}).`);
}

module.exports = { scenes, strip, W, H, FRAMES, BUDGET };
