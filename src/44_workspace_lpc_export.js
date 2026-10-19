//==========================================================
// SECTION 25t: LPC EXPORTS (WRITING THE SHEETS)
//==========================================================
// The creator's Export to RPG Maker: writes the character's sheets into img/characters (and its face into
// img/faces), records the credits of every file and writes CREDITS_LPC.txt again, adds the animation set
// that plays the idle and run sheets with the smooth walker, and keeps the character under its name so it
// can be changed and exported again. Also, when ticked: action sheets for Play Character Action
// ($Name_slash[f6]...) and a side-view battler (img/sv_actors/Name.png). Layouts are in 23_lpc_export.js.
Object.assign(DocsDoodads.Workspace, {
    // What to make. options: { name, classic, smooth (with idle and run), face, faceSlot, battler, actions: [anim] }
    lpcExportDefaults() {
        return { classic: true, smooth: true, face: true, faceSlot: 0, battler: true, actions: ['slash', 'thrust', 'spellcast', 'shoot', 'hurt'] };
    },

    // The files an export would write, relative to the project.
    lpcExportFiles(name, options) {
        const N = DocsDoodads.LpcExport.names(name);
        const files = [];
        if (options.classic) files.push('img/characters/' + N.classic + '.png');
        if (options.smooth) files.push('img/characters/' + N.smooth + '.png', 'img/characters/' + N.idle + '.png', 'img/characters/' + N.run + '.png');
        if (options.face) files.push('img/faces/' + N.face + '.png');
        if (options.battler) files.push('img/sv_actors/' + N.face + '.png');
        for (const anim of options.actions || []) files.push('img/characters/' + DocsDoodads.LpcExport.actionName(name, anim) + '.png');
        return files;
    },

    writeLpcPng(file, image) {
        const D = DocsDoodads, FS = D.FS;
        const zlib = require('zlib');
        FS.mkdirp(FS.path.dirname(file));
        FS.fs.writeFileSync(file, D.AsepriteSheets.encodePng(image.width, image.height, new Uint8Array(image.data.buffer, image.data.byteOffset, image.data.length), data => zlib.deflateSync(data)));
        // A playtest that already drew the old picture would keep showing it.
        if (typeof ImageManager !== 'undefined' && ImageManager._cache) {
            for (const key of Object.keys(ImageManager._cache)) if (key.endsWith(file) || key.endsWith(encodeURI(file))) delete ImageManager._cache[key];
        }
    },

    readLpcPng(file) {
        const FS = DocsDoodads.FS;
        try { return FS.existsSync(file) ? DocsDoodads.LpcCompose.decodePng(FS.fs.readFileSync(file), d => require('zlib').inflateSync(d)) : null; } catch (e) { return null; }
    },

    // Writes everything; returns { files, warnings } or null (with a message) when it can't.
    exportLpcCharacter(state, options) {
        const D = DocsDoodads, E = D.LpcExport, S = D.LpcSlots, FS = D.FS;
        if (!FS.fs || !FS.writable()) { this.showToast('Characters are exported in a playtest.', 'info'); return null; }
        const name = E.cleanName(options.name);
        if (!name) { this.showToast('Give the character a name first.', 'info'); return null; }
        const N = E.names(name);
        const recipe = S.toRecipe(state, { addons: options.addons !== false });
        const walk = this.composeLpc(recipe, 'walk');
        if (!walk || !walk.sheet) { this.showToast('Nothing to export: the character has no walk.', 'error'); return null; }
        const written = [];
        const warnings = walk.warnings.slice();
        const record = (file, used) => { written.push(file); this.recordLpcImage(file, used); };
        try {
            if (options.classic) {
                const file = 'img/characters/' + N.classic + '.png';
                this.writeLpcPng(file, E.classic(walk.sheet));
                record(file, walk.used);
            }
            if (options.smooth) {
                const file = 'img/characters/' + N.smooth + '.png';
                this.writeLpcPng(file, E.allFrames(walk.sheet));
                record(file, walk.used);
                for (const [anim, sheetName] of [['idle', N.idle], ['run', N.run]]) {
                    const out = this.composeLpc(recipe, anim);
                    if (!out || !out.sheet) { warnings.push(`No ${anim} sheet: the parts have no ${anim}.`); continue; }
                    const f = 'img/characters/' + sheetName + '.png';
                    this.writeLpcPng(f, E.allFrames(out.sheet));
                    record(f, out.used);
                    warnings.push(...out.warnings.filter(w => !warnings.includes(w)));
                }
                this.addLpcAnimationSet(N);
            }
            for (const anim of options.actions || []) {
                const out = this.composeLpc(recipe, anim);
                if (!out || !out.sheet) { warnings.push(`No ${anim} action: the parts have no ${anim}.`); continue; }
                const f = 'img/characters/' + E.actionName(name, anim) + '.png';
                this.writeLpcPng(f, E.actionSheet(out.sheet, anim));
                record(f, out.used);
                warnings.push(...out.warnings.filter(w => !warnings.includes(w)));
            }
            if (options.battler) {
                const sheets = {}, used = [];
                for (const anim of E.svAnimations()) {
                    const out = this.composeLpc(recipe, anim);
                    sheets[anim] = out && out.sheet;
                    if (out) used.push(...out.used);
                }
                const sv = E.svSheet(sheets);
                const f = 'img/sv_actors/' + N.face + '.png';
                this.writeLpcPng(f, sv.sheet);
                record(f, used);
                if (sv.fellBack.length) warnings.push(`The battler's ${sv.fellBack.join(', ')} use${sv.fellBack.length === 1 ? 's' : ''} another animation (the parts have none of their own).`);
            }
            if (options.face) {
                // The face leaves out what is held or carried.
                const faceState = { body: state.body, slots: Object.assign({}, state.slots) };
                for (const key of ['weapon', 'shield', 'back', 'ammo']) delete faceState.slots[key];
                const faceWalk = this.composeLpc(S.toRecipe(faceState, { addons: options.addons !== false }), 'walk');
                const file = 'img/faces/' + N.face + '.png';
                this.writeLpcPng(file, E.faceSheet(this.readLpcPng(file), E.face(faceWalk.sheet), options.faceSlot || 0));
                record(file, faceWalk.used);
            }
        } catch (e) {
            this.showToast('Could not write the sheets: ' + (e.message || e), 'error');
            return null;
        }
        // Credits ship with the game; the character is kept to change and export again.
        if (written.length) this.writeLpcCreditsText();
        FS.atomicWriteJson(S.charactersFile, S.save(this.readCreatorSaved(), name, state));
        const unsafe = D.Lpc.unsafeImages(this.lpcCredits(), f => written.includes(f)).length;
        this.showToast(`Exported ${name}: ${written.length} picture${written.length === 1 ? '' : 's'}` + (unsafe ? `; ${unsafe} can't be encrypted` : '') + '.', unsafe ? 'info' : 'success');
        return { files: written, warnings, names: N };
    },

    // The animation set for the smooth walker (replacing one for the same sheet).
    addLpcAnimationSet(N) {
        const set = DocsDoodads.LpcExport.animationSet(N);
        const sets = (DocsDoodads.World.get('characterAnim.sets') || []).filter(s => s && s.character !== set.character);
        sets.push(set);
        this.setWorldSetting('characterAnim.sets', sets);
        return set;
    },

    // Try the character on the player (this playtest only; MZ's database is not changed).
    tryLpcOnPlayer(N, smooth = true) {
        if (typeof $gamePlayer === 'undefined' || !$gamePlayer) return false;
        $gamePlayer.setImage(smooth ? N.smooth : N.classic, 0);
        return true;
    }
});
