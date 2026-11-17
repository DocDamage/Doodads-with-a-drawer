'use strict';
// Animated GIF/APNG import: bounded compositing, a PNG frame sheet, transactional ingest and immediate play.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const E = require('./engine/fake_engine');
const PngRead = require('../scripts/png_read');

E.install(); E.setupWorld();
require('../Docs-Doodads.js');
const D = DocsDoodads;

const rgba = (...pixels) => Uint8Array.from(pixels.flat());
const frame = (width, height, pixels, delayMs = 100) => ({ width, height, rgba: rgba(...pixels), delayMs });
const solid = (width, height, colour, delayMs = 100) => frame(width, height, Array.from({ length: width * height }, () => colour), delayMs);
const pixel = (picture, x, y) => Array.from(picture.rgba.slice((y * picture.width + x) * 4, (y * picture.width + x + 1) * 4));

function gifFixture(width, height, pictures, background = 0) {
    const palette = [[0, 0, 0], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 255], [255, 0, 255], [0, 255, 255], [255, 255, 0]];
    const out = [71, 73, 70, 56, 57, 97];
    const word = value => out.push(value & 255, value >> 8 & 255);
    word(width); word(height); out.push(0xf2, background, 0);
    for (const colour of palette) out.push(...colour);
    for (const picture of pictures) {
        const disposal = picture.disposal || 0, transparent = picture.transparent;
        out.push(0x21, 0xf9, 4, (disposal << 2) | (transparent === undefined ? 0 : 1));
        word(Math.max(1, Math.round((picture.delayMs || 100) / 10)));
        out.push(transparent === undefined ? 0 : transparent, 0);
        out.push(0x2c); word(picture.x || 0); word(picture.y || 0); word(picture.width); word(picture.height);
        out.push(picture.interlaced ? 0x40 : 0);
        out.push(3, ...D.Gif.lzw(Uint8Array.from(picture.indices), 3));
    }
    out.push(0x3b);
    return Uint8Array.from(out);
}

function pngChunk(type, body) {
    body = Buffer.from(body);
    const out = Buffer.alloc(12 + body.length);
    out.writeUInt32BE(body.length, 0); out.write(type, 4, 4, 'ascii'); body.copy(out, 8);
    out.writeUInt32BE(D.AsepriteSheets.crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
}
function apngFixture() {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(2, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
    const actl = Buffer.alloc(8); actl.writeUInt32BE(4, 0); actl.writeUInt32BE(0, 4);
    let sequence = 0;
    const control = (w, h, x, y, delay, dispose, blend) => {
        const b = Buffer.alloc(26); b.writeUInt32BE(sequence++, 0); b.writeUInt32BE(w, 4); b.writeUInt32BE(h, 8);
        b.writeUInt32BE(x, 12); b.writeUInt32BE(y, 16); b.writeUInt16BE(delay, 20); b.writeUInt16BE(100, 22);
        b[24] = dispose; b[25] = blend; return pngChunk('fcTL', b);
    };
    const raw = pixels => zlib.deflateSync(Buffer.from([0, ...pixels]));
    const fdat = pixels => { const b = Buffer.alloc(4); b.writeUInt32BE(sequence++, 0); return pngChunk('fdAT', Buffer.concat([b, raw(pixels)])); };
    return Buffer.concat([
        signature, pngChunk('IHDR', ihdr), pngChunk('acTL', actl),
        control(2, 1, 0, 0, 10, 0, 0), pngChunk('IDAT', raw([255, 0, 0, 255, 255, 0, 0, 255])),
        control(1, 1, 0, 0, 10, 2, 1), fdat([0, 0, 255, 128]),
        control(1, 1, 1, 0, 20, 1, 0), fdat([0, 255, 0, 255]),
        control(1, 1, 0, 0, 10, 0, 0), fdat([255, 255, 255, 255]), pngChunk('IEND', Buffer.alloc(0))
    ]);
}

async function main() {
    assert.ok(D.GifRead && D.ApngRead && D.AnimatedImport, 'animated readers and import helper exist');

    // The existing writer round-trips whole composited pictures and its hundredths become milliseconds.
    const original = [
        frame(2, 2, [[255, 0, 0, 255], [255, 0, 0, 255], [255, 0, 0, 255], [255, 0, 0, 255]]),
        frame(2, 2, [[0, 255, 0, 255], [0, 255, 0, 255], [0, 255, 0, 255], [0, 255, 0, 255]])
    ];
    const roundTrip = D.GifRead.frames(D.Gif.encode(original, { delay: 6 }));
    assert.strictEqual(roundTrip.length, 2); assert.deepStrictEqual(pixel(roundTrip[0], 0, 0), [255, 0, 0, 255]);
    assert.deepStrictEqual(pixel(roundTrip[1], 1, 1), [0, 255, 0, 255]); assert.strictEqual(roundTrip[0].delayMs, 60);

    // Disposal 2 clears the prior rectangle to the GIF background; disposal 3 restores its saved canvas.
    const disposed = D.GifRead.frames(gifFixture(2, 1, [
        { width: 2, height: 1, indices: [1, 1], disposal: 2 },
        { width: 1, height: 1, x: 0, indices: [3], disposal: 1 },
        { width: 2, height: 1, indices: [1, 1], disposal: 1 },
        { width: 1, height: 1, x: 0, indices: [3], disposal: 3 },
        { width: 1, height: 1, x: 1, indices: [2], disposal: 1 }
    ]));
    assert.deepStrictEqual([pixel(disposed[1], 0, 0), pixel(disposed[1], 1, 0)], [[0, 0, 255, 255], [0, 0, 0, 255]]);
    assert.deepStrictEqual([pixel(disposed[4], 0, 0), pixel(disposed[4], 1, 0)], [[255, 0, 0, 255], [0, 255, 0, 255]]);
    const interlaced = D.GifRead.frames(gifFixture(1, 4, [{ width: 1, height: 4, interlaced: true, indices: [1, 3, 2, 4] }]))[0];
    assert.deepStrictEqual([0, 1, 2, 3].map(y => pixel(interlaced, 0, y)),
        [[255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 255, 255], [255, 255, 255, 255]]);

    // APNG source/over blending and both previous/background disposal produce whole-canvas frames.
    const apngBytes = apngFixture();
    const apng = D.ApngRead.frames(apngBytes, bytes => zlib.inflateSync(bytes));
    assert.strictEqual(apng.length, 4);
    assert.deepStrictEqual(pixel(apng[1], 0, 0), [127, 0, 128, 255], 'half-blue blends over red');
    assert.deepStrictEqual([pixel(apng[2], 0, 0), pixel(apng[2], 1, 0)], [[255, 0, 0, 255], [0, 255, 0, 255]], 'previous restores before frame 3');
    assert.deepStrictEqual([pixel(apng[3], 0, 0), pixel(apng[3], 1, 0)], [[255, 255, 255, 255], [0, 0, 0, 0]], 'background clears frame 3 rectangle');

    // Packing wraps under the side bound, records the real count so padded cells never play, and chooses
    // the commonest delay. A single frame is an ordinary still PNG.
    const packed = D.AnimatedImport.pack(Array.from({ length: 5 }, (_, i) => solid(3, 1, [i * 20, 0, 0, 255], i === 2 ? 200 : 100)),
        bytes => zlib.deflateSync(bytes), { maxSide: 12 });
    assert.deepStrictEqual([packed.xFrame, packed.yFrame, packed.frameCount, packed.frameUpdate], [4, 2, 5, 6]);
    assert.strictEqual(packed.variedDelay, true); assert.strictEqual(PngRead.decode(Buffer.from(packed.bytes)).width, 12);
    const still = D.AnimatedImport.pack([original[0]], bytes => zlib.deflateSync(bytes));
    assert.deepStrictEqual([still.xFrame, still.yFrame, still.frameCount, still.frameUpdate], [1, 1, 1, 0]);
    assert.throws(() => D.AnimatedImport.pack([solid(3, 3, [1, 2, 3, 255]), solid(3, 3, [4, 5, 6, 255])], zlib.deflateSync, { maxSide: 4 }), /4096|fit|limit/i);

    // Import uses the existing temp/backup transaction, writes only a generated PNG, leaves the source
    // bytes alone, indexes animation metadata, and makes a newly placed doodad play immediately.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-animated-import-'));
    const sourceDir = path.join(root, 'source'), project = path.join(root, 'project');
    fs.mkdirSync(sourceDir, { recursive: true }); fs.mkdirSync(project, { recursive: true });
    const sourceGif = path.join(sourceDir, 'Spark.gif');
    const sourceBytes = Buffer.from(D.Gif.encode(original, { delay: 6 })); fs.writeFileSync(sourceGif, sourceBytes);
    const oldCwd = process.cwd(); process.chdir(project);
    try {
        D.AssetIndex.data = { version: 1, projectId: 'animated-test', generatedAt: 0, assets: {}, collections: {}, settings: {} };
        D.AssetIndex.list = [];
        const result = await D.Workspace.runAssetImport([sourceGif], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(result.ok, true, JSON.stringify(result.errors));
        assert.deepStrictEqual(fs.readFileSync(sourceGif), sourceBytes, 'the original GIF is never modified or moved');
        const destination = path.join(project, 'img', 'doodads', 'Spark.png');
        assert.strictEqual(fs.existsSync(destination), true); assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'Spark.gif')), false);
        assert.ok(result.warnings.some(message => /256 colours|soft edges/i.test(message)), 'GIF limitation is said at actual import');
        const asset = D.AssetIndex.data.assets['img/doodads/spark.png'];
        assert.ok(asset && asset.animation); assert.deepStrictEqual([asset.animation.xFrame, asset.animation.yFrame, asset.animation.frameCount], [2, 1, 2]);
        assert.strictEqual(asset.slice.regions.length, 2, 'Cut Up Sheet sees each imported frame');
        const doodad = D.Workspace.newDoodadFromAsset(asset, 10, 20, false);
        assert.deepStrictEqual([doodad.frameW, doodad.frameH, doodad.xFrame, doodad.yFrame, doodad.frameUpdate, doodad.anim.frameCount], [2, 2, 2, 1, 4, 2]);
        assert.strictEqual(D.FrameAnim.total(Object.assign({}, doodad, { xFrame: 4, yFrame: 2, anim: { frameCount: 5 } })), 5);
        let shown = -1;
        Sprite_DocsDoodad.prototype.updateFrameAnimation.call({ _data: { xFrame: 4, yFrame: 2, anim: { frameCount: 5 } }, _currentFrame: 4, showFrame(i) { shown = i; } });
        assert.strictEqual(shown, 0, 'the runtime skips padded cells and loops at the real frame count');

        const cancelledGif = path.join(sourceDir, 'Cancelled.gif'); fs.writeFileSync(cancelledGif, sourceBytes);
        const cancelled = await D.Workspace.runAssetImport([cancelledGif], {
            projectRoot: project, destination: 'img/doodads', cancellationToken: { cancelled: true }
        });
        assert.strictEqual(cancelled.cancelled, true); assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'Cancelled.png')), false);
        assert.deepStrictEqual(fs.readFileSync(cancelledGif), sourceBytes, 'cancel leaves the original and no half-made PNG');

        const sourceApng = path.join(sourceDir, 'Weather.png'); fs.writeFileSync(sourceApng, apngBytes);
        const apngResult = await D.Workspace.runAssetImport([sourceApng], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(apngResult.ok, true, JSON.stringify(apngResult.errors));
        assert.ok(apngResult.warnings.some(message => /different frame times|commonest/i.test(message)));
        assert.strictEqual(D.AssetIndex.data.assets['img/doodads/weather.png'].animation.frameCount, 4);
    } finally {
        process.chdir(oldCwd);
        fs.rmSync(root, { recursive: true, force: true });
    }

    // Malformed/unsupported inputs fail before the transaction writes anything and say what is unsupported.
    assert.throws(() => D.GifRead.frames(Uint8Array.from([71, 73, 70])), /GIF|truncated/i);
    const badColour = Buffer.from(apngBytes); badColour[25] = 3;
    assert.throws(() => D.ApngRead.frames(badColour, zlib.inflateSync), /RGB|RGBA|colour/i);
    console.log('PASS animated GIF/APNG decode, disposal, bounded sheet, transaction, metadata and runtime playback');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
