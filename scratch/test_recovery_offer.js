// Regression: the crash-recovery prompt is only for snapshots left by an earlier Playtest run.
// Reopening the workspace in the same run must not offer this run's own autosave.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Recovery Offer ===");

const sandbox = path.join(__dirname, 'recovery_offer_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'data'), { recursive: true });
const startCwd = process.cwd();
process.chdir(sandbox);
process.on('exit', () => { process.chdir(startCwd); fs.rmSync(sandbox, { recursive: true, force: true }); });

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');
const persistence = DocsDoodads.Persistence;
const write = (timestamp) => fs.writeFileSync('data/DocsDoodadsRecovery.json', JSON.stringify({ timestamp, doodads: [] }));

write(persistence.bootedAt - 60000);
assert.ok(persistence.recoverableSnapshot(), "a snapshot from before this Playtest run (a crash) is offered");

write(Date.now() + 1);
assert.strictEqual(persistence.recoverableSnapshot(), null, "this run's own autosave is not offered");

write(persistence.bootedAt - 2 * 86400000);
assert.strictEqual(persistence.recoverableSnapshot(), null, "snapshots older than a day are not offered");

fs.unlinkSync('data/DocsDoodadsRecovery.json');
assert.strictEqual(persistence.recoverableSnapshot(), null);

console.log("✓ Recovery is offered only for snapshots from an earlier Playtest run.");
