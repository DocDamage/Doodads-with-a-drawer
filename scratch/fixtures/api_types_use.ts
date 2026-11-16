/// <reference path="../../types/Docs-Doodads.d.ts" />
// Used by scratch/test_types.js: TypeScript's compiler must accept every right call here and catch each wrong one
// (marked @ts-expect-error; an error that doesn't happen fails too).

const api = DocsDoodads.api;
const v: number = api.version;

// Finding doodads.
const all: DocsDoodad[] = api.doodads();
const rocks = api.find({ name: 'Rock', near: { x: 3, y: 4, radius: 2 }, where: d => d.opacity > 0.5 }, 2);
const one = api.get('Rock');
if (one) {
    const px: number = one.x + one.frameW;
    const named: string | undefined = one.name;
    void px; void named;
}
const tile = api.tileOf(rocks[0]);
if (tile) { const tx: number = tile.x; void tx; }
const ts = api.tileSize();
const w: number = ts.w;

// Changing them.
const placed = api.place({ art: 'img/doodads/Rock.png', x: 3, y: 4, transition: 'fade', frames: 20, light: { radius: 3 } });
if (placed) api.set(placed, { opacity: 0.5, art: 'img/doodads/Rock2.png' });
const moved: number = api.move('Rock', 1, 0, { relative: true });
api.remove('Rock', { transition: 'pop' });
api.remove('Rock', 3, { transition: 'crumble', frames: 10 });
api.refresh();

// States, lights, touch.
const state: string = api.state('Door');
api.setState('Door', 'next');
api.setState('Door', null);
const lit: boolean | null = api.light('Lamp');
api.setLight('Lamp', null);
api.touch('Chest');
api.resetTouch('Chest', 1);
api.playAnimation('Chest', { from: 0, to: 3 });
const names: string[] = api.stateNames('Door');

// Events.
const unlisten: () => void = api.on('touch', e => { const sum: number = e.x + e.y + e.doodad.x + e.mapId; void sum; });
api.on('state', e => e.state.toUpperCase());
api.on('light', e => { const on: boolean | null = e.on; void on; });
api.on('animationEnd', e => e.name.length);
api.on('takeOff', e => e.mapId);
unlisten();

// World.
api.setWind('world');
api.setWind(0.5, 60, 'left');
api.flashlight(null);
api.traversal('fly', true);
api.traversalAction('land');
api.playVfx('heal', 'player');
api.playVfx('explosion', { x: 2, y: 2 });
api.reveal('around', { radius: 4 });
const seen: number = api.explored();
api.feature('motionBlur', false);
api.freeCamera();
api.zoomTo({ x: 5, y: 5 }, 2, 30);
const day: number = api.day();
api.setDay(day + 1);
const schedulesOn: boolean = api.schedules(false);
const time: number | null = api.time();
api.setTime(18, 30);
api.addTime(1);
api.setSeason('Winter');
const season: string = api.seasonName();
api.ambient(0.6, '#102040', 120);
api.ambient(null);

void v; void all; void w; void moved; void state; void lit; void names; void seen; void schedulesOn; void time; void season;

// ---- Each of these is wrong and must be caught ----
// @ts-expect-error: no such event
api.on('explode', () => {});
// @ts-expect-error: a touch's detail has no "state"
api.on('touch', e => e.state);
// @ts-expect-error: no such ability
api.traversal('teleport', true);
// @ts-expect-error: place needs art
api.place({ x: 1, y: 1 });
// @ts-expect-error: no such transition
api.remove('Rock', { transition: 'explode' });
// @ts-expect-error: x must be a number
api.move('Rock', '1', 0);
// @ts-expect-error: time can be null
const sure: number = api.time();
// @ts-expect-error: no such call
api.teleport();
void sure;
