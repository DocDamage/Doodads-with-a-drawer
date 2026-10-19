// scratch/engine/fake_engine.js
// A small stand-in for PIXI and the RPG Maker MZ classes the plugin hooks into, so the drawing code
// (spritesets, character sprites, the 3D view) can run under Node. Nothing is drawn: renderers record
// calls, textures are plain objects. Load it with install() before requiring the plugin.
'use strict';

function makeCanvas(w = 1, h = 1) {
    const canvas = { width: w, height: h, style: {} };
    const ctx = {
        canvas, fillStyle: '', strokeStyle: '', globalAlpha: 1, imageSmoothingEnabled: true, font: '', globalCompositeOperation: 'source-over',
        createRadialGradient: () => ({ addColorStop() {} }), createLinearGradient: () => ({ addColorStop() {} }),
        fillRect() {}, clearRect() {}, strokeRect() {}, beginPath() {}, closePath() {}, arc() {}, fill() {}, stroke() {}, moveTo() {}, lineTo() {},
        quadraticCurveTo() {}, save() {}, restore() {}, translate() {}, scale() {}, rotate() {}, drawImage() {}, fillText() {}, measureText: t => ({ width: String(t).length * 6 }),
        getImageData: (x, y, iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(Math.max(1, iw * ih) * 4) }),
        createImageData: (iw, ih) => ({ width: iw, height: ih, data: new Uint8ClampedArray(Math.max(1, iw * ih) * 4) }),
        putImageData() {}, setTransform() {}, resetTransform() {}, ellipse() {}, rect() {}, clip() {}, setLineDash() {}, bezierCurveTo() {}, arcTo() {}, strokeText() {},
        createPattern: () => ({}), lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', shadowBlur: 0, shadowColor: '', textAlign: 'left', textBaseline: 'alphabetic'
    };
    canvas.getContext = () => ctx;
    canvas.toDataURL = () => 'data:image/png;base64,';
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h });
    canvas.addEventListener = () => {};
    canvas.removeEventListener = () => {};
    return canvas;
}

function install() {
    const g = global;
    g.window = g;
    g.window.addEventListener = () => {};
    g.window.removeEventListener = () => {};
    if (!g.navigator) Object.defineProperty(g, 'navigator', { value: { userAgent: 'node' }, configurable: true });
    const elements = {};
    g.document = {
        createElement: tag => (tag === 'canvas' ? makeCanvas() : { tagName: String(tag).toUpperCase(), style: {}, children: [], appendChild() {}, removeChild() {}, remove() {},
            querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, removeEventListener() {}, setAttribute() {}, getContext: () => makeCanvas().getContext('2d') }),
        body: { appendChild() {}, removeChild() {}, contains: () => false },
        getElementById: id => elements[id] || null,
        querySelectorAll: () => [],
        addEventListener() {}, removeEventListener() {}
    };
    g.Image = class { constructor() { this.width = 4; this.height = 4; this.naturalWidth = 4; this.naturalHeight = 4; } set src(v) { this._src = v; } get src() { return this._src; } };
    g.Blob = g.Blob || class { constructor(parts) { this.parts = parts; } };
    g.URL = g.URL || {};
    g.URL.createObjectURL = () => 'blob:fake';
    g.requestAnimationFrame = () => 0;

    // ---------------- PIXI ----------------
    class Point { constructor(x = 0, y = 0) { this.x = x; this.y = y; } set(x = 0, y = x) { this.x = x; this.y = y; return this; } copyFrom(p) { this.x = p.x; this.y = p.y; return this; } clone() { return new Point(this.x, this.y); } }
    class Matrix {
        constructor(a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0) { this.set(a, b, c, d, tx, ty); }
        set(a, b, c, d, tx, ty) { Object.assign(this, { a, b, c, d, tx, ty }); return this; }
        copyFrom(m) { return this.set(m.a, m.b, m.c, m.d, m.tx, m.ty); }
        identity() { return this.set(1, 0, 0, 1, 0, 0); }
        apply(p, out) { out = out || new Point(); const x = p.x, y = p.y; out.x = this.a * x + this.c * y + this.tx; out.y = this.b * x + this.d * y + this.ty; return out; }
    }
    class Rectangle { constructor(x = 0, y = 0, width = 0, height = 0) { Object.assign(this, { x, y, width, height }); } clone() { return new Rectangle(this.x, this.y, this.width, this.height); } }
    let uid = 1;
    class BaseTexture {
        constructor(resource, opts = {}) { this.uid = uid++; this.cacheId = 'bt' + this.uid; this.resource = { source: resource || makeCanvas(4, 4) };
            this.width = (resource && resource.width) || 4; this.height = (resource && resource.height) || 4; this.valid = true; this.scaleMode = opts.scaleMode || 1; this.destroyed = false; }
        update() {} destroy() { this.destroyed = true; this.valid = false; } setSize(w, h) { this.width = w; this.height = h; }
        static from(source) { return new BaseTexture(source); }
    }
    class Texture {
        constructor(baseTexture, frame) { this.baseTexture = baseTexture || new BaseTexture(); this._frame = frame || new Rectangle(0, 0, this.baseTexture.width, this.baseTexture.height);
            this._uvs = {}; this.valid = true; this.rotate = 0; this.orig = this._frame; }
        get frame() { return this._frame; }
        set frame(f) { this._frame = f; this.orig = f; }
        get width() { return this._frame.width; }
        get height() { return this._frame.height; }
        update() {}
        destroy(destroyBase) { if (destroyBase && this.baseTexture) this.baseTexture.destroy(); this.baseTexture = null; this._uvs = null; this.valid = false; }
        static from(source) { return new Texture(new BaseTexture(source)); }
    }
    Texture.WHITE = new Texture(new BaseTexture(makeCanvas(16, 16)));
    Texture.WHITE.destroy = () => {};
    Texture.EMPTY = new Texture(new BaseTexture(makeCanvas(1, 1)));
    Texture.EMPTY.destroy = () => {};
    class RenderTexture extends Texture {
        static create(opts, h) { const w = typeof opts === 'object' ? opts.width : opts; const hh = typeof opts === 'object' ? opts.height : h;
            const rt = new RenderTexture(new BaseTexture(makeCanvas(w, hh)), new Rectangle(0, 0, w, hh)); rt.baseTexture.width = w; rt.baseTexture.height = hh; return rt; }
        resize(w, h) { this.frame = new Rectangle(0, 0, w, h); }
    }
    class Transform { constructor() { this.worldTransform = new Matrix(); this.localTransform = new Matrix(); this._worldID = 0; this._parentID = 0; } }
    // Container, Sprite, Graphics and Mesh are plain constructor functions, as in MZ's pixi.js build:
    // the plugin calls PIXI.Sprite.call(this) and PIXI.Container.call(this).
    function Container() {
        this.children = []; this.parent = null; this.x = 0; this.y = 0; this.visible = true; this.renderable = true; this.alpha = 1; this.worldAlpha = 1;
        this.scale = new Point(1, 1); this.pivot = new Point(); this.skew = new Point(); this.rotation = 0; this.filters = null; this.mask = null; this.transform = new Transform();
        this.zIndex = 0; this._destroyed = false;
        const self = this;
        this.position = { set(x, y) { self.x = x; self.y = y; } };
    }
    Object.defineProperty(Container.prototype, 'worldTransform', { get() { return this.transform.worldTransform; }, configurable: true });
    Object.assign(Container.prototype, {
        addChild(...items) { for (const c of items) { if (c.parent) c.parent.removeChild(c); c.parent = this; this.children.push(c); } return items[0]; },
        addChildAt(c, i) { if (c.parent) c.parent.removeChild(c); c.parent = this; this.children.splice(Math.max(0, Math.min(i, this.children.length)), 0, c); return c; },
        removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); c.parent = null; } return c; },
        removeChildren() { const old = this.children; this.children = []; old.forEach(c => { c.parent = null; }); return old; },
        getChildIndex(c) { return this.children.indexOf(c); },
        setChildIndex(c, i) { this.removeChild(c); this.addChildAt(c, i); },
        updateTransform() {
            const p = this.parent ? this.parent.worldTransform : new Matrix();
            this.transform.worldTransform.set(p.a * this.scale.x, p.b, p.c, p.d * this.scale.y, p.a * this.x + p.c * this.y + p.tx, p.b * this.x + p.d * this.y + p.ty);
            this.worldAlpha = this.alpha * (this.parent ? this.parent.worldAlpha : 1);
            for (const c of this.children) c.updateTransform();
        },
        render(renderer) { if (!this.visible || !this.renderable) return; if (renderer) renderer.drawn++; if (this._render) this._render(renderer); for (const c of this.children) c.render(renderer); },
        getBounds() { return new Rectangle(this.x, this.y, this.width || 0, this.height || 0); },
        getLocalBounds() { return new Rectangle(0, 0, this.width || 0, this.height || 0); },
        destroy(options) {
            this._destroyed = true;
            if (this.parent) this.parent.removeChild(this);
            const kids = this.children.slice();
            this.children = [];
            if (options && options.children) kids.forEach(c => c.destroy(options));
        },
        sortChildren() {}, on() { return this; }, off() { return this; }, once() { return this; }
    });

    function Sprite(texture) {
        Container.call(this);
        this._texture = texture || Texture.EMPTY; this.anchor = new Point(0, 0); this.tint = 0xffffff; this.blendMode = 0;
    }
    Sprite.prototype = Object.create(Container.prototype);
    Sprite.prototype.constructor = Sprite;
    Object.defineProperty(Sprite.prototype, 'texture', { get() { return this._texture; }, set(t) { this._texture = t || Texture.EMPTY; }, configurable: true });
    Object.defineProperty(Sprite.prototype, 'width', {
        get() { return Math.abs(this.scale.x) * (this._texture && this._texture.frame ? this._texture.frame.width : 0); },
        set(v) { const w = this._texture && this._texture.frame ? this._texture.frame.width : 1; this.scale.x = v / (w || 1); }, configurable: true });
    Object.defineProperty(Sprite.prototype, 'height', {
        get() { return Math.abs(this.scale.y) * (this._texture && this._texture.frame ? this._texture.frame.height : 0); },
        set(v) { const h = this._texture && this._texture.frame ? this._texture.frame.height : 1; this.scale.y = v / (h || 1); }, configurable: true });
    Sprite.prototype.destroy = function(options) {
        if (options && options.texture && this._texture) this._texture.destroy(Boolean(options.baseTexture));
        Container.prototype.destroy.call(this, options);
    };

    // PIXI's TilingSprite: its own width and height, with a tile scale and offset.
    function PixiTilingSprite(texture, width, height) { Sprite.call(this, texture); this._w = width || 100; this._h = height || 100; this.tileScale = new Point(1, 1); this.tilePosition = new Point(); }
    PixiTilingSprite.prototype = Object.create(Sprite.prototype);
    PixiTilingSprite.prototype.constructor = PixiTilingSprite;
    Object.defineProperty(PixiTilingSprite.prototype, 'width', { get() { return this._w; }, set(v) { this._w = v; }, configurable: true });
    Object.defineProperty(PixiTilingSprite.prototype, 'height', { get() { return this._h; }, set(v) { this._h = v; }, configurable: true });

    function Graphics() { Container.call(this); this.geometry = { graphicsData: [] }; this.tint = 0xffffff; this.blendMode = 0; }
    Graphics.prototype = Object.create(Container.prototype);
    Graphics.prototype.constructor = Graphics;
    Object.assign(Graphics.prototype, {
        clear() { this.geometry.graphicsData = []; return this; },
        lineStyle() { return this; }, beginFill(color, alpha) { this._fill = { color, alpha, visible: true }; return this; }, endFill() { this._fill = null; return this; },
        drawRect(x, y, w, h) { this.geometry.graphicsData.push({ shape: new Rectangle(x, y, w, h), fillStyle: this._fill || { visible: false } }); return this; },
        drawCircle(x, y, r) { this.geometry.graphicsData.push({ shape: { x, y, r }, fillStyle: this._fill || { visible: false } }); return this; },
        drawEllipse() { return this; }, drawRoundedRect(x, y, w, h) { return this.drawRect(x, y, w, h); }, drawPolygon() { return this; },
        moveTo() { return this; }, lineTo() { return this; }, closePath() { return this; }, quadraticCurveTo() { return this; }, arc() { return this; }
    });

    function Mesh(geometry, shader) { Container.call(this); this.geometry = geometry; this.shader = shader; this.start = 0; this.size = 0; this.blendMode = 0; }
    Mesh.prototype = Object.create(Container.prototype);
    Mesh.prototype.constructor = Mesh;
    class Buffer { constructor(data) { this.data = data; } update(d) { if (d) this.data = d; } }
    class Geometry {
        constructor() { this.buffers = {}; this.index = null; this.refCount = 0; }
        addAttribute(name, data, size) { this.buffers[name] = new Buffer(Array.isArray(data) ? new Float32Array(data) : data); this.buffers[name].size = size; return this; }
        addIndex(data) { this.index = new Buffer(Array.isArray(data) ? new Uint16Array(data) : data); return this; }
        getBuffer(name) { return this.buffers[name]; }
        getIndex() { return this.index; }
        destroy() {}
    }
    class Shader { constructor(uniforms) { this.uniforms = Object.assign({}, uniforms); } static from(v, f, uniforms) { if (typeof v === 'string' && typeof f === 'string') Shader.compiled.push([v, f]); return new Shader(uniforms); } }
    Shader.compiled = [];
    class Filter { constructor(v, f, uniforms) { this.uniforms = Object.assign({}, uniforms); this.enabled = true; } apply() {} }
    class BlurFilter extends Filter { constructor(strength = 8, quality = 4) { super(); this.blur = strength; this.quality = quality; } }
    class AlphaFilter extends Filter { constructor(alpha = 1) { super(); this.alpha = alpha; } }
    class ColorMatrixFilter extends Filter { constructor() { super(); this.matrix = []; } reset() {} brightness() {} saturate() {} hue() {} }
    g.PIXI = {
        Point, ObservablePoint: Point, Matrix, Rectangle, BaseTexture, Texture, RenderTexture, Container, Sprite, TilingSprite: PixiTilingSprite, Graphics, Geometry, Shader, Mesh, Filter,
        filters: { BlurFilter, AlphaFilter, ColorMatrixFilter }, Buffer, Transform,
        BLEND_MODES: { NORMAL: 0, ADD: 1, MULTIPLY: 2, SCREEN: 3 }, SCALE_MODES: { NEAREST: 0, LINEAR: 1 }, CLEAR_MODES: { NO: 0, YES: 1, BLIT: 2, CLEAR: 1 },
        DRAW_MODES: { TRIANGLES: 4 }, settings: {}, utils: { hex2rgb: h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255] }
    };

    // ---------------- MZ core ----------------
    const renderer = {
        drawn: 0, renders: 0,
        render(obj) { this.renders++; },
        extract: { pixels: rt => new Uint8Array(Math.max(1, rt.width * rt.height) * 4), canvas: rt => makeCanvas(rt.width, rt.height) },
        batch: { flush() {} }, gl: { viewport() {} }, view: { width: 816, height: 624 }, screen: { x: 0, y: 0, width: 816, height: 624 }, plugins: {},
        renderTexture: { bind() {} }, framebuffer: {}
    };
    g.Graphics = { width: 816, height: 624, boxWidth: 816, boxHeight: 624, frameCount: 0, app: { renderer }, _app: { renderer }, _canvas: makeCanvas(816, 624),
        pageToCanvasX: x => x, pageToCanvasY: y => y, isInsideCanvas: () => true, _errorPrinter: { innerText: '', innerHTML: '' }, effekseer: null };
    class Bitmap {
        constructor(width = 0, height = 0) { this.width = Math.max(0, width); this.height = Math.max(0, height); this._canvas = makeCanvas(this.width || 1, this.height || 1);
            this._baseTexture = new BaseTexture(this._canvas); this._baseTexture.width = this.width || 1; this._baseTexture.height = this.height || 1; this._url = ''; this.smooth = true; this._image = this._canvas; }
        get baseTexture() { return this._baseTexture; }
        get canvas() { return this._canvas; }
        get context() { return this._canvas.getContext('2d'); }
        isReady() { return true; } isError() { return false; } addLoadListener(cb) { cb(this); }
        blt() {} clear() {} fillRect() {} fillAll() {} clearRect() {} drawText() {} measureTextWidth(t) { return String(t).length * 6; } destroy() {}
        static load(url) { const b = new Bitmap(96, 96); b._url = url; return b; }
        static snap() { return new Bitmap(816, 624); }
    }
    g.Bitmap = Bitmap;
    const cache = {};
    const load = (folder, name, w, h) => { const key = folder + name; if (!cache[key]) { cache[key] = new Bitmap(name ? w : 0, name ? h : 0); cache[key]._url = folder + name + '.png'; } return cache[key]; };
    g.ImageManager = {
        _cache: cache,
        loadCharacter: n => load('img/characters/', n, String(n).includes('$') ? 144 : 576, String(n).includes('$') ? 192 : 384),
        loadBitmap: (folder, n) => load(folder, n, 96, 96), loadBitmapFromUrl: url => load('', url, 96, 96),
        loadTileset: n => load('img/tilesets/', n, 768, 768), loadParallax: n => load('img/parallaxes/', n, 816, 624), loadSystem: n => load('img/system/', n, 96, 96),
        loadPicture: n => load('img/pictures/', n, 96, 96), loadFace: n => load('img/faces/', n, 576, 288), loadSvActor: n => load('img/sv_actors/', n, 576, 384),
        loadAnimation: n => load('img/animations/', n, 192, 192), loadEnemy: n => load('img/enemies/', n, 152, 156),
        isBigCharacter: n => /^[!$]*\$/.test(n), isObjectCharacter: n => /^[!$]*!/.test(n), iconWidth: 32, iconHeight: 32,
        _system: {}, _emptyBitmap: new Bitmap(1, 1),
        // As MZ: a failed picture in the cache stops the game ("Failed to load").
        isReady() { for (const c of [this._cache, this._system]) for (const url in c) { if (c[url].isError()) throw new Error('Failed to load: ' + url); if (!c[url].isReady()) return false; } return true; }
    };
    class MzSprite extends Sprite {
        constructor(bitmap) { super(); this._bitmap = null; this._frame = new Rectangle(); this.spriteId = MzSprite._counter++; this._hue = 0; this._blendColor = [0, 0, 0, 0]; this._colorTone = [0, 0, 0, 0]; this.bitmap = bitmap || null; }
        get bitmap() { return this._bitmap; }
        set bitmap(b) { this._bitmap = b; if (b) { this.texture = new Texture(b.baseTexture, new Rectangle(0, 0, b.width, b.height)); this._frame = new Rectangle(0, 0, b.width, b.height); } else this.texture = Texture.EMPTY; }
        get opacity() { return this.alpha * 255; }
        set opacity(v) { this.alpha = Math.max(0, Math.min(255, v)) / 255; }
        setFrame(x, y, w, h) { this._frame = new Rectangle(x, y, w, h); if (this._bitmap) this.texture.frame = new Rectangle(x, y, w, h); }
        setHue(h) { this._hue = h; } getBlendColor() { return this._blendColor.slice(); } setBlendColor(c) { this._blendColor = c.slice(); }
        getColorTone() { return this._colorTone.slice(); } setColorTone(t) { this._colorTone = t.slice(); }
        show() { this.visible = true; } hide() { this.visible = false; } move(x, y) { this.x = x; this.y = y; }
        update() { for (const c of this.children) if (c.update) c.update(); }
        updateVisibility() {}
    }
    MzSprite._counter = 1;
    g.Sprite = MzSprite;
    class TilingSprite extends MzSprite { constructor(bitmap) { super(bitmap); this.origin = new Point(); } }
    g.TilingSprite = TilingSprite;
    class ScreenSprite extends MzSprite { setColor() {} }
    g.ScreenSprite = ScreenSprite;
    class Tilemap extends Container {
        constructor() { super(); this._mapData = null; this._mapWidth = 0; this._mapHeight = 0; this.horizontalWrap = false; this.verticalWrap = false; this.tileWidth = 48; this.tileHeight = 48;
            this.width = 816; this.height = 624; this.origin = new Point(); this.flags = []; this._bitmaps = []; this.animationCount = 0;
            this._lowerLayer = new Container(); this._upperLayer = new Container(); this._lowerLayer.z = 0; this._upperLayer.z = 4; this.addChild(this._lowerLayer); this.addChild(this._upperLayer); this.refreshes = 0; }
        setData(w, h, data) { this._mapWidth = w; this._mapHeight = h; this._mapData = data; }
        setBitmaps(b) { this._bitmaps = b; }
        refresh() { this.refreshes++; }
        _readMapData(x, y, z) {
            if (!this._mapData) return 0;
            const w = this._mapWidth, h = this._mapHeight;
            if (this.horizontalWrap) x = ((x % w) + w) % w;
            if (this.verticalWrap) y = ((y % h) + h) % h;
            return x >= 0 && x < w && y >= 0 && y < h ? this._mapData[(z * h + y) * w + x] || 0 : 0;
        }
        _compareChildOrder(a, b) { return (a.z || 0) - (b.z || 0) || (a.y || 0) - (b.y || 0) || (a.spriteId || 0) - (b.spriteId || 0); }
        update() { this.animationCount++; for (const c of this.children) if (c.update) c.update(); }
        static isWaterTile(id) { return id >= 2048 && id < 2816; }
    }
    Tilemap.TILE_ID_A5 = 1536;
    g.Tilemap = Tilemap;
    g.Rectangle = Rectangle;
    g.Point = Point;
    g.ColorFilter = class extends Filter { setHue() {} setColorTone() {} setBlendColor() {} setBrightness() {} };
    g.ToneFilter = g.ColorFilter;
    g.JsonEx = { makeDeepCopy: o => JSON.parse(JSON.stringify(o)), stringify: JSON.stringify, parse: JSON.parse };
    g.Input = { _pressed: {}, isPressed(k) { return Boolean(this._pressed[k]); }, isTriggered(k) { return Boolean(this._pressed[k]); }, isRepeated() { return false; }, dir4: 0, dir8: 0, clear() { this._pressed = {}; } };
    g.TouchInput = { x: 0, y: 0, isPressed: () => false, isTriggered: () => false, isCancelled: () => false, isMoved: () => false, isReleased: () => false };
    g.SoundManager = { playCursor() {}, playOk() {}, playCancel() {}, playBuzzer() {} };
    const audioBuffer = (folder, name) => ({ _url: 'audio/' + folder + name, url: 'audio/' + folder + name, volume: 1, pitch: 1, pan: 0, _playing: false,
        play(loop) { this._playing = true; this._loop = loop; }, stop() { this._playing = false; }, fadeIn() {}, fadeOut() {}, addLoadListener(cb) { cb(); }, addStopListener() {},
        isPlaying() { return this._playing; }, isReady() { return true; }, isError() { return false; }, seek() { return 0; }, destroy() { this._playing = false; } });
    g.AudioManager = { _bgsBuffer: null, _seBuffers: [], _staticBuffers: [], seVolume: 100, bgsVolume: 100, _currentBgs: null, _path: 'audio/',
        createBuffer(folder, name) { return audioBuffer(folder, name); }, playSe(se) { const b = this.createBuffer('se/', se.name); this.updateSeParameters(b, se); b.play(false); this._seBuffers.push(b); },
        playBgs(bgs) { this._bgsBuffer = this.createBuffer('bgs/', bgs.name); this._currentBgs = bgs; this._bgsBuffer.play(true); }, stopBgs() { if (this._bgsBuffer) this._bgsBuffer.stop(); this._bgsBuffer = null; },
        fadeOutBgs() {}, fadeInBgs() {}, replayBgs() {}, saveBgs() { return this._currentBgs || { name: '', volume: 0, pitch: 0, pan: 0 }; },
        loadStaticSe() {}, playStaticSe() {}, updateSeParameters(b, se) { this.updateBufferParameters(b, this.seVolume, se); },
        updateBgsParameters(bgs) { if (this._bgsBuffer) this.updateBufferParameters(this._bgsBuffer, this.bgsVolume, bgs); },
        _bgmBuffer: null, _currentBgm: null, bgmVolume: 100, _bgsVolume: 100,
        playBgm(bgm) { this._bgmBuffer = this.createBuffer('bgm/', bgm.name); this._currentBgm = bgm; this.updateBgmParameters(bgm); this._bgmBuffer.play(true); },
        updateBgmParameters(bgm) { if (this._bgmBuffer) this.updateBufferParameters(this._bgmBuffer, this.bgmVolume, bgm); },
        updateBufferParameters(b, v, a) { if (b && a) { b.volume = (v * (a.volume || 0)) / 10000; b.pitch = (a.pitch || 100) / 100; b.pan = (a.pan || 0) / 100; } },
        makeEmptyAudioObject() { return { name: '', volume: 0, pitch: 0 }; }, stopSe() {}, checkErrors() {} };
    g.ConfigManager = { docsFxQuality: 0, docsMotionBlur: true, touchUI: false, makeData: () => ({}), applyData() {}, save() {} };
    g.DataManager = { isBattleTest: () => false, isEventTest: () => false, loadDatabase() {}, isDatabaseLoaded: () => true };
    g.StorageManager = {};
    g.PluginManager = { parameters: () => ({}), _commands: {}, registerCommand(p, n, f) { this._commands[p + ':' + n] = f; },
        callCommand(self, p, n, args) { const f = this._commands[p + ':' + n]; if (f) f.call(self, args); } };
    g.Utils = { RPGMAKER_NAME: 'MZ', RPGMAKER_VERSION: '1.10.0', isNwjs: () => false, isOptionValid: o => o === 'test', isMobileDevice: () => false, encodeURI: s => s, escapeHtml: s => s };

    // ---------------- Game objects ----------------
    class Game_CharacterBase {
        constructor() { this._x = 0; this._y = 0; this._realX = 0; this._realY = 0; this._direction = 2; this._moveSpeed = 4; this._priorityType = 1; this._characterName = 'Actor1';
            this._characterIndex = 0; this._tileId = 0; this._transparent = false; this._jumpCount = 0; this._jumpPeak = 0; this._pattern = 1; this._opacity = 255; this._blendMode = 0;
            this._bushDepth = 0; this._movementSuccess = true; this._stepAnime = false; this._walkAnime = true; this._through = false; }
        get x() { return this._x; } get y() { return this._y; }
        locate(x, y) { this._x = this._realX = x; this._y = this._realY = y; }
        pos(x, y) { return this._x === x && this._y === y; }
        screenX() { return Math.round($gameMap.adjustX(this._realX) * 48 + 24); }
        screenY() { return Math.round($gameMap.adjustY(this._realY) * 48 + 48 - this.shiftY() - this.jumpHeight()); }
        screenZ() { return this._priorityType * 2 + 1; }
        shiftY() { return 6; }
        direction() { return this._direction; } setDirection(d) { this._direction = d; }
        characterName() { return this._characterName; } characterIndex() { return this._characterIndex; } tileId() { return this._tileId; }
        setImage(n, i) { this._characterName = n; this._characterIndex = i; }
        isTransparent() { return this._transparent; } opacity() { return this._opacity; } blendMode() { return this._blendMode; } bushDepth() { return this._bushDepth; }
        jumpHeight() { return (this._jumpPeak * this._jumpPeak - Math.pow(Math.abs(this._jumpCount - this._jumpPeak), 2)) / 2; }
        isJumping() { return this._jumpCount > 0; } isMoving() { return this._realX !== this._x || this._realY !== this._y; }
        pattern() { return this._pattern; } setPattern(p) { this._pattern = p; } maxPattern() { return 4; } isOriginalPattern() { return this._pattern === 1; } resetPattern() { this._pattern = 1; }
        canPass(x, y, d) { const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d); return $gameMap.isValid(x2, y2) && this.isMapPassable(x, y, d); }
        isMapPassable(x, y, d) { const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d); return $gameMap.isPassable(x, y, d) && $gameMap.isPassable(x2, y2, 10 - d); }
        isOnLadder() { return $gameMap.isLadder(this._x, this._y); } refreshBushDepth() { this._bushDepth = 0; } hasWalkAnime() { return this._walkAnime; }
        setMovementSuccess(s) { this._movementSuccess = s; } isMovementSucceeded() { return this._movementSuccess; }
        moveStraight(d) { this.setMovementSuccess(this.canPass(this._x, this._y, d)); if (this.isMovementSucceeded()) { this.setDirection(d);
            this._x = $gameMap.roundXWithDirection(this._x, d); this._y = $gameMap.roundYWithDirection(this._y, d); this._realX = this._x; this._realY = this._y; this.increaseSteps(); } }
        moveDiagonally(h, v) { this.moveStraight(h); }
        jump(xPlus, yPlus) { this._x += xPlus; this._y += yPlus; this._jumpPeak = 10; this._jumpCount = 20; }
        increaseSteps() {} straighten() {} resetStopCount() {} isOnBush() { return false; }
        update() { if (this._jumpCount > 0) { this._jumpCount--; if (!this._jumpCount) { this._realX = this._x; this._realY = this._y; } } }
        isNormalPriority() { return this._priorityType === 1; } isCollidedWithCharacters() { return false; } isThrough() { return this._through; } isDebugThrough() { return false; }
        animationWait() { return 9; } isDashing() { return false; } realMoveSpeed() { return this._moveSpeed; } distancePerFrame() { return 1 / 8; } checkStop() { return false; }
    }
    class Game_Character extends Game_CharacterBase { processMoveCommand() {} }
    class Game_Player extends Game_Character {
        constructor() { super(); this._followers = { _data: [], data() { return this._data; }, visibleFollowers() { return this._data; }, updateMove() {}, isVisible: () => true, forEach(f) { this._data.forEach(f); } };
            this._vehicleType = 'walk'; }
        canStartLocalEvents() { return !this.isInAirship(); } canEncounter() { return true; } moveByInput() {} isTransferring() { return Boolean(this._newMapId); }
        center() {} searchLimit() { return 12; } reserveTransfer(m, x, y) { this._newMapId = m; this.locate(x, y); } performTransfer() { this._newMapId = 0; } canMove() { return true; } executeMove(d) { this.moveStraight(d); } getInputDirection() { return 0; } isInAirship() { return false; } isInVehicle() { return false; } isInShip() { return this._vehicleType === 'ship'; } isInBoat() { return this._vehicleType === 'boat'; } getOnVehicle() { return false; }
        followers() { return this._followers; } isDashing() { return false; } vehicle() { return null; } refresh() {}
    }
    class Game_Follower extends Game_Character { constructor(i) { super(); this._memberIndex = i; } actor() { return null; } isVisible() { return true; } }
    class Game_Vehicle extends Game_Character { constructor(type) { super(); this._type = type; this._altitude = 0; this._mapId = 0; }
        isAirship() { return this._type === 'airship'; } isShip() { return this._type === 'ship'; } isBoat() { return this._type === 'boat'; } shadowX() { return this.screenX(); } shadowY() { return this.screenY() + this._altitude; } shadowOpacity() { return 255; } }
    class Game_Event extends Game_Character { constructor(mapId, eventId) { super(); this._mapId = mapId; this._eventId = eventId; this._erased = false; this._pageIndex = 0; }
        event() { return ($dataMap.events || [])[this._eventId] || { id: this._eventId, name: 'EV', note: '', pages: [{ list: [] }] }; } eventId() { return this._eventId; } page() { return this.event().pages[0]; }
        list() { return this.page() ? this.page().list : []; } updateSelfMovement() {} }
    g.Game_CharacterBase = Game_CharacterBase; g.Game_Character = Game_Character; g.Game_Player = Game_Player; g.Game_Follower = Game_Follower;
    g.Game_Vehicle = Game_Vehicle; g.Game_Event = Game_Event;
    class Game_Map {
        constructor() { this._mapId = 0; this._displayX = 0; this._displayY = 0; this._events = []; this._interpreter = { _list: null, isRunning: () => false, character: () => $gamePlayer };
            this._vehicles = [new Game_Vehicle('boat'), new Game_Vehicle('ship'), new Game_Vehicle('airship')]; this._parallaxName = ''; }
        setup(mapId) { this._mapId = mapId; this._events = []; }
        mapId() { return this._mapId; } tilesetId() { return $dataMap ? $dataMap.tilesetId : 1; } tileset() { return $dataTilesets[this.tilesetId()]; }
        width() { return $dataMap ? $dataMap.width : 0; } height() { return $dataMap ? $dataMap.height : 0; } data() { return $dataMap.data; }
        tileWidth() { return 48; } tileHeight() { return 48; }
        displayX() { return this._displayX; } displayY() { return this._displayY; } setDisplayPos(x, y) { this._displayX = x; this._displayY = y; } isScrolling() { return this._scrollRest > 0; }
        // As MZ: looping axes wrap, others stop at the map's edge.
        scrollRight(d) { this._displayX = this.isLoopHorizontal() ? (this._displayX + d) % this.width() : Math.min(this._displayX + d, Math.max(0, this.width() - this.screenTileX())); }
        scrollLeft(d) { this._displayX = this.isLoopHorizontal() ? (this._displayX + this.width() - d) % this.width() : Math.max(this._displayX - d, 0); }
        scrollDown(d) { this._displayY = this.isLoopVertical() ? (this._displayY + d) % this.height() : Math.min(this._displayY + d, Math.max(0, this.height() - this.screenTileY())); }
        scrollUp(d) { this._displayY = this.isLoopVertical() ? (this._displayY + this.height() - d) % this.height() : Math.max(this._displayY - d, 0); }
        screenTileX() { return 17; } screenTileY() { return 13; }
        isLoopHorizontal() { return $dataMap && ($dataMap.scrollType === 2 || $dataMap.scrollType === 3); } isLoopVertical() { return $dataMap && ($dataMap.scrollType === 1 || $dataMap.scrollType === 3); }
        adjustX(x) { if (this.isLoopHorizontal() && x < this._displayX - (this.width() - this.screenTileX()) / 2) return x - this._displayX + this.width(); return x - this._displayX; }
        adjustY(y) { if (this.isLoopVertical() && y < this._displayY - (this.height() - this.screenTileY()) / 2) return y - this._displayY + this.height(); return y - this._displayY; }
        roundX(x) { return this.isLoopHorizontal() ? ((x % this.width()) + this.width()) % this.width() : x; } roundY(y) { return this.isLoopVertical() ? ((y % this.height()) + this.height()) % this.height() : y; }
        xWithDirection(x, d) { return x + (d === 6 ? 1 : d === 4 ? -1 : 0); } yWithDirection(y, d) { return y + (d === 2 ? 1 : d === 8 ? -1 : 0); }
        roundXWithDirection(x, d) { return this.roundX(this.xWithDirection(x, d)); } roundYWithDirection(y, d) { return this.roundY(this.yWithDirection(y, d)); }
        isValid(x, y) { return x >= 0 && y >= 0 && x < this.width() && y < this.height(); }
        tileId(x, y, z) { const w = this.width(), h = this.height(); return ($dataMap.data || [])[(z * h + y) * w + x] || 0; }
        layeredTiles(x, y) { return [3, 2, 1, 0].map(z => this.tileId(x, y, z)); }
        regionId(x, y) { return this.isValid(x, y) ? this.tileId(x, y, 5) : 0; } terrainTag() { return 0; }
        // MZ's checkPassage: from the top layer down, skipping empty and star (no effect) tiles; a direction
        // bit clear means passable that way.
        isPassable(x, y, d) { const flags = (this.tileset() || {}).flags || []; const bit = (1 << (d / 2 - 1)) & 0x0f;
            for (const id of this.layeredTiles(x, y)) { if (!id) continue; const f = flags[id] || 0; if ((f & 0x10) !== 0) continue; if ((f & bit) === 0) return true; if ((f & bit) === bit) return false; } return false; }
        isBoatPassable() { return false; } isShipPassable() { return false; } isAirshipLandOk() { return true; } isLadder() { return false; } isBush() { return false; } isCounter() { return false; } isDamageFloor() { return false; }
        events() { return this._events.filter(Boolean); } event(id) { return this._events[id]; } eventsXy(x, y) { return this.events().filter(e => e.pos(x, y)); } eventsXyNt(x, y) { return this.eventsXy(x, y); }
        vehicles() { return this._vehicles; } boat() { return this._vehicles[0]; } ship() { return this._vehicles[1]; } airship() { return this._vehicles[2]; }
        parallaxName() { return this._parallaxName; } parallaxOx() { return 0; } parallaxOy() { return 0; } battleback1Name() { return ''; } battleback2Name() { return ''; }
        deltaX(x1, x2) { let r = x1 - x2; if (this.isLoopHorizontal() && Math.abs(r) > this.width() / 2) r += r < 0 ? this.width() : -this.width(); return r; }
        deltaY(y1, y2) { let r = y1 - y2; if (this.isLoopVertical() && Math.abs(r) > this.height() / 2) r += r < 0 ? this.height() : -this.height(); return r; }
        distance(x1, y1, x2, y2) { return Math.abs(this.deltaX(x1, x2)) + Math.abs(this.deltaY(y1, y2)); }
        isOverworld() { return this.tileset() && this.tileset().mode === 0; } displayName() { return ''; } tilesetFlags() { return (this.tileset() || {}).flags || []; }
        canvasToMapX(x) { return Math.floor(x / 48); } canvasToMapY(y) { return Math.floor(y / 48); } isEventRunning() { return false; }
        update() {} refresh() {} requestRefresh() {}
    }
    g.Game_Map = Game_Map;
    class Game_Interpreter { constructor() { this._list = null; this._waitMode = ''; this._eventId = 0; } setWaitMode(m) { this._waitMode = m; } eventId() { return this._eventId; } updateWaitMode() { return false; } character() { return $gamePlayer; } isRunning() { return false; } }
    g.Game_Interpreter = Game_Interpreter;

    // ---------------- Sprites and spritesets ----------------
    class Sprite_Character extends MzSprite {
        constructor(character) { super(); this._character = character; this._bushDepth = 0; this.anchor.set(0.5, 1); this._characterName = ''; this._tileId = 0;
            this._upperBody = null; this._lowerBody = null; this.bitmap = ImageManager.loadCharacter(character.characterName()); }
        update() { super.update(); this.updateBitmap(); this.updateFrame(); this.updatePosition(); }
        updateBitmap() { if (this._characterName !== this._character.characterName()) { this._characterName = this._character.characterName(); this.bitmap = ImageManager.loadCharacter(this._characterName); } }
        isImageChanged() { return false; }
        updateFrame() { this.updateCharacterFrame(); }
        updateCharacterFrame() { const pw = this.patternWidth(), ph = this.patternHeight(); this.setFrame((this.characterBlockX() + this.characterPatternX()) * pw, (this.characterBlockY() + this.characterPatternY()) * ph, pw, ph); }
        characterBlockX() { return (this._character.characterIndex() % 4) * 3; } characterBlockY() { return Math.floor(this._character.characterIndex() / 4) * 4; }
        characterPatternX() { return this._character.pattern(); } characterPatternY() { return (this._character.direction() - 2) / 2; }
        patternWidth() { return this.bitmap ? this.bitmap.width / 12 : 48; } patternHeight() { return this.bitmap ? this.bitmap.height / 8 : 48; }
        updatePosition() { this.x = this._character.screenX(); this.y = this._character.screenY(); this.z = this._character.screenZ(); }
        setCharacter(c) { this._character = c; }
    }
    g.Sprite_Character = Sprite_Character;
    class Sprite_Destination extends MzSprite { constructor() { super(); this.z = 0.5; this._frameCount = 0; this.bitmap = new Bitmap(48, 48); this.anchor.set(0.5, 0.5); }
        // As MZ: the marker grows and fades over 20 frames while there is a destination.
        update() { if ($gameTemp.isDestinationValid()) { this.updatePosition(); this.updateAnimation(); this.visible = true; } else { this._frameCount = 0; this.visible = false; } }
        updatePosition() { const tw = 48, th = 48; this.x = ($gameMap.adjustX($gameTemp.destinationX()) + 0.5) * tw; this.y = ($gameMap.adjustY($gameTemp.destinationY()) + 0.5) * th; }
        updateAnimation() {} createBitmap() {} destroy(o) { super.destroy(o); } }
    g.Sprite_Destination = Sprite_Destination;
    class Sprite_Animation extends MzSprite { constructor() { super(); this._targets = []; this._animation = { scale: 100, alignBottom: false }; } targetSpritePosition(s) { return new Point(s.x, s.y); } updateEffectGeometry() {} }
    g.Sprite_Animation = Sprite_Animation;
    g.Sprite_AnimationMV = class extends MzSprite {};
    g.Sprite_Battleback = class extends TilingSprite { battleback1Bitmap() { return new Bitmap(1, 1); } battleback2Bitmap() { return new Bitmap(1, 1); } };
    g.Sprite_Actor = class extends MzSprite { updateFrame() {} };
    class Weather extends Container { constructor() { super(); this.type = 'none'; this.power = 0; this.origin = new Point(); } update() {} }
    g.Weather = Weather;
    class Spriteset_Base extends MzSprite {
        constructor() { super(); this.setFrame(0, 0, 816, 624); this.loadSystemImages && this.loadSystemImages(); this.createLowerLayer(); this.createUpperLayer(); this._effectsContainer = this._baseSprite; }
        createLowerLayer() { this._baseSprite = new MzSprite(); this.addChild(this._baseSprite); }
        createUpperLayer() { this._pictureContainer = new MzSprite(); this.addChild(this._pictureContainer); this._timerSprite = new MzSprite(); this.addChild(this._timerSprite); }
        update() { MzSprite.prototype.update.call(this); }
    }
    g.Spriteset_Base = Spriteset_Base;
    class Spriteset_Map extends Spriteset_Base {
        createLowerLayer() { super.createLowerLayer(); this.createParallax(); this.createTilemap(); this.createCharacters(); this.createShadow(); this.createDestination(); this.createWeather(); }
        createParallax() { this._parallax = new TilingSprite(); this._baseSprite.addChild(this._parallax); }
        loadTileset() { this._tileset = $gameMap.tileset(); if (this._tileset) { this._tilemap.setBitmaps(this._tileset.tilesetNames.map(n => ImageManager.loadTileset(n))); this._tilemap.flags = this._tileset.flags || []; } }
        createTilemap() { const t = this._tilemap = new Tilemap(); t.setData($gameMap.width(), $gameMap.height(), $gameMap.data()); t.horizontalWrap = $gameMap.isLoopHorizontal(); t.verticalWrap = $gameMap.isLoopVertical();
            const tileset = $gameMap.tileset(); t.setBitmaps(((tileset && tileset.tilesetNames) || []).map(n => ImageManager.loadTileset(n))); t.flags = (tileset && tileset.flags) || []; this._baseSprite.addChild(t); }
        createCharacters() { this._characterSprites = []; for (const e of $gameMap.events()) this._characterSprites.push(new Sprite_Character(e));
            for (const v of $gameMap.vehicles()) this._characterSprites.push(new Sprite_Character(v));
            for (const f of $gamePlayer.followers().data()) this._characterSprites.push(new Sprite_Character(f));
            this._characterSprites.push(new Sprite_Character($gamePlayer)); for (const s of this._characterSprites) this._tilemap.addChild(s); }
        createShadow() { this._shadowSprite = new MzSprite(); this._shadowSprite.z = 6; this._tilemap.addChild(this._shadowSprite); }
        createDestination() { this._destinationSprite = new Sprite_Destination(); this._tilemap.addChild(this._destinationSprite); }
        createWeather() { this._weather = new Weather(); this.addChild(this._weather); }
        update() { super.update(); this.updateTileset && this.updateTileset(); this.updateParallax(); this.updateTilemap(); this.updateShadow(); this.updateWeather(); }
        updateParallax() {} updateTilemap() { this._tilemap.origin.x = $gameMap.displayX() * 48; this._tilemap.origin.y = $gameMap.displayY() * 48; }
        updateShadow() {} updateWeather() {}
        destroy(options) { super.destroy(options); }
        findTargetSprite(target) { return this._characterSprites.find(s => s._character === target); }
    }
    g.Spriteset_Map = Spriteset_Map;
    g.Spriteset_Battle = class extends Spriteset_Base {};
    class Scene_Base extends Container { constructor() { super(); this._active = true; } initialize() { Container.call(this); this._active = true; } create() {} start() {} update() {} terminate() {} isActive() { return this._active; } popScene() {} }
    g.Scene_Base = Scene_Base;
    class Scene_Map extends Scene_Base { create() {} onMapLoaded() {} terminate() {} snapForBattleBackground() {} isMenuEnabled() { return true; } }
    g.Scene_Map = Scene_Map;
    g.Scene_MenuBase = class extends Scene_Base { create() {} update() {} };
    g.Scene_Battle = class extends Scene_Base { terminate() {} };
    g.Scene_Options = class extends Scene_Base { maxCommands() { return 7; } };
    g.SceneManager = { _scene: null, push() {}, goto() {}, pop() {}, isNextScene: () => false, snapForBackground() {}, backgroundBitmap: () => new Bitmap(816, 624) };
    g.Window_Base = class extends Container {};
    g.Window_Options = class extends g.Window_Base { addGeneralOptions() {} statusText() { return ''; } processOk() {} cursorRight() {} cursorLeft() {} commandSymbol() { return ''; } };
    g.Window_StatusBase = class extends g.Window_Base { drawActorCharacter() {} };
    g.Window_SavefileList = class extends g.Window_Base { drawPartyCharacters() {} };
    g.Window_EquipStatus = class extends g.Window_Base { refresh() {} };
    g.WebAudio = class { _createPannerNode() {} };
}

// A world: a map (width x height) with the given tiles, a tileset with flags, the player at (px, py).
function setupWorld(options = {}) {
    const g = global;
    const w = options.width || 30, h = options.height || 24;
    const data = new Array(w * h * 6).fill(0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[y * w + x] = options.ground || 2816;
    if (options.tiles) for (const [x, y, z, id] of options.tiles) data[(z * h + y) * w + x] = id;
    g.$dataMap = { width: w, height: h, data, tilesetId: 1, scrollType: options.scrollType || 0, events: [null], note: '', parallaxName: '' };
    const flags = new Array(8192).fill(0);
    if (options.flags) for (const [id, f] of Object.entries(options.flags)) flags[id] = f;
    g.$dataTilesets = [null, { id: 1, mode: options.tilesetMode === undefined ? 1 : options.tilesetMode, flags, tilesetNames: ['Outside_A1', 'Outside_A2', '', '', '', 'Outside_B', 'Outside_C', '', ''] }];
    g.$dataSystem = { advanced: { screenWidth: 816, screenHeight: 624 }, optSideView: false };
    g.$dataActors = [null, { id: 1, name: 'Reid', note: '', characterName: 'Actor1', characterIndex: 0 }];
    g.$dataWeapons = [null]; g.$dataArmors = [null]; g.$dataStates = [null]; g.$dataClasses = [null, { id: 1, note: '' }];
    g.$dataAnimations = [null];
    g.$gameMap = new Game_Map();
    g.$gameMap.setup(options.mapId || 1);
    g.$gamePlayer = new Game_Player();
    g.$gamePlayer.locate(options.px || 10, options.py || 10);
    g.$gameScreen = { _weatherType: 'none', _weatherPower: 0, weatherType() { return this._weatherType; }, weatherPower() { return this._weatherPower; },
        changeWeather(t, p) { this._weatherType = t; this._weatherPower = p; }, zoomScale: () => 1, zoomX: () => 0, zoomY: () => 0, shake: () => 0, brightness: () => 255, picture: () => null };
    g.$gameSystem = { isSideView: () => false, _docsFeatureOff: {} };
    g.$gameTemp = { requestAnimation() {}, requestBalloon() {}, isDestinationValid: () => false, destinationX: () => 0, destinationY: () => 0, retrieveAnimation: () => null };
    const actor = { actorId: () => 1, actor: () => $dataActors[1], characterName: () => 'Actor1', characterIndex: () => 0, equips: () => [], states: () => [],
        currentClass: () => $dataClasses[1], isStateAffected: () => false, name: () => 'Reid', faceName: () => 'Actor1', faceIndex: () => 0 };
    g.$gameParty = { leader: () => actor, members: () => [actor], battleMembers: () => [actor], allMembers: () => [actor], size: () => 1 };
    g.$gameActors = { actor: () => actor };
    g.$gameSwitches = { _data: {}, value(id) { return Boolean(this._data[id]); }, setValue(id, v) { this._data[id] = v; } };
    g.$gameVariables = { _data: {}, value(id) { return this._data[id] || 0; }, setValue(id, v) { this._data[id] = v; } };
    g.$gameMessage = { isBusy: () => false };
    g.$gameTroop = { members: () => [] };
    g.$dataDocsDoodads = Object.assign({ mapSettings: {} }, options.doodads || {});
    g.Graphics.frameCount = 0;
    return { width: w, height: h };
}

// A doodad picture at tile (tx, ty), standing on the tile's bottom edge.
function doodad(tx, ty, extra = {}) {
    return Object.assign({ bit: [3, 'img/doodads/Tree.png'], index: 0, anchorX: 0.5, anchorY: 1, posMode: 1, x: tx * 48 + 24, y: ty * 48 + 48, z: 0, depth: 'sorted',
        sortOffsetY: 0, scaleX: 1, scaleY: 1, blend: 0, opacity: 1, rotation: 0, rotateSpeed: 0, r: 0, g: 0, b: 0, grey: 0, xFrame: 1, yFrame: 1, frameUpdate: 0,
        frameX: 0, frameY: 0, frameW: 96, frameH: 96, switch: [], condition: '', blur: 0, contrast: 0, sepia: false, hue: 0, bright: false,
        collision: { preset: 'none', shape: null }, uid: 'dd_' + tx + '_' + ty }, extra);
}

// Steps a spriteset (and the map, player and characters) n frames.
function frames(spriteset, n = 1) {
    for (let i = 0; i < n; i++) {
        global.Graphics.frameCount++;
        if ($gameMap.update) $gameMap.update(true);
        $gamePlayer.update();
        spriteset.update();
        spriteset.updateTransform();
        spriteset.render(global.Graphics.app.renderer);
    }
}

module.exports = { install, setupWorld, doodad, frames, makeCanvas };
