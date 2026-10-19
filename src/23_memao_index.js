//==========================================================
// SECTION 12G: MEMAO CHARACTER LIBRARY (INDEX)
//==========================================================
// The asset pack of the Memao Sprite Sheet Creator (Sleeping Robot Games), read from the folder it was unpacked
// to on this computer: three sets of layered sheets (Main, Battle, Daily Life), a folder per part in each
// (HairA/haira_007.png), README.md (the parts' names) and z_index_player_library.json (the draw order for each
// facing). Its licence forbids sharing the pack, so none of it ships with the plugin or goes into the project:
// the index lives in the editor's cache, and only sheets made from it go into the game (which it allows). None
// of the tool's code is used. See docs/MEMAO_CHARACTER_CREATOR_PLAN.md.
//
// Pure: reading the pack is passed in as a small fs ({ readdirSync, readFileSync, existsSync, statSync }) with a
// path module, so the workspace (44_workspace_memao.js) and the tests share it.
DocsDoodads.Memao = {
    indexFormat: 'docs-doodads-memao-index',
    indexVersion: 1,
    indexFile: 'data/docs_doodads_cache/memao_index.json',
    sets: ['Main', 'Battle', 'Daily Life'],
    zFile: 'z_index_player_library.json',
    // Folders that hold another part's frames at another depth, drawn with it from the same file number.
    pairs: { HairD: 'HairB', BackB: 'BackA', ShoulderB: 'ShoulderA', ChopB: 'ChopA', StrikeB: 'StrikeA' },
    // Sleeves: one file per style and arm; the file follows the body's arms.
    armed: ['TopB', 'JacketB'],
    arms: ['dainty', 'average', 'broad'],
    // Props a set draws in their own animation, whatever the character wears.
    props: ['Eat', 'Drink', 'Read', 'Paint'],
    skinFolders: ['Body', 'Head', 'Arms', 'Ears'],
    hairFolders: ['HairA', 'HairB', 'HairC', 'HairD', 'Eyebrows'],
    plainFolders: ['Sword', 'ChopA', 'ChopB', 'StrikeA', 'StrikeB', 'Reap', 'Seed', 'Water', 'Eat', 'Drink', 'Read', 'Paint'],

    // The colour channel a folder's art is recoloured with ('' when it is drawn as it is).
    channelOf(folder) {
        if (this.skinFolders.includes(folder)) return 'skin';
        if (this.hairFolders.includes(folder)) return 'hair';
        if (folder === 'Eyes') return 'eyes';
        if (this.plainFolders.includes(folder)) return '';
        return 'cloth';
    },

    pad(n) {
        return String(n).padStart(3, '0');
    },

    // ---- README.md: the parts' names ----

    // { HairA: { label: 'Hair A', about, items: { 7: { order: 15, name: 'Emo Left' } } } } from lines like
    // "**Hair A** - Bang/Scalp hair" and "- 007 (015: Emo Left)".
    readNames(text) {
        const out = {};
        let folder = null;
        for (const raw of String(text || '').split(/\r?\n/)) {
            const line = raw.trim();
            const head = /^\*\*([^*]+)\*\*\s*(?:-\s*(.*))?$/.exec(line);
            if (head) {
                folder = head[1].replace(/\s+/g, '');
                out[folder] = { label: head[1].trim(), about: (head[2] || '').trim(), items: {} };
                continue;
            }
            const item = /^-\s*(\d{3})\s*\(\s*(\d{3})\s*:\s*([^)]*)\)/.exec(line);
            if (item && folder) out[folder].items[Number(item[1])] = { order: Number(item[2]), name: item[3].replace(/\s+/g, ' ').trim() };
        }
        return out;
    },

    // 'Straps Dainty Arm' -> { style: 'Straps', arm: 'dainty' } (null when the name has no arm).
    splitArm(name) {
        const m = /^(.*?)\s+(Dainty|Average|Broad)\s+Arm$/i.exec(String(name || '').trim());
        return m ? { style: m[1].trim(), arm: m[2].toLowerCase() } : null;
    },

    // ---- The pack on disk ----

    isLibrary(fsLike, pathLib, root) {
        try {
            return Boolean(root) && fsLike.existsSync(pathLib.join(root, 'Main')) && fsLike.existsSync(pathLib.join(root, this.zFile));
        } catch (e) {
            return false;
        }
    },

    // A PNG's size from its header ({ width, height }, or null).
    pngSize(buffer) {
        if (!buffer || buffer.length < 24 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) return null;
        const u32 = o => ((buffer[o] << 24) >>> 0) + (buffer[o + 1] << 16) + (buffer[o + 2] << 8) + buffer[o + 3];
        return { width: u32(16), height: u32(20) };
    },

    // The draw order per facing: front/back/left/right in the file -> down/up/left/right.
    zFor(z, folder) {
        const e = (z && (z[folder] || z.Tool)) || {};
        const n = v => (typeof v === 'number' && isFinite(v) ? v : 31);
        return { down: n(e.front), up: n(e.back), left: n(e.left), right: n(e.right) };
    },

    // Reads the pack into an index. now: an ISO time for 'built' (passed in for tests).
    scan(fsLike, pathLib, root, now) {
        if (!this.isLibrary(fsLike, pathLib, root)) return null;
        const warnings = [];
        let z = {};
        try { z = JSON.parse(String(fsLike.readFileSync(pathLib.join(root, this.zFile), 'utf8'))); } catch (e) { warnings.push(`${this.zFile} could not be read; every part is drawn at one depth.`); }
        let names = {};
        try { names = this.readNames(String(fsLike.readFileSync(pathLib.join(root, 'README.md'), 'utf8'))); } catch (e) { warnings.push('README.md could not be read; parts are named by number.'); }
        // folder -> { none, files: { number: [sets] } }
        const found = {};
        const sets = {};
        for (const set of this.sets) {
            const dir = pathLib.join(root, set);
            let entries = [];
            try { entries = fsLike.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch (e) { warnings.push(`There is no ${set} set: its animations are left out.`); continue; }
            let size = null;
            for (const folder of entries) {
                let files = [];
                try { files = fsLike.readdirSync(pathLib.join(dir, folder)); } catch (e) { continue; }
                const re = new RegExp('^' + folder.toLowerCase() + '_(\\d{3})\\.png$', 'i');
                for (const file of files) {
                    const m = re.exec(file);
                    if (!m) continue;
                    const num = Number(m[1]);
                    const f = found[folder] = found[folder] || { none: false, files: {} };
                    if (num === 0) { f.none = true; continue; }
                    (f.files[num] = f.files[num] || []).push(set);
                    if (!size && folder === 'Body') {
                        try { size = this.pngSize(fsLike.readFileSync(pathLib.join(dir, folder, file))); } catch (e) { size = null; }
                    }
                }
            }
            sets[set] = size ? { width: size.width, height: size.height, columns: Math.floor(size.width / 48), frames: Math.floor(size.width / 48) * Math.floor(size.height / 48) } : { width: 0, height: 0, columns: 8, frames: 0 };
        }
        const folders = {};
        const parts = [];
        for (const folder of Object.keys(found).sort()) {
            const n = names[folder] || { label: folder.replace(/([a-z])([A-Z])/g, '$1 $2'), about: '', items: {} };
            const leader = this.pairs[folder] || '';
            folders[folder] = { label: n.label, about: n.about, none: found[folder].none, channel: this.channelOf(folder), z: this.zFor(z, folder), leader, prop: this.props.includes(folder) };
            if (leader) continue;
            const nums = Object.keys(found[folder].files).map(Number).sort((a, b) => a - b);
            const nameOf = num => (n.items[num] ? n.items[num].name : `${n.label} ${num}`);
            const orderOf = num => (n.items[num] ? n.items[num].order : 1000 + num);
            if (this.armed.includes(folder)) {
                // One part per sleeve style, with the file for each arm.
                const styles = new Map();
                for (const num of nums) {
                    const split = this.splitArm(nameOf(num));
                    const key = split ? split.style : nameOf(num);
                    const entry = styles.get(key) || { id: folder + '/' + key.replace(/[^\w]+/g, '_'), folder, name: key, order: orderOf(num), files: {}, sets: [] };
                    entry.files[split ? split.arm : 'any'] = num;
                    entry.order = Math.min(entry.order, orderOf(num));
                    entry.sets = [...new Set(entry.sets.concat(found[folder].files[num]))];
                    styles.set(key, entry);
                }
                parts.push(...styles.values());
            } else {
                for (const num of nums) parts.push({ id: folder + '/' + this.pad(num), folder, name: nameOf(num), order: orderOf(num), files: { any: num }, sets: found[folder].files[num].slice() });
            }
        }
        return {
            format: this.indexFormat, version: this.indexVersion, library: root, built: now || new Date().toISOString(),
            folders, parts, sets, warnings
        };
    },

    // A saved index this version can use, or null.
    validIndex(index) {
        return index && index.format === this.indexFormat && index.version === this.indexVersion && Array.isArray(index.parts) ? index : null;
    },

    summary(index) {
        if (!this.validIndex(index)) return null;
        return { parts: index.parts.length, folders: Object.keys(index.folders || {}).length, sets: this.sets.filter(s => index.sets && index.sets[s] && index.sets[s].frames),
            built: index.built || '', warnings: index.warnings || [] };
    },

    // The file a part draws for a body (its arm's sleeve, or its only file), or null.
    fileFor(part, arm) {
        if (!part || !part.files) return null;
        if (part.files[arm] !== undefined) return part.files[arm];
        if (part.files.any !== undefined) return part.files.any;
        return null;
    },

    // Whether a folder is inside the project, where MZ's Deployment would copy all of it into the game.
    insideProject(pathLib, folder, project) {
        return DocsDoodads.Lpc.insideProject(pathLib, folder, project);
    }
};
