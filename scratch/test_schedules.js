'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld();

// The stand-in keeps only the pieces other tests need; schedules exercise these MZ character methods too.
Game_CharacterBase.prototype.setTransparent = function(on) { this._transparent = Boolean(on); };
Game_CharacterBase.prototype.setThrough = function(on) { this._through = Boolean(on); };
Game_Character.prototype.findDirectionTo = function() { return 0; };
Game_Event.prototype.refresh = function() {
    const page = this.page();
    if (page) this.setThrough(Boolean(page.through));
};

require('../Docs-Doodads.js');
const D = DocsDoodads, S = D.Schedules, R = D.ScheduleRuntime, W = D.Workspace;
assert.ok(S && R, 'schedule rules and runtime exist');

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const parsed = S.parse(`<docs schedule>
08:00 12,5
18:00 20,9 walk face:4
Sat, Sun 10:00 3,3 hide
25:00 4,4
Monday 09:00 nope
</docs schedule>`, weekdays);
assert.strictEqual(parsed.length, 3);
assert.strictEqual(parsed.errors.length, 2, 'bad schedule lines are reported, not thrown');
assert.strictEqual(parsed[1].walk, true); assert.strictEqual(parsed[1].face, 4);
assert.deepStrictEqual(parsed[2].days, ['Sat', 'Sun']);
assert.strictEqual(S.current(parsed, 11 * 60, 5, weekdays), parsed[2], 'weekday prefixes use the configured names');
assert.strictEqual(S.current(parsed, 19 * 60, 0, weekdays), parsed[1], 'latest applicable entry today wins');

const midnight = S.parse(`<docs schedule>
Monday 08:00 2,2
Sunday 20:00 9,9
</docs schedule>`, weekdays);
assert.strictEqual(S.current(midnight, 7 * 60, 0, weekdays).x, 9, 'before Monday starts, Sunday carries across midnight');
assert.strictEqual(S.current(midnight, 7 * 60, 2, weekdays), null, 'the specified fallback is yesterday only, not an older weekday');
const custom = ['Market Day', 'Rest Day'];
assert.strictEqual(S.current(S.parse('<docs schedule>\nMarket Day 09:00 1,1\n</docs schedule>', custom), 600, 0, custom).x, 1);
assert.strictEqual(S.parse('<docs schedule>\nMystery 09:00 1,1\n</docs schedule>', custom).errors.length, 1);
const tied = S.parse('<docs schedule>\n09:00 1,1\n09:00 2,2\n</docs schedule>', weekdays);
assert.strictEqual(S.current(tied, 540, 0, weekdays).x, 2, 'a later line wins an exact tie');
const rewritten = S.write('<docs label: Baker>\n<docs schedule>\n08:00 1,1\n</docs schedule>', [parsed[1]]);
assert.ok(rewritten.includes('<docs label: Baker>'));
assert.ok(rewritten.includes('18:00 20,9 walk face:4'));
assert.strictEqual((rewritten.match(/<docs schedule>/g) || []).length, 1);

// Runtime: derive location on setup/load, defer while an event is running, then walk or fall back.
$dataMap.events[1] = {
    id: 1, name: 'Baker', x: 1, y: 1,
    note: '<docs schedule>\n08:00 2,2\n09:00 5,5 walk face:6\n10:00 7,7 hide\n11:00 8,8 face:4\n</docs schedule>',
    pages: [{ through: true, list: [] }]
};
const npc = new Game_Event(1, 1); npc.locate(1, 1); npc.setThrough(true); npc.setTransparent(false);
$gameMap._events[1] = npc;
let now = 8 * 60, weekday = 0;
D.Atmosphere.minutes = () => now;
D.Calendar.weekday = () => weekday;
D.Calendar.weekdayNames = () => weekdays.slice();
R.reset(); R.updateMap($gameMap, true);
assert.deepStrictEqual([npc.x, npc.y, npc._docsScheduleKey], [2, 2, S.of(npc, weekdays)[0].key], 'map setup locates the current entry');

let busy = true;
$gameMap.isEventRunning = () => busy;
now = 9 * 60;
R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y], [2, 2], 'a running event defers a transition');
busy = false;
R.updateMap($gameMap, false);
assert.ok(R.stateFor(npc).target, 'the same minute retries after the map becomes free');
let attempts = 0;
npc.findDirectionTo = () => { attempts++; return 0; };
const walkingTarget = R.stateFor(npc).target;
for (let minute = 0; minute < 10; minute++) {
    now = 9 * 60 + minute;
    R.updateMap($gameMap, false);
    assert.strictEqual(R.stateFor(npc).target, walkingTarget, 'the same schedule entry preserves its walking state when the clock minute changes');
    const frames = minute === 9 ? 59 : 60;
    for (let frame = 0; frame < frames; frame++) R.stepEvent(npc);
}
assert.deepStrictEqual([npc.x, npc.y], [2, 2]);
R.stepEvent(npc);
assert.deepStrictEqual([npc.x, npc.y, npc.direction()], [5, 5, 6], 'a stuck walk locates and faces after 600 eligible frames');
assert.ok(attempts > 0);

now = 10 * 60; R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y, npc.isTransparent(), npc.isThrough()], [7, 7, true, true]);
now = 11 * 60; R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y, npc.isTransparent(), npc.isThrough(), npc.direction()], [8, 8, false, true, 4], 'leaving hide restores exact page flags');

// A page refresh while hidden must not make schedule transparency the event's new baseline.
now = 10 * 60; R.updateMap($gameMap, false);
npc.refresh();
assert.strictEqual(npc.isTransparent(), true);
now = 11 * 60; R.updateMap($gameMap, false);
assert.strictEqual(npc.isTransparent(), false);

// If the active page loses its schedule, the ordinary event position and flags come back.
const scheduleNote = $dataMap.events[1].note;
now = 10 * 60; R.updateMap($gameMap, false);
$dataMap.events[1].note = '';
if (D.VisualEquip._eventText) D.VisualEquip._eventText.delete(npc);
S.invalidate(npc); R.mapState($gameMap).pending = true;
R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y, npc.isTransparent(), npc.isThrough()], [1, 1, false, true]);
$dataMap.events[1].note = scheduleNote;
if (D.VisualEquip._eventText) D.VisualEquip._eventText.delete(npc);
S.invalidate(npc);

// A restored map has no WeakMap state: current clock state is derived again even if its saved key matches.
npc.setTransparent(true); npc.setThrough(false);
now = 11 * 60; R.updateMap($gameMap, false);
now = 10 * 60; R.updateMap($gameMap, false);
R.reset(); R.updateMap($gameMap, true);
now = 11 * 60; R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.isTransparent(), npc.isThrough()], [true, false], 'load while hidden restores the exact pre-schedule flags');
npc.setTransparent(false); npc.setThrough(true);
npc.locate(99, 99); npc._docsScheduleKey = S.of(npc, weekdays)[3].key;
R.reset(); R.updateMap($gameMap, true);
assert.deepStrictEqual([npc.x, npc.y], [8, 8]);

assert.strictEqual(D.api.schedules(false), false);
now = 8 * 60; R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y], [8, 8], 'paused schedules do not move events');
assert.strictEqual(D.api.schedules(true), true);
R.updateMap($gameMap, false);
assert.deepStrictEqual([npc.x, npc.y], [2, 2]);
const pauseCommand = Object.keys(PluginManager._commands).find(k => /:pauseSchedules$/.test(k));
assert.ok(pauseCommand);
PluginManager._commands[pauseCommand]({ on: 'false' });
assert.strictEqual(S.enabled(), false);
PluginManager._commands[pauseCommand]({ on: 'true' });

// Once an initial scan proves that a map has no schedules, its ordinary per-frame update avoids clock work.
const savedNoteForEmptyMap = $dataMap.events[1].note;
$dataMap.events[1].note = '';
if (D.VisualEquip._eventText) D.VisualEquip._eventText.delete(npc);
S.invalidate(npc);
R.reset();
R.updateMap($gameMap, true);
let emptyMapClockReads = 0;
const runtimeNow = R.now;
R.now = function() { emptyMapClockReads++; return runtimeNow.call(this); };
for (let frame = 0; frame < 30; frame++) $gameMap.updateDocsSchedules();
assert.strictEqual(emptyMapClockReads, 0, 'a scanned map with no schedules does not rebuild clock and weekday values every frame');
R.now = runtimeNow;
$dataMap.events[1].note = savedNoteForEmptyMap;
if (D.VisualEquip._eventText) D.VisualEquip._eventText.delete(npc);
S.invalidate(npc);
R.reset(); R.updateMap($gameMap, true);

// Editor helpers: a current-page schedule stays page-scoped in one undoable edit.
const staged = JSON.parse(JSON.stringify($dataMap.events[1]));
staged.note = '<docs label: Baker>';
staged.pages[0].list = [
    { code: 108, indent: 0, parameters: ['<docs schedule>'] },
    { code: 408, indent: 0, parameters: ['08:00 1,1'] },
    { code: 408, indent: 0, parameters: ['</docs schedule>'] },
    { code: 0, indent: 0, parameters: [] }
];
W.selectedEvent = { gameEvent: npc, stagedEvent: staged };
W.selectedStagedEvent = () => staged;
const undoCommands = [];
const execute = D.Undo.execute;
D.Undo.execute = command => { undoCommands.push(command); command.apply(); };
assert.strictEqual(W.editEventSchedule(S.parse('<docs schedule>\n12:00 6,6 walk\n</docs schedule>', weekdays)), true);
assert.strictEqual(undoCommands.length, 1);
assert.ok(!staged.note.includes('<docs schedule>'));
assert.ok(staged.pages[0].list.some(c => /12:00 6,6 walk/i.test(String((c.parameters || [])[0] || ''))), 'the active-page block remains on that page');
undoCommands[0].revert();
assert.ok(!staged.note.includes('<docs schedule>'));
assert.ok(staged.pages[0].list.some(c => /08:00 1,1/i.test(String((c.parameters || [])[0] || ''))));
undoCommands[0].apply();

// Editing is page-scoped when the active page owns a block, and never removes another page's block.
staged.note = '<docs schedule>\n06:00 2,2\n</docs schedule>';
staged.pages.push({ through: false, list: [
    { code: 108, indent: 0, parameters: ['<docs schedule>'] },
    { code: 408, indent: 0, parameters: ['18:00 8,8 hide'] },
    { code: 408, indent: 0, parameters: ['</docs schedule>'] },
    { code: 0, indent: 0, parameters: [] }
] });
npc._pageIndex = 0;
staged.pages[0].list = [
    { code: 108, indent: 0, parameters: ['<docs schedule>'] },
    { code: 408, indent: 0, parameters: ['12:00 6,6 walk'] },
    { code: 408, indent: 0, parameters: ['</docs schedule>'] },
    { code: 0, indent: 0, parameters: [] }
];
const pageTwoBefore = JSON.stringify(staged.pages[1].list);
const noteBeforePageEdit = staged.note;
assert.strictEqual(W.selectedScheduleData().scope.kind, 'page');
assert.strictEqual(W.editEventSchedule(S.parse('<docs schedule>\n13:00 7,7 face:2\n</docs schedule>', weekdays)), true);
assert.strictEqual(JSON.stringify(staged.pages[1].list), pageTwoBefore, 'editing page 1 preserves the inactive page 2 schedule exactly');
assert.strictEqual(staged.note, noteBeforePageEdit, 'a page schedule is not silently migrated into the event note');
assert.ok(staged.pages[0].list.some(c => /13:00 7,7 face:2/.test(String((c.parameters || [])[0] || ''))));

const invalidEdit = S.parse('<docs schedule>\nbad line\n</docs schedule>', weekdays);
assert.strictEqual(W.editEventSchedule(invalidEdit), false, 'invalid text is kept in the field instead of dropping its line');

W.beginScheduleTilePick(0);
W.toolHooks.scheduleTile.click.call(W, { tileX: 9, tileY: 4 });
assert.ok(staged.pages[0].list.some(c => /13:00 9,4 face:2/.test(String((c.parameters || [])[0] || ''))));
assert.strictEqual(W.placementTool, null);
const overlay = W.scheduleOverlayEntries();
assert.deepStrictEqual(overlay.map(e => [e.x, e.y, e.label]), [[9, 4, '13:00']]);
const graphics = new PIXI.Graphics();
PIXI.Text = function(text, style) { this.text = text; this.style = style; this.anchor = { set() {} }; this.visible = true; };
const liveCamera = D.Perspective.liveCamera; D.Perspective.liveCamera = () => false;
W.drawScheduleOverlay(graphics);
D.Perspective.liveCamera = liveCamera;
assert.strictEqual(graphics._ddScheduleLabels[0].text, '13:00');
assert.ok(String(W.renderScheduleDetails).includes('Use this tile'));
D.Undo.execute = execute;

console.log('NPC schedules: parser, midnight, runtime, pause and editor flow passed.');
