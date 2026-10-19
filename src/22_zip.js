//==========================================================
// SECTION 12C: READING ZIP FILES
//==========================================================
// A zip of art (or a .ddpack inside one) brought in through Packs (44_workspace_packs.js). Pure: the bytes
// and an inflate function (Node's zlib.inflateRawSync) are passed in. Stored and deflated entries are read;
// each file's CRC is checked, and a zip that would unpack to more than maxBytes is refused before inflating.
DocsDoodads.Zip = {
    maxBytes: 512 * 1024 * 1024,
    maxEntries: 20000,

    crcTable: null,

    crc32(bytes) {
        if (!this.crcTable) {
            this.crcTable = new Uint32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
                this.crcTable[n] = c >>> 0;
            }
        }
        let crc = 0xffffffff;
        for (let i = 0; i < bytes.length; i++) crc = this.crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
    },

    // An entry's name as a project path: forward slashes, no leading "./" or "/", or null when it could
    // reach outside the folder it is unpacked into (".." parts, a drive letter, an absolute path).
    cleanName(name) {
        const s = String(name || '').replace(/\\/g, '/');
        if (/^[a-z]:/i.test(s) || s.startsWith('/') || s.split('/').some(part => part === '..')) return null;
        return s.replace(/^(\.\/)+/, '');
    },

    // The files in a zip: [{ name, data }] (folders left out), or throws a message a person can act on.
    // unsafe: the names that were refused by cleanName.
    read(bytes, inflateRaw) {
        const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        const u16 = o => view.getUint16(o, true), u32 = o => view.getUint32(o, true);
        // The end of the central directory: its signature within the last 64 KB (after a comment).
        let end = -1;
        for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
            if (u32(i) === 0x06054b50) { end = i; break; }
        }
        if (end < 0) throw new Error('This file is not a zip (or it is damaged).');
        const count = u16(end + 10), dirOffset = u32(end + 16);
        if (count === 0xffff || dirOffset === 0xffffffff) throw new Error('This zip is too large to read here (zip64).');
        if (count > this.maxEntries) throw new Error(`This zip has ${count} entries; at most ${this.maxEntries} can be brought in.`);
        const entries = [];
        let total = 0;
        let p = dirOffset;
        for (let n = 0; n < count; n++) {
            if (p + 46 > buf.length || u32(p) !== 0x02014b50) throw new Error('This zip is damaged (its list of files is cut short).');
            const flags = u16(p + 8), method = u16(p + 10), crc = u32(p + 16), size = u32(p + 20), unpacked = u32(p + 24);
            const nameLen = u16(p + 28), extraLen = u16(p + 30), commentLen = u16(p + 32), local = u32(p + 42);
            const name = new TextDecoder('utf-8').decode(buf.subarray(p + 46, p + 46 + nameLen));
            p += 46 + nameLen + extraLen + commentLen;
            if (name.endsWith('/')) continue;
            total += unpacked;
            if (total > this.maxBytes) throw new Error(`This zip unpacks to more than ${Math.round(this.maxBytes / 1048576)} MB.`);
            entries.push({ name, flags, method, crc, size, unpacked, local });
        }
        const files = [], unsafe = [];
        for (const e of entries) {
            const clean = this.cleanName(e.name);
            if (!clean) { unsafe.push(e.name); continue; }
            if (e.flags & 1) throw new Error(`${e.name} is locked with a password; unzip it first.`);
            const lp = e.local;
            if (lp + 30 > buf.length || u32(lp) !== 0x04034b50) throw new Error(`This zip is damaged (${e.name}).`);
            const start = lp + 30 + u16(lp + 26) + u16(lp + 28);
            const raw = buf.subarray(start, start + e.size);
            let data;
            if (e.method === 0) data = raw;
            else if (e.method === 8) data = new Uint8Array(inflateRaw(raw, { maxOutputLength: Math.max(1, e.unpacked) }));
            else throw new Error(`${e.name} is packed in a way this can't read (method ${e.method}); re-zip it.`);
            if (data.length !== e.unpacked || this.crc32(data) !== e.crc) throw new Error(`This zip is damaged (${e.name} does not check out).`);
            files.push({ name: clean, data });
        }
        return { files, unsafe };
    },

    // The art in a zip as a pack to bring in: files already under img/, audio/, models/, movies/ or effects/
    // keep their place; other pictures go in img/doodads/<zip name>/. Anything else is listed as left out.
    // A .ddpack inside the zip is returned as { packText } instead.
    asPack(zipName, read, Packs) {
        const pack = read.files.find(f => /\.ddpack$/i.test(f.name));
        if (pack) return { packText: new TextDecoder('utf-8').decode(pack.data), name: pack.name };
        const base = String(zipName || 'Art').replace(/\\/g, '/').split('/').pop().replace(/\.zip$/i, '').replace(/[^\w\- ]+/g, '').trim() || 'Art';
        const out = { format: Packs.format, version: Packs.version, name: base, createdAt: Date.now(),
            contents: { prefabs: [], rooms: [], biomes: [], dress: [], collections: {}, templates: {} }, library: {}, files: {}, missing: [] };
        const left = read.unsafe.slice();
        for (const f of read.files) {
            // Folders of the zip's own (MyArt/img/...) are looked through for the project's folders.
            const inside = f.name.match(/(?:^|\/)((?:img|audio|models|movies|effects)\/.+)$/i);
            const target = inside ? inside[1] : /\.(png|jpe?g|webp|gif)$/i.test(f.name) ? `img/doodads/${base}/${f.name}` : null;
            if (!target || /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)/i.test(f.name) || !Packs.safePath(target)) { left.push(f.name); continue; }
            out.files[target] = Packs.toBase64(f.data);
        }
        out.leftOut = left;
        return { pack: out };
    }
};
