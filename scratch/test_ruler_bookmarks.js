// scratch/test_ruler_bookmarks.js
// The Ruler and bookmarks (7.2.3). The ruler's distances for a known drag, Shift snapping to tile middles, its
// line flat and in 3D, and that it changes nothing. Bookmarks: added from the view, kept in the main file either
// way of saving (a map losing its last doodad keeps its bookmarks), Go To on another map opens it then centres,
// Ctrl+1 to Ctrl+9, the palette and the card.
const assert = require('assert');

console.log('=== Testing the Ruler and Bookmarks ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '',
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} }
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    body, documentElement: makeNode('html'), activeElement: null, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
let mapId = 1, display = { x: 10, y: 4 };
const shown = [];
global.$gameMap = {
    mapId: () => mapId, tileWidth: () => 48, tileHeight: () => 48, width: () => 100, height: () => 100,
    displayX: () => display.x, displayY: () => display.y, adjustX: x => x - display.x, adjustY: y => y - display.y,
    setDisplayPos(x, y) { display = { x, y }; shown.push([x, y]); }
};
global.Graphics = { width: 816, height: 624 };
window.$dataMapInfos = [null, { name: 'Town' }, { name: 'Forest' }];

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, R = D.Ruler, B = D.Bookmarks;
ws.showToast = () => {};
ws.placeReadouts = () => {};
ws.updateUndoButtons = () => {};
ws.mounted = true;
D.Perspective.liveCamera = () => null;
window.$dataDocsDoodads = { 1: [{ uid: 'a', x: 10, y: 10 }], 2: [{ uid: 'b', x: 1, y: 1 }] };

(async () => {
    // 1. The measure.
    {
        // From the middle of tile (2, 3) to a point in tile (7, 1).
        const m = R.measure({ x: 2.5 * 48, y: 3.5 * 48 }, { x: 7 * 48 + 10, y: 1 * 48 + 40 }, 48, 48);
        assert.strictEqual(m.dx, 5);
        assert.strictEqual(m.dy, -2);
        assert.strictEqual(m.walk, 7, 'walking: across plus down');
        assert.strictEqual(m.px, 7 * 48 + 10 - 120);
        assert.strictEqual(m.py, 88 - 168);
        assert.strictEqual(m.pixels, Math.round(Math.hypot(226, 80)));
        assert.strictEqual(m.tiles, Math.round(Math.hypot(226 / 48, 80 / 48) * 10) / 10);
        assert.strictEqual(R.label(m), `5 × 2 tiles · walk 7 · straight ${m.tiles} tiles · ${m.pixels} px (226 × 80)`);
        assert.deepStrictEqual(R.snap({ x: 100, y: 5 }, 48, 48), { x: 120, y: 24 }, 'a tile middle');
        const same = R.measure({ x: 10, y: 10 }, { x: 40, y: 40 }, 48, 48);
        assert.strictEqual(same.walk, 0, 'within one tile');
        console.log('PASS distances for a known drag, and snapping');
    }

    // 2. The tool: press, drag, let go; Shift snaps; the line is drawn; nothing changes.
    {
        const hook = ws.toolHooks.ruler;
        let at = { x: 0, y: 0 };
        ws.clientToMapCoords = () => ({ x: at.x, y: at.y, tileX: Math.floor(at.x / 48), tileY: Math.floor(at.y / 48) });
        ws.setPlacementTool = function(t) { this.placementTool = t; };
        ws.setPlacementTool('ruler');
        const before = JSON.stringify(window.$dataDocsDoodads);
        at = { x: 100, y: 100 };
        assert.strictEqual(hook.down.call(ws, { clientX: 300, clientY: 200, shiftKey: true }), true);
        assert.deepStrictEqual(ws._ruler.from, { x: 120, y: 120 }, 'snapped');
        at = { x: 300, y: 130 };
        hook.move.call(ws, { clientX: 500, clientY: 230, shiftKey: true }, true);
        assert.deepStrictEqual(ws._ruler.to, { x: 312, y: 120 });
        hook.up.call(ws, {});
        assert.strictEqual(ws._suppressNextClick, true, 'the click after does not pick');
        const m = ws.rulerMeasure();
        assert.deepStrictEqual([m.dx, m.dy, m.walk, m.pixels], [4, 0, 4, 192]);
        // Moving without the button doesn't change the measure that stays.
        at = { x: 900, y: 900 };
        hook.move.call(ws, { clientX: 1, clientY: 1 }, false);
        assert.deepStrictEqual(ws._ruler.to, { x: 312, y: 120 });
        const calls = [];
        const g = new Proxy({}, { get: (t, k) => (...args) => calls.push([k, args]) });
        hook.overlay.call(ws, g);
        const lines = calls.filter(c => c[0] === 'lineTo').map(c => c[1]);
        const from = D.mapToScreen(120, 120), to = D.mapToScreen(312, 120);
        assert.deepStrictEqual(lines[0], [to.x, to.y], 'the line, in screen pixels');
        assert.strictEqual(calls.filter(c => c[0] === 'drawCircle').length, 2, 'both ends');
        assert.deepStrictEqual(calls.find(c => c[0] === 'moveTo')[1], [from.x, from.y]);
        const readout = byId['dd-ruler-readout'];
        assert.ok(readout && readout.style.display === '' && /^4 × 0 tiles · walk 4/.test(readout.textContent));
        assert.strictEqual(readout.style.left, (500 + 14) + 'px');
        assert.strictEqual(JSON.stringify(window.$dataDocsDoodads), before, 'nothing changed');
        assert.strictEqual(D.Undo.undoStack.length, 0, 'no undo step');
        // In 3D the line goes through the camera (and is drawn by the 3D gizmos, not the flat overlay).
        D.Perspective.liveCamera = () => ({});
        const flat = D.Perspective.flatToScreen;
        D.Perspective.flatToScreen = (x, y) => ({ x: x / 2, y: y / 2, scale: 1 });
        assert.deepStrictEqual(ws.rulerScreenLine()[1], { x: to.x / 2, y: to.y / 2, scale: 1 });
        calls.length = 0;
        hook.overlay.call(ws, g);
        assert.strictEqual(calls.length, 0, 'not on the flat overlay in 3D');
        D.Perspective.flatToScreen = flat;
        D.Perspective.liveCamera = () => null;
        // Another tool: the measure goes.
        ws.setPlacementTool(null);
        hook.overlay.call(ws, g);
        assert.strictEqual(ws._ruler, null);
        assert.strictEqual(readout.style.display, 'none');
        const row = D.Shortcuts.find('ruler');
        assert.ok(row && row.keys === 'M');
        assert.strictEqual(D.Shortcuts.match({ key: 'm', code: 'KeyM', ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }), 'ruler');
        console.log('PASS the tool: press, drag, let go, Shift, the line flat and in 3D, nothing changed');
    }

    // 3. Bookmarks: from the view, saved in the main file either way, kept when a map loses its last doodad.
    {
        let answer = 'Inn door';
        D.Ui.prompt = async (text, value) => { ws._suggested = value; return answer; };
        D.Persistence.dirtyDoodads = false;
        display = { x: 10, y: 4 };
        const inn = await ws.bookmarkView();
        assert.strictEqual(ws._suggested, 'Town 18, 10', 'suggests the map and the middle tile');
        assert.deepStrictEqual([inn.name, inn.mapId, inn.x, inn.y, inn.camera], ['Inn door', 1, 18, 10, null]);
        assert.strictEqual(D.Persistence.dirtyDoodads, true);
        mapId = 2;
        $gameMap._docsCamera = { zoom: 1.5, yaw: 30 };
        D.Perspective.liveCamera = () => ({});
        D.screenPointToMap = () => ({ x: 40 * 48 + 5, y: 22 * 48 });
        answer = 'Forest clearing';
        const forest = await ws.bookmarkView();
        assert.deepStrictEqual([forest.x, forest.y, forest.camera], [40, 22, { zoom: 1.5, yaw: 30 }], 'the 3D view keeps its camera');
        assert.notStrictEqual(forest.camera, $gameMap._docsCamera, 'a copy');
        D.Perspective.liveCamera = () => null;
        answer = null;
        assert.strictEqual(await ws.bookmarkView(), null, 'cancelled');
        assert.strictEqual(B.list().length, 2);
        const DF = D.DataFiles;
        window.$dataDocsDoodads[2] = [];
        const split = DF.entriesFor(window.$dataDocsDoodads, true);
        const main = split[0].data;
        assert.strictEqual(main.bookmarks.length, 2, 'in the main file');
        assert.deepStrictEqual(main._mapFiles, [1], "map 2 has no doodads left, and no file");
        const files = Object.fromEntries(split.map(e => [e.path, JSON.parse(JSON.stringify(e.data))]));
        const back = DF.merge(files[DF.mainPath()], id => files[DF.mapPath(id)] || null);
        assert.deepStrictEqual(back.bookmarks, JSON.parse(JSON.stringify(B.list())), "map 2's bookmark kept");
        assert.deepStrictEqual(DF.entriesFor(window.$dataDocsDoodads, false)[0].data.bookmarks.map(b => b.name), ['Inn door', 'Forest clearing']);
        console.log('PASS added from the view; kept either way of saving and when a map is emptied');
    }

    // 4. Go To: another map opens first, then the view is centred there.
    {
        let opened = null;
        ws.goToMap = id => { opened = id; };
        ws.setCameraView = function(view) { this._cameraSet = view; };
        mapId = 1;
        shown.length = 0;
        assert.strictEqual(ws.goToBookmarkNumber(2), true);
        assert.strictEqual(opened, 2, 'the forest map opens');
        assert.strictEqual(shown.length, 0, 'not centred until it has loaded');
        assert.strictEqual(ws.finishPendingBookmark(), false, 'still on map 1');
        mapId = 2;
        assert.strictEqual(ws.finishPendingBookmark(), true);
        assert.deepStrictEqual(shown[0], [40 - 816 / 48 / 2 + 0.5, 22 - 624 / 48 / 2 + 0.5], 'centred');
        assert.deepStrictEqual(ws._cameraSet, { zoom: 1.5, yaw: 30 }, 'the 3D camera');
        assert.strictEqual(ws.finishPendingBookmark(), false, 'once');
        opened = null;
        mapId = 1;
        ws.goToBookmarkNumber(1);
        assert.strictEqual(opened, null, 'same map: no map change');
        assert.deepStrictEqual(shown[1], [18 - 816 / 48 / 2 + 0.5, 10 - 624 / 48 / 2 + 0.5]);
        assert.strictEqual(ws.goToBookmarkNumber(9), false, 'none yet');
        for (let n = 1; n <= 9; n++) {
            assert.strictEqual(D.Shortcuts.match({ key: String(n), code: 'Digit' + n, ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }), 'bookmark' + n);
        }
        const keys = D.Shortcuts.list.map(s => s.keys).filter(Boolean);
        assert.strictEqual(new Set(keys).size, keys.length, 'no key used twice');
        shown.length = 0;
        ws.runShortcut('bookmark1', {});
        assert.strictEqual(shown.length, 1, 'Ctrl+1');
        const cmds = ws.bookmarkCommands();
        assert.deepStrictEqual(cmds.map(c => c.label), ['Bookmark This View', 'Bookmarks', 'Go to: Inn door', 'Go to: Forest clearing']);
        assert.strictEqual(cmds[2].keys, 'Ctrl+1');
        console.log('PASS Go To another map, then centred; Ctrl+1 to Ctrl+9; the palette');
    }

    // 5. The card: rows, rename, up, delete.
    {
        ws.showBookmarks();
        const rows = () => byId['dd-bm-list'].childNodes;
        assert.strictEqual(rows().length, 2);
        assert.strictEqual(rows()[1].childNodes[1].textContent, 'Map 2 · 40, 22');
        assert.strictEqual(rows()[0].childNodes[2].textContent, 'Ctrl+1');
        rows()[1].childNodes[4].onclick();
        assert.deepStrictEqual(B.list().map(b => b.name), ['Forest clearing', 'Inn door'], 'moved up: now Ctrl+1');
        D.Ui.prompt = async () => 'The inn';
        await ws.renameBookmark(B.list()[1].id);
        assert.strictEqual(B.list()[1].name, 'The inn');
        rows()[0].childNodes[5].onclick();
        assert.deepStrictEqual(B.list().map(b => b.name), ['The inn']);
        B.remove(B.list()[0].id);
        assert.ok(!('bookmarks' in window.$dataDocsDoodads), 'no bookmarks, no key');
        ws.closeBookmarks();
        assert.ok(!byId['dd-bookmarks']);
        console.log('PASS the card');
    }

    console.log('\nAll ruler and bookmark tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
