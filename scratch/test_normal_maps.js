'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

const projectRoot = process.env.DD_REPO_ROOT || fs.mkdtempSync(path.join(os.tmpdir(), 'dd-normal-map-'));
fs.mkdirSync(projectRoot, { recursive: true });
process.chdir(projectRoot);

E.install();
E.setupWorld({ width: 24, height: 18, px: 10, py: 9 });
const target = E.doodad(11, 9, { uid: 'normal-target', bit: [3, 'img/doodads/Stone.png'], xFrame: 2, frameW: 48, frameH: 96, frameUpdate: 0 });
const plain = E.doodad(11, 9, { uid: 'plain-target', bit: [3, 'img/doodads/Plain.png'], z: 6 });
const lamp = E.doodad(9, 9, { uid: 'normal-lamp', bit: [3, 'img/doodads/Lamp.png'], light: {
    enabled: true, when: 'always', switchId: 7, radius: 260, intensity: 0.8, color: '#ff8040',
    shape: 'cone', angle: 0, spread: 70, flicker: 0
} });
$dataDocsDoodads[1] = [target, plain, lamp];
$dataDocsDoodads.world = {
    normalLight: { enabled: true, maxLights: 8 },
    lighting2d: { occlusion: true, wallRegions: '', rays: 40 }
};
$gamePlayer._characterName = '$Hero';
require('../Docs-Doodads.js');

const D = DocsDoodads, N = D.NormalLight;
assert.ok(N, 'normal-map rules exist');

// Pure naming, manifest and quality rules: no file is guessed or probed at runtime.
assert.strictEqual(N.normalPath('img/doodads/Stone.png'), 'img/doodads/Stone_n.png');
assert.strictEqual(N.normalPath('img/characters/$Hero.webp'), 'img/characters/$Hero_n.png');
assert.strictEqual(N.normalPath('img/doodads/Stone_n.png'), null, 'a normal is never given another normal');
const indexed = {
    stone: { id: 'stone', path: 'img/doodads/Stone.png' },
    stoneNormal: { id: 'stoneNormal', path: 'img/doodads/Stone_n.png' },
    hero: { id: 'hero', path: 'img/characters/$Hero.png' },
    heroNormal: { id: 'heroNormal', path: 'img/characters/$Hero_n.png' },
    orphan: { id: 'orphan', path: 'img/doodads/Orphan_n.png' }
};
const manifest = N.manifestFromAssets(indexed);
assert.deepStrictEqual(manifest.normals, {
    'img/characters/$hero.png': 'img/characters/$Hero_n.png',
    'img/doodads/stone.png': 'img/doodads/Stone_n.png'
}, 'only real base/normal pairs enter the runtime manifest');
N.setManifest(manifest);
assert.strictEqual(N.pathFor('IMG/DOODADS/STONE.PNG'), 'img/doodads/Stone_n.png');
assert.strictEqual(N.pathFor('img/doodads/Missing.png'), null, 'missing normals have no speculative path');
assert.deepStrictEqual([0, 1, 2, 3].map(q => N.effectiveMax({ enabled: true, maxLights: 8 }, q)), [8, 4, 2, 0]);
assert.strictEqual(N.effectiveMax({ enabled: false, maxLights: 8 }, 0), 0);

// Nearest useful lights are deterministic, cone metadata and fixed-size uniforms are packed for WebGL 1.
const picked = N.pick([
    { x: 10, y: 0, radius: 40, intensity: 0.3, color: 0xff0000 },
    { x: 20, y: 0, radius: 100, intensity: 1, color: 0x00ff00, shape: 'cone', angle: 0, spread: 60 },
    { x: 500, y: 0, radius: 20, intensity: 1, color: 0xffffff },
    { x: 5, y: 0, radius: 30, intensity: 0, color: 0xffffff }
], 0, 0, 1);
assert.strictEqual(picked.length, 1);
assert.strictEqual(picked[0].color, 0x00ff00, 'strong contribution wins before distance');
const uniforms = N.uniforms(picked, [0.2, 0.3, 0.4]);
assert.strictEqual(uniforms.uLightCount, 1);
assert.strictEqual(uniforms.uLightPosRadius.length, 32);
assert.strictEqual(uniforms.uLightColorIntensity.length, 32);
assert.strictEqual(uniforms.uLightCone.length, 32);
assert.deepStrictEqual(Array.from(uniforms.uAmbient), [0.2, 0.3, 0.4]);
assert.strictEqual(uniforms.uLightCone[3], 1, 'cone flag is packed');
assert.ok(/for\s*\(\s*int\s+i\s*=\s*0\s*;\s*i\s*<\s*8/.test(N.fragment));
assert.ok(!/#version\s+300|\bin\s+vec|\bout\s+vec|texture\s*\(/.test(N.fragment), 'shader stays GLSL ES 1.00');
assert.match(N.fragment, /GL_FRAGMENT_PRECISION_HIGH[\s\S]*precision highp float/, 'PIXI filter uniforms use the vertex shader\'s highp precision');
assert.deepStrictEqual(N.alphaWhite(0.25), [0.25, 0.25, 0.25, 0.25], 'white coverage is premultiplied for PIXI NORMAL blending');
assert.match(N.alphaFragment, /vec4\s*\(\s*vec3\s*\(\s*alpha\s*\)\s*,\s*alpha\s*\)/);
assert.match(N.blackAlphaFragment, /vec4\s*\(\s*0\.0\s*,\s*0\.0\s*,\s*0\.0\s*,\s*alpha\s*\)/);
assert.match(N.ownershipFragment, /mix\s*\(\s*light\.rgb\s*,\s*vec3\s*\(\s*1\.0\s*\)\s*,\s*owned\s*\)/);
assert.strictEqual(N.coverageOver(1, 1, false), 0, 'an opaque ordinary foreground sprite removes normal ownership behind it');
assert.strictEqual(N.coverageOver(0, 1, true), 1, 'a foreground normal sprite owns its visible pixel');
assert.deepStrictEqual(N.occludedLight([0.2, 0.3, 0.4], [0.8, 0.7, 0.6], [1, 0.9, 0.8], [0.2, 0.3, 0.4]), [0.2, 0.3, 0.4],
    'a wall that leaves only ambient also blocks the normal-map lamp');
assert.deepStrictEqual(N.occludedLight([0.2, 0.3, 0.4], [0.5, 0.5, 0.5], [0.8, 0.7, 0.6], [0.5, 0.5, 0.5]), [0.35, 0.4, 0.45],
    'partial per-channel reach scales only the lamp contribution');

// The frame rectangle, including an animated frame, addresses the same region in the normal sheet.
assert.deepStrictEqual(N.frameUv({ x: 48, y: 0, width: 48, height: 96 }, 96, 96), [0.5, 0, 0.5, 1]);
assert.deepStrictEqual(N.frameUv({ x: -5, y: 0, width: 500, height: 10 }, 96, 96), [0, 0, 1, 10 / 96]);
const transformed = N.transformUniforms({ a: 0, b: -2, c: 3, d: 1, tx: 100, ty: 50 }, { width: 40, height: 20 }, { x: 0.5, y: 1 });
const transformedUv = N.localUv({ x: 85, y: 25 }, transformed);
assert.ok(Math.abs(transformedUv[0] - 0.75) < 1e-9 && Math.abs(transformedUv[1] - 0.75) < 1e-9, 'inverse screen mapping follows rotation, flip and skew');
const asymmetricNormals = [11, 22, 33, 44];
assert.strictEqual(asymmetricNormals[Math.min(1, Math.floor(transformedUv[1] * 2)) * 2 + Math.min(1, Math.floor(transformedUv[0] * 2))], 44,
    'a transformed asymmetric normal sheet samples the sprite-local texel');
const zoomed = N.transformUniforms(
    { a: 0, b: -4, c: 6, d: 2, tx: 230, ty: 140 }, { width: 40, height: 20 }, { x: 0.5, y: 1 }, {},
    { a: 2, b: 0, c: 0, d: 2, tx: 30, ty: 40 }
);
assert.deepStrictEqual(N.lightPoint({ x: 200, y: 90 }, zoomed), [85, 25], 'screen zoom and translation return to base-sprite light coordinates');
const zoomedUv = N.localUv({ x: 200, y: 90 }, zoomed);
assert.ok(Math.abs(zoomedUv[0] - 0.75) < 1e-9 && Math.abs(zoomedUv[1] - 0.75) < 1e-9,
    'base-sprite zoom does not change an asymmetric sprite-local normal sample');
assert.ok(Math.abs(zoomed.uNormalBasis[0]) < 1e-9 && Math.abs(zoomed.uNormalBasis[1] + 1) < 1e-9,
    'normal directions are expressed in the same base-sprite space as lights');

// Sobel generation is neutral on flat art, follows a brightness edge, preserves alpha, and caps allocation.
const flat = new Uint8ClampedArray(3 * 3 * 4).fill(255);
const flatNormal = N.make(flat, 3, 3, 2);
assert.deepStrictEqual(Array.from(flatNormal.slice(16, 20)), [128, 128, 255, 255]);
const edge = new Uint8ClampedArray(3 * 3 * 4);
for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    const i = (y * 3 + x) * 4, v = x < 1 ? 0 : 255;
    edge[i] = edge[i + 1] = edge[i + 2] = v; edge[i + 3] = x === 2 && y === 2 ? 0 : 255;
}
const edgeNormal = N.make(edge, 3, 3, 2);
assert.notStrictEqual(edgeNormal[16], 128, 'a horizontal height edge tilts the generated normal');
assert.strictEqual(edgeNormal[(2 * 3 + 2) * 4 + 3], 0);
assert.throws(() => N.make(new Uint8Array(4), 100000, 100000), /size|large|pixels/i);

// The editor index records hand-authored companions, hides auxiliaries, and writes the same manifest.
D.AssetIndex.data = { version: 1, assets: indexed, collections: {}, settings: {} };
const linked = D.AssetIndex.linkNormalMaps();
assert.strictEqual(indexed.stone.normalMap, 'img/doodads/Stone_n.png');
assert.strictEqual(indexed.stoneNormal.normalFor, 'img/doodads/Stone.png');
assert.strictEqual(indexed.stoneNormal.auxiliary, true);
assert.ok(!D.AssetIndex.list.includes(indexed.stoneNormal), 'normal companions do not become placeable Item Bag art');
assert.deepStrictEqual(linked.normals, manifest.normals);

// Deployment restores normals for doodad/state art and MZ-known character sheets.
const required = D.RequiredAssets.collect({
    doodads: { 1: [{ bit: [3, 'img/doodads/Stone.png'], states: { list: [{ path: 'img/doodads/Stone.png' }] } }] },
    database: { Actors: [{ characterName: '$Hero', note: '' }] }, maps: {}, characters: ['$Hero.png'], normalManifest: manifest
});
assert.ok(required.includes('img/doodads/Stone_n.png'));
assert.ok(required.includes('img/characters/$Hero_n.png'));

// Runtime: switched cone lights feed a mapped doodad and character; a missing normal is never requested.
const requestedNormals = [];
const loadBitmap = D.loadBitmap;
D.loadBitmap = function(path) {
    if (/_n\.png$/i.test(path)) requestedNormals.push(path);
    if (/img\/characters\/\$Hero_n\.png$/i.test(path)) return ImageManager.loadCharacter('$Hero');
    return loadBitmap.call(this, path);
};
D.Lighting.setMapSettings(1, { ambient: { darkness: 0.5, color: '#182040', switchId: 0 } });
const ss = new Spriteset_Map();
SceneManager._scene = { _spriteset: ss };
E.frames(ss, 2);
const targetSprite = ss._docsDoodadSprites.find(s => s._data.uid === 'normal-target');
const plainSprite = ss._docsDoodadSprites.find(s => s._data.uid === 'plain-target');
const playerSprite = ss._characterSprites.find(s => s._character === $gamePlayer);
assert.ok(targetSprite._docsNormalFilter, 'mapped doodad receives the filter');
assert.ok(playerSprite._docsNormalFilter, 'mapped MZ character receives the filter');
assert.ok(!plainSprite._docsNormalFilter, 'unmapped art stays batched and unfiltered');
assert.ok(!requestedNormals.some(p => /Plain_n/i.test(p)), 'unmapped art caused no failed normal request');
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uLightCount, 0, 'the light switch starts off');
$gameSwitches.setValue(7, true);
E.frames(ss, 2);
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uLightCount, 1);
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uLightCone[3], 1, 'directional light reaches the runtime filter');
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uUseOcclusion, 1, 'the normal filter consumes the same wall-masked lightmap as ordinary sprites');
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uLightMap, ss._docsNormalRawLightTexture);
targetSprite.worldTransform.set(0, -2, 3, 1, 100, 50);
targetSprite.anchor.set(0.5, 1);
targetSprite.texture.frame.width = 40; targetSprite.texture.frame.height = 20;
targetSprite._docsNormalFilter.apply();
assert.deepStrictEqual(targetSprite._docsNormalFilter.uniforms.uScreenToLocal, [1 / 6, 1 / 3, -1 / 2, 0],
    'the filter refreshes its inverse from the rendered world transform, including rotation, flip and skew');
assert.deepStrictEqual(targetSprite._docsNormalFilter.uniforms.uAnchor, [0.5, 1]);
targetSprite.showFrame(1);
ss.updateDocsNormalSprites();
assert.strictEqual(targetSprite._docsNormalFilter.uniforms.uNormalUv[0], 0.5, 'animation moves the normal-map frame too');
assert.ok(ss._docsNormalMasks.some(s => s.visible && s._docsSource === targetSprite && s._docsNormalWhite), 'normal-lit pixels enter the ownership coverage');
const targetCoverage = ss._docsNormalMasks.find(s => s._docsSource === targetSprite);
const plainCoverage = ss._docsNormalMasks.find(s => s._docsSource === plainSprite);
assert.ok(plainCoverage && !plainCoverage._docsNormalWhite && ss._docsNormalCoverageScene.children.indexOf(plainCoverage) > ss._docsNormalCoverageScene.children.indexOf(targetCoverage),
    'a later ordinary sprite paints black ownership over the normal sprite behind it');

ConfigManager.docsFxQuality = 3;
E.frames(ss, 1);
assert.ok(!(targetSprite.filters || []).includes(targetSprite._docsNormalFilter), 'Effects Quality Off removes the filter');
assert.ok(ss._docsNormalMasks.every(s => !s.visible), 'the ordinary lightmap exemption turns off in the same frame');
ConfigManager.docsFxQuality = 0;
D.Lighting.setMapSettings(1, { perspective: { enabled: true, pitch: 45, viewTiles: 20 } });
E.frames(ss, 2);
assert.ok(!(targetSprite.filters || []).includes(targetSprite._docsNormalFilter), 'normal lighting stays off in 3D');

// World UI exposes the switch and limit; the selected asset offers generation, not an auxiliary normal.
const normalSection = D.Workspace.worldSections().find(s => s.title === 'Normal Maps');
assert.ok(normalSection && normalSection.fields.some(f => f.key === 'normalLight.enabled') && normalSection.fields.some(f => f.key === 'normalLight.maxLights'));
assert.ok(/Make Normal Map/.test(D.Workspace.renderUsagePanel(indexed.stone)));
assert.ok(!/Make Normal Map/.test(D.Workspace.renderUsagePanel(indexed.stoneNormal)));

(async () => {
    // The actual editor action writes beside the source, indexes the result, and persists the runtime manifest.
    fs.mkdirSync(path.join(projectRoot, 'img/doodads'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'img/doodads/Stone.png'), Buffer.from([1]));
    const createElement = document.createElement;
    document.createElement = tag => {
        const element = createElement(tag);
        if (String(tag).toLowerCase() === 'canvas') element.toDataURL = () => 'data:image/png;base64,AA==';
        return element;
    };
    D.Workspace.showToast = D.Workspace.refreshDrawerCards = D.Workspace.refreshInspector = D.Workspace.refreshSpriteset = () => {};
    const made = await D.Workspace.makeAssetNormalMap(indexed.stone, async () => ({
        width: 2, height: 2, data: new Uint8ClampedArray(16).fill(255)
    }));
    document.createElement = createElement;
    assert.strictEqual(made, 'img/doodads/Stone_n.png');
    assert.ok(fs.existsSync(path.join(projectRoot, made)));
    const savedManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, N.manifestPath), 'utf8'));
    assert.strictEqual(savedManifest.normals['img/doodads/stone.png'], 'img/doodads/Stone_n.png');
    assert.ok(D.Workspace.companionFiles('img/doodads/Stone.png', 'img/doodads/Rock.png').some(move =>
        move.from === 'img/doodads/Stone_n.png' && move.to === 'img/doodads/Rock_n.png'), 'Rename/Move keeps a normal beside its base art');
    const baseEntry = { id: 'img/doodads/stone.png', path: 'img/doodads/Stone.png', fileName: 'Stone.png', tags: [], autoTags: [], collections: [], placement: {}, collision: {}, usage: {} };
    const normalEntry = { id: 'img/doodads/stone_n.png', path: 'img/doodads/Stone_n.png', fileName: 'Stone_n.png', tags: [], autoTags: [], collections: [], placement: {}, collision: {}, usage: {} };
    D.AssetIndex.data = { version: 1, assets: { [baseEntry.id]: baseEntry, [normalEntry.id]: normalEntry }, collections: {}, settings: {} };
    D.AssetIndex.linkNormalMaps(); D.AssetIndex.save();
    D.Persistence.dirtyDoodads = D.Persistence.dirtyMap = false; D.Persistence.stagedMaps = {};
    const renamed = D.Workspace.renameAsset(baseEntry, 'img/doodads/Rock.png', { quiet: true });
    assert.strictEqual(renamed.ok, true, renamed.error);
    assert.ok(fs.existsSync(path.join(projectRoot, 'img/doodads/Rock.png')) && fs.existsSync(path.join(projectRoot, 'img/doodads/Rock_n.png')));
    assert.ok(!fs.existsSync(path.join(projectRoot, 'img/doodads/Stone.png')) && !fs.existsSync(path.join(projectRoot, 'img/doodads/Stone_n.png')));
    assert.strictEqual(D.AssetIndex.data.assets['img/doodads/rock.png'].normalMap, 'img/doodads/Rock_n.png');
    const renamedManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, N.manifestPath), 'utf8'));
    assert.strictEqual(renamedManifest.normals['img/doodads/rock.png'], 'img/doodads/Rock_n.png');

    console.log('Normal maps: manifest, Sobel, GLSL1 uniforms, runtime filters, masks, characters, quality, 3D, generation and deployment passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
