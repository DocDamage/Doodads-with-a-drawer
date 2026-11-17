// The shipped game-only plugin: editor parts are omitted without dropping runtime behavior. The text
// parses, is less than half the full plugin, and runs doodads, lights, sound, collision, states, touch,
// traversal, packed pictures and 3D on the stand-in MZ engine without defining the editor workspace.
const assert = require('assert');
const vm = require('vm');
const path = require('path');
const E = require('./engine/fake_engine');
const { build } = require('../scripts/build');

console.log('=== Testing Game-only Build ===');

const full = build();
const game = build({ game: true });
const fullBytes = Buffer.byteLength(full.text, 'utf8');
const gameBytes = Buffer.byteLength(game.text, 'utf8');
assert.ok(game.parts.length < full.parts.length, 'game build leaves out marked editor parts');
assert.ok(gameBytes <= fullBytes / 2, `game build is at most half the full plugin (${gameBytes}/${fullBytes} bytes)`);
assert.ok(game.text.includes('@target MZ') && game.text.includes('@param editorMode'), 'the complete MZ plugin header remains');
assert.doesNotThrow(() => new vm.Script(game.text, { filename: 'Docs-Doodads.game.js' }), 'game build parses');
for (const object of ['Scatter', 'Biome', 'Dress']) {
    const assignment = new RegExp('DocsDoodads\\.' + object + '\\s*=', 'g');
    assert.strictEqual((full.text.match(assignment) || []).length, 1, object + ' has one shared implementation in the full build');
    assert.strictEqual((game.text.match(assignment) || []).length, 1, object + ' has the same shared implementation in the game build');
}

E.install();
E.setupWorld({ width: 24, height: 18, px: 4, py: 4, tiles: [[6, 5, 0, 2048]] });
const reserved = [];
$gameTemp.reserveCommonEvent = id => reserved.push(id);
$gameTemp.isCommonEventReserved = () => false;
vm.runInThisContext(game.text, { filename: 'Docs-Doodads.game.js' });

const D = global.DocsDoodads;
assert.ok(D && D.Collision && D.Packer && D.Layers, 'runtime dependencies remain');
assert.strictEqual(D.Workspace, undefined, 'editor workspace is absent');
assert.ok(D.Generate && D.GenerateRuntime && D.Rooms && D.Tiles, 'generated-map parts remain without the editor');
const authoredMapData = $dataMap.data.slice();
D.GenerateRuntime.queue({ mapId: 1, kind: 'dungeon', seed: 17, w: 24, h: 18, count: 2, floorTile: 2816, wallTile: 4352 });
$gameMap.setup(1);
assert.ok($dataMap.data.some(tileId => tileId === 4352), 'a seeded map is generated before game-only map setup');
delete $gameSystem._docsGeneratedMaps[1];
$dataMap.data = authoredMapData;
$gameMap.setup(1);

const door = E.doodad(5, 5, {
    name: 'Runtime Door', uid: 'runtime-door', frameW: 48, frameH: 48,
    collision: { preset: 'full', shape: null },
    light: { enabled: true, when: 'always', radius: 120, intensity: 1 },
    sound: { file: 'bgs/River', volume: 80, pitch: 100, radius: 8 },
    touch: { commonEventId: 7, trigger: 'action', nextState: true },
    states: { by: 'events', fade: 0, list: [
        { name: 'Closed', light: true, collision: true },
        { name: 'Open', light: false, collision: false }
    ] }
});
$dataDocsDoodads[1] = [door];

assert.ok(D.Collision.blocksTile(5, 5), 'collision runs');
assert.ok(D.Touch.run(door, 1), 'touch runs');
assert.deepStrictEqual(reserved, [7]);
assert.strictEqual(D.States.name(door, 1), 'Open', 'touch advances state');
assert.ok(!D.Collision.blocksTile(5, 5), 'state can remove collision');
assert.ok(D.SpatialSound.normalizeEmitter(door.sound).loop, 'spatial sound runs');
assert.ok(D.Traversal.isWater(6, 5), 'traversal runs');

const key = D.Packer.keyFor(door);
D.Packer.data = { version: 1, maps: { 1: { sheets: ['img/doodads/_packed/Map001_0.png'], frames: {
    [key]: { sheet: 0, x: 2, y: 3, w: 48, h: 48 }
} } } };
assert.deepStrictEqual(D.Packer.resolve(D.Packer.forMap(1), door), {
    sheet: 'img/doodads/_packed/Map001_0.png', x: 2, y: 3, w: 48, h: 48
}, 'packed art resolves');

D.World.set('traversal.jump.enabled', true);
D.Lighting.setMapSettings(1, {
    ambient: { darkness: 0.4, color: '#101830' },
    perspective: { enabled: true, pitch: 50, viewTiles: 18, minimap: true },
    terrain: { enabled: true, style: 'stepped', auto: false, paint: { '5,5': 1 } }
});
const spriteset = new Spriteset_Map();
SceneManager._scene = { _spriteset: spriteset };
assert.doesNotThrow(() => E.frames(spriteset, 5), 'runtime frames');
assert.ok(spriteset._docs3d && spriteset._docsTerrainTopo, '3D terrain runs');
assert.ok(spriteset._docsLightOverlay, 'lights run');
assert.ok(spriteset._docsMinimap && spriteset._docsMinimap.visible, 'minimap runs');

console.log(`✓ Game-only build: ${game.parts.length}/${full.parts.length} parts, ${gameBytes}/${fullBytes} bytes; runtime systems work without Workspace.`);
