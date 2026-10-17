// Regression: a failed save must roll back only files it actually replaced. A file whose
// commit failed was never touched, so "restoring" it is wrong and fails on read-only files,
// producing a misleading "rollback failed" message after an otherwise safe failure.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Transaction Rollback Scope ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };
require('../Docs-Doodads.js');

const sandbox = path.join(__dirname, 'rollback_scope_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(sandbox, { recursive: true });
process.on('exit', () => fs.rmSync(sandbox, { recursive: true, force: true }));
const mapPath = path.join(sandbox, 'Map001.json');
const doodadPath = path.join(sandbox, 'DocsDoodads.json');
const reset = () => { fs.writeFileSync(mapPath, '{"v":"old map"}'); fs.writeFileSync(doodadPath, '{"v":"old doodads"}'); };

// Spy on restores onto real targets.
const restoredTargets = [];
const realCopy = fs.copyFileSync;
fs.copyFileSync = function(source, destination, ...rest) {
    if (String(source).endsWith('.rollback')) restoredTargets.push(path.basename(destination));
    return realCopy.call(this, source, destination, ...rest);
};

// 1. The first file fails to commit: nothing was replaced, so nothing is rolled back.
reset();
let result = DocsDoodads.FS.atomicWriteManyJson([
    { path: mapPath, data: { v: 'new map' } }, { path: doodadPath, data: { v: 'new doodads' } }
], { beforeCommit: (index) => { if (index === 0) throw new Error('EPERM: operation not permitted'); } });
assert.strictEqual(result.ok, false);
assert.deepStrictEqual(restoredTargets, [], "an uncommitted file must not be 'restored'");
assert.strictEqual(result.rolledBack, false, "nothing was committed, so nothing was rolled back");
assert.ok(!/rollback failed/.test(result.error), result.error);
assert.strictEqual(fs.readFileSync(mapPath, 'utf8'), '{"v":"old map"}');

// 2. The second file fails after the first committed: only the first is restored.
reset();
result = DocsDoodads.FS.atomicWriteManyJson([
    { path: mapPath, data: { v: 'new map' } }, { path: doodadPath, data: { v: 'new doodads' } }
], { beforeCommit: (index) => { if (index === 1) throw new Error('disk full'); } });
assert.strictEqual(result.ok, false);
assert.deepStrictEqual(restoredTargets, ['Map001.json'], "only the committed file is rolled back");
assert.strictEqual(result.rolledBack, true);
assert.strictEqual(fs.readFileSync(mapPath, 'utf8'), '{"v":"old map"}', "the committed file is restored");
assert.strictEqual(fs.readFileSync(doodadPath, 'utf8'), '{"v":"old doodads"}');
assert.deepStrictEqual(fs.readdirSync(sandbox).sort(), ['DocsDoodads.json', 'Map001.json'], "no transaction leftovers");

fs.copyFileSync = realCopy;
console.log("✓ Failed saves roll back only the files they replaced.");
