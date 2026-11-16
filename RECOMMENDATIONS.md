# Doc's Doodads: Recommendations

Status as of 19 October 2026 (after PR #52). Every item on the 17 October list is done, merged in PR #24 along with the fixes from its review and playtest (listed in [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md#review-fixes)), and in the PRs after it. Every suggestion in the backlog (section 6) is done too, in PRs #43–#52, played in MZ in [docs/QA_2026-10-19.md](docs/QA_2026-10-19.md). What's left needs another computer, a person or a translator; it is under What's left. A new backlog of ideas, none started, was added on 15 November 2026 as [section 7](#7-backlog-next-steps-15-november-2026). A second, [section 8](#8-backlog-easier-better-looking-and-things-no-one-else-does-15-november-2026), was added the same day: ease of use, look and feel, things no one else does, and maps made from a picture or a real place. A third, [section 9](#9-backlog-for-players-the-map-as-gameplay-and-safer-releases-15-november-2026), followed: comfort and convenience for players, the map as gameplay, more life on the map, art and tileset chores, and safer releases.

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

Done since the last update: the whole section 6 backlog (PRs #43–#52), morph targets, normal maps and GPU drawing for models, model live reload, the 3D See-Through silhouette, standing tile and wall edge cases, the 3D camera following near map edges, floor decals under walls, the checklist findings, gear from Aseprite layers, animated and skinned models, a video sky, zoom and sound focus with ambience and footsteps, traversal (jump, glide, swim, dive, fly, climb, ice), the audit, the new editor look and font, `npm run deploy`, and deployed games carrying on when doodad art is missing. MV is no longer a goal: Doc's Doodads is for MZ.

| # | What | Why | Size |
|---|---|---|---|
| B | **A real lower-spec PC.** Slow machines were only simulated (4× CPU throttling). At High, a long view distance with terrain is heavy there (13–20 fps). Check that Medium is a good default suggestion. | Throttling doesn't model a weak GPU. | S |
| D2 | **Models on the GPU by default?** Morph targets, normal maps, per-pixel light, a box that follows the pose and drawing on the GPU are done (D). The GPU way is off by default while it is new. | Real games with many moving models will show whether it should be on by default. | S |
| T | **A Japanese table for the editor.** The language layer is done (6.2.15) and `npm run strings` writes the template; the Japanese words need a translator. | Left for a translator rather than written by machine. | M |
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

---

## 7. Backlog: next steps (15 November 2026)

Ideas gathered after PR #86, from a read of the plugin and of what users of other MZ mapping, lighting and 3D plugins ask for. None is committed to and none is started; sizes use the scale at the top. Each was checked against `Docs-Doodads.js` and is not there today.

**How to build each one** (where in `src/`, the data it keeps, the steps in order, the tests, and when it is done) is in [docs/BACKLOG_7_PLAN.md](docs/BACKLOG_7_PLAN.md), under the same numbers, with a suggested order.

### 7.1 Features

| # | Suggestion | Size |
|---|---|---|
| 7.1.1 | **A game-only build. Done.** `npm run build:game` writes a runtime plugin about one third the full build's size. Release packages include it; deploy `--game-build` installs it under the usual plugin name. Shared collision, layers and packed-image helpers remain while the editor is absent. Encrypted MZ playtests passed; see [QA](docs/QA_2026-11-15.md#game-only-build-711). | M |
| 7.1.2 | **Editing what an event does.** The editor makes events from templates and changes their position, trigger and priority, but not their commands. An editor for the common ones (Show Text, Transfer Player, switches, self switches, pages and their conditions) would save most trips back to MZ. | L |
| 7.1.3 | **Play From Here.** **Done** for the time and season (weather and switches to start with are not in it). Right-click a tile to put the player there and close the editor, with the time, season, weather and switches to start with. | S |
| 7.1.4 | **Schedules for events.** The clock, the calendar and weekdays are there; nothing puts an event at the shop by day and at the inn by night. A schedule per event: where to be, by hour and weekday, walking there or appearing there. | M |
| 7.1.5 | **Normal maps on flat maps.** Normal maps only work on 3D models. On doodads and characters they would let the lights there already shade the art by its shape. | L |
| 7.1.6 | **Bringing in Tiled and LDtk maps.** There is no importer. Tiles, object layers as doodads, and collision shapes. | M |
| 7.1.7 | **Types for `DocsDoodads.api`.** **Done.** `types/Docs-Doodads.d.ts`, written by `npm run types` from the JSDoc and checked by verify, is in the release zip. A `.d.ts` written by the build, so other plugins' authors get completion and checking. | S |
| 7.1.8 | **A sample project.** Add Sample Items gives four pictures. A small town with lights, states, touchable doodads, traversal, weather and a 3D map would show what the plugin does. | M |

### 7.2 UI and UX

Watching a new user (item E under What's left) comes before all of these.

| # | Suggestion | Size |
|---|---|---|
| 7.2.1 | **Split up More.** **Done.** Map, Art, View and More, drawn from one list with the palette; they fold into More in a narrow window. It had about 30 entries in seven groups without names. A few named menus (Map, Art, View, Project), with More for the rest. | S |
| 7.2.2 | **Map notes.** **Done** (pins on flat maps only, not in the 3D view). Notes and to-dos pinned to tiles ("a chest here"), listed in a panel, never in the game. | S |
| 7.2.3 | **A ruler and bookmarks.** **Done.** Measure a distance in tiles and pixels; keep places on a big map to jump back to. | S |
| 7.2.4 | **Map pictures. Done.** Opened maps get a lazy, disposable 256 px tiles-and-doodads picture in tab hover cards, Go to map lists and World View; uncached maps keep named placeholders. Cross-map edits, saving and discard keep pictures consistent. Played in MZ flat and in 3D; see [QA record](docs/QA_2026-11-15.md). | S |
| 7.2.5 | **Panels in their own window.** Docking stays inside MZ's 816 × 624 window. The Item Bag or Details in a second window leaves the map clear. | M |
| 7.2.6 | **One Settings page. Done.** More → Settings (Ctrl+,) searches grouped map, world, editor, keyboard and plugin settings, opens the live control, and exposes each row to Find a Tool. Plugin parameters are read-only with configured/default values. Validated in MZ; see [QA record](docs/QA_2026-11-15.md). | M |

### 7.3 Bigger features

| # | Suggestion | Size |
|---|---|---|
| 7.3.1 | **Walking from map to map without a transfer.** Neighbouring maps and World View are there, but the player still transfers. Load the neighbours in the background and let the player walk over the edge with no fade, for open worlds. | L |
| 7.3.2 | **A collision brush.** Collision is set per doodad (presets, Trace from Art, a box). A brush that paints walls of any shape on the map, for parallax-style maps. | M |
| 7.3.3 | **Movement off the grid.** The player and events moving by pixels against doodad and painted collision, as an option. | L |
| 7.3.4 | **Baking for phones.** At deploy time, draw each map's still doodads and their shadows into a few big pictures. Drawing only what is on screen took a 3,000-doodad map from 12,000 draw calls to 150; baking is the next step for phones. Needs item B's test on real hardware, and an Android device, to measure. | L |
| 7.3.5 | **Generated maps.** Dressing rules, biomes, room stamps and prefabs are the parts of a dungeon or wilderness generator: in the editor (generate, then tidy by hand) or in the game from a seed. | L |
| 7.3.6 | **A cutscene timeline.** Tracks for camera paths, doodad states, lights, weather, screen looks and character actions, played by one plugin command. Each is its own command today. | L |
| 7.3.7 | **Light you can see in the air.** Rays through trees and windows, and shafts in fog, from the lightmap and the walls that already stop light. | M |
| 7.3.8 | **A first-person 3D camera.** The 3D view has none. (VR, also asked for by users of other 3D plugins, would come after it.) | M |

### 7.4 Asked for by users

From the comment pages and forum threads of other MZ plugins. Two larger wishlist threads could not be read, so this list is short and is not a count of demand. Requests that match a row above name it.

| # | Request | Where it was asked | Here today | Size |
|---|---|---|---|---|
| 7.4.1 | **Painting collision on parallax art.** | [Prlx](https://guild.rpgmakerofficial.com/t/topic/2309?tl=en) and the [Realtime Parallax Map Builder](https://sanghendrix.itch.io/realtime-parallax-map-builder-rpg-maker-mz-plugin) both added it. | Not as a brush: 7.3.2. | — |
| 7.4.2 | **Something that can stand in for Tiled.** | [A thread on the Parallax Map Builder](https://itch.io/t/5349931/does-your-plugin-work-with-tiled-plugin-for-colisions-and-all). | Mostly; the importer (7.1.6) would finish it. | — |
| 7.4.3 | **Maps joined without a break.** | [A forum request](https://forums.rpgmakerweb.com/threads/continuous-map-plugin.182540/) for an open world. | No: 7.3.1. | — |
| 7.4.4 | **Speed on Android and slow machines.** Maps over 50 × 50 are said to lag on phones. | [Forum threads](https://forums.rpgmakerweb.com/threads/fps-drop-on-android.144492/). | Not tested: item B, then 7.3.4. | — |
| 7.4.5 | **A list of plugins it works with.** The most common question on the [MZ3D page](https://cutievirus.itch.io/mz3d/comments?after=80) (VisuStella, action-battle plugins, other tilesets). Test beside the most used ones and publish the list, with what clashes. | MZ3D comments. | No list. | M |
| 7.4.6 | **Names or icons over events.** **Done.** | MZ3D comments. | Yes: `<docs label>`, `<docs icon>` and `<docs label range>`, flat and in 3D, also set in the event's Details. | S |
| 7.4.7 | **Other tile sizes and screen sizes. Done.** | Prlx lists it. | Audited live dimensions and added 16/32-pixel automated cases. Played 32-pixel maps at 1280 × 720 in MZ, flat and in 3D; see [QA](docs/QA_2026-11-15.md#other-tile-and-screen-sizes-747). The [water-edge renderer follow-up is fixed](docs/QA_2026-11-15.md#water-outside-the-3d-ground-capture). 16-pixel tiles remain automated coverage only. | S |
| 7.4.8 | **More tabs and parts in the character generator.** | [A request on the official forum](https://guild.rpgmakerofficial.com/t/topic/2357?tl=en). | Partly, through the three creators. Let a creator take a folder of the user's own parts as a tab. | M |
| 7.4.9 | **Say what already works.** **Done.** Three lines under the README's first paragraph. Deployed, encrypted games that hang on loading are the most common MZ3D complaint; parallax-style art in 3D is asked for there; [VisuStella's lighting](https://www.yanfly.moe/wiki/Lighting_VisuStella_MZ) suggests maps under 72 × 72. All three are tested here (deployed builds, doodads standing in 3D, 200 × 200 with 375 lights). Put them at the top of the README. | Above. | Done in the plugin, not said up front. | S |

---

## 8. Backlog: easier, better looking, and things no one else does (15 November 2026)

Ideas gathered the same day as section 7, after a second read of the README, section 7 and `Docs-Doodads.js`. None is committed to and none is started; sizes use the scale at the top. Each was searched for in `Docs-Doodads.js` and is not there today. Rows that build on a section 7 row name it. Whether other plugins have the rows in 8.4 and 8.5 was not surveyed.

**How to build each one** is in [docs/BACKLOG_8_PLAN.md](docs/BACKLOG_8_PLAN.md), under the same numbers, with a suggested order.

Watching a new user (item E under What's left) still comes before 8.1 and 8.2.

**Suggested order:** 8.1.1, 8.1.2 and 8.2.1 first (small, and they change how the editor feels on the first day); then 8.4.4 (small and showy), 8.4.1 (the headline feature) and 8.5.1 to 8.5.3.

### 8.1 Easy to use

| # | Suggestion | Size |
|---|---|---|
| 8.1.1 | **Simple mode.** The top bar has ten tools and four menus. Open with Select, Stamp, Scatter and Tiles and a short Details panel, with a Show Everything switch. Find a Tool (Ctrl+K) still reaches the rest. | M |
| 8.1.2 | **Moods.** One button sets light, look, weather and ambience together (Cosy Night Village, Rainy Forest, Cave), shown on the map while the pointer is on it. The parts are all there; the bundle is not. | S |
| 8.1.3 | **Good settings on drop.** Guess from the file's name and shape: "lamp" gets a lantern light that comes on after dark; "tree" gets sway, see-through and a box round the trunk. One Undo puts it back. | M |
| 8.1.4 | **A first-map quest.** In place of the welcome card, five steps that tick themselves off (place three trees, add a lamp, make it night, press Play). Goes with the sample project (7.1.8). | S |
| 8.1.5 | **Help where you are.** A ? on each panel that opens its part of the guide, and the guide's headings in Find a Tool. | S |

### 8.2 Look and feel

| # | Suggestion | Size |
|---|---|---|
| 8.2.1 | **A bigger window while editing.** Grow the Playtest window to fill the screen when the editor opens and put it back on Done. Much less work than panels in their own window (7.2.5), for most of the gain. | S |
| 8.2.2 | **A truer ghost of what will be placed.** There is a ghost today: a small picture that follows the pointer, over everything. Draw the item in the map as it will land instead, with its own size, shadow, light and depth, before the click. | S |
| 8.2.3 | **Moving tooltips.** A tool's tooltip plays a two-second clip of the tool in use. | S |
| 8.2.4 | **Details that starts short.** The three most used settings for the kind of thing picked, with the rest under More. | M |

### 8.3 Features

| # | Suggestion | Size |
|---|---|---|
| 8.3.1 | **Normal maps made for you.** With 7.1.5: make a normal map from a picture's shape, so lights shade the art without the user drawing anything. | M |
| 8.3.2 | **Bounced light and soft shadows.** A distance pass over the walls that already stop light, for soft shadow edges and light that comes round corners. Several passes in GLSL ES 1.00. Goes with 7.3.7. | L |
| 8.3.3 | **More like this.** Lasso an area you like; the tool learns what sits next to what and fills a region in the same way. A form of 7.3.5 with no rules to write. | L |
| 8.3.4 | **A ground brush.** Paint dirt, grass and stone with soft edges, off the grid. With the collision brush (7.3.2), this is parallax-style mapping inside the editor. | M |
| 8.3.5 | **The playtest on a phone.** Serve the playtest on the local network, opened from a QR code, with edits showing as they are made. Also gives the Android numbers that item B and 7.3.4 wait for. | M |
| 8.3.6 | **A photo mode for players.** Pause, move the camera, pick a Screen Look, save a picture. Capture is in the editor only. | S |
| 8.3.7 | **Playtest trails.** Record where testers walk, stop and die, and draw it over the map in the editor, beside Check Reach. | M |
| 8.3.8 | **Plain words in Find a Tool.** "Make it a rainy night", turned into `DocsDoodads.api` calls. Needs the user's own key for a language service and sends words off the computer, so it is off unless turned on. | M |

### 8.4 Things no one else does

| # | Suggestion | Size |
|---|---|---|
| 8.4.1 | **Decorate mode for players.** A small, safe part of the editor in the finished game: the player opens a bag of things the maker chose, places and moves them where the maker allows, and it is kept in the save. Housing, farms, bases, shop floors. Placement, snapping, collision, undo and saved states are there; it needs a player's UI and the limits. | L |
| 8.4.2 | **A world that remembers.** Grass wears to a path where the player walks often, snow keeps trails, saplings grow into trees over calendar days, broken things stay broken. On the calendar, seasons and saved states. | L |
| 8.4.3 | **Elements that spread.** Fire catches on dry grass and moves with the wind; rain puts it out and leaves puddles; water runs downhill on Hills. Lights, wind, weather and height are there apart; this makes them act on each other. | L |
| 8.4.4 | **Maps that move to the music.** Lights pulse, plants sway and particles burst in time with the BGM, per doodad, with a strength. | S |
| 8.4.5 | **Map eras.** One map in several versions (whole, burning, ruined; or now and ten years on), shown one over another in the editor and crossfaded in the game by a switch. | L |
| 8.4.6 | **Rewind in a playtest.** Hold a key to take the game back up to 30 seconds, change the map, and play the same moment again. | L |
| 8.4.7 | **A robot tester.** It walks every tile it can reach, touches every doodad and event and takes every transfer, then lists places with no way out, dead ends and errors. A step past Check Reach. | M |
| 8.4.8 | **The 3D map as a file.** Write the ground and standing doodads as glTF, for Blender, trailers or a 3D print. | M |

### 8.5 Maps from a picture or a real place

A drawing, a scan or a real-world map, made into a map in the game. The result is drawn with the project's tileset and doodads, so it matches the layout, not the look; to show the drawing itself, use it as a background layer with painted collision (7.3.2).

| # | Suggestion | Size |
|---|---|---|
| 8.5.1 | **Trace over a picture.** Load a picture as a see-through layer under the grid; scale, turn and slide it to fit; paint and place on top. Never in the game. Works for any picture, a pencil sketch included. | S |
| 8.5.2 | **A picture into a map.** The tool reads the picture's colours and asks the user to agree a key ("this blue is water, this green is forest, this brown is road"), then makes tiles (autotile edges included), hills from shading or from a second grey height picture, and trees, rocks and houses from biomes and dressing rules. One undo step; tidy by hand after. Flat colours work well; photos of paper, line drawings and maps with words on them need cleaning first, or 8.5.1. | L |
| 8.5.3 | **What kind of map.** Asked first, because it sets the scale, the key and the rules. **Overworld:** a tile is a long way; coast, mountains, forests, rivers, and a marker for each town, castle and dungeon. **Town or castle:** streets, walls, gates, building outlines with roofs and doors, yards and water. **Dungeon or cave:** a floor plan read as walls, floors, doors and stairs, from lines as well as colours. **Room:** walls, floor, doors and windows, then furniture from room stamps and prefabs. The user can add kinds of their own. | M |
| 8.5.4 | **Maps inside maps.** A marker on the overworld makes or opens that town's map; a door in the town makes or opens that building's rooms; stairs join a dungeon's floors. Transfers both ways are made from the event templates. A tree of the project's maps (world, place, room) to move around in. A picture bigger than MZ's 256 × 256 tiles is cut into neighbouring maps for World View; walking between them with no fade is 7.3.1. | L |
| 8.5.5 | **A real place.** Pick an area of the world: roads, rivers, coast, forests and building outlines from OpenStreetMap, and heights for Hills. Works at each scale in 8.5.3: a country as an overworld, a town as a town. Needs a download, so it is off unless asked for, and OpenStreetMap's credit must go in the game; the tool writes it. | L |

---

## 9. Backlog: for players, the map as gameplay, and safer releases (15 November 2026)

Ideas gathered the same day as sections 7 and 8, from asking what is neither built nor planned. None is committed to and none is started; sizes use the scale at the top. Each was looked for in `src/` and in the plans for sections 7 and 8 by searching for its words, not by a full read, and no trace was found; search again before starting one. Rows that lean on a row in section 7 or 8 name it.

**How to build each one** is in [docs/BACKLOG_9_PLAN.md](docs/BACKLOG_9_PLAN.md), under the same numbers, with a suggested order.

**Suggested order:** 9.1.1 and 9.5.1 first (comfort options are small and matter to anyone shipping a game; the playtest that runs itself protects everything built after it); then 9.2.1, 9.2.2 and 9.2.3.

### 9.1 For the player

| # | Suggestion | Size |
|---|---|---|
| 9.1.1 | **Comfort options.** Options has two rows from the plugin, Motion Blur and Effects Quality, while the game can show lightning, flashes, shockwaves and a camera that looks ahead. Add Reduce Flashes and Less Camera Motion for the player. | S |
| 9.1.2 | **Quality that looks after itself.** Effects Quality is a fixed choice. An Auto choice steps it down when frames stay low and back up when there is room. Goes with item B under What's left. | S |
| 9.1.3 | **A title screen from a map.** Pick a map, a time, weather, a look and a camera path, and the title screen shows it live behind the menu. | S |
| 9.1.4 | **Pictures on save files.** A small picture of where the player was, with the place and the game's day and time, on each row of the save and load screens. | S |
| 9.1.5 | **Area names.** Regions already drive camera rooms, looks and sounds. Give a region a name ("Old Quarter") and show it as MZ shows a map's name when the player walks in. | S |
| 9.1.6 | **Pins and fast travel.** Pins on the minimap and the world map for towns, shops and quests, shown once found, and travel to a found pin from the world map. | S |
| 9.1.7 | **Flat maps as battle backgrounds.** The 3D view can be the battle background (5.4); a flat map cannot. Use the map where the player stands, with its light, time and weather, without the blur. | S |

### 9.2 The map as gameplay

| # | Suggestion | Size |
|---|---|---|
| 9.2.1 | **Nearness triggers.** A doodad is touched by Action, a click or walking into it. Add "when the player comes within so many tiles", and "when they leave": doors that open, torches that light along a corridor. | S |
| 9.2.2 | **Indoors by region.** Weather covers the whole map, though character shadows already stop at roof regions. Marked regions stop rain, snow and sun shadows, take their own darkness and quieten the rain, so a house can share a map with its street. | M |
| 9.2.3 | **Bridges you walk over and under.** Regions mark a bridge's deck and its ends; the player and events keep a level, pass under or over, and do not bump into or talk to those on the other level. Flat maps first. Shares its hooks with 7.3.2 and 7.3.3. | M |
| 9.2.4 | **Light and sight.** A script or event can ask how bright a tile is, and an event can see the player: in a cone, stopped by the walls that already stop light, and less far in the dark. For stealth and puzzles. | M |
| 9.2.5 | **Doodads that ride and travel.** Motion is sway, bob, pulse, flicker and shimmer. Let a doodad ride on an event or the player (a lantern, a cart's load), or travel along a path (boats, clouds, platforms that carry the player). | M |
| 9.2.6 | **Weather that picks itself.** A climate: the chance of rain, storm, snow, fog and wind per season, rolled from the calendar so the same day has the same weather after a load, with a forecast events can read. Interiors opt out. Goes with Moods (8.1.2). | S |

### 9.3 Life and look

| # | Suggestion | Size |
|---|---|---|
| 9.3.1 | **Ambient creatures.** Particles do not react. Birds that scatter when the player comes near and come back, butterflies by day, fish under water that dart away. Not events: no collision, nothing saved. | M |
| 9.3.2 | **Ropes and cables.** A line between two points that sags and sways with the wind, plain or textured, with things hung along it: bunting, power lines, chains, strings of lanterns. | S |
| 9.3.3 | **Heat haze.** Shockwave bends the whole screen once. A haze setting on a doodad (a campfire, a lava vent) or a map (a desert road, under water) bends what is behind it, all the time. | S |

### 9.4 Editor and art

| # | Suggestion | Size |
|---|---|---|
| 9.4.1 | **Tileset flags in the editor.** Passability, ☆, ladder, bush, counter, damage floor and terrain tags still need a trip to MZ's database; the Regions tool shows terrain tags and cannot change them. Click them on the Tiles palette as in MZ, see the result at once, and save `Tilesets.json` with the same care as a map. | M |
| 9.4.2 | **Animated GIF and APNG in.** The Item Bag takes PNG, JPEG and WebP. A dropped GIF or APNG becomes a frame strip with its frame count and speed set, so the placed doodad animates at once. | S |
| 9.4.3 | **A licence ledger for all art.** Credits are written for LPC only. Keep an author, a licence and a source per file or folder (packs carry theirs), find art with none, and write one credits file for the art the game uses. | S |

### 9.5 Safer releases

| # | Suggestion | Size |
|---|---|---|
| 9.5.1 | **A playtest that runs itself.** The suites run on a stand-in engine in Node; the water bug of 15 November only showed on a real GPU, and its probe is still pasted into DevTools by hand. `npm run playtest` starts MZ's runtime on a copy of the test project, visits Starting Town, Field Map and the cave, flat and in 3D, and compares frames with kept pictures. | M |
| 9.5.2 | **Plugin clash check and a report bundle.** 7.4.5 is a list to publish. From the same table, Problems says which enabled plugins clash or need another order; and Save a Report gathers versions, the GPU, the plugin list and recent errors into one file for a bug report. Nothing is sent anywhere. | S |
| 9.5.3 | **Save-safe changes.** States and lights are kept in saves by a doodad's Name. Mark a release, and the editor warns when a rename, a delete or a changed state list would lose what players' saves hold, and keeps the old name working. | S |
