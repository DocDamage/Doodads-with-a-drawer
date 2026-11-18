//==========================================================
// SECTION 7N: INDOORS ON THE MAP (9.2.2)
//==========================================================
// Thin hooks for DocsDoodads.Indoors: MZ's rain and snow sprites over an indoor tile are hidden each frame (the
// test is by the drop's screen point, so the map scrolling and looping never makes the edge slip); doodads based
// indoors throw no sun shadow; and the player's being inside is eased for darkness, lightning and sound.
(function() {
    if (typeof Spriteset_Map === 'undefined') return;
    const I = DocsDoodads.Indoors;

    Spriteset_Map.prototype.updateDocsIndoors = function() {
        const c = I.current();
        const flat = !this._docs3d;
        const before = I.blend;
        I.blend = c ? I.ease(I.blend, I.playerInside(), 1 / 60) : 0;
        if (flat) this.docsMaskWeather(c);
        if (c || before) this.docsQuietWeather(c);
    };

    // MZ's own weather (flat maps): each drop's screen point is turned into a map tile.
    Spriteset_Map.prototype.docsMaskWeather = function(c) {
        const weather = this._weather, sprites = weather && weather._sprites;
        if (!sprites || !sprites.length) return;
        if (!c) {
            if (this._docsWeatherMasked) { for (const s of sprites) s.visible = true; this._docsWeatherMasked = false; }
            return;
        }
        this._docsWeatherMasked = true;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        for (const s of sprites) s.visible = !I.tile(Math.floor((ox + s.x) / tw), Math.floor((oy + s.y) / th));
    };

    // The weather's sound (MZ's background sound while it rains or storms) is quieter indoors.
    Spriteset_Map.prototype.docsQuietWeather = function(c) {
        if (typeof AudioManager === 'undefined' || !AudioManager._bgsBuffer || !AudioManager._currentBgs) return;
        const screen = typeof $gameScreen !== 'undefined' ? $gameScreen : null;
        const wet = screen && screen.weatherType && screen.weatherType() !== 'none';
        const k = wet && c ? I.volume(c.settings && { indoors: c.settings }, I.blend) : 1;
        if (k === this._docsIndoorVolume) return;
        this._docsIndoorVolume = k;
        const base = (Number(AudioManager._bgsVolume) || 0) * (Number(AudioManager._currentBgs.volume) || 0) / 10000;
        AudioManager._bgsBuffer.volume = base * k;
    };

    DocsDoodads.spritesetSteps.push('updateDocsIndoors');

    if (typeof Sprite_DocsDoodad !== 'undefined') {
        const shadow = Sprite_DocsDoodad.prototype.updateShadow;
        Sprite_DocsDoodad.prototype.updateShadow = function() {
            const d = this._data;
            if (d && d.shadow && d.shadow.enabled && d.shadow.followSun && I.doodad(d)) { this.destroyShadow(); return; }
            return shadow.call(this);
        };
    }
})();
