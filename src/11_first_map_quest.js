// @editor-only
DocsDoodads.Quest = {
    steps: [
        { id: 'place', text: 'Place three things', at: 'dd-drawer-panel', done: s => Number(s.placed) >= 3 },
        { id: 'lamp', text: 'Add a lamp', at: 'dd-inspector-panel', done: s => Number(s.lights) > 0 },
        { id: 'night', text: 'Make it night', at: 'dd-clock-bar', done: s => s.minutes !== null && s.minutes !== undefined && (Number(s.minutes) >= 1080 || Number(s.minutes) < 360) },
        { id: 'played', text: 'Play From Here', at: 'map', done: s => s.played === true },
        { id: 'saved', text: 'Save your map', at: 'dd-save-btn', done: s => s.saved === true }
    ],
    progress(state) { return this.steps.map(step => Object.assign({}, step, { done: Boolean(step.done(state || {})) })); }
};
