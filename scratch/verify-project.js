'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
let failures = 0;

function run(label, command, args) {
    console.log(`\n===== ${label} =====`);
    const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit', timeout: 180000 });
    if (result.status !== 0) {
        failures++;
        console.error(`${label} failed.`);
    }
}

run('JavaScript syntax', process.execPath, ['--check', 'Docs-Doodads.js']);
run('Regression suites', process.execPath, [path.join('scratch', 'run-tests.js')]);

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
        if (/\.(dd|qj)(import|txn)-|\.tmp$/i.test(entry.name)) // qj* = artifacts from pre-rename builds transactionArtifacts.push(relative);
        if (entry.size > 5 * 1024 * 1024) continue;
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
