# Changelog

## Unreleased — 2.0.0-alpha.1

- Added post-processing: bloom, colour grading, vignette, film grain, chromatic aberration, lens distortion, CRT, pixelate, sharpen and tilt-shift, with nine presets, a live builder (Post FX), a game-wide look plus per-map looks, hold-to-compare, quality levels and an Effects Quality option for players. Plugin commands: Set Post-Processing Look (fades) and Play Screen Effect (impact zoom, shockwave, chromatic punch, bloom flash).
- Added Export Map Image: the whole map as one PNG, at 100/50/25%, with or without characters and colour effects.
- Fixed editor panels opened from the toolbar (Asset Tools, World View) using the page's default serif font and staying on screen, unstyled, after the editor closed.
- Fixed the crash-recovery prompt reappearing each time the editor opened after it had been answered.
- Added world atmosphere settings: a day/night clock (running or from variables) with darkness keyframes and lamps that switch on after dark; a sun that turns shadows through the day; character shadows shaped like each sprite (correct in tall grass, cut short under roof regions); see-through tall doodads (fade or outline); water reflections; motion blur with an Options toggle; seasonal art swaps and season-only doodads; and animated appear/disappear (fade, pop, rise, dissolve, crumble). Plugin commands: Set Time of Day, Pass Time, Clock Control, Set Season, Set Atmosphere Effect. Event tags: <shadow>, <no shadow>, <motion blur>, <no motion blur>, <no reflection>.
- Fixed the Shimmer motion drawing nothing: its shader used a different precision for inputSize than PIXI's vertex shader, so WebGL refused to link it.
- Doodads render in the tilemap again and sort with characters by their base line (below / sorted / above). QJ z values migrate to the matching layer.
- Tint, hue, blur, contrast, sepia, brightness, blend mode, and switch/condition visibility are applied at runtime again; they were stored but ignored since the rewrite.
- Added per-doodad motion (sway, bob, pulse, flicker, shimmer), shadows from sprite transparency, lights with map ambient darkness, and the Set/Reset Ambient Light plugin commands.
- Added Trace from Art collision, and undoable inspector sections for all doodad properties (multi-selection too).
- Added the path tool, prefabs with update/sync, a rule-based scatter brush (spacing, regions, terrain tags, impassable tiles, flip, hue), and drag-to-move with smart guides.
- Added Go to Map, a disk-backed cross-map clipboard, Copy/Move to Map, neighbouring maps with edge mirroring, and World View.
- Added Where Used, transactional Rename/Move that updates every reference, Find Unused Files, duplicate and look-alike finding, live reload, and per-map art packing.
- Fixed unsaved event edits from one map being written into another map's file after changing maps; staged edits are now tagged with their map and each map saves to its own file.
- Fixed crash recovery restoring doodads into whichever map was open instead of the map they came from; staged event edits are now recovered too.
- Fixed doodads disappearing on looping maps when the camera crossed the seam.
- Fixed a game-stopping PIXI texture error when a doodad's image is replaced by a smaller one.
- Fixed stale thumbnails for files changed while the game was closed, a drag that kept going after a missed mouse-up, the toolbar overflowing narrow windows, and the transaction-artifact check in `verify-project.js` never reporting anything.

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
