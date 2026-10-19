//==========================================================
// SECTION 10: DocsDoodads.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
// Files are only written in a playtest. A deployed game reads its data and never changes the project's
// files, even if a script calls the editor's save, import or export: every write through FS.fs (and
// FS.fs.promises) throws there, and the callers' own error handling reports it. Reads are untouched.
DocsDoodads.FS = {
    fs: null,
    path: (typeof require !== 'undefined') ? require('path') : null,

    writeMethods: ['writeFileSync', 'appendFileSync', 'copyFileSync', 'renameSync', 'unlinkSync', 'rmSync', 'rmdirSync',
        'mkdirSync', 'utimesSync', 'chmodSync', 'truncateSync', 'symlinkSync', 'linkSync', 'cpSync',
        'writeFile', 'appendFile', 'copyFile', 'rename', 'unlink', 'rm', 'rmdir', 'mkdir', 'utimes', 'chmod', 'truncate',
        'symlink', 'link', 'cp', 'createWriteStream'],

    writable() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' && Boolean(Utils.isOptionValid('test'));
    },

    // Node's fs with every write method checking writable() first (looked up when called, so tests that
    // stub a method on fs still reach their stub).
    guard(nodeFs) {
        if (!nodeFs) return null;
        const FS = this;
        const refuse = name => new Error("Doc's Doodads only writes files in a playtest (" + name + ').');
        const wrap = (target, source, names, fail) => {
            for (const name of names) {
                if (typeof source[name] !== 'function') continue;
                target[name] = function(...args) {
                    if (!FS.writable()) return fail(name);
                    return source[name].apply(source, args);
                };
            }
            return target;
        };
        const guarded = wrap(Object.create(nodeFs), nodeFs, this.writeMethods, name => { throw refuse(name); });
        if (nodeFs.promises) {
            const promises = wrap(Object.create(nodeFs.promises), nodeFs.promises, this.writeMethods, name => Promise.reject(refuse(name)));
            Object.defineProperty(guarded, 'promises', { value: promises });
        }
        return guarded;
    },

    existsSync(filePath) {
        return this.fs && this.fs.existsSync(filePath);
    },

    readFileSync(filePath, encoding = 'utf8') {
        return this.fs ? this.fs.readFileSync(filePath, encoding) : null;
    },

    writeFileSync(filePath, data, encoding = 'utf8') {
        if (!this.fs) return;
        this.fs.writeFileSync(filePath, data, encoding);
    },

    atomicWriteJson(filePath, data, indent = 2) {
        if (!this.fs || !this.path) return false;
        const dir = this.path.dirname(filePath);
        if (!this.existsSync(dir)) {
            this.mkdirp(dir);
        }
        const tmpPath = filePath + '.tmp';
        // What JSON.stringify gives back is valid JSON; only nothing (undefined data) or a throw (a cycle)
        // means there is nothing to write.
        let jsonStr;
        try {
            jsonStr = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data);
            if (typeof jsonStr !== 'string') throw new Error('nothing to write');
        } catch(e) {
            console.error("[DocsDoodads.FS] Validation failed for atomic JSON write:", e);
            return false;
        }
        try {
            this.fs.writeFileSync(tmpPath, jsonStr, 'utf8');
            this.fs.renameSync(tmpPath, filePath);
            return true;
        } catch(e) {
            // e.g. a read-only target: keep the original file and do not leave the temp copy behind.
            console.error(`[DocsDoodads.FS] Could not write ${filePath}:`, e);
            try { if (this.existsSync(tmpPath)) this.fs.unlinkSync(tmpPath); } catch(cleanupError) {}
            return false;
        }
    },

    // atomicWriteJson without blocking: the text is written to the temporary file in the background, then
    // renamed in place at once (unless stillWanted() now says no; the temporary file goes). Resolves to
    // whether it was written; never rejects. Without fs.promises it writes as atomicWriteJson does.
    atomicWriteJsonAsync(filePath, data, indent = 0, stillWanted = null) {
        const promises = this.fs && this.fs.promises;
        if (!promises || !this.path) return Promise.resolve(this.atomicWriteJson(filePath, data, indent));
        let jsonStr;
        try {
            jsonStr = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data);
            if (typeof jsonStr !== 'string') throw new Error('nothing to write');
        } catch (e) {
            console.error("[DocsDoodads.FS] Validation failed for atomic JSON write:", e);
            return Promise.resolve(false);
        }
        const tmpPath = filePath + '.tmp';
        const dropTmp = () => { try { if (this.existsSync(tmpPath)) this.fs.unlinkSync(tmpPath); } catch (cleanupError) {} };
        try {
            const dir = this.path.dirname(filePath);
            if (!this.existsSync(dir)) this.mkdirp(dir);
        } catch (e) {
            return Promise.resolve(false);
        }
        return promises.writeFile(tmpPath, jsonStr, 'utf8').then(() => {
            if (stillWanted && !stillWanted()) { dropTmp(); return false; }
            // Synchronous, so nothing can run between the check above and the rename.
            this.fs.renameSync(tmpPath, filePath);
            return true;
        }).catch(e => {
            console.error(`[DocsDoodads.FS] Could not write ${filePath}:`, e);
            dropTmp();
            return false;
        });
    },

    // Text or bytes written whole or not at all: a temporary file beside the target, then a rename. Throws
    // (with the temporary file removed) when it can't write.
    atomicWriteFile(filePath, data, encoding) {
        if (!this.fs || !this.path) throw new Error('Filesystem access is unavailable.');
        const tmpPath = filePath + '.tmp';
        try {
            this.fs.writeFileSync(tmpPath, data, encoding);
            this.fs.renameSync(tmpPath, filePath);
        } catch (e) {
            try { if (this.existsSync(tmpPath)) this.fs.unlinkSync(tmpPath); } catch (cleanupError) {}
            throw e;
        }
        return true;
    },

    createTimestampedBackup(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path || !this.existsSync(filePath)) return null;
        const cacheDir = backupDirectory;
        if (!this.existsSync(cacheDir)) {
            this.mkdirp(cacheDir);
        }
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const baseName = this.path.basename(filePath);
        let backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.bak`);
        let suffix = 0;
        while (this.existsSync(backupPath)) {
            suffix++;
            backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.${suffix}.bak`);
        }
        this.fs.copyFileSync(filePath, backupPath);
        this.pruneBackups(cacheDir, baseName, backupRetentionCount);
        return backupPath;
    },

    // Keeps the newest maxCount backups of one file (prefix: its file name), and its newest few
    // unreadable copies.
    pruneBackups(dir, prefix, maxCount) {
        if (!this.fs || !this.path || !this.existsSync(dir)) return;
        const prune = (ending, keep) => {
            const files = this.fs.readdirSync(dir)
                .filter(f => f.startsWith(prefix + '.') && f.endsWith(ending))
                .map(f => ({ name: f, time: this.fs.statSync(this.path.join(dir, f)).mtimeMs }))
                .sort((a, b) => b.time - a.time);
            while (files.length > keep) {
                const toRemove = files.pop();
                try { this.fs.unlinkSync(this.path.join(dir, toRemove.name)); } catch(e) {}
            }
        };
        prune('.bak', maxCount);
        prune('.unreadable', 3);
    },

    findLatestBackup(filePath) {
        const backups = this.listBackups(filePath);
        return backups.length > 0 ? backups[0].path : null;
    },

    listBackups(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path) return [];
        const baseName = this.path.basename(filePath);
        const directories = [backupDirectory];
        if (backupDirectory === 'data/docs_doodads_cache/backups') directories.push(DocsDoodads.Legacy.backupDirectory);
        const backups = [];
        for (const directory of directories) {
            if (!this.existsSync(directory)) continue;
            for (const fileName of this.fs.readdirSync(directory)) {
                if (!fileName.startsWith(baseName + '.') || !fileName.endsWith('.bak')) continue;
                const backupPath = this.path.join(directory, fileName);
                const stat = this.fs.statSync(backupPath);
                backups.push({ path: backupPath, name: fileName, mtimeMs: stat.mtimeMs, size: stat.size });
            }
        }
        return backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
    },

    // An entry's text as atomicWriteManyJson writes it ({ data, indent }, indent 2 when not given).
    jsonOf(entry) {
        const indent = entry.indent === undefined ? 2 : entry.indent;
        return indent ? JSON.stringify(entry.data, null, indent) : JSON.stringify(entry.data);
    },

    // Before a save: a timestamped backup of each file whose text is about to change (a file written the
    // same as it is gets none), then one look at the backups folder to keep the newest of each. Fills in
    // entry.json so the write doesn't make the text again. Returns the backups made; throws when one fails.
    backupChanged(entries, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path) return [];
        const made = [], names = new Set();
        for (const entry of entries) {
            entry.json = this.jsonOf(entry);
            if (!this.existsSync(entry.path)) continue;
            let now = null;
            try { now = this.fs.readFileSync(entry.path, 'utf8'); } catch (e) { now = null; }
            if (now === entry.json) continue;
            if (!this.existsSync(backupDirectory)) this.mkdirp(backupDirectory);
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const baseName = this.path.basename(entry.path);
            let backupPath = this.path.join(backupDirectory, `${baseName}.${stamp}.bak`);
            for (let suffix = 1; this.existsSync(backupPath); suffix++) backupPath = this.path.join(backupDirectory, `${baseName}.${stamp}.${suffix}.bak`);
            this.fs.copyFileSync(entry.path, backupPath);
            made.push(backupPath);
            names.add(baseName);
        }
        if (names.size) this.pruneBackupsFor(backupDirectory, names, backupRetentionCount);
        return made;
    },

    // pruneBackups for several files at once, reading the folder once.
    pruneBackupsFor(dir, prefixes, maxCount) {
        if (!this.fs || !this.path || !this.existsSync(dir)) return;
        let all;
        try { all = this.fs.readdirSync(dir); } catch (e) { return; }
        for (const prefix of prefixes) {
            for (const [ending, keep] of [['.bak', maxCount], ['.unreadable', 3]]) {
                const files = all.filter(f => f.startsWith(prefix + '.') && f.endsWith(ending))
                    .map(f => { try { return { name: f, time: this.fs.statSync(this.path.join(dir, f)).mtimeMs }; } catch (e) { return null; } })
                    .filter(Boolean)
                    .sort((a, b) => b.time - a.time);
                while (files.length > keep) {
                    const toRemove = files.pop();
                    try { this.fs.unlinkSync(this.path.join(dir, toRemove.name)); } catch (e) {}
                }
            }
        }
    },

    atomicWriteManyJson(entries, options = {}) {
        const result = { ok: false, committed: [], error: null, rolledBack: false };
        if (!this.fs || !this.path || !Array.isArray(entries) || entries.length === 0) {
            result.error = 'No writable JSON entries were supplied.';
            return result;
        }

        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const prepared = [];
        const seenTargets = new Set();
        const rollbackRecords = [];
        try {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                if (!entry || !entry.path) throw new Error(`Entry ${index} has no target path.`);
                const targetPath = this.path.resolve(entry.path);
                const targetKey = typeof process !== 'undefined' && process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
                if (seenTargets.has(targetKey)) throw new Error(`Duplicate transaction target: ${entry.path}`);
                seenTargets.add(targetKey);

                const json = typeof entry.json === 'string' ? entry.json : this.jsonOf(entry);
                if (typeof json !== 'string') throw new Error(`Entry ${index} has nothing to write.`);
                this.ensureDir(this.path.dirname(targetPath));
                const temporary = `${targetPath}.ddtxn-${transactionId}-${index}.tmp`;
                this.fs.writeFileSync(temporary, json, 'utf8');
                prepared.push({ targetPath, temporary, existed: this.existsSync(targetPath), rollback: null });
            }

            for (let index = 0; index < prepared.length; index++) {
                const item = prepared[index];
                if (item.existed) {
                    item.rollback = `${item.targetPath}.ddtxn-${transactionId}-${index}.rollback`;
                    this.fs.copyFileSync(item.targetPath, item.rollback);
                }
                if (typeof options.beforeCommit === 'function') options.beforeCommit(index, entries[index]);
                this.fs.renameSync(item.temporary, item.targetPath);
                // Only files that were actually replaced need restoring if a later file fails.
                rollbackRecords.push(item);
                result.committed.push(item.targetPath);
            }

            for (const item of rollbackRecords) {
                if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            for (let index = rollbackRecords.length - 1; index >= 0; index--) {
                const item = rollbackRecords[index];
                try {
                    if (item.existed && item.rollback && this.existsSync(item.rollback)) {
                        this.fs.copyFileSync(item.rollback, item.targetPath);
                    } else if (!item.existed && this.existsSync(item.targetPath)) {
                        this.fs.unlinkSync(item.targetPath);
                    }
                } catch (rollbackError) {
                    result.error += `; rollback failed for ${item.targetPath}: ${rollbackError.message || rollbackError}`;
                }
            }
            for (const item of prepared) {
                try { if (this.existsSync(item.temporary)) this.fs.unlinkSync(item.temporary); } catch (cleanupError) {}
                try { if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback); } catch (cleanupError) {}
            }
            result.committed = [];
            result.rolledBack = rollbackRecords.length > 0;
            return result;
        }
    },

    restoreBackup(filePath, backupPath, options = {}) {
        const result = { ok: false, restoredFrom: null, safetyBackup: null, error: null };
        if (!this.fs || !this.path) {
            result.error = 'Filesystem access is unavailable.';
            return result;
        }
        try {
            const backupDirectory = this.path.resolve(options.backupDir || 'data/docs_doodads_cache/backups');
            // listBackups also offers backups made by QJ-Doodads builds, so those must be restorable too.
            const allowedDirectories = [backupDirectory];
            if (!options.backupDir) allowedDirectories.push(this.path.resolve(DocsDoodads.Legacy.backupDirectory));
            const resolvedBackup = this.path.resolve(backupPath);
            const resolvedTarget = this.path.resolve(filePath);
            const expectedPrefix = this.path.basename(resolvedTarget) + '.';
            if (!allowedDirectories.includes(this.path.dirname(resolvedBackup)) ||
                !this.path.basename(resolvedBackup).startsWith(expectedPrefix) ||
                !resolvedBackup.endsWith('.bak')) {
                throw new Error('Selected backup does not belong to the target file.');
            }
            if (!this.existsSync(resolvedBackup)) throw new Error('Selected backup no longer exists.');

            const restoredData = JSON.parse(this.readFileSync(resolvedBackup, 'utf8'));
            result.safetyBackup = this.createTimestampedBackup(resolvedTarget, backupDirectory);
            const writeResult = this.atomicWriteManyJson([{ path: resolvedTarget, data: restoredData, indent: 2 }]);
            if (!writeResult.ok) throw new Error(writeResult.error || 'Restore write failed.');
            result.ok = true;
            result.restoredFrom = resolvedBackup;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            return result;
        }
    },

    ensureDir(dirPath) {
        return this.mkdirp(dirPath);
    },

    mkdirp(dirPath) {
        if (!this.fs || !this.path) return;
        if (this.fs.existsSync(dirPath)) return;
        const parent = this.path.dirname(dirPath);
        if (!this.fs.existsSync(parent)) this.mkdirp(parent);
        this.fs.mkdirSync(dirPath);
    },

    readJson(filePath) {
        try {
            if (!this.existsSync(filePath)) {
                const legacyPath = DocsDoodads.Legacy.pathFor(filePath);
                if (!legacyPath || !this.existsSync(legacyPath)) return null;
                filePath = legacyPath;
            }
            return JSON.parse(this.readFileSync(filePath, 'utf8'));
        } catch(e) {
            // The same unreadable file read again (some are read on every open) is copied once, and its
            // notice waits once until it's shown (it comes back while the file stays unreadable).
            const s = this.stat(filePath);
            const seenKey = s ? `${s.mtimeMs}:${s.size}` : 'gone';
            const firstTime = this._unreadableSeen[filePath] !== seenKey;
            this._unreadableSeen[filePath] = seenKey;
            const notice = text => { if (!this.recoveryNotices.some(n => n.startsWith(`${filePath} was unreadable`))) this.recoveryNotices.push(text); };
            if (firstTime) console.warn(`[DocsDoodads.FS] Corrupt JSON encountered reading ${filePath}:`, e);
            // The next save would replace the unreadable file, so a copy is kept first (for repair by hand).
            const kept = firstTime ? this.keepUnreadable(filePath) : null;
            const keptNote = kept ? ` The unreadable file was kept as ${kept}.` : '';
            const fallback = this.findLatestBackup(filePath);
            if (fallback) {
                try {
                    const recovered = JSON.parse(this.readFileSync(fallback, 'utf8'));
                    if (firstTime) console.warn(`[DocsDoodads.FS] Automatically recovered ${filePath} from backup ${fallback}`);
                    notice(`${filePath} was unreadable; loaded backup ${this.path.basename(fallback)}. Save to repair it.${keptNote}`);
                    return recovered;
                } catch(e2) {}
            }
            notice(`${filePath} was unreadable and no backup exists; defaults were used.${keptNote}`);
            return null;
        }
    },

    // A copy of an unreadable file beside the backups (named .unreadable, so it's never loaded as one).
    // Returns its path, or null (nothing to copy, or not in a playtest).
    keepUnreadable(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path || !this.writable() || !this.existsSync(filePath)) return null;
        try {
            this.mkdirp(backupDirectory);
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const target = this.path.join(backupDirectory, `${this.path.basename(filePath)}.${stamp}.unreadable`).replace(/\\/g, '/');
            this.fs.copyFileSync(filePath, target);
            return target;
        } catch (error) {
            return null;
        }
    },

    // Unreadable-file fallbacks waiting to be shown to the user.
    recoveryNotices: [],
    // filePath -> the modified time and size it had when found unreadable.
    _unreadableSeen: {},

    takeRecoveryNotices() {
        const notices = this.recoveryNotices.slice();
        this.recoveryNotices.length = 0;
        return notices;
    },

    stat(filePath) {
        if (!this.fs || !this.existsSync(filePath)) return null;
        const s = this.fs.statSync(filePath);
        return { size: s.size, mtimeMs: s.mtimeMs };
    }
};
DocsDoodads.FS.fs = DocsDoodads.FS.guard((typeof require !== 'undefined') ? require('fs') : null);

