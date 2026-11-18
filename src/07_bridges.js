//==========================================================
// SECTION 5B: BRIDGES YOU WALK OVER AND UNDER (9.2.3)
//==========================================================
// One map's setting `bridges: { deck, ends }`: two lists of regions. A character has a level (0 below, 1 on the
// deck) kept on it as `_docsLevel`, so MZ saves the player's. Stepping onto an end goes up; stepping from an end
// onto plain ground comes down; stepping from the ground straight onto a deck tile stays below. On the deck you
// cannot step off its side; below it, the deck tile's own blocked sides do not count (only the layers under it,
// A1 to A4, decide). Characters on different levels do not bump into or start each other. Flat maps first.
DocsDoodads.Bridges = {
    _cache: null,

    normalize(s) {
        if (!s || typeof s !== 'object') return null;
        const list = text => Array.from(new Set(String(text === undefined || text === null ? '' : text).split(/[\s,;]+/)
            .map(n => parseInt(n, 10)).filter(n => n > 0 && n < 256)));
        const deck = list(s.deck), ends = list(s.ends).filter(n => !deck.includes(n));
        return deck.length ? { deck: deck.join(', '), ends: ends.join(', ') } : null;
    },

    // 'deck', 'end' or null for a region, by the map's settings.
    kind(settings, regionId) {
        const s = this.normalize(settings);
        if (!s) return null;
        const id = Number(regionId) || 0;
        if (!id) return null;
        if (s.deck.split(', ').map(Number).includes(id)) return 'deck';
        if (s.ends && s.ends.split(', ').map(Number).includes(id)) return 'end';
        return null;
    },

    // The level after a step from a tile of kind `from` onto one of kind `to`.
    levelAfter(level, from, to) {
        if (to === 'end') return 1;
        if (!to) return 0;
        return level ? 1 : 0;
    },

    // 'pass', 'block', 'under' (only the layers under the deck decide) or 'normal' (MZ's own check). On top, the
    // deck's regions are the walkway whatever its tiles say (a deck drawn over characters is a ☆ tile, which
    // MZ's own check sees through to the water or road below).
    canPass(level, from, to) {
        if (level) {
            if (from && to) return 'pass';
            if (from === 'deck' && !to) return 'block';
            return 'normal';
        }
        if (from === 'deck' || to === 'deck') return 'under';
        return 'normal';
    },

    // Two characters meet only on the same level (or when the map has no bridges).
    apart(a, b) {
        if (!a || !b || !this.active()) return false;
        return (Number(a._docsLevel) || 0) !== (Number(b._docsLevel) || 0);
    },

    // The current map's settings, or null: every hook takes the old path then.
    active() {
        if (typeof $gameMap === 'undefined' || !$gameMap || !$gameMap.mapId) return null;
        const mapId = $gameMap.mapId();
        const raw = DocsDoodads.Lighting.mapSettings(mapId);
        const c = this._cache;
        if (c && c.mapId === mapId && c.raw === (raw && raw.bridges)) return c.settings;
        const settings = this.normalize(raw && raw.bridges);
        this._cache = { mapId, raw: raw && raw.bridges, settings };
        return settings;
    },

    kindAt(x, y) {
        const s = this.active();
        if (!s) return null;
        return this.kind(s, $gameMap.regionId($gameMap.roundX(x), $gameMap.roundY(y)));
    },

    // MZ's passage check over the layers under a deck (A1 to A4: layeredTiles' last two).
    lowerPassable(x, y, d) {
        const bit = (1 << (d / 2 - 1)) & 0x0f;
        const tileset = $gameMap.tileset ? $gameMap.tileset() : null;
        const flags = (tileset && tileset.flags) || [];
        const tiles = $gameMap.layeredTiles(x, y).slice(2);
        for (const id of tiles) {
            if (!id) continue;
            const flag = flags[id] || 0;
            if ((flag & 0x10) !== 0) continue;
            if ((flag & bit) === 0) return true;
            if ((flag & bit) === bit) return false;
        }
        return false;
    },

    // A character's level for where it stands now (a transfer or a placed event): an end is up; a deck tile
    // keeps the level it had (an event's note <docs bridge: over> starts it on top); plain ground is down.
    levelFor(character) {
        const k = this.kindAt(character._x, character._y);
        if (k === 'end') return 1;
        if (!k) return 0;
        if (character._docsLevel !== undefined) return Number(character._docsLevel) || 0;
        const text = character.event && DocsDoodads.VisualEquip && DocsDoodads.VisualEquip.eventText ? DocsDoodads.VisualEquip.eventText(character) : '';
        return /<\s*docs\s+bridge\s*:\s*over\s*>/i.test(String(text || '')) ? 1 : 0;
    }
};
