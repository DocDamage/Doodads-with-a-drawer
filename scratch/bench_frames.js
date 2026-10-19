// scratch/bench_frames.js
// Per-frame cost on a big map, on the stand-in engine (scratch/engine/fake_engine.js): 3,000 doodads
// (lights, shadows, states, switches, particles, sounds, animation), 20 wandering events, in 2D and in
// 3D. Not a test (wall-clock numbers depend on the machine); run it before and after a change:
//   node scratch/bench_frames.js            ms a frame, 2D and 3D
//   node scratch/bench_frames.js --counts   also counts the per-frame calls B4 removed
// Pass --doodads=N or --frames=N to change the size.
const path = require('path');
const E = require('./engine/fake_engine');

const arg = (name, def) => { const a = process.argv.find(s => s.startsWith('--' + name + '=')); return a ? Number(a.split('=')[1]) : def; };
const COUNT = arg('doodads', 3000), FRAMES = arg('frames', 240);
const wantCounts = process.argv.includes('--counts');

E.install();
const W = 120, H = 100;
// Wall regions so occluded lights have something to trace.
const tiles = [];
for (let i = 0; i < 300; i++) tiles.push([(i * 37) % W, (i * 53) % H, 5, 10]);
E.setupWorld({ width: W, height: H, px: 60, py: 50, tilesetMode: 1, tiles });
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const list = [];
for (let i = 0; i < COUNT; i++) {
    const tx = Math.floor(rand() * W), ty = Math.floor(rand() * H), r = rand();
    const extra = { uid: 'dd_' + i };
    if (r < 0.08) extra.light = { enabled: true, when: 'always', radius: 120, occlude: i % 2 === 0 };
    if (r > 0.6) extra.shadow = { enabled: true, followSun: i % 3 === 0 };
    if (r > 0.3 && r < 0.36) { extra.states = { list: [{ name: 'closed' }, { name: 'open' }], switchId: 3 }; }
    if (r > 0.4 && r < 0.48) extra.switch = [5];
    if (r > 0.5 && r < 0.52) extra.particles = { preset: 'fire', rateScale: 1, layer: 'above', offsetX: 0, offsetY: 0 };
    if (r > 0.52 && r < 0.53) extra.sound = { file: 'bgs/River', volume: 80, pitch: 100, radius: 6 };
    if (r > 0.7 && r < 0.8) { extra.xFrame = 4; extra.frameUpdate = 8; }
    if (r > 0.9) extra.motion = { type: 'sway', amount: 1 };
    if (i % 5 === 0) extra.layer = 'l' + (i % 3);
    list.push(E.doodad(tx, ty, extra));
}
$dataDocsDoodads[1] = list;
require('../Docs-Doodads.js');
const D = DocsDoodads;
D.Lighting.setMapSettings(1, {
    ambient: { darkness: 0.4, color: '#101830', switchId: 0 },
    layers: { list: [{ id: 'l0', name: 'Ground' }, { id: 'l1', name: 'Props' }, { id: 'l2', name: 'Top' }] }
});

// 20 wandering events: each tries a step every frame, as a busy map's NPCs do across a second.
$dataMap.events = [null];
for (let i = 1; i <= 20; i++) {
    $dataMap.events[i] = { id: i, name: 'NPC' + i, note: '', x: 10 + i * 4, y: 20 + (i % 7) * 8, pages: [{ list: [], image: { characterName: 'People1', characterIndex: 0 } }] };
    const ev = new Game_Event(1, i);
    ev.locate($dataMap.events[i].x, $dataMap.events[i].y);
    ev._characterName = 'People1';
    $gameMap._events[i] = ev;
}
const wander = () => { let k = 0; for (const ev of $gameMap.events()) ev.moveStraight([2, 4, 6, 8][(Graphics.frameCount + k++) % 4]); };

const counters = {};
function count(obj, key, label) {
    const fn = obj[key];
    if (typeof fn !== 'function') return;
    counters[label] = 0;
    obj[key] = function(...a) { counters[label]++; return fn.apply(this, a); };
}
if (wantCounts) {
    count(D.Layers, 'visibleInGame', 'Layers.visibleInGame');
    count(D.Layers, 'list', 'Layers.list');
    count(D.Atmosphere, 'season', 'Atmosphere.season');
    count(D.Appearance, 'signature', 'Appearance.signature');
    count(D.States, 'index', 'States.index');
    count(D.MapLayers, 'list', 'MapLayers.list');
    count(D.Wind, 'current', 'Wind.current');
    count(D.Look || {}, 'normalize', 'Look.normalize');
    const T = PIXI.Texture;
    counters['new PIXI.Texture'] = 0;
    PIXI.Texture = class extends T { constructor(...a) { super(...a); counters['new PIXI.Texture']++; } };
    Object.assign(PIXI.Texture, T);
    if (D.Collision && D.Collision.doodadBoxes) count(D.Collision, 'doodadBoxes', 'Collision.doodadBoxes');
}

function measure(label, ss, frames) {
    E.frames(ss, 30); // warm up: pictures load, sprites settle
    for (const k in counters) counters[k] = 0;
    const started = process.hrtime.bigint();
    for (let i = 0; i < frames; i++) { wander(); E.frames(ss, 1); }
    const ms = Number(process.hrtime.bigint() - started) / 1e6 / frames;
    console.log(`${label}: ${ms.toFixed(2)} ms a frame (${COUNT} doodads, ${frames} frames)`);
    if (wantCounts) for (const [k, v] of Object.entries(counters)) console.log(`  ${k}: ${(v / frames).toFixed(1)} a frame`);
    return ms;
}

const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
measure('2D', ss, FRAMES);
// The player walks: the camera moves, so culling and ambience see a changing view.
$gamePlayer.locate(30, 30); $gameMap.setDisplayPos(22, 24);
measure('2D, camera moved', ss, Math.round(FRAMES / 2));
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 24 } });
measure('3D', ss, Math.round(FRAMES / 2));
void path;
