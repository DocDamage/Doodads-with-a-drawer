// A small PNG reader for the build scripts (png.js writes), with no packages: enough for LPC sheets
// (palette images at 1, 2, 4 or 8 bits, grey, RGB and RGBA at 8 or 16 bits, no interlacing).
// Images are { width, height, data } with data as RGBA bytes, four per pixel, rows top to bottom.
'use strict';
const zlib = require('zlib');

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paeth(a, b, c) {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decode(buffer) {
    if (!buffer.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG file');
    let pos = 8, header = null, palette = null, alpha = null;
    const idat = [];
    while (pos < buffer.length) {
        const length = buffer.readUInt32BE(pos), type = buffer.toString('latin1', pos + 4, pos + 8);
        const body = buffer.subarray(pos + 8, pos + 8 + length);
        pos += 12 + length;
        if (type === 'IHDR') {
            header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], colorType: body[9], interlace: body[12] };
        } else if (type === 'PLTE') palette = body;
        else if (type === 'tRNS') alpha = body;
        else if (type === 'IDAT') idat.push(body);
        else if (type === 'IEND') break;
    }
    if (!header) throw new Error('PNG has no header');
    if (header.interlace) throw new Error('Interlaced PNGs are not supported');
    const { width, height, depth, colorType } = header;
    const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
    if (!channels) throw new Error('Unknown PNG colour type ' + colorType);
    const bitsPerPixel = channels * depth;
    const stride = Math.ceil(width * bitsPerPixel / 8), bpp = Math.max(1, bitsPerPixel >> 3);
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const rows = Buffer.alloc(stride * height);
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < height; y++) {
        const filter = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
        const out = rows.subarray(y * stride, (y + 1) * stride);
        for (let i = 0; i < stride; i++) {
            const a = i >= bpp ? out[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
            const add = filter === 1 ? a : filter === 2 ? b : filter === 3 ? (a + b) >> 1 : filter === 4 ? paeth(a, b, c) : 0;
            out[i] = (line[i] + add) & 0xff;
        }
        prev = out;
    }
    const data = new Uint8Array(width * height * 4);
    const sample = (row, index) => {
        // index counts samples along the row
        if (depth === 8) return row[index];
        if (depth === 16) return row[index * 2];
        const perByte = 8 / depth, byte = row[Math.floor(index / perByte)];
        const shift = 8 - depth * (index % perByte + 1);
        return (byte >> shift) & ((1 << depth) - 1);
    };
    const scale = depth < 8 && colorType === 0 ? 255 / ((1 << depth) - 1) : 1;
    for (let y = 0; y < height; y++) {
        const row = rows.subarray(y * stride, (y + 1) * stride);
        for (let x = 0; x < width; x++) {
            const o = (y * width + x) * 4;
            if (colorType === 3) {
                const i = sample(row, x);
                data[o] = palette[i * 3]; data[o + 1] = palette[i * 3 + 1]; data[o + 2] = palette[i * 3 + 2];
                data[o + 3] = alpha && i < alpha.length ? alpha[i] : 255;
            } else if (colorType === 0 || colorType === 4) {
                const g = Math.round(sample(row, x * channels) * scale);
                data[o] = data[o + 1] = data[o + 2] = g;
                data[o + 3] = colorType === 4 ? sample(row, x * channels + 1) : 255;
            } else {
                data[o] = sample(row, x * channels); data[o + 1] = sample(row, x * channels + 1); data[o + 2] = sample(row, x * channels + 2);
                data[o + 3] = colorType === 6 ? sample(row, x * channels + 3) : 255;
            }
        }
    }
    return { width, height, data };
}

function create(width, height) {
    return { width, height, data: new Uint8Array(width * height * 4) };
}

module.exports = { decode, create };
