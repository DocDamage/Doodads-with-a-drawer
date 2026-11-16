'use strict';
// Build the small guide index shipped with the editor; the complete guide stays in its own file.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function headings(markdown) {
    const out = [], used = new Set();
    let fenced = false, current = null, paragraph = false;
    for (const line of String(markdown).split(/\r?\n/)) {
        if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
        if (fenced) continue;
        const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
        if (heading) {
            const title = heading[2].replace(/`([^`]+)`/g, '$1');
            const base = title.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
            let anchor = base, suffix = 0;
            while (used.has(anchor)) anchor = base + '-' + (++suffix);
            used.add(anchor);
            current = { title, anchor, firstParagraph: '' };
            out.push(current); paragraph = false;
        } else if (current && !paragraph) {
            if (!line.trim()) { if (current.firstParagraph) paragraph = true; continue; }
            const plain = line.trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '');
            current.firstParagraph += (current.firstParagraph ? ' ' : '') + plain;
        }
    }
    return out;
}
function source(markdown) {
    return '// @editor-only\n// Guide headings and the first paragraph of each section. Run npm run help after editing the guide.\n'
        + 'DocsDoodads.HelpIndex = ' + JSON.stringify(headings(markdown), null, 4) + ';\n';
}
if (require.main === module) {
    const text = source(fs.readFileSync(path.join(root, 'Docs_Doodads_Guide.md'), 'utf8'));
    const target = path.join(root, 'src/11_help_index.js');
    if (process.argv.includes('--check')) {
        if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) {
            console.error('The guide index is stale. Run npm run help, then npm run build.'); process.exitCode = 1;
        } else console.log('Guide index matches the guide.');
    } else { fs.writeFileSync(target, text); console.log('Built the guide index.'); }
}
module.exports = { headings, source };
