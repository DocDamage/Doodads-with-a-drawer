//==========================================================
// SECTION 7H: VISUAL EQUIPMENT & MAP DESTINATION RUNTIME
//==========================================================
DocsDoodads.VisualEquip.settings = function() {
    return DocsDoodads.World.settings().visualEquip;
};

DocsDoodads.VisualEquip.env = function() {
    return {
        switch: id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false),
        variable: id => (typeof $gameVariables !== 'undefined' && $gameVariables ? $gameVariables.value(id) : 0)
    };
};

// Everything an actor wears: actor and class notes, equipment, states, and plugin-command changes.
DocsDoodads.VisualEquip.contextFor = function(actor, extraNotes) {
    const data = typeof actor.actor === 'function' ? actor.actor() : null;
    const cls = typeof actor.currentClass === 'function' ? actor.currentClass() : null;
    const v = actor._docsVisual || {};
    const equips = typeof actor.equips === 'function' ? actor.equips().filter(Boolean).map(e => e.note) : [];
    const states = typeof actor.states === 'function' ? actor.states().map(s => s.note) : [];
    return {
        actorNote: [data && data.note, cls && cls.note].filter(Boolean).join('\n'),
        equipNotes: equips.concat(states, v.notes || []),
        extraNotes: extraNotes || [],
        alias: v.alias || '',
        colors: v.colors || null
    };
};

DocsDoodads.VisualEquip.layersForActor = function(actor, extraNotes) {
    if (!actor) return extraNotes && extraNotes.length ? this.resolve({ extraNotes }, this.env()) : [];
    return this.resolve(this.contextFor(actor, extraNotes), this.env());
};

// An event's note and the comments on its current page.
DocsDoodads.VisualEquip._eventText = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
DocsDoodads.VisualEquip.eventText = function(ev) {
    const cache = this._eventText;
    const hit = cache ? cache.get(ev) : null;
    if (hit && hit.page === ev._pageIndex) return hit.text;
    const lines = [(ev.event() || {}).note || ''];
    const page = typeof ev.page === 'function' ? ev.page() : null;
    for (const cmd of (page && page.list) || []) {
        if (cmd && (cmd.code === 108 || cmd.code === 408) && cmd.parameters) lines.push(String(cmd.parameters[0] || ''));
    }
    const text = lines.join('\n');
    if (cache) cache.set(ev, { page: ev._pageIndex, text });
    return text;
};

// Gear shows while the character uses the actor's own image, so a transformation hides it.
DocsDoodads.VisualEquip.layersForCharacter = function(ch) {
    const s = this.settings();
    if (!s.enabled || !ch) return [];
    const sameImage = actor => actor && ch.characterName() === actor.characterName() && ch.characterIndex() === actor.characterIndex();
    if (typeof Game_Player !== 'undefined' && ch instanceof Game_Player) {
        const leader = $gameParty.leader();
        return sameImage(leader) ? this.layersForActor(leader) : [];
    }
    if (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower) {
        const actor = ch.actor();
        return s.followers && sameImage(actor) ? this.layersForActor(actor) : [];
    }
    if (typeof Game_Event !== 'undefined' && ch instanceof Game_Event && s.events) {
        // A page without an image (a hidden or removed NPC) shows no gear either.
        if (!ch.event() || !ch.characterName()) return [];
        const text = this.eventText(ch);
        if (!/<\s*visual/i.test(text)) return [];
        const note = this.parseNote(text);
        const actor = note.actorId && typeof $gameActors !== 'undefined' ? $gameActors.actor(note.actorId) : null;
        return this.layersForActor(actor, [text]);
    }
    return [];
};

// A layer sheet recoloured for drawing in windows (cached), or null while it loads.
DocsDoodads.VisualEquip._recolored = new Map();
DocsDoodads.VisualEquip.windowBitmap = function(layer, onReady) {
    const source = ImageManager.loadCharacter(layer.image);
    if (!source.isReady()) {
        if (onReady && !source.isError()) source.addLoadListener(onReady);
        return null;
    }
    if (!layer.hue && (layer.tint === null || layer.tint === undefined)) return source;
    const key = layer.image + '|' + layer.hue + '|' + layer.tint;
    let out = this._recolored.get(key);
    if (out && out._docsSource === source) return out;
    out = new Bitmap(source.width, source.height);
    out.blt(source, 0, 0, source.width, source.height, 0, 0);
    const ctx = out.context;
    const image = ctx.getImageData(0, 0, out.width, out.height);
    this.recolor(image.data, layer.hue, layer.tint);
    ctx.putImageData(image, 0, 0);
    out.baseTexture.update();
    out._docsSource = source;
    if (this._recolored.size > 64) this._recolored.clear();
    this._recolored.set(key, out);
    return out;
};

if (typeof Sprite_Character !== 'undefined' && typeof Sprite !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    const C = DocsDoodads.CharacterAnim;

    $.Sprite_Character_update_visual = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        $.Sprite_Character_update_visual.call(this);
        this.updateDocsVisual();
    };

    Sprite_Character.prototype.updateDocsVisual = function() {
        const ch = this._character;
        const layers = ch && this.parent && !(ch.tileId() > 0) ? VE.layersForCharacter(ch) : [];
        const sig = VE.signature(layers);
        if (sig !== this._docsVisualSig) {
            this._docsVisualSig = sig;
            this.rebuildDocsVisual(layers);
        }
        if (this._docsVisualSprites && this._docsVisualSprites.length) this.updateDocsVisualSprites();
    };

    Sprite_Character.prototype.removeDocsVisual = function() {
        for (const sprite of this._docsVisualSprites || []) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy({ children: true });
        }
        this._docsVisualSprites = [];
    };

    Sprite_Character.prototype.rebuildDocsVisual = function(layers) {
        this.removeDocsVisual();
        for (const layer of layers) {
            const sprite = new Sprite(ImageManager.loadCharacter(layer.image));
            sprite._docsMainBitmap = sprite.bitmap;
            sprite.anchor.set(0.5, 1);
            sprite.setHue(layer.hue || 0);
            if (layer.tint !== null && layer.tint !== undefined) sprite.tint = layer.tint;
            sprite._docsLayer = layer;
            sprite._docsBillboardOwner = this;
            this._docsVisualSprites.push(sprite);
        }
        // The layers' idle and run sheets load now, so switching to them doesn't wait.
        const ch = this._character;
        const set = ch && ch.characterName ? C.setFor(ch.characterName(), C.sets()) : null;
        for (const layer of set ? layers : []) {
            for (const sheet of [set.idle, set.run].filter(Boolean)) {
                const variant = VE.stateSheetFor(layer.image, ch.characterName(), sheet);
                if (variant && DocsDoodads.Traversal.sheetExists(variant)) ImageManager.loadCharacter(variant);
            }
        }
    };

    // While the body plays its idle, run or an action sheet, a layer with a matching sheet of its own
    // (Hat_idle[f2] beside Hat) draws that one, once it has loaded; otherwise its usual sheet.
    Sprite_Character.prototype.docsVisualSheet = function(sprite, anim) {
        const layer = sprite._docsLayer;
        const variant = anim ? VE.stateSheetFor(layer.image, this._character.characterName(), anim.sheet) : '';
        if (variant && DocsDoodads.Traversal.sheetExists(variant)) {
            const bitmap = ImageManager.loadCharacter(variant);
            if (bitmap.isReady()) return { name: variant, bitmap };
        }
        return { name: layer.image, bitmap: sprite._docsMainBitmap || sprite.bitmap };
    };

    // Bush depth: a translucent lower half, like MZ does for the body.
    Sprite_Character.prototype.docsVisualHalves = function(sprite) {
        if (!sprite._docsUpper) {
            sprite._docsUpper = new Sprite(sprite.bitmap);
            sprite._docsLower = new Sprite(sprite.bitmap);
            sprite._docsUpper.anchor.set(0.5, 1);
            sprite._docsLower.anchor.set(0.5, 1);
            sprite._docsLower.opacity = 128;
            sprite.addChild(sprite._docsUpper);
            sprite.addChild(sprite._docsLower);
        }
        return [sprite._docsUpper, sprite._docsLower];
    };

    Sprite_Character.prototype.updateDocsVisualSprites = function() {
        const ch = this._character;
        const anim = this._docsAnim;
        const facing = anim ? anim.facing : DocsDoodads.Perspective.displayFacing(ch.direction());
        const col = anim ? anim.frame : this.characterPatternX();
        const visible = this.visible && !ch.isTransparent();
        // Ties in the tilemap sort break by spriteId: just under or just over the body.
        const order = VE.orderFor(this._docsVisualSprites.map(sp => sp._docsLayer), facing);
        this._docsVisualSprites.forEach((sp, i) => { sp._docsOrder = order[i]; sp._docsZ = VE.zFor(sp._docsLayer, facing); });
        for (const sprite of this._docsVisualSprites) {
            if (sprite.parent !== this.parent) this.parent.addChild(sprite);
            const layer = sprite._docsLayer;
            const sheet = this.docsVisualSheet(sprite, anim);
            if (sprite.bitmap !== sheet.bitmap) {
                sprite.bitmap = sheet.bitmap;
                if (sprite._docsUpper) sprite._docsUpper.bitmap = sprite._docsLower.bitmap = sheet.bitmap;
                sprite._docsFull = null;
            }
            const bitmap = sprite.bitmap;
            sprite.visible = visible && bitmap.isReady();
            if (!sprite.visible) continue;
            const layout = C.parseName(sheet.name);
            const row = C.rowFor(facing, layout.dirs);
            const rect = DocsDoodads.safeFrame(VE.frameRect(sheet.name, bitmap.width, bitmap.height,
                layer.index !== null ? layer.index : ch.characterIndex(), col, row.row), bitmap.width, bitmap.height);
            // A layer sheet with art below the feet ([bN]) stands on the same feet as the body.
            const below = Math.max(0, Math.min(C.belowFor(sheet.name, C.feet ? C.feet() : null), rect.h - 1));
            sprite.anchor.y = C.footAnchor(rect.h, below);
            const depth = this._bushDepth > 0 ? Math.min(this._bushDepth, rect.h - below) : 0;
            if (depth > 0) {
                const [upper, lower] = this.docsVisualHalves(sprite);
                upper.visible = lower.visible = true;
                sprite.setFrame(rect.x, rect.y, 0, rect.h);
                upper.setFrame(rect.x, rect.y, rect.w, rect.h - below - depth);
                upper.y = -depth;
                lower.setFrame(rect.x, rect.y + rect.h - below - depth, rect.w, depth + below);
                lower.y = below;
            } else {
                if (sprite._docsUpper) sprite._docsUpper.visible = sprite._docsLower.visible = false;
                sprite.setFrame(rect.x, rect.y, rect.w, rect.h);
            }
            sprite._docsRect = rect;
            sprite.x = this.x;
            sprite.y = this.y;
            sprite.z = this.z;
            sprite.spriteId = this.spriteId + sprite._docsOrder;
            if (this._docsSortY !== undefined) sprite._docsSortY = this._docsSortY;
            sprite.scale.set(Math.abs(this.scale.x) * (row.mirror ? -1 : 1), this.scale.y);
            sprite.rotation = this.rotation;
            sprite.opacity = this.opacity;
            sprite.blendMode = this.blendMode;
            sprite.setBlendColor(this.getBlendColor());
            sprite.setColorTone(this.getColorTone());
        }
    };

    // A whole-frame texture for a layer (reflections draw it upside down).
    Sprite_Character.prototype.docsVisualTexture = function(sprite) {
        const rect = sprite._docsRect;
        const base = sprite.bitmap && sprite.bitmap.baseTexture;
        if (!rect || !base) return null;
        const last = sprite._docsFullRect;
        if (!sprite._docsFull || !last || last.x !== rect.x || last.y !== rect.y || last.w !== rect.w || last.h !== rect.h) {
            sprite._docsFull = new PIXI.Texture(base, new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h));
            sprite._docsFullRect = rect;
        }
        return sprite._docsFull;
    };
}

if (typeof Sprite_Actor !== 'undefined' && typeof Sprite !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;

    // Side-view battlers: layers from each item's "sv" sheet, in the same cell as the battler.
    $.Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
    Sprite_Actor.prototype.updateFrame = function() {
        $.Sprite_Actor_updateFrame.call(this);
        this.updateDocsVisual();
    };

    Sprite_Actor.prototype.updateDocsVisual = function() {
        const s = VE.settings();
        const main = this._mainSprite;
        if (!main) return;
        const layers = s.enabled && s.battlers && this._actor ? VE.layersForActor(this._actor).filter(l => l.sv) : [];
        const sig = VE.signature(layers);
        if (sig !== this._docsVisualSig) {
            this._docsVisualSig = sig;
            for (const sprite of this._docsVisualSprites || []) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.destroy();
            }
            this._docsVisualSprites = [];
            let front = 0;
            for (const layer of layers) {
                const sprite = new Sprite(ImageManager.loadSvActor(layer.sv));
                sprite.anchor.set(0.5, 1);
                sprite.setHue(layer.hue || 0);
                if (layer.tint !== null && layer.tint !== undefined) sprite.tint = layer.tint;
                const at = this.children.indexOf(main);
                if (layer.z < 0) this.addChildAt(sprite, at);
                else this.addChildAt(sprite, at + 1 + (front++));
                this._docsVisualSprites.push(sprite);
            }
        }
        const base = main.bitmap;
        for (const sprite of this._docsVisualSprites || []) {
            const bitmap = sprite.bitmap;
            sprite.visible = main.visible && Boolean(base) && base.isReady() && bitmap.isReady() && base.width > 0;
            if (!sprite.visible) continue;
            const rect = DocsDoodads.safeFrame(VE.svRect(bitmap.width, bitmap.height, main._frame, base.width, base.height), bitmap.width, bitmap.height);
            sprite.setFrame(rect.x, rect.y, rect.w, rect.h);
            sprite.x = main.x;
            sprite.y = main.y;
            const k = VE.svScale(bitmap.width, bitmap.height, base.width, base.height);
            sprite.scale.set(main.scale.x * k.x, main.scale.y * k.y);
            sprite.opacity = main.opacity;
            sprite.blendMode = main.blendMode;
        }
    };
}

// Menus and save files draw the same layers.
if (typeof Window_Base !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    const C = DocsDoodads.CharacterAnim;

    // Draws a character standing and facing down, with its layers; `zoom` scales it up.
    Window_Base.prototype.drawDocsCharacter = function(characterName, characterIndex, x, y, layers, zoom) {
        zoom = zoom || 1;
        const refresh = () => { if (typeof this.refresh === 'function' && !this._destroyed) this.refresh(); };
        const ctx = this.contents.context;
        const smooth = ctx.imageSmoothingEnabled;
        if (zoom !== 1) ctx.imageSmoothingEnabled = false;
        const drawSheet = (bitmap, name, index) => {
            const layout = C.parseName(name);
            const rect = VE.frameRect(name, bitmap.width, bitmap.height, index, C.standingFrame(layout.frames), C.rowFor(2, layout.dirs).row);
            const w = rect.w * zoom, h = rect.h * zoom, below = Math.min(C.belowFor(name, C.feet ? C.feet() : null), rect.h - 1) * zoom;
            this.contents.blt(bitmap, rect.x, rect.y, rect.w, rect.h, x - w / 2, y - h + Math.max(0, below), w, h);
        };
        const drawLayers = list => {
            for (const layer of list) {
                const bitmap = VE.windowBitmap(layer, refresh);
                if (bitmap) drawSheet(bitmap, layer.image, layer.index !== null && layer.index !== undefined ? layer.index : characterIndex);
            }
        };
        drawLayers(layers.filter(l => l.z < 0));
        if (characterName) {
            const body = ImageManager.loadCharacter(characterName);
            if (body.isReady()) drawSheet(body, characterName, characterIndex);
            else if (!body.isError()) body.addLoadListener(refresh);
        }
        drawLayers(layers.filter(l => l.z >= 0));
        ctx.imageSmoothingEnabled = smooth;
    };
}

if (typeof Window_StatusBase !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.Window_StatusBase_drawActorCharacter = Window_StatusBase.prototype.drawActorCharacter;
    Window_StatusBase.prototype.drawActorCharacter = function(actor, x, y) {
        const s = VE.settings();
        const layers = s.enabled && s.menus ? VE.layersForActor(actor) : [];
        if (!layers.length) return $.Window_StatusBase_drawActorCharacter.call(this, actor, x, y);
        this.drawDocsCharacter(actor.characterName(), actor.characterIndex(), x, y, layers);
    };
}

// The equip screen shows the actor wearing what is highlighted (try before you equip).
if (typeof Window_EquipStatus !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.Window_EquipStatus_refresh = Window_EquipStatus.prototype.refresh;
    Window_EquipStatus.prototype.refresh = function() {
        $.Window_EquipStatus_refresh.call(this);
        const s = VE.settings();
        const actor = this._tempActor || this._actor;
        if (!actor || !s.enabled || !s.equipPreview) return;
        const layers = VE.layersForActor(actor);
        const all = layers.length || VE.layersForActor(this._actor).length;
        if (!all) return;
        const left = this.itemPadding() + ImageManager.standardFaceWidth;
        const room = this.innerWidth - left;
        if (room < 60) return;
        const zoom = room >= 110 ? 2 : 1;
        this.drawDocsCharacter(actor.characterName(), actor.characterIndex(), left + room / 2, this.lineHeight() + ImageManager.standardFaceHeight, layers, zoom);
    };
}

if (typeof DataManager !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.DataManager_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = $.DataManager_makeSavefileInfo.call(this);
        const s = VE.settings();
        if (s.enabled && s.menus && typeof $gameParty !== 'undefined' && $gameParty) {
            const lists = VE.savefileLayers($gameParty.battleMembers().map(a => VE.layersForActor(a)));
            if (lists.some(l => l.length)) info.docsVisual = lists;
        }
        return info;
    };
    $.DataManager_loadSavefileImages = DataManager.loadSavefileImages;
    DataManager.loadSavefileImages = function(info) {
        $.DataManager_loadSavefileImages.call(this, info);
        for (const list of (info && info.docsVisual) || []) for (const layer of list || []) ImageManager.loadCharacter(layer.image);
    };
}

if (typeof Window_SavefileList !== 'undefined') {
    $.Window_SavefileList_drawPartyCharacters = Window_SavefileList.prototype.drawPartyCharacters;
    Window_SavefileList.prototype.drawPartyCharacters = function(info, x, y) {
        if (!info.docsVisual || !info.characters) return $.Window_SavefileList_drawPartyCharacters.call(this, info, x, y);
        info.characters.forEach((data, i) => this.drawDocsCharacter(data[0], data[1], x + i * 48, y, info.docsVisual[i] || []));
    };
}

// ---- Map destination ----
DocsDoodads.World.defaults.destination = Object.assign({}, DocsDoodads.Destination.defaults);

DocsDoodads.Destination.current = function() {
    const project = DocsDoodads.World.settings().destination;
    const over = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsDestination || null : null;
    const c = this._current;
    if (c && c.project === project && c.over === over) return c.value;
    const value = this.merge(project, over);
    this._current = { project, over, value };
    return value;
};

if (typeof Sprite_Destination !== 'undefined') {
    const D = DocsDoodads.Destination;

    $.Sprite_Destination_destroy = Sprite_Destination.prototype.destroy;
    Sprite_Destination.prototype.destroy = function(options) {
        this.stopDocsEffect();
        if (this._docsDots && this._docsDots.parent) this._docsDots.parent.removeChild(this._docsDots);
        if (this._docsAnchor && this._docsAnchor.parent) this._docsAnchor.parent.removeChild(this._docsAnchor);
        // Images from img/system are shared through ImageManager's cache; only drawn markers are ours.
        if (!this._docsOwnBitmap) this.bitmap = null;
        $.Sprite_Destination_destroy.call(this, options);
    };

    // MZ's update (and any plugin's that wrapped it first) runs, then the marker's own style is applied
    // over it, counted on its own frame counter (MZ's wraps every 20 frames).
    $.Sprite_Destination_update = Sprite_Destination.prototype.update;
    Sprite_Destination.prototype.update = function() {
        $.Sprite_Destination_update.call(this);
        const s = D.current();
        this.updateDocsStyle(s);
        this.z = D.zFor(s.layer);
        if (!$gameTemp.isDestinationValid()) {
            this._docsFrame = 0;
            this.visible = false;
            this._docsKey = null;
            this.stopDocsEffect();
            if (this._docsDots) this._docsDots.visible = false;
            return;
        }
        const key = $gameTemp.destinationX() + ',' + $gameTemp.destinationY() + ',' + s.style;
        if (key !== this._docsKey) {
            this._docsKey = key;
            this._docsFrame = 0;
            this.stopDocsEffect();
        }
        this.updatePosition();
        this._docsFrame = (this._docsFrame || 0) + 1;
        const p = D.pulse(s.pulse, this._docsFrame);
        const drawn = !['none', 'animation', 'vfx'].includes(s.style);
        this.visible = true;
        this.opacity = drawn ? s.opacity * p.alpha : 0;
        this.scale.set(s.scale * p.scale, s.scale * p.scale);
        this.rotation = D.rotation(s.spin, this._docsFrame);
        this.y += D.bob(s.bob, this._docsFrame);
        this.blendMode = D.blendMode(s.blend);
        if (s.style === 'image' && this.bitmap && this.bitmap.isReady()) {
            const f = D.imageFrame(s.image, this.bitmap.width, this.bitmap.height, this._docsFrame, s.fps);
            this.setFrame(f.x, f.y, f.w, f.h);
        }
        this.updateDocsEffect(s);
        this.updateDocsDots(s);
    };

    // The marker's picture: a shape drawn in its colour, or an image.
    Sprite_Destination.prototype.updateDocsStyle = function(s) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const sig = [s.style, s.color, s.image, tw, th].join('|');
        if (sig === this._docsStyleSig) return;
        this._docsStyleSig = sig;
        if (this._docsOwnBitmap && this.bitmap) this.bitmap.destroy();
        this.tint = 0xffffff;
        if (s.style === 'image') {
            this._docsOwnBitmap = false;
            this.bitmap = s.image ? ImageManager.loadSystem(s.image) : new Bitmap(1, 1);
            this._docsOwnBitmap = !s.image;
            if (s.image) this.tint = parseInt(s.color.slice(1), 16);
        } else {
            this._docsOwnBitmap = true;
            this.bitmap = D.drawMarker(new Bitmap(tw, th), s.style, s.color);
            // An image style leaves its frame behind; drawn markers use the whole bitmap.
            this.setFrame(0, 0, tw, th);
        }
        this.anchor.set(0.5, 0.5);
    };

    Sprite_Destination.prototype.stopDocsEffect = function() {
        if (this._docsAnimation) {
            if (this._docsAnimation.parent) this._docsAnimation.parent.removeChild(this._docsAnimation);
            this._docsAnimation.destroy();
            this._docsAnimation = null;
        }
        if (this._docsVfx) {
            this._docsVfx.done = true;
            this._docsVfx = null;
        }
    };

    // A database animation (looped) or a VFX at the destination.
    Sprite_Destination.prototype.updateDocsEffect = function(s) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x = $gameTemp.destinationX(), y = $gameTemp.destinationY();
        if (s.style === 'vfx' && s.vfx) {
            if (!this._docsVfx || this._docsVfx.done) {
                this._docsVfx = DocsDoodads.Vfx.play({ id: s.vfx, x: (x + 0.5) * tw, y: (y + 0.5) * th, loop: true });
            }
            return;
        }
        if (s.style !== 'animation' || !this.parent || typeof $dataAnimations === 'undefined') return;
        const animation = $dataAnimations[s.animationId];
        if (!animation) return;
        if (!this._docsAnchor) {
            // Animations play centred on a tile-high target standing on the tile.
            this._docsAnchor = new Sprite(new Bitmap(1, th));
            this._docsAnchor.anchor.set(0.5, 1);
            this._docsAnchor.opacity = 0;
        }
        if (this._docsAnchor.parent !== this.parent) this.parent.addChild(this._docsAnchor);
        this._docsAnchor.x = ($gameMap.adjustX(x) + 0.5) * tw;
        this._docsAnchor.y = ($gameMap.adjustY(y) + 1) * th;
        this._docsAnchor.z = this.z;
        if (this._docsAnimation && !this._docsAnimation.isPlaying()) this.stopDocsEffect();
        if (!this._docsAnimation) {
            const mv = Boolean(animation.frames);
            const sprite = new (mv ? Sprite_AnimationMV : Sprite_Animation)();
            sprite.targetObjects = [];
            sprite.setup([this._docsAnchor], animation, false, 0, null);
            sprite.z = this.z + 0.01;
            this.parent.addChild(sprite);
            this._docsAnimation = sprite;
        }
    };

    // Dots along the way the player will walk.
    Sprite_Destination.prototype.updateDocsDots = function(s) {
        if (!s.pathDots || !this.parent || typeof PIXI === 'undefined') {
            if (this._docsDots) this._docsDots.visible = false;
            return;
        }
        if (!this._docsDots) {
            this._docsDots = new PIXI.Graphics();
            this._docsDots.z = D.zFor('ground');
            this._docsDots.blendMode = 0;
        }
        const dots = this._docsDots;
        if (dots.parent !== this.parent) this.parent.addChild(dots);
        dots.visible = true;
        const gx = $gameTemp.destinationX(), gy = $gameTemp.destinationY();
        const key = [gx, gy, $gamePlayer.x, $gamePlayer.y, s.dotSpacing].join(',');
        if (key !== this._docsPathKey) {
            this._docsPathKey = key;
            const path = D.path({ x: $gamePlayer.x, y: $gamePlayer.y }, { x: gx, y: gy },
                (nx, ny, fx, fy, d) => $gamePlayer.canPass(fx, fy, d), $gamePlayer.searchLimit(),
                { wrap: (nx, ny) => ({ x: $gameMap.roundX(nx), y: $gameMap.roundY(ny) }), distance: (ax, ay, bx, by) => $gameMap.distance(ax, ay, bx, by) });
            this._docsDotTiles = D.dots(path, s.dotSpacing);
        }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const color = parseInt(s.dotColor.slice(1), 16);
        const r = Math.max(3, Math.min(tw, th) * 0.11);
        dots.clear();
        (this._docsDotTiles || []).forEach((t, i) => {
            const fade = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(((this._docsFrame || 0) - i * 6) / 60 * Math.PI * 2));
            dots.beginFill(color, fade);
            dots.drawCircle(($gameMap.adjustX(t.x) + 0.5) * tw, ($gameMap.adjustY(t.y) + 0.5) * th, r);
            dots.endFill();
        });
    };
}

DocsDoodads.Destination.drawMarker = function(bitmap, style, color) {
    const w = bitmap.width, h = bitmap.height, ctx = bitmap.context;
    const r = Math.min(w, h) / 2;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (style === 'default') {
        ctx.fillRect(0, 0, w, h);
    } else if (style === 'square') {
        const inset = 4, rad = Math.min(10, r / 2);
        ctx.moveTo(inset + rad, inset);
        ctx.arcTo(w - inset, inset, w - inset, h - inset, rad);
        ctx.arcTo(w - inset, h - inset, inset, h - inset, rad);
        ctx.arcTo(inset, h - inset, inset, inset, rad);
        ctx.arcTo(inset, inset, w - inset, inset, rad);
        ctx.fill();
    } else if (style === 'circle') {
        ctx.arc(w / 2, h / 2, r - 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (style === 'ring') {
        ctx.lineWidth = Math.max(3, r * 0.18);
        ctx.arc(w / 2, h / 2, r - ctx.lineWidth, 0, Math.PI * 2);
        ctx.stroke();
    } else if (style === 'diamond') {
        ctx.moveTo(w / 2, 3);
        ctx.lineTo(w - 3, h / 2);
        ctx.lineTo(w / 2, h - 3);
        ctx.lineTo(3, h / 2);
        ctx.closePath();
        ctx.fill();
    } else if (style === 'cross') {
        ctx.lineWidth = Math.max(4, r * 0.25);
        const a = r * 0.45;
        ctx.moveTo(w / 2 - a, h / 2 - a);
        ctx.lineTo(w / 2 + a, h / 2 + a);
        ctx.moveTo(w / 2 + a, h / 2 - a);
        ctx.lineTo(w / 2 - a, h / 2 + a);
        ctx.stroke();
    } else if (style === 'arrow') {
        // Pointing down at the tile.
        ctx.moveTo(w / 2, h * 0.9);
        ctx.lineTo(w * 0.15, h * 0.45);
        ctx.lineTo(w * 0.36, h * 0.45);
        ctx.lineTo(w * 0.36, h * 0.1);
        ctx.lineTo(w * 0.64, h * 0.1);
        ctx.lineTo(w * 0.64, h * 0.45);
        ctx.lineTo(w * 0.85, h * 0.45);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    bitmap.baseTexture.update();
    return bitmap;
};

// Plugin commands.
DocsDoodads.VisualEquip.actorFor = function(args) {
    if (typeof $gameActors === 'undefined' || !$gameActors) return null;
    if (String(args.actor) === 'leader') return $gameParty.leader();
    return $gameActors.actor(Number(args.actorId) || 0);
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    const VE = DocsDoodads.VisualEquip;
    const visual = actor => (actor._docsVisual = actor._docsVisual || {});
    PluginManager.registerCommand(pluginName, 'setVisualAlias', function(args) {
        const actor = VE.actorFor(args);
        if (actor) visual(actor).alias = String(args.alias || '').trim();
    });
    PluginManager.registerCommand(pluginName, 'addVisualLayer', function(args) {
        const actor = VE.actorFor(args);
        const image = String(args.image || '').trim();
        if (!actor || !image) return;
        const part = String(args.part || '').trim() || image;
        const v = visual(actor);
        v.notes = (v.notes || []).filter(n => VE.parseNote(n).layers.every(l => String(l.part).toLowerCase() !== part.toLowerCase()));
        const sv = String(args.sv || '').trim();
        v.notes.push(`<visual: ${image}, z ${Number(args.z) || 0}, part ${part}${sv ? ', sv ' + sv : ''}>`);
    });
    PluginManager.registerCommand(pluginName, 'removeVisualLayer', function(args) {
        const actor = VE.actorFor(args);
        const part = String(args.part || '').trim().toLowerCase();
        if (!actor || !actor._docsVisual) return;
        const v = actor._docsVisual;
        v.notes = part ? (v.notes || []).filter(n => VE.parseNote(n).layers.every(l => String(l.part).toLowerCase() !== part && String(l.image).toLowerCase() !== part)) : [];
    });
    PluginManager.registerCommand(pluginName, 'setVisualColor', function(args) {
        const actor = VE.actorFor(args);
        // Parts match in any case (as layers do), so Hair and hair are one colour.
        const part = String(args.part || '').trim().toLowerCase();
        if (!actor || !part) return;
        const v = visual(actor);
        v.colors = Object.assign({}, v.colors);
        for (const key of Object.keys(v.colors)) if (key.toLowerCase() === part) delete v.colors[key];
        const tint = /^#?([0-9a-f]{6})$/i.exec(String(args.tint || '').trim());
        if (String(args.reset) !== 'true') v.colors[part] = { hue: Number(args.hue) || 0, tint: tint ? parseInt(tint[1], 16) : null };
    });
    PluginManager.registerCommand(pluginName, 'setDestination', function(args) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return;
        if (String(args.reset) === 'true') {
            $gameSystem._docsDestination = null;
            return;
        }
        const next = Object.assign({}, $gameSystem._docsDestination);
        const text = ['style', 'color', 'blend', 'pulse', 'layer', 'image', 'vfx', 'dotColor'];
        const numbers = ['opacity', 'scale', 'spin', 'bob', 'fps'];
        for (const key of text) if (String(args[key] || '').trim() !== '') next[key] = String(args[key]).trim();
        for (const key of numbers) if (String(args[key] === undefined ? '' : args[key]).trim() !== '') next[key] = Number(args[key]);
        if (Number(args.animationId) > 0) next.animationId = Number(args.animationId);
        if (args.pathDots === 'on' || args.pathDots === 'off') next.pathDots = args.pathDots === 'on';
        // A new object, so the cached marker settings refresh.
        $gameSystem._docsDestination = next;
    });
}

