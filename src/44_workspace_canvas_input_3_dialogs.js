    // ---- Info, backups, recovery notices, messages and the undo buttons; DocsDoodads.Workspace ends here ----
    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'dd-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('info', 1)} Info</div>
            <div style="font-size: 12px; line-height: 1.8; color: var(--dd-text);">
                <div>Total Indexed Assets: <strong style="color: var(--dd-text);">${DocsDoodads.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: var(--dd-text);">${Object.keys(DocsDoodads.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: var(--dd-text);">${DocsDoodads.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: var(--dd-text);">${DocsDoodads.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: var(--dd-text);">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="dd-btn dd-btn-primary" id="dd-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="dd-btn" id="dd-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="dd-btn" id="dd-close-diag-btn">Close</button>
            </div>
            <button class="dd-btn" id="dd-restore-backup-btn" style="width: 100%; margin-top: 8px; border-color: var(--dd-warn); color: var(--dd-warn);">Restore Project Backup…</button>
        `;
        document.body.appendChild(diag);

        document.getElementById('dd-rebuild-idx-btn').onclick = async () => {
            if (diag.parentNode) diag.parentNode.removeChild(diag);
            if (!(await DocsDoodads.Ui.confirm('Every file in the Item Bag is read again. Tags, favourites, collections, cut-up pieces, collision, placement and use counts are kept.',
                { title: 'Rebuild the index?', ok: 'Rebuild' }))) return;
            const token = { cancelled: false };
            const pill = DocsDoodads.Ui.progress('Rebuilding the index', { onCancel: () => { token.cancelled = true; } });
            let result;
            try {
                result = await DocsDoodads.AssetIndex.rebuild({ cancellationToken: token, onProgress: p => pill.update(p.completed, p.total) });
            } finally {
                pill.finish();
            }
            this.refreshDrawerCards();
            this.showToast(result && result.cancelled ? 'Rebuild stopped: files read so far are updated.' : `Index rebuilt: ${result ? result.indexed : 0} file(s) read again.`, 'success');
        };

        document.getElementById('dd-clear-cache-btn').onclick = () => {
            DocsDoodads.Thumbnail.clearCache();
            this.refreshDrawerCards();
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-restore-backup-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
            this.showBackupRestoreModal();
        };

        document.getElementById('dd-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showBackupRestoreModal() {
        const mapFile = `data/Map${String($gameMap ? $gameMap.mapId() : 0).padStart(3, '0')}.json`;
        const targets = [
            { label: 'Current Map', path: mapFile },
            DocsDoodads.DataFiles.split
                ? { label: 'Doodads (this map)', path: DocsDoodads.DataFiles.mapPath($gameMap ? $gameMap.mapId() : 0) }
                : { label: 'Doodads', path: DocsDoodads.DataFiles.mainPath() },
            { label: 'Asset Library', path: DocsDoodads.AssetIndex.libraryPath }
        ];
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 480px; padding: 20px; z-index: 10035; border: 1px solid var(--dd-warn);
        `;
        modal.innerHTML = `
            <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('folder', 1)} Bring Back a Backup</div>
            <div style="font-size: 11px; line-height: 1.5; color: var(--dd-text); margin-bottom: 14px;">
                Backups are validated before restore. The current file is backed up again first so this action remains reversible.
            </div>
            <label style="font-size: 11px; color: var(--dd-muted);">Project file</label>
            <select id="dd-restore-target" style="width: 100%; margin: 5px 0 12px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;">
                ${targets.map(target => `<option value="${target.path}">${target.label} — ${target.path}</option>`).join('')}
            </select>
            <label style="font-size: 11px; color: var(--dd-muted);">Backup snapshot</label>
            <select id="dd-restore-source" style="width: 100%; margin: 5px 0 16px; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 7px;"></select>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-restore-cancel">Cancel</button>
                <button class="dd-btn" id="dd-restore-confirm" style="background: var(--dd-warn-soft);">Restore Selected Backup</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetSelect = document.getElementById('dd-restore-target');
        const backupSelect = document.getElementById('dd-restore-source');
        const restoreButton = document.getElementById('dd-restore-confirm');
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        const refreshBackups = () => {
            const backups = DocsDoodads.FS.listBackups(targetSelect.value);
            backupSelect.innerHTML = '';
            for (const backup of backups) {
                const option = document.createElement('option');
                option.value = backup.path;
                option.textContent = `${new Date(backup.mtimeMs).toLocaleString()} — ${Math.ceil(backup.size / 1024)} KB`;
                backupSelect.appendChild(option);
            }
            restoreButton.disabled = backups.length === 0;
            if (backups.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'No backups available for this file';
                backupSelect.appendChild(option);
            }
        };
        targetSelect.onchange = refreshBackups;
        document.getElementById('dd-restore-cancel').onclick = close;
        restoreButton.onclick = async () => {
            if (!backupSelect.value) return;
            const targetPath = targetSelect.value;
            const backupPath = backupSelect.value;
            const isLibrary = targetPath === DocsDoodads.AssetIndex.libraryPath;
            const unsaved = !isLibrary && DocsDoodads.Persistence.hasUnsavedWork() ? ' Changes not saved yet are dropped, and Undo starts again.' : '';
            if (!(await DocsDoodads.Ui.confirm(`${targetPath} will be replaced by the backup you picked. The file as it is now is backed up first, so this can be undone the same way.${unsaved}`,
                { title: 'Restore this backup?', ok: 'Restore', danger: true }))) return;
            if (!modal.parentNode) return;
            const result = DocsDoodads.FS.restoreBackup(targetPath, backupPath);
            if (!result.ok) {
                this.showToast(`Restore failed: ${result.error}`);
                return;
            }
            this.afterRestore(targetPath);
            close();
            this.showToast(isLibrary ? 'Backup restored.' : 'Backup restored. Reload the current map before continuing edits.');
        };
        refreshBackups();
    },

    // After a backup is put back: the editor reads it again. For doodads or a map, what is in memory goes
    // (Undo's steps point into the old data, and the unsaved flags and staged maps describe it).
    afterRestore(targetPath) {
        const D = DocsDoodads;
        if (targetPath === D.AssetIndex.libraryPath) {
            D.AssetIndex.init();
            this.reresolveAssets();
            this.refreshDrawerCards();
            this.refreshInspector();
            return 'library';
        }
        D.Persistence.discardUnsaved();
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshSpriteset();
        this.refreshInspector();
        return 'data';
    },

    showRecoveryNotices() {
        const notices = DocsDoodads.FS.takeRecoveryNotices();
        if (notices.length > 0) this.showToast(notices.join(' '), 9000);
    },

    // kind: a duration in ms, or 'info' / 'success' / 'error' (colour, and errors stay longer).
    // opts.action: { label, run } adds a button (Undo, for one) and keeps the message up longer.
    // Every message is kept in the Messages list (More), so a missed one can be read again.
    toastLog: [],

    showToast(msg, kind, opts = {}) {
        const styles = { info: ['info', 2200], success: ['done', 2200], error: ['close', 5000] };
        const [icon, wait] = typeof kind === 'number' ? ['info', kind] : (styles[kind] || styles.info);
        const action = opts && opts.action && typeof opts.action.run === 'function' ? opts.action : null;
        const duration = Math.max(action ? 8000 : 800, Number(wait) || 2200);
        this.toastLog = [{ msg: String(msg), kind: typeof kind === 'string' ? kind : 'info', at: Date.now() }].concat(this.toastLog || []).slice(0, 60);
        if (this._toastHistoryOpen) this.renderToastHistory();
        // One at a time: a new message replaces the last.
        const old = document.getElementById('dd-toast');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const toast = document.createElement('div');
        toast.id = 'dd-toast';
        toast.className = 'dd-toast' + (kind === 'success' ? ' dd-toast-success' : kind === 'error' ? ' dd-toast-error' : '');
        toast.innerHTML = `${DocsDoodads.Ui.icon(icon, 1)}<span></span>`;
        const text = toast.querySelector ? toast.querySelector('span') : null;
        if (text) text.textContent = msg; else toast.textContent = msg;
        if (kind === 'error') DocsDoodads.Ui.sound('buzzer');
        if (action) {
            toast.style.pointerEvents = 'auto';
            const btn = document.createElement('button');
            btn.className = 'dd-btn';
            btn.type = 'button';
            btn.textContent = action.label || 'Undo';
            btn.onclick = () => { if (toast.parentNode) toast.parentNode.removeChild(toast); action.run(); };
            toast.appendChild(btn);
            toast._ddAction = btn;
            // While the mouse is on it, it stays.
            toast.onmouseenter = () => { toast._ddHover = true; };
            toast.onmouseleave = () => { toast._ddHover = false; if (toast._ddExpired) fade(); };
        }
        document.body.appendChild(toast);
        const fade = () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        };
        setTimeout(() => {
            toast._ddExpired = true;
            if (!toast._ddHover) fade();
        }, duration);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-undo-btn');
        const rBtn = document.getElementById('dd-redo-btn');
        // Faded when there is nothing to take back, and said so to screen readers.
        const show = (btn, any) => {
            if (!btn) return;
            btn.style.opacity = any ? '1' : '0.5';
            if (btn.setAttribute) btn.setAttribute('aria-disabled', String(!any));
        };
        show(uBtn, DocsDoodads.Undo.undoStack.length > 0);
        show(rBtn, DocsDoodads.Undo.redoStack.length > 0);
        if (this._undoHistoryOpen) this.renderUndoHistory();
    }
};

