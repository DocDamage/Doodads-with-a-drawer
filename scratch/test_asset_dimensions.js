// Regression: indexing must record real image dimensions so known MZ sheets
// (faces, IconSet, characters) are sliced from the actual size, not a 576x384 guess.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../QJ-Doodads.js');

function crc32(buf) {
    let c, crc = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
        c = (crc ^ buf[n]) & 0xff;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crc = (crc >>> 8) ^ c;
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
}
function png(width, height) {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6;
    const raw = Buffer.alloc((width * 4 + 1) * height);
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function main() {
    console.log('=== Testing Asset Dimension Indexing ===');
    const sandbox = path.join(__dirname, 'asset_dimensions_fixture');
    fs.rmSync(sandbox, { recursive: true, force: true });
    process.on('exit', () => fs.rmSync(sandbox, { recursive: true, force: true }));
    for (const dir of ['img/faces', 'img/system', 'img/characters']) fs.mkdirSync(path.join(sandbox, dir), { recursive: true });
    fs.writeFileSync(path.join(sandbox, 'img/faces/Actor1.png'), png(576, 288));
    fs.writeFileSync(path.join(sandbox, 'img/system/IconSet.png'), png(512, 640));
    fs.writeFileSync(path.join(sandbox, 'img/characters/$BigMonster.png'), png(288, 384));

    // A cached face entry written by an older index keeps its mtime/size but has the guessed size.
    const faceStat = fs.statSync(path.join(sandbox, 'img/faces/Actor1.png'));
    QJ.DD.AssetIndex.data = {
        version: 1, projectId: 'test', generatedAt: 0,
        assets: {
            'img/faces/actor1.png': {
                id: 'img/faces/actor1.png', path: 'img/faces/Actor1.png', fileName: 'Actor1.png',
                mtimeMs: faceStat.mtimeMs, sizeBytes: faceStat.size, width: 576, height: 384,
                favorite: true, tags: ['hero']
            }
        }, collections: {}, settings: {}
    };

    await QJ.DD.AssetIndex.scanAsync({ projectRoot: sandbox, roots: ['img/faces', 'img/system', 'img/characters'], loadCache: false, save: false });
    const assets = QJ.DD.AssetIndex.data.assets;

    const face = assets['img/faces/actor1.png'];
    assert.deepStrictEqual([face.width, face.height], [576, 288], 'face sheet should record its real size');
    assert.deepStrictEqual([face.slice.regions[0].w, face.slice.regions[0].h], [144, 144], 'face cells are 144x144');
    assert.strictEqual(face.slice.regions[7].y + face.slice.regions[7].h, 288, 'face regions must stay inside the image');
    assert.strictEqual(face.favorite, true, 'migrated entries keep favorites');
    assert.deepStrictEqual(face.tags, ['hero'], 'migrated entries keep tags');

    const icons = assets['img/system/iconset.png'];
    assert.deepStrictEqual([icons.width, icons.height], [512, 640]);
    assert.strictEqual(icons.slice.regions.length, 320, 'a 512x640 IconSet holds 16x20 icons');

    const big = assets['img/characters/$bigmonster.png'];
    assert.deepStrictEqual([big.slice.regions[0].cellW, big.slice.regions[0].cellH], [96, 96], '$ sheets split 3x4 from real size');

    console.log('✓ Real PNG dimensions drive known-sheet slicing, and stale cached sizes are re-indexed.');
}

main().catch(error => { console.error(error); process.exit(1); });
