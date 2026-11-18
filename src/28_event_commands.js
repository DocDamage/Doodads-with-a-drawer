// @editor-only
//==========================================================
// SECTION 17B: MZ EVENT COMMAND MODEL
//==========================================================
// The workspace edits only the commands in this table. Unknown MZ/plugin commands are opaque rows and list
// operations copy them byte for byte. A Show Text header and all of its 401 continuation lines are one row.
(function() {
    const clone = value => JSON.parse(JSON.stringify(value));
    const integer = (value, fallback, min, max) => {
        const n = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback;
        return Math.max(min, Math.min(max, n));
    };
    const command = (code, indent, parameters) => ({ code, indent: integer(indent, 0, 0, 99), parameters });
    const field = (key, label, kind, extra) => Object.assign({ key, label, kind }, extra || {});
    const definitions = [];
    const add = spec => { definitions.push(spec); return spec; };

    add({ id: 'showText', code: 101, label: 'Show Text',
        fields: [field('speakerName', 'Speaker', 'text'), field('text', 'Text (use \\n for a new line)', 'text'),
            field('faceName', 'Face file', 'text'), field('faceIndex', 'Face index', 'number', { min: 0, max: 7 }),
            field('background', 'Background', 'choice', { options: [{ value: 0, label: 'Window' }, { value: 1, label: 'Dim' }, { value: 2, label: 'Transparent' }] }),
            field('positionType', 'Position', 'choice', { options: [{ value: 0, label: 'Top' }, { value: 1, label: 'Middle' }, { value: 2, label: 'Bottom' }] })],
        read(list, index) {
            const p = (list[index] && list[index].parameters) || [], indent = Number(list[index] && list[index].indent) || 0, lines = [];
            for (let i = index + 1; i < list.length && list[i] && list[i].code === 401 && (Number(list[i].indent) || 0) === indent; i++) lines.push(String((list[i].parameters || [])[0] || ''));
            return { faceName: String(p[0] || ''), faceIndex: integer(p[1], 0, 0, 7), background: integer(p[2], 0, 0, 2),
                positionType: integer(p[3], 2, 0, 2), speakerName: String(p[4] || ''), text: lines.join('\n') };
        },
        write(values, indent) {
            const v = values || {}, lines = String(v.text === undefined ? '' : v.text).split(/\r?\n/);
            return [command(101, indent, [String(v.faceName || ''), integer(v.faceIndex, 0, 0, 7), integer(v.background, 0, 0, 2),
                integer(v.positionType, 2, 0, 2), String(v.speakerName || '')])]
                .concat(lines.map(line => command(401, indent, [line])));
        },
        summary(v) { return (v.speakerName ? v.speakerName + ': ' : '') + String(v.text || '').replace(/\s+/g, ' ').slice(0, 100); }
    });
    add({ id: 'transfer', code: 201, label: 'Transfer Player',
        fields: [field('mapId', 'Map', 'map'), field('x', 'Tile X', 'tile'), field('y', 'Tile Y', 'tile'),
            field('direction', 'Face', 'choice', { options: [{ value: 0, label: 'Keep direction' }, { value: 2, label: 'Down' }, { value: 4, label: 'Left' }, { value: 6, label: 'Right' }, { value: 8, label: 'Up' }] }),
            field('fadeType', 'Fade', 'choice', { options: [{ value: 0, label: 'Black' }, { value: 1, label: 'White' }, { value: 2, label: 'None' }] })],
        read(list, index) { const p = (list[index] && list[index].parameters) || []; return { mapId: integer(p[1], 1, 1, 9999), x: integer(p[2], 0, 0, 9999), y: integer(p[3], 0, 0, 9999), direction: integer(p[4], 0, 0, 8), fadeType: integer(p[5], 0, 0, 2) }; },
        write(v, indent) { v = v || {}; return [command(201, indent, [0, integer(v.mapId, 1, 1, 9999), integer(v.x, 0, 0, 9999), integer(v.y, 0, 0, 9999), integer(v.direction, 0, 0, 8), integer(v.fadeType, 0, 0, 2)])]; },
        summary(v) { return 'Map ' + v.mapId + ' at ' + v.x + ',' + v.y; }
    });
    add({ id: 'switches', code: 121, label: 'Control Switches',
        fields: [field('startId', 'First switch', 'switch'), field('endId', 'Last switch', 'switch'), field('value', 'Set to', 'choice', { options: [{ value: 0, label: 'ON' }, { value: 1, label: 'OFF' }] })],
        read(list, index) { const p = (list[index] && list[index].parameters) || []; return { startId: integer(p[0], 1, 1, 9999), endId: integer(p[1], 1, 1, 9999), value: integer(p[2], 0, 0, 1) }; },
        write(v, indent) { v = v || {}; const a = integer(v.startId, 1, 1, 9999), b = integer(v.endId, a, 1, 9999); return [command(121, indent, [Math.min(a, b), Math.max(a, b), integer(v.value, 0, 0, 1)])]; },
        summary(v) { return 'Switch ' + v.startId + (v.endId !== v.startId ? '–' + v.endId : '') + ' ' + (v.value ? 'OFF' : 'ON'); }
    });
    add({ id: 'selfSwitch', code: 123, label: 'Control Self Switch',
        fields: [field('letter', 'Self switch', 'choice', { options: ['A', 'B', 'C', 'D'].map(value => ({ value, label: value })) }), field('value', 'Set to', 'choice', { options: [{ value: 0, label: 'ON' }, { value: 1, label: 'OFF' }] })],
        read(list, index) { const p = (list[index] && list[index].parameters) || []; return { letter: /^[ABCD]$/.test(String(p[0] || '')) ? String(p[0]) : 'A', value: integer(p[1], 0, 0, 1) }; },
        write(v, indent) { v = v || {}; return [command(123, indent, [/^[ABCD]$/.test(String(v.letter || '')) ? String(v.letter) : 'A', integer(v.value, 0, 0, 1)])]; },
        summary(v) { return 'Self Switch ' + v.letter + ' ' + (v.value ? 'OFF' : 'ON'); }
    });
    add({ id: 'commonEvent', code: 117, label: 'Common Event', fields: [field('id', 'Common event', 'commonEvent')],
        read(list, index) { return { id: integer(((list[index] && list[index].parameters) || [])[0], 1, 1, 9999) }; },
        write(v, indent) { return [command(117, indent, [integer(v && v.id, 1, 1, 9999)])]; }, summary(v) { return 'Common Event ' + v.id; } });
    add({ id: 'wait', code: 230, label: 'Wait', fields: [field('frames', 'Frames', 'number', { min: 1, max: 999999 })],
        read(list, index) { return { frames: integer(((list[index] && list[index].parameters) || [])[0], 1, 1, 999999) }; },
        write(v, indent) { return [command(230, indent, [integer(v && v.frames, 1, 1, 999999)])]; }, summary(v) { return v.frames + ' frames'; } });
    add({ id: 'playSe', code: 250, label: 'Play SE',
        fields: [field('name', 'Sound effect', 'se'), field('volume', 'Volume', 'number', { min: 0, max: 100 }), field('pitch', 'Pitch', 'number', { min: 50, max: 150 }), field('pan', 'Pan', 'number', { min: -100, max: 100 })],
        read(list, index) { const p = ((list[index] && list[index].parameters) || [])[0] || {}; return { name: String(p.name || ''), volume: integer(p.volume, 90, 0, 100), pitch: integer(p.pitch, 100, 50, 150), pan: integer(p.pan, 0, -100, 100) }; },
        write(v, indent) { v = v || {}; return [command(250, indent, [{ name: String(v.name || ''), volume: integer(v.volume, 90, 0, 100), pitch: integer(v.pitch, 100, 50, 150), pan: integer(v.pan, 0, -100, 100) }])]; }, summary(v) { return v.name || '(none)'; } });
    add({ id: 'plugin', code: 357, label: 'Plugin Command',
        fields: [field('pluginName', 'Plugin name', 'text'), field('commandName', 'Command', 'text'), field('displayName', 'Display name', 'text'), field('args', 'Arguments (JSON)', 'json')],
        read(list, index) { const p = (list[index] && list[index].parameters) || []; return { pluginName: String(p[0] || ''), commandName: String(p[1] || ''), displayName: String(p[2] || ''), args: clone(p[3] && typeof p[3] === 'object' ? p[3] : {}) }; },
        write(v, indent) { v = v || {}; let args = v.args; if (typeof args === 'string') { try { args = JSON.parse(args); } catch (e) { args = {}; } } if (!args || typeof args !== 'object' || Array.isArray(args)) args = {}; return [command(357, indent, [String(v.pluginName || ''), String(v.commandName || ''), String(v.displayName || ''), clone(args)])]; },
        summary(v) { return (v.pluginName || 'Plugin') + ': ' + (v.displayName || v.commandName || 'Command'); }
    });

    // MZ's names for the commands that are kept untouched (edited in MZ), so a branch reads as one.
    const mzNames = { 0: 'End of Block', 102: 'Show Choices', 402: 'When', 403: 'When Cancel', 404: 'End Choices', 103: 'Input Number',
        104: 'Select Item', 105: 'Scrolling Text', 405: 'Scrolling Text Line', 108: 'Comment', 408: 'Comment Line', 111: 'If',
        411: 'Else', 412: 'End If', 112: 'Loop', 413: 'Repeat Above', 113: 'Break Loop', 115: 'Exit Event', 118: 'Label',
        119: 'Jump to Label', 122: 'Control Variables', 124: 'Control Timer', 125: 'Change Gold', 126: 'Change Items',
        205: 'Movement Route', 505: 'Route Step', 301: 'Battle', 601: 'If Win', 602: 'If Escape', 603: 'If Lose',
        604: 'End Battle Branch', 302: 'Shop', 605: 'Shop Item', 355: 'Script', 655: 'Script Line', 401: 'Text Line',
        657: 'Plugin Argument' };
    const byId = {}, byCode = {};
    definitions.forEach(def => { byId[def.id] = def; byCode[def.code] = def; });
    const finalList = list => {
        const out = clone(Array.isArray(list) ? list : []);
        let end = { code: 0, indent: 0, parameters: [] };
        if (out.length && out[out.length - 1] && out[out.length - 1].code === 0) end = out.pop();
        out.push(end);
        return out;
    };

    DocsDoodads.EventCommands = {
        definitions,
        get(idOrCode) { return typeof idOrCode === 'number' ? byCode[idOrCode] || null : byId[String(idOrCode || '')] || null; },
        span(list, index) {
            const item = list && list[index], def = item && byCode[item.code];
            // Show Text takes its text lines (401) and a plugin command its argument lines (657) with it.
            const next = item && def ? { 101: 401, 357: 657 }[item.code] : null;
            if (!next) return item ? 1 : 0;
            const indent = Number(item.indent) || 0; let length = 1;
            while (list[index + length] && list[index + length].code === next && (Number(list[index + length].indent) || 0) === indent) length++;
            return length;
        },
        describe(list) {
            const source = Array.isArray(list) ? list : [], rows = [];
            for (let index = 0; index < source.length;) {
                const item = source[index];
                if (!item) { index++; continue; }
                if (item.code === 0 && index === source.length - 1) break;
                const def = byCode[item.code], length = this.span(source, index) || 1;
                if (def) {
                    const values = def.read(source, index);
                    rows.push({ index, length, code: item.code, indent: Number(item.indent) || 0, id: def.id, label: def.label,
                        editable: true, structural: false, values, summary: def.summary ? def.summary(values) : def.label });
                } else rows.push({ index, length: 1, code: item.code, indent: Number(item.indent) || 0, label: mzNames[item.code] || 'Command ' + item.code,
                    editable: false, structural: true, values: null, summary: 'Edit in MZ (command ' + item.code + ')' });
                index += length;
            }
            return rows;
        },
        rowAt(list, index) { return this.describe(list).find(row => index >= row.index && index < row.index + row.length) || null; },
        insert(list, index, idOrCode, values, indent) {
            const out = finalList(list), def = this.get(idOrCode);
            if (!def) return out;
            let at = Math.max(0, Math.min(out.length - 1, integer(index, out.length - 1, 0, out.length - 1)));
            const containing = this.rowAt(out, at);
            if (containing && containing.structural) return out;
            if (containing && at > containing.index) at = containing.index;
            out.splice(at, 0, ...def.write(values || {}, indent || 0));
            return finalList(out);
        },
        remove(list, index) {
            const out = finalList(list), row = this.rowAt(out, Number(index));
            if (row && row.editable) out.splice(row.index, row.length);
            return finalList(out);
        },
        replace(list, index, values) {
            const out = finalList(list), row = this.rowAt(out, Number(index)), def = row && this.get(row.code);
            if (!row || !def) return out;
            out.splice(row.index, row.length, ...def.write(values || {}, row.indent));
            return finalList(out);
        },
        move(list, index, direction) {
            const out = finalList(list), rows = this.describe(out), rowIndex = rows.findIndex(row => Number(index) >= row.index && Number(index) < row.index + row.length);
            const otherIndex = rowIndex + (Number(direction) < 0 ? -1 : 1);
            if (rowIndex < 0 || otherIndex < 0 || otherIndex >= rows.length) return out;
            if (!rows[rowIndex].editable || !rows[otherIndex].editable || rows[rowIndex].indent !== rows[otherIndex].indent) return out;
            const groups = rows.map(row => out.slice(row.index, row.index + row.length));
            const swap = groups[rowIndex]; groups[rowIndex] = groups[otherIndex]; groups[otherIndex] = swap;
            return finalList([].concat(...groups));
        },
        blankPage() {
            return { conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: 'A', selfSwitchValid: false,
                    switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
                directionFix: false, image: { characterIndex: 0, characterName: '', direction: 2, pattern: 1, tileId: 0 },
                list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true };
        },
        clone
    };
})();
