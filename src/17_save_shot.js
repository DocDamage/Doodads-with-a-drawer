(() => {
    const S = DocsDoodads.SaveShot;
    S.enabled = () => parseBooleanParameter(parameters.saveFilePictures, false);
    S.reset = function() { this._shot = null; };
    S.capture = function() {
        this.reset();
        if (!this.enabled() || typeof SceneManager === 'undefined' || !SceneManager.backgroundBitmap) return;
        try {
            const bitmap = SceneManager.backgroundBitmap();
            const size = bitmap && this.fit(bitmap.width, bitmap.height, 160);
            if (!size || !bitmap.canvas) return;
            const canvas = document.createElement('canvas');
            canvas.width = size.width; canvas.height = size.height;
            canvas.getContext('2d').drawImage(bitmap.canvas, 0, 0, size.width, size.height);
            const shot = canvas.toDataURL('image/jpeg', 0.6);
            if (this.ok(shot, this.limit)) this._shot = { mapId: $gameMap.mapId(), value: shot };
        } catch (err) { /* tainted/unavailable canvas never prevents leaving or saving */ }
    };
    S.currentInfo = function() {
        const area = DocsDoodads.Areas.current(), A = DocsDoodads.Atmosphere;
        const names = DocsDoodads.World.settings().seasons.names || [];
        const place = area ? area.name : typeof $gameMap.displayName === 'function' ? $gameMap.displayName() : '';
        return this.info(place, { day: DocsDoodads.Calendar.day(), minutes: A.minutes(), season: names[A.season()] || '' });
    };
    S.clearImages = function() {
        if (this._images) for (const entry of this._images.values()) if (entry.bitmap.destroy) entry.bitmap.destroy();
        this._images = new Map();
    };
    S.image = function(shot) {
        if (!this.ok(shot, this.limit)) return null;
        const images = this._images || (this._images = new Map());
        if (images.has(shot)) return images.get(shot);
        if (images.size >= 24) {
            const first = images.keys().next().value, old = images.get(first);
            images.delete(first); if (old.bitmap.destroy) old.bitmap.destroy();
        }
        try {
            const entry = { bitmap: Bitmap.load(shot), listeners: new WeakSet() };
            images.set(shot, entry); return entry;
        } catch (err) { return null; }
    };
    if (typeof Scene_Map !== 'undefined') {
        const start = Scene_Map.prototype.start;
        Scene_Map.prototype.start = function() { S.reset(); return start.apply(this, arguments); };
        const terminate = Scene_Map.prototype.terminate;
        Scene_Map.prototype.terminate = function() {
            const result = terminate.apply(this, arguments);
            if (typeof Scene_Battle !== 'undefined' && SceneManager.isNextScene(Scene_Battle)) S.reset();
            else S.capture();
            return result;
        };
    }
    if (typeof Game_Map !== 'undefined') {
        const setup = Game_Map.prototype.setup;
        Game_Map.prototype.setup = function() { S.reset(); return setup.apply(this, arguments); };
    }
    if (typeof DataManager !== 'undefined') {
        const makeInfo = DataManager.makeSavefileInfo;
        DataManager.makeSavefileInfo = function() {
            const info = makeInfo.apply(this, arguments);
            if (S.enabled() && typeof $gameMap !== 'undefined' && $gameMap) {
                Object.assign(info, S.currentInfo());
                if (S._shot && S._shot.mapId === $gameMap.mapId()) info.docsShot = S._shot.value;
            }
            return info;
        };
        for (const name of ['createGameObjects', 'extractSaveContents']) {
            if (typeof DataManager[name] !== 'function') continue;
            const original = DataManager[name];
            DataManager[name] = function() { S.reset(); return original.apply(this, arguments); };
        }
    }
    if (typeof Window_SavefileList !== 'undefined' && typeof Window_SavefileList.prototype.drawContents === 'function') {
        const draw = Window_SavefileList.prototype.drawContents;
        Window_SavefileList.prototype.drawContents = function(info, rect) {
            if (this.constructor !== Window_SavefileList || !S.enabled() || !info || !rect || rect.width < 300 || rect.height < 96) return draw.apply(this, arguments);
            const entry = S.image(info.docsShot), bitmap = entry && entry.bitmap;
            if (!bitmap || bitmap.isError()) return draw.apply(this, arguments);
            if (!bitmap.isReady()) {
                if (!entry.listeners.has(this)) {
                    entry.listeners.add(this);
                    bitmap.addLoadListener(() => {
                        if (!this.destroyed && this.contents && typeof this.refresh === 'function') this.refresh();
                    });
                }
                return draw.apply(this, arguments);
            }
            // drawItem has already drawn MZ's File 1 / Autosave title at the top left.
            const line = this.lineHeight();
            const size = S.fit(bitmap.width, bitmap.height, Math.min(160, rect.height - line - 8));
            if (!size) return draw.apply(this, arguments);
            this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, rect.x, rect.y + line + 4, size.width, size.height);
            const x = rect.x + 172, width = rect.width - 172;
            this.drawText([S.text(info.docsPlace,120), S.clockText(info.docsClock)].filter(Boolean).join(' · '), x, rect.y, width, 'left');
            return draw.call(this, info, Object.assign({}, rect, { x, y: rect.y + line, width, height: rect.height - line }));
        };
    }
})();
