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

const before = JSON.stringify({ selected: W.selectedDoodad, dirty: W.dirty, undo: D.Undo && D.Undo.stack });
const index = W.refreshSettingsIndex();
assert.ok(Array.isArray(W.settingsIndex) && W.settingsIndex === index);
assert.ok(index.length > 30, 'map, world, editor and plugin settings are indexed');
assert.strictEqual(JSON.stringify({ selected: W.selectedDoodad, dirty: W.dirty, undo: D.Undo && D.Undo.stack }), before,
    'building/browsing the index has no editor side effects');
assert.ok(D.SettingsSearch.search(index, 'shadow').some(x => /sun/i.test(x.label + ' ' + x.words)), 'shadow finds sun controls');
assert.ok(D.SettingsSearch.search(index, 'shadow').some(x => /character/i.test(x.label + ' ' + x.words)), 'shadow finds character shadows');

const header = fs.readFileSync(require.resolve('../src/00_header_and_plugin_parameters.js'), 'utf8');
const headerParams = Array.from(header.matchAll(/^ \* @param ([^\r\n]+)/gm), m => m[1]);
assert.strictEqual(headerParams.length, 16, 'fixture sees every header parameter');
const params = index.filter(x => x.kind === 'plugin-parameter');
assert.deepStrictEqual(params.map(x => x.param).sort(), headerParams.sort(), 'all and only header parameters are represented');
assert.strictEqual(new Set(index.map(x => x.id)).size, index.length, 'published ids are unique');
for (const p of params) {
    assert.ok(Object.prototype.hasOwnProperty.call(p, 'current') && Object.prototype.hasOwnProperty.call(p, 'defaultValue'));
    assert.strictEqual(p.readOnly, true);
    assert.strictEqual(p.guidance, "Change in MZ's Plugin Manager");
}
assert.strictEqual(params.find(x => x.param === 'editKey').current, 'F9', 'configured value is shown');

const source = [
    'src/11_shortcuts.js', 'src/37_workspace_menus.js', 'src/39_workspace_map_panel.js',
    'src/41_workspace_visual_postfx.js', 'src/44_workspace_shortcuts.js', 'src/44_workspace_settings.js'
].map(f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '').join('\n');
assert.match(source, /id:\s*['"]settings['"][\s\S]*keys:\s*['"]Ctrl\+Comma['"]/, 'Ctrl+, is in the canonical shortcut table');
assert.match(source, /dd-settings-btn/, 'More menu exposes Settings');
assert.match(source, /Setting:\s*/, 'palette projects settings with the Setting: prefix');
assert.match(source, /dd-setting-flash/, 'result navigation has a brief visible highlight');
assert.match(source, /readOnly/, 'plugin parameters are rendered read-only');

console.log('✓ pure matching, complete parameter coverage, integration and side-effect guards');
