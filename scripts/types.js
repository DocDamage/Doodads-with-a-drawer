'use strict';
// npm run types: writes types/Docs-Doodads.d.ts, TypeScript types for DocsDoodads.api, so other plugins' authors
// get completion and checking in their editor. It reads src/07_public_api.js: each method and the JSDoc above it
// (@param, @returns, @template, @internal). A doodad's fields come from DocsDoodads.standardStructData
// (src/02_standard_structs_runtime_data.js). --check only reports whether the file is current, and fails when a
// method has no JSDoc or its @params don't match its arguments.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiPath = path.join(root, 'src', '07_public_api.js');
const structPath = path.join(root, 'src', '02_standard_structs_runtime_data.js');
const outPath = path.join(root, 'types', 'Docs-Doodads.d.ts');

// ---- Reading the source ----

// The text of a {type} that starts at text[start] === '{', with nested braces; returns [type, index after it].
function readBraced(text, start) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}' && --depth === 0) return [text.slice(start + 1, i).trim(), i + 1];
    }
    throw new Error(`Unclosed { in "${text}"`);
}

// Splits on commas not inside (), [], {} or quotes.
function splitTop(text) {
    const parts = [];
    let depth = 0, quote = null, last = 0;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) { if (c === quote && text[i - 1] !== '\\') quote = null; continue; }
        if (c === '\'' || c === '"' || c === '`') quote = c;
        else if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) depth--;
        else if (c === ',' && depth === 0) { parts.push(text.slice(last, i)); last = i + 1; }
    }
    parts.push(text.slice(last));
    return parts.map(p => p.trim()).filter(Boolean);
}

// A JSDoc block's lines (without the leading " * ") into { text, params, returns, template, internal }.
function parseDoc(lines) {
    const doc = { text: [], params: [], returns: null, template: null, internal: false };
    for (const line of lines) {
        if (line.startsWith('@param')) {
            const brace = line.indexOf('{');
            if (brace < 0) throw new Error(`@param without a {type}: ${line}`);
            const [type, after] = readBraced(line, brace);
            const m = line.slice(after).match(/^\s*(\[)?([A-Za-z_$][\w$]*)\]?\s*(?:-\s*(.*))?$/);
            if (!m) throw new Error(`Can't read @param: ${line}`);
            doc.params.push({ type, name: m[2], optional: Boolean(m[1]), text: m[3] || '' });
        } else if (line.startsWith('@returns')) {
            doc.returns = readBraced(line, line.indexOf('{'))[0];
        } else if (line.startsWith('@template')) {
            const [constraint, after] = readBraced(line, line.indexOf('{'));
            doc.template = { name: line.slice(after).trim(), constraint };
        } else if (line.startsWith('@internal')) {
            doc.internal = true;
        } else if (line.startsWith('@')) {
            throw new Error(`Unknown JSDoc tag: ${line}`);
        } else {
            doc.text.push(line);
        }
    }
    return doc;
}

// The members of DocsDoodads.api, in order: { name, kind: 'method' | 'value', args, doc, value }.
function readApi(source) {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const start = lines.findIndex(l => l.startsWith('DocsDoodads.api = {'));
    if (start < 0) throw new Error('src/07_public_api.js has no "DocsDoodads.api = {".');
    const members = [];
    let doc = null;
    for (let i = start + 1; i < lines.length && lines[i] !== '};'; i++) {
        const line = lines[i];
        if (line === '    /**') {
            const block = [];
            for (i++; lines[i].trim() !== '*/'; i++) block.push(lines[i].replace(/^\s*\*\s?/, ''));
            doc = parseDoc(block);
            continue;
        }
        const method = line.match(/^ {4}([A-Za-z_$][\w$]*)\((.*)\) \{/);
        if (method) {
            members.push({ name: method[1], kind: 'method', args: splitTop(method[2]), doc });
            doc = null;
            continue;
        }
        const value = line.match(/^ {4}([A-Za-z_$][\w$]*): (.+?),?$/);
        if (value) members.push({ name: value[1], kind: 'value', value: value[2], doc });
        if (line.trim() && !line.trim().startsWith('//')) doc = null;
    }
    return members;
}

// Reads DocsDoodads.standardStructData from its part without running the plugin.
function readStruct(source) {
    const m = source.match(/DocsDoodads\.standardStructData = (\{[\s\S]*?\n\});/);
    if (!m) throw new Error('src/02_standard_structs_runtime_data.js has no DocsDoodads.standardStructData.');
    return Function('"use strict"; return (' + m[1] + ');')();
}

// ---- Checking ----

const forbidden = /(^|[^\w])(any|\*)([^\w]|$)/;

// Problems with the JSDoc: [messages]. Every method needs a description, a @param per argument (same names,
// same order, a type that isn't any) and a @returns.
function problems(members) {
    const out = [];
    for (const m of members.filter(x => x.kind === 'method')) {
        const where = `DocsDoodads.api.${m.name}`;
        if (!m.doc) { out.push(`${where} has no JSDoc.`); continue; }
        if (!m.doc.text.join(' ').trim()) out.push(`${where}'s JSDoc has no description.`);
        if (!m.doc.returns) out.push(`${where} has no @returns.`);
        const names = m.args.map(a => a.split('=')[0].trim());
        const documented = m.doc.params.map(p => p.name);
        if (names.join(',') !== documented.join(',')) {
            out.push(`${where}(${names.join(', ')}) has @params for (${documented.join(', ')}).`);
        }
        for (const p of m.doc.params) {
            if (forbidden.test(p.type)) out.push(`${where}: @param ${p.name} is typed "${p.type}"; give it a real type.`);
        }
        if (m.doc.returns && forbidden.test(m.doc.returns)) out.push(`${where}: @returns is "${m.doc.returns}"; give it a real type.`);
    }
    return out;
}

// ---- Writing ----

// A TypeScript type for a default value in standardStructData.
function typeOf(key, value, indent) {
    if (key === 'bit') return 'Array<number | string>';
    if (value === null || value === undefined) return 'unknown';
    if (Array.isArray(value)) return 'unknown[]';
    if (typeof value === 'object') {
        const inner = Object.keys(value).map(k => `${indent}    ${k}: ${typeOf(k, value[k], indent + '    ')};`);
        return '{\n' + inner.join('\n') + `\n${indent}}`;
    }
    return typeof value;
}

function comment(lines, indent) {
    const text = lines.filter(l => l !== null);
    if (text.length === 0) return '';
    return `${indent}/**\n` + text.map(l => `${indent} *${l ? ' ' + l : ''}`).join('\n') + `\n${indent} */\n`;
}

const HEADER = `// Docs-Doodads.d.ts: types for DocsDoodads.api, the way other plugins and scripts find, place, move and change
// doodads, their states and lights, and the clock, season and ambient light.
// Written by npm run types from src/07_public_api.js; don't edit it by hand.
//
// To use it, put this file beside your plugin and add at the top of your .js file:
//     /// <reference path="Docs-Doodads.d.ts" />
// or list it under "include" (or "files") in your jsconfig.json or tsconfig.json.
`;

const SHARED = `
/** What a query matches: a doodad's name (any case), the doodad itself, or a description. */
type DocsDoodadQuery = string | DocsDoodad | DocsDoodadFind;

/** A description of the doodads to find; every field given must match. */
interface DocsDoodadFind {
    /** The doodad's Name, any case. */
    name?: string;
    uid?: string;
    /** Part of its art's path, any case. */
    art?: string;
    /** The tile its base is on is within radius tiles of (x, y); radius 0 is that tile. */
    near?: { x: number; y: number; radius?: number };
    mapId?: number;
    where?(d: DocsDoodad): boolean;
}

/** How a doodad comes in or goes. */
type DocsDoodadTransition = 'none' | 'fade' | 'pop' | 'rise' | 'dissolve' | 'crumble';

/** What api.place takes: the art and where, and any doodad field (light, states, touch, collision, scaleX...). */
interface DocsDoodadPlaceSpec {
    /** The picture, e.g. 'img/doodads/Rock.png'. */
    art: string;
    /** In tiles, or pixels when tiles is false. */
    x?: number;
    y?: number;
    /** true (the default): x and y are tiles. */
    tiles?: boolean;
    name?: string;
    /** It appears this way. */
    transition?: DocsDoodadTransition;
    /** How long the transition takes (30). */
    frames?: number;
    /** The map to place it on (the player's when not given). */
    mapId?: number;
    frameW?: number;
    frameH?: number;
    [field: string]: unknown;
}

/** How api.remove takes doodads away. */
interface DocsDoodadRemoveOptions {
    /** They go this way first. */
    transition?: DocsDoodadTransition;
    /** How long the transition takes (30). */
    frames?: number;
}

/** A map character: the player, an event or a follower (MZ's Game_Character). */
interface DocsCharacter {
    x: number;
    y: number;
    screenX(): number;
    screenY(): number;
    eventId?(): number;
}

/** A traversal ability. */
type DocsTraversalAbility = 'jump' | 'glide' | 'swim' | 'dive' | 'fly' | 'climb' | 'ice';

/** The events api.on listens for, and what each listener is given. */
interface DocsDoodadsEvents {
    /** The player touched a doodad; x and y are the tile its base is on. */
    touch: { doodad: DocsDoodad; mapId: number; x: number; y: number };
    /** A named doodad's state changed. */
    state: { name: string; state: string; mapId: number };
    /** A named doodad's light went on or off. */
    light: { name: string; on: boolean | null; mapId: number };
    /** A doodad's picture strip, played with playAnimation, finished. */
    animationEnd: { doodad: DocsDoodad; name: string; mapId: number };
    /** The player took off (Traversal). */
    takeOff: { mapId: number };
    /** The player landed (Traversal). */
    land: { mapId: number };
    /** The player dived (Traversal). */
    dive: { mapId: number };
}
`;

function doodadInterface(struct) {
    const known = Object.keys(struct).map(k => `    ${k}: ${typeOf(k, struct[k], '    ')};`);
    return `
/**
 * A doodad on a map, as in $dataDocsDoodads[mapId]. Fields are in pixels; x and y are its anchor (the middle of
 * its base by default). Change them through api.set and api.move so the map keeps up.
 */
interface DocsDoodad {
${known.join('\n')}
    /** Its Name, used by states, lights and find. */
    name?: string;
    /** Its id, kept through saves. */
    uid?: string;
    /** Its light. */
    light?: Record<string, unknown>;
    /** Its states (the pictures and settings it can change between). */
    states?: Array<Record<string, unknown>>;
    /** What happens when the player touches it. */
    touch?: Record<string, unknown>;
    /** Placed by api.place: it lasts for this run of the game only. */
    temp?: boolean;
    transition?: { type: string; frames: number };
    [field: string]: unknown;
}
`;
}

function member(m) {
    if (m.kind === 'value') {
        if (m.name.startsWith('_')) return '';
        const type = /^\d/.test(m.value) ? 'number' : /^['"]/.test(m.value) ? 'string' : 'unknown';
        return comment(m.name === 'version' ? ['The API\'s version; it goes up when a call changes in a way that breaks scripts.'] : [], '    ')
            + `    readonly ${m.name}: ${type};\n`;
    }
    const d = m.doc;
    const lines = d.text.slice();
    for (const p of d.params) if (p.text) lines.push(`@param ${p.name} ${p.text}`);
    if (d.internal) lines.push('@internal Used by the plugin itself.');
    const params = d.params.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
    const template = d.template ? `<${d.template.name} extends ${d.template.constraint}>` : '';
    return comment(lines, '    ') + `    ${m.name}${template}(${params}): ${d.returns};\n`;
}

function render(members, struct) {
    return HEADER + SHARED + doodadInterface(struct) + `
/** DocsDoodads.api. Everything works on the map the player is on unless a mapId is given. */
interface DocsDoodadsApi {
${members.map(member).filter(Boolean).join('\n')}}

/** Doc's Doodads. Only api is kept stable for other plugins; the rest is the plugin's own and may change. */
declare const DocsDoodads: {
    readonly api: DocsDoodadsApi;
    [part: string]: unknown;
};
`;
}

function build() {
    const members = readApi(fs.readFileSync(apiPath, 'utf8'));
    const issues = problems(members);
    const struct = readStruct(fs.readFileSync(structPath, 'utf8'));
    return { members, issues, text: issues.length ? null : render(members, struct) };
}

function run(check) {
    const result = build();
    if (result.issues.length) return { ok: false, issues: result.issues };
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8').replace(/\r\n/g, '\n') : null;
    if (check) return { ok: current === result.text, issues: [] };
    if (current !== result.text) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, result.text);
    }
    return { ok: true, issues: [] };
}

if (require.main === module) {
    const check = process.argv.includes('--check');
    const result = run(check);
    if (result.issues.length) {
        for (const issue of result.issues) console.error(issue);
        console.error('Fix the JSDoc in src/07_public_api.js, then run npm run types.');
        process.exitCode = 1;
    } else if (!result.ok) {
        console.error('types/Docs-Doodads.d.ts is out of date: run npm run types.');
        process.exitCode = 1;
    } else {
        console.log(check ? 'types/Docs-Doodads.d.ts is current.' : 'Wrote types/Docs-Doodads.d.ts.');
    }
}

module.exports = { build, run, render, readApi, parseDoc, problems, splitTop, readStruct, outPath };
