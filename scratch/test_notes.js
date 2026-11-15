// scratch/test_notes.js
// Map notes (7.2.2): notes pinned to tiles, seen only in the editor. Adding, editing, ticking and deleting; a map
// without notes writes no key; the data round-trips through both ways of saving (one file, one file per map);
// each change is one undo step; pins are drawn on the editor's overlay (which Capture leaves out), not in 3D or
// when hidden; the right-click entries; and the Notes card.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Map Notes ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', checked: false,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624, right: 816, bottom: 624 })
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body, documentElement: makeNode('html'), activeElement: null, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
let mapId = 1;
global.$gameMap = {
    mapId: () => mapId, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0,
    adjustX: x => x, adjustY: y => y, width: () => 30, height: () => 20, setDisplayPos() {}
};
global.Graphics = { width: 816, height: 624 };

require('../Docs-Doodads.js');
const D = DocsDoodads, N = D.Notes, ws = D.Workspace;
ws.showToast = () => {};
ws.updateUndoButtons = () => {};
ws.placeReadouts = () => {};
ws.mounted = true;
D.Compat.getCanvas = () => ({ width: 816, height: 624, getBoundingClientRect: () => ({ left: 100, top: 50, width: 816, height: 624 }) });
D.Perspective.liveCamera = () => null;
window.$dataDocsDoodads = { 1: [{ uid: 'a', x: 10, y: 10 }], 2: [{ uid: 'b', x: 1, y: 1 }] };

(async () => {
    // 1. The data.
    {
        assert.deepStrictEqual(N.list(1), []);
        assert.strictEqual(N.add(1, { x: 3, y: 4, text: '   ' }), null, 'no text, no note');
        assert.ok(!('notes' in $dataDocsDoodads), 'no notes: no key');
        const a = N.add(1, { x: 3, y: 4, text: ' A chest here ', colour: 'purple' });
        assert.ok(a.id && a.text === 'A chest here' && a.colour === 'yellow' && a.done === false, 'cleaned');
        const b = N.add(2, { x: 5, y: 6, text: 'Check the door', colour: 'red' });
        assert.strictEqual(N.at(1, 3, 4), a);
        assert.strictEqual(N.at(1, 4, 4), null);
        N.update(1, a.id, { done: true });
        assert.deepStrictEqual(N.counts(), { open: 1, done: 1, maps: { 1: { open: 0, done: 1 }, 2: { open: 1, done: 0 } } });
        assert.deepStrictEqual(N.all().map(r => r.mapId), [1, 2]);
        assert.strictEqual(N.update(1, a.id, { text: '' }), null, 'an empty text deletes it');
        assert.deepStrictEqual(Object.keys($dataDocsDoodads.notes), ['2'], 'the emptied map has no key');
        assert.ok(N.remove(2, b.id));
        assert.ok(!('notes' in $dataDocsDoodads), 'no notes anywhere: no key at all');
        assert.strictEqual(N.remove(2, 'nope'), false);
        console.log('PASS add, edit, tick, delete; no key without notes');
    }

    // 2. Both ways of saving keep them, in the main file.
    {
        N.add(1, { x: 3, y: 4, text: 'Chest' });
        N.add(7, { x: 1, y: 2, text: 'Map with notes but no doodads' });
        const DF = D.DataFiles;
        const one = DF.entriesFor($dataDocsDoodads, false);
        assert.strictEqual(one.length, 1);
        assert.deepStrictEqual(one[0].data.notes[1][0].text, 'Chest');
        const split = DF.entriesFor($dataDocsDoodads, true);
        const main = split.find(e => e.path === DF.mainPath()).data;
        assert.ok(main.notes && main.notes[1] && main.notes[7], 'in the main file');
        assert.deepStrictEqual(main._mapFiles, [1, 2], 'notes are not a map file');
        const files = Object.fromEntries(split.map(e => [e.path, JSON.parse(JSON.stringify(e.data))]));
        const back = DF.merge(files[DF.mainPath()], id => files[DF.mapPath(id)] || null);
        assert.deepStrictEqual(back.notes, JSON.parse(JSON.stringify($dataDocsDoodads.notes)), 'round trip, split');
        assert.deepStrictEqual(back[1], JSON.parse(JSON.stringify($dataDocsDoodads[1])), 'doodads still in their map file');
        const oneBack = DF.merge(JSON.parse(JSON.stringify(one[0].data)), () => null);
        assert.deepStrictEqual(oneBack.notes, back.notes, 'round trip, one file');
        N.put(1, []); N.put(7, []);
        assert.ok(!('notes' in DF.entriesFor($dataDocsDoodads, true)[0].data), 'nothing written without notes');
        console.log('PASS both ways of saving keep them');
    }

    // 3. The editor: add, edit, tick and delete are each one undo step.
    {
        let answer = null;
        D.Ui.form = async opts => { ws._lastForm = opts; return answer; };
        D.Persistence.dirtyDoodads = false;
        answer = { text: 'Put a chest here', colour: 'green' };
        const note = await ws.addNoteAt(5, 6);
        assert.strictEqual(note.colour, 'green');
        assert.strictEqual(D.Persistence.dirtyDoodads, true);
        assert.strictEqual(N.list(1).length, 1);
        answer = { text: 'Put a big chest here', colour: 'blue', done: false };
        await ws.editNoteAt(5, 6);
        assert.strictEqual(N.at(1, 5, 6).text, 'Put a big chest here');
        ws.markNoteDone(1, N.at(1, 5, 6).id, true);
        assert.strictEqual(N.at(1, 5, 6).done, true);
        ws.deleteNote(1, N.at(1, 5, 6).id);
        assert.strictEqual(N.list(1).length, 0);
        D.Undo.undo();
        assert.strictEqual(N.at(1, 5, 6).done, true, 'undo delete');
        D.Undo.undo();
        assert.strictEqual(N.at(1, 5, 6).done, false, 'undo tick');
        D.Undo.undo();
        assert.strictEqual(N.at(1, 5, 6).text, 'Put a chest here', 'undo edit');
        D.Undo.undo();
        assert.strictEqual(N.list(1).length, 0, 'undo add');
        assert.ok(!('notes' in $dataDocsDoodads));
        D.Undo.redo();
        assert.strictEqual(N.at(1, 5, 6).text, 'Put a chest here', 'redo add');
        answer = null;
        assert.strictEqual(await ws.addNoteAt(9, 9), null, 'cancelled');
        answer = { text: '', colour: 'yellow', done: false };
        await ws.editNoteAt(5, 6);
        assert.strictEqual(N.at(1, 5, 6), null, 'an empty edit deletes');
        D.Undo.undo();
        assert.ok(N.at(1, 5, 6), 'and undo brings it back');
        console.log('PASS each change is one undo step');
    }

    // 4. The right-click entries.
    {
        assert.deepStrictEqual(ws.noteMenuItems(0, 0).map(i => i.label), ['Add Note Here...']);
        assert.deepStrictEqual(ws.noteMenuItems(5, 6).map(i => i.label), ['Edit Note...', 'Mark Done', 'Delete Note']);
        const built = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
        assert.ok(built.includes('items.push(...this.noteMenuItems(coords.tileX, coords.tileY));'), 'on the empty map\'s right-click menu');
        console.log('PASS the right-click entries');
    }

    // 5. On the map: a pin per note, the hovered one's words; hidden in 3D and when turned off.
    {
        N.add(1, { x: 8, y: 2, text: 'Done one', colour: 'red' });
        N.update(1, N.at(1, 8, 2).id, { done: true });
        const calls = [];
        const g = new Proxy({}, { get: (t, k) => (...args) => calls.push([k, args]) });
        ws._cursor = { tileX: 5, tileY: 6 };
        ws.drawNotes(g);
        const circles = calls.filter(c => c[0] === 'drawCircle');
        assert.strictEqual(circles.length, 2, 'a pin per note');
        const fills = calls.filter(c => c[0] === 'beginFill').map(c => c[1]);
        assert.strictEqual(fills[0][0], D.Ui.mapColor('noteGreen'), 'its own colour');
        assert.ok(fills.some(f => f[0] === D.Ui.mapColor('noteRed') && f[1] < 1), 'a done note is faded');
        const tip = byId['dd-note-tip'];
        assert.ok(tip && tip.style.display === '' && tip.textContent === 'Put a chest here', 'the words while hovered');
        assert.strictEqual(tip.style.left, (100 + 6 * 48 + 4) + 'px');
        ws._cursor = { tileX: 0, tileY: 0 };
        ws.drawNotes(g);
        assert.strictEqual(tip.style.display, 'none');
        calls.length = 0;
        ws.toggleNotes(false);
        ws.drawNotes(g);
        assert.strictEqual(calls.length, 0, 'hidden');
        ws.toggleNotes(true);
        D.Perspective.liveCamera = () => ({});
        ws.drawNotes(g);
        assert.strictEqual(calls.length, 0, 'not in 3D');
        D.Perspective.liveCamera = () => null;
        mapId = 3;
        ws.drawNotes(g);
        assert.strictEqual(calls.length, 0, "another map's notes aren't drawn here");
        mapId = 1;
        // Drawn by the tool hooks' overlays, which draw on the editor's overlay; Capture hides that overlay.
        assert.strictEqual(typeof ws.toolHooks.notes.overlay, 'function');
        const built = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
        assert.ok(/const outline = spriteset\._docsSelectionOutline;[\s\S]{0,120}outline\.visible = false/.test(built), 'Capture leaves the overlay out');
        console.log('PASS pins, hover, hidden, not in 3D, left out of Capture');
    }

    // 6. The Notes card: this map or every map; Go To another map.
    {
        N.add(2, { x: 1, y: 1, text: 'On map 2' });
        ws.showNotesCard();
        const list = () => byId['dd-nt-list'].childNodes;
        assert.strictEqual(list().length, 2, "this map's two notes");
        assert.ok(/1 to do, 1 done/.test(byId['dd-notes'].innerHTML));
        byId['dd-nt-scope'].value = 'all';
        byId['dd-nt-scope'].onchange();
        assert.strictEqual(list().length, 3, 'every map');
        const row = list().find(r => r.childNodes[1].textContent === 'On map 2');
        assert.strictEqual(row.childNodes[2].textContent, 'Map 2 · 1, 1');
        let went = null;
        ws.goToMap = id => { went = id; };
        row.childNodes[3].onclick();
        assert.strictEqual(went, 2, 'Go To opens the map');
        row.childNodes[0].checked = true;
        row.childNodes[0].onchange();
        assert.strictEqual(N.at(2, 1, 1).done, true, 'ticked from the card');
        list().find(r => r.childNodes[1].textContent === 'On map 2').childNodes[4].onclick();
        assert.strictEqual(N.at(2, 1, 1), null, 'deleted from the card');
        ws.closeNotes();
        assert.ok(!byId['dd-notes'] && !byId['dd-note-tip']);
        console.log('PASS the Notes card');
    }

    console.log('\nAll map notes tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
