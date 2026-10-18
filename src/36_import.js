//==========================================================
// SECTION 24: DocsDoodads.IMPORT (TRANSACTIONAL EXPLORER INGESTION)
//==========================================================
DocsDoodads.Import = {
    imageExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp']),
    audioExtensions: new Set(['.ogg', '.m4a', '.wav']),
    destinations: [
        'img/doodads', 'img/characters', 'img/faces', 'img/parallaxes',
        'img/pictures', 'img/tilesets', 'audio/bgm', 'audio/bgs',
        'audio/me', 'audio/se'
    ],

    isSupported(filePath) {
        if (!DocsDoodads.FS.path) return false;
        const ext = DocsDoodads.FS.path.extname(filePath).toLowerCase();
        return this.imageExtensions.has(ext) || this.audioExtensions.has(ext);
    },

    detectDestination(filePath) {
        const path = DocsDoodads.FS.path;
        if (!path) return null;
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const lower = fileName.toLowerCase();
        const normalizedSource = String(filePath).replace(/\\/g, '/').toLowerCase();

        if (this.audioExtensions.has(ext)) {
            if (normalizedSource.includes('/bgm/') || /(^|[_\-.])bgm([_\-.]|$)/.test(lower)) return 'audio/bgm';
            if (normalizedSource.includes('/bgs/') || /(^|[_\-.])bgs([_\-.]|$)/.test(lower)) return 'audio/bgs';
            if (normalizedSource.includes('/me/') || /(^|[_\-.])me([_\-.]|$)/.test(lower)) return 'audio/me';
            return 'audio/se';
        }
        if (!this.imageExtensions.has(ext)) return null;

        if (normalizedSource.includes('/characters/') || lower.startsWith('$') || lower.includes('character') || lower.includes('actor')) return 'img/characters';
        if (normalizedSource.includes('/faces/') || lower.includes('face')) return 'img/faces';
        if (normalizedSource.includes('/parallaxes/') || lower.includes('parall')) return 'img/parallaxes';
        if (normalizedSource.includes('/pictures/') || /(^|[_\-.])pic(ture)?([_\-.]|$)/.test(lower)) return 'img/pictures';
        if (normalizedSource.includes('/tilesets/') || lower.includes('tile')) return 'img/tilesets';
        return 'img/doodads';
    },

    normalizeDestination(destination) {
        const normalized = String(destination || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
        return this.destinations.includes(normalized) ? normalized : null;
    },

    validateExecutionPlan(plan) {
        const path = DocsDoodads.FS.path;
        if (!path || !plan || !Array.isArray(plan.operations)) return 'Import plan is invalid.';
        const projectRoot = path.resolve(plan.projectRoot || '.');
        for (const operation of plan.operations) {
            if (!operation || !operation.source || !operation.destination || !this.isSupported(operation.source)) {
                return 'Import plan contains an invalid or unsupported operation.';
            }
            const destination = path.resolve(operation.destination);
            const relative = path.relative(projectRoot, destination).replace(/\\/g, '/');
            const insideProject = relative && !relative.startsWith('../') && relative !== '..' && !path.isAbsolute(relative);
            const insideAllowedFolder = this.destinations.some(folder => relative.startsWith(folder + '/'));
            if (!insideProject || !insideAllowedFolder) {
                return `Import destination is outside an allowed project asset folder: ${operation.destination}`;
            }
        }
        return null;
    },

    collectFiles(sourcePaths) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const files = [];
        const errors = [];
        // For files inside a dropped folder: their sub-folder path below that dropped folder ('' at its top level).
        const relativeDirs = new Map();
        if (!fs || !path) return { files, errors: [{ path: '', message: 'Filesystem access is unavailable.' }], relativeDirs };

        const pending = Array.from(sourcePaths || []).filter(Boolean).map(p => ({ current: path.resolve(String(p)), root: null }));
        while (pending.length > 0) {
            const { current, root } = pending.pop();
            try {
                const stat = fs.statSync(current);
                if (stat.isDirectory()) {
                    const children = fs.readdirSync(current).sort().reverse();
                    for (const child of children) pending.push({ current: path.join(current, child), root: root || current });
                } else if (stat.isFile()) {
                    files.push(current);
                    if (root) relativeDirs.set(current, path.relative(root, path.dirname(current)));
                }
            } catch (error) {
                errors.push({ path: current, message: error && error.message ? error.message : String(error) });
            }
        }
        files.sort((a, b) => a.localeCompare(b));
        return { files, errors, relativeDirs };
    },

    // Plain-language summary of a runAssetImport result for the toast.
    describeResult(result) {
        const path = DocsDoodads.FS.path;
        const baseName = (p) => path ? path.basename(String(p)) : String(p).split(/[\\/]/).pop();
        if (result.ok) {
            const parts = [`Imported ${result.imported.length} file(s)`];
            if (result.duplicates && result.duplicates.length) parts.push(`${result.duplicates.length} identical file(s) skipped`);
            if (result.skipped && result.skipped.length) parts.push(`${result.skipped.length} skipped because the name already exists`);
            return parts.join(', ') + '.';
        }
        if (result.cancelled) return `Import cancelled${result.rolledBack ? '; copied files were rolled back' : ''}.`;
        const collision = (result.errors || []).find(error => error.message === 'Destination already exists.');
        if (collision) return `Import cancelled: ${baseName(collision.destination || collision.path)} already exists. Nothing was imported.`;
        const reason = result.errors && result.errors[0] ? result.errors[0].message : 'Unknown import error';
        return `Import failed${result.rolledBack ? ' and was rolled back' : ''}: ${reason}`;
    },

    filesEqual(firstPath, secondPath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return false;
        try {
            const firstStat = fs.statSync(firstPath);
            const secondStat = fs.statSync(secondPath);
            if (firstStat.size !== secondStat.size) return false;
            return fs.readFileSync(firstPath).equals(fs.readFileSync(secondPath));
        } catch (error) {
            return false;
        }
    },

    planBatch(sourcePaths, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const plan = {
            projectRoot: path ? path.resolve(options.projectRoot || '.') : '.',
            collisionPolicy: options.collisionPolicy || 'rename',
            operations: [], unsupported: [], duplicates: [], skipped: [], errors: []
        };
        if (!fs || !path) {
            plan.errors.push({ path: '', message: 'Filesystem access is unavailable.' });
            return plan;
        }

        const collected = this.collectFiles(sourcePaths);
        plan.errors.push(...collected.errors);
        const reserved = new Map();
        const reservedKey = destination => process.platform === 'win32' ? destination.toLowerCase() : destination;

        for (const source of collected.files) {
            if (!this.isSupported(source)) {
                plan.unsupported.push(source);
                continue;
            }

            const requestedDestination = options.destination && options.destination !== 'auto'
                ? options.destination
                : this.detectDestination(source);
            const relativeFolder = this.normalizeDestination(requestedDestination);
            if (!relativeFolder) {
                plan.errors.push({ path: source, message: `Unsupported destination: ${requestedDestination}` });
                continue;
            }

            let targetFolder = path.resolve(plan.projectRoot, relativeFolder);
            // img/doodads belongs to this plugin and is scanned recursively, so folders inside a dropped
            // folder are kept there; RPG Maker's own folders (characters, faces, audio...) stay flat.
            const droppedDir = collected.relativeDirs && collected.relativeDirs.get(source);
            if (droppedDir && relativeFolder === 'img/doodads') {
                const segments = droppedDir.split(/[\\/]+/)
                    .filter(segment => segment && segment !== '.' && segment !== '..')
                    .map(segment => segment.replace(/[<>:"|?*\x00-\x1f]/g, '_'));
                if (segments.length) targetFolder = path.join(targetFolder, ...segments);
            }
            const rootPrefix = plan.projectRoot.endsWith(path.sep) ? plan.projectRoot : plan.projectRoot + path.sep;
            if (targetFolder !== plan.projectRoot && !targetFolder.startsWith(rootPrefix)) {
                plan.errors.push({ path: source, message: 'Import destination escapes the project root.' });
                continue;
            }

            const fileName = path.basename(source);
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            let destination = path.join(targetFolder, fileName);
            let overwrite = false;
            let suffix = 0;

            while (fs.existsSync(destination) || reserved.has(reservedKey(destination))) {
                const comparisonSource = reserved.has(reservedKey(destination)) ? reserved.get(reservedKey(destination)) : destination;
                if (this.filesEqual(source, comparisonSource)) {
                    plan.duplicates.push({ source, destination });
                    destination = null;
                    break;
                }

                const policy = typeof options.collisionPolicy === 'function'
                    ? options.collisionPolicy({ source, destination })
                    : plan.collisionPolicy;
                if (policy === 'skip') {
                    plan.skipped.push({ source, destination, reason: 'collision' });
                    destination = null;
                    break;
                }
                if (policy === 'overwrite') {
                    overwrite = true;
                    break;
                }
                if (policy === 'error') {
                    plan.errors.push({ path: source, destination, message: 'Destination already exists.' });
                    destination = null;
                    break;
                }
                suffix++;
                destination = path.join(targetFolder, `${base}_${suffix}${ext}`);
            }
            if (!destination) continue;

            reserved.set(reservedKey(destination), source);
            plan.operations.push({
                source,
                destination,
                relativeDestination: path.relative(plan.projectRoot, destination).replace(/\\/g, '/'),
                overwrite,
                kind: this.audioExtensions.has(path.extname(source).toLowerCase()) ? 'audio' : 'image'
            });
        }
        return plan;
    },

    async executeBatchAsync(plan, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const fsp = fs && fs.promises;
        const result = {
            ok: false,
            imported: [],
            overwritten: [],
            duplicates: (plan && plan.duplicates) ? plan.duplicates.slice() : [],
            skipped: (plan && plan.skipped) ? plan.skipped.slice() : [],
            unsupported: (plan && plan.unsupported) ? plan.unsupported.slice() : [],
            errors: (plan && plan.errors) ? plan.errors.slice() : [],
            rolledBack: false,
            cancelled: false
        };
        if (!fs || !path || !fsp || !plan || result.errors.length > 0) return result;
        const validationError = this.validateExecutionPlan(plan);
        if (validationError) {
            result.errors.push({ message: validationError });
            return result;
        }

        const completed = [];
        const tempFiles = [];
        const cancellationToken = options.cancellationToken || null;
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const exists = async filePath => {
            try { await fsp.stat(filePath); return true; } catch (error) { return false; }
        };
        const removeIfPresent = async filePath => {
            try { await fsp.unlink(filePath); } catch (error) {
                if (!error || error.code !== 'ENOENT') throw error;
            }
        };

        try {
            for (let index = 0; index < plan.operations.length; index++) {
                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }

                const operation = plan.operations[index];
                await fsp.mkdir(path.dirname(operation.destination), { recursive: true });
                const existed = await exists(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.ddimport-${transactionId}.bak`;
                    await fsp.copyFile(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.ddimport-${transactionId}-${index}.tmp`;
                tempFiles.push(temporary);
                await fsp.copyFile(operation.source, temporary);
                if (existed) {
                    completed.push({ operation, existed, backup });
                    await fsp.copyFile(temporary, operation.destination);
                    await removeIfPresent(temporary);
                } else {
                    await fsp.rename(temporary, operation.destination);
                    completed.push({ operation, existed, backup });
                }

                result.imported.push(operation.destination);
                if (existed) result.overwritten.push(operation.destination);
                if (typeof options.onProgress === 'function') {
                    options.onProgress({
                        completed: index + 1,
                        total: plan.operations.length,
                        source: operation.source,
                        destination: operation.destination
                    });
                }

                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }
            }

            for (const record of completed) {
                if (record.backup) await removeIfPresent(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.cancelled = Boolean(error && error.code === 'DD_IMPORT_CANCELLED');
            result.errors.push({ message: error && error.message ? error.message : String(error) });
            for (let index = completed.length - 1; index >= 0; index--) {
                const record = completed[index];
                try {
                    if (record.existed && record.backup && await exists(record.backup)) {
                        await fsp.copyFile(record.backup, record.operation.destination);
                    } else if (!record.existed) {
                        await removeIfPresent(record.operation.destination);
                    }
                } catch (rollbackError) {
                    result.errors.push({ path: record.operation.destination, message: `Rollback failed: ${rollbackError.message || rollbackError}` });
                }
            }
            for (const temporary of tempFiles) {
                try { await removeIfPresent(temporary); } catch (cleanupError) {}
            }
            result.imported = [];
            result.overwritten = [];
            result.rolledBack = completed.length > 0;
            return result;
        }
    }
};


