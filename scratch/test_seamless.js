'use strict';
// 7.3.1 Walking from map to map without a transfer: target for each edge with maps of different sizes; no target
// with no link; a blocked destination tile stops the step; looping maps are left alone; the step is a fade-less
// transfer from the cache; the camera may look past a linked edge and keeps the player's place on screen; the
// neighbour's tiles are drawn past the edge; off unless the game turns it on.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-seamless-')));
E.install();
E.setupWorld({ width: 20, height: 15, px: 19, py: 5, flags: { 1600: 0x0f } });
require('../Docs-Doodads.js');
const D = DocsDoodads, S = D.Seamless;

// ---- Pure ----
const sizes = id => ({ 1: { w: 20, h: 15 }, 2: { w: 30, h: 10 }, 3: { w: 12, h: 12 }, 4: { w: 20, h: 8 } })[id] || null;
const links = { east: 2, west: 3, north: 4, south: 4 };
assert.deepStrictEqual(S.target(1, 19, 5, 6, links, sizes), { mapId: 2, x: 0, y: 5, side: 'east' });
assert.strictEqual(S.target(1, 19, 12, 6, links, sizes), null, 'beyond the neighbour\'s height: no landing');
assert.deepStrictEqual(S.target(1, 0, 5, 4, links, sizes), { mapId: 3, x: 11, y: 5, side: 'west' });
assert.deepStrictEqual(S.target(1, 3, 0, 8, links, sizes), { mapId: 4, x: 3, y: 7, side: 'north' });
assert.deepStrictEqual(S.target(1, 3, 14, 2, links, sizes), { mapId: 4, x: 3, y: 0, side: 'south' });
assert.strictEqual(S.target(1, 18, 5, 6, links, sizes), null, 'not at the edge');
assert.strictEqual(S.target(1, 19, 5, 8, links, sizes), null, 'not walking off it');
assert.strictEqual(S.target(1, 19, 5, 6, {}, sizes), null, 'no link');
assert.strictEqual(S.target(1, 19, 5, 6, links, sizes, { x: true }), null, 'a looping map is left alone');
assert.deepStrictEqual(S.offset('east', { w: 20, h: 15 }, { w: 30, h: 10 }), { x: 20, y: 0 });
assert.deepStrictEqual(S.offset('west', { w: 20, h: 15 }, { w: 12, h: 12 }), { x: -12, y: 0 });

// ---- In the game ----
const neighbour = { width: 30, height: 10, tilesetId: 1, scrollType: 0, data: new Array(30 * 10 * 6).fill(0), events: [null] };
for (let i = 0; i < 300; i++) neighbour.data[i] = 2816;
neighbour.data[5 * 30 + 0] = 1600;  // a wall at (0, 5)
S.cache[2] = neighbour;
D.Lighting.setMapSettings(1, { neighbors: { east: 2 } });
const p = $gamePlayer;
p.locate(19, 4);
p.moveStraight(6);
assert.ok(!p._newMapId, 'off unless the game turns it on');
D.World.settings().seamless = { enabled: true };
p.locate(19, 5);
p.moveStraight(6);
assert.ok(!p._newMapId, 'a blocked tile over the edge stops the step');
p.locate(19, 4);
$gameMap.setDisplayPos(3, 0);
p.moveStraight(6);
assert.strictEqual(p._newMapId, 2, 'a step off the edge goes to the neighbour');
assert.deepStrictEqual([p.x, p.y], [0, 4]);
assert.ok(S._carry && Math.abs(S._carry.displayX - (3 - 20)) < 1e-9, 'the camera will keep the player\'s place on screen');
// The next map comes from the cache.
if (typeof DataManager !== 'undefined' && DataManager.loadMapData) {
    DataManager.onLoad = DataManager.onLoad || (() => {});
    DataManager.loadMapData(2);
    assert.strictEqual($dataMap.width, 30, 'no wait on the disk');
    assert.notStrictEqual($dataMap, neighbour, 'a copy');
}
S._carry = null;
p.performTransfer();
D.Lighting.setMapSettings(1, { neighbors: { east: 2 }, seamless: 'off' });
p.locate(19, 4); p.moveStraight(6);
assert.ok(!p._newMapId, 'a map can opt out');
D.Lighting.setMapSettings(1, { neighbors: { east: 2 }, seamless: undefined });

// The camera may look past a linked edge, up to half a screen.
global.$dataMap = Object.assign({}, global.$dataMap);
$gameMap.setDisplayPos(0, 0);
for (let i = 0; i < 40; i++) $gameMap.scrollRight(1);
const sx = $gameMap.screenTileX();
assert.ok(Math.abs($gameMap.displayX() - (20 - sx + sx / 2)) < 1e-9, 'past the linked east edge');
for (let i = 0; i < 40; i++) $gameMap.scrollLeft(1);
assert.strictEqual($gameMap.displayX(), 0, 'but not past an edge with no neighbour');
// A seamless arrival sets the camera where it was carried to.
S._carry = { mapId: 1, displayX: -2, displayY: 0 };
D.Lighting.setMapSettings(1, { neighbors: { east: 2, west: 3 } });
S.cache[3] = { width: 12, height: 12, tilesetId: 1, data: new Array(12 * 12 * 6).fill(2816), events: [null] };
$gameMap.setDisplayPos(5, 0);
assert.strictEqual($gameMap.displayX(), -2, 'the camera carries on from where it was');
assert.strictEqual(S._carry, null);

// The neighbours' tiles past the edge.
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 1);
const east = ss._docsNeighbourMaps.east, west = ss._docsNeighbourMaps.west;
assert.ok(east && east.visible && east._mapWidth === 30, 'the east neighbour\'s tilemap');
assert.strictEqual(east.origin.x, ss._tilemap.origin.x - 20 * 48, 'placed past the east edge');
assert.ok(west && west.origin.x === ss._tilemap.origin.x + 12 * 48, 'and the west one before the west edge');
assert.ok(ss._tilemap.parent.children.indexOf(east) < ss._tilemap.parent.children.indexOf(ss._tilemap), 'behind this map\'s tiles');
S.cache[2].tilesetId = 2;
ss._docsNeighbourMaps.east = null;
E.frames(ss, 1);
assert.ok(!ss._docsNeighbourMaps.east, 'a neighbour with another tileset is not drawn');
D.World.settings().seamless = { enabled: false };
E.frames(ss, 1);
assert.ok(!west.visible, 'off: hidden');
console.log('test_seamless: OK');
