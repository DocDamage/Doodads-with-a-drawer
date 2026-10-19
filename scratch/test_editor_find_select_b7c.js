// scratch/test_editor_find_select_b7c.js
// Phase B7c (§12.2 of docs/CREATOR_IMPROVEMENTS_PLAN.md): finding doodads with bulk edit (12.2.1), the map
// outliner with hide, lock, pick and solo (12.2.2), a box that picks what it touches, a lasso and picking
// inside a region (12.2.3), and snapping to the grid, spacing by pixels and nudging by a tile where the
// terrain lets them stand (12.2.4).
const assert = require('assert');
const path = require('path');

console.log('=== Testing Find, Outliner, Picking and Placing (B7c) ===');

const byId = {};
function element(tag, id) {
    const el = { tagName: String(tag).toUpperCase(), id: id || '', style: {}, className: '', textContent: '', value: '', children: [], parentNode: null,
        appendChild(c) { c.parentNode = this; this.children.push(c); return c; }, removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; },
        addEventListener() {}, setAttribute() {}, getAttribute: () => null, querySelectorAll: () => [], click() { if (this.onclick) return this.onclick(); } };
    let html = '';
    Object.defineProperty(el, 'innerHTML', { get: () => html, set(v) {
        html = String(v);
        el.children = [];
        for (const m of html.matchAll(/id="([^"]+)"/g)) {
            const made = element('div', m[1]);
            const value = (html.slice(m.index).match(/^id="[^"]+"[^>]*?value="([^"]*)"/) || [])[1];
            if (value !== undefined) made.value = value;
            byId[m[1]] = made;
        }
    } });
    return el;
}
global.window = global;
global.window.addEventListener = () => {};
const body = element('body');
global.document = { body, createElement: t => element(t), getElementById: id => byId[id] || null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} };
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: o => o === 'test' };
global.PluginManager = { parameters: () => ({}) };
const regions = { '3,4': 7, '4,4': 7 };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => 40, height: () => 30,
    isLoopHorizontal: () => false, isLoopVertical: () => false, events: () => [], eventsXy: () => [], regionId: (x, y) => regions[x + ',' + y] || 0,
    adjustX: x => x, adjustY: y => y };

require(path.join(__dirname, '..', 'Docs-Doodads.js'));
const D = DocsDoodads, ws = D.Workspace;
const toasts = [];
ws.showToast = m => toasts.push(m);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.placeReadouts = () => {};
ws.mounted = true;
const doodad = (x, y, extra = {}) => Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/Tree.png'], frameW: 48, frameH: 96, x: x * 48 + 24, y: y * 48 + 48, posMode: 1 }, extra);
const oak = doodad(3, 4, { name: 'Oak', light: { enabled: true }, layer: 'trees' });
const rock = doodad(4, 4, { bit: [3, 'img/doodads/Rock.png'], collision: { preset: 'full' }, locked: true });
const lamp = doodad(10, 2, { bit: [3, 'img/doodads/Lamp.png'], sound: { file: 'bgs/Fire' }, editorHidden: true });
const far = doodad(30, 20, { name: 'Oak' });
const other = doodad(1, 1, { name: 'Ghost Oak' });
$dataDocsDoodads = { 1: [oak, rock, lamp, far], 2: [other], mapSettings: { 1: { layers: [{ id: 'trees', name: 'Forest' }] } } };
D.AssetIndex.data = { assets: { 'img/doodads/tree.png': { tags: ['forest', 'green'] }, 'img/doodads/rock.png': { tags: ['stone'] } } };

// 1. The search language.
const F = D.FindDoodads;
const ctx = ws.findContext();
const find = q => $dataDocsDoodads[1].filter(d => F.matches(d, F.parse(q), ctx));
assert.deepStrictEqual(find('tree'), [oak, far], 'a word in the picture');
assert.deepStrictEqual(find('oak'), [oak, far], 'or the Name');
assert.deepStrictEqual(find('tag:stone'), [rock]);
assert.deepStrictEqual(find('forest -name:oak'), [], 'a tag word, then leaving out by name');
assert.deepStrictEqual(find('layer:forest'), [oak], "a layer by its name");
assert.deepStrictEqual(find('has:light'), [oak]);
assert.deepStrictEqual(find('has:sound is:hidden'), [lamp]);
assert.deepStrictEqual(find('has:collision is:locked'), [rock]);
assert.deepStrictEqual(find('-is:hidden -is:locked tree'), [oak, far]);
console.log('✓ Search: words, tags, names, layers, has: and is:, leaving out.');

// 2. The Find card: this map or every map, Pick All, hide and lock all with one undo step.
ws.showFind('oak');
assert.strictEqual(ws._findResults.length, 2, 'two on this map');
assert.ok(byId['dd-find-list'].children.length === 2 && byId['dd-find-list'].children[0].children[0].textContent.startsWith('Oak'));
byId['dd-find-scope'].value = 'all';
byId['dd-find-scope'].onchange();
assert.strictEqual(ws._findResults.length, 3, 'and one on map 2');
assert.ok(ws._findResults[2].label.includes('(map 2)'));
byId['dd-find-pick'].onclick();
assert.deepStrictEqual(ws.selectionItems(), [oak, far], 'Pick All takes this map\'s results');
byId['dd-find-hide'].onclick();
assert.ok(oak.editorHidden && far.editorHidden && !other.editorHidden, 'Hide: this map\'s results only');
D.Undo.undo();
assert.ok(!oak.editorHidden && !far.editorHidden, 'one undo step');
byId['dd-find-lock'].onclick();
assert.ok(oak.locked && far.locked);
byId['dd-find-unlock'].onclick();
assert.ok(!oak.locked && !far.locked);
ws.closeFind();
console.log('✓ Find card: scope, Pick All, Hide, Lock, one undo step.');

// 3. The outliner: layers with counts, hide and lock per doodad, solo a layer.
ws._outlinerOpenLayers = { main: true, trees: true };
ws.showOutliner();
const rows = byId['dd-ol-list'].children.filter(c => c.className.startsWith('dd-ol-row'));
assert.strictEqual(rows.length, 4, 'every doodad of this map, by layer');
ws.outlinerToggle(rock, 'locked');
assert.ok(!rock.locked, 'unlocked from its row');
ws.outlinerToggle(oak, 'editorHidden');
assert.ok(oak.editorHidden);
ws.outlinerToggle(oak, 'editorHidden');
const settings = D.Lighting.mapSettings(1);
assert.strictEqual(ws.soloLayer('trees'), 'trees');
assert.strictEqual(D.Layers.visibleInEditor(oak, settings), true, 'the soloed layer shows');
assert.strictEqual(D.Layers.visibleInEditor(far, settings), false, 'the others don\'t');
assert.strictEqual(ws.soloLayer('trees'), null, 'again: all layers');
assert.strictEqual(D.Layers.visibleInEditor(far, settings), true);
ws.soloLayer('trees');
ws.closeOutliner();
assert.strictEqual(D.Layers.solo, null, 'closing the outliner ends the solo');
console.log('✓ Outliner: by layer, hide, lock, solo.');

// 4. Picking: in a region, a touching box, a lasso.
ws.clientToCanvas = (x, y) => ({ x, y });
assert.strictEqual(ws.selectInRegion(7), 2, 'the oak and the rock stand in region 7');
assert.deepStrictEqual(ws.selectionItems(), [oak, rock]);
// The oak is drawn from (144, 144) to (192, 240); a box over its top touches it, its foot is outside.
assert.deepStrictEqual(ws.doodadsInClientBox({ x: 140, y: 150 }, { x: 190, y: 200 }), [], 'a plain box wants the foot inside');
assert.deepStrictEqual(ws.doodadsTouchingClientBox({ x: 140, y: 150 }, { x: 190, y: 200 }), [oak], 'Ctrl: touching is enough');
const lasso = [{ x: 140, y: 230 }, { x: 250, y: 230 }, { x: 250, y: 250 }, { x: 140, y: 250 }];
assert.deepStrictEqual(ws.doodadsInClientLasso(lasso), [oak, rock], 'the lasso around both feet');
assert.deepStrictEqual(ws.doodadsInClientLasso(lasso.slice(0, 2)), [], 'a line is no lasso');
console.log('✓ Picking: region, touching box, lasso.');

// 5. Placing: snap to the grid, space by pixels, nudge by a tile where the terrain allows.
oak.x += 7; oak.y += 5; rock.locked = false;
ws.selectDoodads([oak, rock]);
assert.strictEqual(ws.snapSelectionToGrid(), 2);
assert.deepStrictEqual([oak.x, oak.y], [3 * 48 + 24, 6 * 48], 'to the middle bottom of the cell it stands in');
assert.strictEqual(ws.spaceSelection('horizontal', 100), 2);
assert.strictEqual(rock.x - oak.x, 100, '100 pixels apart');
const before = [oak.x, rock.x];
D.Terrain.allowsDoodad = d => d.x < 400;
assert.strictEqual(ws.nudgeByTile(1, 0), true);
assert.deepStrictEqual([oak.x, rock.x], [before[0] + 48, before[1] + 48], 'a tile to the right');
ws.nudgeByTile(1, 0);
assert.strictEqual(ws.nudgeByTile(1, 0), false, 'refused where the ground won\'t take one');
assert.ok(toasts.some(t => /too steep/.test(t)));
console.log('✓ Placing: snap to grid, space by pixels, nudge by a tile.');

console.log('\nAll find, outliner, picking and placing (B7c) checks passed.');
