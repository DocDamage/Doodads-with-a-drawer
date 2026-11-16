(function() {
    const S = DocsDoodads.Shipped;
    if (typeof Game_Map !== 'undefined') {
        const setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function(mapId) { const result = setup.call(this, mapId); if (this === window.$gameMap) S.migrateSaved(mapId); return result; };
    }
    if (typeof DataManager !== 'undefined' && typeof DataManager.extractSaveContents === 'function') {
        const extract = DataManager.extractSaveContents;
        DataManager.extractSaveContents = function(contents) { const result = extract.call(this, contents); if (window.$gameMap) S.migrateSaved($gameMap.mapId()); return result; };
    }
})();
