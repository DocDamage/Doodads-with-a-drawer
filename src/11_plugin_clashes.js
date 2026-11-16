// @editor-only
DocsDoodads.Clash = {
    table: DocsDoodads.PluginClashTable || [],
    hooks: [], messages: [],
    enabledPlugins(plugins) { return (Array.isArray(plugins) ? plugins : []).filter(p => p && p.status !== false && p.enabled !== false).map(p => ({ name: String(p.name || '') })); },
    check(plugins, table) {
        const active = this.enabledPlugins(plugins), out = [];
        for (const row of table || this.table) {
            const index = active.findIndex(plugin => plugin.name.toLowerCase() === String(row.match).toLowerCase());
            if (index < 0 || row.level === 'works') continue;
            const other = active.findIndex(plugin => plugin.name.toLowerCase() === String(row.before || row.after || '').toLowerCase());
            if (row.level === 'order' && (other < 0 || row.before && index < other || row.after && index > other)) continue;
            const direction = row.before ? ' before ' + row.before : row.after ? ' after ' + row.after : '';
            out.push({ kind: 'plugins', global: true, level: row.level, text: active[index].name + (row.level === 'order' ? ': move' + direction + '. ' : ': ') + row.note });
        }
        return out;
    },
    // Observe ordinary engine calls rather than executing a gameplay method as a diagnostic probe.
    // A later alias that delegates to us increments calls; a replacement which skips us does not.
    watch(object, key, label) {
        if (!object || typeof object[key] !== 'function') return null;
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        if (descriptor && (descriptor.configurable === false || descriptor.writable === false || descriptor.get || descriptor.set)) return null;
        const original = object[key], state = { label, calls: 0, replaced: false, observed: false };
        const own = function(...args) { state.calls++; return original.apply(this, args); };
        let current = own;
        Object.defineProperty(object, key, { configurable: true, enumerable: descriptor ? descriptor.enumerable : true,
            get() { return current; },
            set(next) {
                if (typeof next !== 'function') { current = next; state.replaced = true; state.observed = true; return; }
                if (next === current) return;
                current = function(...args) {
                    const before = state.calls;
                    try { return next.apply(this, args); }
                    finally { state.observed = true; state.replaced = state.calls === before; }
                };
            }
        });
        this.hooks.push(state);
        return state;
    },
    hookFindings(plugins) {
        const active = this.enabledPlugins(plugins), own = active.findIndex(p => p.name === pluginName);
        const later = own < 0 ? [] : active.slice(own + 1).map(p => p.name);
        return this.hooks.filter(hook => hook.observed && hook.replaced).map(hook => ({ kind: 'plugins', global: true, level: 'clash', hook: hook.label,
            text: hook.label + ' ran without the Docs-Doodads hook. Plugins loaded later: ' + (later.join(', ') || '(none listed)') + '. Check these plugins and their order; the replacing plugin is not identified.' }));
    },
    record(level, args) {
        const values = Array.from(args || []).map(value => {
            if (value instanceof Error) return value.stack || value.message;
            if (typeof value === 'string') return value;
            try { return JSON.stringify(value); } catch (error) { return String(value); }
        });
        this.messages.push({ level, text: values.join(' ').slice(0, 8000) });
        if (this.messages.length > 200) this.messages.splice(0, this.messages.length - 200);
    },
    clean(value, projectRoot) {
        let text = String(value === undefined ? '' : value).replace(/\\/g, '/');
        const root = String(projectRoot || '').replace(/\\/g, '/').replace(/\/$/, '');
        if (root) text = text.replace(new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=/|$)', 'gi'), '.');
        text = text.replace(/file:\/\//gi, '');
        text = text.replace(/(^|[\s("'=])\/\/[^\r\n"'<>]*/g, '$1[outside project]');
        text = text.replace(/[a-zA-Z]:\/[^\r\n"'<>]*/g, '[outside project]');
        text = text.replace(/(^|[\s("'=])\/(?!\/)[^\s"'<>]*/g, '$1[outside project]');
        return text.replace(/((?:password|secret|token|api[_ -]?key|authorization)["']?\s*[:=]\s*)[^\r\n,}]+/gi, '$1[redacted]');
    },
    report(input) {
        const clean = value => this.clean(value, input.projectRoot);
        const params = {};
        for (const key of Object.keys(input.parameters || {}).sort()) params[key] = /password|secret|token|key|authorization/i.test(key) ? '[redacted]' : clean(input.parameters[key]);
        const report = { version: clean(input.version), system: input.system || {}, map: input.map || {},
            plugins: this.enabledPlugins(input.plugins).map((plugin, index) => ({ order: index + 1, name: clean(plugin.name) })),
            parameters: params, problems: (input.problems || []).map(problem => clean(problem.text)),
            messages: this.messages.slice(-200).map(message => ({ level: message.level, text: clean(message.text) })) };
        // System and map metadata are supplied through the fixed gatherer, and sanitized again for callers.
        const sanitize = value => Array.isArray(value) ? value.map(sanitize) : value && typeof value === 'object'
            ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)])) : typeof value === 'string' ? clean(value) : value;
        return 'Doc\'s Doodads local diagnostic report\n' + JSON.stringify(sanitize(report), null, 2) + '\n';
    }
};
