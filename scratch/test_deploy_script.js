// scratch/test_deploy_script.js
// scripts/deploy.js: a Windows deployment like MZ's (Game.exe, no saves or project file, images and audio
// encrypted so that MZ's own Utils.decryptArrayBuffer reads them back, the key in System.json).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { deploy, restore, encryptBytes, decryptBytes, parseArgs } = require('../scripts/deploy.js');

console.log('=== Testing the deploy script ===');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-deploy-'));
const write = (p, data) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); };
try {
    // A tiny project and runtime.
    const project = path.join(root, 'project'), runtime = path.join(root, 'nwjs-win'), out = path.join(root, 'out');
    const png = Buffer.from('\x89PNG\r\n\x1a\n-pixels-pixels-pixels-', 'latin1');
    const ogg = Buffer.from('OggS-sound-data-sound-data');
    write(path.join(project, 'index.html'), '<html></html>');
    write(path.join(project, 'package.json'), JSON.stringify({ name: 'rmmz-game', main: 'index.html', 'chromium-args': '--force-color-profile=srgb' }, null, 4));
    write(path.join(project, 'data', 'System.json'), JSON.stringify({ gameTitle: 'Test' }));
    write(path.join(project, 'img', 'doodads', 'Tree.png'), png);
    write(path.join(project, 'img', 'system', 'Window.png'), png);
    write(path.join(project, 'audio', 'se', 'Step.ogg'), ogg);
    write(path.join(project, 'icon', 'icon.png'), png);
    write(path.join(project, 'save', 'file1.rmmzsave'), 'save');
    write(path.join(project, 'game.rmmzproject'), 'RPGMZ');
    for (const f of ['nw.exe', 'nw.dll', 'notification_helper.exe', 'chromedriver.exe', 'payload.exe', 'nacl_irt_x86_64.nexe', 'pnacl/x.nexe']) write(path.join(runtime, f), f);
    write(path.join(runtime, 'locales', 'en-US.pak'), 'pak');

    const r = deploy({ project, out, runtime, encrypt: true, key: 'secret' });
    assert.deepStrictEqual([r.images, r.sounds], [2, 1], 'img and audio files only (icon/ stays as it is)');
    assert.ok(fs.existsSync(path.join(out, 'Game.exe')) && !fs.existsSync(path.join(out, 'nw.exe')), 'nw.exe becomes Game.exe');
    assert.ok(fs.existsSync(path.join(out, 'nw.dll')) && fs.existsSync(path.join(out, 'locales', 'en-US.pak')) && fs.existsSync(path.join(out, 'notification_helper.exe')));
    for (const f of ['chromedriver.exe', 'payload.exe', 'nacl_irt_x86_64.nexe', 'pnacl', 'save', 'game.rmmzproject']) assert.ok(!fs.existsSync(path.join(out, f)), f + ' is left out (as MZ does)');
    assert.ok(!fs.existsSync(path.join(out, 'img', 'doodads', 'Tree.png')) && fs.existsSync(path.join(out, 'img', 'doodads', 'Tree.png_')));
    assert.ok(fs.existsSync(path.join(out, 'icon', 'icon.png')), 'the window icon is not encrypted');
    const sys = JSON.parse(fs.readFileSync(path.join(out, 'data', 'System.json'), 'utf8'));
    assert.deepStrictEqual([sys.hasEncryptedImages, sys.hasEncryptedAudio, sys.encryptionKey.length, sys.gameTitle], [true, true, 32, 'Test']);
    const crypto = require('crypto');
    assert.strictEqual(sys.encryptionKey, crypto.createHash('md5').update('secret').digest('hex'), 'the key is the MD5 of the key text, as MZ makes it');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf8'))['chromium-args'], '--force-color-profile=srgb --disable-devtools', 'no developer tools, as in MZ builds');

    // MZ's own decryption (rmmz_core.js, Utils.decryptArrayBuffer) gets the original bytes back.
    const mzDecrypt = (source, keyText) => {
        const header = new Uint8Array(source, 0, 16);
        const headerHex = Array.from(header, x => x.toString(16)).join(',');
        if (headerHex !== '52,50,47,4d,56,0,0,0,0,3,1,0,0,0,0,0') throw new Error('Decryption error');
        const body = source.slice(16);
        const view = new DataView(body);
        const key = keyText.match(/.{2}/g);
        for (let i = 0; i < 16; i++) view.setUint8(i, view.getUint8(i) ^ parseInt(key[i], 16));
        return body;
    };
    const asArrayBuffer = buf => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    const encTree = fs.readFileSync(path.join(out, 'img', 'doodads', 'Tree.png_'));
    assert.ok(Buffer.from(mzDecrypt(asArrayBuffer(encTree), sys.encryptionKey)).equals(png), 'MZ reads the picture back');
    const encStep = fs.readFileSync(path.join(out, 'audio', 'se', 'Step.ogg_'));
    assert.ok(Buffer.from(mzDecrypt(asArrayBuffer(encStep), sys.encryptionKey)).equals(ogg), 'and the sound');
    assert.ok(decryptBytes(encryptBytes(png, sys.encryptionKey), sys.encryptionKey).equals(png));
    // The source project is untouched.
    assert.ok(fs.readFileSync(path.join(project, 'img', 'doodads', 'Tree.png')).equals(png));
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(project, 'data', 'System.json'), 'utf8')).encryptionKey, undefined);
    console.log('✓ Game.exe, files left out, MZ-readable encryption, the key, the project untouched');

    // Without encryption; arguments; refusals.
    const plain = deploy({ project, out, runtime, encrypt: false, devtools: true });
    assert.strictEqual(plain.key, null);
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf8'))['chromium-args'], '--force-color-profile=srgb', '--devtools keeps them');
    assert.ok(fs.existsSync(path.join(out, 'img', 'doodads', 'Tree.png')), 'replaced, not encrypted');
    assert.deepStrictEqual(parseArgs(['a', 'b', '--key', 'k', '--no-encrypt', '--devtools']), { encrypt: false, key: 'k', runtime: null, devtools: true, project: 'a', out: 'b', restore: false });
    assert.strictEqual(parseArgs(['--restore', 'a', 'b']).restore, true);
    assert.throws(() => parseArgs(['a']), /Usage/);
    assert.throws(() => deploy({ project, out: path.join(project, 'deploy'), runtime, encrypt: true, key: 'k' }), /outside the project/);
    assert.throws(() => deploy({ project: root, out, runtime, encrypt: true, key: 'k' }), /not an MZ project/);
    assert.throws(() => deploy({ project, out, runtime: path.join(root, 'nothing'), encrypt: true, key: 'k' }), /runtime/);
    console.log('✓ unencrypted builds, arguments and refusals');

    // --restore: an MZ deployment that left out the plugin's pictures gets them back, encrypted with its key.
    const built = deploy({ project, out, runtime, encrypt: true, key: 'k' });
    fs.unlinkSync(path.join(out, 'img', 'doodads', 'Tree.png_'));
    assert.throws(() => restore({ project, out }), /DocsDoodadsRequired/, 'no list yet: says how to make it');
    fs.writeFileSync(path.join(project, 'data', 'DocsDoodadsRequired.json'), JSON.stringify({ files: ['img/doodads/Tree.png', 'img/doodads/Gone.png', '../evil.png'] }));
    const back = restore({ project, out });
    assert.deepStrictEqual(back.restored, ['img/doodads/Tree.png']);
    assert.deepStrictEqual(back.missing, ['img/doodads/Gone.png'], 'a file the project lacks is named');
    assert.ok(decryptBytes(fs.readFileSync(path.join(out, 'img', 'doodads', 'Tree.png_')), built.key).equals(png), 'encrypted with the key of the build');
    assert.deepStrictEqual(restore({ project, out }).restored, [], 'already there: left alone');
    fs.unlinkSync(path.join(project, 'data', 'DocsDoodadsRequired.json'));
    console.log('✓ --restore puts back what a deployment left out, encrypted');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}
console.log('=== Deploy script passed ===');
