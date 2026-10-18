//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
DocsDoodads.loadBitmap = function(path) {
    if (typeof ImageManager === 'undefined') return null;
    const full = String(path).replace(/\\/g, '/');
    const versioned = DocsDoodads.LiveReload ? DocsDoodads.LiveReload.urlFor(full) : full;
    if (versioned !== full && typeof ImageManager.loadBitmapFromUrl === 'function') {
        return ImageManager.loadBitmapFromUrl(versioned);
    }
    if (path.startsWith('img/')) {
        path = path.slice(4);
    }
    const slash = path.indexOf('/');
    if (slash > -1) {
        const folder = 'img/' + path.slice(0, slash + 1);
        const file = path.slice(slash + 1).replace(/\.[^/.]+$/, "");
        return ImageManager.loadBitmap(folder, file);
    }
    return ImageManager.loadBitmap('img/', path.replace(/\.[^/.]+$/, ""));
};

