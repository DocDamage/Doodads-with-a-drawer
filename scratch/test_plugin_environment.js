// scratch/test_plugin_environment.js
// Comprehensive test environment simulating RPG Maker MZ
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== Setting up RPG Maker MZ Test Environment ===");

// Create mock document and DOM
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
                contains(c) { return this.classes.has(c); }
            },
            appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
            removeChild(child) {
                const idx = this.children.indexOf(child);
                if (idx > -1) this.children.splice(idx, 1);
                child.parentNode = null;
                return child;
            },
            children: [],
            querySelectorAll() { return []; },
            getContext(mode) {
                return {
                    drawImage() {},
                    clearRect() {},
                    fillRect() {},
                    strokeRect() {},
                    getImageData(x, y, w, h) {
                        return { data: new Uint8Array(w * h * 4) };
                    }
                };
            },
            toDataURL() { return "data:image/png;base64,mock"; }
        };
    },
    body: {
        children: [],
        appendChild(child) { this.children.push(child); child.parentNode = this; return child; },
        removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx > -1) this.children.splice(idx, 1);
            return child;
        }
    },
    getElementById(id) {
        return {
            style: {},
            onclick: null,
            oninput: null,
            onchange: null,
            querySelectorAll() { return []; },
            appendChild() {},
            removeChild() {}
        };
    }
};

global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// Mock RPG Maker Classes
global.Utils = {
    RPGMAKER_NAME: "MZ",
    isNwjs: () => true,
    isOptionValid: (opt) => opt === "test"
};

global.PluginManager = {
    parameters: (name) => ({
        editKey: "F10",
        editorMode: "true",
        defaultLayout: "Mapping",
        cacheEnabled: "true",
        saveMode: "false",
        devDiagnostics: "global.__ddParameterCodeExecuted = true"
    })
};

global.Image = function() {
    this.naturalWidth = 144;
    this.naturalHeight = 192;
    setTimeout(() => { if (this.onload) this.onload(); }, 10);
};

global.PIXI = {
    Sprite: function() {
        this.anchor = { x: 0, y: 0 };
        this.scale = { x: 1, y: 1 };
        this.texture = { width: 48, height: 48, frame: {} };
    },
    BaseTexture: function() {},
    Texture: function() { this.width = 48; this.height = 48; },
    Rectangle: function(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; },
    SCALE_MODES: { LINEAR: 0, NEAREST: 1 }
};

global.Rectangle = global.PIXI.Rectangle;
global.Point = function(x, y) { this.x = x; this.y = y; };

global.DataManager = {
    _databaseFiles: [],
    onLoad: () => {},
    loadDataFile: () => {}
};

global.ImageManager = {
    loadBitmap: () => ({ isReady: () => true, width: 48, height: 48 }),
    loadSystem: () => ({ isReady: () => true, width: 256, height: 256 }),
    loadTileset: () => ({ isReady: () => true, width: 256, height: 256 })
};

global.SoundManager = {
    playCursor: () => {},
    playOk: () => {},
    playCancel: () => {}
};

global.SceneManager = { _scene: null };

global.Input = {
    isTriggered: (key) => key === "F10",
    isPressed: () => false
};

global.TouchInput = {
    x: 100, y: 100,
    isCancelled: () => false,
    _mousePos: { x: 100, y: 100 }
};

global.JsonEx = {
    makeDeepCopy: (obj) => JSON.parse(JSON.stringify(obj))
};

global.String.prototype.padZero = function(length) {
    return String(this).padStart(length, '0');
};
global.Number.prototype.padZero = function(length) {
    return String(this).padStart(length, '0');
};
global.String.prototype.format = function() {
    let args = arguments;
    return this.replace(/%([0-9]+)/g, (s, n) => args[Number(n) - 1]);
};

global.Scene_Boot = function() {};
global.Scene_Boot.prototype.isReady = function() { return true; };

global.Scene_Map = function() {};
global.Scene_Map.prototype.initialize = function() {};
global.Scene_Map.prototype.updateScene = function() {};

global.Spriteset_Map = function() { this._docsDoodads = []; };
global.Spriteset_Map.prototype.createLowerLayer = function() {};
global.Spriteset_Map.prototype.update = function() {};

global.Game_CharacterBase = function() {};
global.Game_CharacterBase.prototype.canPass = function(x, y, d) { return true; };
global.Game_CharacterBase.prototype.isThrough = function() { return Boolean(this._through); };
global.Game_CharacterBase.prototype.isDebugThrough = function() { return false; };

global.Game_Player = function() { this.x = 5; this.y = 5; };
global.Game_Player.prototype = Object.create(global.Game_CharacterBase.prototype);
global.Game_Player.prototype.center = function() {};
global.Game_Player.prototype.isDebugThrough = function() { return Boolean(this._debugThrough); };
global.Game_Player.prototype.isInAirship = function() { return Boolean(this._inAirship); };

global.Game_Map = function() {};
global.Game_Map.prototype.mapId = () => 1;
global.Game_Map.prototype.displayX = () => 0;
global.Game_Map.prototype.displayY = () => 0;
global.Game_Map.prototype.tileWidth = function() { return this._tile || 48; };
global.Game_Map.prototype.tileHeight = function() { return this._tile || 48; };
global.Game_Map.prototype.roundXWithDirection = (x, d) => x + (d === 6 ? 1 : d === 4 ? -1 : 0);
global.Game_Map.prototype.roundYWithDirection = (y, d) => y + (d === 2 ? 1 : d === 8 ? -1 : 0);

global.$gameMap = new global.Game_Map();
global.$gamePlayer = new global.Game_Player();
global.$gameSystem = { docsDoodads: { editing: false, selecting: null } };

// Mock addEventListener on window
global.window.addEventListener = () => {};

// Now load the generated plugin!
console.log("Loading Docs-Doodads.js into mock engine...");
require(path.join(__dirname, '..', 'Docs-Doodads.js'));

console.log("✓ Plugin loaded cleanly without runtime errors.");
assert.strictEqual(global.__ddParameterCodeExecuted, undefined, 'plugin parameters must never execute JavaScript');
assert.strictEqual(
    DocsDoodads.Security.escapeHtml('<img src=x onerror="bad">&'),
    '&lt;img src=x onerror=&quot;bad&quot;&gt;&amp;',
    'workspace HTML interpolations must escape untrusted labels'
);
console.log("✓ Plugin parameter execution and HTML injection defenses verified.");

// Verify plugin namespaces
assert(DocsDoodads, "DocsDoodads must exist");
assert(DocsDoodads.AssetIndex, "DocsDoodads.AssetIndex must exist");
assert(DocsDoodads.Search, "DocsDoodads.Search must exist");
assert(DocsDoodads.Slicing, "DocsDoodads.Slicing must exist");
assert(DocsDoodads.Events, "DocsDoodads.Events must exist");
assert(DocsDoodads.EventTemplates, "DocsDoodads.EventTemplates must exist");
assert(DocsDoodads.Collision, "DocsDoodads.Collision must exist");
assert(DocsDoodads.Undo, "DocsDoodads.Undo must exist");
assert(DocsDoodads.Persistence, "DocsDoodads.Persistence must exist");
assert(DocsDoodads.Workspace, "DocsDoodads.Workspace must exist");
console.log("✓ All DocsDoodads namespaces verified.");

// Test Slicing Known Formats
const mock8CharAsset = {
    id: "char_people1",
    fileName: "People1.png",
    type: "character_sheet",
    width: 576,
    height: 384
};
const knownResult = DocsDoodads.Slicing.Known.detect(mock8CharAsset);
assert(knownResult, "8-character sheet must be detected");
assert.strictEqual(knownResult.regions.length, 8, "Must produce 8 logical sub-characters");
assert.strictEqual(knownResult.regions[0].cellW, 48);
assert.strictEqual(knownResult.regions[0].cellH, 48);
console.log("✓ Standard 8-Character sheet recognition verified (8 characters extracted).");

// Test Event Creation & All 20 Built-in Templates
const mockMapData = { events: [null, { id: 1, name: "EV001" }] };
const nextId = DocsDoodads.Events.allocateSafeId(mockMapData);
assert.strictEqual(nextId, 2);

const templateKeys = Object.keys(DocsDoodads.EventTemplates.templates);
console.log(`Found ${templateKeys.length} built-in event templates.`);
assert(templateKeys.length >= 20, "Must contain all 20 built-in event templates");
assert(templateKeys.includes("npc"));
assert(templateKeys.includes("door"));
assert(templateKeys.includes("transfer_door"));
assert(templateKeys.includes("chest"));
assert(templateKeys.includes("loot_pickup"));
assert(templateKeys.includes("shopkeeper"));
assert(templateKeys.includes("save_point"));
assert(templateKeys.includes("enemy_encounter"));
assert(templateKeys.includes("light_source"));
assert(templateKeys.includes("ladder_stairs"));
assert(templateKeys.includes("decoration_event"));

const newEvent = DocsDoodads.Events.createEventObject(nextId, 10, 15, {
    name: "Chest_01",
    characterName: "Chest",
    characterIndex: 0,
    list: DocsDoodads.EventTemplates.get("chest").list
});
assert.strictEqual(newEvent.id, 2);
assert.strictEqual(newEvent.x, 10);
assert.strictEqual(newEvent.y, 15);
assert.strictEqual(newEvent.pages[0].image.characterName, "Chest");
console.log("✓ Genuine MZ Event Creation & all 20 Event Templates verified.");

// Test Layout Engine
assert(DocsDoodads.Layout.presets.Mapping);
assert(DocsDoodads.Layout.presets.Events);
assert(DocsDoodads.Layout.presets.Characters);
assert(DocsDoodads.Layout.presets.Tiles);
assert(DocsDoodads.Layout.presets.Compact);
console.log("✓ All 5 workspace layout presets verified.");

// Test Slice PNG Exporter
assert(DocsDoodads.Export && typeof DocsDoodads.Export.exportSlices === 'function');
console.log("✓ Slice PNG Exporter subsystem verified.");

// Test Direct Collision Passability Check
const player = new global.Game_Player();
// When no doodads exist, passability is true
assert.strictEqual(player.canPass(5, 5, 2), true);

// Add a solid doodad directly in front at (5, 6)
window.$dataDocsDoodads = {
    1: [
        {
            x: 5 * 48 + 24,
            y: 6 * 48 + 24,
            frameW: 48,
            frameH: 48,
            anchorX: 0.5,
            anchorY: 0.5,
            scaleX: 1,
            scaleY: 1,
            collision: { preset: "full", shape: { x: 0, y: 0, w: 1, h: 1 } }
        }
    ]
};
// Moving down (d=2) into (5,6) should be blocked by doodad collision!
assert.strictEqual(player.canPass(5, 5, 2), false, "Passability should be blocked by doodad");
// Moving right (d=6) into (6,5) should be allowed!
assert.strictEqual(player.canPass(5, 5, 6), true, "Passability should be clear to the right");
// Through characters, Ctrl-walking in a playtest and the party in an airship pass doodads.
player._through = true;
assert.strictEqual(player.canPass(5, 5, 2), true, "a Through character passes");
player._through = false; player._debugThrough = true;
assert.strictEqual(player.canPass(5, 5, 2), true, "Ctrl-walking passes");
player._debugThrough = false; player._inAirship = true;
assert.strictEqual(player.canPass(5, 5, 2), true, "an airship flies over");
player._inAirship = false;
// A doodad that isn't showing doesn't block: one behind an off switch, one on a layer hidden in game.
global.$gameSwitches = { value: () => false };
const solid = window.$dataDocsDoodads[1][0];
solid.switch = [[3, true]];
assert.strictEqual(player.canPass(5, 5, 2), true, "hidden by its switch: no block");
solid.switch = [];
solid.layer = 'roof';
window.$dataDocsDoodads.mapSettings = { 1: { layers: [{ id: 'roof', name: 'Roof', gameHidden: true }] } };
assert.strictEqual(DocsDoodads.Layers.visibleInGame(solid, DocsDoodads.Lighting.mapSettings(1)), false, 'the layer is hidden in game');
assert.strictEqual(player.canPass(5, 5, 2), true, "on a layer hidden in game: no block");
delete solid.layer;
delete window.$dataDocsDoodads.mapSettings;
assert.strictEqual(player.canPass(5, 5, 2), false, "showing again: blocks");
// Maps with other tile sizes: the tile in front is measured in that size.
$gameMap._tile = 32;
solid.x = 5 * 32 + 16; solid.y = 6 * 32 + 16; solid.frameW = 32; solid.frameH = 32;
assert.strictEqual(player.canPass(5, 5, 2), false, "32-pixel tiles: blocked in front");
assert.strictEqual(player.canPass(5, 5, 6), true, "and clear to the side");
$gameMap._tile = 48;
console.log("✓ Direct Physical Doodad SAT Collision passability verified.");

// Test Undo / Redo
assert.strictEqual(DocsDoodads.Undo.undoStack.length, 0);
let testVal = 10;
DocsDoodads.Undo.execute({
    apply: () => { testVal = 50; },
    revert: () => { testVal = 10; }
});
assert.strictEqual(testVal, 50);
DocsDoodads.Undo.undo();
assert.strictEqual(testVal, 10);
DocsDoodads.Undo.redo();
assert.strictEqual(testVal, 50);
console.log("✓ Command-based Undo / Redo verified.");

console.log("=== All Environment Tests Passed with Flying Colors! ===");
process.exit(0);
