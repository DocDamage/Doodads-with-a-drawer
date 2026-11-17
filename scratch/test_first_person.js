// First-person 3D: terrain-relative eye camera, player-facing yaw, camera-relative steps and turns,
// near-billboard fading, editor suspension, and command/API/settings integration.
'use strict';

const assert = require('assert');
const fs = require('fs');
const E = require('./engine/fake_engine');

console.log('=== Testing First-person 3D Camera ===');

E.install();
E.setupWorld({ width: 80, height: 18, px: 79, py: 8, mapId: 1, tileSize: 32, scrollType: 2 });
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
$gameMap.setDisplayPos(77, 0);
$gamePlayer.locate(79, 8);
$gamePlayer.setDirection(6);
const fp = P.firstPerson(P.normalize({ enabled: true, mode: 'first', eyeHeight: 0.8 }), $gamePlayer, { map: $gameMap, groundHeight: 48 });
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

// 5. The hooked player flow turns once per press and preserves facing on a backward step, so the action
// button still addresses the tile in front of the camera.
DocsDoodads.Workspace.mounted = false;
$gameMap._docsCamera = { mode: 'first', yaw: 90 };
$gameMap._docsFirstPersonMode = true;
P._activeMemo = null;
Input.dir4 = 8;
assert.strictEqual($gamePlayer.getInputDirection(), 6, 'up walks camera-forward');
Input.dir4 = 2;
$gamePlayer.setDirection(6);
const back = $gamePlayer.getInputDirection();
assert.strictEqual(back, 4);
$gamePlayer.executeMove(back);
assert.strictEqual($gamePlayer.direction(), 6, 'backstep keeps action-event facing');
Input.dir4 = 4;
Input.isTriggered = key => key === 'left';
assert.strictEqual($gamePlayer.getInputDirection(), 0);
assert.ok($gameMap._docsCameraTween, 'left begins an eased turn');
assert.strictEqual($gamePlayer.direction(), 8);
$gameMap._docsCameraTween = null;
Input.dir4 = 0;

// The actual 3D pipeline places the camera at eye height and leaves the player out of billboard items,
// while a follower remains part of the normal visibility pipeline.
const followerObject = new Game_Follower(1);
followerObject.locate(0, 8);
$gamePlayer.followers()._data = [followerObject];
$gameMap.setDisplayPos(79 - 19.5, 8 - 19.5);
const spriteset = new Spriteset_Map();
const scene = new Scene_Map();
scene._spriteset = spriteset;
SceneManager._scene = scene;
E.frames(spriteset, 2);
assert.ok(P.liveCamera() && near(P.liveCamera().C.z, 0.8 * 32), 'runtime camera uses first-person eye height');
const playerRender = spriteset._characterSprites.find(sprite => sprite._character === $gamePlayer);
const followerRender = spriteset._characterSprites.find(sprite => sprite._character === followerObject);
assert.ok(!spriteset._docs3dBillboards.items.some(item => item.obj === playerRender), 'player is hidden from first-person billboards');
assert.ok(spriteset._docs3dBillboards.items.some(item => item.obj === followerRender), 'followers stay in the 3D visibility pipeline');

// 6. Editing temporarily uses orbit without changing the saved mode; runtime state returns afterward.
const edited = P.forDisplay(first, true);
assert.strictEqual(edited.mode, 'orbit');
assert.strictEqual(first.mode, 'first');
assert.strictEqual(P.forDisplay(first, false), first);
$gameMap._docsCamera = { mode: 'first', yaw: 90 };
P._activeMemo = null;
DocsDoodads.Workspace.mounted = true;
assert.strictEqual(P.active().mode, 'orbit', 'opening the real workspace suspends first person');
DocsDoodads.Workspace.mounted = false;
assert.strictEqual(P.active().mode, 'first', 'closing the workspace restores first person');

// 7. Map panel, Set Camera and public API expose the mode without editor-only dependencies.
const panel = fs.readFileSync(require('path').join(__dirname, '..', 'src', '44_workspace_first_person.js'), 'utf8');
assert.match(panel, /mode/);
assert.match(panel, /eyeHeight/);
assert.match(panel, /mouseLook/);
const header = fs.readFileSync(require('path').join(__dirname, '..', 'src', '00_header_and_plugin_parameters.js'), 'utf8');
assert.match(header, /@arg cameraMode/);
assert.strictEqual(typeof DocsDoodads.api.camera3d, 'function');
const setCameraKey = Object.keys(PluginManager._commands).find(key => key.endsWith(':setCamera'));
assert.ok(setCameraKey, 'Set Camera command registered');
PluginManager._commands[setCameraKey].call({ wait() {} }, { cameraMode: 'first', eyeHeight: '1.25', mouseLook: 'off', pitch: '-5', fov: '82', duration: '0' });
P._activeMemo = null;
assert.deepStrictEqual([P.active().mode, P.active().eyeHeight, P.active().firstPitch, P.active().firstFov, P.active().mouseLook], ['first', 1.25, -5, 82, false]);
assert.strictEqual(DocsDoodads.api.camera3d({ mode: 'first', mouseLook: true }, 0), true);
P._activeMemo = null;
let lockRequests = 0, lockReleases = 0;
Graphics._canvas.requestPointerLock = () => { lockRequests++; };
P.installMouseLook();
P._firstMouseClick();
assert.strictEqual(lockRequests, 1, 'pointer lock is requested only by the canvas click handler');
document.pointerLockElement = Graphics._canvas;
document.exitPointerLock = () => { lockReleases++; document.pointerLockElement = null; };
const savedCreateUi = DocsDoodads.PhotoMode.createUi;
DocsDoodads.PhotoMode.createUi = () => ({ remove() {} });
assert.strictEqual(DocsDoodads.PhotoMode.open(scene), true);
assert.strictEqual(lockReleases, 1, 'opening Photo Mode releases first-person pointer lock immediately');
assert.strictEqual(P.mouseLookAllowed(), false, 'Photo Mode blocks pointer movement and new lock requests');
DocsDoodads.PhotoMode.close();
DocsDoodads.PhotoMode.createUi = savedCreateUi;
document.pointerLockElement = Graphics._canvas;
assert.strictEqual(DocsDoodads.api.camera3d({ mode: 'orbit', pitch: 60, fov: 55 }, 0), true);
assert.strictEqual(lockReleases, 2, 'leaving first-person releases pointer lock');
P._activeMemo = null;
assert.deepStrictEqual([P.active().mode, P.active().pitch, P.active().fov], ['orbit', 60, 55]);

// A same Game_Map object entering another first-person map gets that map's player-facing yaw; the old
// map's initialized flag and runtime override cannot leak across setup.
$dataDocsDoodads.mapSettings[2] = { perspective: { enabled: true, mode: 'first' } };
$gamePlayer.setDirection(4);
$gameMap._docsFirstPersonMode = true;
$gameMap.setup(2);
assert.strictEqual($gameMap._docsFirstPersonMode, false, 'map setup clears first-person initialization');
P._activeMemo = null;
$gameMap.updateDocsCamera3d(true);
assert.strictEqual($gameMap._docsCamera.yaw, 270, 'the next map seeds yaw from its current player facing');

console.log('✓ First-person settings, eye geometry, visibility, controls, editor suspension, command and API surfaces verified.');
