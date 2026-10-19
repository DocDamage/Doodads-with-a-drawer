# Improvements Plan: the Character Creators and the Rest of the App

**Status:** accepted 2026-10-19. Nothing built yet.

**Goal:** two reviews on one day, written up as one plan. **Part A** makes the three character creators (LPC,
Memao and MZ: `docs/LPC_CHARACTER_CREATOR_PLAN.md`, `docs/MEMAO_CHARACTER_CREATOR_PLAN.md`,
`docs/MZ_CHARACTER_CREATOR_PLAN.md`) faster, easier to use and easier to use without a mouse, and fixes what a
review of the code and of MZ's real generator folder found. **Part B** (§8 onwards) is the rest of the plugin: the
runtime, the editor, the project, after a read of every module against MZ 1.10's own code and the guide.

Sizes as in `RECOMMENDATIONS.md`: **S** an afternoon, **M** a PR like terrain or water, **L** several PRs.

# Part A: the character creators

All three share one window (`44_workspace_lpc_creator.js`) through a kit (`44_workspace_creator_kits.js`), so most
of this is done once and reaches all of them.

## 1. What the review found (2026-10-19)

- The build check and the 127 test suites pass on `feat/mz-creator`, where all three creators are together.
- **MZ's masks use key colours the index doesn't know.** All 1,208 walking, damaged and battler masks in a Steam
  copy of MZ were scanned. Besides the 23 keys in `MzGen.keys`, there are off-key pixels: `774800` (Accessory B,
  Rear hair), `dcb010` (Cloak), `1380f8` (Body), `92d7c5` (Wing), `7d9186` (Front hair), `ad8200`, `8a540d` and
  `8c9a1e` (Rear hair), a dozen in Clothing 2, and near-whites (`fdfdfd`, `fefefe`, `fcfcfa`) that are fixed
  anyway. Pixels under an unknown key are left as drawn, so a recoloured part keeps a few stray pixels of its
  original colour.
- **The parts' default colours are not on the gradient bands.** Checked against every band of every gradient
  file: no band holds them. So there is no exact rule to recover, and recolouring by brightness stays.
- **Every colour change decodes PNGs again.** All three compositors decode inside the recolour cache's maker
  (`MemaoCompose.compose`, `MzGenCompose.composeView`, `LpcCompose.compose`), so a new colour re-reads and
  re-inflates the sheet, and for MZ the mask too.
- **The caches are sized by count.** Memao's holds 200 sheets of 384 × 960 RGBA (about 1.5 MB each), so a long
  session can reach about 300 MB.
- **An MZ skin change recolours every layer.** The cache key of a walking or battler layer joins every active
  colour slot, so changing the skin invalidates clothing whose mask has no skin pixels.
- **`MzGen.slotOfKey` formats a hex string per pixel** of every layer it recolours (a battler layer is 576 × 384).
- **The LPC window composes the walk twice per click:** once for the stage and once for the credits line
  (`CreatorKits.lpc.credits`).
- **The "Replace N pictures" dialog** counts the whole face sheet when only one slot changes, and leaves out the
  Visual Equipment part files, which `lpcExportFiles` doesn't list.
- **Tab is swallowed:** `creatorKey` maps Tab to card switching and prevents the default, so the name field, Save
  and Export can't be reached by tabbing.
- **Every change rebuilds the window's HTML,** which destroys the button that was pressed and announces nothing
  to a screen reader.
- **Shift + arrows and the gamepad's A button only cycle colour channel 0,** so MZ's Clothing 2 to 4 are
  mouse-only.
- **Narrow mode is decided once per render** from `window.innerWidth`; resizing the window leaves the old layout
  until the next click, and the cursor row isn't scrolled into view.
- **The slot labels aren't in the translation template:** `scripts/strings.js` scans modules 36 to 45 only, so
  the labels in the three `23_*_slots.js` files (Beast ears, Field tool, Watering can) never reach
  `languages/template.json`.
- **Memao's props** (Eat, Drink, Read, Paint) always draw the first file in their folder.
- **The LPC body dice** only ever roll male or female, dropping a chosen teen, child, muscular or pregnant body.
- **A loaded character whose parts are gone** keeps the stale picks: the row shows the old name and the arrows
  jump from the first option.
- **`mzgenDetectFolder`** resolves `../generator` from the executable, right for `nwjs-win`, wrong inside a
  `.app` bundle on macOS.

## 2. Design

### 2.1 Fixes

- **Mask keys (MZ):** `MzGen.slotOfKey` snaps an unknown key to the nearest known key within a small distance
  (each channel within 24), and the scan decodes each part's masks once to list the keys it could not place in
  the index's warnings. The index gains, per mask, the set of slots it contains.
- **Two-tier image cache:** `LpcCompose.newCache` takes a byte budget, counts each image's `data.length`, and
  drops the oldest past it. Each kit's workspace keeps a raw cache (file → decoded image, masks included) and a
  recoloured cache (file + colours → image); the recolour maker reads from the raw cache. Budgets: LPC 96 MB,
  Memao 160 MB, MZ 96 MB.
- **Cache keys (MZ):** a walking or battler layer's key names only the slots its mask contains, from the index.
- **`slotOfKey`:** a `Map` from the packed RGB integer, built once from `keys`.
- **Credits (LPC):** `creatorCredits` takes the layers from the composed animation when it is the walk, and
  otherwise composes the walk once per state (cached on `_creator` until the state changes).
- **The replace dialog:** `exportFiles` returns `{ file, note }` so the face says "slot 3 of Name.png", and the
  LPC kit lists the part files it would write (`exportLpcParts` gets a dry-run mode that returns names only).
- **Keyboard:** Tab and Shift + Tab move focus as in any dialog. Card switching moves to `[` and `]` (the
  gamepad's Back button stays). After each render, focus returns to the element with the same id, and an
  `aria-live="polite"` status under the stage says what changed ("Hair: Emo Left, 12 of 40"; "Hair colour:
  auburn").
- **Colour channels from keys and the pad:** Shift + arrows cycle the row's current channel; `]` on a row with
  several channels (and the pad's A held) steps to the next channel, shown on the swatch as a small index.
- **Window size:** a resize listener re-renders when narrow changes; in narrow mode the cursor row calls
  `scrollIntoView({ block: 'nearest' })`.
- **Translation:** `scripts/strings.js` also scans `23_lpc_slots.js`, `23_memao_slots.js` and
  `23_mzgen_slots.js` for `label:` strings; the template is regenerated.
- **Stale picks:** `creatorLoad` drops picks `missing` reports and names them in the toast, and required slots
  take the nearest part (same number for MZ, the body's default otherwise).
- **MZ on macOS:** `mzgenDetectFolder` walks up from the executable until a folder holds `generator`, at most six
  levels.

### 2.2 Picking parts

- **A grid picker.** Clicking a row's value (or pressing Enter / the pad's A on it) opens a popover like the
  palette's: a grid of 56-pixel tiles, one per option in the row's order, "None" first where the slot allows it,
  the current one marked. Each tile is the option's down-facing idle frame (walk frame 0 for LPC), composed
  alone through the kit's compositor and cached; tiles render lazily as they scroll into view (an
  `IntersectionObserver`, or the first 60 at once then the rest on scroll). MZ tiles use the `Variation`
  folder's icons where a part has one, composed frames otherwise.
- **Type to filter.** A search box at the top of the grid filters by name as you type; Escape clears it, then
  closes. The pad's d-pad moves through the grid, A picks, B closes.
- **Locks.** A padlock per row (click, or `L` on the cursor row, the pad's Y held with a direction) that the
  dice skip. Locks are kept in `_creator`, not in saved characters.
- **Undo.** `_creator.history` keeps the last 20 states; Ctrl + Z (the pad's Back held with B) restores one.
  Every state change (step, colour, dice, body, load) pushes.
- **Dice and the body type.** The body dice keep the body type and reroll the face, skin and hair; Shift + X
  (the pad's X held) also rerolls the type, across every type the library offers.
- **Linked hair (Memao).** `hairlong`, `hairside` and `eyebrows` get `follows: 'hair'`, so they take the hair's
  colour unless unlinked: a small link toggle beside the swatch (click, or `K` on the row) sets
  `pick.ownColour = true` and the row gets its own swatch back. MZ's shared slots stay as they are.

### 2.3 The window and the card

- **A library switcher.** A dropdown beside the title lists the kits whose index exists; choosing one calls
  `openCreator(null, kit)`, keeping the name. The map panel's four Characters entries become two: "Characters"
  (the card) and "Character Creator..." (the last kit used).
- **The Characters card** becomes three collapsible groups (MZ, LPC, Memao), each with its folder, scan, status
  and Open button, remembering which are open per computer. The LPC credits stay in the LPC group.
- **Face slots.** The export's slot dropdown becomes a row of eight thumbnails read from the existing face sheet,
  the empty ones blank, the chosen one outlined.
- **Themes.** The playful palette stays under Light, Dark and Playful; under High contrast the window uses the
  editor's high-contrast colours (black on white, 3-pixel borders, the yellow focus ring kept).

### 2.4 Per creator

- **Memao, standing on the tile:** an export tick "Stand on the tile's bottom" (on by default) shifts every frame
  down by 6 pixels (feet from y 40 to y 46, where MZ's own characters stand). The export warns when a frame's
  top pixels would be cropped (tall hats, horns) and leaves that sheet unshifted.
- **Memao, props:** a "Props" row per prop folder in the Tools tab when the folder holds more than one file, with
  None meaning the first (as now).
- **MZ, slots from the mask:** a part's colour channels are the union of its face files' `_m` slots and the slots
  its walking mask contains (from the index, §2.1), so no clothing loses a tab.
- **Recipes that travel:** "Export recipe..." and "Import recipe..." on the Load popover write and read one
  character as JSON (`{ format, kit, name, body, slots, colours }`) anywhere on the computer, for all three
  kits; a recipe of another kit is refused with a message.

## 3. Where the code goes

| Module | Change |
| --- | --- |
| `23_lpc_compositor.js` | byte-budget cache; `decodeCached` for the raw tier |
| `23_mzgen_index.js` | nearest-key snapping, numeric key map, mask slot sets in the index, unknown keys warned |
| `23_mzgen_compositor.js` | cache keys by the mask's slots; raw tier |
| `23_memao_compositor.js` | raw tier; props by pick; the down shift at export |
| `23_memao_export.js` | `shiftDown(sheet, px)` with a cropped-pixels check |
| `23_*_slots.js` | locks skipped by `shuffle`; Memao `follows: 'hair'` with `ownColour`; recipe export/import |
| `44_workspace_creator_kits.js` | `thumbnail(ws, part, body)`, `switchable`, per-kit cache budgets, `exportFiles` notes |
| `44_workspace_lpc_creator.js` | grid picker, filter, locks, undo, focus and aria-live, Tab, resize, switcher, face thumbnails, High contrast |
| `44_workspace_lpc_library.js` | collapsible groups on the card |
| `44_workspace_mzgen.js` | folder detection on macOS |
| `39_workspace_map_panel.js` | the two Characters entries |
| `scripts/strings.js` | scan the slot modules |

## 4. Phases and PR sizes

| Phase | What | Size |
| --- | --- | --- |
| 1 | The fixes (§2.1): mask keys, caches, `slotOfKey`, credits, replace dialog, Tab and focus, aria-live, channels, resize, translation, stale picks, macOS | one PR |
| 2 | The grid picker with filter, thumbnails per kit, MZ Variation icons | one PR |
| 3 | Locks, undo, the dice and the body type, linked hair in Memao | one PR |
| 4 | The switcher, the card's groups, face slot thumbnails, High contrast | one PR |
| 5 | Memao standing on the tile and props; MZ slots from the mask; recipes that travel | one PR |

Each phase ends with its tests (§5) and a playtest in the QA copy of MZ, recorded in `docs/QA_<date>.md`.

## 5. Tests

- An unknown mask key within range snaps to the known one; one out of range is reported in the index's
  warnings and left fixed.
- A second colour change doesn't call `loadImage` again (count the calls); the raw cache keeps the mask.
- The byte-budget cache drops the oldest image past the budget, not past a count.
- Changing the skin in MZ keeps a clothing layer's cached image (its mask has no skin pixels).
- `slotOfKey` from the numeric map gives the same slot as before for every key.
- The credits of the walk are read from the composed walk, not composed again.
- The replace dialog names the face slot and lists the part files.
- Tab moves focus inside the dialog; after a step, focus is on the same button; the live region says the new
  value.
- Shift + arrows cycle the current channel; the channel key steps to the next.
- The grid lists the row's options in order with None first, filters by name, and marks the current one;
  thumbnails are composed once per part and body.
- A locked row survives both dice; undo restores the state before the roll.
- The body dice keep the body type; Shift rerolls it.
- Memao's long hair follows the hair's colour until unlinked.
- The switcher opens another kit with the name kept.
- Memao's shift puts the feet at y 46 and refuses a sheet whose top row would be cropped.
- MZ's channels include the walking mask's slots.
- A recipe exported and imported gives the same state; another kit's recipe is refused.
- The LPC, Memao and MZ creator tests pass unchanged on the shared window.

## 6. Risks

- **Thumbnails for big libraries:** LPC has over 650 parts and hair rows with dozens of options; composing a
  frame per tile is about 5 ms each with the raw cache, so a row's grid fills in well under a second, but the
  first open of a large row should show tiles as they come, not block.
- **Snapping mask keys** could wrongly colour a pixel that MZ means as fixed; keep the distance small and list
  every snapped key in the warnings so it can be checked in the playtest.
- **Tab for focus** changes a documented key; the guide, the cheat sheet and the window's key line are updated
  with it.
- **The down shift** changes where Memao characters stand relative to MZ's collision and shadows; the default
  stays on because that is where MZ's own characters stand, with the tick to turn it off.

## 7. Later

- The exact colours of MZ's own generator, if its rule is ever documented.
- A palette editor for Doc's Doodads' own ramps (Memao).
- Memao's later sets and MZ's DLC parts, when they arrive.
- A random name for the dice.

# Part B: the rest of the app

Four reads on 2026-10-19: the runtime core and rendering (modules 00–08, 13–19), the gameplay features (07, 09,
10, 12, 16, 17, 28–30), the editor (11, 20–45) and the project (docs, tests, scripts, release). Every line below
was verified by reading the code; the ones marked ✓ were re-checked by hand. Everything in `RECOMMENDATIONS.md`
is done and is not repeated here.

## 8. Bugs in the game (fix first)

### 8.1 Sound

- ✓ **Every sound effect is varied by default.** `SpatialSound.vary` (`10_spatial_sound.js:43`) ignores
  `sound.mode === 'off'`, and the defaults (`07_world_atmosphere.js:30`) are 5 % pitch and 8 % volume, so a fresh
  install randomises the pitch and lowers the volume of every Play SE and move-route SE, in battles and menus too
  (there the character is null, and the variance still applies). Apply variance only when the mode is on and the
  source is a map character; default both variances to 0; add a `<no variance>` event tag beside `<no spatial>`.
- ✓ **Play SE is replaced, not aliased.** `Game_Interpreter.prototype.command250`
  (`15_spriteset_map_doodad_layer_hooks.js:1988`) is overwritten, so any earlier plugin that wraps Play SE is
  disabled, and the replacement runs for battle and menu interpreters. Alias it; call the original whenever there
  is no map character to place the sound at.

### 8.2 Time, states, touch and the API

- ✓ **The clock is created on read.** `Atmosphere.clock()` (`07_world_atmosphere.js:685`) makes
  `$gameSystem._docsClock` whenever anything reads the time, so every save carries a clock even with day and night
  off, with `startHour` frozen at first read. Reads return null when `time.source !== 'clock'`; only `update` and
  `setTimeOfDay` create it.
- **Setting an earlier hour adds a day.** `setTimeOfDay` treats any backwards move as a new day, so a cutscene that
  sets 22:00 from 23:00 bumps `clock.day`. Only `addTime` with a positive delta advances the day; `setTime` takes an
  optional day.
- **`WorldState.light(name, mapId)` reads the current map** whatever map is asked for (`07_doodad_states.js:219`),
  unlike `state()`. Use `doodadsNamed()` only when the map asked for is the current one.
- **`setState` accepts any value** and returns true even when the doodad has no such state, leaving dead keys in
  the save (`07_doodad_states.js:190`). Validate with `States.find`, return false and warn with the valid names.
- **`storeDoodadState` has no map argument** and writes -1 for a doodad on another map, while `setDoodadState` takes
  one (`07_doodad_states.js:389`). Add `mapId` and read through `WorldState.state(name, mapId)`.
- **Touch ignores counter tiles.** The `checkEventTriggerThere` hook (`07_doodad_states.js:363`) doesn't repeat MZ's
  counter check, so a touchable lamp behind a shop counter can't be used. Try one more tile when the tile ahead is
  a counter, as MZ does for events.
- **`api.place()` throws** when `frameW` is given without `frameH` and the art is not in the index
  (`07_public_api.js:119`). Fall back to the bitmap's size for either missing value.
- **`api.set({ art })` keeps the old frame size,** so a new picture is cropped or stretched (`07_public_api.js:163`).
  Clear `frameW` and `frameH` when the art changes without a size, and look the new art up as `place` does.
- **`api.remove()` filters every map** though `find` already scoped to one (`07_public_api.js:170`). Filter only
  that map.
- **`setVisualColor` keys by raw casing** and `reset` deletes by exact key
  (`16_visual_equipment_map_destination_runtime.js:652`), so `part: Hair` then `reset part: hair` leaves the
  colour. Lowercase on set and reset.
- **The touch payload has no tile.** `touched()` and the `'touch'` event give name, state and uid but not where
  (`07_public_api.js:182`), so a common event can't play a sound or VFX at the doodad without a second lookup. Add
  `x`, `y` and `mapId`.
- **Unknown event templates become NPCs.** `EventTemplates.get()` (`29_eventtemplates.js:211`) returns the NPC
  template for a deleted custom template, silently. Return null and let the caller warn.

### 8.3 Movement, collision and the camera

- ✓ **Sliding on ice ignores `canMove`.** The ice branch of `moveByInput` (`17_traversal.js:366`) moves the player
  while a message is open or an event runs. Gate it on `this.canMove()` as MZ does.
- **Jumps across a looping map's seam land off the map.** `plan()` wraps candidates with `roundX`/`roundY` but
  `jump(dx, dy)` adds raw deltas (`17_traversal.js:147`, `:173`). Wrap `_x`/`_y` and their targets after the jump,
  or refuse jumps that would wrap.
- **`dive()` transfers without checking the other map** exists or is big enough (`17_traversal.js:179`). Validate
  `$dataMapInfos[to]`, clamp into the new map on arrival, otherwise buzz and return false.
- **Boats and ships are blocked by any doodad over water** (`30_collision.js:117` exempts the airship only).
  Skip `blocksTile` for boats and ships unless the doodad sets `collision.vehicles`.
- ✓ **The destination marker's `update` is replaced, not aliased**
  (`16_visual_equipment_map_destination_runtime.js:421`), discarding other plugins' changes to it. Alias and chain.
- **The 2D camera fights Scroll Map.** With `camera2d.smooth` or bounds set, `updateScroll`
  (`17_camera_2d_runtime.js:32`) re-centres on the player every frame, dragging cutscene scrolls straight back.
  Hold the offset while `$gameMap.isScrolling()` and after an external `setDisplayPos` until the player moves, and
  add a "camera free" state for events.

### 8.4 Pictures and deployed games

- **Layer parallaxes and idle/run sheets stop a deployed game.** They are loaded with `ImageManager.loadParallax`
  and `loadCharacter` (`15_spriteset_map_layers_weather.js:51`, `15_spriteset_map_doodad_layer_hooks.js:1450`,
  `:1587`), are referenced only in Doc's Doodads' data, so MZ's "Exclude unused files" drops them, and they are not
  tracked by `MissingArt`, so the game stops with "Failed to load" where doodad art is skipped gracefully. Load them
  through `DocsDoodads.loadBitmap` with `MissingArt.track`, skip the layer or fall back to the walk sheet.
- **Non-PNG pictures can never load in game.** The Item Bag indexes `.jpg`, `.jpeg` and `.webp`
  (`21_assetindex_metadata_cache.js:6`), but `loadBitmap` strips the extension and MZ forces `.png`
  (`05_bitmap_texture_preloading.js:454`). Load non-PNG through `ImageManager.loadBitmapFromUrl` with the same
  tracking, or refuse to place them with a clear message.
- **Tileset-tile doodads keep the old tileset after Change Tileset** (`14_sprite_docsdoodad_runtime_engine.js:76`
  loads the tileset once at creation). Alias `Spriteset_Map.loadTileset` to reload their textures.
- **Models resolve against the process cwd** (`17_perspective_runtime.js:2145` uses `path.resolve('.')`), so a
  deployed game started from a shortcut with another "Start in", or a macOS app from Finder, finds no models.
  Resolve against `path.dirname(process.mainModule.filename)` as MZ does.
- **A broken model is retried every 5 s from the draw loop** with synchronous reads
  (`17_perspective_runtime.js:2134`), a periodic hitch in play. Retry only from map setup or live reload.

## 9. Bugs in the editor (fix first)

### 9.1 Data safety

- ✓ **Rebuild Index wipes every tag, favourite, manual slice, collision box, placement mode and usage count.**
  It sets `AssetIndex.data.assets = {}` before rescanning (`44_workspace_canvas_input.js:1665`), so `indexFile`
  finds no `existing` entry to keep them from (`21_assetindex_metadata_cache.js:199`), and collections keep
  dangling ids. Keep the old map and pass it as `existing` (or reset only `entryRevision`), and ask first.
- **Restoring a backup leaves the undo stacks** closed over the old arrays (`44_workspace_canvas_input.js:1757`),
  so Undo afterwards edits orphaned data. Call `Undo.clear()`, reset the dirty flags, clear staged maps, capture
  the session and refresh Details.
- ✓ **Packs are written with plain `writeFileSync`** (`44_workspace_packs.js:56`, `:104`): a same-named pack is
  overwritten silently and a crash mid-write leaves a truncated file. Ask when the file exists; write tmp + rename.
- ✓ **A pack can overwrite the project's own per-map doodad files.** `Packs.safePath` (`22_doodad_packs.js:109`)
  admits `data/DocsDoodads/`, so "Use the pack's" replaces this project's maps' doodads. Drop `data/` from
  `safePath`; prefabs and rooms already travel as JSON inside the pack.
- **Save Pieces keeps the old thumbnail and the slicer closes without asking.** `27_slicing_editor.js:266` never
  calls `Thumbnail.invalidate`; `close()` (`:938`) and Esc (`:575`) drop an unsaved session. Invalidate on save; ask
  "Save pieces?" when the undo stack is not empty.
- **Placement Mode and Character on Sheet are never saved** (`38_workspace_inspector.js:594` mutates
  `a.placement` without `AssetIndex.save()`, unlike collision and depth). Save, debounced, in both handlers.

### 9.2 Behaviour

- ✓ **Shortcuts are dead while a field has focus** (`45_scene_map_integration_key_bindings.js:104` returns for
  any editable target), so Ctrl+S does nothing right after typing in Details. Let chords that don't type (Ctrl,
  Alt, F-keys) through, except the ones a field owns (Ctrl+Z/Y/A/C/V/X).
- **Duplicating an event at the right edge lands off-map** or on another event
  (`44_workspace_canvas_input.js:1343`). Clamp and pick the nearest free tile.
- **Escape leaves a picked event picked and the context menu open**
  (`45_scene_map_integration_key_bindings.js:134` clears doodads only). Clear both and close the menu.
- **The active layer survives a map change.** `activeLayer` (`39_workspace_map_panel.js:54`) is never reset in
  `onMapLoaded`, so new doodads on another map get a layer id that doesn't exist there. Reset to `main` when the
  id is not in the map's layers.
- **Bring to Front and friends act on one doodad of a multi-selection** (`44_workspace_canvas_input.js:479` passes
  `[clickedDoodad]`) while Duplicate, Lock, Hide and Move to Layer act on all. Pass the selection.
- **Doodads hidden in the editor can't be reached again:** `pickableDoodads`, the marquee, `doodadAt` and Select
  All all skip them, and nothing lists or unhides them. Add "Show Hidden Doodads" to the canvas menu and the
  palette, and a hidden count per layer in Layers.
- **The slicer hard-codes Ctrl+Z/Y/D** (`27_slicing_editor.js:588`) so rebound keys don't apply, and pushes an undo
  step on every click in a region even without a drag (`:429`). Use `Shortcuts.match`; save state only when the
  drag moved.
- **Import routes by substring:** `surface.png` goes to faces, `fertile.png` to tilesets, `tractor.png` to
  characters (`36_import.js:35`), and Auto is the default. Match whole name tokens as the audio branch does, or
  only the source folder, and show each file's destination in the preview.
- **The file picker accepts `.json`, `.aseprite`, `.glb` and `.gltf` that import then rejects**
  (`44_workspace_item_bag.js:273` vs `36_import.js:13`). Route `.aseprite` to the sheet maker and models to
  `models/`, or trim the accept list.
- **`AssetIndex.init()` re-reads the library on every open** and re-points only `selectedAsset`
  (`37_workspace_core.js:136`), leaving `lastAsset`, path endpoints, similar results and the filtered list on stale
  objects. Skip the re-read when the file's stat is unchanged; otherwise re-resolve by id.

### 9.3 Keyboard and screen readers

- ✓ **No focus ring on any button in MZ's own window.** Rings are on `:focus-visible` (Chromium 86) while
  `.dd-btn:focus { outline: none }` is unconditional (`36_ui_theme.js:126`), and MZ 1.10's NW.js 0.48.4 is
  Chromium 85; `36_ui_theme_look.js:23` pairs `:focus-visible` with an input rule in one selector list, so the
  contrast theme's input ring is dropped too. Add plain `:focus` fallbacks (or a mouse-focus class set on
  pointerdown) and never share a rule between `:focus-visible` and another selector.
- **The context menu takes no focus,** has no `role=menu`, no arrow keys, and Esc doesn't close it
  (`44_workspace_canvas_input.js:1364`); Undo and Redo show "nothing to undo" by opacity only
  (`37_workspace_core.js:1826`). Focus the first item, handle arrows, Enter and Esc, add roles; set
  `aria-disabled`.
- **Category tabs are icon buttons without `role=tab`** (`37_workspace_core.js:514`), and the panel resizers are
  mouse-only (`:838`, `44_workspace_docking.js:128`). Add tablist semantics; give resizers a tabindex and arrow-key
  resizing, or width fields under Look.
- **The screen-reader observer relabels the whole workspace** 60 ms after any DOM change
  (`44_workspace_screen_readers.js:113`), and the virtual grid rebuilds on scroll. Label only the added subtrees.

## 10. Performance

### 10.1 Per frame in the game

Each of these runs for every doodad, light or character every frame. Together they are the difference between a
few hundred doodads and a few thousand.

- **`Layers.visibleInGame` builds the layer list twice per doodad per frame** (`11_editor_tools.js:61` via
  `14_sprite_docsdoodad_runtime_engine.js:296`). Cache an id → { hidden, gameHidden, locked } table per map
  settings object, invalidated on edit.
- **`seasonPath()` and `Atmosphere.season()` allocate per doodad per frame** (`14_…:231`,
  `07_world_atmosphere.js:675`). Memoize `season()` and `minutes()` per `Graphics.frameCount`, as `Wind.current()`
  already does.
- **`Appearance.signature` joins an 11-element array per doodad per frame** (`14_…:364`) and `isConditional`
  parses the same switch list twice (`:273`, `06_render_effects.js:139`). Compare fields directly, recompute the
  signature only when `_data` is replaced, cache parsed switches in a `WeakMap`.
- **`States.index` allocates and is called twice per stateful doodad per frame** (`07_doodad_states.js:43`,
  `14_…:154`). Compute once per update; normalise `d.states` lazily.
- **Light masks are re-triangulated every frame** (`15_spriteset_map_lights_directional.js:129` clears and redraws
  up to 160-point polygons per occluded light). Draw once per outline key in map coordinates; per frame only move
  the graphics.
- **`Lighting.collect` filters, maps and `Object.assign`s per light per frame** (`15_…:318`, `06:322`) and
  `updateDocsReflections` sorts twice per character per frame (`15_…:146`). Iterate the sprite list directly,
  normalise `d.light` once per data object, pool the reflection records.
- **Post-processing resolves the look every frame** even with no active effect: `normalizeLook` two to four
  times, every time and region entry re-normalised, `lerpLook` per blend, ~25 linear `find`s in `uniforms()`
  (`15_…:795`, `08_post_processing.js:103`, `:207`, `08_post_processing_blends.js:62`). Cache the resolved look on
  (`World._version`, map settings identity, fade frame, rounded minutes, region weights); index the params.
- **`updateDocsFrameTexture` makes a new `PIXI.Texture` on every frame change of every character and never destroys
  them** (`15_…:535`); `updateDocsShadowGear` already caches per frame key (`:629`). Cache per (base texture,
  frame).
- **3D billboards reassign `tex.frame` twice per sprite per frame** (`17_perspective_runtime.js:229`), each a UV
  update, plus two arrays and two closures. Cache an inset texture per (base texture, frame) with eviction and swap
  `obj.texture`.
- **`updateDocsFlatSkyVideo` normalises a 45-field perspective object every frame on every flat map** just to find
  no sky video (`17_…:634`). Early-out when neither the map nor the camera sets one.
- **`MapLayers.list()` normalises and `JSON.stringify`s every layer every frame** to detect change
  (`15_spriteset_map_layers_weather.js:45`). Key on the layers object's identity and `World._version`.
- **Collision allocates a box for every doodad on every `canPass` of every character** (`30_collision.js:99`), so
  wandering NPCs on a doodad-heavy map do events × doodads work per step. Cache bodies in a `WeakMap` keyed by the
  doodad, or bucket doodads by tile when sprites are built.
- **Visual equipment re-resolves every character every frame** (`16_…:112`, `12_…:75`): equips, states, note
  joins, a sort, `AsepriteVisuals.resolve` per layer, then a signature string, to find nothing changed. Memoize per
  actor on a version bumped by `refresh`, `changeEquip` and `_docsVisual` writes, and per event on `_pageIndex`.
- **Ambience coverage scans up to 1,681 tiles per layer every 6 frames** (`10_spatial_sound.js:165`) though it
  depends only on the player's tile. Recompute when the map, the tile or the layers change.
- **`Wind.current()` is called per particle per step** (`09_…:106`). Hoist it above the loop.
- **No off-screen culling.** Every doodad, shadow, emitter and VFX on the map is updated and submitted to PIXI
  whether on screen or not (`14_…:203`). Set `renderable = false` and skip motion, appearance and shadow work when
  the sprite's rect (plus filter padding) is outside the screen, or outside the 3D picture.

### 10.2 In the editor

- **The recovery heartbeat stringifies every map and writes synchronously each interval while dirty,** even when
  nothing changed (`45_…:193`). Bump a change counter in `Undo.execute` and the dirty setters; skip when unchanged;
  write with `fs.promises`.
- **The library is pretty-printed and written synchronously per favourite, tag, collection add, slice and
  collision change** (`21_…:286`; `44_workspace_packs.js:127` loops it per asset). Debounce like `recordUsage`,
  flush on save and close, indent 0.
- **Every keydown JSON-parses localStorage about 33 times** (`11_shortcuts.js:129` → `Ui.prefs()` per rebindable
  row). Cache compiled chords; invalidate in `set`, `reset`, `resetAll`.
- **The usage index re-reads every map and six database files after every undo** (`42_…:432`; dropped at
  `11_shortcuts.js:342`). Invalidate only on save; update the in-memory doodad part incrementally; read async.
- **Importing a few files rescans every img and audio root** (`44_…:1473`, `44_workspace_packs.js:119`). Index the
  imported paths, rebuild the list, save.
- **The map panel builds up to 3,000 `<option>`s and stats every packed source on every re-render** (`39_…:445`,
  `41_…:1070`, `42:722`), and it re-renders on every undo, layer tick and biome edit. Build the datalist lazily on
  focus, once per library change; cache the stale check.
- **Thumbnail misses read synchronously per card during grid rebuilds,** and the LRU holds 500
  (`24_thumbnail.js:69`, `:7`), so a big bag re-reads on every scroll past it. Read with `fs.promises` in the queue;
  scale the cache with the asset count.
- **Every Ctrl+S backs up every entry and readdirs the backups folder per entry** (`33_…:142`, `20_fs.js:108`).
  Back up only entries whose JSON changed; one readdir per save.
- **Dropped folders are walked twice and colliding files compared whole and synchronously** (`44_…:1495`,
  `36_import.js:113`, `:139`). Pass the collected list into `planBatch`; compare lazily.

## 11. Project, docs and release

- ✓ **`autosaveRecoveryInterval` can't be turned off from the Plugin Manager:** `@min 10` while the description
  and the code allow 0 (`00_header_and_plugin_parameters.js:286`). Set `@min 0`.
- **`saveMode` is missing from the guide's parameter table,** and the table calls `doodadScaleMode` "Texture
  Scaling Mode" where the header says "Doodad Scaling Mode" (guide §3 vs header lines 234–240). Add the row; align
  the label.
- **What's New is stale:** `WhatsNew` (`44_workspace_onboarding.js:113`) still has id `2026-10-editor` and seven
  items, none of the sixty-odd later changelog entries. A new id and items per release, derived from the
  changelog's head, and a line on the release checklist.
- **The cheat sheet lacks `[bN]` and `[hN]`** in its image-name tags table though the guide documents both. Add the
  rows.
- **The translation template is stale and unchecked:** building it gives 1,089 strings against 1,060 in the file,
  and `verify` only checks shortcuts. Add `--check` to `scripts/strings.js` and a verify step (and the slot
  modules from Part A §2.1).
- **`verify-project.js` never skips big files:** `entry.size` is undefined on a `Dirent` (`:50`), so every glb and
  gif is read as UTF-8 and regex-scanned. Use `statSync` and skip binary extensions.
- **`test_performance_scale.js` asserts wall-clock budgets** (`:91`), which fail on a loaded CI runner. Compare
  against an in-process baseline, or warn.
- **Test suites write into the repository** (`43_…:96`, `20_fs.js:86` use project-relative paths; `run-tests.js`
  runs with the repo as cwd), creating `data/docs_doodads_cache/` under the repo. Give each suite a temp project
  root and assert nothing under the repo changed.
- **`SECURITY.md` doesn't say that doodad data is code:** `condition` strings are compiled with `new Function`
  (`06_render_effects.js:116`) and run in deployed games. State the trust boundary, or restrict conditions to an
  expression grammar.
- **README and the header describe More as six entries** where it has about twenty (`README.md:32`, header line 20,
  `37_workspace_core.js:455`). Rewrite both.
- **README says 82 % coverage; it is 88 %,** and the gate is 72/72/70/70. Update the text; raise the gate to about
  85/85/80/75.
- **Weakest coverage:** `27_slicing_editor.js` 38 % of lines, `26_export.js` 40 %, `34_layout.js` 59 %,
  `16_…_runtime.js` 60 %, `42_workspace_assets_maps.js` 61 %, `37_workspace_core.js` 63 % (42 % of functions),
  `44_workspace_map_layers.js` 63 %. Suites for the slicer and export on the fake engine first.
- **`.gitignore` lacks** `*.zip`, `*.ddpack`, `packs/`, `screenshots/`, `img/`, `audio/`, `CREDITS_LPC.txt`,
  `data/DocsDoodadsCredits.json` and the three characters files, all of which the plugin writes into a project;
  the parent repo already holds untracked zips. Add them.
- **Three version strings:** `[V2.0]` in the header, `pluginVersion = 2.0`, and `2.0.0-alpha.1` in package.json and
  the changelog. One string, compared by verify.
- **No linter.** `npm run check` is `node --check`, so an accidental global or unused variable in 109 concatenated
  parts goes unnoticed. An ESLint flat config with MZ and PIXI globals and `no-undef`, run by verify and CI.
- **The changelog is one "Unreleased" block of about 70 bullets.** Cut a dated 2.0.0-alpha.1 section at release.
- **`verify-project.js` gives the whole suite 180 s** (`:12`); it takes 59 s here and the Windows runner is slower.
  Drop the outer timeout (each suite already has 120 s) or raise it to 600 s.
- **CI runs the suite twice on Linux** (`verify`, then `coverage`). Let coverage be the Linux test run.
- **Largest parts:** `17_perspective_runtime.js` 2,480 lines, `15_spriteset_map_doodad_layer_hooks.js` 2,237,
  `44_workspace_canvas_input.js` 1,834, `13_perspective_mode.js` 1,611, against CONTRIBUTING's "add a part rather
  than grow one". Split the 3D runtime and canvas input along their section comments.
- **`Compat.isTest()` defaults to true without `Utils` while `FS.writable()` defaults to false** (`19_compat.js:9`,
  `20_fs.js:17`), so the editor gate and the write guard disagree outside MZ. Default `isTest()` to false.
- **The manual checklist never mentions the Playful theme** and has one line each for Rooms, Packs, docking,
  language and Capture. A short row per feature.
- **Cleanup:** place, delete, duplicate and paste each hand-roll an undo command, and delete's revert reinserts
  by stored index in selection order, changing z ties (`44_…:255`, `:291`, `42:933`, `43:119`): one shared
  add/remove pair. The drag ghost compares an absolute URL with a relative path (`44_…:337`) and flips
  `ge._erased` directly where `Undo.syncEvents` owns it (`:1286`). `Spriteset_Map.update` is aliased six times and
  `Game_Map.update` three, with the order implicit in file order: fold each into one documented hook. `+` and `-`
  are mapped to zoom at load even with zoom off (`15_…:1829`): map them on first use.

## 12. Features worth adding

Gaps a game maker meets that the guide does not cover, from the same reads. None is committed to.

### 12.1 In the game

| # | Feature | Why | Size |
| --- | --- | --- | --- |
| 12.1.1 | **Off-screen culling and distance LOD** for doodads (§10.1) | Big maps with thousands of doodads | M |
| 12.1.2 | **The clock in battles and menus,** or "advance N minutes" on battle end and at inns | Time stops whenever the map isn't active (`07_world_atmosphere.js:722`) | S |
| 12.1.3 | **A day counter and calendar:** `clock.day` into a variable, weekdays, named dates, a plugin command and API | `clock.day` is tracked and nothing reads it | S |
| 12.1.4 | **States with sound, VFX, a wait and an auto-revert** (a trap that resets after 5 s) | A door opening can't play its creak without an event | M |
| 12.1.5 | **Touch once, cooldown and a prompt:** a per-doodad "once only" without a common event, a cooldown, and a highlight or prompt when the player faces a touchable doodad | The basics of interaction cost an event each today | M |
| 12.1.6 | **Traversal for events and followers:** swimmers and flyers by tag, landing, take-off and dive hooks, a landing-height rule, jump in move routes | Only the party moves this way | M |
| 12.1.7 | **Explored-map rewards:** percent explored into a variable, "reveal region N" for a map item | `Explored.fraction` exists with no command | S |
| 12.1.8 | **Collision variants:** one-way, blocks events but not the player (and the reverse), vehicle pass-through, a collision shape per state | An open gate still blocks its whole box | M |
| 12.1.9 | **Destination feedback:** an unreachable marker, click-to-interact with a touchable doodad at the destination, a per-map marker style | The marker is cosmetic | S |
| 12.1.10 | **Light blocked by doors, events and doodad boxes,** and a switch or condition per light | Occlusion reads passability and wall regions only | M |
| 12.1.11 | **A free camera** for Scroll Map and cutscenes (§8.3), with `$gameScreen` zoom-to-point | The 2D camera always returns to the player | S |
| 12.1.12 | **Play an animation once, now,** and an animation-finished hook | Chests and doors need states or events for it | S |
| 12.1.13 | **Transitions when `api.place` and `api.remove` run,** and `remove` without rebuilding every sprite | They pop in and out | S |
| 12.1.14 | **A required-assets manifest** the deploy script feeds MZ's deployment | "Exclude unused files" drops layer parallaxes and idle sheets (§8.4) | S |
| 12.1.15 | **API wrappers for every plugin command:** `touch`, `setWind`, `flashlight`, `traversal`, `playVfx`, `reveal`, `feature` | Events can do what scripts can't | S |

### 12.2 In the editor

| # | Feature | Why | Size |
| --- | --- | --- | --- |
| 12.2.1 | **Find doodads** across this map or every map by art, tag, name, layer, light, sound, collision, locked or hidden, with a result list and bulk edit | Replace Art is the only cross-map change | M |
| 12.2.2 | **A map outliner:** the map's doodads as a tree by layer with lock, hide and select per item, Show Hidden, Solo this layer | Hidden doodads are unreachable today (§9.2) | M |
| 12.2.3 | **Overlap marquee and lasso,** and "select inside region N" | The marquee tests the foot point only | S |
| 12.2.4 | **Align to grid, space evenly by N px,** nudge by tile that respects `Terrain.allowsDoodad` | Alignment stops at the existing distribute | S |
| 12.2.5 | **Manage event templates:** rename, delete, category, carry in packs | Templates can only be added; same names overwrite silently | S |
| 12.2.6 | **Copy map settings between maps** (lighting, layers, camera bounds) and map-settings presets | Each map is set up by hand | S |
| 12.2.7 | **Multi-select in the Item Bag** (Shift and Ctrl on cards) for batch tag, favourite, collection, move and delete | One card at a time | S |
| 12.2.8 | **Timed project autosave** beyond the crash file, and "Save this map only" | | S |
| 12.2.9 | **Named undo checkpoints** that survive Save and close, restored from Steps | "Before scattering" | S |
| 12.2.10 | **Import a zip of art, or a pack inside one,** with the same path checks as `.ddpack` | | S |
| 12.2.11 | **A per-SE opt-out** (`<no variance>`) and variance off by default (§8.1) | Cutscene music stings drift | S |

## 13. Phases for Part B

| Phase | What | Size |
| --- | --- | --- |
| B1 | The game bugs (§8): sound variance and the Play SE alias first, then time and states, movement and camera, deployed games | M |
| B2 | The editor's data safety and behaviour (§9.1, §9.2) | M |
| B3 | Keyboard, focus rings and screen readers (§9.3) | S |
| B4 | Per-frame performance (§10.1), measured with Show Speed on a 3,000-doodad map before and after | L |
| B5 | Editor performance (§10.2) | M |
| B6 | Project and release (§11): gitignore, versions, the linter, strings check, coverage gate, What's New, docs | M |
| B7 | Features (§12), one PR each, by the owner's pick | S–M each |

Each phase ends with its tests and a playtest in the QA copy of MZ, recorded in `docs/QA_<date>.md`. B1 and B3 are
small enough to go before the creators' Part A phases; B4 is the one to measure rather than assume.

## 14. Tests for Part B

- An SE in battle, in a menu and with `sound.mode === 'off'` plays with its authored pitch and volume; a map SE
  with variance on varies.
- A plugin that wraps `command250` before Doc's Doodads still runs.
- A save made with day and night off has no `_docsClock`; setting 22:00 from 23:00 keeps the day.
- `WorldState.light` for another map returns that map's value; `setState` with an unknown state returns false.
- Touch works across a counter tile; the `'touch'` payload carries the tile.
- `api.place` with `frameW` only, and `api.set({ art })`, give the bitmap's size.
- Sliding on ice stops while a message is open; a jump over a loop seam lands inside the map; `dive` to a missing
  map returns false.
- A boat passes a doodad over water; the airship still does.
- Scroll Map scrolls with the 2D camera on; the camera returns when the player moves.
- A missing layer parallax, idle sheet or non-PNG picture is skipped with a warning, not a stop.
- Change Tileset refreshes tileset doodads.
- Rebuild Index keeps tags, favourites, slices and usage; restoring a backup clears Undo.
- Pack export asks before overwriting and writes atomically; a pack with `data/` paths is refused.
- Save Pieces refreshes the thumbnail; closing the slicer with changes asks.
- Ctrl+S from a field saves; Escape clears events and closes the menu; z-order acts on the selection; a new
  doodad after Go to Map lands on an existing layer.
- Buttons show a focus ring with a plain `:focus` rule (checked by reading the built CSS).
- Per-frame counts: `Layers.list`, `season()`, `signature`, `States.index`, `PIXI.Texture` constructions and
  `canPass` body allocations per frame, before and after, on the fake engine.
- The recovery file is not rewritten when nothing changed; the library save is debounced.
- The translation template matches `strings.js --check`; the three version strings agree; ESLint passes.
