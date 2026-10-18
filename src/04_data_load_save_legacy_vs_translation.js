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
                    window.$dataDocsDoodads = DataManager.parseDocsDoodadsData(xhr.responseText, candidates[index]);
                    DataManager.checkDocsDoodadsData();
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

