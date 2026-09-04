// QA, Migration, Corrupt JSON Recovery & Production Isolation Test Suite
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Setup environment
global.window = global;
global.document = {
    addEventListener() {},
    removeEventListener() {}
};
global.Utils = {
    RPGMAKER_NAME: "MZ",
    isNwjs: () => true,
    isOptionValid: (opt) => opt === "test"
};
global.Graphics = {
    app: { view: { id: "gameCanvas" } }
};
global.Scene_Map = class {
    initialize() {}
    updateScene() {}
};

delete require.cache[require.resolve('../QJ-Doodads.js')];
require('../QJ-Doodads.js');

console.log("=== Testing Migration, QA, Fallback & Production Isolation ===");

// 1. Test Legacy v1 Doodads Migration
console.log("Testing Legacy v1 Doodads Data Migration...");
const legacyData = {
    1: [
        {
            bit: [3, "img/doodads/old_tree.png"],
            x: 200,
            y: 350
            // Intentionally missing collision, scale, anchor, etc.
        },
        {
            bit: [1, "old_barrel"],
            x: 100,
            y: 150,
            opacity: 0.8
        }
    ]
};

QJ.DD.migrateData(legacyData, 'doodads');
const d1 = legacyData[1][0];
assert(d1.collision && d1.collision.preset === 'none', "Collision preset should be backfilled");
assert.strictEqual(d1.scaleX, 1, "scaleX should default to 1");
assert.strictEqual(d1.scaleY, 1, "scaleY should default to 1");
assert.strictEqual(d1.anchorX, 0.5, "anchorX should default to 0.5");
assert.strictEqual(d1.anchorY, 1.0, "anchorY should default to 1.0");
assert.strictEqual(d1.posMode, 1, "posMode should default to 1 (map)");
assert(Array.isArray(d1.switch), "switch should default to array");
assert.strictEqual(d1.condition, "", "condition should default to empty string");

const d2 = legacyData[1][1];
assert.strictEqual(d2.opacity, 0.8, "Preserved existing opacity");
assert(d2.collision && d2.collision.preset === 'none');
console.log("✓ Legacy v1 Doodads successfully migrated with full default backfill.");

// 2. Test Corrupt JSON Backup Fallback
console.log("\nTesting Corrupt JSON Auto-Recovery from Backup...");
const testDir = 'data';
const backupDir = 'data/qj_asset_cache/backups';
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const corruptFile = path.join(testDir, 'scratch_corrupt_test.json');
const backupFile = path.join(backupDir, 'scratch_corrupt_test.json.2026-09-03T20-00-00-000Z.bak');

// Write corrupt content to primary file
fs.writeFileSync(corruptFile, '{ "corrupted": true, UNTERMINATED_SYNTAX_ERROR...', 'utf8');

// Write valid content to backup
const intactBackup = { recoveredSuccessfully: true, timestamp: Date.now() };
fs.writeFileSync(backupFile, JSON.stringify(intactBackup), 'utf8');

// Attempt readJson on the corrupt file
const result = QJ.DD.FS.readJson(corruptFile);
assert(result !== null, "readJson should not return null when intact backup exists");
assert.strictEqual(result.recoveredSuccessfully, true, "Data should be seamlessly recovered from latest backup");
console.log("✓ Corrupt JSON automatically detected and recovered from backup!");

// Clean up test files
try { fs.unlinkSync(corruptFile); } catch(e) {}
try { fs.unlinkSync(backupFile); } catch(e) {}

// 3. Test Production Deployment Isolation
console.log("\nTesting Production Deployment Isolation (test mode false)...");
global.Utils.isOptionValid = (opt) => false; // Simulating exported game

assert(!QJ.DD.Compat.isTest(), "isTest() must be false in exported production game");

let workspaceOpened = false;
QJ.DD.Workspace.open = () => { workspaceOpened = true; };

// Simulate Scene_Map updateScene in production with F10 pressed
global.Input = { isTriggered: () => true };
const mockScene = new global.Scene_Map();
mockScene.updateScene();

assert.strictEqual(workspaceOpened, false, "Workspace must NEVER open during production deployment");
console.log("✓ Editor functionality successfully isolated from production builds.");

console.log("=== All Migration, QA & Isolation Tests Passed Successfully! ===");
