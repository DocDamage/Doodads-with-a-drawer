// @editor-only
//==========================================================
// SECTION 25S: SEAMLESS STEPS IN THE MAP PANEL (7.3.1)
//==========================================================
// Map settings → Walking to Neighbours: the game-wide switch and this map's opt-out. Neighbours are set in the map
// panel's own neighbour fields (World View shows them together).
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const world = DocsDoodads.World.settings().seamless || {};
        const off = mapSettings && mapSettings.seamless === 'off';
        const links = (mapSettings && mapSettings.neighbors) || {};
        const linked = ['east', 'west', 'north', 'south'].filter(s => links[s]).map(s => `${s} → Map ${links[s]}`).join(', ');
        return `
            <details id="dd-seamless-sec" ${this._openSeamless ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Walking to Neighbours</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <label><input type="checkbox" id="dd-seamless-world" ${world.enabled ? 'checked' : ''} /> In the whole game, walk off an edge onto the linked map with no fade</label>
                    <label><input type="checkbox" id="dd-seamless-off" ${off ? 'checked' : ''} /> Not from this map</label>
                    <div style="color: var(--dd-faint); line-height: 1.4;">${linked ? 'Linked: ' + escapeHtml(linked) + '.' : 'This map has no neighbours yet (set them above).'} The neighbour's tiles show past the edge when it uses the same tileset; its events show once you are there. Off-grid movement and the 3D view transfer as before.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-seamless-sec');
        if (details) details.ontoggle = () => { this._openSeamless = details.open; };
        const world = document.getElementById('dd-seamless-world'), off = document.getElementById('dd-seamless-off');
        if (world) world.onchange = e => this.setWorldSetting('seamless', { enabled: Boolean(e.target.checked) });
        if (off) off.onchange = e => this.setMapSetting('seamless', e.target.checked ? 'off' : undefined);
    }
});
