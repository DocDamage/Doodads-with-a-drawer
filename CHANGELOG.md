# Changelog

## Unreleased — 2.0.0-alpha.1

- Character sun shadows now include visual equipment layers, so capes, hats and shields change the shadow's shape.
- 3D rain and snow are now drawn in depth bands sorted in with trees, characters and hills, so drops behind them no longer show through.
- Fixed MZ's Effekseer animations in the 3D view: they played where the target would be on the flat map, off to one side, and didn't shrink with distance. They now play on the target as drawn, at its size.
- Added tileset objects standing up in the 3D view: a per-map option lifts B–E objects with ☆ tiles (tree tops and their trunks), or every B–E tile, off the ground as billboards, without changing the map.
- Fixed a crash after opening the menu, a battle or a map transfer on a map with glowing lamps, particles or 3D weather ("Cannot read property 'valid' of null" or "'uvsFloat32' of null"). MZ destroys every sprite texture of the scene it leaves, and the plugin's shared light, particle and weather textures were destroyed with it.
- Faster 3D terrain: on a 200 × 200 world map with view distance 64, terrain and a storm went from 18 to 58 fps. The terrain no longer allocates per frame, sorts with a radix sort, is rebuilt every few tiles instead of every tile, and draws level ground and fully faded ground more cheaply; the 3D and terrain settings are worked out once a frame.
- The README and guide now say RPG Maker MZ only: nothing since 2.0 has been tested in MV.

- Added 3D quality levels: the players' Effects Quality option (High, Medium, Low, Off) now also scales the 3D view down for slower machines, with a shorter view distance (fog pulled in to match), fewer weather drops, no wakes on Low and simpler hills. The option now shows in Options whenever a map uses the 3D view. The editor always shows maps as set.

- Added 3D-only height settings for standing doodads and characters, so tall tileset art can be brought in proportion in the 3D view without changing the 2D map; editor picking and boxes match.
- Added day and night to the 3D view: a sky that follows the clock (day blue, warm sunrise and sunset, night with twinkling stars), a sun and moon crossing the sky on the shadows' path, hill shading and water glints from the current sun or moon, and fog that fades into the sky.
- Added 3D weather: MZ's Set Weather Effect (rain, storm, snow) falls through the 3D world around the camera, with wind-slanted rain that splashes on the ground and raised terrain, raindrop ripples on water, drifting snow, fog fading, night dimming and MZ's weather darkening. Per map: on/off and density.
- Added rippling water to the 3D view: moving waves bend what shows through water tiles and catch the light (dimmer at night), shores stay dry, and boats, ships and anything moving through water leave spreading wake rings with foam. Works on flat ground, round worlds and raised terrain, and across the seam of looping maps. Strength, speed, sparkle and wakes are set per map.
- Added terrain height to the 3D view: mountains and forests rise automatically on world tilesets, with heights by terrain tag, by region, or painted with a Terrain brush (raise, lower, flatten, set, erase; one undo step per stroke). Smooth (rounded hills and ranges) or stepped (cliffs) ground, slope shading, hills hiding what's behind them, characters standing on the ground, doodads kept to level ground (red boxes mark any left on a mountain), clicks on slopes, optional blocking of steep steps, and round worlds supported.
- Added curvature control for round worlds: a Curvature slider in the 3D View panel (0 flat to 100 tiny planet) and curvature and shape on Set Camera, eased with the camera, so a cutscene can turn a flat map into a planet and back. Ray tests now stay accurate for nearly flat curves.
- Added round worlds to the 3D view: a planet (curves away all round, with a radius that can fit a looping map so one lap is the map's width) or a rolling log (curves away ahead), with things past the horizon hidden, optional leaning with the curve, and clicks, fog and editor boxes on the curve.
- Fixed 3D billboards: lighting tints were not applied, and scaled sprites showed thin lines from neighbouring atlas pixels along their edges.
- Added a 3D view for any map: tiles, floor doodads, shadows, reflections and lighting on a perspective ground plane; characters, gear and standing doodads as distance-sorted billboards; camera tilt, turn, field of view, zoom, radial fog and a parallax sky; optional Q/W camera turning with camera-relative arrow keys and facings; touch-to-move through the ground; editor picking, dragging and yellow selection boxes in 3D; and the Set Camera, Reset Camera and Set 3D View plugin commands.
- Added visual equipment: <visual> notetags on weapons, armors, states, actors and classes build characters from layered parts (paper doll) or draw gear in front of or behind them. Named parts act as slots, so armor replaces the body's shirt, and "up" sets a different order while facing up (capes, shields). Also base layers, hide tags, colours from switches and variables, {alias} image names for body types, and side-view sheets for battlers. Layers show on the player, followers, tagged events (or events wearing an actor's look), side-view battlers, water reflections and the save screen, and the equip screen previews the highlighted item. The map panel has a try-on preview and a notetag builder. Plugin commands: Set Visual Alias, Add/Remove Visual Layer, Set Visual Colour.
- Added an animated map destination marker: drawn shapes in any colour, images with frames, looping database animations or VFX, blend, size, pulse, spin and bob, above characters or on the ground, and optional dots along the path. The Set Destination Marker plugin command changes it mid-game.
- Added editor tools: per-map layers (show/hide in the editor, lock, hide in the game, active layer); symmetry (left/right, top/bottom, four ways) for stamps and brushes; a biome brush with weighted art, spacing, edge thinning and patchiness; dressing rules that place props along water edges, at wall bases, beside or inside regions, on terrain tags or open ground; a visual save history that outlines and restores single doodads and events; animated drawer thumbnails; and a Ctrl+K command palette.
- New doodads get a uid so history can follow them.
- Added spatial sound: event and move-route sound effects get quieter with distance and pan by direction, with automatic pitch and volume variation; ambient loops and repeating sound effects on doodads and events (<sound: ...>); per-map echo; background sounds by region with fades; <spatial>/<no spatial> tags; and the Play SE At plugin command.
- Added particle emitters on doodads (11 presets, adjustable amount, layer and offset), grass and bushes that bend when walked through and can drop leaves, and a VFX builder: effects made of particle and sprite-sheet layers, six built-ins, saved with the project, played with the Play VFX plugin command or looped on a doodad.
- Added character animation: sheet names set frames per row ([f8] or %(8)), single-row ([d1], mirrored) and 8-direction ([d8]) layouts; idle and run cycles from Name_idle / Name_run sheets with auto-detect and preloading; Play/Clear Character Action with hold, loops and wait; and optional diagonal movement for the player.
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
