//==========================================================
// SECTION 21: DocsDoodads.PERSISTENCE & RECOVERY
//==========================================================
DocsDoodads.Persistence = {
    sessionSnapshots: {},
    dirtyMap: false,
    dirtyDoodads: false,
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
        // A staged copy with no changes is dropped; it is read again, fresh, when it is next needed.
        if (!this.dirtyMap && gameMap._stagedMapData) {
            gameMap._stagedMapData = null;
            delete gameMap._stagedMapDataId;
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
        // Undo commands capture the map they were made on; they must not run against another map.
        DocsDoodads.Undo.clear();
        if (gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : fromId;
            if (this.dirtyMap) this.stagedMaps[owner] = gameMap._stagedMapData;
        }
        gameMap._stagedMapData = this.stagedMaps[toId] || null;
        if (gameMap._stagedMapData) {
            gameMap._stagedMapDataId = toId;
            delete this.stagedMaps[toId];
        } else {
            delete gameMap._stagedMapDataId;
        }
    },

    // Every map file this save will write: the current map's staged data plus any parked maps.
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

    checkConflict() {
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
        if (!force && this.checkConflict()) {
            DocsDoodads.Workspace.showConflictModal();
            return false;
        }

        const doodadFile = 'data/' + dataFileName;
        const mapEntries = this.pendingMapEntries().map(e => ({ path: this.mapFilePath(e.mapId), data: e.data, indent: 2 }));
        const entries = mapEntries.concat([
            { path: doodadFile, data: window.$dataDocsDoodads || {}, indent: saveMode ? 0 : 2 },
            { path: DocsDoodads.AssetIndex.libraryPath, data: DocsDoodads.AssetIndex.data, indent: 2 }
        ]);

        try {
            for (const entry of entries) DocsDoodads.FS.createTimestampedBackup(entry.path);
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
        this.stagedMaps = {};

        this.dirtyMap = false;
        this.dirtyDoodads = false;
        this.clearRecovery();
        const extra = mapEntries.length > 1 ? ` (${mapEntries.length} maps)` : '';
        DocsDoodads.Workspace.showToast(`Project Saved${extra}! Reload maps in MZ before editing there.`);
        return true;
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

    clearRecovery() {
        const recoveryPath = 'data/DocsDoodadsRecovery.json';
        for (const filePath of [recoveryPath, DocsDoodads.Legacy.pathFor(recoveryPath)]) {
            if (DocsDoodads.FS.fs && DocsDoodads.FS.fs.existsSync(filePath)) {
                try { DocsDoodads.FS.fs.unlinkSync(filePath); } catch(e) {}
            }
        }
    }
};

