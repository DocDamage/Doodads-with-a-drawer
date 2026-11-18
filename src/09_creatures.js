//==========================================================
// SECTION 5C: AMBIENT CREATURES (9.3.1)
//==========================================================
// A doodad with `creatures: { kind, count, sheet, flee, back, hours, weather, spread }` keeps a few birds,
// butterflies or fish near it. Each has a small state (idle, away, coming back) stepped by `step`, seeded so the
// same seed flies the same way. They are not events: no collision, nothing saved. Birds land on doodads marked
// Perch; fish keep to water tiles and scatter from a swimmer or a boat; lightning startles everything. Effects
// Quality scales the count (Medium halves it, Low turns them off).
DocsDoodads.Creatures = {
    maxPerDoodad: 24,
    maxOnMap: 120,
    kinds: {
        birds: { flee: 3, back: 6, speed: 170, wander: 10, hours: 'day', weather: 'clear', size: 1, color: 0x3a3030, flyHeight: 90, label: 'Birds' },
        butterflies: { flee: 1.5, back: 3, speed: 70, wander: 26, hours: 'day', weather: 'clear', size: 1, color: 0xf5a0d0, flyHeight: 18, label: 'Butterflies' },
        fish: { flee: 2, back: 4, speed: 110, wander: 14, hours: 'any', weather: 'any', size: 1, color: 0x101820, flyHeight: 0, label: 'Fish (under water)' }
    },

    normalize(c) {
        if (!c || typeof c !== 'object') return null;
        const kind = this.kinds[c.kind] ? c.kind : null;
        if (!kind) return null;
        const k = this.kinds[kind], num = (v, d, lo, hi) => { const n = Number(v); return Math.max(lo, Math.min(hi, Number.isFinite(n) && v !== '' && v !== null ? n : d)); };
        const sheet = typeof c.sheet === 'string' && /^img\/[^\0]*\.png$/i.test(c.sheet) && !c.sheet.split('/').includes('..') ? c.sheet : '';
        return {
            kind,
            count: Math.round(num(c.count, 5, 0, this.maxPerDoodad)),
            sheet,
            flee: num(c.flee, k.flee, 0, 12),
            back: num(c.back, k.back, 0.5, 120),
            hours: ['day', 'night', 'any'].includes(c.hours) ? c.hours : k.hours,
            weather: ['clear', 'any'].includes(c.weather) ? c.weather : k.weather,
            spread: num(c.spread, 2, 0.5, 12)
        };
    },

    // Whether they are out at this hour (0-24, null when there is no clock) and in this weather.
    active(c, hour, weatherType) {
        const s = this.normalize(c);
        if (!s || !s.count) return false;
        if (s.hours !== 'any' && hour !== null && hour !== undefined) {
            const day = hour >= 6 && hour < 19;
            if ((s.hours === 'day') !== day) return false;
        }
        if (s.weather === 'clear' && weatherType && weatherType !== 'none') {
            if (!(s.kind === 'fish' && weatherType !== 'storm')) return false;
        }
        return true;
    },

    // How many show at an Effects Quality.
    countFor(n, quality) {
        n = Math.max(0, Math.floor(Number(n) || 0));
        if (quality === 'off' || quality === 'low') return 0;
        return quality === 'medium' ? Math.ceil(n / 2) : n;
    },

    // Places to rest near home (map pixels): perches first (their tops), else the ground around it. ok(x, y)
    // says a point may be used (fish: water tiles). Seeded.
    spots(home, settings, perches, rng, ok, tw) {
        const out = [];
        const near = (perches || []).filter(p => Math.hypot(p.x - home.x, p.y - home.y) <= (settings.spread + 4) * tw);
        if (settings.kind === 'birds' && near.length) {
            for (let i = 0; i < settings.count; i++) {
                const p = near[Math.floor(rng() * near.length)];
                out.push({ x: p.x + (rng() - 0.5) * p.w * 0.6, y: p.y });
            }
            return out;
        }
        for (let tries = 0; out.length < settings.count && tries < settings.count * 12; tries++) {
            const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * settings.spread * tw;
            const x = home.x + Math.cos(a) * r, y = home.y + Math.sin(a) * r * 0.7;
            if (!ok || ok(x, y)) out.push({ x, y });
        }
        return out;
    },

    spawn(spot, rng) {
        return { x: spot.x, y: spot.y, z: 0, hx: spot.x, hy: spot.y, mode: 'idle', t: 0, vx: 0, vy: 0, phase: rng() * Math.PI * 2, flip: rng() < 0.5 };
    },

    // One step of dt seconds. ctx: { kind, settings, player: { x, y } in map pixels or null, wind (x), rng, startle,
    // tw }. Mutates and returns the creature.
    step(c, dt, ctx) {
        const k = this.kinds[ctx.settings.kind], s = ctx.settings, tw = ctx.tw || 48;
        dt = Math.max(0, Math.min(0.1, Number(dt) || 0));
        c.t += dt;
        c.phase += dt * (c.mode === 'idle' ? 3 : 14);
        const player = ctx.player;
        const dist = player ? Math.hypot(player.x - c.x, player.y - c.y) : Infinity;
        const homeDist = player ? Math.hypot(player.x - c.hx, player.y - c.hy) : Infinity;
        const scared = ctx.startle || dist <= s.flee * tw;
        if ((c.mode === 'idle' || c.mode === 'back') && scared) {
            // Away from the player (or anywhere, for lightning), fast.
            let ax = player ? c.x - player.x : ctx.rng() - 0.5, ay = player ? c.y - player.y : ctx.rng() - 0.5;
            const len = Math.hypot(ax, ay) || 1;
            ax /= len; ay /= len;
            const turn = (ctx.rng() - 0.5) * 0.8, cos = Math.cos(turn), sin = Math.sin(turn);
            c.vx = (ax * cos - ay * sin) * k.speed;
            c.vy = (ax * sin + ay * cos) * k.speed;
            c.mode = 'away'; c.t = 0;
            c.flip = c.vx < 0;
        }
        if (c.mode === 'away') {
            c.x += c.vx * dt + (Number(ctx.wind) || 0) * 20 * dt;
            c.y += c.vy * dt;
            c.z = Math.min(k.flyHeight, c.z + k.flyHeight * dt * 1.5);
            // Come back once the time is up and the player has moved off.
            if (c.t >= s.back && homeDist > s.flee * tw) { c.mode = 'back'; c.t = 0; }
        } else if (c.mode === 'back') {
            const dx = c.hx - c.x, dy = c.hy - c.y, d = Math.hypot(dx, dy);
            const v = k.speed * 0.6 * dt;
            if (d <= v) { c.x = c.hx; c.y = c.hy; c.mode = 'idle'; c.t = 0; }
            else { c.x += dx / d * v; c.y += dy / d * v; c.flip = dx < 0; }
            c.z = c.mode === 'idle' ? 0 : Math.max(0, Math.min(k.flyHeight, d * 0.5));
        } else {
            // Idle: birds peck about, butterflies flutter round the spot, fish drift.
            const w = k.wander;
            c.x = c.hx + Math.sin(c.phase * 0.31) * w * 0.5;
            c.y = c.hy + Math.cos(c.phase * 0.23) * w * 0.3;
            c.z = ctx.settings.kind === 'butterflies' ? k.flyHeight * (0.6 + 0.4 * Math.sin(c.phase * 0.7)) : 0;
        }
        return c;
    },

    // Frame of a two-frame sheet: wings up or down (fish: a tail flick), faster when flying.
    frame(c) {
        return Math.sin(c.phase * (c.mode === 'idle' ? 1 : 2)) > 0 ? 1 : 0;
    },

    // The sun's hour for the creatures, or null when the project has no clock.
    hour() {
        const A = DocsDoodads.Atmosphere;
        const m = A && A.minutes ? A.minutes() : null;
        return m === null || m === undefined || !Number.isFinite(Number(m)) ? null : (Number(m) / 60) % 24;
    },

    quality() {
        const world = DocsDoodads.World.settings();
        const P = DocsDoodads.PostFX;
        return P && P.effectiveQuality ? P.effectiveQuality((world.postfx && world.postfx.quality) || 'high', DocsDoodads.qualityOption ? DocsDoodads.qualityOption() : 0) : 'high';
    }
};
