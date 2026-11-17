// @editor-only
//==========================================================
// SECTION 25W: SAVE 3D MAP AS FILE (8.4.8)
//==========================================================
// Map → Save 3D Map as File writes the ground (the 3D view's terrain, or two triangles for a flat map) with the
// map's tiles as its picture, and the standing doodads as upright pictures, into one .glb in screenshots/, for
// Blender, a trailer or a 3D print. It asks first and says that the file carries the project's art.
(function() {
    const D = DocsDoodads, W = D.Workspace, GW = D.GltfWrite;

    Object.assign(W, {
        mapGlbName(mapId, date = new Date()) {
            const p = n => String(n).padStart(2, '0');
            return `Map${String(mapId).padStart(3, '0')}_3d_${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}.glb`;
        },

        standingDoodads() {
            const settings = D.Lighting.mapSettings(this.currentMapId());
            return (D.doodads() || []).filter(d => d && d.bit && d.bit[0] === 3 && !d.line && !(d.model && d.model.path) &&
                D.Depth.resolve(d) !== 'below' && D.Layers.visibleInGame(d, settings));
        },

        // A doodad's first frame as PNG bytes.
        async framePng(d) {
            const bmp = D.loadBitmap(d.bit[1]);
            if (!bmp) return null;
            if (bmp.isReady && !bmp.isReady()) await new Promise(resolve => bmp.addLoadListener(resolve));
            const source = bmp._canvas || bmp._image || (bmp._baseTexture && bmp._baseTexture.resource && bmp._baseTexture.resource.source);
            if (!source) return null;
            const w = Math.max(1, Math.min(bmp.width, d.frameW || bmp.width)), h = Math.max(1, Math.min(bmp.height, d.frameH || bmp.height));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(source, d.frameX || 0, d.frameY || 0, w, h, 0, 0, w, h);
            const encoded = canvas.toDataURL('image/png').split(',')[1];
            return encoded ? Buffer.from(encoded, 'base64') : null;
        },

        async saveMapGlb(options = {}) {
            const F = D.FS, scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null, spriteset = scene && scene._spriteset;
            if (!D.Compat.isTest() || !F.fs || !spriteset || !window.$gameMap) { this.showToast('Open a map in a playtest to save it as a 3D file.', 'error'); return null; }
            const values = options.values || await D.Ui.form({ title: 'Save 3D Map as File', ok: 'Save',
                text: "Writes this map's ground and standing doodads as one .glb file in screenshots/, for Blender, a trailer or a 3D print. The file carries this project's art: share it only where the art's licences allow.",
                fields: [
                    { key: 'scale', label: 'Ground picture size', type: 'select', value: '0.5', options: [{ value: '1', label: 'Full' }, { value: '0.5', label: 'Half' }, { value: '0.25', label: 'Quarter' }] },
                    { key: 'groundOnly', label: 'Ground only (no standing doodads)', type: 'checkbox', value: false }
                ] });
            if (!values) return null;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), tilesW = $gameMap.width(), tilesH = $gameMap.height();
            const standing = values.groundOnly ? [] : this.standingDoodads();
            // The ground's picture: tiles and floor decals; standing doodads are left out while it is drawn.
            const hidden = [];
            for (const sprite of spriteset._docsDoodadSprites || []) if (standing.includes(sprite._data) && sprite.renderable !== false) { sprite.renderable = false; hidden.push(sprite); }
            let canvas;
            try { canvas = D.MapExport.capture(spriteset, { scale: Number(values.scale) || 0.5 }).canvas; }
            finally { for (const sprite of hidden) sprite.renderable = true; }
            const picture = canvas.toDataURL('image/png').split(',')[1];
            const T = D.Terrain, grid = T.grid ? T.grid(true) : null;
            const ground = grid ? GW.groundFromTerrain(T.buildMesh(grid, 0, 0, tilesW, tilesH, tw, th, grid.style, T.light, 0), tw, th, tilesW * tw, tilesH * th) : GW.flatGround(tilesW, tilesH);
            ground.image = { bytes: Buffer.from(picture, 'base64'), mime: 'image/png' };
            ground.cutout = false;
            const meshes = [ground], groups = new Map();
            for (const d of standing) {
                const key = `${d.bit[1]}|${d.frameX || 0}|${d.frameY || 0}|${d.frameW || 0}|${d.frameH || 0}`;
                if (!groups.has(key)) groups.set(key, { d, items: [] });
                const sx = d.scaleX === undefined ? 1 : d.scaleX, sy = d.scaleY === undefined ? 1 : d.scaleY;
                groups.get(key).items.push({ x: d.x / tw, y: d.y / th, w: (d.frameW || 48) * Math.abs(sx) / tw, h: (d.frameH || 48) * Math.abs(sy) / th,
                    ground: grid ? T.heightAt(grid, d.x / tw, d.y / th, grid.style) : 0, flipX: sx < 0 });
            }
            for (const { d, items } of groups.values()) {
                const bytes = await (options.framePng || (x => this.framePng(x)))(d);
                if (bytes) meshes.push(GW.quads(String(d.bit[1]).split('/').pop().replace(/\.[^.]+$/, ''), items, { bytes, mime: 'image/png' }));
            }
            const glb = GW.glb(meshes);
            F.mkdirp('screenshots');
            const out = 'screenshots/' + this.mapGlbName($gameMap.mapId());
            F.atomicWriteFile(out, Buffer.from(glb.buffer, glb.byteOffset, glb.byteLength));
            this.showToast(`Saved ${out} (${Math.round(glb.byteLength / 1024)} KB, ${meshes.length} mesh(es)).`, 'success');
            try { if (typeof nw !== 'undefined' && nw.Shell) nw.Shell.showItemInFolder(F.path.resolve(out)); } catch (error) { /* no shell */ }
            return out;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-map-glb-btn', icon: 'box', label: 'Save 3D Map as File', title: 'Write the ground and standing doodads as a .glb for Blender, trailers or 3D printing' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = typeof document !== 'undefined' ? document.getElementById('dd-map-glb-btn') : null;
        if (button) button.onclick = () => { this.showMoreMenu(false); this.saveMapGlb(); };
        return result;
    };
})();
