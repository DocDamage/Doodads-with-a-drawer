// Test script for core QJ Doodads Asset Workspace algorithms
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== Testing QJ Doodads Asset Workspace Algorithms ===");

// 1. Search Token Parser Test
function parseSearchQuery(query) {
    const tokens = {
        terms: [],
        negativeTerms: [],
        filters: {}
    };
    if (!query || typeof query !== 'string') return tokens;
    const parts = query.trim().split(/\s+/);
    for (const part of parts) {
        if (!part) continue;
        if (part.startsWith('-')) {
            tokens.negativeTerms.push(part.slice(1).toLowerCase());
        } else if (part.includes(':')) {
            const [key, ...valParts] = part.split(':');
            const val = valParts.join(':').toLowerCase();
            tokens.filters[key.toLowerCase()] = val;
        } else {
            tokens.terms.push(part.toLowerCase());
        }
    }
    return tokens;
}

function matchAsset(asset, tokens) {
    const fullText = (asset.fileName + " " + (asset.tags || []).join(" ") + " " + (asset.category || "")).toLowerCase();
    
    // Negative terms check (word/token boundary match to avoid -dead matching 'undead')
    const tokensInText = fullText.split(/[\s_\-\.\/\\]+/);
    for (const neg of tokens.negativeTerms) {
        if (tokensInText.includes(neg)) return false;
    }
    
    // Filter checks
    if (tokens.filters.type && asset.type !== tokens.filters.type) {
        if (tokens.filters.type !== (asset.category || "").toLowerCase()) return false;
    }
    if (tokens.filters.favorite && String(asset.favorite) !== tokens.filters.favorite) {
        return false;
    }
    if (tokens.filters.animated && String(Boolean(asset.animationGroups && asset.animationGroups.length > 0)) !== tokens.filters.animated) {
        return false;
    }
    if (tokens.filters.tag) {
        const requiredTag = tokens.filters.tag;
        const tags = (asset.tags || []).map(t => t.toLowerCase());
        if (!tags.includes(requiredTag)) return false;
    }
    
    // Positive terms check (all must match somewhere in fullText or fuzzy)
    for (const term of tokens.terms) {
        if (!fullText.includes(term)) {
            // Check simple subsequence fuzzy match
            let tIdx = 0;
            for (let i = 0; i < fullText.length && tIdx < term.length; i++) {
                if (fullText[i] === term[tIdx]) tIdx++;
            }
            if (tIdx < term.length) return false;
        }
    }
    return true;
}

// Test Search
const q1 = parseSearchQuery("ske kni type:character -dead favorite:true");
assert.deepStrictEqual(q1.terms, ["ske", "kni"]);
assert.deepStrictEqual(q1.negativeTerms, ["dead"]);
assert.strictEqual(q1.filters.type, "character");
assert.strictEqual(q1.filters.favorite, "true");

const mockAsset1 = {
    fileName: "Skeleton_Knight.png",
    category: "Characters",
    type: "character",
    tags: ["undead", "skeleton", "knight"],
    favorite: true,
    animationGroups: []
};
const mockAsset2 = {
    fileName: "Dead_Skeleton.png",
    category: "Characters",
    type: "character",
    tags: ["undead", "skeleton", "dead"],
    favorite: true,
    animationGroups: []
};
assert.strictEqual(matchAsset(mockAsset1, q1), true);
assert.strictEqual(matchAsset(mockAsset2, q1), false); // Rejected by -dead
console.log("✓ Search Token Parser and Matcher passed.");

// 2. Safe Event ID Allocator Test
function allocateSafeEventId(mapData) {
    if (!mapData || !mapData.events) return 1;
    const used = new Set();
    for (let i = 1; i < mapData.events.length; i++) {
        if (mapData.events[i]) {
            used.add(mapData.events[i].id || i);
        }
    }
    let id = 1;
    while (used.has(id)) {
        id++;
    }
    return id;
}

const mockMapData = {
    events: [
        null,
        { id: 1, name: "EV001" },
        { id: 2, name: "EV002" },
        null, // Hole in array!
        { id: 4, name: "EV004" }
    ]
};
assert.strictEqual(allocateSafeEventId(mockMapData), 3); // Must reuse hole ID 3
console.log("✓ Safe Event ID Allocator passed.");

// 3. Grid Divisor Candidate Scoring Test
function scoreGridCandidates(width, height) {
    const candidates = [];
    const commonCellSizes = [16, 24, 32, 48, 64, 96, 128];
    for (const cellW of commonCellSizes) {
        if (width % cellW === 0) {
            for (const cellH of commonCellSizes) {
                if (height % cellH === 0) {
                    const cols = width / cellW;
                    const rows = height / cellH;
                    // Score based on common MZ patterns
                    let score = 50;
                    if (cols === 3 && rows === 4) score = 95; // $Single character sheet
                    else if (cols === 12 && rows === 8) score = 98; // Standard 8-char sheet
                    else if (cols === 4 && rows === 2) score = 90; // Face sheet
                    else if (cols === 9 && rows === 6) score = 92; // SV battler
                    else if (cols === 16) score = 85; // IconSet or Tileset line
                    candidates.push({ cols, rows, cellW, cellH, score });
                }
            }
        }
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates;
}

// 576 x 384 = standard MZ 8-character sheet (each char is 3x4 cells of 48x48, total cols=12, rows=8)
const mzCharCandidates = scoreGridCandidates(576, 384);
assert.strictEqual(mzCharCandidates[0].cols, 12);
assert.strictEqual(mzCharCandidates[0].rows, 8);
assert.strictEqual(mzCharCandidates[0].cellW, 48);
assert.strictEqual(mzCharCandidates[0].cellH, 48);
console.log("✓ Grid Divisor Candidate Scoring passed.");

// 4. Connected Components & Bounding Boxes Test (Synthetic 2D Alpha Grid)
function findConnectedComponents(alphaGrid, width, height, minArea = 4) {
    const visited = new Uint8Array(width * height);
    const components = [];
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (alphaGrid[idx] === 0 || visited[idx]) continue;
            
            // Breadth-first flood fill
            let minX = x, maxX = x, minY = y, maxY = y;
            let pixelCount = 0;
            const queue = [x, y];
            visited[idx] = 1;
            
            let qHead = 0;
            while (qHead < queue.length) {
                const cx = queue[qHead++];
                const cy = queue[qHead++];
                pixelCount++;
                
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;
                
                // 4-neighborhood
                const neighbors = [
                    [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                ];
                for (const [nx, ny] of neighbors) {
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nIdx = ny * width + nx;
                        if (!visited[nIdx] && alphaGrid[nIdx] > 0) {
                            visited[nIdx] = 1;
                            queue.push(nx, ny);
                        }
                    }
                }
            }
            
            if (pixelCount >= minArea) {
                components.push({
                    x: minX,
                    y: minY,
                    w: maxX - minX + 1,
                    h: maxY - minY + 1,
                    pixelCount
                });
            }
        }
    }
    return components;
}

// Create a 20x20 test image with two distinct boxes: Box 1 at (2,2, 4x4), Box 2 at (10,10, 5x5)
const testWidth = 20, testHeight = 20;
const testAlpha = new Uint8Array(testWidth * testHeight);
// Fill Box 1
for (let y = 2; y <= 5; y++) {
    for (let x = 2; x <= 5; x++) {
        testAlpha[y * testWidth + x] = 255;
    }
}
// Fill Box 2
for (let y = 10; y <= 14; y++) {
    for (let x = 10; x <= 14; x++) {
        testAlpha[y * testWidth + x] = 255;
    }
}

const comps = findConnectedComponents(testAlpha, testWidth, testHeight, 4);
assert.strictEqual(comps.length, 2);
assert.strictEqual(comps[0].x, 2);
assert.strictEqual(comps[0].y, 2);
assert.strictEqual(comps[0].w, 4);
assert.strictEqual(comps[0].h, 4);
assert.strictEqual(comps[1].x, 10);
assert.strictEqual(comps[1].y, 10);
assert.strictEqual(comps[1].w, 5);
assert.strictEqual(comps[1].h, 5);
console.log("✓ Connected Components labeling passed.");

// 5. Atomic Write & Conflict Detection Test
const testDir = path.join(__dirname, 'test_atomic');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
const targetFile = path.join(testDir, 'Map001.json');
fs.writeFileSync(targetFile, JSON.stringify({ title: "Original Map" }));

const sessionSnapshot = {
    mtimeMs: fs.statSync(targetFile).mtimeMs,
    size: fs.statSync(targetFile).size
};

function checkConflict(filePath, snapshot) {
    if (!fs.existsSync(filePath)) return false;
    const currentStat = fs.statSync(filePath);
    return currentStat.mtimeMs !== snapshot.mtimeMs || currentStat.size !== snapshot.size;
}

function atomicWriteJson(filePath, data) {
    const tmpPath = filePath + '.tmp';
    const jsonStr = JSON.stringify(data, null, 2);
    // Validate JSON before write
    JSON.parse(jsonStr);
    fs.writeFileSync(tmpPath, jsonStr, 'utf8');
    fs.renameSync(tmpPath, filePath);
}

// Conflict should be false initially
assert.strictEqual(checkConflict(targetFile, sessionSnapshot), false);

// Save safely
atomicWriteJson(targetFile, { title: "Updated Map by Workspace" });
const updatedContent = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
assert.strictEqual(updatedContent.title, "Updated Map by Workspace");

// Cleanup test dir
fs.rmSync(testDir, { recursive: true, force: true });
console.log("✓ Atomic Write and Conflict Detection passed.");

console.log("=== All Core Algorithm Tests Passed Successfully! ===");
