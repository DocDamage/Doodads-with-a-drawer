// scripts/package.js
// The download for a release (GitHub, itch.io): release/Docs-Doodads-<version>.zip.
//   npm run package                          from this checkout: the plugin built from src/ as it is now
//   npm run package -- --ref v2.0.0-alpha.1  from a tag (or any commit): every file, src/ included, read from
//                                            git, whatever is checked out; this is the one to publish
//   npm run package -- --out <dir>           writes it into another folder
// The zip holds one folder, Docs-Doodads-<version>/, with the plugin, a README.txt on installing it, the guide
// (and Your First 3D Map with its pictures), the cheat sheet, the changelog, the translation template,
// tools/deploy.js (for --restore after MZ's Deployment) and the licences. No art from any library is in it.
// Files are dated with the release's date in CHANGELOG.md, so the same version gives the same zip.
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function git(args) {
    return execFileSync('git', args, { cwd: root, encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

// Where the files come from: the working tree, or a commit (read with git show). read(file) gives a Buffer;
// list(dir) the names of the files in a folder.
function source(ref) {
    if (!ref) {
        return {
            read: file => fs.readFileSync(path.join(root, file)),
            list: dir => fs.readdirSync(path.join(root, dir)).filter(f => fs.statSync(path.join(root, dir, f)).isFile()),
            commit: () => { try { return git(['rev-parse', '--short', 'HEAD']).toString().trim(); } catch (e) { return null; } }
        };
    }
    let commit;
    try { commit = git(['rev-parse', '--short', ref + '^{commit}']).toString().trim(); } catch (e) { throw new Error(`There is no commit or tag called ${ref}.`); }
    return {
        read: file => git(['show', `${ref}:${file}`]),
        list: dir => git(['ls-tree', '--name-only', ref, dir.replace(/\/?$/, '/')]).toString().split('\n').filter(Boolean).map(p => p.split('/').pop()),
        commit: () => commit
    };
}

// The plugin as src/ builds it (the same rule as scripts/build.js: the NN_name.js parts in name order).
function buildFrom(src) {
    const files = src.list('src').filter(f => f.endsWith('.js'));
    const parts = files.filter(f => /^\d{2}_.*\.js$/.test(f)).sort();
    if (!parts.length) throw new Error('No parts in src/.');
    const stray = files.filter(f => !parts.includes(f));
    if (stray.length) throw new Error(`Not built (parts are named NN_name.js): ${stray.map(f => 'src/' + f).join(', ')}`);
    return parts.map(f => src.read('src/' + f).toString('utf8')).join('');
}

// The version in package.json, the header's @plugindesc and pluginVersion (the plugin as built).
function versions(pluginText, packageJson) {
    return {
        'package.json': JSON.parse(packageJson).version,
        '@plugindesc': (pluginText.match(/@plugindesc[^\n]*\[V([^\]]+)\]/) || [])[1],
        pluginVersion: (pluginText.match(/const pluginVersion = '([^']+)'/) || [])[1]
    };
}

function checkVersions(found) {
    const set = new Set(Object.values(found));
    if (set.size !== 1 || set.has(undefined)) {
        throw new Error(`The versions differ: ${Object.entries(found).map(([k, v]) => `${k} ${v}`).join(', ')}. See CONTRIBUTING.md, Releasing.`);
    }
    return found['package.json'];
}

// The day this version was released (its CHANGELOG heading), or null while it is still Unreleased.
function releaseDate(version, changelog) {
    const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = String(changelog).match(new RegExp(`^## ${esc} — (\\d{4})-(\\d{2})-(\\d{2})`, 'm'));
    return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)) : null;
}

function readmeText(version, commit) {
    return [
        `Doc's Doodads ${version}`,
        'A map editor and doodad engine for RPG Maker MZ.',
        '',
        'INSTALL',
        "1. Copy Docs-Doodads.js into your RPG Maker MZ project's js/plugins folder.",
        '2. Turn on Docs-Doodads in Plugin Manager.',
        '3. Start a playtest and press F10 to open the editor.',
        '',
        'The editor only runs in a playtest. A deployed game draws the doodads, lights, sounds and 3D view without it.',
        'If you deploy with "Exclude unused files", put back the art the plugin draws with (Node.js needed):',
        '    node tools/deploy.js --restore <your project folder> <the deployed folder>',
        '',
        'IN THIS DOWNLOAD',
        '  Docs-Doodads.js          the plugin',
        '  Docs_Doodads_Guide.md    the user guide; docs/FIRST_3D_MAP.md walks through a first 3D map',
        '  CHEAT_SHEET.md           every notetag and plugin command on one page',
        '  CHANGELOG.md             what changed',
        "  languages/template.json  the editor's words, to translate (the guide: Editor language)",
        "  tools/deploy.js          a deployment like MZ's, and --restore (Node.js needed)",
        '  LICENSE                  MIT',
        "  licenses/Nunito-OFL.txt  the editor's font, Nunito (SIL Open Font License)",
        '',
        'CHARACTER CREATORS',
        'No art is included. The creators read each library from your computer:',
        "  RPG Maker MZ's generator parts  come with RPG Maker MZ (found by the editor)",
        '      https://store.steampowered.com/app/1096900/RPG_Maker_MZ/',
        '  The LPC library (free)           https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator',
        '  The Memao pack (paid)            https://sleeping-robot-games.itch.io/sprite-sheet-creator',
        'Keep each library outside your project: MZ\'s Deployment copies everything in the project folder.',
        '',
        'More: https://github.com/DocDamage/Doodads-with-a-drawer',
        commit ? `Built from commit ${commit}.` : '',
        ''
    ].join('\r\n');
}

// What goes in the zip: [{ name, data }], names inside the release's folder.
function contents(src, version, pluginText) {
    const out = [
        { name: 'Docs-Doodads.js', data: Buffer.from(pluginText) },
        { name: 'README.txt', data: Buffer.from(readmeText(version, src.commit())) }
    ];
    for (const file of ['Docs_Doodads_Guide.md', 'CHEAT_SHEET.md', 'CHANGELOG.md', 'LICENSE', 'docs/FIRST_3D_MAP.md', 'languages/template.json']) {
        out.push({ name: file, data: src.read(file) });
    }
    for (const pic of src.list('docs/images').filter(f => /^first3d_.*\.jpg$/i.test(f)).sort()) {
        out.push({ name: 'docs/images/' + pic, data: src.read('docs/images/' + pic) });
    }
    out.push({ name: 'tools/deploy.js', data: src.read('scripts/deploy.js') });
    out.push({ name: 'licenses/Nunito-OFL.txt', data: src.read('art/fonts/Nunito-OFL.txt') });
    return out;
}

let crcTable = null;
function crc32(buf) {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

// A zip of the files (deflated, UTF-8 names), all dated `date`.
function zip(files, date) {
    const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2);
    const dosDate = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
    const locals = [], central = [];
    let offset = 0;
    for (const f of files) {
        const name = Buffer.from(f.name, 'utf8');
        const packed = zlib.deflateRawSync(f.data, { level: 9 });
        const crc = crc32(f.data);
        const head = Buffer.alloc(30);
        head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x800, 6); head.writeUInt16LE(8, 8);
        head.writeUInt16LE(dosTime, 10); head.writeUInt16LE(dosDate, 12); head.writeUInt32LE(crc, 14);
        head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(f.data.length, 22); head.writeUInt16LE(name.length, 26);
        locals.push(head, name, packed);
        const entry = Buffer.alloc(46);
        entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8);
        entry.writeUInt16LE(8, 10); entry.writeUInt16LE(dosTime, 12); entry.writeUInt16LE(dosDate, 14); entry.writeUInt32LE(crc, 16);
        entry.writeUInt32LE(packed.length, 20); entry.writeUInt32LE(f.data.length, 24); entry.writeUInt16LE(name.length, 28);
        entry.writeUInt32LE(offset, 42);
        central.push(entry, name);
        offset += 30 + name.length + packed.length;
    }
    const dir = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
    return Buffer.concat(locals.concat([dir, end]));
}

// Writes the zip; returns { file, version, commit, files: [names], bytes }. options: { ref, out }.
function makePackage(options = {}) {
    const src = source(options.ref);
    const text = buildFrom(src);
    const version = checkVersions(versions(text, src.read('package.json').toString('utf8')));
    const folder = `Docs-Doodads-${version}`;
    const date = releaseDate(version, src.read('CHANGELOG.md').toString('utf8')) || new Date(Date.UTC(1980, 0, 1, 12));
    const files = contents(src, version, text).map(f => ({ name: folder + '/' + f.name, data: f.data }));
    const outDir = path.resolve(options.out || path.join(root, 'release'));
    fs.mkdirSync(outDir, { recursive: true });
    const file = path.join(outDir, folder + '.zip');
    const data = zip(files, date);
    fs.writeFileSync(file, data);
    return { file, version, commit: src.commit(), files: files.map(f => f.name), bytes: data.length };
}

if (require.main === module) {
    try {
        const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
        const result = makePackage({ ref: arg('--ref'), out: arg('--out') });
        console.log(`Wrote ${path.relative(process.cwd(), result.file) || result.file}: ${result.files.length} files, ${(result.bytes / 1024).toFixed(0)} KB, from ${arg('--ref') || 'this checkout'} (${result.commit || 'no git'}).`);
    } catch (e) {
        console.error(e.message || e);
        process.exitCode = 1;
    }
}

module.exports = { makePackage, source, buildFrom, versions, checkVersions, releaseDate, readmeText, contents, zip, crc32 };
