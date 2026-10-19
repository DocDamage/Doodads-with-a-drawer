//==========================================================
// SECTION 25o: MINIMAP ON FLAT MAPS (MAP SETTINGS)
//==========================================================
// The map's own choice for the corner minimap when it is flat: follow World > Minimap, always, or never.
// (A 3D map uses the switch in its 3D View section.)
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const own = mapSettings && mapSettings.minimap;
        const value = own === 'on' || own === 'off' ? own : 'auto';
        const world = DocsDoodads.World.settings().minimap;
        const option = (v, label) => `<option value="${v}"${v === value ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        return `
            <details id="dd-minimap-sec" ${this._openMinimap ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Minimap (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Corner minimap when this map is flat
                        <select id="dd-minimap-mode" style="width: 100%;">${option('auto', `As World > Minimap (${world.flat ? 'on' : 'off'})`)}${option('on', 'On')}${option('off', 'Off')}</select></div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">${world.fog ? 'Fog of war is on: the minimap shows what the player has been near.' : 'Fog of war is off (World > Minimap).'} The Show / Hide Minimap and Explored Map commands change it during play.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-minimap-sec');
        if (details) details.ontoggle = () => { this._openMinimap = details.open; };
        const select = document.getElementById('dd-minimap-mode');
        if (select) select.onchange = e => this.setMapSetting('minimap', e.target.value === 'auto' ? undefined : e.target.value);
    }
});
