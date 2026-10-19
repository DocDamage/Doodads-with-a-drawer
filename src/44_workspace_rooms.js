//==========================================================
// SECTION 25p: ROOM STAMPS (TOOL AND CARD)
//==========================================================
// More > Rooms: save a rectangle of the map (tiles, doodads, events) as a room stamp by dragging over it,
// then place it here or on another map with a click. Each placement is one undo step. The stamps
// themselves are DocsDoodads.Rooms.
DocsDoodads.Ui.css += `
#dd-rooms-card { position: fixed; top: 90px; right: 280px; z-index: 10045; width: 300px; max-width: calc(100vw - 32px); max-height: calc(100vh - 120px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
#dd-rooms-card .dd-room-list { overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
#dd-rooms-card .dd-room-row { display: grid; grid-template-columns: 1fr auto auto auto; gap: 4px; align-items: center; padding: 4px 6px; border-radius: 8px; font-size: 11px; }
#dd-rooms-card .dd-room-row.dd-active { background: var(--dd-primary-soft); }
#dd-rooms-card .dd-room-row small { display: block; color: var(--dd-faint); font-size: 10px; }
#dd-rooms-card label { display: flex; align-items: center; gap: 6px; font-size: 11px; }
`;

DocsDoodads.Ui.hints.room = 'Rooms: drag over the map to save that part as a room stamp, or pick a stamp in the Rooms card and click where its top-left corner goes.';

Object.assign(DocsDoodads.Workspace, {
    roomTool: { mode: 'capture', roomId: null, tiles: true, doodads: true, events: true, keepUnder: true },

    tileSize() {
        const gm = typeof $gameMap !== 'undefined' ? $gameMap : null;
        return { tw: gm && gm.tileWidth ? gm.tileWidth() : 48, th: gm && gm.tileHeight ? gm.tileHeight() : 48 };
    },

    // The map being edited, as the game reads it now.
    liveMapData() {
        const m = typeof window !== 'undefined' ? window.$dataMap : null;
        return m && Array.isArray(m.data) ? m : null;
    },

    // A tile written into the game's copy and the staged copy (what Save writes), like the Regions tool.
    setMapTile(mapId, index, value) {
        const { live, staged } = this.regionTargets(mapId);
        if (live && Array.isArray(live.data)) live.data[index] = value;
        if (staged && Array.isArray(staged.data)) staged.data[index] = value;
        DocsDoodads.Persistence.dirtyMap = true;
    },

    // After tiles change: the tilemap draws again and caches built from the tiles are let go.
    afterTileEdit() {
        const ss = typeof SceneManager !== 'undefined' && SceneManager._scene ? SceneManager._scene._spriteset : null;
        if (ss) {
            ss._docsStand = null;
            if (ss._tilemap && ss._tilemap.refresh) ss._tilemap.refresh();
        }
        if (DocsDoodads.Minimap) DocsDoodads.Minimap._map = null;
        if (this.renderRegionLegend) this.renderRegionLegend();
    },

    startRoomCapture() {
        this.roomTool.mode = 'capture';
        this.roomTool.roomId = null;
        this.setPlacementTool('room');
        this.showToast('Drag over the part of the map to save as a room.', 'info');
        this.refreshRoomsCard();
    },

    pickRoom(id) {
        if (!DocsDoodads.Rooms.get(id)) return false;
        this.roomTool.mode = 'place';
        this.roomTool.roomId = id;
        this.setPlacementTool('room');
        this.refreshRoomsCard();
        return true;
    },

    // ---- Capturing ----
    async saveRoomFromRect(rect) {
        const map = this.liveMapData();
        if (!map || !rect || rect.w <= 0 || rect.h <= 0) return null;
        const staged = DocsDoodads.Persistence.stagedFor();
        const events = ((staged && staged.events) || []).filter(Boolean);
        const { tw, th } = this.tileSize();
        const R = DocsDoodads.Rooms;
        const values = await DocsDoodads.Ui.form({
            title: 'Save a room', icon: 'map', ok: 'Save Room',
            text: `${rect.w} x ${rect.h} tiles from (${rect.x}, ${rect.y}): its tiles, the doodads standing in it and the events on it.`,
            fields: [{ key: 'name', label: 'Name', value: 'Room ' + (R.ensureLoaded().length + 1) }]
        });
        if (!values || !String(values.name || '').trim() || !this.mounted) return null;
        const room = R.capture(values.name, map, rect, DocsDoodads.doodads() || [], events, tw, th);
        R.add(room);
        R.save();
        this.showToast(`Saved room "${room.name}" (${R.summary(room)}).`, 'success');
        this.pickRoom(room.id);
        return room;
    },

    // ---- Placing ----
    placeRoom(room, at) {
        const map = this.liveMapData();
        if (!room || !map) return null;
        const R = DocsDoodads.Rooms;
        const { tw, th } = this.tileSize();
        const mapId = this.currentMapId();
        const staged = DocsDoodads.Persistence.stagedFor();
        const reserved = [];
        const t = this.roomTool;
        const plan = R.place(room, map, at, {
            tiles: t.tiles, doodads: t.doodads, events: t.events && Boolean(staged && staged.events), keepUnder: t.keepUnder,
            tileWidth: tw, tileHeight: th,
            allocateEventId: () => {
                const id = DocsDoodads.Events.allocateSafeId(staged);
                staged.events[id] = { id, reserved: true };
                reserved.push(id);
                return id;
            }
        });
        reserved.forEach(id => { delete staged.events[id]; });
        if (!plan.changes.length && !plan.doodads.length && !plan.events.length) {
            this.showToast('Nothing to place there: the room would change nothing.', 'info');
            return plan;
        }
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_room',
            apply: () => {
                plan.changes.forEach(c => this.setMapTile(mapId, c.index, c.after));
                plan.doodads.forEach(d => { if (!list.includes(d)) list.push(d); });
                plan.events.forEach(e => { staged.events[e.id] = e; });
                DocsDoodads.Persistence.dirtyDoodads = true;
                if (plan.events.length) DocsDoodads.Persistence.dirtyMap = true;
                this.afterTileEdit();
                this.refreshSpriteset();
            },
            revert: () => {
                plan.changes.forEach(c => this.setMapTile(mapId, c.index, c.before));
                plan.doodads.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); });
                plan.events.forEach(e => { if (staged.events[e.id] === e) staged.events[e.id] = null; });
                this.afterTileEdit();
                this.refreshSpriteset();
            }
        });
        this.showToast(`Placed "${room.name}": ${plan.changes.length} tile change${plan.changes.length === 1 ? '' : 's'}, ${plan.doodads.length} doodad(s), ${plan.events.length} event(s).`, 'success');
        return plan;
    },

    async renameRoom(id) {
        const room = DocsDoodads.Rooms.get(id);
        if (!room) return;
        const name = await DocsDoodads.Ui.prompt('A new name for this room:', room.name, { title: 'Rename room', ok: 'Rename', icon: 'map' });
        if (!name || !name.trim() || DocsDoodads.Rooms.get(id) !== room) return;
        room.name = name.trim();
        DocsDoodads.Rooms.save();
        this.refreshRoomsCard();
    },

    async deleteRoom(id) {
        const room = DocsDoodads.Rooms.get(id);
        if (!room) return;
        if (!(await DocsDoodads.Ui.confirm(`The room "${room.name}" will be deleted. Places where it was put stay as they are.`,
            { title: 'Delete room?', ok: 'Delete Room', danger: true }))) return;
        DocsDoodads.Rooms.remove(id);
        DocsDoodads.Rooms.save();
        if (this.roomTool.roomId === id) { this.roomTool.roomId = null; this.roomTool.mode = 'capture'; }
        this.refreshRoomsCard();
    },

    // ---- The card ----
    showRoomsCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui, R = DocsDoodads.Rooms;
        let card = document.getElementById('dd-rooms-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-rooms-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const t = this.roomTool;
        const rooms = R.ensureLoaded();
        const check = (id, label, on) => `<label><input type="checkbox" id="${id}" ${on ? 'checked' : ''} /> ${escapeHtml(label)}</label>`;
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('map', 1)} Rooms</span>
                <button class="dd-btn dd-fold" id="dd-rooms-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <button class="dd-btn${this.placementTool === 'room' && t.mode === 'capture' ? ' dd-btn-primary' : ''}" id="dd-rooms-capture" type="button" title="Drag over the map to save that part as a room">${U.icon('plus', 1)} Save a Room from the Map</button>
            <div class="dd-room-list">${rooms.length ? rooms.map((r, i) => `
                <div class="dd-room-row${t.roomId === r.id && this.placementTool === 'room' ? ' dd-active' : ''}">
                    <span>${escapeHtml(r.name)}<small>${escapeHtml(R.summary(r))}</small></span>
                    <button class="dd-btn" id="dd-room-place-${i}" type="button" title="Click the map where its top-left corner goes">Place</button>
                    <button class="dd-btn" id="dd-room-rename-${i}" type="button" title="Rename">${U.icon('wrench', 1)}</button>
                    <button class="dd-btn" id="dd-room-delete-${i}" type="button" title="Delete">${U.icon('trash', 1)}</button>
                </div>`).join('') : '<div style="font-size: 11px; color: var(--dd-faint); line-height: 1.4;">No rooms yet. Save one from the map: a house, a shop counter, a camp, then place it again anywhere.</div>'}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px;">
                ${check('dd-rooms-tiles', 'Tiles', t.tiles)}${check('dd-rooms-doodads', 'Doodads', t.doodads)}
                ${check('dd-rooms-events', 'Events', t.events)}${check('dd-rooms-keep', 'Keep tiles under empty ones', t.keepUnder)}
            </div>
            <div style="font-size: 10px; color: var(--dd-faint); line-height: 1.4;">Placing uses these. Rooms are kept in data/DocsDoodadsRooms.json, for every map. Autotile edges are copied as they were, so a room's border may need touching up in MZ.</div>`;
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        const tick = (id, key) => { const el = document.getElementById(id); if (el) el.onchange = e => { this.roomTool[key] = Boolean(e.target.checked); }; };
        on('dd-rooms-close', () => this.closeRoomsCard());
        on('dd-rooms-capture', () => this.startRoomCapture());
        rooms.forEach((r, i) => {
            on(`dd-room-place-${i}`, () => this.pickRoom(r.id));
            on(`dd-room-rename-${i}`, () => this.renameRoom(r.id));
            on(`dd-room-delete-${i}`, () => this.deleteRoom(r.id));
        });
        tick('dd-rooms-tiles', 'tiles');
        tick('dd-rooms-doodads', 'doodads');
        tick('dd-rooms-events', 'events');
        tick('dd-rooms-keep', 'keepUnder');
        return card;
    },

    refreshRoomsCard() {
        if (typeof document !== 'undefined' && document.getElementById('dd-rooms-card')) this.showRoomsCard();
    },

    closeRoomsCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-rooms-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
        if (this.placementTool === 'room') this.setPlacementTool(null);
    }
});

DocsDoodads.Workspace.toolHooks.room = {
    down(e) {
        if (this.roomTool.mode !== 'capture') return false;
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        this._roomDrag = { from: { x: at.tileX, y: at.tileY }, to: { x: at.tileX, y: at.tileY } };
        return true;
    },
    move(e, stroking) {
        const at = this.clientToMapCoords(e.clientX, e.clientY);
        this._roomHover = { x: at.tileX, y: at.tileY };
        if (stroking && this._roomDrag) this._roomDrag.to = { x: at.tileX, y: at.tileY };
    },
    up() {
        const drag = this._roomDrag;
        this._roomDrag = null;
        const map = this.liveMapData();
        if (!drag || !map) return;
        this._suppressNextClick = true;
        this.saveRoomFromRect(DocsDoodads.Rooms.rectBetween(drag.from, drag.to, map.width, map.height));
    },
    click(coords) {
        if (this.roomTool.mode !== 'place') return;
        this.placeRoom(DocsDoodads.Rooms.get(this.roomTool.roomId), { x: coords.tileX, y: coords.tileY });
    },
    // The rectangle being dragged, or where the picked room would go.
    overlay(g) {
        if (this.placementTool !== 'room' || typeof $gameMap === 'undefined' || !$gameMap || !g) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        let rect = null;
        if (this._roomDrag) {
            const map = this.liveMapData();
            if (map) rect = DocsDoodads.Rooms.rectBetween(this._roomDrag.from, this._roomDrag.to, map.width, map.height);
        } else if (this.roomTool.mode === 'place' && this._roomHover) {
            const room = DocsDoodads.Rooms.get(this.roomTool.roomId);
            if (room) rect = { x: this._roomHover.x, y: this._roomHover.y, w: room.w, h: room.h };
        }
        if (!rect) return;
        const color = DocsDoodads.Ui.mapColor('selection');
        g.lineStyle(2, color, 0.95);
        g.beginFill(color, 0.12);
        g.drawRect($gameMap.adjustX(rect.x) * tw, $gameMap.adjustY(rect.y) * th, rect.w * tw, rect.h * th);
        g.endFill();
        g.lineStyle(0);
    }
};
