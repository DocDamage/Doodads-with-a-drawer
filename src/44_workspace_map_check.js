//==========================================================
// SECTION 25j: WORKSPACE MAP CHECK (PROBLEMS PANEL, REACHABILITY)
//==========================================================
// Problems (More): things that are probably mistakes, on this map or every map, each with Go To and,
// where it is safe, Fix. Check Reach floods the walkable tiles from the player (or a clicked tile) and
// lists the doors, chests and transfers the player can't get to.
DocsDoodads.Ui.css += `
#dd-problems { position: fixed; z-index: 10033; width: 360px; max-width: calc(100vw - 32px); max-height: 70vh; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
#dd-problems .dd-pr-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
#dd-problems .dd-pr-group { font-weight: 900; color: var(--dd-text); font-size: 12px; margin-top: 4px; }
#dd-problems .dd-pr-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 10px; background: var(--dd-panel-2); }
#dd-problems .dd-pr-text { flex: 1; min-width: 0; color: var(--dd-text); font-weight: 700; overflow-wrap: anywhere; }
#dd-problems .dd-btn { padding: 3px 8px; font-size: 11px; }
#dd-problems .dd-pr-tools { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
`;
DocsDoodads.Ui.hints.reach = 'Check Reach: click a tile to see where a player starting there can walk. Esc to stop.';
Object.assign(DocsDoodads.Ui.mapPalettes.standard, { reach: 0x22c55e });
Object.assign(DocsDoodads.Ui.mapPalettes.safe, { reach: 0x009e73 });
DocsDoodads.Ui.mapColorMeanings.push(['reach', 'Check Reach: can walk here']);

Object.assign(DocsDoodads.Workspace, {
    problemGroups: [
        ['missingArt', 'Missing pictures'], ['missingEvent', 'Missing common events'], ['missingSound', 'Missing sounds'], ['badCondition', 'Conditions that don\'t run'], ['offMap', 'Off the map'],
        ['darkLamp', 'Lamps that never show'], ['blockedEvent', 'Events that can\'t be reached or touched'], ['unreachable', 'Out of reach'],
        // Project-wide, from the LPC character library (44_workspace_lpc_library.js).
        ['lpcEncrypt', 'Pictures that can\'t be encrypted'], ['lpcCredits', 'Credits to write out']
    ],

    // ---- Collecting problems ----
    fileExists(path, cache) {
        if (cache && cache.has(path)) return cache.get(path);
        const found = Boolean(DocsDoodads.FS.existsSync && DocsDoodads.FS.existsSync(path));
        if (cache) cache.set(path, found);
        return found;
    },

    soundExists(file, cache) {
        const SS = DocsDoodads.SpatialSound;
        const f = SS.splitFile(file);
        if (!f) return true;
        return ['.ogg', '.m4a'].some(ext => this.fileExists(`audio/${f.folder}/${f.name}${ext}`, cache));
    },

    // Map sizes in tiles: this map from the game, others from their files.
    mapSize(mapId, mapData) {
        if (Number(mapId) === this.currentMapId() && window.$gameMap && $gameMap.width) return { w: $gameMap.width(), h: $gameMap.height() };
        return mapData && mapData.width ? { w: mapData.width, h: mapData.height } : null;
    },

    // The problems with the doodads of one map. mapData: the map's file (for its size), when not this map.
    conditionCompiles(source) {
        try { new Function(`return (${source});`); return true; } catch (error) { return false; }
    },

    doodadProblems(mapId, list, mapData, cache) {
        const out = [];
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const size = this.mapSize(mapId, mapData);
        const settings = DocsDoodads.Lighting.mapSettings(mapId) || {};
        const dark = DocsDoodads.MapCheck.canBeDark(settings, DocsDoodads.World.settings());
        const here = Number(mapId) === this.currentMapId();
        (list || []).forEach((d, i) => {
            if (!d) return;
            const name = d.bit && d.bit[0] === 3 ? String(d.bit[1]).split('/').pop() : `doodad #${i + 1}`;
            const where = { mapId: Number(mapId), doodad: d, x: Math.floor(d.x / tw), y: Math.floor((d.y - 1) / th) };
            if (d.bit && d.bit[0] === 3 && !this.fileExists(d.bit[1], cache)) {
                out.push(Object.assign({ kind: 'missingArt', text: `${name} (map ${mapId}): ${d.bit[1]} is not in the project.` }, where,
                    here ? { fix: { label: 'Replace Art...', run: () => { this.selectDoodads([d]); return this.showReplaceArt(); } } } : {}));
            }
            // A state's own art, which can go missing on its own.
            DocsDoodads.States.list(d).forEach((st, si) => {
                if (si === 0 || !st || !st.path || this.fileExists(st.path, cache)) return;
                out.push(Object.assign({ kind: 'missingArt', text: `${name} (map ${mapId}), state "${st.name || si}": ${st.path} is not in the project.` }, where,
                    { fix: { label: 'Use Own Art', run: () => this.editDoodads([d], x => {
                        const s2 = x.states && x.states.list && x.states.list[si];
                        if (s2) { delete s2.path; delete s2.w; delete s2.h; }
                    }, 'edit_states') } }));
            });
            const touchId = d.touch ? Number(d.touch.commonEventId) || 0 : 0;
            if (touchId > 0 && typeof $dataCommonEvents !== 'undefined' && Array.isArray($dataCommonEvents) && !$dataCommonEvents[touchId]) {
                out.push(Object.assign({ kind: 'missingEvent', text: `${name} (map ${mapId}) runs common event ${touchId} when touched, which doesn't exist.` }, where,
                    { fix: { label: 'Stop Running It', run: () => this.editDoodads([d], x => this.applyDoodadProperty(x, 'touch.commonEventId', 0), 'edit_doodads') } }));
            }
            if (d.sound && d.sound.file && !this.soundExists(d.sound.file, cache)) {
                out.push(Object.assign({ kind: 'missingSound', text: `${name} (map ${mapId}) plays ${d.sound.file}, which is not in audio/.` }, where,
                    { fix: { label: 'Remove Sound', run: () => this.editDoodads([d], x => { delete x.sound; }, 'edit_doodads') } }));
            }
            // A condition is JavaScript (SECURITY.md); one that doesn't compile is taken as true, so it always shows.
            const condition = String(d.condition || '').trim();
            if (condition && !this.conditionCompiles(condition)) {
                out.push(Object.assign({ kind: 'badCondition', text: `${name} (map ${mapId}): its condition "${condition.slice(0, 60)}" isn't JavaScript that runs, so it always shows.` }, where,
                    { fix: { label: 'Remove Condition', run: () => this.editDoodads([d], x => { x.condition = ''; }, 'edit_doodads') } }));
            }
            if (size && d.posMode !== 0) {
                const maxX = size.w * tw, maxY = size.h * th;
                if (d.x < 0 || d.y < 0 || d.x > maxX || d.y > maxY) {
                    out.push(Object.assign({ kind: 'offMap', text: `${name} (map ${mapId}) stands outside the ${size.w}×${size.h} map, at ${Math.round(d.x)}, ${Math.round(d.y)}.` }, where, {
                        fix: { label: 'Move Inside', run: () => this.editDoodads([d], x => {
                            x.x = Math.max(tw / 2, Math.min(maxX - tw / 2, x.x));
                            x.y = Math.max(th, Math.min(maxY, x.y));
                        }, 'move_doodads') }
                    }));
                }
            }
            if (d.light && d.light.enabled && !dark) {
                out.push(Object.assign({ kind: 'darkLamp', text: `${name} (map ${mapId}) has a light, but the map never gets dark (no darkness, no day and night), so it won't show unless Set Ambient Light is used.` }, where));
            }
        });
        return out;
    },

    // This map's events: below the player and touched to start, but on a tile nobody can step on; or on
    // a tile a doodad's collision covers.
    eventProblems() {
        const out = [];
        if (!window.$gameMap || typeof $gameMap.events !== 'function') return out;
        const blocked = this.doodadBlockedTiles();
        for (const ge of $gameMap.events()) {
            if (!ge || typeof ge.event !== 'function') continue;
            const data = ge.event() || {};
            const label = `EV${String(ge.eventId()).padStart(3, '0')}${data.name ? ' ' + data.name : ''}`;
            const where = { mapId: this.currentMapId(), event: ge, x: ge.x, y: ge.y };
            const page = typeof ge.page === 'function' ? ge.page() : null;
            const touch = page && (page.trigger === 1 || page.trigger === 2) && page.priorityType === 0;
            const walkable = [2, 4, 6, 8].some(dir => $gameMap.isPassable(ge.x, ge.y, dir));
            if (touch && !walkable) out.push(Object.assign({ kind: 'blockedEvent', text: `${label} starts when stepped on, but nobody can walk onto its tile.` }, where));
            else if (blocked.has(ge.x + ',' + ge.y) && page && page.list && page.list.length > 1) {
                out.push(Object.assign({ kind: 'blockedEvent', text: `${label} is under a doodad's collision: the player can't stand there.` }, where));
            }
        }
        return out;
    },

    // Tiles blocked by the collision of doodads that show in the game.
    doodadBlockedTiles() {
        const C = DocsDoodads.Collision;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const settings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        const out = new Set();
        for (const d of DocsDoodads.doodads() || []) {
            const body = C.bodyOf(d);
            if (!body || !DocsDoodads.Layers.visibleInGame(d, settings) || !DocsDoodads.Appearance.isVisible(d, {})) continue;
            for (const t of C.tilesUnder(body, tw, th)) out.add(t.x + ',' + t.y);
        }
        return out;
    },

    // scope: 'map' (this map, with its events) or 'all' (every map's doodads, read from their files).
    collectProblems(scope = 'map') {
        const cache = new Map();
        const data = window.$dataDocsDoodads || {};
        const here = this.currentMapId();
        let out = this.doodadProblems(here, DocsDoodads.doodads(here), null, cache).concat(this.eventProblems());
        if (scope === 'all') {
            for (const id of Object.keys(data).filter(k => /^\d+$/.test(k) && Number(k) !== here && Array.isArray(data[k]) && data[k].length)) {
                const mapData = DocsDoodads.FS.readJson(DocsDoodads.Persistence.mapFilePath(id));
                out = out.concat(this.doodadProblems(Number(id), data[id], mapData, cache));
            }
        }
        if (this._reach && this._reach.mapId === here) out = out.concat(this._reach.flagged);
        // Project-wide: LPC pictures and their credits (no map to go to).
        if (typeof this.lpcProblems === 'function') out = out.concat(this.lpcProblems());
        return out;
    },

    // ---- Reachability ----
    // ignoreCharacters: let the player through events that stand in the way (they may move).
    reachMap(ignoreCharacters) {
        const gameMap = window.$gameMap;
        const blocked = this.doodadBlockedTiles();
        const blockers = new Set();
        for (const ge of ignoreCharacters ? [] : gameMap.events()) {
            if (ge && ge.isNormalPriority && ge.isNormalPriority() && !(ge.isThrough && ge.isThrough())) blockers.add(ge.x + ',' + ge.y);
        }
        const reverse = { 2: 8, 4: 6, 6: 4, 8: 2 };
        return {
            width: gameMap.width(), height: gameMap.height(),
            loopX: Boolean(gameMap.isLoopHorizontal && gameMap.isLoopHorizontal()), loopY: Boolean(gameMap.isLoopVertical && gameMap.isLoopVertical()),
            canStep: (x, y, dir) => {
                const nx = gameMap.roundXWithDirection(x, dir), ny = gameMap.roundYWithDirection(y, dir);
                if (!gameMap.isValid(nx, ny)) return false;
                if (!gameMap.isPassable(x, y, dir) || !gameMap.isPassable(nx, ny, reverse[dir])) return false;
                const key = nx + ',' + ny;
                return !blocked.has(key) && !blockers.has(key);
            }
        };
    },

    // What kind of place an event is, for the reach check: a transfer, a door, a chest, or null.
    eventPlaceKind(ge) {
        const data = ge && typeof ge.event === 'function' ? ge.event() || {} : {};
        const pages = data.pages || [];
        if (pages.some(p => (p.list || []).some(c => c && c.code === 201))) return 'transfer';
        const names = [data.name || ''].concat(pages.map(p => (p.image && p.image.characterName) || '')).join(' ');
        if (/chest|treasure/i.test(names)) return 'chest';
        if (/door|gate/i.test(names)) return 'door';
        return null;
    },

    // From the player (or a tile): reachable tiles, and the places out of reach.
    checkReach(start) {
        if (!window.$gameMap || typeof $gameMap.events !== 'function') return null;
        start = start || (window.$gamePlayer ? { x: $gamePlayer.x, y: $gamePlayer.y } : { x: 0, y: 0 });
        const map = this.reachMap();
        const result = DocsDoodads.MapCheck.reach(start, map);
        const loop = { x: map.loopX, y: map.loopY };
        const flagged = [];
        let open = null;
        for (const ge of $gameMap.events()) {
            const kind = this.eventPlaceKind(ge);
            if (!kind || DocsDoodads.MapCheck.nearReached(result.seen, map.width, map.height, ge.x, ge.y, loop)) continue;
            const data = ge.event() || {};
            // Only characters in the way? Say so: they may walk off or step aside during play.
            if (!open) open = DocsDoodads.MapCheck.reach(start, this.reachMap(true));
            const byCharacters = DocsDoodads.MapCheck.nearReached(open.seen, map.width, map.height, ge.x, ge.y, loop);
            flagged.push({ kind: 'unreachable', mapId: this.currentMapId(), event: ge, x: ge.x, y: ge.y, byCharacters,
                text: `The ${kind} EV${String(ge.eventId()).padStart(3, '0')}${data.name ? ' ' + data.name : ''} at ${ge.x}, ${ge.y} can't be reached from ${start.x}, ${start.y}.` +
                    (byCharacters ? ' Only a character stands in the way (it may move or step aside).' : '') });
        }
        this._reach = { mapId: this.currentMapId(), start, seen: result.seen, count: result.count, width: map.width, height: map.height, flagged };
        this.showToast(flagged.length ? `${result.count} tiles reachable; ${flagged.length} place(s) out of reach.` : `${result.count} tiles reachable; every door, chest and transfer can be reached.`, flagged.length ? 'info' : 'success');
        if (this._problemsOpen) this.renderProblems();
        return this._reach;
    },

    clearReach() {
        this._reach = null;
        if (this.placementTool === 'reach') this.setPlacementTool(null);
        if (this._problemsOpen) this.renderProblems();
    },

    drawReachOverlay(g) {
        const r = this._reach;
        if (!r || !window.$gameMap || r.mapId !== this.currentMapId()) return;
        if (DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera()) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const width = typeof Graphics !== 'undefined' ? Graphics.width : 816, height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const x0 = Math.floor($gameMap.displayX()), y0 = Math.floor($gameMap.displayY());
        g.lineStyle(0);
        g.beginFill(DocsDoodads.Ui.mapColor('reach'), 0.3);
        for (let y = y0; y <= y0 + Math.ceil(height / th); y++) {
            for (let x = x0; x <= x0 + Math.ceil(width / tw); x++) {
                const mx = $gameMap.roundX ? $gameMap.roundX(x) : x, my = $gameMap.roundY ? $gameMap.roundY(y) : y;
                if (mx < 0 || my < 0 || mx >= r.width || my >= r.height || !r.seen[mx + my * r.width]) continue;
                g.drawRect($gameMap.adjustX(mx) * tw, $gameMap.adjustY(my) * th, tw, th);
            }
        }
        g.endFill();
        g.lineStyle(3, DocsDoodads.Ui.mapColor('warning'), 1);
        for (const f of r.flagged) g.drawRect($gameMap.adjustX(f.x) * tw + 2, $gameMap.adjustY(f.y) * th + 2, tw - 4, th - 4);
        g.lineStyle(3, DocsDoodads.Ui.mapColor('probe'), 1);
        g.drawCircle(($gameMap.adjustX(r.start.x) + 0.5) * tw, ($gameMap.adjustY(r.start.y) + 0.5) * th, 8);
        g.lineStyle(0);
    },

    // ---- Go To ----
    goToProblem(p) {
        if (!p) return;
        if (p.mapId !== this.currentMapId()) {
            this._pendingGoTo = p;
            this.goToMap(p.mapId);
            return;
        }
        this.centerOnTile(p.x, p.y);
        if (p.doodad) this.selectDoodads([p.doodad]);
        else if (p.event) this.selectEvent({ gameEvent: p.event, stagedEvent: ($gameMap._stagedMapData && $gameMap._stagedMapData.events && $gameMap._stagedMapData.events[p.event.eventId()]) || p.event.event() });
    },

    centerOnTile(x, y) {
        if (!window.$gameMap || typeof $gameMap.setDisplayPos !== 'function') return;
        const sw = typeof Graphics !== 'undefined' ? Graphics.width / $gameMap.tileWidth() : 17;
        const sh = typeof Graphics !== 'undefined' ? Graphics.height / $gameMap.tileHeight() : 13;
        $gameMap.setDisplayPos(x - sw / 2 + 0.5, y - sh / 2 + 0.5);
    },

    // After Go To on another map: once it loads, the problem is shown there.
    finishPendingGoTo() {
        const p = this._pendingGoTo;
        if (!p || p.mapId !== this.currentMapId()) return false;
        this._pendingGoTo = null;
        this.goToProblem(p);
        return true;
    },

    // ---- The panel ----
    showProblems() {
        if (typeof document === 'undefined') return null;
        this._problemsOpen = true;
        this._problemScope = this._problemScope || 'map';
        return this.renderProblems();
    },

    closeProblems() {
        this._problemsOpen = false;
        const el = typeof document !== 'undefined' ? document.getElementById('dd-problems') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    renderProblems() {
        if (typeof document === 'undefined' || !this._problemsOpen) return null;
        const U = DocsDoodads.Ui;
        let panel = document.getElementById('dd-problems');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dd-problems';
            panel.className = 'dd-glass';
            document.body.appendChild(panel);
        }
        const problems = this.collectProblems(this._problemScope);
        this._problems = problems;
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('help', 1)} Problems (${problems.length})</span>
                <button class="dd-btn dd-fold" id="dd-pr-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-pr-tools">
                <select id="dd-pr-scope"><option value="map"${this._problemScope === 'map' ? ' selected' : ''}>This map</option><option value="all"${this._problemScope === 'all' ? ' selected' : ''}>Every map</option></select>
                <button class="dd-btn" id="dd-pr-refresh" type="button">Check Again</button>
                <button class="dd-btn" id="dd-pr-reach" type="button" title="Where the player can walk from where they stand">Check Reach</button>
                <button class="dd-btn" id="dd-pr-reach-tile" type="button" title="Pick the start tile on the map">From a Tile...</button>
                ${this._reach ? '<button class="dd-btn" id="dd-pr-reach-clear" type="button">Hide Reach</button>' : ''}
            </div>
            <div class="dd-pr-list" id="dd-pr-list"></div>`;
        const list = document.getElementById('dd-pr-list');
        if (list) {
            if (!problems.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = this._problemScope === 'all' ? 'No problems found on any map.' : 'No problems found on this map.';
                list.appendChild(empty);
            }
            for (const [kind, title] of this.problemGroups) {
                const rows = problems.filter(p => p.kind === kind);
                if (!rows.length) continue;
                const head = document.createElement('div');
                head.className = 'dd-pr-group';
                head.textContent = `${title} (${rows.length})`;
                list.appendChild(head);
                for (const p of rows) {
                    const row = document.createElement('div');
                    row.className = 'dd-pr-row';
                    const text = document.createElement('span');
                    text.className = 'dd-pr-text';
                    text.textContent = p.text;
                    row.appendChild(text);
                    if (!p.global) {
                        const go = document.createElement('button');
                        go.className = 'dd-btn';
                        go.type = 'button';
                        go.textContent = 'Go To';
                        go.onclick = () => this.goToProblem(p);
                        row.appendChild(go);
                    }
                    if (p.fix) {
                        const fix = document.createElement('button');
                        fix.className = 'dd-btn dd-btn-primary';
                        fix.type = 'button';
                        fix.textContent = p.fix.label;
                        fix.onclick = async () => { await p.fix.run(); this.renderProblems(); };
                        row.appendChild(fix);
                    }
                    list.appendChild(row);
                }
            }
        }
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-pr-close', () => this.closeProblems());
        on('dd-pr-refresh', () => this.renderProblems());
        on('dd-pr-reach', () => this.checkReach());
        on('dd-pr-reach-tile', () => this.setPlacementTool('reach'));
        on('dd-pr-reach-clear', () => this.clearReach());
        const scope = document.getElementById('dd-pr-scope');
        if (scope) scope.onchange = () => { this._problemScope = scope.value === 'all' ? 'all' : 'map'; this.renderProblems(); };
        this.placeReadouts();
        return panel;
    }
});
