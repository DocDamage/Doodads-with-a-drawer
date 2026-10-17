// scratch/test_atmosphere_time.js
// Project-wide world settings, the day/night clock, the sun it drives, and lamps that switch on after dark.
const assert = require('assert');

console.log("=== Testing Day/Night, Sun & Lamps ===");

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: (opt) => opt === "test" };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, displayX: () => 0, displayY: () => 0, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. World settings live beside the maps in the doodads file and fall back to defaults field by field.
const World = DocsDoodads.World;
let settings = World.settings();
assert.strictEqual(settings.time.source, 'off', "day/night is off until it is turned on");
assert.strictEqual(settings.characterShadows.enabled, false);
assert.ok(Array.isArray(settings.time.keyframes) && settings.time.keyframes.length >= 4);
World.set('time.source', 'clock');
World.set('time.startHour', 6);
assert.strictEqual($dataDocsDoodads.world.time.source, 'clock');
settings = World.settings();
assert.strictEqual(settings.time.startHour, 6);
assert.strictEqual(settings.time.minutesPerSecond, World.defaults.time.minutesPerSecond, "untouched fields keep their defaults");
assert.strictEqual(World.get('time.source'), 'clock');
assert.notStrictEqual(World.settings().time.keyframes, World.defaults.time.keyframes, "callers never get the shared defaults");
// The world block is not a map: map-wide loops skip it.
assert.strictEqual(Array.isArray($dataDocsDoodads.world), false);

// 2. Time of day: keyframes are interpolated, wrapping through midnight.
const Time = DocsDoodads.TimeOfDay;
assert.strictEqual(Time.format(13 * 60 + 5), '13:05');
assert.strictEqual(Time.parse('6:30'), 390);
assert.strictEqual(Time.parse('25:00'), 60, "times wrap round the day");
const keys = [
    { hour: 5, darkness: 0.6, color: '#000000' },
    { hour: 9, darkness: 0, color: '#ffffff' },
    { hour: 17, darkness: 0, color: '#ffffff' },
    { hour: 21, darkness: 0.6, color: '#000000' }
];
assert.strictEqual(Time.ambientAt(12 * 60, keys).darkness, 0, "midday is fully lit");
assert.ok(near(Time.ambientAt(19 * 60, keys).darkness, 0.3), "dusk is half way between its keyframes");
assert.strictEqual(Time.ambientAt(19 * 60, keys).color, '#808080');
assert.ok(near(Time.ambientAt(1 * 60, keys).darkness, 0.6), "the night between 21:00 and 05:00 wraps midnight");
assert.ok(near(Time.ambientAt(7 * 60, keys).darkness, 0.3));
assert.strictEqual(Time.ambientAt(600, []).darkness, 0, "no keyframes means no darkness");
assert.strictEqual(Time.ambientAt(600, [{ hour: 3, darkness: 0.4, color: '#000000' }]).darkness, 0.4);

// The clock: game minutes advance with real time, the day count rolls over, and pausing stops it.
const clock = Time.newClock(23 * 60 + 30);
Time.advance(clock, 60, 60); // 60 frames at 60 game minutes per second
assert.strictEqual(clock.minutes, 30);
assert.strictEqual(clock.day, 1);
clock.paused = true;
Time.advance(clock, 600, 60);
assert.strictEqual(clock.minutes, 30, "a paused clock stays put");

// Where the time comes from.
const vars = { 7: 14, 8: 45 };
const env = { variable: id => vars[id] || 0, clock: { minutes: 100, day: 0 } };
assert.strictEqual(Time.minutesNow({ time: { source: 'off' } }, env), null);
assert.strictEqual(Time.minutesNow({ time: { source: 'clock' } }, env), 100);
assert.strictEqual(Time.minutesNow({ time: { source: 'variable', variableId: 7, minuteVariableId: 8 } }, env), 14 * 60 + 45);
assert.strictEqual(Time.minutesNow({ time: { source: 'variable', variableId: 7, minuteVariableId: 0 } }, env), 14 * 60);
// The clock can write the hour and minute into variables so events can read the time.
const written = {};
Time.syncVariables({ time: { source: 'clock', variableId: 3, minuteVariableId: 4 } }, 9 * 60 + 15, (id, v) => { written[id] = v; });
assert.deepStrictEqual(written, { 3: 9, 4: 15 });

// Which maps follow the clock: 'auto' skips maps with their own darkness (caves, interiors).
assert.strictEqual(Time.appliesToMap(null), true);
assert.strictEqual(Time.appliesToMap({ ambient: { darkness: 0.7 } }), false);
assert.strictEqual(Time.appliesToMap({ ambient: { darkness: 0.7 }, dayNight: 'on' }), true);
assert.strictEqual(Time.appliesToMap({ dayNight: 'off' }), false);

// The ambient the map ends up with: plugin command > clock > map setting.
const Lighting = DocsDoodads.Lighting;
const world = { time: { source: 'clock', keyframes: keys } };
assert.ok(near(Lighting.resolveAmbient({ world, minutes: 19 * 60, mapSettings: null }).darkness, 0.3));
assert.strictEqual(Lighting.resolveAmbient({ world, minutes: 19 * 60, mapSettings: { ambient: { darkness: 0.8, color: '#221100' } } }).darkness, 0.8, "a cave keeps its own darkness");
assert.strictEqual(Lighting.resolveAmbient({ world, minutes: 19 * 60, override: { darkness: 0.1, color: '#000000' } }).darkness, 0.1);
assert.strictEqual(Lighting.resolveAmbient({ world: { time: { source: 'off' } }, minutes: null, mapSettings: { ambient: { darkness: 0.2 } } }).darkness, 0.2);

// 3. The sun: rises in the east (shadows point west), noon shadows point north and are shortest.
const Sun = DocsDoodads.Sun;
let sun = Sun.at(12 * 60);
assert.ok(near(sun.angle, 0) && near(sun.strength, 1));
assert.ok(near(Sun.at(9 * 60).angle, 315));
assert.ok(near(Sun.at(15 * 60).angle, 45));
assert.ok(Sun.at(7 * 60).lengthMul > Sun.at(12 * 60).lengthMul, "morning shadows are longer than noon shadows");
assert.ok(near(Sun.at(6 * 60).strength, 0) && near(Sun.at(18 * 60).strength, 0), "shadows fade out at the horizon, so the sun-to-moon swap never jumps");
assert.ok(Sun.at(0).strength > 0 && Sun.at(0).strength < 0.5, "moonlight casts faint shadows");

// The sun's source: the clock, a fixed angle, or a variable (degrees).
assert.deepStrictEqual(Sun.current({ sun: { source: 'fixed', angle: 120 } }, null, () => 0), { angle: 120, lengthMul: 1, strength: 1 });
assert.strictEqual(Sun.current({ sun: { source: 'variable', variableId: 9, angle: 0 } }, null, id => (id === 9 ? 200 : 0)).angle, 200);
assert.ok(near(Sun.current({ sun: { source: 'time', angle: 30 } }, 9 * 60, () => 0).angle, 315));
assert.strictEqual(Sun.current({ sun: { source: 'time', angle: 30 } }, null, () => 0).angle, 30, "with the clock off the fixed angle is used");

// A shadow lies on the ground pointing away from the sun: rotation is the angle, length scales it.
const t = Sun.transform({ angle: 90, lengthMul: 2, strength: 0.5 }, { opacity: 0.4, length: 0.5, offsetX: 3, offsetY: -2 });
assert.ok(near(t.rotation, Math.PI / 2));
assert.ok(near(t.scaleY, 1));
assert.ok(near(t.alpha, 0.2));
assert.deepStrictEqual([t.offsetX, t.offsetY], [3, -2]);
assert.ok(Sun.transform({ angle: 0, lengthMul: 9, strength: 1 }, { opacity: 1, length: 1 }).scaleY <= 2, "very long shadows are capped");

// 4. Lamps: "after dark" lights fade in once the ambient darkness passes the threshold.
assert.strictEqual(Lighting.lampTarget({ when: 'always' }, 0, 0.3), 1);
assert.strictEqual(Lighting.lampTarget({ when: 'dark' }, 0.1, 0.3), 0);
assert.strictEqual(Lighting.lampTarget({ when: 'dark' }, 0.4, 0.3), 1);
const lamp = Object.assign(DocsDoodads.standardStruct(), { x: 100, y: 100, light: { enabled: true, when: 'dark', intensity: 1 } });
let lights = Lighting.collect([lamp], { x: 0, y: 0 }, { darkness: 0, threshold: 0.3 });
assert.strictEqual(lights.length, 0, "an unlit lamp adds nothing");
lights = Lighting.collect([lamp], { x: 0, y: 0 }, { darkness: 0.8, threshold: 0.3, step: 0.25 });
assert.ok(near(lights[0].intensity, 0.25), "lamps fade in rather than popping on");
for (let i = 0; i < 5; i++) lights = Lighting.collect([lamp], { x: 0, y: 0 }, { darkness: 0.8, threshold: 0.3, step: 0.25 });
assert.ok(near(lights[0].intensity, 1));
assert.strictEqual(Object.keys(lamp).some(k => k.startsWith('_')), false, "fade state is never written into the saved doodad");
assert.strictEqual(Lighting.collect([lamp], { x: 0, y: 0 }).length, 1, "without a context (editor previews) lamps show");

console.log("✓ World settings, clock, keyframes, map rules, ambient priority, sun path, shadow transform and night lamps verified.");
