'use strict';
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { releasedChanges } = require('../scripts/deploy');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-shipped-deploy-'));
try {
    fs.mkdirSync(path.join(root, 'data'));
    assert.deepStrictEqual(releasedChanges(root), [], 'unmarked projects do not warn');
    const data = path.join(root, 'data/DocsDoodads.json'), history = path.join(root, 'data/DocsDoodadsShipped.json');
    fs.writeFileSync(data, '{}');
    const hash = crypto.createHash('sha256').update('{}').digest('hex');
    fs.writeFileSync(history, JSON.stringify({ releases: [{ version: '1', fileHashes: { 'data/DocsDoodads.json': hash, 'data/Map001.json': null, '../outside.txt': 'ignored' } }] }));
    assert.deepStrictEqual(releasedChanges(root), []);
    fs.writeFileSync(data, '{"changed":true}');
    assert.deepStrictEqual(releasedChanges(root), ['data/DocsDoodads.json']);
    fs.writeFileSync(path.join(root, 'data/Map001.json'), '{}');
    assert.deepStrictEqual(releasedChanges(root), ['data/DocsDoodads.json', 'data/Map001.json']);
    console.log('Released deployment: quiet unmarked/matching data, changes and newly created files, no outside reads passed.');
} finally {
    assert.strictEqual(path.dirname(fs.realpathSync(root)), fs.realpathSync(os.tmpdir()));
    fs.rmSync(root, { recursive: true, force: true });
}
