// @editor-only
//==========================================================
// SECTION 25W: REWIND IN A PLAYTEST (8.4.6)
//==========================================================
// While the editor is closed, every half second a snapshot is made the way MZ makes a save (its save contents,
// kept in memory, never on disk) into a ring of 60: thirty seconds. Holding the Rewind key (Ctrl+Backspace, in
// More > Keys) steps back through them; letting go loads the one reached as MZ loads a save and plays on. F10 then
// opens the editor at that moment. A snapshot cannot hold sounds mid-play, running effects or a battle, so the key
// does nothing in battles and menus. If one snapshot takes more than 4 ms on this project, only the map, the
// player, switches, variables and self switches are kept.
DocsDoodads.Rewind = {
    size: 60,
    every: 30,
    slowMs: 4,
    ring: [],
    light: false,
    held: false,
    back: 0,
    _timings: [],

    now() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); },

    allowed() {
        const C = DocsDoodads.Compat;
        if (!C || !C.isTest()) return false;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return false;
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        return Boolean(scene && typeof Scene_Map !== 'undefined' && scene instanceof Scene_Map && typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId() > 0);
    },

    // The whole game as a save, or (light) the map, the player, switches, variables and self switches.
    take() {
        const started = this.now();
        let shot;
        if (!this.light && typeof DataManager !== 'undefined' && DataManager.makeSaveContents && typeof JsonEx !== 'undefined') {
            shot = { full: JsonEx.stringify(DataManager.makeSaveContents()) };
        } else {
            shot = { light: JSON.stringify({ switches: $gameSwitches._data, variables: $gameVariables._data, self: typeof $gameSelfSwitches !== 'undefined' && $gameSelfSwitches ? $gameSelfSwitches._data : null }) };
        }
        shot.mapId = $gameMap.mapId(); shot.x = $gamePlayer.x; shot.y = $gamePlayer.y; shot.d = $gamePlayer.direction();
        shot.frame = typeof Graphics !== 'undefined' ? Graphics.frameCount : 0;
        const took = this.now() - started;
        this._timings.push(took);
        if (this._timings.length > 6) this._timings.shift();
        if (!this.light && this._timings.length >= 4 && this._timings.reduce((a, b) => a + b, 0) / this._timings.length > this.slowMs) this.light = true;
        return shot;
    },

    push(shot) {
        this.ring.push(shot);
        while (this.ring.length > this.size) this.ring.shift();
    },

    // Back to a snapshot as MZ loads a save, on the same scene (fade-less transfer to where the player was).
    load(shot) {
        if (!shot) return false;
        if (shot.full && typeof DataManager !== 'undefined' && DataManager.extractSaveContents) DataManager.extractSaveContents(JsonEx.parse(shot.full));
        else if (shot.light) {
            const v = JSON.parse(shot.light);
            $gameSwitches._data = v.switches || []; $gameVariables._data = v.variables || [];
            if (v.self && typeof $gameSelfSwitches !== 'undefined' && $gameSelfSwitches) $gameSelfSwitches._data = v.self;
        }
        if ($gamePlayer.reserveTransfer) $gamePlayer.reserveTransfer(shot.mapId, shot.x, shot.y, shot.d, 2);
        if ($gamePlayer.requestMapReload) $gamePlayer.requestMapReload();
        return true;
    },

    // Once a frame on the map: snapshot every half second, or step back while the key is held.
    update() {
        if (!this._listening) this.listen();
        if (!this.allowed()) { if (this.held) this.release(); return; }
        if (this.held) {
            if (++this._tick % 6 === 0 && this.back < this.ring.length - 1) this.back++;
            this.showBack();
            return;
        }
        if (++this._tick % this.every === 0) this.push(this.take());
    },

    press() {
        if (!this.allowed() || !this.ring.length || this.held) return false;
        this.held = true; this.back = 0; this._tick = 0;
        return true;
    },

    release() {
        if (!this.held) return false;
        this.held = false;
        const index = this.ring.length - 1 - this.back;
        const shot = this.ring[index];
        this.ring = this.ring.slice(0, index + 1);
        this.hideBack();
        return shot ? this.load(shot) : false;
    },

    seconds() {
        const last = this.ring[this.ring.length - 1], at = this.ring[this.ring.length - 1 - this.back];
        return last && at ? Math.round((last.frame - at.frame) / 60) : 0;
    },

    showBack() {
        if (typeof document === 'undefined' || !document.createElement || !document.body) return;
        let el = document.getElementById('dd-rewind');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-rewind';
            el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:12px;background:rgba(0,0,0,0.7);color:#fff;font:bold 14px sans-serif;z-index:20000;pointer-events:none;';
            document.body.appendChild(el);
        }
        el.textContent = `◀◀ ${this.seconds()} s${this.light ? ' (map, player, switches and variables)' : ''}`;
    },

    hideBack() {
        const el = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-rewind') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    reset() { this.ring = []; this.held = false; this.back = 0; this._tick = 0; this.hideBack(); },
    _tick: 0
};

(function() {
    const R = DocsDoodads.Rewind;
    if (typeof Scene_Map !== 'undefined') {
        const update = Scene_Map.prototype.update;
        Scene_Map.prototype.update = function() {
            const result = update.apply(this, arguments);
            try { R.update(); } catch (error) { DocsDoodads.Core.log('Rewind snapshot failed; rewind is off for this play.', error); R.update = () => {}; }
            return result;
        };
    }
    // A new game or a loaded save starts the ring again.
    if (typeof DataManager !== 'undefined') {
        for (const name of ['setupNewGame']) {
            const original = DataManager[name];
            if (typeof original === 'function') DataManager[name] = function() { R.reset(); return original.apply(this, arguments); };
        }
    }
    // The key's listeners are added the first time the map runs, after the editor's own key handling.
    R.listen = function() {
        if (this._listening || typeof window === 'undefined' || !window.addEventListener) return;
        this._listening = true;
        const matches = e => {
            const S = DocsDoodads.Shortcuts, K = DocsDoodads.KeyChord;
            const chord = S && S.chordOf ? S.chordOf('rewind') : null;
            return Boolean(chord && K && K.matches(chord, e));
        };
        window.addEventListener('keydown', e => { if (!e.repeat && matches(e) && R.press()) e.preventDefault(); });
        // Letting go of any key of the chord plays on from where it reached.
        window.addEventListener('keyup', () => { if (R.held) R.release(); });
    };
})();
