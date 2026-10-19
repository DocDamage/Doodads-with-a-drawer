//==========================================================
// SECTION 25h: WORKSPACE ONBOARDING (TOOL TOURS, SAMPLE ITEMS, WHAT'S NEW)
//==========================================================
// The first time each tool is picked, a short tour points at its options and the map. How to Use can
// replay them, add a few sample items to play with (pictures drawn here, two prefabs and a biome), and
// show what changed since the last version.
DocsDoodads.Ui.css += `
#dd-tour { position: absolute; z-index: 10041; width: 260px; padding: 11px 13px; display: flex; flex-direction: column; gap: 7px; font-size: 12px; font-weight: 700; color: var(--dd-text); animation: dd-rise 0.18s ease; }
#dd-tour .dd-tour-step { font-size: 10px; color: var(--dd-faint); font-weight: 800; }
#dd-tour .dd-tour-buttons { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
#dd-tour .dd-tour-off { margin-right: auto; border: none; background: transparent; color: var(--dd-faint); font: inherit; font-size: 10px; cursor: pointer; padding: 0; text-decoration: underline; }
#dd-welcome .dd-welcome-more { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 12px; }
#dd-welcome .dd-welcome-more .dd-btn { font-size: 11px; padding: 4px 9px; }
#dd-whats-new { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 400px; max-width: calc(100vw - 32px); max-height: 80vh; overflow-y: auto; padding: 16px 18px; z-index: 10040; }
#dd-whats-new h2 { margin: 4px 0 8px; font-size: 18px; font-weight: 900; color: var(--dd-text); }
#dd-whats-new ul { margin: 0 0 12px; padding-left: 18px; display: flex; flex-direction: column; gap: 5px; font-size: 12px; font-weight: 700; color: var(--dd-text); line-height: 1.4; }
`;

// Small pictures for the sample items, drawn as pixels (doubled to suit 48-pixel tiles).
DocsDoodads.SampleArt = {
    kinds: ['bush', 'flowers', 'rock', 'lamp'],

    canvas(w, h) {
        const rgba = new Uint8Array(w * h * 4);
        const set = (x, y, c) => {
            x = Math.round(x); y = Math.round(y);
            if (x < 0 || y < 0 || x >= w || y >= h || !c) return;
            const i = (y * w + x) * 4;
            rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = c[3] === undefined ? 255 : c[3];
        };
        const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : rgba[(y * w + x) * 4 + 3]);
        const ellipse = (cx, cy, rx, ry, colorAt) => {
            for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
                for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
                    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
                    if (dx * dx + dy * dy <= 1) set(x, y, colorAt(dx, dy));
                }
            }
        };
        const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
        // A dark edge round everything drawn, in the darkest colour given.
        const outline = c => {
            const edge = [];
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                if (get(x, y)) continue;
                if (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1)) edge.push([x, y]);
            }
            edge.forEach(([x, y]) => set(x, y, c));
        };
        return { w, h, rgba, set, ellipse, rect, outline };
    },

    // { width, height, rgba } at double size.
    draw(kind) {
        const art = this[kind] ? this[kind]() : null;
        if (!art) return null;
        const w = art.w * 2, h = art.h * 2, out = new Uint8Array(w * h * 4);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const s = ((y >> 1) * art.w + (x >> 1)) * 4, d = (y * w + x) * 4;
            out[d] = art.rgba[s]; out[d + 1] = art.rgba[s + 1]; out[d + 2] = art.rgba[s + 2]; out[d + 3] = art.rgba[s + 3];
        }
        return { width: w, height: h, rgba: out };
    },

    bush() {
        const c = this.canvas(24, 18);
        const shade = (dx, dy) => (dx + dy < -0.6 ? [128, 196, 92] : dx + dy < 0.4 ? [82, 156, 64] : [52, 112, 50]);
        c.ellipse(8, 11, 7, 6, shade);
        c.ellipse(16, 11, 7, 6, shade);
        c.ellipse(12, 7, 7, 6, shade);
        c.outline([30, 62, 34]);
        return c;
    },

    flowers() {
        const c = this.canvas(18, 12);
        const blade = [72, 150, 60], dark = [40, 96, 40];
        for (const [x, top] of [[2, 6], [5, 4], [8, 7], [11, 5], [14, 6], [16, 8]]) c.rect(x, top, x, 11, blade);
        const petals = [[[255, 140, 180], 3, 4], [[255, 230, 90], 9, 3], [[255, 255, 255], 14, 4], [[180, 140, 255], 6, 7]];
        for (const [color, x, y] of petals) {
            c.rect(x - 1, y, x + 1, y, color);
            c.rect(x, y - 1, x, y + 1, color);
            c.set(x, y, [255, 200, 60]);
        }
        c.outline(dark);
        return c;
    },

    rock() {
        const c = this.canvas(18, 12);
        c.ellipse(9, 7, 8, 5, (dx, dy) => (dy < -0.35 && dx < 0.3 ? [196, 196, 204] : dy < 0.3 ? [150, 150, 162] : [112, 112, 126]));
        c.set(6, 6, [112, 112, 126]); c.set(7, 7, [112, 112, 126]);
        c.outline([62, 60, 74]);
        return c;
    },

    lamp() {
        const c = this.canvas(12, 40);
        const post = [70, 66, 84], light = [255, 226, 130], frame = [44, 40, 56];
        c.rect(5, 12, 6, 37, post);
        c.rect(3, 37, 8, 39, frame);
        c.rect(3, 3, 8, 10, light);
        c.rect(2, 2, 9, 2, frame);
        c.rect(2, 11, 9, 11, frame);
        c.rect(5, 0, 6, 1, frame);
        c.set(4, 4, [255, 248, 210]); c.set(4, 5, [255, 248, 210]);
        c.outline(frame);
        return c;
    }
};

// What changed in this version, shown once after an update (and from How to Use).
// Shown once to people updating, after the welcome. Its id is the release (verify checks it matches the
// version), and its items are the head of CHANGELOG.md in a line each.
DocsDoodads.WhatsNew = {
    id: '2.0.0-alpha.1',
    title: 'New in this version',
    items: [
        'Character Creator: three libraries in one window, a grid of pictures, locks, undo and recipes.',
        'Big maps run faster: off-screen doodads wait, so 3,000 doodads hold 60 frames a second.',
        'The editor saves less and sooner: a compact library, the crash snapshot only when changed.',
        'Tab and the arrow keys move through the editor, and the right-click menu works with keys.',
        'Rebuild Index keeps your tags; packs ask before replacing; Show Hidden Doodads brings them back.',
        'Sound effects keep their own pitch and volume; turn on variation if you want it.',
        'Problems lists conditions that don\'t run, beside missing pictures and sounds.'
    ]
};

Object.assign(DocsDoodads.Workspace, {
    // ---- Tool tours ----
    // Steps: { at: an element id, 'map' or 'hint', text }.
    tours: {
        stamp: [
            { at: 'dd-drawer-panel', text: 'Stamp places the item picked in the Item Bag. Pick one here first.' },
            { at: 'map', text: 'Click the map to place it, again and again. Hold Alt to place it off the grid.' },
            { at: 'hint', text: 'Press Esc (or Select) when you are done stamping.' }
        ],
        brush: [
            { at: 'dd-brush-popover', text: 'Size, how many and the space between them. [ and ] change the size.' },
            { at: 'map', text: 'Drag over the map to sprinkle the picked item. Right-drag to erase it again.' }
        ],
        biome: [
            { at: 'dd-biome-popover', text: 'Pick a mix of plants. Make mixes in Details (with nothing picked), under Biomes.' },
            { at: 'map', text: 'Drag to paint the mix: thinner at the edge, in natural patches.' }
        ],
        path: [
            { at: 'dd-path-popover', text: 'Spacing, a bit of wobble, and end and corner pieces.' },
            { at: 'map', text: 'Click to add points. Double-click or Enter lays the items; Backspace takes the last point back.' }
        ],
        terrain: [
            { at: 'dd-terrain-popover', text: 'Raise, lower, flatten or set heights. A hard edge makes plateaus and steps.' },
            { at: 'map', text: 'Drag to shape the ground; the numbers are each tile\'s height. See the hills in the 3D view.' }
        ],
        eyedropper: [
            { at: 'map', text: 'Click a doodad (or Alt+click with any tool) to pick up what it is made of in the Item Bag.' }
        ],
        listen: [
            { at: 'map', text: 'Click a tile to hear what the player would hear standing there. Esc stops.' }
        ]
    },

    toursOn() {
        return DocsDoodads.Ui.prefs().toursOff !== true;
    },

    tourSeen(tool) {
        const seen = DocsDoodads.Ui.prefs().toursSeen;
        return Boolean(seen && seen[tool]);
    },

    // Called when a tool is picked: its tour, the first time.
    maybeStartTour(tool) {
        if (!tool || !this.tours[tool] || !this.toursOn() || this.tourSeen(tool)) return false;
        return this.startTour(tool);
    },

    startTour(tool) {
        if (!this.tours[tool]) return false;
        this._tour = { tool, step: 0 };
        const seen = Object.assign({}, DocsDoodads.Ui.prefs().toursSeen || {});
        seen[tool] = true;
        DocsDoodads.Ui.setPref('toursSeen', seen);
        this.renderTour();
        return true;
    },

    endTour() {
        this._tour = null;
        const el = typeof document !== 'undefined' ? document.getElementById('dd-tour') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
    },

    replayTours() {
        DocsDoodads.Ui.setPref('toursSeen', {});
        DocsDoodads.Ui.setPref('toursOff', false);
        this.showToast('Tool tours will show again the next time you pick each tool.', 'success');
    },

    renderTour() {
        const tour = this._tour;
        if (!tour || typeof document === 'undefined') return null;
        const steps = this.tours[tour.tool];
        const step = steps[tour.step];
        if (!step) { this.endTour(); return null; }
        let el = document.getElementById('dd-tour');
        if (!el) {
            el = document.createElement('div');
            el.id = 'dd-tour';
            el.className = 'dd-glass';
            (this.container || document.body).appendChild(el);
        }
        const last = tour.step === steps.length - 1;
        el.innerHTML = `
            <div class="dd-tour-step">${tour.step + 1} of ${steps.length}</div>
            <div id="dd-tour-text"></div>
            <div class="dd-tour-buttons">
                <button class="dd-tour-off" id="dd-tour-off" type="button">No more tours</button>
                <button class="dd-btn${last ? ' dd-btn-primary' : ''}" id="dd-tour-next" type="button">${last ? 'Got it' : 'Next'}</button>
            </div>`;
        const text = document.getElementById('dd-tour-text');
        if (text) text.textContent = step.text;
        const next = document.getElementById('dd-tour-next');
        if (next) next.onclick = () => { tour.step++; if (tour.step >= steps.length) this.endTour(); else this.renderTour(); };
        const off = document.getElementById('dd-tour-off');
        if (off) off.onclick = () => { DocsDoodads.Ui.setPref('toursOff', true); this.endTour(); };
        this.placeTour(el, step.at);
        return el;
    },

    // Next to what it is about: under an options card or the bag, over the map's middle, above the hint.
    placeTour(el, at) {
        if (!el || !el.style) return;
        const rect = id => { const n = document.getElementById(id); return n && n.getBoundingClientRect && n.style && n.style.display !== 'none' ? n.getBoundingClientRect() : null; };
        const room = this.roomSize ? this.roomSize() : { w: 816, h: 624 };
        const area = this.mapArea ? this.mapArea() : { left: 8, right: room.w - 8 };
        const mapLeft = area.left, mapRight = area.right;
        let left, top;
        if (at === 'map') {
            left = (mapLeft + mapRight) / 2 - 130;
            top = room.h * 0.4;
        } else if (at === 'hint') {
            const hint = rect('dd-hint');
            left = (mapLeft + mapRight) / 2 - 130;
            top = hint ? hint.top - 120 : room.h - 180;
        } else {
            const r = rect(at);
            if (r && at === 'dd-drawer-panel') { left = r.right + 10; top = r.top + 60; }
            else if (r) { left = r.left; top = r.bottom + 10; }
            else { left = (mapLeft + mapRight) / 2 - 130; top = room.h * 0.4; }
        }
        el.style.left = Math.round(Math.max(8, Math.min(room.w - 268, left))) + 'px';
        el.style.top = Math.round(Math.max(8, Math.min(room.h - 140, top))) + 'px';
    },

    // ---- Sample items ----
    samplePath(kind) {
        return `img/doodads/samples/sample_${kind}.png`;
    },

    // Writes the sample pictures (keeping any already there), adds them to the Item Bag, and adds the
    // Sample Garden and Sample Lamp Post prefabs and the Sample Meadow biome, unless they exist.
    async addSampleContent() {
        const FS = DocsDoodads.FS;
        if (!FS.fs || typeof require === 'undefined') {
            this.showToast('Sample items need the desktop playtest.', 'error');
            return null;
        }
        const zlib = require('zlib');
        const A = DocsDoodads.AsepriteSheets;
        const AI = DocsDoodads.AssetIndex;
        FS.mkdirp('img/doodads/samples');
        const assets = {};
        let drawn = 0;
        for (const kind of DocsDoodads.SampleArt.kinds) {
            const path = this.samplePath(kind);
            if (!FS.existsSync(path)) {
                const art = DocsDoodads.SampleArt.draw(kind);
                FS.fs.writeFileSync(path, A.encodePng(art.width, art.height, art.rgba, data => zlib.deflateSync(data)));
                drawn++;
            }
            AI.indexFile(path, path.split('/').pop(), '.png', path);
            assets[kind] = AI.data.assets[path.toLowerCase()];
        }
        AI.rebuildList();
        AI.save();
        const P = DocsDoodads.Prefabs;
        const has = name => P.ensureLoaded().some(p => p.name === name);
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const piece = (kind, x, y, more) => Object.assign(this.newDoodadFromAsset(assets[kind], x, y), more || {});
        let prefabs = 0;
        if (!has('Sample Garden')) {
            const items = [piece('flowers', 200, 300), piece('bush', 240, 300), piece('rock', 280, 302), piece('flowers', 300, 296)];
            items.forEach(d => { delete d.uid; delete d.layer; });
            P.add(P.capture('Sample Garden', items, [], { tileWidth: tw, tileHeight: th }));
            prefabs++;
        }
        if (!has('Sample Lamp Post')) {
            const lamp = piece('lamp', 240, 300, { light: Object.assign({}, DocsDoodads.Lighting.lightDefaults, { enabled: true, when: 'dark', radius: 168, flicker: 0.1, offsetY: -66 }) });
            delete lamp.uid; delete lamp.layer;
            P.add(P.capture('Sample Lamp Post', [lamp], [], { tileWidth: tw, tileHeight: th }));
            prefabs++;
        }
        if (prefabs) P.save();
        let biome = (DocsDoodads.World.get('biomes.list') || []).find(b => b.name === 'Sample Meadow');
        if (!biome) {
            const id = this.newBiome('Sample Meadow');
            this.editBiome(id, b => {
                b.entries = [
                    { path: this.samplePath('flowers'), weight: 5, scaleMin: 0.8, scaleMax: 1.1 },
                    { path: this.samplePath('bush'), weight: 2, scaleMin: 0.8, scaleMax: 1.2 },
                    { path: this.samplePath('rock'), weight: 1, scaleMin: 0.7, scaleMax: 1 }
                ];
            });
            biome = { id };
        }
        this.biomeSettings.biomeId = biome.id;
        this.refreshDrawerCards();
        this.showToast(`Sample items ready: ${drawn ? drawn + ' new picture(s), ' : ''}look in Prefabs, and paint the Sample Meadow biome.`, 'success');
        return { drawn, prefabs, biome: biome.id };
    },

    // ---- What's New ----
    maybeShowWhatsNew() {
        const prefs = DocsDoodads.Ui.prefs();
        if (!prefs.welcomed || prefs.whatsNewSeen === DocsDoodads.WhatsNew.id) return false;
        this.showWhatsNew();
        return true;
    },

    showWhatsNew() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui, W = DocsDoodads.WhatsNew;
        const old = document.getElementById('dd-whats-new');
        if (old && old.parentNode) old.parentNode.removeChild(old);
        const card = document.createElement('div');
        card.id = 'dd-whats-new';
        card.className = 'dd-glass';
        card.innerHTML = `${U.icon('sparkle', 2)}<h2>${escapeHtml(W.title)}</h2>
            <ul>${W.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
                <button class="dd-btn" id="dd-whats-new-tours" type="button">Replay Tool Tours</button>
                <button class="dd-btn dd-btn-primary" id="dd-whats-new-ok" type="button">Nice!</button>
            </div>`;
        (this.container || document.body).appendChild(card);
        const close = () => { U.setPref('whatsNewSeen', W.id); if (card.parentNode) card.parentNode.removeChild(card); };
        const ok = document.getElementById('dd-whats-new-ok');
        if (ok) ok.onclick = () => { U.sound('ok'); close(); };
        const tours = document.getElementById('dd-whats-new-tours');
        if (tours) tours.onclick = () => { close(); this.replayTours(); };
        return card;
    }
});
