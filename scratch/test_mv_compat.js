// RPG Maker MV & MZ Compatibility Test Suite
const assert = require('assert');

// Test 1: Simulate RPG Maker MZ Environment
console.log("=== Testing RPG Maker MZ Compatibility ===");
global.window = global;
global.document = {
    getElementById(id) {
        if (id === 'GameCanvas') return { width: 816, height: 624 };
        return null;
    },
    addEventListener() {},
    removeEventListener() {}
};
global.Utils = {
    RPGMAKER_NAME: "MZ",
    isNwjs: () => true,
    isOptionValid: (opt) => opt === "test"
};
global.Graphics = {
    app: {
        view: { id: "gameCanvas", width: 816, height: 624 },
        stage: { children: [] },
        renderer: { type: "WebGL" }
    },
    boxWidth: 816,
    boxHeight: 624
};
global.Rectangle = class {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.width = w; this.height = h;
    }
};
global.Window_Base_MZ = class {
    constructor(rect) {
        assert(rect instanceof global.Rectangle, "MZ Window must receive Rectangle instance");
        this.x = rect.x; this.y = rect.y; this.width = rect.width; this.height = rect.height;
    }
};
global.ImageManager = {
    loadBitmap(folder, filename) {
        return { path: `${folder}${filename}`, type: "MZ_Bitmap" };
    }
};

delete require.cache[require.resolve('../Docs-Doodads.js')];
require('../Docs-Doodads.js');

assert(DocsDoodads.Compat.isMZ(), "isMZ() must return true under MZ");
assert(!DocsDoodads.Compat.isMV(), "isMV() must return false under MZ");
assert.strictEqual(DocsDoodads.Compat.getCanvas(), global.Graphics.app.view);
assert.strictEqual(DocsDoodads.Compat.getStage(), global.Graphics.app.stage);
assert.strictEqual(DocsDoodads.Compat.getRenderer(), global.Graphics.app.renderer);

const mzWin = DocsDoodads.Compat.createWindow(global.Window_Base_MZ, 10, 20, 300, 200);
assert.strictEqual(mzWin.x, 10);
assert.strictEqual(mzWin.width, 300);
console.log("✓ MZ Rectangle-based Window instantiation verified.");

const mzBmp = DocsDoodads.Compat.loadBitmap("img/characters/", "Hero.png");
assert.strictEqual(mzBmp.type, "MZ_Bitmap");
console.log("✓ MZ ImageManager delegation verified.");


// Test 2: Simulate RPG Maker MV Environment
console.log("\n=== Testing RPG Maker MV Compatibility ===");
global.Utils.RPGMAKER_NAME = "MV";
delete global.Graphics.app;
global.Graphics._canvas = { id: "GameCanvas", width: 816, height: 624 };
global.Graphics._stage = { children: [] };
global.Graphics._renderer = { type: "PIXI_v4" };

global.Window_Base_MV = class {
    constructor(x, y, w, h) {
        assert(typeof x === 'number' && typeof y === 'number', "MV Window must receive (x, y, w, h) numbers");
        this.x = x; this.y = y; this.width = w; this.height = h;
    }
};
global.ImageManager = {
    loadBitmap(folder, filename, hue, smooth) {
        return { path: `${folder}${filename}`, hue, smooth, type: "MV_Bitmap" };
    }
};

assert(DocsDoodads.Compat.isMV(), "isMV() must return true under MV");
assert(!DocsDoodads.Compat.isMZ(), "isMZ() must return false under MV");
assert.strictEqual(DocsDoodads.Compat.getCanvas(), global.Graphics._canvas);
assert.strictEqual(DocsDoodads.Compat.getStage(), global.Graphics._stage);
assert.strictEqual(DocsDoodads.Compat.getRenderer(), global.Graphics._renderer);

const mvWin = DocsDoodads.Compat.createWindow(global.Window_Base_MV, 15, 25, 400, 250);
assert.strictEqual(mvWin.x, 15);
assert.strictEqual(mvWin.width, 400);
console.log("✓ MV 4-argument (x, y, w, h) Window instantiation verified.");

const mvBmp = DocsDoodads.Compat.loadBitmap("img/doodads/", "Tree.png", 0, true);
assert.strictEqual(mvBmp.type, "MV_Bitmap");
assert.strictEqual(mvBmp.smooth, true);
console.log("✓ MV ImageManager delegation with hue & smooth verified.");


// Test 3: Feature Matrix & Browser / Web Deployment Fallback
console.log("\n=== Testing Feature Matrix & Web Deployment Fallback ===");
global.Utils.isNwjs = () => false;
global.Utils.isOptionValid = () => false;

assert(!DocsDoodads.Compat.isNwjs(), "isNwjs() should be false in browser deployment");
assert(!DocsDoodads.Compat.isTest(), "isTest() should be false in release deployment");

const matrix = DocsDoodads.Compat.featureMatrix;
assert(matrix.assetDrawer.mz === true);
assert(matrix.assetDrawer.mv === true);
assert(matrix.collisionSAT.mz === true);
assert(matrix.collisionSAT.mv === true);
assert(matrix.autoSlicer.mz === true);
console.log("✓ Full Feature Matrix verified across MZ, MV, and Web platforms.");

console.log("=== All MV & MZ Compatibility Tests Passed Successfully! ===");
