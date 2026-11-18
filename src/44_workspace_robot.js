// @editor-only
//==========================================================
// SECTION 25B: ROBOT TESTER (8.4.7)
//==========================================================
// Map → Test Every Map follows transfers from the game's start without playing. Map → Test This Map does the
// same from where the player stands, then plays: each event the player can get to is run in its own
// interpreter at many frames a step, with messages and choices answered, transfers and scene changes (battles,
// shops, menus, game over) only recorded, and a frame limit. It records errors, events that never finish and
// where they would have sent the player. The game is played on a copy: everything is put back afterwards.
(function() {
    const D = DocsDoodads, W = D.Workspace, R = D.Robot;
    const escapeHtml = value => D.Security.escapeHtml(String(value));

    Object.assign(W, {
        robotProject(onlyMapId) {
            const F = D.FS, infos = F.readJson('data/MapInfos.json') || window.$dataMapInfos || [], maps = {}, names = {};
            for (const info of infos) {
                if (!info || (onlyMapId && info.id !== onlyMapId)) continue;
                const live = info.id === this.currentMapId() && window.$gameMap && $gameMap._stagedMapData ? $gameMap._stagedMapData : null;
                const data = live || (info.id === this.currentMapId() ? window.$dataMap : null) || F.readJson(D.Persistence.mapFilePath(info.id));
                if (data) { maps[info.id] = data; names[info.id] = info.name; }
            }
            const tw = window.$gameMap ? $gameMap.tileWidth() : 48, th = window.$gameMap ? $gameMap.tileHeight() : 48;
            return {
                maps, names,
                flags: id => { const ts = window.$dataTilesets && $dataTilesets[maps[id] && maps[id].tilesetId]; return (ts && ts.flags) || []; },
                walls: id => {
                    const saved = window.$dataDocsDoodads && $dataDocsDoodads.walls ? $dataDocsDoodads.walls[id] : null, grid = saved ? D.Walls.decode(saved) : null;
                    if (!grid) return null;
                    const tile = (x, y) => D.Walls.blocksTile(grid, x, y, tw, th);
                    tile.step = (x, y, d) => D.Walls.blocksStep(grid, x, y, d, tw, th);
                    return tile;
                }
            };
        },

        testEveryMap() {
            const sys = window.$dataSystem || {};
            const project = Object.assign(this.robotProject(), { start: { mapId: sys.startMapId, x: sys.startX, y: sys.startY } });
            const result = R.explore(project);
            this.showRobotReport('Test Every Map', result.findings, `${result.reached.length} of ${Object.keys(project.maps).length} map(s) reached from the start.`);
            return result;
        },

        async testThisMap(options = {}) {
            const mapId = this.currentMapId();
            const project = Object.assign(this.robotProject(mapId), { start: { mapId, x: $gamePlayer.x, y: $gamePlayer.y } });
            const result = R.explore(project);
            const findings = result.findings.filter(f => f.kind !== 'missingMap' && f.kind !== 'deadEnd' && f.kind !== 'oneWay');
            let played = null;
            if (options.play !== false) played = await this.robotPlayThisMap(options);
            if (played) findings.push(...played.findings);
            this.showRobotReport('Test This Map', findings, played ? `Played ${played.events} event(s) on a copy of the game; everything was put back.` : 'Walked the map without playing its events.');
            return { findings, played };
        },

        // Plays each event the player can reach, on a copy of the game's state.
        async robotPlayThisMap(options = {}) {
            if (!D.Compat.isTest() || typeof Game_Interpreter === 'undefined' || !window.DataManager || !DataManager.makeSaveContents || typeof JsonEx === 'undefined') return null;
            if (D.Persistence.hasUnsavedWork && D.Persistence.hasUnsavedWork()) { this.showToast('Save the map first: the robot plays on a copy of the game and puts it back.', 'info'); return null; }
            const mapId = $gameMap.mapId(), px = $gamePlayer.x, py = $gamePlayer.y, pd = $gamePlayer.direction();
            const walk = { width: $gameMap.width(), height: $gameMap.height(), loopX: $gameMap.isLoopHorizontal(), loopY: $gameMap.isLoopVertical(),
                canStep: (x, y, d) => $gamePlayer.canPass(x, y, d) };
            const seen = D.MapCheck.reach({ x: px, y: py }, walk).seen;
            const targets = $gameMap.events().filter(ev => ev && ev.page() && [0, 1, 2].includes(ev.page().trigger) && (ev.list() || []).length > 1 &&
                D.MapCheck.nearReached(seen, walk.width, walk.height, ev.x, ev.y, { x: walk.loopX, y: walk.loopY })).map(ev => ({ id: ev.eventId(), x: ev.x, y: ev.y, name: ev.event().name }));
            const snapshot = JsonEx.stringify(DataManager.makeSaveContents());
            const saved = { push: SceneManager.push, goto: SceneManager.goto, reserve: Game_Player.prototype.reserveTransfer, error: console.error };
            const findings = [];
            let current = null;
            SceneManager.push = scene => { if (current) current.scenes.push(scene && scene.name); };
            SceneManager.goto = scene => { if (current) current.scenes.push(scene && scene.name); };
            Game_Player.prototype.reserveTransfer = function(toMap, x, y) { if (current) current.transfers.push({ mapId: toMap, x, y }); };
            console.error = function() { if (current) current.errors.push(Array.from(arguments).map(String).join(' ')); return saved.error.apply(console, arguments); };
            const limit = Math.max(60, Number(options.limit) || 1800);
            try {
                for (const target of targets) {
                    DataManager.extractSaveContents(JsonEx.parse(snapshot));
                    const ev = $gameMap.event(target.id);
                    if (!ev) continue;
                    current = { transfers: [], scenes: [], errors: [] };
                    const interpreter = new Game_Interpreter();
                    interpreter.setup(ev.list(), target.id);
                    const run = R.drive(() => {
                        if ($gameMessage.isBusy()) {
                            if ($gameMessage.isChoice()) $gameMessage.onChoice(0);
                            if ($gameMessage.isNumberInput()) $gameVariables.setValue($gameMessage.numInputVariableId(), 0);
                            if ($gameMessage.isItemChoice()) $gameVariables.setValue($gameMessage.itemChoiceVariableId(), 0);
                            $gameMessage.clear();
                        }
                        interpreter.update();
                        $gameMap.update(false);
                        $gamePlayer.update(false);
                        $gameScreen.update();
                        return interpreter.isRunning();
                    }, limit);
                    const where = { mapId, x: target.x, y: target.y }, label = `EV${String(target.id).padStart(3, '0')}${target.name ? ' ' + target.name : ''}`;
                    if (run.error) findings.push(Object.assign({ kind: 'robotError', text: `${label} stopped with an error: ${run.error}` }, where));
                    else if (!run.done) findings.push(Object.assign({ kind: 'robotStuck', text: `${label} did not finish within ${limit} frames.` }, where));
                    for (const message of current.errors.slice(0, 3)) findings.push(Object.assign({ kind: 'robotConsole', text: `${label} logged an error: ${message.slice(0, 200)}` }, where));
                    for (const t of current.transfers) {
                        const target2 = $dataMapInfos && $dataMapInfos[t.mapId];
                        if (!target2) findings.push(Object.assign({ kind: 'robotTransfer', text: `${label} sends the player to Map ${t.mapId}, which does not exist.` }, where));
                    }
                }
            } finally {
                current = null;
                SceneManager.push = saved.push; SceneManager.goto = saved.goto;
                Game_Player.prototype.reserveTransfer = saved.reserve; console.error = saved.error;
                DataManager.extractSaveContents(JsonEx.parse(snapshot));
                $gamePlayer.reserveTransfer(mapId, px, py, pd, 0);
            }
            return { findings, events: targets.length };
        },

        closeRobotReport() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-robot-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        showRobotReport(title, findings, summary) {
            if (typeof document === 'undefined') return null;
            this.closeRobotReport();
            const card = document.createElement('div');
            card.id = 'dd-robot-card'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:400px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;';
            const rows = findings.slice(0, 200);
            card.innerHTML = `<div class="dd-panel-head">${escapeHtml(title)} <button class="dd-btn" id="dd-robot-close" type="button">Close</button></div>
                <div style="color:var(--dd-muted);margin-bottom:6px;">${escapeHtml(summary)} ${findings.length ? findings.length + ' finding(s).' : 'Nothing wrong was found.'}</div>
                ${rows.map((f, i) => `<div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;"><span style="flex:1;">${escapeHtml(f.text)}</span>
                    ${f.global ? '' : `<button class="dd-btn" type="button" id="dd-robot-go-${i}">Go To</button>`}</div>`).join('')}`;
            document.body.appendChild(card);
            document.getElementById('dd-robot-close').onclick = () => this.closeRobotReport();
            rows.forEach((f, i) => { const go = document.getElementById(`dd-robot-go-${i}`); if (go) go.onclick = () => this.goToProblem(f); });
            return card;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) {
            map.items.push({ id: 'dd-robot-map-btn', icon: 'person', label: 'Test This Map', title: 'A robot walks this map and plays its events on a copy of the game' });
            map.items.push({ id: 'dd-robot-all-btn', icon: 'map', label: 'Test Every Map', title: 'Follow every transfer from the start: unreachable maps, dead ends, one-way doors, bad landings' });
        }
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
        const one = node('dd-robot-map-btn'), all = node('dd-robot-all-btn');
        if (one) one.onclick = () => { this.showMoreMenu(false); this.testThisMap(); };
        if (all) all.onclick = () => { this.showMoreMenu(false); this.testEveryMap(); };
        return result;
    };
})();
