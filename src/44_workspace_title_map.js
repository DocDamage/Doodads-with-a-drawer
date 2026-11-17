// @editor-only
//==========================================================
// SECTION 25D: USE THIS VIEW AS THE TITLE SCREEN
//==========================================================
(function() {
    const W = DocsDoodads.Workspace, T = DocsDoodads.TitleMap;

    Object.assign(W, {
        titleLookInUse() {
            const P = DocsDoodads.PostFX;
            if (!P || this.postFxCompare || this.postFxPreview === false) return P ? P.normalizeLook(null) : {};
            const world = DocsDoodads.World.settings(), mapSettings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
            const live = P.liveInputs(false);
            return P.normalizeLook(P.resolveLook({ world, mapSettings, runtime: P.runtimeLook(), minutes: live.minutes, regionWeights: live.regionWeights }));
        },

        currentTitleView() {
            if (typeof $gameMap === 'undefined' || !$gameMap) return null;
            const current = T.settings(), camera = DocsDoodads.Camera2D.state();
            const path = camera && camera.path && Array.isArray(camera.path.points) ? {
                points: camera.path.points.map(point => ({ x: Number(point.x), y: Number(point.y) })),
                frames: Number(camera.path.frames) || 60, ease: camera.path.ease === 'linear' ? 'linear' : 'smooth'
            } : null;
            return T.normalize({
                mapId: $gameMap.mapId(),
                x: $gameMap.displayX() + ($gameMap.screenTileX() - 1) / 2,
                y: $gameMap.displayY() + ($gameMap.screenTileY() - 1) / 2,
                time: this.previewMinutes == null ? DocsDoodads.Atmosphere.minutes() : this.previewMinutes,
                season: this.previewSeason == null ? DocsDoodads.Atmosphere.season() : this.previewSeason,
                weather: { type: $gameScreen.weatherType(), power: $gameScreen.weatherPower() },
                look: this.titleLookInUse(), path, pictures: current.pictures
            });
        },

        useThisViewAsTitle() {
            if (DocsDoodads.Perspective && DocsDoodads.Perspective.active && DocsDoodads.Perspective.active()) {
                this.showToast('Live title maps currently use the flat view. Turn 3D View off, then try again.', 'info');
                return false;
            }
            const settings = this.currentTitleView();
            if (!settings || settings.mapId <= 0) return false;
            this.setWorldSetting('title', settings);
            this.showToast('This view is now the title screen. Playtest to check the title menu over it.', 'ok');
            return true;
        },

        writeTitleOptions(next) {
            this.setWorldSetting('title', T.normalize(next));
            DocsDoodads.Persistence.dirtyDoodads = true;
        },

        showTitleMapCard() {
            if (typeof document === 'undefined') return null;
            let card = document.getElementById('dd-title-map-card');
            if (card && card.remove) card.remove();
            const s = T.settings(), U = DocsDoodads.Ui, esc = DocsDoodads.Security.escapeHtml;
            card = document.createElement('div'); card.id = 'dd-title-map-card'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;left:50%;top:90px;transform:translateX(-50%);z-index:10045;width:360px;max-width:calc(100vw - 28px);padding:12px;display:grid;gap:7px;';
            const points = s.path ? s.path.points.map(point => `${point.x},${point.y}`).join('; ') : '';
            card.innerHTML = `<div class="dd-panel-head" style="font-weight:900;display:flex;justify-content:space-between;">Title map <button class="dd-btn" id="dd-title-map-close">${U.icon('close', 1)}</button></div>
                <div style="font-size:11px;color:var(--dd-muted);">${s.mapId ? `Map ${s.mapId} at ${Math.round(s.x * 100) / 100}, ${Math.round(s.y * 100) / 100}` : 'Off: MZ uses its ordinary title pictures.'}</div>
                <button class="dd-btn" id="dd-title-map-use">Use the current view</button>
                <label class="dd-field"><span>Title pictures</span><select id="dd-title-map-pictures"><option value="over"${s.pictures === 'over' ? ' selected' : ''}>Keep them over the map</option><option value="hide"${s.pictures === 'hide' ? ' selected' : ''}>Hide them (keep title words)</option></select></label>
                <label class="dd-field"><span>Time (minutes after midnight)</span><input id="dd-title-map-time" type="number" min="0" max="1439" value="${s.time}"></label>
                <label class="dd-field"><span>Season # (first is 0)</span><input id="dd-title-map-season" type="number" min="0" value="${s.season}"></label>
                <label class="dd-field"><span>Weather</span><select id="dd-title-map-weather">${T.weatherTypes.map(type => `<option${type === s.weather.type ? ' selected' : ''}>${esc(type)}</option>`).join('')}</select></label>
                <label class="dd-field"><span>Weather power</span><input id="dd-title-map-power" type="number" min="0" max="9" step="0.5" value="${s.weather.power}"></label>
                <label class="dd-field"><span>Looping camera points (x,y; x,y)</span><input id="dd-title-map-path" value="${esc(points)}"></label>
                <label class="dd-field"><span>Frames for each leg</span><input id="dd-title-map-frames" type="number" min="1" max="36000" value="${s.path ? s.path.frames : 180}"></label>
                <label class="dd-field"><span>Camera motion</span><select id="dd-title-map-ease"><option value="smooth"${!s.path || s.path.ease === 'smooth' ? ' selected' : ''}>Smooth</option><option value="linear"${s.path && s.path.ease === 'linear' ? ' selected' : ''}>Even</option></select></label>
                <button class="dd-btn" id="dd-title-map-off">Use the ordinary title screen</button>`;
            (this.container || document.body).appendChild(card);
            const node = id => document.getElementById(id), commit = () => {
                const now = T.settings(), pointsNow = DocsDoodads.Camera2D.parsePoints(node('dd-title-map-path').value);
                this.writeTitleOptions(Object.assign({}, now, {
                    pictures: node('dd-title-map-pictures').value, time: Number(node('dd-title-map-time').value),
                    season: Number(node('dd-title-map-season').value),
                    weather: { type: node('dd-title-map-weather').value, power: Number(node('dd-title-map-power').value) },
                    path: pointsNow.length > 1 ? { points: pointsNow, frames: Number(node('dd-title-map-frames').value), ease: node('dd-title-map-ease').value } : null
                }));
            };
            for (const id of ['dd-title-map-pictures','dd-title-map-time','dd-title-map-season','dd-title-map-weather','dd-title-map-power','dd-title-map-path','dd-title-map-frames','dd-title-map-ease']) node(id).onchange = commit;
            node('dd-title-map-use').onclick = () => { if (this.useThisViewAsTitle()) this.showTitleMapCard(); };
            node('dd-title-map-off').onclick = () => { this.writeTitleOptions({ mapId: 0 }); this.showTitleMapCard(); };
            node('dd-title-map-close').onclick = () => card.remove();
            return card;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.splice(1, 0, { id: 'dd-title-map-btn', icon: 'picture', label: 'Use This View as the Title Screen', title: 'Show this live flat map behind the title menu' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = document.getElementById('dd-title-map-btn');
        if (button) button.onclick = () => { this.showMoreMenu(false); this.useThisViewAsTitle(); this.showTitleMapCard(); };
        return result;
    };
})();
