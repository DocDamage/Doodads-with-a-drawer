# Doc's Doodads: Recommendations

Status as of 18 October 2026 (after PR #40). Every item on the 17 October list is done, merged in PR #24 along with the fixes from its review and playtest (listed in [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md#review-fixes)), and in the PRs after it. What's left is at the bottom.

**S** = an afternoon, **M** = a PR like terrain or water, **L** = several PRs.

---

## 1. Before a release

| # | Recommendation | Status |
|---|---|---|
| 1.1 | Run the manual test checklist on a real project. | **Done.** A sampled run on a test project built from MZ's sample maps found and fixed four bugs (two crashes on scene changes, Effekseer placement in 3D, the airship in 3D); the areas it skipped were run next and eight more bugs fixed (PR #31). A 30-minute editing session showed no leak. See [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md). |
| 1.2 | 3D performance pass. | **Done.** View 64 with terrain and a storm went from 18 to 54–58 fps. Numbers, including a simulated slow CPU, are in the QA record. |
| 1.3 | 3D quality presets. | **Done.** Effects Quality scales the 3D view (view distance and fog, weather, wakes, hill detail). |
| 1.4 | Deployed-build test. | **Done**, both with `npm run deploy` and with MZ's own Deployment dialog (encrypted, same key: every file identical except `System.json`). 3D, terrain, weather, standing tiles, models, the minimap and visual equipment work; the editor is unavailable and nothing is written. MZ's "Exclude unused files" leaves out `img/doodads`; the game now carries on without the missing art instead of stopping. |
| 1.5 | MV compatibility check, or narrow the claim. | **Done: the claim is narrowed to MZ.** MV was not available to test. |
| 1.6 | Raise test coverage from 65% to 75%. | **Done: 82%** (95 suites). Drawing code runs on a stand-in engine in Node (`scratch/engine/fake_engine.js`); the coverage gate is now 72%. |
| 1.7 | Audit: dead code, unfinished wiring, leaks. | **Done** (PR #37). The MV layer, SAT engine and other dead paths are gone; half-wired features (collections, Clear Cache, Move to Layer, event position and trigger, grid snap, search terms) are finished; leaks and bugs found are fixed. |
| 1.8 | An editor that's easy to pick up. | **Done** (PRs #38–#39). A bright, rounded, game-like look with named tools, Item Bag and Details panels that fold away, a hint bubble, a welcome card, pixel icons and its own font. |

## 2. 3D view: rough edges

| # | Recommendation | Status |
|---|---|---|
| 2.1 | Make tileset objects stand up. | **Done.** A per-map option stands up B–E objects with ☆ tiles (with the tile under them) or every B–E tile, without changing the map. |
| 2.2 | Effekseer depth. | **Done.** Effekseer animations shrink with distance, and now also play on the target as drawn (they were off to one side). |
| 2.3 | Weather behind things. | **Done.** Drops are drawn in 8 depth bands sorted in with billboards and terrain. |
| 2.4 | Gear in shadows. | **Done.** |
| 2.5 | Deep-sea boat test. | **Done.** Ship wakes and airship flight and landing checked; the airship's sorting and shadow were fixed. |
| 2.6 | Mouse look in the editor. | **Done.** Middle-drag orbits, Shift + middle-drag pans, the wheel zooms, a middle click resets. |
| 2.7 | Camera collision. | **Done.** Hills, tall doodads and standing tiles fade where they cover the player (with See-Through on). |
| 2.8 | Snow that settles. | **Done.** Per map; ties into snow weather and a season named Winter. |
| 2.9 | Clouds and fog banks. | **Done.** Cloud shadows, and low fog that fills valleys on terrain. |

## 3. Editor and workflow

| # | Recommendation | Status |
|---|---|---|
| 3.1 | Split the source file. | **Done.** 50 parts in `src/`, built into the same single file by `npm run build`; verify checks they match. |
| 3.2 | A 3D preview in the asset drawer. | **Done.** |
| 3.3 | A height brush preview. | **Done.** |
| 3.4 | A visual equipment sheet helper from Aseprite. | **Done.** Make Layer Sheets from .aseprite, tested against Aseprite's own exports. |
| 3.5 | Undo history panel. | **Done.** |
| 3.6 | A settings search in the map panel. | **Done.** |

## 4. Documentation

| # | Recommendation | Status |
|---|---|---|
| 4.1 | "Your first 3D map" walkthrough. | **Done:** [docs/FIRST_3D_MAP.md](docs/FIRST_3D_MAP.md). |
| 4.2 | Notetag and plugin command cheat sheet. | **Done:** [CHEAT_SHEET.md](CHEAT_SHEET.md). |
| 4.3 | Short GIFs for the README. | **Done:** weather, day and night, and the camera. |
| 4.4 | Update or archive the implementation plan. | **Done:** archived in [docs/archive](docs/archive/Docs_Doodads_Implementation_Plan.md). |

## 5. Ideas for later

| # | Idea | Status |
|---|---|---|
| 5.1 | Real 3D models (glTF) as doodads. | **Done.** Meshes with colours and textures, lit by the sun, sorted with billboards; animations, skins, materials, live reload and picking by shape. |
| 5.2 | Interiors in 3D. | **Done.** A4 walls and A3 roofs stand up with their face art, in Stepped and Smooth terrain, with decals kept on the floor. |
| 5.3 | Height-aware gameplay. | **Done.** Ledge drops, hopping up steps, a Store Ground Height command and a script helper. |
| 5.4 | 3D in battle. | **Done.** A per-map option uses the 3D map, from a low camera, as the battle background. |
| 5.5 | Minimap and world map. | **Done.** A corner minimap, and Show World Map with a globe on planets. |

---

## What's left

Done since the last update: model live reload, the 3D See-Through silhouette, standing tile and wall edge cases, the 3D camera following near map edges, floor decals under walls, the checklist findings, gear from Aseprite layers, animated and skinned models, a video sky, zoom and sound focus with ambience and footsteps, traversal (jump, glide, swim, dive, fly, climb, ice), the audit, the new editor look and font, `npm run deploy`, and deployed games carrying on when doodad art is missing. MV is no longer a goal: Doc's Doodads is for MZ.

| # | What | Why | Size |
|---|---|---|---|
| B | **A real lower-spec PC.** Slow machines were only simulated (4× CPU throttling). At High, a long view distance with terrain is heavy there (13–20 fps). Check that Medium is a good default suggestion. | Throttling doesn't model a weak GPU. | S |
| D | **Models: what's still open.** Morph targets (shape keys) and normal maps aren't read. Light is worked out per vertex, so a highlight on a flat face brightens the whole face. Models are posed and drawn on the CPU (a still view of a still model reuses the last frame), so keep them to a few hundred triangles. The selection box follows the rest pose, not the animation. | Enough for props and small characters; real games will show whether moving models to the GPU is worth it. | M |
| E | **Editor feedback from new users.** The new look was checked by its makers, not by someone opening the editor for the first time. Watch a new user place, paint and save, and fix where they get stuck. | The aim was "very easy to use"; only a fresh pair of eyes can say. | S |

---

## 6. Backlog: 60 suggestions (18 October 2026)

Ideas gathered after PR #41, grouped as improvements to what exists, new features, and the editor's look and feel. None is committed to; sizes use the scale at the top. Counts in parentheses come from searching `Docs-Doodads.js`.

### 6.1 Improvements to existing features

| # | Suggestion | Size |
|---|---|---|
| 6.1.1 | **Themed dialogs.** **Done.** All 25 prompt, confirm and alert calls are the editor's own cards (`DocsDoodads.Ui.confirm`, `prompt`, `form`, `choose`, `alert`): Enter answers, Esc cancels, Tab stays inside, names are shown as text. Placing an asset as an event picks its template from a list. | S |
| 6.1.2 | **Ask before losing work.** **Done.** Done, the toggle key, closing the Playtest window and F5 ask Save, Don't Save or Keep Editing; Don't Save puts the saved doodads and events back. | S |
| 6.1.3 | **One shortcut table.** Keep every binding in one table that drives the key handler, an in-app shortcut list under More, and the guide's cheat sheet, which still says "48px tile grid", "pointer tool" and "Slicer Modal". Let the user rebind keys there. | M |
| 6.1.4 | **Any toggle key.** **Done.** `editKey` takes any key or a chord (`Ctrl+F10`, `Ctrl+Shift+E`); a key that types is ignored while typing in a field. | S |
| 6.1.5 | **Item Bag sorting.** Sort by name, date added, image size, times placed and last placed; today there is only search order. | S |
| 6.1.6 | **More ways to select.** **Done.** Select All (Ctrl+A), Select Same Art, Select Everything on a layer and Invert Selection, in the canvas menu and the palette; right-clicking inside a multi-selection keeps it. | S |
| 6.1.7 | **Replace Art.** **Done.** The picked doodads, or every doodad showing a picture on this map or every map, get a new picture; position, depth, motion, lights and collision stay. From the canvas menu, the palette and the Item Bag (beside Where Used). | S |
| 6.1.8 | **Paste in Place.** **Done.** Ctrl+Shift+V or the canvas menu pastes at the copied coordinates on this map or another. | S |
| 6.1.9 | **Collision overlay.** A toggle that draws every doodad's collision box at once, coloured by preset, with blocked tiles shaded, so a map's walkability can be read at a glance instead of one doodad at a time. | S |
| 6.1.10 | **Undo per map.** Keep each map's undo history when switching with Go to Map, so returning to a map restores its Steps panel. | M |
| 6.1.11 | **Drag readout.** While dragging, show the position and size in pixels and tiles beside the cursor, and let smart guides also snap to tile lines and to other doodads' base lines. | S |
| 6.1.12 | **Scatter eraser.** **Done.** Right-drag with Scatter removes the picked item's doodads under the brush, inside a circle drawn on the map, one undo step a stroke. | S |
| 6.1.13 | **Hills brush feel.** **Done.** Hard and soft edges, `[` and `]` for brush size (Scatter and Paint too), and height numbers on the tiles under the brush. | S |
| 6.1.14 | **Prefab overrides.** Let a copy change a few named settings (a lamp's colour, a sign's switch) without leaving the prefab, and allow a prefab inside a prefab. | M |
| 6.1.15 | **Saved searches.** Name a search and keep it as a chip under the search box; show active tokens as removable chips. | S |
| 6.1.16 | **Richer hover card.** The Item Bag's hover preview shows size, frame count, where-used count and the asset's default depth, with Edit links. | S |
| 6.1.17 | **Clock scrubber.** A time-of-day slider in the map panel that previews lamps, shadows, the 3D sky and seasons while editing, with Play to run the clock fast. | S |
| 6.1.18 | **Looks by time and region.** Blend post-processing looks by the clock (a warm dusk grade) or by region (a cold crypt), beyond the game-wide and per-map looks. | M |
| 6.1.19 | **Sound shown on the map.** Draw the radius of each sound source, region sound and ambience layer, and a "listen here" probe that plays what the player would hear at a tile. | S |
| 6.1.20 | **Performance overlay.** An in-editor readout of frames per second, draw calls, texture memory and lit doodads, with a warning when a map passes a budget. QA so far needed DevTools for this. | S |

### 6.2 Additions

| # | Suggestion | Size |
|---|---|---|
| 6.2.1 | **Doodad states.** Named variants of a doodad (lit and unlit, open and closed, whole and broken) switched by a switch or variable, with a crossfade, so one placement serves a whole quest. | M |
| 6.2.2 | **Touchable doodads.** An `interact` setting that runs a common event when the player touches or clicks a doodad, without turning it into an event. | M |
| 6.2.3 | **Doodad animation controls.** For multi-frame art: speed and start offset per doodad, ping-pong, play once when a switch turns on, and a frame picker for a still. | S |
| 6.2.4 | **Tile painting.** Paint MZ tiles, including autotiles, in the editor during a playtest, so a map can be finished without going back to the MZ editor. | L |
| 6.2.5 | **Region and terrain-tag painting.** A region brush with a legend, since dressing, biomes, sounds, climbing, no-fly zones and terrain height all key off regions. | M |
| 6.2.6 | **Parallax and fog layers.** Several scrolling background and overlay layers per map, each with speed, zoom, loop and blend, for 2D maps. | M |
| 6.2.7 | **2D weather extras.** Wind that drives sway and leaf fall, drifting fog banks, lightning flashes with a delayed thunder sound during storms. | M |
| 6.2.8 | **Directional light.** Cones and spot lights with a direction, a flashlight on the player, light presets (torch, neon, candle) and 2D occlusion so walls cast dark edges. | L |
| 6.2.9 | **2D camera tools.** Follow smoothing, camera bounds per region, and a camera path plugin command for cutscenes, matching Set Camera in 3D. | M |
| 6.2.10 | **Doodad packs.** Export a bundle of art, prefabs, collections, biomes and dressing rules as one file and import it into another project; nothing like it exists today. | M |
| 6.2.11 | **Room stamps.** Save a rectangle of map (tiles, doodads, events) as a stamp and place it elsewhere or on another map. | M |
| 6.2.12 | **Reachability check.** From a start tile, shade what the player can reach and flag unreachable doors, chests and transfers. | M |
| 6.2.13 | **2D minimap and explored map.** The minimap exists only for 3D maps; add it for flat maps, with an optional fog of war that saves. | M |
| 6.2.14 | **Problems panel.** Missing art, doodads off the map, lamps on maps with no darkness, events on blocked tiles, sounds pointing at missing files, in one list with Fix and Go To. | M |
| 6.2.15 | **Editor translation.** One string table for the editor, with Japanese first; the UI has no language layer today. | M |
| 6.2.16 | **Gamepad and touch for traversal.** Map jump, fly and dive to gamepad buttons and to on-screen buttons on touch devices. | M |
| 6.2.17 | **World state in saves.** A small API for doodad states and lights per save file (the lamp smashed, the door left open) that events can read and write. | M |
| 6.2.18 | **Capture tool.** Save a PNG of the current view or a short orbit GIF in 3D from the editor, for store pages and READMEs. | S |
| 6.2.19 | **Git-friendly data.** Stable key order in the JSON files, and an option to keep one doodad file per map to shrink diffs and merge conflicts. | M |
| 6.2.20 | **Public API.** A documented `DocsDoodads.api` for other plugins and scripts: query, place, move and set the state of doodads, lights and the clock. | M |

### 6.3 UI and UX

| # | Suggestion | Size |
|---|---|---|
| 6.3.1 | **Tooltips.** A delayed tooltip with the name and shortcut on every control, replacing the 117 bare `title` attributes. | S |
| 6.3.2 | **Accessibility.** Labels for screen readers (one `aria` attribute today), keyboard navigation through the Item Bag and Details, a visible focus order, and respect for reduced-motion. | M |
| 6.3.3 | **UI scale and themes.** A 100/125/150% scale and dark and high-contrast variants; the theme already runs on `--dd-` tokens, so this is mostly values. | S |
| 6.3.4 | **Colour-blind-safe colours.** Pick selection, guide (pink and orange), layer and collision colours that stay apart for the common kinds of colour blindness, with a legend. | S |
| 6.3.5 | **Mixed values.** With several doodads picked, Details shows "—" where values differ and lets one edit set them all; numbers scrub by dragging and step with arrows. | S |
| 6.3.6 | **Per-tool tours.** A short dismissible walkthrough the first time each tool is used, replayable from How to Use, building on the hint bubble. | S |
| 6.3.7 | **Status bar.** Cursor tile and pixel, map name and id, selection count, active layer, zoom, an unsaved marker and the time of the last save. | S |
| 6.3.8 | **Save feedback.** **Done.** An orange dot on Save while there are unsaved changes, and "Saved" for a moment after a save. | S |
| 6.3.9 | **Docking.** Drag the Item Bag and Details to either side or the bottom, with resizable splitters, remembered per layout. | M |
| 6.3.10 | **Map tabs.** Recently opened maps as tabs along the top for one-click switching, with the unsaved marker per tab. | S |
| 6.3.11 | **Folder view.** A collapsible folder tree of `img/doodads` as an alternative to the flat search results. | S |
| 6.3.12 | **Handles.** Scale and rotate handles on the selection box, with Shift to keep proportions and snapping to 15 degrees. | S |
| 6.3.13 | **Quick menu.** A right-click radial or compact menu on the canvas with the eight most-used actions, learned from use. | S |
| 6.3.14 | **Toast history.** A drawer that keeps recent toasts (131 call sites) so a missed message can be read again, and an Undo button on toasts for destructive actions. | S |
| 6.3.15 | **Clear destructive confirmations.** **Done.** Deleting a layer that has doodads, a collection, a layout or a prefab, replacing sheets, restoring a backup and saving over MZ's changes each say what will happen, with a red button. | S |
| 6.3.16 | **Empty states.** An empty Item Bag tab explains what goes there (drop art here, make a prefab by...) with a button to do it. | S |
| 6.3.17 | **Palette upgrades.** Fuzzy matching, recent commands first, the shortcut shown, and commands that take a value ("time 18:00", "go to Map003"). | S |
| 6.3.18 | **Details memory.** Pin favourite sections to the top and remember each section's open or closed state. | S |
| 6.3.19 | **Progress pills.** Long tasks (indexing, Auto-Slice, packing, import) show a non-blocking progress pill with Cancel, in one consistent place. | S |
| 6.3.20 | **Sample content and What's New.** A welcome card button that adds a few sample prefabs and a biome to try, and a version-aware card listing what changed after an update. | S |
