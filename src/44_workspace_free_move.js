// @editor-only
//==========================================================
// SECTION 25F: WORLD → MOVEMENT (7.3.3)
//==========================================================
(function() {
    const W = DocsDoodads.Workspace;
    W.extraWorldSections = W.extraWorldSections || [];
    if (!W.extraWorldSections.some(section => section.title === 'Movement')) {
        W.extraWorldSections.push({ title: 'Movement', fields: [
            { key: 'freeMove.enabled', label: 'The player walks off the grid, by pixels (events stay on it)', type: 'checkbox' },
            { key: 'freeMove.boxW', label: "Player's feet box: width (pixels)", type: 'range', min: 8, max: 48, step: 2 },
            { key: 'freeMove.boxH', label: "Player's feet box: height (pixels)", type: 'range', min: 4, max: 48, step: 2 }
        ] });
    }
})();
