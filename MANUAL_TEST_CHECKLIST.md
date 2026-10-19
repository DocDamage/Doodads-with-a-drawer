# RPG Maker MZ Manual Test Checklist

Use a disposable copy of an RPG Maker MZ project. Keep the editor closed while testing workspace saves unless the scenario explicitly tests conflicts.

## Preflight

- [ ] Copy `Docs-Doodads.js` into `js/plugins/` and enable it after UltraMode7, if used.
- [ ] Confirm the project opens normally before enabling the plugin.
- [ ] Start Playtest and confirm no console error appears before opening the editor.

## Definition-of-done workflow

- [ ] Press F10; the editor opens and the map remains interactive. On a first run the welcome card appears; the hint bubble changes as you pick a tool or an item.
- [ ] Confirm cached assets appear immediately and indexing progress finishes without freezing.
- [ ] Search by text and with `type:`, `tag:`, `folder:`, `category:`, `favorite:`, and a negative term (`-tag:`). Add items to a collection and pick it beside the search box.
- [ ] Open a standard 8-character sheet, `$` character, Face sheet, IconSet, and grid sheet.
- [ ] Open transparent, opaque-white, noisy, and irregular sheets in the slicer.
- [ ] Confirm low-confidence results request review instead of claiming a clean detection.
- [ ] Move, resize, add, delete, split, merge, rename, and reorder slice regions; save and reopen them.
- [ ] Export a normal, trimmed, and rotated metadata frame and visually compare each PNG.
- [ ] Drag a decorative image to the map; verify ghost position, grid snap, Alt free placement, and stamping.
- [ ] Drag a character and create a genuine event from at least NPC, Door, Chest, and Transfer templates.
- [ ] Assign no collision, full bounds, bottom third, trunk, wall, and a custom collision rectangle.
- [ ] Exercise selection, marquee, copy/paste, duplicate, nudge, align, distribute, group, lock, hide, and Z-order.
- [ ] Handles on a picked doodad: resize from each corner (Shift keeps proportions), turn with the knob (Shift snaps to 15°), a flipped doodad stays flipped, undo each; no handles in 3D or with several picked.
- [ ] Pick doodads with different opacity, light and blend: Details shows —, a half-ticked box and — mixed —; leaving them alone changes nothing; one edit sets all. Drag a number label and use the arrows.
- [ ] Ctrl+A, Select Same Art, Select Everything on a layer and Invert Selection pick only reachable doodads; right-clicking one of several picked keeps them picked.
- [ ] Paste in Place (Ctrl+Shift+V) on the same map and on another map lands at the copied position.
- [ ] Replace Art for the picked doodads, for this map and for every map: pictures change, positions and lights stay, Undo brings them back, locked doodads are skipped.
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
- [ ] Scatter's circle follows the mouse; right-drag erases only the picked item inside it (red circle, no menu); undo the stroke; `[` and `]` resize Scatter, Paint and Hills.
- [ ] Drag doodads with smart guides, Alt and Shift; undo.
- [ ] While dragging, the readout follows the cursor with position, tile and size; base lines line up with a neighbour's; alone, edges and the base snap to tile lines (teal).
- [ ] Show Collision: boxes by preset, red tiles under them, grey tiles where the map blocks; the key lists the presets on the map and updates when one changes; a doodad on a layer hidden in game is faint; reopening the editor keeps it on.
- [ ] Status bar: tile and pixel follow the mouse; picked count, layer, zoom; "Not saved" after an edit and the save time after saving.
- [ ] Go to another map, paste, Copy/Move to Map, link neighbours, mirror an edge tree, and open World View.
- [ ] On a looping map, stand near the seam and confirm doodads and lights stay put while the camera wraps.
- [ ] Where Used and Rename/Move a character sheet used by events; open the project in MZ and confirm events still show it.
- [ ] More → File Check: Find Unused Files and Find Duplicates; check More Like This.
- [ ] Edit an image in another program while the editor is open; the Item Bag and placed doodad update. Replace it with a smaller image and confirm the game keeps running.
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

- [ ] Open More → Screen Looks, apply each preset, and adjust sliders; undo a slider drag in one step. Hold to Compare.
- [ ] Give one map its own look and another No effects; walk between them. Confirm battles use the game-wide look.
- [ ] Turn Affect pictures off and show a picture; it stays crisp. Message windows are never affected.
- [ ] Use Set Post-Processing Look with a fade, then Back to the map's look. Play each screen effect centred on the player and on an event.
- [ ] Set Quality to Low, and Effects Quality in Options to each value; Off removes every effect.
- [ ] Export a map image at 100% and 50%, with and without characters; open it and check there are no seams.
- [ ] Close the editor with Screen Looks and File Check open; both close too.

## Particles, VFX and character animation

- [ ] Give doodads each particle preset; check Above/Below, Amount and offsets; delete and undo one.
- [ ] Turn on Bend when walked through for a grass patch; walk, dash and stand in it; Drop leaves.
- [ ] In More → Effects Maker, duplicate Explosion, add a sprite-sheet layer, change values with Replay on change, rename and delete; undo.
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
- [ ] Mirror left/right, top/bottom and four ways with Stamp, Scatter and Paint; move the axis; undo.
- [ ] Build a biome from two or three assets (Add to Biome), paint, adjust spacing, edge thinning and patchiness.
- [ ] Make dressing rules for water edges, wall bases and a path region; Dress Map, Re-roll, Clear; check events and blank tiles are skipped.
- [ ] Save, change doodads and events, open More → Old Saves, compare, and restore single items.
- [ ] Hover character, door and sliced-strip assets in the Item Bag.
- [ ] Rest on an item: the hover card shows size, frames, depth, uses; its buttons work; moving onto the card keeps it open.
- [ ] Sort the bag each way; reopen the editor and the sort is kept.
- [ ] Type a search with several terms: chips appear; × removes one; save it, reopen the editor, click the saved chip; × forgets it.
- [ ] Open an empty Favourites, Prefabs and Recent tab and a search with no results: each says what to do, and the button works (Bring In Files opens a file picker).
- [ ] Ctrl+K: run a tool, a preset, Go to map, and pick an asset.

## Editor look and layout

- [ ] Each top bar tool shows its name and highlights while on; its options card opens under it and closes with Esc or a click elsewhere.
- [ ] More opens and closes; each tool in it opens its panel and closes More.
- [ ] Fold the Item Bag and Details to their tabs and open them again; reopen the editor and confirm they stay as left. Press H.
- [ ] Details is titled with what is picked (a doodad, an event, several things, the map).
- [ ] Sounds on and off in More; the editor's own font shows (rounded letters), and Japanese text in names falls back cleanly.
- [ ] Each layout (Mapping, Events, Characters, Tiles, Compact) leaves the map in view.
- [ ] Undo per map: make steps on a map, Go to Map elsewhere and back: the toast says the steps are back, Undo works; change the map in MZ while away: its steps are let go.
- [ ] Regions: paint, rub out, Alt+click pick, [ and ]; the legend shows counts and uses; leave and come back before saving: the regions are still there; Save, reload in MZ: the regions are in the map; Show terrain tags.
- [ ] `DocsDoodads.api.place({ art: 'img/doodads/...', x, y })` from the console draws a doodad at once; `move`, `set` with new art, `remove`; save in the editor: the placed doodad is not written.
- [ ] Traversal with a gamepad: the right trigger jumps, the left flies and lands; pick other buttons in World > Traversal and the old ones go back.
- [ ] On-screen buttons set to Always: Jump and Fly show bottom right, hide during messages; a tap flies without walking the player; Land when flying.
- [ ] Doodad Files: One file per map: save; `data/DocsDoodads/` has one file per map with doodads; the game loads them (deployed too); empty a map and save: its file goes; back to one file: the folder empties.
- [ ] States: name a door, add an Open state with other art and no collision; Preview shows it; in game Set Doodad State "Open" crossfades it and the player walks through; save, load: still open; blank state follows its switch again.
- [ ] A lamp with a Lit and an Unlit state (light off) at night; Set Doodad Light off and on; a variable-driven state.
- [ ] Touch: a common event on Action facing the doodad and on a click; Walking into it runs once per bump; Also go to its next state opens and closes a door; `DocsDoodads.WorldState.touched()` inside the event.
- [ ] Problems: delete a doodad's picture file, move a doodad off the map, give a lamp a light on a bright map, point a sound at a missing file; each is listed; Fix and Go To work (Go To on another map too); Every map scope.
- [ ] Check Reach on an exterior map: walkable tiles shaded; a door behind a wall listed; a gate blocked by a guard says a character is in the way; From a Tile works.
- [ ] Animation: a 4-frame strip set to 4 across loops; back and forth; once on a switch (flip it from an event); hold frame 2; speed 0 holds still. Packed maps keep frames inside their region.
- [ ] Capture a picture (no outlines in it) and a 3D orbit GIF; open the GIF: it loops round the map and the camera is back where it was. Remove `screenshots/` from a test project afterwards.
- [ ] Use the same right-click actions a few times: they show as a row at the top of long menus.
- [ ] Pick each tool for the first time: its tour shows next to its options or the map; picking another tool closes it; "No more tours" and Replay Tool Tours work.
- [ ] Add Sample Items in a disposable project: four pictures, two prefabs and a biome appear; adding again adds nothing; place the garden and paint the meadow. Remove `img/doodads/samples` and `data/DocsDoodadsPrefabs.json` afterwards if the project should stay clean.
- [ ] What's New shows once after an update and not for a first-time user.
- [ ] Palette: "grid toggle" finds Toggle Grid; a command used twice shows under Recent; "time 6pm", "go to map 3", "season winter" and "size 125" work.
- [ ] Map tabs: open three maps; tabs appear, the current one marked; edit one and switch: its tab keeps a dot until Save; × removes a tab.
- [ ] Folder view: switch, open nested folders, search narrows the tree, reopen the editor and folders stay open; switch back to cards.
- [ ] Clock: on a map with day and night, drag the time and see lamps, shadows and (3D) the sky follow; pick a season and see season art; ▶ runs the day; Now goes back.
- [ ] Show Sounds on a map with sound doodads and region sounds; Listen beside them, in a region and by water with an ambience layer: the right sounds play at sensible volumes, the list matches, Stop and Esc end it.
- [ ] Show Speed on a heavy 3D map: numbers update, red past the budgets; turning it off leaves nothing behind.
- [ ] Look: 125% and 150% fill the window, popovers open under their buttons, the bag and Details resize with the mouse; Dark and High contrast are readable everywhere (bag, Details, cards, dialogs, pills, Messages); Colour-blind safe changes guides, brushes and collision colours, and the key matches.
- [ ] Details: open and close sections, change selection and come back: they stay as left; pin two sections and they lead in pin order; unpin.
- [ ] Tooltips appear after a short rest with the shortcut in a key cap; clicking or typing hides them; no browser tooltip shows as well.
- [ ] Delete doodads: the message has Undo, which brings them back; it stays while the mouse is on it. More > Messages lists the recent messages; Clear empties it.
- [ ] Bring in a folder of files: the card closes and a pill counts them; Cancel stops it. Pack a map with many pictures and Cancel: nothing is written. Auto-Slice a big sheet: a pill with Cancel.
- [ ] Question cards (save a layout, add to a collection, rename a prefab, Cut into a grid): the name is selected to type over, Enter answers, Esc and a click outside cancel, and editor shortcuts don't fire behind the card.
- [ ] Delete a layer with doodads on it, a collection and a prefab: each asks with a red button; an empty layer goes without asking.

## Traversal, zoom and sound focus

Test on an exterior map with water, a looping world map and a map with terrain height.

- [ ] Jump (C) over a one-tile gap and a fence, up a small ledge; not onto an event or a solid doodad. Glide off high ground.
- [ ] Swim into deep water and out; the swimming sheet and stroke sound when set; a no-swimming region.
- [ ] Dive (C in deep water) to the map set under it and surface again.
- [ ] Fly (F) over trees and water, past a no-fly region's edge; no events or battles from the air; land only where the party can stand. Repeat in 3D.
- [ ] Climb a climbable region; slide on ice into a wall.
- [ ] Give an ability a switch; use Set Traversal and Traversal Action; save and load.
- [ ] Zoom in with the wheel and + / -, and with Set Zoom (with wait); on a flat map and in 3D; save and load at a zoom.
- [ ] Zoomed in: the music drops, nearby event and doodad sounds get louder, far ones fade sooner.
- [ ] Ambience layers near water, trees, open ground, a doodad name, a region and a terrain tag; walk past them and listen for panning.
- [ ] Footsteps on a region, a terrain tag, shallow water, bushes, forest and elsewhere; dash; followers.

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
- [ ] Tag a weapon `<visual: Hero.aseprite#Sword>`; equip it in a playtest; save the `.aseprite` with a change and watch the wearer update. Name a layer that isn't there and read the warning.

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
- [ ] Hills shows height numbers under the brush; a Hard edge raises the whole circle the same, Soft less towards the rim.
- [ ] Set Editor Toggle Key to `Ctrl+F10`: F10 alone does nothing, Ctrl+F10 opens and closes, the Done tip says Ctrl+F10. Set it to `E`: typing E in the search box does not close the editor.
- [ ] 3D water: ripples on a sea and a lake, strength/speed/sparkle sliders, ripples off; sail a boat and a ship and watch the wakes; cross a looping map's seam; night; with terrain on.
- [ ] 3D height: shrink and grow standing doodads and characters; check feet stay put, gear and balloons follow, and clicking and dragging doodads in the editor still lands on them.
- [ ] 3D day and night: run the clock and preview times in the editor; look east at dawn and west at dusk for the sun; stars at night; hills and water lit from the sun's side; a map with a parallax; the option off.
- [ ] 3D weather: Set Weather Effect rain, storm and snow at powers 1, 5 and 9, with fades; at night; on water; with terrain; on a planet; turn 3D weather off (MZ's flat weather returns); leave 3D.
- [ ] 3D quality: in a project with a 3D map and no post-processing, Effects Quality shows in Options. At Medium and Low, check the view gets shorter without the ground's edge showing, rain and snow thin out, wakes stop on Low, and hills still look like hills (characters stay on them). Open the editor: the map shows as set. Save and reload the option.
- [ ] Curvature slider from 0 to 100 and back; Set Camera easing flat to planet, planet to rolling log, and back to flat.
- [ ] Walls stand up in Stepped and Smooth; turn the camera to see their sides and ends; a floor decal crossing a wall stays on the floor; roofs and wall decorations stay flat; a flat region.
- [ ] See-Through in 3D: Fade, Outline and Both behind a tree and a wall; the outline includes gear.
- [ ] Sky video: a 360° panorama turning with the camera, Fill, speed, day and night, behind a flat map; Set Sky Video to another, none and back.
- [ ] Models: an animated model (name, number, none, speed), a skinned character, a cut-out and a see-through material; pick and drag one in the editor; save the model in another program and watch it reload.
- [ ] Round world: planet and rolling log at several radii, radius 0 on a looping map (walk a full lap), lean on and off, turning, clicking the ground near the horizon, and the editor on the curve.

## Safety and recovery

- [ ] Modify `MapXXX.json` externally during a workspace session and confirm the conflict dialog blocks a normal save.
- [ ] Cancel that save and confirm staged work remains available.
- [ ] Force overwrite only in the disposable project and confirm a timestamped backup exists.
- [ ] Restore the latest map backup from More → Info and reload the map.
- [ ] Terminate Playtest with unsaved work, restart, and accept recovery.
- [ ] Place a doodad: Save shows an orange dot; save and it flashes "Saved" and the dot goes.
- [ ] With unsaved work press the toggle key, then Done, then F5, then the window's close button: each asks Save, Don't Save or Keep Editing. Keep Editing stays, Save saves first (a conflict keeps the editor open), Don't Save puts the doodads and moved events back and leaves no recovery offer. With nothing unsaved, each closes at once and NW.js exits.
- [ ] Make unsaved event edits on one map, change maps, save, and confirm each map file only contains its own edits.
- [ ] Make a recovery/metadata JSON file invalid and confirm fallback is safe and visible.
- [ ] Make the data directory temporarily read-only and confirm save failure leaves the workspace dirty.

## Scale and compatibility

- [ ] Browse a project with at least 10,000 indexed assets and watch memory while scrolling repeatedly.
- [ ] Cancel analysis of a very large atlas and confirm work stops promptly.
- [ ] Run a 30-minute editing session and check that thumbnail memory stabilizes; close the editor and confirm its panels and listeners are gone.
- [ ] Build a deployment (File > Deployment, or `npm run deploy`) and confirm F10/editor UI/filesystem authoring are unavailable outside Playtest.
- [ ] Deploy once with **Exclude unused files** on: the game keeps running, missing doodads are skipped, and the console names them.

Record the RPG Maker version, NW.js version, test project copy, failures, screenshots, and console logs with the release candidate.
