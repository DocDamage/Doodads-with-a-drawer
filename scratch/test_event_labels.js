// scratch/test_event_labels.js
// Names and icons over events (7.4.6): <docs label: Blacksmith>, <docs icon: 87> and <docs label range: 4> in an
// event's note or a page comment. Parsing; the range; a label goes when its event is erased or a message shows;
// invisible blocking events have none; a map with no tags makes nothing; the 3D view places them; the Show /
// Hide Event Labels command; and the event Details fields, which write the note in one undo step.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Event Labels ===');

E.install();
E.setupWorld({ width: 30, height: 20, px: 10, py: 10 });
// 1: a smith (always), 2: a sign with an icon and a range of 3 (in a page comment), 3: an invisible blocker,
// 4: an invisible exit the player walks through, 5: an event with no tags.
$dataMap.events[1] = { id: 1, name: 'Smith', note: '<docs label: Blacksmith>', pages: [{ list: [] }] };
$dataMap.events[2] = { id: 2, name: 'Sign', note: '', pages: [{ list: [{ code: 108, parameters: ['<docs icon: 87>'] }, { code: 408, parameters: ['<docs label range: 3>'] }] }] };
$dataMap.events[3] = { id: 3, name: 'Blocker', note: '<docs label: Hidden>', pages: [{ list: [] }] };
$dataMap.events[4] = { id: 4, name: 'Exit', note: '<DOCS  LABEL :  To Town >', pages: [{ list: [] }] };
$dataMap.events[5] = { id: 5, name: 'Plain', note: 'just a note', pages: [{ list: [] }] };
const make = (id, x, y, image, through) => {
    const ev = new Game_Event(1, id);
    ev.setImage(image || '', 0);
    ev._through = Boolean(through);
    ev.locate(x, y);
    $gameMap._events[id] = ev;
    return ev;
};
const smith = make(1, 12, 10, 'Actor1');
const sign = make(2, 15, 4, 'Actor1');
make(3, 8, 8, '', false);
make(4, 9, 12, '', true);
make(5, 11, 11, 'Actor1');

require('../Docs-Doodads.js');
const L = DocsDoodads.EventLabels;

// 1. Parsing.
{
    assert.deepStrictEqual(L.parse('<docs label: Blacksmith>'), { label: 'Blacksmith', icon: 0, range: 0 });
    assert.deepStrictEqual(L.parse('x <Docs Icon:87> y <docs label range: 4.5>'), { label: '', icon: 87, range: 4.5 });
    assert.deepStrictEqual(L.parse('<docs label range: 4>'), null, 'a range alone is no label');
    assert.strictEqual(L.parse('<docs icon: 0>'), null, 'icon 0 is none');
    assert.strictEqual(L.parse(''), null);
    assert.strictEqual(L.of(smith).label, 'Blacksmith');
    assert.deepStrictEqual(L.of(sign), { label: '', icon: 87, range: 3 }, 'from page comments');
    assert.strictEqual(L.of($gameMap.event(4)).label, 'To Town', 'any case and spacing');
    assert.strictEqual(L.of($gameMap.event(5)), null);
    assert.ok(L.inRange(0, 50, 50) && L.inRange(3, 3, 0) && !L.inRange(3, 3, 1));
    console.log('PASS parsing and range');
}

// 2. Writing the note (the event Details fields).
{
    assert.strictEqual(L.writeNote('', 'Smith', 0), '<docs label: Smith>');
    assert.strictEqual(L.writeNote('hello <docs label: Old> <docs label range: 4>', 'New', 12), 'hello <docs label range: 4> <docs label: New> <docs icon: 12>');
    assert.strictEqual(L.writeNote('hello <docs label: Old> <docs icon: 3>', '', 0), 'hello', 'cleared');
    assert.strictEqual(L.writeNote('', 'a<b>c', 0), '<docs label: abc>', 'no angle brackets in a label');
    console.log('PASS writing the note');
}

// 3. On the map: the smith and the exit always; the sign only in range; never the blocker or a plain event.
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
const labelled = () => new Set(Array.from(ss._docsLabels ? ss._docsLabels.keys() : []).map(ev => ev.eventId()));
{
    E.frames(ss, 3);
    assert.deepStrictEqual(labelled(), new Set([1, 4]), 'the sign is 7.8 tiles away (range 3); the blocker is invisible and solid');
    const s = ss._docsLabels.get(smith);
    assert.ok(s.visible && s.bitmap, 'drawn');
    assert.strictEqual(s.x, Math.round(smith.screenX()));
    assert.ok(s.y < smith.screenY(), 'over its head');
    assert.ok(s.opacity > 0 && s.opacity < 255, 'fading in');
    E.frames(ss, 20);
    assert.strictEqual(s.opacity, 255);
    $gamePlayer.locate(14, 5);
    E.frames(ss, 1);
    assert.ok(labelled().has(2), 'in range of the sign');
    $gamePlayer.locate(10, 10);
    E.frames(ss, 30);
    assert.ok(!labelled().has(2), 'out of range: faded and gone');
    console.log('PASS shown in range, over the head, fading');
}

// 4. A message hides them; erasing an event takes its label away.
{
    $gameMessage.isBusy = () => true;
    E.frames(ss, 30);
    assert.strictEqual(labelled().size, 0, 'a message hides them');
    $gameMessage.isBusy = () => false;
    E.frames(ss, 2);
    assert.ok(labelled().has(1));
    smith._erased = true;
    E.frames(ss, 30);
    assert.ok(!labelled().has(1), 'erased');
    smith._erased = false;
    console.log('PASS hidden by a message; gone when erased');
}

// 5. The Show / Hide Event Labels command and World > Event Labels.
{
    $gameSystem._docsLabelsHidden = true;
    E.frames(ss, 1);
    assert.strictEqual(labelled().size, 0, 'hidden by the command');
    $gameSystem._docsLabelsHidden = undefined;
    DocsDoodads.World.settings().labels = { enabled: false };
    E.frames(ss, 1);
    assert.strictEqual(labelled().size, 0, 'off in World');
    DocsDoodads.World.settings().labels = { enabled: true, fade: false, size: 20, colour: '#ffd700' };
    E.frames(ss, 1);
    assert.strictEqual(ss._docsLabels.get(smith).opacity, 255, 'no fade');
    console.log('PASS the command and World settings');
}

// 6. In 3D the label goes where the event stands in the view.
{
    DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 24 } });
    E.frames(ss, 5);
    assert.ok(ss._docs3d, 'in 3D');
    const s = ss._docsLabels.get(smith);
    assert.ok(s && s.visible, 'shown in 3D');
    const at = DocsDoodads.Perspective.flatToScreen(smith.screenX(), smith.screenY());
    assert.strictEqual(s.x, Math.round(at.x), 'placed through the camera');
    assert.ok(s.y < at.y);
    DocsDoodads.Lighting.setMapSettings(1, {});
    E.frames(ss, 3);
    console.log('PASS placed in the 3D view');
}

// 7. A map with no label tags makes nothing.
{
    const plain = new Spriteset_Map();
    const saved = $dataMap;
    global.$dataMap = Object.assign({}, saved, { events: [null, { id: 1, note: '', pages: [{ list: [] }] }] });
    E.frames(plain, 5);
    assert.ok(!plain._docsLabels && !plain._docsLabelLayer, 'no sprites, no layer');
    assert.strictEqual(L.mapHas($dataMap), false);
    global.$dataMap = saved;
    assert.strictEqual(L.mapHas($dataMap), true);
    console.log('PASS a map without tags makes nothing');
}

// 8. The event Details fields: one undo step, the running event follows.
{
    const ws = DocsDoodads.Workspace;
    const staged = { id: 5, note: 'just a note', pages: [{ list: [] }] };
    const ge = $gameMap.event(5);
    ws.selectedEvent = { gameEvent: ge, stagedEvent: staged };
    ws.selectedStagedEvent = () => staged;
    ws.updateUndoButtons = () => {};
    assert.strictEqual(ws.editEventLabel('Baker', 4), true);
    assert.strictEqual(staged.note, 'just a note <docs label: Baker> <docs icon: 4>');
    assert.strictEqual(ge.event().note, staged.note, 'the running event follows');
    assert.strictEqual(DocsDoodads.Persistence.dirtyMap, true);
    E.frames(ss, 2);
    assert.ok(labelled().has(5), 'shown at once');
    assert.strictEqual(ws.editEventLabel('Baker', 4), false, 'no change, no step');
    DocsDoodads.Undo.undo();
    assert.strictEqual(staged.note, 'just a note');
    assert.strictEqual(ge.event().note, 'just a note');
    E.frames(ss, 30);
    assert.ok(!labelled().has(5), 'undone');
    console.log('PASS the event Details fields');
}

console.log('\nAll event label tests passed.');
