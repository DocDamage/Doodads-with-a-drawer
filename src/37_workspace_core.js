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
    currentCategory: 'All',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25, minDistance: 32, flipChance: 0.5, hueJitter: 0, regions: '', terrainTags: '', avoidBlocked: false },
    activeDragPayload: null,
    ghostEl: null,
    isBrushActive: false,
    currentBrushBatch: [],
    gridSnapShow: false,
    _clipboardDoodads: [],
    selectedDoodads: [],

    toggle() {
        if (this.mounted) this.close(); else this.open();
    },

    // One placement tool at a time; keeps the toolbar highlight and brush popover in sync.
    setPlacementTool(tool) {
        this.placementTool = tool || null;
        const buttons = { eyedropper: 'dd-eyedropper-btn', stamp: 'dd-stamp-btn', brush: 'dd-brush-btn', path: 'dd-path-btn', biome: 'dd-biome-btn' };
        for (const [name, id] of Object.entries(buttons)) {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('dd-btn-active', this.placementTool === name);
        }
        const brushPopover = document.getElementById('dd-brush-popover');
        if (brushPopover) brushPopover.style.display = this.placementTool === 'brush' ? 'block' : 'none';
        const pathPopover = document.getElementById('dd-path-popover');
        if (pathPopover) pathPopover.style.display = this.placementTool === 'path' ? 'block' : 'none';
        const biomePopover = document.getElementById('dd-biome-popover');
        if (biomePopover) biomePopover.style.display = this.placementTool === 'biome' ? 'block' : 'none';
        const terrainPopover = document.getElementById('dd-terrain-popover');
        if (terrainPopover) terrainPopover.style.display = this.placementTool === 'terrain' ? 'block' : 'none';
        if (this.placementTool === 'biome') this.refreshBiomeToolPicker();
        if (this.placementTool !== 'path') {
            this.pathPoints = [];
            this._pathHover = null;
        }
    },

    open() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs() || this.mounted) return;
        DocsDoodads.Persistence.captureSession();
        DocsDoodads.AssetIndex.init();
        this.buildDom();
        this.attachCanvasListeners();
        this._onWindowResize = () => this.layoutPanels();
        window.addEventListener('resize', this._onWindowResize);
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = true;
        }
        this.startAssetScan();
        DocsDoodads.LiveReload.start();
        this.showRecoveryNotices();

        // Check for recovery file
        const recovery = DocsDoodads.Persistence.recoverableSnapshot();
        if (recovery) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            DocsDoodads.Persistence.markRecoveryAnswered(recovery);
            if (confirm(`Unfinished session from ${dateStr} found. Would you like to recover it?`)) {
                this.applyRecovery(recovery);
                this.showToast(recovery.mapId && recovery.mapId !== this.currentMapId()
                    ? `Session recovered into map ${recovery.mapId}.` : "Session Recovered!");
            }
        }
    },

    close() {
        if (!this.mounted) return;
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        this.detachCanvasListeners();
        if (this._onWindowResize) window.removeEventListener('resize', this._onWindowResize);
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
        // The undo history floats on the page too (it isn't a glass panel).
        const history = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-undo-history') : null;
        if (history && history.parentNode) history.parentNode.removeChild(history);
        this._undoHistoryOpen = false;
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
        if (Array.isArray(recovery.doodads)) {
            data[mapId] = recovery.doodads;
            DocsDoodads.Persistence.dirtyDoodads = true;
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
        const result = await DocsDoodads.AssetIndex.scanAsync({
            loadCache: false,
            cancellationToken: token,
            onProgress: progress => {
                if (status && !token.cancelled) status.textContent = `Indexing assets ${progress.completed}/${progress.total}`;
            }
        });
        if (this._assetScanToken !== token || token.cancelled || result.cancelled) return result;
        this._assetScanToken = null;
        if (this.mounted) {
            this.refreshDrawerCards();
            this.updateIndexStatus(result.removed);
            if (result.errors.length > 0) this.showToast(`Asset scan completed with ${result.errors.length} warning(s).`);
        }
        return result;
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'dd-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #dd-asset-workspace-root * { box-sizing: border-box; }
            .dd-glass {
                background: rgba(17, 24, 39, 0.92);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65);
                pointer-events: auto;
                /* Panels appended to the page (Asset Tools, Post FX) sit outside the workspace root. */
                font-family: 'Segoe UI', Roboto, sans-serif;
            }
            .dd-btn {
                background: #1f2937; color: #f1f5f9; border: 1px solid #374151;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .dd-btn:hover { background: #374151; border-color: #60a5fa; }
            #dd-category-tabs .dd-btn { padding: 4px 8px; font-size: 11px; white-space: nowrap; }
            #dd-toolbar .dd-btn { padding: 5px 8px; white-space: nowrap; }
            #dd-toolbar > div { flex-wrap: wrap; row-gap: 6px; }
            .dd-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .dd-btn-primary:hover { background: #1d4ed8; }
            .dd-btn-active { background: #059669 !important; border-color: #10b981 !important; color: #fff !important; }
            .dd-card {
                background: #18202f; border: 1px solid #283548; border-radius: 6px;
                cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, border-color 0.15s;
            }
            .dd-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
            .dd-card.selected { border: 2px solid #60a5fa; background: #1e293b; }
            .dd-badge {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75);
                padding: 2px 5px; border-radius: 3px; font-size: 10px; color: #93c5fd;
            }
        `;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'dd-glass';
        toolbar.id = 'dd-toolbar';
        toolbar.style.cssText = `
            position: absolute; top: 10px; left: 10px; right: 10px; min-height: 50px; gap: 6px 10px;
            display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 6px 12px;
        `;
        toolbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">DOC'S DOODADS</span>
                <input type="text" id="dd-search-input" placeholder="Search (e.g. tree tag:prop -dead)"
                    style="width: 200px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="dd-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;"></select>
                <button class="dd-btn" id="dd-save-layout-btn" title="Save current panel sizes as custom layout">+ Layout</button>
                <button class="dd-btn" id="dd-del-layout-btn" title="Delete current custom layout" style="display: none; background: #7f1d1d; border-color: #991b1b; padding: 4px 8px;">✕</button>
                <button class="dd-btn" id="dd-undo-btn">Undo</button>
                <button class="dd-btn" id="dd-redo-btn">Redo</button>
                <button class="dd-btn" id="dd-undo-list-btn" title="Undo history: step back to any point">☰</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="dd-btn" id="dd-eyedropper-btn" title="Eyedropper: Alt+Click map object">Eyedropper</button>
                <button class="dd-btn" id="dd-stamp-btn" title="Stamp: Click repeatedly to place">Stamp</button>
                <button class="dd-btn" id="dd-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <div id="dd-brush-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BRUSH SETTINGS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Radius:</span><span id="dd-brush-rad-val">80px</span>
                            </div>
                            <input type="range" id="dd-brush-rad" min="20" max="250" value="80" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Density:</span><span id="dd-brush-den-val">3</span>
                            </div>
                            <input type="range" id="dd-brush-den" min="1" max="10" value="3" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Scale Variation:</span><span id="dd-brush-scale-val">15%</span>
                            </div>
                            <input type="range" id="dd-brush-scale" min="0" max="50" value="15" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Rotation Variation:</span><span id="dd-brush-rot-val">25°</span>
                            </div>
                            <input type="range" id="dd-brush-rot" min="0" max="180" value="25" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Min Spacing:</span><span id="dd-brush-min-val">32px</span>
                            </div>
                            <input type="range" id="dd-brush-min" min="0" max="160" value="32" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Flip Chance:</span><span id="dd-brush-flip-val">50%</span>
                            </div>
                            <input type="range" id="dd-brush-flip" min="0" max="100" value="50" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Hue Variation:</span><span id="dd-brush-hue-val">0°</span>
                            </div>
                            <input type="range" id="dd-brush-hue" min="0" max="90" value="0" style="width: 100%;" />
                        </div>
                        <div style="color: #94a3b8;">Only on regions (e.g. 1, 2):
                            <input type="text" id="dd-brush-regions" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <div style="color: #94a3b8;">Only on terrain tags:
                            <input type="text" id="dd-brush-terrain" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-brush-avoid" /> Skip impassable tiles</label>
                    </div>
                </div>
                <button class="dd-btn" id="dd-biome-btn" title="Biome brush: paint a mix of props (set up biomes in the map panel)">Biome</button>
                <div id="dd-biome-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BIOME BRUSH</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: #94a3b8;">
                        <select id="dd-biome-tool-pick" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;"></select>
                        <div>Radius: <span id="dd-biome-rad-val">96px</span><input type="range" id="dd-biome-rad" min="24" max="320" value="96" style="width: 100%;" /></div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-biome-avoid" checked /> Skip impassable tiles</label>
                        <div style="line-height: 1.4;">Drag on the map. Each biome's mix, spacing, edge thinning and patchiness are set in the map panel under Biomes.</div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-terrain-btn" title="Terrain: paint ground heights for the 3D view">Terrain</button>
                <div id="dd-terrain-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">TERRAIN BRUSH</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: #94a3b8;">
                        <select id="dd-terrain-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;"></select>
                        <div>Strength: <span id="dd-terrain-amount-val">0.5</span> tiles<input type="range" id="dd-terrain-amount" min="0.1" max="3" step="0.1" value="0.5" style="width: 100%;" /></div>
                        <div>Radius: <span id="dd-terrain-radius-val">1</span> tiles<input type="range" id="dd-terrain-radius" min="0" max="6" step="1" value="1" style="width: 100%;" /></div>
                        <label>Height for Set (tiles) <input type="number" step="0.25" id="dd-terrain-value" value="1" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" /></label>
                        <div style="line-height: 1.4;">Drag on the map. Each stroke is one undo step. Heights show in the 3D view; painting turns Terrain Height on for the map.</div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-sym-btn" title="Symmetry: mirror placements">Symmetry</button>
                <div id="dd-sym-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">SYMMETRY</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: #94a3b8;">
                        <select id="dd-sym-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;"></select>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                            <label>Axis X (tile)<input type="number" step="0.5" id="dd-sym-x" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" /></label>
                            <label>Axis Y (tile)<input type="number" step="0.5" id="dd-sym-y" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" /></label>
                        </div>
                        <button class="dd-btn" id="dd-sym-center">Centre of Map</button>
                        <div style="line-height: 1.4;">Stamps, the scatter brush and the biome brush place mirrored copies too.</div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-path-btn" title="Path: click points, double-click or Enter to place props along them">Path</button>
                <div id="dd-path-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 250px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 6px;">PATH TOOL</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px; line-height: 1.4;">Click to add points. Double-click or Enter places the selected asset along them; Backspace removes the last point; Alt for off-grid points.</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Spacing:</span><span id="dd-path-spacing-val">48px</span></div>
                            <input type="range" id="dd-path-spacing" min="8" max="240" value="48" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Random Offset:</span><span id="dd-path-jitter-val">0px</span></div>
                            <input type="range" id="dd-path-jitter" min="0" max="24" value="0" style="width: 100%;" />
                        </div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-align" /> Turn pieces along the path</label>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-smooth" /> Smooth curve</label>
                        <div style="color: #94a3b8;">End piece: <span id="dd-path-end-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-end-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-end-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="color: #94a3b8;">Corner piece: <span id="dd-path-corner-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-corner-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-corner-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="display: flex; gap: 4px; margin-top: 4px;"><button class="dd-btn dd-btn-primary" id="dd-path-place" style="flex: 1;">Place Path</button><button class="dd-btn" id="dd-path-clear">Clear Points</button></div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-slicer-btn" title="Open Interactive Sprite Sheet Slicer">Slicer Modal</button>
                <button class="dd-btn" id="dd-stop-audio-btn" style="display: none; background: #be123c; border-color: #f43f5e;">⏹ Stop Audio</button>
                <button class="dd-btn" id="dd-tools-btn" title="Find duplicate and unused files">Asset Tools</button>
                <button class="dd-btn" id="dd-postfx-btn" title="Post-processing looks, screen effects and map image export">Post FX</button>
                <button class="dd-btn" id="dd-vfx-btn" title="Build particle and sprite-sheet effects">VFX</button>
                <button class="dd-btn" id="dd-history-btn" title="Compare with backups and restore single doodads or events">History</button>
                <button class="dd-btn" id="dd-diag-btn" title="Diagnostics">Diagnostics</button>
                <button class="dd-btn dd-btn-primary" id="dd-save-btn">Save Changes</button>
                <button class="dd-btn" id="dd-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'dd-glass';
        drawer.id = 'dd-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 70px; left: 10px; bottom: 32px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div id="dd-drawer-resizer" style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Drawer"></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; flex-wrap: wrap; gap: 4px;" id="dd-category-tabs">
                <button class="dd-btn dd-btn-primary" data-cat="All">All</button>
                <button class="dd-btn" data-cat="Characters">Characters</button>
                <button class="dd-btn" data-cat="Doodads">Doodads</button>
                <button class="dd-btn" data-cat="Tilesets">Tiles</button>
                <button class="dd-btn" data-cat="Pictures">Pictures</button>
                <button class="dd-btn" data-cat="Faces">Faces</button>
                <button class="dd-btn" data-cat="Battlers">Battlers</button>
                <button class="dd-btn" data-cat="Backgrounds">Backgrounds</button>
                <button class="dd-btn" data-cat="System">System</button>
                <button class="dd-btn" data-cat="Audio">Audio</button>
                <button class="dd-btn" data-cat="Prefabs" title="Saved prefabs: groups of doodads and events">Prefabs</button>
                <button class="dd-btn" data-cat="Favorites" title="Show Favorited Assets">★ Favs</button>
                <button class="dd-btn" data-cat="Recent" title="Show Recently Used Assets">🕒 Recent</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="dd-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="dd-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="dd-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; position: relative;">
                <div id="dd-cards-sizer" style="width: 100%; position: relative;">
                    <div id="dd-cards-viewport" style="position: absolute; top: 0; left: 0; right: 0; display: grid; gap: 8px;">
                    </div>
                </div>
            </div>
        `;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'dd-glass';
        inspector.id = 'dd-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 70px; right: 10px; bottom: 32px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        `;
        inspector.innerHTML = `
            <div id="dd-inspector-resizer" style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Inspector"></div>
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="dd-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or click a placed doodad/event on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'dd-glass';
        statusBar.style.cssText = `
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 24px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        `;
        statusBar.innerHTML = `
            <span id="dd-status-left">Doc's Doodads v${pluginVersion} Ready | Hold Alt for free placement</span>
            <span id="dd-status-right">Map ID: ${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        `;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.layoutPanels();
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    // The toolbar wraps onto more rows in narrow windows; the side panels start just below it.
    layoutPanels() {
        const toolbar = document.getElementById('dd-toolbar');
        if (!toolbar) return;
        const top = (toolbar.offsetTop || 10) + (toolbar.offsetHeight || 50) + 10;
        for (const id of ['dd-drawer-panel', 'dd-inspector-panel']) {
            const panel = document.getElementById(id);
            if (panel) panel.style.top = top + 'px';
        }
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

    bindEvents() {
        document.getElementById('dd-close-btn').onclick = () => this.close();
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
            saveLayoutBtn.onclick = () => {
                const name = prompt("Enter a name for this custom layout:", "Custom Layout " + (Object.keys(DocsDoodads.Layout.custom).length + 1));
                if (name && name.trim()) {
                    DocsDoodads.Layout.saveCurrentAs(name.trim());
                    this.refreshLayoutSelector();
                    this.showToast(`Saved layout "${name.trim()}"!`);
                }
            };
        }

        const delLayoutBtn = document.getElementById('dd-del-layout-btn');
        if (delLayoutBtn) {
            delLayoutBtn.onclick = () => {
                const cur = DocsDoodads.Layout.current;
                if (confirm(`Delete custom layout "${cur}"?`)) {
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
                    const newW = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
                    this.drawerEl.style.width = newW + 'px';
                    this.updateVirtualGrid(true);
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
                    const newW = Math.max(200, Math.min(600, startWidth - (ev.clientX - startX)));
                    this.inspectorEl.style.width = newW + 'px';
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
        };

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
            if (e.target.dataset.cat) {
                catTabs.querySelectorAll('button').forEach(b => b.className = 'dd-btn');
                e.target.className = 'dd-btn dd-btn-primary';
                this.currentCategory = e.target.dataset.cat;
                this.refreshDrawerCards();
            }
        };

        document.getElementById('dd-slicer-btn').onclick = () => {
            if (this.selectedAsset) DocsDoodads.Slicing.Editor.open(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
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

        document.getElementById('dd-eyedropper-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'eyedropper' ? null : 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper Active: Click any object on map" : "Eyedropper Deactivated");
        };
        document.getElementById('dd-stamp-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'stamp' ? null : 'stamp');
            this.showToast(this.placementTool ? "Stamp Active: Click map to place repeatedly" : "Stamp Deactivated");
        };
        document.getElementById('dd-brush-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'brush' ? null : 'brush');
            this.showToast(this.placementTool ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
        };

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

        document.getElementById('dd-path-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'path' ? null : 'path');
            this.showToast(this.placementTool ? "Path Active: click points on the map" : "Path Deactivated");
        };
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
                    this.showToast('Select an image asset in the drawer first.');
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
        this.filteredAssets = filtered;

        const countEl = document.getElementById('dd-asset-count');
        if (countEl) countEl.textContent = this.currentCategory === 'Similar' && this.similarSource
            ? `Most like ${this.similarSource}: ${filtered.length}` : `Assets: ${filtered.length}`;

        const container = document.getElementById('dd-cards-container');
        if (container) container.scrollTop = 0;

        this.updateVirtualGrid(true);
    },

    updateVirtualGrid(forceRecalculate = false) {
        const container = document.getElementById('dd-cards-container');
        const sizer = document.getElementById('dd-cards-sizer');
        const viewport = document.getElementById('dd-cards-viewport');
        if (!container || !sizer || !viewport) return;

        const assets = this.filteredAssets || [];
        const totalCount = assets.length;
        if (totalCount === 0) {
            sizer.style.height = '0px';
            viewport.innerHTML = '<div style="color: #64748b; font-size: 12px; padding: 16px; text-align: center;">No matching assets found.</div>';
            return;
        }

        const size = this.thumbSize || defaultThumbnailSize;
        const gap = 8;
        const containerW = Math.max(120, container.clientWidth - 20);
        const cols = Math.max(1, Math.floor((containerW + gap) / (size + gap)));
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

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 3px;';
        title.textContent = asset.fileName;
        card.appendChild(title);

        if (asset.favorite) {
            const favBadge = document.createElement('span');
            favBadge.className = 'dd-badge';
            favBadge.textContent = '★';
            favBadge.style.color = '#fbbf24';
            card.appendChild(favBadge);
        }

        card.onclick = () => {
            this.selectAsset(asset);
            const container = document.getElementById('dd-cards-container');
            if (container) container.querySelectorAll('.dd-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (asset.category === 'Audio') {
                DocsDoodads.Audio.playPreview(asset);
                const stopBtn = document.getElementById('dd-stop-audio-btn');
                if (stopBtn) stopBtn.style.display = 'block';
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
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: () => {
                        const templateKey = prompt("Enter Template Key (e.g. npc, door, chest, signpost, switch, save_point):", "npc") || "npc";
                        const prev = document.getElementById('dd-event-template');
                        if (prev) prev.value = templateKey;
                        this.commitPlacement(asset, this.clientToMapCoords(e.clientX, e.clientY), 'event');
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
                    onClick: () => {
                        const colName = prompt("Enter Collection Name (e.g. Castle Set, Forest Props):", "Custom Collection");
                        if (colName && colName.trim()) {
                            DocsDoodads.AssetIndex.addAssetToCollection(asset.id, colName.trim());
                            this.showToast(`Added ${asset.fileName} to "${colName.trim()}"!`);
                        }
                    }
                },
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

    selectedDoodads: [],

    selectEvent(evInfo) {
        this.selectedEvent = evInfo;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedAsset = null;
        this.refreshInspector();
    },

