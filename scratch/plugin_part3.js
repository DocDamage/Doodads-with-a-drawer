
//==========================================================
// SECTION 24: QJ.DD.WORKSPACE (GLASSMORPHIC WORKSPACE UI & TOOLS)
//==========================================================
QJ.DD.Workspace = {
    mounted: false,
    container: null,
    drawerEl: null,
    inspectorEl: null,
    selectedAsset: null,
    selectedDoodad: null,
    selectedEvent: null,
    currentCategory: 'All',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25 },
    activeDragPayload: null,
    ghostEl: null,
    isBrushActive: false,
    currentBrushBatch: [],

    toggle() {
        if (this.mounted) this.close(); else this.open();
    },

    open() {
        if (!editorMode || this.mounted) return;
        QJ.DD.Persistence.captureSession();
        QJ.DD.AssetIndex.scan();
        this.buildDom();
        this.attachCanvasListeners();
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = true;
        }

        // Check for recovery file
        const recovery = QJ.DD.FS.readJson('data/QJAssetWorkspaceRecovery.json');
        if (recovery && recovery.timestamp && (Date.now() - recovery.timestamp) < 86400000) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            if (confirm(`Unfinished session from ${dateStr} found. Would you like to recover it?`)) {
                if (recovery.doodads && window.$gameMap) {
                    window.$dataDoodadsQJ[$gameMap.mapId()] = recovery.doodads;
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                }
                this.showToast("Session Recovered!");
            }
        }
    },

    close() {
        if (!this.mounted) return;
        this.detachCanvasListeners();
        this.removeGhost();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.doodadsQJ) {
            window.$gameSystem.doodadsQJ.editing = false;
        }
        this.placementTool = null;
        QJ.DD.Audio.stopPreview();
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'qj-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #qj-asset-workspace-root * { box-sizing: border-box; }
            .qj-glass {
                background: rgba(17, 24, 39, 0.92);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65);
                pointer-events: auto;
            }
            .qj-btn {
                background: #1f2937; color: #f1f5f9; border: 1px solid #374151;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .qj-btn:hover { background: #374151; border-color: #60a5fa; }
            .qj-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .qj-btn-primary:hover { background: #1d4ed8; }
            .qj-btn-active { background: #059669 !important; border-color: #10b981 !important; color: #fff !important; }
            .qj-card {
                background: #18202f; border: 1px solid #283548; border-radius: 6px;
                cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, border-color 0.15s;
            }
            .qj-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
            .qj-card.selected { border: 2px solid #60a5fa; background: #1e293b; }
            .qj-badge {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75);
                padding: 2px 5px; border-radius: 3px; font-size: 10px; color: #93c5fd;
            }
        `;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'qj-glass';
        toolbar.style.cssText = `
            position: absolute; top: 10px; left: 10px; right: 10px; height: 50px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
        `;
        toolbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">QJ WORKSPACE</span>
                <input type="text" id="qj-search-input" placeholder="Search (e.g. tree tag:prop -dead)"
                    style="width: 240px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="qj-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    <option value="Mapping">Layout: Mapping</option>
                    <option value="Events">Layout: Events</option>
                    <option value="Characters">Layout: Characters</option>
                    <option value="Tiles">Layout: Tiles</option>
                    <option value="Compact">Layout: Compact</option>
                </select>
                <button class="qj-btn" id="qj-undo-btn">Undo</button>
                <button class="qj-btn" id="qj-redo-btn">Redo</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="qj-btn" id="qj-eyedropper-btn" title="Eyedropper: Alt+Click map object">Eyedropper</button>
                <button class="qj-btn" id="qj-stamp-btn" title="Stamp: Click repeatedly to place">Stamp</button>
                <button class="qj-btn" id="qj-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <button class="qj-btn" id="qj-slicer-btn" title="Open Interactive Sprite Sheet Slicer">Slicer Modal</button>
                <button class="qj-btn" id="qj-stop-audio-btn" style="display: none; background: #be123c; border-color: #f43f5e;">⏹ Stop Audio</button>
                <button class="qj-btn" id="qj-diag-btn" title="Diagnostics">Diagnostics</button>
                <button class="qj-btn qj-btn-primary" id="qj-save-btn">Save Changes</button>
                <button class="qj-btn" id="qj-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'qj-glass';
        drawer.id = 'qj-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 70px; left: 10px; bottom: 32px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px; overflow-x: auto;" id="qj-category-tabs">
                <button class="qj-btn qj-btn-primary" data-cat="All">All</button>
                <button class="qj-btn" data-cat="Characters">Characters</button>
                <button class="qj-btn" data-cat="Doodads">Doodads</button>
                <button class="qj-btn" data-cat="Tilesets">Tiles</button>
                <button class="qj-btn" data-cat="Pictures">Pictures</button>
                <button class="qj-btn" data-cat="Audio">Audio</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="qj-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="qj-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="qj-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(${defaultThumbnailSize}px, 1fr)); gap: 8px;">
            </div>
        `;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'qj-glass';
        inspector.id = 'qj-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 70px; right: 10px; bottom: 32px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        `;
        inspector.innerHTML = `
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="qj-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or click a placed doodad/event on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'qj-glass';
        statusBar.style.cssText = `
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 24px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        `;
        statusBar.innerHTML = `
            <span id="qj-status-left">QJ Doodads Asset Workspace v${pluginVersion} Ready | Hold Alt for free placement</span>
            <span id="qj-status-right">Map ID: ${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        `;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.refreshDrawerCards();
    },

    bindEvents() {
        document.getElementById('qj-close-btn').onclick = () => this.close();
        document.getElementById('qj-save-btn').onclick = () => QJ.DD.Persistence.saveAll();
        document.getElementById('qj-undo-btn').onclick = () => QJ.DD.Undo.undo();
        document.getElementById('qj-redo-btn').onclick = () => QJ.DD.Undo.redo();

        const layoutSel = document.getElementById('qj-layout-select');
        layoutSel.value = QJ.DD.Layout.current;
        layoutSel.onchange = (e) => QJ.DD.Layout.apply(e.target.value);

        const searchInput = document.getElementById('qj-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
        };

        const zoomSlider = document.getElementById('qj-thumb-zoom');
        zoomSlider.oninput = (e) => {
            const size = e.target.value;
            const container = document.getElementById('qj-cards-container');
            container.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
        };

        const catTabs = document.getElementById('qj-category-tabs');
        catTabs.onclick = (e) => {
            if (e.target.dataset.cat) {
                catTabs.querySelectorAll('button').forEach(b => b.className = 'qj-btn');
                e.target.className = 'qj-btn qj-btn-primary';
                this.currentCategory = e.target.dataset.cat;
                this.refreshDrawerCards();
            }
        };

        document.getElementById('qj-slicer-btn').onclick = () => {
            if (this.selectedAsset) QJ.DD.Slicing.Editor.open(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
        };

        document.getElementById('qj-diag-btn').onclick = () => this.openDiagnosticsModal();

        document.getElementById('qj-stop-audio-btn').onclick = () => {
            QJ.DD.Audio.stopPreview();
            document.getElementById('qj-stop-audio-btn').style.display = 'none';
        };

        const eyeBtn = document.getElementById('qj-eyedropper-btn');
        eyeBtn.onclick = () => {
            this.placementTool = this.placementTool === 'eyedropper' ? null : 'eyedropper';
            eyeBtn.classList.toggle('qj-btn-active', this.placementTool === 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper Active: Click any object on map" : "Eyedropper Deactivated");
        };

        const stampBtn = document.getElementById('qj-stamp-btn');
        stampBtn.onclick = () => {
            this.placementTool = this.placementTool === 'stamp' ? null : 'stamp';
            stampBtn.classList.toggle('qj-btn-active', this.placementTool === 'stamp');
            this.showToast(this.placementTool ? "Stamp Active: Click map to place repeatedly" : "Stamp Deactivated");
        };

        const brushBtn = document.getElementById('qj-brush-btn');
        brushBtn.onclick = () => {
            this.placementTool = this.placementTool === 'brush' ? null : 'brush';
            brushBtn.classList.toggle('qj-btn-active', this.placementTool === 'brush');
            this.showToast(this.placementTool ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
        };
    },

    refreshDrawerCards() {
        const container = document.getElementById('qj-cards-container');
        if (!container) return;
        container.innerHTML = '';

        let filtered = QJ.DD.AssetIndex.list;
        if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = QJ.DD.Search.filter(filtered, this.searchQuery);

        document.getElementById('qj-asset-count').textContent = `Assets: ${filtered.length}`;

        for (let i = 0; i < Math.min(filtered.length, 300); i++) {
            const asset = filtered[i];
            const card = document.createElement('div');
            card.className = 'qj-card' + (this.selectedAsset === asset ? ' selected' : '');
            card.style.cssText = `height: 104px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;`;

            const imgEl = document.createElement('img');
            imgEl.style.cssText = 'max-width: 80%; max-height: 68px; object-fit: contain; image-rendering: pixelated;';
            QJ.DD.Thumbnail.get(asset, 96, (dataUrl) => {
                imgEl.src = dataUrl;
            });
            card.appendChild(imgEl);

            const title = document.createElement('div');
            title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 4px;';
            title.textContent = asset.fileName;
            card.appendChild(title);

            if (asset.favorite) {
                const favBadge = document.createElement('span');
                favBadge.className = 'qj-badge';
                favBadge.textContent = '★';
                favBadge.style.color = '#fbbf24';
                card.appendChild(favBadge);
            }

            card.onclick = () => {
                this.selectAsset(asset);
                container.querySelectorAll('.qj-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                if (asset.category === 'Audio') {
                    QJ.DD.Audio.playPreview(asset);
                    const stopBtn = document.getElementById('qj-stop-audio-btn');
                    if (stopBtn) stopBtn.style.display = 'block';
                }
            };

            // Double click opens Slicer for visual sheets
            card.ondblclick = () => {
                if (asset.category !== 'Audio') {
                    QJ.DD.Slicing.Editor.open(asset);
                }
            };

            // Drag to map
            card.draggable = true;
            card.ondragstart = (e) => {
                this.activeDragPayload = {
                    assetId: asset.id,
                    path: asset.path,
                    fileName: asset.fileName,
                    category: asset.category,
                    type: asset.type,
                    frameW: asset.width || 48,
                    frameH: asset.height || 48,
                    collision: asset.collision || { preset: "none" },
                    placementMode: asset.placement.defaultMode || (asset.type === 'character_sheet' ? 'event' : 'ask')
                };
                e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
            };

            card.ondragend = () => {
                this.removeGhost();
            };

            container.appendChild(card);
        }
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        this.selectedDoodad = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodad(doodad) {
        this.selectedDoodad = doodad;
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    refreshInspector() {
        const content = document.getElementById('qj-inspector-content');
        if (!content) return;

        // Case 1: Placed Doodad Selected
        if (this.selectedDoodad) {
            const d = this.selectedDoodad;
            content.innerHTML = `
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">PLACED DOODAD PROPERTIES</div>
                <div style="font-size: 11px; margin-bottom: 4px;">Image: <span style="color: #fff;">${d.bit ? d.bit[1] : 'Unknown'}</span></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">X:</label>
                        <input type="number" id="qj-prop-x" value="${d.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Y:</label>
                        <input type="number" id="qj-prop-y" value="${d.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Z-Order:</label>
                        <input type="number" id="qj-prop-z" value="${d.z || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Rotation (°):</label>
                        <input type="number" id="qj-prop-rot" value="${d.rotation || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale X:</label>
                        <input type="number" step="0.1" id="qj-prop-sx" value="${d.scaleX || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale Y:</label>
                        <input type="number" step="0.1" id="qj-prop-sy" value="${d.scaleY || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                    <select id="qj-prop-col" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                        <option value="none">None (Passable)</option>
                        <option value="full">Full Bounds</option>
                        <option value="bottomHalf">Bottom Half</option>
                        <option value="bottomThird">Bottom Third</option>
                        <option value="trunk">Tree Trunk</option>
                        <option value="thinWall">Thin Wall</option>
                        <option value="wideWall">Wide Wall</option>
                    </select>
                </div>
                <div style="display: flex; gap: 6px; margin-top: 12px;">
                    <button class="qj-btn" id="qj-prop-forward" style="flex: 1;">Bring Forward</button>
                    <button class="qj-btn" id="qj-prop-backward" style="flex: 1;">Send Back</button>
                </div>
                <div style="display: flex; gap: 6px; margin-top: 6px;">
                    <button class="qj-btn" id="qj-prop-dup" style="flex: 1;">Duplicate (Ctrl+D)</button>
                    <button class="qj-btn" id="qj-prop-del" style="flex: 1; background: #991b1b;">Delete</button>
                </div>
            `;

            document.getElementById('qj-prop-col').value = (d.collision && d.collision.preset) ? d.collision.preset : "none";
            document.getElementById('qj-prop-col').onchange = (e) => {
                d.collision = { preset: e.target.value, shape: null };
            };

            const applyDoodadInputs = () => {
                d.x = parseInt(document.getElementById('qj-prop-x').value, 10) || 0;
                d.y = parseInt(document.getElementById('qj-prop-y').value, 10) || 0;
                d.z = parseInt(document.getElementById('qj-prop-z').value, 10) || 0;
                d.rotation = parseInt(document.getElementById('qj-prop-rot').value, 10) || 0;
                d.scaleX = parseFloat(document.getElementById('qj-prop-sx').value) || 1;
                d.scaleY = parseFloat(document.getElementById('qj-prop-sy').value) || 1;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
            };

            ['qj-prop-x','qj-prop-y','qj-prop-z','qj-prop-rot','qj-prop-sx','qj-prop-sy'].forEach(id => {
                document.getElementById(id).onchange = applyDoodadInputs;
            });

            document.getElementById('qj-prop-forward').onclick = () => {
                d.z = (d.z || 0) + 1;
                document.getElementById('qj-prop-z').value = d.z;
                if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.sortDoodadsQJ();
            };
            document.getElementById('qj-prop-backward').onclick = () => {
                d.z = (d.z || 0) - 1;
                document.getElementById('qj-prop-z').value = d.z;
                if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.sortDoodadsQJ();
            };
            document.getElementById('qj-prop-dup').onclick = () => {
                this.duplicateSelectedDoodad();
            };
            document.getElementById('qj-prop-del').onclick = () => {
                this.deleteSelectedDoodad();
            };
            return;
        }

        // Case 2: Drawer Asset Selected
        if (!this.selectedAsset) {
            content.innerHTML = "Select an asset in the drawer or click an object on the map.";
            return;
        }

        const a = this.selectedAsset;
        const templates = QJ.DD.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += `<option value="${key}">${templates[key].name}</option>`;
        }

        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${a.fileName}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">${a.category}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: ${a.width} x ${a.height}</div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="qj-btn" id="qj-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="qj-place-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                    <option value="ask">Ask Each Time</option>
                </select>
            </div>
            <div id="qj-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="qj-event-template" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${templateOptions}
                </select>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                <select id="qj-col-preset" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="none">None (Passable)</option>
                    <option value="full">Full Bounds</option>
                    <option value="bottomHalf">Bottom Half</option>
                    <option value="bottomThird">Bottom Third</option>
                    <option value="trunk">Tree Trunk</option>
                    <option value="thinWall">Thin Wall</option>
                    <option value="wideWall">Wide Wall</option>
                </select>
            </div>
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="qj-btn qj-btn-primary" id="qj-place-now-btn">Place on Map Center</button>
                <button class="qj-btn" id="qj-open-slicer-btn">Open Slicer</button>
            </div>
        `;

        const modeSel = document.getElementById('qj-place-mode');
        const templateGroup = document.getElementById('qj-template-group');
        modeSel.value = a.placement.defaultMode || "doodad";
        templateGroup.style.display = modeSel.value === "event" ? "block" : "none";

        modeSel.onchange = (e) => {
            a.placement.defaultMode = e.target.value;
            templateGroup.style.display = a.placement.defaultMode === "event" ? "block" : "none";
        };

        const colSel = document.getElementById('qj-col-preset');
        colSel.value = a.collision.preset || "none";
        colSel.onchange = (e) => { a.collision.preset = e.target.value; };

        document.getElementById('qj-fav-toggle').onclick = () => {
            QJ.DD.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };

        document.getElementById('qj-open-slicer-btn').onclick = () => {
            QJ.DD.Slicing.Editor.open(a);
        };

        document.getElementById('qj-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
        };
    },

    placeAssetOnMapCenter(asset) {
        if (!window.$gameMap || !window.$gamePlayer) return;
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapX = $gamePlayer.x * tw + tw / 2;
        const mapY = $gamePlayer.y * th + th;
        this.commitPlacement(asset, { x: mapX, y: mapY, tileX: $gamePlayer.x, tileY: $gamePlayer.y });
    },

    commitPlacement(asset, coords, modeOverride) {
        const mode = modeOverride || asset.placement.defaultMode || "doodad";

        if (mode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const templateKey = document.getElementById('qj-event-template') ? document.getElementById('qj-event-template').value : 'npc';
            const template = QJ.DD.EventTemplates.get(templateKey);
            const mapId = $gameMap.mapId();
            $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
            const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);

            const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
                characterName: asset.fileName,
                characterIndex: 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType
            });

            const cmd = {
                apply: () => {
                    $gameMap._stagedMapData.events[newId] = ev;
                    QJ.DD.Persistence.dirtyMap = true;
                },
                revert: () => {
                    delete $gameMap._stagedMapData.events[newId];
                }
            };
            QJ.DD.Undo.execute(cmd);
            this.showToast(`Created ${template.name} Event EV${String(newId).padStart(3, '0')}`);
        } else {
            const d = QJ.DD.standardStruct();
            d.bit = [3, asset.path];
            d.x = coords.x;
            d.y = coords.y;
            d.frameW = asset.width || 48;
            d.frameH = asset.height || 48;
            d.collision = { preset: asset.collision.preset || "none", shape: null };

            const cmd = {
                apply: () => {
                    window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                    window.$dataDoodadsQJ[$gameMap.mapId()].push(d);
                    QJ.DD.Persistence.dirtyDoodads = true;
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                },
                revert: () => {
                    const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                    if (SceneManager._scene && SceneManager._scene._spriteset) {
                        SceneManager._scene._spriteset.addDoodadsQJ();
                    }
                }
            };
            QJ.DD.Undo.execute(cmd);
            this.showToast("Placed Doodad on Map!");
        }
        QJ.DD.AssetIndex.recordUsage(asset.id);
    },

    deleteSelectedDoodad() {
        if (!this.selectedDoodad || !window.$gameMap) return;
        const d = this.selectedDoodad;
        const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
        const idx = list.indexOf(d);
        if (idx === -1) return;

        const cmd = {
            apply: () => {
                list.splice(idx, 1);
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.addDoodadsQJ();
                }
            },
            revert: () => {
                list.splice(idx, 0, d);
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.addDoodadsQJ();
                }
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectedDoodad = null;
        this.refreshInspector();
        this.showToast("Doodad Deleted");
    },

    duplicateSelectedDoodad() {
        if (!this.selectedDoodad || !window.$gameMap) return;
        const dup = JSON.parse(JSON.stringify(this.selectedDoodad));
        dup.x += 16; dup.y += 16;
        const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];

        const cmd = {
            apply: () => {
                list.push(dup);
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.addDoodadsQJ();
                }
            },
            revert: () => {
                const i = list.indexOf(dup);
                if (i > -1) list.splice(i, 1);
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.addDoodadsQJ();
                }
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectedDoodad = dup;
        this.refreshInspector();
        this.showToast("Doodad Duplicated");
    },

    // Ghost Follower Preview
    showGhost(asset, clientX, clientY, isAlt) {
        if (!this.ghostEl) {
            this.ghostEl = document.createElement('div');
            this.ghostEl.id = 'qj-map-ghost';
            this.ghostEl.style.cssText = `
                position: fixed; pointer-events: none; z-index: 10002;
                opacity: 0.65; transform: translate(-50%, -100%);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            `;
            const img = document.createElement('img');
            img.id = 'qj-ghost-img';
            img.style.cssText = 'image-rendering: pixelated; max-width: 144px; max-height: 144px;';
            this.ghostEl.appendChild(img);
            document.body.appendChild(this.ghostEl);
        }

        const img = document.getElementById('qj-ghost-img');
        if (img && img.src !== asset.path) img.src = asset.path;

        let posX = clientX;
        let posY = clientY;

        if (!isAlt && window.$gameMap) {
            const coords = this.clientToMapCoords(clientX, clientY);
            const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
                const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                const screenTileX = (coords.tileX * tw + tw / 2 - $gameMap.displayX() * tw) * scaleX + rect.left;
                const screenTileY = (coords.tileY * th + th - $gameMap.displayY() * th) * scaleY + rect.top;
                posX = screenTileX;
                posY = screenTileY;
            }
        }

        this.ghostEl.style.left = posX + 'px';
        this.ghostEl.style.top = posY + 'px';
    },

    removeGhost() {
        if (this.ghostEl && this.ghostEl.parentNode) {
            this.ghostEl.parentNode.removeChild(this.ghostEl);
        }
        this.ghostEl = null;
    },

    clientToMapCoords(clientX, clientY) {
        const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
        if (!canvas || !window.$gameMap) return { x: 0, y: 0, tileX: 0, tileY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = (canvas.width && rect.width) ? (canvas.width / rect.width) : 1;
        const scaleY = (canvas.height && rect.height) ? (canvas.height / rect.height) : 1;
        const screenX = (clientX - rect.left) * scaleX;
        const screenY = (clientY - rect.top) * scaleY;

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapPixelX = $gameMap.displayX() * tw + screenX;
        const mapPixelY = $gameMap.displayY() * th + screenY;
        const tileX = Math.floor(mapPixelX / tw);
        const tileY = Math.floor(mapPixelY / th);
        return { x: mapPixelX, y: mapPixelY, tileX, tileY };
    },

    attachCanvasListeners() {
        const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
        if (!canvas) return;

        this._onDragOver = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.showGhost(this.activeDragPayload, e.clientX, e.clientY, e.altKey);
            }
        };

        this._onDrop = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.removeGhost();
                const payload = this.activeDragPayload;
                this.activeDragPayload = null;
                const coords = this.clientToMapCoords(e.clientX, e.clientY);

                if (payload.category === 'Audio') {
                    if (confirm(`Create a sound trigger event for ${payload.fileName} at this tile?`)) {
                        this.createAudioEvent(payload, coords);
                    }
                    return;
                }

                if (payload.placementMode === 'ask') {
                    this.showAskEventModal(payload, coords, e.altKey);
                } else {
                    const snapCoords = e.altKey ? coords : {
                        x: coords.tileX * 48 + 24,
                        y: coords.tileY * 48 + 48,
                        tileX: coords.tileX,
                        tileY: coords.tileY
                    };
                    this.commitPlacement(payload, snapCoords, payload.placementMode);
                }
            }
        };

        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            const coords = this.clientToMapCoords(e.clientX, e.clientY);

            // 1. Eyedropper Tool or Alt held
            if (this.placementTool === 'eyedropper' || e.altKey) {
                this.handleEyedropper(coords);
                return;
            }

            // 2. Stamp Tool
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                const snapCoords = e.altKey ? coords : {
                    x: coords.tileX * 48 + 24,
                    y: coords.tileY * 48 + 48,
                    tileX: coords.tileX,
                    tileY: coords.tileY
                };
                this.commitPlacement(this.selectedAsset, snapCoords);
                return;
            }

            // 3. Normal Pointer: Select placed doodad
            if (!this.placementTool) {
                this.handleDoodadSelection(coords);
            }
        };

        this._onCanvasMouseDown = (e) => {
            if (this.placementTool === 'brush' && this.selectedAsset) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.scatterAt(e.clientX, e.clientY);
            }
        };

        this._onCanvasMouseMove = (e) => {
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            }
        };

        this._onCanvasMouseUp = () => {
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDoodadsQJ();
                        },
                        revert: () => {
                            const list = window.$dataDoodadsQJ[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDoodadsQJ();
                        }
                    };
                    QJ.DD.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
        };

        canvas.addEventListener('dragover', this._onDragOver);
        canvas.addEventListener('drop', this._onDrop);
        canvas.addEventListener('click', this._onCanvasClick);
        canvas.addEventListener('mousedown', this._onCanvasMouseDown);
        window.addEventListener('mousemove', this._onCanvasMouseMove);
        window.addEventListener('mouseup', this._onCanvasMouseUp);
    },

    detachCanvasListeners() {
        const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
        if (!canvas) return;
        if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
        if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
        if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
        if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
        if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
        if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
    },

    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const list = window.$dataDoodadsQJ[$gameMap.mapId()] = window.$dataDoodadsQJ[$gameMap.mapId()] || [];

        for (let i = 0; i < b.density; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * b.radius;
            const px = coords.x + Math.cos(angle) * dist;
            const py = coords.y + Math.sin(angle) * dist;

            const scaleJitter = 1.0 + (Math.random() * 2 - 1) * b.scaleJitter;
            const rotJitter = (Math.random() * 2 - 1) * b.rotateJitter;

            const d = QJ.DD.standardStruct();
            d.bit = [3, asset.path];
            d.x = Math.round(px);
            d.y = Math.round(py);
            d.frameW = asset.width || 48;
            d.frameH = asset.height || 48;
            d.scaleX = parseFloat(scaleJitter.toFixed(2));
            d.scaleY = parseFloat(scaleJitter.toFixed(2));
            d.rotation = Math.round(rotJitter);
            d.collision = { preset: asset.collision.preset || "none", shape: null };

            list.push(d);
            this.currentBrushBatch.push(d);
        }
        if (SceneManager._scene && SceneManager._scene._spriteset) {
            SceneManager._scene._spriteset.addDoodadsQJ();
        }
    },

    handleEyedropper(coords) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
                return;
            }
        }
        this.showToast("No doodad under cursor");
    },

    handleDoodadSelection(coords) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d);
                return;
            }
        }
    },

    showAskEventModal(payload, coords, isAlt) {
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 8px;">PLACEMENT DECISION</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px;">Does ${payload.fileName} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="qj-btn qj-btn-primary" id="qj-ask-yes">Yes (Create MZ Event)</button>
                <button class="qj-btn" id="qj-ask-no">No (Decorative Doodad)</button>
                <button class="qj-btn" id="qj-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="qj-btn" id="qj-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="qj-btn" id="qj-ask-cancel" style="width: 100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const snapCoords = isAlt ? coords : {
            x: coords.tileX * 48 + 24,
            y: coords.tileY * 48 + 48,
            tileX: coords.tileX,
            tileY: coords.tileY
        };

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('qj-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('qj-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('qj-ask-yes-rem').onclick = () => {
            closeM();
            if (QJ.DD.AssetIndex.data.assets[payload.assetId]) {
                QJ.DD.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                QJ.DD.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('qj-ask-no-rem').onclick = () => {
            closeM();
            if (QJ.DD.AssetIndex.data.assets[payload.assetId]) {
                QJ.DD.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                QJ.DD.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('qj-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);
        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        const isBgm = payload.path.includes('/bgm/');

        const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: `Sound_${baseName}`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: isBgm ? [
                { code: 241, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ] : [
                { code: 250, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });

        $gameMap._stagedMapData.events[newId] = ev;
        QJ.DD.Persistence.dirtyMap = true;
        this.showToast(`Created Sound Event EV${String(newId).padStart(3, '0')}`);
    },

    showConflictModal() {
        const modal = document.createElement('div');
        modal.className = 'qj-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 440px; padding: 22px; z-index: 10025; text-align: center;
            border: 2px solid #ef4444;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #ef4444; font-size: 15px; margin-bottom: 10px;">EXTERNAL CONFLICT DETECTED</div>
            <div style="font-size: 12px; line-height: 1.6; color: #cbd5e1; margin-bottom: 18px;">
                The current map file was modified externally (e.g. in the RPG Maker MZ editor) since this workspace session began.<br><br>
                Overwriting now may erase external edits made in MZ.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="qj-btn" id="qj-conf-force" style="background: #b91c1c;">Force Overwrite With Workspace Changes</button>
                <button class="qj-btn" id="qj-conf-reload">Reload Map from Disk (Discard Workspace Staged)</button>
                <button class="qj-btn" id="qj-conf-cancel">Cancel Save</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('qj-conf-force').onclick = () => {
            closeM();
            QJ.DD.Persistence.saveAll(true);
        };
        document.getElementById('qj-conf-reload').onclick = () => {
            closeM();
            if ($gameMap) $gameMap._stagedMapData = null;
            QJ.DD.Persistence.captureSession();
            this.showToast("External Map Data Reloaded!");
        };
        document.getElementById('qj-conf-cancel').onclick = closeM;
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'qj-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 12px;">SYSTEM DIAGNOSTICS</div>
            <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1;">
                <div>Total Indexed Assets: <strong style="color: #fff;">${QJ.DD.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: #fff;">${Object.keys(QJ.DD.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: #fff;">${QJ.DD.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: #fff;">${QJ.DD.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: #fff;">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="qj-btn qj-btn-primary" id="qj-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="qj-btn" id="qj-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="qj-btn" id="qj-close-diag-btn">Close</button>
            </div>
        `;
        document.body.appendChild(diag);

        document.getElementById('qj-rebuild-idx-btn').onclick = () => {
            QJ.DD.AssetIndex.data.assets = {};
            QJ.DD.AssetIndex.scan();
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-clear-cache-btn').onclick = () => {
            QJ.DD.Thumbnail.cache = {};
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('qj-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 20px;
            font-size: 12px; font-weight: bold; z-index: 10030; box-shadow: 0 4px 14px rgba(0,0,0,0.5);
            pointer-events: none; transition: opacity 0.3s;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        }, 2200);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('qj-undo-btn');
        const rBtn = document.getElementById('qj-redo-btn');
        if (uBtn) uBtn.style.opacity = QJ.DD.Undo.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = QJ.DD.Undo.redoStack.length > 0 ? '1' : '0.5';
    }
};

//==========================================================
// SECTION 25: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_initialize = Scene_Map.prototype.initialize;
    Scene_Map.prototype.initialize = function() {
        $.Scene_Map_initialize.call(this);
    };

    $.Scene_Map_updateScene = Scene_Map.prototype.updateScene;
    Scene_Map.prototype.updateScene = function() {
        $.Scene_Map_updateScene.call(this);
        if (!editorMode) return;

        if (typeof Input !== 'undefined' && Input.isTriggered(editKey)) {
            QJ.DD.Workspace.toggle();
        }
    };
}

// Windows Explorer native drag and drop import listener with category modal
if (typeof window !== 'undefined') {
    window.addEventListener('dragover', (e) => {
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (window.$gameSystem && window.$gameSystem.doodadsQJ && window.$gameSystem.doodadsQJ.editing) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const fs = QJ.DD.FS.fs, path = QJ.DD.FS.path;
                if (!fs) return;
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    const ext = path.extname(f.name).toLowerCase();
                    let targetFolder = 'img/doodads';
                    if (['.ogg', '.m4a', '.wav'].includes(ext)) {
                        targetFolder = 'audio/se';
                    } else if (f.name.toLowerCase().includes('character')) {
                        targetFolder = 'img/characters';
                    }
                    const dest = path.join(targetFolder, f.name);
                    try {
                        fs.copyFileSync(f.path, dest);
                    } catch(err) {}
                }
                QJ.DD.AssetIndex.scan();
                QJ.DD.Workspace.refreshDrawerCards();
                QJ.DD.Workspace.showToast(`Imported ${e.dataTransfer.files.length} file(s) from Explorer!`);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!window.$gameSystem || !window.$gameSystem.doodadsQJ || !window.$gameSystem.doodadsQJ.editing) return;
        if (e.code === editKey) {
            e.preventDefault();
            QJ.DD.Workspace.toggle();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            QJ.DD.Undo.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            QJ.DD.Undo.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            QJ.DD.Persistence.saveAll();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            QJ.DD.Workspace.duplicateSelectedDoodad();
        } else if (e.key === 'Delete') {
            QJ.DD.Workspace.deleteSelectedDoodad();
        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            if (QJ.DD.Workspace.selectedDoodad) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                const d = QJ.DD.Workspace.selectedDoodad;
                if (e.key === 'ArrowLeft') d.x -= step;
                if (e.key === 'ArrowRight') d.x += step;
                if (e.key === 'ArrowUp') d.y -= step;
                if (e.key === 'ArrowDown') d.y += step;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
                QJ.DD.Workspace.refreshInspector();
            }
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    setInterval(() => {
        if (editorMode && window.$gameMap && (QJ.DD.Persistence.dirtyMap || QJ.DD.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: QJ.DD.doodads(),
                stagedMap: $gameMap._stagedMapData
            };
            QJ.DD.FS.atomicWriteJson('data/QJAssetWorkspaceRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
}

})(QJ.DD.reWrite);
