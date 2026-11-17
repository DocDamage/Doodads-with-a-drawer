//==========================================================
// SECTION 7R: ROPES AND CABLES ON THE MAP (9.3.2)
//==========================================================
// A doodad with `line` draws a hanging line from its point instead of its picture: a PIXI.SimpleRope with the
// picture as texture, or a plain PIXI.Graphics cord. Hung pictures ride along it and may carry a light preset.
// The rope ignores the doodad's size and turn, so its ends stay where they were placed. Flat maps.
(function() {
    if (typeof Sprite_DocsDoodad === 'undefined' || typeof PIXI === 'undefined') return;
    const R = DocsDoodads.Rope;

    const setup = Sprite_DocsDoodad.prototype.setupBitmap;
    Sprite_DocsDoodad.prototype.setupBitmap = function(bmp) {
        setup.call(this, bmp);
        if (!this._data || !this._data.line) return;
        // A textured rope keeps the picture's frame for the rope; the doodad itself draws nothing.
        this._docsRopeTexture = this._data.bit && this._data.bit[0] === 3 && this.texture !== PIXI.Texture.EMPTY ? this.texture : null;
        this.texture = PIXI.Texture.EMPTY;
        if (this._shadowSprite) this._shadowSprite.texture = PIXI.Texture.EMPTY;
    };

    const update = Sprite_DocsDoodad.prototype.update;
    Sprite_DocsDoodad.prototype.update = function() {
        update.call(this);
        if (this._data && this._data.line) this.updateDocsRope();
        else if (this._docsRope) this.removeDocsRope();
    };

    Sprite_DocsDoodad.prototype.removeDocsRope = function() {
        if (this._docsRope) {
            if (this._docsRope.parent) this._docsRope.parent.removeChild(this._docsRope);
            if (typeof this._docsRope.destroy === 'function') this._docsRope.destroy({ children: true });
        }
        this._docsRope = null; this._docsRopeMesh = null; this._docsRopeLine = null; this._docsRopePoints = null;
        this._docsRopeHung = null; this._docsRopeLights = null; this._docsRopeFrame = -1;
    };

    Sprite_DocsDoodad.prototype.updateDocsRope = function() {
        const frame = DocsDoodads.frameCount();
        if (this._docsRopeFrame === frame && frame !== 0 && this._docsRope) return;
        this._docsRopeFrame = frame;
        const d = this._data, line = R.normalize(d.line);
        if (!line) { this.removeDocsRope(); return; }
        // The rope is drawn in map pixels: the doodad's size, flip and turn would move its far end.
        this.scale.set(1, 1); this.rotation = 0; if (this.skew) this.skew.x = 0;
        if (this.texture !== PIXI.Texture.EMPTY && this._bmp) this.setupBitmap(this._bmp);
        if (!this._docsRope) {
            this._docsRope = new PIXI.Container();
            this.addChild(this._docsRope);
        }
        const base = R.points(0, 0, line.x2, line.y2, line.sag, R.segmentsFor(line));
        const points = R.swayed(base, DocsDoodads.Wind.current(), frame / 60, (Number(d.x) || 0) + (Number(d.y) || 0), line.sway);
        const texture = this._docsRopeTexture;
        if (texture && PIXI.SimpleRope) {
            if (this._docsRopeLine) this._docsRopeLine.visible = false;
            if (!this._docsRopeMesh || this._docsRopeMesh.texture !== texture || this._docsRopePoints.length !== points.length) {
                if (this._docsRopeMesh) { this._docsRope.removeChild(this._docsRopeMesh); this._docsRopeMesh.destroy(); }
                this._docsRopePoints = points.map(p => new PIXI.Point(p.x, p.y));
                this._docsRopeMesh = new PIXI.SimpleRope(texture, this._docsRopePoints);
                this._docsRope.addChildAt(this._docsRopeMesh, 0);
            }
            points.forEach((p, i) => { this._docsRopePoints[i].x = p.x; this._docsRopePoints[i].y = p.y; });
            this._docsRopeMesh.visible = true;
        } else {
            if (this._docsRopeMesh) this._docsRopeMesh.visible = false;
            if (!this._docsRopeLine) { this._docsRopeLine = new PIXI.Graphics(); this._docsRope.addChildAt(this._docsRopeLine, 0); }
            const g = this._docsRopeLine;
            g.visible = true;
            g.clear();
            g.lineStyle(line.width, R.colorNumber(line.color), 1);
            g.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
            g.lineStyle(0);
        }
        this.updateDocsRopeHung(line, R.hangAt(points, line.hang.count));
        const lowest = Math.max(...points.map(p => p.y));
        if (DocsDoodads.Depth.resolve(d) === 'sorted') this._docsSortY = this.y + lowest;
    };

    Sprite_DocsDoodad.prototype.updateDocsRopeHung = function(line, spots) {
        const hung = this._docsRopeHung = this._docsRopeHung || [];
        const path = line.hang.path;
        if (path) {
            if (this._docsRopeHungPath !== path) {
                this._docsRopeHungPath = path;
                this._docsRopeHungBitmap = DocsDoodads.loadBitmap(path);
            }
            const bitmap = this._docsRopeHungBitmap;
            for (let i = 0; i < spots.length; i++) {
                let sprite = hung[i];
                if (!sprite) { sprite = hung[i] = new PIXI.Sprite(PIXI.Texture.EMPTY); sprite.anchor.set(0.5, 0); this._docsRope.addChild(sprite); }
                if (bitmap && bitmap._baseTexture && (!bitmap.isReady || bitmap.isReady()) && sprite._docsBase !== bitmap._baseTexture) {
                    sprite.texture = new PIXI.Texture(bitmap._baseTexture);
                    sprite._docsBase = bitmap._baseTexture;
                }
                sprite.x = spots[i].x; sprite.y = spots[i].y; sprite.visible = true;
            }
        }
        for (let i = path ? spots.length : 0; i < hung.length; i++) hung[i].visible = false;
        // Lights ride with the hung things; the same objects every frame so lamps fade instead of blinking.
        const preset = line.hang.light && DocsDoodads.LightPresets.get(line.hang.light);
        if (!preset || !spots.length) { this._docsRopeLights = null; return; }
        const d = this._data, lights = this._docsRopeLights = (this._docsRopeLights || []).slice(0, spots.length);
        for (let i = 0; i < spots.length; i++) {
            const item = lights[i] || (lights[i] = { light: null, ropeOf: d });
            if (!item.light || item.light.preset !== preset.id) {
                item.light = Object.assign({}, DocsDoodads.Lighting.lightDefaults, JSON.parse(JSON.stringify(preset.light)), { enabled: true, preset: preset.id });
            }
            item.x = (Number(d.x) || 0) + spots[i].x;
            item.y = (Number(d.y) || 0) + spots[i].y;
            item.posMode = d.posMode;
        }
    };
})();
