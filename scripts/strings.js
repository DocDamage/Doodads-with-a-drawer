'use strict';
// npm run strings: writes languages/template.json, every English string the editor shows that could be
// found in src/ (button and card text, tooltips, placeholders, labels, messages, palette commands), keyed
// by the English words with "" to fill in. Text built from values (`Placed ${n} doodads`) is written with
// a {name} for each value ("Placed {n} doodads"), which the translation keeps. Copy the file to
// data/DocsDoodadsLanguages/<code>.json, set "language" and fill in the strings.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'languages', 'template.json');

// The editor's parts: its look and cards (36), the workspace (37-44), the shortcut table, key bindings, and
// the character creators' slots (their row labels: Beast ears, Field tool...).
const partFiles = () => fs.readdirSync(src).filter(f => /^(3[6-9]|4[0-5])_.*\.js$|^11_shortcuts\.js$|^23_(lpc|memao|mzgen)_slots\.js$/.test(f) && !/ui_(icons|fonts)\.js$/.test(f)).sort();

// `Placed ${list.length} doodads` -> 'Placed {length} doodads'
function placeholders(text) {
    // Icons are pictures, not words: `${U.icon('box', 1)} Packs` is shown as "Packs".
    text = text.replace(/\$\{\s*(?:[\w.]*\.)?icon\([^)]*\)\s*\}/g, '').replace(/\$\{\s*escapeHtml\(([^)]*)\)\s*\}/g, '${$1}');
    return text.replace(/\$\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, (m, expr) => {
        const names = expr.match(/[A-Za-z_]\w*/g) || ['value'];
        const skip = new Set(['this', 'escapeHtml', 'String', 'Math', 'round', 'length', 'DocsDoodads', 'U', 'Ui', 'icon', 'join', 'map']);
        const name = names.reverse().find(n => !skip.has(n)) || 'value';
        return '{' + name + '}';
    });
}

function looksLikeWords(s) {
    const t = s.trim();
    if (t.length < 2 || !/[A-Za-z]{2}/.test(t)) return false;
    // Mostly values, or code: not something a translator can work on.
    const words = t.replace(/\{\w+\}/g, '');
    if ((words.match(/[A-Za-z]/g) || []).length < 3 || /\}\{/.test(t)) return false;
    if (/\w\(|\w\[|\w\.\w+\(/.test(words) || (words.split('(').length !== words.split(')').length)) return false;
    if (/^[\w.$-]+$/.test(t) && !/\s/.test(t) && !/^[A-Z][a-z]+$/.test(t)) return false; // ids, keys, paths
    if (/[{};=<>]|=>|\bfunction\b|^\s*\/\//.test(t.replace(/\{\w+\}/g, ''))) return false;
    if (/^(dd-|#|\.|img\/|audio\/|data\/|var\(|rgba?\(|https?:)/.test(t)) return false;
    if (/^(px|em|auto|none|block|flex|grid|absolute|fixed|bold|normal|center|left|right|top|bottom)$/i.test(t)) return false;
    return true;
}

function collect(code) {
    const found = new Set();
    const add = s => {
        if (typeof s !== 'string') return;
        const t = placeholders(s).replace(/\s+/g, ' ').trim();
        if (looksLikeWords(t)) found.add(t);
    };
    const patterns = [
        /\b(?:title|placeholder|aria-label)="([^"]+)"/g,                    // attributes in HTML strings
        />\s*([^<>`]*?[A-Za-z][^<>`]*?)\s*</g,                                // text between tags
        /\b(?:label|text|title|ok|cancel|hint|name):\s*'((?:[^'\\]|\\.)+)'/g,  // { label: '...' }
        /\b(?:label|text|title|ok|cancel|hint|name):\s*"((?:[^"\\]|\\.)+)"/g,
        /\b(?:label|text|title|ok|cancel|hint):\s*`([^`]+)`/g,
        /showToast\(\s*'((?:[^'\\]|\\.)+)'/g, /showToast\(\s*"((?:[^"\\]|\\.)+)"/g, /showToast\(\s*`([^`]+)`/g,
        /\b(?:confirm|prompt|alert|choose)\(\s*'((?:[^'\\]|\\.)+)'/g, /\b(?:confirm|prompt|alert|choose)\(\s*`([^`]+)`/g,
        /\badd\(\s*'((?:[^'\\]|\\.)+)'\s*,\s*\(/g, /\badd\(\s*`([^`]+)`\s*,\s*\(/g, // palette commands
        /\.(?:textContent|title)\s*=\s*'((?:[^'\\]|\\.)+)'/g
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(code))) add(m[1].replace(/\\'/g, "'").replace(/\\"/g, '"'));
    }
    return found;
}

function build() {
    const all = new Set();
    for (const file of partFiles()) for (const s of collect(fs.readFileSync(path.join(src, file), 'utf8'))) all.add(s);
    const strings = {};
    for (const key of Array.from(all).sort((a, b) => a.localeCompare(b))) strings[key] = '';
    return {
        language: '',
        note: 'Copy to data/DocsDoodadsLanguages/<code>.json (for example de.json), put the language\'s own name in "language", and fill in the strings. Leave a string empty to keep the English. Keep each {name} as it is.',
        strings
    };
}

if (require.main === module) {
    const template = build();
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(template, null, 2) + '\n');
    console.log(`Wrote ${path.relative(root, out)} with ${Object.keys(template.strings).length} strings.`);
}

module.exports = { build, collect, placeholders, looksLikeWords };
