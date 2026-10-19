//==========================================================
// SECTION 15D: THE TOUCH PROMPT
//==========================================================
// A doodad with Touch > Prompt shows it in a small bubble over its top while the player faces it (or
// stands on it, for "walking into it"), and not while an event or a message runs. In 3D the bubble goes
// where the doodad stands in the view.
if (typeof Spriteset_Map !== 'undefined' && typeof Sprite !== 'undefined' && typeof Bitmap !== 'undefined') {
    // A step of Spriteset_Map.update (DocsDoodads.spritesetSteps).
    Spriteset_Map.prototype.updateDocsTouchPrompt = function() {
        const T = DocsDoodads.Touch;
        const busy = (typeof $gameMessage !== 'undefined' && $gameMessage && $gameMessage.isBusy())
            || (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.isEventRunning && $gameMap.isEventRunning())
            || (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const d = busy ? null : T.faced();
        const t = d ? T.settings(d) : null;
        const text = t ? String(t.prompt || '').trim() : '';
        let bubble = this._docsPrompt;
        if (!text) {
            if (bubble) bubble.visible = false;
            return;
        }
        if (!bubble) {
            bubble = this._docsPrompt = new Sprite();
            bubble.anchor.x = 0.5;
            bubble.anchor.y = 1;
            bubble.z = 9;
            this.addChild(bubble);
        }
        if (bubble._docsText !== text) {
            bubble._docsText = text;
            bubble.bitmap = DocsDoodads.Touch.promptBitmap(text);
        }
        const sprite = (this._docsDoodadSprites || []).find(s => s._data === d);
        const th = $gameMap.tileHeight();
        const h = (Number(d.frameH) || th) * Math.abs(d.scaleY !== undefined ? Number(d.scaleY) : 1);
        let x = sprite ? sprite.x : DocsDoodads.mapToScreen(d.x, d.y).x;
        let y = (sprite ? sprite.y : DocsDoodads.mapToScreen(d.x, d.y).y) - h * (d.anchorY !== undefined ? Number(d.anchorY) : 1) - 4;
        const P = DocsDoodads.Perspective;
        if (P && P.liveCamera && P.liveCamera()) {
            const at = P.flatToScreen(x, y);
            if (!at) { bubble.visible = false; return; }
            x = at.x;
            y = at.y;
        }
        bubble.x = Math.round(x);
        // A gentle bob, so the eye finds it.
        bubble.y = Math.round(y - Math.abs(Math.sin(DocsDoodads.frameCount() / 20)) * 3);
        bubble.visible = true;
    };
}

// The bubble's picture for a prompt's words (kept per text).
DocsDoodads.Touch.promptBitmap = function(text) {
    const cache = this._promptBitmaps = this._promptBitmaps || new Map();
    if (cache.has(text)) return cache.get(text);
    const size = 18;
    const probe = new Bitmap(1, 1);
    probe.fontSize = size;
    const w = Math.max(28, Math.ceil(probe.measureTextWidth(text)) + 18), h = size + 14;
    const bmp = new Bitmap(w, h + 6);
    bmp.fontSize = size;
    bmp.fillRect(2, 2, w - 4, h - 4, 'rgba(20, 18, 34, 0.82)');
    bmp.fillRect(Math.floor(w / 2) - 4, h - 2, 8, 6, 'rgba(20, 18, 34, 0.82)');
    bmp.textColor = '#ffffff';
    bmp.outlineWidth = 3;
    bmp.drawText(text, 0, 2, w, h - 4, 'center');
    if (cache.size > 32) cache.clear();
    cache.set(text, bmp);
    return bmp;
};
