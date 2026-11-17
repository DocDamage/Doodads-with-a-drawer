'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld({ width: 20, height: 20 });
const commands = {};
PluginManager.registerCommand = (plugin, name, run) => { commands[name] = run; };
global.Window_MapName = class {
    constructor() { this.contents = { clear() {} }; this.innerWidth = 360; }
    refresh() { this.normalRefresh = true; }
    open() { this.refresh(); this._showCount = 150; }
    lineHeight() { return 36; }
    drawBackground() {}
    convertEscapeCharacters(s) { return s.replace(/\\V\[1\]/g, 'Translated'); }
    drawTextEx(s) { this.drawn = this.convertEscapeCharacters(s); }
    textSizeEx(s) { return { width: s.length * 8 }; }
};
require('../Docs-Doodads.js');
const D = DocsDoodads, A = D.Areas;
assert.ok(A, 'area names exist');
const settings = { areas: [{ region: 3, name: 'Old Quarter', once: false }, { region: 4, name: '\\V[1]', once: true }] };
assert.strictEqual(A.at(settings, 2), null);
assert.strictEqual(A.at(settings, 3).name, 'Old Quarter');
const state = { settings, seen: {} };
assert.strictEqual(A.changed(state, 3, 0), null);
assert.strictEqual(A.changed(state, 4, 6), null);
assert.strictEqual(A.changed(state, 3, 10), null);
assert.strictEqual(A.changed(state, 3, 22).name, 'Old Quarter');
assert.strictEqual(A.changed(state, 3, 40), null);
A.changed(state, 4, 50);
assert.strictEqual(A.changed(state, 4, 62).once, true);
const seen = JSON.parse(JSON.stringify(state.seen));
const loaded = { settings, seen };
A.changed(loaded, 4, 0);
assert.strictEqual(A.changed(loaded, 4, 12), null, 'once survives save/load');
assert.strictEqual(A.changed({ settings: {} }, 1, 0), null);
let region = 3;
$gameMap.regionId = () => region;
D.Lighting.setMapSettings(1, settings);
assert.strictEqual(D.api.area(), 'Old Quarter');
const window = new Window_MapName();
SceneManager._scene = { _mapNameWindow: window };
let entered;
D.api.on('areaEnter', detail => { entered = detail; });
const ss = new Spriteset_Map();
ss.updateDocsAreas();
for (let i = 0; i < 14; i++) { Graphics.frameCount++; ss.updateDocsAreas(); }
assert.strictEqual(window.drawn, 'Old Quarter');
window.normalRefresh = false;
window.refresh();
assert.strictEqual(window.normalRefresh, true, 'a later native refresh shows the map name');
assert.strictEqual(entered.region, 3);
region = 4;
for (let i = 0; i < 16; i++) { Graphics.frameCount++; ss.updateDocsAreas(); }
assert.strictEqual(window.drawn, 'Translated', 'MZ text codes pass through its text renderer');
assert.ok($gameSystem._docsAreasSeen[1][4]);
const oldSettings = $dataDocsDoodads.mapSettings[1];
$dataDocsDoodads.mapSettings[1] = {};
ss.updateDocsAreas();
assert.strictEqual(ss._docsAreaState, null, 'an unnamed map clears entry state');
$dataDocsDoodads.mapSettings[1] = oldSettings;
commands.storeAreaName({ variableId: 2 });
assert.strictEqual($gameVariables.value(2), '\\V[1]');
D.Workspace.refreshInspector = D.Workspace.updateUndoButtons = () => {};
D.Workspace.setAreaName(3, 'Market', true);
assert.strictEqual(A.at(D.Lighting.mapSettings(1), 3).name, 'Market');
D.Undo.undo();
assert.strictEqual(A.at(D.Lighting.mapSettings(1), 3).name, 'Old Quarter');
assert.ok(D.Regions.uses({}, settings)[3].includes('area: Old Quarter'));
console.log('Area names: all tests passed.');
