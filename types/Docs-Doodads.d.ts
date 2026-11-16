// Docs-Doodads.d.ts: types for DocsDoodads.api, the way other plugins and scripts find, place, move and change
// doodads, their states and lights, and the clock, season and ambient light.
// Written by npm run types from src/07_public_api.js; don't edit it by hand.
//
// To use it, put this file beside your plugin and add at the top of your .js file:
//     /// <reference path="Docs-Doodads.d.ts" />
// or list it under "include" (or "files") in your jsconfig.json or tsconfig.json.

/** What a query matches: a doodad's name (any case), the doodad itself, or a description. */
type DocsDoodadQuery = string | DocsDoodad | DocsDoodadFind;

/** A description of the doodads to find; every field given must match. */
interface DocsDoodadFind {
    /** The doodad's Name, any case. */
    name?: string;
    uid?: string;
    /** Part of its art's path, any case. */
    art?: string;
    /** The tile its base is on is within radius tiles of (x, y); radius 0 is that tile. */
    near?: { x: number; y: number; radius?: number };
    mapId?: number;
    where?(d: DocsDoodad): boolean;
}

/** How a doodad comes in or goes. */
type DocsDoodadTransition = 'none' | 'fade' | 'pop' | 'rise' | 'dissolve' | 'crumble';

/** What api.place takes: the art and where, and any doodad field (light, states, touch, collision, scaleX...). */
interface DocsDoodadPlaceSpec {
    /** The picture, e.g. 'img/doodads/Rock.png'. */
    art: string;
    /** In tiles, or pixels when tiles is false. */
    x?: number;
    y?: number;
    /** true (the default): x and y are tiles. */
    tiles?: boolean;
    name?: string;
    /** It appears this way. */
    transition?: DocsDoodadTransition;
    /** How long the transition takes (30). */
    frames?: number;
    /** The map to place it on (the player's when not given). */
    mapId?: number;
    frameW?: number;
    frameH?: number;
    [field: string]: unknown;
}

/** How api.remove takes doodads away. */
interface DocsDoodadRemoveOptions {
    /** They go this way first. */
    transition?: DocsDoodadTransition;
    /** How long the transition takes (30). */
    frames?: number;
}

/** A map character: the player, an event or a follower (MZ's Game_Character). */
interface DocsCharacter {
    x: number;
    y: number;
    screenX(): number;
    screenY(): number;
    eventId?(): number;
}

/** A traversal ability. */
type DocsTraversalAbility = 'jump' | 'glide' | 'swim' | 'dive' | 'fly' | 'climb' | 'ice';

/** The events api.on listens for, and what each listener is given. */
interface DocsDoodadsEvents {
    /** The player settled inside a named map region. */
    areaEnter: { mapId: number; region: number; name: string };
    /** The player entered a doodad's range. */
    near: { doodad: DocsDoodad; name: string; mapId: number };
    /** The player left a doodad's range. */
    far: { doodad: DocsDoodad; name: string; mapId: number };
    /** The player touched a doodad; x and y are the tile its base is on. */
    touch: { doodad: DocsDoodad; mapId: number; x: number; y: number };
    /** A named doodad's state changed. */
    state: { name: string; state: string; mapId: number };
    /** A named doodad's light went on or off. */
    light: { name: string; on: boolean | null; mapId: number };
    /** A doodad's picture strip, played with playAnimation, finished. */
    animationEnd: { doodad: DocsDoodad; name: string; mapId: number };
    /** The player took off (Traversal). */
    takeOff: { mapId: number };
    /** The player landed (Traversal). */
    land: { mapId: number };
    /** The player dived (Traversal). */
    dive: { mapId: number };
}

/**
 * A doodad on a map, as in $dataDocsDoodads[mapId]. Fields are in pixels; x and y are its anchor (the middle of
 * its base by default). Change them through api.set and api.move so the map keeps up.
 */
interface DocsDoodad {
    bit: Array<number | string>;
    index: number;
    anchorX: number;
    anchorY: number;
    posMode: number;
    x: number;
    y: number;
    z: number;
    depth: string;
    sortOffsetY: number;
    scaleX: number;
    scaleY: number;
    blend: number;
    opacity: number;
    rotation: number;
    rotateSpeed: number;
    r: number;
    g: number;
    b: number;
    grey: number;
    xFrame: number;
    yFrame: number;
    frameUpdate: number;
    frameX: number;
    frameY: number;
    frameW: number;
    frameH: number;
    switch: unknown[];
    condition: string;
    blur: number;
    contrast: number;
    sepia: boolean;
    hue: number;
    bright: boolean;
    collision: {
        preset: string;
        shape: unknown;
    };
    /** Its Name, used by states, lights and find. */
    name?: string;
    /** Its id, kept through saves. */
    uid?: string;
    /** Its light. */
    light?: Record<string, unknown>;
    /** Its states (the pictures and settings it can change between). */
    states?: Array<Record<string, unknown>>;
    /** What happens when the player touches it. */
    touch?: Record<string, unknown>;
    /** Placed by api.place: it lasts for this run of the game only. */
    temp?: boolean;
    transition?: { type: string; frames: number };
    [field: string]: unknown;
}

/** DocsDoodads.api. Everything works on the map the player is on unless a mapId is given. */
interface DocsDoodadsApi {
    /**
     * The API's version; it goes up when a call changes in a way that breaks scripts.
     */
    readonly version: number;

    /**
     * Returns the player's Reduce Flashes and Less Camera Motion choices.
     */
    comfort(): {reduceFlashes: boolean, lessCameraMotion: boolean};

    /**
     * The shared BGM spectrum bands (0-1) and whether this frame starts a kick. Silent without audio.
     */
    beat(): {low: number, mid: number, high: number, kick: boolean};

    /**
     * The name of the area under the player, or an empty string.
     */
    area(): string;

    /**
     * Listens for one of the plugin's events. Returns a function that stops listening.
     * @param event 'touch', 'state', 'light', 'animationEnd', 'takeOff', 'land' or 'dive'.
     * @param fn Called with the event's detail.
     */
    on<K extends keyof DocsDoodadsEvents>(event: K, fn: (detail: DocsDoodadsEvents[K]) => void): () => void;

    /**
     * Stops a listener added with on().
     */
    off<K extends keyof DocsDoodadsEvents>(event: K, fn: (detail: DocsDoodadsEvents[K]) => void): void;

    /**
     * Tells every listener of an event (the plugin calls this; a listener that throws is logged and skipped).
     * @internal Used by the plugin itself.
     */
    emit<K extends keyof DocsDoodadsEvents>(event: K, detail: DocsDoodadsEvents[K]): void;

    /**
     * The map id the API works on: the one given, or the map the player is on.
     */
    mapId(mapId?: number): number;

    /**
     * The map's tile size in pixels (48 by 48 when no map is loaded).
     */
    tileSize(): { w: number, h: number };

    /**
     * The doodads on a map (the live list; change them through the calls below so the map keeps up).
     */
    doodads(mapId?: number): DocsDoodad[];

    /**
     * The doodads that match a query: a name (any case), a doodad, or { name, uid, art, near, mapId, where }.
     */
    find(query: DocsDoodadQuery, mapId?: number): DocsDoodad[];

    /**
     * The first doodad that matches a query, or null.
     */
    get(query: DocsDoodadQuery, mapId?: number): DocsDoodad | null;

    /**
     * Where a doodad stands, in tiles: the tile its base is on, or null when none matches.
     */
    tileOf(query: DocsDoodadQuery): { x: number, y: number } | null;

    /**
     * The map's spriteset when doodads are drawn on it, or null.
     * @internal Used by the plugin itself.
     */
    spriteset(): object | null;

    /**
     * Rebuilds the doodad sprites (after changing art or many fields at once).
     */
    refresh(): void;

    /**
     * Places a doodad for this run of the game (never written to the project or the save). Returns the doodad, or null without art.
     * @param spec { art, x, y, tiles, name, transition, frames, mapId } and any doodad field.
     */
    place(spec: DocsDoodadPlaceSpec): DocsDoodad | null;

    /**
     * Sets a doodad's frame size: as given, then from the library, then from the picture once it loads.
     * @internal Used by the plugin itself.
     */
    sizeFor(d: DocsDoodad, art: string, frameW?: number, frameH?: number): void;

    /**
     * Moves doodads to (x, y): tiles unless opts.tiles is false; opts.relative moves them by that much. Returns how many moved.
     */
    move(query: DocsDoodadQuery, x: number, y: number, opts?: { tiles?: boolean, relative?: boolean }): number;

    /**
     * Changes fields on doodads ({ opacity: 0.5, light: {...} }); a new art redraws them, at its own size unless frameW and frameH come with it. Returns how many changed.
     */
    set(query: DocsDoodadQuery, props: Partial<DocsDoodad> & { art?: string }): number;

    /**
     * Takes doodads off the map, through a transition if opts has one. Only their sprites go; the rest of the map is not built again. Returns how many.
     * @param mapId A map id, or the options in its place.
     */
    remove(query: DocsDoodadQuery, mapId?: number | DocsDoodadRemoveOptions, opts?: DocsDoodadRemoveOptions): number;

    /**
     * Out of the map's list and off the map at once, with collision told.
     * @internal Used by the plugin itself.
     */
    takeOut(list: DocsDoodad[], mapId?: number): void;

    /**
     * A named doodad's state ('' when it has none set). Kept in the save file.
     */
    state(name: string | DocsDoodad, mapId?: number): string;

    /**
     * Sets a named doodad's state: a state's name or number, 'next', or '' (or null) for its first. Returns whether it changed.
     */
    setState(name: string | DocsDoodad, state: string | number | null, mapId?: number): boolean;

    /**
     * The names of a doodad's states, in order.
     */
    stateNames(query: DocsDoodadQuery): string[];

    /**
     * Whether a named doodad's light is on (null when there's no such doodad and nothing saved). Kept in the save file.
     */
    light(name: string | DocsDoodad, mapId?: number): boolean | null;

    /**
     * Turns a named doodad's light on or off, or back to its own setting (null). Returns false for a doodad with no Name.
     */
    setLight(name: string | DocsDoodad, on: boolean | null, mapId?: number): boolean;

    /**
     * A doodad acts as if the player touched it (its next state, its common event); once-only and cooldowns apply. Returns whether anything ran.
     */
    touch(query: DocsDoodadQuery, mapId?: number): boolean;

    /**
     * Lets once-only doodads run again. Returns how many.
     */
    resetTouch(query: DocsDoodadQuery, mapId?: number): number;

    /**
     * Plays the doodads' picture strips once; 'animationEnd' says when each is done. Returns how many.
     */
    playAnimation(query: DocsDoodadQuery, opts?: { from?: number, to?: number, hold?: boolean }, mapId?: number): number;

    /**
     * Sets the wind: strength 0-1 (or 'world' for World > Weather's own) over frames, blowing 'left', 'right' or the 'same' way.
     */
    setWind(strength: number | 'world', frames?: number, direction?: 'left' | 'right' | 'same'): object | null;

    /**
     * The flashlight on (true), off (false) or as World > Lighting sets it (null). Returns false before a game is loaded.
     */
    flashlight(on: boolean | null): boolean;

    /**
     * An ability (jump, glide, swim, dive, fly, climb, ice) on (true), off (false) or as set (null).
     */
    traversal(ability: DocsTraversalAbility, on: boolean | null): boolean;

    /**
     * The player jumps, takes off, lands or dives, as if they pressed the key. Returns whether they did.
     */
    traversalAction(action: 'jump' | 'takeOff' | 'land' | 'dive'): boolean;

    /**
     * Plays an effect from the Effects Maker (or a built-in) at a tile, or on a character or 'player' (it follows them). Returns the playing effect, or null.
     */
    playVfx(id: string, at?: { x: number, y: number } | DocsCharacter | 'player'): object | null;

    /**
     * The explored map: 'all', 'around' (opts.radius), 'region' (opts.region), 'store' (opts.variableId) or 'forget'.
     */
    reveal(action?: 'all' | 'around' | 'region' | 'store' | 'forget', opts?: { radius?: number, region?: number, variableId?: number, mapId?: number }): boolean;

    /**
     * How much of a map has been seen, 0-1.
     */
    explored(mapId?: number): number;

    /**
     * An atmosphere effect on or off for this playthrough (characterShadows, motionBlur, reflections, seeThrough, postfx).
     */
    feature(name: string, on: boolean): boolean;

    /**
     * The flat map's camera stays where it is put (Scroll Map, setDisplayPos) until followCamera().
     */
    freeCamera(): boolean;

    /**
     * The flat map's camera follows a character again (the player when none is given).
     */
    followCamera(character?: DocsCharacter): boolean;

    /**
     * Zooms the flat map in on a tile ({ x, y }), a character or 'player' over frames; scale 1 goes back.
     */
    zoomTo(target: { x: number, y: number } | DocsCharacter | 'player', scale?: number, frames?: number): boolean;

    /**
     * Today's number, 1 on the first day of a new game; 0 when the clock doesn't run.
     */
    day(): number;

    /**
     * The weekday: 0 for the first of World > Day and Night's list.
     */
    weekday(): number;

    /**
     * The weekday's name for a day (today when none is given).
     */
    weekdayName(day?: number): string;

    /**
     * The named date for a day (today when none is given), or ''.
     */
    dateName(day?: number): string;

    /**
     * Goes to a day (1 or more), keeping the time of day. Returns false when the clock doesn't run.
     */
    setDay(day: number): boolean;

    /**
     * Turns scheduled event movement on or off for a cutscene. This pause is not kept in the save.
     */
    schedules(on?: boolean): boolean;

    /**
     * The time of day in minutes (0-1439), or null when the clock is off.
     */
    time(): number | null;

    /**
     * Sets the clock; day (optional) sets its day too.
     */
    setTime(hour: number, minute?: number, day?: number | null): void;

    /**
     * Moves the clock on.
     */
    addTime(hours: number, minutes?: number): void;

    /**
     * The season's number (0 for the first).
     */
    season(): number;

    /**
     * The season's name from World > Seasons.
     */
    seasonName(): string;

    /**
     * Sets the season by number or name. Returns false for a name that isn't one.
     */
    setSeason(season: number | string): boolean;

    /**
     * Ambient light: darkness 0-1 and a colour '#rrggbb' over frames; ambient(null) goes back to the map's own.
     */
    ambient(darkness: number | null, color?: string, frames?: number): object | null;
}

/** Doc's Doodads. Only api is kept stable for other plugins; the rest is the plugin's own and may change. */
declare const DocsDoodads: {
    readonly api: DocsDoodadsApi;
    [part: string]: unknown;
};
