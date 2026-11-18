// @editor-only
//==========================================================
// SECTION 25H2: FROM A MAP FILE (8.5.5)
//==========================================================
// Map → From a Map File: an OpenStreetMap extract (.osm) or GeoJSON the user downloaded, and optionally a grey
// height picture, become this map's tiles through Picture to Map's building step (its kinds and tiles per class).
// The card says the area's real size and how much a tile is before anything is built. Nothing is downloaded here.
// Apply writes the OpenStreetMap credit into CREDITS_MAPS.txt and says so.
(function() {
    const D = DocsDoodads, W = D.Workspace, M = D.MapFrom;

    Object.assign(W, {
        readMapFileText(name, text) {
            return /\.osm$/i.test(name) || /^\s*<\?xml|^\s*<osm/i.test(text) ? M.readOsm(text) : M.readGeoJson(text);
        },

        // { features, box, metres, plan } for the current state.
        geoPlan(state) {
            if (!state.features || !state.features.length) return null;
            const kind = this.mapKinds().find(k => k.id === state.kindId) || this.mapKinds()[0];
            const box = M.geoBox(state.features), metres = M.geoMetres(box);
            const size = { w: $gameMap.width(), h: $gameMap.height() };
            const plan = M.finish(M.fromGeo(state.features, state.heights, box, kind, size), kind);
            return { kind, box, metres, size, plan };
        },

        // The credit, once, in CREDITS_MAPS.txt.
        writeMapCredit() {
            const FS = D.FS, file = 'CREDITS_MAPS.txt';
            const now = FS.existsSync(file) ? FS.fs.readFileSync(file, 'utf8') : '';
            if (now.includes('OpenStreetMap contributors')) return false;
            FS.fs.writeFileSync(file, (now ? now.replace(/\s*$/, '\n\n') : '') + M.geoCredit + '\n');
            return true;
        },

        applyGeoPlan(state) {
            const made = this.geoPlan(state);
            if (!made) return false;
            this.applyMapFrom(made.plan, made.kind);
            this.writeMapCredit();
            this.showToast('Built from the map file. CREDITS_MAPS.txt has the OpenStreetMap credit: show it in your game\'s credits.');
            return true;
        },

        openGeoCard() {
            if (typeof document === 'undefined' || !document.createElement) return null;
            const state = this._geo = this._geo || { kindId: 'town', features: null, heights: null, name: '' };
            let card = document.getElementById('dd-geo-card');
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-geo-card'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;top:80px;right:20px;width:360px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;';
                document.body.appendChild(card);
            }
            const render = () => {
                const made = this.geoPlan(state);
                const kinds = this.mapKinds().map(k => `<option value="${escapeHtml(k.id)}"${k.id === state.kindId ? ' selected' : ''}>${escapeHtml(k.name)}</option>`).join('');
                const sizeText = made ? `The area is ${Math.round(made.metres.w)} m × ${Math.round(made.metres.h)} m; on this ${made.size.w} × ${made.size.h} map a tile is about ${Math.max(1, Math.round(made.metres.w / made.size.w))} m.` : '';
                card.innerHTML = `<div class="dd-panel-head">From a Map File <button class="dd-btn" id="dd-geo-close" type="button">Close</button></div>
                    <div style="color:var(--dd-muted);margin-bottom:6px;">Download an extract yourself (an .osm file from openstreetmap.org's Export, or GeoJSON) and pick it here. Nothing is downloaded by the editor.</div>
                    <label>Map file <input id="dd-geo-file" type="file" accept=".osm,.geojson,.json"></label>
                    <label>Heights (a grey picture, optional) <input id="dd-geo-heights" type="file" accept="image/*"></label>
                    <label>Kind of map <select id="dd-geo-kind">${kinds}</select></label>
                    ${state.features ? `<div>${state.features.length} features read from ${escapeHtml(state.name)}.</div>` : ''}
                    ${sizeText ? `<div style="color:var(--dd-muted);">${escapeHtml(sizeText)}</div>` : ''}
                    ${made ? `<div>${made.plan.features.filter(f => f.type === 'bridge').length} bridges, ${made.plan.cells.filter(Boolean).length} tiles to build. Tiles for each class come from Picture to Map's choices.</div>` : ''}
                    <button class="dd-btn dd-btn-primary" id="dd-geo-apply" type="button"${made ? '' : ' disabled'}>Apply</button>
                    <div style="color:var(--dd-faint);margin-top:6px;">OpenStreetMap's data needs "© OpenStreetMap contributors" in your game: Apply writes it into CREDITS_MAPS.txt.</div>`;
                const node = id => document.getElementById(id);
                node('dd-geo-close').onclick = () => { if (card.parentNode) card.parentNode.removeChild(card); };
                node('dd-geo-kind').onchange = e => { state.kindId = e.target.value; render(); };
                node('dd-geo-file').onchange = async e => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    try { state.features = this.readMapFileText(file.name, await file.text()); state.name = file.name; } catch (error) { this.showToast('That file could not be read: ' + (error.message || error), 'error'); }
                    render();
                };
                node('dd-geo-heights').onchange = async e => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    try {
                        const pic = await this.loadMapFromPicture(file);
                        const values = [];
                        for (let i = 0; i < pic.width * pic.height; i++) values.push(pic.data[i * 4] / 255);
                        state.heights = { w: pic.width, h: pic.height, values };
                    } catch (error) { this.showToast(String(error.message || error), 'error'); }
                    render();
                };
                node('dd-geo-apply').onclick = () => { if (this.applyGeoPlan(state) && card.parentNode) card.parentNode.removeChild(card); };
            };
            render();
            return card;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-geo-btn', icon: 'map', label: 'From a Map File', title: 'Roads, rivers, forests and buildings from an OpenStreetMap or GeoJSON file you downloaded' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-geo-btn') : null;
        if (btn) btn.onclick = () => { if (this.showMoreMenu) this.showMoreMenu(false); this.openGeoCard(); };
        return result;
    };
})();
