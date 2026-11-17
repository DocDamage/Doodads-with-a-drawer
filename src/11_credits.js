// @editor-only
// The ledger records the maker's statements; it never infers permissions from a licence name or text.
DocsDoodads.Credits = {
    licences: ['CC0', 'CC-BY 4.0', 'CC-BY-SA 4.0', 'OGA-BY 3.0', "Bought: see the shop's terms", 'My own'],
    path(value, folder = false) {
        const p = String(value || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
        if (!/^(?:img|audio|models|movies|effects)(?:\/|$)/i.test(p) || /[:\x00-\x1f]/.test(p) || p.split('/').some(s => !s || s === '.' || s === '..')) return null;
        return folder || p.includes('/') ? p : null;
    },
    normalize(credit) {
        if (!credit || typeof credit !== 'object') return null;
        const clean = (value, limit, multiline) => String(value || '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').replace(/\r\n?/g, '\n')
            .replace(multiline ? /[\t ]+$/gm : /\s+/g, multiline ? '' : ' ').trim().slice(0, limit);
        const out = { author: clean(credit.author, 512), licence: clean(credit.licence, 256), source: clean(credit.source, 2048), note: clean(credit.note, 65536, true) };
        return Object.values(out).some(Boolean) ? out : null;
    },
    of(file, metadata = {}) {
        const path = this.path(file);
        if (!path) return null;
        const key = path.toLowerCase(), assets = metadata.assets || {}, folders = metadata.folderCredits || {};
        const own = this.normalize(assets[key] && assets[key].credit) || this.normalize((metadata.fileCredits || {})[key]);
        if (own) return own;
        let folder = key.slice(0, key.lastIndexOf('/'));
        while (folder) {
            const credit = this.normalize(folders[folder]);
            if (credit) return credit;
            const slash = folder.lastIndexOf('/');
            folder = slash < 0 ? '' : folder.slice(0, slash);
        }
        return null;
    },
    complete(credit) { return Boolean(credit && credit.author && credit.licence); },
    missing(list) { return (list || []).filter(row => !this.complete(row.credit)); },
    text(list) {
        const groups = new Map();
        for (const row of (list || []).slice().sort((a, b) => String(a.path).localeCompare(String(b.path)))) {
            const credit = this.normalize(row.credit) || { author: '', licence: '', source: '', note: '' };
            const key = JSON.stringify([credit.author, credit.licence]);
            if (!groups.has(key)) groups.set(key, { credit, files: [], sources: new Set(), notes: new Set() });
            const group = groups.get(key);
            group.files.push(row.path);
            if (credit.source) group.sources.add(credit.source);
            if (credit.note) group.notes.add(credit.note);
        }
        const lines = ['ART CREDITS', '', 'Credit information recorded by the project maker.', ''];
        for (const group of [...groups.values()].sort((a, b) => (a.credit.author + a.credit.licence).localeCompare(b.credit.author + b.credit.licence))) {
            lines.push(group.credit.author || 'Author not recorded', 'Licence: ' + (group.credit.licence || 'not recorded'));
            for (const file of group.files) lines.push('  ' + file);
            for (const source of group.sources) lines.push('Source: ' + source);
            for (const note of group.notes) lines.push('Note: ' + note);
            lines.push('');
        }
        if (!groups.size) lines.push('(No referenced art found.)', '');
        return lines.join('\n');
    },
    notesFromFiles(files) {
        const out = [];
        for (const file of files || []) {
            const name = String(file.name || '').replace(/\\/g, '/');
            if (!this.noteFile(name) || !file.data || file.data.length > 65536) continue;
            const note = new TextDecoder('utf-8').decode(file.data).replace(/\x00/g, '').trim();
            if (note) out.push({ name, note: note.slice(0, 65536) });
            if (out.length >= 20) break;
        }
        return out;
    },
    noteFile(name) {
        return /(?:^|\/)(?:licen[cs]e|copying|credits?|readme)(?:[._ -][^/]*)?$/i.test(String(name || '').replace(/\\/g, '/'));
    }
};
