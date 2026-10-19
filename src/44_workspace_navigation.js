//==========================================================
// SECTION 25f: WORKSPACE NAVIGATION (PALETTE, MAP TABS, FOLDER VIEW)
//==========================================================
// Getting around: the command palette (any word order, recent first, shortcuts shown, and values typed
// straight in: "time 18:30", "go to map 3"), tabs for recently opened maps with an unsaved dot, and a
// folder tree in the Item Bag.
DocsDoodads.Ui.css += `
#dd-map-tabs { position: absolute; display: flex; gap: 4px; overflow-x: auto; overflow-y: hidden; padding: 2px; pointer-events: auto; scrollbar-width: none; }
#dd-map-tabs::-webkit-scrollbar { display: none; }
.dd-map-tab { display: inline-flex; align-items: center; gap: 4px; flex: none; max-width: 170px; height: 26px; padding: 0 4px 0 10px; border-radius: 13px;
    font-family: var(--dd-font); font-size: 11px; font-weight: 800; color: var(--dd-text); background: var(--dd-panel); border: 2px solid var(--dd-line);
    box-shadow: 0 2px 0 var(--dd-line); cursor: pointer; white-space: nowrap; }
.dd-map-tab span { overflow: hidden; text-overflow: ellipsis; }
.dd-map-tab.dd-current { border-color: var(--dd-primary); background: var(--dd-primary-soft); }
.dd-map-tab .dd-tab-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dd-warn); flex: none; }
.dd-map-tab button { border: none; background: transparent; color: var(--dd-faint); cursor: pointer; font-weight: 900; padding: 0 3px; border-radius: 8px; }
.dd-map-tab button:hover { color: var(--dd-danger-dark); background: rgba(0, 0, 0, 0.06); }
#dd-palette .dd-palette-row kbd { margin-left: 8px; padding: 0 5px; border-radius: 5px; font-family: inherit; font-size: 10px; font-weight: 900; color: var(--dd-text); background: var(--dd-panel-2); border: 1px solid var(--dd-line); }
.dd-folder { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 800; color: var(--dd-text); }
.dd-folder:hover { background: var(--dd-primary-soft); }
.dd-folder .dd-folder-count { margin-left: auto; color: var(--dd-faint); font-size: 11px; }
.dd-folder-items { display: grid; gap: 8px; padding: 4px 0 8px; }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Command palette ----
    // How well a query fits a label: in order (CommandPalette.score), or else every word somewhere (lower).
    paletteScore(query, label) {
        const P = DocsDoodads.CommandPalette;
        const direct = P.score(query, label);
        if (direct >= 0) return direct;
        const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
        if (words.length < 2) return -1;
        let total = 0;
        for (const w of words) {
            const s = P.score(w, label);
            if (s < 0) return -1;
            total += s;
        }
        return total * 0.6;
    },

    recentCommands() {
        const list = DocsDoodads.Ui.prefs().recentCommands;
        return Array.isArray(list) ? list.filter(l => typeof l === 'string') : [];
    },

    rememberCommand(label) {
        const next = [label].concat(this.recentCommands().filter(l => l !== label)).slice(0, 8);
        DocsDoodads.Ui.setPref('recentCommands', next);
    },

    // Commands made from what was typed: a time, a map, a season or an editor size.
    paletteValueCommands(query) {
        const q = String(query || '').trim();
        const out = [];
        const time = /^(?:time|clock|at)\s+(\d{1,2})(?:[:.h](\d{2}))?\s*(am|pm)?$/i.exec(q);
        if (time) {
            let h = Number(time[1]) % 24;
            const m = Math.min(59, Number(time[2]) || 0);
            if (time[3] && time[3].toLowerCase() === 'pm' && h < 12) h += 12;
            if (time[3] && time[3].toLowerCase() === 'am' && h === 12) h = 0;
            const minutes = h * 60 + m;
            out.push({ label: `Preview the time ${DocsDoodads.TimeOfDay.format(minutes)}`, group: 'Clock', run: () => { this.stopClock(); this.setClock(minutes); } });
        }
        const map = /^(?:go\s*to\s*)?(?:map\s*)?0*(\d{1,4})$/i.exec(q.replace(/^go\s*to\s*map/i, 'map'));
        if (map && /map|go/i.test(q)) {
            const id = Number(map[1]);
            const entry = this.mapEntries().find(m => m.id === id);
            if (entry) out.push({ label: `Go to map ${id}: ${entry.name}`, group: 'Map', run: () => this.goToMap(id) });
        }
        const season = /^season\s+(.+)$/i.exec(q);
        if (season) {
            const names = (DocsDoodads.World.settings().seasons || {}).names || [];
            const want = season[1].toLowerCase();
            names.forEach((n, i) => {
                if (String(n).toLowerCase().startsWith(want)) out.push({ label: `Preview the season ${n}`, group: 'Clock', run: () => { this.previewSeason = i; this.refreshSpriteset(); this.updateClockBar(); } });
            });
        }
        const size = /^(?:size|scale|zoom ui|ui)\s+(\d{2,3})%?$/i.exec(q);
        if (size && DocsDoodads.Ui.scales.includes(Number(size[1]) / 100)) {
            out.push({ label: `Editor size ${size[1]}%`, group: 'Look', run: () => this.setLook('uiScale', Number(size[1]) / 100) });
        }
        return out;
    },

    // What the palette lists for a query: typed values first, then the best matches (recent ones lifted).
    paletteResults(query, commands, limit = 50) {
        const q = String(query || '').trim();
        const recent = this.recentCommands();
        const boost = label => { const i = recent.indexOf(label); return i < 0 ? 0 : 12 - i; };
        if (!q) {
            const byLabel = new Map(commands.map(c => [c.label, c]));
            const first = recent.map(l => byLabel.get(l)).filter(Boolean).map(c => Object.assign({}, c, { recent: true }));
            return first.concat(commands.filter(c => !recent.includes(c.label))).slice(0, limit);
        }
        const ranked = commands.map(c => ({ c, s: this.paletteScore(q, c.label) }))
            .filter(r => r.s >= 0)
            .map(r => ({ c: r.c, s: r.s + boost(r.c.label) }))
            .sort((a, b) => b.s - a.s)
            .map(r => (recent.includes(r.c.label) ? Object.assign({}, r.c, { recent: true }) : r.c));
        return this.paletteValueCommands(q).concat(ranked).slice(0, limit);
    },

    // A command's name and its shortcut (from "(Ctrl+A)" at the end of the label, or c.keys).
    paletteRowParts(c) {
        const [name, keys] = DocsDoodads.Ui.splitTip(c.label);
        return { name, keys: c.keys || keys };
    },

    // ---- Map tabs: recently opened maps, one click away ----
    recentMaps() {
        const list = DocsDoodads.Ui.prefs().recentMaps;
        return Array.isArray(list) ? list.map(Number).filter(id => id > 0) : [];
    },

    rememberMap(mapId) {
        mapId = Number(mapId);
        if (!(mapId > 0)) return;
        const list = this.recentMaps();
        // A map already in the tabs keeps its place; a new one goes at the end (the oldest drops off).
        const next = list.includes(mapId) ? list : list.concat([mapId]).slice(-8);
        DocsDoodads.Ui.setPref('recentMaps', next);
        this.renderMapTabs();
    },

    forgetMap(mapId) {
        DocsDoodads.Ui.setPref('recentMaps', this.recentMaps().filter(id => id !== Number(mapId)));
        this.renderMapTabs();
    },

    renderMapTabs() {
        if (!this.container || typeof document === 'undefined') return null;
        let strip = document.getElementById('dd-map-tabs');
        if (!strip) {
            strip = document.createElement('div');
            strip.id = 'dd-map-tabs';
            this.container.appendChild(strip);
        }
        const names = new Map(this.mapEntries().map(m => [m.id, m.name]));
        const current = this.currentMapId();
        const P = DocsDoodads.Persistence;
        const ids = this.recentMaps().filter(id => names.has(id) || id === current);
        strip.innerHTML = '';
        strip.style.display = ids.length > 1 ? 'flex' : 'none';
        for (const id of ids) {
            const tab = document.createElement('div');
            tab.className = 'dd-map-tab' + (id === current ? ' dd-current' : '');
            tab.title = `Map ${id}: ${names.get(id) || ''}`;
            if (P.mapHasUnsaved(id)) {
                const dot = document.createElement('i');
                dot.className = 'dd-tab-dot';
                dot.title = 'Not saved';
                tab.appendChild(dot);
            }
            const label = document.createElement('span');
            label.textContent = names.get(id) || `Map ${id}`;
            tab.appendChild(label);
            if (id !== current) {
                const x = document.createElement('button');
                x.type = 'button';
                x.textContent = '×';
                x.title = 'Take this map out of the tabs';
                x.onclick = e => { if (e && e.stopPropagation) e.stopPropagation(); this.forgetMap(id); };
                tab.appendChild(x);
                tab.onclick = () => this.goToMap(id);
            }
            strip.appendChild(tab);
        }
        this.placeReadouts();
        return strip;
    },

    // ---- Folder view: the bag's items in their folders ----
    bagView: 'grid',

    setBagView(view) {
        this.bagView = view === 'folders' ? 'folders' : 'grid';
        DocsDoodads.Ui.setPref('bagView', this.bagView);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-bag-view') : null;
        if (btn) btn.title = this.bagView === 'folders' ? 'Show the items as cards' : 'Show the items in their folders';
        this._gridRange = null;
        this.updateVirtualGrid(true);
        return this.bagView;
    },

    // { name, path, folders: [node], items: [asset], count } from the items' paths.
    folderTree(assets) {
        const root = { name: '', path: '', folders: [], items: [], count: 0, byName: new Map() };
        for (const a of assets || []) {
            const parts = String(a.path || '').replace(/\\/g, '/').split('/');
            parts.pop();
            let node = root;
            node.count++;
            let path = '';
            for (const part of parts) {
                path = path ? path + '/' + part : part;
                let child = node.byName.get(part);
                if (!child) {
                    child = { name: part, path, folders: [], items: [], count: 0, byName: new Map() };
                    node.byName.set(part, child);
                    node.folders.push(child);
                }
                child.count++;
                node = child;
            }
            node.items.push(a);
        }
        // A chain of single folders (img > doodads) reads as one: "img/doodads".
        const squash = node => {
            node.folders.forEach(squash);
            node.folders.sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));
            node.folders = node.folders.map(f => {
                while (f.items.length === 0 && f.folders.length === 1) {
                    const only = f.folders[0];
                    f = Object.assign({}, only, { name: f.name + '/' + only.name });
                }
                return f;
            });
        };
        squash(root);
        return root;
    },

    openFolders() {
        const list = DocsDoodads.Ui.prefs().openFolders;
        return new Set(Array.isArray(list) ? list : []);
    },

    toggleFolder(path) {
        const open = this.openFolders();
        if (open.has(path)) open.delete(path); else open.add(path);
        DocsDoodads.Ui.setPref('openFolders', Array.from(open).slice(-200));
        this.updateVirtualGrid(true);
    },

    renderFolderTree(viewport, assets, cardSize) {
        viewport.innerHTML = '';
        const open = this.openFolders();
        const tree = this.folderTree(assets);
        const cols = Math.max(1, Math.floor(((viewport.clientWidth || 230) + 8) / (cardSize + 8)));
        const addFolder = (node, depth) => {
            const row = document.createElement('div');
            row.className = 'dd-folder';
            row.style.paddingLeft = (6 + depth * 12) + 'px';
            const isOpen = open.has(node.path);
            const part = (tag, text, className) => {
                const el = document.createElement(tag);
                if (className) el.className = className;
                el.textContent = text;
                row.appendChild(el);
                return el;
            };
            part('span', isOpen ? '▾' : '▸');
            part('span', node.name, 'dd-folder-name');
            part('span', String(node.count), 'dd-folder-count');
            row.title = node.path;
            row.onclick = () => this.toggleFolder(node.path);
            viewport.appendChild(row);
            if (!isOpen) return;
            node.folders.forEach(f => addFolder(f, depth + 1));
            if (node.items.length) {
                const grid = document.createElement('div');
                grid.className = 'dd-folder-items';
                grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                grid.style.paddingLeft = (6 + depth * 12) + 'px';
                // A big folder shows its first 300 items; the search narrows it.
                for (const a of node.items.slice(0, 300)) grid.appendChild(this.createCardElement(a, cardSize + 24));
                viewport.appendChild(grid);
            }
        };
        tree.folders.forEach(f => addFolder(f, 0));
        if (tree.items.length) tree.items.slice(0, 300).forEach(a => viewport.appendChild(this.createCardElement(a, cardSize + 24)));
        return tree;
    }
});
