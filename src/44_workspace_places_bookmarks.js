//==========================================================
// SECTION 25: WORKSPACE: BOOKMARKS
//==========================================================
// Places on big maps to jump back to (DocsDoodads.Bookmarks, 11_ruler_bookmarks.js). Bookmark This View
// (More, Ctrl+K) keeps the map, the tile in the middle of the view and, in 3D, the camera. Each bookmark is a
// palette entry ("Go to: Inn") and a row in the Bookmarks card; the first nine are Ctrl+1 to Ctrl+9. Going to
// one on another map opens that map first (as Problems' Go To does), then centres the view there.
DocsDoodads.Ui.css += `
#dd-bookmarks { position: fixed; z-index: 10033; width: 320px; max-width: calc(100vw - 32px); max-height: 70vh; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
#dd-bookmarks .dd-bm-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
#dd-bookmarks .dd-bm-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 10px; background: var(--dd-panel-2); }
#dd-bookmarks .dd-bm-name { flex: 1; min-width: 0; color: var(--dd-text); font-weight: 700; overflow-wrap: anywhere; }
#dd-bookmarks .dd-bm-where { color: var(--dd-muted); white-space: nowrap; }
#dd-bookmarks .dd-bm-key { color: var(--dd-faint); font-size: 10px; white-space: nowrap; }
#dd-bookmarks .dd-btn { padding: 3px 7px; font-size: 11px; }
`;

Object.assign(DocsDoodads.Workspace, {
    // The tile in the middle of the view.
    viewCentreTile() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return { x: 0, y: 0 };
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const w = typeof Graphics !== 'undefined' ? Graphics.width : 816, h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const P = DocsDoodads.Perspective;
        if (P && P.liveCamera && P.liveCamera()) {
            // The ground point in the middle of the 3D view.
            const at = DocsDoodads.screenPointToMap(w / 2, h / 2);
            if (at) return { x: Math.floor(at.x / tw), y: Math.floor(at.y / th) };
        }
        return { x: Math.floor($gameMap.displayX() + w / tw / 2), y: Math.floor($gameMap.displayY() + h / th / 2) };
    },

    async bookmarkView() {
        const mapId = this.currentMapId();
        if (!mapId) return null;
        const at = this.viewCentreTile();
        const info = typeof window !== 'undefined' && window.$dataMapInfos ? window.$dataMapInfos[mapId] : null;
        const suggestion = `${info && info.name ? info.name : 'Map ' + mapId} ${at.x}, ${at.y}`;
        const name = await DocsDoodads.Ui.prompt('A name for this place:', suggestion, { title: 'Bookmark This View', ok: 'Bookmark' });
        if (name === null || !String(name).trim()) return null;
        const camera = typeof $gameMap !== 'undefined' && $gameMap && $gameMap._docsCamera && DocsDoodads.Perspective.liveCamera() ? $gameMap._docsCamera : null;
        const b = DocsDoodads.Bookmarks.add({ name, mapId, x: at.x, y: at.y, camera });
        if (!b) return null;
        DocsDoodads.Persistence.dirtyDoodads = true;
        const n = DocsDoodads.Bookmarks.list().indexOf(b) + 1;
        this.showToast(`Bookmarked "${b.name}"${n <= 9 ? ` (Ctrl+${n})` : ''}.`);
        if (this._bookmarksOpen) this.renderBookmarks();
        return b;
    },

    goToBookmark(b) {
        if (!b) return false;
        if (b.mapId !== this.currentMapId()) {
            this._pendingBookmark = b;
            this.goToMap(b.mapId);
            return true;
        }
        this._pendingBookmark = null;
        this.centerOnTile(b.x, b.y);
        if (b.camera) this.setCameraView(b.camera);
        return true;
    },

    // Ctrl+1 to Ctrl+9.
    goToBookmarkNumber(n) {
        const b = DocsDoodads.Bookmarks.list()[n - 1];
        if (!b) {
            this.showToast(`No bookmark ${n} yet: More → Bookmarks, or Ctrl+K "Bookmark This View".`);
            return false;
        }
        return this.goToBookmark(b);
    },

    // Once the other map has loaded (called with Problems' Go To).
    finishPendingBookmark() {
        const b = this._pendingBookmark;
        if (!b || b.mapId !== this.currentMapId()) return false;
        return this.goToBookmark(b);
    },

    async renameBookmark(id) {
        const b = DocsDoodads.Bookmarks.get(id);
        if (!b) return false;
        const name = await DocsDoodads.Ui.prompt('A new name:', b.name, { title: 'Rename Bookmark', ok: 'Rename' });
        if (name === null || !DocsDoodads.Bookmarks.rename(id, name)) return false;
        DocsDoodads.Persistence.dirtyDoodads = true;
        if (this._bookmarksOpen) this.renderBookmarks();
        return true;
    },

    changeBookmarks(change) {
        if (!change()) return false;
        DocsDoodads.Persistence.dirtyDoodads = true;
        if (this._bookmarksOpen) this.renderBookmarks();
        return true;
    },

    // Palette entries: Bookmark This View, and Go to: each one.
    bookmarkCommands() {
        const K = id => DocsDoodads.Shortcuts.label(id) || undefined;
        const out = [{ label: 'Bookmark This View', run: () => this.bookmarkView() }, { label: 'Bookmarks', run: () => this.showBookmarks() }];
        DocsDoodads.Bookmarks.list().forEach((b, i) => out.push({ label: `Go to: ${b.name}`, run: () => this.goToBookmark(b), keys: i < 9 ? K('bookmark' + (i + 1)) : undefined }));
        return out;
    },

    // ---- The card ----
    showBookmarks() {
        if (typeof document === 'undefined') return null;
        this._bookmarksOpen = true;
        return this.renderBookmarks();
    },

    closeBookmarks() {
        this._bookmarksOpen = false;
        const el = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-bookmarks') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    renderBookmarks() {
        if (typeof document === 'undefined' || !this._bookmarksOpen) return null;
        const U = DocsDoodads.Ui, B = DocsDoodads.Bookmarks;
        let panel = document.getElementById('dd-bookmarks');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'dd-bookmarks';
            panel.className = 'dd-glass';
            document.body.appendChild(panel);
        }
        const list = B.list();
        const here = this.currentMapId();
        panel.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">🔖 Bookmarks (${list.length})</span>
                <button class="dd-btn dd-fold" id="dd-bm-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div><button class="dd-btn dd-btn-primary" id="dd-bm-add" type="button">${U.icon('plus', 1)} Bookmark This View</button></div>
            <div class="dd-bm-list" id="dd-bm-list"></div>`;
        const rows = document.getElementById('dd-bm-list');
        if (rows) {
            if (!list.length) {
                const empty = document.createElement('div');
                empty.className = 'dd-empty';
                empty.textContent = 'No bookmarks yet. Move the view to a place, then Bookmark This View.';
                rows.appendChild(empty);
            }
            list.forEach((b, i) => {
                const row = document.createElement('div');
                row.className = 'dd-bm-row';
                const add = (tag, cls, text, title, run) => {
                    const el = document.createElement(tag);
                    if (cls) el.className = cls;
                    if (tag === 'button') el.type = 'button';
                    el.textContent = text;
                    if (title) el.title = title;
                    if (run) el.onclick = run;
                    row.appendChild(el);
                    return el;
                };
                add('span', 'dd-bm-name', b.name, 'Rename', () => this.renameBookmark(b.id)).style.cursor = 'pointer';
                add('span', 'dd-bm-where', (b.mapId === here ? '' : `Map ${b.mapId} · `) + `${b.x}, ${b.y}`);
                if (i < 9) add('span', 'dd-bm-key', `Ctrl+${i + 1}`);
                add('button', 'dd-btn', 'Go To', '', () => this.goToBookmark(b));
                add('button', 'dd-btn', '↑', 'Up (the first nine have Ctrl+1 to Ctrl+9)', () => this.changeBookmarks(() => B.shift(b.id, -1)));
                const del = add('button', 'dd-btn', '', 'Delete this bookmark', () => this.changeBookmarks(() => B.remove(b.id)));
                del.innerHTML = U.icon('trash', 1);
                rows.appendChild(row);
            });
        }
        const on = (id, run) => { const el = document.getElementById(id); if (el) el.onclick = run; };
        on('dd-bm-close', () => this.closeBookmarks());
        on('dd-bm-add', () => this.bookmarkView());
        this.placeReadouts();
        return panel;
    }
});
