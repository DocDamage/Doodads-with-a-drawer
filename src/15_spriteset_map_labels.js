//==========================================================
// SECTION 15L: NAMES AND ICONS OVER EVENTS
//==========================================================
// One sprite per labelled event that shows now (DocsDoodads.EventLabels), over its head, flat or where it
// stands in the 3D view. Hidden while a message shows. A map with no label tags makes nothing and costs one
// check a frame.
if (typeof Spriteset_Map !== 'undefined' && typeof Sprite !== 'undefined' && typeof Bitmap !== 'undefined') {
    // A step of Spriteset_Map.update (DocsDoodads.spritesetSteps).
    Spriteset_Map.prototype.updateDocsEventLabels = function() {
        const L = DocsDoodads.EventLabels;
        const live = this._docsLabels;
        const on = typeof $gameMap !== 'undefined' && $gameMap && typeof $dataMap !== 'undefined' && L.mapHas($dataMap) && L.enabled();
        if (!on) {
            if (live) this.clearDocsEventLabels();
            return;
        }
        const busy = typeof $gameMessage !== 'undefined' && $gameMessage && $gameMessage.isBusy();
        const settings = L.settings();
        const labels = live || (this._docsLabels = new Map());
        if (!this._docsLabelLayer) {
            this._docsLabelLayer = new Sprite();
            this._docsLabelLayer.z = 9;
            this.addChild(this._docsLabelLayer);
        }
        const seen = this._docsLabelsSeen || (this._docsLabelsSeen = new Set());
        seen.clear();
        const P = DocsDoodads.Perspective;
        const cam = P && P.liveCamera ? P.liveCamera() : null;
        const gw = typeof Graphics !== 'undefined' ? Graphics.width : 816, gh = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const th = $gameMap.tileHeight();
        const player = typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        const events = busy ? [] : $gameMap.events();
        for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            const info = L.of(ev);
            if (!L.shows(ev, info)) continue;
            if (info.range > 0 && player && !L.inRange(info.range, $gameMap.deltaX(ev.x, player.x), $gameMap.deltaY(ev.y, player.y))) continue;
            const bitmap = L.bitmap(info, settings);
            if (!bitmap) continue;
            let x = ev.screenX(), y = ev.screenY(), scale = 1;
            if (cam) {
                const at = P.flatToScreen(x, y);
                if (!at || !(at.scale > 0)) continue;
                x = at.x;
                y = at.y;
                scale = at.scale;
            }
            y -= (this.docsCharacterHeight(ev) || th) * scale + 2;
            if (x < -64 || x > gw + 64 || y < -64 || y > gh + 64) continue;
            let sprite = labels.get(ev);
            if (!sprite) {
                sprite = new Sprite();
                sprite.anchor.x = 0.5;
                sprite.anchor.y = 1;
                sprite.opacity = settings.fade ? 0 : 255;
                this._docsLabelLayer.addChild(sprite);
                labels.set(ev, sprite);
            }
            if (sprite.bitmap !== bitmap) sprite.bitmap = bitmap;
            sprite.x = Math.round(x);
            sprite.y = Math.round(y);
            sprite.visible = true;
            if (sprite.opacity < 255) sprite.opacity = settings.fade ? Math.min(255, sprite.opacity + 24) : 255;
            seen.add(ev);
        }
        // Gone out of range, off screen, erased or another map: fade out, then free.
        for (const [ev, sprite] of labels) {
            if (seen.has(ev)) continue;
            if (settings.fade && !busy && sprite.opacity > 0 && $gameMap.events().includes(ev)) {
                sprite.opacity = Math.max(0, sprite.opacity - 24);
                if (sprite.opacity > 0) continue;
            }
            this.removeDocsEventLabel(ev);
        }
    };

    Spriteset_Map.prototype.removeDocsEventLabel = function(ev) {
        const sprite = this._docsLabels ? this._docsLabels.get(ev) : null;
        if (!sprite) return;
        if (sprite.parent) sprite.parent.removeChild(sprite);
        this._docsLabels.delete(ev);
    };

    Spriteset_Map.prototype.clearDocsEventLabels = function() {
        for (const ev of Array.from(this._docsLabels ? this._docsLabels.keys() : [])) this.removeDocsEventLabel(ev);
    };

    // How tall an event is drawn (its character's frame), from its sprite.
    Spriteset_Map.prototype.docsCharacterHeight = function(ev) {
        const sprites = this._characterSprites || [];
        if (!this._docsSpriteOf || this._docsSpriteOfCount !== sprites.length) {
            this._docsSpriteOf = new Map(sprites.map(s => [s._character, s]));
            this._docsSpriteOfCount = sprites.length;
        }
        const s = this._docsSpriteOf.get(ev);
        if (!s) return 0;
        if (typeof s.patternHeight === 'function' && s.bitmap) return s.patternHeight() || 0;
        return s.height || 0;
    };
}
