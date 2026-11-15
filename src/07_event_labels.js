//==========================================================
// SECTION 7L: NAMES AND ICONS OVER EVENTS
//==========================================================
// <docs label: Blacksmith> and <docs icon: 87> in an event's note or a comment on its current page put a name,
// an icon from the IconSet or both over it; <docs label range: 4> shows them only within 4 tiles of the player
// (without it, always). World > Event Labels sets the size, colour and fade; the Show Event Labels command turns
// them off and on for a playthrough. The sprites are 15_spriteset_map_labels.js.
DocsDoodads.EventLabels = {
    defaults: { enabled: true, size: 16, colour: '#ffffff', fade: true },

    // { label, icon, range } from an event's text, or null when it has neither a label nor an icon.
    parse(text) {
        const s = String(text || '');
        const label = /<\s*docs\s+label\s*:\s*([^>]*?)\s*>/i.exec(s);
        const icon = /<\s*docs\s+icon\s*:\s*(\d+)\s*>/i.exec(s);
        const range = /<\s*docs\s+label\s+range\s*:\s*(\d+(?:\.\d+)?)\s*>/i.exec(s);
        const info = { label: label ? label[1].trim() : '', icon: icon ? Number(icon[1]) : 0, range: range ? Number(range[1]) : 0 };
        return info.label || info.icon > 0 ? info : null;
    },

    // An event's label (null for none), kept while its note and page comments stay the same.
    of(ev) {
        if (!ev || typeof ev.event !== 'function' || !ev.event()) return null;
        const VE = DocsDoodads.VisualEquip;
        const text = VE && VE.eventText ? VE.eventText(ev) : String(ev.event().note || '');
        const c = this._cache = this._cache || (typeof WeakMap !== 'undefined' ? new WeakMap() : null);
        const hit = c ? c.get(ev) : null;
        if (hit && hit.text === text) return hit.info;
        const info = this.parse(text);
        if (c) c.set(ev, { text, info });
        return info;
    },

    // Whether a map has any label or icon tag at all (kept per map), so a map without them costs nothing a frame.
    mapHas(dataMap) {
        if (!dataMap || typeof dataMap !== 'object') return false;
        const c = this._maps = this._maps || (typeof WeakMap !== 'undefined' ? new WeakMap() : null);
        if (c && c.has(dataMap)) return c.get(dataMap);
        const tag = /<\s*docs\s+(label|icon)\s*:/i;
        let found = false;
        for (const ev of dataMap.events || []) {
            if (!ev) continue;
            if (tag.test(ev.note || '')) { found = true; break; }
            for (const page of ev.pages || []) {
                if ((page.list || []).some(cmd => cmd && (cmd.code === 108 || cmd.code === 408) && tag.test(String((cmd.parameters || [])[0] || '')))) { found = true; break; }
            }
            if (found) break;
        }
        if (c) c.set(dataMap, found);
        return found;
    },

    settings() {
        const s = DocsDoodads.World.settings().labels || {};
        return Object.assign({}, this.defaults, s);
    },

    // On for this playthrough: World > Event Labels, unless the Show Event Labels command turned them off.
    enabled() {
        if (typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem._docsLabelsHidden) return false;
        return this.settings().enabled !== false;
    },

    // Within range tiles (dx, dy from the player); range 0 is always.
    inRange(range, dx, dy) {
        return !(range > 0) || Math.hypot(dx, dy) <= range + 1e-9;
    },

    // Whether an event shows its label now: not erased, on a page, and either drawn or one the player can walk
    // through (an invisible door or exit). An invisible event that blocks the way has no label.
    shows(ev, info) {
        if (!info || !ev || ev._erased) return false;
        const page = typeof ev.page === 'function' ? ev.page() : null;
        if (!page) return false;
        const drawn = Boolean(ev.characterName && ev.characterName()) || (ev.tileId && ev.tileId() > 0);
        return drawn || Boolean(ev.isThrough && ev.isThrough());
    },

    // The note with these label and icon tags (others left as they were): label '' and icon 0 take them out.
    writeNote(note, label, icon) {
        let s = String(note || '').replace(/<\s*docs\s+label\s*:[^>]*>/gi, '').replace(/<\s*docs\s+icon\s*:[^>]*>/gi, '');
        s = s.replace(/[ \t]{2,}/g, ' ').trim();
        const add = [];
        const name = String(label || '').replace(/[<>]/g, '').trim();
        if (name) add.push(`<docs label: ${name}>`);
        if (Number(icon) > 0) add.push(`<docs icon: ${Math.floor(Number(icon))}>`);
        return [s].concat(add).filter(Boolean).join(s && add.length ? ' ' : '');
    },

    // The picture for a label: the icon (from IconSet, once it has loaded), then the name, outlined. Kept per
    // look; null until the icon set has loaded.
    bitmap(info, settings) {
        const size = Math.max(8, Math.min(48, Number(settings.size) || 16));
        const colour = String(settings.colour || '#ffffff');
        const key = `${info.icon}|${info.label}|${size}|${colour}`;
        const cache = this._bitmaps = this._bitmaps || new Map();
        if (cache.has(key)) return cache.get(key);
        let iconSet = null;
        if (info.icon > 0) {
            iconSet = ImageManager.loadSystem('IconSet');
            if (!iconSet.isReady()) return null;
        }
        const pw = ImageManager.iconWidth || 32, ph = ImageManager.iconHeight || 32;
        const iconSize = iconSet ? Math.round(size * 1.5) : 0;
        const probe = new Bitmap(1, 1);
        probe.fontSize = size;
        if (typeof $gameSystem !== 'undefined' && $gameSystem && $gameSystem.mainFontFace) probe.fontFace = $gameSystem.mainFontFace();
        const textW = info.label ? Math.ceil(probe.measureTextWidth(info.label)) + 8 : 0;
        const gap = iconSize && textW ? 2 : 0;
        const w = Math.max(1, iconSize + gap + textW), h = Math.max(iconSize, size + 10);
        const bmp = new Bitmap(w, h);
        bmp.fontSize = size;
        bmp.fontFace = probe.fontFace;
        if (iconSet) bmp.blt(iconSet, (info.icon % 16) * pw, Math.floor(info.icon / 16) * ph, pw, ph, 0, Math.round((h - iconSize) / 2), iconSize, iconSize);
        if (info.label) {
            bmp.textColor = colour;
            bmp.outlineColor = 'rgba(0, 0, 0, 0.75)';
            bmp.outlineWidth = 4;
            bmp.drawText(info.label, iconSize + gap, 0, textW, h, 'center');
        }
        if (cache.size > 64) cache.clear();
        cache.set(key, bmp);
        return bmp;
    }
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'showEventLabels', args => {
        if (typeof $gameSystem !== 'undefined' && $gameSystem) $gameSystem._docsLabelsHidden = String(args.show) === 'false' ? true : undefined;
    });
}
