'use strict';
// npm run shortcuts: writes the keyboard table in Docs_Doodads_Guide.md (between the shortcuts markers)
// from DocsDoodads.Shortcuts, the table the editor itself uses. --check only reports whether it is current.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const guidePath = path.join(root, 'Docs_Doodads_Guide.md');
const START = '<!-- shortcuts:start (written by npm run shortcuts from src/11_shortcuts.js) -->';
const END = '<!-- shortcuts:end -->';

// Just enough of a page and of MZ for the plugin to load outside a game.
function loadTable() {
    const g = global;
    if (!g.DocsDoodads) {
        g.window = g;
        g.window.addEventListener = () => {};
        g.window.removeEventListener = () => {};
        g.document = {
            createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
            body: { appendChild() {}, removeChild() {} },
            getElementById: () => null
        };
        g.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => false, isOptionValid: () => false };
        g.PluginManager = { parameters: () => ({}) };
        require(path.join(root, 'Docs-Doodads.js'));
    }
    return g.DocsDoodads.Shortcuts;
}

function render(guide, table) {
    const a = guide.indexOf(START), b = guide.indexOf(END);
    if (a < 0 || b < a) throw new Error('Docs_Doodads_Guide.md has no shortcuts markers.');
    return guide.slice(0, a + START.length) + '\n' + table + '\n' + guide.slice(b);
}

function run(check) {
    const guide = fs.readFileSync(guidePath, 'utf8').replace(/\r\n/g, '\n');
    const next = render(guide, loadTable().markdown());
    if (check) return next === guide;
    if (next !== guide) fs.writeFileSync(guidePath, next);
    return true;
}

if (require.main === module) {
    const check = process.argv.includes('--check');
    const ok = run(check);
    if (check && !ok) {
        console.error('The guide\'s shortcut table is out of date: run npm run shortcuts.');
        process.exitCode = 1;
    } else {
        console.log(check ? 'Shortcut table is current.' : 'Wrote the shortcut table into Docs_Doodads_Guide.md.');
    }
}

module.exports = { run, render, START, END };
