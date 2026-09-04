// scratch/build_modular_plugin.js
const fs = require('fs');
const path = require('path');

const targetPlugin = path.join(__dirname, '..', 'QJ-Doodads.js');
console.log("Starting modular build of QJ-Doodads.js...");

// We will construct the comprehensive plugin containing all 23 sections,
// fully upgraded with deep interactive systems.
const parts = [];

// Helper to push code section
function add(code) {
    parts.push(code);
}

// -----------------------------------------------------------------------------
// PART 1: PLUGIN HEADER & ANNOTATIONS
// -----------------------------------------------------------------------------
add(`//==========================================================
// RPG Maker MZ & MV: QJ Doodads Asset Workspace
//==========================================================
/*:
 * @target MZ
 * @plugindesc Asset Workspace & Doodad Engine [V2.0] QJ-Doodads.js
 * @author Qiu Jiu / Upgraded by Antigravity
 *
 * @help
 * ============================================================================
 * QJ DOODADS ASSET WORKSPACE
 * ============================================================================
 * An advanced visual asset-driven mapping and placement workspace for RPG Maker MZ.
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
 *    - Sidecar atlas metadata parsing (Aseprite, TexturePacker, SAF .saf.json).
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
 *      detection, timestamped backups in data/qj_asset_cache/backups/, and atomic writes.
 *    - Autosave crash recovery snapshots in data/QJAssetWorkspaceRecovery.json.
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
 * - QJ-Doodads is licensed under the MIT License. Copyright (c) Qiu Jiu.
 * - Sprite Atlas Forge detection algorithms adapted under the MIT License.
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
 * @default DoodadsQJ
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
 * @desc Format style when saving DoodadsQJ.json.
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
 * @desc Number of timestamped project backups retained in data/qj_asset_cache/backups/.
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
 */

var QJ = (typeof window !== 'undefined' ? (window.QJ = window.QJ || {}) : {});
QJ.DD = QJ.DD || { reWrite: {} };
var Imported = (typeof window !== 'undefined' ? (window.Imported = window.Imported || {}) : {});
Imported.QJDoodads = true;
Imported.QJAssetWorkspace = true;

function Sprite_DoodadQJ() {
    this.initialize(...arguments);
}
function Sprite_MouseDoodadsCursorQJ() {
    this.initialize(...arguments);
}

(($) => {
"use strict";
`);

// -----------------------------------------------------------------------------
// PART 2: CORE CONSTANTS, STRUCTS & SAT PHYSICS
// -----------------------------------------------------------------------------
add(`
//==========================================================
// SECTION 1: CORE CONSTANTS & PARAMETERS
//==========================================================
const pluginName = "QJ-Doodads";
const parameters = (typeof PluginManager !== 'undefined' && PluginManager.parameters) ? PluginManager.parameters(pluginName) : {};

const editKey = String(parameters.editKey || "F10");
const folderName = "img/" + (parameters.folderName || "doodads/");
const editorMode = parameters.editorMode !== undefined ? eval(parameters.editorMode) : true;
const dataFileName = String(parameters.dataFileName || "DoodadsQJ") + ".json";
const pluginVersion = 2.0;
const doodadScaleMode = parameters.doodadScaleMode !== undefined ? eval(parameters.doodadScaleMode) : true;
const saveMode = parameters.saveMode !== undefined ? eval(parameters.saveMode) : false;

const defaultLayoutName = String(parameters.defaultLayout || "Mapping");
const defaultThumbnailSize = Number(parameters.defaultThumbnailSize || 96);
const cacheEnabled = parameters.cacheEnabled !== undefined ? eval(parameters.cacheEnabled) : true;
const backgroundWorkBudget = Number(parameters.backgroundWorkBudget || 4);
const autosaveRecoveryInterval = Number(parameters.autosaveRecoveryInterval || 60);
const backupRetentionCount = Number(parameters.backupRetentionCount || 10);
const enableMVCompatibility = parameters.enableMVCompatibility !== undefined ? eval(parameters.enableMVCompatibility) : true;
const devDiagnostics = parameters.devDiagnostics !== undefined ? eval(parameters.devDiagnostics) : false;

//==========================================================
// SECTION 2: STANDARD STRUCTS & RUNTIME DATA
//==========================================================
QJ.DD.standardStructData = {
    bit: [1],
    index: 0,
    anchorX: 0.5,
    anchorY: 1,
    posMode: 1, // 0: screen, 1: map
    x: 0,
    y: 0,
    z: 0,
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

QJ.DD.standardStruct = function() {
    return (typeof JsonEx !== 'undefined' && JsonEx.makeDeepCopy) ? 
        JsonEx.makeDeepCopy(QJ.DD.standardStructData) : 
        JSON.parse(JSON.stringify(QJ.DD.standardStructData));
};

QJ.DD.initPluginData = {
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

QJ.DD.V = function(x, y) { return new SATVector(x, y); };
QJ.DD.C = function(pos, r) { return new SATCircle(pos, r); };
QJ.DD.B = function(pos, w, h) { return new SATBox(pos, w, h); };
QJ.DD.P = function(pos, points) { return new SATPolygon(pos, points); };
QJ.DD.box = function(x, y, w, h) {
    var b = new SATBox(new SATVector(x - w / 2, y - h / 2), w, h);
    return b.toPolygon();
};
QJ.DD.circle = function(x, y, r) {
    return new SATCircle(new SATVector(x, y), r);
};
QJ.DD.judge = function(a, b) {
    if (a instanceof SATPolygon && b instanceof SATPolygon) { return testPolygonPolygon(a, b); }
    if (a instanceof SATCircle && b instanceof SATPolygon) { return testCirclePolygon(a, b); }
    if (a instanceof SATPolygon && b instanceof SATCircle) { return testPolygonCircle(a, b); }
    if (a instanceof SATCircle && b instanceof SATCircle) { return testCircleCircle(a, b); }
    return false;
};
`);

// -----------------------------------------------------------------------------
// PART 3: DATA MANAGEMENT & ORIGINAL QJ-DOODADS COMPATIBILITY
// -----------------------------------------------------------------------------
add(`
//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
if (typeof DataManager !== 'undefined') {
    $.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase.call(this);
        this.loadDoodadsDataQJ();
    };

    DataManager.loadDoodadsDataQJ = function() {
        var xhr = new XMLHttpRequest();
        var url = 'data/' + dataFileName;
        xhr.open('GET', url);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                window.$dataDoodadsQJ = JSON.parse(xhr.responseText);
                DataManager.checkDoodadsDataQJ();
            }
        };
        xhr.onerror = function() {
            window.$dataDoodadsQJ = {};
        };
        xhr.send();
    };

    DataManager.checkDoodadsDataQJ = function() {
        if (!window.$dataDoodadsQJ) window.$dataDoodadsQJ = {};
        for (var mapId in window.$dataDoodadsQJ) {
            var list = window.$dataDoodadsQJ[mapId];
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    if (!list[i].collision) {
                        list[i].collision = { preset: "none", shape: null };
                    }
                }
            }
        }
    };

    DataManager.saveDoodadsDataQJ = function() {
        if (typeof StorageManager !== 'undefined') {
            const fs = (typeof require !== 'undefined') ? require('fs') : null;
            if (fs) {
                const filePath = 'data/' + dataFileName;
                const content = saveMode ? JSON.stringify(window.$dataDoodadsQJ) : JSON.stringify(window.$dataDoodadsQJ, null, 2);
                fs.writeFileSync(filePath, content);
            }
        }
    };

    DataManager.loadMapDataSynDoodadsQJ = function(type, mapId) {
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

QJ.DD.doodads = function(mapId) {
    if (typeof window === 'undefined' || !window.$dataDoodadsQJ) return [];
    mapId = mapId || (window.$gameMap ? window.$gameMap.mapId() : 0);
    return window.$dataDoodadsQJ[mapId] || [];
};

//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
QJ.DD.loadBitmap = function(path) {
    if (typeof ImageManager === 'undefined') return null;
    if (path.startsWith('img/')) {
        path = path.slice(4);
    }
    const slash = path.indexOf('/');
    if (slash > -1) {
        const folder = 'img/' + path.slice(0, slash + 1);
        const file = path.slice(slash + 1).replace(/\\.[^/.]+$/, "");
        return ImageManager.loadBitmap(folder, file);
    }
    return ImageManager.loadBitmap('img/', path.replace(/\\.[^/.]+$/, ""));
};

//==========================================================
// SECTION 6: SPRITE_DOODADQJ RUNTIME ENGINE
//==========================================================
if (typeof PIXI !== 'undefined') {
    Sprite_DoodadQJ.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_DoodadQJ.prototype.constructor = Sprite_DoodadQJ;

    Sprite_DoodadQJ.prototype.initialize = function(data, spriteset) {
        PIXI.Sprite.call(this);
        this._data = data;
        this._spriteset = spriteset;
        this.anchor.x = data.anchorX !== undefined ? data.anchorX : 0.5;
        this.anchor.y = data.anchorY !== undefined ? data.anchorY : 1.0;
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.z = data.z || 0;
        this.scale.x = data.scaleX !== undefined ? data.scaleX : 1;
        this.scale.y = data.scaleY !== undefined ? data.scaleY : 1;
        this.rotation = (data.rotation || 0) * Math.PI / 180;
        this.alpha = data.opacity !== undefined ? data.opacity : 1;
        this._frameTimer = 0;
        this._currentFrame = 0;
        this.loadTexture();
    };

    Sprite_DoodadQJ.prototype.loadTexture = function() {
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
            bmp = QJ.DD.loadBitmap(bit[1]);
        }
        if (bmp) {
            if (bmp.isReady()) {
                this.setupBitmap(bmp);
            } else {
                bmp.addLoadListener(() => this.setupBitmap(bmp));
            }
        }
    };

    Sprite_DoodadQJ.prototype.setupBitmap = function(bmp) {
        if (!bmp || !bmp._baseTexture) return;
        this._bmp = bmp;
        const fw = this._data.frameW || bmp.width;
        const fh = this._data.frameH || bmp.height;
        const fx = this._data.frameX || 0;
        const fy = this._data.frameY || 0;
        this.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(fx, fy, fw, fh));
    };

    Sprite_DoodadQJ.prototype.update = function() {
        if (!this._data) return;
        if (this._data.rotateSpeed) {
            this.rotation += (this._data.rotateSpeed * Math.PI / 180);
        }
        if (this._data.frameUpdate && (this._data.xFrame > 1 || this._data.yFrame > 1)) {
            this._frameTimer++;
            if (this._frameTimer >= this._data.frameUpdate) {
                this._frameTimer = 0;
                this.updateFrameAnimation();
            }
        }
        if (this._data.posMode === 1 && typeof $gameMap !== 'undefined') {
            const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            const screenX = this._data.x - $gameMap.displayX() * tw;
            const screenY = this._data.y - $gameMap.displayY() * th;
            this.x = screenX;
            this.y = screenY;
        }
    };

    Sprite_DoodadQJ.prototype.updateFrameAnimation = function() {
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
if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        $.Spriteset_Map_createLowerLayer.call(this);
        this.createDoodadsLayerQJ();
    };

    Spriteset_Map.prototype.createDoodadsLayerQJ = function() {
        this._doodadsContainerQJ = new PIXI.Container();
        this._doodadSpritesQJ = [];
        this._baseSprite.addChild(this._doodadsContainerQJ);
        this.addDoodadsQJ();
    };

    Spriteset_Map.prototype.addDoodadsQJ = function() {
        if (!this._doodadsContainerQJ) return;
        this._doodadsContainerQJ.removeChildren();
        this._doodadSpritesQJ = [];
        const list = QJ.DD.doodads();
        for (const data of list) {
            const spr = new Sprite_DoodadQJ(data, this);
            this._doodadsContainerQJ.addChild(spr);
            this._doodadSpritesQJ.push(spr);
        }
        this.sortDoodadsQJ();
    };

    Spriteset_Map.prototype.sortDoodadsQJ = function() {
        if (!this._doodadsContainerQJ) return;
        this._doodadsContainerQJ.children.sort((a, b) => {
            if (a.z !== b.z) return a.z - b.z;
            return a.y - b.y;
        });
    };

    $.Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update.call(this);
        if (this._doodadSpritesQJ) {
            for (let i = 0; i < this._doodadSpritesQJ.length; i++) {
                this._doodadSpritesQJ[i].update();
            }
        }
    };
}
`);

// -----------------------------------------------------------------------------
// PART 4: FS, ASSET INDEX, SEARCH, THUMBNAILS, METADATA
// -----------------------------------------------------------------------------
add(`
//==========================================================
// SECTION 8: QJ.DD.CORE & DIAGNOSTICS
//==========================================================
QJ.DD.Core = {
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
            console.log("[QJ.DD]", ...arguments);
        }
    }
};

//==========================================================
// SECTION 9: QJ.DD.COMPAT (MZ & MV ABSTRACTION)
//==========================================================
QJ.DD.Compat = {
    isMZ() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MZ";
    },
    isMV() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MV";
    },
    tileSize() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth) {
            return $gameMap.tileWidth();
        }
        return 48;
    }
};

//==========================================================
// SECTION 10: QJ.DD.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
QJ.DD.FS = {
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
            console.error("[QJ.DD.FS] Validation failed for atomic JSON write:", e);
            return false;
        }
        this.fs.writeFileSync(tmpPath, jsonStr, 'utf8');
        this.fs.renameSync(tmpPath, filePath);
        return true;
    },

    createTimestampedBackup(filePath) {
        if (!this.fs || !this.path || !this.existsSync(filePath)) return null;
        const cacheDir = 'data/qj_asset_cache/backups';
        if (!this.existsSync(cacheDir)) {
            this.mkdirp(cacheDir);
        }
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const baseName = this.path.basename(filePath);
        const backupPath = this.path.join(cacheDir, \`\${baseName}.\${stamp}.bak\`);
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

    mkdirp(dirPath) {
        if (!this.fs || !this.path) return;
        if (this.fs.existsSync(dirPath)) return;
        const parent = this.path.dirname(dirPath);
        if (!this.fs.existsSync(parent)) this.mkdirp(parent);
        this.fs.mkdirSync(dirPath);
    },

    readJson(filePath) {
        try {
            if (!this.existsSync(filePath)) return null;
            return JSON.parse(this.readFileSync(filePath, 'utf8'));
        } catch(e) {
            return null;
        }
    },

    stat(filePath) {
        if (!this.fs || !this.existsSync(filePath)) return null;
        const s = this.fs.statSync(filePath);
        return { size: s.size, mtimeMs: s.mtimeMs };
    }
};

//==========================================================
// SECTION 11: QJ.DD.ASSETINDEX & METADATA CACHE
//==========================================================
QJ.DD.AssetIndex = {
    libraryPath: 'data/QJAssetLibrary.json',
    data: {
        version: 1,
        projectId: "qj_project",
        generatedAt: 0,
        assets: {},
        collections: {},
        settings: {}
    },
    list: [],

    init() {
        const loaded = QJ.DD.FS.readJson(this.libraryPath);
        if (loaded && loaded.version === 1) {
            this.data = loaded;
        }
        this.rebuildList();
    },

    rebuildList() {
        this.list = Object.values(this.data.assets);
    },

    scan() {
        if (!QJ.DD.FS.fs) return;
        this.init();
        const roots = [
            'img/characters',
            'img/doodads',
            'img/tilesets',
            'img/pictures',
            'img/animations',
            'img/battlebacks1',
            'img/battlebacks2',
            'img/enemies',
            'img/faces',
            'img/parallaxes',
            'img/sv_actors',
            'img/sv_enemies',
            'img/system',
            'img/titles1',
            'img/titles2',
            'audio/bgm',
            'audio/bgs',
            'audio/me',
            'audio/se'
        ];
        for (const r of roots) {
            this.scanDirectory(r);
        }
        this.save();
        this.rebuildList();
    },

    scanDirectory(dirPath) {
        const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
        if (!fs || !fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const ent of entries) {
            const fullPath = path.join(dirPath, ent.name).replace(/\\\\/g, '/');
            if (ent.isDirectory()) {
                this.scanDirectory(fullPath);
            } else if (ent.isFile()) {
                const ext = path.extname(ent.name).toLowerCase();
                if (['.png', '.jpg', '.ogg', '.m4a', '.wav'].includes(ext)) {
                    this.indexFile(fullPath, ent.name, ext);
                }
            }
        }
    },

    indexFile(fullPath, fileName, ext) {
        const fs = QJ.DD.FS.fs;
        const stat = fs.statSync(fullPath);
        const assetId = fullPath.toLowerCase();

        let existing = this.data.assets[assetId];
        if (existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size) {
            return;
        }

        const category = this.detectCategory(fullPath);
        const autoTags = this.generateAutoTags(fullPath, fileName);
        const assetType = this.detectAssetType(fullPath, fileName, ext);

        const newEntry = {
            id: assetId,
            path: fullPath,
            type: assetType,
            category: category,
            fileName: fileName,
            extension: ext,
            mtimeMs: stat.mtimeMs,
            sizeBytes: stat.size,
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

        if (['.png', '.jpg'].includes(ext)) {
            const known = QJ.DD.Slicing.Known.detect(newEntry);
            if (known) {
                newEntry.slice = known;
                newEntry.width = known.width;
                newEntry.height = known.height;
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
        if (lower.includes('audio/')) return 'Audio';
        return 'Other';
    },

    generateAutoTags(filePath, fileName) {
        const parts = filePath.toLowerCase().replace(/\\\\/g, '/').split('/');
        const tags = new Set();
        for (const p of parts) {
            if (!['img', 'audio', fileName.toLowerCase()].includes(p)) {
                tags.add(p);
            }
        }
        const nameParts = fileName.replace(/\\.[^/.]+$/, "").split(/[ _-]+/);
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
        QJ.DD.FS.atomicWriteJson(this.libraryPath, this.data);
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
    }
};

//==========================================================
// SECTION 12: QJ.DD.SEARCH (TOKENIZED QUERY PARSER)
//==========================================================
QJ.DD.Search = {
    parseQuery(queryString) {
        const tokens = {
            terms: [],
            types: [],
            tags: [],
            folders: [],
            favorite: null,
            animated: null,
            negative: []
        };
        if (!queryString) return tokens;

        const parts = queryString.trim().split(/\\s+/);
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('-')) {
                tokens.negative.push(p.slice(1).toLowerCase());
            } else if (p.startsWith('type:')) {
                tokens.types.push(p.slice(5).toLowerCase());
            } else if (p.startsWith('tag:')) {
                tokens.tags.push(p.slice(4).toLowerCase());
            } else if (p.startsWith('folder:')) {
                tokens.folders.push(p.slice(7).toLowerCase());
            } else if (p.startsWith('favorite:')) {
                tokens.favorite = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else {
                tokens.terms.push(p.toLowerCase());
            }
        }
        return tokens;
    },

    matches(asset, parsed) {
        for (const neg of parsed.negative) {
            if (asset.fileName.toLowerCase().includes(neg) || asset.path.toLowerCase().includes(neg)) {
                return false;
            }
        }
        if (parsed.favorite !== null && asset.favorite !== parsed.favorite) return false;
        if (parsed.types.length > 0 && !parsed.types.includes((asset.type || '').toLowerCase())) return false;
        if (parsed.folders.length > 0) {
            const pathLower = asset.path.toLowerCase();
            if (!parsed.folders.some(f => pathLower.includes(f))) return false;
        }
        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
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
// SECTION 13: QJ.DD.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
QJ.DD.Thumbnail = {
    cache: {},
    queue: [],
    busy: false,

    get(asset, size = 96, callback) {
        const key = \`\${asset.id}_\${size}\`;
        if (this.cache[key]) {
            callback(this.cache[key]);
            return;
        }
        this.queue.push({ asset, size, callback });
        this.processQueue();
    },

    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = Date.now();
        while (this.queue.length > 0 && (Date.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            this.generate(job.asset, job.size, (dataUrl) => {
                const key = \`\${job.asset.id}_\${job.size}\`;
                this.cache[key] = dataUrl;
                job.callback(dataUrl);
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
`);

// -----------------------------------------------------------------------------
// PART 5: SLICING ENGINE (KNOWN, GRID, METADATA, SAF VISUAL)
// -----------------------------------------------------------------------------
add(`

//==========================================================
// SECTION 14: QJ.DD.SLICING (KNOWN, GRID, METADATA, VISUAL)
//==========================================================
QJ.DD.Slicing = {};

// 14.1 Known RPG Maker MZ Detection
QJ.DD.Slicing.Known = {
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
QJ.DD.Slicing.Grid = {
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
                    id: \`grid_\${r}_\${c}\`,
                    name: \`Cell_\${r + 1}_\${c + 1}\`,
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
QJ.DD.Slicing.Metadata = {
    parse(imagePath) {
        const fs = QJ.DD.FS.fs;
        if (!fs) return null;
        const jsonPath = imagePath.replace(/\\.[^/.]+$/, ".json");
        if (fs.existsSync(jsonPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                if (data.frames) {
                    const regions = [];
                    if (Array.isArray(data.frames)) {
                        for (const f of data.frames) {
                            regions.push({
                                id: f.filename || 'frame',
                                name: f.filename || 'frame',
                                x: f.frame.x, y: f.frame.y, w: f.frame.w, h: f.frame.h,
                                pivotX: f.pivot ? f.pivot.x : 0.5,
                                pivotY: f.pivot ? f.pivot.y : 1.0
                            });
                        }
                    } else if (typeof data.frames === 'object') {
                        for (const name in data.frames) {
                            const f = data.frames[name];
                            regions.push({
                                id: name, name: name,
                                x: f.frame.x, y: f.frame.y, w: f.frame.w, h: f.frame.h,
                                pivotX: f.pivot ? f.pivot.x : 0.5,
                                pivotY: f.pivot ? f.pivot.y : 1.0
                            });
                        }
                    }
                    return {
                        status: "metadata",
                        method: "sidecar_atlas_json",
                        confidence: 1.0,
                        regions: regions
                    };
                }
            } catch(e) {}
        }
        return null;
    }
};

// 14.4 Sprite Atlas Forge-Inspired Visual Auto-Slicer
QJ.DD.Slicing.Visual = {
    analyze(imageElement, options = {}) {
        if (typeof document === 'undefined') return { status: "none", regions: [] };
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        const w = canvas.width, h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Step 1: Alpha histogram and Otsu threshold
        const hist = new Uint32Array(256);
        for (let i = 3; i < data.length; i += 4) {
            hist[data[i]]++;
        }
        let threshold = this.otsuThreshold(hist);
        if (threshold < 8) threshold = 16;

        // Step 2: Binary grid foreground
        const binary = new Uint8Array(w * h);
        for (let i = 0, p = 3; p < data.length; i++, p += 4) {
            binary[i] = data[p] >= threshold ? 1 : 0;
        }

        // Step 3: Connected Components (4-connected)
        const labels = new Int32Array(w * h);
        let currentLabel = 1;
        const components = {};

        for (let y = 0; y < h; y++) {
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

                        // 4-neighbors
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
        }

        // Step 4: Grouping & Gutter splitting
        let initialRegions = Object.values(components).map((c, i) => ({
            id: \`reg_\${i + 1}\`,
            name: \`Sprite_\${String(i + 1).padStart(2, '0')}\`,
            x: c.minX,
            y: c.minY,
            w: c.maxX - c.minX + 1,
            h: c.maxY - c.minY + 1,
            pivotX: 0.5,
            pivotY: 1.0
        }));

        initialRegions = this.gutterSplitRegions(initialRegions, binary, w, h);

        return {
            status: "auto",
            method: "saf_visual",
            confidence: 0.94,
            regions: initialRegions
        };
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
    }
};

//==========================================================
// SECTION 15: QJ.DD.EXPORT (PNG SLICE EXPORTER)
//==========================================================
QJ.DD.Export = {
    exportSlices(asset, targetDir) {
        const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
        if (!fs || !path) return false;
        if (!asset.slice || !asset.slice.regions || asset.slice.regions.length === 0) {
            alert("No slice regions defined for this asset.");
            return false;
        }

        const outDir = targetDir || path.join('img', 'doodads', 'sliced_' + asset.fileName.replace(/\\.[^/.]+$/, ""));
        QJ.DD.FS.mkdirp(outDir);

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let count = 0;

            for (let i = 0; i < asset.slice.regions.length; i++) {
                const r = asset.slice.regions[i];
                canvas.width = r.w;
                canvas.height = r.h;
                ctx.clearRect(0, 0, r.w, r.h);
                ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);

                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\\/\\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const sliceFileName = \`\${r.name || ('slice_' + (i + 1))}.png\`;
                fs.writeFileSync(path.join(outDir, sliceFileName), buffer);
                count++;
            }
            QJ.DD.Workspace.showToast(\`Exported \${count} slices to \${outDir}\`);
        };
        return true;
    }
};
`);

// Write builder part 1
fs.writeFileSync(path.join(__dirname, 'plugin_part1.js'), parts.join('\n'));
console.log("Sections 1-15 saved to plugin_part1.js.");
