    //==========================================================
    // SECTION 25: WORKSPACE: THE TOP BAR'S MENUS
    //==========================================================
    // Map, Art, View and More, described as data: each entry is a button with its own id (the handlers in
    // 37_workspace_core.js bind to the ids, and tours and tests point at them), in exactly one menu. The menus'
    // HTML and the palette's "Map → Problems" entries are both made from this list, so they can't drift. In a
    // window too narrow for the bar, Map, Art and View fold into More under headings (fitToolbar).

    // [{ id, label, icon, title, items: [{ id, label, icon, title, span, key }], layouts }]. label and title may
    // be functions (read when the menu is drawn); span names the element whose words change (Show / Hide Grid).
    menus() {
        const tip = id => this.shortcutTip(id);
        return [
            { id: 'map', label: 'Map', icon: 'map', title: 'This map: its settings, finding things, rooms, templates, problems, saving it', items: [
                { id: 'dd-mapset-btn', icon: 'map', label: 'Map Settings', title: "Copy another map's settings to this one, or keep them as a preset" },
                { id: 'dd-find-btn', icon: 'search', label: 'Find Doodads', title: 'Find doodads on this map or every map, by picture, name, tag, layer, light, sound...' },
                { id: 'dd-outliner-btn', icon: 'grid', label: 'Outliner', title: "This map's doodads by layer: hide, lock, pick, solo a layer" },
                { id: 'dd-rooms-btn', icon: 'map', label: 'Rooms', title: 'Save part of the map (tiles, doodads, events) as a room stamp and place it again', key: 'rooms' },
                { id: 'dd-templates-btn', icon: 'person', label: 'Templates', title: 'Rename, sort and delete your own event templates' },
                { id: 'dd-problems-btn', icon: 'help', label: 'Problems', title: 'Missing pictures and sounds, doodads off the map, lamps that never show, places out of reach' },
                { id: 'dd-notes-btn', icon: 'info', label: 'Notes', title: 'Notes and to-dos pinned to tiles on this map or every map (seen only in the editor)' },
                { id: 'dd-ruler-btn', icon: 'path', label: 'Ruler', title: () => DocsDoodads.Shortcuts.tip('ruler', 'Measure on the map in tiles and pixels'), key: 'ruler' },
                { id: 'dd-reach-btn', icon: 'person', label: 'Check Reach', title: 'Where the player can walk from where they stand, and the doors and chests they can\'t get to' },
                { id: 'dd-savemap-btn', icon: 'save', label: 'Save This Map', title: "Save this map's doodads, settings and events; other maps' changes wait" },
                { id: 'dd-autosave-btn', icon: 'history', label: () => this.autosaveLabel(), span: 'dd-autosave-label', title: 'Save the project every few minutes of unsaved work (on this computer)' }
            ] },
            { id: 'art', label: 'Art', icon: 'picture', title: 'Pictures and characters: cut up sheets, the character creators, packs, effects, file checks', items: [
                { id: 'dd-slicer-btn', icon: 'scissors', label: 'Cut Up Sheet', title: 'Cut a picked sprite sheet into pieces' },
                { id: 'dd-lpc-btn', icon: 'person', label: 'Characters', title: "Character creators: RPG Maker MZ's generator parts, the LPC library and the Memao assets on this computer" },
                { id: 'dd-packs-btn', icon: 'box', label: 'Packs', title: 'Put prefabs, rooms, biomes and their art in one file for another project, or bring one in' },
                { id: 'dd-vfx-btn', icon: 'sparkle', label: 'Effects Maker', title: 'Make sparkles, smoke, fire and other effects' },
                { id: 'dd-tools-btn', icon: 'wrench', label: 'File Check', title: 'Find copies of the same file and files nothing uses' }
            ] },
            { id: 'view', label: 'View', icon: 'eye', title: 'What the map shows while editing, Screen Looks, the editor\'s look and panel sizes', layouts: true, items: [
                { id: 'dd-grid-btn', icon: 'grid', label: () => (this.gridSnapShow ? 'Hide Grid' : 'Show Grid'), span: 'dd-grid-label', title: () => tip('dd-grid-btn'), key: 'grid' },
                { id: 'dd-collision-btn', icon: 'lock', label: () => (this.showCollision ? 'Hide Collision' : 'Show Collision'), span: 'dd-collision-label', title: "Show every doodad's collision and the tiles you can't walk on", key: 'collision' },
                { id: 'dd-sounds-btn', icon: 'sound', label: () => (this.showSounds ? 'Hide Sounds' : 'Show Sounds'), span: 'dd-sounds-label', title: 'Show where each sound on this map can be heard', key: 'sounds' },
                { id: 'dd-listen-btn', icon: 'music', label: 'Listen', title: 'Click a tile to hear what the player would hear there' },
                { id: 'dd-perf-btn', icon: 'gear', label: () => (DocsDoodads.Ui.prefs().perfOverlay === true ? 'Hide Speed' : 'Show Speed'), span: 'dd-perf-label', title: 'Frames a second, draw calls, pictures loaded and lights', key: 'speed' },
                { id: 'dd-postfx-btn', icon: 'sun', label: 'Screen Looks', title: 'Looks and screen effects for the whole game or this map; save a picture of the map' },
                { id: 'dd-notes-show-btn', icon: 'info', label: () => (this.notesShown() ? 'Hide Notes' : 'Show Notes'), span: 'dd-notes-show-label', title: "Show or hide the notes' pins on the map" },
                { id: 'dd-bookmarks-btn', icon: 'star', label: 'Bookmarks', title: 'Places on the maps to jump back to: Bookmark This View, and Ctrl+1 to Ctrl+9' },
                { id: 'dd-look-btn', icon: 'eye', label: 'Look', title: 'Editor size, theme and map colours' }
            ] },
            { id: 'more', label: 'More', icon: 'more', title: 'Find a Tool, keys, Capture, old saves, messages, info and help', items: [
                { id: 'dd-palette-btn', icon: 'search', label: 'Find a Tool', title: () => tip('dd-palette-btn'), key: 'palette' },
                { id: 'dd-settings-btn', icon: 'gear', label: 'Settings', title: 'Find every map, world and editor setting', key: 'settings' },
                { id: 'dd-keys-btn', icon: 'gear', label: 'Keys', title: () => tip('dd-keys-btn'), key: 'shortcuts' },
                { id: 'dd-capture-btn', icon: 'picture', label: 'Capture', title: 'Save a picture of the view, or a 3D orbit GIF' },
                { id: 'dd-history-btn', icon: 'folder', label: 'Old Saves', title: 'Compare with earlier saves and bring single things back' },
                { id: 'dd-messages-btn', icon: 'history', label: 'Messages', title: "Read the editor's recent messages again" },
                { id: 'dd-diag-btn', icon: 'info', label: 'Info', title: 'Numbers, cache and backups' },
                { id: 'dd-sound-btn', icon: 'sound', label: () => (DocsDoodads.Ui.prefs().sounds === false ? 'Sounds: Off' : 'Sounds: On'), span: 'dd-sound-label', title: 'Little sounds when you use the tools' },
                { id: 'dd-help-btn', icon: 'help', label: 'How to Use', title: 'How to use the editor' }
            ] }
        ];
    },

    menuPopId(id) {
        return id === 'more' ? 'dd-more-menu' : `dd-menu-${id}`;
    },

    menuButtonId(id) {
        return id === 'more' ? 'dd-more-btn' : `dd-menu-${id}-btn`;
    },

    // The words of a menu entry now.
    menuItemText(item) {
        return typeof item.label === 'function' ? item.label() : item.label;
    },

    // The pop-ups, one per menu. Each holds its own section; More also takes the others' while they are folded.
    renderMenus() {
        const U = DocsDoodads.Ui;
        const esc = DocsDoodads.Security.escapeHtml;
        const button = item => {
            const title = typeof item.title === 'function' ? item.title() : item.title;
            const text = esc(this.menuItemText(item));
            return `<button class="dd-btn" id="${item.id}" title="${esc(title || '')}">${U.icon(item.icon, 1)} ${item.span ? `<span id="${item.span}">${text}</span>` : text}</button>`;
        };
        const layouts = `
                    <div style="margin-top: 10px; font-weight: 800; color: var(--dd-muted);">Panel sizes</div>
                    <div style="display: flex; gap: 4px; margin-top: 4px;">
                        <select id="dd-layout-select" style="flex: 1; min-width: 0;"></select>
                        <button class="dd-btn" id="dd-save-layout-btn" title="Remember the panel sizes as a new layout">${U.icon('plus', 1)}</button>
                        <button class="dd-btn" id="dd-del-layout-btn" title="Delete this layout" style="display: none;">${U.icon('trash', 1)}</button>
                    </div>`;
        return this.menus().map(m => `
            <div id="${this.menuPopId(m.id)}" class="dd-glass dd-pop dd-menu-pop" data-menu="${m.id}" style="display: none;">
                <div class="dd-pop-title">${U.icon(m.icon, 1)} ${esc(m.label)}</div>
                <div class="dd-menu-sections" id="dd-menu-sections-${m.id}">
                    <div class="dd-menu-section" id="dd-menu-sec-${m.id}" data-menu="${m.id}">
                        <div class="dd-menu-head">${esc(m.label)}</div>
                        <div class="dd-more-grid">${m.items.map(button).join('')}</div>${m.layouts ? layouts : ''}
                    </div>
                </div>
            </div>`).join('');
    },

    // The menus' buttons on the top bar (before Save and Done).
    renderMenuButtons(tool) {
        return this.menus().map(m => tool(this.menuButtonId(m.id), m.icon, m.label, m.title, 'dd-menu-btn')).join('\n');
    },

    // Opens one menu (closing the others), or closes it. Returns whether it is open.
    showMenu(id, open) {
        if (typeof document === 'undefined') return false;
        let shown = false;
        for (const m of this.menus()) {
            const pop = document.getElementById(this.menuPopId(m.id));
            if (!pop) continue;
            const on = Boolean(open) && m.id === id;
            pop.style.display = on ? 'block' : 'none';
            const btn = document.getElementById(this.menuButtonId(m.id));
            if (btn && btn.classList) btn.classList.toggle('dd-btn-active', on);
            if (btn && btn.setAttribute) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
            if (on) {
                this.refreshMenuLabels();
                this.placePopover(pop, this.menuButtonId(m.id));
                shown = true;
            }
        }
        return shown;
    },

    toggleMenu(id) {
        const pop = typeof document !== 'undefined' ? document.getElementById(this.menuPopId(id)) : null;
        return this.showMenu(id, !(pop && pop.style.display === 'block'));
    },

    // The menu that is open, or null.
    openMenu() {
        if (typeof document === 'undefined') return null;
        const m = this.menus().find(x => { const pop = document.getElementById(this.menuPopId(x.id)); return pop && pop.style.display === 'block'; });
        return m ? m.id : null;
    },

    // Show / Hide words that follow a setting.
    refreshMenuLabels() {
        if (typeof document === 'undefined') return;
        for (const m of this.menus()) {
            for (const item of m.items) {
                if (!item.span) continue;
                const el = document.getElementById(item.span);
                const text = this.menuItemText(item);
                if (el && el.textContent !== text) el.textContent = text;
            }
        }
    },

    // Narrow window: Map, Art and View go into More, each under its heading; wide again, they go back.
    foldMenus(folded) {
        if (typeof document === 'undefined') return false;
        folded = Boolean(folded);
        if (this._menusFolded === folded) return folded;
        this._menusFolded = folded;
        this.showMenu(null, false);
        const more = document.getElementById('dd-menu-sections-more');
        const moreOwn = document.getElementById('dd-menu-sec-more');
        for (const m of this.menus()) {
            if (m.id === 'more') continue;
            const sec = document.getElementById(`dd-menu-sec-${m.id}`);
            const home = document.getElementById(`dd-menu-sections-${m.id}`);
            if (!sec) continue;
            if (folded && more) {
                if (moreOwn && more.insertBefore) more.insertBefore(sec, moreOwn);
                else more.appendChild(sec);
            } else if (!folded && home) {
                home.appendChild(sec);
            }
        }
        const pop = document.getElementById('dd-more-menu');
        if (pop && pop.classList) pop.classList.toggle('dd-menus-folded', folded);
        return folded;
    },

    // The palette's entries for every menu entry ("View → Show Grid").
    menuCommands() {
        const out = [];
        for (const m of this.menus()) {
            for (const item of m.items) {
                const text = this.menuItemText(item);
                out.push({ label: `${m.label} → ${text}`, text, menu: m.id, run: () => this.runMenuItem(item.id),
                    keys: item.key ? DocsDoodads.Shortcuts.label(item.key) || undefined : undefined, id: item.id });
            }
        }
        return out;
    },

    // Does what clicking the entry does.
    runMenuItem(id) {
        const btn = typeof document !== 'undefined' ? document.getElementById(id) : null;
        if (!btn) return false;
        if (typeof btn.onclick === 'function') btn.onclick({ target: btn, preventDefault() {}, stopPropagation() {} });
        else if (typeof btn.click === 'function') btn.click();
        return true;
    },

    // Keys in an open menu: up and down move between its entries, left and right to the next menu (the ones
    // on the bar), Home and End, Esc closes it and goes back to its button.
    topMenuKey(id, e) {
        if (typeof document === 'undefined') return false;
        const pop = document.getElementById(this.menuPopId(id));
        if (!pop) return false;
        const items = Array.from(pop.querySelectorAll('.dd-more-grid button, select'));
        const active = document.activeElement;
        const i = items.indexOf(active);
        let next = null;
        if (e.key === 'ArrowDown') next = items[(i + 1) % items.length];
        else if (e.key === 'ArrowUp') next = items[i < 0 ? items.length - 1 : (i + items.length - 1) % items.length];
        else if (e.key === 'Home') next = items[0];
        else if (e.key === 'End') next = items[items.length - 1];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const bar = this.menus().map(m => m.id).filter(m => m === 'more' || !this._menusFolded);
            const j = bar.indexOf(id);
            const to = bar[(j + (e.key === 'ArrowRight' ? 1 : bar.length - 1)) % bar.length];
            this.showMenu(to, true);
            const first = document.getElementById(this.menuPopId(to));
            next = first ? first.querySelector('.dd-more-grid button') : null;
        } else if (e.key === 'Escape') {
            this.showMenu(null, false);
            next = document.getElementById(this.menuButtonId(id));
        } else return false;
        if (next && next.focus) next.focus();
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return true;
    },

    // The menus' own handlers: their bar buttons, keys inside them, and closing after an entry is used (the
    // layout controls keep the menu open).
    bindMenus() {
        if (typeof document === 'undefined') return;
        const U = DocsDoodads.Ui;
        for (const m of this.menus()) {
            const btn = document.getElementById(this.menuButtonId(m.id));
            if (btn) {
                btn.onclick = () => { U.sound('cursor'); this.toggleMenu(m.id); };
                if (btn.setAttribute) { btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false'); }
                if (btn.addEventListener) btn.addEventListener('keydown', e => {
                    if (e.key !== 'ArrowDown') return;
                    this.showMenu(m.id, true);
                    const pop = document.getElementById(this.menuPopId(m.id));
                    const first = pop ? pop.querySelector('.dd-more-grid button') : null;
                    if (first && first.focus) first.focus();
                    if (e.preventDefault) e.preventDefault();
                });
            }
            const pop = document.getElementById(this.menuPopId(m.id));
            if (!pop || !pop.addEventListener) continue;
            pop.addEventListener('keydown', e => this.topMenuKey(m.id, e));
            pop.addEventListener('click', e => {
                const b = e.target && e.target.closest ? e.target.closest('button') : null;
                if (b && /^(dd-slicer-btn|dd-postfx-btn|dd-vfx-btn|dd-history-btn|dd-tools-btn|dd-diag-btn)$/.test(b.id)) {
                    U.sound('ok');
                    this.showMenu(null, false);
                }
            });
        }
    },
