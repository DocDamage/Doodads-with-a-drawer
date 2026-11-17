// @editor-only
//==========================================================
// SECTION 25B: EVENT SIGHT DETAILS AND CONE OVERLAY
//==========================================================
(function() {
    const W = DocsDoodads.Workspace, S = DocsDoodads.Sight, renderInspector = W.renderInspector;

    Object.assign(W, {
        selectedSightData() {
            const selected = this.selectedEvent, gameEvent = selected && selected.gameEvent;
            const event = this.selectedStagedEvent ? this.selectedStagedEvent() : selected && selected.stagedEvent;
            const pageIndex = gameEvent ? gameEvent._pageIndex : 0;
            return event ? { event, gameEvent, pageIndex, scope: S.scope(event, pageIndex) } : null;
        },

        eventSightInfo() {
            const picked = this.selectedSightData();
            return picked ? S.parse(picked.scope.text) : null;
        },

        editEventSight(info) {
            const picked = this.selectedSightData();
            if (!picked) return false;
            const event = picked.event, gameEvent = picked.gameEvent;
            const before = JSON.parse(JSON.stringify(event)), after = JSON.parse(JSON.stringify(event));
            if (picked.scope.kind === 'page') S.writePage(after, picked.pageIndex, info);
            else after.note = S.write(after.note, info);
            if (JSON.stringify(before) === JSON.stringify(after)) return false;
            const set = snapshot => {
                for (const key of Object.keys(event)) delete event[key];
                Object.assign(event, JSON.parse(JSON.stringify(snapshot)));
                const live = gameEvent && gameEvent.event ? gameEvent.event() : null;
                if (live && live !== event) { live.note = event.note; live.pages = JSON.parse(JSON.stringify(event.pages || [])); }
                if (gameEvent && DocsDoodads.VisualEquip && DocsDoodads.VisualEquip._eventText) DocsDoodads.VisualEquip._eventText.delete(gameEvent);
                if (DocsDoodads.SightRuntime) DocsDoodads.SightRuntime.reset();
                if (gameEvent && gameEvent.refresh) gameEvent.refresh();
                DocsDoodads.Persistence.dirtyMap = true;
            };
            DocsDoodads.Undo.execute({ type: 'event_sight', apply: () => set(after), revert: () => set(before) });
            return true;
        },

        renderSightDetails() {
            if (typeof document === 'undefined' || !this.selectedEvent) return null;
            const content = document.getElementById('dd-inspector-content');
            if (!content) return null;
            const previous = document.getElementById('dd-event-sight');
            if (previous && previous.remove) previous.remove();
            const current = this.eventSightInfo() || Object.assign({}, S.defaults);
            const section = document.createElement('div');
            section.id = 'dd-event-sight'; section.style.cssText = 'margin-top:10px;border-top:1px solid var(--dd-line-soft);padding-top:8px;';
            section.innerHTML = `
                <div class="dd-panel-head" style="font-weight:900;margin-bottom:4px;">Sight</div>
                <label class="dd-field"><span>Range (tiles)</span><input id="dd-sight-range" type="number" min="0.25" max="100" step="0.25" value="${current.range}"></label>
                <label class="dd-field"><span>Cone width (degrees)</span><input id="dd-sight-spread" type="number" min="1" max="360" step="1" value="${current.spread}"></label>
                <label class="dd-field"><span>Full range from light level</span><input id="dd-sight-level" type="number" min="0" max="1" step="0.05" value="${current.minLevel}"></label>
                <label class="dd-field"><span>On seeing player</span><select id="dd-sight-action"><option value="self" ${current.commonEvent ? '' : 'selected'}>Turn on self switch</option><option value="common" ${current.commonEvent ? 'selected' : ''}>Run common event</option></select></label>
                <label class="dd-field"><span>Self switch</span><select id="dd-sight-self">${['A','B','C','D'].map(letter => `<option ${current.selfSwitch === letter ? 'selected' : ''}>${letter}</option>`).join('')}</select></label>
                <label class="dd-field"><span>Common event #</span><input id="dd-sight-common" type="number" min="1" step="1" value="${current.commonEvent || 1}"></label>
                <button class="dd-btn" id="dd-sight-remove" type="button">Remove Sight</button>`;
            content.appendChild(section);
            const value = id => document.getElementById(id);
            const save = () => {
                const common = value('dd-sight-action').value === 'common';
                const info = { range: Number(value('dd-sight-range').value), spread: Number(value('dd-sight-spread').value),
                    minLevel: Number(value('dd-sight-level').value), selfSwitch: common ? '' : value('dd-sight-self').value,
                    commonEvent: common ? Number(value('dd-sight-common').value) : 0 };
                if (this.editEventSight(info)) this.refreshInspector();
            };
            for (const id of ['dd-sight-range', 'dd-sight-spread', 'dd-sight-level', 'dd-sight-action', 'dd-sight-self', 'dd-sight-common']) {
                const field = value(id); if (field) field.onchange = save;
            }
            const remove = value('dd-sight-remove');
            if (remove) remove.onclick = () => { if (this.editEventSight(null)) this.refreshInspector(); };
            return section;
        },

        sightOverlayPoints() {
            const selected = this.selectedEvent, event = selected && selected.gameEvent, info = this.eventSightInfo();
            if (!event || !info || typeof $gameMap === 'undefined' || !$gameMap) return [];
            return DocsDoodads.Occlusion.visibility(event.x, event.y, info.range, (x, y) => DocsDoodads.SightRuntime.wallAt(x, y), 1, 1,
                { rays: 64, angle: S.facing(event.direction()), spread: info.spread });
        },

        drawSightOverlay(graphics) {
            const points = this.sightOverlayPoints();
            if (!graphics || points.length < 8 || (DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera())) return;
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), originX = points[0], originY = points[1];
            const sx = $gameMap.adjustX(originX) * tw, sy = $gameMap.adjustY(originY) * th;
            const polygon = [sx, sy];
            for (let i = 2; i < points.length; i += 2) polygon.push(sx + (points[i] - originX) * tw, sy + (points[i + 1] - originY) * th);
            const color = DocsDoodads.Ui.mapColor('selection');
            graphics.lineStyle(2, color, 0.9); graphics.beginFill(color, 0.12); graphics.drawPolygon(polygon); graphics.endFill(); graphics.lineStyle(0);
        }
    });

    W.renderInspector = function() { renderInspector.call(this); if (this.selectedEvent) this.renderSightDetails(); };
    W.toolHooks.sight = { overlay(graphics) { this.drawSightOverlay(graphics); } };
})();
