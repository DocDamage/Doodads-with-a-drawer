    // ---- Map sound: echo and region background sounds ----
    mapRegionSounds() {
        const list = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).regionSounds;
        return JSON.parse(JSON.stringify(Array.isArray(list) ? list : []));
    },

    addRegionSound() {
        const list = this.mapRegionSounds();
        list.push({ regionId: 1, name: '', volume: 90, pitch: 100, fade: 1 });
        this.setMapSetting('regionSounds', list);
    },

    setRegionSoundField(row, field, value) {
        const list = this.mapRegionSounds();
        if (!list[row]) return;
        list[row][field] = value;
        this.setMapSetting('regionSounds', list);
    },

    removeRegionSound(row) {
        const list = this.mapRegionSounds();
        if (!list[row]) return;
        list.splice(row, 1);
        this.setMapSetting('regionSounds', list);
    },

    // ---- 3D view (per map) ----
    perspectiveFields() {
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        const check = (key, label) => ({ key, label, type: 'checkbox' });
        return [
            check('enabled', 'Show this map in 3D'),
            range('pitch', 'Camera tilt (degrees down from level)', 20, 89, 1),
            range('yaw', 'Camera turn (0 = looking north)', 0, 359, 1),
            range('fov', 'Field of view', 20, 100, 1),
            range('zoom', 'Zoom', 0.25, 4, 0.05),
            number('viewTiles', 'View distance (tiles of ground drawn)'),
            number('fogStart', 'Fog starts (tiles past the camera\'s target)', 0.5),
            number('fogEnd', 'Fog ends (tiles)', 0.5),
            check('fogUseColor', 'Fog is a colour (otherwise distant ground fades into the sky)'),
            { key: 'fogColor', label: 'Fog colour', type: 'color' },
            { key: 'skyColor', label: 'Sky colour (maps without a parallax)', type: 'color' },
            { key: 'voidColor', label: 'Beyond the map edge', type: 'color' },
            { key: 'curve', label: 'Round world', type: 'select', options: DocsDoodads.Perspective.curves },
            range('curvature', 'Curvature (0 = flat, 100 = tiny planet)', 0, 100, 1),
            number('curveRadius', 'World radius (tiles; 0 = one lap across a looping map)'),
            check('lean', 'Things lean with the curve'),
            check('rotate', 'Q / W turn the camera 90°'),
            check('smoothGround', 'Smooth distant ground (less pixelated)'),
            check('water', 'Rippling water'),
            range('waterStrength', 'Ripple strength', 0, 2, 0.05),
            range('waterSpeed', 'Ripple speed', 0, 3, 0.05),
            range('waterShine', 'Sparkle', 0, 1, 0.05),
            check('waterWakes', 'Wakes behind boats and waders'),
            { key: 'standTiles', label: 'Tileset objects (B–E tiles)', type: 'select', options: DocsDoodads.StandTiles.modes },
            number('standFlatRegion', 'Keep tileset objects flat in region (0 = none; roofs and walls always stay flat)'),
            range('doodadScale', 'Standing doodads: height in 3D', 0.25, 2, 0.05),
            range('characterScale', 'Characters: height in 3D', 0.25, 2, 0.05),
            check('dayNight', 'Sky, sun, moon and stars follow the time of day'),
            check('weather', '3D rain and snow (from Set Weather Effect)'),
            check('snowCover', 'Snow settles (whitens the ground and tops while it snows, and in Winter)'),
            range('clouds', 'Cloud shadows', 0, 1, 0.05),
            number('cloudScale', 'Cloud size (tiles)'),
            range('cloudSpeed', 'Cloud speed', 0, 5, 0.1),
            range('mist', 'Low fog (in valleys on raised ground)', 0, 1, 0.05),
            range('mistHeight', 'Low fog height (tiles)', 0.25, 10, 0.25),
            check('minimap', 'Minimap in the corner (Show World Map opens the whole map)'),
            check('battleBack', 'Battles show this map in 3D behind the fight'),
            { key: 'skyVideo', label: 'Sky video (e.g. movies/Sky.webm; blank for none)', type: 'text' },
            { key: 'skyVideoMode', label: 'Sky video shape', type: 'select', options: DocsDoodads.SkyVideo.modes },
            range('skyVideoSpeed', 'Sky video speed', 0, 4, 0.05),
            check('skyVideoDayNight', 'Sky video follows day and night (darker at night)'),
            check('skyVideoFlat', 'Also show the sky video behind this map when it is flat'),
            range('weatherDensity', 'Weather density', 0, 3, 0.1)
        ];
    },

    // Turning with Q / W or Set Camera changes the camera for this visit; the panel shows the map's own camera.
    clearCameraOverride() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        $gameMap._docsCamera = null;
        $gameMap._docsCameraTween = null;
    },

    perspectiveRaw() {
        return Object.assign({}, (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).perspective || {});
    },

    renderPerspectivePanel() {
        const s = DocsDoodads.Perspective.normalize(this.perspectiveRaw());
        const fields = this.perspectiveFields().map(f => this.fieldHtml('dd-p3d-' + f.key, f, this.perspectiveFieldValue(f.key, s))).join('');
        return `
            <details id="dd-p3d-section" ${this._open3d ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">3D View (this map)</summary>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.4;">Tiles and floor doodads lie on the ground; characters and standing doodads stand up. Tileset trees and objects can stand up too (Tileset objects).</div>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}</div>
            </details>`;
    },

    // What a panel field shows: some fields are views onto other settings.
    // s: the map's normalized 3D settings (worked out here when not given).
    perspectiveFieldValue(key, s = DocsDoodads.Perspective.normalize(this.perspectiveRaw())) {
        if (key === 'fogUseColor') return Boolean(s.fogColor);
        if (key === 'fogColor') return s.fogColor || '#000000';
        if (key === 'curvature') {
            const width = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.width ? $gameMap.width() : 0;
            return Math.round(DocsDoodads.Perspective.curvatureOf(s, width));
        }
        return s[key];
    },

    // A field's change applied to the stored 3D settings.
    perspectiveWith(raw, key, value) {
        const next = Object.assign({}, raw);
        if (key === 'fogUseColor') next.fogColor = value ? (next.fogColor || '#000000') : '';
        else if (key === 'curvature') {
            if (value <= 0) next.curve = 'flat';
            else {
                next.curveRadius = Math.min(2000, Math.round(DocsDoodads.Perspective.radiusFromCurvature(value) * 100) / 100);
                if (next.curve !== 'sphere' && next.curve !== 'cylinder') next.curve = 'sphere';
            }
        } else next[key] = value;
        return next;
    },

    // One undo step per change; sliders preview live and record the value from before the drag.
    setPerspectiveField(key, value, previousSettings) {
        this.clearCameraOverride();
        this.setMapSetting('perspective', this.perspectiveWith(this.perspectiveRaw(), key, value), previousSettings);
    },

    bindPerspectivePanel() {
        const details = document.getElementById('dd-p3d-section');
        if (details) details.ontoggle = () => { this._open3d = details.open; };
        for (const f of this.perspectiveFields()) {
            const input = document.getElementById('dd-p3d-' + f.key);
            if (!input) continue;
            const read = () => f.type === 'checkbox' ? Boolean(input.checked) : (f.type === 'range' || f.type === 'number') ? parseFloat(input.value) || 0 : input.value;
            if (f.type === 'range') {
                let previous;
                const label = document.getElementById('dd-p3d-' + f.key + '-val');
                input.oninput = () => {
                    this.clearCameraOverride();
                    const mapId = this.currentMapId();
                    const data = window.$dataDocsDoodads || {};
                    if (previous === undefined) previous = data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null;
                    const settings = Object.assign({}, previous || {});
                    settings.perspective = this.perspectiveWith(Object.assign({}, settings.perspective || {}, this._p3dLive || {}), f.key, read());
                    this._p3dLive = settings.perspective;
                    this.writeMapSettings(mapId, settings);
                    if (label) label.textContent = String(read());
                };
                input.onchange = () => {
                    const prev = previous;
                    previous = undefined;
                    this._p3dLive = null;
                    this.setPerspectiveField(f.key, read(), prev);
                    // The radius box and shape follow the curvature slider.
                    if (f.key === 'curvature') this.refreshInspector();
                };
                input.onpointerup = input.onblur = () => setTimeout(() => { if (previous !== undefined) input.onchange(); }, 0);
            } else {
                input.onchange = () => {
                    this.setPerspectiveField(f.key, read());
                    if (['enabled', 'fogUseColor', 'curve', 'curveRadius'].includes(f.key)) this.refreshInspector();
                };
            }
        }
    },

    // ---- Terrain height (per map) ----
    terrainRaw() {
        return JSON.parse(JSON.stringify((DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).terrain || {}));
    },

    terrainFields() {
        const number = (key, label, step = 0.25) => ({ key, label, type: 'number', step });
        const check = (key, label) => ({ key, label, type: 'checkbox' });
        return [
            check('enabled', 'Raise the ground (shows in the 3D view)'),
            { key: 'style', label: 'Shape', type: 'select', options: DocsDoodads.Terrain.styles },
            check('auto', 'Automatic: world-tileset mountains and forests'),
            number('mountain', 'Mountain height (tiles)'),
            number('forest', 'Forest height (tiles)'),
            check('block', 'Steep steps block walking'),
            number('climb', 'Highest step you can walk (tiles)'),
            check('drop', 'Walk off ledges (jump down)'),
            number('hop', 'Hop up steps up to (tiles; 0 = off)'),
            check('walls', 'Walls stand up (A3/A4 wall tiles; use the Stepped shape)'),
            number('wallHeight', 'Wall height where there is no wall face (tiles)')
        ];
    },

    setTerrainField(key, value) {
        const next = this.terrainRaw();
        next[key] = value;
        this.setMapSetting('terrain', next);
    },

    renderTerrainPanel() {
        const raw = this.terrainRaw();
        const t = DocsDoodads.Terrain.normalize(raw);
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const fields = this.terrainFields().map(f => this.fieldHtml('dd-ter-' + f.key, f, t[f.key])).join('');
        const rows = (list, key, max) => list.map((r, i) => `
            <div style="display: grid; grid-template-columns: 1fr 1fr 22px; gap: 3px; align-items: center;">
                <input type="number" min="1" max="${max}" id="dd-ter-${key}-${i}-id" value="${r[key]}" title="${key === 'region' ? 'Region' : 'Terrain tag'}" style="${inputStyle}" />
                <input type="number" step="0.25" id="dd-ter-${key}-${i}-h" value="${r.height}" title="Height (tiles)" style="${inputStyle}" />
                <button class="dd-btn" id="dd-ter-${key}-${i}-del" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        const painted = Object.keys(t.paint).length;
        return `
            <details id="dd-ter-section" ${this._openTerrain ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Terrain Height (this map)</summary>
                <div style="font-size: 10px; color: #64748b; margin-top: 4px; line-height: 1.4;">Heights in tiles. The Terrain brush beats regions, regions beat terrain tags, and tags beat automatic heights.</div>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}
                    <div style="font-size: 10px; color: #94a3b8;">Regions (region, height):</div>${rows(t.regions, 'region', 255)}
                    <button class="dd-btn" id="dd-ter-region-add">Add Region Height</button>
                    <div style="font-size: 10px; color: #94a3b8;">Terrain tags (tag 1-7, height):</div>${rows(t.tags, 'tag', 7)}
                    <button class="dd-btn" id="dd-ter-tag-add">Add Terrain Tag Height</button>
                    <div style="font-size: 10px; color: #94a3b8;">Painted with the Terrain brush: ${painted} tile(s)</div>
                    <button class="dd-btn" id="dd-ter-paint-clear" ${painted ? '' : 'disabled'}>Clear Painted Heights</button>
                </div>
            </details>`;
    },

    bindTerrainPanel() {
        const byId = id => document.getElementById(id);
        const details = byId('dd-ter-section');
        if (details) details.ontoggle = () => { this._openTerrain = details.open; };
        for (const f of this.terrainFields()) {
            const input = byId('dd-ter-' + f.key);
            if (!input) continue;
            input.onchange = () => {
                const value = f.type === 'checkbox' ? Boolean(input.checked) : f.type === 'number' ? parseFloat(input.value) || 0 : input.value;
                this.setTerrainField(f.key, value);
                this.refreshInspector();
            };
        }
        const T = DocsDoodads.Terrain;
        for (const [listKey, key] of [['regions', 'region'], ['tags', 'tag']]) {
            const list = T.normalize(this.terrainRaw())[listKey];
            list.forEach((r, i) => {
                const write = mutate => { const next = T.normalize(this.terrainRaw())[listKey]; mutate(next); this.setTerrainField(listKey, next); this.refreshInspector(); };
                const id = byId(`dd-ter-${key}-${i}-id`), h = byId(`dd-ter-${key}-${i}-h`), del = byId(`dd-ter-${key}-${i}-del`);
                if (id) id.onchange = () => write(next => { next[i][key] = Math.round(parseFloat(id.value) || 1); });
                if (h) h.onchange = () => write(next => { next[i].height = parseFloat(h.value) || 0; });
                if (del) del.onclick = () => write(next => { next.splice(i, 1); });
            });
            const add = byId(`dd-ter-${key}-add`);
            if (add) add.onclick = () => {
                const next = T.normalize(this.terrainRaw())[listKey];
                next.push({ [key]: 1, height: 1 });
                this.setTerrainField(listKey, next);
                this.refreshInspector();
            };
        }
        const clear = byId('dd-ter-paint-clear');
        if (clear) clear.onclick = () => { this.setTerrainField('paint', {}); this.refreshInspector(); };
    },

    // ---- Terrain brush ----
    terrainBrush: { mode: 'raise', amount: 0.5, radius: 1, value: 1 },

    // The tile under the mouse while the Terrain tool is out, for the brush preview (null off the map).
    trackTerrainHover(e) {
        const canvas = DocsDoodads.Compat.getCanvas();
        const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
        const inside = !rect || (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom);
        if (!inside) { this._terrainHover = null; return; }
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        this._terrainHover = { tileX: at.tileX, tileY: at.tileY };
    },

    beginTerrainStroke(clientX, clientY) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null;
        const grid = DocsDoodads.Terrain.grid(true);
        if (!grid) return;
        const at = this.clientToMapCoords(clientX, clientY);
        this._terrainStroke = { mapId, previous, target: DocsDoodads.Terrain.tileHeight(grid, at.tileX, at.tileY), last: null };
        this.terrainPaintAt(clientX, clientY);
    },

    terrainPaintAt(clientX, clientY) {
        const stroke = this._terrainStroke;
        if (!stroke) return;
        const at = this.clientToMapCoords(clientX, clientY);
        const key = at.tileX + ',' + at.tileY;
        if (stroke.last === key) return;
        stroke.last = key;
        const T = DocsDoodads.Terrain;
        const grid = T.grid(true);
        if (!grid) return;
        const data = window.$dataDocsDoodads;
        const settings = Object.assign({}, (data.mapSettings && data.mapSettings[stroke.mapId]) || {});
        const terrain = Object.assign({}, settings.terrain || {});
        // Painting turns terrain on for the map.
        terrain.enabled = true;
        terrain.paint = T.applyBrush(T.normalize(terrain).paint, grid, at.tileX, at.tileY,
            Object.assign({ target: stroke.target }, this.terrainBrush));
        settings.terrain = terrain;
        this.writeMapSettings(stroke.mapId, settings);
    },

    // One undo step per stroke.
    endTerrainStroke() {
        const stroke = this._terrainStroke;
        this._terrainStroke = null;
        if (!stroke) return;
        const now = (window.$dataDocsDoodads.mapSettings || {})[stroke.mapId] || {};
        this.setMapSetting('terrain', JSON.parse(JSON.stringify(now.terrain || {})), stroke.previous);
        this.refreshInspector();
    },

    renderMapSoundPanel(mapSettings) {
        const echo = Object.assign({}, DocsDoodads.SpatialSound.echoDefaults, mapSettings.echo || {});
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const bgs = this.audioFileOptions().filter(o => o.value.indexOf('bgs/') === 0).map(o => o.value.slice(4));
        const rows = (Array.isArray(mapSettings.regionSounds) ? mapSettings.regionSounds : []).map((r, i) => `
            <div style="display: grid; grid-template-columns: 38px 1fr 40px 36px 22px; gap: 3px; align-items: center;">
                <input type="number" min="1" max="255" id="dd-region-${i}-regionId" value="${escapeHtml(String(r.regionId))}" title="Region" style="${inputStyle}" />
                <input type="text" list="dd-bgs-files" id="dd-region-${i}-name" value="${escapeHtml(r.name || '')}" title="Background sound" placeholder="BGS name" style="${inputStyle}" />
                <input type="number" min="0" max="100" id="dd-region-${i}-volume" value="${escapeHtml(String(r.volume))}" title="Volume" style="${inputStyle}" />
                <input type="number" min="0" step="0.5" id="dd-region-${i}-fade" value="${escapeHtml(String(r.fade))}" title="Fade (seconds)" style="${inputStyle}" />
                <button class="dd-btn" id="dd-region-del-${i}" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Sound (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-echo" ${echo.enabled ? 'checked' : ''} /> Echo (caves, halls)</label>
                    <div>Delay: ${echo.delay}s <input type="range" id="dd-map-echo-delay" min="0.05" max="1" step="0.01" value="${echo.delay}" style="width: 100%;" /></div>
                    <div>Repeats: ${echo.feedback} <input type="range" id="dd-map-echo-feedback" min="0" max="0.9" step="0.05" value="${echo.feedback}" style="width: 100%;" /></div>
                    <div>Echo volume: ${echo.mix} <input type="range" id="dd-map-echo-mix" min="0" max="1" step="0.05" value="${echo.mix}" style="width: 100%;" /></div>
                    <div style="margin-top: 4px;">Background sound by region (region, BGS, volume, fade s):</div>
                    ${rows}
                    <datalist id="dd-bgs-files">${bgs.map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
                    <button class="dd-btn" id="dd-region-add">Add Region Sound</button>
                    <div style="margin-top: 6px;">Diving (Traversal): the map under this map's deep water, and the map above (for an underwater map):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px;">
                        <input type="number" min="0" id="dd-map-dive" value="${escapeHtml(String(mapSettings.diveMap || 0))}" title="Dive to map (0 = none)" style="${inputStyle}" />
                        <input type="number" min="0" id="dd-map-surface" value="${escapeHtml(String(mapSettings.surfaceMap || 0))}" title="Surface to map (0 = none)" style="${inputStyle}" />
                    </div>
                </div>
            </details>`;
    },

    bindMapSoundPanel(mapSettings) {
        const echo = () => Object.assign({}, DocsDoodads.SpatialSound.echoDefaults, (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).echo || {});
        const byId = id => document.getElementById(id);
        for (const [id, key] of [['dd-map-dive', 'diveMap'], ['dd-map-surface', 'surfaceMap']]) {
            const input = byId(id);
            if (input) input.onchange = () => this.setMapSetting(key, Math.max(0, parseInt(input.value, 10) || 0));
        }
        const toggle = byId('dd-map-echo');
        if (toggle) toggle.onchange = () => this.setMapSetting('echo', Object.assign(echo(), { enabled: Boolean(toggle.checked) }));
        for (const field of ['delay', 'feedback', 'mix']) {
            const input = byId('dd-map-echo-' + field);
            if (input) input.onchange = () => { this.setMapSetting('echo', Object.assign(echo(), { [field]: parseFloat(input.value) || 0 })); this.refreshInspector(); };
        }
        const list = Array.isArray(mapSettings.regionSounds) ? mapSettings.regionSounds : [];
        list.forEach((r, i) => {
            for (const field of ['regionId', 'name', 'volume', 'fade']) {
                const input = byId(`dd-region-${i}-${field}`);
                if (input) input.onchange = () => this.setRegionSoundField(i, field, field === 'name' ? input.value.trim() : Math.max(0, parseFloat(input.value) || 0));
            }
            const del = byId(`dd-region-del-${i}`);
            if (del) del.onclick = () => { this.removeRegionSound(i); this.refreshInspector(); };
        });
        const add = byId('dd-region-add');
        if (add) add.onclick = () => { this.addRegionSound(); this.refreshInspector(); };
    },

    // ---- Character animation sets ----
    characterFileNames() {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? Object.values(DocsDoodads.AssetIndex.data.assets || {}) : [];
        return assets.filter(a => a && /^img\/characters\//i.test(a.path || '') && /\.png$/i.test(a.path))
            .map(a => a.path.replace(/^img\/characters\//i, '').replace(/\.png$/i, '')).sort();
    },

    animationSetsRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('characterAnim.sets') || []));
    },

    addAnimationSet(characterName) {
        const name = String(characterName || '').trim();
        if (!name) return;
        const sets = this.animationSetsRaw();
        const found = DocsDoodads.CharacterAnim.autoDetect(name, this.characterFileNames());
        sets.push(Object.assign(found, { idleDelay: 90, idleFps: 6, runFps: 12 }));
        this.setWorldSetting('characterAnim.sets', sets);
    },

    // One step: a set for every sheet that has _idle or _run variants beside it.
    addDetectedAnimationSets() {
        const files = this.characterFileNames();
        const sets = this.animationSetsRaw();
        const have = new Set(sets.map(s => s.character));
        let added = 0;
        for (const name of files) {
            const base = DocsDoodads.CharacterAnim.parseName(name).base;
            if (/_(idle|run)$/i.test(base) || have.has(name)) continue;
            const found = DocsDoodads.CharacterAnim.autoDetect(name, files);
            if (!found.idle && !found.run) continue;
            sets.push(Object.assign(found, { idleDelay: 90, idleFps: 6, runFps: 12 }));
            added++;
        }
        if (added) this.setWorldSetting('characterAnim.sets', sets);
        return added;
    },

    setAnimationSetField(row, field, value) {
        const sets = this.animationSetsRaw();
        if (!sets[row]) return;
        sets[row][field] = value;
        this.setWorldSetting('characterAnim.sets', sets);
    },

    removeAnimationSet(row) {
        const sets = this.animationSetsRaw();
        if (!sets[row]) return;
        sets.splice(row, 1);
        this.setWorldSetting('characterAnim.sets', sets);
    },

    renderAnimSetEditor() {
        const sets = DocsDoodads.World.get('characterAnim.sets') || [];
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const cell = (r, field, value, type) => `<input type="${type || 'text'}" ${type ? '' : 'list="dd-char-files"'} id="dd-anim-${r}-${field}" value="${escapeHtml(String(value === undefined ? '' : value))}" title="${field}" style="${inputStyle}" />`;
        const rows = sets.map((s, r) => `
            <div style="border: 1px solid #334155; border-radius: 4px; padding: 4px; display: grid; grid-template-columns: 1fr 1fr 1fr 22px; gap: 3px; align-items: center;">
                ${cell(r, 'character', s.character)}${cell(r, 'idle', s.idle)}${cell(r, 'run', s.run)}
                <button class="dd-btn" id="dd-anim-del-${r}" title="Remove" style="padding: 0 4px;">&times;</button>
                <span style="font-size: 9px; color: #64748b;">idle after / idle fps / run fps</span>
                ${cell(r, 'idleDelay', s.idleDelay, 'number')}${cell(r, 'idleFps', s.idleFps, 'number')}${cell(r, 'runFps', s.runFps, 'number')}
            </div>`).join('');
        return `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.4;">Sheet names set the layout: <b>[f8]</b> = 8 frames per row, <b>[d1]</b> = one row (mirrored for left), <b>[d8]</b> = 8 direction rows. Name variants <b>Name_idle</b> and <b>Name_run</b> and they are found automatically.</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 22px; gap: 3px; font-size: 9px; color: #64748b;"><span>Character</span><span>Idle sheet</span><span>Run sheet</span><span></span></div>
            ${rows}
            <datalist id="dd-char-files">${this.characterFileNames().map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                <input type="text" list="dd-char-files" id="dd-anim-new" placeholder="Character sheet name" style="${inputStyle}" />
                <button class="dd-btn" id="dd-anim-add">Add</button>
            </div>
            <button class="dd-btn" id="dd-anim-detect">Add All Detected</button>`;
    },

    bindAnimSetEditor() {
        const sets = DocsDoodads.World.get('characterAnim.sets') || [];
        sets.forEach((s, r) => {
            for (const field of ['character', 'idle', 'run', 'idleDelay', 'idleFps', 'runFps']) {
                const input = document.getElementById(`dd-anim-${r}-${field}`);
                if (!input) continue;
                input.onchange = () => this.setAnimationSetField(r, field, ['idleDelay', 'idleFps', 'runFps'].includes(field) ? Math.max(0, parseFloat(input.value) || 0) : input.value.trim());
            }
            const del = document.getElementById(`dd-anim-del-${r}`);
            if (del) del.onclick = () => { this.removeAnimationSet(r); this.refreshInspector(); };
        });
        const add = document.getElementById('dd-anim-add');
        if (add) add.onclick = () => { this.addAnimationSet(document.getElementById('dd-anim-new').value); this.refreshInspector(); };
        const detect = document.getElementById('dd-anim-detect');
        if (detect) detect.onclick = () => {
            const n = this.addDetectedAnimationSets();
            this.showToast(n ? `Added ${n} animation set(s).` : 'No _idle or _run sheets found beside your characters.', n ? 'success' : 'info');
            this.refreshInspector();
        };
    },

