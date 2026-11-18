// @editor-only
//==========================================================
// SECTION 25R2: A WORLD THAT REMEMBERS IN THE EDITOR (8.4.2)
//==========================================================
// Map settings → Remembers: worn paths and footprints for this map. Details → Grows: the days each state lasts
// (for a doodad with states), so crops and saplings step on by the calendar.
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const s = DocsDoodads.Wear.settings(mapSettings);
        return `
            <details id="dd-remember-sec" ${this._openRemember ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Remembers (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <label><input type="checkbox" id="dd-remember-wear" ${s.wear ? 'checked' : ''} /> Worn paths where the player walks often</label>
                    <div>Steps before it shows <input type="number" id="dd-remember-threshold" min="1" max="200" value="${s.threshold}" style="width: 60px;" />
                        Path colour <input type="color" id="dd-remember-color" value="${escapeHtml(s.color)}" /></div>
                    <label><input type="checkbox" id="dd-remember-trails" ${s.trails ? 'checked' : ''} /> Footprints (anywhere while it snows)</label>
                    <div>On regions <input type="text" id="dd-remember-regions" value="${escapeHtml(s.trailRegions)}" placeholder="e.g. 3" style="width: 60px;" />
                        or terrain tags <input type="text" id="dd-remember-tags" value="${escapeHtml(s.trailTags)}" placeholder="e.g. 2" style="width: 60px;" /></div>
                    <div>They fill in after <input type="number" id="dd-remember-fade" min="1" max="600" value="${s.fade}" style="width: 60px;" /> seconds</div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Worn paths are kept in the save and ease back a little each day. Doodads grow by Details → Grows.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-remember-sec');
        if (details) details.ontoggle = () => { this._openRemember = details.open; };
        const val = id => document.getElementById(id);
        const write = () => {
            const v = {
                wear: Boolean(val('dd-remember-wear') && val('dd-remember-wear').checked), trails: Boolean(val('dd-remember-trails') && val('dd-remember-trails').checked),
                threshold: Number(val('dd-remember-threshold') && val('dd-remember-threshold').value) || DocsDoodads.Wear.defaults.threshold,
                color: (val('dd-remember-color') && val('dd-remember-color').value) || DocsDoodads.Wear.defaults.color,
                trailRegions: (val('dd-remember-regions') && val('dd-remember-regions').value) || '', trailTags: (val('dd-remember-tags') && val('dd-remember-tags').value) || '',
                fade: Number(val('dd-remember-fade') && val('dd-remember-fade').value) || DocsDoodads.Wear.defaults.fade
            };
            this.setMapSetting('remember', v.wear || v.trails ? v : undefined);
        };
        for (const id of ['dd-remember-wear', 'dd-remember-trails', 'dd-remember-threshold', 'dd-remember-color', 'dd-remember-regions', 'dd-remember-tags', 'dd-remember-fade']) {
            const el = val(id); if (el) el.onchange = write;
        }
    }
});

(function() {
    const W = DocsDoodads.Workspace, G = DocsDoodads.Growth;
    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || !items.every(d => d && DocsDoodads.States.has(d))) return all;
        return all.concat([{ title: 'Grows', fields: [
            { key: 'grow.days', label: 'Days each state lasts, in order (e.g. 2, 3, 4; blank: does not grow). Needs a Name.', type: 'text' }
        ] }]);
    };
    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) {
        if (key === 'grow.days') { const g = G.normalize(d && d.grow); return g ? g.days.join(', ') : ''; }
        return get.call(this, d, key);
    };
    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (d && key === 'grow.days') { const g = G.normalize({ days: value }); if (g) d.grow = g; else delete d.grow; return; }
        return apply.call(this, d, key, value);
    };
})();
