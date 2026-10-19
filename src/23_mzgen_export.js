//==========================================================
// SECTION 12N: RPG MAKER MZ GENERATOR EXPORTS
//==========================================================
// The generator's views are MZ's own layouts, so an export writes them as composed:
//
//   walker   $Name.png                      144 x 192, MZ's 3-frame walk in four directions
//   damaged  $Name_damage[f3][d1].png       the TVD row (3 frames), for Play Character Action or an event
//   battler  img/sv_actors/Name.png         576 x 384, MZ's 18 motions
//   face     img/faces/Name.png             144 x 144, in one of the sheet's 8 slots
//
// Pure: images are { width, height, data } (RGBA). Writing them is the workspace's (44_workspace_mzgen.js).
DocsDoodads.MzGenExport = {
    cleanName(name) {
        return DocsDoodads.LpcExport.cleanName(name);
    },

    names(name) {
        const n = this.cleanName(name) || 'Character';
        return { classic: '$' + n, damage: '$' + n + '_damage[f3][d1]', face: n, smooth: '$' + n };
    },

    // No extra action sheets: the battler holds the motions and the damaged row is its own sheet.
    actions: [],

    actionLabel(anim) {
        return String(anim);
    },

    actionName(name, anim) {
        return '$' + (this.cleanName(name) || 'Character') + '_' + anim;
    },

    faceSheet(existing, face, slot = 0) {
        return DocsDoodads.LpcExport.faceSheet(existing, face, slot);
    }
};
