// @editor-only
DocsDoodads.DetailsShort = {
    defaults: {
        picture: ['Placement', 'Appearance', 'Motion'],
        light: ['Placement', 'Appearance', 'Light'],
        sound: ['Placement', 'Appearance', 'Sound'],
        model: ['Placement', 'Appearance', '3D Model'],
        event: ['Position', 'Trigger', 'Priority', 'Commands', 'Schedule']
    },
    kind(item) {
        return item && item.model && item.model.path ? 'model' : item && item.sound && item.sound.file ? 'sound'
            : item && item.light && item.light.enabled ? 'light' : 'picture';
    },
    sections(all, kinds, pinned, usage) {
        kinds = kinds && kinds.length ? kinds : ['picture'];
        const rank = (section, kind) => {
            const counts = usage && usage[kind] || {};
            return section.fields.reduce((sum, field) => sum + Math.min(10000, Math.max(0, Number(counts[field.key]) || 0)), 0);
        };
        const chosen = kinds.map(kind => {
            const defaults = this.defaults[kind] || this.defaults.picture;
            const learned = all.filter(s => rank(s, kind) >= 8).sort((a, b) => rank(b, kind) - rank(a, kind)).slice(0, 2);
            return new Set(defaults.concat(learned.map(s => s.title)));
        });
        return all.filter(s => pinned.includes(s.title) || chosen.every(set => set.has(s.title))).sort((a, b) => {
            const score = s => kinds.reduce((sum, kind) => sum + rank(s, kind), 0);
            return score(b) - score(a);
        });
    },
    search(all, query) {
        const words = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!words.length) return all;
        return all.map(section => Object.assign({}, section, { fields: section.fields.filter(field => {
            const text = (section.title + ' ' + field.label + ' ' + field.key).toLowerCase();
            return words.every(word => text.includes(word));
        }) })).filter(section => section.fields.length);
    },
    record(kinds, key) {
        if (typeof key !== 'string' || !/^[a-zA-Z0-9_.]+$/.test(key) || key.length > 100) return;
        const U = DocsDoodads.Ui, stored = U.prefs().detailsUsage;
        const usage = Object.assign({}, stored && typeof stored === 'object' ? stored : {});
        for (const kind of new Set(kinds)) {
            if (!Object.prototype.hasOwnProperty.call(this.defaults, kind)) continue;
            const counts = usage[kind] = Object.assign({}, usage[kind] || {});
            counts[key] = Math.min(10000, Math.max(0, Number(counts[key]) || 0) + 1);
        }
        U.setPref('detailsUsage', usage);
    }
};
