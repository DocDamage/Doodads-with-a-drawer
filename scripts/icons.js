// Builds the workspace icons into the plugin: art/ui_icons.png (edit it in Aseprite; one 16 x 16 icon
// per cell, in the order of art/ui_icons.json) becomes src/36_ui_icons.js. Then run `npm run build`.
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const png = fs.readFileSync(path.join(root, 'art', 'ui_icons.png'));
const meta = JSON.parse(fs.readFileSync(path.join(root, 'art', 'ui_icons.json'), 'utf8'));
const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
if (width !== meta.cols * meta.size) throw new Error(`art/ui_icons.png is ${width} wide; ${meta.cols} icons of ${meta.size}px make ${meta.cols * meta.size}.`);
if (Math.ceil(meta.names.length / meta.cols) * meta.size > height) throw new Error('art/ui_icons.png has fewer rows than art/ui_icons.json names.');

const out = `//==========================================================
// SECTION 24b: DocsDoodads.UiIcons (WORKSPACE PIXEL ICONS)
//==========================================================
// Built from art/ui_icons.png by scripts/icons.js: edit the picture, then run npm run icons.
DocsDoodads.UiIcons = {
    size: ${meta.size},
    cols: ${meta.cols},
    width: ${width},
    height: ${height},
    names: ${JSON.stringify(meta.names)},
    url: 'data:image/png;base64,${png.toString('base64')}'
};

`;
fs.writeFileSync(path.join(root, 'src', '36_ui_icons.js'), out);
console.log(`src/36_ui_icons.js: ${meta.names.length} icons (${png.length} bytes of PNG).`);
