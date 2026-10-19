'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
let failures = 0;

// --skip-tests: everything but the regression suites (CI's Linux job runs them under coverage instead).
const skipTests = process.argv.includes('--skip-tests');

// Each step has ten minutes; the suites take about a minute here and longer on a busy CI runner (each
// suite has its own two-minute limit in run-tests.js).
function run(label, command, args) {
    console.log(`\n===== ${label} =====`);
    const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit', timeout: 600000 });
    if (result.status !== 0) {
        failures++;
        console.error(`${label} failed.`);
    }
}

run('Built from src/', process.execPath, [path.join('scripts', 'build.js'), '--check']);
run('JavaScript syntax', process.execPath, ['--check', 'Docs-Doodads.js']);
run('Guide shortcut table', process.execPath, [path.join('scripts', 'shortcuts.js'), '--check']);
run('Translation template', process.execPath, [path.join('scripts', 'strings.js'), '--check']);
run('Lint', process.execPath, [path.join('node_modules', 'eslint', 'bin', 'eslint.js'), 'Docs-Doodads.js', 'scripts', 'scratch', 'eslint.config.js']);
if (!skipTests) run('Regression suites', process.execPath, [path.join('scratch', 'run-tests.js')]);

// One version everywhere: package.json, the header's @plugindesc, the plugin's own pluginVersion and the
// changelog's newest section.
console.log('\n===== Version =====');
{
    const read = file => fs.readFileSync(path.join(projectRoot, file), 'utf8');
    const found = {
        'package.json': JSON.parse(read('package.json')).version,
        '@plugindesc': (read('src/00_header_and_plugin_parameters.js').match(/@plugindesc[^\n]*\[V([^\]]+)\]/) || [])[1],
        pluginVersion: (read('src/01_core_constants_parameters.js').match(/const pluginVersion = '([^']+)'/) || [])[1],
        'CHANGELOG.md': (read('CHANGELOG.md').match(/^## (?:Unreleased — )?(\d[^\s(]*)/m) || [])[1],
        // What's New shows once per id, so a release without new items would show the old ones as new.
        "What's New": (read('src/44_workspace_onboarding.js').match(/DocsDoodads\.WhatsNew = \{\s*id: '([^']+)'/) || [])[1]
    };
    const versions = new Set(Object.values(found));
    if (versions.size === 1 && !versions.has(undefined)) {
        console.log(`PASS ${found['package.json']} in package.json, the header, pluginVersion, the changelog and What's New`);
    } else {
        failures++;
        console.error(`FAIL the versions differ: ${Object.entries(found).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    }
}

console.log('\n===== Repository data =====');
for (const relativePath of ['data/DocsDoodadsLibrary.json', 'data/DocsDoodadsEventTemplates.json', 'data/DocsDoodadsLayouts.json']) {
    try {
        JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8'));
        console.log(`PASS ${relativePath}`);
    } catch (error) {
        failures++;
        console.error(`FAIL ${relativePath}: ${error.message}`);
    }
}

console.log('\n===== Secret and transaction artifact scan =====');
const secretPatterns = [
    /github_pat_[A-Za-z0-9_]{20,}/,
    /gh[pousr]_[A-Za-z0-9_]{20,}/,
    /sk-[A-Za-z0-9_-]{20,}/
];
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage', 'docs_doodads_cache']);
const findings = [];
const transactionArtifacts = [];

function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            visit(absolute);
            continue;
        }
        const relative = path.relative(projectRoot, absolute).replace(/\\/g, '/');
        // qj* names are artifacts from pre-rename builds.
        if (/\.(dd|qj)(import|txn)-|\.tmp$/i.test(entry.name)) transactionArtifacts.push(relative);
        // Pictures, sounds, models and fonts can't hold a token; big files are left out (a Dirent has no size).
        if (/\.(png|jpe?g|gif|webp|glb|gltf|bin|ogg|m4a|mp3|wav|webm|mp4|woff2?|ttf|otf|zip|ddpack|ico|psd|aseprite|ase)$/i.test(entry.name)) continue;
        if (fs.statSync(absolute).size > 5 * 1024 * 1024) continue;
        const content = fs.readFileSync(absolute, 'utf8');
        if (secretPatterns.some(pattern => pattern.test(content))) findings.push(relative);
    }
}
visit(projectRoot);

if (findings.length > 0) {
    failures++;
    console.error(`Potential secrets found in: ${findings.join(', ')}`);
} else {
    console.log('PASS no likely committed secrets');
}
if (transactionArtifacts.length > 0) {
    failures++;
    console.error(`Transaction artifacts remain: ${transactionArtifacts.join(', ')}`);
} else {
    console.log('PASS no transaction artifacts');
}

console.log(`\nVerification result: ${failures === 0 ? 'PASS' : 'FAIL'}`);
if (failures > 0) process.exitCode = 1;
