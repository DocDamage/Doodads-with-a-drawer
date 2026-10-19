//==========================================================
// SECTION 25c: WORKSPACE ITEM BAG EXTRAS (SORTING, SEARCH CHIPS, HOVER CARD, EMPTY TABS)
//==========================================================
// Sorting the bag, the search's terms as removable chips with named saved searches beside them, a card
// with an item's details when the mouse rests on it, and a word on what goes in an empty tab.
DocsDoodads.Ui.css += `
/* Item Bag: sort picker, search chips, hover card, empty tabs. */
#dd-bag-sort { flex: 1; min-width: 84px; width: auto; max-width: 118px; height: 26px; min-height: 26px !important; padding: 2px 6px !important; font-size: 11px !important; }
#dd-search-chips { display: flex; flex-wrap: wrap; gap: 4px; }
#dd-search-chips:empty { display: none; }
.dd-chip {
    display: inline-flex; align-items: center; gap: 3px; max-width: 100%; padding: 2px 4px 2px 8px; border-radius: 12px;
    font-size: 11px; font-weight: 800; line-height: 18px; color: var(--dd-text); background: var(--dd-primary-soft);
    border: 2px solid var(--dd-primary-line); cursor: default; overflow: hidden;
}
.dd-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-chip.dd-chip-saved { background: var(--dd-warn-soft); border-color: #f2d36b; cursor: pointer; }
.dd-chip.dd-chip-save { background: var(--dd-panel); border-color: var(--dd-line); cursor: pointer; padding-right: 8px; }
.dd-chip button { border: none; background: transparent; color: var(--dd-muted); font-weight: 900; cursor: pointer; padding: 0 4px; font-size: 12px; line-height: 16px; border-radius: 8px; }
.dd-chip button:hover { background: rgba(0, 0, 0, 0.08); color: var(--dd-danger-dark); }
#dd-hover-card { position: fixed; z-index: 10018; width: 230px; padding: 10px 12px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; animation: dd-rise 0.15s ease; }
#dd-hover-card .dd-hc-name { font-weight: 900; font-size: 13px; color: var(--dd-text); overflow-wrap: anywhere; }
#dd-hover-card .dd-hc-path { color: var(--dd-faint); overflow-wrap: anywhere; }
#dd-hover-card .dd-hc-row { display: flex; justify-content: space-between; gap: 8px; color: var(--dd-muted); }
#dd-hover-card .dd-hc-row b { color: var(--dd-text); text-align: right; }
#dd-hover-card .dd-hc-links { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
#dd-hover-card .dd-hc-links .dd-btn { padding: 3px 8px; font-size: 11px; }
.dd-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 18px 10px; text-align: center; color: var(--dd-muted); font-size: 12px; font-weight: 700; line-height: 1.45; }
.dd-empty b { color: var(--dd-text); font-size: 13px; }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Sorting ----
    bagSorts: [
        { value: 'search', label: 'Best match' },
        { value: 'name', label: 'Name' },
        { value: 'added', label: 'Newest first' },
        { value: 'size', label: 'Biggest first' },
        { value: 'placed', label: 'Most placed' },
        { value: 'last', label: 'Last placed' }
    ],
    bagSort: 'search',

    // A sorted copy (the list keeps its order for 'search', and Recent and Look-alikes keep theirs).
    sortAssets(list, mode) {
        const by = {
            name: (a, b) => String(a.fileName || '').localeCompare(String(b.fileName || ''), undefined, { numeric: true, sensitivity: 'base' }),
            added: (a, b) => (Number(b.addedAt || b.mtimeMs) || 0) - (Number(a.addedAt || a.mtimeMs) || 0),
            size: (a, b) => ((Number(b.width) || 0) * (Number(b.height) || 0)) - ((Number(a.width) || 0) * (Number(a.height) || 0)),
            placed: (a, b) => ((b.usage && b.usage.useCount) || 0) - ((a.usage && a.usage.useCount) || 0),
            last: (a, b) => ((b.usage && b.usage.lastUsedAt) || 0) - ((a.usage && a.usage.lastUsedAt) || 0)
        }[mode];
        if (!by) return list;
        // Ties keep the order they came in.
        return list.map((a, i) => [a, i]).sort((x, y) => by(x[0], y[0]) || x[1] - y[1]).map(x => x[0]);
    },

    setBagSort(mode) {
        this.bagSort = this.bagSorts.some(s => s.value === mode) ? mode : 'search';
        DocsDoodads.Ui.setPref('bagSort', this.bagSort);
        const select = typeof document !== 'undefined' ? document.getElementById('dd-bag-sort') : null;
        if (select) select.value = this.bagSort;
        this._drawerView = null; // a new order starts at the top
        this.refreshDrawerCards();
    },

    // ---- Search chips: the terms typed, each removable, and saved searches to bring back ----
    setSearchQuery(query) {
        this.searchQuery = String(query || '').replace(/\s+/g, ' ').trim();
        const input = typeof document !== 'undefined' ? document.getElementById('dd-search-input') : null;
        if (input) input.value = this.searchQuery;
        this.refreshDrawerCards();
        this.refreshCollectionPicker();
        this.refreshSearchChips();
    },

    removeSearchToken(index) {
        const tokens = DocsDoodads.Search.tokens(this.searchQuery);
        tokens.splice(index, 1);
        this.setSearchQuery(tokens.join(' '));
    },

    async saveCurrentSearch() {
        const query = String(this.searchQuery || '').trim();
        if (!query) return null;
        const name = await DocsDoodads.Ui.prompt(`Keep "${query}" as a chip under the search box. Name it:`,
            query.length > 24 ? query.slice(0, 24) : query, { title: 'Save search', ok: 'Save', icon: 'search' });
        if (!name || !name.trim()) return null;
        DocsDoodads.AssetIndex.saveSearch(name.trim(), query);
        this.refreshSearchChips();
        this.showToast(`Saved the search "${name.trim()}".`, 'success');
        return name.trim();
    },

    refreshSearchChips() {
        const box = typeof document !== 'undefined' ? document.getElementById('dd-search-chips') : null;
        if (!box) return;
        box.innerHTML = '';
        const make = (className, text, title) => {
            const chip = document.createElement('div');
            chip.className = 'dd-chip ' + className;
            const label = document.createElement('span');
            label.textContent = text;
            chip.appendChild(label);
            if (title) chip.title = title;
            box.appendChild(chip);
            return chip;
        };
        const closeButton = (chip, title, run) => {
            const x = document.createElement('button');
            x.type = 'button';
            x.textContent = '×';
            x.title = title;
            x.onclick = e => { if (e && e.stopPropagation) e.stopPropagation(); run(); };
            chip.appendChild(x);
        };
        const tokens = DocsDoodads.Search.tokens(this.searchQuery);
        // One chip per term is only worth it once there is more than a single word.
        if (tokens.length > 1 || (tokens.length === 1 && /:/.test(tokens[0]))) {
            tokens.forEach((token, i) => closeButton(make('dd-chip-term', token, 'Part of the search'), 'Take this out of the search', () => this.removeSearchToken(i)));
        }
        const saved = DocsDoodads.AssetIndex.savedSearches();
        const current = String(this.searchQuery || '').trim();
        for (const s of saved) {
            const chip = make('dd-chip-saved', s.name, `Search for: ${s.query}`);
            chip.onclick = () => this.setSearchQuery(s.query);
            closeButton(chip, 'Forget this saved search', () => { DocsDoodads.AssetIndex.deleteSearch(s.name); this.refreshSearchChips(); });
        }
        if (current && !saved.some(s => s.query === current)) {
            const chip = make('dd-chip-save', '☆ Save search', 'Keep this search as a chip');
            chip.onclick = () => this.saveCurrentSearch();
        }
    },

    // ---- The hover card: what an item is, how it is used, and where to change it ----
    hoverCardFacts(asset) {
        const frames = DocsDoodads.AnimatedThumb.framesFor(asset);
        const index = DocsDoodads.Usage.lastIndex;
        const used = asset.type === 'prefab' || !index ? null : (index.get(DocsDoodads.Usage.keyOf(asset.path)) || []).length;
        const depth = DocsDoodads.Depth.modes.includes(asset.placement && asset.placement.depth) ? asset.placement.depth : DocsDoodads.Depth.suggestFor(asset);
        const facts = [];
        if (asset.width && asset.height) facts.push(['Size', `${asset.width} × ${asset.height} px`]);
        facts.push(['Frames', frames && frames.length > 1 ? `${frames.length} (animated)` : '1']);
        if (asset.category !== 'Audio' && asset.type !== 'prefab') facts.push(['Depth', (DocsDoodads.Depth.labels[depth] || depth).replace(/ \(.*\)$/, '')]);
        if (asset.type !== 'prefab') facts.push(['Used in', used === null ? 'press Where Used' : `${used} place(s)`]);
        if (asset.usage && asset.usage.useCount) facts.push(['Placed', `${asset.usage.useCount} time(s)`]);
        return facts;
    },

    showHoverCard(asset, card) {
        if (typeof document === 'undefined' || !asset || !this.mounted) return null;
        this.hideHoverCard(true);
        const el = document.createElement('div');
        el.id = 'dd-hover-card';
        el.className = 'dd-glass';
        const add = (tag, className, text) => {
            const n = document.createElement(tag);
            if (className) n.className = className;
            if (text !== undefined) n.textContent = text;
            el.appendChild(n);
            return n;
        };
        add('div', 'dd-hc-name', asset.fileName || '');
        if (asset.path) add('div', 'dd-hc-path', asset.path);
        for (const [label, value] of this.hoverCardFacts(asset)) {
            const row = add('div', 'dd-hc-row');
            const l = document.createElement('span'); l.textContent = label;
            const v = document.createElement('b'); v.textContent = value;
            row.appendChild(l); row.appendChild(v);
        }
        const links = add('div', 'dd-hc-links');
        const link = (text, run) => {
            const b = document.createElement('button');
            b.className = 'dd-btn';
            b.type = 'button';
            b.textContent = text;
            b.onclick = () => { this.hideHoverCard(true); run(); };
            links.appendChild(b);
        };
        link('Details', () => this.selectAsset(asset));
        if (asset.category !== 'Audio' && asset.type !== 'prefab') link('Cut Up', () => DocsDoodads.Slicing.Editor.open(asset));
        if (asset.type !== 'prefab') link('Where Used', () => { this.refreshUsageIndex(); this.showHoverCard(asset, card); });
        // Beside the bag, level with the card; it stays while the mouse is on it.
        const rect = card && card.getBoundingClientRect ? card.getBoundingClientRect() : { right: 260, top: 120 };
        const drawer = document.getElementById('dd-drawer-panel');
        const edge = drawer && drawer.getBoundingClientRect ? drawer.getBoundingClientRect().right : rect.right;
        const roomH = (typeof window !== 'undefined' && window.innerHeight) || 624;
        // The card is on the page; the bag may be zoomed (its rects are in its own units).
        const scale = this.uiScaleNow ? this.uiScaleNow() : 1;
        el.style.left = Math.round(Math.max(edge, rect.right) * scale + 10) + 'px';
        el.style.top = Math.round(Math.max(8, Math.min(roomH - 220, rect.top * scale))) + 'px';
        el.onmouseenter = () => clearTimeout(this._hoverHide);
        el.onmouseleave = () => this.hideHoverCard();
        document.body.appendChild(el);
        this._hoverCard = { el, asset };
        return el;
    },

    // now: at once; otherwise after a moment, so the mouse can cross to the card.
    hideHoverCard(now) {
        clearTimeout(this._hoverHide);
        const go = () => {
            const card = this._hoverCard;
            this._hoverCard = null;
            if (card && card.el.parentNode) card.el.parentNode.removeChild(card.el);
        };
        if (now) go(); else this._hoverHide = setTimeout(go, 220);
    },

    // The bag's cards call these on mouse enter and leave: the card shows after a short rest.
    hoverCardEnter(asset, card) {
        clearTimeout(this._hoverShow);
        clearTimeout(this._hoverHide);
        if (this._hoverCard && this._hoverCard.asset === asset) return;
        this._hoverShow = setTimeout(() => {
            if (!card || card.isConnected !== false) this.showHoverCard(asset, card);
        }, 550);
    },

    hoverCardLeave() {
        clearTimeout(this._hoverShow);
        this.hideHoverCard();
    },

    // ---- Empty tabs: what goes here, and a button to do it ----
    emptyBagState() {
        const searching = String(this.searchQuery || '').trim();
        const all = { label: 'Show Everything', run: () => { this._categoryChosen = true; this.setCategory('All'); } };
        if (searching) {
            return { title: 'Nothing matches', text: `No items match "${searching}"${this.currentCategory !== 'All' ? ` in ${this.categoryName(this.currentCategory)}` : ''}.`,
                button: { label: 'Clear the Search', run: () => this.setSearchQuery('') } };
        }
        const states = {
            Doodads: { title: 'No doodads yet', text: 'Put pictures in img/doodads, or drop image files from your computer onto this window to bring them in.', button: { label: 'Bring In Files...', run: () => this.pickFilesToImport() } },
            Favorites: { title: 'No favourites yet', text: 'Right-click an item and choose Add to Favorites, or press ☆ Favorite in its details.', button: all },
            Recent: { title: 'Nothing placed yet', text: 'The items you place on maps show here, most recent first.', button: all },
            Prefabs: { title: 'No prefabs yet', text: 'Pick a few doodads on the map, then press Save Prefab in Details to keep them as one item.', button: { label: 'Show Doodads', run: () => { this._categoryChosen = true; this.setCategory('Doodads'); } } },
            Similar: { title: 'Nothing to compare', text: 'Right-click an item and choose More Like This to see pictures that look like it.', button: all },
            All: { title: 'The bag is empty', text: 'No pictures or sounds were found in this project yet. Drop files onto this window to bring them in.', button: { label: 'Bring In Files...', run: () => this.pickFilesToImport() } }
        };
        return states[this.currentCategory] || { title: `No ${this.categoryName(this.currentCategory).toLowerCase()} here`, text: 'This project has none of these files yet.', button: all };
    },

    renderEmptyBag(viewport) {
        const state = this.emptyBagState();
        viewport.innerHTML = '';
        const box = document.createElement('div');
        box.className = 'dd-empty';
        const title = document.createElement('b');
        title.textContent = state.title;
        const text = document.createElement('div');
        text.textContent = state.text;
        box.appendChild(title);
        box.appendChild(text);
        if (state.button) {
            const btn = document.createElement('button');
            btn.className = 'dd-btn dd-btn-primary';
            btn.type = 'button';
            btn.textContent = state.button.label;
            btn.onclick = () => state.button.run();
            box.appendChild(btn);
        }
        viewport.appendChild(box);
        return state;
    },

    // A file picker for the same import as dropping files on the window.
    pickFilesToImport() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        // Only what the import takes (Import.isSupported): offering more only to refuse it later confuses.
        const I = DocsDoodads.Import;
        input.accept = Array.from(I.imageExtensions).concat(Array.from(I.audioExtensions)).join(',');
        input.onchange = () => {
            const paths = Array.from(input.files || []).map(f => f.path).filter(Boolean);
            if (paths.length) this.showAssetImportModal(paths);
        };
        if (typeof input.click === 'function') input.click();
        return true;
    }
});
