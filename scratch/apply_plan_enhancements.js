// scratch/apply_plan_enhancements.js
const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, '..', 'QJ-Doodads.js');
let code = fs.readFileSync(pluginPath, 'utf8');

console.log("Original QJ-Doodads.js size:", code.length, "bytes.");

// 1. Enhance QJ.DD.AssetIndex with Collection management
const assetIndexTarget = `    recordUsage(assetId) {
        if (this.data.assets[assetId]) {
            const u = this.data.assets[assetId].usage;
            u.useCount = (u.useCount || 0) + 1;
            u.lastUsedAt = Date.now();
            this.save();
        }
    }
};`;

const assetIndexReplacement = `    recordUsage(assetId) {
        if (this.data.assets[assetId]) {
            const u = this.data.assets[assetId].usage;
            u.useCount = (u.useCount || 0) + 1;
            u.lastUsedAt = Date.now();
            this.save();
        }
    },

    createCollection(name) {
        this.data.collections = this.data.collections || {};
        if (!this.data.collections[name]) {
            this.data.collections[name] = [];
            this.save();
        }
    },

    deleteCollection(name) {
        if (this.data.collections && this.data.collections[name]) {
            delete this.data.collections[name];
            for (const a of this.list) {
                if (a.collections) {
                    a.collections = a.collections.filter(c => c !== name);
                }
            }
            this.save();
        }
    },

    addAssetToCollection(assetId, name) {
        this.createCollection(name);
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.collections = asset.collections || [];
            if (!asset.collections.includes(name)) {
                asset.collections.push(name);
                if (!this.data.collections[name].includes(assetId)) {
                    this.data.collections[name].push(assetId);
                }
                this.save();
            }
        }
    },

    removeAssetFromCollection(assetId, name) {
        const asset = this.data.assets[assetId];
        if (asset && asset.collections) {
            asset.collections = asset.collections.filter(c => c !== name);
        }
        if (this.data.collections && this.data.collections[name]) {
            this.data.collections[name] = this.data.collections[name].filter(id => id !== assetId);
        }
        this.save();
    },

    getCollections() {
        return Object.keys(this.data.collections || {});
    }
};`;

if (!code.includes(assetIndexTarget)) {
    throw new Error("Target for QJ.DD.AssetIndex not found in QJ-Doodads.js");
}
code = code.replace(assetIndexTarget, assetIndexReplacement);
console.log("✓ Added Collection management to QJ.DD.AssetIndex");

// 2. Enhance QJ.DD.Search with collection tokens
const searchTokensTarget = `            favorite: null,
            animated: null,
            negative: []
        };`;

const searchTokensReplacement = `            favorite: null,
            animated: null,
            collections: [],
            negative: []
        };`;

code = code.replace(searchTokensTarget, searchTokensReplacement);

const searchParseTarget = `            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else {`;

const searchParseReplacement = `            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('collection:')) {
                tokens.collections.push(p.slice(11).toLowerCase());
            } else {`;

code = code.replace(searchParseTarget, searchParseReplacement);

const searchMatchTarget = `        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
        }`;

const searchMatchReplacement = `        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
        }
        if (parsed.collections && parsed.collections.length > 0) {
            const assetCols = (asset.collections || []).map(c => c.toLowerCase());
            if (!parsed.collections.some(c => assetCols.includes(c))) return false;
        }`;

code = code.replace(searchMatchTarget, searchMatchReplacement);
console.log("✓ Added collection: filter support to QJ.DD.Search");

// 3. Enhance QJ.DD.Slicing.Metadata to support .saf.json
const metadataParserTarget = `        const jsonPath = imagePath.replace(/\\.[^/.]+$/, ".json");
        if (fs.existsSync(jsonPath)) {`;

const metadataParserReplacement = `        let jsonPath = imagePath.replace(/\\.[^/.]+$/, ".json");
        const safPath = imagePath.replace(/\\.[^/.]+$/, ".saf.json");
        if (!fs.existsSync(jsonPath) && fs.existsSync(safPath)) {
            jsonPath = safPath;
        }
        if (fs.existsSync(jsonPath)) {`;

code = code.replace(metadataParserTarget, metadataParserReplacement);
console.log("✓ Added .saf.json parser support to QJ.DD.Slicing.Metadata");

// 4. Persistence.saveAll clears recovery file on clean save
const persistenceSaveTarget = `        this.dirtyMap = false;
        this.dirtyDoodads = false;
        QJ.DD.Workspace.showToast("Project Saved! Reload map in MZ before editing there.");
        return true;`;

const persistenceSaveReplacement = `        this.dirtyMap = false;
        this.dirtyDoodads = false;
        if (QJ.DD.FS.fs && QJ.DD.FS.fs.existsSync('data/QJAssetWorkspaceRecovery.json')) {
            try { QJ.DD.FS.fs.unlinkSync('data/QJAssetWorkspaceRecovery.json'); } catch(e) {}
        }
        QJ.DD.Workspace.showToast("Project Saved! Reload map in MZ before editing there.");
        return true;`;

code = code.replace(persistenceSaveTarget, persistenceSaveReplacement);
console.log("✓ Enhanced Persistence.saveAll with recovery cache cleanup");

// 5. Category tabs in Drawer (add Favorites and Recent)
const categoryTabsTarget = `            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px; overflow-x: auto;" id="qj-category-tabs">
                <button class="qj-btn qj-btn-primary" data-cat="All">All</button>
                <button class="qj-btn" data-cat="Characters">Characters</button>
                <button class="qj-btn" data-cat="Doodads">Doodads</button>
                <button class="qj-btn" data-cat="Tilesets">Tiles</button>
                <button class="qj-btn" data-cat="Pictures">Pictures</button>
                <button class="qj-btn" data-cat="Audio">Audio</button>
            </div>`;

const categoryTabsReplacement = `            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px; overflow-x: auto;" id="qj-category-tabs">
                <button class="qj-btn qj-btn-primary" data-cat="All">All</button>
                <button class="qj-btn" data-cat="Characters">Characters</button>
                <button class="qj-btn" data-cat="Doodads">Doodads</button>
                <button class="qj-btn" data-cat="Tilesets">Tiles</button>
                <button class="qj-btn" data-cat="Pictures">Pictures</button>
                <button class="qj-btn" data-cat="Audio">Audio</button>
                <button class="qj-btn" data-cat="Favorites" title="Show Favorited Assets">★ Favs</button>
                <button class="qj-btn" data-cat="Recent" title="Show Recently Used Assets">🕒 Recent</button>
            </div>`;

code = code.replace(categoryTabsTarget, categoryTabsReplacement);

// 6. refreshDrawerCards: handle Favorites and Recent categories
const refreshCardsTarget = `    refreshDrawerCards() {
        let filtered = QJ.DD.AssetIndex.list;
        if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = QJ.DD.Search.filter(filtered, this.searchQuery);`;

const refreshCardsReplacement = `    refreshDrawerCards() {
        let filtered = QJ.DD.AssetIndex.list;
        if (this.currentCategory === 'Favorites') {
            filtered = filtered.filter(a => a.favorite);
        } else if (this.currentCategory === 'Recent') {
            filtered = filtered.filter(a => a.usage && a.usage.lastUsedAt > 0)
                               .sort((a, b) => (b.usage.lastUsedAt || 0) - (a.usage.lastUsedAt || 0));
        } else if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = QJ.DD.Search.filter(filtered, this.searchQuery);`;

code = code.replace(refreshCardsTarget, refreshCardsReplacement);
console.log("✓ Added Favorites and Recent tabs and filtering");

// 7. Scatter Brush Popover in HTML & binding
const toolbarScatterBtnTarget = `<button class="qj-btn" id="qj-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>`;
const toolbarScatterBtnReplacement = `<button class="qj-btn" id="qj-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <div id="qj-brush-popover" class="qj-glass" style="display: none; position: absolute; top: 58px; right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BRUSH SETTINGS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Radius:</span><span id="qj-brush-rad-val">80px</span>
                            </div>
                            <input type="range" id="qj-brush-rad" min="20" max="250" value="80" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Density:</span><span id="qj-brush-den-val">3</span>
                            </div>
                            <input type="range" id="qj-brush-den" min="1" max="10" value="3" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Scale Variation:</span><span id="qj-brush-scale-val">15%</span>
                            </div>
                            <input type="range" id="qj-brush-scale" min="0" max="50" value="15" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Rotation Variation:</span><span id="qj-brush-rot-val">25°</span>
                            </div>
                            <input type="range" id="qj-brush-rot" min="0" max="180" value="25" style="width: 100%;" />
                        </div>
                    </div>
                </div>`;

code = code.replace(toolbarScatterBtnTarget, toolbarScatterBtnReplacement);

const brushBtnClickTarget = `        const brushBtn = document.getElementById('qj-brush-btn');
        brushBtn.onclick = () => {
            this.placementTool = this.placementTool === 'brush' ? null : 'brush';
            brushBtn.classList.toggle('qj-btn-active', this.placementTool === 'brush');
            this.showToast(this.placementTool ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
        };`;

const brushBtnClickReplacement = `        const brushBtn = document.getElementById('qj-brush-btn');
        const brushPopover = document.getElementById('qj-brush-popover');
        brushBtn.onclick = () => {
            this.placementTool = this.placementTool === 'brush' ? null : 'brush';
            const active = this.placementTool === 'brush';
            brushBtn.classList.toggle('qj-btn-active', active);
            if (brushPopover) brushPopover.style.display = active ? 'block' : 'none';
            this.showToast(active ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
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
        setupBrushSlider('qj-brush-rad', 'radius', 'qj-brush-rad-val', 'px');
        setupBrushSlider('qj-brush-den', 'density', 'qj-brush-den-val', '');
        setupBrushSlider('qj-brush-scale', 'scaleJitter', 'qj-brush-scale-val', '%', 0.01);
        setupBrushSlider('qj-brush-rot', 'rotateJitter', 'qj-brush-rot-val', '°');`;

code = code.replace(brushBtnClickTarget, brushBtnClickReplacement);
console.log("✓ Added Scatter Brush Settings UI and real-time binding");

// 8. Card Context Menu
const cardEventsTarget = `        card.ondblclick = () => {
            if (asset.category !== 'Audio') {
                QJ.DD.Slicing.Editor.open(asset);
            }
        };`;

const cardEventsReplacement = `        card.ondblclick = () => {
            if (asset.category !== 'Audio') {
                QJ.DD.Slicing.Editor.open(asset);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            this.selectAsset(asset);
            const items = [
                { label: 'Place as Doodad', icon: '📌', onClick: () => this.placeAssetOnMapCenter(asset) },
                {
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: () => {
                        const templateKey = prompt("Enter Template Key (e.g. npc, door, chest, signpost, switch, save_point):", "npc") || "npc";
                        const prev = document.getElementById('qj-event-template');
                        if (prev) prev.value = templateKey;
                        this.commitPlacement(asset, this.clientToMapCoords(e.clientX, e.clientY), 'event');
                    }
                },
                { separator: true },
                {
                    label: asset.favorite ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: '★',
                    onClick: () => {
                        QJ.DD.AssetIndex.toggleFavorite(asset.id);
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
                            QJ.DD.AssetIndex.addAssetToCollection(asset.id, colName.trim());
                            this.showToast(\`Added \${asset.fileName} to "\${colName.trim()}"!\`);
                        }
                    }
                },
                { separator: true }
            ];
            if (asset.category !== 'Audio') {
                items.push({ label: 'Open in Slicing Modal', icon: '✂️', onClick: () => QJ.DD.Slicing.Editor.open(asset) });
                items.push({ label: 'Export Slices to PNGs', icon: '💾', onClick: () => QJ.DD.Export.exportSlices(asset) });
            } else {
                items.push({ label: 'Play Audio Preview', icon: '▶️', onClick: () => QJ.DD.Audio.playPreview(asset) });
                items.push({ label: 'Stop Audio', icon: '⏹', onClick: () => QJ.DD.Audio.stopPreview() });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };`;

code = code.replace(cardEventsTarget, cardEventsReplacement);
console.log("✓ Added right-click context menu to Asset Cards");

// 9. Canvas context menu & Event selection logic
const canvasListenersTarget = `        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                return;
            }
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

            // 3. Normal Pointer: Select placed doodad (hold Shift for multi-selection)
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };`;

const canvasListenersReplacement = `        this._onCanvasContextMenu = (e) => {
            if (!this.mounted) return;
            e.preventDefault();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);
            const items = [];

            // Check if right-clicking placed doodad
            const list = QJ.DD.doodads() || [];
            let clickedDoodad = null;
            for (let i = list.length - 1; i >= 0; i--) {
                const d = list[i];
                if (!d.editorHidden && Math.hypot(d.x - coords.x, d.y - coords.y) < 40) {
                    clickedDoodad = d;
                    break;
                }
            }

            if (clickedDoodad) {
                this.selectDoodad(clickedDoodad);
                items.push({ label: 'Bring Forward (+1 Z)', icon: '⬆️', onClick: () => this.bringForward([clickedDoodad]) });
                items.push({ label: 'Send Backward (-1 Z)', icon: '⬇️', onClick: () => this.sendBackward([clickedDoodad]) });
                items.push({ label: 'Bring to Front', icon: '⏫', onClick: () => this.bringToFront([clickedDoodad]) });
                items.push({ label: 'Send to Back', icon: '⏬', onClick: () => this.sendToBack([clickedDoodad]) });
                items.push({ separator: true });
                items.push({ label: 'Duplicate (Ctrl+D)', icon: '📄', onClick: () => this.duplicateSelectedDoodad() });
                items.push({ label: clickedDoodad.locked ? 'Unlock' : 'Lock', icon: clickedDoodad.locked ? '🔓' : '🔒', onClick: () => { clickedDoodad.locked = !clickedDoodad.locked; this.refreshInspector(); } });
                items.push({ label: 'Hide in Editor', icon: '👁️', onClick: () => { clickedDoodad.editorHidden = true; this.refreshSpriteset(true); this.refreshInspector(); } });
                items.push({ label: 'Delete (Del)', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedDoodad() });
                this.showContextMenu(e.clientX, e.clientY, items);
                return;
            }

            // Check if right-clicking placed MZ Event
            if (window.$gameMap && window.$gameMap.eventsXy) {
                const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                if (evs && evs.length > 0) {
                    const ge = evs[0];
                    const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                    const evObj = staged || ge.event();
                    this.selectEvent({ gameEvent: ge, stagedEvent: evObj });
                    items.push({
                        label: 'Save as Event Template...', icon: '💾', onClick: () => {
                            const name = prompt("Enter a name for this new Event Template:", evObj.name || ("Template_EV" + ge.eventId()));
                            if (name && name.trim()) {
                                const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                                QJ.DD.EventTemplates.saveCustomTemplate(name.trim(), evObj, cat.trim());
                                this.showToast(\`Saved template "\${name.trim()}"!\`);
                            }
                        }
                    });
                    items.push({ label: 'Duplicate Event', icon: '📄', onClick: () => this.duplicateSelectedEvent() });
                    items.push({ label: 'Delete Event', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedEvent() });
                    this.showContextMenu(e.clientX, e.clientY, items);
                    return;
                }
            }

            // Right-clicking empty map
            items.push({ label: this.gridSnapShow ? 'Hide Grid Overlay (G)' : 'Show Grid Overlay (G)', icon: '📐', onClick: () => this.toggleGrid() });
            if (this._clipboardDoodads && this._clipboardDoodads.length > 0) {
                items.push({ label: \`Paste \${this._clipboardDoodads.length} Doodad(s) (Ctrl+V)\`, icon: '📑', onClick: () => this.pasteCopied() });
            }
            if (this.selectedAsset) {
                items.push({ label: \`Stamp \${this.selectedAsset.fileName} Here\`, icon: '📌', onClick: () => this.commitPlacement(this.selectedAsset, coords) });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                return;
            }
            this.closeContextMenu();
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

            // 3. Normal Pointer: Select placed doodad or MZ event
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };`;

code = code.replace(canvasListenersTarget, canvasListenersReplacement);

// 10. Attach contextmenu listener to canvas
const attachCanvasTarget = `        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
        }`;

const attachCanvasReplacement = `        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
            canvas.addEventListener('contextmenu', this._onCanvasContextMenu);
        }`;

code = code.replace(attachCanvasTarget, attachCanvasReplacement);

const detachCanvasTarget = `        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
        }`;

const detachCanvasReplacement = `        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
        }`;

code = code.replace(detachCanvasTarget, detachCanvasReplacement);
console.log("✓ Attached canvas context menu and selection logic");

// 11. Selection logic: handle MZ Events when no doodad matches
const handleSelectionTarget = `    handleDoodadSelection(coords, isMulti) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (d.editorHidden) continue;
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d, isMulti);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
        }
    },`;

const handleSelectionReplacement = `    handleDoodadSelection(coords, isMulti) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (d.editorHidden) continue;
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d, isMulti);
                return;
            }
        }
        // If no doodad clicked, check for genuine MZ Event on that tile
        if (!isMulti && window.$gameMap && window.$gameMap.eventsXy) {
            const events = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (events && events.length > 0) {
                const ge = events[0];
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(\`Selected Map Event EV\${String(ge.eventId()).padStart(3, '0')}\`);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
            this.selectEvent(null);
        }
    },`;

code = code.replace(handleSelectionTarget, handleSelectionReplacement);

// 12. Eyedropper: support MZ Events
const handleEyedropperTarget = `    handleEyedropper(coords) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d);
                this.showToast(\`Eyedropper: Selected Placed Doodad\`);
                return;
            }
        }
        this.showToast("No doodad under cursor");
    },`;

const handleEyedropperReplacement = `    handleEyedropper(coords) {
        const list = QJ.DD.doodads();
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            const dist = Math.hypot(d.x - coords.x, d.y - coords.y);
            if (dist < 40) {
                this.selectDoodad(d);
                this.showToast(\`Eyedropper: Selected Placed Doodad\`);
                return;
            }
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = QJ.DD.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
                    if (matchedAsset) {
                        this.selectAsset(matchedAsset);
                        this.showToast(\`Eyedropper: Matched Character Sheet \${charName}\`);
                        return;
                    }
                }
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(\`Eyedropper: Selected Event EV\${String(ge.eventId()).padStart(3, '0')}\`);
                return;
            }
        }
        this.showToast("No doodad or event under cursor");
    },`;

code = code.replace(handleEyedropperTarget, handleEyedropperReplacement);

// 13. Inspector: add selectedEvent inspection case and Event methods
const selectEventTarget = `    selectAsset(asset) {
        this.selectedAsset = asset;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshInspector();
    },`;

const selectEventReplacement = `    selectEvent(evInfo) {
        this.selectedEvent = evInfo;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedAsset = null;
        this.refreshInspector();
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshInspector();
    },`;

code = code.replace(selectEventTarget, selectEventReplacement);

// Event Inspector block in refreshInspector
const refreshInspectorTopTarget = `    refreshInspector() {
        const content = document.getElementById('qj-inspector-content');
        if (!content) return;

        // Case 1A: Multi-Selection (Multiple Doodads Selected)`;

const refreshInspectorTopReplacement = `    refreshInspector() {
        const content = document.getElementById('qj-inspector-content');
        if (!content) return;

        // Case 0: MZ Map Event Selected
        if (this.selectedEvent) {
            const ev = this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event());
            const ge = this.selectedEvent.gameEvent;
            const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
            const page0 = ev && ev.pages && ev.pages[0] ? ev.pages[0] : {};
            const triggerNames = ["Action Button", "Player Touch", "Event Touch", "Autorun", "Parallel"];
            const priorityNames = ["Below Characters", "Same as Characters", "Above Characters"];

            content.innerHTML = \`
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MAP EVENT: \${ev ? ev.name : ('EV' + evId)} (ID: \${evId})</div>
                <div style="font-size: 11px; margin-bottom: 4px;">Tile Coordinates: <span style="color: #fff;">[\${ge ? ge.x : (ev ? ev.x : 0)}, \${ge ? ge.y : (ev ? ev.y : 0)}]</span></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile X:</label>
                        <input type="number" id="qj-ev-x" value="\${ge ? ge.x : (ev ? ev.x : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile Y:</label>
                        <input type="number" id="qj-ev-y" value="\${ge ? ge.y : (ev ? ev.y : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Trigger:</label>
                    <select id="qj-ev-trigger" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        \${triggerNames.map((t, idx) => \`<option value="\${idx}" \${(page0.trigger === idx) ? 'selected' : ''}>\${t}</option>\`).join('')}
                    </select>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Priority:</label>
                    <select id="qj-ev-priority" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        \${priorityNames.map((p, idx) => \`<option value="\${idx}" \${(page0.priorityType === idx) ? 'selected' : ''}>\${p}</option>\`).join('')}
                    </select>
                </div>
                <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="qj-btn qj-btn-primary" id="qj-ev-save-template-btn">💾 Save as Event Template</button>
                    <button class="qj-btn" id="qj-ev-dup-btn">Duplicate Event</button>
                    <button class="qj-btn" id="qj-ev-del-btn" style="background: #991b1b;">Delete Event</button>
                </div>
            \`;

            document.getElementById('qj-ev-save-template-btn').onclick = () => {
                const name = prompt("Enter a name for this new Event Template:", ev.name || ("Template_" + evId));
                if (name && name.trim()) {
                    const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                    QJ.DD.EventTemplates.saveCustomTemplate(name.trim(), ev, cat.trim());
                    this.showToast(\`Saved template "\${name.trim()}"!\`);
                }
            };
            document.getElementById('qj-ev-del-btn').onclick = () => {
                this.deleteSelectedEvent();
            };
            document.getElementById('qj-ev-dup-btn').onclick = () => {
                this.duplicateSelectedEvent();
            };
            return;
        }

        // Case 1A: Multi-Selection (Multiple Doodads Selected)`;

code = code.replace(refreshInspectorTopTarget, refreshInspectorTopReplacement);

// 14. Event management helper methods in QJ.DD.Workspace
const workspaceMethodsTarget = `    showConflictModal() {`;

const workspaceMethodsReplacement = `    deleteSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ge = evInfo.gameEvent;
        const ev = evInfo.stagedEvent || (ge && ge.event());
        const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
        if (!evId) return;

        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                if (ge && ge._erased !== undefined) ge._erased = true;
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                if (ge && ge._erased !== undefined) ge._erased = false;
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectEvent(null);
        this.showToast(\`Deleted Event EV\${String(evId).padStart(3, '0')}\`);
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const newId = QJ.DD.Events.allocateSafeId($gameMap._stagedMapData);

        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = (dup.x || 0) + 1;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(\`Duplicated to Event EV\${String(newId).padStart(3, '0')}\`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'qj-context-menu';
        menu.className = 'qj-glass';
        menu.style.cssText = \`
            position: fixed; z-index: 10050; min-width: 180px; padding: 4px;
            display: flex; flex-direction: column; gap: 2px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7);
        \`;
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 3px 0;';
                menu.appendChild(sep);
                return;
            }
            const row = document.createElement('button');
            row.className = 'qj-btn';
            row.style.cssText = \`
                text-align: left; width: 100%; border: none; background: transparent;
                padding: 5px 10px; font-size: 11px; display: flex; align-items: center; gap: 6px;
                color: \${item.danger ? '#f87171' : '#e2e8f0'};
            \`;
            row.innerHTML = \`<span>\${item.icon || '•'}</span> <span>\${item.label}</span>\`;
            row.onmouseenter = () => { row.style.background = item.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.25)'; };
            row.onmouseleave = () => { row.style.background = 'transparent'; };
            row.onclick = (e) => {
                e.stopPropagation();
                this.closeContextMenu();
                if (item.onClick) item.onClick();
            };
            menu.appendChild(row);
        });
        document.body.appendChild(menu);

        const menuW = menu.offsetWidth || 180;
        const menuH = menu.offsetHeight || 200;
        const left = Math.min(clientX, (window.innerWidth || 1200) - menuW - 10);
        const top = Math.min(clientY, (window.innerHeight || 800) - menuH - 10);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        const onDismiss = (ev) => {
            if (menu.contains(ev.target)) return;
            this.closeContextMenu();
            window.removeEventListener('pointerdown', onDismiss);
        };
        setTimeout(() => window.addEventListener('pointerdown', onDismiss), 50);
    },

    closeContextMenu() {
        const existing = document.getElementById('qj-context-menu');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        $gameMap._stagedMapData = $gameMap._stagedMapData || DataManager.loadMapDataSynDoodadsQJ(0, mapId) || { events: [null] };
        const evId = gameEvent.eventId();
        const ev = $gameMap._stagedMapData.events[evId] || gameEvent.event();
        if (!ev || !ev.pages || !ev.pages[0]) return;

        const baseName = payload.fileName.replace(/\\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const soundCmd = { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] };
        const pageList = ev.pages[0].list;
        const insertIdx = Math.max(0, pageList.length - 1);

        const cmd = {
            type: 'append_audio_command',
            apply: () => {
                pageList.splice(insertIdx, 0, soundCmd);
                QJ.DD.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                QJ.DD.Persistence.dirtyMap = true;
            }
        };
        QJ.DD.Undo.execute(cmd);
        this.showToast(\`Appended Sound Command to Event EV\${String(evId).padStart(3, '0')}\`);
    },

    showConflictModal() {`;

code = code.replace(workspaceMethodsTarget, workspaceMethodsReplacement);
console.log("✓ Added Event manipulation, Context Menu, and Audio Command Appender methods");

// 15. Audio drop: handle drop onto existing events
const audioDropTarget = `                if (payload.category === 'Audio') {
                    if (confirm(\`Create a sound trigger event for \${payload.fileName} at this tile?\`)) {
                        this.createAudioEvent(payload, coords);
                    }
                    return;
                }`;

const audioDropReplacement = `                if (payload.category === 'Audio') {
                    if (window.$gameMap && window.$gameMap.eventsXy) {
                        const existingEvents = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                        if (existingEvents && existingEvents.length > 0) {
                            const targetEv = existingEvents[0];
                            if (confirm(\`Append sound command for \${payload.fileName} to existing Event EV\${String(targetEv.eventId()).padStart(3, '0')} on this tile?\`)) {
                                this.appendAudioCommandToEvent(payload, targetEv);
                                return;
                            }
                        }
                    }
                    if (confirm(\`Create a sound trigger event for \${payload.fileName} at this tile?\`)) {
                        this.createAudioEvent(payload, coords);
                    }
                    return;
                }`;

code = code.replace(audioDropTarget, audioDropReplacement);

// 16. Audio commands: distinguish BGM, BGS, ME, and SE
const audioCreateEventTarget = `        const baseName = payload.fileName.replace(/\\.[^/.]+$/, "");
        const isBgm = payload.path.includes('/bgm/');

        const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: \`Sound_\${baseName}\`,
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
        });`;

const audioCreateEventReplacement = `        const baseName = payload.fileName.replace(/\\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const ev = QJ.DD.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: \`Sound_\${baseName}\`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: [
                { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });`;

code = code.replace(audioCreateEventTarget, audioCreateEventReplacement);

// 17. Update keydown for selectedEvent delete and arrows
const keydownTarget = `        } else if (e.key === 'Delete') {
            QJ.DD.Workspace.deleteSelectedDoodad();
        } else if (e.key === 'g' || e.key === 'G') {`;

const keydownReplacement = `        } else if (e.key === 'Delete') {
            if (QJ.DD.Workspace.selectedEvent) {
                QJ.DD.Workspace.deleteSelectedEvent();
            } else {
                QJ.DD.Workspace.deleteSelectedDoodad();
            }
        } else if (e.key === 'g' || e.key === 'G') {`;

code = code.replace(keydownTarget, keydownReplacement);

const arrowKeyTarget = `        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (QJ.DD.Workspace.selectedDoodads && QJ.DD.Workspace.selectedDoodads.length > 0 ? QJ.DD.Workspace.selectedDoodads : (QJ.DD.Workspace.selectedDoodad ? [QJ.DD.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
            if (items.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                items.forEach(d => {
                    if (e.key === 'ArrowLeft') d.x -= step;
                    if (e.key === 'ArrowRight') d.x += step;
                    if (e.key === 'ArrowUp') d.y -= step;
                    if (e.key === 'ArrowDown') d.y += step;
                });
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
                QJ.DD.Workspace.refreshInspector();
            }
        } else if (e.key === 'Escape') {`;

const arrowKeyReplacement = `        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (QJ.DD.Workspace.selectedDoodads && QJ.DD.Workspace.selectedDoodads.length > 0 ? QJ.DD.Workspace.selectedDoodads : (QJ.DD.Workspace.selectedDoodad ? [QJ.DD.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
            if (items.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                items.forEach(d => {
                    if (e.key === 'ArrowLeft') d.x -= step;
                    if (e.key === 'ArrowRight') d.x += step;
                    if (e.key === 'ArrowUp') d.y -= step;
                    if (e.key === 'ArrowDown') d.y += step;
                });
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDoodadsQJ();
                }
                QJ.DD.Workspace.refreshInspector();
            } else if (QJ.DD.Workspace.selectedEvent) {
                e.preventDefault();
                const evInfo = QJ.DD.Workspace.selectedEvent;
                const ge = evInfo.gameEvent;
                const ev = evInfo.stagedEvent || (ge && ge.event());
                if (ev) {
                    const oldX = ev.x, oldY = ev.y;
                    let nx = ev.x, ny = ev.y;
                    if (e.key === 'ArrowLeft') nx--;
                    if (e.key === 'ArrowRight') nx++;
                    if (e.key === 'ArrowUp') ny--;
                    if (e.key === 'ArrowDown') ny++;
                    ev.x = nx; ev.y = ny;
                    if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; }
                    QJ.DD.Undo.execute({
                        type: 'move_event',
                        apply: () => { ev.x = nx; ev.y = ny; if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; } },
                        revert: () => { ev.x = oldX; ev.y = oldY; if (ge) { ge._x = oldX; ge._y = oldY; ge._realX = oldX; ge._realY = oldY; } }
                    });
                    QJ.DD.Workspace.refreshInspector();
                }
            }
        } else if (e.key === 'Escape') {`;

code = code.replace(arrowKeyTarget, arrowKeyReplacement);

fs.writeFileSync(pluginPath, code, 'utf8');
console.log("Successfully wrote updated QJ-Doodads.js! New size:", code.length, "bytes.");
