//==========================================================
// SECTION 6Q: AUTOMATIC EFFECTS QUALITY
//==========================================================
DocsDoodads.AutoQuality = {
    level: 0,
    pending: null,
    initial() { return { age: 0, average: 1000 / 60, slow: 0, fast: 0, wait: 0 }; },
    // Negative means slower detail, positive means more detail. Time is milliseconds of valid frames.
    step(state, frameMs) {
        const dt = Number(frameMs);
        if (!Number.isFinite(dt) || dt <= 0 || dt > 250) return 0;
        state.age += dt;
        state.average += (dt - state.average) * (1 - Math.exp(-dt / 700));
        state.wait = Math.max(0, state.wait - dt);
        if (state.age < 2000 || state.wait > 0) { state.slow = state.fast = 0; return 0; }
        state.slow = state.average > 22 ? state.slow + dt : 0;
        state.fast = state.average < 18 ? state.fast + dt : 0;
        const change = state.slow >= 2400 ? -1 : state.fast >= 12000 ? 1 : 0;
        if (change) { state.slow = state.fast = 0; state.wait = 3500; }
        return change;
    },
    clamp(value) { return Math.max(0, Math.min(3, Math.round(Number(value) || 0))); },
    defaultAuto() { return parseBooleanParameter(parameters.startPlayersOnAuto, false); }
};

// All renderers read this resolved choice. ConfigManager retains the player's literal Auto selection.
DocsDoodads.qualityOption = function() {
    const option = typeof ConfigManager !== 'undefined' ? Number(ConfigManager.docsFxQuality) || 0 : 0;
    return option === 4 ? DocsDoodads.AutoQuality.clamp(DocsDoodads.AutoQuality.level) : Math.max(0, Math.min(3, option));
};
