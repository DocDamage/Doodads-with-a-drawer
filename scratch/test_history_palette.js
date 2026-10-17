// scratch/test_history_palette.js
// Visual save history (what changed since a backup, restoring single doodads and events), the Ctrl+K
// command palette (fuzzy matching and ranking), and which drawer thumbnails animate on hover.
const assert = require('assert');

console.log("=== Testing Save History, Command Palette & Animated Thumbnails ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const ws = DocsDoodads.Workspace;
const Undo = DocsDoodads.Undo;
const H = DocsDoodads.History;
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
const doodad = (props) => Object.assign(DocsDoodads.standardStruct(), { bit: [3, 'img/doodads/a.png'] }, props);

// 1. Doodad differences: matched by uid (or by art and spot for older data).
const keep = doodad({ uid: 'k', x: 10, y: 10 });
const movedNow = doodad({ uid: 'm', x: 50, y: 10 });
const movedThen = doodad({ uid: 'm', x: 20, y: 10 });
const newOne = doodad({ uid: 'n', x: 99, y: 99 });
const deleted = doodad({ uid: 'd', x: 70, y: 70 });
const legacyBoth = doodad({ x: 5, y: 6 });
const diff = H.diffDoodads([keep, movedNow, newOne, legacyBoth], [JSON.parse(JSON.stringify(keep)), movedThen, deleted, JSON.parse(JSON.stringify(legacyBoth))]);
assert.deepStrictEqual(diff.added.map(d => d.uid), ['n']);
assert.deepStrictEqual(diff.removed.map(d => d.uid), ['d']);
assert.deepStrictEqual(diff.changed.map(c => [c.current.x, c.backup.x]), [[50, 20]]);
assert.strictEqual(diff.unchanged, 2);
assert.deepStrictEqual(H.diffDoodads([], []), { added: [], removed: [], changed: [], unchanged: 0 });

// Events: matched by id.
const evNow = [null, { id: 1, name: 'Door', x: 1, y: 1 }, { id: 2, name: 'Chest', x: 5, y: 5 }];
const evThen = [null, { id: 1, name: 'Door', x: 1, y: 1 }, null, { id: 3, name: 'Sign', x: 2, y: 2 }];
const evDiff = H.diffEvents(evNow, evThen);
assert.deepStrictEqual([evDiff.added.map(e => e.id), evDiff.removed.map(e => e.id), evDiff.changed.length, evDiff.unchanged], [[2], [3], 0, 1]);

// Backups are read from file names: newest first, with a readable date.
const label = H.backupLabel({ name: 'DocsDoodads.json.2026-10-17T20-17-21-609Z.bak', mtimeMs: Date.UTC(2026, 9, 17, 20, 17, 21) });
assert.ok(/2026/.test(label));

// 2. Restoring single items, each one undoable.
$dataDocsDoodads[1] = [keep, movedNow, newOne];
ws.restoreHistoryItem({ kind: 'removed', backup: deleted });
assert.ok($dataDocsDoodads[1].some(d => d.uid === 'd'), "a deleted doodad comes back");
ws.restoreHistoryItem({ kind: 'changed', current: movedNow, backup: movedThen });
assert.strictEqual(movedNow.x, 20, "a changed doodad goes back in place");
ws.restoreHistoryItem({ kind: 'added', current: newOne });
assert.ok(!$dataDocsDoodads[1].includes(newOne), "an added doodad is removed");
Undo.undo(); Undo.undo(); Undo.undo();
assert.deepStrictEqual($dataDocsDoodads[1].map(d => d.uid), ['k', 'm', 'n']);
assert.strictEqual(movedNow.x, 50);
// Restoring an event stages it into the map, as editor event edits do.
$gameMap._stagedMapData = { events: [null, { id: 1, name: 'Door' }] };
$gameMap._stagedMapDataId = 1;
ws.restoreHistoryItem({ kind: 'removedEvent', backup: { id: 3, name: 'Sign', x: 2, y: 2 } });
assert.strictEqual($gameMap._stagedMapData.events[3].name, 'Sign');
assert.strictEqual(DocsDoodads.Persistence.dirtyMap, true);
Undo.undo();
assert.strictEqual($gameMap._stagedMapData.events[3], undefined);

// New doodads always get a uid, so history can follow them from now on.
const asset = { id: 'img/doodads/a.png', path: 'img/doodads/a.png', fileName: 'a.png', width: 48, height: 48, tags: [], autoTags: [], placement: {}, collision: {} };
assert.ok(ws.newDoodadFromAsset(asset, 0, 0).uid);

// 3. Command palette: fuzzy matching, word starts and exact runs rank first.
const P = DocsDoodads.CommandPalette;
assert.ok(P.score('ptfx', 'Open Post FX') > 0, "letters in order match");
assert.strictEqual(P.score('xyz', 'Open Post FX'), -1);
assert.ok(P.score('post', 'Open Post FX') > P.score('post', 'Paste Objects Selected Twice'), "a whole word beats scattered letters");
assert.ok(P.score('save', 'Save Changes') > P.score('save', 'Show Asset Viewer Editor'));
assert.ok(P.score('', 'Anything') >= 0, "an empty query lists everything");
const items = [{ label: 'Save Changes' }, { label: 'Go to map: Starting Town' }, { label: 'Toggle Grid' }, { label: 'Post FX: Apply Noir' }];
assert.deepStrictEqual(P.rank('town', items, 10).map(i => i.label), ['Go to map: Starting Town']);
assert.deepStrictEqual(P.rank('', items, 2).length, 2, "limited");
// The editor provides commands from every tool, maps, presets and assets.
const commands = ws.paletteCommands();
for (const label of ['Save Changes', 'Undo', 'Toggle Grid', 'Open Post FX', 'Open VFX Builder', 'Open Save History', 'Dress This Map', 'Symmetry: Mirror Left/Right']) {
    assert.ok(commands.some(c => c.label === label), `palette offers ${label}`);
}
assert.ok(commands.every(c => typeof c.run === 'function'));

// 4. Animated thumbnails: which assets have frames to play.
const T = DocsDoodads.AnimatedThumb;
const single = T.framesFor({ path: 'img/characters/$Big.png', fileName: '$Big.png', type: 'single_character', width: 144, height: 192 });
assert.deepStrictEqual(single.map(f => f.x), [0, 48, 96, 48], "walking down, MZ order");
assert.ok(single.every(f => f.y === 0 && f.w === 48 && f.h === 48));
const sheet = T.framesFor({ path: 'img/characters/Actor1.png', fileName: 'Actor1.png', type: 'character_sheet', width: 576, height: 384 });
assert.deepStrictEqual(sheet.map(f => [f.x, f.w, f.h]), [[0, 48, 48], [48, 48, 48], [96, 48, 48], [48, 48, 48]], "the first character");
const tagged = T.framesFor({ path: 'img/characters/Hero[f6].png', fileName: 'Hero[f6].png', type: 'character_sheet', width: 288, height: 192 });
assert.strictEqual(tagged.length, 6);
const strip = T.framesFor({ path: 'img/doodads/fire.png', fileName: 'fire.png', width: 160, height: 32,
    slice: { regions: [0, 1, 2, 3, 4].map(i => ({ x: i * 32, y: 0, w: 32, h: 32 })) } });
assert.strictEqual(strip.length, 5, "equal-sized slices play as frames");
assert.strictEqual(T.framesFor({ path: 'img/doodads/rock.png', fileName: 'rock.png', width: 64, height: 64 }), null, "a single image doesn't animate");
assert.strictEqual(T.framesFor({ path: 'img/doodads/set.png', fileName: 'set.png', width: 96, height: 32,
    slice: { regions: [{ x: 0, y: 0, w: 32, h: 32 }, { x: 32, y: 0, w: 64, h: 32 }] } }), null, "mixed-size slices are a sprite set, not an animation");

console.log("✓ History diffs, item restore, uids, palette scoring and commands, and animated thumbnail frames verified.");
