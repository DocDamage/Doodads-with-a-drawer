Object.assign(DocsDoodads.Trails, {
    allowed() {
        return Boolean((typeof Utils !== 'undefined' && Utils.isOptionValid && Utils.isOptionValid('test')) ||
            (this._testerEnabled === undefined ? parseBooleanParameter(parameters.testerTrails, false) : this._testerEnabled));
    },
    validMap(id) { return typeof $dataMapInfos !== 'undefined' && Boolean($dataMapInfos && $dataMapInfos[id]); },
    storage() {
        // A Node test runner (even one with mocked Utils) must never resolve its source folder as a game.
        if (typeof require !== 'function' || typeof process === 'undefined' || !process.versions.nw ||
            typeof Utils === 'undefined' || !Utils.isNwjs || !Utils.isNwjs()) return null;
        const root = DocsDoodads.Capture.desktopRoot();
        return root ? { fs: require('fs'), path: require('path'), root } : null;
    },
    location(create) {
        const io = this.storage(); if (!io) return null;
        const { fs, path } = io, root = fs.realpathSync(path.resolve(io.root));
        const folder = path.resolve(root, 'data', 'docs_doodads_cache');
        let ancestor = folder;
        while (!fs.existsSync(ancestor) && path.dirname(ancestor) !== ancestor) ancestor = path.dirname(ancestor);
        const inside = target => DocsDoodads.Capture.inside(root, target, path);
        if (!inside(fs.realpathSync(ancestor))) throw new Error('Trails cache is outside the game.');
        if (create) fs.mkdirSync(folder, { recursive: true });
        if (!fs.existsSync(folder)) return null;
        const canonical = fs.realpathSync(folder);
        if (!inside(canonical)) throw new Error('Trails cache is outside the game.');
        const file = path.join(canonical, 'trails.json');
        if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Trails file must not be a link.');
        return { fs, path, file };
    },
    data() {
        if (!this._loaded) {
            this._loaded = true; this._data = this.empty();
            try {
                const at = this.location(false);
                if (at && at.fs.existsSync(at.file)) {
                    if (at.fs.statSync(at.file).size > this.maxBytes) throw new Error('This trails file is too large.');
                    this._data = this.read(at.fs.readFileSync(at.file, 'utf8'), id => this.validMap(id));
                }
            } catch (error) { this._loadError = error.message; }
            this._data._cells = Object.values(this._data.maps).reduce((n, map) => n + Object.keys(map).length, 0);
        }
        return this._data || (this._data = this.empty());
    },
    record(at) {
        if (!this.allowed() || !this.validMap(at.mapId)) return false;
        const changed = this.sample(this.data(), at);
        if (changed) this._dirty = true;
        return changed;
    },
    tick() {
        if (!this.allowed() || typeof Scene_Map === 'undefined' || typeof SceneManager === 'undefined' ||
            !(SceneManager._scene instanceof Scene_Map) || !SceneManager._scene.isActive() ||
            (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) || (DocsDoodads.PhotoMode && DocsDoodads.PhotoMode.active)) {
            if (this._data) delete this._data.cursor;
            return;
        }
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $gamePlayer === 'undefined' || !$gamePlayer) return;
        this.record({ mapId: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, frame: DocsDoodads.frameCount(),
            moving: typeof $gamePlayer.isMoving === 'function' && $gamePlayer.isMoving() });
        if (!this._unload && typeof window !== 'undefined' && window.addEventListener) {
            this._unload = () => this.flush(); window.addEventListener('beforeunload', this._unload);
        }
    },
    flush() {
        if (!this.allowed() || !this._dirty || this._loadError) return false;
        let temporary = null, at = null;
        try {
            at = this.location(true); if (!at) return false;
            const text = JSON.stringify(this.clean(this.data(), id => this.validMap(id)));
            if (text.length > this.maxBytes) return false;
            temporary = at.file + '.tmp-' + Date.now() + '-' + (this._serial = (this._serial || 0) + 1);
            at.fs.writeFileSync(temporary, text, { flag: 'wx' }); at.fs.renameSync(temporary, at.file);
            temporary = null; this._dirty = false; this._writeError = null; return true;
        } catch (error) { this._writeError = error.message; return false; }
        finally { if (temporary && at) try { at.fs.unlinkSync(temporary); } catch (error) {} }
    },
    importText(text) {
        const imported = this.read(text, id => this.validMap(id));
        const merged = this.merge(this.data(), imported, id => this.validMap(id));
        merged._cells = Object.values(merged.maps).reduce((n, map) => n + Object.keys(map).length, 0);
        this._data = merged; this._dirty = true; return merged;
    },
    rows(kind, mapId) {
        const rows = [], field = kind === 'deaths' ? 'deaths' : kind === 'steps' ? 'steps' : 'frames';
        const data = this.data();
        for (const id of Object.keys(data.maps)) {
            if ((mapId && Number(id) !== Number(mapId)) || !this.validMap(Number(id))) continue;
            for (const key of Object.keys(data.maps[id])) {
                const cell = data.maps[id][key]; if (!cell[field]) continue;
                const xy = key.split(',').map(Number); rows.push(Object.assign({ mapId: Number(id), x: xy[0], y: xy[1] }, cell));
            }
        }
        return rows.sort((a, b) => b[field] - a[field] || a.mapId - b.mapId || a.y - b.y || a.x - b.x);
    },
    clear(mapId) {
        this.data();
        if (mapId) delete this._data.maps[String(mapId)]; else this._data = this.empty();
        delete this._data.cursor; this._data._cells = Object.values(this._data.maps).reduce((n, map) => n + Object.keys(map).length, 0);
        this._loadError = null; this._dirty = true; this.flush();
    }
});
if (typeof Scene_Map !== 'undefined') {
    const update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() { const result = update.apply(this, arguments); DocsDoodads.Trails.tick(); return result; };
    for (const name of ['stop', 'terminate']) {
        const original = Scene_Map.prototype[name];
        Scene_Map.prototype[name] = function() {
            if (DocsDoodads.Trails._data) delete DocsDoodads.Trails._data.cursor;
            return typeof original === 'function' ? original.apply(this, arguments) : undefined;
        };
    }
}
if (typeof Scene_Gameover !== 'undefined') {
    const create = Scene_Gameover.prototype.create;
    Scene_Gameover.prototype.create = function() {
        const T = DocsDoodads.Trails;
        if (T.allowed() && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) && typeof $gameMap !== 'undefined' && $gameMap && typeof $gamePlayer !== 'undefined' && $gamePlayer && T.validMap($gameMap.mapId())) {
            T.death(T.data(), $gameMap.mapId(), $gamePlayer.x, $gamePlayer.y); T._dirty = true;
        }
        return create.apply(this, arguments);
    };
}
