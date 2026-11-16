# Backlog 9: How to Build Each Item

**Status:** written 15 November 2026. Progress is tracked in RECOMMENDATIONS.md. This is the working detail for
[section 9 of RECOMMENDATIONS.md](../RECOMMENDATIONS.md#9-backlog-for-players-the-map-as-gameplay-and-safer-releases-15-november-2026):
for each row, what to build, where in `src/`, what data it keeps, the steps in order, the tests, and when it is
done.

It is written the way [BACKLOG_7_PLAN.md](BACKLOG_7_PLAN.md) and [BACKLOG_8_PLAN.md](BACKLOG_8_PLAN.md) are.
**BACKLOG_7_PLAN's "Rules for every item" and "How things are added here", and BACKLOG_8_PLAN's "Rules added for
section 8", apply to every item here.** Read those first; they are not repeated.

File and function names were read from the source on the day above. Line numbers are left out because they move:
find a name with a search of `src/`. Names marked **(new)** do not exist yet. If a name here is not in the source
any more, search for the words around it and say so in the pull request rather than guessing. Where an item says
"not read", the code it would change was not opened while this was written; read it before trusting the steps.

Sizes as in `RECOMMENDATIONS.md`: **S** an afternoon, **M** a PR like terrain or water, **L** several PRs.

---

## Rules added for section 9

1. **Search again first.** Each row was found missing by searching `src/` and the two earlier plans for its words,
   not by reading every part. Before starting a row, search for it once more; if some of it is there, build on
   that and correct the row.
2. **Off until asked.** Every row a player would see is a setting for one map or for the game, off by default. A
   project that never turns it on draws and plays as before, and `node scratch/bench_frames.js` gives the same
   numbers before and after.
3. **The player's choice wins.** What a player picks in Options (9.1.1, 9.1.2) overrides what the maker set, and is
   kept in MZ's config through the `ConfigManager.makeData` and `applyData` hooks in
   `15_spriteset_map_doodad_layer_hooks.js`, not in the save.
4. **MZ's own files ask first.** 9.4.1 writes `data/Tilesets.json`, which MZ's editor also holds in memory. Go
   through the save path that writes map files (a backup first, and the check for a file changed since it was
   read), and say "Close and reopen the project in RPG Maker MZ" as 8.5.4 does for new maps.
5. **The self-running playtest works on a copy.** 9.5.1 never starts the game on the test project itself: a
   transfer autosaves into `save/`, and the editor writes `data/`. Copy the project to the temp folder first.

## A good order

1. 9.1.1 and 9.5.1 (comfort options are small and matter to anyone shipping; the playtest protects what follows).
2. 9.2.1, 9.1.5, 9.2.6, 9.1.2, 9.4.2, 9.4.3, 9.5.2, 9.5.3 (small; each stands alone).
3. 9.1.7, 9.1.4, 9.1.3, 9.1.6 (around the map; 9.1.4 and 9.1.6 show 9.1.5's names).
4. 9.3.3, 9.3.2, 9.3.1.
5. 9.2.2, 9.2.4, 9.2.5, 9.4.1.
6. 9.2.3 (it changes who can pass where; do it after, or together with, 7.3.2 and 7.3.3).

Rows these lean on: 9.1.1's helper is used by 9.2.2 and 9.3.3. 9.1.4 is easier once 8.3.6 has moved Capture's
drawing into a game part. 9.5.2's table of plugins is the list 7.4.5 publishes. 9.5.1 gives 9.1.1 and 9.1.2 their
"done when" measures, and item B its numbers. 9.2.6 feeds Moods (8.1.2) and Elements that spread (8.4.3). 9.5.3
covers the "old saves" worry that 8.4.1 notes for its own data.

---

# 9.1 For the player

## 9.1.1 Comfort options (S)

**Goal.** A player can turn down flashes and camera motion in Options.

**What is true today.** The plugin adds two rows to Options, Motion Blur and Effects Quality: the
`Window_Options.prototype.addGeneralOptions` hook and `ConfigManager.docsMotionBlur` and `docsFxQuality`
(`15_spriteset_map_doodad_layer_hooks.js`). Lightning flashes at up to 255 (`Lightning.strike`,
`07_map_layers_weather.js`). Play Screen Effect has shockwaves, flashes and Impact Zoom (`08_post_processing.js`,
sampled each frame by `P.Animations.sample`). The 2D camera looks ahead and eases (`Camera2D.defaults`,
`07_camera_2d.js`). The editor has its own Less motion (6.3.2), which the game does not share.

**Data.** `ConfigManager.docsReduceFlashes` and `ConfigManager.docsLessCameraMotion` **(new)**, both `false` in a
config that does not have them.

**Steps.**
1. `DocsDoodads.Comfort` **(new)**, pure, a game part: `flash(amount, opts)` returns the amount to show (capped,
   and eased in over a few frames instead of a snap); `motion(amount, opts)` scales a zoom, shake or sweep;
   `camera(settings, opts)` returns the 2D camera's settings with look-ahead off.
2. Send through it: `Lightning.strike`'s flash (the thunder is unchanged); Play Screen Effect's flash, shockwave
   and Impact Zoom; the camera's look-ahead. Leave light flicker alone: it is slow and small.
3. The two rows in Options, added in the same hook. A plugin parameter says when they show: always, or only when
   the project uses lightning or screen effects (as `fxQualityOffered` decides for Effects Quality).
4. A plugin parameter, "Also soften MZ's own flashes and shakes": with it on, `Game_Screen.prototype.startFlash`
   and `startShake` go through `Comfort` too, so the maker's own Flash Screen commands follow the player's choice.
5. `DocsDoodads.api.comfort()` returns both choices, for other plugins and scripts to follow.

**Tests.** `scratch/test_comfort.js`: a flash of 255 comes back under the cap; lightning with the option on keeps
its thunder time and volume; the config round-trips; a config without the keys reads as off; with both off, every
number is returned unchanged.

**Done when.** In a storm with Reduce Flashes on, no frame is much brighter than the one before it (measure with
9.5.1's captures, or by eye from the checklist), and with both options off nothing has changed.

**Watch out.** Say "Reduce", never "Remove" or "safe": the option lowers what this plugin draws, and with the
parameter MZ's own, but not what another plugin or a video does.

## 9.1.2 Quality that looks after itself (S)

**Goal.** A player who picks Auto gets the highest Effects Quality their computer holds steadily.

**What is true today.** Effects Quality is High, Medium, Low or Off (`DocsDoodads.fxQualityLabels`,
`ConfigManager.docsFxQuality`), joined with the maker's setting by `PostFX.effectiveQuality(world.postfx.quality,
option)`. The 3D view reads the same option (1.3). The editor's Show Speed counts frames (`startPerf`,
`37_workspace_core.js`), but it is editor-only (not read).

**Steps.**
1. `DocsDoodads.AutoQuality` **(new)**, pure: `step(state, frameMs)` keeps an eased frame time and returns `-1`
   (step down) after some seconds under the target, `+1` after a longer time well over it, else `0`. It ignores
   the first seconds on a map, a frame longer than a quarter of a second (the window lost focus, or a load), and
   never steps twice within a few seconds.
2. A fifth choice, Auto, in the Effects Quality row. The left and right handlers wrap at four today
   (`shiftQuality`); make them use the list's length. On Auto the option handed to `effectiveQuality` is
   `AutoQuality`'s level, kept for the session and started from the level it last settled at
   (`ConfigManager.docsFxAutoLevel` **(new)**).
3. Feed it the frame time from one spriteset step (`DocsDoodads.spritesetSteps`), with `performance.now()`.
4. Change the level at a transfer when one is near; otherwise fade the change over half a second so nothing pops.
5. A plugin parameter, "Start players on Auto", off by default so existing games keep their setting.

**Tests.** `scratch/test_auto_quality.js`: a slow run steps down once, not twice, inside the wait; a fast run steps
up only after the longer wait; long frames are ignored; a fixed choice is never changed; the level is kept.

**Done when.** On the 200 × 200 map with the CPU throttled four times, Auto settles in under ten seconds and does
not flip back and forth for a minute after.

**Watch out.** Throttling the CPU does not model a weak GPU (item B); try it on real slow hardware before making
Auto the default anywhere.

## 9.1.3 A title screen from a map (S)

**Goal.** The title screen shows a chosen map, live, behind the title menu.

**What is true today.** Nothing in `src/` names `Scene_Title`. MZ's `Scene_Boot` calls `DataManager.setupNewGame()`
before the title, so `$gameMap` and `$gamePlayer` exist there, but no map is loaded (`rmmz_scenes.js`; read the
title scene's `create`, `start` and `terminate` before starting).

**Data.** A game-wide setting in `DocsDoodads.World.defaults`: `title: { mapId, x, y, time, season, weather, look,
path }` **(new)**, `mapId: 0` meaning off.

**Steps.**
1. `DocsDoodads.TitleMap` **(new)**, pure: `settings()`, and `frame(settings, n)` giving the camera's place on
   frame `n` from `Camera2D.pathAt`, looping.
2. In `Scene_Title`: load the map's data (`DataManager.loadMapData`), wait for it in `isReady`, set up `$gameMap`
   with the player hidden, and add a `Spriteset_Map` under the title's windows. Each frame, update the map, the
   screen and the spriteset, hold the clock at `time`, and move the view along `path`.
3. A choice to hide MZ's title pictures, or to draw the map under them (for a logo with a clear background).
4. New Game already calls `setupNewGame()` again, which throws the title's map state away; check that nothing of
   it reaches the new game (the clock, wind, weather, explored tiles).
5. In the editor: Map menu → "Use This View as the Title Screen", taking the map, the place, the preview clock and
   the look in use.

**Tests.** `scratch/test_title_map.js` on the stand-in engine: with `mapId: 0` the title is untouched; with a map,
a spriteset is made and updated; after New Game the player's place, the switches and the clock equal those of a
New Game with the setting off; the game build runs it.

**Watch out.** Other title plugins replace the same scene: make the map only when the setting is on, and keep to
`create`, `update` and `terminate`. Start with flat maps; a 3D title can follow. The title now waits for a map to
load, so keep the first picture up until it has.

## 9.1.4 Pictures on save files (S)

**Goal.** Each save shows a small picture of where the player was, the place's name and the game's day and time.

**What is true today.** The plugin already adds to `DataManager.makeSavefileInfo`
(`16_visual_equipment_map_destination_runtime.js`, for the party's gear). MZ takes a picture of the map as it
leaves it (`SceneManager.snapForBackground` in `Scene_Map.prototype.terminate`) and blurs the sprite, not the
picture (`Scene_MenuBase.prototype.createBackground`). The list is drawn by
`Window_SavefileList.prototype.drawContents(info, rect)`.

**Data.** In each save's info: `docsShot` (a small JPEG as a data URL), `docsPlace` (the area's name from 9.1.5,
else the map's display name) and `docsClock` (day, time, season) **(new)**.

**Steps.**
1. `DocsDoodads.SaveShot` **(new)**, pure: `fit(width, height, max)` for the size; `info(place, clock)`; `ok(shot,
   limit)` to refuse a picture over the size limit.
2. When the map scene ends, scale MZ's own background picture down (about 160 pixels wide, JPEG at 0.6) and keep
   the string until the next save. No second draw of the map is needed.
3. Add the three fields in the `makeSavefileInfo` hook, behind a plugin parameter.
4. Draw them in a `drawContents` hook: the picture at one side, the place and clock on one line. A save without
   them, or with a picture that fails to load, draws as MZ draws it today.

**Tests.** `scratch/test_save_shot.js`: sizes; the info gains the fields; a string over the limit is dropped, not
cut; old info without the fields draws without an error.

**Watch out.** MZ keeps every save's info in one file (`global.rmmzsave`), and a browser game keeps it in the
browser's storage: hold each picture under about 8 KB. Save-screen plugins draw their own list; draw only into
MZ's own window and leave the fields in the info for others to use.

## 9.1.5 Area names (S)

**Goal.** Walking into a named part of a map shows its name, as MZ shows a map's.

**What is true today.** Regions hold the camera in rooms (`Camera2D.regionBox`), pick looks (6.1.18) and sounds
(`DocsDoodads.RegionSounds`), and the Regions tool's legend lists what uses each (`DocsDoodads.Regions`,
`44_workspace_regions.js`). MZ shows a map's display name once, with `Window_MapName`. Nothing names part of a map.

**Data.** One map's setting: `areas: [{ region, name, once }]` **(new)**.

**Steps.**
1. `DocsDoodads.Areas` **(new)**, pure: `at(mapSettings, regionId)`; `changed(state, regionId, frame)`, which
   waits a few frames so a walk along a border does not show two names in turn, and honours `once`.
2. In the game, when the area changes, open MZ's `Window_MapName` with the area's name so it matches the game's
   skin. Pass the name through MZ's text codes (`convertEscapeCharacters`) so a translation plugin can reach it.
3. `DocsDoodads.api.area()` and an `areaEnter` event on `api.on`; a plugin command Store Area Name.
4. In the editor: a Name field on each row of the Regions legend, and "Area" in that row's list of uses.

**Tests.** `scratch/test_areas.js`: a region with no name shows nothing; the border wait; `once` across a save and
load (kept the way `WorldState.store()` keeps its data); a map with no areas does no work.

## 9.1.6 Pins and fast travel (S)

**Goal.** Found places show as pins on the minimap and the world map, and the player can travel to one.

**What is true today.** The minimap is `DocsDoodads.Minimap` (`12_visual_equipment_map_destination.js`,
`17_perspective_runtime_3_minimap.js`), its fog of war is `DocsDoodads.Explored` (`12_explored_map.js`), and Show
World Map is `showWorldMap` (`17_perspective_runtime_4_model_files.js`). A search found no pins or event marks on
either; read how the player's own mark is drawn before starting (not read).

**Data.** In the project, through `DataFiles`: `pins: { [mapId]: [{ id, x, y, icon, name, travel, switchId }] }`
**(new)**. On an event, `<docs pin: icon, name>`. In the save, the ids found: `$gameSystem._docsPins` **(new)**.

**Steps.**
1. `DocsDoodads.Pins` **(new)**, pure: `list(mapId)` (the map's own and its events'), `visible(pin, explored,
   switches, found)`, `find(id)`.
2. Draw visible pins on the minimap and the world map with icons from MZ's icon sheet; a pin is found when its
   tile is explored or by the command. *(This much is the small half; ship it first.)*
3. Travel: on the world map, the arrow keys, a gamepad or a click pick a found pin with `travel`; a confirm, then
   `$gamePlayer.reserveTransfer` to it. A switch named in the parameters forbids travel (cutscenes, dungeons).
4. In the editor: pins placed and named on the map the way map notes are (`DocsDoodads.Notes`, `11_notes.js`),
   but saved with the game, not the editor.
5. Plugin commands Find Pin, Hide Pin and Open Fast Travel.

**Tests.** `scratch/test_pins.js`: visibility by fog, switch and found; an event's pin follows the event's page;
travel refused by the switch; the save round-trips; a pin on a deleted map is skipped.

**Watch out.** Looping maps and planets: place a pin by tile, not by screen. The landing tile must be one the
player can stand on (`MapCheck.reach` already knows); Problems should list a travel pin that is not.

## 9.1.7 Flat maps as battle backgrounds (S)

**Goal.** A battle on a flat map is fought in front of that map, lit as it was.

**What is true today.** For 3D maps, the `battleBack` setting inside `perspective` makes
`Spriteset_Map.prototype.docsBattleSnapshot` draw the view again from a low camera without characters, pictures or
the minimap, and the `Scene_Map.prototype.snapForBattleBackground` hook keeps it in `$gameTemp._docsBattleBack`
(`17_perspective_runtime_4_model_files.js`). A flat map gets MZ's own blurred picture when no battleback is named.

**Steps.**
1. One map's setting for flat maps, `battleBack: true` **(new)**, beside the 3D one in the map panel.
2. Move the part of `docsBattleSnapshot` that hides characters, shadows, gear layers, pictures and the minimap
   into a helper both ways use.
3. For a flat map, snap the spriteset with its lights, time of day, weather layers and look, with no blur, and
   hand it over the way the 3D one is.
4. A battleback named for the map or set by Change Battle Back still wins.

**Tests.** Add to the suite that covers the 3D battle background (search `scratch/` for `docsBattleSnapshot`):
what was hidden is shown again after the snap, also when the snap throws; a named battleback wins; off by default.

**Watch out.** In side view the battlers stand on the lower half of the picture; try it on Starting Town, the
Field Map and the cave, and offer "shift the view up" if their feet land on a roof.

---

# 9.2 The map as gameplay

## 9.2.1 Nearness triggers (S)

**Goal.** A doodad changes state or runs a common event when the player comes near, and again when they leave.

**What is true today.** `DocsDoodads.Touch` (`07_doodad_states.js`) has two triggers, `action` and `touch`
(`Touch.triggers`), with `tilesOf`, `at`, `fits`, `run` and `tryAt`. The prompt is drawn by
`updateDocsTouchPrompt` (`15_spriteset_map_prompts.js`). States are set and saved through `WorldState.setState`.

**Data.** On a doodad: `near: { range, enter, leave, commonEventId, once }` **(new)**, apart from `touch` so one
doodad can have both. `enter` and `leave` are a state's name, `next`, or nothing.

**Steps.**
1. `DocsDoodads.Near` **(new)**, pure, in a part numbered `07`: `inside(d, x, y, tw, th, loop)` by the distance
   from the doodad's base to the player's tile, across the seam on a looping map; `step(wasInside, isInside)` →
   `enter`, `leave` or nothing, with half a tile of slack so standing on the edge does not flap.
2. One spriteset step (`DocsDoodads.spritesetSteps`) that looks only at the map's doodads with `near`, listed once
   when the map loads, and only every few frames.
3. On `enter` and `leave`: `WorldState.setState` (so it is saved, crossfades and plays its state sound) and, if
   set, the common event, reserved the way `Touch.run` reserves one. Never two at once: drop a repeat.
4. In Details, a "When the player is near" section beside Touch, with the range drawn on the map as Show Sounds
   draws a sound's reach.
5. `near` and `far` events on `DocsDoodads.api.on`.

**Tests.** `scratch/test_near.js`: inside and outside at the range; the slack; the seam of a looping map; `once`;
a map with no `near` doodads does no work each frame.

**Done when.** A door opens as the player walks up and closes behind them, and torches light along a corridor, on
a flat map, a looping map and in 3D.

## 9.2.2 Indoors by region (M)

**Goal.** A house on the same map as its street: no rain, snow or sun shadows inside, its own darkness, and the
rain heard more quietly.

**What is true today.** Weather is the whole screen's: MZ's own, read by the plugin for wind, leaves and lightning
(`Wind.now(time, weather)`, `DocsDoodads.Lightning`, `07_map_layers_weather.js`), drawn on flat maps in
`15_spriteset_map_layers_weather.js` (not read) and in 3D by `DocsDoodads.Weather3D`. Sun shadows can be set to
"Ignore (indoors)" for a whole map, and character shadows stop at roof regions (`07_world_atmosphere.js`, search
"roof regions"). Darkness is one value for a map (`Lighting.mapSettings`, `Lighting.resolveAmbient`). Snow that
settles is `SnowCover`.

**Data.** One map's setting: `indoors: { regions, darkness, quiet }` **(new)**; `regions` is text like the wall
regions (`Occlusion.regions` parses it).

**Steps.**
1. *(PR 1.)* `DocsDoodads.Indoors` **(new)**, pure: `isIndoors(mapSettings, regionId)`; `mask(regionAt, w, h,
   set)`, a byte a tile, made once for a map and again when its regions are painted.
2. *(PR 1.)* Weather through the mask: on flat maps a mask sprite over the weather layers, moved with the map; in
   3D, drops whose ground tile is indoors are left out. `SnowCover` leaves indoor tiles bare.
3. *(PR 2.)* While the player stands indoors: the weather's sound eased down to `quiet`, lightning dimmed (through
   `Comfort.flash`, 9.1.1), and swaying doodads whose base is indoors not leaned by the wind.
4. *(PR 2.)* Sun shadows and cloud shadows skip indoor tiles. Darkness: ease the screen to `darkness` while the
   player is inside. Darkness that differs tile by tile on one screen needs the lightmap to take a second colour;
   leave that for later and say so.
5. A section in the map panel, and "Indoors" among the uses in the Regions legend.

**Tests.** `scratch/test_indoors.js`: the mask for a small map; repainting a region rebuilds it; a map with no
indoor regions makes no mask. On the stand-in engine: drops over indoor tiles are not drawn, flat and in 3D.

**Done when.** On Starting Town, with one house's floor marked, rain falls up to the door and not past it, flat
and in 3D, and the map loops and scrolls without the mask slipping.

**Watch out.** Mark floors, not roofs: seen from outside, rain over a roof is right. A looping map needs the mask
to wrap.

## 9.2.3 Bridges you walk over and under (M)

**Goal.** The player walks under a bridge and, later, over it, on one flat map.

**What is true today.** Collision answers one question a tile for everyone: `Collision.blocksTile`,
`Collision.grid` and `Collision.stops` (`14_collision_runtime.js`), with one-way ledges (`Collision.oneWayDirs`).
MZ's passability has no levels. Depth is behind, sorted by base line, or above.

**Data.** One map's setting: `bridges: { deck, ends }` **(new)**, two lists of regions. On each character, a level
(`0` below, `1` on the deck), kept on the character so MZ saves it.

**Steps.**
1. *(PR 1.)* `DocsDoodads.Bridges` **(new)**, pure: `kind(regionId)` → `deck`, `end` or nothing; `levelAfter(level,
   from, to)` (stepping onto an end from the ground goes up; stepping from an end to the ground comes down;
   stepping from the ground straight onto a deck tile stays below); `canPass(level, from, to)` (on the deck, no
   stepping off the side; below it, the deck tile's own blocked sides do not count).
2. *(PR 1.)* Hooks, kept thin: the map passability check for a character; characters on different levels do not
   block each other; the player does not start an event on the other level; followers keep their own level.
3. *(PR 2.)* Drawing: a character below is drawn under the deck's tiles and doodads, one on the deck over them.
   Sorted doodads on the deck sort with the level, not only the base line.
4. *(PR 3.)* The editor: "Bridge deck" and "Bridge end" in the Regions legend; Show Collision draws both levels;
   `MapCheck.reach` carries the level so Check Reach is right on both.
5. Jumping, flying and the click-to-walk path (`Traversal`, the destination marker) ask `blocksTile`; give each
   the level.

**Tests.** `scratch/test_bridges.js`: every pair in `levelAfter` and `canPass`; a walk under and a walk over the
same tile; two characters on different levels pass; a save and load keeps the level; a map with no bridge regions
takes the old path through every hook.

**Watch out.** The collision brush (7.3.2) and movement off the grid (7.3.3) change the same hooks: agree one
order for them before the second of the three is built. Flat maps only at first; in 3D a bridge wants terrain
with two heights on one tile, which the height map cannot hold.

## 9.2.4 Light and sight (M)

**Goal.** A script can ask how bright a tile is, and an event can see the player.

**What is true today.** Lights are gathered each frame for drawing (`Lighting.collect`, `06_render_effects.js`).
Walls stop light through `Occlusion.visibility` and `Occlusion.cast` (`06_render_lights_directional.js`), with the
world's wall regions. The 3D view tints things by `Perspective.lightAt(info, x, y)` (`17_perspective_runtime.js`).
Nothing public answers "how lit is this tile", and nothing lets an event see.

**Steps.**
1. *(PR 1.)* `Lighting.levelAt(x, y, ctx)` **(new)**, pure: the map's darkness, plus each light's share at that
   point (move the sum `Perspective.lightAt` does into `06_render_effects.js` and use it from both), with one
   `Occlusion.cast` a light when that light stops at walls. Returns 0 to 1.
2. *(PR 1.)* `DocsDoodads.api.lightAt(tileX, tileY)`, a plugin command Store Light Level, and an optional switch
   that is on while the player stands in the dark.
3. *(PR 2.)* `DocsDoodads.Sight` **(new)**, pure: `sees(from, facing, target, { range, spread, isWall, level,
   minLevel })`: inside the cone, no wall on the ray, and the range shortened where the target stands in the dark.
4. *(PR 2.)* Notetags on an event: `<docs sight: tiles, degrees>` and what to do on seeing the player (a self
   switch, or a common event), read the way `Traversal.eventKind` reads its tags.
5. In the editor, the picked event's cone drawn on the map; the fields in the event's Details.

**Tests.** `scratch/test_sight.js`: behind a wall is not seen; in the dark, seen only close; the flashlight on the
player makes them seen from further; outside the cone is not seen. `levelAt` against a hand-worked case with two
lamps and a wall.

**Watch out.** Cost: check sight a few times a second, and only for tagged events near the screen. Use the same
wall regions as the lights, so a map needs no second set of marks.

## 9.2.5 Doodads that ride and travel (M)

**Goal.** A doodad rides on an event or the player, or travels along a path, with its light, shadow and sound.

**What is true today.** `DocsDoodads.Motion` (`06_render_effects.js`) has sway, bob, pulse, flicker and shimmer:
all in place. `DocsDoodads.api.move(query, x, y, opts)` moves a doodad once (not read: whether it eases). A camera
path is a list of points with waits and easing (`Camera2D.parsePoints`, `pathAt`, `pathFrames`).

**Data.** On a doodad: `ride: { on, dx, dy }` **(new)**, `on` an event's id or `player`; or `travel: { points,
speed, ease, mode, switchId, carries }` **(new)**, `mode` being `loop`, `backAndForth` or `once`.

**Steps.**
1. *(PR 1.)* `DocsDoodads.Travel` **(new)**, pure: `at(travel, frame)` from the same sums as `Camera2D.pathAt`;
   `rideAt(ride, character)`.
2. *(PR 1.)* In the game, a mover's place is set each frame before it is sorted. Check that each thing that reads
   a doodad's place reads the live one: its light (`Lighting.collect`), shadow, particles and sound.
3. *(PR 1.)* The editor: for Travel, points dragged on the map as a camera path's are; for Ride, "Ride on…" picks
   an event, and the doodad is drawn on it.
4. *(PR 2.)* Collision and carrying: a traveller with a body moves it tile by tile (`Collision.invalidate` as it
   crosses); one with `carries` moves whoever stands on it by its own step, so a raft crosses water.
5. Plugin commands Start Travel and Stop Travel. A `once` traveller's end is kept by `WorldState`.

**Tests.** `scratch/test_travel.js`: the place at a frame for each mode; a rider follows a moved event; a doodad
with neither takes the old path; the body's tiles change as it crosses a tile line.

**Watch out.** Movers must be sorted each frame; keep them in their own short list so the other three thousand
doodads are not. A looping map: travel across the seam.

## 9.2.6 Weather that picks itself (S)

**Goal.** Each day's weather follows the season, by chance, and is the same after a save and load.

**What is true today.** Weather is MZ's (`$gameScreen.changeWeather`, by event command); the plugin reads its type
and power (`Wind.now`) and adds lightning, wind, fog banks and settling snow. Days, weekdays and seasons are
`DocsDoodads.Calendar` (`07_world_calendar.js`) and `DocsDoodads.Seasons` (`07_world_atmosphere.js`).

**Data.** Game-wide, in `World.defaults`: `climate: { enabled, seed, seasons: { [name]: [{ type, power, chance,
hours }] } }` **(new)**. One map's setting: `climate: 'world' | 'none'`. In the save: only the seed and whether a
maker's command is holding the weather.

**Steps.**
1. `DocsDoodads.Climate` **(new)**, pure and seeded (rule 4 of section 8): `day(dayNumber, season, table, seed)` →
   the day's spans of weather. The day number and seed give the same answer every time, so nothing else is saved.
2. In the game, at the start of a span, call `$gameScreen.changeWeather` with a long fade; fog and wind go to
   `MapLayers` and `Wind.set`. A map set to `none` shows none while the days go on.
3. A maker's own Set Weather holds until a new command, Resume Climate.
4. `DocsDoodads.api.forecast(days)` and Store Forecast, for a weather report in the game.
5. In the editor: a table for each season in the World panel, and the next seven days drawn as a strip beside the
   clock scrubber.

**Tests.** `scratch/test_climate.js`: the same day twice gives the same spans; over many days the shares match the
table's chances; a map set to `none`; a held weather is not replaced.

**Watch out.** MZ has rain, storm and snow only; "fog" and "windy" are the plugin's own and must work with MZ's
weather set to none. The clock runs in battles and menus (`Calendar.tickOffMap`): change the weather on returning
to the map, not during them.

---

# 9.3 Life and look

## 9.3.1 Ambient creatures (M)

**Goal.** Birds that fly off when the player comes near and come back; butterflies by day; fish that dart away.

**What is true today.** Particles (`DocsDoodads.Particles`, presets such as fireflies and leaves) do not know
where the player is. Grass does (`DocsDoodads.React`: `touching`, `push`, `step`). Both are in
`09_particles_vfx_reactive_doodads_character.js`.

**Data.** On a doodad, or laid by a dressing rule: `creatures: { kind, count, sheet, flee, back, hours, weather }`
**(new)**.

**Steps.**
1. *(PR 1.)* `DocsDoodads.Creatures` **(new)**, pure and seeded: one small state for each creature (idle,
   startled, away, coming back) and `step(state, dt, player, wind)`.
2. *(PR 1.)* Drawing from a small sheet of the user's, from a pool; a shadow on the ground; in 3D, billboards with
   a height. Add Sample Items draws one bird and one butterfly the way `DocsDoodads.SampleArt` draws its pictures.
3. *(PR 2.)* Birds land on the tops of doodads marked "Perch"; fish are dark shapes under water tiles that scatter
   from a swimmer or a boat; lightning startles everything.
4. Hours and weather: none at night or in a storm unless the kind says so.
5. Effects Quality scales the count, and Low turns them off.

**Tests.** `scratch/test_creatures.js`: the same seed gives the same flight; startled at the range and not beyond;
none outside its hours; the pool never passes its count.

**Watch out.** They are not events: no collision, no save data. Give them a line in Show Speed's budget.

## 9.3.2 Ropes and cables (S)

**Goal.** A line between two points that sags and sways with the wind, with things hung along it.

**What is true today.** The Path tool lays pieces along a line (`DocsDoodads.Paths`, `31_placement_tools.js`).
Wind is `DocsDoodads.Wind.now`. Nothing spans two points. MZ's PIXI has `PIXI.SimpleRope`.

**Data.** A doodad with `line: { x2, y2, sag, width, colour, hang }` **(new)**; its own picture, if it has one, is
the rope's texture. Check first what an older build of the plugin does with a doodad it has no picture for.

**Steps.**
1. `DocsDoodads.Rope` **(new)**, pure: `points(x1, y1, x2, y2, sag, n)`; `swayed(points, wind, time, seed)`, the
   middle moving most and the ends not at all.
2. Drawing: a `PIXI.SimpleRope` for a textured rope, a `PIXI.Graphics` line for a plain one. Hung things are
   small sprites at points along it, and each may carry a light from `DocsDoodads.LightPresets`.
3. The editor: a Rope choice in the Path tool's card. Click two points; drag the middle for the sag; a handle at
   each end.
4. Depth: above characters, or sorted by its lower end.

**Tests.** `scratch/test_rope.js`: the ends never move; more sag is a longer line; no wind is no sway; a rope
across the seam of a looping map.

**Watch out.** The stand-in engine (`scratch/engine/fake_engine.js`) needs a stand-in rope. Flat maps first.

## 9.3.3 Heat haze (S)

**Goal.** The air over a fire, a lava vent or a desert road bends what is behind it.

**What is true today.** Shimmer is a motion of one picture (`Motion.types`). Shockwave bends the whole screen once
(Play Screen Effect). Screen passes are chosen by `P.passes(look, quality, anim)` (`08_post_processing.js`).

**Data.** On a doodad: `haze: { radius, strength, speed }` **(new)**. For a map: a "Heat" choice among the looks.

**Steps.**
1. `DocsDoodads.Haze` **(new)**, pure: `collect(doodads, display, max)` → the nearest eight on the screen, with
   their centres in screen pixels.
2. One screen pass in GLSL ES 1.00: inside each circle, the picture is read a little to one side by a noise that
   drifts upward; eight circles as uniforms. The pass is not in the list when `collect` is empty.
3. Presets: Campfire, Lava, Desert Road (a band across the screen) and Under Water (the whole screen, for a dive).
4. A Details section, with the radius drawn on the map. Low quality turns it off, and Less Camera Motion (9.1.1)
   halves it.

**Tests.** `scratch/test_haze.js`: at most eight, none off screen, nearest first; no pass with no sources; the
strength under Less Camera Motion.

**Watch out.** Where it sits among the passes (before bloom, after the map is drawn). In 3D it bends the finished
picture, which is right for a distant road and wrong close up; try it before offering it there.

---

# 9.4 Editor and art

## 9.4.1 Tileset flags in the editor (M)

**Goal.** Set passability, ☆, ladder, bush, counter, damage floor and terrain tags without going back to MZ.

**What is true today.** The Tiles tool paints tiles (`DocsDoodads.Tiles`, `31_tile_painting.js`; its palette is
in `44_workspace_tiles.js`). The Regions tool shows terrain tags and does not change them (6.2.5). Nothing in
`src/` writes `Tilesets.json`. MZ reads a tile's flags as bits (`rmmz_objects.js`): `0x0f` the four blocked
sides, `0x10` ☆, `0x20` ladder, `0x40` bush, `0x80` counter, `0x100` damage floor, `0x200`, `0x400` and `0x800`
for the boat, the ship and landing the airship, and the terrain tag in the bits above (`flags >> 12`).

**Steps.**
1. `DocsDoodads.TileFlags` **(new)**, pure: `read(flag)` → the settings as names; `write(flag, change)` → the new
   number; `idsFor(tileId)` → every id that must change together (an autotile's shapes share one setting: change
   one in MZ and compare the file before and after to learn exactly which ids MZ writes).
2. A Flags choice on the Tiles palette: each tile wears MZ's marks (○, ×, ☆, arrows, the tag's number); a click
   steps through them as MZ's database does. One undo step a click.
3. The running game reads `$dataTilesets` directly, so a change shows at once: Show Collision and Check Reach
   redraw.
4. Saving (rule 4 above): `data/Tilesets.json` through the save path, with a backup and the changed-since-read
   check, and the message to close and reopen the project in MZ.
5. Before the first change to a tileset, say how many maps use it.

**Tests.** `scratch/test_tile_flags.js`: every flag reads back as written and leaves the others alone; an
autotile changes all its ids; undo; the file is written whole or not at all; nothing is written outside a
playtest.

**Watch out.** MZ's editor keeps the database in memory and writes all of it on its next save, so a user who
leaves MZ open and saves there loses these changes. The conflict check sees MZ's change afterwards, not before.
Say so in the card every time, not once.

## 9.4.2 Animated GIF and APNG in (S)

**Goal.** A dropped GIF or APNG becomes a doodad that animates.

**What is true today.** The Item Bag indexes `.png`, `.jpg`, `.jpeg` and `.webp` (and sounds):
`AssetIndex.supportedExtensions` (`21_assetindex_metadata_cache.js`) and `Import.isSupported` (`36_import.js`).
There is a GIF writer, `DocsDoodads.Gif` (`palette`, `indices`, `lzw`, `encode` in `11_editor_tools.js`), and no
reader. Doodad animation is a strip of frames with a count and a speed (6.2.3).

**Steps.**
1. `DocsDoodads.GifRead` **(new)**, `@editor-only`, pure: the header, palettes, each frame's delay, disposal and
   clear colour, the LZW data and interlacing; `frames(bytes)` → whole pictures, each drawn over the last as the
   disposal says. Test it first against what `Gif.encode` writes.
2. `DocsDoodads.ApngRead` **(new)**, `@editor-only`: the `acTL`, `fcTL` and `fdAT` chunks, each frame inflated
   with Node's `zlib` (passed in, as `Zip.read` takes its inflate), with its blend and dispose settings.
3. On drop or import, write one PNG strip (rows wrapped so no side passes 4096 pixels) in place of the file, and
   set the item's frames across, frames down and speed from the delays, so a placed doodad plays at once.
4. Cut Up Sheet opens the strip as any sheet.

**Tests.** `scratch/test_gif_read.js`: a round trip through `Gif.encode`; each disposal kind; a one-frame GIF gives
a plain PNG; a file whose frames would pass the size limit is refused with a message; Cancel leaves no half-made
file.

**Watch out.** A GIF has 256 colours and no soft edges; say so in the import message. Frames that last different
times: use the commonest and say so. Animated WebP is left out; plain WebP already works.

## 9.4.3 A licence ledger for all art (S)

**Goal.** One credits file for the art the game uses, and a way to find art with no credit recorded.

**What is true today.** Credits are written for LPC only: `CREDITS_LPC.txt`, from `23_lpc_index.js`, by
`writeLpcCreditsText` (`39_workspace_map_panel.js`). The library keeps each item's tags and other details
(`DocsDoodads.AssetIndex`). Packs carry items between projects (`22_doodad_packs.js`).

**Data.** In the library's metadata, for a file or a folder: `credit: { author, licence, source, note }`
**(new)**; a file with none takes its folder's. A pack carries its items' credits.

**Steps.**
1. `DocsDoodads.Credits` **(new)**, pure: `of(path, metadata)` (its own, else the nearest folder's);
   `text(list)`, grouped by author and licence; `missing(list)`.
2. In the Item Bag: a Credit line on the hover card and in the item's details; "Set Credit…" for several picked
   items or a folder; search words `author:`, `licence:` and `credit:none`.
3. On import: if the dropped folder or zip holds a licence, credits or readme file, offer to keep its text as the
   folder's note. Never guess a licence from it.
4. Art menu → Write Credits: one `CREDITS.txt` for the art in use (from Where Used), with the LPC part added from
   the data `writeLpcCreditsText` uses.
5. A Problems check, off until ticked: art in use with no credit.

**Tests.** `scratch/test_credits.js`: a file takes its folder's credit and its own wins; the text for two authors
and three licences; `credit:none` in a search; a pack out and in keeps the credits; unused art is left out.

**Watch out.** The ledger records what the user says; it does not judge what a licence allows. Offer a short list
(CC0, CC-BY 4.0, CC-BY-SA 4.0, OGA-BY 3.0, "Bought: see the shop's terms", "My own") and free text.

---

# 9.5 Safer releases

## 9.5.1 A playtest that runs itself (M)

**Goal.** One command plays the test project in MZ's own runtime, flat and in 3D, and fails when a frame changes.

**What is true today.** The suites run in Node on a stand-in engine (`scratch/engine/fake_engine.js`,
`scratch/run-tests.js`), and `scratch/bench_frames.js` times frames there. What only a real GPU shows is checked
by hand: `scratch/qa_water_capture.js` is run from DevTools, and the QA records are written by hand. The water
drawn outside the 3D ground capture (fixed on 15 November) passed every suite. `scripts/deploy.js` already finds
MZ's NW.js (`DEFAULT_RUNTIMES`, `--runtime`). The test project (`rpgmaker project`) is not in the repository, and
the workflow in `.github/workflows/verify.yml` has neither MZ nor a GPU.

**Steps.**
1. `scripts/playtest.js` **(new)** and `npm run playtest`: copy the test project to the temp folder (rule 5
   above), build the plugin into the copy, add a small driver plugin to the copy's plugin list, and start
   `nw.exe <copy> test`. NW.js runs one instance of an app: if a Playtest is open, a second start only brings the
   old window forward, so check for a running `nw.exe` first and stop with a message.
2. The driver (a file in `scratch/`, never part of the plugin): keep the game running without focus
   (`SceneManager.isGameActive`), start a new game, clear the opening message, then run a list of cases. A case is
   a map, flat or 3D, a time, a weather, a number of frames to wait, and a name.
3. The first cases: Starting Town (3), the Field Map (4, which loops) and the Western Cave (5), each flat and in
   3D; a storm at dusk; night with lamps; water at the edge of the 3D ground capture (what `qa_water_capture.js`
   probes).
4. Hold everything that varies: seed `Math.random`, fix the clock and the wind, wait until every picture is
   loaded, and step a fixed number of frames.
5. Capture by drawing the spriteset into a `PIXI.RenderTexture` the size of the screen and reading that. Never
   extract the spriteset itself: MZ's screen sprite is 100,000 pixels across. Write PNGs with `scripts/png.js`.
6. Compare with the kept pictures: a small compare of its own (how many pixels differ by more than a little),
   pure, in `scripts/`. Write a report with the kept picture, the new one and the difference; exit with an error
   on a difference, a console error or a case that never finished. `--update` keeps the new pictures.
7. Also write frames a second for each case into the report, not compared.

**Tests.** `scratch/test_playtest_compare.js`: equal pictures pass; one changed block fails and is boxed in the
difference; a size change fails; the case list parses. The run itself is not part of `npm run verify`.

**Done when.** Putting the water bug back makes `npm run playtest` fail with a picture that shows it, and a clean
tree passes twice in a row on the same computer.

**Watch out.** Pictures differ between GPUs: keep them per computer, out of git (they also show MZ's own art), and
allow a small difference. It cannot run in CI as it stands; run it before a release and on any pull request that
touches drawing, and add that line to `CONTRIBUTING.md` and the manual checklist.

## 9.5.2 Plugin clash check and a report bundle (S)

**Goal.** The editor says which enabled plugins clash or need another order, and one click gathers what a bug
report needs.

**What is true today.** `DocsDoodads.Core.log` is all of `18_core_diagnostics.js`. Problems
(`DocsDoodads.MapCheck`, `44_workspace_map_check.js`) checks maps, not plugins. 7.4.5 plans a published list of
plugins tried beside this one.

**Steps.**
1. `DocsDoodads.Clash` **(new)**, pure: `check(plugins, table)` takes MZ's plugin list (name, on or off, order)
   and a table of `{ match, level, note }`, with `level` being `works`, `order` or `clash`. The table is data in
   one place, and 7.4.5's published list is written from it by a script, so the two cannot disagree.
2. A general check in a playtest, after every plugin has loaded: for a short list of the functions this plugin
   wraps, see whether the one in place still leads back to ours. If not, a plugin loaded later replaced it: name
   the plugins that load after this one.
3. A "Plugins" group in Problems, each row with its note and, for `order`, which way to move it.
4. More → Info → Save a Report: one text file with the plugin's version, MZ's, NW.js and Chromium, the GPU's name,
   screen and tile size, the names and order of enabled plugins, this plugin's parameters, the Problems list, the
   map's size and counts, and the last 200 errors and warnings (kept in a ring while a playtest runs).
5. Nothing is sent anywhere (rule 2 of section 8). The user attaches the file themselves.

**Tests.** `scratch/test_clash.js`: a table row matches by name; order findings name both plugins; a replaced
function is found and a wrapped one is not; the report holds no path outside the project and no other plugin's
parameters.

**Watch out.** Paths hold the user's name: write them from the project folder down. Other plugins' parameters can
hold keys and passwords: list names only.

## 9.5.3 Save-safe changes (S)

**Goal.** After a game is released, the editor warns before a change that would lose what players' saves hold.

**What is true today.** `DocsDoodads.WorldState` (`07_doodad_states.js`) keeps states and lights on
`$gameSystem._docsWorldState`, under a key made from the map and the doodad's Name (`idOf`, `key`, `handle`). A
state is kept as its name or as its number (`setState`; `next` keeps the number). The explored map is kept by map
and size (`Explored.entry(mapId, w, h)`). So renaming or deleting a named doodad, putting a state in before
others, or resizing a map quietly drops or shifts what a save holds.

**Data.** `data/DocsDoodadsShipped.json` **(new)**, written in a playtest: for each release the maker marks,
`{ version, date, names: { [mapId]: [name] }, states: { [name]: [stateName] }, maps: { [mapId]: [w, h] } }`. With
the doodads' data: `aliases: { [mapId]: { old: new } }` **(new)**.

**Steps.**
1. `DocsDoodads.Shipped` **(new)**, pure: `snapshot(data)`; `diff(snapshot, now)` → names gone, names that look
   renamed (same picture, same place), states gone or moved, maps resized.
2. More → Mark as Released writes the snapshot. `npm run deploy` reminds when the data has changed since the last.
3. At the edit: renaming or deleting a doodad the snapshot names shows a card ("Players' saves know this as
   Gate") with Keep the Old Name Working, which records an alias. Problems lists every finding from `diff`.
4. In the game, `WorldState.handle` looks a name up through the aliases, so an old save's state lands on the
   renamed doodad. A name that is gone is dropped when its map loads.
5. Keep states by name from now on: where `setState` would keep a number, keep the state's name when it has one,
   and go on reading numbers from old saves.

**Tests.** `scratch/test_shipped.js`: each kind of finding; an alias carries a saved state and a saved light to
the new name; a number saved by an old version still reads; with no snapshot nothing warns.

**Watch out.** A chain of renames (A to B, then B to C) must still find A. Decorate mode (8.4.1) and A world that
remembers (8.4.2) add their own save data: give each a line in the snapshot when it is built.
