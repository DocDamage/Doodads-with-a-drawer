//==========================================================
// SECTION 25v: MZ GENERATOR CHARACTERS (FOLDER, SCAN, DRAWING, EXPORT)
//==========================================================
// More > Characters, RPG Maker MZ part: the generator folder of the MZ installation (found from the playtest's
// own nw.exe, or chosen), a scan of its parts into the editor's cache, and Open the MZ Character Creator, the
// same window as the LPC and Memao creators (44_workspace_creator_kits.js). Export writes the walking, damaged
// and battler sheets and the face, which are MZ's own layouts (23_mzgen_export.js).
Object.assign(DocsDoodads.Workspace, {
    _mzgenIndex: undefined,

    // The chosen folder, or the generator folder beside the MZ that runs this playtest.
    mzgenLibraryFolder() {
        const v = DocsDoodads.Ui.prefs().mzgenLibrary;
        if (typeof v === 'string' && v) return v;
        return this.mzgenDetectFolder();
    },

    // The generator folder of the MZ running this playtest: beside a folder on the way up from its nw.exe
    // (nwjs-win/nw.exe on Windows; deep inside RPG Maker MZ.app on macOS), at most six folders up.
    mzgenDetectFolder(exe = typeof process !== 'undefined' && process.execPath ? process.execPath : '') {
        const FS = DocsDoodads.FS;
        try {
            if (!exe || !FS.path || !FS.fs) return '';
            let dir = FS.path.dirname(exe);
            for (let up = 0; up <= 6; up++) {
                const folder = FS.path.join(dir, 'generator');
                if (DocsDoodads.MzGen.isLibrary(FS.fs, FS.path, folder)) return FS.path.resolve(folder);
                const parent = FS.path.dirname(dir);
                if (parent === dir) break;
                dir = parent;
            }
            return '';
        } catch (e) {
            return '';
        }
    },

    setMzGenLibraryFolder(folder) {
        const clean = String(folder || '').trim();
        DocsDoodads.Ui.setPref('mzgenLibrary', clean || undefined);
        return clean;
    },

    mzgenIndex() {
        if (this._mzgenIndex === undefined) {
            const D = DocsDoodads;
            let data = null;
            try { data = D.FS.existsSync(D.MzGen.indexFile) ? D.FS.readJson(D.MzGen.indexFile) : null; } catch (e) { data = null; }
            this._mzgenIndex = D.MzGen.validIndex(data);
        }
        return this._mzgenIndex;
    },

    scanMzGenLibrary(folder = this.mzgenLibraryFolder()) {
        const D = DocsDoodads, M = D.MzGen, FS = D.FS;
        if (!FS.fs || !FS.path) return null;
        if (!folder) { this.showToast("Choose RPG Maker MZ's generator folder first (RPG Maker MZ/generator).", 'info'); return null; }
        if (!M.isLibrary(FS.fs, FS.path, folder)) {
            this.showToast("That folder has no TV folder and grad_common.png. Choose the generator folder inside RPG Maker MZ's installation.", 'error');
            return null;
        }
        const zlib = typeof require !== 'undefined' ? require('zlib') : null;
        const index = M.scan(FS.fs, FS.path, FS.path.resolve(folder), data => zlib.inflateSync(data));
        if (!index) return null;
        if (!FS.atomicWriteJson(M.indexFile, index, 0)) { this.showToast('Could not save the generator index.', 'error'); return null; }
        this._mzgenIndex = index;
        this.resetCreatorImageCaches('mz');
        const s = M.summary(index);
        this.showToast(`Found ${s.parts} generator parts (${s.bases.join(', ')}).`, 'success');
        return index;
    },

    mzgenIndexMissing(index = this.mzgenIndex()) {
        const D = DocsDoodads, FS = D.FS;
        return Boolean(index && FS.fs && !D.MzGen.isLibrary(FS.fs, FS.path, index.library));
    },

    // ---- Drawing ----

    mzgenSheetPath(file, index = this.mzgenIndex()) {
        const FS = DocsDoodads.FS;
        return index && FS.path ? FS.path.join(index.library, file) : '';
    },

    mzgenLoadImage(file) {
        return this.creatorRawImage('mz', file, () => {
            const FS = DocsDoodads.FS;
            try {
                const zlib = typeof require !== 'undefined' ? require('zlib') : null;
                if (!zlib || !FS.fs) return null;
                return DocsDoodads.LpcCompose.decodePng(FS.fs.readFileSync(this.mzgenSheetPath(file)), data => zlib.inflateSync(data));
            } catch (e) {
                return null;
            }
        });
    },

    mzgenCache() {
        return this.creatorImageCaches('mz').layers;
    },

    // recipe -> { sheet, view, warnings, used } for one animation (walk, damage, face, sv_swing...), or null.
    composeMzGen(recipe, animation = 'walk') {
        const D = DocsDoodads, FS = D.FS;
        const index = this.mzgenIndex();
        if (!index || !FS.fs) return null;
        const resolved = D.MzGenCompose.resolve(index, recipe, animation, file => FS.existsSync(this.mzgenSheetPath(file, index)));
        const out = D.MzGenCompose.compose(resolved, index, file => this.mzgenLoadImage(file), this.mzgenCache());
        return { sheet: out.sheet, view: out.view, warnings: out.warnings, used: resolved.used };
    },

    openMzGenCreator(state) {
        return this.openCreator(state, 'mz');
    },

    // ---- Export ----

    mzgenExportDefaults() {
        return { classic: true, damage: true, battler: true, face: true, faceSlot: 0, actions: [] };
    },

    mzgenExportFiles(name, options) {
        const N = DocsDoodads.MzGenExport.names(name);
        const files = [];
        if (options.classic) files.push('img/characters/' + N.classic + '.png');
        if (options.damage) files.push('img/characters/' + N.damage + '.png');
        if (options.face) files.push('img/faces/' + N.face + '.png');
        if (options.battler) files.push('img/sv_actors/' + N.face + '.png');
        return files;
    },

    exportMzGenCharacter(state, options) {
        const D = DocsDoodads, E = D.MzGenExport, S = D.MzGenSlots, FS = D.FS;
        if (!FS.fs || !FS.writable()) { this.showToast('Characters are exported in a playtest.', 'info'); return null; }
        const name = E.cleanName(options.name);
        if (!name) { this.showToast('Give the character a name first.', 'info'); return null; }
        const N = E.names(name);
        const recipe = S.toRecipe(state);
        const warnings = [];
        const viewOf = anim => {
            const out = this.composeMzGen(recipe, anim);
            if (out) warnings.push(...out.warnings.filter(w => !warnings.includes(w)));
            return out && out.view;
        };
        const walk = viewOf('walk');
        if (!walk) { this.showToast('Nothing to export: the character has no walking parts.', 'error'); return null; }
        const written = [];
        const write = (file, image) => { this.writeLpcPng(file, image); written.push(file); };
        try {
            if (options.classic) write('img/characters/' + N.classic + '.png', walk);
            if (options.damage) {
                const damage = viewOf('damage');
                if (damage) write('img/characters/' + N.damage + '.png', damage);
                else warnings.push('No damaged sheet: the parts have no damaged pictures.');
            }
            if (options.battler) {
                const sv = viewOf('sv_wait');
                if (sv) write('img/sv_actors/' + N.face + '.png', sv);
                else warnings.push('No battler: the parts have no battler pictures.');
            }
            if (options.face) {
                const face = viewOf('face');
                const file = 'img/faces/' + N.face + '.png';
                if (face) write(file, E.faceSheet(this.readLpcPng(file), face, options.faceSlot || 0));
                else warnings.push('No face: the parts have no face pictures.');
            }
        } catch (e) {
            this.showToast('Could not write the sheets: ' + (e.message || e), 'error');
            return null;
        }
        FS.atomicWriteJson(S.charactersFile, S.save(this.readCreatorSaved(S), name, state));
        this.showToast(`Exported ${name}: ${written.length} picture${written.length === 1 ? '' : 's'}.`, 'success');
        return { files: written, warnings: [...new Set(warnings)], names: N, parts: [] };
    },

    // ---- On the Characters card ----

    mzgenCardHtml() {
        const D = DocsDoodads, U = D.Ui, M = D.MzGen;
        const folder = this.mzgenLibraryFolder();
        const index = this.mzgenIndex();
        const s = index ? M.summary(index) : null;
        const missing = index ? this.mzgenIndexMissing(index) : false;
        const day = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(); };
        return `
            <div class="dd-lpc-row">
                <input type="text" id="dd-mzgen-folder" value="${escapeHtml(folder)}" placeholder="RPG Maker MZ/generator" aria-label="MZ generator folder" />
                <button class="dd-btn" id="dd-mzgen-choose" type="button" title="Pick the folder">${U.icon('folder', 1)} Choose...</button>
            </div>
            <div class="dd-lpc-row">
                <button class="dd-btn dd-btn-primary" id="dd-mzgen-scan" type="button" title="Read the generator's parts">${index ? 'Scan Again' : 'Scan the Parts'}</button>
                ${index && !missing ? `<button class="dd-btn dd-btn-good" id="dd-mzgen-creator" type="button" title="Make a character from MZ's generator parts">${U.icon('person', 1)} Open the MZ Creator</button>` : ''}
            </div>
            ${s ? `<div class="dd-lpc-box" id="dd-mzgen-status"><b>${s.parts} parts</b> · ${escapeHtml(s.bases.join(', '))} · scanned ${escapeHtml(day(s.built))}${s.warnings.length ? `<br><span style="color: var(--dd-warn);">${s.warnings.map(w => escapeHtml(w)).join('<br>')}</span>` : ''}</div>` : '<div class="dd-lpc-box" id="dd-mzgen-status">Not scanned yet.</div>'}
            ${missing ? `<div class="dd-lpc-warn" id="dd-mzgen-missing">The generator isn't at ${escapeHtml(index.library)} any more. Choose where it is now.</div>` : ''}
            <div class="dd-lpc-note">The parts that come with RPG Maker MZ (the editor's own Character Generator), read where they are and never copied into the project. Characters made from them may be used in games made with RPG Maker MZ.</div>`;
    },

    bindMzGenCard() {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        const field = document.getElementById('dd-mzgen-folder');
        if (field) field.onchange = e => { this.setMzGenLibraryFolder(e.target.value); this.refreshLpcCard(); };
        on('dd-mzgen-choose', () => {
            if (typeof document === 'undefined') return;
            const input = document.createElement('input');
            input.type = 'file';
            if (typeof input.setAttribute === 'function') input.setAttribute('nwdirectory', '');
            input.onchange = () => { const chosen = input.value || (input.files && input.files[0] && input.files[0].path) || ''; if (chosen) { this.setMzGenLibraryFolder(chosen); this.refreshLpcCard(); } };
            if (typeof input.click === 'function') input.click();
        });
        on('dd-mzgen-scan', () => {
            const typed = field ? field.value : this.mzgenLibraryFolder();
            if (typed && typed !== this.mzgenLibraryFolder()) this.setMzGenLibraryFolder(typed);
            const button = document.getElementById('dd-mzgen-scan');
            if (button) { button.disabled = true; button.textContent = 'Scanning...'; }
            return new Promise(resolve => setTimeout(() => {
                this.scanMzGenLibrary(this.mzgenLibraryFolder());
                this.refreshLpcCard();
                resolve();
            }, 30));
        });
        on('dd-mzgen-creator', () => this.openMzGenCreator());
    }
});
