//==========================================================
// SECTION 13: DocsDoodads.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
DocsDoodads.Thumbnail = {
    cache: {},
    // Least recently used first (a Map keeps insertion order; a touch moves a key to the end).
    cacheOrder: new Map(),
    // At least this many; a bigger Item Bag keeps one per item, up to cacheCeiling (capacity()).
    maxCacheSize: 500,
    cacheCeiling: 3000,
    sizeBuckets: [64, 96, 128, 192],
    queue: [],
    busy: false,
    // Jobs started and not yet finished, by key, with everyone waiting for them.
    pending: {},
    active: 0,
    maxActive: 4,
    // Keys whose image would not load: not retried until the file changes or the cache is cleared.
    failed: new Set(),
    diskDir: 'data/docs_doodads_cache/thumbnails',

    // How many pictures the memory cache keeps: enough for the whole Item Bag (up to the ceiling), so
    // scrolling back over a big bag doesn't read every card from disk again.
    capacity() {
        const list = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.list;
        const count = Array.isArray(list) ? list.length : 0;
        return Math.max(this.maxCacheSize, Math.min(this.cacheCeiling, count));
    },

    getBucketSize(size) {
        let best = this.sizeBuckets[0];
        let minDiff = Math.abs(size - best);
        for (let i = 1; i < this.sizeBuckets.length; i++) {
            const diff = Math.abs(size - this.sizeBuckets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                best = this.sizeBuckets[i];
            }
        }
        return best;
    },

    safeKey(key) {
        return key.replace(/[^a-zA-Z0-9_-]/g, '_');
    },

    getDiskPath(key) {
        return `${this.diskDir}/${this.safeKey(key)}.txt`;
    },

    // The modified time is part of the key so a file changed while the game was closed gets a new thumbnail.
    keyFor(asset, bucket) {
        return `${asset.id}_${Math.round(asset.mtimeMs || 0)}_${bucket}`;
    },

    get(asset, size = 96, callback) {
        const bucket = this.getBucketSize(size);
        const key = this.keyFor(asset, bucket);

        // 1. In-memory LRU Cache check
        if (this.cache[key]) {
            // Touch key for LRU
            this.cacheOrder.delete(key);
            this.cacheOrder.set(key, true);
            callback(this.cache[key]);
            return;
        }
        if (this.failed.has(key)) {
            callback('');
            return;
        }
        // Already on its way (the drawer redraws on every scroll): wait for that one.
        if (this.pending[key]) {
            this.pending[key].push(callback);
            return;
        }

        // 2. The disk cache is read in the queue (in the background), then the picture is made if needed.
        this.pending[key] = [callback];
        this.queue.push({ asset, bucket, key });
        this.processQueue();
    },

    setCache(key, dataUrl) {
        if (this.cache[key] !== undefined) {
            this.cacheOrder.delete(key);
        } else {
            const max = this.capacity();
            while (this.cacheOrder.size >= max) {
                const oldest = this.cacheOrder.keys().next().value;
                this.cacheOrder.delete(oldest);
                delete this.cache[oldest];
            }
        }
        this.cache[key] = dataUrl;
        this.cacheOrder.set(key, true);
    },

    // Drops every cached size of one asset (memory and disk) so it is regenerated.
    invalidate(assetId) {
        const prefix = assetId + '_';
        for (const key of [...this.cacheOrder.keys()]) {
            if (!key.startsWith(prefix)) continue;
            this.cacheOrder.delete(key);
            delete this.cache[key];
        }
        for (const key of [...this.failed]) if (key.startsWith(prefix)) this.failed.delete(key);
        const dir = this.diskDir;
        const safePrefix = this.safeKey(prefix);
        try {
            if (DocsDoodads.FS.existsSync(dir)) {
                for (const file of DocsDoodads.FS.fs.readdirSync(dir)) {
                    if (file.startsWith(safePrefix)) DocsDoodads.FS.fs.unlinkSync(`${dir}/${file}`);
                }
            }
        } catch (e) {}
    },

    // Disk thumbnails of files changed while the game was closed (their key has an old modified
    // time) or of files that are gone. Run after the library is scanned.
    pruneDisk(assets) {
        const fs = DocsDoodads.FS.fs;
        if (!fs || !DocsDoodads.FS.existsSync(this.diskDir)) return 0;
        const current = new Set((assets || []).map(asset => this.safeKey(`${asset.id}_${Math.round(asset.mtimeMs || 0)}`)));
        let removed = 0;
        try {
            for (const file of fs.readdirSync(this.diskDir)) {
                const m = /^(.*)_\d+\.txt$/.exec(file);
                if (m && current.has(m[1])) continue;
                fs.unlinkSync(`${this.diskDir}/${file}`);
                removed++;
            }
        } catch (e) {}
        return removed;
    },

    clearCache() {
        this.cache = {};
        this.cacheOrder = new Map();
        this.queue = [];
        this.pending = {};
        this.failed.clear();
        if (DocsDoodads.FS.fs) {
            const dir = this.diskDir;
            if (DocsDoodads.FS.existsSync(dir)) {
                try {
                    const files = DocsDoodads.FS.fs.readdirSync(dir);
                    for (const f of files) {
                        DocsDoodads.FS.fs.unlinkSync(`${dir}/${f}`);
                    }
                } catch(e) {}
            }
        }
    },

    // A few images load at a time (each finishes in its onload); drawing and encoding stay within
    // the per-frame background budget, and the rest wait for the next frame.
    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = Date.now();
        while (this.queue.length > 0 && this.active < this.maxActive && (Date.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            this.active++;
            let finished = false;
            const done = (dataUrl, fromDisk) => {
                if (finished) return;
                finished = true;
                this.active--;
                const waiting = this.pending[job.key] || [];
                delete this.pending[job.key];
                if (dataUrl) this.setCache(job.key, dataUrl);
                else this.failed.add(job.key);
                for (const callback of waiting) callback(dataUrl);
                if (!fromDisk) this.writeDisk(job.key, dataUrl);
                this.processQueue();
            };
            this.readDisk(job.key).then(cached => {
                if (cached) done(cached, true);
                else this.generate(job.asset, job.bucket, dataUrl => done(dataUrl, false));
            });
        }

        this.busy = false;
        if (this.queue.length > 0 && this.active < this.maxActive) {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.processQueue());
            } else {
                setTimeout(() => this.processQueue(), 16);
            }
        }
    },

    // The disk copy of a picture (a data URL), read without blocking; '' when there is none.
    readDisk(key) {
        const fs = DocsDoodads.FS.fs;
        if (!cacheEnabled || !fs) return Promise.resolve('');
        const diskFile = this.getDiskPath(key);
        const ok = text => (text && text.startsWith('data:image') ? text : '');
        if (!DocsDoodads.FS.existsSync(diskFile)) return Promise.resolve('');
        if (!fs.promises) {
            try { return Promise.resolve(DocsDoodads.FS.existsSync(diskFile) ? ok(fs.readFileSync(diskFile, 'utf8')) : ''); } catch (e) { return Promise.resolve(''); }
        }
        return fs.promises.readFile(diskFile, 'utf8').then(ok, () => '');
    },

    writeDisk(key, dataUrl) {
        const fs = DocsDoodads.FS.fs;
        if (!cacheEnabled || !fs || !dataUrl) return;
        const diskFile = this.getDiskPath(key);
        try {
            if (!DocsDoodads.FS.existsSync(this.diskDir)) DocsDoodads.FS.mkdirp(this.diskDir);
            if (fs.promises) {
                const write = fs.promises.writeFile(diskFile, dataUrl, 'utf8').catch(() => {});
                this._writes.add(write);
                write.then(() => this._writes.delete(write));
            } else fs.writeFileSync(diskFile, dataUrl, 'utf8');
        } catch (e) {}
    },

    // Resolves once the disk copies being written are on disk.
    _writes: new Set(),
    flushed() {
        return Promise.all([...this._writes]);
    },

    generate(asset, size, onComplete) {
        if (typeof Image === 'undefined' || typeof document === 'undefined') {
            onComplete('');
            return;
        }
        if (asset.category === 'Audio') {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♫', size / 2, size / 2);
            onComplete(canvas.toDataURL());
            return;
        }

        const img = new Image();
        img.src = DocsDoodads.LiveReload.urlFor(asset.path);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
            if (asset.slice && asset.slice.regions && asset.slice.regions.length > 0) {
                const r0 = asset.slice.regions[0];
                sx = r0.x; sy = r0.y; sw = r0.w; sh = r0.h;
            }

            const scale = Math.min(size / sw, size / sh);
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (size - dw) / 2;
            const dy = (size - dh) / 2;

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            onComplete(canvas.toDataURL());
        };
        img.onerror = () => onComplete('');
    }
};



