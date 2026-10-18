//==========================================================
// SECTION 16: DocsDoodads.SLICING.EDITOR (FULL INTERACTIVE MODAL)
//==========================================================
DocsDoodads.Slicing.Editor = {
    modal: null,
    asset: null,
    img: null,
    canvas: null,
    ctx: null,
    regions: [],
    selectedRegionIdx: -1,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    isDraggingHandle: false,
    activeHandle: null, // 'nw','n','ne','e','se','s','sw','w','body'
    dragStartMouse: { x: 0, y: 0 },
    dragStartRegion: null,
    isCreatingRegion: false,
    createStart: { x: 0, y: 0 },
    createCurrent: { x: 0, y: 0 },
    activeGuides: [], // alignment guides
    undoStack: [],
    redoStack: [],

    open(asset) {
        if (!asset || !asset.path) return;
        this.asset = asset;
        this.regions = JSON.parse(JSON.stringify(asset.slice.regions || []));
        this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.undoStack = [];
        this.redoStack = [];

        this.img = new Image();
        this.img.src = asset.path;
        this.img.onload = () => {
            this.buildUI();
            this.fitToScreen();
            this.render();
        };
    },

    // Auto-Slice. Large sheets are analysed after a frame, and pressing the button again (it reads Cancel)
    // stops it; returns a promise of the result, or null when cancelled.
    autoSlice() {
        const V = DocsDoodads.Slicing.Visual;
        const button = document.getElementById('dd-slicer-auto-btn');
        if (this._autoToken) {
            this._autoToken.isCancelled = true;
            return Promise.resolve(null);
        }
        const finish = res => {
            this.saveState();
            this.regions = res.regions;
            this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
            this.render();
            this.updateRegionList();
            const confidence = Math.round((Number(res.confidence) || 0) * 100);
            const verdict = res.status === 'review' ? 'Review required' : 'Auto-slice complete';
            DocsDoodads.Workspace.showToast(`${verdict}: ${this.regions.length} regions (${confidence}% confidence)`);
            return res;
        };
        const w = this.img.naturalWidth || this.img.width, h = this.img.naturalHeight || this.img.height;
        if (w * h <= this.asyncPixels) return Promise.resolve(finish(V.analyze(this.img)));
        const token = this._autoToken = { isCancelled: false };
        if (button) button.textContent = 'Cancel';
        return V.analyzeAsync(this.img, {}, null, token).then(res => {
            this._autoToken = null;
            if (button) button.textContent = 'Auto-Slice';
            if (!res) {
                DocsDoodads.Workspace.showToast('Auto-slice cancelled.');
                return null;
            }
            return finish(res);
        });
    },

    // Sheets bigger than this (2048 x 1024) are analysed asynchronously, with Cancel.
    asyncPixels: 2048 * 1024,

    // Merge: the selected region and the next one in the list become one region covering both.
    mergeWithNext() {
        const i = this.selectedRegionIdx;
        if (!(i >= 0 && i + 1 < this.regions.length)) return false;
        this.saveState();
        const a = this.regions[i], b = this.regions[i + 1];
        const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
        const merged = Object.assign({}, a, { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y });
        this.regions.splice(i, 2, merged);
        this.render();
        this.updateRegionList();
        return true;
    },

    // Reorder: moves the selected region up (-1) or down (1) the list (the export order).
    moveRegion(delta) {
        const i = this.selectedRegionIdx, j = i + delta;
        if (!(i >= 0 && i < this.regions.length && j >= 0 && j < this.regions.length)) return false;
        this.saveState();
        const [r] = this.regions.splice(i, 1);
        this.regions.splice(j, 0, r);
        this.selectedRegionIdx = j;
        this.render();
        this.updateRegionList();
        return true;
    },

    saveState() {
        this.undoStack.push(JSON.stringify(this.regions));
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
        this.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.undoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.redoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-slicer-undo');
        const rBtn = document.getElementById('dd-slicer-redo');
        if (uBtn) uBtn.style.opacity = this.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
    },

    fitToScreen() {
        const vp = document.getElementById('dd-slicer-canvas-container');
        if (!vp || !this.img) return;
        const availW = vp.clientWidth - 40;
        const availH = vp.clientHeight - 40;
        const scaleW = availW / this.img.naturalWidth;
        const scaleH = availH / this.img.naturalHeight;
        this.zoom = Math.min(Math.max(Math.min(scaleW, scaleH), 0.25), 4.0);
        this.panX = (vp.clientWidth - this.img.naturalWidth * this.zoom) / 2;
        this.panY = (vp.clientHeight - this.img.naturalHeight * this.zoom) / 2;
    },

    buildUI() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }

        const modal = document.createElement('div');
        modal.id = 'dd-slicer-modal-root';
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; bottom: 20px;
            z-index: 10005; display: flex; flex-direction: column; overflow: hidden;
            pointer-events: auto; font-family: 'Segoe UI', Roboto, sans-serif;
            border: 1px solid rgba(255,255,255,0.18);
        `;

        modal.innerHTML = `
            <!-- Top Toolbar -->
            <div style="height: 48px; background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: bold; color: #60a5fa; font-size: 13px;">SLICER: ${escapeHtml(this.asset.fileName)}</span>
                    <button class="dd-btn" id="dd-slicer-undo" title="Undo (Ctrl+Z)">Undo</button>
                    <button class="dd-btn" id="dd-slicer-redo" title="Redo (Ctrl+Y)">Redo</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-auto-btn" title="Detect sprite regions automatically">Auto-Slice</button>
                    <button class="dd-btn" id="dd-slicer-grid-btn" title="Slice into fixed grid">Fixed Grid</button>
                    <button class="dd-btn" id="dd-slicer-add-btn" title="Add region">Add Box</button>
                    <button class="dd-btn" id="dd-slicer-del-btn" title="Delete selected region">Delete</button>
                    <button class="dd-btn" id="dd-slicer-dup-btn" title="Duplicate selected">Duplicate</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn" id="dd-slicer-splitv-btn" title="Split vertical">Split Vert</button>
                    <button class="dd-btn" id="dd-slicer-splith-btn" title="Split horizontal">Split Horz</button>
                    <button class="dd-btn" id="dd-slicer-merge-btn" title="Merge the selected region with the next one in the list">Merge</button>
                    <button class="dd-btn" id="dd-slicer-up-btn" title="Move the selected region up the list">▲</button>
                    <button class="dd-btn" id="dd-slicer-down-btn" title="Move the selected region down the list">▼</button>
                    <button class="dd-btn" id="dd-slicer-export-btn" title="Export individual PNG files">Export PNGs</button>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-save-btn">Save Slices</button>
                    <button class="dd-btn" id="dd-slicer-close-btn" style="background: #ef4444; border-color: #dc2626;">Close</button>
                </div>
            </div>

            <!-- Workspace Body: Left Canvas Viewport + Right Region List -->
            <div style="flex: 1; display: flex; overflow: hidden; position: relative;">
                <!-- Canvas Container -->
                <div id="dd-slicer-canvas-container" style="flex: 1; background: #0b0f19; overflow: hidden; position: relative; cursor: default;">
                    <canvas id="dd-slicer-interactive-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>

                <!-- Right Sidebar: Region List & Inspector -->
                <div style="width: 320px; background: rgba(15, 23, 42, 0.95); border-left: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: bold; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
                        <span>REGIONS (<span id="dd-region-count">0</span>)</span>
                        <span id="dd-slicer-zoom-indicator" style="color: #60a5fa;">100%</span>
                    </div>
                    <div id="dd-region-list" style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                    </div>
                    <!-- Selected Region Properties -->
                    <div id="dd-region-inspector" style="padding: 12px; background: #111827; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px;">
                        <div style="color: #64748b; text-align: center;">No region selected</div>
                    </div>
                </div>
            </div>

            <!-- Bottom Status Bar -->
            <div style="height: 26px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: #64748b;">
                <span id="dd-slicer-hint">Mouse Wheel: Zoom (25%-1600%) | Space+Drag / Middle Click: Pan | Drag handle: Resize | Drag inside: Move | Drag empty: Create</span>
                <span id="dd-slicer-img-dim">${this.img.naturalWidth} x ${this.img.naturalHeight} px</span>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        this.canvas = document.getElementById('dd-slicer-interactive-canvas');
        this.ctx = this.canvas.getContext('2d');
        const container = document.getElementById('dd-slicer-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (!this._windowResizeListenerBound) {
            this._windowResizeListenerBound = true;
            window.addEventListener('resize', () => {
                const current = document.getElementById('dd-slicer-canvas-container');
                if (this.modal && current) {
                    this.canvas.width = current.clientWidth;
                    this.canvas.height = current.clientHeight;
                    this.render();
                }
            });
        }

        this.bindEvents();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    bindEvents() {
        const container = document.getElementById('dd-slicer-canvas-container');

        // Close & Save
        document.getElementById('dd-slicer-close-btn').onclick = () => this.close();
        document.getElementById('dd-slicer-save-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            this.asset.slice.status = "manual";
            DocsDoodads.AssetIndex.save();
            DocsDoodads.Workspace.refreshDrawerCards();
            DocsDoodads.Workspace.showToast("Slice Regions Saved!");
            this.close();
        };

        // Undo & Redo
        document.getElementById('dd-slicer-undo').onclick = () => this.undo();
        document.getElementById('dd-slicer-redo').onclick = () => this.redo();

        // Visual auto-slice
        document.getElementById('dd-slicer-auto-btn').onclick = () => this.autoSlice();

        // Fixed Grid
        document.getElementById('dd-slicer-grid-btn').onclick = () => {
            const input = prompt("Enter grid columns and rows (e.g. 8x4):", "4x2");
            if (!input) return;
            const parts = input.split(/[xX, ]+/);
            if (parts.length >= 2) {
                const cols = parseInt(parts[0], 10);
                const rows = parseInt(parts[1], 10);
                if (cols > 0 && rows > 0) {
                    this.saveState();
                    this.regions = DocsDoodads.Slicing.Grid.sliceToGrid(this.img.naturalWidth, this.img.naturalHeight, cols, rows);
                    this.selectedRegionIdx = 0;
                    this.render();
                    this.updateRegionList();
                    DocsDoodads.Workspace.showToast(`Sliced into ${cols}x${rows} Grid!`);
                }
            }
        };

        // Add, Delete, Duplicate
        document.getElementById('dd-slicer-add-btn').onclick = () => {
            this.saveState();
            const newReg = {
                id: 'reg_' + Date.now(),
                name: 'Region_' + (this.regions.length + 1),
                x: Math.round(this.img.naturalWidth / 2 - 24),
                y: Math.round(this.img.naturalHeight / 2 - 24),
                w: 48, h: 48,
                pivotX: 0.5, pivotY: 1.0
            };
            this.regions.push(newReg);
            this.selectedRegionIdx = this.regions.length - 1;
            this.render();
            this.updateRegionList();
        };

        document.getElementById('dd-slicer-del-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                this.regions.splice(this.selectedRegionIdx, 1);
                this.selectedRegionIdx = Math.min(this.selectedRegionIdx, this.regions.length - 1);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-dup-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const dup = JSON.parse(JSON.stringify(cur));
                dup.id = 'reg_' + Date.now();
                dup.name = dup.name + '_copy';
                dup.x += 16; dup.y += 16;
                this.regions.push(dup);
                this.selectedRegionIdx = this.regions.length - 1;
                this.render();
                this.updateRegionList();
            }
        };

        // Split
        document.getElementById('dd-slicer-splitv-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfW = Math.round(cur.w / 2);
                const a = { ...cur, w: halfW };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', x: cur.x + halfW, w: cur.w - halfW };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-splith-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfH = Math.round(cur.h / 2);
                const a = { ...cur, h: halfH };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', y: cur.y + halfH, h: cur.h - halfH };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-merge-btn').onclick = () => this.mergeWithNext();
        document.getElementById('dd-slicer-up-btn').onclick = () => this.moveRegion(-1);
        document.getElementById('dd-slicer-down-btn').onclick = () => this.moveRegion(1);

        document.getElementById('dd-slicer-export-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            DocsDoodads.Export.exportSlices(this.asset);
        };

        // Mouse interactions on Canvas
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.min(Math.max(this.zoom * factor, 0.25), 16.0);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom centered on cursor
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            const ind = document.getElementById('dd-slicer-zoom-indicator');
            if (ind) ind.textContent = Math.round(this.zoom * 100) + '%';
            this.render();
        });

        container.addEventListener('mousedown', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Middle click or Space held -> Pan
            if (e.button === 1 || e.spaceKey || e.altKey) {
                this.isPanning = true;
                this.panStartX = mouseX - this.panX;
                this.panStartY = mouseY - this.panY;
                container.style.cursor = 'grab';
                return;
            }

            if (e.button === 0) {
                // Check if over handle of selected region
                if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                    const r = this.regions[this.selectedRegionIdx];
                    const handle = this.hitTestHandles(mouseX, mouseY, r);
                    if (handle) {
                        this.saveState();
                        this.isDraggingHandle = true;
                        this.activeHandle = handle;
                        this.dragStartMouse = { x: mouseX, y: mouseY };
                        this.dragStartRegion = { ...r };
                        return;
                    }
                }

                // Check if clicking inside any region
                const clickedIdx = this.hitTestRegions(mouseX, mouseY);
                if (clickedIdx >= 0) {
                    this.saveState();
                    this.selectedRegionIdx = clickedIdx;
                    this.isDraggingHandle = true;
                    this.activeHandle = 'body';
                    this.dragStartMouse = { x: mouseX, y: mouseY };
                    this.dragStartRegion = { ...this.regions[clickedIdx] };
                    this.render();
                    this.updateRegionList();
                    return;
                }

                // Otherwise, start creating new region
                this.isCreatingRegion = true;
                const imgCoords = this.screenToImage(mouseX, mouseY);
                this.createStart = imgCoords;
                this.createCurrent = imgCoords;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.modal) return;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanning) {
                this.panX = mouseX - this.panStartX;
                this.panY = mouseY - this.panStartY;
                this.render();
                return;
            }

            if (this.isDraggingHandle && this.dragStartRegion) {
                const imgNow = this.screenToImage(mouseX, mouseY);
                const imgStart = this.screenToImage(this.dragStartMouse.x, this.dragStartMouse.y);
                const dx = Math.round(imgNow.x - imgStart.x);
                const dy = Math.round(imgNow.y - imgStart.y);
                const r = this.regions[this.selectedRegionIdx];
                const s = this.dragStartRegion;

                this.activeGuides = [];
                let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

                if (this.activeHandle === 'body') {
                    nx = s.x + dx;
                    ny = s.y + dy;
                    // Snapping
                    nx = this.snapCoordX(nx, nw);
                    ny = this.snapCoordY(ny, nh);
                } else if (this.activeHandle === 'se') {
                    nw = Math.max(s.w + dx, 4);
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'e') {
                    nw = Math.max(s.w + dx, 4);
                } else if (this.activeHandle === 's') {
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'nw') {
                    nx = s.x + dx; ny = s.y + dy;
                    nw = s.w - dx; nh = s.h - dy;
                } else if (this.activeHandle === 'w') {
                    nx = s.x + dx; nw = s.w - dx;
                } else if (this.activeHandle === 'n') {
                    ny = s.y + dy; nh = s.h - dy;
                }

                r.x = Math.max(0, nx);
                r.y = Math.max(0, ny);
                r.w = Math.max(4, nw);
                r.h = Math.max(4, nh);
                this.render();
                this.updateInspectorValues();
                return;
            }

            if (this.isCreatingRegion) {
                this.createCurrent = this.screenToImage(mouseX, mouseY);
                this.render();
                return;
            }

            // Update hover cursor
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                const h = this.hitTestHandles(mouseX, mouseY, this.regions[this.selectedRegionIdx]);
                if (h) {
                    container.style.cursor = h === 'body' ? 'move' : h + '-resize';
                    return;
                }
            }
            container.style.cursor = 'crosshair';
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                container.style.cursor = 'default';
            }
            if (this.isDraggingHandle) {
                this.isDraggingHandle = false;
                this.activeHandle = null;
                this.activeGuides = [];
                this.render();
                this.updateRegionList();
            }
            if (this.isCreatingRegion) {
                this.isCreatingRegion = false;
                const minX = Math.round(Math.min(this.createStart.x, this.createCurrent.x));
                const minY = Math.round(Math.min(this.createStart.y, this.createCurrent.y));
                const rw = Math.round(Math.abs(this.createCurrent.x - this.createStart.x));
                const rh = Math.round(Math.abs(this.createCurrent.y - this.createStart.y));

                if (rw >= 6 && rh >= 6) {
                    this.saveState();
                    const newReg = {
                        id: 'reg_' + Date.now(),
                        name: 'Region_' + (this.regions.length + 1),
                        x: Math.max(0, minX),
                        y: Math.max(0, minY),
                        w: rw, h: rh,
                        pivotX: 0.5, pivotY: 1.0
                    };
                    this.regions.push(newReg);
                    this.selectedRegionIdx = this.regions.length - 1;
                    this.render();
                    this.updateRegionList();
                } else {
                    this.render();
                }
            }
        });

        // bindEvents runs on every open; window listeners must only be registered once.
        if (!this._windowKeyListenerBound) {
            this._windowKeyListenerBound = true;
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
    },

    handleKeyDown(e) {
        if (!this.modal) return;
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        if (DocsDoodads.isEditableTarget(e.target)) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            document.getElementById('dd-slicer-del-btn').click();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            this.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            this.redo();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            document.getElementById('dd-slicer-dup-btn').click();
        }
    },

    snapCoordX(x, w) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(x) < snapDist) {
            this.activeGuides.push({ type: 'v', x: 0 });
            return 0;
        }
        if (Math.abs(x + w - this.img.naturalWidth) < snapDist) {
            this.activeGuides.push({ type: 'v', x: this.img.naturalWidth });
            return this.img.naturalWidth - w;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(x - other.x) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x });
                return other.x;
            }
            if (Math.abs(x - (other.x + other.w)) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x + other.w });
                return other.x + other.w;
            }
        }
        return x;
    },

    snapCoordY(y, h) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(y) < snapDist) {
            this.activeGuides.push({ type: 'h', y: 0 });
            return 0;
        }
        if (Math.abs(y + h - this.img.naturalHeight) < snapDist) {
            this.activeGuides.push({ type: 'h', y: this.img.naturalHeight });
            return this.img.naturalHeight - h;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(y - other.y) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y });
                return other.y;
            }
            if (Math.abs(y - (other.y + other.h)) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y + other.h });
                return other.y + other.h;
            }
        }
        return y;
    },

    screenToImage(sx, sy) {
        return {
            x: (sx - this.panX) / this.zoom,
            y: (sy - this.panY) / this.zoom
        };
    },

    imageToScreen(ix, iy) {
        return {
            x: ix * this.zoom + this.panX,
            y: iy * this.zoom + this.panY
        };
    },

    hitTestRegions(sx, sy) {
        const img = this.screenToImage(sx, sy);
        for (let i = this.regions.length - 1; i >= 0; i--) {
            const r = this.regions[i];
            if (img.x >= r.x && img.x <= r.x + r.w && img.y >= r.y && img.y <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    },

    hitTestHandles(sx, sy, r) {
        const sTopLeft = this.imageToScreen(r.x, r.y);
        const sW = r.w * this.zoom;
        const sH = r.h * this.zoom;
        const hSize = 8;

        const handles = {
            nw: { x: sTopLeft.x, y: sTopLeft.y },
            ne: { x: sTopLeft.x + sW, y: sTopLeft.y },
            se: { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
            sw: { x: sTopLeft.x, y: sTopLeft.y + sH },
            n:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
            e:  { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
            s:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
            w:  { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
        };

        for (const k in handles) {
            const h = handles[k];
            if (Math.abs(sx - h.x) <= hSize && Math.abs(sy - h.y) <= hSize) {
                return k;
            }
        }
        if (sx >= sTopLeft.x && sx <= sTopLeft.x + sW && sy >= sTopLeft.y && sy <= sTopLeft.y + sH) {
            return 'body';
        }
        return null;
    },

    render() {
        if (!this.ctx || !this.img) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Checkerboard background pattern
        const chkSize = 16;
        for (let y = 0; y < h; y += chkSize) {
            for (let x = 0; x < w; x += chkSize) {
                ctx.fillStyle = ((x / chkSize + y / chkSize) % 2 === 0) ? '#0f172a' : '#1e293b';
                ctx.fillRect(x, y, chkSize, chkSize);
            }
        }

        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        // 2. Source Sprite Sheet Image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.img, 0, 0);

        // 3. Pixel grid at high zoom (>= 4.0)
        if (this.zoom >= 4.0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1 / this.zoom;
            for (let x = 0; x <= this.img.naturalWidth; x++) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.img.naturalHeight); ctx.stroke();
            }
            for (let y = 0; y <= this.img.naturalHeight; y++) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.img.naturalWidth, y); ctx.stroke();
            }
        }

        // 4. Draw Regions
        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const isSel = i === this.selectedRegionIdx;

            ctx.fillStyle = isSel ? 'rgba(234, 179, 8, 0.22)' : 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(r.x, r.y, r.w, r.h);

            ctx.strokeStyle = isSel ? '#eab308' : '#38bdf8';
            ctx.lineWidth = (isSel ? 2 : 1) / this.zoom;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Pivot Crosshair
            const px = r.x + (r.pivotX !== undefined ? r.pivotX : 0.5) * r.w;
            const py = r.y + (r.pivotY !== undefined ? r.pivotY : 1.0) * r.h;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1 / this.zoom;
            ctx.beginPath();
            ctx.moveTo(px - 4 / this.zoom, py); ctx.lineTo(px + 4 / this.zoom, py);
            ctx.moveTo(px, py - 4 / this.zoom); ctx.lineTo(px, py + 4 / this.zoom);
            ctx.stroke();

            // Label
            ctx.fillStyle = isSel ? '#fef08a' : '#e0f2fe';
            ctx.font = `bold ${Math.max(10 / this.zoom, 8)}px sans-serif`;
            ctx.fillText(`#${i + 1} ${r.w}x${r.h}`, r.x + 2 / this.zoom, r.y + 10 / this.zoom);
        }

        // Draw In-progress creation rectangle
        if (this.isCreatingRegion) {
            const minX = Math.min(this.createStart.x, this.createCurrent.x);
            const minY = Math.min(this.createStart.y, this.createCurrent.y);
            const rw = Math.abs(this.createCurrent.x - this.createStart.x);
            const rh = Math.abs(this.createCurrent.y - this.createStart.y);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fillRect(minX, minY, rw, rh);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1 / this.zoom;
            ctx.strokeRect(minX, minY, rw, rh);
        }

        ctx.restore();

        // 5. Draw 8 Handles for Selected Region in Screen Space
        if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
            const r = this.regions[this.selectedRegionIdx];
            const sTopLeft = this.imageToScreen(r.x, r.y);
            const sW = r.w * this.zoom;
            const sH = r.h * this.zoom;
            const hPoints = [
                { x: sTopLeft.x, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
            ];

            ctx.fillStyle = '#eab308';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            for (const hp of hPoints) {
                ctx.fillRect(hp.x - 4, hp.y - 4, 8, 8);
                ctx.strokeRect(hp.x - 4, hp.y - 4, 8, 8);
            }
        }

        // 6. Draw Alignment Guides
        if (this.activeGuides.length > 0) {
            ctx.strokeStyle = '#ec4899';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (const g of this.activeGuides) {
                if (g.type === 'v') {
                    const scrX = this.imageToScreen(g.x, 0).x;
                    ctx.beginPath(); ctx.moveTo(scrX, 0); ctx.lineTo(scrX, h); ctx.stroke();
                } else if (g.type === 'h') {
                    const scrY = this.imageToScreen(0, g.y).y;
                    ctx.beginPath(); ctx.moveTo(0, scrY); ctx.lineTo(w, scrY); ctx.stroke();
                }
            }
            ctx.setLineDash([]);
        }
    },

    updateRegionList() {
        const countEl = document.getElementById('dd-region-count');
        if (countEl) countEl.textContent = this.regions.length;
        const listEl = document.getElementById('dd-region-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const item = document.createElement('div');
            item.className = 'dd-btn' + (i === this.selectedRegionIdx ? ' dd-btn-active' : '');
            item.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                padding: 6px 8px; font-size: 11px; text-align: left;
            `;
            item.innerHTML = `
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                    <strong>#${i + 1}</strong> ${escapeHtml(r.name || 'Region')}
                    <span style="color: #64748b; margin-left: 4px;">(${r.w}x${r.h})</span>
                </div>
                <span style="color: #94a3b8; font-size: 10px;">${r.x},${r.y}</span>
            `;
            item.onclick = () => {
                this.selectedRegionIdx = i;
                this.render();
                this.updateRegionList();
            };
            listEl.appendChild(item);
        }
        this.updateInspectorValues();
    },

    updateInspectorValues() {
        const insp = document.getElementById('dd-region-inspector');
        if (!insp) return;
        if (this.selectedRegionIdx < 0 || this.selectedRegionIdx >= this.regions.length) {
            insp.innerHTML = '<div style="color: #64748b; text-align: center;">No region selected</div>';
            return;
        }

        const r = this.regions[this.selectedRegionIdx];
        insp.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 8px;">Region #${this.selectedRegionIdx + 1} Properties</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">X:</label>
                    <input type="number" id="dd-insp-rx" value="${r.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Y:</label>
                    <input type="number" id="dd-insp-ry" value="${r.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Width:</label>
                    <input type="number" id="dd-insp-rw" value="${r.w}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Height:</label>
                    <input type="number" id="dd-insp-rh" value="${r.h}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
            <div style="margin-top: 6px;">
                <label style="color: #94a3b8; font-size: 10px;">Name:</label>
                <input type="text" id="dd-insp-name" value="${escapeHtml(r.name || '')}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot X:</label>
                    <input type="number" step="0.1" id="dd-insp-pivx" value="${r.pivotX !== undefined ? r.pivotX : 0.5}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot Y:</label>
                    <input type="number" step="0.1" id="dd-insp-pivy" value="${r.pivotY !== undefined ? r.pivotY : 1.0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
        `;

        const rx = document.getElementById('dd-insp-rx');
        const ry = document.getElementById('dd-insp-ry');
        const rw = document.getElementById('dd-insp-rw');
        const rh = document.getElementById('dd-insp-rh');
        const rname = document.getElementById('dd-insp-name');
        const pivx = document.getElementById('dd-insp-pivx');
        const pivy = document.getElementById('dd-insp-pivy');

        const applyInputs = () => {
            r.x = parseInt(rx.value, 10) || 0;
            r.y = parseInt(ry.value, 10) || 0;
            r.w = Math.max(4, parseInt(rw.value, 10) || 4);
            r.h = Math.max(4, parseInt(rh.value, 10) || 4);
            r.name = rname.value;
            // 0 is a valid pivot (left/top edge); only blank or invalid input falls back.
            const px = parseFloat(pivx.value), py = parseFloat(pivy.value);
            r.pivotX = Number.isFinite(px) ? px : 0.5;
            r.pivotY = Number.isFinite(py) ? py : 1.0;
            this.render();
        };

        rx.onchange = applyInputs;
        ry.onchange = applyInputs;
        rw.onchange = applyInputs;
        rh.onchange = applyInputs;
        rname.onchange = applyInputs;
        pivx.onchange = applyInputs;
        pivy.onchange = applyInputs;
    },

    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }
};


