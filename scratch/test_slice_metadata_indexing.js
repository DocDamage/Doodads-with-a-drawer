// Regressions: re-indexing must never discard hand-edited ("manual") slices, sidecar atlas
// metadata (TexturePacker/Aseprite/.saf.json) must actually be used, and rotated frames
// follow PIXI's convention (frame w/h = unrotated sprite size; sheet footprint is h x w).
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

require('../Docs-Doodads.js');

function png(width, height) {
    const crcTable = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len, body, c]); };
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.alloc((width * 4 + 1) * height))), chunk('IEND', Buffer.alloc(0))]);
}

async function main() {
    console.log('=== Testing Slice Metadata Indexing ===');
    const sandbox = path.join(__dirname, 'slice_metadata_indexing_fixture');
    fs.rmSync(sandbox, { recursive: true, force: true });
    process.on('exit', () => fs.rmSync(sandbox, { recursive: true, force: true }));
    for (const dir of ['img/faces', 'img/pictures']) fs.mkdirSync(path.join(sandbox, dir), { recursive: true });
    fs.writeFileSync(path.join(sandbox, 'img/faces/Actor1.png'), png(576, 288));
    fs.writeFileSync(path.join(sandbox, 'img/pictures/atlas.png'), png(64, 32));
    fs.writeFileSync(path.join(sandbox, 'img/pictures/atlas.json'), JSON.stringify({
        frames: {
            'sword.png': { frame: { x: 0, y: 0, w: 20, h: 12 }, rotated: true, trimmed: false, sourceSize: { w: 20, h: 12 } },
            'gem.png': { frame: { x: 12, y: 0, w: 10, h: 8 }, rotated: false, trimmed: true,
                spriteSourceSize: { x: 3, y: 2, w: 10, h: 8 }, sourceSize: { w: 16, h: 16 } }
        }
    }));

    const faceStat = fs.statSync(path.join(sandbox, 'img/faces/Actor1.png'));
    const manualRegions = [{ id: 'reid', name: 'Reid', x: 0, y: 0, w: 144, h: 144, pivotX: 0.5, pivotY: 0.5 }];
    DocsDoodads.AssetIndex.data = { version: 1, projectId: 't', generatedAt: 0, collections: {}, settings: {}, assets: {
        // Hand-edited slices from an older index revision; the file changed since too.
        'img/faces/actor1.png': { id: 'img/faces/actor1.png', path: 'img/faces/Actor1.png', fileName: 'Actor1.png',
            mtimeMs: faceStat.mtimeMs - 1000, sizeBytes: faceStat.size, entryRevision: 1,
            slice: { status: 'manual', method: 'manual', confidence: 1, regions: manualRegions } }
    } };

    await DocsDoodads.AssetIndex.scanAsync({ projectRoot: sandbox, roots: ['img/faces', 'img/pictures'], loadCache: false, save: false });
    const assets = DocsDoodads.AssetIndex.data.assets;

    const face = assets['img/faces/actor1.png'];
    assert.strictEqual(face.slice.status, 'manual', "re-indexing keeps hand-edited slices");
    assert.deepStrictEqual(face.slice.regions, manualRegions);
    assert.deepStrictEqual([face.width, face.height], [576, 288], "dimensions still refresh");

    const atlas = assets['img/pictures/atlas.png'];
    assert.strictEqual(atlas.slice.status, 'metadata', "a sidecar atlas JSON drives slicing");
    const sword = atlas.slice.regions.find(r => r.name === 'sword.png');
    assert.deepStrictEqual([sword.x, sword.y, sword.w, sword.h], [0, 0, 12, 20], "rotated frames occupy h x w on the sheet");
    const swordGeometry = DocsDoodads.Export.getRegionGeometry(sword);
    assert.deepStrictEqual([swordGeometry.contentW, swordGeometry.contentH, swordGeometry.outputW, swordGeometry.outputH], [20, 12, 20, 12],
        "a rotated, untrimmed frame exports at its sourceSize");
    const gem = DocsDoodads.Export.getRegionGeometry(atlas.slice.regions.find(r => r.name === 'gem.png'));
    assert.deepStrictEqual([gem.outputW, gem.outputH, gem.destinationX, gem.destinationY], [16, 16, 3, 2], "trimmed frames restore their margins");

    console.log('✓ Manual slices survive re-indexing; sidecar metadata and rotated frames slice correctly.');
}

main().catch(error => { console.error(error); process.exit(1); });
