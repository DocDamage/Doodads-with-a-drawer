//==========================================================
// SECTION 23: DocsDoodads.AUDIO (PREVIEW & SOUND TRIGGERS)
//==========================================================
DocsDoodads.Audio = {
    currentPlaying: null,
    // The map's BGM/BGS from before the first BGM/BGS preview, restored when previews stop.
    _savedBackground: null,

    playPreview(asset) {
        if (!asset || asset.category !== 'Audio') return;
        const baseName = asset.fileName.replace(/\.[^/.]+$/, "");
        this.stopPreview();
        if (typeof AudioManager === 'undefined') return;

        const sound = { name: baseName, volume: 90, pitch: 100, pan: 0 };
        let type = 'se';
        if (asset.path.includes('/bgm/')) type = 'bgm';
        else if (asset.path.includes('/bgs/')) type = 'bgs';
        else if (asset.path.includes('/me/')) type = 'me';

        if ((type === 'bgm' || type === 'bgs') && !this._savedBackground) {
            this._savedBackground = { bgm: AudioManager.saveBgm(), bgs: AudioManager.saveBgs() };
        }
        if (type === 'bgm') AudioManager.playBgm(sound);
        else if (type === 'bgs') AudioManager.playBgs(sound);
        else if (type === 'me') AudioManager.playMe(sound); // MZ resumes the BGM after an ME
        else AudioManager.playSe(sound);
        this.currentPlaying = { type, name: baseName };
    },

    stopPreview() {
        const playing = this.currentPlaying;
        this.currentPlaying = null;
        if (!playing || typeof AudioManager === 'undefined') return;
        if (playing.type === 'se') AudioManager.stopSe();
        else if (playing.type === 'me') AudioManager.stopMe();
        else if (this._savedBackground) {
            const saved = this._savedBackground;
            this._savedBackground = null;
            AudioManager.replayBgm(saved.bgm);
            AudioManager.replayBgs(saved.bgs);
        }
    }
};

