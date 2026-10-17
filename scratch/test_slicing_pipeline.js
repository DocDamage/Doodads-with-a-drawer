// Phase 5/6 fixture tests for metadata readers and the visual slicing pipeline.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, getContext: () => ({}) }),
    getElementById: () => null,
    body: { appendChild() {}, removeChild() {} }
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');

function pixels(width, height, color = [0, 0, 0, 0]) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let index = 0; index < width * height; index++) data.set(color, index * 4);
    return data;
}

function rect(data, width, x, y, w, h, color) {
    for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) data.set(color, (py * width + px) * 4);
    }
}

console.log('=== Testing Visual Slicing Pipeline & Atlas Metadata ===');
assert.strictEqual(typeof DocsDoodads.Slicing.Visual.analyzePixels, 'function');

const transparent = pixels(48, 24);
rect(transparent, 48, 3, 4, 10, 15, [220, 30, 30, 255]);
rect(transparent, 48, 31, 5, 11, 14, [30, 80, 220, 255]);
transparent[(2 * 48 + 20) * 4 + 3] = 6; // faint alpha noise
const transparentResult = DocsDoodads.Slicing.Visual.analyzePixels(transparent, 48, 24, { minArea: 8, padding: 0 });
assert.strictEqual(transparentResult.backgroundMode, 'transparent');
assert.strictEqual(transparentResult.regions.length, 2);
assert(transparentResult.confidence >= 0.75 && transparentResult.confidence <= 1);

const opaque = pixels(52, 26, [248, 248, 248, 255]);
rect(opaque, 52, 4, 5, 12, 16, [20, 40, 60, 255]);
rect(opaque, 52, 34, 4, 13, 17, [80, 25, 90, 255]);
const opaqueResult = DocsDoodads.Slicing.Visual.analyzePixels(opaque, 52, 26, { minArea: 8, padding: 0 });
assert.strictEqual(opaqueResult.backgroundMode, 'opaque');
assert.strictEqual(opaqueResult.regions.length, 2, 'border-connected opaque background must be removed');
assert(opaqueResult.confidence >= 0.7);

const fragments = pixels(50, 30);
rect(fragments, 50, 4, 9, 10, 16, [20, 180, 80, 255]);
rect(fragments, 50, 16, 12, 2, 3, [20, 180, 80, 255]); // detached detail belonging to first sprite
rect(fragments, 50, 35, 8, 10, 17, [180, 80, 20, 255]);
const fragmentResult = DocsDoodads.Slicing.Visual.analyzePixels(fragments, 50, 30, {
    minArea: 3, padding: 0, fragmentMaxAreaRatio: 0.2, fragmentAttachDistance: 5
});
assert.strictEqual(fragmentResult.regions.length, 2, 'unambiguous detached detail should attach to its nearest sprite');
assert(fragmentResult.regions[0].w >= 14, 'attached detail must expand the first sprite bounds');

const empty = pixels(20, 20);
const emptyResult = DocsDoodads.Slicing.Visual.analyzePixels(empty, 20, 20, { padding: 0 });
assert.strictEqual(emptyResult.regions.length, 0);
assert(emptyResult.confidence < 0.5, 'empty or ambiguous results must not claim high confidence');

const fixtureDir = path.join(__dirname, 'slicing_metadata_fixture');
const imagePath = path.join(fixtureDir, 'hero.png');
try {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(imagePath, 'image placeholder');
    fs.writeFileSync(path.join(fixtureDir, 'hero.json'), JSON.stringify({
        frames: {
            'idle_0.png': {
                frame: { x: 1, y: 2, w: 16, h: 20 }, rotated: false, trimmed: true,
                spriteSourceSize: { x: 3, y: 4, w: 16, h: 20 }, sourceSize: { w: 24, h: 30 },
                pivot: { x: 0.4, y: 0.9 }, duration: 90
            },
            'idle_1.png': {
                frame: { x: 20, y: 2, w: 20, h: 16 }, rotated: true, trimmed: false,
                sourceSize: { w: 20, h: 16 }, duration: 110
            }
        },
        meta: { frameTags: [{ name: 'idle', from: 0, to: 1, direction: 'pingpong' }] }
    }));

    const metadata = DocsDoodads.Slicing.Metadata.parse(imagePath);
    assert.strictEqual(metadata.regions.length, 2);
    assert.strictEqual(metadata.regions[0].trimmed, true);
    assert.deepStrictEqual(metadata.regions[0].sourceSize, { w: 24, h: 30 });
    assert.strictEqual(metadata.regions[1].rotated, true);
    assert.strictEqual(metadata.regions[1].duration, 110);
    assert.deepStrictEqual(metadata.animationGroups[0], {
        name: 'idle', direction: 'pingpong', frames: ['idle_0.png', 'idle_1.png']
    });

    assert.strictEqual(typeof DocsDoodads.Export.getRegionGeometry, 'function');
    assert.deepStrictEqual(DocsDoodads.Export.getRegionGeometry(metadata.regions[0]), {
        atlasW: 16, atlasH: 20, contentW: 16, contentH: 20,
        outputW: 24, outputH: 30, destinationX: 3, destinationY: 4, rotated: false
    });
    // Rotated frame: frame w/h (20x16) is the unrotated sprite, so it covers 16x20 on the sheet (PIXI convention).
    assert.deepStrictEqual([metadata.regions[1].w, metadata.regions[1].h], [16, 20]);
    assert.deepStrictEqual(DocsDoodads.Export.getRegionGeometry(metadata.regions[1]), {
        atlasW: 16, atlasH: 20, contentW: 20, contentH: 16,
        outputW: 20, outputH: 16, destinationX: 0, destinationY: 0, rotated: true
    });
    assert.strictEqual(DocsDoodads.Export.safeFileName('../../bad:name?.png'), 'bad_name_.png');
} finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
}

console.log('✓ Transparent, opaque, fragment, confidence, trim, rotate, and animation fixtures verified.');
console.log('=== Slicing Pipeline Tests Passed ===');
