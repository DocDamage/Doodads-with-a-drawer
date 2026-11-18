// @editor-only
//==========================================================
// SECTION 5R: THE ROBOT TESTER (8.4.7)
//==========================================================
// Without playing: follow transfers from the starting map. Each map is flooded from where the player arrives
// (MapCheck.reach on MZ's passage rules, painted walls and standing events); every transfer event the player can
// get to is followed. Findings: maps nobody can reach, transfers that land outside a map, on a missing map or on
// a tile nobody can stand on, maps with no way out (dead ends) and one-way trips (no way back to where they came
// from). Transfers by variables cannot be followed and are listed. Pure: maps are passed in as data.
DocsDoodads.Robot = {
    dirs: { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] },

    // MZ's checkPassage over the map's tile layers (and tile events): 0x10 is "no effect", a clear bit passes.
    checkPassage(map, flags, x, y, bit, tileEvents) {
        const w = map.width, h = map.height, ids = [];
        for (const id of (tileEvents && tileEvents[x + ',' + y]) || []) ids.push(id);
        for (let z = 3; z >= 0; z--) ids.push(Number(map.data[(z * h + y) * w + x]) || 0);
        for (const id of ids) {
            if (!id) continue;
            const f = flags[id] || 0;
            if ((f & 0x10) !== 0) continue;
            if ((f & bit) === 0) return true;
            if ((f & bit) === bit) return false;
        }
        return false;
    },

    // A walker for a map: { width, height, loopX, loopY, canStep(x, y, dir), standable(x, y) }.
    walker(map, flags, options = {}) {
        const w = map.width, h = map.height, loopX = map.scrollType === 2 || map.scrollType === 3, loopY = map.scrollType === 1 || map.scrollType === 3;
        const blockers = new Set(), tileEvents = {};
        for (const ev of map.events || []) {
            const page = ev && ev.pages && ev.pages[0];
            if (!ev || !page) continue;
            const image = page.image || {};
            if (image.tileId > 0 && page.priorityType === 0) (tileEvents[ev.x + ',' + ev.y] = tileEvents[ev.x + ',' + ev.y] || []).push(image.tileId);
            if (page.priorityType === 1 && !page.through) blockers.add(ev.x + ',' + ev.y);
        }
        const walls = options.walls || (() => false);
        const wrap = (x, y) => [loopX ? (x + w) % w : x, loopY ? (y + h) % h : y];
        const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
        const bit = d => (1 << (d / 2 - 1)) & 0x0f;
        const pass = (x, y, d) => this.checkPassage(map, flags, x, y, bit(d), tileEvents);
        const canStep = (x, y, d) => {
            const [nx, ny] = wrap(x + this.dirs[d][0], y + this.dirs[d][1]);
            if (!inside(nx, ny) || !pass(x, y, d) || !pass(nx, ny, 10 - d)) return false;
            return !blockers.has(nx + ',' + ny) && !walls(nx, ny) && !(walls.step && walls.step(x, y, d));
        };
        const standable = (x, y) => inside(x, y) && !walls(x, y) && [2, 4, 6, 8].some(d => pass(x, y, d));
        return { width: w, height: h, loopX, loopY, canStep, standable };
    },

    // Transfer Player commands (code 201) on any page of an event: { mapId, x, y } or { variables: true }.
    transfersOf(ev) {
        const out = [];
        for (const page of (ev && ev.pages) || []) for (const cmd of (page && page.list) || []) {
            if (!cmd || cmd.code !== 201 || !cmd.parameters) continue;
            const p = cmd.parameters;
            out.push(p[0] === 0 ? { mapId: Number(p[1]), x: Number(p[2]), y: Number(p[3]) } : { variables: true });
        }
        return out;
    },

    // project: { start: { mapId, x, y }, maps: { [id]: map data }, names: { [id]: name }, flags(mapId), walls(mapId) }.
    explore(project) {
        const findings = [], edges = [], reached = new Map(), seen = new Set();
        const names = project.names || {}, label = id => `Map ${String(id).padStart(3, '0')}${names[id] ? ` "${names[id]}"` : ''}`;
        const queue = [{ mapId: Number(project.start.mapId), x: Number(project.start.x), y: Number(project.start.y), from: null }];
        const walkers = new Map();
        const walkerOf = id => {
            if (!walkers.has(id)) {
                const map = project.maps[id];
                walkers.set(id, map ? this.walker(map, project.flags ? project.flags(id) : [], { walls: project.walls ? project.walls(id) : null }) : null);
            }
            return walkers.get(id);
        };
        while (queue.length) {
            const at = queue.shift(), key = `${at.mapId}:${at.x},${at.y}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const map = project.maps[at.mapId], walk = walkerOf(at.mapId);
            if (!map || !walk) { findings.push({ kind: 'missingMap', mapId: at.from ? at.from.mapId : at.mapId, x: at.from ? at.from.x : at.x, y: at.from ? at.from.y : at.y, text: `A transfer goes to ${label(at.mapId)}, which does not exist.` }); continue; }
            if (at.x < 0 || at.y < 0 || at.x >= map.width || at.y >= map.height) {
                findings.push({ kind: 'outsideMap', mapId: at.from.mapId, x: at.from.x, y: at.from.y, text: `A transfer lands outside ${label(at.mapId)} (${at.x}, ${at.y}).` });
                continue;
            }
            if (!walk.standable(at.x, at.y)) {
                findings.push({ kind: 'blockedLanding', mapId: at.from ? at.from.mapId : at.mapId, x: at.from ? at.from.x : at.x, y: at.from ? at.from.y : at.y,
                    text: `${at.from ? 'A transfer lands' : 'The game starts'} on a tile nobody can stand on: ${label(at.mapId)} (${at.x}, ${at.y}).` });
                continue;
            }
            const flood = DocsDoodads.MapCheck.reach({ x: at.x, y: at.y }, walk);
            const sofar = reached.get(at.mapId) || new Uint8Array(map.width * map.height);
            flood.seen.forEach((v, i) => { if (v) sofar[i] = 1; });
            reached.set(at.mapId, sofar);
            for (const ev of map.events || []) {
                if (!ev) continue;
                const near = DocsDoodads.MapCheck.nearReached(flood.seen, map.width, map.height, ev.x, ev.y, { x: walk.loopX, y: walk.loopY });
                if (!near) continue;
                for (const t of this.transfersOf(ev)) {
                    if (t.variables) { findings.push({ kind: 'variableTransfer', mapId: at.mapId, x: ev.x, y: ev.y, text: `EV${String(ev.id).padStart(3, '0')} on ${label(at.mapId)} transfers by variables; the robot cannot follow it.` }); continue; }
                    edges.push({ from: at.mapId, to: t.mapId, x: ev.x, y: ev.y, eventId: ev.id });
                    queue.push({ mapId: t.mapId, x: t.x, y: t.y, from: { mapId: at.mapId, x: ev.x, y: ev.y } });
                }
            }
        }
        // Maps no one gets to.
        for (const id of Object.keys(project.maps).map(Number)) {
            if (!reached.has(id)) findings.push({ kind: 'unreachedMap', mapId: id, x: 0, y: 0, text: `${label(id)} cannot be reached from the start by walking and transfers.`, global: true });
        }
        // Dead ends (no way out) and one-way trips (no way back).
        const out = id => edges.filter(e => e.from === id && e.to !== id);
        const canReturn = (from, to) => {
            const seenMaps = new Set([from]), stack = [from];
            while (stack.length) {
                const id = stack.pop();
                if (id === to) return true;
                for (const e of out(id)) if (!seenMaps.has(e.to)) { seenMaps.add(e.to); stack.push(e.to); }
            }
            return false;
        };
        const start = Number(project.start.mapId), deadEnds = new Set();
        for (const id of reached.keys()) {
            if (id !== start && !out(id).length) { deadEnds.add(id); findings.push({ kind: 'deadEnd', mapId: id, x: 0, y: 0, text: `${label(id)} has no way out once the player is there.`, global: true }); }
        }
        const reported = new Set();
        for (const e of edges) {
            if (e.from === e.to || deadEnds.has(e.to) || reported.has(e.from + '>' + e.to)) continue;
            if (!canReturn(e.to, e.from)) {
                reported.add(e.from + '>' + e.to);
                findings.push({ kind: 'oneWay', mapId: e.from, x: e.x, y: e.y, text: `The transfer at (${e.x}, ${e.y}) on ${label(e.from)} to ${label(e.to)} has no way back.` });
            }
        }
        return { findings, edges, reached: Array.from(reached.keys()).sort((a, b) => a - b) };
    },

    // Playing (in a playtest): steps an interpreter until it finishes, with a frame limit. step() runs one frame
    // and returns true while the event is still running. Returns { done, frames, error }.
    drive(step, limit = 1800) {
        for (let frame = 0; frame < limit; frame++) {
            try {
                if (!step(frame)) return { done: true, frames: frame + 1, error: null };
            } catch (error) {
                return { done: false, frames: frame + 1, error: error && error.message ? error.message : String(error) };
            }
        }
        return { done: false, frames: limit, error: null };
    }
};
