# MZ playtest plan for the built backlog rows

**Status:** written 17 November 2026. 66 rows in [RECOMMENDATIONS.md](../RECOMMENDATIONS.md) say
"Built; MZ playtest pending". Each one has source code, automated tests on the stand-in engine and a guide entry,
but nobody has played it in RPG Maker MZ yet. This plan sorts those rows into sessions by what each session needs.
The steps for each row are already in [MANUAL_TEST_CHECKLIST.md](../MANUAL_TEST_CHECKLIST.md), and every row below
links to its lines there.

A row becomes **Done** only after it passes here, and the evidence goes into a QA record (see the end of this plan).
Feature 7.4.5 (the list of plugins it works with) and 9.5.1 (the playtest that runs itself) aren't in this plan.
They have plans of their own: [BACKLOG_7_PLAN.md](BACKLOG_7_PLAN.md) for 7.4.5, and the
`npm run playtest` step on checklist line 40 for 9.5.1.

## Before every session

- [ ] Run `npm install`, then `npm run verify`. Both must pass on the commit under test, so write its hash down.
- [ ] Make a fresh disposable MZ project and run `npm run sample -- <that project>`. Starting Town, the looping
      Field Map and the cave in this plan are its maps (MAP001, Sample Field and Sample Cave). Never test on the
      source project. Make the project with MZ's File → New Project. A plain copy of MZ's `newdata` folder lacks
      `windowOpacity`, `screenScale` and `picturesUpperLimit` in `System.json`, and the title screen then stops with
      "Cannot read property 'clamp' of undefined".
- [ ] Do the three install checks at the end of the checklist's Preflight section (plugin enabled, project opens,
      and no console error before F10).
- [ ] Write down the MZ, NW.js and Chromium versions, Windows version, GPU and driver, screen size and editor zoom.
      Sessions F and G also need the phone models and OS versions.
- [ ] Keep DevTools open (F8). Any console error fails the row it happened in, even when the feature looked fine.

## How to mark a row

Put **Pass**, **Fail** or **Pass with note** in the Result column. Then add the date and the commit's short hash.

- **Fail:** open a GitHub issue that names the row ID and has the steps to repeat it. Link the issue in Notes.
  The row stays "Built; MZ playtest pending".
- **Pass with note:** use this when the feature works but something small is wrong, such as wording or a slow frame
  on old hardware. The row counts as passed, and the note goes into the QA record.
- **Can't test:** if the hardware or files aren't available, write what's missing in Notes and leave Result empty.
  Don't mark it Pass.

Links point to lines in the checklist. Open one on GitHub, or in an editor at that line.

## Session A — the sample project (start here)

Plain PC, no extra hardware. These rows make the maps every other session uses.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.8 | A sample project (`npm run sample`) | [353](../MANUAL_TEST_CHECKLIST.md?plain=1#L353) | **Pass** 2026-11-18 (`fix/sample-project`) | The first run on `978d538` failed: the door never opened, the flashlight showed on every map, the data had the old `DoodadsQJ.json` name and the cave floor was grass. Fixed in `scripts/sample.js` and run again in real MZ 1.10.0 (NW.js 0.48.4, RTX 3060). Town → field (3D) → cave → field → town with no errors at 60 fps. OK opens and shuts the door. The flashlight shows only in the cave (switch 1, set by the transfers). The cave is on the Dungeon tileset. The data is in `DocsDoodads.json`. The field doesn't loop (its way back to the town is on the west edge), so turn looping on in MZ for the looping checks |
| 8.4.7 | Robot tester (Test Every Map / Test This Map) | [19](../MANUAL_TEST_CHECKLIST.md?plain=1#L19) | | Partly tested 2026-11-18 `978d538`. Test Every Map: "3 of 3 map(s) reached from the start. Nothing wrong was found." Test This Map on the town: "Played 1 event(s) … everything was put back". Switches, variables, self switches, items, gold, position and events matched exactly; afterwards the followers were gathered onto the player's tile, as after an MZ transfer. Still to test: a map with a dead end, a one-way door and a wall landing, and the message, choice, shop, battle and parallel events (the sample has only transfers) |

## Session B — the editor with fresh preferences

Run 2026-11-18 on a new project with no art (`D:\dev\mz-qa\fresh`). Seen once: right after the first Play From Here that also saved the project, the party wasn't drawn until the player moved. Two repeats didn't show it.

Plain PC. Before starting, delete the editor's preferences, so the first-run features show as a new user sees them.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 8.1.4 | First-map quest | [30](../MANUAL_TEST_CHECKLIST.md?plain=1#L30) | **Pass** 2026-11-18 (`fix/session-b`) | First run on a new project (MZ 1.10.0, NW.js 0.48.4): the quest card never appeared. It started before the editor finished opening, so it was never drawn (fixed). After the fix it appears, ticks each step off as you go, and Replay, Not now (back on next open) and Skip (stays gone) work. Previews of night showed nothing with the clock off, the default (fixed: previews now darken the map, and the lamp lights). The card had no Add Sample Items button, because MZ's 4,362 stock files count as art (fixed: it's offered while there are no doodad pictures, and afterwards the bag opens on Doodads with the six samples) |
| 8.1.1 | Simple mode | [38](../MANUAL_TEST_CHECKLIST.md?plain=1#L38) | **Pass** 2026-11-18 (`fix/session-b`) | New preferences open with Select, Stamp, Scatter and Tiles. Show Everything brings back all 11 tools and Keep It Simple shortens them again. Path from Ctrl+K gets a toolbar button and its tour, and the button stays until Done, as the guide says. Older preferences open the full editor. The arrow keys move within the Map menu and across to Art |
| 8.2.4 | Details that starts short | [34](../MANUAL_TEST_CHECKLIST.md?plain=1#L34) |  | Partly tested 2026-11-18 (`fix/session-b`). The lamp shows Appearance and Light. The map's Details: More gives 43 sections, "shadow" finds 5, clearing the search brings them back, and Less shortens them. Still to test: sounds, models, events, mixed selections, pins, and sections rising after use |
| 8.1.5 | Help where you are | [43](../MANUAL_TEST_CHECKLIST.md?plain=1#L43) |  | Partly tested 2026-11-18 (`fix/session-b`). The ? on Details shows the guide's paragraph with Open the Guide (not pressed: it opens an app outside the game). With nothing picked, the card shows section 7 (doodads) rather than the map's settings. Still to test: Help entries in Find a Tool, and Open the Guide |
| 8.2.1 | A bigger window while editing | [41](../MANUAL_TEST_CHECKLIST.md?plain=1#L41) | **Pass** 2026-11-18 (`fix/session-b`) | The window filled the screen on F10, but came back a frame too big (848 × 702 for 832 × 663): restore() was followed by a resizeTo() that NW.js applies to the page area (fixed). Now Done and F5 both bring back 832 × 663 at the same place. A DevTools reload isn't MZ's reload and doesn't restore. Still to test: editor size 125% and 150% |
| 8.2.3 | Moving tooltips | [25](../MANUAL_TEST_CHECKLIST.md?plain=1#L25) |  | Partly tested 2026-11-18 (`fix/session-b`). At 100%, resting on Stamp shows its text, then the drawn clip after a moment, inside the window. The clip fills about half the tooltip's width. Still to test: 125% and 150%, leaving early, Less motion and Windows reduced motion |
| 8.1.2 | Moods | [42](../MANUAL_TEST_CHECKLIST.md?plain=1#L42) | **Pass** 2026-11-18 (`fix/session-b`) | Hovering Cosy Night Village shows a dark night with the lamp glowing, and moving away puts everything back without marking the map unsaved. Clicking Rainy Forest keeps its light and look in the map's settings, and Undo removes them. Weather stays a preview, as the card says. Not tested: a saved custom mood |
| 8.1.3 | Good settings on drop | [12](../MANUAL_TEST_CHECKLIST.md?plain=1#L12) | **Pass** 2026-11-18 (`fix/session-b`) | A bush was placed with "gentle sway, bottomThird collision" and a lamp with "lit after dark", each with Undo settings. Details shows Guessed: bush / lamp. Note: the toast shows the internal name "bottomThird" |
| 8.3.8 | Plain words in Find a Tool | [55](../MANUAL_TEST_CHECKLIST.md?plain=1#L55) | **Pass** 2026-11-18 (`fix/session-b`) | "make it a rainy night" shows its plan (Preview the time 21:00 → Preview weather: rain) before Enter, then runs it. Unknown words show No matches and run nothing. With the clock off, the default, the night didn't show (fixed with the clock bar fix under 8.1.4) |
| 8.2.2 | A truer ghost of what will be placed | [7](../MANUAL_TEST_CHECKLIST.md?plain=1#L7) |  | Partly tested 2026-11-18 (`fix/session-b`). With Stamp, the lamp's preview is drawn in the map at its real size and depth (the rain falls over it), and Escape removes it. Still to test: Scatter, Paint and Path, the twelve-sprite cap, lights and reflections, and Capture |
| 7.2.5 | Panels in their own window | [352](../MANUAL_TEST_CHECKLIST.md?plain=1#L352) | **Pass** 2026-11-18 (`fix/session-b`) | In NW.js 0.48 the pop-out opened an empty window and the panel never moved: NW sends 'document-end', not 'loaded', for a blank page (fixed). Once moved, the Item Bag was squeezed to 100 pixels because docking re-applied its width (fixed), and it was a little wider than its window (fixed). Now: a real click picks a card in the pop-out, Stamp places it in the main window, Ctrl+Z there undoes, the game keeps running, and closing the window docks it back at 250 pixels with its place kept. Details in a Window follows the selection |

## Session C — editing tools on the map

Run 2026-11-18 on `D:\dev\mz-qa\sessc` (a copy of the sample project with the current build, looping turned on for the field, and three test events added to the town). Found while starting: picking a tileset sheet in the Item Bag's Tiles category armed Stamp with the whole sheet as one picture. It now opens the Tiles tool on that sheet (fixed).

Plain PC. Use Starting Town, the looping Field Map (cross the seam) and the cave. For every edit, check that Undo
and Redo work, and that saving, reloading and reopening the project in MZ keeps the change.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.2 | Editing what an event does | [33](../MANUAL_TEST_CHECKLIST.md?plain=1#L33) | | Tested in the game 2026-11-18 (`fix/session-b`) on Starting Town: a sign (text, If/Else, another plugin's command with its argument line, an unknown code 9999), a two-page door and a villager. Show Text: Escape changes nothing, Enter saves, `
` makes two lines, and Ctrl+Z/Ctrl+Y undo and redo. Inserting Control Self Switch and changing its letter, + Page with a self-switch condition, and the door's destination with Pick Map & Tile (to the field and back, the town's unsaved edits kept) all work. Changing the selection with an edit form open closes the card and applies nothing. Save writes exactly the edits, and the If/Else, the plugin command and code 9999 are unchanged byte for byte. After a reload, the sign shows the new text, takes Else, skips the unknown commands without error, turns on C and then runs page 2; the door takes the player to field 5,8. Fixed: the open card kept showing the old text after Undo; kept rows read "Command 111/411/412/0" (now If, Else, End If, End of Block); removing or moving a plugin command left its argument lines behind. After Save and Done, the running game kept the old commands until the map loaded again (fixed: Save now sets the changed events up again; the villager's new line played straight away). Open: the map picker starts on MAP001, not the current destination; Sight shows Remove Sight and writes its tags on an event with no sight once any field is changed. Not tested: reopening in the MZ editor (it doesn't start outside Steam here) |
` makes two text lines, and Ctrl+Z/Ctrl+Y undo and redo it. Found and fixed: the open card still showed the edited text after Undo (now drawn again); kept rows read "Command 111/411/412/0" (now MZ's names: If, Else, End If, End of Block); removing or moving a plugin command left its argument lines (657) behind. Seen: Sight shows its fields with Remove Sight on an event that has no sight. Still to test: switch letter, page conditions, the door's destination on another map (Pick Map & Tile), switching events or maps with a dialog open, and save, reopen in MZ and run. Reopen in MZ and run the edited events |
| 7.1.4 | Schedules for events | [35](../MANUAL_TEST_CHECKLIST.md?plain=1#L35) | | Partly tested 2026-11-18 (`fix/session-b`) on Starting Town, flat, with the clock running: `08:00 8,9`, `12:00 12,9 walk`, `20:00 3,10 hide`. + Add time adds the event's own tile, typed lines go into the note, the map marks each tile with its time, and Use this tile, Undo and Redo work. In play: 09:00 at 8,9; walks to 12,9 at noon; hides at 20:30 (transparent and passable); 03:00 carries yesterday's 20:00 over; 08:30 back and visible. Pause Schedules holds it at noon and resume walks it; hidden after save and load, and back the next morning. No console errors. Found and fixed: when the player stood on the destination, after the 600-frame wait the villager was placed on the player's own tile (now it waits until the tile is free, then steps on). Notes: with the clock Off (the default) schedules and `api.setTime` do nothing, as the guide says; the first-map quest card covers the bottom of Details until Not now. Still to test: looping, cave and interior maps, 3D, busy events and page-specific blocks |
| 7.3.2 | Collision brush | [104](../MANUAL_TEST_CHECKLIST.md?plain=1#L104), [105](../MANUAL_TEST_CHECKLIST.md?plain=1#L105) | | Partly tested 2026-11-18 (`fix/session-b`). Town: a drag paints one row of 12-pixel cells, Undo and Redo take the whole stroke, right-drag erases with no context menu, `[` and `]` resize, Shift-click joins a straight line, Fill fills a closed box and stays inside it, and the blocked colour shows. Looping field (flat): painting and erasing across the seam leave no gap; the cells were saved for both maps. In play after a reload, the filled box stops the player. Found: (1) on a 3D map (the sample field) painting works but nothing is drawn, as the overlay is off in 3D, so the 3D view must be turned off to see it; (2) with grid movement only tiles more than half painted blocked, so a one-cell line never stopped the player (fixed: a step that a painted line cuts is now blocked, straight or diagonal; in play the town's line stops the player from both sides and click-to-walk goes round its end); (3) Check Reach ignored painted collision (fixed). Still to test: square brush, events, Check Reach and destination paths, From Picture (line 105), one-file-per-map storage and a deployed game |
| 7.3.5 | Generated maps | [15](../MANUAL_TEST_CHECKLIST.md?plain=1#L15) | | Partly tested 2026-11-18 (`fix/session-b`) on Starting Town. Found and fixed: the card started at 30 × 24, so on a smaller map (17 × 13) Preview only said "Preview must fit this 17 x 13 MZ map" (it now starts at the map's size). Then: Preview draws the rooms over the map and changes nothing (not marked unsaved); Apply writes the dungeon as one Undo step and one Undo brings the town back. Seen: the default wall tile (4352) draws empty on a tileset with no A3 sheet. Still to test: room stamps, wilderness biomes, Reroll, Escape and map reload, the runtime seed before a transfer, save/reload, the game-only build |
| 8.3.3 | More like this | [350](../MANUAL_TEST_CHECKLIST.md?plain=1#L350) | | Partly tested 2026-11-18 (`fix/session-b`): reached from Find a Tool; a sample box ("Learned 1 kinds of ground"), a fill region shown until Apply, Apply as one Undo step, and Undo. Only grass was there to learn, so the forest-edge sample is still to test. Seen: in Find a Tool, "more like" lists the Help entry above the tool itself |
| 8.3.4 | Ground brush | [22](../MANUAL_TEST_CHECKLIST.md?plain=1#L22) | | Partly tested 2026-11-18 (`fix/session-b`) on Starting Town: Map → Ground Brush, Use Picked (rock), a stroke paints soft-edged rock under the lamps; Undo, Redo and a right-drag erase (no context menu) work; Save writes `img/doodads/ground/Map001_ground.png`; after a reload it shows in play. Found and fixed: the saved mask appeared in the Item Bag as a picture to place (the ground and baked folders are now left out of the bag). Seen: the see-through parts of a texture draw black. Still to test: the looping field and the cave, Effects Quality, a map with everything erased, deploy (Session F) |
| 8.5.1 | Trace over a picture | [36](../MANUAL_TEST_CHECKLIST.md?plain=1#L36) | | Partly tested 2026-11-18 (`fix/session-b`): a 68 × 52 PNG imported (through the same import the chooser uses; the system file chooser can't be driven here) fits the map at scale 12; unlock, Turn 15 and Undo, dragging it and Undo, lock; saved with the map; not shown in play. Still to test: two-point fit, corner scale and turn handles, Show/Hide, looping maps, Capture and export, 3D hiding it, a cleared cache |
| 8.5.2 | A picture into a map | [21](../MANUAL_TEST_CHECKLIST.md?plain=1#L21) | | Partly tested 2026-11-18 (`fix/session-b`) with a drawn island (sea, grass, forest, road, a red mark), 4 pixels a tile. Found and fixed: (1) the colours were grouped wrongly (12 groups, 10 of them empty copies of the sea, with the forest, road and mark merged away), from a cut that split a run of one colour; (2) on a field tileset the forest was painted on the ground layer with nothing under it, so its edges showed black (MZ keeps the right half of A2 on the second layer over grass; the Tiles tool and Picture to Map now do too). Then: five groups guessed right, Apply paints the coast with its edges, forest over grass, the road, one Undo step; tile choices come back for the tileset. Still to test: heights, town, dungeon and room kinds, Ignore lines, Leave alone, packing a kind |
| 8.5.3 | What kind of map (Map Kinds, Edit Kind) | [21](../MANUAL_TEST_CHECKLIST.md?plain=1#L21), [339](../MANUAL_TEST_CHECKLIST.md?plain=1#L339) | **Pass** 2026-11-18 (`fix/session-b`) | Edit Kind on Overworld asks for a copy's name ("Overworld (mine)"), Add a Class "Lava" with tile 3200, and the card switches to the copy. Using it in Picture to Map, the red mark set to Lava paints tile 3200 there and the map records the copied kind. Note: the copy starts without the tile choices made for Overworld |
| 9.4.1 | Tileset flags in the editor | [338](../MANUAL_TEST_CHECKLIST.md?plain=1#L338) | | Tested 2026-11-18 (`fix/session-b`). Found and fixed first: the Tiles card had no Tile settings at all, because its part was built before the Tiles tool's and was replaced by it (renamed so it builds after; a test now checks the card has it). Then: the first change asks first ("Overworld is used by 2 maps"); a click on the A2 grass makes it × for all its shapes and the town impassable; Undo and Redo work; terrain tag steps up with clicks and back with a right-click, no context menu. Save writes `Tilesets.json` (tag 2) with a backup. Not tested: reopening the project in the MZ editor and its database |
| 9.3.2 | Ropes and cables | [27](../MANUAL_TEST_CHECKLIST.md?plain=1#L27) | | Partly tested 2026-11-18 (`fix/session-b`) on Starting Town: Path → Draw a Rope Instead draws a plain cord with end and sag handles; dragging the sag and Undo work; Details → Rope with five torches hung and the Lantern light. At night in a full wind the middle torches sway most, the ends stay put, and the five lights follow without blinking. Seen: a selected rope also shows the usual box and turn handle, though a rope ignores size and turn. Still to test: a textured rope, dragging the ends, Sorted with characters, the seam, deploy, and the previous release |
| 8.4.5 | Map eras | [345](../MANUAL_TEST_CHECKLIST.md?plain=1#L345) | | Tested 2026-11-18 (`fix/session-b`) on Starting Town. Found and fixed: Only in This Era needs doodads picked, but the map's Eras section shows only with nothing picked, so it always said "Pick doodads first" (picked doodads now have Details → Era: every era or one era, one Undo step). Then: Add an Era (Now and Ruined), the house only in Now and the bush only in Ruined, switch 5 picks the era and is saved; in play the house shows with the switch off, and turning it on crossfades to the bush with no errors. Still to test: collision and lamps following, onion skin, Copy Era, Delete Era, a variable |
| 9.4.2 | Animated GIF and APNG in | [8](../MANUAL_TEST_CHECKLIST.md?plain=1#L8) | | Partly tested 2026-11-18 (`fix/session-b`): a three-frame APNG (delays 0.1, 0.1, 0.2 s) through the Add Files card (a drop can't be simulated in this NW.js) becomes a 72 × 24 sheet of 3 frames at 6 game frames each, the original kept; placed, it animates at once. Still to test: GIF, the delay message, wrapped grids, one-frame files, unsupported 16-bit and interlaced files, the slicer and pack round trips, limits, the exported game |
| 9.4.3 | A licence ledger for all art | [11](../MANUAL_TEST_CHECKLIST.md?plain=1#L11) | | Partly tested 2026-11-18 (`fix/session-b`). Found and fixed: (1) for art with no credit yet, the Licence box started as "Other (use text below)", so typing CC0 there saved "Other (use text below)CC0"; it now starts empty; (2) Write Credits listed the ground mask the plugin makes as art without an author (made pictures are now left out). Then: Set Credit with Author and Licence shows "QA Artist — CC0"; `author:QA`, `licence:CC0`, `credit:none` and `-credit:none` find the right files; Write Credits writes CREDITS.txt grouped by author and licence. Still to test: folder credits and clearing an override, multi-pick, rename/move, packs, ZIP notes, replacing CREDITS.txt, the Problems check |
| 7.4.8 | Own parts in the character creators | [318](../MANUAL_TEST_CHECKLIST.md?plain=1#L318)–[320](../MANUAL_TEST_CHECKLIST.md?plain=1#L320) | | Not tested 2026-11-18: needs My parts folders laid out for the MZ generator, LPC and Memao creators (and the LPC and Memao libraries). MZ, LPC and Memao creators |

## Session D — files in and out

Run 2026-11-18 on `D:\dev\mz-qa\sessd` (a copy of the sample project with the current build). Blender 4.5 opened the .glb files headless.

Plain PC, plus Blender to open the .glb, and Tiled or LDtk files. For a first run, use the fixtures in
`scratch/fixtures/map_import/` and `scratch/fixtures/geo/village.osm`. Then test with files from a real project.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.6 | Bringing in Tiled and LDtk maps | [24](../MANUAL_TEST_CHECKLIST.md?plain=1#L24) |  | Flipped/rotated tiles were never drawn in tests. Partly tested 2026-11-18 (`fix/session-d`) on `D:\dev\mz-qa\sessd` with the repo's fixtures and tileset pictures drawn for them (an arrow on each tile to show flips). Tiled `town.tmj` (16 px, a flipped tile, external `props.tsj` with margin and spacing, a Player object layer, a 50% roof layer, a tile object, a collision layer, a hidden layer): the card says it scales ×3 and leaves out the object with no picture; Import writes Map004, two layer pictures, the barrel doodad and the collision, backs up `MapInfos.json`, and opens the map. The flipped tile is drawn flipped, the roof is drawn over the player, the barrel stands where it was, empty tiles are floor, the collision stops the player, it doesn't loop. LDtk `dungeon.ldtk`: both levels are listed (Level_1 from its own `.ldtkl`), Level_0 imports with its IntGrid collision and entity. A missing tileset picture stops it ("Import Map stopped; nothing was kept: Could not read ground.png") and nothing is written; an infinite map is refused with how to fix it. Found and fixed: a layer's opacity was applied twice (drawn into its picture and set on the layer), so the 50% roof showed at about 25%. Not tested: reopening in the MZ editor (it won't start outside Steam here) |
| 8.5.5 | A real place (OpenStreetMap / GeoJSON) | [351](../MANUAL_TEST_CHECKLIST.md?plain=1#L351) |  | Check that no download is made. Partly tested 2026-11-18 (`fix/session-d`) with `scratch/fixtures/geo/village.osm` on the 30 × 20 field: 4 features, 560 m × 445 m, about 19 m a tile, 3 bridges. Found and fixed: the card had no way to choose tiles (it relied on choices made in Picture to Map), so Apply built nothing ("0 tile change(s)") yet still wrote CREDITS_MAPS.txt and closed. It now lists the classes the plan uses with a tile for each, Apply waits until one has a tile, and the credit is written only when something was built. Then: a river 3 tiles wide with its edges, and the road across it where the bridge goes; CREDITS_MAPS.txt has the © OpenStreetMap contributors line; nothing was fetched over the network. Still to test: buildings (the town kind's outline, roof and door tiles), a forest, GeoJSON, heights |
| 8.5.4 | Maps inside maps (Places) | [347](../MANUAL_TEST_CHECKLIST.md?plain=1#L347) |  | MZ must be closed while maps are written. Partly tested 2026-11-18 (`fix/session-d`): Make a Place Here at the town house's door. Found and fixed: (1) the new map had no tiles, so its entrance was a blocked tile and the tree marked the link at once (it now gets this map's commonest walkable ground); (2) the door's transfer only appeared in the game after a reload (Save now adds new events to the running map, and erases deleted ones); (3) the way back landed on a fixed tile below the door (it now looks for a walkable tile beside it). Then: Map006 House under MAP001 in `MapInfos.json` (backed up), walking into the door goes to the house's grass floor, walking out lands below the door, no bounce back. Not tested: reopening in the MZ editor, Make a Grid of Maps, Use a map that exists |
| 8.4.8 | The 3D map as a file (.glb) | [20](../MANUAL_TEST_CHECKLIST.md?plain=1#L20) | **Pass** 2026-11-18 (`fix/session-d`) | Blender. Each file opened in Blender 4.5 (headless). Town (flat): ground 17 × 13 m, one metre a tile, +Z up in Blender (+Y in the file); 7 kinds of standing doodad, each upright facing −Y, sized from its picture (the house 2 × 1.83 m), textures Closest (sharp). Field (3D with hills): ground 30 × 20 m with hills to 4 m, the flowers on the hill stand on its surface; Ground only writes just the ground. 200 × 200 map: 4–5.5 s and no error at every size, Full a 9600 × 9600 picture. Found and fixed: a flat map was written as a mesh of 160,000 vertices instead of two triangles (the height grid was built even outside 3D); now 4 vertices and 1.2 MB at Half instead of 7 MB. Not tested: walls, looking at it in Blender's viewport |

## Session E — playing the game

Plain PC. Play with the keyboard, a gamepad and the mouse or touch. Save and load in the middle of each feature,
and play flat and in 3D wherever the feature has a 3D side.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.3.3 | Movement off the grid | [23](../MANUAL_TEST_CHECKLIST.md?plain=1#L23) | | Compare frame time with it off |
| 7.3.1 | Walking from map to map without a transfer | [348](../MANUAL_TEST_CHECKLIST.md?plain=1#L348) | | No fade, and no pause longer than a frame |
| 9.2.2 | Indoors by region | [334](../MANUAL_TEST_CHECKLIST.md?plain=1#L334) | | |
| 9.2.3 | Bridges you walk over and under | [335](../MANUAL_TEST_CHECKLIST.md?plain=1#L335) | | |
| 9.2.5 | Doodads that ride and travel | [336](../MANUAL_TEST_CHECKLIST.md?plain=1#L336) | | |
| 9.2.6 | Weather that picks itself | [9](../MANUAL_TEST_CHECKLIST.md?plain=1#L9) | | |
| 9.1.5 | Area names | [45](../MANUAL_TEST_CHECKLIST.md?plain=1#L45) | | |
| 9.2.1 | Nearness triggers | [46](../MANUAL_TEST_CHECKLIST.md?plain=1#L46) | | |
| 9.2.4 | Light and sight | [59](../MANUAL_TEST_CHECKLIST.md?plain=1#L59) | | Include the game-only build |
| 9.1.6 | Pins and fast travel | [26](../MANUAL_TEST_CHECKLIST.md?plain=1#L26) | | |
| 9.3.1 | Ambient creatures | [337](../MANUAL_TEST_CHECKLIST.md?plain=1#L337) | | |
| 8.4.2 | A world that remembers | [343](../MANUAL_TEST_CHECKLIST.md?plain=1#L343) | | |
| 8.4.3 | Elements that spread (fire and rain) | [344](../MANUAL_TEST_CHECKLIST.md?plain=1#L344) | | |
| 7.3.6 | A cutscene timeline | [340](../MANUAL_TEST_CHECKLIST.md?plain=1#L340) | | |
| 8.4.4 | Maps that move to the music | [31](../MANUAL_TEST_CHECKLIST.md?plain=1#L31) | | |
| 8.4.6 | Rewind in a playtest | [346](../MANUAL_TEST_CHECKLIST.md?plain=1#L346) | | |
| 8.4.1 | Decorate mode for players | [342](../MANUAL_TEST_CHECKLIST.md?plain=1#L342) | | Needs the encrypted deployed game from session F |

## Session F — player options, saves and releases

Plain PC. Some rows need a deployed, encrypted build:
`npm run deploy -- <project> <output> --game-build --key <test key>`. Run it once here and reuse the build for
8.4.1 and 8.3.4.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 9.1.1 | Comfort options | [44](../MANUAL_TEST_CHECKLIST.md?plain=1#L44) | | |
| 9.1.3 | A title screen from a map | [54](../MANUAL_TEST_CHECKLIST.md?plain=1#L54) | | |
| 9.1.4 | Pictures on save files | [57](../MANUAL_TEST_CHECKLIST.md?plain=1#L57) | | |
| 9.1.7 | Flat maps as battle backgrounds | [58](../MANUAL_TEST_CHECKLIST.md?plain=1#L58) | | |
| 8.3.6 | Photo mode for players | [13](../MANUAL_TEST_CHECKLIST.md?plain=1#L13) | | Also in a browser build |
| 8.3.7 | Playtest trails | [56](../MANUAL_TEST_CHECKLIST.md?plain=1#L56) | | Ordinary builds must write nothing |
| 9.5.3 | Save-safe changes (Mark as Released) | [17](../MANUAL_TEST_CHECKLIST.md?plain=1#L17) | | Use a save made before the renames |

## Session G — lighting and shaders on a real GPU

These rows were never drawn on a real graphics card. Run them on two machines: a normal gaming GPU, and integrated
graphics (a laptop with Intel or AMD on-chip graphics). For each machine, write down the GPU, the driver and the fps
at every Effects Quality. With View → Show Speed open, a row fails if it drops below 30 fps on High on the
gaming GPU.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.5 | Normal maps on flat maps | [18](../MANUAL_TEST_CHECKLIST.md?plain=1#L18) | | 200 mapped pictures and 20 lights |
| 8.3.1 | Normal maps made for you | [29](../MANUAL_TEST_CHECKLIST.md?plain=1#L29) | | No hitch while maps are made |
| 7.3.7 | Light you can see in the air | [341](../MANUAL_TEST_CHECKLIST.md?plain=1#L341) | | |
| 8.3.2 | Bounced light and soft shadows | [341](../MANUAL_TEST_CHECKLIST.md?plain=1#L341) | | |
| 9.3.3 | Heat haze | [16](../MANUAL_TEST_CHECKLIST.md?plain=1#L16) | | |
| 9.1.2 | Quality that looks after itself (Auto) | [14](../MANUAL_TEST_CHECKLIST.md?plain=1#L14) | | Integrated graphics is the real test |
| 7.3.8 | A first-person 3D camera | [10](../MANUAL_TEST_CHECKLIST.md?plain=1#L10) | | |

## Session H — phones and slow machines

You need an Android phone, an iPhone, a PC and the phones on the same home Wi-Fi, and a low-spec PC.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 8.3.5 | The playtest on a phone (Phone Preview) | [28](../MANUAL_TEST_CHECKLIST.md?plain=1#L28) | | Try the refused paths from a second device |
| 7.3.4 | Baking for phones | [349](../MANUAL_TEST_CHECKLIST.md?plain=1#L349) | | Also answers 7.4.4: write down fps before and after on the phone |

## Session I — other plugins

You need at least one third-party plugin that Problems advises about. Do this together with 7.4.5, since both
need the same plugins.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 9.5.2 | Plugin clash check and a report bundle | [32](../MANUAL_TEST_CHECKLIST.md?plain=1#L32) | | Read the saved report for paths and secrets |

## After the sessions

1. Write `docs/QA_<date>.md`, laid out the same way as [QA_2026-11-15.md](QA_2026-11-15.md). It needs the setup,
   one short section per session with what passed and failed, the screenshots kept, and the automated gate on the
   same commit.
2. In [RECOMMENDATIONS.md](../RECOMMENDATIONS.md), change each passed row from "Built; MZ playtest pending" to
   "Done". Change nothing for a row that failed or wasn't tested.
3. Update [CODEX_CHECKPOINT.md](CODEX_CHECKPOINT.md) so it lists the rows that are still open.
4. When every row in sessions A to F has passed, a release can be made with `npm run package`, even if G to I are
   still open. The release notes then need to say which features haven't been tested on a GPU or a phone.
