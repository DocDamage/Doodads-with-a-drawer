//==========================================================
// SECTION 25: DocsDoodads.WORKSPACE (GLASSMORPHIC WORKSPACE UI & TOOLS)
//==========================================================
DocsDoodads.Workspace = {
    mounted: false,
    // Editor-only previews of the time of day and the season (null = what the game says).
    previewMinutes: null,
    previewSeason: null,
    // Post-processing builder: which look is edited, hold-to-compare, and showing effects while editing.
    postFxTarget: 'world',
    postFxCompare: false,
    postFxPreview: true,
    container: null,
    drawerEl: null,
    inspectorEl: null,
    selectedAsset: null,
    selectedDoodad: null,
    selectedEvent: null,
    currentCategory: 'Doodads',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25, minDistance: 32, flipChance: 0.5, hueJitter: 0, regions: '', terrainTags: '', avoidBlocked: false },
    activeDragPayload: null,
    ghostEl: null,
    isBrushActive: false,
    currentBrushBatch: [],
    gridSnapShow: gridSnapShow,
    _clipboardDoodads: [],
    selectedDoodads: [],

    toggle() {
        if (this.mounted) return this.requestClose();
        this.open();
        return true;
    },

    // Done and the toggle key. With unsaved work, asks first: Save (then close), Discard (the work is
    // thrown away, then close) or Keep Editing. Resolves whether the editor closed.
    async requestClose() {
        if (!this.mounted) return true;
        if (!(await this.confirmLeave('close the editor', true))) return false;
        if (this.mounted) this.close();
        return true;
    },

    // Before work could be lost (closing the editor, the window or reloading): resolves true to go ahead.
    // revert: Discard also puts the doodads and events back as saved (the game carries on with them).
    async confirmLeave(action, revert) {
        const P = DocsDoodads.Persistence;
        if (!P.hasUnsavedWork()) return true;
        const answer = await DocsDoodads.Ui.choose(`Some changes aren't saved yet. Save them before you ${action}?`, [
            { label: 'Keep Editing', value: null },
            { label: "Don't Save", value: 'discard', kind: 'danger' },
            { label: 'Save', value: 'save', kind: 'good', main: true }
        ], { title: 'Unsaved changes', icon: 'save' });
        if (answer === 'save') return P.saveAll();
        if (answer !== 'discard') return false;
        if (revert) {
            P.discardUnsaved();
            if (this.mounted) this.refreshSpriteset();
        } else {
            P.clearRecovery();
        }
        return true;
    },

    // The Save button: a dot while there is unsaved work, and "Saved" for a moment after a save.
    updateSaveState(justSaved) {
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-save-btn') : null;
        if (!btn) return;
        const unsaved = DocsDoodads.Persistence.hasUnsavedWork();
        if (btn.classList) btn.classList.toggle('dd-unsaved', unsaved);
        // The tooltip reads it from data-dd-tip once it has taken over the title.
        const tip = DocsDoodads.Shortcuts.tip('save', unsaved ? 'Save everything: some changes are not saved yet' : 'Save everything: everything is saved');
        if (btn.getAttribute && btn.getAttribute('data-dd-tip')) btn.setAttribute('data-dd-tip', tip); else btn.title = tip;
        const label = btn.querySelector ? btn.querySelector('b') : null;
        clearTimeout(this._savedTimer);
        if (justSaved && !unsaved) {
            if (btn.classList) btn.classList.add('dd-just-saved');
            if (label) label.textContent = 'Saved';
            this._savedTimer = setTimeout(() => {
                if (btn.classList) btn.classList.remove('dd-just-saved');
                if (label) label.textContent = 'Save';
            }, 1600);
        } else {
            if (btn.classList) btn.classList.remove('dd-just-saved');
            if (label) label.textContent = 'Save';
        }
    },

    // One placement tool at a time: its button lights up, its options card opens under it, and the hint
    // bubble says what to do. No tool (null) is Select.
    toolButtons: { select: 'dd-select-btn', eyedropper: 'dd-eyedropper-btn', stamp: 'dd-stamp-btn', brush: 'dd-brush-btn', path: 'dd-path-btn', biome: 'dd-biome-btn', terrain: 'dd-terrain-btn' },
    toolPopovers: { brush: 'dd-brush-popover', path: 'dd-path-popover', biome: 'dd-biome-popover', terrain: 'dd-terrain-popover' },
    // Tools added by later parts: { click(coords, e), down(e) (true starts a stroke), move(e, stroking),
    // up(e), overlay(g) }, called with the workspace as this. The canvas input part calls them.
    toolHooks: {},
    // Extra sections of the map's own settings: [{ render(mapSettings) -> html, bind(mapSettings) }].
    mapSections: [],

    setPlacementTool(tool) {
        if (this._tour && this._tour.tool !== tool) this.endTour();
        this.placementTool = tool || null;
        for (const [name, id] of Object.entries(this.toolButtons)) {
            const btn = document.getElementById(id);
            if (btn && btn.classList) btn.classList.toggle('dd-btn-active', (this.placementTool || 'select') === name);
        }
        for (const [name, id] of Object.entries(this.toolPopovers)) {
            const pop = document.getElementById(id);
            if (!pop) continue;
            pop.style.display = this.placementTool === name ? 'block' : 'none';
            if (this.placementTool === name) this.placePopover(pop, this.toolButtons[name]);
        }
        this.showMoreMenu(false);
        if (this.placementTool !== 'listen' && this._listenProbe) this.stopListening();
        DocsDoodads.Ui.setHint(DocsDoodads.Ui.hints[this.placementTool || 'none'] || DocsDoodads.Ui.hints.none);
        if (this.placementTool && this.mounted) this.maybeStartTour(this.placementTool);
        if (this.placementTool === 'biome') this.refreshBiomeToolPicker();
        if (this.placementTool === 'region' && this.renderRegionLegend) this.renderRegionLegend();
        if (this.placementTool === 'tiles' && this.renderTilePalette) this.renderTilePalette();
        if (this.placementTool !== 'path') {
            this.pathPoints = [];
            this._pathHover = null;
        }
    },

    open() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs() || this.mounted) return;
        this.showCollision = DocsDoodads.Ui.prefs().collisionOverlay === true;
        this.showSounds = DocsDoodads.Ui.prefs().soundOverlay === true;
        DocsDoodads.Ui.applyLook();
        this.bagView = DocsDoodads.Ui.prefs().bagView === 'folders' ? 'folders' : 'grid';
        const sort = DocsDoodads.Ui.prefs().bagSort;
        this.bagSort = this.bagSorts.some(s => s.value === sort) ? sort : 'search';
        DocsDoodads.Persistence.captureSession();
        DocsDoodads.AssetIndex.init();
        // init() reloads every asset; a selection kept from last time must be the new object.
        if (this.selectedAsset) this.selectedAsset = DocsDoodads.AssetIndex.data.assets[this.selectedAsset.id] || null;
        this.buildDom();
        this.attachCanvasListeners();
        this._onWindowResize = () => this.layoutPanels();
        window.addEventListener('resize', this._onWindowResize);
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = true;
        }
        this.updateCollisionLegend();
        DocsDoodads.Ui.installTooltips();
        if (DocsDoodads.Ui.prefs().perfOverlay === true) this.startPerf();
        this.startAssetScan();
        DocsDoodads.LiveReload.start();
        this.showRecoveryNotices();

        // Check for recovery file
        const recovery = DocsDoodads.Persistence.recoverableSnapshot();
        if (recovery) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            DocsDoodads.Persistence.markRecoveryAnswered(recovery);
            return DocsDoodads.Ui.confirm(`The editor closed at ${dateStr} without saving. Bring back that work?`,
                { title: 'Unsaved work found', ok: 'Bring It Back', cancel: 'Not Now', icon: 'history' }).then(yes => {
                if (!yes || !this.mounted) return;
                this.applyRecovery(recovery);
                this.showToast(recovery.mapId && recovery.mapId !== this.currentMapId()
                    ? `Session recovered into map ${recovery.mapId}.` : "Session Recovered!");
            });
        }
    },

    close() {
        if (!this.mounted) return;
        this.stopStatusBar();
        DocsDoodads.Ui.removeTooltips();
        this.closeToastHistory();
        this.closeLookCard();
        this.closeMapTools();
        this.endTour();
        this.closeCaptureCard();
        this.closeProblems();
        clearTimeout(this._hoverShow);
        this.hideHoverCard(true);
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        this.detachCanvasListeners();
        if (this._onWindowResize) window.removeEventListener('resize', this._onWindowResize);
        if (this._onOutsidePointer) document.removeEventListener('pointerdown', this._onOutsidePointer, true);
        this._onOutsidePointer = null;
        this.removeGhost();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        // Floating panels (Post FX, Asset Tools, World View...) are attached to the page, not the workspace.
        if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
            for (const panel of Array.from(document.querySelectorAll('body > .dd-glass'))) {
                if (panel.parentNode) panel.parentNode.removeChild(panel);
            }
        }
        // The slicer, undo history, import preview and a marquee in progress float on the page too.
        if (DocsDoodads.Slicing.Editor.modal) DocsDoodads.Slicing.Editor.close();
        for (const id of ['dd-undo-history', 'dd-import-modal', 'dd-marquee-overlay']) {
            const node = typeof document !== 'undefined' && document.getElementById ? document.getElementById(id) : null;
            if (node && node.parentNode) node.parentNode.removeChild(node);
        }
        this._undoHistoryOpen = false;
        this.isMarqueeActive = false;
        this._historyDiff = null;
        this._historyPanel = null;
        this._vfxPanel = null;
        this._postFxPanel = null;
        if (this.stopShortcutCapture) this.stopShortcutCapture();
        if (this.stopLabelWatch) this.stopLabelWatch();
        this.previewRegionLook = 0;
        this._roomDrag = null;
        this.stopVfxPreview();
        this.postFxCompare = false;
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = false;
        }
        this.placementTool = null;
        DocsDoodads.LiveReload.stop();
        DocsDoodads.Audio.stopPreview();
    },

    // Puts a crash snapshot back on the map it was recorded on, never the map that happens to be open.
    applyRecovery(recovery) {
        if (!recovery || !window.$gameMap) return;
        const mapId = recovery.mapId || this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (recovery.allDoodads && typeof recovery.allDoodads === 'object') {
            for (const [id, list] of Object.entries(recovery.allDoodads)) if (Array.isArray(list)) data[id] = list;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        if (Array.isArray(recovery.doodads)) {
            data[mapId] = recovery.doodads;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        if (recovery.stagedMaps && typeof recovery.stagedMaps === 'object') {
            for (const [id, staged] of Object.entries(recovery.stagedMaps)) {
                if (!staged || Number(id) === this.currentMapId()) continue;
                DocsDoodads.Persistence.stagedMaps[id] = staged;
                DocsDoodads.Persistence.dirtyMap = true;
            }
        }
        if (recovery.mapSettings) data.mapSettings = recovery.mapSettings;
        if (recovery.world) {
            data.world = recovery.world;
            DocsDoodads.World.invalidate();
        }
        if (recovery.stagedMap) {
            if (mapId === this.currentMapId()) {
                $gameMap._stagedMapData = recovery.stagedMap;
                $gameMap._stagedMapDataId = mapId;
            } else {
                DocsDoodads.Persistence.stagedMaps[mapId] = recovery.stagedMap;
            }
            DocsDoodads.Persistence.dirtyMap = true;
        }
        this.refreshSpriteset();
    },

    async startAssetScan() {
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        const token = { cancelled: false };
        this._assetScanToken = token;
        const status = document.getElementById('dd-status-right');
        // A pill (with Cancel) once the scan takes a moment; a quick, cached scan shows none.
        const pill = DocsDoodads.Ui.progress('Finding your art', { delay: 600, onCancel: () => { token.cancelled = true; } });
        let result;
        try {
            result = await DocsDoodads.AssetIndex.scanAsync({
                loadCache: false,
                cancellationToken: token,
                onProgress: progress => {
                    if (token.cancelled) return;
                    if (status) status.textContent = `Indexing assets ${progress.completed}/${progress.total}`;
                    pill.update(progress.completed, progress.total);
                }
            });
        } finally {
            pill.finish();
        }
        if (pill.cancelled && this.mounted) this.showToast('Stopped looking for art; the Item Bag shows what was found so far.', 'info');
        if (this._assetScanToken !== token || token.cancelled || result.cancelled) return result;
        this._assetScanToken = null;
        if (!result.errors.length) DocsDoodads.Thumbnail.pruneDisk(DocsDoodads.AssetIndex.list);
        if (this.mounted) {
            this.refreshDrawerCards();
            this.updateIndexStatus(result.removed);
            if (result.errors.length > 0) this.showToast(`Asset scan completed with ${result.errors.length} warning(s).`);
        }
        return result;
    },

    // The bag's tabs: [category, icon, name].
    categoryTabs: [
        ['Doodads', 'tree', 'Doodads'], ['Characters', 'person', 'People'], ['Tilesets', 'tiles', 'Tiles'],
        ['Pictures', 'picture', 'Pictures'], ['Prefabs', 'box', 'Prefabs'], ['Audio', 'music', 'Sounds'],
        ['Favorites', 'star', 'Favourites'], ['Recent', 'recent', 'Recently used'], ['All', 'all', 'Everything'],
        ['Faces', 'face', 'Faces'], ['Battlers', 'sword', 'Battlers'], ['Backgrounds', 'scene', 'Backdrops'],
        ['System', 'window', 'System']
    ],

    categoryName(category) {
        const tab = this.categoryTabs.find(t => t[0] === category);
        return tab ? tab[2] : category === 'Similar' ? 'Look-alikes' : category;
    },

    buildDom() {
        const U = DocsDoodads.Ui;
        const wrap = document.createElement('div');
        wrap.id = 'dd-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; user-select: none;
        `;

        const style = document.createElement('style');
        style.id = 'dd-ui-style';
        style.textContent = U.styleText();
        wrap.appendChild(style);

        const tool = (id, icon, label, title, extra = '') =>
            `<button class="dd-btn dd-tool ${extra}" id="${id}" title="${escapeHtml(title)}">${U.icon(icon, 2)}<b>${escapeHtml(label)}</b></button>`;
        const slider = (id, label, valId, value, min, max, step = 1) => `
            <div>
                <div style="display: flex; justify-content: space-between; color: var(--dd-muted);"><span>${label}</span><b id="${valId}" style="color: var(--dd-text);">${value}</b></div>
                <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${parseFloat(value)}" style="width: 100%;" />
            </div>`;

        // Top bar: the tools (pick one, use it on the map), undo, and save / done.
        const toolbar = document.createElement('div');
        toolbar.className = 'dd-glass';
        toolbar.id = 'dd-toolbar';
        toolbar.style.cssText = 'position: absolute; top: 8px; left: 8px; right: 8px;';
        toolbar.innerHTML = `
            <div class="dd-brand" title="Doc's Doodads v${pluginVersion}">${U.icon('leaf', 2)}<span>Doodads</span></div>
            ${tool('dd-select-btn', 'select', 'Select', this.shortcutTip('dd-select-btn'))}
            ${tool('dd-stamp-btn', 'stamp', 'Stamp', this.shortcutTip('dd-stamp-btn'))}
            ${tool('dd-brush-btn', 'brush', 'Scatter', this.shortcutTip('dd-brush-btn'))}
            ${tool('dd-biome-btn', 'biome', 'Paint', this.shortcutTip('dd-biome-btn'))}
            ${tool('dd-path-btn', 'path', 'Path', this.shortcutTip('dd-path-btn'))}
            ${tool('dd-terrain-btn', 'terrain', 'Hills', this.shortcutTip('dd-terrain-btn'))}
            ${tool('dd-region-btn', 'grid', 'Regions', this.shortcutTip('dd-region-btn'))}
            ${tool('dd-tiles-btn', 'tiles', 'Tiles', this.shortcutTip('dd-tiles-btn'))}
            ${tool('dd-sym-btn', 'mirror', 'Mirror', 'Mirror: also place copies on the other side')}
            ${tool('dd-eyedropper-btn', 'picker', 'Grab', this.shortcutTip('dd-eyedropper-btn'))}
            <div class="dd-sep"></div>
            ${tool('dd-undo-btn', 'undo', 'Undo', this.shortcutTip('dd-undo-btn'))}
            ${tool('dd-redo-btn', 'redo', 'Redo', this.shortcutTip('dd-redo-btn'))}
            ${tool('dd-undo-list-btn', 'history', 'Steps', 'Every step you took: jump back to any of them')}
            <div class="dd-spacer"></div>
            <button class="dd-btn dd-tool" id="dd-stop-audio-btn" title="Stop the sound" style="display: none;">${U.icon('sound', 2)}<b>Stop</b></button>
            ${tool('dd-more-btn', 'more', 'More', 'More tools and settings')}
            ${tool('dd-save-btn', 'save', 'Save', DocsDoodads.Shortcuts.tip('save', 'Save everything'), 'dd-btn-good')}
            ${tool('dd-close-btn', 'done', 'Done', `Close the editor and play (${DocsDoodads.KeyChord.label(DocsDoodads.editChord)})`, 'dd-btn-primary')}
        `;
        wrap.appendChild(toolbar);

        // Tool options: each appears under the top bar while its tool is on.
        const pops = document.createElement('div');
        pops.innerHTML = `
            <div id="dd-brush-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('brush', 1)} Scatter</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    ${slider('dd-brush-rad', 'Size ([ and ])', 'dd-brush-rad-val', '80px', 20, 250)}
                    ${slider('dd-brush-den', 'How many', 'dd-brush-den-val', '3', 1, 10)}
                    ${slider('dd-brush-min', 'Space between', 'dd-brush-min-val', '32px', 0, 160)}
                    <div style="line-height: 1.4; color: var(--dd-muted);">Right-drag to erase this item inside the circle.</div>
                    <details>
                        <summary>Variety</summary>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
                            ${slider('dd-brush-scale', 'Size changes', 'dd-brush-scale-val', '15%', 0, 50)}
                            ${slider('dd-brush-rot', 'Tilt', 'dd-brush-rot-val', '25°', 0, 180)}
                            ${slider('dd-brush-flip', 'Flip chance', 'dd-brush-flip-val', '50%', 0, 100)}
                            ${slider('dd-brush-hue', 'Colour changes', 'dd-brush-hue-val', '0°', 0, 90)}
                        </div>
                    </details>
                    <details>
                        <summary>Where it can go</summary>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; color: var(--dd-muted);">
                            <label>Only on regions (e.g. 1, 2)<input type="text" id="dd-brush-regions" style="width: 100%;" /></label>
                            <label>Only on terrain tags<input type="text" id="dd-brush-terrain" style="width: 100%;" /></label>
                            <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-brush-avoid" /> Not where you can't walk</label>
                        </div>
                    </details>
                </div>
            </div>
            <div id="dd-biome-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('biome', 1)} Paint</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--dd-muted);">
                    <select id="dd-biome-tool-pick" style="width: 100%;"></select>
                    ${slider('dd-biome-rad', 'Size ([ and ])', 'dd-biome-rad-val', '96px', 24, 320)}
                    <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-biome-avoid" checked /> Not where you can't walk</label>
                    <div style="line-height: 1.4;">Drag on the map. Make mixes in Details (with nothing picked), under Biomes.</div>
                </div>
            </div>
            <div id="dd-terrain-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('terrain', 1)} Hills</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--dd-muted);">
                    <select id="dd-terrain-mode" style="width: 100%;"></select>
                    <div>Strength: <b id="dd-terrain-amount-val" style="color: var(--dd-text);">0.5</b> tiles<input type="range" id="dd-terrain-amount" min="0.1" max="3" step="0.1" value="0.5" style="width: 100%;" /></div>
                    <div>Size ([ and ]): <b id="dd-terrain-radius-val" style="color: var(--dd-text);">1</b> tiles<input type="range" id="dd-terrain-radius" min="0" max="6" step="1" value="1" style="width: 100%;" /></div>
                    <label>Edge<select id="dd-terrain-falloff" style="width: 100%;"></select></label>
                    <label>Height for "Set" (tiles)<input type="number" step="0.25" id="dd-terrain-value" value="1" style="width: 100%;" /></label>
                    <div style="line-height: 1.4;">Drag on the map; each stroke is one undo step. The numbers are each tile's height; the hills show in the 3D view.</div>
                </div>
            </div>
            <div id="dd-region-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('grid', 1)} Regions</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--dd-muted);">
                    <label>Region to paint (0 rubs out)<input type="number" id="dd-region-id" min="0" max="255" step="1" value="1" style="width: 100%;" /></label>
                    <div>Size ([ and ]): <b id="dd-region-rad-val" style="color: var(--dd-text);">1</b> tiles across<input type="range" id="dd-region-rad" min="0" max="6" step="1" value="0" style="width: 100%;" /></div>
                    <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-region-tags" /> Show terrain tags (set in MZ's Tilesets)</label>
                    <div id="dd-region-legend"></div>
                    <div style="line-height: 1.4;">Drag on the map; each stroke is one undo step and is saved with the map. Alt+click picks up a tile's region.</div>
                </div>
            </div>
            <div id="dd-tiles-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('tiles', 1)} Tiles</div>
                <div id="dd-tiles-palette" style="display: flex; flex-direction: column; gap: 6px;"></div>
            </div>
            <div id="dd-sym-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('mirror', 1)} Mirror</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: var(--dd-muted);">
                    <select id="dd-sym-mode" style="width: 100%;"></select>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                        <label>Line across (tile)<input type="number" step="0.5" id="dd-sym-x" style="width: 100%;" /></label>
                        <label>Line down (tile)<input type="number" step="0.5" id="dd-sym-y" style="width: 100%;" /></label>
                    </div>
                    <button class="dd-btn" id="dd-sym-center">Middle of the map</button>
                    <div style="line-height: 1.4;">Stamp, Scatter and Paint place mirrored copies too.</div>
                </div>
            </div>
            <div id="dd-path-popover" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('path', 1)} Path</div>
                <div style="font-size: 11px; color: var(--dd-muted); margin-bottom: 8px; line-height: 1.4;">Click to add points. Double-click or Enter lays the picked item along them; Backspace takes back a point; Alt for off-grid points.</div>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    ${slider('dd-path-spacing', 'Space between', 'dd-path-spacing-val', '48px', 8, 240)}
                    ${slider('dd-path-jitter', 'Wobble', 'dd-path-jitter-val', '0px', 0, 24)}
                    <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-align" /> Turn pieces along the path</label>
                    <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-smooth" /> Smooth curve</label>
                    <details>
                        <summary>End and corner pieces</summary>
                        <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
                            <div style="color: var(--dd-muted);">End piece: <b id="dd-path-end-name" style="color: var(--dd-text);">same as path</b></div>
                            <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-end-btn" style="flex: 1;">Use Picked</button><button class="dd-btn" id="dd-path-end-clear">Clear</button></div>
                            <div style="color: var(--dd-muted);">Corner piece: <b id="dd-path-corner-name" style="color: var(--dd-text);">same as path</b></div>
                            <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-corner-btn" style="flex: 1;">Use Picked</button><button class="dd-btn" id="dd-path-corner-clear">Clear</button></div>
                        </div>
                    </details>
                    <div style="display: flex; gap: 6px; margin-top: 4px;"><button class="dd-btn dd-btn-primary" id="dd-path-place" style="flex: 1;">Lay the Path</button><button class="dd-btn" id="dd-path-clear">Start Over</button></div>
                </div>
            </div>
            <div id="dd-more-menu" class="dd-glass dd-pop" style="display: none;">
                <div class="dd-pop-title">${U.icon('more', 1)} More</div>
                <div class="dd-more-grid">
                    <button class="dd-btn" id="dd-slicer-btn" title="Cut a picked sprite sheet into pieces">${U.icon('scissors', 1)} Cut Up Sheet</button>
                    <button class="dd-btn" id="dd-postfx-btn" title="Looks and screen effects for the whole game or this map; save a picture of the map">${U.icon('sun', 1)} Screen Looks</button>
                    <button class="dd-btn" id="dd-vfx-btn" title="Make sparkles, smoke, fire and other effects">${U.icon('sparkle', 1)} Effects Maker</button>
                    <button class="dd-btn" id="dd-history-btn" title="Compare with earlier saves and bring single things back">${U.icon('folder', 1)} Old Saves</button>
                    <button class="dd-btn" id="dd-tools-btn" title="Find copies of the same file and files nothing uses">${U.icon('wrench', 1)} File Check</button>
                    <button class="dd-btn" id="dd-diag-btn" title="Numbers, cache and backups">${U.icon('info', 1)} Info</button>
                    <button class="dd-btn" id="dd-grid-btn" title="${escapeHtml(this.shortcutTip('dd-grid-btn'))}">${U.icon('grid', 1)} <span id="dd-grid-label">Show Grid</span></button>
                    <button class="dd-btn" id="dd-collision-btn" title="Show every doodad's collision and the tiles you can't walk on">${U.icon('lock', 1)} <span id="dd-collision-label">${this.showCollision ? 'Hide Collision' : 'Show Collision'}</span></button>
                    <button class="dd-btn" id="dd-sound-btn" title="Little sounds when you use the tools">${U.icon('sound', 1)} <span id="dd-sound-label">Sounds</span></button>
                    <button class="dd-btn" id="dd-palette-btn" title="${escapeHtml(this.shortcutTip('dd-palette-btn'))}">${U.icon('search', 1)} Find a Tool</button>
                    <button class="dd-btn" id="dd-messages-btn" title="Read the editor's recent messages again">${U.icon('history', 1)} Messages</button>
                    <button class="dd-btn" id="dd-look-btn" title="Editor size, theme and map colours">${U.icon('eye', 1)} Look</button>
                    <button class="dd-btn" id="dd-rooms-btn" title="Save part of the map (tiles, doodads, events) as a room stamp and place it again">${U.icon('map', 1)} Rooms</button>
                    <button class="dd-btn" id="dd-packs-btn" title="Put prefabs, rooms, biomes and their art in one file for another project, or bring one in">${U.icon('box', 1)} Packs</button>
                    <button class="dd-btn" id="dd-keys-btn" title="${escapeHtml(this.shortcutTip('dd-keys-btn'))}">${U.icon('gear', 1)} Keys</button>
                    <button class="dd-btn" id="dd-capture-btn" title="Save a picture of the view, or a 3D orbit GIF">${U.icon('picture', 1)} Capture</button>
                    <button class="dd-btn" id="dd-problems-btn" title="Missing pictures and sounds, doodads off the map, lamps that never show, places out of reach">${U.icon('help', 1)} Problems</button>
                    <button class="dd-btn" id="dd-sounds-btn" title="Show where each sound on this map can be heard">${U.icon('sound', 1)} <span id="dd-sounds-label">${this.showSounds ? 'Hide Sounds' : 'Show Sounds'}</span></button>
                    <button class="dd-btn" id="dd-listen-btn" title="Click a tile to hear what the player would hear there">${U.icon('music', 1)} Listen</button>
                    <button class="dd-btn" id="dd-perf-btn" title="Frames a second, draw calls, pictures loaded and lights">${U.icon('gear', 1)} <span id="dd-perf-label">${DocsDoodads.Ui.prefs().perfOverlay === true ? 'Hide Speed' : 'Show Speed'}</span></button>
                    <button class="dd-btn" id="dd-help-btn" title="How to use the editor">${U.icon('help', 1)} How to Use</button>
                </div>
                <div style="margin-top: 10px; font-weight: 800; color: var(--dd-muted);">Panel sizes</div>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <select id="dd-layout-select" style="flex: 1; min-width: 0;"></select>
                    <button class="dd-btn" id="dd-save-layout-btn" title="Remember the panel sizes as a new layout">${U.icon('plus', 1)}</button>
                    <button class="dd-btn" id="dd-del-layout-btn" title="Delete this layout" style="display: none;">${U.icon('trash', 1)}</button>
                </div>
            </div>
        `;
        while (pops.firstChild) wrap.appendChild(pops.firstChild);

        // The bag (left): everything you can place.
        const drawer = document.createElement('div');
        drawer.className = 'dd-glass';
        drawer.id = 'dd-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 76px; left: 8px; bottom: 8px; width: 250px; padding: 10px;
            display: flex; flex-direction: column; gap: 7px; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div id="dd-drawer-resizer" style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20;" title="Drag to resize"></div>
            <div class="dd-panel-head" id="dd-drawer-head" title="Item Bag">
                ${U.icon('bag', 2)}
                <span class="dd-grow">Item Bag <span id="dd-drawer-category" style="color: var(--dd-muted); font-weight: 800; font-size: 12px;"></span></span>
                <button class="dd-btn dd-fold" id="dd-drawer-fold" title="Fold the bag away">${U.icon('left', 1)}</button>
            </div>
            <div style="display: flex; gap: 6px;">
                <div class="dd-search">${U.icon('search', 1)}<input type="text" id="dd-search-input" placeholder="Find... (tree, tag:rock, -dead)" /></div>
            </div>
            <div id="dd-search-chips"></div>
            <div style="display: flex; gap: 6px;">
                <select id="dd-collection-select" title="Show one collection (right-click an item: Add to Collection)" style="flex: 1; min-width: 0;"></select>
                <button class="dd-btn" id="dd-del-collection-btn" title="Delete this collection (the items stay)" style="display: none; padding: 3px 7px;">${U.icon('trash', 1)}</button>
            </div>
            <div id="dd-category-tabs">
                ${this.categoryTabs.map(([cat, icon, name]) => `<button class="dd-btn${cat === this.currentCategory ? ' dd-btn-primary' : ''}" data-cat="${cat}" title="${escapeHtml(name)}">${U.icon(icon, 1)}</button>`).join('')}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                <span style="font-size: 11px; color: var(--dd-muted); font-weight: 800; white-space: nowrap;" id="dd-asset-count">0 items</span>
                <button class="dd-btn" id="dd-bag-view" type="button" style="padding: 2px 6px;" title="${this.bagView === 'folders' ? 'Show the items as cards' : 'Show the items in their folders'}">${U.icon('folder', 1)}</button>
                <select id="dd-bag-sort" title="Order of the items">${this.bagSorts.map(s => `<option value="${s.value}"${s.value === this.bagSort ? ' selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}</select>
                <div style="display: flex; align-items: center; flex: none;" title="Card size">
                    <input type="range" id="dd-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 54px;" />
                </div>
            </div>
            <div id="dd-cards-container" style="flex: 1; overflow-y: auto; padding: 2px 2px 8px; position: relative; margin: 0 -4px 0 0;">
                <div id="dd-cards-sizer" style="width: 100%; position: relative;">
                    <div id="dd-cards-viewport" style="position: absolute; top: 0; left: 0; right: 0; display: grid; gap: 8px;"></div>
                </div>
            </div>
            <div id="dd-status-right" style="font-size: 10px; color: var(--dd-faint); font-weight: 700;"></div>
        `;
        wrap.appendChild(drawer);

        // Details (right): what is picked or selected, or this map's settings.
        const inspector = document.createElement('div');
        inspector.className = 'dd-glass';
        inspector.id = 'dd-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 76px; right: 8px; bottom: 8px; width: 270px;
            padding: 10px 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
        `;
        inspector.innerHTML = `
            <div id="dd-inspector-resizer" style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20;" title="Drag to resize"></div>
            <div class="dd-panel-head" id="dd-inspector-head">
                <button class="dd-btn dd-fold" id="dd-inspector-fold" title="Fold the details away (H)">${U.icon('right', 1)}</button>
                <span id="dd-inspector-icon">${U.icon('map', 2)}</span>
                <span class="dd-grow" id="dd-inspector-title">Details</span>
            </div>
            <div id="dd-inspector-content" style="font-size: 12px; color: var(--dd-muted);">
                Pick something in the bag or click a placed thing on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // The hint bubble: what to do next.
        const hint = document.createElement('div');
        hint.className = 'dd-glass';
        hint.id = 'dd-hint';
        hint.innerHTML = `${U.icon('help', 1)}<span id="dd-status-left">${escapeHtml(U.hints.none)}</span>`;
        wrap.appendChild(hint);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;
        this.applyScale();
        this.buildStatusBar();
        this.rememberMap(this.currentMapId());

        this.bindEvents();
        this.updateSaveState();
        const prefs = DocsDoodads.Ui.prefs();
        if (prefs.drawerFolded) this.foldPanel('drawer', true);
        if (prefs.inspectorFolded) this.foldPanel('inspector', true);
        // The chosen layout's panel widths and card size.
        DocsDoodads.Layout.apply(DocsDoodads.Layout.current);
        this.setPlacementTool(this.placementTool);
        this.layoutPanels();
        this.refreshDrawerCards();
        this.refreshInspector();
        if (!prefs.welcomed) this.showWelcome();
        else this.maybeShowWhatsNew();
    },

    // The side panels start just below the top bar (it can wrap in a narrow window); open option cards
    // follow their buttons.
    layoutPanels() {
        this.applyScale();
        const toolbar = document.getElementById('dd-toolbar');
        if (!toolbar) return;
        const top = (toolbar.offsetTop || 8) + (toolbar.offsetHeight || 64) + 8;
        for (const id of ['dd-drawer-panel', 'dd-inspector-panel']) {
            const panel = document.getElementById(id);
            if (panel) panel.style.top = top + 'px';
        }
        for (const [name, id] of Object.entries(this.toolPopovers)) {
            const pop = document.getElementById(id);
            if (pop && pop.style.display === 'block') this.placePopover(pop, this.toolButtons[name]);
        }
        this.placeHint();
    },

    // Where each panel is docked (44_workspace_docking.js moves them): left, right or bottom.
    dock: { drawer: 'left', inspector: 'right', bottomHeight: 260 },

    // The part of the window the map shows in, between the panels: { left, right, bottom, lift }, where
    // lift is how far a panel docked at the bottom raises things that sit at the map's bottom edge.
    mapArea() {
        const room = this.roomSize();
        const rect = id => {
            const el = typeof document !== 'undefined' ? document.getElementById(id) : null;
            return el && el.getBoundingClientRect && !(el.style && el.style.display === 'none') ? el.getBoundingClientRect() : null;
        };
        let left = 8, right = room.w - 8, bottom = room.h;
        for (const [id, which] of [['dd-drawer-panel', 'drawer'], ['dd-inspector-panel', 'inspector']]) {
            const r = rect(id);
            if (!r || !(r.width || r.right)) continue;
            const side = (this.dock && this.dock[which]) || (which === 'drawer' ? 'left' : 'right');
            if (side === 'left') left = Math.max(left, r.right + 8);
            else if (side === 'right') right = Math.min(right, r.left - 8);
            else bottom = Math.min(bottom, r.top);
        }
        return { left, right, bottom, lift: Math.max(0, room.h - bottom) };
    },

    // The hint bubble sits over the map, between the panels.
    placeHint() {
        const hint = document.getElementById('dd-hint');
        if (!hint || !hint.style) return;
        const area = this.mapArea();
        const width = Math.max(140, area.right - area.left);
        hint.style.left = Math.round(area.left + width / 2) + 'px';
        hint.style.maxWidth = Math.round(width) + 'px';
        const raised = hint.classList && hint.classList.contains && hint.classList.contains('dd-hint-raised');
        hint.style.bottom = area.lift ? Math.round(area.lift + (raised ? 42 : 10)) + 'px' : '';
        this.placeReadouts();
    },

    // An options card just under its top-bar button, kept inside the window.
    placePopover(pop, buttonId) {
        const toolbar = document.getElementById('dd-toolbar');
        const btn = document.getElementById(buttonId);
        if (!pop || !toolbar || !btn || typeof btn.getBoundingClientRect !== 'function') return;
        const bar = toolbar.getBoundingClientRect(), at = btn.getBoundingClientRect();
        const width = pop.offsetWidth || 270, room = this.roomSize().w;
        pop.style.top = Math.round(bar.bottom + 8) + 'px';
        pop.style.left = Math.round(Math.max(8, Math.min(room - width - 8, at.left + at.width / 2 - width / 2))) + 'px';
    },

    showMoreMenu(open) {
        const menu = document.getElementById('dd-more-menu');
        if (!menu) return;
        menu.style.display = open ? 'block' : 'none';
        const btn = document.getElementById('dd-more-btn');
        if (btn && btn.classList) btn.classList.toggle('dd-btn-active', Boolean(open));
        if (open) {
            this.placePopover(menu, 'dd-more-btn');
            const grid = document.getElementById('dd-grid-label');
            if (grid) grid.textContent = this.gridSnapShow ? 'Hide Grid' : 'Show Grid';
            const sound = document.getElementById('dd-sound-label');
            if (sound) sound.textContent = DocsDoodads.Ui.prefs().sounds === false ? 'Sounds: Off' : 'Sounds: On';
        }
    },

    // The bag and the details panel fold away to a narrow strip (remembered on this computer).
    foldPanel(which, folded) {
        const panel = document.getElementById(which === 'drawer' ? 'dd-drawer-panel' : 'dd-inspector-panel');
        if (!panel || !panel.classList) return;
        panel.classList.toggle('dd-collapsed', Boolean(folded));
        const resizer = document.getElementById(which === 'drawer' ? 'dd-drawer-resizer' : 'dd-inspector-resizer');
        if (resizer) resizer.style.display = folded ? 'none' : 'block';
        const fold = document.getElementById(which === 'drawer' ? 'dd-drawer-fold' : 'dd-inspector-fold');
        const U = DocsDoodads.Ui;
        if (fold) {
            fold.innerHTML = U.icon(which === 'drawer' ? (folded ? 'right' : 'left') : (folded ? 'left' : 'right'), 1);
            fold.title = folded ? 'Open it again' : (which === 'drawer' ? 'Fold the bag away' : 'Fold the details away (H)');
        }
        U.setPref(which + 'Folded', Boolean(folded));
        if (!folded && which === 'drawer') this.updateVirtualGrid(true);
        this.placeHint();
    },

    isFolded(which) {
        const panel = document.getElementById(which === 'drawer' ? 'dd-drawer-panel' : 'dd-inspector-panel');
        return Boolean(panel && panel.classList && panel.classList.contains('dd-collapsed'));
    },

    // The first time (and from More, How to Use): three steps to get going.
    showWelcome() {
        const U = DocsDoodads.Ui;
        const old = document.getElementById('dd-welcome');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const card = document.createElement('div');
        card.id = 'dd-welcome';
        card.className = 'dd-glass';
        card.innerHTML = `
            ${U.icon('leaf', 3)}
            <h2>Let's decorate!</h2>
            <div style="color: var(--dd-muted);">Three steps, that's all:</div>
            <ol>
                <li><span class="dd-num">1</span>${U.icon('bag', 2)}<span>Pick something from the <b>Item Bag</b> on the left.</span></li>
                <li><span class="dd-num">2</span>${U.icon('select', 2)}<span><b>Click the map</b> to put it there. Drag things to move them; right-click for more.</span></li>
                <li><span class="dd-num">3</span>${U.icon('save', 2)}<span>Press <b>Save</b>, then <b>Done</b> to play.</span></li>
            </ol>
            <div style="color: var(--dd-muted); font-size: 11px; margin-bottom: 10px;">Stuck? The bubble at the bottom always says what to do next.</div>
            <div class="dd-welcome-more">
                <button class="dd-btn" id="dd-welcome-samples" type="button" title="Draws a few pictures into img/doodads/samples and adds two prefabs and a biome to try">${U.icon('box', 1)} Add Sample Items</button>
                <button class="dd-btn" id="dd-welcome-tours" type="button">${U.icon('help', 1)} Replay Tool Tours</button>
                <button class="dd-btn" id="dd-welcome-new" type="button">${U.icon('sparkle', 1)} What's New</button>
            </div>
            <button class="dd-btn dd-btn-primary" id="dd-welcome-ok" style="font-size: 14px; padding: 8px 26px;">Got it!</button>
        `;
        (this.container || document.body).appendChild(card);
        const ok = document.getElementById('dd-welcome-ok');
        const dismiss = () => {
            // Someone just welcomed has nothing "new" to catch up on.
            if (!U.prefs().welcomed) U.setPref('whatsNewSeen', DocsDoodads.WhatsNew.id);
            U.setPref('welcomed', true);
            if (card.parentNode) card.parentNode.removeChild(card);
        };
        if (ok) ok.onclick = () => { U.sound('ok'); dismiss(); };
        const samples = document.getElementById('dd-welcome-samples');
        if (samples) samples.onclick = () => { dismiss(); this.addSampleContent(); };
        const tours = document.getElementById('dd-welcome-tours');
        if (tours) tours.onclick = () => { dismiss(); this.replayTours(); };
        const whatsNew = document.getElementById('dd-welcome-new');
        if (whatsNew) whatsNew.onclick = () => { dismiss(); this.showWhatsNew(); };
    },

    refreshLayoutSelector() {
        const layoutSel = document.getElementById('dd-layout-select');
        if (!layoutSel) return;
        const names = DocsDoodads.Layout.getAllNames();
        layoutSel.innerHTML = '';
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `Layout: ${name}`;
            if (name === DocsDoodads.Layout.current) opt.selected = true;
            layoutSel.appendChild(opt);
        }
        const delBtn = document.getElementById('dd-del-layout-btn');
        if (delBtn) {
            const isCustom = !DocsDoodads.Layout.presets[DocsDoodads.Layout.current];
            delBtn.style.display = isCustom ? 'inline-block' : 'none';
        }
    },

    // The collection a search shows, from its collection:"..." term (the first one).
    searchCollection() {
        const m = /(?:^|\s)collection:(?:"([^"]*)"|'([^']*)'|(\S+))/i.exec(this.searchQuery || '');
        if (!m) return '';
        const wanted = (m[1] || m[2] || m[3] || '').toLowerCase();
        return DocsDoodads.AssetIndex.getCollections().find(name => name.toLowerCase() === wanted) || '';
    },

    // Shows one collection (or all assets): swaps the search's collection term, keeping the rest.
    setSearchCollection(name) {
        const rest = String(this.searchQuery || '').replace(/(?:^|\s)collection:(?:"[^"]*"|'[^']*'|\S+)/gi, ' ').replace(/\s+/g, ' ').trim();
        this.searchQuery = name ? `${rest} collection:"${name}"`.trim() : rest;
        const input = document.getElementById('dd-search-input');
        if (input) input.value = this.searchQuery;
        this.refreshDrawerCards();
        this.refreshCollectionPicker();
        this.refreshSearchChips();
    },

    refreshCollectionPicker() {
        const select = document.getElementById('dd-collection-select');
        if (!select) return;
        const library = DocsDoodads.AssetIndex.data;
        const names = DocsDoodads.AssetIndex.getCollections().sort((a, b) => a.localeCompare(b));
        const current = this.searchCollection();
        select.innerHTML = '';
        const all = document.createElement('option');
        all.value = '';
        all.textContent = names.length ? 'All collections' : 'No collections yet';
        select.appendChild(all);
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `📁 ${name} (${(library.collections[name] || []).length})`;
            if (name === current) opt.selected = true;
            select.appendChild(opt);
        }
        select.disabled = names.length === 0;
        const del = document.getElementById('dd-del-collection-btn');
        if (del) del.style.display = current ? 'inline-block' : 'none';
    },

    bindEvents() {
        document.getElementById('dd-close-btn').onclick = () => { DocsDoodads.Ui.sound('cancel'); return this.requestClose(); };
        document.getElementById('dd-save-btn').onclick = () => DocsDoodads.Persistence.saveAll();
        document.getElementById('dd-undo-btn').onclick = () => DocsDoodads.Undo.undo();
        document.getElementById('dd-undo-list-btn').onclick = () => this.toggleUndoHistory();
        document.getElementById('dd-redo-btn').onclick = () => DocsDoodads.Undo.redo();

        this.refreshLayoutSelector();
        const layoutSel = document.getElementById('dd-layout-select');
        if (layoutSel) {
            layoutSel.onchange = (e) => {
                DocsDoodads.Layout.apply(e.target.value);
            };
        }

        const saveLayoutBtn = document.getElementById('dd-save-layout-btn');
        if (saveLayoutBtn) {
            saveLayoutBtn.onclick = async () => {
                const name = await DocsDoodads.Ui.prompt('Name this layout of panel sizes:', 'Custom Layout ' + (Object.keys(DocsDoodads.Layout.custom).length + 1),
                    { title: 'Save layout', ok: 'Save Layout', icon: 'window' });
                if (name && name.trim()) {
                    DocsDoodads.Layout.saveCurrentAs(name.trim());
                    this.refreshLayoutSelector();
                    this.showToast(`Saved layout "${name.trim()}"!`);
                }
            };
        }

        const delLayoutBtn = document.getElementById('dd-del-layout-btn');
        if (delLayoutBtn) {
            delLayoutBtn.onclick = async () => {
                const cur = DocsDoodads.Layout.current;
                if (await DocsDoodads.Ui.confirm(`The layout "${cur}" will be deleted. Your panels keep their current sizes.`,
                    { title: 'Delete layout?', ok: 'Delete Layout', danger: true })) {
                    DocsDoodads.Layout.deleteCustomLayout(cur);
                    this.refreshLayoutSelector();
                    this.showToast(`Deleted layout "${cur}".`);
                }
            };
        }

        // Draggable Drawer Resizer
        const drawerResizer = document.getElementById('dd-drawer-resizer');
        if (drawerResizer && this.drawerEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            drawerResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.drawerEl.style.width, 10) || 360;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX) / this.uiScaleNow()));
                    this.drawerEl.style.width = newW + 'px';
                    this.updateVirtualGrid(true);
                    this.placeHint();
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        // Draggable Inspector Resizer
        const inspectorResizer = document.getElementById('dd-inspector-resizer');
        if (inspectorResizer && this.inspectorEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            inspectorResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.inspectorEl.style.width, 10) || 280;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(600, startWidth - (ev.clientX - startX) / this.uiScaleNow()));
                    this.inspectorEl.style.width = newW + 'px';
                    this.placeHint();
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        const searchInput = document.getElementById('dd-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
            this.refreshCollectionPicker();
            this.refreshSearchChips();
        };
        const sortSel = document.getElementById('dd-bag-sort');
        if (sortSel) sortSel.onchange = e => this.setBagSort(e.target.value);
        const viewBtn = document.getElementById('dd-bag-view');
        if (viewBtn) viewBtn.onclick = () => this.setBagView(this.bagView === 'folders' ? 'grid' : 'folders');
        this.refreshSearchChips();

        this.refreshCollectionPicker();
        const collectionSel = document.getElementById('dd-collection-select');
        if (collectionSel) collectionSel.onchange = e => this.setSearchCollection(e.target.value);
        const delCollectionBtn = document.getElementById('dd-del-collection-btn');
        if (delCollectionBtn) {
            delCollectionBtn.onclick = async () => {
                const name = this.searchCollection();
                if (!name || !(await DocsDoodads.Ui.confirm(`The collection "${name}" will be deleted. The pictures in it stay in the Item Bag.`,
                    { title: 'Delete collection?', ok: 'Delete Collection', danger: true }))) return;
                DocsDoodads.AssetIndex.deleteCollection(name);
                this.setSearchCollection('');
                this.showToast(`Deleted collection "${name}".`);
            };
        }

        const container = document.getElementById('dd-cards-container');
        if (container) {
            container.onscroll = () => this.updateVirtualGrid();
        }

        const zoomSlider = document.getElementById('dd-thumb-zoom');
        zoomSlider.oninput = (e) => {
            this.thumbSize = Number(e.target.value);
            this.updateVirtualGrid(true);
        };

        const catTabs = document.getElementById('dd-category-tabs');
        catTabs.onclick = (e) => {
            const tab = e.target && e.target.closest ? e.target.closest('button') : e.target;
            if (tab && tab.dataset && tab.dataset.cat) {
                this._categoryChosen = true;
                DocsDoodads.Ui.sound('cursor');
                this.setCategory(tab.dataset.cat);
            }
        };

        // The new buttons: Select, More (and what is in it), folding the panels.
        const U = DocsDoodads.Ui;
        const on = (id, handler) => { const node = document.getElementById(id); if (node) node.onclick = handler; };
        on('dd-select-btn', () => { U.sound('ok'); this.setPlacementTool(null); });
        on('dd-more-btn', () => { U.sound('cursor'); this.showMoreMenu(document.getElementById('dd-more-menu').style.display !== 'block'); });
        on('dd-grid-btn', () => { this.toggleGrid(); this.showMoreMenu(false); });
        on('dd-collision-btn', () => { this.toggleCollisionOverlay(); this.showMoreMenu(false); });
        on('dd-sound-btn', () => {
            U.setPref('sounds', U.prefs().sounds === false);
            U.sound('ok');
            this.showMoreMenu(true);
        });
        on('dd-palette-btn', () => { this.showMoreMenu(false); this.showCommandPalette(); });
        on('dd-messages-btn', () => { this.showMoreMenu(false); this.showToastHistory(); });
        on('dd-look-btn', () => { this.showMoreMenu(false); this.showLookCard(); });
        on('dd-keys-btn', () => { this.showMoreMenu(false); this.showShortcutsCard(); });
        on('dd-rooms-btn', () => { this.showMoreMenu(false); this.showRoomsCard(); });
        on('dd-packs-btn', () => { this.showMoreMenu(false); this.showPacksCard(); });
        on('dd-capture-btn', () => { this.showMoreMenu(false); this.showCaptureCard(); });
        on('dd-problems-btn', () => { this.showMoreMenu(false); this.showProblems(); });
        on('dd-sounds-btn', () => { this.toggleSoundOverlay(); this.showMoreMenu(false); });
        on('dd-listen-btn', () => { this.setPlacementTool('listen'); });
        on('dd-perf-btn', () => { this.togglePerfOverlay(); this.showMoreMenu(false); });
        on('dd-help-btn', () => { this.showMoreMenu(false); this.showWelcome(); });
        on('dd-drawer-fold', e => { if (e && e.stopPropagation) e.stopPropagation(); U.sound('cursor'); this.foldPanel('drawer', !this.isFolded('drawer')); });
        on('dd-inspector-fold', e => { if (e && e.stopPropagation) e.stopPropagation(); U.sound('cursor'); this.foldPanel('inspector', !this.isFolded('inspector')); });
        // A folded panel opens again from anywhere on its strip.
        on('dd-drawer-head', () => { if (this.isFolded('drawer')) this.foldPanel('drawer', false); });
        on('dd-inspector-head', () => { if (this.isFolded('inspector')) this.foldPanel('inspector', false); });
        // More and Mirror close when you click anywhere else (or press Esc).
        if (this._onOutsidePointer) document.removeEventListener('pointerdown', this._onOutsidePointer, true);
        this._onOutsidePointer = e => {
            const inside = (id, buttonId) => {
                const el = document.getElementById(id), btn = document.getElementById(buttonId);
                return (el && el.contains && el.contains(e.target)) || (btn && btn.contains && btn.contains(e.target));
            };
            const more = document.getElementById('dd-more-menu');
            if (more && more.style.display === 'block' && !inside('dd-more-menu', 'dd-more-btn')) this.showMoreMenu(false);
            const sym = document.getElementById('dd-sym-popover');
            if (sym && sym.style.display === 'block' && !inside('dd-sym-popover', 'dd-sym-btn')) sym.style.display = 'none';
        };
        document.addEventListener('pointerdown', this._onOutsidePointer, true);
        // The More menu closes once one of its tools opens (the layout buttons keep it open).
        const more = document.getElementById('dd-more-menu');
        if (more) more.addEventListener('click', e => {
            const btn = e.target && e.target.closest ? e.target.closest('button') : null;
            if (btn && /^(dd-slicer-btn|dd-postfx-btn|dd-vfx-btn|dd-history-btn|dd-tools-btn|dd-diag-btn)$/.test(btn.id)) {
                U.sound('ok');
                this.showMoreMenu(false);
            }
        });

        document.getElementById('dd-slicer-btn').onclick = () => {
            if (this.selectedAsset) DocsDoodads.Slicing.Editor.open(this.selectedAsset);
            else this.showToast('First pick a sprite sheet in the Item Bag.', 'info');
        };

        document.getElementById('dd-diag-btn').onclick = () => this.openDiagnosticsModal();
        document.getElementById('dd-tools-btn').onclick = () => this.showAssetTools();
        document.getElementById('dd-postfx-btn').onclick = () => this.showPostFxBuilder();
        document.getElementById('dd-vfx-btn').onclick = () => this.showVfxBuilder();
        document.getElementById('dd-history-btn').onclick = () => this.showHistoryPanel();
        this.bindToolbarExtras();

        document.getElementById('dd-stop-audio-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            document.getElementById('dd-stop-audio-btn').style.display = 'none';
        };

        const pickTool = name => {
            DocsDoodads.Ui.sound('ok');
            this.setPlacementTool(this.placementTool === name ? null : name);
            // Tools that place the picked item: say so when nothing is picked yet.
            if (this.placementTool && ['stamp', 'brush', 'path'].includes(this.placementTool) && !this.selectedAsset) {
                this.showToast('First pick something from the Item Bag.', 'info');
            }
        };
        document.getElementById('dd-eyedropper-btn').onclick = () => pickTool('eyedropper');
        document.getElementById('dd-stamp-btn').onclick = () => pickTool('stamp');
        document.getElementById('dd-brush-btn').onclick = () => pickTool('brush');

        const setupBrushSlider = (id, prop, valId, suffix, mult = 1) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (el && valEl) {
                el.oninput = (ev) => {
                    const num = parseFloat(ev.target.value);
                    this.brushSettings[prop] = mult !== 1 ? num * mult : num;
                    valEl.textContent = num + suffix;
                };
            }
        };
        setupBrushSlider('dd-brush-rad', 'radius', 'dd-brush-rad-val', 'px');
        setupBrushSlider('dd-brush-den', 'density', 'dd-brush-den-val', '');
        setupBrushSlider('dd-brush-scale', 'scaleJitter', 'dd-brush-scale-val', '%', 0.01);
        setupBrushSlider('dd-brush-rot', 'rotateJitter', 'dd-brush-rot-val', '°');
        setupBrushSlider('dd-brush-min', 'minDistance', 'dd-brush-min-val', 'px');
        setupBrushSlider('dd-brush-flip', 'flipChance', 'dd-brush-flip-val', '%', 0.01);
        setupBrushSlider('dd-brush-hue', 'hueJitter', 'dd-brush-hue-val', '°');
        document.getElementById('dd-brush-regions').oninput = (ev) => { this.brushSettings.regions = ev.target.value; };
        document.getElementById('dd-brush-terrain').oninput = (ev) => { this.brushSettings.terrainTags = ev.target.value; };
        document.getElementById('dd-brush-avoid').onchange = (ev) => { this.brushSettings.avoidBlocked = Boolean(ev.target.checked); };

        document.getElementById('dd-path-btn').onclick = () => pickTool('path');
        const pathSlider = (id, prop) => {
            const input = document.getElementById(id);
            input.oninput = (ev) => {
                this.pathSettings[prop] = parseFloat(ev.target.value) || 0;
                document.getElementById(id + '-val').textContent = ev.target.value + 'px';
            };
        };
        pathSlider('dd-path-spacing', 'spacing');
        pathSlider('dd-path-jitter', 'jitter');
        document.getElementById('dd-path-align').onchange = (ev) => { this.pathSettings.alignToPath = Boolean(ev.target.checked); };
        document.getElementById('dd-path-smooth').onchange = (ev) => { this.pathSettings.smooth = Boolean(ev.target.checked); };
        const pieceButtons = (kind, prop) => {
            const label = document.getElementById(`dd-path-${kind}-name`);
            document.getElementById(`dd-path-${kind}-btn`).onclick = () => {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('First pick a picture in the Item Bag.');
                    return;
                }
                this.pathSettings[prop] = this.selectedAsset;
                label.textContent = this.selectedAsset.fileName;
            };
            document.getElementById(`dd-path-${kind}-clear`).onclick = () => {
                this.pathSettings[prop] = null;
                label.textContent = 'same as path';
            };
        };
        pieceButtons('end', 'endAsset');
        pieceButtons('corner', 'cornerAsset');
        document.getElementById('dd-path-place').onclick = () => this.finishPath();
        document.getElementById('dd-path-clear').onclick = () => { this.pathPoints = []; };
    },

    refreshDrawerCards() {
        let filtered = DocsDoodads.AssetIndex.list;
        if (/(^|\s)used:/i.test(this.searchQuery || '') && !DocsDoodads.Usage.lastIndex) this.refreshUsageIndex();
        if (this.currentCategory === 'Similar') {
            filtered = this.similarResults || [];
        } else if (this.currentCategory === 'Prefabs') {
            filtered = this.prefabAssets();
        } else if (this.currentCategory === 'Favorites') {
            filtered = filtered.filter(a => a.favorite);
        } else if (this.currentCategory === 'Recent') {
            filtered = filtered.filter(a => a.usage && a.usage.lastUsedAt > 0)
                               .sort((a, b) => (b.usage.lastUsedAt || 0) - (a.usage.lastUsedAt || 0));
        } else if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = DocsDoodads.Search.filter(filtered, this.searchQuery);
        // Recent and Look-alikes have their own order.
        if (this.currentCategory !== 'Recent' && this.currentCategory !== 'Similar') filtered = this.sortAssets(filtered, this.bagSort);
        // The bag opens on Doodads; a project without any (yet) opens on Everything instead.
        if (!this._categoryChosen && this.currentCategory === 'Doodads' && filtered.length === 0 && !this.searchQuery &&
            DocsDoodads.AssetIndex.list.length > 0 && !DocsDoodads.AssetIndex.list.some(a => a.category === 'Doodads')) {
            this._categoryChosen = true;
            this.setCategory('All');
            return;
        }
        this.filteredAssets = filtered;

        const countEl = document.getElementById('dd-asset-count');
        if (countEl) countEl.textContent = this.currentCategory === 'Similar' && this.similarSource
            ? `Most like ${this.similarSource}: ${filtered.length}` : `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
        const catEl = document.getElementById('dd-drawer-category');
        if (catEl) catEl.textContent = '· ' + this.categoryName(this.currentCategory);

        // Back to the top only for a new search or tab; a reload, favourite or save keeps the place.
        const view = `${this.currentCategory}|${this.searchQuery || ''}|${this.similarSource || ''}|${this.bagSort}`;
        const container = document.getElementById('dd-cards-container');
        if (container && view !== this._drawerView) container.scrollTop = 0;
        this._drawerView = view;

        this.updateVirtualGrid(true);
    },

    updateVirtualGrid(forceRecalculate = false) {
        const container = document.getElementById('dd-cards-container');
        const sizer = document.getElementById('dd-cards-sizer');
        const viewport = document.getElementById('dd-cards-viewport');
        if (!container || !sizer || !viewport) return;

        const assets = this.filteredAssets || [];
        const totalCount = assets.length;
        viewport.style.position = this.bagView === 'folders' && totalCount > 0 ? 'relative' : 'absolute';
        if (this.bagView === 'folders' && totalCount > 0) {
            // The folder tree is not windowed: folders start closed, and an open folder shows its items.
            sizer.style.height = 'auto';
            viewport.style.transform = '';
            viewport.style.gridTemplateColumns = '1fr';
            viewport.style.display = 'block';
            this._gridRange = null;
            this.renderFolderTree(viewport, assets, this.thumbSize || defaultThumbnailSize);
            return;
        }
        viewport.style.display = 'grid';
        if (totalCount === 0) {
            sizer.style.height = '0px';
            viewport.style.transform = '';
            viewport.style.gridTemplateColumns = '1fr';
            this._gridRange = null;
            this.renderEmptyBag(viewport);
            return;
        }

        const size = this.thumbSize || defaultThumbnailSize;
        const gap = 8;
        const containerW = Math.max(120, container.clientWidth - 8);
        // As many columns as cards of about the chosen size fit.
        const cols = Math.max(1, Math.round((containerW + gap) / (size + gap)));
        const colWidth = Math.floor((containerW - (cols - 1) * gap) / cols);
        const cardHeight = colWidth + 24;
        const rowHeight = cardHeight + gap;
        const totalRows = Math.ceil(totalCount / cols);
        const totalHeight = totalRows * rowHeight;

        sizer.style.height = totalHeight + 'px';
        viewport.style.gridTemplateColumns = `repeat(${cols}, ${colWidth}px)`;

        const scrollTop = container.scrollTop;
        const viewportH = container.clientHeight || 400;

        const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
        const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / rowHeight) + 2);

        const startIndex = startRow * cols;
        const endIndex = Math.min(totalCount, (endRow + 1) * cols);

        // Scrolling within the same rows changes nothing; the cards are only rebuilt for new rows.
        const range = `${startIndex}-${endIndex}-${cols}-${colWidth}-${totalCount}`;
        if (!forceRecalculate && range === this._gridRange && viewport.childNodes.length) return;
        this._gridRange = range;
        viewport.style.transform = `translateY(${startRow * rowHeight}px)`;
        viewport.innerHTML = '';

        for (let i = startIndex; i < endIndex; i++) {
            const asset = assets[i];
            const card = this.createCardElement(asset, cardHeight);
            viewport.appendChild(card);
        }
    },

    createCardElement(asset, cardHeight) {
        const card = document.createElement('div');
        card.className = 'dd-card' + (this.selectedAsset === asset ? ' selected' : '');
        card.style.cssText = `height: ${cardHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;`;

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width: 85%; max-height: 70%; object-fit: contain; image-rendering: pixelated;';
        DocsDoodads.Thumbnail.get(asset, this.thumbSize || 96, (dataUrl) => {
            imgEl.src = dataUrl;
        });
        card.appendChild(imgEl);
        this.attachThumbAnimation(card, imgEl, asset);
        if (card.addEventListener) {
            card.addEventListener('mouseenter', () => this.hoverCardEnter(asset, card));
            card.addEventListener('mouseleave', () => this.hoverCardLeave());
        }

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 10px; color: var(--dd-text); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 3px;';
        title.textContent = asset.fileName;
        card.appendChild(title);

        if (asset.favorite) {
            const favBadge = document.createElement('span');
            favBadge.className = 'dd-badge';
            favBadge.textContent = '★';
            card.appendChild(favBadge);
        }

        card.onclick = () => {
            this.hideHoverCard(true);
            this.selectAsset(asset);
            const container = document.getElementById('dd-cards-container');
            if (container) container.querySelectorAll('.dd-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            DocsDoodads.Ui.sound('cursor');
            if (asset.category === 'Audio') {
                DocsDoodads.Audio.playPreview(asset);
                const stopBtn = document.getElementById('dd-stop-audio-btn');
                if (stopBtn) stopBtn.style.display = 'inline-flex';
            }
        };

        card.ondblclick = () => {
            if (asset.category !== 'Audio' && asset.type !== 'prefab') {
                DocsDoodads.Slicing.Editor.open(asset);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            this.selectAsset(asset);
            if (asset.type === 'prefab') {
                this.showContextMenu(e.clientX, e.clientY, this.prefabMenuItems(asset));
                return;
            }
            const items = [
                { label: 'Place as Doodad', icon: '📌', onClick: () => this.placeAssetOnMapCenter(asset) },
                {
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: async () => {
                        const coords = this.clientToMapCoords(e.clientX, e.clientY);
                        const picked = document.getElementById('dd-event-template');
                        const values = await DocsDoodads.Ui.form({
                            title: 'Place as an event', text: `What should ${asset.fileName} do?`, ok: 'Place Event', icon: 'person',
                            fields: [{ key: 'template', type: 'select', label: 'Event template', value: (picked && picked.value) || 'npc',
                                options: Object.entries(DocsDoodads.EventTemplates.templates).map(([key, t]) => ({ value: key, label: t.name || key })) }]
                        });
                        if (!values || !this.mounted) return;
                        this.commitPlacement(asset, coords, 'event', values.template || 'npc');
                    }
                },
                { separator: true },
                {
                    label: asset.favorite ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: '★',
                    onClick: () => {
                        DocsDoodads.AssetIndex.toggleFavorite(asset.id);
                        this.refreshInspector();
                        this.refreshDrawerCards();
                    }
                },
                {
                    label: 'Add to Collection...',
                    icon: '📁',
                    onClick: async () => {
                        const existing = DocsDoodads.AssetIndex.getCollections().filter(name => !(asset.collections || []).includes(name));
                        const answer = await DocsDoodads.Ui.prompt(`Which collection should ${asset.fileName} go in? Type a new name or pick one.`,
                            this.searchCollection() || existing[0] || 'Custom Collection',
                            { title: 'Add to collection', ok: 'Add', icon: 'folder', choices: existing, placeholder: 'Castle Set' });
                        // Quotes would break the collection:"..." search term.
                        const colName = String(answer || '').replace(/["']/g, '').trim();
                        if (colName) {
                            DocsDoodads.AssetIndex.addAssetToCollection(asset.id, colName);
                            this.refreshCollectionPicker();
                            this.refreshDrawerCards();
                            this.showToast(`Added ${asset.fileName} to "${colName}"!`);
                        }
                    }
                },
                ...(/^img\//i.test(String(asset.path || '').replace(/\\/g, '/')) ? [{
                    label: 'Replace Art on Maps...', icon: '🔁', onClick: () => this.showReplaceArt(asset.path)
                }] : []),
                ...(asset.collections || []).map(name => ({
                    label: `Remove from "${name}"`,
                    icon: '📂',
                    onClick: () => {
                        DocsDoodads.AssetIndex.removeAssetFromCollection(asset.id, name);
                        this.refreshCollectionPicker();
                        this.refreshDrawerCards();
                        this.showToast(`Removed ${asset.fileName} from "${name}".`);
                    }
                })),
                { separator: true }
            ];
            if (asset.category !== 'Audio') {
                items.push({ label: 'Open in Slicing Modal', icon: '✂️', onClick: () => DocsDoodads.Slicing.Editor.open(asset) });
                items.push({ label: 'Export Slices to PNGs', icon: '💾', onClick: () => DocsDoodads.Export.exportSlices(asset) });
            } else {
                items.push({ label: 'Play Audio Preview', icon: '▶️', onClick: () => DocsDoodads.Audio.playPreview(asset) });
                items.push({ label: 'Stop Audio', icon: '⏹', onClick: () => DocsDoodads.Audio.stopPreview() });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        card.draggable = true;
        card.ondragstart = (e) => {
            if (asset.type === 'prefab') {
                this.activeDragPayload = { type: 'prefab', prefabId: asset.prefabId, path: asset.path, fileName: asset.fileName, category: 'Prefabs' };
                e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
                return;
            }
            this.activeDragPayload = {
                assetId: asset.id,
                path: asset.path,
                fileName: asset.fileName,
                category: asset.category,
                type: asset.type,
                frameW: asset.width || 48,
                frameH: asset.height || 48,
                collision: asset.collision || { preset: "none" },
                characterIndex: asset.placement.characterIndex || 0,
                depth: asset.placement.depth,
                tags: asset.tags || [],
                autoTags: asset.autoTags || [],
                placementMode: asset.placement.defaultMode || (asset.type === 'character_sheet' ? 'event' : 'ask')
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
        };

        card.ondragend = () => {
            this.removeGhost();
        };

        return card;
    },

    selectEvent(evInfo) {
        this.selectedEvent = evInfo;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedAsset = null;
        this.refreshInspector();
    },

