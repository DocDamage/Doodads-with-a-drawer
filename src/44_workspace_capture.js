//==========================================================
// SECTION 25i: WORKSPACE CAPTURE AND QUICK MENU
//==========================================================
// Capture saves a picture of the map as it is on screen (without the editor's outlines), or a short GIF
// of the 3D camera turning round, into screenshots/. The right-click menu learns which actions are used
// most and offers up to eight of them in a row at its top.
DocsDoodads.Ui.css += `
#dd-capture-card { position: fixed; top: 90px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 300px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; }
#dd-capture-card .dd-btn { justify-content: flex-start; }
#dd-capture-card .dd-capture-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
#dd-context-menu .dd-quick-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; padding: 2px; max-width: 280px; }
#dd-context-menu .dd-quick-row .dd-btn { flex-direction: column; gap: 2px; height: 48px; padding: 3px 2px; font-size: 10px; line-height: 1.1; white-space: normal; text-align: center; justify-content: center; background: var(--dd-panel-2); border-radius: 10px; }
`;

Object.assign(DocsDoodads.Workspace, {
    // ---- Capture ----
    // The map as drawn, into a canvas the size of the game screen (the editor's outlines left out).
    renderSceneCanvas() {
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        const spriteset = scene && scene._spriteset;
        const renderer = this.renderer();
        if (!spriteset || !renderer || typeof PIXI === 'undefined' || !PIXI.RenderTexture || !renderer.extract) return null;
        const outline = spriteset._docsSelectionOutline;
        const wasVisible = outline ? outline.visible : null;
        if (outline) outline.visible = false;
        const rt = PIXI.RenderTexture.create({ width: Graphics.width, height: Graphics.height });
        try {
            renderer.render(spriteset, rt);
            return renderer.extract.canvas(rt);
        } finally {
            rt.destroy(true);
            if (outline) outline.visible = wasVisible;
        }
    },

    captureName(kind, ext) {
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
        return `${kind}_Map${String(this.currentMapId()).padStart(3, '0')}_${stamp}.${ext}`;
    },

    // bytes: a Buffer or Uint8Array. Returns the path written.
    saveCapture(name, bytes) {
        const FS = DocsDoodads.FS;
        FS.mkdirp('screenshots');
        const out = 'screenshots/' + name;
        FS.fs.writeFileSync(out, typeof Buffer !== 'undefined' && !Buffer.isBuffer(bytes) ? Buffer.from(bytes) : bytes);
        try { if (typeof nw !== 'undefined' && nw.Shell && FS.path) nw.Shell.showItemInFolder(FS.path.resolve(out)); } catch (e) {}
        return out;
    },

    capturePicture() {
        if (!DocsDoodads.FS.fs) { this.showToast('Capture needs the desktop playtest.', 'error'); return null; }
        const canvas = this.renderSceneCanvas();
        if (!canvas) { this.showToast('Open a map to capture it.', 'error'); return null; }
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        const out = this.saveCapture(this.captureName('view', 'png'), Buffer.from(base64, 'base64'));
        this.showToast(`Saved a picture of the view: ${out}`, 'success');
        return out;
    },

    // A canvas's pixels at a given width (keeping its shape), for a GIF frame.
    framePixels(canvas, width) {
        const scale = Math.min(1, width / canvas.width);
        const w = Math.max(1, Math.round(canvas.width * scale)), h = Math.max(1, Math.round(canvas.height * scale));
        const small = document.createElement('canvas');
        small.width = w;
        small.height = h;
        const ctx = small.getContext('2d');
        ctx.drawImage(canvas, 0, 0, w, h);
        return { width: w, height: h, rgba: ctx.getImageData(0, 0, w, h).data };
    },

    nextFrame() {
        return new Promise(resolve => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => resolve()) : setTimeout(resolve, 16)));
    },

    // The 3D camera turns once round; one picture per step, then the camera goes back.
    async captureOrbitGif(options = {}) {
        const P = DocsDoodads.Perspective;
        if (!DocsDoodads.FS.fs) { this.showToast('Capture needs the desktop playtest.', 'error'); return null; }
        if (!P.liveCamera || !P.liveCamera()) { this.showToast('Turn on the 3D view (map panel) to make an orbit.', 'info'); return null; }
        const count = Math.max(4, Math.min(72, Math.round(Number(options.frames) || 24)));
        const width = Math.max(120, Math.min(1280, Math.round(Number(options.width) || 480)));
        const before = $gameMap._docsCamera ? Object.assign({}, $gameMap._docsCamera) : null;
        const start = (P.active() || {}).yaw || 0;
        const pill = DocsDoodads.Ui.progress('Making the orbit GIF', { onCancel: () => {} });
        const frames = [];
        try {
            for (let i = 0; i < count && !pill.cancelled; i++) {
                pill.update(i, count);
                this.setCameraView({ yaw: (start + i * 360 / count) % 360 });
                await this.nextFrame();
                await this.nextFrame();
                const canvas = this.renderSceneCanvas();
                if (!canvas) break;
                frames.push(this.framePixels(canvas, width));
            }
        } finally {
            this.setCameraView(before);
            pill.finish();
        }
        if (pill.cancelled) { this.showToast('Orbit cancelled; nothing was saved.', 'info'); return null; }
        if (!frames.length) { this.showToast('Nothing could be captured.', 'error'); return null; }
        // One turn takes about four seconds (a frame is at least 4 hundredths).
        const gif = DocsDoodads.Gif.encode(frames, { delay: Math.max(4, Math.round(400 / count)) });
        const out = this.saveCapture(this.captureName('orbit', 'gif'), gif);
        this.showToast(`Saved a ${frames.length}-frame orbit: ${out}`, 'success');
        return out;
    },

    showCaptureCard() {
        if (typeof document === 'undefined') return null;
        const U = DocsDoodads.Ui;
        this.closeCaptureCard();
        const card = document.createElement('div');
        card.id = 'dd-capture-card';
        card.className = 'dd-glass';
        const in3d = DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera();
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('picture', 1)} Capture</span>
                <button class="dd-btn dd-fold" id="dd-capture-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <button class="dd-btn dd-btn-primary" id="dd-capture-png" type="button">${U.icon('picture', 1)} Save a Picture of the View (PNG)</button>
            <div class="dd-capture-row">
                <label>Frames<select id="dd-capture-frames"><option value="12">12</option><option value="24" selected>24</option><option value="36">36</option></select></label>
                <label>Width<select id="dd-capture-width"><option value="320">320 px</option><option value="480" selected>480 px</option><option value="640">640 px</option></select></label>
            </div>
            <button class="dd-btn" id="dd-capture-gif" type="button"${in3d ? '' : ' disabled title="Turn on the 3D view first"'}>${U.icon('sparkle', 1)} Orbit GIF (3D)</button>
            <div style="color: var(--dd-faint); line-height: 1.4;">Saved in the project's screenshots folder. The editor's outlines are left out.</div>`;
        document.body.appendChild(card);
        const byId = id => document.getElementById(id);
        if (byId('dd-capture-close')) byId('dd-capture-close').onclick = () => this.closeCaptureCard();
        if (byId('dd-capture-png')) byId('dd-capture-png').onclick = () => { this.closeCaptureCard(); this.capturePicture(); };
        if (byId('dd-capture-gif')) byId('dd-capture-gif').onclick = () => {
            const frames = byId('dd-capture-frames') ? byId('dd-capture-frames').value : 24;
            const width = byId('dd-capture-width') ? byId('dd-capture-width').value : 480;
            this.closeCaptureCard();
            return this.captureOrbitGif({ frames, width });
        };
        return card;
    },

    closeCaptureCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-capture-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },

    // ---- Quick menu: the right-click actions used most ----
    menuKey(label) {
        return String(label || '').replace(/\([^)]*\)/g, '').replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
    },

    noteMenuUse(label) {
        const key = this.menuKey(label);
        if (!key) return;
        const U = DocsDoodads.Ui;
        const counts = Object.assign({}, U.prefs().menuUse || {});
        counts[key] = (counts[key] || 0) + 1;
        // Remembers the 60 most used.
        const keep = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 60);
        U.setPref('menuUse', Object.fromEntries(keep));
    },

    // Up to eight of the offered actions that were used at least twice, most used first; only for
    // menus long enough to be worth a shortcut row.
    quickMenuItems(items) {
        const counts = DocsDoodads.Ui.prefs().menuUse || {};
        const actions = (items || []).filter(i => i && !i.separator && i.onClick);
        if (actions.length < 6) return [];
        const quick = actions.map(i => ({ i, n: counts[this.menuKey(i.label)] || 0 })).filter(x => x.n >= 2)
            .sort((a, b) => b.n - a.n).slice(0, 8).map(x => x.i);
        return quick.length >= 2 ? quick : [];
    }
});
