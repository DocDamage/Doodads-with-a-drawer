    // ---- Events, the right-click menu, sounds on events and bringing in files ----
    showAskEventModal(payload, coords, isAlt) {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('help', 1)} Doodad or event?</div>
            <div style="font-size: 12px; color: var(--dd-text); margin-bottom: 16px;">Does ${escapeHtml(payload.fileName)} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-ask-yes">Yes (Create MZ Event)</button>
                <button class="dd-btn" id="dd-ask-no">No (Decorative Doodad)</button>
                <button class="dd-btn" id="dd-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="dd-btn" id="dd-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="dd-btn" id="dd-ask-cancel" style="width: 100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const snapCoords = isAlt ? coords : this.snapToTile(coords);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-yes-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                DocsDoodads.AssetIndex.saveSoon();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                DocsDoodads.AssetIndex.saveSoon();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);
        const { name: baseName, code } = DocsDoodads.Audio.soundFor(payload);

        const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: `Sound_${baseName}`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: [
                { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });

        const staged = $gameMap._stagedMapData;
        DocsDoodads.Undo.execute({
            type: 'create_event',
            apply: () => { staged.events[newId] = ev; DocsDoodads.Persistence.dirtyMap = true; },
            revert: () => { delete staged.events[newId]; DocsDoodads.Persistence.dirtyMap = true; }
        });
        this.showToast(`Created Sound Event EV${String(newId).padStart(3, '0')}`);
    },

    deleteSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ge = evInfo.gameEvent;
        const ev = evInfo.stagedEvent || (ge && ge.event());
        const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
        if (!evId) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            // Undo.syncEvents hides and shows the game's event, so an event the game erased itself stays erased.
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                DocsDoodads.Undo.syncEvents();
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                DocsDoodads.Undo.syncEvents();
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent(null);
        this.toastUndo(`Deleted Event EV${String(evId).padStart(3, '0')}`);
    },

    // The selected event's staged copy (what Save writes); the selection is pointed at it.
    selectedStagedEvent() {
        const info = this.selectedEvent;
        if (!info || !window.$gameMap) return null;
        const id = info.gameEvent ? info.gameEvent.eventId() : (info.stagedEvent && info.stagedEvent.id);
        const staged = DocsDoodads.Persistence.stagedFor();
        const ev = staged && staged.events ? staged.events[id] : null;
        if (ev) info.stagedEvent = ev;
        return ev || null;
    },

    // mutate(ev) changes the selected event; one undo step, and the event on the map follows it.
    editSelectedEvent(type, mutate) {
        const ev = this.selectedStagedEvent();
        if (!ev) return false;
        const ge = this.selectedEvent.gameEvent;
        const before = JSON.parse(JSON.stringify(ev));
        mutate(ev);
        const after = JSON.parse(JSON.stringify(ev));
        const set = snapshot => {
            for (const key of Object.keys(ev)) delete ev[key];
            Object.assign(ev, JSON.parse(JSON.stringify(snapshot)));
            if (ge && (ge.x !== ev.x || ge.y !== ev.y)) ge.locate(ev.x, ev.y);
            DocsDoodads.Persistence.dirtyMap = true;
        };
        DocsDoodads.Undo.execute({ type, apply: () => set(after), revert: () => set(before) });
        return true;
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

        // One tile right, or the nearest free tile on the map (not off its edge, not on another event).
        const spot = DocsDoodads.Events.nearestFreeTile($gameMap._stagedMapData, (ev.x || 0) + 1, ev.y || 0,
            $gameMap.width ? $gameMap.width() : $gameMap._stagedMapData.width, $gameMap.height ? $gameMap.height() : $gameMap._stagedMapData.height);
        if (!spot) {
            this.showToast('Every tile on this map has an event: there is nowhere to put the copy.', 'error');
            return;
        }
        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = spot.x;
        dup.y = spot.y;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(`Duplicated to Event EV${String(newId).padStart(3, '0')}`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'dd-context-menu';
        menu.className = 'dd-glass';
        menu.style.cssText = 'position: fixed; z-index: 10050; display: flex; flex-direction: column; gap: 1px;';
        if (menu.setAttribute) { menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Actions'); }
        this._menuReturnFocus = typeof document !== 'undefined' ? document.activeElement : null;
        DocsDoodads.Ui.sound('cursor');
        const run = item => {
            this.closeContextMenu();
            this.noteMenuUse(item.label);
            if (item.onClick) item.onClick();
        };
        // Every action is a menu item the arrow keys reach; separators are skipped.
        const entries = [];
        const asItem = b => {
            if (b.setAttribute) { b.setAttribute('role', 'menuitem'); b.setAttribute('tabindex', '-1'); }
            entries.push(b);
        };
        const separator = () => {
            const sep = document.createElement('div');
            sep.className = 'dd-menu-sep';
            if (sep.setAttribute) sep.setAttribute('role', 'separator');
            return sep;
        };
        // The actions used most, as a row of buttons at the top.
        const quick = this.quickMenuItems(items);
        if (quick.length) {
            const rowEl = document.createElement('div');
            rowEl.className = 'dd-quick-row';
            quick.forEach(item => {
                const b = document.createElement('button');
                b.className = 'dd-btn' + (item.danger ? ' dd-danger' : '');
                b.title = item.label;
                b.innerHTML = `${item.iconName ? DocsDoodads.Ui.icon(item.iconName, 1) : `<span>${escapeHtml(item.icon || '•')}</span>`}<span>${escapeHtml(this.menuKey(item.label).replace(/#/g, '').replace(/\.\.\.$/, '').trim())}</span>`;
                b.onclick = e => { if (e && e.stopPropagation) e.stopPropagation(); run(item); };
                asItem(b);
                rowEl.appendChild(b);
            });
            if (rowEl.setAttribute) rowEl.setAttribute('role', 'group');
            menu.appendChild(rowEl);
            menu.appendChild(separator());
        }
        items.forEach(item => {
            if (item.separator) {
                menu.appendChild(separator());
                return;
            }
            const row = document.createElement('button');
            row.className = 'dd-btn' + (item.danger ? ' dd-danger' : '');
            row.style.cssText = 'width: 100%; text-align: left;';
            // Items name a pixel icon (iconName) or give a small symbol.
            const icon = item.iconName ? DocsDoodads.Ui.icon(item.iconName, 1) : `<span style="width: 16px; text-align: center;">${escapeHtml(item.icon || '•')}</span>`;
            row.innerHTML = `${icon}<span>${escapeHtml(item.label)}</span>`;
            row.onclick = (e) => {
                e.stopPropagation();
                run(item);
            };
            asItem(row);
            menu.appendChild(row);
        });
        if (menu.addEventListener) menu.addEventListener('keydown', e => this.contextMenuKey(entries, e));
        document.body.appendChild(menu);
        if (entries[0] && entries[0].focus) entries[0].focus();

        const menuW = menu.offsetWidth || 180;
        const menuH = menu.offsetHeight || 200;
        const left = Math.min(clientX, (window.innerWidth || 1200) - menuW - 10);
        const top = Math.min(clientY, (window.innerHeight || 800) - menuH - 10);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        const onDismiss = (ev) => {
            if (menu.contains(ev.target)) return;
            this.closeContextMenu();
            window.removeEventListener('pointerdown', onDismiss);
        };
        setTimeout(() => window.addEventListener('pointerdown', onDismiss), 50);
    },

    // Keys in the menu: arrows (and Home, End) move, Enter or Space runs, Esc or Tab closes. The keys stop
    // here, so the arrows don't also nudge the selection on the map.
    contextMenuKey(entries, e) {
        const list = entries.filter(b => !b.disabled);
        if (!list.length) return false;
        const active = typeof document !== 'undefined' ? document.activeElement : null;
        const i = list.indexOf(active);
        let next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = list[(i + 1) % list.length];
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = list[i < 0 ? list.length - 1 : (i + list.length - 1) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        else if (e.key === 'Enter' || e.key === ' ') { if (i >= 0 && list[i].click) list[i].click(); }
        else if (e.key === 'Escape' || e.key === 'Tab') this.closeContextMenu(true);
        else return false;
        if (next && next.focus) next.focus();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return true;
    },

    // Closing gives focus back to where it was when the menu opened, if the menu still had it.
    closeContextMenu(refocus) {
        const existing = typeof document !== 'undefined' ? document.getElementById('dd-context-menu') : null;
        if (!existing) return;
        const active = document.activeElement;
        const hadFocus = refocus || Boolean(active && existing.contains && existing.contains(active));
        if (existing.parentNode) existing.parentNode.removeChild(existing);
        const back = this._menuReturnFocus;
        this._menuReturnFocus = null;
        if (hadFocus && back && back.focus && back.isConnected !== false) back.focus();
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const evId = gameEvent.eventId();
        const ev = $gameMap._stagedMapData.events[evId] || gameEvent.event();
        if (!ev || !ev.pages || !ev.pages[0]) return;

        const { name: baseName, code } = DocsDoodads.Audio.soundFor(payload);

        const soundCmd = { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] };
        const pageList = ev.pages[0].list;
        const insertIdx = Math.max(0, pageList.length - 1);

        const cmd = {
            type: 'append_audio_command',
            apply: () => {
                pageList.splice(insertIdx, 0, soundCmd);
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.showToast(`Appended Sound Command to Event EV${String(evId).padStart(3, '0')}`);
    },

    async runAssetImport(sourcePaths, options = {}) {
        const plan = DocsDoodads.Import.planBatch(sourcePaths, options);
        const result = await DocsDoodads.Import.executeBatchAsync(plan, {
            cancellationToken: options.cancellationToken,
            onProgress: options.onProgress
        });
        if (!result.ok) return result;

        // Only the files just written are indexed, not every folder walked again.
        await DocsDoodads.AssetIndex.indexPaths(result.imported);
        this.refreshDrawerCards();

        if (options.autoSlice) {
            const path = DocsDoodads.FS.path;
            const imported = new Set(result.imported.map(filePath => path.resolve(filePath).toLowerCase()));
            const firstImage = DocsDoodads.AssetIndex.list.find(asset =>
                asset.category !== 'Audio' && imported.has(path.resolve(asset.path).toLowerCase())
            );
            if (firstImage && typeof setTimeout === 'function') {
                setTimeout(() => DocsDoodads.Slicing.Editor.open(firstImage), 0);
            }
        }
        return result;
    },

    showAssetImportModal(sourcePaths) {
        if (!DocsDoodads.FS.fs || !DocsDoodads.FS.path) {
            this.showToast('Explorer import requires NW.js filesystem access.');
            return;
        }

        const collected = DocsDoodads.Import.collectFiles(sourcePaths);
        const supportedCount = collected.files.filter(filePath => DocsDoodads.Import.isSupported(filePath)).length;
        if (supportedCount === 0) {
            this.showToast('No supported image or audio files were found.');
            return;
        }

        const previous = document.getElementById('dd-import-modal');
        if (previous && previous.parentNode) previous.parentNode.removeChild(previous);

        const overlay = document.createElement('div');
        overlay.id = 'dd-import-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10030; display: flex;
            align-items: center; justify-content: center; background: rgba(47, 42, 67, 0.35);
            pointer-events: auto;
        `;
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = 'width: 430px; padding: 20px; color: var(--dd-text);';
        const destinationOptions = DocsDoodads.Import.destinations
            .map(destination => `<option value="${destination}">${destination}</option>`)
            .join('');
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('plus', 1)} Add Files</div>
            <div style="font-size: 11px; color: var(--dd-muted); margin-bottom: 16px;">
                ${supportedCount} supported file(s) found${collected.files.length !== supportedCount ? `; ${collected.files.length - supportedCount} unsupported skipped` : ''}.
            </div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: var(--dd-text);">Destination</label>
            <select id="dd-import-destination" style="width: 100%; margin-bottom: 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                <option value="auto">Auto-route by asset type</option>
                ${destinationOptions}
            </select>
            <div id="dd-import-preview" style="max-height: 132px; overflow-y: auto; margin: -4px 0 12px; font-size: 11px; line-height: 1.5; color: var(--dd-muted);"></div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: var(--dd-text);">When a filename already exists (apply to all)</label>
            <select id="dd-import-collision" style="width: 100%; margin-bottom: 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                <option value="rename">Keep both (add numeric suffix)</option>
                <option value="skip">Skip incoming file</option>
                <option value="overwrite">Overwrite existing file</option>
                <option value="error">Cancel batch on collision</option>
            </select>
            <label style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: var(--dd-text); margin-bottom: 16px;">
                <input id="dd-import-auto-slice" type="checkbox" /> Open the first imported image in the slicer
            </label>
            <div id="dd-import-warning" style="display: none; color: var(--dd-warn); font-size: 11px; margin: -6px 0 12px;">
                Overwrite is explicit and transactional; existing files are restored if the batch fails.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-import-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-import-confirm">Import</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
        const destination = document.getElementById('dd-import-destination');
        const collision = document.getElementById('dd-import-collision');
        const autoSlice = document.getElementById('dd-import-auto-slice');
        const warning = document.getElementById('dd-import-warning');
        const confirmButton = document.getElementById('dd-import-confirm');
        const cancelButton = document.getElementById('dd-import-cancel');

        collision.onchange = () => {
            warning.style.display = collision.value === 'overwrite' ? 'block' : 'none';
        };
        // Where each file goes, so a wrong guess can be fixed before anything is copied.
        const preview = document.getElementById('dd-import-preview');
        const showPreview = () => {
            if (!preview) return;
            const rows = this.importPreviewRows(collected.files, destination.value);
            const shown = rows.slice(0, 40).map(r => `<div style="display: flex; gap: 6px;"><span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(r.source)}">${escapeHtml(r.name)}</span><b style="color: var(--dd-text);">${escapeHtml(r.folder)}</b></div>`);
            preview.innerHTML = shown.join('') + (rows.length > 40 ? `<div>…and ${rows.length - 40} more</div>` : '');
        };
        destination.onchange = showPreview;
        showPreview();
        cancelButton.onclick = () => close();
        // The import runs on in a progress pill (with Cancel), so the editor stays usable meanwhile.
        confirmButton.onclick = async () => {
            const token = { cancelled: false };
            const options = { destination: destination.value, collisionPolicy: collision.value, autoSlice: Boolean(autoSlice.checked), collected };
            close();
            const pill = DocsDoodads.Ui.progress('Bringing in files', { onCancel: () => { token.cancelled = true; } });
            pill.update(0, sourcePaths.length);
            let result;
            try {
                result = await this.runAssetImport(sourcePaths, Object.assign(options, {
                    cancellationToken: token,
                    onProgress: progress => pill.update(progress.completed, progress.total)
                }));
            } finally {
                pill.finish();
            }
            this.showToast(DocsDoodads.Import.describeResult(result), result.ok ? 3500 : 6000);
            this.updateIndexStatus();
        };
        overlay.onclick = event => { if (event.target === overlay) close(); };
    },

    // Each supported file and the folder it would go to, for the import card: chosen folder, or the guess.
    importPreviewRows(files, chosen) {
        const I = DocsDoodads.Import, path = DocsDoodads.FS.path;
        return (files || []).filter(f => I.isSupported(f)).map(source => ({
            source,
            name: path.basename(source),
            folder: chosen && chosen !== 'auto' ? chosen : (I.detectDestination(source) || '?')
        }));
    },

    // A message after a step that throws work away, with Undo while that step is still the last one.
    toastUndo(msg, kind) {
        const Undo = DocsDoodads.Undo;
        const cmd = Undo.undoStack[Undo.undoStack.length - 1];
        if (!cmd) return this.showToast(msg, kind);
        return this.showToast(msg, kind, { action: { label: 'Undo', run: () => {
            if (Undo.undoStack[Undo.undoStack.length - 1] === cmd) Undo.undo();
            else this.showToast('Other changes came after it: open Steps to go back further.', 'info');
        } } });
    },

    // A sound dropped on the map: add it to the event on that tile, or make a new event that plays it.
    async askAudioDrop(payload, coords) {
        const existing = window.$gameMap && window.$gameMap.eventsXy ? window.$gameMap.eventsXy(coords.tileX, coords.tileY) : [];
        const targetEv = existing && existing.length > 0 ? existing[0] : null;
        const evName = targetEv ? `EV${String(targetEv.eventId()).padStart(3, '0')}` : '';
        const answer = await DocsDoodads.Ui.choose(targetEv
            ? `Play ${payload.fileName} from ${evName}, the event on this tile, or from a new event?`
            : `Make an event on this tile that plays ${payload.fileName}?`, [
            { label: 'Cancel', value: null },
            ...(targetEv ? [{ label: 'New Event', value: 'new' }] : []),
            targetEv ? { label: `Add to ${evName}`, value: 'append', kind: 'primary' } : { label: 'Make Event', value: 'new', kind: 'primary' }
        ], { title: 'Sound on the map', icon: 'sound' });
        if (!this.mounted) return null;
        if (answer === 'append') this.appendAudioCommandToEvent(payload, targetEv);
        else if (answer === 'new') this.createAudioEvent(payload, coords);
        return answer;
    },

    // Save found the map changed in MZ since the editor opened it. Resolves the answer: 'force' (saved
    // over MZ's changes), 'reload' (MZ's version kept, event edits dropped) or null (nothing done).
    async showConflictModal() {
        const answer = await DocsDoodads.Ui.choose(
            "This map was saved in RPG Maker MZ after the Doodads editor opened it. Saving now would replace MZ's changes with yours.", [
            { label: "Don't Save Yet", value: null },
            { label: "Use MZ's Version (drop my event changes)", value: 'reload' },
            { label: "Save Mine Anyway (replace MZ's changes)", value: 'force', kind: 'danger' }
        ], { title: 'This map was changed in RPG Maker MZ', tone: 'danger', icon: 'help', stack: true });
        if (answer === 'force') {
            DocsDoodads.Persistence.saveAll(true);
        } else if (answer === 'reload') {
            const persistence = DocsDoodads.Persistence;
            for (const entry of persistence.pendingMapEntries()) {
                const file = persistence.mapFilePath(entry.mapId);
                persistence.sessionSnapshots[file] = DocsDoodads.FS.stat(file);
            }
            persistence.stagedMaps = {};
            if (window.$gameMap) { $gameMap._stagedMapData = null; delete $gameMap._stagedMapDataId; }
            persistence.dirtyMap = false;
            persistence.captureSession();
            this.updateSaveState();
            this.showToast("External Map Data Reloaded!");
        }
        return answer;
    },

