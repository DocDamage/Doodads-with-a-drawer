// @editor-only
//==========================================================
// SECTION 25C: NORMAL-MAP SETTINGS AND GENERATOR
//==========================================================
(function() {
    const D = DocsDoodads, W = D.Workspace, N = D.NormalLight;

    W.extraWorldSections = W.extraWorldSections || [];
    if (!W.extraWorldSections.some(section => section.title === 'Normal Maps')) {
        W.extraWorldSections.push({ title: 'Normal Maps', fields: [
            { key: 'normalLight.enabled', label: 'Shade doodads and characters with _n.png companions (flat maps)', type: 'checkbox' },
            { key: 'normalLight.maxLights', label: 'Nearby lights per picture', type: 'range', min: 1, max: 8, step: 1 }
        ] });
    }

    Object.assign(W, {
        normalMapEligible(asset) {
            const path = asset && N.cleanPath(asset.path);
            return Boolean(path && /^img\//i.test(path) && /\.(png|jpe?g|webp)$/i.test(path) && N.normalPath(path));
        },

        async makeAssetNormalMap(asset, loader = path => this.loadPixels(path), strength = 2) {
            if (!this.normalMapEligible(asset)) { this.showToast('Choose a picture, not a normal map.', 'error'); return null; }
            const target = N.normalPath(asset.path), F = D.FS;
            if (!target || !F.fs || !F.path) { this.showToast('Normal maps can only be written in a playtest.', 'error'); return null; }
            const root = F.path.resolve('.'), absolute = F.path.resolve(root, target), relative = F.path.relative(root, absolute).replace(/\\/g, '/');
            if (relative !== target || relative.startsWith('../') || F.path.isAbsolute(relative)) {
                this.showToast('The normal map must stay beside its picture inside the project.', 'error');
                return null;
            }
            if (F.existsSync(target)) {
                const replace = await D.Ui.confirm(`${target} already exists. Replace it with a generated normal map?`,
                    { title: 'Replace Normal Map', ok: 'Replace', danger: true });
                if (!replace) return null;
            }
            try {
                const source = await loader(asset.path);
                const pixels = N.make(source.data, source.width, source.height, strength);
                const canvas = document.createElement('canvas');
                canvas.width = source.width; canvas.height = source.height;
                const context = canvas.getContext('2d'), image = context.createImageData(source.width, source.height);
                image.data.set(pixels); context.putImageData(image, 0, 0);
                const encoded = canvas.toDataURL('image/png').split(',')[1];
                if (!encoded) throw new Error('The generated PNG was empty.');
                F.atomicWriteFile(target, Buffer.from(encoded, 'base64'));
                await D.AssetIndex.indexPaths([target], { save: false });
                D.AssetIndex.save();
                this.showToast(`Made ${target}. Side lighting will show its generated bumps.`, 3500);
                this.refreshDrawerCards(); this.refreshInspector(); this.refreshSpriteset();
                return target;
            } catch (error) {
                this.showToast(`Could not make the normal map: ${error.message || error}`, 'error');
                return null;
            }
        }
    });

    const renderUsage = W.renderUsagePanel;
    W.renderUsagePanel = function(asset) {
        const html = renderUsage.call(this, asset);
        if (!this.normalMapEligible(asset)) return html;
        const existing = asset.normalMap ? `Using ${D.Security.escapeHtml(asset.normalMap)}` : 'Makes a rough _n.png from brightness and edges; paint it by hand for best results.';
        return html + `<div style="border-top:1px solid var(--dd-line-soft);padding-top:8px;margin-top:8px;">
            <div class="dd-panel-head" style="font-weight:900;margin-bottom:4px;">Normal Map</div>
            <div style="font-size:10px;color:var(--dd-muted);margin-bottom:5px;">${existing}</div>
            <button class="dd-btn" id="dd-asset-make-normal" type="button" style="width:100%;">Make Normal Map</button>
        </div>`;
    };

    const bindUsage = W.bindUsagePanel;
    W.bindUsagePanel = function(asset) {
        const result = bindUsage.call(this, asset);
        const button = typeof document !== 'undefined' ? document.getElementById('dd-asset-make-normal') : null;
        if (button) button.onclick = () => this.makeAssetNormalMap(asset);
        return result;
    };
})();
