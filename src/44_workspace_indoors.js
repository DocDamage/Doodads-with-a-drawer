// @editor-only
//==========================================================
// SECTION 25N: INDOORS BY REGION IN THE MAP PANEL (9.2.2)
//==========================================================
// Map settings → Indoors: which regions are under a roof, how dark it is in there, and how loud the weather is
// heard from inside. Paint those regions on the floors with the Regions tool; the legend says "indoors".
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const I = DocsDoodads.Indoors;
        const s = I.normalize(mapSettings && mapSettings.indoors) || I.normalize(I.defaults);
        const dark = s.darkness === null ? '' : String(s.darkness);
        return `
            <details id="dd-indoors-sec" ${this._openIndoors ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Indoors (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Regions under a roof (numbers, e.g. 7, 8)
                        <input type="text" id="dd-indoors-regions" value="${escapeHtml(s.regions)}" placeholder="none" style="width: 100%;" /></div>
                    <div>Darkness inside (blank keeps the map's)
                        <input type="number" id="dd-indoors-dark" min="0" max="1" step="0.05" value="${escapeHtml(dark)}" style="width: 100%;" /></div>
                    <div>Weather heard inside <span id="dd-indoors-quiet-val">${Math.round(s.quiet * 100)}%</span>
                        <input type="range" id="dd-indoors-quiet" min="0" max="1" step="0.05" value="${s.quiet}" style="width: 100%;" /></div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Paint these regions on the floors (not the roofs) with the Regions tool. Rain and snow stop at them, doodads there don't lean in the wind or throw sun shadows, and lightning is dimmer while the player is inside. One darkness for the whole screen: the inside of a lit street at night is not darker tile by tile.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-indoors-sec');
        if (details) details.ontoggle = () => { this._openIndoors = details.open; };
        const write = change => {
            const I = DocsDoodads.Indoors;
            const own = Object.assign({}, I.normalize((DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).indoors) || I.normalize(I.defaults), change);
            const empty = !I.regionSet(own.regions).size && own.darkness === null && own.quiet === I.defaults.quiet;
            this.setMapSetting('indoors', empty ? undefined : I.normalize(own));
            I.invalidate();
            if (this.renderRegionLegend) this.renderRegionLegend();
        };
        const regions = document.getElementById('dd-indoors-regions');
        if (regions) regions.onchange = e => write({ regions: Array.from(DocsDoodads.Indoors.regionSet(e.target.value)).join(', ') });
        const dark = document.getElementById('dd-indoors-dark');
        if (dark) dark.onchange = e => write({ darkness: e.target.value === '' ? null : Number(e.target.value) });
        const quiet = document.getElementById('dd-indoors-quiet');
        if (quiet) {
            quiet.oninput = e => { const v = document.getElementById('dd-indoors-quiet-val'); if (v) v.textContent = Math.round(Number(e.target.value) * 100) + '%'; };
            quiet.onchange = e => write({ quiet: Number(e.target.value) });
        }
    }
});
