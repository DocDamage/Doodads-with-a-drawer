// scratch/test_checklist_fixes.js
// Fixes from the manual checklist run: files are only written in a playtest (a deployed game can't change
// the project even through the editor's own functions), events made from templates keep the template's
// movement options, and the slicer can merge and reorder regions and cancel Auto-Slice on big sheets.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

console.log("=== Testing Checklist Fixes ===");

const elements = {};
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
    createElement: () => ({ style: {}, appendChild() {}, removeChild() {}, querySelectorAll: () => [], addEventListener() {},
        getContext: () => ({ drawImage() {}, getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }) }),
    body: { appendChild() {}, removeChild() {} },
    getElementById: id => elements[id] || null
};
let testMode = true;
global.Utils = { RPGMAKER_NAME: "MZ", isNwjs: () => true, isOptionValid: opt => opt === 'test' && testMode };
global.PluginManager = { parameters: () => ({}) };
global.$gameMap = { mapId: () => 1, tileWidth: () => 48, tileHeight: () => 48 };
global.$dataDocsDoodads = { 1: [] };

require('../Docs-Doodads.js');
const FS = DocsDoodads.FS;

(async () => {
    // 1. Writing only in a playtest.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-guard-'));
    const file = path.join(dir, 'a.json');
    try {
        assert.strictEqual(FS.writable(), true);
        FS.fs.writeFileSync(file, '{"a":1}');
        assert.strictEqual(FS.readFileSync(file), '{"a":1}', 'a playtest writes');
        testMode = false;
        assert.strictEqual(FS.writable(), false, 'a deployed game does not');
        assert.throws(() => FS.fs.writeFileSync(file, 'x'), /only writes files in a playtest \(writeFileSync\)/);
        assert.throws(() => FS.fs.unlinkSync(file), /unlinkSync/);
        assert.throws(() => FS.fs.mkdirSync(path.join(dir, 'sub')), /mkdirSync/);
        await assert.rejects(FS.fs.promises.copyFile(file, file + '.copy'), /copyFile/);
        assert.strictEqual(FS.atomicWriteJson(file, { b: 2 }), false, 'atomic writes fail cleanly');
        assert.strictEqual(FS.readFileSync(file), '{"a":1}', 'and leave the file as it was');
        assert.strictEqual(FS.readJson(file).a, 1, 'reading still works');
        assert.ok(FS.fs.existsSync(file) && FS.fs.statSync(file).size > 0, 'so do exists and stat');
        const many = FS.atomicWriteManyJson([{ path: file, data: { c: 3 } }]);
        assert.strictEqual(many.ok, false, 'transactions fail without writing');
        assert.strictEqual(FS.readFileSync(file), '{"a":1}');
        // The editor's save refuses too, and keeps the work marked unsaved.
        const P = DocsDoodads.Persistence;
        DocsDoodads.Workspace.showToast = () => {};
        P.dirtyDoodads = true;
        assert.strictEqual(P.saveAll(true), false, 'Save does nothing outside a playtest');
        assert.strictEqual(P.dirtyDoodads, true);
        testMode = true;
        // Stubs placed on Node's fs (as tests do) are still reached through the guard.
        const real = fs.renameSync;
        let called = 0;
        fs.renameSync = function(...a) { called++; return real.apply(this, a); };
        FS.fs.renameSync(file, file + '.moved');
        fs.renameSync = real;
        assert.strictEqual(called, 1);
    } finally {
        testMode = true;
        fs.rmSync(dir, { recursive: true, force: true });
    }

    // 1b. An unreadable file is copied aside before defaults are used, so the next save can't lose it.
    {
        const cwd = process.cwd();
        const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-unreadable-'));
        process.chdir(proj);
        try {
            fs.mkdirSync('data');
            fs.writeFileSync('data/Prefabs.json', '{ "prefabs": [ broken');
            FS.takeRecoveryNotices();
            assert.strictEqual(FS.readJson('data/Prefabs.json'), null, 'defaults (no backup)');
            const kept = fs.readdirSync('data/docs_doodads_cache/backups').filter(f => f.endsWith('.unreadable'));
            assert.strictEqual(kept.length, 1, 'a copy is kept');
            assert.strictEqual(fs.readFileSync(path.join('data/docs_doodads_cache/backups', kept[0]), 'utf8'), '{ "prefabs": [ broken', 'exactly as it was');
            assert.ok(/kept as/.test(FS.takeRecoveryNotices().join(' ')), 'and the notice says where');
            assert.strictEqual(FS.findLatestBackup('data/Prefabs.json'), null, 'the copy is never loaded as a backup');
            testMode = false;
            FS.readJson('data/Prefabs.json');
            assert.strictEqual(fs.readdirSync('data/docs_doodads_cache/backups').length, 1, 'outside a playtest nothing is copied');
            testMode = true;
        } finally {
            testMode = true;
            process.chdir(cwd);
            fs.rmSync(proj, { recursive: true, force: true });
        }
    }

    // 2. Events from templates keep the template's movement options (a chest faces one way).
    {
        const W = DocsDoodads.Workspace;
        const staged = { events: [null] };
        $gameMap._stagedMapData = staged;
        DocsDoodads.Persistence.stagedFor = () => staged;
        W.showToast = () => {};
        const asset = { type: 'character_sheet', fileName: '!Chest.png', placement: { defaultMode: 'event' } };
        W.commitPlacement(asset, { x: 0, y: 0, tileX: 3, tileY: 4 }, 'event', 'chest');
        const chest = staged.events.filter(Boolean).pop();
        const t = DocsDoodads.EventTemplates.get('chest');
        assert.strictEqual(chest.pages[0].directionFix, t.directionFix === true, 'direction fix kept');
        assert.strictEqual(chest.pages[0].trigger, t.trigger);
        assert.deepStrictEqual([chest.x, chest.y], [3, 4]);
        const withFlags = Object.keys(DocsDoodads.EventTemplates.templates).map(k => [k, DocsDoodads.EventTemplates.get(k)])
            .filter(([, tt]) => tt.stepAnime || tt.through || tt.walkAnime === false);
        assert.ok(withFlags.length >= 2, 'some templates set step animation, through or walking');
        for (const [key, tt] of withFlags) {
            W.commitPlacement(asset, { x: 0, y: 0, tileX: 1, tileY: 1 }, 'event', key);
            const page = staged.events.filter(Boolean).pop().pages[0];
            assert.strictEqual(page.stepAnime, Boolean(tt.stepAnime), key + ': step animation');
            assert.strictEqual(page.through, Boolean(tt.through), key + ': through');
            assert.strictEqual(page.walkAnime, tt.walkAnime !== false, key + ': walking animation');
        }
        // The panel's pick is still used when no template is passed.
        elements['dd-event-template'] = { value: 'door' };
        W.commitPlacement(asset, { x: 0, y: 0, tileX: 2, tileY: 2 }, 'event');
        assert.strictEqual(staged.events.filter(Boolean).pop().pages[0].directionFix, DocsDoodads.EventTemplates.get('door').directionFix === true);
        delete elements['dd-event-template'];
    }

    // 3. The slicer: merge with the next region, move regions up and down, undo; Cancel on big sheets.
    {
        const E = DocsDoodads.Slicing.Editor;
        E.render = () => {};
        E.updateRegionList = () => {};
        E.undoStack = []; E.redoStack = [];
        E.regions = [{ id: 'a', name: 'A', x: 0, y: 0, w: 10, h: 10 }, { id: 'b', name: 'B', x: 20, y: 5, w: 10, h: 20 }, { id: 'c', name: 'C', x: 50, y: 0, w: 5, h: 5 }];
        E.selectedRegionIdx = 0;
        assert.strictEqual(E.mergeWithNext(), true);
        assert.deepStrictEqual(E.regions.map(r => [r.name, r.x, r.y, r.w, r.h]), [['A', 0, 0, 30, 25], ['C', 50, 0, 5, 5]], 'one region covering both');
        E.undo();
        assert.strictEqual(E.regions.length, 3, 'undo brings both back');
        E.selectedRegionIdx = 2;
        assert.strictEqual(E.mergeWithNext(), false, 'the last region has nothing after it');
        assert.strictEqual(E.moveRegion(-1), true);
        assert.deepStrictEqual(E.regions.map(r => r.name), ['A', 'C', 'B'], 'moved up');
        assert.strictEqual(E.selectedRegionIdx, 1, 'still selected');
        assert.strictEqual(E.moveRegion(-1), true);
        assert.strictEqual(E.moveRegion(-1), false, 'already first');
        assert.deepStrictEqual(E.regions.map(r => r.name), ['C', 'A', 'B']);
        E.undo(); E.undo();
        assert.deepStrictEqual(E.regions.map(r => r.name), ['A', 'B', 'C'], 'undo restores the order');

        const toasts = [];
        DocsDoodads.Workspace.showToast = m => toasts.push(m);
        const button = elements['dd-slicer-auto-btn'] = { textContent: 'Auto-Slice' };
        E.img = { naturalWidth: 64, naturalHeight: 64, width: 64, height: 64 };
        await E.autoSlice();
        assert.ok(/regions/.test(toasts.pop()), 'small sheets slice straight away');
        E.img = { naturalWidth: 4096, naturalHeight: 4096, width: 4096, height: 4096 };
        const running = E.autoSlice();
        assert.strictEqual(button.textContent, 'Cancel', 'a big sheet shows Cancel while it works');
        await E.autoSlice();
        assert.strictEqual(await running, null, 'pressing it again cancels');
        assert.strictEqual(button.textContent, 'Auto-Slice');
        assert.ok(/cancelled/.test(toasts.pop()));
        const done = await E.autoSlice();
        assert.ok(done && Array.isArray(done.regions), 'and it runs to the end when left alone');
        delete elements['dd-slicer-auto-btn'];
    }

    console.log("✓ Checklist fixes: writes only in a playtest (sync, async, transactions, Save), unreadable files kept, template movement options on events, slicer merge, reorder, undo and cancellable Auto-Slice.");
})().catch(e => { console.error(e); process.exit(1); });
