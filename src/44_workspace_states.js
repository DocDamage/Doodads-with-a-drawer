//==========================================================
// SECTION 25k: WORKSPACE DOODAD STATES AND TOUCH
//==========================================================
// Details > States: a doodad's named states (each with its own art, light and collision), a preview
// of each, and Details > Touch's common events.
DocsDoodads.Ui.css += `
.dd-states { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; min-width: 0; }
.dd-state-row { display: flex; flex-direction: column; gap: 4px; padding: 6px; border: 1px solid var(--dd-line-soft); border-radius: 4px; min-width: 0; }
.dd-state-row.dd-previewing { border-color: var(--dd-primary); }
.dd-state-row .dd-state-top { display: flex; gap: 4px; align-items: center; min-width: 0; }
.dd-state-row .dd-state-top button { flex-shrink: 0; }
.dd-state-row .dd-state-top input[type=text] { flex: 1; width: 0; min-width: 0; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px; border-radius: 3px; font-size: 11px; }
.dd-state-row .dd-state-art { font-size: 10px; color: var(--dd-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-state-row .dd-state-opts { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; font-size: 11px; }
.dd-state-row .dd-state-opts label { display: flex; align-items: center; gap: 4px; }
.dd-states .dd-state-buttons { display: flex; flex-wrap: wrap; gap: 4px; }
.dd-states button { font-size: 10px; padding: 2px 6px; }
.dd-states .dd-state-hint { font-size: 10px; color: var(--dd-faint); line-height: 1.4; overflow-wrap: anywhere; word-break: break-word; }
`;

Object.assign(DocsDoodads.Workspace, {
    // The project's common events as select options, with None first.
    commonEventOptions() {
        const list = typeof $dataCommonEvents !== 'undefined' && Array.isArray($dataCommonEvents) ? $dataCommonEvents : [];
        return [{ value: 0, label: 'None' }].concat(list.filter(e => e && e.id > 0)
            .map(e => ({ value: e.id, label: `${String(e.id).padStart(4, '0')}: ${e.name || '(unnamed)'}` })));
    },

    statesListHtml(items) {
        if (!items || items.length !== 1) {
            return '<div class="dd-states"><div class="dd-state-hint">Pick one doodad to edit its states.</div></div>';
        }
        const d = items[0];
        const S = DocsDoodads.States;
        const list = S.list(d);
        const preview = S.previewOf(d);
        const fileName = path => String(path || '').split('/').pop();
        // Sound effects by name (audio/se), and the effects made in the Effects Maker or built in.
        const seNames = this.audioFileOptions().map(o => o.value).filter(v => v.indexOf('se/') === 0).map(v => v.slice(3));
        const option = (value, label, chosen) => `<option value="${escapeHtml(value)}"${value === chosen ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        const seOptions = chosen => option('', 'None', chosen || '') + seNames.map(n => option(n, n, chosen)).join('')
            + (chosen && !seNames.includes(chosen) ? option(chosen, chosen, chosen) : '');
        const vfxList = DocsDoodads.Vfx.library().concat(DocsDoodads.Vfx.builtIns);
        const shapeOptions = chosen => option('', 'Its own', chosen || '') + Object.keys(DocsDoodads.Collision.presets).filter(k => k !== 'custom').map(k => option(k, k, chosen)).join('');
        const vfxOptions = chosen => option('', 'None', chosen || '') + vfxList.map(v => option(v.id, v.name, chosen)).join('');
        const rows = list.map((st, i) => `
            <div class="dd-state-row${preview === i ? ' dd-previewing' : ''}" data-state="${i}">
                <div class="dd-state-top">
                    <span style="font-size: 10px; color: var(--dd-faint);">${i}</span>
                    <input type="text" id="dd-state-name-${i}" value="${escapeHtml(String(st.name || ''))}" placeholder="State name" aria-label="State ${i} name" />
                    <button type="button" id="dd-state-preview-${i}" title="Show this state on the map while editing">${preview === i ? 'Showing' : 'Preview'}</button>
                    ${i > 0 ? `<button type="button" id="dd-state-del-${i}" title="Remove this state">×</button>` : ''}
                </div>
                <div class="dd-state-art" title="${escapeHtml(String(st.path || ''))}">Art: ${i > 0 && st.path ? escapeHtml(fileName(st.path)) : 'its own'}</div>
                <div class="dd-state-opts">
                    <label><input type="checkbox" id="dd-state-light-${i}" ${st.light !== false ? 'checked' : ''} /> Light</label>
                    <label><input type="checkbox" id="dd-state-col-${i}" ${st.collision !== false ? 'checked' : ''} /> Collision</label>
                    ${i > 0 ? `<button type="button" id="dd-state-art-${i}" title="Use the picture picked in the Item Bag">Use Picked Art</button>` : ''}
                    ${i > 0 && st.path ? `<button type="button" id="dd-state-own-${i}" title="Show the doodad's own picture in this state">Own Art</button>` : ''}
                </div>
                <div class="dd-state-opts">
                    <label title="A sound effect when it goes into this state">Sound <select id="dd-state-sound-${i}">${seOptions(st.sound)}</select></label>
                    <label title="An effect from the Effects Maker when it goes into this state">Effect <select id="dd-state-vfx-${i}">${vfxOptions(st.vfx)}</select></label>
                    <label title="The collision shape in this state (an open gate keeps only its posts)">Shape <select id="dd-state-collisionPreset-${i}">${shapeOptions(st.collisionPreset)}</select></label>
                    <label title="Seconds before it goes back to the state it was in (0 = it stays)">Back after <input type="number" min="0" step="0.5" id="dd-state-revert-${i}" value="${Number(st.revert) || 0}" style="width: 52px;" /> s</label>
                </div>
            </div>`).join('');
        const name = String(d.name || '').trim();
        const hint = list.length > 1
            ? (name
                ? `Events: <b>Set Doodad State</b> (plugin command) with "${escapeHtml(name)}", or a script condition DocsDoodads.WorldState.is('${escapeHtml(name.replace(/'/g, "\\'"))}', '${escapeHtml(String(list[1].name || '1').replace(/'/g, "\\'"))}').`
                : 'Give it a Name so events can set and check its state.')
            : 'State 0 is the doodad as placed. Add a state for another look (open, lit, broken), with or without its light and collision.';
        return `<div class="dd-states">${rows}
            <div class="dd-state-buttons">
                <button type="button" id="dd-state-add">+ Add State</button>
                ${preview >= 0 ? '<button type="button" id="dd-state-stop">Stop Preview</button>' : ''}
            </div>
            <div class="dd-state-hint">${hint}</div></div>`;
    },

    // Every edit to the list is one undo step.
    editStates(d, mutate) {
        this.editDoodads([d], x => {
            x.states = Object.assign({}, DocsDoodads.States.defaults, x.states || {});
            x.states.list = Array.isArray(x.states.list) ? x.states.list.map(s => Object.assign({}, s)) : [];
            mutate(x.states.list, x);
            if (x.states.list.length < 2) delete x.states;
        }, 'edit_states');
        this.refreshInspector();
    },

    addState(d) {
        const at = DocsDoodads.States.list(d).length;
        this.editStates(d, list => {
            if (list.length === 0) list.push({ name: 'As placed', path: '', light: true, collision: true });
            list.push({ name: `State ${list.length}`, path: '', light: true, collision: true });
        });
        return Math.max(1, at);
    },

    removeState(d, index) {
        if (!(index > 0)) return;
        const S = DocsDoodads.States;
        if (S.previewOf(d) >= index) S.setPreview(d, -1);
        this.editStates(d, list => { list.splice(index, 1); });
        this.refreshSpriteset(true);
    },

    setStateField(d, index, field, value) {
        this.editStates(d, list => {
            if (!list[index]) return;
            if (field === 'name') list[index].name = String(value || '').trim();
            else if (field === 'art') {
                if (value) Object.assign(list[index], { path: value.path, w: value.w || 0, h: value.h || 0 });
                else { delete list[index].path; delete list[index].w; delete list[index].h; }
            } else if (field === 'sound' || field === 'vfx' || field === 'collisionPreset') {
                const v = String(value || '').trim();
                if (v) list[index][field] = v; else delete list[index][field];
            } else if (field === 'revert') {
                const v = Math.max(0, Number(value) || 0);
                if (v > 0) list[index].revert = v; else delete list[index].revert;
            } else list[index][field] = Boolean(value);
        });
        this.refreshSpriteset(true);
    },

    // The Item Bag's picked picture for a state, or null (with a toast) when none is picked.
    pickedStateArt() {
        const a = this.selectedAsset;
        if (!a || !a.path || a.type === 'prefab' || a.category === 'Audio') {
            this.showToast('Pick a picture in the Item Bag first.');
            return null;
        }
        return { path: a.path, w: a.frameW || a.width || 0, h: a.frameH || a.height || 0 };
    },

    previewState(d, index) {
        const S = DocsDoodads.States;
        S.setPreview(d, S.previewOf(d) === index ? -1 : index);
        this.refreshSpriteset(true);
        this.refreshInspector();
    },

    bindStatesList(items) {
        if (!items || items.length !== 1 || typeof document === 'undefined') return;
        const d = items[0];
        const el = id => document.getElementById(id);
        const list = DocsDoodads.States.list(d);
        list.forEach((st, i) => {
            const name = el(`dd-state-name-${i}`);
            if (name) name.onchange = () => this.setStateField(d, i, 'name', name.value);
            const light = el(`dd-state-light-${i}`);
            if (light) light.onchange = () => this.setStateField(d, i, 'light', light.checked);
            const col = el(`dd-state-col-${i}`);
            if (col) col.onchange = () => this.setStateField(d, i, 'collision', col.checked);
            const preview = el(`dd-state-preview-${i}`);
            if (preview) preview.onclick = () => this.previewState(d, i);
            const del = el(`dd-state-del-${i}`);
            if (del) del.onclick = () => this.removeState(d, i);
            const art = el(`dd-state-art-${i}`);
            if (art) art.onclick = () => { const a = this.pickedStateArt(); if (a) this.setStateField(d, i, 'art', a); };
            const own = el(`dd-state-own-${i}`);
            if (own) own.onclick = () => this.setStateField(d, i, 'art', null);
            for (const field of ['sound', 'vfx', 'revert', 'collisionPreset']) {
                const input = el(`dd-state-${field}-${i}`);
                if (input) input.onchange = () => this.setStateField(d, i, field, input.value);
            }
        });
        const add = el('dd-state-add');
        if (add) add.onclick = () => this.addState(d);
        const stop = el('dd-state-stop');
        if (stop) stop.onclick = () => this.previewState(d, -1);
    }
});
