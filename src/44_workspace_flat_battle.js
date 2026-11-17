// @editor-only
DocsDoodads.Workspace.mapSections.push({
    render(settings) {
        return `<details style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
            <summary style="font-size: 11px; font-weight: bold;">Battle background (flat map)</summary>
            <label style="font-size: 10px;"><input id="dd-flat-battleback" type="checkbox"${settings.battleBack === true ? ' checked' : ''} /> Battles show this map, with its lights and look</label>
            <div style="font-size: 10px; color: var(--dd-faint);">Characters and the corner map are hidden. A named battleback always wins. 3D maps use the choice under 3D View.</div>
        </details>`;
    },
    bind() {
        const control = document.getElementById('dd-flat-battleback');
        if (control) control.onchange = () => this.setMapSetting('battleBack', control.checked ? true : undefined);
    }
});
