// @editor-only
(function() {
    const D = DocsDoodads, W = D.Workspace, S = D.Shipped, U = D.Ui;
    Object.assign(W, {
        shippedRelease() {
            const stat = D.FS.stat(S.path), signature = stat ? stat.mtimeMs + ':' + stat.size : '';
            if (!this._shippedCache || this._shippedCache.signature !== signature) this._shippedCache = { signature, value: S.latest(stat ? D.FS.readJson(S.path) : null) };
            return this._shippedCache.value;
        },
        shippedCurrent(version = '', recordHashes = false) {
            if (recordHashes) return this.shippedDiskSnapshot(version);
            const sizes = {};
            const ids = new Set(Object.keys(window.$dataDocsDoodads || {}).filter(id => /^\d+$/.test(id)).map(Number));
            for (const map of this.mapEntries()) ids.add(Number(map.id));
            for (const id of ids) {
                const file = D.Persistence.mapFilePath(id), map = D.FS.readJson(file);
                if (map && map.width && map.height) sizes[id] = [map.width, map.height];
                else if (id === this.currentMapId() && window.$gameMap) sizes[id] = [$gameMap.width(), $gameMap.height()];
            }
            return S.snapshot(window.$dataDocsDoodads || {}, sizes, version);
        },
        shippedDiskSnapshot(version) {
            const bytes = new Map(), crypto = require('crypto'), DF = D.DataFiles;
            const read = (file, required = false) => {
                if (!bytes.has(file)) bytes.set(file, D.FS.existsSync(file) ? D.FS.readFileSync(file) : null);
                const text = bytes.get(file);
                if (required && text === null) throw new Error('Missing released-data file: ' + file);
                return text;
            };
            const main = JSON.parse(read(DF.mainPath()) || '{}');
            const disk = DF.merge(main, id => JSON.parse(read(DF.mapPath(id), true)));
            const normalized = D.migrateData(JSON.parse(JSON.stringify(disk)), 'doodads');
            if (JSON.stringify(DF.stable(normalized)) !== JSON.stringify(DF.stable(window.$dataDocsDoodads || {}))) {
                throw new Error('Saved doodad data differs from the editor. Reload or save before marking a release.');
            }
            const sizes = {}, infos = JSON.parse(read('data/MapInfos.json') || 'null');
            const ids = new Set(Object.keys(disk).filter(id => /^\d+$/.test(id)).map(Number));
            for (const map of Array.isArray(infos) ? infos : this.mapEntries()) if (map && Number(map.id) > 0) ids.add(Number(map.id));
            for (const id of ids) {
                const text = read(D.Persistence.mapFilePath(id));
                const map = text === null ? null : JSON.parse(text);
                if (map && map.width && map.height) sizes[id] = [map.width, map.height];
            }
            const snapshot = S.snapshot(disk, sizes, version);
            snapshot.fileHashes = Object.fromEntries(Array.from(bytes).map(([file, text]) => [file, text === null ? null : crypto.createHash('sha256').update(text).digest('hex')]));
            return snapshot;
        },
        shippedProblems() { return S.diff(this.shippedRelease(), this.shippedCurrent()); },
        async markAsReleased() {
            if (!D.FS.writable() || !D.FS.fs) return false;
            if (D.Persistence.hasUnsavedWork()) {
                if (!(await U.confirm('Save the project before recording the names and states players\' saves will know?', { title: 'Mark as Released', ok: 'Save and Continue' }))) return false;
                if (!D.Persistence.saveAll()) return false;
            }
            const values = await U.form({ title: 'Mark as Released', text: 'Records names, states and map sizes to warn about later save-breaking changes.', ok: 'Mark Release', fields: [{ key: 'version', label: 'Release name or version', value: pluginVersion }] });
            const version = String(values && values.version || '').trim().slice(0, 80);
            if (!version) return false;
            const value = D.FS.readJson(S.path), previous = S.latest(value);
            if (value && !previous && !Array.isArray(value.releases) && !Array.isArray(value)) { this.showToast('The release-history format is not recognized; keep it intact and check the file.', 'error'); return false; }
            const releases = Array.isArray(value) ? value.slice() : value && Array.isArray(value.releases) ? value.releases.slice() : previous ? [previous] : [];
            if (releases.some(release => release.version === version) && !(await U.confirm('Replace the recorded snapshot for ' + version + '?', { title: 'Replace Release Snapshot', ok: 'Replace', danger: true }))) return false;
            let snapshot;
            try { snapshot = this.shippedCurrent(version, true); }
            catch (error) { this.showToast('Could not read the release files: ' + error.message, 'error'); return false; }
            snapshot.date = new Date().toISOString();
            const next = { version: 1, releases: releases.filter(release => release.version !== version).concat([snapshot]) };
            if (!D.FS.atomicWriteJson(S.path, next, 2)) return false;
            this._shippedCache = null; this.showToast('Recorded release ' + version + '. Future save-name changes will be checked.', 'success');
            return true;
        },
        shippedNames(mapId) {
            const release = this.shippedRelease();
            return new Set((release && release.names[mapId] || []).map(name => S.resolveName((window.$dataDocsDoodads || {}).aliases, mapId, name)));
        },
        shippedHazards(items) {
            const mapId = this.currentMapId(), names = this.shippedNames(mapId), picked = new Set(items);
            const remaining = new Set(D.doodads(mapId).filter(item => item && !picked.has(item)).map(item => S.name(item.name)));
            return Array.from(new Set(items.map(item => S.name(item.name)).filter(name => name && names.has(name) && !remaining.has(name))));
        },
        withShippedAliases(mapId, changes, action) {
            const before = JSON.parse(JSON.stringify((window.$dataDocsDoodads.aliases || {})[mapId] || {})), after = JSON.parse(JSON.stringify(before));
            for (const [oldName, newName] of changes) {
                const old = S.name(oldName), next = S.name(newName);
                delete after[next]; delete after['name:' + next];
                if (old !== next) after['name:' + old] = next;
            }
            const set = value => {
                const data = window.$dataDocsDoodads;
                if (!data.aliases) data.aliases = {};
                if (Object.keys(value).length) data.aliases[mapId] = JSON.parse(JSON.stringify(value)); else delete data.aliases[mapId];
                if (!Object.keys(data.aliases).length) delete data.aliases;
                D.Persistence.dirtyDoodads = true;
            };
            const execute = D.Undo.execute;
            D.Undo.execute = function(command) {
                const apply = command.apply, revert = command.revert;
                command.apply = function() { const result = apply.call(this); set(after); return result; };
                command.revert = function() { const result = revert.call(this); set(before); return result; };
                return execute.call(this, command);
            };
            try { return action(); } finally { D.Undo.execute = execute; }
        },
        shippedIdentity(items) { return { mapId: this.currentMapId(), items: items.slice(), selection: this.selectionItems().slice() }; },
        shippedIdentityMatches(identity) {
            const selection = this.selectionItems();
            return identity.mapId === this.currentMapId() && identity.items.every(item => D.doodads(identity.mapId).includes(item))
                && selection.length === identity.selection.length && selection.every((item, index) => item === identity.selection[index]);
        },
        async confirmShippedChange(items, target, action) {
            const hazards = this.shippedHazards(items);
            if (!hazards.length) return action();
            const identity = this.shippedIdentity(items), candidates = target === null ? Array.from(new Set(D.doodads(identity.mapId).filter(item => item && !items.includes(item)).map(item => String(item.name || '').trim()).filter(Boolean))) : [];
            const canKeep = target !== null ? Boolean(S.name(target)) : candidates.length > 0;
            const choices = [{ label: 'Cancel', value: null }];
            if (canKeep) choices.push({ label: 'Keep the Old Name Working', value: 'keep', main: true });
            choices.push({ label: target === null ? 'Delete without an Alias' : 'Rename without an Alias', value: 'change', kind: 'danger' });
            const choice = await U.choose('Players\' saves know ' + hazards.join(', ') + '. Keep their saved states and lights attached to another name? Existing saved values for that target take priority.', choices, { title: 'Released Save Names', icon: 'history' });
            if (!choice || !this.shippedIdentityMatches(identity)) { this.refreshInspector(); return false; }
            let next = target;
            if (choice === 'keep' && target === null) {
                const picked = await U.form({ title: 'Keep the Old Name Working', ok: 'Keep and Delete', fields: [{ key: 'target', label: 'Existing name to receive saved states and lights', type: 'select', value: candidates[0], options: candidates.map(name => ({ value: name, label: name })) }] });
                if (!picked || !candidates.includes(picked.target) || !this.shippedIdentityMatches(identity)) return false;
                next = picked.target;
                if (!D.doodads(identity.mapId).some(item => item && !items.includes(item) && String(item.name || '').trim() === next)) return false;
            }
            const result = choice === 'keep' ? this.withShippedAliases(identity.mapId, hazards.map(name => [name, next]), action) : action();
            this.refreshInspector(); return result;
        }
    });
    const set = W.setDoodadProperty;
    W.setDoodadProperty = function(items, key, value) {
        if (key !== 'name' || !this.shippedHazards(items).length || items.every(item => S.name(item.name) === S.name(value))) return set.call(this, items, key, value);
        return this.confirmShippedChange(items, String(value || '').trim(), () => set.call(this, items, key, value));
    };
    const remove = W.deleteSelectedDoodad;
    W.deleteSelectedDoodad = function() {
        const items = this.selectionItems().filter(item => !item.locked);
        return this.shippedHazards(items).length ? this.confirmShippedChange(items, null, () => remove.call(this)) : remove.call(this);
    };
    W.problemGroups.push(['shipped', 'Released saves']);
})();
