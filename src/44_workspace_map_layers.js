//==========================================================
// SECTION 25r: BACKGROUND AND OVERLAY LAYERS (MAP SETTINGS)
//==========================================================
// The map's picture layers for flat maps (DocsDoodads.MapLayers): a row each with its picture (from
// img/parallaxes, or fog banks), where it goes, how it follows the camera, scrolls, zooms, repeats and
// blends. The map shows changes straight away.
Object.assign(DocsDoodads.Workspace, {
    mapLayers2d() {
        const list = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).layers2d;
        return Array.isArray(list) ? JSON.parse(JSON.stringify(list)) : [];
    },

    setMapLayers2d(list) {
        this.setMapSetting('layers2d', list.length ? list.map(l => DocsDoodads.MapLayers.normalize(l)) : undefined);
    },

    addMapLayer2d(image) {
        const list = this.mapLayers2d();
        const fog = image === '#fog';
        list.push(DocsDoodads.MapLayers.normalize(fog
            ? { image: '#fog', place: 'front', follow: 1, scrollX: 0.3, zoom: 2, opacity: 0.45, blend: 'screen', wind: true }
            : { image: image || '', place: 'back' }));
        this.setMapLayers2d(list);
        return list.length - 1;
    },

    // The pictures in img/parallaxes the Item Bag knows, for the picture box's suggestions.
    parallaxNames() {
        const list = (DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.list) || [];
        return list.map(a => String(a.path || '').replace(/\\/g, '/')).filter(p => /^img\/parallaxes\//i.test(p))
            .map(p => p.replace(/^img\/parallaxes\//i, '').replace(/\.(png|webp)$/i, '')).sort();
    }
});

DocsDoodads.Workspace.mapSections.push({
    render() {
        const L = DocsDoodads.MapLayers;
        const layers = this.mapLayers2d().map(l => L.normalize(l));
        const option = (value, label, current) => `<option value="${escapeHtml(String(value))}"${String(value) === String(current) ? ' selected' : ''}>${escapeHtml(label)}</option>`;
        const num = (id, value, step, title) => `<input type="number" id="${id}" value="${value}" step="${step}" title="${escapeHtml(title)}" style="width: 100%;" />`;
        const rows = layers.map((l, i) => `
            <div style="border: 1px solid var(--dd-line-soft); border-radius: 8px; padding: 5px; display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; gap: 4px; align-items: center;">
                    <input type="text" id="dd-ml-${i}-image" list="dd-ml-pictures" value="${escapeHtml(l.image)}" placeholder="img/parallaxes picture, or #fog" title="Picture (img/parallaxes), or #fog for fog banks" style="flex: 1; min-width: 0;" />
                    <button class="dd-btn" id="dd-ml-${i}-up" type="button" title="Draw it earlier (further back)" style="padding: 2px 6px;"${i === 0 ? ' disabled' : ''}>↑</button>
                    <button class="dd-btn" id="dd-ml-${i}-del" type="button" title="Remove this layer" style="padding: 2px 6px;">${DocsDoodads.Ui.icon('trash', 1)}</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: var(--dd-muted);">
                    <div>Where<select id="dd-ml-${i}-place" style="width: 100%;">${L.places.map(p => option(p.value, p.label, l.place)).join('')}</select></div>
                    <div>Blend<select id="dd-ml-${i}-blend" style="width: 100%;">${L.blends.map(b => option(b.value, b.label, l.blend)).join('')}</select></div>
                    <div>Follows the camera${num(`dd-ml-${i}-follow`, l.follow, 0.05, '0 = fixed to the screen, 1 = moves with the map, 0.5 = halfway (far away)')}</div>
                    <div>Zoom${num(`dd-ml-${i}-zoom`, l.zoom, 0.1, 'How big the picture is drawn')}</div>
                    <div>Scrolls across (px/frame)${num(`dd-ml-${i}-scrollX`, l.scrollX, 0.1, 'Moves on its own; negative is left')}</div>
                    <div>Scrolls down (px/frame)${num(`dd-ml-${i}-scrollY`, l.scrollY, 0.1, 'Moves on its own; negative is up')}</div>
                    <div>Opacity${num(`dd-ml-${i}-opacity`, l.opacity, 0.05, '0 to 1')}</div>
                    <div style="display: flex; flex-direction: column; gap: 2px; justify-content: flex-end;">
                        <label style="display: flex; gap: 4px; align-items: center;"><input type="checkbox" id="dd-ml-${i}-loopX" ${l.loopX ? 'checked' : ''} /> Repeat across</label>
                        <label style="display: flex; gap: 4px; align-items: center;"><input type="checkbox" id="dd-ml-${i}-loopY" ${l.loopY ? 'checked' : ''} /> Repeat down</label>
                        <label style="display: flex; gap: 4px; align-items: center;" title="World > Weather on Flat Maps"><input type="checkbox" id="dd-ml-${i}-wind" ${l.wind ? 'checked' : ''} /> Drifts with the wind</label>
                    </div>
                </div>
            </div>`).join('');
        return `
            <details id="dd-ml-sec" ${this._openMapLayers ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Background and Overlay Layers (flat map)</summary>
                <datalist id="dd-ml-pictures">${['#fog'].concat(this.parallaxNames()).map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
                    ${rows || '<div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">No layers. Add distant mountains behind the tiles, or clouds and fog over them; each scrolls on its own.</div>'}
                    <div style="display: flex; gap: 4px;">
                        <button class="dd-btn" id="dd-ml-add" type="button">${DocsDoodads.Ui.icon('plus', 1)} Add a Layer</button>
                        <button class="dd-btn" id="dd-ml-add-fog" type="button" title="Soft fog banks drifting over the map">${DocsDoodads.Ui.icon('plus', 1)} Fog Banks</button>
                    </div>
                </div>
            </details>`;
    },
    bind() {
        const byId = id => document.getElementById(id);
        const details = byId('dd-ml-sec');
        if (details) details.ontoggle = () => { this._openMapLayers = details.open; };
        const again = () => { this._openMapLayers = true; this.refreshInspector(); };
        const add = byId('dd-ml-add');
        if (add) add.onclick = () => {
            const names = this.parallaxNames();
            this.addMapLayer2d(names[0] || '');
            again();
        };
        const fog = byId('dd-ml-add-fog');
        if (fog) fog.onclick = () => { this.addMapLayer2d('#fog'); again(); };
        this.mapLayers2d().forEach((l, i) => {
            const change = (field, value) => { const list = this.mapLayers2d(); list[i] = Object.assign({}, list[i], { [field]: value }); this.setMapLayers2d(list); };
            for (const field of ['image', 'place', 'blend']) {
                const input = byId(`dd-ml-${i}-${field}`);
                if (input) input.onchange = e => change(field, e.target.value);
            }
            for (const field of ['follow', 'zoom', 'scrollX', 'scrollY', 'opacity']) {
                const input = byId(`dd-ml-${i}-${field}`);
                if (input) input.onchange = e => { if (String(e.target.value).trim() !== '') change(field, Number(e.target.value)); };
            }
            for (const field of ['loopX', 'loopY', 'wind']) {
                const input = byId(`dd-ml-${i}-${field}`);
                if (input) input.onchange = e => change(field, Boolean(e.target.checked));
            }
            const up = byId(`dd-ml-${i}-up`);
            if (up) up.onclick = () => { const list = this.mapLayers2d(); if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; this.setMapLayers2d(list); } again(); };
            const del = byId(`dd-ml-${i}-del`);
            if (del) del.onclick = () => { const list = this.mapLayers2d(); list.splice(i, 1); this.setMapLayers2d(list); again(); };
        });
    }
});

// The map's camera bounds: while the player stands on one of these regions, the camera stays inside the
// area that region covers (flat maps; World > Camera on Flat Maps has the easing).
DocsDoodads.Workspace.mapSections.push({
    render(mapSettings) {
        const list = mapSettings && Array.isArray(mapSettings.cameraBounds) ? mapSettings.cameraBounds : [];
        return `
            <details id="dd-cam2d-sec" ${this._openCam2d ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Camera (flat map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Keep the camera inside these regions' areas (numbers, e.g. 5, 7)
                        <input type="text" id="dd-cam2d-regions" value="${escapeHtml(list.join(', '))}" style="width: 100%;" /></div>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Paint a room or corridor with a region (Regions tool) and list it here: while the player is on it, the view stops at its edges. The 2D Camera Path and 2D Camera Follow commands move it in cutscenes.</div>
                </div>
            </details>`;
    },
    bind() {
        const details = document.getElementById('dd-cam2d-sec');
        if (details) details.ontoggle = () => { this._openCam2d = details.open; };
        const input = document.getElementById('dd-cam2d-regions');
        if (input) input.onchange = e => {
            const ids = String(e.target.value || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0 && n < 256);
            this.setMapSetting('cameraBounds', ids.length ? Array.from(new Set(ids)) : undefined);
        };
    }
});
