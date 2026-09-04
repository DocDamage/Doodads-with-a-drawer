// Test advanced algorithms: Otsu adaptive threshold, Gutter splitting, Undo/Redo, Event Templates
const assert = require('assert');

console.log("=== Testing Advanced Slicing & Operations Algorithms ===");

// 1. Otsu Adaptive Alpha Threshold
function computeOtsuAlphaThreshold(alphaArray) {
    const histogram = new Int32Array(256);
    let total = 0;
    for (let i = 0; i < alphaArray.length; i++) {
        const a = alphaArray[i];
        if (a > 0) { // Only consider non-zero pixels
            histogram[a]++;
            total++;
        }
    }
    if (total === 0) return 10; // default fallback

    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 10;

    for (let t = 0; t < 256; t++) {
        wB += histogram[t];
        if (wB === 0) continue;
        wF = total - wB;
        if (wF === 0) break;

        sumB += t * histogram[t];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;

        const varianceBetween = wB * wF * (mB - mF) * (mB - mF);
        if (varianceBetween > maxVariance) {
            maxVariance = varianceBetween;
            threshold = t;
        }
    }
    return Math.max(8, threshold);
}

// Test Otsu: synthetic image with faint alpha noise (alpha=10) and real solid content (alpha=240..255)
const noisyAlpha = new Uint8Array(1000);
// 400 faint noise pixels
for (let i = 0; i < 400; i++) noisyAlpha[i] = 12;
// 600 solid content pixels
for (let i = 400; i < 1000; i++) noisyAlpha[i] = 250;

const thresh = computeOtsuAlphaThreshold(noisyAlpha);
assert(thresh >= 12 && thresh < 250, `Threshold ${thresh} should separate 12 from 250`);
console.log(`✓ Otsu Adaptive Alpha Threshold passed (calculated threshold: ${thresh}).`);

// 2. Gutter Splitting (Vertical and Horizontal)
function detectVerticalGutters(binaryGrid, width, height, minGutterWidth = 2, maxOccupancyRatio = 0.05) {
    const colOccupancy = new Int32Array(width);
    for (let x = 0; x < width; x++) {
        let count = 0;
        for (let y = 0; y < height; y++) {
            if (binaryGrid[y * width + x]) count++;
        }
        colOccupancy[x] = count;
    }

    const gutters = [];
    let inGutter = false;
    let gutterStart = 0;

    for (let x = 0; x < width; x++) {
        const ratio = colOccupancy[x] / height;
        if (ratio <= maxOccupancyRatio) {
            if (!inGutter) {
                inGutter = true;
                gutterStart = x;
            }
        } else {
            if (inGutter) {
                inGutter = false;
                const gWidth = x - gutterStart;
                if (gWidth >= minGutterWidth && gutterStart > 2 && x < width - 2) {
                    gutters.push({ startX: gutterStart, endX: x, splitX: Math.floor((gutterStart + x) / 2) });
                }
            }
        }
    }
    return gutters;
}

// Create a 30x10 grid with sprite A (cols 0..10), empty gutter (cols 11..18), sprite B (cols 19..29)
const grid30x10 = new Uint8Array(30 * 10);
for (let y = 0; y < 10; y++) {
    for (let x = 0; x <= 10; x++) grid30x10[y * 30 + x] = 1;
    for (let x = 19; x <= 29; x++) grid30x10[y * 30 + x] = 1;
}

const vGutters = detectVerticalGutters(grid30x10, 30, 10, 2);
assert.strictEqual(vGutters.length, 1);
assert.strictEqual(vGutters[0].startX, 11);
assert.strictEqual(vGutters[0].endX, 19);
assert.strictEqual(vGutters[0].splitX, 15);
console.log("✓ Gutter Splitting passed.");

// 3. Command-based Undo / Redo Manager
class UndoRedoManager {
    constructor(maxDepth = 300) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxDepth = maxDepth;
    }

    execute(command) {
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = []; // clear redo on new action
    }

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
        return true;
    }

    redo() {
        if (this.redoStack.length === 0) return false;
        const cmd = this.redoStack.pop();
        cmd.apply();
        this.undoStack.push(cmd);
        return true;
    }
}

// Test Undo/Redo with a doodad position command
let doodadPos = { x: 100, y: 100 };
const undoMgr = new UndoRedoManager();

const moveCmd = {
    before: { x: 100, y: 100 },
    after: { x: 250, y: 350 },
    apply() { doodadPos.x = this.after.x; doodadPos.y = this.after.y; },
    revert() { doodadPos.x = this.before.x; doodadPos.y = this.before.y; }
};

undoMgr.execute(moveCmd);
assert.deepStrictEqual(doodadPos, { x: 250, y: 350 });

undoMgr.undo();
assert.deepStrictEqual(doodadPos, { x: 100, y: 100 });

undoMgr.redo();
assert.deepStrictEqual(doodadPos, { x: 250, y: 350 });
console.log("✓ Command-based Undo / Redo passed.");

// 4. Built-in Event Template Expansion Test
function instantiateEventFromTemplate(template, eventId, mapX, mapY, graphic) {
    const base = JSON.parse(JSON.stringify(template.event));
    base.id = eventId;
    base.x = mapX;
    base.y = mapY;
    if (graphic && base.pages && base.pages[0]) {
        base.pages[0].image.characterName = graphic.characterName || "";
        base.pages[0].image.characterIndex = graphic.characterIndex || 0;
    }
    return base;
}

const mockNpcTemplate = {
    id: "npc",
    name: "NPC",
    event: {
        id: 0,
        name: "EV_NPC",
        x: 0,
        y: 0,
        pages: [{
            conditions: { switch1Valid: false },
            image: { characterIndex: 0, characterName: "", direction: 2, pattern: 1 },
            moveRoute: { list: [{ code: 0 }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3,
            moveFrequency: 3,
            moveType: 0,
            priorityType: 1, // Same as characters
            stepAnime: false,
            trigger: 0, // Action button
            walkAnime: true,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] }, // Show Text
                { code: 401, indent: 0, parameters: ["Hello, traveler!"] },
                { code: 0, indent: 0, parameters: [] }
            ]
        }]
    }
};

const createdEvent = instantiateEventFromTemplate(mockNpcTemplate, 14, 5, 8, {
    characterName: "Actor1",
    characterIndex: 2
});

assert.strictEqual(createdEvent.id, 14);
assert.strictEqual(createdEvent.x, 5);
assert.strictEqual(createdEvent.y, 8);
assert.strictEqual(createdEvent.pages[0].image.characterName, "Actor1");
assert.strictEqual(createdEvent.pages[0].image.characterIndex, 2);
console.log("✓ Event Template Expansion passed.");

console.log("=== All Advanced Algorithms Verified! ===");
