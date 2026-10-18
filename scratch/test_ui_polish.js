// scratch/test_ui_polish.js
// Regressions for smaller issues found in manual MZ playtesting.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing UI Polish Fixes ===");

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null, classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [] };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: (id) => el(id)
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};

// 1. Selected doodads get an on-map outline matching their visible image.
const warrior = Object.assign(DocsDoodads.standardStruct(), { x: 360, y: 432, frameW: 224, frameH: 228, posMode: 1 });
const small = Object.assign(DocsDoodads.standardStruct(), { x: 100, y: 100, frameW: 48, frameH: 48, scaleX: 2, scaleY: 2, posMode: 1 });
$dataDocsDoodads[1] = [warrior, small];
ws.selectDoodads([warrior, small]);
assert.deepStrictEqual(ws.selectionScreenRects(), [
    { x: 248, y: 204, w: 224, h: 228 },
    { x: 52, y: 4, w: 96, h: 96 }
], "selection outlines cover each selected doodad's visible image");
$gameMap.displayX = () => 1; // scrolled one tile right
assert.strictEqual(ws.selectionScreenRects()[0].x, 200, "outlines follow map scrolling");
$gameMap.displayX = () => 0;

// 2. Audio assets show audio controls, not image-only controls.
ws.selectedDoodad = null; ws.selectedDoodads = []; ws.selectedEvent = null;
ws.selectedAsset = { id: 'audio/se/cursor1.ogg', path: 'audio/se/Cursor1.ogg', fileName: 'Cursor1.ogg', category: 'Audio', type: 'audio',
    width: 0, height: 0, tags: [], autoTags: ['se', 'cursor1'], placement: { defaultMode: 'doodad' }, collision: { preset: 'none' } };
ws.refreshInspector();
const html = el('dd-inspector-content').innerHTML;
assert.ok(/Preview/.test(html) && /Stop/.test(html), "audio inspector offers Preview and Stop");
assert.ok(/SE/.test(html), "audio inspector shows the audio channel");
for (const imageOnly of ['Dimensions', 'Collision Preset', 'Open Slicer', 'Place on Map Center', 'Placement Mode']) {
    assert.ok(!html.includes(imageOnly), `audio inspector hides "${imageOnly}"`);
}

// 3. No `inset` shorthand: MZ's bundled Chromium predates it, so such overlays collapse to 0x0.
const source = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
assert.ok(!/\binset\s*:/.test(source), "use top/right/bottom/left instead of inset for full-screen overlays");

// 4. Import results say what was skipped or why nothing was imported.
const Import = DocsDoodads.Import;
assert.strictEqual(Import.describeResult({ ok: true, imported: [1, 2], duplicates: [1], skipped: [{ destination: 'img/doodads/a.png' }], errors: [] }),
    'Imported 2 file(s), 1 identical file(s) skipped, 1 skipped because the name already exists.');
assert.strictEqual(Import.describeResult({ ok: false, imported: [], duplicates: [], skipped: [],
    errors: [{ path: 'C:/src/Tree.png', destination: 'C:/proj/img/doodads/Tree.png', message: 'Destination already exists.' }] }),
    'Import cancelled: Tree.png already exists. Nothing was imported.');
assert.strictEqual(Import.describeResult({ ok: false, cancelled: true, rolledBack: true, imported: [], duplicates: [], skipped: [], errors: [] }),
    'Import cancelled; copied files were rolled back.');

// 5. Folders inside a dropped folder are kept in img/doodads; engine folders stay flat.
const sandbox = path.join(__dirname, 'ui_polish_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
process.on('exit', () => fs.rmSync(sandbox, { recursive: true, force: true }));
const drop = path.join(sandbox, 'drop', 'props');
fs.mkdirSync(path.join(drop, 'trees'), { recursive: true });
fs.mkdirSync(path.join(sandbox, 'project'), { recursive: true });
fs.writeFileSync(path.join(drop, 'Rock.png'), 'rock');
fs.writeFileSync(path.join(drop, 'trees', 'Oak.png'), 'oak');
fs.writeFileSync(path.join(drop, 'trees', 'Wind.ogg'), 'wind');
const plan = Import.planBatch([drop], { projectRoot: path.join(sandbox, 'project'), destination: 'auto' });
const destinations = plan.operations.map(op => op.relativeDestination).sort();
// The dropped folder is the container; folders inside it are kept.
assert.deepStrictEqual(destinations, ['audio/se/Wind.ogg', 'img/doodads/Rock.png', 'img/doodads/trees/Oak.png']);

// 6. The status bar asset count follows the index (e.g. after an import).
DocsDoodads.AssetIndex.list = new Array(1083);
ws.updateIndexStatus();
assert.strictEqual(el('dd-status-right').textContent, 'Indexed 1083 assets');
ws.updateIndexStatus(2);
assert.strictEqual(el('dd-status-right').textContent, 'Indexed 1083 assets | 2 stale removed');

// 7. Copies of grouped doodads stay grouped, in a new group of their own.
const g1 = Object.assign(DocsDoodads.standardStruct(), { x: 0, y: 0, groupId: 'grp_a' });
const g2 = Object.assign(DocsDoodads.standardStruct(), { x: 10, y: 0, groupId: 'grp_a' });
const loose = Object.assign(DocsDoodads.standardStruct(), { x: 20, y: 0 });
$dataDocsDoodads[1] = [g1, g2, loose];
ws.selectDoodads([g1, g2, loose]);
ws.copySelected();
ws.pasteCopied();
const pasted = $dataDocsDoodads[1].slice(3);
assert.strictEqual(pasted.length, 3);
assert.ok(pasted[0].groupId && pasted[0].groupId === pasted[1].groupId, "pasted group members share a group");
assert.notStrictEqual(pasted[0].groupId, 'grp_a', "the pasted group is independent of the original");
assert.strictEqual(pasted[2].groupId, undefined, "ungrouped doodads stay ungrouped");
ws.selectDoodads([g1, g2]);
ws.duplicateSelectedDoodad();
const duplicated = $dataDocsDoodads[1].slice(6);
assert.ok(duplicated[0].groupId && duplicated[0].groupId === duplicated[1].groupId && duplicated[0].groupId !== 'grp_a',
    "duplicated groups stay grouped too");

// 8. Generated movement routes include the 505 lines the MZ editor uses to display route steps.
const ev = DocsDoodads.Events.createEventObject(1, 0, 0, { list: [
    { code: 205, indent: 0, parameters: [0, { list: [{ code: 17 }, { code: 18 }, { code: 0 }], repeat: false, skippable: false, wait: true }] },
    { code: 0, indent: 0, parameters: [] }
] });
assert.deepStrictEqual(ev.pages[0].list.map(c => c.code), [205, 505, 505, 0]);
assert.deepStrictEqual(ev.pages[0].list[1], { code: 505, indent: 0, parameters: [{ code: 17, indent: null }] });
assert.deepStrictEqual(ev.pages[0].list[0].parameters[1].list, [{ code: 17, indent: null }, { code: 18, indent: null }, { code: 0 }]);

// 9. The placement grid is drawn in map space, so its lines sit on tile edges at any scroll position.
$gameMap.displayX = () => 0.5; $gameMap.displayY = () => 0.25;
const grid = ws.placementGridLines(200, 100);
assert.deepStrictEqual(grid.xs, [24, 72, 120, 168], "vertical lines follow the horizontal scroll");
assert.deepStrictEqual(grid.ys, [36, 84], "horizontal lines follow the vertical scroll");
$gameMap.displayX = () => 0; $gameMap.displayY = () => 0;
assert.deepStrictEqual(ws.placementGridLines(100, 50).xs, [0, 48, 96]);

// Searching the map panel: every word must appear, in any order or case; nothing searched matches all.
{
    const S = DocsDoodads.SettingsSearch;
    const section = '3D View (this map)  Fog starts (tiles) Fog colour  Snow settles (whitens the ground)';
    assert.strictEqual(S.matches(section, ''), true);
    assert.strictEqual(S.matches(section, '   '), true);
    assert.strictEqual(S.matches(section, 'snow'), true);
    assert.strictEqual(S.matches(section, 'FOG colour'), true);
    assert.strictEqual(S.matches(section, 'colour fog'), true, 'any order');
    assert.strictEqual(S.matches(section, 'whiten'), true, 'part of a word');
    assert.strictEqual(S.matches(section, 'fog shadow'), false, 'every word must be there');
}

console.log("✓ Selection outlines, audio inspector, overlays, import messages and folders, status count, grouped copies, and route display lines verified.");
