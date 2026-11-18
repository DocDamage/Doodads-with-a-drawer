// @editor-only
//==========================================================
// SECTION 25A: SOFT SHADOWS, GLOW OFF WALLS AND SHAFT SHADOWS IN THE EDITOR (7.3.7, 8.3.2)
//==========================================================
// Map settings → Soft Light: soft shadow edges and glow off walls for lamps whose light walls stop (World →
// Lighting). Details → Stops light shafts marks a doodad (a tree, a pillar) for Screen Looks → Light shafts.
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const s = DocsDoodads.SoftLight.normalize(mapSettings && mapSettings.softLight);
        return `
            <details id="dd-softlight-sec" ${this._openSoftLight ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Soft Light (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <label><input type="checkbox" id="dd-softlight-shadows" ${s.shadows ? 'checked' : ''} /> Soft shadow edges</label>
                    <label><input type="checkbox" id="dd-softlight-bounce" ${s.bounce ? 'checked' : ''} /> Glow off walls (light comes a little way round corners)</label>
                    <div style="color: var(--dd-faint); line-height: 1.4;">For lamps whose light walls stop (World → Lighting → Walls stop light). Players' Effects Quality: none at Low, soft edges at Medium, both at High. Flat maps.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-softlight-sec');
        if (details) details.ontoggle = () => { this._openSoftLight = details.open; };
        const write = () => {
            const shadows = document.getElementById('dd-softlight-shadows'), bounce = document.getElementById('dd-softlight-bounce');
            const value = { shadows: Boolean(shadows && shadows.checked), bounce: Boolean(bounce && bounce.checked) };
            this.setMapSetting('softLight', value.shadows || value.bounce ? value : undefined);
        };
        for (const id of ['dd-softlight-shadows', 'dd-softlight-bounce']) { const el = document.getElementById(id); if (el) el.onchange = write; }
    }
});

(function() {
    const W = DocsDoodads.Workspace;
    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || items.some(d => !d || d.line)) return all;
        return all.concat([{ title: 'Light Shafts', fields: [
            { key: 'shade', label: 'Stops light shafts (Screen Looks → Light shafts)', type: 'checkbox' }
        ] }]);
    };
    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) { return key === 'shade' ? Boolean(d && d.shade) : get.call(this, d, key); };
    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (d && key === 'shade') { if (value) d.shade = true; else delete d.shade; return; }
        return apply.call(this, d, key, value);
    };
})();
