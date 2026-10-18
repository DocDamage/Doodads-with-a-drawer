//==========================================================
// SECTION 11: DocsDoodads.ASSETINDEX & METADATA CACHE
//==========================================================
DocsDoodads.AssetIndex = {
    libraryPath: 'data/DocsDoodadsLibrary.json',
    supportedExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp', '.ogg', '.m4a', '.wav']),
    roots: [
        'img/characters', 'img/doodads', 'img/tilesets', 'img/pictures',
        'img/animations', 'img/battlebacks1', 'img/battlebacks2', 'img/enemies',
        'img/faces', 'img/parallaxes', 'img/sv_actors', 'img/sv_enemies',
        'img/system', 'img/titles1', 'img/titles2',
        'audio/bgm', 'audio/bgs', 'audio/me', 'audio/se'
    ],
    data: {
        version: 1,
        projectId: "docs_doodads_project",
        generatedAt: 0,
        assets: {},
        collections: {},
        settings: {}
    },
    list: [],
    // Bump when indexFile derives new fields so unchanged files are re-indexed once.
    entryRevision: 4,

    init() {
        this.flushUsage();
        const loaded = DocsDoodads.FS.readJson(this.libraryPath);
        if (loaded && loaded.version === 1) {
            this.data = loaded;
        }
        this.rebuildList();
    },

    rebuildList() {
        this.list = Object.values(this.data.assets);
    },

    isEntryCurrent(existing, stat) {
        return Boolean(existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size &&
            existing.entryRevision === this.entryRevision);
    },

    // Reads width/height from the PNG IHDR chunk without decoding the image.
    readImageSize(fullPath) {
        const fs = DocsDoodads.FS.fs;
        let fd = null;
        try {
            fd = fs.openSync(fullPath, 'r');
            const header = Buffer.alloc(24);
            if (fs.readSync(fd, header, 0, 24, 0) < 24) return null;
            const isPng = header.readUInt32BE(0) === 0x89504e47 && header.toString('ascii', 12, 16) === 'IHDR';
            if (!isPng) return null;
            return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
        } catch (error) {
            return null;
        } finally {
            if (fd !== null) {
                try { fs.closeSync(fd); } catch (error) {}
            }
        }
    },

    isIgnoredDirectory(name) {
        return name === '_packed' || String(name).startsWith('.');
    },

    isSupportedAssetFile(filePath) {
        if (!DocsDoodads.FS.path) return false;
        return this.supportedExtensions.has(DocsDoodads.FS.path.extname(filePath).toLowerCase());
    },

    async scanAsync(options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const result = { cancelled: false, discovered: 0, indexed: 0, unchanged: 0, removed: 0, errors: [] };
        if (!fs || !path || !fs.promises) {
            result.errors.push('Filesystem access is unavailable.');
            return result;
        }
        if (options.loadCache !== false) this.init();

        const projectRoot = path.resolve(options.projectRoot || '.');
        const roots = (options.roots || this.roots)
            .map(root => String(root).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, ''));
        const batchSize = Math.max(1, options.batchSize || 100);
        const cancellationToken = options.cancellationToken || null;
        const isCancelled = () => Boolean(cancellationToken && (cancellationToken.cancelled || cancellationToken.isCancelled));
        const files = [];
        const directories = roots.map(root => ({ absolute: path.resolve(projectRoot, root), relative: root }));
        // Folders that couldn't be read (locked, no permission): what the library knows under them stays.
        const unreadable = [];

        while (directories.length > 0) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const directory = directories.pop();
            try {
                const entries = await fs.promises.readdir(directory.absolute, { withFileTypes: true });
                entries.sort((a, b) => a.name.localeCompare(b.name));
                for (const entry of entries) {
                    const absolute = path.join(directory.absolute, entry.name);
                    const relative = `${directory.relative}/${entry.name}`.replace(/\\/g, '/');
                    if (entry.isDirectory()) {
                        if (!this.isIgnoredDirectory(entry.name)) directories.push({ absolute, relative });
                    }
                    else if (entry.isFile() && this.isSupportedAssetFile(entry.name)) files.push({ absolute, relative });
                }
            } catch (error) {
                if (!error || error.code !== 'ENOENT') {
                    result.errors.push(`${directory.relative}: ${error.message || error}`);
                    unreadable.push(directory.relative.toLowerCase() + '/');
                }
            }
            if (directories.length % batchSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }

        files.sort((a, b) => a.relative.localeCompare(b.relative));
        result.discovered = files.length;
        const seen = new Set();
        for (let index = 0; index < files.length; index++) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const file = files[index];
            const assetPath = file.relative.replace(/\\/g, '/');
            const assetId = assetPath.toLowerCase();
            seen.add(assetId);
            try {
                const stat = await fs.promises.stat(file.absolute);
                const existing = this.data.assets[assetId];
                if (this.isEntryCurrent(existing, stat)) {
                    result.unchanged++;
                } else {
                    this.indexFile(file.absolute, path.basename(file.absolute), path.extname(file.absolute).toLowerCase(), assetPath, stat);
                    result.indexed++;
                }
            } catch (error) {
                result.errors.push(`${assetPath}: ${error.message || error}`);
            }
            if ((index + 1) % batchSize === 0 || index === files.length - 1) {
                if (typeof options.onProgress === 'function') {
                    options.onProgress({ completed: index + 1, total: files.length, path: assetPath });
                }
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        const rootPrefixes = roots.map(root => root.toLowerCase() + '/');
        for (const [assetId, asset] of Object.entries(this.data.assets)) {
            const normalizedPath = String(asset.path || assetId).replace(/\\/g, '/').toLowerCase();
            const inScannedRoot = rootPrefixes.some(prefix => normalizedPath.startsWith(prefix)) &&
                !unreadable.some(prefix => normalizedPath.startsWith(prefix));
            if (inScannedRoot && !seen.has(assetId.toLowerCase())) {
                delete this.data.assets[assetId];
                result.removed++;
                for (const collection of Object.values(this.data.collections || {})) {
                    if (Array.isArray(collection)) {
                        const collectionIndex = collection.indexOf(assetId);
                        if (collectionIndex >= 0) collection.splice(collectionIndex, 1);
                    }
                }
            }
        }

        this.data.generatedAt = Date.now();
        this.rebuildList();
        if (options.save !== false) {
            const target = options.projectRoot
                ? path.join(projectRoot, options.libraryPath || this.libraryPath)
                : (options.libraryPath || this.libraryPath);
            DocsDoodads.FS.atomicWriteJson(target, this.data);
        }
        return result;
    },

    indexFile(fullPath, fileName, ext, assetPath = fullPath, knownStat = null) {
        const fs = DocsDoodads.FS.fs;
        const stat = knownStat || fs.statSync(fullPath);
        const normalizedAssetPath = String(assetPath).replace(/\\/g, '/');
        const assetId = normalizedAssetPath.toLowerCase();

        let existing = this.data.assets[assetId];
        if (this.isEntryCurrent(existing, stat)) {
            return;
        }

        const category = this.detectCategory(normalizedAssetPath);
        const autoTags = this.generateAutoTags(normalizedAssetPath, fileName);
        const assetType = this.detectAssetType(normalizedAssetPath, fileName, ext);

        const newEntry = {
            id: assetId,
            path: normalizedAssetPath,
            type: assetType,
            category: category,
            fileName: fileName,
            extension: ext,
            mtimeMs: stat.mtimeMs,
            sizeBytes: stat.size,
            // When the bag first saw the file (Newest first); older entries fall back to the file's time.
            addedAt: existing && existing.addedAt ? existing.addedAt : (existing ? existing.mtimeMs || 0 : Date.now()),
            entryRevision: this.entryRevision,
            width: 0,
            height: 0,
            tags: existing ? existing.tags : [],
            autoTags: autoTags,
            favorite: existing ? existing.favorite : false,
            collections: existing ? existing.collections : [],
            slice: existing && existing.slice ? existing.slice : {
                status: "none",
                method: "none",
                confidence: 1.0,
                regions: []
            },
            placement: existing && existing.placement ? existing.placement : {
                defaultMode: assetType === 'character_sheet' ? 'event' : 'doodad'
            },
            collision: existing && existing.collision ? existing.collision : {
                preset: "none",
                shape: null
            },
            usage: existing && existing.usage ? existing.usage : { lastUsedAt: 0, useCount: 0 }
        };

        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            const size = this.readImageSize(fullPath);
            if (size) {
                newEntry.width = size.width;
                newEntry.height = size.height;
            }
            // Hand-edited slices are the user's work; detection only fills in slices that are not manual.
            const isManual = Boolean(existing && existing.slice && existing.slice.status === 'manual');
            if (!isManual) {
                const metadata = DocsDoodads.Slicing.Metadata.parse(fullPath);
                const known = metadata ? null : DocsDoodads.Slicing.Known.detect(newEntry);
                if (metadata) {
                    newEntry.slice = metadata;
                } else if (known) {
                    newEntry.slice = known;
                    newEntry.width = known.width;
                    newEntry.height = known.height;
                }
            }
        }

        this.data.assets[assetId] = newEntry;
    },

    detectCategory(filePath) {
        const lower = filePath.toLowerCase();
        if (lower.includes('img/characters')) return 'Characters';
        if (lower.includes('img/doodads')) return 'Doodads';
        if (lower.includes('img/tilesets')) return 'Tilesets';
        if (lower.includes('img/pictures')) return 'Pictures';
        if (lower.includes('img/faces')) return 'Faces';
        if (/img\/(enemies|sv_enemies|sv_actors)\//.test(lower)) return 'Battlers';
        if (/img\/(battlebacks1|battlebacks2|parallaxes|titles1|titles2)\//.test(lower)) return 'Backgrounds';
        if (lower.includes('img/system')) return 'System';
        if (lower.includes('audio/')) return 'Audio';
        return 'Other';
    },

    generateAutoTags(filePath, fileName) {
        const parts = filePath.toLowerCase().replace(/\\/g, '/').split('/');
        const tags = new Set();
        for (const p of parts) {
            if (!['img', 'audio', fileName.toLowerCase()].includes(p)) {
                tags.add(p);
            }
        }
        const nameParts = fileName.replace(/\.[^/.]+$/, "").split(/[ _-]+/);
        for (const np of nameParts) {
            if (np.length > 1) tags.add(np.toLowerCase());
        }
        return Array.from(tags);
    },

    detectAssetType(filePath, fileName, ext) {
        if (['.ogg', '.m4a', '.wav'].includes(ext)) return 'audio';
        if (filePath.includes('img/characters')) {
            return fileName.startsWith('$') ? 'single_character' : 'character_sheet';
        }
        if (filePath.includes('img/tilesets')) return 'tileset';
        if (filePath.includes('img/faces')) return 'faceset';
        return 'doodad';
    },

    save() {
        if (this._usageTimer) { clearTimeout(this._usageTimer); this._usageTimer = null; }
        DocsDoodads.FS.atomicWriteJson(this.libraryPath, this.data);
    },

    // Accepts "a, b ,a" style input; stores lowercase, trimmed, de-duplicated tags.
    setTags(assetId, input) {
        const asset = this.data.assets[assetId];
        if (!asset) return;
        const raw = Array.isArray(input) ? input : String(input || '').split(',');
        asset.tags = [...new Set(raw.map(t => String(t).trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean))];
        this.save();
    },

    toggleFavorite(assetId) {
        if (this.data.assets[assetId]) {
            this.data.assets[assetId].favorite = !this.data.assets[assetId].favorite;
            this.save();
        }
    },

    // Placing counts as a use; the library (large) is written a moment after the last placement.
    recordUsage(assetId) {
        const asset = this.data.assets[assetId];
        if (!asset) return;
        const u = asset.usage = asset.usage || { lastUsedAt: 0, useCount: 0 };
        u.useCount = (u.useCount || 0) + 1;
        u.lastUsedAt = Date.now();
        clearTimeout(this._usageTimer);
        this._usageTimer = setTimeout(() => { this._usageTimer = null; this.save(); }, 1500);
        if (this._usageTimer && typeof this._usageTimer.unref === 'function') this._usageTimer.unref();
    },

    // A usage write still waiting happens now (before the library is saved or replaced).
    flushUsage() {
        if (!this._usageTimer) return;
        clearTimeout(this._usageTimer);
        this._usageTimer = null;
        this.save();
    },

    createCollection(name) {
        this.data.collections = this.data.collections || {};
        if (!this.data.collections[name]) {
            this.data.collections[name] = [];
            this.save();
        }
    },

    deleteCollection(name) {
        if (this.data.collections && this.data.collections[name]) {
            delete this.data.collections[name];
            for (const a of Object.values(this.data.assets)) {
                if (a.collections) {
                    a.collections = a.collections.filter(c => c !== name);
                }
            }
            this.save();
        }
    },

    addAssetToCollection(assetId, name) {
        this.createCollection(name);
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.collections = asset.collections || [];
            if (!asset.collections.includes(name)) {
                asset.collections.push(name);
                if (!this.data.collections[name].includes(assetId)) {
                    this.data.collections[name].push(assetId);
                }
                this.save();
            }
        }
    },

    removeAssetFromCollection(assetId, name) {
        const asset = this.data.assets[assetId];
        if (asset && asset.collections) {
            asset.collections = asset.collections.filter(c => c !== name);
        }
        if (this.data.collections && this.data.collections[name]) {
            this.data.collections[name] = this.data.collections[name].filter(id => id !== assetId);
        }
        this.save();
    },

    getCollections() {
        return Object.keys(this.data.collections || {});
    },

    // Named searches kept as chips under the search box, saved with the library like collections.
    savedSearches() {
        const list = Array.isArray(this.data.savedSearches) ? this.data.savedSearches : [];
        return list.filter(s => s && typeof s.name === 'string' && typeof s.query === 'string');
    },

    saveSearch(name, query) {
        name = String(name || '').trim();
        query = String(query || '').trim();
        if (!name || !query) return false;
        const list = this.savedSearches().filter(s => s.name !== name);
        list.push({ name, query });
        this.data.savedSearches = list;
        this.save();
        return true;
    },

    deleteSearch(name) {
        const list = this.savedSearches();
        const next = list.filter(s => s.name !== name);
        if (next.length === list.length) return false;
        this.data.savedSearches = next;
        this.save();
        return true;
    }
};

