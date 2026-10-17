// Regression: generated MZ events must store characterName without the file extension;
// ImageManager appends ".png", so "!Door1.png" would load "!Door1.png.png" and fail.
const assert = require('assert');

console.log("=== Testing Generated Event Character Names ===");

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

require('../Docs-Doodads.js');

const cases = [['!Door1.png', '!Door1'], ['$BigMonster.PNG', '$BigMonster'], ['Actor1', 'Actor1'], ['', '']];
for (const [input, expected] of cases) {
    const ev = DocsDoodads.Events.createEventObject(1, 2, 3, { characterName: input });
    assert.strictEqual(ev.pages[0].image.characterName, expected, `characterName ${JSON.stringify(input)}`);
}

console.log("✓ Event characterName is stored the way MZ ImageManager expects.");
