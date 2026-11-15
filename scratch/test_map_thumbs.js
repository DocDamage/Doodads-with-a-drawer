// Map pictures (7.2.4): bounded geometry, disposable cache freshness, current-map-only lazy work,
// lifecycle safety and the three navigation surfaces. Rendering is stubbed here; a real MZ playtest
// covers MZ's tileset bitmaps and canvas pixels.
const assert = require('assert');
const fs = require('fs');

console.log('=== Testing Map Pictures ===');

const byId = {}, canvasCalls = [];
function makeNode(tag) {
    const attrs = {};
    const classes = new Set();
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', title: '', value: '', dataset: {},
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = String(v); this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode(m[1] === 'dd-world-canvas' ? 'canvas' : 'div'); c.id = m[1]; this.appendChild(c); } },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; },
        setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: k => attrs[k] || null,
        hasAttribute: k => Object.prototype.hasOwnProperty.call(attrs, k), removeAttribute(k) { delete attrs[k]; },
        addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        getBoundingClientRect: () => ({ left: 0, right: 120, top: 0, bottom: 28 }), closest: () => null, focus() {},
        getContext: String(tag).toLowerCase() === 'canvas' ? () => new Proxy({}, { get: (target, key) => {
            if (key in target) return target[key];
            return (...args) => { canvasCalls.push([key, args]); };
        }, set: (target, key, value) => { target[key] = value; return true; } }) : undefined
    };
}
const body = makeNode('body');
global.window = global;
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.innerWidth = 1200;
window.innerHeight = 800;
global.document = { body, documentElement: makeNode('html'), createElement: makeNode, getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {} };
const store = {};
global.localStorage = { getItem: key => store[key] || null, setItem: (key, value) => { store[key] = String(value); } };
let testMode = true;
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: key => key === 'test' && testMode };
global.PluginManager = { parameters: () => ({ editorMode: 'true' }) };
let mapId = 1;
global.$gameMap = { mapId: () => mapId, tileWidth: () => 48, tileHeight: () => 48, tilesetId: () => 1, displayX: () => 7, displayY: () => 9 };
global.$dataMap = { width: 20, height: 10, tilesetId: 1, scrollType: 0, data: new Array(20 * 10 * 6).fill(0) };
global.$dataMapInfos = [null, { id: 1, name: 'Wide Field' }, { id: 2, name: 'Tall Tower' }];
global.$dataTilesets = [null, { tilesetNames: [], flags: [] }];
global.$dataDocsDoodads = { 1: [{ uid: 'tree', bit: [3, 'img/doodads/tree.png'], posMode: 1, x: 48, y: 48 }] };
global.Image = class {
    set src(value) { this._src = value; if (this.onload) this.onload(); }
    get src() { return this._src; }
};

require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MapThumb, ws = D.Workspace;

(async () => {
    // 1. The longest side is exactly 256 (without enlarging a small map), for either orientation.
    assert.ok(M, 'the plain MapThumb helper exists');
    assert.deepStrictEqual(M.dimensions(20, 10, 48, 48), { width: 256, height: 128, scale: 256 / 960 });
    assert.deepStrictEqual(M.dimensions(10, 20, 48, 48), { width: 128, height: 256, scale: 256 / 960 });
    assert.deepStrictEqual(M.dimensions(2, 1, 48, 48), { width: 96, height: 48, scale: 1 }, 'a small map is not blurred larger');
    assert.strictEqual(M.cachePath(7), 'data/docs_doodads_cache/maps/Map007.png');
    console.log('PASS wide/tall size and cache path');

    // 2. Freshness is based on Map###.json. A newer source invalidates the disposable picture.
    fs.mkdirSync('data/docs_doodads_cache/maps', { recursive: true });
    fs.writeFileSync('data/Map001.json', '{}');
    fs.writeFileSync(M.cachePath(1), 'old');
    const now = Date.now() / 1000;
    fs.utimesSync('data/Map001.json', now - 20, now - 20);
    fs.utimesSync(M.cachePath(1), now - 10, now - 10);
    assert.strictEqual(M.status(1).fresh, true);
    fs.utimesSync('data/Map001.json', now, now);
    assert.strictEqual(M.status(1).fresh, false, 'source newer: stale');
    assert.strictEqual(M.status(2).exists, false, 'never-opened map: no picture');
    console.log('PASS fresh, stale and unopened cache states');

    // 3. Only the loaded map is rendered. Jobs dedupe; failures and deployed games resolve false.
    const realRender = M.render;
    let renders = 0, release;
    M.render = () => { renders++; return new Promise(resolve => { release = () => resolve({ toDataURL: () => 'data:image/png;base64,YQ==' }); }); };
    fs.unlinkSync(M.cachePath(1));
    const a = ws.mapThumb(1, { force: true });
    const b = ws.mapThumb(1, { force: true });
    assert.strictEqual(renders, 1, 'one job for repeated requests');
    assert.strictEqual(await ws.mapThumb(2, { force: true }), false, 'does not load another map to make its picture');
    release();
    assert.deepStrictEqual(await Promise.all([a, b]), [true, true]);
    assert.strictEqual(fs.readFileSync(M.cachePath(1)).toString(), 'a');
    assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [7, 9], 'the renderer never moved the camera');
    M.render = async () => { throw new Error('broken image'); };
    assert.strictEqual(await ws.mapThumb(1, { force: true }), false, 'thumbnail failure cannot escape');
    testMode = false;
    assert.strictEqual(await ws.mapThumb(1, { force: true }), false, 'no generation outside a playtest');
    testMode = true;
    // An unsaved departing picture is useful in this run, but must not survive a discard/restart as if saved.
    D.Persistence.dirtyDoodads = true;
    if (fs.existsSync(M.cachePath(1))) fs.unlinkSync(M.cachePath(1));
    M.render = async () => ({ toDataURL: () => 'data:image/png;base64,Yg==' });
    assert.strictEqual(await ws.mapThumb(1, { force: true }), true);
    assert.strictEqual(fs.existsSync(M.cachePath(1)), false, 'unsaved pixels are not put in the disk cache');
    assert.ok(/^data:image\/png/.test(M.url(1)), 'the same playtest can still show the departing map');
    M.clearVolatile([1]);
    assert.strictEqual(M.url(1), '', 'discard or restart shows the saved-state placeholder');
    D.Persistence.dirtyDoodads = false;
    // Invalidating an in-flight job queues one replacement; the old finalizer cannot erase the new job.
    let finishOld;
    renders = 0;
    M.render = () => {
        renders++;
        if (renders === 1) return new Promise(resolve => { finishOld = () => resolve({ toDataURL: () => 'data:image/png;base64,b2xk' }); });
        return Promise.resolve({ toDataURL: () => 'data:image/png;base64,bmV3' });
    };
    const oldJob = ws.mapThumb(1, { force: true });
    M.invalidate(1);
    const newJob = ws.mapThumb(1, { force: true });
    finishOld();
    assert.strictEqual(await oldJob, false);
    assert.strictEqual(await newJob, true);
    assert.strictEqual(renders, 2);
    assert.strictEqual(M._pending[1], undefined, 'the replacement owns and clears its pending entry');
    assert.strictEqual(fs.readFileSync(M.cachePath(1), 'utf8'), 'new');
    M.render = realRender;
    console.log('PASS current-only, deduped, guarded, non-blocking work; unsaved pictures stay memory-only');

    // 4. The small renderer owns only thumbnail-sized canvases and its snapshot survives a map transfer.
    const snapshot = M.snapshotCurrent(1);
    $dataMap.data[0] = 99;
    $dataDocsDoodads[1][0].x = 999;
    assert.strictEqual(snapshot.data[0], 0);
    assert.strictEqual(snapshot.doodads[0].x, 48, 'departing map doodads were cloned');
    const bitmap = { isReady: () => true, _canvas: {}, width: 48, height: 48 };
    global.ImageManager = { loadTileset: () => bitmap, loadSystem: () => bitmap, loadBitmap: () => bitmap, _emptyBitmap: bitmap };
    global.Tilemap = function() {};
    Tilemap.prototype._addSpot = function(startX, startY, x, y) {
        this._lowerLayer.addRect(0, 0, 0, x * this.tileWidth, y * this.tileHeight, this.tileWidth, this.tileHeight);
        if (x === 0 && y === 0) this._upperLayer.addRect(0, 0, 0, 0, 0, this.tileWidth, this.tileHeight);
    };
    snapshot.tilesetNames[0] = 'A1';
    canvasCalls.length = 0;
    const rendered = await M.render(snapshot);
    assert.deepStrictEqual([rendered.width, rendered.height], [256, 128]);
    assert.ok(canvasCalls.filter(call => call[0] === 'drawImage').length >= snapshot.width * snapshot.height + 3, 'lower tiles, upper tiles and doodad drawn');
    assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [7, 9], 'rendering leaves the live camera alone');
    console.log('PASS cloned transfer-safe snapshot and bounded tiles-plus-doodads renderer');

    // 5. Tabs identify their picture to the hover card; an uncached map still has an accessible name.
    ws.container = makeNode('div');
    ws.placeReadouts = () => {};
    ws.goToMap = () => {};
    D.Ui.setPref('recentMaps', [1, 2]);
    ws.renderMapTabs();
    const tabs = byId['dd-map-tabs'].childNodes;
    assert.deepStrictEqual(tabs.map(t => t.getAttribute('data-dd-map-thumb')), ['1', '2']);
    assert.ok(/Wide Field/.test(tabs[0].getAttribute('aria-label')));
    assert.ok(/Tall Tower/.test(tabs[1].getAttribute('aria-label')), 'placeholder retains the accessible map name');
    const mapCommands = ws.paletteCommands().filter(c => c.group === 'Map' && c.mapId);
    assert.deepStrictEqual(mapCommands.map(c => c.mapId), [1, 2], 'Go-to-map rows carry picture ids');
    assert.ok(/dd-map-goto-preview/.test(ws.renderMapNavigation()), 'the map list has a picture/placeholder');
    const tooltip = makeNode('div');
    M.decorateTooltip(tabs[1], tooltip);
    assert.ok(tooltip.childNodes.some(n => /Tall Tower/.test(n.getAttribute('aria-label') || '')), 'tab hover card has an accessible placeholder');
    const realLayout = D.MapLinks.layout, realBounds = D.MapLinks.bounds;
    D.MapLinks.layout = () => [{ mapId: 1, x: 0, y: 0, w: 960, h: 480 }, { mapId: 2, x: 960, y: 0, w: 480, h: 960 }];
    D.MapLinks.bounds = () => ({ left: 0, top: 0, right: 1440, bottom: 960 });
    M._volatile.set(1, 'data:image/png;base64,YQ==');
    canvasCalls.length = 0;
    ws.showWorldView();
    assert.ok(canvasCalls.some(call => call[0] === 'drawImage'), 'World View draws a cached picture');
    assert.ok(/Wide Field/.test(byId['dd-world-canvas'].getAttribute('aria-label')), 'World View names maps accessibly');
    byId['dd-world-close'].onclick();
    assert.strictEqual(ws._worldThumbRefresh, null, 'closing World View removes its redraw callback');
    D.MapLinks.layout = realLayout; D.MapLinks.bounds = realBounds; M.clearVolatile();
    console.log('PASS tabs, map list, palette and World View pictures with accessible placeholders');

    // 6. Cache correctness across maps: global dirtiness stays volatile, and successful saves invalidate
    // only map pictures whose doodads/settings changed. Failed saves keep every cache file.
    const doodad = (uid, x) => ({ uid, bit: [3, 'img/doodads/tree.png'], posMode: 1, x, y: 48 });
    assert.deepStrictEqual(M.changedMapIds(
        { 1: [doodad('a', 1)], 2: [doodad('b', 2)], 3: [doodad('c', 3)], mapSettings: { 3: { mainLayer: { gameHidden: false } } } },
        { 1: [doodad('a', 1)], 2: [doodad('b', 22)], 3: [doodad('c', 3)], mapSettings: { 3: { mainLayer: { gameHidden: true } } } }
    ), [2, 3], 'numeric doodad entries and picture-affecting map settings are compared per map');

    fs.writeFileSync('data/Map002.json', '{}');
    fs.writeFileSync(M.cachePath(2), 'saved-2');
    fs.utimesSync('data/Map002.json', now - 20, now - 20);
    fs.utimesSync(M.cachePath(2), now - 10, now - 10);
    mapId = 2;
    global.$dataMap = { width: 10, height: 20, tilesetId: 1, scrollType: 0, data: new Array(10 * 20 * 6).fill(0) };
    global.$dataDocsDoodads = { 1: [doodad('a', 1)], 2: [doodad('b', 22)] };
    D.Persistence._dirtyDoodads = true;
    D.Persistence.touchedMaps = new Set([1]); // Cross-map edit forgot to touch the current target.
    renders = 0;
    M.render = async () => { renders++; return { toDataURL: () => 'data:image/png;base64,dW5zYXZlZA==' }; };
    const mapSelect = makeNode('select'); mapSelect.id = 'dd-map-goto'; mapSelect.value = '2'; body.appendChild(mapSelect);
    const mapPreview = makeNode('div'); mapPreview.id = 'dd-map-goto-preview'; mapPreview.innerHTML = '<span>placeholder</span>'; body.appendChild(mapPreview);
    const worldRefreshes = [];
    ws._worldThumbRefresh = id => worldRefreshes.push(id);
    assert.strictEqual(await ws.mapThumb(2), true, 'fresh disk cache is bypassed while any doodad data is dirty');
    assert.strictEqual(renders, 1);
    assert.strictEqual(fs.readFileSync(M.cachePath(2), 'utf8'), 'saved-2', 'unsaved target never overwrites its saved PNG');
    assert.ok(/^data:image\/png/.test(M.url(2)), 'unsaved target is visible from bounded memory');
    assert.ok(/<img/.test(mapPreview.innerHTML), 'visible selected-map preview refreshes when generation finishes');
    assert.deepStrictEqual(worldRefreshes, [2], 'an open World View gets a narrow redraw signal');
    const realReadAll = D.DataFiles.readAll, realCapture = D.Persistence.captureSession, realClearRecovery = D.Persistence.clearRecovery;
    D.DataFiles.readAll = () => ({ 1: [doodad('a', 1)], 2: [doodad('b', 2)] });
    D.Persistence.captureSession = () => {};
    D.Persistence.clearRecovery = () => {};
    D.Persistence.discardUnsaved();
    assert.strictEqual(fs.readFileSync(M.cachePath(2), 'utf8'), 'saved-2', 'discard leaves the saved PNG unchanged');
    assert.ok(!/^data:image\/png/.test(M.url(2)), 'discard reveals the saved PNG instead of unsaved pixels');
    D.DataFiles.readAll = realReadAll; D.Persistence.captureSession = realCapture; D.Persistence.clearRecovery = realClearRecovery;
    delete ws._worldThumbRefresh;

    mapId = 1;
    global.$dataMap = { width: 20, height: 10, tilesetId: 1, scrollType: 0, data: new Array(20 * 10 * 6).fill(0) };
    const saved = { 1: [doodad('a', 1)], 2: [doodad('b', 2)], 3: [doodad('c', 3)] };
    assert.ok(D.FS.atomicWriteManyJson(D.DataFiles.entriesFor(saved)).ok);
    for (const id of [1, 2, 3]) fs.writeFileSync(M.cachePath(id), 'saved-' + id);
    global.$dataDocsDoodads = { 1: [doodad('a', 1)], 2: [doodad('b', 20)], 3: [doodad('c', 3)] };
    D.Persistence._dirtyDoodads = true;
    D.Persistence.touchedMaps = new Set([1]);
    D.Persistence.stagedMaps = {};
    $gameMap._stagedMapData = null;
    const renderedMaps = [];
    M.render = async snap => { renderedMaps.push(snap.mapId); return { toDataURL: () => 'data:image/png;base64,Y3VycmVudA==' }; };
    assert.strictEqual(D.Persistence.saveAll(true), true);
    if (M._pending[1]) await M._pending[1].promise;
    assert.strictEqual(fs.existsSync(M.cachePath(2)), false, 'saved cross-map doodad change invalidates that target');
    assert.strictEqual(fs.existsSync(M.cachePath(3)), true, 'unchanged map picture is preserved');
    assert.deepStrictEqual(renderedMaps, [1], 'save refreshes only the loaded map, never every changed target');

    $dataDocsDoodads[2][0].x = 30;
    D.Persistence._dirtyDoodads = true;
    const realInvalidateMany = M.invalidateMany;
    M.invalidateMany = () => { throw new Error('cache is read-only'); };
    assert.strictEqual(D.Persistence.saveAll(true), true, 'cache invalidation errors cannot turn a successful project save into failure');
    if (M._pending[1]) await M._pending[1].promise;
    M.invalidateMany = realInvalidateMany;

    fs.writeFileSync(M.cachePath(2), 'keep-2');
    fs.writeFileSync(M.cachePath(3), 'keep-3');
    $dataDocsDoodads[2][0].x = 200;
    D.Persistence._dirtyDoodads = true;
    const realWriteMany = D.FS.atomicWriteManyJson;
    D.FS.atomicWriteManyJson = () => ({ ok: false, error: 'test failure', rolledBack: true });
    assert.strictEqual(D.Persistence.saveAll(true), false);
    assert.strictEqual(fs.readFileSync(M.cachePath(2), 'utf8'), 'keep-2');
    assert.strictEqual(fs.readFileSync(M.cachePath(3), 'utf8'), 'keep-3');
    D.FS.atomicWriteManyJson = realWriteMany;
    M.render = realRender;
    console.log('PASS global-dirty volatility, discard safety, selective save invalidation and failed-save preservation');

    console.log('\nAll map picture tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
