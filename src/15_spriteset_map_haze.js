(function() {
    if (typeof Spriteset_Base === 'undefined' || typeof PIXI === 'undefined' || !PIXI.Filter) return;
    const H = DocsDoodads.Haze;
    Spriteset_Base.prototype.docsHazeSources = function(look, quality, hidden) {
        if (hidden || this._docsExportLook !== undefined || quality === 'low' || quality === 'off' || this._docs3d || typeof Spriteset_Map === 'undefined' || !(this instanceof Spriteset_Map)) return [];
        const matrix = this._baseSprite && this._baseSprite.worldTransform;
        const display = { width: Graphics.width, height: Graphics.height, scale: matrix ? Math.hypot(matrix.a, matrix.b) : 1 };
        const items = [];
        for (const sprite of this._docsDoodadSprites || []) {
            const data = sprite._data;
            if (!data || !data.haze || !sprite.visible || sprite.renderable === false) continue;
            items.push(Object.assign(H.spriteCentre(sprite), { haze: data.haze }));
        }
        if (look && look.heat && look.heat.enabled && look.heat.strength > 0) {
            // The preset's band is in screen space and bypasses the map transform.
            const local = H.collect(items, display);
            local.push({ x: Graphics.width / 2, y: Graphics.height * 0.65, radius: Graphics.height * 0.2, strength: look.heat.strength, speed: look.heat.speed, shape: 'band', distance: Graphics.height * 0.15 });
            return local.sort((a, b) => a.distance - b.distance).slice(0, 8);
        }
        return H.collect(items, display);
    };
    const create = Spriteset_Base.prototype.createDocsPostFxFilters;
    Spriteset_Base.prototype.createDocsPostFxFilters = function() {
        const filters = create.call(this);
        if (filters) {
            filters.haze = new PIXI.Filter(undefined, H.fragment, H.uniforms([], 0, false));
            const apply = filters.haze.apply, spriteset = this;
            filters.haze.apply = function() {
                if (spriteset._docsHazeInputs) {
                    const input = spriteset._docsHazeInputs;
                    H.uniforms(spriteset.docsHazeSources(input.look, input.quality, input.hidden), DocsDoodads.frameCount() / 60, DocsDoodads.Comfort.choices().lessCameraMotion, this.uniforms);
                }
                return apply.apply(this, arguments);
            };
        }
        return filters;
    };
})();
