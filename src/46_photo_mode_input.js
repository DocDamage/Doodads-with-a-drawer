//==========================================================
// SECTION 27: PLAYER PHOTO MODE INPUT
//==========================================================
// This final game-safe hook loads after the editor's central keyboard router. Deployed games do not
// include that editor-only router, so Photo Mode still gets the same key and wheel controls there.
(function(P) {
    'use strict';

    P.uninstallInput = function() {
        const target = this._inputWindow;
        if (target && typeof target.removeEventListener === 'function') {
            if (this._keyHandler) target.removeEventListener('keydown', this._keyHandler, true);
            if (this._wheelHandler) target.removeEventListener('wheel', this._wheelHandler, true);
        }
        this._inputWindow = null;
        this._keyHandler = null;
        this._wheelHandler = null;
    };

    P.installInput = function(target) {
        if (!target || typeof target.addEventListener !== 'function') return false;
        if (this._inputWindow === target && this._keyHandler && this._wheelHandler) return true;
        this.uninstallInput();
        this._inputWindow = target;
        this._keyHandler = event => this.onKey(event);
        this._wheelHandler = event => this.onWheel(event);
        target.addEventListener('keydown', this._keyHandler, true);
        target.addEventListener('wheel', this._wheelHandler, { capture: true, passive: false });
        return true;
    };

    if (typeof window !== 'undefined') P.installInput(window);
})(DocsDoodads.PhotoMode);
