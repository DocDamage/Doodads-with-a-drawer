//==========================================================
// SECTION 23C: 2D CAMERA (RUNTIME AND PLUGIN COMMANDS)
//==========================================================
// Game_Player.updateScroll does the camera on flat maps. With no smoothing, no region bounds, no path
// and no follow target, MZ's own scrolling runs unchanged.
DocsDoodads.Camera2D.state = function() {
    const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
    return map ? (map._docsCam2d = map._docsCam2d || { path: null, follow: 0 }) : null;
};

// The region box the camera keeps to, for where the target stands (cached per map data and region).
DocsDoodads.Camera2D.boundsFor = function(x, y) {
    if (typeof $gameMap === 'undefined' || !$gameMap || typeof $dataMap === 'undefined' || !$dataMap) return null;
    const list = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).cameraBounds;
    if (!Array.isArray(list) || !list.length) return null;
    const region = $gameMap.regionId(Math.round(x), Math.round(y));
    if (!list.map(Number).includes(region)) return null;
    const cache = this._boxes = this._boxes && this._boxes.data === $dataMap.data ? this._boxes : { data: $dataMap.data };
    if (!(region in cache)) cache[region] = this.regionBox($dataMap.data, $dataMap.width, $dataMap.height, region);
    return cache[region];
};

DocsDoodads.Camera2D.isBusy = function() {
    const s = this.state();
    if (!s) return false;
    const c = this.settings();
    return Boolean(s.path || s.follow || Number(c.smooth) > 0 || ((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).cameraBounds || []).length);
};

if (typeof Game_Player !== 'undefined') {
    $.Game_Player_updateScroll_cam2d = Game_Player.prototype.updateScroll;
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
        const C = DocsDoodads.Camera2D;
        if (DocsDoodads.Perspective.active() || !C.isBusy() || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) {
            return $.Game_Player_updateScroll_cam2d.call(this, lastScrolledX, lastScrolledY);
        }
        const s = C.state();
        const cfg = C.settings();
        const sw = $gameMap.screenTileX(), sh = $gameMap.screenTileY();
        let cx, cy, smooth = cfg.smooth;
        if (s.path) {
            const at = C.pathAt(s.path, ++s.path.frame);
            cx = at.x; cy = at.y; smooth = 0;
            if (at.done) {
                const then = s.path.then;
                s.path = null;
                if (then === 'stay') s.hold = { x: cx, y: cy };
            }
        } else if (s.hold) {
            cx = s.hold.x; cy = s.hold.y; smooth = 0;
        } else {
            const target = s.follow > 0 ? $gameMap.event(s.follow) : this;
            const who = target || this;
            cx = who._realX;
            cy = who._realY;
            // Looking a little ahead of where the player faces.
            const ahead = Number(cfg.lookAhead) || 0;
            if (ahead && who === this && this.isMoving()) {
                const d = this.direction();
                cx += d === 6 ? ahead : d === 4 ? -ahead : 0;
                cy += d === 2 ? ahead : d === 8 ? -ahead : 0;
            }
        }
        let want = { x: cx - (sw - 1) / 2, y: cy - (sh - 1) / 2 };
        const box = s.path || s.hold ? null : C.boundsFor(cx, cy);
        if (box) want = C.clamp(box, want.x, want.y, sw, sh);
        const move = C.step({ x: $gameMap.displayX(), y: $gameMap.displayY() }, want, smooth,
            $gameMap.isLoopHorizontal() ? $gameMap.width() : 0, $gameMap.isLoopVertical() ? $gameMap.height() : 0);
        if (move.dx > 0) $gameMap.scrollRight(move.dx); else if (move.dx < 0) $gameMap.scrollLeft(-move.dx);
        if (move.dy > 0) $gameMap.scrollDown(move.dy); else if (move.dy < 0) $gameMap.scrollUp(-move.dy);
    };
}

if (typeof Game_Map !== 'undefined') {
    // A new map starts with the camera on the player again.
    $.Game_Map_setup_cam2d = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        $.Game_Map_setup_cam2d.call(this, mapId);
        this._docsCam2d = null;
    };
}

DocsDoodads.Camera2D.startPath = function(args) {
    const s = this.state();
    if (!s || typeof $gameMap === 'undefined') return 0;
    const sw = $gameMap.screenTileX(), sh = $gameMap.screenTileY();
    const here = { x: $gameMap.displayX() + (sw - 1) / 2, y: $gameMap.displayY() + (sh - 1) / 2 };
    const points = [here].concat(this.parsePoints(args.points));
    if (points.length < 2) return 0;
    s.hold = null;
    const then = String(args.then || 'return');
    s.path = { points: then === 'return' ? points.concat([here]) : points, frames: Math.max(1, Number(args.frames) || 60), ease: String(args.ease || 'smooth'), frame: 0, then };
    // Coming back to the player: the last leg returns to where the camera was, then follows again.
    return this.pathFrames(s.path);
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'cameraPath2d', function(args) {
        const frames = DocsDoodads.Camera2D.startPath(args);
        if (frames && String(args.wait) !== 'false' && this && typeof this.wait === 'function') this.wait(frames);
    });
    PluginManager.registerCommand(pluginName, 'cameraFollow2d', function(args) {
        const s = DocsDoodads.Camera2D.state();
        if (!s) return;
        const target = String(args.target || 'player');
        s.hold = null;
        s.path = null;
        s.follow = target === 'event' ? Math.max(0, Number(args.eventId) || 0) : target === 'this' && this && this._eventId ? this._eventId : 0;
    });
}
