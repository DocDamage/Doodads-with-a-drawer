// Phase 12 responsiveness regression: filesystem work yields between files and a
// cancelled folder import rolls back files already copied by the batch.
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

require('../Docs-Doodads.js');

async function main() {
    console.log('=== Testing Responsive Asset Import ===');
    assert.strictEqual(typeof DocsDoodads.Import.executeBatchAsync, 'function');

    const sandbox = path.join(__dirname, 'asset_import_async_fixture');
    const source = path.join(sandbox, 'source');
    const project = path.join(sandbox, 'project');
    fs.rmSync(sandbox, { recursive: true, force: true });
    fs.mkdirSync(source, { recursive: true });

    try {
        const sources = [];
        for (let index = 0; index < 8; index++) {
            const file = path.join(source, `asset-${index}.png`);
            fs.writeFileSync(file, `asset ${index}`);
            sources.push(file);
        }

        const plan = DocsDoodads.Import.planBatch(sources, {
            projectRoot: project,
            destination: 'img/doodads',
            collisionPolicy: 'rename'
        });
        const cancellationToken = { cancelled: false };
        const progress = [];
        const result = await DocsDoodads.Import.executeBatchAsync(plan, {
            cancellationToken,
            onProgress(update) {
                progress.push(update);
                if (update.completed === 3) cancellationToken.cancelled = true;
            }
        });

        assert.strictEqual(result.ok, false);
        assert.strictEqual(result.cancelled, true);
        assert.strictEqual(result.rolledBack, true);
        assert(progress.length >= 3, 'progress should be reported incrementally');
        for (let index = 0; index < 8; index++) {
            assert.strictEqual(fs.existsSync(path.join(project, 'img', 'doodads', `asset-${index}.png`)), false);
        }
        console.log('✓ Incremental progress, cancellation, and cross-yield rollback verified.');
    } finally {
        fs.rmSync(sandbox, { recursive: true, force: true });
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
