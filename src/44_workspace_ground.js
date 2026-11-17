// @editor-only
//==========================================================
// SECTION 25G: THE GROUND BRUSH TOOL (8.3.4)
//==========================================================
// Map → Ground Brush: pick a picture in the Item Bag and Use Picked for one of three textures, then paint soft
// dirt, grass or stone off the grid; right-drag erases. Each stroke is one undo step that keeps only the
// rectangle it changed. The mask is written as a PNG when the map is saved; a map with nothing painted has no
// file. The mask and its textures are listed for deployment.
(function() {
    const D = DocsDoodads, W = D.Workspace, G = D.Ground;
    const escapeHtml = value => D.Security.escapeHtml(String(value));
    D.Ui.hints.ground = 'Ground Brush: drag to paint the chosen texture; right-drag erases. Set textures and the brush in the card.';

    Object.assign(W, {
        groundBrush: { channel: 0, radius: 40, strength: 0.6, softness: 0.6 },

        groundMasks() { return (this._groundMasks = this._groundMasks || {}); },

        // The map's mask in memory: read from its PNG the first time, or blank.
        async ensureGroundMask(mapId = this.currentMapId(), loader = path => this.loadPixels(path)) {
            const masks = this.groundMasks();
            if (masks[mapId]) return masks[mapId];
            const size = G.maskSize($gameMap.width(), $gameMap.height(), $gameMap.tileWidth(), $gameMap.tileHeight());
            const settings = G.settings(D.Lighting.mapSettings(mapId));
            let data = G.blank(size.w, size.h);
            if (settings && settings.mask && D.FS.existsSync && D.FS.existsSync(settings.mask)) {
                try {
                    const picture = await loader(D.LiveReload ? D.LiveReload.urlFor(settings.mask) : settings.mask);
                    if (picture.width === size.w && picture.height === size.h) data = new Uint8ClampedArray(picture.data);
                    else this.showToast('The painted ground was made for another map size; it starts again.', 'info');
                } catch (error) { this.showToast(`The painted ground could not be read: ${error.message || error}`, 'error'); }
            }
            masks[mapId] = { w: size.w, h: size.h, data, dirty: false };
            this.groundLive(mapId, { x: 0, y: 0, w: size.w, h: size.h });
            return masks[mapId];
        },

        // The live picture the map draws while editing, updated where a stroke changed it.
        groundLive(mapId, rect) {
            const mask = this.groundMasks()[mapId];
            if (!mask || typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
            const live = G.live[mapId] = G.live[mapId] || {};
            if (!live.canvas || live.canvas.width !== mask.w || live.canvas.height !== mask.h) {
                live.canvas = document.createElement('canvas');
                live.canvas.width = mask.w; live.canvas.height = mask.h;
                live.base = new PIXI.BaseTexture(live.canvas);
                live.texture = new PIXI.Texture(live.base);
                rect = { x: 0, y: 0, w: mask.w, h: mask.h };
            }
            const ctx = live.canvas.getContext && live.canvas.getContext('2d');
            if (ctx && ctx.createImageData && ctx.putImageData && rect) {
                const image = ctx.createImageData(rect.w, rect.h);
                image.data.set(G.copyRect(mask.data, mask.w, rect));
                ctx.putImageData(image, rect.x, rect.y);
                if (live.base && live.base.update) live.base.update();
            }
            return live;
        },

        groundAt(e) {
            const at = this.clientToMapCoords(e.clientX, e.clientY);
            return { x: at.x / G.maskScale, y: at.y / G.maskScale, mapX: at.x, mapY: at.y };
        },

        groundDab(at, erase) {
            const stroke = this._groundStroke;
            if (!stroke) return null;
            const mask = this.groundMasks()[stroke.mapId], b = this.groundBrush;
            const rect = G.dab(mask.data, mask.w, mask.h, at.x, at.y, b.radius / G.maskScale, { channel: b.channel, strength: b.strength, softness: b.softness, erase });
            if (rect) { stroke.rect = G.union(stroke.rect, rect); mask.dirty = true; this.groundLive(stroke.mapId, rect); }
            return rect;
        },

        // A texture for a slot: the picture picked in the Item Bag. The first texture turns the ground on for the map.
        setGroundTexture(slot, path) {
            const mapId = this.currentMapId(), settings = D.Lighting.mapSettings(mapId) || {};
            const ground = Object.assign({ textures: ['', '', ''], mask: '', scale: 1 }, JSON.parse(JSON.stringify(settings.ground || {})));
            ground.textures = [0, 1, 2].map(i => (i === slot ? path || '' : (ground.textures || [])[i] || ''));
            this.setMapSetting('ground', ground);
            return ground;
        },

        // Before a save: each changed map names its mask (or drops it when nothing is painted), so the name is in
        // the data that is written. Returns the maps to write after the save succeeds.
        prepareGroundSave(only) {
            const out = [];
            for (const [id, mask] of Object.entries(this.groundMasks())) {
                const mapId = Number(id);
                if (!mask.dirty || (only && !only.includes(mapId))) continue;
                const settings = D.Lighting.mapSettings(mapId) || {}, empty = G.isEmpty(mask.data), path = empty ? '' : G.maskPath(mapId);
                if ((settings.ground && settings.ground.mask) !== path && (settings.ground || path)) {
                    D.Lighting.setMapSettings(mapId, { ground: Object.assign({ textures: ['', '', ''], scale: 1 }, settings.ground || {}, { mask: path }) });
                }
                out.push(mapId);
            }
            return out.length ? out : null;
        },

        // After the save: the PNG of each prepared map is written, or removed when nothing is painted.
        writeGroundMasks(mapIds) {
            const F = D.FS, written = [];
            for (const mapId of mapIds || []) {
                const mask = this.groundMasks()[mapId];
                if (!mask) continue;
                const path = G.maskPath(mapId);
                if (G.isEmpty(mask.data)) {
                    try { if (F.existsSync(path)) F.fs.unlinkSync(F.path.resolve(path)); } catch (error) { /* gone */ }
                } else {
                    const zlib = require('zlib');
                    F.mkdirp(G.folder);
                    F.atomicWriteFile(path, Buffer.from(D.AsepriteSheets.encodePng(mask.w, mask.h, new Uint8Array(mask.data.buffer, mask.data.byteOffset, mask.data.length), data => zlib.deflateSync(data))));
                    written.push(path);
                }
                mask.dirty = false;
            }
            return written;
        },

        startGroundTool() {
            this.setPlacementTool('ground');
            if (window.$gameMap) this.ensureGroundMask();
            this.showGroundCard();
        },

        closeGroundCard() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-ground-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        showGroundCard() {
            if (typeof document === 'undefined') return null;
            this.closeGroundCard();
            const settings = G.settings(D.Lighting.mapSettings(this.currentMapId())) || { textures: ['', '', ''] }, b = this.groundBrush;
            const card = document.createElement('div');
            card.id = 'dd-ground-card'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:300px;padding:12px;z-index:10040;font-size:11px;display:flex;flex-direction:column;gap:6px;';
            card.innerHTML = `<div class="dd-panel-head">Ground Brush <button class="dd-btn" id="dd-ground-close" type="button">Close</button></div>
                ${[0, 1, 2].map(i => `<label style="display:flex;gap:6px;align-items:center;"><input type="radio" name="dd-ground-slot" id="dd-ground-slot-${i}"${b.channel === i ? ' checked' : ''}>
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(settings.textures[i] ? settings.textures[i].split('/').pop() : '(no texture)')}</span>
                    <button class="dd-btn" type="button" id="dd-ground-use-${i}">Use Picked</button></label>`).join('')}
                <label>Size <input id="dd-ground-radius" type="range" min="8" max="240" step="4" value="${b.radius}"></label>
                <label>Strength <input id="dd-ground-strength" type="range" min="0.05" max="1" step="0.05" value="${b.strength}"></label>
                <label>Soft edge <input id="dd-ground-soft" type="range" min="0" max="1" step="0.05" value="${b.softness}"></label>
                <div style="color:var(--dd-muted);">Drag to paint; right-drag erases. Textures repeat; flat maps only. Saved with the map.</div>`;
            document.body.appendChild(card);
            const node = id => document.getElementById(id);
            node('dd-ground-close').onclick = () => { this.closeGroundCard(); this.setPlacementTool(null); };
            [0, 1, 2].forEach(i => {
                node(`dd-ground-slot-${i}`).onchange = () => { b.channel = i; };
                node(`dd-ground-use-${i}`).onclick = () => {
                    const asset = this.selectedAsset;
                    if (!asset || !/\.(png|jpe?g|webp)$/i.test(asset.path || '')) { this.showToast('Pick a picture in the Item Bag first.', 'info'); return; }
                    this.setGroundTexture(i, asset.path); b.channel = i; this.showGroundCard();
                };
            });
            node('dd-ground-radius').oninput = event => { b.radius = Number(event.target.value) || b.radius; };
            node('dd-ground-strength').oninput = event => { b.strength = Number(event.target.value) || b.strength; };
            node('dd-ground-soft').oninput = event => { b.softness = Number(event.target.value); };
            return card;
        }
    });

    W.toolHooks.ground = {
        buttons: [0, 2],
        down(e) {
            const mapId = this.currentMapId(), mask = this.groundMasks()[mapId];
            if (!mask) { this.ensureGroundMask(mapId); return false; }
            const settings = G.settings(D.Lighting.mapSettings(mapId));
            const erase = e.button === 2;
            if (!erase && !(settings && settings.textures[this.groundBrush.channel])) { this.showToast('Choose a texture for this slot first (Use Picked).', 'info'); return false; }
            this._groundStroke = { mapId, erase, rect: null, before: mask.data.slice() };
            this.groundDab(this.groundAt(e), erase);
            return true;
        },
        move(e, stroking) {
            this._groundCursor = this.clientToMapCoords(e.clientX, e.clientY);
            if (stroking && this._groundStroke) this.groundDab(this.groundAt(e), this._groundStroke.erase);
        },
        up() {
            const stroke = this._groundStroke;
            this._groundStroke = null;
            this._suppressNextClick = true;
            if (!stroke || !stroke.rect) return;
            const mask = this.groundMasks()[stroke.mapId], rect = stroke.rect;
            const before = G.copyRect(stroke.before, mask.w, rect), after = G.copyRect(mask.data, mask.w, rect);
            const put = pixels => { G.putRect(mask.data, mask.w, rect, pixels); mask.dirty = true; D.Persistence.dirtyDoodads = true; this.groundLive(stroke.mapId, rect); };
            D.Undo.execute({ type: 'paint_ground', rect, apply: () => put(after), revert: () => put(before) });
        },
        overlay(g) {
            if (this.placementTool !== 'ground' || !this._groundCursor || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const p = D.mapToScreen(this._groundCursor.x, this._groundCursor.y);
            g.lineStyle(1, D.Ui.mapColor('selection'), 0.9); g.drawCircle(p.x, p.y, this.groundBrush.radius); g.lineStyle(0);
        }
    };

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-ground-btn', icon: 'brush', label: 'Ground Brush', title: 'Paint dirt, grass and stone with soft edges, off the grid' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = typeof document !== 'undefined' ? document.getElementById('dd-ground-btn') : null;
        if (button) button.onclick = () => { this.showMoreMenu(false); this.startGroundTool(); };
        return result;
    };
})();
