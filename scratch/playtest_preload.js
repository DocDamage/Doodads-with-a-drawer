/* global nw */
'use strict';
// Loaded first in the temporary playtest project so startup failures are not lost.
(function() {
    function describe(value) { return String(value && value.stack || value); }
    function install(env) {
        if (env.__docsPlaytestPreloadInstalled) return env.__docsPlaytestErrors;
        env.__docsPlaytestPreloadInstalled = true;
        const errors = env.__docsPlaytestErrors = Array.isArray(env.__docsPlaytestErrors) ? env.__docsPlaytestErrors : [];
        const record = value => errors.push(describe(value));
        const original = env.console && env.console.error;
        if (env.console) env.console.error = function() {
            record(Array.from(arguments).map(describe).join(' '));
            if (original) original.apply(env.console, arguments);
        };
        if (env.addEventListener) {
            env.addEventListener('error', event => record(event.error || event.message || 'Unknown startup error'));
            env.addEventListener('unhandledrejection', event => record(event.reason || 'Unhandled startup rejection'));
        }
        return errors;
    }
    if (typeof module !== 'undefined' && typeof nw === 'undefined') module.exports = { install };
    if (typeof window !== 'undefined' && typeof nw !== 'undefined') install(window);
})();
