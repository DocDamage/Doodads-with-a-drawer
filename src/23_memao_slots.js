//==========================================================
// SECTION 12I: MEMAO CREATOR SLOTS (PICKERS, COLOURS, DICE, SAVED CHARACTERS)
//==========================================================
// What the creator shows for a Memao character, with the same functions as LpcSlots (23_lpc_slots.js) so the
// one creator window serves both. The state is { body, slots: { key: { id, colour } } }: body is the arms
// (average, dainty or broad), id a part of the index ('HairA/007', or 'TopB/Straps' for a sleeve style),
// colour a ramp name of the part's channel. Head, Arms and Ears take the skin; sleeves take their garment's
// colour. Pure.
DocsDoodads.MemaoSlots = {
    bodies: [['average', 'Average'], ['dainty', 'Dainty'], ['broad', 'Broad']],

    // card -> tabs -> slots. folder: the pack's folder; required: no "None"; follows: the slot whose colour it
    // takes ('body' for the skin).
    cards: [
        { key: 'body', label: 'Body', tabs: [
            { key: 'body', label: 'Body', slots: [
                { key: 'body', label: 'Skin', folder: 'Body', required: true },
                { key: 'head', label: 'Head', folder: 'Head', required: true, follows: 'body' },
                { key: 'ears', label: 'Ears', folder: 'Ears', follows: 'body' },
                { key: 'horns', label: 'Horns', folder: 'Horns' }
            ] },
            { key: 'face', label: 'Face', slots: [
                { key: 'eyes', label: 'Eyes', folder: 'Eyes', required: true },
                { key: 'eyebrows', label: 'Eyebrows', folder: 'Eyebrows' },
                { key: 'face', label: 'Face', folder: 'Face' }
            ] },
            { key: 'hair', label: 'Hair', slots: [
                { key: 'hair', label: 'Hair', folder: 'HairA' },
                { key: 'hairlong', label: 'Long hair', folder: 'HairB' },
                { key: 'hairside', label: 'Side hair', folder: 'HairC' }
            ] },
            { key: 'extras', label: 'Extras', slots: [
                { key: 'glasses', label: 'Glasses', folder: 'AccessoryA' },
                { key: 'headwear', label: 'Headwear', folder: 'AccessoryB' },
                { key: 'headwear2', label: 'Headwear 2', folder: 'AccessoryD' },
                { key: 'back', label: 'Back', folder: 'BackA' }
            ] }
        ] },
        { key: 'outfit', label: 'Outfit', tabs: [
            { key: 'top', label: 'Top', slots: [
                { key: 'shirt', label: 'Shirt', folder: 'TopA' },
                { key: 'sleeves', label: 'Sleeves', folder: 'TopB', follows: 'shirt' },
                { key: 'jacket', label: 'Jacket', folder: 'JacketA' },
                { key: 'jacketsleeves', label: 'Jacket sleeves', folder: 'JacketB', follows: 'jacket' }
            ] },
            { key: 'legs', label: 'Legs', slots: [
                { key: 'bottom', label: 'Bottom', folder: 'BottomA', required: true },
                { key: 'waist', label: 'Waist', folder: 'BottomB' },
                { key: 'socks', label: 'Socks', folder: 'Socks' },
                { key: 'shoes', label: 'Shoes', folder: 'Shoes' }
            ] },
            { key: 'gear', label: 'Gear', slots: [
                { key: 'neck', label: 'Neck', folder: 'AccessoryC' },
                { key: 'shoulders', label: 'Shoulders', folder: 'ShoulderA' },
                { key: 'middle', label: 'Middle', folder: 'Mid' },
                { key: 'gloves', label: 'Gloves', folder: 'Gloves' }
            ] },
            { key: 'tools', label: 'Tools', slots: [
                { key: 'sword', label: 'Sword', folder: 'Sword' },
                { key: 'axe', label: 'Axe', folder: 'ChopA' },
                { key: 'fieldtool', label: 'Field tool', folder: 'StrikeA' },
                { key: 'scythe', label: 'Scythe', folder: 'Reap' },
                { key: 'seedbag', label: 'Seed bag', folder: 'Seed' },
                { key: 'can', label: 'Watering can', folder: 'Water' }
            ] }
        ] }
    ],

    allSlots() {
        return this.cards.flatMap(c => c.tabs.flatMap(t => t.slots.map(s => Object.assign({ card: c.key, tab: t.key }, s))));
    },

    slot(key) {
        return this.allSlots().find(s => s.key === key) || null;
    },

    // Parts that fit: the slot's folder, with a file for these arms. By the tool's own order.
    options(index, slot, body) {
        if (!index || !slot) return [];
        const M = DocsDoodads.Memao;
        return index.parts.filter(p => p.folder === slot.folder && M.fileFor(p, body) !== null)
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    },

    // Every part is under one licence: nothing is hidden by the LPC's safe-to-encrypt switch.
    hiddenBySafeOnly() {
        return 0;
    },

    slotOfPart(part) {
        return part ? this.allSlots().find(s => s.folder === part.folder) || null : null;
    },

    // A part's colour choices (none when it takes another slot's colour, or isn't recoloured).
    colours(index, part, channel = 0) {
        if (!part || channel !== 0) return [];
        const slot = this.slotOfPart(part);
        if (slot && slot.follows) return [];
        const info = index && index.folders && index.folders[part.folder];
        return DocsDoodads.MemaoCompose.colourNames(info ? info.channel : '');
    },

    swatch(index, part, name) {
        const info = part && index && index.folders && index.folders[part.folder];
        return info ? DocsDoodads.MemaoCompose.swatch(info.channel, name) : '';
    },

    defaultColour(index, part, channel, keep) {
        const list = this.colours(index, part, channel);
        if (!list.length) return '';
        if (keep && list.includes(keep)) return keep;
        const info = index.folders[part.folder];
        const prefer = DocsDoodads.MemaoCompose.defaults[info.channel];
        return list.includes(prefer) ? prefer : list[0];
    },

    setPart(state, index, key, part) {
        if (!part) { delete state.slots[key]; return state; }
        const was = state.slots[key] || {};
        state.slots[key] = { id: part.id, colour: this.defaultColour(index, part, 0, was.colour) };
        return state;
    },

    // A first character: skin, head, eyes, hair and brows, a shirt with sleeves, a bottom and shoes.
    newState(index, body = 'average') {
        const state = { body, slots: {} };
        const first = (key, name) => {
            const list = this.options(index, this.slot(key), body);
            return (name && list.find(p => p.name.toLowerCase() === name)) || list[0];
        };
        const set = (key, name, colour) => {
            const part = first(key, name);
            if (!part) return;
            this.setPart(state, index, key, part);
            if (colour && this.colours(index, part, 0).includes(colour)) state.slots[key].colour = colour;
        };
        set('body', null, 'light');
        set('head');
        set('eyes', null, 'brown');
        set('hair', 'right part', 'brown');
        set('eyebrows', 'straight mid', 'brown');
        set('shirt', 'crew', 'white');
        set('sleeves', 'short');
        set('bottom', 'pants', 'denim');
        set('shoes', 'closed', 'brown');
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

    stepColour(state, index, key, dir, channel = 0) {
        const pick = state.slots[key];
        const part = pick && index.parts.find(p => p.id === pick.id);
        const list = this.colours(index, part, channel);
        if (!list.length) return state;
        const at = Math.max(0, list.indexOf(pick.colour));
        pick.colour = list[(at + dir + list.length * 4) % list.length];
        return state;
    },

    // Changing the arms keeps every part (a sleeve style picks its file for the new arms when it has one).
    setBody(state, index, body) {
        const next = { body, slots: {} };
        for (const [key, pick] of Object.entries(state.slots)) {
            const part = index.parts.find(p => p.id === pick.id);
            if (part && DocsDoodads.Memao.fileFor(part, body) !== null) next.slots[key] = Object.assign({}, pick);
        }
        return next;
    },

    // The colour a slot draws in: its own, the skin, or its garment's.
    drawColour(state, slot, pick) {
        if (slot.follows) {
            const lead = state.slots[slot.follows];
            if (lead && lead.colour) return lead.colour;
        }
        return pick.colour || '';
    },

    // The recipe for the compositor: the body's arms first, then each pick with the colour it draws in.
    toRecipe(state, options = {}) {
        const picks = [];
        const arms = this.armsPart(state);
        if (arms && options.showBody !== false) picks.push({ id: arms, colour: state.slots.body ? state.slots.body.colour : '' });
        for (const slot of this.allSlots()) {
            const pick = state.slots[slot.key];
            if (!pick) continue;
            if (options.showBody === false && slot.card === 'body') continue;
            picks.push({ id: pick.id, colour: this.drawColour(state, slot, pick) });
        }
        return { body: state.body, picks };
    },

    // The Arms part for the body type: the pack names them Dainty, Average and Broad.
    armsPart(state, index) {
        const order = DocsDoodads.Memao.arms;
        const at = Math.max(0, order.indexOf(state.body));
        const list = index ? index.parts.filter(p => p.folder === 'Arms') : null;
        const named = list && list.find(p => p.name.toLowerCase() === state.body);
        if (named) return named.id;
        return 'Arms/' + DocsDoodads.Memao.pad(at + 1);
    },

    // The dice: a new body and face, or a new outfit.
    shuffle(state, index, card, rand = Math.random) {
        const next = { body: state.body, slots: Object.assign({}, state.slots) };
        if (card === 'body') {
            next.body = this.bodies[Math.floor(rand() * this.bodies.length)][0];
            for (const key of Object.keys(next.slots)) if (this.slot(key) && this.slot(key).card === 'body') delete next.slots[key];
        }
        const chance = { hair: 0.95, hairlong: 0.45, hairside: 0.3, eyebrows: 0.8, face: 0.15, ears: 0.15, horns: 0.05, glasses: 0.12, headwear: 0.2, headwear2: 0,
            back: 0.04, shirt: 0.95, jacket: 0.2, waist: 0.3, socks: 0.3, shoes: 0.9, neck: 0.2, shoulders: 0.06, middle: 0.1, gloves: 0.05 };
        const hair = this.colours(index, index.parts.find(p => p.folder === 'HairA'), 0);
        const hairColour = hair.length ? hair[Math.floor(rand() * hair.length)] : '';
        for (const slot of this.allSlots().filter(s => s.card === card)) {
            const list = this.options(index, slot, next.body);
            // Sleeves only with their garment (and then most of the time).
            if (slot.follows && slot.follows !== 'body') {
                delete next.slots[slot.key];
                if (next.slots[slot.follows] && list.length && rand() < 0.85) this.setPart(next, index, slot.key, list[Math.floor(rand() * list.length)]);
                continue;
            }
            if (slot.required) {
                const keep = next.slots[slot.key] && list.find(p => p.id === next.slots[slot.key].id);
                const part = slot.key === 'body' || slot.key === 'head' ? keep || list[0] : list[Math.floor(rand() * list.length)];
                if (part) this.setPart(next, index, slot.key, part);
            } else {
                delete next.slots[slot.key];
                if (list.length && rand() < (chance[slot.key] || 0)) this.setPart(next, index, slot.key, list[Math.floor(rand() * list.length)]);
            }
            const pick = next.slots[slot.key];
            if (pick) {
                const part = index.parts.find(p => p.id === pick.id);
                const colours = this.colours(index, part, 0);
                const channel = part && index.folders[part.folder] ? index.folders[part.folder].channel : '';
                if (channel === 'hair' && hairColour && colours.includes(hairColour)) pick.colour = hairColour;
                else if (colours.length) pick.colour = colours[Math.floor(rand() * colours.length)];
            }
        }
        if (card === 'body' && next.slots.body) {
            const skins = ['porcelain', 'light', 'peach', 'tan', 'olive', 'bronze', 'brown', 'deep'];
            next.slots.body.colour = skins[Math.floor(rand() * skins.length)];
        }
        return next;
    },

    missing(state, index) {
        const out = [];
        for (const [key, pick] of Object.entries(state.slots)) {
            const slot = this.slot(key);
            if (!slot || !this.options(index, slot, state.body).some(p => p.id === pick.id)) out.push(key);
        }
        return out;
    },

    // ---- Saved characters (data/DocsDoodadsMemaoCharacters.json) ----
    charactersFile: 'data/DocsDoodadsMemaoCharacters.json',
    format: 'docs-doodads-memao-characters',

    validSaved(data) {
        return DocsDoodads.LpcSlots.validSaved.call(this, data);
    },

    save(data, name, state, now) {
        return DocsDoodads.LpcSlots.save.call(this, data, name, state, now);
    },

    load(data, name) {
        return DocsDoodads.LpcSlots.load.call(this, data, name);
    },

    remove(data, name) {
        return DocsDoodads.LpcSlots.remove.call(this, data, name);
    }
};
