//==========================================================
// SECTION 25q: CHARACTER CREATOR KITS (LPC, MEMAO)
//==========================================================
// The libraries the Character Creator window (44_workspace_lpc_creator.js) can build from. The window asks the
// open kit for its slots and index, how to draw an animation, what its stage and top bar show, its credits and
// its export, so every library gets the same window, look and controls. LPC is the default.
//
//   slots      the pickers (LpcSlots, MemaoSlots: the same functions)
//   compose    the compositor's layout facts: frame, directions, animations, frameRect
//   exporter   names, actions and labels for the export popover (LpcExport, MemaoExport)
DocsDoodads.CreatorKits = {
    lpc: {
        id: 'lpc',
        title: 'Character Creator',
        slots: DocsDoodads.LpcSlots,
        compose: DocsDoodads.LpcCompose,
        exporter: DocsDoodads.LpcExport,
        safeSwitch: true,
        addons: true,
        parts: true,
        stageScale: 4,
        narrowScale: 3,
        animations: ws => ws.creatorAnimations,
        fps: ws => ws.creatorFps,
        index: ws => ws.lpcIndex(),
        noLibrary(ws) { ws.showToast('Scan the LPC library first (More > Characters).', 'info'); ws.showLpcCard(); },
        draw: (ws, recipe, anim) => ws.composeLpc(recipe, anim),
        // Walking skips the standing frame 0.
        stageFrames(anim) {
            return anim === 'walk' ? { first: 1, count: 8 } : { first: 0, count: (DocsDoodads.LpcCompose.animations[anim] || { frames: 1 }).frames };
        },
        libraryLine(ws, index, safeOnly) {
            const s = DocsDoodads.Lpc.summary(index, safeOnly);
            return `LPC library · ${s.usable} parts${s.commit ? ' · version ' + escapeHtml(s.commit.slice(0, 7)) : ''}`;
        },
        credits(ws, state, addons) {
            const walk = ws.composeLpc(DocsDoodads.LpcSlots.toRecipe(state, { addons }), 'walk');
            return walk ? DocsDoodads.Lpc.creditsForLayers(walk.used) : [];
        },
        creditsNote: () => `These go into ${escapeHtml(DocsDoodads.Lpc.creditsText)} when the character is exported.`,
        exportNote: () => `Credits are added to ${escapeHtml(DocsDoodads.Lpc.creditsText)}. The character is saved under its name to change and export again.`,
        missingNote: 'the library changed, or they aren\'t safe to encrypt',
        exportDefaults: ws => ws.lpcExportDefaults(),
        exportFiles: (ws, name, o) => ws.lpcExportFiles(name, o),
        exportRun: (ws, state, o) => ws.exportLpcCharacter(state, o),
        tryOnPlayer: (ws, names, smooth) => ws.tryLpcOnPlayer(names, smooth)
    },

    memao: {
        id: 'memao',
        title: 'Memao Creator',
        slots: DocsDoodads.MemaoSlots,
        compose: DocsDoodads.MemaoCompose,
        exporter: DocsDoodads.MemaoExport,
        safeSwitch: false,
        addons: false,
        parts: false,
        // The figures are small (about 16 x 32 in a 48 frame): drawn 5 times, 4 in a small window.
        stageScale: 5,
        narrowScale: 4,
        // How far the feet are above the frame's bottom, for the stage's shadow.
        feetGap: 8,
        animations: () => [['walk', 'Walk'], ['idle', 'Idle'], ['run', 'Run'], ['slash', 'Slash'], ['hurt', 'Hurt'], ['downed', 'Downed'], ['death', 'Death'],
            ['pickup', 'Pick up'], ['strike', 'Strike'], ['chop', 'Chop'], ['reap', 'Reap'], ['seed', 'Seed'], ['water', 'Water'],
            ['eat', 'Eat'], ['drink', 'Drink'], ['laugh', 'Laugh'], ['wave', 'Wave'], ['think', 'Think'], ['shrug', 'Shrug'], ['sit', 'Sit'], ['read', 'Read'], ['paint', 'Paint']],
        fps: () => ({ walk: 10, run: 12, idle: 4, think: 3, sit: 3, read: 3, downed: 3, death: 4 }),
        index: ws => ws.memaoIndex(),
        noLibrary(ws) { ws.showToast('Scan the Memao asset folder first (More > Characters).', 'info'); ws.showLpcCard(); },
        draw: (ws, recipe, anim) => ws.composeMemao(recipe, anim),
        stageFrames(anim) {
            return { first: 0, count: (DocsDoodads.MemaoCompose.animations[anim] || { frames: 1 }).frames };
        },
        libraryLine(ws, index) {
            const s = DocsDoodads.Memao.summary(index);
            return `Memao assets · ${s ? s.parts : 0} parts · ${s ? s.sets.join(', ') : ''}`;
        },
        credits: () => [{ file: 'Memao', part: 'Memao Sprite Sheet Creator assets', authors: ['Sleeping Robot Games'], licences: ['the Memao Sprite Sheet Creator licence'], urls: [], safeToEncrypt: true }],
        creditsNote: () => 'Credit to "Memao" is appreciated in your game\'s credits. The licence lets the sheets you export go into your games, but not be shared on their own.',
        exportNote: () => 'Sheets made from the Memao assets may go into your games, but not be shared on their own. The character is saved under its name to change and export again.',
        missingNote: 'the asset folder changed',
        exportDefaults: ws => ws.memaoExportDefaults(),
        exportFiles: (ws, name, o) => ws.memaoExportFiles(name, o),
        exportRun: (ws, state, o) => ws.exportMemaoCharacter(state, o),
        tryOnPlayer: (ws, names, smooth) => ws.tryLpcOnPlayer(names, smooth)
    }
};
