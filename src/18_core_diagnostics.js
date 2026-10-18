//==========================================================
// SECTION 8: DocsDoodads.CORE & DIAGNOSTICS
//==========================================================
DocsDoodads.Core = {
    version: pluginVersion,
    events: {},

    on(event, handler) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(handler);
    },

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(fn => fn(data));
        }
    },

    log() {
        if (devDiagnostics) {
            console.log("[DocsDoodads]", ...arguments);
        }
    }
};

