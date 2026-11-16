// @editor-only
(function() {
    const W = DocsDoodads.Workspace, C = DocsDoodads.Clash;
    W.problemGroups.push(['plugins', 'Plugins']);
    W.pluginReportText = function() {
        const renderer = DocsDoodads.Compat.getRenderer(), gl = renderer && renderer.gl;
        let gpu = 'Unavailable';
        try { const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); if (ext) gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)); } catch (error) {}
        const versions = typeof process !== 'undefined' ? process.versions || {} : {};
        const map = window.$gameMap;
        return C.report({ version: pluginVersion, projectRoot: typeof process !== 'undefined' ? process.cwd() : '',
            plugins: window.$plugins || [], parameters,
            system: { mz: typeof Utils !== 'undefined' ? Utils.RPGMAKER_VERSION || 'Unknown' : 'Unknown', nw: versions.nw || 'Unavailable', chromium: versions.chrome || 'Unavailable', gpu,
                screen: [Graphics.width, Graphics.height], tile: map ? [map.tileWidth(), map.tileHeight()] : [] },
            map: map ? { id: map.mapId(), width: map.width(), height: map.height(), doodads: DocsDoodads.doodads(map.mapId()).length, events: map.events().length } : {},
            problems: this.collectProblems('map') });
    };
    W.savePluginReport = function() {
        const FS = DocsDoodads.FS;
        if (!DocsDoodads.Compat.isTest() || !FS.fs) { this.showToast('Save a Report needs a desktop playtest.', 'error'); return false; }
        try {
            const folder = 'data/docs_doodads_cache/reports';
            const file = folder + '/Docs-Doodads-' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt';
            const report = this.pluginReportText();
            FS.mkdirp(folder); FS.writeFileSync(file, report);
            this.showToast('Saved ' + file + '. Review it and attach it to your report.', 'success');
            try { if (typeof nw !== 'undefined' && nw.Shell && FS.path) nw.Shell.showItemInFolder(FS.path.resolve(file)); } catch (error) {}
            return file;
        } catch (error) { this.showToast('Could not save the report: ' + error.message, 'error'); return false; }
    };
})();
