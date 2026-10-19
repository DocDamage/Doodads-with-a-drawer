//==========================================================
// SECTION 24f: THE EDITOR'S LANGUAGE
//==========================================================
// The editor is written in English. A translation is a file in data/DocsDoodadsLanguages/<code>.json:
// { "language": "Deutsch", "strings": { "Save everything": "Alles speichern", "Placed {n} doodad(s)": "..." } }
// keyed by the English words. Words with {name} in them match any value there and carry it over. When a
// language other than English is picked (More > Look), the editor's panels, cards, tooltips and messages
// are shown in it; anything not translated stays English. npm run strings writes languages/template.json
// with every English string found in the editor's parts, for a translator to fill in.
DocsDoodads.I18n = {
    folder: 'data/DocsDoodadsLanguages',
    lang: 'en',
    name: 'English',
    exact: {},
    patterns: [],
    attributes: ['title', 'placeholder', 'aria-label', 'data-dd-tip'],

    // [{ code, name }]: English and every language file in the folder.
    available() {
        const out = [{ code: 'en', name: 'English' }];
        const FS = DocsDoodads.FS;
        try {
            if (!FS.fs || !FS.existsSync(this.folder)) return out;
            for (const file of FS.fs.readdirSync(this.folder).filter(f => /^[\w-]+\.json$/i.test(f)).sort()) {
                const code = file.replace(/\.json$/i, '');
                if (code === 'en') continue;
                const data = FS.readJson(FS.path.join(this.folder, file));
                out.push({ code, name: (data && data.language) || code });
            }
        } catch (e) {}
        return out;
    },

    // Takes a table ({ language, strings }); English words with {name} become patterns.
    use(code, table) {
        this.lang = code || 'en';
        this.name = (table && table.language) || (this.lang === 'en' ? 'English' : this.lang);
        this.exact = {};
        this.patterns = [];
        const strings = table && table.strings && typeof table.strings === 'object' ? table.strings : {};
        for (const key of Object.keys(strings)) {
            const value = strings[key];
            if (typeof value !== 'string' || !value.trim()) continue;
            if (/\{\w+\}/.test(key)) {
                const names = [];
                const source = key.split(/(\{\w+\})/).map(part => {
                    const m = /^\{(\w+)\}$/.exec(part);
                    if (m) { names.push(m[1]); return '(.+?)'; }
                    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }).join('');
                this.patterns.push({ re: new RegExp('^' + source + '$'), names, value });
            } else {
                this.exact[key] = value;
            }
        }
        return this.lang;
    },

    // Reads data/DocsDoodadsLanguages/<code>.json; 'en' (or a file that can't be read) is English.
    load(code) {
        if (!code || code === 'en') return this.use('en', null);
        const FS = DocsDoodads.FS;
        const table = FS.readJson(FS.path ? FS.path.join(this.folder, code + '.json') : this.folder + '/' + code + '.json');
        return table ? this.use(code, table) : this.use('en', null);
    },

    active() {
        return this.lang !== 'en' && (Object.keys(this.exact).length > 0 || this.patterns.length > 0);
    },

    // The words in the editor's language, with {name} values filled in from vars.
    t(text, vars) {
        let s = String(text === undefined || text === null ? '' : text);
        if (this.active()) {
            const key = s.trim();
            if (this.exact[key] !== undefined) s = s.replace(key, this.exact[key]);
            else {
                for (const p of this.patterns) {
                    const m = p.re.exec(key);
                    if (!m) continue;
                    let out = p.value;
                    p.names.forEach((n, i) => { out = out.split('{' + n + '}').join(m[i + 1]); });
                    s = s.replace(key, out);
                    break;
                }
            }
        }
        if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
        return s;
    },

    // Translates the text and the tooltip-like attributes under a node. Already-translated words don't
    // match English keys, so running it again changes nothing.
    translateTree(root) {
        if (!this.active() || !root) return 0;
        let n = 0;
        const walk = node => {
            if (!node) return;
            if (node.nodeType === 3) {
                const text = node.nodeValue || '';
                if (text.trim()) {
                    const next = this.t(text);
                    if (next !== text) { node.nodeValue = next; n++; }
                }
                return;
            }
            if (node.nodeType === 1) {
                const tag = String(node.tagName || '').toUpperCase();
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS') return;
                // What someone typed is theirs.
                if ((tag === 'INPUT' || tag === 'TEXTAREA') && node.type !== 'button' && node.type !== 'submit') {
                    this.translateAttributes(node) && n++;
                    return;
                }
                if (this.translateAttributes(node)) n++;
            }
            const kids = node.childNodes || [];
            for (let i = 0; i < kids.length; i++) walk(kids[i]);
        };
        walk(root);
        return n;
    },

    translateAttributes(el) {
        if (!el.getAttribute) return false;
        let changed = false;
        for (const a of this.attributes) {
            const v = el.getAttribute(a);
            if (!v) continue;
            const next = this.t(v);
            if (next !== v) { el.setAttribute(a, next); changed = true; }
        }
        return changed;
    }
};
