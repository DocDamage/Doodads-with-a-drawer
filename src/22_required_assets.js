//==========================================================
// SECTION 11D: REQUIRED ASSETS (FOR "EXCLUDE UNUSED FILES")
//==========================================================
// MZ's Deployment with "Exclude unused files" keeps only the files its database and maps name. Pictures the
// plugin draws (doodads and their states and seasons, picture layers, idle and run sheets, Visual
// Equipment layers, sky videos, models, the click marker's image) would be left out. Each save writes
// data/DocsDoodadsRequired.json: those files, project-relative. `npm run deploy -- --restore <project>
// <MZ's output folder>` copies back the ones the deployment left out (encrypted if the build is).
DocsDoodads.RequiredAssets = {
    path: 'data/DocsDoodadsRequired.json',

    // sources: { doodads ($dataDocsDoodads), database: { Actors, Armors, Weapons, States, Classes }, maps:
    // { id: map data }, characters: [file names in img/characters] }. Returns sorted project paths.
    collect(sources = {}) {
        const out = new Set();
        const add = p => { const s = String(p || '').replace(/\\/g, '/').replace(/^\.\//, ''); if (s && /^(img|audio|movies|models)\//i.test(s)) out.add(s); };
        const data = sources.doodads || {};
        const sheetNames = new Set();
        for (const [key, list] of Object.entries(data)) {
            if (!/^\d+$/.test(key) || !Array.isArray(list)) continue;
            for (const d of list) {
                if (!d) continue;
                if (d.bit && d.bit[0] === 3) add(d.bit[1]);
                for (const st of (d.states && d.states.list) || []) if (st && st.path) add(st.path);
                if (d.model && d.model.path) add(d.model.path);
            }
        }
        const world = data.world || {};
        for (const set of (world.seasons && world.seasons.sets) || []) for (const p of Object.values(set || {})) add(p);
        if (world.destination && world.destination.image) add('img/system/' + world.destination.image + '.png');
        for (const set of (world.characterAnim && world.characterAnim.sets) || []) {
            for (const name of [set && set.idle, set && set.run]) if (name) add('img/characters/' + name + '.png');
        }
        for (const ms of Object.values(data.mapSettings || {})) {
            for (const layer of (ms && ms.layers2d) || []) if (layer && layer.image && layer.image !== '#fog') add('img/parallaxes/' + layer.image + '.png');
            const p3 = ms && ms.perspective;
            if (p3 && p3.skyVideo) add(p3.skyVideo);
            if (ms && ms.destination && ms.destination.image) add('img/system/' + ms.destination.image + '.png');
        }
        // Visual Equipment layers named in the database's notes (<visual: Cape, sv SV_Cape>).
        for (const list of Object.values(sources.database || {})) {
            for (const item of list || []) {
                const note = item && item.note ? String(item.note) : '';
                for (const m of note.matchAll(/<\s*visual(?:\s+base)?\s*:\s*([^,>]+)([^>]*)>/gi)) {
                    const name = m[1].trim();
                    if (name && !/[{}#]/.test(name)) { add('img/characters/' + name + '.png'); sheetNames.add(name); }
                    const sv = /\bsv\s+([^,>\s]+)/i.exec(m[2] || '');
                    if (sv && !/[{}]/.test(sv[1])) add('img/sv_actors/' + sv[1] + '.png');
                }
                if (item && item.characterName) sheetNames.add(String(item.characterName));
            }
        }
        for (const map of Object.values(sources.maps || {})) {
            for (const ev of (map && map.events) || []) for (const page of (ev && ev.pages) || []) {
                if (page && page.image && page.image.characterName) sheetNames.add(page.image.characterName);
            }
        }
        // Idle, run and action sheets beside a sheet in use (Hero_idle[f2], Hero_run[f8], Hero_slash[f6]).
        for (const file of sources.characters || []) {
            const base = String(file).replace(/\.png$/i, '');
            for (const name of sheetNames) {
                if (name && base !== name && base.toLowerCase().startsWith(name.toLowerCase() + '_')) add('img/characters/' + file);
            }
        }
        return Array.from(out).sort();
    },

    // From the project on disk and in memory (the editor, on save). Returns the list written, or null.
    write() {
        const FS = DocsDoodads.FS;
        if (!FS.fs || !FS.path) return null;
        const database = {};
        for (const name of ['Actors', 'Armors', 'Weapons', 'States', 'Classes']) database[name] = FS.readJson(`data/${name}.json`) || [];
        const maps = {};
        for (const info of FS.readJson('data/MapInfos.json') || []) {
            if (info) maps[info.id] = FS.readJson(DocsDoodads.Persistence.mapFilePath(info.id));
        }
        let characters = [];
        try { characters = FS.fs.readdirSync('img/characters').filter(f => /\.png$/i.test(f)); } catch (e) { characters = []; }
        const files = this.collect({ doodads: window.$dataDocsDoodads || {}, database, maps, characters });
        const ok = FS.atomicWriteJson(this.path, { note: 'Files Doc\'s Doodads draws that MZ\'s "Exclude unused files" can\'t see. npm run deploy -- --restore <project> <deployed folder> puts them back.', files }, 2);
        return ok ? files : null;
    }
};
