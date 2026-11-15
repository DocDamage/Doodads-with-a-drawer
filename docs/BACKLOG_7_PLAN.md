# Backlog 7: How to Build Each Item

**Status:** written 15 November 2026. Nothing here is started. This is the working detail for
[section 7 of RECOMMENDATIONS.md](../RECOMMENDATIONS.md#7-backlog-next-steps-15-november-2026): for each row, what
to build, where in `src/`, what data it keeps, the steps in order, the tests, and when it is done.

It is written so that someone (or a model) who does not know the plugin can take one item and finish it. Read
"Rules for every item" and "How things are added here" first; every item assumes them.

File and function names were read from the source on the day above. Line numbers are left out because they move:
find a name with a search of `src/`. Names marked **(new)** do not exist yet. If a name here is not in the source
any more, search for the words around it and say so in the pull request rather than guessing.

Sizes as in `RECOMMENDATIONS.md`: **S** an afternoon, **M** a PR like terrain or water, **L** several PRs.

---

## Rules for every item

1. **One item, one branch, one pull request.** Branch from `main`. An **L** item is several pull requests; its
   steps say where to cut.
2. **Edit `src/`, never `Docs-Doodads.js`.** Then `npm run build`. The parts are pieces of one script joined in
   file-name order, not modules: no `import`, no `export`, no `require` of another part.
3. **Write the test first.** A new `scratch/test_<name>.js`, plain Node with `assert`. It sets the globals MZ would
   (`window`, `document`, `Utils`, `PluginManager`, `$gameMap`, `Graphics`), then `require('../Docs-Doodads.js')`
   and tests `DocsDoodads.<Thing>`. Copy the top of `scratch/test_map_tools.js` for an editor test, or
   `scratch/test_engine_map.js` for drawing code on the stand-in engine (`scratch/engine/fake_engine.js`).
4. **Keep logic apart from MZ and from the page.** Put the rules in a plain object (`DocsDoodads.<Thing>`) in a part
   numbered `01`–`13` that takes its inputs as arguments, and keep the hooks into MZ (`14`–`17`) and the editor's
   HTML (`37`–`44`) thin. The plain object is what the tests cover.
5. **Before the pull request:** `npm run verify` and `npm run coverage` both pass. If you added words the editor
   shows, run `npm run strings`. If you added a key, run `npm run shortcuts`.
6. **Write it down:** a line under "Unreleased" in `CHANGELOG.md`; a section or paragraph in
   `Docs_Doodads_Guide.md`; every new notetag and plugin command in `CHEAT_SHEET.md`; rows in
   `MANUAL_TEST_CHECKLIST.md` for what only a playtest can show; and mark the row **Done** in `RECOMMENDATIONS.md`
   the way section 6 does.
7. **Play it in MZ** before calling it done, on an outdoor map, a looping map and a cave as well as an interior,
   flat and in 3D, and say what you played in the pull request.
8. **The editor runs only in a playtest.** Anything that writes a file or touches the page must be behind
   `DocsDoodads.Compat.isTest()` (and `editorMode`). Writes go through `DocsDoodads.FS`, which refuses outside a
   playtest. A deployed game must work with the editor absent.
9. **MZ only.** MZ 1.10's window is an old Chromium (85): no `:focus-visible`, no `Array.prototype.at`, no
   `structuredClone`, no `Object.hasOwn`. Shaders stay GLSL ES 1.00.
10. **Don't touch** `QJ-Doodads.original.js`, the generated parts (`36_ui_icons.js`, `36_ui_fonts.js`), or a user's
    saved data format without reading old files as well as new ones.

## How things are added here

- **A plugin command.** Add its `@command` block (with `@arg`s) to the header in
  `src/00_header_and_plugin_parameters.js`, and register it beside its feature:
  `PluginManager.registerCommand(pluginName, 'name', function(args) { ... })`, inside the
  `if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function')` guard that
  `src/07_world_calendar.js` uses. Mirror it on `DocsDoodads.api` (`src/07_public_api.js`) when a script would want
  it.
- **A notetag on an event.** Read the event's note and the comments on its current page with
  `DocsDoodads.VisualEquip.eventText(character)`, match `<docs word>` or `<docs word: value>` without minding case
  or spaces, and keep the answer in a `WeakMap` keyed by the character, checked against the text, as
  `Traversal.eventKind` does in `src/17_traversal.js`.
- **A setting for the whole game.** Add its defaults to `DocsDoodads.World.defaults` in
  `src/07_world_atmosphere.js`; read it with `DocsDoodads.World.get('path.to.value')` or `World.settings()`; write
  it with `World.set(path, value)`.
- **A setting for one map.** Per-map settings are `window.$dataDocsDoodads.mapSettings[mapId]`, read with
  `DocsDoodads.Lighting.mapSettings(mapId)` and written with `Lighting.setMapSettings(mapId, settings)`. To show it
  in the map panel, push `{ render, bind }` onto `DocsDoodads.Workspace.mapSections` as
  `src/44_workspace_minimap.js` does.
- **Data kept with the doodads.** `$dataDocsDoodads` has a key per map id (the array of doodads) and other keys
  beside them. `DocsDoodads.DataFiles` (`src/04_data_load_save_legacy_vs_translation.js`) writes it, as one file or
  one per map; a new per-map key must go through `DataFiles.entriesFor` and `merge` so both ways keep it.
- **A work every frame on the map.** Add a method to `Spriteset_Map.prototype` and its name to
  `DocsDoodads.spritesetSteps` in `src/15_spriteset_map_doodad_layer_hooks.js`, as
  `updateDocsTouchPrompt` (`src/15_spriteset_map_prompts.js`) is. Run `node scratch/bench_frames.js` before and
  after.
- **A tool on the map.** Register `DocsDoodads.Workspace.toolHooks[name] = { click, down, move, up, overlay }`;
  don't add branches to the canvas input parts. Draw with `DocsDoodads.Ui.mapColor(name)`, never a fixed colour.
- **A new editor part.** Name it `44_workspace_<name>.js` so it sorts after
  `44_workspace_canvas_input_3_dialogs.js`, and add to the workspace with
  `Object.assign(DocsDoodads.Workspace, { ... })`.
- **An entry in More.** The menu's HTML and its click handlers are in `src/37_workspace_core.js` (search
  `dd-more-menu` and `on('dd-rooms-btn'`). Add the same thing to `paletteCommands()` in
  `src/39_workspace_map_panel.js` so Ctrl+K finds it.
- **A right-click entry on the map.** The lists are built in `src/44_workspace_canvas_input_1_mouse.js` (search
  `Paste in Place`) and shown by `showContextMenu` in `src/44_workspace_canvas_input_2_events.js`.
- **A question or a slow job.** `DocsDoodads.Ui.confirm`, `prompt`, `form`, `choose`, `alert` (each a promise), and
  `Ui.progress(label, { onCancel, delay })`. Never the browser's own.
- **An undoable change.** Go through `DocsDoodads.Undo` (`src/32_undo.js`) with a named step; one step per stroke
  or action. Look at how the Regions tool (`src/44_workspace_regions.js`) records a stroke.
- **A key.** Only in `DocsDoodads.Shortcuts` (`src/11_shortcuts.js`).

## A good order

Small and safe first, and things others need before what needs them:

1. 7.4.9, 7.1.7, 7.1.3, 7.4.6, 7.2.2, 7.2.3 (small, no new data formats or one small one).
2. 7.2.1, 7.2.4, 7.2.6, 7.4.7, 7.4.5.
3. 7.1.1 (it changes the build; do it while few other branches are open).
4. 7.3.2, then 7.1.6 and 7.3.3, which use it.
5. 7.1.4, 7.1.2, 7.3.7, 7.3.8, 7.4.8, 7.1.8.
6. 7.1.5, 7.3.1, 7.3.4, 7.3.5, 7.3.6, 7.2.5 (large or risky).

---

# 7.1 Features

## 7.1.1 A game-only build (M)

**Goal.** `npm run deploy` and the release zip can use a `Docs-Doodads.js` without the editor in it.

**What is true today.** The parts are not split cleanly by number. Parts `00`–`17` and `45` (the game) use objects
defined in the editor's range: `DocsDoodads.Collision` (`30_collision.js`, `blocksTile` is called by traversal and
the destination marker), `Packer` (`22_asset_management.js`), `FS` (`20_fs.js`), `LiveReload`, and `Layers`,
`Biome`, `KeyChord` (`11_editor_tools.js`). They also name `DocsDoodads.Workspace` about 67 times, mostly as
`DocsDoodads.Workspace && DocsDoodads.Workspace.mounted`. So dropping parts `20`–`45` breaks the game.

**Steps.**
1. Write `scratch/test_game_build.js` first. It builds the game-only text, checks it parses
   (`new vm.Script(text)`), loads it on the stand-in engine, sets up a map with doodads, lights and collision, and
   runs a few frames, as `scratch/test_engine_map.js` does with the full plugin. It also asserts
   `DocsDoodads.Workspace === undefined` and that the text is under an agreed size.
2. In `scripts/build.js`, add `build({ game: true })`. A part is left out when its first line is exactly
   `// @editor-only` **(new)**. Add `npm run build:game` writing `release/Docs-Doodads.game.js` (not into the
   repository root, and `release/` is already ignored).
3. Mark parts `@editor-only` one group at a time, running the test after each: `23_*`, `24`–`29`, `31_*`, `32`–`36`,
   `37`–`44`. Leave `18`, `19`, `20` in.
4. Where the test fails because the game uses something in a marked part, move that piece into a game part. Expect
   at least: the runtime half of `30_collision.js` (everything `blocksTile` needs) into a new
   `14_collision_runtime.js` **(new)**; `Packer.forMap`, `resolve`, `manifestExists`, `shouldRequestManifest` into
   a game part; the pieces of `11_editor_tools.js` the spriteset uses. Move code, don't copy it.
5. Every use of an editor object in a game part must be guarded (`DocsDoodads.Workspace && ...`). Add a check to
   `scratch/verify-project.js` that searches the game parts for an unguarded `DocsDoodads.<EditorObject>.`.
6. `scripts/deploy.js`: after `copyDir(project, out, ...)`, when `--game-build` **(new)** is given, write the
   game-only text over `<out>/js/plugins/Docs-Doodads.js`. `scripts/package.js`: add the file to the zip as
   `Docs-Doodads.game.js` with two lines in `README.txt` on when to use it.

**Tests.** The suite above; `scratch/test_deploy_script.js` gains a case for `--game-build`;
`scratch/test_package.js` for the extra file.

**Done when.** A project deployed with `--game-build`, encrypted, plays a map with doodads, lights, sounds,
collision, states, traversal and the 3D view with no error in the console, and the plugin file is at most about
half its size.

**Watch out.** The header (`00_`) carries the plugin parameters MZ's Plugin Manager reads; it must stay whole.
Parts open and close objects across files (`44_workspace_*` close `DocsDoodads.Workspace`): leave out a whole
group or none of it.

## 7.1.2 Editing what an event does (L)

**Goal.** In the editor, open an event and change its pages and common commands without going back to MZ.

**Where.** Events are made by `DocsDoodads.Events.createEventObject` (`28_events.js`) and edited through
`selectedStagedEvent` and `editSelectedEvent(type, mutate)` in `44_workspace_canvas_input_2_events.js`, which
already gives undo. New: `28_event_commands.js` **(new)** for the logic, `44_workspace_event_editor.js` **(new)**
for the card.

**Data.** MZ's own: an event has `pages[]`; a page has `conditions`
(`switch1Valid`, `switch1Id`, `switch2Valid`, `switch2Id`, `variableValid`, `variableId`, `variableValue`,
`selfSwitchValid`, `selfSwitchCh`, `itemValid`, `itemId`, `actorValid`, `actorId`), `image`, `trigger`,
`priorityType`, and `list[]` of `{ code, indent, parameters }`, ending with code `0`.

**Steps.**
1. *(PR 1, logic)* `DocsDoodads.EventCommands` **(new)**: a table of the commands supported, each with
   `code`, `label`, `fields` (name, kind: text, number, switch, variable, map, tile, choice) and two functions,
   `read(list, index) → values` and `write(values, indent) → commands[]`. Start with: Show Text (101 then one 401
   per line; parameters `[faceName, faceIndex, background, positionType, speakerName]`), Transfer Player (201:
   `[0, mapId, x, y, direction, fadeType]`), Control Switches (121: `[startId, endId, 0 on | 1 off]`), Control Self
   Switch (123: `[letter, 0 on | 1 off]`), Common Event (117: `[id]`), Wait (230: `[frames]`), Play SE (250), and
   this plugin's own commands (357). Also `describe(list) → rows[]` (one row per command, with its indent and a
   line of words; a code not in the table is a row marked "Edit in MZ" that is kept untouched), and
   `insert`, `remove`, `move`, `replace` that keep the final code `0` and never split a 101 from its 401s.
2. *(PR 2, card)* A card from the event's Details ("Edit Commands..."): tabs for pages (add, copy, delete, with a
   red confirm on delete), the page's conditions as a form, and the list of rows. Enter edits a row with
   `Ui.form`; Insert adds one from the table. Every change goes through `editSelectedEvent` as one undo step.
3. *(PR 3)* Pickers: switches and variables by name from `$dataSystem.switches` / `.variables`; a map and tile
   picker for Transfer Player that goes to the other map and comes back (the editor already switches maps; search
   `Copy to Map`).

**Tests.** `scratch/test_event_commands.js`: `read(write(v))` gives `v` back for every command; a list with
unknown codes comes back byte for byte after an edit elsewhere in it; Show Text with four lines makes one 101 and
four 401s; indents inside a Conditional Branch (111) are kept.

**Done when.** A sign made from a template can have its text changed, and a door its destination, in the editor;
MZ opens the map afterwards and shows the same commands.

**Watch out.** Never rewrite a command you don't understand. MZ's conflict check (a map changed in MZ since it was
read) must still ask before saving over it.

## 7.1.3 Play From Here (S)

**Goal.** Right-click an empty tile, "Play From Here": the player stands there and the editor closes.

**Where.** The map's right-click list (`44_workspace_canvas_input_1_mouse.js`); closing is the Done button's path
(search `Keep Editing` in `src/` for the question it asks about unsaved work, and `close()` in
`37_workspace_core.js`). The clock preview is `ws.previewMinutes` and `ws.previewSeason`
(`44_workspace_map_tools.js`).

**Steps.**
1. `Workspace.playFromHere(tileX, tileY)` **(new)** in a new `44_workspace_play_here.js`: run the same
   unsaved-work question Done does; if the user keeps editing, stop. Otherwise close the editor, then
   `$gamePlayer.locate(tileX, tileY)` (the editor is already on that map; if the editor's map is not the game's
   map, use `$gamePlayer.reserveTransfer(mapId, x, y, 2, 0)`).
2. If a time or season is being previewed, ask once ("Start at 18:30, Winter?") and, on yes, set them with
   `DocsDoodads.api.setTime` and `api.setSeason`.
3. Refuse a tile the player can't stand on (`$gameMap.isPassable` in no direction, or
   `DocsDoodads.Collision.blocksTile`) with a message naming why, and offer the nearest free tile
   (`DocsDoodads.Events.nearestFreeTile` shows the search).
4. Add it to the palette and give it a key in `11_shortcuts.js` (suggest `Ctrl+Enter`, acting on the tile under
   the mouse).

**Tests.** `scratch/test_play_here.js`: the player is located; a blocked tile is refused and the nearest free one
offered; unsaved work asks first; the preview time is applied only on yes.

**Done when.** It works flat and in 3D (the tile under the mouse in 3D comes from `Perspective.unproject`, which
the editor's picking already uses).

## 7.1.4 Schedules for events (M)

**Goal.** An event can be in different places by the hour and weekday.

**Where.** Logic in `07_event_schedules.js` **(new)** as `DocsDoodads.Schedules`; hooks in `17_schedules_runtime.js`
**(new)**. The clock: read how `api.time()` gets the minutes in `07_public_api.js` and use the same; weekdays from
`DocsDoodads.Calendar.weekday()` and `weekdayNames()`.

**Notetag** (in the event's note or a comment):

```
<docs schedule>
08:00 12,5
18:00 20,9 walk
Sat,Sun 10:00 3,3 hide
</docs schedule>
```

Each line: optional weekdays (names as in the Calendar settings, comma-separated), a time, a tile, then optional
words: `walk` (walk there if the player is on the map; otherwise appear there), `hide` (the event is not on the map
during this entry), `face:2|4|6|8`.

**Steps.**
1. `Schedules.parse(text) → entries[]` and `Schedules.current(entries, minutes, weekdayIndex, weekdayNames) → entry`:
   the latest entry at or before now among those for today; before the first entry of the day, the last entry of
   yesterday.
2. On map setup (after events are made) and whenever the minute changes, for each event with a schedule: find the
   current entry. If it is new for this event: on map setup, `locate` it; otherwise if `walk`, give the event a
   target and each time it is not moving step it with `findDirectionTo(x, y)` and `moveStraight(d)`; if it has
   not arrived after 600 frames, `locate` it. `hide` uses a transparent, through event (`setTransparent(true)`,
   `setThrough(true)`), restored on the next entry.
3. Keep nothing in the save: positions come from the clock each time. Store only `event._docsScheduleKey` (the
   entry in force) on the event object.
4. Plugin command `Pause Schedules` (on/off, for cutscenes) and `api.schedules(on)`.
5. Editor: in an event's Details, a "Schedule" list that reads and writes the notetag, with "Use this tile" taking
   the tile under the next click; show each entry's tile on the map with its time while the event is picked.

**Tests.** `scratch/test_schedules.js`: parsing (bad lines are reported, not thrown); `current` across midnight
and with weekdays; an event located on map setup; a walking event that can't arrive is located after the limit.

**Done when.** An NPC stands in a shop by day and by a bed at night on a running clock, and after a save and load.

**Watch out.** MZ's `findDirectionTo` only searches 12 tiles; that is why the fallback exists. Don't move an event
while `$gameMap.isEventRunning()` or while it is the event running.

## 7.1.5 Normal maps on flat maps (L)

**Goal.** A doodad or character with a normal map is shaded by the lights near it.

**Where.** Lights are collected by `DocsDoodads.Lighting.collect` (`06_render_effects.js`) and drawn into a
lightmap by `createDocsLighting`, `docsLightTexture` and `updateDocsLighting`
(`15_spriteset_map_doodad_layer_hooks.js`). The models' per-pixel light shader in
`17_perspective_runtime_models.js` is the pattern for the shader.

**Design.** A picture `tree.png` has its normal map beside it as `tree_n.png`. A PIXI filter on the sprite takes the
normal map as a second texture and up to 8 nearest lights (position in screen pixels, colour, radius, intensity) as
uniforms, and multiplies the picture's colour by `ambient + Σ light × max(dot(N, L), 0) × falloff`. A sprite with a
normal map is left out of the ordinary lightmap multiply for its own pixels (otherwise it is lit twice): give the
lightmap a mask, or render these sprites after the lightmap pass.

**Steps.**
1. *(PR 1)* `DocsDoodads.NormalLight` **(new)** in `06_render_normal_light.js`: `pick(lights, x, y, max)` (the
   nearest, strongest lights for a point), `uniforms(lights, ambient)`, and the GLSL ES 1.00 fragment source as a
   string. Test the picking and the uniform packing in Node.
2. *(PR 2)* Load `_n` pictures when present (the Item Bag's index, `21_assetindex_metadata_cache.js`, should record
   that an item has one; deployed games must not log a failed request for a missing one, so read it from the
   index or a manifest, not by trying). Apply the filter in `14_sprite_docsdoodad_runtime_engine.js`. A setting
   `World.defaults.normalLight = { enabled: false, maxLights: 8 }` and the Effects Quality option turn it down.
3. *(PR 3)* Characters: `$Name_n.png` beside the walker. Then an editor helper, "Make Normal Map", that makes a
   rough one from the picture's brightness and edges (a Sobel filter on the alpha and luminance), written beside
   the picture.

**Tests.** The Node tests above; `scratch/bench_frames.js` before and after with 200 normal-mapped doodads.

**Done when.** A stone wall with a normal map shows its bumps lit from the side a torch is on, moving as the torch
does, at 60 frames a second with 200 such doodads and 20 lights on screen.

**Watch out.** A filter per sprite breaks batching: 3,000 filtered sprites will be slow. Only sprites with a normal
map get the filter, and off-screen ones are already skipped. In 3D, leave this off in the first version.

## 7.1.6 Bringing in Tiled and LDtk maps (M)

**Goal.** More → Import Map takes a Tiled `.tmj`/`.json` or an LDtk `.ldtk` file and makes an MZ map from it.

**Needs 7.3.2** (the collision brush) for collision layers.

**Design.** Tiled and LDtk tilesets are not MZ tilesets, so tiles are not turned into MZ tile ids. Each tile layer is
drawn into one PNG and shown as a picture layer (`DocsDoodads.MapLayers`, Background or Overlay); objects become
doodads; collision becomes painted collision.

**Formats.**
- *Tiled JSON:* `width`, `height`, `tilewidth`, `tileheight`, `layers[]` (`type: "tilelayer"` with `data[]` of
  gids; `type: "objectgroup"` with `objects[]` of `x, y, width, height, gid, name, type`), `tilesets[]`
  (`firstgid`, `image`, `columns`, `tilewidth`, `margin`, `spacing`, or `source` for an external `.tsj`). The top
  three bits of a gid are flips (`0x80000000` horizontal, `0x40000000` vertical, `0x20000000` diagonal); mask them
  off for the tile and apply them when drawing.
- *LDtk:* `levels[]`, each with `layerInstances[]`: `__type` of `Tiles` or `AutoLayer` (`gridTiles` /
  `autoLayerTiles`: `{ px: [x, y], src: [x, y], f }`, `__tilesetRelPath`, `__gridSize`), `IntGrid`
  (`intGridCsv`, `__cWid`, `__cHei`), `Entities` (`entityInstances[]`: `__identifier`, `px`, `width`, `height`,
  `__tile`).

**Steps.**
1. `DocsDoodads.MapImport` **(new)** in `36_import_maps.js`: `readTiled(json, readFile)` and
   `readLdtk(json, readFile, levelIndex)`, both returning one plain shape:
   `{ width, height, tile, layers: [{ name, kind: 'tiles'|'objects'|'collision', ... }] }`. A layer is `collision`
   when its name contains "collision" (Tiled) or it is an IntGrid (LDtk).
2. `MapImport.plan(model, options)` → what will be written: PNGs under `img/parallaxes/`, doodad pictures cut from
   tilesets under `img/doodads/`, the doodads, the picture layers, the collision cells, and a new MZ map of the
   right size (in tiles of the project's size; refuse or scale when the tile sizes differ, and say which).
3. The card: choose the file, choose a level (LDtk), a list of what will be made, then run with
   `Ui.progress`. Draw the PNGs with a canvas and write them with `DocsDoodads.FS`, whole or not at all, as Import
   does (`36_import.js`, `executeBatchAsync`).
4. Layers above an object layer named "player" (or the first object layer) go to Overlay, the rest to Background.

**Tests.** `scratch/test_map_import.js` with two small fixtures in `scratch/fixtures/` (a 4 × 4 Tiled map with one
flipped tile, an object and a collision layer; an LDtk file with one level): the model, the plan's file list, the
flip bits, an external tileset.

**Done when.** A Tiled sample map comes in, looks the same, and the player is stopped by its collision layer.

## 7.1.7 Types for `DocsDoodads.api` (S)

**Goal.** A `Docs-Doodads.d.ts` in the release zip.

**Steps.**
1. Above each method in `07_public_api.js`, a JSDoc comment with `@param` and `@returns` types.
2. `scripts/types.js` **(new)**, `npm run types`: reads `src/07_public_api.js` with a small parser of its own (a
   method line, the JSDoc above it; no new dependency), and writes `types/Docs-Doodads.d.ts` with
   `declare const DocsDoodads: { api: DocsDoodadsApi; ... }`, the doodad's shape (`DocsDoodad`: read the fields a
   doodad has from `02_standard_structs_runtime_data.js` and `api.place`), and the events of `api.on`.
3. `npm run types -- --check` in `scratch/verify-project.js`, failing when the file is stale or a method has no
   JSDoc, as `shortcuts` and `strings` are checked.
4. Add the file to `scripts/package.js` and a paragraph to the guide's API section.

**Tests.** `scratch/test_types.js`: every key of `DocsDoodads.api` that is a function is in the `.d.ts`; the file
has balanced braces and no `any` for a documented parameter.

## 7.1.8 A sample project (M)

**Goal.** A small project people can download and play that shows the plugin.

**Constraint.** MZ's art can't be given away (rule 5 in CONTRIBUTING.md), and the project folder with spaces in its
name in this repository is not committed.

**Steps.**
1. Draw or take free art only: extend `DocsDoodads.SampleArt` (`44_workspace_onboarding.js`), which already draws a
   bush, flowers, a rock and a lamp with code, to a small set (tree, house front, fence, sign, chest open and
   closed, torch), or use CC0 art with its credits in a `CREDITS.txt`.
2. `scripts/sample.js` **(new)**, `npm run sample -- <a new, empty MZ project>`: writes the art, three maps (a town
   at dusk with lamps and a door with two states; a field with wind, grass and a pond; a cave with a flashlight
   and echo; one of them with the 3D view on), the doodad data and a few events, into that project. It never writes
   into a project that already has doodad data.
3. The maps' tiles use whatever tileset the new project has (MZ's own, on the user's computer), so nothing of MZ's
   is shipped.
4. A page in `docs/` on running it, linked from the README.

**Tests.** `scratch/test_sample.js`: run it into a temp folder with a stub project; the data loads with
`DataFiles.readAll`; `DocsDoodads.MapCheck` finds no problems.

---

# 7.2 UI and UX

## 7.2.1 Split up More (S)

**Goal.** The top bar has a few named menus; More is short.

**Where.** `37_workspace_core.js`: the top bar's HTML (search `dd-more-btn`), the menu (`dd-more-menu`),
`showMoreMenu`, and the `on('dd-…-btn', …)` handlers.

**Steps.**
1. Describe the menus as data first: `Workspace.menus` **(new)** =
   `[{ id, label, icon, items: [{ id, label, icon, run, key }] }]`, with every entry of today's More in exactly one
   menu:
   - **Map:** Map Settings, Find Doodads, Outliner, Rooms, Templates, Problems, Check Reach, Save This Map, Autosave.
   - **Art:** Cut Up Sheet, Characters, Packs, Effects Maker, File Check.
   - **View:** Show Grid, Show Collision, Show Sounds, Listen, Show Speed, Screen Looks, Look, the layouts.
   - **More:** Find a Tool, Keys, Capture, Old Saves, Messages, Info, How to Use.
2. Render the menus and bind the handlers from that data (one function), and build `paletteCommands()` entries for
   them from the same data so the two can't drift.
3. Keep every button's `id`: tours (`44_workspace_onboarding.js`) and tests point at them.
4. In a small window the menus fold back into one More with headings (the top bar already drops words and takes a
   second row; search `second row`).
5. Keyboard: arrow keys move between menus and inside one, as the right-click menu does (`contextMenuKey`).

**Tests.** `scratch/test_menus.js`: every old id is in exactly one menu; each item has a label and a `run`; the
palette has each one. Update `scratch/test_placement_tool_buttons.js` and `test_ui_polish.js` if they look for the
old layout.

**Done when.** The README's "The editor at a glance" and the guide are updated, and the menus fit at 100, 125 and
150% in an 816 × 624 window.

## 7.2.2 Map notes (S)

**Goal.** Notes pinned to tiles, seen only in the editor.

**Data.** `$dataDocsDoodads.notes[mapId] = [{ id, x, y, text, done, colour }]` **(new)**, through `DataFiles` so
one-file and one-file-per-map both keep it. Never read by the game.

**Steps.**
1. `DocsDoodads.Notes` **(new)** in `11_notes.js`: `list(mapId)`, `add`, `update`, `remove`, `counts()` across maps.
2. Editor part `44_workspace_notes.js`: right-click → "Add Note Here" (`Ui.prompt`); an overlay drawing a pin per
   note (a tool hook's `overlay`, colours from `Ui.mapColor`), the text on hover; click a pin to edit, tick or
   delete; a Notes card listing this map's or every map's notes with Go To (as Problems does,
   `44_workspace_map_check.js`).
3. Undo for add, edit and delete. A "Show Notes" toggle in the View menu, on by default.
4. Capture (`44_workspace_capture.js`) must not draw notes.

**Tests.** `scratch/test_notes.js`: the data round-trips both ways of saving; undo; a map with no notes writes no
key.

## 7.2.3 A ruler and bookmarks (S)

**Ruler.** A tool hook `ruler` **(new)**: press, drag, release; the overlay draws the line and a label with tiles
(`dx, dy` and the walking distance `|dx| + |dy|`) and pixels. Shift snaps to tile centres. It changes nothing, so no
undo. A key in `11_shortcuts.js` (suggest `M`). In 3D, measure on the ground with `Perspective.unproject`.

**Bookmarks.** `$dataDocsDoodads.bookmarks = [{ id, name, mapId, x, y, zoom }]` **(new)** (editor only). "Bookmark
This View" in the View menu and palette (`Ui.prompt` for the name); each bookmark is a palette entry ("Go to: Inn")
and a row in a small card; going to one changes map when needed (the way map tabs do,
`44_workspace_navigation.js`) and centres the view. Keys `Ctrl+1`…`Ctrl+9` for the first nine if free.

**Tests.** `scratch/test_ruler_bookmarks.js`: the distances for a known drag; snapping; a bookmark on another map
switches map then centres; deleting a map's last doodad does not drop its bookmarks.

## 7.2.4 Map pictures (S)

**Goal.** A small picture of each map in the map tabs' tooltips, the map list and World View.

**Where.** `DocsDoodads.MapExport` (`08_post_processing.js`) plans a whole-map picture; World View is
`showWorldView` (`42_workspace_assets_maps.js`); tabs are `renderMapTabs` (`44_workspace_navigation.js`).
Thumbnails of items are cached by `DocsDoodads.Thumbnail` (`24_thumbnail.js`); follow its cache.

**Steps.**
1. `Workspace.mapThumb(mapId)` **(new)**: when a map is saved or left, draw it at about 256 pixels on its long side
   (tiles and doodads, no lights or weather; reuse the export's drawing at a small scale) and write
   `data/docs_doodads_cache/maps/Map###.png` (that cache folder is already the plugin's).
2. Show it: `title` hover card on a map tab, a picture per map in World View and in "Go to map" in the palette.
3. A map never opened has none: show its name on a plain tile, and make one the first time it is opened. Never
   make thumbnails for every map at once without `Ui.progress` and Cancel.

**Tests.** `scratch/test_map_thumbs.js`: the size for wide and tall maps; the cache path; a stale thumbnail (map
file newer) is redrawn.

## 7.2.5 Panels in their own window (M)

**Goal.** The Item Bag or Details can be moved to a second window.

**Where.** Docking is `44_workspace_docking.js` (`Workspace.dock`, `applyDockPositions`); layouts are
`34_layout.js`. NW.js gives `nw.Window.open(url, options, callback)`; the plugin only uses `nw.Window.get()` today
(`45_scene_map_integration_key_bindings.js`).

**Design.** Open a blank page in a new NW.js window, copy the theme's `<style>` into it, and **move** the panel's
element into the new window's `document.body` (`adoptNode`). The panel's code keeps running in the game's window, so
event handlers keep working; only lookups by `document.getElementById` break.

**Steps.**
1. Spike first, and write down what happens: does a moved element keep its listeners in NW.js at MZ's version; do
   drags from the second window onto the map work (they won't across windows: placing by click must work without a
   drag). If moving the element fails, stop and record why in this file.
2. Replace `document.getElementById` in the panel's part with a lookup through its root
   (`Workspace.panelRoot(name).querySelector`), one panel at a time, Item Bag first.
3. "Open in a window" on a panel's title menu; "dock back" on the window, and when the window closes. Remember its
   place per layout. Close it when the editor closes or the playtest ends.
4. Keys pressed in the second window must reach `Shortcuts` (forward `keydown`), and the game must not pause while
   it has focus (search `unfocused` or `blur` handling in part `45`).

**Tests.** The lookup refactor is covered by the existing panel suites still passing; the window itself is manual:
add rows to `MANUAL_TEST_CHECKLIST.md`.

**Watch out.** This is the riskiest UI item. If step 1 fails, the fallback is a larger editor window (asking NW.js to
resize the game window while editing), which is a separate, smaller item.

## 7.2.6 One Settings page (M)

**Goal.** One searchable page lists every setting, wherever it lives, and takes you to it.

**Where.** `DocsDoodads.SettingsSearch` (`12_visual_equipment_map_destination.js`) already matches text for the map
panel's search (`39_workspace_map_panel.js`).

**Steps.**
1. A registry: `Workspace.settingsIndex` **(new)** = `[{ id, label, words, where, open() }]`. Fill it from: the
   map panel's sections (their check boxes and fields already have labels: collect them where they are rendered),
   `Workspace.mapSections`, the Look card, Keys, Autosave, and the plugin parameters (read their names and
   descriptions from the header at build time into a small table: `scripts/build.js` can't, so parse the header
   text from `DocsDoodads` at run time or keep a hand list checked by a test against `00_header…`).
2. A Settings card (More, and `Ctrl+,`): a search field, results grouped by where they live, Enter opens the place
   and puts the focus on the control (flash it once). Plugin parameters can't be changed in a playtest: show their
   value and say "Change in MZ's Plugin Manager".
3. Add each result to the palette's search under a "Setting:" prefix.

**Tests.** `scratch/test_settings_index.js`: every `@param` in the header is in the index; ids are unique; a
search for "shadow" finds the sun shadows and character shadows.

---

# 7.3 Bigger features

## 7.3.1 Walking from map to map without a transfer (L)

**Goal.** With maps linked as neighbours, the player walks off one map's edge onto the next with no fade.

**Where.** `DocsDoodads.MapLinks` (`31_placement_tools.js`): `layout(mapId, neighborsOf, sizeOf, depth)` gives the
world positions of linked maps, and `edgeCopies` mirrors doodads across edges. Links are `north`, `south`, `east`,
`west` per map (read how `layout`'s `neighborsOf` is given in `42_workspace_assets_maps.js`). `MapLinks` is in an
editor part; the game needs it, so move the pure parts into a game part first (see 7.1.1).

**Design, first version: a quick transfer, not two maps at once.** When the player steps over an edge that has a
neighbour, transfer to the same position on the neighbour (offset by the maps' alignment) with no fade
(`reserveTransfer(mapId, x, y, direction, 2)`, fade type 2 is none), keep the walk going, keep the camera's world
position, and have the neighbour's data already loaded so there is no wait. Edge copies already make the doodads
look continuous; this version adds the neighbour's **tiles** drawn past the edge.

**Steps.**
1. *(PR 1)* Preload: when a map with neighbours starts, fetch each neighbour's `Map###.json` (MZ's
   `DataManager.loadMapData` loads one into `$dataMap`; don't use it: fetch the JSON yourself into a cache keyed by
   map id) and its doodad file when files are split by map. `DocsDoodads.Seamless` **(new)**:
   `target(mapId, x, y, d, links, sizes) → { mapId, x, y } | null`.
2. *(PR 2)* The step over the edge: wrap `Game_Player.prototype.moveStraight` (or `canPass` at the edge): if
   `target` is not null and the target tile is passable in the cached map's data, reserve the fade-less transfer.
   Give `DataManager` the cached JSON so the scene doesn't wait on disk. Carry followers. A game-wide setting
   `World.defaults.seamless = { enabled: false }` and a per-map opt-out.
3. *(PR 3)* Draw the neighbours' tiles outside the edge so the join is not a black strip: a second `Tilemap` per
   visible neighbour, positioned by `MapLinks.layout`, with that map's tileset, behind the current map's. Only
   for neighbours whose tileset pictures are loaded.
4. *(PR 4)* Events near the edge of a neighbour are not shown in this version: say so in the guide. Autorun and
   parallel events on the new map start as on any transfer.

**Tests.** `scratch/test_seamless.js`: `target` for each edge, with maps of different sizes and offsets; no target
with no link; a blocked destination tile stops the step; looping maps are left alone.

**Done when.** Walking east off a field onto a linked field has no fade, no pause over one frame, and the music and
weather carry on when both maps use the same.

**Watch out.** Map change hooks all over the plugin (`Persistence.onMapChanging`, weather, lights, the clock) run on
a transfer; check each keeps its state. The 3D view comes later.

## 7.3.2 A collision brush (M)

**Goal.** Paint where the player can't walk, in cells finer than a tile.

**Where.** `DocsDoodads.Collision.blocksTile(tx, ty, vehicles, mover, d)` (`30_collision.js`) is what movement asks
today, and the passability hooks at the bottom of that file call it. The Regions tool
(`44_workspace_regions.js`) is the model for a painting tool with a legend, an overlay and one undo step a stroke.
Show Collision (`44_workspace_readouts.js`) draws the overlay.

**Data.** `$dataDocsDoodads.walls[mapId] = { cell: 12, w, h, rows: [string] }` **(new)**: a grid of cells of
`cell` pixels (a quarter of a 48-pixel tile), each row run-length encoded as text so the file stays small and
diffs read well. Through `DataFiles` both ways.

**Steps.**
1. `DocsDoodads.Walls` **(new)** in a game part (`06_walls.js`): `encode`, `decode`, `get(mapId)`,
   `cellAt(grid, px, py)`, `blocksRect(grid, x, y, w, h)`, and
   `blocksTile(grid, tx, ty, tw, th)`: true when more than half of the tile's cells are painted. Wire it into
   `Collision.blocksTile` so everything that asks today (movement, traversal, the destination marker, Check Reach)
   respects it with no other change.
2. The tool (`44_workspace_walls.js`, a `toolHooks.walls`): a round or square brush, `[` and `]` for size (as
   Scatter and Hills), right-drag erases, Shift draws a straight line from the last point, a fill for closed
   shapes. One undo step a stroke.
3. Overlay: painted cells in the "blocked" map colour, under Show Collision and while the tool is picked.
4. "From Picture": paint from a picture layer's opaque pixels above a threshold, for parallax maps
   (`Collision.footprintFromAlpha` shows the idea for one doodad).
5. Looping maps: wrap cell coordinates.

**Tests.** `scratch/test_walls.js`: encode/decode round trip; the half-tile rule; a stroke is one undo step;
`Collision.blocksTile` is true on a painted tile with no doodads; a map with no walls writes no key; looping.

**Done when.** A cliff painted on a parallax picture stops the player and events, Check Reach shades it, and the
destination marker paths round it.

## 7.3.3 Movement off the grid (L)

**Needs 7.3.2.**

**Goal.** An option: the player (then events) move by pixels and are stopped by collision shapes, not tiles.

**Design.** Keep `_x`/`_y` in tiles but allow fractions (`_realX`/`_realY` already are). Each character has a box
(default 24 × 16 pixels at the feet). Each frame, move by speed along the input direction (8 ways), then resolve
against: painted walls (`Walls.blocksRect`), doodad bodies (`Collision.bodyOf` gives shapes), MZ tile passability
(treat an impassable tile, or a tile edge that blocks that direction, as a box or an edge), and other characters'
boxes. Slide along walls by resolving x and y apart.

**Steps.**
1. *(PR 1)* `DocsDoodads.FreeMove` **(new)**, pure: `step(box, dx, dy, blocked) → { x, y, hitX, hitY }` with
   sliding, and `tileEdges(map, tx, ty)` turning MZ passability into edges. Test hard: corners, thin gaps, speed
   larger than a cell (sub-step).
2. *(PR 2)* The player: override `Game_Player.moveByInput` and `updateMove` when
   `World.defaults.freeMove.enabled`; keep `x`/`y` (the rounded tile) correct so events, regions, encounters,
   terrain tags and every plugin that reads the player's tile still work. Event triggers: "player touch" fires when
   boxes overlap; "action button" looks at the box in front.
3. *(PR 3)* Followers (follow a trail of positions), mouse/touch destination (path on tiles, then walk the path
   freely), vehicles left on the grid.
4. *(PR 4)* Traversal (`17_traversal.js`: jump, swim, climb, ice) each checked; anything not made to work is
   switched to grid movement while it runs, and the guide says so.

**Tests.** `scratch/test_free_move.js` for the pure part; `scratch/test_engine_characters.js`-style tests for the
player on the stand-in engine.

**Watch out.** This touches the part of MZ most other plugins also touch. Off by default, and a line in the
compatibility list (7.4.5). Events stay on the grid in the first release.

## 7.3.4 Baking for phones (L)

**Goal.** A deployed game draws a map's still doodads as a few big pictures.

**Where.** `DocsDoodads.Packer` (`22_asset_management.js`) already packs each map's art into atlases with a
manifest (`buildManifest`, `forMap`, `resolve`, `staleSources`); `scripts/deploy.js` makes the build. Follow the
Packer's manifest and staleness checks.

**Design.** A doodad is *still* when it has no motion, animation, states, condition or switch, touch, particles,
see-through, season art, or light of its own, and sorts either below or above characters (not by base line with
them). Still doodads of one depth band are drawn, in order, into chunks of 1024 × 1024 pixels of map; each chunk is
one sprite. Shadows cast from still doodads go into a chunk of their own when the sun doesn't move (no day and
night on that map).

**Steps.**
1. *(PR 1)* `DocsDoodads.Bake` **(new)**, pure: `isStill(d, mapSettings, world)`, `chunks(doodads, mapW, mapH)`,
   `manifest(mapId, chunks, sources)`, `stale(manifest, mtimeOf)`. Tests for every reason a doodad is not still.
2. *(PR 2)* Baking in the editor: Map menu → "Bake This Map" / "Bake Every Map" draws the chunks with a canvas
   (the map export's drawing) and writes `img/doodads/_baked/Map###_<band>_<cx>_<cy>.png` and a manifest, with
   `Ui.progress`. Baked files are remade when stale, and deleted when a map has none.
3. *(PR 3)* The game: when a manifest exists and is current for the map, the spriteset makes chunk sprites and
   skips the sprites of baked doodads (`Collision`, touch and sound still read the doodad data). Off in a playtest
   unless asked for, so the editor always shows the real thing.
4. *(PR 4)* `scripts/deploy.js --bake` can't draw (no canvas in Node): it only checks the manifests are current and
   stops with the list of stale maps. Measure on a real phone and a real low-spec PC (item B) and put the numbers
   in a `docs/QA_<date>.md`.

**Tests.** The pure tests; `scratch/bench_frames.js --counts` before and after on the 3,000-doodad map.

**Watch out.** "Exclude unused files" in MZ's deployment leaves out `img/doodads`; `--restore` must bring the baked
files back too (`22_required_assets.js`, `DocsDoodads.RequiredAssets`). The 3D view can't use flat chunks for
standing doodads: bake only ground decals there.

## 7.3.5 Generated maps (L)

**Goal.** Make a dungeon or a wilderness from rules, in the editor or in the game from a seed.

**Where.** The parts exist: `DocsDoodads.Rooms` (`31_room_stamps.js`: `capture`, `place`), `Biome.paint` and
`Dress.plan` (`11_editor_tools.js`, both take an `rng`), `Tiles.paint` (`31_tile_painting.js`), prefabs
(`31_placement_tools.js`).

**Steps.**
1. *(PR 1)* `DocsDoodads.Generate` **(new)**, pure and seeded (one small PRNG, e.g. mulberry32, passed
   everywhere; never `Math.random`): `dungeon({ w, h, rooms, seed })` → a layout by binary space partition: room
   rectangles and corridors as tile lists, with doors, an entrance and an exit, all reachable (check with
   `DocsDoodads.MapCheck`'s flood). `wilderness({ w, h, seed, biomes })` → a biome id per tile from value noise,
   and paths between marked points.
2. *(PR 2)* Room stamps gain openings: when saving a room, mark door tiles on its edges (stored on the room as
   `doors: [{ x, y, side }]`). The dungeon generator then picks stamps whose doors fit, instead of bare
   rectangles.
3. *(PR 3)* The editor: Map menu → "Generate..." with a form (kind, size, seed, which rooms or biomes), a preview
   drawn on the overlay, Reroll, and Apply as one undo step (tiles through `Tiles.paint`, doodads through
   `Biome.paint` and `Dress.plan`, events from the stamps).
4. *(PR 4)* In the game: plugin command `Generate Map` (seed from a variable) run before the map shows; the result
   is kept in the save by seed, not by data. The generator parts must then live in game parts (7.1.1).

**Tests.** `scratch/test_generate.js`: the same seed gives the same map; every room is reachable; rooms never
overlap; sizes at the limits (smallest map, one room).

## 7.3.6 A cutscene timeline (L)

**Goal.** Lay out camera moves, state changes, lights, weather, looks and character actions on tracks against time,
and play the lot with one plugin command.

**Where.** Each thing already has a command or API: `cameraPath2d`, `cameraFollow2d`, `zoomToPoint`
(`17_camera_2d_runtime.js`), `setCamera` (`17_perspective_runtime_1_view.js`), `setDoodadState`, `setDoodadLight`
(`07_doodad_states.js`), `api.ambient`, `api.setWind`, `api.playVfx`, `api.setTime`. The timeline only calls them.

**Data.** `$dataDocsDoodads.timelines = [{ id, name, length, tracks: [{ kind, target, keys: [{ t, ... }] }] }]`
**(new)**, `t` in frames.

**Steps.**
1. *(PR 1)* `DocsDoodads.Timeline` **(new)**, pure: `due(timeline, fromFrame, toFrame) → actions[]` (the keys
   between two frames, in order), `normalize`, `length`. A table of track kinds, each with the fields of a key and
   a `run(key)` that calls the existing API. The player: a small object stepped once a frame from the spriteset
   steps, with `play(id, { wait })`, `stop()`, `isPlaying()`.
2. *(PR 2)* Plugin commands `Play Timeline` (with "wait until it ends", which holds the event's interpreter as
   `Set Doodad State`'s wait does) and `Stop Timeline`; `api.playTimeline`.
3. *(PR 3)* The editor card: a list of timelines; rows for tracks; a ruler in seconds; click to add a key, drag to
   move it, Enter to edit it with `Ui.form`; a play head with Play, Pause and scrub that runs the keys in the
   editor (using the preview hooks the clock bar uses) and puts the map back on Stop.
4. Skipping: a key held (the OK button for a second) jumps to the end by running every remaining key at once.

**Tests.** `scratch/test_timeline.js`: `due` over a frame, over several, at the end; keys at the same frame keep
their track order; the wait releases at `length`; stop puts back the camera.

**Watch out.** Scrubbing backwards can't undo an action: on a backward scrub, restore the state from when Play was
pressed and run forward to the new time.

## 7.3.7 Light you can see in the air (M)

**Goal.** Shafts of light from the sun through gaps, and from lamps in fog.

**Where.** Walls that stop light are found by `DocsDoodads.Occlusion` (`06_render_lights_directional.js`:
`visibility`, `cast`), and lights are masked in `docsMaskLight` (`15_spriteset_map_lights_directional.js`). The sun's
angle is `DocsDoodads.Sun` (`07_world_atmosphere.js`). Screen effects are `DocsDoodads.PostFX`
(`08_post_processing.js`).

**Design.** A screen-space pass: draw the things that block light (doodads marked "stops light", wall tiles) in
black on white into a small texture (a quarter of the screen), then a radial blur away from the light's screen
position (the sun's is off screen, in its direction), added over the scene with strength. That is the common
"god rays" filter; it is one more PostFX effect.

**Steps.**
1. `PostFX` gains an effect `rays: { enabled, strength, length, source: 'sun' | 'lights' }` with its fragment
   shader (GLSL ES 1.00; a fixed loop of 24 samples) and a place in `resolveLook` and the Screen Looks card
   (`41_workspace_visual_postfx.js`).
2. The occluder texture: a render texture updated each frame from the doodad sprites that stop light, tinted
   black. Reuse the lightmap's render target size logic (`docsLightTexture`).
3. Strength follows the time of day (strongest at low sun, off at night for `sun`), and fog banks
   (`DocsDoodads.MapLayers`) raise it.
4. Effects Quality: off at Low, 12 samples at Medium.

**Tests.** `scratch/test_postfx.js` gains cases: the effect's uniforms from a look, strength by time, off at Low.

**Done when.** At dusk under trees marked to stop light, shafts fall between them and move as the player walks, at
60 frames a second at High on the machine used for the earlier numbers.

## 7.3.8 A first-person 3D camera (M)

**Goal.** A camera mode at eye height that turns with the player.

**Where.** `DocsDoodads.Perspective` (`13_perspective_mode.js`): `camera(spec)`, `project`, `inputDirection(dir, yaw)`
and `viewDirection`, `battleCamera(s)` (a low camera already exists for battles: start from it). The view is
`17_perspective_runtime_1_view.js`; `setCamera` is the command.

**Steps.**
1. `Perspective.firstPerson(s, player)` **(new)**: a camera spec at the player's tile, eye height (a setting,
   default 0.8 of a tile above the ground height there), yaw from the player's facing, a wide field of view.
   A setting `mode: 'orbit' | 'first'` in the map's 3D settings and on `setCamera`.
2. Don't draw the player (and draw followers); near things must not cover the screen: a near distance below which
   billboards fade (the see-through fade for things covering the player is the pattern).
3. Controls: left and right turn by 90° with a short ease (`startTween`/`stepTween`), up walks forward, down
   steps back; with mouse look on, the mouse turns freely and movement follows `inputDirection`.
4. Billboards must face the camera's yaw (they already follow yaw: check tilt). Standing tiles and walls
   (`DocsDoodads.StandTiles`, terrain walls) are what make this look right: say in the guide that a map needs them.
5. The editor leaves first person when it opens and returns when it closes.

**Tests.** `scratch/test_perspective.js` gains cases: the camera's position and yaw for each facing; input
directions turned by yaw; the near fade.

**Done when.** Walking a cave with walls stood up feels right at 60 frames a second, and action-button events in
front of the player still fire.

---

# 7.4 Asked for by users

Rows 7.4.1 to 7.4.4 are done by 7.3.2, 7.1.6, 7.3.1 and (item B, then) 7.3.4.

## 7.4.5 A list of plugins it works with (M)

**Steps.**
1. Pick the plugins by how often they are named in forum questions: VisuStella's Core Engine, Events and Movement
   Core, Lighting Effects and Grid-Free Doodads; a pixel-movement plugin; an action-battle plugin; MZ3D; a
   message plugin. Free or sample versions where there are any; note which could not be got.
2. For each, on a copy of the test project: plugin above and below Doc's Doodads in the Plugin Manager; run the
   short list (open the editor, place, save, walk into collision, a light at night, a state change, a transfer,
   save and load, the 3D view, a deployed build). Record pass, fail, or "works with this setting".
3. Fix what is ours to fix (a hook that replaces instead of wrapping: the rule is to keep the old function and
   call it, as the `$.Game_Player_isMapPassable_traversal` pattern does).
4. Publish `docs/COMPATIBILITY.md` with the date, MZ's version and each plugin's version, linked from the README.
   Add `DocsDoodads.Compat.report()` **(new)** that lists, in the console and in More → Info, the plugins found in
   `$plugins` that the list knows about and what it says.

**Done when.** The list has at least eight plugins with a result each.

## 7.4.6 Names or icons over events (S)

**Notetags.** `<docs label: Blacksmith>` and `<docs icon: 87>` in an event's note or a page comment; optional
`<docs label range: 4>` (tiles; default always shown).

**Where.** The touch prompt (`15_spriteset_map_prompts.js`, `updateDocsTouchPrompt`) is the model: a sprite with a
drawn bitmap, placed over the thing, placed in 3D where it stands in the view.

**Steps.**
1. `DocsDoodads.EventLabels` **(new)** (`07_event_labels.js`): `parse(text) → { label, icon, range } | null`, cached
   per event as `Traversal.eventKind` does.
2. A spriteset step `updateDocsEventLabels` **(new)**: one label sprite per labelled event that is on screen and in
   range, reused from a pool; hidden while a message shows or the event's page has no image and is not
   "through". Text drawn with the game's font, an outline, and the icon from `ImageManager.loadSystem('IconSet')`.
3. Settings `World.defaults.labels = { enabled: true, size: 16, colour: '#ffffff', fade: true }`, and the plugin
   command `Show Event Labels` on/off.
4. In the editor's event Details, two fields that write the notetags.

**Tests.** `scratch/test_event_labels.js`: parsing; range; a label is removed when the event is erased; nothing is
created on a map with no labels (check the per-frame cost with `bench_frames.js`).

## 7.4.7 Other tile sizes and screen sizes (S)

**Steps.**
1. Search `src/` for a bare `48`, `24`, `816` and `624` and list each; each should come from
   `$gameMap.tileWidth()`, `tileHeight()`, `Graphics.width` or `height`. Defaults in function signatures
   (`tw = 48`) are fine when every caller passes the real size: check the callers.
2. Add cases with 32-pixel and 16-pixel tiles to `scratch/test_engine_map.js`, `test_tile_painting.js`,
   `test_room_stamps.js`, `test_map_check.js` and `test_perspective.js`.
3. Make a test project with 32-pixel tiles (MZ's database → System 2 → Tile Size) at 1280 × 720, and run the
   placement, collision, lights, minimap, traversal and 3D rows of `MANUAL_TEST_CHECKLIST.md`. Fix what shows; put
   the result in a `docs/QA_<date>.md`.

**Done when.** The guide says which tile sizes were played.

## 7.4.8 More tabs and parts in the character creators (M)

**Goal.** A folder of the user's own parts shows as extra parts in a creator.

**Where.** Each library is scanned into an index (`DocsDoodads.MzGen.scan`, `Lpc`, `Memao` in `23_*_index.js`) and
shown through a kit (`44_workspace_creator_kits.js`), with slots in `23_*_slots.js`.

**Steps.**
1. MZ first, since its files have a naming rule the scan already parses (`MzGen.parseName`, `family`): let the
   creator take a second folder, "My parts", laid out like MZ's `generator` folder. `MzGen.scan` runs on both and
   `MzGen.mergeIndexes(a, b)` **(new)** joins them, marking the user's parts; a clash of names keeps both.
2. A family the slots don't know becomes a new row under a tab "Extra" (label from the folder name), drawn in the
   layer order its number gives.
3. The Characters card (`44_workspace_mzgen.js`) gets "My parts folder: Choose..." with the same warning the
   libraries have when a folder is inside the project.
4. Recipes (`23_creator_recipe.js`) name which folder a part came from; a recipe whose user part is gone loads
   without it and says so, as today.

**Tests.** `scratch/test_mzgen.js` gains cases: two folders merged; a clash; an unknown family; a recipe with a
missing user part.

## 7.4.9 Say what already works (S)

**Steps.** Under the README's first paragraph, add three short lines with the numbers already measured and where
they are recorded:
- deployed, encrypted games work (`RECOMMENDATIONS.md` 1.4, `docs/QA_2026-10-18.md`);
- free-placed art stands up in the 3D view (README, "3D view");
- a 200 × 200 map with 3,000 doodads and 375 lights runs at 60 frames a second, flat and in 3D (README,
  "Deployed games and speed").

Use the wording and numbers already in the README and the QA records; don't state anything that was not measured.
No code changes; `npm run verify` still passes.
