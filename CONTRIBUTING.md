# Contributing

1. Create a branch from `main`.
2. Edit the plugin in `src/`, never `Docs-Doodads.js` directly (see below), then run `npm run build`.
3. Add a focused regression under `scratch/test_*.js` before changing plugin behavior. Drawing code (spritesets, sprites, the 3D view) can be tested on the stand-in engine in `scratch/engine/fake_engine.js`; see `scratch/test_engine_map.js`.
4. Run `npm run verify` (it also checks that `Docs-Doodads.js` matches `src/`) and `npm run coverage`. `npm test` runs the regression suites on their own.
5. Do not commit copyrighted RPG Maker assets, commercial game data, caches, recovery files, or credentials.
6. Describe any manual RPG Maker MZ validation performed in the pull request.

## How the source is laid out

The plugin still ships as one file, `Docs-Doodads.js`, which users copy into `js/plugins/`. It is built by `npm run build`, which joins the parts in `src/` in file-name order:

- `00_header_and_plugin_parameters.js`: the plugin header (parameters and plugin commands) and the start of the plugin function.
- `01`–`13`: pure logic by feature (render effects, atmosphere, post-processing, particles and VFX, sound, editor tools, visual equipment, the 3D view's maths). Most unit tests target these.
- `14`–`17`: runtime hooks into MZ (the doodad sprite, the spriteset, visual equipment, the 3D renderer and traversal).
- `18`–`36`: editor services (diagnostics, file system and its playtest-only write guard, asset index, search, thumbnails, slicing, events, collision, placement tools, undo, persistence, layouts, audio, import).
- `36_ui_theme.js`, `36_ui_theme_dialogs.js`, `36_ui_icons.js`, `36_ui_fonts.js`: the editor's look (theme CSS and the `DocsDoodads.Ui` helpers), its question cards (`Ui.confirm`, `prompt`, `form`, `choose`, `alert`, each a promise; never the browser's `prompt`, `confirm` or `alert`), progress pills (`Ui.progress(label, { onCancel, delay })` for anything slow) and tooltips (`36_ui_theme_feedback.js`; a control's `title` becomes its tooltip, with a trailing `(Ctrl+S)` shown as a key), its pixel icons and its font. The icons and font parts are generated: edit `art/ui_icons.png` (or the grids in `scripts/icon_art.js`) and run `npm run icons`; put fonts in `art/fonts` (listed in `fonts.json`) and run `npm run fonts`. Don't edit the generated parts by hand.
- `37`–`44`: the editor workspace UI, in parts (core and top bar, inspector, map panel, 3D panels, visual equipment and screen looks, asset and map tools, undo history and prefabs, canvas input).
- `36_ui_theme_look.js` and `44_workspace_look.js`: editor size, themes and map colours (draw overlays with `DocsDoodads.Ui.mapColor(name)`, never a fixed colour, so the colour-blind palette applies), the Look card and Details memory. New theme colours go in `:root` and in each theme block.
- `44_workspace_capture.js`: the Capture card (picture and orbit GIF, written with `DocsDoodads.Gif` in `11_editor_tools.js`) and the quick menu.
- `44_workspace_item_bag.js`: Item Bag sorting, search chips and saved searches, the hover card and empty tabs.
- `44_workspace_map_tools.js`: the clock bar, Show Sounds and the Listen tool, and the Show Speed readout.
- `44_workspace_map_check.js`: the Problems panel and Check Reach (the flood itself is `DocsDoodads.MapCheck` in `11_editor_tools.js`).
- `07_public_api.js`: `DocsDoodads.api` for other plugins and scripts; `DocsDoodads.DataFiles` (one file or one per map, fixed key order) is in `04_data_load_save_legacy_vs_translation.js`.
- `44_workspace_regions.js`: the Regions tool (painting into `$dataMap` and the staged map, legend, overlay). Per-map undo is `Undo.park` / `Undo.unpark` in `32_undo.js`, called from `Persistence.onMapChanging`.
- `44_workspace_states.js`: the States list in Details (the runtime, world state and touch hooks are in `07_doodad_states.js`).
- `44_workspace_navigation.js`: palette ranking and typed values, map tabs, and the Item Bag's folder view.
- `44_workspace_selection_edit.js`: number scrubbing in Details and the resize and turn handles.
- `44_workspace_onboarding.js`: tool tours, the sample pictures (`DocsDoodads.SampleArt`) and items, and What's New (`DocsDoodads.WhatsNew`: change its `id` and items for a release, and it shows once to people updating).
- `11_shortcuts.js`: every editor key binding (`DocsDoodads.Shortcuts`). Add a key here, never as a check in the key handler; the handler (part 45), More > Keys (`44_workspace_shortcuts.js`, which also says what each row does in `runShortcut`), tooltips (`Shortcuts.tip(id, text)`) and the palette read it. Run `npm run shortcuts` after changing it: it writes the guide's table, and verify fails until you do.
- `31_placement_tools.js`: prefabs. Master doodads have keys (`pk`) that copies keep in `prefabRef.pk`; a copy's own settings are `prefabRef.own` (recorded by `applyDoodadProperty`); a prefab's `children` are other prefabs placed from their own master (`Prefabs.expand`).
- `12_explored_map.js`: the minimap's fog of war (`DocsDoodads.Explored`, bits per map in `$gameSystem._docsExplored`, written before a save); the minimap itself is in `12_visual_equipment_map_destination.js` and `17_perspective_runtime.js`, and `44_workspace_minimap.js` is the map's own choice.
- `31_room_stamps.js` and `44_workspace_rooms.js`: room stamps (`DocsDoodads.Rooms`, `data/DocsDoodadsRooms.json`) and the Rooms card and tool.
- `22_doodad_packs.js` and `44_workspace_packs.js`: doodad packs (`DocsDoodads.Packs`: gather, build, plan, prepare; the card does the disk work).
- New placement tools register `DocsDoodads.Workspace.toolHooks[name] = { click, down, move, up, overlay }` instead of adding branches to the canvas input part, and extra map settings push `{ render, bind }` onto `Workspace.mapSections`.
- `07_map_layers_weather.js` and `15_spriteset_map_layers_weather.js`: flat-map picture layers (`DocsDoodads.MapLayers`), wind (`DocsDoodads.Wind.current()`, read by sway and particles) and lightning, and their sprites; `44_workspace_map_layers.js` is their map settings and the camera bounds.
- `07_camera_2d.js` and `17_camera_2d_runtime.js`: the flat-map camera (`DocsDoodads.Camera2D`), which takes over `Game_Player.updateScroll` only when easing, bounds, a path or a follow target is set.
- `36_ui_i18n.js` and `44_workspace_language.js`: the editor's language (`DocsDoodads.I18n`). Write English in the parts as before; a translation matches the English words, so keep a message's wording in one string (`Placed ${n} doodads`) rather than glued pieces. `npm run strings` (`scripts/strings.js`) writes `languages/template.json`.
- `44_workspace_screen_readers.js`: names, roles and live regions (`Ui.labelTree`), Item Bag keys, F6, Less motion. New icon-only buttons need a `title`; it becomes their name.
- `44_workspace_lpc_creator.js`, `44_workspace_creator_kits.js`, `44_workspace_creator_grid.js` and `44_workspace_creator_history.js`: the Character Creator window, shared by the LPC, Memao and MZ creators through a kit each (slots, drawing, thumbnails, export, image caches), its grid picker, and its undo, locks and linked colours. Each library's own parts are `23_lpc_*`, `23_memao_*` and `23_mzgen_*` with `44_workspace_lpc_library.js`, `44_workspace_memao.js` and `44_workspace_mzgen.js`.
- `44_workspace_docking.js`: docking (`Workspace.dock`, `applyDockPositions`); place things over the map with `Workspace.mapArea()`, not from the panels' rects.
- Parts named `44_workspace_*` must sort after `44_workspace_canvas_input.js` (which closes the `DocsDoodads.Workspace` object) to use `Object.assign`; a part that sorts before it lands inside the object and breaks the build.
- `06_render_lights_directional.js` and `15_spriteset_map_lights_directional.js`: cone lights, presets (`DocsDoodads.LightPresets`), wall shadows (`DocsDoodads.Occlusion`, rays on the tile grid) and the flashlight, hooked into `updateDocsLighting` (`docsAddFlashlight`, `docsShapeLight`, `docsMaskLight`).
- `31_tile_painting.js` and `44_workspace_tiles.js`: painting MZ tiles (`DocsDoodads.Tiles`). Autotile shapes are found in MZ's `Tilemap` tables at run time, never copied into the plugin; `scratch/test_tile_painting.js` checks every neighbour pattern against an MZ project's `rmmz_core.js` when one is on the computer.
- `17_perspective_runtime_models.js`: drawing models: the per-pixel light shader shared by both ways, the CPU way (`docsModelItemsCpu`) and the GPU way (`docsModelItemsGpu`, a picture with a depth buffer per model). Shaders must stay GLSL ES 1.00 (WebGL 1): no `mat3(mat4)`, no `#version 300 es`. `scripts/make_model_fixtures.py` (run with Blender) makes `scratch/fixtures/morph_cube.glb`.
- `08_post_processing_blends.js` and `44_workspace_postfx_blends.js`: looks by time of day and by region (`DocsDoodads.PostFX.Blends`, mixed in by `resolveLook` when given `minutes` and `regionWeights`), and their rows in the Screen Looks card.
- `44_workspace_readouts.js`: the collision overlay, the drag readout and the status bar (added to `DocsDoodads.Workspace` with `Object.assign`, the way a new part extends an object an earlier part closed).
- `45_scene_map_integration_key_bindings.js`: scene hooks, key bindings and the end of the plugin function.

Parts sharing a number are joined in name order. The parts are pieces of one script, not standalone modules: a part can open an object or function that a later part closes. Keep new code inside the part for its feature, and add a new numbered part rather than growing a large one. Editor-only filesystem and DOM work must remain gated to NW.js playtest mode.

Editor panels use the theme's CSS variables (`--dd-*`) and classes (`dd-btn`, `dd-glass`, `dd-pop`...) rather than inline colours, and words a first-time user understands (Item Bag, Details, Screen Looks).

## Scripts

- `scripts/shortcuts.js`: `npm run shortcuts` builds and writes the guide's keyboard table from `src/11_shortcuts.js`; `--check` only reports whether it is current.
- `scripts/build.js`: `npm run build`, and `npm run check` (the built file matches `src/` and parses). `npm run verify` (`scratch/verify-project.js`) runs the full preflight.
- `scripts/icons.js` and `scripts/fonts.js`: the generated UI parts above.
- `scripts/deploy.js` (`npm run deploy -- <project> <output> [--key <text>] [--no-encrypt] [--devtools] [--runtime <nwjs-win>]`): a Windows build like MZ's File > Deployment with encryption on, for testing a deployed game. It needs MZ's `nwjs-win` runtime (found in the usual Steam and KADOKAWA install folders, or passed with `--runtime`) and never writes inside the project.
