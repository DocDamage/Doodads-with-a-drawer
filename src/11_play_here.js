//==========================================================
// SECTION 5G3: PLAY FROM HERE
//==========================================================
// The rules behind the editor's Play From Here (44_workspace_play_here.js): whether the player can stand on a
// tile, the nearest tile they can, and how the editor's previewed time and season read in its question.
// env: { width, height, passable(x, y, d), blocked(x, y) }; gameEnv() makes one from the running map.
DocsDoodads.PlayHere = {
    // Why the player can't start on a tile, or '' when they can.
    why(x, y, env) {
        if (!(x >= 0 && y >= 0 && x < env.width && y < env.height)) return 'it is off the map';
        if (![2, 4, 6, 8].some(d => env.passable(x, y, d))) return "the player can't walk onto or off it (a wall, water or a cliff)";
        if (env.blocked(x, y)) return "a doodad's collision covers it";
        return '';
    },

    // The nearest tile the player can start on, within radius tiles: { x, y }, or null. Nearest first, then
    // the one above, then the one to the left, so the same map always gives the same tile.
    nearest(x, y, env, radius = 12) {
        const spots = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if ((dx || dy) && dx * dx + dy * dy <= radius * radius) spots.push({ x: x + dx, y: y + dy, d: dx * dx + dy * dy });
            }
        }
        spots.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
        const hit = spots.find(s => !this.why(s.x, s.y, env));
        return hit ? { x: hit.x, y: hit.y } : null;
    },

    // "18:30, Winter", "18:30", "Winter" or '' for what the editor is previewing (null: not previewed).
    startText(minutes, seasonName) {
        const parts = [];
        if (minutes !== null && minutes !== undefined && isFinite(minutes)) {
            const m = ((Math.round(Number(minutes)) % 1440) + 1440) % 1440;
            parts.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
        }
        if (seasonName) parts.push(String(seasonName));
        return parts.join(', ');
    },

    // The running map, as why() and nearest() read it.
    gameEnv() {
        return {
            width: $gameMap.width(),
            height: $gameMap.height(),
            passable: (x, y, d) => $gameMap.isPassable(x, y, d),
            blocked: (x, y) => DocsDoodads.Collision.blocksTile(x, y, false, $gamePlayer)
        };
    }
};
