// scratch/test_anim_capture.js
// Doodad animation controls (loop, back and forth, once when a switch turns on, hold a frame; speed and
// start frame), the GIF writer and the Capture tool (a picture of the view, a 3D orbit GIF), and the
// right-click menu's row of most-used actions.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const E = require('./engine/fake_engine');

console.log('=== Testing Animation Controls, Capture and the Quick Menu ===');

E.install();
E.setupWorld({ width: 20, height: 15, px: 5, py: 5 });
require('../Docs-Doodads.js');
const D = DocsDoodads, A = D.FrameAnim, ws = D.Workspace;

(async () => {
    // 1. Which frame shows.
    const at = (anim, steps, total = 4) => A.index({ anim }, steps, total);
    assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map(s => at(undefined, s)), [0, 1, 2, 3, 0, 1], 'loop (as before)');
    assert.deepStrictEqual([0, 1, 2, 3, 4, 5, 6].map(s => at({ mode: 'pingpong' }, s)), [0, 1, 2, 3, 2, 1, 0], 'back and forth');
    assert.deepStrictEqual([0, 1, 2, 3, 9].map(s => at({ mode: 'once' }, s)), [0, 1, 2, 3, 3], 'once, then holds the last');
    assert.deepStrictEqual([0, 7].map(s => at({ mode: 'still', frame: 2 }, s)), [2, 2], 'hold one frame');
    assert.strictEqual(at({ mode: 'still', frame: 9 }, 0), 3, 'a frame past the end holds the last');
    assert.deepStrictEqual([0, 1, 2].map(s => at({ offset: 2 }, s)), [2, 3, 0], 'start at frame 2');
    assert.strictEqual(at({ mode: 'pingpong' }, 5, 1), 0, 'one frame: nothing to swing');
    assert.strictEqual(A.mode({ anim: { mode: 'nope' } }), 'loop');
    assert.ok(A.moving({}, false) && !A.moving({ anim: { mode: 'still' } }, true));
    assert.ok(!A.moving({ anim: { mode: 'once', switchId: 4 } }, false) && A.moving({ anim: { mode: 'once', switchId: 4 } }, true));
    assert.ok(A.moving({ anim: { mode: 'once', switchId: 0 } }, false), 'once without a switch plays at once');
    console.log('✓ frame choice: loop, back and forth, once, hold, start frame');

    // 2. On a doodad sprite, by game frames.
    const ss = new Spriteset_Map();
    const d = E.doodad(2, 2, { xFrame: 4, yFrame: 1, frameW: 32, frameH: 32, frameUpdate: 2, anim: { mode: 'once', switchId: 7 } });
    $dataDocsDoodads[1] = [d];
    ss.addDocsDoodads();
    const sprite = ss._docsDoodadSprites[0];
    sprite._bmp = new Bitmap(128, 32);
    sprite.texture = new PIXI.Texture(sprite._bmp._baseTexture, new PIXI.Rectangle(0, 0, 32, 32));
    const run = n => { for (let i = 0; i < n; i++) { Graphics.frameCount = (Graphics.frameCount || 0) + 1; sprite.update(); } return sprite.texture.frame.x; };
    assert.strictEqual(run(10), 0, 'once: waits for switch 7');
    $gameSwitches.setValue(7, true);
    assert.strictEqual(run(2), 32, 'switch on: one picture every 2 frames');
    assert.strictEqual(run(2), 64);
    assert.strictEqual(run(20), 96, 'and holds the last');
    $gameSwitches.setValue(7, false);
    assert.strictEqual(run(1), 0, 'switch off: back to the start, ready to play again');
    d.anim = { mode: 'still', frame: 2 };
    assert.strictEqual(run(5), 64, 'hold frame 2');
    d.anim = { mode: 'pingpong' };
    sprite._animSteps = 0;
    const seen = [];
    for (let i = 0; i < 8; i++) seen.push(run(2) / 32);
    assert.deepStrictEqual(seen, [1, 2, 3, 2, 1, 0, 1, 2]);
    d.anim = undefined; d.frameUpdate = 0;
    const still = run(10);
    assert.strictEqual(run(10), still, 'speed 0: no change');
    // Details: an Animation section; frames across split the whole picture.
    const section = ws.effectSections().find(s => s.title === 'Animation');
    assert.deepStrictEqual(section.fields.map(f => f.key), ['xFrame', 'yFrame', 'frameUpdate', 'anim.mode', 'anim.offset', 'anim.switchId', 'anim.frame']);
    const strip = { frameW: 192, frameH: 48, xFrame: 1, yFrame: 1 };
    ws.applyDoodadProperty(strip, 'xFrame', 4);
    assert.deepStrictEqual([strip.xFrame, strip.frameW], [4, 48], 'a 192-pixel strip in four frames of 48');
    ws.applyDoodadProperty(strip, 'xFrame', 2);
    assert.deepStrictEqual([strip.xFrame, strip.frameW], [2, 96]);
    ws.applyDoodadProperty(strip, 'xFrame', 0);
    assert.deepStrictEqual([strip.xFrame, strip.frameW], [1, 192], 'at least one frame');
    assert.strictEqual(ws.getDoodadProperty({}, 'anim.mode'), 'loop');
    console.log('✓ doodad animation: once on a switch, hold, back and forth, speed; Details section; frames split the picture');

    // 3. GIF writer: decoded back, the pictures come out (near) the same.
    const decode = bytes => {
        let p = 0;
        const b = () => bytes[p++], w = () => b() | (b() << 8);
        assert.strictEqual(String.fromCharCode(...bytes.slice(0, 6)), 'GIF89a'); p = 6;
        const width = w(), height = w(), flags = b(); p += 2;
        const size = 2 << (flags & 7);
        const palette = []; for (let i = 0; i < size; i++) palette.push([b(), b(), b()]);
        const frames = []; let loop = false, delay = null;
        for (;;) {
            const t = b();
            if (t === 0x3b) break;
            if (t === 0x21) {
                const label = b();
                if (label === 0xff) { const n = b(); const id = String.fromCharCode(...bytes.slice(p, p + n)); p += n; loop = id === 'NETSCAPE2.0'; }
                else if (label === 0xf9) { p += 1; p += 1; delay = w(); p += 1; }
                let n; while ((n = b())) p += n;
                continue;
            }
            assert.strictEqual(t, 0x2c);
            p += 4; const fw = w(), fh = w(); p += 1;
            const min = b(); const data = []; let n; while ((n = b())) { for (let i = 0; i < n; i++) data.push(b()); }
            // LZW decode.
            const clear = 1 << min, end = clear + 1;
            let codeSize = min + 1, dict = [], next = end + 1, bit = 0, prev = null;
            for (let i = 0; i < clear; i++) dict[i] = [i];
            const out = [];
            const read = () => { let v = 0; for (let i = 0; i < codeSize; i++, bit++) v |= ((data[bit >> 3] >> (bit & 7)) & 1) << i; return v; };
            for (;;) {
                const code = read();
                if (code === clear) { codeSize = min + 1; next = end + 1; dict.length = end + 1; prev = null; continue; }
                if (code === end) break;
                let entry = dict[code];
                if (!entry) { assert.strictEqual(code, next, 'a valid code'); entry = prev.concat([prev[0]]); }
                out.push(...entry);
                if (prev && next < 4096) { dict[next++] = prev.concat([entry[0]]); if (next === (1 << codeSize) && codeSize < 12) codeSize++; }
                prev = entry;
            }
            assert.strictEqual(out.length, fw * fh);
            frames.push(out);
        }
        return { width, height, palette, frames, loop, delay };
    };
    const picture = (w, h, fn) => { const rgba = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); rgba.set([c[0], c[1], c[2], 255], (y * w + x) * 4); } return { width: w, height: h, rgba }; };
    const red = picture(8, 6, () => [255, 0, 0]), stripes = picture(8, 6, (x) => (x % 2 ? [0, 0, 255] : [255, 255, 255]));
    const gif = D.Gif.encode([red, stripes], { delay: 10 });
    const back = decode(gif);
    assert.deepStrictEqual([back.width, back.height, back.frames.length, back.loop, back.delay], [8, 6, 2, true, 10]);
    assert.deepStrictEqual(back.palette[back.frames[0][0]], [255, 0, 0]);
    assert.deepStrictEqual(back.frames[1].slice(0, 2).map(i => back.palette[i]), [[255, 255, 255], [0, 0, 255]]);
    // A big, busy picture fills the code table (clear codes) and still comes back.
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const noise = picture(160, 120, () => [Math.floor(rnd() * 16) * 17, Math.floor(rnd() * 16) * 17, Math.floor(rnd() * 4) * 85]);
    const busy = decode(D.Gif.encode([noise]));
    let close = 0;
    busy.frames[0].forEach((idx, i) => { const c = busy.palette[idx]; if (Math.abs(c[0] - noise.rgba[i * 4]) + Math.abs(c[1] - noise.rgba[i * 4 + 1]) + Math.abs(c[2] - noise.rgba[i * 4 + 2]) < 120) close++; });
    assert.ok(close / busy.frames[0].length > 0.8, 'busy pictures stay close: ' + (close / busy.frames[0].length).toFixed(2));
    assert.throws(() => D.Gif.encode([]), /No frames/);
    assert.throws(() => D.Gif.encode([red, picture(4, 4, () => [0, 0, 0])]), /same size/);
    console.log('✓ GIF writer: decodes back, loops, frame delay, palette, big pictures, size checks');

    // 4. Capture: the view without the editor's outlines; an orbit turns the 3D camera once and puts it back.
    const project = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-capture-'));
    const cwd = process.cwd();
    process.chdir(project);
    const toasts = [];
    ws.showToast = (msg, kind) => toasts.push([msg, kind]);
    SceneManager._scene = { _spriteset: ss };
    ss._docsSelectionOutline = { visible: true };
    const fakeCanvas = (w, h) => ({ width: w, height: h, toDataURL: () => 'data:image/png;base64,' + Buffer.from('PNGDATA').toString('base64'),
        getContext: () => ({ drawImage() {}, getImageData: (x, y, cw, ch) => ({ data: new Uint8ClampedArray(cw * ch * 4).fill(200) }) }) });
    let rendered = 0, outlineDuring = null, destroyed = 0;
    ws.renderer = () => ({ render: () => { rendered++; outlineDuring = ss._docsSelectionOutline.visible; }, extract: { canvas: () => fakeCanvas(Graphics.width, Graphics.height) } });
    const realCreate = PIXI.RenderTexture && PIXI.RenderTexture.create;
    PIXI.RenderTexture = PIXI.RenderTexture || function() {};
    PIXI.RenderTexture.create = () => ({ destroy: () => { destroyed++; } });
    global.nw = undefined;
    const shot = ws.capturePicture();
    assert.ok(/^screenshots\/view_Map001_\d{8}-\d{6}\.png$/.test(shot), shot);
    assert.strictEqual(fs.readFileSync(path.join(project, shot)).toString(), 'PNGDATA');
    assert.strictEqual(outlineDuring, false, 'outlines hidden while rendering');
    assert.strictEqual(ss._docsSelectionOutline.visible, true, 'and back after');
    assert.strictEqual(destroyed, 1, 'the render texture is freed');
    // Orbit: not without the 3D view.
    D.Perspective.liveCamera = () => null;
    assert.strictEqual(await ws.captureOrbitGif(), null);
    assert.ok(/Turn on the 3D view/.test(toasts[toasts.length - 1][0]));
    D.Perspective.liveCamera = () => ({});
    D.Perspective.active = () => ({ yaw: 30 });
    $gameMap._docsCamera = { yaw: 30, pitch: 50 };
    const yaws = [];
    const realSet = ws.setCameraView;
    ws.setCameraView = change => { yaws.push(change ? change.yaw : null); realSet.call(ws, change); };
    ws.nextFrame = () => Promise.resolve(); // the stand-in engine draws no frames of its own
    ws.framePixels = (canvas, width) => picture(Math.min(width, 32), 24, () => [yaws.length * 10, 100, 50]);
    global.document = global.document || {};
    const gifPath = await ws.captureOrbitGif({ frames: 4, width: 320 });
    assert.deepStrictEqual(yaws.slice(0, 4), [30, 120, 210, 300], 'once round, from where the camera was');
    assert.deepStrictEqual($gameMap._docsCamera, { yaw: 30, pitch: 50 }, 'the camera is put back');
    assert.ok(/orbit_Map001_.*\.gif$/.test(gifPath));
    const orbit = decode(Array.from(fs.readFileSync(path.join(project, gifPath))));
    assert.strictEqual(orbit.frames.length, 4);
    assert.strictEqual(orbit.delay, 100, 'about four seconds a turn');
    // Cancel: nothing saved, the camera back.
    const before = fs.readdirSync(path.join(project, 'screenshots')).length;
    ws.nextFrame = () => { const pill = D.Ui.activeProgress()[0]; if (pill) pill.cancel(); return Promise.resolve(); };
    assert.strictEqual(await ws.captureOrbitGif({ frames: 8 }), null);
    assert.strictEqual(fs.readdirSync(path.join(project, 'screenshots')).length, before);
    assert.deepStrictEqual($gameMap._docsCamera, { yaw: 30, pitch: 50 });
    process.chdir(cwd);
    fs.rmSync(project, { recursive: true, force: true });
    console.log('✓ capture: a picture of the view (outlines hidden), an orbit GIF round the 3D camera (put back), Cancel');

    // 5. The quick menu.
    const store = {};
    D.Ui.prefs = () => JSON.parse(store.p || '{}');
    D.Ui.setPref = (k, v) => { const p = D.Ui.prefs(); p[k] = v; store.p = JSON.stringify(p); };
    assert.strictEqual(ws.menuKey('Paste 3 Doodad(s) (Ctrl+V)'), 'Paste # Doodad');
    const items = ['Bring Forward (+1 Z)', 'Send Backward (-1 Z)', 'Duplicate (Ctrl+D)', 'Lock', 'Hide in Editor', 'Select Same Art', 'Delete (Del)'].map(label => ({ label, onClick() { this.ran = true; } }));
    assert.deepStrictEqual(ws.quickMenuItems(items), [], 'nothing learned yet');
    for (let i = 0; i < 5; i++) ws.noteMenuUse('Duplicate (Ctrl+D)');
    for (let i = 0; i < 3; i++) ws.noteMenuUse('Select Same Art');
    ws.noteMenuUse('Lock');
    assert.deepStrictEqual(ws.quickMenuItems(items).map(i => i.label), ['Duplicate (Ctrl+D)', 'Select Same Art'], 'used at least twice, most first');
    assert.deepStrictEqual(ws.quickMenuItems(items.slice(0, 4)), [], 'short menus need no shortcut row');
    // In the menu: the row first; a click runs it and counts.
    const made = [];
    const node = tag => { const n = { tagName: tag.toUpperCase(), style: {}, childNodes: [], className: '', innerHTML: '', appendChild(c) { this.childNodes.push(c); c.parentNode = this; return c; }, contains: () => false }; made.push(n); return n; };
    global.document = { createElement: node, body: { appendChild(c) { this.menu = c; }, removeChild() {} }, getElementById: () => null, addEventListener() {}, removeEventListener() {} };
    global.window.innerWidth = 1200; global.window.innerHeight = 800;
    ws.showContextMenu(10, 10, items);
    const menu = document.body.menu;
    assert.strictEqual(menu.childNodes[0].className, 'dd-quick-row');
    assert.deepStrictEqual(menu.childNodes[0].childNodes.map(b => b.title), ['Duplicate (Ctrl+D)', 'Select Same Art']);
    menu.childNodes[0].childNodes[1].onclick({ stopPropagation() {} });
    assert.ok(items[5].ran);
    assert.strictEqual(D.Ui.prefs().menuUse['Select Same Art'], 4);
    menu.childNodes.find(c => c.tagName === 'BUTTON' && /Lock/.test(c.innerHTML)).onclick({ stopPropagation() {} });
    assert.strictEqual(D.Ui.prefs().menuUse.Lock, 2, 'the long list counts too');
    console.log('✓ quick menu: most-used actions learned from use, a row at the top of long menus');

    console.log('=== Animation controls, capture and quick menu passed ===');
})().catch(e => { console.error(e); process.exit(1); });
