// @editor-only
// These are real sprites made by the placement factory, with no entry in a map's saved data.
Object.assign(DocsDoodads.Workspace, {
    placementPreviewLimit: 12,
    previewRng(key) {
        this[key] = this[key] || DocsDoodads.Scatter.rng(Date.now());
        return this[key].clone ? this[key].clone() : DocsDoodads.Scatter.rng(1);
    },
    planPathPlacement(points, asset, settings = this.pathSettings, seed = Date.now(), limit = Infinity) {
        if (!asset || !points || !points.length) return [];
        const rng = DocsDoodads.Scatter.rng(seed), jitter = Number(settings.jitter) || 0, out = [];
        for (const point of DocsDoodads.Paths.sample(points, settings.spacing, { smooth: settings.smooth })) {
            const special = point.kind === 'start' || point.kind === 'end' ? settings.endAsset : point.kind === 'corner' ? settings.cornerAsset : null;
            const d = this.newDoodadFromAsset(special || asset, Math.round(point.x + (jitter ? (rng() * 2 - 1) * jitter : 0)), Math.round(point.y + (jitter ? (rng() * 2 - 1) * jitter : 0)));
            if (settings.alignToPath) d.rotation = Math.round(point.angle);
            if (DocsDoodads.Terrain.allowsDoodad(d, this.currentMapId())) out.push(d);
            if (out.length >= limit) break;
        }
        return out;
    },
    placementPreviewItems(asset, coords, tool) {
        const D = DocsDoodads, max = this.placementPreviewLimit;
        if (tool === 'path') {
            this._placementPathSeed = this._placementPathSeed || Date.now();
            return this.planPathPlacement((this.pathPoints || []).concat([coords]), asset, this.pathSettings, this._placementPathSeed, max);
        }
        if (tool === 'brush' || tool === 'biome') {
            const list = D.doodads(this.currentMapId()), query = this.scatterQuery();
            const settings = tool === 'brush' ? this.brushSettings : this.biomeSettings;
            const rng = this.previewRng(tool === 'brush' ? '_scatterRng' : '_biomeRng');
            const raw = tool === 'biome' ? D.Biome.find(settings.biomeId, D.World.get('biomes.list') || []) : null;
            if (tool === 'biome' && !raw) return [];
            const biome = raw ? D.Biome.normalize(raw) : null;
            const radius = Number(settings.radius) || 0, reach = radius + (biome ? biome.spacing : Number(settings.minDistance) || 0);
            const existing = list.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
            const rules = { regions: tool === 'brush' ? D.Scatter.parseIdList(settings.regions) : [], terrainTags: tool === 'brush' ? D.Scatter.parseIdList(settings.terrainTags) : [], avoidBlocked: Boolean(settings.avoidBlocked) };
            const points = biome ? D.Biome.paint(biome, coords, radius, existing, rng)
                : D.Scatter.candidates(coords, radius, Number(settings.minDistance) || 0, existing, Math.min(256, Number(settings.density) || 1), rng);
            const out = [];
            for (const point of points) {
                if (!D.Scatter.allowed(point, rules, query)) continue;
                const v = biome ? point : D.Scatter.variation(settings, rng);
                const d = this.newDoodadFromAsset(biome ? this.assetByPath(point.path) : asset, Math.round(point.x), Math.round(point.y));
                d.scaleX = v.scale * (v.flipX ? -1 : 1); d.scaleY = v.scale;
                if (!biome) { d.rotation = v.rotation; if (v.hue) d.hue = v.hue; }
                out.push(...this.withMirrors(d));
                if (out.length >= max) break;
            }
            return out.slice(0, max);
        }
        return this.withMirrors(this.newDoodadFromAsset(asset, coords.x, coords.y)).slice(0, max);
    },
    clearPlacementPreview(spriteset) {
        const state = this._placementPreview;
        if (!state || spriteset && spriteset !== state.spriteset) return;
        this._placementPreview = null;
        state.spriteset.removeSomeDocsDoodads(state.items);
        if (state.spriteset.updateDocsReflections) state.spriteset.updateDocsReflections();
        if (state.spriteset.updateDocsLighting) state.spriteset.updateDocsLighting(true);
    },
    showPlacementPreview(asset, coords, tool = 'stamp') {
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null, spriteset = scene && scene._spriteset;
        if (!this.mounted || !spriteset || !spriteset.addDocsDoodadSprites || !asset && tool !== 'biome'
            || asset && (asset.category === 'Audio' || asset.type === 'prefab' || asset.placementMode === 'event' || asset.placement && asset.placement.defaultMode === 'event')) { this.clearPlacementPreview(); return 0; }
        const items = this.placementPreviewItems(asset, coords, tool);
        for (const d of items) { d.opacity = (d.opacity === undefined ? 1 : d.opacity) * 0.55; d._editorPreview = true; }
        const key = JSON.stringify(items.map(d => [d.bit, d.frameX, d.frameY, d.frameW, d.frameH, d.xFrame, d.yFrame, d.frameUpdate]));
        const old = this._placementPreview;
        const reuse = old && old.spriteset === spriteset && old.map === $gameMap && old.mapId === this.currentMapId() && old.key === key
            && old.sprites.every(sprite => sprite.parent && spriteset._docsDoodadSprites.includes(sprite));
        if (reuse) {
            old.items.forEach((d, i) => {
                const uid = d.uid;
                for (const field of Object.keys(d)) delete d[field];
                Object.assign(d, items[i], { uid });
                old.sprites[i].updatePlacement();
            });
        } else {
            this.clearPlacementPreview();
            if (!items.length) return 0;
            spriteset.addDocsDoodadSprites(items);
            const set = new Set(items), sprites = spriteset._docsDoodadSprites.filter(sprite => set.has(sprite._data));
            for (const sprite of sprites) sprite._docsPlacementPreview = true;
            this._placementPreview = { spriteset, map: $gameMap, mapId: this.currentMapId(), items, sprites, key };
        }
        spriteset.sortDocsDoodads();
        return items.length;
    },
    placementPointerOnMap(x, y) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || !canvas.getBoundingClientRect) return false;
        const rect = canvas.getBoundingClientRect();
        if (!(rect.width > 0 && rect.height > 0) || x < rect.left || y < rect.top || x >= rect.left + rect.width || y >= rect.top + rect.height) return false;
        const target = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : canvas;
        return target === canvas || Boolean(canvas.contains && canvas.contains(target));
    },
    updateBrushPlacementPreview(event) {
        if (!['brush', 'biome', 'path'].includes(this.placementTool)) return;
        if (this.isBrushActive || event.altKey || !this.placementPointerOnMap(event.clientX, event.clientY)) { this.clearPlacementPreview(); return; }
        let coords = this.clientToMapCoords(event.clientX, event.clientY);
        if (this.placementTool === 'path') coords = this.snapToTile(coords);
        this.showPlacementPreview(this.selectedAsset, coords, this.placementTool);
    }
});
{
    const W = DocsDoodads.Workspace, show = W.showGhost, remove = W.removeGhost;
    W.showGhost = function(asset, x, y, alt) {
        show.call(this, asset, x, y, alt);
        const onMap = this.mounted && this.placementPointerOnMap(x, y);
        if (onMap) {
            const coords = this.clientToMapCoords(x, y);
            if (!alt || this.activeDragPayload) this.showPlacementPreview(asset, alt ? coords : this.snapToTile(coords), 'stamp');
            else this.clearPlacementPreview();
        } else this.clearPlacementPreview();
        const picture = asset && asset.category !== 'Audio' && asset.type !== 'prefab' && asset.placementMode !== 'event' && !(asset.placement && asset.placement.defaultMode === 'event');
        // The floating picture follows the pointer only while an item is being dragged from the bag. With Stamp,
        // the item is shown on the map itself, and nothing follows the pointer over the panels and menus.
        const floating = Boolean(this.activeDragPayload) && !(onMap && picture);
        if (this.ghostEl) this.ghostEl.style.display = floating ? '' : 'none';
    };
    W.removeGhost = function() { this.clearPlacementPreview(); this._placementPathSeed = null; return remove.call(this); };
}
if (typeof Spriteset_Map !== 'undefined') Spriteset_Map.prototype.removeDocsPlacementPreview = function() { DocsDoodads.Workspace.clearPlacementPreview(this); };
if (typeof Game_Map !== 'undefined') {
    const setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(id) { DocsDoodads.Workspace.removeGhost(); return setup.call(this, id); };
}
