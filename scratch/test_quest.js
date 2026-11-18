'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine'); E.install(); E.setupWorld();
const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } };
require('../Docs-Doodads.js');
const D = DocsDoodads, Q = D.Quest, W = D.Workspace;
assert.ok(Q, 'first-map quest exists');
assert.strictEqual(Q.progress({ placed: 0, lights: 0, minutes: 720, played: false, saved: false }).filter(s => s.done).length, 0);
const complete = Q.progress({ placed: 3, lights: 1, minutes: 1200, played: true, saved: true });
assert.strictEqual(complete.filter(s => s.done).length, 5);
assert.strictEqual(Q.progress({ minutes: 60 }).find(s => s.id === 'night').done, true);
assert.strictEqual(Q.progress({ minutes: null }).find(s => s.id === 'night').done, false);
W.mounted = false; W.showToast = () => {};
$dataDocsDoodads[1] = [];
assert.strictEqual(W.startQuest(), true);
assert.strictEqual(D.Ui.prefs().welcomed, true);
W.markQuest('saved');
assert.strictEqual(D.Ui.prefs().quest.saved, false, 'a save before Play From Here does not finish the last step');
$dataDocsDoodads[1].push({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2, light: { enabled: true } });
W.previewMinutes = 1200; W.updateQuest();
assert.deepStrictEqual(D.Ui.prefs().quest.completed.sort(), ['lamp', 'night', 'place']);
W.markQuest('played'); W.markQuest('saved');
assert.strictEqual(D.Ui.prefs().quest.status, 'done');
assert.strictEqual(W.startQuest(), false, 'finished quests never reopen automatically');
assert.strictEqual(W.startQuest(true), true, 'explicit replay starts fresh');
W.pauseQuest('skipped');
assert.strictEqual(D.Ui.prefs().quest.status, 'skipped');
assert.strictEqual(W.startQuest(), false, 'Skip is remembered');
W.startQuest(true); W.pauseQuest('paused');
assert.strictEqual(W.resumeQuest(), true, 'Not now resumes on the next editor open');
assert.ok(W.paletteCommands().some(command => /First Map Quest/.test(command.label)));
W.stopQuestUi();
// Opening the editor starts the quest only once it is mounted, so the card is drawn and its steps tick off.
// (buildDom used to start it before open() set mounted: no card, no timer, on every open.)
const openSource = W.open.toString();
assert.ok(openSource.indexOf('this.startOnboarding()') > openSource.indexOf('this.mounted = true'), 'the quest starts after the editor is mounted');
assert.ok(!/startQuest|resumeQuest/.test(W.buildDom.toString()), 'building the panels does not start the quest');
delete store['docsDoodads.ui']; W._questMemory = null;
let drawn = 0; const realRender = W.renderQuest; W.renderQuest = () => { drawn++; };
W.mounted = true; W.startOnboarding();
assert.ok(drawn > 0 && W._questTimer, 'someone new sees the quest card, and its steps are checked as they work');
assert.strictEqual(W.questData().status, 'active');
W.mounted = false; W.stopQuestUi(); W.renderQuest = realRender;
// Step 1 for someone new: with Select (the default) a click on the map picks, it does not place, so the hint
// for a picked picture says to drag it or use Stamp. (It used to say "click the map to place it".)
{
    let hint = ''; const realSetHint = D.Ui.setHint; D.Ui.setHint = text => { hint = text; };
    W.selectedEvent = W.selectedDoodad = null; W.selectedDoodads = [];
    W.selectedAsset = { fileName: 'sample_bush.png', category: 'Doodads' }; W.placementTool = null;
    W.updateInspectorHead();
    assert.ok(/drag it onto the map/i.test(hint) && /stamp/i.test(hint) && !/^now click the map/i.test(hint), 'the hint says how a picture is placed with Select: ' + hint);
    W.selectedAsset = null; D.Ui.setHint = realSetHint;
}
const storage = global.localStorage;
global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
W._questMemory = null;
assert.doesNotThrow(() => W.startQuest(true));
assert.strictEqual(W.questData().status, 'active', 'progress survives in memory when preferences cannot be written');
global.localStorage = storage;
W.stopQuestUi();
console.log('First-map quest: five steps, observed progress, finish, skip, pause and replay passed.');
