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
    const ext = /\.(jpe?g|webp)$/i.exec(path);
    const file = (slash > -1 ? path.slice(slash + 1) : path).replace(/\.[^/.]+$/, "");
    // Known to be missing: nothing to wait for (and no new request on every map).
    if (MA.isMissing(folder, file, ext ? ext[0] : '')) return ImageManager._emptyBitmap || null;
    // MZ's loadBitmap always asks for .png; other pictures load by their own name.
    if (ext) return MA.track(DocsDoodads.loadPlainImage(MA.urlFor(folder, file, ext[0])));
    return MA.track(ImageManager.loadBitmap(folder, file));
};

// A JPEG or WebP picture by URL, through MZ's image cache. MZ's Deployment encrypts only PNG files, so in
// an encrypted game these are read as they are (MZ's Bitmap.load would ask for "Rock.jpg_").
DocsDoodads.loadPlainImage = function(url) {
    const encrypted = typeof Utils !== 'undefined' && typeof Utils.hasEncryptedImages === 'function' && Utils.hasEncryptedImages();
    const cache = ImageManager._cache;
    if (!encrypted || !cache || typeof Bitmap === 'undefined' || typeof Image === 'undefined' || typeof Bitmap.prototype._onLoad !== 'function') {
        return ImageManager.loadBitmapFromUrl(url);
    }
    if (cache[url]) return cache[url];
    // MZ's Bitmap.load and _startLoading for an unencrypted picture.
    const bitmap = Object.create(Bitmap.prototype);
    bitmap.initialize();
    bitmap._url = url;
    bitmap._image = new Image();
    bitmap._image.onload = bitmap._onLoad.bind(bitmap);
    bitmap._image.onerror = bitmap._onError.bind(bitmap);
    if (typeof bitmap._destroyCanvas === 'function') bitmap._destroyCanvas();
    bitmap._loadingState = 'loading';
    bitmap._image.src = url;
    cache[url] = bitmap;
    return bitmap;
};

// A picture that only Doc's Doodads' data names (a layer's parallax, an idle, run or action sheet):
// MZ's "Exclude unused files" leaves it out of a deployed game, so like doodad art it is skipped with a
// warning instead of stopping the game. null when it is already known to be missing.
DocsDoodads.loadImgTracked = function(folder, file) {
    if (typeof ImageManager === 'undefined' || !file) return null;
    const MA = DocsDoodads.MissingArt;
    if (MA.isMissing(folder, file)) return null;
    return MA.track(ImageManager.loadBitmap(folder, file));
};

// The art Doc's Doodads places is decoration: a picture that can't be loaded (left out of a deployed
// build by "Exclude unused files", renamed, deleted) is skipped with a warning instead of stopping the
// game with MZ's "Failed to load" screen. MZ shows that screen when ImageManager.isReady finds a failed
// picture in its cache, so the plugin's own failed pictures are taken out of the cache first.
DocsDoodads.MissingArt = {
    _art: typeof WeakSet !== 'undefined' ? new WeakSet() : null,
    missing: new Set(),

    urlFor(folder, file, ext) {
        const encode = typeof Utils !== 'undefined' && Utils.encodeURI ? Utils.encodeURI : encodeURI;
        return folder + encode(file) + (ext || '.png');
    },

    isMissing(folder, file, ext) {
        return this.missing.has(this.urlFor(folder, file, ext));
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
