// scratch/test_game_features_b7a.js
// Phase B7a (§12.1 of docs/CREATOR_IMPROVEMENTS_PLAN.md), game features for events: the clock in battles
// and menus and a battle's minutes (12.1.2), the calendar (12.1.3), states with a sound, an effect, a
// wait and going back (12.1.4), touch once, a cooldown and a prompt (12.1.5), explored-map rewards
// (12.1.7), playing a doodad's animation once with an end event (12.1.12), transitions when api.place and
// api.remove run, without rebuilding the map (12.1.13), and the API's wrappers for the commands (12.1.15).
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log('=== Testing Game Features for Events (B7a) ===');

E.install();
const TREE = 10;
E.setupWorld({ width: 30, height: 20, px: 10, py: 10, tiles: [[3, 3, 5, 7], [4, 3, 5, 7], [5, 3, 5, 7]], flags: { [TREE]: 0x10 } });
const chest = E.doodad(10, 8, { uid: 'chest', name: 'Chest', xFrame: 4, yFrame: 1, frameUpdate: 2, anim: { mode: 'still', frame: 0 },
    touch: { commonEventId: 3, trigger: 'action', once: true, prompt: 'Open' }, collision: { preset: 'full', shape: null }, frameW: 24, frameH: 48 });
const lever = E.doodad(14, 10, { uid: 'lever', name: 'Lever', touch: { commonEventId: 4, trigger: 'action', cooldown: 1 } });
const trap = E.doodad(20, 10, { uid: 'trap', name: 'Trap', states: { by: 'events', list: [{ name: 'Set' },
    { name: 'Sprung', sound: 'Damage1', vfx: 'explosion', revert: 1 }], fade: 10 } });
const rock = E.doodad(25, 15, { uid: 'rock', name: 'Rock' });
$dataDocsDoodads[1] = [chest, lever, trap, rock];
require('../Docs-Doodads.js');
const D = DocsDoodads, api = D.api;
const reserved = [];
$gameTemp.reserveCommonEvent = id => reserved.push(id);
$gameTemp.isCommonEventReserved = () => false;
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const command = (name, args, self) => PluginManager.callCommand(self || {}, 'Docs-Doodads', name, args);

// 1. The calendar: day 1 on a new game, weekdays, named dates, variables, the command and the API.
D.World.set('time', { source: 'clock', startHour: 23, minutesPerSecond: 60, dayVariableId: 11, weekdayVariableId: 12,
    weekdays: ['Sun', 'Moon', 'Fire'], dates: [{ day: 2, name: 'Fair' }, { day: 1, name: 'Market', every: 3 }] });
E.frames(ss, 1);
assert.strictEqual(api.day(), 1);
assert.strictEqual(api.weekdayName(), 'Sun');
assert.strictEqual(api.dateName(), 'Market', 'day 1 starts the every-3-days market');
E.frames(ss, 60);
assert.strictEqual(api.day(), 2, 'midnight passed');
assert.strictEqual(api.weekdayName(), 'Moon');
assert.strictEqual(api.dateName(), 'Fair');
assert.strictEqual($gameVariables.value(11), 2, 'the day variable follows');
assert.strictEqual($gameVariables.value(12), 2, 'the weekday variable (1-based)');
assert.strictEqual(D.Calendar.dateName(4), 'Market', 'every 3 days');
assert.strictEqual(D.Calendar.weekdayName(4), 'Sun', 'the week goes round');
command('calendar', { action: 'setDay', value: 7 });
assert.strictEqual(api.day(), 7);
command('calendar', { action: 'addDays', value: 3 });
assert.strictEqual(api.day(), 10);
command('calendar', { action: 'storeWeekday', variableId: 13 });
assert.strictEqual($gameVariables.value(13), 1, 'day 10 is a Sun');
command('calendar', { action: 'storeDate', variableId: 14 });
assert.strictEqual($gameVariables.value(14), 'Market', 'day 10 is a market day');
console.log('✓ Calendar: days, weekdays, named dates, variables, command and API.');

// 2. The clock in battles and menus, and the minutes a battle takes.
const clock = D.Atmosphere.clock();
const at = () => clock.minutes;
let before = at();
assert.strictEqual(D.Calendar.tickOffMap('battle'), false, 'stopped in battle unless asked');
assert.strictEqual(at(), before);
D.World.set('time.inBattle', true);
D.World.set('time.inMenus', true);
assert.strictEqual(D.Calendar.tickOffMap('battle'), true);
assert.ok(at() !== before, 'runs in battle');
before = at();
const menu = new Scene_MenuBase();
menu.update();
assert.ok(at() !== before, 'and in a menu (Scene_MenuBase.update)');
D.World.set('time.afterBattle', 30);
before = clock.minutes + clock.day * 1440;
D.Calendar.afterBattle();
assert.strictEqual(Math.round(clock.minutes + clock.day * 1440 - before), 30, 'a battle took 30 minutes');
D.World.set('time', { source: 'off' });
console.log('✓ Clock: in battles and menus when asked; a battle takes its minutes.');

// 3. States: a sound and an effect going in, a wait for the crossfade, back after a second.
const played = [];
const realPlay = AudioManager.playSe;
AudioManager.playSe = function(se) { played.push(se.name); return realPlay.call(this, se); };
const effects = D.Vfx._playing.length;
let waited = 0;
command('setDoodadState', { name: 'Trap', state: 'Sprung', wait: 'true' }, { wait: n => { waited = n; } });
assert.strictEqual(waited, 11, 'the event waits for the crossfade');
E.frames(ss, 2);
assert.deepStrictEqual(played, ['Damage1'], 'its sound');
assert.strictEqual(D.Vfx._playing.length, effects + 1, 'its effect');
assert.strictEqual(D.WorldState.state('Trap'), 'Sprung');
E.frames(ss, 62);
assert.strictEqual(D.WorldState.state('Trap'), 'Set', 'back after a second');
assert.strictEqual(played.length, 1, 'going back makes no sound of its own');
D.WorldState.setState('Trap', 'Sprung');
E.frames(ss, 2);
assert.strictEqual(Object.keys($gameSystem._docsStateTimers).length, 1, 'the timer is kept in the save');
D.WorldState.setState('Trap', 'Set');
E.frames(ss, 2);
assert.strictEqual(Object.keys($gameSystem._docsStateTimers).length, 0, 'set back by hand: no timer');
AudioManager.playSe = realPlay;
console.log('✓ States: sound, effect, wait, back after some seconds.');

// 4. Touch: once (the save remembers), a cooldown, and the prompt when faced.
$gamePlayer.locate(10, 9);
$gamePlayer.setDirection(8);
E.frames(ss, 1);
const prompt = ss._docsPrompt;
assert.ok(prompt && prompt.visible && prompt._docsText === 'Open', 'the prompt shows when facing the chest');
assert.ok(prompt.y < ss._docsDoodadSprites.find(s => s._data === chest).y, 'over it');
assert.strictEqual(api.touch('Chest'), true);
assert.deepStrictEqual(reserved, [3]);
assert.strictEqual(api.touch('Chest'), false, 'only once');
assert.strictEqual(D.Touch.isTouchable(chest), false);
E.frames(ss, 1);
assert.strictEqual(prompt.visible, false, 'no prompt once used');
assert.ok($gameSystem._docsWorldState.touched['1/name:chest'], 'kept in the save');
assert.strictEqual(api.resetTouch('Chest'), 1);
assert.strictEqual(D.Touch.isTouchable(chest), true, 'reset');
assert.strictEqual(api.touch('Lever'), true);
assert.strictEqual(api.touch('Lever'), false, 'cooling down');
E.frames(ss, 61);
assert.strictEqual(api.touch('Lever'), true, 'ready again after a second');
$gamePlayer.setDirection(2);
E.frames(ss, 1);
assert.strictEqual(prompt.visible, false, 'facing away: no prompt');
console.log('✓ Touch: once, cooldown, prompt when faced.');

// 5. The explored map: a region revealed (a map item), how much is explored into a variable.
D.World.set('minimap', { flat: true, fog: true, radius: 0, size: 140 });
command('exploredMap', { action: 'forget' });
command('exploredMap', { action: 'region', region: 7 });
const m = D.Explored.entry(1, 30, 20);
assert.ok(D.Explored.isExplored(m, 3, 3) && D.Explored.isExplored(m, 5, 3), 'the region is revealed');
assert.ok(!D.Explored.isExplored(m, 6, 3), 'and nothing else');
command('exploredMap', { action: 'store', variableId: 15 });
assert.strictEqual($gameVariables.value(15), Math.floor(3 / 600 * 100));
assert.strictEqual(api.reveal('all'), true);
assert.strictEqual(api.explored(), 1, 'all of it');
D.World.set('minimap', undefined);
console.log('✓ Explored map: reveal a region, how much into a variable.');

// 6. Play an animation once, now; "animationEnd" at its end; hold, or back to its own.
const ends = [];
const off = api.on('animationEnd', e => ends.push(e.name));
const chestSprite = () => ss._docsDoodadSprites.find(s => s._data === chest);
const frameX = () => chestSprite().texture.frame.x;
E.frames(ss, 1);
assert.strictEqual(frameX(), 0);
const self = { setWaitMode(m) { this._waitMode = m; } };
command('playDoodadAnimation', { name: 'Chest', wait: 'true' }, self);
assert.strictEqual(self._waitMode, 'docsAnim', 'the event waits');
E.frames(ss, 3);
assert.ok(frameX() > 0, 'it plays');
E.frames(ss, 6);
assert.strictEqual(frameX(), 3 * 24, 'to the last frame');
assert.deepStrictEqual(ends, ['Chest'], 'animationEnd once');
assert.strictEqual(Game_Interpreter.prototype.updateWaitMode.call(self), false, 'the event goes on');
E.frames(ss, 5);
assert.strictEqual(frameX(), 3 * 24, 'held');
api.playAnimation('Chest', { from: 1, to: 2, hold: false });
E.frames(ss, 8);
assert.strictEqual(frameX(), 0, 'not held: back to its own frame');
off();
console.log('✓ Play animation: once, now, with animationEnd, hold or not.');

// 7. Transitions when the API places and removes, without rebuilding the other sprites.
const others = ss._docsDoodadSprites.slice();
const placed = api.place({ art: 'img/doodads/Tree.png', x: 12, y: 12, name: 'Sapling', transition: 'fade', frames: 10, frameW: 48, frameH: 48 });
const sap = () => ss._docsDoodadSprites.find(s => s._data === placed);
E.frames(ss, 1);
assert.ok(sap().alpha < 0.3, 'it comes in faded');
E.frames(ss, 12);
assert.ok(sap().alpha > 0.95, 'and is there after its frames');
assert.ok(others.every(s => ss._docsDoodadSprites.includes(s)), 'the other sprites were kept');
assert.strictEqual(api.remove('Sapling', { transition: 'fade', frames: 10 }), 1);
E.frames(ss, 3);
assert.ok(sap() && sap().alpha < 1, 'it fades out');
assert.ok($dataDocsDoodads[1].includes(placed), 'still in the map while it goes');
E.frames(ss, 12);
assert.ok(!sap() && !$dataDocsDoodads[1].includes(placed), 'then gone');
assert.ok(others.every(s => ss._docsDoodadSprites.includes(s)), 'nothing else was rebuilt');
assert.strictEqual(api.remove('Rock'), 1);
assert.ok(!ss._docsDoodadSprites.some(s => s._data === rock), 'without a transition it goes at once');
assert.ok(others.filter(s => s._data !== rock).every(s => ss._docsDoodadSprites.includes(s)), 'still nothing rebuilt');
console.log('✓ API place and remove: transitions in and out, no rebuild.');

// 8. The API's wrappers for the plugin commands.
assert.strictEqual(api.feature('reflections', false), true);
assert.strictEqual(D.Atmosphere.featureOn('reflections'), false);
api.feature('reflections', true);
assert.strictEqual(D.Atmosphere.featureOn('reflections'), true);
api.flashlight(true);
assert.strictEqual($gameSystem._docsFlashlight, true);
api.flashlight(null);
assert.strictEqual($gameSystem._docsFlashlight, undefined);
api.setWind(0.8, 0, 'left');
assert.strictEqual($gameSystem._docsWind.to, 0.8);
api.traversal('jump', true);
assert.strictEqual(D.Traversal.abilityOn ? D.Traversal.abilityOn('jump') !== false : true, true);
api.traversal('jump', null);
const effect = api.playVfx('explosion', { x: 3, y: 4 });
assert.ok(effect && effect.x === 3.5 * 48 && effect.y === 4.5 * 48, 'an effect at a tile');
assert.ok(api.playVfx('explosion', 'player').follow === $gamePlayer, 'or following the player');
assert.strictEqual(typeof api.traversalAction('land'), 'boolean');
console.log('✓ API wrappers: feature, flashlight, wind, traversal, effects.');

console.log('\nAll game features (B7a) checks passed.');
