//==========================================================
// SECTION 10: DocsDoodads.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
DocsDoodads.FS = {
    fs: (typeof require !== 'undefined') ? require('fs') : null,
    path: (typeof require !== 'undefined') ? require('path') : null,

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
        const jsonStr = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data);
        try {
            JSON.parse(jsonStr);
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

    pruneBackups(dir, prefix, maxCount) {
        if (!this.fs || !this.path || !this.existsSync(dir)) return;
        const files = this.fs.readdirSync(dir)
            .filter(f => f.startsWith(prefix) && f.endsWith('.bak'))
            .map(f => ({ name: f, time: this.fs.statSync(this.path.join(dir, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time);
        while (files.length > maxCount) {
            const toRemove = files.pop();
            try { this.fs.unlinkSync(this.path.join(dir, toRemove.name)); } catch(e) {}
        }
    },

    findLatestBackup(filePath) {
        if (!this.fs || !this.path) return null;
        const baseName = this.path.basename(filePath);
        const backups = [];
        for (const cacheDir of ['data/docs_doodads_cache/backups', DocsDoodads.Legacy.backupDirectory]) {
            if (!this.existsSync(cacheDir)) continue;
            for (const f of this.fs.readdirSync(cacheDir)) {
                if (f.startsWith(baseName) && f.endsWith('.bak')) {
                    backups.push({ path: this.path.join(cacheDir, f), time: this.fs.statSync(this.path.join(cacheDir, f)).mtimeMs });
                }
            }
        }
        backups.sort((a, b) => b.time - a.time);
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

                const indent = entry.indent === undefined ? 2 : entry.indent;
                const json = indent ? JSON.stringify(entry.data, null, indent) : JSON.stringify(entry.data);
                JSON.parse(json);
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
            console.warn(`[DocsDoodads.FS] Corrupt JSON encountered reading ${filePath}:`, e);
            const fallback = this.findLatestBackup(filePath);
            if (fallback) {
                try {
                    const recovered = JSON.parse(this.readFileSync(fallback, 'utf8'));
                    console.warn(`[DocsDoodads.FS] Automatically recovered ${filePath} from backup ${fallback}`);
                    this.recoveryNotices.push(`${filePath} was unreadable; loaded backup ${this.path.basename(fallback)}. Save to repair it.`);
                    return recovered;
                } catch(e2) {}
            }
            this.recoveryNotices.push(`${filePath} was unreadable and no backup exists; defaults were used.`);
            return null;
        }
    },

    // Unreadable-file fallbacks waiting to be shown to the user.
    recoveryNotices: [],

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

