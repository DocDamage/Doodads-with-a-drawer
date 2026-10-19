//==========================================================
// SECTION 9: DocsDoodads.COMPAT (MZ ENGINE ACCESS)
//==========================================================
DocsDoodads.Compat = {
    isNwjs() {
        return typeof Utils !== 'undefined' && typeof Utils.isNwjs === 'function' ? Utils.isNwjs() : (typeof require !== 'undefined');
    },
    // A playtest (MZ's "test" option). Without MZ's Utils it is not one, as FS.writable() also says.
    isTest() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' ? Boolean(Utils.isOptionValid("test")) : false;
    },
    getCanvas() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.view) return Graphics.app.view;
            if (Graphics._canvas) return Graphics._canvas;
        }
        if (typeof document !== 'undefined') {
            return document.getElementById('GameCanvas') || document.querySelector('canvas');
        }
        return null;
    },
    getRenderer() {
        return typeof Graphics !== 'undefined' && Graphics.app ? Graphics.app.renderer || null : null;
    }
};

