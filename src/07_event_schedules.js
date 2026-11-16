//==========================================================
// SECTION 5C3: EVENT SCHEDULE RULES
//==========================================================
// Event notes and current-page comments may contain a <docs schedule> block. These functions are deliberately
// independent of Game_Event: the runtime below supplies the clock and the editor uses the same parser and writer.
DocsDoodads.Schedules = {
    _on: true,
    revision: 0,

    enabled() { return this._on !== false; },
    setEnabled(on) {
        const value = Boolean(on);
        if (this._on !== value) { this._on = value; this.revision++; }
        return value;
    },
    reset() { this._on = true; this.revision++; return true; },

    blocks(text) {
        const out = [], re = /<\s*docs\s+schedule\s*>([\s\S]*?)<\s*\/\s*docs\s+schedule\s*>/gi;
        let match;
        while ((match = re.exec(String(text || '')))) out.push(match[1]);
        return out;
    },

    blockText(text) { return this.blocks(text).map(s => s.trim()).filter(Boolean).join('\n'); },

    dayIndex(name, weekdayNames) {
        const wanted = String(name || '').trim().toLowerCase();
        if (!wanted) return -1;
        const names = (weekdayNames || []).map(n => String(n || '').trim().toLowerCase());
        const exact = names.indexOf(wanted);
        if (exact >= 0) return exact;
        const prefix = [];
        for (let i = 0; i < names.length; i++) if (names[i].startsWith(wanted)) prefix.push(i);
        return prefix.length === 1 ? prefix[0] : -1;
    },

    parse(text, weekdayNames) {
        const entries = [], errors = [];
        let lineNumber = 0, order = 0;
        const names = Array.isArray(weekdayNames) ? weekdayNames : null;
        for (const block of this.blocks(text)) {
            for (const source of block.split(/\r?\n/)) {
                const line = source.trim();
                if (!line) continue;
                lineNumber++;
                const match = /^(?:(.*?)\s+)?([01]?\d|2[0-3]):([0-5]\d)\s+(\d+)\s*,\s*(\d+)(?:\s+(.*))?$/.exec(line);
                if (!match) { errors.push({ line: lineNumber, text: line, message: 'Use [weekdays] HH:MM x,y [walk] [hide] [face:2|4|6|8].' }); continue; }
                const days = match[1] ? match[1].split(',').map(s => s.trim()).filter(Boolean) : null;
                if (match[1] && (!days || !days.length)) { errors.push({ line: lineNumber, text: line, message: 'A weekday name is missing.' }); continue; }
                if (names && days) {
                    const unknown = days.find(day => this.dayIndex(day, names) < 0);
                    if (unknown) { errors.push({ line: lineNumber, text: line, message: 'Unknown or ambiguous weekday: ' + unknown }); continue; }
                }
                let walk = false, hide = false, face = 0, bad = '';
                for (const word of String(match[6] || '').trim().split(/\s+/).filter(Boolean)) {
                    if (/^walk$/i.test(word)) walk = true;
                    else if (/^hide$/i.test(word)) hide = true;
                    else if (/^face:[2468]$/i.test(word)) face = Number(word.slice(5));
                    else { bad = word; break; }
                }
                if (bad || (walk && hide)) {
                    errors.push({ line: lineNumber, text: line, message: bad ? 'Unknown option: ' + bad : 'An entry cannot both walk and hide.' });
                    continue;
                }
                const entry = { days, minutes: Number(match[2]) * 60 + Number(match[3]), x: Number(match[4]), y: Number(match[5]),
                    walk, hide, face, order: order++ };
                entry.key = entry.order + '|' + this.formatEntry(entry);
                entries.push(entry);
            }
        }
        entries.errors = errors;
        return entries;
    },

    applies(entry, weekday, weekdayNames) {
        if (!entry.days || !entry.days.length) return true;
        return entry.days.some(day => this.dayIndex(day, weekdayNames) === weekday);
    },

    // Before the first matching entry today, only yesterday carries over. If yesterday has no entry, the event
    // uses its ordinary map position; we intentionally do not search farther back through the week.
    current(entries, minutes, weekdayIndex, weekdayNames) {
        const names = Array.isArray(weekdayNames) && weekdayNames.length ? weekdayNames : ['Monday'];
        const now = Math.max(0, Math.min(1439, Math.floor(Number(minutes) || 0)));
        const today = ((Math.floor(Number(weekdayIndex) || 0) % names.length) + names.length) % names.length;
        const yesterday = (today + names.length - 1) % names.length;
        let best = null, score = -Infinity;
        for (const entry of entries || []) {
            let candidate = -Infinity;
            if (this.applies(entry, today, names) && entry.minutes <= now) candidate = entry.minutes;
            else if (this.applies(entry, yesterday, names)) candidate = entry.minutes - 1440;
            if (candidate > score || (candidate === score && candidate > -Infinity && (!best || entry.order > best.order))) {
                best = entry; score = candidate;
            }
        }
        return best;
    },

    formatTime(minutes) {
        const value = Math.max(0, Math.min(1439, Math.floor(Number(minutes) || 0)));
        return String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
    },

    formatEntry(entry) {
        const parts = [];
        if (entry.days && entry.days.length) parts.push(entry.days.join(','));
        parts.push(this.formatTime(entry.minutes), Math.max(0, Math.floor(Number(entry.x) || 0)) + ',' + Math.max(0, Math.floor(Number(entry.y) || 0)));
        if (entry.walk) parts.push('walk');
        if (entry.hide) parts.push('hide');
        if ([2, 4, 6, 8].includes(Number(entry.face))) parts.push('face:' + Number(entry.face));
        return parts.join(' ');
    },

    format(entries) { return (entries || []).map(entry => this.formatEntry(entry)).join('\n'); },

    strip(text) { return String(text || '').replace(/<\s*docs\s+schedule\s*>[\s\S]*?<\s*\/\s*docs\s+schedule\s*>/gi, '').replace(/\n{3,}/g, '\n\n').trim(); },

    write(text, entries) {
        const base = this.strip(text), body = this.format(entries);
        if (!body) return base;
        const block = '<docs schedule>\n' + body + '\n</docs schedule>';
        return base ? base + '\n' + block : block;
    },

    eventDataText(event, pageIndex) {
        if (!event) return '';
        const lines = [String(event.note || '')], pages = event.pages || [];
        const page = pages[Math.max(0, Number(pageIndex) || 0)] || pages[0];
        for (const command of (page && page.list) || []) {
            if (command && (command.code === 108 || command.code === 408)) lines.push(String((command.parameters || [])[0] || ''));
        }
        return lines.join('\n');
    },

    // Move schedule blocks out of current-page comment command groups before the editor writes the canonical
    // note block. Other comment text and the commands themselves remain in place.
    stripCommentBlocks(event) {
        let changed = false;
        for (const page of (event && event.pages) || []) {
            const list = page.list || [];
            for (let i = 0; i < list.length; i++) {
                if (!list[i] || list[i].code !== 108) continue;
                let end = i + 1;
                while (end < list.length && list[end] && list[end].code === 408) end++;
                const group = list.slice(i, end), before = group.map(c => String((c.parameters || [])[0] || '')).join('\n');
                if (!this.blocks(before).length) { i = end - 1; continue; }
                const after = this.strip(before);
                if (after !== before.trim()) {
                    changed = true;
                    const lines = after ? after.split(/\r?\n/) : [];
                    group.forEach((command, index) => {
                        command.parameters = command.parameters || [''];
                        command.parameters[0] = lines[index] || '';
                    });
                }
                i = end - 1;
            }
        }
        return changed;
    },

    of(event, weekdayNames) {
        if (!event || typeof event.event !== 'function' || !event.event()) { const empty = []; empty.errors = []; return empty; }
        const names = weekdayNames || (DocsDoodads.Calendar ? DocsDoodads.Calendar.weekdayNames() : []);
        const VE = DocsDoodads.VisualEquip;
        const text = VE && VE.eventText ? VE.eventText(event) : this.eventDataText(event.event(), event._pageIndex);
        const key = text + '\u0000' + names.join('\u0000');
        const cache = this._cache || (this._cache = typeof WeakMap !== 'undefined' ? new WeakMap() : null);
        const hit = cache ? cache.get(event) : null;
        if (hit && hit.key === key) return hit.entries;
        const entries = this.parse(text, names);
        if (cache) cache.set(event, { key, entries });
        return entries;
    },

    invalidate(event) { if (this._cache && event) this._cache.delete(event); }
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'pauseSchedules', args => {
        DocsDoodads.Schedules.setEnabled(String(args.on) !== 'false');
    });
}
