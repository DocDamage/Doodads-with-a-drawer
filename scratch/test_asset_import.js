// Phase 12 regression suite: Explorer asset ingestion must be routed, collision-safe,
// and transactional when a batch partially fails.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({
        style: {}, classList: { add() {}, remove() {}, toggle() {} },
        appendChild() {}, removeChild() {}, querySelectorAll() { return []; },
        addEventListener() {}, removeEventListener() {}, getContext() { return {}; }
    }),
    getElementById: () => null,
    body: { appendChild() {}, removeChild() {} }
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');

console.log('=== Testing Phase 12 Asset Import Transactions ===');
assert(DocsDoodads.Import, 'DocsDoodads.Import subsystem must be exposed');
assert.strictEqual(DocsDoodads.AssetIndex.isSupportedAssetFile('portrait.webp'), true, 'imported WebP assets must be indexable');
assert.strictEqual(DocsDoodads.AssetIndex.isSupportedAssetFile('portrait.jpeg'), true, 'imported JPEG assets must be indexable');

const sandbox = path.join(__dirname, 'asset_import_fixture');
const source = path.join(sandbox, 'source');
const project = path.join(sandbox, 'project');

function write(relativePath, content) {
    const target = path.join(source, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    return target;
}

(async () => {
try {
    fs.rmSync(sandbox, { recursive: true, force: true });
    const tree = write('tree.png', 'new tree bytes');
    write('music_theme_bgm.ogg', 'music bytes');
    write('nested/$Hero.png', 'hero bytes');
    write('notes.txt', 'unsupported');

    const existingTree = path.join(project, 'img', 'doodads', 'tree.png');
    fs.mkdirSync(path.dirname(existingTree), { recursive: true });
    fs.writeFileSync(existingTree, 'original tree bytes');

    const plan = DocsDoodads.Import.planBatch([source], {
        projectRoot: project,
        destination: 'auto',
        collisionPolicy: 'rename'
    });

    assert.strictEqual(plan.operations.length, 3, 'all supported files should be planned recursively');
    assert.strictEqual(plan.unsupported.length, 1, 'unsupported files should be reported');
    assert(plan.operations.some(op => op.destination.endsWith(path.join('img', 'doodads', 'tree_1.png'))));
    assert(plan.operations.some(op => op.destination.endsWith(path.join('audio', 'bgm', 'music_theme_bgm.ogg'))));
    assert(plan.operations.some(op => op.destination.endsWith(path.join('img', 'characters', '$Hero.png'))));

    const result = await DocsDoodads.Import.executeBatchAsync(plan);
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.imported.length, 3);
    assert.strictEqual(fs.readFileSync(existingTree, 'utf8'), 'original tree bytes', 'default import must not overwrite');
    assert.strictEqual(fs.readFileSync(path.join(project, 'img', 'doodads', 'tree_1.png'), 'utf8'), 'new tree bytes');

    const duplicatePlan = DocsDoodads.Import.planBatch([tree], {
        projectRoot: project,
        destination: 'img/doodads',
        collisionPolicy: 'rename'
    });
    assert.strictEqual(duplicatePlan.operations.length, 0, 'an exact duplicate should not be copied again');
    assert.strictEqual(duplicatePlan.duplicates.length, 1, 'exact duplicates should be reported');

    const rollbackA = write('rollback-a.png', 'rollback a');
    const rollbackB = write('rollback-b.png', 'rollback b');
    const rollbackPlan = DocsDoodads.Import.planBatch([rollbackA, rollbackB], {
        projectRoot: project,
        destination: 'img/pictures',
        collisionPolicy: 'rename'
    });
    fs.unlinkSync(rollbackB);

    const failed = await DocsDoodads.Import.executeBatchAsync(rollbackPlan);
    assert.strictEqual(failed.ok, false, 'a failed copy should fail the transaction');
    assert.strictEqual(failed.rolledBack, true, 'a failed batch should roll back earlier copies');
    assert.strictEqual(fs.existsSync(path.join(project, 'img', 'pictures', 'rollback-a.png')), false);

    const overwriteSource = write('00-overwrite.png', 'replacement bytes');
    const laterFailure = write('99-overwrite-failure.png', 'will disappear');
    const overwriteTarget = path.join(project, 'img', 'faces', '00-overwrite.png');
    fs.mkdirSync(path.dirname(overwriteTarget), { recursive: true });
    fs.writeFileSync(overwriteTarget, 'original bytes');
    const overwritePlan = DocsDoodads.Import.planBatch([overwriteSource, laterFailure], {
        projectRoot: project,
        destination: 'img/faces',
        collisionPolicy: 'overwrite'
    });
    fs.unlinkSync(laterFailure);
    const overwriteFailure = await DocsDoodads.Import.executeBatchAsync(overwritePlan);
    assert.strictEqual(overwriteFailure.ok, false);
    assert.strictEqual(fs.readFileSync(overwriteTarget, 'utf8'), 'original bytes', 'rollback must restore overwritten files');

    const escapedTarget = path.join(sandbox, 'escaped.png');
    const forgedPlan = {
        projectRoot: project,
        operations: [{ source: tree, destination: escapedTarget, overwrite: false, kind: 'image' }],
        duplicates: [], skipped: [], unsupported: [], errors: []
    };
    const escapedResult = await DocsDoodads.Import.executeBatchAsync(forgedPlan);
    assert.strictEqual(escapedResult.ok, false, 'execution must reject a destination outside the planned project root');
    assert.strictEqual(fs.existsSync(escapedTarget), false, 'a forged plan must not write outside the project root');

    console.log('✓ Routing, collision handling, rollback, and execution-time path confinement verified.');

    // Two dropped files whose names differ only in case land in one Windows file; the second is renamed.
    if (process.platform === 'win32') {
        const upper = write('case/Stone.png', 'upper');
        const lower = write('case2/stone.png', 'lower');
        const casePlan = DocsDoodads.Import.planBatch([upper, lower], { projectRoot: project, destination: 'img/pictures', collisionPolicy: 'rename' });
        assert.strictEqual(casePlan.operations.length, 2);
        assert.notStrictEqual(casePlan.operations[0].destination.toLowerCase(), casePlan.operations[1].destination.toLowerCase(), 'case-only name clashes get a new name');
        const caseResult = await DocsDoodads.Import.executeBatchAsync(casePlan);
        assert.strictEqual(caseResult.ok, true, JSON.stringify(caseResult.errors));
        console.log('✓ Case-only name clashes are renamed on Windows.');
    }
} finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
}
console.log('=== Phase 12 Asset Import Tests Passed ===');
})().catch(error => { console.error(error); process.exit(1); });
