// scratch/test_map_tools.js
// Map tools: the clock at the top of the map panel (preview a time and season, run the day fast), the
// sounds on a map (where each reaches, region-sound tiles, Listen at a tile), and the speed readout
// (frames a second, draw calls, pictures loaded, doodads and lights, with warnings).
const assert = require('assert');

console.log('=== Testing Clock, Sounds and Speed ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '', disabled: false,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
        getBoundingClientRect: () => ({ left: 900, right: 1190, top: 80, bottom: 700 })
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body, documentElement: makeNode('html'), activeElement: null, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
const regions = { '5,5': 3, '6,5': 3 };
global.$gameMap = {
    mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y,
    regionId: (x, y) => regions[x + ',' + y] || 0, deltaX: (a, b) => a - b, deltaY: (a, b) => a - b, events: () => [],
    roundX: x => x, roundY: y => y, isValid: () => true
};
global.Graphics = { width: 816, height: 624 };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, U = D.Ui;
const wait = ms => new Promise(r => setTimeout(r, ms));
ws.showToast = () => {};
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.mounted = true;
D.Perspective.liveCamera = () => null;

(async () => {
    // 1. The clock.
    D.World.settings().seasons.names = ['Spring', 'Summer', 'Autumn', 'Winter'];
    ws.previewMinutes = null;
    ws.previewSeason = null;
    const bar = makeNode('div');
    bar.innerHTML = ws.renderClockBar();
    body.appendChild(bar);
    assert.ok(/Season: the game's/.test(bar.innerHTML) && /Winter/.test(bar.innerHTML));
    assert.ok(/id="dd-clock-now"[^>]*disabled/.test(bar.innerHTML), 'Now is off while nothing is previewed');
    ws.bindClockBar();
    byId['dd-clock-slider'].value = '1110';
    byId['dd-clock-slider'].oninput();
    assert.strictEqual(ws.previewMinutes, 1110);
    assert.strictEqual(D.Atmosphere.minutes(), 1110, 'the map follows the preview');
    assert.strictEqual(byId['dd-clock-time'].textContent, D.TimeOfDay.format(1110));
    assert.strictEqual(byId['dd-clock-now'].disabled, false);
    assert.strictEqual(ws.setClock(1440 + 30), 30, 'past midnight wraps');
    assert.strictEqual(ws.setClock(-5), 1435);
    byId['dd-clock-season'].value = '3';
    byId['dd-clock-season'].onchange();
    assert.strictEqual(ws.previewSeason, 3);
    assert.strictEqual(D.Atmosphere.season(), 3, 'the map shows Winter');
    // Play runs the clock fast; the slider stops it.
    ws.setClock(600);
    byId['dd-clock-play'].onclick();
    assert.strictEqual(byId['dd-clock-play'].textContent, '❚❚');
    await wait(130);
    assert.ok(ws.previewMinutes >= 610, 'a few ticks of five minutes: ' + ws.previewMinutes);
    byId['dd-clock-play'].onclick();
    const stopped = ws.previewMinutes;
    await wait(80);
    assert.strictEqual(ws.previewMinutes, stopped, 'paused');
    assert.strictEqual(byId['dd-clock-play'].textContent, '▶');
    ws.playClock();
    byId['dd-clock-slider'].value = '0';
    byId['dd-clock-slider'].oninput();
    assert.strictEqual(ws._clockTimer, null, 'dragging the slider stops Play');
    // Now: back to the game's time and season.
    byId['dd-clock-now'].onclick();
    assert.strictEqual(ws.previewMinutes, null);
    assert.strictEqual(ws.previewSeason, null);
    assert.strictEqual(byId['dd-clock-season'].value, '-1');
    // The map panel starts with it.
    assert.ok(/renderClockBar\(\)/.test(String(ws.renderMapPanel)) && /bindClockBar\(\)/.test(String(ws.renderMapPanel)));
    console.log('✓ clock: preview a time (wrapping) and season, Play runs the day, Now goes back');

    // 2. What a tile hears.
    const torch = Object.assign(D.standardStruct(), { x: 240, y: 288, bit: [3, 'img/doodads/torch.png'], sound: { file: 'bgs/Fire', volume: 80, radius: 4 } });
    const bird = Object.assign(D.standardStruct(), { x: 960, y: 288, bit: [3, 'img/doodads/tree.png'], sound: { file: 'se/Bird1', volume: 60, radius: 3, every: 5 } });
    global.$dataDocsDoodads = { 1: [torch, bird], mapSettings: { 1: { regionSounds: [{ regionId: 3, name: 'Wind', volume: 70, fade: 1 }] } } };
    D.World.settings().ambience.layers = [{ kind: 'water', sound: 'River', volume: 60, radius: 4, quiet: 0.4, pitch: 100 }, { kind: 'trees', sound: '', volume: 50 }];
    D.Ambience.query = () => ({ match: (layer, x, y) => (layer.kind === 'water' && x >= 6 && x <= 10 && y < 12 ? 1 : 0), doodads: [], tw: 48, th: 48 });
    // The torch's tile is (4, 5) in sound terms; three tiles right of it the fire is fainter.
    const near = ws.listenAt(4, 5);
    const fire = near.find(s => s.name === 'Fire');
    assert.ok(fire && fire.loop && fire.folder === 'bgs' && fire.volume === 80, 'right at the torch: full volume');
    const there = ws.listenAt(6, 5);
    const names = there.map(s => s.name);
    assert.ok(names.includes('Fire') && names.includes('Wind') && names.includes('River'), names.join(','));
    assert.ok(there.find(s => s.name === 'Fire').volume < 80, 'the fire is fainter further away');
    assert.ok(there.find(s => s.name === 'Fire').pan < 0, 'and to the left');
    assert.strictEqual(there.find(s => s.name === 'Wind').kind, 'Region 3');
    assert.deepStrictEqual(there.map(s => s.volume), there.map(s => s.volume).slice().sort((a, b) => b - a), 'loudest first');
    assert.ok(!names.includes('Bird1'), 'the bird is out of reach');
    assert.deepStrictEqual(ws.listenAt(30, 30), [], 'a silent tile');
    // Listen plays it (loops as background sounds, one-shots as sound effects) and lists it.
    const played = [], stoppedBuffers = [];
    global.AudioManager = {
        _bgsVolume: 90,
        createBuffer: (folder, name) => ({ folder, name, play(loop) { played.push(['bgs', name, loop]); }, stop() { stoppedBuffers.push(name); } }),
        updateBufferParameters: (buffer, master, p) => { buffer.params = p; },
        playSe: se => played.push(['se', se.name, se.volume])
    };
    const heard = ws.listenHere(6, 5);
    assert.deepStrictEqual(played.map(p => p[1]).sort(), heard.map(s => s.name).sort());
    assert.ok(played.every(p => p[0] === 'bgs' && p[2] === true), 'looping sounds loop');
    const card = byId['dd-listen-card'];
    assert.ok(card && /Tile 6, 5/.test(card.innerHTML) && /River/.test(card.innerHTML) && /Region 3/.test(card.innerHTML));
    assert.deepStrictEqual(ws._listenProbe, { tileX: 6, tileY: 5 });
    // Another tile replaces what plays; a one-shot plays as a sound effect.
    played.length = 0;
    ws.listenHere(19, 5);
    assert.ok(stoppedBuffers.includes('Fire') && stoppedBuffers.includes('River'), 'the last tile stops');
    assert.deepStrictEqual(played.filter(p => p[0] === 'se').map(p => p[1]), ['Bird1']);
    ws.listenHere(30, 30);
    assert.ok(/Silent here/.test(byId['dd-listen-card'].innerHTML));
    assert.strictEqual(byId['dd-listen-card'].style.bottom, '44px');
    const perfBox = makeNode('div'); perfBox.id = 'dd-perf'; perfBox.offsetHeight = 90; byId[perfBox.id] = perfBox;
    ws.listenHere(30, 30);
    assert.strictEqual(byId['dd-listen-card'].style.bottom, (42 + 90 + 8) + 'px', 'above the speed readout');
    delete byId['dd-perf'];
    // Stop, Esc or another tool ends it.
    ws.setPlacementTool = D.Workspace.setPlacementTool;
    ws.placementTool = 'listen';
    byId['dd-listen-stop'].onclick();
    assert.ok(!byId['dd-listen-card'] && !ws._listenProbe);
    assert.strictEqual(ws.placementTool, null);
    ws.placementTool = 'listen';
    ws.listenHere(6, 5);
    ws.setPlacementTool('stamp');
    assert.ok(!ws._listenProbe, 'another tool stops listening');
    // The canvas: a click with Listen out listens there.
    byId.GameCanvas = makeNode('canvas');
    ws.attachCanvasListeners();
    ws.clientToMapCoords = () => ({ x: 300, y: 260, tileX: 6, tileY: 5 });
    ws.placementTool = 'listen';
    ws._onCanvasClick({ clientX: 1, clientY: 1, button: 0, preventDefault() {} });
    assert.deepStrictEqual(ws._listenProbe, { tileX: 6, tileY: 5 });
    assert.strictEqual(U.hints.listen.slice(0, 7), 'Listen:');
    console.log('✓ listen: what a tile hears (sources, region, ambience), played and listed, stopped by Stop or another tool');

    // 3. The sound overlay: each source's reach, region-sound tiles, and the ambience radius round the probe.
    const g = { circles: [], rects: [], fills: [], lineStyle() {}, beginFill(c) { this.fills.push(c); }, endFill() {}, drawRect(x, y, w, h) { this.rects.push([x, y, w, h]); }, drawCircle(x, y, r) { this.circles.push([x, y, r]); }, moveTo() {}, lineTo() {} };
    ws._listenProbe = null;
    ws.showSounds = false;
    ws.drawSoundOverlay(g);
    assert.strictEqual(g.circles.length, 0, 'off: nothing');
    U.setPref = () => {};
    const label = makeNode('span'); label.id = 'dd-sounds-label'; byId[label.id] = label;
    assert.strictEqual(ws.toggleSoundOverlay(), true);
    assert.strictEqual(label.textContent, 'Hide Sounds');
    ws.drawSoundOverlay(g);
    assert.ok(g.circles.some(c => c[0] === 240 && c[1] === 264 && c[2] === 4 * 48), "the torch's reach");
    assert.ok(g.circles.some(c => c[2] === 3 * 48), "the bird's reach");
    assert.deepStrictEqual(g.rects.sort(), [[240, 240, 48, 48], [288, 240, 48, 48]], 'region-sound tiles shaded');
    assert.ok(g.fills.includes(U.mapColor('sound')) && g.fills.includes(U.mapColor('soundRegion')));
    g.circles = [];
    ws._listenProbe = { tileX: 6, tileY: 5 };
    ws.showSounds = false;
    ws.drawSoundOverlay(g);
    assert.deepStrictEqual(g.circles.map(c => c[2]), [4 * 48, 10], 'the River layer listens 4 tiles round the probe');
    D.Perspective.liveCamera = () => ({});
    g.circles = [];
    ws.drawSoundOverlay(g);
    assert.strictEqual(g.circles.length, 0, 'flat maps only');
    D.Perspective.liveCamera = () => null;
    ws._listenProbe = null;
    console.log('✓ sound overlay: reach circles, region tiles, ambience radius round the probe');

    // 4. Speed: draw calls are counted by wrapping WebGL while it shows, and put back after.
    let realDraws = 0;
    const realElements = function() { realDraws++; }, realArrays = function() { realDraws++; };
    const gl = { drawElements: realElements, drawArrays: realArrays };
    global.Graphics.app = { renderer: { gl, texture: { managedTextures: [{ realWidth: 2048, realHeight: 2048 }, { width: 1024, height: 1024 }] } } };
    global.requestAnimationFrame = fn => setTimeout(fn, 16);
    global.cancelAnimationFrame = id => clearTimeout(id);
    ws.container = makeNode('div');
    const perfLabel = makeNode('span'); perfLabel.id = 'dd-perf-label'; byId[perfLabel.id] = perfLabel;
    assert.strictEqual(ws.togglePerfOverlay(true), true);
    assert.strictEqual(perfLabel.textContent, 'Hide Speed');
    assert.notStrictEqual(gl.drawElements, realElements, 'wrapped');
    for (let i = 0; i < 90; i++) gl.drawElements();
    for (let i = 0; i < 30; i++) gl.drawArrays();
    assert.strictEqual(realDraws, 120, 'the real draws still happen');
    await wait(120);
    const stats = ws.updatePerf();
    assert.ok(stats.fps > 0, 'frames counted');
    assert.ok(stats.draws > 0, 'draw calls a frame: ' + stats.draws);
    assert.strictEqual(stats.textureMB, 20, '16 MB + 4 MB of pictures');
    assert.strictEqual(stats.doodads, 2);
    assert.strictEqual(stats.lit, 0);
    const el = byId['dd-perf'];
    assert.ok(el && el.parentNode === ws.container && /Frames a second/.test(el.innerHTML) && /20 MB/.test(el.innerHTML));
    // Over budget: marked and explained.
    const warn = ws.perfWarnings({ fps: 30, draws: 500, textureMB: 300, doodads: 900, lit: 40 });
    assert.deepStrictEqual(Object.keys(warn).sort(), ['doodads', 'draws', 'fps', 'lit', 'textureMB']);
    assert.ok(/pack this map's art/.test(warn.draws));
    assert.deepStrictEqual(ws.perfWarnings({ fps: 60, draws: 100, textureMB: 50, doodads: 10, lit: 2 }), {});
    torch.light = { radius: 120 };
    assert.strictEqual(ws.perfStats().lit, 1, 'a doodad with a light counts');
    ws.togglePerfOverlay(false);
    assert.strictEqual(gl.drawElements, realElements, 'WebGL is put back');
    assert.strictEqual(gl.drawArrays, realArrays);
    assert.ok(!byId['dd-perf']);
    assert.strictEqual(perfLabel.textContent, 'Show Speed');
    // Without a renderer: what can't be measured shows a dash.
    global.Graphics.app = null;
    ws.startPerf();
    const bare = ws.updatePerf();
    assert.strictEqual(bare.draws, null);
    assert.strictEqual(bare.textureMB, null);
    assert.ok(/–/.test(byId['dd-perf'].innerHTML));
    // Closing the editor stops all of it.
    ws.playClock();
    ws.listenHere(6, 5);
    ws.closeMapTools();
    assert.ok(!ws._clockTimer && !ws._listenProbe && !ws._perf && !byId['dd-perf']);
    assert.ok(/closeMapTools\(\)/.test(String(ws.close)));
    console.log('✓ speed: fps, draw calls (WebGL wrapped only while shown), pictures, doodads, lights, warnings');

    ws.mapEntries = () => [];
    const palette = ws.paletteCommands().map(c => c.label);
    for (const l of ['Clock: run the day fast', 'Show / Hide Sounds', 'Listen Here (click a tile)', 'Show / Hide Speed (performance)']) assert.ok(palette.includes(l), l);
    ws.stopClock();
    console.log('=== Clock, sounds and speed passed ===');
})().catch(e => { console.error(e); process.exit(1); });
