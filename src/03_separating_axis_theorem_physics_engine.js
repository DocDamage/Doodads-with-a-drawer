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


