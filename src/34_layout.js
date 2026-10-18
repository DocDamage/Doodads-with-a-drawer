//==========================================================
// SECTION 22: DocsDoodads.LAYOUT (MULTIPLE SAVED LAYOUTS)
//==========================================================
DocsDoodads.Layout = {
    filePath: 'data/DocsDoodadsLayouts.json',
    presets: {
        Mapping: { drawerWidth: 360, inspectorWidth: 280, thumbSize: 96 },
        Events: { drawerWidth: 320, inspectorWidth: 380, thumbSize: 80 },
        Characters: { drawerWidth: 420, inspectorWidth: 260, thumbSize: 128 },
        Tiles: { drawerWidth: 380, inspectorWidth: 260, thumbSize: 48 },
        Compact: { drawerWidth: 280, inspectorWidth: 240, thumbSize: 64 }
    },
    custom: {},
    current: defaultLayoutName,

    init() {
        try {
            const data = DocsDoodads.FS.readJson(this.filePath);
            if (data && typeof data === 'object') {
                this.custom = data;
            } else {
                this.custom = {};
            }
        } catch(e) {
            this.custom = {};
        }
    },

    get(layoutName) {
        return this.custom[layoutName] || this.presets[layoutName] || this.presets.Mapping;
    },

    getAllNames() {
        this.init();
        const pNames = Object.keys(this.presets);
        const cNames = Object.keys(this.custom);
        return [...pNames, ...cNames.filter(n => !pNames.includes(n))];
    },

    saveCurrentAs(name) {
        if (!name || name.trim() === '') return false;
        name = name.trim();
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        const zoom = document.getElementById('dd-thumb-zoom');
        const layoutData = {
            drawerWidth: drawer ? (parseInt(drawer.style.width, 10) || 360) : 360,
            inspectorWidth: inspector ? (parseInt(inspector.style.width, 10) || 280) : 280,
            thumbSize: zoom ? (parseInt(zoom.value, 10) || 96) : 96
        };
        this.custom[name] = layoutData;
        DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
        this.current = name;
        return true;
    },

    deleteCustomLayout(name) {
        if (this.custom[name]) {
            delete this.custom[name];
            DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
            if (this.current === name) this.apply('Mapping');
            return true;
        }
        return false;
    },

    apply(layoutName) {
        this.init();
        this.current = layoutName;
        const cfg = this.get(layoutName);
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        if (drawer) drawer.style.width = cfg.drawerWidth + 'px';
        if (inspector) inspector.style.width = cfg.inspectorWidth + 'px';
        const zoom = document.getElementById('dd-thumb-zoom');
        if (zoom) {
            zoom.value = cfg.thumbSize;
            if (DocsDoodads.Workspace) {
                DocsDoodads.Workspace.thumbSize = cfg.thumbSize;
                DocsDoodads.Workspace.updateVirtualGrid(true);
            }
        }
        if (DocsDoodads.Workspace && typeof DocsDoodads.Workspace.refreshLayoutSelector === 'function') {
            DocsDoodads.Workspace.refreshLayoutSelector();
        }
    }
};

