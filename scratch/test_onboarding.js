// scratch/test_onboarding.js
// Onboarding: a short tour the first time each tool is picked (replayable, or off for good), sample items
// to play with (pictures drawn here, two prefabs and a biome, added once), and What's New after an update.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing Tours, Sample Items and What\'s New ===');

const byId = {};
function makeNode(tag) {
    return {
        tagName: String(tag).toUpperCase(), style: {}, childNodes: [], parentNode: null, textContent: '', value: '',
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        appendChild(c) { this.childNodes.push(c); c.parentNode = this; if (c.id) byId[c.id] = c; (c.childNodes || []).forEach(x => { if (x.id) byId[x.id] = x; }); return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; (c.childNodes || []).forEach(x => { if (byId[x.id] === x) delete byId[x.id]; }); return c; },
        setAttribute() {}, addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null,
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} }
    };
}
const body = makeNode('body');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body, documentElement: makeNode('html'), createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$dataDocsDoodads = { 1: [] };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0 };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, U = D.Ui, Art = D.SampleArt;
const toasts = [];
ws.showToast = (msg, kind) => toasts.push([msg, kind]);
ws.refreshSpriteset = () => {};
ws.refreshInspector = () => {};
ws.refreshDrawerCards = () => {};
const prefs = () => JSON.parse(store['docsDoodads.ui'] || '{}');
const add = (id, rect, hidden) => { const n = makeNode('div'); n.id = id; byId[id] = n; n.getBoundingClientRect = () => rect; if (hidden) n.style.display = 'none'; return n; };

(async () => {
    // 1. Sample pictures: drawn at double size, with an outline and see-through background.
    const sizes = {};
    for (const kind of Art.kinds) {
        const art = Art.draw(kind);
        sizes[kind] = [art.width, art.height];
        let solid = 0, clear = 0;
        for (let i = 3; i < art.rgba.length; i += 4) { if (art.rgba[i]) solid++; else clear++; }
        assert.ok(solid > 40 && clear > 40, kind + ': a picture with a see-through background');
        for (let y = 0; y < art.height; y += 2) for (let x = 0; x < art.width; x += 2) {
            const i = (y * art.width + x) * 4, j = ((y + 1) * art.width + x + 1) * 4;
            assert.strictEqual(art.rgba[i + 3], art.rgba[j + 3], kind + ': pixels doubled');
        }
    }
    assert.deepStrictEqual(sizes, { bush: [48, 36], flowers: [36, 24], rock: [36, 24], lamp: [24, 80] });
    assert.strictEqual(Art.draw('nope'), null);
    const png = Buffer.from(D.AsepriteSheets.encodePng(48, 36, Art.draw('bush').rgba, d => zlib.deflateSync(d)));
    assert.strictEqual(png.slice(1, 4).toString(), 'PNG');
    assert.deepStrictEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [48, 36]);
    console.log('✓ sample pictures: bush, flowers, rock and lamp, doubled, outlined, valid PNGs');

    // 2. Adding sample items in a project: pictures, Item Bag entries, two prefabs and a biome, once.
    const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-samples-'));
    const cwd = process.cwd();
    process.chdir(project);
    D.AssetIndex.data = { version: 1, assets: {}, collections: {} };
    D.AssetIndex.save = () => {};
    D.Prefabs.list = []; D.Prefabs.loaded = true;
    let prefabSaves = 0;
    D.Prefabs.save = () => { prefabSaves++; return true; };
    ws.mounted = true;
    const result = await ws.addSampleContent();
    assert.deepStrictEqual([result.drawn, result.prefabs], [4, 2]);
    for (const kind of Art.kinds) assert.ok(fs.existsSync(path.join(project, 'img/doodads/samples', `sample_${kind}.png`)), kind + ' written');
    const bush = D.AssetIndex.data.assets['img/doodads/samples/sample_bush.png'];
    assert.ok(bush && bush.width === 48 && bush.height === 36, 'in the Item Bag with its size');
    assert.ok(D.AssetIndex.list.some(a => a.fileName === 'sample_lamp.png'));
    const garden = D.Prefabs.list.find(p => p.name === 'Sample Garden');
    assert.ok(garden && garden.doodads.length === 4, 'a garden of four pieces');
    assert.ok(garden.doodads.every(d => d.bit[1].startsWith('img/doodads/samples/') && !d.uid && !d.layer));
    const lampPrefab = D.Prefabs.list.find(p => p.name === 'Sample Lamp Post');
    assert.ok(lampPrefab.doodads[0].light.enabled && lampPrefab.doodads[0].light.when === 'dark', 'a lamp that lights up after dark');
    assert.strictEqual(prefabSaves, 1);
    const meadow = D.World.get('biomes.list').find(b => b.name === 'Sample Meadow');
    assert.ok(meadow && meadow.entries.length === 3 && meadow.entries.every(e => e.path.startsWith('img/doodads/samples/')));
    assert.strictEqual(ws.biomeSettings.biomeId, meadow.id, 'ready to paint');
    assert.ok(/Sample items ready/.test(toasts[toasts.length - 1][0]));
    // Again: nothing doubled, nothing overwritten.
    const mtime = fs.statSync(path.join(project, 'img/doodads/samples/sample_rock.png')).mtimeMs;
    const again = await ws.addSampleContent();
    assert.deepStrictEqual([again.drawn, again.prefabs, again.biome], [0, 0, meadow.id]);
    assert.strictEqual(D.Prefabs.list.length, 2);
    assert.strictEqual(D.World.get('biomes.list').filter(b => b.name === 'Sample Meadow').length, 1);
    assert.strictEqual(fs.statSync(path.join(project, 'img/doodads/samples/sample_rock.png')).mtimeMs, mtime, 'a picture already there is kept');
    process.chdir(cwd);
    fs.rmSync(project, { recursive: true, force: true });
    console.log('✓ sample items: pictures, Item Bag, Sample Garden, Sample Lamp Post, Sample Meadow; added once');

    // 3. Tool tours.
    ws.container = makeNode('div');
    add('dd-drawer-panel', { left: 8, right: 258, top: 80, bottom: 700 });
    add('dd-inspector-panel', { left: 900, right: 1190, top: 80, bottom: 700 });
    add('dd-brush-popover', { left: 300, right: 570, top: 84, bottom: 300 });
    add('dd-hint', { left: 400, right: 800, top: 740, bottom: 770 });
    store['docsDoodads.ui'] = JSON.stringify({ welcomed: true });
    ws.setPlacementTool('stamp');
    let tour = byId['dd-tour'];
    assert.ok(tour, 'the first Stamp shows its tour');
    assert.ok(/1 of 3/.test(tour.innerHTML));
    assert.ok(/Item Bag/.test(byId['dd-tour-text'].textContent));
    assert.deepStrictEqual([tour.style.left, tour.style.top], ['268px', '140px'], 'beside the Item Bag');
    assert.ok(prefs().toursSeen.stamp, 'seen');
    byId['dd-tour-next'].onclick();
    assert.ok(/2 of 3/.test(byId['dd-tour'].innerHTML));
    assert.strictEqual(byId['dd-tour'].style.left, Math.round((266 + 892) / 2 - 130) + 'px', 'over the map');
    byId['dd-tour-next'].onclick();
    assert.ok(/Got it/.test(byId['dd-tour'].innerHTML));
    assert.strictEqual(byId['dd-tour'].style.top, (740 - 120) + 'px', 'above the hint');
    byId['dd-tour-next'].onclick();
    assert.ok(!byId['dd-tour'], 'done');
    ws.setPlacementTool(null);
    ws.setPlacementTool('stamp');
    assert.ok(!byId['dd-tour'], 'once per tool');
    // Another tool ends a tour halfway; its options card is pointed at.
    ws.setPlacementTool('brush');
    assert.strictEqual(byId['dd-tour'].style.top, '310px', 'under the Scatter options');
    ws.setPlacementTool('select');
    assert.ok(!byId['dd-tour'], 'picking another tool closes it');
    // No more tours, then Replay.
    ws.setPlacementTool('path');
    byId['dd-tour-off'].onclick();
    assert.strictEqual(prefs().toursOff, true);
    ws.setPlacementTool('terrain');
    assert.ok(!byId['dd-tour'], 'off: no tours');
    ws.replayTours();
    assert.deepStrictEqual([prefs().toursSeen, prefs().toursOff], [{}, false]);
    ws.setPlacementTool('stamp');
    assert.ok(byId['dd-tour'], 'they come back');
    ws.endTour();
    assert.ok(!ws.maybeStartTour('nonsense'));
    console.log('✓ tours: first pick of each tool, steps placed by what they explain, closed by another tool, off and replay');

    // 4. What's New and the welcome card.
    store['docsDoodads.ui'] = JSON.stringify({});
    assert.strictEqual(ws.maybeShowWhatsNew(), false, 'not before the welcome');
    ws.showWelcome();
    assert.ok(byId['dd-welcome-samples'] && byId['dd-welcome-tours'] && byId['dd-welcome-new']);
    byId['dd-welcome-ok'].onclick();
    assert.ok(prefs().welcomed && prefs().whatsNewSeen === D.WhatsNew.id, 'someone new has nothing new to catch up on');
    assert.strictEqual(ws.maybeShowWhatsNew(), false);
    // After an update: shown once.
    store['docsDoodads.ui'] = JSON.stringify({ welcomed: true, whatsNewSeen: 'older' });
    assert.strictEqual(ws.maybeShowWhatsNew(), true);
    const card = byId['dd-whats-new'];
    assert.ok(card && D.WhatsNew.items.every(i => card.innerHTML.includes(i.replace(/'/g, '&#39;')) || card.innerHTML.includes(i)));
    byId['dd-whats-new-ok'].onclick();
    assert.ok(!byId['dd-whats-new'] && prefs().whatsNewSeen === D.WhatsNew.id);
    assert.strictEqual(ws.maybeShowWhatsNew(), false);
    // Its Replay button and the welcome card's buttons do what they say.
    ws.showWhatsNew();
    byId['dd-whats-new-tours'].onclick();
    assert.deepStrictEqual(prefs().toursSeen, {});
    let samples = 0;
    ws.addSampleContent = async () => { samples++; };
    ws.showWelcome();
    byId['dd-welcome-samples'].onclick();
    assert.strictEqual(samples, 1);
    ws.showWelcome();
    byId['dd-welcome-new'].onclick();
    assert.ok(byId['dd-whats-new']);
    ws.mapEntries = () => [];
    const palette = ws.paletteCommands().map(c => c.label);
    for (const l of ['Replay Tool Tours', 'Add Sample Items (pictures, prefabs, a biome)', "What's New", 'How to Use (welcome card)']) assert.ok(palette.includes(l), l);
    assert.ok(/maybeShowWhatsNew\(\)/.test(String(ws.buildDom)) && /endTour\(\)/.test(String(ws.close)));
    console.log("✓ what's new: once after an update (not for someone new); welcome card buttons; palette");

    console.log("=== Tours, sample items and what's new passed ===");
})().catch(e => { console.error(e); process.exit(1); });
