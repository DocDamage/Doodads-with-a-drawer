// scratch/test_play_here.js
// Play From Here (7.1.3): right-click a tile (or Ctrl+Enter over it) and the player starts there with the editor
// closed. A tile the player can't stand on is refused with the reason and the nearest free one offered; unsaved
// work asks first, as Done does; the time and season being previewed are used only if the user says so.
const assert = require('assert');

console.log('=== Testing Play From Here ===');

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null,
    querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => true, isOptionValid: opt => opt === 'test' };
global.PluginManager = { parameters: () => ({}) };

// A 10 x 8 map: a wall along x = 4 (no way through it in any direction), water at (7, 2).
const walls = new Set(['7,2']);
for (let y = 0; y < 8; y++) walls.add('4,' + y);
global.$gameMap = {
    mapId: () => 1, width: () => 10, height: () => 8, tileWidth: () => 48, tileHeight: () => 48,
    isPassable: (x, y) => !walls.has(x + ',' + y)
};
const located = [];
global.$gamePlayer = { locate: (x, y) => located.push([x, y]) };

require('../Docs-Doodads.js');
const D = DocsDoodads, ws = D.Workspace, P = D.PlayHere;

// A doodad's collision covers (2, 2).
D.Collision.blocksTile = (x, y) => x === 2 && y === 2;

// The dialogs answer from a list; each question is recorded.
const asked = [];
let answers = [];
const next = (kind, text) => { asked.push({ kind, text }); return Promise.resolve(answers.shift()); };
D.Ui.confirm = text => next('confirm', text);
D.Ui.choose = text => next('choose', text);
D.Ui.alert = text => next('alert', text).then(() => undefined);
let unsaved = false;
D.Persistence.hasUnsavedWork = () => unsaved;
D.Persistence.saveAll = () => true;
let closed = 0;
ws.close = function() { closed++; this.mounted = false; };
const timeSet = [], seasonSet = [];
D.api.setTime = (h, m) => timeSet.push([h, m]);
D.api.setSeason = s => seasonSet.push(s);
const toasts = [];
ws.showToast = t => toasts.push(t);
D.World.settings().seasons.names = ['Spring', 'Summer', 'Autumn', 'Winter'];

function reset() {
    asked.length = 0; located.length = 0; timeSet.length = 0; seasonSet.length = 0; toasts.length = 0;
    answers = []; unsaved = false; closed = 0;
    ws.mounted = true;
    ws.previewMinutes = null;
    ws.previewSeason = null;
}

(async () => {
    // 1. The rules.
    {
        const env = P.gameEnv();
        assert.strictEqual(P.why(1, 1, env), '', 'an open tile');
        assert.ok(/off the map/.test(P.why(10, 1, env)) && /off the map/.test(P.why(-1, 0, env)), 'off the map');
        assert.ok(/can't walk onto or off it/.test(P.why(4, 3, env)), 'a wall');
        assert.ok(/collision/.test(P.why(2, 2, env)), "a doodad's collision");
        // Nearest first; a tie goes to the one above, then the left.
        assert.deepStrictEqual(P.nearest(4, 3, env), { x: 4 - 1, y: 3 }, 'left of the wall (same distance as the right, same row: left first)');
        assert.deepStrictEqual(P.nearest(2, 2, env), { x: 2, y: 1 }, 'above first');
        assert.deepStrictEqual(P.nearest(7, 2, env), { x: 7, y: 1 });
        const sealed = { width: 3, height: 3, passable: () => false, blocked: () => false };
        assert.strictEqual(P.nearest(1, 1, sealed), null, 'nowhere to stand');
        assert.strictEqual(P.startText(18 * 60 + 30, 'Winter'), '18:30, Winter');
        assert.strictEqual(P.startText(5, ''), '00:05');
        assert.strictEqual(P.startText(null, 'Spring'), 'Spring');
        assert.strictEqual(P.startText(null, ''), '');
        assert.strictEqual(P.startText(1440 + 61, null), '01:01', 'past midnight wraps');
        console.log('PASS the rules: open, off the map, walls, collision, nearest, the time text');
    }

    // 2. An open tile: no questions, the editor closes and the player stands there.
    reset();
    assert.strictEqual(await ws.playFromHere(1, 5), true);
    assert.deepStrictEqual(located, [[1, 5]]);
    assert.strictEqual(closed, 1);
    assert.strictEqual(asked.length, 0, 'nothing to ask');
    console.log('PASS an open tile: the player is located and the editor closes');

    // 3. A blocked tile: refused with the reason, the nearest free tile offered.
    reset();
    answers = [true];
    assert.strictEqual(await ws.playFromHere(4, 3), true);
    assert.strictEqual(asked[0].kind, 'confirm');
    assert.ok(/can't start at 4, 3: the player can't walk onto or off it/.test(asked[0].text), asked[0].text);
    assert.ok(/Start at 3, 3 instead/.test(asked[0].text), asked[0].text);
    assert.deepStrictEqual(located, [[3, 3]], 'started on the tile offered');
    reset();
    answers = [false];
    assert.strictEqual(await ws.playFromHere(2, 2), false, 'turned down');
    assert.ok(/collision/.test(asked[0].text));
    assert.strictEqual(located.length + closed, 0, 'nothing happens');
    // Nowhere free: said, and nothing happens.
    reset();
    const isPassable = $gameMap.isPassable;
    $gameMap.isPassable = () => false;
    answers = [undefined];
    assert.strictEqual(await ws.playFromHere(1, 1), false);
    assert.ok(asked[0].kind === 'alert' && /no free tile near it/.test(asked[0].text));
    assert.strictEqual(located.length + closed, 0);
    $gameMap.isPassable = isPassable;
    console.log('PASS a blocked tile is refused and the nearest free one offered');

    // 4. Unsaved work asks first, as Done does.
    reset();
    unsaved = true;
    answers = [null]; // Keep Editing
    assert.strictEqual(await ws.playFromHere(1, 1), false);
    assert.ok(/aren't saved yet/.test(asked[0].text));
    assert.strictEqual(located.length + closed, 0, 'Keep Editing: the editor stays and the player stays');
    reset();
    unsaved = true;
    answers = ['save'];
    assert.strictEqual(await ws.playFromHere(1, 1), true);
    assert.deepStrictEqual(located, [[1, 1]]);
    assert.strictEqual(closed, 1);
    console.log('PASS unsaved work asks first');

    // 5. The previewed time and season, only on yes.
    reset();
    ws.previewMinutes = 18 * 60 + 30;
    ws.previewSeason = 3;
    answers = ['preview'];
    assert.strictEqual(await ws.playFromHere(1, 1), true);
    assert.ok(/Start at 18:30, Winter/.test(asked[0].text), asked[0].text);
    assert.deepStrictEqual(timeSet, [[18, 30]]);
    assert.deepStrictEqual(seasonSet, [3]);
    reset();
    ws.previewMinutes = 6 * 60;
    answers = ['game'];
    assert.strictEqual(await ws.playFromHere(1, 1), true);
    assert.ok(/Start at 06:00, as the editor/.test(asked[0].text));
    assert.strictEqual(timeSet.length + seasonSet.length, 0, "the game's own time");
    assert.deepStrictEqual(located, [[1, 1]]);
    reset();
    ws.previewSeason = 1;
    answers = [null];
    assert.strictEqual(await ws.playFromHere(1, 1), false, 'Cancel');
    assert.strictEqual(located.length + closed + seasonSet.length, 0);
    // The time is asked before unsaved work, and set only once the editor has closed.
    reset();
    ws.previewMinutes = 60;
    unsaved = true;
    answers = ['preview', null];
    assert.strictEqual(await ws.playFromHere(1, 1), false);
    assert.strictEqual(timeSet.length, 0, 'Keep Editing after saying yes to the time: nothing is set');
    console.log('PASS the previewed time and season are used only on yes');

    // 6. Ctrl+Enter, the palette and the right-click menu.
    reset();
    const row = D.Shortcuts.find('playHere');
    assert.ok(row && row.keys === 'Ctrl+Enter');
    assert.strictEqual(D.Shortcuts.match({ key: 'Enter', code: 'Enter', ctrlKey: true, shiftKey: false, altKey: false, metaKey: false }), 'playHere');
    ws._cursor = null;
    assert.strictEqual(ws.runShortcut('playHere', {}), false, 'no tile under the mouse yet');
    assert.ok(/Point at a tile/.test(toasts[0]));
    ws._cursor = { x: 300, y: 200, tileX: 6, tileY: 4 };
    ws.runShortcut('playHere', {});
    await new Promise(r => setTimeout(r, 0));
    assert.deepStrictEqual(located, [[6, 4]], 'the tile under the mouse');
    const fs = require('fs'), path = require('path');
    const built = fs.readFileSync(path.join(__dirname, '..', 'Docs-Doodads.js'), 'utf8');
    assert.ok(/'Play From Here \(the tile under the mouse\)', \(\) => this\.playFromCursor\(\)/.test(built), 'in the palette');
    assert.ok(/Shortcuts\.tip\('playHere', 'Play From Here'\), icon: '▶️', onClick: \(\) => this\.playFromHere\(coords\.tileX, coords\.tileY\)/.test(built), 'on the right-click menu');
    // Not in a deployed game: the editor isn't open there.
    reset();
    ws.mounted = false;
    assert.strictEqual(await ws.playFromHere(1, 1), false);
    assert.strictEqual(located.length, 0);
    console.log('PASS Ctrl+Enter, the palette and the right-click menu');

    console.log('\nAll Play From Here tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
