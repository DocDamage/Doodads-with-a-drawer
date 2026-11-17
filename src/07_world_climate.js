//==========================================================
// SECTION 5C3: SEEDED SEASONAL CLIMATE
//==========================================================
DocsDoodads.World.defaults.climate = { enabled: false, seed: 1, seasons: {} };
DocsDoodads.World._cache = null;
DocsDoodads.Climate = {
    types: ['none', 'rain', 'storm', 'snow', 'fog', 'windy'],
    settings() { return DocsDoodads.World.settings().climate; },
    enabled() { return this.settings().enabled === true; },
    normalizeRow(row) {
        const r = row || {}, number = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
        return { type: this.types.includes(r.type) ? r.type : 'none', power: number(r.power, 5, 0, 9), chance: number(r.chance, 0, 0, 100), hours: number(r.hours, 6, 0.25, 24) };
    },
    // Chance is a weight out of 100; any unassigned share is clear. Hours is each chosen span's duration.
    day(dayNumber, season, table, seed) {
        const raw = Array.isArray(table) ? table : table && Object.prototype.hasOwnProperty.call(table, season) ? table[season] : [];
        const rows = (Array.isArray(raw) ? raw : []).slice(0, 64).map(row => this.normalizeRow(row)).filter(row => row.chance > 0);
        const sum = rows.reduce((total, row) => total + row.chance, 0);
        if (!sum) return [{ start: 0, end: 1440, type: 'none', power: 0 }];
        if (sum < 100) rows.push({ type: 'none', power: 0, chance: 100 - sum, hours: 6 });
        const total = Math.max(100, sum);
        let random = 2166136261;
        for (const c of `${Math.max(1, Math.floor(Number(dayNumber) || 1))}|${String(season)}|${String(seed)}`) random = Math.imul(random ^ c.charCodeAt(0), 16777619) >>> 0;
        const rand = () => { random = (Math.imul(random, 1664525) + 1013904223) >>> 0; return random / 4294967296; };
        const spans = [];
        for (let start = 0; start < 1440;) {
            let roll = rand() * total, chosen = rows[rows.length - 1];
            for (const row of rows) { roll -= row.chance; if (roll < 0) { chosen = row; break; } }
            const end = Math.min(1440, start + Math.max(15, Math.round(chosen.hours * 60)));
            const power = chosen.type === 'none' ? 0 : chosen.power, previous = spans[spans.length - 1];
            if (previous && previous.type === chosen.type && previous.power === power) previous.end = end;
            else spans.push({ start, end, type: chosen.type, power });
            start = end;
        }
        return spans;
    },
    seed() {
        const saved = typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem._docsClimate;
        const value = saved && Number.isFinite(Number(saved.seed)) ? saved.seed : this.settings().seed;
        return (Number(value) || 0) >>> 0;
    },
    state(create) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return null;
        if (!$gameSystem._docsClimate && create) $gameSystem._docsClimate = { seed: this.seed(), held: false };
        return $gameSystem._docsClimate || null;
    },
    season() {
        const names = DocsDoodads.World.settings().seasons.names || ['Spring'];
        const index = Math.max(0, DocsDoodads.Atmosphere.season());
        return String(names[index] || names[0] || 'Spring');
    },
    forecast(days = 7) {
        const count = Math.max(1, Math.min(31, Math.floor(Number(days) || 7))), today = Math.max(1, DocsDoodads.Calendar.day());
        const season = this.season(), table = this.settings().seasons, seed = this.seed();
        return Array.from({ length: count }, (_, index) => ({ day: today + index, season, spans: this.day(today + index, season, table, seed) }));
    },
    describe(forecast) {
        const time = minute => DocsDoodads.TimeOfDay.format(minute === 1440 ? 0 : minute);
        return forecast.map(day => `Day ${day.day}: ${day.spans.map(span => `${time(span.start)}–${span.end === 1440 ? '24:00' : time(span.end)} ${span.type === 'none' ? 'clear' : span.type}`).join(', ')}`).join('\n');
    }
};
