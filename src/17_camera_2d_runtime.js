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
    return Boolean(s.path || s.follow || s.free === 'event' || Number(c.smooth) > 0 || ((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).cameraBounds || []).length);
};

if (typeof Game_Player !== 'undefined') {
    $.Game_Player_updateScroll_cam2d = Game_Player.prototype.updateScroll;
    Game_Player.prototype.updateScroll = function(lastScrolledX, lastScrolledY) {
        const C = DocsDoodads.Camera2D;
        if (DocsDoodads.Perspective.active() || !C.isBusy() || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) {
            C._external = false;
            return $.Game_Player_updateScroll_cam2d.call(this, lastScrolledX, lastScrolledY);
        }
        const s = C.state();
        // Scroll Map, a script's setDisplayPos or 2D Camera Follow > Nothing: the camera is left where they
        // put it (until the player takes a step, or until a follow command for Nothing).
        if (!s.path) {
            if (s.free === 'event') return;
            if ($gameMap.isScrolling() || C._external) {
                C._external = false;
                s.free = { x: this.x, y: this.y };
                return;
            }
            if (s.free) {
                if (s.free.x === this.x && s.free.y === this.y) return;
                s.free = null;
            }
        }
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

if (typeof Game_Map !== 'undefined' && typeof Game_Player !== 'undefined') {
    // A display position set from outside (not the camera centring on the player) frees the camera.
    $.Game_Map_setDisplayPos_cam2d = Game_Map.prototype.setDisplayPos;
    Game_Map.prototype.setDisplayPos = function(x, y) {
        $.Game_Map_setDisplayPos_cam2d.call(this, x, y);
        if (!DocsDoodads.Camera2D._centering && this._docsCam2d) DocsDoodads.Camera2D._external = true;
    };
    $.Game_Player_center_cam2d = Game_Player.prototype.center;
    Game_Player.prototype.center = function(x, y) {
        DocsDoodads.Camera2D._centering = true;
        try {
            return $.Game_Player_center_cam2d.call(this, x, y);
        } finally {
            DocsDoodads.Camera2D._centering = false;
        }
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
    s.free = null;
    const then = String(args.then || 'return');
    s.path = { points: then === 'return' ? points.concat([here]) : points, frames: Math.max(1, Number(args.frames) || 60), ease: String(args.ease || 'smooth'), frame: 0, then };
    // Coming back to the player: the last leg returns to where the camera was, then follows again.
    return this.pathFrames(s.path);
};

// Zoom to a point on a flat map (a tile, or a character), with MZ's own screen zoom: { x, y } are screen
// pixels of the point, scale 1 goes back. The zoom stays until zoomed back (the player's own zoom, World >
// Zoom, takes over again only once it is back at 1).
DocsDoodads.Camera2D.zoomTo = function(point, scale, frames) {
    if (typeof $gameScreen === 'undefined' || !$gameScreen || !point) return false;
    $gameScreen.startZoom(point.x, point.y, Math.max(0.25, Math.min(8, Number(scale) || 1)), Math.max(1, Math.round(Number(frames) || 1)));
    return true;
};

// The screen point of a tile's centre, or of a character's middle.
DocsDoodads.Camera2D.pointOf = function(target) {
    if (typeof $gameMap === 'undefined' || !$gameMap || !target) return null;
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    if (typeof target.screenX === 'function') return { x: target.screenX(), y: target.screenY() - th / 2 };
    return { x: ($gameMap.adjustX(Number(target.x) || 0) + 0.5) * tw, y: ($gameMap.adjustY(Number(target.y) || 0) + 0.5) * th };
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    // Zoom to Point: the screen zooms in on a tile or a character (scale 1 goes back), over frames.
    PluginManager.registerCommand(pluginName, 'zoomToPoint', function(args) {
        const C = DocsDoodads.Camera2D;
        const target = String(args.target || 'tile');
        const who = target === 'tile' ? { x: Number(args.x) || 0, y: Number(args.y) || 0 } : DocsDoodads.characterFor(this, target, args.eventId);
        const frames = Math.max(1, Number(args.frames) || 60);
        if (C.zoomTo(C.pointOf(who), Number(args.scale) || 1, frames) && String(args.wait) === 'true' && this && typeof this.wait === 'function') this.wait(frames);
    });
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
        s.free = target === 'free' ? 'event' : null;
        s.follow = target === 'event' ? Math.max(0, Number(args.eventId) || 0) : target === 'this' && this && this._eventId ? this._eventId : 0;
    });
}
