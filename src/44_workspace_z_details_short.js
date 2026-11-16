// @editor-only
(function() {
    const W = DocsDoodads.Workspace, R = DocsDoodads.DetailsShort;
    const render = W.renderInspector;
    W.renderInspector = function() {
        const result = render.call(this);
        this.bindShortDetails();
        return result;
    };
    Object.assign(W, {
        detailsKinds() {
            if (this.selectedEvent) return ['event'];
            const items = Array.isArray(this.selectedDoodads) && this.selectedDoodads.length ? this.selectedDoodads : this.selectedDoodad ? [this.selectedDoodad] : [];
            return Array.from(new Set(items.map(item => R.kind(item))));
        },
        bindShortDetails() {
            const root = typeof document !== 'undefined' ? document.getElementById('dd-inspector-content') : null;
            if (!root || !root.querySelectorAll || !document.createElement || !root.insertBefore) return;
            const sections = Array.from(root.querySelectorAll('details')).filter(node => {
                const parent = node.parentNode;
                return !(parent && parent.closest && parent.closest('details'));
            }).map(node => {
                const summary = node.querySelector('summary'), title = this.detailsKey(summary);
                const fields = Array.from(node.querySelectorAll('input,select,textarea')).map(input => {
                    let row = input.parentNode;
                    // Text fields have their own labelled div; checkboxes are their label.
                    if (row && row.tagName !== 'LABEL' && row.tagName !== 'DIV') row = input;
                    return { key: input.id || '', label: row.textContent || '', input, row };
                });
                return { node, title, fields };
            });
            const loose = new Map();
            for (const field of Array.from(root.querySelectorAll('input,select,textarea'))) {
                if (field.closest && field.closest('details')) continue;
                const row = field.parentNode;
                if (row && row !== root && row.id !== 'dd-details-filter') loose.set(row, String(row.textContent || '') + ' ' + field.id);
                if (!this.selectedEvent && typeof field.onchange === 'function' && !field._ddUsageBound) {
                    field._ddUsageBound = true;
                    const changed = field.onchange;
                    field.onchange = event => {
                        const items = this.selectionItems ? this.selectionItems() : [];
                        const before = JSON.stringify(items);
                        const result = changed.call(field, event);
                        if (JSON.stringify(items) !== before) R.record(items.map(item => R.kind(item)), String(field.id || 'setting').replace(/-/g, '.'));
                        return result;
                    };
                }
            }
            if (!sections.length && !loose.size) return;
            const old = root.querySelector('#dd-details-filter');
            if (old && old.parentNode) old.parentNode.removeChild(old);
            const bar = document.createElement('div');
            bar.id = 'dd-details-filter';
            bar.style.cssText = 'display:flex;gap:5px;align-items:center;margin-bottom:7px;';
            const input = document.createElement('input'); input.type = 'search'; input.id = 'dd-details-search';
            input.placeholder = 'Find a setting'; input.setAttribute('aria-label', 'Find any Details setting');
            input.style.cssText = 'width:100%;min-width:0;background:var(--dd-field);color:var(--dd-text);border:1px solid var(--dd-line);padding:4px;';
            const more = document.createElement('button'); more.type = 'button'; more.id = 'dd-details-more'; more.style.whiteSpace = 'nowrap';
            bar.appendChild(input); bar.appendChild(more); root.insertBefore(bar, root.firstChild);
            const kindKey = this.detailsKinds().sort().join(',');
            if (kindKey !== this._detailsKindKey) { this._detailsKindKey = kindKey; this._detailsMore = false; this._detailsQuery = ''; }
            input.value = this._detailsQuery || '';
            const apply = () => {
                const prefs = DocsDoodads.Ui.prefs(), query = input.value.trim();
                this._detailsQuery = input.value;
                // Effects use stable property keys for learning, while other sections remain searchable.
                const all = sections.map(section => Object.assign({}, section, { fields: section.fields.map(field => {
                    const match = /^dd-fx-(\d+)-(\d+)$/.exec(field.key), definition = match && this._detailsAllEffects && this._detailsAllEffects[Number(match[1])];
                    const original = definition && definition.fields[Number(match[2])];
                    return Object.assign({}, field, { key: original ? original.key : field.key });
                }) }));
                const short = R.sections(all, this.detailsKinds(), Array.isArray(prefs.detailsPinned) ? prefs.detailsPinned : [], prefs.detailsUsage || {});
                const matches = R.search(all, query);
                const simple = DocsDoodads.SimpleMode.enabled();
                for (const section of sections) {
                    const found = matches.find(s => s.node === section.node);
                    const visible = query ? Boolean(found) : !simple || this._detailsMore || short.some(s => s.node === section.node);
                    section.node.style.display = visible ? '' : 'none';
                    if (query && visible) section.node.open = true;
                    for (const field of section.fields) field.row.style.display = !query || found && found.fields.some(f => f.input === field.input) ? '' : 'none';
                }
                const words = query.toLowerCase().split(/\s+/).filter(Boolean);
                for (const [row, label] of loose) row.style.display = words.every(word => label.toLowerCase().includes(word)) ? '' : 'none';
                if (simple && !query && !this._detailsMore) {
                    const anchors = new Map();
                    for (const section of short.slice().reverse()) {
                        const parent = section.node.parentNode;
                        const first = sections.find(s => s.node.parentNode === parent);
                        const anchor = anchors.get(parent) || first && first.node;
                        if (parent && parent.insertBefore && anchor) {
                            if (section.node !== anchor) parent.insertBefore(section.node, anchor);
                            anchors.set(parent, section.node);
                        }
                    }
                }
                more.style.display = simple && !query && short.length < sections.length ? '' : 'none';
                more.textContent = this._detailsMore ? 'Less' : 'More';
                more.setAttribute('aria-expanded', String(Boolean(this._detailsMore)));
            };
            input.oninput = apply;
            more.onclick = () => { this._detailsMore = !this._detailsMore; apply(); };
            apply();
        }
    });
    const renderEffects = W.renderEffectSections;
    W.renderEffectSections = function(items) {
        const result = renderEffects.call(this, items);
        this._detailsAllEffects = this._effectSections;
        return result;
    };
    const set = W.setDoodadProperty;
    W.setDoodadProperty = function(items, key, value) {
        const before = items.map(item => JSON.stringify(this.getDoodadProperty(item, key)));
        const result = set.call(this, items, key, value);
        if (items.some((item, index) => JSON.stringify(this.getDoodadProperty(item, key)) !== before[index])) R.record(items.map(item => R.kind(item)), key);
        return result;
    };
    const editEvent = W.editSelectedEvent;
    W.editSelectedEvent = function(type, mutate) {
        const event = this.selectedStagedEvent(), before = JSON.stringify(event);
        const result = editEvent.call(this, type, mutate);
        if (event && JSON.stringify(event) !== before) R.record(['event'], String(type || 'event').replace(/[^a-zA-Z0-9_.]/g, '.'));
        return result;
    };
    const preview = W.previewDoodadProperty;
    W.previewDoodadProperty = function(items, key, value) {
        const result = preview.call(this, items, key, value);
        if (this._propertyPreview) {
            this._propertyPreview.detailKeys = this._propertyPreview.detailKeys || new Set();
            this._propertyPreview.detailKeys.add(key);
        }
        return result;
    };
    const commit = W.commitPropertyPreview;
    W.commitPropertyPreview = function() {
        const state = this._propertyPreview;
        if (state && state.detailKeys) for (const key of state.detailKeys) {
            if (state.items.some((item, index) => JSON.stringify(this.getDoodadProperty(item, key)) !== JSON.stringify(this.getDoodadProperty(state.before[index], key)))) R.record(state.items.map(item => R.kind(item)), key);
        }
        return commit.call(this);
    };
})();
