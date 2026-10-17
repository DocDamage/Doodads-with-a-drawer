// Regression: when a workspace JSON file is unreadable, the fallback must be visible to the
// user (recovered from a backup, or reset because no backup exists), not just a console warning.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Corrupt JSON Notices ===");

const sandbox = path.join(__dirname, 'corrupt_json_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data', 'docs_doodads_cache', 'backups'), { recursive: true });
const startCwd = process.cwd();
process.chdir(sandbox);
process.on('exit', () => { process.chdir(startCwd); fs.rmSync(sandbox, { recursive: true, force: true }); });

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };
const realWarn = console.warn;
console.warn = () => {};

require('../Docs-Doodads.js');
const FS = DocsDoodads.FS;

fs.writeFileSync('data/DocsDoodadsLibrary.json', '{"version": 1, broken');
fs.writeFileSync('data/docs_doodads_cache/backups/DocsDoodadsLibrary.json.2026-01-01T00-00-00-000Z.bak', '{"version":1,"assets":{"a":{}}}');
fs.writeFileSync('data/DocsDoodadsLayouts.json', 'not json');

assert.deepStrictEqual(FS.readJson('data/DocsDoodadsLibrary.json'), { version: 1, assets: { a: {} } }, "recovers from the latest backup");
assert.strictEqual(FS.readJson('data/DocsDoodadsLayouts.json'), null, "no backup: falls back to defaults");

const notices = FS.takeRecoveryNotices();
assert.strictEqual(notices.length, 2);
assert.ok(/DocsDoodadsLibrary\.json/.test(notices[0]) && /backup/i.test(notices[0]), notices[0]);
assert.ok(/DocsDoodadsLayouts\.json/.test(notices[1]) && /no backup/i.test(notices[1]), notices[1]);
assert.deepStrictEqual(FS.takeRecoveryNotices(), [], "notices are shown once");

// Opening the workspace surfaces pending notices.
FS.readJson('data/DocsDoodadsLayouts.json');
const shown = [];
DocsDoodads.Workspace.showToast = (msg) => shown.push(msg);
DocsDoodads.Workspace.showRecoveryNotices();
assert.ok(shown.some(msg => /DocsDoodadsLayouts\.json/.test(msg)), "the workspace shows the notice");

console.warn = realWarn;
console.log("✓ Unreadable JSON files are recovered or reset visibly.");
