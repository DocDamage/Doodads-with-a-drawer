//==========================================================
// SECTION 8: DocsDoodads.CORE & DIAGNOSTICS
//==========================================================
DocsDoodads.Core = {
    log() {
        if (devDiagnostics) {
            console.log("[DocsDoodads]", ...arguments);
        }
    }
};

