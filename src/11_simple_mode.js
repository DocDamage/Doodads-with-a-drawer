// @editor-only
// These lists choose what is shown; the full commands and data remain available.
DocsDoodads.SimpleMode = {
    active: null,
    extra: [],
    basicTools: ['select', 'stamp', 'brush', 'tiles'],
    basicMenus: ['dd-moods-btn', 'dd-mapset-btn', 'dd-savemap-btn', 'dd-help-btn', 'dd-palette-btn', 'dd-look-btn', 'dd-settings-btn', 'dd-lpc-btn', 'dd-capture-btn', 'dd-keys-btn', 'dd-problems-btn'],
    basicFields: {
        Placement: ['scale', 'rotation', 'depth'], Depth: ['depth'], Appearance: ['opacity'],
        Motion: ['motion.type', 'motion.amount', 'motion.speed'],
        Light: ['light.enabled', 'light.preset', 'light.color', 'light.radius', 'light.when']
    },
    defaultFor(prefs, hasSaved) { return typeof prefs.simple === 'boolean' ? prefs.simple : !hasSaved; },
    begin() {
        let raw = null;
        try { if (typeof localStorage !== 'undefined') raw = localStorage.getItem(DocsDoodads.Ui.prefsKey); } catch (error) {}
        this.active = this.defaultFor(DocsDoodads.Ui.prefs(), raw !== null);
        this.extra = [];
        DocsDoodads.Ui.setPref('simple', this.active);
        return this.active;
    },
    enabled() { return this.active === null ? DocsDoodads.Ui.prefs().simple === true : this.active; },
    tools() { return this.basicTools.concat(this.extra.filter(t => !this.basicTools.includes(t))); },
    reveal(tool) { if (tool && !this.tools().includes(tool)) this.extra.push(tool); },
    end() { this.extra = []; this.active = null; },
    menuItems(all) { return all.filter(item => this.basicMenus.includes(item.id)); },
    sections(all, kind) {
        if (kind && DocsDoodads.DetailsShort) {
            const prefs = DocsDoodads.Ui.prefs();
            return DocsDoodads.DetailsShort.sections(all, [kind], Array.isArray(prefs.detailsPinned) ? prefs.detailsPinned : [], prefs.detailsUsage || {});
        }
        return all.filter(s => this.basicFields[s.title] || (kind === 'model' && s.title === '3D Model')).map(s => {
            const fields = this.basicFields[s.title];
            return fields ? Object.assign({}, s, { fields: s.fields.filter(f => fields.includes(f.key)) }) : s;
        });
    }
};
