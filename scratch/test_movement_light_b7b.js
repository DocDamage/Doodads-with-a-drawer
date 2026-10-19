// scratch/test_movement_light_b7b.js
// Phase B7b (§12.1 of docs/CREATOR_IMPROVEMENTS_PLAN.md): distance detail in 3D (12.1.1), traversal for
// events (tags, hooks, a landing height, a jump for move routes; 12.1.6), collision variants (12.1.8),
// destination feedback (12.1.9), light stopped by doodads and doors, with a switch or condition per light
// (12.1.10), a free camera and zoom to a point (12.1.11), and the required-assets list (12.1.14).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const E = require('./engine/fake_engine');

console.log('=== Testing Movement, Collision, Light and Camera (B7b) ===');

E.install();
const WALL = 20, WATER = 2048;
const tiles = [];
for (let y = 0; y < 20; y++) tiles.push([15, y, 0, WALL]);
for (let x = 2; x < 6; x++) tiles.push([x, 15, 0, WATER]);
E.setupWorld({ width: 30, height: 20, px: 10, py: 10, tiles, flags: { [WALL]: 0x0f, [WATER]: 0x0f } });
const ledge = E.doodad(10, 8, { uid: 'ledge', collision: { preset: 'full', shape: null, oneWay: 'up' }, frameW: 48, frameH: 48 });
const fence = E.doodad(12, 10, { uid: 'fence', collision: { preset: 'full', shape: null, who: 'events' }, frameW: 48, frameH: 48 });
const gate = E.doodad(8, 10, { uid: 'gate', name: 'Gate', collision: { preset: 'full', shape: null }, frameW: 48, frameH: 48,
    states: { by: 'events', list: [{ name: 'Shut' }, { name: 'Open', collisionPreset: 'bottomThird' }] } });
const chest = E.doodad(20, 5, { uid: 'chest', name: 'Chest', collision: { preset: 'full', shape: null }, frameW: 48, frameH: 48,
    touch: { commonEventId: 7, trigger: 'action' } });
const lamp = E.doodad(24, 12, { uid: 'lamp', light: { enabled: true, when: 'always', radius: 200, switchId: 9 } });
$dataDocsDoodads[1] = [ledge, fence, gate, chest, lamp];
$dataMap.events = [null,
    { id: 1, name: 'Bird', note: '<docs fly: 32>', x: 14, y: 4, pages: [{ list: [], image: { characterName: 'Bird' } }] },
    { id: 2, name: 'Fish', note: '<docs swim>', x: 3, y: 14, pages: [{ list: [], image: { characterName: 'Fish' } }] },
    { id: 3, name: 'Door', note: '<block light>', x: 22, y: 12, pages: [{ list: [], image: { characterName: 'Door' } }] }];
// MZ's Game_Temp keeps the clicked destination (the stand-in engine has only a plain object).
global.Game_Temp = class {
    setDestination(x, y) { this._destinationX = x; this._destinationY = y; }
    clearDestination() { this._destinationX = null; this._destinationY = null; }
};
require('../Docs-Doodads.js');
Object.setPrototypeOf($gameTemp, Game_Temp.prototype);
const D = DocsDoodads, api = D.api;
const reserved = [];
$gameTemp.reserveCommonEvent = id => reserved.push(id);
$gameTemp.isCommonEventReserved = () => false;
for (const id of [1, 2, 3]) {
    const ev = new Game_Event(1, id);
    ev.locate($dataMap.events[id].x, $dataMap.events[id].y);
    ev._characterName = $dataMap.events[id].pages[0].image.characterName;
    $gameMap._events[id] = ev;
}
const [bird, fish, door] = [1, 2, 3].map(id => $gameMap.event(id));
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);

// 1. Collision variants: one way, who it stops, a shape per state.
$gamePlayer.locate(10, 7);
assert.strictEqual($gamePlayer.canPass(10, 7, 2), false, 'the ledge stops going down onto it');
$gamePlayer.locate(10, 9);
assert.strictEqual($gamePlayer.canPass(10, 9, 8), true, 'but can be crossed going up');
$gamePlayer.locate(11, 10);
assert.strictEqual($gamePlayer.canPass(11, 10, 6), true, 'a fence for events lets the player by');
const walker = new Game_Event(1, 9);
walker.locate(11, 10);
assert.strictEqual(walker.canPass(11, 10, 6), false, 'and stops events');
$gamePlayer.locate(7, 10);
assert.strictEqual($gamePlayer.canPass(7, 10, 6), false, 'the shut gate blocks');
api.setState('Gate', 'Open');
E.frames(ss, 1);
const openBody = D.Collision.bodyOf(gate);
assert.ok(Math.abs(openBody.h - 0.33 * 48) < 1e-9 && Math.abs(openBody.y + openBody.h - 11 * 48) < 1e-6, 'the open gate keeps its bottom third');
api.setState('Gate', 'Shut');
console.log('✓ Collision: one way, events only, a shape per state.');

// 2. Traversal for events: a flyer crosses the wall, drawn up; a swimmer enters water; hooks; landing; jump.
bird.locate(14, 4);
assert.strictEqual(bird.canPass(14, 4, 6), true, 'a <docs fly> event crosses the wall');
assert.strictEqual(D.Traversal.liftOf(bird), 32, 'drawn 32 pixels up');
assert.ok(bird.screenZ() >= 5, 'over roofs');
fish.locate(3, 14);
assert.strictEqual(fish.canPass(3, 14, 2), true, 'a <docs swim> event goes into the water');
assert.strictEqual(walker.canPass(3, 14, 2), false, 'others do not');
D.World.set('traversal', { fly: { enabled: true, takeOffEvent: 11, landEvent: 12, landMaxHeight: 1 }, jump: { enabled: true, distance: 2 } });
const heard = [];
const off = ['takeOff', 'land'].map(n => api.on(n, () => heard.push(n)));
$gamePlayer.locate(20, 12);
assert.strictEqual(D.Traversal.takeOff(), true);
assert.strictEqual(D.Traversal.land(), true);
assert.deepStrictEqual(heard, ['takeOff', 'land'], 'script events');
assert.deepStrictEqual(reserved.slice(-2), [11, 12], 'and common events');
off.forEach(f => f());
D.Lighting.setMapSettings(1, { perspective: { enabled: true }, terrain: { enabled: true, style: 'stepped', auto: false, paint: { '20,12': 3 } } });
E.frames(ss, 1);
D.Traversal.takeOff();
assert.strictEqual(D.Traversal.canLandHere(), false, 'not on ground higher than the landing height');
D.Lighting.setMapSettings(1, { perspective: { enabled: false }, terrain: { enabled: false } });
E.frames(ss, 1);
assert.strictEqual(D.Traversal.land(), true, 'flat again: lands');
walker.locate(13, 10);
walker.setDirection(4);
const j = walker.docsJump();
assert.ok(j.dx < 0 && walker.isJumping(), 'this.docsJump() in a move route jumps');
D.World.set('traversal', undefined);
console.log('✓ Traversal: flying and swimming events, hooks, landing height, jump in move routes.');

// 3. Destination: an unreachable cross; clicking a touchable doodad walks up and touches it; the map's look.
assert.strictEqual(D.Destination.standable(15, 5), false, 'a wall is unreachable');
assert.strictEqual(D.Destination.standable(16, 5), true);
assert.strictEqual(D.Destination.standable(20, 5), true, 'a touchable doodad counts as a goal');
const dest = new Sprite_Destination();
$gameTemp.isDestinationValid = () => true;
$gameTemp.destinationX = () => 15;
$gameTemp.destinationY = () => 5;
dest.update();
assert.ok(dest._docsUnreachable, 'the marker becomes a cross');
assert.ok(dest._docsStyleSig.startsWith('cross|#ff5a5a'), 'in the unreachable colour');
D.Lighting.setMapSettings(1, { destination: { style: 'ring', color: '#00ff00' } });
assert.strictEqual(D.Destination.current().style, 'ring', "the map's own marker");
D.Lighting.setMapSettings(1, { destination: undefined });
let cleared = false;
$gameTemp.clearDestination = () => { cleared = true; };
$gameTemp.setDestination(20, 5);
assert.strictEqual($gameTemp._docsTouchTarget, chest);
$gamePlayer.locate(20, 7);
$gameMap.updateDocsTouchTarget(true);
assert.ok($gameTemp._docsTouchTarget, 'two tiles away: still walking');
$gamePlayer.locate(20, 6);
const before = reserved.length;
$gameMap.updateDocsTouchTarget(true);
assert.strictEqual(reserved[before], 7, 'next to it: touched');
assert.strictEqual($gamePlayer.direction(), 8, 'facing it');
assert.ok(cleared && !$gameTemp._docsTouchTarget);
console.log('✓ Destination: unreachable cross, click to touch, the map\'s marker.');

// 4. Lights: a switch per light; doodads and doors stop light.
E.frames(ss, 1);
const lit = () => (ss._docsLightInfo ? ss._docsLightInfo.lights : []).some(l => l.doodad === lamp);
D.Lighting.setMapSettings(1, { ambient: { darkness: 0.6, color: '#000000', switchId: 0 } });
E.frames(ss, 2);
assert.strictEqual(lit(), false, 'its switch is off');
$gameSwitches.setValue(9, true);
E.frames(ss, 40);
assert.strictEqual(lit(), true, 'on with its switch');
lamp.light = Object.assign({}, lamp.light, { condition: '$gameVariables.value(3) > 0' });
E.frames(ss, 40);
assert.strictEqual(lit(), false, 'its condition is false');
$gameVariables.setValue(3, 1);
E.frames(ss, 40);
assert.strictEqual(lit(), true);
D.World.set('lighting2d', { occlusion: true, blockEvents: true, blockDoodads: true, rays: 60 });
E.frames(ss, 1);
const blockers = D.Occlusion.blockers();
assert.ok(blockers.tiles.has('22,12'), 'the <block light> door stops light');
assert.ok(blockers.tiles.has('20,5'), 'the chest (a doodad with collision) too');
const light = { mapX: 24 * 48 + 24, mapY: 12 * 48 + 24, radius: 200, shape: 'round', angle: 0, spread: 60 };
const withDoor = D.Occlusion.outlineFor(light, 60);
door.locate(22, 2);
E.frames(ss, 1);
const opened = D.Occlusion.outlineFor(light, 60);
assert.notStrictEqual(opened, withDoor, 'traced again when the door moves');
const reach = pts => { let far = 0; for (let i = 2; i < pts.length; i += 2) far = Math.min(far || Infinity, pts[i]); return far; };
assert.ok(reach(opened) < reach(withDoor), 'and the light reaches further left with it open');
D.World.set('lighting2d', undefined);
console.log('✓ Lights: a switch and condition per light; doors and doodads stop light.');

// 5. The camera: free (stays as the player walks), and zoom to a point.
$gameMap.setDisplayPos(0, 0);
api.freeCamera();
$gamePlayer.locate(25, 15);
$gamePlayer.updateScroll(0, 0);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [0, 0], 'a free camera stays');
api.followCamera();
assert.ok(!D.Camera2D.state().free);
let zoom = null;
$gameScreen.startZoom = (x, y, scale, frames) => { zoom = { x, y, scale, frames }; };
api.zoomTo({ x: 3, y: 4 }, 2, 30);
assert.deepStrictEqual(zoom, { x: 3.5 * 48, y: 4.5 * 48, scale: 2, frames: 30 }, 'zooms in on the tile');
api.zoomTo('player', 1.5, 10);
assert.strictEqual(zoom.x, $gamePlayer.screenX(), 'or on the player');
console.log('✓ Camera: free, follow, zoom to a point.');

// 6. Distance detail in 3D: far doodads drawn without shadow.
const far = E.doodad(28, 1, { uid: 'far', shadow: { enabled: true } });
const near = E.doodad(11, 11, { uid: 'near', shadow: { enabled: true } });
$dataDocsDoodads[1].push(far, near);
ss.addDocsDoodadSprites([far, near]);
$gamePlayer.locate(10, 12);
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 40, lodTiles: 6, fogStart: 30, fogEnd: 40 } });
E.frames(ss, 2);
// The near one stands where the camera looks (its target, in the view's flat pixels).
const target = D.Perspective.liveCamera().target;
near.x = target.x + $gameMap.displayX() * 48;
near.y = target.y + 24 + $gameMap.displayY() * 48;
E.frames(ss, 3);
const sp = d => ss._docsDoodadSprites.find(s => s._data === d);
assert.strictEqual(sp(far)._docsFar3d, true, 'beyond 6 tiles: plain');
assert.ok(!sp(far)._shadowSprite || sp(far)._shadowSprite.renderable === false, 'without its shadow');
assert.strictEqual(sp(near)._docsFar3d, false);
assert.ok(sp(near)._shadowSprite && sp(near)._shadowSprite.renderable, 'a near one keeps it');
D.Lighting.setMapSettings(1, { perspective: { enabled: false } });
console.log('✓ Distance detail: far doodads drawn plain in 3D.');

// 7. The required-assets list for deployments with "Exclude unused files".
const files = D.RequiredAssets.collect({
    doodads: { 1: [{ bit: [3, 'img/doodads/Tree.png'], states: { list: [{}, { path: 'img/doodads/TreeCut.png' }] } }],
        world: { seasons: { sets: [{ 0: 'img/doodads/TreeSpring.png' }] }, characterAnim: { sets: [{ idle: 'Hero_idle[f2]' }] } },
        mapSettings: { 1: { layers2d: [{ image: 'Mountains' }, { image: '#fog' }], perspective: { skyVideo: 'movies/Sky.webm' } } } },
    database: { Armors: [null, { note: '<visual: Cape, sv SV_Cape>' }], Actors: [null, { characterName: 'Hero' }] },
    maps: { 1: { events: [null, { pages: [{ image: { characterName: 'Villager' } }] }] } },
    characters: ['Hero.png', 'Hero_run[f8].png', 'Villager_idle[f2].png', 'Other_idle.png', 'Cape.png']
});
assert.deepStrictEqual(files, ['img/characters/Cape.png', 'img/characters/Hero_idle[f2].png', 'img/characters/Hero_run[f8].png', 'img/characters/Villager_idle[f2].png',
    'img/doodads/Tree.png', 'img/doodads/TreeCut.png', 'img/doodads/TreeSpring.png', 'img/parallaxes/Mountains.png', 'img/sv_actors/SV_Cape.png', 'movies/Sky.webm']);
const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-b7b-'));
const here = process.cwd();
process.chdir(project);
try {
    fs.mkdirSync('data');
    fs.writeFileSync('data/MapInfos.json', '[]');
    const written = D.RequiredAssets.write();
    assert.ok(written.includes('img/doodads/Tree.png'), 'written from the doodads in play');
    assert.ok(JSON.parse(fs.readFileSync('data/DocsDoodadsRequired.json', 'utf8')).files);
} finally {
    process.chdir(here);
    fs.rmSync(project, { recursive: true, force: true });
}
console.log('✓ Required assets: doodads, states, seasons, layers, sky video, Visual Equipment, idle and run sheets.');

console.log('\nAll movement, collision, light and camera (B7b) checks passed.');
