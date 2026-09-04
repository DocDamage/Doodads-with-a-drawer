// Phase 1/15 regression suite for incremental, cancellable project indexing.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = { createElement: () => ({ style: {} }), getElementById: () => null, body: { appendChild() {}, removeChild() {} } };
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../QJ-Doodads.js');

async function main() {
    console.log('=== Testing Incremental Asset Index ===');
    assert.strictEqual(typeof QJ.DD.AssetIndex.scanAsync, 'function');

    const sandbox = path.join(__dirname, 'asset_index_fixture');
    const doodads = path.join(sandbox, 'img', 'doodads');
    fs.rmSync(sandbox, { recursive: true, force: true });
    fs.mkdirSync(doodads, { recursive: true });
    const existingFile = path.join(doodads, 'existing.png');
    fs.writeFileSync(existingFile, 'existing image');
    fs.writeFileSync(path.join(doodads, 'new.webp'), 'new image');
    const stat = fs.statSync(existingFile);

    QJ.DD.AssetIndex.data = {
        version: 1, projectId: 'test', generatedAt: 0,
        assets: {
            'img/doodads/existing.png': {
                id: 'img/doodads/existing.png', path: 'img/doodads/existing.png', fileName: 'existing.png',
                mtimeMs: stat.mtimeMs, sizeBytes: stat.size, tags: ['manual'], favorite: true
            },
            'img/doodads/deleted.png': {
                id: 'img/doodads/deleted.png', path: 'img/doodads/deleted.png', fileName: 'deleted.png', mtimeMs: 1, sizeBytes: 1
            },
            'img/pictures/unscanned.png': {
                id: 'img/pictures/unscanned.png', path: 'img/pictures/unscanned.png', fileName: 'unscanned.png', mtimeMs: 1, sizeBytes: 1
            }
        }, collections: {}, settings: {}
    };
    QJ.DD.AssetIndex.rebuildList();

    const progress = [];
    const result = await QJ.DD.AssetIndex.scanAsync({
        projectRoot: sandbox,
        roots: ['img/doodads'],
        loadCache: false,
        save: false,
        batchSize: 1,
        onProgress(update) { progress.push(update); }
    });

    assert.strictEqual(result.cancelled, false);
    assert.strictEqual(result.discovered, 2);
    assert.strictEqual(result.removed, 1);
    assert(result.unchanged >= 1, 'unchanged assets should reuse cached metadata');
    assert(progress.length >= 2, 'large scans must report progress and yield by batch');
    assert.strictEqual(QJ.DD.AssetIndex.data.assets['img/doodads/existing.png'].favorite, true);
    assert.deepStrictEqual(QJ.DD.AssetIndex.data.assets['img/doodads/existing.png'].tags, ['manual']);
    assert(QJ.DD.AssetIndex.data.assets['img/doodads/new.webp'], 'new WebP should be indexed with a stable relative ID');
    assert(!QJ.DD.AssetIndex.data.assets['img/doodads/deleted.png'], 'missing files in scanned roots should be removed');
    assert(QJ.DD.AssetIndex.data.assets['img/pictures/unscanned.png'], 'partial scans must preserve unscanned roots');

    fs.rmSync(sandbox, { recursive: true, force: true });
    console.log('✓ Cache reuse, stable IDs, progress yielding, WebP, and stale cleanup verified.');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
