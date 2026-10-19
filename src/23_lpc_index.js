//==========================================================
// SECTION 12C: LPC LIBRARY (INDEX, LICENCES, CREDITS)
//==========================================================
// The Universal LPC character collection, read from a copy of its library on this computer (its
// sheet_definitions, palette_definitions and spritesheets folders). None of its code, data or art ships
// with the plugin: the index of its parts lives in the editor's cache, and only images made from it (and
// their credits) go into the project. See docs/LPC_CHARACTER_CREATOR_PLAN.md.
//
// Licences: a credit block lists the licences its files are offered under, and any one of them may be
// used. CC-BY and CC-BY-SA forbid locking the work away (MZ's "Encrypt image files"); CC0 and OGA-BY don't,
// so art is "safe to encrypt" when every file it uses offers one of those two.
//
// Pure: reading the library is passed in as a small fs ({ readdirSync, readFileSync, existsSync, statSync }
// with a path module), so the workspace (44_workspace_lpc_library.js) and the tests share it.
DocsDoodads.Lpc = {
    indexFormat: 'docs-doodads-lpc-index',
    indexVersion: 1,
    creditsFormat: 'docs-doodads-credits',
    creditsVersion: 1,
    indexFile: 'data/docs_doodads_cache/lpc_index.json',
    creditsFile: 'data/DocsDoodadsCredits.json',
    creditsText: 'CREDITS_LPC.txt',
    bodyTypes: ['male', 'muscular', 'female', 'pregnant', 'teen', 'child'],
    // Fields a part may have. Others are reported (the library may have grown) but don't stop the part.
    knownFields: ['name', 'type_name', 'priority', 'animations', 'credits', 'recolors', 'variants', 'match_body_color', 'tags',
        'required_tags', 'replace_in_path', 'aliases', 'preview_row', 'preview_column', 'preview_x_offset', 'preview_y_offset', 'path'],
    // Most open first: the licence a credits list names when a file offers several.
    licenceOrder: [/^CC0/i, /^OGA-BY/i, /^CC-BY(?!-SA)/i, /^CC-BY-SA/i, /^GPL/i],
    safeLicence: /^(CC0|OGA-BY)/i,

    // ---- Licences ----

    preferredLicence(licences) {
        const list = (licences || []).map(String);
        for (const re of this.licenceOrder) {
            const hit = list.find(l => re.test(l));
            if (hit) return hit;
        }
        return list[0] || '';
    },

    blockIsSafe(block) {
        return Boolean(block) && (block.licenses || []).some(l => this.safeLicence.test(String(l)));
    },

    // The credit block for one image folder: the block whose file is the longest prefix of the path.
    creditFor(credits, layerPath) {
        const clean = String(layerPath || '').replace(/\/+$/, '');
        let best = null;
        for (const c of credits || []) {
            if (!c || !c.file) continue;
            const file = String(c.file).replace(/\/+$/, '');
            if ((clean === file || clean.startsWith(file + '/')) && (!best || file.length > String(best.file).replace(/\/+$/, '').length)) best = c;
        }
        return best;
    },

    // ---- Reading parts ----

    // A part from its definition, or { skip: reason } when the format isn't one this version knows.
    readPart(id, def) {
        if (!def || typeof def !== 'object' || Array.isArray(def)) return { skip: 'not an object' };
        if (typeof def.name !== 'string' || !def.name.trim()) return { skip: 'no name' };
        const layerKeys = Object.keys(def).filter(k => /^layer_\d+$/.test(k)).sort((a, b) => Number(a.slice(6)) - Number(b.slice(6)));
        if (!layerKeys.length) return { skip: 'no layers' };
        const layers = [];
        for (const key of layerKeys) {
            const l = def[key];
            if (!l || typeof l !== 'object' || typeof l.zPos !== 'number' || !isFinite(l.zPos)) return { skip: key + ' has no zPos' };
            const paths = {};
            for (const body of this.bodyTypes) if (typeof l[body] === 'string' && l[body]) paths[body] = l[body];
            if (!Object.keys(paths).length) return { skip: key + ' has no body types' };
            layers.push({ z: l.zPos, custom: typeof l.custom_animation === 'string' ? l.custom_animation : '', paths });
        }
        if (def.animations !== undefined && !(Array.isArray(def.animations) && def.animations.every(a => typeof a === 'string'))) return { skip: 'animations is not a list of names' };
        if (def.credits !== undefined && !Array.isArray(def.credits)) return { skip: 'credits is not a list' };
        const credits = (def.credits || []).filter(c => c && typeof c === 'object').map(c => ({
            file: String(c.file || ''), authors: (c.authors || []).map(String), licenses: (c.licenses || []).map(String),
            urls: (c.urls || []).map(String), notes: c.notes ? String(c.notes) : ''
        }));
        // Safety for each body type, from the blocks crediting that body's folders.
        const safeFor = {};
        for (const body of this.bodyTypes) {
            const folders = layers.map(l => l.paths[body]).filter(Boolean);
            if (!folders.length) continue;
            safeFor[body] = folders.every(f => this.blockIsSafe(this.creditFor(credits, f)));
        }
        const bodies = Object.keys(safeFor);
        return {
            id, name: def.name.trim(), type: typeof def.type_name === 'string' ? def.type_name : '', category: String(id).split('/')[0],
            priority: Number(def.priority) || 0, layers, animations: def.animations || [], variants: Array.isArray(def.variants) ? def.variants.map(String) : [],
            recolors: def.recolors && typeof def.recolors === 'object' ? def.recolors : null, matchBodyColor: def.match_body_color === true,
            tags: Array.isArray(def.tags) ? def.tags.map(String) : [], requiredTags: Array.isArray(def.required_tags) ? def.required_tags.map(String) : [],
            replaceInPath: def.replace_in_path && typeof def.replace_in_path === 'object' ? def.replace_in_path : null,
            licences: [...new Set(credits.flatMap(c => c.licenses))], credited: credits.length > 0,
            safeFor, safeToEncrypt: bodies.length > 0 && bodies.some(b => safeFor[b]), credits,
            unknownFields: Object.keys(def).filter(k => !/^layer_\d+$/.test(k) && !this.knownFields.includes(k))
        };
    },

    // material folder -> { label, base, version, versions: { ulpc: { name: ['#hex'...] } } }
    readPalettes(entries) {
        const materials = {};
        for (const e of entries || []) {
            const meta = e.meta && typeof e.meta === 'object' ? e.meta : {};
            const versions = {};
            for (const [version, ramps] of Object.entries(e.versions || {})) {
                if (!ramps || typeof ramps !== 'object') continue;
                const good = {};
                for (const [name, ramp] of Object.entries(ramps)) {
                    if (Array.isArray(ramp) && ramp.length && ramp.every(c => /^#[0-9a-f]{6}$/i.test(String(c)))) good[name] = ramp.map(c => String(c).toLowerCase());
                }
                if (Object.keys(good).length) versions[version] = good;
            }
            if (!Object.keys(versions).length) continue;
            const version = versions[meta.default] ? meta.default : Object.keys(versions)[0];
            materials[e.material] = { label: String(meta.label || e.material), base: meta.base ? String(meta.base) : '', version, versions };
        }
        return materials;
    },

    // ---- The library on disk ----

    // Whether a folder looks like the library: it has sheet_definitions and spritesheets.
    isLibrary(fsLike, pathLib, root) {
        try {
            return Boolean(root) && fsLike.existsSync(pathLib.join(root, 'sheet_definitions')) && fsLike.existsSync(pathLib.join(root, 'spritesheets'));
        } catch (e) {
            return false;
        }
    },

    // The library's git commit, when it is a clone ('' otherwise).
    libraryCommit(fsLike, pathLib, root) {
        try {
            const git = pathLib.join(root, '.git');
            const head = String(fsLike.readFileSync(pathLib.join(git, 'HEAD'), 'utf8')).trim();
            const ref = /^ref:\s*(.+)$/.exec(head);
            if (!ref) return /^[0-9a-f]{40}$/i.test(head) ? head.toLowerCase() : '';
            const loose = pathLib.join(git, ...ref[1].split('/'));
            if (fsLike.existsSync(loose)) return String(fsLike.readFileSync(loose, 'utf8')).trim().toLowerCase();
            const packed = String(fsLike.readFileSync(pathLib.join(git, 'packed-refs'), 'utf8'));
            const line = packed.split('\n').find(l => l.trim().endsWith(' ' + ref[1]));
            return line ? line.split(' ')[0].trim().toLowerCase() : '';
        } catch (e) {
            return '';
        }
    },

    listJson(fsLike, pathLib, dir, base = dir, out = []) {
        let entries = [];
        try { entries = fsLike.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
        for (const entry of entries) {
            const full = pathLib.join(dir, entry.name);
            if (entry.isDirectory()) this.listJson(fsLike, pathLib, full, base, out);
            else if (/\.json$/i.test(entry.name)) out.push({ full, rel: pathLib.relative(base, full).split(pathLib.sep).join('/') });
        }
        return out;
    },

    // Reads the library into an index. now: an ISO time for 'built' (passed in for tests).
    scan(fsLike, pathLib, root, now) {
        if (!this.isLibrary(fsLike, pathLib, root)) return null;
        const parts = [], skipped = [], newFields = new Set();
        const defs = this.listJson(fsLike, pathLib, pathLib.join(root, 'sheet_definitions'))
            .filter(f => !/(^|\/)meta_[^/]*$/.test(f.rel)).sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
        for (const f of defs) {
            const id = f.rel.replace(/\.json$/i, '');
            let def;
            try { def = JSON.parse(String(fsLike.readFileSync(f.full, 'utf8'))); } catch (e) { skipped.push({ id, why: 'not readable JSON' }); continue; }
            const part = this.readPart(id, def);
            if (part.skip) { skipped.push({ id, why: part.skip }); continue; }
            part.unknownFields.forEach(k => newFields.add(k));
            delete part.unknownFields;
            parts.push(part);
        }
        const paletteRoot = pathLib.join(root, 'palette_definitions');
        const entries = [];
        let dirs = [];
        try { dirs = fsLike.readdirSync(paletteRoot, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch (e) {}
        for (const material of dirs) {
            const dir = pathLib.join(paletteRoot, material);
            const read = file => { try { return JSON.parse(String(fsLike.readFileSync(pathLib.join(dir, file), 'utf8'))); } catch (e) { return null; } };
            const versions = {};
            let files = [];
            try { files = fsLike.readdirSync(dir); } catch (e) {}
            for (const file of files) {
                const m = new RegExp('^' + material.replace(/[^\w]/g, '\\$&') + '_(\\w+)\\.json$').exec(file);
                if (m) versions[m[1]] = read(file);
            }
            entries.push({ material, meta: read('meta_' + material + '.json'), versions });
        }
        const palettes = this.readPalettes(entries);
        return {
            format: this.indexFormat, version: this.indexVersion, library: root, commit: this.libraryCommit(fsLike, pathLib, root),
            built: now || new Date().toISOString(), parts, palettes, skipped, newFields: [...newFields].sort()
        };
    },

    // A saved index this version can use, or null.
    validIndex(index) {
        return index && index.format === this.indexFormat && index.version === this.indexVersion && Array.isArray(index.parts) ? index : null;
    },

    summary(index, safeOnly) {
        if (!this.validIndex(index)) return null;
        const safe = index.parts.filter(p => p.safeToEncrypt).length;
        const categories = {};
        for (const p of index.parts) if (!safeOnly || p.safeToEncrypt) categories[p.category] = (categories[p.category] || 0) + 1;
        return { parts: index.parts.length, safe, usable: safeOnly ? safe : index.parts.length, skipped: (index.skipped || []).length,
            materials: Object.keys(index.palettes || {}).length, categories, commit: index.commit || '', built: index.built || '', newFields: index.newFields || [] };
    },

    // Whether a folder is inside the project, where MZ's Deployment would copy all of it into the game.
    insideProject(pathLib, folder, project) {
        if (!folder || !project) return false;
        const rel = pathLib.relative(pathLib.resolve(project), pathLib.resolve(folder));
        return rel === '' || (!rel.startsWith('..') && !pathLib.isAbsolute(rel));
    },

    // ---- Credits ----

    emptyCredits() {
        return { format: this.creditsFormat, version: this.creditsVersion, images: {} };
    },

    validCredits(data) {
        return data && data.format === this.creditsFormat && data.images && typeof data.images === 'object' ? data : this.emptyCredits();
    },

    // The credit entries for the image folders an image was made from (one per credited folder).
    // used: [{ part (index part), folder (its layer path) }]
    creditsForLayers(used) {
        const out = new Map();
        for (const u of used || []) {
            const block = u.part && this.creditFor(u.part.credits, u.folder);
            const key = block ? block.file : 'uncredited:' + (u.folder || (u.part && u.part.id));
            if (out.has(key)) continue;
            out.set(key, block
                ? { file: block.file, part: u.part.name, authors: block.authors, licences: block.licenses, urls: block.urls, notes: block.notes, safeToEncrypt: this.blockIsSafe(block) }
                : { file: String(u.folder || ''), part: u.part ? u.part.name : '', authors: [], licences: [], urls: [], notes: '', safeToEncrypt: false, uncredited: true });
        }
        return [...out.values()];
    },

    // Records (or replaces) the credits of one image in the project's credits data.
    recordImage(data, image, files, now) {
        const credits = this.validCredits(data);
        credits.images[String(image)] = {
            source: 'lpc', made: now || new Date().toISOString(), safeToEncrypt: files.length > 0 && files.every(f => f.safeToEncrypt), files
        };
        return credits;
    },

    forgetImage(data, image) {
        const credits = this.validCredits(data);
        delete credits.images[String(image)];
        return credits;
    },

    // Images whose art can't be encrypted, or that have files with no credits.
    unsafeImages(data, exists) {
        const credits = this.validCredits(data);
        return Object.keys(credits.images).sort().filter(img => (!exists || exists(img)) && !credits.images[img].safeToEncrypt)
            .map(img => ({ image: img, licences: [...new Set(credits.images[img].files.filter(f => !f.safeToEncrypt).flatMap(f => f.licences))],
                uncredited: credits.images[img].files.some(f => f.uncredited) }));
    },

    // The text of CREDITS_LPC.txt: each image, then each artwork it uses with its authors, licence and links.
    // exists(image) leaves out images that are no longer in the project.
    creditsTextFor(data, exists) {
        const credits = this.validCredits(data);
        const images = Object.keys(credits.images).sort().filter(img => !exists || exists(img));
        const lines = [
            'ART CREDITS',
            '',
            'Characters made from the Universal LPC Spritesheet Character Generator collection',
            '(Liberated Pixel Cup art and the artists who added to it). Each artwork below is used',
            'under the licence named; the others it is also offered under are in brackets.',
            ''
        ];
        if (!images.length) lines.push('(No images made from the LPC collection yet.)');
        for (const img of images) {
            lines.push(img);
            for (const f of credits.images[img].files) {
                if (f.uncredited) { lines.push('  - ' + f.file + ': NO CREDITS FOUND. Do not ship this art until its authors and licence are known.'); continue; }
                const used = this.preferredLicence(f.licences);
                const also = f.licences.filter(l => l !== used);
                lines.push('  - ' + (f.part ? f.part + ' (' + f.file + ')' : f.file));
                lines.push('    by ' + (f.authors.length ? f.authors.join(', ') : 'unknown'));
                lines.push('    licence: ' + (used || 'unknown') + (also.length ? ' [also ' + also.join(', ') + ']' : ''));
                for (const url of f.urls) lines.push('    ' + url);
                if (f.notes) lines.push('    note: ' + f.notes);
            }
            lines.push('');
        }
        return lines.join('\n').replace(/\n+$/, '') + '\n';
    }
};

// The project's choice: show only art that is safe to encrypt (on until turned off).
DocsDoodads.World.defaults.lpc = { safeOnly: true };
