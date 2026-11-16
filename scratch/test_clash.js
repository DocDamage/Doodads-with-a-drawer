'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld();
require('../Docs-Doodads.js');
const D = DocsDoodads, C = D.Clash;
assert.ok(C, 'plugin checks exist');
const table = [{ match: 'TorchPack', level: 'order', before: 'Docs-Doodads', note: 'Load TorchPack first.' }, { match: 'OldDraw', level: 'clash', note: 'Replaces drawing.' }];
const plugins = [{ name: 'Docs-Doodads', status: true, parameters: { private: 'own' } }, { name: 'TorchPack', status: true, parameters: { token: 'NEVER_REPORT_OTHER_PARAMETERS' } }, { name: 'OldDraw', status: false }];
let findings = C.check(plugins, table);
assert.strictEqual(findings.length, 1);
assert.match(findings[0].text, /TorchPack.*Docs-Doodads/);
assert.strictEqual(C.check(plugins.slice().reverse(), table).length, 0);
assert.strictEqual(C.check([{ name: 'OldDraw', status: true }], table)[0].level, 'clash');
const target = { run(value) { return value + 1; } };
const tracked = C.watch(target, 'run', 'Example.run');
assert.ok(tracked);
const prior = target.run;
target.run = function(value) { return prior.call(this, value) * 2; };
assert.strictEqual(target.run(2), 6);
assert.strictEqual(C.hookFindings(plugins).some(row => row.hook === 'Example.run'), false, 'delegating wrappers are accepted');
target.run = function() { return 17; };
assert.strictEqual(target.run(2), 17);
assert.ok(C.hookFindings(plugins).some(row => row.hook === 'Example.run' && /TorchPack/.test(row.text)), 'replaced hooks list possible later plugins');
for (let i = 0; i < 230; i++) C.record('warn', ['warning ' + i]);
assert.strictEqual(C.messages.length, 200);
assert.match(C.messages[0].text, /30/);
const report = C.report({ version: 'test', projectRoot: 'C:\\Projects\\Game', plugins,
    parameters: { art: 'C:\\Projects\\Game\\img\\Tree.png', external: 'C:\\Users\\Alice\\private\\file.png', token: 'PRIVATE_TOKEN' },
    problems: [{ text: 'Failed at /home/alice/private/file.js and C:\\Users\\Alice\\log.txt' }],
    map: { id: 1, width: 10, height: 20, doodads: 4 }, system: { mz: '1', nw: '2', chromium: '3', gpu: 'GPU', screen: [816, 624], tile: [48, 48] } });
assert.ok(report.includes('img/Tree.png'));
assert.ok(report.includes('TorchPack'));
for (const secret of ['NEVER_REPORT_OTHER_PARAMETERS', 'PRIVATE_TOKEN', 'Users', 'Alice', '/home/alice']) assert.ok(!report.includes(secret), secret + ' is excluded');
assert.ok(!report.includes('"private": "own"'), 'plugin list never serializes parameter objects');
assert.ok(report.includes('GPU') && report.includes('warning 229'));
assert.ok(D.Workspace.problemGroups.some(group => group[0] === 'plugins'));
console.log('Plugin checks: table order, observed wrapper replacement, bounded logs and private local reports passed.');
