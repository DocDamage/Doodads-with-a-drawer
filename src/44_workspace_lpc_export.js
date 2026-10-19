//==========================================================
// SECTION 25t: LPC EXPORTS (WRITING THE SHEETS)
//==========================================================
// The creator's Export to RPG Maker: writes the character's sheets into img/characters (and its face into
// img/faces), records the credits of every file and writes CREDITS_LPC.txt again, adds the animation set
// that plays the idle and run sheets with the smooth walker, and keeps the character under its name so it
// can be changed and exported again. Also, when ticked: action sheets for Play Character Action
// ($Name_slash[f6]...) and a side-view battler (img/sv_actors/Name.png). Layouts are in 23_lpc_export.js.
// Sheets drawn with oversize weapon art have bigger frames; the result lists them (oversize), and action
// sheets whose frames reach below the feet are noted in characterAnim.feet so the plugin stands them on their
// feet without changing their names.
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
        // With the outfit as Visual Equipment parts, the character's own sheets are the body and face only;
        // what it wears comes from its equipment.
        const own = options.parts ? { body: state.body, slots: Object.fromEntries(Object.entries(state.slots).filter(([k]) => S.slot(k) && S.slot(k).card === 'body')) } : state;
        const recipe = S.toRecipe(own, { addons: options.addons !== false });
        const walk = this.composeLpc(recipe, 'walk');
        if (!walk || !walk.sheet) { this.showToast('Nothing to export: the character has no walk.', 'error'); return null; }
        const written = [];
        const warnings = walk.warnings.slice();
        const record = (file, used) => { written.push(file); this.recordLpcImage(file, used); };
        // The sheets with bigger frames: [{ file, w, h, below }] (the size of one frame, and how far it reaches
        // below the feet).
        const oversize = [];
        const big = (file, sheet, full) => {
            const F = E.frameOf(sheet);
            if (F > E.frame) oversize.push(Object.assign({ file }, E.cellOf(F, full)));
        };
        // Action sheets reaching below the feet (and ones that no longer do).
        let feet = D.World.get('characterAnim.feet') || {};
        const action = (file, sheet) => {
            feet = E.feetWith(feet, file.replace(/^.*\//, '').replace(/\.png$/i, ''), E.actionBelow(sheet));
            big(file, sheet, true);
        };
        const battler = (file, sv) => {
            if (sv.oversize.length) oversize.push({ file, w: sv.cell.w, h: sv.cell.h, below: 0, motions: sv.oversize });
        };
        let parts = [];
        try {
            if (options.classic) {
                const file = 'img/characters/' + N.classic + '.png';
                this.writeLpcPng(file, E.classic(walk.sheet));
                record(file, walk.used);
                big(file, walk.sheet);
            }
            if (options.smooth) {
                const file = 'img/characters/' + N.smooth + '.png';
                this.writeLpcPng(file, E.allFrames(walk.sheet));
                record(file, walk.used);
                big(file, walk.sheet);
                for (const [anim, sheetName] of [['idle', N.idle], ['run', N.run]]) {
                    const out = this.composeLpc(recipe, anim);
                    if (!out || !out.sheet) { warnings.push(`No ${anim} sheet: the parts have no ${anim}.`); continue; }
                    const f = 'img/characters/' + sheetName + '.png';
                    this.writeLpcPng(f, E.allFrames(out.sheet));
                    record(f, out.used);
                    big(f, out.sheet);
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
                action(f, out.sheet);
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
                battler(f, sv);
                if (sv.fellBack.length) warnings.push(`The battler's ${sv.fellBack.join(', ')} use${sv.fellBack.length === 1 ? 's' : ''} another animation (the parts have none of their own).`);
            }
            if (options.face) {
                // The face leaves out what is held or carried.
                const faceState = { body: state.body, slots: Object.assign({}, state.slots) };
                for (const key of ['weapon', 'shield', 'back', 'ammo']) delete faceState.slots[key];
                const faceWalk = this.composeLpc(S.toRecipe(faceState, { addons: options.addons !== false }), 'walk', null, { oversize: false });
                const file = 'img/faces/' + N.face + '.png';
                this.writeLpcPng(file, E.faceSheet(this.readLpcPng(file), E.face(faceWalk.sheet), options.faceSlot || 0));
                record(file, faceWalk.used);
            }
            if (options.parts) parts = this.exportLpcParts(state, options, record, warnings, { big, action, battler });
        } catch (e) {
            this.showToast('Could not write the sheets: ' + (e.message || e), 'error');
            return null;
        }
        if (JSON.stringify(feet) !== JSON.stringify(D.World.get('characterAnim.feet') || {})) this.setWorldSetting('characterAnim.feet', feet);
        // Credits ship with the game; the character is kept to change and export again.
        if (written.length) this.writeLpcCreditsText();
        FS.atomicWriteJson(S.charactersFile, S.save(this.readCreatorSaved(), name, state));
        const unsafe = D.Lpc.unsafeImages(this.lpcCredits(), f => written.includes(f)).length;
        this.showToast(`Exported ${name}: ${written.length} picture${written.length === 1 ? '' : 's'}` + (unsafe ? `; ${unsafe} can't be encrypted` : '') + '.', unsafe ? 'info' : 'success');
        return { files: written, warnings: [...new Set(warnings)], names: N, parts, oversize };
    },

    // Each outfit piece as Visual Equipment part sheets, in the same layouts the character uses (so the
    // pieces follow its walk, idle, run, actions and battler), with the notetag that puts it on an item.
    // Layers below the body (a quiver, a cape's back) are a second piece in the same part slot. Oversize
    // weapon art gives a piece bigger frames standing on the same feet (Visual Equipment draws each layer at
    // its own frame size); a return swing is played to follow the body's own slash. note: { big, action,
    // battler } to list sheets with bigger frames.
    exportLpcParts(state, options, record, warnings, note = {}) {
        const D = DocsDoodads, E = D.LpcExport, S = D.LpcSlots;
        const index = this.lpcIndex();
        const out = [];
        for (const slot of S.allSlots().filter(s => s.card === 'outfit')) {
            const pick = state.slots[slot.key];
            const part = pick && index.parts.find(p => p.id === pick.id);
            if (!part) continue;
            const colours = [pick.colour || ''].concat(pick.colour2 ? [pick.colour2] : []);
            const recipe = { body: state.body, picks: [{ id: pick.id, colours, variant: pick.colour || undefined }] };
            const pieces = [], files = [];
            const write = (file, image, used, sheet, kind) => {
                this.writeLpcPng(file, image);
                record(file, used);
                files.push(file);
                if (kind === 'action' && note.action) note.action(file, sheet);
                else if (kind && note.big) note.big(file, sheet);
            };
            for (const behind of [false, true]) {
                const keep = l => (behind ? l.z < E.bodyZ : l.z >= E.bodyZ);
                const walk = this.composeLpc(recipe, 'walk', keep);
                if (!walk || !walk.sheet || !walk.used.length) continue;
                const base = E.partBase(slot.label, part.name, pick.colour, state.body, behind);
                const N = E.names(base);
                if (options.classic) write('img/characters/' + N.classic + '.png', E.classic(walk.sheet), walk.used, walk.sheet, 'sheet');
                if (options.smooth) {
                    write('img/characters/' + N.smooth + '.png', E.allFrames(walk.sheet), walk.used, walk.sheet, 'sheet');
                    for (const [anim, sheetName] of [['idle', N.idle], ['run', N.run]]) {
                        const o = this.composeLpc(recipe, anim, keep);
                        if (o && o.sheet && o.used.length) write('img/characters/' + sheetName + '.png', E.allFrames(o.sheet), o.used, o.sheet, 'sheet');
                    }
                }
                for (const anim of options.actions || []) {
                    const o = this.composeLpc(recipe, anim, keep);
                    if (o && o.sheet && o.used.length) write('img/characters/' + E.actionName(base, anim) + '.png', E.actionSheet(o.sheet, anim), o.used, o.sheet, 'action');
                }
                if (options.battler) {
                    const sheets = {}, used = [];
                    for (const anim of E.svAnimations()) {
                        const o = this.composeLpc(recipe, anim, keep);
                        sheets[anim] = o && o.used.length ? o.sheet : null;
                        if (o) used.push(...o.used);
                    }
                    const sv = E.svSheet(sheets), f = 'img/sv_actors/' + N.face + '.png';
                    write(f, sv.sheet, used);
                    if (note.battler) note.battler(f, sv);
                }
                // Visual Equipment z: below 0 is behind the body; the library's order is kept.
                const zs = part.layers.map(l => l.z).filter(z => (behind ? z < E.bodyZ : z >= E.bodyZ));
                pieces.push({ base, z: behind ? Math.min(-1, Math.min(...zs) - E.bodyZ) : Math.max(1, Math.max(...zs) - E.bodyZ) });
            }
            if (!pieces.length) { warnings.push(`${part.name} has nothing to draw for the ${state.body} body.`); continue; }
            out.push({ slot: slot.key, label: slot.label, name: part.name, files,
                notetag: E.partNotetag(slot.key, pieces, { smooth: options.smooth !== false || !options.classic, battler: Boolean(options.battler) }) });
        }
        return out;
    },

    // ---- Notetags on the database's weapons and armours ----

    // w: weapons, a: armours, h: actors (clothes always worn: an equipped item with the same part replaces them).
    lpcItemKinds: { w: ['data/Weapons.json', '$dataWeapons', 'Weapon'], a: ['data/Armors.json', '$dataArmors', 'Armour'], h: ['data/Actors.json', '$dataActors', 'Actor'] },

    lpcItemFile(kind) {
        return (this.lpcItemKinds[kind] || this.lpcItemKinds.a)[0];
    },

    lpcLiveList(kind) {
        const global = typeof window !== 'undefined' ? window : {};
        return global[(this.lpcItemKinds[kind] || this.lpcItemKinds.a)[1]] || null;
    },

    // Weapons and armours to put a part on: [{ kind, id, name }].
    lpcEquipItems() {
        const out = [];
        const add = (list, kind) => (list || []).forEach(item => { if (item && item.name) out.push({ kind, id: item.id, name: item.name }); });
        add(typeof $dataWeapons !== 'undefined' ? $dataWeapons : null, 'w');
        add(typeof $dataArmors !== 'undefined' ? $dataArmors : null, 'a');
        add(typeof $dataActors !== 'undefined' ? $dataActors : null, 'h');
        return out;
    },

    // The note with a part's notetag: an earlier LPC notetag for the same part is replaced, the rest kept.
    lpcNoteWith(note, notetag, part) {
        const mine = new RegExp('^\\s*<\\s*visual\\s*:\\s*\\$LPC [^>]*\\bpart\\s+' + String(part).replace(/[^\w]/g, '') + '\\s*(,[^>]*)?>\\s*$', 'i');
        const kept = String(note || '').split('\n').filter(line => !mine.test(line));
        while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
        return kept.concat(notetag.split('\n')).join('\n');
    },

    // Writes the notetag into data/Weapons.json or data/Armors.json (after a backup, in MZ's own layout)
    // and into the running game, so it can be tried at once.
    addLpcNotetag(kind, id, notetag, part) {
        const D = DocsDoodads, FS = D.FS;
        const file = this.lpcItemFile(kind);
        if (!FS.fs || !FS.writable()) { this.showToast('Notetags are added in a playtest.', 'info'); return false; }
        let list = null;
        try { list = FS.readJson(file); } catch (e) { list = null; }
        const item = Array.isArray(list) ? list[id] : null;
        if (!item) { this.showToast(`There is no ${(this.lpcItemKinds[kind] || this.lpcItemKinds.a)[2].toLowerCase()} ${id}.`, 'error'); return false; }
        item.note = this.lpcNoteWith(item.note, notetag, part);
        try {
            FS.createTimestampedBackup(file);
            const text = '[\n' + list.map(x => JSON.stringify(x)).join(',\n') + '\n]';
            FS.fs.writeFileSync(file + '.tmp', text, 'utf8');
            FS.fs.renameSync(file + '.tmp', file);
        } catch (e) {
            this.showToast('Could not write ' + file + ': ' + (e.message || e), 'error');
            return false;
        }
        const live = this.lpcLiveList(kind);
        if (live && live[id]) {
            live[id].note = item.note;
            if (typeof DataManager !== 'undefined' && DataManager.extractMetadata) DataManager.extractMetadata(live[id]);
        }
        this.showToast(`Added to ${item.name}. If MZ's editor has this project open, reopen the project there before saving, or it will put the old note back.`, 'success');
        return true;
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
