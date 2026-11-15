//==========================================================
// SECTION 25f: MAP PICTURE CACHE AND UI
//==========================================================
(function(MapThumb, Workspace) {
    MapThumb._pending = {};
    MapThumb._tokens = {};
    MapThumb._urlCache = new Map();
    MapThumb._volatile = new Map();
    MapThumb._invalid = new Set();
    MapThumb.maxUrls = 32;
    MapThumb.maxVolatile = 8;

    MapThumb.status = function(mapId) {
        const picturePath = this.cachePath(mapId), sourcePath = this.sourcePath(mapId);
        const state = this.freshness(DocsDoodads.FS.stat(sourcePath), DocsDoodads.FS.stat(picturePath));
        if (this._invalid.has(Number(mapId))) state.fresh = false;
        return Object.assign(state, { path: picturePath, sourcePath });
    };

    MapThumb.url = function(mapId) {
        if (this._volatile.has(Number(mapId))) {
            const value = this._volatile.get(Number(mapId));
            this._volatile.delete(Number(mapId));
            this._volatile.set(Number(mapId), value);
            return value;
        }
        const status = this.status(mapId);
        if (!status.fresh) return '';
        const stat = DocsDoodads.FS.stat(status.path);
        const key = `${mapId}:${this.revision(stat)}`;
        if (this._urlCache.has(key)) {
            const value = this._urlCache.get(key);
            this._urlCache.delete(key);
            this._urlCache.set(key, value);
            return value;
        }
        const value = encodeURI(status.path.replace(/\\/g, '/')) + '?v=' + encodeURIComponent(this.revision(stat));
        while (this._urlCache.size >= this.maxUrls) this._urlCache.delete(this._urlCache.keys().next().value);
        this._urlCache.set(key, value);
        return value;
    };

    MapThumb.write = function(mapId, canvas, volatile) {
        const dataUrl = canvas && canvas.toDataURL ? canvas.toDataURL('image/png') : '';
        if (volatile && /^data:image\/png;base64,/i.test(dataUrl)) {
            while (this._volatile.size >= this.maxVolatile) this._volatile.delete(this._volatile.keys().next().value);
            this._volatile.set(Number(mapId), dataUrl);
            return true;
        }
        const bytes = this.pngBytes(dataUrl);
        if (!bytes) return false;
        if (!DocsDoodads.FS.existsSync(this.cacheDir)) DocsDoodads.FS.mkdirp(this.cacheDir);
        DocsDoodads.FS.atomicWriteFile(this.cachePath(mapId), bytes);
        this._volatile.delete(Number(mapId));
        this._invalid.delete(Number(mapId));
        for (const key of Array.from(this._urlCache.keys())) if (key.indexOf(mapId + ':') === 0) this._urlCache.delete(key);
        return true;
    };

    MapThumb.invalidate = function(mapId) {
        mapId = Number(mapId);
        this._tokens[mapId] = (this._tokens[mapId] || 0) + 1;
        this._volatile.delete(mapId);
        this._invalid.add(mapId);
        for (const key of Array.from(this._urlCache.keys())) if (key.indexOf(mapId + ':') === 0) this._urlCache.delete(key);
        const path = this.cachePath(mapId);
        try {
            if (DocsDoodads.FS.existsSync(path)) DocsDoodads.FS.fs.unlinkSync(path);
            return true;
        } catch (error) {
            DocsDoodads.Core.log(`Map ${mapId} picture cache could not be invalidated.`, error);
            return false;
        }
    };

    MapThumb.invalidateMany = function(mapIds) {
        for (const mapId of mapIds || []) this.invalidate(mapId);
    };

    MapThumb.clearVolatile = function(mapIds) {
        if (!mapIds) { this._volatile.clear(); return; }
        for (const mapId of mapIds) this._volatile.delete(Number(mapId));
    };

    MapThumb.shouldStayVolatile = function(mapId) {
        const persistence = DocsDoodads.Persistence;
        return Boolean(persistence.dirtyDoodads || persistence.mapHasUnsaved(mapId));
    };

    MapThumb.stateRevision = function(mapId) {
        const persistence = DocsDoodads.Persistence;
        return `${persistence.changeCount}:${persistence.dirtyDoodads ? 1 : 0}:${persistence.mapHasUnsaved(mapId) ? 1 : 0}`;
    };

    MapThumb.request = function(mapId, options) {
        options = options || {};
        mapId = Number(mapId);
        try {
            if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs() || !DocsDoodads.FS.fs) return Promise.resolve(false);
            if (!window.$gameMap || Number(window.$gameMap.mapId()) !== mapId) return Promise.resolve(false);
            const volatile = this.shouldStayVolatile(mapId);
            if (!options.force && !volatile && this.status(mapId).fresh) return Promise.resolve(true);
            const stateRevision = this.stateRevision(mapId);
            const waiting = this._pending[mapId];
            if (waiting) {
                if (waiting.revision === stateRevision && waiting.token === this._tokens[mapId]) return waiting.promise;
                return waiting.promise.then(() => this.request(mapId, { force: true }));
            }
            const snapshot = this.snapshotCurrent(mapId);
            if (!snapshot) return Promise.resolve(false);
            snapshot.unsaved = volatile;
            const sourceRevision = this.revision(DocsDoodads.FS.stat(this.sourcePath(mapId)));
            const token = this._tokens[mapId] = (this._tokens[mapId] || 0) + 1;
            let rendering;
            try { rendering = this.render(snapshot); } catch (error) { rendering = Promise.reject(error); }
            const entry = { promise: null, revision: stateRevision, token };
            const promise = Promise.resolve(rendering).then(canvas => {
                if (this._tokens[mapId] !== token || this.stateRevision(mapId) !== stateRevision) return false;
                if (this.revision(DocsDoodads.FS.stat(this.sourcePath(mapId))) !== sourceRevision) return false;
                const written = this.write(mapId, canvas, snapshot.unsaved);
                if (canvas) canvas.width = canvas.height = 1;
                if (written && Workspace.refreshMapThumbUi) Workspace.refreshMapThumbUi(mapId);
                return written;
            }).catch(error => {
                DocsDoodads.Core.log(`Map ${mapId} picture was not made.`, error);
                return false;
            }).then(result => {
                if (this._pending[mapId] === entry) delete this._pending[mapId];
                return result;
            });
            entry.promise = promise;
            this._pending[mapId] = entry;
            return promise;
        } catch (error) {
            DocsDoodads.Core.log(`Map ${mapId} picture was not queued.`, error);
            return Promise.resolve(false);
        }
    };

    MapThumb.markup = function(mapId, name, className) {
        const label = String(name || `Map ${mapId}`);
        const url = this.url(mapId);
        if (url) return `<img class="${className || 'dd-map-thumb'}" src="${escapeHtml(url)}" alt="${escapeHtml(label)} map preview" />`;
        return `<span class="${className || 'dd-map-thumb'} dd-map-thumb-empty" role="img" aria-label="${escapeHtml(label)} has no map preview yet">${escapeHtml(label)}</span>`;
    };

    MapThumb.decorateTooltip = function(element, tooltip) {
        if (!element || !tooltip || !element.getAttribute || !tooltip.appendChild) return tooltip;
        const mapId = Number(element.getAttribute('data-dd-map-thumb'));
        if (!(mapId > 0)) return tooltip;
        const name = element.getAttribute('data-dd-map-name') || `Map ${mapId}`;
        const url = this.url(mapId);
        const preview = document.createElement(url ? 'img' : 'div');
        preview.className = url ? 'dd-map-tip-picture' : 'dd-map-tip-picture dd-map-thumb-empty';
        if (url) { preview.src = url; preview.alt = `${name} map preview`; }
        else { preview.textContent = name; preview.setAttribute('role', 'img'); preview.setAttribute('aria-label', `${name} has no map preview yet`); }
        tooltip.insertBefore ? tooltip.insertBefore(preview, tooltip.firstChild || null) : tooltip.appendChild(preview);
        return tooltip;
    };

    Object.assign(Workspace, {
        mapThumb(mapId, options) {
            return MapThumb.request(mapId, options);
        },

        mapThumbMarkup(mapId, name, className) {
            return MapThumb.markup(mapId, name, className);
        },

        refreshMapThumbUi(mapId) {
            mapId = Number(mapId);
            if (this.mounted && this.renderMapTabs) this.renderMapTabs();
            if (typeof document !== 'undefined') {
                const select = document.getElementById('dd-map-goto');
                const preview = document.getElementById('dd-map-goto-preview');
                if (select && preview && Number(select.value) === mapId) {
                    const entry = this.mapEntries().find(map => map.id === mapId);
                    preview.innerHTML = this.mapThumbMarkup(mapId, entry && entry.name);
                }
            }
            if (typeof this._worldThumbRefresh === 'function') this._worldThumbRefresh(mapId);
        }
    });
})(DocsDoodads.MapThumb, DocsDoodads.Workspace);

DocsDoodads.Ui.css += `
.dd-map-thumb { width: 44px; height: 32px; object-fit: cover; flex: none; border-radius: 4px; border: 1px solid var(--dd-line); image-rendering: pixelated; background: var(--dd-field); }
.dd-map-thumb-empty { display: inline-flex; align-items: center; justify-content: center; overflow: hidden; padding: 2px; box-sizing: border-box; color: var(--dd-faint); font-size: 8px; line-height: 1.1; text-align: center; }
.dd-map-tip-picture { display: flex; width: 256px; max-width: 55vw; max-height: 256px; object-fit: contain; margin-bottom: 6px; border-radius: 5px; image-rendering: pixelated; }
.dd-map-tip-picture.dd-map-thumb-empty { min-height: 72px; align-items: center; justify-content: center; background: var(--dd-field); }
`;

