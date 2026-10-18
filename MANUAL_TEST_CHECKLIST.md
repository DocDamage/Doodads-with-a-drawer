# RPG Maker MZ Manual Test Checklist

Use a disposable copy of an RPG Maker MZ project. Keep the editor closed while testing workspace saves unless the scenario explicitly tests conflicts.

## Preflight

- [ ] Copy `Docs-Doodads.js` into `js/plugins/` and enable it after UltraMode7, if used.
- [ ] Confirm the project opens normally before enabling the plugin.
- [ ] Start Playtest and confirm no console error appears before opening the workspace.

## Definition-of-done workflow

- [ ] Press F10; the workspace opens and the map remains interactive.
- [ ] Confirm cached assets appear immediately and indexing progress finishes without freezing.
- [ ] Search by text and with `type:`, `tag:`, `folder:`, `favorite:`, and a negative term.
- [ ] Open a standard 8-character sheet, `$` character, Face sheet, IconSet, and grid sheet.
- [ ] Open transparent, opaque-white, noisy, and irregular sheets in the slicer.
- [ ] Confirm low-confidence results request review instead of claiming a clean detection.
- [ ] Move, resize, add, delete, split, merge, rename, and reorder slice regions; save and reopen them.
- [ ] Export a normal, trimmed, and rotated metadata frame and visually compare each PNG.
- [ ] Drag a decorative image to the map; verify ghost position, grid snap, Alt free placement, and stamping.
- [ ] Drag a character and create a genuine event from at least NPC, Door, Chest, and Transfer templates.
- [ ] Assign no collision, full bounds, bottom third, trunk, wall, and a custom collision rectangle.
- [ ] Exercise selection, marquee, copy/paste, duplicate, nudge, align, distribute, group, lock, hide, and Z-order.
- [ ] Undo and redo each destructive operation.
- [ ] Preview BGM/BGS/ME/SE; verify Stop; drop audio on the map and on an existing event.
- [ ] Import one image, a mixed batch, and a nested folder from Explorer.
- [ ] Exercise Keep Both, Skip, Overwrite, cancel-on-collision, and mid-import cancellation.
- [ ] Save, close Playtest, restart, and verify slices, tags, favorites, layouts, templates, events, and doodads persist.
- [ ] Open the project in RPG Maker MZ and edit the generated events normally.

## Rendering, placement and asset tools

Test these on an exterior map and on a looping world map, not only on interiors.

- [ ] Walk the player behind and in front of a tree set to *Sorted with characters*; check below/above layers with a rug and a canopy.
- [ ] Give doodads sway, flicker and shimmer, a shadow, and a light; set map ambient darkness and fade it with Set/Reset Ambient Light.
- [ ] Hide a doodad behind a switch and a condition; toggle the switch during play.
- [ ] Trace collision from art on a tree and a wall, and walk into both.
- [ ] Draw a fence with the path tool using end and corner pieces; undo it in one step.
- [ ] Save a prefab with an event under it, place copies, update the master from one copy, and sync all copies.
- [ ] Scatter with min spacing, a region rule, and Skip impassable tiles along a shoreline.
- [ ] Drag doodads with smart guides, Alt and Shift; undo.
- [ ] Go to another map, paste, Copy/Move to Map, link neighbours, mirror an edge tree, and open World View.
- [ ] On a looping map, stand near the seam and confirm doodads and lights stay put while the camera wraps.
- [ ] Where Used and Rename/Move a character sheet used by events; open the project in MZ and confirm events still show it.
- [ ] Find Unused Files and Find Duplicates; check More Like This.
- [ ] Edit an image in another program while the workspace is open; the drawer and placed doodad update. Replace it with a smaller image and confirm the game keeps running.
- [ ] Pack a map's art, preview it in Playtest, change a source image, and confirm the stale warning.

## World atmosphere

Test these on an exterior map and on a looping world map.

- [ ] Turn on the running clock; scrub Preview a time from dawn to night and back. Lamps set to After dark fade on and off; shadows turn and lengthen.
- [ ] Set an interior map to Ignore (indoors); confirm it stays lit at night. A cave with its own darkness stays dark by day.
- [ ] Use Set Time of Day, Pass Time and Clock Control; save, load, and confirm the time is kept.
- [ ] Turn on character shadows; walk through tall grass (one shadow, not the whole sheet), jump, and stand under a roof region listed in Stop shadows at regions.
- [ ] Walk behind a tall tree in Fade, Outline and Both modes.
- [ ] Stand on a beach and next to a pond; the reflection starts at the waterline, not on the sand, and bridges stay dry.
- [ ] Turn on motion blur; walk and dash in all four directions; switch it off in Options.
- [ ] Add a season row with Season Variant, preview each season in the editor, switch seasons during play with Set Season, and limit a doodad to one season.
- [ ] Give a switch-controlled doodad each appear/disappear effect and toggle the switch.
- [ ] Disable each effect with Set Atmosphere Effect and re-enable it.

## Post-processing

- [ ] Open Post FX, apply each preset, and adjust sliders; undo a slider drag in one step. Hold to Compare.
- [ ] Give one map its own look and another No effects; walk between them. Confirm battles use the game-wide look.
- [ ] Turn Affect pictures off and show a picture; it stays crisp. Message windows are never affected.
- [ ] Use Set Post-Processing Look with a fade, then Back to the map's look. Play each screen effect centred on the player and on an event.
- [ ] Set Quality to Low, and Effects Quality in Options to each value; Off removes every effect.
- [ ] Export a map image at 100% and 50%, with and without characters; open it and check there are no seams.
- [ ] Close the editor with Post FX and Asset Tools open; both close too.

## Particles, VFX and character animation

- [ ] Give doodads each particle preset; check Above/Below, Amount and offsets; delete and undo one.
- [ ] Turn on Bend when walked through for a grass patch; walk, dash and stand in it; Drop leaves.
- [ ] In VFX, duplicate Explosion, add a sprite-sheet layer, change values with Replay on change, rename and delete; undo.
- [ ] Play VFX on the player (following), an event, a tile and the screen centre, with and without wait. Open the menu mid-effect.
- [ ] Use a [f8] walking sheet, Name_idle and Name_run variants (Add All Detected), and dash; no blinking when switching.
- [ ] Turn on diagonal movement with a [d8] sheet; walk diagonally and into corners.
- [ ] Play Character Action with loops, hold and wait; Clear Character Action. Save and load mid-action.
- [ ] Check a character in tall grass with a tagged sheet (bush depth) and its shadow and reflection.

## Spatial sound

- [ ] Walk around an event that plays a sound effect in a parallel process; it fades with distance and pans left and right. Tag it <no spatial> and compare.
- [ ] Give a doodad a looping background sound and another a repeating sound effect; walk in and out of range; open the menu and return.
- [ ] Tag an event <sound: River, 80, 8>.
- [ ] Turn on echo for a cave map; check menu sounds and music do not echo.
- [ ] Paint a region, give it a background sound with a fade; walk in and out on a map with and without its own BGS.
- [ ] Use Play SE At on an event and a tile.

## Editor tools

- [ ] Add layers; place on the active layer; hide in editor, lock (click and box-select skip it), hide in game; move doodads between layers; delete a layer; undo each.
- [ ] Symmetry left/right, top/bottom and four ways with the stamp, scatter brush and biome brush; move the axis; undo.
- [ ] Build a biome from two or three assets (Add to Biome), paint, adjust spacing, edge thinning and patchiness.
- [ ] Make dressing rules for water edges, wall bases and a path region; Dress Map, Re-roll, Clear; check events and blank tiles are skipped.
- [ ] Save, change doodads and events, open History, compare, and restore single items.
- [ ] Hover character, door and sliced-strip assets in the drawer.
- [ ] Ctrl+K: run a tool, a preset, Go to map, and pick an asset.

## Visual equipment and destination marker

- [ ] Tag an armor <visual: ...> with z behind and in front; equip it; walk in all directions, dash, stand in tall grass, and check the follower.
- [ ] Add a base hair layer to an actor and a helmet with <visual hide: hair>; equip and unequip.
- [ ] Build a paper-doll actor (bare body, base shirt and hair); equip armor with the same part name and check it replaces the shirt; give a cape "up 2" and walk up.
- [ ] Recolour a part with a switch and with a variable; use Set Visual Colour and Set Visual Alias.
- [ ] Give an event <visual actor: N> and another its own <visual:> tags; switch to a page without an image.
- [ ] Open the equip screen and move through items with and without tags; save and check the save screen.
- [ ] Fight a side-view battle with layers that have sv sheets; check attack, guard, damage and victory motions.
- [ ] Try each destination marker style, pulse, spin, bob and layer; path dots; a database animation and a VFX; Set Destination Marker mid-game, save and load.
- [ ] Use the try-on preview and the notetag builder in the map panel.

## 3D view

- [ ] Turn on 3D for an outdoor map with doodad trees and lamps; walk around, including along the map edge and on a looping map.
- [ ] Change tilt, turn, field of view, zoom, view distance and fog in the panel; undo each.
- [ ] Turn on Q / W turning; turn the camera and walk with the arrow keys; check character facings, followers and gear layers.
- [ ] Use Set Camera (with and without wait), Reset Camera and Set 3D View in events; save and load.
- [ ] Night: ambient darkness and lamp lights; sun shadows; particles, VFX, balloons and a battle animation on the map.
- [ ] Click the ground to walk; open the menu and return.
- [ ] Editor in 3D: pick a tree behind another, drag it, box-select, use the grid, place with the stamp and scatter brush.
- [ ] Check frame rate with view distance 40 and 64 on a large map.
- [ ] Terrain height on a world map (automatic mountains and forests), then a region and a terrain tag height; smooth and stepped; walk behind a hill; click on a slope; turn on Steep steps block walking.
- [ ] Terrain brush: raise, lower, flatten, set and erase with different radii; undo each stroke; Clear Painted Heights.
- [ ] 3D water: ripples on a sea and a lake, strength/speed/sparkle sliders, ripples off; sail a boat and a ship and watch the wakes; cross a looping map's seam; night; with terrain on.
- [ ] 3D day and night: run the clock and preview times in the editor; look east at dawn and west at dusk for the sun; stars at night; hills and water lit from the sun's side; a map with a parallax; the option off.
- [ ] 3D weather: Set Weather Effect rain, storm and snow at powers 1, 5 and 9, with fades; at night; on water; with terrain; on a planet; turn 3D weather off (MZ's flat weather returns); leave 3D.
- [ ] Curvature slider from 0 to 100 and back; Set Camera easing flat to planet, planet to rolling log, and back to flat.
- [ ] Round world: planet and rolling log at several radii, radius 0 on a looping map (walk a full lap), lean on and off, turning, clicking the ground near the horizon, and the editor on the curve.

## Safety and recovery

- [ ] Modify `MapXXX.json` externally during a workspace session and confirm the conflict dialog blocks a normal save.
- [ ] Cancel that save and confirm staged work remains available.
- [ ] Force overwrite only in the disposable project and confirm a timestamped backup exists.
- [ ] Restore the latest map backup from Diagnostics and reload the map.
- [ ] Terminate Playtest with unsaved work, restart, and accept recovery.
- [ ] Make unsaved event edits on one map, change maps, save, and confirm each map file only contains its own edits.
- [ ] Make a recovery/metadata JSON file invalid and confirm fallback is safe and visible.
- [ ] Make the data directory temporarily read-only and confirm save failure leaves the workspace dirty.

## Scale and compatibility

- [ ] Browse a project with at least 10,000 indexed assets and watch memory while scrolling repeatedly.
- [ ] Cancel analysis of a very large atlas and confirm work stops promptly.
- [ ] Run a 30-minute editing session and check that thumbnail memory stabilizes.
- [ ] Repeat the core open, browse, place, undo, and save workflow in MV if MV support is required.
- [ ] Build a deployment and confirm F10/editor UI/filesystem authoring are unavailable outside Playtest.

Record the RPG Maker version, NW.js version, test project copy, failures, screenshots, and console logs with the release candidate.
