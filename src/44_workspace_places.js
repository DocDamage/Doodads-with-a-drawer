// @editor-only
//==========================================================
// SECTION 25M: THE PLACES CARD (8.5.4)
//==========================================================
// Map → Places: the world, its places and their rooms as a tree, each with Go To and a mark on a link whose
// transfer is missing or lands on a blocked tile. "Make a Place Here" (at the picked event, or where the player
// stands) makes the place's map (or uses one), a transfer there and one back at its entrance. "Make a Grid of
// Maps" cuts a big area into maps of up to 256 tiles joined as neighbours, for World View and walking between
// them. RPG Maker MZ must be closed and reopened afterwards to see new maps.
(function() {
    const D = DocsDoodads, W = D.Workspace, NM = D.NewMap, P = D.Places;

    Object.assign(W, {
        setPlaces(list, label) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            const before = data.places ? JSON.parse(JSON.stringify(data.places)) : undefined;
            const after = list.length ? JSON.parse(JSON.stringify(list)) : undefined;
            const write = v => { if (v === undefined) delete data.places; else data.places = JSON.parse(JSON.stringify(v)); D.Persistence.dirtyDoodads = true; this.renderPlacesCard(); };
            D.Undo.execute({ type: 'places', label: label || 'Places', apply: () => write(after), revert: () => write(before) });
        },

        // Adds a transfer event to the map on screen, as an Undo step (saved with the map).
        addTransferHere(x, y, toMap, toX, toY, d, name) {
            const mapId = $gameMap.mapId();
            D.Persistence.stagedFor(mapId);
            const staged = $gameMap._stagedMapData;
            const id = D.Events.allocateSafeId(staged);
            const ev = P.transferEvent(id, x, y, toMap, toX, toY, d, name);
            D.Undo.execute({ type: 'create_event', label: 'Transfer to a place',
                apply: () => { staged.events[id] = ev; D.Persistence.dirtyMap = true; },
                revert: () => { delete staged.events[id]; D.Persistence.dirtyMap = true; } });
            return id;
        },

        // Writes an event into another map's file (backed up), for a link to a map that already exists.
        addTransferInFile(mapId, x, y, toMap, toX, toY, d, name) {
            const FS = D.FS, file = D.Persistence.mapFilePath(mapId), map = FS.readJson(file);
            if (!map) throw new Error(`Map ${mapId} could not be read.`);
            const id = D.Events.allocateSafeId(map);
            const spot = D.Events.nearestFreeTile(map, x, y, map.width, map.height) || { x, y };
            while (map.events.length <= id) map.events.push(null);
            map.events[id] = P.transferEvent(id, spot.x, spot.y, toMap, toX, toY, d, name);
            const entries = [{ path: file, data: map, indent: 0 }];
            FS.backupChanged(entries);
            const result = FS.atomicWriteManyJson(entries);
            if (!result.ok) throw new Error(result.error);
            return spot;
        },

        // spec: { x, y, name, kind, mapId (to use one), width, height }. Returns the place.
        makePlace(spec) {
            const parentId = $gameMap.mapId(), kind = P.sizes[spec.kind] ? spec.kind : 'room';
            const size = P.sizes[kind];
            const x = Math.floor(Number(spec.x) || 0), y = Math.floor(Number(spec.y) || 0);
            // The way back lands beside the door, on a walkable tile next to it (the one below first, as for a door
            // in a north wall), never on the door's own tile: landing on a touch transfer would send the player
            // straight back in.
            const back = this.placeBackTile(x, y);
            let mapId = Math.floor(Number(spec.mapId) || 0), entrance;
            if (!mapId) {
                const w = Math.floor(Number(spec.width) || size[0]), h = Math.floor(Number(spec.height) || size[1]);
                entrance = P.entrance(kind, w, h);
                // The new map's floor: the commonest walkable ground tile here, so the entrance can be walked on.
                const ground = this.commonGroundTile();
                mapId = NM.make({ name: spec.name, width: w, height: h, tilesetId: $gameMap.tilesetId ? $gameMap.tilesetId() : 1, parentId, ground,
                    events: [P.transferEvent(1, entrance.x, entrance.y, parentId, back.x, back.y, 2, 'To ' + (spec.parentName || 'outside'))] });
            } else {
                const map = D.FS.readJson(D.Persistence.mapFilePath(mapId));
                if (!map) throw new Error(`Map ${mapId} could not be read.`);
                entrance = this.addTransferInFile(mapId, Math.floor(map.width / 2), map.height - 2, parentId, back.x, back.y, 2, 'To ' + (spec.parentName || 'outside'));
            }
            this.addTransferHere(x, y, mapId, entrance.x, Math.max(0, entrance.y - 1), 8, 'To ' + (spec.name || 'Map ' + mapId));
            const place = { id: 'place_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), name: String(spec.name || 'Place'), mapId, kind,
                parent: { mapId: parentId, x, y }, entrance };
            this.setPlaces(P.list().concat([place]), 'Link a place');
            return place;
        },

        // A walkable tile next to (x, y) for the way back: below, then left, right and above; (x, y + 1) if none.
        placeBackTile(x, y) {
            const map = $gameMap, valid = (tx, ty) => tx >= 0 && ty >= 0 && tx < map.width() && ty < map.height();
            for (const [dx, dy, d] of [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]]) {
                const tx = x + dx, ty = y + dy;
                if (!valid(tx, ty)) continue;
                if (map.isPassable(tx, ty, 10 - d) && !(D.Collision && D.Collision.blocksTile(tx, ty)) && !map.eventsXyNt(tx, ty).length) return { x: tx, y: ty };
            }
            return { x, y: Math.min(map.height() - 1, y + 1) };
        },

        // The commonest walkable bottom-layer tile on this map (0 when there is none).
        commonGroundTile() {
            const map = window.$dataMap, gm = $gameMap;
            if (!map || !map.data) return 0;
            const counts = new Map(), W = map.width, H = map.height;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                const id = Number(map.data[y * W + x]) || 0;
                if (!id || !gm.isPassable(x, y, 2)) continue;
                // An autotile counts by its kind, with the plain middle shape (0) written.
                const key = D.Tiles.isAutotile(id) ? D.Tiles.make(D.Tiles.kind(id), 0) : id;
                counts.set(key, (counts.get(key) || 0) + 1);
            }
            let best = 0, most = 0;
            for (const [id, n] of counts) if (n > most) { best = id; most = n; }
            return best;
        },

        // Only the link goes; its map and transfers stay (say so).
        removePlace(id) {
            this.setPlaces(P.list().filter(p => p.id !== id), 'Remove place');
        },

        // A grid of maps for a big area, joined as neighbours. Returns the new ids in grid order.
        makeMapGrid(name, tilesW, tilesH) {
            const pieces = NM.grid(Math.floor(tilesW), Math.floor(tilesH));
            if (pieces.length > 64) throw new Error('That would be more than 64 maps.');
            const ids = pieces.map((p, i) => NM.make({ name: `${name} ${p.col + 1}-${p.row + 1}`, width: p.width, height: p.height,
                tilesetId: $gameMap.tilesetId ? $gameMap.tilesetId() : 1, parentId: $gameMap.mapId() }));
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            data.mapSettings = data.mapSettings || {};
            pieces.forEach((p, i) => {
                const neighbors = {};
                for (const [side, j] of Object.entries(p.links)) neighbors[side] = ids[j];
                data.mapSettings[ids[i]] = Object.assign({}, data.mapSettings[ids[i]], { neighbors });
            });
            D.Persistence.dirtyDoodads = true;
            return ids;
        },

        closePlacesCard() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-places-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        openPlacesCard() {
            if (typeof document === 'undefined' || !document.createElement) return null;
            NM.remember();
            let card = document.getElementById('dd-places-card');
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-places-card'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;top:80px;right:20px;width:400px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;';
                document.body.appendChild(card);
            }
            this.renderPlacesCard();
            return card;
        },

        placeProblems(place) {
            const FS = D.FS, read = id => (id === $gameMap.mapId() && $gameMap._stagedMapData ? $gameMap._stagedMapData : FS.readJson(D.Persistence.mapFilePath(id)));
            const flagsOf = ts => ((window.$dataTilesets || [])[ts] || {}).flags || [];
            const c = P.check(place, read, flagsOf);
            return [c.missingThere && 'no transfer there', c.missingBack && 'no way back', c.blockedThere && 'lands on a blocked tile', c.blockedBack && 'the way back lands on a blocked tile'].filter(Boolean);
        },

        renderPlacesCard() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-places-card') : null;
            if (!card) return;
            const infos = window.$dataMapInfos || [];
            const nameOf = id => (infos[id] && infos[id].name) || 'Map ' + id;
            const rows = P.tree(P.list());
            card.innerHTML = `<div class="dd-panel-head">Places <button class="dd-btn" id="dd-places-close" type="button">Close</button></div>
                ${rows.map((r, i) => r.root !== undefined
                    ? `<div style="font-weight:bold;margin-top:4px;">${escapeHtml(nameOf(r.root))} <button class="dd-btn" type="button" id="dd-places-go-root-${i}">Go To</button></div>`
                    : `<div style="display:flex;gap:6px;align-items:center;margin-left:${r.depth * 14}px;"><span style="flex:1;">${escapeHtml(r.place.name)} · ${escapeHtml(r.place.kind || '')} · ${escapeHtml(nameOf(r.place.mapId))}
                        ${(() => { const p = this.placeProblems(r.place); return p.length ? `<span style="color:var(--dd-danger, #ff7070);"> (${escapeHtml(p.join(', '))})</span>` : ''; })()}</span>
                        <button class="dd-btn" type="button" id="dd-places-go-${i}">Go To</button><button class="dd-btn" type="button" id="dd-places-del-${i}">Remove</button></div>`).join('')
                    || '<div style="color:var(--dd-faint);">No places yet.</div>'}
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;"><button class="dd-btn dd-btn-primary" type="button" id="dd-places-make">Make a Place Here</button>
                    <button class="dd-btn" type="button" id="dd-places-grid">Make a Grid of Maps</button></div>
                <div style="color:var(--dd-faint);margin-top:6px;">New maps are written with a backup. Close and reopen the project in RPG Maker MZ to see them; if MZ saves while it is open, it puts back its own list of maps.</div>`;
            const node = id => document.getElementById(id);
            node('dd-places-close').onclick = () => this.closePlacesCard();
            rows.forEach((r, i) => {
                const go = node(r.root !== undefined ? `dd-places-go-root-${i}` : `dd-places-go-${i}`);
                if (go) go.onclick = () => this.goToMap(r.root !== undefined ? r.root : r.place.mapId);
                const del = node(`dd-places-del-${i}`);
                if (del) del.onclick = async () => {
                    if (await D.Ui.confirm(`Remove the link to ${r.place.name}? Its map (${nameOf(r.place.mapId)}) and its transfer events stay; delete them in RPG Maker MZ if you want them gone.`, { okLabel: 'Remove Link' })) this.removePlace(r.place.id);
                };
            });
            node('dd-places-make').onclick = async () => {
                const ev = this.selectedEvent && (this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event()));
                const at = ev ? { x: ev.x, y: ev.y } : { x: $gamePlayer.x, y: $gamePlayer.y };
                const v = await D.Ui.form({ title: `A Place at ${at.x}, ${at.y}`, ok: 'Make It', fields: [
                    { key: 'name', label: 'Name', value: 'House' },
                    { key: 'kind', label: 'Kind', type: 'select', value: 'room', options: Object.keys(P.sizes).map(k => ({ value: k, label: k })) },
                    { key: 'mapId', label: 'Use a map that exists (its id; blank makes one)', value: '' }] });
                if (!v) return;
                try {
                    const place = this.makePlace({ x: at.x, y: at.y, name: v.name, kind: v.kind, mapId: v.mapId, parentName: nameOf($gameMap.mapId()) });
                    this.showToast(`${place.name} is Map ${place.mapId}, with transfers both ways. Save, then close and reopen the project in RPG Maker MZ to see it.`);
                } catch (error) { this.showToast(String(error.message || error), 'error'); }
            };
            node('dd-places-grid').onclick = async () => {
                const v = await D.Ui.form({ title: 'A Grid of Maps', ok: 'Make Them', fields: [
                    { key: 'name', label: 'Name', value: 'World' }, { key: 'w', label: 'Tiles across in all', value: '512' }, { key: 'h', label: 'Tiles down in all', value: '256' }] });
                if (!v) return;
                try {
                    const ids = this.makeMapGrid(v.name || 'World', Number(v.w) || 256, Number(v.h) || 256);
                    this.showToast(`Made ${ids.length} maps (${ids.join(', ')}) joined as neighbours. Save, then reopen the project in RPG Maker MZ.`);
                } catch (error) { this.showToast(String(error.message || error), 'error'); }
            };
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-places-btn', icon: 'map', label: 'Places', title: "The world's places and rooms as a tree: make a place's map with transfers both ways, check its links, go to it" });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-places-btn') : null;
        if (btn) btn.onclick = () => { if (this.showMoreMenu) this.showMoreMenu(false); this.openPlacesCard(); };
        return result;
    };
})();
