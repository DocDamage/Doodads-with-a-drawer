# Changelog

## Unreleased — 2.0.0-alpha.1

- Fixed re-indexing discarding hand-edited ("manual") slices whenever an image changed or the index was upgraded.
- Sidecar atlas metadata (Aseprite, TexturePacker, `.saf.json`) is now actually used for slicing, and rotated frames follow PIXI's convention so they crop and export correctly.
- Fixed audio previews stopping the map's BGM/BGS; previews now leave or restore background audio.
- Fixed eyedropper and right-click hit-testing, tool button highlights, a spurious same-session recovery prompt, restoring pre-rename backups, misleading save-rollback errors, and stray `.tmp` files after failed writes.
- Unreadable workspace JSON files are now reported when the workspace opens.
- Added on-map selection outlines and a placement grid drawn in map space, an audio-specific inspector, clearer import results, kept sub-folders when importing into `img/doodads`, grouped copies that stay grouped, and the 505 movement-route lines the MZ editor expects.
- Fixed full-screen overlays (import dialog backdrop, grid) collapsing in MZ's bundled Chromium, which lacks the CSS `inset` shorthand.
- Renamed the project to Doc's Doodads (`Docs-Doodads.js`, `DocsDoodads` namespace, `DocsDoodads*.json` data files, `dd-` UI ids). Projects saved by QJ-Doodads keep working: legacy plugin settings, `DoodadsQJ.json`, the asset library, templates, layouts, backups, and recovery snapshots are read automatically and saved under the new names.
- Added the virtualized visual asset workspace and tokenized search.
- Added known-format, grid, metadata, transparent, and opaque sprite slicing.
- Added trimmed and rotated atlas-frame export support.
- Added genuine MZ event creation, event templates, audio events, collision, and modern map-editing operations.
- Added transactional Explorer import with cancellation and rollback.
- Added atomic multi-file project saves, conflict detection, recovery, and manual backup restoration.
- Added incremental cancellable asset indexing and stale-file cleanup.
- Added dependency-free verification and GitHub Actions CI.
- Fixed issues found in manual MZ Playtest testing: F10 now opens the workspace; editor shortcuts, drag-drop, and wheel scrolling work; the game world is frozen while editing; and text fields accept normal typing.
- Fixed asset indexing to read real PNG dimensions so face, IconSet, and character sheets slice correctly.
- Fixed drag-to-map placement, full-size doodad frames, and selecting doodads by their visible bounds.
- Fixed generated events storing `characterName` with a `.png` extension; events can now use any character on an 8-character sheet.
- Added Faces, Battlers, Backgrounds, and System categories, manual asset tags, zero-value slice pivots, and a wrapping category tab bar.
