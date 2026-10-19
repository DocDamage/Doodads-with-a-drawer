//==========================================================
// SECTION 25t: ACCESSIBILITY (SCREEN READERS, KEYBOARD, FOCUS, LESS MOTION)
//==========================================================
// Screen readers get names for the panels and for every control (icon buttons take their tooltip, fields
// their placeholder), messages are read out as they come, and the Item Bag is a list the arrow keys move
// through (Enter picks). F6 goes from panel to panel. A visible ring shows where the keyboard is. Less
// motion (More > Look, or the system's reduced-motion setting) stops the editor's animations.
DocsDoodads.Ui.css += `
#dd-asset-workspace-root :focus-visible, .dd-glass :focus-visible, .dd-card:focus-visible { outline: 3px solid var(--dd-primary) !important; outline-offset: 2px; border-radius: 8px; }
:root:not(.dd-mouse-focus) #dd-asset-workspace-root :focus, :root:not(.dd-mouse-focus) .dd-glass :focus, :root:not(.dd-mouse-focus) .dd-card:focus { outline: 3px solid var(--dd-primary) !important; outline-offset: 2px; border-radius: 8px; }
#dd-context-menu .dd-btn:focus { background: var(--dd-primary-soft); }
#dd-context-menu .dd-btn.dd-danger:focus { background: var(--dd-danger-soft); }
.dd-card:focus { box-shadow: 0 0 0 3px var(--dd-primary-soft); }
@media (prefers-reduced-motion: reduce) {
    #dd-asset-workspace-root *, .dd-glass, .dd-glass *, .dd-toast, #dd-hint { animation: none !important; transition: none !important; }
}
:root.dd-less-motion #dd-asset-workspace-root *, :root.dd-less-motion .dd-glass, :root.dd-less-motion .dd-glass *, :root.dd-less-motion .dd-toast, :root.dd-less-motion #dd-hint { animation: none !important; transition: none !important; }
`;

Object.assign(DocsDoodads.Ui, {
    // Less motion: chosen in Look, or asked for by the system.
    lessMotion() {
        if (this.prefs().lessMotion === true) return true;
        try { return Boolean(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
    },

    applyMotion() {
        const root = typeof document !== 'undefined' ? document.documentElement : null;
        if (root && root.classList) root.classList.toggle('dd-less-motion', this.prefs().lessMotion === true);
    },

    // The words a screen reader says for a control that has none of its own.
    accessibleName(el) {
        if (!el || !el.getAttribute) return '';
        const own = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        if (own) return own;
        const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (text && !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return text;
        const title = el.getAttribute('title') || el.getAttribute('data-dd-tip') || el.getAttribute('placeholder') || '';
        return this.splitTip ? this.splitTip(title)[0] : title;
    },

    // Names, roles and live regions for everything under root (and root itself with opts.self, for a
    // node just added). Safe to run again.
    labelTree(root, opts = {}) {
        if (!root || typeof root.querySelectorAll !== 'function') return 0;
        let named = 0;
        const roles = { 'dd-toolbar': ['toolbar', 'Tools'], 'dd-drawer-panel': ['region', 'Item Bag'], 'dd-inspector-panel': ['region', 'Details'],
            'dd-more-menu': ['menu', 'More'], 'dd-statusbar': ['status', 'Status'] };
        for (const id of Object.keys(roles)) {
            const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
            if (el && el.setAttribute && !el.getAttribute('role')) { el.setAttribute('role', roles[id][0]); el.setAttribute('aria-label', roles[id][1]); }
        }
        const hint = typeof document !== 'undefined' ? document.getElementById('dd-hint') : null;
        if (hint && hint.setAttribute && !hint.getAttribute('aria-live')) { hint.setAttribute('role', 'status'); hint.setAttribute('aria-live', 'polite'); }
        const controls = Array.from(root.querySelectorAll('button, input, select, textarea, [role="button"]'));
        const isControl = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(root.tagName || '') || (root.getAttribute && root.getAttribute('role') === 'button');
        if (opts.self && isControl) controls.unshift(root);
        // A label for a field can be outside a subtree that was just added.
        const scope = opts.self && typeof document !== 'undefined' && typeof document.querySelector === 'function' ? document : root;
        for (const el of controls) {
            if (!el.getAttribute || el.getAttribute('aria-label')) continue;
            const hasText = String(el.textContent || '').trim() && !/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
            // A field inside its own label is already named.
            const labelled = el.id && scope.querySelector && scope.querySelector(`label[for="${el.id}"]`);
            const wrapped = el.closest && el.closest('label');
            if (hasText || labelled || wrapped) continue;
            const name = this.accessibleName(el);
            if (name) { el.setAttribute('aria-label', name); named++; }
        }
        return named;
    }
});

Object.assign(DocsDoodads.Workspace, {
    // The places F6 goes between, in order: the top bar, the Item Bag's search, the map, Details.
    focusPlaces() {
        const byId = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
        return [byId('dd-select-btn'), byId('dd-search-input'), DocsDoodads.Compat.getCanvas(), byId('dd-inspector-panel')].filter(Boolean);
    },

    focusNextPanel(back) {
        if (typeof document === 'undefined') return false;
        const places = this.focusPlaces();
        if (!places.length) return false;
        const active = document.activeElement;
        let i = places.findIndex(p => p === active || (p.contains && active && p.contains(active)));
        i = i < 0 ? 0 : (i + (back ? places.length - 1 : 1)) % places.length;
        const target = places[i];
        if (target.getAttribute && target.getAttribute('tabindex') === null && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
        if (target.focus) target.focus();
        return true;
    },

    // Arrow keys in the Item Bag: next or previous card, a row up or down; Enter or Space picks it.
    cardKey(card, e) {
        const grid = card.parentNode;
        if (!grid) return false;
        const cards = Array.from(grid.children || grid.childNodes || []).filter(c => c.classList && c.classList.contains('dd-card'));
        const i = cards.indexOf(card);
        if (i < 0) return false;
        if (e.key === 'Enter' || e.key === ' ') { if (card.onclick) card.onclick(e); if (e.preventDefault) e.preventDefault(); return true; }
        const top = c => (c.getBoundingClientRect ? c.getBoundingClientRect().top : 0);
        const perRow = Math.max(1, cards.filter(c => Math.abs(top(c) - top(cards[0])) < 2).length);
        const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow, Home: -i, End: cards.length - 1 - i }[e.key];
        if (step === undefined) return false;
        const next = cards[Math.max(0, Math.min(cards.length - 1, i + step))];
        if (next && next.focus) next.focus();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return true;
    },

    // The bag's kinds are tabs: the arrow keys (and Home, End) go to the next one and show it.
    categoryTabKey(e) {
        const tabs = typeof document !== 'undefined' ? document.getElementById('dd-category-tabs') : null;
        if (!tabs || !tabs.querySelectorAll) return false;
        const list = Array.from(tabs.querySelectorAll('button')).filter(b => b.dataset && b.dataset.cat);
        if (!list.length) return false;
        const i = list.indexOf(e.target && e.target.closest ? e.target.closest('button') : e.target);
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        let next = null;
        if (step) next = list[((i < 0 ? 0 : i) + step + list.length) % list.length];
        else if (e.key === 'Home') next = list[0];
        else if (e.key === 'End') next = list[list.length - 1];
        else return false;
        this._categoryChosen = true;
        this.setCategory(next.dataset.cat);
        if (next.focus) next.focus();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return true;
    },

    // Names (and, in another language, words) for everything shown; a watcher does the same for what
    // appears later (cards as the bag scrolls, Details, the cards and questions opened on the page),
    // labelling only what was added, not the whole editor again.
    labelWorkspace() {
        const root = this.container || (typeof document !== 'undefined' ? document.body : null);
        DocsDoodads.Ui.labelTree(root);
        const I = DocsDoodads.I18n;
        if (typeof document !== 'undefined' && document.body) I.translateTree(document.body);
        const watch = typeof document !== 'undefined' ? document.body : null;
        if (watch && typeof MutationObserver !== 'undefined' && !this._accessWatch) {
            let pending = null, added = [];
            this._accessWatch = new MutationObserver(list => {
                for (const m of list) for (const node of Array.from(m.addedNodes || [])) if (node.nodeType === 1) added.push(node);
                if (pending || !added.length) return;
                pending = setTimeout(() => {
                    pending = null;
                    const nodes = this.outermostNodes(added);
                    added = [];
                    for (const node of nodes) {
                        I.translateTree(node);
                        DocsDoodads.Ui.labelTree(node, { self: true });
                    }
                }, 60);
            });
            this._accessWatch.observe(watch, { childList: true, subtree: true });
        }
    },

    // The added nodes still on the page, without those inside another one of them.
    outermostNodes(nodes) {
        const live = Array.from(new Set(nodes)).filter(n => n && n.isConnected !== false);
        return live.filter(n => !live.some(o => o !== n && typeof o.contains === 'function' && o.contains(n)));
    },

    stopLabelWatch() {
        if (this._accessWatch) { this._accessWatch.disconnect(); this._accessWatch = null; }
    }
});

(function() {
    const W = DocsDoodads.Workspace;
    // Item Bag cards: in the tab order, named, picked with Enter.
    const baseCard = W.createCardElement;
    W.createCardElement = function(asset, cardHeight) {
        const card = baseCard.call(this, asset, cardHeight);
        if (card && card.setAttribute) {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'option');
            card.setAttribute('aria-label', String(asset.fileName || asset.path || 'Item') + (asset.type === 'prefab' ? ' (prefab)' : ''));
            card.setAttribute('aria-selected', String(this.selectedAsset === asset));
            if (card.addEventListener) card.addEventListener('keydown', e => this.cardKey(card, e));
        }
        return card;
    };
    // Messages are read out.
    const baseToast = W.showToast;
    W.showToast = function(msg, kind, opts) {
        const out = baseToast.call(this, msg, kind, opts);
        const toast = typeof document !== 'undefined' ? document.getElementById('dd-toast') : null;
        if (toast && toast.setAttribute) { toast.setAttribute('role', kind === 'error' ? 'alert' : 'status'); toast.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite'); }
        return out;
    };
    // Look: a Less motion switch.
    const baseLook = W.showLookCard;
    W.showLookCard = function() {
        const card = baseLook.call(this);
        if (card && typeof card.innerHTML === 'string' && !card.innerHTML.includes('dd-look-motion')) {
            const U = DocsDoodads.Ui;
            const label = document.createElement('label');
            label.style.cssText = 'flex-direction: row; align-items: center; gap: 6px;';
            label.innerHTML = `<input type="checkbox" id="dd-look-motion" ${U.prefs().lessMotion === true ? 'checked' : ''} /> Less motion (no animations)`;
            if (card.appendChild) card.appendChild(label);
            const box = document.getElementById('dd-look-motion') || (label.querySelector ? label.querySelector('input') : null);
            if (box) box.onchange = e => { U.setPref('lessMotion', Boolean(e.target.checked)); U.applyMotion(); };
        }
        return card;
    };
    // Animated thumbnails wait while motion is turned down.
    const baseThumb = W.attachThumbAnimation;
    W.attachThumbAnimation = function(card, imgEl, asset) {
        if (DocsDoodads.Ui.lessMotion()) return;
        return baseThumb.call(this, card, imgEl, asset);
    };
    // After the panels are placed, everything is named; the watcher stops with the editor.
    const baseLayout = W.layoutPanels;
    W.layoutPanels = function() {
        baseLayout.call(this);
        DocsDoodads.Ui.applyMotion();
        this.labelWorkspace();
    };
})();
