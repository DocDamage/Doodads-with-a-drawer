'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld();
global.Game_Screen = class {
    startFlash(colour, duration) { this._flashColor = colour.slice(); this._flashDuration = duration; }
    updateFlash() { if (this._flashDuration > 0) { this._flashColor[3] *= (this._flashDuration - 1) / this._flashDuration; this._flashDuration--; } }
    startShake(power, speed, duration) { this.shake = { power, speed, duration }; }
};
global.PluginManager.parameters = () => ({ comfortOptions: 'always', softenMZEffects: 'true' });
require('../Docs-Doodads.js');
const D = DocsDoodads, C = D.Comfort;
assert.ok(C, 'comfort helpers exist in the game');
const off = { reduceFlashes: false, lessCameraMotion: false }, on = { reduceFlashes: true, lessCameraMotion: true };
for (const n of [0, 0.25, 10, 100, 255]) {
    assert.strictEqual(C.flash(n, off), n);
    assert.strictEqual(C.motion(n, off), n);
}
assert.strictEqual(C.flash(255, on), 64);
assert.ok(C.motion(10, on) < 10);
const camera = { smooth: 0.5, lookAhead: 3 };
assert.deepStrictEqual(C.camera(camera, off), camera);
assert.strictEqual(C.camera(camera, on).lookAhead, 0);
assert.strictEqual(camera.lookAhead, 3);
ConfigManager.applyData({});
assert.deepStrictEqual(D.api.comfort(), off);
ConfigManager.docsReduceFlashes = ConfigManager.docsLessCameraMotion = true;
const config = ConfigManager.makeData();
ConfigManager.docsReduceFlashes = ConfigManager.docsLessCameraMotion = false;
ConfigManager.applyData(config);
assert.deepStrictEqual(D.api.comfort(), on);
const normal = D.Lightning.strike({ flash: 255, delay: 2, volume: 90 }, 0.8, off);
const reduced = D.Lightning.strike({ flash: 255, delay: 2, volume: 90 }, 0.8, on);
assert.strictEqual(normal.thunderIn, reduced.thunderIn);
assert.strictEqual(normal.volume, reduced.volume);
assert.ok(reduced.flash <= 64);
const screen = new Game_Screen();
screen.startFlash([255, 255, 255, 255], 12);
assert.strictEqual(screen._flashColor[3], 0, 'a reduced flash eases in');
let previous = 0, peak = 0;
for (let i = 0; i < 12; i++) {
    screen.updateFlash();
    const value = screen._flashColor[3];
    assert.ok(value <= 64);
    assert.ok(Math.abs(value - previous) <= 24, 'no snap between frames');
    previous = value; peak = Math.max(peak, value);
}
assert.ok(peak > 0);
assert.strictEqual(screen._flashColor[3], 0);
screen.startShake(10, 8, 30);
assert.ok(screen.shake.power < 10);
D.World.set('camera2d.lookAhead', 3);
assert.strictEqual(D.Camera2D.settings().lookAhead, 0);
const animations = [{ type: 'shockwave', strength: 1, duration: 30, start: 0, center: [0.5, 0.5] },
    { type: 'bloomFlash', strength: 1, duration: 30, start: 0 }];
const softened = D.PostFX.Animations.sample(JSON.parse(JSON.stringify(animations)), 3);
ConfigManager.applyData({});
const unchanged = D.PostFX.Animations.sample(JSON.parse(JSON.stringify(animations)), 3);
assert.ok(softened.shock[3] < unchanged.shock[3]);
assert.ok(softened.bloom < unchanged.bloom);
screen.startFlash([255, 255, 255, 200], 12);
assert.strictEqual(screen._flashColor[3], 200, 'off leaves MZ flashes unchanged');
screen.startShake(10, 8, 30);
assert.strictEqual(screen.shake.power, 10);
const rows = [];
const options = new Window_Options(); options.addCommand = (label, symbol) => rows.push({ label, symbol });
options.addGeneralOptions();
assert.ok(rows.some(r => r.symbol === 'docsReduceFlashes'));
assert.ok(rows.some(r => r.symbol === 'docsLessCameraMotion'));
console.log('Comfort options: all tests passed.');
