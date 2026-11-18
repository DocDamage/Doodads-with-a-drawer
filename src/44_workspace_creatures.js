// @editor-only
//==========================================================
// SECTION 25C: AMBIENT CREATURES IN DETAILS (9.3.1)
//==========================================================
// Details → Creatures: birds, butterflies or fish around this doodad, and Perch (birds land on top of it).
(function() {
    const D = DocsDoodads, W = D.Workspace, C = D.Creatures;

    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || items.some(d => !d || d.line)) return all;
        const kinds = [{ value: '', label: 'None' }].concat(Object.keys(C.kinds).map(k => ({ value: k, label: C.kinds[k].label })));
        return all.concat([{ title: 'Creatures', fields: [
            { key: 'creatures.kind', label: 'Creatures around it', type: 'select', options: kinds },
            { key: 'creatures.count', label: 'How many', type: 'range', min: 1, max: C.maxPerDoodad, step: 1 },
            { key: 'creatures.spread', label: 'Spread (tiles)', type: 'range', min: 0.5, max: 12, step: 0.5 },
            { key: 'creatures.flee', label: 'Fly off when the player is within (tiles)', type: 'range', min: 0, max: 12, step: 0.5 },
            { key: 'creatures.back', label: 'Come back after (seconds)', type: 'range', min: 0.5, max: 60, step: 0.5 },
            { key: 'creatures.hours', label: 'Out', type: 'select', options: [{ value: 'day', label: 'By day' }, { value: 'night', label: 'At night' }, { value: 'any', label: 'Day and night' }] },
            { key: 'creatures.weather', label: 'In rain and storms', type: 'select', options: [{ value: 'clear', label: 'Hide' }, { value: 'any', label: 'Stay out' }] },
            { key: 'creatures.sheet', label: 'Their picture (two frames side by side, img/...png; blank for a plain shape)', type: 'text' },
            { key: 'perch', label: 'Perch (birds land on top of this)', type: 'checkbox' }
        ] }]);
    };

    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) {
        if (String(key).indexOf('creatures.') === 0) {
            const s = C.normalize(d && d.creatures), k = key.slice(10);
            if (k === 'kind') return s ? s.kind : '';
            const fallback = C.normalize({ kind: 'birds' });
            return (s || fallback)[k];
        }
        if (key === 'perch') return Boolean(d && d.perch);
        return get.call(this, d, key);
    };

    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (d && String(key).indexOf('creatures.') === 0) {
            const k = key.slice(10);
            if (k === 'kind' && !value) delete d.creatures;
            else {
                const next = Object.assign({}, C.normalize(d.creatures) || { kind: 'birds' });
                next[k] = value;
                if (k === 'kind') Object.assign(next, { flee: C.kinds[value].flee, back: C.kinds[value].back, hours: C.kinds[value].hours, weather: C.kinds[value].weather });
                d.creatures = C.normalize(next);
            }
            C._version = (C._version || 0) + 1;
            return;
        }
        if (d && key === 'perch') {
            if (value) d.perch = true; else delete d.perch;
            C._version = (C._version || 0) + 1;
            return;
        }
        return apply.call(this, d, key, value);
    };
})();
