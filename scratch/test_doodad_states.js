// scratch/test_doodad_states.js
// Doodad states (art, light and collision per state; switched by a switch, a variable or events, with a
// crossfade), the world state kept in saves (states and lights set by events, read back by scripts and
// plugin commands), touchable doodads (common events and next state), and their Details sections.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Doodad States, World State and Touch ===');

E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
const reserved = [];
$gameTemp.reserveCommonEvent = id => reserved.push(id);
$gameTemp.isCommonEventReserved = () => false;
require('../Docs-Doodads.js');
const D = DocsDoodads, S = D.States, W = D.WorldState, T = D.Touch, ws = D.Workspace;

const door = () => E.doodad(5, 3, {
    name: 'Front Door', uid: 'dd_door',
    collision: { preset: 'custom', shape: { x: 0, y: 0.5, w: 1, h: 0.5 } }, frameW: 48, frameH: 48,
    light: { enabled: true, radius: 100, intensity: 1 },
    states: { by: 'events', fade: 4, list: [
        { name: 'Closed', path: '', light: true, collision: true },
        { name: 'Open', path: 'img/doodads/DoorOpen.png', w: 48, h: 48, light: false, collision: false },
        { name: 'Broken', path: 'img/doodads/DoorBroken.png', w: 96, h: 48, light: false, collision: true }
    ] }
});

(async () => {
    // 1. Which state a doodad is in.
    const d = door();
    $dataDocsDoodads[1] = [d];
    assert.ok(S.has(d) && !S.has(E.doodad(1, 1)) && !S.has({ states: { list: [{ name: 'only' }] } }));
    assert.deepStrictEqual([S.find(d, 'open'), S.find(d, ' BROKEN '), S.find(d, 2), S.find(d, '1'), S.find(d, 'nope'), S.find(d, 7), S.find(d, '')], [1, 2, 2, 1, -1, -1, -1]);
    assert.strictEqual(S.index(d), 0, 'events only: as placed until an event says otherwise');
    assert.strictEqual(S.name(d), 'Closed');
    assert.strictEqual(S.art(d), null, 'state 0 shows the doodad\'s own art');
    assert.ok(S.lightAllowed(d) && S.blocks(d));
    d.states.by = 'switch'; d.states.switchId = 4;
    assert.strictEqual(S.index(d), 0);
    $gameSwitches.setValue(4, true);
    assert.strictEqual(S.index(d), 1, 'switch on: the second state');
    assert.deepStrictEqual(S.art(d), { path: 'img/doodads/DoorOpen.png', w: 48, h: 48 });
    assert.ok(!S.lightAllowed(d) && !S.blocks(d));
    d.states.by = 'variable'; d.states.variableId = 6;
    $gameVariables.setValue(6, 2);
    assert.strictEqual(S.index(d), 2);
    $gameVariables.setValue(6, 9);
    assert.strictEqual(S.index(d), 2, 'a value past the end shows the last state');
    $gameVariables.setValue(6, -3);
    assert.strictEqual(S.index(d), 0);
    d.states.by = 'events';
    assert.strictEqual(S.fadeFrames(d), 4);
    assert.strictEqual(S.fadeFrames({}), 20, 'the default crossfade');
    assert.strictEqual(S.fadeFrames({ states: { fade: 9999 } }), 240);
    console.log('✓ states: by events, switch and variable; art, light and collision per state');

    // 2. World state: what events set is kept in the save ($gameSystem) and wins over the rule.
    assert.strictEqual($gameSystem._docsWorldState, undefined, 'reading never adds the store to a save');
    assert.strictEqual(W.state('Front Door'), 'Closed');
    assert.ok(W.setState('front door', 'Open'));
    assert.ok($gameSystem._docsWorldState.states['1/name:front door'] === 'Open');
    assert.strictEqual(S.index(d), 1, 'by name, any case');
    assert.ok(W.is('Front Door', 'open') && !W.is('Front Door', 'Closed'));
    d.states.by = 'switch';
    $gameSwitches.setValue(4, false);
    assert.strictEqual(S.index(d), 1, 'a saved state wins over the switch');
    W.setState('Front Door', 'next');
    assert.strictEqual(W.state('Front Door'), 'Broken');
    W.setState('Front Door', 'next');
    assert.strictEqual(W.state('Front Door'), 'Closed', 'next wraps round');
    W.setState('Front Door', '2');
    assert.strictEqual(S.index(d), 2, 'a number');
    W.setState('Front Door', '');
    assert.strictEqual(S.index(d), 0, 'blank: back to following the switch');
    d.states.by = 'events';
    assert.ok(!W.setState('', 'Open') && !W.setState('Nobody', 'next'), 'next needs the doodad on this map');
    W.setState('Gate', 'Open', 7);
    assert.strictEqual(W.state('Gate', 7), 'Open', 'another map: what was saved');
    assert.strictEqual(W.state('Gate'), '', 'not on this map');
    assert.strictEqual(W.state('Nobody'), '');
    // Lights.
    assert.strictEqual(W.light('Front Door'), true);
    W.setState('Front Door', 'Open');
    assert.strictEqual(W.light('Front Door'), false, 'the open door\'s state puts its light out');
    W.setLight('Front Door', true);
    assert.strictEqual(W.light('Front Door'), true, 'an event can turn it back on');
    W.setLight('Front Door', null);
    assert.strictEqual(W.light('Front Door'), false, 'and back to its own setting');
    W.setLight('Street Lamp', false, 7);
    assert.strictEqual(W.light('Street Lamp', 7), false);
    assert.strictEqual(W.light('Street Lamp'), null, 'no such doodad here');
    // Unnamed doodads go by their id.
    const pot = E.doodad(2, 2, { uid: 'dd_pot', states: { list: [{ name: 'Whole' }, { name: 'Broken' }] } });
    assert.strictEqual(W.idOf(pot), 'uid:dd_pot');
    W.setState(pot, 1);
    assert.strictEqual(S.name(pot), 'Broken');
    W.clearMap(1);
    assert.strictEqual(S.name(pot), 'Whole');
    assert.strictEqual(W.state('Gate', 7), 'Open', 'clearing one map leaves the others');
    console.log('✓ world state: set by name or id, next, clear, other maps, lights');

    // 3. Lights and collision follow the state.
    const L = D.Lighting;
    assert.strictEqual(L.collect([d]).length, 1);
    W.setState('Front Door', 'Open');
    assert.strictEqual(L.collect([d]).length, 0, 'editor previews drop a light that is out');
    W.setState('Front Door', '');
    const ctx = { darkness: 1, threshold: 0.3, step: 0.25 };
    L._lampLevels = new WeakMap();
    assert.strictEqual(L.collect([d], { x: 0, y: 0 }, ctx)[0].intensity, 1);
    W.setLight('Front Door', false);
    const levels = [1, 2, 3, 4].map(() => (L.collect([d], { x: 0, y: 0 }, ctx)[0] || { intensity: 0 }).intensity);
    assert.deepStrictEqual(levels, [0.75, 0.5, 0.25, 0], 'in game the light fades out');
    W.setLight('Front Door', null);
    const blocked = () => D.Collision.blocksTile(5, 3);
    assert.ok(blocked(), 'closed: the door blocks its tile');
    W.setState('Front Door', 'Open');
    assert.ok(!blocked(), 'open: walk through');
    W.setState('Front Door', 'Broken');
    assert.ok(blocked(), 'broken keeps its collision');
    W.setState('Front Door', '');
    console.log('✓ lights fade out and collision drops with the state');

    // 4. The sprite: state art and a crossfade.
    const ss = new Spriteset_Map();
    ss.addDocsDoodads();
    const sprite = ss._docsDoodadSprites[0];
    assert.ok(sprite && sprite._data === d);
    assert.strictEqual(sprite._loadedPath, 'img/doodads/Tree.png');
    sprite._bmp = new Bitmap(48, 48);
    sprite.texture = new PIXI.Texture(sprite._bmp._baseTexture, new PIXI.Rectangle(0, 0, 48, 48));
    const step = () => { Graphics.frameCount++; sprite.update(); };
    step();
    W.setState('Front Door', 'Open');
    step();
    assert.strictEqual(sprite._loadedPath, 'img/doodads/DoorOpen.png', 'the open state\'s art loads');
    assert.ok(sprite._stateFade && sprite.children.includes(sprite._stateFade.sprite), 'the old picture fades over it');
    const fadeSprite = sprite._stateFade.sprite;
    step();
    assert.ok(fadeSprite.alpha < 1 && fadeSprite.alpha > 0);
    step(); step(); step();
    assert.ok(!sprite._stateFade && !sprite.children.includes(fadeSprite), 'gone after the crossfade');
    // Frames of a state's own art are split from its whole picture.
    sprite._stateArt = { path: 'x', w: 96, h: 48 };
    d.xFrame = 2;
    assert.deepStrictEqual(sprite.frameBase(new Bitmap(96, 48)), { x: 0, y: 0, w: 48, h: 48 });
    d.xFrame = 1;
    W.setLight('Front Door', true);
    step();
    assert.ok(!sprite._stateFade, 'a light change alone needs no crossfade');
    d.states.fade = 0;
    W.setState('Front Door', 'Closed');
    step();
    assert.ok(!sprite._stateFade, 'crossfade 0 switches at once');
    assert.strictEqual(sprite._loadedPath, 'img/doodads/Tree.png');
    d.states.fade = 4;
    W.clearMap(1);
    console.log('✓ the sprite loads each state\'s art and crossfades');

    // 5. Touchable doodads.
    assert.ok(!T.isTouchable(d));
    d.touch = { commonEventId: 3 };
    assert.ok(T.isTouchable(d));
    assert.deepStrictEqual(T.tilesOf(d, 48, 48), [{ x: 5, y: 3 }], 'its collision tiles');
    assert.deepStrictEqual(T.tilesOf(E.doodad(2, 2), 48, 48), [{ x: 2, y: 2 }], 'or the tile it stands on');
    assert.ok(!T.isTouchable({ touch: { nextState: true } }), 'next state needs states');
    // The player at (5, 4) faces up at the door.
    $gamePlayer.locate(5, 4);
    $gamePlayer.setDirection(8);
    const press = () => { Graphics.frameCount++; $gamePlayer.checkEventTriggerHere([0]); $gamePlayer.checkEventTriggerThere([0, 1, 2]); };
    press();
    assert.deepStrictEqual(reserved, [3], 'Action facing it runs its common event');
    assert.strictEqual(W.touched().name, 'Front Door');
    assert.strictEqual(W.touched().state, 'Closed');
    $gamePlayer.setDirection(2);
    press();
    assert.deepStrictEqual(reserved, [3], 'facing away: nothing');
    $gamePlayer.setDirection(8);
    d.touch = { commonEventId: 0, nextState: true };
    press();
    assert.strictEqual(W.state('Front Door'), 'Open', 'a door that opens on Action');
    press();
    assert.strictEqual(W.state('Front Door'), 'Broken', 'once per press');
    W.clearMap(1);
    // Walking into it.
    d.touch = { commonEventId: 5, trigger: 'action' };
    Graphics.frameCount++;
    $gamePlayer.checkEventTriggerTouch(5, 3);
    assert.deepStrictEqual(reserved, [3], 'an Action doodad ignores bumps');
    d.touch.trigger = 'touch';
    Graphics.frameCount++;
    $gamePlayer.checkEventTriggerTouch(5, 3);
    assert.deepStrictEqual(reserved, [3, 5], 'a Touch doodad runs when walked into');
    Graphics.frameCount++;
    $gamePlayer.checkEventTriggerTouch(5, 3);
    assert.deepStrictEqual(reserved, [3, 5], 'pushing on against it doesn\'t run it again');
    $gamePlayer.locate(4, 3);
    Graphics.frameCount++;
    $gamePlayer.checkEventTriggerTouch(5, 3);
    assert.deepStrictEqual(reserved, [3, 5, 5], 'from somewhere else it does');
    // Not while an event runs, nor when hidden.
    $gameMap.isEventRunning = () => true;
    Graphics.frameCount++;
    assert.ok(!T.tryAt(5, 3, 'action'));
    $gameMap.isEventRunning = () => false;
    d.condition = 'false';
    assert.ok(!D.Appearance.isVisible(d, {}));
    Graphics.frameCount++;
    assert.ok(!T.tryAt(5, 3, 'action'), 'hidden doodads do not answer');
    d.condition = '';
    delete d.touch;
    console.log('✓ touch: Action and walking into it; common event and next state; once per press');

    // 6. Plugin commands.
    const call = (name, args) => PluginManager.callCommand({}, 'Docs-Doodads', name, args);
    call('setDoodadState', { name: 'Front Door', state: 'Broken', mapId: '0' });
    assert.strictEqual(W.state('Front Door'), 'Broken');
    call('storeDoodadState', { name: 'Front Door', variableId: '12' });
    assert.strictEqual($gameVariables.value(12), 2);
    call('storeDoodadState', { name: 'Nobody', variableId: '12' });
    assert.strictEqual($gameVariables.value(12), -1);
    call('setDoodadLight', { name: 'Front Door', light: 'on', mapId: '0' });
    assert.strictEqual(W.light('Front Door'), true);
    call('setDoodadLight', { name: 'Front Door', light: 'default', mapId: '0' });
    assert.strictEqual(W.light('Front Door'), false);
    call('setDoodadState', { name: 'Front Door', state: '', mapId: '0' });
    assert.strictEqual(W.state('Front Door'), 'Closed');
    console.log('✓ plugin commands: set state, set light, store state');

    // 7. Details: Name, Touch and the States list.
    global.$dataCommonEvents = [null, { id: 1, name: 'Open Door' }, { id: 2, name: '' }];
    assert.deepStrictEqual(ws.commonEventOptions().map(o => o.label), ['None', '0001: Open Door', '0002: (unnamed)']);
    const sections = ws.effectSections();
    const statesSec = sections.find(s => s.title === 'States'), touchSec = sections.find(s => s.title === 'Touch');
    assert.ok(statesSec && touchSec && typeof statesSec.html === 'function');
    ws.refreshSpriteset = () => {};
    ws.refreshInspector = () => {};
    const toasts = [];
    ws.showToast = m => toasts.push(m);
    const lamp = E.doodad(8, 8, { uid: 'dd_lamp' });
    ws.applyDoodadProperty(lamp, 'name', '  Street Lamp ');
    assert.strictEqual(lamp.name, 'Street Lamp');
    ws.applyDoodadProperty(lamp, 'name', ' ');
    assert.ok(!('name' in lamp), 'a blank name is removed');
    ws.applyDoodadProperty(lamp, 'touch.commonEventId', 1);
    assert.deepStrictEqual(lamp.touch, { commonEventId: 1, trigger: 'action', nextState: false, once: false, cooldown: 0, prompt: '' });
    assert.strictEqual(ws.getDoodadProperty(lamp, 'touch.trigger'), 'action');
    ws.applyDoodadProperty(lamp, 'touch.commonEventId', 0);
    assert.ok(!('touch' in lamp), 'nothing to run: not touchable');
    assert.ok(/Add State/.test(ws.statesListHtml([lamp])) && /State 0 is the doodad as placed/.test(ws.statesListHtml([lamp])));
    assert.ok(/Pick one doodad/.test(ws.statesListHtml([lamp, d])));
    const undoDepth = D.Undo.undoStack.length;
    ws.addState(lamp);
    assert.deepStrictEqual(S.list(lamp).map(s => s.name), ['As placed', 'State 1'], 'the first Add makes the placed look state 0');
    assert.strictEqual(D.Undo.undoStack.length, undoDepth + 1, 'one undo step');
    ws.addState(lamp);
    assert.strictEqual(S.list(lamp).length, 3);
    ws.setStateField(lamp, 1, 'name', ' Lit ');
    ws.setStateField(lamp, 1, 'light', false);
    assert.deepStrictEqual(S.list(lamp)[1], { name: 'Lit', path: '', light: false, collision: true });
    ws.selectedAsset = null;
    assert.strictEqual(ws.pickedStateArt(), null);
    assert.ok(/Pick a picture/.test(toasts.pop()));
    ws.selectedAsset = { path: 'img/doodads/LampOff.png', width: 32, height: 64, category: 'Props' };
    ws.setStateField(lamp, 2, 'art', ws.pickedStateArt());
    assert.deepStrictEqual(S.list(lamp)[2], { name: 'State 2', path: 'img/doodads/LampOff.png', light: true, collision: true, w: 32, h: 64 });
    let html = ws.statesListHtml([lamp]);
    assert.ok(/Art: LampOff\.png/.test(html) && /Own Art/.test(html) && /Give it a Name/.test(html));
    lamp.name = "Bob's Lamp";
    assert.ok(/WorldState\.is/.test(ws.statesListHtml([lamp])));
    ws.setStateField(lamp, 2, 'art', null);
    assert.ok(!('path' in S.list(lamp)[2]));
    D.Workspace.mounted = true;
    ws.previewState(lamp, 2);
    assert.strictEqual(S.index(lamp), 2, 'Preview shows the state while editing');
    assert.ok(/Stop Preview/.test(ws.statesListHtml([lamp])));
    ws.previewState(lamp, 2);
    assert.strictEqual(S.index(lamp), 0, 'Preview again stops it');
    ws.previewState(lamp, 1);
    ws.removeState(lamp, 1);
    assert.strictEqual(S.previewOf(lamp), -1, 'removing the previewed state stops the preview');
    ws.removeState(lamp, 0);
    assert.strictEqual(S.list(lamp).length, 2, 'state 0 stays');
    ws.removeState(lamp, 1);
    assert.ok(!('states' in lamp), 'one state left: no states');
    D.Workspace.mounted = false;
    D.Undo.undo();
    assert.strictEqual(S.list(lamp).length, 2, 'undo brings the state back');
    // The list's buttons and fields.
    const els = {};
    const realGet = document.getElementById;
    document.getElementById = id => els[id] || null;
    ['dd-state-name-1', 'dd-state-light-1', 'dd-state-col-1', 'dd-state-preview-1', 'dd-state-del-1', 'dd-state-art-1', 'dd-state-own-1', 'dd-state-add', 'dd-state-stop']
        .forEach(id => { els[id] = { value: '', checked: false }; });
    ws.bindStatesList([lamp]);
    els['dd-state-name-1'].value = 'Dim';
    els['dd-state-name-1'].onchange();
    els['dd-state-col-1'].checked = false;
    els['dd-state-col-1'].onchange();
    assert.deepStrictEqual([S.list(lamp)[1].name, S.list(lamp)[1].collision], ['Dim', false]);
    els['dd-state-art-1'].onclick();
    assert.strictEqual(S.list(lamp)[1].path, 'img/doodads/LampOff.png');
    els['dd-state-add'].onclick();
    assert.strictEqual(S.list(lamp).length, 3);
    els['dd-state-del-1'].onclick();
    assert.strictEqual(S.list(lamp).length, 2);
    document.getElementById = realGet;
    console.log('✓ Details: Name, Touch, and the States list (add, rename, art, preview, remove, undo)');

    // 8. Problems: a state's missing art and a missing common event.
    const fs = D.FS.existsSync;
    D.FS.existsSync = p => p === 'img/doodads/Tree.png';
    lamp.touch = { commonEventId: 9 };
    lamp.states.list[1].path = 'img/doodads/Gone.png';
    const found = ws.doodadProblems(1, [lamp], { width: 20, height: 15 }, new Map());
    const art = found.find(p => p.kind === 'missingArt'), ev = found.find(p => p.kind === 'missingEvent');
    assert.ok(art && /state "State 2": img\/doodads\/Gone\.png/.test(art.text), art && art.text);
    assert.ok(ev && /common event 9/.test(ev.text));
    art.fix.run();
    ev.fix.run();
    assert.ok(!S.list(lamp)[1].path && !lamp.touch, 'fixes: own art, and no longer touchable');
    D.FS.existsSync = fs;
    console.log('✓ Problems: missing state art and missing common events, with fixes');

    console.log('All doodad state tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
