//==========================================================
// SECTION 5I: PERSPECTIVE (3D) MODE: FIRST PERSON
//==========================================================
(function(P) {
    'use strict';

    const yawByDirection = { 8: 0, 9: 45, 6: 90, 3: 135, 2: 180, 1: 225, 4: 270, 7: 315 };

    P.facingYaw = function(direction) {
        return yawByDirection[Number(direction)] === undefined ? 0 : yawByDirection[Number(direction)];
    };

    P.directionForYaw = function(yaw) {
        const q = ((Math.round((((Number(yaw) || 0) % 360) + 360) % 360 / 90) % 4) + 4) % 4;
        return [8, 6, 2, 4][q];
    };

    // A loop-aware flat-space point at the player's feet, and an eye above the terrain there. Runtime
    // may supply the exact render-texture target so camera and ground cannot differ by a wrapped tile.
    P.firstPerson = function(settings, player, options) {
        const s = this.normalize(settings);
        const o = options || {};
        const map = o.map || (typeof $gameMap !== 'undefined' ? $gameMap : null);
        const tw = Number(o.tileWidth) || (map && map.tileWidth ? map.tileWidth() : 48);
        const th = Number(o.tileHeight) || (map && map.tileHeight ? map.tileHeight() : 48);
        const rx = Number(player && (player._realX !== undefined ? player._realX : player.x)) || 0;
        const ry = Number(player && (player._realY !== undefined ? player._realY : player.y)) || 0;
        const target = o.target || {
            x: (map && map.adjustX ? map.adjustX(rx) : rx) * tw + tw / 2,
            y: (map && map.adjustY ? map.adjustY(ry) : ry) * th + th
        };
        const ground = Number(o.groundHeight) || 0;
        const direction = player && typeof player.direction === 'function' ? player.direction() : player && player._direction;
        const yaw = Number.isFinite(Number(o.yaw)) ? ((Number(o.yaw) % 360) + 360) % 360 : this.facingYaw(direction);
        return {
            target: { x: target.x, y: target.y },
            eye: { x: target.x, y: target.y, z: ground + s.eyeHeight * th },
            pitch: s.firstPitch,
            yaw,
            fov: s.firstFov,
            zoom: s.zoom
        };
    };

    P.nearFadeAlpha = function(distance, range) {
        const r = Math.max(0, Number(range) || 0);
        if (!r) return 1;
        return Math.max(0, Math.min(1, (Number(distance) || 0) / r));
    };

    P.hideFirstPersonPlayer = function(sprite, settings, player) {
        return Boolean(settings && settings.mode === 'first' && sprite && sprite._character && sprite._character === player);
    };

    P.firstInput = function(rawDirection, yaw) {
        const raw = Number(rawDirection) || 0;
        if (raw === 4) return { direction: 0, turn: -90, backstep: false };
        if (raw === 6) return { direction: 0, turn: 90, backstep: false };
        const forward = this.directionForYaw(yaw);
        if (raw === 8) return { direction: forward, turn: 0, backstep: false };
        if (raw === 2) return { direction: 10 - forward, turn: 0, backstep: true };
        return { direction: 0, turn: 0, backstep: false };
    };

    // Opening the workspace gets the familiar orbit view; this is a copy, so closing returns to the
    // saved first-person camera without changing the map or making an undo step.
    P.forDisplay = function(settings, editing) {
        if (!settings || !editing || settings.mode !== 'first') return settings;
        return Object.assign({}, settings, { mode: 'orbit' });
    };
})(DocsDoodads.Perspective);
