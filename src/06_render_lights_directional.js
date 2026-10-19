//==========================================================
// SECTION 5A2: SHAPED LIGHTS, PRESETS, WALL SHADOWS, FLASHLIGHT
//==========================================================
// A doodad's light can be a cone (shape 'cone', angle: the way it points in degrees, 0 = right, 90 =
// down; spread: how wide), start from a preset (torch, candle, neon...), and on flat maps stop at walls:
// with occlusion on, the light only reaches tiles a ray from it can get to (World > Lighting picks what
// counts as a wall: tiles nobody can walk on, and any regions listed). The player can carry a
// flashlight that points where they face (World > Lighting, the Flashlight command).
Object.assign(DocsDoodads.Lighting.lightDefaults, { shape: 'round', angle: 90, spread: 60, occlude: 'world', preset: '', switchId: 0, condition: '' });

// A light on only while its switch is on and its condition (JavaScript) is true; the editor shows it anyway.
DocsDoodads.Lighting.lightWanted = function(l) {
    if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return true;
    const sw = Number(l.switchId) || 0;
    if (sw > 0 && !(typeof $gameSwitches !== 'undefined' && $gameSwitches && $gameSwitches.value(sw))) return false;
    return !l.condition || DocsDoodads.Appearance.conditionPasses(l.condition);
};

DocsDoodads.LightPresets = {
    list: [
        { id: 'torch', label: 'Torch', light: { color: '#ff9a3c', radius: 170, intensity: 0.9, flicker: 0.35, glow: 0.35, shape: 'round' } },
        { id: 'candle', label: 'Candle', light: { color: '#ffd27f', radius: 84, intensity: 0.8, flicker: 0.25, glow: 0.4, shape: 'round' } },
        { id: 'campfire', label: 'Campfire', light: { color: '#ff7a2a', radius: 230, intensity: 0.95, flicker: 0.45, glow: 0.45, shape: 'round' } },
        { id: 'lantern', label: 'Lantern', light: { color: '#ffe2a8', radius: 150, intensity: 0.85, flicker: 0.08, glow: 0.3, shape: 'round' } },
        { id: 'neonPink', label: 'Neon (pink)', light: { color: '#ff4fd8', radius: 130, intensity: 0.75, flicker: 0, glow: 0.7, shape: 'round' } },
        { id: 'neonBlue', label: 'Neon (blue)', light: { color: '#38d6ff', radius: 130, intensity: 0.75, flicker: 0, glow: 0.7, shape: 'round' } },
        { id: 'crystal', label: 'Crystal', light: { color: '#9ef0ff', radius: 110, intensity: 0.7, flicker: 0.05, glow: 0.55, shape: 'round' } },
        { id: 'spotlight', label: 'Spotlight (cone)', light: { color: '#fff6e0', radius: 300, intensity: 0.95, flicker: 0, glow: 0.1, shape: 'cone', spread: 40 } },
        { id: 'moonbeam', label: 'Moonbeam (cone)', light: { color: '#b8c8ff', radius: 260, intensity: 0.6, flicker: 0, glow: 0.05, shape: 'cone', spread: 30, angle: 100 } },
        { id: 'window', label: 'Window glow', light: { color: '#ffd9a0', radius: 120, intensity: 0.7, flicker: 0, glow: 0.2, shape: 'cone', spread: 80, angle: 90, when: 'dark' } }
    ],

    get(id) {
        return this.list.find(p => p.id === id) || null;
    },

    // A light with a preset's colour, size, flicker and shape (its position and on/off stay).
    apply(light, id) {
        const p = this.get(id);
        const base = Object.assign({}, light || {});
        if (!p) { base.preset = ''; return base; }
        return Object.assign(base, JSON.parse(JSON.stringify(p.light)), { preset: id });
    }
};

DocsDoodads.Occlusion = {
    defaults: { occlusion: false, wallRegions: '', rays: 160 },

    settings() {
        return Object.assign({}, this.defaults, DocsDoodads.World.settings().lighting2d || {});
    },

    // Whether a light stops at walls: its own choice, or the world's.
    appliesTo(light, world) {
        if (light.occlude === true || light.occlude === 'on') return true;
        if (light.occlude === false || light.occlude === 'off') return false;
        return Boolean(world && world.occlusion);
    },

    regions(text) {
        return new Set(String(text || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0));
    },

    // The outline a light reaches, in map pixels: [cx, cy, x1, y1, x2, y2, ...] (a fan from the light).
    // isWall(tx, ty) says whether a tile stops light. A cone (angle and spread in degrees) only casts rays
    // across its width. The tile the light stands in never blocks it (a lamp on a wall).
    visibility(cx, cy, radius, isWall, tw, th, opts = {}) {
        const rays = Math.max(8, Math.min(720, Math.round(Number(opts.rays) || 160)));
        const cone = opts.spread !== undefined && opts.spread < 360;
        const spread = cone ? Math.max(1, Math.min(359, Number(opts.spread))) * Math.PI / 180 : Math.PI * 2;
        const start = cone ? (Number(opts.angle) || 0) * Math.PI / 180 - spread / 2 : 0;
        const n = cone ? Math.max(4, Math.round(rays * spread / (Math.PI * 2))) : rays;
        const sx = Math.floor(cx / tw), sy = Math.floor(cy / th);
        const pts = [cx, cy];
        for (let i = 0; i <= n; i++) {
            if (!cone && i === n) break;
            const a = start + spread * (i / n);
            const dx = Math.cos(a), dy = Math.sin(a);
            const d = this.cast(cx, cy, dx, dy, radius, isWall, tw, th, sx, sy);
            pts.push(cx + dx * d, cy + dy * d);
        }
        if (!cone) pts.push(pts[2], pts[3]);
        return pts;
    },

    // How far a ray gets before a wall tile (or the radius): stepping tile edge to tile edge.
    cast(x, y, dx, dy, radius, isWall, tw, th, sx, sy) {
        let tx = Math.floor(x / tw), ty = Math.floor(y / th);
        const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
        const nextX = (dx > 0 ? (tx + 1) * tw : tx * tw) - x, nextY = (dy > 0 ? (ty + 1) * th : ty * th) - y;
        let tMaxX = dx !== 0 ? nextX / dx : Infinity, tMaxY = dy !== 0 ? nextY / dy : Infinity;
        const tDX = dx !== 0 ? Math.abs(tw / dx) : Infinity, tDY = dy !== 0 ? Math.abs(th / dy) : Infinity;
        let t = 0;
        for (let guard = 0; guard < 400; guard++) {
            if (tMaxX < tMaxY) { t = tMaxX; tMaxX += tDX; tx += stepX; } else { t = tMaxY; tMaxY += tDY; ty += stepY; }
            if (t >= radius) return radius;
            if ((tx !== sx || ty !== sy) && isWall(tx, ty)) return t;
        }
        return radius;
    }
};

DocsDoodads.Flashlight = {
    defaults: { enabled: false, switchId: 0, radius: 280, spread: 50, color: '#fff2cc', intensity: 0.9, occlude: true },

    settings() {
        return Object.assign({}, this.defaults, (DocsDoodads.World.settings().lighting2d || {}).flashlight || {});
    },

    // On when World > Lighting turns it on (and its switch is on, if it has one), unless the Flashlight
    // command turned it off; the command can also turn it on for this playthrough.
    isOn(switchValue) {
        const s = this.settings();
        const sys = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsFlashlight : undefined;
        if (sys === false) return false;
        if (sys === true) return true;
        if (!s.enabled) return false;
        return !(Number(s.switchId) > 0) || Boolean(switchValue && switchValue(Number(s.switchId)));
    },

    // Degrees for MZ's directions (2 down, 4 left, 6 right, 8 up).
    angleFor(direction) {
        return { 2: 90, 4: 180, 6: 0, 8: 270 }[direction] !== undefined ? { 2: 90, 4: 180, 6: 0, 8: 270 }[direction] : 90;
    },

    // Turns smoothly toward where the player faces (degrees a frame).
    turn(current, target, step = 18) {
        let d = ((target - current + 540) % 360) - 180;
        if (Math.abs(d) <= step) return target;
        return (current + Math.sign(d) * step + 360) % 360;
    }
};
