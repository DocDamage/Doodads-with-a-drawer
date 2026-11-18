// @editor-only
//==========================================================
// SECTION 25B: EVENT PAGE AND COMMAND EDITOR
//==========================================================
(function() {
    const W = DocsDoodads.Workspace, C = DocsDoodads.EventCommands, U = DocsDoodads.Ui;
    const esc = value => DocsDoodads.Security.escapeHtml(String(value === undefined ? '' : value));
    const number = (value, fallback) => Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback;
    const copy = value => JSON.parse(JSON.stringify(value));

    Object.assign(W, {
        eventEditorEvent() { return this.selectedStagedEvent ? this.selectedStagedEvent() : null; },
        eventEditorPage() {
            const event = this.eventEditorEvent(), last = Math.max(0, ((event && event.pages) || []).length - 1);
            this._eventCommandPage = Math.max(0, Math.min(last, number(this._eventCommandPage, 0)));
            return this._eventCommandPage;
        },
        eventEditorPageData() {
            const event = this.eventEditorEvent(), pages = event && event.pages || [];
            return pages[this.eventEditorPage()] || null;
        },
        openEventCommandEditor(pageIndex) {
            if (!this.eventEditorEvent()) return false;
            this._eventCommandPage = Math.max(0, number(pageIndex, this._eventCommandPage || 0));
            this.renderEventCommandEditor();
            return true;
        },
        closeEventCommandEditor() {
            const card = typeof document !== 'undefined' ? document.getElementById('dd-event-command-editor') : null;
            if (card && card.parentNode) card.parentNode.removeChild(card);
            this._eventCommandCardIdentity = null;
        },
        // Undo and Redo change the event in place: an open card for it is drawn again (on the nearest page).
        refreshEventCommandEditorFor(event) {
            if (typeof document === 'undefined' || !document.getElementById('dd-event-command-editor')) return false;
            const identity = this._eventCommandCardIdentity;
            if (!identity || identity.event !== event || this.eventEditorEvent() !== event) return false;
            this.renderEventCommandEditor();
            return true;
        },
        eventEditorIdentity(pageIndex) {
            const event = this.eventEditorEvent();
            return event ? { mapId: this.currentMapId(), event, eventId: event.id, pageIndex: pageIndex === undefined ? this.eventEditorPage() : pageIndex } : null;
        },
        eventEditorIdentityMatches(identity) {
            if (!identity || this.currentMapId() !== identity.mapId || this.eventEditorPage() !== identity.pageIndex) return false;
            const event = this.eventEditorEvent();
            return event === identity.event && event.id === identity.eventId;
        },
        editEventCommandList(type, mutate) {
            const pageIndex = this.eventEditorPage();
            const changed = this.editSelectedEvent(type || 'event_commands', event => {
                const page = event.pages && event.pages[pageIndex];
                if (page) page.list = C.clone(mutate(C.clone(page.list || [{ code: 0, indent: 0, parameters: [] }])));
            });
            if (changed) this.renderEventCommandEditor();
            return changed;
        },
        replaceEventCommand(index, values) { return this.editEventCommandList('edit_event_command', list => C.replace(list, index, values)); },
        insertEventCommand(index, id, values, indent) { return this.editEventCommandList('insert_event_command', list => C.insert(list, index, id, values, indent)); },
        removeEventCommand(index) { return this.editEventCommandList('remove_event_command', list => C.remove(list, index)); },
        moveEventCommand(index, direction) { return this.editEventCommandList('move_event_command', list => C.move(list, index, direction)); },
        addEventCommandPage(asCopy) {
            const current = this.eventEditorPage(), event = this.eventEditorEvent();
            if (!event) return false;
            const insertAt = current + 1, source = asCopy && event.pages[current] ? copy(event.pages[current]) : C.blankPage();
            const changed = this.editSelectedEvent(asCopy ? 'copy_event_page' : 'add_event_page', edited => {
                edited.pages = Array.isArray(edited.pages) ? edited.pages : [];
                edited.pages.splice(insertAt, 0, copy(source));
            });
            if (changed) { this._eventCommandPage = insertAt; this.renderEventCommandEditor(); }
            return changed;
        },
        async deleteEventCommandPage() {
            const event = this.eventEditorEvent(), index = this.eventEditorPage(), identity = this.eventEditorIdentity(index);
            if (!event || !event.pages || event.pages.length <= 1) { this.showToast('An event must keep at least one page.', 'info'); return false; }
            if (!(await U.confirm(`Delete page ${index + 1}? Its conditions and commands will be removed.`, { title: 'Delete event page?', ok: 'Delete Page', danger: true }))) return false;
            if (!this.eventEditorIdentityMatches(identity)) return false;
            const changed = this.editSelectedEvent('delete_event_page', edited => { edited.pages.splice(index, 1); });
            if (changed) { this._eventCommandPage = Math.min(index, event.pages.length - 1); this.renderEventCommandEditor(); }
            return changed;
        },
        updateEventCommandPage(values) {
            const index = this.eventEditorPage(), next = values || {};
            const changed = this.editSelectedEvent('edit_event_page', event => {
                const page = event.pages && event.pages[index];
                if (!page) return;
                if (next.conditions) page.conditions = copy(next.conditions);
                if (next.trigger !== undefined) page.trigger = Math.max(0, Math.min(4, number(next.trigger, 0)));
                if (next.priorityType !== undefined) page.priorityType = Math.max(0, Math.min(2, number(next.priorityType, 1)));
            });
            if (changed) this.renderEventCommandEditor();
            return changed;
        },
        eventCommandOptions(kind) {
            const arrayOptions = (array, fallback) => (array || []).map((entry, id) => {
                if (!id || entry === null || entry === undefined) return null;
                const name = typeof entry === 'string' ? entry : entry.name;
                return { value: id, label: id + ': ' + (name || fallback || '(unnamed)') };
            }).filter(Boolean);
            if (kind === 'switch') return arrayOptions(typeof $dataSystem !== 'undefined' && $dataSystem ? $dataSystem.switches : [], 'Switch');
            if (kind === 'variable') return arrayOptions(typeof $dataSystem !== 'undefined' && $dataSystem ? $dataSystem.variables : [], 'Variable');
            if (kind === 'commonEvent') return arrayOptions(typeof $dataCommonEvents !== 'undefined' ? $dataCommonEvents : [], 'Common Event');
            if (kind === 'actor') return arrayOptions(typeof $dataActors !== 'undefined' ? $dataActors : [], 'Actor');
            if (kind === 'item') return arrayOptions(typeof $dataItems !== 'undefined' ? $dataItems : [], 'Item');
            if (kind === 'map') return (this.mapEntries ? this.mapEntries() : []).map(map => ({ value: map.id, label: map.id + ': ' + map.name }));
            if (kind === 'se') {
                const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data && DocsDoodads.AssetIndex.data.assets || {};
                return Object.keys(assets).map(id => assets[id]).filter(asset => asset && asset.category === 'Audio' && /audio[\\/]se[\\/]/i.test(asset.path || ''))
                    .map(asset => ({ value: String(asset.path).replace(/^.*?audio[\\/]se[\\/]/i, '').replace(/\.[^.]+$/, '').replace(/\\/g, '/'), label: asset.fileName || asset.path }));
            }
            return [];
        },
        eventCommandFormFields(def, values) {
            return def.fields.map(meta => {
                let value = values[meta.key];
                if (meta.kind === 'json') value = JSON.stringify(value || {}, null, 0);
                if (def.id === 'showText' && meta.key === 'text') value = String(value || '').replace(/\n/g, '\\n');
                const options = (meta.options || this.eventCommandOptions(meta.kind)).map(option => Object.assign({}, option));
                if (['choice', 'switch', 'variable', 'map', 'commonEvent', 'actor', 'item'].includes(meta.kind)) {
                    if (!options.some(option => String(option.value) === String(value))) options.unshift({ value, label: String(value) + ': (current)' });
                    return { key: meta.key, label: meta.label, type: 'select', value, options };
                }
                const choices = meta.kind === 'se' ? this.eventCommandOptions('se').map(option => option.value) : undefined;
                return { key: meta.key, label: meta.label, value, choices, placeholder: meta.kind === 'json' ? '{"name":"value"}' : undefined };
            });
        },
        eventCommandFormValues(def, raw, previous) {
            const out = Object.assign({}, previous || {});
            for (const meta of def.fields) {
                const value = raw[meta.key];
                if (meta.kind === 'choice') {
                    const option = (meta.options || []).find(item => String(item.value) === String(value));
                    out[meta.key] = option ? option.value : value;
                } else if (meta.kind === 'number' || meta.kind === 'switch' || meta.kind === 'variable' || meta.kind === 'map' || meta.kind === 'tile' || meta.kind === 'commonEvent' || meta.kind === 'actor' || meta.kind === 'item') out[meta.key] = number(value, number(out[meta.key], 0));
                else if (meta.kind === 'json') {
                    try { out[meta.key] = JSON.parse(String(value || '{}')); }
                    catch (error) { this.showToast('Arguments must be a JSON object.', 'error'); return null; }
                    if (!out[meta.key] || typeof out[meta.key] !== 'object' || Array.isArray(out[meta.key])) { this.showToast('Arguments must be a JSON object.', 'error'); return null; }
                } else if (def.id === 'showText' && meta.key === 'text') out[meta.key] = String(value || '').replace(/\\n/g, '\n');
                else out[meta.key] = String(value === undefined ? '' : value);
            }
            return out;
        },
        async editEventCommand(index) {
            const page = this.eventEditorPageData(), row = page && C.rowAt(page.list, index), def = row && C.get(row.code);
            if (!row || !def) { this.showToast('This command is preserved exactly; edit it in MZ.', 'info'); return false; }
            const identity = this.eventEditorIdentity();
            const values = await DocsDoodads.Ui.form({ title: def.label, text: def.id === 'showText' ? 'Use \\n in the Text field for a new line.' : '', ok: 'Save Command',
                fields: this.eventCommandFormFields(def, row.values) });
            if (!values || !this.eventEditorIdentityMatches(identity)) return false;
            const parsed = this.eventCommandFormValues(def, values, row.values);
            return parsed ? this.replaceEventCommand(row.index, parsed) : false;
        },
        async chooseEventCommand(index) {
            const identity = this.eventEditorIdentity();
            const picked = await U.form({ title: 'Insert Command', ok: 'Next', fields: [{ key: 'id', label: 'Command', type: 'select', value: 'showText', options: C.definitions.map(def => ({ value: def.id, label: def.label })) }] });
            if (!picked || !this.eventEditorIdentityMatches(identity)) return false;
            const def = C.get(picked.id);
            if (!def) return false;
            const defaults = def.read(def.write({}, 0), 0);
            const values = await U.form({ title: def.label, ok: 'Insert', fields: this.eventCommandFormFields(def, defaults) });
            if (!values || !this.eventEditorIdentityMatches(identity)) return false;
            const parsed = this.eventCommandFormValues(def, values, defaults);
            return parsed ? this.insertEventCommand(index, def.id, parsed, 0) : false;
        },
        async editEventPageConditions() {
            const page = this.eventEditorPageData(); if (!page) return false;
            const identity = this.eventEditorIdentity();
            const c = Object.assign({}, C.blankPage().conditions, page.conditions || {}), switches = this.eventCommandOptions('switch'), variables = this.eventCommandOptions('variable');
            const values = await U.form({ title: 'Page ' + (this.eventEditorPage() + 1) + ' Conditions', ok: 'Save Page', fields: [
                { key: 'switch1Valid', type: 'checkbox', label: 'Require switch 1', value: c.switch1Valid }, { key: 'switch1Id', type: 'select', label: 'Switch 1', value: c.switch1Id, options: switches },
                { key: 'switch2Valid', type: 'checkbox', label: 'Require switch 2', value: c.switch2Valid }, { key: 'switch2Id', type: 'select', label: 'Switch 2', value: c.switch2Id, options: switches },
                { key: 'variableValid', type: 'checkbox', label: 'Require variable', value: c.variableValid }, { key: 'variableId', type: 'select', label: 'Variable', value: c.variableId, options: variables },
                { key: 'variableValue', label: 'Variable is at least', value: c.variableValue }, { key: 'selfSwitchValid', type: 'checkbox', label: 'Require self switch', value: c.selfSwitchValid },
                { key: 'selfSwitchCh', type: 'select', label: 'Self switch', value: c.selfSwitchCh, options: ['A', 'B', 'C', 'D'].map(value => ({ value, label: value })) },
                { key: 'itemValid', type: 'checkbox', label: 'Require item', value: c.itemValid }, { key: 'itemId', type: 'select', label: 'Item', value: c.itemId, options: this.eventCommandOptions('item') },
                { key: 'actorValid', type: 'checkbox', label: 'Require actor', value: c.actorValid }, { key: 'actorId', type: 'select', label: 'Actor', value: c.actorId, options: this.eventCommandOptions('actor') },
                { key: 'trigger', type: 'select', label: 'Trigger', value: page.trigger, options: ['Action Button', 'Player Touch', 'Event Touch', 'Autorun', 'Parallel'].map((label, value) => ({ value, label })) },
                { key: 'priorityType', type: 'select', label: 'Priority', value: page.priorityType, options: ['Below Characters', 'Same as Characters', 'Above Characters'].map((label, value) => ({ value, label })) }
            ] });
            if (!values || !this.eventEditorIdentityMatches(identity)) return false;
            const conditions = {};
            for (const key of ['switch1Valid', 'switch2Valid', 'variableValid', 'selfSwitchValid', 'itemValid', 'actorValid']) conditions[key] = Boolean(values[key]);
            for (const key of ['switch1Id', 'switch2Id', 'variableId', 'variableValue', 'itemId', 'actorId']) conditions[key] = Math.max(key === 'variableValue' ? -99999999 : 1, number(values[key], c[key]));
            conditions.selfSwitchCh = /^[ABCD]$/.test(values.selfSwitchCh) ? values.selfSwitchCh : 'A';
            return this.updateEventCommandPage({ conditions, trigger: values.trigger, priorityType: values.priorityType });
        },
        beginEventTransferPick(commandIndex, targetMapId) {
            const event = this.eventEditorEvent(), pageIndex = this.eventEditorPage(), page = event && event.pages[pageIndex], row = page && C.rowAt(page.list, commandIndex);
            if (!event || !row || row.code !== 201) return false;
            const returnMapId = this.currentMapId(), target = Math.max(1, number(targetMapId, row.values.mapId));
            this._eventTransferPick = { returnMapId, targetMapId: target, eventId: event.id, pageIndex, commandIndex: row.index, values: copy(row.values), phase: target === returnMapId ? 'target' : 'goingTarget' };
            this.closeEventCommandEditor();
            if (target === returnMapId) { this.setEventTransferTool('eventTransferTile'); this.showToast('Click the destination tile.', 'info'); }
            else this.goToMap(target);
            return true;
        },
        setEventTransferTool(tool) {
            this._eventTransferChangingTool = true;
            try { return setPlacementTool.call(this, tool); }
            finally { this._eventTransferChangingTool = false; }
        },
        cancelEventTransferPick(returnToSource) {
            const pick = this._eventTransferPick;
            if (!pick) return false;
            this._eventTransferPick = null;
            this.setEventTransferTool(null);
            const shouldReturn = Boolean(returnToSource && this.currentMapId() !== pick.returnMapId && this.mounted !== false);
            if (shouldReturn) this.goToMap(pick.returnMapId);
            return shouldReturn;
        },
        resumeEventTransferPick() {
            const pick = this._eventTransferPick; if (!pick) return false;
            const mapId = this.currentMapId();
            if (pick.phase === 'goingTarget' && mapId === pick.targetMapId) {
                pick.phase = 'target'; this.setEventTransferTool('eventTransferTile'); this.showToast('Click the destination tile; then the editor will return.', 'info'); return true;
            }
            if (pick.phase === 'goingReturn' && mapId === pick.returnMapId) {
                const staged = window.$gameMap && $gameMap._stagedMapData, event = staged && staged.events && staged.events[pick.eventId];
                const gameEvent = window.$gameMap && $gameMap.event ? $gameMap.event(pick.eventId) : null;
                if (!event) { this._eventTransferPick = null; this.showToast('The source event no longer exists.', 'error'); return false; }
                this.selectedEvent = { gameEvent, stagedEvent: event };
                this._eventCommandPage = pick.pageIndex;
                const values = Object.assign({}, pick.values, { mapId: pick.targetMapId, x: pick.x, y: pick.y });
                this._eventTransferPick = null;
                this.replaceEventCommand(pick.commandIndex, values);
                this.openEventCommandEditor(pick.pageIndex);
                return true;
            }
            if (pick.phase === 'target' && mapId !== pick.targetMapId) this.cancelEventTransferPick(true);
            if ((pick.phase === 'goingTarget' || pick.phase === 'goingReturn') && mapId !== pick.targetMapId && mapId !== pick.returnMapId) this.cancelEventTransferPick(true);
            return false;
        },
        useEventTransferTile(coords) {
            const pick = this._eventTransferPick, map = typeof $gameMap !== 'undefined' ? $gameMap : null;
            if (!pick || pick.phase !== 'target') return false;
            const x = number(coords && coords.tileX, -1), y = number(coords && coords.tileY, -1);
            if (x < 0 || y < 0 || (map && map.isValid && !map.isValid(x, y))) { this.showToast('Choose a tile inside the map.', 'info'); return false; }
            pick.x = x; pick.y = y; this.setEventTransferTool(null);
            if (pick.returnMapId === pick.targetMapId) {
                const values = Object.assign({}, pick.values, { mapId: pick.targetMapId, x, y });
                this._eventTransferPick = null;
                this.replaceEventCommand(pick.commandIndex, values); this.openEventCommandEditor(pick.pageIndex); return true;
            }
            pick.phase = 'goingReturn'; this.goToMap(pick.returnMapId); return true;
        },
        pickEventTransferDestination(index) {
            const page = this.eventEditorPageData(), row = page && C.rowAt(page.list, index);
            if (!row || row.code !== 201) return false;
            const identity = this.eventEditorIdentity();
            // The picker starts on the current destination (a direct one; a destination from variables has none).
            const params = (page.list[row.index] && page.list[row.index].parameters) || [];
            const current = Number(params[0]) === 0 ? Number(params[1]) || 0 : 0;
            this.showMapPicker('Transfer Player destination map', mapId => { if (this.eventEditorIdentityMatches(identity)) this.beginEventTransferPick(row.index, mapId); }, current);
            return true;
        },
        renderEventCommandEditor() {
            if (typeof document === 'undefined') return null;
            this.closeEventCommandEditor();
            const event = this.eventEditorEvent(); if (!event) return null;
            const pageIndex = this.eventEditorPage(), page = event.pages[pageIndex], rows = C.describe(page.list || []);
            const card = document.createElement('div'); card.id = 'dd-event-command-editor'; card.className = 'dd-glass';
            this._eventCommandCardIdentity = this.eventEditorIdentity(pageIndex);
            card.style.cssText = 'position:fixed;z-index:10042;top:52px;left:50%;transform:translateX(-50%);width:min(720px,calc(100vw - 32px));max-height:calc(100vh - 74px);overflow:auto;padding:14px;';
            card.innerHTML = `<div class="dd-panel-head" data-dd-help="editing-what-an-event-does"><span class="dd-grow">Event ${event.id}: Pages & Commands</span><button class="dd-btn" id="dd-event-editor-close">Close</button></div>
                <div id="dd-event-page-tabs" style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0;">${event.pages.map((unused, index) => `<button class="dd-btn dd-event-page-tab${index === pageIndex ? ' dd-btn-active' : ''}" data-page="${index}">Page ${index + 1}</button>`).join('')}
                    <button class="dd-btn" id="dd-event-page-add">+ Page</button><button class="dd-btn" id="dd-event-page-copy">Copy Page</button><button class="dd-btn" id="dd-event-page-delete" style="background:var(--dd-danger-soft);">Delete Page</button></div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="flex:1;color:var(--dd-muted);font-size:11px;">Trigger ${number(page.trigger, 0)} · Priority ${number(page.priorityType, 1)} · page conditions are kept in MZ's format.</span><button class="dd-btn" id="dd-event-page-conditions">Conditions & Page…</button></div>
                <div style="display:flex;flex-direction:column;gap:4px;">${rows.map((row, rowIndex) => `<div class="dd-event-command-row" tabindex="0" data-index="${row.index}" style="display:flex;align-items:center;gap:5px;padding:5px 6px;margin-left:${Math.min(6, row.indent) * 14}px;border:1px solid var(--dd-line-soft);border-radius:5px;">
                    <span style="width:22px;color:var(--dd-muted);">${rowIndex + 1}</span><span style="min-width:110px;font-weight:800;">${esc(row.label)}</span><span style="flex:1;min-width:0;color:${row.editable ? 'var(--dd-text)' : 'var(--dd-warn)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(row.editable ? row.summary : 'Edit in MZ — kept untouched')}</span>
                    ${row.code === 201 ? `<button class="dd-btn dd-event-command-pick" data-index="${row.index}">Pick Map & Tile</button>` : ''}${row.editable ? `<button class="dd-btn dd-event-command-edit" data-index="${row.index}">Edit</button>` : ''}
                    <button class="dd-btn dd-event-command-up" data-index="${row.index}" ${row.editable && rowIndex && rows[rowIndex - 1].editable && rows[rowIndex - 1].indent === row.indent ? '' : 'disabled'}>↑</button><button class="dd-btn dd-event-command-down" data-index="${row.index}" ${row.editable && rowIndex < rows.length - 1 && rows[rowIndex + 1].editable && rows[rowIndex + 1].indent === row.indent ? '' : 'disabled'}>↓</button>${row.editable ? `<button class="dd-btn dd-event-command-remove" data-index="${row.index}">×</button>` : ''}</div>`).join('')}</div>
                <button class="dd-btn dd-btn-primary" id="dd-event-command-insert" style="margin-top:8px;">+ Insert Command</button>`;
            document.body.appendChild(card);
            const on = (id, fn) => { const element = document.getElementById(id); if (element) element.onclick = fn; };
            on('dd-event-editor-close', () => this.closeEventCommandEditor());
            for (const button of Array.from(card.querySelectorAll('.dd-event-page-tab'))) button.onclick = () => { this._eventCommandPage = number(button.getAttribute('data-page'), 0); this.renderEventCommandEditor(); };
            on('dd-event-page-add', () => this.addEventCommandPage(false)); on('dd-event-page-copy', () => this.addEventCommandPage(true));
            on('dd-event-page-delete', () => this.deleteEventCommandPage()); on('dd-event-page-conditions', () => this.editEventPageConditions());
            on('dd-event-command-insert', () => this.chooseEventCommand((page.list || []).length - 1));
            const bind = (selector, fn) => { for (const button of Array.from(card.querySelectorAll(selector))) button.onclick = event => { event.stopPropagation(); fn(number(button.getAttribute('data-index'), 0)); }; };
            bind('.dd-event-command-edit', index => this.editEventCommand(index)); bind('.dd-event-command-remove', index => this.removeEventCommand(index));
            bind('.dd-event-command-up', index => this.moveEventCommand(index, -1)); bind('.dd-event-command-down', index => this.moveEventCommand(index, 1));
            bind('.dd-event-command-pick', index => this.pickEventTransferDestination(index));
            for (const row of Array.from(card.querySelectorAll('.dd-event-command-row'))) row.onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); this.editEventCommand(number(row.getAttribute('data-index'), 0)); } };
            return card;
        }
    });

    W.toolHooks.eventTransferTile = { click(coords) { return this.useEventTransferTile(coords); } };
    const setPlacementTool = W.setPlacementTool;
    W.setPlacementTool = function(tool) {
        if (!this._eventTransferChangingTool && this.placementTool === 'eventTransferTile' && tool !== 'eventTransferTile' && this._eventTransferPick) {
            if (this.cancelEventTransferPick(true)) return this.placementTool;
        }
        return setPlacementTool.call(this, tool);
    };
    const loaded = W.onMapLoaded;
    W.onMapLoaded = function() { this.closeEventCommandEditor(); const result = loaded.call(this); this.resumeEventTransferPick(); return result; };
    const renderInspector = W.renderInspector;
    W.renderInspector = function() {
        renderInspector.call(this);
        if (this._eventCommandCardIdentity && !this.eventEditorIdentityMatches(this._eventCommandCardIdentity)) this.closeEventCommandEditor();
        if (!this.selectedEvent || typeof document === 'undefined') return;
        const content = document.getElementById('dd-inspector-content'); if (!content || document.getElementById('dd-ev-commands-btn')) return;
        const button = document.createElement('button'); button.id = 'dd-ev-commands-btn'; button.className = 'dd-btn dd-btn-primary';
        button.style.cssText = 'width:100%;margin-top:6px;'; button.textContent = 'Edit Commands…'; button.onclick = () => this.openEventCommandEditor(0);
        content.appendChild(button);
    };
})();
