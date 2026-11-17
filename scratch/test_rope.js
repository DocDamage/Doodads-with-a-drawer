'use strict';
// 9.3.2 Ropes and cables: the pure curve and sway, drawing on the stand-in engine (plain, textured, hung
// pictures and lights, looping seam, depth), and the editor tool, handles, Undo and Details.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-rope-')));
E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
const plain = E.doodad(4, 6, { uid: 'plain', bit: [1, 0], line: { x2: 144, y2: 24, sag: 30, width: 3, color: '#ff0000' } });
const textured = E.doodad(8, 6, { uid: 'textured', bit: [3, 'img/doodads/Rope.png'], frameW: 96, frameH: 8, depth: 'sorted',
    line: { x2: 96, y2: 0, sag: 20, hang: { path: 'img/doodads/Flag.png', count: 3, light: 'lantern' } } });
const ordinary = E.doodad(10, 10, { uid: 'ordinary', bit: [3, 'img/doodads/Tree.png'] });
$dataDocsDoodads[1] = [plain, textured, ordinary];
require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Rope, W = D.Workspace;

// ---- Pure rules ----
const base = R.points(0, 0, 100, 20, 30, 10);
assert.deepStrictEqual([base[0].x, base[0].y], [0, 0]);
assert.deepStrictEqual([base[10].x, base[10].y], [100, 20]);
assert.strictEqual(base[5].y, 10 + 30, 'the middle hangs by the sag');
const windy = { x: 0.8, strength: 0.8 };
for (const time of [0, 0.5, 3.2, 17]) {
    const swayed = R.swayed(base, windy, time, 12, 1);
    assert.deepStrictEqual([swayed[0].x, swayed[0].y, swayed[10].x, swayed[10].y], [0, 0, 100, 20], 'the ends never move');
    assert.ok(Math.abs(swayed[5].x - base[5].x) > Math.abs(swayed[1].x - base[1].x), 'the middle moves most');
}
assert.deepStrictEqual(R.swayed(base, { x: 0, strength: 0 }, 5, 1, 1).map(p => [p.x, p.y]), base.map(p => [p.x, p.y]), 'no wind is no sway');
assert.deepStrictEqual(R.swayed(base, windy, 5, 1, 0).map(p => [p.x, p.y]), base.map(p => [p.x, p.y]), 'Sway 0 holds still');
assert.ok(R.length(R.points(0, 0, 100, 0, 40, 32)) > R.length(R.points(0, 0, 100, 0, 10, 32)), 'more sag is a longer line');
assert.strictEqual(Math.round(R.length(R.points(0, 0, 100, 0, 0, 8))), 100);
const hung = R.hangAt(R.points(0, 0, 120, 0, 0, 12), 3);
assert.deepStrictEqual(hung.map(p => Math.round(p.x)), [30, 60, 90], 'hung things are evenly spaced and never on the ends');
assert.deepStrictEqual(R.hangAt(base, 0), []);
assert.strictEqual(R.lowest({ x2: 100, y2: 0, sag: 30 }), 30);
assert.strictEqual(R.lowest({ x2: 0, y2: 80, sag: 0 }), 80);
const clean = R.normalize({ x2: 99999, sag: -5, width: 100, color: 'red', sway: 9, hang: { path: 'img/../secret.png', count: 99, light: 5 } });
assert.deepStrictEqual(clean, { x2: 4096, y2: 0, sag: 0, width: 16, color: '#3b2a1a', sway: 2, hang: { path: '', count: 24, light: '' } });
assert.strictEqual(R.normalize(null), null);
assert.strictEqual(R.normalize({ hang: { path: 'audio/se/x.png' } }).hang.path, '', 'hung art comes from img/');
assert.strictEqual(R.segmentsFor({ x2: 16, y2: 0, sag: 0 }), 8);
assert.ok(R.segmentsFor({ x2: 2000, y2: 0, sag: 0 }) <= 64);

// ---- Drawing ----
D.Lighting.setMapSettings(1, { ambient: { darkness: 0.6, color: '#101830', switchId: 0 } });
D.World.settings().weather2d = { wind: { strength: 1, direction: 1, gusts: 0.5, fromWeather: false } };
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 3);
const sprite = uid => ss._docsDoodadSprites.find(s => s._data.uid === uid);
const plainSprite = sprite('plain'), texturedSprite = sprite('textured'), treeSprite = sprite('ordinary');
assert.ok(plainSprite._docsRope && plainSprite._docsRopeLine && plainSprite._docsRopeLine.visible, 'a plain rope draws a cord');
assert.strictEqual(plainSprite.texture, PIXI.Texture.EMPTY, 'the empty icon is not drawn');
assert.ok(texturedSprite._docsRopeMesh instanceof PIXI.SimpleRope, 'a picture becomes a textured rope');
assert.ok(texturedSprite._docsRopeMesh.texture && texturedSprite._docsRopeMesh.texture !== PIXI.Texture.EMPTY);
assert.strictEqual(texturedSprite.texture, PIXI.Texture.EMPTY, 'the picture is not also drawn as a doodad');
const meshPoints = texturedSprite._docsRopeMesh.points;
assert.strictEqual(meshPoints.length, R.segmentsFor(textured.line) + 1);
assert.deepStrictEqual([meshPoints[0].x, meshPoints[0].y], [0, 0], 'the rope starts at the doodad');
assert.deepStrictEqual([meshPoints[meshPoints.length - 1].x, meshPoints[meshPoints.length - 1].y], [96, 0], 'and ends where it was placed, in the wind too');
const middleBefore = meshPoints[Math.floor(meshPoints.length / 2)].x;
E.frames(ss, 20);
assert.notStrictEqual(meshPoints[Math.floor(meshPoints.length / 2)].x, middleBefore, 'the wind sways the middle');
assert.ok(!treeSprite._docsRope, 'ordinary doodads are untouched');
const flags = texturedSprite._docsRopeHung.filter(s => s.visible);
assert.strictEqual(flags.length, 3, 'three things hang along it');
assert.ok(texturedSprite._docsRopeLights.length === 3 && texturedSprite._docsRopeLights.every(l => l.light.preset === 'lantern'));
const lit = (ss._docsLightInfo && ss._docsLightInfo.lights || []).filter(l => l.doodad && l.doodad.ropeOf === textured);
assert.strictEqual(lit.length, 3, 'hung lamps light the map');
assert.ok(lit.every(l => Math.abs(l.mapY - (textured.y + texturedSprite._docsRopeHung[0].y)) < 40), 'lamps sit on the rope');
const sameObjects = texturedSprite._docsRopeLights.slice();
E.frames(ss, 1);
assert.ok(texturedSprite._docsRopeLights.every((l, i) => l === sameObjects[i]), 'the same light objects every frame, so they fade');
assert.ok(Math.abs(texturedSprite._docsSortY - (texturedSprite.y + Math.max(...meshPoints.map(p => p.y)))) < 1e-9, 'Sorted ropes sort by their lower end');
textured.scaleX = 3; textured.rotation = 45;
E.frames(ss, 1);
assert.strictEqual(texturedSprite.scale.x, 1); assert.strictEqual(texturedSprite.rotation, 0);
assert.deepStrictEqual([meshPoints[meshPoints.length - 1].x, meshPoints[meshPoints.length - 1].y], [96, 0], 'size and turn do not move the far end');
textured.line.hang = { path: '', count: 0, light: '' };
E.frames(ss, 1);
assert.strictEqual(texturedSprite._docsRopeLights, null);
assert.ok(texturedSprite._docsRopeHung.every(s => !s.visible));
delete plain.line;
E.frames(ss, 1);
assert.strictEqual(plainSprite._docsRope, null, 'taking the line away removes the rope');

// A rope across the seam of a looping map stays in one piece: it is drawn from its own first end.
$dataMap.scrollType = 2;
const seam = E.doodad(19, 6, { uid: 'seam', bit: [1, 0], line: { x2: 120, y2: 0, sag: 10 } });
$dataDocsDoodads[1].push(seam);
const loopSet = new Spriteset_Map();
SceneManager._scene = { _spriteset: loopSet };
$gameMap._displayX = 15;
E.frames(loopSet, 2);
const seamSprite = loopSet._docsDoodadSprites.find(s => s._data.uid === 'seam');
const seamScreen = D.mapToScreen(seam.x, seam.y);
assert.strictEqual(seamSprite.x, seamScreen.x, 'the first end is where the map puts it');
assert.ok(seamSprite._docsRopeLine, 'the rope is drawn');
const cord = R.points(0, 0, 120, 0, 10, R.segmentsFor(seam.line));
assert.ok(cord.every((p, i) => !i || Math.abs(p.x - cord[i - 1].x) < 48), 'no point jumps a map width at the seam');
$dataMap.scrollType = 0; $gameMap._displayX = 0;

// ---- Editor ----
assert.deepStrictEqual(W.makeRopeDoodad({ x: 10, y: 20 }, { x: 110, y: 20 }, null).bit, [1, 0], 'no picture: a plain cord with the empty icon');
const pictureRope = W.makeRopeDoodad({ x: 10, y: 20 }, { x: 110, y: 60 }, { path: 'img/doodads/Rope.png', width: 64, height: 6 });
assert.deepStrictEqual(pictureRope.bit, [3, 'img/doodads/Rope.png']);
assert.deepStrictEqual([pictureRope.line.x2, pictureRope.line.y2, pictureRope.depth], [100, 40, 'above']);
assert.ok(pictureRope.line.sag > 0, 'a new rope sags a little');

W.mounted = true;
W.showToast = () => {}; W.refreshInspector = () => {};
W.clientToMapCoords = (x, y) => ({ x, y, tileX: Math.floor(x / 48), tileY: Math.floor(y / 48) });
const list = $dataDocsDoodads[1], countBefore = list.length;
W.selectedAsset = null;
W.startRopeTool();
assert.strictEqual(W.placementTool, 'rope');
const hook = W.toolHooks.rope;
assert.strictEqual(hook.down.call(W, { clientX: 100, clientY: 200 }), true);
hook.move.call(W, { clientX: 300, clientY: 230 }, true);
hook.up.call(W, {});
assert.strictEqual(list.length, countBefore + 1, 'press, drag and release makes a rope');
const made = list[list.length - 1];
assert.deepStrictEqual([made.x, made.y, made.line.x2, made.line.y2], [100, 200, 200, 30]);
assert.strictEqual(W.selectedDoodad, made, 'the new rope is selected');
hook.down.call(W, { clientX: 400, clientY: 400 }); hook.up.call(W, {});
assert.strictEqual(list.length, countBefore + 1, 'a click without a drag makes nothing');
const shifted = W.ropePoint({ clientX: 70, clientY: 70, shiftKey: true });
assert.deepStrictEqual([shifted.x, shifted.y], [72, 72], 'Shift snaps to the middle of a tile');

// Handles: the end, the start and the sag, each one Undo step.
hook.down.call(W, { clientX: 300, clientY: 230 });
hook.move.call(W, { clientX: 340, clientY: 260 }, true);
hook.up.call(W, {});
assert.deepStrictEqual([made.line.x2, made.line.y2], [240, 60], 'dragging the end moves only the end');
D.Undo.undo();
assert.deepStrictEqual([made.line.x2, made.line.y2], [200, 30], 'Undo puts the end back');
const sagAt = W.ropeHandles(made).sag;
hook.down.call(W, { clientX: sagAt.x, clientY: sagAt.y });
hook.move.call(W, { clientX: sagAt.x, clientY: sagAt.y + 40 }, true);
hook.up.call(W, {});
assert.strictEqual(made.line.sag, Math.round(sagAt.y + 40 - (made.y + made.line.y2 / 2)), 'dragging the middle sets the sag');
hook.down.call(W, { clientX: 100, clientY: 200 });
hook.move.call(W, { clientX: 80, clientY: 190 }, true);
hook.up.call(W, {});
assert.deepStrictEqual([made.x, made.y, made.x + made.line.x2, made.y + made.line.y2], [80, 190, 300, 230], 'moving the start keeps the end in place');
D.Undo.undo(); D.Undo.undo();
D.Undo.undo();
assert.ok(!list.includes(made), 'Undo removes the placed rope');
D.Undo.redo();
assert.ok(list.includes(made));

// Details → Rope only for ropes.
W.selectedDoodad = made; W.selectedDoodads = [made];
const ropeSection = W.effectSections().find(s => s.title === 'Rope');
assert.ok(ropeSection && ropeSection.fields.some(f => f.key === 'line.hang.light'));
assert.strictEqual(W.getDoodadProperty(made, 'line.hang.count'), 0);
W.applyDoodadProperty(made, 'line.hang.count', 5);
W.applyDoodadProperty(made, 'line.hang.light', 'torch');
W.applyDoodadProperty(made, 'line.sag', 999);
assert.deepStrictEqual([made.line.hang.count, made.line.hang.light, made.line.sag], [5, 'torch', 512]);
W.selectedDoodad = ordinary; W.selectedDoodads = [ordinary];
assert.ok(!W.effectSections().some(s => s.title === 'Rope'), 'no Rope section for other doodads');
W.applyDoodadProperty(ordinary, 'line.sag', 10);
assert.ok(!ordinary.line, 'a rope setting never turns a picture into a rope');
assert.strictEqual(W.getDoodadProperty(ordinary, 'opacity'), W.getDoodadProperty(ordinary, 'opacity'));

// The Path card gets the button.
const pop = { children: [], appendChild(child) { this.children.push(child); } };
const getElementById = document.getElementById, createElement = document.createElement;
document.getElementById = id => id === 'dd-path-popover' ? pop : null;
document.createElement = tag => ({ tagName: tag.toUpperCase(), style: {} });
W.addRopeButton();
document.getElementById = getElementById; document.createElement = createElement;
assert.ok(pop.children.some(child => child.id === 'dd-rope-btn' && /Rope/.test(child.textContent)), 'the Path card offers a rope');
W.mounted = false;

console.log('Ropes: curve, sway, hung spacing, plain/textured drawing, hung lights, seam, depth, tool, handles, Undo and Details passed.');

// Hung pictures ship with the game and follow Rename/Move.
const rendered = DocsDoodads.RequiredAssets.collect({ doodads: { 1: [{ bit: [1, 0], line: { hang: { path: 'img/doodads/Flag.png', count: 2 } } }] }, maps: {}, database: {} });
assert.ok(rendered.includes('img/doodads/Flag.png'), 'deployment keeps hung pictures');
const refs = [];
DocsDoodads.Usage.visitSources({ doodads: { 1: [{ bit: [1, 0], line: { hang: { path: 'img/doodads/Flag.png' } } }] } }, ref => refs.push(ref));
assert.ok(refs.some(ref => ref.key === DocsDoodads.Usage.keyOf('img/doodads/Flag.png') && /hung on a rope/.test(ref.label)), 'Rename/Move finds hung pictures');
console.log('Ropes: hung pictures in deployment and usage passed.');
