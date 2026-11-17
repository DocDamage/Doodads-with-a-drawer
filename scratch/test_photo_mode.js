'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const E = require('./engine/fake_engine');

E.install();
E.setupWorld({ width: 40, height: 30, px: 12, py: 10 });
PluginManager.parameters = name => name === 'Docs-Doodads'
    ? { photoModeKey: 'P', photoModeForbidSwitch: '9' } : {};
let ordinaryUpdates = 0;
Scene_Map.prototype.updateMain = function() { ordinaryUpdates++; };
Scene_Map.prototype.isMenuCalled = function() { return true; };
require('../Docs-Doodads.js');

const D = DocsDoodads;
const Photo = D.PhotoMode;
assert.ok(Photo && D.Capture, 'Photo Mode and its game-safe capture backend are in the ordinary build');
assert.strictEqual(typeof D.api.photoMode, 'function', 'scripts have a public Photo Mode entry point');
assert.ok(PluginManager._commands['Docs-Doodads:openPhotoMode'], 'Open Photo Mode is a plugin command');

// The shared renderer always restores editor-only layers, including when PIXI fails mid-capture.
const spriteset = new Spriteset_Map();
spriteset._docsSelectionOutline = { visible: true };
spriteset._docsTraceSprite = { visible: false };
const renderer = Graphics.app.renderer;
const canvas = D.Capture.renderSceneCanvas(spriteset, renderer);
assert.deepStrictEqual([canvas.width, canvas.height], [Graphics.width, Graphics.height]);
assert.deepStrictEqual([spriteset._docsSelectionOutline.visible, spriteset._docsTraceSprite.visible], [true, false]);
const normalRender = renderer.render;
renderer.render = () => { throw new Error('GPU stopped'); };
assert.throws(() => D.Capture.renderSceneCanvas(spriteset, renderer), /GPU stopped/);
renderer.render = normalRender;
assert.deepStrictEqual([spriteset._docsSelectionOutline.visible, spriteset._docsTraceSprite.visible], [true, false],
    'capture failure restores every temporarily hidden layer');

// Browser games download without needing editor or Node filesystem globals.
let downloaded = null;
const createElement = document.createElement;
document.createElement = tag => {
    if (tag !== 'a') return createElement(tag);
    return { style: {}, remove() {}, click() { downloaded = { name: this.download, href: this.href }; } };
};
const browserSave = D.Capture.saveCanvas(canvas, 'photo_Map001_test.png');
document.createElement = createElement;
assert.strictEqual(browserSave.kind, 'download');
assert.deepStrictEqual(downloaded && downloaded.name, 'photo_Map001_test.png');
assert.match(downloaded.href, /^data:image\/png/);

// Desktop games write only beneath a generated screenshots directory. Tests use an isolated temp root,
// never DD_REPO_ROOT or the source checkout.
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-photo-'));
const wasNwjs = Utils.isNwjs;
Utils.isNwjs = () => true;
D.Capture.desktopRoot = () => tempRoot;
const desktopSave = D.Capture.saveCanvas(canvas, '../../data/Map001.json');
Utils.isNwjs = wasNwjs;
assert.strictEqual(desktopSave.kind, 'file');
assert.strictEqual(path.dirname(desktopSave.path), path.join(tempRoot, 'screenshots'));
assert.strictEqual(path.extname(desktopSave.path), '.png');
assert.ok(fs.existsSync(desktopSave.path), 'desktop PNG was written inside the isolated screenshots folder');
assert.ok(path.resolve(desktopSave.path).startsWith(path.resolve(tempRoot) + path.sep));

// Opening freezes ordinary Scene_Map updates but leaves the spriteset available to render. Every camera,
// look and visibility field goes back exactly when the mode closes.
const scene = new Scene_Map();
scene._spriteset = spriteset;
SceneManager._scene = scene;
$gameMap.setDisplayPos(4, 6);
$gameMap._docsCam2d = { free: 'event', follow: 2, hold: { x: 7, y: 8 }, path: null };
$gameMap._docsCamera = { yaw: 25, pitch: 50, zoom: 1.25 };
$gameMap._docsCameraTween = { frame: 3, frames: 20 };
$gameSystem._docsLook = { current: D.PostFX.presetLook('golden'), framesLeft: 0, clearWhenDone: false };
Object.assign($gameScreen, { _zoomX: 14, _zoomY: 18, _zoomScale: 1.4, _zoomScaleTarget: 1.4, _zoomDuration: 0 });
const before = JSON.stringify({
    x: $gameMap.displayX(), y: $gameMap.displayY(), cam2d: $gameMap._docsCam2d,
    camera: $gameMap._docsCamera, tween: $gameMap._docsCameraTween, look: $gameSystem._docsLook,
    zoom: [$gameScreen._zoomX, $gameScreen._zoomY, $gameScreen._zoomScale, $gameScreen._zoomScaleTarget, $gameScreen._zoomDuration]
});
assert.strictEqual(Photo.open(scene), true);
scene.updateMain();
assert.strictEqual(ordinaryUpdates, 0, 'map, events and player do not update while composing a photo');
assert.strictEqual(scene.isMenuCalled(), false, 'the ordinary menu cannot open behind Photo Mode');
Photo.pan(1, -1);
Photo.zoomBy(0.25);
Photo.selectLook('noir');
Photo.setHidePlayer(true);
const partySprites = spriteset._characterSprites.filter(sprite => sprite._character === $gamePlayer
    || $gamePlayer.followers().data().includes(sprite._character));
assert.ok(partySprites.length && partySprites.every(sprite => sprite.visible === false), 'Hide Player hides the player and followers from the picture');
assert.strictEqual(Photo.close(), true);
assert.strictEqual(JSON.stringify({
    x: $gameMap.displayX(), y: $gameMap.displayY(), cam2d: $gameMap._docsCam2d,
    camera: $gameMap._docsCamera, tween: $gameMap._docsCameraTween, look: $gameSystem._docsLook,
    zoom: [$gameScreen._zoomX, $gameScreen._zoomY, $gameScreen._zoomScale, $gameScreen._zoomScaleTarget, $gameScreen._zoomDuration]
}), before, 'leaving restores the exact camera, zoom and look in use before Photo Mode');
assert.ok(partySprites.every(sprite => sprite.visible === true), 'party visibility is restored');
scene.updateMain();
assert.strictEqual(ordinaryUpdates, 1, 'ordinary map updates resume after leaving');

// Scene lifecycle closes the mode, and the forbidden switch blocks key, API and command entry alike.
assert.strictEqual(D.api.photoMode(), true);
scene.terminate();
assert.strictEqual(Photo.active, false, 'leaving Scene_Map always closes and restores Photo Mode');
$gameSwitches.setValue(9, true);
assert.strictEqual(Photo.open(scene), false);
assert.strictEqual(D.api.photoMode(), false);
PluginManager.callCommand(null, 'Docs-Doodads', 'openPhotoMode', {});
assert.strictEqual(Photo.active, false, 'the forbid switch also guards the plugin command');
$gameSwitches.setValue(9, false);

// A same-scene map load closes without writing the old camera snapshot into the new map object.
assert.strictEqual(Photo.open(scene), true);
const nextMap = new Game_Map();
nextMap.setup(2);
nextMap.setDisplayPos(2, 3);
global.$gameMap = nextMap;
scene.onMapLoaded();
assert.strictEqual(Photo.active, false);
assert.deepStrictEqual([nextMap.displayX(), nextMap.displayY()], [2, 3]);

assert.ok(path.resolve(tempRoot).startsWith(path.resolve(os.tmpdir()) + path.sep));
fs.rmSync(tempRoot, { recursive: true, force: true });
console.log('Photo Mode: pause, capture backends, forbid switch and exact restoration passed.');
