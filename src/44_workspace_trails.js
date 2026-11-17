// @editor-only
Object.assign(DocsDoodads.Ui.mapPalettes.standard, { trailLow: 0x60a5fa, trailHigh: 0xf59e0b, trailDeath: 0xef4444 });
Object.assign(DocsDoodads.Ui.mapPalettes.safe, { trailLow: 0x56b4e9, trailHigh: 0xe69f00, trailDeath: 0xd55e00 });
DocsDoodads.Ui.mapColorMeanings.push(['trailLow', 'A lightly used playtest trail'], ['trailHigh', 'A heavily used playtest trail'], ['trailDeath', 'A playtest Game Over']);
(() => {
    const W = DocsDoodads.Workspace, T = DocsDoodads.Trails;
    Object.assign(W, {
        hideTrails() {
            this._trailsShown = false;
            this._trailsUiToken = (this._trailsUiToken || 0) + 1;
            const card = document.getElementById('dd-trails-card'); if (card && card.remove) card.remove();
        },
        toggleTrails() { if (this._trailsShown) this.hideTrails(); else this.showTrails(); },
        drawTrails(g) {
            if (!this._trailsShown || !g || typeof $gameMap === 'undefined' || !$gameMap || DocsDoodads.Perspective.liveCamera()) return;
            const map = T.data().maps[String(this.currentMapId())]; if (!map) return;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), dx = $gameMap.displayX(), dy = $gameMap.displayY();
            const field = this._trailsMetric === 'stops' ? 'frames' : 'steps', U = DocsDoodads.Ui;
            const rows = Math.ceil(Graphics.height / th) + 2, cols = Math.ceil(Graphics.width / tw) + 2;
            for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
                const x = Math.floor(dx) - 1 + col, y = Math.floor(dy) - 1 + row;
                const cell = map[$gameMap.roundX(x) + ',' + $gameMap.roundY(y)]; if (!cell) continue;
                const sx = (x - dx) * tw, sy = (y - dy) * th;
                if (cell[field]) {
                    const high = field === 'steps' ? cell[field] >= 10 : cell[field] >= 600;
                    g.beginFill(U.mapColor(high ? 'trailHigh' : 'trailLow'), high ? 0.6 : 0.3);
                    g.drawRect(sx + 1, sy + 1, tw - 2, th - 2); g.endFill();
                }
                if (cell.deaths) {
                    const inset = Math.max(2, Math.min(tw, th) / 4);
                    g.lineStyle(3, U.mapColor('trailDeath'), 0.95); g.moveTo(sx + inset, sy + inset); g.lineTo(sx + tw - inset, sy + th - inset);
                    g.moveTo(sx + tw - inset, sy + inset); g.lineTo(sx + inset, sy + th - inset); g.lineStyle(0);
                }
            }
        },
        async importTrailsFiles(files) {
            const token = this._trailsUiToken;
            let merged = 0;
            for (const file of Array.from(files || []).slice(0, 16)) {
                try {
                    if (!/\.json$/i.test(file.name || '') || file.size > T.maxBytes) throw new Error('Choose a trails JSON file under 16 MB.');
                    T.importText(await file.text()); merged++;
                } catch (error) { this.showToast(error.message || String(error), 'error'); }
            }
            if (merged) {
                T.flush();
                if (this.mounted && token === this._trailsUiToken) {
                    this.showToast(`Added ${merged} trails file(s). Importing again adds the counts again.`, 'success'); this.showTrails();
                }
            }
            return merged;
        },
        showTrails() {
            this.hideTrails(); this._trailsShown = true;
            const metric = this._trailsMetric || 'steps', scope = this._trailsScope === 'all' ? 0 : this.currentMapId();
            const stops = T.rows('stops', scope), deaths = T.rows('deaths', scope), page = Math.max(0, this._trailsPage || 0);
            const all = stops.map(row => Object.assign({ kind: 'stop' }, row)).concat(deaths.map(row => Object.assign({ kind: 'death' }, row)));
            const maxPage = Math.max(0, Math.ceil(all.length / 40) - 1), current = Math.min(page, maxPage);
            const shown = all.slice(current * 40, current * 40 + 40), card = document.createElement('div');
            card.id = 'dd-trails-card'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:390px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;';
            const colour = key => '#' + DocsDoodads.Ui.mapColor(key).toString(16).padStart(6, '0');
            const label = row => row.kind === 'death' ? `${row.deaths} Game Over(s)` : `${(row.frames / 60).toFixed(1)} seconds stopped`;
            card.innerHTML = `<div class="dd-panel-head">Playtest Trails <button class="dd-btn" id="dd-trails-close">Close</button></div>
                <div>Counts stay on this computer. Drop a tester's trails.json here to add it. No names or player identifiers are recorded.</div>
                <div><select id="dd-trails-scope"><option value="map"${scope ? ' selected' : ''}>This map</option><option value="all"${!scope ? ' selected' : ''}>Every map</option></select>
                <select id="dd-trails-metric"><option value="steps"${metric === 'steps' ? ' selected' : ''}>Walking</option><option value="stops"${metric === 'stops' ? ' selected' : ''}>Stops</option></select></div>
                <div><span style="color:${colour('trailLow')};">■</span> ${metric === 'steps' ? '1–9 tile entries' : 'Under 10 seconds stopped'}
                <span style="color:${colour('trailHigh')};">■</span> ${metric === 'steps' ? '10+ entries' : '10+ seconds'}
                <span style="color:${colour('trailDeath')};">×</span> Game Over</div>
                <div>Heat is shown on flat maps. Stops count game frames while standing; battles, menus and editing are excluded.</div>
                <input id="dd-trails-file" type="file" accept=".json,application/json" multiple>
                <button class="dd-btn" id="dd-trails-clear">Clear ${scope ? 'this map' : 'every map'}</button>
                ${T._loadError || T._writeError ? `<div>${escapeHtml(T._loadError || T._writeError)} Clear explicitly to replace unreadable stored trails.</div>` : ''}
                <div>${all.length} stop/Game Over location(s). Page ${current + 1} of ${maxPage + 1}.
                <button class="dd-btn" id="dd-trails-prev"${current ? '' : ' disabled'}>Previous</button><button class="dd-btn" id="dd-trails-next"${current < maxPage ? '' : ' disabled'}>Next</button></div>
                ${shown.map((row, index) => `<div>${escapeHtml(label(row))} · Map ${row.mapId} (${row.x}, ${row.y}) <button class="dd-btn" id="dd-trails-go-${index}">Go To</button></div>`).join('')}`;
            document.body.appendChild(card);
            const node = id => document.getElementById(id);
            node('dd-trails-close').onclick = () => this.hideTrails();
            node('dd-trails-scope').onchange = event => { this._trailsScope = event.target.value; this._trailsPage = 0; this.showTrails(); };
            node('dd-trails-metric').onchange = event => { this._trailsMetric = event.target.value; this.showTrails(); };
            node('dd-trails-file').onchange = event => this.importTrailsFiles(event.target.files);
            node('dd-trails-prev').onclick = () => { this._trailsPage = current - 1; this.showTrails(); };
            node('dd-trails-next').onclick = () => { this._trailsPage = current + 1; this.showTrails(); };
            node('dd-trails-clear').onclick = async () => {
                const token = this._trailsUiToken;
                if (await DocsDoodads.Ui.confirm('Clear these recorded trails? This cannot be undone.', { title: 'Clear trails', ok: 'Clear' }) &&
                    this.mounted && this._trailsShown && token === this._trailsUiToken && (!scope || scope === this.currentMapId())) {
                    T.clear(scope); this._trailsPage = 0; this.showTrails();
                }
            };
            shown.forEach((row, index) => { node(`dd-trails-go-${index}`).onclick = () => this.goToProblem(row); });
            card.ondragover = event => { event.preventDefault(); event.stopPropagation(); };
            card.ondrop = event => { event.preventDefault(); event.stopPropagation(); this.importTrailsFiles(event.dataTransfer.files); };
            return card;
        }
    });
    W.toolHooks.trails = { overlay(graphics) { this.drawTrails(graphics); } };
    const goToMap = W.goToMap;
    W.goToMap = function(mapId) {
        if (mapId && Number(mapId) !== this.currentMapId()) this.hideTrails();
        return goToMap.apply(this, arguments);
    };
    const loaded = W.onMapLoaded;
    W.onMapLoaded = function() { this.hideTrails(); return loaded.apply(this, arguments); };
    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), view = all.find(menu => menu.id === 'view');
        if (view) view.items.push({ id: 'dd-trails-btn', icon: 'path', label: 'Show Trails', title: 'See where playtesters walked, stopped and reached Game Over' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = document.getElementById('dd-trails-btn');
        if (button) button.onclick = () => { this.showMoreMenu(false); this.toggleTrails(); };
        return result;
    };
})();
