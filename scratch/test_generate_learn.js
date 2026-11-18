'use strict';
// 8.3.3 More like this: a checkerboard sample gives a checkerboard; the same seed gives the same fill; every filled
// tile's neighbours were seen in the sample; a sample too small says so; doodads come by the learned density and
// spacing; the tool learns a box, fills a region against what is round it, and applies as one Undo step.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-learn-')));
E.install();
E.setupWorld({ width: 24, height: 16, px: 1, py: 1 });
require('../Docs-Doodads.js');
const D = DocsDoodads, G = D.Generate;
const GRASS = 2816, DIRT = 2864, SAND = 1550;

// ---- Pure ----
assert.ok(G.learn({ w: 1, h: 3, tiles: [1, 2, 3] }).error, 'a sample too small says so');
const checker = { w: 4, h: 4, tiles: [] };
for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) checker.tiles.push((x + y) % 2 ? GRASS + 5 : SAND);
const m = G.learn(checker);
assert.deepStrictEqual(m.kinds.sort(), [G.kindOf(GRASS), 't' + SAND].sort(), 'autotiles learned by kind, not shape');
const filled = G.fill({ w: 9, h: 7 }, m, G.rng(4));
assert.ok(filled.cells, 'filled');
for (let y = 0; y < 7; y++) for (let x = 0; x < 9; x++) {
    if (x + 1 < 9) assert.notStrictEqual(filled.cells[y * 9 + x], filled.cells[y * 9 + x + 1], 'a checkerboard gives a checkerboard');
    if (y + 1 < 7) assert.notStrictEqual(filled.cells[y * 9 + x], filled.cells[(y + 1) * 9 + x]);
}
// A patchy sample: grass with a dirt path down the middle.
const patch = { w: 6, h: 6, tiles: [], doodads: [{ path: 'img/doodads/Tree.png', x: 0, y: 0 }, { path: 'img/doodads/Tree.png', x: 5, y: 5 }, { path: 'img/doodads/Tree.png', x: 0, y: 5 }] };
for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) patch.tiles.push(x === 2 || x === 3 ? DIRT : GRASS);
const pm = G.learn(patch);
assert.ok(Math.abs(pm.biome[G.kindOf(GRASS)]['img/doodads/Tree.png'].density - 3 / 24) < 1e-9, 'doodads learned per ground kind');
assert.strictEqual(pm.biome[G.kindOf(GRASS)]['img/doodads/Tree.png'].spacing, 5);
const a = G.fill({ w: 12, h: 8 }, pm, G.rng('x')), b = G.fill({ w: 12, h: 8 }, pm, G.rng('x'));
assert.deepStrictEqual(a.cells, b.cells, 'the same seed gives the same fill');
const seen = (k1, d, k2) => G.allowed(pm, k1, d, k2);
for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) {
    G.dirs.forEach(([dx, dy], d) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= 12 || ny >= 8) return;
        assert.ok(seen(a.cells[y * 12 + x], d, a.cells[ny * 12 + nx]), 'every neighbour pair was seen in the sample');
    });
}
const trees = G.scatterLearned(a.cells, 12, 8, pm, G.rng(2));
assert.ok(trees.every(t => a.cells[t.y * 12 + t.x] === G.kindOf(GRASS)), 'trees only on grass');
for (const t of trees) for (const o of trees) if (t !== o) assert.ok(Math.hypot(t.x - o.x, t.y - o.y) >= 5, 'at the learned spacing');
assert.ok(G.fill({ w: 3, h: 3 }, { error: 'x' }, G.rng(1)).error);
// Fixed tiles round the region are respected: dirt beside dirt only where seen.
const dirt = G.kindOf(DIRT);
const fixed = G.fill({ w: 4, h: 4, fixed: (x) => (x < 0 ? dirt : null) }, pm, G.rng(9));
assert.ok(fixed.cells, 'fits beside the tiles round it');
for (let y = 0; y < 4; y++) assert.ok(G.allowed(pm, dirt, 0, fixed.cells[y * 4]), 'the first column fits the fixed tiles');

// ---- The tool ----
const W = D.Workspace;
W.mounted = true; W.showToast = () => {};
for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) $dataMap.data[y * 24 + x] = patch.tiles[y * 6 + x];
for (let y = 4; y < 10; y++) for (let x = 10; x < 18; x++) $dataMap.data[y * 24 + x] = SAND; // the region to fill starts as sand
$gameMap._stagedMapData = { width: 24, height: 16, data: $dataMap.data.slice(), events: [null] };
$gameMap._stagedMapDataId = 1;
$dataDocsDoodads[1] = [E.doodad(0, 0, { uid: 't1' }), E.doodad(5, 5, { uid: 't2' })];
W.startMoreLike();
assert.ok(W.moreLikeDrop({ x: 0, y: 0, w: 6, h: 6 }), 'learned');
const r = W.moreLikeDrop({ x: 10, y: 4, w: 8, h: 6 });
assert.ok(r && r.cells, 'filled the region');
const before = $dataMap.data.slice();
const count = $dataDocsDoodads[1].length;
assert.ok(W.applyMoreLike());
assert.ok($dataMap.data.some((v, i) => v !== before[i]), 'tiles painted');
const added = $dataDocsDoodads[1].length - count;
D.Undo.undo();
assert.deepStrictEqual($dataMap.data, before, 'one Undo step takes the tiles back');
assert.strictEqual($dataDocsDoodads[1].length, count, 'and the doodads');
D.Undo.redo();
assert.strictEqual($dataDocsDoodads[1].length, count + added);
W.closeMoreLike();
console.log('test_generate_learn: OK');
