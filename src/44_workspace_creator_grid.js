//==========================================================
// SECTION 25s2: CHARACTER CREATOR GRID PICKER (TILES, FILTER, THUMBNAILS)
//==========================================================
// Clicking a row's value in the Character Creator (or Enter on the row, or the pad's right stick) opens a grid
// of everything the row can take, in the row's order, "None" first where the slot allows it, the current one
// marked. Each tile is the option on its own: the kit's thumbnail (44_workspace_creator_kits.js: the part alone,
// standing and facing down; MZ's own Variation icons where the generator has one), cut to what is drawn and
// kept per kit, body and part. Tiles are drawn as they scroll into view. Typing filters by name; the arrows (or
// the d-pad) move, Enter (or A) picks, Esc clears the filter and then closes (or B). Shared by the LPC, Memao
// and MZ creators.
DocsDoodads.Ui.css += `
#dd-creator .dd-cr-gridpop { left: 50%; top: 84px; transform: translateX(-50%); width: 470px; max-width: calc(100% - 24px); display: flex; flex-direction: column; gap: 8px; }
#dd-creator .dd-cr-gridhead { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; }
#dd-creator .dd-cr-gridhead input { flex: 1; min-width: 0; height: 32px; border-radius: 999px; border: 2px solid #ead8b0; background: #f6efe0; padding: 0 12px; font-family: inherit; font-weight: 800; font-size: 13px; color: #3a2e4d; }
#dd-creator .dd-cr-gridcount { font-size: 11px; font-weight: 800; color: #7a6b8f; white-space: nowrap; }
#dd-creator .dd-cr-grid { display: grid; grid-template-columns: repeat(auto-fill, 66px); gap: 6px; max-height: 420px; overflow-y: auto; padding: 4px; }
#dd-creator .dd-cr-tile { width: 66px; height: 82px; border: 3px solid #f0e2c0; border-radius: 14px; background: #fffaf0; padding: 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; box-shadow: 0 3px 0 #ecd9ad; }
#dd-creator .dd-cr-tile[aria-selected="true"] { border-color: #0b8174; background: #d9f4ef; }
#dd-creator .dd-cr-tile.dd-cr-tile-here { box-shadow: 0 0 0 3px #ffc93c, 0 3px 0 #ecd9ad; }
#dd-creator .dd-cr-tileimg { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 10px; background: #f6efe0; font-size: 11px; font-weight: 800; color: #7a6b8f; overflow: hidden; }
#dd-creator .dd-cr-tileimg img { width: 56px; height: 56px; image-rendering: pixelated; }
#dd-creator .dd-cr-tilename { width: 60px; font-size: 9px; font-weight: 800; color: #5b4c70; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#dd-creator .dd-cr-value { cursor: pointer; font-family: inherit; color: inherit; }
`;

Object.assign(DocsDoodads.Workspace, {
    gridColumns: 6,
    gridFirstBatch: 60,

    // ---- Thumbnails ----

    // One frame of a sheet as its own image.
    creatorFrame(sheet, rect) {
        const C = DocsDoodads.LpcCompose;
        if (!sheet || rect.x + rect.w > sheet.width || rect.y + rect.h > sheet.height) return null;
        const out = C.blank(rect.w, rect.h);
        C.overRect(out, sheet, rect.x, rect.y, 0, 0, rect.w, rect.h);
        return out;
    },

    // An image cut to its drawn pixels (null when nothing is drawn).
    creatorTrim(image) {
        if (!image || !image.data) return null;
        let x0 = image.width, y0 = image.height, x1 = -1, y1 = -1;
        for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
            if (!image.data[(y * image.width + x) * 4 + 3]) continue;
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
        if (x1 < 0) return null;
        return this.creatorFrame(image, { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
    },

    // A tile's picture for a part on the open character's body: { image (trimmed), url }, made once per kit,
    // body and part (a rescan forgets a kit's).
    creatorThumb(part) {
        const c = this._creator, K = this.creatorKit();
        const all = this._creatorThumbs || (this._creatorThumbs = new Map());
        const key = K.id + '|' + c.state.body + '|' + part.id;
        if (all.has(key)) return all.get(key);
        let image = null;
        try { image = K.thumbnail ? K.thumbnail(this, part, c.state.body) : null; } catch (e) { image = null; }
        const thumb = { image: this.creatorTrim(image), url: '' };
        thumb.url = thumb.image ? this.creatorThumbUrl(thumb.image) : '';
        all.set(key, thumb);
        if (all.size > 3000) all.delete(all.keys().next().value);
        return thumb;
    },

    forgetCreatorThumbs(kitId) {
        if (!this._creatorThumbs) return;
        for (const key of [...this._creatorThumbs.keys()]) if (key.startsWith(kitId + '|')) this._creatorThumbs.delete(key);
    },

    // The trimmed picture as a 56-pixel PNG, centred: drawn a whole number of times when it fits, smaller
    // when it doesn't. '' where the page can't make one.
    creatorThumbUrl(image, size = 56) {
        try {
            if (typeof document === 'undefined') return '';
            const src = document.createElement('canvas'), out = document.createElement('canvas');
            if (!src.getContext || !out.getContext) return '';
            src.width = image.width; src.height = image.height;
            const sctx = src.getContext('2d');
            if (!sctx || typeof sctx.createImageData !== 'function') return '';
            const img = sctx.createImageData(image.width, image.height);
            img.data.set(image.data);
            sctx.putImageData(img, 0, 0);
            out.width = out.height = size;
            const ctx = out.getContext('2d');
            const fit = Math.min(size / image.width, size / image.height);
            const k = fit >= 1 ? Math.floor(fit) : fit;
            const w = Math.max(1, Math.round(image.width * k)), h = Math.max(1, Math.round(image.height * k));
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(src, 0, 0, image.width, image.height, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
            return typeof out.toDataURL === 'function' ? out.toDataURL('image/png') : '';
        } catch (e) {
            return '';
        }
    },

    // ---- The grid ----

    // What a row's grid offers: [{ part, name }], "None" (part null) first unless the slot needs a part.
    creatorGridOptions(rowKey) {
        const S = this.creatorSlots(), c = this._creator, slot = S.slot(rowKey);
        if (!slot) return [];
        const list = S.options(this.creatorIndex(), slot, c.state.body, this.creatorSafeOnly()).map(p => ({ part: p, name: p.name }));
        return slot.required ? list : [{ part: null, name: 'None' }].concat(list);
    },

    // The options shown under the filter (indexes into creatorGridOptions).
    creatorGridShown(pop = this._creator.pop) {
        const f = String(pop.filter || '').trim().toLowerCase();
        return this.creatorGridOptions(pop.row).map((o, i) => (!f || o.name.toLowerCase().includes(f) ? i : -1)).filter(i => i >= 0);
    },

    // Opens the grid for a row (not the body type, nor a row with nothing to choose).
    creatorOpenGrid(rowKey) {
        const S = this.creatorSlots(), c = this._creator;
        const slot = S.slot(rowKey);
        if (!c || !slot || this.creatorRowView(Object.assign({ key: rowKey }, slot)).off) return false;
        const options = this.creatorGridOptions(rowKey);
        const pick = c.state.slots[rowKey];
        const at = Math.max(0, options.findIndex(o => (o.part ? o.part.id : null) === (pick ? pick.id : null)));
        c.pop = { kind: 'grid', row: rowKey, filter: '', at };
        DocsDoodads.Ui.sound('cursor');
        this.renderCreator();
        this.creatorSay(`${slot.label}: choose from ${options.length}. Type to find one.`);
        return true;
    },

    creatorGridHtml() {
        const S = this.creatorSlots(), c = this._creator, pop = c.pop, slot = S.slot(pop.row);
        const options = this.creatorGridOptions(pop.row);
        const shown = new Set(this.creatorGridShown());
        const pick = c.state.slots[pop.row];
        const thumbs = this._creatorThumbs || new Map();
        const tile = (o, i) => {
            const current = (o.part ? o.part.id : null) === (pick ? pick.id : null);
            const cached = o.part ? thumbs.get(this.creatorKit().id + '|' + c.state.body + '|' + o.part.id) : null;
            const picture = !o.part ? 'None' : cached ? (cached.url ? `<img src="${cached.url}" alt="" />` : '') : '';
            return `<button type="button" class="dd-cr-tile${i === pop.at ? ' dd-cr-tile-here' : ''}" id="dd-cr-tile-${i}" role="option" aria-selected="${current}" title="${escapeHtml(o.name)}"${shown.has(i) ? '' : ' style="display: none;"'}${o.part && !cached ? ' data-pending="1"' : ''}><span class="dd-cr-tileimg">${picture}</span><span class="dd-cr-tilename">${escapeHtml(o.name)}</span></button>`;
        };
        return `<div class="dd-cr-pop dd-cr-gridpop" id="dd-cr-pop" role="dialog" aria-label="${escapeHtml(slot.label)}: choose">
            <div class="dd-cr-gridhead">${escapeHtml(slot.label)}
                <input type="search" id="dd-cr-grid-filter" value="${escapeHtml(pop.filter || '')}" placeholder="Type to find..." aria-label="Find a ${escapeHtml(slot.label.toLowerCase())}" aria-controls="dd-cr-grid" aria-activedescendant="dd-cr-tile-${pop.at}" />
                <span class="dd-cr-gridcount" id="dd-cr-grid-count">${shown.size} of ${options.length}</span></div>
            <div class="dd-cr-grid" id="dd-cr-grid" role="listbox" aria-label="${escapeHtml(slot.label)}">${options.map(tile).join('')}</div>
        </div>`;
    },

    bindCreatorGrid() {
        const c = this._creator, pop = c.pop;
        const options = this.creatorGridOptions(pop.row);
        options.forEach((o, i) => {
            const el = document.getElementById('dd-cr-tile-' + i);
            if (el) el.onclick = () => this.creatorGridPick(i);
        });
        const input = document.getElementById('dd-cr-grid-filter');
        if (input) {
            input.oninput = e => this.creatorGridFilter(String(e.target.value || ''));
            // The filter takes the keys as soon as the grid opens (typing finds a part).
            if (!pop.focused && input.focus) { pop.focused = true; input.focus(); }
        }
        const grid = document.getElementById('dd-cr-grid');
        if (grid) grid.onscroll = () => this.creatorFillThumbs();
        this.creatorFillThumbs();
        const here = document.getElementById('dd-cr-tile-' + pop.at);
        if (here && typeof here.scrollIntoView === 'function') here.scrollIntoView({ block: 'nearest' });
    },

    // Draws one waiting tile of the open grid (false when the grid has closed or moved to another row).
    creatorFillTile(row, i) {
        const c = this._creator;
        if (!c || !c.pop || c.pop.kind !== 'grid' || c.pop.row !== row || typeof document === 'undefined') return false;
        const el = document.getElementById('dd-cr-tile-' + i), o = this.creatorGridOptions(row)[i];
        if (!el || !o || !o.part) return false;
        const thumb = this.creatorThumb(o.part);
        if (el.removeAttribute) el.removeAttribute('data-pending');
        const box = el.querySelector ? el.querySelector('.dd-cr-tileimg') : null;
        if (box && thumb.url) box.innerHTML = `<img src="${thumb.url}" alt="" />`;
        return true;
    },

    // Draws the tiles still waiting. With IntersectionObserver, those coming into view, a few at a time between
    // frames (gridSliceMs each) so a long row shows its tiles as they come instead of stopping the window;
    // without it (or in tests), the first gridFirstBatch at once and more as the grid scrolls.
    gridSliceMs: 12,

    creatorFillThumbs() {
        const c = this._creator;
        if (!c || !c.pop || c.pop.kind !== 'grid' || typeof document === 'undefined') return 0;
        const row = c.pop.row, options = this.creatorGridOptions(row);
        const pending = this.creatorGridShown().filter(i => options[i].part && !(this._creatorThumbs && this._creatorThumbs.has(this.creatorKit().id + '|' + c.state.body + '|' + options[i].part.id)));
        if (typeof IntersectionObserver !== 'undefined') {
            if (this._creatorGridSeen) this._creatorGridSeen.disconnect();
            const grid = document.getElementById('dd-cr-grid');
            const queue = this._creatorThumbQueue = [];
            const drain = () => {
                const start = Date.now();
                while (queue.length && Date.now() - start < this.gridSliceMs) this.creatorFillTile(row, queue.shift());
                if (queue.length) setTimeout(drain, 0); else queue.draining = false;
            };
            this._creatorGridSeen = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    this._creatorGridSeen.unobserve(entry.target);
                    queue.push(Number(String(entry.target.id).replace('dd-cr-tile-', '')));
                }
                if (queue.length && !queue.draining) { queue.draining = true; setTimeout(drain, 0); }
            }, { root: grid || null, rootMargin: '80px' });
            for (const i of pending) { const el = document.getElementById('dd-cr-tile-' + i); if (el) this._creatorGridSeen.observe(el); }
            return pending.length;
        }
        const batch = pending.slice(0, this.gridFirstBatch);
        batch.forEach(i => this.creatorFillTile(row, i));
        return batch.length;
    },

    // Typing in the grid's search box: tiles that don't match are hidden (the window isn't rebuilt, so the
    // box keeps the focus); the cursor goes to the first match when its tile is hidden.
    creatorGridFilter(text) {
        const c = this._creator;
        if (!c || !c.pop || c.pop.kind !== 'grid') return [];
        c.pop.filter = text;
        const options = this.creatorGridOptions(c.pop.row);
        const shown = this.creatorGridShown();
        const set = new Set(shown);
        options.forEach((o, i) => { const el = document.getElementById('dd-cr-tile-' + i); if (el && el.style) el.style.display = set.has(i) ? '' : 'none'; });
        const count = document.getElementById('dd-cr-grid-count');
        if (count) count.textContent = `${shown.length} of ${options.length}`;
        if (!set.has(c.pop.at) && shown.length) this.creatorGridCursor(shown[0]);
        this.creatorFillThumbs();
        this.creatorSay(shown.length ? `${shown.length} found` : 'Nothing found');
        return shown;
    },

    // The grid's cursor to option i (marked, scrolled to, said).
    creatorGridCursor(i) {
        const c = this._creator, pop = c.pop;
        const old = document.getElementById('dd-cr-tile-' + pop.at);
        if (old && old.classList) old.classList.remove('dd-cr-tile-here');
        pop.at = i;
        const el = document.getElementById('dd-cr-tile-' + i);
        if (el && el.classList) el.classList.add('dd-cr-tile-here');
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
        const input = document.getElementById('dd-cr-grid-filter');
        if (input && input.setAttribute) input.setAttribute('aria-activedescendant', 'dd-cr-tile-' + i);
        const o = this.creatorGridOptions(pop.row)[i];
        const shown = this.creatorGridShown();
        if (o) this.creatorSay(`${o.name}, ${shown.indexOf(i) + 1} of ${shown.length}`);
        return i;
    },

    // Moves the cursor among the shown tiles: dx along a row, dy rows (gridColumns tiles each).
    creatorGridMove(dx, dy) {
        const c = this._creator, shown = this.creatorGridShown();
        if (!shown.length) return false;
        const at = Math.max(0, shown.indexOf(c.pop.at));
        const next = Math.max(0, Math.min(shown.length - 1, at + dx + dy * this.gridColumns));
        this.creatorGridCursor(shown[next]);
        return true;
    },

    creatorGridPick(i = this._creator.pop.at) {
        const S = this.creatorSlots(), c = this._creator, rowKey = c.pop.row;
        const o = this.creatorGridOptions(rowKey)[i];
        if (!o) return false;
        if (this.creatorRemember) this.creatorRemember();
        S.setPart(c.state, this.creatorIndex(), rowKey, o.part);
        c.pop = null;
        this.creatorChanged('ok', this.creatorDescribe(rowKey));
        const value = typeof document !== 'undefined' ? document.getElementById('dd-cr-' + rowKey + '-value') : null;
        if (value && value.focus) value.focus();
        return true;
    },

    // Esc: the filter is cleared first, then the grid closes.
    creatorGridEscape() {
        const c = this._creator;
        if (c.pop.filter) {
            const input = document.getElementById('dd-cr-grid-filter');
            if (input) input.value = '';
            this.creatorGridFilter('');
            return 'cleared';
        }
        const row = c.pop.row;
        c.pop = null;
        this.renderCreator();
        const value = typeof document !== 'undefined' ? document.getElementById('dd-cr-' + row + '-value') : null;
        if (value && value.focus) value.focus();
        return 'closed';
    },

    // Keys while the grid is open (before the window's own): arrows and Home / End move, Enter picks, Esc
    // clears then closes. Left and right are the search box's while it has text. Returns whether it acted.
    creatorGridKey(e) {
        const typing = e.target && e.target.id === 'dd-cr-grid-filter' && String(e.target.value || '');
        const moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        let done = true;
        if (e.key === 'Escape') this.creatorGridEscape();
        else if (e.key === 'Enter') this.creatorGridPick();
        else if (moves[e.key] && !(typing && moves[e.key][1] === 0)) this.creatorGridMove(...moves[e.key]);
        else if ((e.key === 'Home' || e.key === 'End') && !typing) { const s = this.creatorGridShown(); if (s.length) this.creatorGridCursor(e.key === 'Home' ? s[0] : s[s.length - 1]); }
        else done = false;
        if (done) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        return done;
    }
});
