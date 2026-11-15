// Map pictures (7.2.4): bounded geometry, disposable cache freshness, current-map-only lazy work,
// lifecycle safety and the three navigation surfaces. Rendering is stubbed here; a real MZ playtest
// covers MZ's tileset bitmaps and canvas pixels.
const assert = require('assert');
const fs = require('fs');

console.log('=== Testing Map Pictures ===');

const byId = {};
function makeNode(tag) {
    const attrs = {};
    const classes = new Set();
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', title: '', value: '', dataset: {},
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = String(v); this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; },
        setAttribute(k, v) { attrs[k] = String(v); }, getAttribute: k => attrs[k] || null,
        hasAttribute: k => Object.prototype.hasOwnProperty.call(attrs, k), removeAttribute(k) { delete attrs[k]; },
        addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        getBoundingClientRect: () => ({ left: 0, right: 120, top: 0, bottom: 28 }), closest: () => null, focus() {}
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
let testMode = true;
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: key => key === 'test' && testMode };
global.PluginManager = { parameters: () => ({ editorMode: 'true' }) };
let mapId = 1;
global.$gameMap = { mapId: () => mapId, tileWidth: () => 48, tileHeight: () => 48, tilesetId: () => 1, displayX: () => 7, displayY: () => 9 };
global.$dataMap = { width: 20, height: 10, tilesetId: 1, scrollType: 0, data: new Array(20 * 10 * 6).fill(0) };
global.$dataMapInfos = [null, { id: 1, name: 'Wide Field' }, { id: 2, name: 'Tall Tower' }];
global.$dataTilesets = [null, { tilesetNames: [], flags: [] }];
global.$dataDocsDoodads = { 1: [{ uid: 'tree', bit: [3, 'img/doodads/tree.png'], posMode: 1, x: 48, y: 48 }] };

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
    M.render = realRender;
    console.log('PASS current-only, deduped, guarded, non-blocking work');

    // 4. Tabs identify their picture to the hover card; an uncached map still has an accessible name.
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
    console.log('PASS tab and palette integration with accessible placeholders');

    console.log('\nAll map picture tests passed.');
})().catch(error => { console.error(error); process.exit(1); });
