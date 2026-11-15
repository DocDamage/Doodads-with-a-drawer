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

    // Map pictures depend on doodads and whether their layers are shown in the game. Canonical copies
    // avoid invalidating every picture merely because parsed and live objects have different key order.
    canonical(value) {
        if (Array.isArray(value)) return value.map(v => this.canonical(v));
        if (!value || typeof value !== 'object') return value;
        const out = {};
        for (const key of Object.keys(value).sort()) {
            if (value[key] !== undefined) out[key] = this.canonical(value[key]);
        }
        return out;
    },

    layerPictureSettings(data, mapId) {
        const settings = data && data.mapSettings && data.mapSettings[mapId] || {};
        const layers = Array.isArray(settings.layers) ? settings.layers.map(layer => ({
            id: String(layer && layer.id || ''), gameHidden: Boolean(layer && layer.gameHidden)
        })).sort((a, b) => a.id.localeCompare(b.id)) : [];
        return { mainHidden: Boolean(settings.mainLayer && settings.mainLayer.gameHidden), layers };
    },

    changedMapIds(before, after) {
        before = before || {};
        after = after || {};
        const ids = new Set();
        for (const data of [before, after]) {
            for (const key of Object.keys(data)) if (/^\d+$/.test(key)) ids.add(Number(key));
            for (const key of Object.keys(data.mapSettings || {})) if (/^\d+$/.test(key)) ids.add(Number(key));
        }
        const signature = (data, id) => {
            const list = Array.isArray(data[id]) ? data[id].filter(d => !(d && d.temp)) : [];
            return JSON.stringify([this.canonical(list), this.layerPictureSettings(data, id)]);
        };
        return Array.from(ids).filter(id => signature(before, id) !== signature(after, id)).sort((a, b) => a - b);
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

