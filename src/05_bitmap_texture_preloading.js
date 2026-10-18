//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
DocsDoodads.loadBitmap = function(path) {
    if (typeof ImageManager === 'undefined') return null;
    const full = String(path).replace(/\\/g, '/');
    const MA = DocsDoodads.MissingArt;
    const versioned = DocsDoodads.LiveReload ? DocsDoodads.LiveReload.urlFor(full) : full;
    if (versioned !== full && typeof ImageManager.loadBitmapFromUrl === 'function') {
        return MA.track(ImageManager.loadBitmapFromUrl(versioned));
    }
    path = full;
    if (path.startsWith('img/')) {
        path = path.slice(4);
    }
    const slash = path.indexOf('/');
    const folder = slash > -1 ? 'img/' + path.slice(0, slash + 1) : 'img/';
    const file = (slash > -1 ? path.slice(slash + 1) : path).replace(/\.[^/.]+$/, "");
    // Known to be missing: nothing to wait for (and no new request on every map).
    if (MA.isMissing(folder, file)) return ImageManager._emptyBitmap || null;
    return MA.track(ImageManager.loadBitmap(folder, file));
};

// The art Doc's Doodads places is decoration: a picture that can't be loaded (left out of a deployed
// build by "Exclude unused files", renamed, deleted) is skipped with a warning instead of stopping the
// game with MZ's "Failed to load" screen. MZ shows that screen when ImageManager.isReady finds a failed
// picture in its cache, so the plugin's own failed pictures are taken out of the cache first.
DocsDoodads.MissingArt = {
    _art: typeof WeakSet !== 'undefined' ? new WeakSet() : null,
    missing: new Set(),

    urlFor(folder, file) {
        const encode = typeof Utils !== 'undefined' && Utils.encodeURI ? Utils.encodeURI : encodeURI;
        return folder + encode(file) + '.png';
    },

    isMissing(folder, file) {
        return this.missing.has(this.urlFor(folder, file));
    },

    track(bitmap) {
        if (bitmap && this._art && typeof bitmap === 'object') this._art.add(bitmap);
        return bitmap;
    },

    // Takes the plugin's failed pictures out of MZ's image cache; returns how many.
    drop() {
        if (typeof ImageManager === 'undefined' || !this._art) return 0;
        let dropped = 0;
        for (const cache of [ImageManager._cache, ImageManager._system]) {
            if (!cache) continue;
            for (const key of Object.keys(cache)) {
                const bitmap = cache[key];
                if (!bitmap || !this._art.has(bitmap) || typeof bitmap.isError !== 'function' || !bitmap.isError()) continue;
                delete cache[key];
                dropped++;
                const url = String(bitmap.url || bitmap._url || key).split('?')[0];
                if (this.missing.has(url)) continue;
                this.missing.add(url);
                console.warn(`[DocsDoodads] Could not load ${url}; that doodad is not shown. (In File > Deployment, leave "Exclude unused files" off.)`);
                const ws = DocsDoodads.Workspace;
                if (ws && ws.mounted && ws.showToast) ws.showToast(`A doodad picture is missing: ${url}`, 'error');
            }
        }
        return dropped;
    }
};

if (typeof ImageManager !== 'undefined' && typeof ImageManager.isReady === 'function') {
    $.ImageManager_isReady_missingArt = ImageManager.isReady;
    ImageManager.isReady = function() {
        DocsDoodads.MissingArt.drop();
        return $.ImageManager_isReady_missingArt.call(this);
    };
}
