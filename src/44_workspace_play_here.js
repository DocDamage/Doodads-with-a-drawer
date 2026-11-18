// @editor-only
//==========================================================
// SECTION 25: WORKSPACE: PLAY FROM HERE
//==========================================================
// Right-click a tile (or Ctrl+Enter over it), Play From Here: the player stands there and the editor closes,
// asking first about unsaved work (as Done does) and about the time and season being previewed. A tile the
// player can't stand on is refused with the reason, and the nearest free one offered. The rules are
// DocsDoodads.PlayHere (11_play_here.js).
Object.assign(DocsDoodads.Workspace, {
    // Resolves whether the player was put there (false when cancelled or refused).
    async playFromHere(tileX, tileY) {
        if (!this.mounted || typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return false;
        const P = DocsDoodads.PlayHere, Ui = DocsDoodads.Ui;
        const env = P.gameEnv();
        let x = Math.floor(Number(tileX)), y = Math.floor(Number(tileY));
        const why = P.why(x, y, env);
        if (why) {
            const near = P.nearest(x, y, env);
            if (!near) {
                await Ui.alert(`The player can't start at ${x}, ${y}: ${why}. There is no free tile near it.`, { title: 'Play From Here' });
                return false;
            }
            const ok = await Ui.confirm(`The player can't start at ${x}, ${y}: ${why}. Start at ${near.x}, ${near.y} instead, the nearest free tile?`,
                { title: 'Play From Here', ok: 'Start There' });
            if (!ok) return false;
            x = near.x;
            y = near.y;
        }

        // The time and season the editor is previewing, if the game should start with them.
        // With the clock or seasons off (World), the game has no time to set, so that preview isn't offered.
        const world = DocsDoodads.World.settings() || {};
        const clockOn = !!(world.time && world.time.source && world.time.source !== 'off');
        const seasonsOn = !!(world.seasons && world.seasons.source && world.seasons.source !== 'off');
        const minutes = clockOn ? this.previewMinutes : null, season = seasonsOn ? this.previewSeason : null;
        const hasSeason = season !== null && season !== undefined;
        const seasonNames = (world.seasons || {}).names || [];
        const text = P.startText(minutes, hasSeason ? seasonNames[season] || `season ${Number(season) + 1}` : '');
        let useTime = false;
        if (text) {
            const answer = await Ui.choose(`Start at ${text}, as the editor shows it, or at the game's own time?`, [
                { label: 'Cancel', value: null },
                { label: "The Game's Time", value: 'game' },
                { label: `Start at ${text}`, value: 'preview', kind: 'good', main: true }
            ], { title: 'Play From Here', icon: 'sun' });
            if (!answer) return false;
            useTime = answer === 'preview';
        }

        if (!(await this.requestClose())) return false;
        const api = DocsDoodads.api;
        if (useTime && minutes !== null && minutes !== undefined) api.setTime(Math.floor(minutes / 60), Math.round(minutes) % 60);
        if (useTime && hasSeason) api.setSeason(season);
        $gamePlayer.locate(x, y);
        return true;
    },

    // Ctrl+Enter and the palette: the tile the mouse was last over on the map.
    playFromCursor() {
        const at = this._cursor;
        if (!at) {
            this.showToast('Point at a tile on the map first.');
            return false;
        }
        this.playFromHere(at.tileX, at.tileY);
        return true;
    }
});
