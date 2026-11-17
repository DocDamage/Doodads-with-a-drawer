// @editor-only
Object.assign(DocsDoodads.Workspace, {
    simpleToolNames() { return Object.assign({ symmetry: 'dd-sym-btn' }, this.toolButtons); },
    simpleToolStyle(id) {
        const S = DocsDoodads.SimpleMode;
        const names = this.simpleToolNames(), tool = Object.keys(names).find(key => names[key] === id);
        return S.enabled() && tool && !S.tools().includes(tool) ? 'display:none;' : '';
    },
    setSimpleMode(on) {
        const S = DocsDoodads.SimpleMode;
        S.active = Boolean(on); DocsDoodads.Ui.setPref('simple', S.active);
        if (on && this.placementTool) S.reveal(this.placementTool);
        this.updateSimpleView();
        if (this.mounted) this.refreshInspector();
        return S.active;
    },
    updateSimpleView() {
        if (typeof document === 'undefined') return;
        const S = DocsDoodads.SimpleMode;
        for (const [name, id] of Object.entries(this.simpleToolNames())) {
            const button = document.getElementById(id);
            if (button) button.style.display = S.enabled() && !S.tools().includes(name) ? 'none' : '';
        }
        for (const menu of this.menus()) for (const item of menu.items) {
            const button = document.getElementById(item.id);
            if (button) button.style.display = S.enabled() && !S.menuItems([item]).length ? 'none' : '';
        }
        const button = document.getElementById('dd-simple-btn');
        if (button) {
            button.textContent = S.enabled() ? 'Show Everything' : 'Keep It Simple';
            button.setAttribute('aria-pressed', String(S.enabled()));
        }
        const box = document.getElementById('dd-look-simple');
        if (box) box.checked = S.enabled();
        if (this.mounted && this.container) this.layoutPanels();
    }
});
