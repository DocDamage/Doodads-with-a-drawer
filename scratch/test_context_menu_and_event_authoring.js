// scratch/test_context_menu_and_event_authoring.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=== Testing QJ Doodads Context Menus, Event Authoring & Collections ===");

// Set up mock RPG Maker MZ environment
global.window = global;
global.document = {
    createElement(tag) {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            classList: {
                classes: new Set(),
                add(c) { this.classes.add(c); },
                remove(c) { this.classes.delete(c); },
                contains(c) { return this.classes.has(c); },
                toggle(c, force) { if (force !== undefined) { if (force) this.classes.add(c); else this.classes.delete(c); } else { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); } }
            },
            appendChild(child) { this.children = this.children || []; this.children.push(child); child.parentNode = this; return child; },
            removeChild(child) {
                this.children = this.children || [];
                const idx = this.children.indexOf(child);
                if (idx > -1) this.children.splice(idx, 1);
                child.parentNode = null;
                return child;
            },
            children: [],
            querySelectorAll() { return []; },
            getElementById() { return null; },
            getContext() { return {}; }
        };
    },
    body: {
        appendChild() {},
        removeChild() {}
    },
    getElementById() { return null; }
};
global.prompt = (msg, def) => def;
global.confirm = () => true;
global.Utils = {
    isNwjs: () => true,
    isOptionValid: (opt) => opt === 'test'
};
global.Graphics = {
    app: { view: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 816, height: 624 }) } }
};
global.ImageManager = {
    loadBitmap: (folder, file) => ({ width: 144, height: 192, isReady: () => true })
};
global.DataManager = {
    saveDoodadsDataQJ: () => {},
    loadMapDataSynDoodadsQJ: (type, mapId) => ({ events: [null] })
};
global.$gameMap = {
    mapId: () => 1,
    tileWidth: () => 48,
    tileHeight: () => 48,
    displayX: () => 0,
    displayY: () => 0,
    _stagedMapData: { events: [null] },
    eventsXy: (x, y) => []
};
global.$dataDoodadsQJ = { 1: [] };
global.SceneManager = { _scene: { _spriteset: { addDoodadsQJ: () => {}, sortDoodadsQJ: () => {} } } };

// Require QJ-Doodads.js
require('../QJ-Doodads.js');

// Keep persistence writes inside a disposable fixture instead of project data/.
const testStateDir = path.join(__dirname, 'context_authoring_fixture');
fs.rmSync(testStateDir, { recursive: true, force: true });
fs.mkdirSync(testStateDir, { recursive: true });
process.on('exit', () => fs.rmSync(testStateDir, { recursive: true, force: true }));
QJ.DD.AssetIndex.libraryPath = path.join(testStateDir, 'QJAssetLibrary.json');
QJ.DD.AssetIndex.data = { version: 1, projectId: 'test', generatedAt: 0, assets: {}, collections: {}, settings: {} };
QJ.DD.AssetIndex.rebuildList();
QJ.DD.EventTemplates.filePath = path.join(testStateDir, 'QJEventTemplates.json');
QJ.DD.EventTemplates.custom = {};

// Test 1: Virtual Collections management in QJ.DD.AssetIndex
console.log("Testing Virtual Collections management...");
QJ.DD.AssetIndex.data.assets['test_asset_1'] = { id: 'test_asset_1', fileName: 'CastleDoor.png', collections: [] };
QJ.DD.AssetIndex.createCollection("Castle Set");
assert.ok(QJ.DD.AssetIndex.getCollections().includes("Castle Set"), "Collection 'Castle Set' should exist");

QJ.DD.AssetIndex.addAssetToCollection('test_asset_1', "Castle Set");
assert.ok(QJ.DD.AssetIndex.data.assets['test_asset_1'].collections.includes("Castle Set"), "Asset should have 'Castle Set' collection");
assert.ok(QJ.DD.AssetIndex.data.collections["Castle Set"].includes('test_asset_1'), "Collection should list asset");

// Test 2: Search with collection: token
console.log("Testing Search with collection: filter...");
const mockAssetInCol = { fileName: 'CastleDoor.png', tags: [], autoTags: [], collections: ['Castle Set'] };
const mockAssetNotInCol = { fileName: 'ForestTree.png', tags: [], autoTags: [], collections: ['Nature'] };

const parsedQuery = QJ.DD.Search.parseQuery("collection:\"castle set\"");
assert.ok(parsedQuery.collections.length > 0, "Parsed query should have collection token");

assert.ok(QJ.DD.Search.matches(mockAssetInCol, { ...parsedQuery, collections: ['castle set'] }), "Should match asset in collection");
assert.strictEqual(QJ.DD.Search.matches(mockAssetNotInCol, { ...parsedQuery, collections: ['castle set'] }), false, "Should not match asset outside collection");
console.log("✓ Virtual Collections and search integration verified.");

// Test 3: Sidecar .saf.json parser in QJ.DD.Slicing.Metadata
console.log("Testing Sidecar .saf.json parser...");
const testImgPath = path.join(testStateDir, 'mock_sheet.png');
const testSafPath = path.join(testStateDir, 'mock_sheet.saf.json');
const safData = {
    frames: [
        { filename: "gem_blue", frame: { x: 0, y: 0, w: 32, h: 32 }, pivot: { x: 0.5, y: 1.0 } },
        { filename: "gem_red", frame: { x: 32, y: 0, w: 32, h: 32 }, pivot: { x: 0.5, y: 1.0 } }
    ]
};
fs.writeFileSync(testSafPath, JSON.stringify(safData), 'utf8');

const metadataResult = QJ.DD.Slicing.Metadata.parse(testImgPath);
assert.ok(metadataResult, "Should parse .saf.json sidecar metadata");
assert.strictEqual(metadataResult.regions.length, 2, "Should parse 2 regions from .saf.json");
assert.strictEqual(metadataResult.regions[0].name, "gem_blue");
assert.strictEqual(metadataResult.regions[1].name, "gem_red");
fs.unlinkSync(testSafPath);
console.log("✓ Sidecar .saf.json parser verified.");

// Test 4: Map Event Selection, Inspection & Templates
console.log("Testing Map Event authoring & templates...");
const stagedMap = $gameMap._stagedMapData;
const evId = 10;
stagedMap.events[evId] = {
    id: evId,
    name: "Chest_Gold",
    x: 5,
    y: 7,
    pages: [{
        trigger: 0,
        priorityType: 1,
        list: [
            { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
            { code: 401, indent: 0, parameters: ["You opened the chest!"] },
            { code: 0, indent: 0, parameters: [] }
        ]
    }]
};

const mockGameEvent = {
    eventId: () => evId,
    event: () => stagedMap.events[evId],
    x: 5,
    y: 7
};

// Select Event
QJ.DD.Workspace.selectEvent({ gameEvent: mockGameEvent, stagedEvent: stagedMap.events[evId] });
assert.ok(QJ.DD.Workspace.selectedEvent, "Event should be selected");

// Save Event as Template
const tmplKey = QJ.DD.EventTemplates.saveCustomTemplate("Chest_Gold_Template", stagedMap.events[evId], "Treasure");
const loadedTmpl = QJ.DD.EventTemplates.get(tmplKey);
assert.strictEqual(loadedTmpl.name, "Chest_Gold_Template");
assert.strictEqual(loadedTmpl.category, "Treasure");
assert.strictEqual(loadedTmpl.list[1].parameters[0], "You opened the chest!");

// Duplicate Event
QJ.DD.Workspace.duplicateSelectedEvent();
const dupEvent = stagedMap.events.find(e => e && e.name === "Chest_Gold_copy");
assert.ok(dupEvent, "Duplicated event should exist in staged map data");
const newSafeId = dupEvent.id;
assert.strictEqual(dupEvent.x, 6, "Duplicated event should be offset horizontally");

// Delete Event with Undo/Redo
QJ.DD.Workspace.selectEvent({ gameEvent: { eventId: () => newSafeId }, stagedEvent: dupEvent });
QJ.DD.Workspace.deleteSelectedEvent();
assert.strictEqual(stagedMap.events[newSafeId], undefined, "Event should be removed from staged map");

QJ.DD.Undo.undo();
assert.ok(stagedMap.events[newSafeId], "Event should be restored after undo");
console.log("✓ Event authoring, templating, duplicate, and undo/redo delete verified.");

// Test 5: Audio command generation for BGM, BGS, ME, and SE
console.log("Testing Audio command generation and appending...");
// SE
QJ.DD.Workspace.createAudioEvent({ fileName: 'Slash.ogg', path: 'audio/se/Slash.ogg' }, { tileX: 2, tileY: 3 });
const seEv = stagedMap.events.find(e => e && e.name === 'Sound_Slash');
assert.ok(seEv, "SE Event should exist");
assert.strictEqual(seEv.pages[0].list[0].code, 250, "SE command code should be 250");

// BGM
QJ.DD.Workspace.createAudioEvent({ fileName: 'Theme.ogg', path: 'audio/bgm/Theme.ogg' }, { tileX: 4, tileY: 4 });
const bgmEv = stagedMap.events.find(e => e && e.name === 'Sound_Theme');
assert.ok(bgmEv, "BGM Event should exist");
assert.strictEqual(bgmEv.pages[0].list[0].code, 241, "BGM command code should be 241");

// BGS
QJ.DD.Workspace.createAudioEvent({ fileName: 'Rain.ogg', path: 'audio/bgs/Rain.ogg' }, { tileX: 5, tileY: 5 });
const bgsEv = stagedMap.events.find(e => e && e.name === 'Sound_Rain');
assert.ok(bgsEv, "BGS Event should exist");
assert.strictEqual(bgsEv.pages[0].list[0].code, 245, "BGS command code should be 245");

// ME
QJ.DD.Workspace.createAudioEvent({ fileName: 'Victory.ogg', path: 'audio/me/Victory.ogg' }, { tileX: 6, tileY: 6 });
const meEv = stagedMap.events.find(e => e && e.name === 'Sound_Victory');
assert.ok(meEv, "ME Event should exist");
assert.strictEqual(meEv.pages[0].list[0].code, 249, "ME command code should be 249");

// Append sound command to existing event
const targetEvent = {
    eventId: () => evId,
    event: () => stagedMap.events[evId]
};
const prevCmdCount = stagedMap.events[evId].pages[0].list.length;
QJ.DD.Workspace.appendAudioCommandToEvent({ fileName: 'Bell.ogg', path: 'audio/se/Bell.ogg' }, targetEvent);
assert.strictEqual(stagedMap.events[evId].pages[0].list.length, prevCmdCount + 1, "Should have appended sound command");
assert.strictEqual(stagedMap.events[evId].pages[0].list[prevCmdCount - 1].parameters[0].name, 'Bell');

// Undo appended command
QJ.DD.Undo.undo();
assert.strictEqual(stagedMap.events[evId].pages[0].list.length, prevCmdCount, "Appended sound command should be reverted by undo");
console.log("✓ Audio BGM/BGS/ME/SE generation and event command appending verified.");

// Test 6: Scatter Brush settings live configuration
console.log("Testing Scatter Brush settings configuration...");
assert.strictEqual(QJ.DD.Workspace.brushSettings.radius, 80);
QJ.DD.Workspace.brushSettings.radius = 120;
QJ.DD.Workspace.brushSettings.density = 5;
assert.strictEqual(QJ.DD.Workspace.brushSettings.radius, 120);
assert.strictEqual(QJ.DD.Workspace.brushSettings.density, 5);
console.log("✓ Scatter Brush configuration verified.");

console.log("=== All Context Menu, Event Authoring & Collections Tests Passed Successfully! ===");
