//==========================================================
// SECTION 13: DocsDoodads.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
DocsDoodads.Thumbnail = {
    cache: {},
    cacheOrder: [],
    maxCacheSize: 500,
    sizeBuckets: [64, 96, 128, 192],
    queue: [],
    busy: false,

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

    getDiskPath(key) {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `data/docs_doodads_cache/thumbnails/${safeKey}.txt`;
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
            const idx = this.cacheOrder.indexOf(key);
            if (idx >= 0) this.cacheOrder.splice(idx, 1);
            this.cacheOrder.push(key);
            callback(this.cache[key]);
            return;
        }

        // 2. Disk Cache check
        if (cacheEnabled && DocsDoodads.FS.existsSync) {
            const diskFile = this.getDiskPath(key);
            if (DocsDoodads.FS.existsSync(diskFile)) {
                try {
                    const cachedData = DocsDoodads.FS.readFileSync(diskFile, 'utf8');
                    if (cachedData && cachedData.startsWith('data:image')) {
                        this.setCache(key, cachedData);
                        callback(cachedData);
                        return;
                    }
                } catch(e) {}
            }
        }

        this.queue.push({ asset, bucket, key, callback });
        this.processQueue();
    },

    setCache(key, dataUrl) {
        if (this.cacheOrder.length >= this.maxCacheSize) {
            const oldest = this.cacheOrder.shift();
            delete this.cache[oldest];
        }
        this.cache[key] = dataUrl;
        this.cacheOrder.push(key);
    },

    // Drops every cached size of one asset (memory and disk) so it is regenerated.
    invalidate(assetId) {
        const prefix = assetId + '_';
        this.cacheOrder = this.cacheOrder.filter(key => {
            if (!key.startsWith(prefix)) return true;
            delete this.cache[key];
            return false;
        });
        const dir = 'data/docs_doodads_cache/thumbnails';
        const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
        try {
            if (DocsDoodads.FS.existsSync(dir)) {
                for (const file of DocsDoodads.FS.fs.readdirSync(dir)) {
                    if (file.startsWith(safePrefix)) DocsDoodads.FS.fs.unlinkSync(`${dir}/${file}`);
                }
            }
        } catch (e) {}
    },

    clearCache() {
        this.cache = {};
        this.cacheOrder = [];
        this.queue = [];
        if (DocsDoodads.FS.fs) {
            const dir = 'data/docs_doodads_cache/thumbnails';
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

    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = Date.now();
        while (this.queue.length > 0 && (Date.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            this.generate(job.asset, job.bucket, (dataUrl) => {
                this.setCache(job.key, dataUrl);
                job.callback(dataUrl);

                // Write to disk cache
                if (cacheEnabled && DocsDoodads.FS.fs && dataUrl) {
                    const diskFile = this.getDiskPath(job.key);
                    try {
                        const dir = 'data/docs_doodads_cache/thumbnails';
                        if (!DocsDoodads.FS.existsSync(dir)) DocsDoodads.FS.mkdirp(dir);
                        DocsDoodads.FS.writeFileSync(diskFile, dataUrl, 'utf8');
                    } catch(e) {}
                }
            });
        }

        this.busy = false;
        if (this.queue.length > 0) {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.processQueue());
            } else {
                setTimeout(() => this.processQueue(), 16);
            }
        }
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



