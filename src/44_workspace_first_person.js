// @editor-only
// First-person fields join the existing per-map 3D panel; the same undoable map-settings writer saves them.
(function(W) {
    'use strict';
    const fields = W.perspectiveFields;
    W.perspectiveFields = function() {
        const base = fields.call(this);
        const mode = DocsDoodads.Perspective.normalize(this.perspectiveRaw()).mode;
        const modeField = { key: 'mode', label: 'Camera', type: 'select', options: [
            { value: 'orbit', label: 'Orbit above the player' },
            { value: 'first', label: 'First person (player eye)' }
        ] };
        const at = Math.max(1, base.findIndex(f => f.key === 'pitch'));
        base.splice(at, 0, modeField);
        if (mode !== 'first') return base;
        const withoutOrbitView = base.filter(f => f.key !== 'pitch' && f.key !== 'fov');
        const modeAt = withoutOrbitView.findIndex(f => f.key === 'mode') + 1;
        withoutOrbitView.splice(modeAt, 0,
            { key: 'eyeHeight', label: 'Eye height (tiles above the ground)', type: 'range', min: 0.2, max: 2, step: 0.05 },
            { key: 'firstPitch', label: 'Look tilt (negative looks up)', type: 'range', min: -45, max: 60, step: 1 },
            { key: 'firstFov', label: 'First-person field of view', type: 'range', min: 40, max: 110, step: 1 },
            { key: 'nearFade', label: 'Fade nearby billboards (tiles; 0 = off)', type: 'range', min: 0, max: 4, step: 0.1 },
            { key: 'mouseLook', label: 'Click the game to use mouse look', type: 'checkbox' });
        return withoutOrbitView;
    };

    const setField = W.setPerspectiveField;
    W.setPerspectiveField = function(key, value, previousSettings) {
        const out = setField.call(this, key, value, previousSettings);
        if (key === 'mode') this.refreshInspector();
        return out;
    };
})(DocsDoodads.Workspace);
