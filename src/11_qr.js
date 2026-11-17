// @editor-only
//==========================================================
// SECTION 11Q: A SMALL QR CODE WRITER (8.3.5)
//==========================================================
// Byte mode, versions 1 to 10, error correction L, M, Q or H: enough for a local address with a long token.
// Written to ISO/IEC 18004; the tables are per version (index 0 unused). Pure: no canvas, no DOM.
DocsDoodads.Qr = {
    maxVersion: 10,
    levels: { L: 1, M: 0, Q: 3, H: 2 },
    eccPerBlock: {
        L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
        M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
        Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
        H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28]
    },
    blockCount: {
        L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
        M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5],
        Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
        H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8]
    },

    size(version) { return version * 4 + 17; },

    rawModules(version) {
        let result = (16 * version + 128) * version + 64;
        if (version >= 2) {
            const align = Math.floor(version / 7) + 2;
            result -= (25 * align - 10) * align - 55;
            if (version >= 7) result -= 36;
        }
        return result;
    },

    totalCodewords(version) { return Math.floor(this.rawModules(version) / 8); },

    dataCodewords(version, ecc) {
        return this.totalCodewords(version) - this.eccPerBlock[ecc][version] * this.blockCount[ecc][version];
    },

    // Bytes that fit in byte mode: 4 mode bits and an 8-bit count up to version 9, 16 bits from version 10.
    capacity(version, ecc) {
        const countBits = version < 10 ? 8 : 16;
        return Math.floor((this.dataCodewords(version, ecc) * 8 - 4 - countBits) / 8);
    },

    alignmentPositions(version) {
        if (version === 1) return [];
        const count = Math.floor(version / 7) + 2, size = this.size(version);
        const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
        const out = [6];
        for (let pos = size - 7; out.length < count; pos -= step) out.splice(1, 0, pos);
        return out;
    },

    // GF(256) with the QR polynomial x^8 + x^4 + x^3 + x^2 + 1.
    multiply(x, y) {
        let z = 0;
        for (let i = 7; i >= 0; i--) {
            z = (z << 1) ^ ((z >>> 7) * 0x11D);
            z ^= ((y >>> i) & 1) * x;
        }
        return z & 255;
    },

    divisor(degree) {
        const result = new Array(degree).fill(0);
        result[degree - 1] = 1;
        let root = 1;
        for (let i = 0; i < degree; i++) {
            for (let j = 0; j < result.length; j++) {
                result[j] = this.multiply(result[j], root);
                if (j + 1 < result.length) result[j] ^= result[j + 1];
            }
            root = this.multiply(root, 2);
        }
        return result;
    },

    remainder(data, divisor) {
        const result = divisor.map(() => 0);
        for (const value of data) {
            const factor = value ^ result.shift();
            result.push(0);
            divisor.forEach((coefficient, i) => { result[i] ^= this.multiply(coefficient, factor); });
        }
        return result;
    },

    formatBits(ecc, mask) {
        const data = (this.levels[ecc] << 3) | mask;
        let rem = data;
        for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
        return ((data << 10) | rem) ^ 0x5412;
    },

    versionBits(version) {
        let rem = version;
        for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
        return (version << 12) | rem;
    },

    utf8(text) {
        if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(String(text)));
        return Array.from(unescape(encodeURIComponent(String(text))), ch => ch.charCodeAt(0));
    },

    // Data codewords: mode, count, bytes, terminator, byte padding, then 0xEC/0x11 pad bytes.
    dataBytes(bytes, version, ecc) {
        const bits = [];
        const put = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
        put(4, 4);
        put(bytes.length, version < 10 ? 8 : 16);
        for (const b of bytes) put(b, 8);
        const capacityBits = this.dataCodewords(version, ecc) * 8;
        put(0, Math.min(4, capacityBits - bits.length));
        put(0, (8 - bits.length % 8) % 8);
        const out = [];
        for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
        for (let pad = 0xEC; out.length < capacityBits / 8; pad ^= 0xEC ^ 0x11) out.push(pad);
        return out;
    },

    // Splits into blocks (short ones first), adds each block's error correction, then interleaves.
    interleave(data, version, ecc) {
        const blocks = this.blockCount[ecc][version], eccLength = this.eccPerBlock[ecc][version];
        const total = this.totalCodewords(version), shortLength = Math.floor(total / blocks);
        const shortBlocks = blocks - total % blocks, divisor = this.divisor(eccLength);
        const list = [];
        for (let i = 0, k = 0; i < blocks; i++) {
            const length = shortLength - eccLength + (i < shortBlocks ? 0 : 1);
            const part = data.slice(k, k + length);
            k += length;
            list.push({ data: part, ecc: this.remainder(part, divisor) });
        }
        const out = [];
        const longest = Math.max(...list.map(block => block.data.length));
        for (let i = 0; i < longest; i++) for (const block of list) if (i < block.data.length) out.push(block.data[i]);
        for (let i = 0; i < eccLength; i++) for (const block of list) out.push(block.ecc[i]);
        return out;
    },

    // Finders, separators, timing, alignment, the dark module and reserved format/version areas.
    functionPatterns(version) {
        const size = this.size(version);
        const dark = Array.from({ length: size }, () => new Uint8Array(size));
        const fixed = Array.from({ length: size }, () => new Uint8Array(size));
        const set = (x, y, on) => { if (x >= 0 && y >= 0 && x < size && y < size) { dark[y][x] = on ? 1 : 0; fixed[y][x] = 1; } };
        for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
        for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
            for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
                const d = Math.max(Math.abs(dx), Math.abs(dy));
                set(cx + dx, cy + dy, d !== 2 && d !== 4);
            }
        }
        const align = this.alignmentPositions(version), last = align.length - 1;
        for (let i = 0; i < align.length; i++) for (let j = 0; j < align.length; j++) {
            if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
        this.drawFormat(set, size, 0);
        if (version >= 7) this.drawVersion(set, size, version);
        return { size, dark, fixed };
    },

    drawFormat(set, size, bits) {
        const bit = i => ((bits >>> i) & 1) === 1;
        for (let i = 0; i <= 5; i++) set(8, i, bit(i));
        set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
        for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
        for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
        for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
        set(8, size - 8, true);
    },

    drawVersion(set, size, version) {
        const bits = this.versionBits(version);
        for (let i = 0; i < 18; i++) {
            const on = ((bits >>> i) & 1) === 1, a = size - 11 + i % 3, b = Math.floor(i / 3);
            set(a, b, on); set(b, a, on);
        }
    },

    // The zigzag from the bottom-right, two columns at a time, skipping the vertical timing column.
    placementOrder(fixed) {
        const size = fixed.length, out = [];
        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5;
            for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
                const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert;
                if (!fixed[y][x]) out.push([x, y]);
            }
        }
        return out;
    },

    maskAt(mask, x, y) {
        switch (mask) {
            case 0: return (x + y) % 2 === 0;
            case 1: return y % 2 === 0;
            case 2: return x % 3 === 0;
            case 3: return (x + y) % 3 === 0;
            case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            case 5: return x * y % 2 + x * y % 3 === 0;
            case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
            default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
        }
    },

    penalty(modules) {
        const size = modules.length;
        let score = 0, dark = 0;
        const line = get => {
            let run = 1;
            for (let i = 1; i <= size; i++) {
                if (i < size && get(i) === get(i - 1)) { run++; continue; }
                if (run >= 5) score += 3 + run - 5;
                run = 1;
            }
            const finderA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], finderB = finderA.slice().reverse();
            for (let i = 0; i + 11 <= size; i++) {
                if (finderA.every((v, k) => get(i + k) === v) || finderB.every((v, k) => get(i + k) === v)) score += 40;
            }
        };
        for (let y = 0; y < size; y++) line(x => modules[y][x]);
        for (let x = 0; x < size; x++) line(y => modules[y][x]);
        for (let y = 0; y + 1 < size; y++) for (let x = 0; x + 1 < size; x++) {
            const c = modules[y][x];
            if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
        }
        for (const row of modules) for (const v of row) dark += v;
        score += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10;
        return score;
    },

    // text → { version, size, ecc, mask, modules: rows of 0/1 }. Picks the smallest version that fits.
    encode(text, options = {}) {
        const ecc = Object.prototype.hasOwnProperty.call(this.levels, options.ecc) ? options.ecc : 'M';
        const bytes = this.utf8(text);
        let version = Math.max(1, Math.min(this.maxVersion, Math.floor(Number(options.minVersion) || 1)));
        while (version <= this.maxVersion && this.capacity(version, ecc) < bytes.length) version++;
        if (version > this.maxVersion) throw new Error(`Too long for a QR code here (${bytes.length} bytes).`);
        const codewords = this.interleave(this.dataBytes(bytes, version, ecc), version, ecc);
        const base = this.functionPatterns(version), order = this.placementOrder(base.fixed);
        const fixedMask = Number.isInteger(options.mask) && options.mask >= 0 && options.mask < 8 ? options.mask : null;
        let best = null;
        for (let mask = 0; mask < 8; mask++) {
            if (fixedMask !== null && mask !== fixedMask) continue;
            const modules = base.dark.map(row => Uint8Array.from(row));
            order.forEach(([x, y], i) => {
                const bit = i < codewords.length * 8 ? (codewords[i >>> 3] >>> (7 - (i & 7))) & 1 : 0;
                modules[y][x] = bit ^ (this.maskAt(mask, x, y) ? 1 : 0);
            });
            this.drawFormat((x, y, on) => { modules[y][x] = on ? 1 : 0; }, base.size, this.formatBits(ecc, mask));
            const score = this.penalty(modules);
            if (!best || score < best.score) best = { mask, modules, score };
        }
        return { version, size: base.size, ecc, mask: best.mask, modules: best.modules.map(row => Array.from(row)) };
    }
};
