// @editor-only
//==========================================================
// SECTION 25G2: THE MORE LIKE THIS TOOL (8.3.3)
//==========================================================
// Map → More Like This: drag a box round a sample you like, then drag the region to fill. The fill shows on the map
// (ground colours and doodad dots) until Apply, which paints the tiles (autotiles shaped to their neighbours) and
// places the doodads as one Undo step. Reroll tries another seed. Flat maps; the ground layer and doodads.
(function() {
    const D = DocsDoodads, W = D.Workspace, G = D.Generate;

    Object.assign(W, {
        moreLike: null,

        // What the box holds: ground tile ids (layer 1) and doodads by the tile under their base.
        moreLikeSample(rect) {
            const view = this.tileMapView();
            if (!view) return null;
            const tiles = [], tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) tiles.push(Number(view.data[D.Tiles.index(view.width, view.height, x, y, 0)]) || 0);
            const doodads = (D.doodads() || []).filter(d => d && !d.temp && d.bit && d.bit[0] === 3).map(d => ({
                path: d.bit[1], x: Math.floor(d.x / tw) - rect.x, y: Math.floor((d.y - 1) / th) - rect.y, frameW: d.frameW, frameH: d.frameH, scale: Math.abs(Number(d.scaleX) || 1)
            }));
            return { w: rect.w, h: rect.h, tiles, doodads };
        },

        startMoreLike() {
            this.moreLike = { phase: 'sample', seed: 1, drag: null, model: null, region: null, result: null, stuff: null };
            this.setPlacementTool('moreLike');
            this.showToast('Drag a box round a sample you like.');
            this.renderMoreLikeCard();
        },

        moreLikeFill() {
            const s = this.moreLike;
            if (!s || !s.model || !s.region) return null;
            const view = this.tileMapView(), r = s.region;
            const fixed = (x, y) => {
                const mx = r.x + x, my = r.y + y;
                if (mx < 0 || my < 0 || mx >= view.width || my >= view.height) return null;
                return G.kindOf(view.data[D.Tiles.index(view.width, view.height, mx, my, 0)]);
            };
            const rng = G.rng('more-like-' + s.seed);
            s.result = G.fill({ w: r.w, h: r.h, fixed }, s.model, rng);
            s.stuff = s.result.cells ? G.scatterLearned(s.result.cells, r.w, r.h, s.model, rng) : [];
            if (s.result.error) this.showToast(s.result.error, 'warning');
            this.renderMoreLikeCard();
            return s.result;
        },

        applyMoreLike() {
            const s = this.moreLike;
            if (!s || !s.result || !s.result.cells) return false;
            const view = this.tileMapView(), r = s.region, mapId = this.currentMapId(), tables = this.autotileTables();
            const work = { width: view.width, height: view.height, loopX: view.loopX, loopY: view.loopY, data: Array.from(view.data) };
            const changes = new Map();
            s.result.cells.forEach((kind, i) => {
                const x = r.x + (i % r.w), y = r.y + Math.floor(i / r.w);
                for (const c of D.Tiles.paint(work, x, y, { ids: [[G.idOfKind(kind)]], layer: 0 }, tables)) {
                    if (!changes.has(c.index)) changes.set(c.index, { before: c.before, after: c.after }); else changes.get(c.index).after = c.after;
                    work.data[c.index] = c.after;
                }
            });
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const docs = s.stuff.map(p => Object.assign(D.standardStruct(), {
                bit: [3, p.path], frameW: p.frameW || 48, frameH: p.frameH || 48, scaleX: p.scale || 1, scaleY: p.scale || 1,
                x: (r.x + p.x) * tw + tw / 2, y: (r.y + p.y) * th + th, uid: 'dd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
            }));
            const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
            const step = this.doodadListStep('more_like_this', list, docs, true);
            const tiles = which => { for (const [index, c] of changes) this.setMapTile(mapId, index, c[which]); this.afterTileEdit(); };
            D.Undo.execute({ type: 'more_like_this', label: 'More like this', apply: () => { tiles('after'); step.apply(); }, revert: () => { step.revert(); tiles('before'); } });
            s.result = null; s.stuff = null; s.region = null; s.phase = 'region';
            this.renderMoreLikeCard();
            return true;
        },

        closeMoreLike() {
            this.moreLike = null;
            if (this.placementTool === 'moreLike') this.setPlacementTool('select');
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-morelike-card') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
        },

        renderMoreLikeCard() {
            if (typeof document === 'undefined' || !document.createElement || !document.body) return;
            const s = this.moreLike;
            let card = document.getElementById('dd-morelike-card');
            if (!s) return;
            if (!card) {
                card = document.createElement('div');
                card.id = 'dd-morelike-card'; card.className = 'dd-glass';
                card.style.cssText = 'position:fixed;top:80px;right:20px;width:300px;padding:10px;z-index:10040;font-size:11px;';
                document.body.appendChild(card);
            }
            const said = s.phase === 'sample' ? 'Drag a box round a sample you like.' : !s.region ? 'Now drag the region to fill.' : s.result && s.result.cells ? 'Apply it, or Reroll for another.' : 'That did not fit; try another region or sample.';
            card.innerHTML = `<div class="dd-panel-head">More Like This <button class="dd-btn" id="dd-morelike-close" type="button">Close</button></div>
                <div style="color:var(--dd-muted);margin-bottom:6px;">${escapeHtml(said)}</div>
                <button class="dd-btn dd-btn-primary" id="dd-morelike-apply" type="button"${s.result && s.result.cells ? '' : ' disabled'}>Apply</button>
                <button class="dd-btn" id="dd-morelike-reroll" type="button"${s.region ? '' : ' disabled'}>Reroll</button>
                <button class="dd-btn" id="dd-morelike-sample" type="button">New Sample</button>`;
            const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
            on('dd-morelike-close', () => this.closeMoreLike());
            on('dd-morelike-apply', () => this.applyMoreLike());
            on('dd-morelike-reroll', () => { s.seed++; this.moreLikeFill(); });
            on('dd-morelike-sample', () => { s.phase = 'sample'; s.model = null; s.region = null; s.result = null; this.renderMoreLikeCard(); });
        },

        // A box from the drag, in tiles.
        moreLikeRect(a, b) {
            const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
            const view = this.tileMapView();
            const cx = v => Math.max(0, Math.min(view.width - 1, v)), cy = v => Math.max(0, Math.min(view.height - 1, v));
            return { x: cx(x0), y: cy(y0), w: cx(x1) - cx(x0) + 1, h: cy(y1) - cy(y0) + 1 };
        },

        moreLikeTileAt(e) {
            const at = this.clientToMapCoords(e.clientX, e.clientY);
            return { x: Math.floor(at.x / $gameMap.tileWidth()), y: Math.floor(at.y / $gameMap.tileHeight()) };
        },

        // Ends a drag: a sample is learned, a region is filled.
        moreLikeDrop(rect) {
            const s = this.moreLike;
            if (!s) return null;
            if (s.phase === 'sample') {
                s.model = G.learn(this.moreLikeSample(rect));
                if (s.model.error) { this.showToast(s.model.error, 'warning'); s.model = null; return null; }
                s.phase = 'region';
                this.showToast(`Learned ${s.model.kinds.length} kinds of ground. Now drag the region to fill.`);
                this.renderMoreLikeCard();
                return s.model;
            }
            s.region = rect;
            return this.moreLikeFill();
        },

        drawMoreLike(g) {
            const s = this.moreLike;
            if (!s || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), colour = D.Ui.mapColor('selection');
            const box = r => { const p = D.mapToScreen(r.x * tw, r.y * th); g.lineStyle(2, colour, 0.9); g.drawRect(p.x, p.y, r.w * tw, r.h * th); g.lineStyle(0); };
            if (s.drag) box(this.moreLikeRect(s.drag.from, s.drag.to));
            if (s.region && s.result && s.result.cells) {
                const hue = k => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return ((h & 0x7f) + 80) << 16 | (((h >> 7) & 0x7f) + 80) << 8 | (((h >> 14) & 0x7f) + 80); };
                s.result.cells.forEach((k, i) => {
                    const p = D.mapToScreen((s.region.x + (i % s.region.w)) * tw, (s.region.y + Math.floor(i / s.region.w)) * th);
                    g.beginFill(hue(k), 0.45); g.drawRect(p.x, p.y, tw, th); g.endFill();
                });
                for (const d of s.stuff || []) {
                    const p = D.mapToScreen((s.region.x + d.x + 0.5) * tw, (s.region.y + d.y + 0.5) * th);
                    g.beginFill(0xffffff, 0.9); g.drawCircle(p.x, p.y, 3); g.endFill();
                }
                box(s.region);
            }
        }
    });

    W.toolHooks.moreLike = {
        down(e) { const s = this.moreLike; if (!s) return false; const t = this.moreLikeTileAt(e); s.drag = { from: t, to: t }; return true; },
        move(e, stroking) { const s = this.moreLike; if (s && s.drag && stroking) s.drag.to = this.moreLikeTileAt(e); },
        up() {
            const s = this.moreLike;
            this._suppressNextClick = true;
            if (!s || !s.drag) return;
            const rect = this.moreLikeRect(s.drag.from, s.drag.to);
            s.drag = null;
            this.moreLikeDrop(rect);
        },
        overlay(g) { this.drawMoreLike(g); }
    };

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-morelike-btn', icon: 'sparkle', label: 'More Like This', title: 'Lasso a sample; fill another region the same way (ground and doodads), as one undo step' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments);
        const btn = typeof document !== 'undefined' ? document.getElementById('dd-morelike-btn') : null;
        if (btn) btn.onclick = () => { if (this.showMoreMenu) this.showMoreMenu(false); this.startMoreLike(); };
        return result;
    };
})();
