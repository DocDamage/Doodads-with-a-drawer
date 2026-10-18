//==========================================================
// SECTION 17: DocsDoodads.EVENTS (REAL MZ EVENT CREATOR)
//==========================================================
DocsDoodads.Events = {
    allocateSafeId(mapData) {
        if (!mapData || !mapData.events) return 1;
        const events = mapData.events;
        for (let i = 1; i < events.length; i++) {
            if (!events[i]) return i;
        }
        return events.length > 0 ? events.length : 1;
    },

    // The MZ editor lists each Set Movement Route step as a 505 line after the 205 command and
    // stores route steps with indent: null. The game ignores 505s, but the editor needs them.
    withRouteDisplayLines(list) {
        const out = [];
        const source = JSON.parse(JSON.stringify(list));
        for (let i = 0; i < source.length; i++) {
            const command = source[i];
            out.push(command);
            if (command.code !== 205 || !command.parameters || !command.parameters[1] || !Array.isArray(command.parameters[1].list)) continue;
            const route = command.parameters[1].list;
            route.forEach(step => { if (step.code !== 0 && !('indent' in step)) step.indent = null; });
            if (source[i + 1] && source[i + 1].code === 505) continue; // already in editor form
            for (const step of route) {
                if (step.code === 0) continue;
                out.push({ code: 505, indent: command.indent || 0, parameters: [JSON.parse(JSON.stringify(step))] });
            }
        }
        return out;
    },

    createEventObject(id, x, y, options = {}) {
        const ev = {
            id: id,
            name: options.name || `EV${String(id).padStart(3, '0')}`,
            note: options.note || "",
            x: x,
            y: y,
            pages: [
                {
                    conditions: {
                        actorId: 1, actorValid: false,
                        itemId: 1, itemValid: false,
                        selfSwitchCh: "A", selfSwitchValid: false,
                        switch1Id: 1, switch1Valid: false,
                        switch2Id: 1, switch2Valid: false,
                        variableId: 1, variableValid: false, variableValue: 0
                    },
                    directionFix: options.directionFix !== undefined ? options.directionFix : false,
                    image: {
                        characterIndex: options.characterIndex !== undefined ? options.characterIndex : 0,
                        // MZ ImageManager appends ".png" itself.
                        characterName: String(options.characterName || "").replace(/\.png$/i, ""),
                        direction: options.direction || 2,
                        pattern: options.pattern || 1,
                        tileId: 0
                    },
                    list: this.withRouteDisplayLines(options.list || [{ code: 0, indent: 0, parameters: [] }]),
                    moveFrequency: 3,
                    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                    moveSpeed: 3,
                    moveType: 0,
                    priorityType: options.priorityType !== undefined ? options.priorityType : 1,
                    stepAnime: options.stepAnime !== undefined ? options.stepAnime : false,
                    through: options.through !== undefined ? options.through : false,
                    trigger: options.trigger !== undefined ? options.trigger : 0,
                    walkAnime: options.walkAnime !== undefined ? options.walkAnime : true
                }
            ]
        };
        return ev;
    }
};

