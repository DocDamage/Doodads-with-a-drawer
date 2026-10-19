//==========================================================
// SECTION 5G2: ONE SHORTCUT TABLE
//==========================================================
// Every editor key binding is a row here. The key handler, the Keyboard Shortcuts card (More), button
// tooltips, the command palette and the guide's cheat sheet (npm run shortcuts) all read this table, so a
// key changed here, or rebound by the user, changes everywhere at once. Rebinding is kept per computer.
// fixed rows are listed but can't be rebound: they depend on what is under the cursor or on the tool.
DocsDoodads.Shortcuts = {
    prefKey: 'shortcuts',

    list: [
        { id: 'undo', label: 'Undo', group: 'Editing', keys: 'Ctrl+Z' },
        { id: 'redo', label: 'Redo', group: 'Editing', keys: 'Ctrl+Y' },
        { id: 'save', label: 'Save everything', group: 'Editing', keys: 'Ctrl+S' },
        { id: 'duplicate', label: 'Duplicate the picked doodads', group: 'Editing', keys: 'Ctrl+D' },
        { id: 'copy', label: 'Copy the picked doodads', group: 'Editing', keys: 'Ctrl+C' },
        { id: 'paste', label: 'Paste beside the cursor', group: 'Editing', keys: 'Ctrl+V' },
        { id: 'pasteInPlace', label: 'Paste in Place (where they were copied)', group: 'Editing', keys: 'Ctrl+Shift+V' },
        { id: 'selectAll', label: 'Select All', group: 'Editing', keys: 'Ctrl+A' },
        { id: 'delete', label: 'Delete the picked doodads or event', group: 'Editing', keys: 'Delete' },
        { id: 'nudge', label: 'Nudge the picked doodads 1 pixel (Shift: 16) or the event 1 tile', group: 'Editing', keys: 'Arrow keys', fixed: true },
        { id: 'palette', label: 'Find a Tool (command palette)', group: 'Panels', keys: 'Ctrl+K' },
        { id: 'details', label: 'Fold or open Details', group: 'Panels', keys: 'H' },
        { id: 'find', label: 'Search the Item Bag', group: 'Panels', keys: 'F' },
        { id: 'shortcuts', label: 'Keyboard Shortcuts (this list)', group: 'Panels', keys: 'Shift+/' },
        { id: 'nextPanel', label: 'Go to the next panel (top bar, Item Bag, map, Details)', group: 'Panels', keys: 'F6' },
        { id: 'prevPanel', label: 'Go to the panel before', group: 'Panels', keys: 'Shift+F6' },
        { id: 'itemKeys', label: 'In the Item Bag: arrows move between items, Enter picks one', group: 'Panels', keys: 'Arrow keys, Enter', fixed: true },
        { id: 'grid', label: 'Show or hide the grid', group: 'View', keys: 'G' },
        { id: 'collision', label: 'Show or hide collision', group: 'View', keys: '' },
        { id: 'sounds', label: 'Show or hide sounds', group: 'View', keys: '' },
        { id: 'speed', label: 'Show or hide speed', group: 'View', keys: '' },
        { id: 'toolSelect', label: 'Select tool', group: 'Tools', keys: '' },
        { id: 'toolStamp', label: 'Stamp tool', group: 'Tools', keys: '' },
        { id: 'toolScatter', label: 'Scatter tool', group: 'Tools', keys: '' },
        { id: 'toolPaint', label: 'Paint tool (biomes)', group: 'Tools', keys: '' },
        { id: 'toolPath', label: 'Path tool', group: 'Tools', keys: '' },
        { id: 'toolHills', label: 'Hills tool', group: 'Tools', keys: '' },
        { id: 'toolRegions', label: 'Regions tool', group: 'Tools', keys: '' },
        { id: 'toolTiles', label: 'Tiles tool (MZ tiles)', group: 'Tools', keys: '' },
        { id: 'toolGrab', label: 'Grab tool', group: 'Tools', keys: '' },
        { id: 'rooms', label: 'Rooms (room stamps)', group: 'Tools', keys: '' },
        { id: 'brushSmaller', label: 'Smaller brush (Scatter, Paint, Hills, Regions)', group: 'Tools', keys: '[' },
        { id: 'brushBigger', label: 'Bigger brush', group: 'Tools', keys: ']' },
        { id: 'pathFinish', label: 'Place props along the path being drawn', group: 'Tools', keys: 'Enter', fixed: true },
        { id: 'pathBack', label: 'Remove the last path point', group: 'Tools', keys: 'Backspace', fixed: true },
        { id: 'cancel', label: 'Stop the tool, unpick, close pop-ups', group: 'Tools', keys: 'Escape', fixed: true }
    ],

    find(id) {
        return this.list.find(s => s.id === id) || null;
    },

    groups() {
        return this.list.map(s => s.group).filter((g, i, all) => all.indexOf(g) === i);
    },

    // The user's changes: { id: 'Ctrl+J' } or { id: '' } for no key.
    overrides() {
        const U = DocsDoodads.Ui;
        const raw = U && typeof U.prefs === 'function' ? U.prefs()[this.prefKey] : null;
        return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    },

    keysOf(id) {
        const s = this.find(id);
        if (!s) return '';
        if (s.fixed) return s.keys;
        const own = this.overrides();
        return Object.prototype.hasOwnProperty.call(own, id) && typeof own[id] === 'string' ? own[id] : s.keys;
    },

    isChanged(id) {
        const s = this.find(id);
        return Boolean(s && !s.fixed && this.keysOf(id) !== s.keys);
    },

    // KeyChord.parse reads unreadable text as F10; no key at all is no chord here.
    parse(text) {
        const t = String(text || '').trim();
        return t ? DocsDoodads.KeyChord.parse(t) : null;
    },

    chordOf(id) {
        const s = this.find(id);
        return s && !s.fixed ? this.parse(this.keysOf(id)) : null;
    },

    // "Ctrl+Z", "G", or '' when the row has no key.
    label(id) {
        const s = this.find(id);
        if (!s) return '';
        if (s.fixed) return s.keys;
        const chord = this.chordOf(id);
        return chord ? DocsDoodads.KeyChord.label(chord) : '';
    },

    // A tooltip with its key at the end, the way the tooltip shows a key cap: "Undo (Ctrl+Z)".
    tip(id, text) {
        const keys = this.label(id);
        return keys ? `${text} (${keys})` : text;
    },

    same(a, b) {
        return Boolean(a && b) && a.code === b.code && a.ctrl === b.ctrl && a.shift === b.shift && a.alt === b.alt;
    },

    // The key a KeyboardEvent names, as a KeyboardEvent code, read from e.key so that letters follow the
    // keyboard's layout (Ctrl+Z is the key marked Z on an AZERTY keyboard too). '' when e.key says nothing
    // useful (a shifted symbol, a letter from another alphabet); e.code is tried then.
    codeFromKey(key) {
        const k = String(key || '');
        if (k.length === 1) {
            if (/^[a-z]$/i.test(k)) return 'Key' + k.toUpperCase();
            if (/^[0-9]$/.test(k)) return 'Digit' + k;
            return DocsDoodads.KeyChord.symbols[k] || '';
        }
        if (k === 'Esc') return 'Escape';
        if (k === 'Del') return 'Delete';
        return /^(F\d{1,2}|Delete|Backspace|Enter|Escape|Tab|Insert|Home|End|PageUp|PageDown|Pause|Arrow(Left|Right|Up|Down))$/.test(k) ? k : '';
    },

    modifiers(e) {
        return { ctrl: Boolean(e.ctrlKey || e.metaKey), shift: Boolean(e.shiftKey), alt: Boolean(e.altKey) };
    },

    // The id of the rebindable row this key press is bound to, or null. The key's name is tried before
    // its position, so a layout's own letters win over the key that sits where a QWERTY letter would.
    match(e) {
        if (!e) return null;
        const mods = this.modifiers(e);
        const rows = this.list.filter(s => !s.fixed).map(s => ({ id: s.id, chord: this.chordOf(s.id) })).filter(r => r.chord);
        for (const code of [this.codeFromKey(e.key), e.code]) {
            if (!code) continue;
            const hit = rows.find(r => this.same(r.chord, Object.assign({ code }, mods)));
            if (hit) return hit.id;
        }
        return null;
    },

    // Keys a text field leaves to the editor (Ctrl+S right after typing in Details): chords with Ctrl or Alt,
    // and the F-keys. Not the field's own editing keys (Ctrl+Z, Y, A, C, V, X, moving and deleting by word),
    // and not Ctrl+Alt with a character (AltGr types on many keyboards).
    passesField(e) {
        if (!e) return false;
        const key = String(e.key || '');
        const ctrl = Boolean(e.ctrlKey || e.metaKey), alt = Boolean(e.altKey);
        if (/^F\d{1,2}$/.test(key)) return true;
        if (!ctrl && !alt) return false;
        if (ctrl && alt && key.length === 1) return false;
        if (ctrl && !alt && (/^[zyacvx]$/i.test(key) || /^(Arrow|Home|End|Backspace|Delete)/.test(key))) return false;
        return true;
    },

    // A key press while changing a binding: the chord it makes, or null for a lone Ctrl, Shift or Alt.
    chordFromEvent(e) {
        if (!e || /^(Control|Shift|Alt|Meta|OS|AltGraph|CapsLock)$/.test(String(e.key || ''))) return null;
        const code = this.codeFromKey(e.key) || e.code || '';
        if (!code || /^(Control|Shift|Alt|Meta|OS)(Left|Right)?$/.test(code)) return null;
        return Object.assign({ code }, this.modifiers(e));
    },

    // Why a chord can't be used for a row (it is taken by the editor key or by a fixed row), or ''.
    reserved(chord) {
        if (!chord) return '';
        if (DocsDoodads.editChord && this.same(chord, DocsDoodads.editChord)) return 'opens and closes the editor (the Editor Key parameter)';
        if (chord.code === 'Escape' && !chord.ctrl && !chord.alt) return 'stops tools and closes pop-ups';
        if (/^Arrow/.test(chord.code) && !chord.ctrl && !chord.alt) return 'nudges the picked doodads';
        return '';
    },

    // The other row that already uses this chord, or null.
    conflict(id, chord) {
        if (!chord) return null;
        const other = this.list.find(s => !s.fixed && s.id !== id && this.same(this.chordOf(s.id), chord));
        return other ? other.id : null;
    },

    // Bind a row to keys ('' for none). The caller has checked reserved() and conflict(); a row that ends up
    // back on its own default is stored as no change.
    set(id, keys) {
        const s = this.find(id);
        if (!s || s.fixed) return false;
        const chord = this.parse(keys);
        const text = chord ? DocsDoodads.KeyChord.label(chord) : '';
        const own = Object.assign({}, this.overrides());
        const def = this.parse(s.keys);
        if ((chord && def && this.same(chord, def)) || (!chord && !def)) delete own[id];
        else own[id] = text;
        DocsDoodads.Ui.setPref(this.prefKey, own);
        return true;
    },

    reset(id) {
        const own = Object.assign({}, this.overrides());
        delete own[id];
        DocsDoodads.Ui.setPref(this.prefKey, own);
    },

    resetAll() {
        DocsDoodads.Ui.setPref(this.prefKey, {});
    },

    // The guide's table, from the defaults (npm run shortcuts writes it into Docs_Doodads_Guide.md).
    markdown() {
        const cap = text => text.split('+').map(k => '**' + k + '**').join(' + ');
        const rows = ['| Keys | What it does | Group |', '| :--- | :--- | :--- |',
            '| **F10** (the Editor Key parameter) | Open or close the editor | Playtest |'];
        for (const s of this.list) {
            const keys = s.fixed ? cap(s.keys) : s.keys ? cap(DocsDoodads.KeyChord.label(this.parse(s.keys))) : '*(no key)*';
            rows.push(`| ${keys} | ${s.label}${s.fixed ? ' *(fixed)*' : ''} | ${s.group} |`);
        }
        return rows.join('\n');
    }
};

