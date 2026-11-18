// @editor-only
//==========================================================
// SECTION 25L: THE TIMELINES CARD (7.3.6)
//==========================================================
// Map → Timelines: a list of cutscene timelines; each has tracks (a row per kind and target) and keys on them.
// Click a row to add a key there, click a key to change or delete it, drag a key to move it; each change is one
// Undo step. Play runs the keys on the map; clicking the ruler jumps there. Stop, and any jump backwards, put the
// map back as it was when Play was pressed (states, light, weather, time, switches, the camera, characters)
// and run forward from there: an action cannot be undone, only replayed.
(function() {
    const D = DocsDoodads, W = D.Workspace, T = D.Timeline;
    const ROW = 20, RULER = 18, LEFT = 120;

    Object.assign(W, {
        timelineState: { id: null, preview: null, width: 560 },

        timelinesCopy() {
            const data = window.$dataDocsDoodads || {};
            return JSON.parse(JSON.stringify(Array.isArray(data.timelines) ? data.timelines : []));
        },

        // Every edit replaces the whole list, as one Undo step.
        setTimelines(list, label) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            const before = this.timelinesCopy(), after = JSON.parse(JSON.stringify(list.map(t => T.normalize(t)).filter(Boolean)));
            const write = value => {
                if (value.length) data.timelines = JSON.parse(JSON.stringify(value)); else delete data.timelines;
                D.Persistence.dirtyDoodads = true;
                if (this.renderTimelineCard) this.renderTimelineCard();
            };
            D.Undo.execute({ type: 'timeline', label: label || 'Timeline', apply: () => write(after), revert: () => write(before) });
            return true;
        },

        editTimeline(id, change, label) {
            const list = this.timelinesCopy(), tl = list.find(t => t.id === id);
            if (!tl) return false;
            change(tl);
            return this.setTimelines(list, label);
        },

        newTimeline(name) {
            const list = this.timelinesCopy();
            const base = 'tl_' + (String(name || 'timeline').toLowerCase().replace(/[^\w]+/g, '_').slice(0, 24) || 'timeline');
            let id = base, n = 2;
            while (list.some(t => t.id === id)) id = base + '_' + n++;
            list.push({ id, name: String(name || 'Timeline').trim() || 'Timeline', length: 300, tracks: [] });
            this.setTimelines(list, 'New timeline');
            this.timelineState.id = id;
            return id;
        },

        deleteTimeline(id) {
            return this.setTimelines(this.timelinesCopy().filter(t => t.id !== id), 'Delete timeline');
        },

        addTimelineTrack(id, kind, target) {
            if (!T.kinds[kind]) return false;
            return this.editTimeline(id, tl => { tl.tracks = tl.tracks || []; tl.tracks.push({ kind, target: target || '', keys: [] }); }, 'Add track');
        },

        removeTimelineTrack(id, ti) {
            return this.editTimeline(id, tl => { tl.tracks.splice(ti, 1); }, 'Remove track');
        },

        addTimelineKey(id, ti, key) {
            return this.editTimeline(id, tl => { if (tl.tracks[ti]) tl.tracks[ti].keys.push(T.normalizeKey(key)); }, 'Add key');
        },

        // The key at index ki of track ti; keys are kept in time order, so find it by object after the change.
        updateTimelineKey(id, ti, ki, change) {
            return this.editTimeline(id, tl => {
                const track = tl.tracks[ti];
                if (!track || !track.keys[ki]) return;
                if (change === null) track.keys.splice(ki, 1);
                else track.keys[ki] = T.normalizeKey(Object.assign({}, track.keys[ki], change));
            }, change === null ? 'Delete key' : change && Object.keys(change).length === 1 && 't' in change ? 'Move key' : 'Change key');
        },

        // ---- Preview: put the map back as it was when Play was pressed ----
        timelineSnapshot() {
            const json = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
            const chars = [typeof $gamePlayer !== 'undefined' ? $gamePlayer : null].concat(typeof $gameMap !== 'undefined' && $gameMap.events ? $gameMap.events() : []).filter(Boolean);
            return {
                worldState: json($gameSystem._docsWorldState),
                ambientFade: json($gameSystem._docsAmbientFade),
                weather: typeof $gameScreen !== 'undefined' && $gameScreen ? [$gameScreen._weatherType, $gameScreen._weatherPower] : null,
                minutes: D.Atmosphere.minutes(),
                switches: typeof $gameSwitches !== 'undefined' && $gameSwitches ? json($gameSwitches._data) : null,
                chars: chars.map(c => ({ c, x: c._x, y: c._y, d: c._direction, t: c._transparent }))
            };
        },

        restoreTimelineSnapshot(s) {
            if (!s) return;
            $gameSystem._docsWorldState = s.worldState === undefined ? undefined : JSON.parse(JSON.stringify(s.worldState));
            $gameSystem._docsAmbientFade = s.ambientFade === undefined ? null : JSON.parse(JSON.stringify(s.ambientFade));
            if (s.weather && $gameScreen) { $gameScreen._weatherType = s.weather[0]; $gameScreen._weatherPower = s.weather[1]; }
            if (s.switches && $gameSwitches) $gameSwitches._data = JSON.parse(JSON.stringify(s.switches));
            if (D.setTimeOfDay && s.minutes !== null && s.minutes !== undefined) D.setTimeOfDay(s.minutes);
            for (const r of s.chars) {
                if (r.c.locate) r.c.locate(r.x, r.y);
                r.c._direction = r.d; r.c._transparent = r.t;
                if (r.c._moveRouteForcing && r.c.restoreMoveRoute) { r.c._moveRouteForcing = false; r.c.restoreMoveRoute(); }
            }
            try { D.api.followCamera(); const C = D.Camera2D; if (C.zoomTo && typeof $gamePlayer !== 'undefined') C.zoomTo(C.pointOf($gamePlayer), 1, 1); } catch (e) { /* no camera */ }
            if (D.api && D.api.refresh) D.api.refresh();
        },

        playTimelinePreview(id, from = 0) {
            const tl = T.find(id);
            if (!tl) return false;
            const st = this.timelineState;
            if (!st.preview) st.preview = this.timelineSnapshot();
            else this.restoreTimelineSnapshot(st.preview);
            T._editorPreview = true;
            T.play(tl, { skippable: false });
            if (from > 0) T.step(from);
            return true;
        },

        // A jump on the ruler: back to the snapshot, forward at once, paused there.
        scrubTimeline(id, frame) {
            if (!this.playTimelinePreview(id, Math.max(0, Math.round(frame)))) return false;
            if (T._player) T._player.paused = true;
            this.drawTimeline();
            return true;
        },

        stopTimelinePreview() {
            const st = this.timelineState;
            T.stop(false);
            T._editorPreview = false;
            if (st.preview) this.restoreTimelineSnapshot(st.preview);
            st.preview = null;
            this.drawTimeline();
        },

        // ---- The card ----
        closeTimelineCard() {
            this.stopTimelinePreview();
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-timeline-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        openTimelineCard() {
            if (typeof document === 'undefined' || !document.createElement) return null;
            let card = document.getElementById('dd-timeline-card');
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-timeline-card'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;left:20px;right:20px;bottom:20px;max-height:50vh;overflow:auto;padding:10px;z-index:10040;font-size:11px;';
                document.body.appendChild(card);
            }
            const list = T.list();
            if (!this.timelineState.id || !list.some(t => t.id === this.timelineState.id)) this.timelineState.id = list.length ? list[0].id : null;
            this.renderTimelineCard();
            return card;
        },

        renderTimelineCard() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-timeline-card') : null;
            if (!card) return;
            const list = T.list(), tl = list.find(t => t.id === this.timelineState.id) || null;
            const kinds = Object.keys(T.kinds).map(k => `<option value="${k}">${escapeHtml(T.kinds[k].label)}</option>`).join('');
            card.innerHTML = `<div class="dd-panel-head">Timelines
                    <select id="dd-tl-pick">${list.map(t => `<option value="${escapeHtml(t.id)}"${tl && t.id === tl.id ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('') || '<option value="">None yet</option>'}</select>
                    <button class="dd-btn" id="dd-tl-new" type="button">New</button>
                    ${tl ? `<button class="dd-btn" id="dd-tl-rename" type="button">Rename</button><button class="dd-btn" id="dd-tl-delete" type="button">Delete</button>
                    <label>Length (s) <input id="dd-tl-length" type="number" min="0.1" step="0.5" value="${(tl.length / 60).toFixed(1)}" style="width:56px"></label>
                    <button class="dd-btn dd-btn-primary" id="dd-tl-play" type="button">${T.isPlaying(tl.id) ? 'Pause' : 'Play'}</button><button class="dd-btn" id="dd-tl-stop" type="button">Stop</button>
                    <select id="dd-tl-kind">${kinds}</select><button class="dd-btn" id="dd-tl-track" type="button">Add Track</button>` : ''}
                    <button class="dd-btn" id="dd-tl-close" type="button">Close</button></div>
                ${tl ? `<canvas id="dd-tl-canvas" width="${LEFT + this.timelineState.width}" height="${RULER + Math.max(1, tl.tracks.length) * ROW + 2}" style="display:block;cursor:pointer;"></canvas>
                <div style="color:var(--dd-faint);margin-top:4px;">Click a row to add a key; click a key to change it; drag a key to move it. The event command is Play Timeline: ${escapeHtml(tl.name)}. Holding OK for a second skips it in the game.</div>`
                : '<div style="color:var(--dd-muted);">A timeline lays out camera moves, states, lights, weather, looks and characters against time, played by one plugin command.</div>'}`;
            const node = id => document.getElementById(id);
            node('dd-tl-close').onclick = () => this.closeTimelineCard();
            node('dd-tl-pick').onchange = e => { this.stopTimelinePreview(); this.timelineState.id = e.target.value || null; this.renderTimelineCard(); };
            node('dd-tl-new').onclick = async () => { const name = await D.Ui.prompt('A name for the timeline', 'Opening', { title: 'New Timeline' }); if (name) this.newTimeline(name); };
            if (!tl) return;
            node('dd-tl-rename').onclick = async () => { const name = await D.Ui.prompt('Its new name', tl.name, { title: 'Rename' }); if (name) this.editTimeline(tl.id, t => { t.name = name; }, 'Rename timeline'); };
            node('dd-tl-delete').onclick = async () => { if (await D.Ui.confirm(`Delete ${tl.name}? Events that play it will do nothing.`, { danger: true, okLabel: 'Delete' })) this.deleteTimeline(tl.id); };
            node('dd-tl-length').onchange = e => this.editTimeline(tl.id, t => { t.length = Math.max(1, Math.round((Number(e.target.value) || 1) * 60)); }, 'Timeline length');
            node('dd-tl-play').onclick = () => {
                if (T.isPlaying(tl.id) && T._player) { T._player.paused = !T._player.paused; }
                else this.playTimelinePreview(tl.id);
                this.renderTimelineCard();
            };
            node('dd-tl-stop').onclick = () => { this.stopTimelinePreview(); this.renderTimelineCard(); };
            node('dd-tl-track').onclick = async () => {
                const kind = node('dd-tl-kind').value, info = T.kinds[kind];
                let target = '';
                if (info.target) { target = await D.Ui.prompt(info.target, kind === 'character' ? 'player' : '', { title: info.label }); if (target === null || target === undefined) return; }
                this.addTimelineTrack(tl.id, kind, target);
            };
            this.bindTimelineCanvas(tl);
            this.drawTimeline();
        },

        timelineScale(tl) { return this.timelineState.width / Math.max(1, T.length(tl)); },

        timelineHit(tl, x, y) {
            const ti = Math.floor((y - RULER) / ROW), k = this.timelineScale(tl);
            if (y < RULER) return { ruler: true, t: Math.max(0, (x - LEFT) / k) };
            const track = tl.tracks[ti];
            if (!track) return null;
            if (x < LEFT) return { label: true, ti };
            const ki = track.keys.findIndex(key => Math.abs(LEFT + key.t * k - x) <= 6);
            return { ti, ki, t: Math.max(0, Math.round((x - LEFT) / k)) };
        },

        async editTimelineKeyForm(tl, ti, ki, t) {
            const track = tl.tracks[ti], info = T.kinds[track.kind], key = ki >= 0 ? track.keys[ki] : { t };
            const fields = info.fields.map(f => Object.assign({}, f, { type: f.type === 'number' ? 'text' : f.type, value: key[f.key] === undefined ? (f.type === 'checkbox' ? false : '') : key[f.key] }));
            fields.unshift({ key: 't', label: 'At (seconds)', value: String((key.t / 60).toFixed(2)) });
            if (ki >= 0) fields.push({ key: '__delete', label: 'Delete this key', type: 'checkbox', value: false });
            const v = await D.Ui.form({ title: `${info.label}${track.target ? ': ' + track.target : ''}`, ok: ki >= 0 ? 'Keep' : 'Add', fields });
            if (!v) return false;
            if (v.__delete) return this.updateTimelineKey(tl.id, ti, ki, null);
            const out = { t: Math.round((Number(v.t) || 0) * 60) };
            for (const f of info.fields) out[f.key] = f.type === 'number' ? (v[f.key] === '' ? '' : Number(v[f.key]) || 0) : v[f.key];
            return ki >= 0 ? this.updateTimelineKey(tl.id, ti, ki, out) : this.addTimelineKey(tl.id, ti, out);
        },

        bindTimelineCanvas(tl) {
            const canvas = document.getElementById('dd-tl-canvas');
            if (!canvas) return;
            const at = e => {
                const r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
                const s = this.uiScaleNow ? this.uiScaleNow() : 1;
                return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
            };
            canvas.onmousedown = e => {
                const p = at(e), hit = this.timelineHit(tl, p.x, p.y);
                if (!hit) return;
                if (hit.ruler) { this.scrubTimeline(tl.id, hit.t); return; }
                if (hit.label) {
                    const track = tl.tracks[hit.ti];
                    D.Ui.confirm(`Remove the ${T.kinds[track.kind].label} track${track.target ? ' (' + track.target + ')' : ''} and its keys?`, { danger: true, okLabel: 'Remove' })
                        .then(ok => { if (ok) this.removeTimelineTrack(tl.id, hit.ti); });
                    return;
                }
                if (hit.ki < 0) { this.editTimelineKeyForm(tl, hit.ti, -1, hit.t); return; }
                const drag = { ti: hit.ti, ki: hit.ki, start: p.x, t: tl.tracks[hit.ti].keys[hit.ki].t, moved: false };
                const move = ev => {
                    const q = at(ev);
                    if (Math.abs(q.x - drag.start) > 3) drag.moved = true;
                    drag.to = Math.max(0, Math.round(drag.t + (q.x - drag.start) / this.timelineScale(tl)));
                    this.drawTimeline({ ti: drag.ti, ki: drag.ki, t: drag.to });
                };
                const up = () => {
                    window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
                    if (drag.moved) this.updateTimelineKey(tl.id, drag.ti, drag.ki, { t: drag.to });
                    else this.editTimelineKeyForm(tl, drag.ti, drag.ki, drag.t);
                };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            };
        },

        drawTimeline(ghost) {
            const canvas = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-tl-canvas') : null;
            const tl = T.list().find(t => t.id === this.timelineState.id);
            const g = canvas && canvas.getContext && canvas.getContext('2d');
            if (!g || !tl || !g.fillRect) return;
            const k = this.timelineScale(tl), total = T.length(tl);
            g.clearRect(0, 0, canvas.width, canvas.height);
            g.font = '10px sans-serif'; g.textBaseline = 'middle';
            g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(LEFT, 0, canvas.width - LEFT, RULER);
            g.fillStyle = '#aaa';
            for (let s = 0; s * 60 <= total; s++) { const x = LEFT + s * 60 * k; g.fillRect(x, RULER - 6, 1, 6); if (s % Math.max(1, Math.ceil(30 / (60 * k))) === 0) g.fillText(s + 's', x + 2, 7); }
            tl.tracks.forEach((track, ti) => {
                const y = RULER + ti * ROW;
                g.fillStyle = ti % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'; g.fillRect(0, y, canvas.width, ROW);
                g.fillStyle = '#ddd'; g.fillText(`${T.kinds[track.kind].label}${track.target ? ' · ' + track.target : ''}`.slice(0, 22), 4, y + ROW / 2);
                track.keys.forEach((key, ki) => {
                    const t = ghost && ghost.ti === ti && ghost.ki === ki ? ghost.t : key.t, x = LEFT + t * k, cy = y + ROW / 2;
                    g.fillStyle = '#ffd24a'; g.beginPath(); g.moveTo(x, cy - 6); g.lineTo(x + 6, cy); g.lineTo(x, cy + 6); g.lineTo(x - 6, cy); g.closePath(); g.fill();
                });
            });
            const head = T.isPlaying(tl.id) ? T.frame() : -1;
            if (head >= 0) { g.fillStyle = '#ff5050'; g.fillRect(LEFT + head * k, 0, 2, canvas.height); }
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-timeline-btn', icon: 'history', label: 'Timelines', title: 'Cutscenes: camera, states, lights, weather, looks and characters laid out against time, played by one command' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-timeline-btn') : null;
        if (btn) btn.onclick = () => { if (this.showMoreMenu) this.showMoreMenu(false); this.openTimelineCard(); };
        return result;
    };
})();
