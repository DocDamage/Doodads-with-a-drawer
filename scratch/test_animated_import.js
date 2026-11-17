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
function oneFrameApng(options = {}) {
    const width = options.width || 2, height = options.height || 1, depth = options.depth === undefined ? 8 : options.depth;
    const colour = options.colour === undefined ? 6 : options.colour;
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = depth; ihdr[9] = colour;
    const actl = Buffer.alloc(8); actl.writeUInt32BE(1, 0);
    const fctl = Buffer.alloc(26); fctl.writeUInt32BE(0, 0); fctl.writeUInt32BE(options.frameWidth || width, 4); fctl.writeUInt32BE(options.frameHeight || height, 8);
    fctl.writeUInt32BE(options.frameX || 0, 12); fctl.writeUInt32BE(options.frameY || 0, 16); fctl.writeUInt16BE(10, 20); fctl.writeUInt16BE(100, 22);
    const chunks = [];
    if (options.beforeHeader) chunks.push(pngChunk('tEXt', Buffer.alloc(0)));
    chunks.push(pngChunk('IHDR', ihdr));
    if (options.duplicateHeader) chunks.push(pngChunk('IHDR', ihdr));
    if (options.palette) chunks.push(pngChunk('PLTE', Buffer.from(options.palette.flat())));
    if (options.transparency) chunks.push(pngChunk('tRNS', Buffer.from(options.transparency)));
    if (!options.lateAnimation) chunks.push(pngChunk('acTL', actl));
    chunks.push(pngChunk('fcTL', fctl), pngChunk('IDAT', zlib.deflateSync(Buffer.from([0, ...(options.row || [255, 0, 0, 255, 255, 0, 0, 255])]))));
    if (options.lateAnimation) chunks.push(pngChunk('acTL', actl));
    chunks.push(pngChunk('IEND', Buffer.alloc(0)));
    return Buffer.concat([signature, ...chunks]);
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
    const manyPixels = frame(32, 32, Array.from({ length: 1024 }, (_, index) => [index % 16 * 17, Math.floor(index / 16) % 16 * 17, index * 7 % 16 * 17, 255]));
    assert.strictEqual(D.GifRead.frames(D.Gif.encode([manyPixels], { delay: 4 }))[0].rgba.length, manyPixels.rgba.length,
        'LZW code-size changes round-trip beyond a tiny fixture');
    const transparent = D.GifRead.frames(gifFixture(2, 1, [{ width: 2, height: 1, indices: [1, 0], transparent: 0 }]))[0];
    assert.strictEqual(pixel(transparent, 1, 0)[3], 0, 'untouched transparent GIF pixels remain transparent');

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
    const indexed = D.ApngRead.frames(oneFrameApng({ depth: 2, colour: 3, palette: [[255, 0, 0], [0, 255, 0]], transparency: [255, 0], row: [0x10] }), zlib.inflateSync)[0];
    assert.deepStrictEqual([pixel(indexed, 0, 0), pixel(indexed, 1, 0)], [[255, 0, 0, 255], [0, 255, 0, 0]], 'indexed APNG palette alpha is retained');
    const grey = D.ApngRead.frames(oneFrameApng({ depth: 4, colour: 0, transparency: [0, 10], row: [0xa5] }), zlib.inflateSync)[0];
    assert.deepStrictEqual([pixel(grey, 0, 0), pixel(grey, 1, 0)], [[170, 170, 170, 0], [85, 85, 85, 255]], 'packed greyscale and tRNS are decoded');
    const badCrc = Buffer.from(oneFrameApng()); badCrc[badCrc.indexOf('IDAT') + 4] ^= 1;
    assert.throws(() => D.ApngRead.frames(badCrc, zlib.inflateSync), /CRC/i);
    assert.throws(() => D.ApngRead.frames(oneFrameApng({ lateAnimation: true }), zlib.inflateSync), /acTL|before.*IDAT/i);
    assert.throws(() => D.ApngRead.frames(oneFrameApng({ frameWidth: 1 }), zlib.inflateSync), /default|IHDR|full/i);
    assert.throws(() => D.ApngRead.frames(oneFrameApng({ beforeHeader: true }), zlib.inflateSync), /IHDR.*first|header/i);
    assert.throws(() => D.ApngRead.frames(oneFrameApng({ duplicateHeader: true }), zlib.inflateSync), /IHDR|header/i);
    const baseApng = oneFrameApng(), emptyChunks = Array.from({ length: 4097 }, () => pngChunk('aaAa', Buffer.alloc(0)));
    const tooManyChunks = Buffer.concat([baseApng.subarray(0, 33), ...emptyChunks, baseApng.subarray(33)]);
    assert.throws(() => D.ApngRead.frames(tooManyChunks, zlib.inflateSync), /chunks|complex/i);

    // Packing wraps under the side bound, records the real count so padded cells never play, and chooses
    // the commonest delay. A single frame is an ordinary still PNG.
    const packed = D.AnimatedImport.pack(Array.from({ length: 5 }, (_, i) => solid(3, 1, [i * 20, 0, 0, 255], i === 2 ? 200 : 100)),
        bytes => zlib.deflateSync(bytes), { maxSide: 12 });
    assert.deepStrictEqual([packed.xFrame, packed.yFrame, packed.frameCount, packed.frameUpdate], [4, 2, 5, 6]);
    assert.strictEqual(packed.variedDelay, true); assert.strictEqual(PngRead.decode(Buffer.from(packed.bytes)).width, 12);
    const still = D.AnimatedImport.pack([original[0]], bytes => zlib.deflateSync(bytes));
    assert.deepStrictEqual([still.xFrame, still.yFrame, still.frameCount, still.frameUpdate], [1, 1, 1, 0]);
    const zeroDelay = D.AnimatedImport.pack([solid(1, 1, [1, 2, 3, 255], 0), solid(1, 1, [4, 5, 6, 255], 0)], bytes => zlib.deflateSync(bytes));
    assert.strictEqual(zeroDelay.frameUpdate, 1, 'a zero-delay source runs at the game minimum rather than an invented tenth-second pause');
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
        assert.strictEqual(D.FrameAnim.total({ xFrame: 4, yFrame: 2, anim: { frameCount: Infinity } }), 8, 'corrupt counts clamp to the grid');
        assert.ok(Number.isFinite(D.FrameAnim.total({ xFrame: Infinity, yFrame: Infinity, anim: { frameCount: Infinity } })), 'corrupt grid dimensions stay finite');
        const runtimeDoodad = Object.assign(D.standardStruct(), { xFrame: 4, yFrame: 2, anim: { frameCount: 5 }, bit: [3, 'img/doodads/Spark.png'] });
        $dataDocsDoodads[1] = [runtimeDoodad];
        const runtimeSpriteset = new Spriteset_Map();
        const runtimeSprite = runtimeSpriteset._docsDoodadSprites[0];
        runtimeSprite._currentFrame = 4; runtimeSprite.updateFrameAnimation();
        assert.strictEqual(runtimeSprite._currentFrame, 0, 'the runtime skips padded cells and loops at the real frame count');

        const actorGif = path.join(sourceDir, 'Actor.gif'); fs.writeFileSync(actorGif, sourceBytes);
        const actorResult = await D.Workspace.runAssetImport([actorGif], { projectRoot: project });
        assert.strictEqual(actorResult.ok, true, JSON.stringify(actorResult.errors));
        const actorAsset = D.AssetIndex.data.assets['img/characters/actor.png'];
        assert.ok(actorAsset && actorAsset.animation, 'an auto-routed character GIF keeps generated animation metadata');
        assert.strictEqual(actorAsset.placement.defaultMode, 'doodad', 'a new frame strip uses doodad animation instead of MZ event-sheet rules');
        actorAsset.placement = { defaultMode: 'event', depth: 'above' };
        const actorAgain = await D.Workspace.runAssetImport([actorGif], { projectRoot: project, collisionPolicy: 'overwrite' });
        assert.strictEqual(actorAgain.ok, true, JSON.stringify(actorAgain.errors));
        assert.deepStrictEqual(D.AssetIndex.data.assets['img/characters/actor.png'].placement, { defaultMode: 'event', depth: 'above' },
            're-import preserves an existing authored placement preference');

        const plainSource = path.join(sourceDir, 'Spark.png');
        const sameSizeStill = D.AnimatedImport.pack([solid(4, 2, [30, 40, 50, 255])], bytes => zlib.deflateSync(bytes));
        fs.writeFileSync(plainSource, sameSizeStill.bytes);
        const plainOverwrite = await D.Workspace.runAssetImport([plainSource], {
            projectRoot: project, destination: 'img/doodads', collisionPolicy: 'overwrite'
        });
        assert.strictEqual(plainOverwrite.ok, true, JSON.stringify(plainOverwrite.errors));
        assert.strictEqual(D.AssetIndex.data.assets['img/doodads/spark.png'].animation, undefined,
            'explicitly replacing an animated import with a plain same-size PNG clears generated animation metadata');

        const cancelledGif = path.join(sourceDir, 'Cancelled.gif'); fs.writeFileSync(cancelledGif, sourceBytes);
        const cancelled = await D.Workspace.runAssetImport([cancelledGif], {
            projectRoot: project, destination: 'img/doodads', cancellationToken: { cancelled: true }
        });
        assert.strictEqual(cancelled.cancelled, true); assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'Cancelled.png')), false);
        assert.deepStrictEqual(fs.readFileSync(cancelledGif), sourceBytes, 'cancel leaves the original and no half-made PNG');

        const sourceApng = path.join(sourceDir, 'Weather.png'); fs.writeFileSync(sourceApng, apngBytes);
        const apngResult = await D.Workspace.runAssetImport([sourceApng], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(apngResult.ok, true, JSON.stringify(apngResult.errors));
        assert.deepStrictEqual(fs.readFileSync(sourceApng), apngBytes, 'the original APNG is preserved too');
        assert.ok(apngResult.warnings.some(message => /different frame times|commonest/i.test(message)));
        assert.strictEqual(D.AssetIndex.data.assets['img/doodads/weather.png'].animation.frameCount, 4);

        const namedApng = path.join(sourceDir, 'Cloud.apng'); fs.writeFileSync(namedApng, apngBytes);
        const namedResult = await D.Workspace.runAssetImport([namedApng], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(namedResult.ok, true, JSON.stringify(namedResult.errors));
        assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'Cloud.png')), true, 'the standard .apng extension imports to a playable PNG');
        assert.deepStrictEqual(fs.readFileSync(namedApng), apngBytes, 'a named .apng source is preserved');
        const plainApng = path.join(sourceDir, 'NotAnimated.apng'); fs.writeFileSync(plainApng, still.bytes);
        const plainResult = await D.Workspace.runAssetImport([plainApng], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(plainResult.ok, false);
        assert.match(plainResult.errors[0].message, /\.apng|animated PNG|acTL/i, 'a non-animated .apng gets a useful error');
        assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'NotAnimated.png')), false);
        const probeBomb = path.join(sourceDir, 'ProbeBomb.png');
        fs.writeFileSync(probeBomb, Buffer.concat([baseApng.subarray(0, 33),
            ...Array.from({ length: 4097 }, () => pngChunk('aaAa', Buffer.alloc(0))), baseApng.subarray(33)]));
        const probePlan = D.Import.planBatch([probeBomb], { projectRoot: project, destination: 'img/doodads' });
        assert.strictEqual(probePlan.operations.length, 0);
        assert.match(probePlan.errors[0].message, /chunks|complex|4096/i, 'the lightweight PNG animation probe has the decoder chunk bound too');

        // Re-importing an APNG that already lives at its requested destination must never overwrite its
        // own source with the generated frame sheet, including when the source path reaches it by a link.
        const inPlace = path.join(project, 'img', 'doodads', 'InPlace.png'); fs.writeFileSync(inPlace, apngBytes);
        const inPlaceResult = await D.Workspace.runAssetImport([inPlace], {
            projectRoot: project, destination: 'img/doodads', collisionPolicy: 'overwrite'
        });
        assert.strictEqual(inPlaceResult.ok, true, JSON.stringify(inPlaceResult.errors));
        assert.deepStrictEqual(fs.readFileSync(inPlace), apngBytes, 'an in-place APNG source is never replaced by its generated sheet');
        assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'InPlace_1.png')), true, 'the generated sheet receives an unused name');
        const linkedSource = path.join(sourceDir, 'InPlace.png');
        let linked = false;
        try { fs.symlinkSync(inPlace, linkedSource, process.platform === 'win32' ? 'file' : undefined); linked = true; } catch (error) {}
        if (linked) {
            const linkedResult = await D.Workspace.runAssetImport([linkedSource], {
                projectRoot: project, destination: 'img/doodads', collisionPolicy: 'overwrite'
            });
            assert.strictEqual(linkedResult.ok, true, JSON.stringify(linkedResult.errors));
            assert.deepStrictEqual(fs.readFileSync(inPlace), apngBytes, 'a linked alias cannot overwrite the canonical APNG source');
            assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', 'InPlace_2.png')), true);
        }
    } finally {
        process.chdir(oldCwd);
        fs.rmSync(root, { recursive: true, force: true });
    }

    // Malformed/unsupported inputs fail before the transaction writes anything and say what is unsupported.
    assert.throws(() => D.GifRead.frames(Uint8Array.from([71, 73, 70])), /GIF|truncated/i);
    assert.throws(() => D.ApngRead.frames(oneFrameApng({ colour: 5 }), zlib.inflateSync), /colour|color/i);
    console.log('PASS animated GIF/APNG decode, disposal, bounded sheet, transaction, metadata and runtime playback');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
