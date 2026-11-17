// @editor-only
//==========================================================
// SECTION 25Q: WORKSPACE: PINS (9.1.6)
//==========================================================
// Right-click a tile: Add Pin Here, or Edit Pin and Delete Pin where there is one. Pins are kept in the project
// and shown to players on the minimap and the world map once found. Each change is one undo step. Problems
// lists a travel pin on this map whose tile nobody can stand on.
(function() {
    const D = DocsDoodads, W = D.Workspace, P = D.Pins;
    Object.assign(D.Ui.mapPalettes.standard, { pin: 0x22d3ee });
    Object.assign(D.Ui.mapPalettes.safe, { pin: 0x56b4e9 });
    D.Ui.mapColorMeanings.push(['pin', 'A pin players see on the minimap and world map']);

    Object.assign(W, {
        pinsStep(type, mapId, change) {
            const before = P.copy(mapId), result = change(), after = P.copy(mapId);
            if (JSON.stringify(before) === JSON.stringify(after)) return result;
            const set = list => { P.put(mapId, JSON.parse(JSON.stringify(list))); D.Persistence.dirtyDoodads = true; };
            P.put(mapId, JSON.parse(JSON.stringify(before)));
            D.Undo.execute({ type, apply: () => set(after), revert: () => set(before) });
            return result;
        },

        pinFields(pin) {
            return [
                { key: 'name', label: 'Name players see', value: pin ? pin.name : '', placeholder: 'Old Mill, Harbour Inn...' },
                { key: 'icon', label: 'Icon (IconSet number)', type: 'number', value: pin ? pin.icon : 190 },
                { key: 'travel', label: 'Players can fast travel here from the world map', type: 'checkbox', value: pin ? pin.travel : false },
                { key: 'switchId', label: 'Only while switch # is ON (0 = always)', type: 'number', value: pin ? pin.switchId : 0 }
            ];
        },

        async addPinAt(tileX, tileY) {
            const mapId = this.currentMapId();
            if (P.at(mapId, tileX, tileY)) return this.editPinAt(tileX, tileY);
            const values = await D.Ui.form({ title: `Pin at ${tileX}, ${tileY}`, ok: 'Add Pin',
                text: 'Shown on the minimap and the world map once the player has been near (or after Find Pin).', fields: this.pinFields(null) });
            if (!values || !String(values.name || '').trim()) return null;
            return this.pinsStep('add_pin', mapId, () => P.add(mapId, Object.assign({ x: tileX, y: tileY }, values)));
        },

        async editPinAt(tileX, tileY, mapId = this.currentMapId()) {
            const pin = P.at(mapId, tileX, tileY);
            if (!pin) return null;
            const values = await D.Ui.form({ title: `Pin ${pin.id}`, text: 'A pin with no name is deleted. Commands can name it by its id or name.', ok: 'Save Pin', fields: this.pinFields(pin) });
            if (!values) return null;
            const id = pin.id;
            return this.pinsStep(String(values.name || '').trim() ? 'edit_pin' : 'delete_pin', mapId, () => P.update(mapId, id, values));
        },

        deletePin(mapId, id) { return this.pinsStep('delete_pin', mapId, () => P.remove(mapId, id)); },

        pinMenuItems(tileX, tileY) {
            const mapId = this.currentMapId(), pin = P.at(mapId, tileX, tileY);
            if (!pin) return [{ label: 'Add Pin Here...', icon: '📍', onClick: () => this.addPinAt(tileX, tileY) }];
            return [
                { label: `Edit Pin "${pin.name}"...`, icon: '📍', onClick: () => this.editPinAt(tileX, tileY) },
                { label: 'Delete Pin', icon: '🗑️', danger: true, onClick: () => this.deletePin(mapId, pin.id) }
            ];
        },

        drawPins(g) {
            if (typeof $gameMap === 'undefined' || !$gameMap || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const pins = P.list(this.currentMapId());
            if (!pins.length) return;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), colour = D.Ui.mapColor('pin');
            for (const pin of pins) {
                const x = $gameMap.adjustX(pin.x) * tw, y = $gameMap.adjustY(pin.y) * th;
                // A flag in the tile's top-left corner; travel pins get a second, filled pennant.
                g.lineStyle(2, 0x111111, 0.75); g.moveTo(x + 8, y + 6); g.lineTo(x + 8, y + 26);
                g.beginFill(colour, 1); g.moveTo(x + 8, y + 6); g.lineTo(x + 22, y + 11); g.lineTo(x + 8, y + 16); g.endFill();
                if (pin.travel) { g.beginFill(0xffffff, 0.95); g.drawCircle(x + 8, y + 27, 3); g.endFill(); }
                g.lineStyle(0);
            }
        },

        // Travel pins on this map whose tile is not one to stand on (MZ's passability or a doodad's collision).
        pinProblems() {
            if (typeof $gameMap === 'undefined' || !$gameMap) return [];
            const mapId = this.currentMapId(), out = [];
            const blocked = this.doodadBlockedTiles ? this.doodadBlockedTiles() : new Set();
            for (const pin of P.list(mapId)) {
                if (!pin.travel) continue;
                const outside = pin.x >= $gameMap.width() || pin.y >= $gameMap.height();
                const stand = !outside && [2, 4, 6, 8].some(dir => $gameMap.isPassable(pin.x, pin.y, dir)) && !blocked.has(pin.x + ',' + pin.y);
                if (!stand) out.push({ kind: 'travelPin', mapId, x: pin.x, y: pin.y, text: `Travel pin "${pin.name}" lands where the player can't stand.` });
            }
            return out;
        }
    });

    W.toolHooks.pins = { overlay(g) { this.drawPins(g); } };
})();
