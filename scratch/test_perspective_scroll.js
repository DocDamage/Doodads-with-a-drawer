// scratch/test_perspective_scroll.js
// In 3D MZ scrolls as if the screen were viewTiles across, and its own scrolling stops at the map's
// edges. The 3D view lets the display run past non-looping edges so the camera keeps following the
// party (Starting Town is 35x40, smaller than the 40-tile window). Runs MZ's own setDisplayPos,
// scroll and centring code on the stand-in engine (scratch/engine/fake_engine.js).
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing 3D Camera Following Past Map Edges ===");

E.install();
E.setupWorld({ width: 35, height: 40, px: 17, py: 30, mapId: 3 });
global.TouchInput = { x: 0, y: 0 };

// MZ's scrolling (rmmz_objects.js), which the stand-in leaves out.
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const mod = (v, n) => ((v % n) + n) % n;
Object.assign(Game_Map.prototype, {
    setDisplayPos(x, y) {
        if (this.isLoopHorizontal()) {
            this._displayX = mod(x, this.width());
            this._parallaxX = x;
        } else {
            const endX = this.width() - this.screenTileX();
            this._displayX = endX < 0 ? endX / 2 : clamp(x, 0, endX);
            this._parallaxX = this._displayX;
        }
        if (this.isLoopVertical()) {
            this._displayY = mod(y, this.height());
            this._parallaxY = y;
        } else {
            const endY = this.height() - this.screenTileY();
            this._displayY = endY < 0 ? endY / 2 : clamp(y, 0, endY);
            this._parallaxY = this._displayY;
        }
    },
    scrollDown(distance) {
        if (this.isLoopVertical()) {
            this._displayY += distance;
            this._displayY %= $dataMap.height;
        } else if (this.height() >= this.screenTileY()) {
            const lastY = this._displayY;
            this._displayY = Math.min(this._displayY + distance, this.height() - this.screenTileY());
            this._parallaxY += this._displayY - lastY;
        }
    },
    scrollLeft(distance) {
        if (this.isLoopHorizontal()) {
            this._displayX += $dataMap.width - distance;
            this._displayX %= $dataMap.width;
        } else if (this.width() >= this.screenTileX()) {
            const lastX = this._displayX;
            this._displayX = Math.max(this._displayX - distance, 0);
            this._parallaxX += this._displayX - lastX;
        }
    },
    scrollRight(distance) {
        if (this.isLoopHorizontal()) {
            this._displayX += distance;
            this._displayX %= $dataMap.width;
        } else if (this.width() >= this.screenTileX()) {
            const lastX = this._displayX;
            this._displayX = Math.min(this._displayX + distance, this.width() - this.screenTileX());
            this._parallaxX += this._displayX - lastX;
        }
    },
    scrollUp(distance) {
        if (this.isLoopVertical()) {
            this._displayY += $dataMap.height - distance;
            this._displayY %= $dataMap.height;
        } else if (this.height() >= this.screenTileY()) {
            const lastY = this._displayY;
            this._displayY = Math.max(this._displayY - distance, 0);
            this._parallaxY += this._displayY - lastY;
        }
    }
});
Object.assign(Game_Player.prototype, {
    centerX() { return ($gameMap.screenTileX() - 1) / 2; },
    centerY() { return ($gameMap.screenTileY() - 1) / 2; },
    center(x, y) { return $gameMap.setDisplayPos(x - this.centerX(), y - this.centerY()); },
    scrolledX() { return $gameMap.adjustX(this._realX); },
    scrolledY() { return $gameMap.adjustY(this._realY); },
    updateScroll(lastScrolledX, lastScrolledY) {
        const x1 = lastScrolledX, y1 = lastScrolledY, x2 = this.scrolledX(), y2 = this.scrolledY();
        if (y2 > y1 && y2 > this.centerY()) $gameMap.scrollDown(y2 - y1);
        if (x2 < x1 && x2 < this.centerX()) $gameMap.scrollLeft(x1 - x2);
        if (x2 > x1 && x2 > this.centerX()) $gameMap.scrollRight(x2 - x1);
        if (y2 < y1 && y2 < this.centerY()) $gameMap.scrollUp(y1 - y2);
    }
});
$gameMap._parallaxX = 0;
$gameMap._parallaxY = 0;

require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective;

// Walks the player one tile at a time, scrolling the way MZ does after each step.
function walk(dx, dy, steps) {
    for (let i = 0; i < steps; i++) {
        const lastX = $gamePlayer.scrolledX(), lastY = $gamePlayer.scrolledY();
        $gamePlayer.locate($gamePlayer.x + dx, $gamePlayer.y + dy);
        $gamePlayer.updateScroll(lastX, lastY);
    }
}
// Where the player's feet land on screen in the live 3D view.
function playerOnScreen() {
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    return P.project(P._cam, ($gamePlayer.scrolledX() + 0.5) * tw, ($gamePlayer.scrolledY() + 1) * th, 0);
}
const W = Graphics.width, H = Graphics.height;

// 1. Flat: MZ's own clamping is untouched.
$gamePlayer.center(17, 39);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [9, 27], 'flat map clamps at the bottom edge');
$gameMap.scrollDown(3);
assert.strictEqual($gameMap.displayY(), 27, 'flat map does not scroll past the edge');
$gameMap.setDisplayPos(-4, -4);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [0, 0]);

// 2. 3D on a map no bigger than the window: the player stays in the middle near the bottom edge.
DocsDoodads.Lighting.setMapSettings(3, { perspective: { enabled: true } });
const s = P.active();
assert.ok(s, '3D on');
const half = (s.viewTiles - 1) / 2;
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
assert.ok(ss._docs3d, 'in 3D');
$gamePlayer.center(17, 30);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [17 - half, 30 - half], 'display follows the player past the edges');
assert.deepStrictEqual([$gameMap._parallaxX, $gameMap._parallaxY], [17 - half, 30 - half], 'parallax position follows too');
E.frames(ss, 1);
let at = playerOnScreen();
assert.ok(at && Math.abs(at.x - W / 2) < 2 && at.y > 0 && at.y < H, 'player on screen in the middle, got ' + JSON.stringify(at));
const middleY = at.y;

// 3. Walking to the bottom-right corner and back to the top-left keeps the player where the camera looks.
walk(0, 1, 9);
walk(1, 0, 17);
assert.deepStrictEqual([$gamePlayer.x, $gamePlayer.y], [34, 39]);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [34 - half, 39 - half], 'scrolled down and right past the edges');
E.frames(ss, 1);
at = playerOnScreen();
assert.ok(Math.abs(at.x - W / 2) < 2 && Math.abs(at.y - middleY) < 2, 'still in the middle at the corner, got ' + JSON.stringify(at));
walk(0, -1, 39);
walk(-1, 0, 34);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [-half, -half], 'scrolled up and left past the edges');
assert.deepStrictEqual([$gameMap._parallaxX, $gameMap._parallaxY], [-half, -half]);
E.frames(ss, 1);
at = playerOnScreen();
assert.ok(Math.abs(at.x - W / 2) < 2 && Math.abs(at.y - middleY) < 2, 'still in the middle at the top-left corner, got ' + JSON.stringify(at));

// 4. Clicking where the player stands still picks the player's tile.
TouchInput.x = at.x;
TouchInput.y = at.y - 12;
assert.deepStrictEqual([$gameMap.canvasToMapX(TouchInput.x), $gameMap.canvasToMapY(TouchInput.y)], [0, 0], 'click-to-walk hits the right tile');

// 5. Leaving 3D puts the flat camera back inside the map.
$gamePlayer.locate(17, 39);
$gamePlayer.center(17, 39);
assert.strictEqual($gameMap.displayY(), 39 - half);
DocsDoodads.Lighting.setMapSettings(3, { perspective: { enabled: false } });
E.frames(ss, 2);
assert.ok(!ss._docs3d, 'flat again');
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [9, 27], 'recentred inside the map');

// 6. Looping axes keep MZ's wrapping in 3D.
E.setupWorld({ width: 30, height: 60, px: 2, py: 3, mapId: 4, scrollType: 3 });
DocsDoodads.Lighting.setMapSettings(4, { perspective: { enabled: true } });
assert.ok(P.active(), '3D on the looping map');
$gameMap.setDisplayPos(-5, -5);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [25, 55], 'both axes wrap');
$gameMap.scrollUp(1);
$gameMap.scrollRight(6);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [1, 54], 'scrolling wraps');
// Looping one way: that axis wraps, the other follows freely.
$dataMap.scrollType = 2;
$gameMap.setDisplayPos(-5, -5);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [25, -5], 'x wraps, y runs past the top');
$gameMap.scrollUp(2);
$gameMap.scrollLeft(26);
assert.deepStrictEqual([$gameMap.displayX(), $gameMap.displayY()], [29, -7]);

console.log("3D camera following passed.");
