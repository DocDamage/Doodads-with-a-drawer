//==========================================================
// SECTION 25q: DOODAD PACKS (CARD, EXPORT AND IMPORT)
//==========================================================
// More > Packs: pick prefabs, rooms, biomes, dressing rules, collections and event templates and save them, with
// the files they use, as one .ddpack file in the project's packs folder; or bring a pack in from another project,
// or a zip of art (or a zip with a pack in it; 22_zip.js), with the same checks on where its files may go.
// Files already here and different are kept unless "Use the pack's" is picked (a backup is made first).
DocsDoodads.Ui.css += `
#dd-packs-card { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 420px; max-width: calc(100vw - 32px); max-height: calc(100vh - 110px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; }
#dd-packs-card .dd-pack-group { font-size: 11px; font-weight: 900; color: var(--dd-muted); margin-top: 4px; }
#dd-packs-card .dd-pack-list { display: flex; flex-direction: column; gap: 2px; max-height: 120px; overflow-y: auto; }
#dd-packs-card label { display: flex; align-items: center; gap: 6px; font-size: 11px; }
#dd-packs-card .dd-pack-note { font-size: 10px; color: var(--dd-faint); line-height: 1.4; }
`;

Object.assign(DocsDoodads.Workspace, {
    packSelection: { prefabs: [], rooms: [], biomes: [], dress: [], collections: [], templates: [] },
    _incomingPack: null,

    packSources() {
        const D = DocsDoodads;
        return {
            prefab: id => D.Prefabs.get(id),
            room: id => D.Rooms.get(id),
            biomes: D.World.get('biomes.list') || [],
            dress: D.World.get('dress.rules') || [],
            collections: (D.AssetIndex.data && D.AssetIndex.data.collections) || {},
            assetPath: id => { const a = D.AssetIndex.data.assets[id]; return a ? a.path : null; },
            template: key => (D.EventTemplates.isCustom(key) ? D.EventTemplates.get(key) : null)
        };
    },

    // 'bgs/River' as the file the game would play, if it is in the project.
    packAudioFile(name) {
        const FS = DocsDoodads.FS;
        for (const ext of ['.ogg', '.m4a', '.wav']) {
            const file = 'audio/' + name + ext;
            if (FS.existsSync(file)) return file;
        }
        return null;
    },

    readProjectFile(p) {
        const FS = DocsDoodads.FS;
        try { return FS.existsSync(p) ? FS.fs.readFileSync(p) : null; } catch (e) { return null; }
    },

    // Makes the pack and writes it to packs/<name>.ddpack (asking first if one of that name is there; written
    // whole or not at all). Returns { path, pack }, or null.
    async exportPack(name, sel = this.packSelection) {
        const D = DocsDoodads, P = D.Packs, FS = D.FS;
        const gathered = P.gather(sel, this.packSources(), n => this.packAudioFile(n));
        const total = gathered.contents.prefabs.length + gathered.contents.rooms.length + gathered.contents.biomes.length +
            gathered.contents.dress.length + Object.keys(gathered.contents.collections).length + Object.keys(gathered.contents.templates || {}).length;
        if (!total) { this.showToast('Pick something to put in the pack first.', 'info'); return null; }
        const pack = P.build(name, gathered, p => this.readProjectFile(p), p => D.AssetIndex.data.assets[p.toLowerCase()] || null);
        const out = FS.path.join('packs', P.fileName(pack.name));
        if (FS.existsSync(out) && !(await D.Ui.confirm(`${out.replace(/\\/g, '/')} is already there. Replace it with this pack?`,
            { title: 'Replace the pack?', ok: 'Replace', danger: true }))) return null;
        try {
            FS.mkdirp('packs');
            FS.atomicWriteFile(out, JSON.stringify(pack), 'utf8');
        } catch (e) {
            this.showToast('Could not save the pack: ' + (e.message || e), 'error');
            return null;
        }
        const files = Object.keys(pack.files).length;
        this.showToast(`Saved ${out}: ${total} item(s) and ${files} file(s)${pack.missing.length ? `; ${pack.missing.length} file(s) not found were left out` : ''}.`, pack.missing.length ? 'info' : 'success');
        try { if (typeof nw !== 'undefined' && nw.Shell) nw.Shell.showItemInFolder(FS.path.resolve(out)); } catch (e) {}
        return { path: out, pack };
    },

    // The pack's files compared with the project's.
    packFileState(p, bytes) {
        const mine = this.readProjectFile(p);
        if (!mine) return 'new';
        if (mine.length === bytes.length && Buffer.compare(Buffer.from(mine), Buffer.from(bytes)) === 0) return 'same';
        return 'different';
    },

    projectIds() {
        const D = DocsDoodads;
        return {
            prefabs: new Set(D.Prefabs.ensureLoaded().map(p => p.id)),
            rooms: new Set(D.Rooms.ensureLoaded().map(r => r.id)),
            biomes: new Set((D.World.get('biomes.list') || []).map(b => b && b.id))
        };
    },

    readPack(filePath) {
        const D = DocsDoodads;
        let pack, leftOut = [];
        if (/\.zip$/i.test(filePath)) {
            const read = D.Zip.read(D.FS.fs.readFileSync(filePath), require('zlib').inflateRawSync);
            const found = D.Zip.asPack(filePath, read, D.Packs);
            pack = found.packText !== undefined ? D.Packs.parse(found.packText) : D.Packs.parse(JSON.stringify(found.pack));
            leftOut = found.pack ? found.pack.leftOut : read.unsafe;
            if (!found.packText && !Object.keys(pack.files).length) throw new Error('There are no pictures in this zip to bring in.');
        } else {
            pack = D.Packs.parse(D.FS.fs.readFileSync(filePath, 'utf8'));
        }
        this._incomingPack = { pack, plan: D.Packs.plan(pack, (p, b) => this.packFileState(p, b), this.projectIds()), file: filePath, conflict: 'keep', leftOut };
        return this._incomingPack;
    },

    // Brings the pack in. conflict: 'keep' (files already here stay) or 'replace' (backed up, then the
    // pack's). Returns what was added.
    async importPack(incoming = this._incomingPack) {
        if (!incoming) return null;
        const D = DocsDoodads, P = D.Packs, FS = D.FS;
        const { pack, plan } = incoming;
        const written = [];
        for (const f of plan.files) {
            if (f.state === 'unsafe' || f.state === 'same') continue;
            if (f.state === 'different' && incoming.conflict !== 'replace') continue;
            try {
                if (f.state === 'different') FS.createTimestampedBackup(f.path);
                FS.mkdirp(FS.path.dirname(f.path));
                FS.atomicWriteFile(f.path, P.fromBase64(pack.files[f.path]));
                written.push(f.path);
            } catch (e) {
                this.showToast(`Could not write ${f.path}: ${e.message || e}`, 'error');
            }
        }
        const ready = P.prepare(pack, this.projectIds(), prefix => D.Prefabs.newId(prefix));
        ready.prefabs.forEach(p => D.Prefabs.add(p));
        if (ready.prefabs.length) D.Prefabs.save();
        ready.rooms.forEach(r => D.Rooms.add(r));
        if (ready.rooms.length) D.Rooms.save();
        if (ready.biomes.length) this.setWorldSetting('biomes.list', (JSON.parse(JSON.stringify(D.World.get('biomes.list') || []))).concat(ready.biomes));
        if (ready.dress.length) this.setWorldSetting('dress.rules', (JSON.parse(JSON.stringify(D.World.get('dress.rules') || []))).concat(ready.dress));
        const templates = Object.keys(ready.templates).map(key => D.EventTemplates.addFromPack(key, ready.templates[key])).filter(Boolean);
        // The Item Bag finds the new files, then they take the pack's slices and tags (only files it wrote).
        if (written.length && D.AssetIndex.indexPaths) await D.AssetIndex.indexPaths(written, { save: false });
        let entries = 0;
        for (const p of written) {
            const entry = D.AssetIndex.data.assets[p.toLowerCase()];
            const from = pack.library[p];
            if (entry && from) { Object.assign(entry, JSON.parse(JSON.stringify(from))); entries++; }
        }
        for (const name of Object.keys(ready.collections)) {
            for (const p of ready.collections[name]) if (D.AssetIndex.data.assets[p.toLowerCase()]) D.AssetIndex.addAssetToCollection(p.toLowerCase(), name);
        }
        if (entries || Object.keys(ready.collections).length) {
            D.AssetIndex.rebuildList();
            if (D.AssetIndex.save) D.AssetIndex.save();
        }
        if (this.refreshDrawerCards) this.refreshDrawerCards();
        this._incomingPack = null;
        const kept = plan.conflicts.length && incoming.conflict !== 'replace' ? `; kept your own ${plan.conflicts.length} file(s) that differ` : '';
        this.showToast(`Brought in "${pack.name}": ${ready.prefabs.length} prefab(s), ${ready.rooms.length} room(s), ${ready.biomes.length} biome(s), ${ready.dress.length} rule(s), ${templates.length} template(s), ${written.length} file(s)${kept}.`, 'success');
        this.refreshPacksCard();
        return { written, ready, templates };
    },

    pickPackToImport() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = DocsDoodads.Packs.extension + ',.json,.zip';
        input.onchange = () => {
            const file = input.files && input.files[0];
            if (!file || !file.path) return;
            try { this.readPack(file.path); } catch (e) { this.showToast(e.message || String(e), 'error'); }
            this.refreshPacksCard();
        };
        if (typeof input.click === 'function') input.click();
        return true;
    },

    // ---- The card ----
    showPacksCard() {
        if (typeof document === 'undefined') return null;
        const D = DocsDoodads, U = D.Ui, sel = this.packSelection;
        let card = document.getElementById('dd-packs-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-packs-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const src = this.packSources();
        const groups = [
            ['prefabs', 'Prefabs', D.Prefabs.ensureLoaded().map(p => [p.id, p.name])],
            ['rooms', 'Rooms', D.Rooms.ensureLoaded().map(r => [r.id, r.name])],
            ['biomes', 'Biomes', (src.biomes || []).filter(Boolean).map(b => [b.id, b.name])],
            ['dress', 'Dressing rules', (src.dress || []).map((r, i) => [i, (r && r.name) || 'Rule ' + (i + 1)])],
            ['collections', 'Collections', Object.keys(src.collections).map(n => [n, n])],
            ['templates', 'Event templates', D.EventTemplates.custom().map(t => [t.key, t.name])]
        ];
        const listHtml = (key, items) => items.length
            ? items.map(([value, label], i) => `<label><input type="checkbox" id="dd-pk-${key}-${i}" ${sel[key].includes(value) ? 'checked' : ''} /> ${escapeHtml(String(label))}</label>`).join('')
            : '<div class="dd-pack-note">None in this project.</div>';
        const inc = this._incomingPack;
        const incoming = inc ? `
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; display: flex; flex-direction: column; gap: 5px;">
                <b style="font-size: 12px;">${escapeHtml(inc.pack.name)}</b>
                <div class="dd-pack-note">${inc.plan.prefabs} prefab(s), ${inc.plan.rooms} room(s), ${inc.plan.biomes} biome(s), ${inc.plan.dress} rule(s), ${inc.plan.collections} collection(s), ${inc.plan.templates} template(s);
                    files: ${inc.plan.newFiles} new, ${inc.plan.sameFiles} already here${inc.plan.conflicts.length ? `, <b>${inc.plan.conflicts.length} different from yours</b>` : ''}.${inc.plan.idClashes ? ' Items with the same id as yours are added as new ones.' : ''}${inc.plan.unsafe.length ? ` ${inc.plan.unsafe.length} file(s) outside the project's folders are left out.` : ''}${(inc.leftOut || []).length ? ` ${inc.leftOut.length} file(s) in the zip are not pictures or project files and are left out.` : ''}</div>
                ${inc.plan.conflicts.length ? `<div class="dd-pack-note" style="max-height: 60px; overflow-y: auto;">${inc.plan.conflicts.map(escapeHtml).join('<br>')}</div>
                <div style="font-size: 11px;">Files that differ <select id="dd-pk-conflict"><option value="keep"${inc.conflict === 'keep' ? ' selected' : ''}>Keep mine</option><option value="replace"${inc.conflict === 'replace' ? ' selected' : ''}>Use the pack's (mine are backed up)</option></select></div>` : ''}
                <div style="display: flex; gap: 6px;"><button class="dd-btn dd-btn-primary" id="dd-pk-import" type="button">Bring It In</button>
                    <button class="dd-btn" id="dd-pk-cancel" type="button">Cancel</button></div>
            </div>` : '';
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('box', 1)} Doodad Packs</span>
                <button class="dd-btn dd-fold" id="dd-packs-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-pack-note">A pack is one file with the things you pick and the art, sounds and models they use, to bring into another project.</div>
            ${groups.map(([key, title, items]) => `<div class="dd-pack-group">${title}</div><div class="dd-pack-list">${listHtml(key, items)}</div>`).join('')}
            <div style="display: flex; gap: 6px; align-items: center;">
                <input type="text" id="dd-pk-name" value="${escapeHtml(this._packName || 'My Pack')}" style="flex: 1; min-width: 0;" title="The pack's name" />
                <button class="dd-btn dd-btn-primary" id="dd-pk-export" type="button" title="Saves it in the project's packs folder">Make Pack</button></div>
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px;">
                <button class="dd-btn" id="dd-pk-open" type="button" title="Choose a .ddpack file from another project, or a .zip of art (or with a pack in it)">${U.icon('folder', 1)} Bring In a Pack or Zip...</button></div>
            ${incoming}`;
        const byId = id => document.getElementById(id);
        groups.forEach(([key, , items]) => items.forEach(([value], i) => {
            const box = byId(`dd-pk-${key}-${i}`);
            if (box) box.onchange = e => {
                const list = sel[key].filter(v => v !== value);
                if (e.target.checked) list.push(value);
                sel[key] = list;
            };
        }));
        const on = (id, fn) => { const node = byId(id); if (node) node.onclick = fn; };
        on('dd-packs-close', () => this.closePacksCard());
        on('dd-pk-export', () => { const name = byId('dd-pk-name'); this._packName = name ? name.value : 'My Pack'; this.exportPack(this._packName); });
        on('dd-pk-open', () => this.pickPackToImport());
        on('dd-pk-import', () => this.importPack());
        on('dd-pk-cancel', () => { this._incomingPack = null; this.refreshPacksCard(); });
        const conflict = byId('dd-pk-conflict');
        if (conflict) conflict.onchange = e => { if (this._incomingPack) this._incomingPack.conflict = e.target.value === 'replace' ? 'replace' : 'keep'; };
        return card;
    },

    refreshPacksCard() {
        if (typeof document !== 'undefined' && document.getElementById('dd-packs-card')) this.showPacksCard();
    },

    closePacksCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-packs-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    }
});
