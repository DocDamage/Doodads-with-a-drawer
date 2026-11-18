'use strict';
// 7.3.4 Baking for phones: every reason a doodad is not still; chunks by band and place; the manifest and its
// staleness (the deploy script makes the same number); the game draws chunks in place of the baked sprites only
// while current, never in the editor and not in a playtest unless asked; the editor writes the chunk files and
// removes old ones; Exclude unused files keeps them; deploy --bake lists stale maps.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-bake-'));
process.chdir(dir);
E.install();
E.setupWorld({ width: 50, height: 30, px: 2, py: 2 });
const still = (tx, ty, extra) => E.doodad(tx, ty, Object.assign({ depth: 'below' }, extra || {}));
const rug = still(3, 3, { uid: 'rug' });
const sign = still(30, 3, { uid: 'sign', depth: 'above' });
const tree = E.doodad(5, 5, { uid: 'tree' }); // sorted with characters
const lamp = still(6, 6, { uid: 'lamp', light: { enabled: true } });
$dataDocsDoodads[1] = [rug, sign, tree, lamp];
require('../Docs-Doodads.js');
const D = DocsDoodads, B = D.Bake;

// ---- Pure ----
assert.strictEqual(B.whyNot(rug), '');
const why = extra => B.whyNot(Object.assign({}, rug, extra));
assert.strictEqual(why({ depth: 'sorted' }), 'sorted with characters');
assert.strictEqual(why({ motion: { type: 'sway' } }), 'moves');
assert.strictEqual(why({ rotateSpeed: 2 }), 'spins');
assert.strictEqual(why({ xFrame: 3, frameUpdate: 8 }), 'animated');
assert.strictEqual(why({ states: { list: [{}, {}] } }), 'has states');
assert.strictEqual(why({ switch: [3] }), 'shows by a switch or condition');
assert.strictEqual(why({ condition: 'v[1] > 2' }), 'shows by a switch or condition');
assert.strictEqual(why({ touch: { enabled: true } }), 'touchable');
assert.strictEqual(why({ light: { enabled: true } }), 'gives light');
assert.strictEqual(why({ shadow: { enabled: true } }), 'casts a shadow');
assert.strictEqual(why({ particles: { preset: 'fireflies' } }), 'has an effect');
assert.strictEqual(why({ travel: { points: [] } }), 'changes in play');
assert.strictEqual(why({ hue: 40 }), 'drawn with a filter');
assert.strictEqual(why({ blend: 1 }), 'drawn with a filter');
assert.strictEqual(why({ temp: true }), 'placed in the game');
assert.strictEqual(why({ bit: [1, 0] }), 'no picture');
assert.strictEqual(B.whyNot(Object.assign({}, rug, { light: { enabled: false } })), '', 'a light that is off is still');
const chunks = B.chunks($dataDocsDoodads[1], 50 * 48, 30 * 48);
assert.deepStrictEqual(chunks.map(c => [c.band, c.cx, c.cy, c.items.map(i => i.d.uid).join()]), [['above', 1, 0, 'sign'], ['below', 0, 0, 'rug']], 'only still doodads, by band and place');
const edge = still(21, 3, { uid: 'edge', frameW: 96 });
const across = B.chunks([edge], 50 * 48, 30 * 48);
assert.strictEqual(across.length, 2, 'a doodad on a chunk line goes in both');
const m = B.manifest(1, chunks, $dataDocsDoodads[1]);
assert.deepStrictEqual(m.uids.sort(), ['rug', 'sign']);
assert.strictEqual(m.chunks[1].file, 'img/doodads/_baked/Map001_below_0_0.png');
assert.ok(!B.stale(m, $dataDocsDoodads[1]));
assert.ok(B.stale(m, $dataDocsDoodads[1].concat([still(9, 9)])), 'a change makes it stale');
assert.ok(!B.stale(m, $dataDocsDoodads[1].concat([Object.assign(still(9, 9), { temp: true })])), 'doodads placed in the game do not');
const deployScript = require('../scripts/deploy.js');
assert.strictEqual(deployScript.bakeHash($dataDocsDoodads[1]), m.hash, 'the deploy script makes the same number');

// ---- The game ----
$dataDocsDoodads.baked = { 1: m };
D.Compat.isTest = () => false;
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 1);
const uids = () => ss._docsDoodadSprites.map(s => s._data.uid).sort();
assert.deepStrictEqual(uids(), ['lamp', 'tree'], 'the baked doodads have no sprites');
assert.strictEqual(ss._docsBakeSprites.length, 2, 'a sprite per chunk');
assert.ok(ss._docsBakeSprites.some(s => s.z === D.Depth.bands.above) && ss._docsBakeSprites.some(s => s.z === D.Depth.bands.below));
$gameMap.setDisplayPos(2, 1);
E.frames(ss, 1);
const below = ss._docsBakeSprites.find(s => s._docsChunk.band === 'below');
assert.deepStrictEqual([below.x, below.y], [-96, -48], 'chunks move with the camera');
assert.ok(D.Collision !== undefined);
// Stale: the real doodads come back.
$dataDocsDoodads[1].push(still(12, 12, { uid: 'new' }));
ss.addDocsDoodads();
assert.ok(uids().includes('rug') && !ss._docsBakeSprites.length, 'stale: the real doodads are drawn');
$dataDocsDoodads[1].pop();
// A playtest shows the real doodads unless asked for.
D.Compat.isTest = () => true;
ss.addDocsDoodads();
assert.ok(uids().includes('rug'), 'not in a playtest');
D.World.settings().bake = { playtest: true };
ss.addDocsDoodads();
assert.ok(!uids().includes('rug'), 'unless World → bake → playtest');
D.World.settings().bake = {};

// ---- The editor ----
const W = D.Workspace;
W.mounted = true; W.showToast = () => {};
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/Map001.json', JSON.stringify($dataMap));
fs.mkdirSync('img/doodads/_baked', { recursive: true });
fs.writeFileSync('img/doodads/_baked/Map001_above_9_9.png', 'old');
(async () => {
    const drawn = [];
    const made = await W.bakeMap(1, async c => { drawn.push(c.band + c.cx + c.cy); return Buffer.from('png'); });
    assert.deepStrictEqual(drawn, ['above10', 'below00']);
    assert.ok(fs.existsSync('img/doodads/_baked/Map001_below_0_0.png') && fs.existsSync('img/doodads/_baked/Map001_above_1_0.png'), 'chunk files written');
    assert.ok(!fs.existsSync('img/doodads/_baked/Map001_above_9_9.png'), 'an old chunk is removed');
    assert.strictEqual($dataDocsDoodads.baked[1].hash, made.hash);
    assert.deepStrictEqual(W.staleBakes(), []);
    $dataDocsDoodads[1].push(still(12, 12, { uid: 'new2' }));
    assert.deepStrictEqual(W.staleBakes(), [1], 'Problems will say to bake again');
    // Exclude unused files keeps the chunks.
    const required = D.RequiredAssets.collect({ doodads: $dataDocsDoodads });
    assert.ok(required.includes('img/doodads/_baked/Map001_below_0_0.png'));
    // deploy --bake lists stale maps.
    fs.writeFileSync('data/DocsDoodads.json', JSON.stringify($dataDocsDoodads));
    assert.deepStrictEqual(deployScript.staleBakes(dir), [1]);
    $dataDocsDoodads[1].pop();
    fs.writeFileSync('data/DocsDoodads.json', JSON.stringify($dataDocsDoodads));
    assert.deepStrictEqual(deployScript.staleBakes(dir), [], 'current: nothing to say');
    // A map with nothing still: its bake goes.
    $dataDocsDoodads[1] = [tree];
    await W.bakeMap(1, async () => Buffer.from('png'));
    assert.ok(!$dataDocsDoodads.baked, 'no manifest');
    assert.deepStrictEqual(fs.readdirSync('img/doodads/_baked'), [], 'no chunks');
    console.log('test_bake: OK');
})().catch(e => { console.error(e); process.exit(1); });
