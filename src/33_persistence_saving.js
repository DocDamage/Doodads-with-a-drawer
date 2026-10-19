//==========================================================
// SECTION 21b: NAMED CHECKPOINTS, SAVING ONE MAP, AUTOSAVE
//==========================================================
// A checkpoint is a named copy of one map's doodads and map settings ("Before scattering"), kept in the
// editor's cache folder so it lasts through Save and closing the game; Steps lists them and restores one
// as an undo step. "Save this map only" writes this map's doodads, settings and events and leaves the
// other maps' unsaved changes for later. Autosave (More) saves the project every few minutes of unsaved work.
DocsDoodads.Checkpoints = {
    path: 'data/docs_doodads_cache/checkpoints.json',
    maxPerMap: 20,
    data: null,

    load() {
        if (!this.data) {
            const read = DocsDoodads.FS.readJson(this.path);
            this.data = read && typeof read === 'object' && !Array.isArray(read) ? read : {};
        }
        return this.data;
    },

    write() {
        DocsDoodads.FS.mkdirp(DocsDoodads.FS.path ? DocsDoodads.FS.path.dirname(this.path) : 'data/docs_doodads_cache');
        DocsDoodads.FS.atomicWriteJson(this.path, this.load(), 0);
    },

    // A map's checkpoints, newest first: [{ id, name, at, count }].
    list(mapId) {
        return (this.load()[mapId] || []).slice().sort((a, b) => b.at - a.at)
            .map(c => ({ id: c.id, name: c.name, at: c.at, count: (c.doodads || []).length }));
    },

    get(mapId, id) {
        return (this.load()[mapId] || []).find(c => c.id === id) || null;
    },

    // Keeps a copy of the doodads (not those the API placed for this play) and the map's settings.
    // The oldest go past maxPerMap.
    create(mapId, name, doodads, settings, now = Date.now()) {
        const all = this.load();
        const list = all[mapId] = all[mapId] || [];
        const entry = {
            id: 'cp_' + now.toString(36) + '_' + Math.floor(Math.random() * 1e6).toString(36),
            name: String(name || '').trim() || 'Checkpoint', at: now,
            doodads: JSON.parse(JSON.stringify((doodads || []).filter(d => d && !d.temp))),
            settings: settings ? JSON.parse(JSON.stringify(settings)) : null
        };
        list.push(entry);
        list.sort((a, b) => a.at - b.at);
        while (list.length > this.maxPerMap) list.shift();
        this.write();
        return entry;
    },

    remove(mapId, id) {
        const all = this.load();
        const before = (all[mapId] || []).length;
        all[mapId] = (all[mapId] || []).filter(c => c.id !== id);
        if (!all[mapId].length) delete all[mapId];
        if (before === (all[mapId] || []).length) return false;
        this.write();
        return true;
    }
};

Object.assign(DocsDoodads.Persistence, {
    // Writes one map's doodads, map settings and (when it is the map on screen) its event edits; the other
    // maps' unsaved changes stay unsaved. Returns true when written.
    saveMapOnly(mapId) {
        const gameMap = window.$gameMap;
        if (!gameMap) return false;
        mapId = Number(mapId || gameMap.mapId());
        const W = DocsDoodads.Workspace, DF = DocsDoodads.DataFiles, FS = DocsDoodads.FS;
        const mapFile = this.mapFilePath(mapId);
        const snap = this.sessionSnapshots[mapFile], now = FS.stat(mapFile);
        if (snap && now && (snap.mtimeMs !== now.mtimeMs || snap.size !== now.size)) {
            W.showConflictModal();
            return false;
        }
        const live = window.$dataDocsDoodads || {};
        const merged = Object.assign({}, DF.readAll() || {});
        delete merged._mapFiles;
        if (Array.isArray(live[mapId]) && live[mapId].length) merged[mapId] = live[mapId]; else delete merged[mapId];
        const settings = Object.assign({}, merged.mapSettings || {});
        if (live.mapSettings && live.mapSettings[mapId]) settings[mapId] = live.mapSettings[mapId]; else delete settings[mapId];
        if (Object.keys(settings).length) merged.mapSettings = settings; else delete merged.mapSettings;

        const owner = gameMap._stagedMapData && (gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId());
        const mapEntries = gameMap._stagedMapData && Number(owner) === mapId ? [{ path: mapFile, data: gameMap._stagedMapData, indent: 2 }] : [];
        const doodadEntries = DF.entriesFor(merged);
        const entries = mapEntries.concat(doodadEntries);
        try {
            FS.backupChanged(entries);
        } catch (error) {
            W.showToast(`Save cancelled: backup failed (${error.message || error}).`);
            return false;
        }
        const result = FS.atomicWriteManyJson(entries);
        if (!result.ok) {
            W.showToast(`Save failed${result.rolledBack ? '; previous files restored' : ''}: ${result.error}`);
            return false;
        }
        if (mapEntries.length) this.sessionSnapshots[mapFile] = FS.stat(mapFile);
        DF.removeStale(doodadEntries);
        // Unsaved work is left only if the doodad data still differs from what is now on disk.
        const still = JSON.stringify(DF.stable(live)) !== JSON.stringify(DF.stable(merged));
        this.dirtyMap = Object.keys(this.stagedMaps).length > 0 || (this._dirtyMap && !mapEntries.length);
        this.dirtyDoodads = still;
        this.touchedMaps.delete(mapId);
        if (!this.hasUnsavedWork()) { this.lastSavedAt = Date.now(); this.clearRecovery(); }
        W.showToast(this.hasUnsavedWork() ? 'Saved this map. Other maps still have unsaved changes.' : 'Saved this map. Everything is saved.');
        if (W.mounted) W.updateSaveState(!this.hasUnsavedWork());
        return true;
    },

    // Minutes between autosaves (0: off), a per-computer choice.
    autosaveMinutes() {
        const m = Number(DocsDoodads.Ui.prefs().autosaveMinutes);
        return m > 0 ? m : 0;
    },

    // Called every few seconds: saves when there has been unsaved work for the chosen minutes and nothing
    // is being dragged or asked. A map changed in MZ meanwhile is not overwritten: it says so once.
    autosaveTick(now = Date.now()) {
        const minutes = this.autosaveMinutes();
        if (!minutes || !this.hasUnsavedWork()) { this._unsavedSince = null; this._autosaveWarned = false; return false; }
        if (!this._unsavedSince) this._unsavedSince = now;
        if (now - Math.max(this._unsavedSince, this.lastSavedAt || 0) < minutes * 60000) return false;
        const W = DocsDoodads.Workspace;
        const busy = W.isBrushActive || W._dragActive || W.isMarqueeActive || W._handleDrag ||
            (typeof document !== 'undefined' && document.getElementById && document.getElementById('dd-dialog'));
        if (busy) return false;
        if (this.checkConflict()) {
            if (!this._autosaveWarned) W.showToast('Autosave waits: a map was changed in RPG Maker MZ. Save to choose what to keep.', 'warning');
            this._autosaveWarned = true;
            return false;
        }
        const ok = this.saveAll(true);
        if (ok) { this._unsavedSince = null; W.showToast(`Autosaved (every ${minutes} minutes).`); }
        return ok;
    }
});
