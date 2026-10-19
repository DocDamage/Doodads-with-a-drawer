//==========================================================
// SECTION 12B: DOODAD PACKS
//==========================================================
// A pack is one file (.ddpack, JSON) holding prefabs (with the prefabs inside them), room stamps,
// biomes, dressing rules, collections and event templates, the art, sounds and models they use, and those files' Item Bag
// entries (cut-up slices, tags, collision), to bring into another project. Pure: reading and writing
// files is passed in, so the workspace (44_workspace_packs.js) does the disk work in a playtest.
DocsDoodads.Packs = {
    format: 'docs-doodads-pack',
    version: 1,
    extension: '.ddpack',

    // The project files one doodad uses. audioFile(name) finds 'bgs/River' as a file, or null.
    filesOfDoodad(d, audioFile) {
        const out = [];
        if (!d) return out;
        if (d.bit && d.bit[0] === 3 && d.bit[1]) out.push(String(d.bit[1]));
        for (const s of (d.states && Array.isArray(d.states.list) ? d.states.list : [])) if (s && s.path) out.push(String(s.path));
        if (d.model && d.model.path) out.push(String(d.model.path));
        if (d.sound && d.sound.file && audioFile) {
            const file = audioFile(String(d.sound.file));
            if (file) out.push(file);
        }
        return out;
    },

    // What a selection holds, with what it needs: prefabs inside chosen prefabs come along.
    // sel: { prefabs: [ids], rooms: [ids], biomes: [ids], dress: [indexes], collections: [names], templates: [keys] }
    // src: { prefab(id), room(id), biomes: [], dress: [], collections: { name: [assetId] }, assetPath(id), template(key) }
    gather(sel, src, audioFile) {
        const contents = { prefabs: [], rooms: [], biomes: [], dress: [], collections: {}, templates: {} };
        const files = new Set();
        const addDoodads = list => (list || []).forEach(d => this.filesOfDoodad(d, audioFile).forEach(f => files.add(f)));
        const seenPrefab = new Set();
        const addPrefab = id => {
            if (seenPrefab.has(id)) return;
            seenPrefab.add(id);
            const p = src.prefab(id);
            if (!p) return;
            (p.children || []).forEach(c => addPrefab(c.id));
            contents.prefabs.push(JSON.parse(JSON.stringify(p)));
            addDoodads(p.doodads);
            if (p.thumbnail) files.add(String(p.thumbnail));
        };
        (sel.prefabs || []).forEach(addPrefab);
        for (const id of sel.rooms || []) {
            const r = src.room(id);
            if (!r) continue;
            contents.rooms.push(JSON.parse(JSON.stringify(r)));
            addDoodads(r.doodads);
        }
        for (const id of sel.biomes || []) {
            const b = (src.biomes || []).find(x => x && x.id === id);
            if (!b) continue;
            contents.biomes.push(JSON.parse(JSON.stringify(b)));
            (b.entries || []).forEach(e => e && e.path && files.add(String(e.path)));
        }
        for (const i of sel.dress || []) {
            const r = (src.dress || [])[i];
            if (!r) continue;
            contents.dress.push(JSON.parse(JSON.stringify(r)));
            (r.entries || []).forEach(e => e && e.path && files.add(String(e.path)));
        }
        for (const name of sel.collections || []) {
            const ids = (src.collections || {})[name];
            if (!Array.isArray(ids)) continue;
            const paths = ids.map(id => src.assetPath(id)).filter(Boolean);
            contents.collections[name] = paths;
            paths.forEach(p => files.add(p));
        }
        for (const key of sel.templates || []) {
            const t = src.template ? src.template(key) : null;
            if (t) contents.templates[key] = JSON.parse(JSON.stringify(t));
        }
        return { contents, files: Array.from(files).map(f => f.replace(/\\/g, '/')).sort() };
    },

    // A pack from what was gathered. readFile(path) gives the bytes (a Buffer or Uint8Array) or null;
    // library(path) gives the file's Item Bag entry or null. Files that couldn't be read are listed.
    build(name, gathered, readFile, library) {
        const pack = { format: this.format, version: this.version, name: String(name || 'Pack').trim() || 'Pack', createdAt: Date.now(),
            contents: gathered.contents, library: {}, files: {}, missing: [] };
        for (const p of gathered.files) {
            if (!this.safePath(p)) { pack.missing.push(p); continue; }
            const bytes = readFile(p);
            if (!bytes) { pack.missing.push(p); continue; }
            pack.files[p] = this.toBase64(bytes);
            const entry = library ? library(p) : null;
            if (entry) {
                const keep = {};
                for (const k of ['tags', 'slice', 'placement', 'collision', 'favorite']) if (entry[k] !== undefined) keep[k] = JSON.parse(JSON.stringify(entry[k]));
                pack.library[p] = keep;
            }
        }
        return pack;
    },

    toBase64(bytes) {
        if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
        let s = '';
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s);
    },

    fromBase64(text) {
        if (typeof Buffer !== 'undefined') return Buffer.from(String(text || ''), 'base64');
        return Uint8Array.from(atob(String(text || '')), c => c.charCodeAt(0));
    },

    // Only files inside the project's own art folders: no absolute paths, no "..", and nothing in data/
    // (that would replace this project's own maps' doodads; prefabs and rooms travel as JSON in the pack).
    safePath(p) {
        const s = String(p || '').replace(/\\/g, '/');
        return /^(img|audio|models|movies|effects)\//i.test(s) && !s.split('/').includes('..') && !/^[a-z]:/i.test(s);
    },

    // Reads a pack's text; throws a message a person can act on when it isn't one.
    parse(text) {
        let pack;
        try { pack = JSON.parse(String(text)); } catch (e) { throw new Error('This file is not a doodad pack (it is not readable JSON).'); }
        if (!pack || pack.format !== this.format) throw new Error('This file is not a doodad pack.');
        if (Number(pack.version) > this.version) throw new Error('This pack was made by a newer Doc\'s Doodads; update the plugin to bring it in.');
        pack.contents = Object.assign({ prefabs: [], rooms: [], biomes: [], dress: [], collections: {}, templates: {} }, pack.contents || {});
        pack.files = pack.files || {};
        pack.library = pack.library || {};
        return pack;
    },

    // What importing would do. fileState(path, bytes) -> 'new' | 'same' | 'different'. ids: { prefabs: Set,
    // rooms: Set, biomes: Set } already in the project.
    plan(pack, fileState, ids) {
        const files = Object.keys(pack.files).map(path => {
            if (!this.safePath(path)) return { path, state: 'unsafe' };
            return { path, state: fileState(path, this.fromBase64(pack.files[path])) };
        });
        const clash = (list, have) => (list || []).filter(x => x && have && have.has(x.id)).length;
        return {
            files,
            newFiles: files.filter(f => f.state === 'new').length,
            sameFiles: files.filter(f => f.state === 'same').length,
            conflicts: files.filter(f => f.state === 'different').map(f => f.path),
            unsafe: files.filter(f => f.state === 'unsafe').map(f => f.path),
            prefabs: pack.contents.prefabs.length, rooms: pack.contents.rooms.length, biomes: pack.contents.biomes.length,
            dress: pack.contents.dress.length, collections: Object.keys(pack.contents.collections).length,
            templates: Object.keys(pack.contents.templates || {}).length,
            idClashes: clash(pack.contents.prefabs, ids.prefabs) + clash(pack.contents.rooms, ids.rooms) + clash(pack.contents.biomes, ids.biomes)
        };
    },

    // The pack's things ready to add: ids that clash get new ones (and prefabs inside prefabs follow).
    // newId(prefix) makes an id. Returns { prefabs, rooms, biomes, dress, collections, templates }.
    prepare(pack, ids, newId) {
        const fresh = (list, have, prefix) => {
            const map = {};
            const out = (list || []).map(x => {
                const copy = JSON.parse(JSON.stringify(x));
                if (have && have.has(copy.id)) { map[copy.id] = newId(prefix); copy.id = map[x.id]; }
                return copy;
            });
            return { out, map };
        };
        const prefabs = fresh(pack.contents.prefabs, ids.prefabs, 'pf_');
        for (const p of prefabs.out) for (const c of p.children || []) if (prefabs.map[c.id]) c.id = prefabs.map[c.id];
        return {
            prefabs: prefabs.out,
            rooms: fresh(pack.contents.rooms, ids.rooms, 'room_').out,
            biomes: fresh(pack.contents.biomes, ids.biomes, 'biome_').out,
            dress: JSON.parse(JSON.stringify(pack.contents.dress || [])),
            collections: JSON.parse(JSON.stringify(pack.contents.collections || {})),
            templates: JSON.parse(JSON.stringify(pack.contents.templates || {}))
        };
    },

    // A file name for a pack: letters, digits, spaces, dashes.
    fileName(name) {
        const base = String(name || 'Pack').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'Pack';
        return base + this.extension;
    }
};
