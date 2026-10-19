// scratch/test_room_stamps.js
// Room stamps (6.2.11): a rectangle of map (six tile layers, the doodads standing in it, its events)
// saved, then placed here or on another map as one undo step, keeping the map's tiles under empty
// layers, clipped at the map's edge, with new event ids; the Rooms card and the tool.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Room Stamps ===');

const elements = {};
function el(id) {
    if (!elements[id]) elements[id] = { id, value: '', checked: false, innerHTML: '', textContent: '', style: {}, onclick: null, onchange: null,
        classList: { toggle() {}, add() {}, remove() {} }, appendChild() {}, querySelectorAll: () => [], addEventListener() {}, parentNode: null };
    return elements[id];
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, innerHTML: '', appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild(n) { if (n.id) elements[n.id] = n; n.parentNode = this; }, removeChild(n) { if (elements[n.id] === n) delete elements[n.id]; } },
    getElementById: id => elements[id] || (/^dd-room|^dd-rooms/.test(id) ? el(id) : null)
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
const W = 10, H = 8;
const mapData = () => {
    const data = new Array(W * H * 6).fill(0);
    for (let i = 0; i < W * H; i++) data[i] = 2816; // ground everywhere on layer 0
    return data;
};
global.$dataMap = { width: W, height: H, data: mapData(), events: [] };
let mapId = 1;
global.$gameMap = { mapId: () => mapId, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48, width: () => W, height: () => H,
    adjustX: x => x, adjustY: y => y };
global.$dataDocsDoodads = { 1: [] };

const sandbox = path.join(__dirname, 'room_stamps_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(sandbox, { recursive: true, force: true }); });
process.chdir(sandbox);

require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Rooms, ws = D.Workspace, Undo = D.Undo;
const toasts = [];
ws.showToast = text => toasts.push(text);
ws.refreshSpriteset = () => {};
ws.mounted = true;
const idx = (x, y, z) => (z * H + y) * W + x;

// A house on the map: walls on layer 1, a table on layer 2, region 7 on the floor, a doodad, an event.
$dataMap.data[idx(2, 2, 1)] = 1536;
$dataMap.data[idx(3, 2, 1)] = 1537;
$dataMap.data[idx(3, 3, 2)] = 100;
$dataMap.data[idx(2, 3, 5)] = 7;
const lamp = Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/lamp.png'], x: 3 * 48 + 24, y: 4 * 48 });
const outside = Object.assign(D.standardStruct(), { bit: [3, 'img/doodads/tree.png'], x: 8 * 48, y: 7 * 48 });
$dataDocsDoodads[1] = [lamp, outside];
const sign = { id: 1, name: 'Sign', x: 2, y: 3, note: '', pages: [{ list: [{ code: 0, indent: 0, parameters: [] }] }] };
$gameMap._stagedMapData = { width: W, height: H, data: $dataMap.data.slice(), events: [null, sign] };
$gameMap._stagedMapDataId = 1;

// 1. Capture: the rectangle's six layers, the doodad standing in it, the event on it.
const rect = R.rectBetween({ x: 3, y: 3 }, { x: 2, y: 2 }, W, H);
assert.deepStrictEqual(rect, { x: 2, y: 2, w: 2, h: 2 }, 'drag either way');
assert.deepStrictEqual(R.rectBetween({ x: -3, y: 5 }, { x: 12, y: 20 }, W, H), { x: 0, y: 5, w: 10, h: 3 }, 'kept inside the map');
const room = R.capture('House', $dataMap, rect, $dataDocsDoodads[1], $gameMap._stagedMapData.events.filter(Boolean));
assert.strictEqual(room.tiles.length, 2 * 2 * 6);
assert.strictEqual(room.tiles[R.index(2, 2, 0, 0, 1)], 1536);
assert.strictEqual(room.tiles[R.index(2, 2, 1, 1, 2)], 100);
assert.strictEqual(room.tiles[R.index(2, 2, 0, 1, 5)], 7, 'regions come too');
assert.deepStrictEqual(room.doodads.map(d => [d.x, d.y]), [[48 + 24, 2 * 48]], 'the lamp, relative to the corner');
assert.strictEqual(room.events.length, 1);
assert.deepStrictEqual([room.events[0].dx, room.events[0].dy], [0, 1]);
assert.strictEqual(R.summary(room), '2 x 2 tiles, 1 doodad, 1 event');
console.log('✓ capture: tiles on every layer, doodads standing in it, events on it');

// 2. Place: changes only, empty upper layers keep the map's, clipped at the edge.
const plan = R.place(room, $dataMap, { x: 6, y: 5 }, { allocateEventId: () => 9 });
assert.ok(plan.changes.some(c => c.index === idx(6, 5, 1) && c.after === 1536));
assert.ok(plan.changes.every(c => c.index !== idx(6, 5, 0)), 'the ground is the same, so no change');
assert.ok(!plan.changes.some(c => c.after === 0), 'empty layers leave the map alone');
assert.strictEqual(plan.events[0].id, 9);
assert.deepStrictEqual([plan.events[0].x, plan.events[0].y], [6, 6]);
assert.deepStrictEqual([plan.doodads[0].x, plan.doodads[0].y], [6 * 48 + 72, 7 * 48]);
// The room's (1, 1) has nothing on layer 1; the map has a fence there. Kept, unless told otherwise.
$dataMap.data[idx(7, 6, 1)] = 999;
assert.ok(!R.place(room, $dataMap, { x: 6, y: 5 }, {}).changes.some(c => c.index === idx(7, 6, 1)), 'the fence stays');
const keepOff = R.place(room, $dataMap, { x: 6, y: 5 }, { keepUnder: false });
assert.ok(keepOff.changes.some(c => c.index === idx(7, 6, 1) && c.after === 0), 'or is cleared');
$dataMap.data[idx(7, 6, 1)] = 0;
const edge = R.place(room, $dataMap, { x: 9, y: 7 }, {});
assert.ok(edge.changes.every(c => c.index % (W * H) === 9 + 7 * W), 'only the corner tile that fits');
assert.strictEqual(edge.events.length, 0, 'the event would be off the map');
const none = R.place(room, $dataMap, { x: 6, y: 5 }, { tiles: false, doodads: false, events: false });
assert.deepStrictEqual(none, { changes: [], doodads: [], events: [] });
console.log('✓ place: changes only, keeps the map under empty layers, clipped, parts left out');

// 3. Through the workspace: one undo step for tiles, doodads and events, into the staged map too.
R.add(room);
ws.roomTool = Object.assign(ws.roomTool, { tiles: true, doodads: true, events: true, keepUnder: true });
const placed = ws.placeRoom(room, { x: 6, y: 5 });
assert.strictEqual($dataMap.data[idx(6, 5, 1)], 1536);
assert.strictEqual($gameMap._stagedMapData.data[idx(6, 5, 1)], 1536, 'Save writes it');
assert.strictEqual($dataMap.data[idx(6, 6, 5)], 7);
assert.strictEqual($dataDocsDoodads[1].length, 3);
const newEvent = placed.events[0];
assert.ok(newEvent.id >= 2 && $gameMap._stagedMapData.events[newEvent.id] === newEvent, 'a new event id');
assert.notStrictEqual(newEvent.pages, sign.pages, 'a copy, not the same event');
assert.ok(D.Persistence.dirtyMap && D.Persistence.dirtyDoodads);
Undo.undo();
assert.strictEqual($dataMap.data[idx(6, 5, 1)], 0, 'undo puts the tiles back');
assert.strictEqual($gameMap._stagedMapData.data[idx(6, 5, 1)], 0);
assert.strictEqual($dataDocsDoodads[1].length, 2);
assert.strictEqual($gameMap._stagedMapData.events[newEvent.id], null);
Undo.redo();
assert.strictEqual($dataMap.data[idx(6, 5, 1)], 1536, 'and redo');
Undo.undo();
console.log('✓ placing through the workspace: tiles, doodads, events, one undo step');

// 4. The tool: drag to capture (asks a name), click to place; the card; saved to its own file.
D.Ui.form = () => Promise.resolve({ name: 'Shop Corner' });
ws.clientToMapCoords = (x, y) => ({ tileX: x, tileY: y, x: x * 48, y: y * 48 });
(async () => {
    ws.startRoomCapture();
    assert.strictEqual(ws.placementTool, 'room');
    const hook = ws.toolHooks.room;
    assert.ok(hook.down.call(ws, { clientX: 2, clientY: 2 }));
    hook.move.call(ws, { clientX: 4, clientY: 3 }, true);
    hook.up.call(ws, {});
    await new Promise(r => setTimeout(r, 0));
    const shop = R.ensureLoaded().find(r => r.name === 'Shop Corner');
    assert.ok(shop && shop.w === 3 && shop.h === 2, 'captured 3 x 2');
    assert.strictEqual(ws.roomTool.mode, 'place', 'ready to place it');
    assert.strictEqual(ws.roomTool.roomId, shop.id);
    const saved = JSON.parse(fs.readFileSync(path.join(sandbox, 'data', 'DocsDoodadsRooms.json'), 'utf8'));
    assert.ok(saved.rooms.some(r => r.name === 'Shop Corner'));
    hook.click.call(ws, { tileX: 0, tileY: 5 });
    assert.strictEqual($dataMap.data[idx(0, 5, 1)], 1536, 'click places it');
    // The overlay draws where it would go.
    const drawn = [];
    hook.overlay.call(ws, { lineStyle() {}, beginFill() {}, endFill() {}, drawRect(...a) { drawn.push(a); } });
    ws._roomHover = { x: 1, y: 1 };
    hook.overlay.call(ws, { lineStyle() {}, beginFill() {}, endFill() {}, drawRect(...a) { drawn.push(a); } });
    assert.deepStrictEqual(drawn[drawn.length - 1], [48, 48, 3 * 48, 2 * 48]);
    // Another map: the room places there too.
    mapId = 2;
    $dataDocsDoodads[2] = [];
    global.$dataMap = { width: W, height: H, data: mapData(), events: [] };
    $gameMap._stagedMapData = { width: W, height: H, data: $dataMap.data.slice(), events: [null] };
    $gameMap._stagedMapDataId = 2;
    ws.placeRoom(R.get(room.id), { x: 0, y: 0 });
    assert.strictEqual($dataMap.data[idx(0, 0, 1)], 1536);
    assert.strictEqual($dataDocsDoodads[2].length, 1);
    // Card.
    ws.showRoomsCard();
    const card = elements['dd-rooms-card'];
    assert.ok(card.innerHTML.includes('House') && card.innerHTML.includes('Shop Corner') && card.innerHTML.includes('2 x 2 tiles'));
    D.Ui.confirm = () => Promise.resolve(true);
    await ws.deleteRoom(shop.id);
    assert.ok(!R.get(shop.id));
    assert.strictEqual(ws.roomTool.roomId, null);
    ws.closeRoomsCard();
    assert.strictEqual(ws.placementTool, null);
    console.log('✓ the tool and card: drag to save, click to place, any map, delete');
    console.log('=== Room stamps passed ===');
})().catch(err => { console.error(err); process.exit(1); });
