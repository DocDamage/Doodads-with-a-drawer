//==========================================================
// SECTION 9: DocsDoodads.COMPAT (MZ & MV ABSTRACTION)
//==========================================================
DocsDoodads.Compat = {
    isMZ() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MZ";
    },
    isMV() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MV";
    },
    isNwjs() {
        return typeof Utils !== 'undefined' && typeof Utils.isNwjs === 'function' ? Utils.isNwjs() : (typeof require !== 'undefined');
    },
    isTest() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' ? Utils.isOptionValid("test") : true;
    },
    tileSize() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth) {
            return $gameMap.tileWidth();
        }
        return 48;
    },
    createRectangle(x, y, w, h) {
        if (typeof Rectangle !== 'undefined') {
            return new Rectangle(x, y, w, h);
        }
        return { x: x, y: y, width: w, height: h };
    },
    createWindow(WindowClass, x, y, w, h) {
        if (this.isMZ()) {
            return new WindowClass(this.createRectangle(x, y, w, h));
        } else {
            return new WindowClass(x, y, w, h);
        }
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
    getStage() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.stage) return Graphics.app.stage;
            if (Graphics._stage) return Graphics._stage;
        }
        return null;
    },
    getRenderer() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.renderer) return Graphics.app.renderer;
            if (Graphics._renderer) return Graphics._renderer;
        }
        return null;
    },
    boxWidth() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxWidth || Graphics.width || 816;
        }
        return 816;
    },
    boxHeight() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxHeight || Graphics.height || 624;
        }
        return 624;
    },
    loadBitmap(folder, filename, hue = 0, smooth = true) {
        if (typeof ImageManager === 'undefined') return null;
        if (this.isMZ()) {
            return ImageManager.loadBitmap(folder, filename);
        }
        return ImageManager.loadBitmap(folder, filename, hue, smooth);
    },
    featureMatrix: {
        assetDrawer: { mz: true, mv: true, browser: "Read-only" },
        autoSlicer: { mz: true, mv: true, browser: true },
        slicerModal: { mz: true, mv: true, browser: true },
        realEvents: { mz: true, mv: true, browser: false },
        collisionSAT: { mz: true, mv: true, browser: true },
        audioPreview: { mz: true, mv: true, browser: true },
        explorerImport: { mz: true, mv: true, browser: false }
    }
};

