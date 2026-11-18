'use strict';
// 8.5.5 A real place: a river and a road crossing give a bridge; a lake is filled; a slope gives rising heights; an
// empty area gives an empty plan; .osm and GeoJSON are read from files kept here; the area's real size; Apply writes
// the OpenStreetMap credit once; nothing is ever fetched.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const E = require('./engine/fake_engine');

process.chdir(fs.mkdtempSync(path.join(os.tmpdir(), 'dd-geo-')));
E.install();
E.setupWorld({ width: 40, height: 30, px: 1, py: 1 });
let fetched = 0;
global.fetch = () => { fetched++; throw new Error('no network'); };
global.XMLHttpRequest = class { open() { fetched++; } send() {} };
require('../Docs-Doodads.js');
const D = DocsDoodads, M = D.MapFrom;
const town = M.kind('town'), overworld = M.kind('overworld');

// ---- Pure ----
const osm = M.readOsm(fs.readFileSync(path.join(__dirname, 'fixtures/geo/village.osm'), 'utf8'));
assert.deepStrictEqual(osm.map(f => f.type + ':' + f.kind).sort(), ['building:shape', 'place:point', 'river:line', 'road:line'].sort());
const box = M.geoBox(osm);
const plan = M.fromGeo(osm, null, box, town, { w: 40, h: 30 });
assert.ok(plan.features.some(f => f.type === 'bridge'), 'a river and a road crossing give a bridge');
assert.ok(plan.cells.includes('road') && plan.cells.includes('water') && plan.cells.includes('building'));
const lake = { type: 'FeatureCollection', features: [
    { type: 'Feature', properties: { natural: 'water' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
    { type: 'Feature', properties: { amenity: 'bench' }, geometry: { type: 'Point', coordinates: [0.5, 0.5] } }] };
const lf = M.readGeoJson(JSON.stringify(lake));
assert.strictEqual(lf.length, 1, 'untyped features are left out');
const lp = M.fromGeo(lf, null, { west: -0.5, south: -0.5, east: 1.5, north: 1.5 }, overworld, { w: 20, h: 20 });
const water = lp.cells.filter(c => c === 'water').length;
assert.ok(water > 80 && water < 120, `a lake is filled (${water} tiles of about 100)`);
assert.strictEqual(lp.cells[0], null, 'outside the lake is left alone');
const slope = { w: 4, h: 1, values: [0, 0.25, 0.5, 1] };
const hp = M.fromGeo(lf, slope, { west: -0.5, south: -0.5, east: 1.5, north: 1.5 }, overworld, { w: 8, h: 2 });
assert.deepStrictEqual(hp.heights.slice(0, 8), [0, 0, 2, 2, 4, 4, 8, 8], 'a slope gives rising heights');
const empty = M.fromGeo([], null, null, town, { w: 5, h: 5 });
assert.ok(empty.cells.every(c => c === null) && !empty.features.length, 'an empty area gives an empty plan');
const metres = M.geoMetres({ west: 0, east: 0.01, south: 51, north: 51.01 });
assert.ok(metres.h > 1100 && metres.h < 1120 && metres.w > 690 && metres.w < 710, 'the area\'s real size');
assert.ok(M.readGeoJson({ type: 'FeatureCollection', features: [{ properties: { highway: 'motorway' }, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }] })[0].type === 'roadWide');
assert.strictEqual(M.geoType({ waterway: 'stream' }), 'stream');

// ---- The card's steps ----
const W = D.Workspace;
W.mounted = true; W.showToast = () => {};
let applied = null;
W.applyMapFrom = (p, k) => { applied = { p, k }; };
const state = { kindId: 'town', features: W.readMapFileText('village.osm', fs.readFileSync(path.join(__dirname, 'fixtures/geo/village.osm'), 'utf8')), heights: null };
const made = W.geoPlan(state);
assert.ok(made && made.size.w === 40 && made.metres.w > 0);
assert.ok(W.applyGeoPlan(state));
assert.ok(applied && applied.k.id === 'town');
assert.ok(/OpenStreetMap contributors/.test(fs.readFileSync('CREDITS_MAPS.txt', 'utf8')), 'the credit is written');
W.applyGeoPlan(state);
assert.strictEqual(fs.readFileSync('CREDITS_MAPS.txt', 'utf8').match(/OpenStreetMap contributors/g).length, 1, 'once');
assert.strictEqual(fetched, 0, 'nothing is ever fetched');
console.log('test_map_from_geo: OK');
