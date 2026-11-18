//==========================================================
// SECTION 7I: PERSPECTIVE (3D) RUNTIME: MODEL FILES
//==========================================================
// Reading glTF models (17_perspective_runtime_models.js draws them).
// Loaded models by path (project-relative): { ready, error, primitives, textures }.
DocsDoodads.Models = {
    _cache: {},

    // The game's folder, where index.html is (as MZ finds its save folder), not the working directory: a
    // deployed game can be started from a shortcut with another "Start in", or from Finder on macOS.
    root() {
        const path = DocsDoodads.FS.path;
        const main = typeof process !== 'undefined' && process.mainModule && process.mainModule.filename;
        return main ? path.dirname(main) : path.resolve('.');
    },

    // Models, and the files they point to, have to be inside the project folder.
    inside(root, target) {
        const path = DocsDoodads.FS.path;
        const rel = path.relative(root, target);
        return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
    },

    // retry: load again a model that failed (missing, half-copied, broken). Only map setup and live reload
    // ask for that; drawing never does, so a broken model doesn't read files in the middle of play.
    get(path, retry) {
        if (!path) return null;
        const key = String(path).replace(/\\/g, '/');
        const cached = this._cache[key];
        if (cached && !(retry && cached.error)) return cached;
        if (cached) this.release(cached);
        // files: every file the model reads (itself, its buffers and images), for live reload.
        const entry = this._cache[key] = { ready: false, error: null, primitives: [], textures: [], files: [] };
        try {
            const FS = DocsDoodads.FS;
            if (!FS.fs) throw new Error('Models need the desktop game.');
            const root = this.root();
            const file = FS.path.resolve(root, key);
            if (!this.inside(root, file)) throw new Error('Models have to be inside the project folder.');
            entry.files.push(file);
            const dir = FS.path.dirname(file);
            const local = uri => {
                const target = FS.path.resolve(dir, decodeURIComponent(uri));
                if (!this.inside(root, target)) throw new Error('"' + uri + '" is outside the project folder.');
                if (!entry.files.includes(target)) entry.files.push(target);
                return target;
            };
            const doc = DocsDoodads.Gltf.parse(FS.fs.readFileSync(file), uri => FS.fs.readFileSync(local(uri)));
            const mesh = DocsDoodads.Gltf.meshes(doc);
            entry.primitives = mesh.primitives;
            entry.min = mesh.min;
            entry.max = mesh.max;
            // For posing: the node tree, skins and animations.
            entry.nodes = mesh.nodes;
            entry.skins = mesh.skins;
            entry.animations = mesh.animations;
            // Image files load by their place in the project, as the game's own pictures do.
            const url = uri => FS.path.relative(root, local(uri)).split(FS.path.sep).map(encodeURIComponent).join('/');
            const images = new Map();
            entry.textures = mesh.primitives.map(prim => this.texture(prim, url, images));
            // Normal maps load the same way (white: no normal map).
            entry.normalTextures = mesh.primitives.map(prim => (prim.normalImage ? this.texture({ image: prim.normalImage, nearest: false }, url, images) : PIXI.Texture.WHITE));
            entry.ready = true;
        } catch (e) {
            entry.error = e.message;
            entry.failedAt = Date.now();
            if (!cached || cached.error !== e.message) console.warn('[DocsDoodads] Could not load model ' + key + ': ' + e.message);
        }
        if (DocsDoodads.LiveReload && DocsDoodads.LiveReload.watchModels) DocsDoodads.LiveReload.watchModels();
        return entry;
    },

    // The folders holding the files of every model asked for (live reload watches them).
    directories() {
        const path = DocsDoodads.FS.path;
        const dirs = new Set();
        for (const entry of Object.values(this._cache)) for (const file of entry.files || []) dirs.add(path.dirname(file));
        return [...dirs];
    },

    // Loads again every model that reads one of these files (absolute paths). The old textures may
    // still be on screen until the doodads redraw, so they're kept until the map's sprites go
    // (freeRetired). Returns the paths of the models loaded again.
    reloadFiles(files) {
        const norm = f => String(f).replace(/\\/g, '/').toLowerCase();
        const changed = new Set(files.map(norm));
        const keys = Object.keys(this._cache).filter(key => (this._cache[key].files || []).some(f => changed.has(norm(f))));
        for (const key of keys) {
            const old = this._cache[key];
            delete this._cache[key];
            this._retired = (this._retired || []).concat(old.textures || []);
            old.textures = [];
            this.get(key);
        }
        return keys;
    },

    freeRetired() {
        const retired = this._retired || [];
        this._retired = [];
        this.release({ textures: retired });
    },

    // Loads the models a map's doodads use when the map is set up, not in the middle of drawing a frame.
    preload(list) {
        for (const d of list || []) if (d && d.model && d.model.path) this.get(d.model.path, true);
    },

    // The primitive's colour texture (shared between scenes, and between parts using the same image),
    // or plain white until it has loaded.
    texture(prim, url, images) {
        if (!prim.image || typeof Image === 'undefined') return PIXI.Texture.WHITE;
        const id = prim.image.source !== undefined ? prim.image.source + (prim.nearest ? 'n' : 'l') : null;
        if (id !== null && images && images.has(id)) return images.get(id);
        const img = new Image();
        const texture = new PIXI.Texture(new PIXI.BaseTexture(img, { scaleMode: prim.nearest ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR }));
        // Scenes come and go; the texture stays until the model is let go of (release).
        texture.destroy = function() {};
        if (prim.image.bytes) {
            const src = URL.createObjectURL(new Blob([prim.image.bytes], { type: prim.image.mime }));
            if (img.addEventListener) {
                const done = () => URL.revokeObjectURL(src);
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
            }
            img.src = src;
        } else if (/^data:/i.test(prim.image.uri)) {
            img.src = prim.image.uri;
        } else {
            img.src = url(prim.image.uri);
        }
        if (id !== null && images) images.set(id, texture);
        return texture;
    },

    // Frees a model's textures (a model loaded again, or dropped from the cache).
    release(entry) {
        const seen = new Set();
        for (const texture of (entry.textures || []).concat(entry.normalTextures || [])) {
            if (!texture || texture === PIXI.Texture.WHITE || seen.has(texture)) continue;
            seen.add(texture);
            PIXI.Texture.prototype.destroy.call(texture, true);
        }
        entry.textures = [];
        entry.normalTextures = [];
    },

    forget(path) {
        const key = String(path || '').replace(/\\/g, '/');
        if (this._cache[key]) this.release(this._cache[key]);
        delete this._cache[key];
    }
};

if (typeof Spriteset_Map !== 'undefined' && Spriteset_Map.prototype.addDocsDoodads) {
    $.Spriteset_Map_addDocsDoodads_models = Spriteset_Map.prototype.addDocsDoodads;
    Spriteset_Map.prototype.addDocsDoodads = function() {
        DocsDoodads.Models.preload(DocsDoodads.doodads());
        $.Spriteset_Map_addDocsDoodads_models.call(this);
    };
}

// Drawing models (shaders, the CPU and GPU ways, picking) is in 17_perspective_runtime_models.js.

// A doodad's model meshes go with its sprite (scene changes, editor refreshes).
if (typeof Sprite_DocsDoodad !== 'undefined' && Sprite_DocsDoodad.prototype.destroy) {
    $.Sprite_DocsDoodad_destroy_models = Sprite_DocsDoodad.prototype.destroy;
    Sprite_DocsDoodad.prototype.destroy = function(options) {
        for (const mesh of this._docsModelMeshes || []) if (mesh && !mesh._destroyed) mesh.destroy();
        this._docsModelMeshes = null;
        const gpu = this._docsModelGpu;
        this._docsModelGpu = null;
        if (gpu) {
            for (const m of gpu.meshes) if (m && !m._destroyed) m.destroy();
            if (gpu.quad && !gpu.quad._destroyed) gpu.quad.destroy();
            if (gpu.rt) gpu.rt.destroy(true);
        }
        $.Sprite_DocsDoodad_destroy_models.call(this, options);
    };
}

// Both flat and 3D maps can become an unblurred battle background; 3D also uses a low camera.
if (typeof Spriteset_Map !== 'undefined' && typeof Bitmap !== 'undefined' && Bitmap.snap) {
    Spriteset_Map.prototype.docsBattleSnapshot = function(s) {
        const saved = $gameMap._docsCamera;
        return DocsDoodads.BattleCapture.withHidden(this, conceal => {
            try {
                if (s) {
                    $gameMap._docsCamera = Object.assign({}, saved, DocsDoodads.Perspective.battleCamera(s));
                    this.updateDocsPerspective();
                    conceal(); // projection may have refreshed the minimap or created a gear sprite
                }
                return Bitmap.snap(this);
            } finally { if (s) $gameMap._docsCamera = saved; }
        }, () => { if (s) this.updateDocsPerspective(); });
    };
}

if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_snapForBattleBackground_3d = Scene_Map.prototype.snapForBattleBackground;
    Scene_Map.prototype.snapForBattleBackground = function() {
        $.Scene_Map_snapForBattleBackground_3d.call(this);
        if (typeof $gameTemp === 'undefined' || !$gameTemp) return;
        DocsDoodads.Perspective.releaseBattleBack();
        if (DocsDoodads.BattleCapture.named()) return;
        const s = DocsDoodads.Perspective.active();
        const flat = !s && (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).battleBack === true;
        if (((s && s.battleBack) || flat) && this._spriteset && this._spriteset.docsBattleSnapshot) {
            try { $gameTemp._docsBattleBack = this._spriteset.docsBattleSnapshot(s || null); }
            catch (err) { /* retain MZ's already-created background if capture is unavailable */ }
        }
    };
}

if (typeof Sprite_Battleback !== 'undefined') {
    $.Sprite_Battleback_battleback1Bitmap_3d = Sprite_Battleback.prototype.battleback1Bitmap;
    Sprite_Battleback.prototype.battleback1Bitmap = function() {
        const back = typeof $gameTemp !== 'undefined' && $gameTemp ? $gameTemp._docsBattleBack : null;
        return (back && !DocsDoodads.BattleCapture.named()) ? back : $.Sprite_Battleback_battleback1Bitmap_3d.call(this);
    };
    $.Sprite_Battleback_battleback2Bitmap_3d = Sprite_Battleback.prototype.battleback2Bitmap;
    // The map picture covers both layers; the second is left empty (one blank picture, shared).
    Sprite_Battleback.prototype.battleback2Bitmap = function() {
        const back = typeof $gameTemp !== 'undefined' && $gameTemp ? $gameTemp._docsBattleBack : null;
        if (!back || DocsDoodads.BattleCapture.named()) return $.Sprite_Battleback_battleback2Bitmap_3d.call(this);
        if (!DocsDoodads.Perspective._blankBack || !DocsDoodads.Perspective._blankBack.baseTexture) DocsDoodads.Perspective._blankBack = new Bitmap(1, 1);
        return DocsDoodads.Perspective._blankBack;
    };
}

// The map picture taken for a battle is freed when the battle ends or another is taken.
DocsDoodads.Perspective.releaseBattleBack = function() {
    if (typeof $gameTemp === 'undefined' || !$gameTemp) return;
    const back = $gameTemp._docsBattleBack;
    $gameTemp._docsBattleBack = null;
    if (back && back.destroy && back.baseTexture) back.destroy();
};

if (typeof Scene_Battle !== 'undefined') {
    $.Scene_Battle_terminate_3d = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        $.Scene_Battle_terminate_3d.call(this);
        DocsDoodads.Perspective.releaseBattleBack();
    };
}

// Show World Map: the whole map, or a globe on planet-shaped 3D maps, until OK or Cancel.
function Scene_DocsWorldMap() {
    this.initialize(...arguments);
}
DocsDoodads.Scene_DocsWorldMap = Scene_DocsWorldMap;

if (typeof Scene_MenuBase !== 'undefined') {
    Scene_DocsWorldMap.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_DocsWorldMap.prototype.constructor = Scene_DocsWorldMap;

    Scene_DocsWorldMap.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        let map = DocsDoodads.Minimap.forCurrentMap();
        const s = DocsDoodads.Perspective.active();
        // With fog of war, the world map shows only what has been seen, as the minimap does.
        if (map && DocsDoodads.Minimap.settingsFor($gameMap.mapId()).fog) {
            const seen = DocsDoodads.Explored.entry($gameMap.mapId(), map.width, map.height);
            map = Object.assign({}, map, { pixels: DocsDoodads.Minimap.withFog(map.pixels, map.width, map.height, seen) });
        }
        this._map = map;
        this._globe = Boolean(s && s.curve === 'sphere');
        this._spin = 0;
        this._picture = new Sprite();
        this.addChild(this._picture);
        this._marker = new PIXI.Graphics();
        this.addChild(this._marker);
        this.drawWorldMap();
    };

    Scene_DocsWorldMap.prototype.drawWorldMap = function() {
        const map = this._map;
        if (!map) return;
        const M = DocsDoodads.Minimap;
        const px = $gamePlayer.x, py = $gamePlayer.y;
        // The band the picture may use: all the screen, or what a help line (pins and fast travel) leaves free.
        const band = this._docsArea || { top: 0, bottom: Graphics.height };
        const top = Math.max(0, Number(band.top) || 0), room = Math.max(60, Math.min(Graphics.height, Number(band.bottom) || Graphics.height) - top);
        this._marker.clear();
        if (this._globe) {
            const size = Math.max(60, Math.min(Graphics.width, room) - 60);
            const canvas = M.canvasFor(M.globePixels(map.pixels, map.width, map.height, size, px + 0.5, py + 0.5, this._spin), size, size);
            const bitmap = this.worldMapBitmap(size, size);
            bitmap.context.clearRect(0, 0, size, size);
            bitmap.context.drawImage(canvas, 0, 0);
            this._picture.bitmap.baseTexture.update();
            this._picture.x = (Graphics.width - size) / 2;
            this._picture.y = top + (room - size) / 2;
            // The player faces the viewer at the centre until the globe is turned.
            if (Math.abs(this._spin) < 1e-6) this._marker.beginFill(0xffffff).lineStyle(2, 0x000000).drawCircle(Graphics.width / 2, top + room / 2, 5).endFill();
        } else {
            const scale = Math.max(0.1, Math.min((Graphics.width - 60) / map.width, (room - 60) / map.height));
            const canvas = M.canvasFor(map.pixels, map.width, map.height);
            const w = Math.round(map.width * scale), h = Math.round(map.height * scale);
            this.worldMapBitmap(w, h);
            this._picture.bitmap.context.imageSmoothingEnabled = false;
            this._picture.bitmap.context.drawImage(canvas, 0, 0, w, h);
            this._picture.bitmap.baseTexture.update();
            this._picture.x = (Graphics.width - w) / 2;
            this._picture.y = top + (room - h) / 2;
            this._marker.beginFill(0xffffff).lineStyle(2, 0x000000).drawCircle(this._picture.x + (px + 0.5) * scale, this._picture.y + (py + 0.5) * scale, 5).endFill();
        }
    };

    // One picture, redrawn while the globe turns (a new one each frame would pile up until the scene ends).
    Scene_DocsWorldMap.prototype.worldMapBitmap = function(w, h) {
        const old = this._picture.bitmap;
        if (old && old.width === w && old.height === h) return old;
        if (old) old.destroy();
        return (this._picture.bitmap = new Bitmap(w, h));
    };

    Scene_DocsWorldMap.prototype.terminate = function() {
        Scene_MenuBase.prototype.terminate.call(this);
        if (this._picture && this._picture.bitmap) {
            const bitmap = this._picture.bitmap;
            this._picture.bitmap = null;
            bitmap.destroy();
        }
    };

    Scene_DocsWorldMap.prototype.update = function() {
        Scene_MenuBase.prototype.update.call(this);
        if (this._globe && (Input.isPressed('left') || Input.isPressed('right'))) {
            this._spin += Input.isPressed('left') ? -0.05 : 0.05;
            this.drawWorldMap();
        }
        if (Input.isTriggered('ok') || Input.isTriggered('cancel') || TouchInput.isCancelled() || TouchInput.isTriggered()) {
            SoundManager.playCancel();
            this.popScene();
        }
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'showWorldMap', () => {
        if (typeof SceneManager !== 'undefined' && typeof Scene_DocsWorldMap.prototype.create === 'function') SceneManager.push(Scene_DocsWorldMap);
    });
    PluginManager.registerCommand(pluginName, 'setMinimap', args => {
        if (typeof $gameSystem !== 'undefined' && $gameSystem) $gameSystem._docsMinimapHidden = String(args.show) === 'false' ? true : undefined;
    });
    PluginManager.registerCommand(pluginName, 'exploredMap', args => DocsDoodads.Minimap.exploredCommand(args));
}

// The ground height (tiles) under a character, for event conditions and scripts:
// DocsDoodads.Terrain.heightOf($gamePlayer) in a Conditional Branch script.
DocsDoodads.Terrain.heightOf = function(character) {
    const g = this.grid(true);
    if (!g || !character) return 0;
    return this.tileHeight(g, character.x, character.y);
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'storeHeight', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        const id = Number(args.variableId) || 0;
        if (id > 0 && typeof $gameVariables !== 'undefined') $gameVariables.setValue(id, Math.round(DocsDoodads.Terrain.heightOf(ch)));
    });
}

