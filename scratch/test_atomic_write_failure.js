// Regression: a failed single-file atomic write (e.g. read-only target) must not throw or
// leave a stray .tmp file behind; it reports failure and leaves the original untouched.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing Atomic Write Failure Cleanup ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };
require('../Docs-Doodads.js');

const sandbox = path.join(__dirname, 'atomic_write_failure_fixture');
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(sandbox, { recursive: true });
process.on('exit', () => fs.rmSync(sandbox, { recursive: true, force: true }));
const realError = console.error;
console.error = () => {};

// A directory where the file should go makes the final rename fail on every platform.
const target = path.join(sandbox, 'DocsDoodadsLibrary.json');
fs.mkdirSync(target);
let ok;
assert.doesNotThrow(() => { ok = DocsDoodads.FS.atomicWriteJson(target, { version: 1 }); });
assert.strictEqual(ok, false, "the failure is reported");
assert.deepStrictEqual(fs.readdirSync(sandbox), ['DocsDoodadsLibrary.json'], "no stray .tmp file is left behind");

// Normal writes still work.
const good = path.join(sandbox, 'ok.json');
assert.strictEqual(DocsDoodads.FS.atomicWriteJson(good, { a: 1 }), true);
assert.deepStrictEqual(JSON.parse(fs.readFileSync(good, 'utf8')), { a: 1 });

console.error = realError;
console.log("✓ Failed atomic writes clean up and report failure.");
