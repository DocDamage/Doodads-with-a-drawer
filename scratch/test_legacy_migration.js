// scratch/test_legacy_migration.js
// Doc's Doodads began as QJ-Doodads. Projects saved by QJ-Doodads builds must keep working:
// legacy plugin parameters, data files, backups, and recovery snapshots are read and migrated.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing QJ-Doodads Legacy Migration ===");

const sandbox = path.join(__dirname, 'legacy_migration_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data', 'qj_asset_cache', 'backups'), { recursive: true });
const write = (rel, data) => fs.writeFileSync(path.join(sandbox, rel), typeof data === 'string' ? data : JSON.stringify(data));
write('data/QJAssetLibrary.json', { version: 1, projectId: 'old', generatedAt: 1, assets: {
    'img/pictures/tree.png': { id: 'img/pictures/tree.png', path: 'img/pictures/tree.png', fileName: 'tree.png', favorite: true, tags: ['forest'] }
}, collections: {}, settings: {} });
write('data/QJEventTemplates.json', { myShop: { name: 'My Shop', list: [] } });
write('data/QJWorkspaceLayouts.json', { Wide: { drawerWidth: 500 } });
write('data/QJAssetWorkspaceRecovery.json', { timestamp: 1 });
write('data/qj_asset_cache/backups/Map001.json.2026-01-01T00-00-00-000Z.bak', '{}');
write('data/DoodadsQJ.json', { 1: [{ bit: [3, 'img/pictures/tree.png'], x: 10, y: 20 }] });

const startCwd = process.cwd();
process.chdir(sandbox);
process.on('exit', () => { process.chdir(startCwd); fs.rmSync(sandbox, { recursive: true, force: true }); });

const listeners = {};
global.window = global;
global.window.addEventListener = (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); };
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
// The project still lists the plugin under its old name; the new name has no entry yet.
global.PluginManager = { parameters: (name) => name === 'QJ-Doodads' ? { editKey: 'F9', editorMode: 'true' } : {} };

// Minimal XHR that serves files from the sandbox, 404 when missing.
const requested = [];
global.XMLHttpRequest = function() {};
XMLHttpRequest.prototype.open = function(method, url) { this.url = url; };
XMLHttpRequest.prototype.overrideMimeType = function() {};
XMLHttpRequest.prototype.send = function() {
    requested.push(this.url);
    const file = path.join(sandbox, this.url);
    if (fs.existsSync(file)) { this.status = 200; this.responseText = fs.readFileSync(file, 'utf8'); }
    else { this.status = 404; this.responseText = ''; }
    this.onload();
};
global.DataManager = { loadDatabase() {} };
function Scene_Map() {}
Scene_Map.prototype.initialize = function() {};
global.Scene_Map = Scene_Map;
global.SceneManager = { _scene: new Scene_Map() };

require('../Docs-Doodads.js');

// Legacy plugin parameters are honoured (edit key F9 from the old QJ-Doodads entry).
let toggles = 0;
DocsDoodads.Workspace.toggle = () => { toggles++; };
for (const fn of listeners.keydown) fn({ code: 'F9', key: 'F9', target: null, preventDefault() {} });
assert.strictEqual(toggles, 1, "settings saved under the QJ-Doodads plugin name still apply");

// Legacy library, templates, and layouts load when the new files do not exist yet.
DocsDoodads.AssetIndex.init();
assert.strictEqual(DocsDoodads.AssetIndex.data.assets['img/pictures/tree.png'].favorite, true, "QJAssetLibrary.json favorites carry over");
assert.deepStrictEqual(DocsDoodads.AssetIndex.data.assets['img/pictures/tree.png'].tags, ['forest']);
DocsDoodads.EventTemplates.init();
assert.ok(DocsDoodads.EventTemplates.templates.myShop, "QJEventTemplates.json custom templates carry over");
DocsDoodads.Layout.init();
assert.deepStrictEqual(DocsDoodads.Layout.custom.Wide, { drawerWidth: 500 }, "QJWorkspaceLayouts.json layouts carry over");
assert.deepStrictEqual(DocsDoodads.FS.readJson('data/DocsDoodadsRecovery.json'), { timestamp: 1 }, "QJ recovery snapshots are offered");

// Saving writes the new name; the new file then wins over the legacy one.
DocsDoodads.AssetIndex.save();
assert.ok(fs.existsSync('data/DocsDoodadsLibrary.json'), "library saves under the new name");
DocsDoodads.AssetIndex.data.assets['img/pictures/tree.png'].favorite = false;
DocsDoodads.AssetIndex.save();
DocsDoodads.AssetIndex.init();
assert.strictEqual(DocsDoodads.AssetIndex.data.assets['img/pictures/tree.png'].favorite, false, "new file takes precedence once written");

// Doodad placements fall back to DoodadsQJ.json, in playtest and deployed games alike.
DataManager.loadDatabase();
assert.deepStrictEqual(requested.slice(0, 2), ['data/DocsDoodads.json', 'data/DoodadsQJ.json']);
assert.strictEqual(window.$dataDocsDoodads[1][0].x, 10, "DoodadsQJ.json placements load");

// Backups made by QJ builds stay restorable from Diagnostics.
const backups = DocsDoodads.FS.listBackups('data/Map001.json');
assert.strictEqual(backups.length, 1, "legacy backups are listed for restore");

// Clearing recovery removes both the new and the legacy snapshot.
DocsDoodads.FS.atomicWriteJson('data/DocsDoodadsRecovery.json', { timestamp: 2 });
DocsDoodads.Persistence.clearRecovery();
assert.ok(!fs.existsSync('data/DocsDoodadsRecovery.json') && !fs.existsSync('data/QJAssetWorkspaceRecovery.json'),
    "a finished session must not resurrect an old QJ recovery prompt");

console.log("✓ QJ-Doodads parameters, data files, backups, and recovery migrate to Doc's Doodads.");
