//==========================================================
// SECTION 23: DocsDoodads.AUDIO (PREVIEW & SOUND TRIGGERS)
//==========================================================
DocsDoodads.Audio = {
    currentPlaying: null,
    // The map's BGM/BGS from before the first BGM/BGS preview, restored when previews stop.
    _savedBackground: null,

    // The kind of sound (bgm, bgs, me, se), its MZ name (with the folder inside audio/<kind>/, which
    // MZ plays as a path) and the event command that plays it.
    soundFor(asset) {
        const path = String(asset.path || '').replace(/\\/g, '/');
        const m = /(?:^|\/)audio\/(bgm|bgs|me|se)\/(.+)\.[^/.]+$/i.exec(path);
        const type = m ? m[1].toLowerCase() : 'se';
        const name = m ? m[2] : String(asset.fileName || '').replace(/\.[^/.]+$/, '');
        return { type, name, code: { bgm: 241, bgs: 245, me: 249, se: 250 }[type] };
    },

    playPreview(asset) {
        if (!asset || asset.category !== 'Audio') return;
        this.stopPreview();
        if (typeof AudioManager === 'undefined') return;

        const { type, name: baseName } = this.soundFor(asset);
        const sound = { name: baseName, volume: 90, pitch: 100, pan: 0 };

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

