//==========================================================
// SECTION 25s: DOCKING THE ITEM BAG AND DETAILS
//==========================================================
// The Item Bag and Details can sit on the left, the right or along the bottom. Drag a panel by its title
// to a side of the window (drop zones show), or use More > Look. The edge facing the map resizes it; a
// panel at the bottom changes height. Where they are is remembered per layout (on this computer).
DocsDoodads.Ui.css += `
#dd-dock-zones { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10070; pointer-events: none; }
#dd-dock-zones .dd-dock-zone { position: absolute; border: 3px dashed var(--dd-primary); border-radius: 14px; background: var(--dd-primary-soft); opacity: 0.45; display: flex; align-items: center; justify-content: center; font-family: var(--dd-font); font-weight: 900; color: var(--dd-primary); }
#dd-dock-zones .dd-dock-zone.dd-hot { opacity: 0.95; }
.dd-dock-row { display: grid; grid-template-columns: 70px 1fr 1fr 1fr; gap: 4px; align-items: center; font-size: 11px; }
.dd-dock-row .dd-btn { padding: 3px 4px; font-size: 11px; }
`;

Object.assign(DocsDoodads.Workspace, {
    dockSides: ['left', 'right', 'bottom'],
    _sideWidth: { drawer: 250, inspector: 270 },

    panelEl(which) {
        return typeof document !== 'undefined' ? document.getElementById(which === 'drawer' ? 'dd-drawer-panel' : 'dd-inspector-panel') : null;
    },

    // ---- Where they are, per layout ----
    dockDefaults() {
        return { drawer: 'left', inspector: 'right', bottomHeight: 260 };
    },

    loadDock(layoutName) {
        const U = DocsDoodads.Ui;
        const saved = (U.prefs().docks || {})[layoutName];
        const fromLayout = DocsDoodads.Layout && DocsDoodads.Layout.get ? (DocsDoodads.Layout.get(layoutName) || {}).dock : null;
        const d = Object.assign(this.dockDefaults(), fromLayout || {}, saved || {});
        this.dock = {
            drawer: this.dockSides.includes(d.drawer) ? d.drawer : 'left',
            inspector: this.dockSides.includes(d.inspector) ? d.inspector : 'right',
            bottomHeight: Math.max(120, Math.min(900, Number(d.bottomHeight) || 260))
        };
        this._dockLoaded = true;
        return this.dock;
    },

    saveDock() {
        const U = DocsDoodads.Ui;
        const docks = Object.assign({}, U.prefs().docks || {});
        docks[(DocsDoodads.Layout && DocsDoodads.Layout.current) || 'Mapping'] = Object.assign({}, this.dock);
        U.setPref('docks', docks);
    },

    setDock(which, side) {
        if (!['drawer', 'inspector'].includes(which) || !this.dockSides.includes(side)) return false;
        if (!this._dockLoaded) this.loadDock((DocsDoodads.Layout && DocsDoodads.Layout.current) || 'Mapping');
        this.dock = Object.assign({}, this.dock, { [which]: side });
        this.saveDock();
        this.layoutPanels();
        if (which === 'drawer' && this.updateVirtualGrid) this.updateVirtualGrid(true);
        if (typeof document !== 'undefined' && document.getElementById('dd-look-card')) this.showLookCard();
        return true;
    },

    // ---- Placing them ----
    applyDockPositions(top) {
        if (!this._dockLoaded) this.loadDock((DocsDoodads.Layout && DocsDoodads.Layout.current) || 'Mapping');
        const room = this.roomSize();
        const d = this.dock;
        const both = ['drawer', 'inspector'];
        const atBottom = both.filter(w => d[w] === 'bottom');
        const bh = Math.round(Math.max(120, Math.min(room.h - top - 140, d.bottomHeight)));
        const sideBottom = atBottom.length ? bh + 16 : 8;
        for (const which of both) {
            const el = this.panelEl(which);
            if (!el || !el.style) continue;
            const side = d[which];
            const st = el.style;
            const folded = this.isFolded && this.isFolded(which);
            if (side !== 'bottom') {
                const w = parseInt(st.width, 10);
                if (w > 0 && el._ddDockSide !== 'bottom') this._sideWidth[which] = w;
            }
            el._ddDockSide = side;
            if (side === 'bottom') {
                st.top = '';
                st.bottom = '8px';
                st.height = (folded ? 44 : bh) + 'px';
                if (atBottom.length === 2) {
                    const half = Math.floor((room.w - 24) / 2);
                    st.width = half + 'px';
                    st.left = which === 'drawer' ? '8px' : '';
                    st.right = which === 'drawer' ? '' : '8px';
                } else {
                    st.left = '8px';
                    st.right = '8px';
                    st.width = 'auto';
                }
            } else {
                st.width = (this._sideWidth[which] || (which === 'drawer' ? 250 : 270)) + 'px';
                st.left = side === 'left' ? '8px' : '';
                st.right = side === 'right' ? '8px' : '';
                st.height = '';
                // Two panels on one side share it, one above the other.
                const other = which === 'drawer' ? 'inspector' : 'drawer';
                if (d[other] === side) {
                    const avail = room.h - top - sideBottom;
                    const firstHalf = Math.floor(avail / 2) - 4;
                    if (which === 'drawer') { st.top = top + 'px'; st.bottom = ''; st.height = firstHalf + 'px'; }
                    else { st.top = (top + firstHalf + 8) + 'px'; st.bottom = sideBottom + 'px'; }
                } else {
                    st.top = top + 'px';
                    st.bottom = sideBottom + 'px';
                }
            }
            this.placeDockResizer(which, side);
        }
    },

    // The edge facing the map: drag it to resize.
    placeDockResizer(which, side) {
        const el = typeof document !== 'undefined' ? document.getElementById(which === 'drawer' ? 'dd-drawer-resizer' : 'dd-inspector-resizer') : null;
        if (!el || !el.style) return;
        const st = el.style;
        if (side === 'bottom') {
            Object.assign(st, { top: '0', left: '0', right: '', width: '100%', height: '6px', cursor: 'ns-resize' });
        } else {
            Object.assign(st, { top: '0', width: '6px', height: '100%', cursor: 'ew-resize', left: side === 'right' ? '0' : '', right: side === 'left' ? '0' : '' });
        }
        el.onmousedown = e => this.beginDockResize(which, e);
    },

    beginDockResize(which, e) {
        if (e && e.preventDefault) e.preventDefault();
        const panel = this.panelEl(which);
        if (!panel) return false;
        const side = this.dock[which];
        const scale = this.uiScaleNow();
        const start = { x: e.clientX, y: e.clientY, w: parseInt(panel.style.width, 10) || this._sideWidth[which], h: this.dock.bottomHeight };
        const move = ev => this.dockResizeTo(which, side, start, ev, scale);
        const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            this.saveDock();
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return true;
    },

    dockResizeTo(which, side, start, ev, scale = 1) {
        const panel = this.panelEl(which);
        if (!panel) return;
        if (side === 'bottom') {
            this.dock.bottomHeight = Math.round(Math.max(120, Math.min(900, start.h - (ev.clientY - start.y) / scale)));
        } else {
            const dx = (ev.clientX - start.x) / scale;
            const max = which === 'drawer' ? 800 : 600;
            const w = Math.round(Math.max(200, Math.min(max, start.w + (side === 'left' ? dx : -dx))));
            panel.style.width = w + 'px';
            this._sideWidth[which] = w;
        }
        this.layoutPanels();
        if (which === 'drawer' && this.updateVirtualGrid) this.updateVirtualGrid(true);
    },

    // ---- Dragging a panel by its title to dock it ----
    dockZoneAt(x, y) {
        const room = this.roomSize();
        const s = this.uiScaleNow();
        const ux = x / s, uy = y / s;
        if (uy > room.h * 0.72) return 'bottom';
        if (ux < room.w * 0.22) return 'left';
        if (ux > room.w * 0.78) return 'right';
        return null;
    },

    beginDockDrag(which, e) {
        const target = e && e.target;
        if (target && target.closest && target.closest('button, input, select, textarea, a')) return false;
        const start = { x: e.clientX, y: e.clientY };
        let shown = false, zone = null;
        const move = ev => {
            if (!shown && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 12) return;
            if (!shown) { this.showDockZones(); shown = true; }
            zone = this.dockZoneAt(ev.clientX, ev.clientY);
            this.highlightDockZone(zone);
        };
        const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            this.hideDockZones();
            if (shown && zone) {
                this.setDock(which, zone);
                this.showToast(`${which === 'drawer' ? 'Item Bag' : 'Details'}: ${zone === 'bottom' ? 'along the bottom' : 'on the ' + zone}.`, 'info');
            }
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return true;
    },

    showDockZones() {
        if (typeof document === 'undefined') return;
        this.hideDockZones();
        const box = document.createElement('div');
        box.id = 'dd-dock-zones';
        const s = this.uiScaleNow(), room = this.roomSize();
        const W = room.w * s, H = room.h * s;
        const zone = (name, css, label) => `<div class="dd-dock-zone" data-zone="${name}" style="${css}">${label}</div>`;
        box.innerHTML = zone('left', `left: 8px; top: 90px; width: ${Math.round(W * 0.2)}px; bottom: ${Math.round(H * 0.3)}px;`, 'Left') +
            zone('right', `right: 8px; top: 90px; width: ${Math.round(W * 0.2)}px; bottom: ${Math.round(H * 0.3)}px;`, 'Right') +
            zone('bottom', `left: 8px; right: 8px; bottom: 8px; height: ${Math.round(H * 0.26)}px;`, 'Bottom');
        document.body.appendChild(box);
    },

    highlightDockZone(name) {
        const box = typeof document !== 'undefined' ? document.getElementById('dd-dock-zones') : null;
        if (!box || !box.querySelectorAll) return;
        for (const z of box.querySelectorAll('.dd-dock-zone')) if (z.classList) z.classList.toggle('dd-hot', z.getAttribute('data-zone') === name);
    },

    hideDockZones() {
        const box = typeof document !== 'undefined' ? document.getElementById('dd-dock-zones') : null;
        if (box && box.parentNode) box.parentNode.removeChild(box);
    },

    bindDockDrag() {
        for (const [which, head] of [['drawer', 'dd-drawer-head'], ['inspector', 'dd-inspector-head']]) {
            const el = typeof document !== 'undefined' ? document.getElementById(head) : null;
            if (!el) continue;
            el.style.cursor = 'grab';
            el.onmousedown = e => { if (e.button === 0) this.beginDockDrag(which, e); };
        }
    },

    dockRowsHtml() {
        const row = (which, label) => `<div class="dd-dock-row"><span>${label}</span>${this.dockSides.map(side =>
            `<button class="dd-btn${this.dock[which] === side ? ' dd-btn-primary' : ''}" type="button" id="dd-dock-${which}-${side}" aria-pressed="${this.dock[which] === side}">${side === 'bottom' ? 'Bottom' : side === 'left' ? 'Left' : 'Right'}</button>`).join('')}</div>`;
        return `<div class="dd-label" style="margin: 2px 0 0;">Panels</div>${row('drawer', 'Item Bag')}${row('inspector', 'Details')}
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Or drag a panel by its title to a side. Kept for each layout.</div>`;
    }
});

// layoutPanels places the panels where they are docked; Look shows the dock buttons; layouts carry the dock.
(function() {
    const W = DocsDoodads.Workspace;
    const baseLayout = W.layoutPanels;
    W.layoutPanels = function() {
        baseLayout.call(this);
        const toolbar = typeof document !== 'undefined' ? document.getElementById('dd-toolbar') : null;
        if (!toolbar) return;
        const top = (toolbar.offsetTop || 8) + (toolbar.offsetHeight || 64) + 8;
        this.applyDockPositions(top);
        // The panel heads are new each time the editor opens: bind their drag again then.
        const head = typeof document !== 'undefined' ? document.getElementById('dd-drawer-head') : null;
        if (head !== this._dockHead) { this.bindDockDrag(); this._dockHead = head; }
        this.placeHint();
    };
    const baseLook = W.showLookCard;
    W.showLookCard = function() {
        const card = baseLook.call(this);
        if (card && typeof card.innerHTML === 'string' && !card.innerHTML.includes('dd-dock-row')) {
            card.innerHTML += this.dockRowsHtml();
            for (const which of ['drawer', 'inspector']) {
                for (const side of this.dockSides) {
                    const b = document.getElementById(`dd-dock-${which}-${side}`);
                    if (b) b.onclick = () => this.setDock(which, side);
                }
            }
            const close = document.getElementById('dd-look-close');
            if (close) close.onclick = () => this.closeLookCard();
            for (const [id, key] of [['dd-look-scale', 'uiScale'], ['dd-look-theme', 'theme'], ['dd-look-colors', 'mapColors']]) {
                const el = document.getElementById(id);
                if (el) el.onchange = e => this.setLook(key, e.target.value);
            }
        }
        return card;
    };
    const L = DocsDoodads.Layout;
    if (L) {
        const baseApply = L.apply;
        L.apply = function(name) {
            const out = baseApply.call(this, name);
            if (W.mounted) { W.loadDock(name); W.layoutPanels(); }
            return out;
        };
        const baseSave = L.saveCurrentAs;
        L.saveCurrentAs = function(name) {
            const ok = baseSave.call(this, name);
            if (ok && this.custom[String(name).trim()]) {
                this.custom[String(name).trim()].dock = Object.assign({}, W.dock);
                DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
                W.saveDock();
            }
            return ok;
        };
    }
})();
