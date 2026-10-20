// scratch/test_package.js
// npm run package (scripts/package.js): the release zip holds the plugin as src/ builds it, the install readme,
// the docs, the translation template, tools/deploy.js and the licences, in one folder named for the version;
// every file reads back (checked by the plugin's own zip reader, CRCs included); the same checkout gives the same
// bytes; versions that differ are refused; a commit can be packaged with --ref. Nothing is written in the repository.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

console.log('=== Testing the release package ===');

global.window = global;
global.window.addEventListener = () => {};
global.document = { createElement: () => ({ style: {}, appendChild() {} }), body: { appendChild() {} }, getElementById: () => null, querySelectorAll: () => [], addEventListener() {} };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: o => o === 'test' };
global.PluginManager = { parameters: () => ({}) };
require(path.join(__dirname, '..', 'Docs-Doodads.js'));
const P = require(path.join(__dirname, '..', 'scripts', 'package.js'));
const root = path.join(__dirname, '..');

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-package-'));
process.on('exit', () => fs.rmSync(out, { recursive: true, force: true }));

// 1. The zip: one folder named for the version, the files a person needs, nothing else.
const result = P.makePackage({ out });
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
assert.strictEqual(result.version, version);
assert.strictEqual(path.basename(result.file), `Docs-Doodads-${version}.zip`);
const read = DocsDoodads.Zip.read(fs.readFileSync(result.file), zlib.inflateRawSync);
assert.deepStrictEqual(read.unsafe, []);
const folder = `Docs-Doodads-${version}/`;
const names = read.files.map(f => f.name);
assert.ok(names.every(n => n.startsWith(folder)), 'everything in one folder');
const inside = names.map(n => n.slice(folder.length));
for (const want of ['Docs-Doodads.js', 'README.txt', 'Docs_Doodads_Guide.md', 'CHEAT_SHEET.md', 'CHANGELOG.md', 'LICENSE',
    'docs/FIRST_3D_MAP.md', 'languages/template.json', 'tools/deploy.js', 'licenses/Nunito-OFL.txt']) assert.ok(inside.includes(want), want + ' is in it');
assert.ok(inside.some(n => /^docs\/images\/first3d_.*\.jpg$/.test(n)), "Your First 3D Map's pictures come with it");
assert.ok(!inside.some(n => /\.gif$|^src\/|^scratch\/|^img\/|^audio\//.test(n)), 'no README clips, sources, tests or art');
console.log('✓ One folder per version, with the plugin, the docs, the template, the deploy tool and the licences.');

// 2. The plugin in it is what src/ builds, and the readme says how to install it and where the libraries are.
const file = n => Buffer.from(read.files.find(f => f.name === folder + n).data);
assert.strictEqual(file('Docs-Doodads.js').toString('utf8'), P.buildFrom(P.source()), 'the plugin as src/ builds it');
const readme = file('README.txt').toString('utf8');
assert.ok(readme.startsWith(`Doc's Doodads ${version}`));
assert.ok(/js\/plugins/.test(readme) && /F10/.test(readme) && /tools\/deploy\.js --restore/.test(readme));
assert.ok(/LiberatedPixelCup/.test(readme) && /sleeping-robot-games\.itch\.io/.test(readme) && /store\.steampowered\.com/.test(readme));
assert.ok(file('tools/deploy.js').equals(fs.readFileSync(path.join(root, 'scripts/deploy.js'))));
console.log('✓ The plugin as built, a readme on installing it, the libraries\' links.');

// 3. The same checkout gives the same zip (files dated with the release's day).
const before = fs.readFileSync(result.file);
const again = fs.readFileSync(P.makePackage({ out }).file);
assert.ok(again.equals(before), 'packaged twice: the same bytes');
const first = P.zip([{ name: 'a.txt', data: Buffer.from('a') }], new Date(Date.UTC(2026, 9, 19, 12)));
assert.ok(first.equals(P.zip([{ name: 'a.txt', data: Buffer.from('a') }], new Date(Date.UTC(2026, 9, 19, 12)))), 'same files, same date: same bytes');
assert.deepStrictEqual(P.releaseDate('2.0.0-alpha.1', '# Changelog\n\n## Unreleased\n\n- x\n\n## 2.0.0-alpha.1 — 2026-10-19\n'), new Date(Date.UTC(2026, 9, 19, 12)));
assert.strictEqual(P.releaseDate('2.0.0-alpha.2', '## Unreleased\n'), null, 'not released yet: no date');
console.log('✓ Same files, same bytes; dated with the release.');

// 4. Versions that differ are refused; a ref that isn't there is said plainly; a commit can be packaged.
assert.throws(() => P.checkVersions({ 'package.json': '2.0.0', '@plugindesc': '2.0.0', pluginVersion: '1.9.0' }), /versions differ/);
assert.throws(() => P.checkVersions({ 'package.json': '2.0.0', '@plugindesc': undefined, pluginVersion: '2.0.0' }), /versions differ/);
assert.throws(() => P.source('no-such-ref-at-all'), /no commit or tag called/);
let gitWorks = true;
try { require('child_process').execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, stdio: 'ignore' }); } catch (e) { gitWorks = false; }
if (gitWorks) {
    const head = P.source('HEAD');
    assert.ok(head.list('src').some(f => /^\d{2}_.*\.js$/.test(f)), 'the commit\'s parts are listed');
    assert.ok(head.read('package.json').length > 0);
    assert.ok(/pluginVersion = '/.test(P.buildFrom(head)), 'the commit\'s plugin builds');
}
console.log('✓ Versions checked; a missing ref named; a commit packaged from git.');

console.log('\nAll release package checks passed.');
