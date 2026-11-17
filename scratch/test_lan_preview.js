'use strict';
// 8.3.5 The playtest on a phone: the QR writer against published values and a decoder, the read-only
// server's path rules, real HTTP answers, start/stop/unmount, and the phone-side reload script.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const vm = require('vm');
const E = require('./engine/fake_engine');

const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-lan-preview-'));
process.chdir(projectRoot);
E.install();
E.setupWorld({ width: 10, height: 10, px: 2, py: 2 });
require('../Docs-Doodads.js');
const D = DocsDoodads, Q = D.Qr, L = D.LanPreview, W = D.Workspace;

// ---- QR: published values ----
// Reed–Solomon for the "HELLO WORLD" 1-M data codewords (Thonky's worked example).
const hello = [0x20, 0x5B, 0x0B, 0x78, 0xD1, 0x72, 0xDC, 0x4D, 0x43, 0x40, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11];
assert.deepStrictEqual(Q.remainder(hello, Q.divisor(10)), [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
// Format information for every mask at L and M (ISO/IEC 18004 table C.1).
const formatTable = {
    L: ['111011111000100', '111001011110011', '111110110101010', '111100010011101', '110011000101111', '110001100011000', '110110001000001', '110100101110110'],
    M: ['101010000010010', '101000100100101', '101111001111100', '101101101001011', '100010111111001', '100000011001110', '100111110010111', '100101010100000']
};
for (const ecc of ['L', 'M']) formatTable[ecc].forEach((bits, mask) => assert.strictEqual(Q.formatBits(ecc, mask).toString(2).padStart(15, '0'), bits, `format ${ecc}${mask}`));
assert.strictEqual(Q.versionBits(7).toString(2).padStart(18, '0'), '000111110010010100');
assert.strictEqual(Q.versionBits(8).toString(2).padStart(18, '0'), '001000010110111100');
// Byte-mode capacities for versions 1–10.
const capacities = { L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271], M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213],
    Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151], H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119] };
for (const ecc of Object.keys(capacities)) capacities[ecc].forEach((bytes, i) => assert.strictEqual(Q.capacity(i + 1, ecc), bytes, `capacity ${i + 1}-${ecc}`));
assert.deepStrictEqual([1, 2, 7, 10].map(v => Q.alignmentPositions(v)), [[], [6, 18], [6, 22, 38], [6, 28, 50]]);
assert.deepStrictEqual([1, 2, 7, 10].map(v => Q.totalCodewords(v)), [26, 44, 196, 346]);

// ---- QR: an independent reader ----
function decode(modules) {
    const size = modules.length, version = (size - 17) / 4;
    const firstCopy = [];
    for (let i = 0; i <= 5; i++) firstCopy[i] = modules[i][8];
    firstCopy[6] = modules[7][8]; firstCopy[7] = modules[8][8]; firstCopy[8] = modules[8][7];
    for (let i = 9; i < 15; i++) firstCopy[i] = modules[8][14 - i];
    const read = firstCopy.reduce((value, bit, i) => value | (bit << i), 0);
    let best = null;
    for (const ecc of ['L', 'M', 'Q', 'H']) for (let mask = 0; mask < 8; mask++) {
        let diff = Q.formatBits(ecc, mask) ^ read, count = 0;
        while (diff) { count += diff & 1; diff >>>= 1; }
        if (!best || count < best.count) best = { ecc, mask, count };
    }
    assert.strictEqual(best.count, 0, 'format information reads back exactly');
    const second = [];
    for (let i = 0; i < 8; i++) second[i] = modules[8][size - 1 - i];
    for (let i = 8; i < 15; i++) second[i] = modules[size - 15 + i][8];
    assert.strictEqual(second.reduce((value, bit, i) => value | (bit << i), 0), read, 'both format copies agree');
    assert.strictEqual(modules[size - 8][8], 1, 'the dark module is dark');
    for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
        assert.strictEqual(modules[cy][cx], 1); assert.strictEqual(modules[cy - 2][cx], 0); assert.strictEqual(modules[cy - 3][cx], 1);
    }
    const fixed = Q.functionPatterns(version).fixed;
    const bits = Q.placementOrder(fixed).map(([x, y]) => modules[y][x] ^ (Q.maskAt(best.mask, x, y) ? 1 : 0));
    const total = Q.totalCodewords(version), codewords = [];
    for (let i = 0; i < total; i++) codewords.push(bits.slice(i * 8, i * 8 + 8).reduce((a, b) => (a << 1) | b, 0));
    // De-interleave and check every block's syndromes are zero.
    const blocks = Q.blockCount[best.ecc][version], eccLength = Q.eccPerBlock[best.ecc][version];
    const shortLength = Math.floor(total / blocks), shortBlocks = blocks - total % blocks;
    const lengths = Array.from({ length: blocks }, (_, i) => shortLength - eccLength + (i < shortBlocks ? 0 : 1));
    const list = lengths.map(() => []);
    let k = 0;
    for (let i = 0; i < Math.max(...lengths); i++) for (let b = 0; b < blocks; b++) if (i < lengths[b]) list[b].push(codewords[k++]);
    for (let i = 0; i < eccLength; i++) for (let b = 0; b < blocks; b++) list[b].push(codewords[k++]);
    for (const block of list) {
        let alpha = 1;
        for (let s = 0; s < eccLength; s++) {
            let value = 0;
            for (const c of block) value = Q.multiply(value, alpha) ^ c;
            assert.strictEqual(value, 0, 'Reed–Solomon syndrome is zero');
            alpha = Q.multiply(alpha, 2);
        }
    }
    const data = [];
    list.forEach((block, b) => data.push(...block.slice(0, lengths[b])));
    const stream = data.flatMap(byte => [7, 6, 5, 4, 3, 2, 1, 0].map(i => (byte >>> i) & 1));
    let at = 0;
    const take = n => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | stream[at++]; return v; };
    assert.strictEqual(take(4), 4, 'byte mode');
    const length = take(version < 10 ? 8 : 16), bytes = [];
    for (let i = 0; i < length; i++) bytes.push(take(8));
    return { text: Buffer.from(bytes).toString('utf8'), ecc: best.ecc, mask: best.mask, version };
}
for (const [text, ecc] of [['HELLO', 'L'], ['http://192.168.1.23:51234/0123456789abcdef0123456789abcdef/', 'M'], ['é ✓ 日本', 'Q'], ['x'.repeat(200), 'M']]) {
    const qr = Q.encode(text, { ecc });
    assert.strictEqual(qr.size, qr.version * 4 + 17);
    assert.ok(qr.modules.every(row => row.length === qr.size && row.every(v => v === 0 || v === 1)));
    const back = decode(qr.modules);
    assert.strictEqual(back.text, text, `QR round trip (${ecc}, version ${qr.version})`);
    assert.strictEqual(back.ecc, ecc);
    assert.strictEqual(back.mask, qr.mask);
}
for (let mask = 0; mask < 8; mask++) assert.strictEqual(decode(Q.encode('mask test', { mask }).modules).mask, mask, `mask ${mask} reads back`);
assert.strictEqual(Q.encode('http://192.168.1.23:51234/0123456789abcdef0123456789abcdef/', { ecc: 'M' }).version, 4, 'a preview address fits version 4');
assert.ok(Q.encode('x'.repeat(200), { ecc: 'M' }).version >= 7, 'long text uses version information');
assert.deepStrictEqual(Q.encode('same'), Q.encode('same'), 'the same text makes the same code');
assert.throws(() => Q.encode('x'.repeat(300), { ecc: 'M' }), /too long/i);

// ---- Server rules ----
assert.ok(['10.0.0.5', '172.16.1.1', '172.31.255.255', '192.168.1.23'].every(ip => L.privateAddress(ip)));
assert.ok(!['127.0.0.1', '0.0.0.0', '8.8.8.8', '172.32.0.1', '169.254.1.1', '192.168.1.256', '::1', 'fe80::1', ''].some(ip => L.privateAddress(ip)));
assert.strictEqual(L.pickAddress({
    lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }],
    eth0: [{ family: 'IPv4', address: '10.1.2.3', internal: false }, { family: 'IPv6', address: 'fe80::1', internal: false }],
    wlan0: [{ family: 4, address: '192.168.0.9', internal: false }],
    vpn: [{ family: 'IPv4', address: '100.64.0.1', internal: false }]
}), '192.168.0.9', 'a home network address is preferred; loopback and public addresses are never used');
assert.strictEqual(L.pickAddress({ lo: [{ family: 'IPv4', address: '127.0.0.1', internal: true }] }), null);

const token = '0123456789abcdef0123456789abcdef';
const R = url => L.resolveRequest(projectRoot, url, token, path);
assert.strictEqual(R(`/${token}/`).rel, 'index.html');
assert.strictEqual(R(`/${token}/`).index, true);
assert.strictEqual(R(`/${token}/img/doodads/Tree.png?v=2`).rel, 'img/doodads/Tree.png');
assert.strictEqual(R(`/${token}/data/Map001.json`).rel, 'data/Map001.json');
assert.deepStrictEqual(R(`/${token}/__changed`), { kind: 'changed' });
assert.deepStrictEqual(R(`/${token}`), { status: 301, location: `/${token}/` });
const refused = [
    '/', '/index.html', `/${'f'.repeat(32)}/index.html`, `/${token}/../package.json`, `/${token}/img/../../secret.txt`,
    `/${token}/%2e%2e/secret.txt`, `/${token}/img%2F..%2F..%2Fsecret.txt`, `/${token}/img/..%5C..%5Csecret.txt`, `/${token}/save/file1.rmmzsave`,
    `/${token}/.git/config`, `/${token}/img/.hidden.png`, `/${token}/data/docs_doodads_cache/backups/Map001.json`,
    `/${token}/DATA/Docs_Doodads_Cache/reports/r.json`, `/${token}/data/docs_doodads_cache./x.json`, `/${token}/data/DOCS_D~1/x.json`,
    `/${token}/game.rmmzproject`, `/${token}/package.json`, `/${token}/img/x.png:stream`, `/${token}/img/%00.png`, `/${token}/img/bad%zz.png`,
    `/${token}/index.html/x`, `/${token}/img`, `/${token}//img/x.png`, `/${token}/${'a'.repeat(2100)}`
];
for (const url of refused) assert.ok(R(url).status >= 400, `refused: ${url.slice(0, 80)}`);
assert.strictEqual(L.resolveRequest(projectRoot, `/${token}/`, 'short', path).status, 404, 'a weak token is never accepted');
assert.strictEqual(L.contentType('a/b.PNG'), 'image/png');
assert.strictEqual(L.contentType('a/b.unknown'), 'application/octet-stream');
const injected = L.injectIndex('<html><head><title>x</title></head><body><script src="js/main.js"></script></body></html>');
assert.ok(injected.indexOf('<script>(function(config)') < injected.indexOf('</head>'), 'the reload script runs before the game');
assert.ok(injected.includes('"changed":"__changed"'));

// ---- Real HTTP on loopback around the same handler ----
const write = (rel, data) => { fs.mkdirSync(path.dirname(path.join(projectRoot, rel)), { recursive: true }); fs.writeFileSync(path.join(projectRoot, rel), data); };
write('index.html', '<!DOCTYPE html><html><head><title>Game</title></head><body><script src="js/main.js"></script></body></html>');
write('js/main.js', 'console.log(1);');
write('js/plugins.js', 'var $plugins = [];');
write('img/doodads/Tree.png', Buffer.from('0123456789'));
write('data/Map001.json', '{}');
write('data/docs_doodads_cache/backups/secret.json', '{"secret":true}');
write('save/file1.rmmzsave', 'save');
write('package.json', '{}');
fs.mkdirSync(path.join(os.tmpdir(), 'dd-lan-outside'), { recursive: true });
fs.writeFileSync(path.join(os.tmpdir(), 'dd-lan-outside', 'secret.txt'), 'outside');
let linked = false;
try { fs.symlinkSync(path.join(os.tmpdir(), 'dd-lan-outside'), path.join(projectRoot, 'img', 'escape'), 'junction'); linked = true; } catch (error) { linked = false; }

const realRoot = fs.realpathSync.native(projectRoot);
const ctx = { root: projectRoot, realRoot, token, fs, path, changedCache: null };
const server = http.createServer((req, res) => L.handle(req, res, ctx));
const request = (method, url, headers = {}) => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: server.address().port, method, path: url, headers }, res => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
});

(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        const index = await request('GET', `/${token}/`);
        assert.strictEqual(index.status, 200);
        assert.ok(index.body.includes('__changed') && index.body.includes('js/main.js'), 'index.html is served with the reload script');
        assert.strictEqual(index.headers['cache-control'], 'no-store');
        assert.strictEqual(index.headers['x-content-type-options'], 'nosniff');
        const tree = await request('GET', `/${token}/img/doodads/Tree.png`);
        assert.strictEqual(tree.status, 200); assert.strictEqual(tree.body, '0123456789'); assert.strictEqual(tree.headers['content-type'], 'image/png');
        const part = await request('GET', `/${token}/img/doodads/Tree.png`, { Range: 'bytes=2-4' });
        assert.strictEqual(part.status, 206); assert.strictEqual(part.body, '234'); assert.strictEqual(part.headers['content-range'], 'bytes 2-4/10');
        assert.strictEqual((await request('GET', `/${token}/img/doodads/Tree.png`, { Range: 'bytes=-3' })).body, '789');
        assert.strictEqual((await request('GET', `/${token}/img/doodads/Tree.png`, { Range: 'bytes=20-' })).status, 416);
        const head = await request('HEAD', `/${token}/img/doodads/Tree.png`);
        assert.strictEqual(head.status, 200); assert.strictEqual(head.body, '');
        assert.strictEqual((await request('POST', `/${token}/data/Map001.json`)).status, 405, 'nothing can be written');
        assert.strictEqual((await request('PUT', `/${token}/data/Map001.json`)).status, 405);
        for (const url of [`/${token}/data/docs_doodads_cache/backups/secret.json`, `/${token}/save/file1.rmmzsave`, `/${token}/package.json`,
            `/${token}/%2e%2e/%2e%2e/secret.txt`, '/data/Map001.json', `/${token}/img/doodads`]) {
            const answer = await request('GET', url);
            assert.strictEqual(answer.status, 404, `not served: ${url}`);
            assert.ok(!answer.body.includes('secret') && !answer.body.includes(projectRoot), 'refusals do not echo paths or contents');
        }
        if (linked) assert.strictEqual((await request('GET', `/${token}/img/escape/secret.txt`)).status, 404, 'a link out of the project is not followed');
        const changed1 = JSON.parse((await request('GET', `/${token}/__changed`)).body).saved;
        assert.ok(changed1 > 0);
        const later = new Date(Date.now() + 10000);
        fs.utimesSync(path.join(projectRoot, 'data/Map001.json'), later, later);
        assert.strictEqual(JSON.parse((await request('GET', `/${token}/__changed`)).body).saved, changed1, 'the save time is read at most once a second');
        ctx.changedCache.at = 0;
        assert.ok(JSON.parse((await request('GET', `/${token}/__changed`)).body).saved > changed1, 'a saved data file changes the save time');
    } finally {
        await new Promise(resolve => server.close(resolve));
    }

    // ---- Start, Stop and editor close ----
    const fakeServer = () => {
        const handlers = {};
        const s = { closed: false, listenedOn: null, on(event, fn) { (handlers[event] = handlers[event] || []).push(fn); }, once(event, fn) { this.on(event, fn); },
            removeListener() {}, listen(port, host, done) { this.listenedOn = host; done(); }, address: () => ({ port: 50123 }), close() { this.closed = true; }, handlers };
        return s;
    };
    let made = null;
    const fakeHttp = { createServer: handler => { made = fakeServer(); made.handler = handler; return made; } };
    const fakeOs = { networkInterfaces: () => ({ wifi: [{ family: 'IPv4', address: '192.168.4.20', internal: false }] }) };
    await assert.rejects(L.start({ http: fakeHttp, os: { networkInterfaces: () => ({}) } }), /No local network address/);
    await assert.rejects(L.start({ http: fakeHttp, os: fakeOs, address: '0.0.0.0' }), /No local network address/, 'never all interfaces');
    assert.ok(!L.running());

    const nodes = {};
    const node = tag => ({ tagName: tag.toUpperCase(), style: {}, parentNode: null,
        set innerHTML(html) { this.html = html; for (const m of html.matchAll(/id="([^"]+)"/g)) { const child = m[1] === 'dd-phone-qr' ? Object.assign(E.makeCanvas ? E.makeCanvas() : document.createElement('canvas'), { id: m[1] }) : node('div'); child.id = m[1]; nodes[child.id] = child; } },
        get innerHTML() { return this.html || ''; } });
    const createElement = document.createElement, getElementById = document.getElementById, appendChild = document.body.appendChild, removeChild = document.body.removeChild;
    document.createElement = tag => tag === 'canvas' ? createElement(tag) : node(tag);
    document.getElementById = id => nodes[id] || null;
    document.body.appendChild = child => { child.parentNode = document.body; nodes[child.id] = child; };
    document.body.removeChild = child => { child.parentNode = null; delete nodes[child.id]; };
    const toasts = [];
    W.showToast = (text) => toasts.push(text);
    const isTest = D.Compat.isTest;
    D.Compat.isTest = () => false;
    assert.strictEqual(await W.startPhonePreview({ http: fakeHttp, os: fakeOs, agreed: true }), null, 'only in a playtest');
    D.Compat.isTest = () => true;
    D.Ui.confirm = async () => false;
    assert.strictEqual(await W.startPhonePreview({ http: fakeHttp, os: fakeOs }), null, 'declining starts nothing');
    assert.ok(!L.running());
    let asked = '';
    D.Ui.confirm = async text => { asked = text; return true; };
    const info = await W.startPhonePreview({ http: fakeHttp, os: fakeOs });
    assert.ok(/Anyone on this network can see this project until you stop/.test(asked), 'the user is told what it serves before it starts');
    assert.strictEqual(made.listenedOn, '192.168.4.20', 'bound to the local network address only');
    assert.ok(/^http:\/\/192\.168\.4\.20:50123\/[a-f0-9]{32}\/$/.test(info.url), 'the address carries a random token');
    assert.notStrictEqual(info.token, token);
    assert.ok(nodes['dd-phone-card'] && nodes['dd-phone-card'].innerHTML.includes(info.url), 'the card shows the address');
    assert.ok(nodes['dd-phone-qr'].width > 0, 'the QR code is drawn');
    const socket = { destroyed: false, on() {}, destroy() { this.destroyed = true; } };
    made.handlers.connection.forEach(fn => fn(socket));
    nodes['dd-phone-stop'].onclick();
    assert.ok(made.closed && socket.destroyed && !L.running(), 'Stop closes the server and its connections');
    assert.ok(!nodes['dd-phone-card'], 'Stop removes the card');
    await W.startPhonePreview({ http: fakeHttp, os: fakeOs });
    const second = made;
    assert.ok(L.running());
    W.mounted = true;
    W.close();
    assert.ok(second.closed && !L.running(), 'closing the editor stops the server');
    const menu = W.menus().find(m => m.id === 'view');
    assert.ok(menu.items.some(item => item.id === 'dd-phone-btn' && item.label === 'Phone Preview'));
    D.Compat.isTest = isTest;
    document.createElement = createElement; document.getElementById = getElementById;
    document.body.appendChild = appendChild; document.body.removeChild = removeChild;

    // ---- The phone side, run from the exact script the server injects ----
    const script = /<script>([\s\S]*?)<\/script>/.exec(L.injectIndex('<head></head>'))[1];
    const timers = [], stored = {}, fetches = [];
    let saved = 100, reloaded = 0, transfer = null, wentTo = null, setup = 0;
    const phone = {
        setTimeout: (fn) => { timers.push(fn); return timers.length; },
        sessionStorage: { getItem: k => stored[k] || null, setItem: (k, v) => { stored[k] = v; }, removeItem: k => { delete stored[k]; } },
        fetch: (url) => { fetches.push(url); return Promise.resolve({ ok: true, json: () => Promise.resolve({ saved }) }); },
        location: { reload: () => { reloaded++; } }
    };
    vm.runInNewContext(script, { window: phone, globalThis: phone, JSON, Promise });
    const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
    await flush();
    assert.deepStrictEqual(fetches, ['__changed'], 'the phone asks for the save time');
    phone.Scene_Boot = function() {};
    phone.Scene_Boot.prototype.startNormalGame = function() { return 'title'; };
    phone.Scene_Map = function() {};
    phone.DataManager = { setupNewGame: () => { setup++; } };
    phone.SceneManager = { goto: scene => { wentTo = scene; } };
    phone.$dataMapInfos = [null, { name: 'Town' }, { name: 'Field' }];
    phone.$gameMap = { mapId: () => 2 };
    phone.$gamePlayer = { x: 7, y: 9, direction: () => 4, reserveTransfer: (...args) => { transfer = args; } };
    timers.shift()();
    assert.strictEqual(new phone.Scene_Boot().startNormalGame(), 'title', 'without a remembered spot the title shows as usual');
    saved = 200;
    while (timers.length && !reloaded) { timers.shift()(); await flush(); }
    assert.strictEqual(reloaded, 1, 'a save reloads the phone');
    assert.deepStrictEqual(JSON.parse(stored.docsPhonePreview), { mapId: 2, x: 7, y: 9, d: 4 });
    new phone.Scene_Boot().startNormalGame();
    assert.strictEqual(setup, 1); assert.deepStrictEqual(transfer, [2, 7, 9, 4, 0]); assert.strictEqual(wentTo, phone.Scene_Map, 'the game starts where the player stood');
    assert.ok(!stored.docsPhonePreview, 'the remembered spot is used once');
    stored.docsPhonePreview = JSON.stringify({ mapId: 99, x: 1, y: 1, d: 2 });
    transfer = null;
    assert.strictEqual(new phone.Scene_Boot().startNormalGame(), 'title', 'a deleted map falls back to the title');
    assert.strictEqual(transfer, null);

    console.log('Phone Preview: QR values and decoding, path rules, loopback HTTP with ranges and refusals, start/stop/close and the phone reload passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
