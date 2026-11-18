// @editor-only
//==========================================================
// SECTION 25P: PANELS IN THEIR OWN WINDOW (7.2.5)
//==========================================================
// View → Item Bag in a Window / Details in a Window opens a second NW.js window, copies the theme's styles into
// it and moves the panel's element there (adoptNode), so its code keeps running in the game's window and its
// handlers keep working. Lookups by id still find it: document.getElementById also looks in the open panel
// windows. Keys pressed there reach the shortcut table (not while typing in a field), and the game does not
// pause while that window has focus. Closing the window, Dock Back, closing the editor or ending the playtest
// put the panel back where it was; each window's place is kept per computer and layout.
// Drags from the second window onto the map can't cross windows: pick an item there, then click the map.
(function() {
    const D = DocsDoodads, W = D.Workspace;
    const ids = { drawer: 'dd-drawer-panel', inspector: 'dd-inspector-panel' };
    const titles = { drawer: 'Item Bag', inspector: 'Details' };
    const open = W._popouts = {};

    // ---- Lookups ----
    if (typeof document !== 'undefined' && typeof document.getElementById === 'function' && !document._docsPopoutLookup) {
        const own = document.getElementById.bind(document);
        document.getElementById = function(id) {
            const found = own(id);
            if (found) return found;
            for (const p of Object.values(open)) {
                const doc = p && p.doc;
                const el = doc && doc.getElementById ? doc.getElementById(id) : null;
                if (el) return el;
            }
            return null;
        };
        document._docsPopoutLookup = true;
    }

    // ---- The game keeps running while a panel window has focus ----
    if (typeof SceneManager !== 'undefined' && typeof SceneManager.isGameActive === 'function') {
        const active = SceneManager.isGameActive;
        SceneManager.isGameActive = function() {
            if (Object.values(open).some(p => p && p.doc && typeof p.doc.hasFocus === 'function' && p.doc.hasFocus())) return true;
            return active.apply(this, arguments);
        };
    }

    Object.assign(W, {
        popoutKey(which) { return 'popout_' + which + '_' + (this.currentLayoutName ? this.currentLayoutName() : 'default'); },

        _popoutPlaces: {},
        // Where its window was last: kept per computer (and for this session when preferences can't be written).
        popoutPlace(which) {
            const key = this.popoutKey(which), prefs = D.Ui.prefs ? D.Ui.prefs() : {};
            return (prefs && prefs[key]) || this._popoutPlaces[key] || {};
        },

        canPopOut() { return typeof nw !== 'undefined' && nw.Window && typeof nw.Window.open === 'function'; },

        isPoppedOut(which) { return Boolean(open[which]); },

        // Moves a panel into a new window. Resolves true when it is there.
        popOut(which) {
            const id = ids[which];
            const panel = id && typeof document !== 'undefined' ? document.getElementById(id) : null;
            if (!panel || open[which]) return Promise.resolve(false);
            if (!this.canPopOut()) { this.showToast('Panels in their own window need the desktop playtest (NW.js). View → Bigger Window gives the map more room instead.', 'info'); return Promise.resolve(false); }
            const saved = this.popoutPlace(which);
            return new Promise(resolve => {
                nw.Window.open('about:blank', { width: saved.width || 360, height: saved.height || 600, x: saved.x, y: saved.y, title: titles[which], focus: true }, win => {
                    const attach = () => {
                        const w = win.window, doc = w && w.document;
                        if (!doc || !doc.body) { resolve(false); return; }
                        resolve(this.adoptPanel(which, panel, win, doc));
                    };
                    if (win.window && win.window.document && win.window.document.readyState === 'complete') attach();
                    else if (win.on) win.on('loaded', attach); else attach();
                });
            });
        },

        // The move itself (the window is ready): styles, the panel, keys, and putting it back on close.
        adoptPanel(which, panel, win, doc) {
            doc.title = titles[which];
            for (const style of Array.from(document.querySelectorAll ? document.querySelectorAll('style, link[rel="stylesheet"]') : [])) {
                if (doc.head && doc.importNode) doc.head.appendChild(doc.importNode(style, true));
            }
            const theme = document.documentElement && document.documentElement.getAttribute ? document.documentElement.getAttribute('data-dd-theme') : null;
            if (theme && doc.documentElement && doc.documentElement.setAttribute) doc.documentElement.setAttribute('data-dd-theme', theme);
            if (doc.body.style) doc.body.style.cssText = 'margin:0;background:var(--dd-bg, #1c1c22);color:var(--dd-text, #eee);overflow:auto;';
            const parent = panel.parentNode, next = panel.nextSibling;
            const style = panel.style ? panel.style.cssText : '';
            const moved = doc.adoptNode ? doc.adoptNode(panel) : panel;
            if (moved.style) moved.style.cssText = style + ';position:static;left:auto;top:auto;right:auto;bottom:auto;width:100%;height:100%;max-height:none;display:block;';
            doc.body.appendChild(moved);
            const forward = e => {
                if (D.isEditableTarget && D.isEditableTarget(e.target)) return;
                const copy = typeof KeyboardEvent !== 'undefined' ? new KeyboardEvent('keydown', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey, bubbles: true, cancelable: true }) : e;
                window.dispatchEvent(copy);
                if (copy.defaultPrevented && e.preventDefault) e.preventDefault();
            };
            if (doc.addEventListener) doc.addEventListener('keydown', forward);
            open[which] = { win, doc, panel: moved, parent, next, style, forward };
            if (!this._popoutUnload && typeof window !== 'undefined' && window.addEventListener) { this._popoutUnload = true; window.addEventListener('beforeunload', () => this.dockAllBack()); }
            if (win.on) win.on('close', () => { this.dockBack(which); win.close(true); });
            if (this.applyDockPositions) this.applyDockPositions();
            return true;
        },

        // Back into the editor, where it was. Keeps the window's place for next time.
        dockBack(which) {
            const p = open[which];
            if (!p) return false;
            delete open[which];
            try {
                if (p.win && p.win.x !== undefined) {
                    const place = { x: p.win.x, y: p.win.y, width: p.win.width, height: p.win.height };
                    this._popoutPlaces[this.popoutKey(which)] = place;
                    D.Ui.setPref(this.popoutKey(which), place);
                }
            } catch (e) { /* place not kept */ }
            if (p.doc && p.doc.removeEventListener) p.doc.removeEventListener('keydown', p.forward);
            const node = document.adoptNode ? document.adoptNode(p.panel) : p.panel;
            if (node.style) node.style.cssText = p.style;
            if (p.parent) { if (p.next && p.next.parentNode === p.parent) p.parent.insertBefore(node, p.next); else p.parent.appendChild(node); }
            if (this.applyDockPositions) this.applyDockPositions();
            return true;
        },

        dockAllBack() {
            for (const which of Object.keys(open)) {
                const win = open[which] && open[which].win;
                this.dockBack(which);
                try { if (win && win.close) win.close(true); } catch (e) { /* already closed */ }
            }
        }
    });

    // Closing the editor or the playtest docks everything back.
    // Closing the editor calls closeMapTools; panels come back with it.
    const closeTools = W.closeMapTools;
    if (typeof closeTools === 'function') W.closeMapTools = function() { this.dockAllBack(); return closeTools.apply(this, arguments); };

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), view = all.find(menu => menu.id === 'view');
        if (view) {
            view.items.push({ id: 'dd-popout-drawer-btn', icon: 'grid', label: () => (this.isPoppedOut('drawer') ? 'Dock the Item Bag Back' : 'Item Bag in a Window'), span: 'dd-popout-drawer-label', title: 'Move the Item Bag to a window of its own (pick an item there, then click the map)' });
            view.items.push({ id: 'dd-popout-inspector-btn', icon: 'grid', label: () => (this.isPoppedOut('inspector') ? 'Dock Details Back' : 'Details in a Window'), span: 'dd-popout-inspector-label', title: 'Move Details to a window of its own' });
        }
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        for (const which of ['drawer', 'inspector']) {
            const btn = typeof document !== 'undefined' ? document.getElementById(`dd-popout-${which}-btn`) : null;
            if (btn) btn.onclick = () => {
                if (this.showMoreMenu) this.showMoreMenu(false);
                if (this.isPoppedOut(which)) { const win = open[which].win; this.dockBack(which); try { win.close(true); } catch (e) { /* closed */ } } else this.popOut(which);
            };
        }
        return result;
    };
})();
