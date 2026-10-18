// scratch/test_aseprite_visuals.js
// Gear straight from Aseprite: <visual: Walker.aseprite#Hair> draws a layer of a layered .aseprite. In a
// playtest its sheet is written to img/characters (when missing or older), recorded in a manifest, and
// remade when the .aseprite is saved again; games without file access use the manifest.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log("=== Testing Aseprite Gear ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {}, getContext: () => ({}) }), body: { appendChild() {}, removeChild() {} }, getElementById: () => null };
let testMode = true;
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: opt => opt === 'test' && testMode, encodeURI: s => encodeURIComponent(s).replace(/%2F/g, '/') };
global.PluginManager = { parameters: () => ({}) };
global.$dataDocsDoodads = {};
const loads = [];
global.Bitmap = { load: url => { loads.push(url); return { url }; } };
global.ImageManager = { _cache: {} };

require('../Docs-Doodads.js');
const AV = DocsDoodads.AsepriteVisuals, VE = DocsDoodads.VisualEquip;
const fixture = path.join(__dirname, 'fixtures', 'walker.aseprite');

const cwd = process.cwd();
const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-asevis-'));
process.chdir(proj);
const warn = console.warn;
const warnings = [];
console.warn = m => warnings.push(String(m));
try {
    fs.mkdirSync('img/characters', { recursive: true });
    fs.mkdirSync('data');
    fs.mkdirSync('art');
    fs.copyFileSync(fixture, 'img/characters/Walker.aseprite');
    fs.copyFileSync(fixture, 'art/Hero.aseprite');

    // 1. References.
    assert.deepStrictEqual(AV.parseRef('Walker.aseprite#Hair'), { file: 'Walker.aseprite', layer: 'Hair' });
    assert.deepStrictEqual(AV.parseRef('art/Hero.ase # Body'), { file: 'art/Hero.ase', layer: 'Body' });
    assert.strictEqual(AV.parseRef('$Cape'), null, 'plain sheet names are not references');
    assert.strictEqual(AV.pathFor('Walker.aseprite'), 'img/characters/Walker.aseprite');
    assert.strictEqual(AV.pathFor('art/Hero.aseprite'), 'art/Hero.aseprite');
    assert.strictEqual(AV.resolve('$Cape'), '$Cape', 'plain names pass through');

    // 2. In a playtest the sheet is made, recorded and used.
    assert.strictEqual(AV.resolve('Walker.aseprite#Hair'), '$Walker_Hair');
    assert.ok(fs.existsSync('img/characters/$Walker_Hair.png') && fs.existsSync('img/characters/$Walker_Body.png'), "every layer's sheet is written");
    const png = fs.readFileSync('img/characters/$Walker_Hair.png');
    assert.deepStrictEqual(Array.from(png.subarray(1, 4)), [80, 78, 71], 'a real PNG');
    const manifest = JSON.parse(fs.readFileSync('data/DocsDoodadsAseprite.json', 'utf8'));
    assert.strictEqual(manifest.refs['img/characters/walker.aseprite#hair'], '$Walker_Hair', 'recorded in the manifest');
    assert.strictEqual(AV.resolve('art/Hero.aseprite#body'), '$Hero_Body', 'a project path, any case');
    assert.strictEqual(AV.resolve('Walker.aseprite#Cape'), '', 'a layer that is not there is skipped');
    assert.ok(warnings.some(w => /no visible layer named "Cape".*Body, Hair/.test(w)), 'and says which layers there are');
    assert.strictEqual(AV.resolve('Missing.aseprite#Hair'), '', 'so is a missing file');

    // 3. Gear tagged with an Aseprite layer draws from its sheet; a missing one leaves the rest.
    const layers = VE.resolve({ actorNote: '<visual base: Walker.aseprite#Body, part body>', equipNotes: ['<visual: Walker.aseprite#Hair, z 2>', '<visual: Walker.aseprite#Cape>'] }, {});
    assert.deepStrictEqual(layers.map(l => [l.image, l.z]), [['$Walker_Body', 1], ['$Walker_Hair', 2]]);
    const sig = VE.signature(layers);

    // 4. Saving the .aseprite again remakes its sheets and makes wearers rebuild.
    ImageManager._cache['img/characters/%24Walker_Hair.png'] = { old: true };
    // The sheets were made a while ago; the .aseprite was saved since.
    const past = Date.now() / 1000 - 100;
    for (const f of fs.readdirSync('img/characters').filter(n => n.endsWith('.png'))) fs.utimesSync('img/characters/' + f, past, past);
    fs.utimesSync('img/characters/Walker.aseprite', past + 50, past + 50);
    const before = fs.statSync('img/characters/$Walker_Hair.png').mtimeMs;
    AV.queue('img/characters/Walker.aseprite');
    clearTimeout(AV.timer);
    assert.deepStrictEqual(AV.flush(), ['img/characters/Walker.aseprite']);
    assert.ok(fs.statSync('img/characters/$Walker_Hair.png').mtimeMs > before, 'rewritten');
    assert.ok(loads.some(u => /^img\/characters\/%24Walker_Hair\.png\?v=\d+$/.test(u)), 'the loaded picture is fetched again, fresh');
    assert.notStrictEqual(VE.signature(VE.resolve({ equipNotes: ['<visual base: Walker.aseprite#Body, part body>', '<visual: Walker.aseprite#Hair, z 2>'] }, {})), sig, 'wearers rebuild');
    assert.deepStrictEqual(AV.flush(), [], 'nothing pending');
    AV.queue('img/characters/Other.aseprite');
    clearTimeout(AV.timer);
    assert.deepStrictEqual(AV.flush(), [], 'a file no gear uses is left alone');

    // 5. Up to date: not rewritten.
    const stamp = fs.statSync('img/characters/$Walker_Body.png').mtimeMs;
    AV._names.clear();
    AV.resolve('Walker.aseprite#Body');
    assert.strictEqual(fs.statSync('img/characters/$Walker_Body.png').mtimeMs, stamp, 'current sheets are kept');

    // 6. A deployed game reads the .aseprite but writes nothing; without file access the manifest names it.
    AV.stop();
    testMode = false;
    AV._names.clear();
    fs.unlinkSync('img/characters/$Walker_Body.png');
    assert.strictEqual(AV.resolve('Walker.aseprite#Body'), '$Walker_Body', 'named from the file');
    assert.ok(!fs.existsSync('img/characters/$Walker_Body.png'), 'nothing written outside a playtest');
    const realFs = DocsDoodads.FS.fs;
    DocsDoodads.FS.fs = null;
    AV._names.clear();
    AV._files.clear();
    assert.strictEqual(AV.resolve('Walker.aseprite#Hair'), '$Walker_Hair', 'no file access: the manifest');
    assert.strictEqual(AV.resolve('Walker.aseprite#Nope'), '', 'not in the manifest: skipped');
    DocsDoodads.FS.fs = realFs;
    testMode = true;

    // 7. The notetag builder lists every layer of every .aseprite in img/characters.
    assert.deepStrictEqual(AV.refs(), ['Walker.aseprite#Body', 'Walker.aseprite#Hair']);
} finally {
    console.warn = warn;
    AV.stop();
    process.chdir(cwd);
    fs.rmSync(proj, { recursive: true, force: true });
}

console.log("✓ Aseprite gear: references, sheets made and recorded in playtests, gear drawn from them, remade on save with wearers rebuilding, kept when current, deployed and file-less games, and the builder's list.");
