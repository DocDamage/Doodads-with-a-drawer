//==========================================================
// SECTION 5L: A CUTSCENE TIMELINE (7.3.6)
//==========================================================
// $dataDocsDoodads.timelines = [{ id, name, length, tracks: [{ kind, target, keys: [{ t, ... }] }] }], `t` in
// frames. Each track kind only calls what the plugin already has (plugin commands, DocsDoodads.api, MZ's
// screen), so a timeline does nothing a list of event commands could not; it lays them out against time and
// plays them with one command. The player is stepped once a frame by the spriteset; Play Timeline with "wait"
// holds the event until it ends; holding OK for a second skips to the end, running every remaining key at once.
DocsDoodads.Timeline = {
    maxKeys: 2000,
    _player: null,

    // Each kind: its label, the key's fields (for the editor's form) and run(key, track).
    kinds: {
        camera: { label: 'Camera (flat map)', fields: [
            { key: 'mode', label: 'Move', type: 'select', options: [{ value: 'path', label: 'Along points' }, { value: 'zoom', label: 'Zoom on a tile' }, { value: 'follow', label: 'Follow the player again' }] },
            { key: 'points', label: 'Points (x,y; x,y tiles)', type: 'text' }, { key: 'frames', label: 'Frames', type: 'number' },
            { key: 'x', label: 'Tile x (zoom)', type: 'number' }, { key: 'y', label: 'Tile y (zoom)', type: 'number' }, { key: 'scale', label: 'Zoom (1 is none)', type: 'number' }] },
        camera3d: { label: 'Camera (3D)', fields: [
            { key: 'pitch', label: 'Pitch', type: 'text' }, { key: 'yaw', label: 'Yaw', type: 'text' }, { key: 'zoom', label: 'Zoom', type: 'text' }, { key: 'duration', label: 'Frames', type: 'number' }] },
        state: { label: 'Doodad state', target: 'A doodad\'s Name', fields: [{ key: 'state', label: 'State (name, number or next)', type: 'text' }] },
        light: { label: 'Doodad light', target: 'A doodad\'s Name', fields: [{ key: 'on', label: 'Light', type: 'select', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }, { value: 'own', label: 'Its own setting' }] }] },
        ambient: { label: 'Darkness', fields: [{ key: 'darkness', label: 'Darkness (0-1, blank for the map\'s)', type: 'text' }, { key: 'color', label: 'Colour (#rrggbb)', type: 'text' }, { key: 'frames', label: 'Frames', type: 'number' }] },
        weather: { label: 'Weather', fields: [
            { key: 'type', label: 'Weather', type: 'select', options: ['none', 'rain', 'storm', 'snow'].map(v => ({ value: v, label: v })) },
            { key: 'power', label: 'Power (1-9)', type: 'number' }, { key: 'frames', label: 'Frames', type: 'number' }] },
        look: { label: 'Screen look', fields: [{ key: 'look', label: 'Look (map, none, cinematic, golden, noir...)', type: 'text' }, { key: 'duration', label: 'Frames', type: 'number' }] },
        effect: { label: 'Screen effect', fields: [
            { key: 'effect', label: 'Effect', type: 'select', options: ['shockwave', 'zoomPunch', 'chromaticPunch', 'bloomFlash'].map(v => ({ value: v, label: v })) },
            { key: 'strength', label: 'Strength', type: 'number' }, { key: 'duration', label: 'Frames', type: 'number' }] },
        character: { label: 'Character', target: 'player, or an event id', fields: [
            { key: 'action', label: 'Does', type: 'select', options: [{ value: 'face', label: 'Turns' }, { value: 'walk', label: 'Walks (tiles across, down)' },
                { value: 'balloon', label: 'Shows a balloon' }, { value: 'animation', label: 'Plays an animation' }, { value: 'sheet', label: 'Plays an action sheet' }, { value: 'show', label: 'Shows or hides' }] },
            { key: 'dir', label: 'Direction (2 down, 4 left, 6 right, 8 up)', type: 'number' }, { key: 'dx', label: 'Tiles across', type: 'number' }, { key: 'dy', label: 'Tiles down', type: 'number' },
            { key: 'id', label: 'Balloon or animation id', type: 'number' }, { key: 'sheet', label: 'Action sheet (img/characters name)', type: 'text' }, { key: 'visible', label: 'Visible', type: 'checkbox' }] },
        vfx: { label: 'Effect (VFX)', fields: [{ key: 'id', label: 'Effect id', type: 'text' }, { key: 'x', label: 'Tile x', type: 'number' }, { key: 'y', label: 'Tile y', type: 'number' }] },
        time: { label: 'Time of day', fields: [{ key: 'hour', label: 'Hour', type: 'number' }, { key: 'minute', label: 'Minute', type: 'number' }] },
        wind: { label: 'Wind', fields: [{ key: 'strength', label: 'Strength (0-1)', type: 'number' }, { key: 'frames', label: 'Frames', type: 'number' }] },
        sound: { label: 'Sound', fields: [{ key: 'name', label: 'Sound (audio/se name)', type: 'text' }, { key: 'volume', label: 'Volume', type: 'number' }, { key: 'pitch', label: 'Pitch', type: 'number' }] },
        switch: { label: 'Switch', fields: [{ key: 'id', label: 'Switch id', type: 'number' }, { key: 'on', label: 'On', type: 'checkbox' }] }
    },

    normalizeKey(key) {
        if (!key || typeof key !== 'object') return null;
        const out = {};
        for (const k of Object.keys(key)) {
            const v = key[k];
            if (v === undefined || typeof v === 'function') continue;
            out[k] = typeof v === 'object' && v !== null ? JSON.parse(JSON.stringify(v)) : v;
        }
        out.t = Math.max(0, Math.round(Number(key.t) || 0));
        return out;
    },

    normalize(tl) {
        if (!tl || typeof tl !== 'object') return null;
        const id = String(tl.id || '').replace(/[^\w-]/g, '').slice(0, 40);
        if (!id) return null;
        let count = 0;
        const tracks = (Array.isArray(tl.tracks) ? tl.tracks : []).filter(t => t && this.kinds[t.kind]).map(t => ({
            kind: t.kind,
            target: t.target === undefined || t.target === null ? '' : String(t.target),
            keys: (Array.isArray(t.keys) ? t.keys : []).map(k => this.normalizeKey(k)).filter(k => k && count++ < this.maxKeys)
                .sort((a, b) => a.t - b.t)
        }));
        return { id, name: String(tl.name || id).slice(0, 60), length: Math.max(1, Math.round(Number(tl.length) || 0) || 1), tracks };
    },

    // The frames it runs: its own length, or to its last key.
    length(tl) {
        const t = this.normalize(tl);
        if (!t) return 0;
        let last = 0;
        for (const track of t.tracks) for (const k of track.keys) if (k.t > last) last = k.t;
        return Math.max(t.length, last + 1);
    },

    // The keys with from < t <= to, in time order; at the same frame, in track order and then key order.
    due(tl, fromFrame, toFrame) {
        const t = this.normalize(tl);
        if (!t) return [];
        const out = [];
        t.tracks.forEach((track, ti) => track.keys.forEach((key, ki) => {
            if (key.t > fromFrame && key.t <= toFrame) out.push({ track, key, ti, ki });
        }));
        out.sort((a, b) => a.key.t - b.key.t || a.ti - b.ti || a.ki - b.ki);
        return out;
    },

    list() {
        const data = typeof window !== 'undefined' && window.$dataDocsDoodads;
        return (data && Array.isArray(data.timelines) ? data.timelines : []).map(t => this.normalize(t)).filter(Boolean);
    },

    find(idOrName) {
        const want = String(idOrName || '').trim().toLowerCase();
        return this.list().find(t => t.id.toLowerCase() === want || t.name.toLowerCase() === want) || null;
    },

    // ---- Running a key: only what exists already ----
    command(name, args) {
        const fn = typeof PluginManager !== 'undefined' && PluginManager._commands ? PluginManager._commands[pluginName + ':' + name] : null;
        if (typeof fn !== 'function') return false;
        fn.call({ wait() {}, setWaitMode() {}, _eventId: 0, character: () => null }, Object.assign({}, args));
        return true;
    },

    character(target) {
        if (String(target).toLowerCase() === 'player' || target === '' || target === undefined) return typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        return typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.event(Number(target) || 0) : null;
    },

    run(track, key) {
        const api = DocsDoodads.api, str = v => (v === undefined || v === null ? '' : String(v));
        switch (track.kind) {
            case 'camera':
                if (key.mode === 'zoom') return this.command('zoomToPoint', { target: 'tile', x: str(key.x || 0), y: str(key.y || 0), scale: str(key.scale || 2), frames: str(key.frames || 60), wait: 'false' });
                if (key.mode === 'follow') return api.followCamera();
                return this.command('cameraPath2d', { points: str(key.points), frames: str(key.frames || 90), ease: 'smooth', then: 'stay', wait: 'false' });
            case 'camera3d':
                return this.command('setCamera', { pitch: str(key.pitch), yaw: str(key.yaw), zoom: str(key.zoom), duration: str(key.duration || 30), wait: 'false' });
            case 'state': return api.setState(track.target, key.state === undefined ? 'next' : key.state);
            case 'light': return api.setLight(track.target, key.on === 'own' ? null : key.on !== 'off');
            case 'ambient': return api.ambient(key.darkness === '' || key.darkness === undefined ? null : Number(key.darkness), key.color || undefined, Number(key.frames) || 0);
            case 'weather':
                if (typeof $gameScreen !== 'undefined' && $gameScreen && $gameScreen.changeWeather) $gameScreen.changeWeather(key.type || 'none', Number(key.power) || 0, Number(key.frames) || 0);
                return true;
            case 'look': return this.command('setLook', { look: str(key.look || 'map'), duration: str(key.duration || 60) });
            case 'effect': return this.command('playScreenEffect', { effect: str(key.effect || 'shockwave'), strength: str(key.strength || 1), duration: str(key.duration || 40), origin: 'player', eventId: '0' });
            case 'character': {
                const ch = this.character(track.target);
                if (!ch) return false;
                if (key.action === 'face' && key.dir) ch.setDirection(Number(key.dir));
                else if (key.action === 'walk') {
                    const list = [], dx = Math.round(Number(key.dx) || 0), dy = Math.round(Number(key.dy) || 0);
                    for (let i = 0; i < Math.abs(dx); i++) list.push({ code: dx > 0 ? 3 : 2 });
                    for (let i = 0; i < Math.abs(dy); i++) list.push({ code: dy > 0 ? 1 : 4 });
                    list.push({ code: 0 });
                    if (ch.forceMoveRoute) ch.forceMoveRoute({ list, repeat: false, skippable: true, wait: false });
                } else if (key.action === 'balloon' && typeof $gameTemp !== 'undefined') $gameTemp.requestBalloon(ch, Number(key.id) || 1);
                else if (key.action === 'animation' && typeof $gameTemp !== 'undefined') $gameTemp.requestAnimation([ch], Number(key.id) || 1);
                else if (key.action === 'sheet') return this.command('characterAction', { target: String(track.target).toLowerCase() === 'player' ? 'player' : 'event', eventId: str(track.target), sheet: str(key.sheet), fps: '8', loops: '1', hold: 'false', wait: 'false' });
                else if (key.action === 'show' && ch.setTransparent) ch.setTransparent(!key.visible);
                return true;
            }
            case 'vfx': return api.playVfx(key.id, { x: Number(key.x) || 0, y: Number(key.y) || 0 });
            case 'time': return api.setTime(Number(key.hour) || 0, Number(key.minute) || 0);
            case 'wind': return api.setWind(Number(key.strength) || 0, Number(key.frames) || 0);
            case 'sound':
                if (key.name && typeof AudioManager !== 'undefined') AudioManager.playSe({ name: String(key.name), volume: Number(key.volume) || 90, pitch: Number(key.pitch) || 100, pan: 0 });
                return true;
            case 'switch':
                if (typeof $gameSwitches !== 'undefined' && $gameSwitches && key.id) $gameSwitches.setValue(Number(key.id), Boolean(key.on));
                return true;
        }
        return false;
    },

    // ---- The player ----
    play(idOrTimeline, opts = {}) {
        const tl = typeof idOrTimeline === 'object' ? this.normalize(idOrTimeline) : this.find(idOrTimeline);
        if (!tl) return false;
        this.stop(false);
        this._player = { tl, frame: -1, length: this.length(tl), paused: false, held: 0, skippable: opts.skippable !== false, onKey: opts.onKey || null };
        return true;
    },

    isPlaying(id) {
        const p = this._player;
        return Boolean(p) && (id === undefined || p.tl.id === id || p.tl.name.toLowerCase() === String(id).toLowerCase());
    },

    frame() { return this._player ? this._player.frame : -1; },

    // Runs the keys of the next frame (or of every frame to `to` at once).
    step(to) {
        const p = this._player;
        if (!p || p.paused && to === undefined) return false;
        const next = to === undefined ? p.frame + 1 : Math.max(p.frame, Math.min(p.length, to));
        for (const action of this.due(p.tl, p.frame, next)) {
            try { this.run(action.track, action.key); } catch (error) { DocsDoodads.Core.log(`Timeline key could not run (${action.track.kind}).`, error); }
            if (p.onKey) p.onKey(action);
        }
        p.frame = next;
        if (p.frame >= p.length - 1) this.stop(false);
        return true;
    },

    // Holding OK (Enter, Space or a pad's A) for a second skips: the remaining keys run at once.
    update() {
        const p = this._player;
        if (!p) return;
        if (p.skippable && typeof Input !== 'undefined' && Input.isPressed && Input.isPressed('ok')) {
            if (++p.held >= 60) { this.step(p.length); return; }
        } else p.held = 0;
        this.step();
    },

    // Stops; the camera follows the player again unless keep is true.
    stop(restore = true) {
        const was = this._player;
        this._player = null;
        if (was && restore && DocsDoodads.api) {
            try { DocsDoodads.api.followCamera(); } catch (error) { /* no camera */ }
        }
        return Boolean(was);
    }
};

if (typeof Spriteset_Map !== 'undefined') {
    Spriteset_Map.prototype.updateDocsTimeline = function() {
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted && !DocsDoodads.Timeline._editorPreview) return;
        DocsDoodads.Timeline.update();
        // The editor's play head follows a preview.
        const W = DocsDoodads.Workspace;
        if (DocsDoodads.Timeline._editorPreview && W && W.mounted && W.drawTimeline) W.drawTimeline();
    };
}

if (typeof Game_Interpreter !== 'undefined') {
    const wait = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'docsTimeline') {
            const waiting = DocsDoodads.Timeline.isPlaying(this._docsWaitTimeline);
            if (!waiting) { this._waitMode = ''; this._docsWaitTimeline = null; }
            return waiting;
        }
        return wait.call(this);
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'playTimeline', function(args) {
        const T = DocsDoodads.Timeline, tl = T.find(args.name);
        if (!tl || !T.play(tl, { skippable: String(args.skippable) !== 'false' })) return;
        if (String(args.wait) === 'true' && this && this.setWaitMode) {
            this._docsWaitTimeline = tl.id;
            this.setWaitMode('docsTimeline');
        }
    });
    PluginManager.registerCommand(pluginName, 'stopTimeline', () => DocsDoodads.Timeline.stop(true));
}
