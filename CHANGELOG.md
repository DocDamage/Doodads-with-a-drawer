# Changelog

## Unreleased — 2.0.0-alpha.1

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
