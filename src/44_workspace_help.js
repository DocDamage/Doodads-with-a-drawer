// @editor-only
DocsDoodads.Help = {
    panels: [
        ['item bag', '4. The Item Bag'], ['details', '7. Depth'], ['collision', '16. Direct Physical'],
        ['map settings', 'Map settings: copying'], ['moods', 'Looks and presets'],
        ['regions', 'Regions'], ['tiles', 'Tiles (painting'], ['hills', 'Terrain height'],
        ['terrain', 'Terrain height'], ['world view', '19. Maps:'], ['screen looks', '9. Post-Processing'],
        ['capture', 'Export Map Image'], ['effects maker', 'Effects Maker (VFX)'], ['characters', 'Character animation'],
        ['cut up sheet', '5. Intelligent Slicing'], ['sound', '11. Spatial Sound'],
        ['old saves', 'Save history'], ['steps', 'Undo history'], ['notes', 'Map notes'], ['bookmarks', 'Ruler and bookmarks'],
        ['look', '21. Workspace Layouts'], ['settings', '3. Plugin Parameters'], ['path', '6. Drag-and-Drop'],
        ['scatter', 'Biome brush'], ['biome', 'Biome brush'], ['paint', 'Biome brush'], ['mirror', 'Symmetry'],
        ['template', '15. Genuine'], ['rooms', '12. Editor Tools'], ['find', 'Command palette'],
        ["this map's doodads", '6. Drag-and-Drop'], ['file check', '20. Asset Management'], ['doodad or event', '15. Genuine'],
        ['add files', '18. Windows Explorer'], ['info', '24. Troubleshooting'], ['bring back a backup', '22. Project Safety'],
        ['tile ', '11. Spatial Sound'], ['problems', '22. Project Safety'], ['packs', '20. Asset Management'],
        ['messages', '24. Troubleshooting'], ['keyboard shortcuts', '23. Complete Keyboard'],
        ['map', '12. Editor Tools', true], ['art', '20. Asset Management', true],
        ['view', '21. Workspace Layouts', true], ['more', '12. Editor Tools', true]
    ].map(row => ({ words: row[0], exact: Boolean(row[2]), anchor: (DocsDoodads.HelpIndex.find(h => h.title.indexOf(row[1]) === 0) || {}).anchor })),

    entry(anchor) { return DocsDoodads.HelpIndex.find(h => h.anchor === anchor) || null; },
    anchorFor(title) {
        const text = String(title || '').toLowerCase().trim();
        const panel = this.panels.find(p => p.exact ? text === p.words : text.includes(p.words));
        return panel ? panel.anchor : null;
    },

    decorate(root) {
        if (!root || !root.querySelectorAll) return;
        const selector = '[data-dd-help], .dd-panel-head, .dd-pop-title';
        const heads = Array.from(root.querySelectorAll(selector));
        if (root.matches && root.matches(selector)) heads.unshift(root);
        for (const head of heads) {
            if (!head.querySelector || head.querySelector('.dd-context-help') || head.id === 'dd-context-help-head') continue;
            const title = String(head.textContent || head.title || '').toLowerCase();
            const anchor = head.getAttribute('data-dd-help') || this.anchorFor(title);
            if (!this.entry(anchor)) continue;
            head.setAttribute('data-dd-help', anchor);
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'dd-btn dd-context-help'; button.textContent = '?';
            button.title = 'Help for this panel'; button.setAttribute('aria-label', 'Help for this panel');
            button.onclick = e => { e.preventDefault(); e.stopPropagation(); this.show(anchor); };
            head.appendChild(button);
        }
    },

    install() {
        if (typeof document === 'undefined' || !editorMode || !DocsDoodads.Compat.isTest()) return;
        this.uninstall(); this.decorate(document);
        if (typeof MutationObserver !== 'undefined') {
            this.observer = new MutationObserver(changes => {
                for (const change of changes) for (const node of Array.from(change.addedNodes)) if (node.nodeType === 1) this.decorate(node);
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
        }
    },
    uninstall() {
        if (this.observer) this.observer.disconnect();
        this.observer = null;
        this.close();
    },
    close() {
        const card = typeof document !== 'undefined' ? document.getElementById('dd-context-help') : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
    },
    show(anchor) {
        if (!editorMode || !DocsDoodads.Compat.isTest() || typeof document === 'undefined') return null;
        const entry = this.entry(anchor);
        if (!entry) return null;
        this.close();
        const card = document.createElement('div');
        card.id = 'dd-context-help'; card.className = 'dd-glass';
        card.style.cssText = 'position:fixed;top:100px;left:50%;transform:translateX(-50%);z-index:10070;width:380px;max-width:85vw;max-height:75vh;overflow:auto;padding:16px;';
        const title = document.createElement('h2'); title.id = 'dd-context-help-head'; title.textContent = entry.title; card.appendChild(title);
        const paragraph = document.createElement('p'); paragraph.textContent = entry.firstParagraph || 'Open the guide to read this section.'; card.appendChild(paragraph);
        for (const [text, run] of [['Open the Guide', () => this.openGuide(anchor)], ['Close', () => this.close()]]) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'dd-btn';
            button.textContent = text; button.onclick = run; card.appendChild(button);
        }
        document.body.appendChild(card);
        return card;
    },
    openGuide(anchor) {
        const F = DocsDoodads.FS;
        if (!editorMode || !DocsDoodads.Compat.isTest() || !F.fs || !F.path || !this.entry(anchor)) return false;
        try {
            const text = F.readFileSync('Docs_Doodads_Guide.md');
            if (!text) throw new Error('Put Docs_Doodads_Guide.md in the game folder first.');
            const esc = DocsDoodads.Security.escapeHtml;
            let heading = 0, fenced = false;
            const body = String(text).split(/\r?\n/).map(line => {
                if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
                if (!fenced && /^#{1,6}\s+/.test(line)) {
                    const entry = DocsDoodads.HelpIndex[heading++];
                    if (entry) return '<h2 id="' + esc(entry.anchor) + '">' + esc(entry.title) + '</h2>';
                }
                return esc(line) + '\n';
            }).join('');
            const folder = 'data/docs_doodads_cache/help'; F.mkdirp(folder);
            const file = folder + '/guide.html';
            F.atomicWriteFile(file, '<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><title>Doc\'s Doodads Guide</title><style>body{max-width:70em;margin:3em auto;padding:1em;font:16px/1.6 sans-serif;white-space:pre-wrap}h2{white-space:normal}</style>' + body, 'utf8');
            if (typeof nw === 'undefined' || !nw.Shell || !nw.Shell.openExternal) throw new Error('Open Docs_Doodads_Guide.md in a reader on this computer.');
            nw.Shell.openExternal(require('url').pathToFileURL(F.path.resolve(file)).href + '#' + encodeURIComponent(anchor));
            return true;
        } catch (error) { DocsDoodads.Workspace.showToast(String(error.message || error), 'info'); return false; }
    }
};
