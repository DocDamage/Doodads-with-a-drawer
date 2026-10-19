//==========================================================
// SECTION 25r: LPC CHARACTER LIBRARY (CARD, SCAN, CREDITS)
//==========================================================
// More > Characters: where the LPC library is on this computer, a scan of its parts into the editor's
// cache, whether this project uses only art that is safe to encrypt, and the credits of images made from
// it (data/DocsDoodadsCredits.json, written out as CREDITS_LPC.txt beside the game). The folder is kept per
// computer and should be outside the project: MZ's Deployment copies everything in the project folder.
// Problems (44_workspace_map_check.js) lists images that can't be encrypted and credits that need writing out.
DocsDoodads.Ui.css += `
#dd-lpc-card { position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 10045; width: 440px; max-width: calc(100vw - 32px); max-height: calc(100vh - 110px); padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; font-size: 11px; }
#dd-lpc-card .dd-lpc-row { display: flex; gap: 6px; align-items: center; }
#dd-lpc-card .dd-lpc-row input[type=text] { flex: 1; min-width: 0; }
#dd-lpc-card .dd-lpc-group { font-size: 11px; font-weight: 900; color: var(--dd-muted); margin-top: 4px; }
#dd-lpc-card .dd-lpc-box { background: var(--dd-panel-2); border-radius: 12px; padding: 8px 10px; line-height: 1.5; color: var(--dd-text); }
#dd-lpc-card .dd-lpc-warn { background: var(--dd-warn-soft); border-radius: 12px; padding: 8px 10px; line-height: 1.45; color: var(--dd-text); }
#dd-lpc-card .dd-lpc-note { font-size: 10px; color: var(--dd-faint); line-height: 1.4; }
#dd-lpc-card label { display: flex; align-items: center; gap: 6px; }
`;

Object.assign(DocsDoodads.Workspace, {
    _lpcIndex: undefined,

    lpcLibraryFolder() {
        const v = DocsDoodads.Ui.prefs().lpcLibrary;
        return typeof v === 'string' ? v : '';
    },

    setLpcLibraryFolder(folder) {
        const clean = String(folder || '').trim();
        DocsDoodads.Ui.setPref('lpcLibrary', clean || undefined);
        return clean;
    },

    lpcSafeOnly() {
        return DocsDoodads.World.get('lpc.safeOnly') !== false;
    },

    setLpcSafeOnly(on) {
        DocsDoodads.World.set('lpc.safeOnly', on ? undefined : false);
    },

    // The saved index (cached after the first read), or null.
    lpcIndex() {
        if (this._lpcIndex === undefined) {
            const D = DocsDoodads;
            let data = null;
            try { data = D.FS.existsSync(D.Lpc.indexFile) ? D.FS.readJson(D.Lpc.indexFile) : null; } catch (e) { data = null; }
            this._lpcIndex = D.Lpc.validIndex(data);
        }
        return this._lpcIndex;
    },

    // Scans the library folder into the cache. Returns the index, or null (with a message) when it can't.
    scanLpcLibrary(folder = this.lpcLibraryFolder()) {
        const D = DocsDoodads, L = D.Lpc, FS = D.FS;
        if (!FS.fs || !FS.path) return null;
        if (!folder) { this.showToast('Choose the LPC library folder first.', 'info'); return null; }
        if (!L.isLibrary(FS.fs, FS.path, folder)) {
            this.showToast('That folder has no sheet_definitions and spritesheets folders. Choose the top folder of the LPC character generator.', 'error');
            return null;
        }
        const index = L.scan(FS.fs, FS.path, FS.path.resolve(folder));
        if (!index) return null;
        if (!FS.atomicWriteJson(L.indexFile, index, 0)) { this.showToast('Could not save the library index.', 'error'); return null; }
        this._lpcIndex = index;
        const s = L.summary(index, this.lpcSafeOnly());
        this.showToast(`Found ${s.parts} character parts (${s.safe} safe to encrypt)` + (s.skipped ? `; ${s.skipped} skipped` : '') + '.', 'success');
        return index;
    },

    // The library has moved on since the scan (another commit), or isn't where the scan found it.
    lpcIndexStale(index = this.lpcIndex()) {
        const D = DocsDoodads, FS = D.FS;
        if (!index || !FS.fs) return '';
        if (!D.Lpc.isLibrary(FS.fs, FS.path, index.library)) return 'missing';
        const now = D.Lpc.libraryCommit(FS.fs, FS.path, index.library);
        return now && index.commit && now !== index.commit ? 'changed' : '';
    },

    // ---- Credits ----

    lpcCredits() {
        const D = DocsDoodads;
        let data = null;
        try { data = D.FS.existsSync(D.Lpc.creditsFile) ? D.FS.readJson(D.Lpc.creditsFile) : null; } catch (e) { data = null; }
        return D.Lpc.validCredits(data);
    },

    lpcImageExists(image) {
        return DocsDoodads.FS.existsSync(String(image));
    },

    // For the exports (phase 4): records which library folders an image was made from.
    // used: [{ part, folder }] as the compositor drew them.
    recordLpcImage(image, used) {
        const D = DocsDoodads, L = D.Lpc;
        const data = L.recordImage(this.lpcCredits(), image, L.creditsForLayers(used));
        return D.FS.atomicWriteJson(L.creditsFile, data) ? data.images[image] : null;
    },

    // CREDITS_LPC.txt's state: 'none' (nothing made), 'missing', 'old' (credits changed since) or 'ok'.
    lpcCreditsTextState(data = this.lpcCredits()) {
        const D = DocsDoodads, L = D.Lpc, FS = D.FS;
        const want = L.creditsTextFor(data, img => this.lpcImageExists(img));
        if (!Object.keys(data.images).some(img => this.lpcImageExists(img))) return 'none';
        if (!FS.existsSync(L.creditsText)) return 'missing';
        let have = '';
        try { have = String(FS.readFileSync(L.creditsText, 'utf8')); } catch (e) { return 'missing'; }
        return have.replace(/\r\n/g, '\n') === want ? 'ok' : 'old';
    },

    writeLpcCreditsText() {
        const D = DocsDoodads, L = D.Lpc, FS = D.FS;
        try {
            FS.writeFileSync(L.creditsText, L.creditsTextFor(this.lpcCredits(), img => this.lpcImageExists(img)), 'utf8');
        } catch (e) {
            this.showToast('Could not write ' + L.creditsText + ': ' + (e.message || e), 'error');
            return false;
        }
        this.showToast('Wrote ' + L.creditsText + '. It goes into the game with the other files.', 'success');
        return true;
    },

    // Project-wide entries for Problems (no map to go to).
    lpcProblems() {
        const D = DocsDoodads, L = D.Lpc;
        const data = this.lpcCredits();
        const out = L.unsafeImages(data, img => this.lpcImageExists(img)).map(u => ({
            kind: 'lpcEncrypt', global: true,
            text: `${u.image.replace(/^img\/[^/]+\//, '')}: ` + (u.uncredited ? 'uses art with no credits; find its authors and licence before shipping.'
                : `its art is only offered under ${u.licences.join(', ')}. Leave "Encrypt image files" off when deploying, or remake it with only art that is safe to encrypt.`)
        }));
        const state = this.lpcCreditsTextState(data);
        if (state === 'missing' || state === 'old') {
            out.push({ kind: 'lpcCredits', global: true,
                text: state === 'missing' ? `${L.creditsText} hasn't been written: the artists of your LPC characters must be credited in the game.` : `${L.creditsText} is out of date with the characters made since.`,
                fix: { label: 'Write It', run: () => this.writeLpcCreditsText() } });
        }
        return out;
    },

    // ---- The card ----

    showLpcCard() {
        if (typeof document === 'undefined') return null;
        const D = DocsDoodads, U = D.Ui, L = D.Lpc, FS = D.FS;
        let card = document.getElementById('dd-lpc-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'dd-lpc-card';
            card.className = 'dd-glass';
            document.body.appendChild(card);
        }
        const folder = this.lpcLibraryFolder();
        const index = this.lpcIndex();
        const safeOnly = this.lpcSafeOnly();
        const s = index ? L.summary(index, safeOnly) : null;
        const stale = index ? this.lpcIndexStale(index) : '';
        const inside = folder && FS.path ? L.insideProject(FS.path, folder, '.') : false;
        const credits = this.lpcCredits();
        const images = Object.keys(credits.images).filter(img => this.lpcImageExists(img));
        const unsafe = L.unsafeImages(credits, img => this.lpcImageExists(img)).length;
        const textState = this.lpcCreditsTextState(credits);
        const day = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(); };
        const categories = s ? Object.entries(s.categories).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${escapeHtml(k)} ${n}`).join(' · ') : '';
        const skipped = index && index.skipped && index.skipped.length ? index.skipped : [];
        card.innerHTML = `
            <div class="dd-panel-head"><span class="dd-grow">${U.icon('person', 1)} Characters (LPC library)</span>
                <button class="dd-btn dd-fold" id="dd-lpc-close" type="button" title="Close">${U.icon('close', 1)}</button></div>
            <div class="dd-lpc-group">Library folder (on this computer)</div>
            <div class="dd-lpc-row">
                <input type="text" id="dd-lpc-folder" value="${escapeHtml(folder)}" placeholder="The Universal LPC Spritesheet Character Generator folder" aria-label="Library folder" />
                <button class="dd-btn" id="dd-lpc-choose" type="button" title="Pick the folder">${U.icon('folder', 1)} Choose...</button>
            </div>
            ${inside ? `<div class="dd-lpc-warn"><b>This folder is inside the project.</b> MZ's Deployment copies every file in the project folder into the game, so the whole library (over a gigabyte) would ship with it. Keep the library somewhere else.</div>` : ''}
            <div class="dd-lpc-row">
                <button class="dd-btn dd-btn-primary" id="dd-lpc-scan" type="button" title="Read the library's parts and colours">${index ? 'Scan Again' : 'Scan the Library'}</button>
                <span class="dd-lpc-note">Reads its parts, colours and credits. The library itself is never copied into the project.</span>
            </div>
            ${s ? `<div class="dd-lpc-box" id="dd-lpc-status">
                <b>${s.parts} parts</b>, ${s.safe} safe to encrypt · ${s.materials} colour set${s.materials === 1 ? "" : "s"}<br>
                Scanned ${escapeHtml(day(s.built))}${s.commit ? ' · version ' + escapeHtml(s.commit.slice(0, 7)) : ''}<br>
                <span style="color: var(--dd-muted);">${categories}</span>
                ${s.skipped ? `<br><span style="color: var(--dd-warn);">${s.skipped} skipped (a format this version doesn't know):</span> ${skipped.slice(0, 6).map(k => escapeHtml(k.id + ' (' + k.why + ')')).join(', ')}${skipped.length > 6 ? ', ...' : ''}` : ''}
                ${s.newFields.length ? `<br><span style="color: var(--dd-muted);">New fields in the library, not used yet: ${escapeHtml(s.newFields.join(', '))}</span>` : ''}
            </div>` : '<div class="dd-lpc-box" id="dd-lpc-status">Not scanned yet.</div>'}
            ${stale === 'changed' ? '<div class="dd-lpc-warn" id="dd-lpc-stale">The library has changed since it was scanned. Scan again to see what is new.</div>' : ''}
            ${stale === 'missing' ? `<div class="dd-lpc-warn" id="dd-lpc-stale">The library isn't at ${escapeHtml(index.library)} any more. Choose where it is now.</div>` : ''}
            <label title="On: the creator only offers parts whose art is offered under CC0 or OGA-BY, which allow encrypted games"><input type="checkbox" id="dd-lpc-safe" ${safeOnly ? 'checked' : ''} /> Only art that is safe to encrypt (CC0, OGA-BY)</label>
            <div class="dd-lpc-note">CC-BY and CC-BY-SA art may not be locked away, which MZ's "Encrypt image files" does. With this off you get every part${s ? ` (${s.parts} instead of ${s.safe})` : ''}, and must deploy without encrypting images that use them. This is a setting of the project.</div>
            <div class="dd-lpc-group">Credits</div>
            <div class="dd-lpc-box" id="dd-lpc-credits">
                ${images.length ? `${images.length} picture${images.length === 1 ? '' : 's'} made from the library${unsafe ? `, <b>${unsafe} can't be encrypted</b>` : ''}.<br>` : 'No pictures made from the library yet.<br>'}
                ${escapeHtml(L.creditsText)}: ${{ none: 'nothing to credit yet', missing: '<b>not written yet</b>', old: '<b>out of date</b>', ok: 'up to date' }[textState]}
            </div>
            <div class="dd-lpc-row">
                <button class="dd-btn" id="dd-lpc-credits-write" type="button" title="Write the artists, licences and links of every LPC picture into ${escapeHtml(L.creditsText)}, beside the game"${textState === 'none' ? ' disabled' : ''}>Write ${escapeHtml(L.creditsText)}</button>
            </div>
            <div class="dd-lpc-note">Every LPC artwork needs its artists credited in the game. Credits are kept per picture in ${escapeHtml(L.creditsFile)}; Problems says when ${escapeHtml(L.creditsText)} needs writing again.</div>`;
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        const field = document.getElementById('dd-lpc-folder');
        if (field) field.onchange = e => { this.setLpcLibraryFolder(e.target.value); this.refreshLpcCard(); };
        on('dd-lpc-close', () => this.closeLpcCard());
        on('dd-lpc-choose', () => this.pickLpcLibraryFolder());
        // A big library takes a second or so: say so first, then scan once the page has drawn it.
        on('dd-lpc-scan', () => {
            const typed = field ? field.value : folder;
            if (typed !== folder) this.setLpcLibraryFolder(typed);
            const button = document.getElementById('dd-lpc-scan');
            if (button) { button.disabled = true; button.textContent = 'Scanning...'; }
            return new Promise(resolve => setTimeout(() => {
                this.scanLpcLibrary(this.lpcLibraryFolder());
                this.refreshLpcCard();
                resolve();
            }, 30));
        });
        const safe = document.getElementById('dd-lpc-safe');
        if (safe) safe.onchange = e => { this.setLpcSafeOnly(Boolean(e.target.checked)); this.refreshLpcCard(); };
        on('dd-lpc-credits-write', () => { this.writeLpcCreditsText(); this.refreshLpcCard(); });
        return card;
    },

    // NW.js picks a folder with an <input type="file" nwdirectory>.
    pickLpcLibraryFolder() {
        if (typeof document === 'undefined') return false;
        const input = document.createElement('input');
        input.type = 'file';
        if (typeof input.setAttribute === 'function') input.setAttribute('nwdirectory', '');
        input.onchange = () => {
            const chosen = input.value || (input.files && input.files[0] && input.files[0].path) || '';
            if (!chosen) return;
            this.setLpcLibraryFolder(chosen);
            this.refreshLpcCard();
        };
        if (typeof input.click === 'function') input.click();
        return true;
    },

    refreshLpcCard() {
        if (typeof document !== 'undefined' && document.getElementById('dd-lpc-card')) this.showLpcCard();
    },

    closeLpcCard() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-lpc-card') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    }
});
