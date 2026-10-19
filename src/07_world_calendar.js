//==========================================================
// SECTION 5C2: THE CALENDAR AND THE CLOCK OUTSIDE THE MAP
//==========================================================
// The running clock counts days (clock.day, 0 on a new game). Here they become a calendar: day 1, 2, 3...,
// a weekday from World > Day and Night's names, and named dates ("Harvest Festival" on day 30, or every 28
// days), with variables for events. The clock can also run in battles and menus, and a battle can take
// some minutes. Set Time's Day, the Calendar command and DocsDoodads.api.day() and friends use it.
DocsDoodads.Calendar = {
    settings() {
        return DocsDoodads.World.settings().time;
    },

    // Today's number, 1 on the first day of a new game; 0 when the clock doesn't run.
    day() {
        const clock = DocsDoodads.Atmosphere.clock();
        return clock ? (Number(clock.day) || 0) + 1 : 0;
    },

    weekdayNames() {
        const names = (this.settings().weekdays || []).map(n => String(n || '').trim()).filter(Boolean);
        return names.length ? names : DocsDoodads.World.defaults.time.weekdays.slice();
    },

    // 0 for the first weekday of the list (day 1), and on round the week.
    weekday(day = this.day()) {
        const n = this.weekdayNames().length;
        return day > 0 ? (day - 1) % n : 0;
    },

    weekdayName(day = this.day()) {
        return day > 0 ? this.weekdayNames()[this.weekday(day)] : '';
    },

    // The named date for a day: { day, name, every } entries, every > 0 repeating (day, day + every...).
    dateName(day = this.day()) {
        for (const e of this.settings().dates || []) {
            const start = Math.floor(Number(e && e.day) || 0), every = Math.floor(Number(e && e.every) || 0);
            if (!e || !e.name || start < 1 || day < start) continue;
            if (day === start || (every > 0 && (day - start) % every === 0)) return String(e.name);
        }
        return '';
    },

    // Goes to a day (1 or more), keeping the time of day.
    setDay(day) {
        const clock = DocsDoodads.Atmosphere.clock(true);
        if (!clock) return false;
        clock.day = Math.max(0, Math.floor(Number(day) || 1) - 1);
        this.syncVariables();
        return true;
    },

    addDays(n) {
        return this.setDay(this.day() + Math.floor(Number(n) || 0));
    },

    // The day and weekday variables (1-based) follow the clock.
    syncVariables() {
        const vars = typeof $gameVariables !== 'undefined' ? $gameVariables : null;
        const s = this.settings();
        if (!vars || s.source !== 'clock') return;
        const day = this.day();
        if (Number(s.dayVariableId) > 0 && vars.value(Number(s.dayVariableId)) !== day) vars.setValue(Number(s.dayVariableId), day);
        const weekday = day > 0 ? this.weekday(day) + 1 : 0;
        if (Number(s.weekdayVariableId) > 0 && vars.value(Number(s.weekdayVariableId)) !== weekday) vars.setValue(Number(s.weekdayVariableId), weekday);
    },

    // One frame of the clock away from the map (a battle or a menu), when World > Day and Night lets it run there.
    tickOffMap(where) {
        const s = this.settings();
        if (s.source !== 'clock' || !(where === 'battle' ? s.inBattle : s.inMenus)) return false;
        DocsDoodads.Atmosphere.update(true);
        return true;
    },

    // A battle took some minutes (World > Day and Night > Minutes a battle takes).
    afterBattle() {
        const minutes = Math.max(0, Number(this.settings().afterBattle) || 0);
        if (minutes > 0 && this.settings().source === 'clock') DocsDoodads.addTimeOfDay(minutes);
        return minutes;
    }
};

// The day and weekday variables move with the clock (Atmosphere.update runs the clock).
$.Atmosphere_update_calendar = DocsDoodads.Atmosphere.update;
DocsDoodads.Atmosphere.update = function(sceneActive) {
    $.Atmosphere_update_calendar.call(this, sceneActive);
    DocsDoodads.Calendar.syncVariables();
};

if (typeof Scene_Battle !== 'undefined') {
    $.Scene_Battle_update_clock = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        $.Scene_Battle_update_clock.call(this);
        if (this.isActive && this.isActive()) DocsDoodads.Calendar.tickOffMap('battle');
    };
}
if (typeof Scene_MenuBase !== 'undefined') {
    $.Scene_MenuBase_update_clock = Scene_MenuBase.prototype.update;
    Scene_MenuBase.prototype.update = function() {
        $.Scene_MenuBase_update_clock.call(this);
        if (this.isActive && this.isActive()) DocsDoodads.Calendar.tickOffMap('menu');
    };
}
if (typeof BattleManager !== 'undefined' && typeof BattleManager.endBattle === 'function') {
    $.BattleManager_endBattle_clock = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        $.BattleManager_endBattle_clock.call(this, result);
        DocsDoodads.Calendar.afterBattle();
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    // Calendar: go to a day, move some days on, or put the day, weekday or date into a variable.
    PluginManager.registerCommand(pluginName, 'calendar', args => {
        const C = DocsDoodads.Calendar, action = String(args.action || 'storeDay');
        const value = Number(args.value) || 0, id = Number(args.variableId) || 0;
        if (action === 'setDay') C.setDay(value);
        else if (action === 'addDays') C.addDays(value);
        else if (id > 0 && typeof $gameVariables !== 'undefined' && $gameVariables) {
            if (action === 'storeDay') $gameVariables.setValue(id, C.day());
            else if (action === 'storeWeekday') $gameVariables.setValue(id, C.day() > 0 ? C.weekday() + 1 : 0);
            else if (action === 'storeDate') $gameVariables.setValue(id, C.dateName());
        }
    });
}
