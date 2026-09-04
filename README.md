# QJ Doodads Asset Workspace

An RPG Maker MZ/MV upgrade of Qiu Jiu's MIT-licensed QJ-Doodads plugin. It adds a visual, virtualized asset drawer, sprite-sheet detection and slicing, modern map-editing tools, real MZ event authoring, transactional asset import, and protected project saves.

## Install

1. Copy `QJ-Doodads.js` to your RPG Maker project's `js/plugins/` directory.
2. Enable **QJ-Doodads** in Plugin Manager.
3. Start a playtest and press **F10** to open the workspace.

See [QJ_Doodads_Asset_Workspace_Guide.md](QJ_Doodads_Asset_Workspace_Guide.md) for usage and [QJ_Doodads_Asset_Workspace_Implementation_Plan.md](QJ_Doodads_Asset_Workspace_Implementation_Plan.md) for architecture and milestone status.

## Verification

Install the pinned development dependencies, then run the complete preflight and coverage gate:

```powershell
npm install
npm run verify
npm run coverage
```

The regression tests themselves use only Node.js. The coverage command uses `c8` and currently enforces a 40% baseline across the monolithic RPG Maker plugin; browser/NW.js UI branches remain covered by the manual checklist until an engine-level test harness is available.

Use [MANUAL_TEST_CHECKLIST.md](MANUAL_TEST_CHECKLIST.md) for the final RPG Maker MZ/MV playtest.

`QJ-Doodads.original.js` is retained as the upstream baseline for compatibility comparison.
