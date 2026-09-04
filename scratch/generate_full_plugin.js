// scratch/generate_full_plugin.js
// Enhanced builder containing the complete QJ Doodads Asset Workspace
const fs = require('fs');
const path = require('path');

const targetPlugin = path.join(__dirname, '..', 'QJ-Doodads.js');
console.log("Generating enhanced QJ-Doodads.js with deep interactive systems...");

// We read and compile the enhanced plugin code
const pluginCode = `//==========================================================
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
 * 2. Intelligent Slicing Engine:
 *    - Automatic detection of standard MZ sheets ($Single, 8-character, Faces, IconSet, SV).
 *    - Divisor-based grid candidate scoring.
 *    - Sidecar atlas metadata parsing (Aseprite, TexturePacker, SAF .saf.json).
 *    - Canvas visual auto-slicer with adaptive Otsu alpha thresholding, border flood,
 *      morphological cleanup, 4-connected components, and gutter splitting.
 *    - Interactive 1600% zoomable Slicer Modal with 8-handle drag, snapping, alignment,
 *      and authoritative non-destructive slice metadata persistence.
 *    - PNG slice exporter (individual PNGs, batch, animation strips).
 *
 * 3. Drag-and-Drop Placement & Stamping:
 *    - Drag any asset or slice directly onto the map with live ghost preview.
 *    - Free placement or grid snapping (48px or custom).
 *    - Stamping mode (click repeatedly to place props).
 *    - Eyedropper tool (Alt+Click placed object to select in drawer).
 *    - Scatter brush with density, scale jitter, and rotation jitter.
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
 *    - Visual collision rectangle editor in Inspector using relative coordinates.
 *
 * 6. Modern Operations & Safety:
 *    - 300-level command-based Undo / Redo (Ctrl+Z, Ctrl+Y).
 *    - Duplicate (Ctrl+D), Copy/Paste (Ctrl+C, Ctrl+V), Nudge (Arrows / Shift+Arrows).
 *    - Windows Explorer drag-and-drop file/folder import with conflict dialog.
 *    - Audio preview player and event command generator.
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
    this.a = null; this.b = null;
    this.overlapN = new SATVector(); this.overlapV = new SATVector();
    this.clear();
}
SATResponse.prototype.clear = function() {
    this.aInB = true; this.bInA = true; this.overlap = Number.MAX_VALUE;
    return this;
};

var T_VECTORS = []; for (var i = 0; i < 10; i++) T_VECTORS.push(new SATVector());
var T_ARRAYS = []; for (var i = 0; i < 5; i++) T_ARRAYS.push([]);
var T_RESPONSE = new SATResponse();
var TEST_POINT = new SATBox(new SATVector(), 0.000001, 0.000001).toPolygon();

function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, len = points.length;
    for (var i = 0; i < len; i++) {
        var dot = points[i].dot(normal);
        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }
    result[0] = min; result[1] = max;
}

function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = T_ARRAYS.pop(), rangeB = T_ARRAYS.pop();
    var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    rangeB[0] += projectedOffset; rangeB[1] += projectedOffset;
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
        T_VECTORS.push(offsetV); T_ARRAYS.push(rangeA); T_ARRAYS.push(rangeB);
        return true;
    }
    if (response) {
        var overlap = 0;
        if (rangeA[0] < rangeB[0]) {
            response.aInB = false;
            if (rangeA[1] < rangeB[1]) { overlap = rangeA[1] - rangeB[0]; response.bInA = false; }
            else { var option1 = rangeA[1] - rangeB[0], option2 = rangeB[1] - rangeA[0]; overlap = option1 < option2 ? option1 : -option2; }
        } else {
            response.bInA = false;
            if (rangeA[1] > rangeB[1]) { overlap = rangeA[0] - rangeB[1]; response.aInB = false; }
            else { var option1 = rangeA[1] - rangeB[0], option2 = rangeB[1] - rangeA[0]; overlap = option1 < option2 ? option1 : -option2; }
        }
        var absOverlap = Math.abs(overlap);
        if (absOverlap < response.overlap) {
            response.overlap = absOverlap;
            response.overlapN.copy(axis);
            if (overlap < 0) response.overlapN.reverse();
        }
    }
    T_VECTORS.push(offsetV); T_ARRAYS.push(rangeA); T_ARRAYS.push(rangeB);
    return false;
}

var LEFT_VORONOI_REGION = -1, MIDDLE_VORONOI_REGION = 0, RIGHT_VORONOI_REGION = 1;
function voronoiRegion(line, point) {
    var len2 = line.len2(), dp = point.dot(line);
    if (dp < 0) return LEFT_VORONOI_REGION;
    else if (dp > len2) return RIGHT_VORONOI_REGION;
    else return MIDDLE_VORONOI_REGION;
}

function SATtestPolygonCircle(polygon, circle, response) {
    var circlePos = T_VECTORS.pop().copy(circle.pos).add(circle.offset).sub(polygon.pos);
    var radius = circle.r, radius2 = radius * radius, points = polygon.calcPoints, len = points.length;
    var edge = T_VECTORS.pop(), point = T_VECTORS.pop();
    for (var i = 0; i < len; i++) {
        var next = i === len - 1 ? 0 : i + 1;
        var prev = i === 0 ? len - 1 : i - 1;
        var overlap = 0, overlapN = null;
        edge.copy(polygon.edges[i]);
        point.copy(circlePos).sub(points[i]);
        if (response && point.len2() > radius2) response.aInB = false;
        var region = voronoiRegion(edge, point);
        if (region === LEFT_VORONOI_REGION) {
            edge.copy(polygon.edges[prev]);
            var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
            region = voronoiRegion(edge, point2);
            if (region === RIGHT_VORONOI_REGION) {
                var dist = point.len();
                if (dist > radius) {
                    T_VECTORS.push(circlePos, edge, point, point2);
                    return false;
                } else if (response) {
                    response.bInA = false; overlapN = point.normalize(); overlap = radius - dist;
                }
            }
            T_VECTORS.push(point2);
        } else if (region === RIGHT_VORONOI_REGION) {
            edge.copy(polygon.edges[next]);
            point.copy(circlePos).sub(points[next]);
            region = voronoiRegion(edge, point);
            if (region === LEFT_VORONOI_REGION) {
                var dist = point.len();
                if (dist > radius) {
                    T_VECTORS.push(circlePos, edge, point);
                    return false;
                } else if (response) {
                    response.bInA = false; overlapN = point.normalize(); overlap = radius - dist;
                }
            }
        } else {
            var normal = edge.perp().normalize();
            var dist = point.dot(normal);
            var distAbs = Math.abs(dist);
            if (dist > 0 && distAbs > radius) {
                T_VECTORS.push(circlePos, normal, point);
                return false;
            } else if (response) {
                overlapN = normal; overlap = radius - dist;
                if (dist >= 0 || overlap < 2 * radius) response.bInA = false;
            }
        }
        if (overlapN && response && Math.abs(overlap) < Math.abs(response.overlap)) {
            response.overlap = overlap;
            response.overlapN.copy(overlapN);
        }
    }
    if (response) {
        response.a = polygon; response.b = circle;
        response.overlapV.copy(response.overlapN).scale(response.overlap);
    }
    T_VECTORS.push(circlePos, edge, point);
    return true;
}

function SATtestCirclePolygon(circle, polygon, response) {
    var result = SATtestPolygonCircle(polygon, circle, response);
    if (result && response) {
        var a = response.a, aInB = response.aInB;
        response.overlapN.reverse(); response.overlapV.reverse();
        response.a = response.b; response.b = a;
        response.aInB = response.bInA; response.bInA = aInB;
    }
    return result;
}

function SATtestPolygonPolygon(a, b, response) {
    var aPoints = a.calcPoints, aLen = aPoints.length;
    var bPoints = b.calcPoints, bLen = bPoints.length;
    for (var i = 0; i < aLen; i++) {
        if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, a.normals[i], response)) return false;
    }
    for (var i = 0; i < bLen; i++) {
        if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, b.normals[i], response)) return false;
    }
    if (response) {
        response.a = a; response.b = b;
        response.overlapV.copy(response.overlapN).scale(response.overlap);
    }
    return true;
}

QJ.DD.box = function(x, y, w, h) {
    let body = new SATPolygon(new SATVector(x, y), [
        new SATVector(-w/2, -h/2),
        new SATVector(+w/2, -h/2),
        new SATVector(+w/2, +h/2),
        new SATVector(-w/2, +h/2)
    ]);
    body.w = w; body.h = h;
    return body;
};
QJ.DD.mouseBox = new SATCircle(new SATVector(0, 0), 1);
QJ.DD.setData = function(x, y, w, h, ax, ay, sx, sy, rotate) {
    let body = QJ.DD.box(0, 0, w * sx, h * sy);
    body.pos.x = x; body.pos.y = y;
    body.setOffset(new SATVector(w * sx * (0.5 - ax), h * sy * (0.5 - ay)));
    body.setAngle(rotate);
    return body;
};
QJ.DD.sat = new SATResponse();
QJ.DD.judge = function(body, bodyX) {
    QJ.DD.sat.clear();
    if (bodyX) {
        return SATtestPolygonPolygon(bodyX, body, QJ.DD.sat);
    } else {
        return SATtestCirclePolygon(QJ.DD.mouseBox, body, QJ.DD.sat);
    }
};

//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
window.$dataDoodadsQJ = window.$dataDoodadsQJ || {};
if (typeof DataManager !== 'undefined' && DataManager._databaseFiles) {
    DataManager._databaseFiles.push({ name: '$dataDoodadsQJ', src: dataFileName });
}

if (typeof DataManager !== 'undefined') {
    $.DataManager_loadDataFile = DataManager.loadDataFile;
    DataManager.loadDataFile = function(name, src) {
        if (name === '$dataDoodadsQJ') {
            const xhr = new XMLHttpRequest();
            const url = "data/" + src;
            window[name] = {};
            xhr.open("GET", url);
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                if (xhr.status < 400) {
                    try {
                        window[name] = JSON.parse(xhr.responseText);
                    } catch(e) {
                        window[name] = { data: JsonEx.makeDeepCopy(QJ.DD.initPluginData) };
                    }
                    DataManager.onLoad(window[name]);
                    DataManager.checkDoodadsDataQJ();
                }
            };
            xhr.onerror = () => {
                DataManager.createNewDoodadsDataFileQJ();
            };
            xhr.send();
        } else {
            return $.DataManager_loadDataFile.call(this, name, src);
        }
    };

    DataManager.loadMapDataSynDoodadsQJ = function(type, name) {
        const xhr = new XMLHttpRequest();
        let url = type === 0 ? "data/Map%1.json".format(name.padZero(3)) : "data/" + name + ".json";
        xhr.open("GET", url, false);
        xhr.overrideMimeType("application/json");
        try {
            xhr.send();
            if (xhr.status < 400) return JSON.parse(xhr.responseText);
        } catch(e) {}
        return null;
    };

    DataManager.saveDoodadsDataQJ = function() {
        if (typeof require !== 'function') return;
        try {
            const fs = require('fs');
            const dataObj = window.$dataDoodadsQJ || { data: JsonEx.makeDeepCopy(QJ.DD.initPluginData) };
            const content = saveMode ? JSON.stringify(dataObj) : JSON.stringify(dataObj, null, 4);
            fs.writeFileSync('./data/' + dataFileName, content, 'utf8');
        } catch(e) {
            console.error("Failed to save DoodadsQJ.json:", e);
        }
    };

    DataManager.createNewDoodadsDataFileQJ = function() {
        if (!window.$dataDoodadsQJ || Object.keys(window.$dataDoodadsQJ).length === 0) {
            window.$dataDoodadsQJ = { data: JsonEx.makeDeepCopy(QJ.DD.initPluginData) };
        }
        DataManager.saveDoodadsDataQJ();
    };

    DataManager.checkDoodadsDataQJ = function() {
        if (typeof window.$dataDoodadsQJ.length === "number") { // VisuMZ array conversion
            let mapInfoData = DataManager.loadMapDataSynDoodadsQJ(1, "MapInfos");
            let tilesetsData = DataManager.loadMapDataSynDoodadsQJ(1, "Tilesets");
            let doodadsData = { data: JsonEx.makeDeepCopy(QJ.DD.initPluginData) };
            for (let i = 1, il = window.$dataDoodadsQJ.length; i < il; i++) {
                let detail = window.$dataDoodadsQJ[i];
                if (!detail || !mapInfoData || !mapInfoData[i]) continue;
                doodadsData[i] = [];
                let mapDoodadsData = doodadsData[i];
                let mapTilesetData = [];
                let mapData = DataManager.loadMapDataSynDoodadsQJ(0, i);
                if (tilesetsData && mapData && tilesetsData[mapData.tilesetId]) {
                    let tilesetsName = tilesetsData[mapData.tilesetId].tilesetNames;
                    for (let _i1 = tilesetsName.length - 1; _i1 >= tilesetsName.length - 4; _i1--) {
                        if (tilesetsName[_i1] && tilesetsName[_i1].length > 0) {
                            mapTilesetData.unshift(tilesetsName[_i1]);
                        }
                    }
                }
                for (let j of detail) {
                    let doodadData = {};
                    for (let k in QJ.DD.standardStructData) {
                        if (k === "bit") {
                            if (j.iconIndex > 0) {
                                doodadData.bit = [1];
                                doodadData.frameX = (j.iconIndex % 16) * 32;
                                doodadData.frameY = Math.floor(j.iconIndex / 16) * 32;
                                doodadData.frameW = 32; doodadData.frameH = 32;
                            } else if (j.folder.length === 0 && j.bitmap === "TileSet") {
                                doodadData.bit = [2, mapTilesetData[Math.floor(j.tileId / 256)]];
                                doodadData.frameX = (j.tileId % 256 % 16) * 48;
                                doodadData.frameY = Math.floor((j.tileId % 256) / 16) * 48;
                                doodadData.frameW = Math.min(16, j.tileCols) * 48;
                                doodadData.frameH = Math.min(16 - Math.floor((j.tileId % 256) / 16), j.tileRows) * 48;
                            } else {
                                doodadData.bit = [0, j.folder, j.bitmap];
                                doodadData.frameX = 0; doodadData.frameY = 0;
                                doodadData.frameW = 0; doodadData.frameH = 0;
                            }
                        } else if (k === "posMode") {
                            doodadData[k] = j.positionType === "map" ? 1 : 0;
                        } else if (k === "scaleX" || k === "scaleY") {
                            doodadData[k] = Math.floor(j[k] / 100);
                        } else if (k === "opacity") {
                            doodadData[k] = Math.floor(j[k] / 255);
                        } else if (j[k] === undefined || j[k] === null) {
                            doodadData[k] = QJ.DD.standardStructData[k];
                        } else {
                            doodadData[k] = j[k];
                        }
                    }
                    mapDoodadsData.push(doodadData);
                }
            }
            window.$dataDoodadsQJ = doodadsData;
            DataManager.saveDoodadsDataQJ();
        }
    };
}

//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
let preLoadData = {};
if (typeof ImageManager !== 'undefined') {
    ImageManager.loadDoodadsQJ = function(filename) {
        if (!filename) return null;
        if (filename[0] === 0) return preLoadData[filename[1] + filename[2]];
        else if (filename[0] === 1) return preLoadData["*1/IconSet/"];
        else if (filename[0] === 2) return preLoadData["*2/" + filename[1]];
        else if (filename[0] === 3) return preLoadData["*3/" + filename[1]];
        return null;
    };
}

if (typeof Scene_Boot !== 'undefined') {
    $.Scene_Boot_isReady = Scene_Boot.prototype.isReady;
    Scene_Boot.prototype.isReady = function() {
        if (!$.Scene_Boot_isReady.apply(this, arguments)) return false;
        if (!DataManager.DoodadsQJPreLoad) {
            preLoadData["*1/IconSet/"] = ImageManager.loadSystem("IconSet");
            for (let i in window.$dataDoodadsQJ) {
                let jData = window.$dataDoodadsQJ[i];
                if (Array.isArray(jData)) {
                    for (let j = 0; j < jData.length; j++) {
                        let detail = jData[j];
                        if (detail && detail.bit) {
                            if (detail.bit[0] === 0) {
                                preLoadData[detail.bit[1] + detail.bit[2]] = ImageManager.loadBitmap(folderName + detail.bit[1], detail.bit[2]);
                            } else if (detail.bit[0] === 2 && typeof detail.bit[1] === "string") {
                                preLoadData["*2/" + detail.bit[1]] = ImageManager.loadTileset(detail.bit[1]);
                            } else if (detail.bit[0] === 3 && typeof detail.bit[1] === "string") {
                                preLoadData["*3/" + detail.bit[1]] = ImageManager.loadBitmap("", detail.bit[1]);
                            }
                        }
                    }
                }
            }
            DataManager.DoodadsQJPreLoad = true;
        }
        for (let i in preLoadData) {
            if (!preLoadData[i]) return false;
            if (!preLoadData[i].width) return false;
            if (!preLoadData[i].hasPreLoadedQJ) {
                preLoadData[i] = QJ.DD.addTexture(preLoadData[i]);
            }
        }
        return true;
    };
}

QJ.DD.addTexture = function(bitmap) {
    if (!bitmap) return null;
    let lsCanvas = document.createElement('canvas');
    let lscontext = lsCanvas.getContext('2d');
    let w = bitmap.width || 32, h = bitmap.height || 32;
    lsCanvas.width = w; lsCanvas.height = h;
    let lsBaseTexture = new PIXI.BaseTexture(lsCanvas);
    lsBaseTexture.scaleMode = doodadScaleMode ? PIXI.SCALE_MODES.LINEAR : PIXI.SCALE_MODES.NEAREST;
    lsBaseTexture.width = w; lsBaseTexture.height = h;
    lscontext.globalCompositeOperation = 'source-over';
    lscontext.drawImage(bitmap._canvas ? bitmap._canvas : bitmap._image, 0, 0, w, h, 0, 0, w, h);
    lsBaseTexture.update();
    lsBaseTexture.hasPreLoadedQJ = true;
    return lsBaseTexture;
};

QJ.DD.doodads = function() {
    if (!window.$gameMap || !window.$dataDoodadsQJ) return [];
    return window.$dataDoodadsQJ[$gameMap.mapId()] || [];
};

//==========================================================
// SECTION 6: SPRITE_DOODADQJ RUNTIME ENGINE
//==========================================================
if (typeof PIXI !== 'undefined' && PIXI.Sprite) {
    Sprite_DoodadQJ.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_DoodadQJ.prototype.constructor = Sprite_DoodadQJ;

    Sprite_DoodadQJ.prototype.initialize = function(data, spriteset) {
        PIXI.Sprite.call(this);
        this._spriteset = spriteset;
        this.data = data;
        this.animCount = 0;
        this.frameXIndex = 0;
        this.frameYIndex = 0;
        this.dead = false;
        this.bodyQJ = null;
        this.setBase();
    };

    Sprite_DoodadQJ.prototype.setDead = function() {
        this.dead = true;
        this.visible = false;
        this.bodyQJ = null;
    };

    Sprite_DoodadQJ.prototype.setBase = function() {
        if (!this.data) return;
        let textureSource = ImageManager.loadDoodadsQJ(this.data.bit);
        if (!textureSource) return;
        
        let frameW = this.data.frameW > 0 ? this.data.frameW : textureSource.width;
        let frameH = this.data.frameH > 0 ? this.data.frameH : textureSource.height;
        let frameX = this.data.frameX || 0;
        let frameY = this.data.frameY || 0;
        
        this.texture = new PIXI.Texture(textureSource, new PIXI.Rectangle(frameX, frameY, frameW, frameH));
        this.anchor.x = this.data.anchorX !== undefined ? this.data.anchorX : 0.5;
        this.anchor.y = this.data.anchorY !== undefined ? this.data.anchorY : 1.0;
        this.scale.x = this.data.scaleX !== undefined ? this.data.scaleX : 1.0;
        this.scale.y = this.data.scaleY !== undefined ? this.data.scaleY : 1.0;
        this.rotation = (this.data.rotation || 0) * Math.PI / 180;
        this.blendMode = this.data.blend || 0;
        this.opacity = this.data.opacity !== undefined ? this.data.opacity : 1.0;
        this.alpha = this.opacity;
        this.z = this.data.z || 0;
        
        this.updateBody();
    };

    Sprite_DoodadQJ.prototype.updateBody = function() {
        if (!this.data || this.dead) return;
        let w = (this.data.frameW || (this.texture ? this.texture.width : 48));
        let h = (this.data.frameH || (this.texture ? this.texture.height : 48));
        let ax = this.data.anchorX !== undefined ? this.data.anchorX : 0.5;
        let ay = this.data.anchorY !== undefined ? this.data.anchorY : 1.0;
        let sx = this.data.scaleX !== undefined ? this.data.scaleX : 1.0;
        let sy = this.data.scaleY !== undefined ? this.data.scaleY : 1.0;
        let rot = (this.data.rotation || 0) * Math.PI / 180;
        
        let screenX = this.data.posMode === 1 && window.$gameMap ? this.data.x - $gameMap.displayX() * 48 : this.data.x;
        let screenY = this.data.posMode === 1 && window.$gameMap ? this.data.y - $gameMap.displayY() * 48 : this.data.y;
        
        this.x = screenX;
        this.y = screenY;
        
        this.bodyQJ = QJ.DD.setData(screenX, screenY, w, h, ax, ay, sx, sy, rot);
    };

    Sprite_DoodadQJ.prototype.update = function() {
        if (this.dead) return;
        if (this.data.rotateSpeed) {
            this.data.rotation = (this.data.rotation + this.data.rotateSpeed) % 360;
            this.rotation = this.data.rotation * Math.PI / 180;
        }
        if (this.data.frameUpdate > 0 && (this.data.xFrame > 1 || this.data.yFrame > 1)) {
            this.animCount++;
            if (this.animCount >= this.data.frameUpdate) {
                this.animCount = 0;
                this.frameXIndex = (this.frameXIndex + 1) % (this.data.xFrame || 1);
                if (this.frameXIndex === 0 && this.data.yFrame > 1) {
                    this.frameYIndex = (this.frameYIndex + 1) % this.data.yFrame;
                }
                let textureSource = ImageManager.loadDoodadsQJ(this.data.bit);
                if (textureSource) {
                    let fx = (this.data.frameX || 0) + this.frameXIndex * this.data.frameW;
                    let fy = (this.data.frameY || 0) + this.frameYIndex * this.data.frameH;
                    this.texture.frame = new PIXI.Rectangle(fx, fy, this.data.frameW, this.data.frameH);
                    this.texture.updateUvs();
                }
            }
        }
        
        if (this.data.posMode === 1 && window.$gameMap) {
            this.x = this.data.x - $gameMap.displayX() * 48;
            this.y = this.data.y - $gameMap.displayY() * 48;
        }
    };
}

//==========================================================
// SECTION 7: SPRITESET_MAP DOODAD LAYER HOOKS
//==========================================================
if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        $.Spriteset_Map_createLowerLayer.call(this);
        this.createDoodadsQJ();
    };

    Spriteset_Map.prototype.createDoodadsQJ = function() {
        this._doodadsQJ = [];
        this.addDoodadsQJ();
    };

    Spriteset_Map.prototype.removeDoodadsQJ = function() {
        if (!this._doodadsQJ) return;
        for (let i = 0; i < this._doodadsQJ.length; i++) {
            this._doodadsQJ[i].setDead();
            if (this._tilemap) this._tilemap.removeChild(this._doodadsQJ[i]);
        }
        this._doodadsQJ = [];
    };

    Spriteset_Map.prototype.addDoodadsQJ = function() {
        this.removeDoodadsQJ();
        let currentMapDoodads = QJ.DD.doodads();
        for (let i = 0; i < currentMapDoodads.length; i++) {
            let doodadData = currentMapDoodads[i];
            let sprite = new Sprite_DoodadQJ(doodadData, this);
            this._doodadsQJ.push(sprite);
            if (this._tilemap) this._tilemap.addChild(sprite);
        }
    };

    $.Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update.call(this);
        this.updateDoodadsQJ();
    };

    Spriteset_Map.prototype.updateDoodadsQJ = function() {
        if (!this._doodadsQJ) return;
        for (let i = 0; i < this._doodadsQJ.length; i++) {
            this._doodadsQJ[i].update();
        }
    };

    Spriteset_Map.prototype.updateAllDoodadsBodyQJ = function() {
        if (!this._doodadsQJ) return;
        for (let i = 0; i < this._doodadsQJ.length; i++) {
            this._doodadsQJ[i].updateBody();
        }
    };
}

if (typeof Game_Map !== 'undefined') {
    Game_Map.prototype.centerScreenQJ = function(type) {
        if (window.$gamePlayer) {
            $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
        }
    };
}

// Mouse cursor ghost sprite
if (typeof Sprite_DoodadQJ !== 'undefined') {
    Sprite_MouseDoodadsCursorQJ.prototype = Object.create(Sprite_DoodadQJ.prototype);
    Sprite_MouseDoodadsCursorQJ.prototype.constructor = Sprite_MouseDoodadsCursorQJ;
    Sprite_MouseDoodadsCursorQJ.prototype.initialize = function(data) {
        PIXI.Sprite.call(this);
    };
    Sprite_MouseDoodadsCursorQJ.prototype.setBase = function(data) {
        if (data) this.data = data;
        if (!this.data) return;
        let textureSource = ImageManager.loadDoodadsQJ(this.data.bit);
        if (textureSource) {
            this.texture = new PIXI.Texture(textureSource);
            Sprite_DoodadQJ.prototype.setBase.call(this);
        }
    };
    Sprite_MouseDoodadsCursorQJ.prototype.update = function() {
        if (!this.visible) return;
        let mx = TouchInput._mousePos ? TouchInput._mousePos.x : TouchInput.x;
        let my = TouchInput._mousePos ? TouchInput._mousePos.y : TouchInput.y;
        this.x = mx;
        this.y = my;
    };
    Sprite_MouseDoodadsCursorQJ.prototype.updateBody = function() {};
}

// UltraMode7 Compatibility Hook
if (Imported.UltraMode7) {
    const _Sprite_DoodadQJ_update = Sprite_DoodadQJ.prototype.update;
    Sprite_DoodadQJ.prototype.update = function() {
        _Sprite_DoodadQJ_update.call(this);
        if (this.data && this.data.posMode === 1 && UltraMode7.isActive()) {
            UltraMode7.updateAnimation(this);
        }
    };
}

//==========================================================
// SECTION 8: QJ.DD.CORE & DIAGNOSTICS
//==========================================================
QJ.DD.Core = {
    version: pluginVersion,
    active: false,
    listeners: {},

    on(event, callback) {
        this.listeners[event] = this.listeners[event] || [];
        this.listeners[event].push(callback);
    },

    emit(event, ...args) {
        if (this.listeners[event]) {
            for (let cb of this.listeners[event]) {
                try { cb(...args); } catch(e) { console.error("Error in event listener:", event, e); }
            }
        }
    },

    log(...args) {
        if (devDiagnostics) console.log("[QJ.DD]", ...args);
    },
    warn(...args) {
        console.warn("[QJ.DD]", ...args);
    },
    error(...args) {
        console.error("[QJ.DD]", ...args);
    }
};

//==========================================================
// SECTION 9: QJ.DD.COMPAT (MZ & MV ABSTRACTION)
//==========================================================
QJ.DD.Compat = {
    isMZ: (typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MZ") || Boolean(window.MZ),
    isMV: typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MV",
    isNwjs: typeof Utils !== 'undefined' ? Utils.isNwjs() : (typeof require === 'function'),
    isTest: typeof Utils !== 'undefined' ? Utils.isOptionValid("test") : false,

    createRectangle(x, y, w, h) {
        if (typeof Rectangle === 'function') return new Rectangle(x, y, w, h);
        return { x, y, width: w, height: h };
    },

    getMousePos() {
        if (typeof TouchInput !== 'undefined') {
            if (TouchInput._mousePos) return { x: TouchInput._mousePos.x, y: TouchInput._mousePos.y };
            return { x: TouchInput.x || 0, y: TouchInput.y || 0 };
        }
        return { x: 0, y: 0 };
    }
};

//==========================================================
// SECTION 10: QJ.DD.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
QJ.DD.FS = {
    get fs() {
        return typeof require === 'function' ? require('fs') : null;
    },
    get path() {
        return typeof require === 'function' ? require('path') : null;
    },

    exists(filePath) {
        if (!this.fs) return false;
        try { return this.fs.existsSync(filePath); } catch(e) { return false; }
    },

    stat(filePath) {
        if (!this.fs) return null;
        try {
            const s = this.fs.statSync(filePath);
            return { mtimeMs: s.mtimeMs, size: s.size };
        } catch(e) { return null; }
    },

    mkdir(dirPath) {
        if (!this.fs) return;
        try {
            if (!this.fs.existsSync(dirPath)) this.fs.mkdirSync(dirPath, { recursive: true });
        } catch(e) { QJ.DD.Core.error("Failed to mkdir:", dirPath, e); }
    },

    readJson(filePath, fallback = null) {
        if (!this.fs) return fallback;
        try {
            if (!this.fs.existsSync(filePath)) return fallback;
            const content = this.fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch(e) {
            QJ.DD.Core.warn("Error reading JSON file:", filePath, e);
            return fallback;
        }
    },

    atomicWriteJson(filePath, data) {
        if (!this.fs) return false;
        try {
            const dir = this.path.dirname(filePath);
            this.mkdir(dir);
            const jsonStr = JSON.stringify(data, null, saveMode ? 0 : 2);
            JSON.parse(jsonStr); // Validation check before writing!
            const tmpPath = filePath + ".tmp";
            this.fs.writeFileSync(tmpPath, jsonStr, 'utf8');
            this.fs.renameSync(tmpPath, filePath);
            return true;
        } catch(e) {
            QJ.DD.Core.error("Atomic write failed for:", filePath, e);
            return false;
        }
    },

    createTimestampedBackup(filePath) {
        if (!this.fs || !this.exists(filePath)) return null;
        try {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const ts = \`\${now.getFullYear()}-\${pad(now.getMonth()+1)}-\${pad(now.getDate())}_\${pad(now.getHours())}\${pad(now.getMinutes())}\${pad(now.getSeconds())}\`;
            const backupDir = this.path.join('data', 'qj_asset_cache', 'backups', ts);
            this.mkdir(backupDir);
            const fileName = this.path.basename(filePath);
            const backupPath = this.path.join(backupDir, fileName);
            this.fs.copyFileSync(filePath, backupPath);
            this.cleanOldBackups();
            return backupPath;
        } catch(e) {
            QJ.DD.Core.warn("Backup creation failed for:", filePath, e);
            return null;
        }
    },

    cleanOldBackups() {
        if (!this.fs) return;
        try {
            const backupsBase = this.path.join('data', 'qj_asset_cache', 'backups');
            if (!this.fs.existsSync(backupsBase)) return;
            const entries = this.fs.readdirSync(backupsBase).map(name => {
                const full = this.path.join(backupsBase, name);
                return { name, path: full, stat: this.fs.statSync(full) };
            }).filter(e => e.stat.isDirectory());
            entries.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
            if (entries.length > backupRetentionCount) {
                for (let i = backupRetentionCount; i < entries.length; i++) {
                    this.fs.rmSync(entries[i].path, { recursive: true, force: true });
                }
            }
        } catch(e) {}
    },

    scanDirectoryRecursive(baseDir, allowedExts = ['.png', '.jpg', '.jpeg', '.ogg', '.m4a', '.wav', '.json']) {
        if (!this.fs) return [];
        const results = [];
        const walk = (current) => {
            if (!this.fs.existsSync(current)) return;
            const list = this.fs.readdirSync(current);
            for (const item of list) {
                const full = this.path.join(current, item).replace(/\\\\/g, '/');
                try {
                    const st = this.fs.statSync(full);
                    if (st.isDirectory()) {
                        walk(full);
                    } else if (st.isFile()) {
                        const ext = this.path.extname(item).toLowerCase();
                        if (allowedExts.includes(ext)) {
                            results.push({
                                path: full,
                                fileName: item,
                                extension: ext,
                                sizeBytes: st.size,
                                mtimeMs: st.mtimeMs
                            });
                        }
                    }
                } catch(e) {}
            }
        };
        walk(baseDir);
        return results;
    }
};

//==========================================================
// SECTION 11: QJ.DD.ASSETINDEX & METADATA CACHE
//==========================================================
QJ.DD.AssetIndex = {
    libraryPath: "data/QJAssetLibrary.json",
    data: {
        version: 1,
        projectId: "qj-asset-workspace",
        generatedAt: 0,
        assets: {},
        collections: {},
        settings: {},
        indexState: {}
    },
    list: [],
    initialized: false,

    init() {
        if (this.initialized) return;
        const loaded = QJ.DD.FS.readJson(this.libraryPath);
        if (loaded && loaded.assets) {
            this.data = loaded;
        }
        this.rebuildList();
        this.initialized = true;
    },

    save() {
        this.data.generatedAt = Date.now();
        QJ.DD.FS.atomicWriteJson(this.libraryPath, this.data);
    },

    rebuildList() {
        this.list = Object.values(this.data.assets);
    },

    scan() {
        this.init();
        if (!QJ.DD.FS.fs) return;
        
        const roots = [
            "img/animations", "img/battlebacks1", "img/battlebacks2",
            "img/characters", "img/enemies", "img/faces", "img/parallaxes",
            "img/pictures", "img/sv_actors", "img/sv_enemies", "img/system",
            "img/tilesets", "img/titles1", "img/titles2", "img/doodads",
            "audio/bgm", "audio/bgs", "audio/me", "audio/se"
        ];

        let addedCount = 0;
        let updatedCount = 0;

        for (const root of roots) {
            const files = QJ.DD.FS.scanDirectoryRecursive(root);
            for (const file of files) {
                const assetId = this.generateAssetId(file.path);
                const existing = this.data.assets[assetId];
                if (!existing || existing.mtimeMs !== file.mtimeMs || existing.sizeBytes !== file.sizeBytes) {
                    const category = this.categorizePath(file.path);
                    const autoTags = this.generateAutoTags(file.path, file.fileName);
                    const assetType = this.detectAssetType(file.path, file.fileName, file.extension);

                    const entry = {
                        id: assetId,
                        path: file.path,
                        type: assetType,
                        category: category,
                        fileName: file.fileName,
                        extension: file.extension,
                        mtimeMs: file.mtimeMs,
                        sizeBytes: file.sizeBytes,
                        width: 0,
                        height: 0,
                        tags: existing ? existing.tags || [] : [],
                        autoTags: autoTags,
                        favorite: existing ? Boolean(existing.favorite) : false,
                        collections: existing ? existing.collections || [] : [],
                        slice: existing ? existing.slice : { status: "none", method: "auto", confidence: 1.0, regions: [] },
                        animationGroups: existing ? existing.animationGroups || [] : [],
                        placement: existing ? existing.placement : { defaultMode: "doodad", defaultAnchorX: 0.5, defaultAnchorY: 1.0, defaultScaleX: 1.0, defaultScaleY: 1.0, defaultZ: 0 },
                        collision: existing ? existing.collision : { preset: "none", shape: null },
                        usage: existing ? existing.usage : { lastUsedAt: 0, useCount: 0 },
                        notes: existing ? existing.notes || "" : ""
                    };

                    this.data.assets[assetId] = entry;
                    if (existing) updatedCount++; else addedCount++;
                }
            }
        }

        this.rebuildList();
        this.save();
        QJ.DD.Core.log(\`Asset Scan Complete: \${addedCount} added, \${updatedCount} updated, \${this.list.length} total.\`);
    },

    generateAssetId(filePath) {
        return filePath.toLowerCase().replace(/[^a-z0-9]/g, '_');
    },

    categorizePath(p) {
        const lower = p.toLowerCase();
        if (lower.includes('img/characters')) return 'Characters';
        if (lower.includes('img/tilesets')) return 'Tilesets';
        if (lower.includes('img/pictures')) return 'Pictures';
        if (lower.includes('img/doodads')) return 'Doodads';
        if (lower.includes('img/faces')) return 'Faces';
        if (lower.includes('img/enemies') || lower.includes('img/sv_enemies')) return 'Enemies';
        if (lower.includes('img/sv_actors')) return 'SV Actors';
        if (lower.includes('img/animations')) return 'Animations';
        if (lower.includes('audio/bgm')) return 'BGM';
        if (lower.includes('audio/bgs')) return 'BGS';
        if (lower.includes('audio/me')) return 'ME';
        if (lower.includes('audio/se')) return 'SE';
        return 'Other';
    },

    detectAssetType(p, name, ext) {
        if (['.ogg', '.m4a', '.wav'].includes(ext)) return 'audio';
        const lower = p.toLowerCase();
        if (lower.includes('characters')) {
            return name.startsWith('$') ? 'single_character' : 'character_sheet';
        }
        if (lower.includes('faces')) return 'face_sheet';
        if (lower.includes('tilesets')) return 'tileset';
        if (lower.includes('iconset')) return 'iconset';
        if (lower.includes('sv_actors')) return 'sv_actor';
        return 'doodad';
    },

    generateAutoTags(p, name) {
        const clean = p.replace(/\\\\/g, '/');
        const parts = clean.split('/').concat(name.split('.')[0].split(/[_\\-\\s]+/));
        const tags = new Set();
        for (let part of parts) {
            part = part.trim().toLowerCase();
            if (part && !['img', 'audio', 'png', 'ogg', 'm4a'].includes(part)) {
                tags.add(part);
            }
        }
        return Array.from(tags);
    },

    toggleFavorite(assetId) {
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.favorite = !asset.favorite;
            this.save();
            return asset.favorite;
        }
        return false;
    },

    recordUsage(assetId) {
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.usage = asset.usage || { useCount: 0, lastUsedAt: 0 };
            asset.usage.useCount++;
            asset.usage.lastUsedAt = Date.now();
            this.save();
        }
    }
};

//==========================================================
// SECTION 12: QJ.DD.SEARCH (TOKENIZED QUERY PARSER)
//==========================================================
QJ.DD.Search = {
    parse(query) {
        const tokens = {
            terms: [],
            negativeTerms: [],
            filters: {}
        };
        if (!query || typeof query !== 'string') return tokens;
        const parts = query.trim().split(/\\s+/);
        for (const part of parts) {
            if (!part) continue;
            if (part.startsWith('-')) {
                tokens.negativeTerms.push(part.slice(1).toLowerCase());
            } else if (part.includes(':')) {
                const [key, ...valParts] = part.split(':');
                tokens.filters[key.toLowerCase()] = valParts.join(':').toLowerCase();
            } else {
                tokens.terms.push(part.toLowerCase());
            }
        }
        return tokens;
    },

    match(asset, tokens) {
        const fullText = (asset.fileName + " " + (asset.tags || []).join(" ") + " " + (asset.autoTags || []).join(" ") + " " + (asset.category || "")).toLowerCase();
        const words = fullText.split(/[\\s_\\-\\.\\/\\\\]+/);

        for (const neg of tokens.negativeTerms) {
            if (words.includes(neg)) return false;
        }

        if (tokens.filters.type && asset.type.toLowerCase() !== tokens.filters.type && asset.category.toLowerCase() !== tokens.filters.type) {
            return false;
        }
        if (tokens.filters.favorite && String(Boolean(asset.favorite)) !== tokens.filters.favorite) {
            return false;
        }
        if (tokens.filters.folder && !asset.path.toLowerCase().includes(tokens.filters.folder)) {
            return false;
        }
        if (tokens.filters.animated && String(Boolean(asset.animationGroups && asset.animationGroups.length > 0)) !== tokens.filters.animated) {
            return false;
        }
        if (tokens.filters.tag) {
            const req = tokens.filters.tag;
            const combinedTags = (asset.tags || []).concat(asset.autoTags || []).map(t => t.toLowerCase());
            if (!combinedTags.includes(req)) return false;
        }

        for (const term of tokens.terms) {
            if (!fullText.includes(term)) {
                let tIdx = 0;
                for (let i = 0; i < fullText.length && tIdx < term.length; i++) {
                    if (fullText[i] === term[tIdx]) tIdx++;
                }
                if (tIdx < term.length) return false;
            }
        }
        return true;
    },

    filter(assets, query) {
        if (!query || query.trim() === '') return assets;
        const tokens = this.parse(query);
        return assets.filter(a => this.match(a, tokens));
    }
};

//==========================================================
// SECTION 13: QJ.DD.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
QJ.DD.Thumbnail = {
    cache: {},
    queue: [],
    busy: false,

    get(asset, size = defaultThumbnailSize, callback) {
        const key = asset.id + "_" + size;
        if (this.cache[key]) {
            if (callback) callback(this.cache[key]);
            return this.cache[key];
        }
        this.enqueue(asset, size, callback);
        return null;
    },

    enqueue(asset, size, callback) {
        this.queue.push({ asset, size, callback });
        this.processQueue();
    },

    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = performance.now();
        while (this.queue.length > 0 && (performance.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            const key = job.asset.id + "_" + job.size;
            if (this.cache[key]) {
                if (job.callback) job.callback(this.cache[key]);
                continue;
            }

            const img = new Image();
            img.src = job.asset.path;
            img.onload = () => {
                job.asset.width = img.naturalWidth;
                job.asset.height = img.naturalHeight;
                const canvas = document.createElement('canvas');
                canvas.width = job.size; canvas.height = job.size;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;

                const scale = Math.min(job.size / img.naturalWidth, job.size / img.naturalHeight);
                const dw = img.naturalWidth * scale;
                const dh = img.naturalHeight * scale;
                const dx = (job.size - dw) / 2;
                const dy = (job.size - dh) / 2;
                ctx.drawImage(img, dx, dy, dw, dh);

                const dataUrl = canvas.toDataURL();
                this.cache[key] = dataUrl;
                if (job.callback) job.callback(dataUrl);
            };
            img.onerror = () => {
                this.cache[key] = "";
            };
        }

        this.busy = false;
        if (this.queue.length > 0) {
            requestAnimationFrame(() => this.processQueue());
        }
    }
};

//==========================================================
// SECTION 14: QJ.DD.SLICING (KNOWN, GRID, METADATA, VISUAL)
//==========================================================
QJ.DD.Slicing = {
    Known: {
        detect(asset) {
            const name = asset.fileName;
            const w = asset.width, h = asset.height;
            if (!w || !h) return null;

            if (name.startsWith('$') && asset.type === 'single_character') {
                const cw = w / 3, ch = h / 4;
                return {
                    method: "mz_single_character",
                    confidence: 1.0,
                    regions: [{
                        id: asset.id + "_char0",
                        name: name.replace('$', ''),
                        x: 0, y: 0, w: w, h: h,
                        cellW: cw, cellH: ch,
                        characterName: name, characterIndex: 0
                    }]
                };
            }

            if (asset.type === 'character_sheet') {
                const charW = w / 4, charH = h / 2;
                const cellW = charW / 3, cellH = charH / 4;
                const regions = [];
                for (let idx = 0; idx < 8; idx++) {
                    const cx = (idx % 4) * charW;
                    const cy = Math.floor(idx / 4) * charH;
                    regions.push({
                        id: asset.id + "_char" + idx,
                        name: name.split('.')[0] + " #" + (idx + 1),
                        x: cx, y: cy, w: charW, h: charH,
                        cellW: cellW, cellH: cellH,
                        characterName: name, characterIndex: idx
                    });
                }
                return {
                    method: "mz_standard_8character",
                    confidence: 1.0,
                    regions: regions
                };
            }

            if (asset.type === 'face_sheet') {
                const fw = w / 4, fh = h / 2;
                const regions = [];
                for (let idx = 0; idx < 8; idx++) {
                    regions.push({
                        id: asset.id + "_face" + idx,
                        name: name.split('.')[0] + " Face #" + (idx + 1),
                        x: (idx % 4) * fw, y: Math.floor(idx / 4) * fh,
                        w: fw, h: fh, faceIndex: idx
                    });
                }
                return {
                    method: "mz_faceset",
                    confidence: 1.0,
                    regions: regions
                };
            }

            if (name.toLowerCase() === 'iconset.png') {
                const cell = 32;
                const cols = 16;
                const rows = Math.floor(h / cell);
                const regions = [];
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const idx = r * cols + c;
                        regions.push({
                            id: "icon_" + idx,
                            name: "Icon #" + idx,
                            x: c * cell, y: r * cell, w: cell, h: cell,
                            iconIndex: idx
                        });
                    }
                }
                return {
                    method: "mz_iconset",
                    confidence: 1.0,
                    regions: regions
                };
            }

            return null;
        }
    },

    Grid: {
        scoreCandidates(width, height) {
            const candidates = [];
            const sizes = [16, 24, 32, 48, 64, 96, 128];
            for (const cw of sizes) {
                if (width % cw === 0) {
                    for (const ch of sizes) {
                        if (height % ch === 0) {
                            const cols = width / cw, rows = height / ch;
                            let score = 50;
                            if (cols === 3 && rows === 4) score = 95;
                            else if (cols === 12 && rows === 8) score = 98;
                            else if (cols === 4 && rows === 2) score = 90;
                            else if (cols === 9 && rows === 6) score = 92;
                            else if (cols === 16) score = 85;
                            candidates.push({ cols, rows, cellW: cw, cellH: ch, score });
                        }
                    }
                }
            }
            candidates.sort((a, b) => b.score - a.score);
            return candidates;
        }
    },

    Metadata: {
        findSidecar(assetPath) {
            if (!QJ.DD.FS.fs) return null;
            const ext = QJ.DD.FS.path.extname(assetPath);
            const jsonPath = assetPath.slice(0, -ext.length) + '.json';
            return QJ.DD.FS.readJson(jsonPath, null);
        },

        parse(sidecarJson) {
            if (!sidecarJson || !sidecarJson.frames) return null;
            const regions = [];
            const frames = sidecarJson.frames;
            
            if (Array.isArray(frames)) {
                for (let i = 0; i < frames.length; i++) {
                    const f = frames[i];
                    regions.push({
                        id: "frame_" + i,
                        name: f.filename || ("Frame_" + i),
                        x: f.frame.x, y: f.frame.y, w: f.frame.w, h: f.frame.h,
                        pivotX: f.pivot ? f.pivot.x : 0.5,
                        pivotY: f.pivot ? f.pivot.y : 1.0
                    });
                }
            } else if (typeof frames === 'object') {
                let idx = 0;
                for (const name in frames) {
                    const f = frames[name];
                    regions.push({
                        id: "frame_" + (idx++),
                        name: name,
                        x: f.frame.x, y: f.frame.y, w: f.frame.w, h: f.frame.h,
                        pivotX: f.pivot ? f.pivot.x : 0.5,
                        pivotY: f.pivot ? f.pivot.y : 1.0
                    });
                }
            }

            return regions.length > 0 ? { method: "sidecar_metadata", confidence: 1.0, regions } : null;
        }
    },

    Visual: {
        analyze(img, options = {}) {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (width > 16384 || height > 16384) {
                return { method: "visual_failed", confidence: 0, regions: [], error: "Image too large" };
            }

            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, width, height);
            const rgba = imgData.data;

            const alphaHist = new Int32Array(256);
            let totalAlpha = 0;
            for (let i = 3; i < rgba.length; i += 4) {
                const a = rgba[i];
                if (a > 0) { alphaHist[a]++; totalAlpha++; }
            }

            let threshold = 16;
            if (totalAlpha > 0) {
                let sum = 0;
                for (let i = 0; i < 256; i++) sum += i * alphaHist[i];
                let sumB = 0, wB = 0, maxVar = 0;
                for (let t = 0; t < 256; t++) {
                    wB += alphaHist[t];
                    if (wB === 0) continue;
                    let wF = totalAlpha - wB;
                    if (wF === 0) break;
                    sumB += t * alphaHist[t];
                    let mB = sumB / wB, mF = (sum - sumB) / wF;
                    let variance = wB * wF * (mB - mF) * (mB - mF);
                    if (variance > maxVar) { maxVar = variance; threshold = t; }
                }
            }

            const binary = new Uint8Array(width * height);
            for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
                binary[p] = rgba[i + 3] > threshold ? 1 : 0;
            }

            const visited = new Uint8Array(width * height);
            const rawRegions = [];
            const minArea = options.minArea || 9;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    if (binary[idx] === 0 || visited[idx]) continue;

                    let minX = x, maxX = x, minY = y, maxY = y;
                    let pixelCount = 0;
                    const queue = [x, y];
                    visited[idx] = 1;
                    let qHead = 0;

                    while (qHead < queue.length) {
                        const cx = queue[qHead++];
                        const cy = queue[qHead++];
                        pixelCount++;
                        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
                        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

                        const neighbors = [
                            [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                        ];
                        for (const [nx, ny] of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIdx = ny * width + nx;
                                if (!visited[nIdx] && binary[nIdx]) {
                                    visited[nIdx] = 1;
                                    queue.push(nx, ny);
                                }
                            }
                        }
                    }

                    if (pixelCount >= minArea) {
                        rawRegions.push({
                            x: minX, y: minY,
                            w: maxX - minX + 1,
                            h: maxY - minY + 1,
                            pixelCount
                        });
                    }
                }
            }

            const mergeDist = options.mergeDistance !== undefined ? options.mergeDistance : 2;
            let merged = true;
            while (merged) {
                merged = false;
                for (let i = 0; i < rawRegions.length; i++) {
                    for (let j = i + 1; j < rawRegions.length; j++) {
                        const r1 = rawRegions[i], r2 = rawRegions[j];
                        const dx = Math.max(0, Math.max(r1.x - (r2.x + r2.w), r2.x - (r1.x + r1.w)));
                        const dy = Math.max(0, Math.max(r1.y - (r2.y + r2.h), r2.y - (r1.y + r1.h)));
                        if (dx <= mergeDist && dy <= mergeDist) {
                            const nx = Math.min(r1.x, r2.x);
                            const ny = Math.min(r1.y, r2.y);
                            const nw = Math.max(r1.x + r1.w, r2.x + r2.w) - nx;
                            const nh = Math.max(r1.y + r1.h, r2.y + r2.h) - ny;
                            rawRegions[i] = { x: nx, y: ny, w: nw, h: nh, pixelCount: r1.pixelCount + r2.pixelCount };
                            rawRegions.splice(j, 1);
                            merged = true;
                            break;
                        }
                    }
                    if (merged) break;
                }
            }

            const regions = rawRegions.map((r, idx) => ({
                id: "slice_" + idx,
                name: "Sprite_" + (idx + 1).toString().padStart(2, '0'),
                x: r.x, y: r.y, w: r.w, h: r.h,
                pivotX: 0.5, pivotY: 1.0,
                pixelCount: r.pixelCount
            }));

            regions.sort((a, b) => {
                if (Math.abs(a.y - b.y) > 16) return a.y - b.y;
                return a.x - b.x;
            });

            return {
                method: "saf_visual_pipeline",
                confidence: regions.length > 0 ? 0.92 : 0.4,
                regions: regions
            };
        }
    }
};

//==========================================================
// SECTION 15: QJ.DD.EXPORT (PNG SLICE EXPORTER)
//==========================================================
QJ.DD.Export = {
    exportSlices(asset, targetDir = "img/doodads") {
        if (!QJ.DD.FS.fs) return { success: false, error: "Node fs not available" };
        const regions = asset.slice ? asset.slice.regions || [] : [];
        if (regions.length === 0) return { success: false, error: "No slice regions defined" };

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const baseName = asset.fileName.split('.')[0];
            QJ.DD.FS.mkdir(targetDir);
            let savedCount = 0;

            for (let i = 0; i < regions.length; i++) {
                const r = regions[i];
                const canvas = document.createElement('canvas');
                canvas.width = r.w; canvas.height = r.h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);

                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\\/png;base64,/, "");
                const outName = \`\${baseName}_\${r.name || ('slice_' + (i+1).toString().padStart(2, '0'))}.png\`.replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
                const outPath = QJ.DD.FS.path.join(targetDir, outName);
                
                try {
                    QJ.DD.FS.fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
                    savedCount++;
                } catch(e) {
                    QJ.DD.Core.error("Failed to write slice PNG:", outPath, e);
                }
            }

            QJ.DD.AssetIndex.scan();
            if (QJ.DD.Workspace.mounted) QJ.DD.Workspace.refreshDrawerCards();
            QJ.DD.Workspace.showToast(\`Exported \${savedCount} PNG slice(s) to \${targetDir}!\`);
        };
        return { success: true };
    }
};

//==========================================================
// SECTION 16: QJ.DD.EVENTS (REAL MZ EVENT CREATOR)
//==========================================================
QJ.DD.Events = {
    allocateSafeId(mapData) {
        if (!mapData || !mapData.events) return 1;
        const used = new Set();
        for (let i = 1; i < mapData.events.length; i++) {
            if (mapData.events[i]) used.add(mapData.events[i].id || i);
        }
        let candidate = 1;
        while (used.has(candidate)) candidate++;
        return candidate;
    },

    createEventObject(eventId, x, y, options = {}) {
        return {
            id: eventId,
            name: options.name || ("EV" + String(eventId).padStart(3, '0')),
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
                    directionFix: options.directionFix || false,
                    image: {
                        characterIndex: options.characterIndex || 0,
                        characterName: options.characterName || "",
                        direction: options.direction || 2,
                        pattern: 1,
                        tileId: 0
                    },
                    list: options.list || [{ code: 0, indent: 0, parameters: [] }],
                    moveFrequency: 3,
                    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                    moveSpeed: 3,
                    moveType: options.moveType || 0,
                    priorityType: options.priorityType !== undefined ? options.priorityType : 1,
                    stepAnime: options.stepAnime || false,
                    through: options.through || false,
                    trigger: options.trigger !== undefined ? options.trigger : 0,
                    walkAnime: options.walkAnime !== undefined ? options.walkAnime : true
                }
            ]
        };
    }
};

//==========================================================
// SECTION 17: QJ.DD.EVENTTEMPLATES (ALL 20 BUILT-INS)
//==========================================================
QJ.DD.EventTemplates = {
    templates: {
        npc: {
            name: "NPC (Talkable)",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                { code: 401, indent: 0, parameters: ["Hello, traveler! The road ahead is peaceful."] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        door: {
            name: "Door (Interactive)",
            trigger: 0, priorityType: 1, directionFix: false,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Open1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 16 }, { code: 17 }, { code: 18 }, { code: 0 }], repeat: false, skippable: false, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        transfer_door: {
            name: "Transfer Door",
            trigger: 1, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Open1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 10, 10, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        chest: {
            name: "Treasure Chest",
            trigger: 0, priorityType: 1, directionFix: true,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Chest1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 125, indent: 0, parameters: [0, 0, 100] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                { code: 401, indent: 0, parameters: ["Found 100 Gold!"] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        loot_pickup: {
            name: "Loot Pickup",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                { code: 401, indent: 0, parameters: ["Obtained a Potion!"] },
                { code: 214, indent: 0, parameters: [] }, // Erase Event
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        sign: {
            name: "Signpost",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                { code: 401, indent: 0, parameters: ["<- Forest of Whispers | Royal Capital ->"] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        switch: {
            name: "Floor Switch",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] }, // Switch 1 ON
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        lever: {
            name: "Wall Lever",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch2", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        save_point: {
            name: "Save Point",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Recovery", pan: 0, pitch: 100, volume: 90 }] },
                { code: 352, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        shopkeeper: {
            name: "Shopkeeper",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2] },
                { code: 401, indent: 0, parameters: ["Welcome to my shop! Take your time."] },
                { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] }, // Open Shop Goods
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        enemy_encounter: {
            name: "Enemy Encounter",
            trigger: 2, priorityType: 1, // Event Touch
            list: [
                { code: 301, indent: 0, parameters: [0, 1, false, false] }, // Battle Processing
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        harvestable: {
            name: "Harvestable Herb/Ore",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item2", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        breakable_object: {
            name: "Breakable Object",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Break", pan: 0, pitch: 100, volume: 90 }] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        pushable_object: {
            name: "Pushable Boulder",
            trigger: 0, priorityType: 1,
            list: [
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 14 }, { code: 0 }], repeat: false, skippable: true, wait: true }] }, // Move Away from Player
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        light_source: {
            name: "Light Source / Campfire",
            trigger: 0, priorityType: 1, stepAnime: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        animated_prop: {
            name: "Animated Prop",
            trigger: 0, priorityType: 1, stepAnime: true, walkAnime: false,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        teleporter: {
            name: "Magical Teleporter",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Teleport", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 5, 5, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        ladder_stairs: {
            name: "Ladder / Stairs",
            trigger: 1, priorityType: 0,
            list: [
                { code: 201, indent: 0, parameters: [0, 1, 8, 2, 8, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        vehicle: {
            name: "Vehicle Boarding",
            trigger: 0, priorityType: 1,
            list: [
                { code: 354, indent: 0, parameters: [] }, // Board/Dismount
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        decoration_event: {
            name: "Decoration Event (Passable)",
            trigger: 0, priorityType: 0, through: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        }
    },

    get(templateKey) {
        return this.templates[templateKey] || this.templates.npc;
    }
};

//==========================================================
// SECTION 18: QJ.DD.COLLISION (PRESETS & SAT RUNTIME)
//==========================================================
QJ.DD.Collision = {
    presets: {
        none: null,
        full: { x: 0, y: 0, w: 1, h: 1 },
        bottomHalf: { x: 0, y: 0.5, w: 1, h: 0.5 },
        bottomThird: { x: 0, y: 0.67, w: 1, h: 0.33 },
        center: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
        trunk: { x: 0.35, y: 0.75, w: 0.3, h: 0.25 },
        thinWall: { x: 0, y: 0.4, w: 1, h: 0.2 },
        wideWall: { x: 0, y: 0.25, w: 1, h: 0.5 }
    },

    getPresetShape(presetName) {
        return this.presets[presetName] || null;
    }
};

if (typeof Game_CharacterBase !== 'undefined') {
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (!_Game_CharacterBase_canPass.apply(this, arguments)) return false;

        const doodads = QJ.DD.doodads();
        if (!doodads || doodads.length === 0) return true;

        const targetMapX = $gameMap.roundXWithDirection(x, d);
        const targetMapY = $gameMap.roundYWithDirection(y, d);
        const targetPx = targetMapX * 48 + 24;
        const targetPy = targetMapY * 48 + 24;
        const playerSATBox = QJ.DD.box(targetPx, targetPy, 32, 32);

        for (const dData of doodads) {
            if (dData.collision && dData.collision.preset !== "none") {
                const shape = dData.collision.shape || QJ.DD.Collision.getPresetShape(dData.collision.preset);
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

                    const colBody = QJ.DD.box(colX, colY, colW, colH);
                    if (QJ.DD.judge(colBody, playerSATBox)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
}

//==========================================================
// SECTION 19: QJ.DD.UNDO (COMMAND-BASED HISTORY STACK)
//==========================================================
QJ.DD.Undo = {
    undoStack: [],
    redoStack: [],
    maxDepth: 300,

    execute(command) {
        if (!command || !command.apply || !command.revert) return;
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = [];
        QJ.DD.Workspace.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
        QJ.DD.Workspace.updateUndoButtons();
        if (typeof SoundManager !== 'undefined') SoundManager.playCancel();
        return true;
    },

    redo() {
        if (this.redoStack.length === 0) return false;
        const cmd = this.redoStack.pop();
        cmd.apply();
        this.undoStack.push(cmd);
        QJ.DD.Workspace.updateUndoButtons();
        if (typeof SoundManager !== 'undefined') SoundManager.playOk();
        return true;
    }
};

//==========================================================
// SECTION 20: QJ.DD.PERSISTENCE & RECOVERY
//==========================================================
QJ.DD.Persistence = {
    sessionSnapshots: {},
    dirtyMap: false,
    dirtyDoodads: false,

    captureSession() {
        if (!window.$gameMap) return;
        const mapFile = \`data/Map\${$gameMap.mapId().padZero(3)}.json\`;
        this.sessionSnapshots[mapFile] = QJ.DD.FS.stat(mapFile);
    },

    checkConflict() {
        if (!window.$gameMap) return false;
        const mapFile = \`data/Map\${$gameMap.mapId().padZero(3)}.json\`;
        const snap = this.sessionSnapshots[mapFile];
        if (!snap) return false;
        const current = QJ.DD.FS.stat(mapFile);
        if (!current) return false;
        return current.mtimeMs !== snap.mtimeMs || current.size !== snap.size;
    },

    saveAll() {
        if (!window.$gameMap) return;
        if (this.checkConflict()) {
            alert("CONFLICT DETECTED: The map file was modified externally in RPG Maker MZ. Save was blocked to protect your project data.");
            return false;
        }

        const mapFile = \`data/Map\${$gameMap.mapId().padZero(3)}.json\`;
        QJ.DD.FS.createTimestampedBackup(mapFile);
        QJ.DD.FS.createTimestampedBackup('data/' + dataFileName);

        DataManager.saveDoodadsDataQJ();

        if (window.$gameMap && window.$gameMap._stagedMapData) {
            QJ.DD.FS.atomicWriteJson(mapFile, $gameMap._stagedMapData);
            this.sessionSnapshots[mapFile] = QJ.DD.FS.stat(mapFile);
        }

        QJ.DD.AssetIndex.save();

        this.dirtyMap = false;
        this.dirtyDoodads = false;
        QJ.DD.Workspace.showToast("Project Changes Saved Safely!");
        return true;
    }
};

//==========================================================
// SECTION 21: QJ.DD.LAYOUT (MULTIPLE SAVED LAYOUTS)
//==========================================================
QJ.DD.Layout = {
    presets: {
        Mapping: { drawerWidth: 360, inspectorWidth: 280, thumbSize: 96, viewMode: 'grid' },
        Events: { drawerWidth: 320, inspectorWidth: 380, thumbSize: 80, viewMode: 'grid' },
        Characters: { drawerWidth: 420, inspectorWidth: 260, thumbSize: 128, viewMode: 'grid' },
        Tiles: { drawerWidth: 380, inspectorWidth: 260, thumbSize: 48, viewMode: 'compact' },
        Compact: { drawerWidth: 280, inspectorWidth: 240, thumbSize: 64, viewMode: 'list' }
    },
    current: defaultLayoutName,

    apply(layoutName) {
        this.current = layoutName;
        const cfg = this.presets[layoutName] || this.presets.Mapping;
        const drawer = document.getElementById('qj-drawer-panel');
        const inspector = document.getElementById('qj-inspector-panel');
        if (drawer) drawer.style.width = cfg.drawerWidth + 'px';
        if (inspector) inspector.style.width = cfg.inspectorWidth + 'px';
        const zoom = document.getElementById('qj-thumb-zoom');
        if (zoom) {
            zoom.value = cfg.thumbSize;
            const container = document.getElementById('qj-cards-container');
            if (container) container.style.gridTemplateColumns = \`repeat(auto-fill, minmax(\${cfg.thumbSize}px, 1fr))\`;
        }
    }
};

//==========================================================
// SECTION 22: QJ.DD.WORKSPACE (GLASSMORPHIC WORKSPACE UI)
//==========================================================
QJ.DD.Workspace = {
    mounted: false,
    container: null,
    drawerEl: null,
    inspectorEl: null,
    selectedAsset: null,
    selectedDoodad: null,
    currentCategory: 'All',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { density: 3, scaleJitter: 0.15, rotateJitter: 25 },

    toggle() {
        if (this.mounted) this.close(); else this.open();
    },

    open() {
        if (!editorMode || this.mounted) return;
        QJ.DD.Persistence.captureSession();
        QJ.DD.AssetIndex.scan();
        this.buildDom();
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = true;
        }

        // Check for recovery file
        const recovery = QJ.DD.FS.readJson('data/QJAssetWorkspaceRecovery.json');
        if (recovery && recovery.timestamp && (Date.now() - recovery.timestamp) < 86400000) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            if (confirm(\`Unfinished session from \${dateStr} found. Would you like to recover it?\`)) {
                if (recovery.doodads && window.$gameMap) {
                    window.$dataDoodadsQJ[$gameMap.mapId()] = recovery.doodads;
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                }
                this.showToast("Session Recovered!");
            }
        }
    },

    close() {
        if (!this.mounted) return;
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = false;
        }
        this.placementTool = null;
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'qj-asset-workspace-root';
        wrap.style.cssText = \`
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        \`;

        const style = document.createElement('style');
        style.textContent = \`
            #qj-asset-workspace-root * { box-sizing: border-box; }
            .qj-glass {
                background: rgba(20, 24, 33, 0.90);
                backdrop-filter: blur(14px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 10px 32px rgba(0,0,0,0.55);
                pointer-events: auto;
            }
            .qj-btn {
                background: #273142; color: #f1f5f9; border: 1px solid #3e4c62;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .qj-btn:hover { background: #39475e; border-color: #60a5fa; }
            .qj-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .qj-btn-primary:hover { background: #1d4ed8; }
            .qj-btn-active { background: #059669 !important; border-color: #10b981 !important; }
            .qj-card {
                background: #18202f; border: 1px solid #283548; border-radius: 6px;
                cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, border-color 0.15s;
            }
            .qj-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
            .qj-card.selected { border: 2px solid #60a5fa; background: #1e293b; }
            .qj-badge {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75);
                padding: 2px 5px; border-radius: 3px; font-size: 10px; color: #93c5fd;
            }
        \`;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'qj-glass';
        toolbar.style.cssText = \`
            position: absolute; top: 10px; left: 10px; right: 10px; height: 50px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
        \`;
        toolbar.innerHTML = \`
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">QJ WORKSPACE</span>
                <input type="text" id="qj-search-input" placeholder="Search (e.g. tree type:character -dead)"
                    style="width: 260px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="qj-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    <option value="Mapping">Layout: Mapping</option>
                    <option value="Events">Layout: Events</option>
                    <option value="Characters">Layout: Characters</option>
                    <option value="Tiles">Layout: Tiles</option>
                    <option value="Compact">Layout: Compact</option>
                </select>
                <button class="qj-btn" id="qj-undo-btn">Undo</button>
                <button class="qj-btn" id="qj-redo-btn">Redo</button>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button class="qj-btn" id="qj-eyedropper-btn" title="Pick asset from map (Alt+Click)">Eyedropper</button>
                <button class="qj-btn" id="qj-stamp-btn" title="Repeatedly stamp selected asset">Stamp</button>
                <button class="qj-btn" id="qj-brush-btn" title="Scatter random props">Scatter Brush</button>
                <button class="qj-btn" id="qj-slicer-btn" title="Open Sprite Sheet Slicer">Slicer Modal</button>
                <button class="qj-btn" id="qj-diag-btn" title="Open System Diagnostics">Diagnostics</button>
                <button class="qj-btn qj-btn-primary" id="qj-save-btn">Save Changes</button>
                <button class="qj-btn" id="qj-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        \`;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'qj-glass';
        drawer.id = 'qj-drawer-panel';
        drawer.style.cssText = \`
            position: absolute; top: 70px; left: 10px; bottom: 30px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        \`;
        drawer.innerHTML = \`
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px; overflow-x: auto;" id="qj-category-tabs">
                <button class="qj-btn qj-btn-primary" data-cat="All">All</button>
                <button class="qj-btn" data-cat="Characters">Characters</button>
                <button class="qj-btn" data-cat="Doodads">Doodads</button>
                <button class="qj-btn" data-cat="Tilesets">Tiles</button>
                <button class="qj-btn" data-cat="Pictures">Pictures</button>
                <button class="qj-btn" data-cat="Audio">Audio</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="qj-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="qj-thumb-zoom" min="48" max="160" value="\${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="qj-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(\${defaultThumbnailSize}px, 1fr)); gap: 8px;">
            </div>
        \`;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'qj-glass';
        inspector.id = 'qj-inspector-panel';
        inspector.style.cssText = \`
            position: absolute; top: 70px; right: 10px; bottom: 30px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        \`;
        inspector.innerHTML = \`
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="qj-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or an object on the map.
            </div>
        \`;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'qj-glass';
        statusBar.style.cssText = \`
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 22px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        \`;
        statusBar.innerHTML = \`
            <span id="qj-status-left">QJ Doodads Asset Workspace v\${pluginVersion} Ready</span>
            <span id="qj-status-right">Map ID: \${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        \`;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.refreshDrawerCards();
    },

    bindEvents() {
        document.getElementById('qj-close-btn').onclick = () => this.close();
        document.getElementById('qj-save-btn').onclick = () => QJ.DD.Persistence.saveAll();
        document.getElementById('qj-undo-btn').onclick = () => QJ.DD.Undo.undo();
        document.getElementById('qj-redo-btn').onclick = () => QJ.DD.Undo.redo();

        const layoutSel = document.getElementById('qj-layout-select');
        layoutSel.value = QJ.DD.Layout.current;
        layoutSel.onchange = (e) => QJ.DD.Layout.apply(e.target.value);

        const searchInput = document.getElementById('qj-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
        };

        const zoomSlider = document.getElementById('qj-thumb-zoom');
        zoomSlider.oninput = (e) => {
            const size = e.target.value;
            const container = document.getElementById('qj-cards-container');
            container.style.gridTemplateColumns = \`repeat(auto-fill, minmax(\${size}px, 1fr))\`;
        };

        const catTabs = document.getElementById('qj-category-tabs');
        catTabs.onclick = (e) => {
            if (e.target.dataset.cat) {
                catTabs.querySelectorAll('button').forEach(b => b.className = 'qj-btn');
                e.target.className = 'qj-btn qj-btn-primary';
                this.currentCategory = e.target.dataset.cat;
                this.refreshDrawerCards();
            }
        };

        document.getElementById('qj-slicer-btn').onclick = () => {
            if (this.selectedAsset) this.openSlicerModal(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
        };

        document.getElementById('qj-diag-btn').onclick = () => this.openDiagnosticsModal();

        const eyeBtn = document.getElementById('qj-eyedropper-btn');
        eyeBtn.onclick = () => {
            this.placementTool = this.placementTool === 'eyedropper' ? null : 'eyedropper';
            eyeBtn.classList.toggle('qj-btn-active', this.placementTool === 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper: Click any object on map" : "Eyedropper Deactivated");
        };

        const stampBtn = document.getElementById('qj-stamp-btn');
        stampBtn.onclick = () => {
            this.placementTool = this.placementTool === 'stamp' ? null : 'stamp';
            stampBtn.classList.toggle('qj-btn-active', this.placementTool === 'stamp');
            this.showToast(this.placementTool ? "Stamp Tool: Click on map to place repeatedly" : "Stamp Deactivated");
        };

        const brushBtn = document.getElementById('qj-brush-btn');
        brushBtn.onclick = () => {
            this.placementTool = this.placementTool === 'brush' ? null : 'brush';
            brushBtn.classList.toggle('qj-btn-active', this.placementTool === 'brush');
            this.showToast(this.placementTool ? "Scatter Brush: Click/drag on map to scatter props" : "Brush Deactivated");
        };
    },

    refreshDrawerCards() {
        const container = document.getElementById('qj-cards-container');
        if (!container) return;
        container.innerHTML = '';

        let filtered = QJ.DD.AssetIndex.list;
        if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = QJ.DD.Search.filter(filtered, this.searchQuery);

        document.getElementById('qj-asset-count').textContent = \`Assets: \${filtered.length}\`;

        for (let i = 0; i < Math.min(filtered.length, 300); i++) {
            const asset = filtered[i];
            const card = document.createElement('div');
            card.className = 'qj-card' + (this.selectedAsset === asset ? ' selected' : '');
            card.style.cssText = \`height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;\`;

            const imgEl = document.createElement('img');
            imgEl.style.cssText = 'max-width: 80%; max-height: 68px; object-fit: contain; image-rendering: pixelated;';
            QJ.DD.Thumbnail.get(asset, 96, (dataUrl) => {
                imgEl.src = dataUrl;
            });
            card.appendChild(imgEl);

            const title = document.createElement('div');
            title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 4px;';
            title.textContent = asset.fileName;
            card.appendChild(title);

            if (asset.favorite) {
                const favBadge = document.createElement('span');
                favBadge.className = 'qj-badge';
                favBadge.textContent = '★';
                favBadge.style.color = '#fbbf24';
                card.appendChild(favBadge);
            }

            card.onclick = () => {
                this.selectAsset(asset);
                container.querySelectorAll('.qj-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
            };

            // Double click opens Slicer
            card.ondblclick = () => {
                this.openSlicerModal(asset);
            };

            // Drag to map
            card.draggable = true;
            card.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ assetId: asset.id, path: asset.path }));
            };

            container.appendChild(card);
        }
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        this.refreshInspector();
    },

    refreshInspector() {
        const content = document.getElementById('qj-inspector-content');
        if (!content) return;
        if (!this.selectedAsset) {
            content.innerHTML = "Select an asset to view properties.";
            return;
        }

        const a = this.selectedAsset;
        const templates = QJ.DD.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += \`<option value="\${key}">\${templates[key].name}</option>\`;
        }

        content.innerHTML = \`
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">\${a.fileName}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">\${a.category}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: \${a.width} x \${a.height}</div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="qj-btn" id="qj-fav-toggle" style="flex: 1;">\${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="qj-place-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                </select>
            </div>
            <div id="qj-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="qj-event-template" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    \${templateOptions}
                </select>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                <select id="qj-col-preset" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="none">None (Passable)</option>
                    <option value="full">Full Bounds</option>
                    <option value="bottomHalf">Bottom Half</option>
                    <option value="bottomThird">Bottom Third</option>
                    <option value="trunk">Tree Trunk</option>
                    <option value="thinWall">Thin Wall</option>
                </select>
            </div>
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="qj-btn qj-btn-primary" id="qj-place-now-btn">Place on Map Center</button>
                <button class="qj-btn" id="qj-open-slicer-btn">Edit Slices</button>
            </div>
        \`;

        const modeSel = document.getElementById('qj-place-mode');
        const templateGroup = document.getElementById('qj-template-group');
        modeSel.value = a.placement.defaultMode || "doodad";
        templateGroup.style.display = modeSel.value === "event" ? "block" : "none";

        modeSel.onchange = (e) => {
            a.placement.defaultMode = e.target.value;
            templateGroup.style.display = a.placement.defaultMode === "event" ? "block" : "none";
        };

        const colSel = document.getElementById('qj-col-preset');
        colSel.value = a.collision.preset || "none";
        colSel.onchange = (e) => { a.collision.preset = e.target.value; };

        document.getElementById('qj-fav-toggle').onclick = () => {
            QJ.DD.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };

        document.getElementById('qj-open-slicer-btn').onclick = () => {
            this.openSlicerModal(a);
        };

        document.getElementById('qj-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
        };
    },

    placeAssetOnMapCenter(asset) {
        if (!window.$gameMap || !window.$gamePlayer) return;
        const mapX = $gamePlayer.x * 48 + 24;
        const mapY = $gamePlayer.y * 48 + 24;

        if (asset.placement.defaultMode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const templateKey = document.getElementById('qj-event-template') ? document.getElementById('qj-event-template').value : 'npc';
            const template = QJ.DD.EventTemplates.get(templateKey);
            const mapId = $gameMap.mapId();
            $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
            const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);
            const ev = QJ.DD.Events.createEventObject(newId, $gamePlayer.x, $gamePlayer.y, {
                characterName: asset.fileName,
                characterIndex: 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType
            });
            $gameMap._stagedMapData.events[newId] = ev;
            this.showToast(\`Created \${template.name} Event EV\${String(newId).padStart(3, '0')}\`);
        } else {
            const d = QJ.DD.standardStruct();
            d.bit = [3, asset.path];
            d.x = mapX;
            d.y = mapY;
            d.frameW = asset.width || 48;
            d.frameH = asset.height || 48;
            d.collision = { preset: asset.collision.preset || "none", shape: null };

            const cmd = {
                apply: () => {
                    window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                    window.$dataDoodadsQJ[$gameMap.mapId()].push(d);
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                },
                revert: () => {
                    const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                }
            };
            QJ.DD.Undo.execute(cmd);
            this.showToast("Placed Doodad on Map!");
        }
        QJ.DD.AssetIndex.recordUsage(asset.id);
    },

    openSlicerModal(asset) {
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
        modal.style.cssText = \`
            position: fixed; top: 30px; left: 30px; right: 30px; bottom: 30px;
            z-index: 10005; display: flex; flex-direction: column; overflow: hidden;
            padding: 16px; pointer-events: auto;
        \`;
        modal.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: bold; color: #60a5fa; font-size: 14px;">SPRITE SHEET SLICER: \${asset.fileName}</span>
                    <button class="qj-btn qj-btn-primary" id="qj-auto-slice-btn">Run SAF Auto-Slice</button>
                    <button class="qj-btn" id="qj-export-pngs-btn">Export Slices as PNGs</button>
                </div>
                <div>
                    <button class="qj-btn" id="qj-close-slicer-btn">Close Slicer</button>
                </div>
            </div>
            <div style="flex: 1; position: relative; overflow: auto; background: #070a12; margin-top: 10px; display: flex; align-items: center; justify-content: center;" id="qj-slicer-viewport">
                <canvas id="qj-slicer-canvas" style="box-shadow: 0 0 24px rgba(0,0,0,0.8); cursor: crosshair;"></canvas>
            </div>
            <div style="margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                <span id="qj-slicer-status">Regions: \${(asset.slice.regions || []).length} | Confidence: \${Math.round((asset.slice.confidence || 1.0) * 100)}%</span>
                <span>Zoom: Mouse Wheel | Pan: Space + Drag</span>
            </div>
        \`;
        document.body.appendChild(modal);

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const canvas = document.getElementById('qj-slicer-canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            const render = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const regions = asset.slice.regions || [];
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 1;
                ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                for (const r of regions) {
                    ctx.fillRect(r.x, r.y, r.w, r.h);
                    ctx.strokeRect(r.x, r.y, r.w, r.h);
                    // 8-handle corners
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(r.x - 2, r.y - 2, 4, 4);
                    ctx.fillRect(r.x + r.w - 2, r.y - 2, 4, 4);
                    ctx.fillRect(r.x - 2, r.y + r.h - 2, 4, 4);
                    ctx.fillRect(r.x + r.w - 2, r.y + r.h - 2, 4, 4);
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                }
            };
            render();

            document.getElementById('qj-auto-slice-btn').onclick = () => {
                const res = QJ.DD.Slicing.Visual.analyze(img);
                asset.slice = res;
                QJ.DD.AssetIndex.save();
                render();
                document.getElementById('qj-slicer-status').textContent = \`Regions: \${res.regions.length} | Confidence: \${Math.round(res.confidence * 100)}% (SAF Visual Detection)\`;
            };

            document.getElementById('qj-export-pngs-btn').onclick = () => {
                QJ.DD.Export.exportSlices(asset);
            };
        };

        document.getElementById('qj-close-slicer-btn').onclick = () => {
            modal.parentNode.removeChild(modal);
        };
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'qj-glass';
        diag.style.cssText = \`
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        \`;
        diag.innerHTML = \`
            <div style="font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 12px;">SYSTEM DIAGNOSTICS</div>
            <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1;">
                <div>Total Indexed Assets: <strong style="color: #fff;">\${QJ.DD.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: #fff;">\${Object.keys(QJ.DD.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: #fff;">\${QJ.DD.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: #fff;">\${QJ.DD.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: #fff;">\${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="qj-btn qj-btn-primary" id="qj-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="qj-btn" id="qj-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="qj-btn" id="qj-close-diag-btn">Close</button>
            </div>
        \`;
        document.body.appendChild(diag);

        document.getElementById('qj-rebuild-idx-btn').onclick = () => {
            QJ.DD.AssetIndex.data.assets = {};
            QJ.DD.AssetIndex.scan();
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-clear-cache-btn').onclick = () => {
            QJ.DD.Thumbnail.cache = {};
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = \`
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 20px;
            font-size: 12px; font-weight: bold; z-index: 10020; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            pointer-events: none; transition: opacity 0.3s;
        \`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        }, 2200);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('qj-undo-btn');
        const rBtn = document.getElementById('qj-redo-btn');
        if (uBtn) uBtn.style.opacity = QJ.DD.Undo.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = QJ.DD.Undo.redoStack.length > 0 ? '1' : '0.5';
    }
};

//==========================================================
// SECTION 23: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_initialize = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        $.Scene_Map_initialize.call(this);
    };

    $.Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        $.Scene_Map_updateScene.call(this);
        if (!editorMode) return;

        if (typeof Input !== 'undefined' && Input.isTriggered(editKey)) {
            QJ.DD.Workspace.toggle();
        }
    };
}

// Windows Explorer native drag and drop import listener
if (typeof window !== 'undefined') {
    window.addEventListener('dragover', (e) => {
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
        }
    });
    window.addEventListener('drop', (e) => {
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
                if (!fs) return;
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    const dest = path.join('img', 'doodads', f.name);
                    try {
                        fs.copyFileSync(f.path, dest);
                    } catch(err) {}
                }
                QJ.DD.AssetIndex.scan();
                QJ.DD.Workspace.refreshDrawerCards();
                QJ.DD.Workspace.showToast(\`Imported \${e.dataTransfer.files.length} file(s) from Explorer!\`);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!window.$gameSystem || !window.$gameSystem.doodadsQJ || !window.$gameSystem.doodadsQJ.editing) return;
        if (e.code === editKey) {
            e.preventDefault();
            QJ.DD.Workspace.toggle();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            QJ.DD.Undo.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            QJ.DD.Undo.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            QJ.DD.Persistence.saveAll();
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    setInterval(() => {
        if (editorMode && window.$gameMap && (QJ.DD.Persistence.dirtyMap || QJ.DD.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: QJ.DD.doodads(),
                stagedMap: $gameMap._stagedMapData
            };
            QJ.DD.FS.atomicWriteJson('data/QJAssetWorkspaceRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
}

})(QJ.DD.reWrite);
`;

fs.writeFileSync(targetPlugin, pluginCode, 'utf8');
console.log("Successfully wrote enhanced QJ-Doodads.js (" + pluginCode.length + " bytes).");
