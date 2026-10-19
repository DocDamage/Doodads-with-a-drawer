//==========================================================
// SECTION 5D2: LOOKS BY TIME AND BY REGION
//==========================================================
// On top of the game-wide or map look: looks that blend in by the clock (world.postfx.times: a warm dusk
// from 17:00 to 19:30) and while the player stands on a region (world.postfx.regions, and a map's own in
// mapSettings.lookBlends.regions, which win for the same region number: a cold crypt). A map can turn the
// time looks off (mapSettings.lookBlends.noTimes, for interiors). Each entry's look is a preset
// ({ preset: 'golden' }) or its own ({ look: {...} }), with a strength.
//   time:   { from, to, fade (minutes, 0-1439 for from/to), preset | look, amount }
//   region: { region (1-255), fade (seconds), preset | look, amount }
DocsDoodads.PostFX.Blends = {
    timeDefaults: { from: 17 * 60, to: 19 * 60 + 30, fade: 60, preset: 'golden', amount: 1 },
    regionDefaults: { region: 1, fade: 1, preset: 'underwater', amount: 1 },

    wrap(m) {
        return ((Math.round(Number(m) || 0) % 1440) + 1440) % 1440;
    },

    normalizeTime(entry) {
        const e = Object.assign({}, this.timeDefaults, entry || {});
        const out = { from: this.wrap(e.from), to: this.wrap(e.to), fade: Math.max(0, Math.min(720, Math.round(Number(e.fade) || 0))),
            amount: Math.max(0, Math.min(1, Number(e.amount))) };
        if (!isFinite(out.amount)) out.amount = 1;
        return Object.assign(out, this.lookRefOf(e));
    },

    normalizeRegion(entry) {
        const e = Object.assign({}, this.regionDefaults, entry || {});
        const out = { region: Math.max(1, Math.min(255, Math.round(Number(e.region) || 1))), fade: Math.max(0, Math.min(30, Number(e.fade) || 0)),
            amount: Math.max(0, Math.min(1, Number(e.amount))) };
        if (!isFinite(out.amount)) out.amount = 1;
        return Object.assign(out, this.lookRefOf(e));
    },

    // { look } when the entry has a look of its own, else { preset }.
    lookRefOf(e) {
        if (e && e.look && typeof e.look === 'object') return { look: DocsDoodads.PostFX.normalizeLook(e.look) };
        const P = DocsDoodads.PostFX;
        return { preset: P.presets.some(p => p.id === (e && e.preset)) ? e.preset : 'golden' };
    },

    lookOf(entry) {
        const P = DocsDoodads.PostFX;
        return entry.look ? P.normalizeLook(entry.look) : P.presetLook(entry.preset) || P.defaultLook();
    },

    // How much a time entry shows at a minute of the day: 1 from "from" to "to" (across midnight too),
    // easing in during the fade before "from" and out during the fade after "to".
    timeWeight(entry, minutes) {
        const e = this.normalizeTime(entry);
        const m = this.wrap(minutes);
        const span = (e.to - e.from + 1440) % 1440;
        const into = (m - e.from + 1440) % 1440;
        if (into <= span) return 1;
        if (e.fade <= 0) return 0;
        const after = into - span;              // minutes since "to"
        const before = 1440 - into;             // minutes until "from"
        const w = Math.max(after <= e.fade ? 1 - after / e.fade : 0, before <= e.fade ? 1 - before / e.fade : 0);
        return w * w * (3 - 2 * w);             // smoothstep: no sudden start or stop
    },

    times(world, mapSettings) {
        const own = mapSettings && mapSettings.lookBlends;
        if (own && own.noTimes) return [];
        const list = world && world.postfx && Array.isArray(world.postfx.times) ? world.postfx.times : [];
        return list.map(e => this.normalizeTime(e));
    },

    // Game-wide region looks, with the map's own in place of any for the same region.
    regions(world, mapSettings) {
        const byRegion = new Map();
        const add = list => (Array.isArray(list) ? list : []).forEach(e => { const n = this.normalizeRegion(e); byRegion.set(n.region, n); });
        add(world && world.postfx && world.postfx.regions);
        add(mapSettings && mapSettings.lookBlends && mapSettings.lookBlends.regions);
        return Array.from(byRegion.values());
    },

    // The base look with the time looks (when minutes is given) and region looks (weights by region) mixed in.
    apply(base, { world, mapSettings, minutes, regionWeights } = {}) {
        const P = DocsDoodads.PostFX;
        let look = P.normalizeLook(base);
        if (minutes !== undefined && minutes !== null) {
            for (const e of this.times(world, mapSettings)) {
                const w = this.timeWeight(e, minutes) * e.amount;
                if (w > 0) look = P.lerpLook(look, this.lookOf(e), w);
            }
        }
        if (regionWeights) {
            for (const e of this.regions(world, mapSettings)) {
                const w = (Number(regionWeights[e.region]) || 0) * e.amount;
                if (w > 0) look = P.lerpLook(look, this.lookOf(e), w);
            }
        }
        return look;
    },

    // ---- The player's region, faded in and out ----
    _fade: { mapId: 0, weights: {} },

    // Moves each region's weight one frame toward 1 (the region the player is on) or 0. A new map starts
    // at its target straight away, so a transfer into a crypt is already cold. frames: how many frames passed.
    stepRegions(mapId, regionId, world, mapSettings, frames = 1) {
        const f = this._fade;
        const list = this.regions(world, mapSettings);
        const snap = f.mapId !== mapId;
        f.mapId = mapId;
        const next = {};
        for (const e of list) {
            const target = e.region === Number(regionId) ? 1 : 0;
            const now = snap ? target : (Number(f.weights[e.region]) || 0);
            const step = e.fade > 0 ? frames / (e.fade * 60) : 1;
            const w = now < target ? Math.min(target, now + step) : Math.max(target, now - step);
            if (w > 0) next[e.region] = w;
        }
        f.weights = next;
        return next;
    },

    regionWeights() {
        return this._fade.weights;
    },

    // While editing, a region's look can be previewed at full strength.
    previewWeights(region) {
        return region ? { [Number(region)]: 1 } : null;
    }
};
