// scratch/test_minimap_flat.js
// The minimap on flat maps and its fog of war (6.2.13): World > Minimap turns it on for flat maps (a map
// can say on or off), the explored bits are kept per map and written into the save, walking reveals
// around the player, the minimap and world map show only what was seen, and the Show / Hide Minimap and
// Explored Map commands. Run on the stand-in engine.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Flat Minimap and Fog of War ===');

E.install();
E.setupWorld({ width: 30, height: 20, px: 10, py: 10, tilesetMode: 0, tiles: [] });
const commands = {};
const register = PluginManager.registerCommand;
PluginManager.registerCommand = (plugin, name, fn) => { commands[name] = fn; if (register) register.call(PluginManager, plugin, name, fn); };
// MZ's Game_System and its onBeforeSave (the stand-in engine has a plain $gameSystem).
global.Game_System = function() {};
Game_System.prototype.onBeforeSave = function() {};
require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.Minimap, X = D.Explored;

// 1. The explored bits: a circle, kept per map, a size change starts again, encode and decode.
X._maps = {};
const seen = X.reveal(1, 30, 20, 10, 10, 3);
assert.ok(seen.length >= 28 && seen.length <= 30, 'about a circle of radius 3: ' + seen.length);
const m = X.entry(1, 30, 20);
assert.ok(X.isExplored(m, 10, 10) && X.isExplored(m, 13, 10) && !X.isExplored(m, 14, 10) && !X.isExplored(m, 13, 13));
assert.strictEqual(X.reveal(1, 30, 20, 10, 10, 3).length, 0, 'nothing new the second time');
assert.ok(X.reveal(1, 30, 20, 0, 0, 2).every(t => t.x >= 0 && t.y >= 0), 'stays inside the map');
const bytes = new Uint8Array([1, 2, 255, 0, 128]);
assert.deepStrictEqual(Array.from(X.decode(X.encode(bytes), 5)), [1, 2, 255, 0, 128]);
assert.deepStrictEqual(Array.from(X.decode('not base64!!', 3)), [0, 0, 0], 'a broken save starts unexplored');

// Into the save, and back from it.
assert.strictEqual(X.writeBack(), 1);
assert.ok($gameSystem._docsExplored[1].bits && $gameSystem._docsExplored[1].w === 30);
assert.strictEqual(X.writeBack(), 0, 'nothing changed since');
X._maps = {};
assert.ok(X.isExplored(X.entry(1, 30, 20), 10, 10), 'read back from the save');
assert.ok(!X.isExplored(X.entry(1, 31, 20), 10, 10), 'a map that changed size starts again');
X._maps = {};
// onBeforeSave writes it.
X.reveal(1, 30, 20, 25, 15, 1);
Game_System.prototype.onBeforeSave.call($gameSystem);
X._maps = {};
assert.ok(X.isExplored(X.entry(1, 30, 20), 25, 15), 'a save keeps what was seen');
// A new game is a new $gameSystem: nothing seen.
const oldSystem = $gameSystem;
global.$gameSystem = { _docsFeatureOff: {} };
assert.ok(!X.isExplored(X.entry(1, 30, 20), 10, 10), 'a new game starts unexplored');
global.$gameSystem = oldSystem;
X.system();
assert.ok(X.fraction(1, 30, 20) > 0 && X.fraction(1, 30, 20) < 0.2);
console.log('✓ explored bits: circles, per map, saved, a new game starts again');

// 2. Fog on the pixels: unseen tiles dark, seen ones as they were.
const px = M.pixels(30, 20, () => ({}));
const fogged = M.withFog(px, 30, 20, X.entry(1, 30, 20));
const at = (p, x, y) => Array.from(p.slice((y * 30 + x) * 4, (y * 30 + x) * 4 + 3));
assert.deepStrictEqual(at(fogged, 10, 10), M.colors.ground);
assert.deepStrictEqual(at(fogged, 0, 19), M.fogColor);
console.log('✓ fog on the minimap pixels');

// 3. Settings: off by default on flat maps; World > Minimap; a map's own choice; 3D keeps its switch.
assert.strictEqual(M.settingsFor(1).on, false);
D.World.set('minimap.flat', true);
D.World.set('minimap.fog', true);
D.World.set('minimap.radius', 4);
assert.deepStrictEqual(M.settingsFor(1), { on: true, fog: true, radius: 4, size: 140 });
D.Lighting.setMapSettings(1, { minimap: 'off' });
assert.strictEqual(M.settingsFor(1).on, false, 'the map says off');
D.Lighting.setMapSettings(1, { minimap: 'on' });
D.World.set('minimap.flat', false);
assert.strictEqual(M.settingsFor(1).on, true, 'the map says on');
D.Lighting.setMapSettings(1, { minimap: undefined, perspective: { enabled: true, minimap: false } });
assert.strictEqual(M.settingsFor(1).on, false, 'a 3D map follows its own 3D switch');
D.Lighting.setMapSettings(1, { perspective: undefined, minimap: 'on' });
console.log('✓ settings: World > Minimap, the map\'s own choice, 3D maps');

// 4. On the map: a minimap appears, walking reveals, the picture updates, commands hide it and reveal.
X._maps = {};
$gameSystem._docsExplored = {};
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 3);
assert.ok(ss._docsMinimap && ss._docsMinimap.visible, 'a flat map has a minimap');
const v1 = X.entry(1, 30, 20).version;
assert.ok(v1 > 0 && ss._docsMinimap._docsVersion === v1, 'the start is revealed and drawn');
$gamePlayer.locate(20, 10);
E.frames(ss, 2);
assert.ok(X.isExplored(X.entry(1, 30, 20), 22, 10), 'walking reveals');
assert.strictEqual(ss._docsMinimap._docsVersion, X.entry(1, 30, 20).version, 'redrawn with the new tiles');
commands.setMinimap({ show: 'false' });
E.frames(ss, 1);
assert.ok(!ss._docsMinimap.visible, 'hidden by the command');
$gamePlayer.locate(28, 18);
E.frames(ss, 1);
assert.ok(X.isExplored(X.entry(1, 30, 20), 28, 18), 'still exploring while hidden');
commands.setMinimap({ show: 'true' });
E.frames(ss, 1);
assert.ok(ss._docsMinimap.visible);
commands.exploredMap({ action: 'all', mapId: 0 });
assert.strictEqual(X.fraction(1, 30, 20), 1);
commands.exploredMap({ action: 'forget', mapId: 0 });
assert.strictEqual(X.fraction(1, 30, 20), 0);
commands.exploredMap({ action: 'around', radius: 2, mapId: 0 });
assert.ok(X.fraction(1, 30, 20) > 0);
assert.strictEqual(commands.exploredMap({ action: 'all', mapId: 99 }), false, 'a map never visited is left alone');
// Editing hides it.
D.Workspace.mounted = true;
E.frames(ss, 1);
assert.ok(!ss._docsMinimap.visible, 'not while editing');
D.Workspace.mounted = false;
// Fog off: the picture has no fog and nothing more is revealed.
D.World.set('minimap.fog', false);
const before = X.entry(1, 30, 20).version;
$gamePlayer.locate(2, 2);
E.frames(ss, 2);
assert.strictEqual(X.entry(1, 30, 20).version, before, 'no exploring without fog');
assert.strictEqual(ss._docsMinimap._docsFog, false, 'rebuilt without fog');
console.log('✓ on the map: shown, revealed while walking, redrawn, commands, hidden while editing');

// 5. The map panel section.
const html = D.Workspace.mapSections.map(s => s.render.call(D.Workspace, { minimap: 'on' })).join('');
assert.ok(/dd-minimap-mode/.test(html) && /value="on" selected/.test(html));

console.log('=== Flat minimap and fog of war passed ===');
