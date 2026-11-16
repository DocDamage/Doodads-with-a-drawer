//==========================================================
// SECTION 5G-R: RUNTIME PIECES SHARED WITH EDITOR FEATURES
//==========================================================
// Layers are authored in the editor but decide whether a doodad exists in the game. Packed-map lookup
// is also runtime behavior; the packing algorithms themselves stay in the editor-only asset part.
DocsDoodads.Layers = {
    main: { id: 'main', name: 'Main', hidden: false, locked: false, gameHidden: false },

    list(mapSettings) {
        const own = mapSettings && Array.isArray(mapSettings.layers) ? mapSettings.layers.filter(l => l && l.id && l.id !== 'main') : [];
        return [Object.assign({}, this.main, mapSettings && mapSettings.mainLayer)].concat(own);
    },

    of(d) {
        return d && d.layer ? d.layer : 'main';
    },

    find(d, mapSettings) {
        const id = this.of(d);
        return this.list(mapSettings).find(l => l.id === id) || this.list(mapSettings)[0];
    },

    visibleInEditor(d, mapSettings) {
        return !this.find(d, mapSettings).hidden;
    },

    // Every doodad asks each frame: the layers by id, built once a frame for the map's settings (the
    // editor changes a layer's flags in place, so the table never outlives the frame or an edit).
    byId(mapSettings) {
        const frame = DocsDoodads.frameCount ? DocsDoodads.frameCount() : 0;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const c = this._table;
        if (c && !editing && frame !== 0 && c.settings === mapSettings && c.frame === frame) return c;
        const list = this.list(mapSettings);
        const ids = new Map();
        for (const l of list) if (!ids.has(l.id)) ids.set(l.id, l);
        this._table = { settings: mapSettings, frame, ids, first: list[0] };
        return this._table;
    },

    visibleInGame(d, mapSettings) {
        const t = this.byId(mapSettings);
        return !(t.ids.get(this.of(d)) || t.first).gameHidden;
    },

    isLocked(d, mapSettings) {
        return Boolean(this.find(d, mapSettings).locked);
    }
};

DocsDoodads.Packer = {
    manifestPath: 'data/DocsDoodadsPacked.json',
    sheetDirectory: 'img/doodads/_packed',
    data: { version: 1, maps: {} },
    previewInTest: false,

    shouldUse() {
        return !DocsDoodads.Compat.isTest() || this.previewInTest;
    },

    regionOf(d) {
        const xf = Math.max(1, d.xFrame || 1), yf = Math.max(1, d.yFrame || 1);
        return { x: d.frameX || 0, y: d.frameY || 0, w: (d.frameW || 48) * xf, h: (d.frameH || 48) * yf };
    },

    keyFor(d) {
        const r = this.regionOf(d);
        return `${String(d.bit[1]).replace(/\\/g, '/')}|${r.x}|${r.y}|${r.w}|${r.h}`;
    },

    forMap(mapId) {
        return this.data && this.data.maps ? this.data.maps[mapId] || null : null;
    },

    resolve(manifest, d) {
        if (!manifest || !d || !d.bit || d.bit[0] !== 3) return null;
        const entry = manifest.frames[this.keyFor(d)];
        return entry ? { sheet: manifest.sheets[entry.sheet], x: entry.x, y: entry.y, w: entry.w, h: entry.h } : null;
    },

    manifestExists() {
        return Boolean(DocsDoodads.FS.fs && DocsDoodads.FS.existsSync(this.manifestPath));
    },

    // Desktop builds check the file directly; browser builds only ask when the doodads file says packing is used.
    shouldRequestManifest() {
        if (DocsDoodads.FS.fs) return this.manifestExists();
        return Boolean(typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.usesPacking);
    }
};
