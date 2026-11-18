//==========================================================
// SECTION 7C: AMBIENT CREATURES ON THE MAP (9.3.1)
//==========================================================
// Birds, butterflies and fish near doodads that ask for them, drawn from the doodad's sheet (two frames side by
// side) or a small shape made here, from one pool. Birds over the characters with a shadow on the ground;
// butterflies with them; fish under them, dark, on water. Flat maps; the 3D view leaves them out.
(function() {
    if (typeof Spriteset_Map === 'undefined' || typeof PIXI === 'undefined') return;
    const C = DocsDoodads.Creatures;

    // A shape for each kind when there is no sheet: two frames, 16 x 12 each.
    C.textures = function() {
        if (this._textures) return this._textures;
        const make = draw => {
            if (typeof document === 'undefined' || !document.createElement) return [PIXI.Texture.WHITE, PIXI.Texture.WHITE];
            const canvas = document.createElement('canvas');
            canvas.width = 32; canvas.height = 12;
            const g = canvas.getContext && canvas.getContext('2d');
            if (!g) return [PIXI.Texture.WHITE, PIXI.Texture.WHITE];
            draw(g, 0, 0); draw(g, 16, 1);
            const base = PIXI.BaseTexture.from(canvas);
            return [new PIXI.Texture(base, new PIXI.Rectangle(0, 0, 16, 12)), new PIXI.Texture(base, new PIXI.Rectangle(16, 0, 16, 12))];
        };
        this._textures = {
            birds: make((g, x, f) => {
                g.strokeStyle = '#2a2424'; g.lineWidth = 2; g.beginPath();
                g.moveTo(x + 2, f ? 4 : 8); g.lineTo(x + 8, 7); g.lineTo(x + 14, f ? 4 : 8); g.stroke();
            }),
            butterflies: make((g, x, f) => {
                g.fillStyle = '#ffffff';
                const w = f ? 3 : 6;
                g.fillRect(x + 8 - w, 3, w, 6); g.fillRect(x + 8, 3, w, 6);
                g.fillStyle = '#3a2a2a'; g.fillRect(x + 7, 2, 2, 8);
            }),
            fish: make((g, x, f) => {
                g.fillStyle = '#ffffff'; g.beginPath();
                if (g.ellipse) g.ellipse(x + 7, 6, 6, 3, 0, 0, Math.PI * 2); else g.rect(x + 1, 3, 12, 6);
                g.fill();
                g.fillRect(x + 12, f ? 3 : 4, 3, 5);
            })
        };
        return this._textures;
    };

    Spriteset_Map.prototype.docsCreatureSources = function() {
        const list = DocsDoodads.doodads() || [];
        const c = this._docsCreatureList;
        if (c && c.list === list && c.length === list.length && c.version === C._version) return c;
        const sources = list.filter(d => d && C.normalize(d.creatures));
        const perches = list.filter(d => d && d.perch).map(d => ({
            x: Number(d.x) || 0, y: (Number(d.y) || 0) - (Number(d.frameH) || 48) * Math.abs(Number(d.scaleY) || 1) * (d.anchorY !== undefined ? d.anchorY : 1),
            w: (Number(d.frameW) || 48) * Math.abs(Number(d.scaleX) || 1)
        }));
        this._docsCreatureList = { list, length: list.length, version: C._version, sources, perches };
        return this._docsCreatureList;
    };

    Spriteset_Map.prototype.updateDocsCreatures = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const info = this.docsCreatureSources();
        const flocks = this._docsFlocks = this._docsFlocks || new Map();
        if (!info.sources.length && !flocks.size) return;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const screen = typeof $gameScreen !== 'undefined' ? $gameScreen : null;
        const weather = screen && screen.weatherType ? screen.weatherType() : 'none';
        const quality = C.quality(), hour = C.hour();
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const player = typeof $gamePlayer !== 'undefined' && $gamePlayer
            ? { x: ($gamePlayer._realX + 0.5) * tw, y: ($gamePlayer._realY + 1) * th - th / 2 } : null;
        // Lightning startles everything on the map.
        const strikes = this._docsBolt ? this._docsBolt.strikes || 0 : 0;
        // (Not on the first update: no strike has been seen yet, so nothing is startled as the map opens.)
        const startle = this._docsCreatureStrikes !== undefined && strikes !== this._docsCreatureStrikes;
        this._docsCreatureStrikes = strikes;
        const boat = $gamePlayer && (($gamePlayer.isInBoat && $gamePlayer.isInBoat()) || ($gamePlayer.isInShip && $gamePlayer.isInShip()));
        const swimming = DocsDoodads.Traversal && DocsDoodads.Traversal.isSwimming ? DocsDoodads.Traversal.isSwimming($gamePlayer) : false;
        const wind = DocsDoodads.Wind.current().x;
        const water = (x, y) => {
            const tx = $gameMap.roundX(Math.floor(x / tw)), ty = $gameMap.roundY(Math.floor(y / th));
            if (!$gameMap.isValid(tx, ty) || typeof Tilemap === 'undefined' || !Tilemap.isWaterTile) return false;
            return Tilemap.isWaterTile($gameMap.tileId(tx, ty, 0)) || Tilemap.isWaterTile($gameMap.tileId(tx, ty, 1));
        };
        const seen = new Set();
        let total = 0;
        for (const d of info.sources) {
            const s = C.normalize(d.creatures);
            const want = this._docs3d || editing || !C.active(s, hour, weather) ? 0 : Math.min(C.countFor(s.count, quality), C.maxOnMap - total);
            let flock = flocks.get(d);
            if (!want) { if (flock) this.docsDropFlock(d, flock, flocks); continue; }
            const key = [s.kind, s.count, s.sheet, s.spread, Math.round(d.x), Math.round(d.y)].join('|');
            if (flock && flock.key !== key) { this.docsDropFlock(d, flock, flocks); flock = null; }
            if (!flock) flock = this.docsMakeFlock(d, s, info.perches, key, tw, water);
            if (!flock) continue;
            flocks.set(d, flock);
            seen.add(d);
            const show = Math.min(want, flock.list.length);
            total += show;
            const fishScared = s.kind !== 'fish' || boat || swimming;
            for (let i = 0; i < flock.list.length; i++) {
                const c = flock.list[i], sprite = flock.sprites[i], shadow = flock.shadows[i];
                if (i >= show) { sprite.visible = false; if (shadow) shadow.visible = false; continue; }
                C.step(c, 1 / 60, { settings: s, player: fishScared ? player : null, wind, rng: flock.rng, startle, tw });
                const p = DocsDoodads.mapToScreen(c.x, c.y);
                sprite.visible = true;
                sprite.x = p.x; sprite.y = p.y - c.z;
                sprite.texture = flock.frames[C.frame(c)] || flock.frames[0];
                sprite.scale.x = c.flip ? -1 : 1;
                if (shadow) { shadow.visible = c.z > 2; shadow.x = p.x; shadow.y = p.y; shadow.alpha = 0.25 * Math.max(0.2, 1 - c.z / 120); }
            }
        }
        for (const [d, flock] of Array.from(flocks.entries())) if (!seen.has(d)) this.docsDropFlock(d, flock, flocks);
        this._docsCreatureCount = total;
    };

    Spriteset_Map.prototype.docsMakeFlock = function(d, s, perches, key, tw, water) {
        const parent = this._tilemap || this._baseSprite;
        if (!parent) return null;
        const seed = String(d.uid || '') + '|' + Math.round(d.x) + ',' + Math.round(d.y);
        let hash = 2166136261;
        for (let i = 0; i < seed.length; i++) { hash ^= seed.charCodeAt(i); hash = Math.imul(hash, 16777619); }
        const rng = DocsDoodads.Scatter.rng(hash >>> 0);
        const spots = C.spots({ x: Number(d.x) || 0, y: (Number(d.y) || 0) - 4 }, s, perches, rng, s.kind === 'fish' ? water : null, tw);
        if (!spots.length) return null;
        let frames;
        if (s.sheet) {
            const bitmap = DocsDoodads.loadBitmap(s.sheet);
            frames = [PIXI.Texture.EMPTY, PIXI.Texture.EMPTY];
            const fill = () => {
                if (!bitmap || !bitmap._baseTexture) return;
                const w = Math.floor(bitmap.width / 2) || 1, h = bitmap.height || 1;
                frames[0] = new PIXI.Texture(bitmap._baseTexture, new PIXI.Rectangle(0, 0, w, h));
                frames[1] = new PIXI.Texture(bitmap._baseTexture, new PIXI.Rectangle(w, 0, w, h));
            };
            if (bitmap && bitmap.addLoadListener) bitmap.addLoadListener(fill); else fill();
        } else frames = C.textures()[s.kind];
        const k = C.kinds[s.kind];
        const list = [], sprites = [], shadows = [];
        for (const spot of spots) {
            list.push(C.spawn(spot, rng));
            const sprite = new PIXI.Sprite(frames[0]);
            sprite.anchor.set(0.5, 1);
            if (!s.sheet) sprite.tint = s.kind === 'butterflies' ? [0xf5a0d0, 0xfff07a, 0xa0c8ff, 0xffffff][sprites.length % 4] : k.color;
            if (s.kind === 'fish') sprite.alpha = 0.45;
            sprite.z = s.kind === 'birds' ? 6 : s.kind === 'fish' ? 0.5 : 3;
            parent.addChild(sprite);
            sprites.push(sprite);
            if (s.kind === 'birds') {
                const shadow = new PIXI.Sprite(PIXI.Texture.WHITE);
                shadow.tint = 0x000000; shadow.width = 10; shadow.height = 3; shadow.anchor.set(0.5, 0.5); shadow.z = 1;
                shadow.visible = false;
                parent.addChild(shadow);
                shadows.push(shadow);
            } else shadows.push(null);
        }
        return { key, rng, list, sprites, shadows, frames };
    };

    Spriteset_Map.prototype.docsDropFlock = function(d, flock, flocks) {
        for (const s of flock.sprites.concat(flock.shadows)) {
            if (!s) continue;
            if (s.parent) s.parent.removeChild(s);
            if (s.destroy) s.destroy();
        }
        flocks.delete(d);
    };

    C._version = 0;
    DocsDoodads.spritesetSteps.push('updateDocsCreatures');
})();
