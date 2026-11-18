// @editor-only
//==========================================================
// SECTION 25B: BRIDGES IN THE MAP PANEL (9.2.3)
//==========================================================
// Map settings → Bridges: the regions of a bridge's deck and of its ends. Paint them with the Regions tool; the
// legend says "bridge deck" and "bridge end".
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const s = DocsDoodads.Bridges.normalize(mapSettings && mapSettings.bridges) || { deck: '', ends: '' };
        return `
            <details id="dd-bridges-sec" ${this._openBridges ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Bridges (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Deck regions (walked on top, and under)
                        <input type="text" id="dd-bridges-deck" value="${escapeHtml(s.deck)}" placeholder="none" style="width: 100%;" /></div>
                    <div>End regions (where you step up and down)
                        <input type="text" id="dd-bridges-ends" value="${escapeHtml(s.ends)}" placeholder="none" style="width: 100%;" /></div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Stepping onto an end goes up onto the deck; from the ground straight under the deck stays below. On top you can't step off the side; below, only the ground tiles under the deck decide. Make the deck's tiles ☆ (over characters) in the tileset so whoever is below walks under them. An event starts on top with &lt;docs bridge: over&gt; in its note. Flat maps; Check Reach and Show Collision show the ground level.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-bridges-sec');
        if (details) details.ontoggle = () => { this._openBridges = details.open; };
        const write = () => {
            const deck = document.getElementById('dd-bridges-deck'), ends = document.getElementById('dd-bridges-ends');
            const value = DocsDoodads.Bridges.normalize({ deck: deck ? deck.value : '', ends: ends ? ends.value : '' });
            this.setMapSetting('bridges', value || undefined);
            if (this.renderRegionLegend) this.renderRegionLegend();
        };
        for (const id of ['dd-bridges-deck', 'dd-bridges-ends']) {
            const input = document.getElementById(id);
            if (input) input.onchange = write;
        }
    }
});
