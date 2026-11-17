// @editor-only
//==========================================================
// SECTION 25n: ONE SEARCHABLE SETTINGS PAGE
//==========================================================
// More > Settings indexes map/world controls, extension map sections, editor preferences, keys and every
// plugin parameter. Indexing is inert: only choosing a result opens and focuses its live control.
DocsDoodads.Ui.css += `
#dd-settings-card { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); z-index: 10046; width: 560px; max-width: calc(100vw - 28px); max-height: calc(100vh - 90px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
#dd-settings-search { width: 100%; box-sizing: border-box; }
#dd-settings-list { overflow-y: auto; padding-right: 3px; }
.dd-settings-group { color: var(--dd-muted); font-size: 11px; font-weight: 900; margin: 9px 0 3px; }
.dd-setting-row { width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 8px; text-align: left; padding: 6px 8px; margin: 1px 0; }
.dd-setting-row > span:first-child { flex: 1; min-width: 0; }
.dd-setting-place { color: var(--dd-faint); font-size: 10px; }
.dd-setting-param { border: 1px solid var(--dd-line-soft); border-radius: 5px; padding: 6px 8px; margin: 2px 0; font-size: 11px; }
.dd-setting-param code { color: var(--dd-primary); overflow-wrap: anywhere; }
.dd-setting-flash { outline: 3px solid var(--dd-primary) !important; outline-offset: 2px; }
`;

Object.assign(DocsDoodads.Workspace, {
    settingsIndex: [],

    pluginParameterSettings() {
        const specs = [
            ['editKey', 'Editor Toggle Key', 'F10', 'Key to open/close the editor in test play. Any key, or a chord such as Ctrl+F10 or Ctrl+Shift+E.'],
            ['photoModeKey', 'Photo Mode Key', 'P', 'Opens Photo Mode on the map. Blank disables the key; the plugin command and script API still work.'],
            ['photoModeForbidSwitch', 'Forbid Photo Mode Switch', '0', 'While this switch is ON Photo Mode cannot open (for cutscenes or story scenes).'],
            ['editorMode', 'Editor Enabled', 'true', 'Enables the Asset Workspace and in-game editing tools during test play.'],
            ['dataFileName', 'Doodads Data File Name', 'DocsDoodads', 'Name of the doodads json file in data/ (without .json).'],
            ['doodadScaleMode', 'Doodad Scaling Mode', 'true', 'Texture scaling mode for doodad rendering.'],
            ['saveMode', 'Doodad JSON Formatting', 'false', 'Format style when saving DocsDoodads.json.'],
            ['splitByMap', 'Doodad Files', 'false', 'One file per map (data/DocsDoodads/) keeps diffs and merges small when the project is in Git.'],
            ['defaultLayout', 'Default Workspace Layout', 'Mapping', 'Initial panel arrangement when launching the Asset Workspace.'],
            ['defaultThumbnailSize', 'Default Thumbnail Size', '96', 'Default asset thumbnail card size in pixels.'],
            ['cacheEnabled', 'Asset Cache Enabled', 'true', 'Cache asset metadata and thumbnails for instantaneous loading.'],
            ['backgroundWorkBudget', 'Background Work Budget (ms)', '4', 'Maximum milliseconds per frame dedicated to background indexing and thumbnails.'],
            ['autosaveRecoveryInterval', 'Autosave Interval (sec)', '60', 'Interval for writing autosave recovery snapshots (0 to disable).'],
            ['backupRetentionCount', 'Backup Retention Count', '10', 'Number of timestamped project backups retained in data/docs_doodads_cache/backups/.'],
            ['gridSnapShow', 'Show Grid Snap', 'false', 'Show visual grid overlay in editor by default.'],
            ['gridSnapWidth', 'Grid Snap Width', '0', "Width of the placement snapping grid in pixels (0 = the map's tile width)."],
            ['gridSnapHeight', 'Grid Snap Height', '0', "Height of the placement snapping grid in pixels (0 = the map's tile height)."],
            ['saveFilePictures', 'Pictures on save files', 'false', "Add small map pictures, area names and game time to MZ's save list. About 8 KB maximum per picture."],
            ['comfortOptions', 'Comfort options', 'auto', "Show Reduce Flashes and Less Camera Motion in the player's Options."],
            ['startPlayersOnAuto', 'Start players on Auto', 'false', 'Start new player preferences with Auto Effects Quality; existing saved choices stay in control.'],
            ['softenMZEffects', 'Also soften MZ flashes and shakes', 'false', "Apply the player's comfort choices to MZ's Flash Screen and Shake Screen commands too."],
            ['devDiagnostics', 'Developer Diagnostics', 'false', 'Enable diagnostics logging in Developer Tools console.']
        ];
        return specs.map(spec => {
            const current = parameters[spec[0]] === undefined || parameters[spec[0]] === '' ? spec[2] : parameters[spec[0]];
            return { id: `plugin:${spec[0]}`, param: spec[0], label: spec[1], description: spec[3], words: `${spec[0]} ${spec[3]} plugin parameter configured default`,
                where: 'Plugin Parameters', kind: 'plugin-parameter', current: String(current), defaultValue: spec[2], readOnly: true,
                guidance: "Change in MZ's Plugin Manager" };
        });
    },

    settingsControlOmit() {
        // Search, previews and authoring pickers perform an action or edit a particular authored object;
        // they are not saved map/world/editor settings.
        return /^(?:dd-map-search|dd-map-goto|dd-clock-(?:slider|season)|dd-time-preview(?:-on)?|dd-season-preview|dd-ve-|dd-anim-|dd-biome-)/;
    },

    mapSettingDescriptors() {
        const rows = [
            ['dd-map-dark', 'Ambient darkness', 'dark dim night'], ['dd-map-color', 'Ambient colour', 'lighting color'],
            ['dd-map-switch', 'Lighting switch', 'ambient switch'], ['dd-map-preview', 'Preview lighting while editing', 'lighting'],
            ['dd-map-daynight', 'Day and night on this map', 'time sun'], ['dd-map-reflections', 'Water reflections on this map', 'water'],
            ['dd-map-charshadows', 'Character shadows on this map', 'people actors shadow']
        ].map(row => ({ id: `control:${row[0]}`, controlId: row[0], label: row[1], words: row[2], where: 'Map / Lighting', kind: 'map' }));
        const structured = [
            ['perspectiveFields', 'dd-p3d-', 'Map / 3D View'], ['terrainFields', 'dd-ter-', 'Map / Terrain Height']
        ];
        for (const group of structured) {
            if (typeof this[group[0]] !== 'function') continue;
            for (const field of this[group[0]]()) rows.push({ id: `control:${group[1]}${field.key}`, controlId: group[1] + field.key,
                label: field.label, words: field.key, where: group[2], kind: 'map' });
        }
        if (typeof this.worldSections === 'function') {
            this.worldSections().forEach((section, si) => section.fields.forEach((field, fi) => rows.push({
                id: `world:${field.key}`, controlId: `dd-world-${si}-${fi}`, label: field.label, words: `${field.key} ${section.title}`,
                where: `World / ${section.title}`, kind: 'map'
            })));
        }
        // The exact HTML used by the live panel is rendered to a string only. Nothing is attached and no
        // bind callback runs; this catches built-ins and mapSections extensions without a second panel.
        const mapSettings = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
        const ambient = Object.assign({}, DocsDoodads.Lighting.ambientDefaults, mapSettings.ambient || {});
        const inert = this.renderMapPanelHtml(this.currentMapId(), mapSettings, ambient);
        for (const row of DocsDoodads.SettingsSearch.controlsFromHtml(inert, 'Map / Map Settings', this.settingsControlOmit())) {
            row.kind = 'map';
            if (row.words) row.where = `Map / ${row.words}`;
            if (!rows.some(existing => existing.controlId === row.controlId)) rows.push(row);
        }
        return rows;
    },

    refreshSettingsIndex() {
        const rows = [];
        try { rows.push.apply(rows, this.mapSettingDescriptors()); } catch (err) { /* an optional panel must not break Settings */ }
        [['dd-look-scale', 'Editor size', 'scale zoom'], ['dd-look-theme', 'Theme', 'dark light'], ['dd-look-colors', 'Map colours', 'color colour blind'],
            ['dd-look-bigwin', 'Bigger window while editing', 'maximize maximise full screen window size']]
            .concat([['dd-look-simple', 'Keep It Simple', 'simple mode show everything tools']])
            .concat([['dd-look-guess', 'Guess settings for new placements', 'guess automatic lamp tree drop defaults']])
            .forEach(row => rows.push({ id: `look:${row[0]}`, controlId: row[0], label: row[1], words: row[2], where: 'Editor / Look', kind: 'look' }));
        rows.push({ id: 'autosave', controlId: 'dd-autosave-btn', label: 'Autosave', words: 'automatic save interval recovery', where: 'Editor / Saving', kind: 'autosave' });
        for (const shortcut of DocsDoodads.Shortcuts.list) rows.push({ id: `key:${shortcut.id}`, shortcutId: shortcut.id,
            label: shortcut.label, words: `${shortcut.keys} keyboard shortcut key binding`, where: `Keys / ${shortcut.group}`, kind: 'keys' });
        rows.push.apply(rows, this.pluginParameterSettings());
        for (const row of rows) row.open = () => this.openSetting(row);
        this.settingsIndex = DocsDoodads.SettingsSearch.create(rows);
        return this.settingsIndex;
    },

    focusSettingControl(controlId, selector) {
        if (typeof document === 'undefined') return false;
        const el = controlId ? document.getElementById(controlId) : (selector && document.querySelector ? document.querySelector(selector) : null);
        if (!el || el.disabled) return false;
        let parent = el.parentNode;
        while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentNode; }
        if (el.getBoundingClientRect) {
            const rect = el.getBoundingClientRect();
            if (!rect || (!(rect.width > 0) && !(rect.height > 0))) return false;
        }
        if (el.scrollIntoView) el.scrollIntoView({ block: 'center' });
        if (el.focus) el.focus();
        if (el.classList) {
            el.classList.add('dd-setting-flash');
            setTimeout(() => { if (el.classList) el.classList.remove('dd-setting-flash'); }, 1200);
        }
        return true;
    },

    openSetting(row) {
        if (!row) return false;
        if (row.kind === 'plugin-parameter') {
            this.showSettingsCard({ query: '', focusId: row.id });
            return true;
        }
        this.closeSettingsCard();
        if (row.kind === 'look') {
            this.showLookCard();
            return this.focusSettingControl(row.controlId);
        }
        if (row.kind === 'keys') {
            this.showShortcutsCard();
            const id = String(row.shortcutId || '').replace(/"/g, '');
            const shortcut = DocsDoodads.Shortcuts.find(id);
            return this.focusSettingControl(null, shortcut && shortcut.fixed ? `[data-setting-key="${id}"]` : `[data-keys="${id}"]`);
        }
        if (row.kind === 'autosave') {
            if (this.showMenu) this.showMenu(this._menusFolded ? 'more' : 'map', true);
            return this.focusSettingControl(row.controlId);
        }
        if (row.kind === 'map') {
            this._mapSearch = '';
            this.selectedDoodad = null;
            this.selectedDoodads = [];
            this.selectedAsset = null;
            this.selectedEvent = null;
            if (this.foldPanel) this.foldPanel('inspector', false);
            if (this.refreshInspector) this.refreshInspector();
            return this.focusSettingControl(row.controlId);
        }
        return false;
    },

    showSettingsCard(options) {
        if (typeof document === 'undefined') return null;
        options = options || {};
        const U = DocsDoodads.Ui, esc = DocsDoodads.Security.escapeHtml;
        const index = this.refreshSettingsIndex();
        let card = document.getElementById('dd-settings-card');
        if (!card) { card = document.createElement('div'); card.id = 'dd-settings-card'; card.className = 'dd-glass'; document.body.appendChild(card); }
        const initial = options.query === undefined ? (this._settingsQuery || '') : String(options.query);
        card.innerHTML = `<div class="dd-panel-head"><span class="dd-grow">${U.icon('gear', 1)} Settings</span>
            <button class="dd-btn dd-fold" id="dd-settings-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <input id="dd-settings-search" type="search" value="${esc(initial)}" placeholder="Find a setting (shadow, theme, autosave...)" aria-label="Find a setting" />
            <div id="dd-settings-list"></div>`;
        const input = document.getElementById('dd-settings-search'), list = document.getElementById('dd-settings-list');
        const draw = () => {
            this._settingsQuery = input ? input.value : '';
            const found = DocsDoodads.SettingsSearch.search(index, this._settingsQuery);
            const groups = [];
            found.forEach(row => { let group = groups.find(g => g.where === row.where); if (!group) { group = { where: row.where, rows: [] }; groups.push(group); } group.rows.push(row); });
            list.innerHTML = groups.map(group => `<div class="dd-settings-group">${esc(group.where)}</div>${group.rows.map(row => row.kind === 'plugin-parameter'
                ? `<div class="dd-setting-param" id="dd-setting-${esc(row.id)}" tabindex="-1" data-setting-id="${esc(row.id)}"><strong>${esc(row.label)}</strong><br><span>${esc(row.description)}</span><br><code>${esc(row.current)}</code> <span class="dd-setting-place">(default: ${esc(row.defaultValue)}) · ${esc(row.guidance)}</span></div>`
                : `<button class="dd-btn dd-setting-row" type="button" data-setting-id="${esc(row.id)}"><span>${esc(row.label)}</span><span class="dd-setting-place">${esc(row.where)}</span></button>`).join('')}`).join('')
                || '<div style="color: var(--dd-faint); font-size: 12px; padding: 8px;">No settings match.</div>';
            for (const button of Array.from(list.querySelectorAll ? list.querySelectorAll('button[data-setting-id]') : [])) {
                button.onclick = () => { const row = index.find(item => item.id === button.getAttribute('data-setting-id')); if (row) row.open(); };
            }
        };
        draw();
        if (input) {
            input.oninput = draw;
            input.onkeydown = event => {
                if (event.key === 'Escape') { this.closeSettingsCard(); return; }
                if (event.key !== 'Enter') return;
                const first = DocsDoodads.SettingsSearch.search(index, input.value)[0];
                if (first) { if (event.preventDefault) event.preventDefault(); first.open(); }
            };
            input.focus();
        }
        const close = document.getElementById('dd-settings-close');
        if (close) close.onclick = () => this.closeSettingsCard();
        if (options.focusId) {
            const target = document.getElementById(`dd-setting-${options.focusId}`);
            if (target) this.focusSettingControl(target.id);
        }
        return card;
    },

    closeSettingsCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-settings-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    }
});
