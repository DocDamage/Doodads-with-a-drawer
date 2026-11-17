//==========================================================
// SECTION 23P: PLAYER PHOTO MODE
//==========================================================
// Photo Mode stays on Scene_Map so its sprites keep rendering, but updateMain is paused. All temporary
// camera/look/visibility changes are snapshots: leaving, transferring or a scene failure restores them.
DocsDoodads.PhotoMode = {
    active: false,
    state: null,
    key: photoModeKey,
    forbidSwitch: photoModeForbidSwitch,
    maxPanTiles: 4,

    clone(value) {
        return value === undefined || value === null ? value : JSON.parse(JSON.stringify(value));
    },

    fields(object, names) {
        const out = {};
        for (const name of names) out[name] = { own: Object.prototype.hasOwnProperty.call(object, name), value: this.clone(object[name]) };
        return out;
    },

    restoreFields(object, saved) {
        if (!object || !saved) return;
        for (const name of Object.keys(saved)) {
            if (saved[name].own) object[name] = this.clone(saved[name].value);
            else delete object[name];
        }
    },

    forbidden() {
        return this.forbidSwitch > 0 && typeof $gameSwitches !== 'undefined' && $gameSwitches && $gameSwitches.value(this.forbidSwitch);
    },

    partySprites(spriteset) {
        if (!spriteset || !Array.isArray(spriteset._characterSprites) || typeof $gamePlayer === 'undefined') return [];
        const followers = $gamePlayer.followers && $gamePlayer.followers().data ? $gamePlayer.followers().data() : [];
        return spriteset._characterSprites.filter(sprite => sprite && (sprite._character === $gamePlayer || followers.includes(sprite._character)));
    },

    open(scene) {
        if (this.active) return true;
        scene = scene || (typeof SceneManager !== 'undefined' ? SceneManager._scene : null);
        if (this.forbidden() || !scene || typeof Scene_Map === 'undefined' || !(scene instanceof Scene_Map)
            || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) || typeof $gameMap === 'undefined' || !$gameMap) return false;
        const spriteset = scene._spriteset;
        if (!spriteset) return false;
        if (DocsDoodads.Perspective && DocsDoodads.Perspective.releaseMouseLook) DocsDoodads.Perspective.releaseMouseLook();
        const map = $gameMap, mapId = map.mapId();
        const visibility = this.partySprites(spriteset).map(sprite => ({ sprite, visible: sprite.visible }));
        this.state = {
            scene, spriteset, map, mapId, x: map.displayX(), y: map.displayY(), visibility, hidePlayer: false,
            mapFields: this.fields(map, ['_docsCam2d', '_docsCamera', '_docsCameraTween']),
            screen: typeof $gameScreen !== 'undefined' && $gameScreen
                ? this.fields($gameScreen, ['_zoomX', '_zoomY', '_zoomScale', '_zoomScaleTarget', '_zoomDuration']) : null,
            look: typeof $gameSystem !== 'undefined' && $gameSystem
                ? this.fields($gameSystem, ['_docsLook']) : null,
            cameraExternal: DocsDoodads.Camera2D ? DocsDoodads.Camera2D._external : undefined,
            card: null, lastError: ''
        };
        this.active = true;
        try {
            if (!(DocsDoodads.Perspective && DocsDoodads.Perspective.active && DocsDoodads.Perspective.active()) && DocsDoodads.Camera2D) {
                const camera = DocsDoodads.Camera2D.state();
                if (camera) { camera.path = null; camera.hold = null; camera.follow = 0; camera.free = 'event'; }
                DocsDoodads.Camera2D._external = false;
            }
            this.state.card = this.createUi();
            if (typeof Input !== 'undefined' && Input.clear) Input.clear();
            return true;
        } catch (error) {
            this.close();
            console.warn('[DocsDoodads] Photo Mode could not open:', error);
            return false;
        }
    },

    close() {
        const state = this.state;
        if (!state) { this.active = false; return false; }
        this.active = false;
        this.state = null;
        for (const item of state.visibility) if (item.sprite) item.sprite.visible = item.visible;
        if (typeof $gameMap !== 'undefined' && $gameMap === state.map && $gameMap.mapId() === state.mapId) {
            $gameMap.setDisplayPos(state.x, state.y);
            this.restoreFields($gameMap, state.mapFields);
            if (typeof $gameScreen !== 'undefined' && $gameScreen) this.restoreFields($gameScreen, state.screen);
        }
        if (DocsDoodads.Camera2D) DocsDoodads.Camera2D._external = state.cameraExternal;
        if (typeof $gameSystem !== 'undefined' && $gameSystem) this.restoreFields($gameSystem, state.look);
        if (state.card) {
            if (typeof state.card.remove === 'function') state.card.remove();
            else if (state.card.parentNode) state.card.parentNode.removeChild(state.card);
        }
        if (typeof Input !== 'undefined' && Input.clear) Input.clear();
        return true;
    },

    pan(dx, dy) {
        const state = this.state, map = state && state.map;
        if (!this.active || !map || map !== $gameMap) return false;
        const three = DocsDoodads.Perspective && DocsDoodads.Perspective.active && DocsDoodads.Perspective.active();
        if (three) {
            const current = map._docsCamera || {};
            const resolved = DocsDoodads.Perspective.active() || {};
            map._docsCameraTween = null;
            map._docsCamera = Object.assign({}, current, {
                yaw: ((Number(current.yaw !== undefined ? current.yaw : resolved.yaw) || 0) + Number(dx) * 5 + 360) % 360,
                pitch: Math.max(20, Math.min(89, (Number(current.pitch !== undefined ? current.pitch : resolved.pitch) || 55) + Number(dy) * 3))
            });
            return true;
        }
        const sw = map.screenTileX(), sh = map.screenTileY(), player = typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
        const px = player ? Number(player.x) || 0 : state.x + sw / 2, py = player ? Number(player.y) || 0 : state.y + sh / 2;
        const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
        const maxX = Math.max(0, map.width() - sw), maxY = Math.max(0, map.height() - sh);
        const wantedX = map.displayX() + Number(dx) * 0.5 + sw / 2;
        const wantedY = map.displayY() + Number(dy) * 0.5 + sh / 2;
        let x, y;
        if (map.isLoopHorizontal()) {
            const offset = clamp(map.deltaX(wantedX, px), -this.maxPanTiles, this.maxPanTiles);
            x = map.roundX(px + offset - sw / 2);
        } else {
            const center = clamp(wantedX, px - this.maxPanTiles, px + this.maxPanTiles);
            x = clamp(center - sw / 2, 0, maxX);
        }
        if (map.isLoopVertical()) {
            const offset = clamp(map.deltaY(wantedY, py), -this.maxPanTiles, this.maxPanTiles);
            y = map.roundY(py + offset - sh / 2);
        } else {
            const center = clamp(wantedY, py - this.maxPanTiles, py + this.maxPanTiles);
            y = clamp(center - sh / 2, 0, maxY);
        }
        map.setDisplayPos(x, y);
        return true;
    },

    zoomBy(amount) {
        if (!this.active || typeof $gameScreen === 'undefined' || !$gameScreen) return false;
        const map = this.state.map;
        const three = DocsDoodads.Perspective && DocsDoodads.Perspective.active && DocsDoodads.Perspective.active();
        if (three) {
            const current = map._docsCamera || {}, resolved = DocsDoodads.Perspective.active() || {};
            const zoom = Math.max(0.25, Math.min(4, (Number(current.zoom !== undefined ? current.zoom : resolved.zoom) || 1) + Number(amount)));
            map._docsCameraTween = null; map._docsCamera = Object.assign({}, current, { zoom });
            return true;
        }
        const current = Number($gameScreen._zoomScale) || (typeof $gameScreen.zoomScale === 'function' ? Number($gameScreen.zoomScale()) : 1) || 1;
        const zoom = Math.max(0.5, Math.min(4, current + Number(amount)));
        const x = Graphics.width / 2, y = Graphics.height / 2;
        if (typeof $gameScreen.setZoom === 'function') $gameScreen.setZoom(x, y, zoom);
        else Object.assign($gameScreen, { _zoomX: x, _zoomY: y, _zoomScale: zoom, _zoomScaleTarget: zoom, _zoomDuration: 0 });
        return true;
    },

    selectLook(id) {
        if (!this.active || typeof $gameSystem === 'undefined' || !$gameSystem) return false;
        if (id === 'original') this.restoreFields($gameSystem, this.state.look);
        else if (!DocsDoodads.PostFX.setLook(String(id), 0)) return false;
        return true;
    },

    setHidePlayer(hidden) {
        if (!this.active) return false;
        this.state.hidePlayer = hidden !== false;
        for (const item of this.state.visibility) if (item.sprite) item.sprite.visible = this.state.hidePlayer ? false : item.visible;
        return true;
    },

    save() {
        const state = this.state;
        if (!this.active || !state || typeof $gameMap === 'undefined' || $gameMap !== state.map || $gameMap.mapId() !== state.mapId) return null;
        try {
            const canvas = DocsDoodads.Capture.renderSceneCanvas(state.spriteset);
            if (!canvas) throw new Error('The map is not ready to capture.');
            const result = DocsDoodads.Capture.saveCanvas(canvas, DocsDoodads.Capture.name('photo', state.mapId));
            this.setStatus(result.kind === 'file' ? `Saved ${result.path}` : `Downloaded ${result.name}`);
            return result;
        } catch (error) {
            state.lastError = error.message;
            this.setStatus(error.message, true);
            this.close();
            return null;
        }
    },

    setStatus(text, error) {
        const card = this.state && this.state.card;
        const status = card && card.querySelector ? card.querySelector('[data-photo-status]') : null;
        if (status) { status.textContent = text; status.style.color = error ? '#ff9c9c' : '#d7ffe1'; }
    },

    createUi() {
        if (typeof document === 'undefined' || !document.createElement || !document.body) return null;
        const card = document.createElement('div');
        if (this.state) this.state.card = card;
        card.id = 'docs-photo-mode';
        card.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;max-width:calc(100vw - 24px);padding:10px 12px;border-radius:12px;background:rgba(10,14,22,.88);color:white;font:13px sans-serif;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.5)';
        const looks = [{ id: 'original', label: 'Original' }].concat((DocsDoodads.PostFX.presets || []).map(preset => ({ id: preset.id, label: preset.label })));
        card.innerHTML = `<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:7px">${looks.map(look => `<button type="button" data-photo-look="${look.id}">${look.label}</button>`).join('')}</div>
            <div style="display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap"><span>Arrows: camera &nbsp; Wheel: zoom</span><button type="button" data-photo-hide>Hide Player</button><button type="button" data-photo-save>Save PNG</button><button type="button" data-photo-close>Exit</button></div>
            <div data-photo-status style="font-size:11px;min-height:14px;margin-top:5px;color:#cbd3df"></div>`;
        document.body.appendChild(card);
        if (card.querySelectorAll) for (const button of Array.from(card.querySelectorAll('[data-photo-look]'))) {
            button.onclick = () => this.selectLook(button.getAttribute('data-photo-look'));
        }
        const hide = card.querySelector ? card.querySelector('[data-photo-hide]') : null;
        const save = card.querySelector ? card.querySelector('[data-photo-save]') : null;
        const close = card.querySelector ? card.querySelector('[data-photo-close]') : null;
        if (hide) hide.onclick = () => { this.setHidePlayer(!this.state.hidePlayer); hide.textContent = this.state.hidePlayer ? 'Show Player' : 'Hide Player'; };
        if (save) save.onclick = () => this.save();
        if (close) close.onclick = () => this.close();
        return card;
    },

    keyMatches(event) {
        const parts = String(this.key || '').split('+').map(part => part.trim()).filter(Boolean);
        if (!parts.length) return false;
        let code = '', ctrl = false, shift = false, alt = false;
        for (const part of parts) {
            const lower = part.toLowerCase();
            if (lower === 'ctrl' || lower === 'control' || lower === 'cmd') ctrl = true;
            else if (lower === 'shift') shift = true;
            else if (lower === 'alt' || lower === 'option') alt = true;
            else code = /^[a-z]$/i.test(part) ? `Key${part.toUpperCase()}` : /^[0-9]$/.test(part) ? `Digit${part}` : part;
        }
        return Boolean(code && event && event.code === code && Boolean(event.ctrlKey || event.metaKey) === ctrl
            && Boolean(event.shiftKey) === shift && Boolean(event.altKey) === alt);
    },

    onKey(event) {
        if (!this.active) {
            if (!event.repeat && this.keyMatches(event) && this.open()) { if (event.preventDefault) event.preventDefault(); return true; }
            return false;
        }
        const code = event.code || event.key;
        const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[code];
        let handled = true;
        if (move) this.pan(move[0], move[1]);
        else if (code === 'Escape') this.close();
        else if (code === 'KeyH' || code === 'h' || code === 'H') this.setHidePlayer(!this.state.hidePlayer);
        else if (code === 'KeyS' || code === 's' || code === 'S') this.save();
        else handled = false;
        if (handled && event.preventDefault) event.preventDefault();
        if (handled && event.stopPropagation) event.stopPropagation();
        return handled;
    },

    onWheel(event) {
        if (!this.active) return false;
        this.zoomBy(Number(event.deltaY) > 0 ? -0.15 : 0.15);
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        return true;
    }
};

if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('keydown', event => DocsDoodads.PhotoMode.onKey(event), true);
    window.addEventListener('wheel', event => DocsDoodads.PhotoMode.onWheel(event), { capture: true, passive: false });
}

if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_updateMain_photo = Scene_Map.prototype.updateMain;
    Scene_Map.prototype.updateMain = function() {
        if (DocsDoodads.PhotoMode.active && DocsDoodads.PhotoMode.state.scene === this) return;
        if ($.Scene_Map_updateMain_photo) return $.Scene_Map_updateMain_photo.call(this);
    };
    $.Scene_Map_isMenuCalled_photo = Scene_Map.prototype.isMenuCalled;
    Scene_Map.prototype.isMenuCalled = function() {
        if (DocsDoodads.PhotoMode.active) return false;
        return $.Scene_Map_isMenuCalled_photo ? $.Scene_Map_isMenuCalled_photo.call(this) : false;
    };
    $.Scene_Map_onMapLoaded_photo = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if (DocsDoodads.PhotoMode.active) DocsDoodads.PhotoMode.close();
        if ($.Scene_Map_onMapLoaded_photo) return $.Scene_Map_onMapLoaded_photo.call(this);
    };
    $.Scene_Map_terminate_photo = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (DocsDoodads.PhotoMode.active) DocsDoodads.PhotoMode.close();
        if ($.Scene_Map_terminate_photo) return $.Scene_Map_terminate_photo.call(this);
    };
}

if (typeof Game_Map !== 'undefined') {
    $.Game_Map_setup_photo = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (DocsDoodads.PhotoMode.active) DocsDoodads.PhotoMode.close();
        return $.Game_Map_setup_photo.call(this, mapId);
    };
}

if (typeof Game_Player !== 'undefined') {
    $.Game_Player_canMove_photo = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (DocsDoodads.PhotoMode.active) return false;
        return $.Game_Player_canMove_photo.call(this);
    };
}

if (typeof Sprite_Character !== 'undefined') {
    $.Sprite_Character_updateVisibility_photo = Sprite_Character.prototype.updateVisibility;
    Sprite_Character.prototype.updateVisibility = function() {
        if ($.Sprite_Character_updateVisibility_photo) $.Sprite_Character_updateVisibility_photo.call(this);
        const photo = DocsDoodads.PhotoMode;
        if (photo.active && photo.state && photo.state.hidePlayer && photo.partySprites(photo.state.spriteset).includes(this)) this.visible = false;
    };
}

if (typeof PluginManager !== 'undefined' && PluginManager.registerCommand) {
    PluginManager.registerCommand(pluginName, 'openPhotoMode', () => DocsDoodads.PhotoMode.open());
}
