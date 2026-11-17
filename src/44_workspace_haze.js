// @editor-only
(function() {
    const W = DocsDoodads.Workspace, H = DocsDoodads.Haze, sections = W.effectSections, defaults = W.propertyDefaults;
    W.effectSections = function() {
        return sections.call(this).concat([{ title: 'Heat haze', fields: [
            { key: 'haze.preset', label: 'Air distortion (flat maps)', type: 'select', options: [{ value: 'none', label: 'Off' }, { value: 'campfire', label: 'Campfire' }, { value: 'lava', label: 'Lava' }, { value: 'desert', label: 'Desert Road' }, { value: 'underwater', label: 'Under Water' }] },
            { key: 'haze.radius', label: 'Radius / band height (pixels)', type: 'range', min: 8, max: 600, step: 8 },
            { key: 'haze.strength', label: 'Strength (pixels)', type: 'range', min: 0, max: 12, step: 0.5 },
            { key: 'haze.speed', label: 'Upward drift speed', type: 'range', min: 0, max: 3, step: 0.1 }
        ] }]);
    };
    W.propertyDefaults = function() { return Object.assign({}, defaults.call(this), { haze: Object.assign({ preset: 'none' }, H.presets.campfire) }); };
    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(item, key, value) {
        if (key === 'haze.preset') {
            if (value === 'none') delete item.haze;
            else if (H.presets[value]) item.haze = Object.assign({ preset: value }, H.presets[value]);
            return;
        }
        return apply.call(this, item, key, value);
    };
    W.toolHooks.haze = { overlay(g) {
        if (DocsDoodads.Perspective.liveCamera()) return;
        for (const item of this.selectionItems()) {
            const haze = H.normalize(item.haze); if (!haze || haze.shape !== 'circle') continue;
            const spriteset = typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset;
            const sprite = spriteset && (spriteset._docsDoodadSprites || []).find(view => view._data === item);
            if (!sprite) continue;
            const at = H.spriteCentre(sprite, false);
            g.lineStyle(1, DocsDoodads.Ui.mapColor('selection'), 0.6); g.drawCircle(at.x, at.y, haze.radius); g.lineStyle(0);
        }
    } };
})();
