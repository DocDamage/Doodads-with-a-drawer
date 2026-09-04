# QJ Doodads Asset Workspace

An RPG Maker MZ/MV upgrade of Qiu Jiu's MIT-licensed QJ-Doodads plugin. It adds a visual, virtualized asset drawer, sprite-sheet detection and slicing, modern map-editing tools, real MZ event authoring, transactional asset import, and protected project saves.

## Install

1. Copy `QJ-Doodads.js` to your RPG Maker project's `js/plugins/` directory.
2. Enable **QJ-Doodads** in Plugin Manager.
3. Start a playtest and press **F10** to open the workspace.

See [QJ_Doodads_Asset_Workspace_Guide.md](QJ_Doodads_Asset_Workspace_Guide.md) for usage and [QJ_Doodads_Asset_Workspace_Implementation_Plan.md](QJ_Doodads_Asset_Workspace_Implementation_Plan.md) for architecture and milestone status.

## Verification

The dependency-free regression scripts run directly with Node.js:

```powershell
Get-ChildItem scratch/test_*.js | ForEach-Object { node $_.FullName }
```

`QJ-Doodads.original.js` is retained as the upstream baseline for compatibility comparison.
