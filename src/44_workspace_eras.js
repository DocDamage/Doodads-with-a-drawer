// @editor-only
//==========================================================
// SECTION 25V: MAP ERAS IN THE EDITOR (8.4.5)
//==========================================================
// Map settings → Eras: the map's versions, what picks one in the game (a switch or a variable), the era being
// edited (the others' doodads drawn faint, with a slider), "Only in This Era" and "In Every Era" for what is
// picked, Copy Era, and deleting an era (which asks what to do with its doodads). Each change is one Undo step.
(function() {
    const D = DocsDoodads, W = D.Workspace, Er = D.Eras;

    Object.assign(W, {
        // One Undo step over the map's eras and its doodad list together.
        changeEras(mapId, change, label) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            const copy = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
            const before = { eras: copy(data.eras && data.eras[mapId]), list: copy((data[mapId] || []).filter(d => !(d && d.temp))) };
            const after = copy(before);
            change(after);
            const write = v => {
                data.eras = data.eras || {};
                if (v.eras && v.eras.list && v.eras.list.length) data.eras[mapId] = copy(v.eras); else delete data.eras[mapId];
                if (!Object.keys(data.eras).length) delete data.eras;
                const temps = (data[mapId] || []).filter(d => d && d.temp);
                data[mapId] = copy(v.list).concat(temps);
                D.Persistence.dirtyDoodads = true;
                if (D.api && D.api.refresh) D.api.refresh();
                if (this.refreshInspector) this.refreshInspector();
            };
            D.Undo.execute({ type: 'eras', label: label || 'Eras', apply: () => write(after), revert: () => write(before) });
            return true;
        },

        addEra(mapId, name) {
            let id = null;
            this.changeEras(mapId, v => {
                v.eras = v.eras || { list: [], pick: {} };
                if (!v.eras.list.length) v.eras.list.push({ id: 'era_1', name: 'Now' });
                let n = v.eras.list.length + 1;
                while (v.eras.list.some(e => e.id === 'era_' + n)) n++;
                id = 'era_' + n;
                v.eras.list.push({ id, name: String(name || 'Era ' + n) });
            }, 'Add era');
            return id;
        },

        // what: 'delete' takes out the doodads only in it; 'all' shows them in every era.
        deleteEra(mapId, id, what) {
            return this.changeEras(mapId, v => {
                if (!v.eras) return;
                v.eras.list = v.eras.list.filter(e => e.id !== id);
                v.list = v.list.filter(d => {
                    if (!d || !Array.isArray(d.eras)) return true;
                    d.eras = d.eras.filter(e => e !== id);
                    if (d.eras.length) return true;
                    if (what === 'delete') return false;
                    delete d.eras;
                    return true;
                });
                if (v.eras.list.length < 2) { for (const d of v.list) if (d) delete d.eras; v.eras = undefined; }
            }, 'Delete era');
        },

        // The picked doodads only in `era` (or, with null, in every era again).
        setDoodadEras(mapId, uids, era) {
            return this.changeEras(mapId, v => {
                for (const d of v.list) if (d && uids.includes(d.uid)) { if (era) d.eras = [era]; else delete d.eras; }
            }, era ? 'Only in this era' : 'In every era');
        },

        // Every doodad only in `from` is copied into a new era (new ids); shared doodads stay shared.
        copyEra(mapId, from, name) {
            let id = null;
            this.changeEras(mapId, v => {
                if (!v.eras) return;
                let n = v.eras.list.length + 1;
                while (v.eras.list.some(e => e.id === 'era_' + n)) n++;
                id = 'era_' + n;
                v.eras.list.push({ id, name: String(name || 'Copy') });
                const copies = v.list.filter(d => d && Array.isArray(d.eras) && d.eras.length === 1 && d.eras[0] === from)
                    .map(d => Object.assign(JSON.parse(JSON.stringify(d)), { eras: [id], uid: 'dd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }));
                v.list = v.list.concat(copies);
            }, 'Copy era');
            return id;
        },

        setEditingEra(mapId, era) {
            Er._editing = era ? { mapId, era } : null;
            if (D.api && D.api.refresh) D.api.refresh();
        }
    });

    W.mapSections.push({
        render() {
            const mapId = this.currentMapId(), e = Er.of(mapId);
            const editing = Er._editing && Er._editing.mapId === mapId ? Er._editing.era : (e ? e.list[0].id : '');
            const options = e ? e.list.map(x => `<option value="${escapeHtml(x.id)}"${x.id === editing ? ' selected' : ''}>${escapeHtml(x.name)}</option>`).join('') : '';
            return `
            <details id="dd-eras-sec" ${this._openEras ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Eras (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    ${e ? `<div>Editing <select id="dd-eras-edit">${options}</select></div>
                    <div>Others shown <input type="range" id="dd-eras-onion" min="0" max="1" step="0.05" value="${Er.onion}" /></div>
                    <div>In the game, picked by switch <input type="number" id="dd-eras-switch" min="0" value="${e.pick.switchId}" style="width: 50px;" />
                        or variable <input type="number" id="dd-eras-var" min="0" value="${e.pick.variableId}" style="width: 50px;" /></div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;"><button class="dd-btn" type="button" id="dd-eras-only">Only in This Era</button>
                        <button class="dd-btn" type="button" id="dd-eras-every">In Every Era</button>
                        <button class="dd-btn" type="button" id="dd-eras-copy">Copy Era</button>
                        <button class="dd-btn" type="button" id="dd-eras-delete">Delete Era</button></div>` : ''}
                    <button class="dd-btn" type="button" id="dd-eras-add">Add an Era</button>
                    <div style="color: var(--dd-faint); line-height: 1.4;">One map in several versions (whole, burning, ruined). Doodads in every era stay shared; tiles are the same in every era.</div>
                </div>
            </details>`;
        },
        bind() {
            const mapId = this.currentMapId(), node = id => document.getElementById(id);
            const details = node('dd-eras-sec');
            if (details) details.ontoggle = () => { this._openEras = details.open; };
            const e = Er.of(mapId);
            const editing = () => (node('dd-eras-edit') ? node('dd-eras-edit').value : e && e.list[0].id);
            if (node('dd-eras-add')) node('dd-eras-add').onclick = async () => { const name = await D.Ui.prompt('A name for the era', 'Ruined', { title: 'Add an Era' }); if (name) { const id = this.addEra(mapId, name); this.setEditingEra(mapId, id); } };
            if (!e) return;
            node('dd-eras-edit').onchange = ev => this.setEditingEra(mapId, ev.target.value);
            node('dd-eras-onion').oninput = ev => { Er.onion = Number(ev.target.value) || 0; };
            const pick = () => this.changeEras(mapId, v => { v.eras.pick = { switchId: Number(node('dd-eras-switch').value) || 0, variableId: Number(node('dd-eras-var').value) || 0 }; }, 'Era switch');
            node('dd-eras-switch').onchange = pick; node('dd-eras-var').onchange = pick;
            const uids = () => (this.selectionItems ? this.selectionItems() : []).filter(d => d && d.uid).map(d => d.uid);
            node('dd-eras-only').onclick = () => { const u = uids(); if (u.length) this.setDoodadEras(mapId, u, editing()); else this.showToast('Pick doodads first.'); };
            node('dd-eras-every').onclick = () => { const u = uids(); if (u.length) this.setDoodadEras(mapId, u, null); };
            node('dd-eras-copy').onclick = async () => { const name = await D.Ui.prompt('A name for the copy', 'Ten years on', { title: 'Copy Era' }); if (name) this.setEditingEra(mapId, this.copyEra(mapId, editing(), name)); };
            node('dd-eras-delete').onclick = async () => {
                const id = editing(), era = e.list.find(x => x.id === id);
                const what = await D.Ui.choose(`Delete ${era ? era.name : 'this era'}? Its own doodads:`, [
                    { label: 'Delete Them', value: 'delete', kind: 'danger' }, { label: 'Keep Them in Every Era', value: 'all' }, { label: 'Cancel', value: null }], { title: 'Delete Era', cancelValue: null });
                if (what) { this.deleteEra(mapId, id, what); this.setEditingEra(mapId, null); }
            };
        }
    });
})();
