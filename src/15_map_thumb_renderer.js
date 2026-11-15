//==========================================================
// SECTION 6k: SMALL MAP PICTURE RENDERER
//==========================================================
// Unlike MapExport.capture this never moves the camera or renders the live scene. MZ's Tilemap methods
// calculate the same normal/autotile source rectangles into two tiny canvas layers; doodads go between
// lower and upper tiles. Large maps yield every few milliseconds and never allocate a full-map bitmap.
(function(MapThumb) {
    const yieldFrame = () => new Promise(resolve => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve);
        else setTimeout(resolve, 0);
    });

    function bitmapSource(bitmap) {
        return bitmap && (bitmap._canvas || bitmap._image || bitmap.canvas);
    }

    function waitBitmap(bitmap) {
        if (!bitmap) return Promise.resolve(null);
        if (!bitmap.isReady || bitmap.isReady()) return Promise.resolve(bitmap);
        return new Promise((resolve, reject) => {
            let done = false;
            let poll = null, timeout = null;
            const finish = (value, error) => {
                if (done) return;
                done = true;
                clearInterval(poll);
                clearTimeout(timeout);
                if (error) reject(error); else resolve(value);
            };
            if (bitmap.addLoadListener) bitmap.addLoadListener(() => finish(bitmap));
            poll = setInterval(() => {
                if (bitmap.isError && bitmap.isError()) finish(null, new Error('A map picture asset could not be loaded.'));
                else if (!bitmap.isReady || bitmap.isReady()) finish(bitmap);
            }, 50);
            timeout = setTimeout(() => finish(null, new Error('A map picture asset took too long to load.')), 15000);
        });
    }

    function makeCanvas(width, height) {
        const out = document.createElement('canvas');
        out.width = width;
        out.height = height;
        return out;
    }

    function layer(context, bitmaps, scale) {
        return {
            addRect(setNumber, sx, sy, dx, dy, width, height) {
                const x = dx * scale, y = dy * scale, w = width * scale, h = height * scale;
                if (setNumber < 0) {
                    context.fillStyle = 'rgba(0,0,0,0.5)';
                    context.fillRect(x, y, w, h);
                    return;
                }
                const source = bitmapSource(bitmaps[setNumber]);
                if (!source) return;
                try { context.drawImage(source, sx, sy, width, height, x, y, w, h); } catch (error) {}
            }
        };
    }

    async function tilesetBitmaps(names) {
        const bitmaps = [];
        for (let i = 0; i < 9; i++) {
            const name = names[i];
            bitmaps[i] = name && typeof ImageManager !== 'undefined' ? ImageManager.loadTileset(name) : null;
        }
        await Promise.all(bitmaps.filter(Boolean).map(waitBitmap));
        return bitmaps;
    }

    function doodadBitmap(doodad, tileBitmaps) {
        const bit = doodad && doodad.bit;
        if (!bit || typeof ImageManager === 'undefined') return null;
        if (bit[0] === 1) return ImageManager.loadSystem('IconSet');
        if (bit[0] === 2) return tileBitmaps[Number(bit[1]) || 0] || null;
        if (bit[0] === 3) return DocsDoodads.loadBitmap(bit[1]);
        return null;
    }

    function frameOf(doodad, bitmap) {
        const bit = doodad.bit || [];
        if (bit[0] === 1 && doodad.frameW === undefined) {
            const index = Math.max(0, Number(doodad.index) || 0);
            return { x: index % 16 * 32, y: Math.floor(index / 16) * 32, w: 32, h: 32 };
        }
        return {
            x: Number(doodad.frameX) || 0,
            y: Number(doodad.frameY) || 0,
            w: Math.max(1, Number(doodad.frameW) || bitmap.width || 1),
            h: Math.max(1, Number(doodad.frameH) || bitmap.height || 1)
        };
    }

    async function drawDoodads(context, doodads, bitmaps, scale) {
        // Only this small map job retains decoded pictures, and no more than 24 distinct ones at once.
        const retained = new Map();
        let sliceStarted = Date.now();
        for (const doodad of doodads) {
            const key = doodad.bit ? doodad.bit[0] + ':' + doodad.bit[1] : '';
            let bitmap = retained.get(key);
            if (!bitmap) {
                bitmap = await waitBitmap(doodadBitmap(doodad, bitmaps));
                if (bitmap) {
                    if (retained.size >= 24) retained.delete(retained.keys().next().value);
                    retained.set(key, bitmap);
                }
            }
            const source = bitmapSource(bitmap);
            if (source) {
                const frame = frameOf(doodad, bitmap);
                const anchorX = doodad.anchorX !== undefined ? Number(doodad.anchorX) : 0.5;
                const anchorY = doodad.anchorY !== undefined ? Number(doodad.anchorY) : 1;
                context.save();
                context.globalAlpha = Math.max(0, Math.min(1, doodad.opacity !== undefined ? Number(doodad.opacity) : 1));
                context.translate((Number(doodad.x) || 0) * scale, (Number(doodad.y) || 0) * scale);
                context.rotate((Number(doodad.rotation) || 0) * Math.PI / 180);
                context.scale((doodad.scaleX !== undefined ? Number(doodad.scaleX) : 1) * scale,
                    (doodad.scaleY !== undefined ? Number(doodad.scaleY) : 1) * scale);
                try { context.drawImage(source, frame.x, frame.y, frame.w, frame.h, -anchorX * frame.w, -anchorY * frame.h, frame.w, frame.h); } catch (error) {}
                context.restore();
            }
            if (Date.now() - sliceStarted >= 5) { await yieldFrame(); sliceStarted = Date.now(); }
        }
        retained.clear();
    }

    MapThumb.snapshotCurrent = function(mapId) {
        if (typeof window === 'undefined' || !window.$gameMap || Number(window.$gameMap.mapId()) !== Number(mapId) || !window.$dataMap) return null;
        const live = window.$gameMap;
        const stagedOwner = live._stagedMapDataId !== undefined ? Number(live._stagedMapDataId) : Number(mapId);
        const staged = live._stagedMapData && stagedOwner === Number(mapId) ? live._stagedMapData : null;
        const source = staged && Array.isArray(staged.data) ? staged : window.$dataMap;
        const tilesetId = Number(source.tilesetId !== undefined ? source.tilesetId : (live.tilesetId ? live.tilesetId() : 0));
        const tileset = typeof $dataTilesets !== 'undefined' && $dataTilesets ? $dataTilesets[tilesetId] : null;
        const doodads = DocsDoodads.doodads(Number(mapId)).filter(d => d && d.posMode !== 0 && !d.temp).map(d => cloneJson(d));
        const settings = window.$dataDocsDoodads && window.$dataDocsDoodads.mapSettings ? cloneJson(window.$dataDocsDoodads.mapSettings[mapId] || null) : null;
        return {
            mapId: Number(mapId), width: Number(source.width) || 1, height: Number(source.height) || 1,
            tileWidth: live.tileWidth ? live.tileWidth() : 48, tileHeight: live.tileHeight ? live.tileHeight() : 48,
            scrollType: Number(source.scrollType) || 0, data: Array.isArray(source.data) ? source.data.slice() : [],
            tilesetNames: tileset && tileset.tilesetNames ? tileset.tilesetNames.slice() : [],
            flags: tileset && tileset.flags ? tileset.flags.slice() : [], doodads, settings
        };
    };

    MapThumb.render = async function(snapshot) {
        if (!snapshot || typeof document === 'undefined' || typeof Tilemap === 'undefined' || typeof ImageManager === 'undefined') throw new Error('The map picture renderer is unavailable.');
        const size = this.dimensions(snapshot.width, snapshot.height, snapshot.tileWidth, snapshot.tileHeight);
        const lower = makeCanvas(size.width, size.height), upper = makeCanvas(size.width, size.height), out = makeCanvas(size.width, size.height);
        const lowerContext = lower.getContext('2d'), upperContext = upper.getContext('2d'), context = out.getContext('2d');
        lowerContext.imageSmoothingEnabled = upperContext.imageSmoothingEnabled = context.imageSmoothingEnabled = false;
        const bitmaps = await tilesetBitmaps(snapshot.tilesetNames || []);
        const tilemap = Object.create(Tilemap.prototype);
        tilemap.tileWidth = snapshot.tileWidth;
        tilemap.tileHeight = snapshot.tileHeight;
        tilemap.flags = snapshot.flags || [];
        tilemap.animationFrame = 0;
        tilemap.horizontalWrap = snapshot.scrollType === 2 || snapshot.scrollType === 3;
        tilemap.verticalWrap = snapshot.scrollType === 1 || snapshot.scrollType === 3;
        tilemap._mapWidth = snapshot.width;
        tilemap._mapHeight = snapshot.height;
        tilemap._mapData = snapshot.data;
        tilemap._lowerLayer = layer(lowerContext, bitmaps, size.scale);
        tilemap._upperLayer = layer(upperContext, bitmaps, size.scale);
        let sliceStarted = Date.now();
        for (let y = 0; y < snapshot.height; y++) {
            for (let x = 0; x < snapshot.width; x++) tilemap._addSpot(0, 0, x, y);
            if (Date.now() - sliceStarted >= 5) { await yieldFrame(); sliceStarted = Date.now(); }
        }
        context.drawImage(lower, 0, 0);
        const visible = (snapshot.doodads || []).filter(d => !d.editorHidden && DocsDoodads.Layers.visibleInGame(d, snapshot.settings));
        visible.sort((a, b) => {
            const za = DocsDoodads.Depth.spriteZ(a), zb = DocsDoodads.Depth.spriteZ(b);
            return za - zb || DocsDoodads.Depth.baseY(a) - DocsDoodads.Depth.baseY(b);
        });
        const split = visible.findIndex(d => DocsDoodads.Depth.spriteZ(d) >= 4);
        const under = split < 0 ? visible : visible.slice(0, split), over = split < 0 ? [] : visible.slice(split);
        await drawDoodads(context, under, bitmaps, size.scale);
        context.drawImage(upper, 0, 0);
        await drawDoodads(context, over, bitmaps, size.scale);
        lower.width = lower.height = upper.width = upper.height = 1;
        return out;
    };
})(DocsDoodads.MapThumb);

