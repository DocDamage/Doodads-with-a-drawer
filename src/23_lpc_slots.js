//==========================================================
// SECTION 12E: LPC CREATOR SLOTS (PICKERS, COLOURS, DICE, SAVED CHARACTERS)
//==========================================================
// What the Character Creator (44_workspace_lpc_creator.js) shows: two cards of tabs, each tab a list of
// slots, each slot one kind of part (a hat, a shirt...) with ◀ ▶ through the parts that fit the body, and
// a colour swatch. The creator's state is { body, slots: { key: { id, colour, colour2 } } }: colour is a
// palette name for parts that are recoloured, or a variant name for parts sold in fixed colours. Pure.
DocsDoodads.LpcSlots = {
    bodies: [['male', 'Male'], ['female', 'Female'], ['muscular', 'Muscular'], ['teen', 'Teen'], ['child', 'Child'], ['pregnant', 'Pregnant']],

    // card -> tabs -> slots. types: the parts' type_name; required: no "None"; addon: hidden by "Body add-ons".
    cards: [
        { key: 'body', label: 'Body', tabs: [
            { key: 'body', label: 'Body', slots: [
                { key: 'body', label: 'Skin', types: ['body'], required: true },
                { key: 'head', label: 'Head', types: ['head'], required: true, colour2: 'Eyes' },
                { key: 'ears', label: 'Ears', types: ['ears'] },
                { key: 'nose', label: 'Nose', types: ['nose'] }
            ] },
            { key: 'face', label: 'Face', slots: [
                { key: 'eyes', label: 'Eyes', types: ['eyes'] },
                { key: 'eyebrows', label: 'Eyebrows', types: ['eyebrows'] },
                { key: 'expression', label: 'Expression', types: ['expression'] },
                { key: 'beard', label: 'Beard', types: ['beard'] },
                { key: 'mustache', label: 'Mustache', types: ['mustache'] }
            ] },
            { key: 'hair', label: 'Hair', slots: [
                { key: 'hair', label: 'Hair', types: ['hair'] },
                { key: 'hairextra', label: 'Hair add-on', types: ['ponytail', 'hairextl', 'hairextr', 'updo'] },
                { key: 'hairtie', label: 'Hair tie', types: ['hairtie'] }
            ] },
            { key: 'extras', label: 'Extras', slots: [
                { key: 'wings', label: 'Wings', types: ['wings'], addon: true },
                { key: 'tail', label: 'Tail', types: ['tail'], addon: true },
                { key: 'horns', label: 'Horns', types: ['horns'], addon: true },
                { key: 'fins', label: 'Fins', types: ['fins'], addon: true }
            ] }
        ] },
        { key: 'outfit', label: 'Outfit', tabs: [
            { key: 'head', label: 'Head', slots: [
                { key: 'hat', label: 'Hat', types: ['hat'] },
                { key: 'mask', label: 'Mask', types: ['facial_mask', 'bandana'] },
                { key: 'glasses', label: 'Glasses', types: ['facial_eyes'] },
                { key: 'earrings', label: 'Earrings', types: ['earrings'] },
                { key: 'neck', label: 'Neck', types: ['neck', 'necklace'] }
            ] },
            { key: 'top', label: 'Body', slots: [
                { key: 'shirt', label: 'Shirt', types: ['clothes'] },
                { key: 'jacket', label: 'Jacket', types: ['jacket', 'vest'] },
                { key: 'armour', label: 'Armour', types: ['armour', 'chainmail'] },
                { key: 'dress', label: 'Dress', types: ['dress'] },
                { key: 'cape', label: 'Cape', types: ['cape'] },
                { key: 'belt', label: 'Belt', types: ['belt', 'sash'] },
                { key: 'gloves', label: 'Gloves', types: ['gloves'] },
                { key: 'shoulders', label: 'Shoulders', types: ['shoulders'] }
            ] },
            { key: 'legs', label: 'Legs', slots: [
                { key: 'legs', label: 'Pants', types: ['legs'] },
                { key: 'apron', label: 'Apron', types: ['apron', 'overalls'] },
                { key: 'socks', label: 'Socks', types: ['socks'] },
                { key: 'shoes', label: 'Shoes', types: ['shoes'] }
            ] },
            { key: 'gear', label: 'Gear', slots: [
                { key: 'weapon', label: 'Main hand', types: ['weapon'] },
                { key: 'shield', label: 'Off hand', types: ['shield'] },
                { key: 'back', label: 'Back', types: ['backpack', 'quiver'] },
                { key: 'ammo', label: 'Ammo', types: ['ammo'] }
            ] }
        ] }
    ],

    allSlots() {
        return this.cards.flatMap(c => c.tabs.flatMap(t => t.slots.map(s => Object.assign({ card: c.key, tab: t.key }, s))));
    },

    slot(key) {
        return this.allSlots().find(s => s.key === key) || null;
    },

    // Parts that fit: the slot's kinds, a picture for this body that walks (or the big weapon art that stands
    // in for the usual animations: a long spear walks on walk_128, a club only swings), safe ones when asked.
    // By name.
    options(index, slot, body, safeOnly) {
        if (!index || !slot) return [];
        const big = DocsDoodads.LpcCompose.oversize;
        return index.parts.filter(p => slot.types.includes(p.type) && p.layers.some(l => l.paths[body] && (!l.custom || big[l.custom])) &&
            (!p.animations.length || p.animations.includes('walk') || p.animations.some(a => big[a])) && (!safeOnly || p.safeFor[body]))
            .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    },

    // How many parts the safe-to-encrypt switch hides from some slots, for this body.
    hiddenBySafeOnly(index, slots, body) {
        return (slots || []).reduce((n, slot) => n + this.options(index, slot, body, false).length - this.options(index, slot, body, true).length, 0);
    },

    // Whether the creator offers a channel: a part that matches the body takes its first colour from the skin.
    followsSkin(part, channel) {
        return channel === 0 && Boolean(part) && part.matchBodyColor && part.type !== 'body';
    },

    // A part's colour choices for one channel: the material's ramps, or (fixed colours) its variants.
    colours(index, part, channel = 0) {
        if (!part || this.followsSkin(part, channel)) return [];
        const ch = DocsDoodads.LpcCompose.channels(part)[channel];
        if (ch) {
            const m = index.palettes && index.palettes[ch.material];
            return m ? Object.keys(m.versions[m.version] || {}) : [];
        }
        return channel === 0 ? part.variants.slice() : [];
    },

    // The hex colour a swatch shows: the middle of the ramp, or a guess from the variant's name.
    swatch(index, part, name, channel = 0) {
        if (!part || !name) return '';
        const ch = DocsDoodads.LpcCompose.channels(part)[channel];
        if (ch) {
            const m = index.palettes && index.palettes[ch.material];
            const ramp = m && (m.versions[m.version] || {})[name];
            return ramp ? ramp[Math.min(ramp.length - 1, Math.floor(ramp.length * 0.6))] : '';
        }
        const named = { black: '#2b2b33', white: '#f2f2f2', gray: '#8a8a96', grey: '#8a8a96', red: '#c0392b', blue: '#3c6fd1', green: '#2e8b57', brown: '#7b4a2a',
            tan: '#c9a26b', pink: '#e88aa8', purple: '#8e5ac8', yellow: '#e0c22b', orange: '#e07b2b', navy: '#24356b', teal: '#1f8f86', maroon: '#7a1f2b',
            gold: '#d4a017', silver: '#b8bcc8', bronze: '#a8692b', iron: '#6b6f78', steel: '#9aa3ad', copper: '#b8653a', leather: '#8a5a2b', walnut: '#5e3b22',
            forest: '#2f5d34', lavender: '#b9a2e0', rose: '#d65c7a', sky: '#7fb8e6', slate: '#5b6778', charcoal: '#3a3a40', bluegray: '#6b7f99' };
        const key = String(name).toLowerCase().split(/[_\s-]/).find(w => named[w]);
        return key ? named[key] : '#c8c0d8';
    },

    // The colour a part starts in: the one it had, if it still exists, else a pleasant default.
    defaultColour(index, part, channel, keep) {
        const list = this.colours(index, part, channel);
        if (!list.length) return '';
        if (keep && list.includes(keep)) return keep;
        for (const prefer of ['light', 'brown', 'dark_brown', 'blue', 'white']) if (list.includes(prefer)) return prefer;
        return list[0];
    },

    newState(index, body = 'male', safeOnly = true) {
        const state = { body, slots: {} };
        for (const key of ['body', 'head']) {
            const slot = this.slot(key);
            const list = this.options(index, slot, body, safeOnly);
            const pick = key === 'body' ? list.find(p => p.id === 'body/body') || list[0]
                : list.find(p => /^Human (Male|Female)$/.test(p.name) && p.name.toLowerCase().endsWith(body === 'female' ? 'female' : ' male')) || list[0];
            if (pick) this.setPart(state, index, key, pick);
        }
        return state;
    },

    setPart(state, index, key, part) {
        if (!part) { delete state.slots[key]; return state; }
        const was = state.slots[key] || {};
        state.slots[key] = { id: part.id, colour: this.defaultColour(index, part, 0, was.colour) };
        const two = this.colours(index, part, 1);
        if (two.length) state.slots[key].colour2 = this.defaultColour(index, part, 1, was.colour2);
        return state;
    },

    // ◀ ▶: the previous or next part ("None" sits before the first, unless the slot is required).
    step(state, index, key, dir, safeOnly) {
        const slot = this.slot(key);
        const list = this.options(index, slot, state.body, safeOnly);
        const choices = slot.required ? list : [null].concat(list);
        if (!choices.length) return state;
        const current = state.slots[key] ? state.slots[key].id : null;
        let at = choices.findIndex(p => (p ? p.id : null) === current);
        if (at < 0) at = 0;
        const next = choices[(at + dir + choices.length * 4) % choices.length];
        return this.setPart(state, index, key, next);
    },

    stepColour(state, index, key, dir, channel = 0, safeOnly) {
        const pick = state.slots[key];
        const part = pick && index.parts.find(p => p.id === pick.id);
        const list = this.colours(index, part, channel);
        if (!list.length) return state;
        const field = channel === 1 ? 'colour2' : 'colour';
        const at = Math.max(0, list.indexOf(pick[field]));
        pick[field] = list[(at + dir + list.length * 4) % list.length];
        return state;
    },

    // Changing the body keeps each part that still fits, and finds the nearest for the required slots.
    setBody(state, index, body, safeOnly) {
        const old = state;
        const next = { body, slots: {} };
        for (const [key, pick] of Object.entries(old.slots)) {
            const slot = this.slot(key);
            const list = this.options(index, slot, body, safeOnly);
            const part = list.find(p => p.id === pick.id);
            if (part) { next.slots[key] = Object.assign({}, pick); continue; }
            if (slot && slot.required) {
                const fresh = this.newState(index, body, safeOnly).slots[key];
                if (fresh) next.slots[key] = Object.assign(fresh, { colour: pick.colour && this.colours(index, list.find(p => p.id === fresh.id), 0).includes(pick.colour) ? pick.colour : fresh.colour });
            }
        }
        return next;
    },

    // The recipe for the compositor. showBody false: only the outfit card; addons false: no wings, tails...
    toRecipe(state, options = {}) {
        const picks = [];
        for (const slot of this.allSlots()) {
            const pick = state.slots[slot.key];
            if (!pick) continue;
            if (options.showBody === false && slot.card === 'body' && slot.key !== 'body') continue;
            if (options.addons === false && slot.addon) continue;
            const colours = [pick.colour || ''];
            if (pick.colour2) colours.push(pick.colour2);
            picks.push({ id: pick.id, colours, variant: pick.colour || undefined });
        }
        // Show body off still needs the body's folder for parts that follow it, but nothing drawn of it.
        return { body: state.body, picks: options.showBody === false ? picks.filter(p => !state.slots.body || p.id !== state.slots.body.id) : picks };
    },


    // The body type the dice give: the same one, unless opts.newType asks for another of opts.types (the types
    // the library offers, from the creator).
    diceBody(state, rand, opts = {}) {
        if (!opts.newType) return state.body;
        const types = (opts.types && opts.types.length ? opts.types : this.bodies.map(b => b[0]));
        return types[Math.floor(rand() * types.length)];
    },

    // The dice: a new face, skin and hair on the same body type (card 'body'; opts.newType for a new type too),
    // or a new outfit (card 'outfit'). chance: how often an optional slot gets something.
    shuffle(state, index, card, rand = Math.random, safeOnly = true, opts = {}) {
        const next = { body: state.body, slots: Object.assign({}, state.slots) };
        if (card === 'body') {
            next.body = this.diceBody(state, rand, opts);
            for (const key of Object.keys(next.slots)) if (this.slot(key) && this.slot(key).card === 'body') delete next.slots[key];
        }
        const chance = { hair: 0.9, shirt: 0.95, legs: 0.95, shoes: 0.85, eyebrows: 0.5, beard: next.body === 'female' ? 0 : 0.25, hat: 0.3,
            jacket: 0.2, belt: 0.3, cape: 0.1, weapon: 0.25, ears: 0, nose: 0, eyes: 0, expression: 0 };
        for (const slot of this.allSlots().filter(s => s.card === card)) {
            const list = this.options(index, slot, next.body, safeOnly).filter(p => !(p.requiredTags || []).length && !/\$\{/.test(JSON.stringify(p.layers)));
            if (slot.required) {
                const pick = slot.key === 'head' ? this.newState(index, next.body, safeOnly).slots.head : null;
                const part = pick ? list.find(p => p.id === pick.id) : list.find(p => p.id === 'body/body') || list[0];
                if (part) this.setPart(next, index, slot.key, part);
            } else {
                delete next.slots[slot.key];
                if (list.length && rand() < (chance[slot.key] !== undefined ? chance[slot.key] : 0.05)) this.setPart(next, index, slot.key, list[Math.floor(rand() * list.length)]);
            }
            const pick = next.slots[slot.key];
            if (pick) {
                const part = index.parts.find(p => p.id === pick.id);
                const colours = this.colours(index, part, 0);
                if (colours.length) pick.colour = colours[Math.floor(rand() * colours.length)];
                const two = this.colours(index, part, 1);
                if (two.length) pick.colour2 = two[Math.floor(rand() * two.length)];
            }
        }
        if (card === 'body' && next.slots.body) {
            const skins = ['light', 'amber', 'olive', 'taupe', 'bronze', 'brown', 'black'].filter(s => this.colours(index, index.parts.find(p => p.id === next.slots.body.id), 0).includes(s));
            if (skins.length) next.slots.body.colour = skins[Math.floor(rand() * skins.length)];
        }
        return next;
    },

    // Parts in the state that are gone from the library or no longer fit (after a rescan or a setting).
    missing(state, index, safeOnly) {
        const out = [];
        for (const [key, pick] of Object.entries(state.slots)) {
            const slot = this.slot(key);
            if (!slot || !this.options(index, slot, state.body, safeOnly).some(p => p.id === pick.id)) out.push(key);
        }
        return out;
    },

    // ---- Saved characters (data/DocsDoodadsCharacters.json) ----
    charactersFile: 'data/DocsDoodadsCharacters.json',
    format: 'docs-doodads-characters',

    validSaved(data) {
        return data && data.format === this.format && Array.isArray(data.characters) ? data : { format: this.format, version: 1, characters: [] };
    },

    // Adds or replaces (by name) a character; returns the data.
    save(data, name, state, now) {
        const saved = this.validSaved(data);
        const clean = String(name || '').trim() || 'Character';
        const entry = { name: clean, body: state.body, slots: JSON.parse(JSON.stringify(state.slots)), saved: now || new Date().toISOString() };
        const at = saved.characters.findIndex(c => c.name.toLowerCase() === clean.toLowerCase());
        if (at >= 0) saved.characters[at] = entry; else saved.characters.push(entry);
        saved.characters.sort((a, b) => a.name.localeCompare(b.name));
        return saved;
    },

    load(data, name) {
        const c = this.validSaved(data).characters.find(x => x.name.toLowerCase() === String(name).toLowerCase());
        return c ? { body: c.body, slots: JSON.parse(JSON.stringify(c.slots || {})) } : null;
    },

    remove(data, name) {
        const saved = this.validSaved(data);
        saved.characters = saved.characters.filter(c => c.name.toLowerCase() !== String(name).toLowerCase());
        return saved;
    }
};
