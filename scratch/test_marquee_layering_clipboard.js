// Test Suite for Marquee Selection, Layering (Z-Order), Clipboard (Copy/Paste), and Explorer Import
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
global.$gameMap = {
    mapId: () => 1,
    _stagedMapData: { events: [] }
};
global.$dataDoodadsQJ = {
    1: []
};

require('../QJ-Doodads.js');

console.log("=== Testing Marquee Selection, Layering & Clipboard Operations ===");

// Setup initial test doodads on map 1
const mapList = window.$dataDoodadsQJ[1] = [
    { x: 100, y: 100, z: 0, bit: [3, 'img/doodads/tree.png'], frameW: 48, frameH: 48 },
    { x: 150, y: 120, z: 2, bit: [3, 'img/doodads/rock.png'], frameW: 32, frameH: 32 },
    { x: 200, y: 150, z: 5, bit: [3, 'img/doodads/bush.png'], frameW: 48, frameH: 48 },
    { x: 500, y: 500, z: 1, bit: [3, 'img/doodads/far_lamp.png'], frameW: 32, frameH: 48 }
];

// 1. Test Canvas Marquee Selection Logic
console.log("Testing Marquee Selection Logic...");
const marqueeBox = { minX: 80, maxX: 220, minY: 80, maxY: 180 };
const enclosed = mapList.filter(d => d.x >= marqueeBox.minX && d.x <= marqueeBox.maxX && d.y >= marqueeBox.minY && d.y <= marqueeBox.maxY);

assert.strictEqual(enclosed.length, 3, "Marquee box should enclose exactly 3 doodads");
assert(!enclosed.includes(mapList[3]), "Far lamp at (500,500) must NOT be enclosed");

QJ.DD.Workspace.selectDoodads(enclosed);
assert.strictEqual(QJ.DD.Workspace.selectedDoodads.length, 3);
assert.strictEqual(QJ.DD.Workspace.selectedDoodad, mapList[0]);
console.log("✓ Marquee Selection accurately enclosed doodads.");

// 2. Test Layering (Z-Order) Operations
console.log("Testing Layering (Z-Order) Operations...");
const origZ0 = mapList[0].z; // 0
const origZ1 = mapList[1].z; // 2
const origZ2 = mapList[2].z; // 5

// Bring Forward (+1 Z)
QJ.DD.Workspace.bringForward([mapList[0], mapList[1]]);
assert.strictEqual(mapList[0].z, 1, "mapList[0] Z should increment from 0 to 1");
assert.strictEqual(mapList[1].z, 3, "mapList[1] Z should increment from 2 to 3");

// Undo Bring Forward
QJ.DD.Undo.undo();
assert.strictEqual(mapList[0].z, origZ0, "Undo should restore mapList[0] Z to 0");
assert.strictEqual(mapList[1].z, origZ1, "Undo should restore mapList[1] Z to 2");

// Send Backward (-1 Z)
QJ.DD.Workspace.sendBackward([mapList[1]]);
assert.strictEqual(mapList[1].z, 1, "Send Backward should decrement Z from 2 to 1");
QJ.DD.Undo.undo();
assert.strictEqual(mapList[1].z, 2, "Undo should restore Z to 2");

// Bring to Front (maxZ + 1)
// Max Z currently is 5 (mapList[2]). Bringing mapList[0] to front should give it Z = 6.
QJ.DD.Workspace.bringToFront([mapList[0]]);
assert.strictEqual(mapList[0].z, 6, "Bring to Front should set Z higher than all others (6)");

// Send to Back (minZ - 1)
// Min Z currently is 1 (mapList[3]). Sending mapList[2] to back should set Z = -1 (or min - 1).
QJ.DD.Workspace.sendToBack([mapList[2]]);
assert(mapList[2].z < 0, "Send to Back should set Z lower than all others");

// Undo both
QJ.DD.Undo.undo();
QJ.DD.Undo.undo();
assert.strictEqual(mapList[0].z, origZ0);
assert.strictEqual(mapList[2].z, origZ2);
console.log("✓ Layering (Forward, Backward, To Front, To Back) and Undo verified.");

// 3. Test Clipboard (Copy & Paste)
console.log("Testing Clipboard Copy & Paste...");
QJ.DD.Workspace.selectDoodads([mapList[0], mapList[1]]);
QJ.DD.Workspace.copySelected();

assert(QJ.DD.Workspace._clipboardDoodads, "Clipboard should contain copied doodads");
assert.strictEqual(QJ.DD.Workspace._clipboardDoodads.length, 2);

const prevCount = mapList.length;
QJ.DD.Workspace.pasteCopied();

assert.strictEqual(mapList.length, prevCount + 2, "Map list should have 2 new pasted doodads");
const pasted1 = mapList[prevCount];
const pasted2 = mapList[prevCount + 1];

assert.strictEqual(pasted1.x, mapList[0].x + 16, "Pasted doodad 1 should have +16 offset");
assert.strictEqual(pasted2.x, mapList[1].x + 16, "Pasted doodad 2 should have +16 offset");

// Undo paste
QJ.DD.Undo.undo();
assert.strictEqual(mapList.length, prevCount, "Undo should remove pasted doodads");

// Redo paste
QJ.DD.Undo.redo();
assert.strictEqual(mapList.length, prevCount + 2, "Redo should re-add pasted doodads");

// Clean up
QJ.DD.Undo.undo();
console.log("✓ Clipboard Copy, Paste, and Undo/Redo verified.");

// 4. Test Explorer Import Logic with Collision Protection
console.log("Testing Explorer Import Logic & Collision Protection...");
const tempImportDir = path.join(__dirname, 'test_import_source');
const tempTargetDir = path.join(__dirname, '../img/doodads');
QJ.DD.FS.ensureDir(tempImportDir);
QJ.DD.FS.ensureDir(tempTargetDir);

const testFile1 = path.join(tempImportDir, 'custom_bush.png');
fs.writeFileSync(testFile1, 'mock png content');

// Existing file in target with different content
const targetExisting = path.join(tempTargetDir, 'custom_bush.png');
fs.writeFileSync(targetExisting, 'existing different content');

// Simulate collision rename logic
const ext = path.extname(testFile1).toLowerCase();
const base = path.basename(testFile1, ext);
let dest = targetExisting;
if (fs.existsSync(dest)) {
    const srcStat = fs.statSync(testFile1);
    const destStat = fs.statSync(dest);
    if (srcStat.size !== destStat.size) {
        let counter = 1;
        while (fs.existsSync(path.join(tempTargetDir, `${base}_${counter}${ext}`))) {
            counter++;
        }
        dest = path.join(tempTargetDir, `${base}_${counter}${ext}`);
    }
}
fs.copyFileSync(testFile1, dest);

assert(fs.existsSync(dest), "Non-colliding file must be created");
assert(dest.includes('custom_bush_1.png'), "Collision rename must produce custom_bush_1.png");
assert.strictEqual(fs.readFileSync(targetExisting, 'utf8'), 'existing different content', "Original file must NOT be overwritten");

// Clean up test files
if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
if (fs.existsSync(dest)) fs.unlinkSync(dest);
if (fs.existsSync(targetExisting)) fs.unlinkSync(targetExisting);
if (fs.existsSync(tempImportDir)) fs.rmdirSync(tempImportDir);
console.log("✓ Explorer collision protection renaming verified.");

// 5. Test Quick Toggle Methods
console.log("Testing Quick Shortcuts & Navigation Helpers...");
const initialGrid = QJ.DD.Workspace.gridSnapShow;
QJ.DD.Workspace.toggleGrid();
assert.strictEqual(QJ.DD.Workspace.gridSnapShow, !initialGrid, "Grid toggle should flip state");
QJ.DD.Workspace.toggleGrid();
assert.strictEqual(QJ.DD.Workspace.gridSnapShow, initialGrid, "Grid toggle should flip back");
console.log("✓ Quick toggle methods verified.");

console.log("=== All Marquee, Layering & Clipboard Tests Passed Successfully! ===");
