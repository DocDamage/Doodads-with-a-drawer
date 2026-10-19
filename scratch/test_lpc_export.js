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
write(lib, 'sheet_definitions/torso/cloak.json', { name: 'Cloak', type_name: 'cape', layer_1: { zPos: 60, male: 'cape/front/' }, layer_2: { zPos: 5, male: 'cape/back/' }, credits: credit('cape', ['CC0']) });
write(lib, 'sheet_definitions/weapons/sword.json', { name: 'Sword', type_name: 'weapon', layer_1: { zPos: 140, male: 'weapon/sword/' }, credits: credit('weapon', ['CC-BY-SA 3.0']) });
write(lib, 'palette_definitions/body/meta_body.json', { default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'] });
write(lib, 'spritesheets/body/m/walk.png', sheet(9));
write(lib, 'spritesheets/body/m/idle.png', sheet(2));
write(lib, 'spritesheets/body/m/run.png', sheet(8));
write(lib, 'spritesheets/body/m/slash.png', sheet(6));
const oneRow = (frames, colour) => { const w = frames * 64, d = new Uint8Array(w * 64 * 4); for (let y = 10; y < 64; y++) for (let x = 0; x < w; x++) d.set(colour(Math.floor(x / 64)), (y * w + x) * 4); return encodePng(w, 64, d, b => zlib.deflateSync(b)); };
write(lib, 'spritesheets/body/m/hurt.png', oneRow(6, f => [f * 20, 200, 7, 255]));
write(lib, 'spritesheets/head/m/walk.png', sheet(9, () => [0, 0, 0, 0]));
write(lib, 'spritesheets/weapon/sword/walk.png', sheet(9, () => [250, 250, 250, 255]));
write(lib, 'spritesheets/cape/front/walk.png', sheet(9, () => [10, 10, 200, 255]));
write(lib, 'spritesheets/cape/front/idle.png', sheet(2, () => [10, 10, 201, 255]));
write(lib, 'spritesheets/cape/back/walk.png', sheet(9, () => [10, 200, 10, 255]));
// Oversize weapon art: cells of 192 (or 128) with a dot at (5, 5), one where the 64-pixel body's (10, 20) is,
// and one below the body's cell (left out of MZ's sheets, which stand on the feet).
const bigSheet = (cols, cell, colour) => { const w = cols * cell, d = new Uint8Array(w * 4 * cell * 4), pad = (cell - 64) / 2;
    for (let r = 0; r < 4; r++) for (let f = 0; f < cols; f++) for (const [x, y] of [[5, 5], [pad + 10, pad + 20], [5, pad + 64 + 5]]) d.set(colour(f, r), ((r * cell + y) * w + f * cell + x) * 4);
    return encodePng(w, 4 * cell, d, b => zlib.deflateSync(b)); };
write(lib, 'sheet_definitions/weapons/longsword.json', { name: 'Longsword', type_name: 'weapon', variants: ['long'], animations: ['walk', 'slash_oversize'],
    layer_1: { zPos: 140, male: 'weapon/long/' }, layer_2: { zPos: 150, custom_animation: 'slash_oversize', male: 'weapon/long/attack_slash/' }, credits: credit('weapon', ['CC0']) });
write(lib, 'sheet_definitions/weapons/spear.json', { name: 'Spear', type_name: 'weapon', variants: ['spear'], animations: ['walk_128'],
    layer_1: { zPos: 140, custom_animation: 'walk_128', male: 'weapon/spear/walk/' }, credits: credit('weapon', ['CC0']) });
write(lib, 'spritesheets/weapon/long/walk.png', sheet(9, () => [0, 0, 0, 0]));
write(lib, 'spritesheets/weapon/long/attack_slash/long.png', bigSheet(6, 192, (f, r) => [200, f * 20, r * 50, 255]));
write(lib, 'spritesheets/weapon/spear/walk/spear.png', bigSheet(13, 128, (f, r) => [180, f * 20, r * 50, 255]));
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
    assert.deepStrictEqual(C.parseName('$Robin[f9][w2]'), { base: '$Robin', frames: 9, dirs: 4, tagged: true, walkTiles: 2, below: 0 });
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
    const result = ws.exportLpcCharacter(state, { name: 'Robin', classic: true, smooth: true, face: true, faceSlot: 0 });
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

    // 4b. Actions and the side-view battler.
    const ace = ws.exportLpcCharacter({ body: 'male', slots: { body: { id: 'body/body', colour: 'light' } } }, { name: 'Ace', actions: ['slash', 'hurt', 'thrust'], battler: true });
    assert.deepStrictEqual(ace.files, ['img/characters/$Ace_slash[f6].png', 'img/characters/$Ace_hurt[f6].png', 'img/sv_actors/Ace.png']);
    assert.ok(ace.warnings.some(w => /No thrust action/.test(w)), 'an action the parts lack is said');
    const slash = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/characters/$Ace_slash[f6].png')), d => zlib.inflateSync(d));
    assert.deepStrictEqual([slash.width, slash.height], [384, 256]);
    assert.deepStrictEqual(px(slash, 64 + 10, 20), [20, 120, 7, 255], 'MZ row order');
    const hurt = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/characters/$Ace_hurt[f6].png')), d => zlib.inflateSync(d));
    assert.deepStrictEqual([hurt.width, hurt.height], [384, 256]);
    assert.deepStrictEqual(px(hurt, 2 * 64 + 10, 192 + 20), [40, 200, 7, 255], 'a one-row animation fills all four rows');
    const sv = D.LpcCompose.decodePng(fs.readFileSync(path.join(project, 'img/sv_actors/Ace.png')), d => zlib.inflateSync(d));
    assert.deepStrictEqual([sv.width, sv.height], [576, 384]);
    assert.deepStrictEqual(px(sv, 10, 20), [20, 60, 7, 255], 'walk: facing left, frame 1');
    assert.deepStrictEqual(px(sv, 3 * 64 + 10, 64 + 20), [20, 60, 7, 255], 'swing: the slash, frames spread (1, 3, 5)');
    assert.deepStrictEqual(px(sv, 5 * 64 + 10, 64 + 20), [100, 60, 7, 255]);
    assert.deepStrictEqual(px(sv, 64 + 10, 4 * 64 + 20), [20, 200, 7, 255], 'damage: the hurt row');
    assert.deepStrictEqual(px(sv, 8 * 64 + 10, 5 * 64 + 20), [100, 200, 7, 255], 'dead: the last hurt frame');
    assert.deepStrictEqual(px(sv, 6 * 64 + 10, 20), [20, 180, 7, 255], 'escape: running right');
    assert.ok(ace.warnings.some(w => /battler's .*thrust.* use another animation/.test(w)), 'motions drawn from another animation are said');
    assert.ok(ws.lpcCredits().images['img/sv_actors/Ace.png'], 'the battler is credited');
    assert.deepStrictEqual(E.spread(13), [2, 6, 10]);
    assert.deepStrictEqual(E.svMotions.map(m => m.motion), ['walk', 'wait', 'chant', 'guard', 'damage', 'evade', 'thrust', 'swing', 'missile', 'skill', 'spell', 'item', 'escape', 'victory', 'dying', 'abnormal', 'sleep', 'dead'], "MZ's motion order");
    assert.strictEqual(E.actionName('Ace', '1h_backslash'), '$Ace_backslash[f13]');
    console.log('✓ actions and the side-view battler');

    // 4b2. Oversize weapon art: walkers and the battler with bigger frames standing on the feet (what is below
    // the body's cell left out), action sheets with the whole frame and how far it reaches below the feet in
    // characterAnim.feet, the battler's cells grown with every motion at the bottom middle, the export saying
    // which; Visual Equipment parts get the same frames; the return swing as an action.
    assert.deepStrictEqual([E.cellOf(64), E.cellOf(128), E.cellOf(192)], [{ w: 64, h: 64, below: 0 }, { w: 128, h: 96, below: 0 }, { w: 192, h: 128, below: 0 }]);
    assert.deepStrictEqual([E.cellOf(64, true), E.cellOf(192, true)], [{ w: 64, h: 64, below: 0 }, { w: 192, h: 192, below: 64 }]);
    assert.deepStrictEqual(E.feetWith({ a: 32 }, 'b', 64), { a: 32, b: 64 });
    assert.deepStrictEqual(E.feetWith({ a: 32, b: 64 }, 'b', 0), { a: 32 }, 'gone when a sheet no longer reaches below the feet');
    assert.strictEqual(E.actionLabel('slash_reverse'), 'slash reverse');
    assert.strictEqual(E.actionLabel('1h_backslash'), 'backslash');
    const knight = { body: 'male', slots: { body: { id: 'body/body', colour: 'light' }, weapon: { id: 'weapons/longsword', colour: '' } } };
    const kn = ws.exportLpcCharacter(knight, { name: 'Knight', classic: true, actions: ['slash', 'hurt', 'slash_reverse'], battler: true });
    const kimg = f => D.LpcCompose.decodePng(fs.readFileSync(path.join(project, f)), d => zlib.inflateSync(d));
    const kslash = kimg('img/characters/$Knight_slash[f6].png');
    assert.deepStrictEqual([kslash.width, kslash.height], [6 * 192, 4 * 192], 'action sheets keep the whole 192-pixel frame');
    assert.deepStrictEqual(px(kslash, 2 * 192 + 64 + 30, 64 + 40), [40, 120, 7, 255], "MZ row 0 is the library's down row; the body in the middle");
    assert.deepStrictEqual(px(kslash, 2 * 192 + 5, 5), [200, 40, 100, 255], 'the blade at its size');
    assert.deepStrictEqual(px(kslash, 2 * 192 + 64 + 10, 64 + 20), [200, 40, 100, 255], 'in front of the body');
    assert.deepStrictEqual(px(kslash, 2 * 192 + 5, 128 + 5), [200, 40, 100, 255], 'and the art below the feet');
    assert.deepStrictEqual(px(kslash, 2 * 192 + 5, 192 + 5), [200, 40, 50, 255], 'the next MZ row (left)');
    assert.deepStrictEqual(D.World.get('characterAnim.feet'), { '$Knight_slash[f6]': 64, '$Knight_slash_reverse[f6]': 64 }, 'the plugin is told how far they reach below the feet');
    assert.strictEqual(D.CharacterAnim.belowFor('$Knight_slash[f6]', D.CharacterAnim.feet()), 64, 'and stands them on their feet');
    const kback = kimg('img/characters/$Knight_slash_reverse[f6].png');
    assert.deepStrictEqual([px(kback, 5, 5), px(kback, 64 + 30, 64 + 40)], [[200, 100, 100, 255], [100, 120, 7, 255]], 'the backswing: blade and body from the last slash frame');
    assert.deepStrictEqual([kimg('img/characters/$Knight_hurt[f6].png').width, kimg('img/characters/$Knight.png').width], [384, 192], 'sheets without oversize art keep 64-pixel frames');
    const ksv = kimg('img/sv_actors/Knight.png');
    assert.deepStrictEqual([ksv.width, ksv.height], [9 * 192, 6 * 128], "the battler's cells grow to the swing");
    assert.deepStrictEqual(D.World.get('characterAnim.svBody'), { Knight: 64 }, 'the figure is 64 tall in them, for battle animations');
    assert.deepStrictEqual(px(ksv, 64 + 10, 64 + 20), [20, 60, 7, 255], 'walk: the 64-pixel frame at the bottom middle of its cell');
    assert.deepStrictEqual(px(ksv, 3 * 192 + 64 + 10, 128 + 64 + 20), [200, 20, 50, 255], 'swing: the blade, frame 1 facing left');
    assert.deepStrictEqual(px(ksv, 3 * 192 + 64 + 30, 128 + 64 + 40), [20, 60, 7, 255], 'and the body at the same size and place as in walk');
    assert.deepStrictEqual(kn.oversize, [{ file: 'img/characters/$Knight_slash[f6].png', w: 192, h: 192, below: 64 }, { file: 'img/characters/$Knight_slash_reverse[f6].png', w: 192, h: 192, below: 64 },
        { file: 'img/sv_actors/Knight.png', w: 192, h: 128, below: 0, motions: ['swing', 'skill'] }], 'skill falls back to the slash');
    assert.strictEqual(E.oversizeNote(kn.oversize.slice(0, 1).concat(kn.oversize.slice(2))), 'Bigger frames for the weapon art: $Knight_slash[f6] 192 x 192 (64 below the feet), the battler 192 x 128.');
    assert.strictEqual(E.oversizeNote([]), '');
    assert.ok(!kn.warnings.some(w => /Longsword has no slash/.test(w)) && kn.warnings.includes('Longsword has no hurt.'), 'the swing is not missing any more');
    // walk_128: the walkers get 128-pixel frames, 96 tall; idle and run (no spear) keep 64.
    const lance = ws.exportLpcCharacter({ body: 'male', slots: { body: { id: 'body/body', colour: 'light' }, weapon: { id: 'weapons/spear', colour: '' } } }, { name: 'Lance', classic: true, smooth: true });
    const lc = kimg('img/characters/$Lance.png'), ls = kimg('img/characters/$Lance[f9][w2].png');
    assert.deepStrictEqual([lc.width, lc.height, ls.width, ls.height], [3 * 128, 4 * 96, 9 * 128, 4 * 96]);
    assert.deepStrictEqual(px(lc, 32 + 30, 32 + 40), [20, 120, 7, 255], 'classic column 0 is walk frame 1, down, the body ending at the bottom');
    assert.deepStrictEqual(px(ls, 8 * 128 + 5, 5), [180, 160, 100, 255], 'the spear, frame 8 (the padded columns ignored)');
    assert.deepStrictEqual(kimg('img/characters/$Lance_idle[f2].png').width, 128);
    assert.deepStrictEqual(lance.oversize.map(o => o.file), ['img/characters/$Lance.png', 'img/characters/$Lance[f9][w2].png']);
    // Exported again without the longsword: its sheets no longer reach below the feet.
    ws.exportLpcCharacter({ body: 'male', slots: { body: { id: 'body/body', colour: 'light' } } }, { name: 'Knight', actions: ['slash'] });
    assert.deepStrictEqual(D.World.get('characterAnim.feet'), { '$Knight_slash_reverse[f6]': 64 });
    // As Visual Equipment parts the sword gets the same bigger frames, on the same feet as the 64-pixel body.
    const kp = ws.exportLpcCharacter(knight, { name: 'Knight2', smooth: true, battler: true, actions: ['slash'], parts: true });
    const sword = kp.parts.find(p => p.slot === 'weapon');
    const swordSlash = sword.files.find(f => /_slash\[f6\]/.test(f));
    assert.ok(swordSlash, 'an oversize slash in the part sheets');
    assert.deepStrictEqual([kimg(swordSlash).width, kimg(swordSlash).height, D.World.get('characterAnim.feet')[swordSlash.replace(/^.*\//, '').replace(/\.png$/, '')]], [1152, 768, 64]);
    assert.deepStrictEqual(px(kimg(swordSlash), 2 * 192 + 5, 5), [200, 40, 100, 255]);
    assert.deepStrictEqual([kimg(sword.files.find(f => f.startsWith('img/sv_actors/'))).width, kimg('img/characters/$Knight2_slash[f6].png').width], [1728, 384], 'the body alone keeps 64-pixel frames');
    assert.deepStrictEqual(kp.oversize.map(o => o.file), [swordSlash, sword.files.find(f => f.startsWith('img/sv_actors/'))]);
    assert.deepStrictEqual(D.World.get('characterAnim.svBody'), { Knight: 64 }, 'the body-only battler is not grown (its layer is)');
    ws.exportLpcCharacter({ body: 'male', slots: { body: { id: 'body/body', colour: 'light' } } }, { name: 'Knight', battler: true });
    assert.deepStrictEqual(D.World.get('characterAnim.svBody'), {}, 'gone when the battler is exported again without the big weapon');
    // The creator's stage shows the swing on a bigger canvas around the same body; the export says which sheets are bigger.
    ws.openCreator(knight);
    const canvas = document.getElementById('dd-cr-canvas');
    assert.strictEqual(canvas.width, 256);
    document.getElementById('dd-cr-anim-slash').onclick();
    assert.strictEqual(document.getElementById('dd-cr-canvas').width, 4 * 192, 'Slash: 192-pixel frames');
    assert.ok(!/Longsword has no/.test(root.innerHTML), 'nothing missing');
    assert.ok(root.innerHTML.includes('id="dd-cr-anim-slash_reverse"'), 'the backswing on the stage');
    document.getElementById('dd-cr-anim-walk').onclick();
    assert.strictEqual(document.getElementById('dd-cr-canvas').width, 256, 'back to 64');
    ws._creator.name = 'Knight';
    document.getElementById('dd-cr-export').onclick();
    assert.ok(/id="dd-cr-ex-act-slash_reverse"[^>]*>slash reverse</.test(root.innerHTML), 'and as an action');
    ws._creator.exportOptions = { classic: false, smooth: false, face: false, battler: false, actions: ['slash'] };
    D.Ui.confirm = async () => true;
    await ws.creatorExport();
    assert.ok(root.innerHTML.includes('Bigger frames for the weapon art: $Knight_slash[f6] 192 x 192 (64 below the feet).'), 'the popover says which sheets are bigger');
    ws.closeCreator();
    console.log('✓ oversize weapon art: bigger frames on the feet, the battler grown, the stage, parts, the backswing');

    // 4c. The outfit as Visual Equipment parts: the body alone for the character, a part per piece (in front
    // and behind), in the same layouts, with the notetag; the notetag put on an armour in the database.
    write(project, 'data/Armors.json', '[\nnull,\n{"id":1,"name":"Cloak","note":"<visual base: x>\\nOld line"},\n{"id":2,"name":"Hat","note":""}\n]');
    global.$dataArmors = [null, { id: 1, name: 'Cloak', note: '', meta: {} }, { id: 2, name: 'Hat', note: '', meta: {} }];
    global.$dataWeapons = [null, { id: 1, name: 'Sword', note: '', meta: {} }];
    global.DataManager = { extractMetadata(item) { item.meta = { extracted: true }; } };
    const dressed = { body: 'male', slots: { body: { id: 'body/body', colour: 'light' }, cape: { id: 'torso/cloak', colour: '' }, weapon: { id: 'weapons/sword', colour: '' } } };
    const vp = ws.exportLpcCharacter(dressed, { name: 'Vee', classic: false, smooth: true, battler: true, actions: ['slash'], parts: true });
    const vimg = f => D.LpcCompose.decodePng(fs.readFileSync(path.join(project, f)), d => zlib.inflateSync(d));
    assert.deepStrictEqual(px(vimg('img/characters/$Vee[f9][w2].png'), 10, 20), [0, 120, 7, 255], 'the character is the body without its cloak');
    assert.deepStrictEqual(vp.parts.map(p => [p.slot, p.name]), [['cape', 'Cloak'], ['weapon', 'Sword']]);
    const cloak = vp.parts[0];
    assert.ok(cloak.files.includes('img/characters/$LPC Cape Cloak male[f9][w2].png') && cloak.files.includes('img/characters/$LPC Cape Cloak male behind[f9][w2].png'), 'front and behind pieces');
    assert.ok(cloak.files.includes('img/characters/$LPC Cape Cloak male_idle[f2].png'), "an idle sheet beside it, for the body's idle");
    assert.ok(!cloak.files.includes('img/characters/$LPC Cape Cloak male behind_idle[f2].png'), 'none where the library has no idle');
    assert.ok(cloak.files.includes('img/sv_actors/LPC Cape Cloak male.png'), 'a battler layer');
    assert.deepStrictEqual(px(vimg('img/characters/$LPC Cape Cloak male[f9][w2].png'), 10, 20), [10, 10, 200, 255], 'the front piece alone');
    assert.deepStrictEqual(px(vimg('img/characters/$LPC Cape Cloak male behind[f9][w2].png'), 10, 20), [10, 200, 10, 255], 'the back piece alone');
    assert.strictEqual(cloak.notetag, '<visual: $LPC Cape Cloak male[f9][w2], z 50, part cape, sv LPC Cape Cloak male>\n<visual: $LPC Cape Cloak male behind[f9][w2], z -5, part cape, sv LPC Cape Cloak male behind>');
    const parsed = D.VisualEquip.parseNote(cloak.notetag).layers;
    assert.deepStrictEqual(parsed.map(l => [l.image, l.z, l.part, l.sv]), [['$LPC Cape Cloak male[f9][w2]', 50, 'cape', 'LPC Cape Cloak male'], ['$LPC Cape Cloak male behind[f9][w2]', -5, 'cape', 'LPC Cape Cloak male behind']], 'Visual Equipment reads it');
    assert.ok(ws.lpcCredits().images['img/characters/$LPC Cape Cloak male[f9][w2].png'], 'parts are credited');
    assert.ok(ws.addLpcNotetag('a', 1, cloak.notetag, 'cape'));
    const armors = JSON.parse(fs.readFileSync(path.join(project, 'data/Armors.json'), 'utf8'));
    assert.strictEqual(armors[1].note, '<visual base: x>\nOld line\n' + cloak.notetag, 'added under what was there');
    assert.ok(/^\[\nnull,\n\{"id":1/.test(fs.readFileSync(path.join(project, 'data/Armors.json'), 'utf8')), "MZ's layout: one item a line");
    assert.strictEqual($dataArmors[1].note, armors[1].note, 'and in the running game');
    assert.deepStrictEqual($dataArmors[1].meta, { extracted: true });
    const cloakAgain = cloak.notetag.replace('z 50', 'z 51');
    ws.addLpcNotetag('a', 1, cloakAgain, 'cape');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(project, 'data/Armors.json'), 'utf8'))[1].note, '<visual base: x>\nOld line\n' + cloakAgain, 'a part added again replaces its old lines');
    assert.ok(fs.readdirSync(path.join(project, 'data/docs_doodads_cache/backups')).some(f => f.startsWith('Armors.json')), 'backed up first');
    assert.strictEqual(ws.addLpcNotetag('a', 9, cloak.notetag, 'cape'), false);
    global.$dataActors = [null, { id: 1, name: 'Reid', note: '', meta: {} }];
    write(project, 'data/Actors.json', '[\nnull,\n{"id":1,"name":"Reid","note":""}\n]');
    assert.deepStrictEqual(ws.lpcEquipItems().map(i => i.kind + i.id), ['w1', 'a1', 'a2', 'h1'], 'weapons, armours and actors (for clothes always worn)');
    assert.ok(ws.addLpcNotetag('h', 1, cloak.notetag, 'cape'));
    assert.strictEqual($dataActors[1].note, cloak.notetag, "on the actor's note");
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(project, 'data/Actors.json'), 'utf8'))[1].note, cloak.notetag);
    // An equipped item with the same part replaces what the actor always wears (Visual Equipment's slots).
    const worn = D.VisualEquip.resolve({ actorNote: $dataActors[1].note, equipNotes: ['<visual: $LPC Cape Red male[f9][w2], z 50, part cape>'] }, {});
    assert.deepStrictEqual(worn.map(l => l.image), ['$LPC Cape Red male[f9][w2]'], 'the equipped cape replaces both pieces of the worn one');
    // In the popover: the parts with their notetags, Copy and Put it on.
    ws.openCreator(dressed);
    ws._creator.name = 'Vee';
    document.getElementById('dd-cr-export').onclick();
    document.getElementById('dd-cr-ex-parts').onchange({ target: { checked: true } });
    D.Ui.confirm = async () => true;
    await ws.creatorExport();
    assert.ok(/Cape: Cloak/.test(root.innerHTML) && root.innerHTML.includes('id="dd-cr-tag-add-0"') && /Armour 2: Hat/.test(root.innerHTML));
    stubs['dd-cr-tag-item-0'] = { value: 'a2' };
    document.getElementById('dd-cr-tag-add-0').onclick();
    assert.ok(/part cape/.test(JSON.parse(fs.readFileSync(path.join(project, 'data/Armors.json'), 'utf8'))[2].note), 'put on the chosen armour');
    ws.closeCreator();
    console.log('✓ outfit as Visual Equipment parts, notetags on items');

    // 4d. A worn layer follows the body's idle, run and action sheets when it has its own.
    const VEq = D.VisualEquip;
    assert.strictEqual(VEq.stateSheetFor('$LPC Cape Cloak male[f9][w2]', '$Vee[f9][w2]', '$Vee_idle[f2]'), '$LPC Cape Cloak male_idle[f2]');
    assert.strictEqual(VEq.stateSheetFor('Hat', '$Vee', '$Vee_slash[f6]'), 'Hat_slash[f6]');
    assert.strictEqual(VEq.stateSheetFor('Hat', '$Vee[f9][w2]', '$Vee[f9][w2]'), '', 'its own sheet: nothing to swap');
    assert.strictEqual(VEq.stateSheetFor('Hat', '$Vee', '$Other_slash[f6]'), '', "another character's sheet: nothing");
    console.log("✓ layers follow the body's state sheets");

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
    assert.ok(/Export 11 files/.test(root.innerHTML), 'by default: walkers, face, battler and five actions');
    assert.ok(/id="dd-cr-ex-act-slash" aria-pressed="true"/.test(root.innerHTML) && /id="dd-cr-ex-act-sit" aria-pressed="false"/.test(root.innerHTML));
    document.getElementById('dd-cr-ex-act-sit').onclick();
    assert.deepStrictEqual(ws._creator.exportOptions.actions, ['slash', 'thrust', 'spellcast', 'shoot', 'hurt', 'sit'], 'ticked in the list order');
    document.getElementById('dd-cr-ex-act-sit').onclick();
    assert.ok(/Export 11 files/.test(root.innerHTML));
    assert.ok(/1 artwork is not safe to encrypt/.test(root.innerHTML));
    document.getElementById('dd-cr-ex-classic').onchange({ target: { checked: false } });
    assert.ok(/Export 10 files/.test(root.innerHTML));
    let asked = '';
    D.Ui.confirm = async text => { asked = text; return false; };
    assert.strictEqual(await document.getElementById('dd-cr-ex-go').onclick(), null);
    assert.ok(/Replace 4 pictures already in the project\?/.test(asked), 'asks before replacing');
    assert.strictEqual(ws._creator.exported, null, 'nothing written when told no');
    D.Ui.confirm = async () => true;
    await ws.creatorExport();
    assert.deepStrictEqual(ws._creator.exported.files.length, 7, 'actions without pictures are skipped (the fixture has slash and hurt only)');
    assert.ok(/Wrote 7 files/.test(root.innerHTML));
    global.$gamePlayer = { image: '', setImage(name, index) { this.image = name + ':' + index; } };
    document.getElementById('dd-cr-ex-try').onclick();
    assert.strictEqual($gamePlayer.image, '$Robin[f9][w2]:0', 'tried on the player');
    assert.strictEqual(ws.creatorOpen(), false, 'the creator closes to show it');
    console.log('✓ creator Export popover');

    console.log('=== LPC exports passed ===');
})().catch(e => { console.error(e); process.exit(1); });
