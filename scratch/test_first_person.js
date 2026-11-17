// First-person 3D: terrain-relative eye camera, player-facing yaw, camera-relative steps and turns,
// near-billboard fading, editor suspension, and command/API/settings integration.
'use strict';

const assert = require('assert');
const fs = require('fs');
const E = require('./engine/fake_engine');

console.log('=== Testing First-person 3D Camera ===');

E.install();
E.setupWorld({ width: 20, height: 18, px: 19, py: 8, mapId: 1, tileSize: 32, scrollType: 2 });
global.TouchInput = { x: 0, y: 0 };
global.Input = { dir4: 0, isTriggered: () => false };
global.$dataDocsDoodads = { 1: [], mapSettings: { 1: { perspective: { enabled: true, mode: 'first', eyeHeight: 0.8, mouseLook: true } } } };

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Persisted settings are conservative: existing maps stay orbit; first-person defaults to a wide,
// level view with an eye 0.8 tile above the terrain.
const orbit = P.normalize({ enabled: true });
assert.strictEqual(orbit.mode, 'orbit');
assert.strictEqual(orbit.pitch, 55, 'ordinary orbit defaults do not change');
const first = P.normalize({ enabled: true, mode: 'first', eyeHeight: 9, nearFade: -1, mouseLook: true });
assert.deepStrictEqual([first.mode, first.eyeHeight, first.nearFade, first.mouseLook], ['first', 2, 0, true]);
assert.strictEqual(first.firstPitch, 0);
assert.strictEqual(first.firstFov, 75);

// 2. Facing is the first camera yaw. The eye uses tile width for X, tile height for Y/Z, the map's
// loop-aware local coordinates, and the terrain under the player's feet.
assert.deepStrictEqual([P.facingYaw(8), P.facingYaw(6), P.facingYaw(2), P.facingYaw(4)], [0, 90, 180, 270]);
assert.deepStrictEqual([P.directionForYaw(2), P.directionForYaw(92), P.directionForYaw(181), P.directionForYaw(271)], [8, 6, 2, 4]);
$gameMap.setDisplayPos(17, 0);
$gamePlayer.locate(19, 8);
$gamePlayer.setDirection(6);
const fp = P.firstPerson(first, $gamePlayer, { map: $gameMap, groundHeight: 48 });
assert.ok(near(fp.eye.x, 2.5 * 32), 'loop-aware X is local to the camera texture');
assert.ok(near(fp.eye.y, 9 * 32), 'Y uses tile height and the character foot');
assert.ok(near(fp.eye.z, 48 + 0.8 * 32), 'eye is terrain height plus eyeHeight tiles');
assert.strictEqual(fp.yaw, 90);
assert.strictEqual(fp.fov, 75);
const eyeCam = P.camera({ target: fp.target, eye: fp.eye, pitch: fp.pitch, yaw: fp.yaw, fov: fp.fov, zoom: 1, width: 800, height: 600 });
assert.deepStrictEqual(eyeCam.C, fp.eye, 'the renderer uses the explicit first-person eye');
const oldCam = P.camera({ target: { x: 10, y: 20 }, pitch: 55, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
assert.ok(oldCam.C.y > 20 && oldCam.C.z > 0, 'orbit camera geometry is unchanged');

// 3. Render-only visibility: only the player disappears; followers remain. Near objects fade smoothly.
const playerSprite = { _character: $gamePlayer };
const follower = new Game_Follower(1);
const followerSprite = { _character: follower };
assert.strictEqual(P.hideFirstPersonPlayer(playerSprite, first, $gamePlayer), true);
assert.strictEqual(P.hideFirstPersonPlayer(followerSprite, first, $gamePlayer), false);
assert.deepStrictEqual([P.nearFadeAlpha(0, 32), P.nearFadeAlpha(16, 32), P.nearFadeAlpha(32, 32)], [0, 0.5, 1]);

// 4. Pure controls: left/right turn rather than strafe; up walks forward, down steps backward without
// changing the player's facing. Arbitrary mouse yaw rounds movement/action facing to the nearest side.
assert.deepStrictEqual(P.firstInput(4, 90), { direction: 0, turn: -90, backstep: false });
assert.deepStrictEqual(P.firstInput(6, 90), { direction: 0, turn: 90, backstep: false });
assert.deepStrictEqual(P.firstInput(8, 90), { direction: 6, turn: 0, backstep: false });
assert.deepStrictEqual(P.firstInput(2, 90), { direction: 4, turn: 0, backstep: true });
assert.strictEqual(P.directionForYaw(137), 2);

// 5. Editing temporarily uses orbit without changing the saved mode; runtime state returns afterward.
const edited = P.forDisplay(first, true);
assert.strictEqual(edited.mode, 'orbit');
assert.strictEqual(first.mode, 'first');
assert.strictEqual(P.forDisplay(first, false), first);

// 6. Map panel, Set Camera and public API expose the mode without editor-only dependencies.
const panel = fs.readFileSync(require('path').join(__dirname, '..', 'src', '40_workspace_map_panel_3d_first_person.js'), 'utf8');
assert.match(panel, /mode/);
assert.match(panel, /eyeHeight/);
assert.match(panel, /mouseLook/);
const header = fs.readFileSync(require('path').join(__dirname, '..', 'src', '00_header_and_plugin_parameters.js'), 'utf8');
assert.match(header, /@arg cameraMode/);
assert.strictEqual(typeof DocsDoodads.API.camera3d, 'function');

console.log('✓ First-person settings, eye geometry, visibility, controls, editor suspension, command and API surfaces verified.');
