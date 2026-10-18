//==========================================================
// SECTION 9: DocsDoodads.COMPAT (MZ ENGINE ACCESS)
//==========================================================
DocsDoodads.Compat = {
    isNwjs() {
        return typeof Utils !== 'undefined' && typeof Utils.isNwjs === 'function' ? Utils.isNwjs() : (typeof require !== 'undefined');
    },
    isTest() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' ? Utils.isOptionValid("test") : true;
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

