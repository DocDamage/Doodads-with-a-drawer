    // ---- 3D preview in the asset inspector ----
    // Only for images that could stand up as doodads, on maps shown in 3D.
    renderAsset3dPreview(a) {
        if (!a || !/\.png$/i.test(a.path || '') || /^img\/(faces|system|titles|battlebacks|sv_|enemies|parallaxes)/i.test(a.path)) return '';
        const raw = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).perspective;
        if (!raw || raw.enabled !== true) return '';
        return `
            <div style="margin: 6px 0;">
                <canvas id="dd-asset-3d" width="232" height="140" style="width: 100%; border-radius: 4px; background: #0b1220;"></canvas>
                <div id="dd-asset-3d-note" style="font-size: 10px; color: var(--dd-faint);">In 3D on this map, beside the party leader.</div>
            </div>`;
    },

    drawAsset3dPreview(a) {
        const canvas = document.getElementById('dd-asset-3d');
        if (!canvas || !canvas.getContext) return;
        const settings = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).perspective || {};
        const ctx = canvas.getContext('2d');
        const leader = typeof $gameParty !== 'undefined' && $gameParty && $gameParty.leader ? $gameParty.leader() : null;
        const heroBitmap = leader && typeof ImageManager !== 'undefined' ? ImageManager.loadCharacter(leader.characterName()) : null;
        const image = new Image();
        const draw = () => {
            if (!document.getElementById('dd-asset-3d')) return;
            const big = heroBitmap && heroBitmap.isReady() && ImageManager.isBigCharacter(leader.characterName());
            const hw = heroBitmap && heroBitmap.isReady() ? heroBitmap.width / (big ? 3 : 12) : 48;
            const hh = heroBitmap && heroBitmap.isReady() ? heroBitmap.height / (big ? 4 : 8) : 48;
            const aw = image.naturalWidth || a.width || 48, ah = image.naturalHeight || a.height || 48;
            const L = DocsDoodads.Perspective.previewLayout(settings, canvas.width, canvas.height, { w: aw, h: ah }, { w: hw, h: hh });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e3a2b';
            ctx.fillRect(0, canvas.height * 0.35, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
            ctx.lineWidth = 1;
            for (const [x1, y1, x2, y2] of L.grid) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
            ctx.imageSmoothingEnabled = false;
            if (L.hero) {
                if (heroBitmap && heroBitmap.isReady()) {
                    const index = big ? 0 : leader.characterIndex();
                    const sx = ((index % 4) * 3 + 1) * hw, sy = Math.floor(index / 4) * 4 * hh;
                    ctx.drawImage(heroBitmap._image || heroBitmap.canvas, sx, sy, hw, hh, L.hero.x, L.hero.y, L.hero.w, L.hero.h);
                } else {
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(L.hero.x, L.hero.y, L.hero.w, L.hero.h);
                }
            }
            if (L.asset && image.naturalWidth) ctx.drawImage(image, L.asset.x, L.asset.y, L.asset.w, L.asset.h);
            const note = document.getElementById('dd-asset-3d-note');
            if (note) note.textContent = `In 3D on this map, beside the party leader. Height: doodads ${L.doodadScale}, characters ${L.characterScale}.`;
        };
        image.onload = draw;
        image.src = DocsDoodads.LiveReload.urlFor(a.path);
        if (heroBitmap && !heroBitmap.isReady()) heroBitmap.addLoadListener(draw);
        draw();
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        // Remembered after doodads are picked: Replace Art suggests it.
        if (asset && asset.type !== 'prefab') this.lastAsset = asset;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodad(doodad, isMulti) {
        if (!doodad) {
            this.selectedDoodad = null;
            this.selectedDoodads = [];
            this.refreshInspector();
            return;
        }

        // If doodad is part of a group and not multi-selecting, select all members in the group
        if (!isMulti && doodad.groupId) {
            const groupMembers = (DocsDoodads.doodads() || []).filter(d => d.groupId === doodad.groupId);
            if (groupMembers.length > 1) {
                this.selectedDoodads = groupMembers;
                this.selectedDoodad = doodad;
                this.selectedAsset = null;
                this.selectedEvent = null;
                this.refreshInspector();
                return;
            }
        }

        if (isMulti) {
            this.selectedDoodads = this.selectedDoodads || [];
            const idx = this.selectedDoodads.indexOf(doodad);
            if (idx >= 0) {
                this.selectedDoodads.splice(idx, 1);
            } else {
                this.selectedDoodads.push(doodad);
            }
            this.selectedDoodad = this.selectedDoodads[this.selectedDoodads.length - 1] || null;
        } else {
            this.selectedDoodads = [doodad];
            this.selectedDoodad = doodad;
        }
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodads(doodads) {
        this.selectedDoodads = doodads || [];
        this.selectedDoodad = this.selectedDoodads[0] || null;
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    // The details panel's heading (an icon and a name for what is shown) and the hint for it.
    updateInspectorHead() {
        const U = DocsDoodads.Ui;
        let icon = 'map', title = 'Map', hint = null;
        const name = path => String(path || '').split('/').pop().replace(/\.[^.]+$/, '');
        if (this.selectedEvent) {
            const ev = this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event());
            icon = 'person'; title = ev && ev.name ? ev.name : 'Event';
            hint = 'Drag the event, or use the arrow keys, to move it. Right-click it for more.';
        } else if (this.selectedDoodads && this.selectedDoodads.length > 1) {
            icon = 'layers'; title = `${this.selectedDoodads.length} things`;
            hint = 'Drag one to move them all. Delete removes them; right-click for more.';
        } else if (this.selectedDoodad) {
            icon = 'tree'; title = name(this.selectedDoodad.bit && this.selectedDoodad.bit[1]) || 'Doodad';
            hint = 'Drag it to move it. Arrow keys nudge it; Delete removes it; right-click for more.';
        } else if (this.selectedAsset) {
            const a = this.selectedAsset;
            icon = a.type === 'prefab' ? 'box' : a.category === 'Audio' ? 'music' : 'bag';
            title = name(a.fileName) || 'Item';
            hint = a.category === 'Audio' ? 'Drop it on the map to make a sound event, or right-click to listen.'
                : 'Now click the map to place it. Stamp places it again and again.';
        } else {
            const mapId = this.currentMapId();
            const info = typeof $dataMapInfos !== 'undefined' && $dataMapInfos ? $dataMapInfos[mapId] : null;
            title = info && info.name ? info.name : `Map ${mapId}`;
        }
        const iconEl = document.getElementById('dd-inspector-icon');
        if (iconEl) iconEl.innerHTML = U.icon(icon, 2);
        const titleEl = document.getElementById('dd-inspector-title');
        if (titleEl) { titleEl.textContent = title; titleEl.title = title; }
        if (!this.placementTool) U.setHint(hint || U.hints.none);
    },

    refreshInspector() {
        const content = document.getElementById('dd-inspector-content');
        if (!content) return;
        this.updateInspectorHead();

        // Case 0: MZ Map Event Selected
        if (this.selectedEvent) {
            const ev = this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event());
            const ge = this.selectedEvent.gameEvent;
            const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
            const page0 = ev && ev.pages && ev.pages[0] ? ev.pages[0] : {};
            const triggerNames = ["Action Button", "Player Touch", "Event Touch", "Autorun", "Parallel"];
            const priorityNames = ["Below Characters", "Same as Characters", "Above Characters"];

            content.innerHTML = `
                <div style="color: var(--dd-muted); margin-bottom: 6px;">Event ${evId} on this map.</div>
                <div style="font-size: 11px; margin-bottom: 4px;">Tile Coordinates: <span style="color: var(--dd-text);">[${ge ? ge.x : (ev ? ev.x : 0)}, ${ge ? ge.y : (ev ? ev.y : 0)}]</span></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Tile X:</label>
                        <input type="number" id="dd-ev-x" value="${ge ? ge.x : (ev ? ev.x : 0)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Tile Y:</label>
                        <input type="number" id="dd-ev-y" value="${ge ? ge.y : (ev ? ev.y : 0)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: var(--dd-muted); margin-bottom: 2px;">Trigger:</label>
                    <select id="dd-ev-trigger" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; font-size: 11px;">
                        ${triggerNames.map((t, idx) => `<option value="${idx}" ${(page0.trigger === idx) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: var(--dd-muted); margin-bottom: 2px;">Priority:</label>
                    <select id="dd-ev-priority" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; font-size: 11px;">
                        ${priorityNames.map((p, idx) => `<option value="${idx}" ${(page0.priorityType === idx) ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="dd-btn dd-btn-primary" id="dd-ev-save-template-btn">💾 Save as Event Template</button>
                    <button class="dd-btn" id="dd-ev-dup-btn">Duplicate Event</button>
                    <button class="dd-btn" id="dd-ev-del-btn" style="background: var(--dd-danger-soft);">Delete Event</button>
                </div>
            `;

            document.getElementById('dd-ev-save-template-btn').onclick = () => this.saveEventAsTemplate(ev, ev.name || ("Template_" + evId));
            const evNumber = (id, apply) => {
                const input = document.getElementById(id);
                if (input) input.onchange = () => {
                    const value = parseInt(input.value, 10);
                    if (Number.isFinite(value)) apply(value);
                    this.refreshInspector();
                };
            };
            const maxX = window.$gameMap && $gameMap.width ? $gameMap.width() - 1 : 9999;
            const maxY = window.$gameMap && $gameMap.height ? $gameMap.height() - 1 : 9999;
            evNumber('dd-ev-x', v => this.editSelectedEvent('move_event', e => { e.x = Math.max(0, Math.min(maxX, v)); }));
            evNumber('dd-ev-y', v => this.editSelectedEvent('move_event', e => { e.y = Math.max(0, Math.min(maxY, v)); }));
            evNumber('dd-ev-trigger', v => this.editSelectedEvent('event_trigger', e => { if (e.pages && e.pages[0]) e.pages[0].trigger = v; }));
            evNumber('dd-ev-priority', v => this.editSelectedEvent('event_priority', e => { if (e.pages && e.pages[0]) e.pages[0].priorityType = v; }));
            document.getElementById('dd-ev-del-btn').onclick = () => {
                this.deleteSelectedEvent();
            };
            document.getElementById('dd-ev-dup-btn').onclick = () => {
                this.duplicateSelectedEvent();
            };
            return;
        }

        // Case 1A: Multi-Selection (Multiple Doodads Selected)
        if (this.selectedDoodads && this.selectedDoodads.length > 1) {
            const items = this.selectedDoodads;
            const lockedCount = items.filter(d => d.locked).length;
            const hiddenCount = items.filter(d => d.editorHidden).length;
            const hasGroup = items.some(d => d.groupId);

            content.innerHTML = `
                <div style="color: var(--dd-muted); margin-bottom: 6px;">${items.length} things picked: what you do here changes them all.</div>
                <div style="font-size: 11px; color: var(--dd-text); margin-bottom: 8px;">
                    ${lockedCount > 0 ? `🔒 ${lockedCount} locked | ` : ''}
                    ${hiddenCount > 0 ? `👁 ${hiddenCount} hidden | ` : ''}
                    ${hasGroup ? `📦 Grouped` : ''}
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-bottom: 8px;">
                    <div class="dd-label">Line up</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-align-left" title="Align Left">Left</button>
                        <button class="dd-btn" id="dd-align-center-x" title="Align Center X">Center X</button>
                        <button class="dd-btn" id="dd-align-right" title="Align Right">Right</button>
                        <button class="dd-btn" id="dd-align-top" title="Align Top">Top</button>
                        <button class="dd-btn" id="dd-align-center-y" title="Align Center Y">Center Y</button>
                        <button class="dd-btn" id="dd-align-bottom" title="Align Bottom">Bottom</button>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-bottom: 8px;">
                    <div class="dd-label">Space out evenly</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-dist-h" title="Distribute Horizontally">Horizontal</button>
                        <button class="dd-btn" id="dd-dist-v" title="Distribute Vertically">Vertical</button>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-bottom: 8px;">
                    <div class="dd-label">In front or behind</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-multi-z-fwd" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-back" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-multi-z-bottom" title="Send to Back">To Back</button>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-bottom: 8px;">
                    <div class="dd-label">Group, lock and hide</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-grp-btn">${hasGroup ? 'Ungroup' : 'Group'}</button>
                        <button class="dd-btn" id="dd-lock-btn">${lockedCount === items.length ? 'Unlock All' : 'Lock All'}</button>
                        <button class="dd-btn" id="dd-hide-btn">${hiddenCount === items.length ? 'Show All' : 'Hide All'}</button>
                        <button class="dd-btn" id="dd-dup-all-btn">Duplicate</button>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-bottom: 8px;">
                    <button class="dd-btn" id="dd-multi-trace-col" style="width: 100%;" title="Fit each doodad's collision to the solid base of its image">Trace Collision from Art</button>
                </div>
                ${this.renderSelectionTools(items)}
                ${this.renderEffectSections(items)}
                <div style="margin-top: 12px;">
                    <button class="dd-btn" id="dd-del-all-btn" style="width: 100%; background: var(--dd-danger-soft);">Delete Selection (${items.length})</button>
                </div>
            `;

            document.getElementById('dd-align-left').onclick = () => this.alignSelected('left');
            document.getElementById('dd-align-center-x').onclick = () => this.alignSelected('centerX');
            document.getElementById('dd-align-right').onclick = () => this.alignSelected('right');
            document.getElementById('dd-align-top').onclick = () => this.alignSelected('top');
            document.getElementById('dd-align-center-y').onclick = () => this.alignSelected('centerY');
            document.getElementById('dd-align-bottom').onclick = () => this.alignSelected('bottom');

            document.getElementById('dd-dist-h').onclick = () => this.distributeSelected('horizontal');
            document.getElementById('dd-dist-v').onclick = () => this.distributeSelected('vertical');

            document.getElementById('dd-multi-z-fwd').onclick = () => this.bringForward();
            document.getElementById('dd-multi-z-back').onclick = () => this.sendBackward();
            document.getElementById('dd-multi-z-front').onclick = () => this.bringToFront();
            document.getElementById('dd-multi-z-bottom').onclick = () => this.sendToBack();

            document.getElementById('dd-grp-btn').onclick = () => {
                if (hasGroup) this.ungroupSelected();
                else this.groupSelected();
            };
            document.getElementById('dd-lock-btn').onclick = () => {
                this.lockSelected(lockedCount !== items.length);
            };
            document.getElementById('dd-hide-btn').onclick = () => {
                this.hideSelected(hiddenCount !== items.length);
            };
            document.getElementById('dd-dup-all-btn').onclick = () => this.duplicateSelectedDoodad();
            document.getElementById('dd-multi-trace-col').onclick = () => this.traceCollision(items);
            this.bindEffectSections(items);
            this.bindSelectionTools(items);
            document.getElementById('dd-del-all-btn').onclick = () => this.deleteSelectedDoodad();
            return;
        }

        // Case 1B: Placed Doodad Selected (Single Doodad)
        if (this.selectedDoodad) {
            const d = this.selectedDoodad;
            const isLocked = !!d.locked;
            const isHidden = !!d.editorHidden;
            const isCustomCol = d.collision && d.collision.preset === 'custom';
            const shape = (d.collision && d.collision.shape) || { x: 0.2, y: 0.2, w: 0.6, h: 0.6 };

            content.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="color: var(--dd-muted);">Placed on the map.</div>
                    <div style="display: flex; gap: 4px;">
                        <button class="dd-btn${isLocked ? ' dd-btn-active' : ''}" id="dd-doodad-lock-toggle" title="Locked things can't be moved or deleted by mistake">${DocsDoodads.Ui.icon('lock', 1)} ${isLocked ? 'Locked' : 'Lock'}</button>
                        <button class="dd-btn${isHidden ? ' dd-btn-active' : ''}" id="dd-doodad-hide-toggle" title="Hide it while editing (it still shows in the game)">${DocsDoodads.Ui.icon('eye', 1)} ${isHidden ? 'Hidden' : 'Hide'}</button>
                    </div>
                </div>
                <div style="font-size: 11px; margin-bottom: 4px;">Image: <span style="color: var(--dd-text);">${escapeHtml(d.bit ? d.bit[1] : 'Unknown')}</span></div>
                ${d.groupId ? `<div style="font-size: 10px; color: var(--dd-purple); margin-bottom: 4px;">Group: ${escapeHtml(d.groupId)} <button class="dd-btn" id="dd-ungrp-single" style="padding: 1px 4px; font-size: 9px;">Ungroup</button></div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">X:</label>
                        <input type="number" id="dd-prop-x" value="${d.x}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Y:</label>
                        <input type="number" id="dd-prop-y" value="${d.y}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Z-Order:</label>
                        <input type="number" id="dd-prop-z" value="${d.z || 0}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Rotation (°):</label>
                        <input type="number" id="dd-prop-rot" value="${d.rotation || 0}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Scale X:</label>
                        <input type="number" step="0.1" id="dd-prop-sx" value="${d.scaleX || 1}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: var(--dd-muted);">Scale Y:</label>
                        <input type="number" step="0.1" id="dd-prop-sy" value="${d.scaleY || 1}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                    <select id="dd-prop-col" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                        <option value="none">None (Passable)</option>
                        <option value="full">Full Bounds</option>
                        <option value="bottomHalf">Bottom Half</option>
                        <option value="bottomThird">Bottom Third</option>
                        <option value="trunk">Tree Trunk</option>
                        <option value="thinWall">Thin Wall</option>
                        <option value="wideWall">Wide Wall</option>
                        <option value="custom">Custom Rectangle</option>
                    </select>
                    <button class="dd-btn" id="dd-prop-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
                </div>

                <!-- Custom Collision Box Visual Editor -->
                <div id="dd-custom-col-editor" style="display: ${isCustomCol ? 'block' : 'none'}; margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--dd-line); padding: 8px; border-radius: 4px;">
                    <div class="dd-label">Solid area</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <canvas id="dd-col-preview" width="64" height="64" style="background: var(--dd-field); border: 1px solid var(--dd-line); border-radius: 3px; flex-shrink: 0;"></canvas>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; flex: 1;">
                            <div>
                                <label style="color: var(--dd-muted);">Rel X:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-x" value="${shape.x.toFixed(2)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line);" />
                            </div>
                            <div>
                                <label style="color: var(--dd-muted);">Rel Y:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-y" value="${shape.y.toFixed(2)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line);" />
                            </div>
                            <div>
                                <label style="color: var(--dd-muted);">Rel W:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-w" value="${shape.w.toFixed(2)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line);" />
                            </div>
                            <div>
                                <label style="color: var(--dd-muted);">Rel H:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-h" value="${shape.h.toFixed(2)}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line);" />
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px; margin-top: 8px;">
                    <div class="dd-label">In front or behind</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-prop-forward" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-prop-backward" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-prop-to-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-prop-to-back" title="Send to Back">To Back</button>
                    </div>
                </div>
                ${this.renderSelectionTools([d])}
                ${this.renderEffectSections([d])}
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="dd-btn" id="dd-prop-dup" style="flex: 1;">Duplicate (Ctrl+D)</button>
                    <button class="dd-btn" id="dd-prop-del" style="flex: 1; background: var(--dd-danger-soft);">Delete</button>
                </div>
            `;

            const renderColPreview = () => {
                const cvs = document.getElementById('dd-col-preview');
                if (!cvs || typeof cvs.getContext !== 'function') return;
                const ctx = cvs.getContext('2d');
                ctx.clearRect(0, 0, 64, 64);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(4, 4, 56, 56);
                ctx.strokeStyle = '#64748b';
                ctx.strokeRect(4, 4, 56, 56);
                const s = d.collision && d.collision.shape ? d.collision.shape : shape;
                ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
                ctx.fillRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
                ctx.strokeStyle = '#22c55e';
                ctx.strokeRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
            };

            document.getElementById('dd-prop-col').value = (d.collision && d.collision.preset) ? d.collision.preset : "none";
            document.getElementById('dd-prop-col').onchange = (e) => {
                const val = e.target.value;
                const colEditor = document.getElementById('dd-custom-col-editor');
                this.editDoodads([d], o => { o.collision = val === 'custom' ? { preset: 'custom', shape: shape } : { preset: val, shape: null }; }, 'set_collision');
                if (colEditor) colEditor.style.display = val === 'custom' ? 'block' : 'none';
                if (val === 'custom') renderColPreview();
            };

            if (isCustomCol) renderColPreview();

            const updateCustomCol = () => {
                const cx = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-x').value) || 0));
                const cy = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-y').value) || 0));
                const cw = Math.max(0.05, Math.min(1 - cx, parseFloat(document.getElementById('dd-col-w').value) || 0.5));
                const ch = Math.max(0.05, Math.min(1 - cy, parseFloat(document.getElementById('dd-col-h').value) || 0.5));
                this.editDoodads([d], o => { o.collision = { preset: 'custom', shape: { x: cx, y: cy, w: cw, h: ch } }; }, 'set_collision');
                renderColPreview();
            };
            ['dd-col-x', 'dd-col-y', 'dd-col-w', 'dd-col-h'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.onchange = updateCustomCol;
            });

            document.getElementById('dd-doodad-lock-toggle').onclick = () => {
                this.editDoodads([d], o => { o.locked = !o.locked; }, 'lock_doodads');
                this.refreshInspector();
            };
            document.getElementById('dd-doodad-hide-toggle').onclick = () => {
                this.editDoodads([d], o => { o.editorHidden = !o.editorHidden; }, 'hide_doodads');
                this.refreshInspector();
            };
            const ungrpBtn = document.getElementById('dd-ungrp-single');
            if (ungrpBtn) {
                ungrpBtn.onclick = () => {
                    this.editDoodads([d], o => { delete o.groupId; }, 'ungroup_doodads');
                    this.refreshInspector();
                };
            }

            const applyDoodadInputs = () => {
                if (d.locked) return;
                const num = (id, parse, fallback) => parse(document.getElementById(id).value) || fallback;
                this.editDoodads([d], o => {
                    o.x = num('dd-prop-x', v => parseInt(v, 10), 0);
                    o.y = num('dd-prop-y', v => parseInt(v, 10), 0);
                    o.z = num('dd-prop-z', v => parseInt(v, 10), 0);
                    o.rotation = num('dd-prop-rot', v => parseInt(v, 10), 0);
                    o.scaleX = num('dd-prop-sx', parseFloat, 1);
                    o.scaleY = num('dd-prop-sy', parseFloat, 1);
                }, 'transform_doodad');
            };

            ['dd-prop-x','dd-prop-y','dd-prop-z','dd-prop-rot','dd-prop-sx','dd-prop-sy'].forEach(id => {
                document.getElementById(id).onchange = applyDoodadInputs;
            });

            this.bindEffectSections([d]);
            this.bindSelectionTools([d]);
            document.getElementById('dd-prop-trace-col').onclick = () => this.traceCollision([d]);
            document.getElementById('dd-prop-forward').onclick = () => this.bringForward([d]);
            document.getElementById('dd-prop-backward').onclick = () => this.sendBackward([d]);
            document.getElementById('dd-prop-to-front').onclick = () => this.bringToFront([d]);
            document.getElementById('dd-prop-to-back').onclick = () => this.sendToBack([d]);
            document.getElementById('dd-prop-dup').onclick = () => {
                this.duplicateSelectedDoodad();
            };
            document.getElementById('dd-prop-del').onclick = () => {
                this.deleteSelectedDoodad();
            };
            return;
        }

        // Case 2: Drawer Asset Selected
        if (!this.selectedAsset) {
            this.renderMapPanel(content);
            return;
        }

        const a = this.selectedAsset;
        if (a.type === 'prefab') {
            this.renderPrefabInspector(content, a);
            return;
        }
        if (a.category === 'Audio') {
            this.renderAudioInspector(content, a);
            return;
        }
        const templates = DocsDoodads.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += `<option value="${escapeHtml(key)}">${escapeHtml(templates[key].name)}</option>`;
        }

        content.innerHTML = `
            <div style="font-weight: bold; color: var(--dd-text); margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: var(--dd-accent);">${escapeHtml(a.category)}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: ${a.width} x ${a.height}</div>
            ${this.renderAsset3dPreview(a)}
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. forest, prop" style="width: 100%; box-sizing: border-box; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: var(--dd-faint); margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="dd-place-mode" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                    <option value="ask">Ask Each Time</option>
                </select>
            </div>
            <div id="dd-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="dd-event-template" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                    ${templateOptions}
                </select>
                ${a.type === 'character_sheet' ? `
                <label style="display: block; font-size: 11px; margin: 8px 0 3px;">Character on Sheet:</label>
                <select id="dd-char-index" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}">#${i + 1} (${i < 4 ? 'top' : 'bottom'} row, ${(i % 4) + 1} of 4)</option>`).join('')}
                </select>` : ''}
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                <select id="dd-col-preset" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                    <option value="none">None (Passable)</option>
                    <option value="full">Full Bounds</option>
                    <option value="bottomHalf">Bottom Half</option>
                    <option value="bottomThird">Bottom Third</option>
                    <option value="trunk">Tree Trunk</option>
                    <option value="thinWall">Thin Wall</option>
                    <option value="wideWall">Wide Wall</option>
                    <option value="custom">Custom (traced)</option>
                </select>
                <button class="dd-btn" id="dd-asset-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Default Depth:</label>
                <select id="dd-asset-depth" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px; border-radius: 4px;">
                    ${DocsDoodads.Depth.modes.map(m => `<option value="${m}">${DocsDoodads.Depth.labels[m]}</option>`).join('')}
                </select>
            </div>
            ${this.renderAssetSeasonControl(a)}
            ${this.renderAssetPlacementTools(a)}
            ${this.renderUsagePanel(a)}
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-place-now-btn">Place in the Middle of the Screen</button>
                <button class="dd-btn" id="dd-open-slicer-btn">${DocsDoodads.Ui.icon('scissors', 1)} Cut Up Sheet</button>
            </div>
        `;

        this.drawAsset3dPreview(a);
        const modeSel = document.getElementById('dd-place-mode');
        const templateGroup = document.getElementById('dd-template-group');
        modeSel.value = a.placement.defaultMode || "doodad";
        templateGroup.style.display = modeSel.value === "event" ? "block" : "none";

        modeSel.onchange = (e) => {
            a.placement.defaultMode = e.target.value;
            templateGroup.style.display = a.placement.defaultMode === "event" ? "block" : "none";
        };

        const charSel = document.getElementById('dd-char-index');
        if (charSel) {
            charSel.value = String(a.placement.characterIndex || 0);
            charSel.onchange = (e) => { a.placement.characterIndex = parseInt(e.target.value, 10) || 0; };
        }

        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };

        const colSel = document.getElementById('dd-col-preset');
        colSel.value = a.collision.preset || "none";
        colSel.onchange = (e) => {
            const shape = e.target.value === 'custom' ? (a.collision.shape || { x: 0.2, y: 0.6, w: 0.6, h: 0.4 }) : null;
            a.collision = { preset: e.target.value, shape };
            DocsDoodads.AssetIndex.save();
        };
        document.getElementById('dd-asset-trace-col').onclick = () => this.traceAssetCollision(a);
        const depthSel = document.getElementById('dd-asset-depth');
        depthSel.value = DocsDoodads.Depth.modes.includes(a.placement.depth) ? a.placement.depth : DocsDoodads.Depth.suggestFor(a);
        depthSel.onchange = (e) => {
            a.placement.depth = e.target.value;
            DocsDoodads.AssetIndex.save();
        };

        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };

        document.getElementById('dd-open-slicer-btn').onclick = () => {
            DocsDoodads.Slicing.Editor.open(a);
        };

        document.getElementById('dd-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
        };
        this.bindAssetSeasonControl(a);
        this.bindAssetPlacementTools(a);
        this.bindUsagePanel(a);
    },

    // ---- Undoable doodad property editing (inspector sections, tools) ----
    // Asks for a name and a category, then keeps the event as a template for Place as Event.
    async saveEventAsTemplate(eventObj, suggestedName) {
        const values = await DocsDoodads.Ui.form({
            title: 'Save as event template', text: 'Placed events can start from this one.', ok: 'Save Template', icon: 'person',
            fields: [
                { key: 'name', label: 'Name', value: suggestedName },
                { key: 'category', label: 'Category', value: 'Custom', choices: ['Interaction', 'Mechanics', 'Atmosphere', 'Custom'] }
            ]
        });
        const name = values ? values.name.trim() : '';
        if (!name) return null;
        const key = DocsDoodads.EventTemplates.saveCustomTemplate(name, eventObj, values.category.trim() || 'Custom');
        this.showToast(`Saved template "${name}"!`);
        return key;
    },

    propertyDefaults() {
        return {
            shadow: DocsDoodads.Shadow.defaults,
            light: DocsDoodads.Lighting.lightDefaults,
            motion: { type: 'none', amount: 0.5, speed: 1 },
            transition: DocsDoodads.Transition.defaults,
            particles: { preset: 'none', rateScale: 1, layer: 'above', offsetX: 0, offsetY: 0 },
            sound: DocsDoodads.SpatialSound.emitterDefaults,
            react: DocsDoodads.React.defaults,
            model: { path: '', scale: 1, yaw: 0, animation: '', speed: 1 }
        };
    },

    // Shown when a doodad has no value of its own.
    propertyFallbacks: { seeThrough: 'auto', reflect: 'auto', vfx: '' },

    getDoodadProperty(d, key) {
        if (key === 'flipX') return (d.scaleX !== undefined ? d.scaleX : 1) < 0;
        if (key === 'flipY') return (d.scaleY !== undefined ? d.scaleY : 1) < 0;
        if (key === 'switchText') return DocsDoodads.Appearance.formatSwitches(d.switch);
        if (key === 'depth') return DocsDoodads.Depth.resolve(d);
        if (key === 'layer') return DocsDoodads.Layers.of(d);
        if (key.indexOf('seasonIn.') === 0) return Array.isArray(d.seasons) && d.seasons.includes(Number(key.slice(9)));
        if (d[key] === undefined && this.propertyFallbacks[key] !== undefined) return this.propertyFallbacks[key];
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const value = d[group] ? d[group][field] : undefined;
            return value !== undefined ? value : (this.propertyDefaults()[group] || {})[field];
        }
        return d[key] !== undefined ? d[key] : DocsDoodads.standardStructData[key];
    },

    applyDoodadProperty(d, key, value) {
        if (key === 'flipX' || key === 'flipY') {
            const axis = key === 'flipX' ? 'scaleX' : 'scaleY';
            d[axis] = Math.abs(d[axis] !== undefined ? d[axis] : 1) * (value ? -1 : 1);
            return;
        }
        if (key === 'switchText') {
            d.switch = DocsDoodads.Appearance.parseSwitchText(value);
            return;
        }
        // "None" removes the emitter or attached effect rather than storing an empty one.
        if (key === 'particles.preset' && value === 'none') {
            delete d.particles;
            return;
        }
        if (key === 'vfx' && !value) {
            delete d.vfx;
            return;
        }
        if (key === 'sound.file' && !value) {
            delete d.sound;
            return;
        }
        if (key === 'model.path' && !String(value || '').trim()) {
            delete d.model;
            return;
        }
        if (key === 'layer' && (!value || value === 'main')) {
            delete d.layer;
            return;
        }
        // Season checkboxes: none ticked means every season.
        if (key.indexOf('seasonIn.') === 0) {
            const season = Number(key.slice(9));
            const list = new Set(Array.isArray(d.seasons) ? d.seasons : []);
            if (value) list.add(season); else list.delete(season);
            if (list.size > 0) d.seasons = Array.from(list).sort((a, b) => a - b);
            else delete d.seasons;
            return;
        }
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const next = Object.assign({}, this.propertyDefaults()[group] || {}, d[group] || {});
            next[field] = value;
            d[group] = next;
            return;
        }
        d[key] = value;
    },

    snapshotDoodads(items) {
        return items.map(d => JSON.parse(JSON.stringify(d)));
    },

    // Restores in place so selections and sprites keep pointing at the same objects.
    restoreDoodad(d, snapshot) {
        for (const key of Object.keys(d)) delete d[key];
        Object.assign(d, JSON.parse(JSON.stringify(snapshot)));
    },

    afterDoodadEdit() {
        DocsDoodads.Persistence.dirtyDoodads = true;
        this.refreshSpriteset(true);
    },

    // One undo step returning every item to its "before" snapshot (the change is already applied).
    recordDoodadEdit(items, before, type = 'edit_doodads') {
        const after = this.snapshotDoodads(items);
        DocsDoodads.Undo.execute({
            type,
            apply: () => { items.forEach((d, i) => this.restoreDoodad(d, after[i])); this.afterDoodadEdit(); },
            revert: () => { items.forEach((d, i) => this.restoreDoodad(d, before[i])); this.afterDoodadEdit(); }
        });
    },

    editDoodads(items, mutate, type) {
        items = (items || []).filter(Boolean);
        if (items.length === 0) return;
        const before = this.snapshotDoodads(items);
        items.forEach(mutate);
        this.recordDoodadEdit(items, before, type);
    },

    // Arrow-key moves: presses that keep coming (under a second apart) on the same doodads are one undo step.
    nudgeSelection(dx, dy) {
        const items = this.selectionItems().filter(d => !d.locked);
        if (items.length === 0) return false;
        const Undo = DocsDoodads.Undo;
        const last = Undo.undoStack[Undo.undoStack.length - 1];
        const now = Date.now();
        const same = last && last === this._nudge && now - this._nudge.at < 1000 &&
            last.items.length === items.length && last.items.every((d, i) => d === items[i]);
        items.forEach(d => { d.x += dx; d.y += dy; });
        if (same) {
            last.after = this.snapshotDoodads(items);
            Undo.markDirty();
            this.afterDoodadEdit();
        } else {
            const before = this.snapshotDoodads(items);
            before.forEach(s => { s.x -= dx; s.y -= dy; });
            const cmd = {
                type: 'nudge_doodads', items, before, after: this.snapshotDoodads(items),
                apply: () => { cmd.items.forEach((d, i) => this.restoreDoodad(d, cmd.after[i])); this.afterDoodadEdit(); },
                revert: () => { cmd.items.forEach((d, i) => this.restoreDoodad(d, cmd.before[i])); this.afterDoodadEdit(); }
            };
            Undo.execute(cmd);
            this._nudge = cmd;
        }
        this._nudge.at = now;
        // Only the position fields change; the rest of the inspector stays as it is.
        const x = document.getElementById('dd-prop-x'), y = document.getElementById('dd-prop-y');
        if (items.length === 1 && x && y) { x.value = items[0].x; y.value = items[0].y; }
        return true;
    },

    setDoodadProperty(items, key, value) {
        this.editDoodads(items, d => this.applyDoodadProperty(d, key, value), 'set_' + key);
    },

    // Slider drags preview live and become a single undo step when released.
    beginPropertyPreview(items) {
        this._propertyPreview = { items: items.slice(), before: this.snapshotDoodads(items) };
    },

    previewDoodadProperty(items, key, value) {
        const p = this._propertyPreview;
        if (p && (p.items.length !== items.length || p.items.some((d, i) => d !== items[i]))) this.commitPropertyPreview();
        if (!this._propertyPreview) this.beginPropertyPreview(items);
        items.forEach(d => this.applyDoodadProperty(d, key, value));
        this.refreshSpriteset(true);
    },

    commitPropertyPreview() {
        const preview = this._propertyPreview;
        this._propertyPreview = null;
        if (!preview) return;
        // Dragged and let go where it started: nothing to undo.
        if (JSON.stringify(this.snapshotDoodads(preview.items)) === JSON.stringify(preview.before)) return;
        this.recordDoodadEdit(preview.items, preview.before, 'adjust_doodads');
    },

    effectSections() {
        const D = DocsDoodads;
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        return [
            { title: 'Depth', fields: [
                { key: 'layer', label: 'Editor layer', type: 'select', options: D.Layers.list(D.Lighting.mapSettings(this.currentMapId())).map(l => ({ value: l.id, label: l.name })) },
                { key: 'depth', label: 'Draw order', type: 'select', options: D.Depth.modes.map(m => ({ value: m, label: D.Depth.labels[m] })) },
                number('sortOffsetY', 'Base line offset (px, negative = higher)')
            ] },
            { title: 'Appearance', fields: [
                range('opacity', 'Opacity', 0, 1, 0.05),
                { key: 'blend', label: 'Blend', type: 'select', options: D.Appearance.blendModes },
                range('hue', 'Hue shift', -180, 180, 1),
                range('r', 'Tone red', -255, 255, 1),
                range('g', 'Tone green', -255, 255, 1),
                range('b', 'Tone blue', -255, 255, 1),
                range('grey', 'Greyscale', 0, 255, 1),
                range('blur', 'Blur', 0, 20, 0.5),
                { key: 'flipX', label: 'Flip horizontally', type: 'checkbox' },
                { key: 'flipY', label: 'Flip vertically', type: 'checkbox' }
            ] },
            { title: 'Motion', fields: [
                { key: 'motion.type', label: 'Type', type: 'select', options: D.Motion.types },
                range('motion.amount', 'Amount', 0, 1, 0.05),
                range('motion.speed', 'Speed', 0.1, 3, 0.1),
                number('rotateSpeed', 'Spin (degrees per frame)', 0.5)
            ] },
            { title: 'Shadow', fields: [
                { key: 'shadow.enabled', label: 'Cast shadow', type: 'checkbox' },
                range('shadow.opacity', 'Strength', 0, 1, 0.05),
                range('shadow.length', 'Length', 0.1, 1.2, 0.05),
                range('shadow.angle', 'Lean (degrees)', -80, 80, 1),
                range('shadow.blur', 'Softness', 0, 10, 0.5),
                { key: 'shadow.followSun', label: 'Follow the sun (time of day)', type: 'checkbox' },
                number('shadow.offsetX', 'Offset X'),
                number('shadow.offsetY', 'Offset Y')
            ] },
            { title: 'Light', fields: [
                { key: 'light.enabled', label: 'Emit light', type: 'checkbox' },
                { key: 'light.when', label: 'When', type: 'select', options: D.Lighting.whenOptions },
                { key: 'light.color', label: 'Color', type: 'color' },
                range('light.radius', 'Radius', 16, 600, 4),
                range('light.intensity', 'Intensity', 0, 1, 0.05),
                range('light.flicker', 'Flicker', 0, 1, 0.05),
                range('light.glow', 'Daylight glow', 0, 1, 0.05),
                number('light.offsetX', 'Offset X'),
                number('light.offsetY', 'Offset Y')
            ] },
            { title: 'Visibility', fields: [
                { key: 'switchText', label: 'Switches (e.g. 5:on, 6:off)', type: 'text' },
                { key: 'condition', label: 'Condition (JavaScript, e.g. $gameVariables.value(3) > 2)', type: 'text' }
            ] },
            { title: 'Particles', fields: [
                { key: 'particles.preset', label: 'Emitter', type: 'select', options: [{ value: 'none', label: 'None' }].concat(D.Particles.presets.map(p => ({ value: p.id, label: p.label }))) },
                range('particles.rateScale', 'Amount (x preset rate)', 0, 5, 0.1),
                { key: 'particles.layer', label: 'Draw', type: 'select', options: D.Particles.layers },
                number('particles.offsetX', 'Offset X (from the centre)'),
                number('particles.offsetY', 'Offset Y (from the centre)'),
                { key: 'vfx', label: 'Attached VFX (loops)', type: 'select', options: [{ value: '', label: 'None' }]
                    .concat(D.Vfx.library().concat(D.Vfx.builtIns).map(v => ({ value: v.id, label: v.name }))) }
            ] },
            { title: 'Sound', fields: [
                { key: 'sound.file', label: 'Sound (background sounds loop; sound effects repeat)', type: 'select',
                    options: [{ value: '', label: 'None' }].concat(this.audioFileOptions()) },
                range('sound.volume', 'Volume', 0, 100, 1),
                range('sound.pitch', 'Pitch', 50, 150, 1),
                range('sound.radius', 'Heard within (tiles)', 1, 40, 1),
                number('sound.every', 'Sound effects: about every (seconds)', 0.5)
            ] },
            { title: 'Interaction', fields: [
                { key: 'react.enabled', label: 'Bend when walked through (grass, bushes, reeds)', type: 'checkbox' },
                range('react.amount', 'Strength', 0, 2, 0.05),
                { key: 'react.leaves', label: 'Drop leaves when disturbed', type: 'checkbox' }
            ] },
            { title: '3D Model', fields: [
                { key: 'model.path', label: 'glTF model shown in 3D instead of the picture (e.g. models/Tree.glb)', type: 'text' },
                number('model.scale', 'Size (tiles per model unit)', 0.05),
                range('model.yaw', 'Turn (degrees)', 0, 359, 1),
                { key: 'model.animation', label: "Animation to play (its name or number; blank plays the first, none for none)", type: 'text' },
                range('model.speed', 'Animation speed', 0, 3, 0.05)
            ] },
            { title: 'Atmosphere', fields: [
                { key: 'seeThrough', label: 'See-through when the player is behind', type: 'select', options: D.SeeThrough.options },
                { key: 'reflect', label: 'Reflect in water', type: 'select', options: D.Reflection.options },
                { key: 'transition.type', label: 'Appear / disappear', type: 'select', options: D.Transition.types },
                number('transition.frames', 'Transition length (frames)')
            ].concat(D.World.settings().seasons.names.map((name, i) => ({
                key: `seasonIn.${i}`, label: `Only in ${name}${i === 0 ? ' (none ticked = all seasons)' : ''}`, type: 'checkbox'
            }))) }
        ];
    },

    fieldHtml(id, f, value) {
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px; border-radius: 3px; font-size: 11px;';
        const label = `<label for="${id}" style="font-size: 10px; color: var(--dd-muted);">${escapeHtml(f.label)}${f.type === 'range' ? `: <span id="${id}-val" style="color: var(--dd-text);">${escapeHtml(String(value))}</span>` : ''}</label>`;
        if (f.type === 'checkbox') {
            return `<label style="font-size: 11px; color: var(--dd-text); display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="${id}" ${value ? 'checked' : ''} /> ${escapeHtml(f.label)}</label>`;
        }
        if (f.type === 'select') {
            const options = f.options.map(o => `<option value="${escapeHtml(String(o.value))}" ${String(o.value) === String(value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('');
            return `<div>${label}<select id="${id}" style="${inputStyle}">${options}</select></div>`;
        }
        if (f.type === 'range') {
            return `<div>${label}<input type="range" id="${id}" min="${f.min}" max="${f.max}" step="${f.step}" value="${escapeHtml(String(value))}" style="width: 100%;" /></div>`;
        }
        if (f.type === 'color') {
            return `<div>${label}<input type="color" id="${id}" value="${escapeHtml(String(value))}" style="width: 100%; height: 22px; background: var(--dd-field); border: 1px solid var(--dd-line);" /></div>`;
        }
        const type = f.type === 'number' ? 'number' : 'text';
        return `<div>${label}<input type="${type}" id="${id}" ${f.step ? `step="${f.step}"` : ''} value="${escapeHtml(String(value === undefined || value === null ? '' : value))}" style="${inputStyle}" /></div>`;
    },

    // The sections are built once per render and bound from the same list.
    renderEffectSections(items) {
        const first = items[0];
        this._openEffectSections = this._openEffectSections || {};
        this._effectSections = this.effectSections();
        return this._effectSections.map((section, si) => {
            const fields = section.fields.map((f, fi) => {
                const id = `dd-fx-${si}-${fi}`;
                const value = this.getDoodadProperty(first, f.key);
                return this.fieldHtml(id, f, value);
            }).join('');
            return `
                <details id="dd-fx-sec-${si}" ${this._openEffectSections[section.title] ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">${section.title}</summary>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}</div>
                </details>`;
        }).join('');
    },

    bindEffectSections(items) {
        const sections = this._effectSections || this.effectSections();
        this._effectSections = null;
        sections.forEach((section, si) => {
            const details = document.getElementById(`dd-fx-sec-${si}`);
            if (details) details.ontoggle = () => { this._openEffectSections[section.title] = details.open; };
            section.fields.forEach((f, fi) => {
                const input = document.getElementById(`dd-fx-${si}-${fi}`);
                if (!input) return;
                const read = () => {
                    if (f.type === 'checkbox') return Boolean(input.checked);
                    if (f.type === 'range' || f.type === 'number') return parseFloat(input.value) || 0;
                    return input.value;
                };
                if (f.type === 'range') {
                    const label = document.getElementById(`dd-fx-${si}-${fi}-val`);
                    input.oninput = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        this.commitPropertyPreview();
                    };
                    input.onpointerup = input.onblur = () => setTimeout(() => this.commitPropertyPreview(), 0);
                } else {
                    input.onchange = () => this.setDoodadProperty(items, f.key, read());
                }
            });
        });
    },

