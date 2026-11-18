'use strict';
const assert = require('assert');
const E = require('./engine/fake_engine');
E.install(); E.setupWorld(); require('../Docs-Doodads.js');
const D = DocsDoodads, W = D.Workspace;
async function main() {
    const credit = { author: 'Ada', licence: 'My own', source: '', note: '' };
    const asset = { id: 'img/doodads/oak.png', path: 'img/doodads/Oak.png', fileName: 'Oak.png', credit };
    const unused = { path: 'img/Unused.png', credit: { ...credit, author: 'Unused Author' } };
    const data = D.AssetIndex.data = { assets: { [asset.id]: asset, unused }, folderCredits: {} };
    D.AssetIndex.saveSoon = () => {};
    W.refreshInspector = W.refreshDrawerCards = W.showToast = () => {};
    W.refreshUsageIndex = () => new Map([[D.Usage.keyOf(asset.path), [{}]]]);
    W.lpcCredits = () => D.Lpc.emptyCredits();
    D.Rooms.loaded = true; D.Rooms.list = [];
    let writes = [];
    D.FS.atomicWriteFile = (...args) => writes.push(args);
    D.FS.existsSync = () => true;
    D.Ui.confirm = async () => false;
    assert.strictEqual(await W.writeArtCredits(), false); assert.strictEqual(writes.length, 0);
    D.Ui.confirm = async () => true;
    const text = await W.writeArtCredits();
    assert.ok(text.includes('Ada')); assert.ok(!text.includes('Unused Author'));
    assert.strictEqual(writes[0][0], 'CREDITS.txt');
    await W.offerCreditNotes([{ name: 'LICENSE.txt', note: 'Original supplied terms' }], () => [asset.path]);
    assert.strictEqual(data.folderCredits['img/doodads'].licence, '', 'a note does not infer terms');
    assert.ok(data.folderCredits['img/doodads'].note.includes('Original supplied terms'));
    W.setFolderCredit('img/doodads', credit);
    D.Ui.confirm = async () => false;
    await W.offerCreditNotes([{ name: 'README.md', note: 'Not accepted' }], () => [asset.path]);
    assert.strictEqual(data.folderCredits['img/doodads'].note, '');
    D.Ui.confirm = async () => true;
    await W.offerCreditNotes([{ name: 'README.md', note: 'Kept text' }], () => [asset.path]);
    assert.strictEqual(data.folderCredits['img/doodads'].author, 'Ada');
    assert.strictEqual(data.folderCredits['img/doodads'].licence, 'My own');
    D.Ui.form = async () => {
        D.AssetIndex.data = { assets: {}, folderCredits: {} };
        return { author: 'Stale', preset: 'My own', licence: '', source: '', note: '' };
    };
    assert.strictEqual(await W.editArtCredit([asset]), false, 'a replaced library rejects a stale dialog');
    assert.strictEqual(asset.credit.author, 'Ada');
    D.AssetIndex.data = data;
    // A file with no licence recorded: the Licence box starts empty, not as "Other (use text below)" (typing a
    // licence there was added to the end of it).
    {
        const fresh = { id: 'img/doodads/fresh.png', path: 'img/doodads/Fresh.png' };
        data.assets[fresh.id] = fresh;
        const savedFolders = data.folderCredits; data.folderCredits = {};
        let shown = null;
        D.Ui.form = async opts => { shown = opts.fields.find(f => f.key === 'preset').value; return null; };
        await W.editArtCredit([fresh]);
        assert.strictEqual(shown, '', 'an empty Licence box');
        fresh.credit = { author: 'Bo', licence: 'Shop terms 2', source: '', note: '' };
        await W.editArtCredit([fresh]);
        assert.strictEqual(shown, 'Other (use text below)', 'a licence not in the list still shows as Other');
        delete data.assets[fresh.id]; data.folderCredits = savedFolders;
    }
    const zip = D.Zip.asPack('Forest.zip', { unsafe: [], files: [
        { name: 'forest/README.md', data: Buffer.from('Forest terms') },
        { name: 'forest/Oak.png', data: Buffer.from('pixels') },
        { name: 'other/Rock.png', data: Buffer.from('pixels') }
    ] }, D.Packs).pack;
    assert.deepStrictEqual(zip.creditNotes[0].paths, ['img/doodads/Forest/forest/Oak.png'], 'zip notes stay within their original folder');
    assert.ok(W.hoverCardFacts(asset).some(([label, value]) => label === 'Credit' && value.includes('Ada')));
    assert.ok(W.renderAssetCredit(asset).includes('Set Credit'));
    assert.ok(W.menus().some(menu => menu.items && menu.items.some(item => item.id === 'dd-credits-btn')));
    window.$dataDocsDoodads[1] = [{ bit: [1], model: { path: 'models/Statue.gltf' }, states: { list: [{ path: 'img/doodads/OakNight.png' }] } }];
    // The plugin's own made pictures (a ground mask) are not listed for credits.
    {
        const usage = W.refreshUsageIndex;
        const mask = { id: 'img/doodads/ground/map001_ground.png', path: 'img/doodads/ground/Map001_ground.png' };
        data.assets[mask.id] = mask;
        const isUsed = D.Usage.isUsed;
        D.Usage.isUsed = (a, index) => a === mask || isUsed.call(D.Usage, a, index);
        assert.ok(!W.usedCreditEntries().some(row => row.path === mask.path), 'a ground mask needs no credit');
        D.Usage.isUsed = isUsed; delete data.assets[mask.id]; W.refreshUsageIndex = usage;
    }
    const extra = W.usedCreditEntries();
    const model = extra.find(row => row.path === 'models/Statue.gltf');
    assert.ok(model && extra.some(row => row.path === 'img/doodads/OakNight.png'), 'model and state art supplement native Where Used references');
    W.setAssetCredits([model.asset], credit);
    assert.deepStrictEqual(D.Credits.of('models/Statue.gltf', data), credit);
    const modelPack = D.Packs.build('Model', { contents: {}, files: ['models/Statue.gltf'] }, () => Buffer.from('{}'), () => null, p => D.Credits.of(p, data));
    assert.deepStrictEqual(modelPack.library['models/Statue.gltf'].credit, credit);
    const indexedModel = { id: 'models/statue.gltf', path: 'models/Statue.gltf' };
    data.assets[indexedModel.id] = indexedModel;
    W.setAssetCredits([indexedModel], null);
    assert.strictEqual(D.Credits.of(indexedModel.path, data), null, 'clearing an indexed item removes earlier file-only fallback records');
    D.Rooms.loaded = true;
    D.Rooms.list = [{ id: 'credit-room', doodads: [{ bit: [3, 'img/doodads/RoomOnly.png'] }] }];
    assert.ok(W.usedCreditEntries().some(row => row.path === 'img/doodads/RoomOnly.png'), 'seeded room art is included before runtime materialization');
    console.log('PASS credits output, replacement choice, supplied notes, stale dialogs and editor entry points');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
