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
// A small DOM fixture checks the actual controls, including selection classification and More.
function node(tag, text = '') {
    return { tagName: tag.toUpperCase(), textContent: text, style: {}, children: [], id: '', value: '',
        appendChild(child) { if (child.parentNode) child.parentNode.children = child.parentNode.children.filter(c => c !== child); this.children.push(child); child.parentNode = this; },
        insertBefore(child, before) { if (child.parentNode) child.parentNode.children = child.parentNode.children.filter(c => c !== child); const index = this.children.indexOf(before); this.children.splice(index < 0 ? 0 : index, 0, child); child.parentNode = this; },
        setAttribute(key, value) { this[key] = value; },
        closest(selector) { let current = this; while (current) { if (current.tagName.toLowerCase() === selector) return current; current = current.parentNode; } return null; },
        querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
        querySelectorAll(selector) { const found = []; const visit = parent => { for (const child of parent.children) { if (selector.split(',').some(s => s.startsWith('#') ? child.id === s.slice(1) : child.tagName.toLowerCase() === s)) found.push(child); visit(child); } }; visit(this); return found; }
    };
}
const root = node('div');
for (const title of ['Appearance', 'Particles']) {
    const section = node('details'), summary = node('summary', title), row = node('div', title === 'Particles' ? 'Emitter amount' : 'Opacity');
    section.appendChild(summary); section.appendChild(row);
    const control = node('input'); control.id = title === 'Particles' ? 'particles.rateScale' : 'opacity'; row.appendChild(control); root.appendChild(section);
}
const position = node('div', 'Tile X'); const xInput = node('input'); xInput.id = 'dd-prop-x'; position.appendChild(xInput); root.appendChild(position);
document.createElement = tag => node(tag);
document.getElementById = id => id === 'dd-inspector-content' ? root : root.querySelector('#' + id);
W.selectedDoodads = [first];
assert.deepStrictEqual(W.detailsKinds(), ['picture']);
W.bindShortDetails();
const particleSection = root.querySelectorAll('details').find(s => s.querySelector('summary').textContent === 'Particles');
assert.strictEqual(particleSection.style.display, 'none');
const more = root.querySelector('#dd-details-more'); more.onclick();
assert.strictEqual(particleSection.style.display, '');
more.onclick();
const search = root.querySelector('#dd-details-search'); search.value = 'emitter'; search.oninput();
assert.strictEqual(particleSection.style.display, '', 'typing reveals and opens the hidden section');
assert.strictEqual(particleSection.open, true);
assert.strictEqual(position.style.display, 'none');
search.value = 'tile'; search.oninput();
assert.strictEqual(position.style.display, '', 'top-level fields are also searchable');
search.value = ''; search.oninput();
assert.strictEqual(particleSection.style.display, 'none', 'clearing search restores the shortlist');
assert.ok(!JSON.stringify(D.Ui.prefs()).includes('Emitter amount'), 'query text is never written to preferences');
root.children = [];
for (const [id, label] of [['dd-ev-x', 'Tile X'], ['dd-ev-trigger', 'Trigger'], ['dd-ev-label', 'Name over it']]) {
    const row = node('div', label), control = node('input'); control.id = id; row.appendChild(control); root.appendChild(row);
}
const commands = node('button', 'Edit Commands'); commands.id = 'dd-ev-commands-btn'; root.appendChild(commands);
W.selectedEvent = { stagedEvent: { id: 1, x: 2, pages: [] } };
W.bindShortDetails();
const labels = root.querySelector('#dd-details-event-labels');
assert.strictEqual(labels.style.display, 'none', 'event extras start under More');
assert.strictEqual(root.querySelector('#dd-details-event-commands').style.display, '', 'event commands start in the shortlist');
root.querySelector('#dd-details-more').onclick();
assert.strictEqual(labels.style.display, '');
root.querySelector('#dd-details-more').onclick();
root.querySelector('#dd-details-search').value = 'name'; root.querySelector('#dd-details-search').oninput();
assert.strictEqual(labels.style.display, '', 'event hidden settings are searchable');
W.selectedStagedEvent = () => W.selectedEvent.stagedEvent;
W.editSelectedEvent('event_label', event => { event.note = '<docs label: Shop>'; });
assert.strictEqual(D.Ui.prefs().detailsUsage.event.event_label, 1);
console.log('Short Details: defaults, pins, mixed kinds, hidden search and local usage passed.');
