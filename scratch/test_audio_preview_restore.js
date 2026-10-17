// Regression: previewing audio in the workspace must not silence the map's BGM/BGS.
// SE/ME previews leave background music alone; BGM/BGS previews restore it on stop.
const assert = require('assert');

console.log("=== Testing Audio Preview Restore ===");

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

// Minimal MZ AudioManager channel model.
const log = [];
global.AudioManager = {
    bgm: { name: 'Scene2', volume: 90, pitch: 100, pan: 0, pos: 12 },
    bgs: { name: 'Rain', volume: 80, pitch: 100, pan: 0, pos: 3 },
    se: null, me: null,
    playBgm(b) { this.bgm = { ...b }; log.push('playBgm ' + b.name); },
    playBgs(b) { this.bgs = { ...b }; log.push('playBgs ' + b.name); },
    playSe(s) { this.se = s.name; log.push('playSe ' + s.name); },
    playMe(m) { this.me = m.name; log.push('playMe ' + m.name); },
    stopBgm() { this.bgm = null; log.push('stopBgm'); },
    stopBgs() { this.bgs = null; log.push('stopBgs'); },
    stopSe() { this.se = null; },
    stopMe() { this.me = null; },
    saveBgm() { return this.bgm ? { ...this.bgm } : { name: '', volume: 0, pitch: 0, pan: 0 }; },
    saveBgs() { return this.bgs ? { ...this.bgs } : { name: '', volume: 0, pitch: 0, pan: 0 }; },
    replayBgm(b) { this.bgm = b.name ? { ...b } : null; log.push('replayBgm ' + b.name); },
    replayBgs(b) { this.bgs = b.name ? { ...b } : null; log.push('replayBgs ' + b.name); }
};

require('../Docs-Doodads.js');
const audio = DocsDoodads.Audio;
const asset = (folder, name) => ({ category: 'Audio', fileName: name + '.ogg', path: `audio/${folder}/${name}.ogg` });

audio.playPreview(asset('se', 'Cursor1'));
assert.strictEqual(AudioManager.se, 'Cursor1');
assert.strictEqual(AudioManager.bgm && AudioManager.bgm.name, 'Scene2', "an SE preview must not stop the map BGM");
assert.strictEqual(AudioManager.bgs && AudioManager.bgs.name, 'Rain', "an SE preview must not stop the map BGS");
audio.stopPreview();
assert.strictEqual(AudioManager.bgm && AudioManager.bgm.name, 'Scene2', "stopping an SE preview keeps the map BGM");

audio.playPreview(asset('bgm', 'Battle1'));
assert.strictEqual(AudioManager.bgm.name, 'Battle1');
audio.playPreview(asset('bgm', 'Battle2'));
assert.strictEqual(AudioManager.bgm.name, 'Battle2');
audio.stopPreview();
assert.deepStrictEqual(AudioManager.bgm, { name: 'Scene2', volume: 90, pitch: 100, pan: 0, pos: 12 }, "the map BGM resumes where it was after a BGM preview");

audio.playPreview(asset('bgs', 'Wind'));
audio.stopPreview();
assert.strictEqual(AudioManager.bgs.name, 'Rain', "the map BGS resumes after a BGS preview");
assert.strictEqual(audio.currentPlaying, null);

console.log("✓ Audio previews leave or restore the map's background audio.");
