//==========================================================
// SECTION 24f2: DocsDoodads.Ui PLAYFUL THEME
//==========================================================
// An opt-in theme under Look, in the style of the Character Creator: cream cards, teal and coral, sunny
// yellow for what is picked, rounder corners and pill buttons that press down further. Like the other
// themes its colours are only --dd-* values; a few shape rules follow, all under the same attribute.
// Filled buttons keep white text at 4.5:1 or better, so the bright teal is used for lines and glows.
DocsDoodads.Ui.css += `
:root[data-dd-theme="playful"] {
    --dd-panel: #fffaf0; --dd-panel-2: #fff3dc; --dd-field: #fbefd6; --dd-line: #ecd9ad; --dd-line-soft: #f3e6c6;
    --dd-text: #3a2e4d; --dd-muted: #685a7d; --dd-faint: #9a8a74; --dd-accent: #19b6a4;
    --dd-primary: #0b8174; --dd-primary-dark: #075f55; --dd-primary-soft: #d9f4ef; --dd-primary-line: #9fdcd2;
    --dd-good: #2b8022; --dd-good-dark: #1f6418; --dd-good-soft: #e3f6dc;
    --dd-danger: #c8472c; --dd-danger-dark: #9e3218; --dd-danger-soft: #ffe6dd; --dd-warn: #9a6a00; --dd-warn-soft: #fff1c2;
    --dd-rim: #f0e2c0; --dd-check-a: #fff6e2; --dd-check-b: #f6e7c4; --dd-switch-off: #e2d4b4; --dd-switch-line: #d2c29c;
    --dd-scroll: #e0cfa6; --dd-tint: rgba(25, 182, 164, 0.12);
    --dd-shadow: 0 6px 0 #ecd9ad, 0 14px 30px rgba(58, 46, 77, 0.28);
}
:root[data-dd-theme="playful"] .dd-glass { border-radius: 26px; }
:root[data-dd-theme="playful"] .dd-dialog {
    background-image: radial-gradient(var(--dd-line-soft) 1.5px, transparent 1.5px); background-size: 22px 22px;
}
:root[data-dd-theme="playful"] .dd-btn { border-radius: 999px; padding: 6px 14px; box-shadow: 0 4px 0 var(--dd-line); }
:root[data-dd-theme="playful"] .dd-btn:hover { border-color: var(--dd-accent); box-shadow: 0 4px 0 var(--dd-primary-line); }
:root[data-dd-theme="playful"] .dd-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--dd-line); }
:root[data-dd-theme="playful"] .dd-btn:focus-visible { box-shadow: 0 0 0 4px #ffc93c, 0 4px 0 var(--dd-line); }
:root[data-dd-theme="playful"] .dd-btn-primary { box-shadow: 0 4px 0 var(--dd-primary-dark); }
:root[data-dd-theme="playful"] .dd-btn-primary:hover { background: #0e9282; box-shadow: 0 4px 0 var(--dd-primary-dark); }
:root[data-dd-theme="playful"] .dd-btn-good:hover { background: #31902a; }
:root[data-dd-theme="playful"] .dd-btn-danger:hover { background: #d14b2f; }
:root[data-dd-theme="playful"] .dd-btn-active, :root[data-dd-theme="playful"] .dd-btn.dd-btn-active {
    background: #ffe08a !important; border-color: #f2b600 !important; box-shadow: 0 4px 0 #d9a21c !important;
}
:root[data-dd-theme="playful"] .dd-pop-title, :root[data-dd-theme="playful"] #dd-welcome h2 { font-weight: 900; letter-spacing: 0.2px; }
:root[data-dd-theme="playful"] .dd-glass input:focus, :root[data-dd-theme="playful"] .dd-glass select:focus { outline: 3px solid #ffc93c; outline-offset: 1px; }
`;

DocsDoodads.Ui.themes.push({ value: 'playful', label: 'Playful' });
