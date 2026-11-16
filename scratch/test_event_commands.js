'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld({ width: 10, height: 10 });
require('../Docs-Doodads.js');

const D = DocsDoodads, C = D.EventCommands, W = D.Workspace;
assert.ok(C, 'event command model exists');

const samples = {
    showText: { faceName: 'Actor1', faceIndex: 2, background: 1, positionType: 0, speakerName: 'Doc', text: 'One\nTwo\nThree\nFour' },
    transfer: { mapId: 2, x: 7, y: 8, direction: 6, fadeType: 1 },
    switches: { startId: 3, endId: 5, value: 0 },
    selfSwitch: { letter: 'C', value: 1 },
    commonEvent: { id: 4 },
    wait: { frames: 45 },
    playSe: { name: 'Bell1', volume: 80, pitch: 110, pan: -15 },
    plugin: { pluginName: 'Docs_Doodads', commandName: 'pauseSchedules', displayName: 'Pause Schedules', args: { on: 'false' } }
};

for (const id of Object.keys(samples)) {
    const def = C.get(id);
    assert.ok(def && def.code > 0, id + ' is supported');
    assert.deepStrictEqual(def.read(def.write(samples[id], 2), 0), samples[id], id + ' read(write(values)) is exact');
    assert.ok(def.fields.every(field => field.key && field.kind), id + ' exposes editor field metadata');
}

const textCommands = C.get('showText').write(samples.showText, 2);
assert.strictEqual(textCommands.length, 5, 'four text lines are grouped under one 101 command');
assert.deepStrictEqual(textCommands.map(command => command.code), [101, 401, 401, 401, 401]);
assert.ok(textCommands.every(command => command.indent === 2));
assert.strictEqual(C.describe(textCommands.concat([{ code: 0, indent: 0, parameters: [] }])).length, 1, 'Show Text is one editable row');

const unknown = { code: 111, indent: 0, parameters: [0, 2, 0] };
const nestedUnknown = { code: 355, indent: 1, parameters: ['custom();'], extra: { untouched: true } };
const original = [
    unknown,
    { code: 121, indent: 1, parameters: [1, 1, 0] },
    nestedUnknown,
    { code: 0, indent: 0, parameters: [] }
];
const unknownBefore = JSON.stringify([unknown, nestedUnknown]);
const replaced = C.replace(original, 1, { startId: 2, endId: 6, value: 1 });
assert.strictEqual(JSON.stringify([replaced[0], replaced[2]]), unknownBefore, 'editing a supported row preserves unknown commands byte for byte');
assert.deepStrictEqual(replaced.map(command => command.indent), [0, 1, 1, 0], 'branch indents stay intact');
assert.strictEqual(C.describe(replaced)[0].editable, false);
assert.match(C.describe(replaced)[0].summary, /Edit in MZ/);
const moved = C.move(C.insert(replaced, 3, 'showText', samples.showText, 1), 3, -1);
const movedRows = C.describe(moved);
assert.strictEqual(movedRows.filter(row => row.code === 101).length, 1);
assert.strictEqual(movedRows.find(row => row.code === 101).length, 5, 'moving never splits 101 from its 401 lines');
assert.strictEqual(moved[moved.length - 1].code, 0, 'all list operations retain the final terminator');
assert.ok(!C.remove(moved, 0).some((command, index, all) => command.code === 0 && index !== all.length - 1));

// The event card mutates staged pages through editSelectedEvent, so each operation remains one ordinary undo step.
$dataMap.events[1] = D.Events.createEventObject(1, 2, 3, { list: C.get('showText').write(samples.showText, 0) });
const gameEvent = new Game_Event(1, 1);
$gameMap._events[1] = gameEvent;
W.selectedEvent = { gameEvent, stagedEvent: $dataMap.events[1] };
W.selectedStagedEvent = () => W.selectedEvent.stagedEvent;
W.refreshInspector = W.updateUndoButtons = W.refreshSpriteset = () => {};
D.Undo.clear();
W.openEventCommandEditor(0);
assert.strictEqual(W.eventEditorPage(), 0);
assert.strictEqual(W.replaceEventCommand(0, { faceName: '', faceIndex: 0, background: 0, positionType: 2, speakerName: 'Sign', text: 'Changed' }), true);
assert.strictEqual(W.selectedStagedEvent().pages[0].list[1].parameters[0], 'Changed');
assert.strictEqual(D.Undo.undoStack.length, 1);
D.Undo.undo();
assert.strictEqual(W.selectedStagedEvent().pages[0].list[1].parameters[0], 'One');

assert.strictEqual(W.addEventCommandPage(false), true);
assert.strictEqual(W.selectedStagedEvent().pages.length, 2);
assert.deepStrictEqual(W.selectedStagedEvent().pages[1].list, [{ code: 0, indent: 0, parameters: [] }], 'Add Page starts blank');
assert.strictEqual(W.addEventCommandPage(true), true);
assert.deepStrictEqual(W.selectedStagedEvent().pages[2], W.selectedStagedEvent().pages[1], 'Copy Page duplicates the selected page');
assert.notStrictEqual(W.selectedStagedEvent().pages[2], W.selectedStagedEvent().pages[1]);
const conditions = { switch1Valid: true, switch1Id: 2, switch2Valid: false, switch2Id: 1,
    variableValid: true, variableId: 3, variableValue: 9, selfSwitchValid: true, selfSwitchCh: 'B',
    itemValid: false, itemId: 1, actorValid: false, actorId: 1 };
assert.strictEqual(W.updateEventCommandPage({ conditions, trigger: 4, priorityType: 0 }), true);
assert.deepStrictEqual(W.selectedStagedEvent().pages[W.eventEditorPage()].conditions, conditions);

let confirmed = false;
const confirm = D.Ui.confirm;
D.Ui.confirm = async () => { confirmed = true; return true; };
(async () => {
    assert.strictEqual(await W.deleteEventCommandPage(), true);
    assert.ok(confirmed, 'Delete Page uses the red confirmation path');
    assert.strictEqual(W.selectedStagedEvent().pages.length, 2);
    D.Ui.confirm = confirm;

    // Database-backed pickers show names while retaining numeric MZ ids.
    $dataSystem.switches = ['', 'Gate Open', 'Night'];
    $dataSystem.variables = ['', 'Gold', 'Visits', 'Trust'];
    $dataCommonEvents = [null, { id: 1, name: 'Greeting' }];
    $dataMapInfos = [null, { id: 1, name: 'Town' }, { id: 2, name: 'House' }];
    assert.deepStrictEqual(W.eventCommandOptions('switch').map(option => option.label), ['1: Gate Open', '2: Night']);
    assert.deepStrictEqual(W.eventCommandOptions('variable').map(option => option.label), ['1: Gold', '2: Visits', '3: Trust']);
    assert.strictEqual(W.eventCommandOptions('map')[1].label, '2: House');

    // Transfer picking visits the destination, takes a tile, then returns and applies through the same undo flow.
    const page = W.selectedStagedEvent().pages[0];
    page.list = C.insert(page.list, 0, 'transfer', samples.transfer, 0);
    W._eventCommandPage = 0;
    let currentMap = 1;
    W.currentMapId = () => currentMap;
    const visits = [];
    W.goToMap = mapId => { visits.push(mapId); };
    W.setPlacementTool = tool => { W.placementTool = tool || null; };
    assert.strictEqual(W.beginEventTransferPick(0, 2), true);
    assert.deepStrictEqual(visits, [2]);
    currentMap = 2; W.resumeEventTransferPick();
    assert.strictEqual(W.placementTool, 'eventTransferTile');
    W.useEventTransferTile({ tileX: 6, tileY: 7 });
    assert.deepStrictEqual(visits, [2, 1]);
    currentMap = 1;
    W.selectedEvent = { gameEvent, stagedEvent: $dataMap.events[1] };
    W.resumeEventTransferPick();
    const transfer = C.get('transfer').read(W.selectedStagedEvent().pages[0].list, 0);
    assert.deepStrictEqual([transfer.mapId, transfer.x, transfer.y], [2, 6, 7]);
    assert.strictEqual(W._eventTransferPick, null);
    assert.ok(String(W.renderEventCommandEditor).includes('Edit in MZ'));
    assert.ok(String(W.editEventCommand).includes('DocsDoodads.Ui.form'));
    assert.ok(W.toolHooks.eventTransferTile);

    console.log('Event commands: grouped model, preservation, pages, forms and transfer picker passed.');
})().catch(error => { D.Ui.confirm = confirm; console.error(error); process.exitCode = 1; });
