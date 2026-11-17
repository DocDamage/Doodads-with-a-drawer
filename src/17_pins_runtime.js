//==========================================================
// SECTION 7P: PINS ON THE MINIMAP AND THE WORLD MAP, AND FAST TRAVEL (9.1.6)
//==========================================================
(function() {
    const P = DocsDoodads.Pins;
    const switchOn = id => typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false;
    P.forbidSwitch = typeof fastTravelForbidSwitch !== 'undefined' ? fastTravelForbidSwitch : 0;

    // An event's pin, read again only when its page changes.
    P._eventCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
    P.currentPins = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap) return [];
        const mapId = $gameMap.mapId(), events = [];
        for (const ev of typeof $gameMap.events === 'function' ? $gameMap.events() : []) {
            if (!ev || typeof ev.eventId !== 'function') continue;
            const page = ev._pageIndex;
            let cached = this._eventCache ? this._eventCache.get(ev) : null;
            if (!cached || cached.page !== page) {
                let text = '';
                try { text = DocsDoodads.VisualEquip && DocsDoodads.VisualEquip.eventText ? DocsDoodads.VisualEquip.eventText(ev) : ''; } catch (error) { text = ''; }
                cached = { page, tag: this.parseTag(text) };
                if (this._eventCache) this._eventCache.set(ev, cached);
            }
            if (cached.tag && page >= 0) events.push({ id: `m${mapId}e${ev.eventId()}`, x: ev.x, y: ev.y, icon: cached.tag.icon, name: cached.tag.name, travel: false, switchId: 0, event: true });
        }
        return this.list(mapId).concat(events);
    };

    P.context = function(mapId, map) {
        const E = DocsDoodads.Explored, M = DocsDoodads.Minimap, cfg = M.settingsFor(mapId);
        const seen = cfg.fog && map ? E.entry(mapId, map.width, map.height) : null;
        return {
            fog: cfg.fog, radius: cfg.radius,
            found: id => this.isFound(id), hidden: id => this.isHidden(id), switchOn,
            explored: (x, y) => Boolean(seen && E.isExplored(seen, x, y))
        };
    };

    // Called as the player reaches a new tile: pins nearby become found (kept in the save).
    P.discoverHere = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || typeof $gamePlayer === 'undefined' || !$gamePlayer) return [];
        const key = $gameMap.mapId() + ':' + $gamePlayer.x + ',' + $gamePlayer.y;
        if (this._lastTile === key) return [];
        this._lastTile = key;
        const pins = this.currentPins();
        if (!pins.length) return [];
        const map = DocsDoodads.Minimap.forCurrentMap(), ctx = this.context($gameMap.mapId(), map);
        return this.discoverNear(pins, Object.assign(ctx, { px: $gamePlayer.x, py: $gamePlayer.y, width: $gameMap.width(), height: $gameMap.height(),
            loopX: $gameMap.isLoopHorizontal(), loopY: $gameMap.isLoopVertical() }));
    };

    P.visibleHere = function(map) {
        const ctx = this.context($gameMap.mapId(), map);
        return this.currentPins().filter(pin => this.visible(pin, ctx));
    };

    P.iconSprite = function(pin, size) {
        const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        sprite.anchor.set(0.5, 0.5);
        sprite.scale.set(size / 32);
        const bitmap = typeof ImageManager !== 'undefined' ? ImageManager.loadSystem('IconSet') : null;
        const apply = () => {
            if (!bitmap || !bitmap._baseTexture) return;
            const unit = typeof ImageManager !== 'undefined' && ImageManager.iconWidth ? ImageManager.iconWidth : 32;
            const f = this.iconFrame(pin.icon, unit);
            if (f.x + f.w > bitmap.width || f.y + f.h > bitmap.height) return;
            sprite.texture = new PIXI.Texture(bitmap._baseTexture, new PIXI.Rectangle(f.x, f.y, f.w, f.h));
            sprite.scale.set(size / unit);
        };
        if (bitmap && (!bitmap.isReady || bitmap.isReady())) apply();
        else if (bitmap && bitmap.addLoadListener) bitmap.addLoadListener(apply);
        sprite._docsPinId = pin.id;
        return sprite;
    };

    if (typeof Spriteset_Map !== 'undefined' && typeof PIXI !== 'undefined' && Spriteset_Map.prototype.updateDocsMinimap) {
        const updateMinimap = Spriteset_Map.prototype.updateDocsMinimap;
        Spriteset_Map.prototype.updateDocsMinimap = function() {
            updateMinimap.call(this);
            if (!(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted)) P.discoverHere();
            const mini = this._docsMinimap;
            if (!mini || !mini.visible) return;
            const map = DocsDoodads.Minimap.forCurrentMap();
            const pins = map ? P.visibleHere(map) : [];
            const signature = pins.map(p => `${p.id}@${p.x},${p.y}#${p.icon}`).join('|');
            if (mini._docsPinSignature !== signature) {
                mini._docsPinSignature = signature;
                if (mini._docsPins) { mini.removeChild(mini._docsPins); mini._docsPins.destroy({ children: true }); }
                mini._docsPins = new PIXI.Container();
                for (const pin of pins) {
                    const icon = P.iconSprite(pin, 14);
                    icon.x = (pin.x + 0.5) * mini._docsScale; icon.y = (pin.y + 0.5) * mini._docsScale;
                    mini._docsPins.addChild(icon);
                }
                // Under the player's arrow.
                mini.addChildAt(mini._docsPins, Math.max(0, mini.children.indexOf(mini._docsArrow)));
            }
        };
    }

    const Scene = DocsDoodads.Scene_DocsWorldMap;
    if (Scene && Scene.prototype && typeof Scene.prototype.create === 'function' && typeof Window_Help !== 'undefined') {
        const create = Scene.prototype.create;
        Scene.prototype.create = function() {
            create.call(this);
            this._docsPinLayer = new PIXI.Container();
            this.addChild(this._docsPinLayer);
            this._docsTravel = P.travelAllowed(P.forbidSwitch, switchOn)
                ? P.travelList({ mapInfos: typeof $dataMapInfos !== 'undefined' ? $dataMapInfos : [], switchOn }) : [];
            this._docsTravelIndex = -1;
            if (this._docsTravel.length) {
                const here = this._docsTravel.findIndex(row => row.mapId === $gameMap.mapId());
                this._docsTravelIndex = here >= 0 ? here : 0;
            }
            this._docsConfirm = false;
            const rect = new Rectangle(0, 0, Graphics.boxWidth, this.calcWindowHeight ? this.calcWindowHeight(1, false) : 72);
            this._docsPinHelp = new Window_Help(rect);
            this.addWindow(this._docsPinHelp);
            this.drawDocsPins();
        };

        Scene.prototype.drawDocsPins = function() {
            const layer = this._docsPinLayer;
            if (!layer) return;
            layer.removeChildren().forEach(child => child.destroy && child.destroy());
            const map = this._map, travel = this._docsTravel || [], chosen = travel[this._docsTravelIndex];
            if (map && !this._globe && this._picture && this._picture.bitmap) {
                const scale = this._picture.bitmap.width / map.width;
                for (const pin of P.visibleHere(DocsDoodads.Minimap.forCurrentMap())) {
                    const icon = P.iconSprite(pin, 24);
                    icon.x = this._picture.x + (pin.x + 0.5) * scale; icon.y = this._picture.y + (pin.y + 0.5) * scale;
                    if (chosen && chosen.pin.id === pin.id && chosen.mapId === $gameMap.mapId()) {
                        const ring = new PIXI.Graphics();
                        ring.lineStyle(3, 0xffffff, 1).drawCircle(icon.x, icon.y, 16);
                        layer.addChild(ring);
                    }
                    layer.addChild(icon);
                }
            }
            const help = this._docsPinHelp;
            if (!help) return;
            if (!chosen) help.setText(travel.length ? '' : 'OK or Cancel to close.');
            else if (this._docsConfirm) help.setText(`Travel to ${chosen.pin.name} (${chosen.mapName})? OK to go, Cancel to stay.`);
            else help.setText(`${chosen.pin.name} · ${chosen.mapName}${travel.length > 1 ? '   ◀ ▶ to choose' : ''}   OK to travel`);
        };

        Scene.prototype.docsTravelTo = function(row) {
            if (!row || !P.travelAllowed(P.forbidSwitch, switchOn)) return false;
            $gamePlayer.reserveTransfer(row.mapId, row.pin.x, row.pin.y, 2, 0);
            this.popScene();
            return true;
        };

        const update = Scene.prototype.update;
        Scene.prototype.update = function() {
            const travel = this._docsTravel || [];
            if (!travel.length) return update.call(this);
            Scene_MenuBase.prototype.update.call(this);
            const step = (Input.isRepeated('down') || (!this._globe && Input.isRepeated('right'))) ? 1
                : (Input.isRepeated('up') || (!this._globe && Input.isRepeated('left'))) ? -1 : 0;
            if (this._globe && (Input.isPressed('left') || Input.isPressed('right'))) {
                this._spin += Input.isPressed('left') ? -0.05 : 0.05;
                this.drawWorldMap();
            }
            if (step && !this._docsConfirm) {
                this._docsTravelIndex = (this._docsTravelIndex + step + travel.length) % travel.length;
                SoundManager.playCursor();
                this.drawDocsPins();
            } else if (Input.isTriggered('ok') || TouchInput.isTriggered()) {
                if (this._docsConfirm) {
                    SoundManager.playOk();
                    this.docsTravelTo(travel[this._docsTravelIndex]);
                } else {
                    SoundManager.playOk();
                    this._docsConfirm = true;
                    this.drawDocsPins();
                }
            } else if (Input.isTriggered('cancel') || TouchInput.isCancelled()) {
                SoundManager.playCancel();
                if (this._docsConfirm) { this._docsConfirm = false; this.drawDocsPins(); }
                else this.popScene();
            }
        };

        const draw = Scene.prototype.drawWorldMap;
        Scene.prototype.drawWorldMap = function() {
            draw.call(this);
            if (this._docsPinLayer) this.drawDocsPins();
        };
    }

    if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
        PluginManager.registerCommand(pluginName, 'findPin', args => {
            const found = P.find(args.pin);
            if (found) { P.discover(found.pin.id); P.setHidden(found.pin.id, false); }
            return Boolean(found);
        });
        PluginManager.registerCommand(pluginName, 'hidePin', args => {
            const found = P.find(args.pin);
            if (found) P.setHidden(found.pin.id, String(args.hidden) !== 'false');
            return Boolean(found);
        });
        PluginManager.registerCommand(pluginName, 'openFastTravel', () => {
            if (typeof SceneManager !== 'undefined' && Scene && typeof Scene.prototype.create === 'function') SceneManager.push(Scene);
        });
    }
})();
