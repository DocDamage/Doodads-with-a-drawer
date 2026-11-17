// @editor-only
Object.assign(DocsDoodads.Workspace, {
    climateRows(name) {
        const table = DocsDoodads.World.get('climate.seasons') || {};
        return Object.prototype.hasOwnProperty.call(table, name) && Array.isArray(table[name]) ? table[name].slice(0, 64).map(row => DocsDoodads.Climate.normalizeRow(row)) : [];
    },
    setClimateRows(name, rows) {
        const table = JSON.parse(JSON.stringify(DocsDoodads.World.get('climate.seasons') || {}));
        Object.defineProperty(table, name, { value: rows.slice(0, 64).map(row => DocsDoodads.Climate.normalizeRow(row)), writable: true, enumerable: true, configurable: true });
        this.setWorldSetting('climate.seasons', table);
        this.refreshInspector();
    },
    renderClimateEditor() {
        const C = DocsDoodads.Climate, names = DocsDoodads.World.settings().seasons.names || ['Spring'];
        return `<div style="font-size: 10px; color: var(--dd-faint);">Chances are weights out of 100; the remainder is clear. Each chosen spell lasts Hours. Forecasts assume the current season until an event changes it. The running clock counts days.</div>` + names.map((name, si) => {
            const rows = this.climateRows(name);
            return `<div style="margin-top: 8px;"><b>${escapeHtml(name)}</b><div style="display: grid; grid-template-columns: 1fr 44px 48px 44px 22px; gap: 3px; font-size: 10px;"><span>Weather</span><span>Power</span><span>Chance</span><span>Hours</span><span></span>${rows.map((row, ri) => {
                const number = (key, min, max, step) => `<input id="dd-cl-${si}-${ri}-${key}" type="number" min="${min}" max="${max}" step="${step}" value="${row[key]}" title="${escapeHtml(name)} ${key}" style="width: 100%; box-sizing: border-box;" />`;
                return `<select id="dd-cl-${si}-${ri}-type" title="${escapeHtml(name)} weather">${C.types.map(type => `<option value="${type}"${type === row.type ? ' selected' : ''}>${type === 'none' ? 'Clear' : type}</option>`).join('')}</select>${number('power', 0, 9, 1)}${number('chance', 0, 100, 1)}${number('hours', 0.25, 24, 0.25)}<button type="button" class="dd-btn" id="dd-cl-${si}-${ri}-del" title="Remove weather rule">×</button>`;
            }).join('')}</div><button type="button" class="dd-btn" id="dd-cl-${si}-add"${rows.length >= 64 ? ' disabled' : ''}>Add Weather</button></div>`;
        }).join('');
    },
    bindClimateEditor() {
        const names = DocsDoodads.World.settings().seasons.names || ['Spring'];
        names.forEach((name, si) => {
            this.climateRows(name).forEach((row, ri) => {
                for (const key of ['type', 'power', 'chance', 'hours']) {
                    const control = document.getElementById(`dd-cl-${si}-${ri}-${key}`);
                    if (control) control.onchange = () => {
                        const rows = this.climateRows(name);
                        if (!rows[ri]) return;
                        rows[ri][key] = key === 'type' ? control.value : Number(control.value);
                        this.setClimateRows(name, rows);
                    };
                }
                const remove = document.getElementById(`dd-cl-${si}-${ri}-del`);
                if (remove) remove.onclick = () => { const rows = this.climateRows(name); rows.splice(ri, 1); this.setClimateRows(name, rows); };
            });
            const add = document.getElementById(`dd-cl-${si}-add`);
            if (add) add.onclick = () => this.setClimateRows(name, this.climateRows(name).concat([{ type: 'rain', power: 5, chance: 25, hours: 6 }]));
        });
    },
    climateForecastCells() {
        const C = DocsDoodads.Climate;
        return C.forecast(7).map(day => `<span style="flex: 1; min-width: 42px; font-size: 10px;" title="${escapeHtml(C.describe([day]))}">Day ${day.day}<br>${escapeHtml(day.spans[0].type === 'none' ? 'Clear' : day.spans[0].type)}</span>`).join('');
    },
    renderClimateForecast() {
        return `<div id="dd-climate-forecast" aria-label="Seven day forecast" style="display: ${DocsDoodads.Climate.enabled() ? 'flex' : 'none'}; gap: 4px; flex-wrap: wrap;">${DocsDoodads.Climate.enabled() ? this.climateForecastCells() : ''}</div>`;
    },
    updateClimateForecast() {
        const el = document.getElementById('dd-climate-forecast');
        if (!el) return;
        const C = DocsDoodads.Climate, key = `${DocsDoodads.World._version}:${DocsDoodads.Calendar.day()}:${C.season()}:${C.seed()}`;
        el.style.display = C.enabled() ? 'flex' : 'none';
        if (this._climateForecastKey !== key) { this._climateForecastKey = key; el.innerHTML = C.enabled() ? this.climateForecastCells() : ''; }
    }
});
{
    const W = DocsDoodads.Workspace, sections = W.worldSections;
    W.worldSections = function() {
        return sections.call(this).concat([{ title: 'Climate', extra: 'climate', fields: [
            { key: 'climate.enabled', label: 'Weather follows the season and day', type: 'checkbox' },
            { key: 'climate.seed', label: 'Weather seed (new saves)', type: 'number', step: 1 }
        ] }]);
    };
    W.mapSections.push({ render() {
        const value = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).climate;
        return `<details><summary>Climate on this map</summary><label>Automatic weather<select id="dd-climate-map"><option value="world"${value !== 'none' ? ' selected' : ''}>Game climate</option><option value="none"${value === 'none' ? ' selected' : ''}>None (indoors)</option></select></label></details>`;
    }, bind() {
        const control = document.getElementById('dd-climate-map');
        if (control) control.onchange = () => this.setMapSetting('climate', control.value === 'none' ? 'none' : undefined);
    } });
}
