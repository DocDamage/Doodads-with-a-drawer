// One passive analyser tap on the BGM gain, shared by all music-reactive effects.
DocsDoodads.Beat = {
    node: null, source: null, context: null, bytes: null, frame: -1, requestedFrame: -1,
    low: 0, mid: 0, high: 0, kick: false, lastKick: -100,
    release() {
        if (this.source && this.node) { try { this.source.disconnect(this.node); } catch (error) {} }
        if (this.node) { try { this.node.disconnect(); } catch (error) {} }
        this.node = this.source = this.context = this.bytes = null;
        this.low = this.mid = this.high = 0; this.kick = false;
    },
    idle() {
        const frame = DocsDoodads.frameCount();
        if (frame < this.frame || frame - this.requestedFrame > 1) { this.release(); this.frame = -1; }
    },
    update() {
        const frame = DocsDoodads.frameCount();
        this.requestedFrame = frame;
        if (this.frame === frame) return;
        if (frame < this.frame) { this.release(); this.lastKick = -100; }
        this.frame = frame; this.kick = false;
        const audio = typeof AudioManager !== 'undefined' ? AudioManager : null;
        const web = typeof WebAudio !== 'undefined' ? WebAudio : null;
        const bgm = audio && audio._bgmBuffer, context = web && web._context;
        const source = bgm && bgm._gainNode;
        const muted = audio && Number(audio.bgmVolume) === 0 || source && source.gain && source.gain.value === 0
            || web && web._masterGainNode && web._masterGainNode.gain && web._masterGainNode.gain.value === 0;
        if (!source || !context || context.state && context.state !== 'running' || muted || bgm.isPlaying && !bgm.isPlaying()) { this.release(); return; }
        if (this.source !== source || this.context !== context) {
            this.release();
            try {
                const node = context.createAnalyser(); node.fftSize = 512; node.smoothingTimeConstant = 0;
                this.bytes = new Uint8Array(node.frequencyBinCount);
                source.connect(node); this.node = node; this.source = source; this.context = context;
            } catch (error) { this.release(); return; }
        }
        try { this.node.getByteFrequencyData(this.bytes); }
        catch (error) { this.release(); return; }
        const binHz = (Number(context.sampleRate) || 48000) / this.node.fftSize;
        const band = (from, to) => {
            const first = Math.max(0, Math.min(this.bytes.length - 1, Math.ceil(from / binHz)));
            const end = Math.max(first + 1, Math.min(this.bytes.length, Math.ceil(to / binHz)));
            let total = 0;
            for (let i = first; i < end; i++) total += this.bytes[i];
            return total / ((end - first) * 255);
        };
        const old = this.low;
        for (const [name, from, to] of [['low', 20, 250], ['mid', 250, 2000], ['high', 2000, 10000]]) {
            const value = band(from, to);
            this[name] += (value - this[name]) * (value > this[name] ? 0.25 : 0.1);
        }
        if (this.low > 0.18 && this.low - old > 0.12 && frame - this.lastKick >= 6) { this.kick = true; this.lastKick = frame; }
    },
    snapshot() { this.update(); return { low: this.low, mid: this.mid, high: this.high, kick: this.kick }; },
    factor(band, strength) {
        if (!['low', 'mid', 'high'].includes(band)) return 1;
        this.update();
        const amount = strength === undefined ? 1 : Math.max(0, Math.min(1, Number(strength) || 0));
        return 1 - amount + amount * this[band];
    }
};
