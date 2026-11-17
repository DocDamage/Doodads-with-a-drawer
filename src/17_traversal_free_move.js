//==========================================================
// SECTION 7Q: MOVEMENT OFF THE GRID (7.3.3), THE PLAYER
//==========================================================
// With World → Movement → Off the grid on, the player walks by pixels: their box slides along painted walls,
// doodad bodies, MZ's impassable tiles and tile edges (Game_CharacterBase.isMapPassable, so 3D heights and
// swimming keep their own rules) and the boxes of events that stand like characters. The player's x and y
// stay whole tiles (the tile under the box), so events, regions, encounters, terrain tags and other
// plugins see the same tile as before. Reaching a new tile is a step: the party walks, floor events start
// and encounters count. Followers walk the player's trail. Events, vehicles, forced move routes, jumps and
// traversal (flying, swimming, climbing, ice) stay on the grid; the player snaps to the grid while they run.
(function() {
    if (typeof Game_Player === 'undefined' || typeof Game_CharacterBase === 'undefined') return;
    const F = DocsDoodads.FreeMove;
    const X = () => DocsDoodads.Traversal;
    const settings = () => F.settings(DocsDoodads.World.settings());

    Game_Player.prototype.docsFreeOn = function() {
        if (!settings().enabled) return false;
        if (this.isInVehicle && this.isInVehicle()) return false;
        if ((this.isJumping && this.isJumping()) || (this.isMoveRouteForcing && this.isMoveRouteForcing())) return false;
        if (this.isTransferring && this.isTransferring()) return false;
        const T = X();
        if (T && (this._docsSlideDir || (T.isFlying && T.isFlying(this)) || (T.isSwimming && T.isSwimming(this)) ||
            (T.can && T.can('ice') && T.isIce && T.isIce(this.x, this.y)) || (T.can && T.can('climb') && T.isClimb && T.isClimb(this.x, this.y)))) return false;
        return true;
    };

    Game_Player.prototype.docsFreeBox = function() {
        const s = settings(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return F.box(this._realX, this._realY, tw, th, s.boxW, s.boxH);
    };

    // Other characters as boxes at their feet: events that stand like characters, and vehicles here.
    Game_Player.prototype.docsFreeOthers = function() {
        const s = settings(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), out = [];
        for (const ev of $gameMap.events ? $gameMap.events() : []) {
            if (!ev || ev._erased || (ev.isThrough && ev.isThrough()) || !(ev.isNormalPriority && ev.isNormalPriority())) continue;
            out.push({ who: ev, box: F.box(ev._realX, ev._realY, tw, th, s.boxW, s.boxH) });
        }
        for (const vehicle of $gameMap.vehicles ? $gameMap.vehicles() : []) {
            if (!vehicle || vehicle._mapId !== $gameMap.mapId() || (vehicle.isAirship && vehicle.isAirship())) continue;
            out.push({ who: vehicle, box: F.box(vehicle._realX, vehicle._realY, tw, th, s.boxW, s.boxH) });
        }
        return out;
    };

    // A tile nobody can enter from any side is solid for a box overlapping it.
    Game_Player.prototype.docsFreeSolidTile = function(tx, ty) {
        const cache = this._docsFreeSolid;
        const key = tx + ',' + ty;
        if (cache && cache.has(key)) return cache.get(key);
        const loopX = $gameMap.isLoopHorizontal(), loopY = $gameMap.isLoopVertical();
        let solid;
        if ((!loopX && (tx < 0 || tx >= $gameMap.width())) || (!loopY && (ty < 0 || ty >= $gameMap.height()))) solid = true;
        else {
            const x = $gameMap.roundX(tx), y = $gameMap.roundY(ty);
            solid = [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]].every(([ox, oy, d]) => !this.isMapPassable($gameMap.roundX(x + ox), $gameMap.roundY(y + oy), d));
        }
        if (cache) cache.set(key, solid);
        return solid;
    };

    Game_Player.prototype.docsFreeBlocked = function(rect, from) {
        if ((this.isThrough && this.isThrough()) || (this.isDebugThrough && this.isDebugThrough())) return false;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const t of F.tilesUnder(rect, tw, th)) if (this.docsFreeSolidTile(t.x, t.y)) return true;
        const a = F.tileOf(from, tw, th), b = F.tileOf(rect, tw, th);
        if ((a.x !== b.x || a.y !== b.y) && F.crossBlocked((x, y, d) => this.isMapPassable($gameMap.roundX(x), $gameMap.roundY(y), d), a, b)) return true;
        const W = DocsDoodads.Walls, grid = W.get($gameMap.mapId());
        if (grid && W.blocksRect(grid, rect.x, rect.y, rect.w, rect.h)) return true;
        const C = DocsDoodads.Collision, doodads = DocsDoodads.doodads();
        if (doodads && doodads.length) {
            const g = C.grid(doodads, tw, th), seen = new Set(), settingsHere = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
            for (const t of F.tilesUnder(rect, tw, th)) {
                for (const d of g.tiles.get(C.tileKey(t.x, t.y)) || []) {
                    if (seen.has(d)) continue;
                    seen.add(d);
                    const body = C.cachedBody(d).body;
                    if (!body || !F.overlaps(body, rect) || (d.collision && !C.stops(d, this, this._direction))) continue;
                    if (DocsDoodads.Layers.visibleInGame(d, settingsHere) && DocsDoodads.Appearance.isVisible(d, {}) && DocsDoodads.States.blocks(d)) return true;
                }
            }
        }
        if (!(X() && X().isFlying && X().isFlying(this))) {
            for (const other of this._docsFreeOthersNow || []) {
                if (F.overlaps(other.box, rect) && !F.overlaps(other.box, from)) { this._docsFreeHit = other.who; return true; }
            }
        }
        return false;
    };

    // dir8 0 means no input. Returns the step's result (and moves the player).
    Game_Player.prototype.docsFreeStep = function(dir8, vector) {
        this._docsFreeMoving = false;
        this._docsFreeHit = null;
        if (!dir8 && !vector) return null;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const v = vector || F.vector(dir8), speed = this.distancePerFrame() * tw;
        this._docsFreeSolid = new Map();
        this._docsFreeOthersNow = this.docsFreeOthers();
        const box = this.docsFreeBox();
        const result = F.step(box, v.x * speed, v.y * speed, (rect, from) => this.docsFreeBlocked(rect, from));
        this._docsFreeSolid = null;
        this._docsFreeOthersNow = null;
        const moved = { x: result.x, y: result.y, w: box.w, h: box.h };
        const real = F.realOf(moved, tw, th);
        // Looping maps: as MZ does at the seam, the real position stays within half a tile of the whole tile.
        const wrap = (value, size) => { const v = ((value % size) + size) % size; return v >= size - 0.5 ? v - size : v; };
        if ($gameMap.isLoopHorizontal()) real.x = wrap(real.x, $gameMap.width());
        if ($gameMap.isLoopVertical()) real.y = wrap(real.y, $gameMap.height());
        if (dir8) this.setDirection(F.facing(dir8, this._direction));
        else if (vector) this.setDirection(Math.abs(vector.x) > Math.abs(vector.y) ? (vector.x > 0 ? 6 : 4) : (vector.y > 0 ? 2 : 8));
        this._docsFreeMoving = result.moved > 0.01;
        if (this._docsFreeMoving) {
            this._realX = real.x; this._realY = real.y;
            this.docsFreeTrail();
            const tile = F.tileOf(this.docsFreeBox(), tw, th);
            const tx = $gameMap.roundX(tile.x), ty = $gameMap.roundY(tile.y);
            if (tx !== this._x || ty !== this._y) { this._x = tx; this._y = ty; this.docsFreeArrive(); }
        }
        // Pushing into an event that starts on touch starts it, as walking into it on the grid does.
        const hit = this._docsFreeHit;
        if (hit && typeof Game_Event !== 'undefined' && hit instanceof Game_Event && !$gameMap.isEventRunning() && hit.isTriggerIn && hit.isTriggerIn([1, 2]) &&
            (!this.canStartLocalEvents || this.canStartLocalEvents())) hit.start();
        return result;
    };

    // A new tile is a step: the party walks, floor events here start, encounters count.
    Game_Player.prototype.docsFreeArrive = function() {
        if (this.increaseSteps) this.increaseSteps();
        if (typeof $gameParty !== 'undefined' && $gameParty && $gameParty.onPlayerWalk) $gameParty.onPlayerWalk();
        if (this.checkEventTriggerHere && !$gameMap.isEventRunning()) this.checkEventTriggerHere([1, 2]);
        if ($gameMap.setupStartingEvent && $gameMap.setupStartingEvent()) return;
        if (this.updateEncounterCount) this.updateEncounterCount();
    };

    Game_Player.prototype.docsFreeTrail = function() {
        const trail = this._docsFreeTrailPoints = this._docsFreeTrailPoints || [];
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(last.x - this._realX, last.y - this._realY) >= 0.05) trail.push({ x: this._realX, y: this._realY, d: this._direction });
        const keep = 40 + 24 * ((this._followers && this._followers.data ? this._followers.data().length : 0) + 1);
        if (trail.length > keep) trail.splice(0, trail.length - keep);
    };

    // Followers stand a tile apart along the trail, facing the way the player went there.
    Game_Player.prototype.docsFreeFollowers = function() {
        const trail = this._docsFreeTrailPoints;
        const list = this._followers && this._followers.data ? this._followers.data() : [];
        if (!trail || !trail.length) return;
        list.forEach((follower, i) => {
            const at = F.alongTrail(trail, i + 1);
            if (!at) return;
            const moving = Math.hypot(follower._realX - at.x, follower._realY - at.y) > 0.001;
            follower._realX = at.x; follower._realY = at.y;
            follower._x = $gameMap.roundX(Math.round(at.x)); follower._y = $gameMap.roundY(Math.round(at.y));
            if (at.d) follower.setDirection(at.d);
            follower._docsFreeMoving = moving;
        });
    };

    // Touch or mouse destination: the path on tiles, walked freely toward each next tile's middle.
    Game_Player.prototype.docsFreeDestination = function() {
        if (typeof $gameTemp === 'undefined' || !$gameTemp || !$gameTemp.isDestinationValid || !$gameTemp.isDestinationValid()) return null;
        const gx = $gameTemp.destinationX(), gy = $gameTemp.destinationY();
        const at = { x: this._realX, y: this._realY };
        if (this.x === gx && this.y === gy) {
            const dx = gx - at.x, dy = gy - at.y, distance = Math.hypot(dx, dy);
            if (distance < 0.05) { $gameTemp.clearDestination(); return null; }
            return { x: dx / distance, y: dy / distance };
        }
        const d = this.findDirectionTo ? this.findDirectionTo(gx, gy) : 0;
        if (!d) { $gameTemp.clearDestination(); return null; }
        const nx = $gameMap.roundXWithDirection(this.x, d), ny = $gameMap.roundYWithDirection(this.y, d);
        let dx = nx - at.x, dy = ny - at.y;
        if ($gameMap.isLoopHorizontal() && Math.abs(dx) > $gameMap.width() / 2) dx -= Math.sign(dx) * $gameMap.width();
        if ($gameMap.isLoopVertical() && Math.abs(dy) > $gameMap.height() / 2) dy -= Math.sign(dy) * $gameMap.height();
        const distance = Math.hypot(dx, dy) || 1;
        return { x: dx / distance, y: dy / distance };
    };

    const moveByInput = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        if (!this.docsFreeOn()) return moveByInput.apply(this, arguments);
        this._docsFreeMoving = false;
        if (this.canMove && !this.canMove()) return;
        const dir8 = typeof Input !== 'undefined' ? Number(Input.dir8) || 0 : 0;
        if (dir8 && typeof $gameTemp !== 'undefined' && $gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
        if (dir8) this.docsFreeStep(dir8);
        else {
            const toward = this.docsFreeDestination();
            if (toward) this.docsFreeStep(0, toward);
        }
    };

    const isMoving = Game_CharacterBase.prototype.isMoving;
    Game_Player.prototype.isMoving = function() {
        return this.docsFreeOn() ? Boolean(this._docsFreeMoving) : isMoving.call(this);
    };
    const updateMove = Game_Player.prototype.updateMove;
    if (updateMove) {
        Game_Player.prototype.updateMove = function() {
            if (this.docsFreeOn()) { if (this.refreshBushDepth) this.refreshBushDepth(); return; }
            return updateMove.apply(this, arguments);
        };
    }
    // Dashing follows the button while walking freely (MZ only changes it while standing still).
    const updateDashing = Game_Player.prototype.updateDashing;
    if (updateDashing) {
        Game_Player.prototype.updateDashing = function() {
            if (!this.docsFreeOn()) return updateDashing.apply(this, arguments);
            this._dashing = this.canMove() && this.isDashButtonPressed() && !$gameMap.isDashDisabled();
        };
    }
    // Steps and floor events are counted per tile reached, so standing still only checks the action button.
    const updateNonmoving = Game_Player.prototype.updateNonmoving;
    if (updateNonmoving) {
        Game_Player.prototype.updateNonmoving = function(wasMoving, sceneActive) {
            if (!this.docsFreeOn()) return updateNonmoving.apply(this, arguments);
            if ($gameMap.isEventRunning()) return;
            if (sceneActive && this.triggerAction()) return;
            if (!wasMoving && $gameTemp && $gameTemp.isDestinationValid && !$gameTemp.isDestinationValid()) $gameTemp.clearDestination();
        };
    }
    // The action button looks in front of the box, not of the tile.
    const there = Game_Player.prototype.checkEventTriggerThere;
    if (there) {
        Game_Player.prototype.checkEventTriggerThere = function(triggers) {
            if (!this.docsFreeOn() || !this.canStartLocalEvents()) return there.apply(this, arguments);
            const front = this.docsFreeFront();
            this.startMapEvent(front.x, front.y, triggers, true);
            if (!$gameMap.isAnyEventStarting() && $gameMap.isCounter(front.x, front.y)) {
                this.startMapEvent($gameMap.roundXWithDirection(front.x, this._direction), $gameMap.roundYWithDirection(front.y, this._direction), triggers, true);
            }
        };
    }
    Game_Player.prototype.docsFreeFront = function() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), box = this.docsFreeBox();
        // One tile on from the middle of the box: the box is low in its tile, so half a tile up would stay in it.
        const v = F.vector(this._direction), reach = Math.abs(v.x) * tw + Math.abs(v.y) * th;
        const cx = box.x + box.w / 2 + v.x * reach, cy = box.y + box.h / 2 + v.y * reach;
        return { x: $gameMap.roundX(Math.floor(cx / tw)), y: $gameMap.roundY(Math.floor(cy / th)) };
    };

    const update = Game_Player.prototype.update;
    Game_Player.prototype.update = function() {
        const result = update.apply(this, arguments);
        if (this.docsFreeOn()) this.docsFreeFollowers();
        else this._docsFreeTrailPoints = null;
        return result;
    };

    if (typeof Game_Follower !== 'undefined') {
        const followerMoving = Game_Follower.prototype.isMoving || Game_CharacterBase.prototype.isMoving;
        Game_Follower.prototype.isMoving = function() {
            return $gamePlayer && $gamePlayer.docsFreeOn && $gamePlayer.docsFreeOn() && $gamePlayer._docsFreeTrailPoints ? Boolean(this._docsFreeMoving) : followerMoving.call(this);
        };
        const followerUpdateMove = Game_Follower.prototype.updateMove;
        if (followerUpdateMove) {
            Game_Follower.prototype.updateMove = function() {
                if ($gamePlayer && $gamePlayer.docsFreeOn && $gamePlayer.docsFreeOn() && $gamePlayer._docsFreeTrailPoints) return;
                return followerUpdateMove.apply(this, arguments);
            };
        }
    }
})();
