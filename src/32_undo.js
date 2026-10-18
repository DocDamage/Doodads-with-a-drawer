//==========================================================
// SECTION 20: DocsDoodads.UNDO (COMMAND-BASED HISTORY STACK)
//==========================================================
DocsDoodads.Undo = {
    undoStack: [],
    redoStack: [],
    maxDepth: 300,

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
        terrain_paint: 'Terrain brush stroke', biome_paint: 'Biome brush stroke'
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
            DocsDoodads.Workspace.updateUndoButtons();
            if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        }
        return moved;
    },

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.updateUndoButtons();
    },

    execute(command) {
        if (!command || !command.apply || !command.revert) return;
        DocsDoodads.Usage.lastIndex = null;
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = [];
        DocsDoodads.Workspace.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
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
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playOk();
        return true;
    }
};

