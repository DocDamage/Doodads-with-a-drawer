// @editor-only
Object.assign(DocsDoodads.Workspace, {
    guessEnabled() { return DocsDoodads.Ui.prefs().guessOnDrop !== false; },
    guessWords() { return DocsDoodads.I18n.guessWords || {}; },
    guessAsset(asset) {
        const key = asset && (asset.id || String(asset.path || '').toLowerCase());
        return DocsDoodads.AssetIndex.data.assets[key] || asset;
    },
    guessKind(asset) { return DocsDoodads.Guess.kind(this.guessAsset(asset), this.guessWords()); },
    rememberAssetGuess(asset) {
        if (!asset || !this.guessEnabled() || asset.guess) return;
        asset.guess = { kind: this.guessKind(asset), source: 'auto' };
    },
    rememberGuessPlacements(items) {
        const paths = new Set((items || []).filter(d => d.bit && d.bit[0] === 3).map(d => String(d.bit[1]).toLowerCase()));
        for (const key of paths) if (DocsDoodads.AssetIndex.data.assets[key]) DocsDoodads.AssetIndex.recordUsage(key);
    },
    setAssetGuess(asset, value) {
        if (!asset) return false;
        const kind = value === 'auto' ? DocsDoodads.Guess.kind(Object.assign({}, asset, { guess: null }), this.guessWords())
            : (Object.prototype.hasOwnProperty.call(DocsDoodads.Guess.words, value) ? value : null);
        asset.guess = { kind, source: value === 'auto' ? 'auto' : 'manual' };
        DocsDoodads.AssetIndex.saveSoon();
        return true;
    },
    renderAssetGuess(asset) {
        const kind = this.guessKind(asset);
        const options = [['auto', 'Guess again'], ['none', 'None']].concat(Object.keys(DocsDoodads.Guess.words).map(k => [k, k]));
        return `<label style="display: block; font-size: 11px; margin-top: 8px;">Guessed: ${escapeHtml(kind || 'none')}<select id="dd-asset-guess" style="width: 100%;">${options.map(([id, label]) => `<option value="${id}"${id === (kind || 'none') ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label><div style="font-size: 10px; color: var(--dd-faint);">For new placements. Saved defaults take priority. Settings can turn guessing off.</div>`;
    },
    bindAssetGuess(asset) {
        const control = document.getElementById('dd-asset-guess');
        if (control) control.onchange = e => { this.setAssetGuess(asset, e.target.value); this.refreshInspector(); };
    },
    guessedPlacementToast(asset, placed, baseline) {
        const kind = this.guessEnabled() ? this.guessKind(asset) : null;
        const guess = kind && DocsDoodads.Guess.settingsFor(kind);
        const changed = guess ? Object.keys(guess).filter(key => JSON.stringify(baseline[key]) !== JSON.stringify(placed[0][key])) : [];
        if (!changed.length) { this.showToast('Placed Doodad on Map!'); return; }
        const mapId = this.currentMapId(), list = window.$dataDocsDoodads[mapId];
        const settings = placed.map(d => Object.fromEntries(changed.map(key => [key, JSON.stringify(d[key])])));
        const labels = { light: placed[0].light && placed[0].light.enabled ? (placed[0].light.when === 'dark' ? 'lit after dark' : 'light') : 'light settings', motion: 'gentle sway', seeThrough: 'see-through', collision: `${placed[0].collision && placed[0].collision.preset} collision`, particles: 'embers', depth: 'below characters' };
        this.showToast(`Placed ${kind}: ${changed.map(key => labels[key]).join(', ')}.`, 'success', { action: { label: 'Undo settings', run: () => {
            if (this.currentMapId() !== mapId || window.$dataDocsDoodads[mapId] !== list) return;
            const targets = placed.filter((d, i) => list.includes(d) && !d.locked && changed.every(key => JSON.stringify(d[key]) === settings[i][key]));
            this.editDoodads(targets, d => { for (const key of changed) { if (baseline[key] === undefined) delete d[key]; else d[key] = JSON.parse(JSON.stringify(baseline[key])); } }, 'undo_guessed_settings');
        } } });
    }
});
