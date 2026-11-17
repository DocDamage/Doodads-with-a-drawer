// @editor-only
// Translations change these aliases, never the canonical commands they are allowed to select.
DocsDoodads.PlainWords = {
    phrases: [
        { label: 'night|nighttime|at night', command: 'time 21:00', group: 'time' },
        { label: 'morning|sunrise|dawn', command: 'time 06:00', group: 'time' },
        { label: 'daytime|noon|midday', command: 'time 12:00', group: 'time' },
        { label: 'evening|sunset|dusk', command: 'time 18:00', group: 'time' },
        { label: 'rain|rainy|raining', command: 'weather rain', group: 'weather' },
        { label: 'snow|snowy|snowing', command: 'weather snow', group: 'weather' },
        { label: 'storm|stormy|thunderstorm', command: 'weather storm', group: 'weather' },
        { label: 'no rain|clear weather|stop raining', command: 'weather none', group: 'weather' },
        { label: 'fog|foggy|misty', command: 'fog on', group: 'fog' },
        { label: 'no fog|clear fog|remove fog', command: 'fog off', group: 'fog' },
        { label: 'darker|more dark|dim it', command: 'darkness darker', group: 'darkness' },
        { label: 'brighter|lighter|less dark', command: 'darkness brighter', group: 'darkness' },
        { label: 'bigger|larger|bigger editor', command: 'size bigger', group: 'size' },
        { label: 'smaller|smaller editor', command: 'size smaller', group: 'size' }
    ],
    filler: { label: 'please|make|it|a|an|the|map|and|then|look|feel|with|some' },
    tokens(text) { return String(text || '').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []; },
    parse(text, translate = value => value) {
        if (typeof text !== 'string' || text.length > 256) return [];
        const words = this.tokens(text);
        if (!words.length || words.length > 40) return [];
        const aliases = label => [label, String(translate(label) || '')].join('|').slice(0, 2048).split('|').slice(0, 48)
            .map(value => this.tokens(value)).filter(value => value.length && value.length <= 10);
        const entries = [];
        for (const row of this.phrases) for (const tokens of aliases(row.label)) entries.push({ row, tokens });
        entries.sort((a, b) => b.tokens.length - a.tokens.length);
        const filler = new Set(aliases(this.filler.label).reduce((all, value) => all.concat(value), []));
        const selected = new Map();
        for (let i = 0; i < words.length;) {
            const hit = entries.find(entry => entry.tokens.every((word, offset) => words[i + offset] === word));
            if (hit) {
                const prior = selected.get(hit.row.group);
                if (prior && prior.command !== hit.row.command) return [];
                selected.set(hit.row.group, { command: hit.row.command, group: hit.row.group });
                i += hit.tokens.length;
            } else if (filler.has(words[i])) i++;
            else return []; // Never execute a partially understood line.
        }
        // Weather previews snapshot authored settings, so apply those settings before starting weather.
        const order = ['time', 'darkness', 'fog', 'size', 'weather'];
        return Array.from(selected.values()).sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
    }
};
