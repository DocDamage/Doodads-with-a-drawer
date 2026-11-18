// @editor-only
//==========================================================
// SECTION 25K: BAKE THIS MAP (7.3.4)
//==========================================================
// Map → Bake This Map / Bake Every Map draws each map's still doodads into chunk pictures and keeps the manifest
// with the doodad data (so Save writes it). A map with nothing still has its old chunks removed. Any later change
// to a map's doodads makes its bake stale: the game then draws the real doodads, and Problems says to bake again.
(function() {
    const D = DocsDoodads, W = D.Workspace, B = D.Bake;

    Object.assign(W, {
        bakeSources(mapId) {
            const live = window.$dataDocsDoodads || {};
            if (mapId === this.currentMapId() || Array.isArray(live[mapId])) {
                const map = mapId === this.currentMapId() && window.$dataMap ? $dataMap : D.FS.readJson(D.Persistence.mapFilePath(mapId));
                return { list: live[mapId] || [], map };
            }
            const all = D.DataFiles.readAll() || {};
            return { list: all[mapId] || [], map: D.FS.readJson(D.Persistence.mapFilePath(mapId)) };
        },

        // A chunk's picture: PNG bytes. The default draws with a canvas and the pictures MZ loads.
        async drawBakeChunk(chunk, tw, th, mapW, mapH) {
            const size = B.size, w = Math.min(size, mapW - chunk.cx * size), h = Math.min(size, mapH - chunk.cy * size);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, w); canvas.height = Math.max(1, h);
            const ctx = canvas.getContext('2d');
            for (const it of chunk.items) {
                const d = it.d, bmp = D.loadBitmap(d.bit[1]);
                if (bmp && bmp.isReady && !bmp.isReady()) await new Promise(resolve => bmp.addLoadListener(resolve));
                const image = bmp && (bmp._image || bmp._canvas || bmp.canvas);
                if (!image) continue;
                const fw = Number(d.frameW) || bmp.width, fh = Number(d.frameH) || bmp.height;
                ctx.save();
                ctx.globalAlpha = d.opacity !== undefined ? Number(d.opacity) : 1;
                ctx.translate(d.x - chunk.cx * size, d.y - chunk.cy * size);
                if (Number(d.rotation)) ctx.rotate(Number(d.rotation) * Math.PI / 180);
                ctx.scale(d.scaleX !== undefined ? d.scaleX : 1, d.scaleY !== undefined ? d.scaleY : 1);
                const ax = d.anchorX !== undefined ? d.anchorX : 0.5, ay = d.anchorY !== undefined ? d.anchorY : 1;
                ctx.drawImage(image, Number(d.frameX) || 0, Number(d.frameY) || 0, fw, fh, -ax * fw, -ay * fh, fw, fh);
                ctx.restore();
            }
            const url = canvas.toDataURL('image/png');
            return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
        },

        // Bakes one map. draw(chunk, tw, th, mapW, mapH) → PNG bytes (tests give their own). Returns the manifest or null.
        async bakeMap(mapId, draw) {
            const FS = D.FS;
            const { list, map } = this.bakeSources(mapId);
            if (!map) throw new Error(`Map ${mapId} could not be read.`);
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), mapW = map.width * tw, mapH = map.height * th;
            const ms = D.Lighting.mapSettings(mapId);
            const usable = list.filter(d => d && D.Layers.visibleInGame(d, ms));
            const chunks = B.chunks(usable, mapW, mapH);
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            FS.mkdirp(B.dir);
            const prefix = `Map${String(mapId).padStart(3, '0')}_`;
            const old = FS.fs.readdirSync(B.dir).filter(f => f.startsWith(prefix) && f.endsWith('.png'));
            if (!chunks.length) {
                for (const f of old) FS.fs.unlinkSync(`${B.dir}/${f}`);
                if (data.baked) { delete data.baked[mapId]; if (!Object.keys(data.baked).length) delete data.baked; }
                D.Persistence.dirtyDoodads = true;
                return null;
            }
            const manifest = B.manifest(mapId, chunks, list);
            for (const c of chunks) FS.fs.writeFileSync(B.file(mapId, c.band, c.cx, c.cy), await (draw || this.drawBakeChunk.bind(this))(c, tw, th, mapW, mapH));
            const keep = new Set(manifest.chunks.map(c => c.file.split('/').pop()));
            for (const f of old) if (!keep.has(f)) FS.fs.unlinkSync(`${B.dir}/${f}`);
            data.baked = data.baked || {};
            data.baked[mapId] = manifest;
            D.Persistence.dirtyDoodads = true;
            return manifest;
        },

        async bakeMaps(ids, draw) {
            const progress = D.Ui.progress ? D.Ui.progress('Baking maps', { delay: 200 }) : null;
            const done = [];
            try {
                for (let i = 0; i < ids.length; i++) {
                    if (progress && progress.set) progress.set((i + 1) / ids.length, `Map ${ids[i]}`);
                    const m = await this.bakeMap(ids[i], draw);
                    done.push({ mapId: ids[i], chunks: m ? m.chunks.length : 0, doodads: m ? m.uids.length : 0 });
                }
            } finally { if (progress && progress.done) progress.done(); }
            return done;
        },

        // Maps whose bake no longer matches their doodads.
        staleBakes() {
            const data = window.$dataDocsDoodads || {};
            return Object.keys(data.baked || {}).map(Number).filter(id => B.stale(data.baked[id], data[id] || []));
        }
    });

    // Problems: a stale bake.
    const problems = W.collectProblems;
    if (typeof problems === 'function') {
        W.collectProblems = function() {
            const out = problems.apply(this, arguments) || [];
            for (const id of this.staleBakes()) out.push({ kind: 'bakeStale', mapId: id, global: true, text: `Map ${id}'s baked pictures are out of date: Map → Bake This Map again (the game draws the real doodads until then).` });
            return out;
        };
    }

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) {
            map.items.push({ id: 'dd-bake-btn', icon: 'picture', label: 'Bake This Map', title: 'Draw still doodads into a few big pictures, for phones and slow machines' });
            map.items.push({ id: 'dd-bake-all-btn', icon: 'picture', label: 'Bake Every Map', title: 'Bake every map that has doodads' });
        }
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), node = id => (typeof document !== 'undefined' ? document.getElementById(id) : null);
        const report = done => {
            const n = done.reduce((a, r) => a + r.doodads, 0), c = done.reduce((a, r) => a + r.chunks, 0);
            this.showToast(`Baked ${n} still doodads into ${c} pictures. Save to keep it; a change to a map's doodads needs baking again.`);
        };
        const one = node('dd-bake-btn'), all = node('dd-bake-all-btn');
        if (one) one.onclick = async () => { if (this.showMoreMenu) this.showMoreMenu(false); try { report(await this.bakeMaps([this.currentMapId()])); } catch (e) { this.showToast(String(e.message || e), 'error'); } };
        if (all) all.onclick = async () => {
            if (this.showMoreMenu) this.showMoreMenu(false);
            const data = window.$dataDocsDoodads || {}, saved = D.DataFiles.readAll() || {};
            const ids = Array.from(new Set(Object.keys(data).concat(Object.keys(saved)).filter(k => /^\d+$/.test(k)).map(Number))).sort((a, b) => a - b);
            try { report(await this.bakeMaps(ids)); } catch (e) { this.showToast(String(e.message || e), 'error'); }
        };
        return result;
    };
})();
