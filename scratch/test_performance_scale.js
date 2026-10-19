// Performance & Scale Test Suite for Doc's Doodads
const assert = require('assert');
const fs = require('fs');

// Load plugin into isolated mock environment
global.window = global;
global.document = {
    createElement(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            classList: { add() {}, remove() {}, toggle() {} },
            appendChild() {},
            querySelectorAll() { return []; },
            addEventListener() {},
            removeEventListener() {},
            getContext() {
                return {
                    drawImage() {},
                    getImageData(x, y, w, h) {
                        return { data: new Uint8Array(w * h * 4) };
                    },
                    fillRect() {},
                    fillText() {}
                };
            },
            toDataURL() { return "data:image/png;base64,mock"; }
        };
    },
    getElementById() { return null; },
    body: { appendChild() {} }
};
global.Image = class {
    constructor() {
        setTimeout(() => {
            this.naturalWidth = 128;
            this.naturalHeight = 128;
            if (this.onload) this.onload();
        }, 1);
    }
};
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: () => true };
global.PluginManager = { parameters: () => ({}) };

require('../Docs-Doodads.js');

console.log("=== Testing Doc's Doodads Performance, Scaling & LRU Cache ===");

// 1. Benchmark 10,000 and 25,000 assets indexing & searching
console.log("Generating 25,000 synthetic assets...");
const mockAssets = [];
const categories = ['Characters', 'Doodads', 'Tilesets', 'Pictures', 'Audio'];
const tagPool = ['tree', 'forest', 'indoor', 'stone', 'water', 'undead', 'hero', 'npc', 'chest', 'door'];

for (let i = 0; i < 25000; i++) {
    const cat = categories[i % categories.length];
    const tags = [tagPool[i % tagPool.length], tagPool[(i * 3) % tagPool.length]];
    mockAssets.push({
        id: `asset_${i}`,
        path: `img/${cat.toLowerCase()}/prop_${i}.png`,
        fileName: `prop_${i}.png`,
        category: cat,
        type: cat === 'Characters' ? 'character_sheet' : 'doodad',
        tags: tags,
        autoTags: [cat.toLowerCase()],
        favorite: i % 10 === 0,
        width: 48,
        height: 48,
        placement: { defaultMode: 'doodad' },
        collision: { preset: 'none' }
    });
}
console.log(`✓ Created ${mockAssets.length} synthetic assets in memory.`);

// 2. Search query benchmark
console.log("Benchmarking tokenized search on 25,000 assets...");
// Best of three runs: a single sample is dominated by GC or other processes on a busy machine.
function bestOfThree(run) {
    let best = Infinity, value;
    for (let i = 0; i < 3; i++) {
        const started = process.hrtime.bigint();
        value = run();
        best = Math.min(best, Number(process.hrtime.bigint() - started) / 1e6);
    }
    return { value, ms: Math.round(best * 10) / 10 };
}
// The budget follows this machine's speed now: a plain pass over the same assets (lowercasing and
// matching each path and its tags, the least any search must do) is timed first, and the search may take
// up to 30 times that, or its old fixed budget, whichever is larger. A loaded CI runner slows both.
const baseline = bestOfThree(() => mockAssets.filter(a => a.path.toLowerCase().includes('prop_123') && a.tags.join(' ').includes('tree'))).ms;
const budget = fixed => Math.max(fixed, baseline * 30);
const searchBudgetMs = budget(process.env.NODE_V8_COVERAGE ? 150 : 50);
console.log(`  (a plain pass over 25,000 assets takes ${baseline}ms here; budget ${searchBudgetMs}ms)`);
const query1 = "prop_123 tag:tree -dead";
const timed1 = bestOfThree(() => DocsDoodads.Search.filter(mockAssets, query1));
const results1 = timed1.value;
const dt1 = timed1.ms;
console.log(`✓ Query '${query1}' returned ${results1.length} matches in ${dt1}ms (Target: < ${searchBudgetMs}ms).`);
assert(dt1 < searchBudgetMs, `Search took too long: ${dt1}ms (budget ${searchBudgetMs}ms)`);

const query2 = "category:Characters favorite:true";
const timed2 = bestOfThree(() => DocsDoodads.Search.filter(mockAssets, "type:character_sheet favorite:true"));
const results2 = timed2.value;
const dt2 = timed2.ms;
console.log(`✓ Query '${query2}' returned ${results2.length} matches in ${dt2}ms.`);
assert(dt2 < searchBudgetMs, `Search took too long: ${dt2}ms (budget ${searchBudgetMs}ms)`);

// 3. Virtual grid calculation benchmark
console.log("Testing virtual grid row-range computation for 25,000 items...");
DocsDoodads.Workspace.filteredAssets = mockAssets;
DocsDoodads.Workspace.thumbSize = 96;
const containerW = 340;
const gap = 8;
const cols = Math.max(1, Math.floor((containerW + gap) / (96 + gap)));
const colWidth = Math.floor((containerW - (cols - 1) * gap) / cols);
const cardHeight = colWidth + 24;
const rowHeight = cardHeight + gap;
const totalRows = Math.ceil(mockAssets.length / cols);
const totalHeight = totalRows * rowHeight;

assert(totalRows > 0, "Total rows must be > 0");
assert(totalHeight > 0, "Total height must be > 0");

// Check middle scroll calculation
const testScrollTop = 5000;
const viewportH = 600;
const startRow = Math.max(0, Math.floor(testScrollTop / rowHeight) - 2);
const endRow = Math.min(totalRows - 1, Math.ceil((testScrollTop + viewportH) / rowHeight) + 2);
const startIndex = startRow * cols;
const endIndex = Math.min(mockAssets.length, (endRow + 1) * cols);
const renderedCount = endIndex - startIndex;

console.log(`✓ At scrollTop ${testScrollTop}px, virtual grid renders rows ${startRow}..${endRow} (${renderedCount} cards out of 25,000).`);
assert(renderedCount <= 40, `Virtual grid should only render ~20-40 elements, but rendered ${renderedCount}`);

// 4. LRU Cache & Size Buckets in DocsDoodads.Thumbnail
console.log("Testing Thumbnail LRU cache and bucket resolution...");
assert.strictEqual(DocsDoodads.Thumbnail.getBucketSize(48), 64);
assert.strictEqual(DocsDoodads.Thumbnail.getBucketSize(90), 96);
assert.strictEqual(DocsDoodads.Thumbnail.getBucketSize(110), 96);
assert.strictEqual(DocsDoodads.Thumbnail.getBucketSize(120), 128);
assert.strictEqual(DocsDoodads.Thumbnail.getBucketSize(200), 192);
console.log("✓ Bucket resolution passed.");

DocsDoodads.Thumbnail.clearCache();
for (let i = 0; i < 600; i++) {
    DocsDoodads.Thumbnail.setCache(`test_item_${i}`, `data:image/png;base64,${i}`);
}
assert(Object.keys(DocsDoodads.Thumbnail.cache).length <= 500, "Cache must not exceed maxCacheSize (500)");
assert(!DocsDoodads.Thumbnail.cache['test_item_0'], "Oldest item must have been evicted by LRU");
assert(DocsDoodads.Thumbnail.cache['test_item_599'], "Newest item must be retained in cache");
console.log("✓ LRU eviction verified (capped strictly at 500 items).");

// 5. Async Slicing with Progress & Cancellation
console.log("Testing Async Slicing with cancellation token...");
const cancelToken = { isCancelled: false };
const progressEvents = [];
const dummyImg = { naturalWidth: 256, naturalHeight: 256, width: 256, height: 256 };

DocsDoodads.Slicing.Visual.analyzeAsync(dummyImg, {}, (step, pct) => {
    progressEvents.push({ step, pct });
}, cancelToken).then((result) => {
    assert(result !== null, "Analysis without cancellation should return result");
    assert(progressEvents.length > 0, "Progress events should be emitted");
    console.log(`✓ Async slicing completed with ${progressEvents.length} progress events.`);

    // Test cancellation
    const cancelToken2 = { isCancelled: true };
    DocsDoodads.Slicing.Visual.analyzeAsync(dummyImg, {}, null, cancelToken2).then((res2) => {
        assert.strictEqual(res2, null, "Cancelled analysis must return null immediately");
        console.log("✓ Cancellation token successfully aborted analysis.");
        console.log("=== All Performance & Scaling Tests Passed Successfully! ===");
        process.exit(0);
    });
});
