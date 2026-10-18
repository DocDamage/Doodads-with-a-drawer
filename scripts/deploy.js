// A Windows deployment of an MZ project, made the way RPG Maker MZ's File > Deployment makes one with
// "Encrypt image files" and "Encrypt audio files" on, for testing the plugin in a real deployed game
// without opening the editor:
//
//   npm run deploy -- <project folder> <output folder> [--key <text>] [--no-encrypt] [--devtools] [--runtime <nwjs-win>]
//
//  - The NW.js runtime from MZ's nwjs-win folder, with nw.exe named Game.exe.
//  - The game's files, without save/ and the .rmmzproject file; package.json's chromium-args get
//    --disable-devtools, as MZ's do (--devtools keeps them, e.g. to debug the build).
//
// Checked against a build from MZ's own Deployment dialog (same key): every file is the same byte for byte
// except data/System.json, which MZ writes again from the editor (it may add fields the project's file
// doesn't have yet; the encryption fields are the same).
//  - Every img/**/*.png and audio/**/*.ogg|.m4a encrypted (MZ's 16-byte header, then the file with its first
//    16 bytes XORed with the key) and renamed with a trailing "_"; data/System.json is given
//    hasEncryptedImages, hasEncryptedAudio and the key (32 hex digits, the MD5 of --key).
//
// Run the result's Game.exe. The output folder is replaced; the project is only read.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HEADER = Buffer.from([0x52, 0x50, 0x47, 0x4d, 0x56, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0]);
const DEFAULT_RUNTIMES = [
    'C:/Program Files (x86)/Steam/steamapps/common/RPG Maker MZ/nwjs-win',
    'C:/Program Files/KADOKAWA/RPGMZ/nwjs-win'
];
// Runtime files MZ's Deployment leaves out (developer tools and the old Native Client parts), so the
// result has the same files as MZ's own Windows build.
const RUNTIME_SKIP = new Set(['chromedriver.exe', 'nwjc.exe', 'payload.exe', 'nacl_irt_x86_64.nexe', 'pnacl']);

function parseArgs(argv) {
    const options = { encrypt: true, key: 'docs-doodads', runtime: null, devtools: false, project: null, out: null };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--no-encrypt') options.encrypt = false;
        else if (a === '--key') options.key = argv[++i];
        else if (a === '--runtime') options.runtime = argv[++i];
        else if (a === '--devtools') options.devtools = true;
        else if (!options.project) options.project = a;
        else if (!options.out) options.out = a;
        else throw new Error(`Unexpected argument: ${a}`);
    }
    if (!options.project || !options.out) throw new Error('Usage: npm run deploy -- <project folder> <output folder> [--key <text>] [--no-encrypt] [--devtools] [--runtime <nwjs-win>]');
    return options;
}

function copyDir(from, to, skip) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
        if (skip && skip(e.name)) continue;
        const a = path.join(from, e.name), b = path.join(to, e.name);
        if (e.isDirectory()) copyDir(a, b);
        else fs.copyFileSync(a, b);
    }
}

// MZ's encryption of one file's bytes (see Utils.decryptArrayBuffer in rmmz_core.js).
function encryptBytes(data, keyHex) {
    const key = Buffer.from(keyHex, 'hex');
    const body = Buffer.from(data);
    for (let i = 0; i < 16 && i < body.length; i++) body[i] ^= key[i];
    return Buffer.concat([HEADER, body]);
}

function decryptBytes(data, keyHex) {
    if (!data.slice(0, 16).equals(HEADER)) throw new Error('Not an MZ encrypted file');
    const key = Buffer.from(keyHex, 'hex');
    const body = Buffer.from(data.slice(16));
    for (let i = 0; i < 16 && i < body.length; i++) body[i] ^= key[i];
    return body;
}

function encryptTree(dir, test, keyHex) {
    let count = 0;
    if (!fs.existsSync(dir)) return 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) count += encryptTree(p, test, keyHex);
        else if (test(e.name)) {
            fs.writeFileSync(p + '_', encryptBytes(fs.readFileSync(p), keyHex));
            fs.unlinkSync(p);
            count++;
        }
    }
    return count;
}

function deploy(options) {
    const project = path.resolve(options.project), out = path.resolve(options.out);
    if (!fs.existsSync(path.join(project, 'index.html')) || !fs.existsSync(path.join(project, 'data', 'System.json'))) {
        throw new Error(`${project} is not an MZ project (no index.html or data/System.json).`);
    }
    if (out === project || out.startsWith(project + path.sep)) throw new Error('The output folder must be outside the project.');
    const runtime = options.runtime || DEFAULT_RUNTIMES.find(r => fs.existsSync(path.join(r, 'nw.exe')));
    if (!runtime || !fs.existsSync(path.join(runtime, 'nw.exe'))) throw new Error('No MZ nwjs-win runtime found; pass --runtime <folder with nw.exe>.');

    fs.rmSync(out, { recursive: true, force: true });
    copyDir(runtime, out, name => RUNTIME_SKIP.has(name));
    fs.renameSync(path.join(out, 'nw.exe'), path.join(out, 'Game.exe'));
    copyDir(project, out, name => name === 'save' || name.endsWith('.rmmzproject'));

    // Players don't get developer tools (MZ adds this flag to the game's chromium-args).
    const pkgPath = path.join(out, 'package.json');
    if (!options.devtools && fs.existsSync(pkgPath)) {
        const text = fs.readFileSync(pkgPath, 'utf8');
        const pkg = JSON.parse(text);
        const args = String(pkg['chromium-args'] || '').split(/\s+/).filter(Boolean);
        if (!args.includes('--disable-devtools')) {
            pkg['chromium-args'] = args.concat('--disable-devtools').join(' ');
            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
        }
    }

    const result = { out, images: 0, sounds: 0, key: null };
    if (options.encrypt) {
        const key = crypto.createHash('md5').update(String(options.key)).digest('hex');
        result.key = key;
        result.images = encryptTree(path.join(out, 'img'), n => /\.png$/i.test(n), key);
        result.sounds = encryptTree(path.join(out, 'audio'), n => /\.(ogg|m4a)$/i.test(n), key);
        const sysPath = path.join(out, 'data', 'System.json');
        const sys = JSON.parse(fs.readFileSync(sysPath, 'utf8'));
        Object.assign(sys, { hasEncryptedImages: true, hasEncryptedAudio: true, encryptionKey: key });
        fs.writeFileSync(sysPath, JSON.stringify(sys));
    }
    return result;
}

module.exports = { deploy, encryptBytes, decryptBytes, parseArgs, HEADER };

if (require.main === module) {
    try {
        const r = deploy(parseArgs(process.argv.slice(2)));
        console.log(`Deployed to ${r.out}${r.key ? `: ${r.images} images and ${r.sounds} sounds encrypted` : ' (not encrypted)'}. Run Game.exe there.`);
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
