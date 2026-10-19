//==========================================================
// SECTION 25n: SCREEN LOOKS BY TIME AND BY REGION
//==========================================================
// In the Screen Looks card, under the effects: looks that blend in by the clock (game-wide) and while the
// player is on a region (game-wide, or this map's own), each a preset or a copy of the look above, with a
// strength. A map can leave the time looks out (interiors). The rules are DocsDoodads.PostFX.Blends.
Object.assign(DocsDoodads.Workspace, {
    previewRegionLook: 0,

    timeText(minutes) {
        const m = DocsDoodads.PostFX.Blends.wrap(minutes);
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    },

    // "18:30" or "6:05" to minutes; null when it isn't a time.
    parseTimeText(text) {
        const m = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(String(text || ''));
        if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
        return Number(m[1]) * 60 + Number(m[2]);
    },

    timeLooks() {
        const list = DocsDoodads.World.raw('postfx.times');
        return Array.isArray(list) ? list.map(e => DocsDoodads.PostFX.Blends.normalizeTime(e)) : [];
    },

    setTimeLooks(list) {
        this.setWorldSetting('postfx.times', list.length ? list.map(e => DocsDoodads.PostFX.Blends.normalizeTime(e)) : undefined);
    },

    mapLookBlends() {
        const own = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).lookBlends;
        return own && typeof own === 'object' ? own : {};
    },

    setMapLookBlends(next) {
        const clean = {};
        if (next.noTimes) clean.noTimes = true;
        if (Array.isArray(next.regions) && next.regions.length) clean.regions = next.regions.map(e => DocsDoodads.PostFX.Blends.normalizeRegion(e));
        this.setMapSetting('lookBlends', Object.keys(clean).length ? clean : undefined);
    },

    // The region looks being edited: game-wide, or this map's own.
    regionLooks(target) {
        const B = DocsDoodads.PostFX.Blends;
        const list = target === 'map' ? this.mapLookBlends().regions : DocsDoodads.World.raw('postfx.regions');
        return Array.isArray(list) ? list.map(e => B.normalizeRegion(e)) : [];
    },

    setRegionLooks(target, list) {
        const B = DocsDoodads.PostFX.Blends;
        if (target === 'map') this.setMapLookBlends(Object.assign({}, this.mapLookBlends(), { regions: list }));
        else this.setWorldSetting('postfx.regions', list.length ? list.map(e => B.normalizeRegion(e)) : undefined);
    },

    // An entry's look becomes a copy of the look shown above it (the game-wide look, or this map's).
    lookAboveFor(target) {
        const P = DocsDoodads.PostFX;
        const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
        if (target === 'map' && mine && mine.mode === 'custom' && mine.look) return P.normalizeLook(mine.look);
        return P.normalizeLook(DocsDoodads.World.get('postfx.look'));
    },

    withLookChoice(entry, value, target) {
        const out = Object.assign({}, entry);
        delete out.look;
        delete out.preset;
        if (value === '__own') out.look = entry.look || this.lookAboveFor(target);
        else if (value === '__above') out.look = this.lookAboveFor(target);
        else out.preset = value;
        return out;
    },

    lookChoiceHtml(id, entry) {
        const P = DocsDoodads.PostFX;
        const current = entry.look ? '__own' : entry.preset;
        const option = (value, label) => `<option value="${escapeHtml(value)}"${value === current ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        return `<select id="${id}" title="The look to blend in">${P.presets.map(p => option(p.id, p.label)).join('')}` +
            `${entry.look ? option('__own', 'Its own look') : ''}${option('__above', 'Copy the look above')}</select>`;
    },

    lookBlendsHtml(target) {
        const rowStyle = 'display: grid; gap: 4px; align-items: center; font-size: 10px; color: var(--dd-muted);';
        const amount = (id, value) => `<input type="range" id="${id}" min="0" max="1" step="0.05" value="${value}" title="Strength: ${Math.round(value * 100)}%" />`;
        const times = this.timeLooks();
        const regions = this.regionLooks(target);
        const own = this.mapLookBlends();
        const timePart = target === 'map'
            ? `<label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dd-text);" title="Off for interiors: the time of day's looks leave this map alone">
                <input type="checkbox" id="dd-lb-times-on" ${own.noTimes ? '' : 'checked'} /> Looks by time of day on this map</label>`
            : `<div style="font-size: 11px; font-weight: bold; color: var(--dd-muted);">Looks by time of day</div>
               ${times.map((e, i) => `
                <div style="${rowStyle} grid-template-columns: 58px 58px 44px 1fr;">
                    <input type="time" id="dd-lb-t-${i}-from" value="${this.timeText(e.from)}" title="From" />
                    <input type="time" id="dd-lb-t-${i}-to" value="${this.timeText(e.to)}" title="To" />
                    <input type="number" id="dd-lb-t-${i}-fade" value="${e.fade}" min="0" max="720" title="Fade in and out (minutes of game time)" />
                    ${this.lookChoiceHtml(`dd-lb-t-${i}-look`, e)}
                </div>
                <div style="${rowStyle} grid-template-columns: 1fr auto;">${amount(`dd-lb-t-${i}-amount`, e.amount)}
                    <button class="dd-btn" id="dd-lb-t-${i}-del" type="button" title="Remove this time" style="padding: 2px 6px;">${DocsDoodads.Ui.icon('trash', 1)}</button></div>`).join('')}
               ${times.length ? '' : '<div style="font-size: 10px; color: var(--dd-faint);">None yet: add one for a warm dusk or a blue night. The clock bar previews it.</div>'}
               <button class="dd-btn" id="dd-lb-add-time" type="button">${DocsDoodads.Ui.icon('plus', 1)} Add a Time</button>`;
        return `
            <div id="dd-lb" style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; display: flex; flex-direction: column; gap: 5px;">
                ${timePart}
                <div style="font-size: 11px; font-weight: bold; color: var(--dd-muted); margin-top: 4px;">Looks by region ${target === 'map' ? '(this map: these win over the game-wide ones)' : '(every map)'}</div>
                ${regions.map((e, i) => `
                <div style="${rowStyle} grid-template-columns: 44px 44px 1fr;">
                    <input type="number" id="dd-lb-r-${i}-region" value="${e.region}" min="1" max="255" title="Region number" />
                    <input type="number" id="dd-lb-r-${i}-fade" value="${e.fade}" min="0" max="30" step="0.5" title="Fade in and out (seconds)" />
                    ${this.lookChoiceHtml(`dd-lb-r-${i}-look`, e)}
                </div>
                <div style="${rowStyle} grid-template-columns: 1fr auto auto;">${amount(`dd-lb-r-${i}-amount`, e.amount)}
                    <button class="dd-btn${this.previewRegionLook === e.region ? ' dd-btn-primary' : ''}" id="dd-lb-r-${i}-preview" type="button" title="See this region's look now (while editing)" style="padding: 2px 6px;">${DocsDoodads.Ui.icon('eye', 1)}</button>
                    <button class="dd-btn" id="dd-lb-r-${i}-del" type="button" title="Remove this region" style="padding: 2px 6px;">${DocsDoodads.Ui.icon('trash', 1)}</button></div>`).join('')}
                ${regions.length ? '' : '<div style="font-size: 10px; color: var(--dd-faint);">None yet: paint a region (Regions tool) and give it a look, like a cold crypt.</div>'}
                <button class="dd-btn" id="dd-lb-add-region" type="button">${DocsDoodads.Ui.icon('plus', 1)} Add a Region</button>
            </div>`;
    },

    bindLookBlends(target) {
        const byId = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        const B = DocsDoodads.PostFX.Blends;
        const again = () => this.refreshPostFxBuilder();
        on('dd-lb-times-on', 'onchange', e => { this.setMapLookBlends(Object.assign({}, this.mapLookBlends(), { noTimes: !e.target.checked })); again(); });
        on('dd-lb-add-time', 'onclick', () => { this.setTimeLooks(this.timeLooks().concat([Object.assign({}, B.timeDefaults)])); again(); });
        this.timeLooks().forEach((e, i) => {
            const change = edit => { const list = this.timeLooks(); list[i] = edit(list[i]); this.setTimeLooks(list); again(); };
            const time = key => ev => { const m = this.parseTimeText(ev.target.value); if (m !== null) change(x => Object.assign(x, { [key]: m })); };
            on(`dd-lb-t-${i}-from`, 'onchange', time('from'));
            on(`dd-lb-t-${i}-to`, 'onchange', time('to'));
            on(`dd-lb-t-${i}-fade`, 'onchange', ev => change(x => Object.assign(x, { fade: Number(ev.target.value) || 0 })));
            on(`dd-lb-t-${i}-look`, 'onchange', ev => change(x => this.withLookChoice(x, ev.target.value, 'world')));
            on(`dd-lb-t-${i}-amount`, 'onchange', ev => change(x => Object.assign(x, { amount: Number(ev.target.value) })));
            on(`dd-lb-t-${i}-del`, 'onclick', () => { const list = this.timeLooks(); list.splice(i, 1); this.setTimeLooks(list); again(); });
        });
        on('dd-lb-add-region', 'onclick', () => {
            const list = this.regionLooks(target);
            const used = new Set(list.map(e => e.region));
            let region = 1;
            while (used.has(region) && region < 255) region++;
            this.setRegionLooks(target, list.concat([Object.assign({}, B.regionDefaults, { region })]));
            again();
        });
        this.regionLooks(target).forEach((e, i) => {
            const change = edit => { const list = this.regionLooks(target); list[i] = edit(list[i]); this.setRegionLooks(target, list); again(); };
            on(`dd-lb-r-${i}-region`, 'onchange', ev => change(x => Object.assign(x, { region: Number(ev.target.value) || 1 })));
            on(`dd-lb-r-${i}-fade`, 'onchange', ev => change(x => Object.assign(x, { fade: Number(ev.target.value) || 0 })));
            on(`dd-lb-r-${i}-look`, 'onchange', ev => change(x => this.withLookChoice(x, ev.target.value, target)));
            on(`dd-lb-r-${i}-amount`, 'onchange', ev => change(x => Object.assign(x, { amount: Number(ev.target.value) })));
            on(`dd-lb-r-${i}-preview`, 'onclick', () => { this.previewRegionLook = this.previewRegionLook === e.region ? 0 : e.region; again(); });
            on(`dd-lb-r-${i}-del`, 'onclick', () => {
                const list = this.regionLooks(target);
                if (this.previewRegionLook === e.region) this.previewRegionLook = 0;
                list.splice(i, 1);
                this.setRegionLooks(target, list);
                again();
            });
        });
    }
});
