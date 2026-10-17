# Doc's Doodads

A visual asset workspace and doodad engine for RPG Maker MZ/MV. It began as an upgrade of Qiu Jiu's MIT-licensed QJ-Doodads plugin and has grown into its own tool. It adds a visual, virtualized asset drawer, sprite-sheet detection and slicing, modern map-editing tools, real MZ event authoring, transactional asset import, and protected project saves.

Placed doodads sort in front of or behind the player by their base line and can sway, flicker, cast shadows, and give off light under a map's ambient darkness. The editor adds a path tool, prefabs, a rule-based scatter brush, drag-to-move with smart guides, cross-map copy/move, neighbouring-map edge mirroring, and a World View. For managing assets it adds where-used, safe rename/move, duplicate and look-alike finding, live reload, and per-map art packing for deployed games.

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
