// @editor-only
//==========================================================
// SECTION 11A: BOUNDED GIF/APNG READERS AND ANIMATED IMPORT
//==========================================================
(function() {
    'use strict';

    const limits = { inputBytes: 64 * 1024 * 1024, side: 4096, frames: 512, totalPixels: 32 * 1024 * 1024 };
    const bytesOf = value => value instanceof Uint8Array ? value : new Uint8Array(value || 0);
    const fail = message => { throw new Error(message); };
    const checkInput = (bytes, name) => {
        bytes = bytesOf(bytes);
        if (bytes.length > limits.inputBytes) fail(`${name} is larger than the 64 MB animated-image limit.`);
        return bytes;
    };
    const copy = value => new Uint8Array(value);
    const read16le = (bytes, at) => bytes[at] | bytes[at + 1] << 8;
    const read16be = (bytes, at) => bytes[at] << 8 | bytes[at + 1];
    const read32be = (bytes, at) => ((bytes[at] * 0x1000000) + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3]) >>> 0;
    const dimensions = (width, height, name) => {
        if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > limits.side || height > limits.side
            || width * height > limits.totalPixels) fail(`${name} dimensions exceed the 4096-pixel or memory limit.`);
    };
    const cancelled = token => Boolean(token && (token.cancelled || token.isCancelled));
    const checkCancelled = token => { if (cancelled(token)) { const error = new Error('Import cancelled.'); error.code = 'DD_IMPORT_CANCELLED'; throw error; } };

    function gifSubBlocks(bytes, state) {
        const parts = [];
        let total = 0;
        while (true) {
            if (state.at >= bytes.length) fail('GIF is truncated inside a data block.');
            const size = bytes[state.at++];
            if (!size) break;
            if (state.at + size > bytes.length) fail('GIF is truncated inside a data block.');
            parts.push(bytes.subarray(state.at, state.at + size)); total += size; state.at += size;
            if (total > limits.inputBytes) fail('GIF data exceeds the animated-image limit.');
        }
        const out = new Uint8Array(total);
        let at = 0;
        for (const part of parts) { out.set(part, at); at += part.length; }
        return out;
    }

    function gifLzw(data, minimum, expected) {
        if (minimum < 2 || minimum > 8) fail('GIF uses an invalid LZW code size.');
        const clear = 1 << minimum, end = clear + 1;
        let bit = 0, size, next, table;
        const reset = () => {
            size = minimum + 1; next = end + 1; table = new Array(4096);
            for (let index = 0; index < clear; index++) table[index] = [index];
        };
        const code = () => {
            if (bit + size > data.length * 8) return null;
            let value = 0;
            for (let i = 0; i < size; i++) value |= ((data[(bit + i) >> 3] >> ((bit + i) & 7)) & 1) << i;
            bit += size;
            return value;
        };
        reset();
        const out = [];
        let previous = null, ended = false;
        while (true) {
            const value = code();
            if (value === null) break;
            if (value === clear) { reset(); previous = null; continue; }
            if (value === end) { ended = true; break; }
            let entry = table[value];
            if (!entry && value === next && previous) entry = previous.concat(previous[0]);
            if (!entry) fail('GIF has invalid LZW data.');
            if (out.length + entry.length > expected) fail('GIF frame expands beyond its rectangle.');
            out.push(...entry);
            if (previous && next < 4096) {
                table[next++] = previous.concat(entry[0]);
                if (next === (1 << size) && size < 12) size++;
            }
            previous = entry;
        }
        if (!ended || out.length !== expected) fail('GIF frame data is truncated.');
        return Uint8Array.from(out);
    }

    DocsDoodads.GifRead = {
        frames(input, options = {}) {
            const bytes = checkInput(input, 'GIF');
            if (bytes.length < 13 || String.fromCharCode(...bytes.subarray(0, 6)) !== 'GIF87a'
                && String.fromCharCode(...bytes.subarray(0, 6)) !== 'GIF89a') fail('Not a complete GIF file.');
            const state = { at: 6 }, width = read16le(bytes, state.at), height = read16le(bytes, state.at + 2);
            dimensions(width, height, 'GIF');
            const packed = bytes[state.at + 4], backgroundIndex = bytes[state.at + 5]; state.at += 7;
            const readPalette = count => {
                if (state.at + count * 3 > bytes.length) fail('GIF colour palette is truncated.');
                const palette = [];
                for (let i = 0; i < count; i++, state.at += 3) palette.push([bytes[state.at], bytes[state.at + 1], bytes[state.at + 2], 255]);
                return palette;
            };
            const globalPalette = packed & 0x80 ? readPalette(1 << ((packed & 7) + 1)) : null;
            const background = globalPalette && globalPalette[backgroundIndex] ? globalPalette[backgroundIndex] : [0, 0, 0, 0];
            const canvas = new Uint8Array(width * height * 4);
            for (let p = 0; p < width * height; p++) canvas.set(background, p * 4);
            const frames = [];
            let control = { disposal: 0, delay: 10, transparent: -1 }, prior = null;
            const dispose = () => {
                if (!prior) return;
                if (prior.disposal === 2) {
                    for (let y = 0; y < prior.h; y++) for (let x = 0; x < prior.w; x++) canvas.set(prior.clear, ((prior.y + y) * width + prior.x + x) * 4);
                } else if (prior.disposal === 3 && prior.saved) canvas.set(prior.saved);
                prior = null;
            };
            let trailer = false;
            while (state.at < bytes.length) {
                checkCancelled(options.cancellationToken);
                const marker = bytes[state.at++];
                if (marker === 0x3b) { trailer = true; break; }
                if (marker === 0x21) {
                    if (state.at >= bytes.length) fail('GIF extension is truncated.');
                    const label = bytes[state.at++];
                    if (label === 0xf9) {
                        if (state.at + 6 > bytes.length || bytes[state.at++] !== 4) fail('GIF graphic control is truncated.');
                        const flags = bytes[state.at++], delay = read16le(bytes, state.at); state.at += 2;
                        const transparent = bytes[state.at++];
                        if (bytes[state.at++] !== 0) fail('GIF graphic control has no terminator.');
                        control = { disposal: flags >> 2 & 7, delay, transparent: flags & 1 ? transparent : -1 };
                    } else gifSubBlocks(bytes, state);
                    continue;
                }
                if (marker !== 0x2c) fail('GIF contains an unknown block.');
                if (state.at + 9 > bytes.length) fail('GIF image descriptor is truncated.');
                dispose();
                const x = read16le(bytes, state.at), y = read16le(bytes, state.at + 2), w = read16le(bytes, state.at + 4), h = read16le(bytes, state.at + 6);
                const imageFlags = bytes[state.at + 8]; state.at += 9;
                if (!w || !h || x + w > width || y + h > height) fail('GIF frame rectangle is outside its canvas.');
                if (frames.length + 1 > limits.frames || (frames.length + 1) * width * height > limits.totalPixels) fail('GIF has too many decoded pixels or frames.');
                const palette = imageFlags & 0x80 ? readPalette(1 << ((imageFlags & 7) + 1)) : globalPalette;
                if (!palette) fail('GIF frame has no colour palette.');
                if (state.at >= bytes.length) fail('GIF frame data is truncated.');
                const minimum = bytes[state.at++], indices = gifLzw(gifSubBlocks(bytes, state), minimum, w * h);
                const rows = [];
                if (imageFlags & 0x40) {
                    for (const [start, step] of [[0, 8], [4, 8], [2, 4], [1, 2]]) for (let row = start; row < h; row += step) rows.push(row);
                } else for (let row = 0; row < h; row++) rows.push(row);
                if (!frames.length && control.transparent === backgroundIndex) canvas.fill(0);
                const saved = control.disposal === 3 ? copy(canvas) : null;
                for (let sourceRow = 0; sourceRow < h; sourceRow++) for (let col = 0; col < w; col++) {
                    const colourIndex = indices[sourceRow * w + col];
                    if (colourIndex === control.transparent) continue;
                    const colour = palette[colourIndex];
                    if (!colour) fail('GIF frame refers to a missing palette colour.');
                    canvas.set(colour, ((y + rows[sourceRow]) * width + x + col) * 4);
                }
                frames.push({ width, height, rgba: copy(canvas), delayMs: control.delay * 10 });
                prior = { disposal: control.disposal, x, y, w, h, saved,
                    clear: control.transparent === backgroundIndex ? [0, 0, 0, 0] : background };
                control = { disposal: 0, delay: 10, transparent: -1 };
            }
            if (!trailer || !frames.length) fail('GIF has no complete picture.');
            return frames;
        }
    };

    function pngChunks(input) {
        const bytes = checkInput(input, 'PNG');
        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
        if (bytes.length < 20 || !signature.every((value, index) => bytes[index] === value)) fail('Not a complete PNG file.');
        const chunks = [];
        let at = 8, ended = false;
        while (at < bytes.length) {
            if (chunks.length >= 4096) fail('PNG has too many chunks to import safely.');
            if (at + 12 > bytes.length) fail('PNG chunk is truncated.');
            const length = read32be(bytes, at), type = String.fromCharCode(bytes[at + 4], bytes[at + 5], bytes[at + 6], bytes[at + 7]);
            if (length > limits.inputBytes || at + 12 + length > bytes.length) fail('PNG chunk is truncated or too large.');
            const expectedCrc = read32be(bytes, at + 8 + length);
            if (!DocsDoodads.AsepriteSheets || DocsDoodads.AsepriteSheets.crc32(bytes.subarray(at + 4, at + 8 + length)) !== expectedCrc) fail(`PNG ${type} chunk has a bad CRC.`);
            chunks.push({ type, body: bytes.subarray(at + 8, at + 8 + length) });
            at += 12 + length;
            if (type === 'IEND') { ended = true; break; }
        }
        if (!ended) fail('PNG has no end chunk.');
        if (at !== bytes.length) fail('PNG has data after its end chunk.');
        return chunks;
    }

    function pngPixels(compressed, frame, header, palette, transparency, inflate) {
        let inflated;
        const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.colour];
        const bitsPerPixel = channels * header.depth, stride = Math.ceil(frame.w * bitsPerPixel / 8);
        const filterBytes = Math.max(1, Math.ceil(bitsPerPixel / 8)), expected = (stride + 1) * frame.h;
        try { inflated = bytesOf(inflate(compressed, expected)); } catch (error) { fail(`APNG frame could not be inflated: ${error.message || error}`); }
        if (inflated.length !== expected) fail('APNG frame has an unexpected amount of pixel data.');
        const rows = new Uint8Array(stride * frame.h);
        let previous = new Uint8Array(stride);
        const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
        for (let y = 0; y < frame.h; y++) {
            const filter = inflated[y * (stride + 1)], line = inflated.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
            if (filter > 4) fail('APNG frame uses an unknown PNG filter.');
            const row = rows.subarray(y * stride, (y + 1) * stride);
            for (let i = 0; i < stride; i++) {
                const left = i >= filterBytes ? row[i - filterBytes] : 0, up = previous[i], corner = i >= filterBytes ? previous[i - filterBytes] : 0;
                const add = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, corner) : 0;
                row[i] = (line[i] + add) & 255;
            }
            previous = row;
        }
        const out = new Uint8Array(frame.w * frame.h * 4);
        const sample = (row, index) => {
            if (header.depth === 8) return row[index];
            const perByte = 8 / header.depth, byte = row[Math.floor(index / perByte)], shift = 8 - header.depth * (index % perByte + 1);
            return byte >> shift & (1 << header.depth) - 1;
        };
        const maxSample = (1 << header.depth) - 1;
        for (let y = 0; y < frame.h; y++) for (let x = 0; x < frame.w; x++) {
            const row = rows.subarray(y * stride, (y + 1) * stride), p = y * frame.w + x, target = p * 4;
            if (header.colour === 0) {
                const grey = sample(row, x), display = Math.round(grey * 255 / maxSample);
                out[target] = out[target + 1] = out[target + 2] = display;
                out[target + 3] = transparency && transparency.grey === grey ? 0 : 255;
            } else if (header.colour === 2) {
                const source = x * 3, red = row[source], green = row[source + 1], blue = row[source + 2];
                out[target] = red; out[target + 1] = green; out[target + 2] = blue;
                out[target + 3] = transparency && transparency.rgb[0] === red && transparency.rgb[1] === green && transparency.rgb[2] === blue ? 0 : 255;
            } else if (header.colour === 3) {
                const index = sample(row, x), colour = palette[index];
                if (!colour) fail('APNG frame refers to a missing palette colour.');
                out[target] = colour[0]; out[target + 1] = colour[1]; out[target + 2] = colour[2];
                out[target + 3] = transparency && index < transparency.palette.length ? transparency.palette[index] : 255;
            } else if (header.colour === 4) {
                const source = x * 2, grey = row[source];
                out[target] = out[target + 1] = out[target + 2] = grey; out[target + 3] = row[source + 1];
            } else {
                const source = x * 4;
                out[target] = row[source]; out[target + 1] = row[source + 1]; out[target + 2] = row[source + 2]; out[target + 3] = row[source + 3];
            }
        }
        return out;
    }

    DocsDoodads.ApngRead = {
        isAnimated(input) {
            try { return pngChunks(input).some(chunk => chunk.type === 'acTL'); } catch (error) { return false; }
        },
        frames(input, inflate, options = {}) {
            if (typeof inflate !== 'function') fail('APNG decoding needs an inflate function.');
            const chunks = pngChunks(input), ihdr = chunks.find(chunk => chunk.type === 'IHDR');
            if (!ihdr || chunks[0] !== ihdr || chunks.filter(chunk => chunk.type === 'IHDR').length !== 1 || ihdr.body.length !== 13) fail('PNG IHDR must be the first and only header chunk.');
            const header = { width: read32be(ihdr.body, 0), height: read32be(ihdr.body, 4), depth: ihdr.body[8], colour: ihdr.body[9], compression: ihdr.body[10], filter: ihdr.body[11], interlace: ihdr.body[12] };
            dimensions(header.width, header.height, 'APNG');
            const allowedDepths = { 0: [1, 2, 4, 8], 2: [8], 3: [1, 2, 4, 8], 4: [8], 6: [8] };
            if (!allowedDepths[header.colour] || !allowedDepths[header.colour].includes(header.depth) || header.compression || header.filter || header.interlace) {
                fail('APNG colour types supported are non-interlaced palette/greyscale at 1, 2, 4 or 8 bits and RGB/RGBA at 8 bits; 16-bit and Adam7 APNG are not supported.');
            }
            const firstIdat = chunks.findIndex(chunk => chunk.type === 'IDAT'), animationAt = chunks.findIndex(chunk => chunk.type === 'acTL');
            if (firstIdat < 0 || animationAt < 0) fail('PNG is not animated (acTL or IDAT is missing).');
            if (animationAt > firstIdat) fail('APNG acTL must appear before the first IDAT chunk.');
            if (chunks.filter(chunk => chunk.type === 'acTL').length !== 1) fail('APNG must contain one acTL chunk.');
            const animation = chunks[animationAt];
            if (animation.body.length !== 8) fail('APNG acTL has an invalid length.');
            const paletteChunks = chunks.filter(chunk => chunk.type === 'PLTE'), transparencyChunks = chunks.filter(chunk => chunk.type === 'tRNS');
            if (paletteChunks.length > 1 || transparencyChunks.length > 1) fail('APNG has duplicate palette or transparency chunks.');
            const paletteAt = chunks.findIndex(chunk => chunk.type === 'PLTE'), transparencyAt = chunks.findIndex(chunk => chunk.type === 'tRNS');
            if (paletteAt > firstIdat || transparencyAt > firstIdat) fail('APNG palette and transparency must appear before IDAT.');
            let palette = null, transparency = null;
            if (paletteChunks.length) {
                const body = paletteChunks[0].body;
                if (!body.length || body.length % 3 || body.length > 768) fail('APNG palette is invalid.');
                palette = Array.from({ length: body.length / 3 }, (_, index) => Array.from(body.subarray(index * 3, index * 3 + 3)));
            }
            if (header.colour === 3 && !palette) fail('Indexed APNG has no palette.');
            if (transparencyChunks.length) {
                const body = transparencyChunks[0].body;
                if (header.colour === 0 && body.length === 2) transparency = { grey: read16be(body, 0) };
                else if (header.colour === 2 && body.length === 6) transparency = { rgb: [read16be(body, 0), read16be(body, 2), read16be(body, 4)] };
                else if (header.colour === 3 && palette && body.length <= palette.length) transparency = { palette: body };
                else fail('APNG tRNS transparency does not match its colour type.');
            }
            const expectedFrames = read32be(animation.body, 0);
            if (!expectedFrames || expectedFrames > limits.frames) fail('APNG frame count exceeds the limit.');
            const records = [];
            let record = null, sequence = 0, sawIdat = false, firstControlBeforeIdat = false;
            const finish = () => { if (record) { if (!record.parts.length) fail('APNG frame has no image data.'); records.push(record); record = null; } };
            for (const chunk of chunks) {
                checkCancelled(options.cancellationToken);
                if (chunk.type === 'fcTL') {
                    finish();
                    if (chunk.body.length !== 26 || read32be(chunk.body, 0) !== sequence++) fail('APNG frame sequence is invalid.');
                    const control = { w: read32be(chunk.body, 4), h: read32be(chunk.body, 8), x: read32be(chunk.body, 12), y: read32be(chunk.body, 16),
                        delayNum: read16be(chunk.body, 20), delayDen: read16be(chunk.body, 22) || 100, dispose: chunk.body[24], blend: chunk.body[25] };
                    if (!control.w || !control.h || control.x + control.w > header.width || control.y + control.h > header.height || control.dispose > 2 || control.blend > 1) fail('APNG frame control is outside its canvas or unsupported.');
                    if (!sawIdat && records.length === 0 && (control.x || control.y || control.w !== header.width || control.h !== header.height)) fail('APNG default-image frame must cover the full IHDR canvas at offset 0.');
                    if (!sawIdat && records.length === 0 && control.dispose === 2) control.dispose = 1;
                    record = Object.assign(control, { parts: [] });
                    if (!sawIdat && records.length === 0) firstControlBeforeIdat = true;
                } else if (chunk.type === 'IDAT') {
                    sawIdat = true;
                    if (record && firstControlBeforeIdat && records.length === 0) record.parts.push(chunk.body);
                } else if (chunk.type === 'fdAT') {
                    if (!record || chunk.body.length < 5 || read32be(chunk.body, 0) !== sequence++) fail('APNG frame data sequence is invalid.');
                    record.parts.push(chunk.body.subarray(4));
                }
            }
            finish();
            if (records.length !== expectedFrames || records.length * header.width * header.height > limits.totalPixels) fail('APNG frame count does not match acTL or exceeds the decoded-pixel limit.');
            const canvas = new Uint8Array(header.width * header.height * 4), pictures = [];
            for (const rec of records) {
                checkCancelled(options.cancellationToken);
                const compressedLength = rec.parts.reduce((sum, part) => sum + part.length, 0), compressed = new Uint8Array(compressedLength);
                let at = 0; for (const part of rec.parts) { compressed.set(part, at); at += part.length; }
                const source = pngPixels(compressed, rec, header, palette, transparency, inflate), saved = rec.dispose === 2 ? copy(canvas) : null;
                for (let y = 0; y < rec.h; y++) for (let x = 0; x < rec.w; x++) {
                    const si = (y * rec.w + x) * 4, di = ((rec.y + y) * header.width + rec.x + x) * 4;
                    if (rec.blend === 0) canvas.set(source.subarray(si, si + 4), di);
                    else {
                        const sa = source[si + 3], da = canvas[di + 3], outA = sa + da * (255 - sa) / 255;
                        if (outA <= 0) canvas.fill(0, di, di + 4);
                        else {
                            for (let channel = 0; channel < 3; channel++) canvas[di + channel] = Math.round((source[si + channel] * sa + canvas[di + channel] * da * (255 - sa) / 255) / outA);
                            canvas[di + 3] = Math.round(outA);
                        }
                    }
                }
                pictures.push({ width: header.width, height: header.height, rgba: copy(canvas), delayMs: rec.delayNum * 1000 / rec.delayDen });
                if (rec.dispose === 1) for (let y = 0; y < rec.h; y++) canvas.fill(0, ((rec.y + y) * header.width + rec.x) * 4, ((rec.y + y) * header.width + rec.x + rec.w) * 4);
                else if (rec.dispose === 2) canvas.set(saved);
            }
            return pictures;
        }
    };

    DocsDoodads.AnimatedImport = {
        limits,
        destinationName(filePath) {
            const path = DocsDoodads.FS.path;
            if (!path) return String(filePath || '').split(/[\\/]/).pop();
            const name = path.basename(filePath), ext = path.extname(name);
            return ext.toLowerCase() === '.gif' ? path.basename(name, ext) + '.png' : name;
        },
        sourceKind(filePath) {
            const FS = DocsDoodads.FS, ext = FS.path ? FS.path.extname(filePath).toLowerCase() : '';
            if (ext === '.gif') return 'gif';
            if (ext !== '.png' || !FS.fs) return null;
            let fd = null;
            try {
                fd = FS.fs.openSync(filePath, 'r');
                const stat = FS.fs.fstatSync(fd), head = Buffer.alloc(8);
                if (stat.size < 20 || FS.fs.readSync(fd, head, 0, 8, 0) !== 8 || ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => head[i] === v)) return null;
                let at = 8;
                const chunk = Buffer.alloc(8);
                while (at + 12 <= stat.size) {
                    if (FS.fs.readSync(fd, chunk, 0, 8, at) !== 8) return null;
                    const length = chunk.readUInt32BE(0), type = chunk.toString('ascii', 4, 8);
                    if (length > limits.inputBytes || at + 12 + length > stat.size) return null;
                    if (type === 'acTL') return 'apng';
                    if (type === 'IDAT' || type === 'IEND') return null;
                    at += 12 + length;
                }
            } catch (error) { return null; }
            finally { if (fd !== null) try { FS.fs.closeSync(fd); } catch (error) {} }
            return null;
        },
        pack(frames, deflate, options = {}) {
            if (!Array.isArray(frames) || !frames.length) fail('Animated image has no frames.');
            if (frames.length > limits.frames) fail('Animated image has too many frames.');
            const width = Math.floor(Number(frames[0].width)), height = Math.floor(Number(frames[0].height));
            dimensions(width, height, 'Animated image');
            for (const item of frames) if (item.width !== width || item.height !== height || !item.rgba || item.rgba.length !== width * height * 4) fail('Animated image frames are not one complete size.');
            const maxSide = Math.max(1, Math.min(limits.side, Math.floor(Number(options.maxSide) || limits.side)));
            const maxAcross = Math.floor(maxSide / width), maxDown = Math.floor(maxSide / height);
            if (!maxAcross || !maxDown || frames.length > maxAcross * maxDown) fail('Animated frames do not fit inside the 4096-pixel sheet limit.');
            const xFrame = Math.min(frames.length, maxAcross), yFrame = Math.ceil(frames.length / xFrame);
            const sheetWidth = width * xFrame, sheetHeight = height * yFrame, sheet = new Uint8Array(sheetWidth * sheetHeight * 4);
            frames.forEach((item, index) => {
                const col = index % xFrame, row = Math.floor(index / xFrame);
                for (let y = 0; y < height; y++) sheet.set(item.rgba.subarray(y * width * 4, (y + 1) * width * 4), ((row * height + y) * sheetWidth + col * width) * 4);
            });
            const delays = frames.map(item => {
                const value = Number(item.delayMs);
                return Number.isFinite(value) && value >= 0 ? Math.max(1, Math.round(value)) : 100;
            });
            const counts = new Map(), first = new Map();
            delays.forEach((delay, index) => { counts.set(delay, (counts.get(delay) || 0) + 1); if (!first.has(delay)) first.set(delay, index); });
            const delay = Array.from(counts.keys()).sort((a, b) => counts.get(b) - counts.get(a) || first.get(a) - first.get(b))[0];
            const regions = frames.map((item, index) => ({ x: index % xFrame * width, y: Math.floor(index / xFrame) * height, w: width, h: height }));
            if (!DocsDoodads.AsepriteSheets || typeof DocsDoodads.AsepriteSheets.encodePng !== 'function') fail('PNG writer is unavailable.');
            return { bytes: DocsDoodads.AsepriteSheets.encodePng(sheetWidth, sheetHeight, sheet, deflate), frameW: width, frameH: height,
                xFrame, yFrame, frameCount: frames.length, frameUpdate: frames.length > 1 ? Math.max(1, Math.round(delay * 60 / 1000)) : 0,
                variedDelay: new Set(delays).size > 1, delayMs: delay, regions };
        },
        preparePlan(plan, options = {}) {
            const FS = DocsDoodads.FS, token = options.cancellationToken;
            const result = { ok: false, cancelled: false, errors: [], warnings: [] };
            if (!plan || !FS.fs || !FS.path) { result.errors.push({ message: 'Animated import needs filesystem access.' }); return result; }
            try {
                const zlib = options.zlib || require('zlib');
                for (const operation of plan.operations || []) {
                    checkCancelled(token);
                    if (!operation.animatedKind) continue;
                    const stat = FS.fs.statSync(operation.source);
                    if (!stat.isFile() || stat.size > limits.inputBytes) fail(`${FS.path.basename(operation.source)} is larger than the 64 MB animated-image limit.`);
                    const source = FS.fs.readFileSync(operation.source);
                    const frames = operation.animatedKind === 'gif'
                        ? DocsDoodads.GifRead.frames(source, { cancellationToken: token })
                        : DocsDoodads.ApngRead.frames(source, (data, expected) => zlib.inflateSync(data, { maxOutputLength: expected }), { cancellationToken: token });
                    const packed = this.pack(frames, data => zlib.deflateSync(data));
                    operation.outputBytes = Buffer.from(packed.bytes);
                    operation.animation = { frameW: packed.frameW, frameH: packed.frameH, xFrame: packed.xFrame, yFrame: packed.yFrame,
                        frameCount: packed.frameCount, frameUpdate: packed.frameUpdate, regions: packed.regions };
                    if (operation.animatedKind === 'gif') result.warnings.push(`${FS.path.basename(operation.source)}: GIF has 256 colours and no soft edges; the converted PNG keeps what the GIF contains.`);
                    if (packed.variedDelay) result.warnings.push(`${FS.path.basename(operation.source)}: frames have different frame times; the commonest time is used.`);
                }
                plan.warnings = result.warnings.slice(); result.ok = true; return result;
            } catch (error) {
                result.cancelled = Boolean(error && error.code === 'DD_IMPORT_CANCELLED');
                result.errors.push({ message: error && error.message ? error.message : String(error) });
                return result;
            }
        },
        metadataByPath(plan) {
            const map = new Map(), path = DocsDoodads.FS.path;
            for (const operation of plan && plan.operations || []) if (operation.kind === 'image') {
                map.set(path.resolve(operation.destination).toLowerCase(), operation.animation || null);
            }
            return map;
        },
        applyToDoodad(doodad, asset) {
            const animation = asset && asset.animation;
            if (!doodad || !animation) return doodad;
            const grid = Math.max(1, Math.round(Number(animation.xFrame) || 1)) * Math.max(1, Math.round(Number(animation.yFrame) || 1));
            const count = Math.max(1, Math.min(grid, Math.round(Number(animation.frameCount) || grid)));
            doodad.frameW = Math.max(1, Math.round(Number(animation.frameW) || doodad.frameW));
            doodad.frameH = Math.max(1, Math.round(Number(animation.frameH) || doodad.frameH));
            doodad.xFrame = Math.max(1, Math.round(Number(animation.xFrame) || 1));
            doodad.yFrame = Math.max(1, Math.round(Number(animation.yFrame) || 1));
            doodad.frameUpdate = count > 1 ? Math.max(1, Math.round(Number(animation.frameUpdate) || 1)) : 0;
            doodad.anim = Object.assign({}, doodad.anim || {}, { mode: 'loop', frameCount: count });
            return doodad;
        }
    };
})();
