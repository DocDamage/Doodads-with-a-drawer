// scratch/test_prefab_overrides.js
// Prefab overrides and prefabs inside prefabs (6.1.14): settings changed in Details on one copy stay that
// copy's own through Sync Copies (and can go back to the prefab's), a whole copy saved into a new prefab
// goes in as that prefab, changing the inner prefab reaches every copy of the outer one, and deleting the
// inner prefab leaves its doodads in the prefabs that held it.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Prefab Overrides and Nesting ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, classList: { toggle() {}, add() {}, remove() {} },
        appendChild() {}, querySelectorAll: () => [], addEventListener() {} };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => el(id)
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48,
    width: () => 20, height: () => 15, regionId: () => 0, terrainTag: () => 0, isPassable: () => true };
global.$dataDocsDoodads = { 1: [] };

const sandbox = path.join(__dirname, 'prefab_overrides_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, Undo = D.Undo, Prefabs = D.Prefabs;
const toasts = [];
ws.showToast = text => toasts.push(text);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
Prefabs.list = [];
const tile = { tileWidth: 48, tileHeight: 48 };
const doodad = (file, x, y, extra = {}) => Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/' + file + '.png'], x, y, frameW: 32, frameH: 48 }, extra);
const mapList = () => $dataDocsDoodads[1];
const copyOf = instance => mapList().filter(d => d.prefabRef && d.prefabRef.instance === instance);

// 1. Keys: a master's doodads have keys, and copies keep them.
const lamp = Prefabs.capture('Lamp', [doodad('lamp', 240, 240, { light: { enabled: true, radius: 100, color: '#ffcc66' } }), doodad('post', 288, 240)], [], tile);
Prefabs.add(lamp);
assert.deepStrictEqual(lamp.doodads.map(d => d.pk), ['k0', 'k1']);
const a = ws.placePrefab(lamp, { x: 480, y: 480 });
const b = ws.placePrefab(lamp, { x: 960, y: 480 });
assert.deepStrictEqual(a.doodads.map(d => d.prefabRef.pk), ['k0', 'k1']);
// An old prefab with no keys still places, keyed by order.
const legacy = { id: 'pf_old', name: 'Old', doodads: [{ bit: [3, 'img/doodads/rock.png'], x: 0, y: 0 }], events: [] };
assert.strictEqual(Prefabs.instantiate(legacy, { x: 0, y: 0 }, tile).doodads[0].prefabRef.pk, 'k0');
console.log('✓ masters have keys and copies keep them');

// 2. A copy's own settings: changing one in Details marks it, Sync keeps it, Use Prefab's undoes it.
const lampA = a.doodads[0];
ws.setDoodadProperty([lampA], 'light.color', '#3366ff');
ws.setDoodadProperty([lampA], 'name', 'Gate Lamp');
assert.deepStrictEqual(lampA.prefabRef.own, ['light.color', 'name']);
assert.strictEqual(b.doodads[0].prefabRef.own, undefined, 'the other copy is untouched');
assert.ok(!('own' in (Prefabs.get(lamp.id).doodads[0].prefabRef || {})), 'the master has no own settings');
// Moving isn't an own setting: it is the prefab's layout.
ws.setDoodadProperty([lampA], 'x', lampA.x + 4);
assert.deepStrictEqual(lampA.prefabRef.own, ['light.color', 'name']);
assert.deepStrictEqual(ws.ownSettingKeys([lampA]), ['light.color', 'name']);
assert.ok(/Name/.test(ws.ownSettingsHtml([lampA])) && /Use Prefab's/.test(ws.ownSettingsHtml([lampA])));
assert.ok(/Light/.test(ws.settingLabel('light.color')), ws.settingLabel('light.color'));

// The master changes (radius and colour); syncing keeps copy A's colour and name, and A gets the radius.
Prefabs.get(lamp.id).doodads[0].light = { enabled: true, radius: 160, color: '#ff0000' };
lampA.uid = 'dd_gate';
lampA.locked = true;
assert.strictEqual(ws.syncPrefabInstances(lamp.id), 2);
const syncedA = copyOf(a.instance), syncedB = copyOf(b.instance);
assert.strictEqual(syncedA[0].light.color, '#3366ff', 'own colour kept');
assert.strictEqual(syncedA[0].name, 'Gate Lamp', 'own name kept');
assert.strictEqual(syncedA[0].light.radius, 160, 'the rest follows the master');
assert.deepStrictEqual(syncedA[0].prefabRef.own, ['light.color', 'name'], 'still marked own');
assert.strictEqual(syncedA[0].uid, 'dd_gate', 'its id stays (world state and mirrors use it)');
assert.strictEqual(syncedA[0].locked, true, 'and so does its lock');
assert.strictEqual(syncedB[0].light.color, '#ff0000', 'the other copy takes the master colour');
assert.strictEqual(syncedB[0].name, undefined);
assert.strictEqual(syncedA[0].x, 480 + Prefabs.get(lamp.id).doodads[0].x, 'positions come from the prefab');

// Use Prefab's: one setting goes back and is no longer own; undo puts it back.
assert.ok(ws.useMasterSetting(syncedA, 'light.color'));
assert.strictEqual(syncedA[0].light.color, '#ff0000');
assert.deepStrictEqual(syncedA[0].prefabRef.own, ['name']);
Undo.undo();
assert.strictEqual(syncedA[0].light.color, '#3366ff');
assert.deepStrictEqual(syncedA[0].prefabRef.own, ['light.color', 'name']);
assert.strictEqual(ws.useMasterSetting(syncedB, 'name'), false, 'nothing of its own to give back');

// Details marks an own field.
ws.selectDoodads([syncedA[0]]);
const html = ws.renderEffectSections([syncedA[0]]);
assert.ok(/Colour[^<]*●|Color[^<]*●/i.test(html), 'the own field is marked');
console.log('✓ own settings: marked when changed, kept by Sync, back to the prefab with Use Prefab\'s');

// 3. Update Prefab from a copy: its own settings become the master's and are no longer own.
ws.updatePrefabFromInstance(syncedA[0]);
assert.strictEqual(Prefabs.get(lamp.id).doodads[0].light.color, '#3366ff');
assert.strictEqual(Prefabs.get(lamp.id).doodads[0].name, 'Gate Lamp');
assert.strictEqual(copyOf(a.instance)[0].prefabRef.own, undefined);
assert.deepStrictEqual(Prefabs.get(lamp.id).doodads.map(d => d.pk), ['k0', 'k1'], 'keys survive an update');
ws.setDoodadProperty([copyOf(b.instance)[0]], 'name', 'Well Lamp');
ws.syncPrefabInstances(lamp.id);
assert.strictEqual(copyOf(a.instance)[0].light.color, '#3366ff');
assert.strictEqual(copyOf(b.instance)[0].name, 'Well Lamp');
console.log('✓ update prefab takes a copy\'s own settings into the master');

// 4. A prefab inside a prefab: saving a selection with a whole copy puts that prefab inside.
const bench = doodad('bench', 1200, 480);
mapList().push(bench);
$gameMap._stagedMapData = { events: [null] };
$gameMap._stagedMapDataId = 1;
const lampB = copyOf(b.instance);
ws.selectDoodads(lampB.concat([bench]));
const plaza = ws.savePrefabFromSelection('Plaza', true);
assert.strictEqual(plaza.doodads.length, 1, 'only the bench is the plaza\'s own');
assert.strictEqual(plaza.children.length, 1);
assert.strictEqual(plaza.children[0].id, lamp.id);
assert.deepStrictEqual(plaza.children[0].own, { k0: { name: 'Well Lamp' } }, 'the copy\'s own name goes in with it');
assert.deepStrictEqual(lampB.map(d => d.prefabRef.pk), ['c0/k0', 'c0/k1'], 'the selection is linked with nested keys');
assert.ok(lampB.every(d => d.prefabRef.id === plaza.id));
assert.deepStrictEqual(Prefabs.containers(lamp.id), [plaza.id]);
assert.deepStrictEqual(Prefabs.containers(plaza.id), []);
assert.ok(toasts.some(t => /1 prefab inside/.test(t)), toasts[toasts.length - 1]);

// Part of a copy is just doodads.
const half = Prefabs.capture('Half', [copyOf(a.instance)[0]], [], Object.assign({ whole: () => false }, tile));
assert.ok(!half.children && half.doodads.length === 1);

// Placing the outer prefab places the inner one's doodads, with the child's own settings.
const p1 = ws.placePrefab(plaza, { x: 480, y: 960 });
assert.strictEqual(p1.doodads.length, 3);
const p1Lamp = p1.doodads.find(d => d.prefabRef.pk === 'c0/k0');
assert.strictEqual(p1Lamp.name, 'Well Lamp');
assert.strictEqual(p1Lamp.light.color, '#3366ff');
assert.strictEqual(p1Lamp.prefabRef.own, undefined, 'in the master, not the copy\'s own');

// Change the inner prefab and sync it: copies of the plaza follow, own settings kept.
ws.setDoodadProperty([p1Lamp], 'light.radius', 40);
Prefabs.get(lamp.id).doodads[0].light = Object.assign({}, Prefabs.get(lamp.id).doodads[0].light, { color: '#00ff00' });
Prefabs.get(lamp.id).doodads.push({ bit: [3, 'img/doodads/flag.png'], x: 0, y: -48, pk: 'k2' });
const count = ws.syncPrefabInstances(lamp.id);
assert.strictEqual(count, 3, 'one lamp copy (the other became the plaza) and two plaza copies');
const p1Now = copyOf(p1.instance);
assert.strictEqual(p1Now.length, 4, 'the plaza copy has the new flag');
const p1LampNow = p1Now.find(d => d.prefabRef.pk === 'c0/k0');
assert.strictEqual(p1LampNow.light.color, '#00ff00', 'the inner change reached the plaza');
assert.strictEqual(p1LampNow.light.radius, 40, 'the plaza copy kept its own radius');
assert.strictEqual(p1LampNow.name, 'Well Lamp', 'the child\'s own name is the plaza\'s');
console.log('✓ prefabs inside prefabs: saved whole, placed from the inner master, synced with it');

// Update the plaza from a copy where the lamp moved: the child moves.
const before = plaza.children[0].x;
copyOf(p1.instance).filter(d => /^c0\//.test(d.prefabRef.pk)).forEach(d => { d.x += 48; });
ws.updatePrefabFromInstance(p1Now[0]);
assert.strictEqual(Prefabs.get(plaza.id).children[0].x, before + 48);
assert.deepStrictEqual(Prefabs.get(plaza.id).children[0].own, { k0: { name: 'Well Lamp', 'light.radius': 40 } }, "the copy's own radius joins the child's own name");
assert.strictEqual(Prefabs.get(plaza.id).doodads.length, 1, 'the inner doodads are not copied into the plaza');

// A prefab can't end up inside itself.
plaza.children.push({ key: 'c1', id: plaza.id, x: 0, y: 0 });
assert.strictEqual(Prefabs.expand(plaza).doodads.length, 4, 'the loop is skipped');
plaza.children.pop();

// 5. Deleting the inner prefab: the plaza keeps its doodads (same keys), copies keep their own settings.
D.Ui.confirm = text => { assert.ok(/keep its doodads/.test(text), text); return Promise.resolve(true); };
(async () => {
    await ws.deletePrefab(lamp.id);
    assert.strictEqual(Prefabs.get(lamp.id), null);
    const p = Prefabs.get(plaza.id);
    assert.ok(!p.children, 'no children left');
    assert.deepStrictEqual(p.doodads.map(d => d.pk).sort(), ['c0/k0', 'c0/k1', 'c0/k2', 'k0']);
    assert.strictEqual(p.doodads.find(d => d.pk === 'c0/k0').name, 'Well Lamp', 'the child\'s own settings are baked in');
    ws.syncPrefabInstances(plaza.id);
    const lampNow = copyOf(p1.instance).find(d => d.prefabRef.pk === 'c0/k0');
    assert.strictEqual(lampNow.light.radius, 40, 'the copy still finds its doodad and keeps its own radius');
    assert.strictEqual(copyOf(p1.instance).length, 4);

    // Saved and read back.
    assert.ok(Prefabs.save());
    const saved = JSON.parse(fs.readFileSync(path.join(sandbox, 'data', 'DocsDoodadsPrefabs.json'), 'utf8'));
    assert.ok(saved.prefabs.some(x => x.id === plaza.id && x.doodads.every(d => d.pk)));
    console.log('✓ deleting an inner prefab leaves its doodads in the prefabs that held it');

    console.log('=== Prefab overrides and nesting passed ===');
})().catch(err => { console.error(err); process.exit(1); });
