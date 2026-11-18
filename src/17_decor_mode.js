//==========================================================
// SECTION 6D: DECORATE MODE, THE PLAYER'S SIDE (8.4.1)
//==========================================================
// A mode on the map, drawn with MZ's own window (so it wears the game's skin), not the editor's HTML. The cursor
// moves by tile (arrows, a pad, or a click or tap; tapping the cursor again is OK). OK on an empty tile places the
// piece chosen (Q / W change it); OK on a piece lifts it to move and OK puts it down; Shift flips; Cancel while
// holding one puts it away in the bag; Cancel otherwise is Done. Green under the piece where it may go, red where
// not, with why. The player cannot walk, and the menu is closed, while it is open.
DocsDoodads.DecorMode = {
    state: null,

    active() { return Boolean(this.state); },

    open() {
        const D = DocsDoodads.Decor;
        if (typeof $gameMap === 'undefined' || !$gameMap || this.state) return false;
        const mapId = $gameMap.mapId();
        if (!D.zonesFor(mapId) || !D.catalog().length) return false;
        this.state = { mapId, cursor: { x: $gamePlayer.x, y: $gamePlayer.y }, index: 0, holding: null, flip: false, message: '' };
        this.check();
        return true;
    },

    close() {
        const s = this.state;
        if (s && s.holding) this.putBack();
        this.state = null;
        return Boolean(s);
    },

    item() {
        const s = this.state, D = DocsDoodads.Decor, list = D.catalog();
        if (!s || !list.length) return null;
        if (s.holding) return D.item(s.holding.item);
        return list[((s.index % list.length) + list.length) % list.length];
    },

    pieceAt(x, y) {
        const D = DocsDoodads.Decor;
        return D.pieces(this.state.mapId).find(p => {
            const item = D.item(p.item);
            return item && D.footprint(item, p.x, p.y).some(t => t.x === x && t.y === y);
        }) || null;
    },

    // The world as Decor.canPlace sees it, without the piece being moved.
    context() {
        const D = DocsDoodads.Decor, s = this.state, mapId = s.mapId;
        const others = D.pieces(mapId).filter(p => !s.holding || p.uid !== s.holding.uid)
            .map(p => ({ x: p.x, y: p.y, item: D.item(p.item) })).filter(p => p.item);
        const decorTiles = new Set();
        for (const p of D.pieces(mapId)) { const item = D.item(p.item); if (item) for (const t of D.footprint(item, p.x, p.y)) decorTiles.add(t.x + ',' + t.y); }
        const C = DocsDoodads.Collision;
        const passable = (x, y) => [2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d)) && (decorTiles.has(x + ',' + y) || !(C && C.blocksTile(x, y, false, $gamePlayer, 0)));
        const exits = $gameMap.events().filter(ev => ev && (ev.list() || []).some(c => c && c.code === 201)).map(ev => ({ x: ev.x, y: ev.y }));
        return { zones: D.zonesFor(mapId), regionAt: (x, y) => $gameMap.regionId(x, y), w: $gameMap.width(), h: $gameMap.height(), passable, placed: others,
            start: { x: $gamePlayer.x, y: $gamePlayer.y }, exits };
    },

    check() {
        const s = this.state, D = DocsDoodads.Decor;
        if (!s) return null;
        const item = this.item();
        const onPiece = !s.holding && this.pieceAt(s.cursor.x, s.cursor.y);
        if (onPiece) { s.verdict = { ok: true, reason: 'lift' }; s.message = 'OK: move this piece'; return s.verdict; }
        let v = D.canPlace(item, s.cursor.x, s.cursor.y, this.context());
        if (v.ok && !s.holding && D.left(item) <= 0) v = { ok: false, reason: 'none' };
        s.verdict = v;
        s.message = v.ok ? '' : D.reasons[v.reason] || '';
        return v;
    },

    moveCursor(dx, dy) {
        const s = this.state;
        if (!s) return;
        s.cursor.x = Math.max(0, Math.min($gameMap.width() - 1, s.cursor.x + dx));
        s.cursor.y = Math.max(0, Math.min($gameMap.height() - 1, s.cursor.y + dy));
        this.check();
    },

    setCursor(x, y) {
        const s = this.state;
        if (!s) return false;
        const same = s.cursor.x === x && s.cursor.y === y;
        s.cursor = { x: Math.max(0, Math.min($gameMap.width() - 1, x)), y: Math.max(0, Math.min($gameMap.height() - 1, y)) };
        this.check();
        return same;
    },

    nextItem(step) {
        const s = this.state;
        if (!s || s.holding) return;
        s.index += step;
        s.flip = false;
        this.check();
    },

    flip() { if (this.state) { this.state.flip = !this.state.flip; if (this.state.holding) this.state.holding.flip = this.state.flip; } },

    refresh() {
        DocsDoodads.Decor.sync(this.state.mapId);
        if (DocsDoodads.api && DocsDoodads.api.refresh) DocsDoodads.api.refresh();
        this.check();
    },

    ok() {
        const s = this.state, D = DocsDoodads.Decor;
        if (!s) return false;
        if (s.holding) {
            const v = this.check();
            if (!v.ok) { this.buzzer(); return false; }
            D.move(s.mapId, s.holding.uid, s.cursor.x, s.cursor.y, s.flip);
            s.holding = null;
            this.refresh();
            return true;
        }
        const piece = this.pieceAt(s.cursor.x, s.cursor.y);
        if (piece) {
            s.holding = { uid: piece.uid, item: piece.item, from: { x: piece.x, y: piece.y, flip: Boolean(piece.flip) }, flip: Boolean(piece.flip) };
            s.flip = Boolean(piece.flip);
            this.check();
            return true;
        }
        const item = this.item(), v = this.check();
        if (!v.ok) { this.buzzer(); return false; }
        D.take(item);
        D.add(s.mapId, item.id, s.cursor.x, s.cursor.y, s.flip);
        this.refresh();
        return true;
    },

    // Puts a lifted piece back where it was (it is still there in the save until it is put down).
    putBack() {
        const s = this.state;
        if (!s || !s.holding) return;
        s.holding = null;
        this.check();
    },

    // Cancel: a lifted piece goes into the bag; otherwise Done.
    cancel() {
        const s = this.state, D = DocsDoodads.Decor;
        if (!s) return;
        if (s.holding) {
            const p = D.remove(s.mapId, s.holding.uid);
            if (p) D.handBack(D.item(p.item));
            s.holding = null;
            this.refresh();
            return;
        }
        this.close();
    },

    buzzer() { if (typeof SoundManager !== 'undefined' && SoundManager.playBuzzer) SoundManager.playBuzzer(); },

    updateInput() {
        if (!this.state || typeof Input === 'undefined') return;
        if (Input.isRepeated('left')) this.moveCursor(-1, 0);
        if (Input.isRepeated('right')) this.moveCursor(1, 0);
        if (Input.isRepeated('up')) this.moveCursor(0, -1);
        if (Input.isRepeated('down')) this.moveCursor(0, 1);
        if (Input.isTriggered('pageup')) this.nextItem(-1);
        if (Input.isTriggered('pagedown')) this.nextItem(1);
        if (Input.isTriggered('shift')) this.flip();
        if (Input.isTriggered('ok')) this.ok();
        else if (Input.isTriggered('cancel')) this.cancel();
        if (typeof TouchInput !== 'undefined' && TouchInput.isTriggered && TouchInput.isTriggered()) {
            const x = $gameMap.canvasToMapX(TouchInput.x), y = $gameMap.canvasToMapY(TouchInput.y);
            if (this.setCursor(x, y)) this.ok();
        }
    },

    // The words in the window: the piece, how many are left, the keys, and why not.
    text() {
        const s = this.state, item = this.item(), D = DocsDoodads.Decor;
        if (!s || !item) return '';
        const left = s.holding ? '' : ` (${D.left(item)} left)`;
        const keys = s.holding ? 'OK: put down  Shift: flip  Cancel: put away' : 'OK: place  Q/W: piece  Shift: flip  Cancel: done';
        return `${item.name}${left}\n${s.message || keys}`;
    }
};

(function() {
    const M = DocsDoodads.DecorMode;
    if (typeof Game_Player !== 'undefined') {
        const canMove = Game_Player.prototype.canMove;
        Game_Player.prototype.canMove = function() { return M.active() ? false : canMove.apply(this, arguments); };
    }
    if (typeof Scene_Map === 'undefined') return;
    const menu = Scene_Map.prototype.isMenuEnabled;
    Scene_Map.prototype.isMenuEnabled = function() { return M.active() ? false : menu.apply(this, arguments); };
    const update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        const was = M.active();
        if (was) M.updateInput();
        const result = update.apply(this, arguments);
        this.updateDocsDecorWindow();
        return result;
    };
    // A map change or a battle ends the mode.
    const terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (M.active() && (!$gamePlayer.isTransferring || $gamePlayer.isTransferring())) M.close();
        return terminate.apply(this, arguments);
    };
    Scene_Map.prototype.updateDocsDecorWindow = function() {
        const active = M.active();
        let win = this._docsDecorWindow;
        if (active && !win && typeof Window_Help !== 'undefined' && typeof Rectangle !== 'undefined') {
            const rect = new Rectangle(0, 0, Graphics.boxWidth, this.calcWindowHeight ? this.calcWindowHeight(2, false) : 108);
            win = this._docsDecorWindow = new Window_Help(rect);
            this.addWindow(win);
        }
        if (!win) return;
        win.visible = active;
        if (active) { const text = M.text(); if (win._docsText !== text) { win._docsText = text; win.setText(text); } }
    };

    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined') return;
    Spriteset_Map.prototype.updateDocsDecorCursor = function() {
        const s = M.state;
        let g = this._docsDecorCursor;
        if (!s) { if (g) g.visible = false; if (this._docsDecorGhost) this._docsDecorGhost.visible = false; return; }
        const parent = this._tilemap || this._baseSprite;
        if (!g) { g = this._docsDecorCursor = new PIXI.Graphics(); g.z = 9; parent.addChild(g); }
        const item = M.item(), D = DocsDoodads.Decor, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ok = s.verdict && s.verdict.ok;
        const colour = ok ? 0x40ff70 : 0xff4040;
        g.visible = true;
        g.clear();
        const tiles = item ? D.footprint(item, s.cursor.x, s.cursor.y) : [{ x: s.cursor.x, y: s.cursor.y }];
        for (const t of tiles) {
            const p = DocsDoodads.mapToScreen(t.x * tw, t.y * th);
            g.lineStyle(2, colour, 0.95); g.beginFill(colour, 0.25); g.drawRect(p.x + 1, p.y + 1, tw - 2, th - 2); g.endFill();
        }
        g.lineStyle(0);
        // A ghost of the piece.
        let ghost = this._docsDecorGhost;
        if (item && item.doodad && item.doodad.bit && item.doodad.bit[0] === 3) {
            if (!ghost) { ghost = this._docsDecorGhost = new PIXI.Sprite(PIXI.Texture.EMPTY); ghost.anchor.set(0.5, 1); ghost.z = 9; ghost.alpha = 0.6; parent.addChild(ghost); }
            if (ghost._docsArt !== item.doodad.bit[1]) {
                ghost._docsArt = item.doodad.bit[1];
                const bmp = DocsDoodads.loadBitmap(item.doodad.bit[1]);
                const set = () => { if (bmp && bmp._baseTexture) ghost.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(0, 0, Number(item.doodad.frameW) || bmp.width || 48, Number(item.doodad.frameH) || bmp.height || 48)); };
                if (bmp && bmp.addLoadListener) bmp.addLoadListener(set); else set();
            }
            const p = DocsDoodads.mapToScreen(s.cursor.x * tw + item.w * tw / 2, s.cursor.y * th + th);
            ghost.x = p.x; ghost.y = p.y; ghost.visible = true;
            ghost.scale.x = (s.flip ? -1 : 1) * Math.abs(Number(item.doodad.scaleX) || 1);
            ghost.scale.y = Math.abs(Number(item.doodad.scaleY) || 1);
        } else if (ghost) ghost.visible = false;
    };
    if (DocsDoodads.spritesetSteps) DocsDoodads.spritesetSteps.push('updateDocsDecorCursor');
})();

