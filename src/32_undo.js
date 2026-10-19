//==========================================================
// SECTION 20: DocsDoodads.UNDO (COMMAND-BASED HISTORY STACK)
//==========================================================
DocsDoodads.Undo = {
    undoStack: [],
    redoStack: [],
    maxDepth: 300,
    // Other maps' steps, kept while the editor is on another map: { mapId: { undo, redo, staged, stat } }.
    parked: {},
    parkOrder: [],
    maxParkedMaps: 10,

    labels: {
        edit_doodads: 'Edit doodads', move_doodads: 'Move doodads', adjust_doodads: 'Adjust doodads', trace_collision: 'Trace collision',
        place_doodad: 'Place doodad', paste_doodads: 'Paste doodads', delete_doodads: 'Delete doodads', duplicate_doodads: 'Duplicate doodads',
        scatter_doodads: 'Scatter brush', place_path: 'Draw path', place_prefab: 'Place prefab', sync_prefab: 'Sync prefab copies',
        align_doodads: 'Align', distribute_doodads: 'Distribute', group_doodads: 'Group', ungroup_doodads: 'Ungroup',
        lock_doodads: 'Lock or unlock', hide_doodads: 'Hide or show', z_order_fwd: 'Bring forward', z_order_back: 'Send backward',
        z_order_front: 'Bring to front', z_order_bottom: 'Send to back', create_event: 'Create event', delete_event: 'Delete event',
        duplicate_event: 'Duplicate event', move_event: 'Move event', append_audio_command: 'Add sound to event',
        map_ambient: 'Map setting', map_setting: 'Map setting', world_setting: 'Project setting', map_neighbors: 'Neighbouring maps',
        delete_layer: 'Delete layer', dress_map: 'Dress map', clear_dressing: 'Clear dressing', restore_history: 'Restore from history',
        restore_event: 'Restore event', move_to_map: 'Move to map', copy_to_map: 'Copy to map', mirror_edges: 'Mirror edges',
        terrain_paint: 'Terrain brush stroke', region_paint: 'Region brush stroke', biome_paint: 'Biome brush stroke', nudge_doodads: 'Nudge',
        event_trigger: 'Event trigger', event_priority: 'Event priority', transform_doodad: 'Move / scale',
        set_collision: 'Collision', scatter_erase: 'Scatter eraser', replace_art: 'Replace art'
    },

    markDirty() {
        if (DocsDoodads.Persistence) DocsDoodads.Persistence.dirtyDoodads = true;
    },

    labelFor(command) {
        if (!command) return '';
        if (command.label) return String(command.label);
        const type = String(command.type || '');
        if (this.labels[type]) return this.labels[type];
        if (!type) return 'Edit';
        const words = type.replace(/[_-]+/g, ' ').trim();
        return words.charAt(0).toUpperCase() + words.slice(1);
    },

    // The steps, oldest first: { index, label, done } (done: still applied). The current point is
    // after the last done step.
    history() {
        const done = this.undoStack.map((c, i) => ({ index: i, label: this.labelFor(c), done: true }));
        const undone = this.redoStack.slice().reverse().map((c, i) => ({ index: done.length + i, label: this.labelFor(c), done: false }));
        return done.concat(undone);
    },

    // Undo or redo until `count` steps are applied (0 = before everything that can be undone).
    goTo(count) {
        const target = Math.max(0, Math.min(this.undoStack.length + this.redoStack.length, Math.round(Number(count) || 0)));
        let moved = 0;
        while (this.undoStack.length > target && this.undoStack.length) {
            const cmd = this.undoStack.pop();
            cmd.revert();
            this.redoStack.push(cmd);
            moved++;
        }
        while (this.undoStack.length < target && this.redoStack.length) {
            const cmd = this.redoStack.pop();
            cmd.apply();
            this.undoStack.push(cmd);
            moved++;
        }
        if (moved) {
            this.syncEvents();
            this.markDirty();
            DocsDoodads.Workspace.updateUndoButtons();
            if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        }
        return moved;
    },

    // Every map's steps go (after Discard, or a restore from disk).
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.parked = {};
        this.parkOrder = [];
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.updateUndoButtons();
    },

    hasHistory() {
        return this.undoStack.length > 0 || this.redoStack.length > 0;
    },

    // Leaving a map: its steps wait for the editor to come back, with the map data they were made
    // against (staged) and the map file's date, so steps on a map changed in MZ meanwhile are dropped.
    park(mapId, staged, stat) {
        mapId = Number(mapId) || 0;
        if (this.hasHistory()) {
            this.parked[mapId] = { undo: this.undoStack, redo: this.redoStack, staged: staged || null, stat: stat || null };
            this.parkOrder = this.parkOrder.filter(id => id !== mapId).concat([mapId]);
            while (this.parkOrder.length > this.maxParkedMaps) delete this.parked[this.parkOrder.shift()];
        }
        this.undoStack = [];
        this.redoStack = [];
    },

    // Arriving on a map: its steps come back. Returns { steps, staged, dropped } (dropped: the map file
    // changed since, so its steps were let go).
    unpark(mapId, stat) {
        mapId = Number(mapId) || 0;
        const p = this.parked[mapId];
        delete this.parked[mapId];
        this.parkOrder = this.parkOrder.filter(id => id !== mapId);
        this.undoStack = [];
        this.redoStack = [];
        if (!p) return { steps: 0, staged: null, dropped: false };
        const changed = p.stat && stat && (p.stat.mtimeMs !== stat.mtimeMs || p.stat.size !== stat.size);
        if (changed) return { steps: 0, staged: null, dropped: true };
        this.undoStack = p.undo;
        this.redoStack = p.redo;
        return { steps: p.undo.length + p.redo.length, staged: p.staged, dropped: false };
    },

    // Events on the map follow the map data after an undo (they may be new objects since the step).
    syncEvents() {
        const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
        if (!gameMap || !gameMap._stagedMapData || typeof gameMap.events !== 'function') return;
        const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
        if (owner !== gameMap.mapId()) return;
        const events = gameMap._stagedMapData.events || [];
        for (const ge of gameMap.events()) {
            if (!ge || typeof ge.eventId !== 'function') continue;
            const ev = events[ge.eventId()];
            if (!ev) {
                if (!ge._erased) { ge._erased = true; ge._docsEditorErased = true; }
            } else {
                if (ge._docsEditorErased) { ge._erased = false; delete ge._docsEditorErased; }
                if ((ge.x !== ev.x || ge.y !== ev.y) && typeof ge.locate === 'function') ge.locate(ev.x, ev.y);
            }
        }
    },

    execute(command) {
        if (!command || !command.apply || !command.revert) return;
        DocsDoodads.Usage.lastIndex = null;
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = [];
        this.markDirty();
        DocsDoodads.Workspace.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
        this.syncEvents();
        this.markDirty();
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playCancel();
        return true;
    },

    redo() {
        if (this.redoStack.length === 0) return false;
        const cmd = this.redoStack.pop();
        cmd.apply();
        this.undoStack.push(cmd);
        this.syncEvents();
        this.markDirty();
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playOk();
        return true;
    }
};

