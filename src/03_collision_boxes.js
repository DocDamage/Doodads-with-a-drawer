//==========================================================
// SECTION 3: COLLISION BOXES
//==========================================================
// Doodad collision and the tile it is tested against are both axis-aligned boxes, which collide when
// they overlap or touch. x, y: the box's centre; a negative size (a mirrored doodad) is the same box.
DocsDoodads.box = function(x, y, w, h) {
    const aw = Math.abs(w), ah = Math.abs(h);
    return { x: x - aw / 2, y: y - ah / 2, w: aw, h: ah };
};

DocsDoodads.judge = function(a, b) {
    return Boolean(a && b) && a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
};

