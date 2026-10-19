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
- `36_ui_theme.js`, `36_ui_theme_dialogs.js`, `36_ui_icons.js`, `36_ui_fonts.js`: the editor's look (theme CSS and the `DocsDoodads.Ui` helpers), its question cards (`Ui.confirm`, `prompt`, `form`, `choose`, `alert`, each a promise; never the browser's `prompt`, `confirm` or `alert`), its pixel icons and its font. The icons and font parts are generated: edit `art/ui_icons.png` (or the grids in `scripts/icon_art.js`) and run `npm run icons`; put fonts in `art/fonts` (listed in `fonts.json`) and run `npm run fonts`. Don't edit the generated parts by hand.
- `37`–`44`: the editor workspace UI, in parts (core and top bar, inspector, map panel, 3D panels, visual equipment and screen looks, asset and map tools, undo history and prefabs, canvas input).
- `45_scene_map_integration_key_bindings.js`: scene hooks, key bindings and the end of the plugin function.

Parts sharing a number are joined in name order. The parts are pieces of one script, not standalone modules: a part can open an object or function that a later part closes. Keep new code inside the part for its feature, and add a new numbered part rather than growing a large one. Editor-only filesystem and DOM work must remain gated to NW.js playtest mode.

Editor panels use the theme's CSS variables (`--dd-*`) and classes (`dd-btn`, `dd-glass`, `dd-pop`...) rather than inline colours, and words a first-time user understands (Item Bag, Details, Screen Looks).

## Scripts

- `scripts/build.js`: `npm run build`, and `npm run check` (the built file matches `src/` and parses). `npm run verify` (`scratch/verify-project.js`) runs the full preflight.
- `scripts/icons.js` and `scripts/fonts.js`: the generated UI parts above.
- `scripts/deploy.js` (`npm run deploy -- <project> <output> [--key <text>] [--no-encrypt] [--devtools] [--runtime <nwjs-win>]`): a Windows build like MZ's File > Deployment with encryption on, for testing a deployed game. It needs MZ's `nwjs-win` runtime (found in the usual Steam and KADOKAWA install folders, or passed with `--runtime`) and never writes inside the project.
