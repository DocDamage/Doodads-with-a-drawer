'use strict';
// 8.4.7 A robot tester: following transfers without playing (dead ends, one-way doors, unreachable maps, bad
// landings, transfers by variables, loops that end), MZ's passage rules, the frame-limited runner and the card.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-robot-')));
E.install();
E.setupWorld({ width: 6, height: 6, px: 1, py: 1 });
require('../Docs-Doodads.js');
const D = DocsDoodads, R = D.Robot, W = D.Workspace;

const FLOOR = 2816, WALL = 1536;
const flags = []; flags[FLOOR] = 0; flags[WALL] = 0x0f;
// A 6 × 6 map of floor with walls where rows say '#'.
const makeMap = (rows, events = []) => {
    const w = rows[0].length, h = rows.length, data = new Array(w * h * 6).fill(0);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { data[y * w + x] = ch === '#' ? WALL : FLOOR; }));
    return { width: w, height: h, scrollType: 0, tilesetId: 1, data, events: [null].concat(events) };
};
const transfer = (id, x, y, toMap, tx, ty, variables) => ({ id, name: 'Door', x, y, pages: [{ trigger: 0, priorityType: 0, image: { tileId: 0 },
    list: [{ code: 201, indent: 0, parameters: [variables ? 1 : 0, toMap, tx, ty, 2, 0] }, { code: 0, indent: 0, parameters: [] }] }] });
const open = ['......', '......', '......', '......', '......', '......'];
const project = {
    start: { mapId: 1, x: 1, y: 1 },
    names: { 1: 'Town', 2: 'Field', 3: 'Pit', 4: 'Bridge', 5: 'Island' },
    flags: () => flags,
    maps: {
        1: makeMap(['......', '......', '......', '......', '###...', '.#....'], [
            transfer(1, 3, 1, 2, 1, 1), transfer(2, 4, 4, 4, 1, 1), transfer(3, 0, 5, 5, 1, 1), transfer(4, 5, 5, 2, 99, 99), transfer(5, 5, 0, 9, 1, 1), transfer(6, 4, 0, 1, 1, 1, true)]),
        2: makeMap(open, [transfer(1, 2, 2, 1, 2, 2), transfer(2, 3, 3, 3, 1, 1), transfer(3, 4, 4, 1, 0, 4)]),
        3: makeMap(open, [transfer(1, 2, 2, 3, 3, 3)]),
        4: makeMap(open, [transfer(1, 2, 2, 3, 1, 1)]),
        5: makeMap(open, [transfer(1, 2, 2, 1, 1, 1)])
    }
};

// ---- Passage ----
const walk = R.walker(project.maps[1], flags);
assert.ok(walk.canStep(1, 1, 6), 'floor to floor');
assert.ok(!walk.canStep(0, 3, 2), 'into a wall is not a step');
assert.ok(walk.standable(1, 1) && !walk.standable(0, 4), 'a wall tile is not one to stand on');
const blocker = makeMap(open, [{ id: 1, x: 2, y: 1, pages: [{ trigger: 0, priorityType: 1, through: false, image: { characterName: 'People' }, list: [] }] }]);
assert.ok(!R.walker(blocker, flags).canStep(1, 1, 6), 'an event that stands like a character blocks the way');
const painted = R.walker(project.maps[2], flags, { walls: (x, y) => x === 3 && y === 3 });
assert.ok(!painted.canStep(2, 3, 6) && !painted.standable(3, 3), 'painted walls count');
assert.deepStrictEqual(R.transfersOf(transfer(1, 0, 0, 7, 2, 3)), [{ mapId: 7, x: 2, y: 3 }]);
assert.deepStrictEqual(R.transfersOf(transfer(1, 0, 0, 7, 2, 3, true)), [{ variables: true }]);

// ---- Following transfers ----
const result = R.explore(project);
const kinds = result.findings.map(f => f.kind + ':' + f.mapId).sort();
assert.ok(kinds.includes('deadEnd:3'), 'the pit has no way out');
assert.ok(kinds.includes('oneWay:1'), 'the bridge is a one-way trip');
assert.ok(!kinds.includes('oneWay:2') && !kinds.some(k => k === 'deadEnd:2'), 'town and field go both ways');
assert.ok(kinds.includes('unreachedMap:5'), 'the walled-off door to the island is never reached, so the island is not either');
assert.ok(kinds.includes('outsideMap:1'), 'a transfer that lands outside the map');
assert.ok(kinds.includes('missingMap:1'), 'a transfer to a map that does not exist');
assert.ok(kinds.includes('blockedLanding:2'), 'a transfer that lands on a wall');
assert.ok(kinds.includes('variableTransfer:1'), 'a transfer by variables is listed, not followed');
assert.deepStrictEqual(result.reached, [1, 2, 3, 4], 'the loop of transfers between town and field ends');
const oneWay = result.findings.find(f => f.kind === 'oneWay');
assert.deepStrictEqual([oneWay.x, oneWay.y], [4, 4], 'with the door to go to');
assert.ok(/Bridge/.test(oneWay.text));
const start = R.explore({ start: { mapId: 1, x: 0, y: 4 }, maps: { 1: project.maps[1] }, flags: () => flags });
assert.ok(start.findings.some(f => f.kind === 'blockedLanding' && /The game starts/.test(f.text)), 'a start on a wall is found');

// ---- Playing: the frame-limited runner ----
assert.deepStrictEqual(R.drive(frame => frame < 3, 10), { done: true, frames: 4, error: null });
assert.deepStrictEqual(R.drive(() => true, 10), { done: false, frames: 10, error: null }, 'an event that never finishes is stopped');
assert.deepStrictEqual(R.drive(() => { throw new Error('boom'); }, 10), { done: false, frames: 1, error: 'boom' });

// ---- In the editor ----
const nodes = {};
const node = tag => ({ tagName: tag, style: {}, set innerHTML(html) { this.html = html; for (const m of html.matchAll(/id="([^"]+)"/g)) nodes[m[1]] = { id: m[1] }; }, get innerHTML() { return this.html; } });
const createElement = document.createElement, getElementById = document.getElementById, appendChild = document.body.appendChild;
document.createElement = node; document.getElementById = id => nodes[id] || null;
document.body.appendChild = child => { nodes[child.id] = child; };
let went = null;
W.goToProblem = row => { went = row; };
W.showRobotReport('Test Every Map', result.findings, 'Four of five maps.');
assert.ok(/no way out/.test(nodes['dd-robot-card'].innerHTML) && /one-way|no way back/.test(nodes['dd-robot-card'].innerHTML));
const goIndex = result.findings.findIndex(f => !f.global);
nodes[`dd-robot-go-${goIndex}`].onclick();
assert.strictEqual(went, result.findings[goIndex], 'Go To goes to the finding');
document.createElement = createElement; document.getElementById = getElementById; document.body.appendChild = appendChild;
assert.ok(W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-robot-all-btn') && W.menus().find(m => m.id === 'map').items.some(i => i.id === 'dd-robot-map-btn'));
console.log('Robot tester: passage, transfers, dead ends, one-way doors, unreachable maps, bad landings, variables, loops, runner and report passed.');
