//==========================================================
// SECTION 24c: DocsDoodads.Ui (WORKSPACE LOOK AND FEEL)
//==========================================================
// A bright, friendly look: white rounded panels, chunky "press-down" buttons, big pixel icons, toggle
// switches, and short hints that say what to do next. Colours are CSS variables (--dd-*) so every panel,
// including the ones opened on the page (Screen Looks, Effects Maker, History...), shares them.
DocsDoodads.Ui = {
    prefsKey: 'docsDoodads.ui',

    // Per-computer UI choices (panel folding, sounds, the welcome card). Never needed to work.
    prefs() {
        try {
            const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.prefsKey) : null;
            const data = raw ? JSON.parse(raw) : {};
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    },

    setPref(key, value) {
        const data = this.prefs();
        data[key] = value;
        try { if (typeof localStorage !== 'undefined') localStorage.setItem(this.prefsKey, JSON.stringify(data)); } catch (e) {}
        return value;
    },

    // An icon from art/ui_icons.png. scale: 1 (16px), 2 (32px)...
    icon(name, scale = 2, extraClass = '') {
        const I = DocsDoodads.UiIcons;
        const index = I ? I.names.indexOf(name) : -1;
        if (index < 0) return '';
        const x = (index % I.cols) * I.size, y = Math.floor(index / I.cols) * I.size;
        return `<i class="dd-ico ${extraClass}" aria-hidden="true" style="width: ${I.size * scale}px; height: ${I.size * scale}px; ` +
            `background-size: ${I.width * scale}px ${I.height * scale}px; background-position: -${x * scale}px -${y * scale}px;"></i>`;
    },

    // Little sounds from the project's own System sounds (they can be turned off in More).
    sound(kind) {
        if (this.prefs().sounds === false || typeof SoundManager === 'undefined') return;
        try {
            if (kind === 'ok') SoundManager.playOk();
            else if (kind === 'cancel') SoundManager.playCancel();
            else if (kind === 'save') SoundManager.playSave();
            else if (kind === 'buzzer') SoundManager.playBuzzer();
            else SoundManager.playCursor();
        } catch (e) {}
    },

    // What to do next, shown in the bubble at the bottom of the screen.
    hints: {
        none: 'Pick something from the bag, then click the map to place it. Click a placed thing to change it.',
        stamp: 'Stamp: click the map to place the picked item again and again. Esc to stop.',
        brush: 'Scatter: drag over the map to sprinkle the picked item around.',
        biome: 'Paint: drag over the map to paint a mix of plants (set mixes in Map, Biomes).',
        path: 'Path: click to add points, then double-click (or Enter) to lay the item along them.',
        terrain: 'Hills: drag over the map to raise or lower the ground (seen in 3D).',
        eyedropper: 'Pick: click any doodad on the map to pick up what it is made of.'
    },

    setHint(text) {
        const el = typeof document !== 'undefined' ? document.getElementById('dd-status-left') : null;
        if (el) el.textContent = text;
    },

    css: `
:root {
    --dd-panel: #ffffff;
    --dd-panel-2: #f7f5fc;
    --dd-field: #f2f0f8;
    --dd-line: #e3dff0;
    --dd-line-soft: #ece9f5;
    --dd-text: #2f2a43;
    --dd-muted: #6f6a86;
    --dd-faint: #9c97b0;
    --dd-accent: #1f8bff;
    --dd-primary: #2e9bff;
    --dd-primary-dark: #1c74d6;
    --dd-primary-soft: #e3f1ff;
    --dd-good: #2fc26b;
    --dd-good-dark: #1f9450;
    --dd-good-soft: #dff7e8;
    --dd-danger: #ff5a5f;
    --dd-danger-dark: #d63c41;
    --dd-danger-soft: #ffe4e5;
    --dd-warn: #e09b00;
    --dd-warn-soft: #fff4c9;
    --dd-purple: #8a63f0;
    --dd-pink: #f2559c;
    --dd-tint: rgba(46, 155, 255, 0.08);
    --dd-shadow: 0 4px 0 rgba(47, 42, 67, 0.10), 0 12px 30px rgba(20, 16, 40, 0.30);
    --dd-font: 'Doodads Nunito', 'Nunito', 'M PLUS Rounded 1c', 'rmmz-mainfont', 'Segoe UI', system-ui, sans-serif;
}
#dd-asset-workspace-root, .dd-glass { font-family: var(--dd-font); }
#dd-asset-workspace-root *, .dd-glass * { box-sizing: border-box; }
.dd-glass {
    background: var(--dd-panel);
    border: 3px solid #ffffff;
    border-radius: 20px;
    color: var(--dd-text);
    box-shadow: var(--dd-shadow);
    pointer-events: auto;
    font-size: 12px;
    font-weight: 600;
}
.dd-glass b, .dd-glass strong { font-weight: 800; }
.dd-ico { display: inline-block; flex: none; background-image: var(--dd-icons); background-repeat: no-repeat; image-rendering: pixelated; vertical-align: middle; }

/* Buttons: white, rounded, and they press down. */
.dd-btn {
    font-family: inherit; font-weight: 800; font-size: 12px; line-height: 1.15; color: var(--dd-text);
    background: #ffffff; border: 2px solid var(--dd-line); border-radius: 12px; padding: 5px 11px;
    box-shadow: 0 3px 0 var(--dd-line); cursor: pointer; white-space: nowrap;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.15s ease, background 0.15s ease;
}
.dd-btn:hover { border-color: var(--dd-primary); box-shadow: 0 3px 0 #b8dbff; transform: translateY(-1px); }
.dd-btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--dd-line); }
.dd-btn:focus { outline: none; }
.dd-btn:focus-visible { box-shadow: 0 0 0 3px rgba(46, 155, 255, 0.45), 0 3px 0 var(--dd-line); }
.dd-btn:disabled { opacity: 0.5; cursor: default; transform: none; }
.dd-btn-primary { background: var(--dd-primary); border-color: var(--dd-primary-dark); color: #fff; box-shadow: 0 3px 0 var(--dd-primary-dark); }
.dd-btn-primary:hover { background: #45a8ff; border-color: var(--dd-primary-dark); box-shadow: 0 3px 0 var(--dd-primary-dark); }
.dd-btn-good { background: var(--dd-good); border-color: var(--dd-good-dark); color: #fff; box-shadow: 0 3px 0 var(--dd-good-dark); }
.dd-btn-good:hover { background: #45cf7d; border-color: var(--dd-good-dark); box-shadow: 0 3px 0 var(--dd-good-dark); }
.dd-btn-danger { background: var(--dd-danger); border-color: var(--dd-danger-dark); color: #fff; box-shadow: 0 3px 0 var(--dd-danger-dark); }
.dd-btn-danger:hover { background: #ff7175; border-color: var(--dd-danger-dark); box-shadow: 0 3px 0 var(--dd-danger-dark); }
.dd-btn-active, .dd-btn.dd-btn-active {
    background: var(--dd-warn-soft) !important; border-color: #f2b600 !important; color: var(--dd-text) !important;
    box-shadow: 0 3px 0 #e0a800 !important; animation: dd-pop 0.22s ease;
}

/* The top bar: big icon tools with a word under each, like a game's build menu. */
#dd-toolbar { display: flex; align-items: center; gap: 4px; padding: 5px 8px; }
#dd-toolbar .dd-brand { display: flex; align-items: center; gap: 4px; padding: 0 6px 0 2px; font-weight: 900; font-size: 15px; color: var(--dd-good-dark); letter-spacing: 0.2px; }
#dd-toolbar .dd-sep { width: 2px; align-self: stretch; margin: 6px 3px; background: var(--dd-line-soft); border-radius: 2px; }
#dd-toolbar .dd-spacer { flex: 1; }
.dd-tool { flex-direction: column; gap: 1px; width: 54px; height: 54px; padding: 3px 2px 2px; border-radius: 14px; font-size: 10px; }
.dd-tool b { font-weight: 800; font-size: 10px; }
.dd-tool.dd-wide { width: 62px; }
@media (max-width: 900px) { #dd-toolbar .dd-brand span { display: none; } .dd-tool { width: 46px; } .dd-tool.dd-wide { width: 52px; } }
/* Save: an orange dot while something isn't saved, a tick-green flash once it is. */
#dd-save-btn { position: relative; }
#dd-save-btn.dd-unsaved::after {
    content: ''; position: absolute; top: 3px; right: 4px; width: 11px; height: 11px; border-radius: 50%;
    background: var(--dd-warn); border: 2px solid #ffffff; animation: dd-pop 0.22s ease;
}
#dd-save-btn.dd-just-saved { animation: dd-pop 0.3s ease; filter: brightness(1.08); }

/* Pop-up option cards (brush settings, path, mirror, More). */
.dd-pop { position: absolute; z-index: 10015; width: 270px; padding: 12px 14px; animation: dd-rise 0.18s ease; }
.dd-pop-title { display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 13px; color: var(--dd-text) !important; margin-bottom: 8px; }
#dd-more-menu { width: 300px; }
.dd-more-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.dd-more-grid .dd-btn { justify-content: flex-start; padding: 6px 8px; height: 40px; }

/* Panels: the bag (left) and details (right) fold away to give the map room. */
.dd-panel-head { display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 14px; color: var(--dd-text); }
.dd-panel-head .dd-grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-fold { width: 30px; height: 30px; padding: 0; border-radius: 10px; flex: none; }
.dd-collapsed { width: 52px !important; bottom: auto !important; padding: 8px 6px !important; overflow: hidden !important; cursor: pointer; }
.dd-collapsed > :not(.dd-panel-head) { display: none !important; }
.dd-collapsed .dd-panel-head { flex-direction: column; }
.dd-collapsed .dd-panel-head .dd-grow, .dd-collapsed .dd-panel-head .dd-hide-folded { display: none; }
.dd-tab-chip { flex-wrap: wrap; }
#dd-category-tabs { display: flex; flex-wrap: wrap; gap: 3px; }
#dd-category-tabs .dd-btn { width: 28px; height: 28px; padding: 0; border-radius: 9px; }
.dd-search { position: relative; flex: 1; min-width: 0; }
.dd-search .dd-ico { position: absolute; left: 7px; top: 50%; margin-top: -8px; pointer-events: none; }
.dd-search input { width: 100%; padding-left: 28px !important; height: 32px; border-radius: 16px !important; }

/* Item cards. */
.dd-card {
    background: #ffffff; border: 2px solid var(--dd-line); border-radius: 14px; box-shadow: 0 3px 0 var(--dd-line);
    cursor: pointer; position: relative; overflow: hidden; color: var(--dd-text);
    transition: transform 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease;
}
.dd-card img, .dd-card canvas {
    border-radius: 8px;
    background-color: #f4f2fa;
    background-image: linear-gradient(45deg, #e8e5f1 25%, transparent 25%, transparent 75%, #e8e5f1 75%), linear-gradient(45deg, #e8e5f1 25%, transparent 25%, transparent 75%, #e8e5f1 75%);
    background-size: 12px 12px; background-position: 0 0, 6px 6px;
}
.dd-card:hover { transform: translateY(-2px); border-color: var(--dd-primary); box-shadow: 0 4px 0 #b8dbff; }
.dd-card.selected { border-color: var(--dd-primary); box-shadow: 0 0 0 3px rgba(46, 155, 255, 0.35), 0 3px 0 var(--dd-primary-dark); animation: dd-pop 0.22s ease; }
.dd-card > div { color: var(--dd-text) !important; font-weight: 700; }
.dd-badge { position: absolute; top: 4px; right: 4px; background: var(--dd-warn-soft); border: 2px solid #f2b600; padding: 0 5px; border-radius: 10px; font-size: 10px; color: var(--dd-warn); font-weight: 900; }

/* Fields. */
#dd-asset-workspace-root input[type=text], #dd-asset-workspace-root input[type=number], #dd-asset-workspace-root input[type=search],
#dd-asset-workspace-root select, #dd-asset-workspace-root textarea,
.dd-glass input[type=text], .dd-glass input[type=number], .dd-glass input[type=search], .dd-glass select, .dd-glass textarea {
    font-family: inherit; font-weight: 700; font-size: 12px; color: var(--dd-text) !important;
    background: var(--dd-field) !important; border: 2px solid var(--dd-line) !important; border-radius: 10px !important;
    padding: 4px 8px; outline: none; min-height: 28px;
}
#dd-asset-workspace-root input:focus, #dd-asset-workspace-root select:focus, #dd-asset-workspace-root textarea:focus,
.dd-glass input:focus, .dd-glass select:focus, .dd-glass textarea:focus {
    border-color: var(--dd-primary) !important; background: #ffffff !important; box-shadow: 0 0 0 3px rgba(46, 155, 255, 0.22);
}
.dd-glass input[type=color], #dd-asset-workspace-root input[type=color] {
    -webkit-appearance: none; border: 2px solid var(--dd-line) !important; border-radius: 10px; padding: 2px; background: #fff !important; height: 28px; cursor: pointer;
}
.dd-glass input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
.dd-glass input[type=color]::-webkit-color-swatch { border: none; border-radius: 7px; }
.dd-glass label { color: var(--dd-muted); }

/* Sliders. */
.dd-glass input[type=range] { -webkit-appearance: none; height: 22px; background: transparent !important; border: none !important; padding: 0; cursor: pointer; }
.dd-glass input[type=range]:focus { box-shadow: none; }
.dd-glass input[type=range]::-webkit-slider-runnable-track { height: 8px; border-radius: 8px; background: var(--dd-line); }
.dd-glass input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 18px; height: 18px; margin-top: -5px; border-radius: 50%;
    background: #ffffff; border: 3px solid var(--dd-primary); box-shadow: 0 2px 0 var(--dd-primary-dark);
}
.dd-glass input[type=range]:active::-webkit-slider-thumb { transform: scale(1.15); }

/* Check boxes are on/off switches; radios are round. */
.dd-glass input[type=checkbox] {
    -webkit-appearance: none; width: 34px; height: 20px; margin: 0 2px; border-radius: 20px; flex: none; vertical-align: middle;
    background: #d9d4e7; border: 2px solid #cbc5dc; position: relative; cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;
}
.dd-glass input[type=checkbox]::after {
    content: ''; position: absolute; top: 1px; left: 1px; width: 14px; height: 14px; border-radius: 50%;
    background: #ffffff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); transition: left 0.15s ease;
}
.dd-glass input[type=checkbox]:checked { background: var(--dd-good); border-color: var(--dd-good-dark); }
.dd-glass input[type=checkbox]:checked::after { left: 15px; }
.dd-glass input[type=radio] {
    -webkit-appearance: none; width: 16px; height: 16px; margin: 0 2px; border-radius: 50%; flex: none; vertical-align: middle;
    background: #ffffff; border: 2px solid #cbc5dc; cursor: pointer;
}
.dd-glass input[type=radio]:checked { border: 5px solid var(--dd-primary); }

/* Sections fold open like cards. */
.dd-glass details {
    background: var(--dd-panel-2); border: 2px solid var(--dd-line-soft) !important; border-radius: 14px;
    padding: 6px 10px !important; margin-top: 8px !important;
}
.dd-glass details[open] { background: #ffffff; border-color: var(--dd-line) !important; }
.dd-glass summary {
    list-style: none; cursor: pointer; display: flex; align-items: center; gap: 6px;
    font-weight: 900 !important; font-size: 12px !important; color: var(--dd-text) !important; padding: 2px 0;
}
.dd-glass summary::-webkit-details-marker { display: none; }
.dd-glass summary::before {
    content: ''; flex: none; width: 0; height: 0; border-left: 7px solid var(--dd-primary);
    border-top: 5px solid transparent; border-bottom: 5px solid transparent; transition: transform 0.15s ease;
}
.dd-glass details[open] > summary::before { transform: rotate(90deg); }

/* Scroll bars. */
.dd-glass ::-webkit-scrollbar, #dd-asset-workspace-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.dd-glass ::-webkit-scrollbar-thumb, #dd-asset-workspace-root ::-webkit-scrollbar-thumb { background: #d6d1e6; border-radius: 10px; border: 2px solid #ffffff; }
.dd-glass ::-webkit-scrollbar-track { background: transparent; }

/* Panel insides: labels, and buttons that wrap rather than spill out of narrow panels. */
.dd-label { font-size: 11px; font-weight: 900; color: var(--dd-muted); margin: 2px 0 5px; }
#dd-inspector-content .dd-btn, .dd-glass details .dd-btn { white-space: normal; min-width: 0; text-align: center; }
#dd-inspector-content [style*="display: flex"] { flex-wrap: wrap; }
#dd-inspector-content label[style*="display: flex"] { flex-wrap: nowrap; }
#dd-inspector-content > div[style*="border-top"], .dd-glass > div[style*="border-top"] { border-top: 2px solid var(--dd-line-soft) !important; }

/* The hint bubble, toasts and menus. */
#dd-hint {
    position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); max-width: min(560px, calc(100vw - 140px));
    display: flex; align-items: center; gap: 8px; padding: 6px 14px 6px 8px; border-radius: 22px; font-size: 12px; font-weight: 700;
}
#dd-hint #dd-status-left { color: var(--dd-text); }
.dd-toast {
    position: fixed; top: 84px; left: 50%; transform: translateX(-50%); z-index: 10030; pointer-events: none;
    display: flex; align-items: center; gap: 8px; padding: 8px 16px 8px 10px; border-radius: 22px;
    font-family: var(--dd-font); font-size: 13px; font-weight: 800; color: var(--dd-text); background: #ffffff;
    border: 3px solid var(--dd-primary); box-shadow: 0 4px 0 var(--dd-primary-dark), 0 10px 24px rgba(20, 16, 40, 0.3);
    animation: dd-bounce 0.35s ease; transition: opacity 0.3s ease;
}
.dd-toast.dd-toast-success { border-color: var(--dd-good); box-shadow: 0 4px 0 var(--dd-good-dark), 0 10px 24px rgba(20, 16, 40, 0.3); }
.dd-toast.dd-toast-error { border-color: var(--dd-danger); box-shadow: 0 4px 0 var(--dd-danger-dark), 0 10px 24px rgba(20, 16, 40, 0.3); }
#dd-context-menu { padding: 6px; border-radius: 16px; min-width: 200px; }
#dd-context-menu .dd-btn { border: none; box-shadow: none; background: transparent; justify-content: flex-start; border-radius: 10px; padding: 6px 10px; font-size: 12px; }
#dd-context-menu .dd-btn:hover { background: var(--dd-primary-soft); transform: none; }
#dd-context-menu .dd-btn.dd-danger { color: var(--dd-danger-dark); }
#dd-context-menu .dd-btn.dd-danger:hover { background: var(--dd-danger-soft); }
#dd-context-menu .dd-menu-sep { height: 2px; background: var(--dd-line-soft); margin: 4px 6px; border-radius: 2px; }

/* The welcome card. */
#dd-welcome { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 380px; max-width: calc(100vw - 32px); padding: 18px 20px; z-index: 10040; animation: dd-bounce 0.4s ease; text-align: center; }
#dd-welcome h2 { margin: 6px 0 4px; font-size: 20px; font-weight: 900; color: var(--dd-text); }
#dd-welcome ol { text-align: left; margin: 10px 0 14px; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
#dd-welcome li { display: flex; align-items: center; gap: 10px; background: var(--dd-panel-2); border-radius: 14px; padding: 6px 10px; font-size: 13px; font-weight: 700; }
#dd-welcome li .dd-num { width: 24px; height: 24px; border-radius: 50%; background: var(--dd-primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; flex: none; }

@keyframes dd-pop { 0% { transform: scale(0.92); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
@keyframes dd-bounce { 0% { opacity: 0; transform: translate(-50%, 12px) scale(0.9); } 60% { opacity: 1; transform: translate(-50%, -3px) scale(1.03); } 100% { transform: translate(-50%, 0) scale(1); } }
#dd-welcome { animation-name: dd-bounce-center; }
@keyframes dd-bounce-center { 0% { opacity: 0; transform: translate(-50%, -46%) scale(0.9); } 60% { opacity: 1; transform: translate(-50%, -51%) scale(1.03); } 100% { transform: translate(-50%, -50%) scale(1); } }
@keyframes dd-rise { 0% { opacity: 0; transform: translateY(-6px); } 100% { opacity: 1; transform: translateY(0); } }
`,

    // The look for the page: the editor's font, then the stylesheet with the icon sheet in it.
    // (Letters the font doesn't have, such as Japanese, come from MZ's own rmmz-mainfont.)
    styleText() {
        const url = DocsDoodads.UiIcons ? DocsDoodads.UiIcons.url : '';
        const fonts = DocsDoodads.UiFonts ? DocsDoodads.UiFonts.css + '\n' : '';
        return fonts + this.css.replace(':root {', `:root {\n    --dd-icons: url(${url});`);
    }
};

