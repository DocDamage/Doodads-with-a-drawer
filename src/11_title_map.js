//==========================================================
// SECTION 6D2: LIVE MAP TITLE SETTINGS
//==========================================================
DocsDoodads.World.defaults.title = {
    mapId: 0, x: 0, y: 0, time: 480, season: 0,
    weather: { type: 'none', power: 0 }, look: null, path: null, pictures: 'over'
};

DocsDoodads.TitleMap = {
    weatherTypes: ['none', 'rain', 'storm', 'snow'],

    normalize(raw) {
        raw = raw && typeof raw === 'object' ? raw : {};
        const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
        const weather = raw.weather && typeof raw.weather === 'object' ? raw.weather : {};
        const type = this.weatherTypes.includes(weather.type) ? weather.type : 'none';
        const points = raw.path && Array.isArray(raw.path.points) ? raw.path.points.slice(0, 64).map(point => ({
            x: number(point && point.x, NaN), y: number(point && point.y, NaN)
        })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y)) : [];
        const path = points.length > 1 ? {
            points,
            frames: Math.max(1, Math.min(36000, Math.round(number(raw.path.frames, 60)))),
            ease: raw.path.ease === 'linear' ? 'linear' : 'smooth'
        } : null;
        let look = null;
        if (raw.look && typeof raw.look === 'object' && !Array.isArray(raw.look)) {
            try { look = JSON.parse(JSON.stringify(raw.look)); } catch (error) { look = {}; }
        }
        return {
            mapId: Math.max(0, Math.floor(number(raw.mapId, 0))),
            x: number(raw.x, 0), y: number(raw.y, 0),
            time: DocsDoodads.TimeOfDay.wrap(number(raw.time, 480)),
            season: Math.max(0, Math.floor(number(raw.season, 0))),
            weather: { type, power: Math.max(0, Math.min(9, number(weather.power, 0))) },
            look, path, pictures: raw.pictures === 'hide' ? 'hide' : 'over'
        };
    },

    settings() { return this.normalize(DocsDoodads.World.settings().title); },

    // Camera2D.pathAt supplies the same easing as cutscenes. Closing the points makes the title loop.
    frame(settings, frame) {
        const value = this.normalize(settings), path = value.path;
        if (!path) return { x: value.x, y: value.y };
        const points = path.points.concat([{ x: path.points[0].x, y: path.points[0].y }]);
        const total = path.frames * path.points.length;
        const n = ((Math.floor(Number(frame) || 0) % total) + total) % total;
        const at = DocsDoodads.Camera2D.pathAt({ points, frames: path.frames, ease: path.ease }, n);
        return { x: at.x, y: at.y };
    },

    displayFor(frame, map) {
        if (!map) return { x: 0, y: 0 };
        return { x: frame.x - (map.screenTileX() - 1) / 2, y: frame.y - (map.screenTileY() - 1) / 2 };
    }
};
