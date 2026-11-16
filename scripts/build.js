// scripts/build.js
// Builds the shipped plugin, Docs-Doodads.js, by joining the parts in src/ in file-name order.
// The parts are pieces of one script (the plugin is a single function), not standalone modules.
//   npm run build           writes Docs-Doodads.js
//   npm run build:game      writes release/Docs-Doodads.game.js without // @editor-only parts
//   npm run build -- --check fails if Docs-Doodads.js differs from what src/ builds
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const outFile = path.join(root, 'Docs-Doodads.js');
const gameOutFile = path.join(root, 'release', 'Docs-Doodads.game.js');

function firstLine(text) {
    const end = text.search(/\r?\n/);
    return end < 0 ? text : text.slice(0, end);
}

function build(options = {}) {
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
    const allParts = files.filter(f => /^\d{2}_.*\.js$/.test(f)).sort();
    if (!allParts.length) throw new Error('No parts in src/.');
    // A part named without its two-digit number would be left out of the plugin without a word.
    const stray = files.filter(f => !allParts.includes(f));
    if (stray.length) throw new Error(`Not built (parts are named NN_name.js): ${stray.map(f => 'src/' + f).join(', ')}`);
    const sources = new Map(allParts.map(f => [f, fs.readFileSync(path.join(srcDir, f), 'utf8')]));
    const editorParts = allParts.filter(f => firstLine(sources.get(f)) === '// @editor-only');
    const parts = options.game ? allParts.filter(f => !editorParts.includes(f)) : allParts;
    return { parts, editorParts, text: parts.map(f => sources.get(f)).join('') };
}

function firstDifference(a, b) {
    const la = a.split('\n'), lb = b.split('\n');
    for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) return i + 1;
    return 0;
}

if (require.main === module) {
    const game = process.argv.includes('--game');
    const { parts, text } = build({ game });
    if (process.argv.includes('--check')) {
        const target = game ? gameOutFile : outFile;
        const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
        if (current !== text) {
            console.error(`${path.relative(root, target)} does not match src/ (first difference at line ${firstDifference(current, text)}). Edit src/ and run npm run ${game ? 'build:game' : 'build'}.`);
            process.exitCode = 1;
        } else {
            console.log(`${path.relative(root, target)} matches src/ (${parts.length} parts).`);
        }
    } else {
        const target = game ? gameOutFile : outFile;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, text);
        console.log(`Built ${path.relative(root, target)} from ${parts.length} parts (${text.split('\n').length} lines).`);
    }
}

module.exports = { build, firstLine, outFile, gameOutFile };
