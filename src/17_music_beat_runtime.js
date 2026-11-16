if (typeof Game_Map !== 'undefined') {
    Game_Map.prototype.updateDocsBeat = function() { DocsDoodads.Beat.idle(); };
    DocsDoodads.mapSteps.push('updateDocsBeat');
}
(function() {
    const P = DocsDoodads.Particles, step = P.step;
    P.step = function(state, dt, emitting) {
        if (state.config.musicTrigger === 'kick') {
            const B = DocsDoodads.Beat;
            B.update();
            if (emitting && B.kick && state._docsKickFrame !== B.frame) {
                state._docsKickFrame = B.frame;
                this.burst(state, Math.max(1, Math.round(state.config.rate / 4)));
            }
            emitting = false;
        }
        return step.call(this, state, dt, emitting);
    };
})();
