'use strict';
// 8.3.4 A ground brush: brush weights, dabs per channel and erasing, undo rectangles, the tool's stroke as one
// undo step restoring the same pixels, saving (a map with nothing painted writes no file), deployment and the
// map mesh (under doodads, a copy across a looping seam).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-ground-'));
process.chdir(projectRoot);
E.install();
E.setupWorld({ width: 8, height: 6, px: 1, py: 1 });
require('../Docs-Doodads.js');
const D = DocsDoodads, G = D.Ground, W = D.Workspace;

// ---- Pure rules ----
assert.strictEqual(G.weight(0, 10, 0.5), 1, 'full in the middle');
assert.strictEqual(G.weight(10, 10, 0.5), 0, 'nothing at the edge');
assert.strictEqual(G.weight(4, 10, 0.5), 1, 'full inside the hard part');
const soft = [5, 6, 7, 8, 9].map(d => G.weight(d, 10, 0.5));
assert.ok(soft.every((v, i) => i === 0 || v < soft[i - 1]) && soft[0] === 1 && soft[4] > 0, 'eases off toward the edge');
assert.strictEqual(G.weight(9.9, 10, 0), 1, 'softness 0 is a hard edge');
assert.strictEqual(G.maskPath(7), 'img/doodads/ground/Map007_ground.png');
assert.deepStrictEqual(G.maskSize(8, 6, 48, 48), { w: 96, h: 72 }, 'a quarter of the map\'s pixels');
assert.strictEqual(G.settings(null), null);
assert.deepStrictEqual(G.settings({ ground: { textures: ['img/a.png', '../x.png', 'img/b.webp'], mask: 'img/doodads/ground/Map001_ground.png', scale: 99 } }),
    { textures: ['img/a.png', '', 'img/b.webp'], mask: 'img/doodads/ground/Map001_ground.png', scale: 8 });

const mask = G.blank(20, 20);
assert.ok(G.isEmpty(mask) && mask[3] === 255);
const rect = G.dab(mask, 20, 20, 10, 10, 4, { channel: 1, strength: 1, softness: 0 });
assert.deepStrictEqual(rect, { x: 6, y: 6, w: 9, h: 9 });
const px = (x, y) => Array.from(mask.slice((y * 20 + x) * 4, (y * 20 + x) * 4 + 4));
assert.deepStrictEqual(px(10, 10), [0, 255, 0, 255], 'the chosen texture fills the middle');
assert.deepStrictEqual(px(0, 0), [0, 0, 0, 255], 'outside the brush is untouched');
G.dab(mask, 20, 20, 10, 10, 2, { channel: 0, strength: 1, softness: 0 });
assert.deepStrictEqual(px(10, 10), [255, 0, 0, 255], 'painting another texture replaces it');
G.dab(mask, 20, 20, 10, 10, 2, { erase: true, strength: 0.5, softness: 0 });
assert.deepStrictEqual(px(10, 10), [128, 0, 0, 255], 'erasing fades every channel');
assert.strictEqual(G.dab(mask, 20, 20, 50, 50, 3, {}), null, 'off the mask changes nothing');
const piece = G.copyRect(mask, 20, rect), copy = G.blank(20, 20);
G.putRect(copy, 20, rect, piece);
assert.deepStrictEqual(Array.from(G.copyRect(copy, 20, rect)), Array.from(piece), 'a rectangle round-trips');
assert.deepStrictEqual(G.union({ x: 0, y: 0, w: 2, h: 2 }, { x: 5, y: 1, w: 1, h: 4 }), { x: 0, y: 0, w: 6, h: 5 });
assert.ok(!/texture\(|#version 300|\bin vec|\bout vec/.test(G.fragment + G.vertex), 'shaders stay GLSL ES 1.00');
assert.ok(/discard/.test(G.fragment), 'nothing painted shows the tiles');

(async () => {
    // ---- The tool ----
    W.showToast = () => {};
    W.mounted = true;
    W.currentMapId = () => 1;
    W.clientToMapCoords = (x, y) => ({ x, y, tileX: Math.floor(x / 48), tileY: Math.floor(y / 48) });
    W.setMapSetting = (key, value) => D.Lighting.setMapSettings(1, { [key]: value });
    const empty = await W.ensureGroundMask(1);
    assert.ok(G.isEmpty(empty.data) && empty.w === 96 && empty.h === 72, 'a map starts unpainted');
    const hook = W.toolHooks.ground;
    assert.strictEqual(hook.down.call(W, { clientX: 100, clientY: 100, button: 0 }), false, 'no texture yet: nothing is painted');
    W.setGroundTexture(0, 'img/doodads/Dirt.png');
    W.setGroundTexture(2, 'img/doodads/Stone.png');
    assert.deepStrictEqual(G.settings(D.Lighting.mapSettings(1)).textures, ['img/doodads/Dirt.png', '', 'img/doodads/Stone.png']);
    W.groundBrush = { channel: 0, radius: 40, strength: 1, softness: 0.5 };
    const before = empty.data.slice();
    const steps = D.Undo.undoStack.length;
    assert.strictEqual(hook.down.call(W, { clientX: 100, clientY: 100, button: 0 }), true);
    hook.move.call(W, { clientX: 140, clientY: 110 }, true);
    hook.move.call(W, { clientX: 180, clientY: 120 }, true);
    hook.up.call(W, {});
    assert.strictEqual(D.Undo.undoStack.length, steps + 1, 'a stroke is one undo step');
    const step = D.Undo.undoStack[D.Undo.undoStack.length - 1];
    assert.ok(step.rect.w < empty.w && step.rect.h < empty.h, 'it keeps only the rectangle it changed');
    const painted = empty.data.slice();
    assert.ok(!G.isEmpty(painted));
    D.Undo.undo();
    assert.deepStrictEqual(Array.from(empty.data), Array.from(before), 'Undo restores the same pixels');
    D.Undo.redo();
    assert.deepStrictEqual(Array.from(empty.data), Array.from(painted), 'Redo too');
    hook.down.call(W, { clientX: 140, clientY: 110, button: 2 });
    hook.up.call(W, {});
    assert.ok(empty.data[((110 / 4 | 0) * 96 + (140 / 4 | 0)) * 4] < painted[((110 / 4 | 0) * 96 + (140 / 4 | 0)) * 4], 'right-drag erases');

    // ---- Saving ----
    const prepared = W.prepareGroundSave();
    assert.deepStrictEqual(prepared, [1]);
    assert.strictEqual(G.settings(D.Lighting.mapSettings(1)).mask, 'img/doodads/ground/Map001_ground.png', 'the map names its mask before its data is written');
    W.writeGroundMasks(prepared);
    const file = path.join(projectRoot, 'img/doodads/ground/Map001_ground.png');
    assert.ok(fs.existsSync(file) && fs.readFileSync(file).slice(1, 4).toString() === 'PNG', 'the mask is written as a PNG');
    assert.strictEqual(W.prepareGroundSave(), null, 'nothing changed, nothing to write');
    const required = D.RequiredAssets.collect({ doodads: { mapSettings: D.Lighting.mapSettings(1) ? { 1: D.Lighting.mapSettings(1) } : {} }, maps: {}, database: {} });
    assert.ok(['img/doodads/ground/Map001_ground.png', 'img/doodads/Dirt.png', 'img/doodads/Stone.png'].every(p => required.includes(p)), 'the mask and its textures are deployed');
    const refs = [];
    D.Usage.visitSources({ doodads: { mapSettings: { 1: D.Lighting.mapSettings(1) } } }, ref => refs.push(ref));
    assert.ok(refs.some(r => /ground texture 1/.test(r.label)), 'Rename/Move finds ground textures');
    // Erasing everything removes the file and the name.
    const all = W.groundMasks()[1];
    all.data.set(G.blank(all.w, all.h)); all.dirty = true;
    W.writeGroundMasks(W.prepareGroundSave());
    assert.ok(!fs.existsSync(file), 'a map with nothing painted has no file');
    assert.strictEqual(G.settings(D.Lighting.mapSettings(1)).mask, '');
    D.Lighting.setMapSettings(2, {});
    W.groundMasks()[2] = { w: 4, h: 4, data: G.blank(4, 4), dirty: true };
    W.writeGroundMasks(W.prepareGroundSave());
    assert.ok(!fs.existsSync(path.join(projectRoot, 'img/doodads/ground/Map002_ground.png')), 'an unpainted map writes no file');
    assert.ok(!(D.Lighting.mapSettings(2) || {}).ground, 'nor a ground setting');

    // ---- On the map ----
    all.data.set(painted); all.dirty = true;
    W.prepareGroundSave();
    G.live[1] = { texture: PIXI.Texture.WHITE };
    const ss = new Spriteset_Map();
    E.frames(ss, 1);
    const meshes = (ss._docsGroundMeshes || []).filter(m => m.visible !== false);
    assert.ok(ss._docsGroundMeshes && ss._docsGroundMeshes.length === 1, 'one mesh on a plain map');
    assert.strictEqual(ss._docsGroundMeshes[0].z, 0.4, 'under every doodad and character');
    assert.ok(ss._tilemap.children.includes(ss._docsGroundMeshes[0]), 'in the tilemap');
    assert.strictEqual(ss._docsGroundMeshes[0].shader.uniforms.uMask, PIXI.Texture.WHITE, 'the editor\'s live mask is drawn');
    $dataMap.scrollType = 2;
    E.frames(ss, 1);
    assert.strictEqual(ss._docsGroundMeshes.length, 3, 'a copy each side of a looping seam');
    $dataMap.scrollType = 0;
    D.Lighting.setMapSettings(1, { ground: undefined });
    E.frames(ss, 1);
    assert.ok(ss._docsGroundMeshes.every(m => !m.visible), 'no ground setting, nothing drawn');
    assert.ok(W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-ground-btn'));
    console.log('Ground brush: weights, dabs, erase, rectangles, one-step strokes, saving, no file when empty, deployment and the map mesh passed.');
    void meshes;
})().catch(error => { console.error(error); process.exitCode = 1; });
