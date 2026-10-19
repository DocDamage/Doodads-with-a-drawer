// scratch/test_map_check.js
// Map checks: the flood of walkable tiles (walls, doodad collision, blocking events, looping maps), the
// places out of reach, and the Problems panel (missing pictures and sounds, doodads off the map, lamps
// on maps that never get dark, events nobody can step on or reach), with Go To and Fix.
const assert = require('assert');

console.log('=== Testing the Map Check ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '',
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; if (/<select[^>]*id="dd-pr-scope"/.test(v) && m[1] === 'dd-pr-scope') c.value = /value="all" selected/.test(v) ? 'all' : 'map'; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} }
    };
}
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { body: makeNode('body'), documentElement: makeNode('html'), createElement: makeNode, getElementById: id => byId[id] || null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };

// A 10 x 6 map. # is a wall. The right room (x >= 6) is shut off by the wall at x = 5.
const rows = [
    '..........',
    '.....#....',
    '.....#....',
    '.....#....',
    '.....#....',
    '.....#....'
];
const wall = (x, y) => rows[y] && rows[y][x] === '#';
let loop = false;
const ev = (id, x, y, opts = {}) => ({
    x, y, eventId: () => id, isNormalPriority: () => opts.priority === 1, isThrough: () => false,
    event: () => ({ name: opts.name || '', pages: [{ list: opts.list || [{ code: 0 }], image: { characterName: opts.sheet || '' } }] }),
    page: () => ({ trigger: opts.trigger || 0, priorityType: opts.priority === undefined ? 1 : opts.priority, list: opts.list || [{ code: 101 }, { code: 0 }] })
});
const events = [];
let mapId = 1;
global.$gameMap = {
    mapId: () => mapId, width: () => 10, height: () => 6, tileWidth: () => 48, tileHeight: () => 48,
    displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y,
    isLoopHorizontal: () => loop, isLoopVertical: () => false,
    roundX: x => (loop ? (x + 10) % 10 : x), roundY: y => y,
    roundXWithDirection(x, d) { return this.roundX(x + (d === 6 ? 1 : d === 4 ? -1 : 0)); },
    roundYWithDirection(y, d) { return y + (d === 2 ? 1 : d === 8 ? -1 : 0); },
    isValid: (x, y) => x >= 0 && y >= 0 && x < 10 && y < 6,
    isPassable: (x, y) => !wall(x, y),
    events: () => events,
    setDisplayPos(x, y) { this._shown = [x, y]; }
};
global.$gamePlayer = { x: 1, y: 1 };
global.Graphics = { width: 480, height: 288 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, MC = D.MapCheck;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.placeReadouts = () => {};
D.Perspective.liveCamera = () => null;

(async () => {
    // 1. The flood (pure).
    const grid = { width: 10, height: 6, canStep: (x, y, d) => { const nx = x + (d === 6 ? 1 : d === 4 ? -1 : 0), ny = y + (d === 2 ? 1 : d === 8 ? -1 : 0); return !wall(nx, ny) && !wall(x, y); } };
    let r = MC.reach({ x: 1, y: 1 }, grid);
    assert.strictEqual(r.count, 60 - 5, 'the gap at the top lets the player round the wall');
    rows[0] = '.....#....';
    r = MC.reach({ x: 1, y: 1 }, grid);
    assert.strictEqual(r.count, 30, 'with the gap closed, only the left room');
    assert.ok(r.seen[1 + 1 * 10] && !r.seen[7 + 2 * 10]);
    assert.ok(MC.nearReached(r.seen, 10, 6, 5, 2), 'a wall beside the left room is near enough to touch');
    assert.ok(!MC.nearReached(r.seen, 10, 6, 7, 2));
    assert.strictEqual(MC.reach({ x: 20, y: 0 }, grid).count, 0, 'a start off the map reaches nothing');
    r = MC.reach({ x: 1, y: 1 }, Object.assign({}, grid, { loopX: true, canStep: (x, y, d) => { const nx = (x + (d === 6 ? 1 : d === 4 ? -1 : 0) + 10) % 10; return !wall(nx, y + (d === 2 ? 1 : d === 8 ? -1 : 0)); } }));
    assert.strictEqual(r.count, 54, 'a looping map wraps round to the other room');
    assert.ok(MC.nearReached(r.seen, 10, 6, 0, 0, { x: true }));
    // Dark or not.
    const world = { time: { source: 'off', keyframes: [{ hour: 0, darkness: 0.7 }] } };
    assert.strictEqual(MC.canBeDark({}, world), false);
    assert.strictEqual(MC.canBeDark({ ambient: { darkness: 0.4 } }, world), true);
    assert.strictEqual(MC.canBeDark({}, { time: { source: 'real', keyframes: [{ darkness: 0.7 }] } }), true, 'a clock with a dark hour');
    assert.strictEqual(MC.canBeDark({ dayNight: 'off' }, { time: { source: 'real', keyframes: [{ darkness: 0.7 }] } }), false, 'unless the map ignores it');
    assert.strictEqual(MC.canBeDark({}, { time: { source: 'real', keyframes: [{ darkness: 0 }] } }), false);
    console.log('✓ flood: walls, gaps, looping maps, touching distance; maps that get dark');

    // 2. Reach on the map: doodad collision and blocking events stop the player; places out of reach are listed.
    const door = ev(1, 8, 2, { name: 'Door', priority: 1 });
    const chest = ev(2, 3, 3, { sheet: '!Chest', priority: 1 });
    const exit = ev(3, 9, 5, { list: [{ code: 201 }, { code: 0 }], priority: 0 });
    const npc = ev(4, 2, 1, { name: 'Guard', priority: 1 });
    events.push(door, chest, exit, npc);
    assert.deepStrictEqual([door, chest, exit, npc].map(e => ws.eventPlaceKind(e)), ['door', 'chest', 'transfer', null]);
    let reach = ws.checkReach();
    assert.deepStrictEqual(reach.start, { x: 1, y: 1 }, 'from the player');
    assert.strictEqual(reach.count, 28, 'the left room less the guard and the chest tiles');
    assert.deepStrictEqual(reach.flagged.map(f => f.event.eventId()).sort(), [1, 3], 'the door and the exit are out of reach; the chest is beside reachable tiles');
    assert.ok(reach.flagged.every(f => !f.byCharacters), 'walls, not characters, shut them off');
    // A guard alone in a doorway: out of reach, but only because of a character.
    rows[1] = '..........';
    events.push(ev(9, 5, 1, { name: 'Gatekeeper', priority: 1 }));
    const guarded = ws.checkReach();
    assert.ok(guarded.flagged.length && guarded.flagged.every(f => f.byCharacters && /Only a character stands in the way/.test(f.text)));
    events.pop();
    rows[1] = '.....#....';
    assert.ok(/2 place\(s\) out of reach/.test(toasts[toasts.length - 1][0]));
    // A doodad's collision blocking the way into the corner.
    const crate = Object.assign(D.standardStruct(), { x: 24, y: 144, frameW: 48, frameH: 48, collision: { preset: 'full', shape: null }, bit: [3, 'img/doodads/crate.png'] });
    $dataDocsDoodads[1] = [crate];
    reach = ws.checkReach();
    assert.ok(!reach.seen[0 + 2 * 10], 'the crate\'s tile is blocked');
    assert.strictEqual(reach.count, 27);
    // From a tile in the right room: the door and exit are fine, the chest is not.
    reach = ws.checkReach({ x: 7, y: 3 });
    assert.deepStrictEqual(reach.flagged.map(f => f.event.eventId()), [2]);
    // The overlay shades reachable tiles and outlines the places out of reach.
    const g = { rects: [], circles: [], fills: [], lineStyle() {}, beginFill(c) { this.fills.push(c); }, endFill() {}, drawRect(x, y, w, h) { this.rects.push([x, y, w, h]); }, drawCircle(x, y) { this.circles.push([x, y]); } };
    ws.drawReachOverlay(g);
    assert.ok(g.rects.length >= reach.count, 'reachable tiles shaded');
    assert.ok(g.fills.includes(D.Ui.mapColor('reach')));
    assert.ok(g.rects.some(rc => rc[0] === 3 * 48 + 2 && rc[1] === 3 * 48 + 2), 'the chest outlined');
    assert.deepStrictEqual(g.circles, [[7.5 * 48, 3.5 * 48]], 'the start marked');
    // The Reach tool: a click on the map checks from that tile, then Select is back.
    byId.GameCanvas = makeNode('canvas');
    ws.mounted = true;
    ws.attachCanvasListeners();
    ws.clientToMapCoords = () => ({ x: 0, y: 0, tileX: 1, tileY: 4 });
    ws.placementTool = 'reach';
    ws._onCanvasClick({ clientX: 0, clientY: 0, button: 0, preventDefault() {} });
    assert.deepStrictEqual(ws._reach.start, { x: 1, y: 4 });
    assert.strictEqual(ws.placementTool, null);
    assert.ok(/Check Reach: click a tile/.test(D.Ui.hints.reach));
    console.log('✓ reach: walls, doodad collision, blocking characters; doors, chests and transfers out of reach; overlay; tool');

    // 3. Problems.
    ws.clearReach();
    const real = D.FS.existsSync;
    const files = new Set(['img/doodads/crate.png', 'audio/bgs/River.ogg']);
    D.FS.existsSync = p => files.has(p);
    const lamp = Object.assign(D.standardStruct(), { x: 100, y: 100, bit: [3, 'img/doodads/lamp.png'], light: { enabled: true, radius: 100 } });
    const stray = Object.assign(D.standardStruct(), { x: 900, y: 100, bit: [3, 'img/doodads/crate.png'] });
    const bird = Object.assign(D.standardStruct(), { x: 50, y: 50, bit: [3, 'img/doodads/crate.png'], sound: { file: 'se/Bird', volume: 60 } });
    const river = Object.assign(D.standardStruct(), { x: 60, y: 60, bit: [3, 'img/doodads/crate.png'], sound: { file: 'bgs/River' } });
    $dataDocsDoodads[1] = [crate, lamp, stray, bird, river];
    $dataDocsDoodads[2] = [Object.assign(D.standardStruct(), { x: 9999, y: 10, bit: [3, 'img/doodads/gone.png'] })];
    D.FS.readJson = p => (/Map002/.test(p) ? { width: 20, height: 15 } : null);
    events.length = 0;
    const plate = ev(5, 5, 3, { trigger: 1, priority: 0 });
    const underCrate = ev(6, 0, 2, { priority: 1 });
    events.push(plate, underCrate);
    let list = ws.collectProblems('map');
    const kinds = list.map(p => p.kind).sort();
    assert.deepStrictEqual(kinds, ['blockedEvent', 'blockedEvent', 'darkLamp', 'missingArt', 'missingSound', 'offMap']);
    assert.ok(list.find(p => p.kind === 'missingArt').text.includes('img/doodads/lamp.png'));
    assert.ok(/stepped on/.test(list.find(p => p.event === plate).text), 'a touch plate on a wall');
    assert.ok(/under a doodad/.test(list.find(p => p.event === underCrate).text));
    assert.ok(!list.some(p => p.doodad === river), 'a sound that exists is fine');
    // Every map: the other map's doodads too, sized from its file.
    list = ws.collectProblems('all');
    assert.ok(list.some(p => p.mapId === 2 && p.kind === 'missingArt'));
    assert.ok(list.some(p => p.mapId === 2 && p.kind === 'offMap' && /20×15/.test(p.text)));
    assert.ok(!list.some(p => p.mapId === 2 && p.fix && p.kind === 'missingArt'), 'Replace Art only for this map');
    // Lamps are fine once the map can get dark.
    $dataDocsDoodads.mapSettings = { 1: { ambient: { darkness: 0.5 } } };
    assert.ok(!ws.collectProblems('map').some(p => p.kind === 'darkLamp'));
    $dataDocsDoodads.mapSettings = {};
    // Fixes: one undo step each.
    const Undo = D.Undo;
    const steps = Undo.undoStack.length;
    const off = ws.collectProblems('map').find(p => p.kind === 'offMap');
    off.fix.run();
    assert.deepStrictEqual([stray.x, stray.y], [456, 100], 'moved just inside the map');
    const quiet = ws.collectProblems('map').find(p => p.kind === 'missingSound');
    quiet.fix.run();
    assert.strictEqual(bird.sound, undefined);
    assert.strictEqual(Undo.undoStack.length, steps + 2);
    Undo.undo(); Undo.undo();
    assert.deepStrictEqual([stray.x, bird.sound.file], [900, 'se/Bird']);
    let replaced = null;
    ws.showReplaceArt = () => { replaced = ws.selectionItems().slice(); return Promise.resolve(1); };
    await ws.collectProblems('map').find(p => p.kind === 'missingArt').fix.run();
    assert.deepStrictEqual(replaced, [lamp], 'Replace Art opens for the doodad');
    // Go To: here it centres and picks; another map goes there first and finishes when it loads.
    ws.selectEvent = info => { ws._picked = info; };
    ws.goToProblem({ mapId: 1, x: 7, y: 3, doodad: lamp });
    assert.deepStrictEqual($gameMap._shown, [7 - 5 + 0.5, 3 - 3 + 0.5]);
    assert.deepStrictEqual(ws.selectionItems(), [lamp]);
    ws.goToProblem({ mapId: 1, x: 5, y: 3, event: plate });
    assert.strictEqual(ws._picked.gameEvent, plate);
    const went = [];
    ws.goToMap = id => went.push(id);
    const away = { mapId: 2, x: 4, y: 4, doodad: $dataDocsDoodads[2][0] };
    ws.goToProblem(away);
    assert.deepStrictEqual(went, [2]);
    assert.strictEqual(ws.finishPendingGoTo(), false, 'not until map 2 has loaded');
    mapId = 2;
    assert.strictEqual(ws.finishPendingGoTo(), true);
    assert.deepStrictEqual(ws.selectionItems(), [$dataDocsDoodads[2][0]]);
    mapId = 1;
    console.log('✓ problems: missing pictures and sounds, off the map, dark-less lamps, events; every map; fixes undo; Go To');

    // 4. The panel.
    ws.renderProblems = D.Workspace.renderProblems;
    const panel = ws.showProblems();
    assert.ok(panel && /Problems \(\d+\)/.test(panel.innerHTML));
    const listEl = byId['dd-pr-list'];
    const groups = listEl.childNodes.filter(n => n.className === 'dd-pr-group').map(n => n.textContent);
    assert.ok(groups.includes('Missing pictures (1)') && groups.includes('Off the map (1)'));
    const offRow = listEl.childNodes.find(n => n.className === 'dd-pr-row' && /outside/.test(n.childNodes[0].textContent));
    assert.deepStrictEqual(offRow.childNodes.slice(1).map(b => b.textContent), ['Go To', 'Move Inside']);
    await offRow.childNodes[2].onclick();
    assert.ok(!byId['dd-pr-list'].childNodes.some(n => n.className === 'dd-pr-group' && /Off the map/.test(n.textContent)), 'fixed: gone from the list');
    Undo.undo();
    byId['dd-pr-reach'].onclick();
    assert.ok(byId['dd-pr-list'].childNodes.some(n => n.className === 'dd-pr-group' && /Out of reach/.test(n.textContent)) || ws._reach.flagged.length === 0);
    assert.ok(byId['dd-pr-reach-clear'], 'Hide Reach once checked');
    byId['dd-pr-reach-clear'].onclick();
    assert.strictEqual(ws._reach, null);
    byId['dd-pr-scope'].value = 'all';
    byId['dd-pr-scope'].onchange();
    assert.strictEqual(ws._problemScope, 'all');
    assert.ok(byId['dd-pr-list'].childNodes.some(n => n.className === 'dd-pr-row' && /map 2/.test(n.childNodes[0].textContent)));
    byId['dd-pr-close'].onclick();
    assert.ok(!byId['dd-problems']);
    $dataDocsDoodads = { 1: [] };
    events.length = 0;
    ws.showProblems();
    assert.ok(/No problems found on every map|No problems found/.test(byId['dd-pr-list'].childNodes[0].textContent));
    ws.closeProblems();
    ws.mapEntries = () => [];
    const palette = ws.paletteCommands().map(c => c.label);
    for (const l of ['Problems (check the map)', 'Check Reach from the player', 'Check Reach from a tile...']) assert.ok(palette.includes(l), l);
    D.FS.existsSync = real;
    console.log('✓ problems panel: groups, Go To and Fix buttons, Check Reach, every map, empty state, palette');

    console.log('=== Map check passed ===');
})().catch(e => { console.error(e); process.exit(1); });
