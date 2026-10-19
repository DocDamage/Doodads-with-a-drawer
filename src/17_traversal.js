//==========================================================
// SECTION 7C: TRAVERSAL (JUMP, GLIDE, SWIM, DIVE, FLY, CLIMB, ICE)
//==========================================================
// Ways for the player to get around (World panel > Traversal). Each ability is on when its setting is on,
// its switch (if any) is on, and Set Traversal hasn't turned it off for this game; Set Traversal can also
// turn on one that's off in the settings (the player learns to swim). Keys: C jumps (and dives in deep
// water), F takes off and lands; gamepad buttons and on-screen buttons (touch screens) do the same.
DocsDoodads.Traversal = {
    abilities: ['jump', 'glide', 'swim', 'dive', 'fly', 'climb', 'ice'],

    settings() {
        return DocsDoodads.World.settings().traversal;
    },

    // "5, 6 7" -> [5, 6, 7]
    ids(text) {
        return String(text || '').split(/[\s,;]+/).map(n => parseInt(n, 10)).filter(n => n > 0);
    },

    can(name) {
        const s = this.settings()[name] || {};
        const over = typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem._docsTraversal ? $gameSystem._docsTraversal[name] : undefined;
        const on = over !== undefined ? over : Boolean(s.enabled);
        if (!on) return false;
        const sw = Number(s.switchId) || 0;
        return !sw || (typeof $gameSwitches !== 'undefined' && $gameSwitches && $gameSwitches.value(sw));
    },

    // Set Traversal: true, false, or null (back to the settings).
    setAbility(name, state) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem || !this.abilities.includes(name)) return;
        $gameSystem._docsTraversal = Object.assign({}, $gameSystem._docsTraversal);
        if (state === null || state === undefined) delete $gameSystem._docsTraversal[name];
        else $gameSystem._docsTraversal[name] = Boolean(state);
    },

    isPartyMember(ch) {
        return typeof $gamePlayer !== 'undefined' && (ch === $gamePlayer || (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower));
    },

    inRegionOrTag(x, y, s) {
        const regions = this.ids(s && s.regions), tags = this.ids(s && s.tags);
        return (regions.length && regions.includes($gameMap.regionId(x, y))) || (tags.length && tags.includes($gameMap.terrainTag(x, y)));
    },

    isWater(x, y) {
        if (!$gameMap.isValid(x, y) || typeof Tilemap === 'undefined' || !Tilemap.isWaterTile) return false;
        return Tilemap.isWaterTile($gameMap.tileId(x, y, 0)) || Tilemap.isWaterTile($gameMap.tileId(x, y, 1));
    },

    // Water nobody could walk on (sea, deep water): where swimming starts.
    isDeepWater(x, y) {
        return this.isWater(x, y) && !$gameMap.isPassable(x, y, 2) && !$gameMap.isPassable(x, y, 8);
    },

    isClimb(x, y) {
        return $gameMap.isValid(x, y) && Boolean(this.inRegionOrTag(x, y, this.settings().climb));
    },

    isIce(x, y) {
        return $gameMap.isValid(x, y) && Boolean(this.inRegionOrTag(x, y, this.settings().ice));
    },

    blockedBy(name, x, y) {
        const region = Number((this.settings()[name] || {}).noRegion) || 0;
        return region > 0 && $gameMap.regionId(x, y) === region;
    },

    // ---- State of the party ----
    isSwimming(ch) {
        if (!ch || !this.isPartyMember(ch) || this.isFlying(ch)) return false;
        if ($gamePlayer.isInVehicle && $gamePlayer.isInVehicle()) return false;
        return this.isDeepWater(ch.x, ch.y);
    },

    altitude() {
        return typeof $gamePlayer !== 'undefined' && $gamePlayer ? $gamePlayer._docsFlyAlt || 0 : 0;
    },

    // How far up a character is drawn by flying (its shadow and reflection stay on the ground).
    liftOf(ch) {
        return this.isPartyMember(ch) ? this.altitude() : 0;
    },

    isFlying(ch) {
        return Boolean(ch && this.isPartyMember(ch) && $gamePlayer._docsFlying);
    },

    // Characters that terrain steps (drops, hops, blocking) don't apply to: flying, or on a climb.
    bypassesTerrain(ch) {
        return this.isFlying(ch) || (this.isPartyMember(ch) && this.isClimb(ch.x, ch.y));
    },

    // ---- Passability for the player ----
    reverse(d) {
        return 10 - d;
    },

    // Whether the player may move from (x, y) in direction d by one of the abilities (the map's own
    // passability having said no).
    passable(x, y, d) {
        const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        if (!$gameMap.isValid(x2, y2)) return false;
        if (this.isFlying($gamePlayer)) return !this.blockedBy('fly', x2, y2);
        // Climbing: up, down and along climbable tiles, and off them onto ground that takes you.
        if (this.can('climb')) {
            const here = this.isClimb(x, y), there = this.isClimb(x2, y2);
            if (there && (here || d === 2 || d === 8)) return true;
            if (here && !there && $gameMap.isPassable(x2, y2, this.reverse(d))) return true;
        }
        // Swimming: into and through water, and out onto land that takes you.
        if (this.can('swim') && !($gamePlayer.isInVehicle && $gamePlayer.isInVehicle())) {
            const here = this.isWater(x, y), there = this.isWater(x2, y2);
            if (there && !this.blockedBy('swim', x2, y2)) return true;
            if (here && !there && $gameMap.isPassable(x2, y2, this.reverse(d))) return true;
        }
        return false;
    },

    // Where a jump in direction d may land, n tiles ahead.
    canLand(ch, tx, ty, d, fromHeight) {
        if (!$gameMap.isValid(tx, ty) || this.blockedBy('jump', tx, ty)) return false;
        const water = this.isWater(tx, ty);
        if (!$gameMap.isPassable(tx, ty, this.reverse(d)) && !(water && this.can('swim'))) return false;
        if (ch.isCollidedWithCharacters(tx, ty) || DocsDoodads.Collision.blocksTile(tx, ty)) return false;
        const T = DocsDoodads.Terrain, grid = T.grid ? T.grid() : null;
        if (grid) {
            const up = Math.max(0, Number(this.settings().jump.up) || 0);
            if (T.tileHeight(grid, tx, ty) - fromHeight > up + 1e-9) return false;
        }
        return true;
    },

    // The jump the player would make now: { dx, dy } tiles (0, 0 = on the spot). Gaps up to Distance are
    // cleared; from high ground a glide carries further (Glide: tiles per tile of height).
    plan(ch) {
        const s = this.settings();
        const d = ch.direction();
        const dx = d === 4 ? -1 : d === 6 ? 1 : 0, dy = d === 8 ? -1 : d === 2 ? 1 : 0;
        const T = DocsDoodads.Terrain, grid = T.grid ? T.grid() : null;
        const height = (x, y) => (grid ? T.tileHeight(grid, x, y) : 0);
        const here = height(ch.x, ch.y);
        const reach = Math.max(1, Math.min(8, Number(s.jump.distance) || 1));
        const glide = this.can('glide') ? Math.max(0, Number(s.glide.perHeight) || 0) : 0;
        const longest = glide ? Math.min(12, reach + Math.max(0, Number(s.glide.max) || 0)) : reach;
        const up = Math.max(0, Number(s.jump.up) || 0);
        for (let n = 1; n <= longest; n++) {
            const tx = $gameMap.roundX(ch.x + dx * n), ty = $gameMap.roundY(ch.y + dy * n);
            if (!$gameMap.isValid(tx, ty) || this.blockedBy('jump', tx, ty)) break;
            // Ground higher than the jump goes up is a wall: nothing beyond it is reached.
            if (height(tx, ty) - here > up + 1e-9) break;
            if (n > reach && (here - height(tx, ty)) * glide < n - reach) continue;
            if (this.canLand(ch, tx, ty, d, here)) return { dx: dx * n, dy: dy * n, glide: n > reach };
        }
        return { dx: 0, dy: 0, glide: false };
    },

    playSe(name, volume) {
        if (name && typeof AudioManager !== 'undefined') AudioManager.playSe({ name: String(name), volume: volume || 90, pitch: 100, pan: 0 });
    },

    // ---- Actions ----
    jump() {
        const p = $gamePlayer;
        if (p.isMoving() || p.isJumping() || this.isFlying(p) || (p.isInVehicle && p.isInVehicle())) return false;
        // In deep water (or under it) the jump key dives or surfaces, where the map has a map for that.
        if (this.isSwimming(p) || Number((DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).surfaceMap) > 0) {
            if (this.dive()) return true;
            if (this.isSwimming(p)) return false;
        }
        if (!this.can('jump')) return false;
        const j = this.plan(p);
        p.jump(j.dx, j.dy);
        this.playSe(this.settings().jump.sound);
        return true;
    },

    // Dive from deep water to this map's underwater map, or surface from an underwater map.
    dive() {
        const p = $gamePlayer;
        if (!this.can('dive')) return false;
        const ms = DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {};
        const down = Number(ms.diveMap) || 0, up = Number(ms.surfaceMap) || 0;
        const to = this.isSwimming(p) && down > 0 ? down : up > 0 ? up : 0;
        if (!to) return false;
        this.playSe(this.settings().dive.sound);
        p.reserveTransfer(to, p.x, p.y, p.direction(), 0);
        return true;
    },

    takeOff() {
        const p = $gamePlayer;
        if (!this.can('fly') || p._docsFlying || p.isMoving() || p.isJumping() || (p.isInVehicle && p.isInVehicle())) return false;
        p._docsFlying = true;
        this.playSe(this.settings().fly.sound);
        return true;
    },

    // Lands where the player could stand (and not on an event or in deep water without swimming).
    canLandHere() {
        const p = $gamePlayer, x = p.x, y = p.y;
        const walk = [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d));
        if (!walk && !(this.isWater(x, y) && this.can('swim'))) return false;
        if ($gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) return false;
        return !DocsDoodads.Collision.blocksTile(x, y);
    },

    land() {
        const p = $gamePlayer;
        if (!p._docsFlying || p.isMoving()) return false;
        if (!this.canLandHere()) {
            if (typeof SoundManager !== 'undefined') SoundManager.playBuzzer();
            return false;
        }
        p._docsFlying = false;
        this.playSe(this.settings().fly.landSound);
        return true;
    },

    toggleFly() {
        return $gamePlayer._docsFlying ? this.land() : this.takeOff();
    },

    // ---- Gamepad and on-screen buttons ----
    // Buttons MZ leaves free on the map (the triggers, stick presses and Back).
    padButtons: [
        { value: -1, label: 'None' }, { value: 7, label: 'Right trigger (RT / R2)' }, { value: 6, label: 'Left trigger (LT / L2)' },
        { value: 10, label: 'Left stick press' }, { value: 11, label: 'Right stick press' }, { value: 8, label: 'Back / Select' }
    ],

    buttonModes: [
        { value: 'touch', label: 'On touch screens' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }
    ],

    controls() {
        return Object.assign({ padJump: 7, padFly: 6, buttons: 'touch', size: 72 }, this.settings().controls);
    },

    // Puts jump and fly on the chosen gamepad buttons, giving back whatever a button did before.
    syncPad() {
        if (typeof Input === 'undefined' || !Input.gamepadMapper) return;
        const c = this.controls();
        const want = {};
        const jump = Number(c.padJump), fly = Number(c.padFly);
        if (jump >= 0) want[jump] = 'docsJump';
        if (fly >= 0 && fly !== jump) want[fly] = 'docsFly';
        const sig = JSON.stringify(want);
        if (sig === this._padSig) return;
        this._padSig = sig;
        const mine = this._padMine = this._padMine || {};
        for (const b of Object.keys(mine)) {
            if (want[b] !== undefined) continue;
            if (mine[b] === undefined) delete Input.gamepadMapper[b];
            else Input.gamepadMapper[b] = mine[b];
            delete mine[b];
        }
        for (const [b, action] of Object.entries(want)) {
            if (!Object.prototype.hasOwnProperty.call(mine, b)) mine[b] = Input.gamepadMapper[b];
            Input.gamepadMapper[b] = action;
        }
    },

    isTouchScreen() {
        if (typeof Utils !== 'undefined' && Utils.isMobileDevice && Utils.isMobileDevice()) return true;
        return typeof navigator !== 'undefined' && Number(navigator.maxTouchPoints) > 0;
    },

    showButtons() {
        const mode = this.controls().buttons;
        if (mode === 'never') return false;
        if (mode === 'always') return true;
        return this.isTouchScreen();
    },

    // The on-screen buttons that would do something now: [{ id: 'jump' | 'fly', label }].
    buttonActions() {
        const p = typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        if (!p) return [];
        const out = [];
        const flying = Boolean(p._docsFlying);
        const ms = DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {};
        const swimming = this.isSwimming(p);
        const canDive = this.can('dive') && ((swimming && Number(ms.diveMap) > 0) || Number(ms.surfaceMap) > 0);
        if (!flying && canDive) out.push({ id: 'jump', label: swimming ? 'Dive' : 'Surface' });
        else if (!flying && !swimming && this.can('jump')) out.push({ id: 'jump', label: 'Jump' });
        if (this.can('fly') || flying) out.push({ id: 'fly', label: flying ? 'Land' : 'Fly' });
        return out;
    },

    pressButton(id) {
        if (typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gamePlayer.canMove()) return false;
        if ($gameMap.isEventRunning() || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) return false;
        return id === 'jump' ? this.jump() : id === 'fly' ? this.toggleFly() : false;
    },

    // Each frame on the map: the keys, the climb or descent, and flight ending if it's no longer allowed.
    update() {
        const p = $gamePlayer;
        if (!p) return;
        const s = this.settings();
        this.syncPad();
        const busy = (typeof $gameMessage !== 'undefined' && $gameMessage.isBusy()) || $gameMap.isEventRunning() || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (!busy && typeof Input !== 'undefined' && p.canMove()) {
            if (Input.isTriggered('docsJump')) this.jump();
            else if (Input.isTriggered('docsFly')) this.toggleFly();
        }
        if (p._docsFlying && !this.can('fly') && this.canLandHere()) p._docsFlying = false;
        const top = Math.max(8, Number(s.fly.altitude) || 48);
        const alt = p._docsFlyAlt || 0;
        p._docsFlyAlt = p._docsFlying ? Math.min(top, alt + 2) : Math.max(0, alt - 2);
    }
};

if (typeof Input !== 'undefined' && Input.keyMapper) {
    if (!Input.keyMapper[67]) Input.keyMapper[67] = 'docsJump';
    if (!Input.keyMapper[70]) Input.keyMapper[70] = 'docsFly';
}

if (typeof Game_Player !== 'undefined') {
    const X = () => DocsDoodads.Traversal;

    $.Game_Player_isMapPassable_traversal = Game_Player.prototype.isMapPassable;
    Game_Player.prototype.isMapPassable = function(x, y, d) {
        // A boat or ship goes where it can; swimming and climbing are for the player on foot.
        if (this.isInVehicle && this.isInVehicle()) return $.Game_Player_isMapPassable_traversal.call(this, x, y, d);
        if (X().isFlying(this)) return X().passable(x, y, d);
        return $.Game_Player_isMapPassable_traversal.call(this, x, y, d) || X().passable(x, y, d);
    };

    // No boarding from the air (land first).
    $.Game_Player_getOnVehicle_traversal = Game_Player.prototype.getOnVehicle;
    Game_Player.prototype.getOnVehicle = function() {
        if (this._docsFlying) return false;
        return $.Game_Player_getOnVehicle_traversal.call(this);
    };

    // Flying over the others; nobody is met or triggered from the air.
    $.Game_Player_isCollidedWithCharacters_traversal = Game_Player.prototype.isCollidedWithCharacters;
    Game_Player.prototype.isCollidedWithCharacters = function(x, y) {
        if (X().isFlying(this)) return false;
        return $.Game_Player_isCollidedWithCharacters_traversal.call(this, x, y);
    };
    $.Game_Player_canStartLocalEvents_traversal = Game_Player.prototype.canStartLocalEvents;
    Game_Player.prototype.canStartLocalEvents = function() {
        return !X().isFlying(this) && $.Game_Player_canStartLocalEvents_traversal.call(this);
    };
    $.Game_Player_canEncounter_traversal = Game_Player.prototype.canEncounter;
    Game_Player.prototype.canEncounter = function() {
        if (X().isFlying(this) && !X().settings().fly.encounters) return false;
        return $.Game_Player_canEncounter_traversal.call(this);
    };

    // Speeds: slower swimming and climbing, faster flying and on ice.
    $.Game_Player_realMoveSpeed_traversal = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const s = X().settings();
        let speed = $.Game_Player_realMoveSpeed_traversal.call(this);
        if (X().isFlying(this)) speed += Number(s.fly.speed) || 0;
        else if (X().isSwimming(this)) speed += Number(s.swim.speed) || 0;
        else if (X().can('climb') && X().isClimb(this.x, this.y)) speed += Number(s.climb.speed) || 0;
        if (this._docsSlideDir) speed += Number(s.ice.speed) || 0;
        return speed;
    };

    // Ice: once on it the player slides on until stopped (no walking animation while sliding).
    $.Game_Player_moveByInput_traversal = Game_Player.prototype.moveByInput;
    Game_Player.prototype.moveByInput = function() {
        const d = this._docsSlideDir;
        if (d && !this.isMoving() && !this.isJumping()) {
            if (X().can('ice') && X().isIce(this.x, this.y) && this.canPass(this.x, this.y, d)) {
                this.moveStraight(d);
                if (this.isMovementSucceeded()) return;
            }
            this._docsSlideDir = null;
        }
        $.Game_Player_moveByInput_traversal.call(this);
    };
    $.Game_Player_moveStraight_traversal = Game_Player.prototype.moveStraight;
    Game_Player.prototype.moveStraight = function(d) {
        $.Game_Player_moveStraight_traversal.call(this, d);
        if (this.isMovementSucceeded() && X().can('ice') && !X().isFlying(this)) this._docsSlideDir = X().isIce(this.x, this.y) ? d : null;
    };
    $.Game_Player_hasWalkAnime_traversal = Game_Player.prototype.hasWalkAnime;
    Game_Player.prototype.hasWalkAnime = function() {
        return !this._docsSlideDir && $.Game_Player_hasWalkAnime_traversal.call(this);
    };
}

if (typeof Game_CharacterBase !== 'undefined') {
    const X = () => DocsDoodads.Traversal;

    // Flying: the party is drawn up in the air.
    $.Game_CharacterBase_screenY_traversal = Game_CharacterBase.prototype.screenY;
    Game_CharacterBase.prototype.screenY = function() {
        const y = $.Game_CharacterBase_screenY_traversal.call(this);
        return X().isPartyMember(this) ? y - X().altitude() : y;
    };

    // In the air, above tree tops and roofs (☆ tiles), as MZ's airship flies.
    $.Game_CharacterBase_screenZ_traversal = Game_CharacterBase.prototype.screenZ;
    Game_CharacterBase.prototype.screenZ = function() {
        const z = $.Game_CharacterBase_screenZ_traversal.call(this);
        return X().isPartyMember(this) && X().altitude() > 0 ? Math.max(z, 5) : z;
    };

    // Climbable tiles act as ladders (the party faces up on them).
    $.Game_CharacterBase_isOnLadder_traversal = Game_CharacterBase.prototype.isOnLadder;
    Game_CharacterBase.prototype.isOnLadder = function() {
        return $.Game_CharacterBase_isOnLadder_traversal.call(this) || (X().isPartyMember(this) && X().can('climb') && X().isClimb(this._x, this._y));
    };

    // Swimming: in up to the waist (Sink), and a splash on each stroke.
    $.Game_CharacterBase_refreshBushDepth_traversal = Game_CharacterBase.prototype.refreshBushDepth;
    Game_CharacterBase.prototype.refreshBushDepth = function() {
        $.Game_CharacterBase_refreshBushDepth_traversal.call(this);
        // Nothing to wade through in the air.
        if (X().isPartyMember(this) && X().altitude() > 0) this._bushDepth = 0;
        else if (X().isSwimming(this) && !this.isJumping()) this._bushDepth = Math.max(this._bushDepth, Number(X().settings().swim.sink) || 0);
    };
    $.Game_CharacterBase_increaseSteps_traversal = Game_CharacterBase.prototype.increaseSteps;
    Game_CharacterBase.prototype.increaseSteps = function() {
        $.Game_CharacterBase_increaseSteps_traversal.call(this);
        if (this === $gamePlayer && X().isSwimming(this)) X().playSe(X().settings().swim.sound, 70);
    };

    // A swimming sheet (Name + Swim suffix, e.g. Actor1_swim), used when the file is there.
    $.Game_CharacterBase_characterName_traversal = Game_CharacterBase.prototype.characterName;
    Game_CharacterBase.prototype.characterName = function() {
        const name = $.Game_CharacterBase_characterName_traversal.call(this);
        if (!name || !X().isPartyMember(this) || !X().isSwimming(this)) return name;
        const suffix = String(X().settings().swim.suffix || '');
        return suffix && X().sheetExists(name + suffix) ? name + suffix : name;
    };
}

DocsDoodads.Traversal._sheets = new Map();
// Whether img/characters has this sheet: on disk (an encrypted build has .png_ files), or for a web
// build by asking the server once; the sheet is used from when it answers yes.
DocsDoodads.Traversal.sheetExists = function(name) {
    if (this._sheets.has(name)) return this._sheets.get(name) === true;
    const encrypted = typeof Utils !== 'undefined' && typeof Utils.hasEncryptedImages === 'function' && Utils.hasEncryptedImages();
    const file = 'img/characters/' + name + '.png' + (encrypted ? '_' : '');
    const FS = DocsDoodads.FS;
    if (FS.fs) {
        const there = Boolean(FS.existsSync(file));
        this._sheets.set(name, there);
        return there;
    }
    this._sheets.set(name, 'asking');
    if (typeof XMLHttpRequest !== 'undefined') {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', encodeURI(file));
        xhr.onload = () => this._sheets.set(name, xhr.status < 400);
        xhr.onerror = () => this._sheets.set(name, false);
        xhr.send();
    }
    return false;
};

// An on-screen Jump or Fly button (for touch screens): a round button that acts when tapped.
DocsDoodads.TravelButton = null;
if (typeof Sprite_Clickable !== 'undefined' && typeof Bitmap !== 'undefined') {
    DocsDoodads.TravelButton = class extends Sprite_Clickable {
        constructor(id) {
            super();
            this._docsId = id;
            this._docsLabel = '';
            this._docsSize = 0;
            this.visible = false;
        }

        setup(label, size) {
            if (label === this._docsLabel && size === this._docsSize) return;
            this._docsLabel = label;
            this._docsSize = size;
            const bmp = new Bitmap(size, size);
            bmp.drawCircle(size / 2, size / 2, size / 2 - 1, 'rgba(0, 0, 0, 0.55)');
            bmp.drawCircle(size / 2, size / 2, size / 2 - 4, 'rgba(255, 255, 255, 0.18)');
            bmp.fontSize = Math.round(size * 0.26);
            bmp.drawText(label, 0, 0, size, size, 'center');
            this.bitmap = bmp;
        }

        // A hidden button is never touched.
        isBeingTouched() {
            return this.visible && super.isBeingTouched();
        }

        onClick() {
            DocsDoodads.Traversal.pressButton(this._docsId);
        }

        update() {
            super.update();
            this.opacity = this._pressed ? 255 : 210;
        }
    };
}

if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_update_traversal = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        $.Scene_Map_update_traversal.call(this);
        if (this.isActive && this.isActive() && typeof $gamePlayer !== 'undefined' && $gamePlayer) DocsDoodads.Traversal.update();
        this.updateDocsTravelButtons();
    };

    $.Scene_Map_createDisplayObjects_traversal = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        $.Scene_Map_createDisplayObjects_traversal.call(this);
        this.createDocsTravelButtons();
    };

    Scene_Map.prototype.createDocsTravelButtons = function() {
        this._docsTravelButtons = [];
        const Button = DocsDoodads.TravelButton;
        if (!Button) return;
        for (const id of ['jump', 'fly']) {
            const b = new Button(id);
            this._docsTravelButtons.push(b);
            this.addChild(b);
        }
    };

    // Bottom right, Jump nearest the corner; hidden while a message, an event or the editor is up.
    Scene_Map.prototype.updateDocsTravelButtons = function() {
        const buttons = this._docsTravelButtons;
        if (!buttons || buttons.length === 0) return;
        const X = DocsDoodads.Traversal;
        const busy = typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gamePlayer.canMove() || $gameMap.isEventRunning() ||
            Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) || (typeof $gameMessage !== 'undefined' && $gameMessage.isBusy());
        const actions = !busy && X.showButtons() ? X.buttonActions() : [];
        const size = Math.max(48, Math.min(120, Number(X.controls().size) || 72));
        const w = typeof Graphics !== 'undefined' ? Graphics.boxWidth || Graphics.width : 816;
        const h = typeof Graphics !== 'undefined' ? Graphics.boxHeight || Graphics.height : 624;
        let slot = 0;
        for (const b of buttons) {
            const a = actions.find(x => x.id === b._docsId);
            b.visible = Boolean(a);
            if (!a) continue;
            b.setup(a.label, size);
            b.x = w - size - 16 - slot * (size + 12);
            b.y = h - size - 16;
            slot++;
        }
    };

    // Taps on the buttons never walk the player there.
    $.Scene_Map_isAnyButtonPressed_traversal = Scene_Map.prototype.isAnyButtonPressed;
    Scene_Map.prototype.isAnyButtonPressed = function() {
        const mine = (this._docsTravelButtons || []).some(b => b.visible && (b.isPressed() || b.isBeingTouched()));
        return mine || Boolean($.Scene_Map_isAnyButtonPressed_traversal && $.Scene_Map_isAnyButtonPressed_traversal.call(this));
    };
}

if (typeof Spriteset_Map !== 'undefined' && typeof Sprite !== 'undefined') {
    // A shadow on the ground under the flying player.
    $.Spriteset_Map_update_traversal = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_traversal.call(this);
        this.updateDocsFlyShadow();
    };

    Spriteset_Map.prototype.updateDocsFlyShadow = function() {
        const alt = DocsDoodads.Traversal.altitude();
        let shadow = this._docsFlyShadow;
        if (alt <= 0) {
            if (shadow) shadow.visible = false;
            return;
        }
        if (!shadow) {
            shadow = this._docsFlyShadow = new Sprite(ImageManager.loadSystem('Shadow1'));
            shadow.anchor.set(0.5, 1);
            shadow.z = 0.6;
            shadow._docsGround = true;
            this._tilemap.addChild(shadow);
        }
        const top = Math.max(8, Number(DocsDoodads.Traversal.settings().fly.altitude) || 48);
        shadow.x = $gamePlayer.screenX();
        shadow.y = $gamePlayer.screenY() + alt;
        shadow.opacity = Math.round(160 * Math.min(1, alt / top));
        shadow.visible = true;
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    // Set Traversal: an ability on or off for this game (or back to the settings).
    PluginManager.registerCommand(pluginName, 'setTraversal', function(args) {
        const state = String(args.state || 'default');
        DocsDoodads.Traversal.setAbility(String(args.ability || ''), state === 'on' ? true : state === 'off' ? false : null);
    });
    // Traversal Action: the player jumps, takes off, lands or dives, as if they pressed the key.
    PluginManager.registerCommand(pluginName, 'traversalAction', function(args) {
        const X = DocsDoodads.Traversal, action = String(args.action || 'jump');
        if (action === 'jump') X.jump();
        else if (action === 'takeOff') X.takeOff();
        else if (action === 'land') X.land();
        else if (action === 'dive') X.dive();
    });
}
