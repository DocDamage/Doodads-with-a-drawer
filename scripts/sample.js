// A small sample project that shows the plugin, written into a NEW, empty RPG Maker MZ project (7.1.8):
//
//   npm run sample -- <a new MZ project folder>
//
// Make the project in RPG Maker MZ first (File > New Project), close MZ, then run this. It writes:
//  - the plugin's own drawn art (no one else's) into img/doodads/samples/;
//  - Map001, the town at dusk: lamps, a sign, a house whose door opens (two states, touched), a chest and fences;
//    Map002, a field: wind, trees and flowers swaying, a pond's birds and butterflies, the 3D view on;
//    Map003, a cave: dark, the flashlight on, echo, torches;
//    transfers between them both ways, and MapInfos entries for the two new maps;
//  - the doodad data (data/DoodadsQJ.json, or the file the plugin's Data File parameter names).
// The tiles are the project's own tileset (MZ's, on your computer): nothing of MZ's is shipped. It never writes
// into a project that already has doodad data or a Map002 or Map003. Afterwards turn the plugin on in Plugin
// Manager if it isn't, and open the project again in MZ to see the new maps.
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function loadPlugin() {
    if (global.DocsDoodads) return global.DocsDoodads;
    global.window = global;
    window.addEventListener = window.addEventListener || (() => {});
    window.removeEventListener = window.removeEventListener || (() => {});
    global.document = global.document || { createElement: () => ({ style: {}, appendChild() {}, getContext: () => null }), body: { appendChild() {} }, getElementById: () => null };
    global.Utils = global.Utils || { RPGMAKER_NAME: 'MZ', isNwjs: () => false, isOptionValid: () => false };
    global.PluginManager = global.PluginManager || { parameters: () => ({}), registerCommand() {} };
    global.$dataDocsDoodads = {};
    require(path.join(__dirname, '..', 'Docs-Doodads.js'));
    return global.DocsDoodads;
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeMz(file, list) { fs.writeFileSync(file, '[\n' + list.map(v => JSON.stringify(v === undefined ? null : v)).join(',\n') + '\n]'); }

// The doodad data file the project's plugin settings name (Data File), else the default.
function dataFileName(project) {
    const plugins = path.join(project, 'js', 'plugins.js');
    if (fs.existsSync(plugins)) {
        const m = fs.readFileSync(plugins, 'utf8').match(/"name"\s*:\s*"Docs-Doodads"[^}]*"parameters"\s*:\s*\{[^}]*"dataFileName"\s*:\s*"([^"]+)"/);
        if (m && /^[\w-]+(\.json)?$/.test(m[1])) return m[1].replace(/\.json$/i, '') + '.json';
    }
    return 'DoodadsQJ.json';
}

function sample(project, options = {}) {
    project = path.resolve(project);
    const data = path.join(project, 'data');
    for (const f of ['System.json', 'MapInfos.json', 'Map001.json', 'Tilesets.json']) {
        if (!fs.existsSync(path.join(data, f))) throw new Error(`${project} is not an MZ project (no data/${f}). Make one with File > New Project in RPG Maker MZ first.`);
    }
    const name = dataFileName(project);
    const base = name.replace(/\.json$/i, '');
    if (fs.existsSync(path.join(data, name)) || fs.existsSync(path.join(data, base))) throw new Error(`This project already has doodad data (data/${name}); the sample goes only into a new, empty project.`);
    if (fs.existsSync(path.join(data, 'Map002.json')) || fs.existsSync(path.join(data, 'Map003.json'))) throw new Error('This project already has a Map002 or Map003; the sample goes only into a new, empty project.');
    const D = loadPlugin(), A = D.SampleArt, NM = D.NewMap, P = D.Places;

    // ---- Art ----
    const dir = path.join(project, 'img', 'doodads', 'samples');
    fs.mkdirSync(dir, { recursive: true });
    const art = {};
    for (const kind of A.kinds.concat(A.creatureKinds, A.sceneKinds)) {
        const drawn = A.draw(kind);
        const rel = `img/doodads/samples/sample_${kind}.png`;
        const file = path.join(project, rel);
        if (!fs.existsSync(file)) fs.writeFileSync(file, Buffer.from(D.AsepriteSheets.encodePng(drawn.width, drawn.height, drawn.rgba, b => zlib.deflateSync(b))));
        art[kind] = { path: rel, w: drawn.width, h: drawn.height };
    }

    // ---- Maps: the project's own tileset and ground ----
    const map1 = readJson(path.join(data, 'Map001.json'));
    const tilesets = readJson(path.join(data, 'Tilesets.json'));
    const flags = ((tilesets[map1.tilesetId] || {}).flags) || [];
    const counts = new Map();
    for (let i = 0; i < map1.width * map1.height; i++) { const id = map1.data[i] || 0; if (id) counts.set(id, (counts.get(id) || 0) + 1); }
    const ground = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]).find(id => !((flags[id] || 0) & 0x0f) || ((flags[id] || 0) & 0x0f) !== 0x0f) || 2816;
    const tw = 48, th = 48;
    const at = (kind, tx, ty, extra) => Object.assign(D.standardStruct(), { bit: [3, art[kind].path], frameW: art[kind].w, frameH: art[kind].h,
        x: tx * tw + tw / 2, y: ty * th + th, depth: 'sorted', uid: `sample_${kind}_${tx}_${ty}` }, extra || {});
    const light = extra => Object.assign({}, D.Lighting.lightDefaults, { enabled: true }, extra);
    const w1 = map1.width, h1 = map1.height;

    const infos = readJson(path.join(data, 'MapInfos.json'));
    const fieldW = 30, fieldH = 20, caveW = 20, caveH = 15;
    const town = [
        at('house', Math.floor(w1 / 2) - 2, 4, { name: 'Sample House', states: { by: 'events', fade: 20, list: [{ name: 'Shut', path: art.house.path }, { name: 'Open', path: art.houseOpen.path }] },
            touch: { enabled: true, action: 'next' }, collision: { preset: 'full', shape: null } }),
        at('lamp', 2, 6, { light: light({ when: 'dark', radius: 168, flicker: 0.1, offsetY: -66 }) }),
        at('lamp', w1 - 3, 6, { light: light({ when: 'dark', radius: 168, flicker: 0.1, offsetY: -66 }) }),
        at('sign', 4, 8, { name: 'Sample Sign' }), at('chest', w1 - 5, 9, { name: 'Sample Chest' }),
        at('fence', 1, h1 - 2), at('fence', 2, h1 - 2), at('fence', w1 - 3, h1 - 2), at('fence', w1 - 2, h1 - 2),
        at('flowers', 6, 7, { motion: { type: 'sway', amount: 0.6 } }), at('bush', 7, 8)
    ];
    const field = [];
    for (let i = 0; i < 14; i++) field.push(at('tree', 2 + (i * 7) % (fieldW - 4), 2 + (i * 5) % (fieldH - 4), { motion: { type: 'sway', amount: 0.5 } }));
    for (let i = 0; i < 20; i++) field.push(at('flowers', 1 + (i * 11) % (fieldW - 2), 1 + (i * 7) % (fieldH - 2), { motion: { type: 'sway', amount: 0.8 } }));
    field.push(at('bush', 14, 10, { creatures: { kind: 'butterflies', count: 6 } }));
    field.push(at('tree', 20, 12, { creatures: { kind: 'birds', count: 4, sheet: art.bird.path }, perch: true }));
    const cave = [at('torch', 3, 3, { light: light({ radius: 120, flicker: 0.35, color: '#ffb060', offsetY: -30 }) }),
        at('torch', caveW - 4, 3, { light: light({ radius: 120, flicker: 0.35, color: '#ffb060', offsetY: -30 }) }),
        at('rock', 6, 8), at('rock', 12, 10), at('chest', caveW - 3, caveH - 3, { name: 'Cave Chest' })];

    // Transfers both ways: the town's east edge ↔ the field's west edge; the field ↔ the cave.
    const fieldPlan = NM.plan(infos, { name: 'Sample Field', width: fieldW, height: fieldH, tilesetId: map1.tilesetId, parentId: 1, ground });
    const mid1 = Math.floor(h1 / 2), midF = Math.floor(fieldH / 2);
    fieldPlan.map.events[1] = P.transferEvent(1, 0, midF, 1, w1 - 2, mid1, 4, 'To the town');
    fieldPlan.map.events[2] = P.transferEvent(2, fieldW - 2, 2, fieldPlan.id + 1, Math.floor(caveW / 2), caveH - 3, 8, 'To the cave');
    const cavePlan = NM.plan(fieldPlan.infos, { name: 'Sample Cave', width: caveW, height: caveH, tilesetId: map1.tilesetId, parentId: fieldPlan.id, ground });
    cavePlan.map.events[1] = P.transferEvent(1, Math.floor(caveW / 2), caveH - 2, fieldPlan.id, fieldW - 2, 3, 2, 'Out of the cave');
    const id1 = D.Events.allocateSafeId(map1);
    while (map1.events.length <= id1) map1.events.push(null);
    map1.events[id1] = P.transferEvent(id1, w1 - 1, mid1, fieldPlan.id, 1, midF, 6, 'To the field');

    const doodads = {
        1: town, [fieldPlan.id]: field, [cavePlan.id]: cave,
        mapSettings: {
            1: { ambient: { darkness: 0.55, color: '#2a2050', switchId: 0 } },
            [fieldPlan.id]: { perspective: { enabled: true } },
            [cavePlan.id]: { ambient: { darkness: 0.85, color: '#05060a', switchId: 0 }, echo: { enabled: true, delay: 0.22, feedback: 0.4, mix: 0.35 } }
        },
        world: { weather2d: { wind: { strength: 0.5, direction: 1, gusts: 0.4, fromWeather: false } }, lighting2d: { flashlight: { enabled: true, switchId: 0, radius: 280, spread: 50, color: '#fff2cc', intensity: 0.9, occlude: true } } }
    };

    if (options.dryRun) return { art, maps: [1, fieldPlan.id, cavePlan.id], doodads, map1, fieldPlan, cavePlan, name };
    fs.writeFileSync(path.join(data, NM.path(fieldPlan.id).replace(/^data\//, '')), JSON.stringify(fieldPlan.map));
    fs.writeFileSync(path.join(data, NM.path(cavePlan.id).replace(/^data\//, '')), JSON.stringify(cavePlan.map));
    fs.writeFileSync(path.join(data, 'Map001.json'), JSON.stringify(map1));
    writeMz(path.join(data, 'MapInfos.json'), cavePlan.infos);
    fs.writeFileSync(path.join(data, name), JSON.stringify(D.DataFiles.stable(doodads), null, 2));
    fs.writeFileSync(path.join(project, 'CREDITS_SAMPLE.txt'), "The sample doodads (img/doodads/samples) were drawn by Doc's Doodads' own code; use them as you like.\n");
    return { art, maps: [1, fieldPlan.id, cavePlan.id], name };
}

module.exports = { sample, dataFileName };

if (require.main === module) {
    try {
        const target = process.argv[2];
        if (!target) throw new Error('Usage: npm run sample -- <a new RPG Maker MZ project folder>');
        const r = sample(target);
        console.log(`Wrote the sample: ${Object.keys(r.art).length} pictures, maps ${r.maps.join(', ')} and data/${r.name}. Open the project again in RPG Maker MZ and playtest.`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
