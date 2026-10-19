//==========================================================
// SECTION 25q: CHARACTER CREATOR KITS (LPC, MEMAO, MZ)
//==========================================================
// The libraries the Character Creator window (44_workspace_lpc_creator.js) can build from: the LPC library, the
// Memao assets and RPG Maker MZ's own generator parts. The window asks the open kit for its slots and index, how
// to draw an animation, what its stage and top bar show, its credits and its export, so every library gets the
// same window, look and controls. LPC is the default.
//
//   slots      the pickers (LpcSlots, MemaoSlots, MzGenSlots: the same functions; MZ's also have colour
//              channels: channels, getColour, setColour)
//   compose    the compositor's layout facts: frame, directions, animations, frameRect
//   exporter   names, actions and labels for the export popover (LpcExport, MemaoExport, MzGenExport)
//   cacheMB    memory for the kit's images: half for the decoded files, half for the recoloured layers
//   switchLabel  its name in the window's library switcher
DocsDoodads.CreatorKits = {
    lpc: {
        id: 'lpc',
        title: 'Character Creator',
        switchLabel: 'LPC',
        slots: DocsDoodads.LpcSlots,
        compose: DocsDoodads.LpcCompose,
        exporter: DocsDoodads.LpcExport,
        cacheMB: 96,
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
        // A picker tile: the part alone, standing (walk frame 0, facing down), in its first colours.
        thumbnail(ws, part, body) {
            const S = DocsDoodads.LpcSlots, C = DocsDoodads.LpcCompose, index = ws.lpcIndex();
            const colours = [S.defaultColour(index, part, 0)].concat(S.colours(index, part, 1).length ? [S.defaultColour(index, part, 1)] : []);
            const out = ws.composeLpc({ body, picks: [{ id: part.id, colours, variant: colours[0] || undefined }] }, 'walk', null, { oversize: false });
            return out && out.sheet ? ws.creatorFrame(out.sheet, C.frameRect('walk', 'down', 0, out.sheet.frame || C.frame)) : null;
        },
        // Walking skips the standing frame 0.
        stageFrames(anim) {
            return anim === 'walk' ? { first: 1, count: 8 } : { first: 0, count: (DocsDoodads.LpcCompose.animations[anim] || { frames: 1 }).frames };
        },
        libraryLine(ws, index, safeOnly) {
            const s = DocsDoodads.Lpc.summary(index, safeOnly);
            return `LPC library · ${s.usable} parts${s.commit ? ' · version ' + escapeHtml(s.commit.slice(0, 7)) : ''}`;
        },
        // From the stage's walk when it shows the whole character walking (walk: { used }); else the walk is drawn.
        credits(ws, state, addons, walk) {
            if (!walk) walk = ws.composeLpc(DocsDoodads.LpcSlots.toRecipe(state, { addons }), 'walk');
            return walk ? DocsDoodads.Lpc.creditsForLayers(walk.used) : [];
        },
        creditsNote: () => `These go into ${escapeHtml(DocsDoodads.Lpc.creditsText)} when the character is exported.`,
        exportNote: () => `Credits are added to ${escapeHtml(DocsDoodads.Lpc.creditsText)}. The character is saved under its name to change and export again.`,
        missingNote: 'the library changed, or they aren\'t safe to encrypt',
        exportDefaults: ws => ws.lpcExportDefaults(),
        // { file, note, faceSlot } (44_workspace_lpc_creator.js creatorFileEntries), with the outfit's part sheets.
        exportFiles: (ws, name, o, state) => ws.creatorFileEntries(ws.lpcExportFiles(name, o), name, o, DocsDoodads.LpcExport)
            .concat(o.parts ? ws.exportLpcParts(state, o, null, null, { dryRun: true }) : []),
        exportRun: (ws, state, o) => ws.exportLpcCharacter(state, o),
        tryOnPlayer: (ws, names, smooth) => ws.tryLpcOnPlayer(names, smooth)
    },

    memao: {
        id: 'memao',
        title: 'Memao Creator',
        switchLabel: 'Memao',
        slots: DocsDoodads.MemaoSlots,
        compose: DocsDoodads.MemaoCompose,
        exporter: DocsDoodads.MemaoExport,
        cacheMB: 160,
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
        // A picker tile: the part alone, standing (idle frame 0, facing down), in its first colour.
        thumbnail(ws, part, body) {
            const S = DocsDoodads.MemaoSlots, C = DocsDoodads.MemaoCompose;
            const out = ws.composeMemao({ body, picks: [{ id: part.id, colour: S.defaultColour(ws.memaoIndex(), part, 0) }] }, 'idle');
            return out && out.sheet ? ws.creatorFrame(out.sheet, C.frameRect('idle', 'down', 0)) : null;
        },
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
        exportExtraTicks: () => [['stand', "Stand on the tile's bottom", "Every frame 6 pixels lower, so the feet are where MZ's own characters stand. A sheet whose frames reach their bottom is left as it was (the export says which)."]],
        exportFiles: (ws, name, o) => ws.creatorFileEntries(ws.memaoExportFiles(name, o), name, o, DocsDoodads.MemaoExport),
        exportRun: (ws, state, o) => ws.exportMemaoCharacter(state, o),
        tryOnPlayer: (ws, names, smooth) => ws.tryLpcOnPlayer(names, smooth)
    },

    mz: {
        id: 'mz',
        title: 'MZ Character Creator',
        switchLabel: 'RPG Maker MZ',
        slots: DocsDoodads.MzGenSlots,
        compose: DocsDoodads.MzGenCompose,
        exporter: DocsDoodads.MzGenExport,
        cacheMB: 96,
        safeSwitch: false,
        addons: false,
        parts: false,
        // Walking frames (48) 5 times, battler cells (64) 4 times, the face (144) twice; less in a small window
        // (MZ's figures fill their frame, so they need the room under the name).
        stageScaleFor(F, narrow) {
            if (F >= 144) return narrow ? 1 : 2;
            if (F >= 64) return narrow ? 2 : 4;
            return narrow ? 3 : 5;
        },
        stageScale: 5,
        narrowScale: 3,
        feetGap: 0,
        animations: () => [['walk', 'Walk'], ['damage', 'Damaged'], ['face', 'Face']].concat(DocsDoodads.MzGenCompose.svMotions.map(m => ['sv_' + m, { walk: 'Battle walk', damage: 'Hurt' }[m] || m.charAt(0).toUpperCase() + m.slice(1)])),
        fps: () => ({ walk: 6, damage: 4, face: 1 }),
        index: ws => ws.mzgenIndex(),
        noLibrary(ws) { ws.showToast("Scan RPG Maker MZ's generator folder first (More > Characters).", 'info'); ws.showLpcCard(); },
        draw: (ws, recipe, anim) => ws.composeMzGen(recipe, anim),
        // A picker tile: the generator's own icon (Variation), else the part alone: standing on the walking
        // sheet, or its face layers for the parts only faces have (eyes, mouth...).
        thumbnail(ws, part, body) {
            if (part.icon) { const icon = ws.mzgenLoadImage(part.icon); if (icon) return icon; }
            const C = DocsDoodads.MzGenCompose, anim = (part.files.TV || []).length ? 'walk' : 'face';
            const out = ws.composeMzGen({ body, picks: [{ id: part.id }], colours: {} }, anim);
            return out && out.sheet ? ws.creatorFrame(out.sheet, C.frameRect(anim, 'down', anim === 'walk' ? 1 : 0, out.sheet.frame)) : null;
        },
        // MZ's walk and battler motions go 0, 1, 2, 1.
        stageFrames(anim) {
            if (anim === 'face') return { first: 0, count: 1 };
            if (anim === 'damage') return { first: 0, count: 3 };
            return { first: 0, count: 3, sequence: [0, 1, 2, 1] };
        },
        libraryLine(ws, index) {
            const s = DocsDoodads.MzGen.summary(index);
            return `MZ generator · ${s ? s.parts : 0} parts · ${s ? s.bases.join(', ') : ''}`;
        },
        credits: () => [{ file: 'RPG Maker MZ', part: "RPG Maker MZ's Character Generator parts", authors: ['Gotcha Gotcha Games / KADOKAWA'], licences: ['the RPG Maker MZ licence'], urls: [], safeToEncrypt: true }],
        creditsNote: () => 'Made from the parts that come with RPG Maker MZ: they may be used in games made with RPG Maker MZ.',
        exportNote: () => 'Made from the parts that come with RPG Maker MZ, for games made with it. The character is saved under its name to change and export again.',
        missingNote: 'the generator folder changed',
        exportTicks: N => [
            ['classic', 'Walking character', `${escapeHtml(N.classic)}.png: MZ's 3-frame walk. Works with or without this plugin.`],
            ['damage', 'Damaged character', `${escapeHtml(N.damage)}.png: the three damaged frames, for Play Character Action or an event.`],
            ['battler', 'Side-view battler', `img/sv_actors/${escapeHtml(N.face)}.png: MZ's 18 battle motions.`]
        ],
        exportDefaults: ws => ws.mzgenExportDefaults(),
        exportFiles: (ws, name, o) => ws.creatorFileEntries(ws.mzgenExportFiles(name, o), name, o, DocsDoodads.MzGenExport),
        exportRun: (ws, state, o) => ws.exportMzGenCharacter(state, o),
        tryOnPlayer: (ws, names) => ws.tryLpcOnPlayer(names, false)
    }
};
