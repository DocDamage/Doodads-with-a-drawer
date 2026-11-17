// Near and far use separate enter/leave distances so an edge does not flap.
DocsDoodads.Near = {
    defaults: { range: 0, enter: '', leave: '', commonEventId: 0, once: false },
    inside(d, x, y, tw, th, loop, wasInside) {
        if (!d || !d.near || !(Number(d.near.range) > 0)) return false;
        const shortest = (delta, size) => size > 0 ? ((delta % size) + size * 1.5) % size - size / 2 : delta;
        const dx = shortest(Number(d.x) / tw - 0.5 - x, loop && loop.w);
        const dy = shortest(Number(d.y) / th - 1 - y, loop && loop.h);
        const range = Math.min(100, Number(d.near.range)) + (wasInside ? 0.5 : 0);
        return dx * dx + dy * dy <= range * range;
    },
    step(wasInside, isInside) {
        return wasInside === isInside ? null : isInside ? 'enter' : 'leave';
    },
    run(d, transition, mapId) {
        const n = d.near, state = transition === 'enter' ? n.enter : n.leave;
        if (state) DocsDoodads.WorldState.setState(d, state, mapId);
        const id = Math.max(0, Math.floor(Number(n.commonEventId) || 0));
        const temp = typeof $gameTemp !== 'undefined' ? $gameTemp : null;
        const busy = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.isEventRunning && $gameMap.isEventRunning();
        if (id > 0 && temp && temp.reserveCommonEvent && !busy && !(temp.isCommonEventReserved && temp.isCommonEventReserved())) {
            temp._docsTouched = { mapId, name: String(d.name || ''), uid: d.uid || '', state: DocsDoodads.States.name(d, mapId),
                x: Math.floor(d.x / $gameMap.tileWidth()), y: Math.floor((d.y - 1) / $gameMap.tileHeight()) };
            temp.reserveCommonEvent(id);
        }
        DocsDoodads.api.emit(transition === 'enter' ? 'near' : 'far', { doodad: d, name: String(d.name || ''), mapId });
    }
};
