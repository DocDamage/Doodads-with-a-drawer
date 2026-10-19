//==========================================================
// SECTION 12N: CHARACTER RECIPES (ONE CHARACTER IN A FILE OF ITS OWN)
//==========================================================
// A character from any of the creators (LPC, Memao, MZ) as one small JSON file to keep anywhere on the computer
// or give to someone else: which creator made it, its name, body type, parts and colours. Bringing it into the
// creator of another library is refused, with what to do instead. Pure: reading and writing the file is the
// window's (44_workspace_creator_history.js).
DocsDoodads.CreatorRecipe = {
    format: 'docs-doodads-character-recipe',
    version: 1,
    kitNames: { lpc: 'LPC', memao: 'Memao', mz: 'RPG Maker MZ' },

    // { format, version, kit, name, body, slots, colours? } as text.
    write(kit, name, state) {
        const recipe = { format: this.format, version: this.version, kit, name: String(name || '').trim(), body: state.body, slots: JSON.parse(JSON.stringify(state.slots || {})) };
        if (state.colours) recipe.colours = JSON.parse(JSON.stringify(state.colours));
        return JSON.stringify(recipe, null, 2);
    },

    // The text of a recipe file, for the creator of kit -> { name, state }. Throws a message a person can act on.
    read(text, kit) {
        let recipe;
        try { recipe = JSON.parse(String(text)); } catch (e) { throw new Error('This file is not a character recipe (it is not readable JSON).'); }
        if (!recipe || recipe.format !== this.format) throw new Error('This file is not a character recipe.');
        if (Number(recipe.version) > this.version) throw new Error('This recipe was made by a newer Doc\'s Doodads; update the plugin to bring it in.');
        if (recipe.kit !== kit) {
            const theirs = this.kitNames[recipe.kit] || String(recipe.kit);
            throw new Error(`This recipe is for the ${theirs} creator, not the ${this.kitNames[kit] || kit} one: switch to ${theirs} (the list beside the title) and bring it in there.`);
        }
        if (!recipe.body || !recipe.slots || typeof recipe.slots !== 'object') throw new Error('This recipe has no body or parts.');
        // In the creator's own shape (MZ's state has its colour slots before the parts).
        const slots = JSON.parse(JSON.stringify(recipe.slots));
        const state = kit === 'mz' ? { body: String(recipe.body), colours: Object.assign({}, recipe.colours), slots } : { body: String(recipe.body), slots };
        return { name: String(recipe.name || ''), state };
    },

    // A file name for the recipe: the character's name, safe on every system.
    fileName(name) {
        return (String(name || '').trim().replace(/[\\/:*?"<>|]+/g, '_') || 'Character') + '.character.json';
    }
};
