'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld();
const store = {};
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.DetailsShort, W = D.Workspace;
assert.ok(R, 'Details short-list rules exist');
const sections = [
    { title: 'Appearance', fields: [{ key: 'opacity', label: 'Opacity' }] },
    { title: 'Motion', fields: [{ key: 'motion.speed', label: 'Speed' }] },
    { title: 'Light', fields: [{ key: 'light.radius', label: 'Radius' }] },
    { title: 'Sound', fields: [{ key: 'sound.file', label: 'Sound file' }] },
    { title: '3D Model', fields: [{ key: 'model.yaw', label: 'Turn model' }] },
    { title: 'Particles', fields: [{ key: 'particles.rateScale', label: 'Emitter amount' }] }
];
for (const [kind, expected] of [['picture', 'Appearance'], ['light', 'Light'], ['sound', 'Sound'], ['model', '3D Model']]) {
    assert.ok(R.sections(sections, [kind], [], {}).some(s => s.title === expected), kind + ' starts with its useful section');
}
assert.ok(R.sections(sections, ['picture'], ['Particles'], {}).some(s => s.title === 'Particles'), 'pinned sections always show');
assert.deepStrictEqual(R.sections(sections, ['picture', 'model'], [], {}).map(s => s.title), ['Appearance'], 'mixed selections use shared defaults');
assert.deepStrictEqual(R.search(sections, 'emitter').map(s => s.title), ['Particles'], 'search finds a hidden setting');
assert.strictEqual(R.search(sections, '<script>').length, 0);
assert.deepStrictEqual(R.sections(sections, ['picture'], [], { picture: { 'sound.file': 7 } }).map(s => s.title), ['Appearance', 'Motion']);
assert.ok(R.sections(sections, ['picture'], [], { picture: { 'sound.file': 8 } }).some(s => s.title === 'Sound'), 'enough real edits promote a section');
D.SimpleMode.active = true;
assert.ok(D.SimpleMode.sections(sections, 'sound').some(s => s.title === 'Sound'));
const first = D.standardStruct({ x: 0, y: 0 }), second = D.standardStruct({ x: 0, y: 0 });
W.refreshInspector = W.refreshSpriteset = W.updateUndoButtons = () => {};
W.setDoodadProperty([first, second], 'opacity', 200);
assert.strictEqual(D.Ui.prefs().detailsUsage.picture.opacity, 1, 'one multi-edit counts once per kind');
W.setDoodadProperty([first], 'opacity', 200);
assert.strictEqual(D.Ui.prefs().detailsUsage.picture.opacity, 1, 'unchanged inputs do not count');
W.previewDoodadProperty([first], 'opacity', 150);
W.previewDoodadProperty([first], 'opacity', 100);
W.commitPropertyPreview(); W.commitPropertyPreview();
assert.strictEqual(D.Ui.prefs().detailsUsage.picture.opacity, 2, 'a slider gesture counts once');
W.previewDoodadProperty([first], 'opacity', 50); W.previewDoodadProperty([first], 'opacity', 100); W.commitPropertyPreview();
assert.strictEqual(D.Ui.prefs().detailsUsage.picture.opacity, 2, 'a reverted gesture does not count');
const html = W.renderEffectSections([first]);
assert.ok(html.includes('Emitter'), 'all settings are rendered and bound before display filtering');
assert.ok(W._effectSections.some(s => s.title === 'Particles'));
console.log('Short Details: defaults, pins, mixed kinds, hidden search and local usage passed.');
