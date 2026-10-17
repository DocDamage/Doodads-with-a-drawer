//==========================================================
// RPG Maker MZ & MV: Doc's Doodads
//==========================================================
/*:
 * @target MZ
 * @plugindesc Doc's Doodads - Asset Workspace & Doodad Engine [V2.0]
 * @author Doc
 *
 * @help
 * ============================================================================
 * DOC'S DOODADS
 * ============================================================================
 * An advanced visual asset-driven mapping and placement workspace for RPG Maker MZ.
 * Doc's Doodads began as Qiu Jiu's QJ-Doodads (V1.2) and has grown into its own tool.
 * Projects saved by QJ-Doodads are read and migrated automatically.
 *
 * KEY CAPABILITIES:
 * 1. Visual Asset Drawer:
 *    - Virtualized browsing for 10,000+ assets with lightning performance.
 *    - Thumbnail slider (32px - 256px), list & grid views, folder hierarchy.
 *    - Real-time tokenized search (type:, tag:, folder:, favorite:, animated:, -neg).
 *    - Favorites, custom collections, and recently used asset tracking.
 *
 * 2. Intelligent Slicing Engine & Interactive Slicer Modal:
 *    - Automatic detection of standard MZ sheets ($Single, 8-character, Faces, IconSet, SV).
 *    - Divisor-based grid candidate scoring.
 *    - Sidecar atlas metadata parsing (Aseprite, TexturePacker, .saf.json).
 *    - Canvas visual auto-slicer with adaptive Otsu alpha thresholding, border flood,
 *      morphological cleanup, 4-connected components, and gutter splitting.
 *    - Interactive 1600% zoomable Slicer Modal with 8-handle drag/resize, smart snapping,
 *      alignment guides, region list sidebar, split, merge, align, distribute,
 *      and authoritative non-destructive slice metadata persistence.
 *    - PNG slice exporter (individual PNGs, batch, animation strips).
 *
 * 3. Drag-and-Drop Placement, Live Ghost Preview & Stamping:
 *    - Drag any asset or slice directly onto the map with live ghost preview.
 *    - Free placement or tile grid snapping (48px or custom, hold Alt for free).
 *    - Stamping mode (click repeatedly to place props).
 *    - Eyedropper tool (Alt+Click placed object to select in drawer).
 *    - Scatter brush with density, scale jitter, and rotation jitter.
 *    - In-map selection, arrow-key nudge (1px / 16px), Ctrl+D duplicate, Delete key,
 *      and Z-order layering.
 *
 * 4. Genuine RPG Maker MZ Event Creation:
 *    - Intelligently detects if an asset needs an event (Yes / No / Remember).
 *    - Allocates safe event IDs and generates genuine MZ events in MapXXX.json.
 *    - 20 Built-in Event Templates: NPC, Door, Transfer Door, Chest, Loot, Sign,
 *      Switch, Lever, Save Point, Shopkeeper, Enemy Encounter, Harvestable,
 *      Breakable, Pushable, Light Source, Animated Prop, Teleporter, Ladder/Stairs,
 *      Vehicle, Decoration Event.
 *    - "Save Event as Template" command to capture any map event for reuse.
 *
 * 5. Direct Physical Doodad Collision:
 *    - Direct physical SAT collision without creating invisible blocker events.
 *    - Collision presets: Full Bounds, Bottom Half, Bottom Third, Center Box, Trunk, Wall.
 *    - Interactive visual collision rectangle editor in Inspector using relative coordinates.
 *
 * 6. Audio Preview & Sound Triggers:
 *    - In-editor audio player with start/stop and animated playback indicators.
 *    - Drag audio onto map to create sound-trigger events (play BGM / SE).
 *    - Drag audio onto existing event to append sound commands.
 *
 * 7. Modern Operations & Safety:
 *    - 300-level command-based Undo / Redo (Ctrl+Z, Ctrl+Y).
 *    - Duplicate (Ctrl+D), Copy/Paste (Ctrl+C, Ctrl+V), Nudge (Arrows / Shift+Arrows).
 *    - Windows Explorer drag-and-drop file/folder import with destination routing & conflict dialog.
 *    - Safe persistence: Session snapshots, dirty tracking, pre-save external conflict
 *      detection, timestamped backups in data/docs_doodads_cache/backups/, and atomic writes.
 *    - Autosave crash recovery snapshots in data/DocsDoodadsRecovery.json.
 *    - Diagnostics panel with cache statistics, memory tracking, and validation tools.
 *
 * KEYBOARD SHORTCUTS:
 * - F10 / Editor Key : Open / Close Asset Workspace
 * - Ctrl + Z         : Undo
 * - Ctrl + Y         : Redo
 * - Ctrl + S         : Save Project Changes (Atomic with conflict detection & backups)
 * - Ctrl + D         : Duplicate selection
 * - Ctrl + C / V     : Copy / Paste doodad
 * - Delete           : Delete selected doodad(s)
 * - Arrow Keys       : Nudge 1px (Shift + Arrow: 16px)
 * - Alt + Click      : Eyedropper (pick placed object on map)
 * - G                : Toggle Grid display
 * - Escape           : Cancel current placement tool / close modals
 *
 * THIRD-PARTY NOTICES:
 * - Based on QJ-Doodads by Qiu Jiu, MIT License. Copyright (c) 2022 Qiu Jiu.
 * ============================================================================
 *
 * @param editKey
 * @text Editor Toggle Key
 * @type select
 * @option F1
 * @option F6
 * @option F7
 * @option F8
 * @option F9
 * @option F10
 * @default F10
 * @desc Key to open/close the Asset Workspace editor during test play.
 *
 * @param editorMode
 * @text Editor Enabled
 * @type boolean
 * @default true
 * @desc Enables the Asset Workspace and in-game editing tools during test play.
 *
 * @param folderName
 * @text Doodads Image Folder
 * @type text
 * @default doodads/
 * @desc Default subfolder inside img/ for decorative doodads.
 *
 * @param dataFileName
 * @text Doodads Data File Name
 * @type text
 * @default DocsDoodads
 * @desc Name of the doodads json file in data/ (without .json).
 *
 * @param doodadScaleMode
 * @text Doodad Scaling Mode
 * @type boolean
 * @on Smooth / Linear
 * @off Pixelated / Nearest
 * @default true
 * @desc Texture scaling mode for doodad rendering.
 *
 * @param saveMode
 * @text Doodad JSON Formatting
 * @type boolean
 * @on Compact / Minified
 * @off Formatted / Indented
 * @default false
 * @desc Format style when saving DocsDoodads.json.
 *
 * @param defaultLayout
 * @text Default Workspace Layout
 * @type select
 * @option Mapping
 * @option Events
 * @option Characters
 * @option Tiles
 * @option Compact
 * @default Mapping
 * @desc Initial panel arrangement when launching the Asset Workspace.
 *
 * @param defaultThumbnailSize
 * @text Default Thumbnail Size
 * @type number
 * @min 32
 * @max 256
 * @default 96
 * @desc Default asset thumbnail card size in pixels.
 *
 * @param cacheEnabled
 * @text Asset Cache Enabled
 * @type boolean
 * @default true
 * @desc Cache asset metadata and thumbnails for instantaneous loading.
 *
 * @param backgroundWorkBudget
 * @text Background Work Budget (ms)
 * @type number
 * @min 1
 * @max 16
 * @default 4
 * @desc Maximum milliseconds per frame dedicated to background indexing and thumbnails.
 *
 * @param autosaveRecoveryInterval
 * @text Autosave Interval (sec)
 * @type number
 * @min 10
 * @max 600
 * @default 60
 * @desc Interval for writing autosave recovery snapshots (0 to disable).
 *
 * @param backupRetentionCount
 * @text Backup Retention Count
 * @type number
 * @min 1
 * @max 50
 * @default 10
 * @desc Number of timestamped project backups retained in data/docs_doodads_cache/backups/.
 *
 * @param gridSnapShow
 * @text Show Grid Snap
 * @type boolean
 * @default false
 * @desc Show visual grid overlay in editor by default.
 *
 * @param gridSnapWidth
 * @text Grid Snap Width
 * @type number
 * @default 48
 * @desc Width of the placement snapping grid.
 *
 * @param gridSnapHeight
 * @text Grid Snap Height
 * @type number
 * @default 48
 * @desc Height of the placement snapping grid.
 *
 * @param enableMVCompatibility
 * @text Enable MV Compatibility
 * @type boolean
 * @default true
 * @desc Enable compatibility layer when running under RPG Maker MV.
 *
 * @param devDiagnostics
 * @text Developer Diagnostics
 * @type boolean
 * @default false
 * @desc Enable diagnostics logging in Developer Tools console.
 *
 * @command setAmbient
 * @text Set Ambient Light
 * @desc Fades the map's darkness (for night, caves, storms). Doodad lights shine through it.
 *
 * @arg darkness
 * @text Darkness (%)
 * @type number
 * @min 0
 * @max 100
 * @default 60
 * @desc 0 is full daylight, 100 is fully dark.
 *
 * @arg color
 * @text Ambient Color
 * @type text
 * @default #101830
 * @desc Colour of the darkness as #rrggbb (deep blue for night, brown for caves).
 *
 * @arg duration
 * @text Fade Duration (frames)
 * @type number
 * @min 0
 * @default 60
 * @desc 60 frames is one second.
 *
 * @command resetAmbient
 * @text Reset Ambient Light
 * @desc Fades back to the ambient light set for this map in the editor.
 *
 * @arg duration
 * @text Fade Duration (frames)
 * @type number
 * @min 0
 * @default 60
 */

var DocsDoodads = (typeof window !== 'undefined' ? (window.DocsDoodads = window.DocsDoodads || { reWrite: {} }) : { reWrite: {} });
var Imported = (typeof window !== 'undefined' ? (window.Imported = window.Imported || {}) : {});
Imported.DocsDoodads = true;

function Sprite_DocsDoodad() {
    this.initialize(...arguments);
}
function Sprite_DocsDoodadsMouseCursor() {
    this.initialize(...arguments);
}

(($) => {
"use strict";


//==========================================================
// SECTION 1: CORE CONSTANTS & PARAMETERS
//==========================================================
const pluginName = "Docs-Doodads";

// Doc's Doodads began as QJ-Doodads. Names used by those builds are read as a fallback so
// existing projects keep their settings, data, backups, and recovery snapshots.
DocsDoodads.Legacy = {
    pluginName: 'QJ-Doodads',
    dataFileName: 'DoodadsQJ.json',
    backupDirectory: 'data/qj_asset_cache/backups',
    files: {
        'data/DocsDoodadsLibrary.json': 'data/QJAssetLibrary.json',
        'data/DocsDoodadsEventTemplates.json': 'data/QJEventTemplates.json',
        'data/DocsDoodadsLayouts.json': 'data/QJWorkspaceLayouts.json',
        'data/DocsDoodadsRecovery.json': 'data/QJAssetWorkspaceRecovery.json'
    },
    pathFor(filePath) {
        return this.files[String(filePath).replace(/\\/g, '/').replace(/^\.\//, '')] || null;
    }
};

function readPluginParameters() {
    if (typeof PluginManager === 'undefined' || !PluginManager.parameters) return {};
    const current = PluginManager.parameters(pluginName) || {};
    if (Object.keys(current).length > 0) return current;
    return PluginManager.parameters(DocsDoodads.Legacy.pluginName) || {};
}
const parameters = readPluginParameters();

function parseBooleanParameter(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
    return fallback;
}

function parseNumberParameter(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function safePluginFolder(value) {
    const segments = String(value || 'doodads').replace(/\\/g, '/').split('/')
        .filter(segment => segment && segment !== '.' && segment !== '..')
        .map(segment => segment.replace(/[<>:"|?*\x00-\x1f]/g, '_'))
        .filter(Boolean);
    return (segments.length ? segments.join('/') : 'doodads') + '/';
}

function safeDataBaseName(value) {
    const safe = String(value || 'DocsDoodads')
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/^\.+|\.+$/g, '');
    return safe || 'DocsDoodads';
}

DocsDoodads.Security = DocsDoodads.Security || {
    escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }
};

const escapeHtml = DocsDoodads.Security.escapeHtml;
const editKey = String(parameters.editKey || "F10");
const folderName = "img/" + safePluginFolder(parameters.folderName);
const editorMode = parseBooleanParameter(parameters.editorMode, true);
const dataFileName = safeDataBaseName(parameters.dataFileName) + ".json";
const pluginVersion = 2.0;
const doodadScaleMode = parseBooleanParameter(parameters.doodadScaleMode, true);
const saveMode = parseBooleanParameter(parameters.saveMode, false);

const defaultLayoutName = String(parameters.defaultLayout || "Mapping");
const defaultThumbnailSize = parseNumberParameter(parameters.defaultThumbnailSize, 96, 32, 256);
const cacheEnabled = parseBooleanParameter(parameters.cacheEnabled, true);
const backgroundWorkBudget = parseNumberParameter(parameters.backgroundWorkBudget, 4, 1, 16);
const autosaveRecoveryInterval = parseNumberParameter(parameters.autosaveRecoveryInterval, 60, 0, 600);
const backupRetentionCount = Math.round(parseNumberParameter(parameters.backupRetentionCount, 10, 1, 50));
const enableMVCompatibility = parseBooleanParameter(parameters.enableMVCompatibility, true);
const devDiagnostics = parseBooleanParameter(parameters.devDiagnostics, false);

//==========================================================
// SECTION 2: STANDARD STRUCTS & RUNTIME DATA
//==========================================================
DocsDoodads.standardStructData = {
    bit: [1],
    index: 0,
    anchorX: 0.5,
    anchorY: 1,
    posMode: 1, // 0: screen, 1: map
    x: 0,
    y: 0,
    z: 0,
    depth: "sorted",
    sortOffsetY: 0,
    scaleX: 1,
    scaleY: 1,
    blend: 0,
    opacity: 1,
    rotation: 0,
    rotateSpeed: 0,
    r: 0,
    g: 0,
    b: 0,
    grey: 0,
    xFrame: 1,
    yFrame: 1,
    frameUpdate: 0,
    frameX: 0,
    frameY: 0,
    frameW: 32,
    frameH: 32,
    switch: [],
    condition: "",
    blur: 0,
    contrast: 0,
    sepia: false,
    hue: 0,
    bright: false,
    collision: {
        preset: "none",
        shape: null
    }
};

DocsDoodads.standardStruct = function() {
    return (typeof JsonEx !== 'undefined' && JsonEx.makeDeepCopy) ? 
        JsonEx.makeDeepCopy(DocsDoodads.standardStructData) : 
        JSON.parse(JSON.stringify(DocsDoodads.standardStructData));
};

DocsDoodads.initPluginData = {
    version: pluginVersion
};

//==========================================================
// SECTION 3: SEPARATING AXIS THEOREM (SAT.JS) PHYSICS ENGINE
//==========================================================
function SATVector(x, y) { this.x = x || 0; this.y = y || 0; }
SATVector.prototype.copy = function(other) { this.x = other.x; this.y = other.y; return this; };
SATVector.prototype.clone = function() { return new SATVector(this.x, this.y); };
SATVector.prototype.perp = function() { var x = this.x; this.x = this.y; this.y = -x; return this; };
SATVector.prototype.rotate = function(angle) { var x = this.x; var y = this.y; this.x = x * Math.cos(angle) - y * Math.sin(angle); this.y = x * Math.sin(angle) + y * Math.cos(angle); return this; };
SATVector.prototype.reverse = function() { this.x = -this.x; this.y = -this.y; return this; };
SATVector.prototype.normalize = function() { var d = this.len(); if (d > 0) { this.x = this.x / d; this.y = this.y / d; } return this; };
SATVector.prototype.add = function(other) { this.x += other.x; this.y += other.y; return this; };
SATVector.prototype.sub = function(other) { this.x -= other.x; this.y -= other.y; return this; };
SATVector.prototype.scale = function(x, y) { this.x *= x; this.y *= typeof y !== 'undefined' ? y : x; return this; };
SATVector.prototype.project = function(other) { var amt = this.dot(other) / other.len2(); this.x = amt * other.x; this.y = amt * other.y; return this; };
SATVector.prototype.projectN = function(other) { var amt = this.dot(other); this.x = amt * other.x; this.y = amt * other.y; return this; };
SATVector.prototype.reflect = function(axis) { var x = this.x; var y = this.y; this.project(axis).scale(2); this.x -= x; this.y -= y; return this; };
SATVector.prototype.reflectN = function(axis) { var x = this.x; var y = this.y; this.projectN(axis).scale(2); this.x -= x; this.y -= y; return this; };
SATVector.prototype.dot = function(other) { return this.x * other.x + this.y * other.y; };
SATVector.prototype.len2 = function() { return this.dot(this); };
SATVector.prototype.len = function() { return Math.sqrt(this.len2()); };

function SATCircle(pos, r) { this.pos = pos || new SATVector(); this.r = r || 0; this.offset = new SATVector(); }
SATCircle.prototype.getAABBAsBox = function() { var r = this.r; var corner = this.pos.clone().add(this.offset).sub(new SATVector(r, r)); return new SATBox(corner, r * 2, r * 2); };
SATCircle.prototype.getAABB = function() { return this.getAABBAsBox().toPolygon(); };
SATCircle.prototype.setOffset = function(offset) { this.offset = offset; return this; };

function SATPolygon(pos, points) { this.pos = pos || new SATVector(); this.angle = 0; this.offset = new SATVector(); this.setPoints(points || []); }
SATPolygon.prototype.setPoints = function(points) {
    var lengthChanged = !this.points || this.points.length !== points.length;
    if (lengthChanged) {
        var i;
        var calcPoints = this.calcPoints = [];
        var edges = this.edges = [];
        var normals = this.normals = [];
        for (i = 0; i < points.length; i++) {
            var p1 = points[i];
            var p2 = i < points.length - 1 ? points[i + 1] : points[0];
            if (p1 !== p2 && p1.x === p2.x && p1.y === p2.y) {
                points.splice(i, 1);
                i -= 1;
                continue;
            }
            calcPoints.push(new SATVector());
            edges.push(new SATVector());
            normals.push(new SATVector());
        }
    }
    this.points = points;
    this._recalc();
    return this;
};
SATPolygon.prototype.setAngle = function(angle) { this.angle = angle; this._recalc(); return this; };
SATPolygon.prototype.setOffset = function(offset) { this.offset = offset; return this; };
SATPolygon.prototype.rotate = function(angle) { for (var i = 0; i < this.points.length; i++) { this.points[i].rotate(angle); } this._recalc(); return this; };
SATPolygon.prototype.translate = function(x, y) { for (var i = 0; i < this.points.length; i++) { this.points[i].x += x; this.points[i].y += y; } this._recalc(); return this; };
SATPolygon.prototype._recalc = function() {
    var calcPoints = this.calcPoints, edges = this.edges, normals = this.normals, points = this.points, offset = this.offset, angle = this.angle;
    var len = points.length, i;
    for (i = 0; i < len; i++) {
        var calcPoint = calcPoints[i].copy(points[i]);
        calcPoint.x += offset.x; calcPoint.y += offset.y;
        if (angle !== 0) calcPoint.rotate(angle);
    }
    for (i = 0; i < len; i++) {
        var p1 = calcPoints[i];
        var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
        var e = edges[i].copy(p2).sub(p1);
        normals[i].copy(e).perp().normalize();
    }
    return this;
};
SATPolygon.prototype.getAABBAsBox = function() {
    var points = this.calcPoints, len = points.length;
    var xMin = points[0].x, yMin = points[0].y, xMax = points[0].x, yMax = points[0].y;
    for (var i = 1; i < len; i++) {
        var point = points[i];
        if (point.x < xMin) xMin = point.x; else if (point.x > xMax) xMax = point.x;
        if (point.y < yMin) yMin = point.y; else if (point.y > yMax) yMax = point.y;
    }
    return new SATBox(this.pos.clone().add(new SATVector(xMin, yMin)), xMax - xMin, yMax - yMin);
};
SATPolygon.prototype.getAABB = function() { return this.getAABBAsBox().toPolygon(); };
SATPolygon.prototype.getCentroid = function() {
    var points = this.calcPoints, len = points.length, cx = 0, cy = 0, ar = 0;
    for (var i = 0; i < len; i++) {
        var p1 = points[i];
        var p2 = i === len - 1 ? points[0] : points[i + 1];
        var a = p1.x * p2.y - p2.x * p1.y;
        cx += (p1.x + p2.x) * a; cy += (p1.y + p2.y) * a; ar += a;
    }
    ar = ar * 3;
    return new SATVector(cx / ar, cy / ar);
};

function SATBox(pos, w, h) { this.pos = pos || new SATVector(); this.w = w || 0; this.h = h || 0; }
SATBox.prototype.toPolygon = function() {
    var pos = this.pos, w = this.w, h = this.h;
    return new SATPolygon(new SATVector(pos.x, pos.y), [
        new SATVector(), new SATVector(w, 0), new SATVector(w, h), new SATVector(0, h)
    ]);
};

function SATResponse() {
    this.a = null; this.b = null; this.overlapN = new SATVector(); this.overlapV = new SATVector(); this.clear();
}
SATResponse.prototype.clear = function() {
    this.aInB = true; this.bInA = true; this.overlap = Number.MAX_VALUE; return this;
};

var TEST_POINT = new SATVector();
var RESPONSE = new SATResponse();
var T_VECTORS = [];
for (var i = 0; i < 10; i++) { T_VECTORS.push(new SATVector()); }
var T_ARRAYS = [];
for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, len = points.length, i;
    for (i = 0; i < len; i++) {
        var dot = points[i].dot(normal);
        if (dot < min) { min = dot; }
        if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
}

function isSeparatingAxis(aPos, bPos, aPoints, bPoints, normal, response) {
    var rangeA = T_ARRAYS[0], rangeB = T_ARRAYS[1];
    var offsetV = T_VECTORS[0].copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(normal);
    flattenPointsOn(aPoints, normal, rangeA);
    flattenPointsOn(bPoints, normal, rangeB);
    rangeB[0] += projectedOffset; rangeB[1] += projectedOffset;
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) { return true; }
    if (response) {
        var overlap = 0;
        if (rangeA[0] < rangeB[0]) {
            response.aInB = false;
            if (rangeA[1] < rangeB[1]) { overlap = rangeA[1] - rangeB[0]; response.bInA = false; }
            else { var o1 = rangeA[1] - rangeB[0], o2 = rangeB[1] - rangeA[0]; overlap = o1 < o2 ? o1 : -o2; }
        } else {
            response.bInA = false;
            if (rangeA[1] > rangeB[1]) { overlap = rangeA[0] - rangeB[1]; response.aInB = false; }
            else { var o1 = rangeA[1] - rangeB[0], o2 = rangeB[1] - rangeA[0]; overlap = o1 < o2 ? o1 : -o2; }
        }
        var absOverlap = Math.abs(overlap);
        if (absOverlap < response.overlap) {
            response.overlap = absOverlap;
            response.overlapN.copy(normal);
            if (overlap < 0) { response.overlapN.reverse(); }
        }
    }
    return false;
}

function testPolygonPolygon(a, b, response) {
    var aPoints = a.calcPoints, aLen = aPoints.length, bPoints = b.calcPoints, bLen = bPoints.length, i;
    if (response) { response.clear(); response.a = a; response.b = b; }
    for (i = 0; i < aLen; i++) { if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, a.normals[i], response)) { return false; } }
    for (i = 0; i < bLen; i++) { if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, b.normals[i], response)) { return false; } }
    if (response) { response.overlapV.copy(response.overlapN).scale(response.overlap); }
    return true;
}

function testCirclePolygon(circle, polygon, response) {
    if (response) { response.clear(); response.a = circle; response.b = polygon; }
    var circlePos = circle.pos.clone().add(circle.offset);
    var radius = circle.r, radius2 = radius * radius;
    var points = polygon.calcPoints, len = points.length;
    var edge = T_VECTORS[0], point = T_VECTORS[1];
    for (var i = 0; i < len; i++) {
        var b = i === len - 1 ? points[0] : points[i + 1];
        var a = points[i];
        edge.copy(polygon.edges[i]);
        point.copy(circlePos).sub(polygon.pos).sub(a);
        if (response && point.len2() > radius2) { response.aInB = false; }
        var region = point.dot(edge);
        if (region < 0) {
            point.copy(circlePos).sub(polygon.pos).sub(a);
            var dist = point.len();
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(point.normalize()); }
            return true;
        } else if (region > edge.len2()) {
            point.copy(circlePos).sub(polygon.pos).sub(b);
            var dist = point.len();
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(point.normalize()); }
            return true;
        } else {
            var normal = polygon.normals[i];
            var dist = point.dot(normal);
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(normal); }
            return true;
        }
    }
    return true;
}

function testPolygonCircle(polygon, circle, response) {
    var result = testCirclePolygon(circle, polygon, response);
    if (result && response) {
        var a = response.a, aInB = response.aInB;
        response.overlapN.reverse();
        response.overlapV.reverse();
        response.a = response.b; response.b = a;
        response.aInB = response.bInA; response.bInA = aInB;
    }
    return result;
}

function testCircleCircle(a, b, response) {
    var aPos = a.pos.clone().add(a.offset), bPos = b.pos.clone().add(b.offset);
    var differenceV = T_VECTORS[0].copy(bPos).sub(aPos);
    var totalRadius = a.r + b.r, totalRadiusSq = totalRadius * totalRadius;
    var distSq = differenceV.len2();
    if (distSq > totalRadiusSq) { return false; }
    if (response) {
        var dist = Math.sqrt(distSq);
        response.clear(); response.a = a; response.b = b;
        response.overlap = totalRadius - dist;
        response.overlapN.copy(differenceV.normalize());
        response.overlapV.copy(response.overlapN).scale(response.overlap);
        response.aInB = a.r <= b.r && dist <= b.r - a.r;
        response.bInA = b.r <= a.r && dist <= a.r - b.r;
    }
    return true;
}

DocsDoodads.V = function(x, y) { return new SATVector(x, y); };
DocsDoodads.C = function(pos, r) { return new SATCircle(pos, r); };
DocsDoodads.B = function(pos, w, h) { return new SATBox(pos, w, h); };
DocsDoodads.P = function(pos, points) { return new SATPolygon(pos, points); };
DocsDoodads.box = function(x, y, w, h) {
    var b = new SATBox(new SATVector(x - w / 2, y - h / 2), w, h);
    return b.toPolygon();
};
DocsDoodads.circle = function(x, y, r) {
    return new SATCircle(new SATVector(x, y), r);
};
DocsDoodads.judge = function(a, b) {
    if (a instanceof SATPolygon && b instanceof SATPolygon) { return testPolygonPolygon(a, b); }
    if (a instanceof SATCircle && b instanceof SATPolygon) { return testCirclePolygon(a, b); }
    if (a instanceof SATPolygon && b instanceof SATCircle) { return testPolygonCircle(a, b); }
    if (a instanceof SATCircle && b instanceof SATCircle) { return testCircleCircle(a, b); }
    return false;
};


//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
DocsDoodads.migrateData = function(data, type) {
    if (!data) return data;
    if (type === 'doodads') {
        for (var mapId in data) {
            var list = data[mapId];
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    var d = list[i];
                    if (!d.collision) d.collision = { preset: "none", shape: null };
                    if (d.scaleX === undefined) d.scaleX = 1;
                    if (d.scaleY === undefined) d.scaleY = 1;
                    if (d.anchorX === undefined) d.anchorX = 0.5;
                    if (d.anchorY === undefined) d.anchorY = 1.0;
                    if (d.opacity === undefined) d.opacity = 1.0;
                    if (d.posMode === undefined) d.posMode = 1;
                    if (d.rotation === undefined) d.rotation = 0;
                    if (d.rotateSpeed === undefined) d.rotateSpeed = 0;
                    if (!d.switch) d.switch = [];
                    if (d.condition === undefined) d.condition = "";
                    if (!DocsDoodads.Depth.modes.includes(d.depth)) d.depth = DocsDoodads.Depth.fromLegacyZ(d.z);
                }
            }
        }
    } else if (type === 'library') {
        if (!data.version || data.version < 2) {
            data.version = 2;
            data.settings = data.settings || {};
            data.collections = data.collections || {};
            data.assets = data.assets || {};
        }
    }
    return data;
};

if (typeof DataManager !== 'undefined') {
    $.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase.call(this);
        this.loadDocsDoodadsData();
    };

    DataManager.loadDocsDoodadsData = function() {
        // Projects saved by QJ-Doodads have DoodadsQJ.json until they are saved again.
        const candidates = ['data/' + dataFileName];
        if (dataFileName === 'DocsDoodads.json') candidates.push('data/' + DocsDoodads.Legacy.dataFileName);
        const tryLoad = (index) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', candidates[index]);
            xhr.overrideMimeType('application/json');
            const next = () => {
                if (index + 1 < candidates.length) {
                    tryLoad(index + 1);
                } else {
                    window.$dataDocsDoodads = {};
                    DataManager.checkDocsDoodadsData();
                }
            };
            xhr.onload = function() {
                if (xhr.status < 400) {
                    window.$dataDocsDoodads = JSON.parse(xhr.responseText);
                    DataManager.checkDocsDoodadsData();
                } else {
                    next();
                }
            };
            xhr.onerror = next;
            xhr.send();
        };
        tryLoad(0);
    };

    DataManager.checkDocsDoodadsData = function() {
        if (!window.$dataDocsDoodads) window.$dataDocsDoodads = {};
        DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
    };

    DataManager.saveDocsDoodadsData = function() {
        if (typeof StorageManager !== 'undefined') {
            const fs = (typeof require !== 'undefined') ? require('fs') : null;
            if (fs) {
                const filePath = 'data/' + dataFileName;
                const content = saveMode ? JSON.stringify(window.$dataDocsDoodads) : JSON.stringify(window.$dataDocsDoodads, null, 2);
                fs.writeFileSync(filePath, content);
            }
        }
    };

    DataManager.loadMapDataSyncDocsDoodads = function(type, mapId) {
        const fs = (typeof require !== 'undefined') ? require('fs') : null;
        if (!fs) return null;
        const filePath = 'data/Map' + String(mapId).padStart(3, '0') + '.json';
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch(e) {
                return null;
            }
        }
        return null;
    };
}

DocsDoodads.doodads = function(mapId) {
    if (typeof window === 'undefined' || !window.$dataDocsDoodads) return [];
    mapId = mapId || (window.$gameMap ? window.$gameMap.mapId() : 0);
    return window.$dataDocsDoodads[mapId] || [];
};

//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
DocsDoodads.loadBitmap = function(path) {
    if (typeof ImageManager === 'undefined') return null;
    if (path.startsWith('img/')) {
        path = path.slice(4);
    }
    const slash = path.indexOf('/');
    if (slash > -1) {
        const folder = 'img/' + path.slice(0, slash + 1);
        const file = path.slice(slash + 1).replace(/\.[^/.]+$/, "");
        return ImageManager.loadBitmap(folder, file);
    }
    return ImageManager.loadBitmap('img/', path.replace(/\.[^/.]+$/, ""));
};

//==========================================================
// SECTION 5B: RENDER EFFECTS (DEPTH, APPEARANCE, MOTION, SHADOWS, LIGHTS)
//==========================================================
// Doodads live in the tilemap beside the characters (as in QJ-Doodads), so the tilemap's
// z-then-y sort puts a "sorted" doodad in front of or behind the player by its base line.
DocsDoodads.Depth = {
    modes: ['below', 'sorted', 'above'],
    labels: { below: 'Below characters (floor decal)', sorted: 'Sorted with characters', above: 'Above characters (overhang)' },
    // Ground tiles are z 0, below/same/above-priority characters 1/3/5, upper tiles 4.
    bands: { below: 0.5, sorted: 3, above: 4.5 },
    shadowZ: 0.59,
    bandSpread: 0.08,

    // QJ-Doodads used z directly as the tilemap layer.
    fromLegacyZ(z) {
        z = Number(z) || 0;
        if (z < 3) return 'below';
        if (z === 3) return 'sorted';
        return 'above';
    },

    resolve(d) {
        return d && this.modes.includes(d.depth) ? d.depth : this.fromLegacyZ(d && d.z);
    },

    spriteZ(d) {
        const mode = this.resolve(d);
        if (mode === 'sorted') return this.bands.sorted;
        const order = Math.max(-this.bandSpread, Math.min(this.bandSpread, (Number(d.z) || 0) * 1e-4));
        return this.bands[mode] + order;
    },

    // Bottom edge of the image (map or screen space, same as d.y) plus the user's base-line offset.
    baseY(d) {
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const ay = d.anchorY !== undefined ? d.anchorY : 1;
        return d.y + h * (1 - ay) + (Number(d.sortOffsetY) || 0);
    },

    compareChildren(a, b) {
        if (a.z !== b.z) return a.z - b.z;
        const ay = a._docsSortY !== undefined ? a._docsSortY : a.y;
        const by = b._docsSortY !== undefined ? b._docsSortY : b.y;
        if (ay !== by) return ay - by;
        return (a.spriteId || 0) - (b.spriteId || 0);
    },

    // Flat things (rugs, puddles, paths) belong under the player; everything else stands up.
    suggestFor(asset) {
        const words = [String(asset && asset.fileName || '')].concat((asset && asset.tags) || [], (asset && asset.autoTags) || []).join(' ').toLowerCase();
        return /(^|[^a-z])(rugs?|carpets?|mats?|floor|decals?|puddles?|paths?|roads?|shadows?|stains?|cracks?|ground)([^a-z]|$)/.test(words) ? 'below' : 'sorted';
    }
};

DocsDoodads.Appearance = {
    // PIXI.BLEND_MODES values: NORMAL 0, ADD 1, MULTIPLY 2, SCREEN 3.
    blendModes: [
        { value: 0, label: 'Normal' }, { value: 1, label: 'Add (glow)' },
        { value: 2, label: 'Multiply (shade)' }, { value: 3, label: 'Screen (light)' }
    ],

    blendMode(d) {
        const value = Number(d && d.blend) || 0;
        return this.blendModes.some(mode => mode.value === value) ? value : 0;
    },

    // QJ stored "5|true~6|false"; newer data stores [[5, true]] or [{ id, value }].
    parseSwitches(input) {
        if (!input) return [];
        const out = [];
        const push = (id, value) => {
            id = parseInt(id, 10);
            if (id > 0) out.push([id, value]);
        };
        const truthy = value => value === true || /^(true|on|1)$/i.test(String(value).trim());
        if (typeof input === 'string') {
            for (const part of input.split('~')) {
                if (!part.trim()) continue;
                const [id, value] = part.split('|');
                push(id, value === undefined ? true : truthy(value));
            }
        } else if (Array.isArray(input)) {
            for (const item of input) {
                if (Array.isArray(item)) push(item[0], item[1] === undefined ? true : truthy(item[1]));
                else if (item && typeof item === 'object') push(item.id, item.value === undefined ? true : truthy(item.value));
                else push(item, true);
            }
        }
        return out;
    },

    // Inspector text such as "5:on, 6 off, 7".
    parseSwitchText(text) {
        const out = [];
        for (const part of String(text || '').split(/[,;]+/)) {
            const match = part.trim().match(/^(\d+)\s*[:=|\s]?\s*(on|off|true|false|1|0)?$/i);
            if (!match) continue;
            const id = parseInt(match[1], 10);
            if (id > 0) out.push([id, match[2] === undefined ? true : /^(on|true|1)$/i.test(match[2])]);
        }
        return out;
    },

    formatSwitches(list) {
        return this.parseSwitches(list).map(([id, value]) => `${id}:${value ? 'on' : 'off'}`).join(', ');
    },

    _conditionCache: {},

    // Conditions are JavaScript from the project's own data file, like QJ-Doodads; errors never hide a doodad.
    conditionPasses(condition) {
        const source = String(condition || '').trim();
        if (!source) return true;
        let fn = this._conditionCache[source];
        if (fn === undefined) {
            try { fn = new Function(`return (${source});`); } catch (error) { fn = null; }
            this._conditionCache[source] = fn;
        }
        if (!fn) return true;
        try { return Boolean(fn()); } catch (error) { return true; }
    },

    isVisible(d, ctx = {}) {
        if (ctx.editing) return true;
        const switchValue = ctx.switchValue || (id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false));
        for (const [id, value] of this.parseSwitches(d.switch)) {
            if (Boolean(switchValue(id)) !== value) return false;
        }
        return this.conditionPasses(d.condition);
    },

    // Only conditional doodads need a per-frame visibility check.
    isConditional(d) {
        return this.parseSwitches(d.switch).length > 0 || Boolean(String(d.condition || '').trim());
    },

    needsColorFilter(d) {
        return Boolean(Number(d.r) || Number(d.g) || Number(d.b) || Number(d.grey) || Number(d.hue));
    },

    // Fields that change the filter stack; position and scale are excluded so moving stays cheap.
    signature(d) {
        const m = d.motion && d.motion.type === 'shimmer' ? 'shimmer' + (d.motion.amount || 0) : '';
        return [d.r, d.g, d.b, d.grey, d.hue, d.blur, d.contrast, d.sepia, d.bright, d.blend, m].join('|');
    }
};

DocsDoodads.Motion = {
    types: [
        { value: 'none', label: 'None' }, { value: 'sway', label: 'Sway (wind)' }, { value: 'bob', label: 'Bob (float)' },
        { value: 'pulse', label: 'Pulse (breathe)' }, { value: 'flicker', label: 'Flicker (flame)' }, { value: 'shimmer', label: 'Shimmer (water/heat)' }
    ],

    normalize(m) {
        const type = m && this.types.some(t => t.value === m.type) ? m.type : 'none';
        const amount = m && m.amount !== undefined ? Math.max(0, Math.min(1, Number(m.amount) || 0)) : 0.5;
        const speed = m && m.speed !== undefined ? Math.max(0.05, Math.min(5, Number(m.speed) || 1)) : 1;
        return { type, amount, speed, phase: m && m.phase !== undefined ? Number(m.phase) || 0 : null };
    },

    // Smooth 1D value noise in [0, 1].
    noise(x) {
        const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
        const i = Math.floor(x), f = x - i;
        const t = f * f * (3 - 2 * f);
        return hash(i) * (1 - t) + hash(i + 1) * t;
    },

    // seed (usually the doodad's x + y) staggers the phase so neighbouring props don't move in lockstep.
    sample(m, time, seed) {
        const out = { skewX: 0, offsetY: 0, alphaMul: 1, scaleMul: 1 };
        if (!m || m.type === 'none' || !m.type) return out;
        const phase = m.phase !== null && m.phase !== undefined ? m.phase : (Number(seed) || 0) * 0.013;
        const wave = Math.sin(Math.PI * 2 * m.speed * 0.5 * time + phase);
        if (m.type === 'sway') out.skewX = wave * m.amount * 0.12;
        else if (m.type === 'bob') out.offsetY = wave * m.amount * 6;
        else if (m.type === 'pulse') out.scaleMul = 1 + wave * m.amount * 0.06;
        else if (m.type === 'flicker') out.alphaMul = 1 - m.amount * 0.35 * this.noise(time * m.speed * 8 + phase * 10);
        return out;
    },

    // Horizontal ripple for "shimmer"; inputSize is supplied by PIXI v5 filters.
    shimmerFragment: [
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform float time;',
        'uniform float amount;',
        'void main(void) {',
        '    vec2 uv = vTextureCoord;',
        '    uv.x += sin(uv.y * inputSize.y / 7.0 + time * 3.0) * amount * 2.0 * inputSize.z;',
        '    gl_FragColor = texture2D(uSampler, uv);',
        '}'
    ].join('\n')
};

DocsDoodads.Shadow = {
    defaults: { enabled: false, opacity: 0.35, length: 0.45, angle: -35, blur: 2, offsetX: 0, offsetY: 0 },

    normalize(s) {
        return Object.assign({}, this.defaults, s || {});
    },

    // A black silhouette of the same frame, squashed and leaning away from the camera.
    transform(d) {
        if (!d || !d.shadow || !d.shadow.enabled) return null;
        const s = this.normalize(d.shadow);
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;
        return {
            scaleX: sx,
            scaleY: sy * Math.max(0.05, Math.min(1.5, Number(s.length) || 0)),
            skewX: (Number(s.angle) || 0) * Math.PI / 180,
            alpha: Math.max(0, Math.min(1, Number(s.opacity) || 0)) * (d.opacity !== undefined ? d.opacity : 1),
            offsetX: Number(s.offsetX) || 0,
            offsetY: Number(s.offsetY) || 0,
            blur: Math.max(0, Number(s.blur) || 0)
        };
    }
};

DocsDoodads.Lighting = {
    lightDefaults: { enabled: false, color: '#ffd27f', radius: 144, intensity: 0.85, flicker: 0, glow: 0.25, offsetX: 0, offsetY: -24 },
    ambientDefaults: { darkness: 0, color: '#101830', switchId: 0 },

    parseColor(value, fallback = 0xffffff) {
        if (typeof value === 'number' && isFinite(value)) return value & 0xffffff;
        const match = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i);
        return match ? parseInt(match[1], 16) : fallback;
    },

    channels(color) {
        const c = this.parseColor(color, 0);
        return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    },

    // Per-map settings sit beside the numeric map keys in $dataDocsDoodads.
    mapSettings(mapId) {
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        if (!data || !data.mapSettings) return null;
        return data.mapSettings[mapId] || null;
    },

    setMapSettings(mapId, settings) {
        if (typeof window === 'undefined' || !window.$dataDocsDoodads) return null;
        const all = window.$dataDocsDoodads.mapSettings = window.$dataDocsDoodads.mapSettings || {};
        all[mapId] = Object.assign({}, all[mapId] || {}, settings);
        return all[mapId];
    },

    // runtimeOverride comes from the "Set Ambient Light" plugin command and wins over the map setting.
    ambientFor(settings, runtimeOverride, switchValue) {
        if (runtimeOverride) {
            return { darkness: Math.max(0, Math.min(1, Number(runtimeOverride.darkness) || 0)), color: runtimeOverride.color || this.ambientDefaults.color };
        }
        const ambient = Object.assign({}, this.ambientDefaults, settings && settings.ambient);
        const gated = Number(ambient.switchId) > 0 && !(switchValue && switchValue(Number(ambient.switchId)));
        return { darkness: gated ? 0 : Math.max(0, Math.min(1, Number(ambient.darkness) || 0)), color: ambient.color };
    },

    // The lightmap multiplies the scene: white where lit, the ambient colour where fully dark.
    lightmapBase(ambient) {
        const k = Math.max(0, Math.min(1, Number(ambient && ambient.darkness) || 0));
        return this.channels(ambient && ambient.color).map(c => (1 - k) + k * c);
    },

    flicker(time, seed, amount) {
        amount = Math.max(0, Math.min(1, Number(amount) || 0));
        if (!amount) return 1;
        return 1 - amount * DocsDoodads.Motion.noise(time * 6 + (Number(seed) || 0) * 3.7);
    },

    // display: the map's scroll in pixels ({ x, y }), so lights land in screen space.
    collect(doodads, display = { x: 0, y: 0 }) {
        const out = [];
        for (const d of doodads || []) {
            if (!d || !d.light || !d.light.enabled) continue;
            const l = Object.assign({}, this.lightDefaults, d.light);
            const mapSpace = d.posMode !== 0;
            out.push({
                doodad: d,
                x: d.x - (mapSpace ? display.x : 0) + (Number(l.offsetX) || 0),
                y: d.y - (mapSpace ? display.y : 0) + (Number(l.offsetY) || 0),
                radius: Math.max(8, Number(l.radius) || 144),
                color: this.parseColor(l.color, 0xffd27f),
                intensity: Math.max(0, Math.min(1, Number(l.intensity) || 0)),
                flicker: Number(l.flicker) || 0,
                glow: Math.max(0, Math.min(1, Number(l.glow) || 0)),
                seed: (d.x || 0) + (d.y || 0)
            });
        }
        return out;
    },

    mixColor(from, to, p) {
        const a = this.channels(from), b = this.channels(to);
        const mixed = a.map((c, i) => Math.round((c + (b[i] - c) * p) * 255));
        return '#' + mixed.map(c => c.toString(16).padStart(2, '0')).join('');
    },

    startFade(from, to, frames) {
        const total = Math.max(0, Math.round(Number(frames) || 0));
        const fade = { from: Object.assign({}, from), to: Object.assign({}, to), framesTotal: total, framesLeft: total, current: Object.assign({}, total ? from : to) };
        if (!total) fade.current = Object.assign({}, to);
        return fade;
    },

    stepFade(fade) {
        if (!fade || fade.framesLeft <= 0) return fade;
        fade.framesLeft--;
        const p = 1 - fade.framesLeft / fade.framesTotal;
        const a = Number(fade.from.darkness) || 0, b = Number(fade.to.darkness) || 0;
        fade.current = { darkness: fade.framesLeft === 0 ? b : a + (b - a) * p, color: this.mixColor(fade.from.color, fade.to.color, p) };
        return fade;
    }
};

//==========================================================
// SECTION 6: SPRITE_DOCSDOODAD RUNTIME ENGINE
//==========================================================
DocsDoodads.frameCount = function() {
    return typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : 0;
};

if (typeof PIXI !== 'undefined') {
    Sprite_DocsDoodad.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_DocsDoodad.prototype.constructor = Sprite_DocsDoodad;

    Sprite_DocsDoodad.prototype.initialize = function(data, spriteset) {
        PIXI.Sprite.call(this);
        this._data = data;
        this._spriteset = spriteset;
        // The tilemap breaks z/y ties by spriteId, like Sprite_Character.
        this.spriteId = typeof Sprite !== 'undefined' && Sprite._counter !== undefined ? Sprite._counter++ : 0;
        this._frameTimer = 0;
        this._currentFrame = 0;
        this._spin = 0;
        this._lastUpdateFrame = -1;
        this._appearanceSig = null;
        this._shadowSprite = null;
        this.loadTexture();
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.loadTexture = function() {
        if (!this._data || !this._data.bit) return;
        const bit = this._data.bit;
        let bmp = null;
        if (bit[0] === 1 && typeof ImageManager !== 'undefined') {
            bmp = ImageManager.loadSystem("IconSet");
        } else if (bit[0] === 2 && typeof $gameMap !== 'undefined' && $dataTilesets) {
            const tileset = $dataTilesets[$gameMap.tilesetId()];
            if (tileset && tileset.tilesetNames && tileset.tilesetNames[bit[1]]) {
                bmp = ImageManager.loadTileset(tileset.tilesetNames[bit[1]]);
            }
        } else if (bit[0] === 3) {
            bmp = DocsDoodads.loadBitmap(bit[1]);
        }
        if (bmp) {
            if (bmp.isReady()) {
                this.setupBitmap(bmp);
            } else {
                bmp.addLoadListener(() => this.setupBitmap(bmp));
            }
        }
    };

    Sprite_DocsDoodad.prototype.setupBitmap = function(bmp) {
        if (!bmp || !bmp._baseTexture) return;
        this._bmp = bmp;
        const fw = this._data.frameW || bmp.width;
        const fh = this._data.frameH || bmp.height;
        const fx = this._data.frameX || 0;
        const fy = this._data.frameY || 0;
        this.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(fx, fy, fw, fh));
        if (this._shadowSprite) this._shadowSprite.texture = this.texture;
    };

    // Called by the tilemap (which updates its children) and by Spriteset_Map; runs once per frame.
    Sprite_DocsDoodad.prototype.update = function() {
        if (!this._data) return;
        const frame = DocsDoodads.frameCount();
        if (frame === this._lastUpdateFrame && frame !== 0) return;
        this._lastUpdateFrame = frame;
        const d = this._data;
        if (d.rotateSpeed) this._spin += d.rotateSpeed * Math.PI / 180;
        if (d.frameUpdate && (d.xFrame > 1 || d.yFrame > 1)) {
            this._frameTimer++;
            if (this._frameTimer >= d.frameUpdate) {
                this._frameTimer = 0;
                this.updateFrameAnimation();
            }
        }
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.screenPosition = function() {
        const d = this._data;
        if (d.posMode === 1 && typeof $gameMap !== 'undefined' && $gameMap) {
            const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            return { x: d.x - $gameMap.displayX() * tw, y: d.y - $gameMap.displayY() * th };
        }
        return { x: d.x || 0, y: d.y || 0 };
    };

    Sprite_DocsDoodad.prototype.updatePlacement = function() {
        const d = this._data;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (this._motionSource !== d.motion || editing) {
            this._motionSource = d.motion;
            this._motion = DocsDoodads.Motion.normalize(d.motion);
        }
        const motion = DocsDoodads.Motion.sample(this._motion, DocsDoodads.frameCount() / 60, (d.x || 0) + (d.y || 0));
        const pos = this.screenPosition();
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;

        this.anchor.x = d.anchorX !== undefined ? d.anchorX : 0.5;
        this.anchor.y = d.anchorY !== undefined ? d.anchorY : 1.0;
        this.x = pos.x;
        this.y = pos.y + motion.offsetY;
        this.scale.x = sx * motion.scaleMul;
        this.scale.y = sy * motion.scaleMul;
        this.skew.x = motion.skewX;
        this.rotation = (d.rotation || 0) * Math.PI / 180 + this._spin;
        this.z = DocsDoodads.Depth.spriteZ(d);
        this._docsSortY = pos.y + (DocsDoodads.Depth.baseY(d) - d.y);

        let visible = true;
        let dim = 1;
        if (editing) {
            visible = !d.editorHidden;
            // Conditional doodads stay editable but look faded while their condition is false.
            if (visible && DocsDoodads.Appearance.isConditional(d) && !DocsDoodads.Appearance.isVisible(d, {})) dim = 0.45;
        } else if (DocsDoodads.Appearance.isConditional(d)) {
            visible = DocsDoodads.Appearance.isVisible(d, {});
        }
        this.visible = visible;
        this.alpha = (d.opacity !== undefined ? d.opacity : 1) * motion.alphaMul * dim;

        this.refreshAppearance();
        if (this._shimmerFilter) {
            this._shimmerFilter.uniforms.time = DocsDoodads.frameCount() / 60;
        }
        this.updateShadow();
    };

    // Rebuilds the filter stack only when tint, hue, blur, blend or shimmer settings change.
    Sprite_DocsDoodad.prototype.refreshAppearance = function() {
        const d = this._data;
        const sig = DocsDoodads.Appearance.signature(d);
        if (sig === this._appearanceSig) return;
        this._appearanceSig = sig;
        this.blendMode = DocsDoodads.Appearance.blendMode(d);
        const filters = [];
        try {
            if (DocsDoodads.Appearance.needsColorFilter(d)) {
                const tone = [Number(d.r) || 0, Number(d.g) || 0, Number(d.b) || 0, Number(d.grey) || 0];
                if (typeof ColorFilter !== 'undefined') {
                    const filter = new ColorFilter();
                    filter.setColorTone(tone);
                    filter.setHue(Number(d.hue) || 0);
                    filters.push(filter);
                } else if (typeof ToneFilter !== 'undefined') {
                    const filter = new ToneFilter();
                    filter.adjustHue(Number(d.hue) || 0);
                    filter.adjustTone(tone[0], tone[1], tone[2]);
                    filter.adjustSaturation(-tone[3]);
                    filters.push(filter);
                }
            }
            if (Number(d.blur) > 0 && PIXI.filters && PIXI.filters.BlurFilter) {
                filters.push(new PIXI.filters.BlurFilter(Math.min(20, Number(d.blur))));
            }
            if ((Number(d.contrast) > 0 || d.sepia || d.bright) && PIXI.filters && PIXI.filters.ColorMatrixFilter) {
                const matrix = new PIXI.filters.ColorMatrixFilter();
                let multiply = false;
                if (Number(d.contrast) > 0) { matrix.contrast(Number(d.contrast) * 0.01, multiply); multiply = true; }
                if (d.sepia) { matrix.sepia(multiply); multiply = true; }
                if (d.bright) { matrix.brightness(1.6, multiply); multiply = true; }
                filters.push(matrix);
            }
            this._shimmerFilter = null;
            if (d.motion && d.motion.type === 'shimmer' && PIXI.Filter) {
                const motion = DocsDoodads.Motion.normalize(d.motion);
                const shimmer = new PIXI.Filter(undefined, DocsDoodads.Motion.shimmerFragment, { time: 0, amount: motion.amount });
                shimmer.padding = 4;
                this._shimmerFilter = shimmer;
                filters.push(shimmer);
            }
        } catch (error) {
            DocsDoodads.Core.log('Doodad filters could not be built; drawing without them.', error);
        }
        this.filters = filters.length > 0 ? filters : null;
    };

    // The shadow is a black silhouette sprite beside the doodad in the same tilemap.
    Sprite_DocsDoodad.prototype.updateShadow = function() {
        const t = DocsDoodads.Shadow.transform(this._data);
        if (!t) {
            this.destroyShadow();
            return;
        }
        if (!this.parent) return;
        let shadow = this._shadowSprite;
        if (!shadow) {
            shadow = this._shadowSprite = new PIXI.Sprite(this.texture);
            shadow.tint = 0x000000;
            shadow.spriteId = this.spriteId;
            this.parent.addChild(shadow);
        }
        if (shadow.parent !== this.parent) this.parent.addChild(shadow);
        shadow.texture = this.texture;
        shadow.anchor.x = this.anchor.x;
        shadow.anchor.y = this.anchor.y;
        const pos = this.screenPosition();
        shadow.x = pos.x + t.offsetX;
        shadow.y = pos.y + t.offsetY;
        shadow.scale.x = t.scaleX;
        shadow.scale.y = t.scaleY;
        shadow.skew.x = t.skewX + this.skew.x;
        shadow.alpha = t.alpha;
        shadow.z = DocsDoodads.Depth.shadowZ;
        shadow._docsSortY = shadow.y;
        shadow.visible = this.visible;
        if (shadow._docsBlur !== t.blur) {
            shadow._docsBlur = t.blur;
            shadow.filters = t.blur > 0 && PIXI.filters && PIXI.filters.BlurFilter ? [new PIXI.filters.BlurFilter(Math.min(16, t.blur))] : null;
        }
    };

    Sprite_DocsDoodad.prototype.destroyShadow = function() {
        if (!this._shadowSprite) return;
        if (this._shadowSprite.parent) this._shadowSprite.parent.removeChild(this._shadowSprite);
        this._shadowSprite.destroy();
        this._shadowSprite = null;
    };

    Sprite_DocsDoodad.prototype.updateFrameAnimation = function() {
        if (!this._bmp || !this._bmp._baseTexture) return;
        const total = (this._data.xFrame || 1) * (this._data.yFrame || 1);
        this._currentFrame = (this._currentFrame + 1) % total;
        const xF = this._data.xFrame || 1;
        const col = this._currentFrame % xF;
        const row = Math.floor(this._currentFrame / xF);
        const fw = this._data.frameW || 32;
        const fh = this._data.frameH || 32;
        const startX = this._data.frameX || 0;
        const startY = this._data.frameY || 0;
        this.texture.frame = new PIXI.Rectangle(startX + col * fw, startY + row * fh, fw, fh);
    };
}

//==========================================================
// SECTION 7: SPRITESET_MAP DOODAD LAYER HOOKS
//==========================================================
// Doodads with a base line need the tilemap's z/y sort; plain sprites keep MZ's default order.
if (typeof Tilemap !== 'undefined' && Tilemap.prototype._compareChildOrder) {
    $.Tilemap__compareChildOrder = Tilemap.prototype._compareChildOrder;
    Tilemap.prototype._compareChildOrder = function(a, b) {
        if (a._docsSortY === undefined && b._docsSortY === undefined) return $.Tilemap__compareChildOrder.call(this, a, b);
        return DocsDoodads.Depth.compareChildren(a, b);
    };
}

if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        $.Spriteset_Map_createLowerLayer.call(this);
        this.createDocsDoodadsLayer();
        this.createDocsLighting();
    };

    Spriteset_Map.prototype.createDocsDoodadsLayer = function() {
        this._docsDoodadSprites = [];
        // Sprites go into the tilemap with the characters; a plain container is the fallback.
        if (this._tilemap && typeof this._tilemap.addChild === 'function') {
            this._docsDoodadsContainer = this._tilemap;
        } else {
            this._docsDoodadsContainer = new PIXI.Container();
            this._baseSprite.addChild(this._docsDoodadsContainer);
        }
        this.addDocsDoodads();
    };

    Spriteset_Map.prototype.removeDocsDoodadSprites = function() {
        for (const sprite of this._docsDoodadSprites || []) {
            sprite.destroyShadow();
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        }
        this._docsDoodadSprites = [];
    };

    Spriteset_Map.prototype.addDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        this.removeDocsDoodadSprites();
        const list = DocsDoodads.doodads();
        for (const data of list) {
            if (!data) continue;
            const spr = new Sprite_DocsDoodad(data, this);
            this._docsDoodadsContainer.addChild(spr);
            this._docsDoodadSprites.push(spr);
        }
        this.sortDocsDoodads();
    };

    Spriteset_Map.prototype.sortDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        for (const sprite of this._docsDoodadSprites || []) sprite.updatePlacement();
        // The tilemap re-sorts itself every frame; the fallback container needs an explicit sort.
        if (this._docsDoodadsContainer !== this._tilemap) {
            this._docsDoodadsContainer.children.sort(DocsDoodads.Depth.compareChildren);
        }
    };

    $.Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update.call(this);
        if (this._docsDoodadSprites) {
            for (let i = 0; i < this._docsDoodadSprites.length; i++) {
                this._docsDoodadSprites[i].update();
            }
        }
        this.updateDocsLighting();
        this.updateDocsEditorOverlay();
    };

    // Lighting: a lightmap (ambient colour plus additive lights) is rendered off-screen and
    // multiplied over the tilemap, under weather and pictures. Glows add a halo in daylight too.
    Spriteset_Map.prototype.createDocsLighting = function() {
        if (typeof PIXI === 'undefined' || !PIXI.RenderTexture || !this._baseSprite) return;
        this._docsLightScene = new PIXI.Container();
        this._docsLightBase = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._docsLightScene.addChild(this._docsLightBase);
        this._docsLightSprites = [];
        this._docsGlowLayer = new PIXI.Container();
        this._docsGlowSprites = [];
        this._docsLightOverlay = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this._docsLightOverlay.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this._docsLightOverlay.visible = false;
        this._baseSprite.addChild(this._docsLightOverlay);
        this._baseSprite.addChild(this._docsGlowLayer);
    };

    Spriteset_Map.prototype.docsLightTexture = function() {
        if (!DocsDoodads._lightGradient && typeof document !== 'undefined') {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            DocsDoodads._lightGradient = PIXI.Texture.from(canvas);
        }
        return DocsDoodads._lightGradient;
    };

    Spriteset_Map.prototype.docsSpritePool = function(pool, layer, count) {
        while (pool.length < count) {
            const sprite = new PIXI.Sprite(this.docsLightTexture());
            sprite.anchor.set(0.5, 0.5);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(sprite);
            pool.push(sprite);
        }
        for (let i = 0; i < pool.length; i++) pool[i].visible = i < count;
    };

    Spriteset_Map.prototype.updateDocsLighting = function() {
        if (!this._docsLightOverlay || typeof $gameMap === 'undefined' || !$gameMap) return;
        const Lighting = DocsDoodads.Lighting;
        const workspace = DocsDoodads.Workspace;
        const fade = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsAmbientFade : null;
        if (fade) {
            Lighting.stepFade(fade);
            if (fade.framesLeft <= 0 && fade.clearWhenDone) $gameSystem._docsAmbientFade = null;
        }
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        let ambient = Lighting.ambientFor(Lighting.mapSettings($gameMap.mapId()), fade ? fade.current : null, switchValue);
        if (workspace.mounted && workspace.lightingPreview === false) ambient = { darkness: 0, color: '#000000' };

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const visibleData = (this._docsDoodadSprites || []).filter(s => s.visible).map(s => s._data);
        const lights = Lighting.collect(visibleData, { x: $gameMap.displayX() * tw, y: $gameMap.displayY() * th });
        const time = DocsDoodads.frameCount() / 60;

        const glowing = lights.filter(l => l.glow > 0);
        this.docsSpritePool(this._docsGlowSprites, this._docsGlowLayer, glowing.length);
        glowing.forEach((l, i) => {
            const s = this._docsGlowSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.glow * l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });

        const renderer = DocsDoodads.Compat.getRenderer();
        if (ambient.darkness <= 0.001 || !renderer) {
            this._docsLightOverlay.visible = false;
            return;
        }
        const w = typeof Graphics !== 'undefined' ? Graphics.width : 816;
        const h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        if (!this._docsLightTexture || this._docsLightTexture.width !== w || this._docsLightTexture.height !== h) {
            if (this._docsLightTexture) this._docsLightTexture.destroy(true);
            this._docsLightTexture = PIXI.RenderTexture.create({ width: w, height: h });
            this._docsLightOverlay.texture = this._docsLightTexture;
        }
        const base = Lighting.lightmapBase(ambient);
        this._docsLightBase.width = w;
        this._docsLightBase.height = h;
        this._docsLightBase.tint = (Math.round(base[0] * 255) << 16) | (Math.round(base[1] * 255) << 8) | Math.round(base[2] * 255);
        this.docsSpritePool(this._docsLightSprites, this._docsLightScene, lights.length);
        lights.forEach((l, i) => {
            const s = this._docsLightSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });
        renderer.render(this._docsLightScene, this._docsLightTexture, true);
        this._docsLightOverlay.visible = true;
        // Keep the lightmap directly above the tilemap and doodads after layers are rebuilt.
        const parent = this._docsLightOverlay.parent;
        if (parent && this._tilemap && parent.children.indexOf(this._docsLightOverlay) < parent.children.indexOf(this._tilemap)) {
            parent.addChild(this._docsLightOverlay);
            parent.addChild(this._docsGlowLayer);
        }
    };

    // Editor-only overlay above the doodad layer: placement grid, selection outlines and guides.
    Spriteset_Map.prototype.updateDocsEditorOverlay = function() {
        if (!this._docsDoodadsContainer || typeof PIXI === 'undefined' || !PIXI.Graphics) return;
        if (!this._docsSelectionOutline) {
            this._docsSelectionOutline = new PIXI.Graphics();
            this._baseSprite.addChild(this._docsSelectionOutline);
        }
        const outline = this._docsSelectionOutline;
        outline.clear();
        if (!DocsDoodads.Workspace.mounted) return;
        // Keep the outline above the doodad layer even after the layer is rebuilt.
        if (outline.parent && outline.parent.children[outline.parent.children.length - 1] !== outline) {
            outline.parent.addChild(outline);
        }
        const workspace = DocsDoodads.Workspace;
        if (workspace.gridSnapShow) {
            const width = typeof Graphics !== 'undefined' ? Graphics.width : 816;
            const height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            const grid = workspace.placementGridLines(width, height);
            outline.lineStyle(1, 0xffffff, 0.25);
            for (const x of grid.xs) { outline.moveTo(x, 0); outline.lineTo(x, height); }
            for (const y of grid.ys) { outline.moveTo(0, y); outline.lineTo(width, y); }
        }
        for (const rect of workspace.selectionScreenRects()) {
            outline.lineStyle(2, 0x38bdf8, 1);
            outline.drawRect(rect.x, rect.y, rect.w, rect.h);
        }
        if (typeof workspace.drawEditorOverlayExtras === 'function') workspace.drawEditorOverlayExtras(outline);
    };
}

// "Set Ambient Light" / "Reset Ambient Light" plugin commands fade the map's darkness.
DocsDoodads.setAmbient = function(target, frames, clearWhenDone) {
    if (typeof $gameSystem === 'undefined' || !$gameSystem || typeof $gameMap === 'undefined' || !$gameMap) return null;
    const Lighting = DocsDoodads.Lighting;
    const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
    const current = $gameSystem._docsAmbientFade ? $gameSystem._docsAmbientFade.current
        : Lighting.ambientFor(Lighting.mapSettings($gameMap.mapId()), null, switchValue);
    const fade = Lighting.startFade(current, target, frames);
    fade.clearWhenDone = Boolean(clearWhenDone);
    $gameSystem._docsAmbientFade = fade;
    return fade;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setAmbient', args => {
        DocsDoodads.setAmbient({
            darkness: Math.max(0, Math.min(100, Number(args.darkness) || 0)) / 100,
            color: args.color || DocsDoodads.Lighting.ambientDefaults.color
        }, Number(args.duration) || 0, false);
    });
    PluginManager.registerCommand(pluginName, 'resetAmbient', args => {
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        const mapAmbient = DocsDoodads.Lighting.ambientFor(DocsDoodads.Lighting.mapSettings($gameMap.mapId()), null, switchValue);
        DocsDoodads.setAmbient(mapAmbient, Number(args.duration) || 0, true);
    });
}

//==========================================================
// SECTION 8: DocsDoodads.CORE & DIAGNOSTICS
//==========================================================
DocsDoodads.Core = {
    version: pluginVersion,
    events: {},

    on(event, handler) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(handler);
    },

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(fn => fn(data));
        }
    },

    log() {
        if (devDiagnostics) {
            console.log("[DocsDoodads]", ...arguments);
        }
    }
};

//==========================================================
// SECTION 9: DocsDoodads.COMPAT (MZ & MV ABSTRACTION)
//==========================================================
DocsDoodads.Compat = {
    isMZ() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MZ";
    },
    isMV() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MV";
    },
    isNwjs() {
        return typeof Utils !== 'undefined' && typeof Utils.isNwjs === 'function' ? Utils.isNwjs() : (typeof require !== 'undefined');
    },
    isTest() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' ? Utils.isOptionValid("test") : true;
    },
    tileSize() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth) {
            return $gameMap.tileWidth();
        }
        return 48;
    },
    createRectangle(x, y, w, h) {
        if (typeof Rectangle !== 'undefined') {
            return new Rectangle(x, y, w, h);
        }
        return { x: x, y: y, width: w, height: h };
    },
    createWindow(WindowClass, x, y, w, h) {
        if (this.isMZ()) {
            return new WindowClass(this.createRectangle(x, y, w, h));
        } else {
            return new WindowClass(x, y, w, h);
        }
    },
    getCanvas() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.view) return Graphics.app.view;
            if (Graphics._canvas) return Graphics._canvas;
        }
        if (typeof document !== 'undefined') {
            return document.getElementById('GameCanvas') || document.querySelector('canvas');
        }
        return null;
    },
    getStage() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.stage) return Graphics.app.stage;
            if (Graphics._stage) return Graphics._stage;
        }
        return null;
    },
    getRenderer() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.renderer) return Graphics.app.renderer;
            if (Graphics._renderer) return Graphics._renderer;
        }
        return null;
    },
    boxWidth() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxWidth || Graphics.width || 816;
        }
        return 816;
    },
    boxHeight() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxHeight || Graphics.height || 624;
        }
        return 624;
    },
    loadBitmap(folder, filename, hue = 0, smooth = true) {
        if (typeof ImageManager === 'undefined') return null;
        if (this.isMZ()) {
            return ImageManager.loadBitmap(folder, filename);
        }
        return ImageManager.loadBitmap(folder, filename, hue, smooth);
    },
    featureMatrix: {
        assetDrawer: { mz: true, mv: true, browser: "Read-only" },
        autoSlicer: { mz: true, mv: true, browser: true },
        slicerModal: { mz: true, mv: true, browser: true },
        realEvents: { mz: true, mv: true, browser: false },
        collisionSAT: { mz: true, mv: true, browser: true },
        audioPreview: { mz: true, mv: true, browser: true },
        explorerImport: { mz: true, mv: true, browser: false }
    }
};

//==========================================================
// SECTION 10: DocsDoodads.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
DocsDoodads.FS = {
    fs: (typeof require !== 'undefined') ? require('fs') : null,
    path: (typeof require !== 'undefined') ? require('path') : null,

    existsSync(filePath) {
        return this.fs && this.fs.existsSync(filePath);
    },

    readFileSync(filePath, encoding = 'utf8') {
        return this.fs ? this.fs.readFileSync(filePath, encoding) : null;
    },

    writeFileSync(filePath, data, encoding = 'utf8') {
        if (!this.fs) return;
        this.fs.writeFileSync(filePath, data, encoding);
    },

    atomicWriteJson(filePath, data, indent = 2) {
        if (!this.fs || !this.path) return false;
        const dir = this.path.dirname(filePath);
        if (!this.existsSync(dir)) {
            this.mkdirp(dir);
        }
        const tmpPath = filePath + '.tmp';
        const jsonStr = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data);
        try {
            JSON.parse(jsonStr);
        } catch(e) {
            console.error("[DocsDoodads.FS] Validation failed for atomic JSON write:", e);
            return false;
        }
        try {
            this.fs.writeFileSync(tmpPath, jsonStr, 'utf8');
            this.fs.renameSync(tmpPath, filePath);
            return true;
        } catch(e) {
            // e.g. a read-only target: keep the original file and do not leave the temp copy behind.
            console.error(`[DocsDoodads.FS] Could not write ${filePath}:`, e);
            try { if (this.existsSync(tmpPath)) this.fs.unlinkSync(tmpPath); } catch(cleanupError) {}
            return false;
        }
    },

    createTimestampedBackup(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path || !this.existsSync(filePath)) return null;
        const cacheDir = backupDirectory;
        if (!this.existsSync(cacheDir)) {
            this.mkdirp(cacheDir);
        }
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const baseName = this.path.basename(filePath);
        let backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.bak`);
        let suffix = 0;
        while (this.existsSync(backupPath)) {
            suffix++;
            backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.${suffix}.bak`);
        }
        this.fs.copyFileSync(filePath, backupPath);
        this.pruneBackups(cacheDir, baseName, backupRetentionCount);
        return backupPath;
    },

    pruneBackups(dir, prefix, maxCount) {
        if (!this.fs || !this.path || !this.existsSync(dir)) return;
        const files = this.fs.readdirSync(dir)
            .filter(f => f.startsWith(prefix) && f.endsWith('.bak'))
            .map(f => ({ name: f, time: this.fs.statSync(this.path.join(dir, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time);
        while (files.length > maxCount) {
            const toRemove = files.pop();
            try { this.fs.unlinkSync(this.path.join(dir, toRemove.name)); } catch(e) {}
        }
    },

    findLatestBackup(filePath) {
        if (!this.fs || !this.path) return null;
        const baseName = this.path.basename(filePath);
        const backups = [];
        for (const cacheDir of ['data/docs_doodads_cache/backups', DocsDoodads.Legacy.backupDirectory]) {
            if (!this.existsSync(cacheDir)) continue;
            for (const f of this.fs.readdirSync(cacheDir)) {
                if (f.startsWith(baseName) && f.endsWith('.bak')) {
                    backups.push({ path: this.path.join(cacheDir, f), time: this.fs.statSync(this.path.join(cacheDir, f)).mtimeMs });
                }
            }
        }
        backups.sort((a, b) => b.time - a.time);
        return backups.length > 0 ? backups[0].path : null;
    },

    listBackups(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path) return [];
        const baseName = this.path.basename(filePath);
        const directories = [backupDirectory];
        if (backupDirectory === 'data/docs_doodads_cache/backups') directories.push(DocsDoodads.Legacy.backupDirectory);
        const backups = [];
        for (const directory of directories) {
            if (!this.existsSync(directory)) continue;
            for (const fileName of this.fs.readdirSync(directory)) {
                if (!fileName.startsWith(baseName + '.') || !fileName.endsWith('.bak')) continue;
                const backupPath = this.path.join(directory, fileName);
                const stat = this.fs.statSync(backupPath);
                backups.push({ path: backupPath, name: fileName, mtimeMs: stat.mtimeMs, size: stat.size });
            }
        }
        return backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
    },

    atomicWriteManyJson(entries, options = {}) {
        const result = { ok: false, committed: [], error: null, rolledBack: false };
        if (!this.fs || !this.path || !Array.isArray(entries) || entries.length === 0) {
            result.error = 'No writable JSON entries were supplied.';
            return result;
        }

        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const prepared = [];
        const seenTargets = new Set();
        const rollbackRecords = [];
        try {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                if (!entry || !entry.path) throw new Error(`Entry ${index} has no target path.`);
                const targetPath = this.path.resolve(entry.path);
                const targetKey = typeof process !== 'undefined' && process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
                if (seenTargets.has(targetKey)) throw new Error(`Duplicate transaction target: ${entry.path}`);
                seenTargets.add(targetKey);

                const indent = entry.indent === undefined ? 2 : entry.indent;
                const json = indent ? JSON.stringify(entry.data, null, indent) : JSON.stringify(entry.data);
                JSON.parse(json);
                this.ensureDir(this.path.dirname(targetPath));
                const temporary = `${targetPath}.ddtxn-${transactionId}-${index}.tmp`;
                this.fs.writeFileSync(temporary, json, 'utf8');
                prepared.push({ targetPath, temporary, existed: this.existsSync(targetPath), rollback: null });
            }

            for (let index = 0; index < prepared.length; index++) {
                const item = prepared[index];
                if (item.existed) {
                    item.rollback = `${item.targetPath}.ddtxn-${transactionId}-${index}.rollback`;
                    this.fs.copyFileSync(item.targetPath, item.rollback);
                }
                if (typeof options.beforeCommit === 'function') options.beforeCommit(index, entries[index]);
                this.fs.renameSync(item.temporary, item.targetPath);
                // Only files that were actually replaced need restoring if a later file fails.
                rollbackRecords.push(item);
                result.committed.push(item.targetPath);
            }

            for (const item of rollbackRecords) {
                if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            for (let index = rollbackRecords.length - 1; index >= 0; index--) {
                const item = rollbackRecords[index];
                try {
                    if (item.existed && item.rollback && this.existsSync(item.rollback)) {
                        this.fs.copyFileSync(item.rollback, item.targetPath);
                    } else if (!item.existed && this.existsSync(item.targetPath)) {
                        this.fs.unlinkSync(item.targetPath);
                    }
                } catch (rollbackError) {
                    result.error += `; rollback failed for ${item.targetPath}: ${rollbackError.message || rollbackError}`;
                }
            }
            for (const item of prepared) {
                try { if (this.existsSync(item.temporary)) this.fs.unlinkSync(item.temporary); } catch (cleanupError) {}
                try { if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback); } catch (cleanupError) {}
            }
            result.committed = [];
            result.rolledBack = rollbackRecords.length > 0;
            return result;
        }
    },

    restoreBackup(filePath, backupPath, options = {}) {
        const result = { ok: false, restoredFrom: null, safetyBackup: null, error: null };
        if (!this.fs || !this.path) {
            result.error = 'Filesystem access is unavailable.';
            return result;
        }
        try {
            const backupDirectory = this.path.resolve(options.backupDir || 'data/docs_doodads_cache/backups');
            // listBackups also offers backups made by QJ-Doodads builds, so those must be restorable too.
            const allowedDirectories = [backupDirectory];
            if (!options.backupDir) allowedDirectories.push(this.path.resolve(DocsDoodads.Legacy.backupDirectory));
            const resolvedBackup = this.path.resolve(backupPath);
            const resolvedTarget = this.path.resolve(filePath);
            const expectedPrefix = this.path.basename(resolvedTarget) + '.';
            if (!allowedDirectories.includes(this.path.dirname(resolvedBackup)) ||
                !this.path.basename(resolvedBackup).startsWith(expectedPrefix) ||
                !resolvedBackup.endsWith('.bak')) {
                throw new Error('Selected backup does not belong to the target file.');
            }
            if (!this.existsSync(resolvedBackup)) throw new Error('Selected backup no longer exists.');

            const restoredData = JSON.parse(this.readFileSync(resolvedBackup, 'utf8'));
            result.safetyBackup = this.createTimestampedBackup(resolvedTarget, backupDirectory);
            const writeResult = this.atomicWriteManyJson([{ path: resolvedTarget, data: restoredData, indent: 2 }]);
            if (!writeResult.ok) throw new Error(writeResult.error || 'Restore write failed.');
            result.ok = true;
            result.restoredFrom = resolvedBackup;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            return result;
        }
    },

    ensureDir(dirPath) {
        return this.mkdirp(dirPath);
    },

    mkdirp(dirPath) {
        if (!this.fs || !this.path) return;
        if (this.fs.existsSync(dirPath)) return;
        const parent = this.path.dirname(dirPath);
        if (!this.fs.existsSync(parent)) this.mkdirp(parent);
        this.fs.mkdirSync(dirPath);
    },

    readJson(filePath) {
        try {
            if (!this.existsSync(filePath)) {
                const legacyPath = DocsDoodads.Legacy.pathFor(filePath);
                if (!legacyPath || !this.existsSync(legacyPath)) return null;
                filePath = legacyPath;
            }
            return JSON.parse(this.readFileSync(filePath, 'utf8'));
        } catch(e) {
            console.warn(`[DocsDoodads.FS] Corrupt JSON encountered reading ${filePath}:`, e);
            const fallback = this.findLatestBackup(filePath);
            if (fallback) {
                try {
                    const recovered = JSON.parse(this.readFileSync(fallback, 'utf8'));
                    console.warn(`[DocsDoodads.FS] Automatically recovered ${filePath} from backup ${fallback}`);
                    this.recoveryNotices.push(`${filePath} was unreadable; loaded backup ${this.path.basename(fallback)}. Save to repair it.`);
                    return recovered;
                } catch(e2) {}
            }
            this.recoveryNotices.push(`${filePath} was unreadable and no backup exists; defaults were used.`);
            return null;
        }
    },

    // Unreadable-file fallbacks waiting to be shown to the user.
    recoveryNotices: [],

    takeRecoveryNotices() {
        const notices = this.recoveryNotices.slice();
        this.recoveryNotices.length = 0;
        return notices;
    },

    stat(filePath) {
        if (!this.fs || !this.existsSync(filePath)) return null;
        const s = this.fs.statSync(filePath);
        return { size: s.size, mtimeMs: s.mtimeMs };
    }
};

//==========================================================
// SECTION 11: DocsDoodads.ASSETINDEX & METADATA CACHE
//==========================================================
DocsDoodads.AssetIndex = {
    libraryPath: 'data/DocsDoodadsLibrary.json',
    supportedExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp', '.ogg', '.m4a', '.wav']),
    roots: [
        'img/characters', 'img/doodads', 'img/tilesets', 'img/pictures',
        'img/animations', 'img/battlebacks1', 'img/battlebacks2', 'img/enemies',
        'img/faces', 'img/parallaxes', 'img/sv_actors', 'img/sv_enemies',
        'img/system', 'img/titles1', 'img/titles2',
        'audio/bgm', 'audio/bgs', 'audio/me', 'audio/se'
    ],
    data: {
        version: 1,
        projectId: "docs_doodads_project",
        generatedAt: 0,
        assets: {},
        collections: {},
        settings: {}
    },
    list: [],
    // Bump when indexFile derives new fields so unchanged files are re-indexed once.
    entryRevision: 4,

    init() {
        const loaded = DocsDoodads.FS.readJson(this.libraryPath);
        if (loaded && loaded.version === 1) {
            this.data = loaded;
        }
        this.rebuildList();
    },

    rebuildList() {
        this.list = Object.values(this.data.assets);
    },

    isEntryCurrent(existing, stat) {
        return Boolean(existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size &&
            existing.entryRevision === this.entryRevision);
    },

    // Reads width/height from the PNG IHDR chunk without decoding the image.
    readImageSize(fullPath) {
        const fs = DocsDoodads.FS.fs;
        let fd = null;
        try {
            fd = fs.openSync(fullPath, 'r');
            const header = Buffer.alloc(24);
            if (fs.readSync(fd, header, 0, 24, 0) < 24) return null;
            const isPng = header.readUInt32BE(0) === 0x89504e47 && header.toString('ascii', 12, 16) === 'IHDR';
            if (!isPng) return null;
            return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
        } catch (error) {
            return null;
        } finally {
            if (fd !== null) {
                try { fs.closeSync(fd); } catch (error) {}
            }
        }
    },

    isSupportedAssetFile(filePath) {
        if (!DocsDoodads.FS.path) return false;
        return this.supportedExtensions.has(DocsDoodads.FS.path.extname(filePath).toLowerCase());
    },

    scan() {
        if (!DocsDoodads.FS.fs) return;
        this.init();
        for (const r of this.roots) {
            this.scanDirectory(r);
        }
        this.save();
        this.rebuildList();
    },

    async scanAsync(options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const result = { cancelled: false, discovered: 0, indexed: 0, unchanged: 0, removed: 0, errors: [] };
        if (!fs || !path || !fs.promises) {
            result.errors.push('Filesystem access is unavailable.');
            return result;
        }
        if (options.loadCache !== false) this.init();

        const projectRoot = path.resolve(options.projectRoot || '.');
        const roots = (options.roots || this.roots)
            .map(root => String(root).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, ''));
        const batchSize = Math.max(1, options.batchSize || 100);
        const cancellationToken = options.cancellationToken || null;
        const isCancelled = () => Boolean(cancellationToken && (cancellationToken.cancelled || cancellationToken.isCancelled));
        const files = [];
        const directories = roots.map(root => ({ absolute: path.resolve(projectRoot, root), relative: root }));

        while (directories.length > 0) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const directory = directories.pop();
            try {
                const entries = await fs.promises.readdir(directory.absolute, { withFileTypes: true });
                entries.sort((a, b) => a.name.localeCompare(b.name));
                for (const entry of entries) {
                    const absolute = path.join(directory.absolute, entry.name);
                    const relative = `${directory.relative}/${entry.name}`.replace(/\\/g, '/');
                    if (entry.isDirectory()) directories.push({ absolute, relative });
                    else if (entry.isFile() && this.isSupportedAssetFile(entry.name)) files.push({ absolute, relative });
                }
            } catch (error) {
                if (!error || error.code !== 'ENOENT') result.errors.push(`${directory.relative}: ${error.message || error}`);
            }
            if (directories.length % batchSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }

        files.sort((a, b) => a.relative.localeCompare(b.relative));
        result.discovered = files.length;
        const seen = new Set();
        for (let index = 0; index < files.length; index++) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const file = files[index];
            const assetPath = file.relative.replace(/\\/g, '/');
            const assetId = assetPath.toLowerCase();
            seen.add(assetId);
            try {
                const stat = await fs.promises.stat(file.absolute);
                const existing = this.data.assets[assetId];
                if (this.isEntryCurrent(existing, stat)) {
                    result.unchanged++;
                } else {
                    this.indexFile(file.absolute, path.basename(file.absolute), path.extname(file.absolute).toLowerCase(), assetPath, stat);
                    result.indexed++;
                }
            } catch (error) {
                result.errors.push(`${assetPath}: ${error.message || error}`);
            }
            if ((index + 1) % batchSize === 0 || index === files.length - 1) {
                if (typeof options.onProgress === 'function') {
                    options.onProgress({ completed: index + 1, total: files.length, path: assetPath });
                }
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        const rootPrefixes = roots.map(root => root.toLowerCase() + '/');
        for (const [assetId, asset] of Object.entries(this.data.assets)) {
            const normalizedPath = String(asset.path || assetId).replace(/\\/g, '/').toLowerCase();
            const inScannedRoot = rootPrefixes.some(prefix => normalizedPath.startsWith(prefix));
            if (inScannedRoot && !seen.has(assetId.toLowerCase())) {
                delete this.data.assets[assetId];
                result.removed++;
                for (const collection of Object.values(this.data.collections || {})) {
                    if (Array.isArray(collection)) {
                        const collectionIndex = collection.indexOf(assetId);
                        if (collectionIndex >= 0) collection.splice(collectionIndex, 1);
                    }
                }
            }
        }

        this.data.generatedAt = Date.now();
        this.rebuildList();
        if (options.save !== false) {
            const target = options.projectRoot
                ? path.join(projectRoot, options.libraryPath || this.libraryPath)
                : (options.libraryPath || this.libraryPath);
            DocsDoodads.FS.atomicWriteJson(target, this.data);
        }
        return result;
    },

    scanDirectory(dirPath) {
        const fs = DocsDoodads.FS.fs, path = DocsDoodads.FS.path;
        if (!fs || !fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const ent of entries) {
            const fullPath = path.join(dirPath, ent.name).replace(/\\/g, '/');
            if (ent.isDirectory()) {
                this.scanDirectory(fullPath);
            } else if (ent.isFile()) {
                const ext = path.extname(ent.name).toLowerCase();
                if (this.isSupportedAssetFile(ent.name)) {
                    this.indexFile(fullPath, ent.name, ext);
                }
            }
        }
    },

    indexFile(fullPath, fileName, ext, assetPath = fullPath, knownStat = null) {
        const fs = DocsDoodads.FS.fs;
        const stat = knownStat || fs.statSync(fullPath);
        const normalizedAssetPath = String(assetPath).replace(/\\/g, '/');
        const assetId = normalizedAssetPath.toLowerCase();

        let existing = this.data.assets[assetId];
        if (this.isEntryCurrent(existing, stat)) {
            return;
        }

        const category = this.detectCategory(normalizedAssetPath);
        const autoTags = this.generateAutoTags(normalizedAssetPath, fileName);
        const assetType = this.detectAssetType(normalizedAssetPath, fileName, ext);

        const newEntry = {
            id: assetId,
            path: normalizedAssetPath,
            type: assetType,
            category: category,
            fileName: fileName,
            extension: ext,
            mtimeMs: stat.mtimeMs,
            sizeBytes: stat.size,
            entryRevision: this.entryRevision,
            width: 0,
            height: 0,
            tags: existing ? existing.tags : [],
            autoTags: autoTags,
            favorite: existing ? existing.favorite : false,
            collections: existing ? existing.collections : [],
            slice: existing && existing.slice ? existing.slice : {
                status: "none",
                method: "none",
                confidence: 1.0,
                regions: []
            },
            placement: existing && existing.placement ? existing.placement : {
                defaultMode: assetType === 'character_sheet' ? 'event' : 'doodad'
            },
            collision: existing && existing.collision ? existing.collision : {
                preset: "none",
                shape: null
            },
            usage: existing && existing.usage ? existing.usage : { lastUsedAt: 0, useCount: 0 }
        };

        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            const size = this.readImageSize(fullPath);
            if (size) {
                newEntry.width = size.width;
                newEntry.height = size.height;
            }
            // Hand-edited slices are the user's work; detection only fills in slices that are not manual.
            const isManual = Boolean(existing && existing.slice && existing.slice.status === 'manual');
            if (!isManual) {
                const metadata = DocsDoodads.Slicing.Metadata.parse(fullPath);
                const known = metadata ? null : DocsDoodads.Slicing.Known.detect(newEntry);
                if (metadata) {
                    newEntry.slice = metadata;
                } else if (known) {
                    newEntry.slice = known;
                    newEntry.width = known.width;
                    newEntry.height = known.height;
                }
            }
        }

        this.data.assets[assetId] = newEntry;
    },

    detectCategory(filePath) {
        const lower = filePath.toLowerCase();
        if (lower.includes('img/characters')) return 'Characters';
        if (lower.includes('img/doodads')) return 'Doodads';
        if (lower.includes('img/tilesets')) return 'Tilesets';
        if (lower.includes('img/pictures')) return 'Pictures';
        if (lower.includes('img/faces')) return 'Faces';
        if (/img\/(enemies|sv_enemies|sv_actors)\//.test(lower)) return 'Battlers';
        if (/img\/(battlebacks1|battlebacks2|parallaxes|titles1|titles2)\//.test(lower)) return 'Backgrounds';
        if (lower.includes('img/system')) return 'System';
        if (lower.includes('audio/')) return 'Audio';
        return 'Other';
    },

    generateAutoTags(filePath, fileName) {
        const parts = filePath.toLowerCase().replace(/\\/g, '/').split('/');
        const tags = new Set();
        for (const p of parts) {
            if (!['img', 'audio', fileName.toLowerCase()].includes(p)) {
                tags.add(p);
            }
        }
        const nameParts = fileName.replace(/\.[^/.]+$/, "").split(/[ _-]+/);
        for (const np of nameParts) {
            if (np.length > 1) tags.add(np.toLowerCase());
        }
        return Array.from(tags);
    },

    detectAssetType(filePath, fileName, ext) {
        if (['.ogg', '.m4a', '.wav'].includes(ext)) return 'audio';
        if (filePath.includes('img/characters')) {
            return fileName.startsWith('$') ? 'single_character' : 'character_sheet';
        }
        if (filePath.includes('img/tilesets')) return 'tileset';
        if (filePath.includes('img/faces')) return 'faceset';
        return 'doodad';
    },

    save() {
        DocsDoodads.FS.atomicWriteJson(this.libraryPath, this.data);
    },

    // Accepts "a, b ,a" style input; stores lowercase, trimmed, de-duplicated tags.
    setTags(assetId, input) {
        const asset = this.data.assets[assetId];
        if (!asset) return;
        const raw = Array.isArray(input) ? input : String(input || '').split(',');
        asset.tags = [...new Set(raw.map(t => String(t).trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean))];
        this.save();
    },

    toggleFavorite(assetId) {
        if (this.data.assets[assetId]) {
            this.data.assets[assetId].favorite = !this.data.assets[assetId].favorite;
            this.save();
        }
    },

    recordUsage(assetId) {
        if (this.data.assets[assetId]) {
            const u = this.data.assets[assetId].usage;
            u.useCount = (u.useCount || 0) + 1;
            u.lastUsedAt = Date.now();
            this.save();
        }
    },

    createCollection(name) {
        this.data.collections = this.data.collections || {};
        if (!this.data.collections[name]) {
            this.data.collections[name] = [];
            this.save();
        }
    },

    deleteCollection(name) {
        if (this.data.collections && this.data.collections[name]) {
            delete this.data.collections[name];
            for (const a of this.list) {
                if (a.collections) {
                    a.collections = a.collections.filter(c => c !== name);
                }
            }
            this.save();
        }
    },

    addAssetToCollection(assetId, name) {
        this.createCollection(name);
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.collections = asset.collections || [];
            if (!asset.collections.includes(name)) {
                asset.collections.push(name);
                if (!this.data.collections[name].includes(assetId)) {
                    this.data.collections[name].push(assetId);
                }
                this.save();
            }
        }
    },

    removeAssetFromCollection(assetId, name) {
        const asset = this.data.assets[assetId];
        if (asset && asset.collections) {
            asset.collections = asset.collections.filter(c => c !== name);
        }
        if (this.data.collections && this.data.collections[name]) {
            this.data.collections[name] = this.data.collections[name].filter(id => id !== assetId);
        }
        this.save();
    },

    getCollections() {
        return Object.keys(this.data.collections || {});
    }
};

//==========================================================
// SECTION 12: DocsDoodads.SEARCH (TOKENIZED QUERY PARSER)
//==========================================================
DocsDoodads.Search = {
    parseQuery(queryString) {
        const tokens = {
            terms: [],
            types: [],
            tags: [],
            folders: [],
            favorite: null,
            animated: null,
            collections: [],
            negative: []
        };
        if (!queryString) return tokens;

        // Parse tokens supporting quoted phrases, e.g. collection:"Castle Set" or -tag:"deep woods"
        const parts = [];
        const regex = /(-?\w+:)?("[^"]*"|'[^']*'|[^\s]+)/g;
        let match;
        while ((match = regex.exec(queryString)) !== null) {
            const prefix = match[1] || '';
            const val = match[2].replace(/^["']|["']$/g, '');
            parts.push(prefix + val);
        }

        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('-')) {
                tokens.negative.push(p.slice(1).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('type:')) {
                tokens.types.push(p.slice(5).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('tag:')) {
                tokens.tags.push(p.slice(4).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('folder:')) {
                tokens.folders.push(p.slice(7).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('favorite:')) {
                tokens.favorite = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('collection:')) {
                tokens.collections.push(p.slice(11).replace(/["']/g, '').toLowerCase());
            } else {
                tokens.terms.push(p.toLowerCase());
            }
        }
        return tokens;
    },

    matches(asset, parsed) {
        for (const neg of parsed.negative) {
            if ((asset.fileName && asset.fileName.toLowerCase().includes(neg)) || (asset.path && asset.path.toLowerCase().includes(neg))) {
                return false;
            }
        }
        if (parsed.favorite !== null && asset.favorite !== parsed.favorite) return false;
        if (parsed.types.length > 0 && !parsed.types.includes((asset.type || '').toLowerCase())) return false;
        if (parsed.folders.length > 0) {
            const pathLower = (asset.path || '').toLowerCase();
            if (!parsed.folders.some(f => pathLower.includes(f))) return false;
        }
        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
        }
        if (parsed.collections && parsed.collections.length > 0) {
            const assetCols = (asset.collections || []).map(c => c.toLowerCase());
            if (!parsed.collections.some(c => assetCols.includes(c))) return false;
        }
        if (parsed.terms.length > 0) {
            const searchHaystack = (asset.fileName + " " + (asset.tags || []).join(" ") + " " + (asset.autoTags || []).join(" ")).toLowerCase();
            for (const t of parsed.terms) {
                if (!searchHaystack.includes(t)) return false;
            }
        }
        return true;
    },

    filter(assets, queryString) {
        const parsed = this.parseQuery(queryString);
        return assets.filter(a => this.matches(a, parsed));
    }
};

//==========================================================
// SECTION 13: DocsDoodads.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
DocsDoodads.Thumbnail = {
    cache: {},
    cacheOrder: [],
    maxCacheSize: 500,
    sizeBuckets: [64, 96, 128, 192],
    queue: [],
    busy: false,

    getBucketSize(size) {
        let best = this.sizeBuckets[0];
        let minDiff = Math.abs(size - best);
        for (let i = 1; i < this.sizeBuckets.length; i++) {
            const diff = Math.abs(size - this.sizeBuckets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                best = this.sizeBuckets[i];
            }
        }
        return best;
    },

    getDiskPath(key) {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `data/docs_doodads_cache/thumbnails/${safeKey}.txt`;
    },

    get(asset, size = 96, callback) {
        const bucket = this.getBucketSize(size);
        const key = `${asset.id}_${bucket}`;

        // 1. In-memory LRU Cache check
        if (this.cache[key]) {
            // Touch key for LRU
            const idx = this.cacheOrder.indexOf(key);
            if (idx >= 0) this.cacheOrder.splice(idx, 1);
            this.cacheOrder.push(key);
            callback(this.cache[key]);
            return;
        }

        // 2. Disk Cache check
        if (cacheEnabled && DocsDoodads.FS.existsSync) {
            const diskFile = this.getDiskPath(key);
            if (DocsDoodads.FS.existsSync(diskFile)) {
                try {
                    const cachedData = DocsDoodads.FS.readFileSync(diskFile, 'utf8');
                    if (cachedData && cachedData.startsWith('data:image')) {
                        this.setCache(key, cachedData);
                        callback(cachedData);
                        return;
                    }
                } catch(e) {}
            }
        }

        this.queue.push({ asset, bucket, key, callback });
        this.processQueue();
    },

    setCache(key, dataUrl) {
        if (this.cacheOrder.length >= this.maxCacheSize) {
            const oldest = this.cacheOrder.shift();
            delete this.cache[oldest];
        }
        this.cache[key] = dataUrl;
        this.cacheOrder.push(key);
    },

    clearCache() {
        this.cache = {};
        this.cacheOrder = [];
        this.queue = [];
        if (DocsDoodads.FS.fs) {
            const dir = 'data/docs_doodads_cache/thumbnails';
            if (DocsDoodads.FS.existsSync(dir)) {
                try {
                    const files = DocsDoodads.FS.fs.readdirSync(dir);
                    for (const f of files) {
                        DocsDoodads.FS.fs.unlinkSync(`${dir}/${f}`);
                    }
                } catch(e) {}
            }
        }
    },

    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = Date.now();
        while (this.queue.length > 0 && (Date.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            this.generate(job.asset, job.bucket, (dataUrl) => {
                this.setCache(job.key, dataUrl);
                job.callback(dataUrl);

                // Write to disk cache
                if (cacheEnabled && DocsDoodads.FS.fs && dataUrl) {
                    const diskFile = this.getDiskPath(job.key);
                    try {
                        const dir = 'data/docs_doodads_cache/thumbnails';
                        if (!DocsDoodads.FS.existsSync(dir)) DocsDoodads.FS.mkdirp(dir);
                        DocsDoodads.FS.writeFileSync(diskFile, dataUrl, 'utf8');
                    } catch(e) {}
                }
            });
        }

        this.busy = false;
        if (this.queue.length > 0) {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.processQueue());
            } else {
                setTimeout(() => this.processQueue(), 16);
            }
        }
    },

    generate(asset, size, onComplete) {
        if (typeof Image === 'undefined' || typeof document === 'undefined') {
            onComplete('');
            return;
        }
        if (asset.category === 'Audio') {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♫', size / 2, size / 2);
            onComplete(canvas.toDataURL());
            return;
        }

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
            if (asset.slice && asset.slice.regions && asset.slice.regions.length > 0) {
                const r0 = asset.slice.regions[0];
                sx = r0.x; sy = r0.y; sw = r0.w; sh = r0.h;
            }

            const scale = Math.min(size / sw, size / sh);
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (size - dw) / 2;
            const dy = (size - dh) / 2;

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            onComplete(canvas.toDataURL());
        };
        img.onerror = () => onComplete('');
    }
};



//==========================================================
// SECTION 14: DocsDoodads.SLICING (KNOWN, GRID, METADATA, VISUAL)
//==========================================================
DocsDoodads.Slicing = {};

// 14.1 Known RPG Maker MZ Detection
DocsDoodads.Slicing.Known = {
    detect(asset) {
        const path = (asset.path || "").toLowerCase();
        const fileName = asset.fileName || "";
        const w = asset.width || 576;
        const h = asset.height || 384;

        // Characters
        if (asset.type === 'single_character' || fileName.startsWith('$')) {
            const cw = w / 3, ch = h / 4;
            return {
                status: "known",
                method: "mz_single_character",
                confidence: 1.0,
                width: w, height: h,
                regions: [{
                    id: (asset.id || "char") + "_single",
                    name: fileName.split('.')[0],
                    x: 0, y: 0, w: w, h: h,
                    cellW: cw, cellH: ch,
                    characterName: fileName, characterIndex: 0,
                    pivotX: 0.5, pivotY: 1.0
                }]
            };
        } else if (asset.type === 'character_sheet' || path.includes('img/characters')) {
            const charW = w / 4, charH = h / 2;
            const cellW = charW / 3, cellH = charH / 4;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                const cx = (idx % 4) * charW;
                const cy = Math.floor(idx / 4) * charH;
                regions.push({
                    id: (asset.id || "char") + "_char" + idx,
                    name: fileName.split('.')[0] + " #" + (idx + 1),
                    x: cx, y: cy, w: charW, h: charH,
                    cellW: cellW, cellH: cellH,
                    characterName: fileName, characterIndex: idx,
                    pivotX: 0.5, pivotY: 1.0
                });
            }
            return {
                status: "known",
                method: "mz_standard_8character",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (asset.type === 'faceset' || path.includes('img/faces')) {
            const fw = w / 4, fh = h / 2;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                regions.push({
                    id: (asset.id || "face") + "_face" + idx,
                    name: fileName.split('.')[0] + " Face #" + (idx + 1),
                    x: (idx % 4) * fw, y: Math.floor(idx / 4) * fh,
                    w: fw, h: fh, faceIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_faceset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (fileName.toLowerCase() === 'iconset.png' || path.includes('iconset')) {
            const iconSize = 32;
            const cols = 16;
            const rows = Math.floor(h / iconSize);
            const regions = [];
            for (let idx = 0; idx < cols * rows; idx++) {
                const ix = (idx % cols) * iconSize;
                const iy = Math.floor(idx / cols) * iconSize;
                regions.push({
                    id: "icon_" + idx,
                    name: "Icon #" + idx,
                    x: ix, y: iy, w: iconSize, h: iconSize,
                    iconIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_iconset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        }
        return null;
    }
};

// 14.2 Divisor Fixed Grid Slicing
DocsDoodads.Slicing.Grid = {
    findCandidates(width, height) {
        const candidates = [];
        const commonCellSizes = [16, 24, 32, 48, 64, 96, 128];
        for (const s of commonCellSizes) {
            if (width % s === 0 && height % s === 0) {
                const cols = width / s;
                const rows = height / s;
                candidates.push({ cellW: s, cellH: s, cols, rows, score: 0.9 });
            }
        }
        return candidates;
    },

    sliceToGrid(width, height, cols, rows) {
        const cellW = width / cols;
        const cellH = height / rows;
        const regions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                regions.push({
                    id: `grid_${r}_${c}`,
                    name: `Cell_${r + 1}_${c + 1}`,
                    x: Math.round(c * cellW),
                    y: Math.round(r * cellH),
                    w: Math.round(cellW),
                    h: Math.round(cellH),
                    pivotX: 0.5,
                    pivotY: 1.0
                });
            }
        }
        return regions;
    }
};

// 14.3 Sidecar Atlas Metadata Parsers
DocsDoodads.Slicing.Metadata = {
    parse(imagePath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return null;
        const candidates = [
            imagePath.replace(/\.[^/.]+$/, '.saf.json'),
            imagePath.replace(/\.[^/.]+$/, '.json')
        ];
        const jsonPath = candidates.find(candidate => fs.existsSync(candidate));
        if (!jsonPath) return null;

        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (!data.frames || (typeof data.frames !== 'object')) return null;

            const entries = Array.isArray(data.frames)
                ? data.frames.map((frame, index) => [frame.filename || `frame_${index}`, frame])
                : Object.entries(data.frames);
            const regions = [];
            for (const [name, frameData] of entries) {
                const frame = frameData.frame || frameData;
                if (![frame.x, frame.y, frame.w, frame.h].every(Number.isFinite)) continue;
                const sourceSize = frameData.sourceSize || { w: frame.w, h: frame.h };
                const spriteSourceSize = frameData.spriteSourceSize || { x: 0, y: 0, w: frame.w, h: frame.h };
                const rotated = Boolean(frameData.rotated);
                // As in PIXI: a rotated frame's w/h are the unrotated sprite size, so it covers h x w on the sheet.
                regions.push({
                    id: name,
                    name,
                    x: frame.x,
                    y: frame.y,
                    w: rotated ? frame.h : frame.w,
                    h: rotated ? frame.w : frame.h,
                    pivotX: frameData.pivot && Number.isFinite(frameData.pivot.x) ? frameData.pivot.x : 0.5,
                    pivotY: frameData.pivot && Number.isFinite(frameData.pivot.y) ? frameData.pivot.y : 1.0,
                    rotated,
                    trimmed: Boolean(frameData.trimmed),
                    sourceSize: { w: sourceSize.w, h: sourceSize.h },
                    spriteSourceSize: {
                        x: spriteSourceSize.x || 0,
                        y: spriteSourceSize.y || 0,
                        w: spriteSourceSize.w,
                        h: spriteSourceSize.h
                    },
                    duration: Number.isFinite(frameData.duration) ? frameData.duration : 0
                });
            }
            if (regions.length === 0) return null;

            const frameTags = data.meta && Array.isArray(data.meta.frameTags) ? data.meta.frameTags : [];
            const animationGroups = frameTags.map(tag => ({
                name: tag.name || 'animation',
                direction: tag.direction || 'forward',
                frames: regions.slice(Math.max(0, tag.from || 0), Math.min(regions.length, (tag.to || 0) + 1)).map(region => region.id)
            })).filter(group => group.frames.length > 0);

            if (animationGroups.length === 0) {
                const inferred = {};
                for (const region of regions) {
                    const groupName = region.name.replace(/\.[^.]+$/, '').replace(/(?:[_\- ]?\d+)$/, '');
                    if (!inferred[groupName]) inferred[groupName] = [];
                    inferred[groupName].push(region.id);
                }
                for (const [name, frames] of Object.entries(inferred)) {
                    if (frames.length > 1) animationGroups.push({ name, direction: 'forward', frames });
                }
            }

            return {
                status: 'metadata',
                method: jsonPath.endsWith('.saf.json') ? 'saf_sidecar_json' : 'sidecar_atlas_json',
                confidence: 1.0,
                sourcePath: jsonPath,
                regions,
                animationGroups
            };
        } catch (error) {
            DocsDoodads.Core.log('Atlas sidecar parse failed.', jsonPath, error);
            return null;
        }
    }
};

// 14.4 Visual Auto-Slicer
DocsDoodads.Slicing.Visual = {
    analyze(imageElement, options = {}) {
        if (typeof document === 'undefined') return { status: "none", regions: [] };
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        const w = canvas.width, h = canvas.height;
        return this.analyzePixels(ctx.getImageData(0, 0, w, h).data, w, h, options);
    },

    analyzePixels(data, w, h, options = {}) {
        const pixelCount = w * h;
        const maxPixels = options.maxPixels || 16777216;
        if (!data || w <= 0 || h <= 0 || data.length < pixelCount * 4) {
            return { status: 'none', method: 'invalid_pixels', confidence: 0, backgroundMode: 'unknown', regions: [] };
        }
        if (pixelCount > maxPixels) {
            return { status: 'review', method: 'safety_limit', confidence: 0.1, backgroundMode: 'unknown', regions: [], reason: 'image_too_large' };
        }

        const background = this.detectBackground(data, w, h, options);
        let binary = this.buildForegroundMask(data, w, h, background, options);
        binary = this.cleanupMask(binary, w, h, options);
        const minArea = Math.max(1, options.minArea === undefined ? 12 : options.minArea);
        const detected = this.connectedComponents(binary, w, h, minArea);
        const grouping = this.attachDetachedFragments(detected, options);
        const padding = Math.max(0, options.padding === undefined ? 1 : options.padding);
        let regions = grouping.components.map(component => ({
            x: Math.max(0, component.minX - padding),
            y: Math.max(0, component.minY - padding),
            w: Math.min(w, component.maxX + padding + 1) - Math.max(0, component.minX - padding),
            h: Math.min(h, component.maxY + padding + 1) - Math.max(0, component.minY - padding),
            pixelCount: component.count,
            pivotX: 0.5,
            pivotY: 1.0
        }));
        const rowTolerance = regions.length > 0
            ? Math.max(2, regions.reduce((sum, region) => sum + region.h, 0) / regions.length * 0.35)
            : 2;
        regions.sort((a, b) => Math.abs(a.y - b.y) <= rowTolerance ? a.x - b.x : a.y - b.y);
        regions = regions.map((region, index) => ({
            id: `reg_${index + 1}`,
            name: `Sprite_${String(index + 1).padStart(2, '0')}`,
            ...region
        }));

        const foregroundPixels = binary.reduce((sum, value) => sum + value, 0);
        const occupancy = foregroundPixels / pixelCount;
        const confidence = this.scoreConfidence(regions, background, occupancy, grouping.ambiguousFragments);
        return {
            status: confidence >= 0.65 ? 'auto' : 'review',
            method: 'saf_visual',
            confidence,
            backgroundMode: background.mode,
            alphaThreshold: background.alphaThreshold,
            regions,
            diagnostics: {
                occupancy,
                backgroundConfidence: background.confidence,
                componentCount: detected.length,
                attachedFragments: grouping.attachedFragments,
                ambiguousFragments: grouping.ambiguousFragments
            }
        };
    },

    detectBackground(data, w, h, options = {}) {
        const border = [];
        for (let x = 0; x < w; x++) {
            border.push(x, (h - 1) * w + x);
        }
        for (let y = 1; y < h - 1; y++) {
            border.push(y * w, y * w + w - 1);
        }
        let transparentCount = 0;
        const buckets = new Map();
        for (const index of border) {
            const offset = index * 4;
            const alpha = data[offset + 3];
            if (alpha < 245) transparentCount++;
            const key = `${data[offset] >> 4},${data[offset + 1] >> 4},${data[offset + 2] >> 4},${alpha >> 4}`;
            let bucket = buckets.get(key);
            if (!bucket) bucket = { count: 0, r: 0, g: 0, b: 0, a: 0 };
            bucket.count++;
            bucket.r += data[offset]; bucket.g += data[offset + 1]; bucket.b += data[offset + 2]; bucket.a += alpha;
            buckets.set(key, bucket);
        }
        const transparentRatio = border.length ? transparentCount / border.length : 1;
        if (transparentRatio >= (options.transparentBorderRatio || 0.15)) {
            const hist = new Uint32Array(256);
            for (let offset = 3; offset < data.length; offset += 4) hist[data[offset]]++;
            const alphaThreshold = options.alphaThreshold || Math.max(8, this.otsuThreshold(hist));
            return { mode: 'transparent', alphaThreshold, confidence: Math.min(1, 0.65 + transparentRatio * 0.35) };
        }

        let dominant = { count: 0, r: 0, g: 0, b: 0, a: 255 };
        for (const bucket of buckets.values()) if (bucket.count > dominant.count) dominant = bucket;
        const divisor = dominant.count || 1;
        return {
            mode: 'opaque',
            alphaThreshold: 8,
            color: [dominant.r / divisor, dominant.g / divisor, dominant.b / divisor, dominant.a / divisor],
            confidence: border.length ? dominant.count / border.length : 0
        };
    },

    buildForegroundMask(data, w, h, background, options = {}) {
        const binary = new Uint8Array(w * h);
        if (background.mode === 'transparent') {
            for (let index = 0, offset = 3; index < binary.length; index++, offset += 4) {
                binary[index] = data[offset] >= background.alphaThreshold ? 1 : 0;
            }
            return binary;
        }

        const tolerance = options.colorTolerance || 36;
        const toleranceSq = tolerance * tolerance;
        const candidate = new Uint8Array(w * h);
        for (let index = 0, offset = 0; index < candidate.length; index++, offset += 4) {
            const dr = data[offset] - background.color[0];
            const dg = data[offset + 1] - background.color[1];
            const db = data[offset + 2] - background.color[2];
            candidate[index] = dr * dr + dg * dg + db * db <= toleranceSq ? 1 : 0;
        }
        const visited = new Uint8Array(w * h);
        const queue = [];
        for (let x = 0; x < w; x++) queue.push(x, (h - 1) * w + x);
        for (let y = 1; y < h - 1; y++) queue.push(y * w, y * w + w - 1);
        while (queue.length > 0) {
            const index = queue.pop();
            if (index < 0 || index >= visited.length || visited[index] || !candidate[index]) continue;
            visited[index] = 1;
            const x = index % w;
            const y = Math.floor(index / w);
            if (x > 0) queue.push(index - 1);
            if (x < w - 1) queue.push(index + 1);
            if (y > 0) queue.push(index - w);
            if (y < h - 1) queue.push(index + w);
        }
        for (let index = 0; index < binary.length; index++) {
            binary[index] = !visited[index] && data[index * 4 + 3] >= 8 ? 1 : 0;
        }
        return binary;
    },

    cleanupMask(binary, w, h, options = {}) {
        if (options.cleanup === false) return binary;
        const cleaned = binary.slice();
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const index = y * w + x;
                if (!binary[index]) continue;
                const neighbors = binary[index - 1] + binary[index + 1] + binary[index - w] + binary[index + w];
                if (neighbors === 0) cleaned[index] = 0;
            }
        }
        return cleaned;
    },

    connectedComponents(binary, w, h, minArea) {
        const visited = new Uint8Array(binary.length);
        const components = [];
        for (let start = 0; start < binary.length; start++) {
            if (!binary[start] || visited[start]) continue;
            const queue = [start];
            visited[start] = 1;
            const component = { minX: start % w, maxX: start % w, minY: Math.floor(start / w), maxY: Math.floor(start / w), count: 0 };
            while (queue.length > 0) {
                const index = queue.pop();
                const x = index % w;
                const y = Math.floor(index / w);
                component.count++;
                component.minX = Math.min(component.minX, x); component.maxX = Math.max(component.maxX, x);
                component.minY = Math.min(component.minY, y); component.maxY = Math.max(component.maxY, y);
                const neighbors = [x > 0 ? index - 1 : -1, x < w - 1 ? index + 1 : -1, y > 0 ? index - w : -1, y < h - 1 ? index + w : -1];
                for (const next of neighbors) {
                    if (next >= 0 && binary[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
                }
            }
            if (component.count >= minArea) components.push(component);
        }
        return components;
    },

    componentDistance(a, b) {
        const dx = Math.max(0, a.minX - b.maxX - 1, b.minX - a.maxX - 1);
        const dy = Math.max(0, a.minY - b.maxY - 1, b.minY - a.maxY - 1);
        return Math.hypot(dx, dy);
    },

    attachDetachedFragments(components, options = {}) {
        if (components.length < 2) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: 0 };
        const largestArea = Math.max(...components.map(component => component.count));
        const ratio = options.fragmentMaxAreaRatio === undefined ? 0.12 : options.fragmentMaxAreaRatio;
        const maxDistance = options.fragmentAttachDistance === undefined ? 6 : options.fragmentAttachDistance;
        const majors = components.filter(component => component.count > largestArea * ratio).map(component => ({ ...component }));
        const fragments = components.filter(component => component.count <= largestArea * ratio);
        if (majors.length === 0) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: fragments.length };
        let attachedFragments = 0;
        let ambiguousFragments = 0;
        const unattached = [];
        for (const fragment of fragments) {
            const ranked = majors.map((major, index) => ({ index, distance: this.componentDistance(fragment, major) })).sort((a, b) => a.distance - b.distance);
            const nearest = ranked[0];
            const second = ranked[1];
            const unambiguous = !second || second.distance - nearest.distance >= Math.max(2, nearest.distance * 0.5);
            if (nearest.distance <= maxDistance && unambiguous) {
                const major = majors[nearest.index];
                major.minX = Math.min(major.minX, fragment.minX); major.maxX = Math.max(major.maxX, fragment.maxX);
                major.minY = Math.min(major.minY, fragment.minY); major.maxY = Math.max(major.maxY, fragment.maxY);
                major.count += fragment.count;
                attachedFragments++;
            } else {
                unattached.push(fragment);
                if (!unambiguous) ambiguousFragments++;
            }
        }
        return { components: majors.concat(unattached), attachedFragments, ambiguousFragments };
    },

    scoreConfidence(regions, background, occupancy, ambiguousFragments) {
        if (regions.length === 0) return 0.1;
        let score = 0.58 + Math.min(0.24, background.confidence * 0.24);
        const averageSolidity = regions.reduce((sum, region) => sum + Math.min(1, region.pixelCount / Math.max(1, region.w * region.h)), 0) / regions.length;
        score += averageSolidity * 0.16;
        if (occupancy > 0.88) score -= 0.38;
        else if (occupancy < 0.0005) score -= 0.25;
        score -= Math.min(0.25, ambiguousFragments * 0.05);
        return Math.max(0.05, Math.min(0.99, Math.round(score * 1000) / 1000));
    },

    otsuThreshold(hist) {
        let total = 0;
        for (let i = 0; i < 256; i++) total += hist[i];
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, varMax = 0, threshold = 0;

        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            const wF = total - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        return threshold;
    },

    gutterSplitRegions(regions, binary, w, h) {
        const out = [];
        for (const r of regions) {
            if (r.w > 64) {
                const colSums = new Int32Array(r.w);
                for (let x = 0; x < r.w; x++) {
                    for (let y = 0; y < r.h; y++) {
                        if (binary[(r.y + y) * w + (r.x + x)] === 1) {
                            colSums[x]++;
                        }
                    }
                }
                let splitCol = -1;
                for (let x = 8; x < r.w - 8; x++) {
                    if (colSums[x] === 0) {
                        splitCol = x;
                        break;
                    }
                }
                if (splitCol > 0) {
                    out.push({
                        id: r.id + '_a',
                        name: r.name + '_A',
                        x: r.x, y: r.y, w: splitCol, h: r.h,
                        pivotX: 0.5, pivotY: 1.0
                    });
                    out.push({
                        id: r.id + '_b',
                        name: r.name + '_B',
                        x: r.x + splitCol, y: r.y, w: r.w - splitCol, h: r.h,
                        pivotX: 0.5, pivotY: 1.0
                    });
                    continue;
                }
            }
            out.push(r);
        }
        return out;
    },

    analyzeAsync(imageElement, options = {}, onProgress = null, cancellationToken = null) {
        return new Promise((resolve, reject) => {
            if (cancellationToken && cancellationToken.isCancelled) {
                return resolve(null);
            }
            if (typeof document === 'undefined') {
                return resolve({ status: "none", regions: [] });
            }
            if (onProgress) onProgress("Loading Pixels", 10);

            const canvas = document.createElement('canvas');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);

            const w = canvas.width, h = canvas.height;
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Calculating Threshold", 25);

            // Step 1: Alpha histogram and Otsu threshold
            const hist = new Uint32Array(256);
            for (let i = 3; i < data.length; i += 4) {
                hist[data[i]]++;
            }
            let threshold = this.otsuThreshold(hist);
            if (threshold < 8) threshold = 16;

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Binarizing Image", 40);

            // Step 2: Binary grid foreground
            const binary = new Uint8Array(w * h);
            for (let i = 0, p = 3; p < data.length; i++, p += 4) {
                binary[i] = data[p] >= threshold ? 1 : 0;
            }

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Connected Components Analysis", 60);

            // Step 3: Connected Components (4-connected)
            const labels = new Int32Array(w * h);
            let currentLabel = 1;
            const components = {};

            let y = 0;
            const processChunk = () => {
                const chunkStart = Date.now();
                while (y < h && (Date.now() - chunkStart < 12)) {
                    if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
                    for (let x = 0; x < w; x++) {
                        const idx = y * w + x;
                        if (binary[idx] === 1 && labels[idx] === 0) {
                            const comp = { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
                            const queue = [idx];
                            labels[idx] = currentLabel;

                            while (queue.length > 0) {
                                const cur = queue.pop();
                                const cx = cur % w;
                                const cy = Math.floor(cur / w);
                                comp.count++;

                                if (cx < comp.minX) comp.minX = cx;
                                if (cx > comp.maxX) comp.maxX = cx;
                                if (cy < comp.minY) comp.minY = cy;
                                if (cy > comp.maxY) comp.maxY = cy;

                                const nList = [
                                    cy > 0 ? (cy - 1) * w + cx : -1,
                                    cy < h - 1 ? (cy + 1) * w + cx : -1,
                                    cx > 0 ? cy * w + (cx - 1) : -1,
                                    cx < w - 1 ? cy * w + (cx + 1) : -1
                                ];
                                for (const nIdx of nList) {
                                    if (nIdx >= 0 && binary[nIdx] === 1 && labels[nIdx] === 0) {
                                        labels[nIdx] = currentLabel;
                                        queue.push(nIdx);
                                    }
                                }
                            }
                            if (comp.count > 12) {
                                components[currentLabel] = comp;
                            }
                            currentLabel++;
                        }
                    }
                    y++;
                }

                if (y < h) {
                    if (onProgress) onProgress("Connected Components Analysis", Math.round(60 + (y / h) * 25));
                    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(processChunk);
                    else setTimeout(processChunk, 1);
                } else {
                    if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
                    if (onProgress) onProgress("Splitting Gutters & Finalizing", 90);

                    if (onProgress) onProgress("Complete", 100);
                    resolve(this.analyzePixels(data, w, h, options));
                }
            };
            processChunk();
        });
    }
};

//==========================================================
// SECTION 15: DocsDoodads.EXPORT (PNG SLICE EXPORTER)
//==========================================================
DocsDoodads.Export = {
    safeFileName(name) {
        const baseName = String(name || 'slice').split(/[\\/]/).pop();
        return baseName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+$/, 'slice');
    },

    getRegionGeometry(region) {
        const atlasW = Math.max(1, Math.round(region.w));
        const atlasH = Math.max(1, Math.round(region.h));
        const rotated = Boolean(region.rotated);
        const contentW = rotated ? atlasH : atlasW;
        const contentH = rotated ? atlasW : atlasH;
        const trimmed = Boolean(region.trimmed);
        const sourceSize = region.sourceSize || {};
        const spriteSourceSize = region.spriteSourceSize || {};
        return {
            atlasW,
            atlasH,
            contentW,
            contentH,
            outputW: trimmed && Number.isFinite(sourceSize.w) ? sourceSize.w : contentW,
            outputH: trimmed && Number.isFinite(sourceSize.h) ? sourceSize.h : contentH,
            destinationX: trimmed && Number.isFinite(spriteSourceSize.x) ? spriteSourceSize.x : 0,
            destinationY: trimmed && Number.isFinite(spriteSourceSize.y) ? spriteSourceSize.y : 0,
            rotated
        };
    },

    exportSlices(asset, targetDir) {
        const fs = DocsDoodads.FS.fs, path = DocsDoodads.FS.path;
        if (!fs || !path) return false;
        if (!asset.slice || !asset.slice.regions || asset.slice.regions.length === 0) {
            alert("No slice regions defined for this asset.");
            return false;
        }

        const outDir = targetDir || path.join('img', 'doodads', 'sliced_' + asset.fileName.replace(/\.[^/.]+$/, ""));
        DocsDoodads.FS.mkdirp(outDir);

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let count = 0;

            for (let i = 0; i < asset.slice.regions.length; i++) {
                const r = asset.slice.regions[i];
                const geometry = this.getRegionGeometry(r);
                canvas.width = geometry.outputW;
                canvas.height = geometry.outputH;
                ctx.clearRect(0, 0, geometry.outputW, geometry.outputH);
                if (geometry.rotated) {
                    ctx.save();
                    ctx.translate(geometry.destinationX, geometry.destinationY + geometry.contentH);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, r.x, r.y, geometry.atlasW, geometry.atlasH, 0, 0, geometry.atlasW, geometry.atlasH);
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        img, r.x, r.y, geometry.atlasW, geometry.atlasH,
                        geometry.destinationX, geometry.destinationY, geometry.contentW, geometry.contentH
                    );
                }

                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const rawName = this.safeFileName(r.name || ('slice_' + (i + 1))).replace(/\.[^.]+$/, '');
                const sliceFileName = `${rawName || ('slice_' + (i + 1))}.png`;
                fs.writeFileSync(path.join(outDir, sliceFileName), buffer);
                count++;
            }
            DocsDoodads.Workspace.showToast(`Exported ${count} slices to ${outDir}`);
        };
        return true;
    }
};


//==========================================================
// SECTION 16: DocsDoodads.SLICING.EDITOR (FULL INTERACTIVE MODAL)
//==========================================================
DocsDoodads.Slicing.Editor = {
    modal: null,
    asset: null,
    img: null,
    canvas: null,
    ctx: null,
    regions: [],
    selectedRegionIdx: -1,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    isDraggingHandle: false,
    activeHandle: null, // 'nw','n','ne','e','se','s','sw','w','body'
    dragStartMouse: { x: 0, y: 0 },
    dragStartRegion: null,
    isCreatingRegion: false,
    createStart: { x: 0, y: 0 },
    createCurrent: { x: 0, y: 0 },
    activeGuides: [], // alignment guides
    undoStack: [],
    redoStack: [],

    open(asset) {
        if (!asset || !asset.path) return;
        this.asset = asset;
        this.regions = JSON.parse(JSON.stringify(asset.slice.regions || []));
        this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.undoStack = [];
        this.redoStack = [];

        this.img = new Image();
        this.img.src = asset.path;
        this.img.onload = () => {
            this.buildUI();
            this.fitToScreen();
            this.render();
        };
    },

    saveState() {
        this.undoStack.push(JSON.stringify(this.regions));
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
        this.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.undoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.redoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-slicer-undo');
        const rBtn = document.getElementById('dd-slicer-redo');
        if (uBtn) uBtn.style.opacity = this.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
    },

    fitToScreen() {
        const vp = document.getElementById('dd-slicer-canvas-container');
        if (!vp || !this.img) return;
        const availW = vp.clientWidth - 40;
        const availH = vp.clientHeight - 40;
        const scaleW = availW / this.img.naturalWidth;
        const scaleH = availH / this.img.naturalHeight;
        this.zoom = Math.min(Math.max(Math.min(scaleW, scaleH), 0.25), 4.0);
        this.panX = (vp.clientWidth - this.img.naturalWidth * this.zoom) / 2;
        this.panY = (vp.clientHeight - this.img.naturalHeight * this.zoom) / 2;
    },

    buildUI() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }

        const modal = document.createElement('div');
        modal.id = 'dd-slicer-modal-root';
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; bottom: 20px;
            z-index: 10005; display: flex; flex-direction: column; overflow: hidden;
            pointer-events: auto; font-family: 'Segoe UI', Roboto, sans-serif;
            border: 1px solid rgba(255,255,255,0.18);
        `;

        modal.innerHTML = `
            <!-- Top Toolbar -->
            <div style="height: 48px; background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: bold; color: #60a5fa; font-size: 13px;">SLICER: ${escapeHtml(this.asset.fileName)}</span>
                    <button class="dd-btn" id="dd-slicer-undo" title="Undo (Ctrl+Z)">Undo</button>
                    <button class="dd-btn" id="dd-slicer-redo" title="Redo (Ctrl+Y)">Redo</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-auto-btn" title="Detect sprite regions automatically">Auto-Slice</button>
                    <button class="dd-btn" id="dd-slicer-grid-btn" title="Slice into fixed grid">Fixed Grid</button>
                    <button class="dd-btn" id="dd-slicer-add-btn" title="Add region">Add Box</button>
                    <button class="dd-btn" id="dd-slicer-del-btn" title="Delete selected region">Delete</button>
                    <button class="dd-btn" id="dd-slicer-dup-btn" title="Duplicate selected">Duplicate</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn" id="dd-slicer-splitv-btn" title="Split vertical">Split Vert</button>
                    <button class="dd-btn" id="dd-slicer-splith-btn" title="Split horizontal">Split Horz</button>
                    <button class="dd-btn" id="dd-slicer-export-btn" title="Export individual PNG files">Export PNGs</button>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-save-btn">Save Slices</button>
                    <button class="dd-btn" id="dd-slicer-close-btn" style="background: #ef4444; border-color: #dc2626;">Close</button>
                </div>
            </div>

            <!-- Workspace Body: Left Canvas Viewport + Right Region List -->
            <div style="flex: 1; display: flex; overflow: hidden; position: relative;">
                <!-- Canvas Container -->
                <div id="dd-slicer-canvas-container" style="flex: 1; background: #0b0f19; overflow: hidden; position: relative; cursor: default;">
                    <canvas id="dd-slicer-interactive-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>

                <!-- Right Sidebar: Region List & Inspector -->
                <div style="width: 320px; background: rgba(15, 23, 42, 0.95); border-left: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: bold; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
                        <span>REGIONS (<span id="dd-region-count">0</span>)</span>
                        <span id="dd-slicer-zoom-indicator" style="color: #60a5fa;">100%</span>
                    </div>
                    <div id="dd-region-list" style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                    </div>
                    <!-- Selected Region Properties -->
                    <div id="dd-region-inspector" style="padding: 12px; background: #111827; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px;">
                        <div style="color: #64748b; text-align: center;">No region selected</div>
                    </div>
                </div>
            </div>

            <!-- Bottom Status Bar -->
            <div style="height: 26px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: #64748b;">
                <span id="dd-slicer-hint">Mouse Wheel: Zoom (25%-1600%) | Space+Drag / Middle Click: Pan | Drag handle: Resize | Drag inside: Move | Drag empty: Create</span>
                <span id="dd-slicer-img-dim">${this.img.naturalWidth} x ${this.img.naturalHeight} px</span>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        this.canvas = document.getElementById('dd-slicer-interactive-canvas');
        this.ctx = this.canvas.getContext('2d');
        const container = document.getElementById('dd-slicer-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (!this._windowResizeListenerBound) {
            this._windowResizeListenerBound = true;
            window.addEventListener('resize', () => {
                const current = document.getElementById('dd-slicer-canvas-container');
                if (this.modal && current) {
                    this.canvas.width = current.clientWidth;
                    this.canvas.height = current.clientHeight;
                    this.render();
                }
            });
        }

        this.bindEvents();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    bindEvents() {
        const container = document.getElementById('dd-slicer-canvas-container');

        // Close & Save
        document.getElementById('dd-slicer-close-btn').onclick = () => this.close();
        document.getElementById('dd-slicer-save-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            this.asset.slice.status = "manual";
            DocsDoodads.AssetIndex.save();
            DocsDoodads.Workspace.refreshDrawerCards();
            DocsDoodads.Workspace.showToast("Slice Regions Saved!");
            this.close();
        };

        // Undo & Redo
        document.getElementById('dd-slicer-undo').onclick = () => this.undo();
        document.getElementById('dd-slicer-redo').onclick = () => this.redo();

        // Visual auto-slice
        document.getElementById('dd-slicer-auto-btn').onclick = () => {
            this.saveState();
            const res = DocsDoodads.Slicing.Visual.analyze(this.img);
            this.regions = res.regions;
            this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
            this.render();
            this.updateRegionList();
            const confidence = Math.round((Number(res.confidence) || 0) * 100);
            const verdict = res.status === 'review' ? 'Review required' : 'Auto-slice complete';
            DocsDoodads.Workspace.showToast(`${verdict}: ${this.regions.length} regions (${confidence}% confidence)`);
        };

        // Fixed Grid
        document.getElementById('dd-slicer-grid-btn').onclick = () => {
            const input = prompt("Enter grid columns and rows (e.g. 8x4):", "4x2");
            if (!input) return;
            const parts = input.split(/[xX, ]+/);
            if (parts.length >= 2) {
                const cols = parseInt(parts[0], 10);
                const rows = parseInt(parts[1], 10);
                if (cols > 0 && rows > 0) {
                    this.saveState();
                    this.regions = DocsDoodads.Slicing.Grid.sliceToGrid(this.img.naturalWidth, this.img.naturalHeight, cols, rows);
                    this.selectedRegionIdx = 0;
                    this.render();
                    this.updateRegionList();
                    DocsDoodads.Workspace.showToast(`Sliced into ${cols}x${rows} Grid!`);
                }
            }
        };

        // Add, Delete, Duplicate
        document.getElementById('dd-slicer-add-btn').onclick = () => {
            this.saveState();
            const newReg = {
                id: 'reg_' + Date.now(),
                name: 'Region_' + (this.regions.length + 1),
                x: Math.round(this.img.naturalWidth / 2 - 24),
                y: Math.round(this.img.naturalHeight / 2 - 24),
                w: 48, h: 48,
                pivotX: 0.5, pivotY: 1.0
            };
            this.regions.push(newReg);
            this.selectedRegionIdx = this.regions.length - 1;
            this.render();
            this.updateRegionList();
        };

        document.getElementById('dd-slicer-del-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                this.regions.splice(this.selectedRegionIdx, 1);
                this.selectedRegionIdx = Math.min(this.selectedRegionIdx, this.regions.length - 1);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-dup-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const dup = JSON.parse(JSON.stringify(cur));
                dup.id = 'reg_' + Date.now();
                dup.name = dup.name + '_copy';
                dup.x += 16; dup.y += 16;
                this.regions.push(dup);
                this.selectedRegionIdx = this.regions.length - 1;
                this.render();
                this.updateRegionList();
            }
        };

        // Split
        document.getElementById('dd-slicer-splitv-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfW = Math.round(cur.w / 2);
                const a = { ...cur, w: halfW };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', x: cur.x + halfW, w: cur.w - halfW };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-splith-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfH = Math.round(cur.h / 2);
                const a = { ...cur, h: halfH };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', y: cur.y + halfH, h: cur.h - halfH };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-export-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            DocsDoodads.Export.exportSlices(this.asset);
        };

        // Mouse interactions on Canvas
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.min(Math.max(this.zoom * factor, 0.25), 16.0);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom centered on cursor
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            const ind = document.getElementById('dd-slicer-zoom-indicator');
            if (ind) ind.textContent = Math.round(this.zoom * 100) + '%';
            this.render();
        });

        container.addEventListener('mousedown', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Middle click or Space held -> Pan
            if (e.button === 1 || e.spaceKey || e.altKey) {
                this.isPanning = true;
                this.panStartX = mouseX - this.panX;
                this.panStartY = mouseY - this.panY;
                container.style.cursor = 'grab';
                return;
            }

            if (e.button === 0) {
                // Check if over handle of selected region
                if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                    const r = this.regions[this.selectedRegionIdx];
                    const handle = this.hitTestHandles(mouseX, mouseY, r);
                    if (handle) {
                        this.saveState();
                        this.isDraggingHandle = true;
                        this.activeHandle = handle;
                        this.dragStartMouse = { x: mouseX, y: mouseY };
                        this.dragStartRegion = { ...r };
                        return;
                    }
                }

                // Check if clicking inside any region
                const clickedIdx = this.hitTestRegions(mouseX, mouseY);
                if (clickedIdx >= 0) {
                    this.saveState();
                    this.selectedRegionIdx = clickedIdx;
                    this.isDraggingHandle = true;
                    this.activeHandle = 'body';
                    this.dragStartMouse = { x: mouseX, y: mouseY };
                    this.dragStartRegion = { ...this.regions[clickedIdx] };
                    this.render();
                    this.updateRegionList();
                    return;
                }

                // Otherwise, start creating new region
                this.isCreatingRegion = true;
                const imgCoords = this.screenToImage(mouseX, mouseY);
                this.createStart = imgCoords;
                this.createCurrent = imgCoords;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.modal) return;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanning) {
                this.panX = mouseX - this.panStartX;
                this.panY = mouseY - this.panStartY;
                this.render();
                return;
            }

            if (this.isDraggingHandle && this.dragStartRegion) {
                const imgNow = this.screenToImage(mouseX, mouseY);
                const imgStart = this.screenToImage(this.dragStartMouse.x, this.dragStartMouse.y);
                const dx = Math.round(imgNow.x - imgStart.x);
                const dy = Math.round(imgNow.y - imgStart.y);
                const r = this.regions[this.selectedRegionIdx];
                const s = this.dragStartRegion;

                this.activeGuides = [];
                let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

                if (this.activeHandle === 'body') {
                    nx = s.x + dx;
                    ny = s.y + dy;
                    // Snapping
                    nx = this.snapCoordX(nx, nw);
                    ny = this.snapCoordY(ny, nh);
                } else if (this.activeHandle === 'se') {
                    nw = Math.max(s.w + dx, 4);
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'e') {
                    nw = Math.max(s.w + dx, 4);
                } else if (this.activeHandle === 's') {
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'nw') {
                    nx = s.x + dx; ny = s.y + dy;
                    nw = s.w - dx; nh = s.h - dy;
                } else if (this.activeHandle === 'w') {
                    nx = s.x + dx; nw = s.w - dx;
                } else if (this.activeHandle === 'n') {
                    ny = s.y + dy; nh = s.h - dy;
                }

                r.x = Math.max(0, nx);
                r.y = Math.max(0, ny);
                r.w = Math.max(4, nw);
                r.h = Math.max(4, nh);
                this.render();
                this.updateInspectorValues();
                return;
            }

            if (this.isCreatingRegion) {
                this.createCurrent = this.screenToImage(mouseX, mouseY);
                this.render();
                return;
            }

            // Update hover cursor
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                const h = this.hitTestHandles(mouseX, mouseY, this.regions[this.selectedRegionIdx]);
                if (h) {
                    container.style.cursor = h === 'body' ? 'move' : h + '-resize';
                    return;
                }
            }
            container.style.cursor = 'crosshair';
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                container.style.cursor = 'default';
            }
            if (this.isDraggingHandle) {
                this.isDraggingHandle = false;
                this.activeHandle = null;
                this.activeGuides = [];
                this.render();
                this.updateRegionList();
            }
            if (this.isCreatingRegion) {
                this.isCreatingRegion = false;
                const minX = Math.round(Math.min(this.createStart.x, this.createCurrent.x));
                const minY = Math.round(Math.min(this.createStart.y, this.createCurrent.y));
                const rw = Math.round(Math.abs(this.createCurrent.x - this.createStart.x));
                const rh = Math.round(Math.abs(this.createCurrent.y - this.createStart.y));

                if (rw >= 6 && rh >= 6) {
                    this.saveState();
                    const newReg = {
                        id: 'reg_' + Date.now(),
                        name: 'Region_' + (this.regions.length + 1),
                        x: Math.max(0, minX),
                        y: Math.max(0, minY),
                        w: rw, h: rh,
                        pivotX: 0.5, pivotY: 1.0
                    };
                    this.regions.push(newReg);
                    this.selectedRegionIdx = this.regions.length - 1;
                    this.render();
                    this.updateRegionList();
                } else {
                    this.render();
                }
            }
        });

        // bindEvents runs on every open; window listeners must only be registered once.
        if (!this._windowKeyListenerBound) {
            this._windowKeyListenerBound = true;
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
    },

    handleKeyDown(e) {
        if (!this.modal) return;
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        if (DocsDoodads.isEditableTarget(e.target)) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            document.getElementById('dd-slicer-del-btn').click();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            this.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            this.redo();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            document.getElementById('dd-slicer-dup-btn').click();
        }
    },

    snapCoordX(x, w) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(x) < snapDist) {
            this.activeGuides.push({ type: 'v', x: 0 });
            return 0;
        }
        if (Math.abs(x + w - this.img.naturalWidth) < snapDist) {
            this.activeGuides.push({ type: 'v', x: this.img.naturalWidth });
            return this.img.naturalWidth - w;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(x - other.x) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x });
                return other.x;
            }
            if (Math.abs(x - (other.x + other.w)) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x + other.w });
                return other.x + other.w;
            }
        }
        return x;
    },

    snapCoordY(y, h) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(y) < snapDist) {
            this.activeGuides.push({ type: 'h', y: 0 });
            return 0;
        }
        if (Math.abs(y + h - this.img.naturalHeight) < snapDist) {
            this.activeGuides.push({ type: 'h', y: this.img.naturalHeight });
            return this.img.naturalHeight - h;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(y - other.y) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y });
                return other.y;
            }
            if (Math.abs(y - (other.y + other.h)) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y + other.h });
                return other.y + other.h;
            }
        }
        return y;
    },

    screenToImage(sx, sy) {
        return {
            x: (sx - this.panX) / this.zoom,
            y: (sy - this.panY) / this.zoom
        };
    },

    imageToScreen(ix, iy) {
        return {
            x: ix * this.zoom + this.panX,
            y: iy * this.zoom + this.panY
        };
    },

    hitTestRegions(sx, sy) {
        const img = this.screenToImage(sx, sy);
        for (let i = this.regions.length - 1; i >= 0; i--) {
            const r = this.regions[i];
            if (img.x >= r.x && img.x <= r.x + r.w && img.y >= r.y && img.y <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    },

    hitTestHandles(sx, sy, r) {
        const sTopLeft = this.imageToScreen(r.x, r.y);
        const sW = r.w * this.zoom;
        const sH = r.h * this.zoom;
        const hSize = 8;

        const handles = {
            nw: { x: sTopLeft.x, y: sTopLeft.y },
            ne: { x: sTopLeft.x + sW, y: sTopLeft.y },
            se: { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
            sw: { x: sTopLeft.x, y: sTopLeft.y + sH },
            n:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
            e:  { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
            s:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
            w:  { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
        };

        for (const k in handles) {
            const h = handles[k];
            if (Math.abs(sx - h.x) <= hSize && Math.abs(sy - h.y) <= hSize) {
                return k;
            }
        }
        if (sx >= sTopLeft.x && sx <= sTopLeft.x + sW && sy >= sTopLeft.y && sy <= sTopLeft.y + sH) {
            return 'body';
        }
        return null;
    },

    render() {
        if (!this.ctx || !this.img) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Checkerboard background pattern
        const chkSize = 16;
        for (let y = 0; y < h; y += chkSize) {
            for (let x = 0; x < w; x += chkSize) {
                ctx.fillStyle = ((x / chkSize + y / chkSize) % 2 === 0) ? '#0f172a' : '#1e293b';
                ctx.fillRect(x, y, chkSize, chkSize);
            }
        }

        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        // 2. Source Sprite Sheet Image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.img, 0, 0);

        // 3. Pixel grid at high zoom (>= 4.0)
        if (this.zoom >= 4.0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1 / this.zoom;
            for (let x = 0; x <= this.img.naturalWidth; x++) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.img.naturalHeight); ctx.stroke();
            }
            for (let y = 0; y <= this.img.naturalHeight; y++) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.img.naturalWidth, y); ctx.stroke();
            }
        }

        // 4. Draw Regions
        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const isSel = i === this.selectedRegionIdx;

            ctx.fillStyle = isSel ? 'rgba(234, 179, 8, 0.22)' : 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(r.x, r.y, r.w, r.h);

            ctx.strokeStyle = isSel ? '#eab308' : '#38bdf8';
            ctx.lineWidth = (isSel ? 2 : 1) / this.zoom;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Pivot Crosshair
            const px = r.x + (r.pivotX !== undefined ? r.pivotX : 0.5) * r.w;
            const py = r.y + (r.pivotY !== undefined ? r.pivotY : 1.0) * r.h;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1 / this.zoom;
            ctx.beginPath();
            ctx.moveTo(px - 4 / this.zoom, py); ctx.lineTo(px + 4 / this.zoom, py);
            ctx.moveTo(px, py - 4 / this.zoom); ctx.lineTo(px, py + 4 / this.zoom);
            ctx.stroke();

            // Label
            ctx.fillStyle = isSel ? '#fef08a' : '#e0f2fe';
            ctx.font = `bold ${Math.max(10 / this.zoom, 8)}px sans-serif`;
            ctx.fillText(`#${i + 1} ${r.w}x${r.h}`, r.x + 2 / this.zoom, r.y + 10 / this.zoom);
        }

        // Draw In-progress creation rectangle
        if (this.isCreatingRegion) {
            const minX = Math.min(this.createStart.x, this.createCurrent.x);
            const minY = Math.min(this.createStart.y, this.createCurrent.y);
            const rw = Math.abs(this.createCurrent.x - this.createStart.x);
            const rh = Math.abs(this.createCurrent.y - this.createStart.y);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fillRect(minX, minY, rw, rh);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1 / this.zoom;
            ctx.strokeRect(minX, minY, rw, rh);
        }

        ctx.restore();

        // 5. Draw 8 Handles for Selected Region in Screen Space
        if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
            const r = this.regions[this.selectedRegionIdx];
            const sTopLeft = this.imageToScreen(r.x, r.y);
            const sW = r.w * this.zoom;
            const sH = r.h * this.zoom;
            const hPoints = [
                { x: sTopLeft.x, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
            ];

            ctx.fillStyle = '#eab308';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            for (const hp of hPoints) {
                ctx.fillRect(hp.x - 4, hp.y - 4, 8, 8);
                ctx.strokeRect(hp.x - 4, hp.y - 4, 8, 8);
            }
        }

        // 6. Draw Alignment Guides
        if (this.activeGuides.length > 0) {
            ctx.strokeStyle = '#ec4899';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (const g of this.activeGuides) {
                if (g.type === 'v') {
                    const scrX = this.imageToScreen(g.x, 0).x;
                    ctx.beginPath(); ctx.moveTo(scrX, 0); ctx.lineTo(scrX, h); ctx.stroke();
                } else if (g.type === 'h') {
                    const scrY = this.imageToScreen(0, g.y).y;
                    ctx.beginPath(); ctx.moveTo(0, scrY); ctx.lineTo(w, scrY); ctx.stroke();
                }
            }
            ctx.setLineDash([]);
        }
    },

    updateRegionList() {
        const countEl = document.getElementById('dd-region-count');
        if (countEl) countEl.textContent = this.regions.length;
        const listEl = document.getElementById('dd-region-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const item = document.createElement('div');
            item.className = 'dd-btn' + (i === this.selectedRegionIdx ? ' dd-btn-active' : '');
            item.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                padding: 6px 8px; font-size: 11px; text-align: left;
            `;
            item.innerHTML = `
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                    <strong>#${i + 1}</strong> ${escapeHtml(r.name || 'Region')}
                    <span style="color: #64748b; margin-left: 4px;">(${r.w}x${r.h})</span>
                </div>
                <span style="color: #94a3b8; font-size: 10px;">${r.x},${r.y}</span>
            `;
            item.onclick = () => {
                this.selectedRegionIdx = i;
                this.render();
                this.updateRegionList();
            };
            listEl.appendChild(item);
        }
        this.updateInspectorValues();
    },

    updateInspectorValues() {
        const insp = document.getElementById('dd-region-inspector');
        if (!insp) return;
        if (this.selectedRegionIdx < 0 || this.selectedRegionIdx >= this.regions.length) {
            insp.innerHTML = '<div style="color: #64748b; text-align: center;">No region selected</div>';
            return;
        }

        const r = this.regions[this.selectedRegionIdx];
        insp.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 8px;">Region #${this.selectedRegionIdx + 1} Properties</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">X:</label>
                    <input type="number" id="dd-insp-rx" value="${r.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Y:</label>
                    <input type="number" id="dd-insp-ry" value="${r.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Width:</label>
                    <input type="number" id="dd-insp-rw" value="${r.w}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Height:</label>
                    <input type="number" id="dd-insp-rh" value="${r.h}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
            <div style="margin-top: 6px;">
                <label style="color: #94a3b8; font-size: 10px;">Name:</label>
                <input type="text" id="dd-insp-name" value="${escapeHtml(r.name || '')}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot X:</label>
                    <input type="number" step="0.1" id="dd-insp-pivx" value="${r.pivotX !== undefined ? r.pivotX : 0.5}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot Y:</label>
                    <input type="number" step="0.1" id="dd-insp-pivy" value="${r.pivotY !== undefined ? r.pivotY : 1.0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
        `;

        const rx = document.getElementById('dd-insp-rx');
        const ry = document.getElementById('dd-insp-ry');
        const rw = document.getElementById('dd-insp-rw');
        const rh = document.getElementById('dd-insp-rh');
        const rname = document.getElementById('dd-insp-name');
        const pivx = document.getElementById('dd-insp-pivx');
        const pivy = document.getElementById('dd-insp-pivy');

        const applyInputs = () => {
            r.x = parseInt(rx.value, 10) || 0;
            r.y = parseInt(ry.value, 10) || 0;
            r.w = Math.max(4, parseInt(rw.value, 10) || 4);
            r.h = Math.max(4, parseInt(rh.value, 10) || 4);
            r.name = rname.value;
            // 0 is a valid pivot (left/top edge); only blank or invalid input falls back.
            const px = parseFloat(pivx.value), py = parseFloat(pivy.value);
            r.pivotX = Number.isFinite(px) ? px : 0.5;
            r.pivotY = Number.isFinite(py) ? py : 1.0;
            this.render();
        };

        rx.onchange = applyInputs;
        ry.onchange = applyInputs;
        rw.onchange = applyInputs;
        rh.onchange = applyInputs;
        rname.onchange = applyInputs;
        pivx.onchange = applyInputs;
        pivy.onchange = applyInputs;
    },

    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }
};


//==========================================================
// SECTION 17: DocsDoodads.EVENTS (REAL MZ EVENT CREATOR)
//==========================================================
DocsDoodads.Events = {
    allocateSafeId(mapData) {
        if (!mapData || !mapData.events) return 1;
        const events = mapData.events;
        for (let i = 1; i < events.length; i++) {
            if (!events[i]) return i;
        }
        return events.length > 0 ? events.length : 1;
    },

    // The MZ editor lists each Set Movement Route step as a 505 line after the 205 command and
    // stores route steps with indent: null. The game ignores 505s, but the editor needs them.
    withRouteDisplayLines(list) {
        const out = [];
        const source = JSON.parse(JSON.stringify(list));
        for (let i = 0; i < source.length; i++) {
            const command = source[i];
            out.push(command);
            if (command.code !== 205 || !command.parameters || !command.parameters[1] || !Array.isArray(command.parameters[1].list)) continue;
            const route = command.parameters[1].list;
            route.forEach(step => { if (step.code !== 0 && !('indent' in step)) step.indent = null; });
            if (source[i + 1] && source[i + 1].code === 505) continue; // already in editor form
            for (const step of route) {
                if (step.code === 0) continue;
                out.push({ code: 505, indent: command.indent || 0, parameters: [JSON.parse(JSON.stringify(step))] });
            }
        }
        return out;
    },

    createEventObject(id, x, y, options = {}) {
        const ev = {
            id: id,
            name: options.name || `EV${String(id).padStart(3, '0')}`,
            note: options.note || "",
            x: x,
            y: y,
            pages: [
                {
                    conditions: {
                        actorId: 1, actorValid: false,
                        itemId: 1, itemValid: false,
                        selfSwitchCh: "A", selfSwitchValid: false,
                        switch1Id: 1, switch1Valid: false,
                        switch2Id: 1, switch2Valid: false,
                        variableId: 1, variableValid: false, variableValue: 0
                    },
                    directionFix: options.directionFix !== undefined ? options.directionFix : false,
                    image: {
                        characterIndex: options.characterIndex !== undefined ? options.characterIndex : 0,
                        // MZ ImageManager appends ".png" itself.
                        characterName: String(options.characterName || "").replace(/\.png$/i, ""),
                        direction: options.direction || 2,
                        pattern: options.pattern || 1,
                        tileId: 0
                    },
                    list: this.withRouteDisplayLines(options.list || [{ code: 0, indent: 0, parameters: [] }]),
                    moveFrequency: 3,
                    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                    moveSpeed: 3,
                    moveType: 0,
                    priorityType: options.priorityType !== undefined ? options.priorityType : 1,
                    stepAnime: options.stepAnime !== undefined ? options.stepAnime : false,
                    through: options.through !== undefined ? options.through : false,
                    trigger: options.trigger !== undefined ? options.trigger : 0,
                    walkAnime: options.walkAnime !== undefined ? options.walkAnime : true
                }
            ]
        };
        return ev;
    }
};

//==========================================================
// SECTION 18: DocsDoodads.EVENTTEMPLATES (ALL 20 BUILT-INS + CUSTOM)
//==========================================================
DocsDoodads.EventTemplates = {
    customPath: 'data/DocsDoodadsEventTemplates.json',
    templates: {
        npc: {
            name: "NPC (Talkable)",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "NPC"] },
                { code: 401, indent: 0, parameters: ["Hello! Safe travels on your adventure."] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        door: {
            name: "Door (Interactive)",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: false,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Open1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 17 }, { code: 18 }, { code: 0 }], repeat: false, skippable: false, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        transfer_door: {
            name: "Transfer Door",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Move1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 10, 10, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        chest: {
            name: "Treasure Chest",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: true,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Chest1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 125, indent: 0, parameters: [1, 0, 0, 100] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Found 100 Gold!"] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        loot_pickup: {
            name: "Loot Pickup",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item3", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Obtained a Potion!"] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        signpost: {
            name: "Signpost",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "Notice"] },
                { code: 401, indent: 0, parameters: ["Beware of monsters ahead!"] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        floor_switch: {
            name: "Floor Switch",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        wall_lever: {
            name: "Wall Lever",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch2", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        save_point: {
            name: "Save Point",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Recovery", pan: 0, pitch: 100, volume: 90 }] },
                { code: 352, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        shopkeeper: {
            name: "Shopkeeper",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        enemy_encounter: {
            name: "Enemy Encounter",
            category: "Interaction",
            trigger: 1, priorityType: 1,
            list: [
                { code: 301, indent: 0, parameters: [0, 1, false, false] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        harvestable: {
            name: "Harvestable Herb/Ore",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        breakable: {
            name: "Breakable Object",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Collapse1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        pushable: {
            name: "Pushable Boulder",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 14 }, { code: 0 }], repeat: false, skippable: true, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        light_source: {
            name: "Light Source / Campfire",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        animated_prop: {
            name: "Animated Prop",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true, walkAnime: false,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        teleporter: {
            name: "Magical Teleporter",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Teleport", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 5, 5, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        ladder_stairs: {
            name: "Ladder / Stairs",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 201, indent: 0, parameters: [0, 1, 8, 2, 8, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        vehicle: {
            name: "Vehicle Boarding",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 354, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        decoration_event: {
            name: "Decoration Event (Passable)",
            category: "Atmosphere",
            trigger: 0, priorityType: 0, through: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        }
    },

    init() {
        const custom = DocsDoodads.FS.readJson(this.customPath);
        if (custom) {
            Object.assign(this.templates, custom);
        }
    },

    get(templateKey) {
        return this.templates[templateKey] || this.templates.npc;
    },

    saveCustomTemplate(name, eventObj, category = "Custom") {
        const key = 'custom_' + name.toLowerCase().replace(/\s+/g, '_');
        const page0 = eventObj.pages && eventObj.pages[0] ? eventObj.pages[0] : {};
        const tmpl = {
            name: name,
            category: category,
            trigger: page0.trigger !== undefined ? page0.trigger : 0,
            priorityType: page0.priorityType !== undefined ? page0.priorityType : 1,
            directionFix: page0.directionFix || false,
            stepAnime: page0.stepAnime || false,
            walkAnime: page0.walkAnime !== undefined ? page0.walkAnime : true,
            through: page0.through || false,
            list: JSON.parse(JSON.stringify(page0.list || [{ code: 0, indent: 0, parameters: [] }]))
        };
        this.templates[key] = tmpl;

        let customData = DocsDoodads.FS.readJson(this.customPath) || {};
        customData[key] = tmpl;
        DocsDoodads.FS.atomicWriteJson(this.customPath, customData);
        return key;
    }
};

DocsDoodads.EventTemplates.init();


//==========================================================
// SECTION 19: DocsDoodads.COLLISION (PRESETS & SAT RUNTIME)
//==========================================================
DocsDoodads.Collision = {
    presets: {
        none: null,
        full: { x: 0, y: 0, w: 1, h: 1 },
        bottomHalf: { x: 0, y: 0.5, w: 1, h: 0.5 },
        bottomThird: { x: 0, y: 0.67, w: 1, h: 0.33 },
        center: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
        trunk: { x: 0.35, y: 0.75, w: 0.3, h: 0.25 },
        thinWall: { x: 0, y: 0.4, w: 1, h: 0.2 },
        wideWall: { x: 0, y: 0.25, w: 1, h: 0.5 },
        custom: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }
    },

    getPresetShape(presetName) {
        return this.presets[presetName] || null;
    },

    // The solid footprint at the bottom of a sprite (a tree's trunk, a wall's base) as a shape
    // relative to the frame. Faint pixels such as soft shadows and anti-aliasing are ignored.
    footprintFromAlpha(data, width, height, options = {}) {
        const frame = options.frame || { x: 0, y: 0, w: width, h: height };
        const threshold = options.alphaThreshold !== undefined ? options.alphaThreshold : 48;
        const fw = Math.max(1, Math.min(frame.w, width - frame.x));
        const fh = Math.max(1, Math.min(frame.h, height - frame.y));
        const solid = (px, py) => data[((frame.y + py) * width + frame.x + px) * 4 + 3] >= threshold;

        let top = -1, bottom = -1;
        for (let py = 0; py < fh; py++) {
            for (let px = 0; px < fw; px++) {
                if (solid(px, py)) {
                    if (top < 0) top = py;
                    bottom = py;
                    break;
                }
            }
        }
        if (bottom < 0) return null;

        const contentH = bottom - top + 1;
        const ratio = options.bandRatio !== undefined ? options.bandRatio : 0.25;
        const minBand = options.minBandPx !== undefined ? options.minBandPx : 4;
        const maxBand = options.maxBandPx !== undefined ? options.maxBandPx : 32;
        const band = Math.max(1, Math.min(contentH, Math.max(minBand, Math.min(maxBand, Math.round(contentH * ratio)))));
        const bandTop = bottom - band + 1;
        const columnFill = options.columnFill !== undefined ? options.columnFill : 0.3;

        let minCol = -1, maxCol = -1;
        for (let px = 0; px < fw; px++) {
            let count = 0;
            for (let py = bandTop; py <= bottom; py++) if (solid(px, py)) count++;
            if (count / band >= columnFill) {
                if (minCol < 0) minCol = px;
                maxCol = px;
            }
        }
        if (minCol < 0) return null;
        const round = v => Math.round(v * 10000) / 10000;
        return { x: round(minCol / fw), y: round(bandTop / fh), w: round((maxCol - minCol + 1) / fw), h: round(band / fh) };
    }
};

if (typeof Game_CharacterBase !== 'undefined') {
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (!_Game_CharacterBase_canPass.apply(this, arguments)) return false;

        const doodads = DocsDoodads.doodads();
        if (!doodads || doodads.length === 0) return true;

        const targetMapX = $gameMap.roundXWithDirection(x, d);
        const targetMapY = $gameMap.roundYWithDirection(y, d);
        const targetPx = targetMapX * 48 + 24;
        const targetPy = targetMapY * 48 + 24;
        const playerSATBox = DocsDoodads.box(targetPx, targetPy, 32, 32);

        for (const dData of doodads) {
            if (dData.collision && dData.collision.preset !== "none") {
                const shape = dData.collision.shape || DocsDoodads.Collision.getPresetShape(dData.collision.preset);
                if (shape) {
                    const dw = (dData.frameW || 48) * (dData.scaleX || 1);
                    const dh = (dData.frameH || 48) * (dData.scaleY || 1);
                    const ax = dData.anchorX !== undefined ? dData.anchorX : 0.5;
                    const ay = dData.anchorY !== undefined ? dData.anchorY : 1.0;

                    const originX = dData.x - dw * ax;
                    const originY = dData.y - dh * ay;

                    const colX = originX + shape.x * dw + (shape.w * dw) / 2;
                    const colY = originY + shape.y * dh + (shape.h * dh) / 2;
                    const colW = shape.w * dw;
                    const colH = shape.h * dh;

                    const colBody = DocsDoodads.box(colX, colY, colW, colH);
                    if (DocsDoodads.judge(colBody, playerSATBox)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
}

//==========================================================
// SECTION 19B: PLACEMENT TOOLS (PATHS, SCATTER, GUIDES, PREFABS, MAP LINKS)
//==========================================================
DocsDoodads.Paths = {
    // Catmull-Rom through the clicked points; the ends stay where they were clicked.
    smooth(points, steps = 8) {
        if (!points || points.length < 3) return (points || []).slice();
        const out = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
            for (let s = 0; s < steps; s++) {
                const t = s / steps, t2 = t * t, t3 = t2 * t;
                const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
                out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
            }
        }
        out.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
        return out;
    },

    angleOf(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    },

    // Evenly spaced placements along the path. Sharp turns become "corner" pieces at the vertex,
    // and each straight run is spaced so its pieces meet the corners exactly.
    sample(points, spacing, options = {}) {
        const pts = (options.smooth ? this.smooth(points) : points || []).map(p => ({ x: p.x, y: p.y }));
        if (pts.length === 0) return [];
        if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y, angle: 0, kind: 'start' }];
        spacing = Math.max(4, Number(spacing) || 48);
        const cornerAngle = options.cornerAngle !== undefined ? options.cornerAngle : 35;

        // Split the polyline into runs at sharp vertices.
        const runs = [];
        let run = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            run.push(pts[i]);
            if (i < pts.length - 1 && !options.smooth) {
                let turn = Math.abs(this.angleOf(pts[i], pts[i + 1]) - this.angleOf(pts[i - 1], pts[i])) % 360;
                if (turn > 180) turn = 360 - turn;
                if (turn >= cornerAngle) {
                    runs.push(run);
                    run = [pts[i]];
                }
            }
        }
        runs.push(run);

        const out = [];
        runs.forEach((r, runIndex) => {
            const lengths = [];
            let total = 0;
            for (let i = 1; i < r.length; i++) {
                const len = Math.hypot(r[i].x - r[i - 1].x, r[i].y - r[i - 1].y);
                lengths.push(len);
                total += len;
            }
            const n = Math.max(1, Math.round(total / spacing));
            const pointAt = (dist) => {
                let seg = 0;
                while (seg < lengths.length - 1 && dist > lengths[seg]) { dist -= lengths[seg]; seg++; }
                const a = r[seg], b = r[seg + 1];
                const k = lengths[seg] > 0 ? Math.min(1, dist / lengths[seg]) : 0;
                return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: this.angleOf(a, b) };
            };
            for (let i = runIndex === 0 ? 0 : 1; i <= n; i++) {
                const p = pointAt(total * i / n);
                const isFirst = runIndex === 0 && i === 0;
                const isLast = runIndex === runs.length - 1 && i === n;
                const kind = isFirst ? 'start' : isLast ? 'end' : i === n ? 'corner' : 'segment';
                out.push({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, angle: Math.round(p.angle * 100) / 100, kind });
            }
        });
        return out;
    }
};

DocsDoodads.Scatter = {
    // Small seeded generator so a stroke can be reproduced in tests.
    rng(seed) {
        let a = (Number(seed) || 1) >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    // Poisson-disk style dart throwing: no two props closer than minDistance, existing props included.
    candidates(center, radius, minDistance, existing, count, rng, maxAttempts) {
        const accepted = [];
        const others = (existing || []).slice();
        const attempts = maxAttempts || Math.max(30, count * 30);
        for (let i = 0; i < attempts && accepted.length < count; i++) {
            const angle = rng() * Math.PI * 2;
            const dist = radius * Math.sqrt(rng());
            const p = { x: center.x + Math.cos(angle) * dist, y: center.y + Math.sin(angle) * dist };
            if (minDistance > 0 && others.some(o => Math.hypot(o.x - p.x, o.y - p.y) < minDistance)) continue;
            accepted.push(p);
            others.push(p);
        }
        return accepted;
    },

    parseIdList(text) {
        return String(text || '').split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10)).filter(n => n > 0);
    },

    allowed(point, rules, query) {
        const tw = query.tileWidth || 48, th = query.tileHeight || 48;
        const tx = Math.floor(point.x / tw), ty = Math.floor(point.y / th);
        if (point.x < 0 || point.y < 0 || tx >= query.width || ty >= query.height) return false;
        rules = rules || {};
        if (rules.regions && rules.regions.length > 0 && !rules.regions.includes(query.regionId(tx, ty))) return false;
        if (rules.terrainTags && rules.terrainTags.length > 0 && !rules.terrainTags.includes(query.terrainTag(tx, ty))) return false;
        if (rules.avoidBlocked && !query.isPassable(tx, ty)) return false;
        return true;
    },

    variation(settings, rng) {
        const jitter = (amount) => (rng() * 2 - 1) * (Number(amount) || 0);
        return {
            scale: Math.round((1 + jitter(settings.scaleJitter)) * 100) / 100,
            rotation: Math.round(jitter(settings.rotateJitter)),
            flipX: rng() < (Number(settings.flipChance) || 0),
            hue: Math.round(jitter(settings.hueJitter))
        };
    }
};

DocsDoodads.Guides = {
    rectOf(d) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1);
        return { left, right: left + w, top, bottom: top + h, cx: left + w / 2, cy: top + h / 2 };
    },

    unionRect(rects) {
        const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (const x of rects) {
            r.left = Math.min(r.left, x.left); r.right = Math.max(r.right, x.right);
            r.top = Math.min(r.top, x.top); r.bottom = Math.max(r.bottom, x.bottom);
        }
        r.cx = (r.left + r.right) / 2;
        r.cy = (r.top + r.bottom) / 2;
        return r;
    },

    // Edge/centre alignment first; otherwise equal spacing between the nearest neighbours.
    snap(moving, others, threshold = 6) {
        const result = { dx: 0, dy: 0, lines: [] };
        const m = Object.assign({}, moving);
        if (m.cx === undefined) m.cx = (m.left + m.right) / 2;
        if (m.cy === undefined) m.cy = (m.top + m.bottom) / 2;
        const rects = (others || []).map(o => Object.assign({ cx: (o.left + o.right) / 2, cy: (o.top + o.bottom) / 2 }, o));

        const axis = (keys, crossFrom, crossTo, name) => {
            let best = null;
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        const diff = o[ok] - m[mk];
                        if (Math.abs(diff) <= threshold && (best === null || Math.abs(diff) < Math.abs(best))) best = diff;
                    }
                }
            }
            if (best === null) return null;
            const lines = [];
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        if (Math.abs(o[ok] - (m[mk] + best)) < 0.01) {
                            lines.push({ axis: name, at: o[ok], from: Math.min(o[crossFrom], m[crossFrom]), to: Math.max(o[crossTo], m[crossTo]) });
                        }
                    }
                }
            }
            return { delta: best, lines };
        };

        const spacing = (lo, hi, crossLo, crossHi, name) => {
            const overlapping = rects.filter(o => o[crossLo] < m[crossHi] && o[crossHi] > m[crossLo]);
            const before = overlapping.filter(o => o[hi] <= m[lo]).sort((a, b) => b[hi] - a[hi])[0];
            const after = overlapping.filter(o => o[lo] >= m[hi]).sort((a, b) => a[lo] - b[lo])[0];
            if (!before || !after) return null;
            const gap1 = m[lo] - before[hi], gap2 = after[lo] - m[hi];
            if (Math.abs(gap1 - gap2) > threshold * 2) return null;
            const delta = (gap2 - gap1) / 2;
            const mid = (m[crossLo] + m[crossHi]) / 2;
            return { delta, lines: [
                { axis: name, kind: 'spacing', at: mid, from: before[hi], to: m[lo] + delta },
                { axis: name, kind: 'spacing', at: mid, from: m[hi] + delta, to: after[lo] }
            ] };
        };

        const x = axis(['left', 'cx', 'right'], 'top', 'bottom', 'x') || spacing('left', 'right', 'top', 'bottom', 'x-gap');
        const y = axis(['top', 'cy', 'bottom'], 'left', 'right', 'y') || spacing('top', 'bottom', 'left', 'right', 'y-gap');
        if (x) { result.dx = x.delta; result.lines.push(...x.lines); }
        if (y) { result.dy = y.delta; result.lines.push(...y.lines); }
        return result;
    }
};

DocsDoodads.Prefabs = {
    filePath: 'data/DocsDoodadsPrefabs.json',
    list: [],
    loaded: false,

    load() {
        const data = DocsDoodads.FS.readJson(this.filePath);
        this.list = data && Array.isArray(data.prefabs) ? data.prefabs : [];
        this.loaded = true;
        return this.list;
    },

    ensureLoaded() {
        if (!this.loaded) this.load();
        return this.list;
    },

    save() {
        return DocsDoodads.FS.atomicWriteJson(this.filePath, { version: 1, prefabs: this.list });
    },

    get(id) {
        return this.ensureLoaded().find(p => p.id === id) || null;
    },

    add(prefab) {
        this.ensureLoaded().push(prefab);
        return prefab;
    },

    remove(id) {
        const index = this.ensureLoaded().findIndex(p => p.id === id);
        if (index >= 0) this.list.splice(index, 1);
        return index >= 0;
    },

    newId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    },

    cleanDoodad(d) {
        const copy = JSON.parse(JSON.stringify(d));
        for (const key of ['groupId', 'prefabRef', 'locked', 'uid', 'mirrorOf', 'editorHidden']) delete copy[key];
        return copy;
    },

    // The origin is the bottom-centre of the doodads' anchor points; events keep tile offsets from it.
    originFor(doodads, events, tw, th) {
        if (doodads.length > 0) {
            const xs = doodads.map(d => d.x), ys = doodads.map(d => d.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.max(...ys) };
        }
        if (events.length > 0) {
            const xs = events.map(e => e.x), ys = events.map(e => e.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2 * tw + tw / 2), y: (Math.max(...ys) + 1) * th };
        }
        return { x: 0, y: 0 };
    },

    capture(name, doodads, events, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        doodads = (doodads || []).filter(Boolean);
        events = (events || []).filter(Boolean);
        const origin = this.originFor(doodads, events, tw, th);
        const originTile = { x: Math.floor(origin.x / tw), y: Math.floor((origin.y - 1) / th) };
        const first = doodads.find(d => d.bit && d.bit[0] === 3);
        return {
            id: this.newId('pf_'),
            name: String(name || 'Prefab').trim() || 'Prefab',
            createdAt: Date.now(),
            origin,
            thumbnail: first ? first.bit[1] : '',
            doodads: doodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - origin.x, y: d.y - origin.y })),
            events: events.map(e => Object.assign(JSON.parse(JSON.stringify(e)), { dx: e.x - originTile.x, dy: e.y - originTile.y }))
        };
    },

    instantiate(prefab, at, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        const instance = options.instance || this.newId('pi_');
        const groupId = options.groupId || ('grp_' + instance);
        const atTile = { x: Math.floor(at.x / tw), y: Math.floor((at.y - 1) / th) };
        const doodads = (prefab.doodads || []).map(src => {
            const d = JSON.parse(JSON.stringify(src));
            d.x = Math.round(at.x + src.x);
            d.y = Math.round(at.y + src.y);
            d.groupId = groupId;
            d.prefabRef = { id: prefab.id, instance, ox: at.x, oy: at.y };
            return d;
        });
        const events = (prefab.events || []).map(src => {
            const e = JSON.parse(JSON.stringify(src));
            e.x = atTile.x + src.dx;
            e.y = atTile.y + src.dy;
            delete e.dx;
            delete e.dy;
            e.id = options.allocateEventId ? options.allocateEventId(e) : null;
            return e;
        });
        return { instance, groupId, doodads, events };
    },

    // Recaptures the master's doodads from one placed copy (its events are left as they were).
    updateFromInstance(prefab, instanceDoodads) {
        if (!prefab || !instanceDoodads || instanceDoodads.length === 0) return null;
        const ref = instanceDoodads[0].prefabRef;
        prefab.doodads = instanceDoodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - ref.ox, y: d.y - ref.oy }));
        const first = instanceDoodads.find(d => d.bit && d.bit[0] === 3);
        if (first) prefab.thumbnail = first.bit[1];
        prefab.updatedAt = Date.now();
        return prefab;
    }
};

DocsDoodads.MapLinks = {
    sides: ['east', 'west', 'north', 'south'],

    ensureUid(d) {
        if (!d.uid) d.uid = 'dd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        return d;
    },

    // Copies of doodads that hang over this map's edges, shifted into each neighbouring map.
    edgeCopies(mapId, doodads, neighbors, sizeOf) {
        const out = [];
        const size = sizeOf(mapId);
        if (!size || !neighbors) return out;
        for (const d of doodads || []) {
            if (!d || d.mirrorOf || d.posMode === 0) continue;
            const r = DocsDoodads.Guides.rectOf(d);
            const shifts = [];
            if (neighbors.east && r.right > size.w) shifts.push({ mapId: neighbors.east, dx: -size.w, dy: 0 });
            if (neighbors.west && r.left < 0) { const s = sizeOf(neighbors.west); if (s) shifts.push({ mapId: neighbors.west, dx: s.w, dy: 0 }); }
            if (neighbors.south && r.bottom > size.h) shifts.push({ mapId: neighbors.south, dx: 0, dy: -size.h });
            if (neighbors.north && r.top < 0) { const s = sizeOf(neighbors.north); if (s) shifts.push({ mapId: neighbors.north, dx: 0, dy: s.h }); }
            for (const shift of shifts) {
                const copy = DocsDoodads.Prefabs.cleanDoodad(d);
                copy.x = d.x + shift.dx;
                copy.y = d.y + shift.dy;
                copy.mirrorOf = { mapId, uid: d.uid };
                out.push({ mapId: Number(shift.mapId), doodad: copy });
            }
        }
        return out;
    }
};

//==========================================================
// SECTION 20: DocsDoodads.UNDO (COMMAND-BASED HISTORY STACK)
//==========================================================
DocsDoodads.Undo = {
    undoStack: [],
    redoStack: [],
    maxDepth: 300,

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.updateUndoButtons();
    },

    execute(command) {
        if (!command || !command.apply || !command.revert) return;
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = [];
        DocsDoodads.Workspace.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playCancel();
        return true;
    },

    redo() {
        if (this.redoStack.length === 0) return false;
        const cmd = this.redoStack.pop();
        cmd.apply();
        this.undoStack.push(cmd);
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playOk();
        return true;
    }
};

//==========================================================
// SECTION 21: DocsDoodads.PERSISTENCE & RECOVERY
//==========================================================
DocsDoodads.Persistence = {
    sessionSnapshots: {},
    dirtyMap: false,
    dirtyDoodads: false,
    // Unsaved event edits for maps other than the current one, keyed by map id.
    stagedMaps: {},

    mapFilePath(mapId) {
        return `data/Map${String(mapId).padStart(3, '0')}.json`;
    },

    captureSession() {
        if (!window.$gameMap) return;
        const mapFile = this.mapFilePath($gameMap.mapId());
        this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
    },

    // The staged (editable) copy of a map's data, loaded from disk the first time it is needed.
    // It is tagged with its map id so edits can never be written into a different map's file.
    stagedFor(mapId) {
        const gameMap = window.$gameMap;
        if (!gameMap) return null;
        mapId = mapId || gameMap.mapId();
        // Untagged staged data predates map tagging and always belongs to the current map.
        const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
        if (gameMap._stagedMapData && owner === mapId) {
            gameMap._stagedMapDataId = mapId;
            return gameMap._stagedMapData;
        }
        if (gameMap._stagedMapData) this.stagedMaps[owner] = gameMap._stagedMapData;
        let data = this.stagedMaps[mapId];
        delete this.stagedMaps[mapId];
        if (!data) {
            const mapFile = this.mapFilePath(mapId);
            if (!this.sessionSnapshots[mapFile]) this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
            data = DocsDoodads.FS.readJson(mapFile) || { events: [null] };
        }
        gameMap._stagedMapData = data;
        gameMap._stagedMapDataId = mapId;
        return data;
    },

    // Called before the game loads another map: park this map's staged edits and bring back the next one's.
    onMapChanging(fromId, toId) {
        const gameMap = window.$gameMap;
        if (!gameMap || fromId === toId) return;
        // Undo commands capture the map they were made on; they must not run against another map.
        DocsDoodads.Undo.clear();
        if (gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : fromId;
            if (this.dirtyMap) this.stagedMaps[owner] = gameMap._stagedMapData;
        }
        gameMap._stagedMapData = this.stagedMaps[toId] || null;
        if (gameMap._stagedMapData) {
            gameMap._stagedMapDataId = toId;
            delete this.stagedMaps[toId];
        } else {
            delete gameMap._stagedMapDataId;
        }
    },

    // Every map file this save will write: the current map's staged data plus any parked maps.
    pendingMapEntries() {
        const entries = [];
        const gameMap = window.$gameMap;
        if (gameMap && gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
            entries.push({ mapId: owner, data: gameMap._stagedMapData });
        }
        for (const [mapId, data] of Object.entries(this.stagedMaps)) {
            if (!entries.some(e => String(e.mapId) === String(mapId))) entries.push({ mapId: Number(mapId), data });
        }
        return entries;
    },

    checkConflict() {
        if (!window.$gameMap) return false;
        const files = new Set([this.mapFilePath($gameMap.mapId())]);
        for (const entry of this.pendingMapEntries()) files.add(this.mapFilePath(entry.mapId));
        for (const mapFile of files) {
            const snap = this.sessionSnapshots[mapFile];
            if (!snap) continue;
            const current = DocsDoodads.FS.stat(mapFile);
            if (!current) continue;
            if (current.mtimeMs !== snap.mtimeMs || current.size !== snap.size) return true;
        }
        return false;
    },

    saveAll(force = false) {
        if (!window.$gameMap) return false;
        if (!force && this.checkConflict()) {
            DocsDoodads.Workspace.showConflictModal();
            return false;
        }

        const doodadFile = 'data/' + dataFileName;
        const mapEntries = this.pendingMapEntries().map(e => ({ path: this.mapFilePath(e.mapId), data: e.data, indent: 2 }));
        const entries = mapEntries.concat([
            { path: doodadFile, data: window.$dataDocsDoodads || {}, indent: saveMode ? 0 : 2 },
            { path: DocsDoodads.AssetIndex.libraryPath, data: DocsDoodads.AssetIndex.data, indent: 2 }
        ]);

        try {
            for (const entry of entries) DocsDoodads.FS.createTimestampedBackup(entry.path);
        } catch (error) {
            DocsDoodads.Core.log('Backup creation failed; save cancelled.', error);
            DocsDoodads.Workspace.showToast(`Save cancelled: backup failed (${error.message || error}).`);
            return false;
        }

        const saveResult = DocsDoodads.FS.atomicWriteManyJson(entries);
        if (!saveResult.ok) {
            DocsDoodads.Core.log('Project save transaction failed.', saveResult.error);
            DocsDoodads.Workspace.showToast(`Save failed${saveResult.rolledBack ? '; previous files restored' : ''}: ${saveResult.error}`);
            return false;
        }

        for (const entry of mapEntries) this.sessionSnapshots[entry.path] = DocsDoodads.FS.stat(entry.path);
        this.stagedMaps = {};

        this.dirtyMap = false;
        this.dirtyDoodads = false;
        this.clearRecovery();
        const extra = mapEntries.length > 1 ? ` (${mapEntries.length} maps)` : '';
        DocsDoodads.Workspace.showToast(`Project Saved${extra}! Reload maps in MZ before editing there.`);
        return true;
    },

    // Snapshots written during this Playtest run are its own autosaves, not crash leftovers.
    bootedAt: Date.now(),

    recoverableSnapshot() {
        const recovery = DocsDoodads.FS.readJson('data/DocsDoodadsRecovery.json');
        if (!recovery || !recovery.timestamp) return null;
        if (recovery.timestamp >= this.bootedAt) return null;
        if (this.bootedAt - recovery.timestamp >= 86400000) return null;
        return recovery;
    },

    clearRecovery() {
        const recoveryPath = 'data/DocsDoodadsRecovery.json';
        for (const filePath of [recoveryPath, DocsDoodads.Legacy.pathFor(recoveryPath)]) {
            if (DocsDoodads.FS.fs && DocsDoodads.FS.fs.existsSync(filePath)) {
                try { DocsDoodads.FS.fs.unlinkSync(filePath); } catch(e) {}
            }
        }
    }
};

//==========================================================
// SECTION 22: DocsDoodads.LAYOUT (MULTIPLE SAVED LAYOUTS)
//==========================================================
DocsDoodads.Layout = {
    filePath: 'data/DocsDoodadsLayouts.json',
    presets: {
        Mapping: { drawerWidth: 360, inspectorWidth: 280, thumbSize: 96, viewMode: 'grid' },
        Events: { drawerWidth: 320, inspectorWidth: 380, thumbSize: 80, viewMode: 'grid' },
        Characters: { drawerWidth: 420, inspectorWidth: 260, thumbSize: 128, viewMode: 'grid' },
        Tiles: { drawerWidth: 380, inspectorWidth: 260, thumbSize: 48, viewMode: 'compact' },
        Compact: { drawerWidth: 280, inspectorWidth: 240, thumbSize: 64, viewMode: 'list' }
    },
    custom: {},
    current: defaultLayoutName,

    init() {
        try {
            const data = DocsDoodads.FS.readJson(this.filePath);
            if (data && typeof data === 'object') {
                this.custom = data;
            } else {
                this.custom = {};
            }
        } catch(e) {
            this.custom = {};
        }
    },

    get(layoutName) {
        return this.custom[layoutName] || this.presets[layoutName] || this.presets.Mapping;
    },

    getAllNames() {
        this.init();
        const pNames = Object.keys(this.presets);
        const cNames = Object.keys(this.custom);
        return [...pNames, ...cNames.filter(n => !pNames.includes(n))];
    },

    saveCurrentAs(name) {
        if (!name || name.trim() === '') return false;
        name = name.trim();
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        const zoom = document.getElementById('dd-thumb-zoom');
        const layoutData = {
            drawerWidth: drawer ? (parseInt(drawer.style.width, 10) || 360) : 360,
            inspectorWidth: inspector ? (parseInt(inspector.style.width, 10) || 280) : 280,
            thumbSize: zoom ? (parseInt(zoom.value, 10) || 96) : 96,
            viewMode: 'grid'
        };
        this.custom[name] = layoutData;
        DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
        this.current = name;
        return true;
    },

    deleteCustomLayout(name) {
        if (this.custom[name]) {
            delete this.custom[name];
            DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
            if (this.current === name) this.apply('Mapping');
            return true;
        }
        return false;
    },

    apply(layoutName) {
        this.init();
        this.current = layoutName;
        const cfg = this.get(layoutName);
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        if (drawer) drawer.style.width = cfg.drawerWidth + 'px';
        if (inspector) inspector.style.width = cfg.inspectorWidth + 'px';
        const zoom = document.getElementById('dd-thumb-zoom');
        if (zoom) {
            zoom.value = cfg.thumbSize;
            if (DocsDoodads.Workspace) {
                DocsDoodads.Workspace.thumbSize = cfg.thumbSize;
                DocsDoodads.Workspace.updateVirtualGrid(true);
            }
        }
        if (DocsDoodads.Workspace && typeof DocsDoodads.Workspace.refreshLayoutSelector === 'function') {
            DocsDoodads.Workspace.refreshLayoutSelector();
        }
    }
};

//==========================================================
// SECTION 23: DocsDoodads.AUDIO (PREVIEW & SOUND TRIGGERS)
//==========================================================
DocsDoodads.Audio = {
    currentPlaying: null,
    // The map's BGM/BGS from before the first BGM/BGS preview, restored when previews stop.
    _savedBackground: null,

    playPreview(asset) {
        if (!asset || asset.category !== 'Audio') return;
        const baseName = asset.fileName.replace(/\.[^/.]+$/, "");
        this.stopPreview();
        if (typeof AudioManager === 'undefined') return;

        const sound = { name: baseName, volume: 90, pitch: 100, pan: 0 };
        let type = 'se';
        if (asset.path.includes('/bgm/')) type = 'bgm';
        else if (asset.path.includes('/bgs/')) type = 'bgs';
        else if (asset.path.includes('/me/')) type = 'me';

        if ((type === 'bgm' || type === 'bgs') && !this._savedBackground) {
            this._savedBackground = { bgm: AudioManager.saveBgm(), bgs: AudioManager.saveBgs() };
        }
        if (type === 'bgm') AudioManager.playBgm(sound);
        else if (type === 'bgs') AudioManager.playBgs(sound);
        else if (type === 'me') AudioManager.playMe(sound); // MZ resumes the BGM after an ME
        else AudioManager.playSe(sound);
        this.currentPlaying = { type, name: baseName };
    },

    stopPreview() {
        const playing = this.currentPlaying;
        this.currentPlaying = null;
        if (!playing || typeof AudioManager === 'undefined') return;
        if (playing.type === 'se') AudioManager.stopSe();
        else if (playing.type === 'me') AudioManager.stopMe();
        else if (this._savedBackground) {
            const saved = this._savedBackground;
            this._savedBackground = null;
            AudioManager.replayBgm(saved.bgm);
            AudioManager.replayBgs(saved.bgs);
        }
    }
};

//==========================================================
// SECTION 24: DocsDoodads.IMPORT (TRANSACTIONAL EXPLORER INGESTION)
//==========================================================
DocsDoodads.Import = {
    imageExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp']),
    audioExtensions: new Set(['.ogg', '.m4a', '.wav']),
    destinations: [
        'img/doodads', 'img/characters', 'img/faces', 'img/parallaxes',
        'img/pictures', 'img/tilesets', 'audio/bgm', 'audio/bgs',
        'audio/me', 'audio/se'
    ],

    isSupported(filePath) {
        if (!DocsDoodads.FS.path) return false;
        const ext = DocsDoodads.FS.path.extname(filePath).toLowerCase();
        return this.imageExtensions.has(ext) || this.audioExtensions.has(ext);
    },

    detectDestination(filePath) {
        const path = DocsDoodads.FS.path;
        if (!path) return null;
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const lower = fileName.toLowerCase();
        const normalizedSource = String(filePath).replace(/\\/g, '/').toLowerCase();

        if (this.audioExtensions.has(ext)) {
            if (normalizedSource.includes('/bgm/') || /(^|[_\-.])bgm([_\-.]|$)/.test(lower)) return 'audio/bgm';
            if (normalizedSource.includes('/bgs/') || /(^|[_\-.])bgs([_\-.]|$)/.test(lower)) return 'audio/bgs';
            if (normalizedSource.includes('/me/') || /(^|[_\-.])me([_\-.]|$)/.test(lower)) return 'audio/me';
            return 'audio/se';
        }
        if (!this.imageExtensions.has(ext)) return null;

        if (normalizedSource.includes('/characters/') || lower.startsWith('$') || lower.includes('character') || lower.includes('actor')) return 'img/characters';
        if (normalizedSource.includes('/faces/') || lower.includes('face')) return 'img/faces';
        if (normalizedSource.includes('/parallaxes/') || lower.includes('parall')) return 'img/parallaxes';
        if (normalizedSource.includes('/pictures/') || /(^|[_\-.])pic(ture)?([_\-.]|$)/.test(lower)) return 'img/pictures';
        if (normalizedSource.includes('/tilesets/') || lower.includes('tile')) return 'img/tilesets';
        return 'img/doodads';
    },

    normalizeDestination(destination) {
        const normalized = String(destination || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
        return this.destinations.includes(normalized) ? normalized : null;
    },

    validateExecutionPlan(plan) {
        const path = DocsDoodads.FS.path;
        if (!path || !plan || !Array.isArray(plan.operations)) return 'Import plan is invalid.';
        const projectRoot = path.resolve(plan.projectRoot || '.');
        for (const operation of plan.operations) {
            if (!operation || !operation.source || !operation.destination || !this.isSupported(operation.source)) {
                return 'Import plan contains an invalid or unsupported operation.';
            }
            const destination = path.resolve(operation.destination);
            const relative = path.relative(projectRoot, destination).replace(/\\/g, '/');
            const insideProject = relative && !relative.startsWith('../') && relative !== '..' && !path.isAbsolute(relative);
            const insideAllowedFolder = this.destinations.some(folder => relative.startsWith(folder + '/'));
            if (!insideProject || !insideAllowedFolder) {
                return `Import destination is outside an allowed project asset folder: ${operation.destination}`;
            }
        }
        return null;
    },

    collectFiles(sourcePaths) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const files = [];
        const errors = [];
        // For files inside a dropped folder: their sub-folder path below that dropped folder ('' at its top level).
        const relativeDirs = new Map();
        if (!fs || !path) return { files, errors: [{ path: '', message: 'Filesystem access is unavailable.' }], relativeDirs };

        const pending = Array.from(sourcePaths || []).filter(Boolean).map(p => ({ current: path.resolve(String(p)), root: null }));
        while (pending.length > 0) {
            const { current, root } = pending.pop();
            try {
                const stat = fs.statSync(current);
                if (stat.isDirectory()) {
                    const children = fs.readdirSync(current).sort().reverse();
                    for (const child of children) pending.push({ current: path.join(current, child), root: root || current });
                } else if (stat.isFile()) {
                    files.push(current);
                    if (root) relativeDirs.set(current, path.relative(root, path.dirname(current)));
                }
            } catch (error) {
                errors.push({ path: current, message: error && error.message ? error.message : String(error) });
            }
        }
        files.sort((a, b) => a.localeCompare(b));
        return { files, errors, relativeDirs };
    },

    // Plain-language summary of a runAssetImport result for the toast.
    describeResult(result) {
        const path = DocsDoodads.FS.path;
        const baseName = (p) => path ? path.basename(String(p)) : String(p).split(/[\\/]/).pop();
        if (result.ok) {
            const parts = [`Imported ${result.imported.length} file(s)`];
            if (result.duplicates && result.duplicates.length) parts.push(`${result.duplicates.length} identical file(s) skipped`);
            if (result.skipped && result.skipped.length) parts.push(`${result.skipped.length} skipped because the name already exists`);
            return parts.join(', ') + '.';
        }
        if (result.cancelled) return `Import cancelled${result.rolledBack ? '; copied files were rolled back' : ''}.`;
        const collision = (result.errors || []).find(error => error.message === 'Destination already exists.');
        if (collision) return `Import cancelled: ${baseName(collision.destination || collision.path)} already exists. Nothing was imported.`;
        const reason = result.errors && result.errors[0] ? result.errors[0].message : 'Unknown import error';
        return `Import failed${result.rolledBack ? ' and was rolled back' : ''}: ${reason}`;
    },

    filesEqual(firstPath, secondPath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return false;
        try {
            const firstStat = fs.statSync(firstPath);
            const secondStat = fs.statSync(secondPath);
            if (firstStat.size !== secondStat.size) return false;
            return fs.readFileSync(firstPath).equals(fs.readFileSync(secondPath));
        } catch (error) {
            return false;
        }
    },

    planBatch(sourcePaths, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const plan = {
            projectRoot: path ? path.resolve(options.projectRoot || '.') : '.',
            collisionPolicy: options.collisionPolicy || 'rename',
            operations: [], unsupported: [], duplicates: [], skipped: [], errors: []
        };
        if (!fs || !path) {
            plan.errors.push({ path: '', message: 'Filesystem access is unavailable.' });
            return plan;
        }

        const collected = this.collectFiles(sourcePaths);
        plan.errors.push(...collected.errors);
        const reserved = new Map();

        for (const source of collected.files) {
            if (!this.isSupported(source)) {
                plan.unsupported.push(source);
                continue;
            }

            const requestedDestination = options.destination && options.destination !== 'auto'
                ? options.destination
                : this.detectDestination(source);
            const relativeFolder = this.normalizeDestination(requestedDestination);
            if (!relativeFolder) {
                plan.errors.push({ path: source, message: `Unsupported destination: ${requestedDestination}` });
                continue;
            }

            let targetFolder = path.resolve(plan.projectRoot, relativeFolder);
            // img/doodads belongs to this plugin and is scanned recursively, so folders inside a dropped
            // folder are kept there; RPG Maker's own folders (characters, faces, audio...) stay flat.
            const droppedDir = collected.relativeDirs && collected.relativeDirs.get(source);
            if (droppedDir && relativeFolder === 'img/doodads') {
                const segments = droppedDir.split(/[\\/]+/)
                    .filter(segment => segment && segment !== '.' && segment !== '..')
                    .map(segment => segment.replace(/[<>:"|?*\x00-\x1f]/g, '_'));
                if (segments.length) targetFolder = path.join(targetFolder, ...segments);
            }
            const rootPrefix = plan.projectRoot.endsWith(path.sep) ? plan.projectRoot : plan.projectRoot + path.sep;
            if (targetFolder !== plan.projectRoot && !targetFolder.startsWith(rootPrefix)) {
                plan.errors.push({ path: source, message: 'Import destination escapes the project root.' });
                continue;
            }

            const fileName = path.basename(source);
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            let destination = path.join(targetFolder, fileName);
            let overwrite = false;
            let suffix = 0;

            while (fs.existsSync(destination) || reserved.has(destination)) {
                const comparisonSource = reserved.has(destination) ? reserved.get(destination) : destination;
                if (this.filesEqual(source, comparisonSource)) {
                    plan.duplicates.push({ source, destination });
                    destination = null;
                    break;
                }

                const policy = typeof options.collisionPolicy === 'function'
                    ? options.collisionPolicy({ source, destination })
                    : plan.collisionPolicy;
                if (policy === 'skip') {
                    plan.skipped.push({ source, destination, reason: 'collision' });
                    destination = null;
                    break;
                }
                if (policy === 'overwrite') {
                    overwrite = true;
                    break;
                }
                if (policy === 'error') {
                    plan.errors.push({ path: source, destination, message: 'Destination already exists.' });
                    destination = null;
                    break;
                }
                suffix++;
                destination = path.join(targetFolder, `${base}_${suffix}${ext}`);
            }
            if (!destination) continue;

            reserved.set(destination, source);
            plan.operations.push({
                source,
                destination,
                relativeDestination: path.relative(plan.projectRoot, destination).replace(/\\/g, '/'),
                overwrite,
                kind: this.audioExtensions.has(path.extname(source).toLowerCase()) ? 'audio' : 'image'
            });
        }
        return plan;
    },

    executeBatch(plan) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const result = {
            ok: false,
            imported: [],
            overwritten: [],
            duplicates: (plan && plan.duplicates) ? plan.duplicates.slice() : [],
            skipped: (plan && plan.skipped) ? plan.skipped.slice() : [],
            unsupported: (plan && plan.unsupported) ? plan.unsupported.slice() : [],
            errors: (plan && plan.errors) ? plan.errors.slice() : [],
            rolledBack: false
        };
        if (!fs || !path || !plan || result.errors.length > 0) return result;
        const validationError = this.validateExecutionPlan(plan);
        if (validationError) {
            result.errors.push({ message: validationError });
            return result;
        }

        const completed = [];
        const tempFiles = [];
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try {
            for (let index = 0; index < plan.operations.length; index++) {
                const operation = plan.operations[index];
                DocsDoodads.FS.ensureDir(path.dirname(operation.destination));

                const existed = fs.existsSync(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.ddimport-${transactionId}.bak`;
                    fs.copyFileSync(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.ddimport-${transactionId}-${index}.tmp`;
                tempFiles.push(temporary);
                fs.copyFileSync(operation.source, temporary);
                if (existed) {
                    completed.push({ operation, existed, backup });
                    fs.copyFileSync(temporary, operation.destination);
                    fs.unlinkSync(temporary);
                } else {
                    fs.renameSync(temporary, operation.destination);
                    completed.push({ operation, existed, backup });
                }

                result.imported.push(operation.destination);
                if (existed) result.overwritten.push(operation.destination);
            }

            for (const record of completed) {
                if (record.backup && fs.existsSync(record.backup)) fs.unlinkSync(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.errors.push({ message: error && error.message ? error.message : String(error) });
            for (let index = completed.length - 1; index >= 0; index--) {
                const record = completed[index];
                try {
                    if (record.existed && record.backup && fs.existsSync(record.backup)) {
                        fs.copyFileSync(record.backup, record.operation.destination);
                    } else if (!record.existed && fs.existsSync(record.operation.destination)) {
                        fs.unlinkSync(record.operation.destination);
                    }
                } catch (rollbackError) {
                    result.errors.push({ path: record.operation.destination, message: `Rollback failed: ${rollbackError.message || rollbackError}` });
                }
            }
            for (const temporary of tempFiles) {
                try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch (cleanupError) {}
            }
            result.imported = [];
            result.overwritten = [];
            result.rolledBack = completed.length > 0;
            return result;
        }
    },

    async executeBatchAsync(plan, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const fsp = fs && fs.promises;
        const result = {
            ok: false,
            imported: [],
            overwritten: [],
            duplicates: (plan && plan.duplicates) ? plan.duplicates.slice() : [],
            skipped: (plan && plan.skipped) ? plan.skipped.slice() : [],
            unsupported: (plan && plan.unsupported) ? plan.unsupported.slice() : [],
            errors: (plan && plan.errors) ? plan.errors.slice() : [],
            rolledBack: false,
            cancelled: false
        };
        if (!fs || !path || !fsp || !plan || result.errors.length > 0) return result;
        const validationError = this.validateExecutionPlan(plan);
        if (validationError) {
            result.errors.push({ message: validationError });
            return result;
        }

        const completed = [];
        const tempFiles = [];
        const cancellationToken = options.cancellationToken || null;
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const exists = async filePath => {
            try { await fsp.stat(filePath); return true; } catch (error) { return false; }
        };
        const removeIfPresent = async filePath => {
            try { await fsp.unlink(filePath); } catch (error) {
                if (!error || error.code !== 'ENOENT') throw error;
            }
        };

        try {
            for (let index = 0; index < plan.operations.length; index++) {
                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }

                const operation = plan.operations[index];
                await fsp.mkdir(path.dirname(operation.destination), { recursive: true });
                const existed = await exists(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.ddimport-${transactionId}.bak`;
                    await fsp.copyFile(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.ddimport-${transactionId}-${index}.tmp`;
                tempFiles.push(temporary);
                await fsp.copyFile(operation.source, temporary);
                if (existed) {
                    completed.push({ operation, existed, backup });
                    await fsp.copyFile(temporary, operation.destination);
                    await removeIfPresent(temporary);
                } else {
                    await fsp.rename(temporary, operation.destination);
                    completed.push({ operation, existed, backup });
                }

                result.imported.push(operation.destination);
                if (existed) result.overwritten.push(operation.destination);
                if (typeof options.onProgress === 'function') {
                    options.onProgress({
                        completed: index + 1,
                        total: plan.operations.length,
                        source: operation.source,
                        destination: operation.destination
                    });
                }

                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }
            }

            for (const record of completed) {
                if (record.backup) await removeIfPresent(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.cancelled = Boolean(error && error.code === 'DD_IMPORT_CANCELLED');
            result.errors.push({ message: error && error.message ? error.message : String(error) });
            for (let index = completed.length - 1; index >= 0; index--) {
                const record = completed[index];
                try {
                    if (record.existed && record.backup && await exists(record.backup)) {
                        await fsp.copyFile(record.backup, record.operation.destination);
                    } else if (!record.existed) {
                        await removeIfPresent(record.operation.destination);
                    }
                } catch (rollbackError) {
                    result.errors.push({ path: record.operation.destination, message: `Rollback failed: ${rollbackError.message || rollbackError}` });
                }
            }
            for (const temporary of tempFiles) {
                try { await removeIfPresent(temporary); } catch (cleanupError) {}
            }
            result.imported = [];
            result.overwritten = [];
            result.rolledBack = completed.length > 0;
            return result;
        }
    },

    importBatch(sourcePaths, options = {}) {
        return this.executeBatch(this.planBatch(sourcePaths, options));
    }
};


//==========================================================
// SECTION 25: DocsDoodads.WORKSPACE (GLASSMORPHIC WORKSPACE UI & TOOLS)
//==========================================================
DocsDoodads.Workspace = {
    mounted: false,
    container: null,
    drawerEl: null,
    inspectorEl: null,
    selectedAsset: null,
    selectedDoodad: null,
    selectedEvent: null,
    currentCategory: 'All',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25, minDistance: 32, flipChance: 0.5, hueJitter: 0, regions: '', terrainTags: '', avoidBlocked: false },
    activeDragPayload: null,
    ghostEl: null,
    isBrushActive: false,
    currentBrushBatch: [],
    gridSnapShow: false,
    _clipboardDoodads: [],
    selectedDoodads: [],

    toggle() {
        if (this.mounted) this.close(); else this.open();
    },

    // One placement tool at a time; keeps the toolbar highlight and brush popover in sync.
    setPlacementTool(tool) {
        this.placementTool = tool || null;
        const buttons = { eyedropper: 'dd-eyedropper-btn', stamp: 'dd-stamp-btn', brush: 'dd-brush-btn', path: 'dd-path-btn' };
        for (const [name, id] of Object.entries(buttons)) {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('dd-btn-active', this.placementTool === name);
        }
        const brushPopover = document.getElementById('dd-brush-popover');
        if (brushPopover) brushPopover.style.display = this.placementTool === 'brush' ? 'block' : 'none';
        const pathPopover = document.getElementById('dd-path-popover');
        if (pathPopover) pathPopover.style.display = this.placementTool === 'path' ? 'block' : 'none';
        if (this.placementTool !== 'path') {
            this.pathPoints = [];
            this._pathHover = null;
        }
    },

    open() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs() || this.mounted) return;
        DocsDoodads.Persistence.captureSession();
        DocsDoodads.AssetIndex.init();
        this.buildDom();
        this.attachCanvasListeners();
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = true;
        }
        this.startAssetScan();
        this.showRecoveryNotices();

        // Check for recovery file
        const recovery = DocsDoodads.Persistence.recoverableSnapshot();
        if (recovery) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            if (confirm(`Unfinished session from ${dateStr} found. Would you like to recover it?`)) {
                this.applyRecovery(recovery);
                this.showToast(recovery.mapId && recovery.mapId !== this.currentMapId()
                    ? `Session recovered into map ${recovery.mapId}.` : "Session Recovered!");
            }
        }
    },

    close() {
        if (!this.mounted) return;
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        this.detachCanvasListeners();
        this.removeGhost();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = false;
        }
        this.placementTool = null;
        DocsDoodads.Audio.stopPreview();
    },

    // Puts a crash snapshot back on the map it was recorded on, never the map that happens to be open.
    applyRecovery(recovery) {
        if (!recovery || !window.$gameMap) return;
        const mapId = recovery.mapId || this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (Array.isArray(recovery.doodads)) {
            data[mapId] = recovery.doodads;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        if (recovery.mapSettings) data.mapSettings = recovery.mapSettings;
        if (recovery.stagedMap) {
            if (mapId === this.currentMapId()) {
                $gameMap._stagedMapData = recovery.stagedMap;
                $gameMap._stagedMapDataId = mapId;
            } else {
                DocsDoodads.Persistence.stagedMaps[mapId] = recovery.stagedMap;
            }
            DocsDoodads.Persistence.dirtyMap = true;
        }
        this.refreshSpriteset();
    },

    async startAssetScan() {
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        const token = { cancelled: false };
        this._assetScanToken = token;
        const status = document.getElementById('dd-status-right');
        const result = await DocsDoodads.AssetIndex.scanAsync({
            loadCache: false,
            cancellationToken: token,
            onProgress: progress => {
                if (status && !token.cancelled) status.textContent = `Indexing assets ${progress.completed}/${progress.total}`;
            }
        });
        if (this._assetScanToken !== token || token.cancelled || result.cancelled) return result;
        this._assetScanToken = null;
        if (this.mounted) {
            this.refreshDrawerCards();
            this.updateIndexStatus(result.removed);
            if (result.errors.length > 0) this.showToast(`Asset scan completed with ${result.errors.length} warning(s).`);
        }
        return result;
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'dd-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #dd-asset-workspace-root * { box-sizing: border-box; }
            .dd-glass {
                background: rgba(17, 24, 39, 0.92);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65);
                pointer-events: auto;
            }
            .dd-btn {
                background: #1f2937; color: #f1f5f9; border: 1px solid #374151;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .dd-btn:hover { background: #374151; border-color: #60a5fa; }
            #dd-category-tabs .dd-btn { padding: 4px 8px; font-size: 11px; white-space: nowrap; }
            .dd-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .dd-btn-primary:hover { background: #1d4ed8; }
            .dd-btn-active { background: #059669 !important; border-color: #10b981 !important; color: #fff !important; }
            .dd-card {
                background: #18202f; border: 1px solid #283548; border-radius: 6px;
                cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, border-color 0.15s;
            }
            .dd-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
            .dd-card.selected { border: 2px solid #60a5fa; background: #1e293b; }
            .dd-badge {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75);
                padding: 2px 5px; border-radius: 3px; font-size: 10px; color: #93c5fd;
            }
        `;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'dd-glass';
        toolbar.style.cssText = `
            position: absolute; top: 10px; left: 10px; right: 10px; height: 50px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
        `;
        toolbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">DOC'S DOODADS</span>
                <input type="text" id="dd-search-input" placeholder="Search (e.g. tree tag:prop -dead)"
                    style="width: 200px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="dd-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;"></select>
                <button class="dd-btn" id="dd-save-layout-btn" title="Save current panel sizes as custom layout">+ Layout</button>
                <button class="dd-btn" id="dd-del-layout-btn" title="Delete current custom layout" style="display: none; background: #7f1d1d; border-color: #991b1b; padding: 4px 8px;">✕</button>
                <button class="dd-btn" id="dd-undo-btn">Undo</button>
                <button class="dd-btn" id="dd-redo-btn">Redo</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="dd-btn" id="dd-eyedropper-btn" title="Eyedropper: Alt+Click map object">Eyedropper</button>
                <button class="dd-btn" id="dd-stamp-btn" title="Stamp: Click repeatedly to place">Stamp</button>
                <button class="dd-btn" id="dd-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <div id="dd-brush-popover" class="dd-glass" style="display: none; position: absolute; top: 58px; right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BRUSH SETTINGS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Radius:</span><span id="dd-brush-rad-val">80px</span>
                            </div>
                            <input type="range" id="dd-brush-rad" min="20" max="250" value="80" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Density:</span><span id="dd-brush-den-val">3</span>
                            </div>
                            <input type="range" id="dd-brush-den" min="1" max="10" value="3" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Scale Variation:</span><span id="dd-brush-scale-val">15%</span>
                            </div>
                            <input type="range" id="dd-brush-scale" min="0" max="50" value="15" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Rotation Variation:</span><span id="dd-brush-rot-val">25°</span>
                            </div>
                            <input type="range" id="dd-brush-rot" min="0" max="180" value="25" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Min Spacing:</span><span id="dd-brush-min-val">32px</span>
                            </div>
                            <input type="range" id="dd-brush-min" min="0" max="160" value="32" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Flip Chance:</span><span id="dd-brush-flip-val">50%</span>
                            </div>
                            <input type="range" id="dd-brush-flip" min="0" max="100" value="50" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Hue Variation:</span><span id="dd-brush-hue-val">0°</span>
                            </div>
                            <input type="range" id="dd-brush-hue" min="0" max="90" value="0" style="width: 100%;" />
                        </div>
                        <div style="color: #94a3b8;">Only on regions (e.g. 1, 2):
                            <input type="text" id="dd-brush-regions" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <div style="color: #94a3b8;">Only on terrain tags:
                            <input type="text" id="dd-brush-terrain" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-brush-avoid" /> Skip impassable tiles</label>
                    </div>
                </div>
                <button class="dd-btn" id="dd-path-btn" title="Path: click points, double-click or Enter to place props along them">Path</button>
                <div id="dd-path-popover" class="dd-glass" style="display: none; position: absolute; top: 58px; right: 380px; width: 250px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 6px;">PATH TOOL</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px; line-height: 1.4;">Click to add points. Double-click or Enter places the selected asset along them; Backspace removes the last point; Alt for off-grid points.</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Spacing:</span><span id="dd-path-spacing-val">48px</span></div>
                            <input type="range" id="dd-path-spacing" min="8" max="240" value="48" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Random Offset:</span><span id="dd-path-jitter-val">0px</span></div>
                            <input type="range" id="dd-path-jitter" min="0" max="24" value="0" style="width: 100%;" />
                        </div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-align" /> Turn pieces along the path</label>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-smooth" /> Smooth curve</label>
                        <div style="color: #94a3b8;">End piece: <span id="dd-path-end-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-end-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-end-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="color: #94a3b8;">Corner piece: <span id="dd-path-corner-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-corner-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-corner-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="display: flex; gap: 4px; margin-top: 4px;"><button class="dd-btn dd-btn-primary" id="dd-path-place" style="flex: 1;">Place Path</button><button class="dd-btn" id="dd-path-clear">Clear Points</button></div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-slicer-btn" title="Open Interactive Sprite Sheet Slicer">Slicer Modal</button>
                <button class="dd-btn" id="dd-stop-audio-btn" style="display: none; background: #be123c; border-color: #f43f5e;">⏹ Stop Audio</button>
                <button class="dd-btn" id="dd-diag-btn" title="Diagnostics">Diagnostics</button>
                <button class="dd-btn dd-btn-primary" id="dd-save-btn">Save Changes</button>
                <button class="dd-btn" id="dd-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'dd-glass';
        drawer.id = 'dd-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 70px; left: 10px; bottom: 32px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div id="dd-drawer-resizer" style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Drawer"></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; flex-wrap: wrap; gap: 4px;" id="dd-category-tabs">
                <button class="dd-btn dd-btn-primary" data-cat="All">All</button>
                <button class="dd-btn" data-cat="Characters">Characters</button>
                <button class="dd-btn" data-cat="Doodads">Doodads</button>
                <button class="dd-btn" data-cat="Tilesets">Tiles</button>
                <button class="dd-btn" data-cat="Pictures">Pictures</button>
                <button class="dd-btn" data-cat="Faces">Faces</button>
                <button class="dd-btn" data-cat="Battlers">Battlers</button>
                <button class="dd-btn" data-cat="Backgrounds">Backgrounds</button>
                <button class="dd-btn" data-cat="System">System</button>
                <button class="dd-btn" data-cat="Audio">Audio</button>
                <button class="dd-btn" data-cat="Prefabs" title="Saved prefabs: groups of doodads and events">Prefabs</button>
                <button class="dd-btn" data-cat="Favorites" title="Show Favorited Assets">★ Favs</button>
                <button class="dd-btn" data-cat="Recent" title="Show Recently Used Assets">🕒 Recent</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="dd-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="dd-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="dd-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; position: relative;">
                <div id="dd-cards-sizer" style="width: 100%; position: relative;">
                    <div id="dd-cards-viewport" style="position: absolute; top: 0; left: 0; right: 0; display: grid; gap: 8px;">
                    </div>
                </div>
            </div>
        `;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'dd-glass';
        inspector.id = 'dd-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 70px; right: 10px; bottom: 32px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        `;
        inspector.innerHTML = `
            <div id="dd-inspector-resizer" style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Inspector"></div>
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="dd-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or click a placed doodad/event on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'dd-glass';
        statusBar.style.cssText = `
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 24px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        `;
        statusBar.innerHTML = `
            <span id="dd-status-left">Doc's Doodads v${pluginVersion} Ready | Hold Alt for free placement</span>
            <span id="dd-status-right">Map ID: ${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        `;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    refreshLayoutSelector() {
        const layoutSel = document.getElementById('dd-layout-select');
        if (!layoutSel) return;
        const names = DocsDoodads.Layout.getAllNames();
        layoutSel.innerHTML = '';
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `Layout: ${name}`;
            if (name === DocsDoodads.Layout.current) opt.selected = true;
            layoutSel.appendChild(opt);
        }
        const delBtn = document.getElementById('dd-del-layout-btn');
        if (delBtn) {
            const isCustom = !DocsDoodads.Layout.presets[DocsDoodads.Layout.current];
            delBtn.style.display = isCustom ? 'inline-block' : 'none';
        }
    },

    bindEvents() {
        document.getElementById('dd-close-btn').onclick = () => this.close();
        document.getElementById('dd-save-btn').onclick = () => DocsDoodads.Persistence.saveAll();
        document.getElementById('dd-undo-btn').onclick = () => DocsDoodads.Undo.undo();
        document.getElementById('dd-redo-btn').onclick = () => DocsDoodads.Undo.redo();

        this.refreshLayoutSelector();
        const layoutSel = document.getElementById('dd-layout-select');
        if (layoutSel) {
            layoutSel.onchange = (e) => {
                DocsDoodads.Layout.apply(e.target.value);
            };
        }

        const saveLayoutBtn = document.getElementById('dd-save-layout-btn');
        if (saveLayoutBtn) {
            saveLayoutBtn.onclick = () => {
                const name = prompt("Enter a name for this custom layout:", "Custom Layout " + (Object.keys(DocsDoodads.Layout.custom).length + 1));
                if (name && name.trim()) {
                    DocsDoodads.Layout.saveCurrentAs(name.trim());
                    this.refreshLayoutSelector();
                    this.showToast(`Saved layout "${name.trim()}"!`);
                }
            };
        }

        const delLayoutBtn = document.getElementById('dd-del-layout-btn');
        if (delLayoutBtn) {
            delLayoutBtn.onclick = () => {
                const cur = DocsDoodads.Layout.current;
                if (confirm(`Delete custom layout "${cur}"?`)) {
                    DocsDoodads.Layout.deleteCustomLayout(cur);
                    this.refreshLayoutSelector();
                    this.showToast(`Deleted layout "${cur}".`);
                }
            };
        }

        // Draggable Drawer Resizer
        const drawerResizer = document.getElementById('dd-drawer-resizer');
        if (drawerResizer && this.drawerEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            drawerResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.drawerEl.style.width, 10) || 360;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
                    this.drawerEl.style.width = newW + 'px';
                    this.updateVirtualGrid(true);
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        // Draggable Inspector Resizer
        const inspectorResizer = document.getElementById('dd-inspector-resizer');
        if (inspectorResizer && this.inspectorEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            inspectorResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.inspectorEl.style.width, 10) || 280;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(600, startWidth - (ev.clientX - startX)));
                    this.inspectorEl.style.width = newW + 'px';
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        const searchInput = document.getElementById('dd-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
        };

        const container = document.getElementById('dd-cards-container');
        if (container) {
            container.onscroll = () => this.updateVirtualGrid();
        }

        const zoomSlider = document.getElementById('dd-thumb-zoom');
        zoomSlider.oninput = (e) => {
            this.thumbSize = Number(e.target.value);
            this.updateVirtualGrid(true);
        };

        const catTabs = document.getElementById('dd-category-tabs');
        catTabs.onclick = (e) => {
            if (e.target.dataset.cat) {
                catTabs.querySelectorAll('button').forEach(b => b.className = 'dd-btn');
                e.target.className = 'dd-btn dd-btn-primary';
                this.currentCategory = e.target.dataset.cat;
                this.refreshDrawerCards();
            }
        };

        document.getElementById('dd-slicer-btn').onclick = () => {
            if (this.selectedAsset) DocsDoodads.Slicing.Editor.open(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
        };

        document.getElementById('dd-diag-btn').onclick = () => this.openDiagnosticsModal();

        document.getElementById('dd-stop-audio-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            document.getElementById('dd-stop-audio-btn').style.display = 'none';
        };

        document.getElementById('dd-eyedropper-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'eyedropper' ? null : 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper Active: Click any object on map" : "Eyedropper Deactivated");
        };
        document.getElementById('dd-stamp-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'stamp' ? null : 'stamp');
            this.showToast(this.placementTool ? "Stamp Active: Click map to place repeatedly" : "Stamp Deactivated");
        };
        document.getElementById('dd-brush-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'brush' ? null : 'brush');
            this.showToast(this.placementTool ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
        };

        const setupBrushSlider = (id, prop, valId, suffix, mult = 1) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (el && valEl) {
                el.oninput = (ev) => {
                    const num = parseFloat(ev.target.value);
                    this.brushSettings[prop] = mult !== 1 ? num * mult : num;
                    valEl.textContent = num + suffix;
                };
            }
        };
        setupBrushSlider('dd-brush-rad', 'radius', 'dd-brush-rad-val', 'px');
        setupBrushSlider('dd-brush-den', 'density', 'dd-brush-den-val', '');
        setupBrushSlider('dd-brush-scale', 'scaleJitter', 'dd-brush-scale-val', '%', 0.01);
        setupBrushSlider('dd-brush-rot', 'rotateJitter', 'dd-brush-rot-val', '°');
        setupBrushSlider('dd-brush-min', 'minDistance', 'dd-brush-min-val', 'px');
        setupBrushSlider('dd-brush-flip', 'flipChance', 'dd-brush-flip-val', '%', 0.01);
        setupBrushSlider('dd-brush-hue', 'hueJitter', 'dd-brush-hue-val', '°');
        document.getElementById('dd-brush-regions').oninput = (ev) => { this.brushSettings.regions = ev.target.value; };
        document.getElementById('dd-brush-terrain').oninput = (ev) => { this.brushSettings.terrainTags = ev.target.value; };
        document.getElementById('dd-brush-avoid').onchange = (ev) => { this.brushSettings.avoidBlocked = Boolean(ev.target.checked); };

        document.getElementById('dd-path-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'path' ? null : 'path');
            this.showToast(this.placementTool ? "Path Active: click points on the map" : "Path Deactivated");
        };
        const pathSlider = (id, prop) => {
            const input = document.getElementById(id);
            input.oninput = (ev) => {
                this.pathSettings[prop] = parseFloat(ev.target.value) || 0;
                document.getElementById(id + '-val').textContent = ev.target.value + 'px';
            };
        };
        pathSlider('dd-path-spacing', 'spacing');
        pathSlider('dd-path-jitter', 'jitter');
        document.getElementById('dd-path-align').onchange = (ev) => { this.pathSettings.alignToPath = Boolean(ev.target.checked); };
        document.getElementById('dd-path-smooth').onchange = (ev) => { this.pathSettings.smooth = Boolean(ev.target.checked); };
        const pieceButtons = (kind, prop) => {
            const label = document.getElementById(`dd-path-${kind}-name`);
            document.getElementById(`dd-path-${kind}-btn`).onclick = () => {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('Select an image asset in the drawer first.');
                    return;
                }
                this.pathSettings[prop] = this.selectedAsset;
                label.textContent = this.selectedAsset.fileName;
            };
            document.getElementById(`dd-path-${kind}-clear`).onclick = () => {
                this.pathSettings[prop] = null;
                label.textContent = 'same as path';
            };
        };
        pieceButtons('end', 'endAsset');
        pieceButtons('corner', 'cornerAsset');
        document.getElementById('dd-path-place').onclick = () => this.finishPath();
        document.getElementById('dd-path-clear').onclick = () => { this.pathPoints = []; };
    },

    refreshDrawerCards() {
        let filtered = DocsDoodads.AssetIndex.list;
        if (this.currentCategory === 'Prefabs') {
            filtered = this.prefabAssets();
        } else if (this.currentCategory === 'Favorites') {
            filtered = filtered.filter(a => a.favorite);
        } else if (this.currentCategory === 'Recent') {
            filtered = filtered.filter(a => a.usage && a.usage.lastUsedAt > 0)
                               .sort((a, b) => (b.usage.lastUsedAt || 0) - (a.usage.lastUsedAt || 0));
        } else if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = DocsDoodads.Search.filter(filtered, this.searchQuery);
        this.filteredAssets = filtered;

        const countEl = document.getElementById('dd-asset-count');
        if (countEl) countEl.textContent = `Assets: ${filtered.length}`;

        const container = document.getElementById('dd-cards-container');
        if (container) container.scrollTop = 0;

        this.updateVirtualGrid(true);
    },

    updateVirtualGrid(forceRecalculate = false) {
        const container = document.getElementById('dd-cards-container');
        const sizer = document.getElementById('dd-cards-sizer');
        const viewport = document.getElementById('dd-cards-viewport');
        if (!container || !sizer || !viewport) return;

        const assets = this.filteredAssets || [];
        const totalCount = assets.length;
        if (totalCount === 0) {
            sizer.style.height = '0px';
            viewport.innerHTML = '<div style="color: #64748b; font-size: 12px; padding: 16px; text-align: center;">No matching assets found.</div>';
            return;
        }

        const size = this.thumbSize || defaultThumbnailSize;
        const gap = 8;
        const containerW = Math.max(120, container.clientWidth - 20);
        const cols = Math.max(1, Math.floor((containerW + gap) / (size + gap)));
        const colWidth = Math.floor((containerW - (cols - 1) * gap) / cols);
        const cardHeight = colWidth + 24;
        const rowHeight = cardHeight + gap;
        const totalRows = Math.ceil(totalCount / cols);
        const totalHeight = totalRows * rowHeight;

        sizer.style.height = totalHeight + 'px';
        viewport.style.gridTemplateColumns = `repeat(${cols}, ${colWidth}px)`;

        const scrollTop = container.scrollTop;
        const viewportH = container.clientHeight || 400;

        const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
        const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / rowHeight) + 2);

        const startIndex = startRow * cols;
        const endIndex = Math.min(totalCount, (endRow + 1) * cols);

        viewport.style.transform = `translateY(${startRow * rowHeight}px)`;
        viewport.innerHTML = '';

        for (let i = startIndex; i < endIndex; i++) {
            const asset = assets[i];
            const card = this.createCardElement(asset, cardHeight);
            viewport.appendChild(card);
        }
    },

    createCardElement(asset, cardHeight) {
        const card = document.createElement('div');
        card.className = 'dd-card' + (this.selectedAsset === asset ? ' selected' : '');
        card.style.cssText = `height: ${cardHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;`;

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width: 85%; max-height: 70%; object-fit: contain; image-rendering: pixelated;';
        DocsDoodads.Thumbnail.get(asset, this.thumbSize || 96, (dataUrl) => {
            imgEl.src = dataUrl;
        });
        card.appendChild(imgEl);

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 3px;';
        title.textContent = asset.fileName;
        card.appendChild(title);

        if (asset.favorite) {
            const favBadge = document.createElement('span');
            favBadge.className = 'dd-badge';
            favBadge.textContent = '★';
            favBadge.style.color = '#fbbf24';
            card.appendChild(favBadge);
        }

        card.onclick = () => {
            this.selectAsset(asset);
            const container = document.getElementById('dd-cards-container');
            if (container) container.querySelectorAll('.dd-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (asset.category === 'Audio') {
                DocsDoodads.Audio.playPreview(asset);
                const stopBtn = document.getElementById('dd-stop-audio-btn');
                if (stopBtn) stopBtn.style.display = 'block';
            }
        };

        card.ondblclick = () => {
            if (asset.category !== 'Audio' && asset.type !== 'prefab') {
                DocsDoodads.Slicing.Editor.open(asset);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            this.selectAsset(asset);
            if (asset.type === 'prefab') {
                this.showContextMenu(e.clientX, e.clientY, this.prefabMenuItems(asset));
                return;
            }
            const items = [
                { label: 'Place as Doodad', icon: '📌', onClick: () => this.placeAssetOnMapCenter(asset) },
                {
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: () => {
                        const templateKey = prompt("Enter Template Key (e.g. npc, door, chest, signpost, switch, save_point):", "npc") || "npc";
                        const prev = document.getElementById('dd-event-template');
                        if (prev) prev.value = templateKey;
                        this.commitPlacement(asset, this.clientToMapCoords(e.clientX, e.clientY), 'event');
                    }
                },
                { separator: true },
                {
                    label: asset.favorite ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: '★',
                    onClick: () => {
                        DocsDoodads.AssetIndex.toggleFavorite(asset.id);
                        this.refreshInspector();
                        this.refreshDrawerCards();
                    }
                },
                {
                    label: 'Add to Collection...',
                    icon: '📁',
                    onClick: () => {
                        const colName = prompt("Enter Collection Name (e.g. Castle Set, Forest Props):", "Custom Collection");
                        if (colName && colName.trim()) {
                            DocsDoodads.AssetIndex.addAssetToCollection(asset.id, colName.trim());
                            this.showToast(`Added ${asset.fileName} to "${colName.trim()}"!`);
                        }
                    }
                },
                { separator: true }
            ];
            if (asset.category !== 'Audio') {
                items.push({ label: 'Open in Slicing Modal', icon: '✂️', onClick: () => DocsDoodads.Slicing.Editor.open(asset) });
                items.push({ label: 'Export Slices to PNGs', icon: '💾', onClick: () => DocsDoodads.Export.exportSlices(asset) });
            } else {
                items.push({ label: 'Play Audio Preview', icon: '▶️', onClick: () => DocsDoodads.Audio.playPreview(asset) });
                items.push({ label: 'Stop Audio', icon: '⏹', onClick: () => DocsDoodads.Audio.stopPreview() });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        card.draggable = true;
        card.ondragstart = (e) => {
            if (asset.type === 'prefab') {
                this.activeDragPayload = { type: 'prefab', prefabId: asset.prefabId, path: asset.path, fileName: asset.fileName, category: 'Prefabs' };
                e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
                return;
            }
            this.activeDragPayload = {
                assetId: asset.id,
                path: asset.path,
                fileName: asset.fileName,
                category: asset.category,
                type: asset.type,
                frameW: asset.width || 48,
                frameH: asset.height || 48,
                collision: asset.collision || { preset: "none" },
                characterIndex: asset.placement.characterIndex || 0,
                depth: asset.placement.depth,
                tags: asset.tags || [],
                autoTags: asset.autoTags || [],
                placementMode: asset.placement.defaultMode || (asset.type === 'character_sheet' ? 'event' : 'ask')
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
        };

        card.ondragend = () => {
            this.removeGhost();
        };

        return card;
    },

    selectedDoodads: [],

    selectEvent(evInfo) {
        this.selectedEvent = evInfo;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedAsset = null;
        this.refreshInspector();
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodad(doodad, isMulti) {
        if (!doodad) {
            this.selectedDoodad = null;
            this.selectedDoodads = [];
            this.refreshInspector();
            return;
        }

        // If doodad is part of a group and not multi-selecting, select all members in the group
        if (!isMulti && doodad.groupId) {
            const groupMembers = (DocsDoodads.doodads() || []).filter(d => d.groupId === doodad.groupId);
            if (groupMembers.length > 1) {
                this.selectedDoodads = groupMembers;
                this.selectedDoodad = doodad;
                this.selectedAsset = null;
                this.selectedEvent = null;
                this.refreshInspector();
                return;
            }
        }

        if (isMulti) {
            this.selectedDoodads = this.selectedDoodads || [];
            const idx = this.selectedDoodads.indexOf(doodad);
            if (idx >= 0) {
                this.selectedDoodads.splice(idx, 1);
            } else {
                this.selectedDoodads.push(doodad);
            }
            this.selectedDoodad = this.selectedDoodads[this.selectedDoodads.length - 1] || null;
        } else {
            this.selectedDoodads = [doodad];
            this.selectedDoodad = doodad;
        }
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodads(doodads) {
        this.selectedDoodads = doodads || [];
        this.selectedDoodad = this.selectedDoodads[0] || null;
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    refreshInspector() {
        const content = document.getElementById('dd-inspector-content');
        if (!content) return;

        // Case 0: MZ Map Event Selected
        if (this.selectedEvent) {
            const ev = this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event());
            const ge = this.selectedEvent.gameEvent;
            const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
            const page0 = ev && ev.pages && ev.pages[0] ? ev.pages[0] : {};
            const triggerNames = ["Action Button", "Player Touch", "Event Touch", "Autorun", "Parallel"];
            const priorityNames = ["Below Characters", "Same as Characters", "Above Characters"];

            content.innerHTML = `
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MAP EVENT: ${escapeHtml(ev ? ev.name : ('EV' + evId))} (ID: ${evId})</div>
                <div style="font-size: 11px; margin-bottom: 4px;">Tile Coordinates: <span style="color: #fff;">[${ge ? ge.x : (ev ? ev.x : 0)}, ${ge ? ge.y : (ev ? ev.y : 0)}]</span></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile X:</label>
                        <input type="number" id="dd-ev-x" value="${ge ? ge.x : (ev ? ev.x : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile Y:</label>
                        <input type="number" id="dd-ev-y" value="${ge ? ge.y : (ev ? ev.y : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Trigger:</label>
                    <select id="dd-ev-trigger" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${triggerNames.map((t, idx) => `<option value="${idx}" ${(page0.trigger === idx) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Priority:</label>
                    <select id="dd-ev-priority" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${priorityNames.map((p, idx) => `<option value="${idx}" ${(page0.priorityType === idx) ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="dd-btn dd-btn-primary" id="dd-ev-save-template-btn">💾 Save as Event Template</button>
                    <button class="dd-btn" id="dd-ev-dup-btn">Duplicate Event</button>
                    <button class="dd-btn" id="dd-ev-del-btn" style="background: #991b1b;">Delete Event</button>
                </div>
            `;

            document.getElementById('dd-ev-save-template-btn').onclick = () => {
                const name = prompt("Enter a name for this new Event Template:", ev.name || ("Template_" + evId));
                if (name && name.trim()) {
                    const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                    DocsDoodads.EventTemplates.saveCustomTemplate(name.trim(), ev, cat.trim());
                    this.showToast(`Saved template "${name.trim()}"!`);
                }
            };
            document.getElementById('dd-ev-del-btn').onclick = () => {
                this.deleteSelectedEvent();
            };
            document.getElementById('dd-ev-dup-btn').onclick = () => {
                this.duplicateSelectedEvent();
            };
            return;
        }

        // Case 1A: Multi-Selection (Multiple Doodads Selected)
        if (this.selectedDoodads && this.selectedDoodads.length > 1) {
            const items = this.selectedDoodads;
            const lockedCount = items.filter(d => d.locked).length;
            const hiddenCount = items.filter(d => d.editorHidden).length;
            const hasGroup = items.some(d => d.groupId);

            content.innerHTML = `
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MULTI-SELECTION (${items.length} DOODADS)</div>
                <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
                    ${lockedCount > 0 ? `🔒 ${lockedCount} locked | ` : ''}
                    ${hiddenCount > 0 ? `👁 ${hiddenCount} hidden | ` : ''}
                    ${hasGroup ? `📦 Grouped` : ''}
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">ALIGN</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-align-left" title="Align Left">Left</button>
                        <button class="dd-btn" id="dd-align-center-x" title="Align Center X">Center X</button>
                        <button class="dd-btn" id="dd-align-right" title="Align Right">Right</button>
                        <button class="dd-btn" id="dd-align-top" title="Align Top">Top</button>
                        <button class="dd-btn" id="dd-align-center-y" title="Align Center Y">Center Y</button>
                        <button class="dd-btn" id="dd-align-bottom" title="Align Bottom">Bottom</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">DISTRIBUTE</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-dist-h" title="Distribute Horizontally">Horizontal</button>
                        <button class="dd-btn" id="dd-dist-v" title="Distribute Vertically">Vertical</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-multi-z-fwd" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-back" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-multi-z-bottom" title="Send to Back">To Back</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">ORGANIZATION</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-grp-btn">${hasGroup ? 'Ungroup' : 'Group'}</button>
                        <button class="dd-btn" id="dd-lock-btn">${lockedCount === items.length ? 'Unlock All' : 'Lock All'}</button>
                        <button class="dd-btn" id="dd-hide-btn">${hiddenCount === items.length ? 'Show All' : 'Hide All'}</button>
                        <button class="dd-btn" id="dd-dup-all-btn">Duplicate</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <button class="dd-btn" id="dd-multi-trace-col" style="width: 100%;" title="Fit each doodad's collision to the solid base of its image">Trace Collision from Art</button>
                </div>
                ${this.renderSelectionTools(items)}
                ${this.renderEffectSections(items)}
                <div style="margin-top: 12px;">
                    <button class="dd-btn" id="dd-del-all-btn" style="width: 100%; background: #991b1b;">Delete Selection (${items.length})</button>
                </div>
            `;

            document.getElementById('dd-align-left').onclick = () => this.alignSelected('left');
            document.getElementById('dd-align-center-x').onclick = () => this.alignSelected('centerX');
            document.getElementById('dd-align-right').onclick = () => this.alignSelected('right');
            document.getElementById('dd-align-top').onclick = () => this.alignSelected('top');
            document.getElementById('dd-align-center-y').onclick = () => this.alignSelected('centerY');
            document.getElementById('dd-align-bottom').onclick = () => this.alignSelected('bottom');

            document.getElementById('dd-dist-h').onclick = () => this.distributeSelected('horizontal');
            document.getElementById('dd-dist-v').onclick = () => this.distributeSelected('vertical');

            document.getElementById('dd-multi-z-fwd').onclick = () => this.bringForward();
            document.getElementById('dd-multi-z-back').onclick = () => this.sendBackward();
            document.getElementById('dd-multi-z-front').onclick = () => this.bringToFront();
            document.getElementById('dd-multi-z-bottom').onclick = () => this.sendToBack();

            document.getElementById('dd-grp-btn').onclick = () => {
                if (hasGroup) this.ungroupSelected();
                else this.groupSelected();
            };
            document.getElementById('dd-lock-btn').onclick = () => {
                this.lockSelected(lockedCount !== items.length);
            };
            document.getElementById('dd-hide-btn').onclick = () => {
                this.hideSelected(hiddenCount !== items.length);
            };
            document.getElementById('dd-dup-all-btn').onclick = () => this.duplicateSelectedDoodad();
            document.getElementById('dd-multi-trace-col').onclick = () => this.traceCollision(items);
            this.bindEffectSections(items);
            this.bindSelectionTools(items);
            document.getElementById('dd-del-all-btn').onclick = () => this.deleteSelectedDoodad();
            return;
        }

        // Case 1B: Placed Doodad Selected (Single Doodad)
        if (this.selectedDoodad) {
            const d = this.selectedDoodad;
            const isLocked = !!d.locked;
            const isHidden = !!d.editorHidden;
            const isCustomCol = d.collision && d.collision.preset === 'custom';
            const shape = (d.collision && d.collision.shape) || { x: 0.2, y: 0.2, w: 0.6, h: 0.6 };

            content.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="font-weight: bold; color: #38bdf8;">DOODAD PROPERTIES</div>
                    <div style="display: flex; gap: 4px;">
                        <button class="dd-btn" id="dd-doodad-lock-toggle" style="padding: 2px 6px; font-size: 11px;">${isLocked ? '🔒 Locked' : '🔓 Lock'}</button>
                        <button class="dd-btn" id="dd-doodad-hide-toggle" style="padding: 2px 6px; font-size: 11px;">${isHidden ? '👁 Hidden' : '👁 Hide'}</button>
                    </div>
                </div>
                <div style="font-size: 11px; margin-bottom: 4px;">Image: <span style="color: #fff;">${escapeHtml(d.bit ? d.bit[1] : 'Unknown')}</span></div>
                ${d.groupId ? `<div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px;">Group: ${escapeHtml(d.groupId)} <button class="dd-btn" id="dd-ungrp-single" style="padding: 1px 4px; font-size: 9px;">Ungroup</button></div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">X:</label>
                        <input type="number" id="dd-prop-x" value="${d.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Y:</label>
                        <input type="number" id="dd-prop-y" value="${d.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Z-Order:</label>
                        <input type="number" id="dd-prop-z" value="${d.z || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Rotation (°):</label>
                        <input type="number" id="dd-prop-rot" value="${d.rotation || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale X:</label>
                        <input type="number" step="0.1" id="dd-prop-sx" value="${d.scaleX || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale Y:</label>
                        <input type="number" step="0.1" id="dd-prop-sy" value="${d.scaleY || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                    <select id="dd-prop-col" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                        <option value="none">None (Passable)</option>
                        <option value="full">Full Bounds</option>
                        <option value="bottomHalf">Bottom Half</option>
                        <option value="bottomThird">Bottom Third</option>
                        <option value="trunk">Tree Trunk</option>
                        <option value="thinWall">Thin Wall</option>
                        <option value="wideWall">Wide Wall</option>
                        <option value="custom">Custom Rectangle</option>
                    </select>
                    <button class="dd-btn" id="dd-prop-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
                </div>

                <!-- Custom Collision Box Visual Editor -->
                <div id="dd-custom-col-editor" style="display: ${isCustomCol ? 'block' : 'none'}; margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 8px; border-radius: 4px;">
                    <div style="font-size: 10px; color: #38bdf8; margin-bottom: 4px; font-weight: bold;">CUSTOM COLLISION BOX</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <canvas id="dd-col-preview" width="64" height="64" style="background: #0b1120; border: 1px solid #475569; border-radius: 3px; flex-shrink: 0;"></canvas>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; flex: 1;">
                            <div>
                                <label style="color: #94a3b8;">Rel X:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-x" value="${shape.x.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel Y:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-y" value="${shape.y.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel W:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-w" value="${shape.w.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel H:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-h" value="${shape.h.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 4px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-prop-forward" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-prop-backward" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-prop-to-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-prop-to-back" title="Send to Back">To Back</button>
                    </div>
                </div>
                ${this.renderSelectionTools([d])}
                ${this.renderEffectSections([d])}
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="dd-btn" id="dd-prop-dup" style="flex: 1;">Duplicate (Ctrl+D)</button>
                    <button class="dd-btn" id="dd-prop-del" style="flex: 1; background: #991b1b;">Delete</button>
                </div>
            `;

            const renderColPreview = () => {
                const cvs = document.getElementById('dd-col-preview');
                if (!cvs || typeof cvs.getContext !== 'function') return;
                const ctx = cvs.getContext('2d');
                ctx.clearRect(0, 0, 64, 64);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(4, 4, 56, 56);
                ctx.strokeStyle = '#64748b';
                ctx.strokeRect(4, 4, 56, 56);
                const s = d.collision && d.collision.shape ? d.collision.shape : shape;
                ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
                ctx.fillRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
                ctx.strokeStyle = '#22c55e';
                ctx.strokeRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
            };

            document.getElementById('dd-prop-col').value = (d.collision && d.collision.preset) ? d.collision.preset : "none";
            document.getElementById('dd-prop-col').onchange = (e) => {
                const val = e.target.value;
                const colEditor = document.getElementById('dd-custom-col-editor');
                if (val === 'custom') {
                    d.collision = { preset: 'custom', shape: shape };
                    if (colEditor) colEditor.style.display = 'block';
                    renderColPreview();
                } else {
                    d.collision = { preset: val, shape: null };
                    if (colEditor) colEditor.style.display = 'none';
                }
            };

            if (isCustomCol) renderColPreview();

            const updateCustomCol = () => {
                const cx = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-x').value) || 0));
                const cy = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-y').value) || 0));
                const cw = Math.max(0.05, Math.min(1 - cx, parseFloat(document.getElementById('dd-col-w').value) || 0.5));
                const ch = Math.max(0.05, Math.min(1 - cy, parseFloat(document.getElementById('dd-col-h').value) || 0.5));
                d.collision = { preset: 'custom', shape: { x: cx, y: cy, w: cw, h: ch } };
                renderColPreview();
            };
            ['dd-col-x', 'dd-col-y', 'dd-col-w', 'dd-col-h'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.oninput = updateCustomCol;
            });

            document.getElementById('dd-doodad-lock-toggle').onclick = () => {
                d.locked = !d.locked;
                this.refreshInspector();
            };
            document.getElementById('dd-doodad-hide-toggle').onclick = () => {
                d.editorHidden = !d.editorHidden;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
                this.refreshInspector();
            };
            const ungrpBtn = document.getElementById('dd-ungrp-single');
            if (ungrpBtn) {
                ungrpBtn.onclick = () => {
                    delete d.groupId;
                    this.refreshInspector();
                };
            }

            const applyDoodadInputs = () => {
                if (d.locked) return;
                d.x = parseInt(document.getElementById('dd-prop-x').value, 10) || 0;
                d.y = parseInt(document.getElementById('dd-prop-y').value, 10) || 0;
                d.z = parseInt(document.getElementById('dd-prop-z').value, 10) || 0;
                d.rotation = parseInt(document.getElementById('dd-prop-rot').value, 10) || 0;
                d.scaleX = parseFloat(document.getElementById('dd-prop-sx').value) || 1;
                d.scaleY = parseFloat(document.getElementById('dd-prop-sy').value) || 1;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
            };

            ['dd-prop-x','dd-prop-y','dd-prop-z','dd-prop-rot','dd-prop-sx','dd-prop-sy'].forEach(id => {
                document.getElementById(id).onchange = applyDoodadInputs;
            });

            this.bindEffectSections([d]);
            this.bindSelectionTools([d]);
            document.getElementById('dd-prop-trace-col').onclick = () => this.traceCollision([d]);
            document.getElementById('dd-prop-forward').onclick = () => this.bringForward([d]);
            document.getElementById('dd-prop-backward').onclick = () => this.sendBackward([d]);
            document.getElementById('dd-prop-to-front').onclick = () => this.bringToFront([d]);
            document.getElementById('dd-prop-to-back').onclick = () => this.sendToBack([d]);
            document.getElementById('dd-prop-dup').onclick = () => {
                this.duplicateSelectedDoodad();
            };
            document.getElementById('dd-prop-del').onclick = () => {
                this.deleteSelectedDoodad();
            };
            return;
        }

        // Case 2: Drawer Asset Selected
        if (!this.selectedAsset) {
            this.renderMapPanel(content);
            return;
        }

        const a = this.selectedAsset;
        if (a.type === 'prefab') {
            this.renderPrefabInspector(content, a);
            return;
        }
        if (a.category === 'Audio') {
            this.renderAudioInspector(content, a);
            return;
        }
        const templates = DocsDoodads.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += `<option value="${escapeHtml(key)}">${escapeHtml(templates[key].name)}</option>`;
        }

        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">${escapeHtml(a.category)}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: ${a.width} x ${a.height}</div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. forest, prop" style="width: 100%; box-sizing: border-box; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="dd-place-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                    <option value="ask">Ask Each Time</option>
                </select>
            </div>
            <div id="dd-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="dd-event-template" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${templateOptions}
                </select>
                ${a.type === 'character_sheet' ? `
                <label style="display: block; font-size: 11px; margin: 8px 0 3px;">Character on Sheet:</label>
                <select id="dd-char-index" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}">#${i + 1} (${i < 4 ? 'top' : 'bottom'} row, ${(i % 4) + 1} of 4)</option>`).join('')}
                </select>` : ''}
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                <select id="dd-col-preset" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="none">None (Passable)</option>
                    <option value="full">Full Bounds</option>
                    <option value="bottomHalf">Bottom Half</option>
                    <option value="bottomThird">Bottom Third</option>
                    <option value="trunk">Tree Trunk</option>
                    <option value="thinWall">Thin Wall</option>
                    <option value="wideWall">Wide Wall</option>
                    <option value="custom">Custom (traced)</option>
                </select>
                <button class="dd-btn" id="dd-asset-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Default Depth:</label>
                <select id="dd-asset-depth" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${DocsDoodads.Depth.modes.map(m => `<option value="${m}">${DocsDoodads.Depth.labels[m]}</option>`).join('')}
                </select>
            </div>
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-place-now-btn">Place on Map Center</button>
                <button class="dd-btn" id="dd-open-slicer-btn">Open Slicer</button>
            </div>
        `;

        const modeSel = document.getElementById('dd-place-mode');
        const templateGroup = document.getElementById('dd-template-group');
        modeSel.value = a.placement.defaultMode || "doodad";
        templateGroup.style.display = modeSel.value === "event" ? "block" : "none";

        modeSel.onchange = (e) => {
            a.placement.defaultMode = e.target.value;
            templateGroup.style.display = a.placement.defaultMode === "event" ? "block" : "none";
        };

        const charSel = document.getElementById('dd-char-index');
        if (charSel) {
            charSel.value = String(a.placement.characterIndex || 0);
            charSel.onchange = (e) => { a.placement.characterIndex = parseInt(e.target.value, 10) || 0; };
        }

        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };

        const colSel = document.getElementById('dd-col-preset');
        colSel.value = a.collision.preset || "none";
        colSel.onchange = (e) => {
            const shape = e.target.value === 'custom' ? (a.collision.shape || { x: 0.2, y: 0.6, w: 0.6, h: 0.4 }) : null;
            a.collision = { preset: e.target.value, shape };
            DocsDoodads.AssetIndex.save();
        };
        document.getElementById('dd-asset-trace-col').onclick = () => this.traceAssetCollision(a);
        const depthSel = document.getElementById('dd-asset-depth');
        depthSel.value = DocsDoodads.Depth.modes.includes(a.placement.depth) ? a.placement.depth : DocsDoodads.Depth.suggestFor(a);
        depthSel.onchange = (e) => {
            a.placement.depth = e.target.value;
            DocsDoodads.AssetIndex.save();
        };

        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };

        document.getElementById('dd-open-slicer-btn').onclick = () => {
            DocsDoodads.Slicing.Editor.open(a);
        };

        document.getElementById('dd-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
        };
    },

    // ---- Undoable doodad property editing (inspector sections, tools) ----
    propertyDefaults() {
        return {
            shadow: DocsDoodads.Shadow.defaults,
            light: DocsDoodads.Lighting.lightDefaults,
            motion: { type: 'none', amount: 0.5, speed: 1 }
        };
    },

    getDoodadProperty(d, key) {
        if (key === 'flipX') return (d.scaleX !== undefined ? d.scaleX : 1) < 0;
        if (key === 'flipY') return (d.scaleY !== undefined ? d.scaleY : 1) < 0;
        if (key === 'switchText') return DocsDoodads.Appearance.formatSwitches(d.switch);
        if (key === 'depth') return DocsDoodads.Depth.resolve(d);
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const value = d[group] ? d[group][field] : undefined;
            return value !== undefined ? value : (this.propertyDefaults()[group] || {})[field];
        }
        return d[key] !== undefined ? d[key] : DocsDoodads.standardStructData[key];
    },

    applyDoodadProperty(d, key, value) {
        if (key === 'flipX' || key === 'flipY') {
            const axis = key === 'flipX' ? 'scaleX' : 'scaleY';
            d[axis] = Math.abs(d[axis] !== undefined ? d[axis] : 1) * (value ? -1 : 1);
            return;
        }
        if (key === 'switchText') {
            d.switch = DocsDoodads.Appearance.parseSwitchText(value);
            return;
        }
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const next = Object.assign({}, this.propertyDefaults()[group] || {}, d[group] || {});
            next[field] = value;
            d[group] = next;
            return;
        }
        d[key] = value;
    },

    snapshotDoodads(items) {
        return items.map(d => JSON.parse(JSON.stringify(d)));
    },

    // Restores in place so selections and sprites keep pointing at the same objects.
    restoreDoodad(d, snapshot) {
        for (const key of Object.keys(d)) delete d[key];
        Object.assign(d, JSON.parse(JSON.stringify(snapshot)));
    },

    afterDoodadEdit() {
        DocsDoodads.Persistence.dirtyDoodads = true;
        this.refreshSpriteset(true);
    },

    // One undo step returning every item to its "before" snapshot (the change is already applied).
    recordDoodadEdit(items, before, type = 'edit_doodads') {
        const after = this.snapshotDoodads(items);
        DocsDoodads.Undo.execute({
            type,
            apply: () => { items.forEach((d, i) => this.restoreDoodad(d, after[i])); this.afterDoodadEdit(); },
            revert: () => { items.forEach((d, i) => this.restoreDoodad(d, before[i])); this.afterDoodadEdit(); }
        });
    },

    editDoodads(items, mutate, type) {
        items = (items || []).filter(Boolean);
        if (items.length === 0) return;
        const before = this.snapshotDoodads(items);
        items.forEach(mutate);
        this.recordDoodadEdit(items, before, type);
    },

    setDoodadProperty(items, key, value) {
        this.editDoodads(items, d => this.applyDoodadProperty(d, key, value), 'set_' + key);
    },

    // Slider drags preview live and become a single undo step when released.
    beginPropertyPreview(items) {
        this._propertyPreview = { items: items.slice(), before: this.snapshotDoodads(items) };
    },

    previewDoodadProperty(items, key, value) {
        if (!this._propertyPreview) this.beginPropertyPreview(items);
        items.forEach(d => this.applyDoodadProperty(d, key, value));
        this.refreshSpriteset(true);
    },

    commitPropertyPreview() {
        const preview = this._propertyPreview;
        this._propertyPreview = null;
        if (preview) this.recordDoodadEdit(preview.items, preview.before, 'adjust_doodads');
    },

    effectSections() {
        const D = DocsDoodads;
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        return [
            { title: 'Depth', fields: [
                { key: 'depth', label: 'Layer', type: 'select', options: D.Depth.modes.map(m => ({ value: m, label: D.Depth.labels[m] })) },
                number('sortOffsetY', 'Base line offset (px, negative = higher)')
            ] },
            { title: 'Appearance', fields: [
                range('opacity', 'Opacity', 0, 1, 0.05),
                { key: 'blend', label: 'Blend', type: 'select', options: D.Appearance.blendModes },
                range('hue', 'Hue shift', -180, 180, 1),
                range('r', 'Tone red', -255, 255, 1),
                range('g', 'Tone green', -255, 255, 1),
                range('b', 'Tone blue', -255, 255, 1),
                range('grey', 'Greyscale', 0, 255, 1),
                range('blur', 'Blur', 0, 20, 0.5),
                { key: 'flipX', label: 'Flip horizontally', type: 'checkbox' },
                { key: 'flipY', label: 'Flip vertically', type: 'checkbox' }
            ] },
            { title: 'Motion', fields: [
                { key: 'motion.type', label: 'Type', type: 'select', options: D.Motion.types },
                range('motion.amount', 'Amount', 0, 1, 0.05),
                range('motion.speed', 'Speed', 0.1, 3, 0.1),
                number('rotateSpeed', 'Spin (degrees per frame)', 0.5)
            ] },
            { title: 'Shadow', fields: [
                { key: 'shadow.enabled', label: 'Cast shadow', type: 'checkbox' },
                range('shadow.opacity', 'Strength', 0, 1, 0.05),
                range('shadow.length', 'Length', 0.1, 1.2, 0.05),
                range('shadow.angle', 'Lean (degrees)', -80, 80, 1),
                range('shadow.blur', 'Softness', 0, 10, 0.5),
                number('shadow.offsetX', 'Offset X'),
                number('shadow.offsetY', 'Offset Y')
            ] },
            { title: 'Light', fields: [
                { key: 'light.enabled', label: 'Emit light', type: 'checkbox' },
                { key: 'light.color', label: 'Color', type: 'color' },
                range('light.radius', 'Radius', 16, 600, 4),
                range('light.intensity', 'Intensity', 0, 1, 0.05),
                range('light.flicker', 'Flicker', 0, 1, 0.05),
                range('light.glow', 'Daylight glow', 0, 1, 0.05),
                number('light.offsetX', 'Offset X'),
                number('light.offsetY', 'Offset Y')
            ] },
            { title: 'Visibility', fields: [
                { key: 'switchText', label: 'Switches (e.g. 5:on, 6:off)', type: 'text' },
                { key: 'condition', label: 'Condition (JavaScript, e.g. $gameVariables.value(3) > 2)', type: 'text' }
            ] }
        ];
    },

    renderEffectSections(items) {
        const first = items[0];
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px; border-radius: 3px; font-size: 11px;';
        this._openEffectSections = this._openEffectSections || {};
        return this.effectSections().map((section, si) => {
            const fields = section.fields.map((f, fi) => {
                const id = `dd-fx-${si}-${fi}`;
                const value = this.getDoodadProperty(first, f.key);
                const label = `<label for="${id}" style="font-size: 10px; color: #94a3b8;">${escapeHtml(f.label)}${f.type === 'range' ? `: <span id="${id}-val" style="color: #e2e8f0;">${escapeHtml(String(value))}</span>` : ''}</label>`;
                if (f.type === 'checkbox') {
                    return `<label style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="${id}" ${value ? 'checked' : ''} /> ${escapeHtml(f.label)}</label>`;
                }
                if (f.type === 'select') {
                    const options = f.options.map(o => `<option value="${escapeHtml(String(o.value))}" ${String(o.value) === String(value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('');
                    return `<div>${label}<select id="${id}" style="${inputStyle}">${options}</select></div>`;
                }
                if (f.type === 'range') {
                    return `<div>${label}<input type="range" id="${id}" min="${f.min}" max="${f.max}" step="${f.step}" value="${escapeHtml(String(value))}" style="width: 100%;" /></div>`;
                }
                if (f.type === 'color') {
                    return `<div>${label}<input type="color" id="${id}" value="${escapeHtml(String(value))}" style="width: 100%; height: 22px; background: #0f172a; border: 1px solid #334155;" /></div>`;
                }
                const type = f.type === 'number' ? 'number' : 'text';
                return `<div>${label}<input type="${type}" id="${id}" ${f.step ? `step="${f.step}"` : ''} value="${escapeHtml(String(value === undefined || value === null ? '' : value))}" style="${inputStyle}" /></div>`;
            }).join('');
            return `
                <details id="dd-fx-sec-${si}" ${this._openEffectSections[section.title] ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">${section.title}</summary>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}</div>
                </details>`;
        }).join('');
    },

    bindEffectSections(items) {
        this.effectSections().forEach((section, si) => {
            const details = document.getElementById(`dd-fx-sec-${si}`);
            if (details) details.ontoggle = () => { this._openEffectSections[section.title] = details.open; };
            section.fields.forEach((f, fi) => {
                const input = document.getElementById(`dd-fx-${si}-${fi}`);
                if (!input) return;
                const read = () => {
                    if (f.type === 'checkbox') return Boolean(input.checked);
                    if (f.type === 'range' || f.type === 'number') return parseFloat(input.value) || 0;
                    return input.value;
                };
                if (f.type === 'range') {
                    const label = document.getElementById(`dd-fx-${si}-${fi}-val`);
                    input.oninput = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        this.commitPropertyPreview();
                    };
                } else {
                    input.onchange = () => this.setDoodadProperty(items, f.key, read());
                }
            });
        });
    },

    // ---- Map settings (lighting) ----
    currentMapId() {
        return window.$gameMap && typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
    },

    setMapAmbient(ambient, before) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = before !== undefined ? before
            : (data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null);
        const next = Object.assign({}, previous || {}, { ambient: Object.assign({}, ambient) });
        const write = (value) => {
            if (value) {
                data.mapSettings = data.mapSettings || {};
                data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
            } else if (data.mapSettings) {
                delete data.mapSettings[mapId];
                if (Object.keys(data.mapSettings).length === 0) delete data.mapSettings;
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'map_ambient', apply: () => write(next), revert: () => write(previous) });
    },

    renderMapPanel(content) {
        const mapId = this.currentMapId();
        const ambient = Object.assign({}, DocsDoodads.Lighting.ambientDefaults, (DocsDoodads.Lighting.mapSettings(mapId) || {}).ambient);
        content.innerHTML = `
            <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MAP ${mapId} SETTINGS</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">Select an asset in the drawer or click an object on the map.</div>
            <details open style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Lighting</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <div>Ambient Darkness: <span id="dd-map-dark-val" style="color: #e2e8f0;">${Math.round(ambient.darkness * 100)}%</span>
                        <input type="range" id="dd-map-dark" min="0" max="1" step="0.05" value="${ambient.darkness}" style="width: 100%;" /></div>
                    <div>Ambient Color <input type="color" id="dd-map-color" value="${escapeHtml(ambient.color)}" style="width: 100%; height: 22px; background: #0f172a; border: 1px solid #334155;" /></div>
                    <div>Only while switch # is ON (0 = always)
                        <input type="number" id="dd-map-switch" min="0" value="${Number(ambient.switchId) || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-preview" ${this.lightingPreview === false ? '' : 'checked'} /> Preview lighting while editing</label>
                    <div style="color: #64748b; line-height: 1.4;">Give doodads a Light in their inspector. The "Set Ambient Light" plugin command changes darkness during play.</div>
                </div>
            </details>
            ${this.renderMapNavigation()}`;

        const read = () => ({
            darkness: parseFloat(document.getElementById('dd-map-dark').value) || 0,
            color: document.getElementById('dd-map-color').value || ambient.color,
            switchId: Math.max(0, parseInt(document.getElementById('dd-map-switch').value, 10) || 0)
        });
        let previewBefore;
        const darkInput = document.getElementById('dd-map-dark');
        darkInput.oninput = () => {
            if (previewBefore === undefined) {
                const current = DocsDoodads.Lighting.mapSettings(mapId);
                previewBefore = current ? JSON.parse(JSON.stringify(current)) : null;
            }
            DocsDoodads.Lighting.setMapSettings(mapId, { ambient: read() });
            const label = document.getElementById('dd-map-dark-val');
            if (label) label.textContent = Math.round(read().darkness * 100) + '%';
        };
        darkInput.onchange = () => {
            this.setMapAmbient(read(), previewBefore);
            previewBefore = undefined;
        };
        document.getElementById('dd-map-color').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-switch').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-preview').onchange = (e) => { this.lightingPreview = Boolean(e.target.checked); };
        this.bindMapNavigation();
    },

    // ---- Collision traced from the art ----
    loadPixels(path) {
        return new Promise((resolve, reject) => {
            if (typeof Image === 'undefined' || typeof document === 'undefined') return reject(new Error('Images cannot be read here.'));
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({ data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height });
            };
            img.onerror = () => reject(new Error(`Could not load ${path}`));
            img.src = path;
        });
    },

    async traceCollision(items, loader = (path) => this.loadPixels(path)) {
        const targets = (items || []).filter(d => d && d.bit && d.bit[0] === 3 && !d.locked);
        if (targets.length === 0) return 0;
        const before = this.snapshotDoodads(targets);
        const cache = {};
        let traced = 0;
        for (const d of targets) {
            try {
                const path = d.bit[1];
                const px = cache[path] || (cache[path] = await loader(path));
                const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height, {
                    frame: { x: d.frameX || 0, y: d.frameY || 0, w: d.frameW || px.width, h: d.frameH || px.height }
                });
                if (shape) {
                    d.collision = { preset: 'custom', shape };
                    traced++;
                }
            } catch (error) {
                DocsDoodads.Core.log('Collision tracing failed', error);
            }
        }
        if (traced > 0) this.recordDoodadEdit(targets, before, 'trace_collision');
        this.showToast(traced > 0 ? `Traced collision for ${traced} doodad(s) from their art.` : 'No solid footprint found in the art; collision unchanged.');
        if (traced > 0) this.refreshInspector();
        return traced;
    },

    // Saves the traced footprint on the library asset so every new placement starts with it.
    async traceAssetCollision(asset, loader = (path) => this.loadPixels(path)) {
        try {
            const px = await loader(asset.path);
            const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height);
            if (!shape) {
                this.showToast('No solid footprint found in the art.');
                return null;
            }
            asset.collision = { preset: 'custom', shape };
            DocsDoodads.AssetIndex.save();
            this.showToast(`Collision traced for ${asset.fileName}; new placements will use it.`);
            this.refreshInspector();
            return shape;
        } catch (error) {
            this.showToast(`Could not trace collision: ${error.message || error}`);
            return null;
        }
    },

    // A new doodad for an asset (library entry or drag payload) at a map position.
    newDoodadFromAsset(asset, x, y) {
        const d = DocsDoodads.standardStruct();
        d.bit = [3, asset.path];
        d.x = x;
        d.y = y;
        // Drag payloads carry frameW/frameH; library assets carry width/height.
        d.frameW = asset.frameW || asset.width || 48;
        d.frameH = asset.frameH || asset.height || 48;
        const preferredDepth = (asset.placement && asset.placement.depth) || asset.depth;
        d.depth = DocsDoodads.Depth.modes.includes(preferredDepth) ? preferredDepth : DocsDoodads.Depth.suggestFor(asset);
        const collision = asset.collision || {};
        d.collision = { preset: collision.preset || "none", shape: collision.shape ? JSON.parse(JSON.stringify(collision.shape)) : null };
        return d;
    },

    // ---- Prefab drawer entries and panels ----
    prefabAssets() {
        return DocsDoodads.Prefabs.ensureLoaded().map(p => ({
            id: `prefab:${p.id}:${p.updatedAt || p.createdAt || 0}`,
            prefabId: p.id,
            path: p.thumbnail || '',
            fileName: p.name,
            category: 'Prefabs',
            type: 'prefab',
            width: 0, height: 0,
            tags: [], autoTags: ['prefab'],
            favorite: false,
            placement: { defaultMode: 'doodad' },
            collision: { preset: 'none' },
            slice: null
        }));
    },

    renamePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return;
        const name = prompt('Prefab name:', prefab.name);
        if (!name || !name.trim()) return;
        prefab.name = name.trim();
        prefab.updatedAt = Date.now();
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    deletePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab || !confirm(`Delete prefab "${prefab.name}"? Copies already placed stay on the map.`)) return;
        DocsDoodads.Prefabs.remove(prefabId);
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    placePrefabAtPlayer(prefabId) {
        if (!window.$gamePlayer || !window.$gameMap) return;
        this.placePrefab(DocsDoodads.Prefabs.get(prefabId), this.snapToTile({ x: 0, y: 0, tileX: $gamePlayer.x, tileY: $gamePlayer.y }));
    },

    prefabMenuItems(asset) {
        return [
            { label: 'Place at Player', icon: '📌', onClick: () => this.placePrefabAtPlayer(asset.prefabId) },
            { label: 'Rename...', icon: '✏️', onClick: () => this.renamePrefab(asset.prefabId) },
            { separator: true },
            { label: 'Delete Prefab', icon: '🗑️', danger: true, onClick: () => this.deletePrefab(asset.prefabId) }
        ];
    },

    renderPrefabInspector(content, a) {
        const prefab = DocsDoodads.Prefabs.get(a.prefabId);
        if (!prefab) {
            content.innerHTML = 'This prefab no longer exists.';
            return;
        }
        const copies = Object.keys(window.$dataDocsDoodads || {}).reduce((n, key) => {
            const list = window.$dataDocsDoodads[key];
            if (!Array.isArray(list)) return n;
            return n + new Set(list.filter(d => d && d.prefabRef && d.prefabRef.id === prefab.id).map(d => d.prefabRef.instance)).size;
        }, 0);
        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(prefab.name)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Prefab &middot; ${prefab.doodads.length} doodad(s), ${prefab.events.length} event(s)</div>
            <div style="font-size: 11px; margin-bottom: 8px;">Placed copies: <span style="color: #60a5fa;">${copies}</span></div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px;">Drag onto the map, or use Stamp and click. Copies are grouped; select one and use "Update Prefab" to change the master, then "Sync All Copies".</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-prefab-place">Place at Player</button>
                <button class="dd-btn" id="dd-prefab-sync">Sync All Copies (${copies})</button>
                <button class="dd-btn" id="dd-prefab-rename">Rename</button>
                <button class="dd-btn" id="dd-prefab-delete" style="background: #991b1b;">Delete Prefab</button>
            </div>`;
        document.getElementById('dd-prefab-place').onclick = () => this.placePrefabAtPlayer(prefab.id);
        document.getElementById('dd-prefab-sync').onclick = () => { this.syncPrefabInstances(prefab.id); this.refreshInspector(); };
        document.getElementById('dd-prefab-rename').onclick = () => this.renamePrefab(prefab.id);
        document.getElementById('dd-prefab-delete').onclick = () => this.deletePrefab(prefab.id);
    },

    // Prefab, copy/move-to-map and prefab-instance actions shown above the effect sections.
    renderSelectionTools(items) {
        const instance = items.length > 0 && items[0].prefabRef ? items[0] : null;
        const prefab = instance ? DocsDoodads.Prefabs.get(instance.prefabRef.id) : null;
        const mirror = items.find(d => d.mirrorOf);
        return `
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                ${mirror ? `<div style="font-size: 10px; color: #f59e0b; margin-bottom: 6px;">Mirrored from map ${escapeHtml(String(mirror.mirrorOf.mapId))}; it is replaced when that map mirrors its edges again.</div>` : ''}
                ${prefab ? `
                <div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px;">Prefab copy: ${escapeHtml(prefab.name)}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                    <button class="dd-btn" id="dd-sel-prefab-update" title="Make the master prefab match this copy" style="padding: 4px;">Update Prefab</button>
                    <button class="dd-btn" id="dd-sel-prefab-sync" title="Rebuild every copy from the master" style="padding: 4px;">Sync Copies</button>
                    <button class="dd-btn" id="dd-sel-prefab-detach" title="Stop linking this copy to the prefab" style="padding: 4px;">Detach</button>
                </div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="dd-btn" id="dd-sel-save-prefab" style="padding: 4px;" title="Save the selection (and events under it) as a reusable prefab">Save Prefab</button>
                    <button class="dd-btn" id="dd-sel-copy-map" style="padding: 4px;">Copy to Map</button>
                    <button class="dd-btn" id="dd-sel-move-map" style="padding: 4px;">Move to Map</button>
                </div>
            </div>`;
    },

    bindSelectionTools(items) {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        on('dd-sel-save-prefab', () => {
            const name = prompt('Prefab name:', 'Prefab ' + (DocsDoodads.Prefabs.ensureLoaded().length + 1));
            if (!name || !name.trim()) return;
            const events = this.eventsWithin(items);
            const includeEvents = events.length === 0 || confirm(`Include the ${events.length} event(s) under the selection in the prefab?`);
            this.savePrefabFromSelection(name.trim(), includeEvents);
        });
        on('dd-sel-copy-map', () => this.showMapPicker('Copy selection to map', mapId => this.sendDoodadsToMap(items, mapId, 'copy')));
        on('dd-sel-move-map', () => this.showMapPicker('Move selection to map', mapId => { this.sendDoodadsToMap(items, mapId, 'move'); this.refreshInspector(); }));
        on('dd-sel-prefab-update', () => this.updatePrefabFromInstance(items[0]));
        on('dd-sel-prefab-sync', () => { if (items[0].prefabRef) this.syncPrefabInstances(items[0].prefabRef.id); this.refreshInspector(); });
        on('dd-sel-prefab-detach', () => { this.detachPrefabInstance(items[0]); this.refreshInspector(); });
    },

    // ---- Maps: switching, neighbours, picker ----
    mapEntries() {
        const infos = typeof window !== 'undefined' && window.$dataMapInfos ? window.$dataMapInfos : [];
        return infos.filter(Boolean).map(info => ({ id: info.id, name: info.name || `Map ${info.id}` }));
    },

    mapOptions(selected, includeNone) {
        const options = includeNone ? [`<option value="0">(none)</option>`] : [];
        for (const map of this.mapEntries()) {
            options.push(`<option value="${map.id}" ${Number(selected) === map.id ? 'selected' : ''}>${String(map.id).padStart(3, '0')}: ${escapeHtml(map.name)}</option>`);
        }
        return options.join('');
    },

    showMapPicker(title, onPick) {
        const existing = document.getElementById('dd-map-picker');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const modal = document.createElement('div');
        modal.id = 'dd-map-picker';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px; padding: 18px; z-index: 10030;';
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 13px; margin-bottom: 10px;">${escapeHtml(title)}</div>
            <select id="dd-map-picker-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; margin-bottom: 12px;">${this.mapOptions(0, false)}</select>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="dd-btn" id="dd-map-picker-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-map-picker-ok">OK</button>
            </div>`;
        document.body.appendChild(modal);
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-map-picker-cancel').onclick = close;
        document.getElementById('dd-map-picker-ok').onclick = () => {
            const mapId = parseInt(document.getElementById('dd-map-picker-select').value, 10);
            close();
            if (mapId) onPick(mapId);
        };
    },

    renderMapNavigation() {
        const neighbors = this.mapNeighbors();
        const side = (name, label) => `<div>${label}<select id="dd-map-nb-${name}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px;">${this.mapOptions(neighbors[name] || 0, true)}</select></div>`;
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Maps</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <div>Go to map (keeps the editor open):
                        <select id="dd-map-goto" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px;">${this.mapOptions(this.currentMapId(), false)}</select>
                        <button class="dd-btn" id="dd-map-goto-btn" style="width: 100%; margin-top: 4px;">Go to Map</button></div>
                    <div style="margin-top: 4px; color: #cbd5e1;">Neighbouring maps (for doodads that cross the edge):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">${side('north', 'North')}${side('south', 'South')}${side('west', 'West')}${side('east', 'East')}</div>
                    <button class="dd-btn" id="dd-map-mirror" title="Copy doodads hanging over an edge onto the neighbouring map">Mirror Edge Doodads</button>
                </div>
            </details>`;
    },

    bindMapNavigation() {
        const go = document.getElementById('dd-map-goto-btn');
        if (go) go.onclick = () => this.goToMap(parseInt(document.getElementById('dd-map-goto').value, 10));
        for (const name of DocsDoodads.MapLinks.sides) {
            const select = document.getElementById(`dd-map-nb-${name}`);
            if (!select) continue;
            select.onchange = () => {
                const next = {};
                for (const s of DocsDoodads.MapLinks.sides) {
                    const el = document.getElementById(`dd-map-nb-${s}`);
                    next[s] = el ? parseInt(el.value, 10) || 0 : 0;
                }
                this.setMapNeighbors(next);
            };
        }
        const mirror = document.getElementById('dd-map-mirror');
        if (mirror) mirror.onclick = () => this.mirrorEdgeDoodads();
    },

    // Transfers the player; the workspace stays open and picks the new map up in onMapLoaded.
    goToMap(mapId) {
        if (!mapId || !window.$gamePlayer || !window.$gameMap || mapId === this.currentMapId()) return;
        const size = this.mapSizeLookup(mapId);
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const cols = size ? Math.max(1, Math.floor(size.w / tw)) : 1;
        const rows = size ? Math.max(1, Math.floor(size.h / th)) : 1;
        const x = Math.min(cols - 1, Math.max(0, $gamePlayer.x));
        const y = Math.min(rows - 1, Math.max(0, $gamePlayer.y));
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        $gamePlayer.reserveTransfer(mapId, x, y, $gamePlayer.direction(), 2);
        this.showToast(`Going to map ${mapId}...`);
    },

    onMapLoaded() {
        if (!this.mounted) return;
        const persistence = DocsDoodads.Persistence;
        if (!persistence.sessionSnapshots[persistence.mapFilePath(this.currentMapId())]) persistence.captureSession();
        this.pathPoints = [];
        this.refreshInspector();
        const status = document.getElementById('dd-status-left');
        if (status) status.textContent = `Doc's Doodads v${pluginVersion} | Map ${this.currentMapId()} | Hold Alt for free placement`;
    },

    updateIndexStatus(removed) {
        const status = document.getElementById('dd-status-right');
        if (!status) return;
        const count = DocsDoodads.AssetIndex.list.length;
        status.textContent = removed ? `Indexed ${count} assets | ${removed} stale removed` : `Indexed ${count} assets`;
    },

    renderAudioInspector(content, a) {
        const channel = /\/bgm\//i.test(a.path) ? 'BGM' : /\/bgs\//i.test(a.path) ? 'BGS' : /\/me\//i.test(a.path) ? 'ME' : 'SE';
        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">Audio</span> &middot; Channel: <span style="color: #60a5fa;">${channel}</span></div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn dd-btn-primary" id="dd-audio-preview-btn" style="flex: 1;">&#9654; Preview</button>
                <button class="dd-btn" id="dd-audio-stop-btn" style="flex: 1;">&#9632; Stop</button>
            </div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. ambient, door" style="width: 100%; box-sizing: border-box; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Drag onto an empty tile to create a sound event, or onto an existing event to add a play command to it.
            </div>
        `;
        document.getElementById('dd-audio-preview-btn').onclick = () => {
            DocsDoodads.Audio.playPreview(a);
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = '';
        };
        document.getElementById('dd-audio-stop-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = 'none';
        };
        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };
        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };
    },

    placeAssetOnMapCenter(asset) {
        if (!window.$gameMap || !window.$gamePlayer) return;
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapX = $gamePlayer.x * tw + tw / 2;
        const mapY = $gamePlayer.y * th + th;
        this.commitPlacement(asset, { x: mapX, y: mapY, tileX: $gamePlayer.x, tileY: $gamePlayer.y });
    },

    commitPlacement(asset, coords, modeOverride) {
        if (asset && asset.type === 'prefab') {
            this.placePrefab(DocsDoodads.Prefabs.get(asset.prefabId), coords);
            return;
        }
        const mode = modeOverride || asset.placement.defaultMode || "doodad";

        if (mode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const templateKey = document.getElementById('dd-event-template') ? document.getElementById('dd-event-template').value : 'npc';
            const template = DocsDoodads.EventTemplates.get(templateKey);
            const mapId = $gameMap.mapId();
            DocsDoodads.Persistence.stagedFor(mapId);
            const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

            const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
                characterName: asset.fileName,
                characterIndex: asset.type === 'character_sheet'
                    ? (asset.characterIndex !== undefined ? asset.characterIndex : ((asset.placement && asset.placement.characterIndex) || 0))
                    : 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType
            });

            const cmd = {
                apply: () => {
                    $gameMap._stagedMapData.events[newId] = ev;
                    DocsDoodads.Persistence.dirtyMap = true;
                },
                revert: () => {
                    delete $gameMap._stagedMapData.events[newId];
                }
            };
            DocsDoodads.Undo.execute(cmd);
            this.showToast(`Created ${template.name} Event EV${String(newId).padStart(3, '0')}`);
        } else {
            const d = this.newDoodadFromAsset(asset, coords.x, coords.y);

            const cmd = {
                apply: () => {
                    window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    window.$dataDocsDoodads[$gameMap.mapId()].push(d);
                    DocsDoodads.Persistence.dirtyDoodads = true;
                    this.refreshSpriteset();
                },
                revert: () => {
                    const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                    this.refreshSpriteset();
                }
            };
            DocsDoodads.Undo.execute(cmd);
            this.showToast("Placed Doodad on Map!");
        }
        DocsDoodads.AssetIndex.recordUsage(asset.id);
    },

    alignSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 2) return;
        const before = items.map(d => ({ doodad: d, x: d.x, y: d.y }));

        if (mode === 'left') {
            const minX = Math.min(...items.map(d => d.x));
            items.forEach(d => d.x = minX);
        } else if (mode === 'right') {
            const maxX = Math.max(...items.map(d => d.x));
            items.forEach(d => d.x = maxX);
        } else if (mode === 'top') {
            const minY = Math.min(...items.map(d => d.y));
            items.forEach(d => d.y = minY);
        } else if (mode === 'bottom') {
            const maxY = Math.max(...items.map(d => d.y));
            items.forEach(d => d.y = maxY);
        } else if (mode === 'centerX') {
            const avgX = Math.round(items.reduce((sum, d) => sum + d.x, 0) / items.length);
            items.forEach(d => d.x = avgX);
        } else if (mode === 'centerY') {
            const avgY = Math.round(items.reduce((sum, d) => sum + d.y, 0) / items.length);
            items.forEach(d => d.y = avgY);
        }

        const after = items.map(d => ({ doodad: d, x: d.x, y: d.y }));
        DocsDoodads.Undo.execute({
            type: 'align_doodads',
            apply: () => {
                after.forEach(a => { a.doodad.x = a.x; a.doodad.y = a.y; });
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => { b.doodad.x = b.x; b.doodad.y = b.y; });
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Aligned ${items.length} doodads (${mode}).`);
    },

    distributeSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 3) {
            this.showToast("Select at least 3 doodads to distribute.");
            return;
        }
        const before = items.map(d => ({ doodad: d, x: d.x, y: d.y }));

        if (mode === 'horizontal') {
            items.sort((a, b) => a.x - b.x);
            const minX = items[0].x;
            const maxX = items[items.length - 1].x;
            const step = (maxX - minX) / (items.length - 1);
            items.forEach((d, idx) => { d.x = Math.round(minX + idx * step); });
        } else if (mode === 'vertical') {
            items.sort((a, b) => a.y - b.y);
            const minY = items[0].y;
            const maxY = items[items.length - 1].y;
            const step = (maxY - minY) / (items.length - 1);
            items.forEach((d, idx) => { d.y = Math.round(minY + idx * step); });
        }

        const after = items.map(d => ({ doodad: d, x: d.x, y: d.y }));
        DocsDoodads.Undo.execute({
            type: 'distribute_doodads',
            apply: () => {
                after.forEach(a => { a.doodad.x = a.x; a.doodad.y = a.y; });
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => { b.doodad.x = b.x; b.doodad.y = b.y; });
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Distributed ${items.length} doodads (${mode}).`);
    },

    groupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length < 2) return;
        const grpId = 'grp_' + Date.now();
        const before = items.map(d => ({ doodad: d, groupId: d.groupId }));
        items.forEach(d => d.groupId = grpId);
        DocsDoodads.Undo.execute({
            type: 'group_doodads',
            apply: () => { items.forEach(d => d.groupId = grpId); },
            revert: () => { before.forEach(b => { if (b.groupId) b.doodad.groupId = b.groupId; else delete b.doodad.groupId; }); }
        });
        this.refreshInspector();
        this.showToast(`Grouped ${items.length} doodads.`);
    },

    ungroupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, groupId: d.groupId }));
        items.forEach(d => delete d.groupId);
        DocsDoodads.Undo.execute({
            type: 'ungroup_doodads',
            apply: () => { items.forEach(d => delete d.groupId); },
            revert: () => { before.forEach(b => { if (b.groupId) b.doodad.groupId = b.groupId; else delete b.doodad.groupId; }); }
        });
        this.refreshInspector();
        this.showToast(`Ungrouped ${items.length} doodads.`);
    },

    lockSelected(locked) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, locked: d.locked }));
        items.forEach(d => d.locked = !!locked);
        DocsDoodads.Undo.execute({
            type: 'lock_doodads',
            apply: () => { items.forEach(d => d.locked = !!locked); },
            revert: () => { before.forEach(b => b.doodad.locked = !!b.locked); }
        });
        this.refreshInspector();
        this.showToast(locked ? `Locked ${items.length} doodads.` : `Unlocked ${items.length} doodads.`);
    },

    hideSelected(hidden) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, editorHidden: d.editorHidden }));
        items.forEach(d => d.editorHidden = !!hidden);
        DocsDoodads.Undo.execute({
            type: 'hide_doodads',
            apply: () => {
                items.forEach(d => d.editorHidden = !!hidden);
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => b.doodad.editorHidden = !!b.editorHidden);
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(hidden ? `Hidden ${items.length} doodads in editor.` : `Showing ${items.length} doodads.`);
    },

    bringForward(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: (d.z || 0) + 1 }));
        DocsDoodads.Undo.execute({
            type: 'z_order_fwd',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Brought ${items.length} doodad(s) forward (+1 Z)`);
    },

    sendBackward(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: (d.z || 0) - 1 }));
        DocsDoodads.Undo.execute({
            type: 'z_order_back',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Sent ${items.length} doodad(s) backward (-1 Z)`);
    },

    bringToFront(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const all = DocsDoodads.doodads() || [];
        let maxZ = 0;
        all.forEach(d => { if ((d.z || 0) > maxZ) maxZ = d.z; });
        const targetZ = maxZ + 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        DocsDoodads.Undo.execute({
            type: 'z_order_front',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Brought ${items.length} doodad(s) to front (Z: ${targetZ})`);
    },

    sendToBack(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const all = DocsDoodads.doodads() || [];
        let minZ = 0;
        all.forEach(d => { if ((d.z || 0) < minZ) minZ = d.z; });
        const targetZ = minZ - 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        DocsDoodads.Undo.execute({
            type: 'z_order_bottom',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Sent ${items.length} doodad(s) to back (Z: ${targetZ})`);
    },

    // Copies are unlocked and get fresh ids; each copied group becomes one new, independent group.
    cloneDoodadsForCopy(items, offset = 16) {
        const groupIds = new Map();
        return items.map(orig => {
            const dup = JSON.parse(JSON.stringify(orig));
            dup.x += offset;
            dup.y += offset;
            dup.locked = false;
            delete dup.uid;
            delete dup.mirrorOf;
            if (orig.groupId) {
                if (!groupIds.has(orig.groupId)) groupIds.set(orig.groupId, 'grp_' + Date.now() + '_' + groupIds.size + '_' + Math.random().toString(36).slice(2, 6));
                dup.groupId = groupIds.get(orig.groupId);
            } else {
                delete dup.groupId;
            }
            return dup;
        });
    },

    clipboardPath: 'data/docs_doodads_cache/clipboard.json',

    // The clipboard is also written to disk so it survives map changes and Playtest restarts.
    copySelected() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        this._clipboardDoodads = items.map(d => JSON.parse(JSON.stringify(d)));
        this._clipboardSourceMapId = this.currentMapId();
        DocsDoodads.FS.atomicWriteJson(this.clipboardPath, { sourceMapId: this._clipboardSourceMapId, doodads: this._clipboardDoodads });
        this.showToast(`Copied ${items.length} doodad(s) to clipboard`);
    },

    loadClipboard() {
        if (this._clipboardDoodads && this._clipboardDoodads.length > 0) return true;
        const saved = DocsDoodads.FS.existsSync(this.clipboardPath) ? DocsDoodads.FS.readJson(this.clipboardPath) : null;
        if (!saved || !Array.isArray(saved.doodads) || saved.doodads.length === 0) return false;
        this._clipboardDoodads = saved.doodads;
        this._clipboardSourceMapId = saved.sourceMapId;
        return true;
    },

    // Same map: the copy is offset so it is visible. Another map: it lands at the same position.
    pasteCopied() {
        if (!this.loadClipboard()) return;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const sameMap = this._clipboardSourceMapId === undefined || this._clipboardSourceMapId === mapId;
        const duplicates = this.cloneDoodadsForCopy(this._clipboardDoodads, sameMap ? 16 : 0);

        const cmd = {
            type: 'paste_doodads',
            apply: () => {
                duplicates.forEach(d => list.push(d));
                DocsDoodads.Persistence.dirtyDoodads = true;
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Pasted ${duplicates.length} doodad(s)${sameMap ? '' : ` from map ${this._clipboardSourceMapId}`}`);
    },

    // ---- Shared undo for whole per-map arrays (prefab sync, mirroring, send to map) ----
    recordMapListsEdit(beforeLists, type) {
        const data = window.$dataDocsDoodads;
        const afterLists = {};
        for (const mapId of Object.keys(beforeLists)) afterLists[mapId] = (data[mapId] || []).slice();
        const write = (lists) => {
            for (const [mapId, items] of Object.entries(lists)) {
                if (!items) { delete data[mapId]; continue; }
                const target = data[mapId] = data[mapId] || [];
                target.length = 0;
                items.forEach(d => target.push(d));
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
            this.refreshSpriteset();
        };
        DocsDoodads.Undo.execute({ type, apply: () => write(afterLists), revert: () => write(beforeLists) });
    },

    snapshotMapLists(mapIds) {
        const data = window.$dataDocsDoodads;
        const out = {};
        for (const mapId of mapIds) out[mapId] = data[mapId] ? data[mapId].slice() : null;
        return out;
    },

    sendDoodadsToMap(items, targetMapId, mode = 'copy') {
        items = (items || []).filter(d => d && (mode === 'copy' || !d.locked));
        const sourceMapId = this.currentMapId();
        targetMapId = Number(targetMapId);
        if (items.length === 0 || !targetMapId || targetMapId === sourceMapId) return 0;
        const data = window.$dataDocsDoodads;
        const before = this.snapshotMapLists([sourceMapId, targetMapId]);
        const target = data[targetMapId] = data[targetMapId] || [];
        if (mode === 'move') {
            const source = data[sourceMapId] || [];
            for (const d of items) {
                const i = source.indexOf(d);
                if (i > -1) source.splice(i, 1);
                target.push(d);
            }
            this.selectedDoodad = null;
            this.selectedDoodads = [];
        } else {
            this.cloneDoodadsForCopy(items, 0).forEach(d => target.push(d));
        }
        this.recordMapListsEdit(before, mode === 'move' ? 'move_to_map' : 'copy_to_map');
        this.showToast(`${mode === 'move' ? 'Moved' : 'Copied'} ${items.length} doodad(s) to map ${targetMapId}`);
        return items.length;
    },

    // Map pixel size; neighbouring maps are read from disk (overridable in tests).
    mapSizeLookup(mapId) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        if (window.$gameMap && $gameMap.mapId() === mapId && $gameMap.width) return { w: $gameMap.width() * tw, h: $gameMap.height() * th };
        const map = DocsDoodads.FS.readJson(DocsDoodads.Persistence.mapFilePath(mapId));
        return map && map.width ? { w: map.width * tw, h: map.height * th } : null;
    },

    mapNeighbors(mapId = this.currentMapId()) {
        const settings = DocsDoodads.Lighting.mapSettings(mapId);
        return (settings && settings.neighbors) || {};
    },

    setMapNeighbors(neighbors) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads;
        const before = data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null;
        const clean = {};
        for (const side of DocsDoodads.MapLinks.sides) if (Number(neighbors[side]) > 0) clean[side] = Number(neighbors[side]);
        const next = Object.assign({}, before || {}, { neighbors: clean });
        const write = (value) => {
            if (value) {
                data.mapSettings = data.mapSettings || {};
                data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
            } else if (data.mapSettings) {
                delete data.mapSettings[mapId];
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'map_neighbors', apply: () => write(next), revert: () => write(before) });
    },

    // Doodads hanging over this map's edges get read-only copies on the neighbouring maps.
    mirrorEdgeDoodads() {
        const mapId = this.currentMapId();
        const neighbors = this.mapNeighbors(mapId);
        const data = window.$dataDocsDoodads;
        const own = data[mapId] || [];
        own.forEach(d => { if (!d.mirrorOf) DocsDoodads.MapLinks.ensureUid(d); });
        const copies = DocsDoodads.MapLinks.edgeCopies(mapId, own, neighbors, id => this.mapSizeLookup(id));
        const targets = new Set(Object.values(neighbors).map(Number).filter(Boolean));
        copies.forEach(c => targets.add(c.mapId));
        if (targets.size === 0) {
            this.showToast('Set neighbouring maps first.');
            return 0;
        }
        const before = this.snapshotMapLists([...targets]);
        for (const target of targets) {
            const list = data[target] = (data[target] || []).filter(d => !(d.mirrorOf && d.mirrorOf.mapId === mapId));
            copies.filter(c => c.mapId === target).forEach(c => list.push(Object.assign(c.doodad, { locked: true })));
        }
        this.recordMapListsEdit(before, 'mirror_edges');
        this.showToast(`Mirrored ${copies.length} edge doodad(s) to ${targets.size} neighbouring map(s).`);
        return copies.length;
    },

    // ---- Path tool ----
    pathSettings: { spacing: 48, alignToPath: false, smooth: false, jitter: 0, endAsset: null, cornerAsset: null },
    pathPoints: [],

    placePath(points, asset, settings = this.pathSettings) {
        if (!asset || !points || points.length === 0) return [];
        const samples = DocsDoodads.Paths.sample(points, settings.spacing, { smooth: settings.smooth });
        const rng = DocsDoodads.Scatter.rng(Date.now());
        const placed = samples.map(p => {
            const special = (p.kind === 'start' || p.kind === 'end') ? settings.endAsset : p.kind === 'corner' ? settings.cornerAsset : null;
            const jitter = Number(settings.jitter) || 0;
            const x = Math.round(p.x + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const y = Math.round(p.y + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const d = this.newDoodadFromAsset(special || asset, x, y);
            if (settings.alignToPath) d.rotation = Math.round(p.angle);
            return d;
        });
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_path',
            apply: () => { placed.forEach(d => list.push(d)); DocsDoodads.Persistence.dirtyDoodads = true; this.refreshSpriteset(); },
            revert: () => { placed.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); }); this.refreshSpriteset(); }
        });
        DocsDoodads.AssetIndex.recordUsage(asset.id);
        this.showToast(`Placed ${placed.length} piece(s) along the path.`);
        return placed;
    },

    finishPath() {
        const points = this.pathPoints || [];
        this.pathPoints = [];
        if (points.length > 0 && this.selectedAsset && this.selectedAsset.category !== 'Audio') this.placePath(points, this.selectedAsset);
    },

    // ---- Prefabs ----
    prefabInstanceDoodads(d) {
        if (!d || !d.prefabRef) return [];
        return (DocsDoodads.doodads() || []).filter(x => x.prefabRef && x.prefabRef.instance === d.prefabRef.instance);
    },

    // Events inside the selection's tile bounds go into the prefab with the doodads.
    eventsWithin(items) {
        if (!items.length || !window.$gameMap) return [];
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const r = DocsDoodads.Guides.unionRect(items.map(d => DocsDoodads.Guides.rectOf(d)));
        const staged = DocsDoodads.Persistence.stagedFor();
        return ((staged && staged.events) || []).filter(e => e &&
            (e.x + 0.5) * tw >= r.left && (e.x + 0.5) * tw <= r.right && (e.y + 0.5) * th >= r.top && (e.y + 0.5) * th <= r.bottom);
    },

    savePrefabFromSelection(name, includeEvents = true) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const events = includeEvents ? this.eventsWithin(items) : [];
        const prefab = DocsDoodads.Prefabs.capture(name, items, events, { tileWidth: tw, tileHeight: th });
        DocsDoodads.Prefabs.add(prefab);
        DocsDoodads.Prefabs.save();
        // The selection itself becomes the prefab's first linked copy.
        const instance = DocsDoodads.Prefabs.newId('pi_');
        this.editDoodads(items, d => {
            d.prefabRef = { id: prefab.id, instance, ox: prefab.origin.x, oy: prefab.origin.y };
            d.groupId = 'grp_' + instance;
        }, 'link_prefab');
        this.showToast(`Saved prefab "${prefab.name}" (${prefab.doodads.length} doodads, ${prefab.events.length} events).`);
        if (this.currentCategory === 'Prefabs') this.refreshDrawerCards();
        return prefab;
    },

    placePrefab(prefab, at) {
        if (!prefab) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const staged = prefab.events && prefab.events.length > 0 ? DocsDoodads.Persistence.stagedFor() : null;
        const reserved = [];
        const inst = DocsDoodads.Prefabs.instantiate(prefab, at, {
            tileWidth: tw, tileHeight: th,
            allocateEventId: () => {
                const id = DocsDoodads.Events.allocateSafeId(staged);
                staged.events[id] = { id, reserved: true };
                reserved.push(id);
                return id;
            }
        });
        reserved.forEach(id => { delete staged.events[id]; });
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_prefab',
            apply: () => {
                inst.doodads.forEach(d => list.push(d));
                inst.events.forEach(e => { staged.events[e.id] = e; });
                DocsDoodads.Persistence.dirtyDoodads = true;
                if (inst.events.length) DocsDoodads.Persistence.dirtyMap = true;
                this.refreshSpriteset();
            },
            revert: () => {
                inst.doodads.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); });
                inst.events.forEach(e => { if (staged.events[e.id] === e) staged.events[e.id] = null; });
                this.refreshSpriteset();
            }
        });
        this.showToast(`Placed prefab "${prefab.name}"${inst.events.length ? ` with ${inst.events.length} event(s)` : ''}.`);
        if (this.selectedAsset && this.selectedAsset.type === 'prefab') this.refreshInspector();
        return inst;
    },

    updatePrefabFromInstance(d) {
        const prefab = d && d.prefabRef ? DocsDoodads.Prefabs.get(d.prefabRef.id) : null;
        if (!prefab) return null;
        DocsDoodads.Prefabs.updateFromInstance(prefab, this.prefabInstanceDoodads(d));
        DocsDoodads.Prefabs.save();
        this.showToast(`Updated prefab "${prefab.name}" from this copy.`);
        return prefab;
    },

    // Rebuilds every placed copy (on every map) from the master, keeping each copy's position and group.
    syncPrefabInstances(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return 0;
        const data = window.$dataDocsDoodads;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapIds = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].some(d => d && d.prefabRef && d.prefabRef.id === prefabId));
        const before = this.snapshotMapLists(mapIds);
        let count = 0;
        for (const mapId of mapIds) {
            const next = [];
            const done = new Set();
            for (const d of data[mapId]) {
                if (!d || !d.prefabRef || d.prefabRef.id !== prefabId) { next.push(d); continue; }
                if (done.has(d.prefabRef.instance)) continue;
                done.add(d.prefabRef.instance);
                const rebuilt = DocsDoodads.Prefabs.instantiate(prefab, { x: d.prefabRef.ox, y: d.prefabRef.oy },
                    { tileWidth: tw, tileHeight: th, instance: d.prefabRef.instance, groupId: d.groupId });
                rebuilt.doodads.forEach(x => next.push(x));
                count++;
            }
            data[mapId].length = 0;
            next.forEach(d => data[mapId].push(d));
        }
        this.recordMapListsEdit(before, 'sync_prefab');
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.showToast(`Synced ${count} cop${count === 1 ? 'y' : 'ies'} of "${prefab.name}".`);
        return count;
    },

    detachPrefabInstance(d) {
        const items = this.prefabInstanceDoodads(d);
        this.editDoodads(items, x => { delete x.prefabRef; }, 'detach_prefab');
    },

    // ---- Dragging doodads with smart guides ----
    activeGuides: [],

    beginDoodadDrag(point) {
        const hit = this.doodadAt(point.x, point.y);
        if (!hit || hit.locked) return false;
        const selection = this.selectedDoodads && this.selectedDoodads.includes(hit) ? this.selectedDoodads : null;
        if (!selection) this.selectDoodad(hit);
        const items = (this.selectedDoodads && this.selectedDoodads.length ? this.selectedDoodads : [hit]).filter(d => !d.locked);
        if (items.length === 0) return false;
        const moving = new Set(items);
        this._drag = {
            start: { x: point.x, y: point.y },
            primary: hit,
            items,
            origin: items.map(d => ({ x: d.x, y: d.y })),
            before: this.snapshotDoodads(items),
            others: (DocsDoodads.doodads() || []).filter(d => !moving.has(d) && !d.editorHidden).map(d => DocsDoodads.Guides.rectOf(d)),
            moved: false
        };
        return true;
    },

    updateDoodadDrag(point, modifiers = {}) {
        const drag = this._drag;
        if (!drag) return;
        let dx = point.x - drag.start.x;
        let dy = point.y - drag.start.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true;
        const primaryIndex = drag.items.indexOf(drag.primary);
        const primaryOrigin = drag.origin[primaryIndex >= 0 ? primaryIndex : 0];
        this.activeGuides = [];
        if (modifiers.shiftKey) {
            const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            const px = primaryOrigin.x + dx, py = primaryOrigin.y + dy;
            dx += Math.round((px - tw / 2) / tw) * tw + tw / 2 - px;
            dy += Math.round(py / th) * th - py;
        } else if (!modifiers.altKey) {
            const rects = drag.items.map((d, i) => DocsDoodads.Guides.rectOf(Object.assign({}, d, { x: drag.origin[i].x + dx, y: drag.origin[i].y + dy })));
            const snap = DocsDoodads.Guides.snap(DocsDoodads.Guides.unionRect(rects), drag.others, 6);
            dx += snap.dx;
            dy += snap.dy;
            this.activeGuides = snap.lines;
        }
        drag.items.forEach((d, i) => {
            d.x = Math.round(drag.origin[i].x + dx);
            d.y = Math.round(drag.origin[i].y + dy);
        });
        this.refreshSpriteset(true);
    },

    endDoodadDrag() {
        const drag = this._drag;
        this._drag = null;
        this.activeGuides = [];
        if (!drag || !drag.moved) return false;
        this.recordDoodadEdit(drag.items, drag.before, 'move_doodads');
        this.refreshInspector();
        return true;
    },

    // Extra editor overlay drawing: smart guides and the path being drawn (screen space).
    drawEditorOverlayExtras(g) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const ox = window.$gameMap ? $gameMap.displayX() * tw : 0;
        const oy = window.$gameMap ? $gameMap.displayY() * th : 0;
        for (const line of this.activeGuides || []) {
            g.lineStyle(1, line.kind === 'spacing' ? 0xf59e0b : 0xec4899, 1);
            if (line.axis === 'x') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
            else if (line.axis === 'y') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'x-gap') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'y-gap') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
        }
        if (this.placementTool === 'path' && this.pathPoints && this.pathPoints.length > 0) {
            const points = this.pathPoints.concat(this._pathHover ? [this._pathHover] : []);
            g.lineStyle(2, 0x22d3ee, 0.9);
            points.forEach((p, i) => { if (i === 0) g.moveTo(p.x - ox, p.y - oy); else g.lineTo(p.x - ox, p.y - oy); });
            g.lineStyle(0);
            for (const s of DocsDoodads.Paths.sample(points, this.pathSettings.spacing, { smooth: this.pathSettings.smooth })) {
                g.beginFill(s.kind === 'segment' ? 0x22d3ee : 0xf59e0b, 0.9);
                g.drawCircle(s.x - ox, s.y - oy, s.kind === 'segment' ? 3 : 5);
                g.endFill();
            }
        }
    },

    // The grid itself is drawn by Spriteset_Map (updateDocsEditorOverlay) in map space so it stays
    // on tile edges at any window scale or scroll position; this only clears the old DOM overlay.
    renderPlacementGrid() {
        const gridEl = document.getElementById('dd-map-grid-overlay');
        if (gridEl && gridEl.parentNode) gridEl.parentNode.removeChild(gridEl);
    },

    // Screen-space x/y positions of tile edges for a width x height area at the current scroll.
    placementGridLines(width, height) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const ox = window.$gameMap ? $gameMap.displayX() * tw : 0;
        const oy = window.$gameMap ? $gameMap.displayY() * th : 0;
        const lines = (size, offset, limit) => {
            const out = [];
            let first = ((-offset % size) + size) % size;
            for (let p = first; p < limit; p += size) out.push(Math.round(p * 100) / 100);
            return out;
        };
        return { xs: lines(tw, ox, width), ys: lines(th, oy, height) };
    },

    toggleGrid() {
        this.gridSnapShow = !this.gridSnapShow;
        this.renderPlacementGrid();
        this.showToast(this.gridSnapShow ? "Grid Overlay Enabled" : "Grid Overlay Disabled");
    },

    toggleInspector() {
        const panel = document.getElementById('dd-inspector-panel');
        if (!panel) return;
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        const resizer = document.getElementById('dd-inspector-resizer');
        if (resizer) resizer.style.display = isHidden ? 'block' : 'none';
        this.showToast(isHidden ? "Inspector Shown" : "Inspector Hidden");
    },

    focusSearch() {
        const inp = document.getElementById('dd-search-input');
        if (inp) {
            inp.focus();
            inp.select();
        }
    },

    refreshSpriteset(sortOnly) {
        if (typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset) {
            if (sortOnly) {
                SceneManager._scene._spriteset.sortDocsDoodads();
            } else {
                SceneManager._scene._spriteset.addDocsDoodads();
            }
        }
    },

    deleteSelectedDoodad() {
        const items = (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : [])).filter(d => !d.locked);
        if (items.length === 0) {
            if (this.selectedDoodad && this.selectedDoodad.locked) {
                this.showToast("Cannot delete: Doodad is locked.");
            }
            return;
        }
        const mapId = (window.$gameMap && typeof window.$gameMap.mapId === 'function') ? window.$gameMap.mapId() : 0;
        const list = (window.$dataDocsDoodads && window.$dataDocsDoodads[mapId]) ? window.$dataDocsDoodads[mapId] : [];
        const toDelete = [...items];
        const deletedRecords = toDelete.map(d => ({ doodad: d, index: list.indexOf(d) })).filter(r => r.index > -1);

        const cmd = {
            apply: () => {
                toDelete.forEach(d => {
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                });
                this.refreshSpriteset();
            },
            revert: () => {
                deletedRecords.forEach(r => {
                    if (!list.includes(r.doodad)) list.splice(r.index, 0, r.doodad);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.refreshInspector();
        this.showToast(`Deleted ${toDelete.length} Doodad(s)`);
    },

    duplicateSelectedDoodad() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0 || !window.$gameMap) return;
        const mapId = typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const duplicates = [];

        duplicates.push(...this.cloneDoodadsForCopy(items));

        const cmd = {
            apply: () => {
                duplicates.forEach(d => list.push(d));
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Duplicated ${duplicates.length} Doodad(s)`);
    },

    // Ghost Follower Preview
    showGhost(asset, clientX, clientY, isAlt) {
        if (!this.ghostEl) {
            this.ghostEl = document.createElement('div');
            this.ghostEl.id = 'dd-map-ghost';
            this.ghostEl.style.cssText = `
                position: fixed; pointer-events: none; z-index: 10002;
                opacity: 0.65; transform: translate(-50%, -100%);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            `;
            const img = document.createElement('img');
            img.id = 'dd-ghost-img';
            img.style.cssText = 'image-rendering: pixelated; max-width: 144px; max-height: 144px;';
            this.ghostEl.appendChild(img);
            document.body.appendChild(this.ghostEl);
        }

        const img = document.getElementById('dd-ghost-img');
        if (img && img.src !== asset.path) img.src = asset.path;

        let posX = clientX;
        let posY = clientY;

        if (!isAlt && window.$gameMap) {
            const coords = this.clientToMapCoords(clientX, clientY);
            const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
                const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                const screenTileX = (coords.tileX * tw + tw / 2 - $gameMap.displayX() * tw) * scaleX + rect.left;
                const screenTileY = (coords.tileY * th + th - $gameMap.displayY() * th) * scaleY + rect.top;
                posX = screenTileX;
                posY = screenTileY;
            }
        }

        this.ghostEl.style.left = posX + 'px';
        this.ghostEl.style.top = posY + 'px';
    },

    removeGhost() {
        if (this.ghostEl && this.ghostEl.parentNode) {
            this.ghostEl.parentNode.removeChild(this.ghostEl);
        }
        this.ghostEl = null;
    },

    // Bottom-centre of the tile under a map point (the default placement spot).
    snapToTile(coords) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const tileX = coords.tileX !== undefined ? coords.tileX : Math.floor(coords.x / tw);
        const tileY = coords.tileY !== undefined ? coords.tileY : Math.floor(coords.y / th);
        return { x: tileX * tw + tw / 2, y: tileY * th + th, tileX, tileY };
    },

    clientToMapCoords(clientX, clientY) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || !window.$gameMap) return { x: 0, y: 0, tileX: 0, tileY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = (canvas.width && rect.width) ? (canvas.width / rect.width) : 1;
        const scaleY = (canvas.height && rect.height) ? (canvas.height / rect.height) : 1;
        const screenX = (clientX - rect.left) * scaleX;
        const screenY = (clientY - rect.top) * scaleY;

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapPixelX = $gameMap.displayX() * tw + screenX;
        const mapPixelY = $gameMap.displayY() * th + screenY;
        const tileX = Math.floor(mapPixelX / tw);
        const tileY = Math.floor(mapPixelY / th);
        return { x: mapPixelX, y: mapPixelY, tileX, tileY };
    },

    // Engine elements stacked above the canvas (MZ #gameVideo/#errorPrinter, MV #GameVideo/#ErrorPrinter)
    // would otherwise receive every drop and click aimed at the map.
    canvasOverlayIds: ['gameVideo', 'errorPrinter', 'GameVideo', 'ErrorPrinter'],

    setCanvasOverlaysPassthrough(enabled) {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
        if (enabled) {
            this._overlayPointerEvents = {};
            for (const id of this.canvasOverlayIds) {
                const el = document.getElementById(id);
                if (!el || !el.style) continue;
                this._overlayPointerEvents[id] = el.style.pointerEvents;
                el.style.pointerEvents = 'none';
            }
        } else if (this._overlayPointerEvents) {
            for (const [id, previous] of Object.entries(this._overlayPointerEvents)) {
                const el = document.getElementById(id);
                if (el && el.style) el.style.pointerEvents = previous;
            }
            this._overlayPointerEvents = null;
        }
    },

    attachCanvasListeners() {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas) return;
        this.setCanvasOverlaysPassthrough(true);

        this._onDragOver = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.showGhost(this.activeDragPayload, e.clientX, e.clientY, e.altKey);
            }
        };

        this._onDrop = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.removeGhost();
                const payload = this.activeDragPayload;
                this.activeDragPayload = null;
                const coords = this.clientToMapCoords(e.clientX, e.clientY);

                if (payload.category === 'Audio') {
                    if (window.$gameMap && window.$gameMap.eventsXy) {
                        const existingEvents = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                        if (existingEvents && existingEvents.length > 0) {
                            const targetEv = existingEvents[0];
                            if (confirm(`Append sound command for ${payload.fileName} to existing Event EV${String(targetEv.eventId()).padStart(3, '0')} on this tile?`)) {
                                this.appendAudioCommandToEvent(payload, targetEv);
                                return;
                            }
                        }
                    }
                    if (confirm(`Create a sound trigger event for ${payload.fileName} at this tile?`)) {
                        this.createAudioEvent(payload, coords);
                    }
                    return;
                }

                if (payload.type === 'prefab') {
                    this.placePrefab(DocsDoodads.Prefabs.get(payload.prefabId), e.altKey ? coords : this.snapToTile(coords));
                    return;
                }
                if (payload.placementMode === 'ask') {
                    this.showAskEventModal(payload, coords, e.altKey);
                } else {
                    const snapCoords = e.altKey ? coords : {
                        x: coords.tileX * 48 + 24,
                        y: coords.tileY * 48 + 48,
                        tileX: coords.tileX,
                        tileY: coords.tileY
                    };
                    this.commitPlacement(payload, snapCoords, payload.placementMode);
                }
            }
        };

        this._onCanvasContextMenu = (e) => {
            if (!this.mounted) return;
            e.preventDefault();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);
            const items = [];

            // Check if right-clicking placed doodad
            const clickedDoodad = this.doodadAt(coords.x, coords.y);

            if (clickedDoodad) {
                this.selectDoodad(clickedDoodad);
                items.push({ label: 'Bring Forward (+1 Z)', icon: '⬆️', onClick: () => this.bringForward([clickedDoodad]) });
                items.push({ label: 'Send Backward (-1 Z)', icon: '⬇️', onClick: () => this.sendBackward([clickedDoodad]) });
                items.push({ label: 'Bring to Front', icon: '⏫', onClick: () => this.bringToFront([clickedDoodad]) });
                items.push({ label: 'Send to Back', icon: '⏬', onClick: () => this.sendToBack([clickedDoodad]) });
                items.push({ separator: true });
                items.push({ label: 'Duplicate (Ctrl+D)', icon: '📄', onClick: () => this.duplicateSelectedDoodad() });
                items.push({ label: clickedDoodad.locked ? 'Unlock' : 'Lock', icon: clickedDoodad.locked ? '🔓' : '🔒', onClick: () => { clickedDoodad.locked = !clickedDoodad.locked; this.refreshInspector(); } });
                items.push({ label: 'Hide in Editor', icon: '👁️', onClick: () => { clickedDoodad.editorHidden = true; this.refreshSpriteset(true); this.refreshInspector(); } });
                items.push({ label: 'Delete (Del)', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedDoodad() });
                this.showContextMenu(e.clientX, e.clientY, items);
                return;
            }

            // Check if right-clicking placed MZ Event
            if (window.$gameMap && window.$gameMap.eventsXy) {
                const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                if (evs && evs.length > 0) {
                    const ge = evs[0];
                    const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                    const evObj = staged || ge.event();
                    this.selectEvent({ gameEvent: ge, stagedEvent: evObj });
                    items.push({
                        label: 'Save as Event Template...', icon: '💾', onClick: () => {
                            const name = prompt("Enter a name for this new Event Template:", evObj.name || ("Template_EV" + ge.eventId()));
                            if (name && name.trim()) {
                                const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                                DocsDoodads.EventTemplates.saveCustomTemplate(name.trim(), evObj, cat.trim());
                                this.showToast(`Saved template "${name.trim()}"!`);
                            }
                        }
                    });
                    items.push({ label: 'Duplicate Event', icon: '📄', onClick: () => this.duplicateSelectedEvent() });
                    items.push({ label: 'Delete Event', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedEvent() });
                    this.showContextMenu(e.clientX, e.clientY, items);
                    return;
                }
            }

            // Right-clicking empty map
            items.push({ label: this.gridSnapShow ? 'Hide Grid Overlay (G)' : 'Show Grid Overlay (G)', icon: '📐', onClick: () => this.toggleGrid() });
            if (this._clipboardDoodads && this._clipboardDoodads.length > 0) {
                items.push({ label: `Paste ${this._clipboardDoodads.length} Doodad(s) (Ctrl+V)`, icon: '📑', onClick: () => this.pasteCopied() });
            }
            if (this.selectedAsset) {
                items.push({ label: `Stamp ${this.selectedAsset.fileName} Here`, icon: '📌', onClick: () => this.commitPlacement(this.selectedAsset, coords) });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                return;
            }
            this.closeContextMenu();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);

            // 1. Eyedropper Tool or Alt held
            if (this.placementTool === 'eyedropper' || e.altKey) {
                this.handleEyedropper(coords);
                return;
            }

            // 2. Path Tool: collect points
            if (this.placementTool === 'path') {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('Select an image asset in the drawer to draw a path with.');
                    return;
                }
                this.pathPoints.push(e.altKey ? { x: coords.x, y: coords.y } : this.snapToTile(coords));
                return;
            }

            // 3. Stamp Tool
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                const snapCoords = e.altKey ? coords : {
                    x: coords.tileX * 48 + 24,
                    y: coords.tileY * 48 + 48,
                    tileX: coords.tileX,
                    tileY: coords.tileY
                };
                this.commitPlacement(this.selectedAsset, snapCoords);
                return;
            }

            // 3. Normal Pointer: Select placed doodad or MZ event
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };

        this._onCanvasMouseDown = (e) => {
            if (this.placementTool === 'brush' && this.selectedAsset) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.scatterAt(e.clientX, e.clientY);
                return;
            }
            if (!this.placementTool && e.button === 0 && !e.shiftKey && !e.altKey) {
                const point = this.clientToMapCoords(e.clientX, e.clientY);
                if (this.beginDoodadDrag(point)) {
                    this._dragClientStart = { x: e.clientX, y: e.clientY };
                    this._dragActive = false;
                    return;
                }
            }
            if (!this.placementTool && e.button === 0) {
                this.isMarqueeActive = true;
                this.marqueeStartClient = { x: e.clientX, y: e.clientY };
                this.marqueeStartMap = this.clientToMapCoords(e.clientX, e.clientY);
                this.marqueeShift = e.shiftKey;
                this.hasMarqueeMoved = false;
            }
        };

        this._onCanvasMouseMove = (e) => {
            if (this._drag) {
                // The mouse-up was missed (e.g. focus left the window): finish where the drag last was.
                if (e.buttons === 0) {
                    if (this.endDoodadDrag()) this._suppressNextClick = true;
                    this._dragActive = false;
                    return;
                }
                // A small wobble while clicking is not a move.
                if (!this._dragActive && Math.hypot(e.clientX - this._dragClientStart.x, e.clientY - this._dragClientStart.y) < 4) return;
                this._dragActive = true;
                this.updateDoodadDrag(this.clientToMapCoords(e.clientX, e.clientY), { shiftKey: e.shiftKey, altKey: e.altKey });
                return;
            }
            if (this.placementTool === 'path') {
                const hover = this.clientToMapCoords(e.clientX, e.clientY);
                this._pathHover = e.altKey ? { x: hover.x, y: hover.y } : this.snapToTile(hover);
                return;
            }
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            } else if (this.isMarqueeActive && this.marqueeStartClient) {
                const dx = e.clientX - this.marqueeStartClient.x;
                const dy = e.clientY - this.marqueeStartClient.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasMarqueeMoved = true;
                    let overlay = document.getElementById('dd-marquee-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'dd-marquee-overlay';
                        overlay.style.cssText = `
                            position: fixed; pointer-events: none; z-index: 10006;
                            border: 1px dashed #38bdf8; background: rgba(56, 189, 248, 0.18);
                            box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
                            border-radius: 2px;
                        `;
                        document.body.appendChild(overlay);
                    }
                    const left = Math.min(this.marqueeStartClient.x, e.clientX);
                    const top = Math.min(this.marqueeStartClient.y, e.clientY);
                    overlay.style.left = left + 'px';
                    overlay.style.top = top + 'px';
                    overlay.style.width = Math.abs(dx) + 'px';
                    overlay.style.height = Math.abs(dy) + 'px';
                }
            }
        };

        this._onCanvasMouseUp = (e) => {
            if (this._drag) {
                if (this.endDoodadDrag()) this._suppressNextClick = true;
                this._dragActive = false;
                return;
            }
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        },
                        revert: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        }
                    };
                    DocsDoodads.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
            if (this.isMarqueeActive) {
                const overlay = document.getElementById('dd-marquee-overlay');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (this.hasMarqueeMoved && this.marqueeStartMap) {
                    const currentMap = this.clientToMapCoords(e.clientX, e.clientY);
                    const minX = Math.min(this.marqueeStartMap.x, currentMap.x);
                    const maxX = Math.max(this.marqueeStartMap.x, currentMap.x);
                    const minY = Math.min(this.marqueeStartMap.y, currentMap.y);
                    const maxY = Math.max(this.marqueeStartMap.y, currentMap.y);

                    const all = DocsDoodads.doodads() || [];
                    const enclosed = all.filter(d => !d.editorHidden && d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY);

                    if (this.marqueeShift) {
                        const current = this.selectedDoodads ? [...this.selectedDoodads] : [];
                        enclosed.forEach(d => {
                            if (!current.includes(d)) current.push(d);
                        });
                        this.selectDoodads(current);
                    } else {
                        this.selectDoodads(enclosed);
                    }
                    this._suppressNextClick = true;
                    this.showToast(`Marquee: Selected ${enclosed.length} doodad(s)`);
                }
                this.isMarqueeActive = false;
            }
        };

        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
            canvas.addEventListener('contextmenu', this._onCanvasContextMenu);
            this._onCanvasDblClick = (e) => {
                if (this.placementTool === 'path') {
                    e.preventDefault();
                    this.finishPath();
                }
            };
            canvas.addEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('mousemove', this._onCanvasMouseMove);
            window.addEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    detachCanvasListeners() {
        this.setCanvasOverlaysPassthrough(false);
        const canvas = DocsDoodads.Compat.getCanvas();
        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
            if (this._onCanvasDblClick) canvas.removeEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
            if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // Evenly spaced scatter: props keep minDistance from each other and from what is already there,
    // and only land where the region/terrain/passability rules allow.
    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        this._scatterRng = this._scatterRng || DocsDoodads.Scatter.rng(Date.now());
        const rng = this._scatterRng;
        const reach = b.radius + (b.minDistance || 0);
        const existing = list.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        const points = DocsDoodads.Scatter.candidates(coords, b.radius, b.minDistance || 0, existing, b.density, rng);
        const rules = {
            regions: DocsDoodads.Scatter.parseIdList(b.regions),
            terrainTags: DocsDoodads.Scatter.parseIdList(b.terrainTags),
            avoidBlocked: Boolean(b.avoidBlocked)
        };
        const gameMap = window.$gameMap;
        const query = {
            tileWidth: gameMap && gameMap.tileWidth ? gameMap.tileWidth() : 48,
            tileHeight: gameMap && gameMap.tileHeight ? gameMap.tileHeight() : 48,
            width: gameMap && gameMap.width ? gameMap.width() : Infinity,
            height: gameMap && gameMap.height ? gameMap.height() : Infinity,
            regionId: (x, y) => (gameMap && gameMap.regionId ? gameMap.regionId(x, y) : 0),
            terrainTag: (x, y) => (gameMap && gameMap.terrainTag ? gameMap.terrainTag(x, y) : 0),
            isPassable: (x, y) => (gameMap && gameMap.isPassable ? [2, 4, 6, 8].some(d => gameMap.isPassable(x, y, d)) : true)
        };

        for (const p of points) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const v = DocsDoodads.Scatter.variation(b, rng);
            const d = this.newDoodadFromAsset(asset, Math.round(p.x), Math.round(p.y));
            d.scaleX = v.scale * (v.flipX ? -1 : 1);
            d.scaleY = v.scale;
            d.rotation = v.rotation;
            if (v.hue) d.hue = v.hue;
            list.push(d);
            this.currentBrushBatch.push(d);
        }
        this.refreshSpriteset();
    },

    handleEyedropper(coords) {
        const d = this.doodadAt(coords.x, coords.y);
        if (d) {
            const sourcePath = d.bit && d.bit[0] === 3 ? String(d.bit[1]).replace(/\\/g, '/').toLowerCase() : null;
            const asset = sourcePath && DocsDoodads.AssetIndex.list.find(a => String(a.path || '').replace(/\\/g, '/').toLowerCase() === sourcePath);
            if (asset) {
                this.selectAsset(asset);
                this.showToast(`Eyedropper: Selected ${asset.fileName} in drawer`);
            } else {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
            }
            return;
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = DocsDoodads.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
                    if (matchedAsset) {
                        this.selectAsset(matchedAsset);
                        this.showToast(`Eyedropper: Matched Character Sheet ${charName}`);
                        return;
                    }
                }
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Eyedropper: Selected Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        this.showToast("No doodad or event under cursor");
    },

    doodadContainsPoint(d, x, y) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0);
        if (x >= left && x <= left + w && y >= top && y <= top + h) return true;
        // Keep small props easy to click.
        return Math.hypot(d.x - x, d.y - y) < 40;
    },

    // Screen-space boxes for the selected doodads, matching Sprite_DocsDoodad placement.
    selectionScreenRects() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        return items.filter(d => !d.editorHidden).map(d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
            const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const offsetX = d.posMode === 1 && window.$gameMap ? $gameMap.displayX() * tw : 0;
            const offsetY = d.posMode === 1 && window.$gameMap ? $gameMap.displayY() * th : 0;
            return {
                x: d.x - offsetX - w * (d.anchorX !== undefined ? d.anchorX : 0.5),
                y: d.y - offsetY - h * (d.anchorY !== undefined ? d.anchorY : 1.0),
                w, h
            };
        });
    },

    // Topmost visible doodad whose image covers the map point.
    doodadAt(x, y) {
        const list = DocsDoodads.doodads() || [];
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (!d.editorHidden && this.doodadContainsPoint(d, x, y)) return d;
        }
        return null;
    },

    handleDoodadSelection(coords, isMulti) {
        const hit = this.doodadAt(coords.x, coords.y);
        if (hit) {
            this.selectDoodad(hit, isMulti);
            return;
        }
        // If no doodad clicked, check for genuine MZ Event on that tile
        if (!isMulti && window.$gameMap && window.$gameMap.eventsXy) {
            const events = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (events && events.length > 0) {
                const ge = events[0];
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Selected Map Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
            this.selectEvent(null);
        }
    },

    showAskEventModal(payload, coords, isAlt) {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 8px;">PLACEMENT DECISION</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px;">Does ${escapeHtml(payload.fileName)} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-ask-yes">Yes (Create MZ Event)</button>
                <button class="dd-btn" id="dd-ask-no">No (Decorative Doodad)</button>
                <button class="dd-btn" id="dd-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="dd-btn" id="dd-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="dd-btn" id="dd-ask-cancel" style="width: 100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const snapCoords = isAlt ? coords : {
            x: coords.tileX * 48 + 24,
            y: coords.tileY * 48 + 48,
            tileX: coords.tileX,
            tileY: coords.tileY
        };

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-yes-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);
        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: `Sound_${baseName}`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: [
                { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });

        $gameMap._stagedMapData.events[newId] = ev;
        DocsDoodads.Persistence.dirtyMap = true;
        this.showToast(`Created Sound Event EV${String(newId).padStart(3, '0')}`);
    },

    deleteSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ge = evInfo.gameEvent;
        const ev = evInfo.stagedEvent || (ge && ge.event());
        const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
        if (!evId) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                if (ge && ge._erased !== undefined) ge._erased = true;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                if (ge && ge._erased !== undefined) ge._erased = false;
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent(null);
        this.showToast(`Deleted Event EV${String(evId).padStart(3, '0')}`);
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = (dup.x || 0) + 1;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(`Duplicated to Event EV${String(newId).padStart(3, '0')}`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'dd-context-menu';
        menu.className = 'dd-glass';
        menu.style.cssText = `
            position: fixed; z-index: 10050; min-width: 180px; padding: 4px;
            display: flex; flex-direction: column; gap: 2px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7);
        `;
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 3px 0;';
                menu.appendChild(sep);
                return;
            }
            const row = document.createElement('button');
            row.className = 'dd-btn';
            row.style.cssText = `
                text-align: left; width: 100%; border: none; background: transparent;
                padding: 5px 10px; font-size: 11px; display: flex; align-items: center; gap: 6px;
                color: ${item.danger ? '#f87171' : '#e2e8f0'};
            `;
            row.innerHTML = `<span>${escapeHtml(item.icon || '•')}</span> <span>${escapeHtml(item.label)}</span>`;
            row.onmouseenter = () => { row.style.background = item.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.25)'; };
            row.onmouseleave = () => { row.style.background = 'transparent'; };
            row.onclick = (e) => {
                e.stopPropagation();
                this.closeContextMenu();
                if (item.onClick) item.onClick();
            };
            menu.appendChild(row);
        });
        document.body.appendChild(menu);

        const menuW = menu.offsetWidth || 180;
        const menuH = menu.offsetHeight || 200;
        const left = Math.min(clientX, (window.innerWidth || 1200) - menuW - 10);
        const top = Math.min(clientY, (window.innerHeight || 800) - menuH - 10);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        const onDismiss = (ev) => {
            if (menu.contains(ev.target)) return;
            this.closeContextMenu();
            window.removeEventListener('pointerdown', onDismiss);
        };
        setTimeout(() => window.addEventListener('pointerdown', onDismiss), 50);
    },

    closeContextMenu() {
        const existing = document.getElementById('dd-context-menu');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const evId = gameEvent.eventId();
        const ev = $gameMap._stagedMapData.events[evId] || gameEvent.event();
        if (!ev || !ev.pages || !ev.pages[0]) return;

        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const soundCmd = { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] };
        const pageList = ev.pages[0].list;
        const insertIdx = Math.max(0, pageList.length - 1);

        const cmd = {
            type: 'append_audio_command',
            apply: () => {
                pageList.splice(insertIdx, 0, soundCmd);
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.showToast(`Appended Sound Command to Event EV${String(evId).padStart(3, '0')}`);
    },

    async runAssetImport(sourcePaths, options = {}) {
        const plan = DocsDoodads.Import.planBatch(sourcePaths, options);
        const result = await DocsDoodads.Import.executeBatchAsync(plan, {
            cancellationToken: options.cancellationToken,
            onProgress: options.onProgress
        });
        if (!result.ok) return result;

        await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
        this.refreshDrawerCards();

        if (options.autoSlice) {
            const path = DocsDoodads.FS.path;
            const imported = new Set(result.imported.map(filePath => path.resolve(filePath).toLowerCase()));
            const firstImage = DocsDoodads.AssetIndex.list.find(asset =>
                asset.category !== 'Audio' && imported.has(path.resolve(asset.path).toLowerCase())
            );
            if (firstImage && typeof setTimeout === 'function') {
                setTimeout(() => DocsDoodads.Slicing.Editor.open(firstImage), 0);
            }
        }
        return result;
    },

    showAssetImportModal(sourcePaths) {
        if (!DocsDoodads.FS.fs || !DocsDoodads.FS.path) {
            this.showToast('Explorer import requires NW.js filesystem access.');
            return;
        }

        const collected = DocsDoodads.Import.collectFiles(sourcePaths);
        const supportedCount = collected.files.filter(filePath => DocsDoodads.Import.isSupported(filePath)).length;
        if (supportedCount === 0) {
            this.showToast('No supported image or audio files were found.');
            return;
        }

        const previous = document.getElementById('dd-import-modal');
        if (previous && previous.parentNode) previous.parentNode.removeChild(previous);

        const overlay = document.createElement('div');
        overlay.id = 'dd-import-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10030; display: flex;
            align-items: center; justify-content: center; background: rgba(2,6,23,0.72);
            pointer-events: auto;
        `;
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = 'width: 430px; padding: 20px; color: #e2e8f0;';
        const destinationOptions = DocsDoodads.Import.destinations
            .map(destination => `<option value="${destination}">${destination}</option>`)
            .join('');
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 6px;">IMPORT PROJECT ASSETS</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px;">
                ${supportedCount} supported file(s) found${collected.files.length !== supportedCount ? `; ${collected.files.length - supportedCount} unsupported skipped` : ''}.
            </div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">Destination</label>
            <select id="dd-import-destination" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="auto">Auto-route by asset type</option>
                ${destinationOptions}
            </select>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">When a filename already exists (apply to all)</label>
            <select id="dd-import-collision" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="rename">Keep both (add numeric suffix)</option>
                <option value="skip">Skip incoming file</option>
                <option value="overwrite">Overwrite existing file</option>
                <option value="error">Cancel batch on collision</option>
            </select>
            <label style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #cbd5e1; margin-bottom: 16px;">
                <input id="dd-import-auto-slice" type="checkbox" /> Open the first imported image in the slicer
            </label>
            <div id="dd-import-warning" style="display: none; color: #fbbf24; font-size: 11px; margin: -6px 0 12px;">
                Overwrite is explicit and transactional; existing files are restored if the batch fails.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-import-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-import-confirm">Import</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
        const destination = document.getElementById('dd-import-destination');
        const collision = document.getElementById('dd-import-collision');
        const autoSlice = document.getElementById('dd-import-auto-slice');
        const warning = document.getElementById('dd-import-warning');
        const confirmButton = document.getElementById('dd-import-confirm');
        const cancelButton = document.getElementById('dd-import-cancel');
        let activeCancellation = null;

        collision.onchange = () => {
            warning.style.display = collision.value === 'overwrite' ? 'block' : 'none';
        };
        cancelButton.onclick = () => {
            if (activeCancellation) {
                activeCancellation.cancelled = true;
                cancelButton.disabled = true;
                cancelButton.textContent = 'Cancelling…';
            } else {
                close();
            }
        };
        confirmButton.onclick = async () => {
            activeCancellation = { cancelled: false };
            confirmButton.disabled = true;
            destination.disabled = true;
            collision.disabled = true;
            autoSlice.disabled = true;
            const result = await this.runAssetImport(sourcePaths, {
                destination: destination.value,
                collisionPolicy: collision.value,
                autoSlice: Boolean(autoSlice.checked),
                cancellationToken: activeCancellation,
                onProgress: progress => {
                    confirmButton.textContent = `Importing ${progress.completed}/${progress.total}…`;
                }
            });
            activeCancellation = null;
            close();
            this.showToast(DocsDoodads.Import.describeResult(result), result.ok ? 3500 : 6000);
            this.updateIndexStatus();
        };
        overlay.onclick = event => { if (event.target === overlay && !activeCancellation) close(); };
    },

    showConflictModal() {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 440px; padding: 22px; z-index: 10025; text-align: center;
            border: 2px solid #ef4444;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #ef4444; font-size: 15px; margin-bottom: 10px;">EXTERNAL CONFLICT DETECTED</div>
            <div style="font-size: 12px; line-height: 1.6; color: #cbd5e1; margin-bottom: 18px;">
                The current map file was modified externally (e.g. in the RPG Maker MZ editor) since this workspace session began.<br><br>
                Overwriting now may erase external edits made in MZ.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="dd-btn" id="dd-conf-force" style="background: #b91c1c;">Force Overwrite With Workspace Changes</button>
                <button class="dd-btn" id="dd-conf-reload">Reload Map from Disk (Discard Workspace Staged)</button>
                <button class="dd-btn" id="dd-conf-cancel">Cancel Save</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-conf-force').onclick = () => {
            closeM();
            DocsDoodads.Persistence.saveAll(true);
        };
        document.getElementById('dd-conf-reload').onclick = () => {
            closeM();
            const persistence = DocsDoodads.Persistence;
            for (const entry of persistence.pendingMapEntries()) {
                const file = persistence.mapFilePath(entry.mapId);
                persistence.sessionSnapshots[file] = DocsDoodads.FS.stat(file);
            }
            persistence.stagedMaps = {};
            if ($gameMap) { $gameMap._stagedMapData = null; delete $gameMap._stagedMapDataId; }
            persistence.dirtyMap = false;
            persistence.captureSession();
            this.showToast("External Map Data Reloaded!");
        };
        document.getElementById('dd-conf-cancel').onclick = closeM;
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'dd-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 12px;">SYSTEM DIAGNOSTICS</div>
            <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1;">
                <div>Total Indexed Assets: <strong style="color: #fff;">${DocsDoodads.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: #fff;">${Object.keys(DocsDoodads.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: #fff;">${DocsDoodads.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: #fff;">${DocsDoodads.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: #fff;">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="dd-btn dd-btn-primary" id="dd-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="dd-btn" id="dd-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="dd-btn" id="dd-close-diag-btn">Close</button>
            </div>
            <button class="dd-btn" id="dd-restore-backup-btn" style="width: 100%; margin-top: 8px; border-color: #f59e0b; color: #fde68a;">Restore Project Backup…</button>
        `;
        document.body.appendChild(diag);

        document.getElementById('dd-rebuild-idx-btn').onclick = async () => {
            DocsDoodads.AssetIndex.data.assets = {};
            await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-clear-cache-btn').onclick = () => {
            DocsDoodads.Thumbnail.cache = {};
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-restore-backup-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
            this.showBackupRestoreModal();
        };

        document.getElementById('dd-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showBackupRestoreModal() {
        const mapFile = `data/Map${String($gameMap ? $gameMap.mapId() : 0).padStart(3, '0')}.json`;
        const targets = [
            { label: 'Current Map', path: mapFile },
            { label: 'Doodads', path: 'data/' + dataFileName },
            { label: 'Asset Library', path: DocsDoodads.AssetIndex.libraryPath }
        ];
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 480px; padding: 20px; z-index: 10035; border: 1px solid #f59e0b;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #fde68a; font-size: 14px; margin-bottom: 8px;">RESTORE PROJECT BACKUP</div>
            <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin-bottom: 14px;">
                Backups are validated before restore. The current file is backed up again first so this action remains reversible.
            </div>
            <label style="font-size: 11px; color: #94a3b8;">Project file</label>
            <select id="dd-restore-target" style="width: 100%; margin: 5px 0 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                ${targets.map(target => `<option value="${target.path}">${target.label} — ${target.path}</option>`).join('')}
            </select>
            <label style="font-size: 11px; color: #94a3b8;">Backup snapshot</label>
            <select id="dd-restore-source" style="width: 100%; margin: 5px 0 16px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;"></select>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-restore-cancel">Cancel</button>
                <button class="dd-btn" id="dd-restore-confirm" style="background: #b45309;">Restore Selected Backup</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetSelect = document.getElementById('dd-restore-target');
        const backupSelect = document.getElementById('dd-restore-source');
        const restoreButton = document.getElementById('dd-restore-confirm');
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        const refreshBackups = () => {
            const backups = DocsDoodads.FS.listBackups(targetSelect.value);
            backupSelect.innerHTML = '';
            for (const backup of backups) {
                const option = document.createElement('option');
                option.value = backup.path;
                option.textContent = `${new Date(backup.mtimeMs).toLocaleString()} — ${Math.ceil(backup.size / 1024)} KB`;
                backupSelect.appendChild(option);
            }
            restoreButton.disabled = backups.length === 0;
            if (backups.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'No backups available for this file';
                backupSelect.appendChild(option);
            }
        };
        targetSelect.onchange = refreshBackups;
        document.getElementById('dd-restore-cancel').onclick = close;
        restoreButton.onclick = () => {
            if (!backupSelect.value) return;
            const targetPath = targetSelect.value;
            if (!confirm(`Restore ${targetPath} from the selected backup?`)) return;
            const result = DocsDoodads.FS.restoreBackup(targetPath, backupSelect.value);
            if (!result.ok) {
                this.showToast(`Restore failed: ${result.error}`);
                return;
            }

            if (targetPath === DocsDoodads.AssetIndex.libraryPath) {
                DocsDoodads.AssetIndex.init();
                this.refreshDrawerCards();
            } else if (targetPath === 'data/' + dataFileName) {
                window.$dataDocsDoodads = DocsDoodads.FS.readJson(targetPath) || {};
                DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
                this.refreshSpriteset();
            } else if (targetPath === mapFile && window.$gameMap) {
                $gameMap._stagedMapData = DocsDoodads.FS.readJson(targetPath);
                $gameMap._stagedMapDataId = $gameMap.mapId();
                DocsDoodads.Persistence.captureSession();
            }
            close();
            this.showToast('Backup restored. Reload the current map before continuing edits.');
        };
        refreshBackups();
    },

    showRecoveryNotices() {
        const notices = DocsDoodads.FS.takeRecoveryNotices();
        if (notices.length > 0) this.showToast(notices.join(' '), 9000);
    },

    showToast(msg, duration = 2200) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 20px;
            font-size: 12px; font-weight: bold; z-index: 10030; box-shadow: 0 4px 14px rgba(0,0,0,0.5);
            pointer-events: none; transition: opacity 0.3s;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        }, duration);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-undo-btn');
        const rBtn = document.getElementById('dd-redo-btn');
        if (uBtn) uBtn.style.opacity = DocsDoodads.Undo.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = DocsDoodads.Undo.redoStack.length > 0 ? '1' : '0.5';
    }
};

//==========================================================
// SECTION 25: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        $.Scene_Map_onMapLoaded.call(this);
        DocsDoodads.Workspace.onMapLoaded();
    };
}

DocsDoodads.isEditableTarget = function(target) {
    return Boolean(target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable));
};

// While the workspace is open the game world is frozen: clicks in editor panels must not
// walk the player, events must not wander or trigger, and the menu must stay closed.
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (DocsDoodads.Workspace.mounted) return false;
        return $.Game_Player_canMove.call(this);
    };
}
if (typeof Game_Event !== 'undefined') {
    $.Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        if (DocsDoodads.Workspace.mounted) return;
        $.Game_Event_updateSelfMovement.call(this);
    };
}
if (typeof Game_Map !== 'undefined') {
    // Staged event edits belong to the map they were made on; park them when another map loads.
    $.Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (this === window.$gameMap && this._mapId && this._mapId !== mapId) {
            DocsDoodads.Persistence.onMapChanging(this._mapId, mapId);
        }
        $.Game_Map_setup.call(this, mapId);
    };
    $.Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        if (DocsDoodads.Workspace.mounted) return true;
        return $.Game_Map_isEventRunning.call(this);
    };
}
// MZ's TouchInput cancels every wheel event on the document, which stops the asset grid,
// tab bar, and inspector lists from scrolling. The game has no use for the wheel while editing.
if (typeof TouchInput !== 'undefined' && typeof TouchInput._onWheel === 'function') {
    $.TouchInput__onWheel = TouchInput._onWheel;
    TouchInput._onWheel = function(event) {
        if (DocsDoodads.Workspace.mounted) return;
        $.TouchInput__onWheel.call(this, event);
    };
}
// MZ's Input listens on the whole document and prevents Backspace/arrows by default,
// which breaks typing in workspace fields and lets keystrokes drive the game.
if (typeof Input !== 'undefined' && typeof Input._onKeyDown === 'function') {
    $.Input__onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        if (DocsDoodads.Workspace.mounted && DocsDoodads.isEditableTarget(event.target)) return;
        $.Input__onKeyDown.call(this, event);
    };
}

// Windows Explorer native drag and drop import listener with transactional options modal
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('dragover', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const sourcePaths = [];
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    if (f.path) sourcePaths.push(f.path);
                }
                if (sourcePaths.length > 0) DocsDoodads.Workspace.showAssetImportModal(sourcePaths);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        // editKey is a KeyboardEvent.code ("F10"), which Input.keyMapper never reports, so opening is handled here.
        if (e.code === editKey) {
            const onMap = typeof Scene_Map !== 'undefined' && typeof SceneManager !== 'undefined' && SceneManager._scene instanceof Scene_Map;
            if (!DocsDoodads.Workspace.mounted && !onMap) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggle();
            return;
        }
        if (!DocsDoodads.Workspace.mounted || DocsDoodads.isEditableTarget(e.target)) return;
        if (DocsDoodads.Slicing.Editor.modal) return; // the slicer owns undo/delete while it is open
        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            DocsDoodads.Undo.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            DocsDoodads.Undo.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            DocsDoodads.Persistence.saveAll();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            DocsDoodads.Workspace.duplicateSelectedDoodad();
        } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            DocsDoodads.Workspace.copySelected();
        } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            DocsDoodads.Workspace.pasteCopied();
        } else if (e.key === 'Delete') {
            if (DocsDoodads.Workspace.selectedEvent) {
                DocsDoodads.Workspace.deleteSelectedEvent();
            } else {
                DocsDoodads.Workspace.deleteSelectedDoodad();
            }
        } else if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            DocsDoodads.Workspace.toggleGrid();
        } else if (e.key === 'h' || e.key === 'H') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggleInspector();
        } else if (e.key === 'f' || e.key === 'F') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.focusSearch();
        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (DocsDoodads.Workspace.selectedDoodads && DocsDoodads.Workspace.selectedDoodads.length > 0 ? DocsDoodads.Workspace.selectedDoodads : (DocsDoodads.Workspace.selectedDoodad ? [DocsDoodads.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
            if (items.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                items.forEach(d => {
                    if (e.key === 'ArrowLeft') d.x -= step;
                    if (e.key === 'ArrowRight') d.x += step;
                    if (e.key === 'ArrowUp') d.y -= step;
                    if (e.key === 'ArrowDown') d.y += step;
                });
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
                DocsDoodads.Workspace.refreshInspector();
            } else if (DocsDoodads.Workspace.selectedEvent) {
                e.preventDefault();
                const evInfo = DocsDoodads.Workspace.selectedEvent;
                const ge = evInfo.gameEvent;
                const ev = evInfo.stagedEvent || (ge && ge.event());
                if (ev) {
                    const oldX = ev.x, oldY = ev.y;
                    let nx = ev.x, ny = ev.y;
                    if (e.key === 'ArrowLeft') nx--;
                    if (e.key === 'ArrowRight') nx++;
                    if (e.key === 'ArrowUp') ny--;
                    if (e.key === 'ArrowDown') ny++;
                    ev.x = nx; ev.y = ny;
                    if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; }
                    DocsDoodads.Undo.execute({
                        type: 'move_event',
                        apply: () => { ev.x = nx; ev.y = ny; if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; } },
                        revert: () => { ev.x = oldX; ev.y = oldY; if (ge) { ge._x = oldX; ge._y = oldY; ge._realX = oldX; ge._realY = oldY; } }
                    });
                    DocsDoodads.Workspace.refreshInspector();
                }
            }
        } else if (DocsDoodads.Workspace.placementTool === 'path' && (e.key === 'Enter' || e.key === 'Backspace')) {
            e.preventDefault();
            if (e.key === 'Enter') DocsDoodads.Workspace.finishPath();
            else DocsDoodads.Workspace.pathPoints.pop();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            DocsDoodads.Workspace.setPlacementTool(null);
            DocsDoodads.Workspace.removeGhost();
            DocsDoodads.Workspace.selectDoodad(null);
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    const recoveryTimer = setInterval(() => {
        if (editorMode && DocsDoodads.Compat.isTest() && window.$gameMap && (DocsDoodads.Persistence.dirtyMap || DocsDoodads.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: DocsDoodads.doodads(),
                mapSettings: window.$dataDocsDoodads ? window.$dataDocsDoodads.mapSettings : undefined,
                stagedMap: $gameMap._stagedMapData
            };
            DocsDoodads.FS.atomicWriteJson('data/DocsDoodadsRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
    if (recoveryTimer && typeof recoveryTimer.unref === 'function') {
        recoveryTimer.unref();
    }
}

})(DocsDoodads.reWrite);
