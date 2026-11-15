//==========================================================
// SECTION 5i: MAP PICTURE RULES
//==========================================================
// The editor integration and MZ canvas renderer are later parts. These rules stay plain so cache names,
// dimensions and source revisions do not depend on a scene, PIXI or the page.
DocsDoodads.MapThumb = {
    maxSide: 256,
    cacheDir: 'data/docs_doodads_cache/maps',

    dimensions(mapWidth, mapHeight, tileWidth, tileHeight, maxSide) {
        const fullWidth = Math.max(1, Number(mapWidth) * Number(tileWidth) || 1);
        const fullHeight = Math.max(1, Number(mapHeight) * Number(tileHeight) || 1);
        const scale = Math.min(1, (Number(maxSide) || this.maxSide) / Math.max(fullWidth, fullHeight));
        return {
            width: Math.max(1, Math.round(fullWidth * scale)),
            height: Math.max(1, Math.round(fullHeight * scale)),
            scale
        };
    },

    padMapId(mapId) {
        return String(Math.max(0, Number(mapId) || 0)).padStart(3, '0');
    },

    cachePath(mapId) {
        return `${this.cacheDir}/Map${this.padMapId(mapId)}.png`;
    },

    sourcePath(mapId) {
        return `data/Map${this.padMapId(mapId)}.json`;
    },

    freshness(sourceStat, pictureStat) {
        const exists = Boolean(pictureStat);
        return { exists, fresh: exists && (!sourceStat || pictureStat.mtimeMs >= sourceStat.mtimeMs) };
    },

    revision(stat) {
        return stat ? `${Number(stat.mtimeMs) || 0}:${Number(stat.size) || 0}` : '';
    },

    pngBytes(dataUrl) {
        const match = /^data:image\/png;base64,(.*)$/i.exec(String(dataUrl || ''));
        if (!match) return null;
        if (typeof Buffer !== 'undefined') return Buffer.from(match[1], 'base64');
        if (typeof atob === 'undefined') return null;
        const text = atob(match[1]), bytes = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
        return bytes;
    }
};

