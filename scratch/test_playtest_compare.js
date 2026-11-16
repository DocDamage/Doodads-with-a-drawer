'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { compare } = require('../scripts/playtest_compare');
const { parseCases, parseArgs, prepare, runningRuntime, run, writeReport, safeRemoveTemp, terminateSpawned } = require('../scripts/playtest');
const picture = (w, h) => ({ width: w, height: h, rgba: new Uint8Array(w * h * 4).fill(255) });
const a = picture(12, 10), b = picture(12, 10);
assert.strictEqual(compare(a, b).pass, true);
for (let y = 3; y < 5; y++) for (let x = 2; x < 6; x++) b.rgba[(y * 12 + x) * 4] = 0;
const diff = compare(a, b, { tolerance: 8, fraction: 0 });
assert.strictEqual(diff.pass, false);
assert.strictEqual(diff.changed, 8);
assert.deepStrictEqual(diff.bounds, { x: 2, y: 3, width: 4, height: 2 });
assert.strictEqual(compare(a, picture(11, 10)).reason, 'size');
assert.strictEqual(compare(a, { width: 12, height: 10, rgba: new Uint8Array(1) }).reason, 'pixels');
const slight = picture(12, 10); slight.rgba[0] = 250;
assert.strictEqual(compare(a, slight).pass, true);
const defaults = parseCases(require('./playtest_cases.json'));
assert.ok(defaults.some(c => c.waterProbe));
for (const mapId of [3, 4, 5]) for (const mode of ['flat', '3d']) assert.ok(defaults.some(c => c.mapId === mapId && c.mode === mode));
assert.throws(() => parseCases([{ name: '../escape', mapId: 3 }]), /name/);
assert.throws(() => parseCases([{ name: 'case', mapId: 0 }]), /map/);
assert.throws(() => parseCases([{ name: 'case', mapId: 3, frames: Infinity }]), /frames/);
assert.throws(() => parseCases([{ name: 'same', mapId: 3 }, { name: 'same', mapId: 4 }]), /Duplicate/);
assert.strictEqual(parseArgs(['--update', '--timeout', '40']).timeout, 40);
assert.strictEqual(parseArgs(['--keep-copy']).keepCopy, true);
assert.throws(() => parseArgs(['--timeout', 'oops']), /timeout/);
assert.throws(() => parseArgs(['--unknown']), /Unknown/);
assert.strictEqual(runningRuntime('win32', () => '"nw.exe","4321"'), true);
assert.strictEqual(runningRuntime('win32', () => 'INFO: No tasks are running'), false);
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-playtest-unit-'));
const source = path.join(fixtureRoot, 'fixture-project');
fs.mkdirSync(path.join(source, 'data'), { recursive: true });
fs.mkdirSync(path.join(source, 'js/plugins'), { recursive: true });
fs.writeFileSync(path.join(source, 'index.html'), 'fixture');
fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ name: 'original', main: 'index.html' }));
fs.writeFileSync(path.join(source, 'data/System.json'), '{}');
fs.writeFileSync(path.join(source, 'data/Map003.json'), '{"width":10,"height":10}');
const plugins = 'var $plugins = [{"name":"Docs-Doodads","status":true,"parameters":{"editorMode":"true"}}];';
fs.writeFileSync(path.join(source, 'js/plugins.js'), plugins);
fs.mkdirSync(path.join(source, 'playtest-output'));
fs.writeFileSync(path.join(source, 'playtest-output/result.json'), '{"stale":true}');
const before = fs.readFileSync(path.join(source, 'js/plugins.js'), 'utf8');
const prepared = prepare({ project: source, cases: [{ name: 'town', mapId: 3, mode: 'flat', frames: 2 }] });
assert.notStrictEqual(prepared.copy, source);
assert.ok(fs.existsSync(path.join(prepared.copy, 'js/plugins/DocsPlaytestDriver.js')));
const copyPlugins = fs.readFileSync(path.join(prepared.copy, 'js/plugins.js'), 'utf8');
assert.ok(copyPlugins.includes('DocsPlaytestDriver'));
assert.ok(copyPlugins.indexOf('DocsPlaytestPreload') < copyPlugins.indexOf('Docs-Doodads'), 'the error logger loads before the plugin');
assert.ok(copyPlugins.includes('"editorMode": "false"'));
assert.strictEqual(fs.existsSync(path.join(prepared.copy, 'playtest-output/result.json')), false, 'stale source output is excluded');
assert.strictEqual(fs.readFileSync(path.join(source, 'js/plugins.js'), 'utf8'), before);
assert.strictEqual(fs.readFileSync(path.join(source, 'package.json'), 'utf8'), '{"name":"original","main":"index.html"}');
assert.throws(() => prepare({ project: source, cases: [{ name: 'missing', mapId: 4 }] }), /Map004/);
const beforeTemps = new Set(fs.readdirSync(os.tmpdir()).filter(n => n.startsWith('docs-playtest-')));
fs.writeFileSync(path.join(source, 'js/plugins.js'), 'not a plugin list');
assert.throws(() => prepare({ project: source, cases: [{ name: 'town', mapId: 3 }] }), /plugin list/);
assert.deepStrictEqual(new Set(fs.readdirSync(os.tmpdir()).filter(n => n.startsWith('docs-playtest-'))), beforeTemps, 'prepare failures clean their temp copy');
fs.writeFileSync(path.join(source, 'js/plugins.js'), plugins);
const { capture, freezeEngine, nextReadinessWait } = require('./playtest_driver');
let extracted, destroyed = false;
const rt = { width: 12, height: 10, destroy() { destroyed = true; } };
const spriteset = { name: 'spriteset' };
const rgba = new Uint8Array(12 * 10 * 4);
const frame = capture({ Graphics: { width: 12, height: 10, app: { renderer: {
    render(s, t) { assert.strictEqual(s, spriteset); assert.strictEqual(t, rt); },
    extract: { pixels(t) { extracted = t; return rgba; } }
} } }, PIXI: { RenderTexture: { create() { return rt; } } }, SceneManager: { _scene: { _spriteset: spriteset } } });
assert.strictEqual(extracted, rt, 'extract the screen-sized texture, never the giant spriteset');
assert.strictEqual(frame.rgba.length, 480);
assert.strictEqual(destroyed, true);
{
    let parallel = 0, common = 0;
    const env = { Input: {}, TouchInput: {}, Game_Map: function() {}, Game_Event: function() {}, Game_CommonEvent: function() {} };
    env.Game_Map.prototype = {}; env.Game_Event.prototype = {
        updateSelfMovement() {}, updateParallel() { parallel++; }
    }; env.Game_CommonEvent.prototype = { update() { common++; } };
    freezeEngine(env);
    env.Game_Event.prototype.updateParallel(); env.Game_CommonEvent.prototype.update();
    assert.deepStrictEqual({ parallel, common }, { parallel: 0, common: 0 }, 'parallel events cannot mutate a capture case');
    assert.strictEqual(nextReadinessWait(3599, true), 0, 'fixed capture frames do not consume the readiness budget');
}
{
    const listeners = {};
    const fakeConsole = { error() {} };
    const env = { console: fakeConsole, addEventListener(name, fn) { listeners[name] = fn; } };
    require('./playtest_preload').install(env);
    fakeConsole.error('early plugin failure');
    assert.ok(env.__docsPlaytestErrors.some(s => s.includes('early plugin failure')));
    listeners.error({ message: 'load error' });
    assert.ok(env.__docsPlaytestErrors.some(s => s.includes('load error')));
}
// A complete subprocess round trip, with a stand-in child instead of launching MZ.
(async () => {
    const { EventEmitter } = require('events');
    const { encodePng } = require('../scripts/png');
    const zlib = require('zlib');
    const runtime = path.join(fixtureRoot, 'fake-runtime'); fs.mkdirSync(runtime);
    fs.writeFileSync(path.join(runtime, process.platform === 'win32' ? 'nw.exe' : 'nw'), '');
    const baseline = path.join(fixtureRoot, 'references');
    let change = false;
    let spawnedCopy = '';
    const spawn = (executable, args, options) => {
        assert.ok(executable.startsWith(runtime));
        assert.notStrictEqual(args[0], source);
        assert.strictEqual(options.cwd, args[0]);
        spawnedCopy = args[0];
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.kill = () => {};
        const output = path.join(args[0], 'playtest-output'); fs.mkdirSync(output);
        const rgba = Buffer.alloc(16, change ? 0 : 255);
        fs.writeFileSync(path.join(output, 'town.rgba'), rgba);
        fs.writeFileSync(path.join(output, 'town.png'), encodePng(2, 2, rgba, zlib.deflateSync));
        fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ cases: [{ name: 'town', width: 2, height: 2, fps: 60 }], errors: [] }));
        setImmediate(() => child.emit('close', 0));
        return child;
    };
    const reportDir = path.join(fixtureRoot, 'report');
    const options = { project: source, cases: [{ name: 'town', mapId: 3 }], runtime, baseline, out: reportDir, update: true };
    const dependencies = { spawn, runningRuntime: () => false };
    const updated = await run(options, dependencies);
    assert.strictEqual(updated.pass, true);
    assert.strictEqual(updated.projectCopy, null);
    assert.strictEqual(fs.existsSync(spawnedCopy), false, 'successful runs clean their temp copy');
    const manifests = () => fs.readdirSync(baseline).filter(n => /^manifest-.*\.json$/.test(n)).sort();
    assert.strictEqual(manifests().length, 1, 'a complete update publishes one immutable manifest');
    const firstManifest = manifests().at(-1);
    const good = await run(Object.assign({}, options, { update: false }), dependencies);
    assert.strictEqual(good.pass, true);
    change = true;
    const bad = await run(Object.assign({}, options, { update: false }), dependencies);
    assert.strictEqual(bad.pass, false);
    assert.ok(fs.existsSync(path.join(bad.out, 'town-difference.png')));
    assert.ok(fs.readFileSync(path.join(bad.out, 'report.html'), 'utf8').includes('town-reference.png'));
    change = false;
    const cleanAgain = await run(Object.assign({}, options, { update: false }), dependencies);
    assert.strictEqual(cleanAgain.pass, true);
    assert.strictEqual(fs.existsSync(path.join(cleanAgain.out, 'town-difference.png')), false, 'a reused report folder drops an old difference');
    await assert.rejects(() => run(options, { runningRuntime: () => true }), /Close the open/);
    assert.throws(() => writeReport(prepared, { cases: [], errors: [] }, { out: path.join(source, 'report') }), /outside/);
    assert.throws(() => writeReport(prepared, { cases: [], errors: [] }, { out: baseline, baseline }), /separate/);
    const missing = writeReport(prepared, { cases: [], errors: [] }, { out: path.join(fixtureRoot, 'missing-report'), baseline, update: true });
    assert.strictEqual(missing.pass, false, 'a missing case cannot pass an update');
    assert.deepStrictEqual(manifests(), [firstManifest], 'an incomplete update never switches the active reference manifest');
    const incompleteDir = path.join(fixtureRoot, 'incomplete-report');
    const incomplete = writeReport(prepared, { cases: [{ name: 'town', width: 2, height: 2 }], errors: [] }, { out: incompleteDir, baseline });
    assert.strictEqual(incomplete.pass, false);
    assert.ok(fs.existsSync(path.join(incompleteDir, 'report.json')), 'an incomplete capture still produces a report');
    const changedCase = await run(Object.assign({}, options, { cases: [{ name: 'town', mapId: 3, minutes: 1 }], update: false }), dependencies);
    assert.strictEqual(changedCase.pass, false);
    assert.match(changedCase.checks[0].reason, /case.*changed/i);

    let timeoutClosed = false, timeoutKilled = false;
    const timeoutSpawn = (_executable, args) => {
        const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        child.kill = () => { timeoutKilled = true; setTimeout(() => { timeoutClosed = true; child.emit('close', 143); }, 20); };
        spawnedCopy = args[0];
        return child;
    };
    const timed = await run(Object.assign({}, options, { update: false, timeout: 0.001, out: path.join(fixtureRoot, 'timeout-report') }),
        { spawn: timeoutSpawn, runningRuntime: () => false, terminateGraceMs: 100 });
    assert.strictEqual(timeoutKilled, true);
    assert.strictEqual(timeoutClosed, true, 'timeout waits for the spawned process to close');
    assert.strictEqual(timed.pass, false);
    assert.strictEqual(fs.existsSync(spawnedCopy), false);

    let windowsForceCalls = 0;
    const stubbornTree = new EventEmitter(); stubbornTree.pid = 98765;
    stubbornTree.kill = signal => { if (signal === 'SIGKILL') setImmediate(() => stubbornTree.emit('close', 137)); };
    assert.strictEqual(await terminateSpawned(stubbornTree, { platform: 'win32', terminateGraceMs: 2,
        forceKill() { windowsForceCalls++; } }), true, 'the Windows fallback confirms the child closed');
    assert.ok(windowsForceCalls >= 2, 'the exact spawned Windows tree is retried after the first grace period');

    const neverSpawn = (_executable, args) => {
        const child = new EventEmitter(); child.pid = 24680; child.stdout = new EventEmitter(); child.stderr = new EventEmitter();
        child.kill = () => {}; spawnedCopy = args[0]; return child;
    };
    const unconfirmed = await run(Object.assign({}, options, { update: false, timeout: 0.001, out: path.join(fixtureRoot, 'unconfirmed-report') }),
        { spawn: neverSpawn, runningRuntime: () => false, terminateGraceMs: 2, platform: 'win32', forceKill() {} });
    assert.strictEqual(unconfirmed.pass, false);
    assert.match(unconfirmed.error, /PID 24680.*not confirm/i);
    assert.ok(unconfirmed.projectCopy && fs.existsSync(unconfirmed.projectCopy), 'an unconfirmed process keeps the copy it may still write');
    safeRemoveTemp(unconfirmed.projectCopy);

    const inside = path.join(source, 'inside-output'); fs.mkdirSync(inside);
    const alias = path.join(fixtureRoot, 'inside-alias');
    try {
        fs.symlinkSync(inside, alias, process.platform === 'win32' ? 'junction' : 'dir');
        assert.throws(() => writeReport(prepared, { cases: [], errors: [] }, { out: alias, baseline }), /outside/,
            'a junction cannot make an in-project report folder look external');
    } catch (error) {
        if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    }

    const kept = await run(Object.assign({}, options, { keepCopy: true, update: false, out: path.join(fixtureRoot, 'kept-report') }), dependencies);
    assert.ok(kept.projectCopy && fs.existsSync(kept.projectCopy));
    safeRemoveTemp(kept.projectCopy);
    safeRemoveTemp(prepared.copy);
    assert.strictEqual(path.dirname(fs.realpathSync(fixtureRoot)), fs.realpathSync(os.tmpdir()), 'fixture cleanup remains inside the temp root');
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
    console.log('Self-running playtest helpers: all tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
