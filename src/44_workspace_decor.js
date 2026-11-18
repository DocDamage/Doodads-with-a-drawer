// @editor-only
//==========================================================
// SECTION 25D: THE DECORATE CARD, THE MAKER'S SIDE (8.4.1)
//==========================================================
// Map → Decorate: the catalog of pieces players may place (made from the doodad picked on the map, or the Item
// Bag's picked picture), each with its tiles, a limit and where it comes from (the bag given by Give Decor
// Item, a party item, or free); and this map's zone, as regions and boxes, drawn over the map while the card is
// open. Every change is one Undo step. The game opens it with the Open Decorate Mode command.
(function() {
    const D = DocsDoodads, W = D.Workspace, Dc = D.Decor;

    Object.assign(W, {
        decorCopy() {
            const data = window.$dataDocsDoodads || {};
            return JSON.parse(JSON.stringify(data.decor && typeof data.decor === 'object' ? data.decor : { catalog: [], zones: {} }));
        },

        setDecorData(next, label) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            const before = data.decor ? JSON.parse(JSON.stringify(data.decor)) : undefined;
            const clean = JSON.parse(JSON.stringify(next));
            clean.catalog = (clean.catalog || []).filter(Boolean);
            clean.zones = clean.zones || {};
            for (const k of Object.keys(clean.zones)) if (!Dc.zonesFor.call({ data: () => ({ zones: clean.zones }) }, k)) delete clean.zones[k];
            const after = clean.catalog.length || Object.keys(clean.zones).length ? clean : undefined;
            const write = v => { if (v === undefined) delete data.decor; else data.decor = JSON.parse(JSON.stringify(v)); D.Persistence.dirtyDoodads = true; this.renderDecorCard(); };
            D.Undo.execute({ type: 'decor', label: label || 'Decorate', apply: () => write(after), revert: () => write(before) });
            return true;
        },

        // A catalog piece from a doodad (its picture, light, states, collision) or a picked picture.
        decorPieceFrom(source, name) {
            let doodad;
            if (source && source.bit) {
                doodad = JSON.parse(JSON.stringify(source));
                for (const k of ['x', 'y', 'uid', 'name', 'layer', 'locked', 'temp', 'decor', 'prefabRef', 'editorHidden']) delete doodad[k];
            } else if (source && source.path) {
                doodad = D.standardStruct();
                doodad.bit = [3, source.path];
                doodad.frameW = source.frameW || source.width || 48;
                doodad.frameH = source.frameH || source.height || 48;
                delete doodad.x; delete doodad.y; delete doodad.uid;
            } else return null;
            const tw = $gameMap.tileWidth();
            const w = Math.max(1, Math.min(8, Math.round(Math.abs((Number(doodad.frameW) || tw) * (Number(doodad.scaleX) || 1)) / tw)));
            const base = String(name || (doodad.bit[1] || 'piece').split('/').pop().replace(/\.\w+$/, '')).trim() || 'Piece';
            return { name: base, doodad, w, h: 1, limit: 0, price: 0, itemId: 0, free: false };
        },

        addDecorPiece(source, name) {
            const piece = this.decorPieceFrom(source, name);
            if (!piece) return null;
            const next = this.decorCopy();
            next.catalog = next.catalog || [];
            const base = 'decor_' + piece.name.toLowerCase().replace(/[^\w]+/g, '_').slice(0, 24);
            let id = base, n = 2;
            while (next.catalog.some(i => i && i.id === id)) id = base + '_' + n++;
            piece.id = id;
            next.catalog.push(piece);
            this.setDecorData(next, 'Add decor piece');
            return id;
        },

        editDecorPiece(id, change) {
            const next = this.decorCopy();
            const i = (next.catalog || []).findIndex(p => p && p.id === id);
            if (i < 0) return false;
            if (change === null) next.catalog.splice(i, 1); else Object.assign(next.catalog[i], change, { id });
            return this.setDecorData(next, change === null ? 'Remove decor piece' : 'Change decor piece');
        },

        setDecorZone(mapId, zone) {
            const next = this.decorCopy();
            next.zones = next.zones || {};
            if (!zone || (!String(zone.regions || '').trim() && !(zone.boxes || []).length)) delete next.zones[mapId];
            else next.zones[mapId] = { regions: String(zone.regions || '').trim(), boxes: (zone.boxes || []).slice(0, 32) };
            return this.setDecorData(next, 'Decor zone');
        },

        closeDecorCard() {
            this._decorCardOpen = false;
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-decor-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        openDecorCard() {
            if (typeof document === 'undefined' || !document.createElement) return null;
            let card = document.getElementById('dd-decor-card');
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-decor-card'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;top:80px;right:20px;width:380px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;';
                document.body.appendChild(card);
            }
            this._decorCardOpen = true;
            this.renderDecorCard();
            return card;
        },

        renderDecorCard() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-decor-card') : null;
            if (!card) return;
            const mapId = this.currentMapId(), data = this.decorCopy(), zone = (data.zones || {})[mapId] || { regions: '', boxes: [] };
            const list = Dc.catalog();
            card.innerHTML = `<div class="dd-panel-head">Decorate <button class="dd-btn" id="dd-decor-close" type="button">Close</button></div>
                <div style="color:var(--dd-muted);margin-bottom:6px;">Pieces players may place in the game with the Open Decorate Mode command. They keep them in their save; they can't wall themselves in.</div>
                <div class="dd-panel-head">Pieces</div>
                ${list.map((p, i) => `<div style="display:flex;gap:6px;align-items:center;margin-bottom:3px;"><span style="flex:1;">${escapeHtml(p.name)} · ${p.w}×${p.h} · ${p.itemId ? 'item ' + p.itemId : p.free ? 'free' : 'given'}${p.limit ? ' · up to ' + p.limit : ''}</span>
                    <button class="dd-btn" type="button" id="dd-decor-edit-${i}">Change</button></div>`).join('') || '<div style="color:var(--dd-faint);">None yet.</div>'}
                <button class="dd-btn" id="dd-decor-add" type="button" title="The doodad picked on the map, or the picture picked in the Item Bag">Add the Picked One</button>
                <div class="dd-panel-head" style="margin-top:8px;">Where on this map</div>
                <label>Regions <input id="dd-decor-regions" type="text" value="${escapeHtml(zone.regions || '')}" placeholder="e.g. 12" style="width:100%"></label>
                <div>${(zone.boxes || []).map(b => `${b.x},${b.y} ${b.w}×${b.h}`).join('; ') || 'No boxes.'}</div>
                <button class="dd-btn" id="dd-decor-box" type="button">Add a Box</button> <button class="dd-btn" id="dd-decor-clear" type="button">Clear Boxes</button>
                <div style="color:var(--dd-faint);margin-top:6px;">The zone shows on the map while this card is open. Commands: Open Decorate Mode, Give Decor Item, Count Decor.</div>`;
            const node = id => document.getElementById(id);
            node('dd-decor-close').onclick = () => this.closeDecorCard();
            node('dd-decor-add').onclick = async () => {
                const picked = this.selectionItems ? this.selectionItems()[0] : null;
                const source = picked && picked.bit ? picked : this.selectedAsset;
                if (!source) { this.showToast('Pick a doodad on the map or a picture in the Item Bag first.'); return; }
                const name = await D.Ui.prompt('What players will see it called', this.decorPieceFrom(source).name, { title: 'Add a Piece' });
                if (name) this.addDecorPiece(source, name);
            };
            list.forEach((p, i) => {
                const edit = node(`dd-decor-edit-${i}`);
                if (edit) edit.onclick = async () => {
                    const v = await D.Ui.form({ title: 'Change Piece', ok: 'Keep', fields: [
                        { key: 'name', label: 'Name', value: p.name },
                        { key: 'w', label: 'Tiles across', value: String(p.w) }, { key: 'h', label: 'Tiles up', value: String(p.h) },
                        { key: 'limit', label: 'At most (0: no limit)', value: String(p.limit) },
                        { key: 'price', label: 'Price (for your own shop events)', value: String(p.price) },
                        { key: 'itemId', label: 'Uses a party item (its id; 0 for none)', value: String(p.itemId) },
                        { key: 'free', label: 'Free (no need to be given)', type: 'checkbox', value: p.free },
                        { key: 'remove', label: 'Remove this piece', type: 'checkbox', value: false }
                    ] });
                    if (!v) return;
                    if (v.remove) { this.editDecorPiece(p.id, null); return; }
                    this.editDecorPiece(p.id, { name: v.name || p.name, w: Number(v.w) || 1, h: Number(v.h) || 1, limit: Number(v.limit) || 0, price: Number(v.price) || 0, itemId: Number(v.itemId) || 0, free: Boolean(v.free) });
                };
            });
            node('dd-decor-regions').onchange = e => this.setDecorZone(mapId, Object.assign({}, zone, { regions: e.target.value }));
            node('dd-decor-box').onclick = async () => {
                const v = await D.Ui.form({ title: 'A Box Where Pieces May Go', ok: 'Add', fields: [
                    { key: 'x', label: 'Left tile', value: String($gamePlayer ? $gamePlayer.x : 0) }, { key: 'y', label: 'Top tile', value: String($gamePlayer ? $gamePlayer.y : 0) },
                    { key: 'w', label: 'Tiles across', value: '4' }, { key: 'h', label: 'Tiles down', value: '4' }] });
                if (v) this.setDecorZone(mapId, Object.assign({}, zone, { boxes: (zone.boxes || []).concat([{ x: Number(v.x) || 0, y: Number(v.y) || 0, w: Number(v.w) || 1, h: Number(v.h) || 1 }]) }));
            };
            node('dd-decor-clear').onclick = () => this.setDecorZone(mapId, Object.assign({}, zone, { boxes: [] }));
        },

        drawDecorZone(g) {
            if (!this._decorCardOpen || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const zones = Dc.zonesFor(this.currentMapId());
            if (!zones) return;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), colour = D.Ui.mapColor('selection');
            const x0 = Math.floor($gameMap.displayX()), y0 = Math.floor($gameMap.displayY());
            g.beginFill(colour, 0.18);
            for (let y = y0; y < y0 + $gameMap.screenTileY() + 1; y++) for (let x = x0; x < x0 + $gameMap.screenTileX() + 1; x++) {
                if (!Dc.inZone(zones, x, y, (a, b) => $gameMap.regionId(a, b))) continue;
                const p = D.mapToScreen(x * tw, y * th);
                g.drawRect(p.x, p.y, tw, th);
            }
            g.endFill();
        }
    });

    W.toolHooks.decorZone = { overlay(g) { this.drawDecorZone(g); } };

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-decor-btn', icon: 'box', label: 'Decorate', title: 'Pieces players may place and move in the game (housing, farms, shop floors), and where' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-decor-btn') : null;
        if (btn) btn.onclick = () => { if (this.showMoreMenu) this.showMoreMenu(false); this.openDecorCard(); };
        return result;
    };
})();
