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
| 1.6 | Raise test coverage from 65% to 75%. | **Done: 82%** (108 suites). Drawing code runs on a stand-in engine in Node (`scratch/engine/fake_engine.js`); the coverage gate is now 72%. |
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
| 6.1.3 | **One shortcut table.** **Done.** `DocsDoodads.Shortcuts` drives the key handler, More > Keys (rebinding, kept per computer, asks before taking a key in use), tooltips, the palette and the guide's table (`npm run shortcuts`, checked by verify); letters follow the keyboard layout. | M |
| 6.1.4 | **Any toggle key.** **Done.** `editKey` takes any key or a chord (`Ctrl+F10`, `Ctrl+Shift+E`); a key that types is ignored while typing in a field. | S |
| 6.1.5 | **Item Bag sorting.** **Done.** Best match, name, newest first, biggest first, most placed and last placed; remembered. | S |
| 6.1.6 | **More ways to select.** **Done.** Select All (Ctrl+A), Select Same Art, Select Everything on a layer and Invert Selection, in the canvas menu and the palette; right-clicking inside a multi-selection keeps it. | S |
| 6.1.7 | **Replace Art.** **Done.** The picked doodads, or every doodad showing a picture on this map or every map, get a new picture; position, depth, motion, lights and collision stay. From the canvas menu, the palette and the Item Bag (beside Where Used). | S |
| 6.1.8 | **Paste in Place.** **Done.** Ctrl+Shift+V or the canvas menu pastes at the copied coordinates on this map or another. | S |
| 6.1.9 | **Collision overlay.** **Done.** Show Collision draws every doodad's box by preset, shades tiles blocked by doodads (red) and by the map (grey), with a key. | S |
| 6.1.10 | **Undo per map.** **Done.** Each map's steps wait while the editor is elsewhere and come back with the map (unless MZ changed it meanwhile); the last ten maps keep theirs. | M |
| 6.1.11 | **Drag readout.** **Done.** Position, tile and size beside the cursor while dragging; smart guides also snap base lines and, with nothing near, tile lines. | S |
| 6.1.12 | **Scatter eraser.** **Done.** Right-drag with Scatter removes the picked item's doodads under the brush, inside a circle drawn on the map, one undo step a stroke. | S |
| 6.1.13 | **Hills brush feel.** **Done.** Hard and soft edges, `[` and `]` for brush size (Scatter and Paint too), and height numbers on the tiles under the brush. | S |
| 6.1.14 | **Prefab overrides.** **Done.** Settings changed in Details on a copy are its own (marked ●) and survive Sync, with Use Prefab's to go back; a whole copy saved into a prefab goes in as that prefab, synced with it, and kept as doodads if it is deleted. | M |
| 6.1.15 | **Saved searches.** **Done.** Search terms as removable chips, and named saved searches as chips (kept with the library) and in the palette. | S |
| 6.1.16 | **Richer hover card.** **Done.** Size, frame count, default depth, times placed and where-used count, with Details, Cut Up and Where Used. | S |
| 6.1.17 | **Clock scrubber.** **Done.** A time and season preview at the top of the map panel, with ▶ to run the day fast and Now. | S |
| 6.1.18 | **Looks by time and region.** **Done.** Time windows that ease in and out (game-wide, a map can opt out) and region looks that fade while the player stands on them (game-wide or per map), each a preset or a copied look with a strength. | M |
| 6.1.19 | **Sound shown on the map.** **Done.** Show Sounds draws each source's reach and region-sound tiles; Listen plays and lists what a tile hears, with the ambience radius around it. | S |
| 6.1.20 | **Performance overlay.** **Done.** Show Speed: frames a second, draw calls (counted by wrapping WebGL only while shown), pictures loaded, doodads and lights, with budget warnings. | S |

### 6.2 Additions

| # | Suggestion | Size |
|---|---|---|
| 6.2.1 | **Doodad states.** **Done.** Named states with their own art, light and collision, picked by a switch, a variable or events, with a crossfade and a Preview in Details. | M |
| 6.2.2 | **Touchable doodads.** **Done.** A common event on Action (or a click) or on walking into it, and an optional step to the next state, without an event. | M |
| 6.2.3 | **Doodad animation controls.** **Done.** Frames across and down, speed, start frame, and loop, back and forth, once on a switch, or hold a frame, in a Details section. | S |
| 6.2.4 | **Tile painting.** **Done.** The Tiles tool: A1 to E palette, autotile shapes from neighbours (matching MZ's tables for every pattern), layers, eraser, pick up, undo, saved with the map. MZ's shadow pen and special wall joins are not copied. | L |
| 6.2.5 | **Region and terrain-tag painting.** **Done.** A Regions tool with a legend (tiles per region and what uses it), Alt+click pick and one undo step a stroke, saved with the map. Terrain tags belong to MZ's tileset, so they are shown, not painted. | M |
| 6.2.6 | **Parallax and fog layers.** **Done.** Background and Overlay Layers per flat map: follow, scroll, zoom, opacity, blend and repeat for each, and game-drawn fog banks that drift with the wind. | M |
| 6.2.7 | **2D weather extras.** **Done.** Wind (with gusts, from storms, Set Wind) leaning sway, pushing particles and fog and blowing leaves; lightning in storms with delayed thunder. | M |
| 6.2.8 | **Directional light.** **Done.** Cone lights, ten presets, a flashlight that faces with the player, and rays that stop at walls (masked into the lightmap) on flat maps. | L |
| 6.2.9 | **2D camera tools.** **Done.** Easing and look-ahead, region bounds, 2D Camera Follow and 2D Camera Path (waits, comes back or stays). | M |
| 6.2.10 | **Doodad packs.** **Done.** More > Packs: prefabs (with inner prefabs), rooms, biomes, rules and collections with their files and Item Bag entries in one .ddpack; importing keeps or backs up differing files and renames clashing ids. | M |
| 6.2.11 | **Room stamps.** **Done.** More > Rooms: drag to save tiles (six layers), doodads and events; click to place on any map, one undo step. | M |
| 6.2.12 | **Reachability check.** **Done.** Check Reach shades what the player can walk to (walls, doodad collision, characters) and lists doors, chests and transfers out of reach, saying when only a character blocks. | M |
| 6.2.13 | **2D minimap and explored map.** **Done.** World > Minimap for flat maps (each map can choose), fog of war on the minimap and world map kept in the save, Show / Hide Minimap and Explored Map commands. | M |
| 6.2.14 | **Problems panel.** **Done.** Missing pictures and sounds, doodads off the map, lamps on maps that never get dark, events nobody can step on or under collision; this map or every map; Fix and Go To. | M |
| 6.2.15 | **Editor translation.** **Done (the layer).** `DocsDoodads.I18n`: tables in data/DocsDoodadsLanguages keyed by the English words, with {name} patterns, applied to every panel, card and message; `npm run strings` writes the template. No Japanese table yet: it needs a translator. | M |
| 6.2.16 | **Gamepad and touch for traversal.** **Done.** Jump and fly on free gamepad buttons (triggers by default, picked in World > Traversal), and on-screen Jump/Dive and Fly/Land buttons on touch screens. | M |
| 6.2.17 | **World state in saves.** **Done.** Set Doodad State, Set Doodad Light and Store Doodad State, and `DocsDoodads.WorldState` for scripts, by the doodad's Name; kept in the save. | M |
| 6.2.18 | **Capture tool.** **Done.** A PNG of the view (no editor outlines) and a looping 3D orbit GIF (its own GIF writer), into `screenshots`. | S |
| 6.2.19 | **Git-friendly data.** **Done.** Keys saved in a fixed order, and a Doodad Files parameter for one file per map under `data/DocsDoodads/` (loaded in game, backed up, emptied maps removed). | M |
| 6.2.20 | **Public API.** **Done.** `DocsDoodads.api`: find, place, move, set and remove doodads; states, lights, clock, season and ambient; touch, state and light events. | M |

### 6.3 UI and UX

| # | Suggestion | Size |
|---|---|---|
| 6.3.1 | **Tooltips.** **Done.** A delayed, themed tooltip with the shortcut in a key cap on every editor control with a title (taken over from the browser's); icon-only buttons keep an aria-label. | S |
| 6.3.2 | **Accessibility.** **Done.** Names and roles for controls and panels, live messages, arrow keys in the Item Bag, F6 between panels, focus rings, Less motion and the reduced-motion setting. | M |
| 6.3.3 | **UI scale and themes.** **Done.** 100/125/150% (CSS zoom on the workspace, with window sizes converted) and Dark and High contrast themes on the `--dd-` tokens; in More > Look and the palette. | S |
| 6.3.4 | **Colour-blind-safe colours.** **Done.** An Okabe-Ito map palette for selection, guides, mirror, paths, Old Saves, brushes, collision and blocked tiles, with a key; tested under simulated deuteranopia, protanopia and tritanopia. | S |
| 6.3.5 | **Mixed values.** **Done.** — where picked doodads differ (half-ticked boxes, a mixed choice), one edit sets all, a Placement section for several; number labels scrub and arrows step. | S |
| 6.3.6 | **Per-tool tours.** **Done.** A two- or three-step tour the first time each tool is picked, placed by what it explains; off for good or replayed from How to Use. | S |
| 6.3.7 | **Status bar.** **Done.** Cursor tile and pixel, map name and id, selection count, active layer, zoom, an unsaved marker and the time of the last save. | S |
| 6.3.8 | **Save feedback.** **Done.** An orange dot on Save while there are unsaved changes, and "Saved" for a moment after a save. | S |
| 6.3.9 | **Docking.** **Done.** Drag by the title (or More > Look) to left, right or bottom; resizable edges; shared sides; remembered per layout. | M |
| 6.3.10 | **Map tabs.** **Done.** Recently opened maps (up to 8) as tabs under the top bar, with an unsaved dot per map (changes are now tracked per map). | S |
| 6.3.11 | **Folder view.** **Done.** A folder tree of the bag's items (single-folder chains joined), remembered open folders, search and tabs still applying. | S |
| 6.3.12 | **Handles.** **Done.** Corner handles resize around the foot (Shift keeps proportions) and a knob turns (Shift snaps to 15°), for one picked doodad on a flat map. | S |
| 6.3.13 | **Quick menu.** **Done.** Right-click menus learn the most-used actions and show up to eight as a row at the top of longer menus. | S |
| 6.3.14 | **Toast history.** **Done.** More > Messages keeps the last 60 messages; deleting, erasing, clearing dressing and Replace Art show Undo on their message. | S |
| 6.3.15 | **Clear destructive confirmations.** **Done.** Deleting a layer that has doodads, a collection, a layout or a prefab, replacing sheets, restoring a backup and saving over MZ's changes each say what will happen, with a red button. | S |
| 6.3.16 | **Empty states.** **Done.** Each empty tab (and a search with no results) says what goes there, with a button. | S |
| 6.3.17 | **Palette upgrades.** **Done.** Any word order, recent commands first, shortcuts as key caps, and typed values (`time 18:30`, `go to map 3`, `season winter`, `size 125`). | S |
| 6.3.18 | **Details memory.** **Done.** Each section's open or closed state is remembered, and ☆ pins sections to the top. | S |
| 6.3.19 | **Progress pills.** **Done.** Indexing, packing, Auto-Slice and import show a non-blocking pill with a bar and Cancel at the map's top right. | S |
| 6.3.20 | **Sample content and What's New.** **Done.** Add Sample Items draws four pictures and adds two prefabs and a biome (once); What's New shows once after an update. | S |
