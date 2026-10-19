//==========================================================
// SECTION 25: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        $.Scene_Map_onMapLoaded.call(this);
        DocsDoodads.Workspace.onMapLoaded();
    };
}

DocsDoodads.editChord = DocsDoodads.KeyChord.parse(editKey);

DocsDoodads.isEditableTarget = function(target) {
    return Boolean(target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable));
};

// While the workspace is open the game world is frozen: clicks in editor panels must not
// walk the player, events must not wander or trigger, and the menu must stay closed.
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (DocsDoodads.Workspace.mounted) return false;
        return $.Game_Player_canMove.call(this);
    };
}
if (typeof Game_Event !== 'undefined') {
    $.Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        if (DocsDoodads.Workspace.mounted) return;
        $.Game_Event_updateSelfMovement.call(this);
    };
}
if (typeof Game_Map !== 'undefined') {
    // Staged event edits belong to the map they were made on; park them when another map loads.
    $.Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (this === window.$gameMap && this._mapId && this._mapId !== mapId) {
            DocsDoodads.Persistence.onMapChanging(this._mapId, mapId);
        }
        $.Game_Map_setup.call(this, mapId);
    };
    $.Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        if (DocsDoodads.Workspace.mounted) return true;
        return $.Game_Map_isEventRunning.call(this);
    };
}
// MZ's TouchInput cancels every wheel event on the document, which stops the asset grid,
// tab bar, and inspector lists from scrolling. The game has no use for the wheel while editing.
if (typeof TouchInput !== 'undefined' && typeof TouchInput._onWheel === 'function') {
    $.TouchInput__onWheel = TouchInput._onWheel;
    TouchInput._onWheel = function(event) {
        if (DocsDoodads.Workspace.mounted) return;
        $.TouchInput__onWheel.call(this, event);
    };
}
// MZ's Input listens on the whole document and prevents Backspace/arrows by default,
// which breaks typing in workspace fields and lets keystrokes drive the game.
if (typeof Input !== 'undefined' && typeof Input._onKeyDown === 'function') {
    $.Input__onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        if (DocsDoodads.Workspace.mounted && DocsDoodads.isEditableTarget(event.target)) return;
        // MZ cancels Tab on everything that isn't a field, so in the editor it would never leave a button.
        if (DocsDoodads.Workspace.mounted && event.keyCode === 9) return;
        $.Input__onKeyDown.call(this, event);
    };
}

// Windows Explorer native drag and drop import listener with transactional options modal
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('dragover', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const sourcePaths = [];
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    if (f.path) sourcePaths.push(f.path);
                }
                if (sourcePaths.length > 0) DocsDoodads.Workspace.showAssetImportModal(sourcePaths);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Ui.dialogOpen()) return; // a question card is answered first
        // editKey is a KeyboardEvent.code ("F10"), maybe with Ctrl, Shift or Alt, which Input.keyMapper never
        // reports, so opening is handled here. A key that types is left to fields being typed in.
        if (DocsDoodads.KeyChord.matches(DocsDoodads.editChord, e) && !(DocsDoodads.KeyChord.types(DocsDoodads.editChord) && DocsDoodads.isEditableTarget(e.target))) {
            const onMap = typeof Scene_Map !== 'undefined' && typeof SceneManager !== 'undefined' && SceneManager._scene instanceof Scene_Map;
            if (!DocsDoodads.Workspace.mounted && !onMap) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggle();
            return;
        }
        if (!DocsDoodads.Workspace.mounted || DocsDoodads.isEditableTarget(e.target)) return;
        if (DocsDoodads.Slicing.Editor.modal) return; // the slicer owns undo/delete while it is open
        if (DocsDoodads.Workspace.capturingShortcut()) return; // the next keys are a new binding
        // The path tool's own keys come first; then the shortcut table (11_shortcuts.js); then the keys
        // that can't be rebound.
        const pathKey = DocsDoodads.Workspace.placementTool === 'path' && (e.key === 'Enter' || e.key === 'Backspace');
        const shortcut = pathKey ? null : DocsDoodads.Shortcuts.match(e);
        if (shortcut && DocsDoodads.Workspace.runShortcut(shortcut, e)) return;
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const W = DocsDoodads.Workspace;
            const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
            const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
            if (W.selectionItems().some(d => !d.locked)) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                W.nudgeSelection(dx * step, dy * step);
            } else if (W.selectedEvent) {
                e.preventDefault();
                const w = window.$gameMap && $gameMap.width ? $gameMap.width() : Infinity;
                const h = window.$gameMap && $gameMap.height ? $gameMap.height() : Infinity;
                const moved = W.editSelectedEvent('move_event', ev => {
                    ev.x = Math.max(0, Math.min(w - 1, ev.x + dx));
                    ev.y = Math.max(0, Math.min(h - 1, ev.y + dy));
                });
                if (moved) W.refreshInspector();
            }
        } else if (pathKey) {
            e.preventDefault();
            if (e.key === 'Enter') DocsDoodads.Workspace.finishPath();
            else DocsDoodads.Workspace.pathPoints.pop();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            DocsDoodads.Workspace.closeContextMenu();
            DocsDoodads.Workspace.setPlacementTool(null);
            const sym = document.getElementById('dd-sym-popover');
            if (sym) sym.style.display = 'none';
            const welcome = document.getElementById('dd-welcome-ok');
            if (welcome) welcome.click();
            DocsDoodads.Workspace.removeGhost();
            DocsDoodads.Workspace.selectDoodad(null);
        }
    });
}

// Closing the Playtest window or reloading it (F5) with unsaved work asks first: Save, Don't Save or
// Keep Editing. Anything going wrong while asking lets the window close rather than trapping it open.
DocsDoodads.leaveGuard = {
    asking: false,

    // proceed() closes or reloads. Returns true when it ran (or will once answered).
    request(action, proceed) {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Persistence.hasUnsavedWork()) {
            proceed();
            return true;
        }
        if (this.asking) return false;
        this.asking = true;
        let answer;
        try {
            answer = DocsDoodads.Workspace.confirmLeave(action, false);
        } catch (e) {
            answer = Promise.resolve(true);
        }
        Promise.resolve(answer).catch(() => true).then(go => {
            this.asking = false;
            if (go) proceed();
        });
        return false;
    }
};
if (typeof nw !== 'undefined' && nw && nw.Window && typeof nw.Window.get === 'function' && editorMode && DocsDoodads.Compat.isTest()) {
    try {
        // MZ's main.js quits on 'close' straight away; this listener takes its place and quits the same way
        // (nw.App.quit, MZ's fix for NW.js staying in memory) once it may.
        const win = nw.Window.get();
        if (typeof win.removeAllListeners === 'function') win.removeAllListeners('close');
        win.on('close', () => DocsDoodads.leaveGuard.request('close the game', () => {
            if (nw.App && typeof nw.App.quit === 'function') nw.App.quit(); else win.close(true);
        }));
    } catch (e) {}
}
if (typeof SceneManager !== 'undefined' && typeof SceneManager.reloadGame === 'function') {
    $.SceneManager_reloadGame = SceneManager.reloadGame;
    SceneManager.reloadGame = function() {
        DocsDoodads.leaveGuard.request('reload the game', () => $.SceneManager_reloadGame.call(SceneManager));
    };
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    const recoveryTimer = setInterval(() => {
        if (editorMode && DocsDoodads.Compat.isTest() && window.$gameMap && (DocsDoodads.Persistence.dirtyMap || DocsDoodads.Persistence.dirtyDoodads)) {
            const data = window.$dataDocsDoodads || {};
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: DocsDoodads.doodads(),
                // Every map's doodads (Move / Copy to Map, mirrored edges and prefab syncs reach other
                // maps) and the event edits parked for maps other than this one.
                allDoodads: Object.fromEntries(Object.entries(data).filter(([key, list]) => /^\d+$/.test(key) && Array.isArray(list))),
                stagedMaps: DocsDoodads.Persistence.stagedMaps,
                mapSettings: data.mapSettings,
                world: data.world,
                stagedMap: $gameMap._stagedMapData
            };
            DocsDoodads.FS.atomicWriteJson('data/DocsDoodadsRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
    if (recoveryTimer && typeof recoveryTimer.unref === 'function') {
        recoveryTimer.unref();
    }
}

})(DocsDoodads.reWrite);
