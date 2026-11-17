//==========================================================
// SECTION 5A3: GAMEPLAY LIGHT LEVELS AND EVENT SIGHT
//==========================================================
DocsDoodads.Sight = {
    defaults: { range: 6, spread: 90, minLevel: 0.3, selfSwitch: 'A', commonEvent: 0 },

    facing(direction) {
        return ({ 2: 90, 4: 180, 6: 0, 8: 270 })[Number(direction)] !== undefined
            ? ({ 2: 90, 4: 180, 6: 0, 8: 270 })[Number(direction)] : Number(direction) || 0;
    },

    parse(text) {
        text = String(text || '');
        const cone = /<\s*docs\s+sight\s*:\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*>/i.exec(text);
        if (!cone) return null;
        const level = /<\s*docs\s+sight\s+light\s*:\s*(\d*\.?\d+)\s*>/i.exec(text);
        const self = /<\s*docs\s+sight\s+self\s+switch\s*:\s*([a-d])\s*>/i.exec(text);
        const common = /<\s*docs\s+sight\s+common\s+event\s*:\s*(\d+)\s*>/i.exec(text);
        return {
            range: Math.max(0.25, Math.min(100, Number(cone[1]) || this.defaults.range)),
            spread: Math.max(1, Math.min(360, Number(cone[2]) || this.defaults.spread)),
            minLevel: Math.max(0, Math.min(1, level ? Number(level[1]) : this.defaults.minLevel)),
            selfSwitch: common ? '' : (self ? self[1].toUpperCase() : this.defaults.selfSwitch),
            commonEvent: common ? Math.max(0, Math.floor(Number(common[1]) || 0)) : 0
        };
    },

    strip(text) {
        return String(text || '').replace(/<\s*docs\s+sight(?:\s+(?:light|self\s+switch|common\s+event))?\s*:[^>]*>\s*/gi, '')
            .replace(/\n{3,}/g, '\n\n').trim();
    },

    lines(info) {
        if (!info) return [];
        const range = Math.max(0.25, Math.min(100, Number(info.range) || this.defaults.range));
        const spread = Math.max(1, Math.min(360, Number(info.spread) || this.defaults.spread));
        const minLevel = Math.max(0, Math.min(1, Number(info.minLevel)));
        const lines = [`<docs sight: ${range}, ${spread}>`, `<docs sight light: ${Math.round(minLevel * 1000) / 1000}>`];
        if (Number(info.commonEvent) > 0) lines.push(`<docs sight common event: ${Math.floor(Number(info.commonEvent))}>`);
        else lines.push(`<docs sight self switch: ${/^[A-D]$/i.test(info.selfSwitch) ? String(info.selfSwitch).toUpperCase() : 'A'}>`);
        return lines;
    },

    write(text, info) {
        const kept = this.strip(text), lines = this.lines(info);
        return [kept, lines.join('\n')].filter(Boolean).join(kept ? '\n' : '');
    },

    pageText(event, pageIndex) {
        const page = event && event.pages && event.pages[pageIndex];
        return ((page && page.list) || []).filter(command => command && (command.code === 108 || command.code === 408))
            .map(command => String((command.parameters || [])[0] || '')).join('\n');
    },

    scope(event, pageIndex) {
        const page = this.pageText(event, pageIndex);
        return this.parse(page) ? { kind: 'page', pageIndex, text: page } : { kind: 'note', pageIndex, text: String(event && event.note || '') };
    },

    writePage(event, pageIndex, info) {
        const page = event && event.pages && event.pages[pageIndex];
        if (!page) return false;
        const list = [], tag = /<\s*docs\s+sight/i;
        for (const command of page.list || []) {
            if (!command || (command.code !== 108 && command.code !== 408)) { list.push(command); continue; }
            const text = String((command.parameters || [])[0] || '');
            const kept = tag.test(text) ? this.strip(text) : text;
            if (kept) list.push(Object.assign({}, command, { parameters: [kept] }));
        }
        let comment = false;
        for (const command of list) {
            if (command && (command.code === 108 || command.code === 408)) { command.code = comment ? 408 : 108; comment = true; }
            else comment = false;
        }
        const at = list.length && list[list.length - 1] && list[list.length - 1].code === 0 ? list.length - 1 : list.length;
        const added = this.lines(info).map((line, index) => ({ code: index ? 408 : 108, indent: 0, parameters: [line] }));
        list.splice(at, 0, ...added); page.list = list;
        return true;
    },

    // Points are tile centres. Darkness shortens full sight to one quarter at minimum; a wall always blocks.
    sees(from, facing, target, options = {}) {
        const dx = (Number(target && target.x) || 0) - (Number(from && from.x) || 0);
        const dy = (Number(target && target.y) || 0) - (Number(from && from.y) || 0);
        const distance = Math.hypot(dx, dy), range = Math.max(0, Number(options.range) || 0);
        const minimum = Math.max(0, Math.min(1, Number(options.minLevel) || 0));
        const level = Math.max(0, Math.min(1, Number(options.level) || 0));
        const lightFactor = minimum > 0 ? Math.max(0.25, Math.min(1, level / minimum)) : 1;
        if (distance > range * lightFactor + 1e-9) return false;
        if (distance <= 1e-9) return true;
        const spread = Math.max(1, Math.min(360, Number(options.spread) || 360));
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const difference = Math.abs(((angle - this.facing(facing) + 540) % 360) - 180);
        if (difference > spread / 2 + 1e-9) return false;
        if (typeof options.isWall === 'function') {
            const visible = DocsDoodads.Occlusion.cast(Number(from.x) || 0, Number(from.y) || 0, dx / distance, dy / distance,
                distance, options.isWall, 1, 1, Math.floor(Number(from.x) || 0), Math.floor(Number(from.y) || 0));
            if (visible < distance - 1e-6) return false;
        }
        return true;
    }
};
