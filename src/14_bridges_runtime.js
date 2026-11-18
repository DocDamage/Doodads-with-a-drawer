//==========================================================
// SECTION 6B: BRIDGES IN THE GAME (9.2.3)
//==========================================================
// Thin hooks for DocsDoodads.Bridges. Every one takes MZ's own path when the map marks no deck regions. This part
// sorts before the collision, terrain and traversal parts, so their wrappers of isMapPassable wrap this one.
(function() {
    if (typeof Game_CharacterBase === 'undefined') return;
    const B = DocsDoodads.Bridges;
    const reverse = d => 10 - d;

    const passable = Game_CharacterBase.prototype.isMapPassable;
    Game_CharacterBase.prototype.isMapPassable = function(x, y, d) {
        if (!B.active()) return passable.apply(this, arguments);
        const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        const verdict = B.canPass(Number(this._docsLevel) || 0, B.kindAt(x, y), B.kindAt(x2, y2));
        if (verdict === 'block') return false;
        if (verdict === 'pass') return true;
        if (verdict === 'under') return B.lowerPassable(x, y, d) && B.lowerPassable(x2, y2, reverse(d));
        return passable.apply(this, arguments);
    };

    // The level follows each finished step, jump and placement.
    const settle = (character, fromX, fromY) => {
        if (!B.active()) { if (character._docsLevel) character._docsLevel = 0; return; }
        if (character._x === fromX && character._y === fromY) return;
        character._docsLevel = B.levelAfter(Number(character._docsLevel) || 0, B.kindAt(fromX, fromY), B.kindAt(character._x, character._y));
    };
    for (const name of ['moveStraight', 'moveDiagonally']) {
        const original = Game_CharacterBase.prototype[name];
        if (typeof original !== 'function') continue;
        Game_CharacterBase.prototype[name] = function() {
            const fx = this._x, fy = this._y;
            const result = original.apply(this, arguments);
            settle(this, fx, fy);
            return result;
        };
    }
    const jump = Game_CharacterBase.prototype.jump;
    if (typeof jump === 'function') {
        Game_CharacterBase.prototype.jump = function() {
            const result = jump.apply(this, arguments);
            // Landing: on an end or the deck is up, on the ground is down.
            if (B.active()) this._docsLevel = B.kindAt(this._x, this._y) ? 1 : 0;
            return result;
        };
    }
    const locate = Game_CharacterBase.prototype.locate;
    Game_CharacterBase.prototype.locate = function() {
        const result = locate.apply(this, arguments);
        if (B.active()) this._docsLevel = B.levelFor(this);
        else if (this._docsLevel) this._docsLevel = 0;
        return result;
    };

    // Characters on different levels pass each other.
    const collided = Game_CharacterBase.prototype.isCollidedWithEvents;
    if (typeof collided === 'function') {
        Game_CharacterBase.prototype.isCollidedWithEvents = function(x, y) {
            if (!B.active()) return collided.apply(this, arguments);
            return $gameMap.eventsXyNt(x, y).some(event => event.isNormalPriority() && !B.apart(this, event));
        };
    }
    if (typeof Game_Event !== 'undefined') {
        const eventsCollided = Game_Event.prototype.isCollidedWithEvents;
        if (typeof eventsCollided === 'function') {
            Game_Event.prototype.isCollidedWithEvents = function(x, y) {
                if (!B.active()) return eventsCollided.apply(this, arguments);
                return $gameMap.eventsXyNt(x, y).some(event => event !== this && !B.apart(this, event));
            };
        }
        const withPlayer = Game_Event.prototype.isCollidedWithPlayerCharacters;
        if (typeof withPlayer === 'function') {
            Game_Event.prototype.isCollidedWithPlayerCharacters = function() {
                if (B.apart(this, $gamePlayer)) return false;
                return withPlayer.apply(this, arguments);
            };
        }
        const touch = Game_Event.prototype.checkEventTriggerTouch;
        if (typeof touch === 'function') {
            Game_Event.prototype.checkEventTriggerTouch = function() {
                if (B.apart(this, $gamePlayer)) return;
                return touch.apply(this, arguments);
            };
        }
        // A placed event's level from where it stands and its note.
        const setupPage = Game_Event.prototype.setupPageSettings;
        if (typeof setupPage === 'function') {
            Game_Event.prototype.setupPageSettings = function() {
                const result = setupPage.apply(this, arguments);
                if (B.active() && this._docsLevel === undefined) this._docsLevel = B.levelFor(this);
                return result;
            };
        }
    }
    // The player does not start an event on the other level.
    if (typeof Game_Player !== 'undefined') {
        const start = Game_Player.prototype.startMapEvent;
        if (typeof start === 'function') {
            Game_Player.prototype.startMapEvent = function(x, y, triggers, normal) {
                if (!B.active()) return start.apply(this, arguments);
                if ($gameMap.isEventRunning()) return;
                for (const event of $gameMap.eventsXy(x, y)) {
                    if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal && !B.apart(this, event)) event.start();
                }
            };
        }
    }
    // Followers keep their own level (they are moved by their own steps); after a transfer they take the player's.
    if (typeof Game_Followers !== 'undefined' && typeof Game_Followers.prototype.synchronize === 'function') {
        const sync = Game_Followers.prototype.synchronize;
        Game_Followers.prototype.synchronize = function() {
            const result = sync.apply(this, arguments);
            const level = typeof $gamePlayer !== 'undefined' && $gamePlayer ? $gamePlayer._docsLevel : 0;
            for (const follower of this._data || []) follower._docsLevel = level;
            return result;
        };
    }

    // Drawing: on the deck, over the deck's ☆ tiles (above-characters height); below, MZ's own height, under them.
    const screenZ = Game_CharacterBase.prototype.screenZ;
    Game_CharacterBase.prototype.screenZ = function() {
        const z = screenZ.apply(this, arguments);
        if (this._docsLevel && B.active() && B.kindAt(this._x, this._y) === 'deck') return Math.max(z, 5);
        return z;
    };
})();
