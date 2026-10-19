//==========================================================
// SECTION 5I: PERSPECTIVE (3D) MODE
//==========================================================
// The flat map (map pixels as drawn by the tilemap, "flat" space) is laid on a ground plane and seen
// by a camera. World axes: x east, y south (flat pixels), z up. Things that stand up are drawn as
// upright billboards at the projection of their foot point.
DocsDoodads.Perspective = {
    defaults: {
        enabled: false, pitch: 55, yaw: 0, fov: 50, zoom: 1, viewTiles: 40, fogStart: 12, fogEnd: 19,
        fogColor: '', skyColor: '#000000', voidColor: '#000000', rotate: false, smoothGround: false,
        curve: 'flat', curveRadius: 60, lean: true,
        water: true, waterStrength: 0.6, waterSpeed: 1, waterShine: 0.4, waterWakes: true,
        weather: true, weatherDensity: 1, dayNight: true, doodadScale: 1, characterScale: 1, standTiles: 'off', standFlatRegion: 0, snowCover: false,
        clouds: 0, cloudScale: 6, cloudSpeed: 1, mist: 0, mistHeight: 1, minimap: false, battleBack: false,
        skyVideo: '', skyVideoMode: 'panorama', skyVideoSpeed: 1, skyVideoDayNight: true, skyVideoFlat: false,
        // Doodads farther than this many tiles from the camera's target are drawn plain (no shadow, no
        // particles or effects); 0 draws everything in full.
        lodTiles: 0
    },

    curves: [
        { value: 'flat', label: 'Flat' },
        { value: 'sphere', label: 'Planet (curves away all round)' },
        { value: 'cylinder', label: 'Rolling log (curves away ahead)' }
    ],

    normalize(s) {
        s = s || {};
        const d = this.defaults;
        const num = (v, fallback, min, max) => {
            const n = Number(v);
            return v === undefined || v === null || v === '' || !Number.isFinite(n) ? fallback : Math.max(min, Math.min(max, n));
        };
        const color = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : fallback);
        const out = {
            enabled: s.enabled === true,
            pitch: num(s.pitch, d.pitch, 20, 89),
            yaw: ((num(s.yaw, d.yaw, -100000, 100000) % 360) + 360) % 360,
            fov: num(s.fov, d.fov, 20, 100),
            zoom: num(s.zoom, d.zoom, 0.25, 4),
            viewTiles: Math.round(num(s.viewTiles, d.viewTiles, 12, 80)),
            fogStart: num(s.fogStart, d.fogStart, 0, 200),
            fogEnd: num(s.fogEnd, d.fogEnd, 0, 400),
            fogColor: color(s.fogColor, d.fogColor),
            skyColor: color(s.skyColor, d.skyColor),
            voidColor: color(s.voidColor, d.voidColor),
            rotate: s.rotate === true,
            smoothGround: s.smoothGround === true,
            curve: this.curves.some(c => c.value === s.curve) ? s.curve : 'flat',
            curveRadius: Number(s.curveRadius) === 0 && s.curveRadius !== '' && s.curveRadius !== null && s.curveRadius !== undefined ? 0 : num(s.curveRadius, d.curveRadius, 6, 2000),
            lean: s.lean !== false,
            water: s.water !== false,
            waterStrength: num(s.waterStrength, d.waterStrength, 0, 2),
            waterSpeed: num(s.waterSpeed, d.waterSpeed, 0, 3),
            waterShine: num(s.waterShine, d.waterShine, 0, 1),
            waterWakes: s.waterWakes !== false,
            weather: s.weather !== false,
            weatherDensity: num(s.weatherDensity, d.weatherDensity, 0, 3),
            dayNight: s.dayNight !== false,
            doodadScale: num(s.doodadScale, d.doodadScale, 0.25, 2),
            characterScale: num(s.characterScale, d.characterScale, 0.25, 2),
            standTiles: s.standTiles === 'star' || s.standTiles === 'all' ? s.standTiles : 'off',
            standFlatRegion: Math.round(num(s.standFlatRegion, d.standFlatRegion, 0, 255)),
            snowCover: s.snowCover === true,
            clouds: num(s.clouds, d.clouds, 0, 1),
            cloudScale: num(s.cloudScale, d.cloudScale, 2, 100),
            cloudSpeed: num(s.cloudSpeed, d.cloudSpeed, 0, 5),
            mist: num(s.mist, d.mist, 0, 1),
            mistHeight: num(s.mistHeight, d.mistHeight, 0.25, 10),
            minimap: s.minimap === true,
            battleBack: s.battleBack === true,
            skyVideo: typeof s.skyVideo === 'string' ? s.skyVideo.trim().replace(/\\/g, '/') : '',
            skyVideoMode: s.skyVideoMode === 'fill' ? 'fill' : 'panorama',
            skyVideoSpeed: num(s.skyVideoSpeed, d.skyVideoSpeed, 0, 4),
            skyVideoDayNight: s.skyVideoDayNight !== false,
            skyVideoFlat: s.skyVideoFlat === true,
            lodTiles: num(s.lodTiles, d.lodTiles, 0, 200)
        };
        if (out.fogEnd <= out.fogStart) out.fogEnd = out.fogStart + 1;
        return out;
    },

    // The map's camera with mid-game changes on top, or null when the map is flat.
    // Curvature is how round the world is: 0 is flat, 10 is a 60-tile radius, 100 a 6-tile radius.
    radiusFromCurvature(c) {
        return c > 0 ? 600 / c : Infinity;
    },

    curvatureFromRadius(radiusTiles) {
        return radiusTiles > 0 ? 600 / radiusTiles : 0;
    },

    // The curvature settings give, with a radius of 0 fitted to the map's width.
    curvatureOf(settings, mapWidthTiles) {
        if (!settings || settings.curve === 'flat') return 0;
        const radius = settings.curveRadius > 0 ? settings.curveRadius : (mapWidthTiles || 1) / (2 * Math.PI);
        return this.curvatureFromRadius(radius);
    },

    // The screen box a billboard fills, from its feet to a little above its head (transform m, foot at
    // x, y, size w x h in flat pixels), and the depth ground must be nearer than to fade there: `margin`
    // in front of it, so the ground at its feet never fades. Hills that cover the player fade instead.
    seeThroughRect(m, x, y, w, h, margin) {
        const at = (px, py) => ({ x: m.a * px + m.c * py + m.tx, y: m.b * px + m.d * py + m.ty });
        const foot = at(x, y), head = at(x, y - h);
        const len = Math.hypot(head.x - foot.x, head.y - foot.y) || 1;
        const halfH = len * 1.2 / 2;
        return {
            rect: [foot.x + (head.x - foot.x) / len * halfH, foot.y + (head.y - foot.y) / len * halfH, w * Math.hypot(m.a, m.b) * 0.65, halfH],
            depth: m.depth - (margin || 0)
        };
    },

    // The screen box (x, y, w, h) a flat rectangle covers once drawn with billboard transform m.
    screenBox(m, left, top, w, h) {
        const xs = [], ys = [];
        for (const [px, py] of [[left, top], [left + w, top], [left, top + h], [left + w, top + h]]) {
            xs.push(m.a * px + m.c * py + m.tx);
            ys.push(m.b * px + m.d * py + m.ty);
        }
        const x = Math.min(...xs), y = Math.min(...ys);
        return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    },

    // Whether a billboard at `depth` drawn over `box` hides the player (see: from seeThroughRect): it is
    // in front of them and covers at least a quarter of them.
    hidesPlayer(box, depth, see) {
        if (!see || !(depth < see.depth)) return false;
        const [cx, cy, hw, hh] = see.rect;
        const player = { x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 };
        const ox = Math.min(box.x + box.w, player.x + player.w) - Math.max(box.x, player.x);
        const oy = Math.min(box.y + box.h, player.y + player.h) - Math.max(box.y, player.y);
        return ox > 0 && oy > 0 && ox * oy >= 0.25 * player.w * player.h;
    },

    // The drawer's 3D preview: a small camera over a patch of ground, the party leader one tile left of
    // centre and the asset one tile right, each standing at its 3D height setting. Sizes in canvas pixels.
    previewLayout(settings, width, height, asset, hero) {
        const s = this.normalize(Object.assign({}, settings, { enabled: true }));
        const tile = 48;
        const cam = this.camera({ target: { x: 0, y: -tile }, pitch: s.pitch, yaw: 0, fov: s.fov, zoom: 0.6, width, height, curve: 'flat' });
        const grid = [];
        for (let i = -5; i <= 5; i++) {
            const a = this.project(cam, i * tile, -6 * tile, 0), b = this.project(cam, i * tile, 3 * tile, 0);
            if (a && b) grid.push([a.x, a.y, b.x, b.y]);
        }
        for (let j = -6; j <= 3; j++) {
            const a = this.project(cam, -5 * tile, j * tile, 0), b = this.project(cam, 5 * tile, j * tile, 0);
            if (a && b) grid.push([a.x, a.y, b.x, b.y]);
        }
        const stand = (x, w, h, k) => {
            const foot = this.project(cam, x, tile / 2, 0);
            if (!foot) return null;
            const sw = w * foot.scale * k, sh = h * foot.scale * k;
            return { x: foot.x - sw / 2, y: foot.y - sh, w: sw, h: sh };
        };
        return {
            grid,
            hero: stand(-tile, hero.w, hero.h, s.characterScale),
            asset: stand(tile, asset.w, asset.h, s.doodadScale),
            doodadScale: s.doodadScale, characterScale: s.characterScale
        };
    },

    // The camera for a battle background: low over the ground, looking the way the map's camera looks.
    battleCamera(s) {
        return { pitch: Math.min(s.pitch, 22), yaw: s.yaw, zoom: Math.max(1.2, s.zoom) };
    },

    // How far the cloud pattern has drifted after t seconds (pattern units: one is a cloud's size).
    cloudDrift(t, speed) {
        const k = (Number(speed) || 0) * 0.02 * t;
        return { x: k, y: k * 0.35 };
    },

    // Mouse look in the editor: dragging right turns right, dragging down looks more steeply down.
    orbit(s, dx, dy) {
        return {
            yaw: ((s.yaw + dx * 0.4) % 360 + 360) % 360,
            pitch: Math.max(20, Math.min(89, s.pitch + dy * 0.3))
        };
    },

    // The wheel zooms in steps of about 10%, within the zoom setting's range.
    wheelZoom(zoom, deltaY) {
        const next = deltaY < 0 ? zoom * 1.1 : deltaY > 0 ? zoom / 1.1 : zoom;
        return Math.round(Math.max(0.25, Math.min(4, next)) * 1000) / 1000;
    },

    resolve(mapSettings, override) {
        const s = this.withOverride(mapSettings, override);
        return s.enabled ? s : null;
    },

    // The map's 3D settings with a mid-game override (Set Camera, Set 3D View, Set Sky Video) applied,
    // whether or not 3D is on.
    withOverride(mapSettings, override) {
        const merged = Object.assign({}, mapSettings || {});
        for (const key of Object.keys(override || {})) {
            if (override[key] !== undefined && override[key] !== null) merged[key] = override[key];
        }
        // Set Camera can ease the curvature; 0 flattens the world, any other value curves it.
        if (merged.curvature !== undefined && merged.curvature !== null) {
            const c = Number(merged.curvature) || 0;
            if (c <= 0) merged.curve = 'flat';
            else {
                merged.curveRadius = Math.min(2000, this.radiusFromCurvature(c));
                if (merged.curve !== 'sphere' && merged.curve !== 'cylinder') merged.curve = 'sphere';
            }
            delete merged.curvature;
        }
        return this.normalize(merged);
    },

    // The player's Effects Quality also scales the 3D view down: 0 high (as set), 1 medium, 2 low.
    // Off (3) counts as low, since the 3D view itself stays on.
    qualityPresets: [
        null,
        { viewTiles: 32, weather: 0.6, wakes: true, terrainSteps: 2 },
        { viewTiles: 24, weather: 0.35, wakes: false, terrainSteps: 1 }
    ],

    withQuality(s, playerOption) {
        const level = Math.max(0, Math.min(2, Math.round(Number(playerOption) || 0)));
        const q = this.qualityPresets[level];
        if (!s || !q) return s;
        const out = Object.assign({}, s, { weatherDensity: s.weatherDensity * q.weather, terrainSteps: q.terrainSteps });
        if (s.viewTiles > q.viewTiles) {
            // The fog closes in with the view, so the ground's edge stays hidden.
            const k = q.viewTiles / s.viewTiles;
            Object.assign(out, { viewTiles: q.viewTiles, fogStart: s.fogStart * k, fogEnd: s.fogEnd * k });
        }
        if (!q.wakes) out.waterWakes = false;
        return out;
    },

    // spec: { target: {x, y} (flat pixels), pitch, yaw (degrees), fov (vertical, degrees), zoom, width, height }
    camera(spec) {
        const rad = Math.PI / 180;
        const th = spec.pitch * rad, ps = spec.yaw * rad;
        const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ps), sp = Math.sin(ps);
        const F = { x: ct * sp, y: -ct * cp, z: -st };
        const R = { x: cp, y: sp, z: 0 };
        const U = { x: st * sp, y: -st * cp, z: ct };
        const focal = (spec.height / 2) / Math.tan(spec.fov * rad / 2);
        const dist = focal / (spec.zoom || 1);
        const C = { x: spec.target.x - F.x * dist, y: spec.target.y - F.y * dist, z: -F.z * dist };
        // Round worlds: a sphere or a cylinder (axis left-right) touching the ground at the target.
        const curve = (spec.curve === 'sphere' || spec.curve === 'cylinder') && spec.radius > 0 ? spec.curve : 'flat';
        return { C, F, R, U, focal, dist, width: spec.width, height: spec.height, target: spec.target,
            curve, radius: curve === 'flat' ? 0 : spec.radius, lean: spec.lean !== false,
            axis: { x: cp, y: sp }, ahead: { x: sp, y: -cp } };
    },

    // A planet sized so that walking once across a looping map is one lap.
    fitRadius(mapWidthTiles, tileWidth) {
        return (mapWidthTiles * tileWidth) / (2 * Math.PI);
    },

    // Where a flat point sits in the world: on the plane, or wrapped onto the curve keeping distances
    // along the ground. n is the surface's up direction; visible is false past the far side.
    groundPoint(cam, x, y, height) {
        const g = this.surfacePoint(cam, x, y);
        if (height) {
            g.x += g.nx * height;
            g.y += g.ny * height;
            g.z += g.nz * height;
        }
        return g;
    },

    surfacePoint(cam, x, y) {
        const T = cam.target, R = cam.radius;
        if (cam.curve === 'sphere') {
            const ox = x - T.x, oy = y - T.y, s = Math.hypot(ox, oy);
            if (s < 1e-9) return { x, y, z: 0, nx: 0, ny: 0, nz: 1, visible: true };
            const a = s / R, dx = ox / s, dy = oy / s, sa = Math.sin(a), ca = Math.cos(a);
            return { x: T.x + dx * R * sa, y: T.y + dy * R * sa, z: -2 * R * Math.sin(a / 2) ** 2, nx: dx * sa, ny: dy * sa, nz: ca, visible: a < Math.PI - 1e-9 };
        }
        if (cam.curve === 'cylinder') {
            const ox = x - T.x, oy = y - T.y;
            const u = ox * cam.axis.x + oy * cam.axis.y, w = ox * cam.ahead.x + oy * cam.ahead.y;
            const a = w / R, sa = Math.sin(a), ca = Math.cos(a);
            return { x: T.x + cam.axis.x * u + cam.ahead.x * R * sa, y: T.y + cam.axis.y * u + cam.ahead.y * R * sa, z: -2 * R * Math.sin(a / 2) ** 2,
                nx: cam.ahead.x * sa, ny: cam.ahead.y * sa, nz: ca, visible: Math.abs(a) < Math.PI - 1e-9 };
        }
        return { x, y, z: 0, nx: 0, ny: 0, nz: 1, visible: true };
    },

    project(cam, x, y, z) {
        const vx = x - cam.C.x, vy = y - cam.C.y, vz = (z || 0) - cam.C.z;
        const depth = vx * cam.F.x + vy * cam.F.y + vz * cam.F.z;
        if (depth < 1) return null;
        const scale = cam.focal / depth;
        return {
            x: cam.width / 2 + (vx * cam.R.x + vy * cam.R.y + vz * cam.R.z) * scale,
            y: cam.height / 2 - (vx * cam.U.x + vy * cam.U.y + vz * cam.U.z) * scale,
            depth, scale
        };
    },

    // The ground point under a screen point, or null above the horizon.
    unproject(cam, sx, sy) {
        const a = (sx - cam.width / 2) / cam.focal, b = (cam.height / 2 - sy) / cam.focal;
        const dx = cam.F.x + a * cam.R.x + b * cam.U.x;
        const dy = cam.F.y + a * cam.R.y + b * cam.U.y;
        const dz = cam.F.z + a * cam.R.z + b * cam.U.z;
        const C = cam.C, T = cam.target, R = cam.radius;
        // Nearest root of a t^2 + b t + c = 0 in front of the camera.
        // Nearest root of qa t^2 + qb t + qc = 0 in front of the camera, in a form that stays accurate when
        // the radius is huge (qc is passed already expanded so R^2 never cancels).
        const nearest = (qa, qb, qc) => {
            const disc = qb * qb - 4 * qa * qc;
            if (disc < 0 || qa < 1e-12) return null;
            const root = Math.sqrt(disc);
            const t = qb < 0 ? (2 * qc) / (-qb + root) : (-qb - root) / (2 * qa);
            return t > 0 ? t : null;
        };
        if (cam.curve === 'sphere') {
            const cx = C.x - T.x, cy = C.y - T.y, cz = C.z + R;
            const t = nearest(dx * dx + dy * dy + dz * dz, 2 * (dx * cx + dy * cy + dz * cz), cx * cx + cy * cy + C.z * C.z + 2 * C.z * R);
            if (t === null) return null;
            const vx = cx + t * dx, vy = cy + t * dy, vz = cz + t * dz;
            const h = Math.hypot(vx, vy), ang = Math.atan2(h, vz);
            return h < 1e-9 ? { x: T.x, y: T.y } : { x: T.x + vx / h * R * ang, y: T.y + vy / h * R * ang };
        }
        if (cam.curve === 'cylinder') {
            const ox = C.x - T.x, oy = C.y - T.y;
            const cu = ox * cam.axis.x + oy * cam.axis.y, cw = ox * cam.ahead.x + oy * cam.ahead.y, cz = C.z + R;
            const du = dx * cam.axis.x + dy * cam.axis.y, dw = dx * cam.ahead.x + dy * cam.ahead.y;
            const t = nearest(dw * dw + dz * dz, 2 * (cw * dw + cz * dz), cw * cw + C.z * C.z + 2 * C.z * R);
            if (t === null) return null;
            const u = cu + t * du, w = cw + t * dw, z = cz + t * dz;
            const along = R * Math.atan2(w, z);
            return { x: T.x + cam.axis.x * u + cam.ahead.x * along, y: T.y + cam.axis.y * u + cam.ahead.y * along };
        }
        if (dz > -1e-6) return null;
        const t = -C.z / dz;
        return { x: C.x + t * dx, y: C.y + t * dy };
    },

    horizonY(cam) {
        if (Math.abs(cam.U.z) < 1e-9) return -Infinity;
        return cam.height / 2 - cam.focal * (-cam.F.z / cam.U.z);
    },

    // Flat space to screen for something standing at `pivot`: scale around the projected foot.
    // pivot: { x, y } in flat pixels, and h: the ground's height there in pixels (terrain).
    billboardMatrix(cam, pivot) {
        const g = this.groundPoint(cam, pivot.x, pivot.y, pivot.h || 0);
        if (!g.visible) return null;
        // On a round world, the far side of the horizon faces away from the camera.
        if (cam.curve !== 'flat' && g.nx * (cam.C.x - g.x) + g.ny * (cam.C.y - g.y) + g.nz * (cam.C.z - g.z) <= 0) return null;
        const p = this.project(cam, g.x, g.y, g.z);
        if (!p) return null;
        let angle = 0;
        if (cam.curve !== 'flat' && cam.lean) {
            const top = this.project(cam, g.x + g.nx * 48, g.y + g.ny * 48, g.z + g.nz * 48);
            if (top) angle = Math.atan2(top.x - p.x, p.y - top.y);
        }
        const s = p.scale, cos = Math.cos(angle), sin = Math.sin(angle);
        const a = s * cos, b = s * sin, c = -s * sin, d = s * cos;
        return { a, b, c, d, tx: p.x - (a * pivot.x + c * pivot.y), ty: p.y - (b * pivot.x + d * pivot.y), depth: p.depth };
    },

    // A billboard's transform scaled by k about its foot (pivot), so it stays standing on the same spot.
    scaleAbout(m, pivot, k) {
        if (k === 1 || !m) return m;
        return { a: m.a * k, b: m.b * k, c: m.c * k, d: m.d * k,
            tx: m.tx + (1 - k) * (m.a * pivot.x + m.c * pivot.y), ty: m.ty + (1 - k) * (m.b * pivot.x + m.d * pivot.y), depth: m.depth };
    },

    // How far ahead of the camera a point on the ground (x, y in flat pixels) is: the order things are
    // drawn in. Height is left out, so a wall top behind a tree never counts as in front of it.
    groundDepth(cam, x, y) {
        const C = cam.C, F = cam.F;
        if (cam.curve === 'flat') return (x - C.x) * F.x + (y - C.y) * F.y - C.z * F.z;
        const g = this.surfacePoint(cam, x, y);
        return (g.x - C.x) * F.x + (g.y - C.y) * F.y + (g.z - C.z) * F.z;
    },

    compareBillboards(a, b) {
        if (a.depth !== b.depth) return b.depth - a.depth;
        if (a.z !== b.z) return a.z - b.z;
        return (a.spriteId || 0) - (b.spriteId || 0);
    },

    fogAt(distance, start, end) {
        if (distance <= start) return 0;
        if (distance >= end) return 1;
        const t = (distance - start) / (end - start);
        return t * t * (3 - 2 * t);
    },

    // Which way the camera faces, in quarter turns (0 = looking north).
    quarter(yaw) {
        return ((Math.round(yaw / 90) % 4) + 4) % 4;
    },

    _ring: [8, 9, 6, 3, 2, 1, 4, 7],

    // The facing to draw for a character: turning the camera turns what you see.
    viewDirection(dir, yaw) {
        const i = this._ring.indexOf(dir);
        if (i < 0) return dir;
        return this._ring[(((i - 2 * this.quarter(yaw)) % 8) + 8) % 8];
    },

    // Arrow keys relative to the camera: up walks away from it.
    inputDirection(dir, yaw) {
        const i = this._ring.indexOf(dir);
        if (i < 0) return dir;
        return this._ring[(i + 2 * this.quarter(yaw)) % 8];
    },

    // Eased camera moves. Yaw turns the short way round.
    startTween(from, to, frames) {
        const keys = ['pitch', 'yaw', 'zoom', 'fov', 'curvature'];
        const start = {}, end = {};
        for (const k of keys) {
            start[k] = from[k];
            end[k] = to[k] !== undefined && to[k] !== null ? Number(to[k]) : from[k];
        }
        if (Number.isFinite(start.yaw) && Number.isFinite(end.yaw)) {
            let delta = ((end.yaw - start.yaw) % 360 + 540) % 360 - 180;
            end.yaw = start.yaw + delta;
        }
        return { from: start, to: end, frames: Math.max(1, Math.round(frames) || 1), t: 0, done: false };
    },

    stepTween(tween) {
        tween.t = Math.min(tween.frames, tween.t + 1);
        if (tween.t >= tween.frames) {
            tween.done = true;
            return Object.assign({}, tween.to);
        }
        const x = tween.t / tween.frames, e = x * x * (3 - 2 * x);
        const out = {};
        for (const k of Object.keys(tween.to)) {
            const a = tween.from[k], b = tween.to[k];
            out[k] = Number.isFinite(a) && Number.isFinite(b) ? a + (b - a) * e : b;
        }
        return out;
    },

    // A flat rectangle (the sprite's image) drawn as a billboard standing at `pivot`, in screen pixels.
    // The first terrain hit under a screen point: march along the ray until it dips below the ground,
    // then bisect. heightPx(x, y) is the terrain height in pixels at a flat point; opts.maxHeight and
    // opts.minHeight (pixels) bound the terrain so the march is fine only where it can hit something.
    unprojectTerrain(cam, sx, sy, heightPx, opts) {
        opts = opts || {};
        const a = (sx - cam.width / 2) / cam.focal, b = (cam.height / 2 - sy) / cam.focal;
        const D = { x: cam.F.x + a * cam.R.x + b * cam.U.x, y: cam.F.y + a * cam.R.y + b * cam.U.y, z: cam.F.z + a * cam.R.z + b * cam.U.z };
        const len = Math.hypot(D.x, D.y, D.z);
        const T = cam.target, R = cam.radius;
        // Height above the base surface and the flat point under a world point.
        const locate = t => {
            const px = cam.C.x + D.x * t / len, py = cam.C.y + D.y * t / len, pz = cam.C.z + D.z * t / len;
            if (cam.curve === 'sphere') {
                const vx = px - T.x, vy = py - T.y, vz = pz + R, r = Math.hypot(vx, vy, vz), hl = Math.hypot(vx, vy);
                const ang = Math.atan2(hl, vz);
                return { e: r - R, x: hl < 1e-9 ? T.x : T.x + vx / hl * R * ang, y: hl < 1e-9 ? T.y : T.y + vy / hl * R * ang };
            }
            if (cam.curve === 'cylinder') {
                const ox = px - T.x, oy = py - T.y;
                const u = ox * cam.axis.x + oy * cam.axis.y, w = ox * cam.ahead.x + oy * cam.ahead.y, zz = pz + R;
                const along = R * Math.atan2(w, zz);
                return { e: Math.hypot(w, zz) - R, x: T.x + cam.axis.x * u + cam.ahead.x * along, y: T.y + cam.axis.y * u + cam.ahead.y * along };
            }
            return { e: pz, x: px, y: py };
        };
        const above = t => { const p = locate(t); return p.e - heightPx(p.x, p.y); };
        const top = opts.maxHeight !== undefined ? opts.maxHeight : 1000;
        const bottom = (opts.minHeight !== undefined ? opts.minHeight : -1000) - 1;
        const far = cam.dist * 30, coarse = cam.dist / 20, fine = opts.step || 4;
        // Coarse steps down to the terrain's highest point; the fine march starts one step back.
        let t = 0;
        while (t < far && locate(t).e > top) t += coarse;
        if (t >= far) return null;
        t = Math.max(0, t - coarse);
        let fPrev = above(t);
        if (fPrev <= 0) return null;
        for (; t < far; t += fine) {
            const next = t + fine, f = above(next);
            if (f <= 0) {
                let lo = t, hi = next;
                for (let k = 0; k < 30; k++) {
                    const mid = (lo + hi) / 2;
                    if (above(mid) > 0) lo = mid; else hi = mid;
                }
                const p = locate((lo + hi) / 2);
                return { x: p.x, y: p.y };
            }
            // Below the lowest ground without a hit (looking past the edge of a round world): nothing.
            if (locate(next).e < bottom) return null;
            fPrev = f;
        }
        return null;
    },

    screenRect(cam, rect, pivot) {
        const m = this.billboardMatrix(cam, pivot);
        if (!m) return null;
        const xs = [], ys = [];
        for (const [x, y] of [[rect.x, rect.y], [rect.x + rect.w, rect.y], [rect.x, rect.y + rect.h], [rect.x + rect.w, rect.y + rect.h]]) {
            xs.push(m.a * x + m.c * y + m.tx);
            ys.push(m.b * x + m.d * y + m.ty);
        }
        const x0 = Math.min(...xs), y0 = Math.min(...ys);
        return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0, depth: m.depth };
    },

    // The 12 edges of a box around a billboard: its footprint on the ground and its upright height.
    gizmoBox(cam, rect, pivot) {
        const half = rect.w / 4, height = Math.max(1, pivot.y - rect.y);
        const ground = [[rect.x, pivot.y - half], [rect.x + rect.w, pivot.y - half], [rect.x + rect.w, pivot.y + half], [rect.x, pivot.y + half]];
        const bottom = ground.map(([x, y]) => {
            const g = this.groundPoint(cam, x, y, pivot.h || 0);
            return g.visible ? this.project(cam, g.x, g.y, g.z) : null;
        });
        if (bottom.some(p => !p)) return null;
        const top = bottom.map(p => ({ x: p.x, y: p.y - height * p.scale }));
        const edges = [];
        for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4;
            edges.push([bottom[i], bottom[j]], [top[i], top[j]], [bottom[i], top[i]]);
        }
        return edges;
    }
};

// A video as the sky: a looping movie (MZ's movies folder, or any project path), muted. A 360 degree
// panorama (equirectangular, north at its centre) turns with the camera; any other video fills the sky.
// One video element is shared by everything showing the same file, and freed when the last one lets go.
DocsDoodads.SkyVideo = {
    modes: [
        { value: 'panorama', label: '360° panorama (turns with the camera)' },
        { value: 'fill', label: 'Fill the sky (stays put)' }
    ],
    _entries: new Map(),

    // A project path as a URL (each folder and the file name encoded; "movies/Sky" gets MZ's .webm).
    url(path) {
        let p = String(path || '').replace(/\\/g, '/').replace(/^\.?\/+/, '');
        if (!/\.[a-z0-9]+$/i.test(p)) p += '.webm';
        return p.split('/').map(encodeURIComponent).join('/');
    },

    acquire(path, owner) {
        if (!path || typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
        let entry = this._entries.get(path);
        if (!entry) {
            const video = document.createElement('video');
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.src = this.url(path);
            const texture = PIXI.Texture.from(video, { resourceOptions: { autoPlay: true, updateFPS: 30 } });
            // Scenes come and go (MZ frees their textures); the video stays until its last user goes.
            texture.destroy = function() {};
            entry = { path, video, texture, users: new Set(), error: false };
            if (video.addEventListener) video.addEventListener('error', () => {
                // Letting the video go (clearing its source) raises an error too; only real ones are reported.
                if (entry.released) return;
                entry.error = true;
                console.warn('[DocsDoodads] Could not play the sky video ' + path + '.');
            });
            const playing = video.play && video.play();
            if (playing && playing.catch) playing.catch(() => {});
            this._entries.set(path, entry);
        }
        entry.users.add(owner);
        return entry;
    },

    release(path, owner) {
        const entry = this._entries.get(path);
        if (!entry) return;
        entry.users.delete(owner);
        if (entry.users.size) return;
        this._entries.delete(path);
        entry.released = true;
        try { entry.video.pause(); entry.video.removeAttribute('src'); entry.video.load(); } catch (e) {}
        PIXI.Texture.prototype.destroy.call(entry.texture, true);
    },

    ready(entry) {
        return Boolean(entry && !entry.error && entry.video.readyState >= 2 && entry.video.videoWidth > 0);
    },

    // Where a panorama sits for a camera: the tile scale (one video pixel on screen) and the video's offset
    // so north is at the screen's centre when the camera faces north and the video's middle row (the
    // equator) is on the horizon. Fill: stretched over the sky above the horizon.
    layout(mode, cam, yaw, horizonY, videoW, videoH) {
        const W = cam.width;
        if (mode === 'fill') return { y: 0, height: Math.max(1, horizonY), scaleX: W / videoW, scaleY: Math.max(1, horizonY) / videoH, offsetX: 0, offsetY: 0 };
        const scale = cam.focal * 2 * Math.PI / videoW;
        const full = videoW * scale;
        const equatorTop = horizonY - videoH * scale / 2;
        const top = Math.max(0, equatorTop);
        return { y: top, height: Math.max(1, horizonY - top + 2), scaleX: scale, scaleY: scale,
            offsetX: ((W / 2 - (((yaw % 360) + 360) % 360) / 360 * full - full / 2) % full + full) % full - full, offsetY: equatorTop - top };
    }
};

// Terrain height for the 3D view, in tiles. Heights come from (highest priority first) the height
// brush, regions, terrain tags, and automatically from world-tileset mountains and forests.
DocsDoodads.Terrain = {
    styles: [
        { value: 'smooth', label: 'Smooth (hills and mountains)' },
        { value: 'stepped', label: 'Stepped (cliffs and plateaus)' }
    ],
    defaults: { enabled: false, style: 'smooth', auto: true, mountain: 1, forest: 0.25, tags: [], regions: [], paint: {}, block: false, climb: 0.5, drop: false, hop: 0, walls: false, wallHeight: 2 },
    // Smooth ground: heights are sampled 4 times per tile and blurred, so ranges stay full height inside
    // and round off at their edges with low foothills, and art isn't stretched up sharp spikes.
    smoothSamples: 4,
    smoothSigma: 0.25,
    // Extra tiles the 3D terrain mesh is built with on each side, so walking rebuilds it less often.
    meshMargin: 4,
    // How much the ground under a doodad's base may vary (tiles) and still count as level.
    levelTolerance: 0.35,
    // A light from the upper left, for shading slopes.
    light: (() => { const l = [-0.45, -0.55, 0.7], n = Math.hypot(...l); return l.map(v => v / n); })(),

    normalize(s) {
        s = s || {};
        const d = this.defaults;
        const num = (v, fallback, min, max) => {
            const n = Number(v);
            return v === undefined || v === null || v === '' || !Number.isFinite(n) ? fallback : Math.max(min, Math.min(max, n));
        };
        const list = (items, key, max) => (Array.isArray(items) ? items : [])
            .map(r => ({ [key]: Math.round(Number(r && r[key]) || 0), height: num(r && r.height, 0, -20, 20) }))
            .filter(r => r[key] >= 1 && r[key] <= max);
        const paint = {};
        for (const k of Object.keys(s.paint || {})) {
            if (/^-?\d+,-?\d+$/.test(k) && Number.isFinite(Number(s.paint[k]))) paint[k] = Math.max(-20, Math.min(20, Number(s.paint[k])));
        }
        return {
            enabled: s.enabled === true,
            style: this.styles.some(o => o.value === s.style) ? s.style : d.style,
            auto: s.auto !== false,
            mountain: num(s.mountain, d.mountain, 0, 20),
            forest: num(s.forest, d.forest, 0, 20),
            tags: list(s.tags, 'tag', 7),
            regions: list(s.regions, 'region', 255),
            paint,
            block: s.block === true,
            climb: num(s.climb, d.climb, 0, 20),
            drop: s.drop === true,
            hop: num(s.hop, d.hop, 0, 20),
            walls: s.walls === true,
            wallHeight: num(s.wallHeight, d.wallHeight, 0.5, 10)
        };
    },

    // Wall autotiles: 'top' (A4 wall tops, A3 roofs) or 'side' (the wall face below them), else null.
    wallKind(tileId) {
        if (!(tileId >= 2048 && tileId < 8192)) return null;
        const kind = Math.floor((tileId - 2048) / 48);
        if (kind >= 48 && kind < 80) return Math.floor((kind - 48) / 8) % 2 === 0 ? 'top' : 'side';
        if (kind >= 80 && kind < 128) return Math.floor((kind - 80) / 8) % 2 === 0 ? 'top' : 'side';
        return null;
    },

    // Interior walls: in each column, a wall face (side tiles) and the wall top above it rise to the
    // face's height. faceRows: for a side tile, how many rows up the wall top is (its top shows that art);
    // faceDown: on the face's lowest tile, the face height (its front shows the face art above it);
    // faceStart / faceLen: for every tile of a column with a face, the face's first row (+1) and its
    // length, so the wall's other sides can show the same art; faceX: the column (+1) that art is in
    // (a wall seen end-on has none of its own and borrows the nearest wall column's); wall: which tiles are wall.
    buildWalls(map, settings, out, keep) {
        const w = map.width, h = map.height, data = map.data || [];
        const kindAt = (x, y) => this.wallKind(data[(0 * h + y) * w + x] || 0) || this.wallKind(data[(1 * h + y) * w + x] || 0);
        out.faceRows = new Uint8Array(w * h);
        out.faceDown = new Float32Array(w * h);
        out.faceStart = new Int32Array(w * h);
        out.faceLen = new Uint8Array(w * h);
        out.faceX = new Int32Array(w * h);
        out.wall = new Uint8Array(w * h);
        for (let x = 0; x < w; x++) {
            let y = 0;
            while (y < h) {
                const kind = kindAt(x, y);
                if (!kind) { y++; continue; }
                let top = y;
                while (y < h && kindAt(x, y) === 'top') y++;
                const sideStart = y;
                while (y < h && kindAt(x, y) === 'side') y++;
                const sides = y - sideStart;
                const height = sides > 0 ? sides : settings.wallHeight;
                for (let r = top; r < y; r++) {
                    const i = r * w + x;
                    if (keep[i]) continue;
                    out[i] = Math.max(out[i], height);
                    out.wall[i] = 1;
                    if (r >= sideStart) out.faceRows[i] = r - sideStart + 1;
                    if (sides > 0) { out.faceStart[i] = sideStart + 1; out.faceLen[i] = sides; out.faceX[i] = x + 1; }
                }
                if (sides > 0 && !keep[(y - 1) * w + x]) out.faceDown[(y - 1) * w + x] = height;
                if (y === top) y++;
            }
        }
        // Wall tiles with no face of their own: the nearest wall tile (within 6) that has one lends its art.
        const reach = 6;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                if (!out.wall[i] || out.faceStart[i]) continue;
                let best = -1, bestD = Infinity;
                for (let dy = -reach; dy <= reach; dy++) {
                    for (let dx = -reach; dx <= reach; dx++) {
                        const d = Math.abs(dx) + Math.abs(dy);
                        if (d > reach || d >= bestD) continue;
                        const xx = x + dx, yy = y + dy;
                        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
                        const j = yy * w + xx;
                        if (out.faceX[j] && out.faceX[j] === xx + 1) { best = j; bestD = d; }
                    }
                }
                if (best >= 0) { out.faceStart[i] = out.faceStart[best]; out.faceLen[i] = out.faceLen[best]; out.faceX[i] = out.faceX[best]; }
            }
        }
    },

    // World tilesets: impassable ground autotiles (A2) are mountains; passable ones airships can't land on are forests.
    autoKind(tileId, flags, tilesetMode) {
        if (tilesetMode !== 0 || !(tileId >= 2816 && tileId < 4352)) return null;
        const f = (flags && flags[tileId]) || 0;
        if ((f & 0x0f) === 0x0f) return 'mountain';
        if (f & 0x800) return 'forest';
        return null;
    },

    // Heights per tile (row-major), in tiles.
    buildHeights(map, tileset, settings) {
        const w = map.width, h = map.height, data = map.data || [];
        const out = new Float64Array(w * h);
        // Tiles raised as automatic mountains: doodads never stand there.
        const mountains = new Uint8Array(w * h);
        out.mountains = mountains;
        const flags = (tileset && tileset.flags) || [];
        const mode = tileset ? tileset.mode : 1;
        const tagHeight = {}, regionHeight = {};
        for (const t of settings.tags) tagHeight[t.tag] = t.height;
        for (const r of settings.regions) regionHeight[r.region] = r.height;
        // Painted and region heights win over walls.
        const keep = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                const painted = settings.paint[x + ',' + y];
                if (painted !== undefined) { out[i] = painted; keep[i] = 1; continue; }
                const region = data[(5 * h + y) * w + x] || 0;
                if (region && regionHeight[region] !== undefined) { out[i] = regionHeight[region]; keep[i] = 1; continue; }
                let tag = 0;
                for (let z = 3; z >= 0 && !tag; z--) {
                    const id = data[(z * h + y) * w + x] || 0;
                    if (id) tag = ((flags[id] || 0) >> 12) & 7;
                }
                if (tag && tagHeight[tag] !== undefined) { out[i] = tagHeight[tag]; continue; }
                if (settings.auto) {
                    let value = 0;
                    for (let z = 0; z < 2; z++) {
                        const kind = this.autoKind(data[(z * h + y) * w + x] || 0, flags, mode);
                        if (kind === 'mountain') { value = Math.max(value, settings.mountain); mountains[i] = 1; }
                        else if (kind === 'forest') value = Math.max(value, settings.forest);
                    }
                    out[i] = value;
                }
            }
        }
        // The ground without walls: Smooth blurs this, and walls stand on it as sharp blocks.
        if (settings.walls) {
            const ground = Float64Array.from(out);
            this.buildWalls(map, settings, out, keep);
            out.ground = ground;
        }
        return out;
    },

    // A per-tile wall value (faceRows / faceDown), wrapped like tileHeight; 0 where there is none.
    wallMeta(grid, list, tx, ty) {
        const arr = grid.heights && grid.heights[list];
        if (!arr) return 0;
        if (grid.loopX) tx = ((tx % grid.width) + grid.width) % grid.width;
        if (grid.loopY) ty = ((ty % grid.height) + grid.height) % grid.height;
        if (tx < 0 || ty < 0 || tx >= grid.width || ty >= grid.height) return 0;
        return arr[ty * grid.width + tx];
    },

    signature(map, tileset, settings) {
        return [map.width, map.height, tileset ? tileset.mode : '', JSON.stringify(settings)].join('|');
    },

    // grid: { heights, width, height, loopX, loopY }. A tile's height, 0 off the map (wrapped on looping maps).
    tileHeight(grid, tx, ty) {
        if (grid.loopX) tx = ((tx % grid.width) + grid.width) % grid.width;
        if (grid.loopY) ty = ((ty % grid.height) + grid.height) % grid.height;
        if (tx < 0 || ty < 0 || tx >= grid.width || ty >= grid.height) return 0;
        return grid.heights[ty * grid.width + tx];
    },

    // The blurred height samples for smooth ground (cached per height grid).
    smoothField(grid) {
        if (grid._field && grid._field.owner === grid) return grid._field;
        const n = this.smoothSamples, w = grid.width * n, h = grid.height * n;
        const raw = new Float64Array(w * h);
        const wall = grid.heights.wall, ground = grid.heights.ground;
        const base = i => (wall && wall[i] ? ground[i] : grid.heights[i]);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) raw[y * w + x] = base(Math.floor(y / n) * grid.width + Math.floor(x / n));
        const sigma = this.smoothSigma * n, r = Math.ceil(sigma * 2.5);
        const kernel = [];
        let total = 0;
        for (let i = -r; i <= r; i++) { const k = Math.exp(-(i * i) / (2 * sigma * sigma)); kernel.push(k); total += k; }
        for (let i = 0; i < kernel.length; i++) kernel[i] /= total;
        const at = (data, x, y) => {
            if (grid.loopX) x = ((x % w) + w) % w;
            if (grid.loopY) y = ((y % h) + h) % h;
            return x < 0 || y < 0 || x >= w || y >= h ? 0 : data[y * w + x];
        };
        const pass = (src, dx, dy) => {
            const out = new Float64Array(w * h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                let v = 0;
                for (let i = -r; i <= r; i++) v += kernel[i + r] * at(src, x + dx * i, y + dy * i);
                out[y * w + x] = v;
            }
            return out;
        };
        grid._field = { owner: grid, n, w, h, data: pass(pass(raw, 1, 0), 0, 1), at };
        return grid._field;
    },

    // Height under a point (in tiles). Stepped: the tile's height. Smooth: the blurred field, bilinear
    // (walls stay sharp blocks on top of it).
    heightAt(grid, x, y, style) {
        if (style === 'stepped' || this.isWall(grid, Math.floor(x), Math.floor(y))) return this.tileHeight(grid, Math.floor(x), Math.floor(y));
        return this.fieldAt(grid, x, y);
    },

    isWall(grid, tx, ty) {
        return Boolean(grid.heights && grid.heights.wall) && this.wallMeta(grid, 'wall', tx, ty) > 0;
    },

    // The blurred ground under a point, walls left out.
    fieldAt(grid, x, y) {
        const f = this.smoothField(grid);
        const fx = x * f.n - 0.5, fy = y * f.n - 0.5;
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        const a = f.at(f.data, x0, y0), b = f.at(f.data, x0 + 1, y0), c = f.at(f.data, x0, y0 + 1), d = f.at(f.data, x0 + 1, y0 + 1);
        return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
    },

    // Mesh over cols x rows tiles from (tx0, ty0): vertices in map pixels with height h (tiles), texture
    // position u, v (map pixels) and shade 0-1; triangles as vertex index triples.
    buildMesh(grid, tx0, ty0, cols, rows, tw, th, style, light, detail) {
        const vertices = [], triangles = [];
        const L = light || this.light;
        const shadeOf = (nx, ny, nz) => {
            const n = Math.hypot(nx, ny, nz) || 1;
            return Math.max(0.35, Math.min(1, 0.55 + 0.45 * ((nx * L[0] + ny * L[1] + nz * L[2]) / n) / L[2]));
        };
        let onWall = 0;
        const add = (x, y, h, u, v, shade) => { vertices.push({ x, y, h, u, v, shade, wall: onWall }); return vertices.length - 1; };
        // A tile as a block: its top, and sides down to lower ground. low(dx, dy, ax, ay, bx, by, h) gives
        // the heights at the foot of a side ([at a, at b]), or null where there is no side.
        const block = (tx, ty, low) => {
            // Wall vertices draw from the ground without floor decals.
            onWall = this.isWall(grid, tx, ty) ? 1 : 0;
            const h = this.tileHeight(grid, tx, ty);
            const x0 = tx * tw, y0 = ty * th, x1 = x0 + tw, y1 = y0 + th;
            // A raised wall face shows the wall top's art on top (rows up the column).
            const up = this.wallMeta(grid, 'faceRows', tx, ty) * th;
            const a = add(x0, y0, h, x0, y0 - up, 1), b = add(x1, y0, h, x1, y0 - up, 1), c = add(x1, y1, h, x1, y1 - up, 1), d = add(x0, y1, h, x0, y1 - up, 1);
            triangles.push(a, b, c, a, c, d);
            const faceStart = this.wallMeta(grid, 'faceStart', tx, ty), faceLen = this.wallMeta(grid, 'faceLen', tx, ty);
            const faceX = this.wallMeta(grid, 'faceX', tx, ty);
            // The face art's columns: this tile's, or the wall column it borrows from (wrapped like the map).
            const fx0 = faceX > 0 ? x0 + (faceX - 1 - (((tx % grid.width) + grid.width) % grid.width)) * tw : x0, fx1 = fx0 + tw;
            const sides = [[0, -1, x0, y0, x1, y0], [1, 0, x1, y0, x1, y1], [0, 1, x1, y1, x0, y1], [-1, 0, x0, y1, x0, y0]];
            for (const [dx, dy, ax, ay, bx, by] of sides) {
                const foot = low(dx, dy, ax, ay, bx, by, h);
                if (!foot) continue;
                const [la, lb] = foot;
                const sh = shadeOf(dx, dy, 0) * 0.85;
                const face = dy === 1 ? this.wallMeta(grid, 'faceDown', tx, ty) : 0;
                let p, q, r, t;
                if (face > 0) {
                    // The front of an interior wall shows the wall face art drawn above it in 2D.
                    p = add(ax, ay, h, ax, ay - face * th, sh); q = add(bx, by, h, bx, by - face * th, sh);
                    r = add(bx, by, lb, bx, by, sh); t = add(ax, ay, la, ax, ay, sh);
                } else if (faceStart > 0 && h > 0) {
                    // The wall's other sides show the same face art, so turning the camera shows walls, not
                    // stretched wall tops.
                    const v0 = (faceStart - 1) * th, span = faceLen * th;
                    const vAt = z => v0 + Math.max(0, Math.min(1, (h - z) / h)) * span;
                    p = add(ax, ay, h, fx0, v0, sh); q = add(bx, by, h, fx1, v0, sh);
                    r = add(bx, by, lb, fx1, vAt(lb), sh); t = add(ax, ay, la, fx0, vAt(la), sh);
                } else {
                    // Elsewhere the side shows the tile squashed from its far edge down to this edge.
                    const fu = dx === 0 ? 0 : -dx * tw, fv = dy === 0 ? 0 : -dy * th;
                    p = add(ax, ay, h, ax + fu, ay + fv, sh); q = add(bx, by, h, bx + fu, by + fv, sh);
                    r = add(bx, by, lb, bx, by, sh); t = add(ax, ay, la, ax, ay, sh);
                }
                triangles.push(p, q, r, p, r, t);
            }
            onWall = 0;
        };
        // Stepped: every tile is a block, with sides down to lower neighbours.
        const stepLow = (dx, dy, ax, ay, bx, by, h, tx, ty) => {
            const low = this.tileHeight(grid, tx + dx, ty + dy);
            return low >= h ? null : [low, low];
        };
        if (style === 'stepped') {
            for (let ty = ty0; ty < ty0 + rows; ty++) {
                for (let tx = tx0; tx < tx0 + cols; tx++) block(tx, ty, (dx, dy, ax, ay, bx, by, h) => stepLow(dx, dy, ax, ay, bx, by, h, tx, ty));
            }
            return { vertices, triangles };
        }
        // Smooth: tiles where the height changes are split 4 x 4 (or detail x detail, for lower quality)
        // and follow the field; level tiles are one quad.
        const n = this.smoothSamples;
        const split = Math.max(1, Math.min(n, Math.round(Number(detail)) || n));
        // The blur reaches less than a tile, so a tile whose neighbours all share its height is level
        // at that height (open ground, the inside of a range or a forest): one quad is exact there.
        // Walls stand as sharp blocks on the blurred ground; the ground around them ignores them.
        const ground = (tx, ty) => (this.isWall(grid, tx, ty) ? this.wallMeta(grid, 'ground', tx, ty) : this.tileHeight(grid, tx, ty));
        const level = (tx, ty) => {
            const h = ground(tx, ty);
            for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (ground(tx + ox, ty + oy) !== h) return null;
            return h;
        };
        const shadeAt = (x, y) => {
            const e = 1 / n;
            const nx = (this.fieldAt(grid, x - e, y) - this.fieldAt(grid, x + e, y)) * th;
            const ny = (this.fieldAt(grid, x, y - e) - this.fieldAt(grid, x, y + e)) * tw;
            return shadeOf(nx, ny, 2 * e * tw);
        };
        const wallLow = (dx, dy, ax, ay, bx, by, h, tx, ty) => {
            if (this.isWall(grid, tx + dx, ty + dy)) return stepLow(dx, dy, ax, ay, bx, by, h, tx, ty);
            const la = Math.min(h, this.fieldAt(grid, ax / tw, ay / th)), lb = Math.min(h, this.fieldAt(grid, bx / tw, by / th));
            return la >= h && lb >= h ? null : [la, lb];
        };
        for (let ty = ty0; ty < ty0 + rows; ty++) {
            for (let tx = tx0; tx < tx0 + cols; tx++) {
                if (this.isWall(grid, tx, ty)) {
                    block(tx, ty, (dx, dy, ax, ay, bx, by, h) => wallLow(dx, dy, ax, ay, bx, by, h, tx, ty));
                    continue;
                }
                const flatAt = level(tx, ty), sloped = flatAt === null, steps = sloped ? split : 1;
                const base = vertices.length;
                for (let j = 0; j <= steps; j++) {
                    for (let i = 0; i <= steps; i++) {
                        const x = tx + i / steps, y = ty + j / steps;
                        const h = sloped ? this.fieldAt(grid, x, y) : flatAt;
                        add(x * tw, y * th, h, x * tw, y * th, sloped ? shadeAt(x, y) : 1);
                    }
                }
                for (let j = 0; j < steps; j++) {
                    for (let i = 0; i < steps; i++) {
                        const a = base + j * (steps + 1) + i, b = a + 1, c = a + steps + 2, d = a + steps + 1;
                        triangles.push(a, b, c, a, c, d);
                    }
                }
            }
        }
        return { vertices, triangles };
    },

    // Where something standing at (x, y) with a base halfWidth wide (all in tiles) touches the ground:
    // the lowest and highest ground under its base (a base on its tile's bottom edge belongs to that
    // tile), whether it touches an automatic mountain, and whether it's level ground a doodad may stand
    // on (never a mountain; raised ground you made is fine where it's level).
    groundUnder(grid, x, y, halfWidth, style) {
        const fy = y - 0.02;
        const w = Math.max(0, halfWidth || 0) * 0.8;
        let min = Infinity, max = -Infinity, mountain = false;
        const mask = grid.heights && grid.heights.mountains;
        for (const [dx, dy] of [[0, 0], [-w, 0], [w, 0], [0, -0.2], [-w, -0.2], [w, -0.2]]) {
            const h = this.heightAt(grid, x + dx, fy + dy, style);
            if (h < min) min = h;
            if (h > max) max = h;
            if (mask) {
                let tx = Math.floor(x + dx), ty = Math.floor(fy + dy);
                if (grid.loopX) tx = ((tx % grid.width) + grid.width) % grid.width;
                if (grid.loopY) ty = ((ty % grid.height) + grid.height) % grid.height;
                if (tx >= 0 && ty >= 0 && tx < grid.width && ty < grid.height && mask[ty * grid.width + tx]) mountain = true;
            }
        }
        return { min, max, mountain, level: !mountain && max - min <= this.levelTolerance + 1e-9 };
    },

    // Where a character stands: on smooth ground the highest point under it (a bump beside its feet
    // doesn't swallow it); on stepped ground its own tile.
    footHeight(grid, x, y, halfWidth, style) {
        if (style === 'stepped') return this.heightAt(grid, x, y - 0.02, style);
        return this.groundUnder(grid, x, y, halfWidth, style).max;
    },

    // Buffers for sorting up to n triangles each frame without allocating.
    sortBuffers(n) {
        const depth = new Float32Array(n);
        return { depth, bits: new Uint32Array(depth.buffer), keys: new Uint32Array(n), keys2: new Uint32Array(n),
            idx: new Uint32Array(n), idx2: new Uint32Array(n), counts: new Uint32Array(256) };
    },

    // The first `count` entries of buf.depth, far to near: returns buf.idx holding their positions.
    // A radix sort on the float bits (which keep their order for positive numbers), so a frame with tens
    // of thousands of triangles needs no comparisons and no garbage.
    sortFarToNear(buf, count) {
        let keys = buf.keys, keys2 = buf.keys2, idx = buf.idx, idx2 = buf.idx2, swap;
        const c = buf.counts, bits = buf.bits;
        for (let i = 0; i < count; i++) {
            keys[i] = 0xffffffff - bits[i];
            idx[i] = i;
        }
        for (let shift = 0; shift < 32; shift += 8) {
            c.fill(0);
            for (let i = 0; i < count; i++) c[(keys[i] >>> shift) & 255]++;
            for (let b = 0, sum = 0; b < 256; b++) { const t = c[b]; c[b] = sum; sum += t; }
            for (let i = 0; i < count; i++) {
                const k = keys[i], p = c[(k >>> shift) & 255]++;
                keys2[p] = k;
                idx2[p] = idx[i];
            }
            swap = keys; keys = keys2; keys2 = swap;
            swap = idx; idx = idx2; idx2 = swap;
        }
        return idx;
    },

    canStep(fromHeight, toHeight, climb) {
        return Math.abs(toHeight - fromHeight) <= climb + 1e-9;
    },

    // How a character gets from one tile to the next with Steep steps on: 'walk', 'drop' (off a ledge,
    // with Walk off ledges), 'hop' (up a step no higher than Hop up), or 'blocked'.
    stepKind(fromHeight, toHeight, s) {
        if (this.canStep(fromHeight, toHeight, s.climb)) return 'walk';
        const rise = toHeight - fromHeight;
        if (rise < 0 && s.drop) return 'drop';
        if (rise > 0 && s.hop > 0 && rise <= s.hop + 1e-9) return 'hop';
        return 'blocked';
    },

    brushModes: [
        { value: 'raise', label: 'Raise' },
        { value: 'lower', label: 'Lower' },
        { value: 'flatten', label: 'Flatten (to where the stroke started)' },
        { value: 'set', label: 'Set height' },
        { value: 'erase', label: 'Erase (back to automatic)' }
    ],

    brushFalloffs: [
        { value: 'soft', label: 'Soft (gentle slopes)' },
        { value: 'hard', label: 'Hard (the whole circle the same)' }
    ],

    // How strongly a dab changes a tile d tiles from its centre: softly less towards the edge, or (hard)
    // the same across the whole circle.
    brushWeight(d, r, falloff) {
        return falloff === 'hard' ? 1 : 1 - d / (r + 1);
    },

    // The tiles one dab around (cx, cy) touches, with how strongly (1 at the centre): what the brush
    // preview shows before painting. Uses the same circle and falloff as applyBrush.
    brushFootprint(cx, cy, radius, falloff) {
        const r = Math.max(0, Math.round(Number(radius) || 0));
        const out = [];
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const d = Math.hypot(dx, dy);
                if (d > r + 0.25) continue;
                out.push({ x: cx + dx, y: cy + dy, weight: this.brushWeight(d, r, falloff) });
            }
        }
        return out;
    },

    brushColors: { raise: 0x22c55e, lower: 0xf97316, flatten: 0x38bdf8, set: 0xa855f7, erase: 0xef4444 },

    // One dab of the height brush around tile (cx, cy). Returns the new painted heights.
    // opts: { mode, amount (tiles), radius (tiles), value (set), target (flatten), falloff ('soft' | 'hard') }
    applyBrush(paint, grid, cx, cy, opts) {
        const out = Object.assign({}, paint);
        const r = Math.max(0, Math.round(Number(opts.radius) || 0));
        const amount = Number(opts.amount) || 0;
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                const d = Math.hypot(dx, dy);
                if (d > r + 0.25) continue;
                let x = cx + dx, y = cy + dy;
                if (grid.loopX) x = ((x % grid.width) + grid.width) % grid.width;
                if (grid.loopY) y = ((y % grid.height) + grid.height) % grid.height;
                if (x < 0 || y < 0 || x >= grid.width || y >= grid.height) continue;
                const key = x + ',' + y;
                if (opts.mode === 'erase') { delete out[key]; continue; }
                const falloff = this.brushWeight(d, r, opts.falloff);
                const current = out[key] !== undefined ? out[key] : this.tileHeight(grid, x, y);
                let next = current;
                if (opts.mode === 'raise') next = current + amount * falloff;
                else if (opts.mode === 'lower') next = current - amount * falloff;
                else if (opts.mode === 'flatten') next = current + ((Number(opts.target) || 0) - current) * Math.min(1, Math.max(0.1, amount) * falloff);
                else if (opts.mode === 'set') next = Number(opts.value) || 0;
                out[key] = Math.round(Math.max(-20, Math.min(20, next)) * 100) / 100;
            }
        }
        return out;
    }
};

// Tileset objects standing up in the 3D view. Trees, signs and lamps drawn with B-E tiles normally lie
// flat on the ground; these settings lift them into upright billboards, without changing the map.
// 'star': objects with a star (above characters) tile, like tree tops, plus the tile under them (the
// trunk). 'all': every B-E tile, grouped the same way. Objects drawn entirely over roofs and walls (A3
// and A4: eaves, chimneys, windows, paintings) stay flat, and so does anything in the map's keep-flat region.
DocsDoodads.StandTiles = {
    modes: [
        { value: 'off', label: 'Lie flat' },
        { value: 'star', label: 'Objects with ☆ tiles (tree tops and the tile under them)' },
        { value: 'all', label: 'Every B–E tile' }
    ],

    isObjectTile(tileId) {
        return tileId > 0 && tileId < 1024;
    },

    // Groups of tiles that stand as one billboard: { x, y, w, h } in tiles (x, y top left; the foot is
    // the bottom edge), and cells: [{ dx, dy, tiles: [tileId by layer] }]. Also mask: which (x, y, z)
    // tiles are lifted off the ground. map: { width, height, data }; flags: the tileset's flags.
    groups(map, flags, mode, options) {
        const w = map.width, h = map.height, data = map.data || [];
        const mask = new Uint8Array(w * h * 4);
        if (mode !== 'star' && mode !== 'all') return { list: [], mask };
        const at = (x, y, z) => data[(z * h + y) * w + x] || 0;
        const flatRegion = (options && Number(options.flatRegion)) || 0;
        const T = DocsDoodads.Terrain;
        const inFlatRegion = (x, y) => flatRegion > 0 && at(x, y, 5) === flatRegion;
        const onBuilding = (x, y) => Boolean(T.wallKind(at(x, y, 0)) || T.wallKind(at(x, y, 1)));
        const objects = (x, y) => {
            if (inFlatRegion(x, y)) return [];
            const out = [];
            for (let z = 0; z < 4; z++) { const id = at(x, y, z); if (this.isObjectTile(id)) out.push(z); }
            return out;
        };
        const star = (x, y) => objects(x, y).some(z => ((flags && flags[at(x, y, z)]) || 0) & 0x10);
        // Column pieces: a run of star cells plus the object cell under it (the base), or in 'all' mode
        // any other object cell on its own.
        const used = new Uint8Array(w * h);
        const columns = [];
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                if (used[y * w + x] || !objects(x, y).length) continue;
                if (star(x, y)) {
                    let bottom = y;
                    while (bottom + 1 < h && objects(x, bottom + 1).length && star(x, bottom + 1)) bottom++;
                    if (bottom + 1 < h && objects(x, bottom + 1).length) bottom++;
                    let building = true;
                    for (let yy = y; yy <= bottom; yy++) { used[yy * w + x] = 1; if (!onBuilding(x, yy)) building = false; }
                    // All of it on a roof or wall (eaves, a chimney): it stays flat. A tree in front of a house
                    // (its trunk on the ground) still stands.
                    if (!building) columns.push({ x, y, h: bottom - y + 1 });
                } else if (mode === 'all') {
                    used[y * w + x] = 1;
                    if (!onBuilding(x, y)) columns.push({ x, y, h: 1 });
                }
            }
        }
        // Side-by-side columns of the same height make one wide billboard (a 2-tile-wide tree).
        const byKey = new Map();
        for (const c of columns) byKey.set(c.x + ',' + c.y + ',' + c.h, c);
        const list = [];
        const taken = new Set();
        for (const c of columns) {
            const key = c.x + ',' + c.y + ',' + c.h;
            if (taken.has(key)) continue;
            let width = 1;
            while (byKey.has((c.x + width) + ',' + c.y + ',' + c.h) && !taken.has((c.x + width) + ',' + c.y + ',' + c.h)) width++;
            const group = { x: c.x, y: c.y, w: width, h: c.h, cells: [] };
            for (let dx = 0; dx < width; dx++) {
                taken.add((c.x + dx) + ',' + c.y + ',' + c.h);
                for (let dy = 0; dy < c.h; dy++) {
                    const zs = objects(c.x + dx, c.y + dy);
                    for (const z of zs) mask[((z * h) + c.y + dy) * w + c.x + dx] = 1;
                    group.cells.push({ dx, dy, tiles: zs.map(z => at(c.x + dx, c.y + dy, z)) });
                }
            }
            group.key = group.w + 'x' + group.h + ':' + group.cells.map(cell => cell.tiles.join('.')).join('|');
            list.push(group);
        }
        return { list, mask };
    },

    // Where a B-E tile's picture is in its tileset image (MZ's own layout).
    source(tileId, tw, th) {
        return {
            set: 5 + Math.floor(tileId / 256),
            x: ((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * tw,
            y: (Math.floor((tileId % 256) / 8) % 16) * th
        };
    }
};

// Snow that settles in the 3D view: a cover (0 bare, 1 white) that builds while it snows, melts when it
// stops, and stays at least `winterCover` in a season named Winter. The ground whitens (water stays
// clear) and standing objects get white tops.
DocsDoodads.SnowCover = {
    fillSeconds: 60,   // heavy snow (power 9) covers everything in about a minute
    meltSeconds: 120,
    winterCover: 0.75,

    step(cover, dt, weatherType, power, winter) {
        let c = Math.max(0, Math.min(1, Number(cover) || 0));
        if (weatherType === 'snow' && power > 0) c += dt * (Math.min(9, power) / 9) / this.fillSeconds;
        else c -= dt / this.meltSeconds;
        c = Math.max(0, Math.min(1, c));
        return winter ? Math.max(c, this.winterCover) : c;
    },

    isWinter(seasonIndex, names) {
        return seasonIndex >= 0 && Array.isArray(names) && /winter/i.test(String(names[seasonIndex] || ''));
    },

    // How white each pixel of a standing object's picture gets: the top of every opaque run down a
    // column (what faces the sky), fading over `depth` pixels. alpha: the picture's alpha channel
    // (width x height, 0-255); cellH: the height of one frame, so each frame of a sheet gets its own tops.
    capAlpha(alpha, width, height, cellH, depth) {
        const out = new Uint8ClampedArray(width * height);
        const d = Math.max(1, depth);
        for (let x = 0; x < width; x++) {
            let run = -1;
            for (let y = 0; y < height; y++) {
                if (cellH > 0 && y % cellH === 0) run = -1;
                const a = alpha[y * width + x];
                if (a < 40) { run = -1; continue; }
                run = run < 0 ? 0 : run + 1;
                const k = Math.max(0, 1 - run / d);
                out[y * width + x] = Math.round(a * k);
            }
        }
        return out;
    }
};

// Rippling water in the 3D view: a sum of travelling waves bends what shows through water tiles and
// catches the light, and things moving through water leave spreading wake rings.
DocsDoodads.Water3D = {
    // k: 2π / wavelength (map pixels); a: the slope each wave adds; w: radians per second.
    waves: [
        { dx: 0.8, dy: 0.6, k: 2 * Math.PI / 42, a: 0.45, w: 1.6 },
        { dx: -0.6, dy: 0.8, k: 2 * Math.PI / 27, a: 0.33, w: 2.3 },
        { dx: 0.2, dy: -0.979796, k: 2 * Math.PI / 66, a: 0.14, w: 1.1 },
        { dx: 0.951057, dy: -0.309017, k: 2 * Math.PI / 17, a: 0.08, w: 3.1 }
    ],
    wakeSpeed: 60,       // pixels per second
    wakeLife: 2.6,       // seconds
    wakeLength: 14,      // ring wavelength (pixels)
    wakeWidth: 13,       // ring thickness (pixels)
    wakeSlope: 0.9,
    wakeFoam: 0.5,
    wakeEvery: 12,       // frames between wakes while moving
    maxWakes: 16,

    mask(width, height, isWater) {
        const out = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                out[i] = isWater(x, y) ? 255 : 0;
                out[i + 3] = 255;
            }
        }
        return out;
    },

    height(x, y, t, speed) {
        let h = 0;
        for (const w of this.waves) h += (w.a / w.k) * Math.sin(w.k * (w.dx * x + w.dy * y) + w.w * t * speed);
        return h;
    },

    gradient(x, y, t, speed) {
        let gx = 0, gy = 0;
        for (const w of this.waves) {
            const c = w.a * Math.cos(w.k * (w.dx * x + w.dy * y) + w.w * t * speed);
            gx += c * w.dx;
            gy += c * w.dy;
        }
        return { x: gx, y: gy };
    },

    // The shortest step between two positions on a loop of the given size (0: no loop).
    unwrap(delta, size) {
        return size > 0 ? delta - size * Math.round(delta / size) : delta;
    },

    // Wake gradients on looping maps measure to the nearest copy of each wake.
    wrapOffset(d, size) {
        return size > 0 ? d - size * Math.floor(d / size + 0.5) : d;
    },

    prune(list, now) {
        return (list || []).filter(w => now - w.born <= this.wakeLife);
    },

    addWake(list, x, y, now, strength) {
        const next = this.prune(list, now);
        next.push({ x, y, born: now, strength: strength === undefined ? 1 : strength });
        return next.slice(-this.maxWakes);
    },

    // The shader's wake math (glsl below) in JS, so the tests can check the rings it draws.
    wakeGradient(list, x, y, now, loop) {
        let gx = 0, gy = 0;
        for (const w of list || []) {
            const age = now - w.born;
            if (age < 0 || age > this.wakeLife || !(w.strength > 0)) continue;
            const dx = this.wrapOffset(x - w.x, loop ? loop.width : 0), dy = this.wrapOffset(y - w.y, loop ? loop.height : 0), d = Math.hypot(dx, dy);
            if (d < 0.001) continue;
            const front = d - age * this.wakeSpeed;
            const env = Math.exp(-(front / this.wakeWidth) * (front / this.wakeWidth)) * (1 - age / this.wakeLife) * w.strength;
            const g = this.wakeSlope * env * Math.cos(front * 2 * Math.PI / this.wakeLength);
            gx += g * dx / d;
            gy += g * dy / d;
        }
        return { x: gx, y: gy };
    },

    // x, y, age, strength for each of 16 slots (strength 0 = empty), for the shader.
    pack(list, now) {
        const out = new Float32Array(this.maxWakes * 4);
        (list || []).slice(-this.maxWakes).forEach((w, i) => {
            out[i * 4] = w.x;
            out[i * 4 + 1] = w.y;
            out[i * 4 + 2] = now - w.born;
            out[i * 4 + 3] = w.strength;
        });
        return out;
    },

    // info: { onWater, moving, tile, frame }. A wake on entering a new water tile, then every few frames.
    shouldWake(state, info) {
        if (!info.onWater || !info.moving) return false;
        if (state.tile !== info.tile || state.frame === undefined || info.frame - state.frame >= this.wakeEvery) {
            state.tile = info.tile;
            state.frame = info.frame;
            return true;
        }
        return false;
    }
};

// Shared by the flat ground and terrain shaders. Map pixels mp = flat pixels + uOrigin.
DocsDoodads.Water3D.glsl = (() => {
    const W = DocsDoodads.Water3D;
    const f = n => n.toFixed(6);
    const waves = W.waves.map(w => `    g += ${f(w.a)} * vec2(${f(w.dx)}, ${f(w.dy)}) * cos(${f(w.k)} * dot(vec2(${f(w.dx)}, ${f(w.dy)}), mp) + ${f(w.w)} * uWaterTime);`).join('\n');
    return [
        'uniform vec4 uWater;',          // on, strength, shine, light level
        'uniform float uWaterTime;',     // seconds x speed
        'uniform sampler2D uWaterMask;',
        'uniform vec2 uMapTiles;',
        'uniform vec2 uTile;',
        'uniform vec2 uOrigin;',
        'uniform vec2 uLoop;',
        'uniform vec3 uLightDir;',
        `uniform vec4 uWakes[${W.maxWakes}];`,
        'float docsWaterMask(vec2 mp) {',
        '    vec2 t = mp / uTile;',
        '    if (uLoop.x > 0.5) t.x = mod(t.x, uMapTiles.x);',
        '    if (uLoop.y > 0.5) t.y = mod(t.y, uMapTiles.y);',
        '    if (t.x < 0.0 || t.y < 0.0 || t.x > uMapTiles.x || t.y > uMapTiles.y) return 0.0;',
        '    return texture2D(uWaterMask, t / uMapTiles).r;',
        '}',
        'vec2 docsWaterGrad(vec2 mp, out float foam) {',
        '    vec2 g = vec2(0.0);',
        '    foam = 0.0;',
        waves,
        `    for (int i = 0; i < ${W.maxWakes}; i++) {`,
        '        vec4 w = uWakes[i];',
        `        if (w.w <= 0.0 || w.z < 0.0 || w.z > ${f(W.wakeLife)}) continue;`,
        '        vec2 dv = mp - w.xy;',
        // Looping maps: the nearest copy of the wake.
        '        if (uLoop.x > 0.5) dv.x -= uMapTiles.x * uTile.x * floor(dv.x / (uMapTiles.x * uTile.x) + 0.5);',
        '        if (uLoop.y > 0.5) dv.y -= uMapTiles.y * uTile.y * floor(dv.y / (uMapTiles.y * uTile.y) + 0.5);',
        '        float d = length(dv);',
        '        if (d < 0.001) continue;',
        `        float front = d - w.z * ${f(W.wakeSpeed)};`,
        `        float env = exp(-(front / ${f(W.wakeWidth)}) * (front / ${f(W.wakeWidth)})) * (1.0 - w.z / ${f(W.wakeLife)}) * w.w;`,
        `        float crest = cos(front * ${f(2 * Math.PI / W.wakeLength)});`,
        `        g += ${f(W.wakeSlope)} * env * crest * dv / d;`,
        `        foam += ${f(W.wakeFoam)} * env * max(crest, 0.0);`,
        '    }',
        '    return g;',
        '}'
    ].join('\n');
})();

// The lines each ground shader runs for a flat point p (pixels) and texture position uv:
// bends uv through the water, and sets docsWaterShade (slope light) and docsWaterSpec (glints).
DocsDoodads.Water3D.applyGlsl = [
    '    float docsWaterShade = 1.0;',
    '    float docsWaterSpec = 0.0;',
    '    if (uWater.x > 0.5) {',
    '        vec2 mp = p + uOrigin;',
    // Only well inside water tiles: their shore border is drawn inside them, and sand stays dry.
    '        float wet = smoothstep(0.55, 0.95, docsWaterMask(mp));',
    '        if (wet > 0.01) {',
    '            float foam;',
    '            vec2 g = docsWaterGrad(mp, foam) * uWater.y;',
    '            uv += g * 3.0 * wet / uGround;',
    '            vec3 N = normalize(vec3(-g * 0.6, 1.0));',
    '            vec3 V = normalize(uCam - vec3(p, 0.0));',
    '            vec3 H = normalize(uLightDir + V);',
    '            docsWaterSpec = (pow(max(dot(N, H), 0.0), 140.0) * uWater.z + foam * uWater.y) * uWater.w * wet;',
    '            docsWaterShade = 1.0 + dot(-g, uLightDir.xy) * 0.12 * wet;',
    '        }',
    '    }'
].join('\n');

// Drifting cloud shadows and low fog on the ground, from smooth noise over map pixels.
// uClouds: (strength, size in pixels, drift x, drift y); uMist: (amount, height in tiles, drift x, drift y).
// docsLow: how far down in a valley the point is (1 on flat ground). Both fade with the light (uWater.w).
DocsDoodads.Perspective.skyGlsl = [
    'float docsHash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }',
    'float docsNoise(vec2 q) {',
    '    vec2 i = floor(q), f = fract(q);',
    '    vec2 u = f * f * (3.0 - 2.0 * f);',
    '    return mix(mix(docsHash(i), docsHash(i + vec2(1.0, 0.0)), u.x), mix(docsHash(i + vec2(0.0, 1.0)), docsHash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',
    'float docsFbm(vec2 q) { return (docsNoise(q) * 0.5 + docsNoise(q * 2.03 + 3.1) * 0.25 + docsNoise(q * 4.01 + 7.7) * 0.125) / 0.875; }'
].join('\n');

DocsDoodads.Perspective.skyApplyGlsl = [
    '    if (uClouds.x > 0.0 || uMist.x > 0.0) {',
    '        vec2 wp = p + uOrigin;',
    '        float daylight = smoothstep(0.45, 0.9, uWater.w);',
    '        if (uClouds.x > 0.0) {',
    '            float cloud = smoothstep(0.42, 0.62, docsFbm(wp / uClouds.y + uClouds.zw));',
    '            rgb *= 1.0 - uClouds.x * 0.5 * cloud * daylight;',
    '        }',
    '        if (uMist.x > 0.0) {',
    '            float mist = uMist.x * docsLow * smoothstep(0.3, 0.8, docsFbm(wp / (uTile.x * 6.0) + uMist.zw));',
    '            rgb = mix(rgb, vec3(0.82, 0.86, 0.9) * max(0.22, uWater.w), mist * 0.75);',
    '        }',
    '    }'
].join('\n');

// Snow cover on the ground: dry ground whitens by uSnow, keeping the light (darker at night).
DocsDoodads.SnowCover.glsl = [
    '    if (uSnow > 0.0) {',
    '        float dry = 1.0 - smoothstep(0.3, 0.7, docsWaterMask(p + uOrigin));',
    '        float lum = dot(rgb, vec3(0.299, 0.587, 0.114));',
    '        vec3 snow = vec3(0.9, 0.94, 1.0) * min(1.0, lum * 1.6 + 0.12);',
    '        rgb = mix(rgb, snow, uSnow * dry);',
    '    }'
].join('\n');

// Weather in the 3D view: MZ's rain, storm and snow as particles falling through the space around the
// camera (map pixels, z = height above the ground in pixels).
DocsDoodads.Weather3D = {
    maxParticles: 2000,
    maxSplashes: 160,
    // Drops are drawn in this many bands by distance, each sorted in with the trees and characters.
    depthBands: 8,
    splashLife: 0.35,

    // The look of each kind of weather at MZ's power (1-9), times the map's density.
    params(type, power, density) {
        power = Math.max(0, Math.min(9, Number(power) || 0));
        if (!power || !['rain', 'storm', 'snow'].includes(type)) return null;
        const d = Math.max(0, Number(density === undefined ? 1 : density) || 0);
        const base = {
            rain: { kind: 'streak', per: 90, speed: 900, length: 30, wind: 0.12, color: 0xd8e6ff, alpha: 0.7, size: 2 },
            storm: { kind: 'streak', per: 130, speed: 1300, length: 44, wind: 0.45, color: 0xd8e6ff, alpha: 0.75, size: 2.2 },
            snow: { kind: 'flake', per: 80, speed: 70, length: 0, wind: 0.08, color: 0xffffff, alpha: 0.9, size: 3.5, sway: 22 }
        }[type];
        return Object.assign({ type, power, sway: 0 }, base, {
            count: Math.min(this.maxParticles, Math.round(base.per * power * d)),
            dim: Math.floor(power * 6) / 255
        });
    },

    spawn(box, rng, top) {
        return {
            x: box.x + (rng() * 2 - 1) * box.radius,
            y: box.y + (rng() * 2 - 1) * box.radius,
            z: top ? box.height * (0.85 + rng() * 0.15) : rng() * box.height,
            seed: rng()
        };
    },

    // Grows or shrinks the set of particles as the weather's power changes.
    resize(particles, count, box, rng) {
        const out = particles.slice(0, count);
        while (out.length < count) out.push(this.spawn(box, rng, false));
        return out;
    },

    // Moves particles on by dt seconds. ground(x, y) is the ground's height (pixels) under a map point.
    // Returns the moved particles and the splashes made where rain hit the ground.
    step(particles, dt, params, box, rng, now, ground) {
        const splashes = [];
        const wrap = (v, centre) => {
            const span = box.radius * 2;
            return v - span * Math.round((v - centre) / span);
        };
        const out = particles.map(p => {
            let { x, y, z } = p;
            const fall = params.speed * (0.85 + 0.3 * p.seed) * dt;
            z -= fall;
            x += params.wind * fall;
            if (params.sway) x += Math.cos(now * 1.7 + p.seed * 20) * params.sway * 1.7 * dt;
            x = wrap(x, box.x);
            y = wrap(y, box.y);
            const g = ground(x, y);
            if (z <= g) {
                if (params.kind === 'streak') splashes.push({ x, y, z: g, born: now });
                const fresh = this.spawn(box, rng, true);
                return Object.assign(fresh, { z: g + fresh.z });
            }
            return { x, y, z, seed: p.seed };
        });
        return { particles: out, splashes };
    },

    // Which depth band (0 nearest) a drop at `depth` goes in, and the depth a band is sorted at (its
    // near edge, so whatever stands behind any of its drops is drawn before them).
    band(depth, near, far) {
        const span = Math.max(1e-6, far - near);
        return Math.max(0, Math.min(this.depthBands - 1, Math.floor(((depth - near) / span) * this.depthBands)));
    },

    bandDepth(index, near, far) {
        return near + Math.max(1e-6, far - near) * index / this.depthBands;
    },

    pruneSplashes(list, now) {
        return list.filter(s => now - s.born <= this.splashLife).slice(-this.maxSplashes);
    }
};

// Day and night in the 3D view: sky colours, the sun and moon (on the path the shadows use), stars,
// and the light direction for hills and water. Azimuth: degrees clockwise from north; elevation: degrees.
DocsDoodads.Sky3D = {
    palettes: {
        day: { top: 0x3d7fd6, horizon: 0xa9d3ff },
        twilight: { top: 0x2e3a78, horizon: 0xff9466 },
        night: { top: 0x04060f, horizon: 0x16204a }
    },

    mix(a, b, t) {
        t = Math.max(0, Math.min(1, t));
        const ch = (c, s) => (c >> s) & 255;
        const m = s => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
        return (m(16) << 16) | (m(8) << 8) | m(0);
    },

    smooth(e0, e1, x) {
        const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
        return t * t * (3 - 2 * t);
    },

    at(minutes) {
        const h = DocsDoodads.TimeOfDay.wrap(minutes) / 60;
        const day = h >= 6 && h < 18;
        const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12;
        const arc = Math.sin(Math.PI * t);
        // The shadows' direction is where the light comes from, turned round.
        const azimuth = (DocsDoodads.Sun.at(minutes).angle + 180) % 360;
        const sun = { azimuth, elevation: day ? 5 + 60 * arc : -5 - 60 * arc };
        const moon = { azimuth, elevation: day ? -5 - 45 * arc : 5 + 45 * arc };
        // Night from about 19:00 to 05:00, twilight around 6 and 18.
        const night = 1 - this.smooth(5, 7, h) + this.smooth(17, 19.5, h);
        const bell = (x, c) => Math.exp(-((x - c) / 1.1) * ((x - c) / 1.1));
        const twilight = Math.max(bell(h, 6.2), bell(h, 18));
        const nightW = Math.max(0, Math.min(1, night));
        const pal = this.palettes;
        let top = this.mix(pal.day.top, pal.night.top, nightW), horizon = this.mix(pal.day.horizon, pal.night.horizon, nightW);
        top = this.mix(top, pal.twilight.top, twilight * 0.7);
        horizon = this.mix(horizon, pal.twilight.horizon, twilight);
        const body = day ? sun : moon;
        const el = Math.max(4, body.elevation) * Math.PI / 180, az = body.azimuth * Math.PI / 180;
        const dir = [Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el)];
        const lowSun = 1 - Math.min(1, Math.max(0, sun.elevation) / 35);
        const color = day ? this.mix(0xffffff, 0xffc27a, lowSun) : 0x9fb4ff;
        return {
            top, horizon, sun, moon, stars: nightW < 0.02 ? 0 : nightW > 0.98 ? 1 : nightW,
            light: { dir, color, intensity: day ? 1 : 0.35, from: day ? 'sun' : 'moon' }
        };
    },

    // Screen position of a direction in the sky (from the camera), or null behind the camera.
    skyPoint(cam, azimuth, elevation) {
        const az = azimuth * Math.PI / 180, el = elevation * Math.PI / 180;
        const far = cam.dist * 1000;
        return DocsDoodads.Perspective.project(cam,
            cam.C.x + Math.sin(az) * Math.cos(el) * far, cam.C.y - Math.cos(az) * Math.cos(el) * far, cam.C.z + Math.sin(el) * far);
    },

    lightKey(dir) {
        return dir.map(v => Math.round(v * 20)).join(',');
    }
};

// A frame clipped to the image. Images replaced by smaller ones would otherwise make PIXI throw
// "frame does not fit inside the base Texture" and stop the game.
DocsDoodads.safeFrame = function(rect, width, height) {
    const x = Math.max(0, Math.floor(rect.x || 0)), y = Math.max(0, Math.floor(rect.y || 0));
    if (x >= width || y >= height) return { x: 0, y: 0, w: width, h: height };
    return { x, y, w: Math.max(1, Math.min(rect.w || width, width - x)), h: Math.max(1, Math.min(rect.h || height, height - y)) };
};

