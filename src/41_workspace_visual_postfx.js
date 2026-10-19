    // ---- Visual equipment try-on and notetag builder ----
    visualItems() {
        const out = [];
        const add = (list, kind) => (list || []).forEach(item => {
            if (item && /<\s*visual/i.test(item.note || '')) out.push({ key: kind + item.id, kind, id: item.id, name: item.name || `${kind} ${item.id}`, note: item.note });
        });
        add(typeof $dataWeapons !== 'undefined' ? $dataWeapons : null, 'w');
        add(typeof $dataArmors !== 'undefined' ? $dataArmors : null, 'a');
        return out;
    },

    // The items an actor starts with or (in a running game) has on.
    visualWornKeys(actorId) {
        const game = typeof $gameActors !== 'undefined' && $gameActors ? $gameActors.actor(actorId) : null;
        if (game && typeof game.equips === 'function') {
            return game.equips().filter(Boolean).map(e => (DataManager.isWeapon(e) ? 'w' : 'a') + e.id);
        }
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[actorId] : null;
        return ((data && data.equips) || []).map((id, slot) => (id > 0 ? (slot === 0 ? 'w' : 'a') + id : null)).filter(Boolean);
    },

    visualTryOnLayers(actorId, keys) {
        const VE = DocsDoodads.VisualEquip;
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[actorId] : null;
        const cls = data && typeof $dataClasses !== 'undefined' && $dataClasses ? $dataClasses[data.classId] : null;
        const items = this.visualItems();
        const game = typeof $gameActors !== 'undefined' && $gameActors ? $gameActors.actor(actorId) : null;
        const v = (game && game._docsVisual) || {};
        return VE.resolve({
            actorNote: [data && data.note, cls && cls.note].filter(Boolean).join('\n'),
            equipNotes: items.filter(i => (keys || []).includes(i.key)).map(i => i.note).concat(v.notes || []),
            alias: v.alias || '',
            colors: v.colors || null
        }, VE.env());
    },

    visualNotetag(spec) {
        const image = String(spec.image || '').trim();
        if (!image) return '';
        const bits = [image];
        const z = Number(spec.z);
        if (Number.isFinite(z) && z !== 1) bits.push('z ' + z);
        if (String(spec.up === undefined ? '' : spec.up).trim() !== '' && Number.isFinite(Number(spec.up))) bits.push('up ' + Number(spec.up));
        if (String(spec.part || '').trim()) bits.push('part ' + String(spec.part).trim());
        if (String(spec.sv || '').trim()) bits.push('sv ' + String(spec.sv).trim());
        const tags = [`<visual: ${bits.join(', ')}>`];
        const hides = String(spec.hide || '').split(',').map(h => h.trim()).filter(Boolean);
        if (hides.length) tags.push(`<visual hide: ${hides.join(', ')}>`);
        return tags.join('\n');
    },

    renderVisualTryOn() {
        const actors = (typeof $dataActors !== 'undefined' && $dataActors ? $dataActors : []).filter(a => a && a.name);
        const t = this._veTry = this._veTry || { actorId: actors[0] ? actors[0].id : 0, dir: 2, keys: null };
        if (t.keys === null) t.keys = this.visualWornKeys(t.actorId);
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const items = this.visualItems();
        const rows = items.map(i => `<label style="display: flex; gap: 6px; align-items: center; font-size: 10px; color: var(--dd-text);">
                <input type="checkbox" id="dd-ve-item-${escapeHtml(i.key)}" ${t.keys.includes(i.key) ? 'checked' : ''} /> <span title="${i.kind === 'w' ? 'Weapon' : 'Armor'} ${i.id}">${escapeHtml(i.name)}</span></label>`).join('');
        const layers = this.visualTryOnLayers(t.actorId, t.keys);
        const list = layers.map(l => `${escapeHtml(l.image)} <span style="color: var(--dd-faint);">z ${l.z}${l.hue ? ', hue ' + l.hue : ''}${l.tint !== null ? ', tint #' + ('000000' + l.tint.toString(16)).slice(-6) : ''}</span>`).join('<br>');
        return `
            <div style="font-size: 10px; color: var(--dd-muted); line-height: 1.4;">Tag weapons and armors with <b>&lt;visual: Sheet, z 1, part clothes&gt;</b>. Negative z draws behind the body. An item with the same part as the body's base part replaces it (armor over a shirt). Part sheets use the same layout as the body's sheet.</div>
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 4px;">Try on:</div>
            <select id="dd-ve-actor" style="${inputStyle}">${actors.map(a => `<option value="${a.id}" ${a.id === t.actorId ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}</select>
            <div style="display: grid; grid-template-columns: 96px 1fr; gap: 6px; align-items: start;">
                <div>
                    <canvas id="dd-ve-canvas" width="96" height="96" style="width: 96px; height: 96px; image-rendering: pixelated; background: var(--dd-field); border: 1px solid var(--dd-line); border-radius: 4px;"></canvas>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px;">
                        ${[[4, '&#9664;'], [2, '&#9660;'], [8, '&#9650;'], [6, '&#9654;']].map(([d, s]) => `<button class="dd-btn" id="dd-ve-dir-${d}" style="padding: 0;">${s}</button>`).join('')}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; max-height: 140px; overflow: auto;">${rows || '<span style="font-size: 10px; color: var(--dd-faint);">No weapons or armors have &lt;visual&gt; tags yet.</span>'}</div>
            </div>
            <div id="dd-ve-layers" style="font-size: 10px; color: var(--dd-text);">${list || '<span style="color: var(--dd-faint);">No layers.</span>'}</div>
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 6px;">Notetag builder:</div>
            <div style="display: grid; grid-template-columns: 1fr 44px; gap: 3px;">
                <input type="text" list="dd-ve-files" id="dd-ve-tag-image" placeholder="Layer sheet, or File.aseprite#Layer" style="${inputStyle}" />
                <datalist id="dd-ve-files">${this.characterFileNames().concat(DocsDoodads.AsepriteVisuals.refs()).map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
                <input type="number" id="dd-ve-tag-z" value="1" title="Order (negative = behind)" style="${inputStyle}" />
                <input type="text" id="dd-ve-tag-part" placeholder="Part / slot (e.g. clothes, hair)" title="Gear with the same part replaces it" style="${inputStyle}" />
                <input type="number" id="dd-ve-tag-up" placeholder="up" title="Order while facing up (blank = same)" style="${inputStyle}" />
                <input type="text" id="dd-ve-tag-hide" placeholder="Hides parts (e.g. hair)" style="${inputStyle}" />
                <span></span>
                <input type="text" id="dd-ve-tag-sv" placeholder="Side-view sheet (optional)" style="${inputStyle}" />
                <span></span>
            </div>
            <textarea id="dd-ve-tag-out" readonly rows="2" style="${inputStyle} resize: vertical;"></textarea>
            <button class="dd-btn" id="dd-ve-tag-copy">Copy Notetag</button>
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 6px;">From Aseprite: put a layered .aseprite walk cycle in img/characters and tag gear with <b>&lt;visual: Hero.aseprite#Sword&gt;</b> (a layer name). Its sheet is made for you in a playtest and remade when you save the .aseprite again. Frames come from tags down, left, right and up, or the first frames in that order. Or make the sheets once:</div>
            <button class="dd-btn" id="dd-ve-ase">Make Layer Sheets from .aseprite…</button>
            <input type="file" id="dd-ve-ase-file" accept=".aseprite,.ase" style="display: none;" />`;
    },

    // Writes one character sheet per layer of an Aseprite file to img/characters.
    async makeLayerSheets(filePath) {
        const FS = DocsDoodads.FS;
        if (!FS.fs || typeof require === 'undefined') return this.showToast('Needs the desktop playtest.', 'error');
        try {
            const zlib = require('zlib');
            const A = DocsDoodads.AsepriteSheets;
            const ase = A.parse(FS.fs.readFileSync(filePath), data => zlib.inflateSync(data));
            const base = FS.path.basename(filePath).replace(/\.(aseprite|ase)$/i, '');
            const sheets = A.sheets(ase, base);
            if (!sheets.length) return this.showToast('No visible layers with pictures in that file.', 'info');
            FS.mkdirp('img/characters');
            const target = sheet => FS.path.join('img/characters', sheet.fileName).replace(/\\/g, '/');
            // Sheets made before (from an earlier version of the file) are replaced only when asked.
            const existing = sheets.filter(sheet => FS.existsSync(target(sheet))).map(sheet => sheet.fileName);
            if (existing.length && !(await DocsDoodads.Ui.confirm(`${existing.length} sheet(s) with these names are already in img/characters and will be replaced: ${existing.join(', ')}.`,
                { title: 'Replace sheets?', ok: 'Replace', danger: true }))) {
                this.showToast('Nothing was written.', 'info');
                return null;
            }
            const written = sheets.map(sheet => {
                const out = target(sheet);
                FS.fs.writeFileSync(out, A.encodePng(sheet.width, sheet.height, sheet.rgba, data => zlib.deflateSync(data)));
                return out;
            });
            DocsDoodads.LiveReload.process(written, DocsDoodads.LiveReload.defaultHandlers());
            this.showToast(`Made ${written.length} layer sheet(s): ${sheets.map(sh => sh.fileName).join(', ')}`, 'success');
            return written;
        } catch (e) {
            this.showToast('Could not read that file: ' + e.message, 'error');
            return null;
        }
    },

    bindVisualTryOn() {
        const t = this._veTry;
        if (!t) return;
        const actor = document.getElementById('dd-ve-actor');
        if (actor) actor.onchange = () => {
            t.actorId = Number(actor.value) || 0;
            t.keys = this.visualWornKeys(t.actorId);
            this.refreshInspector();
        };
        for (const item of this.visualItems()) {
            const box = document.getElementById(`dd-ve-item-${item.key}`);
            if (box) box.onchange = () => {
                t.keys = box.checked ? t.keys.concat(item.key) : t.keys.filter(k => k !== item.key);
                this.refreshInspector();
            };
        }
        for (const d of [2, 4, 6, 8]) {
            const b = document.getElementById(`dd-ve-dir-${d}`);
            if (b) b.onclick = () => { t.dir = d; };
        }
        const read = id => (document.getElementById(id) || {}).value || '';
        const out = document.getElementById('dd-ve-tag-out');
        const update = () => {
            if (out) out.value = this.visualNotetag({ image: read('dd-ve-tag-image'), z: read('dd-ve-tag-z'), up: read('dd-ve-tag-up'), part: read('dd-ve-tag-part'), hide: read('dd-ve-tag-hide'), sv: read('dd-ve-tag-sv') });
        };
        for (const id of ['dd-ve-tag-image', 'dd-ve-tag-z', 'dd-ve-tag-up', 'dd-ve-tag-part', 'dd-ve-tag-hide', 'dd-ve-tag-sv']) {
            const input = document.getElementById(id);
            if (input) input.oninput = update;
        }
        const aseButton = document.getElementById('dd-ve-ase'), aseFile = document.getElementById('dd-ve-ase-file');
        if (aseButton && aseFile) {
            aseButton.onclick = () => aseFile.click();
            aseFile.onchange = () => {
                const file = aseFile.files && aseFile.files[0];
                if (file) this.makeLayerSheets(file.path || file.name);
                aseFile.value = '';
            };
        }
        const copy = document.getElementById('dd-ve-tag-copy');
        if (copy) copy.onclick = () => {
            if (!out || !out.value) return this.showToast('Choose a layer sheet first.', 'info');
            if (navigator.clipboard) navigator.clipboard.writeText(out.value);
            this.showToast('Notetag copied. Paste it into a weapon or armor note.', 'success');
        };
        this.startVisualPreview();
    },

    // Walks the try-on preview in the chosen direction until the panel closes.
    startVisualPreview() {
        if (this._veTimer) clearInterval(this._veTimer);
        let step = 0;
        const draw = () => {
            const canvas = document.getElementById('dd-ve-canvas');
            if (!canvas || !canvas.isConnected || typeof canvas.getContext !== 'function' || !this._veTry) {
                clearInterval(this._veTimer);
                this._veTimer = null;
                return;
            }
            // Nothing to draw while its section is folded away (the panel stays open behind it).
            if (canvas.offsetParent === null) return;
            this.drawVisualPreview(canvas, step++);
        };
        draw();
        this._veTimer = setInterval(draw, 200);
    },

    drawVisualPreview(canvas, step) {
        const VE = DocsDoodads.VisualEquip, C = DocsDoodads.CharacterAnim;
        const t = this._veTry;
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[t.actorId] : null;
        const ctx = canvas.getContext('2d');
        if (!ctx || typeof ImageManager === 'undefined') return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        const layers = this.visualTryOnLayers(t.actorId, t.keys);
        const body = data && data.characterName ? { image: data.characterName, index: data.characterIndex, hue: 0, tint: null } : null;
        const z = l => VE.zFor(l, t.dir);
        const byZ = list => list.slice().sort((a, b) => z(a) - z(b));
        const sheets = byZ(layers.filter(l => z(l) < 0)).concat(body ? [body] : [], byZ(layers.filter(l => z(l) >= 0)));
        for (const sheet of sheets) {
            const bitmap = VE.windowBitmap(sheet, null);
            if (!bitmap) continue;
            const layout = C.parseName(sheet.image);
            const row = C.rowFor(t.dir, layout.dirs);
            const rect = VE.frameRect(sheet.image, bitmap.width, bitmap.height,
                sheet.index !== null && sheet.index !== undefined ? sheet.index : (data ? data.characterIndex : 0), C.walkFrame(step, layout.frames), row.row);
            const zoom = Math.min(2, canvas.width / rect.w, canvas.height / rect.h);
            const w = rect.w * zoom, h = rect.h * zoom;
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height - (canvas.height - h) / 2);
            if (row.mirror) ctx.scale(-1, 1);
            ctx.drawImage(bitmap.canvas, rect.x, rect.y, rect.w, rect.h, -w / 2, -h, w, h);
            ctx.restore();
        }
    },

    // ---- Post-processing builder ----
    storedLook(target) {
        if (target === 'map') {
            const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
            if (mine && mine.look) return mine.look;
        }
        return DocsDoodads.World.get('postfx.look');
    },

    getLookValue(target, key) {
        const look = DocsDoodads.PostFX.normalizeLook(this.storedLook(target));
        const [id, field] = key.split('.');
        return look[id] ? look[id][field] : undefined;
    },

    lookWith(target, key, value) {
        const look = DocsDoodads.PostFX.normalizeLook(this.storedLook(target));
        const [id, field] = key.split('.');
        if (look[id]) look[id][field] = value;
        return look;
    },

    writeLook(target, look, previous) {
        if (target === 'map') {
            const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx || {};
            this.setMapSetting('postfx', Object.assign({}, mine, { mode: 'custom', look }), previous);
        } else {
            this.setWorldSetting('postfx.look', look, previous);
        }
    },

    setLookValue(target, key, value) {
        this.writeLook(target, this.lookWith(target, key, value));
    },

    // Slider drags change the look live; commitLookPreview records one undo step.
    previewLookValue(target, key, value) {
        if (this._lookPreview && this._lookPreview.target !== target) this.commitLookPreview();
        const look = this.lookWith(target, key, value);
        if (!this._lookPreview) {
            const mapId = this.currentMapId();
            const settings = DocsDoodads.Lighting.mapSettings(mapId);
            this._lookPreview = target === 'map'
                ? { target, before: settings ? JSON.parse(JSON.stringify(settings)) : null }
                : { target, before: { value: DocsDoodads.World.raw('postfx.look') === undefined ? undefined : JSON.parse(JSON.stringify(DocsDoodads.World.raw('postfx.look'))) } };
        }
        if (target === 'map') {
            const mapId = this.currentMapId();
            const settings = Object.assign({}, DocsDoodads.Lighting.mapSettings(mapId) || {});
            settings.postfx = Object.assign({}, settings.postfx || {}, { mode: 'custom', look });
            this.writeMapSettings(mapId, settings);
        } else {
            DocsDoodads.World.set('postfx.look', look);
        }
    },

    commitLookPreview() {
        const preview = this._lookPreview;
        this._lookPreview = null;
        if (!preview) return;
        this.writeLook(preview.target, DocsDoodads.PostFX.normalizeLook(this.storedLook(preview.target)), preview.before);
    },

    applyPreset(target, id) {
        const look = DocsDoodads.PostFX.presetLook(id);
        if (look) this.writeLook(target, look);
    },

    mapPostFxMode() {
        const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
        return mine && mine.mode ? mine.mode : 'global';
    },

    // 'global' (the game-wide look), 'off', or 'custom' (seeded from the game-wide look the first time).
    setMapPostFxMode(mode) {
        const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
        const look = mine && mine.look ? mine.look : (mode === 'custom' ? DocsDoodads.PostFX.normalizeLook(DocsDoodads.World.get('postfx.look')) : null);
        if (mode === 'global' && !look) this.setMapSetting('postfx', undefined);
        else this.setMapSetting('postfx', look ? { mode, look } : { mode });
    },

    setPostFxCompare(on) {
        this.postFxCompare = Boolean(on);
    },

    renderPostFxBuilder() {
        const P = DocsDoodads.PostFX;
        const target = this.postFxTarget === 'map' ? 'map' : 'world';
        const pf = DocsDoodads.World.settings().postfx;
        const mode = this.mapPostFxMode();
        const selectStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 3px; border-radius: 4px; font-size: 11px;';
        const option = (value, label, current) => `<option value="${escapeHtml(String(value))}" ${String(value) === String(current) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
        const check = (id, label, on, title) => `<label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dd-text);" ${title ? `title="${escapeHtml(title)}"` : ''}><input type="checkbox" id="${id}" ${on ? 'checked' : ''} /> ${escapeHtml(label)}</label>`;
        this._openPostFx = this._openPostFx || {};
        const editable = target === 'world' || mode === 'custom';
        const effects = editable ? P.effects.map((effect, i) => {
            const on = this.getLookValue(target, effect.id + '.enabled');
            const fields = [{ key: effect.id + '.enabled', label: 'On', type: 'checkbox' }].concat(effect.params.map(p => Object.assign({ type: 'range' }, p, { key: effect.id + '.' + p.key })));
            return `
                <details id="dd-pfx-sec-${i}" ${this._openPostFx[effect.id] ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 5px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: ${on ? 'var(--dd-good-dark)' : 'var(--dd-text)'};">${escapeHtml(effect.label)}${on ? ' &middot; on' : ''}</summary>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px;">
                        ${fields.map((f, j) => this.fieldHtml(`dd-pfx-${i}-${j}`, f, this.getLookValue(target, f.key))).join('')}
                    </div>
                </details>`;
        }).join('') : `<div style="font-size: 11px; color: var(--dd-muted);">This map ${mode === 'off' ? 'shows no effects' : 'uses the game-wide look'}. Choose "Its own look" to give it a look of its own.</div>`;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="dd-pop-title" style="margin-bottom: 0;">${DocsDoodads.Ui.icon('sun', 1)} Screen Looks</div>
                <button class="dd-btn" id="dd-pfx-close">Close</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div style="font-size: 10px; color: var(--dd-muted);">Editing
                    <select id="dd-pfx-target" style="${selectStyle}">${option('world', 'Game-wide look', target)}${option('map', 'This map', target)}</select></div>
                <div style="font-size: 10px; color: var(--dd-muted); ${target === 'map' ? '' : 'visibility: hidden;'}">This map uses
                    <select id="dd-pfx-mapmode" style="${selectStyle}">${option('global', 'The game-wide look', mode)}${option('off', 'No effects', mode)}${option('custom', 'Its own look', mode)}</select></div>
            </div>
            <div style="display: flex; gap: 6px; align-items: flex-end;">
                <div style="flex: 1; font-size: 10px; color: var(--dd-muted);">Preset
                    <select id="dd-pfx-preset" style="${selectStyle}">${P.presets.map(p => option(p.id, p.label, '')).join('')}</select></div>
                <button class="dd-btn dd-btn-primary" id="dd-pfx-apply" ${editable ? '' : 'disabled'}>Apply</button>
                <button class="dd-btn" id="dd-pfx-compare" title="Hold to see the map without effects">Hold to Compare</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px;">
                ${check('dd-pfx-enabled', 'Post-processing on', pf.enabled, 'Switches every look off for the whole game')}
                ${check('dd-pfx-pictures', 'Affect pictures', pf.includePictures, 'Off: pictures and the timer are drawn without effects')}
                ${check('dd-pfx-preview', 'Show while editing', this.postFxPreview !== false)}
                <div style="font-size: 10px; color: var(--dd-muted);">Quality <select id="dd-pfx-quality" style="${selectStyle}">${P.qualities.map(q => option(q.value, q.label, pf.quality)).join('')}</select></div>
            </div>
            <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 4px; min-height: 80px;">${effects}</div>
            ${this.lookBlendsHtml ? this.lookBlendsHtml(target) : ''}
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; display: flex; gap: 6px; align-items: flex-end;">
                <div style="flex: 1; font-size: 10px; color: var(--dd-muted);">Screen effect (test)
                    <select id="dd-pfx-anim" style="${selectStyle}">${P.Animations.types.map(t => option(t.value, t.label, '')).join('')}</select></div>
                <button class="dd-btn" id="dd-pfx-play">Play</button>
            </div>
            <div style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; display: flex; flex-direction: column; gap: 5px;">
                <div style="font-size: 11px; font-weight: bold; color: var(--dd-muted);">Export Map Image</div>
                <div style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: var(--dd-text);">
                    Scale <select id="dd-pfx-export-scale" style="${selectStyle} width: auto;">${option(1, '100%', 1)}${option(0.5, '50%', 1)}${option(0.25, '25%', 1)}</select>
                    ${check('dd-pfx-export-chars', 'Characters', true)}
                    ${check('dd-pfx-export-fx', 'Lighting & colour', true)}
                </div>
                <button class="dd-btn dd-btn-primary" id="dd-pfx-export" title="Saves the whole map as one PNG in the project's screenshots folder">Export Map Image</button>
            </div>`;
    },

    showPostFxBuilder() {
        const existing = document.getElementById('dd-postfx');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-postfx';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 330px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        panel.innerHTML = this.renderPostFxBuilder();
        document.body.appendChild(panel);
        this._postFxPanel = panel;
        this.bindPostFxBuilder();
    },

    refreshPostFxBuilder() {
        const panel = this._postFxPanel;
        if (!panel || !panel.parentNode) return;
        panel.innerHTML = this.renderPostFxBuilder();
        this.bindPostFxBuilder();
    },

    bindPostFxBuilder() {
        const P = DocsDoodads.PostFX;
        const byId = id => document.getElementById(id);
        const target = this.postFxTarget === 'map' ? 'map' : 'world';
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-pfx-close', 'onclick', () => {
            this.setPostFxCompare(false);
            this.previewRegionLook = 0;
            if (this._postFxPanel && this._postFxPanel.parentNode) this._postFxPanel.parentNode.removeChild(this._postFxPanel);
        });
        on('dd-pfx-target', 'onchange', e => { this.postFxTarget = e.target.value; this.refreshPostFxBuilder(); });
        on('dd-pfx-mapmode', 'onchange', e => { this.setMapPostFxMode(e.target.value); this.refreshPostFxBuilder(); });
        on('dd-pfx-apply', 'onclick', () => { this.applyPreset(target, byId('dd-pfx-preset').value); this.refreshPostFxBuilder(); });
        const compare = byId('dd-pfx-compare');
        if (compare) {
            compare.onmousedown = () => this.setPostFxCompare(true);
            compare.onmouseup = compare.onmouseleave = () => this.setPostFxCompare(false);
        }
        on('dd-pfx-enabled', 'onchange', e => this.setWorldSetting('postfx.enabled', Boolean(e.target.checked)));
        on('dd-pfx-pictures', 'onchange', e => this.setWorldSetting('postfx.includePictures', Boolean(e.target.checked)));
        on('dd-pfx-preview', 'onchange', e => { this.postFxPreview = Boolean(e.target.checked); });
        on('dd-pfx-quality', 'onchange', e => this.setWorldSetting('postfx.quality', e.target.value));
        on('dd-pfx-play', 'onclick', () => {
            const center = typeof $gamePlayer !== 'undefined' ? P.screenCenterOf($gamePlayer) : [0.5, 0.5];
            P.play({ type: byId('dd-pfx-anim').value, strength: 1, duration: 40, center });
        });
        on('dd-pfx-export', 'onclick', () => {
            this.exportMapImage({
                scale: parseFloat(byId('dd-pfx-export-scale').value) || 1,
                includeCharacters: Boolean(byId('dd-pfx-export-chars').checked),
                includeEffects: Boolean(byId('dd-pfx-export-fx').checked)
            });
        });
        if (this.bindLookBlends) this.bindLookBlends(target);
        if (target === 'map' && this.mapPostFxMode() !== 'custom') return;
        P.effects.forEach((effect, i) => {
            const details = byId(`dd-pfx-sec-${i}`);
            if (details) details.ontoggle = () => { this._openPostFx[effect.id] = details.open; };
            const fields = [{ key: effect.id + '.enabled', type: 'checkbox' }].concat(effect.params.map(p => Object.assign({ type: 'range' }, p, { key: effect.id + '.' + p.key })));
            fields.forEach((f, j) => {
                const input = byId(`dd-pfx-${i}-${j}`);
                if (!input) return;
                const read = () => (f.type === 'checkbox' ? Boolean(input.checked) : f.type === 'color' ? input.value : parseFloat(input.value) || 0);
                if (f.type === 'range') {
                    const label = byId(`dd-pfx-${i}-${j}-val`);
                    input.oninput = () => {
                        this.previewLookValue(target, f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.previewLookValue(target, f.key, read());
                        this.commitLookPreview();
                    };
                    input.onpointerup = input.onblur = () => setTimeout(() => this.commitLookPreview(), 0);
                } else {
                    input.onchange = () => {
                        this.setLookValue(target, f.key, read());
                        if (f.key.endsWith('.enabled')) this.refreshPostFxBuilder();
                    };
                }
            });
        });
    },

    exportMapImage(options) {
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        const spriteset = scene && scene._spriteset;
        if (!spriteset || typeof require === 'undefined') {
            this.showToast('Open a map in Playtest to export it.', 'error');
            return null;
        }
        try {
            const fsMod = DocsDoodads.FS.fs;
            const pathMod = require('path');
            this.showToast('Rendering the map...', 'info');
            const { canvas, plan } = DocsDoodads.MapExport.capture(spriteset, options);
            fsMod.mkdirSync('screenshots', { recursive: true });
            const out = pathMod.join('screenshots', DocsDoodads.MapExport.fileName($gameMap.mapId()));
            fsMod.writeFileSync(out, Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64'));
            this.showToast(`Saved ${plan.width} x ${plan.height} image: ${out}`, 'success');
            try { if (typeof nw !== 'undefined' && nw.Shell) nw.Shell.showItemInFolder(pathMod.resolve(out)); } catch (error) {}
            return out;
        } catch (error) {
            this.showToast(error.message || String(error), 'error');
            return null;
        }
    },

    addSeasonSet() {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        sets.push({});
        this.setWorldSetting('seasons.sets', sets);
        return sets.length - 1;
    },

    setSeasonCell(row, season, path) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (!sets[row]) return;
        const value = DocsDoodads.Seasons.normalize(path).trim();
        if (value) sets[row][season] = value;
        else delete sets[row][season];
        this.setWorldSetting('seasons.sets', sets);
    },

    removeSeasonSet(row) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (!sets[row]) return;
        sets.splice(row, 1);
        this.setWorldSetting('seasons.sets', sets);
    },

    // One undo step: put an asset into a season cell, optionally in a new row.
    addAssetToSeasons(path, season, row) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (row === 'new' || !sets[row]) {
            sets.push({});
            row = sets.length - 1;
        }
        sets[row][season] = DocsDoodads.Seasons.normalize(path);
        this.setWorldSetting('seasons.sets', sets);
        return row;
    },

    worldSections() {
        const D = DocsDoodads;
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        const check = (key, label) => ({ key, label, type: 'checkbox' });
        const select = (key, label, options) => ({ key, label, type: 'select', options });
        return [
            { title: 'Day and Night', extra: 'keyframes', fields: [
                select('time.source', 'Clock', D.TimeOfDay.sources),
                number('time.variableId', 'Hour variable (the clock writes it; variable mode reads it)'),
                number('time.minuteVariableId', 'Minute variable (optional)'),
                range('time.minutesPerSecond', 'Game minutes per real second', 0.1, 60, 0.1),
                number('time.startHour', 'Starting hour for new games', 0.5),
                range('time.lampThreshold', 'Lamps switch on at darkness', 0, 1, 0.05)
            ] },
            { title: 'Sun and Shadows', fields: [
                select('sun.source', 'Shadow direction from', D.Sun.sources),
                range('sun.angle', 'Fixed direction (degrees, 0 = up, 90 = right)', 0, 359, 1),
                number('sun.variableId', 'Direction variable (degrees)'),
                check('characterShadows.enabled', 'Characters cast shadows'),
                select('characterShadows.mode', 'Which events', D.CharacterShadow.modes),
                check('characterShadows.includePlayer', 'Include the party'),
                range('characterShadows.opacity', 'Strength', 0, 1, 0.05),
                range('characterShadows.length', 'Length', 0.1, 1.5, 0.05),
                range('characterShadows.blur', 'Softness', 0, 8, 0.5),
                number('characterShadows.offsetX', 'Offset X'),
                number('characterShadows.offsetY', 'Offset Y'),
                { key: 'characterShadows.occlusionRegions', label: 'Stop shadows at regions (roofs, e.g. 5, 6)', type: 'text',
                    format: v => (v || []).join(', '), parse: t => String(t || '').split(/[^0-9]+/).map(Number).filter(n => n > 0) }
            ] },
            { title: 'Seasons', extra: 'seasons', fields: [
                select('seasons.source', 'Current season from', D.Seasons.sources),
                number('seasons.variableId', 'Season variable')
            ] },
            { title: 'Water Reflections', fields: [
                check('reflections.enabled', 'Reflect characters and doodads in water'),
                range('reflections.opacity', 'Strength', 0, 1, 0.05),
                range('reflections.ripple', 'Ripple', 0, 1, 0.05),
                number('reflections.regionId', 'Also treat this region as water (0 = none)'),
                number('reflections.shoreInset', 'Shore margin (px kept clear along the waterline)')
            ] },
            { title: 'See-Through', fields: [
                check('seeThrough.enabled', 'Reveal the player behind tall doodads'),
                select('seeThrough.mode', 'How', D.SeeThrough.modes),
                range('seeThrough.opacity', 'Faded opacity', 0.05, 1, 0.05),
                range('seeThrough.speed', 'Fade speed', 0.02, 0.5, 0.02),
                { key: 'seeThrough.silhouetteColor', label: 'Outline colour', type: 'color' }
            ] },
            { title: 'Characters', extra: 'animsets', fields: [
                check('characterAnim.diagonal', 'Diagonal movement (8 directions)')
            ] },
            { title: 'Visual Equipment', extra: 'visual', fields: [
                check('visualEquip.enabled', 'Draw gear layers from <visual> notetags'),
                check('visualEquip.followers', 'On followers'),
                check('visualEquip.events', 'On events with <visual> tags'),
                check('visualEquip.battlers', 'On side-view battlers (layers with an sv sheet)'),
                check('visualEquip.menus', 'In menus and save files'),
                check('visualEquip.equipPreview', 'Equip screen shows the highlighted item on the actor')
            ] },
            { title: 'Destination Marker', fields: [
                select('destination.style', 'Marker', D.Destination.styles),
                { key: 'destination.color', label: 'Colour', type: 'color' },
                range('destination.opacity', 'Opacity', 0, 255, 5),
                select('destination.blend', 'Blend', D.Destination.blends),
                range('destination.scale', 'Size (tiles)', 0.25, 3, 0.05),
                select('destination.pulse', 'Pulse', D.Destination.pulses),
                number('destination.spin', 'Spin (degrees per second)', 5),
                number('destination.bob', 'Bob height (pixels)'),
                select('destination.layer', 'Drawn', D.Destination.layers),
                { key: 'destination.image', label: 'Image in img/system (Name[f4] = 4 frames)', type: 'text' },
                number('destination.fps', 'Image frames per second'),
                select('destination.animationId', 'Database animation', [{ value: 0, label: '(none)' }].concat(
                    (typeof $dataAnimations !== 'undefined' && $dataAnimations ? $dataAnimations : []).filter(a => a).map(a => ({ value: a.id, label: `${a.id}: ${a.name || '(unnamed)'}` })))),
                select('destination.vfx', 'VFX effect', [{ value: '', label: '(none)' }].concat(
                    D.Vfx.builtIns.concat(D.Vfx.library()).map(v => ({ value: v.id, label: v.name || v.id })))),
                check('destination.pathDots', 'Dots along the path the player will walk'),
                { key: 'destination.dotColor', label: 'Dot colour', type: 'color' },
                number('destination.dotSpacing', 'Dot every N tiles')
            ] },
            { title: 'Biomes', extra: 'biomes', fields: [] },
            { title: 'Dressing Rules', extra: 'dress', fields: [] },
            { title: 'Spatial Sound', fields: [
                select('sound.mode', 'Event sounds heard from where they happen', D.SpatialSound.modes),
                number('sound.near', 'Full volume within (tiles)', 0.5),
                number('sound.far', 'Silent beyond (tiles)', 0.5),
                number('sound.panWidth', 'Full left/right at (tiles)', 0.5),
                range('sound.pitchVariance', 'Pitch variation (%)', 0, 30, 1),
                range('sound.volumeVariance', 'Volume variation (%)', 0, 50, 1)
            ] },
            { title: 'Zoom and Sound Focus', extra: 'ambience', fields: [
                check('zoom.enabled', 'Players can zoom in on their character'),
                check('zoom.wheel', 'With the mouse wheel'),
                check('zoom.keys', 'With the + and - keys'),
                range('zoom.max', 'Closest zoom', 1.25, 4, 0.05),
                range('zoom.step', 'Zoom step', 0.05, 1, 0.05),
                check('focus.enabled', 'Zooming in brings the nearby sound forward'),
                range('focus.music', 'Music drops by (at the closest zoom)', 0, 1, 0.05),
                range('focus.reach', 'Sounds carry less far by', 0, 0.9, 0.05),
                range('focus.boost', 'Nearby sounds louder by (x)', 1, 3, 0.05),
                check('footsteps.enabled', 'Footsteps'),
                range('footsteps.volume', 'Footstep volume', 0, 100, 1),
                range('footsteps.quiet', 'Footsteps at normal zoom (share of full)', 0, 1, 0.05),
                range('footsteps.dash', 'Louder dashing (x)', 1, 2, 0.05),
                check('footsteps.followers', 'Followers too (softer)')
            ] },
            { title: 'Traversal', fields: [
                check('traversal.jump.enabled', 'Jump (C key): hop forward, over gaps'),
                range('traversal.jump.distance', 'Jump over gaps up to (tiles)', 1, 6, 1),
                range('traversal.jump.up', 'Jump up ledges as high as (tiles of terrain height)', 0, 3, 0.25),
                { key: 'traversal.jump.sound', label: 'Jump sound', type: 'text' },
                check('traversal.glide.enabled', 'Glide: jumping off high ground carries further'),
                range('traversal.glide.perHeight', 'Glide: tiles further per tile of height', 0.5, 4, 0.25),
                range('traversal.glide.max', 'Glide: at most this many tiles further', 1, 10, 1),
                check('traversal.swim.enabled', 'Swim in water nobody could walk in'),
                range('traversal.swim.speed', 'Swimming speed change', -2, 1, 1),
                range('traversal.swim.sink', 'Swimming: in the water up to (pixels)', 0, 40, 1),
                { key: 'traversal.swim.suffix', label: 'Swimming sheet: name + (e.g. _swim, used when the file is there)', type: 'text' },
                { key: 'traversal.swim.sound', label: 'Swimming stroke sound', type: 'text' },
                check('traversal.dive.enabled', 'Dive (C in deep water) to the map set under this one (map panel)'),
                check('traversal.fly.enabled', 'Fly (F key): over everything, landing where you can stand'),
                range('traversal.fly.altitude', 'Flying height (pixels)', 8, 120, 4),
                range('traversal.fly.speed', 'Flying speed change', -1, 2, 1),
                check('traversal.fly.encounters', 'Random battles while flying'),
                check('traversal.climb.enabled', 'Climb walls and cliffs in these regions or terrain tags'),
                { key: 'traversal.climb.regions', label: 'Climbable regions (e.g. 5, 6)', type: 'text' },
                { key: 'traversal.climb.tags', label: 'Climbable terrain tags', type: 'text' },
                check('traversal.ice.enabled', 'Slide on ice in these regions or terrain tags'),
                { key: 'traversal.ice.regions', label: 'Ice regions', type: 'text' },
                { key: 'traversal.ice.tags', label: 'Ice terrain tags', type: 'text' },
                number('traversal.jump.switchId', 'Jump needs switch (0 = always)'),
                number('traversal.swim.switchId', 'Swimming needs switch'),
                number('traversal.fly.switchId', 'Flying needs switch'),
                number('traversal.jump.noRegion', 'No jumping into region'),
                number('traversal.swim.noRegion', 'No swimming in region'),
                number('traversal.fly.noRegion', 'No flying over region'),
                select('traversal.controls.padJump', 'Gamepad: jump (and dive) button', D.Traversal.padButtons),
                select('traversal.controls.padFly', 'Gamepad: fly and land button', D.Traversal.padButtons),
                select('traversal.controls.buttons', 'On-screen Jump and Fly buttons', D.Traversal.buttonModes),
                range('traversal.controls.size', 'On-screen button size (pixels)', 48, 120, 4)
            ] },
            { title: 'Motion Blur', fields: [
                check('motionBlur.enabled', 'Blur moving characters (players can turn it off in Options)'),
                select('motionBlur.mode', 'Who', D.MotionBlur.modes),
                range('motionBlur.strength', 'Strength', 0.1, 3, 0.1)
            ] },
            { title: 'Minimap', fields: [
                check('minimap.flat', 'Minimap on flat maps too (3D maps have their own switch; a map can turn it off)'),
                check('minimap.fog', 'Fog of war: show only what the player has been near (kept in the save)'),
                range('minimap.radius', 'How far the player sees (tiles)', 1, 20, 1),
                range('minimap.size', 'Minimap size (pixels)', 80, 260, 10)
            ] },
            { title: 'Lighting on Flat Maps', fields: [
                check('lighting2d.occlusion', 'Walls stop light (tiles nobody can walk on cast shadows)'),
                { key: 'lighting2d.wallRegions', label: 'Also walls: regions (e.g. 9, 10)', type: 'text' },
                range('lighting2d.rays', 'Shadow detail (rays per light)', 40, 360, 20),
                check('lighting2d.flashlight.enabled', 'The player carries a flashlight (it points where they face)'),
                number('lighting2d.flashlight.switchId', 'Only while switch # is ON (0 = always)'),
                range('lighting2d.flashlight.radius', 'Flashlight reach', 60, 800, 10),
                range('lighting2d.flashlight.spread', 'Flashlight width (degrees)', 10, 120, 5),
                { key: 'lighting2d.flashlight.color', label: 'Flashlight colour', type: 'color' },
                range('lighting2d.flashlight.intensity', 'Flashlight brightness', 0.1, 1, 0.05),
                check('lighting2d.flashlight.occlude', 'Walls stop the flashlight')
            ] },
            { title: 'Camera on Flat Maps', fields: [
                range('camera2d.smooth', "Camera eases after the player (0 = MZ's own)", 0, 0.95, 0.05),
                range('camera2d.lookAhead', 'Looks ahead of the walking player (tiles)', 0, 4, 0.5)
            ] },
            { title: 'Weather on Flat Maps', fields: [
                range('weather2d.wind.strength', 'Wind (0 calm, 1 gale): leans swaying doodads, pushes particles and fog layers', 0, 1, 0.05),
                select('weather2d.wind.direction', 'Wind blows', [{ value: 1, label: 'To the right' }, { value: -1, label: 'To the left' }]),
                range('weather2d.wind.gusts', 'Gusts', 0, 1, 0.05),
                check('weather2d.wind.fromWeather', 'Rain and storms make it windier'),
                check('weather2d.wind.leaves', 'Leaves blow across the screen in a strong wind'),
                { key: 'weather2d.wind.leafColor', label: 'Leaf colour', type: 'color' },
                check('weather2d.lightning.enabled', 'Lightning in storms (Set Weather Effect: Storm)'),
                range('weather2d.lightning.every', 'About every (seconds, in a full storm)', 2, 60, 1),
                range('weather2d.lightning.flash', 'Flash brightness', 40, 255, 5),
                { key: 'weather2d.lightning.sound', label: 'Thunder sound (audio/se, blank for none)', type: 'text' },
                range('weather2d.lightning.volume', 'Thunder volume', 0, 100, 5),
                range('weather2d.lightning.delay', 'Thunder up to (seconds after the flash, for far strikes)', 0, 6, 0.5)
            ] }
        ].concat(this.extraWorldSections || []);
    },

    renderWorldSections() {
        const World = DocsDoodads.World;
        this._openWorldSections = this._openWorldSections || {};
        return this.worldSections().map((section, si) => {
            const fields = section.fields.map((f, fi) => {
                const raw = World.get(f.key);
                return this.fieldHtml(`dd-world-${si}-${fi}`, f, f.format ? f.format(raw) : raw);
            }).join('');
            const extra = section.extra === 'keyframes' ? this.renderKeyframeEditor() : section.extra === 'seasons' ? this.renderSeasonEditor()
                : section.extra === 'animsets' ? this.renderAnimSetEditor() : section.extra === 'visual' ? this.renderVisualTryOn()
                : section.extra === 'biomes' ? this.renderBiomeEditor() : section.extra === 'dress' ? this.renderDressEditor()
                : section.extra === 'ambience' ? this.renderAmbienceEditor() : '';
            return `
                <details id="dd-world-sec-${si}" ${this._openWorldSections[section.title] ? 'open' : ''} style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px; margin-top: 6px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">${section.title}</summary>
                    <div style="font-size: 10px; color: var(--dd-faint); margin-top: 4px;">All maps</div>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}${extra}</div>
                </details>`;
        }).join('');
    },

    bindWorldSections() {
        const World = DocsDoodads.World;
        this.worldSections().forEach((section, si) => {
            const details = document.getElementById(`dd-world-sec-${si}`);
            if (details) details.ontoggle = () => { this._openWorldSections[section.title] = details.open; };
            section.fields.forEach((f, fi) => {
                const input = document.getElementById(`dd-world-${si}-${fi}`);
                if (!input) return;
                const read = () => {
                    if (f.type === 'checkbox') return Boolean(input.checked);
                    if (f.type === 'range' || f.type === 'number') return parseFloat(input.value) || 0;
                    return f.parse ? f.parse(input.value) : input.value;
                };
                if (f.type === 'range') {
                    let previous = null;
                    const label = document.getElementById(`dd-world-${si}-${fi}-val`);
                    input.oninput = () => {
                        if (!previous) previous = { value: World.raw(f.key) === undefined ? undefined : JSON.parse(JSON.stringify(World.raw(f.key))) };
                        World.set(f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.setWorldSetting(f.key, read(), previous || undefined);
                        previous = null;
                    };
                } else {
                    input.onchange = () => {
                        this.setWorldSetting(f.key, read());
                        // Season names label the season checkboxes and columns.
                        if (f.key === 'seasons.source' || f.key === 'time.source') this.refreshInspector();
                    };
                }
            });
        });
        this.bindKeyframeEditor();
        this.bindSeasonEditor();
        this.bindAnimSetEditor();
        this.bindVisualTryOn();
        this.bindBiomeEditor();
        this.bindDressEditor();
        this.bindAmbienceEditor();
    },

    renderKeyframeEditor() {
        const Time = DocsDoodads.TimeOfDay;
        const keys = DocsDoodads.World.get('time.keyframes') || [];
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 11px;';
        const rows = keys.map((k, i) => `
            <div style="display: grid; grid-template-columns: 48px 1fr 34px 24px; gap: 4px; align-items: center;">
                <input type="number" id="dd-kf-hour-${i}" min="0" max="23.75" step="0.25" value="${escapeHtml(String(k.hour))}" title="Hour" style="${inputStyle}" />
                <input type="range" id="dd-kf-dark-${i}" min="0" max="1" step="0.05" value="${escapeHtml(String(k.darkness))}" title="Darkness" />
                <input type="color" id="dd-kf-color-${i}" value="${escapeHtml(k.color || '#000000')}" title="Colour" style="width: 100%; height: 20px; background: var(--dd-field); border: 1px solid var(--dd-line);" />
                <button class="dd-btn" id="dd-kf-del-${i}" title="Remove this keyframe" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        const preview = this.previewMinutes !== null && this.previewMinutes !== undefined ? this.previewMinutes : 12 * 60;
        return `
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 4px;">Darkness through the day (hour, darkness, colour):</div>
            ${rows}
            <button class="dd-btn" id="dd-kf-add">Add Keyframe</button>
            <label style="display: flex; align-items: center; gap: 6px; color: var(--dd-text); font-size: 11px;">
                <input type="checkbox" id="dd-time-preview-on" ${this.previewMinutes !== null && this.previewMinutes !== undefined ? 'checked' : ''} /> Preview a time while editing</label>
            <div style="font-size: 10px; color: var(--dd-muted);">Preview: <span id="dd-time-preview-val" style="color: var(--dd-text);">${Time.format(preview)}</span>
                <input type="range" id="dd-time-preview" min="0" max="1425" step="15" value="${preview}" style="width: 100%;" /></div>`;
    },

    bindKeyframeEditor() {
        const World = DocsDoodads.World;
        const current = () => JSON.parse(JSON.stringify(World.get('time.keyframes') || []));
        const commit = (next, previous) => this.setWorldSetting('time.keyframes', next, previous);
        current().forEach((k, i) => {
            const hour = document.getElementById(`dd-kf-hour-${i}`);
            if (hour) hour.onchange = () => {
                const next = current();
                next[i].hour = Math.max(0, Math.min(23.75, parseFloat(hour.value) || 0));
                commit(next);
            };
            const dark = document.getElementById(`dd-kf-dark-${i}`);
            if (dark) {
                let previous = null;
                dark.oninput = () => {
                    if (!previous) previous = { value: World.raw('time.keyframes') === undefined ? undefined : JSON.parse(JSON.stringify(World.raw('time.keyframes'))) };
                    const next = current();
                    next[i].darkness = parseFloat(dark.value) || 0;
                    World.set('time.keyframes', next);
                };
                dark.onchange = () => {
                    const next = current();
                    next[i].darkness = parseFloat(dark.value) || 0;
                    commit(next, previous || undefined);
                    previous = null;
                };
            }
            const color = document.getElementById(`dd-kf-color-${i}`);
            if (color) color.onchange = () => {
                const next = current();
                next[i].color = color.value;
                commit(next);
            };
            const del = document.getElementById(`dd-kf-del-${i}`);
            if (del) del.onclick = () => {
                const next = current();
                next.splice(i, 1);
                commit(next);
                this.refreshInspector();
            };
        });
        const add = document.getElementById('dd-kf-add');
        if (add) add.onclick = () => {
            commit(current().concat([{ hour: 12, darkness: 0, color: '#ffffff' }]));
            this.refreshInspector();
        };
        const toggle = document.getElementById('dd-time-preview-on');
        const slider = document.getElementById('dd-time-preview');
        const label = document.getElementById('dd-time-preview-val');
        if (toggle && slider) {
            toggle.onchange = () => { this.previewMinutes = toggle.checked ? (parseInt(slider.value, 10) || 0) : null; };
            slider.oninput = () => {
                const minutes = parseInt(slider.value, 10) || 0;
                if (label) label.textContent = DocsDoodads.TimeOfDay.format(minutes);
                if (toggle.checked) this.previewMinutes = minutes;
            };
        }
    },

    renderSeasonEditor() {
        const seasons = DocsDoodads.World.settings().seasons;
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const names = seasons.names.map((name, k) => `<input type="text" id="dd-season-name-${k}" value="${escapeHtml(name)}" style="${inputStyle}" />`).join('');
        const cols = `grid-template-columns: repeat(${seasons.names.length}, 1fr) 22px;`;
        const rows = seasons.sets.map((set, r) => `
            <div style="display: grid; ${cols} gap: 3px; align-items: center;">
                ${seasons.names.map((name, k) => `<input type="text" list="dd-season-assets" id="dd-season-cell-${r}-${k}" placeholder="${escapeHtml(name)}" title="${escapeHtml(name)}: ${escapeHtml(set[k] || '(unchanged)')}" value="${escapeHtml(set[k] || '')}" style="${inputStyle}" />`).join('')}
                <button class="dd-btn" id="dd-season-del-${r}" title="Remove this row" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data && DocsDoodads.AssetIndex.data.assets
            ? Object.values(DocsDoodads.AssetIndex.data.assets).filter(a => a && a.path && /\.png$/i.test(a.path)).slice(0, 2000) : [];
        const preview = this.previewSeason !== null && this.previewSeason !== undefined ? this.previewSeason : -1;
        return `
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 4px;">Season names:</div>
            <div style="display: grid; grid-template-columns: repeat(${seasons.names.length}, 1fr); gap: 3px;">${names}</div>
            <div style="font-size: 10px; color: var(--dd-muted);">Art swaps (each row is one prop; empty cells keep the original). Tip: select an asset and use "Season Variant".</div>
            ${rows}
            <datalist id="dd-season-assets">${assets.map(a => `<option value="${escapeHtml(a.path)}"></option>`).join('')}</datalist>
            <button class="dd-btn" id="dd-season-add">Add Row</button>
            <div style="font-size: 10px; color: var(--dd-muted);">Preview while editing
                <select id="dd-season-preview" style="${inputStyle}">
                    <option value="-1" ${preview < 0 ? 'selected' : ''}>As in the game</option>
                    ${seasons.names.map((name, k) => `<option value="${k}" ${preview === k ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
                </select></div>`;
    },

    // ---- Ambience layers and footstep sounds (World > Zoom and Sound Focus) ----
    renderAmbienceEditor() {
        const W = DocsDoodads.World, SS = DocsDoodads.SpatialSound;
        const inputStyle = 'width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const files = this.audioFileOptions();
        const bgs = files.filter(o => o.value.indexOf('bgs/') === 0).map(o => o.value.slice(4));
        const se = files.filter(o => o.value.indexOf('se/') === 0).map(o => o.value.slice(3));
        const select = (id, value, options) => `<select id="${id}" style="${inputStyle}">${options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</select>`;
        const layers = (W.get('ambience.layers') || []).map((l, i) => `
            <div style="display: grid; grid-template-columns: 1fr 52px; gap: 3px; border-top: 1px dashed var(--dd-line); padding-top: 3px;">
                ${select(`dd-amb-${i}-kind`, l.kind, SS.ambienceKinds)}
                <input type="text" id="dd-amb-${i}-id" value="${escapeHtml(String(l.id === undefined ? '' : l.id))}" title="Region or terrain tag number, or text in the doodads' picture names" placeholder="id / text" style="${inputStyle}" />
                <input type="text" list="dd-amb-bgs" id="dd-amb-${i}-sound" value="${escapeHtml(l.sound || '')}" placeholder="Background sound" style="${inputStyle}" />
                <button class="dd-btn" id="dd-amb-del-${i}" title="Remove" style="padding: 0 4px;">&times;</button>
                <div style="grid-column: span 2; display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px;">
                    <input type="number" id="dd-amb-${i}-volume" value="${escapeHtml(String(l.volume === undefined ? 60 : l.volume))}" title="Volume" style="${inputStyle}" />
                    <input type="number" id="dd-amb-${i}-radius" value="${escapeHtml(String(l.radius === undefined ? 6 : l.radius))}" title="Heard within (tiles)" style="${inputStyle}" />
                    <input type="number" step="0.05" id="dd-amb-${i}-quiet" value="${escapeHtml(String(l.quiet === undefined ? 0.4 : l.quiet))}" title="Share heard at normal zoom" style="${inputStyle}" />
                    <input type="number" id="dd-amb-${i}-pitch" value="${escapeHtml(String(l.pitch === undefined ? 100 : l.pitch))}" title="Pitch" style="${inputStyle}" />
                </div>
            </div>`).join('');
        const steps = (W.get('footsteps.rows') || []).map((r, i) => `
            <div style="display: grid; grid-template-columns: 1fr 40px 1fr 40px 22px; gap: 3px; align-items: center;">
                ${select(`dd-step-${i}-kind`, r.kind, SS.footstepKinds)}
                <input type="number" id="dd-step-${i}-id" value="${escapeHtml(String(r.id === undefined ? '' : r.id))}" title="Region or terrain tag" style="${inputStyle}" />
                <input type="text" list="dd-step-se" id="dd-step-${i}-sound" value="${escapeHtml(r.sound || '')}" placeholder="Sound effect" style="${inputStyle}" />
                <input type="number" id="dd-step-${i}-volume" value="${escapeHtml(String(r.volume === undefined ? 90 : r.volume))}" title="Volume" style="${inputStyle}" />
                <button class="dd-btn" id="dd-step-del-${i}" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        return `
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 4px; line-height: 1.4;">Ambience: background sounds that rise with what's around the player (volume, heard within, share at normal zoom, pitch). They swell as you zoom in.</div>
            ${layers}
            <datalist id="dd-amb-bgs">${bgs.map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
            <button class="dd-btn" id="dd-amb-add">Add Ambience</button>
            <div style="font-size: 10px; color: var(--dd-muted); margin-top: 6px;">Footstep sounds by ground (regions first, then terrain tags, then the kind of ground):</div>
            ${steps}
            <datalist id="dd-step-se">${se.map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
            <button class="dd-btn" id="dd-step-add">Add Footstep Sound</button>`;
    },

    bindAmbienceEditor() {
        const W = DocsDoodads.World;
        const byId = id => document.getElementById(id);
        const edit = (key, fn) => {
            const list = JSON.parse(JSON.stringify(W.get(key) || []));
            fn(list);
            this.setWorldSetting(key, list);
            this.refreshInspector();
        };
        const add = byId('dd-amb-add');
        if (add) add.onclick = () => edit('ambience.layers', list => list.push({ kind: 'water', id: '', sound: '', volume: 60, radius: 6, quiet: 0.4, pitch: 100 }));
        (W.get('ambience.layers') || []).forEach((l, i) => {
            for (const field of ['kind', 'id', 'sound', 'volume', 'radius', 'quiet', 'pitch']) {
                const input = byId(`dd-amb-${i}-${field}`);
                if (input) input.onchange = () => edit('ambience.layers', list => {
                    list[i][field] = ['volume', 'radius', 'quiet', 'pitch'].includes(field) ? parseFloat(input.value) || 0 : input.value;
                });
            }
            const del = byId(`dd-amb-del-${i}`);
            if (del) del.onclick = () => edit('ambience.layers', list => list.splice(i, 1));
        });
        const addStep = byId('dd-step-add');
        if (addStep) addStep.onclick = () => edit('footsteps.rows', list => list.push({ kind: 'default', id: '', sound: '', volume: 90 }));
        (W.get('footsteps.rows') || []).forEach((r, i) => {
            for (const field of ['kind', 'id', 'sound', 'volume']) {
                const input = byId(`dd-step-${i}-${field}`);
                if (input) input.onchange = () => edit('footsteps.rows', list => {
                    list[i][field] = field === 'volume' || field === 'id' ? parseFloat(input.value) || 0 : input.value;
                });
            }
            const del = byId(`dd-step-del-${i}`);
            if (del) del.onclick = () => edit('footsteps.rows', list => list.splice(i, 1));
        });
    },

    bindSeasonEditor() {
        const seasons = DocsDoodads.World.settings().seasons;
        seasons.names.forEach((name, k) => {
            const input = document.getElementById(`dd-season-name-${k}`);
            if (input) input.onchange = () => {
                const names = DocsDoodads.World.get('seasons.names').slice();
                names[k] = input.value.trim() || name;
                this.setWorldSetting('seasons.names', names);
            };
        });
        seasons.sets.forEach((set, r) => {
            seasons.names.forEach((name, k) => {
                const input = document.getElementById(`dd-season-cell-${r}-${k}`);
                if (input) input.onchange = () => this.setSeasonCell(r, k, input.value);
            });
            const del = document.getElementById(`dd-season-del-${r}`);
            if (del) del.onclick = () => {
                this.removeSeasonSet(r);
                this.refreshInspector();
            };
        });
        const add = document.getElementById('dd-season-add');
        if (add) add.onclick = () => {
            this.addSeasonSet();
            this.refreshInspector();
        };
        const preview = document.getElementById('dd-season-preview');
        if (preview) preview.onchange = () => {
            const value = parseInt(preview.value, 10);
            this.previewSeason = value >= 0 ? value : null;
        };
    },

    renderAssetSeasonControl(a) {
        if (!a || !a.path || !/\.png$/i.test(a.path)) return '';
        const seasons = DocsDoodads.World.settings().seasons;
        const selectStyle = 'flex: 1; min-width: 0; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 3px; border-radius: 4px; font-size: 11px;';
        const rowLabel = (set, r) => {
            const first = Object.keys(set || {}).map(k => set[k])[0];
            return `Row ${r + 1}${first ? ' (' + String(first).split('/').pop() + ')' : ''}`;
        };
        return `
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Season Variant:</label>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-season" style="${selectStyle}">${seasons.names.map((n, k) => `<option value="${k}">${escapeHtml(n)}</option>`).join('')}</select>
                    <select id="dd-asset-season-row" style="${selectStyle}"><option value="new">New row</option>${seasons.sets.map((set, r) => `<option value="${r}">${escapeHtml(rowLabel(set, r))}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-season-add" title="Use this image for that season in the season table">Add</button>
                </div>
            </div>`;
    },

    bindAssetSeasonControl(a) {
        const button = document.getElementById('dd-asset-season-add');
        if (!button) return;
        button.onclick = () => {
            const season = parseInt(document.getElementById('dd-asset-season').value, 10) || 0;
            const rowValue = document.getElementById('dd-asset-season-row').value;
            const row = this.addAssetToSeasons(a.path, season, rowValue === 'new' ? 'new' : parseInt(rowValue, 10));
            const name = DocsDoodads.World.settings().seasons.names[season] || 'that season';
            this.showToast(`Added as the ${name} art in season row ${row + 1}.`, 'success');
            this.refreshInspector();
        };
    },

    // The map panel's sections that mention every word searched for are shown (and opened); clearing
    // the search brings the panel back as it was.
    applyMapSearch(content) {
        const query = (this._mapSearch || '').trim();
        let shown = 0;
        for (const section of Array.from(content.children || []).filter(el => el.tagName === 'DETAILS')) {
            if (section._docsWasOpen === undefined) section._docsWasOpen = section.open;
            const hit = DocsDoodads.SettingsSearch.matches(section.textContent || '', query);
            section.style.display = hit ? '' : 'none';
            section.open = query ? hit : section._docsWasOpen;
            if (hit) shown++;
        }
        const none = document.getElementById('dd-map-search-none');
        if (none) none.style.display = query && !shown ? '' : 'none';
        return shown;
    },

    renderMapPanel(content) {
        const mapId = this.currentMapId();
        const ambient = Object.assign({}, DocsDoodads.Lighting.ambientDefaults, (DocsDoodads.Lighting.mapSettings(mapId) || {}).ambient);
        const mapSettings = DocsDoodads.Lighting.mapSettings(mapId) || {};
        content.innerHTML = `
            <div style="color: var(--dd-muted); margin-bottom: 8px; line-height: 1.4;">Nothing is picked, so this is the map's own settings. (Map ${mapId})</div>
            ${this.renderClockBar()}
            <input type="search" id="dd-map-search" placeholder="Find a setting (fog, shadow, snow...)" value="${escapeHtml(this._mapSearch || '')}"
                style="width: 100%; box-sizing: border-box; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 4px 6px; border-radius: 4px; font-size: 11px; margin-bottom: 6px;" />
            <div id="dd-map-search-none" style="display: none; font-size: 11px; color: var(--dd-faint); margin-bottom: 6px;">No settings match.</div>
            <details open style="border-top: 1px solid var(--dd-line-soft); padding-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: var(--dd-muted);">Lighting</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: var(--dd-muted);">
                    <div>Ambient Darkness: <span id="dd-map-dark-val" style="color: var(--dd-text);">${Math.round(ambient.darkness * 100)}%</span>
                        <input type="range" id="dd-map-dark" min="0" max="1" step="0.05" value="${ambient.darkness}" style="width: 100%;" /></div>
                    <div>Ambient Color <input type="color" id="dd-map-color" value="${escapeHtml(ambient.color)}" style="width: 100%; height: 22px; background: var(--dd-field); border: 1px solid var(--dd-line);" /></div>
                    <div>Only while switch # is ON (0 = always)
                        <input type="number" id="dd-map-switch" min="0" value="${Number(ambient.switchId) || 0}" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;" /></div>
                    <label style="display: flex; align-items: center; gap: 6px; color: var(--dd-text); font-size: 11px;">
                        <input type="checkbox" id="dd-map-preview" ${this.lightingPreview === false ? '' : 'checked'} /> Preview lighting while editing</label>
                    <div>Day and night on this map
                        <select id="dd-map-daynight" style="width: 100%; background: var(--dd-field); color: var(--dd-text); border: 1px solid var(--dd-line); padding: 2px 4px;">
                            ${DocsDoodads.TimeOfDay.mapModes.map(m => `<option value="${m.value}" ${(mapSettings.dayNight || 'auto') === m.value ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('')}
                        </select></div>
                    <label style="display: flex; align-items: center; gap: 6px; color: var(--dd-text); font-size: 11px;">
                        <input type="checkbox" id="dd-map-reflections" ${mapSettings.reflections === false ? '' : 'checked'} /> Water reflections on this map</label>
                    <label style="display: flex; align-items: center; gap: 6px; color: var(--dd-text); font-size: 11px;">
                        <input type="checkbox" id="dd-map-charshadows" ${mapSettings.characterShadows === false ? '' : 'checked'} /> Character shadows on this map</label>
                    <div style="color: var(--dd-faint); line-height: 1.4;">Give doodads a Light in their details. The "Set Ambient Light" plugin command changes darkness during play.</div>
                </div>
            </details>
            ${this.renderPerspectivePanel()}
            ${this.renderTerrainPanel()}
            ${this.renderMapSoundPanel(mapSettings)}
            ${this.renderLayersPanel(mapSettings)}
            ${this.mapSections.map(section => section.render.call(this, mapSettings)).join('')}
            ${this.renderWorldSections()}
            ${this.renderMapNavigation()}
            ${this.renderPackingPanel()}
            ${this.doodadFilesDatalist()}`;

        const search = document.getElementById('dd-map-search');
        if (search && content.querySelectorAll) {
            search.oninput = () => { this._mapSearch = search.value; this.applyMapSearch(content); };
            this.applyMapSearch(content);
        }
        const read = () => ({
            darkness: parseFloat(document.getElementById('dd-map-dark').value) || 0,
            color: document.getElementById('dd-map-color').value || ambient.color,
            switchId: Math.max(0, parseInt(document.getElementById('dd-map-switch').value, 10) || 0)
        });
        let previewBefore;
        const darkInput = document.getElementById('dd-map-dark');
        darkInput.oninput = () => {
            if (previewBefore === undefined) {
                const current = DocsDoodads.Lighting.mapSettings(mapId);
                previewBefore = current ? JSON.parse(JSON.stringify(current)) : null;
            }
            DocsDoodads.Lighting.setMapSettings(mapId, { ambient: read() });
            const label = document.getElementById('dd-map-dark-val');
            if (label) label.textContent = Math.round(read().darkness * 100) + '%';
        };
        darkInput.onchange = () => {
            this.setMapAmbient(read(), previewBefore);
            previewBefore = undefined;
        };
        document.getElementById('dd-map-color').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-switch').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-preview').onchange = (e) => { this.lightingPreview = Boolean(e.target.checked); };
        document.getElementById('dd-map-daynight').onchange = (e) => this.setMapSetting('dayNight', e.target.value === 'auto' ? undefined : e.target.value);
        document.getElementById('dd-map-reflections').onchange = (e) => this.setMapSetting('reflections', e.target.checked ? undefined : false);
        document.getElementById('dd-map-charshadows').onchange = (e) => this.setMapSetting('characterShadows', e.target.checked ? undefined : false);
        this.bindClockBar();
        this.bindPerspectivePanel();
        this.bindTerrainPanel();
        this.bindMapSoundPanel(mapSettings);
        this.bindLayersPanel(mapSettings);
        this.mapSections.forEach(section => { if (section.bind) section.bind.call(this, mapSettings); });
        this.bindWorldSections();
        this.bindMapNavigation();
        this.bindPackingPanel();
    },

