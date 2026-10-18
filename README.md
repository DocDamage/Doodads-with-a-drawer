# Doc's Doodads

A visual asset workspace and doodad engine for RPG Maker MZ/MV. It began as an upgrade of Qiu Jiu's MIT-licensed QJ-Doodads plugin and has grown into its own tool. It adds a visual, virtualized asset drawer, sprite-sheet detection and slicing, modern map-editing tools, real MZ event authoring, transactional asset import, and protected project saves.

Placed doodads sort in front of or behind the player by their base line and can sway, flicker, cast shadows, and give off light under a map's ambient darkness. The editor adds a path tool, prefabs, a rule-based scatter brush, drag-to-move with smart guides, cross-map copy/move, neighbouring-map edge mirroring, and a World View. A world layer adds a day/night clock with lamps that switch on after dark, sun shadows for characters and doodads, see-through trees and roofs, water reflections, motion blur, seasons, and animated appear/disappear effects. Post-processing adds bloom, colour grading, CRT, lens, grain, vignette, tilt-shift and more, with presets, per-map looks, animated screen effects and full-map image export. Particle emitters, reactive grass, a VFX builder and character animation (idle/run cycles, any number of frames, single-row and 8-direction sheets, one-command actions) bring maps and characters to life. Spatial sound places event sounds in the world (distance, pan, variation), adds ambient emitters, cave echo and background sounds by region. Editor tools add layers, symmetry, a biome brush, map dressing rules, a visual save history, animated thumbnails and a Ctrl+K command palette. Visual equipment draws gear on characters, followers, events and side-view battlers (with hide tags, colours, body-type aliases and an equip-screen preview), and the click-to-walk destination marker can be restyled or animated, with dots along the path. A 3D view lays any map on a perspective ground plane, or wraps it onto a small planet or rolling log, with raised terrain (automatic mountains, regions, terrain tags or a height brush), standing billboards, a turnable camera, fog and a parallax sky, and the editor keeps working in it. For managing assets it adds where-used, safe rename/move, duplicate and look-alike finding, live reload, and per-map art packing for deployed games.

## Install

1. Copy `Docs-Doodads.js` to your RPG Maker project's `js/plugins/` directory.
2. Enable **Docs-Doodads** in Plugin Manager.
3. Start a playtest and press **F10** to open the workspace.

Coming from QJ-Doodads? Replace `QJ-Doodads.js` with `Docs-Doodads.js` in Plugin Manager. Existing doodads, the asset library, templates, layouts, backups, and plugin settings are picked up automatically and saved under the new names on your next save.

See [Docs_Doodads_Guide.md](Docs_Doodads_Guide.md) for usage and [Docs_Doodads_Implementation_Plan.md](Docs_Doodads_Implementation_Plan.md) for architecture and milestone status.

## Verification

Install the pinned development dependencies, then run the complete preflight and coverage gate:

```powershell
npm install
npm run verify
npm run coverage
```

The regression tests themselves use only Node.js. The coverage command uses `c8` and currently enforces a 40% baseline across the monolithic RPG Maker plugin; browser/NW.js UI branches remain covered by the manual checklist until an engine-level test harness is available.

Use [MANUAL_TEST_CHECKLIST.md](MANUAL_TEST_CHECKLIST.md) for the final RPG Maker MZ/MV playtest.

`QJ-Doodads.original.js` is Qiu Jiu's original V1.2 plugin, retained as the upstream baseline for compatibility comparison.
