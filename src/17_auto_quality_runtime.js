//==========================================================
// SECTION 7Q: AUTOMATIC QUALITY SAMPLING AND TRANSITIONS
//==========================================================
Object.assign(DocsDoodads.AutoQuality, {
    active() { return typeof ConfigManager !== 'undefined' && ConfigManager.docsFxQuality === 4; },
    saveLevel() {
        if (typeof ConfigManager === 'undefined') return;
        ConfigManager.docsFxAutoLevel = this.clamp(this.level);
        if (ConfigManager.save) {
            try { const saved = ConfigManager.save(); if (saved && saved.catch) saved.catch(error => DocsDoodads.Core.log('Auto quality preference could not be saved', error)); }
            catch (error) { DocsDoodads.Core.log('Auto quality preference could not be saved', error); }
        }
    },
    clearFade(settle) {
        const fade = this.fade;
        this.fade = null;
        if (!fade) return;
        if (fade.sprite.parent && fade.sprite.parent.removeChild) fade.sprite.parent.removeChild(fade.sprite);
        if (fade.sprite.destroy) fade.sprite.destroy({ texture: true, baseTexture: true });
        if (settle && this.active()) this.saveLevel();
    },
    updateFade(now) {
        const fade = this.fade;
        if (!fade) return;
        if (!this.active() || (typeof SceneManager !== 'undefined' && SceneManager._scene !== fade.scene)) { this.clearFade(true); return; }
        fade.sprite.alpha = Math.max(0, 1 - (now - fade.start) / 500);
        if (fade.sprite.alpha <= 0) { this.clearFade(); this.saveLevel(); }
    },
    request(level, spriteset, now) {
        if (!this.active()) return false;
        level = this.clamp(level);
        if (level === this.level) return false;
        if (typeof $gamePlayer !== 'undefined' && $gamePlayer && $gamePlayer.isTransferring && $gamePlayer.isTransferring()) {
            this.pending = level;
            return true;
        }
        this.clearFade(true);
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        let texture = null, sprite = null;
        try {
            if (scene && scene._spriteset === spriteset && scene.addChildAt && typeof PIXI !== 'undefined' && PIXI.Texture && PIXI.Texture.from && PIXI.Sprite) {
                const canvas = DocsDoodads.Capture.renderSceneCanvas(spriteset);
                if (canvas) {
                    texture = PIXI.Texture.from(canvas);
                    sprite = new PIXI.Sprite(texture);
                    scene.addChildAt(sprite, scene.getChildIndex(spriteset) + 1);
                    this.fade = { scene, sprite, start: now };
                }
            }
        } catch (error) {
            if (sprite && sprite.parent && sprite.parent.removeChild) sprite.parent.removeChild(sprite);
            if (sprite && sprite.destroy) sprite.destroy({ texture: true, baseTexture: true });
            else if (texture && texture.destroy) texture.destroy(true);
            this.fade = null;
            DocsDoodads.Core.log('Auto quality frame transition is unavailable', error);
        }
        this.level = level;
        if (!this.fade) this.saveLevel();
        return true;
    },
    onMap() {
        this.clearFade(true);
        if (this.pending !== null && this.active()) { this.level = this.clamp(this.pending); this.saveLevel(); }
        this.pending = null;
        this.state = this.initial();
        this.lastTime = null;
        this.map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        this.mapId = this.map && this.map.mapId();
    },
    feed(now, spriteset) {
        this.updateFade(now);
        const map = typeof $gameMap !== 'undefined' ? $gameMap : null;
        if (map !== this.map || map && map.mapId() !== this.mapId) this.onMap();
        if (!this.active() || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)
            || (DocsDoodads.PhotoMode && DocsDoodads.PhotoMode.active)
            || (typeof document !== 'undefined' && document.hidden)) { this.lastTime = null; this.state = this.initial(); return; }
        const dt = this.lastTime === null || this.lastTime === undefined ? 0 : now - this.lastTime;
        this.lastTime = now;
        const direction = this.step(this.state || (this.state = this.initial()), dt);
        if (direction) this.request(this.level - direction, spriteset, now);
    }
});

if (typeof ConfigManager !== 'undefined') {
    const makeAutoData = ConfigManager.makeData, applyAutoData = ConfigManager.applyData;
    ConfigManager.docsFxAutoLevel = 0;
    ConfigManager.makeData = function() {
        const config = makeAutoData.call(this);
        config.docsFxAutoLevel = DocsDoodads.AutoQuality.clamp(this.docsFxAutoLevel);
        return config;
    };
    ConfigManager.applyData = function(config) {
        applyAutoData.call(this, config);
        this.docsFxAutoLevel = DocsDoodads.AutoQuality.clamp(config && config.docsFxAutoLevel);
        DocsDoodads.AutoQuality.level = this.docsFxAutoLevel;
        DocsDoodads.AutoQuality.pending = null;
        DocsDoodads.AutoQuality.onMap();
    };
}
if (typeof Spriteset_Map !== 'undefined') {
    DocsDoodads.spritesetSteps.push('updateDocsAutoQuality');
    Spriteset_Map.prototype.updateDocsAutoQuality = function() {
        const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        DocsDoodads.AutoQuality.feed(now, this);
    };
}
if (typeof Game_Map !== 'undefined') {
    const setupAutoMap = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        const result = setupAutoMap.call(this, mapId);
        DocsDoodads.AutoQuality.onMap();
        return result;
    };
}
if (typeof Scene_Map !== 'undefined') {
    const terminateAutoMap = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        DocsDoodads.AutoQuality.clearFade(true);
        DocsDoodads.AutoQuality.lastTime = null;
        if (terminateAutoMap) return terminateAutoMap.call(this);
    };
}
