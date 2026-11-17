// @editor-only
if (DocsDoodads.Compat.isTest()) {
    const clash = DocsDoodads.Clash;
    if (typeof Game_Map !== 'undefined') clash.watch(Game_Map.prototype, 'update', 'Game_Map.update');
    if (typeof Spriteset_Map !== 'undefined') clash.watch(Spriteset_Map.prototype, 'update', 'Spriteset_Map.update');
    for (const level of ['warn', 'error']) {
        const previous = console[level];
        console[level] = function(...args) { clash.record(level, args); return previous.apply(console, args); };
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('error', event => clash.record('error', [event.error || event.message]));
        window.addEventListener('unhandledrejection', event => clash.record('error', [event.reason]));
    }
}
