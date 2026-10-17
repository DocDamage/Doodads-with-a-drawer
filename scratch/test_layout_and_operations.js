// Layout Persistence, Modern Operations & Custom Collision Test Suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.document = {
    createElement(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                add() {},
                remove() {},
                toggle() {},
                contains() { return false; }
            },
            appendChild() {},
            removeChild() {},
            querySelectorAll() { return []; },
            addEventListener() {},
            removeEventListener() {},
            getContext() {
                return {
                    clearRect() {},
                    fillRect() {},
                    strokeRect() {},
                    drawImage() {},
                    getImageData(x, y, w, h) { return { data: new Uint8Array(w * h * 4) }; }
                };
            }
        };
    },
    getElementById() { return null; },
    body: { appendChild() {}, removeChild() {} }
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');

console.log("=== Testing Doc's Doodads Layout Persistence & Modern Operations ===");

// 1. DocsDoodads.Layout Persistence (data/DocsDoodadsLayouts.json)
console.log("Testing DocsDoodadsLayouts.json load, save, and delete...");
const testLayoutPath = 'data/scratch_test_layouts.json';
DocsDoodads.Layout.filePath = testLayoutPath;

// Clean any previous test file
if (fs.existsSync(testLayoutPath)) fs.unlinkSync(testLayoutPath);

DocsDoodads.Layout.init();
assert.deepStrictEqual(DocsDoodads.Layout.custom, {}, "Initial custom layouts should be empty");

// Save a custom layout
DocsDoodads.Layout.custom["SuperWide"] = { drawerWidth: 500, inspectorWidth: 350, thumbSize: 128, viewMode: 'grid' };
DocsDoodads.FS.atomicWriteJson(testLayoutPath, DocsDoodads.Layout.custom);

// Re-init and verify
DocsDoodads.Layout.init();
assert(DocsDoodads.Layout.custom["SuperWide"], "SuperWide layout must exist after re-init");
assert.strictEqual(DocsDoodads.Layout.get("SuperWide").drawerWidth, 500);
assert.strictEqual(DocsDoodads.Layout.get("SuperWide").inspectorWidth, 350);
console.log("✓ Custom layout successfully persisted and loaded from JSON.");

// Test getAllNames
const allNames = DocsDoodads.Layout.getAllNames();
assert(allNames.includes("Mapping"), "Must include Mapping preset");
assert(allNames.includes("SuperWide"), "Must include SuperWide custom layout");
console.log("✓ Layout.getAllNames() includes both presets and custom layouts.");

// Test deleteCustomLayout
DocsDoodads.Layout.deleteCustomLayout("SuperWide");
assert(!DocsDoodads.Layout.custom["SuperWide"], "SuperWide should be deleted");
if (fs.existsSync(testLayoutPath)) fs.unlinkSync(testLayoutPath);
console.log("✓ Custom layout deletion verified.");

// Reset layout path
DocsDoodads.Layout.filePath = 'data/DocsDoodadsLayouts.json';

// 2. Multi-Selection in DocsDoodads.Workspace
console.log("Testing Multi-Doodad Selection...");
const d1 = { x: 100, y: 150, z: 0, frameW: 48, frameH: 48, scaleX: 1, scaleY: 1 };
const d2 = { x: 200, y: 150, z: 0, frameW: 48, frameH: 48, scaleX: 1, scaleY: 1 };
const d3 = { x: 300, y: 150, z: 0, frameW: 48, frameH: 48, scaleX: 1, scaleY: 1 };

DocsDoodads.Workspace.selectDoodad(d1, false);
assert.strictEqual(DocsDoodads.Workspace.selectedDoodads.length, 1);
assert.strictEqual(DocsDoodads.Workspace.selectedDoodad, d1);

// Add to selection (Shift+Click)
DocsDoodads.Workspace.selectDoodad(d2, true);
assert.strictEqual(DocsDoodads.Workspace.selectedDoodads.length, 2);
assert(DocsDoodads.Workspace.selectedDoodads.includes(d1));
assert(DocsDoodads.Workspace.selectedDoodads.includes(d2));

DocsDoodads.Workspace.selectDoodad(d3, true);
assert.strictEqual(DocsDoodads.Workspace.selectedDoodads.length, 3);
console.log("✓ Multi-selection adding verified (3 doodads selected).");

// Toggle off d2
DocsDoodads.Workspace.selectDoodad(d2, true);
assert.strictEqual(DocsDoodads.Workspace.selectedDoodads.length, 2);
assert(!DocsDoodads.Workspace.selectedDoodads.includes(d2));
console.log("✓ Multi-selection toggle off verified.");

// 3. Alignment Operations
console.log("Testing Alignment Operations (Left, Right, Center, Top, Bottom)...");
d1.x = 120; d1.y = 80;
d2.x = 240; d2.y = 150;
d3.x = 360; d3.y = 200;
DocsDoodads.Workspace.selectedDoodads = [d1, d2, d3];

// Align Left
DocsDoodads.Workspace.alignSelected('left');
assert.strictEqual(d1.x, 120);
assert.strictEqual(d2.x, 120);
assert.strictEqual(d3.x, 120);
console.log("✓ Align Left verified.");

// Undo align left
DocsDoodads.Undo.undo();
assert.strictEqual(d1.x, 120);
assert.strictEqual(d2.x, 240);
assert.strictEqual(d3.x, 360);
console.log("✓ Undo Align Left successfully restored original X coordinates.");

// Align Right
DocsDoodads.Workspace.alignSelected('right');
assert.strictEqual(d1.x, 360);
assert.strictEqual(d2.x, 360);
assert.strictEqual(d3.x, 360);
DocsDoodads.Undo.undo();
console.log("✓ Align Right verified.");

// Align Top
DocsDoodads.Workspace.alignSelected('top');
assert.strictEqual(d1.y, 80);
assert.strictEqual(d2.y, 80);
assert.strictEqual(d3.y, 80);
DocsDoodads.Undo.undo();
console.log("✓ Align Top verified.");

// 4. Distribution Operations
console.log("Testing Distribution Operations (Horizontal & Vertical)...");
d1.x = 100;
d2.x = 130;
d3.x = 500;
DocsDoodads.Workspace.selectedDoodads = [d1, d2, d3];

DocsDoodads.Workspace.distributeSelected('horizontal');
assert.strictEqual(d1.x, 100);
assert.strictEqual(d2.x, 300); // (500 - 100) / 2 = 200 -> 100 + 200 = 300
assert.strictEqual(d3.x, 500);
console.log("✓ Horizontal distribution verified (d2 positioned exactly at midpoint 300).");

DocsDoodads.Undo.undo();
assert.strictEqual(d2.x, 130);
console.log("✓ Undo distribution successfully restored original position.");

// 5. Grouping, Locking & Hiding
console.log("Testing Grouping, Locking & Hiding...");
DocsDoodads.Workspace.groupSelected();
assert(d1.groupId, "Doodads must receive a groupId");
assert.strictEqual(d1.groupId, d2.groupId);
assert.strictEqual(d2.groupId, d3.groupId);
console.log(`✓ Grouping verified with shared groupId: ${d1.groupId}`);

// Test Locking
DocsDoodads.Workspace.lockSelected(true);
assert.strictEqual(d1.locked, true);
assert.strictEqual(d2.locked, true);
assert.strictEqual(d3.locked, true);

// Verify that locked doodad is ignored by align
d1.x = 100; d2.x = 200;
DocsDoodads.Workspace.alignSelected('left');
assert.strictEqual(d1.x, 100, "Locked doodad d1 position must not be altered by alignment");
assert.strictEqual(d2.x, 200, "Locked doodad d2 position must not be altered by alignment");
console.log("✓ Locked doodads correctly protected against accidental modification.");

// Unlock
DocsDoodads.Workspace.lockSelected(false);
assert.strictEqual(d1.locked, false);
console.log("✓ Unlocking verified.");

// Test Hiding
DocsDoodads.Workspace.hideSelected(true);
assert.strictEqual(d1.editorHidden, true);
assert.strictEqual(d2.editorHidden, true);
console.log("✓ Hiding in editor verified.");

// 6. Custom Collision Rectangle & SAT Collision
console.log("Testing Custom Collision Rectangle & SAT Physics...");
const treeDoodad = {
    x: 100,
    y: 100,
    frameW: 64,
    frameH: 64,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
        preset: "custom",
        shape: { x: 0.25, y: 0.75, w: 0.5, h: 0.25 } // trunk at base
    }
};

const shape = treeDoodad.collision.shape;
const dw = treeDoodad.frameW * treeDoodad.scaleX;
const dh = treeDoodad.frameH * treeDoodad.scaleY;
const originX = treeDoodad.x - dw * treeDoodad.anchorX;
const originY = treeDoodad.y - dh * treeDoodad.anchorY;

const colX = originX + shape.x * dw + (shape.w * dw) / 2;
const colY = originY + shape.y * dh + (shape.h * dh) / 2;
const colW = shape.w * dw;
const colH = shape.h * dh;

assert.strictEqual(colW, 32); // 0.5 * 64
assert.strictEqual(colH, 16); // 0.25 * 64

const trunkBox = DocsDoodads.box(colX, colY, colW, colH);
const playerAtTrunk = DocsDoodads.box(colX, colY, 24, 24);
const playerAtCanopy = DocsDoodads.box(colX, colY - 40, 24, 24);

assert(DocsDoodads.judge(trunkBox, playerAtTrunk), "Player at base must collide with trunk");
assert(!DocsDoodads.judge(trunkBox, playerAtCanopy), "Player at top canopy must be passable");
console.log("✓ Custom collision shape and SAT collision passability verified.");

console.log("=== All Layout Persistence & Modern Operations Tests Passed! ===");
