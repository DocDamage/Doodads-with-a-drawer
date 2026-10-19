// Phase 0 spike for the LPC character creator (docs/LPC_CHARACTER_CREATOR_PLAN.md). Throwaway: it proves
// the library format, the recolouring and the frame choice before the real compositor is written.
// It reads only the library's data files and images (none of the generator's code), so it stays MIT.
//
//   node scripts/lpc_spike.js <library folder> <MZ project folder> [Name]
//
// Writes into the project: img/characters/$Name.png (3 frames x 4), $Name[f9].png (every walk frame),
// data/DocsDoodadsLpcIndex.json (every part) and data/DocsDoodadsLpcSpikeCredits.json.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { decode, create } = require('./png_read');
const { encodePng } = require('./png');

const FRAME = 64;
const LPC_DIRS = ['up', 'left', 'down', 'right'];
const MZ_ROWS = ['down', 'left', 'right', 'up']; // MZ sheet rows, top to bottom
const SAFE_TO_ENCRYPT = /^(CC0|OGA-BY)/i;
const ANIMATION_FILES = { combat: 'combat_idle', '1h_slash': 'slash', '1h_backslash': 'backslash', '1h_halfslash': 'halfslash' };

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out); else if (entry.name.endsWith('.json')) out.push(full);
    }
    return out;
}

// A credit block lists the licences the file can be used under; any one of them will do. A part is
// safe to encrypt when every file it credits offers CC0 or OGA-BY.
function licenceInfo(credits) {
    const blocks = (credits || []).map(c => c.licenses || []);
    return {
        licences: [...new Set(blocks.flat())],
        safeToEncrypt: blocks.length > 0 && blocks.every(list => list.some(l => SAFE_TO_ENCRYPT.test(l))),
        credited: blocks.length > 0
    };
}

// The credit block for one image folder: the one whose file is the longest prefix of the path.
function creditFor(credits, layerPath) {
    const clean = String(layerPath).replace(/\/+$/, '');
    return (credits || []).filter(c => c.file && (clean === c.file || clean.startsWith(c.file.replace(/\/+$/, '') + '/')))
        .sort((a, b) => b.file.length - a.file.length)[0] || null;
}

function buildIndex(library) {
    const root = path.join(library, 'sheet_definitions');
    const parts = [];
    const skipped = [];
    for (const file of walk(root)) {
        if (path.basename(file).startsWith('meta_')) continue;
        const id = path.relative(root, file).replace(/\\/g, '/').replace(/\.json$/, '');
        let def;
        try { def = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { skipped.push({ id, why: 'unreadable JSON' }); continue; }
        const layers = Object.keys(def).filter(k => /^layer_\d+$/.test(k)).map(k => def[k]);
        if (!def.name || !layers.length || layers.some(l => typeof l.zPos !== 'number')) { skipped.push({ id, why: 'unknown format' }); continue; }
        const bodies = ['male', 'muscular', 'female', 'pregnant', 'teen', 'child'];
        parts.push({
            id, name: def.name, type: def.type_name || '', priority: def.priority || 0,
            layers: layers.map(l => ({ z: l.zPos, custom: l.custom_animation || '', paths: Object.fromEntries(bodies.filter(b => l[b]).map(b => [b, l[b]])) })),
            animations: def.animations || [], variants: def.variants || [], recolors: def.recolors || null,
            matchBodyColor: def.match_body_color === true, tags: def.tags || [], requiredTags: def.required_tags || [],
            ...licenceInfo(def.credits), credits: def.credits || []
        });
    }
    return { parts, skipped };
}

function loadPalettes(library) {
    const root = path.join(library, 'palette_definitions');
    const materials = {};
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dir = path.join(root, entry.name);
        const metaFile = path.join(dir, 'meta_' + entry.name + '.json');
        const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
        const versions = {};
        for (const f of fs.readdirSync(dir)) {
            const m = f.match(new RegExp('^' + entry.name + '_(\\w+)\\.json$'));
            if (m) versions[m[1]] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        }
        materials[entry.name] = { base: meta.base, version: meta.default || 'ulpc', versions };
    }
    return materials;
}

const hex = s => { const v = parseInt(String(s).replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };

// Source ramp -> target ramp, by colour. The art is drawn in each material's base ramp.
function recolourMap(materials, channel, target) {
    const material = materials[channel.material];
    if (!material || !target) return null;
    const ramps = material.versions[material.version] || {};
    const source = channel.source || ramps[material.base];
    const goal = ramps[target];
    if (!source || !goal) return null;
    const map = new Map();
    source.forEach((c, i) => { if (goal[i]) map.set(hex(c).join(','), hex(goal[i])); });
    return map;
}

function recolour(image, maps) {
    const d = image.data;
    for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const key = d[i] + ',' + d[i + 1] + ',' + d[i + 2];
        for (const map of maps) {
            const to = map.get(key);
            if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; break; }
        }
    }
    return image;
}

function over(dst, src) {
    const a = dst.data, b = src.data;
    for (let i = 0; i < a.length; i += 4) {
        const sa = b[i + 3] / 255;
        if (!sa) continue;
        const da = a[i + 3] / 255, oa = sa + da * (1 - sa);
        for (let c = 0; c < 3; c++) a[i + c] = Math.round((b[i + c] * sa + a[i + c] * da * (1 - sa)) / oa);
        a[i + 3] = Math.round(oa * 255);
    }
}

// The image for one layer and animation: <path><anim>.png, or <path><anim>/<variant>.png for parts sold
// in fixed colours.
function layerFile(library, layerPath, animation, variant) {
    const name = ANIMATION_FILES[animation] || animation;
    const base = path.join(library, 'spritesheets', layerPath);
    const flat = path.join(base, name + '.png');
    if (fs.existsSync(flat)) return flat;
    const byVariant = variant && path.join(base, name, variant + '.png');
    return byVariant && fs.existsSync(byVariant) ? byVariant : null;
}

// recipe: { body: 'male', picks: [{ id, colours: ['light'] | variant: 'blue' }] }
function composite(library, index, materials, recipe, animation) {
    const byId = new Map(index.parts.map(p => [p.id, p]));
    const skin = (recipe.picks.find(p => p.id === 'body/body') || {}).colours || [];
    const layers = [];
    const warnings = [];
    recipe.picks.forEach((pick, order) => {
        const part = byId.get(pick.id);
        if (!part) { warnings.push('No part ' + pick.id); return; }
        const channels = !part.recolors ? [] : part.recolors.material ? [part.recolors] : Object.keys(part.recolors).sort().map(k => part.recolors[k]);
        const colours = channels.map((ch, i) => (i === 0 && part.matchBodyColor && skin[0]) ? skin[0] : (pick.colours || [])[i]);
        const maps = channels.map((ch, i) => recolourMap(materials, ch, colours[i])).filter(Boolean);
        for (const layer of part.layers) {
            const layerPath = layer.paths[recipe.body];
            if (!layerPath || layer.custom) continue;
            const file = layerFile(library, layerPath, animation, pick.variant);
            if (!file) { warnings.push(`${part.name}: no ${animation} for ${recipe.body}`); continue; }
            layers.push({ z: layer.z, priority: part.priority, order, file, maps, part, credit: creditFor(part.credits, layerPath) });
        }
    });
    layers.sort((a, b) => a.z - b.z || a.priority - b.priority || a.order - b.order);
    let sheet = null;
    for (const layer of layers) {
        const image = recolour(decode(fs.readFileSync(layer.file)), layer.maps);
        if (!sheet) sheet = create(image.width, image.height);
        if (image.width !== sheet.width || image.height !== sheet.height) { warnings.push('Size differs: ' + layer.file); continue; }
        over(sheet, image);
    }
    return { sheet, layers, warnings };
}

function blit(dst, src, sx, sy, dx, dy, w = FRAME, h = FRAME) {
    for (let y = 0; y < h; y++) {
        const from = ((sy + y) * src.width + sx) * 4, to = ((dy + y) * dst.width + dx) * 4;
        dst.data.set(src.data.subarray(from, from + w * 4), to);
    }
}

// The widest stride in each half of the cycle, measured on the down-facing row: the feet spread most
// at the passing poses MZ's three-frame walk wants.
function stepFrames(walkSheet) {
    const row = LPC_DIRS.indexOf('down');
    const spread = frame => {
        let min = FRAME, max = -1;
        for (let y = FRAME - 14; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
            if (walkSheet.data[((row * FRAME + y) * walkSheet.width + frame * FRAME + x) * 4 + 3] > 0) { min = Math.min(min, x); max = Math.max(max, x); }
        }
        return max - min;
    };
    // Height of the feet differs more than width from the front: use the lowest pixel per frame too.
    const lift = frame => {
        for (let y = FRAME - 1; y >= 0; y--) for (let x = 0; x < FRAME; x++) {
            if (walkSheet.data[((row * FRAME + y) * walkSheet.width + frame * FRAME + x) * 4 + 3] > 0) return y;
        }
        return 0;
    };
    const frames = Math.floor(walkSheet.width / FRAME);
    const scores = [];
    for (let f = 1; f < frames; f++) scores.push({ f, spread: spread(f), lift: lift(f) });
    const half = Math.ceil((frames - 1) / 2);
    const best = list => list.slice().sort((a, b) => b.spread - a.spread || a.f - b.f)[0].f;
    return { a: best(scores.slice(0, half)), b: best(scores.slice(half)), scores };
}

function mzSheet(walkSheet, columns) {
    const out = create(columns.length * FRAME, 4 * FRAME);
    MZ_ROWS.forEach((dir, row) => columns.forEach((frame, col) => blit(out, walkSheet, frame * FRAME, LPC_DIRS.indexOf(dir) * FRAME, col * FRAME, row * FRAME)));
    return out;
}

function main() {
    const [library, project, name = 'Spike'] = process.argv.slice(2);
    if (!library || !project) { console.log('node scripts/lpc_spike.js <library folder> <MZ project folder> [Name]'); process.exit(1); }
    const started = Date.now();
    const index = buildIndex(library);
    const materials = loadPalettes(library);
    const safe = index.parts.filter(p => p.safeToEncrypt).length;
    console.log(`Indexed ${index.parts.length} parts (${index.skipped.length} skipped, ${safe} safe to encrypt) and ${Object.keys(materials).length} palette materials in ${Date.now() - started} ms`);

    const recipe = {
        body: 'male',
        picks: [
            { id: 'body/body', colours: ['olive'] },
            { id: 'head/heads/human/heads_human_male', colours: ['olive', 'blue'] },
            { id: 'legs/pants/legs_pants', colours: ['navy'] },
            { id: 'feet/shoes/feet_shoes_basic', colours: ['brown'] },
            { id: 'torso/shirts/longsleeve/torso_clothes_longsleeve', colours: ['teal'], variant: 'teal' },
            { id: 'hair/bob/hair_bob', colours: ['dark_brown'] }
        ]
    };
    const t = Date.now();
    const walkResult = composite(library, index, materials, recipe, 'walk');
    const walkSheet = walkResult.sheet;
    const steps = stepFrames(walkSheet);
    console.log(`Composited ${walkResult.layers.length} layers into ${walkSheet.width}x${walkSheet.height} in ${Date.now() - t} ms`);
    for (const w of walkResult.warnings) console.log('  warning: ' + w);
    console.log(`Three-frame walker uses LPC walk frames ${steps.a}, 0, ${steps.b} (stride per frame: ${steps.scores.map(s => s.f + ':' + s.spread).join(' ')})`);

    const characters = path.join(project, 'img', 'characters');
    const write = (file, image) => fs.writeFileSync(path.join(characters, file), encodePng(image.width, image.height, image.data, b => zlib.deflateSync(b, { level: 9 })));
    const frames = Math.floor(walkSheet.width / FRAME);
    write(`$${name}.png`, mzSheet(walkSheet, [steps.a, 0, steps.b]));
    write(`$${name}[f${frames}].png`, mzSheet(walkSheet, Array.from({ length: frames }, (_, i) => i)));
    write(`${name}_lpc_walk.png`, walkSheet);

    // Credits and the encryption check follow the files actually drawn, not every body type of a part.
    const used = walkResult.layers.map(l => ({ part: l.part, credit: l.credit, ...licenceInfo(l.credit ? [l.credit] : []) }));
    fs.writeFileSync(path.join(project, 'data', 'DocsDoodadsLpcIndex.json'), JSON.stringify({ version: 0, library: path.resolve(library), built: new Date().toISOString(), parts: index.parts.map(({ credits, ...rest }) => rest), skipped: index.skipped }));
    fs.writeFileSync(path.join(project, 'data', 'DocsDoodadsLpcSpikeCredits.json'), JSON.stringify({
        images: [`$${name}.png`, `$${name}[f${frames}].png`],
        safeToEncrypt: used.every(u => u.safeToEncrypt),
        files: used.map(u => ({ part: u.part.id, name: u.part.name, safeToEncrypt: u.safeToEncrypt, credit: u.credit }))
    }, null, 2));
    for (const u of used) console.log(`  ${u.safeToEncrypt ? 'safe    ' : 'NOT safe'} ${u.part.name} (${u.credit ? u.credit.file : 'no credit found'}): ${u.licences.join(', ') || '-'}`);
    console.log('Wrote $' + name + '.png, $' + name + `[f${frames}].png and the index into ` + project);
}

if (require.main === module) main();
module.exports = { creditFor, buildIndex, loadPalettes, licenceInfo, recolourMap, composite, stepFrames, mzSheet };
