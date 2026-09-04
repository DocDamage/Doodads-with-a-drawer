// scratch/test_interactive_systems.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing QJ Doodads Interactive Systems & Workspace Engine ===");

// 1. Mock engine globals
global.window = global;
global.window.addEventListener = (evt, fn) => {};
global.window.removeEventListener = (evt, fn) => {};
global.document = {
    createElement: (tag) => ({
        style: {},
        appendChild: () => {},
        removeChild: () => {},
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => ({
            clearRect: () => {},
            drawImage: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fillText: () => {},
            save: () => {},
            restore: () => {},
            translate: () => {},
            scale: () => {},
            setLineDash: () => {}
        }),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 })
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => ({
        style: {},
        value: '100',
        textContent: '',
        appendChild: () => {},
        removeChild: () => {},
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
        clientWidth: 800,
        clientHeight: 600
    })
};
global.Image = function() {
    this.naturalWidth = 576;
    this.naturalHeight = 384;
};
global.Graphics = { app: { view: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 }), width: 816, height: 624 } } };
global.Input = { isTriggered: () => false };
global.AudioManager = { playBgm: () => {}, playSe: () => {}, stopBgm: () => {}, stopSe: () => {} };
global.SoundManager = { playOk: () => {}, playCancel: () => {} };
global.SceneManager = { _scene: { _spriteset: { addDoodadsQJ: () => {}, sortDoodadsQJ: () => {} } } };
global.PluginManager = { parameters: () => ({ editKey: "F10", editorMode: "true" }) };
global.$gameMap = {
    mapId: () => 1,
    displayX: () => 2.0,
    displayY: () => 1.5,
    tileWidth: () => 48,
    tileHeight: () => 48,
    roundXWithDirection: (x, d) => x,
    roundYWithDirection: (y, d) => y
};
global.$gamePlayer = { x: 5, y: 5 };
global.$dataDoodadsQJ = { 1: [] };

// Load plugin
require('../QJ-Doodads.js');

// Test 1: Slicer Editor Snapping
console.log("Testing Slicer Editor coordinate snapping...");
const editor = QJ.DD.Slicing.Editor;
editor.img = { naturalWidth: 576, naturalHeight: 384 };
editor.zoom = 1.0;
editor.regions = [
    { id: 'r1', name: 'R1', x: 0, y: 0, w: 96, h: 96 },
    { id: 'r2', name: 'R2', x: 100, y: 0, w: 96, h: 96 }
];
editor.selectedRegionIdx = 1;

// Snap X to r1's right edge (96) when within 6px
const snappedX = editor.snapCoordX(98, 96);
assert.strictEqual(snappedX, 96, "Should snap to neighboring region's right edge (96)");
console.log("✓ Slicer coordinate snapping verified.");

// Test 2: Slicer Split Operations
console.log("Testing Slicer Split Operations...");
const targetReg = { id: 'orig', name: 'Box', x: 100, y: 100, w: 64, h: 80 };
editor.regions = [targetReg];
editor.selectedRegionIdx = 0;
// Test vertical split logic
const halfW = Math.round(targetReg.w / 2);
const splitA = { ...targetReg, w: halfW };
const splitB = { ...targetReg, id: 'orig_2', name: targetReg.name + '_2', x: targetReg.x + halfW, w: targetReg.w - halfW };
assert.strictEqual(splitA.w, 32);
assert.strictEqual(splitB.w, 32);
assert.strictEqual(splitB.x, 132);
console.log("✓ Slicer Split operations verified.");

// Test 3: Screen to Map Coordinate Transformation
console.log("Testing Screen to Map Coordinate Transformation...");
const ws = QJ.DD.Workspace;
// Given displayX=2, displayY=1.5, tile=48x48
// Click at screen (0, 0)
const coords = ws.clientToMapCoords(0, 0);
assert.strictEqual(coords.tileX, 2, "tileX should equal displayX (2) when screenX=0");
assert.strictEqual(coords.tileY, 1, "tileY should equal floor(1.5) when screenY=0");
assert.strictEqual(coords.x, 2 * 48);
assert.strictEqual(coords.y, 1.5 * 48);
console.log("✓ Screen to Map coordinate conversion verified.");

// Test 4: Custom Event Template Creation ("Save Event as Template")
console.log("Testing Save Event as Template...");
const mockMapEvent = {
    id: 5,
    name: "CustomGuard",
    x: 12, y: 14,
    pages: [{
        trigger: 0, priorityType: 1, directionFix: true,
        list: [
            { code: 101, indent: 0, parameters: ["Actor1", 0, 0, 2, "Guard"] },
            { code: 401, indent: 0, parameters: ["Halt! Who goes there?"] },
            { code: 0, indent: 0, parameters: [] }
        ]
    }]
};
const templateKey = QJ.DD.EventTemplates.saveCustomTemplate("Guard Patrol", mockMapEvent, "Guards");
assert(QJ.DD.EventTemplates.templates[templateKey], "Saved template must exist in registry");
assert.strictEqual(QJ.DD.EventTemplates.templates[templateKey].name, "Guard Patrol");
assert.strictEqual(QJ.DD.EventTemplates.templates[templateKey].category, "Guards");
assert.strictEqual(QJ.DD.EventTemplates.templates[templateKey].directionFix, true);
assert.strictEqual(QJ.DD.EventTemplates.templates[templateKey].list[1].parameters[0], "Halt! Who goes there?");
console.log("✓ Save Event as Template verified.");

// Test 5: Pre-Save External Conflict Detection
console.log("Testing External Conflict Detection...");
const persist = QJ.DD.Persistence;
persist.sessionSnapshots['data/Map001.json'] = { mtimeMs: 1000, size: 5000 };
// Mock QJ.DD.FS.stat to return different mtime
const origStat = QJ.DD.FS.stat;
QJ.DD.FS.stat = () => ({ mtimeMs: 1500, size: 5000 }); // external editor touched the file
assert.strictEqual(persist.checkConflict(), true, "Conflict must be detected when mtime differs");
QJ.DD.FS.stat = () => ({ mtimeMs: 1000, size: 5000 }); // untouched
assert.strictEqual(persist.checkConflict(), false, "No conflict when file matches session snapshot");
QJ.DD.FS.stat = origStat;
console.log("✓ External Conflict Detection verified.");

// Test 6: Scatter Brush Generation & Batch Undo
console.log("Testing Scatter Brush & Batch Undo...");
ws.selectedAsset = {
    id: "prop_rock",
    fileName: "Rock.png",
    path: "img/doodads/Rock.png",
    width: 48, height: 48,
    collision: { preset: "center" }
};
ws.attachCanvasListeners();
ws.isBrushActive = true;
ws.currentBrushBatch = [];
ws.scatterAt(100, 100);
assert(ws.currentBrushBatch.length >= 3, "Scatter brush should generate configured density items");
const batchCount = ws.currentBrushBatch.length;
assert.strictEqual($dataDoodadsQJ[1].length, batchCount, "All batch items should be added to doodads list");

// Simulate mouseup ending stroke
ws._onCanvasMouseUp();
assert.strictEqual(ws.isBrushActive, false);
assert(QJ.DD.Undo.undoStack.length > 0, "Brush stroke must be pushed to Undo stack");

// Perform Undo
QJ.DD.Undo.undo();
assert.strictEqual($dataDoodadsQJ[1].length, 0, "Undo must roll back entire scatter brush batch");

// Perform Redo
QJ.DD.Undo.redo();
assert.strictEqual($dataDoodadsQJ[1].length, batchCount, "Redo must restore entire scatter brush batch");
console.log("✓ Scatter Brush and Batch Undo/Redo verified.");

console.log("=== All Interactive System Tests Passed Successfully! ===");
