// Optionally apply player comfort choices to MZ's own Flash Screen and Shake Screen commands.
if (typeof Game_Screen !== 'undefined') {
    const C = DocsDoodads.Comfort;
    const soften = () => parseBooleanParameter(parameters.softenMZEffects, false);
    if (typeof Game_Screen.prototype.startFlash === 'function') {
        C._startFlash = Game_Screen.prototype.startFlash;
        Game_Screen.prototype.startFlash = function(colour, duration) {
            if (soften()) return C.beginFlash(this, colour, duration);
            delete this._docsComfortFlash;
            return C._startFlash.call(this, colour, duration);
        };
    }
    if (typeof Game_Screen.prototype.updateFlash === 'function') {
        const update = Game_Screen.prototype.updateFlash;
        Game_Screen.prototype.updateFlash = function() {
            update.call(this);
            const flash = this._docsComfortFlash;
            if (!flash) return;
            flash.age++;
            this._flashColor[3] = C.flash(flash.peak, { reduceFlashes: true, age: flash.age, duration: flash.duration });
            if (flash.age >= flash.duration) delete this._docsComfortFlash;
        };
    }
    if (typeof Game_Screen.prototype.startShake === 'function') {
        const shake = Game_Screen.prototype.startShake;
        Game_Screen.prototype.startShake = function(power, speed, duration) {
            return shake.call(this, soften() ? C.motion(power) : power, speed, duration);
        };
    }
}
