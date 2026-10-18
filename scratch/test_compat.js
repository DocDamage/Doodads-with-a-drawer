// The small MZ engine-access layer: canvas, renderer, NW.js and playtest checks.
const assert = require('assert');

global.window = global;
global.document = {
    getElementById(id) { return id === 'GameCanvas' ? { id: 'GameCanvas', width: 816, height: 624 } : null; },
    querySelector() { return null; },
    addEventListener() {},
    removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.Graphics = {
    app: { view: { id: 'gameCanvas', width: 816, height: 624 }, stage: { children: [] }, renderer: { type: 'WebGL' } },
    boxWidth: 816,
    boxHeight: 624
};
global.Rectangle = class { constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; } };

delete require.cache[require.resolve('../Docs-Doodads.js')];
require('../Docs-Doodads.js');
const C = DocsDoodads.Compat;

assert.strictEqual(C.getCanvas(), Graphics.app.view);
assert.strictEqual(C.getRenderer(), Graphics.app.renderer);
assert(C.isNwjs() && C.isTest());
console.log('✓ canvas, renderer, NW.js and playtest from MZ');

// Before MZ makes its PIXI app, the canvas comes from Graphics._canvas, then the page.
const app = Graphics.app;
delete Graphics.app;
Graphics._canvas = { id: 'early' };
assert.strictEqual(C.getCanvas().id, 'early');
assert.strictEqual(C.getRenderer(), null);
delete Graphics._canvas;
assert.strictEqual(C.getCanvas().id, 'GameCanvas');
Graphics.app = app;
console.log('✓ canvas fallbacks before the app exists');

// A deployed game in a browser: no NW.js, not a playtest.
Utils.isNwjs = () => false;
Utils.isOptionValid = () => false;
assert(!C.isNwjs(), 'isNwjs() is false in a browser deployment');
assert(!C.isTest(), 'isTest() is false in a deployed game');
console.log('✓ browser deployment');
console.log('=== Compat tests passed ===');
