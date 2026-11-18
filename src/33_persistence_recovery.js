// @editor-only
//==========================================================
// SECTION 21: DocsDoodads.PERSISTENCE & RECOVERY
//==========================================================
DocsDoodads.Persistence = {
    sessionSnapshots: {},
    // Unsaved event edits (dirtyMap) and doodad or setting edits (dirtyDoodads). Setting either updates
    // the Save button's unsaved dot.
    _dirtyMap: false,
    _dirtyDoodads: false,
    get dirtyMap() { return this._dirtyMap; },
    set dirtyMap(value) { this._dirtyMap = Boolean(value); if (value) { this.changeCount++; this.touch(); } this.changed(); },
    get dirtyDoodads() { return this._dirtyDoodads; },
    set dirtyDoodads(value) { this._dirtyDoodads = Boolean(value); if (value) { this.changeCount++; this.touch(); } this.changed(); },
    // Counts edits (every step marks the work unsaved again), so the crash snapshot is only written when
    // something changed since the last one.
    changeCount: 0,
    _recoveryWritten: -1,
    _recoveryEpoch: 0,
    _recoveryWriting: false,
    // The maps changed since the last save (for the map tabs' dots).
    touchedMaps: new Set(),

    touch() {
        const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
        if (gameMap && typeof gameMap.mapId === 'function') this.touchedMaps.add(Number(gameMap.mapId()));
    },

    mapHasUnsaved(mapId) {
        mapId = Number(mapId);
        return this.hasUnsavedWork() && (this.touchedMaps.has(mapId) || Boolean(this.stagedMaps[mapId]));
    },
    // Unsaved event edits for maps other than the current one, keyed by map id.
    stagedMaps: {},

    mapFilePath(mapId) {
        return `data/Map${String(mapId).padStart(3, '0')}.json`;
    },

    // The map file as the workspace opened it, so Save can tell when the MZ editor has changed it since.
    captureSession() {
        const gameMap = window.$gameMap;
        if (!gameMap) return;
        const mapFile = this.mapFilePath(gameMap.mapId());
        // Unsaved event edits keep the snapshot they were made against: Save must still notice MZ's changes.
        if (this.dirtyMap && this.sessionSnapshots[mapFile]) return;
        // A staged copy with no changes is dropped; it is read again, fresh, when it is next needed. While
        // steps can still be undone it is kept (they point into it), unless the file changed on disk:
        // then those steps go with it.
        if (!this.dirtyMap && gameMap._stagedMapData) {
            const snap = this.sessionSnapshots[mapFile], now = DocsDoodads.FS.stat(mapFile);
            const same = Boolean(snap && now && snap.mtimeMs === now.mtimeMs && snap.size === now.size);
            const Undo = DocsDoodads.Undo;
            if (!(same && Undo.hasHistory())) {
                if (Undo.hasHistory()) {
                    Undo.undoStack = [];
                    Undo.redoStack = [];
                }
                gameMap._stagedMapData = null;
                delete gameMap._stagedMapDataId;
            }
        }
        this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
    },

    // The staged (editable) copy of a map's data, loaded from disk the first time it is needed.
    // It is tagged with its map id so edits can never be written into a different map's file.
    stagedFor(mapId) {
        const gameMap = window.$gameMap;
        if (!gameMap) return null;
        mapId = mapId || gameMap.mapId();
        // Untagged staged data predates map tagging and always belongs to the current map.
        const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
        if (gameMap._stagedMapData && owner === mapId) {
            gameMap._stagedMapDataId = mapId;
            return gameMap._stagedMapData;
        }
        if (gameMap._stagedMapData) this.stagedMaps[owner] = gameMap._stagedMapData;
        let data = this.stagedMaps[mapId];
        delete this.stagedMaps[mapId];
        if (!data) {
            const mapFile = this.mapFilePath(mapId);
            if (!this.sessionSnapshots[mapFile]) this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
            data = DocsDoodads.FS.readJson(mapFile) || { events: [null] };
        }
        gameMap._stagedMapData = data;
        gameMap._stagedMapDataId = mapId;
        return data;
    },

    // Called before the game loads another map: park this map's staged edits and bring back the next one's.
    onMapChanging(fromId, toId) {
        const gameMap = window.$gameMap;
        if (!gameMap || fromId === toId) return;
        // Steps belong to the map they were made on: they wait while the editor is elsewhere, with the
        // map data they changed, and come back with the map.
        const Undo = DocsDoodads.Undo;
        const owner = gameMap._stagedMapData && gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : fromId;
        Undo.park(fromId, gameMap._stagedMapData && owner === fromId ? gameMap._stagedMapData : null, DocsDoodads.FS.stat(this.mapFilePath(fromId)));
        if (gameMap._stagedMapData) {
            if (this.dirtyMap) this.stagedMaps[owner] = gameMap._stagedMapData;
        }
        const back = Undo.unpark(toId, DocsDoodads.FS.stat(this.mapFilePath(toId)));
        this._stepsBack = back;
        gameMap._stagedMapData = this.stagedMaps[toId] || back.staged || null;
        if (gameMap._stagedMapData) {
            gameMap._stagedMapDataId = toId;
            delete this.stagedMaps[toId];
        } else {
            delete gameMap._stagedMapDataId;
        }
    },

    // Every map file this save will write: the current map's staged data plus any parked maps.
    // After a save, the running game plays the saved events of the map it is on: each event whose data
    // changed is replaced in $dataMap and its page set up again (picture, trigger, movement and commands).
    // Events added or deleted in the editor appear or go the next time the map loads. Returns the ids.
    applySavedEvents(mapId, data) {
        const gameMap = window.$gameMap, live = window.$dataMap;
        if (!gameMap || !live || !data || !Array.isArray(data.events) || Number(gameMap.mapId()) !== Number(mapId)) return [];
        if (!Array.isArray(live.events) || live === data) return [];
        const changed = [];
        for (const ge of (typeof gameMap.events === 'function' ? gameMap.events() : [])) {
            const id = ge && ge.eventId ? ge.eventId() : 0, saved = id ? data.events[id] : null;
            if (!saved || JSON.stringify(saved) === JSON.stringify(live.events[id])) continue;
            live.events[id] = JSON.parse(JSON.stringify(saved));
            // MZ sets a page up only when its index changes; force it so the new page settings are used.
            if (typeof ge.refresh === 'function') { ge._pageIndex = -2; ge.refresh(); }
            changed.push(id);
        }
        if (changed.length && typeof gameMap.requestRefresh === 'function') gameMap.requestRefresh();
        return changed;
    },

    pendingMapEntries() {
        const entries = [];
        const gameMap = window.$gameMap;
        if (gameMap && gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
            entries.push({ mapId: owner, data: gameMap._stagedMapData });
        }
        for (const [mapId, data] of Object.entries(this.stagedMaps)) {
            if (!entries.some(e => String(e.mapId) === String(mapId))) entries.push({ mapId: Number(mapId), data });
        }
        return entries;
    },

    // Other files a Save writes in the same all-or-nothing transaction (Tilesets.json for tile flags, MapInfos.json
    // for new maps): { name, entries() → [{ path, data | json }], conflict() → bool, committed(), dirty() → bool }.
    savers: [],

    saverEntries() {
        const out = [];
        for (const saver of this.savers) {
            try { if (saver.dirty()) out.push(...(saver.entries() || [])); } catch (error) { DocsDoodads.Core.log(`${saver.name} could not be prepared for saving.`, error); throw error; }
        }
        return out;
    },

    checkConflict() {
        if (this.savers.some(saver => saver.dirty() && saver.conflict())) return true;
        if (!window.$gameMap) return false;
        const files = new Set([this.mapFilePath($gameMap.mapId())]);
        for (const entry of this.pendingMapEntries()) files.add(this.mapFilePath(entry.mapId));
        for (const mapFile of files) {
            const snap = this.sessionSnapshots[mapFile];
            if (!snap) continue;
            const current = DocsDoodads.FS.stat(mapFile);
            if (!current) continue;
            if (current.mtimeMs !== snap.mtimeMs || current.size !== snap.size) return true;
        }
        return false;
    },

    saveAll(force = false) {
        if (!window.$gameMap) return false;
        if (DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.flushUsage) DocsDoodads.AssetIndex.flushUsage();
        if (!force && this.checkConflict()) {
            DocsDoodads.Workspace.showConflictModal();
            return false;
        }

        // The ground brush (8.3.4): each painted map names its mask before the data is written.
        const ground = DocsDoodads.Workspace && DocsDoodads.Workspace.prepareGroundSave ? DocsDoodads.Workspace.prepareGroundSave() : null;
        const savedDoodads = DocsDoodads.DataFiles.readAll() || {};
        const liveDoodads = window.$dataDocsDoodads || {};
        const mapEntries = this.pendingMapEntries().map(e => ({ path: this.mapFilePath(e.mapId), data: e.data, indent: 2 }));
        const doodadEntries = DocsDoodads.DataFiles.entriesFor(liveDoodads);
        let extraEntries;
        try {
            extraEntries = this.saverEntries();
        } catch (error) {
            DocsDoodads.Workspace.showToast(`Save cancelled: ${error.message || error}`);
            return false;
        }
        const committedSavers = this.savers.filter(saver => saver.dirty());
        const entries = mapEntries.concat(doodadEntries, [
            { path: DocsDoodads.AssetIndex.libraryPath, data: DocsDoodads.AssetIndex.data, indent: 0 }
        ], extraEntries);

        try {
            // Only files whose text changes get a backup (and the backups folder is read once).
            DocsDoodads.FS.backupChanged(entries);
        } catch (error) {
            DocsDoodads.Core.log('Backup creation failed; save cancelled.', error);
            DocsDoodads.Workspace.showToast(`Save cancelled: backup failed (${error.message || error}).`);
            return false;
        }

        const saveResult = DocsDoodads.FS.atomicWriteManyJson(entries);
        if (!saveResult.ok) {
            DocsDoodads.Core.log('Project save transaction failed.', saveResult.error);
            DocsDoodads.Workspace.showToast(`Save failed${saveResult.rolledBack ? '; previous files restored' : ''}: ${saveResult.error}`);
            return false;
        }

        for (const entry of mapEntries) this.sessionSnapshots[entry.path] = DocsDoodads.FS.stat(entry.path);
        for (const entry of this.pendingMapEntries()) {
            try { this.applySavedEvents(entry.mapId, entry.data); } catch (error) { DocsDoodads.Core.log('Saved events not applied to the game.', error); }
        }
        for (const saver of committedSavers) { try { saver.committed(); } catch (error) { DocsDoodads.Core.log(`${saver.name} save bookkeeping failed.`, error); } }
        this.stagedMaps = {};
        DocsDoodads.DataFiles.removeStale(doodadEntries);
        // A map's own JSON does not change when only its doodads do. Forget only pictures whose saved
        // doodads/layer visibility changed; cache failures never change the successful save result.
        try {
            const committed = DocsDoodads.DataFiles.stable(liveDoodads);
            DocsDoodads.MapThumb.invalidateMany(DocsDoodads.MapThumb.changedMapIds(savedDoodads, committed));
        } catch (error) {
            DocsDoodads.Core.log('Changed map pictures could not be invalidated.', error);
        }

        this.lastSavedAt = Date.now();
        this.dirtyMap = false;
        this.dirtyDoodads = false;
        this.clearRecovery();
        // The files MZ's "Exclude unused files" can't see (22_required_assets.js); a failure doesn't stop the save.
        if (ground) DocsDoodads.Workspace.writeGroundMasks(ground);
        try { if (DocsDoodads.RequiredAssets) DocsDoodads.RequiredAssets.write(); } catch (e) { DocsDoodads.Core.log('Required assets list not written.', e); }
        const extra = mapEntries.length > 1 ? ` (${mapEntries.length} maps)` : '';
        DocsDoodads.Workspace.showToast(`Project Saved${extra}! Reload maps in MZ before editing there.`);
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.updateSaveState(true);
        // Disposable navigation art is best-effort and must never turn a successful save into a failure.
        if (DocsDoodads.Workspace.mapThumb) DocsDoodads.Workspace.mapThumb($gameMap.mapId(), { force: true });
        return true;
    },

    hasUnsavedWork() {
        return Boolean(this._dirtyMap || this._dirtyDoodads || this.savers.some(saver => saver.dirty()));
    },

    changed() {
        if (!this.hasUnsavedWork()) this.touchedMaps.clear();
        const W = DocsDoodads.Workspace;
        if (W && W.mounted && W.updateSaveState) W.updateSaveState();
        if (W && W.mounted && W.renderMapTabs) W.renderMapTabs();
    },

    // Throws away unsaved work: doodads and settings are read again from disk, event edits are dropped
    // (events moved on this map go back to their saved tiles), and the crash snapshot is removed.
    discardUnsaved() {
        if (DocsDoodads.MapThumb && DocsDoodads.MapThumb.clearVolatile) DocsDoodads.MapThumb.clearVolatile();
        const data = DocsDoodads.DataFiles.readAll();
        window.$dataDocsDoodads = data || {};
        DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
        if (DocsDoodads.World && DocsDoodads.World.invalidate) DocsDoodads.World.invalidate();
        const gameMap = window.$gameMap;
        if (gameMap && this._dirtyMap) {
            const saved = DocsDoodads.FS.readJson(this.mapFilePath(gameMap.mapId()));
            if (saved && saved.events && typeof gameMap.events === 'function') {
                for (const ge of gameMap.events()) {
                    const ev = ge && saved.events[ge.eventId()];
                    if (ev && (ge.x !== ev.x || ge.y !== ev.y)) ge.locate(ev.x, ev.y);
                }
            }
        }
        if (gameMap) {
            gameMap._stagedMapData = null;
            delete gameMap._stagedMapDataId;
        }
        this.stagedMaps = {};
        DocsDoodads.Undo.clear();
        this.dirtyMap = false;
        this.dirtyDoodads = false;
        this.captureSession();
        this.clearRecovery();
    },

    // Snapshots written during this Playtest run are its own autosaves, not crash leftovers.
    bootedAt: Date.now(),

    recoverableSnapshot() {
        const recovery = DocsDoodads.FS.readJson('data/DocsDoodadsRecovery.json');
        if (!recovery || !recovery.timestamp) return null;
        if (recovery.timestamp >= this.bootedAt) return null;
        if (this.bootedAt - recovery.timestamp >= 86400000) return null;
        if (recovery.timestamp === this.answeredRecovery) return null;
        return recovery;
    },

    // Accepted or declined: don't ask again about the same snapshot while this Playtest runs.
    markRecoveryAnswered(recovery) {
        this.answeredRecovery = recovery ? recovery.timestamp : null;
    },

    // The crash snapshot of everything unsaved, written (without blocking the editor) when there is
    // unsaved work that changed since the last snapshot. Returns the write's promise, or null when skipped.
    writeRecovery() {
        if (this._recoveryWriting || this.changeCount === this._recoveryWritten) return null;
        const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
        if (!gameMap || !(this.dirtyMap || this.dirtyDoodads)) return null;
        const data = window.$dataDocsDoodads || {};
        const snapshot = {
            timestamp: Date.now(),
            mapId: gameMap.mapId(),
            doodads: DocsDoodads.doodads(),
            // Every map's doodads (Move / Copy to Map, mirrored edges and prefab syncs reach other
            // maps) and the event edits parked for maps other than this one.
            allDoodads: Object.fromEntries(Object.entries(data).filter(([key, list]) => /^\d+$/.test(key) && Array.isArray(list))),
            stagedMaps: this.stagedMaps,
            mapSettings: data.mapSettings,
            world: data.world,
            // null records a metadata key deliberately removed by the editor. It is distinct from old
            // snapshots that have no field at all, and from an explicitly empty object or array.
            notes: Object.prototype.hasOwnProperty.call(data, 'notes') && data.notes !== undefined ? data.notes : null,
            bookmarks: Object.prototype.hasOwnProperty.call(data, 'bookmarks') && data.bookmarks !== undefined ? data.bookmarks : null,
            pins: Object.prototype.hasOwnProperty.call(data, 'pins') && data.pins !== undefined ? data.pins : null,
            stagedMap: gameMap._stagedMapData
        };
        const count = this.changeCount, epoch = this._recoveryEpoch;
        this._recoveryWriting = true;
        // A save (clearRecovery) while this is being written wins: the snapshot is not put in place.
        return DocsDoodads.FS.atomicWriteJsonAsync('data/DocsDoodadsRecovery.json', snapshot, 0, () => this._recoveryEpoch === epoch)
            .then(ok => { if (ok) this._recoveryWritten = count; return ok; })
            .finally(() => { this._recoveryWriting = false; });
    },

    clearRecovery() {
        this._recoveryEpoch++;
        this._recoveryWritten = -1;
        const recoveryPath = 'data/DocsDoodadsRecovery.json';
        for (const filePath of [recoveryPath, DocsDoodads.Legacy.pathFor(recoveryPath)]) {
            if (DocsDoodads.FS.fs && DocsDoodads.FS.fs.existsSync(filePath)) {
                try { DocsDoodads.FS.fs.unlinkSync(filePath); } catch(e) {}
            }
        }
    }
};

