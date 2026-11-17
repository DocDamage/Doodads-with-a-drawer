// @editor-only
Object.assign(DocsDoodads.Workspace, {
    setAssetCredits(items, credit) {
        const C = DocsDoodads.Credits, value = C.normalize(credit), data = DocsDoodads.AssetIndex.data, assets = data.assets;
        let count = 0;
        for (const asset of items || []) {
            if (!asset) continue;
            const key = asset.id || String(asset.path || '').toLowerCase();
            if (assets[key] === asset) {
                if (value) asset.credit = Object.assign({}, value); else delete asset.credit;
                if (data.fileCredits) delete data.fileCredits[key];
            } else if (asset.creditOnly && C.path(asset.path)) {
                const files = data.fileCredits = data.fileCredits || {};
                if (value) files[key] = Object.assign({}, value); else delete files[key];
            } else continue;
            count++;
        }
        if (count) DocsDoodads.AssetIndex.saveSoon();
        return count;
    },
    setFolderCredit(folder, credit) {
        const C = DocsDoodads.Credits, key = C.path(folder, true);
        if (!key) return false;
        const data = DocsDoodads.AssetIndex.data, folders = data.folderCredits = data.folderCredits || {};
        const value = C.normalize(credit);
        if (value) folders[key.toLowerCase()] = value; else delete folders[key.toLowerCase()];
        DocsDoodads.AssetIndex.saveSoon();
        return true;
    },
    async editArtCredit(items, forFolder = false) {
        const D = DocsDoodads, C = D.Credits, data = D.AssetIndex.data;
        items = (items || []).filter(Boolean);
        if (!items.length) return false;
        let folder = String(items[0].path || '').replace(/\\/g, '/').split('/').slice(0, -1).join('/');
        if (forFolder) {
            folder = await D.Ui.prompt('Which project folder should supply these credits?', folder, { title: 'Folder credit', ok: 'Continue', icon: 'folder' });
            if (!folder) return false;
            if (!C.path(folder, true)) { this.showToast('Choose a folder under img, audio, models, movies or effects.', 'warning'); return false; }
            folder = C.path(folder, true);
        }
        const current = (forFolder ? C.normalize((data.folderCredits || {})[folder.toLowerCase()]) : C.of(items[0].path, data)) || {};
        const custom = !C.licences.includes(current.licence), clear = 'Clear this record / inherit folder';
        const values = await D.Ui.form({ title: forFolder ? `Credit for ${folder}` : `Credit for ${items.length} file(s)`,
            text: 'Record the author and terms supplied with the art. Clear this record to inherit its folder. No licence permissions are inferred.', ok: 'Keep Credit', icon: 'info',
            fields: [
                { key: 'author', label: 'Author', value: current.author || '' },
                { key: 'preset', label: 'Licence', value: custom ? 'Other (use text below)' : current.licence, choices: C.licences.concat(['Other (use text below)', clear]) },
                { key: 'licence', label: 'Other licence / terms', value: custom ? current.licence || '' : '' },
                { key: 'source', label: 'Source / shop link', value: current.source || '' },
                { key: 'note', label: 'Note / supplied licence text', value: current.note || '', type: 'textarea' }
            ] });
        if (!values || D.AssetIndex.data !== data) return false;
        const credit = values.preset === clear ? null : { author: values.author, licence: values.preset === 'Other (use text below)' ? values.licence : values.preset, source: values.source, note: values.note };
        const changed = forFolder ? this.setFolderCredit(folder, credit) : this.setAssetCredits(items, credit);
        if (changed) { this.showToast('Kept the art credit.'); this.refreshInspector(); this.refreshDrawerCards(); }
        return changed;
    },
    renderAssetCredit(asset) {
        const credit = DocsDoodads.Credits.of(asset.path, DocsDoodads.AssetIndex.data);
        const label = credit ? [credit.author || 'Author not recorded', credit.licence || 'Licence not recorded'].join(' — ') : 'No credit recorded';
        return `<div style="margin-top: 10px; font-size: 11px;"><b>Credit</b><div>${escapeHtml(label)}</div><button type="button" class="dd-btn" id="dd-credit-file">Set Credit…</button> <button type="button" class="dd-btn" id="dd-credit-folder">Folder Credit…</button>${credit && credit.note ? `<details><summary>Supplied note</summary><pre style="white-space: pre-wrap; max-height: 180px; overflow-y: auto;">${escapeHtml(credit.note)}</pre></details>` : ''}</div>`;
    },
    bindAssetCredit(asset) {
        const file = document.getElementById('dd-credit-file'), folder = document.getElementById('dd-credit-folder');
        if (file) file.onclick = () => this.editArtCredit([asset]);
        if (folder) folder.onclick = () => this.editArtCredit([asset], true);
    },
    usedCreditEntries() {
        const D = DocsDoodads, index = this.refreshUsageIndex(), data = D.AssetIndex.data;
        const assets = Object.values(data.assets || {}).filter(Boolean), byPath = new Map();
        for (const asset of assets) if (D.Usage.isUsed(asset, index) || asset.normalFor && D.Usage.isUsed({ path: asset.normalFor }, index)) byPath.set(asset.path.toLowerCase(), asset);
        const database = {}, maps = {};
        const read = path => { try { return this.readUsageFile(path); } catch (error) { return null; } };
        for (const name of ['Actors', 'Armors', 'Weapons', 'States', 'Classes']) database[name] = window['$data' + name] || read(`data/${name}.json`) || [];
        for (const info of read('data/MapInfos.json') || window.$dataMapInfos || []) if (info) maps[info.id] = info.id === this.currentMapId() && window.$dataMap ? window.$dataMap : read(D.Persistence.mapFilePath(info.id));
        const manifest = D.NormalLight.manifestFromAssets(data.assets || {});
        const required = D.RequiredAssets.collect({ doodads: window.$dataDocsDoodads || {}, rooms: D.Rooms.ensureLoaded(), database, maps, normalManifest: manifest,
            characters: assets.filter(asset => /^img\/characters\//i.test(asset.path)).map(asset => asset.fileName) });
        for (const path of required) {
            if (!D.Credits.path(path) || byPath.has(path.toLowerCase())) continue;
            byPath.set(path.toLowerCase(), (data.assets || {})[path.toLowerCase()] || { id: path.toLowerCase(), path, fileName: path.split('/').pop(), creditOnly: true });
        }
        return [...byPath.values()].map(asset => ({ path: asset.path, credit: D.Credits.of(asset.path, data), asset })).sort((a, b) => a.path.localeCompare(b.path));
    },
    usedLpcCredits(rows) {
        const data = this.lpcCredits ? this.lpcCredits() : DocsDoodads.Lpc.emptyCredits();
        const used = new Set(rows.map(row => String(row.path).toLowerCase()));
        return Object.assign({}, data, { images: Object.fromEntries(Object.entries(data.images || {}).filter(([path]) => used.has(path.toLowerCase()))) });
    },
    creditProblems() {
        if (!DocsDoodads.Ui.prefs().checkArtCredits) return [];
        const rows = this.usedCreditEntries(), lpc = this.usedLpcCredits(rows);
        const lpcPaths = new Set(Object.entries(lpc.images).filter(([, record]) => record.files && record.files.length && record.files.every(file => !file.uncredited && file.authors && file.authors.length && file.licences && file.licences.length)).map(([path]) => path.toLowerCase()));
        return DocsDoodads.Credits.missing(rows).filter(row => !lpcPaths.has(row.path.toLowerCase())).map(row => ({ kind: 'artCredits', global: true,
            text: `${row.path}: author or licence not recorded.`, fix: { label: 'Set Credit', run: () => this.editArtCredit([row.asset]) } }));
    },
    async writeArtCredits() {
        const D = DocsDoodads, FS = D.FS, rows = this.usedCreditEntries(), lpc = this.usedLpcCredits(rows);
        const lpcPaths = new Set(Object.keys(lpc.images).map(path => path.toLowerCase()));
        let text = D.Credits.text(rows.filter(row => row.credit || !lpcPaths.has(row.path.toLowerCase())));
        if (lpcPaths.size) text += '\n' + D.Lpc.creditsTextFor(lpc, () => true);
        if (FS.existsSync('CREDITS.txt') && !(await D.Ui.confirm('Replace CREDITS.txt with the credits of art currently in use?', { title: 'Write Credits', ok: 'Replace' }))) return false;
        try {
            FS.atomicWriteFile('CREDITS.txt', text, 'utf8');
            this.showToast(`Wrote CREDITS.txt for ${rows.length} referenced art file(s).`, 'success');
            return text;
        } catch (error) { this.showToast('Could not write credits: ' + error.message, 'error'); return false; }
    },
    async offerCreditNotes(notes, targets) {
        const D = DocsDoodads, data = D.AssetIndex.data;
        for (const raw of (Array.isArray(notes) ? notes : []).slice(0, 20)) {
            if (!raw || typeof raw.note !== 'string' || !raw.note.trim()) continue;
            const note = Object.assign({}, raw, { name: String(raw.name || 'Supplied credit text').slice(0, 256), note: raw.note.slice(0, 65536) });
            const folders = [...new Set((targets(note) || []).map(file => String(file).replace(/\\/g, '/').split('/').slice(0, -1).join('/')).filter(folder => D.Credits.path(folder, true)))];
            if (!folders.length) continue;
            const keep = await D.Ui.confirm(`Keep ${note.name} as a credit note for ${folders.join(', ')}? No licence will be guessed.\n\n${String(note.note).slice(0, 400)}`, { title: 'Keep supplied credit text?', ok: 'Keep Note' });
            if (!keep || D.AssetIndex.data !== data) continue;
            for (const folder of folders) {
                const previous = D.Credits.normalize((data.folderCredits || {})[folder.toLowerCase()]) || {};
                const text = [previous.note || '', note.name + '\n' + note.note].filter(Boolean).join('\n\n');
                this.setFolderCredit(folder, Object.assign({}, previous, { note: text }));
            }
        }
    }
});
// Both picture and sound Details already bind this shared footer.
{
    const W = DocsDoodads.Workspace, render = W.renderUsagePanel, bind = W.bindUsagePanel;
    W.renderUsagePanel = function(asset) { return render.call(this, asset) + this.renderAssetCredit(asset); };
    W.bindUsagePanel = function(asset) { const result = bind.call(this, asset); this.bindAssetCredit(asset); return result; };
}
