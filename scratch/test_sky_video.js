// scratch/test_sky_video.js
// A video as the sky: settings, URLs, where a 360-degree panorama sits for a camera (north ahead at yaw 0,
// its equator on the horizon, one turn = the whole video), one shared video per file, and the sprites in
// the 3D view (under the sun and stars, tinted by the light at night) and behind a flat map.
const assert = require('assert');
const E = require('./engine/fake_engine');

console.log("=== Testing Sky Video ===");

E.install();
E.setupWorld({ width: 40, height: 30, px: 20, py: 15 });
// A stand-in <video>: ready once "loaded", with a size, play/pause and a count of plays.
const videos = [];
const makeElement = document.createElement;
document.createElement = tag => {
    if (tag !== 'video') return makeElement(tag);
    const v = { tagName: 'VIDEO', readyState: 0, videoWidth: 0, videoHeight: 0, paused: true, playbackRate: 1, plays: 0, removed: false,
        play() { this.paused = false; this.plays++; return Promise.resolve(); }, pause() { this.paused = true; },
        removeAttribute(k) { if (k === 'src') this.removed = true; }, load() {}, addEventListener() {} };
    videos.push(v);
    return v;
};
require('../Docs-Doodads.js');
const P = DocsDoodads.Perspective, V = DocsDoodads.SkyVideo;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

// 1. Settings.
const d = P.normalize({});
assert.deepStrictEqual([d.skyVideo, d.skyVideoMode, d.skyVideoSpeed, d.skyVideoDayNight, d.skyVideoFlat], ['', 'panorama', 1, true, false]);
const v = P.normalize({ skyVideo: ' movies\\Sky.webm ', skyVideoMode: 'fill', skyVideoSpeed: 9, skyVideoDayNight: false, skyVideoFlat: true });
assert.deepStrictEqual([v.skyVideo, v.skyVideoMode, v.skyVideoSpeed, v.skyVideoDayNight, v.skyVideoFlat], ['movies/Sky.webm', 'fill', 4, false, true]);
assert.strictEqual(V.url('movies/Sky'), 'movies/Sky.webm', "MZ's movie type when none is given");
assert.strictEqual(V.url('movies/My Sky #2.mp4'), 'movies/My%20Sky%20%232.mp4');

// 2. Where a panorama sits.
const cam = P.camera({ target: { x: 500, y: 500 }, pitch: 20, yaw: 0, fov: 50, zoom: 1, width: 800, height: 600 });
assert.ok(P.horizonY(cam) > 0, 'a camera that sees the horizon');
const horizon = P.horizonY(cam);
const L0 = V.layout('panorama', cam, 0, horizon, 4096, 2048);
const full = 4096 * L0.scaleX;
assert.ok(near(full, cam.focal * 2 * Math.PI), 'one turn of the camera is the whole video');
const screenX = (L, col) => ((L.offsetX + col * L.scaleX) % full + full) % full;
assert.ok(near(screenX(L0, 2048), 400, 1e-6), 'facing north: the video centre is ahead');
const L90 = V.layout('panorama', cam, 90, horizon, 4096, 2048);
assert.ok(near(screenX(L90, 2048 + 1024), 400, 1e-6), 'facing east: a quarter further along is ahead');
assert.ok(L90.offsetX <= 0 && L90.offsetX > -full, 'the offset stays within one turn');
assert.ok(near(L0.y + L0.offsetY + 1024 * L0.scaleY, horizon), 'the equator is on the horizon');
assert.ok(L0.y >= 0 && near(L0.y + L0.height, horizon + 2), 'it covers the sky down to the horizon');
const F = V.layout('fill', cam, 45, horizon, 1280, 720);
assert.ok(near(F.scaleX * 1280, 800) && near(F.scaleY * 720, horizon) && F.y === 0, 'fill: stretched over the sky');

// 3. One video per file, shared; freed when the last user lets go.
const a = {}, b = {};
const e1 = V.acquire('movies/Shared.webm', a), e2 = V.acquire('movies/Shared.webm', b);
assert.strictEqual(e1, e2, 'shared');
assert.strictEqual(videos.length, 1);
assert.ok(e1.video.muted && e1.video.loop && e1.video.plays === 1, 'muted, looping and playing');
e1.texture.destroy(true);
assert.ok(e1.texture.valid !== false, "a scene freeing its textures doesn't free the video's");
V.release('movies/Shared.webm', a);
assert.ok(!e1.video.removed, 'still used');
V.release('movies/Shared.webm', b);
assert.ok(e1.video.paused && e1.video.removed && e1.texture.valid === false, 'freed with its last user');

// 4. The 3D view: hidden until the video has a frame, then under the sun and stars; dimmed at night.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 30, skyVideo: 'movies/Sky.webm', skyVideoSpeed: 0.5 } });
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
const errors = [];
const run = (label, fn) => { try { fn(); } catch (e) { errors.push(label + ': ' + (e.stack || e.message)); } };
run('loading', () => E.frames(ss, 2));
assert.deepStrictEqual(errors, []);
const vid = videos[videos.length - 1];
assert.ok(!ss._docsSkyVideoSprite || !ss._docsSkyVideoSprite.visible, 'nothing until the video has a frame');
Object.assign(vid, { readyState: 4, videoWidth: 2048, videoHeight: 1024 });
run('playing', () => E.frames(ss, 2));
const sky = ss._docsSkyVideoSprite;
assert.ok(sky && sky.visible && sky.parent === ss._docs3dView, 'the sky video shows in the 3D view');
const kids = ss._docs3dView.children;
assert.ok(kids.indexOf(sky) > kids.indexOf(ss._docs3dSky) && kids.indexOf(sky) < kids.indexOf(ss._docs3dCelestial), 'over the plain sky, under the sun and stars');
assert.strictEqual(vid.playbackRate, 0.5, 'at its speed');
assert.ok(ss._docs3dSkyGrad && !ss._docs3dSkyGrad.visible, 'in place of the gradient');
DocsDoodads.Atmosphere.minutes = () => 0;
run('night', () => E.frames(ss, 1));
const tint = sky.tint, lum = ((tint >> 16) & 255) + ((tint >> 8) & 255) + (tint & 255);
assert.ok(lum < 3 * 255 * 0.8, 'darker at night: #' + tint.toString(16));
DocsDoodads.Lighting.setMapSettings(1, { perspective: Object.assign({}, DocsDoodads.Lighting.mapSettings(1).perspective, { skyVideoDayNight: false }) });
run('no tint', () => E.frames(ss, 1));
assert.strictEqual(sky.tint, 0xffffff, 'or as it is');

// 5. Leaving 3D, a flat map can show it behind the tiles; with neither, the video is freed.
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: false, skyVideo: 'movies/Sky.webm', skyVideoFlat: true } });
run('flat', () => E.frames(ss, 2));
const back = ss._docsFlatSkyVideo;
assert.ok(back && back.visible && back.parent === ss._parallax.parent, 'behind the flat map');
assert.ok(back.parent.children.indexOf(back) === back.parent.children.indexOf(ss._parallax) + 1, 'just above the parallax, under the tiles');
assert.ok(!vid.removed, 'the same video carries on');
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: false } });
run('off', () => E.frames(ss, 1));
assert.ok(!back.visible && vid.removed, 'turned off: hidden and freed');
DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, skyVideo: 'movies/Sky.webm' } });
run('back on', () => E.frames(ss, 1));
const again = videos[videos.length - 1];
ss.destroy({ children: true, texture: true });
assert.ok(again.removed, 'freed with the map');
assert.deepStrictEqual(errors, []);

// 6. Set Sky Video: another video for this visit, none, or back to the map's own.
{
    DocsDoodads.Lighting.setMapSettings(1, { perspective: { enabled: true, skyVideo: 'movies/Sky.webm' } });
    const call = args => PluginManager.callCommand($gameMap._interpreter, 'Docs-Doodads', 'setSkyVideo', args);
    call({ video: 'Storm', mode: 'fill', speed: '2' });
    let s2 = P.active();
    assert.deepStrictEqual([s2.skyVideo, s2.skyVideoMode, s2.skyVideoSpeed], ['movies/Storm', 'fill', 2], 'a file from movies, its shape and speed');
    call({ video: 'none', mode: 'map', speed: '' });
    assert.strictEqual(P.active().skyVideo, '', 'none');
    assert.strictEqual(P.active().skyVideoMode, 'panorama', "the map's shape again");
    call({ video: '', mode: 'map', speed: '' });
    assert.strictEqual(P.active().skyVideo, 'movies/Sky.webm', "blank: the map's own");
    $gameMap._docsCamera = null;
}

console.log("✓ Sky video: settings, URLs, panorama placement (north ahead, equator on the horizon, one turn per video), fill, shared videos, the 3D sky (order, speed, night tint), the flat-map background, freeing and Set Sky Video.");
