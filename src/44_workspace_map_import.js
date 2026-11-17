// @editor-only
//==========================================================
// SECTION 25I: IMPORT MAP (7.1.6)
//==========================================================
// Map → Import Map: choose a Tiled (.tmj/.json) or LDtk (.ldtk) file, pick a level, read what will be made,
// then Import. A new MZ map is written with the tile layers as picture layers (img/parallaxes), objects with
// a tile as doodads (pictures cut into img/doodads/<name>/), collision as painted walls, and "empty tiles are
// floor" on. Pictures are written whole or not at all; the map then opens. Close RPG Maker MZ's editor first:
// it rewrites MapInfos.json when it saves.
(function() {
    const D = DocsDoodads, W = D.Workspace, M = D.MapImport;
    const escapeHtml = value => D.Security.escapeHtml(String(value));

    Object.assign(W, {
        // Reads a map file and everything it names, relative to its folder. Returns { model, file, levels }.
        readImportMap(absolute, levelIndex = 0, io = {}) {
            const fs = io.fs || D.FS.fs, path = io.path || D.FS.path, zlib = io.zlib || require('zlib');
            const dir = path.dirname(absolute);
            const readFile = rel => JSON.parse(fs.readFileSync(path.resolve(dir, rel), 'utf8'));
            const json = JSON.parse(fs.readFileSync(absolute, 'utf8'));
            const name = path.basename(absolute);
            const inflate = (bytes, kind) => kind === 'gzip' ? zlib.gunzipSync(bytes) : zlib.inflateSync(bytes);
            if (/\.ldtk$/i.test(absolute) || (json && Array.isArray(json.levels) && json.defs)) {
                return { kind: 'ldtk', file: absolute, levels: M.levels(json), model: M.readLdtk(json, readFile, levelIndex, { file: name }) };
            }
            return { kind: 'tiled', file: absolute, levels: [], model: M.readTiled(json, readFile, { file: name, inflate }) };
        },

        importMapPlan(read, options = {}) {
            const infos = D.FS.readJson('data/MapInfos.json') || window.$dataMapInfos || [];
            const tile = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const tilesetId = options.tilesetId || (window.$dataMap && $dataMap.tilesetId) || 1;
            const base = options.baseName || D.FS.path.basename(read.file).replace(/\.[^.]+$/, '');
            return M.plan(read.model, { projectTile: tile, mapId: M.nextMapId(infos), baseName: base, mapName: options.mapName || base, tilesetId });
        },

        importImageUrl(dir, rel) {
            const absolute = D.FS.path.resolve(dir, rel);
            try { return require('url').pathToFileURL(absolute).href; } catch (error) { return 'file:///' + absolute.replace(/\\/g, '/'); }
        },

        loadImportImage(url) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error(`Could not read ${decodeURIComponent(String(url).split('/').pop())}`));
                image.src = url;
            });
        },

        // One file's pixels, drawn with its tiles' flips (Tiled: the diagonal first, then horizontal and vertical).
        drawImportFile(file, images) {
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(file.width)); canvas.height = Math.max(1, Math.round(file.height));
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = file.opacity === undefined ? 1 : file.opacity;
            for (const t of file.draws) {
                const image = images[t.image];
                if (!image) continue;
                ctx.save();
                ctx.translate(t.x + t.dw / 2, t.y + t.dh / 2);
                ctx.scale(t.flipX ? -1 : 1, t.flipY ? -1 : 1);
                if (t.diagonal) ctx.transform(0, 1, 1, 0, 0, 0);
                ctx.drawImage(image, t.sx, t.sy, t.w, t.h, -t.dw / 2, -t.dh / 2, t.dw, t.dh);
                ctx.restore();
            }
            const encoded = canvas.toDataURL('image/png').split(',')[1];
            if (!encoded) throw new Error(`${file.path} could not be drawn.`);
            return Buffer.from(encoded, 'base64');
        },

        // Pictures to temporary names first, then all renamed; any failure removes what was written.
        writeImportFiles(entries) {
            const F = D.FS, fs = F.fs, path = F.path, stamp = `.ddimport-${Date.now().toString(36)}`;
            const temps = [], done = [];
            try {
                for (const e of entries) if (F.existsSync(e.path)) throw new Error(`${e.path} already exists.`);
                for (const e of entries) {
                    F.mkdirp(path.dirname(e.path));
                    fs.writeFileSync(e.path + stamp, e.bytes);
                    temps.push(e.path + stamp);
                }
                for (const e of entries) { fs.renameSync(e.path + stamp, e.path); done.push(e.path); }
                return { ok: true, written: done };
            } catch (error) {
                for (const p of temps) { try { if (F.existsSync(p)) fs.unlinkSync(p); } catch (ignored) { /* gone */ } }
                for (const p of done) { try { fs.unlinkSync(p); } catch (ignored) { /* gone */ } }
                return { ok: false, error: error.message || String(error) };
            }
        },

        async runMapImport(read, plan, io = {}) {
            const F = D.FS;
            if (!D.Compat.isTest() || !F.fs) { this.showToast('Import Map works only in a playtest.', 'error'); return null; }
            const progress = D.Ui.progress('Importing map', { delay: 300 });
            try {
                const dir = F.path.dirname(read.file), images = {};
                const sources = Array.from(new Set(plan.files.flatMap(f => f.draws.map(t => t.image))));
                progress.update(0, sources.length + plan.files.length, 'reading tilesets');
                for (const [i, rel] of sources.entries()) {
                    images[rel] = await (io.loadImage || (url => this.loadImportImage(url)))(this.importImageUrl(dir, rel));
                    progress.update(i + 1, sources.length + plan.files.length);
                }
                const entries = [];
                for (const [i, file] of plan.files.entries()) {
                    entries.push({ path: file.path, bytes: (io.draw || ((f, imgs) => this.drawImportFile(f, imgs)))(file, images) });
                    progress.update(sources.length + i + 1, sources.length + plan.files.length, file.path.split('/').pop());
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
                const mapFile = D.Persistence.mapFilePath(plan.mapId);
                if (F.existsSync(mapFile)) throw new Error(`${mapFile} already exists; close RPG Maker MZ and try again.`);
                const written = this.writeImportFiles(entries);
                if (!written.ok) throw new Error(written.error);
                const infos = (F.readJson('data/MapInfos.json') || window.$dataMapInfos || []).slice();
                infos[plan.mapId] = plan.mapInfo;
                F.createTimestampedBackup('data/MapInfos.json');
                if (!F.atomicWriteJson(mapFile, plan.map, 0) || !F.atomicWriteJson('data/MapInfos.json', infos, 0)) {
                    for (const p of written.written) { try { F.fs.unlinkSync(p); } catch (ignored) { /* gone */ } }
                    try { if (F.existsSync(mapFile)) F.fs.unlinkSync(mapFile); } catch (ignored) { /* gone */ }
                    throw new Error('Could not write the new map files.');
                }
                window.$dataMapInfos = infos;
                this.applyImportData(plan);
                D.Persistence.saveMapOnly(plan.mapId);
                if (D.AssetIndex && D.AssetIndex.indexPaths) await D.AssetIndex.indexPaths(written.written.filter(p => /^img\/doodads\//.test(p)), { save: true });
                this.showToast(`Imported Map ${String(plan.mapId).padStart(3, '0')}: ${plan.files.length} picture(s), ${plan.doodads.length} doodad(s). Reopen the project in MZ to see it in the map list.`, 'success');
                return plan.mapId;
            } catch (error) {
                this.showToast(`Import Map stopped; nothing was kept: ${error.message || error}`, 'error');
                return null;
            } finally {
                progress.finish();
            }
        },

        // The doodads, picture layers and walls of the new map, in the plugin's data.
        applyImportData(plan) {
            const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
            data[plan.mapId] = plan.doodads.map(row => {
                const d = D.standardStruct();
                d.bit = [3, row.path]; d.x = row.x; d.y = row.y; d.frameW = row.frameW; d.frameH = row.frameH;
                if (row.scaleX !== 1) d.scaleX = row.scaleX;
                if (row.scaleY !== 1) d.scaleY = row.scaleY;
                if (row.name) d.name = row.name;
                d.depth = 'sorted';
                return d;
            });
            D.Lighting.setMapSettings(plan.mapId, { layers2d: plan.layers2d, emptyIsFloor: true });
            if (plan.walls) D.Walls.set(plan.mapId, plan.walls);
            D.Persistence.dirtyDoodads = true;
        },

        closeMapImport() {
            const card = typeof document !== 'undefined' && document.getElementById ? document.getElementById('dd-map-import') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            this._mapImport = null;
        },

        renderMapImportPlan(state) {
            const plan = state.plan;
            if (!plan) return state.error ? `<div style="color:var(--dd-danger, #f87171);">${escapeHtml(state.error)}</div>` : '<div>Choose a Tiled (.tmj, .json) or LDtk (.ldtk) file.</div>';
            const layers = plan.files.filter(f => f.kind === 'layer'), pieces = plan.files.filter(f => f.kind === 'piece');
            return `<div><b>Map ${String(plan.mapId).padStart(3, '0')}</b>, ${plan.width} × ${plan.height} tiles</div>
                <div>${layers.length} picture layer(s): ${layers.map(f => escapeHtml(f.path.split('/').pop())).join(', ') || 'none'}</div>
                <div>${plan.doodads.length} doodad(s) from ${pieces.length} picture(s) in img/doodads/</div>
                <div>${plan.walls ? 'Collision painted from the collision layers.' : 'No collision layer.'} Empty tiles are floor.</div>
                ${plan.notices.map(n => `<div style="color:var(--dd-muted);">${escapeHtml(n)}</div>`).join('')}`;
        },

        openMapImport() {
            if (typeof document === 'undefined') return null;
            this.closeMapImport();
            const state = this._mapImport = { read: null, plan: null, error: '', level: 0 };
            const card = document.createElement('div');
            card.id = 'dd-map-import'; card.className = 'dd-glass';
            card.style.cssText = 'position:fixed;top:80px;right:20px;width:360px;max-height:75vh;overflow:auto;padding:12px;z-index:10040;font-size:11px;display:flex;flex-direction:column;gap:6px;';
            const render = () => {
                card.innerHTML = `<div class="dd-panel-head">Import Map <button class="dd-btn" id="dd-map-import-close" type="button">Close</button></div>
                    <div style="color:var(--dd-muted);">Tile layers become picture layers, objects with a tile become doodads, collision layers become painted collision. Close RPG Maker MZ's editor first.</div>
                    <input id="dd-map-import-file" type="file" accept=".tmj,.json,.ldtk">
                    ${state.read && state.read.levels.length ? `<select id="dd-map-import-level">${state.read.levels.map(l => `<option value="${l.index}"${l.index === state.level ? ' selected' : ''}>${escapeHtml(l.name)}</option>`).join('')}</select>` : ''}
                    ${this.renderMapImportPlan(state)}
                    <button class="dd-btn dd-btn-primary" id="dd-map-import-run" type="button"${state.plan ? '' : ' disabled'}>Import</button>`;
                const node = id => document.getElementById(id);
                node('dd-map-import-close').onclick = () => this.closeMapImport();
                node('dd-map-import-file').onchange = event => {
                    const file = event.target.files && event.target.files[0];
                    if (!file || !file.path) { state.error = 'Choose a file on this computer.'; render(); return; }
                    state.file = file.path; state.level = 0; load();
                };
                const level = node('dd-map-import-level');
                if (level) level.onchange = () => { state.level = Number(level.value) || 0; load(); };
                node('dd-map-import-run').onclick = async () => {
                    if (!state.plan) return;
                    const mapId = await this.runMapImport(state.read, state.plan);
                    if (mapId) { this.closeMapImport(); if (this.goToMap) this.goToMap(mapId); }
                };
            };
            const load = () => {
                try {
                    state.read = this.readImportMap(state.file, state.level);
                    state.plan = this.importMapPlan(state.read);
                    state.error = '';
                } catch (error) { state.plan = null; state.error = error.message || String(error); }
                render();
            };
            document.body.appendChild(card);
            render();
            return card;
        }
    });

    const menus = W.menus;
    W.menus = function() {
        const all = menus.call(this), map = all.find(menu => menu.id === 'map');
        if (map) map.items.push({ id: 'dd-map-import-btn', icon: 'folder', label: 'Import Map', title: 'Make a new map from a Tiled or LDtk file' });
        return all;
    };
    const bind = W.bindEvents;
    W.bindEvents = function() {
        const result = bind.apply(this, arguments), button = typeof document !== 'undefined' ? document.getElementById('dd-map-import-btn') : null;
        if (button) button.onclick = () => { this.showMoreMenu(false); this.openMapImport(); };
        return result;
    };

    // Map settings: the switch the importer turns on, for parallax maps made by hand too.
    W.mapSections.push({
        render(settings) {
            return `<details style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                <summary style="font-size: 11px; font-weight: bold;">Picture map</summary>
                <label style="font-size: 10px;"><input id="dd-empty-floor" type="checkbox"${settings.emptyIsFloor === true ? ' checked' : ''} /> Empty tiles are floor</label>
                <div style="font-size: 10px; color: var(--dd-faint);">For maps drawn with picture layers: a tile with nothing on it can be walked on. Paint collision where it can't.</div>
            </details>`;
        },
        bind() {
            const control = document.getElementById('dd-empty-floor');
            if (control) control.onchange = () => this.setMapSetting('emptyIsFloor', control.checked ? true : undefined);
        }
    });
})();
