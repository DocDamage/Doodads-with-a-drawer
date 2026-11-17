// backlog 7.2.6: one searchable Settings page. The registry is pure data; looking through it must never
// render/bind a hidden inspector or alter map/editor state.
const assert = require('assert');
const fs = require('fs');

console.log('=== Testing Settings Index ===');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = undefined;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
const configured = {
    editKey: 'F9', editorMode: 'true', dataFileName: 'MyDoodads', doodadScaleMode: 'false', saveMode: 'true', splitByMap: 'true',
    defaultLayout: 'Worldbuilding', defaultThumbnailSize: '128', cacheEnabled: 'false', backgroundWorkBudget: '7',
    autosaveRecoveryInterval: '45', backupRetentionCount: '6', gridSnapShow: 'true', gridSnapWidth: '24', gridSnapHeight: '12', devDiagnostics: 'true'
};
global.PluginManager = { parameters: name => name === 'Docs-Doodads' ? configured : {} };
global.$gameSystem = {};

require('../Docs-Doodads.js');
const D = DocsDoodads, W = D.Workspace;

assert.strictEqual(typeof D.SettingsSearch.create, 'function', 'plain registry creator exists');
assert.strictEqual(typeof D.SettingsSearch.search, 'function', 'plain registry search exists');
assert.strictEqual(typeof W.refreshSettingsIndex, 'function', 'workspace can publish a fresh settingsIndex');

const entries = D.SettingsSearch.create([
    { id: 'world-sun', label: 'Sun shadow direction', words: 'lighting daylight', where: 'World / Sun', open() {} },
    { id: 'map-character-shadows', label: 'Character shadows on this map', words: 'people actors', where: 'Map / Lighting', open() {} }
]);
assert.strictEqual(entries.length, 2);
assert.deepStrictEqual(D.SettingsSearch.search(entries, 'shadow').map(x => x.id), ['world-sun', 'map-character-shadows']);
assert.deepStrictEqual(D.SettingsSearch.search(entries, 'shadow character').map(x => x.id), ['map-character-shadows']);
assert.throws(() => D.SettingsSearch.create(entries.concat(entries[0])), /duplicate/i, 'ids are unique');

const manyOptions = Array.from({ length: 30 }, (_, i) => `<option value="style-${i}">Long marker style ${i}</option>`).join('');
const selectFixture = `<div>Click marker on this map
    <select id="fixture-marker"><option value="">As World &gt; Destination</option><option value="square">MZ square</option>${manyOptions}</select></div>
    <div>Corner minimap when this map is flat<select id="fixture-minimap"><option value="auto">As World &gt; Minimap (off)</option><option>On</option><option>Off</option></select></div>
    <label><input type="checkbox" id="fixture-shadows" /> Character shadows on this map</label>`;
const fixtureControls = D.SettingsSearch.controlsFromHtml(selectFixture, 'Fixture');
const fixtureLabel = id => fixtureControls.find(row => row.controlId === id).label;
assert.strictEqual(fixtureLabel('fixture-marker'), 'Click marker on this map', 'long select options do not leak into its caption');
assert.strictEqual(fixtureLabel('fixture-minimap'), 'Corner minimap when this map is flat', 'select values do not become its caption');
assert.strictEqual(fixtureLabel('fixture-shadows'), 'Character shadows on this map', 'text after a checkbox remains its caption');
assert.ok(fixtureControls.every(row => !/<|option|value=|Long marker style|MZ square/.test(row.label)), 'labels contain no raw or option fragments');

const before = JSON.stringify({ selected: W.selectedDoodad, dirty: W.dirty, undo: D.Undo && D.Undo.stack });
const index = W.refreshSettingsIndex();
assert.ok(Array.isArray(W.settingsIndex) && W.settingsIndex === index);
assert.ok(index.length > 30, 'map, world, editor and plugin settings are indexed');
assert.strictEqual(JSON.stringify({ selected: W.selectedDoodad, dirty: W.dirty, undo: D.Undo && D.Undo.stack }), before,
    'building/browsing the index has no editor side effects');
assert.ok(D.SettingsSearch.search(index, 'shadow').some(x => /sun/i.test(x.label + ' ' + x.words)), 'shadow finds sun controls');
assert.ok(D.SettingsSearch.search(index, 'shadow').some(x => /character/i.test(x.label + ' ' + x.words)), 'shadow finds character shadows');

// Every setting control in the exact inert HTML used by the live map panel (including mapSections extensions)
// is represented. Only search, transient previews and object-authoring pickers are deliberately excluded.
const mapId = W.currentMapId(), mapSettings = D.Lighting.mapSettings(mapId) || {};
const ambient = Object.assign({}, D.Lighting.ambientDefaults, mapSettings.ambient || {});
const mapHtml = W.renderMapPanelHtml(mapId, mapSettings, ambient);
const actualControls = D.SettingsSearch.controlsFromHtml(mapHtml, 'Map', W.settingsControlOmit());
const indexedControls = new Set(index.map(x => x.controlId).filter(Boolean));
for (const control of actualControls) assert.ok(indexedControls.has(control.controlId), `${control.controlId} is indexed`);
assert.ok(indexedControls.has('dd-cam2d-regions') && indexedControls.has('dd-minimap-mode'), 'mapSections extensions are indexed');

const header = fs.readFileSync(require.resolve('../src/00_header_and_plugin_parameters.js'), 'utf8');
const headerParams = Array.from(header.matchAll(/^ \* @param ([^\r\n]+)/gm), m => m[1]);
assert.strictEqual(headerParams.length, 23, 'fixture sees every header parameter, including tester trails');
assert.ok(headerParams.includes('comfortOptions') && headerParams.includes('softenMZEffects'));
const params = index.filter(x => x.kind === 'plugin-parameter');
assert.deepStrictEqual(params.map(x => x.param).sort(), headerParams.sort(), 'all and only header parameters are represented');
assert.strictEqual(new Set(index.map(x => x.id)).size, index.length, 'published ids are unique');
for (const p of params) {
    assert.ok(Object.prototype.hasOwnProperty.call(p, 'current') && Object.prototype.hasOwnProperty.call(p, 'defaultValue'));
    assert.strictEqual(p.readOnly, true);
    assert.strictEqual(p.guidance, "Change in MZ's Plugin Manager");
    const block = new RegExp(`^ \\* @param ${p.param}\\r?\\n([\\s\\S]*?)(?=^ \\* @param |^ \\* @command )`, 'm').exec(header)[1];
    assert.strictEqual(p.label, /@text ([^\r\n]+)/.exec(block)[1], `${p.param} text follows the header`);
    assert.strictEqual(p.defaultValue, /@default ([^\r\n]*)/.exec(block)[1], `${p.param} default follows the header`);
    assert.strictEqual(p.description, /@desc ([^\r\n]+)/.exec(block)[1], `${p.param} description follows the header`);
}
assert.strictEqual(params.find(x => x.param === 'editKey').current, 'F9', 'configured value is shown');

// Navigation resolves the live control at the moment it is chosen, unfolds its details and cleans up the flash.
const classes = new Set();
const details = { tagName: 'DETAILS', open: false, parentNode: null };
const live = { parentNode: details, focused: false, scrolled: false,
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    getBoundingClientRect() { return details.open ? { width: 120, height: 24 } : { width: 0, height: 0 }; },
    focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; } };
global.document = { getElementById: id => id === 'live-setting' ? live : null, querySelector: () => null };
let cleanup = null, delay = 0;
const nativeTimeout = global.setTimeout;
global.setTimeout = (fn, ms) => { cleanup = fn; delay = ms; return 1; };
assert.strictEqual(W.focusSettingControl('live-setting'), true);
assert.ok(details.open && live.focused && live.scrolled && classes.has('dd-setting-flash'));
assert.ok(delay >= 500 && delay <= 2000, 'highlight is brief');
cleanup();
assert.ok(!classes.has('dd-setting-flash'), 'highlight cleans up');
assert.doesNotThrow(() => W.focusSettingControl('missing-setting'));
global.setTimeout = nativeTimeout;

let settingsOptions = null;
W.showSettingsCard = options => { settingsOptions = options; };
W.openSetting(params[0]);
assert.deepStrictEqual(settingsOptions, { query: '', focusId: params[0].id }, 'plugin navigation clears an old query and reveals its row');

// Autosave lives in Map on a wide toolbar, but that whole section is moved into More when the toolbar folds.
let openedMenu = null;
const autosave = { parentNode: null, disabled: false, focused: false,
    getBoundingClientRect() { return openedMenu === (W._menusFolded ? 'more' : 'map') ? { width: 90, height: 24 } : { width: 0, height: 0 }; },
    focus() { this.focused = true; }, scrollIntoView() {} };
global.document = { getElementById: id => id === 'dd-autosave-btn' ? autosave : null, querySelector: () => null };
W.showMenu = id => { openedMenu = id; return true; };
for (const folded of [true, false]) {
    W._menusFolded = folded;
    openedMenu = null;
    autosave.focused = false;
    assert.strictEqual(W.openSetting({ kind: 'autosave', controlId: 'dd-autosave-btn' }), true);
    assert.strictEqual(openedMenu, folded ? 'more' : 'map', `Autosave opens the visible ${folded ? 'More' : 'Map'} menu`);
    assert.ok(autosave.focused, 'the visible Autosave button receives focus');
}
openedMenu = 'wrong';
assert.strictEqual(W.focusSettingControl('dd-autosave-btn'), false, 'a hidden control does not report successful focus');
autosave.disabled = true;
openedMenu = W._menusFolded ? 'more' : 'map';
assert.strictEqual(W.focusSettingControl('dd-autosave-btn'), false, 'a disabled control does not report successful focus');
global.document = undefined;

const source = [
    'src/11_shortcuts.js', 'src/37_workspace_menus.js', 'src/39_workspace_map_panel.js',
    'src/41_workspace_visual_postfx.js', 'src/44_workspace_shortcuts.js', 'src/44_workspace_settings.js'
].map(f => fs.readFileSync(require.resolve('../' + f), 'utf8')).join('\n');
assert.match(source, /id:\s*['"]settings['"][\s\S]*keys:\s*['"]Ctrl\+Comma['"]/, 'Ctrl+, is in the canonical shortcut table');
assert.match(source, /dd-settings-btn/, 'More menu exposes Settings');
assert.match(source, /Setting:\s*/, 'palette projects settings with the Setting: prefix');
assert.match(source, /dd-setting-flash/, 'result navigation has a brief visible highlight');
assert.match(source, /readOnly/, 'plugin parameters are rendered read-only');
assert.match(source, /renderMapPanelHtml/, 'the live panel and inert descriptor collection have a pure HTML boundary');

console.log('✓ pure matching, complete parameter coverage, integration and side-effect guards');
