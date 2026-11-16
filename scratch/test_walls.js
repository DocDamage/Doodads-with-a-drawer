// Fine-cell collision walls: compact persistence, tile blocking, loop wrapping, alpha import,
// and one undo step for a complete editor brush stroke.
const assert = require('assert');

console.log('=== Testing Collision Walls ===');

global.window = global;
global.document = {
    body: { appendChild() {} }, documentElement: { style: { setProperty() {} } },
    createElement: () => ({ style: {}, appendChild() {}, getContext: () => null }),
    getElementById: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: option => option === 'test' };
global.PluginManager = { parameters: () => ({}) };

let mapId = 1;
const MAP_W = 3, MAP_H = 2, TILE = 48;
global.$gameMap = {
    mapId: () => mapId, width: () => MAP_W, height: () => MAP_H,
    tileWidth: () => TILE, tileHeight: () => TILE,
    isLoopHorizontal: () => false, isLoopVertical: () => false,
    displayX: () => 0, displayY: () => 0, adjustX: x => x, adjustY: y => y,
    roundX: x => x, roundY: y => y
};
global.$dataDocsDoodads = {};
global.Graphics = { width: MAP_W * TILE, height: MAP_H * TILE };

require('../Docs-Doodads.js');
const D = DocsDoodads;
const W = D.Walls;

// 1. The disk form is row-oriented RLE and decodes without changing the cells.
{
    const grid = W.blank(8, 3, 12);
    W.setCell(grid, 0, 0, true);
    W.setCell(grid, 1, 0, true);
    W.setCell(grid, 5, 0, true);
    W.setCell(grid, 7, 2, true);
    const saved = W.encode(grid);
    assert.deepStrictEqual(Object.keys(saved), ['cell', 'w', 'h', 'rows']);
    assert.strictEqual(saved.rows.length, 3);
    assert.ok(saved.rows.every(row => typeof row === 'string') && saved.rows.some(row => /[.#]/.test(row)));
    assert.deepStrictEqual(W.encode(W.decode(saved)), saved, 'encode/decode round trip');
    assert.strictEqual(W.cellAt(W.decode(saved), 12, 0), true);
    assert.strictEqual(W.cellAt(W.decode(saved), 24, 0), false);
    console.log('PASS walls encode/decode round trip');
}

// 2. More than half of a tile's fine cells blocks it; exactly half does not.
{
    const grid = W.blank(8, 4, 12); // two 48px tiles, four-by-four cells each
    for (let i = 0; i < 8; i++) W.setCell(grid, i % 4, Math.floor(i / 4), true);
    assert.strictEqual(W.blocksTile(grid, 0, 0, 48, 48), false, 'exactly 8/16 is open');
    W.setCell(grid, 0, 2, true);
    assert.strictEqual(W.blocksTile(grid, 0, 0, 48, 48), true, '9/16 blocks');
    assert.strictEqual(W.blocksTile(grid, 1, 0, 48, 48), false);
    assert.strictEqual(W.blocksRect(grid, 1, 1, 10, 10), true);
    assert.strictEqual(W.blocksRect(grid, 60, 1, 10, 10), false);
    console.log('PASS walls half-tile and rectangle rules');
}

// 3. Fine cells and brushes wrap at the edges of looping maps.
{
    const grid = W.blank(4, 3, 12, { loopX: true, loopY: true });
    W.setCell(grid, 0, 0, true);
    assert.strictEqual(W.cellAt(grid, 48, 0), true, 'right edge wraps');
    assert.strictEqual(W.cellAt(grid, -12, -12), false);
    W.setCell(grid, 3, 2, true);
    assert.strictEqual(W.cellAt(grid, -1, -1), true, 'left and top wrap');
    const cells = W.brushCells(grid, 0, 0, 1, 'square');
    assert.ok(cells.some(c => c.x === 3 && c.y === 2), 'brush crosses both seams');
    console.log('PASS looping wall cells and brush');
}

// 4. Fill stays inside a painted outline, and picture alpha can make a wall grid.
{
    const grid = W.blank(5, 5, 12);
    for (let i = 0; i < 5; i++) {
        W.setCell(grid, i, 0, true); W.setCell(grid, i, 4, true);
        W.setCell(grid, 0, i, true); W.setCell(grid, 4, i, true);
    }
    assert.strictEqual(W.fill(grid, 2, 2, true), 9, 'closed centre filled');
    assert.strictEqual(W.fill(grid, 2, 2, true), 0, 'same fill changes nothing');

    const rgba = new Uint8ClampedArray(4 * 4 * 4);
    rgba[(1 * 4 + 2) * 4 + 3] = 200;
    rgba[(2 * 4 + 2) * 4 + 3] = 40;
    const alphaGrid = W.fromAlpha(rgba, 4, 4, { cell: 1, mapWidth: 4, mapHeight: 4, threshold: 128 });
    assert.strictEqual(W.cellAt(alphaGrid, 2, 1), true);
    assert.strictEqual(W.cellAt(alphaGrid, 2, 2), false, 'under the threshold stays open');
    console.log('PASS closed-shape fill and picture alpha import');
}

// 5. Runtime collision consults painted walls even when the map has no doodads.
{
    const grid = W.blank(MAP_W * 4, MAP_H * 4, 12);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) W.setCell(grid, x, y, true);
    W.set(1, grid);
    assert.deepStrictEqual($dataDocsDoodads[1], undefined, 'there are no doodads');
    assert.strictEqual(D.Collision.blocksTile(0, 0, false, null, 2), true);
    assert.strictEqual(D.Collision.blocksTile(1, 0, false, null, 2), false);
    console.log('PASS runtime collision blocks without doodads');
}

// 6. A full editor stroke is one undo step; erase and undo update the saved wall data.
{
    const ws = D.Workspace;
    D.Undo.clear();
    ws.currentMapId = () => mapId;
    ws.wallBrush = { radius: 0, shape: 'round', mode: 'paint' };
    let at = { x: 18, y: 18 };
    ws.clientToMapCoords = () => ({ x: at.x, y: at.y, tileX: 0, tileY: 0 });
    const depth = D.Undo.undoStack.length;
    assert.strictEqual(ws.beginWallStroke({ button: 0, clientX: 0, clientY: 0 }), true);
    at = { x: 42, y: 18 };
    ws.paintWallsAt({ clientX: 0, clientY: 0, shiftKey: false });
    assert.strictEqual(ws.endWallStroke(), true);
    assert.strictEqual(D.Undo.undoStack.length, depth + 1, 'one step, not one per dab');
    assert.strictEqual(D.Undo.labelFor(D.Undo.undoStack[depth]), 'Collision brush stroke');
    assert.strictEqual(W.cellAt(W.get(1), 18, 18), true);
    assert.strictEqual(W.cellAt(W.get(1), 42, 18), true);
    D.Undo.undo();
    assert.strictEqual(W.get(1), null, 'undo removes the first map wall key');
    D.Undo.redo();
    assert.strictEqual(W.cellAt(W.get(1), 42, 18), true);
    console.log('PASS collision brush stroke is one undo step');
}

// 7. Empty maps write no walls key; split map files carry walls and still read old array-only files.
{
    W.set(1, W.blank(MAP_W * 4, MAP_H * 4, 12));
    assert.ok(!$dataDocsDoodads.walls, 'empty walls remove the top-level key');
    assert.ok(!('walls' in D.DataFiles.entriesFor($dataDocsDoodads, false)[0].data));

    const grid = W.blank(MAP_W * 4, MAP_H * 4, 12);
    W.setCell(grid, 1, 1, true);
    W.set(1, grid);
    $dataDocsDoodads[2] = [{ uid: 'old-map-file' }];
    const entries = D.DataFiles.entriesFor($dataDocsDoodads, true);
    assert.deepStrictEqual(entries[0].data._mapFiles, [1, 2]);
    assert.ok(!entries[0].data.walls, 'per-map walls leave the main split file');
    const files = Object.fromEntries(entries.map(entry => [entry.path, entry.data]));
    assert.ok(files[D.DataFiles.mapPath(1)].walls, 'wall is in its map file');
    assert.ok(Array.isArray(files[D.DataFiles.mapPath(2)]), 'unchanged maps keep the legacy array form');
    const merged = D.DataFiles.merge(files[D.DataFiles.mainPath()], id => files[D.DataFiles.mapPath(id)]);
    assert.deepStrictEqual(merged[2], [{ uid: 'old-map-file' }]);
    assert.strictEqual(W.cellAt(W.decode(merged.walls[1]), 12, 12), true);
    console.log('PASS no empty key and split/legacy persistence');
}

assert.ok(D.Workspace.toolHooks.walls && D.Workspace.toolHooks.walls.buttons.includes(2), 'wall tool accepts right-drag erase');
assert.strictEqual(D.Workspace.toolButtons.walls, 'dd-walls-btn');
assert.strictEqual(D.Workspace.brushSizeSteps.walls[0], 'dd-walls-size');
console.log('PASS collision wall tool is registered');
console.log('All collision wall tests passed.');
