//==========================================================
// SECTION 25s: LPC CHARACTER CREATOR (THE WINDOW)
//==========================================================
// More > Characters > Open the Creator: build a character from the LPC library in a bright, rounded window
// (the mockup in docs/LPC_CHARACTER_CREATOR_PLAN.md). Body and face on the left, outfit on the right, each
// in tabs of ◀ value ▶ pickers with a colour swatch; the character on a stage in the middle, turned and
// played in any animation; dice for a new body or outfit; saved characters by name. Keyboard: ↑ ↓ pick a
// row, ← → change it (Shift: its colour), Q / E change tab, Tab the other card, X / Y the dice, Esc closes.
// A gamepad does the same: d-pad, A colour, LB / RB tabs, Back the other card, X / Y dice, Start saves, B
// closes. The slots and recipes are in 23_lpc_slots.js; drawing is the compositor's.
DocsDoodads.Ui.css += `
#dd-creator { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10050; display: flex; align-items: center; justify-content: center; background: rgba(40, 30, 60, 0.45); }
#dd-creator .dd-cr { width: 1160px; max-width: calc(100vw - 24px); height: 740px; max-height: calc(100vh - 24px); box-sizing: border-box; padding: 18px 22px;
    font-family: var(--dd-font); color: #3a2e4d; background-color: #fff6e2; background-image: radial-gradient(#f3dfb1 2px, transparent 2px); background-size: 26px 26px;
    border-radius: 28px; border: 4px solid #f0e2c0; box-shadow: 0 10px 0 #e3cf9f, 0 24px 60px rgba(30, 20, 50, 0.45); display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
#dd-creator button { font-family: inherit; cursor: pointer; transition: transform 0.08s ease, box-shadow 0.08s ease; }
#dd-creator button:active { transform: translateY(3px); }
#dd-creator button:disabled { opacity: 0.45; cursor: default; transform: none; }
#dd-creator button:focus-visible, #dd-creator input:focus-visible { outline: 4px solid #ffc93c; outline-offset: 1px; }
#dd-creator .dd-cr-top, #dd-creator .dd-cr-bottom { display: flex; align-items: center; gap: 12px; }
#dd-creator .dd-cr-title { display: flex; align-items: center; gap: 8px; background: #19b6a4; color: #fffaf0; border-radius: 999px; padding: 6px 20px 6px 12px; box-shadow: 0 5px 0 #0f8a7c; font-size: 22px; font-weight: 900; }
#dd-creator .dd-cr-lib { font-size: 13px; font-weight: 800; color: #7a6b8f; }
#dd-creator .dd-cr-grow { flex: 1; }
#dd-creator .dd-cr-chip { display: flex; align-items: center; gap: 8px; border: 3px solid #e8d6ab; background: #fffaf0; border-radius: 999px; padding: 6px 14px; font-weight: 800; font-size: 13px; color: #3a2e4d; box-shadow: 0 4px 0 #e8d6ab; }
#dd-creator .dd-cr-chip input[type=checkbox] { width: 18px; height: 18px; accent-color: #19b6a4; }
#dd-creator .dd-cr-close { width: 44px; height: 44px; border-radius: 50%; border: none; background: #ff7a59; color: #fffaf0; font-size: 20px; font-weight: 900; box-shadow: 0 4px 0 #d4502f; }
#dd-creator .dd-cr-main { flex: 1; min-height: 0; display: grid; grid-template-columns: 350px minmax(0, 1fr) 350px; gap: 16px; }
#dd-creator .dd-cr-card { background: #fffaf0; border-radius: 26px; border: 3px solid #f0e2c0; box-shadow: 0 8px 0 #ecd9ad; padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
#dd-creator .dd-cr-card.dd-cr-here { border-color: #ffc93c; }
#dd-creator .dd-cr-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
#dd-creator .dd-cr-tab { border: none; border-radius: 16px; padding: 8px 4px 6px; background: #f6efe0; color: #5b4c70; font-weight: 900; font-size: 14px; box-shadow: 0 4px 0 #e3d2a8; }
#dd-creator .dd-cr-tab[aria-selected="true"] { background: #0b8174; color: #fffaf0; box-shadow: 0 4px 0 #075f55; }
#dd-creator .dd-cr-rows { display: flex; flex-direction: column; gap: 7px; overflow-y: auto; padding: 3px; }
#dd-creator .dd-cr-row { display: grid; grid-template-columns: 84px 32px minmax(0, 1fr) 32px 36px; align-items: center; gap: 5px; border-radius: 16px; padding: 2px; }
#dd-creator .dd-cr-row.dd-cr-cursor { background: #fff1c2; box-shadow: 0 0 0 3px #ffc93c; }
#dd-creator .dd-cr-row.dd-cr-off { opacity: 0.45; }
#dd-creator .dd-cr-label { font-weight: 900; font-size: 13px; text-align: right; color: #5b4c70; }
#dd-creator .dd-cr-arrow { width: 32px; height: 32px; border: none; border-radius: 50%; background: #ffc93c; color: #5a3d00; font-weight: 900; font-size: 13px; box-shadow: 0 3px 0 #d9a21c; padding: 0; }
#dd-creator .dd-cr-value { height: 32px; border-radius: 999px; background: #f6efe0; border: 2px solid #ead8b0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; padding: 0 8px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
#dd-creator .dd-cr-value span { overflow: hidden; text-overflow: ellipsis; }
#dd-creator .dd-cr-swatch { width: 32px; height: 32px; border-radius: 11px; border: 3px solid #fffaf0; box-shadow: 0 0 0 2px #ead8b0; padding: 0; }
#dd-creator .dd-cr-stagecol { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
#dd-creator .dd-cr-stage { flex: 1; min-height: 0; background: #d9f4ef; border-radius: 30px; border: 3px solid #b9e8df; box-shadow: 0 8px 0 #a6dcd2; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
#dd-creator .dd-cr-name { position: absolute; z-index: 1; top: 16px; left: 70px; right: 70px; text-align: center; border: none; background: transparent; font-family: inherit; font-weight: 900; font-size: 20px; color: #0f6f64; }
#dd-creator .dd-cr-dice { position: absolute; z-index: 1; top: 12px; width: 46px; height: 46px; border: none; border-radius: 14px; background: #fffaf0; box-shadow: 0 4px 0 #a6dcd2; font-size: 22px; font-weight: 900; color: #3a2e4d; }
#dd-creator .dd-cr-figure { position: relative; width: 256px; height: 280px; display: flex; align-items: flex-end; justify-content: center; }
#dd-creator .dd-cr-shadow { position: absolute; bottom: 22px; width: 120px; height: 26px; border-radius: 50%; background: rgba(15, 111, 100, 0.25); }
#dd-creator canvas.dd-cr-canvas { position: relative; width: 256px; height: 256px; image-rendering: pixelated; }
#dd-creator .dd-cr-turn { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; margin-top: 4px; font-weight: 900; color: #0f6f64; }
#dd-creator .dd-cr-turn button { width: 42px; height: 42px; border: none; border-radius: 50%; background: #0b8174; color: #fffaf0; font-size: 18px; font-weight: 900; box-shadow: 0 4px 0 #075f55; }
#dd-creator .dd-cr-anims { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
#dd-creator .dd-cr-anim { border: none; border-radius: 999px; padding: 5px 12px; background: #fffaf0; color: #3a2e4d; font-weight: 800; font-size: 12px; box-shadow: 0 3px 0 #e3d2a8; }
#dd-creator .dd-cr-anim[aria-pressed="true"] { background: #3a2e4d; color: #fffaf0; box-shadow: 0 3px 0 #1e1729; }
#dd-creator .dd-cr-toggles { display: flex; justify-content: center; gap: 16px; font-weight: 800; font-size: 12px; color: #5b4c70; }
#dd-creator .dd-cr-toggles label { display: flex; align-items: center; gap: 5px; }
#dd-creator .dd-cr-toggles input { width: 16px; height: 16px; accent-color: #19b6a4; }
#dd-creator .dd-cr-warn { font-size: 11px; font-weight: 700; color: #9a6a00; text-align: center; min-height: 14px; }
#dd-creator .dd-cr-btn { border: 3px solid #e8d6ab; background: #fffaf0; border-radius: 999px; padding: 9px 22px; font-weight: 900; font-size: 15px; color: #3a2e4d; box-shadow: 0 5px 0 #e8d6ab; }
#dd-creator .dd-cr-export { border: none; background: #c8472c; color: #fffaf0; border-radius: 999px; padding: 11px 26px; font-weight: 900; font-size: 17px; box-shadow: 0 6px 0 #9e3218; }
#dd-creator .dd-cr-pop { position: absolute; z-index: 2; background: #fffaf0; border: 3px solid #f0e2c0; border-radius: 20px; box-shadow: 0 6px 0 #ecd9ad, 0 14px 30px rgba(58, 46, 77, 0.3); padding: 10px; }
#dd-creator .dd-cr-palette { display: grid; grid-template-columns: repeat(6, 30px); gap: 6px; max-height: 260px; overflow-y: auto; }
#dd-creator .dd-cr-palette button { width: 30px; height: 30px; border-radius: 10px; border: 3px solid #fffaf0; box-shadow: 0 0 0 2px #ead8b0; padding: 0; }
#dd-creator .dd-cr-palette button[aria-pressed="true"] { box-shadow: 0 0 0 3px #3a2e4d; }
#dd-creator .dd-cr-list { display: flex; flex-direction: column; gap: 4px; min-width: 260px; max-height: 300px; overflow-y: auto; font-size: 12px; }
#dd-creator .dd-cr-list .dd-cr-item { display: flex; align-items: center; gap: 6px; }
#dd-creator .dd-cr-list .dd-cr-item span { flex: 1; font-weight: 800; }
#dd-creator .dd-cr-list button { border: 2px solid #e8d6ab; background: #fffaf0; border-radius: 999px; padding: 3px 10px; font-weight: 800; font-size: 11px; color: #3a2e4d; }
#dd-creator .dd-cr-credits { max-width: 420px; max-height: 320px; overflow-y: auto; font-size: 11px; line-height: 1.45; }
:root.dd-less-motion #dd-creator button { transition: none; }
#dd-creator .dd-cr-switch { display: none; }
#dd-creator .dd-cr.dd-cr-narrow { padding: 12px 14px; gap: 10px; }
#dd-creator .dd-cr-narrow .dd-cr-title { font-size: 17px; padding: 4px 14px 4px 8px; white-space: nowrap; }
#dd-creator .dd-cr-narrow .dd-cr-lib, #dd-creator .dd-cr-narrow .dd-cr-keys { display: none; }
#dd-creator .dd-cr-narrow .dd-cr-main { grid-template-columns: minmax(0, 1fr) 290px; gap: 12px; }
#dd-creator .dd-cr-narrow .dd-cr-card.dd-cr-hidden { display: none; }
#dd-creator .dd-cr-narrow .dd-cr-switch { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
#dd-creator .dd-cr-switch button { border: none; border-radius: 14px; padding: 6px; background: #f6efe0; color: #5b4c70; font-weight: 900; font-size: 14px; box-shadow: 0 4px 0 #e3d2a8; }
#dd-creator .dd-cr-switch button[aria-pressed="true"] { background: #ffc93c; color: #5a3d00; box-shadow: 0 4px 0 #d9a21c; }
#dd-creator .dd-cr-narrow .dd-cr-figure { width: 192px; height: 206px; }
#dd-creator .dd-cr-narrow canvas.dd-cr-canvas { width: 192px; height: 192px; }
#dd-creator .dd-cr-narrow .dd-cr-shadow { width: 90px; height: 20px; bottom: 16px; }
#dd-creator .dd-cr-narrow .dd-cr-name { top: 20px; left: 62px; right: 62px; font-size: 15px; }
#dd-creator .dd-cr-narrow .dd-cr-anims { gap: 4px; }
#dd-creator .dd-cr-narrow .dd-cr-anim { padding: 4px 9px; font-size: 11px; }
#dd-creator .dd-cr-narrow .dd-cr-btn { padding: 7px 16px; font-size: 14px; }
#dd-creator .dd-cr-narrow .dd-cr-export { padding: 9px 18px; font-size: 15px; }
#dd-creator .dd-cr-narrow .dd-cr-toggles { gap: 8px; flex-wrap: wrap; }
`;

Object.assign(DocsDoodads.Workspace, {
    _creator: null,

    creatorAnimations: [['walk', 'Walk'], ['idle', 'Idle'], ['run', 'Run'], ['slash', 'Slash'], ['thrust', 'Thrust'], ['spellcast', 'Spellcast'],
        ['shoot', 'Shoot'], ['hurt', 'Hurt'], ['sit', 'Sit'], ['emote', 'Emote'], ['jump', 'Jump'], ['climb', 'Climb'], ['combat', 'Combat']],
    creatorFps: { walk: 10, run: 12, idle: 3, combat: 3, sit: 2, emote: 3 },

    openCreator(state) {
        if (typeof document === 'undefined') return null;
        const S = DocsDoodads.LpcSlots;
        const index = this.lpcIndex();
        if (!index) { this.showToast('Scan the LPC library first (More > Characters).', 'info'); this.showLpcCard(); return null; }
        const safeOnly = this.lpcSafeOnly();
        const was = this._creator;
        this._creator = {
            state: state || (was && was.state) || S.newState(index, 'male', safeOnly),
            name: was ? was.name : '', anim: 'walk', dir: 'down', frame: 0,
            tabs: { body: 0, outfit: 0 }, cursor: { card: 'body', row: 0 }, showBody: true, addons: true, shadow: true, pop: null
        };
        this.closeLpcCard();
        this.renderCreator();
        this.startCreatorLoop();
        DocsDoodads.Ui.sound('ok');
        return this._creator;
    },

    closeCreator() {
        const el = typeof document !== 'undefined' ? document.getElementById('dd-creator') : null;
        if (el && el.parentNode) el.parentNode.removeChild(el);
        this.stopCreatorLoop();
        if (this._creatorKeys && typeof window !== 'undefined') window.removeEventListener('keydown', this._creatorKeys, true);
        this._creatorKeys = null;
        if (this._creator) this._creator.open = false;
    },

    creatorOpen() {
        return Boolean(typeof document !== 'undefined' && document.getElementById('dd-creator'));
    },

    // The rows of a card's current tab (the body tab starts with the body type).
    creatorRows(cardKey) {
        const S = DocsDoodads.LpcSlots, c = this._creator;
        const card = S.cards.find(x => x.key === cardKey);
        const tab = card.tabs[c.tabs[cardKey]];
        const rows = tab.slots.map(s => Object.assign({ card: cardKey }, s));
        if (cardKey === 'body' && tab.key === 'body') rows.unshift({ key: '_body', label: 'Body type', card: 'body', special: true });
        return rows;
    },

    // What a row shows: value, the swatch's channel and colour, whether it can change.
    creatorRowView(row) {
        const S = DocsDoodads.LpcSlots, c = this._creator, index = this.lpcIndex();
        if (row.key === '_body') {
            const label = (S.bodies.find(b => b[0] === c.state.body) || [c.state.body, c.state.body])[1];
            return { value: label, channel: -1, off: false };
        }
        const options = S.options(index, row, c.state.body, this.lpcSafeOnly());
        const pick = c.state.slots[row.key];
        const part = pick && index.parts.find(p => p.id === pick.id);
        const value = part ? part.name : (options.length ? 'None' : 'Nothing for this body');
        let channel = -1;
        if (part) channel = S.colours(index, part, 0).length ? 0 : S.colours(index, part, 1).length ? 1 : -1;
        const colourName = channel === 1 ? pick.colour2 : channel === 0 ? pick.colour : '';
        const addonOff = row.addon && !c.addons;
        return { value, part, channel, colourName, colour: channel >= 0 ? S.swatch(index, part, colourName, channel) : '', off: !options.length || addonOff, count: options.length };
    },

    // ---- Changing the character ----

    creatorChanged(sound = 'cursor') {
        const c = this._creator;
        if (!c) return;
        c.composed = null;
        DocsDoodads.Ui.sound(sound);
        this.renderCreator();
    },

    creatorStep(rowKey, dir) {
        const S = DocsDoodads.LpcSlots, c = this._creator, index = this.lpcIndex(), safe = this.lpcSafeOnly();
        if (rowKey === '_body') {
            const list = S.bodies.map(b => b[0]);
            const next = list[(list.indexOf(c.state.body) + dir + list.length) % list.length];
            c.state = S.setBody(c.state, index, next, safe);
        } else {
            S.step(c.state, index, rowKey, dir, safe);
        }
        this.creatorChanged();
    },

    creatorColour(rowKey, dir, name) {
        const S = DocsDoodads.LpcSlots, c = this._creator, index = this.lpcIndex();
        const view = this.creatorRowView(Object.assign({ key: rowKey }, S.slot(rowKey)));
        if (view.channel < 0) return;
        const pick = c.state.slots[rowKey];
        if (name) pick[view.channel === 1 ? 'colour2' : 'colour'] = name;
        else S.stepColour(c.state, index, rowKey, dir, view.channel);
        this.creatorChanged();
    },

    creatorShuffle(card) {
        const S = DocsDoodads.LpcSlots, c = this._creator;
        c.state = S.shuffle(c.state, this.lpcIndex(), card, Math.random, this.lpcSafeOnly());
        this.creatorChanged('ok');
    },

    creatorRecipe() {
        const c = this._creator;
        return DocsDoodads.LpcSlots.toRecipe(c.state, { showBody: c.showBody, addons: c.addons });
    },

    // The sheet of the current animation (composed once per change; the compositor caches the layers).
    creatorComposed() {
        const c = this._creator;
        if (!c.composed || c.composed.anim !== c.anim) {
            const out = this.composeLpc(this.creatorRecipe(), c.anim) || { sheet: null, warnings: [], used: [] };
            c.composed = { anim: c.anim, sheet: out.sheet, warnings: out.warnings, used: out.used };
        }
        return c.composed;
    },

    // The artists of the character as drawn now: [{ file, part, authors, licences, safeToEncrypt }].
    creatorCredits() {
        const c = this._creator;
        if (!c) return [];
        const walk = this.composeLpc(DocsDoodads.LpcSlots.toRecipe(c.state, { addons: c.addons }), 'walk');
        return walk ? DocsDoodads.Lpc.creditsForLayers(walk.used) : [];
    },

    // ---- Drawing ----

    drawCreatorFrame() {
        const c = this._creator;
        const canvas = typeof document !== 'undefined' ? document.getElementById('dd-cr-canvas') : null;
        const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
        if (!c || !ctx || typeof ctx.createImageData !== 'function') return false;
        const C = DocsDoodads.LpcCompose;
        const composed = this.creatorComposed();
        const F = (composed.sheet && composed.sheet.frame) || C.frame;
        this.fitCreatorCanvas(canvas, F);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!composed.sheet) return false;
        const meta = C.animations[c.anim] || { frames: 1 };
        // Walking skips the standing frame 0.
        const frames = c.anim === 'walk' ? 8 : meta.frames;
        const frame = (c.anim === 'walk' ? 1 : 0) + (c.frame % frames);
        const rect = C.frameRect(c.anim, c.dir, frame, F);
        if (rect.x + rect.w > composed.sheet.width || rect.y + rect.h > composed.sheet.height) return false;
        const img = ctx.createImageData(rect.w, rect.h);
        for (let y = 0; y < rect.h; y++) {
            const from = ((rect.y + y) * composed.sheet.width + rect.x) * 4;
            img.data.set(composed.sheet.data.subarray(from, from + rect.w * 4), y * rect.w * 4);
        }
        if (!this._creatorScratch || this._creatorScratch.width !== F) { this._creatorScratch = document.createElement('canvas'); this._creatorScratch.width = F; this._creatorScratch.height = F; }
        this._creatorScratch.getContext('2d').putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this._creatorScratch, 0, 0, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
        return true;
    },

    // The stage's canvas for frames of F pixels. With oversize weapon art the canvas grows around the same
    // 64-pixel body (same size, same place) and the swing spills over the stage; it lets clicks through.
    fitCreatorCanvas(canvas, F) {
        const C = DocsDoodads.LpcCompose;
        if (canvas.width === 4 * F && canvas.height === 4 * F) return;
        const base = this._creator && this._creator.narrow ? 192 : 256;
        const size = base * F / C.frame, spill = (size - base) / 2;
        canvas.width = canvas.height = 4 * F;
        if (!canvas.style) return;
        canvas.style.width = canvas.style.height = F === C.frame ? '' : size + 'px';
        canvas.style.margin = F === C.frame ? '' : `0 ${-spill}px ${-spill}px`;
        canvas.style.pointerEvents = F === C.frame ? '' : 'none';
    },

    startCreatorLoop() {
        this.stopCreatorLoop();
        if (typeof setInterval === 'undefined') return;
        let last = Date.now(), acc = 0;
        this._creatorTimer = setInterval(() => {
            const c = this._creator;
            if (!c || !this.creatorOpen()) { this.stopCreatorLoop(); return; }
            this.pollCreatorPad();
            const now = Date.now();
            acc += now - last;
            last = now;
            const still = DocsDoodads.Ui.lessMotion && DocsDoodads.Ui.lessMotion();
            const step = 1000 / (this.creatorFps[c.anim] || 8);
            if (!still && acc >= step) { c.frame += Math.floor(acc / step); acc %= step; this.drawCreatorFrame(); }
            if (still) acc = 0;
        }, 33);
    },

    stopCreatorLoop() {
        if (this._creatorTimer) clearInterval(this._creatorTimer);
        this._creatorTimer = null;
    },

    renderCreator() {
        const D = DocsDoodads, U = D.Ui, S = D.LpcSlots, L = D.Lpc, c = this._creator;
        if (!c || typeof document === 'undefined') return null;
        const index = this.lpcIndex();
        let root = document.getElementById('dd-creator');
        if (!root) {
            root = document.createElement('div');
            root.id = 'dd-creator';
            root.setAttribute && root.setAttribute('role', 'dialog');
            root.setAttribute && root.setAttribute('aria-label', 'Character Creator');
            document.body.appendChild(root);
        }
        const summary = L.summary(index, this.lpcSafeOnly());
        // A small window (MZ's own 816 x 624) shows one card at a time beside a smaller stage.
        const narrow = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth < 1120 : false;
        c.narrow = narrow;
        const rowHtml = row => {
            const v = this.creatorRowView(row);
            const here = c.cursor.card === row.card && this.creatorRows(row.card)[c.cursor.row] && this.creatorRows(row.card)[c.cursor.row].key === row.key;
            const id = 'dd-cr-' + row.key;
            return `<div class="dd-cr-row${here ? ' dd-cr-cursor' : ''}${v.off ? ' dd-cr-off' : ''}" id="${id}-row" data-row="${escapeHtml(row.key)}">
                <span class="dd-cr-label">${escapeHtml(row.label)}</span>
                <button type="button" class="dd-cr-arrow" id="${id}-prev" aria-label="Previous ${escapeHtml(row.label)}"${v.off ? ' disabled' : ''}>◀</button>
                <div class="dd-cr-value" title="${escapeHtml(v.value + (v.count ? ' (' + v.count + ' to choose from)' : ''))}"><span>${escapeHtml(v.value)}</span></div>
                <button type="button" class="dd-cr-arrow" id="${id}-next" aria-label="Next ${escapeHtml(row.label)}"${v.off ? ' disabled' : ''}>▶</button>
                ${v.channel >= 0 ? `<button type="button" class="dd-cr-swatch" id="${id}-colour" style="background: ${escapeHtml(v.colour)};" aria-label="${escapeHtml((row.colour2 && v.channel === 1 ? row.colour2 : row.label) + ' colour: ' + v.colourName.replace(/_/g, ' '))}" title="${escapeHtml(v.colourName.replace(/_/g, ' '))} (click for all colours)"></button>` : '<span></span>'}
            </div>`;
        };
        const cardHtml = cardKey => {
            const card = S.cards.find(x => x.key === cardKey);
            return `<div class="dd-cr-card${c.cursor.card === cardKey ? ' dd-cr-here' : ''}${narrow && c.cursor.card !== cardKey ? ' dd-cr-hidden' : ''}" id="dd-cr-card-${cardKey}" aria-label="${escapeHtml(card.label)}">
                <div class="dd-cr-switch">${S.cards.map(k => `<button type="button" id="dd-cr-switch-${cardKey}-${k.key}" aria-pressed="${k.key === cardKey}">${escapeHtml(k.key === 'body' ? 'Body & face' : 'Outfit')}</button>`).join('')}</div>
                <div class="dd-cr-tabs" role="tablist">${card.tabs.map((t, i) => `<button type="button" role="tab" class="dd-cr-tab" id="dd-cr-tab-${cardKey}-${i}" aria-selected="${c.tabs[cardKey] === i}">${escapeHtml(t.label)}</button>`).join('')}</div>
                <div class="dd-cr-rows">${this.creatorRows(cardKey).map(rowHtml).join('')}</div>
            </div>`;
        };
        const composed = this.creatorComposed();
        const missingAnim = composed.warnings.filter(w => / has no /.test(w)).length;
        const credits = this.creatorCredits();
        const artists = new Set(credits.flatMap(f => f.authors)).size;
        const unsafe = credits.filter(f => !f.safeToEncrypt).length;
        root.innerHTML = `<div class="dd-cr${narrow ? ' dd-cr-narrow' : ''}">
            <div class="dd-cr-top">
                <div class="dd-cr-title">${U.icon('person', narrow ? 1 : 2)} Character Creator</div>
                <div class="dd-cr-lib">LPC library · ${summary.usable} parts${summary.commit ? ' · version ' + escapeHtml(summary.commit.slice(0, 7)) : ''}</div>
                <div class="dd-cr-grow"></div>
                <label class="dd-cr-chip" title="Only parts offered under CC0 or OGA-BY, which may be encrypted when deploying"><input type="checkbox" id="dd-cr-safe" ${this.lpcSafeOnly() ? 'checked' : ''} /> Only art safe to encrypt</label>
                <button type="button" class="dd-cr-close" id="dd-cr-close" aria-label="Close the creator" title="Close (Esc)">✕</button>
            </div>
            <div class="dd-cr-main">
                ${cardHtml('body')}
                ${narrow ? cardHtml('outfit') : ''}
                <div class="dd-cr-stagecol">
                    <div class="dd-cr-stage">
                        <button type="button" class="dd-cr-dice" id="dd-cr-dice-body" style="left: 12px;" aria-label="Shuffle the body" title="Shuffle the body and face (X)">⚄</button>
                        <input class="dd-cr-name" id="dd-cr-name" type="text" value="${escapeHtml(c.name)}" placeholder="Name your character" aria-label="Character name" />
                        <button type="button" class="dd-cr-dice" id="dd-cr-dice-outfit" style="right: 12px;" aria-label="Shuffle the outfit" title="Shuffle the outfit (Y)">⚅</button>
                        <div class="dd-cr-figure">
                            ${c.shadow ? '<div class="dd-cr-shadow"></div>' : ''}
                            <canvas class="dd-cr-canvas" id="dd-cr-canvas" width="256" height="256" role="img" aria-label="${escapeHtml((c.name || 'The character') + ', ' + c.anim + ', facing ' + c.dir)}"></canvas>
                        </div>
                        <div class="dd-cr-turn">
                            <button type="button" id="dd-cr-turn-left" aria-label="Turn left" title="Turn left">↺</button>
                            <span>Facing ${escapeHtml(c.dir)}</span>
                            <button type="button" id="dd-cr-turn-right" aria-label="Turn right" title="Turn right">↻</button>
                        </div>
                    </div>
                    <div class="dd-cr-anims">${this.creatorAnimations.map(([key, label]) => `<button type="button" class="dd-cr-anim" id="dd-cr-anim-${key}" aria-pressed="${c.anim === key}">${escapeHtml(label)}</button>`).join('')}</div>
                    <div class="dd-cr-toggles">
                        <label><input type="checkbox" id="dd-cr-showbody" ${c.showBody ? 'checked' : ''} /> Show body</label>
                        <label><input type="checkbox" id="dd-cr-addons" ${c.addons ? 'checked' : ''} /> Body add-ons</label>
                        <label><input type="checkbox" id="dd-cr-shadow" ${c.shadow ? 'checked' : ''} /> Cast shadow</label>
                    </div>
                    <div class="dd-cr-warn" id="dd-cr-warn">${missingAnim ? escapeHtml(`${missingAnim} part${missingAnim === 1 ? ' has' : 's have'} no ${c.anim}: ` + composed.warnings.filter(w => / has no /.test(w)).map(w => w.split(' has no ')[0]).join(', ')) : ''}</div>
                </div>
                ${narrow ? '' : cardHtml('outfit')}
            </div>
            <div class="dd-cr-bottom">
                <button type="button" class="dd-cr-btn" id="dd-cr-load">Load</button>
                <button type="button" class="dd-cr-btn" id="dd-cr-save">Save</button>
                <button type="button" class="dd-cr-btn" id="dd-cr-credits">Credits · ${artists} artist${artists === 1 ? '' : 's'}${unsafe ? ' · ' + unsafe + ' not safe to encrypt' : ''}</button>
                <div class="dd-cr-grow dd-cr-keys" style="font-size: 12px; font-weight: 700; color: #7a6b8f; text-align: right;">↑↓ pick · ←→ change · Shift colour · Q/E tabs · X/Y dice</div>
                ${narrow ? '<div class="dd-cr-grow"></div>' : ''}
                <button type="button" class="dd-cr-export" id="dd-cr-export" title="Make MZ character sheets and a face from this character">Export to RPG Maker</button>
            </div>
            ${c.pop ? this.creatorPopHtml() : ''}
        </div>`;
        this.bindCreator();
        this.drawCreatorFrame();
        return root;
    },

    creatorPopHtml() {
        const S = DocsDoodads.LpcSlots, c = this._creator, index = this.lpcIndex();
        const pop = c.pop;
        if (pop.kind === 'palette') {
            const view = this.creatorRowView(Object.assign({ key: pop.row }, S.slot(pop.row)));
            const names = S.colours(index, view.part, view.channel);
            return `<div class="dd-cr-pop" id="dd-cr-pop" style="left: ${pop.x}px; top: ${pop.y}px;" role="listbox" aria-label="Colours">
                <div style="font-weight: 900; font-size: 13px; margin-bottom: 6px;">${escapeHtml(S.slot(pop.row).label)} colour</div>
                <div class="dd-cr-palette">${names.map((n, i) => `<button type="button" id="dd-cr-pal-${i}" aria-pressed="${n === view.colourName}" style="background: ${escapeHtml(S.swatch(index, view.part, n, view.channel))};" title="${escapeHtml(n.replace(/_/g, ' '))}" aria-label="${escapeHtml(n.replace(/_/g, ' '))}"></button>`).join('')}</div>
            </div>`;
        }
        if (pop.kind === 'load') {
            const saved = S.validSaved(this.readCreatorSaved()).characters;
            return `<div class="dd-cr-pop" id="dd-cr-pop" style="left: 22px; bottom: 70px;">
                <div style="font-weight: 900; font-size: 13px; margin-bottom: 6px;">Saved characters</div>
                <div class="dd-cr-list">${saved.length ? saved.map((s, i) => `<div class="dd-cr-item"><span>${escapeHtml(s.name)}</span>
                    <button type="button" id="dd-cr-load-${i}">Load</button><button type="button" id="dd-cr-del-${i}" aria-label="Delete ${escapeHtml(s.name)}">Delete</button></div>`).join('')
                    : '<div style="color: #7a6b8f;">None saved yet. Save keeps the character in data/DocsDoodadsCharacters.json.</div>'}</div>
            </div>`;
        }
        if (pop.kind === 'export') {
            const o = c.exportOptions || (c.exportOptions = this.lpcExportDefaults());
            const N = DocsDoodads.LpcExport.names(c.name);
            const files = this.lpcExportFiles(c.name, o);
            const unsafe = this.creatorCredits().filter(f => !f.safeToEncrypt).length;
            const tick = (id, on, label, note) => `<label style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} style="flex: none; width: 16px; height: 16px; accent-color: #19b6a4;" /><span><b>${escapeHtml(label)}</b><br><span style="color: #7a6b8f;">${note}</span></span></label>`;
            const done = c.exported;
            return `<div class="dd-cr-pop" id="dd-cr-pop" style="right: 22px; bottom: 70px; width: 380px; font-size: 12px;">
                <div style="font-weight: 900; font-size: 14px; margin-bottom: 8px;">Export ${escapeHtml(DocsDoodads.LpcExport.cleanName(c.name) || 'your character')} to RPG Maker</div>
                ${c.name.trim() ? '' : '<div style="color: #c8472c; font-weight: 800; margin-bottom: 6px;">Name the character first (above the stage).</div>'}
                ${tick('dd-cr-ex-classic', o.classic, 'Classic walker', `${escapeHtml(N.classic)}.png: MZ's 3-frame walk. Works with or without this plugin.`)}
                ${tick('dd-cr-ex-smooth', o.smooth, 'Smooth walker, idle and run', `${escapeHtml(N.smooth)}.png and its _idle and _run sheets: every walk frame, breathing when still, running when dashing.`)}
                ${tick('dd-cr-ex-battler', o.battler, 'Side-view battler', `img/sv_actors/${escapeHtml(N.face)}.png: walk, wait, chant, guard, damage, swing, thrust, missile, spell, victory, dead and the rest.`)}
                <div style="margin: 0 0 6px 22px;"><b>Actions</b> <span style="color: #7a6b8f;">(for Play Character Action)</span><div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">${DocsDoodads.LpcExport.actions.map(([anim]) => `<button type="button" class="dd-cr-anim" id="dd-cr-ex-act-${anim}" aria-pressed="${(o.actions || []).includes(anim)}" title="${escapeHtml(DocsDoodads.LpcExport.actionName(c.name, anim))}.png">${escapeHtml(anim.replace(/^1h_/, ''))}</button>`).join('')}</div></div>
                ${tick('dd-cr-ex-face', o.face, 'Face', `img/faces/${escapeHtml(N.face)}.png, in slot <select id="dd-cr-ex-slot" style="font-size: 11px;">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}"${(o.faceSlot || 0) === i ? ' selected' : ''}>${i + 1}</option>`).join('')}</select> (other faces in the sheet are kept).`)}
                ${tick('dd-cr-ex-parts', o.parts, 'Outfit as Visual Equipment parts', `The character's sheets get the body and face only; each piece it wears becomes part sheets in the same layouts, with the notetag to put on a weapon or armour, so changing equipment changes what it wears.`)}
                ${unsafe ? `<div style="background: #fff1c2; border-radius: 12px; padding: 6px 8px; margin-bottom: 6px; line-height: 1.4;">${unsafe} artwork${unsafe === 1 ? ' is' : 's are'} not safe to encrypt: deploy without "Encrypt image files", or change ${unsafe === 1 ? 'it' : 'them'}.</div>` : ''}
                <div style="color: #7a6b8f; margin-bottom: 8px; line-height: 1.4;">Credits are added to ${escapeHtml(DocsDoodads.Lpc.creditsText)}. The character is saved under its name to change and export again.</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="dd-cr-export" id="dd-cr-ex-go" style="font-size: 15px; padding: 8px 20px;"${!c.name.trim() || !files.length ? ' disabled' : ''}>Export ${files.length} file${files.length === 1 ? '' : 's'}</button>
                    ${done ? `<button type="button" class="dd-cr-btn" id="dd-cr-ex-try" style="font-size: 13px; padding: 6px 14px;" title="Show it on the player now (this playtest only)">Try on the player</button>` : ''}
                </div>
                ${done ? `<div id="dd-cr-ex-done" style="margin-top: 8px; color: #0f6f64; font-weight: 800; line-height: 1.4;">Wrote ${done.files.length} file${done.files.length === 1 ? '' : 's'}.${done.warnings.length ? ` <span style="color: #9a6a00;">${escapeHtml(done.warnings.slice(0, 2).join(' '))}</span>` : ''}${done.oversize && done.oversize.length ? `<div id="dd-cr-ex-big" style="font-weight: 700; color: #5b4c70;">${escapeHtml(DocsDoodads.LpcExport.oversizeNote(done.oversize))}</div>` : ''}</div>` : ''}
                ${done && done.parts && done.parts.length ? `<div style="margin-top: 8px; max-height: 210px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">${done.parts.map((p, i) => `
                    <div style="background: #f6efe0; border-radius: 12px; padding: 6px 8px;">
                        <b>${escapeHtml(p.label)}: ${escapeHtml(p.name)}</b>
                        <pre id="dd-cr-tag-${i}" style="margin: 4px 0; white-space: pre-wrap; word-break: break-all; font-size: 10px; background: #fffaf0; border-radius: 8px; padding: 4px 6px;">${escapeHtml(p.notetag)}</pre>
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <button type="button" class="dd-cr-anim" id="dd-cr-tag-copy-${i}">Copy</button>
                            <select id="dd-cr-tag-item-${i}" style="flex: 1; min-width: 0; font-size: 11px;"><option value="">Put it on...</option>${this.lpcEquipItems().map(it => `<option value="${it.kind}${it.id}">${(this.lpcItemKinds[it.kind] || [])[2] || ''} ${it.id}: ${escapeHtml(it.name)}${it.kind === 'h' ? ' (always worn)' : ''}</option>`).join('')}</select>
                            <button type="button" class="dd-cr-anim" id="dd-cr-tag-add-${i}">Add</button>
                        </div>
                    </div>`).join('')}</div>` : ''}
            </div>`;
        }
        if (pop.kind === 'credits') {
            const files = this.creatorCredits();
            return `<div class="dd-cr-pop dd-cr-credits" id="dd-cr-pop" style="left: 140px; bottom: 70px;">
                <div style="font-weight: 900; font-size: 13px; margin-bottom: 6px;">Who made this art</div>
                ${files.map(f => `<div style="margin-bottom: 6px;"><b>${escapeHtml(f.part || f.file)}</b>${f.safeToEncrypt ? '' : ' <span style="color: #c8472c; font-weight: 900;">(not safe to encrypt)</span>'}<br>
                    by ${escapeHtml(f.authors.join(', ') || 'unknown')}<br><span style="color: #7a6b8f;">${escapeHtml(DocsDoodads.Lpc.preferredLicence(f.licences) || 'no licence found')}</span></div>`).join('')}
                <div style="color: #7a6b8f;">These go into ${escapeHtml(DocsDoodads.Lpc.creditsText)} when the character is exported.</div>
            </div>`;
        }
        return '';
    },

    bindCreator() {
        const S = DocsDoodads.LpcSlots, c = this._creator;
        const on = (id, fn, ev = 'onclick') => { const el = document.getElementById(id); if (el) el[ev] = fn; return el; };
        on('dd-cr-close', () => this.closeCreator());
        for (const cardKey of ['body', 'outfit']) {
            S.cards.find(x => x.key === cardKey).tabs.forEach((t, i) => on(`dd-cr-tab-${cardKey}-${i}`, () => this.creatorTab(cardKey, i)));
            this.creatorRows(cardKey).forEach((row, i) => {
                const id = 'dd-cr-' + row.key;
                on(id + '-prev', () => { c.cursor = { card: cardKey, row: i }; this.creatorStep(row.key, -1); });
                on(id + '-next', () => { c.cursor = { card: cardKey, row: i }; this.creatorStep(row.key, 1); });
                const sw = on(id + '-colour', e => { c.cursor = { card: cardKey, row: i }; this.creatorOpenPalette(row.key, e); });
                if (sw) sw.oncontextmenu = e => { if (e && e.preventDefault) e.preventDefault(); this.creatorColour(row.key, -1); };
            });
        }
        for (const a of ['body', 'outfit']) for (const b of ['body', 'outfit']) on(`dd-cr-switch-${a}-${b}`, () => { if (c.cursor.card !== b) this.creatorCommand('card'); });
        on('dd-cr-dice-body', () => this.creatorShuffle('body'));
        on('dd-cr-dice-outfit', () => this.creatorShuffle('outfit'));
        on('dd-cr-turn-left', () => this.creatorTurn(-1));
        on('dd-cr-turn-right', () => this.creatorTurn(1));
        this.creatorAnimations.forEach(([key]) => on('dd-cr-anim-' + key, () => { c.anim = key; c.frame = 0; DocsDoodads.Ui.sound('cursor'); this.renderCreator(); }));
        on('dd-cr-showbody', e => { c.showBody = Boolean(e.target.checked); this.creatorChanged(); }, 'onchange');
        on('dd-cr-addons', e => { c.addons = Boolean(e.target.checked); this.creatorChanged(); }, 'onchange');
        on('dd-cr-shadow', e => { c.shadow = Boolean(e.target.checked); this.renderCreator(); }, 'onchange');
        on('dd-cr-safe', e => { this.setLpcSafeOnly(Boolean(e.target.checked)); this.creatorChanged(); }, 'onchange');
        on('dd-cr-name', e => { c.name = String(e.target.value || ''); }, 'oninput');
        on('dd-cr-save', () => this.creatorSave());
        on('dd-cr-load', () => { c.pop = c.pop && c.pop.kind === 'load' ? null : { kind: 'load' }; this.renderCreator(); });
        on('dd-cr-credits', () => { c.pop = c.pop && c.pop.kind === 'credits' ? null : { kind: 'credits' }; this.renderCreator(); });
        on('dd-cr-export', () => { c.pop = c.pop && c.pop.kind === 'export' ? null : { kind: 'export' }; c.exported = null; this.renderCreator(); });
        if (c.pop && c.pop.kind === 'export') {
            const o = c.exportOptions;
            DocsDoodads.LpcExport.actions.forEach(([anim]) => on('dd-cr-ex-act-' + anim, () => {
                const list = new Set(o.actions || []);
                if (list.has(anim)) list.delete(anim); else list.add(anim);
                o.actions = DocsDoodads.LpcExport.actions.map(a => a[0]).filter(a => list.has(a));
                this.renderCreator();
            }));
            ((c.exported && c.exported.parts) || []).forEach((p, i) => {
                on('dd-cr-tag-copy-' + i, () => {
                    try { if (typeof nw !== 'undefined' && nw.Clipboard) nw.Clipboard.get().set(p.notetag, 'text'); else if (navigator.clipboard) navigator.clipboard.writeText(p.notetag); } catch (e) {}
                    this.showToast('Copied the notetag for ' + p.name + '.', 'success');
                });
                on('dd-cr-tag-add-' + i, () => {
                    const sel = document.getElementById('dd-cr-tag-item-' + i);
                    const v = sel ? String(sel.value || '') : '';
                    if (!v) { this.showToast('Pick the weapon or armour to put it on.', 'info'); return; }
                    this.addLpcNotetag(v[0], parseInt(v.slice(1), 10), p.notetag, p.slot);
                });
            });
            for (const key of ['classic', 'smooth', 'face', 'battler', 'parts']) on('dd-cr-ex-' + key, e => { o[key] = Boolean(e.target.checked); this.renderCreator(); }, 'onchange');
            on('dd-cr-ex-slot', e => { o.faceSlot = Math.max(0, Math.min(7, parseInt(e.target.value, 10) || 0)); }, 'onchange');
            on('dd-cr-ex-go', () => this.creatorExport());
            on('dd-cr-ex-try', () => { if (c.exported) { this.tryLpcOnPlayer(c.exported.names, c.exportOptions.smooth); this.closeCreator(); } });
        }
        if (c.pop && c.pop.kind === 'palette') {
            const view = this.creatorRowView(Object.assign({ key: c.pop.row }, S.slot(c.pop.row)));
            const row = c.pop.row;
            S.colours(this.lpcIndex(), view.part, view.channel).forEach((n, i) => on('dd-cr-pal-' + i, () => { c.pop = null; this.creatorColour(row, 0, n); }));
        }
        if (c.pop && c.pop.kind === 'load') {
            const saved = S.validSaved(this.readCreatorSaved()).characters;
            saved.forEach((s, i) => {
                on('dd-cr-load-' + i, () => this.creatorLoad(s.name));
                on('dd-cr-del-' + i, () => this.creatorDelete(s.name));
            });
        }
        if (!this._creatorKeys && typeof window !== 'undefined' && window.addEventListener) {
            this._creatorKeys = e => this.creatorKey(e);
            window.addEventListener('keydown', this._creatorKeys, true);
        }
    },

    creatorTab(cardKey, i) {
        const c = this._creator;
        const tabs = DocsDoodads.LpcSlots.cards.find(x => x.key === cardKey).tabs;
        c.tabs[cardKey] = (i + tabs.length) % tabs.length;
        c.cursor = { card: cardKey, row: 0 };
        c.pop = null;
        DocsDoodads.Ui.sound('cursor');
        this.renderCreator();
    },

    creatorTurn(step) {
        const c = this._creator;
        const order = ['down', 'left', 'up', 'right'];
        c.dir = order[(order.indexOf(c.dir) + step + 4) % 4];
        DocsDoodads.Ui.sound('cursor');
        this.renderCreator();
    },

    creatorOpenPalette(rowKey, e) {
        const c = this._creator;
        const target = e && e.target && e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : null;
        const box = typeof document !== 'undefined' && document.querySelector ? document.querySelector('#dd-creator .dd-cr') : null;
        const origin = box && box.getBoundingClientRect ? box.getBoundingClientRect() : { left: 0, top: 0 };
        const x = target ? Math.max(10, Math.min(target.left - origin.left - 120, (box ? box.clientWidth : 1160) - 250)) : 400;
        const y = target ? Math.max(10, Math.min(target.bottom - origin.top + 6, (box ? box.clientHeight : 740) - 320)) : 120;
        c.pop = c.pop && c.pop.kind === 'palette' && c.pop.row === rowKey ? null : { kind: 'palette', row: rowKey, x: Math.round(x), y: Math.round(y) };
        this.renderCreator();
    },

    // Export, asking first when it would replace pictures already in the project.
    async creatorExport() {
        const c = this._creator, FS = DocsDoodads.FS;
        const o = c.exportOptions || this.lpcExportDefaults();
        const existing = this.lpcExportFiles(c.name, o).filter(f => FS.existsSync(f));
        if (existing.length && !await DocsDoodads.Ui.confirm(`Replace ${existing.length} picture${existing.length === 1 ? '' : 's'} already in the project?\n${existing.join('\n')}`, { title: 'Export again', ok: 'Replace' })) return null;
        const result = this.exportLpcCharacter(c.state, Object.assign({ name: c.name, addons: c.addons }, o));
        if (result) { c.exported = result; DocsDoodads.Ui.sound('save'); }
        if (this.creatorOpen()) this.renderCreator();
        return result;
    },

    // ---- Saved characters ----

    readCreatorSaved() {
        const FS = DocsDoodads.FS, S = DocsDoodads.LpcSlots;
        try { return FS.existsSync(S.charactersFile) ? FS.readJson(S.charactersFile) : null; } catch (e) { return null; }
    },

    async creatorSave() {
        const S = DocsDoodads.LpcSlots, c = this._creator;
        let name = c.name.trim();
        if (!name) {
            name = await DocsDoodads.Ui.prompt('A name for this character:', '', { title: 'Save character', ok: 'Save', icon: 'person' });
            if (!name || !String(name).trim()) return false;
            c.name = String(name).trim();
        }
        const data = S.save(this.readCreatorSaved(), c.name, c.state);
        if (!DocsDoodads.FS.atomicWriteJson(S.charactersFile, data)) { this.showToast('Could not save the character.', 'error'); return false; }
        DocsDoodads.Ui.sound('save');
        this.showToast(`Saved ${c.name}.`, 'success');
        this.renderCreator();
        return true;
    },

    creatorLoad(name) {
        const S = DocsDoodads.LpcSlots, c = this._creator;
        const state = S.load(this.readCreatorSaved(), name);
        if (!state) return false;
        c.state = state;
        c.name = name;
        c.pop = null;
        const gone = S.missing(state, this.lpcIndex(), this.lpcSafeOnly());
        if (gone.length) this.showToast(`Some parts aren't offered now (${gone.map(k => S.slot(k) ? S.slot(k).label : k).join(', ')}): the library changed, or they aren't safe to encrypt.`, 'info');
        this.creatorChanged('ok');
        return true;
    },

    async creatorDelete(name) {
        const S = DocsDoodads.LpcSlots;
        if (!await DocsDoodads.Ui.confirm(`Delete the saved character "${name}"?`, { danger: true, ok: 'Delete' })) return false;
        DocsDoodads.FS.atomicWriteJson(S.charactersFile, S.remove(this.readCreatorSaved(), name));
        this.renderCreator();
        return true;
    },

    // ---- Keyboard and gamepad ----

    // One command from a key or a button: up, down, left, right, colourLeft, colourRight, tabPrev, tabNext,
    // card, diceBody, diceOutfit, turnLeft, turnRight, save, close.
    creatorCommand(cmd) {
        const c = this._creator;
        if (!c) return false;
        const rows = this.creatorRows(c.cursor.card);
        const row = rows[Math.min(c.cursor.row, rows.length - 1)];
        if (c.pop && cmd !== 'close') c.pop = null;
        switch (cmd) {
            case 'up': c.cursor.row = (c.cursor.row - 1 + rows.length) % rows.length; DocsDoodads.Ui.sound('cursor'); this.renderCreator(); return true;
            case 'down': c.cursor.row = (c.cursor.row + 1) % rows.length; DocsDoodads.Ui.sound('cursor'); this.renderCreator(); return true;
            case 'left': case 'right': if (row && !this.creatorRowView(row).off) this.creatorStep(row.key, cmd === 'left' ? -1 : 1); return true;
            case 'colourLeft': case 'colourRight': if (row && row.key !== '_body') this.creatorColour(row.key, cmd === 'colourLeft' ? -1 : 1); return true;
            case 'tabPrev': case 'tabNext': this.creatorTab(c.cursor.card, c.tabs[c.cursor.card] + (cmd === 'tabPrev' ? -1 : 1)); return true;
            case 'card': c.cursor = { card: c.cursor.card === 'body' ? 'outfit' : 'body', row: 0 }; DocsDoodads.Ui.sound('cursor'); this.renderCreator(); return true;
            case 'diceBody': this.creatorShuffle('body'); return true;
            case 'diceOutfit': this.creatorShuffle('outfit'); return true;
            case 'turnLeft': this.creatorTurn(-1); return true;
            case 'turnRight': this.creatorTurn(1); return true;
            case 'save': this.creatorSave(); return true;
            case 'close':
                if (c.pop) { c.pop = null; this.renderCreator(); return true; }
                DocsDoodads.Ui.sound('cancel');
                this.closeCreator();
                return true;
        }
        return false;
    },

    creatorKey(e) {
        if (!this.creatorOpen() || (DocsDoodads.Ui.dialogOpen && DocsDoodads.Ui.dialogOpen())) return;
        const typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '') && e.target.type !== 'checkbox';
        let cmd = null;
        const k = e.key;
        if (k === 'Escape') cmd = 'close';
        else if (typing) return;
        else if (k === 'ArrowUp') cmd = 'up';
        else if (k === 'ArrowDown') cmd = 'down';
        else if (k === 'ArrowLeft') cmd = e.shiftKey ? 'colourLeft' : 'left';
        else if (k === 'ArrowRight') cmd = e.shiftKey ? 'colourRight' : 'right';
        else if (k === 'q' || k === 'Q') cmd = 'tabPrev';
        else if (k === 'e' || k === 'E') cmd = 'tabNext';
        else if (k === 'Tab') cmd = 'card';
        else if (k === 'x' || k === 'X') cmd = 'diceBody';
        else if (k === 'y' || k === 'Y') cmd = 'diceOutfit';
        else if (k === ',' || k === '<') cmd = 'turnLeft';
        else if (k === '.' || k === '>') cmd = 'turnRight';
        else if ((k === 's' || k === 'S') && (e.ctrlKey || e.metaKey)) cmd = 'save';
        // Keys the creator doesn't use still stop here, so the map tools and the game behind it don't act.
        if (!cmd) { if (e.stopPropagation) e.stopPropagation(); return; }
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        this.creatorCommand(cmd);
    },

    // Standard gamepad buttons, pressed this time and not last time; the d-pad and left stick repeat.
    pollCreatorPad() {
        if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function' || (DocsDoodads.Ui.dialogOpen && DocsDoodads.Ui.dialogOpen())) return;
        let pad = null;
        try { pad = Array.from(navigator.getGamepads() || []).find(p => p && p.connected); } catch (e) { pad = null; }
        if (!pad) return;
        const down = i => Boolean(pad.buttons[i] && pad.buttons[i].pressed);
        const axis = i => (pad.axes && pad.axes[i]) || 0;
        const held = {
            up: down(12) || axis(1) < -0.6, down: down(13) || axis(1) > 0.6, left: down(14) || axis(0) < -0.6, right: down(15) || axis(0) > 0.6,
            colourRight: down(0), close: down(1), diceBody: down(2), diceOutfit: down(3), tabPrev: down(4), tabNext: down(5),
            turnLeft: down(6), turnRight: down(7), card: down(8), save: down(9)
        };
        const was = this._creatorPad || {};
        const now = Date.now();
        const repeat = this._creatorPadRepeat || (this._creatorPadRepeat = {});
        this._creatorPad = held;
        for (const [cmd, on] of Object.entries(held)) {
            if (!on) { delete repeat[cmd]; continue; }
            const moving = ['up', 'down', 'left', 'right'].includes(cmd);
            if (!was[cmd]) { repeat[cmd] = now + 380; this.creatorCommand(cmd); }
            else if (moving && now >= repeat[cmd]) { repeat[cmd] = now + 120; this.creatorCommand(cmd); }
        }
    }
});
