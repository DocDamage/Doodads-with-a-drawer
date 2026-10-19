'use strict';
// Runs every scratch/test_*.js, each in a project folder of its own in the system's temp folder (its
// working directory), so what a suite writes (data/, img/, caches, backups) never lands in the
// repository. Suites reach the repository through __dirname. Afterwards the repository must be as it was.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const testFiles = fs.readdirSync(__dirname)
    .filter(fileName => /^test_.*\.js$/i.test(fileName))
    .sort();

// Every file in the repository (but .git, node_modules and coverage) with its size and time.
const skip = new Set(['.git', 'node_modules', 'coverage']);
function snapshot() {
    const files = new Map();
    const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (skip.has(entry.name)) continue;
            const absolute = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(absolute);
            else {
                const st = fs.statSync(absolute);
                files.set(path.relative(projectRoot, absolute).replace(/\\/g, '/'), st.size + ':' + st.mtimeMs);
            }
        }
    };
    walk(projectRoot);
    return files;
}

const before = snapshot();
let failed = 0;
const startedAt = Date.now();
for (const fileName of testFiles) {
    console.log(`\n===== ${fileName} =====`);
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-suite-'));
    const result = spawnSync(process.execPath, [path.join(__dirname, fileName)], {
        cwd,
        env: Object.assign({}, process.env, { DD_REPO_ROOT: projectRoot }),
        stdio: 'inherit',
        timeout: 120000
    });
    try { fs.rmSync(cwd, { recursive: true, force: true }); } catch (error) {}
    if (result.status !== 0) {
        failed++;
        console.error(`FAILED: ${fileName}${result.signal ? ` (${result.signal})` : ''}`);
    }
}

const after = snapshot();
const changed = [];
for (const [file, stamp] of after) if (before.get(file) !== stamp) changed.push((before.has(file) ? 'changed ' : 'added ') + file);
for (const file of before.keys()) if (!after.has(file)) changed.push('removed ' + file);
if (changed.length) {
    failed++;
    console.error(`\nThe suites changed the repository (they must write in their own folder):\n  ${changed.slice(0, 20).join('\n  ')}`);
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\nTest suites: ${testFiles.length - failed + (changed.length ? 1 : 0)}/${testFiles.length} passed in ${elapsed}s`);
if (failed > 0) process.exitCode = 1;
