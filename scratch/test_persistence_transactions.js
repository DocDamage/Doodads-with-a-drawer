// Phase 14 regression suite: multi-file saves and manual restores must never
// leave a partially committed project state.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, appendChild() {}, removeChild() {} }),
    getElementById: () => null,
    body: { appendChild() {}, removeChild() {} }
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../QJ-Doodads.js');

console.log('=== Testing Phase 14 Persistence Transactions ===');
assert.strictEqual(typeof QJ.DD.FS.atomicWriteManyJson, 'function');
assert.strictEqual(typeof QJ.DD.FS.restoreBackup, 'function');

const sandbox = path.join(__dirname, 'persistence_fixture');
const backupDir = path.join(sandbox, 'backups');
const first = path.join(sandbox, 'Map001.json');
const second = path.join(sandbox, 'DoodadsQJ.json');

try {
    fs.rmSync(sandbox, { recursive: true, force: true });
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(first, JSON.stringify({ version: 'old-map' }));
    fs.writeFileSync(second, JSON.stringify({ version: 'old-doodads' }));

    const failed = QJ.DD.FS.atomicWriteManyJson([
        { path: first, data: { version: 'new-map' } },
        { path: second, data: { version: 'new-doodads' } }
    ], {
        beforeCommit(index) {
            if (index === 1) throw new Error('simulated disk failure');
        }
    });
    assert.strictEqual(failed.ok, false);
    assert.strictEqual(failed.rolledBack, true);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(first, 'utf8')), { version: 'old-map' });
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(second, 'utf8')), { version: 'old-doodads' });

    const backup = path.join(backupDir, 'Map001.json.2026-09-03T00-00-00-000Z.bak');
    fs.writeFileSync(backup, JSON.stringify({ version: 'restored-map' }));
    const restored = QJ.DD.FS.restoreBackup(first, backup, { backupDir });
    assert.strictEqual(restored.ok, true);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(first, 'utf8')), { version: 'restored-map' });
    assert(restored.safetyBackup && fs.existsSync(restored.safetyBackup), 'restore must back up the current target first');

    const invalidBackup = path.join(backupDir, 'Map001.json.invalid.bak');
    fs.writeFileSync(invalidBackup, '{broken');
    const invalid = QJ.DD.FS.restoreBackup(first, invalidBackup, { backupDir });
    assert.strictEqual(invalid.ok, false);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(first, 'utf8')), { version: 'restored-map' });

    const outside = path.join(sandbox, 'Map001.json.outside.bak');
    fs.writeFileSync(outside, JSON.stringify({ version: 'unsafe' }));
    const rejected = QJ.DD.FS.restoreBackup(first, outside, { backupDir });
    assert.strictEqual(rejected.ok, false, 'restore must reject files outside the backup directory');

    const leftovers = fs.readdirSync(sandbox, { recursive: true }).filter(name => /qjtxn|\.tmp$/.test(String(name)));
    assert.deepStrictEqual(leftovers, [], 'transaction scratch files must be removed');

    const originalAtomicWriteMany = QJ.DD.FS.atomicWriteManyJson;
    const originalCreateBackup = QJ.DD.FS.createTimestampedBackup;
    const originalToast = QJ.DD.Workspace.showToast;
    global.$gameMap = { mapId: () => 1, _stagedMapData: { events: [null] } };
    global.$dataDoodadsQJ = { 1: [{ x: 1, y: 2 }] };
    QJ.DD.Persistence.dirtyMap = true;
    QJ.DD.Persistence.dirtyDoodads = true;
    QJ.DD.FS.createTimestampedBackup = () => null;
    QJ.DD.Workspace.showToast = () => {};
    QJ.DD.FS.atomicWriteManyJson = () => ({ ok: false, error: 'simulated save failure', rolledBack: true });
    assert.strictEqual(QJ.DD.Persistence.saveAll(true), false, 'failed transaction must report save failure');
    assert.strictEqual(QJ.DD.Persistence.dirtyMap, true, 'failed transaction must keep map dirty');
    assert.strictEqual(QJ.DD.Persistence.dirtyDoodads, true, 'failed transaction must keep doodads dirty');

    let savedEntries = [];
    QJ.DD.FS.atomicWriteManyJson = entries => { savedEntries = entries; return { ok: true, committed: entries.map(entry => entry.path) }; };
    assert.strictEqual(QJ.DD.Persistence.saveAll(true), true);
    assert(savedEntries.some(entry => /Map001\.json$/.test(entry.path)));
    assert(savedEntries.some(entry => /DoodadsQJ\.json$/.test(entry.path)));
    assert.strictEqual(QJ.DD.Persistence.dirtyMap, false);
    assert.strictEqual(QJ.DD.Persistence.dirtyDoodads, false);
    QJ.DD.FS.atomicWriteManyJson = originalAtomicWriteMany;
    QJ.DD.FS.createTimestampedBackup = originalCreateBackup;
    QJ.DD.Workspace.showToast = originalToast;
    console.log('✓ Multi-file rollback, validated restore, and backup confinement verified.');
} finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log('=== Phase 14 Persistence Transaction Tests Passed ===');
