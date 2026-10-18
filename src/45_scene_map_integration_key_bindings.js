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
        // editKey is a KeyboardEvent.code ("F10"), which Input.keyMapper never reports, so opening is handled here.
        if (e.code === editKey) {
            const onMap = typeof Scene_Map !== 'undefined' && typeof SceneManager !== 'undefined' && SceneManager._scene instanceof Scene_Map;
            if (!DocsDoodads.Workspace.mounted && !onMap) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggle();
            return;
        }
        if (!DocsDoodads.Workspace.mounted || DocsDoodads.isEditableTarget(e.target)) return;
        if (DocsDoodads.Slicing.Editor.modal) return; // the slicer owns undo/delete while it is open
        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            DocsDoodads.Undo.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            DocsDoodads.Undo.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            DocsDoodads.Persistence.saveAll();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            DocsDoodads.Workspace.duplicateSelectedDoodad();
        } else if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            DocsDoodads.Workspace.showCommandPalette();
        } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            DocsDoodads.Workspace.copySelected();
        } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            DocsDoodads.Workspace.pasteCopied();
        } else if (e.key === 'Delete') {
            if (DocsDoodads.Workspace.selectedEvent) {
                DocsDoodads.Workspace.deleteSelectedEvent();
            } else {
                DocsDoodads.Workspace.deleteSelectedDoodad();
            }
        } else if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            DocsDoodads.Workspace.toggleGrid();
        } else if (e.key === 'h' || e.key === 'H') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggleInspector();
        } else if (e.key === 'f' || e.key === 'F') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.focusSearch();
        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (DocsDoodads.Workspace.selectedDoodads && DocsDoodads.Workspace.selectedDoodads.length > 0 ? DocsDoodads.Workspace.selectedDoodads : (DocsDoodads.Workspace.selectedDoodad ? [DocsDoodads.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
            if (items.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                items.forEach(d => {
                    if (e.key === 'ArrowLeft') d.x -= step;
                    if (e.key === 'ArrowRight') d.x += step;
                    if (e.key === 'ArrowUp') d.y -= step;
                    if (e.key === 'ArrowDown') d.y += step;
                });
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
                DocsDoodads.Workspace.refreshInspector();
            } else if (DocsDoodads.Workspace.selectedEvent) {
                e.preventDefault();
                const evInfo = DocsDoodads.Workspace.selectedEvent;
                const ge = evInfo.gameEvent;
                const ev = evInfo.stagedEvent || (ge && ge.event());
                if (ev) {
                    const oldX = ev.x, oldY = ev.y;
                    let nx = ev.x, ny = ev.y;
                    if (e.key === 'ArrowLeft') nx--;
                    if (e.key === 'ArrowRight') nx++;
                    if (e.key === 'ArrowUp') ny--;
                    if (e.key === 'ArrowDown') ny++;
                    ev.x = nx; ev.y = ny;
                    if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; }
                    DocsDoodads.Undo.execute({
                        type: 'move_event',
                        apply: () => { ev.x = nx; ev.y = ny; if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; } },
                        revert: () => { ev.x = oldX; ev.y = oldY; if (ge) { ge._x = oldX; ge._y = oldY; ge._realX = oldX; ge._realY = oldY; } }
                    });
                    DocsDoodads.Workspace.refreshInspector();
                }
            }
        } else if (DocsDoodads.Workspace.placementTool === 'path' && (e.key === 'Enter' || e.key === 'Backspace')) {
            e.preventDefault();
            if (e.key === 'Enter') DocsDoodads.Workspace.finishPath();
            else DocsDoodads.Workspace.pathPoints.pop();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            DocsDoodads.Workspace.setPlacementTool(null);
            DocsDoodads.Workspace.removeGhost();
            DocsDoodads.Workspace.selectDoodad(null);
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    const recoveryTimer = setInterval(() => {
        if (editorMode && DocsDoodads.Compat.isTest() && window.$gameMap && (DocsDoodads.Persistence.dirtyMap || DocsDoodads.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: DocsDoodads.doodads(),
                mapSettings: window.$dataDocsDoodads ? window.$dataDocsDoodads.mapSettings : undefined,
                world: window.$dataDocsDoodads ? window.$dataDocsDoodads.world : undefined,
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
