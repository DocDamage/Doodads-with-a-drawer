    // ---- The mouse on the map: listeners, camera drags, scatter, the eyedropper, hit tests and picking ----
    attachCanvasListeners() {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas) return;
        this.setCanvasOverlaysPassthrough(true);

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

                if (payload.category === 'Audio') return this.askAudioDrop(payload, coords);

                if (payload.type === 'prefab') {
                    this.placePrefab(DocsDoodads.Prefabs.get(payload.prefabId), e.altKey ? coords : this.snapToTile(coords));
                    return;
                }
                if (payload.placementMode === 'ask') {
                    this.showAskEventModal(payload, coords, e.altKey);
                } else {
                    const snapCoords = e.altKey ? coords : this.snapToTile(coords);
                    this.commitPlacement(payload, snapCoords, payload.placementMode);
                }
            }
        };

        this._onCanvasContextMenu = (e) => {
            if (!this.mounted) return;
            e.preventDefault();
            // With Scatter out, the right button erases instead.
            if (this.placementTool === 'brush') return;
            const coords = this.clientToMapCoords(e.clientX, e.clientY);
            const items = [];

            // Check if right-clicking placed doodad
            const clickedDoodad = this.doodadAt(coords.x, coords.y);

            if (clickedDoodad) {
                // Right-clicking one of several picked doodads keeps them all picked.
                if (!this.selectionItems().includes(clickedDoodad)) this.selectDoodad(clickedDoodad);
                // Like Duplicate, Lock, Hide and Move to Layer, the order acts on everything picked.
                items.push({ label: 'Bring Forward (+1 Z)', icon: '⬆️', onClick: () => this.bringForward() });
                items.push({ label: 'Send Backward (-1 Z)', icon: '⬇️', onClick: () => this.sendBackward() });
                items.push({ label: 'Bring to Front', icon: '⏫', onClick: () => this.bringToFront() });
                items.push({ label: 'Send to Back', icon: '⏬', onClick: () => this.sendToBack() });
                items.push({ separator: true });
                items.push({ label: DocsDoodads.Shortcuts.tip('duplicate', 'Duplicate'), icon: '📄', onClick: () => this.duplicateSelectedDoodad() });
                items.push({ label: clickedDoodad.locked ? 'Unlock' : 'Lock', icon: clickedDoodad.locked ? '🔓' : '🔒', onClick: () => this.lockSelected(!clickedDoodad.locked) });
                items.push({ label: 'Hide in Editor', icon: '👁️', onClick: () => this.hideSelected(true) });
                const layers = DocsDoodads.Layers.list(DocsDoodads.Lighting.mapSettings(this.currentMapId()));
                const onLayer = DocsDoodads.Layers.of(clickedDoodad);
                for (const layer of layers.length > 1 ? layers : []) {
                    if (layer.id !== onLayer) items.push({ label: `Move to Layer: ${layer.name}`, icon: '🗂️', onClick: () => this.moveSelectionToLayer(layer.id) });
                }
                items.push({ separator: true });
                items.push({ label: 'Select Same Art', icon: '🖼️', onClick: () => this.selectSameArt(clickedDoodad) });
                if (layers.length > 1) {
                    const layerName = (layers.find(l => l.id === onLayer) || { name: 'Main' }).name;
                    items.push({ label: `Select Everything on ${layerName}`, icon: '🗂️', onClick: () => this.selectLayer(onLayer) });
                }
                if (clickedDoodad.bit && clickedDoodad.bit[0] === 3) items.push({ label: 'Replace Art...', icon: '🔁', onClick: () => this.showReplaceArt() });
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
                        label: 'Save as Event Template...', icon: '💾', onClick: () => this.saveEventAsTemplate(evObj, evObj.name || ("Template_EV" + ge.eventId()))
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
                items.push({ label: DocsDoodads.Shortcuts.tip('paste', `Paste ${this._clipboardDoodads.length} Doodad(s)`), icon: '📑', onClick: () => this.pasteCopied() });
                items.push({ label: DocsDoodads.Shortcuts.tip('pasteInPlace', 'Paste in Place'), icon: '📌', onClick: () => this.pasteCopied(true) });
            }
            items.push({ label: DocsDoodads.Shortcuts.tip('selectAll', 'Select All'), icon: '⬚', onClick: () => this.selectAllDoodads() });
            if (this.selectionItems().length > 0) items.push({ label: 'Invert Selection', icon: '◪', onClick: () => this.invertSelection() });
            const hiddenCount = this.hiddenDoodads().length;
            if (hiddenCount > 0) items.push({ label: `Show Hidden Doodads (${hiddenCount})`, icon: '👁️', onClick: () => this.showHiddenDoodads() });
            if (this.selectedAsset) {
                items.push({ label: `Stamp ${this.selectedAsset.fileName} Here`, icon: '📌', onClick: () => this.commitPlacement(this.selectedAsset, coords) });
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
            const hook = this.toolHooks[this.placementTool];
            if (hook && hook.click) {
                hook.click.call(this, coords, e);
                return;
            }

            // 1. Eyedropper Tool or Alt held
            if (this.placementTool === 'eyedropper' || e.altKey) {
                this.handleEyedropper(coords);
                return;
            }

            // 2. Path Tool: collect points
            if (this.placementTool === 'path') {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('First pick a picture in the Item Bag to draw a path with.');
                    return;
                }
                this.pathPoints.push(e.altKey ? { x: coords.x, y: coords.y } : this.snapToTile(coords));
                return;
            }

            if (this.placementTool === 'listen') {
                this.listenHere(coords.tileX, coords.tileY);
                return;
            }
            if (this.placementTool === 'reach') {
                this.setPlacementTool(null);
                this.checkReach({ x: coords.tileX, y: coords.tileY });
                return;
            }

            // 3. Stamp Tool
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                const snapCoords = e.altKey ? coords : this.snapToTile(coords);
                this.commitPlacement(this.selectedAsset, snapCoords);
                return;
            }

            // 3. Normal Pointer: Select placed doodad or MZ event
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };

        this._onCanvasMouseDown = (e) => {
            if (e.button === 1 && this.beginCameraDrag(e)) return;
            const hook = this.toolHooks[this.placementTool];
            if (hook && hook.down && e.button === 0) {
                if (hook.down.call(this, e)) {
                    this.isBrushActive = true;
                    this._hookStroke = hook;
                }
                return;
            }
            if (this.placementTool === 'brush' && e.button === 2) {
                this.beginScatterErase(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'brush' && this.selectedAsset && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.scatterAt(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'terrain' && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.beginTerrainStroke(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'region' && e.button === 0) {
                if (e.altKey) {
                    this.pickRegionAt(e.clientX, e.clientY);
                    return;
                }
                if (this.beginRegionStroke(e.clientX, e.clientY)) this.isBrushActive = true;
                return;
            }
            if (this.placementTool === 'biome' && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this._lastDab = null;
                this.biomePaintAt(e.clientX, e.clientY);
                return;
            }
            if (!this.placementTool && e.button === 0) {
                const handle = this.handleAt(this.clientToCanvas(e.clientX, e.clientY));
                if (handle && this.beginHandleDrag(handle, this.clientToCanvas(e.clientX, e.clientY))) return;
            }
            if (!this.placementTool && e.button === 0 && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                const point = this.clientToMapCoords(e.clientX, e.clientY);
                if (this.beginDoodadDrag(point)) {
                    this._dragClientStart = { x: e.clientX, y: e.clientY };
                    this._dragActive = false;
                    return;
                }
            }
            if (!this.placementTool && e.button === 0) {
                this.isMarqueeActive = true;
                this.marqueeStartClient = { x: e.clientX, y: e.clientY };
                this.marqueeShift = e.shiftKey;
                this.hasMarqueeMoved = false;
                // Alt+drag: a lasso; Ctrl+drag: a box that picks what it touches; a plain box picks feet inside it.
                this.marqueeMode = e.altKey ? 'lasso' : (e.ctrlKey || e.metaKey) ? 'touch' : 'feet';
                this._lasso = this.marqueeMode === 'lasso' ? [{ x: e.clientX, y: e.clientY }] : null;
            }
        };

        this._onCanvasMouseMove = (e) => {
            // The button came up outside the window: the stroke ends there, not on the next hover.
            if (this.isBrushActive && e.buttons === 0) {
                this._onCanvasMouseUp(e);
                return;
            }
            if (this._camDrag) {
                this.updateCameraDrag(e);
                return;
            }
            this.trackCursor(e.clientX, e.clientY, e.target);
            if (this._handleDrag) {
                if (e.buttons === 0) { if (this.endHandleDrag()) this._suppressNextClick = true; return; }
                this.updateHandleDrag(this.clientToCanvas(e.clientX, e.clientY), e.shiftKey);
                this.showHandleReadout(e.clientX, e.clientY);
                return;
            }
            // A resize or turn cursor over the handles.
            if (!this.placementTool && !this._drag) {
                const canvas = DocsDoodads.Compat.getCanvas();
                const over = this.handleAt(this.clientToCanvas(e.clientX, e.clientY));
                if (canvas && canvas.style) canvas.style.cursor = !over ? '' : over.kind === 'rotate' ? 'grab'
                    : (over.corner === 'nw' || over.corner === 'se' ? 'nwse-resize' : 'nesw-resize');
            }
            if (this._drag) {
                // The mouse-up was missed (e.g. focus left the window): finish where the drag last was.
                if (e.buttons === 0) {
                    if (this.endDoodadDrag()) this._suppressNextClick = true;
                    this._dragActive = false;
                    return;
                }
                // A small wobble while clicking is not a move.
                if (!this._dragActive && Math.hypot(e.clientX - this._dragClientStart.x, e.clientY - this._dragClientStart.y) < 4) return;
                this._dragActive = true;
                this.updateDoodadDrag(this.clientToMapCoords(e.clientX, e.clientY), { shiftKey: e.shiftKey, altKey: e.altKey });
                this.showDragReadout(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'path') {
                const hover = this.clientToMapCoords(e.clientX, e.clientY);
                this._pathHover = e.altKey ? { x: hover.x, y: hover.y } : this.snapToTile(hover);
                return;
            }
            if (this.placementTool === 'terrain' && !this.isBrushActive) this.trackTerrainHover(e);
            const hook = this.toolHooks[this.placementTool];
            if (hook && hook.move) hook.move.call(this, e, Boolean(this.isBrushActive && this._hookStroke === hook));
            if (this.placementTool === 'region') {
                this.trackRegionHover(e);
                if (this.isBrushActive && this._regionStroke) this.regionPaintAt(e.clientX, e.clientY);
            }
            if (this.placementTool === 'brush') this._brushHover = this.clientToMapCoords(e.clientX, e.clientY);
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this._scatterErase) {
                this.scatterEraseAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'biome') {
                this.biomePaintAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'terrain') {
                this.terrainPaintAt(e.clientX, e.clientY);
                this.trackTerrainHover(e);
            } else if (this.isMarqueeActive && this.marqueeStartClient && this.marqueeMode === 'lasso') {
                const last = this._lasso[this._lasso.length - 1];
                if (Math.hypot(e.clientX - last.x, e.clientY - last.y) > 3) this._lasso.push({ x: e.clientX, y: e.clientY });
                if (Math.hypot(e.clientX - this.marqueeStartClient.x, e.clientY - this.marqueeStartClient.y) > 5) {
                    this.hasMarqueeMoved = true;
                    this.drawLasso(this._lasso);
                }
            } else if (this.isMarqueeActive && this.marqueeStartClient) {
                const dx = e.clientX - this.marqueeStartClient.x;
                const dy = e.clientY - this.marqueeStartClient.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasMarqueeMoved = true;
                    let overlay = document.getElementById('dd-marquee-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'dd-marquee-overlay';
                        overlay.style.cssText = `
                            position: fixed; pointer-events: none; z-index: 10006;
                            border: 1px dashed var(--dd-primary); background: rgba(56, 189, 248, 0.18);
                            box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
                            border-radius: 2px;
                        `;
                        document.body.appendChild(overlay);
                    }
                    const left = Math.min(this.marqueeStartClient.x, e.clientX);
                    const top = Math.min(this.marqueeStartClient.y, e.clientY);
                    overlay.style.left = left + 'px';
                    overlay.style.top = top + 'px';
                    overlay.style.width = Math.abs(dx) + 'px';
                    overlay.style.height = Math.abs(dy) + 'px';
                }
            }
        };

        this._onCanvasMouseUp = (e) => {
            if (this._camDrag) {
                this.endCameraDrag();
                return;
            }
            if (this._handleDrag) {
                // The click that follows must not pick something else.
                this.endHandleDrag();
                this._suppressNextClick = true;
                return;
            }
            if (this._drag) {
                if (this.endDoodadDrag()) this._suppressNextClick = true;
                this._dragActive = false;
                return;
            }
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this._scatterErase) this.endScatterErase();
                if (this._terrainStroke) this.endTerrainStroke();
                if (this._regionStroke) this.endRegionStroke();
                if (this._hookStroke) {
                    const hook = this._hookStroke;
                    this._hookStroke = null;
                    if (hook.up) hook.up.call(this, e);
                }
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        },
                        revert: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        }
                    };
                    cmd.type = this.placementTool === 'biome' ? 'biome_paint' : 'scatter_doodads';
                    DocsDoodads.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
            if (this.isMarqueeActive) {
                for (const id of ['dd-marquee-overlay', 'dd-lasso-overlay']) {
                    const overlay = document.getElementById(id);
                    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                }
                if (this.hasMarqueeMoved && this.marqueeStartClient) {
                    const end = { x: e.clientX, y: e.clientY };
                    const enclosed = this.marqueeMode === 'lasso' ? this.doodadsInClientLasso(this._lasso.concat([end]))
                        : this.marqueeMode === 'touch' ? this.doodadsTouchingClientBox(this.marqueeStartClient, end)
                            : this.doodadsInClientBox(this.marqueeStartClient, end);

                    if (this.marqueeShift) {
                        const current = this.selectedDoodads ? [...this.selectedDoodads] : [];
                        enclosed.forEach(d => {
                            if (!current.includes(d)) current.push(d);
                        });
                        this.selectDoodads(current);
                    } else {
                        this.selectDoodads(enclosed);
                    }
                    this._suppressNextClick = true;
                    this.showToast(`Marquee: Selected ${enclosed.length} doodad(s)`);
                }
                this.isMarqueeActive = false;
            }
        };

        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
            canvas.addEventListener('contextmenu', this._onCanvasContextMenu);
            this._onCanvasWheel = (e) => this.wheelCamera(e);
            canvas.addEventListener('wheel', this._onCanvasWheel, { passive: false });
            this._onCanvasDblClick = (e) => {
                if (this.placementTool === 'path') {
                    e.preventDefault();
                    this.finishPath();
                }
            };
            canvas.addEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('mousemove', this._onCanvasMouseMove);
            window.addEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // ---- 3D camera with the mouse (editor only) ----
    // Middle-drag orbits, Shift + middle-drag pans, the wheel zooms, a middle click resets. The view is a
    // camera change for this visit (like Set Camera): the map's own camera settings are not changed.
    canvasPoint(e) {
        if (typeof Graphics !== 'undefined' && Graphics.pageToCanvasX) return { x: Graphics.pageToCanvasX(e.pageX), y: Graphics.pageToCanvasY(e.pageY) };
        return { x: e.clientX, y: e.clientY };
    },

    beginCameraDrag(e) {
        if (!this.mounted || !DocsDoodads.Perspective.liveCamera()) return false;
        if (e.preventDefault) e.preventDefault();
        const at = this.canvasPoint(e);
        const cam = DocsDoodads.Perspective.liveCamera();
        this._camDrag = { x: e.clientX, y: e.clientY, pan: Boolean(e.shiftKey), moved: false,
            ground: DocsDoodads.Perspective.unproject(cam, at.x, at.y) };
        return true;
    },

    updateCameraDrag(e) {
        const drag = this._camDrag;
        const P = DocsDoodads.Perspective;
        const s = P.active();
        if (!s || e.buttons === 0) return this.endCameraDrag();
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        if (drag.pan) {
            // Keep the ground point grabbed under the mouse.
            const cam = P.liveCamera(), at = this.canvasPoint(e);
            const now = cam && drag.ground ? P.unproject(cam, at.x, at.y) : null;
            if (now) {
                const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
                $gameMap.setDisplayPos($gameMap.displayX() + (drag.ground.x - now.x) / tw, $gameMap.displayY() + (drag.ground.y - now.y) / th);
            }
        } else {
            this.setCameraView(P.orbit(s, dx, dy));
            drag.x = e.clientX;
            drag.y = e.clientY;
        }
    },

    endCameraDrag() {
        const drag = this._camDrag;
        this._camDrag = null;
        if (drag && !drag.moved) {
            this.setCameraView(null);
            if (typeof $gamePlayer !== 'undefined' && $gamePlayer) $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
            this.showToast("3D view reset to the map's camera");
        }
    },

    wheelCamera(e) {
        if (!this.mounted || !DocsDoodads.Perspective.liveCamera()) return;
        e.preventDefault();
        const s = DocsDoodads.Perspective.active();
        if (s) this.setCameraView({ zoom: DocsDoodads.Perspective.wheelZoom(s.zoom, e.deltaY) });
    },

    // null goes back to the map's own camera.
    setCameraView(change) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        $gameMap._docsCameraTween = null;
        $gameMap._docsCamera = change ? Object.assign({}, $gameMap._docsCamera, change) : null;
    },

    detachCanvasListeners() {
        this.setCanvasOverlaysPassthrough(false);
        const canvas = DocsDoodads.Compat.getCanvas();
        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
            if (this._onCanvasDblClick) canvas.removeEventListener('dblclick', this._onCanvasDblClick);
            if (this._onCanvasWheel) canvas.removeEventListener('wheel', this._onCanvasWheel);
        }
        this._camDrag = null;
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
            if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // Evenly spaced scatter: props keep minDistance from each other and from what is already there,
    // and only land where the region/terrain/passability rules allow.
    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        this._scatterRng = this._scatterRng || DocsDoodads.Scatter.rng(Date.now());
        const rng = this._scatterRng;
        const reach = b.radius + (b.minDistance || 0);
        const existing = list.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        const points = DocsDoodads.Scatter.candidates(coords, b.radius, b.minDistance || 0, existing, b.density, rng);
        const rules = {
            regions: DocsDoodads.Scatter.parseIdList(b.regions),
            terrainTags: DocsDoodads.Scatter.parseIdList(b.terrainTags),
            avoidBlocked: Boolean(b.avoidBlocked)
        };
        const query = this.scatterQuery();

        const placed = [];
        for (const p of points) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const v = DocsDoodads.Scatter.variation(b, rng);
            const d = this.newDoodadFromAsset(asset, Math.round(p.x), Math.round(p.y));
            d.scaleX = v.scale * (v.flipX ? -1 : 1);
            d.scaleY = v.scale;
            d.rotation = v.rotation;
            if (v.hue) d.hue = v.hue;
            for (const item of this.withMirrors(d)) {
                list.push(item);
                this.currentBrushBatch.push(item);
                placed.push(item);
            }
        }
        this.addDoodadSprites(placed);
    },

    // Scatter's eraser (right-drag): takes away the picked item's doodads inside the brush circle, never
    // locked ones or ones on hidden or locked layers. One undo step a stroke.
    beginScatterErase(clientX, clientY) {
        if (!this.selectedAsset || !this.selectedAsset.path) {
            this.showToast('Pick the item to erase in the Item Bag first.', 'info');
            return false;
        }
        const mapId = this.currentMapId();
        this.isBrushActive = true;
        this.currentBrushBatch = [];
        this._scatterErase = { mapId, key: this.artKey({ bit: [3, this.selectedAsset.path] }), before: this.snapshotMapLists([mapId]), removed: 0 };
        this.scatterEraseAt(clientX, clientY);
        return true;
    },

    scatterEraseAt(clientX, clientY) {
        const erase = this._scatterErase;
        if (!erase) return 0;
        const at = this.clientToMapCoords(clientX, clientY);
        this._brushHover = at;
        const list = (window.$dataDocsDoodads || {})[erase.mapId] || [];
        const r = Math.max(4, Number(this.brushSettings.radius) || 0);
        const gone = new Set(list.filter(d => d && !d.locked && !d.editorHidden && this.layerAllowsEditing(d) &&
            this.artKey(d) === erase.key && Math.hypot(d.x - at.x, d.y - at.y) <= r));
        if (gone.size === 0) return 0;
        for (let i = list.length - 1; i >= 0; i--) if (gone.has(list[i])) list.splice(i, 1);
        erase.removed += gone.size;
        if (this.selectionItems().some(d => gone.has(d))) this.selectDoodads(this.selectionItems().filter(d => !gone.has(d)));
        this.refreshSpriteset();
        return gone.size;
    },

    endScatterErase() {
        const erase = this._scatterErase;
        this._scatterErase = null;
        if (!erase || !erase.removed) return 0;
        this.recordMapListsEdit(erase.before, 'scatter_erase');
        this.toastUndo(`Erased ${erase.removed} prop(s).`);
        return erase.removed;
    },

    handleEyedropper(coords) {
        const d = this.doodadAt(coords.x, coords.y);
        if (d) {
            const sourcePath = d.bit && d.bit[0] === 3 ? String(d.bit[1]).replace(/\\/g, '/').toLowerCase() : null;
            const asset = sourcePath && DocsDoodads.AssetIndex.list.find(a => String(a.path || '').replace(/\\/g, '/').toLowerCase() === sourcePath);
            if (asset) {
                this.selectAsset(asset);
                this.showToast(`Eyedropper: Selected ${asset.fileName} in drawer`);
            } else {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
            }
            return;
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = DocsDoodads.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
                    if (matchedAsset) {
                        this.selectAsset(matchedAsset);
                        this.showToast(`Eyedropper: Matched Character Sheet ${charName}`);
                        return;
                    }
                }
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Eyedropper: Selected Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        this.showToast("No doodad or event under cursor");
    },

    doodadContainsPoint(d, x, y) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0);
        if (x >= left && x <= left + w && y >= top && y <= top + h) return true;
        // Keep small props easy to click.
        return Math.hypot(d.x - x, d.y - y) < 40;
    },

    // Screen-space boxes for the selected doodads, matching Sprite_DocsDoodad placement.
    // Page (client) pixels to the game canvas's own pixels.
    clientToCanvas(clientX, clientY) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || typeof canvas.getBoundingClientRect !== 'function') return { x: clientX, y: clientY };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width && rect.width ? canvas.width / rect.width : 1;
        const scaleY = canvas.height && rect.height ? canvas.height / rect.height : 1;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    },

    // Where a doodad's foot is drawn, in canvas pixels: on the copy in view on a looping map, and on the
    // ground of a 3D map (any camera turn). null when it is behind the camera.
    doodadFootOnScreen(d) {
        const flat = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
        const P = DocsDoodads.Perspective;
        const cam = P.liveCamera ? P.liveCamera() : null;
        if (!cam) return flat;
        const grid = DocsDoodads.Terrain.grid();
        const z = grid && (grid.max !== 0 || grid.min !== 0) ? DocsDoodads.Terrain.heightPxAtFlat(flat.x, flat.y) : 0;
        return P.project(cam, flat.x, flat.y, z);
    },

    // The editable doodads whose foot is inside the box dragged between two page points.
    doodadsInClientBox(c0, c1) {
        const a = this.clientToCanvas(c0.x, c0.y), b = this.clientToCanvas(c1.x, c1.y);
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x), minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
        return (DocsDoodads.doodads() || []).filter(d => {
            if (!d || d.editorHidden || !this.layerAllowsEditing(d)) return false;
            const p = this.doodadFootOnScreen(d);
            return Boolean(p) && p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
        });
    },

    // The drawn rectangle of a doodad in canvas pixels (from its foot as drawn, so 3D too), or null.
    doodadCanvasRect(d) {
        const p = this.doodadFootOnScreen(d);
        if (!p) return null;
        const k = p.scale || 1;
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1) * k;
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1) * k;
        return { x: p.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5), y: p.y - h * (d.anchorY !== undefined ? d.anchorY : 1), w, h };
    },

    // The editable doodads whose drawn picture touches the box dragged between two page points (Ctrl+drag).
    doodadsTouchingClientBox(c0, c1) {
        const a = this.clientToCanvas(c0.x, c0.y), b = this.clientToCanvas(c1.x, c1.y);
        const minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x), minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
        return (DocsDoodads.doodads() || []).filter(d => {
            if (!d || d.editorHidden || !this.layerAllowsEditing(d)) return false;
            const r = this.doodadCanvasRect(d);
            return Boolean(r) && r.x <= maxX && r.x + r.w >= minX && r.y <= maxY && r.y + r.h >= minY;
        });
    },

    // The editable doodads whose foot is inside the lasso (page points; Alt+drag).
    doodadsInClientLasso(points) {
        const poly = (points || []).map(p => this.clientToCanvas(p.x, p.y));
        if (poly.length < 3) return [];
        const inside = (x, y) => {
            let hit = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[i], b = poly[j];
                if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) hit = !hit;
            }
            return hit;
        };
        return (DocsDoodads.doodads() || []).filter(d => {
            if (!d || d.editorHidden || !this.layerAllowsEditing(d)) return false;
            const p = this.doodadFootOnScreen(d);
            return Boolean(p) && inside(p.x, p.y);
        });
    },

    // The lasso's line while it is drawn (page coordinates, over the editor).
    drawLasso(points) {
        if (typeof document === 'undefined' || !document.createElementNS) return;
        let svg = document.getElementById('dd-lasso-overlay');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'dd-lasso-overlay';
            svg.setAttribute('style', 'position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 10006;');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            line.setAttribute('style', 'fill: rgba(56, 189, 248, 0.15); stroke: var(--dd-primary); stroke-width: 1.5; stroke-dasharray: 5 4;');
            svg.appendChild(line);
            document.body.appendChild(svg);
        }
        svg.firstChild.setAttribute('points', points.map(p => p.x + ',' + p.y).join(' '));
    },

    selectionScreenRects() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        return items.filter(d => !d.editorHidden).map(d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
            const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const at = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
            return {
                x: at.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5),
                y: at.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0),
                w, h
            };
        });
    },

    // A doodad's image rectangle and foot point in flat (tilemap) pixels.
    doodadFlatBox(d) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const at = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
        const rect = { x: at.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5), y: at.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0), w, h };
        const pivot = { x: at.x, y: at.y + (DocsDoodads.Depth.baseY(d) - d.y) };
        // A doodad shown as a 3D model: the box is the model's size (turned to any side), standing on the pivot.
        const model = DocsDoodads.Perspective.active() && d.model && d.model.path ? DocsDoodads.Models.get(d.model.path) : null;
        if (model && model.ready && model.primitives.length) {
            const unit = Math.abs(Number(d.model.scale) || 1) * (window.$gameMap ? $gameMap.tileWidth() : 48);
            // A moving model's box follows its pose (the moment drawn last).
            const b = this.modelPoseBounds(d, model) || model;
            const half = Math.max(Math.abs(b.min[0]), Math.abs(b.max[0]), Math.abs(b.min[2]), Math.abs(b.max[2])) * unit;
            const tall = Math.max(0.1, b.max[1]) * unit;
            rect.x = pivot.x - half; rect.w = half * 2;
            rect.y = pivot.y - tall; rect.h = tall;
        }
        pivot.h = DocsDoodads.Terrain.doodadHeightPxAtFlat(pivot.x, pivot.y, w / 2);
        // In 3D, standing doodads can be drawn smaller or larger; picking and boxes match.
        const p3d = DocsDoodads.Perspective.active();
        const k = p3d ? p3d.doodadScale : 1;
        if (k !== 1) {
            rect.x = pivot.x + (rect.x - pivot.x) * k;
            rect.y = pivot.y + (rect.y - pivot.y) * k;
            rect.w *= k;
            rect.h *= k;
        }
        return { rect, pivot };
    },

    // The box round a model doodad's pose as drawn last, or null (still, or not drawn yet).
    modelPoseBounds(d, model) {
        const ss = typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene._spriteset : null;
        const sprite = ss && ss._docsDoodadSprites ? ss._docsDoodadSprites.find(sp => sp._data === d) : null;
        if (!sprite || !sprite._docsPose || !ss.docsModelBounds) return null;
        return ss.docsModelBounds(sprite, model, sprite._docsPose.animation, sprite._docsPose.time);
    },

    // The selection as boxes for the 3D view.
    selection3d() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        return items.filter(d => !d.editorHidden).map(d => this.doodadFlatBox(d));
    },

    // In 3D, the nearest standing doodad drawn under the last screen point.
    doodadAtScreen(screen) {
        const P = DocsDoodads.Perspective;
        const cam = P.liveCamera();
        let best = null, bestDepth = Infinity;
        for (const d of DocsDoodads.doodads() || []) {
            if (d.editorHidden || !this.layerAllowsEditing(d)) continue;
            // Models are picked by what's drawn: their triangles, not a box around them.
            const spriteset = typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene._spriteset : null;
            const modelDepth = d.model && d.model.path && spriteset && spriteset.docsModelHit ? spriteset.docsModelHit(d, screen.x, screen.y) : undefined;
            if (modelDepth !== undefined && spriteset._docsDoodadSprites && spriteset._docsDoodadSprites.some(sp => sp._data === d && (sp._docsModelGpuDrawn || (sp._docsModelMeshes && sp._docsModelMeshes.some(m => m && m._docsDrawn))))) {
                if (modelDepth !== null && modelDepth < bestDepth) { best = d; bestDepth = modelDepth; }
                continue;
            }
            const box = this.doodadFlatBox(d);
            const r = P.screenRect(cam, box.rect, box.pivot);
            if (!r || screen.x < r.x || screen.x > r.x + r.w || screen.y < r.y || screen.y > r.y + r.h) continue;
            if (r.depth < bestDepth) { best = d; bestDepth = r.depth; }
        }
        return best;
    },

    // Topmost visible doodad whose image covers the map point.
    doodadAt(x, y) {
        if (DocsDoodads.Perspective.liveCamera() && this._lastScreenPoint) return this.doodadAtScreen(this._lastScreenPoint);
        const list = DocsDoodads.doodads() || [];
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (!d.editorHidden && this.layerAllowsEditing(d) && this.doodadContainsPoint(d, x, y)) return d;
        }
        return null;
    },

    handleDoodadSelection(coords, isMulti) {
        const hit = this.doodadAt(coords.x, coords.y);
        if (hit) {
            this.selectDoodad(hit, isMulti);
            return;
        }
        // If no doodad clicked, check for genuine MZ Event on that tile
        if (!isMulti && window.$gameMap && window.$gameMap.eventsXy) {
            const events = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (events && events.length > 0) {
                const ge = events[0];
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Selected Map Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
            this.selectEvent(null);
        }
    },

