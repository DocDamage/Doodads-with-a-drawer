//==========================================================
// SECTION 25: WORKSPACE: NAMES AND ICONS OVER EVENTS
//==========================================================
// The event's Details write <docs label: ...> and <docs icon: n> into its note (DocsDoodads.EventLabels): one
// undo step, saved with the map, and shown on the running map at once.
Object.assign(DocsDoodads.Workspace, {
    // Resolves whether the note changed.
    editEventLabel(label, icon) {
        const ev = this.selectedStagedEvent();
        if (!ev) return false;
        const L = DocsDoodads.EventLabels;
        const before = String(ev.note || '');
        const after = L.writeNote(before, label, icon);
        if (after === before) return false;
        const ge = this.selectedEvent && this.selectedEvent.gameEvent;
        const set = note => {
            ev.note = note;
            // The running event reads its own copy of the map; it follows, and its cached text is read again.
            const live = ge && typeof ge.event === 'function' ? ge.event() : null;
            if (live && live !== ev) live.note = note;
            const VE = DocsDoodads.VisualEquip;
            if (ge && VE && VE._eventText) VE._eventText.delete(ge);
            if (L._maps && typeof $dataMap !== 'undefined' && $dataMap) L._maps.delete($dataMap);
            DocsDoodads.Persistence.dirtyMap = true;
        };
        DocsDoodads.Undo.execute({ type: 'event_label', apply: () => set(after), revert: () => set(before) });
        return true;
    }
});
