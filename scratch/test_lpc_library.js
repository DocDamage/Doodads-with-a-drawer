// scratch/test_lpc_library.js
// LPC library, phase 1 in the editor: the folder kept per computer (and a warning when it is inside the
// project), a scan saved to the editor's cache and read back, a library that changed or moved, the
// project's "only art safe to encrypt" setting, credits recorded per picture, CREDITS_LPC.txt and the
// Problems entries for both, and the card in More.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing LPC Library in the editor ===');

const elements = {};
const store = {};
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const made = [];
global.document = {
    createElement: tag => { const el = { tagName: tag, style: {}, innerHTML: '', attrs: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {},
        setAttribute(k, v) { this.attrs[k] = v; }, getContext: () => ({}) }; made.push(el); return el; },
    body: { appendChild(n) { if (n.id) elements[n.id] = n; n.parentNode = this; }, removeChild(n) { if (elements[n.id] === n) delete elements[n.id]; } },
    getElementById: id => elements[id] || null
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

const root = path.join(__dirname, 'lpc_library_fixture');
fs.rmSync(root, { recursive: true, force: true });
const project = path.join(root, 'project'), lib = path.join(root, 'library');
const write = (base, rel, data) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof data === 'string' ? data : JSON.stringify(data)); };
const credit = (file, licenses) => ({ file, licenses, authors: ['Ann'], urls: ['https://opengameart.org/x'] });
write(lib, 'sheet_definitions/body/body.json', { name: 'Body Color', layer_1: { zPos: 10, male: 'body/bodies/male/' }, credits: [credit('body/bodies/male', ['OGA-BY 3.0', 'CC-BY-SA 3.0'])] });
write(lib, 'sheet_definitions/weapons/sword.json', { name: 'Sword', layer_1: { zPos: 140, male: 'weapon/sword/' }, credits: [credit('weapon/sword', ['CC-BY-SA 3.0'])] });
write(lib, 'palette_definitions/body/meta_body.json', { label: 'Skintone', default: 'ulpc', base: 'light' });
write(lib, 'palette_definitions/body/body_ulpc.json', { light: ['#271920'] });
fs.mkdirSync(path.join(lib, 'spritesheets'), { recursive: true });
write(lib, '.git/HEAD', 'ref: refs/heads/master\n');
write(lib, '.git/refs/heads/master', '1111111111111111111111111111111111111111\n');
fs.mkdirSync(path.join(project, 'data'), { recursive: true });
process.on('exit', () => { process.chdir(__dirname); fs.rmSync(root, { recursive: true, force: true }); });
process.chdir(project);

require('../Docs-Doodads.js');
const D = DocsDoodads, L = D.Lpc, ws = D.Workspace;
const toasts = [];
ws.showToast = (text, kind) => toasts.push([kind, text]);
ws.mounted = true;

// 1. The folder is kept per computer; a folder that isn't the library is refused with a message.
assert.strictEqual(ws.lpcLibraryFolder(), '');
assert.strictEqual(ws.scanLpcLibrary(), null);
assert.ok(/Choose the LPC library folder/.test(toasts.pop()[1]));
ws.setLpcLibraryFolder(root);
assert.strictEqual(ws.scanLpcLibrary(), null, 'not the library');
assert.ok(/sheet_definitions/.test(toasts.pop()[1]));
ws.setLpcLibraryFolder('  ' + lib + '  ');
assert.strictEqual(ws.lpcLibraryFolder(), lib, 'trimmed');
assert.strictEqual(JSON.parse(store[D.Ui.prefsKey]).lpcLibrary, lib, 'kept in the editor prefs on this computer');
console.log('✓ library folder: per computer, refused when not the library');

// 2. A scan is saved to the cache and read back after a restart; a changed or moved library is noticed.
const index = ws.scanLpcLibrary();
assert.strictEqual(index.parts.length, 2);
assert.ok(/Found 2 character parts \(1 safe to encrypt\)/.test(toasts.pop()[1]));
assert.ok(fs.existsSync(path.join(project, 'data/docs_doodads_cache/lpc_index.json')));
ws._lpcIndex = undefined;
assert.strictEqual(ws.lpcIndex().parts.length, 2, 'read back from the cache');
assert.strictEqual(ws.lpcIndex().commit, '1111111111111111111111111111111111111111');
assert.strictEqual(ws.lpcIndexStale(), '');
write(lib, '.git/refs/heads/master', '2222222222222222222222222222222222222222\n');
assert.strictEqual(ws.lpcIndexStale(), 'changed');
fs.renameSync(lib, lib + '_moved');
assert.strictEqual(ws.lpcIndexStale(), 'missing');
fs.renameSync(lib + '_moved', lib);
console.log('✓ scan: saved to the cache, read back, changed and moved libraries noticed');

// 3. The project's setting: only art safe to encrypt, on until turned off (kept in the project data).
assert.strictEqual(ws.lpcSafeOnly(), true);
ws.setLpcSafeOnly(false);
assert.strictEqual(ws.lpcSafeOnly(), false);
assert.strictEqual($dataDocsDoodads.world.lpc.safeOnly, false);
ws.setLpcSafeOnly(true);
assert.strictEqual(ws.lpcSafeOnly(), true);
assert.ok(!($dataDocsDoodads.world && $dataDocsDoodads.world.lpc && 'safeOnly' in $dataDocsDoodads.world.lpc), 'back to the default: nothing stored');
console.log('✓ setting: only art safe to encrypt, per project');

// 4. Credits per picture, Problems for pictures that can't be encrypted and for CREDITS_LPC.txt.
const [body, sword] = ['body/body', 'weapons/sword'].map(id => ws.lpcIndex().parts.find(p => p.id === id));
assert.deepStrictEqual(ws.lpcProblems(), [], 'nothing made yet: nothing to say');
assert.strictEqual(ws.lpcCreditsTextState(), 'none');
write(project, 'img/characters/$Hero.png', 'png');
write(project, 'img/characters/$Knight.png', 'png');
assert.strictEqual(ws.recordLpcImage('img/characters/$Hero.png', [{ part: body, folder: 'body/bodies/male/' }]).safeToEncrypt, true);
assert.strictEqual(ws.recordLpcImage('img/characters/$Knight.png', [{ part: body, folder: 'body/bodies/male/' }, { part: sword, folder: 'weapon/sword/' }]).safeToEncrypt, false);
ws.recordLpcImage('img/characters/$Gone.png', [{ part: sword, folder: 'weapon/sword/' }]);
assert.ok(fs.existsSync(path.join(project, 'data/DocsDoodadsCredits.json')));
let problems = ws.lpcProblems();
assert.deepStrictEqual(problems.map(p => p.kind), ['lpcEncrypt', 'lpcCredits'], 'a picture that is gone is not listed');
assert.ok(/^\$Knight\.png: its art is only offered under CC-BY-SA 3\.0/.test(problems[0].text), problems[0].text);
assert.ok(problems.every(p => p.global), 'project-wide: no map to go to');
assert.ok(/hasn't been written/.test(problems[1].text));
problems[1].fix.run();
assert.strictEqual(ws.lpcCreditsTextState(), 'ok');
const text = fs.readFileSync(path.join(project, 'CREDITS_LPC.txt'), 'utf8');
assert.ok(text.includes('img/characters/$Hero.png') && text.includes('img/characters/$Knight.png') && !text.includes('$Gone'), 'credits only for pictures in the project');
assert.deepStrictEqual(ws.lpcProblems().map(p => p.kind), ['lpcEncrypt']);
ws.recordLpcImage('img/characters/$Hero.png', [{ part: body, folder: 'body/bodies/male/' }, { part: sword, folder: 'weapon/sword/' }]);
assert.strictEqual(ws.lpcCreditsTextState(), 'old', 'credits changed since it was written');
assert.ok(/out of date/.test(ws.lpcProblems().find(p => p.kind === 'lpcCredits').text));
assert.ok(ws.problemGroups.some(g => g[0] === 'lpcEncrypt') && ws.problemGroups.some(g => g[0] === 'lpcCredits'));
assert.ok(/if \(!p\.global\)/.test(String(ws.renderProblems)), 'project-wide problems get no Go To button');
assert.ok(/lpcProblems/.test(String(ws.collectProblems)), 'Problems asks for them');
console.log('✓ credits: per picture, Problems for encryption and CREDITS_LPC.txt, Write It');

// 5. The card: status, warnings, the setting, credits; buttons do their work.
ws.writeLpcCreditsText();
let card = ws.showLpcCard();
assert.ok(card && elements['dd-lpc-card'] === card);
assert.ok(/<b>2 parts<\/b>, 1 safe to encrypt · 1 colour set<br>/.test(card.innerHTML));
assert.ok(/version 1111111</.test(card.innerHTML), 'the version scanned is shown');
assert.ok(/changed since it was scanned/.test(card.innerHTML), 'stale');
assert.ok(/2 pictures made from the library, <b>2 can't be encrypted<\/b>/.test(card.innerHTML), card.innerHTML.match(/dd-lpc-credits[\s\S]{0,200}/)[0]);
assert.ok(/CREDITS_LPC\.txt: up to date/.test(card.innerHTML));
assert.ok(/id="dd-lpc-safe" checked/.test(card.innerHTML));
assert.ok(!/inside the project/.test(card.innerHTML));
ws.setLpcLibraryFolder(path.join(project, 'lpc'));
card = ws.showLpcCard();
assert.ok(/This folder is inside the project/.test(card.innerHTML), 'warns about a library inside the project');
ws.setLpcLibraryFolder(lib);
// The buttons (the fake page keeps no elements by id other than the card, so drive the handlers directly).
elements['dd-lpc-scan'] = { onclick: null };
elements['dd-lpc-safe'] = { onchange: null };
elements['dd-lpc-folder'] = { value: lib, onchange: null };
ws.showLpcCard();
(async () => {
await elements['dd-lpc-scan'].onclick();
assert.strictEqual(elements['dd-lpc-scan'].textContent, 'Scanning...', 'says so while it scans');
assert.strictEqual(ws.lpcIndexStale(), '', 'scanning again catches up with the library');
elements['dd-lpc-safe'].onchange({ target: { checked: false } });
assert.strictEqual(ws.lpcSafeOnly(), false);
assert.ok(/id="dd-lpc-safe" >|id="dd-lpc-safe"  \/>/.test(elements['dd-lpc-card'].innerHTML), 'the switch shows off');
ws.setLpcSafeOnly(true);
ws.pickLpcLibraryFolder();
const picker = made[made.length - 1];
assert.strictEqual(picker.type, 'file');
assert.ok('nwdirectory' in picker.attrs, 'NW.js folder picker');
picker.value = lib + '_other';
picker.onchange();
assert.strictEqual(ws.lpcLibraryFolder(), lib + '_other');
ws.closeLpcCard();
assert.strictEqual(elements['dd-lpc-card'], undefined);
assert.ok(/closeLpcCard/.test(String(ws.close)), 'closed with the editor');
console.log('✓ card: status, stale and inside-project warnings, setting, credits, scan and folder picker');

console.log('=== LPC library in the editor passed ===');
})().catch(e => { console.error(e); process.exit(1); });
