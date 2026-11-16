// @editor-only
//==========================================================
// SECTION 25: EVENT SCHEDULE DETAILS AND MAP OVERLAY
//==========================================================
(function() {
    const W = DocsDoodads.Workspace, S = DocsDoodads.Schedules;
    const renderInspector = W.renderInspector;

    Object.assign(W, {
        selectedScheduleData() {
            const info = this.selectedEvent, ge = info && info.gameEvent;
            const event = this.selectedStagedEvent ? this.selectedStagedEvent() : (info && info.stagedEvent);
            return event ? { event, ge, pageIndex: ge ? ge._pageIndex : 0 } : null;
        },

        eventScheduleEntries() {
            const picked = this.selectedScheduleData();
            if (!picked) { const empty = []; empty.errors = []; return empty; }
            return S.parse(S.eventDataText(picked.event, picked.pageIndex), DocsDoodads.Calendar.weekdayNames());
        },

        editEventSchedule(entries) {
            const picked = this.selectedScheduleData();
            if (!picked || (entries && entries.errors && entries.errors.length)) return false;
            const event = picked.event, ge = picked.ge;
            const before = JSON.parse(JSON.stringify(event)), after = JSON.parse(JSON.stringify(event));
            S.stripCommentBlocks(after);
            after.note = S.write(after.note, entries);
            if (JSON.stringify(after) === JSON.stringify(before)) return false;
            const set = snapshot => {
                for (const key of Object.keys(event)) delete event[key];
                Object.assign(event, JSON.parse(JSON.stringify(snapshot)));
                const live = ge && typeof ge.event === 'function' ? ge.event() : null;
                if (live && live !== event) {
                    live.note = event.note;
                    live.pages = JSON.parse(JSON.stringify(event.pages || []));
                }
                const VE = DocsDoodads.VisualEquip;
                if (ge && VE && VE._eventText) VE._eventText.delete(ge);
                S.invalidate(ge);
                if (ge && ge.refresh) ge.refresh();
                else if (ge && DocsDoodads.ScheduleRuntime) DocsDoodads.ScheduleRuntime.invalidateEvent(ge);
                DocsDoodads.Persistence.dirtyMap = true;
            };
            DocsDoodads.Undo.execute({ type: 'event_schedule', apply: () => set(after), revert: () => set(before) });
            return true;
        },

        scheduleFromText(text) {
            return S.parse('<docs schedule>\n' + String(text || '') + '\n</docs schedule>', DocsDoodads.Calendar.weekdayNames());
        },

        renderScheduleDetails() {
            if (typeof document === 'undefined' || !this.selectedEvent) return null;
            const content = document.getElementById('dd-inspector-content');
            if (!content) return null;
            const old = document.getElementById('dd-event-schedule');
            if (old && old.parentNode) old.parentNode.removeChild(old);
            const picked = this.selectedScheduleData(), text = picked ? S.eventDataText(picked.event, picked.pageIndex) : '';
            const raw = S.blockText(text), entries = this.scheduleFromText(raw);
            const esc = DocsDoodads.Security.escapeHtml;
            const section = document.createElement('div');
            section.id = 'dd-event-schedule';
            section.style.cssText = 'margin-top:10px;border-top:1px solid var(--dd-line-soft);padding-top:8px;';
            section.innerHTML = `
                <div class="dd-panel-head" style="font-weight:900;margin-bottom:4px;">Schedule</div>
                <div style="font-size:10px;color:var(--dd-muted);margin-bottom:5px;">One line per place: weekdays (optional), time, tile, then walk, hide or face:2/4/6/8.</div>
                <textarea id="dd-schedule-text" rows="${Math.max(3, raw.split(/\r?\n/).length + 1)}" style="width:100%;resize:vertical;background:var(--dd-field);color:var(--dd-text);border:1px solid var(--dd-line);padding:5px;font:11px monospace;">${esc(raw)}</textarea>
                <div id="dd-schedule-errors" style="font-size:10px;color:var(--dd-danger);margin-top:3px;">${entries.errors.map(error => esc('Line ' + error.line + ': ' + error.message)).join('<br>')}</div>
                <div id="dd-schedule-rows" style="display:flex;flex-direction:column;gap:3px;margin-top:6px;">${entries.map((entry, index) => `
                    <div style="display:flex;align-items:center;gap:4px;font-size:10px;"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;">${esc(S.formatEntry(entry))}</span>
                    <button class="dd-btn dd-schedule-use" type="button" data-index="${index}">Use this tile</button>
                    <button class="dd-btn dd-schedule-remove" type="button" data-index="${index}" title="Remove this schedule entry">×</button></div>`).join('')}</div>
                <button class="dd-btn" id="dd-schedule-add" type="button" style="margin-top:6px;">+ Add time</button>`;
            const actions = document.getElementById('dd-ev-save-template-btn');
            const holder = actions && actions.parentNode;
            if (holder && holder.parentNode === content) content.insertBefore(section, holder); else content.appendChild(section);
            const textarea = document.getElementById('dd-schedule-text');
            const saveText = () => {
                const next = this.scheduleFromText(textarea ? textarea.value : '');
                const errorBox = document.getElementById('dd-schedule-errors');
                if (errorBox) errorBox.innerHTML = next.errors.map(error => esc('Line ' + error.line + ': ' + error.message)).join('<br>');
                if (next.errors.length) { this.showToast('Fix the schedule line shown in red before saving.', 'error'); return false; }
                if (this.editEventSchedule(next)) this.refreshInspector();
                return true;
            };
            if (textarea) textarea.onchange = saveText;
            const add = document.getElementById('dd-schedule-add');
            if (add) add.onclick = () => {
                const ge = this.selectedEvent && this.selectedEvent.gameEvent;
                const x = ge ? ge.x : 0, y = ge ? ge.y : 0;
                const value = (textarea.value.trim() ? textarea.value.trim() + '\n' : '') + '08:00 ' + x + ',' + y;
                const next = this.scheduleFromText(value);
                if (this.editEventSchedule(next)) this.refreshInspector();
            };
            for (const button of Array.from(section.querySelectorAll('.dd-schedule-use'))) button.onclick = () => this.beginScheduleTilePick(Number(button.getAttribute('data-index')));
            for (const button of Array.from(section.querySelectorAll('.dd-schedule-remove'))) button.onclick = () => {
                const index = Number(button.getAttribute('data-index'));
                const next = this.eventScheduleEntries().filter((entry, i) => i !== index);
                if (this.editEventSchedule(next)) this.refreshInspector();
            };
            return section;
        },

        beginScheduleTilePick(index) {
            const picked = this.selectedScheduleData();
            if (!picked || !Number.isInteger(index) || index < 0) return false;
            const entries = this.eventScheduleEntries();
            if (entries.errors && entries.errors.length) { this.showToast('Fix the schedule lines before picking a tile.', 'error'); return false; }
            const id = picked.ge && picked.ge.eventId ? picked.ge.eventId() : picked.event.id;
            this._schedulePick = { eventId: id, index };
            this.setPlacementTool('scheduleTile');
            this.showToast('Click a tile for this schedule entry.', 'info');
            return true;
        },

        useScheduleTile(coords) {
            const pick = this._schedulePick, selected = this.selectedScheduleData();
            const id = selected && (selected.ge && selected.ge.eventId ? selected.ge.eventId() : selected.event.id);
            if (!pick || !selected || id !== pick.eventId) { this._schedulePick = null; this.setPlacementTool(null); return false; }
            const entries = this.eventScheduleEntries();
            if (!entries[pick.index]) { this._schedulePick = null; this.setPlacementTool(null); return false; }
            entries[pick.index] = Object.assign({}, entries[pick.index], { x: Math.max(0, Math.floor(coords.tileX)), y: Math.max(0, Math.floor(coords.tileY)) });
            const changed = this.editEventSchedule(entries);
            this._schedulePick = null;
            this.setPlacementTool(null);
            this.refreshInspector();
            return changed;
        },

        scheduleOverlayEntries() {
            if (!this.selectedEvent) return [];
            return this.eventScheduleEntries().map(entry => ({ x: entry.x, y: entry.y, label: S.formatTime(entry.minutes), hide: entry.hide }));
        },

        drawScheduleOverlay(g) {
            const entries = this.scheduleOverlayEntries(), map = typeof $gameMap !== 'undefined' ? $gameMap : null;
            const labels = g && g._ddScheduleLabels ? g._ddScheduleLabels : [];
            const in3d = DocsDoodads.Perspective && DocsDoodads.Perspective.liveCamera && DocsDoodads.Perspective.liveCamera();
            if (!g || !map || in3d) { for (const label of labels) label.visible = false; return; }
            const tw = map.tileWidth(), th = map.tileHeight(), color = DocsDoodads.Ui.mapColor('selection');
            entries.forEach(entry => {
                const x = map.isLoopHorizontal && map.isLoopHorizontal() ? map.roundX(entry.x) : entry.x;
                const y = map.isLoopVertical && map.isLoopVertical() ? map.roundY(entry.y) : entry.y;
                if (map.isValid && !map.isValid(x, y)) return;
                const sx = map.adjustX(x) * tw, sy = map.adjustY(y) * th;
                g.lineStyle(2, color, entry.hide ? 0.55 : 0.95); g.drawRect(sx + 2, sy + 2, tw - 4, th - 4); g.lineStyle(0);
            });
            if (typeof g.addChild !== 'function' || typeof PIXI === 'undefined' || !PIXI.Text) return;
            const pool = g._ddScheduleLabels = labels;
            let used = 0;
            for (const entry of entries) {
                const x = map.isLoopHorizontal && map.isLoopHorizontal() ? map.roundX(entry.x) : entry.x;
                const y = map.isLoopVertical && map.isLoopVertical() ? map.roundY(entry.y) : entry.y;
                if (map.isValid && !map.isValid(x, y)) continue;
                let label = pool[used++];
                if (!label) {
                    const fill = '#' + color.toString(16).padStart(6, '0');
                    label = new PIXI.Text('', { fontFamily: 'sans-serif', fontSize: 12, fontWeight: 'bold', fill, stroke: '#2f2a43', strokeThickness: 4 });
                    if (label.anchor && label.anchor.set) label.anchor.set(0.5);
                    pool.push(label); g.addChild(label);
                }
                if (label.style) label.style.fill = '#' + color.toString(16).padStart(6, '0');
                label.text = entry.label; label.x = (map.adjustX(x) + 0.5) * tw; label.y = (map.adjustY(y) + 0.5) * th; label.visible = true;
            }
            for (let i = used; i < pool.length; i++) pool[i].visible = false;
        }
    });

    W.renderInspector = function() {
        renderInspector.call(this);
        if (this.selectedEvent) this.renderScheduleDetails();
    };
    W.toolHooks.scheduleTile = {
        click(coords) { return this.useScheduleTile(coords); },
        overlay(g) { this.drawScheduleOverlay(g); }
    };
})();
