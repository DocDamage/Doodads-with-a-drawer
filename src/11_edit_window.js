// @editor-only
//==========================================================
// SECTION 5G6: A BIGGER WINDOW WHILE EDITING
//==========================================================
// The Playtest window fills the screen while the editor is open and goes back to its own place and size on
// Done. The rules take the window and the sizes as arguments, so a test can pass a stand-in; nwWindow() and
// env() are the only places that read NW.js, the page and MZ.
// A window: { x, y, width, height, maximize(), restore(), moveTo(x, y), resizeTo(w, h) } (NW.js's nw.Window).
// env: { enabled, inner: { w, h } (the page's size), game: { w, h } (the size MZ made the page),
//        screen: { left, top, w, h } (the screen's free area, without the taskbar) }.
DocsDoodads.EditWindow = {
    // How far (in pixels) a size may be off and still count as the same: frames and rounding.
    slack: 16,
    // The window's place and size before it grew, or null when it did not grow.
    saved: null,

    // The window already covers the screen's free area (the user maximized it, or dragged it that big).
    fillsScreen(box, screen) {
        if (!box || !screen || !(screen.w > 0) || !(screen.h > 0)) return false;
        return box.width >= screen.w - this.slack && box.height >= screen.h - this.slack;
    },

    // The page is not the size MZ made it at the start: the user resized the window.
    userSized(inner, game) {
        if (!inner || !game || !(game.w > 0) || !(game.h > 0)) return false;
        return Math.abs(inner.w - game.w) > this.slack || Math.abs(inner.h - game.h) > this.slack;
    },

    // Why the window is left as it is, or '' when it may grow.
    whyNot(win, env) {
        if (!win) return 'no window';
        if (!env || env.enabled === false) return 'turned off';
        if (this.saved) return 'already grown';
        const box = this.box(win);
        if (this.fillsScreen(box, env.screen)) return 'already fills the screen';
        if (this.userSized(env.inner, env.game)) return 'resized by the user';
        return '';
    },

    box(win) {
        return { x: Number(win.x) || 0, y: Number(win.y) || 0, width: Number(win.width) || 0, height: Number(win.height) || 0 };
    },

    // Keeps the window's place and size, then maximizes it. Returns whether it grew.
    grow(win, env) {
        if (this.whyNot(win, env)) return false;
        const box = this.box(win);
        if (!(box.width > 0) || !(box.height > 0) || typeof win.maximize !== 'function') return false;
        this.saved = box;
        try { win.maximize(); } catch (e) { this.saved = null; return false; }
        return true;
    },

    // Puts back the place and size kept by grow. Left alone when the user has since made the window
    // smaller themselves (it no longer fills the screen). Returns whether it was put back.
    restore(win, env) {
        const was = this.saved;
        this.saved = null;
        if (!win || !was) return false;
        const screen = env && env.screen;
        if (screen && !this.fillsScreen(this.box(win), screen)) return false;
        try {
            if (typeof win.restore === 'function') win.restore();
            if (typeof win.resizeTo === 'function') win.resizeTo(was.width, was.height);
            if (typeof win.moveTo === 'function') win.moveTo(was.x, was.y);
        } catch (e) { return false; }
        return true;
    },

    // ---- Thin hooks into NW.js, the page and MZ ----
    // The Playtest window, only while editing in a playtest. 7.2.5 (panels in their own window) can reach
    // NW.js through here too.
    nwWindow() {
        if (typeof nw === 'undefined' || !nw || !nw.Window || typeof nw.Window.get !== 'function') return null;
        if (!editorMode || !DocsDoodads.Compat.isTest()) return null;
        try { return nw.Window.get(); } catch (e) { return null; }
    },

    // The setting, "Bigger window while editing": on unless turned off (More > Look).
    enabled() {
        return !(DocsDoodads.Ui && DocsDoodads.Ui.prefs().bigWindow === false);
    },

    env() {
        const g = typeof window !== 'undefined' ? window : {};
        const s = g.screen || {};
        const advanced = g.$dataSystem && g.$dataSystem.advanced;
        const scale = advanced && Number(advanced.screenScale) > 0 ? Number(advanced.screenScale) : 1;
        const G = typeof Graphics !== 'undefined' ? Graphics : {};
        return {
            enabled: this.enabled(),
            inner: { w: Number(g.innerWidth) || 0, h: Number(g.innerHeight) || 0 },
            game: { w: (Number(G.width) || 0) * scale, h: (Number(G.height) || 0) * scale },
            screen: { left: Number(s.availLeft) || 0, top: Number(s.availTop) || 0, w: Number(s.availWidth) || 0, h: Number(s.availHeight) || 0 }
        };
    },

    // The editor opened.
    onOpen() {
        return this.grow(this.nwWindow(), this.env());
    },

    // The editor closed, or the window is closing or reloading.
    onClose() {
        if (!this.saved) return false;
        return this.restore(this.nwWindow(), this.env());
    },

    // The setting changed: grows or puts back the window at once while the editor is open.
    setEnabled(on, editing) {
        if (DocsDoodads.Ui) DocsDoodads.Ui.setPref('bigWindow', Boolean(on));
        if (!editing) return false;
        return on ? this.onOpen() : this.onClose();
    }
};
