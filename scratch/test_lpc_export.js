// scratch/test_lpc_export.js
// LPC exports, phase 4: MZ sheets from a composed character (rows reordered to down, left, right, up; the
// classic 3-frame walker; every frame for the smooth walker, idle and run), the face (head found, scaled,
// on a card) in a face sheet that keeps its other faces, safe file names; the [wN] walk pace at runtime
// (the standing frame left out of the walk, one cycle per N tiles at any speed); and the export in the
// editor: files written, credits recorded and CREDITS_LPC.txt rewritten, the animation set, the character
// kept, asking before replacing, the creator's Export popover.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing LPC Exports ===');

// MZ's walking, as rmmz_objects.js does it, for the [wN] hooks to wrap.
global.Game_CharacterBase = function() { this._pattern = 1; this._animationCount = 0; this._stopCount = 0; this._moving = false; this._speed = 4; this._name = ''; };
const G = global.Game_CharacterBase.prototype;
G.update = function() {};
G.characterName = function() { return this._name; };
G.isMoving = function() { return this._moving; };
G.isJumping = function() { return false; };
G.realMoveSpeed = function() { return this._speed; };
G.distancePerFrame = function() { return Math.pow(2, this.realMoveSpeed()) / 256; };
G.hasWalkAnime = function() { return true; };
G.hasStepAnime = function() { return false; };
G.maxPattern = function() { return 4; };
G.pattern = function() { return this._pattern < 3 ? this._pattern : 1; };
G.setPattern = function(p) { this._pattern = p; };
G.resetPattern = function() { this.setPattern(1); };
G.isOriginalPattern = function() { return this.pattern() === 1; };
G.animationWait = function() { return (9 - this.realMoveSpeed()) * 3; };
G.updatePattern = function() { if (!this.hasStepAnime() && this._stopCount > 0) this.resetPattern(); else this._pattern = (this._pattern + 1) % this.maxPattern(); };
G.updateAnimationCount = function() { if (this.isMoving() && this.hasWalkAnime()) this._animationCount += 1.5; else if (this.hasStepAnime() || !this.isOriginalPattern()) this._animationCount++; };
G.updateAnimation = function() { this.updateAnimationCount(); if (this._animationCount >= this.animationWait()) { this.updatePattern(); this._animationCount = 0; } };
G.setDirection = function() {};
G.direction = function() { return 2; };
G.moveDiagonally = function() {};
G.isDirectionFixed = function() { return false; };

const store = {};
global.window = global;
global.innerWidth = 1400;
const listeners = {};
global.window.addEventListener = (type, fn) => { listeners[type] = fn; };
global.window.removeEventListener = (type, fn) => { if (listeners[type] === fn) delete listeners[type]; };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let root = null;
const stubs = {};
const ctx2d = { createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, drawImage() {}, clearRect() {} };
global.document = {
    createElement: tag => ({ tagName: tag.toUpperCase(), style: {}, innerHTML: '', setAttribute() {}, appendChild() {}, getContext: () => ctx2d }),
    body: { appendChild(n) { if (n.id === 'dd-creator') root = n; n.parentNode = this; }, removeChild(n) { if (n === root) root = null; } },
    getElementById: id => {
        if (id === 'dd-creator') return root;
        if (!root || !root.innerHTML.includes(`id="${id}"`)) return null;
        if (!stubs[id]) stubs[id] = { id, getContext: () => ctx2d, width: 256, height: 256 };
        return stubs[id];
    },
    querySelector: () => null, querySelectorAll: () => []
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

// A library whose walk frames are coloured by frame and row, so reordering shows.
const fixture = path.join(__dirname, 'lpc_export_fixture');
fs.rmSync(fixture, { recursive: true, force: true });
const project = path.join(fixture, 'project'), lib = path.join(fixture, 'library');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
const { encodePng } = require('../scripts/png');
// Cell (frame, row) is a 64x64 square: transparent above y = 10, then the colour (frame * 20, row * 60, 7).
const sheet = (frames, colour) => { const w = frames * 64, d = new Uint8Array(w * 256 * 4);
    for (let y = 0; y < 256; y++) for (let x = 0; x < w; x++) { if (y % 64 < 10) continue; d.set(colour ? colour(Math.floor(x / 64), Math.floor(y / 64)) : [Math.floor(x / 64) * 20, Math.floor(y / 64) * 60, 7, 255], (y * w + x) * 4); }
    return encodePng(w, 256, d, b => zlib.deflateSync(b)); };
const credit = (file, licenses) => [{ file, licenses, authors: ['Ann'], urls: ['https://opengameart.org/a'] }];
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', type_name: 'body', layer_1: { zPos: 10, male: 'body/m/' }, credits: credit('body', ['OGA-BY 3.0']) });
write(lib, 'sheet_definitions/head/human_male.json', { name: 'Human Male', type_name: 'head', layer_1: { zPos: 100, male: 'head/m/' }, credits: credit('head', ['CC0']) });
write(lib, 'sheet_definitions/weapons/sword.json', { name: 'Sword', type_name: 'weapon', layer_1: { zPos: 140, male: 'weapon/sword/' }, credits: credit('weapon', ['CC-BY-SA 3.0']) });
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'] });
write(lib, 'spritesheets/body/m/walk.png', sheet(9));
write(lib, 'spritesheets/body/m/idle.png', sheet(2));
write(lib, 'spritesheets/body/m/run.png', sheet(8));
write(lib, 'spritesheets/head/m/walk.png', sheet(9, () => [0, 0, 0, 0]));
write(lib, 'spritesheets/weapon/sword/walk.png', sheet(9, () => [250, 250, 250, 255]));
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(fixture, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, E = D.LpcExport, C = D.CharacterAnim, ws = D.Workspace, S = D.LpcSlots;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;
D.Ui.sound = () => {};
const px = (img, x, y) => Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));

(async () => {
    // 1. Names and layouts.
    assert.deepStrictEqual(E.names(' Sir Robin [1]! '), { classic: '$Sir Robin 1', smooth: '$Sir Robin 1[f9][w2]', idle: '$Sir Robin 1_idle[f2]', run: '$Sir Robin 1_run[f8]', face: 'Sir Robin 1' });
    assert.strictEqual(E.names('').classic, '$Character');
    const walk = D.LpcCompose.decodePng(fs.readFileSync(path.join(lib, 'spritesheets/body/m/walk.png')), d => zlib.inflateSync(d));
    const classic = E.classic(walk);
    assert.deepStrictEqual([classic.width, classic.height], [192, 256]);
    // MZ rows down, left, right, up = library rows 2, 1, 3, 0; columns are frames 1, 0, 5.
    assert.deepStrictEqual(px(classic, 10, 20), [20, 120, 7, 255], 'row 0 is the library\'s down row, column 0 its frame 1');
    assert.deepStrictEqual(px(classic, 64 + 10, 64 + 20), [0, 60, 7, 255], 'left, standing');
    assert.deepStrictEqual(px(classic, 128 + 10, 128 + 20), [100, 180, 7, 255], 'right, frame 5');
    assert.deepStrictEqual(px(classic, 10, 192 + 20), [20, 0, 7, 255], 'up last');
    const smooth = E.allFrames(walk);
    assert.deepStrictEqual([smooth.width, smooth.height], [576, 256]);
    assert.deepStrictEqual(px(smooth, 8 * 64 + 1, 20), [160, 120, 7, 255]);
    console.log('✓ names and sheet layouts');

    // 2. The face: the head found below the top of what is drawn, scaled 4 times on a card, in its slot.
    assert.deepStrictEqual(E.headBox(walk), { x: 16, y: 8, size: 32 }, 'from 2 pixels above the top, centred');
    const face = E.face(walk);
    assert.deepStrictEqual([face.width, face.height], [144, 144]);
    assert.deepStrictEqual(px(face, 72, 130), [0, 120, 7, 255], 'the head scaled up, near the bottom');
    assert.deepStrictEqual(px(face, 72, 141), [217, 244, 239, 255], 'a margin under it');
    assert.deepStrictEqual(px(face, 40, 8), [217, 244, 239, 255], 'the card behind');
    assert.strictEqual(px(face, 0, 0)[3], 0, 'rounded corners');
    assert.strictEqual(px(E.face(walk, { background: false }), 40, 8)[3], 0, 'no card when asked');
    const other = E.faceSheet(null, E.face(walk, { background: [1, 2, 3] }), 0);
    const sheetWith = E.faceSheet(other, face, 6);
    assert.deepStrictEqual([sheetWith.width, sheetWith.height], [576, 288]);
    assert.deepStrictEqual(px(sheetWith, 40, 8), [1, 2, 3, 255], 'slot 1 kept');
    assert.deepStrictEqual(px(sheetWith, 2 * 144 + 40, 144 + 8), [217, 244, 239, 255], 'slot 7 is the new face');
    console.log('✓ face and face sheet');

    // 3. [wN] at runtime: frame 0 stands; walking goes 1-8; one cycle per 2 tiles, at any speed.
    assert.deepStrictEqual(C.parseName('$Robin[f9][w2]'), { base: '$Robin', frames: 9, dirs: 4, tagged: true, walkTiles: 2 });
    assert.strictEqual(C.parseName('$Robin[f8]').walkTiles, 0);
    assert.strictEqual(C.parseName('$Robin_run[f8]').base, '$Robin_run');
    for (const speed of [3, 4, 5]) {
        const ch = new Game_CharacterBase();
        ch._name = '$Robin[f9][w2]';
        ch._speed = speed;
        ch.resetPattern();
        assert.strictEqual(ch.pattern(), 0, 'standing');
        ch._moving = true;
        let tiles = 0, changes = 0, last = ch.pattern();
        const seen = new Set();
        while (tiles < 4) {
            ch.updateAnimation();
            tiles += ch.distancePerFrame();
            if (ch.pattern() !== last) { changes++; last = ch.pattern(); seen.add(last); }
        }
        assert.ok(!seen.has(0), 'the standing frame is not part of the walk');
        assert.deepStrictEqual([...seen].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
        assert.ok(changes >= 15 && changes <= 17, `speed ${speed}: two cycles in 4 tiles (${changes} steps)`);
        ch._moving = false;
        ch._stopCount = 1;
        for (let i = 0; i < 40; i++) ch.updateAnimation();
        assert.strictEqual(ch.pattern(), 0, 'stopping stands again');
    }
    const plain = new Game_CharacterBase();
    plain._name = '$Old[f8]';
    assert.strictEqual(plain.animationWait(), 15, 'other sheets keep MZ\'s pace');
    plain._moving = true;
    assert.strictEqual(plain.animationWait(), 15);
    console.log('✓ [w2] walk pace at runtime');

    // 4. The export: files, credits, CREDITS_LPC.txt, the animation set, the character kept.
    ws.setLpcLibraryFolder(lib);
    ws.scanLpcLibrary();
    const state = { body: 'male', slots: { body: { id: 'body/body', colour: 'light' }, head: { id: 'head/human_male', colour: '' } } };
    assert.strictEqual(ws.exportLpcCharacter(state, Object.assign({ name: '' }, ws.lpcExportDefaults())), null);
    assert.ok(/name first/.test(toasts.pop()[1]));
    const result = ws.exportLpcCharacter(state, Object.assign({ name: 'Robin' }, ws.lpcExportDefaults()));
    assert.deepStrictEqual(result.files, ['img/characters/$Robin.png', 'img/characters/$Robin[f9][w2].png', 'img/characters/$Robin_idle[f2].png', 'img/characters/$Robin_run[f8].png', 'img/faces/Robin.png']);
    for (const f of result.files) assert.ok(fs.existsSync(path.join(project, f)), f);
    const written = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/characters/$Robin.png')), d => zlib.inflateSync(d));
    assert.deepStrictEqual([written.width, written.height], [192, 256]);
    const idle = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/characters/$Robin_idle[f2].png')), d => zlib.inflateSync(d));
    assert.deepStrictEqual([idle.width, idle.height], [128, 256]);
    const credits = ws.lpcCredits();
    assert.deepStrictEqual(Object.keys(credits.images).sort(), result.files.slice().sort(), 'credits for every file');
    assert.ok(credits.images['img/characters/$Robin.png'].safeToEncrypt);
    assert.strictEqual(ws.lpcCreditsTextState(), 'ok', 'CREDITS_LPC.txt written again');
    assert.deepStrictEqual(D.World.get('characterAnim.sets').find(s => s.character === '$Robin[f9][w2]'),
        { character: '$Robin[f9][w2]', idle: '$Robin_idle[f2]', run: '$Robin_run[f8]', idleDelay: 90, idleFps: 3, runFps: 20 });
    assert.strictEqual(D.Persistence.dirtyDoodads, true, 'the set is saved with the project');
    assert.ok(S.load(ws.readCreatorSaved(), 'Robin'), 'the character kept to change later');
    assert.ok(/Exported Robin: 5 pictures\./.test(toasts.pop()[1]));
    // Again with a sword (CC-BY-SA): the set is replaced, not doubled; the face leaves the sword out.
    state.slots.weapon = { id: 'weapons/sword', colour: '' };
    ws.setLpcSafeOnly(false);
    const again = ws.exportLpcCharacter(state, { name: 'Robin', classic: true, smooth: true, face: true, faceSlot: 3 });
    assert.strictEqual(D.World.get('characterAnim.sets').filter(s => s.character === '$Robin[f9][w2]').length, 1);
    assert.ok(/can't be encrypted/.test(toasts.pop()[1]));
    const creditsAgain = ws.lpcCredits();
    assert.strictEqual(creditsAgain.images['img/characters/$Robin.png'].safeToEncrypt, false);
    assert.strictEqual(creditsAgain.images['img/faces/Robin.png'].safeToEncrypt, true, 'the face has no sword');
    const faces = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/faces/Robin.png')), d => zlib.inflateSync(d));
    assert.strictEqual(px(faces, 40, 8)[3], 255, 'slot 1 still there');
    assert.strictEqual(px(faces, 3 * 144 + 40, 8)[3], 255, 'slot 4 added');
    assert.ok(again.warnings.some(w => /Sword has no idle picture|Sword has no run picture/.test(w)), 'parts without idle or run are said');
    console.log('✓ export: files, credits, CREDITS_LPC.txt, animation set, saved character, face without gear');

    // 5. Only in a playtest; only what was ticked.
    Utils.isOptionValid = () => false;
    assert.strictEqual(ws.exportLpcCharacter(state, { name: 'X', classic: true }), null);
    assert.ok(/exported in a playtest/.test(toasts.pop()[1]));
    Utils.isOptionValid = opt => opt === 'test';
    assert.deepStrictEqual(ws.exportLpcCharacter(state, { name: 'Solo', classic: false, smooth: false, face: true }).files, ['img/faces/Solo.png']);
    assert.deepStrictEqual(ws.lpcExportFiles('Robin', { classic: true }), ['img/characters/$Robin.png']);
    console.log('✓ playtest only, only what was ticked');

    // 6. The creator's Export popover: options, asking before replacing, Try on the player.
    ws.openCreator(state);
    ws._creator.name = 'Robin';
    document.getElementById('dd-cr-export').onclick();
    assert.ok(/Export Robin to RPG Maker/.test(root.innerHTML));
    assert.ok(/Export 5 files/.test(root.innerHTML));
    assert.ok(/1 artwork is not safe to encrypt/.test(root.innerHTML));
    document.getElementById('dd-cr-ex-classic').onchange({ target: { checked: false } });
    assert.ok(/Export 4 files/.test(root.innerHTML));
    let asked = '';
    D.Ui.confirm = async text => { asked = text; return false; };
    assert.strictEqual(await document.getElementById('dd-cr-ex-go').onclick(), null);
    assert.ok(/Replace 4 pictures already in the project\?/.test(asked), 'asks before replacing');
    assert.strictEqual(ws._creator.exported, null, 'nothing written when told no');
    D.Ui.confirm = async () => true;
    await ws.creatorExport();
    assert.deepStrictEqual(ws._creator.exported.files.length, 4);
    assert.ok(/Wrote 4 files/.test(root.innerHTML));
    global.$gamePlayer = { image: '', setImage(name, index) { this.image = name + ':' + index; } };
    document.getElementById('dd-cr-ex-try').onclick();
    assert.strictEqual($gamePlayer.image, '$Robin[f9][w2]:0', 'tried on the player');
    assert.strictEqual(ws.creatorOpen(), false, 'the creator closes to show it');
    console.log('✓ creator Export popover');

    console.log('=== LPC exports passed ===');
})().catch(e => { console.error(e); process.exit(1); });
