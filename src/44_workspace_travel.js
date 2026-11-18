// @editor-only
//==========================================================
// SECTION 25T: RIDE AND TRAVEL IN DETAILS (9.2.5)
//==========================================================
// Details → Ride and Travel: ride on the player or an event, or travel along points. "Draw Its Path" starts the
// Travel tool: each click adds a point (Shift snaps to tile middles) and a right-click ends it; the whole path is
// one Undo step. The selected traveller's path is drawn over the map whatever the tool.
(function() {
    const D = DocsDoodads, W = D.Workspace, T = D.Travel;
    const blankTravel = { points: [], speed: 48, mode: 'loop', ease: 'linear', wait: 0, switchId: 0, carries: false };

    const sections = W.effectSections;
    W.effectSections = function() {
        const all = sections.call(this), items = this.selectionItems ? this.selectionItems() : [];
        if (!items.length || items.some(d => !d || d.line)) return all;
        const events = ((typeof $dataMap !== 'undefined' && $dataMap && $dataMap.events) || []).filter(Boolean)
            .map(e => ({ value: String(e.id), label: `Event ${e.id}${e.name ? ': ' + e.name : ''}` }));
        return all.concat([{ title: 'Ride and Travel', fields: [
            { key: 'ride.on', label: 'Rides on', type: 'select', options: [{ value: '', label: 'Nothing' }, { value: 'player', label: 'The player' }].concat(events) },
            { key: 'ride.dx', label: 'Ride offset across (pixels)', type: 'number' },
            { key: 'ride.dy', label: 'Ride offset down (pixels)', type: 'number' },
            { key: 'travel.points', label: 'Travels through (x,y pixels from here; x,y; ...)', type: 'text' },
            { key: 'travel.speed', label: 'Speed (pixels a second)', type: 'range', min: 4, max: 480, step: 4 },
            { key: 'travel.mode', label: 'At the end', type: 'select', options: [{ value: 'loop', label: 'Back to the start, again' }, { value: 'backAndForth', label: 'Turn round' }, { value: 'once', label: 'Stop (kept in the save)' }] },
            { key: 'travel.ease', label: 'Each leg', type: 'select', options: [{ value: 'linear', label: 'Steady' }, { value: 'smooth', label: 'Slows at each stop' }] },
            { key: 'travel.wait', label: 'Wait at each stop (frames)', type: 'number' },
            { key: 'travel.switchId', label: 'Only while switch is on (0: always)', type: 'number' },
            { key: 'travel.carries', label: 'Carries whoever stands on it (a raft, a platform)', type: 'checkbox' }
        ] }]);
    };

    const get = W.getDoodadProperty;
    W.getDoodadProperty = function(d, key) {
        if (String(key).indexOf('ride.') === 0) {
            const r = T.normalizeRide(d && d.ride), k = key.slice(5);
            if (k === 'on') return r ? String(r.on) : '';
            return r ? r[k] : 0;
        }
        if (String(key).indexOf('travel.') === 0) {
            const t = T.normalizeTravel(d && d.travel), k = key.slice(7);
            if (k === 'points') return t ? t.points.map(p => p.x + ',' + p.y).join('; ') : '';
            return (t || blankTravel)[k];
        }
        return get.call(this, d, key);
    };

    const apply = W.applyDoodadProperty;
    W.applyDoodadProperty = function(d, key, value) {
        if (d && String(key).indexOf('ride.') === 0) {
            const r = Object.assign({ on: 0, dx: 0, dy: 0 }, T.normalizeRide(d.ride) || {});
            r[key.slice(5)] = key === 'ride.on' ? (value === 'player' ? 'player' : Number(value) || 0) : Number(value) || 0;
            const next = T.normalizeRide(r);
            if (next) { d.ride = next; delete d.travel; } else delete d.ride;
            T._version++;
            return;
        }
        if (d && String(key).indexOf('travel.') === 0) {
            const t = Object.assign({}, blankTravel, T.normalizeTravel(d.travel) || {}), k = key.slice(7);
            t[k] = k === 'points' ? D.Camera2D.parsePoints(value) : value;
            const next = T.normalizeTravel(t);
            if (next) { d.travel = next; delete d.ride; } else delete d.travel;
            T._version++;
            return;
        }
        return apply.call(this, d, key, value);
    };

    Object.assign(W, {
        travelTarget() {
            const items = this.selectionItems ? this.selectionItems() : [];
            return items.length === 1 && items[0] && !items[0].locked ? items[0] : null;
        },

        startTravelTool() {
            const d = this.travelTarget();
            if (!d) { this.showToast('Select one doodad first.'); return false; }
            this._travelDraft = { d, before: this.snapshotDoodads([d]), points: [] };
            this.setPlacementTool('travel');
            this.showToast('Click each point it travels through; right-click to finish.');
            return true;
        },

        addTravelPoint(at) {
            const draft = this._travelDraft;
            if (!draft) return false;
            draft.points.push({ x: Math.round(at.x - draft.d.x), y: Math.round(at.y - draft.d.y) });
            return true;
        },

        finishTravelTool() {
            const draft = this._travelDraft;
            this._travelDraft = null;
            if (draft && draft.points.length) {
                draft.d.travel = T.normalizeTravel(Object.assign({}, blankTravel, T.normalizeTravel(draft.d.travel) || {}, { points: draft.points }));
                delete draft.d.ride;
                T._version++;
                this.recordDoodadEdit([draft.d], draft.before, 'edit_travel');
                if (this.refreshInspector) this.refreshInspector();
            }
            if (this.placementTool === 'travel' && this.setPlacementTool) this.setPlacementTool('select');
            return draft ? draft.points.length : 0;
        },

        drawTravelOverlay(g) {
            const draft = this._travelDraft, d = draft ? draft.d : this.travelTarget();
            if (!d || (D.Perspective.liveCamera && D.Perspective.liveCamera())) return;
            const t = draft ? { points: draft.points, mode: 'once' } : T.normalizeTravel(d.travel);
            if (!t || !t.points.length) return;
            const colour = D.Ui.mapColor('selection');
            const stops = T.stops({ points: t.points, mode: t.mode === 'loop' ? 'loop' : 'once' });
            g.lineStyle(2, colour, 0.85);
            stops.forEach((p, i) => {
                const s = D.mapToScreen(d.x + p.x, d.y + p.y);
                if (i === 0) g.moveTo(s.x, s.y); else g.lineTo(s.x, s.y);
            });
            g.lineStyle(0);
            for (const p of stops) {
                const s = D.mapToScreen(d.x + p.x, d.y + p.y);
                g.beginFill(colour, 0.95); g.drawCircle(s.x, s.y, 4); g.endFill();
            }
        }
    });

    W.toolHooks.travel = {
        buttons: [0, 2],
        down(e) {
            if (e.button === 2) { this.finishTravelTool(); return false; }
            let at = this.clientToMapCoords(e.clientX, e.clientY);
            if (e.shiftKey) { const s = this.snapToTile(at), th = $gameMap.tileHeight(); at = { x: s.x, y: s.y - th / 2 }; }
            this.addTravelPoint(at);
            return false;
        },
        overlay(g) { this.drawTravelOverlay(g); }
    };

    // A button under Details' Ride and Travel fields starts the path tool.
    // Details wires its number boxes once drawn; the path button goes in then.
    const scrub = W.attachNumberScrubbing;
    if (typeof scrub === 'function') {
        W.attachNumberScrubbing = function() {
            const result = scrub.apply(this, arguments);
            this.addTravelButton();
            return result;
        };
    }
    W.addTravelButton = function() {
        if (typeof document === 'undefined' || !document.getElementById || typeof document.createElement !== 'function') return null;
        const labels = document.querySelectorAll ? Array.from(document.querySelectorAll('label')) : [];
        const label = labels.find(l => /^Travels through/.test(String(l.textContent || '')));
        const holder = label && label.parentNode;
        if (!holder || document.getElementById('dd-travel-path-btn')) return null;
        const button = document.createElement('button');
        button.className = 'dd-btn'; button.id = 'dd-travel-path-btn'; button.type = 'button';
        button.textContent = 'Draw Its Path';
        button.title = 'Click each point on the map; right-click to finish';
        button.onclick = () => this.startTravelTool();
        holder.appendChild(button);
        return button;
    };
})();
