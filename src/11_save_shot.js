// Small, bounded save-list pictures. No map renderer or editor state is needed.
DocsDoodads.SaveShot = {
    limit: 8192,
    fit(width, height, max) {
        const w = Number(width), h = Number(height), m = Number(max);
        if (!(w > 0 && h > 0 && m > 0) || !isFinite(w + h + m)) return null;
        const scale = Math.min(1, m / Math.max(w, h));
        return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
    },
    text(value, length) { return String(value || '').replace(/[\x00-\x20]+/g, ' ').trim().slice(0, length); },
    info(place, clock) {
        const c = clock || {};
        return { docsPlace: this.text(place, 120), docsClock: {
            day: Math.max(0, Math.floor(Number(c.day) || 0)),
            minutes: ((Math.floor(Number(c.minutes) || 0) % 1440) + 1440) % 1440,
            season: this.text(c.season, 40)
        } };
    },
    // Inspect JPEG dimensions before asking a browser decoder to allocate an image.
    ok(shot, limit) {
        if (typeof shot !== 'string' || shot.length > (limit || this.limit) ||
            !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(shot)) return false;
        try {
            const bytes = atob(shot.slice(23));
            const byte = i => bytes.charCodeAt(i);
            if (byte(0) !== 255 || byte(1) !== 216 || byte(bytes.length - 2) !== 255 || byte(bytes.length - 1) !== 217) return false;
            let p = 2;
            while (p + 4 < bytes.length) {
                if (byte(p++) !== 255) return false;
                while (byte(p) === 255) p++;
                const marker = byte(p++), n = byte(p) * 256 + byte(p + 1);
                if (n < 2 || p + n > bytes.length) return false;
                if (marker === 192 || marker === 193 || marker === 194) {
                    const h = byte(p + 3) * 256 + byte(p + 4), w = byte(p + 5) * 256 + byte(p + 6);
                    return n >= 8 && w > 0 && h > 0 && w <= 160 && h <= 160;
                }
                if (marker === 218 || marker === 217) return false;
                p += n;
            }
        } catch (err) { /* malformed save-list metadata uses MZ's normal row */ }
        return false;
    },
    clockText(clock) {
        const c = this.info('', clock).docsClock;
        const hh = String(Math.floor(c.minutes / 60)).padStart(2, '0'), mm = String(c.minutes % 60).padStart(2, '0');
        return [c.day > 0 ? 'Day ' + c.day : '', hh + ':' + mm, c.season].filter(Boolean).join(' · ');
    }
};
