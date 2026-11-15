// scratch/test_types.js
// Types for DocsDoodads.api (7.1.7): npm run types writes types/Docs-Doodads.d.ts from the JSDoc in
// src/07_public_api.js. Every function on the API is in it, every event the plugin emits is typed, no documented
// parameter is "any", the file is current, and a method without JSDoc (or with @params that don't match its
// arguments) is refused.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testing API Types ===');

const root = path.resolve(__dirname, '..');
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {}, getContext: () => ({}) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: () => null
};
global.Utils = { RPGMAKER_NAME: 'MZ', isNwjs: () => false, isOptionValid: () => false };
global.PluginManager = { parameters: () => ({}) };
require(path.join(root, 'Docs-Doodads.js'));

const types = require(path.join(root, 'scripts', 'types.js'));
const dts = fs.readFileSync(types.outPath, 'utf8').replace(/\r\n/g, '\n');
const apiBlock = dts.slice(dts.indexOf('interface DocsDoodadsApi {'), dts.indexOf('declare const DocsDoodads'));

// The file is current and the JSDoc has no problems.
{
    const result = types.run(true);
    assert.deepStrictEqual(result.issues, [], 'the JSDoc in src/07_public_api.js has no problems');
    assert.ok(result.ok, 'types/Docs-Doodads.d.ts is current (npm run types)');
    console.log('PASS the file is current');
}

// Every function on DocsDoodads.api is declared, with the same number of parameters.
{
    const api = DocsDoodads.api;
    const fns = Object.keys(api).filter(k => typeof api[k] === 'function');
    assert.ok(fns.length >= 40, 'the API has its methods');
    for (const name of fns) {
        const m = apiBlock.match(new RegExp(`\\n {4}${name}(<[^>]*>)?\\(([^\\n]*)\\): `));
        assert.ok(m, `api.${name} is in the .d.ts`);
        const declared = m[2].trim() ? types.splitTop(m[2]).length : 0;
        // Function.length stops at the first default, so it can only be at most the declared count.
        assert.ok(api[name].length <= declared, `api.${name} declares all ${api[name].length}+ parameters`);
    }
    assert.ok(/readonly version: number;/.test(apiBlock), 'version is declared');
    assert.ok(!/_listeners/.test(apiBlock), 'private fields are left out');
    console.log(`PASS all ${fns.length} functions are declared`);
}

// Balanced braces, parentheses and brackets; no "any".
{
    const code = dts.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*\*)/.test(l)).join('\n');
    for (const [open, close] of [['{', '}'], ['(', ')'], ['[', ']'], ['<', '>']]) {
        const count = c => code.split(c).length - 1;
        const closes = close === '>' ? count(close) - (code.split('=>').length - 1) : count(close);
        assert.strictEqual(count(open), closes, `balanced ${open}${close}`);
    }
    assert.ok(!/(^|[^\w])any([^\w]|$)/.test(code), 'no any');
    assert.ok(/declare const DocsDoodads: \{\n {4}readonly api: DocsDoodadsApi;/.test(dts), 'DocsDoodads.api is declared');
    console.log('PASS balanced, and no any');
}

// The doodad's fields come from standardStructData.
{
    const block = dts.slice(dts.indexOf('interface DocsDoodad {'), dts.indexOf('interface DocsDoodadsApi'));
    for (const [key, value] of Object.entries(DocsDoodads.standardStructData)) {
        assert.ok(new RegExp(`\\n {4}${key}: `).test(block), `DocsDoodad has ${key}`);
        if (typeof value === 'number') assert.ok(block.includes(`    ${key}: number;`), `${key} is a number`);
    }
    console.log('PASS the doodad has every field of standardStructData');
}

// Every event the plugin emits is in DocsDoodadsEvents.
{
    const events = dts.slice(dts.indexOf('interface DocsDoodadsEvents {'));
    const eventBlock = events.slice(0, events.indexOf('\n}\n'));
    const emitted = new Set(['takeOff', 'land', 'dive']); // Traversal.hook(name) emits these by name.
    for (const file of fs.readdirSync(path.join(root, 'src'))) {
        const text = fs.readFileSync(path.join(root, 'src', file), 'utf8');
        for (const m of text.matchAll(/api\.emit\('([A-Za-z]+)'/g)) emitted.add(m[1]);
    }
    assert.ok(emitted.has('touch') && emitted.has('state') && emitted.has('light') && emitted.has('animationEnd'), 'found the emits');
    for (const name of emitted) assert.ok(new RegExp(`\\n {4}${name}: \\{`).test(eventBlock), `the "${name}" event is typed`);
    const hooks = fs.readFileSync(path.join(root, 'src', '17_traversal.js'), 'utf8');
    for (const name of ['takeOff', 'land', 'dive']) assert.ok(hooks.includes(`hook('${name}')`), `Traversal emits ${name}`);
    console.log(`PASS all ${emitted.size} events are typed`);
}

// Missing or mismatched JSDoc is refused.
{
    const source = [
        'DocsDoodads.api = {',
        '    version: 1,',
        '    /**',
        '     * Fine.',
        '     * @param {number} a',
        '     * @param {string} [b]',
        '     * @returns {boolean}',
        '     */',
        '    good(a, b = \'x\') { return true; },',
        '    bare(x) { return x; },',
        '    /**',
        '     * Wrong names.',
        '     * @param {number} y',
        '     * @returns {void}',
        '     */',
        '    wrong(x) {},',
        '    /**',
        '     * Untyped.',
        '     * @param {any} x',
        '     */',
        '    loose(x) {}',
        '};'
    ].join('\n');
    const members = types.readApi(source);
    assert.deepStrictEqual(members.map(m => m.name), ['version', 'good', 'bare', 'wrong', 'loose']);
    const issues = types.problems(members);
    assert.ok(!issues.some(i => i.includes('.good')), 'a documented method passes');
    assert.ok(issues.some(i => i.includes('api.bare has no JSDoc')), 'no JSDoc');
    assert.ok(issues.some(i => i.includes('api.wrong(x) has @params for (y)')), 'wrong names');
    assert.ok(issues.some(i => i.includes('api.loose: @param x is typed "any"')), 'any');
    assert.ok(issues.some(i => i.includes('api.loose has no @returns')), 'no @returns');
    const doc = types.parseDoc(['Text.', '@param {{ a: { b: number } }} [opts] - Nested.', '@returns {void}']);
    assert.deepStrictEqual(doc.params[0], { type: '{ a: { b: number } }', name: 'opts', optional: true, text: 'Nested.' });
    assert.throws(() => types.parseDoc(['@see elsewhere']), /Unknown JSDoc tag/);
    console.log('PASS missing or wrong JSDoc is refused');
}

console.log('\nAll API type tests passed.');
