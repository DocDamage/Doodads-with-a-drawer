'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const help = require('../scripts/help');
const guide = fs.readFileSync(path.join(root, 'Docs_Doodads_Guide.md'), 'utf8');
const index = help.headings(guide);
assert.ok(index.length > 50);
assert.strictEqual(new Set(index.map(h => h.anchor)).size, index.length);
const example = help.headings('# Test\n\nFirst paragraph.\n\nSecond.\n\n## Test\n\nAgain.\n```js\n# Not a heading\n```\n');
assert.strictEqual(example.length, 2);
assert.strictEqual(example[0].firstParagraph, 'First paragraph.');
assert.strictEqual(example[1].anchor, 'test-1');
assert.strictEqual(fs.readFileSync(path.join(root, 'src/11_help_index.js'), 'utf8'), help.source(guide));
const anchors = new Set(index.map(h => h.anchor));
for (const file of fs.readdirSync(path.join(root, 'src')).filter(f => f.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(root, 'src', file), 'utf8');
    for (const m of text.matchAll(/data-dd-help="([^"]+)"/g)) assert.ok(anchors.has(m[1]), file + ': ' + m[1]);
}
const E = require('./engine/fake_engine');
E.install(); E.setupWorld();
require('../Docs-Doodads.js');
assert.ok(DocsDoodads.HelpIndex.some(h => /Command palette/.test(h.title)));
for (const row of DocsDoodads.Help.panels) assert.ok(anchors.has(row.anchor), row.anchor);
assert.strictEqual(DocsDoodads.Help.entry('not-an-anchor'), null);
const row = DocsDoodads.Help.entry(index[0].anchor);
assert.strictEqual(row.title, index[0].title);
const commands = DocsDoodads.Workspace.paletteCommands();
assert.ok(commands.some(c => c.label === 'Help: ' + index[0].title));
for (const title of ['Item Bag', 'Details', 'Scatter', 'Paint', 'Hills', 'Regions', 'Collision', 'Tiles', 'Mirror', 'Path', 'Map', 'Art', 'View', 'More',
    'Old Saves', 'Effects Maker', 'Screen Looks', 'World View', 'File Check', 'Doodad or event?', 'Add Files', 'Capture', 'Steps on this map',
    'Info', 'Bring Back a Backup', 'Find Doodads', "This Map's Doodads", 'Look', 'Characters', 'Tile 5, 6', 'Problems', 'Notes', 'Doodad Packs',
    'Bookmarks', 'Messages', 'Rooms', 'Event Templates', 'Map Settings', 'Settings', 'Keyboard Shortcuts', 'Moods']) {
    assert.ok(DocsDoodads.Help.anchorFor(title), title + ' has contextual help');
}
const node = text => ({ textContent: text, attrs: {}, children: [],
    getAttribute(k) { return this.attrs[k] || null; }, setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(child) { this.children.push(child); }, querySelector() { return this.children.find(c => c.className === 'dd-btn dd-context-help') || null; } });
const known = node('Moods'), unknown = node('An unrelated third-party panel');
document.createElement = () => node('');
DocsDoodads.Help.decorate({ querySelectorAll: () => [known, unknown] });
assert.strictEqual(known.children.length, 1);
assert.strictEqual(unknown.children.length, 0, 'do not link an unknown panel to unrelated help');
DocsDoodads.Help.decorate({ querySelectorAll: () => [known] });
assert.strictEqual(known.children.length, 1, 'decoration is idempotent');
console.log('Context help: all tests passed.');
