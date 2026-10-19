//==========================================================
// SECTION 24f: DocsDoodads.Ui LOOK (SIZE, THEMES, MAP COLOURS)
//==========================================================
// How the editor looks on this computer: its size (100, 125 or 150%), a light, dark or high-contrast
// theme, and map colours (selection, guides, brushes, collision) that stay apart for colour-blind eyes.
// The themes are only values for the --dd-* colours, set on the page's root element.
DocsDoodads.Ui.css += `
:root[data-dd-theme="dark"] {
    --dd-panel: #24203a; --dd-panel-2: #2b2644; --dd-field: #1b1830; --dd-line: #3f3960; --dd-line-soft: #332e4f;
    --dd-text: #f1eefb; --dd-muted: #bcb5d6; --dd-faint: #8f88aa; --dd-primary-soft: #1c3554; --dd-good-soft: #173a28;
    --dd-danger-soft: #4a2028; --dd-warn-soft: #463a10; --dd-tint: rgba(46, 155, 255, 0.16); --dd-rim: #3f3960;
    --dd-primary-line: #1c4f86; --dd-check-a: #2b2644; --dd-check-b: #35304f; --dd-switch-off: #4a4466; --dd-switch-line: #5a5379;
    --dd-scroll: #4a4466; --dd-shadow: 0 4px 0 rgba(0, 0, 0, 0.35), 0 12px 30px rgba(0, 0, 0, 0.5);
}
:root[data-dd-theme="contrast"] {
    --dd-panel: #ffffff; --dd-panel-2: #ffffff; --dd-field: #ffffff; --dd-line: #2f2a43; --dd-line-soft: #2f2a43;
    --dd-text: #000000; --dd-muted: #1f1b2e; --dd-faint: #3a3550; --dd-primary: #0059c9; --dd-primary-dark: #003d8f;
    --dd-primary-soft: #dbe9ff; --dd-good: #0a7d3b; --dd-good-dark: #05582a; --dd-danger: #c4141b; --dd-danger-dark: #8e0b10;
    --dd-warn: #8a5a00; --dd-rim: #000000; --dd-primary-line: #003d8f; --dd-check-a: #ffffff; --dd-check-b: #d6d6d6;
    --dd-switch-off: #8c8c8c; --dd-switch-line: #2f2a43; --dd-scroll: #2f2a43;
}
:root[data-dd-theme="contrast"] .dd-glass, :root[data-dd-theme="contrast"] .dd-btn { border-width: 3px; }
:root[data-dd-theme="contrast"] .dd-btn:focus-visible { box-shadow: 0 0 0 3px #000000; }
:root[data-dd-theme="contrast"]:not(.dd-mouse-focus) .dd-btn:focus { box-shadow: 0 0 0 3px #000000; }
:root[data-dd-theme="contrast"] .dd-glass input:focus { box-shadow: 0 0 0 3px #000000; }
:root[data-dd-theme="dark"] .dd-btn-active, :root[data-dd-theme="dark"] .dd-badge { color: #fff4c9 !important; }
.dd-dialog { zoom: var(--dd-scale, 1); }
`;

Object.assign(DocsDoodads.Ui, {
    scales: [1, 1.25, 1.5],
    themes: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'contrast', label: 'High contrast' }
    ],

    // Map colours (PIXI numbers). 'safe' uses the Okabe-Ito colours, which stay apart for the common kinds of
    // colour blindness (red-green and blue-yellow).
    mapPalettes: {
        standard: {
            selection: 0x38bdf8, selection3d: 0xfacc15, warning: 0xef4444, guideAlign: 0xec4899, guideSpacing: 0xf59e0b, guideTile: 0x14b8a6, mirror: 0xa78bfa,
            path: 0x22d3ee, pathCorner: 0xf59e0b, added: 0x4ade80, changed: 0xfbbf24, removed: 0xf87171,
            brushPaint: 0x22c55e, brushErase: 0xef4444, blocked: 0xef4444,
            raise: 0x22c55e, lower: 0xf97316, flatten: 0x38bdf8, set: 0xa855f7, erase: 0xef4444,
            full: 0xef4444, bottomHalf: 0xf97316, bottomThird: 0xeab308, center: 0x22c55e, trunk: 0x14b8a6,
            thinWall: 0x3b82f6, wideWall: 0x8b5cf6, custom: 0xec4899
        },
        safe: {
            selection: 0x56b4e9, selection3d: 0xf0e442, warning: 0xd55e00, guideAlign: 0xcc79a7, guideSpacing: 0xe69f00, guideTile: 0x009e73, mirror: 0x0072b2,
            path: 0x56b4e9, pathCorner: 0xe69f00, added: 0x009e73, changed: 0xf0e442, removed: 0xd55e00,
            brushPaint: 0x009e73, brushErase: 0xd55e00, blocked: 0xd55e00,
            raise: 0x009e73, lower: 0xe69f00, flatten: 0x56b4e9, set: 0xcc79a7, erase: 0xd55e00,
            full: 0xd55e00, bottomHalf: 0xe69f00, bottomThird: 0xf0e442, center: 0x009e73, trunk: 0x56b4e9,
            thinWall: 0x0072b2, wideWall: 0xcc79a7, custom: 0xbbbbbb
        }
    },

    // What each map colour means, for the key in Look.
    mapColorMeanings: [
        ['selection', 'Picked doodads'], ['selection3d', 'Picked doodads (3D)'], ['warning', 'Doodad on a slope (3D)'], ['guideAlign', 'Lined up with a doodad'], ['guideSpacing', 'Equal spacing'],
        ['guideTile', 'On a tile line'], ['mirror', 'Mirror line'], ['brushPaint', 'Scatter: paint'], ['brushErase', 'Scatter: erase'],
        ['raise', 'Hills: raise'], ['lower', 'Hills: lower'], ['added', 'Old Saves: added'], ['changed', 'Old Saves: changed'],
        ['removed', 'Old Saves: removed'], ['blocked', 'Tile a doodad blocks']
    ],

    uiScale() {
        const s = Number(this.prefs().uiScale);
        return this.scales.includes(s) ? s : 1;
    },

    theme() {
        const t = this.prefs().theme;
        return this.themes.some(x => x.value === t) ? t : 'light';
    },

    mapColorMode() {
        return this.prefs().mapColors === 'safe' ? 'safe' : 'standard';
    },

    mapColor(name) {
        const palette = this.mapPalettes[this.mapColorMode()];
        return palette[name] !== undefined ? palette[name] : this.mapPalettes.standard[name];
    },

    // The theme and size on the page: data-dd-theme and --dd-scale on the root element.
    applyLook() {
        const root = typeof document !== 'undefined' ? document.documentElement : null;
        if (!root) return;
        const theme = this.theme();
        if (root.setAttribute && root.removeAttribute) {
            if (theme === 'light') root.removeAttribute('data-dd-theme'); else root.setAttribute('data-dd-theme', theme);
        }
        if (root.style && root.style.setProperty) root.style.setProperty('--dd-scale', String(this.uiScale()));
    }
});
