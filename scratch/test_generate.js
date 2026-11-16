'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');

E.install();
E.setupWorld();
require('../Docs-Doodads.js');

const D = DocsDoodads;
const G = D.Generate;
assert.ok(G, 'seeded map generator exists in the game build');

const stamp = {
    id: 'cross-room', name: 'Cross Room', w: 5, h: 5,
    doors: [{ x: 0, y: 2, side: 'west' }, { x: 4, y: 2, side: 'east' }, { x: 2, y: 0, side: 'north' }, { x: 2, y: 4, side: 'south' }]
};
const originalRandom = Math.random;
Math.random = () => { throw new Error('generated maps must never use Math.random'); };
let first;
try {
    first = G.dungeon({ w: 40, h: 30, count: 8, seed: 'same place', rooms: [stamp] });
    const again = G.dungeon({ w: 40, h: 30, count: 8, seed: 'same place', rooms: [stamp] });
    assert.deepStrictEqual(again, first, 'the same seed is byte-for-byte deterministic');
    assert.notDeepStrictEqual(G.dungeon({ w: 40, h: 30, count: 8, seed: 'another place', rooms: [stamp] }), first,
        'a different seed changes the dungeon');
} finally {
    Math.random = originalRandom;
}

assert.ok(first.rooms.length >= 2 && first.rooms.length <= 8);
for (let i = 0; i < first.rooms.length; i++) {
    const a = first.rooms[i];
    assert.strictEqual(a.templateId, stamp.id);
    for (let j = i + 1; j < first.rooms.length; j++) {
        const b = first.rooms[j];
        assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y,
            `rooms ${i} and ${j} never overlap`);
    }
}
assert.ok(first.doors.length >= (first.rooms.length - 1) * 2, 'corridors use compatible room-stamp openings');
for (let i = 0; i < first.doors.length; i += 2) {
    if (!first.doors[i + 1]) break;
    assert.strictEqual(G.opposite(first.doors[i].side), first.doors[i + 1].side);
}

const floor = new Set(first.floor.map(p => `${p.x},${p.y}`));
const reached = D.MapCheck.reach(first.entrance, {
    width: first.w, height: first.h, loopX: false, loopY: false,
    canStep(x, y, dir) {
        const row = D.MapCheck.dirs.find(d => d[0] === dir);
        return Boolean(row && floor.has(`${x + row[1]},${y + row[2]}`));
    }
});
assert.ok(first.rooms.every(room => reached.seen[(room.cy * first.w) + room.cx] === 1), 'every room is reachable from the entrance');
assert.strictEqual(reached.seen[first.exit.y * first.w + first.exit.x], 1, 'the exit is reachable');

const tiny = G.dungeon({ w: 8, h: 8, count: 1, seed: 1 });
assert.strictEqual(tiny.rooms.length, 1, 'the smallest supported map can hold one room');
assert.throws(() => G.dungeon({ w: 10000, h: 10000, seed: 1 }), /size|large|limit/i);

const wilderness = G.wilderness({
    w: 24, h: 18, seed: 42,
    biomes: [{ id: 'forest', weight: 3 }, { id: 'meadow', weight: 2 }, { id: 'marsh', weight: 1 }],
    points: [{ x: 1, y: 2 }, { x: 20, y: 4 }, { x: 18, y: 15 }]
});
assert.deepStrictEqual(G.wilderness({
    w: 24, h: 18, seed: 42,
    biomes: [{ id: 'forest', weight: 3 }, { id: 'meadow', weight: 2 }, { id: 'marsh', weight: 1 }],
    points: [{ x: 1, y: 2 }, { x: 20, y: 4 }, { x: 18, y: 15 }]
}), wilderness);
assert.strictEqual(wilderness.biomeIds.length, 24 * 18);
assert.ok(wilderness.biomeIds.every(id => ['forest', 'meadow', 'marsh'].includes(id)));
const path = new Set(wilderness.paths.map(p => `${p.x},${p.y}`));
assert.ok(wilderness.points.every(p => path.has(`${p.x},${p.y}`)), 'every marked point is on the generated path');
for (let i = 1; i < wilderness.paths.length; i++) {
    const a = wilderness.paths[i - 1], b = wilderness.paths[i];
    assert.ok(Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1 || wilderness.points.some(p => p.x === b.x && p.y === b.y),
        'path tiles are contiguous within each marked-point leg');
}

console.log('Generated maps: deterministic BSP rooms, stamp doors, reachability, limits, wilderness noise and paths passed.');
