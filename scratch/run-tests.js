'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const testFiles = fs.readdirSync(__dirname)
    .filter(fileName => /^test_.*\.js$/i.test(fileName))
    .sort();

let failed = 0;
const startedAt = Date.now();
for (const fileName of testFiles) {
    console.log(`\n===== ${fileName} =====`);
    const result = spawnSync(process.execPath, [path.join(__dirname, fileName)], {
        cwd: projectRoot,
        stdio: 'inherit',
        timeout: 120000
    });
    if (result.status !== 0) {
        failed++;
        console.error(`FAILED: ${fileName}${result.signal ? ` (${result.signal})` : ''}`);
    }
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\nTest suites: ${testFiles.length - failed}/${testFiles.length} passed in ${elapsed}s`);
if (failed > 0) process.exitCode = 1;
