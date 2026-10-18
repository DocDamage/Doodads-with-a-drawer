// scripts/build.js
// Builds the shipped plugin, Docs-Doodads.js, by joining the parts in src/ in file-name order.
// The parts are pieces of one script (the plugin is a single function), not standalone modules.
//   npm run build           writes Docs-Doodads.js
//   npm run build -- --check fails if Docs-Doodads.js differs from what src/ builds
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const outFile = path.join(root, 'Docs-Doodads.js');

function build() {
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
    const parts = files.filter(f => /^\d{2}_.*\.js$/.test(f)).sort();
    if (!parts.length) throw new Error('No parts in src/.');
    // A part named without its two-digit number would be left out of the plugin without a word.
    const stray = files.filter(f => !parts.includes(f));
    if (stray.length) throw new Error(`Not built (parts are named NN_name.js): ${stray.map(f => 'src/' + f).join(', ')}`);
    return { parts, text: parts.map(f => fs.readFileSync(path.join(srcDir, f), 'utf8')).join('') };
}

function firstDifference(a, b) {
    const la = a.split('\n'), lb = b.split('\n');
    for (let i = 0; i < Math.max(la.length, lb.length); i++) if (la[i] !== lb[i]) return i + 1;
    return 0;
}

if (require.main === module) {
    const { parts, text } = build();
    if (process.argv.includes('--check')) {
        const current = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
        if (current !== text) {
            console.error(`Docs-Doodads.js does not match src/ (first difference at line ${firstDifference(current, text)}). Edit src/ and run npm run build.`);
            process.exitCode = 1;
        } else {
            console.log(`Docs-Doodads.js matches src/ (${parts.length} parts).`);
        }
    } else {
        fs.writeFileSync(outFile, text);
        console.log(`Built Docs-Doodads.js from ${parts.length} parts (${text.split('\n').length} lines).`);
    }
}

module.exports = { build };
