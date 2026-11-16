// @editor-only
//==========================================================
// SECTION 25: WORKSPACE: MAP NOTES
//==========================================================
// Notes pinned to tiles, in the editor only (DocsDoodads.Notes, 11_notes.js). Right-click a tile: Add Note
// Here, or Edit Note, Mark Done and Delete Note on a tile that has one. A pin is drawn on each note's tile
// (done ones faded) and its words show while the mouse is over it. Map > Notes lists this map's or every
// map's notes with Go To, Done and Delete; View > Hide Notes hides the pins. Each change is one undo step.
// Pins are drawn on the editor's overlay, which Capture leaves out.
DocsDoodads.Ui.css += `
#dd-notes { position: fixed; z-index: 10033; width: 340px; max-width: calc(100vw - 32px); max-height: 70vh; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
#dd-notes .dd-nt-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
#dd-notes .dd-nt-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 10px; background: var(--dd-panel-2); }
#dd-notes .dd-nt-text { flex: 1; min-width: 0; color: var(--dd-text); font-weight: 700; overflow-wrap: anywhere; }
#dd-notes .dd-nt-done .dd-nt-text { text-decoration: line-through; color: var(--dd-muted); }
#dd-notes .dd-nt-where { color: var(--dd-muted); white-space: nowrap; }
#dd-notes .dd-btn { padding: 3px 8px; font-size: 11px; }
#dd-notes .dd-nt-tools { display: flex; gap: 6px; align-items: center; }
#dd-note-tip { position: fixed; z-index: 10034; max-width: 260px; padding: 6px 9px; font-size: 11px; font-weight: 700; pointer-events: none; white-space: pre-wrap; overflow-wrap: anywhere; }
`;
Object.assign(DocsDoodads.Ui.mapPalettes.standard, { noteYellow: 0xfacc15, noteRed: 0xf87171, noteGreen: 0x4ade80, noteBlue: 0x60a5fa });
Object.assign(DocsDoodads.Ui.mapPalettes.safe, { noteYellow: 0xf0e442, noteRed: 0xd55e00, noteGreen: 0x009e73, noteBlue: 0x0072b2 });
DocsDoodads.Ui.mapColorMeanings.push(['noteYellow', 'A map note']);

Object.assign(DocsDoodads.Workspace, {
    // On unless turned off (remembered on this computer). Read once; drawNotes asks every frame.
    notesShown() {
        if (this._notesShown === undefined) this._notesShown = DocsDoodads.Ui.prefs().notesOverlay !== false;
        return this._notesShown;
    },

    toggleNotes(on) {
        const show = this._notesShown = on === undefined ? !this.notesShown() : Boolean(on);
        DocsDoodads.Ui.setPref('notesOverlay', show);
        const label = typeof document !== 'undefined' ? document.getElementById('dd-notes-show-label') : null;
        if (label) label.textContent = show ? 'Hide Notes' : 'Show Notes';
        if (!show) this.hideNoteTip();
        return show;
    },

    // One undo step for a change to a map's notes.
    notesStep(type, mapId, change) {
        const N = DocsDoodads.Notes;
        const before = N.copy(mapId);
        const result = change();
        const after = N.copy(mapId);
        if (JSON.stringify(before) === JSON.stringify(after)) return result;
        const set = list => {
            N.put(mapId, JSON.parse(JSON.stringify(list)));
            DocsDoodads.Persistence.dirtyDoodads = true;
            if (this._notesOpen) this.renderNotes();
        };
        N.put(mapId, JSON.parse(JSON.stringify(before)));
        DocsDoodads.Undo.execute({ type, apply: () => set(after), revert: () => set(before) });
        return result;
    },

    noteFields(note) {
        const N = DocsDoodads.Notes;
        return [
            { key: 'text', label: 'Note', value: note ? note.text : '', placeholder: 'A chest here; check the door...' },
            { key: 'colour', label: 'Colour', type: 'select', value: note ? note.colour : 'yellow',
                options: N.colours.map(c => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
            { key: 'done', label: 'Done', type: 'checkbox', value: note ? note.done : false }
        ];
    },

    async addNoteAt(tileX, tileY) {
        const mapId = this.currentMapId();
        if (DocsDoodads.Notes.at(mapId, tileX, tileY)) return this.editNoteAt(tileX, tileY);
        const values = await DocsDoodads.Ui.form({ title: `Note at ${tileX}, ${tileY}`, text: 'Seen only in the editor.', ok: 'Add Note',
            fields: this.noteFields(null).filter(f => f.key !== 'done') });
        if (!values || !String(values.text || '').trim()) return null;
        return this.notesStep('add_note', mapId, () => DocsDoodads.Notes.add(mapId, { x: tileX, y: tileY, text: values.text, colour: values.colour }));
    },

    async editNoteAt(tileX, tileY, mapId = this.currentMapId()) {
        const note = DocsDoodads.Notes.at(mapId, tileX, tileY);
        if (!note) return null;
        const values = await DocsDoodads.Ui.form({ title: `Note at ${tileX}, ${tileY}`, text: 'An empty note is deleted.', ok: 'Save Note', fields: this.noteFields(note) });
        if (!values) return null;
        const id = note.id;
        return this.notesStep(String(values.text || '').trim() ? 'edit_note' : 'delete_note', mapId,
            () => DocsDoodads.Notes.update(mapId, id, { text: values.text, colour: values.colour, done: values.done }));
    },

    markNoteDone(mapId, id, done) {
        return this.notesStep('note_done', mapId, () => DocsDoodads.Notes.update(mapId, id, { done }));
    },

    deleteNote(mapId, id) {
        return this.notesStep('delete_note', mapId, () => DocsDoodads.Notes.remove(mapId, id));
    },

    // The right-click entries for a tile.
    noteMenuItems(tileX, tileY) {
        const mapId = this.currentMapId();
        const note = DocsDoodads.Notes.at(mapId, tileX, tileY);
        if (!note) return [{ label: 'Add Note Here...', icon: '📝', onClick: () => this.addNoteAt(tileX, tileY) }];
        return [
            { label: 'Edit Note...', icon: '📝', onClick: () => this.editNoteAt(tileX, tileY) },
            { label: note.done ? 'Mark Not Done' : 'Mark Done', icon: '✔️', onClick: () => this.markNoteDone(mapId, note.id, !note.done) },
            { label: 'Delete Note', icon: '🗑️', danger: true, onClick: () => this.deleteNote(mapId, note.id) }
        ];
    },

    // ---- On the map ----
    // A pin per note on screen (flat maps), and the hovered note's words beside the mouse.
    drawNotes(g) {
        if (typeof $gameMap === 'undefined' || !$gameMap || !this.notesShown()) { this.hideNoteTip(); return; }
        const P = DocsDoodads.Perspective;
        if (P && P.liveCamera && P.liveCamera()) { this.hideNoteTip(); return; }
        const notes = DocsDoodads.Notes.list(this.currentMapId());
        if (!notes.length) { this.hideNoteTip(); return; }
        const U = DocsDoodads.Ui, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const n of notes) {
            const x = $gameMap.adjustX(n.x) * tw, y = $gameMap.adjustY(n.y) * th;
            const colour = U.mapColor('note' + n.colour[0].toUpperCase() + n.colour.slice(1)) || U.mapColor('noteYellow');
            const alpha = n.done ? 0.4 : 1;
            // A pin: a round head on a short stem, in the tile's top-right corner.
            g.lineStyle(2, 0x111111, 0.7 * alpha);
            g.moveTo(x + tw - 12, y + 16);
            g.lineTo(x + tw - 18, y + 26);
            g.beginFill(colour, alpha);
            g.drawCircle(x + tw - 11, y + 11, 7);
            g.endFill();
            g.lineStyle(0);
        }
        const at = this._cursor;
        const hover = at ? notes.find(n => n.x === at.tileX && n.y === at.tileY) : null;
        if (hover) this.showNoteTip(hover); else this.hideNoteTip();
    },

    showNoteTip(note) {
        if (typeof document === 'undefined' || !document.createElement) return;
        let tip = document.getElementById('dd-note-tip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'dd-note-tip';
            tip.className = 'dd-glass';
            document.body.appendChild(tip);
        }
        const text = (note.done ? '✔ ' : '') + note.text;
        if (tip.textContent !== text) tip.textContent = text;
        const canvas = DocsDoodads.Compat.getCanvas();
        const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
        if (rect && typeof $gameMap !== 'undefined') {
            const sx = rect.width && canvas.width ? rect.width / canvas.width : 1, sy = rect.height && canvas.height ? rect.height / canvas.height : 1;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            tip.style.left = Math.round(rect.left + ($gameMap.adjustX(note.x) + 1) * tw * sx + 4) + 'px';
            tip.style.top = Math.round(rect.top + $gameMap.adjustY(note.y) * th * sy) + 'px';
        }
        tip.style.display = '';
    },

    hideNoteTip() {
        const tip = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-note-tip') : null;
        if (tip && tip.style.display !== 'none') tip.style.display = 'none';
    },

    // ---- The Notes card ----
    showNotesCard() {
        if (typeof document === 'undefined') return null;
        this._notesOpen = true;
        this._notesScope = this._notesScope || 'map';
        return this.renderNotes();
    },

    closeNotes() {
        this._notesOpen = false;
        this.hideNoteTip();
        for (const id of ['dd-notes', 'dd-note-tip']) {
            const el = typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null;
            if (el && el.parentNode) el.parentNode.removeChild(el);
        }
    },

    goToNote(mapId, note) {
        this.goToProblem({ mapId, x: note.x, y: note.y });
    },

    renderNotes() {
        if (typeof document === 'undefined' || !this._notesOpen) return null;
        const U = DocsDoodads.Ui, N = DocsDoodads.Notes;
        let panel = document.getElementById('dd-notes');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dd-notes';
            panel.className = 'dd-glass';
            document.body.appendChild(panel);
        }
        const here = this.currentMapId();
        const rows = this._notesScope === 'all' ? N.all() : N.all().filter(r => r.mapId === here);
        const open = rows.filter(r => !r.note.done).length;
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">📝 Notes (${open} to do${rows.length > open ? `, ${rows.length - open} done` : ''})</span>
                <button class="dd-btn dd-fold" id="dd-nt-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-nt-tools">
                <select id="dd-nt-scope"><option value="map"${this._notesScope === 'map' ? ' selected' : ''}>This map</option><option value="all"${this._notesScope === 'all' ? ' selected' : ''}>Every map</option></select>
                <span class="dd-grow"></span>
            </div>
            <div class="dd-nt-list" id="dd-nt-list"></div>`;
        const list = document.getElementById('dd-nt-list');
        if (list) {
            if (!rows.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = 'No notes yet. Right-click a tile on the map: Add Note Here.';
                list.appendChild(empty);
            }
            for (const { mapId, note } of rows) {
                const row = document.createElement('div');
                row.className = 'dd-nt-row' + (note.done ? ' dd-nt-done' : '');
                const tick = document.createElement('input');
                tick.type = 'checkbox';
                tick.checked = Boolean(note.done);
                tick.title = 'Done';
                tick.onchange = () => this.markNoteDone(mapId, note.id, tick.checked);
                row.appendChild(tick);
                const text = document.createElement('span');
                text.className = 'dd-nt-text';
                text.textContent = note.text;
                text.title = 'Click to edit';
                text.style.cursor = 'pointer';
                text.onclick = () => this.editNoteAt(note.x, note.y, mapId);
                row.appendChild(text);
                const where = document.createElement('span');
                where.className = 'dd-nt-where';
                where.textContent = (mapId === here ? '' : `Map ${mapId} · `) + `${note.x}, ${note.y}`;
                row.appendChild(where);
                const go = document.createElement('button');
                go.className = 'dd-btn';
                go.type = 'button';
                go.textContent = 'Go To';
                go.onclick = () => this.goToNote(mapId, note);
                row.appendChild(go);
                const del = document.createElement('button');
                del.className = 'dd-btn';
                del.type = 'button';
                del.title = 'Delete this note';
                del.innerHTML = U.icon('trash', 1);
                del.onclick = () => this.deleteNote(mapId, note.id);
                row.appendChild(del);
                list.appendChild(row);
            }
        }
        const close = document.getElementById('dd-nt-close');
        if (close) close.onclick = () => this.closeNotes();
        const scope = document.getElementById('dd-nt-scope');
        if (scope) scope.onchange = () => { this._notesScope = scope.value === 'all' ? 'all' : 'map'; this.renderNotes(); };
        this.placeReadouts();
        return panel;
    }
});

// Pins are drawn whatever the tool (every tool hook's overlay runs each frame).
DocsDoodads.Workspace.toolHooks.notes = { overlay(g) { this.drawNotes(g); } };
