// Builds the workspace font into the plugin: the WOFF2 files listed in art/fonts/fonts.json become
// src/36_ui_fonts.js (@font-face rules with the files inside). Then run `npm run build`.
// The font's licence (art/fonts/*-OFL.txt) travels with it, inside the generated part.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'art', 'fonts');
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'fonts.json'), 'utf8'));
const licence = fs.readdirSync(dir).filter(f => /-OFL\.txt$/i.test(f)).map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('\n\n');
if (!licence) throw new Error('art/fonts needs the font licence (*-OFL.txt) next to the font files.');

const faces = Object.entries(meta.files).map(([file, range]) => {
    const data = fs.readFileSync(path.join(dir, file));
    if (data.slice(0, 4).toString('latin1') !== 'wOF2') throw new Error(`${file} is not a WOFF2 font.`);
    return `@font-face { font-family: '${meta.family}'; font-style: normal; font-weight: ${meta.weight}; font-display: swap; ` +
        `src: url(data:font/woff2;base64,${data.toString('base64')}) format('woff2'); unicode-range: ${range}; }`;
});

const out = `//==========================================================
// SECTION 24a: DocsDoodads.UiFonts (THE WORKSPACE'S ROUNDED FONT)
//==========================================================
// Built from art/fonts by scripts/fonts.js (npm run fonts). The editor's own font, so it looks the same
// on every computer. It is used by the editor only, never by the game's windows.
/*
${licence.replace(/\*\//g, '* /')}
*/
DocsDoodads.UiFonts = {
    family: ${JSON.stringify(meta.family)},
    css: ${JSON.stringify(faces.join('\n'))}
};

`;
fs.writeFileSync(path.join(root, 'src', '36_ui_fonts.js'), out);
console.log(`src/36_ui_fonts.js: ${faces.length} font file(s), ${Math.round(out.length / 1024)} KB.`);
