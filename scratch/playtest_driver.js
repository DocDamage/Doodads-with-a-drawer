/* global Scene_Boot, Scene_Map, SceneManager, Graphics, ImageManager, DataManager, AudioManager, Input, TouchInput, Utils, nw, Game_Map, Game_Event, Game_CommonEvent */
'use strict';
// Loaded only into the temporary project made by scripts/playtest.js. Never shipped in the plugin.
(function() {
    function capture(env) {
        const graphics = env.Graphics, renderer = graphics.app && graphics.app.renderer;
        const scene = env.SceneManager._scene, spriteset = scene && scene._spriteset;
        if (!renderer || !renderer.extract || !spriteset) throw new Error('The map renderer is not ready.');
        const texture = env.PIXI.RenderTexture.create({ width: graphics.width, height: graphics.height, resolution: 1 });
        try {
            renderer.render(spriteset, texture);
            const rgba = new Uint8Array(renderer.extract.pixels(texture));
            if (rgba.length !== graphics.width * graphics.height * 4) throw new Error('Unexpected capture size.');
            return { width: graphics.width, height: graphics.height, rgba };
        } finally { texture.destroy(true); }
    }
    function seeded(seed) {
        let state = (Number(seed) || 1) >>> 0;
        return function() { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    }
    function freezeEngine(env) {
        env.Input.update = () => {}; env.TouchInput.update = () => {};
        env.Game_Map.prototype.updateInterpreter = function() {};
        env.Game_Event.prototype.updateSelfMovement = function() {};
        env.Game_Event.prototype.updateParallel = function() {};
        env.Game_CommonEvent.prototype.update = function() {};
    }
    function nextReadinessWait(waiting, ready) { return ready ? 0 : waiting + 1; }
    if (typeof module !== 'undefined' && typeof nw === 'undefined') module.exports = { capture, seeded, freezeEngine, nextReadinessWait };
    if (typeof nw === 'undefined' || typeof SceneManager === 'undefined' || !Utils.isOptionValid('test')) return;

    const fs = require('fs'), path = require('path'), zlib = require('zlib');
    const { encodePng } = require(path.resolve('js/plugins/DocsPlaytestSupport/png.js'));
    const config = JSON.parse(fs.readFileSync('data/DocsPlaytestRun.json', 'utf8'));
    const out = path.resolve(config.output);
    fs.mkdirSync(out, { recursive: true });
    const result = { cases: [], errors: Array.isArray(window.__docsPlaytestErrors) ? window.__docsPlaytestErrors : [], gpu: '', error: null };
    let finished = false, index = -1, phase = 'boot', frames = 0, waiting = 0, started = 0;
    function finish(error) {
        if (finished) return;
        finished = true;
        result.error = error ? String(error.stack || error) : null;
        const file = path.join(out, 'result.json');
        fs.writeFileSync(file + '.tmp', JSON.stringify(result, null, 2));
        fs.renameSync(file + '.tmp', file);
        nw.App.quit();
    }
    window.addEventListener('error', e => finish(e.error || e.message));
    window.addEventListener('unhandledrejection', e => finish(e.reason));
    SceneManager.catchException = error => finish(error);
    SceneManager.isGameActive = () => true;
    SceneManager.determineRepeatNumber = () => 1;
    Scene_Boot.prototype.startNormalGame = function() {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        SceneManager.goto(Scene_Map);
    };
    // There is one simulation frame per render tick. Input and map events cannot change the test case.
    freezeEngine(window);

    function resetCase(c) {
        const D = window.DocsDoodads;
        Math.random = seeded(config.seed);
        if (AudioManager.stopAll) AudioManager.stopAll();
        D.World.set('time.source', 'clock');
        D.api.setTime(Math.floor(c.minutes / 60), c.minutes % 60);
        const clock = D.Atmosphere.clock(true); if (clock) clock.paused = true;
        D.Wind.set(0.2, 0, 'right');
        if (window.$gameScreen) {
            window.$gameScreen.clear();
            window.$gameScreen.changeWeather(c.weather, c.weather === 'none' ? 0 : c.power, 0);
        }
        if (window.$gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
        if (window.$gameMessage && $gameMessage.clear) $gameMessage.clear();
        if (window.$gameMap && $gameMap._interpreter && $gameMap._interpreter.clear) $gameMap._interpreter.clear();
        if (window.$gameMap) for (const event of $gameMap.events()) if (event._interpreter && event._interpreter.clear) event._interpreter.clear();
        const settings = D.Lighting.mapSettings(c.mapId) || {};
        D.Lighting.setMapSettings(c.mapId, { perspective: Object.assign({}, settings.perspective || {}, { enabled: c.mode === '3d' }) });
        D.World.invalidate();
        const scene = SceneManager._scene;
        Graphics.frameCount = 0;
        for (const character of [$gamePlayer].concat($gameMap.events())) {
            character._animationCount = 0; character._pattern = 1;
        }
        if (scene && scene._spriteset && scene.createSpriteset) {
            const old = scene._spriteset, position = scene.getChildIndex(old);
            scene.removeChild(old); old.destroy(); scene.createSpriteset();
            scene.setChildIndex(scene._spriteset, position);
        }
    }
    function nextCase() {
        index++;
        if (index >= config.cases.length) { finish(); return; }
        Math.random = seeded(config.seed);
        DataManager.setupNewGame();
        const c = config.cases[index];
        const map = JSON.parse(fs.readFileSync(path.join('data', 'Map' + String(c.mapId).padStart(3, '0') + '.json'), 'utf8'));
        const x = Math.max(0, Math.min(map.width - 1, c.x === undefined ? Math.floor(map.width / 2) : c.x));
        const y = Math.max(0, Math.min(map.height - 1, c.y === undefined ? Math.floor(map.height / 2) : c.y));
        $gamePlayer.reserveTransfer(c.mapId, x, y, 2, 2);
        SceneManager.goto(Scene_Map);
        phase = 'transfer'; waiting = 0; frames = 0;
    }
    const update = SceneManager.updateMain;
    SceneManager.updateMain = function() {
        if (finished) return;
        if (phase === 'writing') return;
        try {
            update.call(this);
            if (finished) return;
            const scene = this._scene;
            const sceneReady = scene instanceof Scene_Map && scene.isStarted() && !$gamePlayer.isTransferring();
            waiting = nextReadinessWait(waiting, sceneReady);
            if (waiting > 3600) throw new Error('Case did not become ready: ' + (config.cases[index] || {}).name);
            if (!sceneReady) return;
            if (phase === 'boot') { nextCase(); return; }
            const c = config.cases[index];
            // Clear the opening message and stop autorun/common events in this disposable renderer test.
            if ($gameMessage.clear) $gameMessage.clear();
            if ($gameMap._interpreter && $gameMap._interpreter.clear) $gameMap._interpreter.clear();
            for (const event of $gameMap.events()) { if (event._interpreter && event._interpreter.clear) event._interpreter.clear(); }
            if (phase === 'transfer') { resetCase(c); phase = 'assets'; frames = 0; return; }
            const assetsReady = ImageManager.isReady();
            waiting = nextReadinessWait(waiting, assetsReady);
            if (waiting > 3600) throw new Error('Case assets did not become ready: ' + c.name);
            if (!assetsReady) { frames = 0; return; }
            if (phase === 'assets') {
                // A settled preflight creates lazily requested textures; then reset random/time/frame counters.
                if (++frames < 30) return;
                resetCase(c); phase = 'capture'; frames = 0; started = performance.now(); return;
            }
            if (++frames < c.frames) return;
            const picture = capture(window);
            const elapsed = Math.max(1, performance.now() - started);
            const entry = { name: c.name, width: picture.width, height: picture.height, fps: Math.round(c.frames * 100000 / elapsed) / 100 };
            if (!result.gpu) {
                const gl = Graphics.app.renderer.gl;
                const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
                result.gpu = gl ? String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : 'unknown';
            }
            if (c.waterProbe) entry.water = require(path.resolve('js/plugins/DocsPlaytestSupport/water.js'))({ env: window, assert: true });
            // The water helper is async; finish this case after it, holding the simulation still.
            phase = 'writing';
            Promise.resolve(entry.water).then(water => {
                if (finished) return;
                if (water) entry.water = water; else delete entry.water;
                const name = path.join(out, c.name);
                fs.writeFileSync(name + '.rgba', Buffer.from(picture.rgba));
                fs.writeFileSync(name + '.png', encodePng(picture.width, picture.height, picture.rgba, zlib.deflateSync));
                result.cases.push(entry);
                nextCase();
            }).catch(finish);
        } catch (error) { finish(error); }
    };
})();
