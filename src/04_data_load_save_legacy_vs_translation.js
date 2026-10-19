//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
DocsDoodads.migrateData = function(data, type) {
    if (!data) return data;
    if (type === 'doodads') {
        for (var mapId in data) {
            var list = data[mapId];
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    var d = list[i];
                    if (!d.collision) d.collision = { preset: "none", shape: null };
                    if (d.scaleX === undefined) d.scaleX = 1;
                    if (d.scaleY === undefined) d.scaleY = 1;
                    if (d.anchorX === undefined) d.anchorX = 0.5;
                    if (d.anchorY === undefined) d.anchorY = 1.0;
                    if (d.opacity === undefined) d.opacity = 1.0;
                    if (d.posMode === undefined) d.posMode = 1;
                    if (d.rotation === undefined) d.rotation = 0;
                    if (d.rotateSpeed === undefined) d.rotateSpeed = 0;
                    if (!d.switch) d.switch = [];
                    if (d.condition === undefined) d.condition = "";
                    if (!DocsDoodads.Depth.modes.includes(d.depth)) d.depth = DocsDoodads.Depth.fromLegacyZ(d.z);
                }
            }
        }
    } else if (type === 'library') {
        if (!data.version || data.version < 2) {
            data.version = 2;
            data.settings = data.settings || {};
            data.collections = data.collections || {};
            data.assets = data.assets || {};
        }
    }
    return data;
};

// The doodad data on disk: one file, or (Doodad Files: One file per map) a main file with the settings
// and a list of the maps, and each map's doodads in data/DocsDoodads/DocsDoodads-Map003.json. Keys are
// written in a fixed order so saving the same data gives the same file (small diffs in Git).
DocsDoodads.DataFiles = {
    split: splitByMap,

    mainPath() {
        return 'data/' + dataFileName;
    },

    baseName() {
        return dataFileName.replace(/\.json$/i, '');
    },

    // Its own name (not MapNNN.json), so its backups never mix with the MZ map's.
    mapPath(mapId) {
        return `data/${this.baseName()}/${this.baseName()}-Map${String(mapId).padStart(3, '0')}.json`;
    },

    mapIdOfPath(path) {
        const m = String(path || '').replace(/\\/g, '/').match(/-Map(\d+)\.json$/i);
        return m ? Number(m[1]) : 0;
    },

    isMapKey(key) {
        return /^\d+$/.test(String(key));
    },

    // A copy with every object's keys in order; doodads placed by the API (temp) are left out.
    stable(value, depth = 0) {
        if (Array.isArray(value)) {
            const list = depth === 1 ? value.filter(d => !(d && d.temp)) : value;
            return list.map(v => this.stable(v, depth + 1));
        }
        if (!value || typeof value !== 'object') return value;
        const out = {};
        for (const key of Object.keys(value).sort()) {
            if (value[key] === undefined) continue;
            out[key] = this.stable(value[key], depth + 1);
        }
        return out;
    },

    // What to write for the doodad data: [{ path, data, indent }].
    entriesFor(data, split = this.split) {
        const indent = saveMode ? 0 : 2;
        const clean = this.stable(data || {});
        delete clean._mapFiles;
        if (!split) return [{ path: this.mainPath(), data: clean, indent }];
        const main = {};
        const maps = [];
        const out = [];
        for (const key of Object.keys(clean)) {
            if (!this.isMapKey(key)) {
                main[key] = clean[key];
            } else if (Array.isArray(clean[key]) && clean[key].length > 0) {
                maps.push(Number(key));
                out.push({ path: this.mapPath(key), data: clean[key], indent });
            }
        }
        main._mapFiles = maps.sort((a, b) => a - b);
        return [{ path: this.mainPath(), data: this.stable(main), indent }].concat(out);
    },

    // The data from a main file and its map files (readMap(mapId) returns a list or null).
    merge(main, readMap) {
        const data = Object.assign({}, main || {});
        const maps = Array.isArray(data._mapFiles) ? data._mapFiles : null;
        delete data._mapFiles;
        if (maps) {
            for (const id of maps) {
                const list = readMap(id);
                if (Array.isArray(list)) data[id] = list;
            }
        }
        return data;
    },

    // Reads the doodad data from disk (in a playtest).
    readAll() {
        const FS = DocsDoodads.FS;
        const main = FS.readJson(this.mainPath());
        if (!main) return null;
        return this.merge(main, id => FS.readJson(this.mapPath(id)));
    },

    // Map files in the folder that the main file no longer lists (their maps lost all their doodads,
    // or the project went back to one file): backed up, then removed after a save.
    staleMapFiles(entries) {
        const FS = DocsDoodads.FS;
        const dir = `data/${this.baseName()}`;
        if (!FS.fs || !FS.existsSync(dir)) return [];
        const keep = new Set(entries.map(e => String(e.path).replace(/\\/g, '/').toLowerCase()));
        return FS.fs.readdirSync(dir)
            .filter(f => /-Map\d+\.json$/i.test(f))
            .map(f => `${dir}/${f}`)
            .filter(p => !keep.has(p.toLowerCase()));
    },

    removeStale(entries) {
        const FS = DocsDoodads.FS;
        for (const p of this.staleMapFiles(entries)) {
            try {
                FS.createTimestampedBackup(p);
                FS.fs.unlinkSync(p);
            } catch (error) {
                DocsDoodads.Core.log(`Could not remove ${p}.`, error);
            }
        }
    },

    // Which file holds a map's doodads.
    pathForMap(mapId) {
        return this.split ? this.mapPath(mapId) : this.mainPath();
    }
};

if (typeof DataManager !== 'undefined') {
    // Files still loading; the game starts (Scene_Boot) once they are all in.
    DataManager._docsLoading = 0;

    $.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase.call(this);
        this.loadDocsDoodadsData();
    };

    $.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        return $.DataManager_isDatabaseLoaded.call(this) && !(this._docsLoading > 0);
    };

    // A GET of a JSON file the plugin needs before the game starts; done(xhr) runs when it's over.
    DataManager.docsRequest = function(url, done) {
        const xhr = new XMLHttpRequest();
        this._docsLoading++;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            this._docsLoading--;
            done(xhr);
        };
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = finish;
        xhr.onerror = finish;
        xhr.send();
    };

    // Doodad data that won't parse (a half-written file) doesn't stop the game: a playtest loads the
    // latest backup (and says so in the editor); otherwise the map starts without doodads.
    DataManager.parseDocsDoodadsData = function(text, url) {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.warn(`[DocsDoodads] ${url} could not be read:`, error);
            const recovered = DocsDoodads.FS.fs ? DocsDoodads.FS.readJson(url) : null;
            return recovered && typeof recovered === 'object' ? recovered : {};
        }
    };

    DataManager.loadDocsDoodadsData = function() {
        // Projects saved by QJ-Doodads have DoodadsQJ.json until they are saved again.
        const candidates = ['data/' + dataFileName];
        if (dataFileName === 'DocsDoodads.json') candidates.push('data/' + DocsDoodads.Legacy.dataFileName);
        const tryLoad = (index) => {
            DataManager.docsRequest(candidates[index], xhr => {
                if (xhr.status < 400 && xhr.responseText) {
                    const main = DataManager.parseDocsDoodadsData(xhr.responseText, candidates[index]);
                    DataManager.loadDocsDoodadsMapFiles(main);
                } else if (index + 1 < candidates.length) {
                    tryLoad(index + 1);
                } else {
                    window.$dataDocsDoodads = {};
                    DataManager.checkDocsDoodadsData();
                }
            });
        };
        tryLoad(0);
    };

    // A main file that lists map files: each map's doodads are read before the game starts.
    DataManager.loadDocsDoodadsMapFiles = function(main) {
        const F = DocsDoodads.DataFiles;
        const maps = main && Array.isArray(main._mapFiles) ? main._mapFiles : [];
        const lists = {};
        let left = maps.length;
        const done = () => {
            window.$dataDocsDoodads = F.merge(main, id => lists[id]);
            DataManager.checkDocsDoodadsData();
        };
        if (left === 0) return done();
        for (const id of maps) {
            DataManager.docsRequest(F.mapPath(id), xhr => {
                if (xhr.status < 400 && xhr.responseText) {
                    try {
                        lists[id] = JSON.parse(xhr.responseText);
                    } catch (error) {
                        console.warn(`[DocsDoodads] ${F.mapPath(id)} could not be read:`, error);
                        const recovered = DocsDoodads.FS.fs ? DocsDoodads.FS.readJson(F.mapPath(id)) : null;
                        if (Array.isArray(recovered)) lists[id] = recovered;
                    }
                }
                if (--left === 0) done();
            });
        }
    };

    DataManager.loadDocsDoodadsPacked = function() {
        if (!DocsDoodads.Packer.shouldRequestManifest()) return;
        this.docsRequest(DocsDoodads.Packer.manifestPath, xhr => {
            if (xhr.status >= 400 || !xhr.responseText) return;
            try {
                const data = JSON.parse(xhr.responseText);
                if (data && data.maps) DocsDoodads.Packer.data = data;
            } catch (e) {}
        });
    };

    DataManager.checkDocsDoodadsData = function() {
        if (!window.$dataDocsDoodads) window.$dataDocsDoodads = {};
        DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
        DataManager.loadDocsDoodadsPacked();
        DataManager.loadDocsDoodadsAseprite();
    };

    // Which sheet each Aseprite layer in <visual:> tags became (written in playtests).
    DataManager.loadDocsDoodadsAseprite = function() {
        if (typeof XMLHttpRequest === 'undefined') return;
        const AV = DocsDoodads.AsepriteVisuals;
        this.docsRequest(AV.manifestPath, xhr => {
            if (xhr.status >= 400 || !xhr.responseText) return;
            try {
                const data = JSON.parse(xhr.responseText);
                if (data && data.refs) {
                    AV.manifest = { version: 1, refs: Object.assign({}, data.refs, AV.manifest.refs) };
                    // Gear looked up before the manifest came in is looked up again.
                    AV._names.clear();
                }
            } catch (e) {}
        });
    };

}

DocsDoodads.doodads = function(mapId) {
    if (typeof window === 'undefined' || !window.$dataDocsDoodads) return [];
    mapId = mapId || (window.$gameMap ? window.$gameMap.mapId() : 0);
    return window.$dataDocsDoodads[mapId] || [];
};

