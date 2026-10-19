//==========================================================
// SECTION 12M: RPG MAKER MZ GENERATOR SLOTS (PICKERS, COLOUR SLOTS, DICE, SAVED CHARACTERS)
//==========================================================
// What the creator shows for an MZ generator character, with LpcSlots' functions (23_lpc_slots.js) so the one
// creator window serves it too. The state is { body, colours: { slot: ramp }, slots: { key: { id } } }: body is
// the base (Male, Female, Kid), and colours are the character's colour slots (skin, hair, clothing 1-4...),
// shared by every part that uses them, as in MZ's own generator. A part's colour channels are the slots it
// uses (channels, getColour, setColour); '' leaves a slot as drawn. Pure.
DocsDoodads.MzGenSlots = {
    bodies: [['Male', 'Male'], ['Female', 'Female'], ['Kid', 'Kid']],

    cards: [
        { key: 'body', label: 'Body', tabs: [
            { key: 'body', label: 'Body', slots: [
                { key: 'body', label: 'Skin', family: 'Body', required: true },
                { key: 'face', label: 'Face', family: 'Face', required: true },
                { key: 'ears', label: 'Ears', family: 'Ears' },
                { key: 'beastears', label: 'Beast ears', family: 'BeastEars' }
            ] },
            { key: 'face', label: 'Face', slots: [
                { key: 'eyes', label: 'Eyes', family: 'Eyes', required: true },
                { key: 'eyebrows', label: 'Eyebrows', family: 'Eyebrows' },
                { key: 'nose', label: 'Nose', family: 'Nose' },
                { key: 'mouth', label: 'Mouth', family: 'Mouth' },
                { key: 'mark', label: 'Facial mark', family: 'FacialMark' }
            ] },
            { key: 'hair', label: 'Hair', slots: [
                { key: 'fronthair', label: 'Front hair', family: 'FrontHair' },
                { key: 'rearhair', label: 'Rear hair', family: 'RearHair' },
                { key: 'beard', label: 'Beard', family: 'Beard' }
            ] }
        ] },
        { key: 'outfit', label: 'Outfit', tabs: [
            { key: 'clothes', label: 'Clothes', slots: [
                { key: 'clothing', label: 'Clothing', family: 'Clothing' },
                { key: 'cloak', label: 'Cloak', family: 'Cloak' }
            ] },
            { key: 'head', label: 'Head', slots: [
                { key: 'acca', label: 'Accessory A', family: 'AccA' },
                { key: 'accb', label: 'Accessory B', family: 'AccB' },
                { key: 'glasses', label: 'Glasses', family: 'Glasses' }
            ] },
            { key: 'extras', label: 'Extras', slots: [
                { key: 'wing', label: 'Wing', family: 'Wing' },
                { key: 'tail', label: 'Tail', family: 'Tail' }
            ] }
        ] }
    ],

    allSlots() {
        return this.cards.flatMap(c => c.tabs.flatMap(t => t.slots.map(s => Object.assign({ card: c.key, tab: t.key }, s))));
    },

    slot(key) {
        return this.allSlots().find(s => s.key === key) || null;
    },

    options(index, slot, body) {
        if (!index || !slot) return [];
        return index.parts.filter(p => p.base === body && p.family === slot.family).sort((a, b) => a.num - b.num);
    },

    hiddenBySafeOnly() {
        return 0;
    },

    partOf(state, index, key) {
        const pick = state && state.slots[key];
        return pick && index ? index.parts.find(p => p.id === pick.id) || null : null;
    },

    // ---- Colour slots ----

    // A part's colour channels: [{ slot, label }] for the slots it uses.
    channels(index, part) {
        return (part && part.slots || []).filter(s => DocsDoodads.MzGen.slots[s]).map(s => ({ slot: s, label: DocsDoodads.MzGen.slots[s][0] }));
    },

    colours(index, part, channel = 0) {
        const ch = this.channels(index, part)[channel];
        return ch ? DocsDoodads.MzGen.colourNames(index, ch.slot) : [];
    },

    // A ramp's swatch; '' (as drawn) shows a split swatch.
    swatch(index, part, name) {
        return name ? DocsDoodads.MzGen.swatch(index, name) : 'linear-gradient(135deg, #fffaf0 0 45%, #b9a98c 55% 100%)';
    },

    getColour(state, index, key, channel = 0) {
        const ch = this.channels(index, this.partOf(state, index, key))[channel];
        return ch ? (state.colours && state.colours[ch.slot]) || '' : '';
    },

    setColour(state, index, key, channel, name) {
        const ch = this.channels(index, this.partOf(state, index, key))[channel];
        if (!ch) return state;
        state.colours = state.colours || {};
        if (name) state.colours[ch.slot] = name; else delete state.colours[ch.slot];
        return state;
    },

    stepColour(state, index, key, dir, channel = 0) {
        const part = this.partOf(state, index, key);
        const list = this.colours(index, part, channel);
        if (!list.length) return state;
        const at = Math.max(0, list.indexOf(this.getColour(state, index, key, channel)));
        return this.setColour(state, index, key, channel, list[(at + dir + list.length * 4) % list.length]);
    },

    // ---- Parts ----

    setPart(state, index, key, part) {
        if (!part) delete state.slots[key];
        else state.slots[key] = { id: part.id };
        return state;
    },

    // A first character: the base's first body, face, eyes, nose, mouth, brows, hair and clothing.
    newState(index, body = 'Male') {
        const state = { body, colours: {}, slots: {} };
        for (const key of ['body', 'face', 'ears', 'eyes', 'eyebrows', 'nose', 'mouth', 'fronthair', 'rearhair', 'clothing']) {
            const part = this.options(index, this.slot(key), body)[0];
            if (part) this.setPart(state, index, key, part);
        }
        return state;
    },

    step(state, index, key, dir) {
        const slot = this.slot(key);
        const list = this.options(index, slot, state.body);
        const choices = slot.required ? list : [null].concat(list);
        if (!choices.length) return state;
        const current = state.slots[key] ? state.slots[key].id : null;
        let at = choices.findIndex(p => (p ? p.id : null) === current);
        if (at < 0) at = 0;
        return this.setPart(state, index, key, choices[(at + dir + choices.length * 4) % choices.length]);
    },

    // Another base: each part by the same number when it has one, the first otherwise (for the required).
    setBody(state, index, body) {
        const next = { body, colours: Object.assign({}, state.colours), slots: {} };
        for (const slot of this.allSlots()) {
            const old = this.partOf(state, index, slot.key);
            const list = this.options(index, slot, body);
            const same = old && list.find(p => p.num === old.num);
            const part = same || (slot.required || old ? list[0] : null);
            if (part && (old || slot.required)) this.setPart(next, index, slot.key, part);
        }
        return next;
    },

    toRecipe(state, options = {}) {
        const picks = [];
        for (const slot of this.allSlots()) {
            const pick = state.slots[slot.key];
            if (!pick) continue;
            if (options.showBody === false && slot.card === 'body') continue;
            picks.push({ id: pick.id });
        }
        return { body: state.body, picks, colours: Object.assign({}, state.colours) };
    },

    // The dice: a new body and face (with skin, eye and hair colours), or a new outfit (with its colours).
    shuffle(state, index, card, rand = Math.random) {
        const next = { body: state.body, colours: Object.assign({}, state.colours), slots: Object.assign({}, state.slots) };
        if (card === 'body') {
            const bodies = (index.bases || this.bodies.map(b => b[0]));
            next.body = bodies[Math.floor(rand() * bodies.length)];
            for (const key of Object.keys(next.slots)) if (this.slot(key) && this.slot(key).card === 'body') delete next.slots[key];
            for (const key of Object.keys(next.slots)) {
                const old = index.parts.find(p => p.id === next.slots[key].id);
                const list = this.options(index, this.slot(key), next.body);
                const same = old && list.find(p => p.num === old.num);
                if (same) next.slots[key] = { id: same.id }; else delete next.slots[key];
            }
        }
        const chance = { ears: 0.9, beastears: 0.05, eyebrows: 1, nose: 1, mouth: 1, mark: 0.08, fronthair: 0.97, rearhair: 0.9, beard: 0.15, clothing: 1, cloak: 0.25, acca: 0.2, accb: 0.25, glasses: 0.1, wing: 0.04, tail: 0.04 };
        const slotsUsed = new Set();
        for (const slot of this.allSlots().filter(s => s.card === card)) {
            const list = this.options(index, slot, next.body);
            delete next.slots[slot.key];
            if (list.length && (slot.required || rand() < (chance[slot.key] || 0))) this.setPart(next, index, slot.key, list[Math.floor(rand() * list.length)]);
            const part = this.partOf(next, index, slot.key);
            for (const ch of this.channels(index, part)) slotsUsed.add(ch.slot);
        }
        for (const s of slotsUsed) {
            const names = DocsDoodads.MzGen.colourNames(index, s);
            // Mostly as drawn: the parts' own colours are well matched.
            if (rand() < 0.5) delete next.colours[s];
            else next.colours[s] = names[1 + Math.floor(rand() * (names.length - 1))] || '';
        }
        return next;
    },

    // For a part that is gone: the slot's part with the same number on this base, else the nearest number.
    nearestPart(index, slot, body, oldId) {
        const list = this.options(index, slot, body);
        const m = /\/(\d+)$/.exec(String(oldId || ''));
        if (!list.length) return null;
        if (!m) return list[0];
        const num = Number(m[1]);
        return list.slice().sort((a, b) => Math.abs(a.num - num) - Math.abs(b.num - num) || a.num - b.num)[0];
    },

    missing(state, index) {
        const out = [];
        for (const [key, pick] of Object.entries(state.slots)) {
            const slot = this.slot(key);
            if (!slot || !this.options(index, slot, state.body).some(p => p.id === pick.id)) out.push(key);
        }
        return out;
    },

    // ---- Saved characters (data/DocsDoodadsMzCharacters.json) ----
    charactersFile: 'data/DocsDoodadsMzCharacters.json',
    format: 'docs-doodads-mz-characters',

    validSaved(data) {
        return DocsDoodads.LpcSlots.validSaved.call(this, data);
    },

    save(data, name, state, now) {
        const saved = DocsDoodads.LpcSlots.save.call(this, data, name, state, now);
        const entry = saved.characters.find(c => c.name.toLowerCase() === (String(name || '').trim() || 'Character').toLowerCase());
        if (entry) entry.colours = Object.assign({}, state.colours);
        return saved;
    },

    load(data, name) {
        const c = this.validSaved(data).characters.find(x => x.name.toLowerCase() === String(name).toLowerCase());
        return c ? { body: c.body, colours: Object.assign({}, c.colours), slots: JSON.parse(JSON.stringify(c.slots || {})) } : null;
    },

    remove(data, name) {
        return DocsDoodads.LpcSlots.remove.call(this, data, name);
    }
};
