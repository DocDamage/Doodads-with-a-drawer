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

    // The free tile (inside the map, no event on it) nearest to x, y (moved inside the map first): x, y
    // itself, else the closest in the rings around it. Null when every tile has an event. A size that
    // isn't known doesn't limit it.
    nearestFreeTile(mapData, x, y, width, height) {
        const size = v => (Number(v) > 0 ? Number(v) : Infinity);
        const w = size(width), h = size(height);
        const taken = new Set(((mapData && mapData.events) || []).filter(Boolean).map(ev => ev.x + ',' + ev.y));
        const cx = Math.max(0, Math.min(w - 1, Math.round(Number(x) || 0)));
        const cy = Math.max(0, Math.min(h - 1, Math.round(Number(y) || 0)));
        // Each ring holds at least one tile of the map, so a free one is no further out than the events.
        const last = Math.min(Math.max(w, h) - 1, taken.size);
        for (let r = 0; r <= last; r++) {
            const ring = [];
            for (let dy = -r; dy <= r; dy++) {
                for (let dx = -r; dx <= r; dx++) {
                    const tx = cx + dx, ty = cy + dy;
                    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || tx < 0 || ty < 0 || tx >= w || ty >= h || taken.has(tx + ',' + ty)) continue;
                    ring.push({ x: tx, y: ty, d: dx * dx + dy * dy });
                }
            }
            if (ring.length) {
                ring.sort((a, b) => a.d - b.d);
                return { x: ring[0].x, y: ring[0].y };
            }
        }
        return null;
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
        // pages: every page of a saved template; the first shows the placed picture, the rest keep theirs.
        if (Array.isArray(options.pages) && options.pages.length > 0) {
            const pages = JSON.parse(JSON.stringify(options.pages));
            pages[0].image = ev.pages[0].image;
            ev.pages = pages.map(page => Object.assign({}, page, { list: this.withRouteDisplayLines(page.list || [{ code: 0, indent: 0, parameters: [] }]) }));
            return ev;
        }
        // after: a second page for once the event has been used (its self switch is on), e.g. an open
        // chest or a picked herb. { selfSwitch, image: 'none' or { direction, pattern }, list }.
        const after = options.after;
        if (after) {
            const page = JSON.parse(JSON.stringify(ev.pages[0]));
            page.conditions.selfSwitchCh = after.selfSwitch || 'A';
            page.conditions.selfSwitchValid = true;
            if (after.image === 'none') Object.assign(page.image, { characterName: '', characterIndex: 0 });
            else if (after.image) Object.assign(page.image, after.image);
            page.list = this.withRouteDisplayLines(after.list || [{ code: 0, indent: 0, parameters: [] }]);
            page.trigger = 0;
            ev.pages.push(page);
        }
        return ev;
    }
};

