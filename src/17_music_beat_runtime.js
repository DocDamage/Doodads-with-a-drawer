if (typeof Game_Map !== 'undefined') {
    Game_Map.prototype.updateDocsBeat = function() { DocsDoodads.Beat.idle(); };
    DocsDoodads.mapSteps.push('updateDocsBeat');
}
(function() {
    if (typeof AudioManager !== 'undefined') for (const name of ['stopBgm', 'playBgm']) {
        const original = AudioManager[name];
        if (typeof original === 'function') AudioManager[name] = function(...args) { DocsDoodads.Beat.release(); return original.apply(this, args); };
    }
    if (typeof Scene_Map !== 'undefined' && Scene_Map.prototype.terminate) {
        const terminate = Scene_Map.prototype.terminate;
        Scene_Map.prototype.terminate = function() { DocsDoodads.Beat.release(); return terminate.call(this); };
    }
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
