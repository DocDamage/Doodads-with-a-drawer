// @editor-only
//==========================================================
// SECTION 25E: ELEMENTS THAT SPREAD IN THE EDITOR (8.4.3)
//==========================================================
// Map settings → Fire and Rain: what burns here, what never does. Details → Elements: Burns, Lights fires, Puts out.
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const s = DocsDoodads.Elements.settings(mapSettings);
        return `
            <details id="dd-elements-sec" ${this._openElements ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Fire and Rain (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <label><input type="checkbox" id="dd-elements-on" ${s.enabled ? 'checked' : ''} /> Fire spreads with the wind; rain puts it out and leaves puddles</label>
                    <div>Dry ground: regions <input type="text" id="dd-elements-regions" value="${escapeHtml(s.fuelRegions)}" placeholder="e.g. 5" style="width: 60px;" />
                        terrain tags <input type="text" id="dd-elements-tags" value="${escapeHtml(s.fuelTags)}" placeholder="e.g. 1" style="width: 60px;" /></div>
                    <div>Fireproof regions <input type="text" id="dd-elements-proof" value="${escapeHtml(s.fireproofRegions)}" placeholder="e.g. 9" style="width: 60px;" /></div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Only what you mark burns: dry ground here, and doodads set to Burns in Details (they go to their state named Burnt). Start a fire with the Start Fire At command or a doodad that Lights fires. Watch for quest items and towns.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-elements-sec');
        if (details) details.ontoggle = () => { this._openElements = details.open; };
        const val = id => document.getElementById(id);
        const write = () => {
            const v = { enabled: Boolean(val('dd-elements-on') && val('dd-elements-on').checked), fuelRegions: (val('dd-elements-regions') || {}).value || '',
                fuelTags: (val('dd-elements-tags') || {}).value || '', fireproofRegions: (val('dd-elements-proof') || {}).value || '' };
            this.setMapSetting('elements', v.enabled || v.fuelRegions || v.fuelTags || v.fireproofRegions ? v : undefined);
            DocsDoodads.Elements._grid = null;
        };
        for (const id of ['dd-elements-on', 'dd-elements-regions', 'dd-elements-tags', 'dd-elements-proof']) { const el = val(id); if (el) el.onchange = write; }
    }
});

(function() {
    const W = DocsDoodads.Workspace;
    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || items.some(d => !d || d.line)) return all;
        return all.concat([{ title: 'Fire and Rain', fields: [
            { key: 'element', label: 'With fire', type: 'select', options: [{ value: '', label: 'Nothing' }, { value: 'burns', label: 'Burns (goes to its Burnt state)' },
                { value: 'lights', label: 'Lights fires beside it (a campfire)' }, { value: 'putsOut', label: 'Puts out fires (a well, a fountain)' }] }
        ] }]);
    };
    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) { return key === 'element' ? (d && d.element) || '' : get.call(this, d, key); };
    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (d && key === 'element') { if (['burns', 'lights', 'putsOut'].includes(value)) d.element = value; else delete d.element; DocsDoodads.Elements._grid = null; return; }
        return apply.call(this, d, key, value);
    };
})();
