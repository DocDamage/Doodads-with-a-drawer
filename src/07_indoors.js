//==========================================================
// SECTION 5N: INDOORS BY REGION (9.2.2)
//==========================================================
// A house can share a map with its street. One map's setting `indoors: { regions, darkness, quiet }` marks
// region ids whose tiles are under a roof: rain and snow are not drawn over them, doodads based there do not
// lean in the wind or throw sun shadows, and while the player stands on one the screen eases to the indoor
// darkness, lightning is dimmed and the weather's sound is quieter. Mark floors, not roofs: seen from outside,
// rain over a roof is right. Off until a map lists regions.
DocsDoodads.Indoors = {
    defaults: { regions: '', darkness: null, quiet: 0.35 },
    _cache: null,
    _version: 0,
    // Eased 0 (outside) to 1 (inside), stepped by the spriteset; read by lighting, lightning and sound.
    blend: 0,

    normalize(s) {
        if (!s || typeof s !== 'object') return null;
        const regions = String(s.regions === undefined || s.regions === null ? '' : s.regions).trim();
        const dark = s.darkness === null || s.darkness === undefined || s.darkness === '' ? null : Number(s.darkness);
        const quiet = Number(s.quiet);
        return {
            regions,
            darkness: dark === null || !Number.isFinite(dark) ? null : Math.max(0, Math.min(1, dark)),
            quiet: Number.isFinite(quiet) ? Math.max(0, Math.min(1, quiet)) : this.defaults.quiet
        };
    },

    // The map's indoor settings, or null when it marks no regions (the old path everywhere).
    settingsFor(mapSettings) {
        const s = this.normalize(mapSettings && mapSettings.indoors);
        return s && this.regionSet(s.regions).size ? s : null;
    },

    regionSet(text) {
        return new Set(String(text || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0 && n < 256));
    },

    isIndoors(mapSettings, regionId) {
        const s = this.settingsFor(mapSettings);
        return Boolean(s) && this.regionSet(s.regions).has(Number(regionId));
    },

    // A byte a tile (1 indoors). regionAt(x, y) gives a tile's region. null when nothing is marked or found.
    mask(regionAt, w, h, set) {
        w = Math.max(0, Math.floor(Number(w) || 0)); h = Math.max(0, Math.floor(Number(h) || 0));
        if (!set || !set.size || !w || !h) return null;
        const out = new Uint8Array(w * h);
        let any = false;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            if (set.has(Number(regionAt(x, y)) || 0)) { out[y * w + x] = 1; any = true; }
        }
        return any ? out : null;
    },

    // A tile of a mask; looping maps wrap, beyond a non-looping edge is outdoors.
    at(mask, w, h, x, y, loopX, loopY) {
        if (!mask) return false;
        x = Math.floor(Number(x)); y = Math.floor(Number(y));
        if (loopX) x = ((x % w) + w) % w;
        if (loopY) y = ((y % h) + h) % h;
        if (x < 0 || y < 0 || x >= w || y >= h) return false;
        return mask[y * w + x] === 1;
    },

    // Region painting calls this so the mask is made again on its next use.
    invalidate() { this._version++; this._cache = null; },

    // The current map's mask, made once per map, region paint and setting change.
    current() {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return null;
        const mapId = $gameMap.mapId();
        const settings = this.settingsFor(DocsDoodads.Lighting.mapSettings(mapId));
        const c = this._cache;
        if (c && c.mapId === mapId && c.data === $dataMap.data && c.version === this._version && c.text === (settings && settings.regions)) return c.mask ? c : null;
        const w = $dataMap.width, h = $dataMap.height, data = $dataMap.data || [];
        const regionAt = (x, y) => data[(5 * h + y) * w + x] || 0;
        const mask = settings ? this.mask(regionAt, w, h, this.regionSet(settings.regions)) : null;
        this._cache = { mapId, data: $dataMap.data, version: this._version, text: settings && settings.regions, mask, w, h, settings };
        return mask ? this._cache : null;
    },

    tile(x, y) {
        const c = this.current();
        if (!c) return false;
        return this.at(c.mask, c.w, c.h, x, y, $gameMap.isLoopHorizontal && $gameMap.isLoopHorizontal(), $gameMap.isLoopVertical && $gameMap.isLoopVertical());
    },

    // A map pixel (doodads keep their place in map pixels).
    pixel(px, py) {
        if (!this.current()) return false;
        return this.tile(Math.floor(Number(px) / $gameMap.tileWidth()), Math.floor(Number(py) / $gameMap.tileHeight()));
    },

    // A doodad's base: just above its anchor point, so a wall-hung lamp on the floor's top row counts.
    doodad(d) {
        if (!d || !this.current()) return false;
        return this.pixel(Number(d.x) || 0, (Number(d.y) || 0) - 1);
    },

    // Wind that leans doodads: none indoors.
    windX(d) {
        const x = DocsDoodads.Wind.current().x;
        return x && this.doodad(d) ? 0 : x;
    },

    playerInside() {
        return typeof $gamePlayer !== 'undefined' && $gamePlayer ? this.tile($gamePlayer.x, $gamePlayer.y) : false;
    },

    // Eases toward 1 inside and 0 outside over about half a second.
    ease(current, inside, dt) {
        const target = inside ? 1 : 0, rate = Math.max(0, Number(dt) || 0) * 2;
        const c = Number(current) || 0;
        return c < target ? Math.min(target, c + rate) : Math.max(target, c - rate);
    },

    // The ambient light with the indoor darkness blended in (a map without its own indoor darkness keeps it).
    ambient(ambient, mapSettings, blend) {
        const s = this.settingsFor(mapSettings);
        if (!s || s.darkness === null || !(blend > 0) || !ambient) return ambient;
        const k = Math.min(1, blend);
        return Object.assign({}, ambient, { darkness: (Number(ambient.darkness) || 0) * (1 - k) + s.darkness * k });
    },

    // How loud the weather is heard: 1 outside, `quiet` inside.
    volume(mapSettings, blend) {
        const s = this.settingsFor(mapSettings);
        if (!s || !(blend > 0)) return 1;
        return 1 - (1 - s.quiet) * Math.min(1, blend);
    },

    // Lightning flashes are dimmed while inside.
    flash(amount, blend) {
        return (Number(amount) || 0) * (1 - 0.6 * Math.max(0, Math.min(1, Number(blend) || 0)));
    }
};
