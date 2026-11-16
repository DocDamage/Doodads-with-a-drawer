# Backlog 8: How to Build Each Item

**Status:** written 15 November 2026. Progress is tracked in RECOMMENDATIONS.md. This is the working detail for
[section 8 of RECOMMENDATIONS.md](../RECOMMENDATIONS.md#8-backlog-easier-better-looking-and-things-no-one-else-does-15-november-2026):
for each row, what to build, where in `src/`, what data it keeps, the steps in order, the tests, and when it is
done.

It is written the way [BACKLOG_7_PLAN.md](BACKLOG_7_PLAN.md) is, and **its "Rules for every item" and "How things
are added here" apply to every item here**. Read those two sections first; they are not repeated.

File and function names were read from the source on the day above. Line numbers are left out because they move:
find a name with a search of `src/`. Names marked **(new)** do not exist yet. If a name here is not in the source
any more, search for the words around it and say so in the pull request rather than guessing. Where an item says
"not read", the code it would change was not opened while this was written; read it before trusting the steps.

Sizes as in `RECOMMENDATIONS.md`: **S** an afternoon, **M** a PR like terrain or water, **L** several PRs.

---

## Rules added for section 8

1. **Editor part or game part.** Since 7.1.1, a part whose first line is `// @editor-only` is left out of
   `Docs-Doodads.game.js`. Anything a player sees (8.3.6, 8.4.1 to 8.4.5, and the in-game half of others) goes in a
   game part (`00`–`17`) and must pass `scratch/test_game_build.js`. Anything else is editor-only.
2. **Nothing leaves the computer unless asked.** 8.3.5, 8.3.8 and 8.5.5 open a network connection. Each is off
   until the user turns it on, says what it will send or serve before it does, and is never in the game build.
3. **What players change goes in the save, not in `data/`.** A deployed game cannot write files
   (`DocsDoodads.FS` refuses). Follow `DocsDoodads.WorldState.store()` (`07_doodad_states.js`), which keeps its
   data on `$gameSystem._docsWorldState`, and keep it small: ids and changes, never whole maps.
4. **A generator is seeded.** One small PRNG passed everywhere, never `Math.random`, so a test can ask for the same
   result twice (as 7.3.5 says).
5. **Watch a new user first** (item E under What's left) before building 8.1 or 8.2. If what they trip on is not
   what a row here fixes, change the row.

## A good order

1. 8.2.1, 8.1.2, 8.4.4, 8.1.5, 8.2.3 (small; no new data format, or one small one).
2. 8.1.1, 8.2.4, 8.1.4, 8.1.3, 8.2.2 (the first day in the editor).
3. 8.5.1, then 8.5.3 and 8.5.2, which need it; 8.3.4 beside them.
4. 8.3.6, 8.3.7, 8.4.7, 8.4.8, 8.3.1 (each stands alone).
5. 8.4.1, then 8.4.2, which shares its save format.
6. 8.5.4, 8.5.5, 8.3.3, 8.4.5, 8.4.3, 8.3.2, 8.4.6, 8.3.5, 8.3.8 (large, risky, or needing the network).

Section 7 rows these lean on: 7.3.2 (collision brush) for 8.3.4 and 8.5; 7.1.5 (normal maps on flat maps) for
8.3.1; 7.3.5 (generated maps) for 8.3.3 and 8.5.2; 7.1.8 (sample project) for 8.1.4; 7.3.1 for 8.5.4's big maps.

---

# 8.1 Easy to use

## 8.1.1 Simple mode (M)

**Goal.** A new user sees four tools and a short Details panel, and can show everything with one switch.

**Where.** The top bar's tools are `toolButtons` in `37_workspace_core.js`. The menus are one list drawn by
`renderMenus` and folded by `foldMenus` (`37_workspace_menus.js`); `menuCommands` feeds Find a Tool. Details is
`renderInspector` with `effectSections` and `renderEffectSections` (`38_workspace_inspector.js`).

**Data.** One editor setting, `simple: true|false` **(new)**, kept where the theme and size are kept (More → Look,
`44_workspace_look.js`; not read). New installs start `true`; an install that already has saved editor settings
starts `false`, so nobody who knows the editor loses a tool.

**Steps.**
1. `DocsDoodads.SimpleMode` **(new)**, a plain object in a part numbered `11`: `tools()` (Select, Stamp, Scatter,
   Tiles), `menuItems(all)` and `sections(all, kind)` each return the short list from the full one. The lists are
   data, so 8.2.4 and a later user-chosen list can reuse them.
2. Filter in the three places above. Never remove a command: `menuCommands` and `paletteCommands()`
   (`39_workspace_map_panel.js`) stay whole, so Ctrl+K reaches everything in either mode.
3. A switch at the end of the top bar ("Show Everything" / "Keep It Simple"), in More → Look, and in the palette.
4. A tool reached from the palette while in Simple mode appears on the bar until the editor closes.
5. The tours (`maybeStartTour`, `44_workspace_onboarding.js`) only run for tools that are shown.

**Tests.** `scratch/test_simple_mode.js`: the lists; the palette has the same commands in both modes; the default
for a new and an old install; shortcuts for hidden tools still work.

**Done when.** A first-time user (item E) finds Stamp and Save without help, and an existing user sees no change.

## 8.1.2 Moods (S)

**Goal.** One click sets light, look, weather and ambience together.

**Where.** Everything a mood sets is there: `DocsDoodads.PostFX.presets` (`08_post_processing.js`) and
`applyPreset` (`41_workspace_visual_postfx.js`); per-map darkness through `Lighting.mapSettings` and
`setMapSettings`; `DocsDoodads.Wind.set`; the preview clock; `DocsDoodads.MapPresets` (`list`, `get`, `save`,
`remove` in `44_workspace_saving.js`), which already saves a map's settings under a name.

**Steps.**
1. `DocsDoodads.Moods` **(new)**: about eight built-in moods as data, each a partial map-settings object plus a
   look name, a preview time and a weather. `apply(mapId, mood)` returns the settings to write; it writes nothing
   itself.
2. Reuse `MapPresets`: a mood is a preset that ships with the plugin and cannot be deleted. Saving the current map
   as a mood is `MapPresets.save` with a flag.
3. A Moods card (Map menu and palette): a tile per mood. While the pointer is on a tile the map shows it (apply,
   without an undo step); leaving puts the map back; a click applies it as one undo step.
4. Weather in MZ is set by event command, not by map. Check how the plugin's storm is started before deciding
   whether a mood stores weather per map or only previews it (not read).

**Tests.** `scratch/test_moods.js`: each built-in mood names a look and settings that exist; hover then leave
changes nothing; apply is one undo step; a mood survives `MapSettingsCopy`.

## 8.1.3 Good settings on drop (M)

**Goal.** A lamp dropped on the map is lit; a tree sways and can be walked behind.

**Where.** Defaults for a new doodad come from `propertyDefaults` (`38_workspace_inspector.js`). Light presets are
`DocsDoodads.LightPresets` (`06_render_lights_directional.js`). Trace from Art is
`DocsDoodads.Collision.footprintFromAlpha` (`30_collision.js`, used in `42_workspace_assets_maps.js`). The bag's
items and their tags are in `DocsDoodads.AssetIndex` (`21_assetindex_metadata_cache.js`).

**Steps.**
1. `DocsDoodads.Guess` **(new)**, pure: `kindOf({ name, tags, folder, width, height })` → `lamp`, `tree`, `bush`,
   `rock`, `building`, `fence`, `water`, `fire`, `sign` or `null`, from words in the name, tags and folder (a table
   of words per kind, in English, open to the language file) and from shape (tall and narrow, wide and low).
   `settingsFor(kind)` → the settings to add.
2. On the first placement of an item, merge `settingsFor` under the item's own saved defaults: a default the user
   set always wins.
3. Say what was done in the placement message ("Placed Lamp: lit after dark. Undo settings"), with the Undo link
   the message history already has. A tick in Settings turns guessing off.
4. Remember the guess on the item (in the library's metadata) so every later placement matches, and so Details can
   show "Guessed: lamp" with a way to change the kind.

**Tests.** `scratch/test_guess.js`: a table of file names and the kind each gives; an unknown name gives `null` and
changes nothing; the user's defaults win; turned off, nothing is added.

**Watch out.** A wrong guess is worse than none. Start with few kinds and exact words; leave a name that matches
two kinds alone.

## 8.1.4 A first-map quest (S)

**Goal.** In place of the welcome card, five steps that tick themselves off.

**Where.** The welcome card is in `37_workspace_core.js` (search "three steps to get going"). Tours are
`startTour`, `renderTour` and `placeTour` in `44_workspace_onboarding.js`, with `scratch/test_onboarding.js`.
Sample art is `DocsDoodads.SampleArt`.

**Steps.**
1. `DocsDoodads.Quest` **(new)**, pure: steps as data, each `{ id, text, done(state) }` where `state` is counts the
   editor already has (doodads placed, lights on the map, the preview clock's hour, saved). `progress(state)`.
2. A small card that stays at a corner, drawn from `progress`; each step points at its control with the tour's
   arrow (`placeTour`). The steps: place three things, add a lamp, make it night, press Play From Here, save.
3. "Skip" and "Not now" on the card; replay from How to Use, beside `replayTours`.
4. With no art in the project, the first step offers Add Sample Items.

**Tests.** Add to `scratch/test_onboarding.js`: each step's `done` for a state before and after; skip is
remembered; the card never shows again once finished.

## 8.1.5 Help where you are (S)

**Goal.** A ? on each panel opens its part of the guide; the guide's headings are in Find a Tool.

**Steps.**
1. A build step, `npm run help` **(new)** (`scripts/`), reads the headings of `Docs_Doodads_Guide.md` and writes a
   generated part holding `{ title, anchor, firstParagraph }` for each, as `npm run shortcuts` writes its table.
   Add a check to verify that it is current.
2. Each panel and card names its guide anchor (`data-dd-help`). A ? button in its title bar opens a help card with
   the paragraph and "Open the guide" (the file, at that heading).
3. Add each heading to `paletteCommands()` as "Help: ...".

**Tests.** `scratch/test_help_index.js`: every `data-dd-help` in `src/` names a heading that exists; the generated
part matches the guide.

**Watch out.** The guide's text ships in the plugin file this way. Keep only the first paragraph of each section,
and make the part `@editor-only`.

---

# 8.2 Look and feel

## 8.2.1 A bigger window while editing (S)

**Goal.** The Playtest window fills the screen while the editor is open and goes back on Done.

**Where.** The plugin already takes `nw.Window.get()` in `45_scene_map_integration_key_bindings.js`, for the close
listener, behind `editorMode && DocsDoodads.Compat.isTest()`. Opening and closing the editor is in
`37_workspace_core.js` (search `mounted`).

**Steps.**
1. `DocsDoodads.EditWindow` **(new)**, with the window passed in so a test can use a stand-in: `grow(win)` keeps the
   window's place and size, then maximizes; `restore(win)` puts them back. Do nothing if the user had already
   resized or maximized the window themselves.
2. Call `grow` when the editor mounts and `restore` when it unmounts, and on the close listener.
3. A setting, "Bigger window while editing", on by default, in Settings and More → Look.
4. MZ scales its canvas to the window. Check that picking on the map (`clientToMapCoords`,
   `44_workspace_canvas_input.js`) is right at the new size, flat and in 3D, and at 125% and 150% editor size.

**Tests.** `scratch/test_edit_window.js`: grow then restore gives the first size back; a window the user maximized
is left alone; turned off, nothing is called.

**Done when.** On a 1920 × 1080 screen the map shows far more tiles while editing, and after Done the game is in
the window it started in.

## 8.2.2 A ghost of what will be placed (S)

**What is true today.** There is a ghost: `showGhost` (`44_workspace_canvas_input.js`) moves an HTML picture
(`dd-map-ghost`) with the pointer, at most 144 pixels, over everything, with a fixed drop shadow. It does not show
the item's own scale, depth, light or shadow, and it does not go behind what it would go behind.

**Goal.** The ghost is a real doodad sprite in the map, drawn exactly as the placed one will be.

**Steps.**
1. Make a doodad object the way the placement code does, but do not add it to the map's list: hand it to the
   spriteset as a preview sprite (see `addDoodadSprites`, `44_workspace_canvas_input.js`) with its alpha lowered.
2. Move it each pointer move; it sorts by base line, casts its shadow and shows its light, because it is the same
   sprite class.
3. Scatter, Paint and Path show the whole stroke's next placement the same way, up to a small number of sprites.
4. Keep the HTML ghost for dragging from the bag before the pointer reaches the map.

**Tests.** On the stand-in engine (`scratch/test_engine_map.js` as the model): the preview sprite is never in
`$dataDocsDoodads`, never saved, never captured, and is gone after Esc, a tool change and a map change.

## 8.2.3 Moving tooltips (S)

**Where.** Tooltips are `showTooltip`, `decorateTooltip` and `installTooltips` in `36_ui_theme_feedback.js`.

**Steps.**
1. A tooltip may carry a clip: a small sprite strip (frames side by side, one PNG per tool, about 160 pixels wide)
   played with CSS steps. Draw the strips with a script from recorded playtests and embed them the way
   `npm run icons` embeds the icons.
2. Show the clip only after the tooltip has been up for a moment, and never with Less motion on.
3. Budget: the ten tools only, and a size limit checked by verify. The clips go in an `@editor-only` part.

**Tests.** Add to the tooltip suite: Less motion shows no clip; a control with no clip is unchanged.

**Watch out.** The plugin is one file; ten clips can add several hundred kilobytes. Measure first, and drop the
row if the editor build grows by more than is worth it.

## 8.2.4 Details that starts short (M)

**Goal.** Details shows the few settings most used for the kind of thing picked, with the rest under More.

**Where.** `renderInspector`, `effectSections`, `renderEffectSections` and `placementSection`
(`38_workspace_inspector.js`). Sections already remember open and closed, and ☆ pins them (6.3.18).

**Steps.**
1. Count which settings are changed, per kind of thing (a picture, a light, a sound, a model, an event), in the
   editor's own settings on this computer. Nothing is sent anywhere.
2. `SimpleMode.sections(all, kind)` (8.1.1) returns a starting list per kind; the counts reorder it once there is
   enough use.
3. Draw the short list, then a "More" row that opens the rest. A search box at the top of Details filters every
   setting by name, shown or not.
4. Pinned sections always show.

**Tests.** `scratch/test_details_short.js`: the starting list per kind; a pinned section is never under More; the
search finds a hidden setting; mixed selections use the settings the picked things share.

---

# 8.3 Features

## 8.3.1 Normal maps made for you (M)

**Goal.** With 7.1.5 built, a picture gets a normal map without the user drawing one.

**Where.** 7.1.5 says how lights use a normal map on flat maps. For models, tangents and shading are
`DocsDoodads.Gltf.tangentsFor` and `shade` (`12_visual_equipment_map_destination.js`). Generated files belong in
the plugin's cache folder, `data/docs_doodads_cache/`.

**Steps.**
1. `DocsDoodads.NormalGen` **(new)**, pure, on pixel arrays: `heightFromAlpha(pixels, w, h)` (distance from the
   edge of the opaque shape, so shapes look rounded), mixed with brightness by a strength; `normalsFromHeight`
   (a Sobel filter); `encode` to RGB.
2. Make the map the first time a lit doodad's picture is used, off the main frame (in slices, with
   `Ui.progress`), and write it to the cache. The art packer must put it in deployed games.
3. Details: "Shading: Off / Made for me / From file", with Strength and Rounded or Flat. A picture with a
   hand-made `_n` file beside it uses that file.
4. Sheets and animated strips: make the map per frame, never across frame edges.

**Tests.** `scratch/test_normal_gen.js`: a flat square gives normals pointing straight out; a circle's normals
point away from its centre; frames do not bleed; the same picture gives the same bytes.

## 8.3.2 Bounced light and soft shadows (L)

**Goal.** Shadows with soft edges, and light that comes a little way round corners.

**Where.** Walls that stop light are `DocsDoodads.Occlusion` (`settings`, `regions`, `visibility`, `cast` in
`06_render_lights_directional.js`), drawn by `15_spriteset_map_lights_directional.js`. The lightmap starts at
`Lighting.lightmapBase` (`06_render_effects.js`).

**Steps.**
1. *(PR 1)* An occluder picture of the screen (walls, and doodads and events that stop light) at half size, and a
   distance field from it by jump flooding: about eight passes between two render textures, each a GLSL ES 1.00
   fragment shader.
2. *(PR 2)* Soft shadows: for each light, march from the pixel to the light through the distance field and darken
   by the nearest miss. Replace `cast`'s hard mask only when the map turns it on.
3. *(PR 3)* Bounce: one blurred, dimmed copy of the lit picture added back near lit walls. Call it what it is in
   the UI ("Glow off walls"), not global illumination.
4. A per-map switch and a place in Effects Quality: off at Low, shadows at Medium, bounce at High.

**Tests.** Shader text checked for ES 1.00 by the existing shader suite; on the stand-in engine, the passes are
made once, resized with the screen and destroyed with the spriteset. `node scratch/bench_frames.js` before and
after.

**Done when.** A torch beside a pillar throws a soft shadow at 60 frames a second on the 200 × 200 test map.

**Watch out.** Draw calls and fill rate. Item B's real slow computer should say whether this may be on by default.

## 8.3.3 More like this (L)

**Goal.** Lasso an area; the tool fills another region in the same way.

**Where.** A form of 7.3.5; build `DocsDoodads.Generate` first. Tiles go on with `Tiles.paint`
(`31_tile_painting.js`), doodads with `Biome.paint` and `Dress.plan` (`11_editor_tools.js`).

**Steps.**
1. *(PR 1)* `Generate.learn(sample)` **(new)**: from the lassoed tiles, a table of which tile kinds sit beside
   which, in four directions, with counts; and for doodads, how many of each picture per tile kind and their
   spacing. Doodads are learned as a biome, not by position.
2. *(PR 2)* `Generate.fill(region, model, rng)`: wave function collapse over tile kinds (autotile kinds, not
   shapes: `Tiles.reshape` picks shapes after), restarting a small area on a dead end, with a step limit and
   `Ui.progress`. Then scatter doodads by the learned biome.
3. *(PR 3)* The tool: lasso a sample, drag a region, preview on the overlay, Reroll, Apply as one undo step.

**Tests.** `scratch/test_generate_learn.js`: a checkerboard sample gives a checkerboard; the same seed gives the
same fill; every filled tile's neighbours were seen in the sample; a sample too small says so.

## 8.3.4 A ground brush (M)

**Goal.** Paint dirt, grass and stone with soft edges, off the grid.

**Where.** Background and Overlay Layers are `DocsDoodads.MapLayers` (`normalize`, `list` in
`07_map_layers_weather.js`), drawn by `15_spriteset_map_layers_weather.js`. A painting tool's model is the Regions
tool (`44_workspace_regions.js`).

**Data.** A painted layer is a picture, not JSON: `img/doodads/ground/Map###_<layer>.png` **(new)**, one mask
picture per map with a channel per texture (four textures a mask), at a quarter of the map's pixel size. The map's
settings name the textures.

**Steps.**
1. A game part draws it: a sprite under the doodads that mixes up to four repeating textures by the mask's
   channels, in one shader. In 3D, lay it on the ground as the floor decals are (not read).
2. The tool (`toolHooks.ground`): pick a texture, a round brush with a soft edge and a strength, `[` and `]` for
   size, right-drag erases. Paint into a canvas; write the PNG on save through `DocsDoodads.FS`.
3. Undo: keep the changed rectangle of the mask per stroke, not the whole picture.
4. The packer and `RequiredAssets` (`22_required_assets.js`) must count the mask and its textures as used.

**Tests.** `scratch/test_ground_brush.js`: brush weights; a stroke is one undo step and restores the same pixels;
a map with nothing painted writes no file; the mask is listed as a required file.

## 8.3.5 The playtest on a phone (M)

**Goal.** Open the running project on a phone from a QR code, with edits showing as they are saved.

**What is true today.** `20_fs.js` uses Node's `fs` and `path`; nothing uses `http`.

**Steps.**
1. `DocsDoodads.LanPreview` **(new)**, `@editor-only`: a small `http` server on the project folder, read-only,
   that serves only files under the project and refuses `..`. Off until the user picks View → Phone Preview, which
   says "Anyone on this network can see this project until you stop" and asks first.
2. Show the address as a QR code (a small QR writer of its own, as the GIF writer is) with a Stop button, and stop
   it when the editor closes.
3. On save, the phone reloads the map: the page polls a tiny `/changed` address for the last save time.
4. The phone runs the full plugin with the editor off (`Compat.isTest()` is false there).

**Tests.** `scratch/test_lan_preview.js`: paths outside the project are refused; the server is closed on Stop and
on unmount; the QR writer against known codes.

**Watch out.** This opens a port. Bind it to the local network address only, never start it by itself, and keep it
out of the game build.

## 8.3.6 A photo mode for players (S)

**Goal.** In the game: pause, move the camera, pick a look, save a picture.

**Where.** Capture's drawing is `renderSceneCanvas` and `capturePicture` (`44_workspace_capture.js`, editor-only);
looks are `PostFX.presets`; the 2D camera is `DocsDoodads.Camera2D` and the public `zoomTo` and `freeCamera`.

**Steps.**
1. Move the part of Capture that draws the scene into a game part; the editor's Capture keeps using it.
2. `Scene_DocsPhoto` **(new)** or a mode on the map scene: the game stops, the arrow keys move the camera within a
   few tiles of the player, the wheel zooms, a row of looks, and Hide Player.
3. Saving: a desktop game writes into a `screenshots` folder beside the game; a browser game downloads the PNG.
4. Plugin command "Open Photo Mode", a parameter for a key, and a switch that forbids it (for cutscenes).

**Tests.** `scratch/test_photo_mode.js` on the stand-in engine: the camera is back where it was after leaving; the
look in use before is put back; forbidden by switch.

## 8.3.7 Playtest trails (M)

**Goal.** See where testers walked, stopped and died, over the map in the editor.

**Steps.**
1. `DocsDoodads.Trails` **(new)**: while a playtest runs with the editor closed, count steps per tile, seconds
   stood per tile, and mark Game Over, per map. Kept in memory, written to
   `data/docs_doodads_cache/trails.json` when the editor opens or the game closes (playtest only).
2. View → Show Trails: a heat layer from the counts (colours from `Ui.mapColor`, with a key), a card with the
   longest stops and every Game Over with Go To, and Clear.
3. "Bring in a tester's trails": a tester's build can be asked to write the file (a plugin parameter, off by
   default); the editor merges files dropped onto it.

**Tests.** `scratch/test_trails.js`: counts for a known walk; merging two files adds them; a map deleted in MZ is
dropped; nothing is written outside a playtest unless the parameter is on.

## 8.3.8 Plain words in Find a Tool (M)

**Goal.** "Make it a rainy night" does it.

**Where.** `DocsDoodads.CommandPalette` (`score`, `rank` in `11_editor_tools.js`) and `paletteCommands()`. The
palette already takes typed values (`time 18:30`, `season winter`).

**Steps.**
1. *(Without the network, first.)* A table of phrases to commands with values ("night" → `time 21:00`, "rain",
   "foggy", "bigger", "darker"), in the language file, so several words in one line run several commands. This
   may be all most users need; ship it alone and see.
2. *(Then, only if wanted.)* Settings → "Use a language service": the user's own key, kept on this computer
   outside the project, never in `data/` and never in a pack. The palette sends only the typed line and the list
   of command names, gets back command names and values, shows them, and runs them on Enter.
3. Every command it may run is one the palette already has; nothing is run that the user has not seen.

**Tests.** `scratch/test_plain_words.js`: phrases to commands; an unknown phrase runs nothing; with no key, nothing
is sent (a stand-in for `fetch` that fails the test if called).

---

# 8.4 Things no one else does

## 8.4.1 Decorate mode for players (L)

**Goal.** In the finished game, the player places and moves things the maker chose, where the maker allows, and it
is kept in the save.

**Where.** The public API can already `place`, `move`, `set`, `remove` and `find` doodads at run time
(`07_public_api.js`). What a player changes is kept the way `WorldState` keeps states
(`$gameSystem._docsWorldState`, `07_doodad_states.js`). Collision is `DocsDoodads.Collision`
(`14_collision_runtime.js`). The editor's own placement code is editor-only and must not be used here.

**Data.** In the save: `$gameSystem._docsDecor = { [mapId]: [{ id, item, x, y, flip, state }] }` **(new)**. In the
project: `$dataDocsDoodads.decor = { catalog: [{ id, item, name, price, limit, tags }], zones: { [mapId]: ... } }`
**(new)**, through `DataFiles`. A zone is a region number or a rectangle.

**Steps.**
1. *(PR 1)* `DocsDoodads.Decor` **(new)**, pure: `canPlace(zone, item, x, y, placed)` (inside the zone, not on
   another piece, not blocking the only way out: use `MapCheck.reach`'s flood, moved to a game part), `snap`,
   `add`, `move`, `remove`, `limitLeft`.
2. *(PR 2)* The run time: placed pieces become doodads when the map loads (through the same path
   `WorldState.mapLoaded` uses), with their collision, lights and states.
3. *(PR 3)* The player's UI, as an MZ scene or a mode on the map, drawn with MZ windows so it matches the game's
   skin, not the editor's HTML: a list of pieces, a cursor that moves by tile, green or red under the piece,
   Rotate or Flip, Pick Up, Done. Keyboard, gamepad, mouse and touch.
4. *(PR 4)* The maker's side in the editor: a Decorate card to build the catalog from the bag, mark zones (a region
   or a dragged box), set limits and prices; plugin commands Open Decorate Mode, Give Decor Item, Count Decor.
5. *(PR 5)* Pieces as items: an option to take pieces from, and return them to, the party's inventory.

**Tests.** `scratch/test_decor.js`: every rule in `canPlace`; save and load round trip; a piece whose picture was
removed from the project is skipped with a warning, not an error; the limit; the game build runs it with the
editor absent.

**Done when.** In a deployed, encrypted game, a player furnishes a room, saves, quits, loads, and the room is as
they left it; they cannot wall themselves in.

**Watch out.** Save size (keep ids and numbers only). Old saves after the maker changes a zone or the catalog:
keep what still fits and hand back what does not.

## 8.4.2 A world that remembers (L)

**Goal.** Worn paths, trails in snow, things that grow over days, and broken things that stay broken.

**Where.** Grass that bends is `DocsDoodads.React` (`touching`, `push`, `step` in
`09_particles_vfx_reactive_doodads_character.js`). Snow is `SnowCover` (`13_perspective_mode.js`). Days are
`DocsDoodads.Calendar`. States kept in saves are `WorldState`. Footsteps by ground are `DocsDoodads.Footsteps`.

**Steps.**
1. *(PR 1, growth.)* A doodad setting "Grows": a list of states with the days each lasts. On a new day
   (`Calendar`) the state steps on, through `WorldState.setState`. No new save data. This alone is farming.
2. *(PR 2, wear.)* `DocsDoodads.Wear` **(new)**: a small grid per map of how often a tile was stepped on, eased
   down each day, kept in the save as a short run-length string. The game draws a path texture where the count is
   high (the ground brush's shader, 8.3.4, with the wear grid as one more mask).
3. *(PR 3, trails.)* Footprints in snow and sand as short-lived decals, by the ground under the feet; snow fills
   them over time.
4. Each is a per-map switch, off by default.

**Tests.** `scratch/test_wear.js`: counts rise and ease down; the save string round-trips; a map with it off
keeps nothing; growth steps on the right day and stops at the last state.

## 8.4.3 Elements that spread (L)

**Goal.** Fire spreads on dry grass with the wind; rain puts it out and leaves puddles; water runs downhill.

**Where.** `DocsDoodads.Wind` (`now`, `current`), the storm weather, `Terrain.heightAt` (`13_perspective_mode.js`),
states and their effects (`States`, `StateFx`), particles and lights.

**Steps.**
1. *(PR 1)* `DocsDoodads.Elements` **(new)**, pure, a slow cellular step (a few times a second, never per frame):
   a grid of tiles with `fuel`, `wet` and `burning`; fire moves to neighbours with fuel, more often downwind;
   rain raises `wet`, which stops fire; `wet` drains downhill by `heightAt`. Seeded.
2. *(PR 2)* Doodads take part by tag: "Burns" (enters its Burnt state when its tile burns out), "Lights fires"
   (a campfire), "Puts out". Burning tiles show the fire particles and a light already in the plugin.
3. *(PR 3)* Puddles: where `wet` stays high, a puddle decal with the water reflection; they dry.
4. Plugin commands Start Fire At, Put Out Fires, and a switch per map. Burnt states are kept by `WorldState`.

**Tests.** `scratch/test_elements.js`: fire goes downwind more than upwind over many seeded runs; rain stops it;
water ends at the lowest tile; the step never runs when the map has it off.

**Watch out.** A fire that burns a quest item, or a town. Off by default, only tiles and doodads the maker
marks, and a "Fireproof" region.

## 8.4.4 Maps that move to the music (S)

**Goal.** Lights pulse and plants sway in time with the BGM.

**Where.** The plugin already builds on MZ's audio graph: `SpatialSound.echoBus`
(`15_spriteset_map_doodad_layer_hooks.js`) uses `WebAudio._context` and `WebAudio._masterGainNode`. Motion
(sway, pulse, flicker) is `DocsDoodads.Motion` (`06_render_effects.js`).

**Steps.**
1. `DocsDoodads.Beat` **(new)**, a game part: an `AnalyserNode` fed from the BGM (not the master, so sound effects
   don't count; find the BGM's node the way `echoBus` finds the map sounds'). Once a frame, read the spectrum
   and keep three eased numbers, `low`, `mid`, `high`, and `kick` (true on a jump in `low`).
2. Motion and lights gain "With the music": which band, and a strength. They multiply their amount by the band's
   value. No per-doodad analyser: one read a frame, shared.
3. Make no analyser until a doodad on the map uses it. With audio off or not started, the bands are 0.
4. `DocsDoodads.api.beat()` for scripts, and a "Kick" trigger for particles.

**Tests.** `scratch/test_beat.js`, with a stand-in analyser: easing; `kick` on a step in `low`; no analyser is
made on a map with no user; values are 0 without audio.

## 8.4.5 Map eras (L)

**Goal.** One map in several versions, shown one over another in the editor and crossfaded in the game.

**Where.** Layers that hide in the game are `DocsDoodads.Layers` (`11_runtime_editor_dependencies.js`). States
crossfade through `States` and `Transition`. Per-map data goes through `DataFiles`.

**Steps.**
1. *(PR 1)* An era is a tag on a doodad: `eras: [ids]`, absent meaning every era. `$dataDocsDoodads.eras[mapId] =
   { list: [{ id, name }], pick: { switch | variable } }` **(new)**. `DocsDoodads.Eras` **(new)**: `current(mapId)`,
   `visible(doodad, era)`.
2. *(PR 2)* The game shows only the current era's doodads, with a fade when it changes on the map. Collision and
   lights follow what shows.
3. *(PR 3)* The editor: an era picker in the top bar; "Only in this era" on what is picked; the other eras' doodads
   drawn faint (onion skin) with a slider; Copy Era.
4. *(Later.)* Tiles per era need a second set of map tiles; leave tiles alone in the first three PRs and say so.

**Tests.** `scratch/test_eras.js`: visibility; a doodad with no `eras` is in all; deleting an era asks what to do
with its doodads; old data with no eras loads unchanged.

## 8.4.6 Rewind in a playtest (L)

**Goal.** Hold a key to go back up to 30 seconds, change the map, and play the same moment again.

**Steps.**
1. `DocsDoodads.Rewind` **(new)**, `@editor-only`, playtest only: every half second, keep a snapshot made the way
   MZ makes a save (its `DataManager` save contents, in memory, not on disk), in a ring of 60.
2. Holding the key steps back through the ring, loading each snapshot the way MZ loads a save, then lets go into
   play.
3. With the editor: after a rewind, F10 opens the editor at that moment; Done plays on from it.
4. Leave out what a snapshot cannot hold: sounds in mid-play, running Effekseer animations, a battle. Say so in
   the UI, and turn the key off in battles and menus.

**Tests.** `scratch/test_rewind.js` on the stand-in engine: the player's place, switches and variables after a
rewind match the snapshot; the ring drops the oldest; nothing is written to disk.

**Watch out.** MZ's save contents are not read here. Measure how long one snapshot takes on a large project before
building the rest; if it stutters, snapshot only the map, player, switches and variables.

## 8.4.7 A robot tester (M)

**Goal.** A bot walks everything it can reach and lists what is wrong.

**Where.** `DocsDoodads.MapCheck.reach` (`11_editor_tools.js`) floods the tiles the player can walk to; Problems
(`44_workspace_map_check.js`) lists and has Go To.

**Steps.**
1. *(Without playing, first.)* Follow transfers: from the starting map, `reach` each map, read its transfer
   events, and go on, to build a graph of maps. Report maps that cannot be reached, transfers that land on a
   blocked tile or outside the map, and one-way trips with no way back. This needs no running game.
2. *(Then, playing.)* In a playtest, a bot that walks to each reachable tile's events and touchable doodads and
   presses Action, at many times normal speed, with a time limit per event; it records console errors, events
   that never finish, and places it could not leave.
3. A report card with Go To for each finding, and "Test This Map" and "Test Every Map" in the Map menu.

**Tests.** `scratch/test_robot.js`: a three-map project with a dead end and a one-way door gives those two
findings; a loop of transfers ends.

**Watch out.** The bot changes switches and gives items while it plays. Run it on a copy of the game's state and
throw it away after.

## 8.4.8 The 3D map as a file (M)

**Goal.** Write the ground and standing doodads as a glTF file.

**Where.** The ground's mesh is `Terrain.buildMesh` (`13_perspective_mode.js`). `DocsDoodads.Gltf`
(`12_visual_equipment_map_destination.js`) reads glTF; nothing writes it.

**Steps.**
1. `DocsDoodads.GltfWrite` **(new)**, `@editor-only`, pure: positions, normals, texture coordinates and indices in,
   a `.glb` (one binary file) out. Test it by reading the result back with `Gltf.parse`.
2. The ground: `buildMesh`'s buffers, with the map's tiles drawn into one texture (the map picture export,
   `DocsDoodads.MapExport`, already draws the whole map).
3. Standing doodads and tileset objects as upright quads with their pictures; models as they are.
4. Map menu → "Save 3D Map as File", with size and "ground only" choices, written to `screenshots`.

**Tests.** `scratch/test_gltf_write.js`: a round trip through `Gltf.parse` gives the same counts and bounds; a flat
map gives two triangles a tile or fewer; file size for the 200 × 200 map is under a limit.

**Watch out.** Licences: the file carries the project's art. Say so in the dialog; never write it without a click.

---

# 8.5 Maps from a picture or a real place

Build in the order 8.5.1, 8.5.3, 8.5.2, 8.5.4, 8.5.5. They share one object, `DocsDoodads.MapFrom` **(new)**, and
one rule: a picture is turned into a **plan** (plain data), the plan is shown, and only Apply changes the map, as
one undo step.

**The plan.** `{ w, h, kind, cells: [classId per tile], heights: [number per tile] | null, features: [{ type, x, y,
w, h, name }] }` **(new)**. `classId` names a row of the key (water, forest, road...). Everything after the picture
(8.5.2), and everything after the download (8.5.5), works on this and nothing else, so each can be tested without
a picture or a network.

## 8.5.1 Trace over a picture (S)

**Goal.** A picture under the grid to paint over. Never in the game.

**Data.** `$dataDocsDoodads.trace[mapId] = { file, x, y, scale, turn, alpha, show }` **(new)** (editor only). The
picture is copied to `data/docs_doodads_cache/trace/`, which is not deployed.

**Steps.**
1. Map menu → "Trace a Picture": pick or drop a picture. Draw it on the editor's overlay, under the grid and
   above the map, with an opacity slider and Show/Hide in the View menu.
2. Fit it: drag to move, handles to scale and turn (the doodad handles' code), and "Fit to Map". Two-point fit:
   click two places on the picture and the two tiles they should be.
3. Lock it once fitted, so the tools work through it.
4. Capture and the map picture export must not draw it; `RequiredAssets` must not list it.

**Tests.** `scratch/test_trace.js`: the two-point fit's numbers; the data round-trips both ways of saving; a map
with no trace writes no key; the file is not in the required list.

## 8.5.2 A picture into a map (L)

**Goal.** A drawing becomes tiles, hills and doodads, after the user agrees a key.

**Where.** Tiles: `DocsDoodads.Tiles.paint`, `shapeFor` and `reshape` (`31_tile_painting.js`). Hills:
`Terrain.applyBrush` and `buildHeights` (`13_perspective_mode.js`). Doodads: `Biome.paint` and `Dress.plan`
(`11_editor_tools.js`). Regions: the Regions tool (`44_workspace_regions.js`).

**Steps.**
1. *(PR 1, reading.)* `MapFrom.read(pixels, w, h, { tilesW, tilesH, colours })`, pure: shrink the picture to one
   sample per tile (the commonest colour in the tile, not the average, so edges stay sharp); group the colours
   (median cut down to at most twelve); return the groups with how many tiles each covers.
2. *(PR 2, the key.)* A card: each colour group as a swatch beside a choice of class (from the kind's list, 8.5.3,
   or "Leave alone"), guessed from the colour (blues to water, greens to grass or forest, greys to stone or road)
   and always changeable. The plan is redrawn on the overlay as choices change.
3. *(PR 3, building.)* `MapFrom.build(plan, kind)` returns lists, and Apply runs them in one undo step: tiles
   through `Tiles.paint` then `reshape` for autotile edges; heights through the terrain data `applyBrush` writes;
   regions; doodads through `Biome.paint` per class and `Dress.plan` for rules.
4. *(PR 4, cleaning.)* Before the key: Crop, "Ignore lines thinner than N" (removes labels and grid lines by a
   small erode then dilate), "Smooth edges", and a second picture for heights (grey: dark low, light high).
5. Size: ask for the map's size in tiles first, show how many pixels a tile covers, and warn when it is under two.

**Tests.** `scratch/test_map_from_read.js` and `test_map_from_build.js`: a picture of four coloured quarters gives
four groups and the right tiles; a thin line is ignored when asked; the same picture gives the same plan; building
a plan paints the tiles the plan names and is one undo step; "Leave alone" leaves the tiles alone.

**Done when.** A hand-coloured island drawing becomes a map with a coast, a forest, a road and hills, and the
user fixes what is wrong with the ordinary tools.

**Watch out.** It needs a tileset with the tiles the classes name. Ask which tile each class uses the first time,
remember it per tileset, and say plainly when the tileset has nothing for a class.

## 8.5.3 What kind of map (M)

**Goal.** Overworld, town or castle, dungeon or cave, room: each with its own scale, key and rules.

**Data.** `$dataDocsDoodads.mapKinds = [{ id, name, scale, classes: [{ id, name, tile, region, biome, height,
passable }], features: [...], rules }]` **(new)**, with four built in and the user's own beside them; carried in
packs (`22_doodad_packs.js`).

**Steps.**
1. `MapFrom.kinds()`, `kind(id)`, and for each built-in kind a `finish(plan)` step run before building:
   - **Overworld:** coast smoothing; mountains from height; a marker feature wherever the key's "place" colour
     appears, named by the user.
   - **Town or castle:** closed outlines become buildings (walls round, a roof inside, a door on the side facing
     the nearest road); long thin shapes become walls with a gate where a road crosses.
   - **Dungeon or cave:** read lines as well as fills: a dark line is a wall, the space it encloses is floor, a
     gap is a door, a marked square is stairs. Caves roughen the walls with seeded noise.
   - **Room:** one outline; doors and windows on its edges; furniture from `DocsDoodads.Rooms` stamps and prefabs
     by the room's name ("bedroom", "shop").
2. The kind is asked first in 8.5.2's card and is kept in the map's settings, so later tools know it.
3. An editor for kinds: copy a built-in one, change its classes and tiles.

**Tests.** `scratch/test_map_kinds.js`: each `finish` on a small hand-made plan (a square outline becomes a
building with one door facing the road; a line plan becomes walls and floor with every room reachable by
`MapCheck.reach`); a user kind survives a pack round trip.

## 8.5.4 Maps inside maps (L)

**Goal.** A marker on the overworld opens its town; a door opens its rooms; transfers both ways are made.

**What is true today.** The editor reads `MapInfos` (`38_workspace_inspector.js`, `22_required_assets.js`) but
never makes a map file. Events are made by `DocsDoodads.Events.createEventObject`, `allocateSafeId` and
`nearestFreeTile` (`28_events.js`) from `DocsDoodads.EventTemplates` (`29_eventtemplates.js`), which has transfer
and door templates. Neighbouring maps are `DocsDoodads.MapLinks` (`layout`, `bounds`, `edgeCopies` in
`31_placement_tools.js`).

**Steps.**
1. *(PR 1, making a map.)* `DocsDoodads.NewMap` **(new)**: write `data/Map###.json` (an empty map of a size and
   tileset) and add its entry to `data/MapInfos.json`, both in one all-or-nothing save with backups, through the
   saving code in `33_persistence_saving.js`. Test this alone, and in MZ, before anything uses it.
2. *(PR 2, linking.)* `$dataDocsDoodads.places = [{ id, name, mapId, parent: { mapId, x, y } }]` **(new)**. A
   feature in a plan (a town marker, a door, stairs) gets "Make its map" or "Use a map": this makes the map if
   asked, a transfer event at the feature, and one back at the new map's entrance.
3. *(PR 3, the tree.)* A Places panel: world, then places, then rooms, with map pictures (`DocsDoodads.MapThumb`),
   Go To, and a mark on any link whose transfer is missing or lands on a blocked tile (8.4.7's first step).
4. *(PR 4, big pictures.)* A picture wider or taller than 256 tiles is cut into maps on a grid, joined with
   `MapLinks` so World View shows them as one. Walking between them with no fade is 7.3.1.

**Tests.** `scratch/test_new_map.js`: the map file and `MapInfos` are both written or neither; ids never clash;
`scratch/test_places.js`: a link makes two transfers that point at each other; deleting a place asks about its
map and removes neither silently.

**Watch out.** RPG Maker MZ holds `MapInfos` in memory while it is open and will write its own copy over the
plugin's when the user saves there. The conflict check that guards map files must cover `MapInfos.json`, and the
editor must say "Close and reopen the project in RPG Maker MZ to see the new map". Find out by hand what MZ does
with a map made behind its back before writing PR 2.

## 8.5.5 A real place (L)

**Goal.** Pick an area of the world and get its roads, water, forests, buildings and hills as a plan.

**Steps.**
1. *(PR 1, without the network.)* `MapFrom.fromGeo(features, heights, box, kind)`, pure: map features (lines and
   shapes with a type, in longitude and latitude) and a grid of heights in; a plan out. Roads and rivers are drawn
   as lines of tiles with a width by type; shapes are filled; heights are scaled to the plugin's hill range.
   Tested entirely from small files kept in `scratch/`.
2. *(PR 2, from a file.)* "From a Map File": the user downloads an OpenStreetMap extract (`.osm` or GeoJSON) and a
   height picture themselves and drops them in. No connection is made. This may be enough; ship it and see.
3. *(PR 3, the download, only if wanted.)* A card to type a place or paste coordinates, pick the area and the
   kind (8.5.3); it says what will be asked of which service, then asks. One request an area, a size limit, the
   answer kept in the cache folder so the same area is never asked for twice.
4. The credit: OpenStreetMap's data is under the ODbL and needs "© OpenStreetMap contributors" shown. Write it
   into a `CREDITS_MAPS.txt` in the project, as the LPC creator writes `CREDITS_LPC.txt`, and say so on Apply.

**Tests.** `scratch/test_map_from_geo.js`: a river and a road crossing give a bridge feature; a lake is filled; a
slope gives rising heights; an empty area gives an empty plan. For PR 3: nothing is requested before the user
agrees (a stand-in for `fetch` that fails the test if called), and a cached area is not requested again.

**Watch out.** Before PR 3, read the current terms of whichever map and height services are used (how many
requests, what credit, whether a key is needed); they were not checked while this was written. Scale: a tile a
metre makes a town of 256 metres a side; say the real size of the area in the card before anything is built.
