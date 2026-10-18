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
    $.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase.call(this);
        this.loadDocsDoodadsData();
    };

    DataManager.loadDocsDoodadsData = function() {
        // Projects saved by QJ-Doodads have DoodadsQJ.json until they are saved again.
        const candidates = ['data/' + dataFileName];
        if (dataFileName === 'DocsDoodads.json') candidates.push('data/' + DocsDoodads.Legacy.dataFileName);
        const tryLoad = (index) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', candidates[index]);
            xhr.overrideMimeType('application/json');
            const next = () => {
                if (index + 1 < candidates.length) {
                    tryLoad(index + 1);
                } else {
                    window.$dataDocsDoodads = {};
                    DataManager.checkDocsDoodadsData();
                }
            };
            xhr.onload = function() {
                if (xhr.status < 400) {
                    window.$dataDocsDoodads = JSON.parse(xhr.responseText);
                    DataManager.checkDocsDoodadsData();
                } else {
                    next();
                }
            };
            xhr.onerror = next;
            xhr.send();
        };
        tryLoad(0);
    };

    DataManager.loadDocsDoodadsPacked = function() {
        if (!DocsDoodads.Packer.shouldRequestManifest()) return;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', DocsDoodads.Packer.manifestPath);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data && data.maps) DocsDoodads.Packer.data = data;
                } catch (e) {}
            }
        };
        xhr.onerror = function() {};
        xhr.send();
    };

    DataManager.checkDocsDoodadsData = function() {
        if (!window.$dataDocsDoodads) window.$dataDocsDoodads = {};
        DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
        DataManager.loadDocsDoodadsPacked();
    };

    DataManager.saveDocsDoodadsData = function() {
        if (typeof StorageManager !== 'undefined') {
            const fs = DocsDoodads.FS.fs;
            if (fs) {
                const filePath = 'data/' + dataFileName;
                const content = saveMode ? JSON.stringify(window.$dataDocsDoodads) : JSON.stringify(window.$dataDocsDoodads, null, 2);
                fs.writeFileSync(filePath, content);
            }
        }
    };

    DataManager.loadMapDataSyncDocsDoodads = function(type, mapId) {
        const fs = (typeof require !== 'undefined') ? require('fs') : null;
        if (!fs) return null;
        const filePath = 'data/Map' + String(mapId).padStart(3, '0') + '.json';
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch(e) {
                return null;
            }
        }
        return null;
    };
}

DocsDoodads.doodads = function(mapId) {
    if (typeof window === 'undefined' || !window.$dataDocsDoodads) return [];
    mapId = mapId || (window.$gameMap ? window.$gameMap.mapId() : 0);
    return window.$dataDocsDoodads[mapId] || [];
};

