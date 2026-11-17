'use strict';
// 8.3.1 Normal maps made for you: pure generation, cache keys, the editor's sliced job, the runtime
// lookup, Details → Shading, deployment and the asset index.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-normal-gen-'));
process.chdir(projectRoot);

E.install();
E.setupWorld({ width: 24, height: 18, px: 10, py: 9 });
const rock = E.doodad(11, 9, { uid: 'rock', bit: [3, 'img/doodads/Rock.png'], xFrame: 2, frameW: 48, frameH: 96, frameUpdate: 0 });
const plainOff = E.doodad(12, 9, { uid: 'off', bit: [3, 'img/doodads/Off.png'], shade: { mode: 'off' } });
const fileOnly = E.doodad(13, 9, { uid: 'file-only', bit: [3, 'img/doodads/FileOnly.png'], shade: { mode: 'file' } });
const lamp = E.doodad(9, 9, { uid: 'lamp', bit: [3, 'img/doodads/Lamp.png'], light: {
    enabled: true, when: 'always', switchId: 0, radius: 260, intensity: 0.8, color: '#ff8040', shape: 'point', flicker: 0
}, shade: { mode: 'off' } });
$dataDocsDoodads[1] = [rock, plainOff, fileOnly, lamp];
$dataDocsDoodads.world = { normalLight: { enabled: true, maxLights: 8 } };
require('../Docs-Doodads.js');

const D = DocsDoodads, G = D.NormalGen, N = D.NormalLight, W = D.Workspace;
assert.ok(G && typeof G.job === 'function', 'the generator exists');

const rgba = (width, height, paint) => {
    const out = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const c = paint(x, y), at = (y * width + x) * 4;
        out[at] = c[0]; out[at + 1] = c[1]; out[at + 2] = c[2]; out[at + 3] = c[3];
    }
    return out;
};
const at = (pixels, width, x, y) => Array.from(pixels.slice((y * width + x) * 4, (y * width + x) * 4 + 4));
const screenNormal = (pixels, width, x, y) => {
    const p = at(pixels, width, x, y);
    return [p[0] / 255 * 2 - 1, -(p[1] / 255 * 2 - 1), p[2] / 255 * 2 - 1];
};

// A flat square: straight out everywhere it is level, rounded or flat.
const square = rgba(16, 16, (x, y) => x >= 3 && x < 13 && y >= 3 && y < 13 ? [200, 200, 200, 255] : [0, 0, 0, 0]);
for (const shape of ['round', 'flat']) {
    const made = G.make(square, 16, 16, { shape, radius: 2 });
    assert.deepStrictEqual(at(made, 16, 8, 8), [128, 128, 255, 255], `${shape}: a level middle points straight out`);
}
const solid = rgba(8, 8, () => [90, 120, 40, 255]);
assert.ok(Array.from(G.make(solid, 8, 8)).every((v, i) => v === [128, 128, 255, 255][i % 4]), 'an opaque cell with no edge is a plateau, not a bevel');

// A circle: on its slope every normal points away from the centre.
const disc = rgba(33, 33, (x, y) => Math.hypot(x - 16, y - 16) <= 14 ? [180, 180, 180, 255] : [0, 0, 0, 0]);
const discNormals = G.make(disc, 33, 33, { radius: 8 });
for (let i = 0; i < 16; i++) {
    const angle = i / 16 * Math.PI * 2, x = Math.round(16 + Math.cos(angle) * 11), y = Math.round(16 + Math.sin(angle) * 11);
    const n = screenNormal(discNormals, 33, x, y), away = [x - 16, y - 16], length = Math.hypot(away[0], away[1]);
    const dot = (n[0] * away[0] + n[1] * away[1]) / (Math.hypot(n[0], n[1]) * length);
    assert.ok(dot > 0.9, `circle normal at (${x},${y}) points away from the centre (dot ${dot.toFixed(3)})`);
    assert.ok(n[2] > 0 && n[2] < 0.999, 'the slope leans but still faces the viewer');
}
assert.deepStrictEqual(at(discNormals, 33, 16, 16), [128, 128, 255, 255], 'the top of the dome is level');
const flatDisc = G.make(disc, 33, 33, { shape: 'flat' });
assert.notDeepStrictEqual(at(flatDisc, 33, 16 + 11, 16), at(discNormals, 33, 16 + 11, 16), 'Flat reads brightness, not the rounded shape');
const strong = G.make(disc, 33, 33, { radius: 8, strength: 3 });
assert.ok(screenNormal(strong, 33, 27, 16)[0] > screenNormal(discNormals, 33, 27, 16)[0], 'Strength steepens the slope');

// Frames never bleed: a bright frame beside a dark one stays level at their shared edge.
const strip = rgba(16, 8, x => x < 8 ? [255, 255, 255, 255] : [0, 0, 0, 255]);
const perFrame = G.make(strip, 16, 8, { shape: 'flat', grid: { w: 8, h: 8 } });
for (let y = 0; y < 8; y++) for (const x of [7, 8]) assert.deepStrictEqual(at(perFrame, 16, x, y), [128, 128, 255, 255], `frame edge pixel (${x},${y}) is untouched by its neighbour`);
const whole = G.make(strip, 16, 8, { shape: 'flat' });
assert.notDeepStrictEqual(at(whole, 16, 7, 4), [128, 128, 255, 255], 'without frames the same edge would tilt (the test can fail)');
const sheet = rgba(16, 16, (x, y) => (x < 8) !== (y < 8) ? [255, 255, 255, 255] : [0, 0, 0, 0]);
const sheetMade = G.make(sheet, 16, 16, { grid: { w: 8, h: 8 }, radius: 2 });
assert.deepStrictEqual(at(sheetMade, 16, 3, 3), [128, 128, 255, 255], 'an empty frame stays level beside full ones');
assert.deepStrictEqual(G.cells(100, 10, { w: 48, h: 10, x: 4 }).map(c => [c.x0, c.x1]), [[0, 4], [4, 52], [52, 100]], 'a grid offset leaves a partial first cell');
assert.deepStrictEqual(G.grid(10, 10, { w: 0, h: -3, x: 'x' }), { w: 10, h: 10, x: 0, y: 0 }, 'a bad grid is one cell');

// Same picture, same bytes, including the PNG the editor writes.
assert.deepStrictEqual(Array.from(G.make(disc, 33, 33, { radius: 8 })), Array.from(discNormals), 'the same picture gives the same bytes');
const zlib = require('zlib');
const png = data => Buffer.from(D.AsepriteSheets.encodePng(33, 33, new Uint8Array(data.buffer), raw => zlib.deflateSync(raw)));
assert.ok(png(discNormals).equals(png(G.make(disc, 33, 33, { radius: 8 }))), 'the written PNG is byte-for-byte repeatable');
const heights = G.heightFromAlpha(disc, 33, 33, { radius: 8 });
assert.strictEqual(heights[0], 0, 'see-through pixels have no height');
assert.ok(heights[16 * 33 + 16] > heights[16 * 33 + 29], 'the middle stands higher than the rim');
assert.deepStrictEqual(Array.from(G.normalsFromHeight(new Float32Array(4), 2, 2)), [128, 128, 255, 255, 128, 128, 255, 255, 128, 128, 255, 255, 128, 128, 255, 255]);
assert.deepStrictEqual(Array.from(G.encode(0, 0, 1)), [128, 128, 255, 255]);

// The job is sliced for the editor and refuses bad input.
const budget = G.sliceBudget;
G.sliceBudget = 64;
const steps = G.job(disc, 33, 33, {});
let slices = 0, step = steps.next();
while (!step.done) { slices++; step = steps.next(); }
G.sliceBudget = budget;
assert.ok(slices > 4, `a picture is worked on in slices (${slices})`);
assert.deepStrictEqual(Array.from(step.value), Array.from(G.make(disc, 33, 33, {})), 'slicing does not change the result');
assert.throws(() => G.make(new Uint8ClampedArray(4), 100000, 100000), /size|large/i);
assert.throws(() => G.make(new Uint8ClampedArray(4), 4, 4), /incomplete/i);

// Shading settings, keys and the manifest.
assert.deepStrictEqual(N.shade(null), { mode: 'made', strength: 1, shape: 'round' });
assert.deepStrictEqual(N.shade({ mode: 'bad', strength: 99, shape: 'flat' }), { mode: 'made', strength: 4, shape: 'flat' });
assert.deepStrictEqual(N.gridOf({ x: 96, y: 10, width: 48, height: 96 }), { w: 48, h: 96, x: 0, y: 10 });
const key = N.generatedKey('img/doodads/Rock.png', null, { x: 48, y: 0, width: 48, height: 96 });
assert.strictEqual(key, 'img/doodads/rock.png|round|1.00|48x96+0,0', 'every frame of a strip shares one key');
assert.strictEqual(N.generatedKey('../outside.png', null, {}), null);
assert.strictEqual(N.sourceOfKey(key), 'img/doodads/rock.png');
const cleaned = N.cleanGenerated({ [key]: 'img/doodads/_normals/abc_n.png', 'img/x.png|round|1.00|1x1+0,0': 'img/doodads/elsewhere_n.png',
    'img/y.png|round': 'img/doodads/_normals/../../y_n.png', 'img/z.png|round': 'img/doodads/_normals/z.png', bad: 'img/doodads/_normals/q_n.png' });
assert.deepStrictEqual(cleaned, { [key]: 'img/doodads/_normals/abc_n.png' }, 'only made maps in their own folder are kept');
N.setManifest({ normals: { 'img/doodads/fileonly.png': 'img/doodads/FileOnly_n.png' }, generated: cleaned });
assert.ok(N.mapsSource('img/doodads/Rock.png', {}), 'a picture with a made map stays off packed sheets');
assert.ok(!N.mapsSource('img/doodads/Rock.png', { shade: { mode: 'file' } }), 'From file ignores made maps');
assert.ok(!N.mapsSource('img/doodads/FileOnly.png', { shade: { mode: 'off' } }), 'Off never maps');
assert.ok(N.mapsSource('img/doodads/FileOnly.png', { shade: { mode: 'file' } }));
assert.deepStrictEqual(N.resolve('img/doodads/FileOnly.png', { mode: 'made' }, {}), { path: 'img/doodads/FileOnly_n.png', kind: 'file', key: null }, 'a hand-made file wins');
assert.strictEqual(N.resolve('img/doodads/Other.png', { mode: 'file' }, {}).path, null);
assert.strictEqual(N.resolve('img/doodads/Rock.png', { mode: 'off' }, {}).path, null);
const missing = N.resolve('img/doodads/Rock.png', { strength: 2 }, { width: 48, height: 96 });
assert.ok(missing.missing && missing.key.endsWith('|2.00|48x96+0,0'), 'a missing made map names its key');
assert.strictEqual(N.resolve('img/doodads/Rock.png', null, { width: 48, height: 96 }).path, 'img/doodads/_normals/abc_n.png');
assert.deepStrictEqual(N.manifestFromAssets({}).generated, cleaned, 'an index rewrite keeps made maps');
assert.deepStrictEqual(N.manifestFromAssets({}, {}), { version: 1, normals: {} }, 'no made maps, no extra field');
assert.deepStrictEqual(Object.keys(N.renameGenerated(cleaned, 'img/doodads/Rock.png', 'img/doodads/props/Boulder.png')),
    ['img/doodads/props/boulder.png|round|1.00|48x96+0,0'], 'Rename/Move carries the key to the new path');

// Deployment restores a made map only with the picture it shades.
const required = D.RequiredAssets.collect({ doodads: { 1: [{ bit: [3, 'img/doodads/Rock.png'] }] }, maps: {}, database: {},
    normalManifest: { normals: {}, generated: Object.assign({ 'img/doodads/gone.png|round|1.00|1x1+0,0': 'img/doodads/_normals/gone_n.png' }, cleaned) } });
assert.ok(required.includes('img/doodads/_normals/abc_n.png'));
assert.ok(!required.includes('img/doodads/_normals/gone_n.png'), 'a map for an unused picture is not shipped');

// The asset index and the file watcher ignore the folder of made maps.
assert.ok(D.AssetIndex.isIgnoredDirectory('_normals'));
assert.strictEqual(D.LiveReload.classify('img', 'doodads/_normals/abc_n.png'), null);

// Details → Shading and World → Normal Maps.
const shading = W.effectSections().find(section => section.title === 'Shading');
assert.ok(shading && ['shade.mode', 'shade.strength', 'shade.shape'].every(k => shading.fields.some(f => f.key === k)));
const item = { bit: [3, 'img/doodads/Rock.png'] };
assert.strictEqual(W.getDoodadProperty(item, 'shade.mode'), 'made', 'unset reads as Made for me');
W.applyDoodadProperty(item, 'shade.mode', 'off');
assert.deepStrictEqual(item.shade, { mode: 'off', strength: 1, shape: 'round' });
W.applyDoodadProperty(item, 'shade.strength', 9);
assert.strictEqual(item.shade.strength, 4, 'Strength is clamped');
W.applyDoodadProperty(item, 'shade.mode', 'made'); W.applyDoodadProperty(item, 'shade.strength', 1);
assert.ok(!('shade' in item), 'back at the defaults, nothing is saved');
const world = W.worldSections().find(section => section.title === 'Normal Maps');
assert.ok(world.fields.some(f => f.key === 'normalLight.characters' && f.type === 'select'));
assert.strictEqual(D.World.settings().normalLight.characters, 'file', 'characters keep using files unless asked');

(async () => {
    // The editor makes the missing map in slices, writes it under img/, records it, and the sprite uses it.
    N.setManifest({ normals: {} });
    fs.mkdirSync(path.join(projectRoot, 'img/doodads'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'img/doodads/Rock.png'), Buffer.from([1, 2, 3]));
    const loads = [];
    W.loadPixels = async source => { loads.push(source); return { width: 96, height: 96, data: rgba(96, 96, (x, y) => Math.hypot((x % 48) - 24, y - 48) < 20 ? [200, 200, 200, 255] : [0, 0, 0, 0]) }; };
    const loadBitmap = D.loadBitmap, requested = [];
    D.loadBitmap = function(p) { if (/_n\.png$/i.test(p)) requested.push(p); return loadBitmap.call(this, p); };
    const ss = new Spriteset_Map();
    SceneManager._scene = { _spriteset: ss };
    E.frames(ss, 2);
    assert.strictEqual(W.normalGenJobs.length + (W.normalGenBusy ? 1 : 0) >= 1, true, 'a lit doodad without a map queues one');
    await W.normalGenPromise;
    assert.strictEqual(loads.filter(p => /Rock\.png/.test(p)).length, 1, 'the picture is read once for all its frames');
    const rockKey = 'img/doodads/rock.png|round|1.00|48x96+0,0';
    const made = N.manifest.generated && N.manifest.generated[rockKey];
    assert.ok(made && made.startsWith('img/doodads/_normals/') && fs.existsSync(path.join(projectRoot, made)), 'the made map is written under img/');
    const onDisk = JSON.parse(fs.readFileSync(path.join(projectRoot, N.manifestPath), 'utf8'));
    assert.strictEqual(onDisk.generated[rockKey], made, 'the game manifest names it');
    assert.ok(!Object.keys(onDisk.generated).some(k => /off\.png|lamp\.png|fileonly\.png/.test(k)), 'Off and From file never make maps');
    assert.ok(W.normalGenFailed.size === 0 || ![...W.normalGenFailed].some(k => k === rockKey));
    E.frames(ss, 2);
    const rockSprite = ss._docsDoodadSprites.find(s => s._data.uid === 'rock');
    assert.ok(requested.includes(made), 'the sprite loads its made map');
    assert.ok(rockSprite._docsNormalFilter && rockSprite._docsNormalActive, 'the doodad is shaded by its shape');

    // Same key twice is made once; a key that failed is not retried every frame.
    assert.strictEqual(W.queueNormalGen({ key: rockKey, source: 'img/doodads/Rock.png' }), true);
    await W.normalGenPromise;
    assert.strictEqual(loads.length, 1, 'an existing file for the same picture and settings is reused, not remade');
    assert.strictEqual(W.queueNormalGen({ key: 'img/doodads/none.png|round|1.00|1x1+0,0', source: 'img/doodads/None.png' }), true);
    await W.normalGenPromise;
    assert.ok(W.normalGenFailed.has('img/doodads/none.png|round|1.00|1x1+0,0'));
    assert.strictEqual(W.queueNormalGen({ key: 'img/doodads/none.png|round|1.00|1x1+0,0', source: 'img/doodads/None.png' }), false, 'a failure is not retried');

    // An edited picture gets a new map, and the old file goes.
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(path.join(projectRoot, 'img/doodads/Rock.png'), later, later);
    W.normalGenChecked.clear();
    rockSprite._docsNormalPick = null;
    E.frames(ss, 1);
    await W.normalGenPromise;
    const remade = N.manifest.generated[rockKey];
    assert.ok(remade && remade !== made && fs.existsSync(path.join(projectRoot, remade)), 'the edited picture has a new map');
    assert.ok(!fs.existsSync(path.join(projectRoot, made)), 'the replaced map is removed');
    assert.strictEqual(loads.length, 2);

    // Shading Off takes the filter away; Normal Maps off makes nothing.
    rock.shade = { mode: 'off' };
    E.frames(ss, 1);
    assert.ok(!rockSprite._docsNormalActive, 'Shading Off removes the filter');
    delete rock.shade;
    D.World.settings().normalLight.enabled = false;
    assert.strictEqual(W.queueNormalGen({ key: 'img/doodads/rock.png|flat|1.00|48x96+0,0', source: 'img/doodads/Rock.png' }), false, 'nothing is made while Normal Maps are off');
    D.World.settings().normalLight.enabled = true;

    // Outside a playtest nothing is made.
    const isTest = D.Compat.isTest;
    D.Compat.isTest = () => false;
    assert.strictEqual(W.queueNormalGen({ key: 'img/doodads/rock.png|flat|2.00|48x96+0,0', source: 'img/doodads/Rock.png' }), false);
    D.Compat.isTest = isTest;
    D.loadBitmap = loadBitmap;

    console.log('Normal maps made for you: rounded/flat heights, frames, repeatable bytes, slices, keys, manifest, Details, deployment and the editor job passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
