//==========================================================
// SECTION 25s3: CHARACTER CREATOR UNDO, LOCKS AND LINKED COLOURS
//==========================================================
// For the Character Creator window (44_workspace_lpc_creator.js), all three kits:
//   Undo      every change (a step, a colour, the dice, the body type, a grid pick, a load, a link) is
//             remembered first, the last historyMax of them; Ctrl+Z (the pad's Back held with B) goes back one.
//   Locks     a padlock per row (click, L, or the pad's Y held with a direction): the dice leave a locked row
//             as it is (an MZ part keeps its colour slots too). Locking the body type keeps it when Shift+X
//             (the pad's X held) rolls a new one. Locks belong to the open window, not to saved characters.
//   Links     Memao's long hair, side hair and eyebrows take the hair's colour until given their own (K, or the
//             chain beside the swatch); the kit says which rows link (slots.linkOf, setLinked).
//   Recipes   the character in a file of its own (Export recipe... and Import recipe... on the Load popover).
Object.assign(DocsDoodads.Workspace, {
    historyMax: 20,

    // Remembers the character as it is, before a change.
    creatorRemember() {
        const c = this._creator;
        if (!c) return 0;
        const h = c.history || (c.history = []);
        const now = JSON.stringify(c.state);
        if (h[h.length - 1] !== now) h.push(now);
        while (h.length > this.historyMax) h.shift();
        return h.length;
    },

    creatorUndo() {
        const c = this._creator;
        const h = c && c.history;
        if (!h || !h.length) { this.creatorSay('Nothing to undo'); DocsDoodads.Ui.sound('buzzer'); return false; }
        c.state = JSON.parse(h.pop());
        this.creatorChanged('cancel', `Undone (${h.length} more)`);
        return true;
    },

    // ---- Locks ----

    creatorLocked(rowKey) {
        const c = this._creator;
        return Boolean(c && c.locks && c.locks[rowKey]);
    },

    // The locked rows (of one card, or all).
    creatorLockedKeys(card) {
        const c = this._creator, S = this.creatorSlots();
        return Object.keys((c && c.locks) || {}).filter(k => c.locks[k] && (!card || (k === '_body' ? card === 'body' : S.slot(k) && S.slot(k).card === card)));
    },

    creatorToggleLock(rowKey) {
        const c = this._creator, S = this.creatorSlots();
        const label = rowKey === '_body' ? 'Body type' : (S.slot(rowKey) || { label: rowKey }).label;
        c.locks = Object.assign({}, c.locks, { [rowKey]: !this.creatorLocked(rowKey) });
        DocsDoodads.Ui.sound('cursor');
        this.renderCreator();
        this.creatorSay(c.locks[rowKey] ? `${label} locked: the dice leave it` : `${label} unlocked`);
        return c.locks[rowKey];
    },

    // After the dice: each locked row back as it was (with an MZ part's colour slots).
    creatorKeepLocked(before, after) {
        const S = this.creatorSlots(), index = this.creatorIndex();
        const next = JSON.parse(JSON.stringify(after));
        for (const key of this.creatorLockedKeys()) {
            if (key === '_body') continue;
            const pick = before.slots[key];
            if (pick) next.slots[key] = JSON.parse(JSON.stringify(pick)); else delete next.slots[key];
            if (pick && S.channels && before.colours) {
                const part = index.parts.find(p => p.id === pick.id);
                next.colours = next.colours || {};
                for (const ch of S.channels(index, part)) {
                    if (before.colours[ch.slot] !== undefined) next.colours[ch.slot] = before.colours[ch.slot]; else delete next.colours[ch.slot];
                }
            }
        }
        return next;
    },

    // The body types a new roll may give: those the library has a body for, where every locked part still fits.
    creatorBodyTypes() {
        const S = this.creatorSlots(), c = this._creator, index = this.creatorIndex(), safe = this.creatorSafeOnly();
        const locked = this.creatorLockedKeys().filter(k => k !== '_body' && c.state.slots[k]);
        const types = S.bodies.map(b => b[0]).filter(type => S.options(index, S.slot('body'), type, safe).length &&
            locked.every(k => S.options(index, S.slot(k), type, safe).some(p => p.id === c.state.slots[k].id)));
        return types.length ? types : [c.state.body];
    },

    // The dice: a new face, skin and hair on the same body type (newType: a new type too, unless it is
    // locked), or a new outfit; locked rows stay.
    creatorShuffle(card, newType = false) {
        const S = this.creatorSlots(), c = this._creator;
        this.creatorRemember();
        const type = Boolean(newType) && card === 'body' && !this.creatorLocked('_body');
        const next = S.shuffle(c.state, this.creatorIndex(), card, Math.random, this.creatorSafeOnly(), { newType: type, types: this.creatorBodyTypes() });
        c.state = this.creatorKeepLocked(c.state, next);
        const kept = this.creatorLockedKeys(card).filter(k => k !== '_body').length;
        const what = card === 'body' ? (type ? 'New body type, face and hair' : 'New face and hair') : 'New outfit';
        this.creatorChanged('ok', what + (kept ? `; ${kept} locked kept` : ''));
    },

    // ---- Recipes: one character in a file of its own (23_creator_recipe.js), from the Load popover ----

    creatorWriteRecipe(file) {
        const c = this._creator, FS = DocsDoodads.FS;
        try {
            FS.fs.writeFileSync(file, DocsDoodads.CreatorRecipe.write(c.kit, c.name, c.state), 'utf8');
        } catch (e) {
            this.showToast('Could not write the recipe: ' + (e.message || e), 'error');
            return false;
        }
        this.showToast(`Saved the recipe of ${c.name || 'the character'} in ${FS.path ? FS.path.basename(file) : file}.`, 'success');
        return true;
    },

    // A recipe file into the open creator: one made by another library's creator is refused with what to do;
    // parts the library no longer has are dropped (and named), as when loading.
    creatorReadRecipe(file) {
        const S = this.creatorSlots(), c = this._creator, FS = DocsDoodads.FS;
        let got;
        try {
            got = DocsDoodads.CreatorRecipe.read(FS.fs.readFileSync(file, 'utf8'), c.kit);
        } catch (e) {
            this.showToast(e.message || String(e), 'error');
            return false;
        }
        const gone = this.creatorDropStale(got.state);
        this.creatorRemember();
        c.state = got.state;
        if (got.name) c.name = got.name;
        c.pop = null;
        if (gone.length) this.showToast(`Some parts aren't offered now (${gone.map(k => S.slot(k) ? S.slot(k).label : k).join(', ')}): ${this.creatorKit().missingNote}.`, 'info');
        this.creatorChanged('ok', 'Brought in ' + (got.name || 'the character'));
        return true;
    },

    // NW.js's own file dialogs: <input type="file" nwsaveas> to save, accept=".json" to open.
    creatorPickRecipeOut() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        if (input.setAttribute) input.setAttribute('nwsaveas', DocsDoodads.CreatorRecipe.fileName(this._creator.name));
        input.accept = '.json';
        input.onchange = () => { const file = input.value || (input.files && input.files[0] && input.files[0].path); if (file) this.creatorWriteRecipe(file); };
        if (typeof input.click === 'function') input.click();
        return true;
    },

    creatorPickRecipeIn() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = () => { const file = (input.files && input.files[0] && input.files[0].path) || input.value; if (file) this.creatorReadRecipe(file); };
        if (typeof input.click === 'function') input.click();
        return true;
    },

    // ---- Linked colours ----

    creatorToggleLink(rowKey) {
        const S = this.creatorSlots(), c = this._creator;
        const link = S.linkOf ? S.linkOf(c.state, rowKey) : null;
        if (!link) return false;
        this.creatorRemember();
        S.setLinked(c.state, rowKey, !link.linked);
        const label = (S.slot(rowKey) || { label: rowKey }).label, lead = (S.slot(link.lead) || { label: link.lead }).label.toLowerCase();
        this.creatorChanged('cursor', link.linked ? `${label}: its own colour` : `${label}: takes the ${lead} colour`);
        return true;
    }
});
