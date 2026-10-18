# Contributing

1. Create a branch from `main`.
2. Edit the plugin in `src/`, never `Docs-Doodads.js` directly (see below), then run `npm run build`.
3. Add a focused regression under `scratch/test_*.js` before changing plugin behavior. Drawing code (spritesets, sprites, the 3D view) can be tested on the stand-in engine in `scratch/engine/fake_engine.js`; see `scratch/test_engine_map.js`.
4. Run `npm run verify` (it also checks that `Docs-Doodads.js` matches `src/`) and `npm run coverage`.
5. Do not commit copyrighted RPG Maker assets, commercial game data, caches, recovery files, or credentials.
6. Describe any manual RPG Maker MZ validation performed in the pull request.

## How the source is laid out

The plugin still ships as one file, `Docs-Doodads.js`, which users copy into `js/plugins/`. It is built by `npm run build`, which joins the parts in `src/` in file-name order:

- `00_header_and_plugin_parameters.js`: the plugin header (parameters and plugin commands) and the start of the plugin function.
- `01`–`13`: pure logic by feature (render effects, atmosphere, post-processing, particles and VFX, sound, editor tools, visual equipment, the 3D view's maths). Most unit tests target these.
- `14`–`17`: runtime hooks into MZ (the doodad sprite, the spriteset, visual equipment and the 3D renderer).
- `18`–`36`: editor services (file system, asset index, search, thumbnails, slicing, events, collision, placement tools, undo, persistence, import).
- `37`–`44`: the editor workspace UI, in parts (core, inspector, map panel, 3D panels, visual equipment and post FX, asset and map tools, undo history and prefabs, canvas input).
- `45_scene_map_integration_key_bindings.js`: scene hooks, key bindings and the end of the plugin function.

The parts are pieces of one script, not standalone modules: a part can open an object or function that a later part closes. Keep new code inside the part for its feature, and add a new numbered part rather than growing a large one. Editor-only filesystem and DOM work must remain gated to NW.js playtest mode.
