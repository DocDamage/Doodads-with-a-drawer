// scratch/test_look.js
// The editor's look: size (CSS zoom, with window sizes and page-level pieces converted), light, dark and
// high-contrast themes on the --dd-* colours, colour-blind-safe map colours used by every overlay, the
// Look card, and Details remembering open sections and pinning sections to the top.
const assert = require('assert');

console.log('=== Testing Look and Details Memory ===');

const byId = {};
function makeNode(tag) {
    const classes = new Set();
    const attrs = {};
    const listeners = {};
    const n = {
        tagName: String(tag).toUpperCase(), style: { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; } },
        childNodes: [], parentNode: null, textContent: '', value: '', open: false,
        get innerHTML() { return this._html || ''; },
        set innerHTML(v) { this._html = v; this.childNodes = []; for (const m of String(v).matchAll(/id="([^"]+)"/g)) { const c = makeNode('div'); c.id = m[1]; this.appendChild(c); } },
        get id() { return attrs.id || ''; }, set id(v) { attrs.id = String(v); register(this); },
        get className() { return Array.from(classes).join(' '); },
        set className(v) { classes.clear(); String(v).split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },
        classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c), toggle() {} },
        appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); this.childNodes.push(c); c.parentNode = this; register(c); return c; },
        insertBefore(c, ref) { if (c.parentNode) c.parentNode.removeChild(c); const i = this.childNodes.indexOf(ref); this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, c); c.parentNode = this; return c; },
        removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; if (byId[c.id] === c) delete byId[c.id]; return c; },
        setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return k in attrs ? attrs[k] : null; },
        hasAttribute(k) { return k in attrs; }, removeAttribute(k) { delete attrs[k]; },
        matches(sel) { return sel.split(',').some(s => { s = s.trim(); return s[0] === '#' ? attrs.id === s.slice(1) : s[0] === '.' ? classes.has(s.slice(1)) : this.tagName === s.toUpperCase(); }); },
        closest(sel) { let x = this; while (x) { if (x.matches && x.matches(sel)) return x; x = x.parentNode; } return null; },
        querySelectorAll(sel) { const out = []; const walk = x => { for (const c of x.childNodes) { if (c.matches(sel)) out.push(c); walk(c); } }; walk(this); return out; },
        querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
        addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
        dispatch(type) { (listeners[type] || []).forEach(fn => fn({})); },
        removeEventListener() {},
        getBoundingClientRect: () => ({ left: 100, right: 160, top: 50, bottom: 80, width: 60, height: 30 })
    };
    return n;
}
function register(n) { if (n.id) byId[n.id] = n; }
const body = makeNode('body');
const html = makeNode('html');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.window.innerWidth = 1200;
global.window.innerHeight = 800;
global.document = {
    body, documentElement: html, createElement: makeNode,
    getElementById: id => byId[id] || null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48, displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y };

require('../Docs-Doodads.js');
const D = DocsDoodads, U = D.Ui, ws = D.Workspace;
ws.showToast = () => {};

// 1. Themes are values for the --dd-* colours only, and cover the surfaces.
const css = U.styleText();
const block = name => { const m = new RegExp(':root\\[data-dd-theme="' + name + '"\\] \\{([^}]*)\\}').exec(css); return m ? m[1] : ''; };
const base = /:root \{([^}]*)\}/.exec(css)[1];
const vars = text => new Set([...text.matchAll(/(--dd-[\w-]+)\s*:/g)].map(m => m[1]));
const baseVars = vars(base);
for (const theme of ['dark', 'contrast', 'playful']) {
    const v = vars(block(theme));
    assert.ok(v.size > 10, theme + ' sets the colours');
    for (const name of v) assert.ok(baseVars.has(name), `${theme}: ${name} is a theme colour`);
    for (const surface of ['--dd-panel', '--dd-panel-2', '--dd-field', '--dd-line', '--dd-text', '--dd-muted', '--dd-rim', '--dd-check-a', '--dd-switch-off']) {
        assert.ok(v.has(surface), `${theme} sets ${surface}`);
    }
}
// No plain white surfaces left in the theme: they follow --dd-panel (knobs and button text stay white).
const whites = css.split('\n').filter(l => /background:\s*#fff(fff)?\b/i.test(l));
const allowed = [/border: 3px solid var\(--dd-primary\)/, /box-shadow: 0 1px 2px/, /#b9b3cc/]; // slider thumb, switch knob, key cap
assert.ok(whites.length === 3 && whites.every(l => allowed.some(a => a.test(l))), whites.join(' | '));
// Dark text on dark panels would be unreadable: check the contrast of the main pairs.
const lum = hex => { const c = hex.match(/\w\w/g).map(x => parseInt(x, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const value = (text, name) => (new RegExp(name + ':\\s*(#[0-9a-f]{6})', 'i').exec(text) || [])[1];
assert.ok(ratio(value(block('dark'), '--dd-text'), value(block('dark'), '--dd-panel')) > 7, 'dark: text on panels');
assert.ok(ratio(value(block('dark'), '--dd-muted'), value(block('dark'), '--dd-panel')) > 4.5, 'dark: muted text');
assert.ok(ratio(value(block('contrast'), '--dd-muted'), value(block('contrast'), '--dd-panel')) > 12, 'high contrast: muted text is nearly black');
assert.ok(ratio(value(base, '--dd-text'), value(base, '--dd-panel')) > 7, 'light: text on panels');
// Playful: readable text on the cream cards, and white words on its filled buttons at 4.5:1 or better.
const playful = block('playful');
assert.ok(ratio(value(playful, '--dd-text'), value(playful, '--dd-panel')) > 7, 'playful: text on panels');
assert.ok(ratio(value(playful, '--dd-muted'), value(playful, '--dd-panel')) > 4.5, 'playful: muted text');
for (const fill of ['--dd-primary', '--dd-good', '--dd-danger']) assert.ok(ratio(value(playful, fill), '#ffffff') >= 4.5, 'playful: white on ' + fill);
assert.ok(U.themes.some(t => t.value === 'playful'), 'Playful is offered under Look');
assert.ok(/data-dd-theme="playful"\] \.dd-btn \{[^}]*border-radius: 999px/.test(css), 'playful: pill buttons');
console.log('✓ themes: only --dd-* colours, surfaces covered, readable contrast (Playful too)');

// 2. Look on the page, kept per computer.
U.applyLook();
assert.strictEqual(html.getAttribute('data-dd-theme'), null, 'light is the default');
assert.strictEqual(html.style['--dd-scale'], '1');
ws.container = makeNode('div');
ws.container.id = 'dd-asset-workspace-root';
body.appendChild(ws.container);
ws.mounted = true;
ws.layoutPanels = () => {};
assert.ok(ws.setLook('theme', 'dark'));
assert.strictEqual(html.getAttribute('data-dd-theme'), 'dark');
assert.ok(ws.setLook('theme', 'playful'));
assert.strictEqual(html.getAttribute('data-dd-theme'), 'playful');
ws.setLook('theme', 'dark');
assert.strictEqual(U.prefs().theme, 'dark');
ws.setLook('theme', 'nonsense');
assert.strictEqual(html.getAttribute('data-dd-theme'), null, 'unknown: light');
ws.setLook('uiScale', '1.25');
assert.strictEqual(U.uiScale(), 1.25);
assert.strictEqual(html.style['--dd-scale'], '1.25', 'question cards scale too');
assert.strictEqual(ws.container.style.zoom, '1.25');
assert.deepStrictEqual([ws.container.style.width, ws.container.style.height], ['960px', '640px'], 'the workspace still fills the window');
assert.deepStrictEqual(ws.roomSize(), { w: 960, h: 640 });
ws.setLook('uiScale', 3);
assert.strictEqual(U.uiScale(), 1, 'only 100, 125 and 150%');
assert.deepStrictEqual([ws.container.style.zoom, ws.container.style.width], ['', '100vw']);
assert.strictEqual(ws.setLook('nothing', 1), false);
console.log('✓ look on the page: theme attribute, --dd-scale, workspace zoom and size, kept per computer');

// 3. Sizes: places inside the workspace use its own units; page-level pieces are converted.
U.setPref('uiScale', 1.5);
const add = (id, rect) => { const n = makeNode('div'); n.id = id; if (rect) n.getBoundingClientRect = () => rect; ws.container.appendChild(n); return n; };
add('dd-toolbar', { left: 8, right: 792, top: 8, bottom: 72, width: 784, height: 64 });
const btn = add('dd-more-btn', { left: 700, right: 754, top: 12, bottom: 66, width: 54, height: 54 });
add('dd-drawer-panel', { left: 8, right: 258, top: 80, bottom: 500 });
add('dd-inspector-panel', { left: 500, right: 790, top: 80, bottom: 500 });
const pop = add('dd-pop'); pop.offsetWidth = 270;
ws.placePopover(pop, 'dd-more-btn');
assert.strictEqual(pop.style.left, Math.round(800 - 270 - 8) + 'px', 'kept inside the window (800 units wide at 150%)');
const hint = add('dd-hint');
ws.placeHint();
assert.strictEqual(hint.style.left, Math.round(266 + (492 - 266) / 2) + 'px');
const stack = makeNode('div'); stack.id = 'dd-progress-stack'; body.appendChild(stack);
ws.placeReadouts();
assert.deepStrictEqual([stack.style.right, stack.style.top], [Math.round((800 - 492) * 1.5) + 'px', Math.round(80 * 1.5) + 'px'], 'page-level pills in window pixels');
// The hover card and tooltips are on the page too.
D.AnimatedThumb.framesFor = () => null;
const card = makeNode('div'); card.getBoundingClientRect = () => ({ left: 20, right: 120, top: 200, bottom: 300 });
ws.container.appendChild(card);
const hc = ws.showHoverCard({ id: 'a', path: 'img/doodads/a.png', fileName: 'a.png', width: 1, height: 1, placement: {} }, card);
assert.deepStrictEqual([hc.style.left, hc.style.top], [Math.round(258 * 1.5 + 10) + 'px', '300px']);
ws.hideHoverCard(true);
const tipped = makeNode('button'); tipped.setAttribute('data-dd-tip', 'Save (Ctrl+S)'); ws.container.appendChild(tipped);
const tip = U.showTooltip(tipped);
assert.deepStrictEqual([tip.style.left, tip.style.top], [Math.round(130 * 1.5 - 80) + 'px', Math.round(80 * 1.5 + 8) + 'px'], 'under the button as it appears');
U.hideTooltip();
U.setPref('uiScale', 1);
console.log('✓ sizes: workspace units inside, window pixels for page-level pills, hover card and tooltips');

// 4. Map colours: one palette, standard or colour-blind safe, used by every overlay.
const std = U.mapPalettes.standard, safe = U.mapPalettes.safe;
assert.deepStrictEqual(Object.keys(safe).sort(), Object.keys(std).sort(), 'every colour has a safe version');
assert.strictEqual(U.mapColor('guideAlign'), std.guideAlign);
ws.setLook('mapColors', 'safe');
assert.strictEqual(U.mapColor('guideAlign'), safe.guideAlign);
assert.strictEqual(U.mapColor('nope'), undefined);
// Simulated deuteranopia, protanopia and tritanopia (Machado et al. 2009, severity 1): colours that sit
// together on the map stay apart.
const M = {
    deutan: [[0.367, 0.861, -0.228], [0.280, 0.673, 0.047], [-0.012, 0.043, 0.969]],
    protan: [[0.152, 1.053, -0.205], [0.115, 0.786, 0.099], [-0.004, -0.048, 1.052]],
    tritan: [[1.256, -0.077, -0.179], [-0.078, 0.931, 0.148], [0.005, 0.691, 0.304]]
};
const lin = c => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const see = (c, m) => { const l = lin(c); return m.map(r => Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))); };
const lab = rgb => {
    const [r, g, b] = rgb;
    const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505), y = f(0.2126 * r + 0.7152 * g + 0.0722 * b), z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
const apart = (a, b, m) => { const p = lab(see(a, m)), q = lab(see(b, m)); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
const groups = [['guideAlign', 'guideSpacing', 'guideTile'], ['brushPaint', 'brushErase'], ['added', 'changed', 'removed'],
    ['raise', 'lower', 'flatten', 'set', 'erase'], ['full', 'bottomHalf', 'bottomThird', 'center', 'trunk', 'thinWall', 'wideWall']];
let worstSafe = Infinity, worstStd = Infinity;
for (const group of groups) for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
    for (const m of Object.values(M)) {
        worstSafe = Math.min(worstSafe, apart(safe[group[i]], safe[group[j]], m));
        worstStd = Math.min(worstStd, apart(std[group[i]], std[group[j]], m));
    }
}
assert.ok(worstSafe > 15, 'safe colours stay apart for colour-blind eyes: ' + worstSafe.toFixed(1));
assert.ok(worstSafe > worstStd, `and further apart than the standard ones (${worstSafe.toFixed(1)} vs ${worstStd.toFixed(1)})`);
// The overlays draw with them.
const lines = [];
const g = { lineStyle(w, c) { lines.push(c); }, beginFill(c) { lines.push(c); }, endFill() {}, drawRect() {}, drawCircle() {}, moveTo() {}, lineTo() {}, addChild() {} };
ws.historyOverlayRects = D.Workspace.historyOverlayRects;
ws._historyDiff = { doodads: { added: [{ x: 0, y: 0 }], changed: [{ backup: { x: 0, y: 0 } }], removed: [{ x: 0, y: 0 }] } };
assert.deepStrictEqual(ws.historyOverlayRects().map(r => r.color), [safe.added, safe.changed, safe.removed]);
ws._historyDiff = null;
ws.activeGuides = [{ axis: 'x', at: 1, from: 0, to: 2 }, { axis: 'y', kind: 'spacing', at: 1, from: 0, to: 2 }, { axis: 'x', kind: 'tile', at: 1, from: 0, to: 2 }];
ws.symmetryFor = () => ({ mode: 'x', axisX: 0, axisY: 0 });
ws.placementTool = 'brush';
ws._brushHover = { x: 10, y: 10 };
ws.showCollision = false;
ws.drawEditorOverlayExtras(g);
for (const name of ['guideAlign', 'guideSpacing', 'guideTile', 'mirror', 'brushPaint']) assert.ok(lines.includes(safe[name]), name);
lines.length = 0;
ws.placementTool = 'terrain';
ws.terrainBrush.mode = 'lower';
ws._terrainHover = { tileX: 2, tileY: 2 };
D.Terrain.grid = () => null;
ws.drawEditorOverlayExtras(g);
assert.ok(lines.includes(safe.lower), 'the Hills brush');
ws.setLook('mapColors', 'standard');
console.log(`✓ map colours: one palette for every overlay; the safe set stays apart under simulated colour blindness (worst ${worstSafe.toFixed(1)})`);

// 5. The Look card.
const lookCard = ws.showLookCard();
assert.ok(lookCard && lookCard.parentNode === body);
assert.ok(/100%/.test(lookCard.innerHTML) && /150%/.test(lookCard.innerHTML) && /High contrast/.test(lookCard.innerHTML) && /Colour-blind safe/.test(lookCard.innerHTML));
assert.ok(/Lined up with a doodad/.test(lookCard.innerHTML), 'with a key to the map colours');
byId['dd-look-theme'].onchange({ target: { value: 'contrast' } });
assert.strictEqual(html.getAttribute('data-dd-theme'), 'contrast');
byId['dd-look-colors'].onchange({ target: { value: 'safe' } });
assert.ok(byId['dd-look-key'] !== undefined && new RegExp('#' + safe.guideAlign.toString(16)).test(byId['dd-look-card'].innerHTML), 'the key follows the colours');
byId['dd-look-scale'].onchange({ target: { value: '1.5' } });
assert.strictEqual(U.uiScale(), 1.5);
byId['dd-look-close'].onclick();
assert.ok(!byId['dd-look-card']);
ws.mapEntries = () => [];
const palette = ws.paletteCommands().map(c => c.label);
for (const label of ['Look: size, theme, map colours', 'Editor size 125%', 'Theme: Dark', 'Map colours: colour-blind safe']) assert.ok(palette.includes(label), label);
ws.setLook('theme', 'light'); ws.setLook('uiScale', 1); ws.setLook('mapColors', 'standard');
console.log('✓ look card: size, theme and map colours, with a key; palette entries');

// 6. Details memory.
const content = makeNode('div');
content.id = 'dd-inspector-content';
const section = (title, open, parent) => {
    const d = makeNode('details'); d.open = open;
    const s = makeNode('summary'); s.textContent = title; d.appendChild(s);
    (parent || content).appendChild(d);
    return d;
};
let renders = 0;
ws.renderInspector = () => {
    renders++;
    content.childNodes = [];
    const intro = makeNode('div'); content.appendChild(intro);
    section('Lighting', true);
    const fx = section('3D View (this map)', false);
    section('Inner', false, fx);
    section('Sound (this map)', false);
};
ws.refreshInspector();
const titles = () => content.childNodes.filter(c => c.tagName === 'DETAILS').map(d => d.querySelector('summary').textContent.replace(/[☆★]/g, ''));
const byTitle = t => content.childNodes.find(c => c.tagName === 'DETAILS' && c.querySelector('summary').textContent.startsWith(t));
assert.deepStrictEqual(titles(), ['Lighting', '3D View (this map)', 'Sound (this map)']);
assert.strictEqual(byTitle('Lighting').querySelector('.dd-pin').textContent, '☆', 'each section has a pin');
assert.strictEqual(byTitle('3D View').querySelectorAll('.dd-pin').length, 1, 'not the section inside it');
// Opening and closing is remembered across redraws.
const sound = byTitle('Sound');
sound.open = true; sound.dispatch('toggle');
const light = byTitle('Lighting');
light.open = false; light.dispatch('toggle');
assert.deepStrictEqual(U.prefs().detailsOpen, { 'Sound (this map)': true, Lighting: false });
ws.refreshInspector();
assert.strictEqual(byTitle('Sound').open, true);
assert.strictEqual(byTitle('Lighting').open, false);
assert.strictEqual(byTitle('3D View').open, false, 'untouched sections keep their own default');
// Pinning moves a section to the top, in pin order; the pin's click does not fold the section.
let prevented = false, stopped = false;
byTitle('Sound').querySelector('.dd-pin').onclick({ preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
assert.ok(prevented && stopped);
assert.deepStrictEqual(titles(), ['Sound (this map)', 'Lighting', '3D View (this map)']);
assert.strictEqual(byTitle('Sound').querySelector('.dd-pin').textContent, '★');
assert.ok(content.childNodes[0].tagName === 'DIV', 'other content stays where it was');
ws.toggleDetailsPin('3D View (this map)');
assert.deepStrictEqual(titles(), ['Sound (this map)', '3D View (this map)', 'Lighting']);
ws.toggleDetailsPin('Sound (this map)');
assert.deepStrictEqual(titles(), ['3D View (this map)', 'Lighting', 'Sound (this map)'], 'unpinned: back in its place');
assert.deepStrictEqual(U.prefs().detailsPinned, ['3D View (this map)']);
assert.ok(renders >= 4);
console.log('✓ details memory: open sections remembered, pins move sections to the top in order');

// The top bar fits MZ's 816-pixel window at every size: the words go first, then it takes a second row.
const barOf = (need, tightNeed) => {
    const classes = new Set();
    return { clientWidth: 600, classes, classList: { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)) },
        get scrollWidth() { return classes.has('dd-wrap') ? 600 : classes.has('dd-tight') ? tightNeed : need; } };
};
const roomy = barOf(560, 400), tight = barOf(760, 590), crowded = barOf(900, 700);
assert.strictEqual(ws.fitToolbar(roomy), 'full');
assert.strictEqual(ws.fitToolbar(tight), 'tight');
assert.deepStrictEqual([...tight.classes], ['dd-tight']);
assert.strictEqual(ws.fitToolbar(crowded), 'wrap');
assert.deepStrictEqual([...crowded.classes].sort(), ['dd-tight', 'dd-wrap']);
crowded.clientWidth = 1000;
assert.strictEqual(ws.fitToolbar(crowded), 'full', 'room again: back to the full bar');
assert.strictEqual(crowded.classes.size, 0);
const barCss = D.Ui.css;
assert.ok(/#dd-toolbar\.dd-tight[^{]*\.dd-tool b \{ display: none; \}/.test(barCss) && /#dd-toolbar\.dd-wrap \{ flex-wrap: wrap;/.test(barCss));
console.log('✓ the top bar fits: without words, then on two rows');

console.log('=== Look and details memory passed ===');
