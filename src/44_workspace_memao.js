//==========================================================
// SECTION 25u: MEMAO CHARACTERS (FOLDER, SCAN, DRAWING, EXPORT)
//==========================================================
// More > Characters, Memao part: where the Memao Sprite Sheet Creator's asset pack was unpacked on this
// computer (kept per computer, and outside the project: its licence forbids sharing the pack, and MZ's
// Deployment copies the project folder), a scan into the editor's cache, and Open the Memao Creator, the
// LPC creator's window with Memao's parts (44_workspace_creator_kits.js). Export writes the character's MZ
// sheets (23_memao_export.js) into img/characters, img/sv_actors and img/faces, which the licence allows as
// part of a game.
Object.assign(DocsDoodads.Workspace, {
    _memaoIndex: undefined,

    memaoLibraryFolder() {
        const v = DocsDoodads.Ui.prefs().memaoLibrary;
        return typeof v === 'string' ? v : '';
    },

    setMemaoLibraryFolder(folder) {
        const clean = String(folder || '').trim();
        DocsDoodads.Ui.setPref('memaoLibrary', clean || undefined);
        return clean;
    },

    memaoIndex() {
        if (this._memaoIndex === undefined) {
            const D = DocsDoodads;
            let data = null;
            try { data = D.FS.existsSync(D.Memao.indexFile) ? D.FS.readJson(D.Memao.indexFile) : null; } catch (e) { data = null; }
            this._memaoIndex = D.Memao.validIndex(data);
        }
        return this._memaoIndex;
    },

    scanMemaoLibrary(folder = this.memaoLibraryFolder()) {
        const D = DocsDoodads, M = D.Memao, FS = D.FS;
        if (!FS.fs || !FS.path) return null;
        if (!folder) { this.showToast('Choose the Memao asset folder first.', 'info'); return null; }
        if (!M.isLibrary(FS.fs, FS.path, folder)) {
            this.showToast(`That folder has no Main folder and ${M.zFile}. Choose the unpacked memao-assets folder.`, 'error');
            return null;
        }
        const index = M.scan(FS.fs, FS.path, FS.path.resolve(folder));
        if (!index) return null;
        if (!FS.atomicWriteJson(M.indexFile, index, 0)) { this.showToast('Could not save the Memao index.', 'error'); return null; }
        this._memaoIndex = index;
        this.resetCreatorImageCaches('memao');
        const s = M.summary(index);
        this.showToast(`Found ${s.parts} Memao parts in ${s.sets.length} set${s.sets.length === 1 ? '' : 's'}` + (s.warnings.length ? ` (${s.warnings.length} note${s.warnings.length === 1 ? '' : 's'})` : '') + '.', 'success');
        return index;
    },

    // The pack isn't where the scan found it.
    memaoIndexMissing(index = this.memaoIndex()) {
        const D = DocsDoodads, FS = D.FS;
        return Boolean(index && FS.fs && !D.Memao.isLibrary(FS.fs, FS.path, index.library));
    },

    // ---- Drawing ----

    memaoSheetPath(file, index = this.memaoIndex()) {
        const FS = DocsDoodads.FS;
        return index && FS.path ? FS.path.join(index.library, file) : '';
    },

    memaoLoadImage(file) {
        return this.creatorRawImage('memao', file, () => {
            const FS = DocsDoodads.FS;
            try {
                const zlib = typeof require !== 'undefined' ? require('zlib') : null;
                if (!zlib || !FS.fs) return null;
                return DocsDoodads.LpcCompose.decodePng(FS.fs.readFileSync(this.memaoSheetPath(file)), data => zlib.inflateSync(data));
            } catch (e) {
                return null;
            }
        });
    },

    memaoCache() {
        return this.creatorImageCaches('memao').layers;
    },

    // recipe -> { sheet, warnings, used } for one animation, or null without an index.
    composeMemao(recipe, animation = 'walk') {
        const D = DocsDoodads, FS = D.FS;
        const index = this.memaoIndex();
        if (!index || !FS.fs) return null;
        const resolved = D.MemaoCompose.resolve(index, recipe, animation, file => FS.existsSync(this.memaoSheetPath(file, index)));
        const out = D.MemaoCompose.compose(resolved, file => this.memaoLoadImage(file), this.memaoCache());
        return { sheet: out.sheet, warnings: out.warnings, used: resolved.used };
    },

    openMemaoCreator(state) {
        return this.openCreator(state, 'memao');
    },

    // ---- Export ----

    memaoExportDefaults() {
        return { classic: true, smooth: true, face: true, faceSlot: 0, battler: true, actions: ['slash', 'hurt', 'wave', 'pickup'] };
    },

    memaoExportFiles(name, options) {
        const E = DocsDoodads.MemaoExport;
        const N = E.names(name);
        const files = [];
        if (options.classic) files.push('img/characters/' + N.classic + '.png');
        if (options.smooth) files.push('img/characters/' + N.smooth + '.png', 'img/characters/' + N.idle + '.png', 'img/characters/' + N.run + '.png');
        if (options.face) files.push('img/faces/' + N.face + '.png');
        if (options.battler) files.push('img/sv_actors/' + N.face + '.png');
        for (const anim of options.actions || []) files.push('img/characters/' + E.actionName(name, anim) + '.png');
        return files;
    },

    // Writes the ticked sheets; returns { files, warnings, names } or null (with a message) when it can't.
    exportMemaoCharacter(state, options) {
        const D = DocsDoodads, E = D.MemaoExport, S = D.MemaoSlots, FS = D.FS;
        if (!FS.fs || !FS.writable()) { this.showToast('Characters are exported in a playtest.', 'info'); return null; }
        const name = E.cleanName(options.name);
        if (!name) { this.showToast('Give the character a name first.', 'info'); return null; }
        const N = E.names(name);
        const recipe = S.toRecipe(state);
        const warnings = [];
        const sheets = {};
        const sheetOf = anim => {
            if (!(anim in sheets)) { const out = this.composeMemao(recipe, anim); sheets[anim] = out && out.sheet; if (out) warnings.push(...out.warnings.filter(w => !warnings.includes(w))); }
            return sheets[anim];
        };
        const walk = sheetOf('walk'), idle = sheetOf('idle');
        if (!walk) { this.showToast('Nothing to export: the character has no walk.', 'error'); return null; }
        const written = [];
        const write = (file, image) => { this.writeLpcPng(file, image); written.push(file); };
        try {
            if (options.classic) write('img/characters/' + N.classic + '.png', E.classic(walk, idle));
            if (options.smooth) {
                write('img/characters/' + N.smooth + '.png', E.smooth(walk, idle));
                if (idle) write('img/characters/' + N.idle + '.png', E.allFrames(idle));
                const run = sheetOf('run');
                if (run) write('img/characters/' + N.run + '.png', E.allFrames(run));
                const set = E.animationSet(N);
                const sets = (D.World.get('characterAnim.sets') || []).filter(s => s && s.character !== set.character);
                sets.push(set);
                this.setWorldSetting('characterAnim.sets', sets);
            }
            for (const anim of options.actions || []) {
                const sheet = sheetOf(anim);
                if (!sheet) { warnings.push(`No ${anim} action: the pack has no ${anim}.`); continue; }
                write('img/characters/' + E.actionName(name, anim) + '.png', E.actionSheet(sheet, anim));
            }
            if (options.battler) {
                const all = {};
                for (const anim of E.svAnimations()) all[anim] = sheetOf(anim);
                const sv = E.svSheet(all);
                write('img/sv_actors/' + N.face + '.png', sv.sheet);
                if (sv.fellBack.length) warnings.push(`The battler's ${sv.fellBack.join(', ')} use${sv.fellBack.length === 1 ? 's' : ''} another animation (the pack has none of their own).`);
            }
            if (options.face) {
                // The face leaves out what is held.
                const faceState = { body: state.body, slots: Object.assign({}, state.slots) };
                for (const slot of S.allSlots().filter(s => s.tab === 'tools')) delete faceState.slots[slot.key];
                const faceIdle = this.composeMemao(S.toRecipe(faceState), 'idle');
                const file = 'img/faces/' + N.face + '.png';
                write(file, E.faceSheet(this.readLpcPng(file), E.face(faceIdle && faceIdle.sheet), options.faceSlot || 0));
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

    memaoCardHtml() {
        const D = DocsDoodads, U = D.Ui, M = D.Memao, FS = D.FS;
        const folder = this.memaoLibraryFolder();
        const index = this.memaoIndex();
        const s = index ? M.summary(index) : null;
        const inside = folder && FS.path ? M.insideProject(FS.path, folder, '.') : false;
        const missing = index ? this.memaoIndexMissing(index) : false;
        const day = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(); };
        return `
            <div class="dd-lpc-group" style="margin-top: 10px; font-size: 12px;">Memao Sprite Sheet Creator assets</div>
            <div class="dd-lpc-row">
                <input type="text" id="dd-memao-folder" value="${escapeHtml(folder)}" placeholder="The unpacked memao-assets folder" aria-label="Memao asset folder" />
                <button class="dd-btn" id="dd-memao-choose" type="button" title="Pick the folder">${U.icon('folder', 1)} Choose...</button>
            </div>
            ${inside ? `<div class="dd-lpc-warn" id="dd-memao-inside"><b>This folder is inside the project.</b> MZ's Deployment would copy the whole asset pack into the game, and its licence forbids sharing the pack. Keep it somewhere else.</div>` : ''}
            <div class="dd-lpc-row">
                <button class="dd-btn dd-btn-primary" id="dd-memao-scan" type="button" title="Read the pack's parts and names">${index ? 'Scan Again' : 'Scan the Assets'}</button>
                ${index && !missing ? `<button class="dd-btn dd-btn-good" id="dd-memao-creator" type="button" title="Make a character from the Memao assets">${U.icon('person', 1)} Open the Memao Creator</button>` : ''}
            </div>
            ${s ? `<div class="dd-lpc-box" id="dd-memao-status"><b>${s.parts} parts</b> · ${escapeHtml(s.sets.join(', '))} · scanned ${escapeHtml(day(s.built))}${s.warnings.length ? `<br><span style="color: var(--dd-warn);">${s.warnings.map(w => escapeHtml(w)).join('<br>')}</span>` : ''}</div>` : '<div class="dd-lpc-box" id="dd-memao-status">Not scanned yet.</div>'}
            ${missing ? `<div class="dd-lpc-warn" id="dd-memao-missing">The assets aren't at ${escapeHtml(index.library)} any more. Choose where they are now.</div>` : ''}
            <div class="dd-lpc-note">The pack is read where it is and never copied into the project: its licence lets the sheets you make go into your games, but not the pack, or the sheets on their own. Credit to "Memao" is appreciated.</div>`;
    },

    bindMemaoCard() {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        const field = document.getElementById('dd-memao-folder');
        if (field) field.onchange = e => { this.setMemaoLibraryFolder(e.target.value); this.refreshLpcCard(); };
        on('dd-memao-choose', () => this.pickMemaoLibraryFolder());
        on('dd-memao-scan', () => {
            const typed = field ? field.value : this.memaoLibraryFolder();
            if (typed !== this.memaoLibraryFolder()) this.setMemaoLibraryFolder(typed);
            const button = document.getElementById('dd-memao-scan');
            if (button) { button.disabled = true; button.textContent = 'Scanning...'; }
            return new Promise(resolve => setTimeout(() => {
                this.scanMemaoLibrary(this.memaoLibraryFolder());
                this.refreshLpcCard();
                resolve();
            }, 30));
        });
        on('dd-memao-creator', () => this.openMemaoCreator());
    },

    pickMemaoLibraryFolder() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        if (typeof input.setAttribute === 'function') input.setAttribute('nwdirectory', '');
        input.onchange = () => {
            const chosen = input.value || (input.files && input.files[0] && input.files[0].path) || '';
            if (!chosen) return;
            this.setMemaoLibraryFolder(chosen);
            this.refreshLpcCard();
        };
        if (typeof input.click === 'function') input.click();
        return true;
    }
});
