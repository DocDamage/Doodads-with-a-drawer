'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const { build } = require('./build');
const { encodePng } = require('./png');
const { compare } = require('./playtest_compare');
const zlib = require('zlib');
const root = path.resolve(__dirname, '..');
const DEFAULT_RUNTIMES = [
    'C:/Program Files (x86)/Steam/steamapps/common/RPG Maker MZ/nwjs-win',
    'C:/Program Files/KADOKAWA/RPGMZ/nwjs-win'
];
function number(value, min, max, name) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) throw new Error('Invalid ' + name + '.');
    return n;
}
function parseCases(input) {
    if (!Array.isArray(input) || !input.length || input.length > 64) throw new Error('Cases must be a list of 1–64 cases.');
    const names = new Set();
    return input.map(c => {
        if (!c || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(c.name)) throw new Error('Invalid case name.');
        if (names.has(c.name)) throw new Error('Duplicate case name: ' + c.name);
        names.add(c.name);
        const mapId = number(c.mapId, 1, 999, 'map');
        if (!Number.isInteger(mapId)) throw new Error('Invalid map.');
        const mode = c.mode || 'flat';
        if (!['flat', '3d'].includes(mode)) throw new Error('Invalid case mode.');
        const weather = c.weather || 'none';
        if (!['none', 'rain', 'storm', 'snow'].includes(weather)) throw new Error('Invalid weather.');
        const out = { name: c.name, mapId, mode, weather, power: number(c.power === undefined ? 5 : c.power, 0, 9, 'weather power'),
            minutes: number(c.minutes === undefined ? 720 : c.minutes, 0, 1439, 'minutes'),
            frames: number(c.frames === undefined ? 120 : c.frames, 1, 3600, 'frames'), waterProbe: Boolean(c.waterProbe) };
        if (!Number.isInteger(out.frames)) throw new Error('Invalid frames.');
        for (const key of ['x', 'y']) if (c[key] !== undefined) out[key] = number(c[key], 0, 255, key);
        return out;
    });
}
function parseArgs(argv) {
    const options = { project: path.join(root, 'rpgmaker project'), timeout: 300, update: false, keepCopy: false, tolerance: 8, fraction: 0.001 };
    const values = { '--project': 'project', '--runtime': 'runtime', '--cases': 'casesFile', '--baseline': 'baseline', '--out': 'out', '--timeout': 'timeout', '--tolerance': 'tolerance', '--fraction': 'fraction' };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--update') options.update = true;
        else if (arg === '--keep-copy') options.keepCopy = true;
        else if (arg === '--help') options.help = true;
        else if (values[arg]) {
            if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error('Missing value for ' + arg);
            options[values[arg]] = argv[++i];
        } else throw new Error('Unknown argument: ' + arg);
    }
    options.timeout = number(options.timeout, 1, 3600, 'timeout');
    options.tolerance = number(options.tolerance, 0, 255, 'tolerance');
    options.fraction = number(options.fraction, 0, 1, 'fraction');
    return options;
}
function runningRuntime(platform = process.platform, exec = cp.execFileSync) {
    const output = platform === 'win32'
        ? exec('tasklist', ['/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true })
        : exec('ps', ['-A', '-o', 'comm='], { encoding: 'utf8' });
    return platform === 'win32' ? /^"(?:nw|game)\.exe",/im.test(output) : /^(?:nw|nw\.exe|game\.exe)$/im.test(output);
}
function samePath(a, b) {
    const normalize = value => {
        const resolved = path.resolve(value).replace(/[\\/]+$/, '');
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    };
    return normalize(a) === normalize(b);
}
function containsPath(parent, child) {
    const rel = path.relative(path.resolve(parent), path.resolve(child));
    return !rel || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep));
}
function safeRemoveTemp(target) {
    const temp = fs.realpathSync(os.tmpdir());
    const resolved = path.resolve(target || '');
    if (!/^docs-playtest-[a-zA-Z0-9_-]+$/.test(path.basename(resolved)) || !samePath(path.dirname(resolved), temp)) {
        throw new Error('Refusing to remove a folder outside the playtest temp root: ' + resolved);
    }
    if (!fs.existsSync(resolved)) return false;
    const stat = fs.lstatSync(resolved);
    if (!stat.isDirectory() || stat.isSymbolicLink() || !samePath(path.dirname(fs.realpathSync(resolved)), temp)) {
        throw new Error('Refusing to remove an unexpected playtest temp folder: ' + resolved);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
    return true;
}
function copyProject(from, to) {
    fs.mkdirSync(to, { recursive: true });
    const skip = new Set(['.git', '.claude', 'save', 'node_modules', 'coverage', 'docs_doodads_cache', 'playtest-output']);
    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        if (entry.isSymbolicLink()) throw new Error('The test project contains a symbolic link: ' + entry.name);
        const a = path.join(from, entry.name), b = path.join(to, entry.name);
        if (entry.isDirectory()) copyProject(a, b);
        else if (entry.isFile()) fs.copyFileSync(a, b);
    }
}
function prepare(options) {
    const project = fs.realpathSync(options.project);
    for (const file of ['index.html', 'data/System.json', 'js/plugins.js']) if (!fs.existsSync(path.join(project, file))) throw new Error('Not an MZ project: missing ' + file);
    const cases = parseCases(options.cases || JSON.parse(fs.readFileSync(options.casesFile || path.join(root, 'scratch/playtest_cases.json'), 'utf8')));
    for (const c of cases) {
        const map = 'Map' + String(c.mapId).padStart(3, '0') + '.json';
        if (!fs.existsSync(path.join(project, 'data', map))) throw new Error('The case ' + c.name + ' needs data/' + map + '.');
    }
    const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-playtest-'));
    try {
        copyProject(project, copy);
        const pluginDir = path.join(copy, 'js/plugins'); fs.mkdirSync(pluginDir, { recursive: true });
        fs.writeFileSync(path.join(pluginDir, 'Docs-Doodads.js'), build().text);
        const text = fs.readFileSync(path.join(copy, 'js/plugins.js'), 'utf8');
        const match = /\b(?:var|let|const)\s+\$plugins\s*=\s*([\s\S]+?)\s*$/.exec(text);
        if (!match) throw new Error('Cannot read the MZ plugin list.');
        let plugins = JSON.parse(match[1].replace(/;\s*$/, ''));
        if (!Array.isArray(plugins) || plugins.some(p => !p || typeof p.name !== 'string')) throw new Error('Invalid MZ plugin list.');
        plugins = plugins.filter(p => p.name !== 'DocsPlaytestPreload' && p.name !== 'DocsPlaytestDriver');
        let ours = plugins.find(p => p.name === 'Docs-Doodads');
        if (!ours) { ours = { name: 'Docs-Doodads', status: true, parameters: {} }; plugins.push(ours); }
        ours.status = true; ours.parameters = Object.assign({}, ours.parameters, { editorMode: 'false' });
        for (const p of plugins) if (p.name === 'QJ-Doodads') p.status = false;
        plugins.unshift({ name: 'DocsPlaytestPreload', status: true, description: 'Captures startup errors in the copied test project', parameters: {} });
        plugins.push({ name: 'DocsPlaytestDriver', status: true, description: 'Runs the copied test project', parameters: {} });
        fs.writeFileSync(path.join(copy, 'js/plugins.js'), 'var $plugins =\n' + JSON.stringify(plugins, null, 4) + ';\n');
        fs.copyFileSync(path.join(root, 'scratch/playtest_preload.js'), path.join(pluginDir, 'DocsPlaytestPreload.js'));
        fs.copyFileSync(path.join(root, 'scratch/playtest_driver.js'), path.join(pluginDir, 'DocsPlaytestDriver.js'));
        const support = path.join(pluginDir, 'DocsPlaytestSupport'); fs.mkdirSync(support, { recursive: true });
        fs.copyFileSync(path.join(root, 'scripts/png.js'), path.join(support, 'png.js'));
        fs.copyFileSync(path.join(root, 'scratch/qa_water_capture.js'), path.join(support, 'water.js'));
        fs.writeFileSync(path.join(copy, 'data/DocsPlaytestRun.json'), JSON.stringify({ cases, seed: 137, output: 'playtest-output' }));
        const pkgPath = path.join(copy, 'package.json');
        const pkg = fs.existsSync(pkgPath) ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : { main: 'index.html' };
        pkg.name = 'docs-playtest-' + path.basename(copy).replace(/[^a-z0-9-]/gi, '').toLowerCase();
        pkg['chromium-args'] = String(pkg['chromium-args'] || '') + ' --disable-background-timer-throttling --disable-renderer-backgrounding';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
        return { copy, cases, project };
    } catch (error) {
        safeRemoveTemp(copy);
        throw error;
    }
}
function ensureDestinations(prepared, baseline, out) {
    for (const destination of [out, baseline]) if (containsPath(prepared.project, destination)) {
        throw new Error('Report and reference folders must be outside the original test project.');
    }
    if (containsPath(out, baseline) || containsPath(baseline, out)) {
        throw new Error('Report and reference folders must be separate, disjoint folders.');
    }
}
function clearReportArtifacts(out, cases) {
    const fixed = ['report.json', 'report.html', 'runtime.log'];
    const names = new Set(cases.map(c => c.name));
    try {
        const previous = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
        for (const check of previous.checks || []) if (check && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(check.name)) names.add(check.name);
    } catch (_) {}
    const pictures = Array.from(names).flatMap(name => [name + '.png', name + '-reference.png', name + '-difference.png']);
    for (const name of fixed.concat(pictures)) fs.rmSync(path.join(out, name), { force: true });
}
function readActiveManifest(baseline) {
    const pointer = path.join(baseline, 'current.json');
    if (!fs.existsSync(pointer)) return null;
    const active = JSON.parse(fs.readFileSync(pointer, 'utf8'));
    if (!active || !/^manifest-[a-zA-Z0-9_-]+\.json$/.test(active.manifest || '')) throw new Error('Invalid reference manifest pointer.');
    const manifestPath = path.join(baseline, active.manifest);
    if (!fs.existsSync(manifestPath)) throw new Error('The active reference manifest is missing.');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const run = path.resolve(baseline, manifest.run || '');
    if (!containsPath(path.join(baseline, 'runs'), run)) throw new Error('Invalid reference run path.');
    return { manifest, run };
}
function loadCapture(prepared, result, c) {
    const capture = (Array.isArray(result.cases) ? result.cases : []).find(r => r && r.name === c.name);
    if (!capture) return { error: 'Case never finished' };
    const width = Number(capture.width), height = Number(capture.height);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216) {
        return { capture, error: 'Capture dimensions are invalid' };
    }
    const from = path.join(prepared.copy, 'playtest-output', c.name);
    try {
        const rgba = fs.readFileSync(from + '.rgba');
        if (rgba.length !== width * height * 4) return { capture, error: 'Capture pixel data is incomplete' };
        if (!fs.existsSync(from + '.png') || !fs.statSync(from + '.png').size) return { capture, error: 'Capture picture is missing' };
        return { capture, from, current: { width, height, rgba } };
    } catch (error) { return { capture, error: 'Cannot read capture: ' + error.message }; }
}
function caseIdentity(c) { return JSON.stringify(c); }
function publishBaseline(baseline, prepared, loaded) {
    fs.mkdirSync(path.join(baseline, 'runs'), { recursive: true });
    const id = Date.now().toString() + '-' + crypto.randomBytes(6).toString('hex');
    const relativeRun = path.join('runs', id).replace(/\\/g, '/');
    const run = path.join(baseline, 'runs', id);
    fs.mkdirSync(run);
    for (const item of loaded) {
        fs.copyFileSync(item.from + '.png', path.join(run, item.case.name + '.png'));
        fs.copyFileSync(item.from + '.rgba', path.join(run, item.case.name + '.rgba'));
        fs.writeFileSync(path.join(run, item.case.name + '.json'), JSON.stringify({ width: item.current.width, height: item.current.height }));
    }
    const manifestName = 'manifest-' + id + '.json';
    const manifest = { version: 1, created: new Date().toISOString(), run: relativeRun,
        identity: crypto.createHash('sha256').update(JSON.stringify(prepared.cases)).digest('hex'),
        cases: Object.fromEntries(prepared.cases.map(c => [c.name, c])) };
    fs.writeFileSync(path.join(baseline, manifestName), JSON.stringify(manifest, null, 2));
    const pointer = path.join(baseline, 'current.json'), temporary = pointer + '.tmp-' + id;
    fs.writeFileSync(temporary, JSON.stringify({ manifest: manifestName }, null, 2));
    fs.renameSync(temporary, pointer);
    return { manifest, run };
}
function writeReport(prepared, result, options) {
    result = result || {};
    const machine = crypto.createHash('sha256').update(os.hostname() + '/' + process.platform).digest('hex').slice(0, 12);
    const baseline = path.resolve(options.baseline || path.join(os.homedir(), '.docs-doodads-playtest', machine));
    const out = path.resolve(options.out || path.join(root, 'release/playtest', Date.now().toString()));
    ensureDestinations(prepared, baseline, out);
    fs.mkdirSync(out, { recursive: true });
    clearReportArtifacts(out, prepared.cases);
    const errors = Array.isArray(result.errors) ? result.errors.map(String) : [];
    const loaded = prepared.cases.map(c => Object.assign({ case: c }, loadCapture(prepared, result, c)));
    const canUpdate = options.update && !result.error && !errors.length && loaded.every(item => !item.error);
    let active = null, baselineError = '';
    try { active = canUpdate ? publishBaseline(baseline, prepared, loaded) : readActiveManifest(baseline); }
    catch (error) { baselineError = error.message; }
    const identity = crypto.createHash('sha256').update(JSON.stringify(prepared.cases)).digest('hex');
    const suiteChanged = active && active.manifest.identity !== identity;
    const checks = [];
    for (const item of loaded) {
        const c = item.case, capture = item.capture;
        if (item.error) { checks.push({ name: c.name, pass: false, reason: item.error }); continue; }
        fs.copyFileSync(item.from + '.png', path.join(out, c.name + '.png'));
        let check;
        if (canUpdate && active && !baselineError) check = { pass: true, reason: 'Reference updated' };
        else if (baselineError) check = { pass: false, reason: 'Cannot read references: ' + baselineError };
        else if (suiteChanged) check = { pass: false, reason: 'The playtest case configuration changed; review and update the references' };
        else if (!active || !active.manifest.cases || !active.manifest.cases[c.name]) {
            check = { pass: false, reason: 'No reference: review this picture, then run with --update' };
        } else if (caseIdentity(active.manifest.cases[c.name]) !== caseIdentity(c)) {
            check = { pass: false, reason: 'The case configuration changed; review and update the reference' };
        } else {
            const kept = path.join(active.run, c.name);
            try {
                const expected = Object.assign(JSON.parse(fs.readFileSync(kept + '.json', 'utf8')), { rgba: fs.readFileSync(kept + '.rgba') });
                check = compare(expected, item.current, options);
                fs.copyFileSync(kept + '.png', path.join(out, c.name + '-reference.png'));
                if (!check.pass && check.diff) fs.writeFileSync(path.join(out, c.name + '-difference.png'), encodePng(item.current.width, item.current.height, check.diff, zlib.deflateSync));
                delete check.diff;
            } catch (error) { check = { pass: false, reason: 'Cannot read reference: ' + error.message }; }
        }
        checks.push(Object.assign({ name: c.name, fps: capture.fps, water: capture.water }, check));
    }
    const report = { pass: !result.error && !errors.length && checks.every(c => c.pass), error: result.error || null, errors,
        machine, gpu: result.gpu || '', checks, baseline, projectCopy: options.keepCopy ? prepared.copy : null };
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const panels = checks.map(c => '<h2>' + esc(c.name) + ': ' + (c.pass ? 'pass' : 'fail') + '</h2><p>' + esc(c.reason || (c.changed + ' changed pixels')) + '; ' + esc(c.fps) + ' FPS</p>'
        + [c.name + '-reference.png', c.name + '.png', c.name + '-difference.png'].filter(f => fs.existsSync(path.join(out, f))).map(f => '<a href="' + esc(f) + '"><img alt="' + esc(f) + '" width="320" src="' + esc(f) + '"></a>').join('')).join('');
    fs.writeFileSync(path.join(out, 'report.html'), '<!doctype html><meta charset="utf-8"><title>Playtest report</title><h1>' + (report.pass ? 'Passed' : 'Failed') + '</h1><pre>' + esc([report.error].concat(errors).filter(Boolean).join('\n')) + '</pre>' + panels);
    if (options.runtimeLog !== undefined) fs.writeFileSync(path.join(out, 'runtime.log'), String(options.runtimeLog));
    return Object.assign(report, { out });
}
async function terminateSpawned(child, deps = {}) {
    const grace = Number.isFinite(deps.terminateGraceMs) ? deps.terminateGraceMs : 1500;
    let closed = false;
    const close = new Promise(resolve => child.once('close', () => { closed = true; resolve(true); }));
    const wait = () => Promise.race([close, new Promise(resolve => setTimeout(() => resolve(false), grace))]);
    if (child.pid && process.platform === 'win32') {
        try { (deps.forceKill || cp.spawnSync)('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); } catch (_) {}
    } else if (child.pid) {
        try { process.kill(-child.pid, 'SIGTERM'); } catch (_) { try { child.kill(); } catch (_) {} }
    } else {
        try { child.kill(); } catch (_) {}
    }
    if (await wait()) return true;
    if (child.pid && process.platform !== 'win32') {
        try { process.kill(-child.pid, 'SIGKILL'); } catch (_) { try { child.kill('SIGKILL'); } catch (_) {} }
    } else if (!child.pid) {
        try { child.kill('SIGKILL'); } catch (_) {}
    }
    if (!closed) return wait();
    return true;
}
async function run(options, deps = {}) {
    options = Object.assign(parseArgs([]), options);
    if ((deps.runningRuntime || runningRuntime)()) throw new Error('Close the open NW.js playtest or Game.exe before running the screenshot playtest.');
    const runtime = options.runtime || DEFAULT_RUNTIMES.find(dir => fs.existsSync(path.join(dir, 'nw.exe')));
    const executable = runtime && path.join(path.resolve(runtime), process.platform === 'win32' ? 'nw.exe' : 'nw');
    if (!executable || !fs.existsSync(executable)) throw new Error('No MZ NW.js runtime found. Pass --runtime <folder containing nw.exe>.');
    let prepared;
    try {
        prepared = prepare(options);
        const child = (deps.spawn || cp.spawn)(executable, [prepared.copy, 'test'], { cwd: prepared.copy, windowsHide: true,
            detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
        let runtimeLog = '';
        for (const stream of [child.stdout, child.stderr]) if (stream) stream.on('data', chunk => { runtimeLog = (runtimeLog + String(chunk)).slice(-32768); });
        const result = await new Promise(resolve => {
            let settled = false, timingOut = false;
            const done = value => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
            const timer = setTimeout(async () => {
                timingOut = true;
                const closed = await terminateSpawned(child, deps);
                done({ error: 'Playtest timed out; the spawned runtime ' + (closed ? 'closed.' : 'did not confirm closure.'), errors: [] });
            }, options.timeout * 1000);
            child.on('error', error => done({ error: error.message, errors: [] }));
            child.on('close', code => {
                if (timingOut) return;
                const file = path.join(prepared.copy, 'playtest-output/result.json');
                try {
                    if (!fs.existsSync(file)) return done({ error: 'Runtime exited without a completed report (exit ' + code + ').', errors: [] });
                    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                    if (code && !data.error) data.error = 'Runtime exited with code ' + code;
                    done(data);
                } catch (error) { done({ error: 'Cannot read runtime report: ' + error.message, errors: [] }); }
            });
        });
        return writeReport(prepared, result, Object.assign({}, options, { runtimeLog }));
    } finally {
        if (prepared && !options.keepCopy) safeRemoveTemp(prepared.copy);
    }
}
if (require.main === module) {
    (async () => {
        const options = parseArgs(process.argv.slice(2));
        if (options.help) { console.log('npm run playtest -- [--project <MZ project>] [--runtime <NW.js folder>] [--cases <JSON>] [--baseline <folder>] [--out <folder>] [--update] [--keep-copy] [--timeout <seconds>] [--tolerance <0–255>] [--fraction <0–1>]\nThe project is copied first and normally deleted after the run. --keep-copy retains it for debugging. References stay on this computer. --update publishes a complete reference run atomically after a clean run.'); return; }
        const report = await run(options); console.log((report.pass ? 'Passed: ' : 'Failed: ') + path.join(report.out, 'report.html'));
        if (!report.pass) process.exitCode = 1;
    })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { parseCases, parseArgs, prepare, runningRuntime, writeReport, run, safeRemoveTemp, terminateSpawned };
