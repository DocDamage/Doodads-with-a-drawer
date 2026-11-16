// Player choices are kept in MZ's config, independently of the maker's settings.
DocsDoodads.Comfort = {
    choices() {
        const c = typeof ConfigManager !== 'undefined' ? ConfigManager : {};
        return { reduceFlashes: c.docsReduceFlashes === true, lessCameraMotion: c.docsLessCameraMotion === true };
    },
    flash(amount, opts) {
        opts = opts || this.choices();
        if (!opts.reduceFlashes) return amount;
        let value = Math.max(0, Math.min(64, Number(amount) || 0));
        if (opts.age !== undefined && opts.duration > 0) {
            const age = Math.max(0, Number(opts.age) || 0), duration = opts.duration;
            const rise = Math.min(4, duration / 2);
            const t = Math.min(1, age / rise);
            value *= age < rise ? t * t * (3 - 2 * t) : Math.max(0, (duration - age) / (duration - rise));
        }
        return value;
    },
    motion(amount, opts) {
        return (opts || this.choices()).lessCameraMotion ? amount * 0.35 : amount;
    },
    camera(settings, opts) {
        return Object.assign({}, settings, (opts || this.choices()).lessCameraMotion ? { lookAhead: 0 } : {});
    },
    offered() {
        const mode = String(parameters.comfortOptions || 'auto');
        if (mode === 'always') return true;
        const world = DocsDoodads.World.settings();
        return Boolean((world.weather2d || {}).lightning && world.weather2d.lightning.enabled)
            || Number((world.camera2d || {}).lookAhead) > 0 || DocsDoodads.fxQualityOffered();
    },
    beginFlash(screen, colour, duration) {
        if (!screen || typeof screen.startFlash !== 'function') return;
        const start = this._startFlash || screen.startFlash;
        const opts = this.choices();
        delete screen._docsComfortFlash;
        if (!opts.reduceFlashes) return start.call(screen, colour, duration);
        const frames = Math.max(8, Number(duration) || 0);
        screen._docsComfortFlash = { peak: this.flash(colour[3], opts), duration: frames, age: 0 };
        const softened = colour.slice(); softened[3] = 0;
        start.call(screen, softened, frames);
    }
};
