//==========================================================
// SECTION 25e: WORKSPACE MAP TOOLS (CLOCK, SOUNDS, PERFORMANCE)
//==========================================================
// A clock at the top of the map panel previews any time of day and season (lamps, shadows, the 3D sky,
// season art) and can run the day fast; the sounds on a map can be seen and listened to from any tile;
// and a small readout shows how hard the map works the computer.
DocsDoodads.Ui.css += `
#dd-clock-bar { display: flex; flex-direction: column; gap: 5px; padding: 8px 10px; margin-bottom: 8px; border-radius: 14px; background: var(--dd-panel-2); border: 2px solid var(--dd-line-soft); }
#dd-clock-bar .dd-clock-row { display: flex; align-items: center; gap: 6px; }
#dd-clock-bar .dd-clock-time { font-weight: 900; font-size: 14px; color: var(--dd-text); min-width: 46px; font-variant-numeric: tabular-nums; }
#dd-clock-bar input[type=range] { flex: 1; min-width: 0; }
#dd-clock-bar .dd-btn { padding: 3px 8px; }
#dd-clock-bar select { flex: 1; min-width: 0; }
#dd-listen-card { position: fixed; z-index: 10026; width: 280px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 11px; }
#dd-listen-card .dd-ls-row { display: grid; grid-template-columns: 1fr 64px 38px; gap: 6px; align-items: center; }
#dd-listen-card .dd-ls-bar { height: 6px; border-radius: 6px; background: var(--dd-line-soft); overflow: hidden; }
#dd-listen-card .dd-ls-bar i { display: block; height: 100%; background: var(--dd-primary); }
#dd-listen-card .dd-ls-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dd-text); font-weight: 800; }
#dd-listen-card .dd-ls-kind { color: var(--dd-faint); font-weight: 700; }
#dd-perf { position: absolute; z-index: 5; bottom: 42px; padding: 7px 10px; font-size: 11px; display: grid; grid-template-columns: auto auto; gap: 1px 10px; min-width: 170px; }
#dd-perf b { text-align: right; font-variant-numeric: tabular-nums; color: var(--dd-text); }
#dd-perf .dd-perf-over { color: var(--dd-danger-dark) !important; }
#dd-perf .dd-perf-note { grid-column: 1 / -1; color: var(--dd-danger-dark); font-weight: 800; margin-top: 3px; }
`;

DocsDoodads.Ui.hints.listen = 'Listen: click a tile to hear what the player would hear there. Esc to stop.';
Object.assign(DocsDoodads.Ui.mapPalettes.standard, { sound: 0x818cf8, soundRegion: 0x2dd4bf, probe: 0xfacc15 });
Object.assign(DocsDoodads.Ui.mapPalettes.safe, { sound: 0x0072b2, soundRegion: 0x009e73, probe: 0xf0e442 });
DocsDoodads.Ui.mapColorMeanings.push(['sound', 'Sound reach'], ['soundRegion', 'Region with a sound']);

Object.assign(DocsDoodads.Workspace, {
    // ---- Clock: preview a time and season, or run the day fast ----
    clockStep: 5, // minutes per tick while playing (a day in about 15 seconds)

    renderClockBar() {
        const Time = DocsDoodads.TimeOfDay;
        const previewing = this.previewMinutes !== null && this.previewMinutes !== undefined;
        const minutes = previewing ? this.previewMinutes : DocsDoodads.Atmosphere.minutes();
        const names = (DocsDoodads.World.settings().seasons || {}).names || [];
        const season = this.previewSeason !== null && this.previewSeason !== undefined ? this.previewSeason : -1;
        return `
            <div id="dd-clock-bar">
                <div class="dd-clock-row">
                    <span class="dd-clock-time" id="dd-clock-time">${escapeHtml(Time.format(Math.round(minutes)))}</span>
                    <input type="range" id="dd-clock-slider" min="0" max="1439" step="5" value="${Math.round(minutes)}" title="Drag to see the map at another time" />
                    <button class="dd-btn" id="dd-clock-play" type="button" title="Run the clock fast">${this._clockTimer ? '❚❚' : '▶'}</button>
                </div>
                <div class="dd-clock-row">
                    <select id="dd-clock-season" title="See the map in another season">
                        <option value="-1"${season < 0 ? ' selected' : ''}>Season: the game's</option>
                        ${names.map((n, i) => `<option value="${i}"${season === i ? ' selected' : ''}>${escapeHtml(n)}</option>`).join('')}
                    </select>
                    <button class="dd-btn" id="dd-clock-now" type="button" title="Back to the game's own time and season"${previewing || season >= 0 ? '' : ' disabled'}>Now</button>
                </div>
            </div>`;
    },

    bindClockBar() {
        const byId = id => document.getElementById(id);
        const slider = byId('dd-clock-slider');
        if (slider) slider.oninput = () => { const minutes = parseInt(slider.value, 10) || 0; this.stopClock(); this.setClock(minutes); };
        const play = byId('dd-clock-play');
        if (play) play.onclick = () => (this._clockTimer ? this.stopClock() : this.playClock());
        const season = byId('dd-clock-season');
        if (season) season.onchange = () => { const v = parseInt(season.value, 10); this.previewSeason = v >= 0 ? v : null; this.refreshSpriteset(); this.updateClockBar(); };
        const now = byId('dd-clock-now');
        if (now) now.onclick = () => { this.stopClock(); this.previewMinutes = null; this.previewSeason = null; this.refreshSpriteset(); this.updateClockBar(true); };
    },

    setClock(minutes) {
        this.previewMinutes = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
        this.updateClockBar();
        return this.previewMinutes;
    },

    // The bar's time, slider and buttons follow the clock without redrawing the panel.
    updateClockBar(resetSeason) {
        if (typeof document === 'undefined') return;
        const previewing = this.previewMinutes !== null && this.previewMinutes !== undefined;
        const minutes = previewing ? this.previewMinutes : DocsDoodads.Atmosphere.minutes();
        const label = document.getElementById('dd-clock-time');
        if (label) label.textContent = DocsDoodads.TimeOfDay.format(Math.round(minutes));
        const slider = document.getElementById('dd-clock-slider');
        if (slider && document.activeElement !== slider) slider.value = String(Math.round(minutes));
        const play = document.getElementById('dd-clock-play');
        if (play) play.textContent = this._clockTimer ? '❚❚' : '▶';
        const now = document.getElementById('dd-clock-now');
        if (now) now.disabled = !previewing && !(this.previewSeason >= 0);
        const season = document.getElementById('dd-clock-season');
        if (season && resetSeason) season.value = '-1';
    },

    playClock() {
        if (this._clockTimer) return;
        if (this.previewMinutes === null || this.previewMinutes === undefined) this.previewMinutes = Math.round(DocsDoodads.Atmosphere.minutes());
        this._clockTimer = setInterval(() => {
            if (!this.mounted) { this.stopClock(); return; }
            this.setClock(this.previewMinutes + this.clockStep);
        }, 50);
        this.updateClockBar();
    },

    stopClock() {
        clearInterval(this._clockTimer);
        this._clockTimer = null;
        this.updateClockBar();
    },

    // ---- Sounds on the map: where each sound reaches, and what a tile hears ----
    showSounds: false,

    toggleSoundOverlay(on) {
        this.showSounds = on === undefined ? !this.showSounds : Boolean(on);
        DocsDoodads.Ui.setPref('soundOverlay', this.showSounds);
        const label = typeof document !== 'undefined' ? document.getElementById('dd-sounds-label') : null;
        if (label) label.textContent = this.showSounds ? 'Hide Sounds' : 'Show Sounds';
        return this.showSounds;
    },

    // Emitters (tile coordinates, as SoundEmitters plays them) and the region-sound tiles in view.
    soundOverlayData(view) {
        const gameMap = window.$gameMap;
        const emitters = DocsDoodads.SoundEmitters.sources().map(s => ({ x: s.x, y: s.y, radius: s.emitter.radius, name: s.emitter.name, loop: s.emitter.loop }));
        const list = (DocsDoodads.Lighting.mapSettings(gameMap.mapId()) || {}).regionSounds || [];
        const regionTiles = [];
        if (view && list.length && typeof gameMap.regionId === 'function') {
            for (let y = view.y0; y <= view.y1; y++) {
                for (let x = view.x0; x <= view.x1; x++) {
                    const entry = DocsDoodads.SpatialSound.regionSoundFor(list, gameMap.regionId(x, y));
                    if (entry) regionTiles.push({ x, y, name: entry.name });
                }
            }
        }
        return { emitters, regionTiles };
    },

    drawSoundOverlay(g) {
        const gameMap = window.$gameMap;
        if (!gameMap || (!this.showSounds && !this._listenProbe)) return;
        if (DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera()) return;
        const U = DocsDoodads.Ui;
        const tw = gameMap.tileWidth(), th = gameMap.tileHeight();
        const at = (tx, ty) => DocsDoodads.mapToScreen((tx + 0.5) * tw, (ty + 0.5) * th);
        g.lineStyle(0);
        if (this.showSounds) {
            const width = typeof Graphics !== 'undefined' ? Graphics.width : 816, height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            const x0 = Math.floor(gameMap.displayX()), y0 = Math.floor(gameMap.displayY());
            const data = this.soundOverlayData({ x0, y0, x1: x0 + Math.ceil(width / tw), y1: y0 + Math.ceil(height / th) });
            for (const t of data.regionTiles) {
                g.beginFill(U.mapColor('soundRegion'), 0.22);
                g.drawRect(gameMap.adjustX(t.x) * tw, gameMap.adjustY(t.y) * th, tw, th);
                g.endFill();
            }
            for (const e of data.emitters) {
                const c = at(e.x, e.y);
                g.lineStyle(2, U.mapColor('sound'), 0.9);
                g.beginFill(U.mapColor('sound'), 0.08);
                g.drawCircle(c.x, c.y, e.radius * tw);
                g.endFill();
                g.beginFill(U.mapColor('sound'), 0.9);
                g.drawCircle(c.x, c.y, 4);
                g.endFill();
            }
            g.lineStyle(0);
        }
        const probe = this._listenProbe;
        if (probe) {
            const c = at(probe.tileX, probe.tileY);
            // How far each ambience layer listens around the probe.
            for (const layer of DocsDoodads.World.settings().ambience.layers || []) {
                if (!layer || !layer.sound) continue;
                g.lineStyle(1, U.mapColor('probe'), 0.7);
                g.drawCircle(c.x, c.y, Math.max(1, Math.min(20, Number(layer.radius) || 6)) * tw);
            }
            g.lineStyle(3, U.mapColor('probe'), 1);
            g.drawCircle(c.x, c.y, 10);
            g.lineStyle(0);
        }
    },

    // What the player would hear standing on a tile: each sound with its volume (0-100), pan and pitch.
    listenAt(tileX, tileY) {
        const gameMap = window.$gameMap;
        const SS = DocsDoodads.SpatialSound;
        const out = [];
        const s = SS.settings();
        const sources = DocsDoodads.SoundEmitters.sources();
        const plan = SS.planEmitters(sources.map((src, i) => ({ key: i, emitter: src.emitter,
            dx: gameMap.deltaX ? gameMap.deltaX(src.x, tileX) : src.x - tileX, dy: gameMap.deltaY ? gameMap.deltaY(src.y, tileY) : src.y - tileY })), s);
        sources.forEach((src, i) => {
            const p = plan[i];
            const volume = Math.round(src.emitter.volume * Math.min(1, p.gain));
            if (volume >= 1) out.push({ kind: 'Sound source', folder: src.emitter.folder, name: src.emitter.name, volume, pan: p.pan, pitch: src.emitter.pitch, loop: src.emitter.loop });
        });
        const regions = (DocsDoodads.Lighting.mapSettings(gameMap.mapId()) || {}).regionSounds;
        const region = typeof gameMap.regionId === 'function' ? SS.regionSoundFor(regions, gameMap.regionId(tileX, tileY)) : null;
        if (region) out.push({ kind: 'Region ' + region.regionId, folder: 'bgs', name: region.name, volume: Math.round(Number(region.volume) || 90), pan: 0, pitch: 100, loop: true });
        const layers = DocsDoodads.World.settings().ambience.layers || [];
        if (layers.some(l => l && l.sound)) {
            const q = DocsDoodads.Ambience.query();
            layers.forEach(layer => {
                const name = String((layer && layer.sound) || '').trim();
                if (!name) return;
                const c = SS.coverage(layer, tileX, tileY, q, q.tw, q.th);
                const quiet = layer.quiet === undefined || layer.quiet === '' ? 0.4 : Number(layer.quiet);
                const volume = Math.round(Math.min(100, (Number(layer.volume) || 60) * c.coverage * SS.closeness(quiet, 0)));
                if (volume >= 1) out.push({ kind: 'Ambience', folder: 'bgs', name, volume, pan: c.pan, pitch: Number(layer.pitch) || 100, loop: true });
            });
        }
        return out.sort((a, b) => b.volume - a.volume);
    },

    // The Listen tool: plays what a tile hears and lists it, until Stop, Esc or another tool.
    listenHere(tileX, tileY) {
        this.stopListening(true);
        const sounds = this.listenAt(tileX, tileY);
        this._listenProbe = { tileX, tileY };
        this._listenBuffers = [];
        if (typeof AudioManager !== 'undefined') {
            for (const s of sounds) {
                try {
                    if (s.loop) {
                        const buffer = AudioManager.createBuffer(s.folder + '/', s.name);
                        AudioManager.updateBufferParameters(buffer, AudioManager._bgsVolume, { volume: s.volume, pitch: s.pitch, pan: s.pan });
                        buffer.play(true, 0);
                        this._listenBuffers.push(buffer);
                    } else {
                        AudioManager.playSe({ name: s.name, volume: s.volume, pitch: s.pitch, pan: s.pan });
                    }
                } catch (e) {}
            }
        }
        this.showListenCard(sounds, tileX, tileY);
        return sounds;
    },

    stopListening(keepProbe) {
        for (const buffer of this._listenBuffers || []) { try { buffer.stop(); } catch (e) {} }
        this._listenBuffers = [];
        if (!keepProbe) {
            this._listenProbe = null;
            const card = typeof document !== 'undefined' ? document.getElementById('dd-listen-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        }
    },

    showListenCard(sounds, tileX, tileY) {
        if (typeof document === 'undefined') return null;
        let card = document.getElementById('dd-listen-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-listen-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const rows = sounds.map(s => `
            <div class="dd-ls-row"><span class="dd-ls-name" title="${escapeHtml(s.folder + '/' + s.name)}">${escapeHtml(s.name)} <span class="dd-ls-kind">${escapeHtml(s.kind)}</span></span>
                <span class="dd-ls-bar"><i style="width: ${Math.max(2, Math.min(100, s.volume))}%;"></i></span><b>${s.volume}%</b></div>`).join('');
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${DocsDoodads.Ui.icon('sound', 1)} Tile ${tileX}, ${tileY}</span>
                <button class="dd-btn" id="dd-listen-stop" type="button">Stop</button></div>
            ${rows || '<div class="dd-empty">Silent here: no sound sources, region sound or ambience reach this tile.</div>'}`;
        const stop = document.getElementById('dd-listen-stop');
        if (stop) stop.onclick = () => { this.stopListening(); if (this.placementTool === 'listen') this.setPlacementTool(null); };
        const s = this.uiScaleNow ? this.uiScaleNow() : 1;
        const room = this.roomSize ? this.roomSize() : { w: 816 };
        const inspector = document.getElementById('dd-inspector-panel');
        const right = inspector && inspector.getBoundingClientRect ? inspector.getBoundingClientRect().left - 8 : room.w - 8;
        // Above the speed readout when that shows (both sit at the bottom right of the map).
        const perf = document.getElementById('dd-perf');
        const below = perf && perf.offsetHeight ? 42 + perf.offsetHeight + 8 : 44;
        card.style.right = Math.round((room.w - right) * s) + 'px';
        card.style.bottom = Math.round(below * s) + 'px';
        return card;
    },

    // ---- Performance: frames per second, draw calls, texture memory, doodads and lights ----
    perfBudgets: { fps: 50, draws: 300, textureMB: 256, doodads: 800, lit: 32 },

    togglePerfOverlay(on) {
        const show = on === undefined ? !this._perf : Boolean(on);
        DocsDoodads.Ui.setPref('perfOverlay', show);
        if (show) this.startPerf(); else this.stopPerf();
        const label = typeof document !== 'undefined' ? document.getElementById('dd-perf-label') : null;
        if (label) label.textContent = show ? 'Hide Speed' : 'Show Speed';
        return show;
    },

    renderer() {
        if (typeof Graphics === 'undefined') return null;
        const app = Graphics.app || Graphics._app;
        return (app && app.renderer) || Graphics._renderer || null;
    },

    startPerf() {
        if (this._perf) return;
        const perf = this._perf = { frames: 0, draws: 0, since: Date.now(), stats: null, gl: null, wrapped: null };
        // Draw calls are counted by wrapping the WebGL context's draw functions while this is open.
        const renderer = this.renderer();
        const gl = renderer && renderer.gl;
        if (gl && typeof gl.drawElements === 'function') {
            const real = { drawElements: gl.drawElements, drawArrays: gl.drawArrays };
            gl.drawElements = function() { perf.draws++; return real.drawElements.apply(this, arguments); };
            gl.drawArrays = function() { perf.draws++; return real.drawArrays.apply(this, arguments); };
            perf.gl = gl;
            perf.wrapped = real;
        }
        const tick = () => {
            if (this._perf !== perf) return;
            perf.frames++;
            perf.raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(tick) : null;
        };
        tick();
        perf.timer = setInterval(() => this.updatePerf(), 500);
        if (perf.timer && typeof perf.timer.unref === 'function') perf.timer.unref();
        this.updatePerf();
    },

    stopPerf() {
        const perf = this._perf;
        this._perf = null;
        if (!perf) return;
        clearInterval(perf.timer);
        if (perf.raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(perf.raf);
        if (perf.gl && perf.wrapped) {
            perf.gl.drawElements = perf.wrapped.drawElements;
            perf.gl.drawArrays = perf.wrapped.drawArrays;
        }
        const el = typeof document !== 'undefined' ? document.getElementById('dd-perf') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    // The textures the renderer holds, in megabytes (4 bytes a pixel).
    textureMegabytes() {
        const renderer = this.renderer();
        const managed = renderer && renderer.texture && renderer.texture.managedTextures;
        if (!Array.isArray(managed)) return null;
        let bytes = 0;
        for (const t of managed) bytes += (Number(t.realWidth || t.width) || 0) * (Number(t.realHeight || t.height) || 0) * 4;
        return Math.round(bytes / 1048576);
    },

    perfStats() {
        const perf = this._perf;
        const now = Date.now();
        const seconds = perf ? Math.max(0.001, (now - perf.since) / 1000) : 1;
        const fps = perf ? Math.round(perf.frames / seconds) : null;
        const draws = perf && perf.gl && perf.frames ? Math.round(perf.draws / perf.frames) : null;
        if (perf) { perf.frames = 0; perf.draws = 0; perf.since = now; }
        const doodads = (DocsDoodads.doodads() || []).filter(Boolean);
        const lit = doodads.filter(d => d.light && (Number(d.light.radius) || 0) > 0 && !d.editorHidden).length;
        return { fps, draws, textureMB: this.textureMegabytes(), doodads: doodads.length, lit };
    },

    // Over budget: { key: message } for what is heavier than a typical computer handles well.
    perfWarnings(stats) {
        const b = this.perfBudgets, out = {};
        if (stats.fps !== null && stats.fps < b.fps) out.fps = `Under ${b.fps} frames a second`;
        if (stats.draws !== null && stats.draws > b.draws) out.draws = `Over ${b.draws} draw calls: pack this map's art (map panel)`;
        if (stats.textureMB !== null && stats.textureMB > b.textureMB) out.textureMB = `Over ${b.textureMB} MB of pictures loaded`;
        if (stats.doodads > b.doodads) out.doodads = `Over ${b.doodads} doodads on one map`;
        if (stats.lit > b.lit) out.lit = `Over ${b.lit} lights: try fewer, larger lights`;
        return out;
    },

    updatePerf() {
        if (!this._perf || typeof document === 'undefined') return null;
        const stats = this._perf.stats = this.perfStats();
        const warn = this.perfWarnings(stats);
        let el = document.getElementById('dd-perf');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-perf';
            el.className = 'dd-glass';
            (this.container || document.body).appendChild(el);
        }
        const row = (key, label, value) => `<span>${label}</span><b class="${warn[key] ? 'dd-perf-over' : ''}">${value === null ? '–' : value}</b>`;
        el.innerHTML = row('fps', 'Frames a second', stats.fps) + row('draws', 'Draw calls a frame', stats.draws) +
            row('textureMB', 'Pictures loaded', stats.textureMB === null ? null : stats.textureMB + ' MB') +
            row('doodads', 'Doodads', stats.doodads) + row('lit', 'Lights', stats.lit) +
            Object.values(warn).map(w => `<span class="dd-perf-note">${escapeHtml(w)}</span>`).join('');
        const room = this.roomSize ? this.roomSize().w : 816;
        const inspector = document.getElementById('dd-inspector-panel');
        const right = inspector && inspector.getBoundingClientRect ? inspector.getBoundingClientRect().left - 8 : room - 8;
        el.style.right = Math.round(room - right) + 'px';
        return stats;
    },

    // Stops everything here when the editor closes.
    closeMapTools() {
        this.stopClock();
        this.stopListening();
        this.stopPerf();
    }
});
