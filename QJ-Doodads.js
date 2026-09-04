//==========================================================
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


//==========================================================
// SECTION 1: CORE CONSTANTS & PARAMETERS
//==========================================================
const pluginName = "QJ-Doodads";
const parameters = (typeof PluginManager !== 'undefined' && PluginManager.parameters) ? PluginManager.parameters(pluginName) : {};

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
    const safe = String(value || 'DoodadsQJ')
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/^\.+|\.+$/g, '');
    return safe || 'DoodadsQJ';
}

QJ.DD.Security = QJ.DD.Security || {
    escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }
};

const escapeHtml = QJ.DD.Security.escapeHtml;
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


//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
QJ.DD.migrateData = function(data, type) {
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
        QJ.DD.migrateData(window.$dataDoodadsQJ, 'doodads');
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
        const file = path.slice(slash + 1).replace(/\.[^/.]+$/, "");
        return ImageManager.loadBitmap(folder, file);
    }
    return ImageManager.loadBitmap('img/', path.replace(/\.[^/.]+$/, ""));
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
        if (this._data.editorHidden && QJ.DD.Workspace && QJ.DD.Workspace.mounted) {
            this.visible = false;
        } else {
            this.visible = true;
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

    createTimestampedBackup(filePath, backupDirectory = 'data/qj_asset_cache/backups') {
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
        const cacheDir = 'data/qj_asset_cache/backups';
        if (!this.existsSync(cacheDir)) return null;
        const baseName = this.path.basename(filePath);
        const backups = this.fs.readdirSync(cacheDir)
            .filter(f => f.startsWith(baseName) && f.endsWith('.bak'))
            .map(f => ({ path: this.path.join(cacheDir, f), time: this.fs.statSync(this.path.join(cacheDir, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time);
        return backups.length > 0 ? backups[0].path : null;
    },

    listBackups(filePath, backupDirectory = 'data/qj_asset_cache/backups') {
        if (!this.fs || !this.path || !this.existsSync(backupDirectory)) return [];
        const baseName = this.path.basename(filePath);
        return this.fs.readdirSync(backupDirectory)
            .filter(fileName => fileName.startsWith(baseName + '.') && fileName.endsWith('.bak'))
            .map(fileName => {
                const backupPath = this.path.join(backupDirectory, fileName);
                const stat = this.fs.statSync(backupPath);
                return { path: backupPath, name: fileName, mtimeMs: stat.mtimeMs, size: stat.size };
            })
            .sort((a, b) => b.mtimeMs - a.mtimeMs);
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
                const temporary = `${targetPath}.qjtxn-${transactionId}-${index}.tmp`;
                this.fs.writeFileSync(temporary, json, 'utf8');
                prepared.push({ targetPath, temporary, existed: this.existsSync(targetPath), rollback: null });
            }

            for (let index = 0; index < prepared.length; index++) {
                const item = prepared[index];
                if (item.existed) {
                    item.rollback = `${item.targetPath}.qjtxn-${transactionId}-${index}.rollback`;
                    this.fs.copyFileSync(item.targetPath, item.rollback);
                }
                rollbackRecords.push(item);
                if (typeof options.beforeCommit === 'function') options.beforeCommit(index, entries[index]);
                this.fs.renameSync(item.temporary, item.targetPath);
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
            const backupDirectory = this.path.resolve(options.backupDir || 'data/qj_asset_cache/backups');
            const resolvedBackup = this.path.resolve(backupPath);
            const resolvedTarget = this.path.resolve(filePath);
            const expectedPrefix = this.path.basename(resolvedTarget) + '.';
            if (this.path.dirname(resolvedBackup) !== backupDirectory ||
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
            if (!this.existsSync(filePath)) return null;
            return JSON.parse(this.readFileSync(filePath, 'utf8'));
        } catch(e) {
            console.warn(`[QJ.DD.FS] Corrupt JSON encountered reading ${filePath}:`, e);
            const fallback = this.findLatestBackup(filePath);
            if (fallback) {
                try {
                    console.warn(`[QJ.DD.FS] Automatically recovered ${filePath} from backup ${fallback}`);
                    return JSON.parse(this.readFileSync(fallback, 'utf8'));
                } catch(e2) {}
            }
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

    isSupportedAssetFile(filePath) {
        if (!QJ.DD.FS.path) return false;
        return this.supportedExtensions.has(QJ.DD.FS.path.extname(filePath).toLowerCase());
    },

    scan() {
        if (!QJ.DD.FS.fs) return;
        this.init();
        for (const r of this.roots) {
            this.scanDirectory(r);
        }
        this.save();
        this.rebuildList();
    },

    async scanAsync(options = {}) {
        const fs = QJ.DD.FS.fs;
        const path = QJ.DD.FS.path;
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
                if (existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size) {
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
            QJ.DD.FS.atomicWriteJson(target, this.data);
        }
        return result;
    },

    scanDirectory(dirPath) {
        const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
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
        const fs = QJ.DD.FS.fs;
        const stat = knownStat || fs.statSync(fullPath);
        const normalizedAssetPath = String(assetPath).replace(/\\/g, '/');
        const assetId = normalizedAssetPath.toLowerCase();

        let existing = this.data.assets[assetId];
        if (existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size) {
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
// SECTION 13: QJ.DD.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
QJ.DD.Thumbnail = {
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
        return `data/qj_asset_cache/thumbnails/${safeKey}.txt`;
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
        if (cacheEnabled && QJ.DD.FS.existsSync) {
            const diskFile = this.getDiskPath(key);
            if (QJ.DD.FS.existsSync(diskFile)) {
                try {
                    const cachedData = QJ.DD.FS.readFileSync(diskFile, 'utf8');
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
        if (QJ.DD.FS.fs) {
            const dir = 'data/qj_asset_cache/thumbnails';
            if (QJ.DD.FS.existsSync(dir)) {
                try {
                    const files = QJ.DD.FS.fs.readdirSync(dir);
                    for (const f of files) {
                        QJ.DD.FS.fs.unlinkSync(`${dir}/${f}`);
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
                if (cacheEnabled && QJ.DD.FS.fs && dataUrl) {
                    const diskFile = this.getDiskPath(job.key);
                    try {
                        const dir = 'data/qj_asset_cache/thumbnails';
                        if (!QJ.DD.FS.existsSync(dir)) QJ.DD.FS.mkdirp(dir);
                        QJ.DD.FS.writeFileSync(diskFile, dataUrl, 'utf8');
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
QJ.DD.Slicing.Metadata = {
    parse(imagePath) {
        const fs = QJ.DD.FS.fs;
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
                regions.push({
                    id: name,
                    name,
                    x: frame.x,
                    y: frame.y,
                    w: frame.w,
                    h: frame.h,
                    pivotX: frameData.pivot && Number.isFinite(frameData.pivot.x) ? frameData.pivot.x : 0.5,
                    pivotY: frameData.pivot && Number.isFinite(frameData.pivot.y) ? frameData.pivot.y : 1.0,
                    rotated: Boolean(frameData.rotated),
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
            QJ.DD.Core.log('Atlas sidecar parse failed.', jsonPath, error);
            return null;
        }
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
// SECTION 15: QJ.DD.EXPORT (PNG SLICE EXPORTER)
//==========================================================
QJ.DD.Export = {
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
        const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
        if (!fs || !path) return false;
        if (!asset.slice || !asset.slice.regions || asset.slice.regions.length === 0) {
            alert("No slice regions defined for this asset.");
            return false;
        }

        const outDir = targetDir || path.join('img', 'doodads', 'sliced_' + asset.fileName.replace(/\.[^/.]+$/, ""));
        QJ.DD.FS.mkdirp(outDir);

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
            QJ.DD.Workspace.showToast(`Exported ${count} slices to ${outDir}`);
        };
        return true;
    }
};


//==========================================================
// SECTION 16: QJ.DD.SLICING.EDITOR (FULL INTERACTIVE MODAL)
//==========================================================
QJ.DD.Slicing.Editor = {
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
        const uBtn = document.getElementById('qj-slicer-undo');
        const rBtn = document.getElementById('qj-slicer-redo');
        if (uBtn) uBtn.style.opacity = this.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
    },

    fitToScreen() {
        const vp = document.getElementById('qj-slicer-canvas-container');
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
        modal.id = 'qj-slicer-modal-root';
        modal.className = 'qj-glass';
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
                    <button class="qj-btn" id="qj-slicer-undo" title="Undo (Ctrl+Z)">Undo</button>
                    <button class="qj-btn" id="qj-slicer-redo" title="Redo (Ctrl+Y)">Redo</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="qj-btn qj-btn-primary" id="qj-slicer-saf-btn" title="Run Sprite Atlas Forge Visual Detection">SAF Auto-Slice</button>
                    <button class="qj-btn" id="qj-slicer-grid-btn" title="Slice into fixed grid">Fixed Grid</button>
                    <button class="qj-btn" id="qj-slicer-add-btn" title="Add region">Add Box</button>
                    <button class="qj-btn" id="qj-slicer-del-btn" title="Delete selected region">Delete</button>
                    <button class="qj-btn" id="qj-slicer-dup-btn" title="Duplicate selected">Duplicate</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="qj-btn" id="qj-slicer-splitv-btn" title="Split vertical">Split Vert</button>
                    <button class="qj-btn" id="qj-slicer-splith-btn" title="Split horizontal">Split Horz</button>
                    <button class="qj-btn" id="qj-slicer-export-btn" title="Export individual PNG files">Export PNGs</button>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="qj-btn qj-btn-primary" id="qj-slicer-save-btn">Save Slices</button>
                    <button class="qj-btn" id="qj-slicer-close-btn" style="background: #ef4444; border-color: #dc2626;">Close</button>
                </div>
            </div>

            <!-- Workspace Body: Left Canvas Viewport + Right Region List -->
            <div style="flex: 1; display: flex; overflow: hidden; position: relative;">
                <!-- Canvas Container -->
                <div id="qj-slicer-canvas-container" style="flex: 1; background: #0b0f19; overflow: hidden; position: relative; cursor: default;">
                    <canvas id="qj-slicer-interactive-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>

                <!-- Right Sidebar: Region List & Inspector -->
                <div style="width: 320px; background: rgba(15, 23, 42, 0.95); border-left: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: bold; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
                        <span>REGIONS (<span id="qj-region-count">0</span>)</span>
                        <span id="qj-slicer-zoom-indicator" style="color: #60a5fa;">100%</span>
                    </div>
                    <div id="qj-region-list" style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                    </div>
                    <!-- Selected Region Properties -->
                    <div id="qj-region-inspector" style="padding: 12px; background: #111827; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px;">
                        <div style="color: #64748b; text-align: center;">No region selected</div>
                    </div>
                </div>
            </div>

            <!-- Bottom Status Bar -->
            <div style="height: 26px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: #64748b;">
                <span id="qj-slicer-hint">Mouse Wheel: Zoom (25%-1600%) | Space+Drag / Middle Click: Pan | Drag handle: Resize | Drag inside: Move | Drag empty: Create</span>
                <span id="qj-slicer-img-dim">${this.img.naturalWidth} x ${this.img.naturalHeight} px</span>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        this.canvas = document.getElementById('qj-slicer-interactive-canvas');
        this.ctx = this.canvas.getContext('2d');
        const container = document.getElementById('qj-slicer-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        window.addEventListener('resize', () => {
            if (this.modal && container) {
                this.canvas.width = container.clientWidth;
                this.canvas.height = container.clientHeight;
                this.render();
            }
        });

        this.bindEvents();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    bindEvents() {
        const container = document.getElementById('qj-slicer-canvas-container');

        // Close & Save
        document.getElementById('qj-slicer-close-btn').onclick = () => this.close();
        document.getElementById('qj-slicer-save-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            this.asset.slice.status = "manual";
            QJ.DD.AssetIndex.save();
            QJ.DD.Workspace.refreshDrawerCards();
            QJ.DD.Workspace.showToast("Slice Regions Saved!");
            this.close();
        };

        // Undo & Redo
        document.getElementById('qj-slicer-undo').onclick = () => this.undo();
        document.getElementById('qj-slicer-redo').onclick = () => this.redo();

        // SAF Auto-slice
        document.getElementById('qj-slicer-saf-btn').onclick = () => {
            this.saveState();
            const res = QJ.DD.Slicing.Visual.analyze(this.img);
            this.regions = res.regions;
            this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
            this.render();
            this.updateRegionList();
            QJ.DD.Workspace.showToast(`SAF Detected ${this.regions.length} Regions!`);
        };

        // Fixed Grid
        document.getElementById('qj-slicer-grid-btn').onclick = () => {
            const input = prompt("Enter grid columns and rows (e.g. 8x4):", "4x2");
            if (!input) return;
            const parts = input.split(/[xX, ]+/);
            if (parts.length >= 2) {
                const cols = parseInt(parts[0], 10);
                const rows = parseInt(parts[1], 10);
                if (cols > 0 && rows > 0) {
                    this.saveState();
                    this.regions = QJ.DD.Slicing.Grid.sliceToGrid(this.img.naturalWidth, this.img.naturalHeight, cols, rows);
                    this.selectedRegionIdx = 0;
                    this.render();
                    this.updateRegionList();
                    QJ.DD.Workspace.showToast(`Sliced into ${cols}x${rows} Grid!`);
                }
            }
        };

        // Add, Delete, Duplicate
        document.getElementById('qj-slicer-add-btn').onclick = () => {
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

        document.getElementById('qj-slicer-del-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                this.regions.splice(this.selectedRegionIdx, 1);
                this.selectedRegionIdx = Math.min(this.selectedRegionIdx, this.regions.length - 1);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('qj-slicer-dup-btn').onclick = () => {
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
        document.getElementById('qj-slicer-splitv-btn').onclick = () => {
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

        document.getElementById('qj-slicer-splith-btn').onclick = () => {
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

        document.getElementById('qj-slicer-export-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            QJ.DD.Export.exportSlices(this.asset);
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

            const ind = document.getElementById('qj-slicer-zoom-indicator');
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

        // Keyboard shortcuts in slicer
        window.addEventListener('keydown', (e) => {
            if (!this.modal) return;
            if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                document.getElementById('qj-slicer-del-btn').click();
            } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
                this.undo();
            } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
                this.redo();
            } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                document.getElementById('qj-slicer-dup-btn').click();
            }
        });
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
        const countEl = document.getElementById('qj-region-count');
        if (countEl) countEl.textContent = this.regions.length;
        const listEl = document.getElementById('qj-region-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const item = document.createElement('div');
            item.className = 'qj-btn' + (i === this.selectedRegionIdx ? ' qj-btn-active' : '');
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
        const insp = document.getElementById('qj-region-inspector');
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
                    <input type="number" id="qj-insp-rx" value="${r.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Y:</label>
                    <input type="number" id="qj-insp-ry" value="${r.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Width:</label>
                    <input type="number" id="qj-insp-rw" value="${r.w}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Height:</label>
                    <input type="number" id="qj-insp-rh" value="${r.h}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
            <div style="margin-top: 6px;">
                <label style="color: #94a3b8; font-size: 10px;">Name:</label>
                <input type="text" id="qj-insp-name" value="${escapeHtml(r.name || '')}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot X:</label>
                    <input type="number" step="0.1" id="qj-insp-pivx" value="${r.pivotX !== undefined ? r.pivotX : 0.5}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot Y:</label>
                    <input type="number" step="0.1" id="qj-insp-pivy" value="${r.pivotY !== undefined ? r.pivotY : 1.0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
        `;

        const rx = document.getElementById('qj-insp-rx');
        const ry = document.getElementById('qj-insp-ry');
        const rw = document.getElementById('qj-insp-rw');
        const rh = document.getElementById('qj-insp-rh');
        const rname = document.getElementById('qj-insp-name');
        const pivx = document.getElementById('qj-insp-pivx');
        const pivy = document.getElementById('qj-insp-pivy');

        const applyInputs = () => {
            r.x = parseInt(rx.value, 10) || 0;
            r.y = parseInt(ry.value, 10) || 0;
            r.w = Math.max(4, parseInt(rw.value, 10) || 4);
            r.h = Math.max(4, parseInt(rh.value, 10) || 4);
            r.name = rname.value;
            r.pivotX = parseFloat(pivx.value) || 0.5;
            r.pivotY = parseFloat(pivy.value) || 1.0;
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
// SECTION 17: QJ.DD.EVENTS (REAL MZ EVENT CREATOR)
//==========================================================
QJ.DD.Events = {
    allocateSafeId(mapData) {
        if (!mapData || !mapData.events) return 1;
        const events = mapData.events;
        for (let i = 1; i < events.length; i++) {
            if (!events[i]) return i;
        }
        return events.length > 0 ? events.length : 1;
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
                        characterName: options.characterName || "",
                        direction: options.direction || 2,
                        pattern: options.pattern || 1,
                        tileId: 0
                    },
                    list: options.list || [{ code: 0, indent: 0, parameters: [] }],
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
// SECTION 18: QJ.DD.EVENTTEMPLATES (ALL 20 BUILT-INS + CUSTOM)
//==========================================================
QJ.DD.EventTemplates = {
    customPath: 'data/QJEventTemplates.json',
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
        const custom = QJ.DD.FS.readJson(this.customPath);
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

        let customData = QJ.DD.FS.readJson(this.customPath) || {};
        customData[key] = tmpl;
        QJ.DD.FS.atomicWriteJson(this.customPath, customData);
        return key;
    }
};

QJ.DD.EventTemplates.init();


//==========================================================
// SECTION 19: QJ.DD.COLLISION (PRESETS & SAT RUNTIME)
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
        wideWall: { x: 0, y: 0.25, w: 1, h: 0.5 },
        custom: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }
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
// SECTION 20: QJ.DD.UNDO (COMMAND-BASED HISTORY STACK)
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
// SECTION 21: QJ.DD.PERSISTENCE & RECOVERY
//==========================================================
QJ.DD.Persistence = {
    sessionSnapshots: {},
    dirtyMap: false,
    dirtyDoodads: false,

    captureSession() {
        if (!window.$gameMap) return;
        const mapFile = `data/Map${String($gameMap.mapId()).padStart(3, '0')}.json`;
        this.sessionSnapshots[mapFile] = QJ.DD.FS.stat(mapFile);
    },

    checkConflict() {
        if (!window.$gameMap) return false;
        const mapFile = `data/Map${String($gameMap.mapId()).padStart(3, '0')}.json`;
        const snap = this.sessionSnapshots[mapFile];
        if (!snap) return false;
        const current = QJ.DD.FS.stat(mapFile);
        if (!current) return false;
        return current.mtimeMs !== snap.mtimeMs || current.size !== snap.size;
    },

    saveAll(force = false) {
        if (!window.$gameMap) return false;
        if (!force && this.checkConflict()) {
            QJ.DD.Workspace.showConflictModal();
            return false;
        }

        const mapFile = `data/Map${String($gameMap.mapId()).padStart(3, '0')}.json`;
        const doodadFile = 'data/' + dataFileName;
        const entries = [
            { path: doodadFile, data: window.$dataDoodadsQJ || {}, indent: saveMode ? 0 : 2 },
            { path: QJ.DD.AssetIndex.libraryPath, data: QJ.DD.AssetIndex.data, indent: 2 }
        ];
        if (window.$gameMap._stagedMapData) {
            entries.unshift({ path: mapFile, data: $gameMap._stagedMapData, indent: 2 });
        }

        try {
            for (const entry of entries) QJ.DD.FS.createTimestampedBackup(entry.path);
        } catch (error) {
            QJ.DD.Core.log('Backup creation failed; save cancelled.', error);
            QJ.DD.Workspace.showToast(`Save cancelled: backup failed (${error.message || error}).`);
            return false;
        }

        const saveResult = QJ.DD.FS.atomicWriteManyJson(entries);
        if (!saveResult.ok) {
            QJ.DD.Core.log('Project save transaction failed.', saveResult.error);
            QJ.DD.Workspace.showToast(`Save failed${saveResult.rolledBack ? '; previous files restored' : ''}: ${saveResult.error}`);
            return false;
        }

        if (window.$gameMap._stagedMapData) this.sessionSnapshots[mapFile] = QJ.DD.FS.stat(mapFile);

        this.dirtyMap = false;
        this.dirtyDoodads = false;
        if (QJ.DD.FS.fs && QJ.DD.FS.fs.existsSync('data/QJAssetWorkspaceRecovery.json')) {
            try { QJ.DD.FS.fs.unlinkSync('data/QJAssetWorkspaceRecovery.json'); } catch(e) {}
        }
        QJ.DD.Workspace.showToast("Project Saved! Reload map in MZ before editing there.");
        return true;
    }
};

//==========================================================
// SECTION 22: QJ.DD.LAYOUT (MULTIPLE SAVED LAYOUTS)
//==========================================================
QJ.DD.Layout = {
    filePath: 'data/QJWorkspaceLayouts.json',
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
            const data = QJ.DD.FS.readJson(this.filePath);
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
        const drawer = document.getElementById('qj-drawer-panel');
        const inspector = document.getElementById('qj-inspector-panel');
        const zoom = document.getElementById('qj-thumb-zoom');
        const layoutData = {
            drawerWidth: drawer ? (parseInt(drawer.style.width, 10) || 360) : 360,
            inspectorWidth: inspector ? (parseInt(inspector.style.width, 10) || 280) : 280,
            thumbSize: zoom ? (parseInt(zoom.value, 10) || 96) : 96,
            viewMode: 'grid'
        };
        this.custom[name] = layoutData;
        QJ.DD.FS.atomicWriteJson(this.filePath, this.custom);
        this.current = name;
        return true;
    },

    deleteCustomLayout(name) {
        if (this.custom[name]) {
            delete this.custom[name];
            QJ.DD.FS.atomicWriteJson(this.filePath, this.custom);
            if (this.current === name) this.apply('Mapping');
            return true;
        }
        return false;
    },

    apply(layoutName) {
        this.init();
        this.current = layoutName;
        const cfg = this.get(layoutName);
        const drawer = document.getElementById('qj-drawer-panel');
        const inspector = document.getElementById('qj-inspector-panel');
        if (drawer) drawer.style.width = cfg.drawerWidth + 'px';
        if (inspector) inspector.style.width = cfg.inspectorWidth + 'px';
        const zoom = document.getElementById('qj-thumb-zoom');
        if (zoom) {
            zoom.value = cfg.thumbSize;
            if (QJ.DD.Workspace) {
                QJ.DD.Workspace.thumbSize = cfg.thumbSize;
                QJ.DD.Workspace.updateVirtualGrid(true);
            }
        }
        if (QJ.DD.Workspace && typeof QJ.DD.Workspace.refreshLayoutSelector === 'function') {
            QJ.DD.Workspace.refreshLayoutSelector();
        }
    }
};

//==========================================================
// SECTION 23: QJ.DD.AUDIO (PREVIEW & SOUND TRIGGERS)
//==========================================================
QJ.DD.Audio = {
    currentPlaying: null,

    playPreview(asset) {
        if (!asset || asset.category !== 'Audio') return;
        const baseName = asset.fileName.replace(/\.[^/.]+$/, "");
        this.stopPreview();

        if (typeof AudioManager !== 'undefined') {
            if (asset.path.includes('/bgm/')) {
                AudioManager.playBgm({ name: baseName, volume: 90, pitch: 100, pan: 0 });
                this.currentPlaying = { type: 'bgm', name: baseName };
            } else if (asset.path.includes('/bgs/')) {
                AudioManager.playBgs({ name: baseName, volume: 90, pitch: 100, pan: 0 });
                this.currentPlaying = { type: 'bgs', name: baseName };
            } else if (asset.path.includes('/me/')) {
                AudioManager.playMe({ name: baseName, volume: 90, pitch: 100, pan: 0 });
                this.currentPlaying = { type: 'me', name: baseName };
            } else {
                AudioManager.playSe({ name: baseName, volume: 90, pitch: 100, pan: 0 });
                this.currentPlaying = { type: 'se', name: baseName };
            }
        }
    },

    stopPreview() {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.stopBgm();
            AudioManager.stopBgs();
            AudioManager.stopMe();
            AudioManager.stopSe();
        }
        this.currentPlaying = null;
    }
};

//==========================================================
// SECTION 24: QJ.DD.IMPORT (TRANSACTIONAL EXPLORER INGESTION)
//==========================================================
QJ.DD.Import = {
    imageExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp']),
    audioExtensions: new Set(['.ogg', '.m4a', '.wav']),
    destinations: [
        'img/doodads', 'img/characters', 'img/faces', 'img/parallaxes',
        'img/pictures', 'img/tilesets', 'audio/bgm', 'audio/bgs',
        'audio/me', 'audio/se'
    ],

    isSupported(filePath) {
        if (!QJ.DD.FS.path) return false;
        const ext = QJ.DD.FS.path.extname(filePath).toLowerCase();
        return this.imageExtensions.has(ext) || this.audioExtensions.has(ext);
    },

    detectDestination(filePath) {
        const path = QJ.DD.FS.path;
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

    collectFiles(sourcePaths) {
        const fs = QJ.DD.FS.fs;
        const path = QJ.DD.FS.path;
        const files = [];
        const errors = [];
        if (!fs || !path) return { files, errors: [{ path: '', message: 'Filesystem access is unavailable.' }] };

        const pending = Array.from(sourcePaths || []).filter(Boolean).map(p => path.resolve(String(p)));
        while (pending.length > 0) {
            const current = pending.pop();
            try {
                const stat = fs.statSync(current);
                if (stat.isDirectory()) {
                    const children = fs.readdirSync(current).sort().reverse();
                    for (const child of children) pending.push(path.join(current, child));
                } else if (stat.isFile()) {
                    files.push(current);
                }
            } catch (error) {
                errors.push({ path: current, message: error && error.message ? error.message : String(error) });
            }
        }
        files.sort((a, b) => a.localeCompare(b));
        return { files, errors };
    },

    filesEqual(firstPath, secondPath) {
        const fs = QJ.DD.FS.fs;
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
        const fs = QJ.DD.FS.fs;
        const path = QJ.DD.FS.path;
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

            const targetFolder = path.resolve(plan.projectRoot, relativeFolder);
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
        const fs = QJ.DD.FS.fs;
        const path = QJ.DD.FS.path;
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

        const completed = [];
        const tempFiles = [];
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try {
            for (let index = 0; index < plan.operations.length; index++) {
                const operation = plan.operations[index];
                QJ.DD.FS.ensureDir(path.dirname(operation.destination));

                const existed = fs.existsSync(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.qjimport-${transactionId}.bak`;
                    fs.copyFileSync(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.qjimport-${transactionId}-${index}.tmp`;
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
        const fs = QJ.DD.FS.fs;
        const path = QJ.DD.FS.path;
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
                    cancellation.code = 'QJ_IMPORT_CANCELLED';
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
                    backup = `${operation.destination}.qjimport-${transactionId}.bak`;
                    await fsp.copyFile(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.qjimport-${transactionId}-${index}.tmp`;
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
                    cancellation.code = 'QJ_IMPORT_CANCELLED';
                    throw cancellation;
                }
            }

            for (const record of completed) {
                if (record.backup) await removeIfPresent(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.cancelled = Boolean(error && error.code === 'QJ_IMPORT_CANCELLED');
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
// SECTION 25: QJ.DD.WORKSPACE (GLASSMORPHIC WORKSPACE UI & TOOLS)
//==========================================================
QJ.DD.Workspace = {
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
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25 },
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

    open() {
        if (!editorMode || !QJ.DD.Compat.isTest() || !QJ.DD.Compat.isNwjs() || this.mounted) return;
        QJ.DD.Persistence.captureSession();
        QJ.DD.AssetIndex.init();
        this.buildDom();
        this.attachCanvasListeners();
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = true;
        }
        this.startAssetScan();

        // Check for recovery file
        const recovery = QJ.DD.FS.readJson('data/QJAssetWorkspaceRecovery.json');
        if (recovery && recovery.timestamp && (Date.now() - recovery.timestamp) < 86400000) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            if (confirm(`Unfinished session from ${dateStr} found. Would you like to recover it?`)) {
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
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        this.detachCanvasListeners();
        this.removeGhost();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = false;
        }
        this.placementTool = null;
        QJ.DD.Audio.stopPreview();
    },

    async startAssetScan() {
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        const token = { cancelled: false };
        this._assetScanToken = token;
        const status = document.getElementById('qj-status-right');
        const result = await QJ.DD.AssetIndex.scanAsync({
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
            if (status) status.textContent = `Indexed ${result.discovered} assets | ${result.removed} stale removed`;
            if (result.errors.length > 0) this.showToast(`Asset scan completed with ${result.errors.length} warning(s).`);
        }
        return result;
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'qj-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #qj-asset-workspace-root * { box-sizing: border-box; }
            .qj-glass {
                background: rgba(17, 24, 39, 0.92);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65);
                pointer-events: auto;
            }
            .qj-btn {
                background: #1f2937; color: #f1f5f9; border: 1px solid #374151;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .qj-btn:hover { background: #374151; border-color: #60a5fa; }
            .qj-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .qj-btn-primary:hover { background: #1d4ed8; }
            .qj-btn-active { background: #059669 !important; border-color: #10b981 !important; color: #fff !important; }
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
        `;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'qj-glass';
        toolbar.style.cssText = `
            position: absolute; top: 10px; left: 10px; right: 10px; height: 50px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
        `;
        toolbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">QJ WORKSPACE</span>
                <input type="text" id="qj-search-input" placeholder="Search (e.g. tree tag:prop -dead)"
                    style="width: 200px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="qj-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;"></select>
                <button class="qj-btn" id="qj-save-layout-btn" title="Save current panel sizes as custom layout">+ Layout</button>
                <button class="qj-btn" id="qj-del-layout-btn" title="Delete current custom layout" style="display: none; background: #7f1d1d; border-color: #991b1b; padding: 4px 8px;">✕</button>
                <button class="qj-btn" id="qj-undo-btn">Undo</button>
                <button class="qj-btn" id="qj-redo-btn">Redo</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="qj-btn" id="qj-eyedropper-btn" title="Eyedropper: Alt+Click map object">Eyedropper</button>
                <button class="qj-btn" id="qj-stamp-btn" title="Stamp: Click repeatedly to place">Stamp</button>
                <button class="qj-btn" id="qj-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <div id="qj-brush-popover" class="qj-glass" style="display: none; position: absolute; top: 58px; right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BRUSH SETTINGS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Radius:</span><span id="qj-brush-rad-val">80px</span>
                            </div>
                            <input type="range" id="qj-brush-rad" min="20" max="250" value="80" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Density:</span><span id="qj-brush-den-val">3</span>
                            </div>
                            <input type="range" id="qj-brush-den" min="1" max="10" value="3" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Scale Variation:</span><span id="qj-brush-scale-val">15%</span>
                            </div>
                            <input type="range" id="qj-brush-scale" min="0" max="50" value="15" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Rotation Variation:</span><span id="qj-brush-rot-val">25°</span>
                            </div>
                            <input type="range" id="qj-brush-rot" min="0" max="180" value="25" style="width: 100%;" />
                        </div>
                    </div>
                </div>
                <button class="qj-btn" id="qj-slicer-btn" title="Open Interactive Sprite Sheet Slicer">Slicer Modal</button>
                <button class="qj-btn" id="qj-stop-audio-btn" style="display: none; background: #be123c; border-color: #f43f5e;">⏹ Stop Audio</button>
                <button class="qj-btn" id="qj-diag-btn" title="Diagnostics">Diagnostics</button>
                <button class="qj-btn qj-btn-primary" id="qj-save-btn">Save Changes</button>
                <button class="qj-btn" id="qj-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'qj-glass';
        drawer.id = 'qj-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 70px; left: 10px; bottom: 32px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div id="qj-drawer-resizer" style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Drawer"></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px; overflow-x: auto;" id="qj-category-tabs">
                <button class="qj-btn qj-btn-primary" data-cat="All">All</button>
                <button class="qj-btn" data-cat="Characters">Characters</button>
                <button class="qj-btn" data-cat="Doodads">Doodads</button>
                <button class="qj-btn" data-cat="Tilesets">Tiles</button>
                <button class="qj-btn" data-cat="Pictures">Pictures</button>
                <button class="qj-btn" data-cat="Audio">Audio</button>
                <button class="qj-btn" data-cat="Favorites" title="Show Favorited Assets">★ Favs</button>
                <button class="qj-btn" data-cat="Recent" title="Show Recently Used Assets">🕒 Recent</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="qj-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="qj-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="qj-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; position: relative;">
                <div id="qj-cards-sizer" style="width: 100%; position: relative;">
                    <div id="qj-cards-viewport" style="position: absolute; top: 0; left: 0; right: 0; display: grid; gap: 8px;">
                    </div>
                </div>
            </div>
        `;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'qj-glass';
        inspector.id = 'qj-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 70px; right: 10px; bottom: 32px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        `;
        inspector.innerHTML = `
            <div id="qj-inspector-resizer" style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Inspector"></div>
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="qj-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or click a placed doodad/event on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'qj-glass';
        statusBar.style.cssText = `
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 24px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        `;
        statusBar.innerHTML = `
            <span id="qj-status-left">QJ Doodads Asset Workspace v${pluginVersion} Ready | Hold Alt for free placement</span>
            <span id="qj-status-right">Map ID: ${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        `;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.refreshDrawerCards();
    },

    refreshLayoutSelector() {
        const layoutSel = document.getElementById('qj-layout-select');
        if (!layoutSel) return;
        const names = QJ.DD.Layout.getAllNames();
        layoutSel.innerHTML = '';
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `Layout: ${name}`;
            if (name === QJ.DD.Layout.current) opt.selected = true;
            layoutSel.appendChild(opt);
        }
        const delBtn = document.getElementById('qj-del-layout-btn');
        if (delBtn) {
            const isCustom = !QJ.DD.Layout.presets[QJ.DD.Layout.current];
            delBtn.style.display = isCustom ? 'inline-block' : 'none';
        }
    },

    bindEvents() {
        document.getElementById('qj-close-btn').onclick = () => this.close();
        document.getElementById('qj-save-btn').onclick = () => QJ.DD.Persistence.saveAll();
        document.getElementById('qj-undo-btn').onclick = () => QJ.DD.Undo.undo();
        document.getElementById('qj-redo-btn').onclick = () => QJ.DD.Undo.redo();

        this.refreshLayoutSelector();
        const layoutSel = document.getElementById('qj-layout-select');
        if (layoutSel) {
            layoutSel.onchange = (e) => {
                QJ.DD.Layout.apply(e.target.value);
            };
        }

        const saveLayoutBtn = document.getElementById('qj-save-layout-btn');
        if (saveLayoutBtn) {
            saveLayoutBtn.onclick = () => {
                const name = prompt("Enter a name for this custom layout:", "Custom Layout " + (Object.keys(QJ.DD.Layout.custom).length + 1));
                if (name && name.trim()) {
                    QJ.DD.Layout.saveCurrentAs(name.trim());
                    this.refreshLayoutSelector();
                    this.showToast(`Saved layout "${name.trim()}"!`);
                }
            };
        }

        const delLayoutBtn = document.getElementById('qj-del-layout-btn');
        if (delLayoutBtn) {
            delLayoutBtn.onclick = () => {
                const cur = QJ.DD.Layout.current;
                if (confirm(`Delete custom layout "${cur}"?`)) {
                    QJ.DD.Layout.deleteCustomLayout(cur);
                    this.refreshLayoutSelector();
                    this.showToast(`Deleted layout "${cur}".`);
                }
            };
        }

        // Draggable Drawer Resizer
        const drawerResizer = document.getElementById('qj-drawer-resizer');
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
        const inspectorResizer = document.getElementById('qj-inspector-resizer');
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

        const searchInput = document.getElementById('qj-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
        };

        const container = document.getElementById('qj-cards-container');
        if (container) {
            container.onscroll = () => this.updateVirtualGrid();
        }

        const zoomSlider = document.getElementById('qj-thumb-zoom');
        zoomSlider.oninput = (e) => {
            this.thumbSize = Number(e.target.value);
            this.updateVirtualGrid(true);
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
            if (this.selectedAsset) QJ.DD.Slicing.Editor.open(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
        };

        document.getElementById('qj-diag-btn').onclick = () => this.openDiagnosticsModal();

        document.getElementById('qj-stop-audio-btn').onclick = () => {
            QJ.DD.Audio.stopPreview();
            document.getElementById('qj-stop-audio-btn').style.display = 'none';
        };

        const eyeBtn = document.getElementById('qj-eyedropper-btn');
        eyeBtn.onclick = () => {
            this.placementTool = this.placementTool === 'eyedropper' ? null : 'eyedropper';
            eyeBtn.classList.toggle('qj-btn-active', this.placementTool === 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper Active: Click any object on map" : "Eyedropper Deactivated");
        };

        const stampBtn = document.getElementById('qj-stamp-btn');
        stampBtn.onclick = () => {
            this.placementTool = this.placementTool === 'stamp' ? null : 'stamp';
            stampBtn.classList.toggle('qj-btn-active', this.placementTool === 'stamp');
            this.showToast(this.placementTool ? "Stamp Active: Click map to place repeatedly" : "Stamp Deactivated");
        };

        const brushBtn = document.getElementById('qj-brush-btn');
        const brushPopover = document.getElementById('qj-brush-popover');
        brushBtn.onclick = () => {
            this.placementTool = this.placementTool === 'brush' ? null : 'brush';
            const active = this.placementTool === 'brush';
            brushBtn.classList.toggle('qj-btn-active', active);
            if (brushPopover) brushPopover.style.display = active ? 'block' : 'none';
            this.showToast(active ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
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
        setupBrushSlider('qj-brush-rad', 'radius', 'qj-brush-rad-val', 'px');
        setupBrushSlider('qj-brush-den', 'density', 'qj-brush-den-val', '');
        setupBrushSlider('qj-brush-scale', 'scaleJitter', 'qj-brush-scale-val', '%', 0.01);
        setupBrushSlider('qj-brush-rot', 'rotateJitter', 'qj-brush-rot-val', '°');
    },

    refreshDrawerCards() {
        let filtered = QJ.DD.AssetIndex.list;
        if (this.currentCategory === 'Favorites') {
            filtered = filtered.filter(a => a.favorite);
        } else if (this.currentCategory === 'Recent') {
            filtered = filtered.filter(a => a.usage && a.usage.lastUsedAt > 0)
                               .sort((a, b) => (b.usage.lastUsedAt || 0) - (a.usage.lastUsedAt || 0));
        } else if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = QJ.DD.Search.filter(filtered, this.searchQuery);
        this.filteredAssets = filtered;

        const countEl = document.getElementById('qj-asset-count');
        if (countEl) countEl.textContent = `Assets: ${filtered.length}`;

        const container = document.getElementById('qj-cards-container');
        if (container) container.scrollTop = 0;

        this.updateVirtualGrid(true);
    },

    updateVirtualGrid(forceRecalculate = false) {
        const container = document.getElementById('qj-cards-container');
        const sizer = document.getElementById('qj-cards-sizer');
        const viewport = document.getElementById('qj-cards-viewport');
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
        card.className = 'qj-card' + (this.selectedAsset === asset ? ' selected' : '');
        card.style.cssText = `height: ${cardHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;`;

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width: 85%; max-height: 70%; object-fit: contain; image-rendering: pixelated;';
        QJ.DD.Thumbnail.get(asset, this.thumbSize || 96, (dataUrl) => {
            imgEl.src = dataUrl;
        });
        card.appendChild(imgEl);

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 3px;';
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
            const container = document.getElementById('qj-cards-container');
            if (container) container.querySelectorAll('.qj-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (asset.category === 'Audio') {
                QJ.DD.Audio.playPreview(asset);
                const stopBtn = document.getElementById('qj-stop-audio-btn');
                if (stopBtn) stopBtn.style.display = 'block';
            }
        };

        card.ondblclick = () => {
            if (asset.category !== 'Audio') {
                QJ.DD.Slicing.Editor.open(asset);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            this.selectAsset(asset);
            const items = [
                { label: 'Place as Doodad', icon: '📌', onClick: () => this.placeAssetOnMapCenter(asset) },
                {
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: () => {
                        const templateKey = prompt("Enter Template Key (e.g. npc, door, chest, signpost, switch, save_point):", "npc") || "npc";
                        const prev = document.getElementById('qj-event-template');
                        if (prev) prev.value = templateKey;
                        this.commitPlacement(asset, this.clientToMapCoords(e.clientX, e.clientY), 'event');
                    }
                },
                { separator: true },
                {
                    label: asset.favorite ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: '★',
                    onClick: () => {
                        QJ.DD.AssetIndex.toggleFavorite(asset.id);
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
                            QJ.DD.AssetIndex.addAssetToCollection(asset.id, colName.trim());
                            this.showToast(`Added ${asset.fileName} to "${colName.trim()}"!`);
                        }
                    }
                },
                { separator: true }
            ];
            if (asset.category !== 'Audio') {
                items.push({ label: 'Open in Slicing Modal', icon: '✂️', onClick: () => QJ.DD.Slicing.Editor.open(asset) });
                items.push({ label: 'Export Slices to PNGs', icon: '💾', onClick: () => QJ.DD.Export.exportSlices(asset) });
            } else {
                items.push({ label: 'Play Audio Preview', icon: '▶️', onClick: () => QJ.DD.Audio.playPreview(asset) });
                items.push({ label: 'Stop Audio', icon: '⏹', onClick: () => QJ.DD.Audio.stopPreview() });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        card.draggable = true;
        card.ondragstart = (e) => {
            this.activeDragPayload = {
                assetId: asset.id,
                path: asset.path,
                fileName: asset.fileName,
                category: asset.category,
                type: asset.type,
                frameW: asset.width || 48,
                frameH: asset.height || 48,
                collision: asset.collision || { preset: "none" },
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
            const groupMembers = (QJ.DD.doodads() || []).filter(d => d.groupId === doodad.groupId);
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
        const content = document.getElementById('qj-inspector-content');
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
                        <input type="number" id="qj-ev-x" value="${ge ? ge.x : (ev ? ev.x : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile Y:</label>
                        <input type="number" id="qj-ev-y" value="${ge ? ge.y : (ev ? ev.y : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Trigger:</label>
                    <select id="qj-ev-trigger" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${triggerNames.map((t, idx) => `<option value="${idx}" ${(page0.trigger === idx) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Priority:</label>
                    <select id="qj-ev-priority" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${priorityNames.map((p, idx) => `<option value="${idx}" ${(page0.priorityType === idx) ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="qj-btn qj-btn-primary" id="qj-ev-save-template-btn">💾 Save as Event Template</button>
                    <button class="qj-btn" id="qj-ev-dup-btn">Duplicate Event</button>
                    <button class="qj-btn" id="qj-ev-del-btn" style="background: #991b1b;">Delete Event</button>
                </div>
            `;

            document.getElementById('qj-ev-save-template-btn').onclick = () => {
                const name = prompt("Enter a name for this new Event Template:", ev.name || ("Template_" + evId));
                if (name && name.trim()) {
                    const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                    QJ.DD.EventTemplates.saveCustomTemplate(name.trim(), ev, cat.trim());
                    this.showToast(`Saved template "${name.trim()}"!`);
                }
            };
            document.getElementById('qj-ev-del-btn').onclick = () => {
                this.deleteSelectedEvent();
            };
            document.getElementById('qj-ev-dup-btn').onclick = () => {
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
                        <button class="qj-btn" id="qj-align-left" title="Align Left">Left</button>
                        <button class="qj-btn" id="qj-align-center-x" title="Align Center X">Center X</button>
                        <button class="qj-btn" id="qj-align-right" title="Align Right">Right</button>
                        <button class="qj-btn" id="qj-align-top" title="Align Top">Top</button>
                        <button class="qj-btn" id="qj-align-center-y" title="Align Center Y">Center Y</button>
                        <button class="qj-btn" id="qj-align-bottom" title="Align Bottom">Bottom</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">DISTRIBUTE</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="qj-btn" id="qj-dist-h" title="Distribute Horizontally">Horizontal</button>
                        <button class="qj-btn" id="qj-dist-v" title="Distribute Vertically">Vertical</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="qj-btn" id="qj-multi-z-fwd" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="qj-btn" id="qj-multi-z-back" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="qj-btn" id="qj-multi-z-front" title="Bring to Front">To Front</button>
                        <button class="qj-btn" id="qj-multi-z-bottom" title="Send to Back">To Back</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">ORGANIZATION</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="qj-btn" id="qj-grp-btn">${hasGroup ? 'Ungroup' : 'Group'}</button>
                        <button class="qj-btn" id="qj-lock-btn">${lockedCount === items.length ? 'Unlock All' : 'Lock All'}</button>
                        <button class="qj-btn" id="qj-hide-btn">${hiddenCount === items.length ? 'Show All' : 'Hide All'}</button>
                        <button class="qj-btn" id="qj-dup-all-btn">Duplicate</button>
                    </div>
                </div>

                <div style="margin-top: 12px;">
                    <button class="qj-btn" id="qj-del-all-btn" style="width: 100%; background: #991b1b;">Delete Selection (${items.length})</button>
                </div>
            `;

            document.getElementById('qj-align-left').onclick = () => this.alignSelected('left');
            document.getElementById('qj-align-center-x').onclick = () => this.alignSelected('centerX');
            document.getElementById('qj-align-right').onclick = () => this.alignSelected('right');
            document.getElementById('qj-align-top').onclick = () => this.alignSelected('top');
            document.getElementById('qj-align-center-y').onclick = () => this.alignSelected('centerY');
            document.getElementById('qj-align-bottom').onclick = () => this.alignSelected('bottom');

            document.getElementById('qj-dist-h').onclick = () => this.distributeSelected('horizontal');
            document.getElementById('qj-dist-v').onclick = () => this.distributeSelected('vertical');

            document.getElementById('qj-multi-z-fwd').onclick = () => this.bringForward();
            document.getElementById('qj-multi-z-back').onclick = () => this.sendBackward();
            document.getElementById('qj-multi-z-front').onclick = () => this.bringToFront();
            document.getElementById('qj-multi-z-bottom').onclick = () => this.sendToBack();

            document.getElementById('qj-grp-btn').onclick = () => {
                if (hasGroup) this.ungroupSelected();
                else this.groupSelected();
            };
            document.getElementById('qj-lock-btn').onclick = () => {
                this.lockSelected(lockedCount !== items.length);
            };
            document.getElementById('qj-hide-btn').onclick = () => {
                this.hideSelected(hiddenCount !== items.length);
            };
            document.getElementById('qj-dup-all-btn').onclick = () => this.duplicateSelectedDoodad();
            document.getElementById('qj-del-all-btn').onclick = () => this.deleteSelectedDoodad();
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
                        <button class="qj-btn" id="qj-doodad-lock-toggle" style="padding: 2px 6px; font-size: 11px;">${isLocked ? '🔒 Locked' : '🔓 Lock'}</button>
                        <button class="qj-btn" id="qj-doodad-hide-toggle" style="padding: 2px 6px; font-size: 11px;">${isHidden ? '👁 Hidden' : '👁 Hide'}</button>
                    </div>
                </div>
                <div style="font-size: 11px; margin-bottom: 4px;">Image: <span style="color: #fff;">${escapeHtml(d.bit ? d.bit[1] : 'Unknown')}</span></div>
                ${d.groupId ? `<div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px;">Group: ${escapeHtml(d.groupId)} <button class="qj-btn" id="qj-ungrp-single" style="padding: 1px 4px; font-size: 9px;">Ungroup</button></div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">X:</label>
                        <input type="number" id="qj-prop-x" value="${d.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Y:</label>
                        <input type="number" id="qj-prop-y" value="${d.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Z-Order:</label>
                        <input type="number" id="qj-prop-z" value="${d.z || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Rotation (°):</label>
                        <input type="number" id="qj-prop-rot" value="${d.rotation || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale X:</label>
                        <input type="number" step="0.1" id="qj-prop-sx" value="${d.scaleX || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale Y:</label>
                        <input type="number" step="0.1" id="qj-prop-sy" value="${d.scaleY || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                    <select id="qj-prop-col" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                        <option value="none">None (Passable)</option>
                        <option value="full">Full Bounds</option>
                        <option value="bottomHalf">Bottom Half</option>
                        <option value="bottomThird">Bottom Third</option>
                        <option value="trunk">Tree Trunk</option>
                        <option value="thinWall">Thin Wall</option>
                        <option value="wideWall">Wide Wall</option>
                        <option value="custom">Custom Rectangle</option>
                    </select>
                </div>

                <!-- Custom Collision Box Visual Editor -->
                <div id="qj-custom-col-editor" style="display: ${isCustomCol ? 'block' : 'none'}; margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 8px; border-radius: 4px;">
                    <div style="font-size: 10px; color: #38bdf8; margin-bottom: 4px; font-weight: bold;">CUSTOM COLLISION BOX</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <canvas id="qj-col-preview" width="64" height="64" style="background: #0b1120; border: 1px solid #475569; border-radius: 3px; flex-shrink: 0;"></canvas>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; flex: 1;">
                            <div>
                                <label style="color: #94a3b8;">Rel X:</label>
                                <input type="number" step="0.05" min="0" max="1" id="qj-col-x" value="${shape.x.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel Y:</label>
                                <input type="number" step="0.05" min="0" max="1" id="qj-col-y" value="${shape.y.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel W:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="qj-col-w" value="${shape.w.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel H:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="qj-col-h" value="${shape.h.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 4px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="qj-btn" id="qj-prop-forward" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="qj-btn" id="qj-prop-backward" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="qj-btn" id="qj-prop-to-front" title="Bring to Front">To Front</button>
                        <button class="qj-btn" id="qj-prop-to-back" title="Send to Back">To Back</button>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="qj-btn" id="qj-prop-dup" style="flex: 1;">Duplicate (Ctrl+D)</button>
                    <button class="qj-btn" id="qj-prop-del" style="flex: 1; background: #991b1b;">Delete</button>
                </div>
            `;

            const renderColPreview = () => {
                const cvs = document.getElementById('qj-col-preview');
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

            document.getElementById('qj-prop-col').value = (d.collision && d.collision.preset) ? d.collision.preset : "none";
            document.getElementById('qj-prop-col').onchange = (e) => {
                const val = e.target.value;
                const colEditor = document.getElementById('qj-custom-col-editor');
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
                const cx = Math.max(0, Math.min(1, parseFloat(document.getElementById('qj-col-x').value) || 0));
                const cy = Math.max(0, Math.min(1, parseFloat(document.getElementById('qj-col-y').value) || 0));
                const cw = Math.max(0.05, Math.min(1 - cx, parseFloat(document.getElementById('qj-col-w').value) || 0.5));
                const ch = Math.max(0.05, Math.min(1 - cy, parseFloat(document.getElementById('qj-col-h').value) || 0.5));
                d.collision = { preset: 'custom', shape: { x: cx, y: cy, w: cw, h: ch } };
                renderColPreview();
            };
            ['qj-col-x', 'qj-col-y', 'qj-col-w', 'qj-col-h'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.oninput = updateCustomCol;
            });

            document.getElementById('qj-doodad-lock-toggle').onclick = () => {
                d.locked = !d.locked;
                this.refreshInspector();
            };
            document.getElementById('qj-doodad-hide-toggle').onclick = () => {
                d.editorHidden = !d.editorHidden;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
                this.refreshInspector();
            };
            const ungrpBtn = document.getElementById('qj-ungrp-single');
            if (ungrpBtn) {
                ungrpBtn.onclick = () => {
                    delete d.groupId;
                    this.refreshInspector();
                };
            }

            const applyDoodadInputs = () => {
                if (d.locked) return;
                d.x = parseInt(document.getElementById('qj-prop-x').value, 10) || 0;
                d.y = parseInt(document.getElementById('qj-prop-y').value, 10) || 0;
                d.z = parseInt(document.getElementById('qj-prop-z').value, 10) || 0;
                d.rotation = parseInt(document.getElementById('qj-prop-rot').value, 10) || 0;
                d.scaleX = parseFloat(document.getElementById('qj-prop-sx').value) || 1;
                d.scaleY = parseFloat(document.getElementById('qj-prop-sy').value) || 1;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
            };

            ['qj-prop-x','qj-prop-y','qj-prop-z','qj-prop-rot','qj-prop-sx','qj-prop-sy'].forEach(id => {
                document.getElementById(id).onchange = applyDoodadInputs;
            });

            document.getElementById('qj-prop-forward').onclick = () => this.bringForward([d]);
            document.getElementById('qj-prop-backward').onclick = () => this.sendBackward([d]);
            document.getElementById('qj-prop-to-front').onclick = () => this.bringToFront([d]);
            document.getElementById('qj-prop-to-back').onclick = () => this.sendToBack([d]);
            document.getElementById('qj-prop-dup').onclick = () => {
                this.duplicateSelectedDoodad();
            };
            document.getElementById('qj-prop-del').onclick = () => {
                this.deleteSelectedDoodad();
            };
            return;
        }

        // Case 2: Drawer Asset Selected
        if (!this.selectedAsset) {
            content.innerHTML = "Select an asset in the drawer or click an object on the map.";
            return;
        }

        const a = this.selectedAsset;
        const templates = QJ.DD.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += `<option value="${escapeHtml(key)}">${escapeHtml(templates[key].name)}</option>`;
        }

        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">${escapeHtml(a.category)}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: ${a.width} x ${a.height}</div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="qj-btn" id="qj-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="qj-place-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                    <option value="ask">Ask Each Time</option>
                </select>
            </div>
            <div id="qj-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="qj-event-template" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${templateOptions}
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
                    <option value="wideWall">Wide Wall</option>
                </select>
            </div>
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="qj-btn qj-btn-primary" id="qj-place-now-btn">Place on Map Center</button>
                <button class="qj-btn" id="qj-open-slicer-btn">Open Slicer</button>
            </div>
        `;

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
            QJ.DD.Slicing.Editor.open(a);
        };

        document.getElementById('qj-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
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
        const mode = modeOverride || asset.placement.defaultMode || "doodad";

        if (mode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const templateKey = document.getElementById('qj-event-template') ? document.getElementById('qj-event-template').value : 'npc';
            const template = QJ.DD.EventTemplates.get(templateKey);
            const mapId = $gameMap.mapId();
            $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
            const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);

            const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
                characterName: asset.fileName,
                characterIndex: 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType
            });

            const cmd = {
                apply: () => {
                    $gameMap._stagedMapData.events[newId] = ev;
                    QJ.DD.Persistence.dirtyMap = true;
                },
                revert: () => {
                    delete $gameMap._stagedMapData.events[newId];
                }
            };
            QJ.DD.Undo.execute(cmd);
            this.showToast(`Created ${template.name} Event EV${String(newId).padStart(3, '0')}`);
        } else {
            const d = QJ.DD.standardStruct();
            d.bit = [3, asset.path];
            d.x = coords.x;
            d.y = coords.y;
            d.frameW = asset.width || 48;
            d.frameH = asset.height || 48;
            d.collision = { preset: asset.collision.preset || "none", shape: null };

            const cmd = {
                apply: () => {
                    window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                    window.$dataDoodadsQJ[$gameMap.mapId()].push(d);
                    QJ.DD.Persistence.dirtyDoodads = true;
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        QJ.DD.Undo.execute({
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
        const all = QJ.DD.doodads() || [];
        let maxZ = 0;
        all.forEach(d => { if ((d.z || 0) > maxZ) maxZ = d.z; });
        const targetZ = maxZ + 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        QJ.DD.Undo.execute({
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
        const all = QJ.DD.doodads() || [];
        let minZ = 0;
        all.forEach(d => { if ((d.z || 0) < minZ) minZ = d.z; });
        const targetZ = minZ - 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        QJ.DD.Undo.execute({
            type: 'z_order_bottom',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Sent ${items.length} doodad(s) to back (Z: ${targetZ})`);
    },

    copySelected() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        this._clipboardDoodads = items.map(d => JSON.parse(JSON.stringify(d)));
        this.showToast(`Copied ${items.length} doodad(s) to clipboard`);
    },

    pasteCopied() {
        if (!this._clipboardDoodads || this._clipboardDoodads.length === 0) return;
        const mapId = (window.$gameMap && typeof window.$gameMap.mapId === 'function') ? window.$gameMap.mapId() : 0;
        const list = window.$dataDoodadsQJ[mapId] = window.$dataDoodadsQJ[mapId] || [];
        const duplicates = [];

        for (const orig of this._clipboardDoodads) {
            const dup = JSON.parse(JSON.stringify(orig));
            dup.x += 16;
            dup.y += 16;
            dup.locked = false;
            delete dup.groupId;
            duplicates.push(dup);
        }

        const cmd = {
            type: 'paste_doodads',
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
        QJ.DD.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Pasted ${duplicates.length} doodad(s)`);
    },

    renderPlacementGrid() {
        let gridEl = document.getElementById('qj-map-grid-overlay');
        if (!this.gridSnapShow) {
            if (gridEl && gridEl.parentNode) gridEl.parentNode.removeChild(gridEl);
            return;
        }
        if (!gridEl) {
            gridEl = document.createElement('div');
            gridEl.id = 'qj-map-grid-overlay';
            gridEl.style.cssText = `
                position: fixed; inset: 0; pointer-events: none; z-index: 10001;
                background-size: 48px 48px;
                background-image: linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
            `;
            document.body.appendChild(gridEl);
        }
    },

    toggleGrid() {
        this.gridSnapShow = !this.gridSnapShow;
        this.renderPlacementGrid();
        this.showToast(this.gridSnapShow ? "Grid Overlay Enabled" : "Grid Overlay Disabled");
    },

    toggleInspector() {
        const panel = document.getElementById('qj-inspector-panel');
        if (!panel) return;
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        const resizer = document.getElementById('qj-inspector-resizer');
        if (resizer) resizer.style.display = isHidden ? 'block' : 'none';
        this.showToast(isHidden ? "Inspector Shown" : "Inspector Hidden");
    },

    focusSearch() {
        const inp = document.getElementById('qj-search-input');
        if (inp) {
            inp.focus();
            inp.select();
        }
    },

    refreshSpriteset(sortOnly) {
        if (typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset) {
            if (sortOnly) {
                SceneManager._scene._spriteset.sortDoodadsQJ();
            } else {
                SceneManager._scene._spriteset.addDoodadsQJ();
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
        const list = (window.$dataDoodadsQJ && window.$dataDoodadsQJ[mapId]) ? window.$dataDoodadsQJ[mapId] : [];
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
        QJ.DD.Undo.execute(cmd);
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.refreshInspector();
        this.showToast(`Deleted ${toDelete.length} Doodad(s)`);
    },

    duplicateSelectedDoodad() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0 || !window.$gameMap) return;
        const mapId = typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
        const list = window.$dataDoodadsQJ[mapId] = window.$dataDoodadsQJ[mapId] || [];
        const duplicates = [];

        for (const orig of items) {
            const dup = JSON.parse(JSON.stringify(orig));
            dup.x += 16;
            dup.y += 16;
            dup.locked = false;
            delete dup.groupId;
            duplicates.push(dup);
        }

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
        QJ.DD.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Duplicated ${duplicates.length} Doodad(s)`);
    },

    // Ghost Follower Preview
    showGhost(asset, clientX, clientY, isAlt) {
        if (!this.ghostEl) {
            this.ghostEl = document.createElement('div');
            this.ghostEl.id = 'qj-map-ghost';
            this.ghostEl.style.cssText = `
                position: fixed; pointer-events: none; z-index: 10002;
                opacity: 0.65; transform: translate(-50%, -100%);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            `;
            const img = document.createElement('img');
            img.id = 'qj-ghost-img';
            img.style.cssText = 'image-rendering: pixelated; max-width: 144px; max-height: 144px;';
            this.ghostEl.appendChild(img);
            document.body.appendChild(this.ghostEl);
        }

        const img = document.getElementById('qj-ghost-img');
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

    clientToMapCoords(clientX, clientY) {
        const canvas = QJ.DD.Compat.getCanvas();
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

    attachCanvasListeners() {
        const canvas = QJ.DD.Compat.getCanvas();
        if (!canvas) return;

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
            const list = QJ.DD.doodads() || [];
            let clickedDoodad = null;
            for (let i = list.length - 1; i >= 0; i--) {
                const d = list[i];
                if (!d.editorHidden && Math.hypot(d.x - coords.x, d.y - coords.y) < 40) {
                    clickedDoodad = d;
                    break;
                }
            }

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
                                QJ.DD.EventTemplates.saveCustomTemplate(name.trim(), evObj, cat.trim());
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

            // 2. Stamp Tool
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
            if (!this.placementTool && e.button === 0) {
                this.isMarqueeActive = true;
                this.marqueeStartClient = { x: e.clientX, y: e.clientY };
                this.marqueeStartMap = this.clientToMapCoords(e.clientX, e.clientY);
                this.marqueeShift = e.shiftKey;
                this.hasMarqueeMoved = false;
            }
        };

        this._onCanvasMouseMove = (e) => {
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            } else if (this.isMarqueeActive && this.marqueeStartClient) {
                const dx = e.clientX - this.marqueeStartClient.x;
                const dy = e.clientY - this.marqueeStartClient.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasMarqueeMoved = true;
                    let overlay = document.getElementById('qj-marquee-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'qj-marquee-overlay';
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
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDoodadsQJ();
                        },
                        revert: () => {
                            const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDoodadsQJ();
                        }
                    };
                    QJ.DD.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
            if (this.isMarqueeActive) {
                const overlay = document.getElementById('qj-marquee-overlay');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (this.hasMarqueeMoved && this.marqueeStartMap) {
                    const currentMap = this.clientToMapCoords(e.clientX, e.clientY);
                    const minX = Math.min(this.marqueeStartMap.x, currentMap.x);
                    const maxX = Math.max(this.marqueeStartMap.x, currentMap.x);
                    const minY = Math.min(this.marqueeStartMap.y, currentMap.y);
                    const maxY = Math.max(this.marqueeStartMap.y, currentMap.y);

                    const all = QJ.DD.doodads() || [];
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
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('mousemove', this._onCanvasMouseMove);
            window.addEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    detachCanvasListeners() {
        const canvas = QJ.DD.Compat.getCanvas();
        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
        }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
            if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const list = window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];

        for (let i = 0; i < b.density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * b.radius;
            const px = coords.x + Math.cos(angle) * dist;
            const py = coords.y + Math.sin(angle) * dist;

            const scaleJitter = 1.0 + (Math.random() * 2 - 1) * b.scaleJitter;
            const rotJitter = (Math.random() * 2 - 1) * b.rotateJitter;

            const d = QJ.DD.standardStruct();
            d.bit = [3, asset.path];
            d.x = Math.round(px);
            d.y = Math.round(py);
            d.frameW = asset.width || 48;
            d.frameH = asset.height || 48;
            d.scaleX = parseFloat(scaleJitter.toFixed(2));
            d.scaleY = parseFloat(scaleJitter.toFixed(2));
            d.rotation = Math.round(rotJitter);
            d.collision = { preset: asset.collision.preset || "none", shape: null };

            list.push(d);
            this.currentBrushBatch.push(d);
        }
        if (SceneManager._scene && SceneManager._scene._spriteset) {
            SceneManager._scene._spriteset.addDoodadsQJ();
        }
    },

    handleEyedropper(coords) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
                return;
            }
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = QJ.DD.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
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

    handleDoodadSelection(coords, isMulti) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (d.editorHidden) continue;
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d, isMulti);
                return;
            }
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
        modal.className = 'qj-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 8px;">PLACEMENT DECISION</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px;">Does ${escapeHtml(payload.fileName)} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="qj-btn qj-btn-primary" id="qj-ask-yes">Yes (Create MZ Event)</button>
                <button class="qj-btn" id="qj-ask-no">No (Decorative Doodad)</button>
                <button class="qj-btn" id="qj-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="qj-btn" id="qj-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="qj-btn" id="qj-ask-cancel" style="width: 100%;">Cancel</button>
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

        document.getElementById('qj-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('qj-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('qj-ask-yes-rem').onclick = () => {
            closeM();
            if (QJ.DD.AssetIndex.data.assets[payload.assetId]) {
                QJ.DD.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                QJ.DD.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('qj-ask-no-rem').onclick = () => {
            closeM();
            if (QJ.DD.AssetIndex.data.assets[payload.assetId]) {
                QJ.DD.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                QJ.DD.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('qj-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);
        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
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
        QJ.DD.Persistence.dirtyMap = true;
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
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                if (ge && ge._erased !== undefined) ge._erased = true;
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                if (ge && ge._erased !== undefined) ge._erased = false;
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectEvent(null);
        this.showToast(`Deleted Event EV${String(evId).padStart(3, '0')}`);
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);

        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = (dup.x || 0) + 1;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(`Duplicated to Event EV${String(newId).padStart(3, '0')}`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'qj-context-menu';
        menu.className = 'qj-glass';
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
            row.className = 'qj-btn';
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
        const existing = document.getElementById('qj-context-menu');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
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
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.showToast(`Appended Sound Command to Event EV${String(evId).padStart(3, '0')}`);
    },

    async runAssetImport(sourcePaths, options = {}) {
        const plan = QJ.DD.Import.planBatch(sourcePaths, options);
        const result = await QJ.DD.Import.executeBatchAsync(plan, {
            cancellationToken: options.cancellationToken,
            onProgress: options.onProgress
        });
        if (!result.ok) return result;

        await QJ.DD.AssetIndex.scanAsync({ loadCache: false });
        this.refreshDrawerCards();

        if (options.autoSlice) {
            const path = QJ.DD.FS.path;
            const imported = new Set(result.imported.map(filePath => path.resolve(filePath).toLowerCase()));
            const firstImage = QJ.DD.AssetIndex.list.find(asset =>
                asset.category !== 'Audio' && imported.has(path.resolve(asset.path).toLowerCase())
            );
            if (firstImage && typeof setTimeout === 'function') {
                setTimeout(() => QJ.DD.Slicing.Editor.open(firstImage), 0);
            }
        }
        return result;
    },

    showAssetImportModal(sourcePaths) {
        if (!QJ.DD.FS.fs || !QJ.DD.FS.path) {
            this.showToast('Explorer import requires NW.js filesystem access.');
            return;
        }

        const collected = QJ.DD.Import.collectFiles(sourcePaths);
        const supportedCount = collected.files.filter(filePath => QJ.DD.Import.isSupported(filePath)).length;
        if (supportedCount === 0) {
            this.showToast('No supported image or audio files were found.');
            return;
        }

        const previous = document.getElementById('qj-import-modal');
        if (previous && previous.parentNode) previous.parentNode.removeChild(previous);

        const overlay = document.createElement('div');
        overlay.id = 'qj-import-modal';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 10030; display: flex;
            align-items: center; justify-content: center; background: rgba(2,6,23,0.72);
            pointer-events: auto;
        `;
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
        modal.style.cssText = 'width: 430px; padding: 20px; color: #e2e8f0;';
        const destinationOptions = QJ.DD.Import.destinations
            .map(destination => `<option value="${destination}">${destination}</option>`)
            .join('');
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 6px;">IMPORT PROJECT ASSETS</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px;">
                ${supportedCount} supported file(s) found${collected.files.length !== supportedCount ? `; ${collected.files.length - supportedCount} unsupported skipped` : ''}.
            </div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">Destination</label>
            <select id="qj-import-destination" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="auto">Auto-route by asset type</option>
                ${destinationOptions}
            </select>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">When a filename already exists (apply to all)</label>
            <select id="qj-import-collision" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="rename">Keep both (add numeric suffix)</option>
                <option value="skip">Skip incoming file</option>
                <option value="overwrite">Overwrite existing file</option>
                <option value="error">Cancel batch on collision</option>
            </select>
            <label style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #cbd5e1; margin-bottom: 16px;">
                <input id="qj-import-auto-slice" type="checkbox" /> Open the first imported image in the slicer
            </label>
            <div id="qj-import-warning" style="display: none; color: #fbbf24; font-size: 11px; margin: -6px 0 12px;">
                Overwrite is explicit and transactional; existing files are restored if the batch fails.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="qj-btn" id="qj-import-cancel">Cancel</button>
                <button class="qj-btn qj-btn-primary" id="qj-import-confirm">Import</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
        const destination = document.getElementById('qj-import-destination');
        const collision = document.getElementById('qj-import-collision');
        const autoSlice = document.getElementById('qj-import-auto-slice');
        const warning = document.getElementById('qj-import-warning');
        const confirmButton = document.getElementById('qj-import-confirm');
        const cancelButton = document.getElementById('qj-import-cancel');
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
            if (result.ok) {
                const duplicateText = result.duplicates.length ? `, ${result.duplicates.length} duplicate(s) skipped` : '';
                this.showToast(`Imported ${result.imported.length} file(s)${duplicateText}.`);
            } else if (result.cancelled) {
                this.showToast(`Import cancelled${result.rolledBack ? '; copied files were rolled back' : ''}.`);
            } else {
                const reason = result.errors[0] ? result.errors[0].message : 'Unknown import error';
                this.showToast(`Import failed${result.rolledBack ? ' and was rolled back' : ''}: ${reason}`);
            }
        };
        overlay.onclick = event => { if (event.target === overlay && !activeCancellation) close(); };
    },

    showConflictModal() {
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
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
                <button class="qj-btn" id="qj-conf-force" style="background: #b91c1c;">Force Overwrite With Workspace Changes</button>
                <button class="qj-btn" id="qj-conf-reload">Reload Map from Disk (Discard Workspace Staged)</button>
                <button class="qj-btn" id="qj-conf-cancel">Cancel Save</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('qj-conf-force').onclick = () => {
            closeM();
            QJ.DD.Persistence.saveAll(true);
        };
        document.getElementById('qj-conf-reload').onclick = () => {
            closeM();
            if ($gameMap) $gameMap._stagedMapData = null;
            QJ.DD.Persistence.captureSession();
            this.showToast("External Map Data Reloaded!");
        };
        document.getElementById('qj-conf-cancel').onclick = closeM;
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'qj-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 12px;">SYSTEM DIAGNOSTICS</div>
            <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1;">
                <div>Total Indexed Assets: <strong style="color: #fff;">${QJ.DD.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: #fff;">${Object.keys(QJ.DD.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: #fff;">${QJ.DD.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: #fff;">${QJ.DD.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: #fff;">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="qj-btn qj-btn-primary" id="qj-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="qj-btn" id="qj-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="qj-btn" id="qj-close-diag-btn">Close</button>
            </div>
            <button class="qj-btn" id="qj-restore-backup-btn" style="width: 100%; margin-top: 8px; border-color: #f59e0b; color: #fde68a;">Restore Project Backup…</button>
        `;
        document.body.appendChild(diag);

        document.getElementById('qj-rebuild-idx-btn').onclick = async () => {
            QJ.DD.AssetIndex.data.assets = {};
            await QJ.DD.AssetIndex.scanAsync({ loadCache: false });
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-clear-cache-btn').onclick = () => {
            QJ.DD.Thumbnail.cache = {};
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-restore-backup-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
            this.showBackupRestoreModal();
        };

        document.getElementById('qj-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showBackupRestoreModal() {
        const mapFile = `data/Map${String($gameMap ? $gameMap.mapId() : 0).padStart(3, '0')}.json`;
        const targets = [
            { label: 'Current Map', path: mapFile },
            { label: 'Doodads', path: 'data/' + dataFileName },
            { label: 'Asset Library', path: QJ.DD.AssetIndex.libraryPath }
        ];
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
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
            <select id="qj-restore-target" style="width: 100%; margin: 5px 0 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                ${targets.map(target => `<option value="${target.path}">${target.label} — ${target.path}</option>`).join('')}
            </select>
            <label style="font-size: 11px; color: #94a3b8;">Backup snapshot</label>
            <select id="qj-restore-source" style="width: 100%; margin: 5px 0 16px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;"></select>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="qj-btn" id="qj-restore-cancel">Cancel</button>
                <button class="qj-btn" id="qj-restore-confirm" style="background: #b45309;">Restore Selected Backup</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetSelect = document.getElementById('qj-restore-target');
        const backupSelect = document.getElementById('qj-restore-source');
        const restoreButton = document.getElementById('qj-restore-confirm');
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        const refreshBackups = () => {
            const backups = QJ.DD.FS.listBackups(targetSelect.value);
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
        document.getElementById('qj-restore-cancel').onclick = close;
        restoreButton.onclick = () => {
            if (!backupSelect.value) return;
            const targetPath = targetSelect.value;
            if (!confirm(`Restore ${targetPath} from the selected backup?`)) return;
            const result = QJ.DD.FS.restoreBackup(targetPath, backupSelect.value);
            if (!result.ok) {
                this.showToast(`Restore failed: ${result.error}`);
                return;
            }

            if (targetPath === QJ.DD.AssetIndex.libraryPath) {
                QJ.DD.AssetIndex.init();
                this.refreshDrawerCards();
            } else if (targetPath === 'data/' + dataFileName) {
                window.$dataDoodadsQJ = QJ.DD.FS.readJson(targetPath) || {};
                QJ.DD.migrateData(window.$dataDoodadsQJ, 'doodads');
                this.refreshSpriteset();
            } else if (targetPath === mapFile && window.$gameMap) {
                $gameMap._stagedMapData = QJ.DD.FS.readJson(targetPath);
                QJ.DD.Persistence.captureSession();
            }
            close();
            this.showToast('Backup restored. Reload the current map before continuing edits.');
        };
        refreshBackups();
    },

    showToast(msg) {
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
// SECTION 25: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_initialize = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        $.Scene_Map_initialize.call(this);
    };

    $.Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        $.Scene_Map_updateScene.call(this);
        if (!editorMode || !QJ.DD.Compat.isTest() || !QJ.DD.Compat.isNwjs()) return;

        if (typeof Input !== 'undefined' && Input.isTriggered(editKey)) {
            QJ.DD.Workspace.toggle();
        }
    };
}

// Windows Explorer native drag and drop import listener with transactional options modal
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('dragover', (e) => {
        if (!editorMode || !QJ.DD.Compat.isTest() || !QJ.DD.Compat.isNwjs()) return;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (!editorMode || !QJ.DD.Compat.isTest() || !QJ.DD.Compat.isNwjs()) return;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const sourcePaths = [];
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    if (f.path) sourcePaths.push(f.path);
                }
                if (sourcePaths.length > 0) QJ.DD.Workspace.showAssetImportModal(sourcePaths);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!editorMode || !QJ.DD.Compat.isTest() || !QJ.DD.Compat.isNwjs()) return;
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
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            QJ.DD.Workspace.duplicateSelectedDoodad();
        } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            QJ.DD.Workspace.copySelected();
        } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            QJ.DD.Workspace.pasteCopied();
        } else if (e.key === 'Delete') {
            if (QJ.DD.Workspace.selectedEvent) {
                QJ.DD.Workspace.deleteSelectedEvent();
            } else {
                QJ.DD.Workspace.deleteSelectedDoodad();
            }
        } else if (e.key === 'g' || e.key === 'G') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            QJ.DD.Workspace.toggleGrid();
        } else if (e.key === 'h' || e.key === 'H') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            QJ.DD.Workspace.toggleInspector();
        } else if (e.key === 'f' || e.key === 'F') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            QJ.DD.Workspace.focusSearch();
        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (QJ.DD.Workspace.selectedDoodads && QJ.DD.Workspace.selectedDoodads.length > 0 ? QJ.DD.Workspace.selectedDoodads : (QJ.DD.Workspace.selectedDoodad ? [QJ.DD.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
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
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
                QJ.DD.Workspace.refreshInspector();
            } else if (QJ.DD.Workspace.selectedEvent) {
                e.preventDefault();
                const evInfo = QJ.DD.Workspace.selectedEvent;
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
                    QJ.DD.Undo.execute({
                        type: 'move_event',
                        apply: () => { ev.x = nx; ev.y = ny; if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; } },
                        revert: () => { ev.x = oldX; ev.y = oldY; if (ge) { ge._x = oldX; ge._y = oldY; ge._realX = oldX; ge._realY = oldY; } }
                    });
                    QJ.DD.Workspace.refreshInspector();
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            QJ.DD.Workspace.placementTool = null;
            QJ.DD.Workspace.removeGhost();
            QJ.DD.Workspace.selectDoodad(null);
            const stampBtn = document.getElementById('qj-stamp-btn');
            const brushBtn = document.getElementById('qj-brush-btn');
            const eyeBtn = document.getElementById('qj-eyedropper-btn');
            if (stampBtn) stampBtn.classList.remove('qj-btn-active');
            if (brushBtn) brushBtn.classList.remove('qj-btn-active');
            if (eyeBtn) eyeBtn.classList.remove('qj-btn-active');
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    const recoveryTimer = setInterval(() => {
        if (editorMode && QJ.DD.Compat.isTest() && window.$gameMap && (QJ.DD.Persistence.dirtyMap || QJ.DD.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: QJ.DD.doodads(),
                stagedMap: $gameMap._stagedMapData
            };
            QJ.DD.FS.atomicWriteJson('data/QJAssetWorkspaceRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
    if (recoveryTimer && typeof recoveryTimer.unref === 'function') {
        recoveryTimer.unref();
    }
}

})(QJ.DD.reWrite);
