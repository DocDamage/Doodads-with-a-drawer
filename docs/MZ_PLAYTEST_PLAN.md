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

Plain PC. Use Starting Town, the looping Field Map (cross the seam) and the cave. For every edit, check that Undo
and Redo work, and that saving, reloading and reopening the project in MZ keeps the change.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.2 | Editing what an event does | [33](../MANUAL_TEST_CHECKLIST.md?plain=1#L33) | | Reopen in MZ and run the edited events |
| 7.1.4 | Schedules for events | [35](../MANUAL_TEST_CHECKLIST.md?plain=1#L35) | | |
| 7.3.2 | Collision brush | [104](../MANUAL_TEST_CHECKLIST.md?plain=1#L104), [105](../MANUAL_TEST_CHECKLIST.md?plain=1#L105) | | |
| 7.3.5 | Generated maps | [15](../MANUAL_TEST_CHECKLIST.md?plain=1#L15) | | Include the runtime seed before a transfer |
| 8.3.3 | More like this | [350](../MANUAL_TEST_CHECKLIST.md?plain=1#L350) | | |
| 8.3.4 | Ground brush | [22](../MANUAL_TEST_CHECKLIST.md?plain=1#L22) | | Deploy step goes with session F |
| 8.5.1 | Trace over a picture | [36](../MANUAL_TEST_CHECKLIST.md?plain=1#L36) | | |
| 8.5.2 | A picture into a map | [21](../MANUAL_TEST_CHECKLIST.md?plain=1#L21) | | |
| 8.5.3 | What kind of map (Map Kinds, Edit Kind) | [21](../MANUAL_TEST_CHECKLIST.md?plain=1#L21), [339](../MANUAL_TEST_CHECKLIST.md?plain=1#L339) | | |
| 9.4.1 | Tileset flags in the editor | [338](../MANUAL_TEST_CHECKLIST.md?plain=1#L338) | | Check `Tilesets.json` and its backup |
| 9.3.2 | Ropes and cables | [27](../MANUAL_TEST_CHECKLIST.md?plain=1#L27) | | Needs the previous release to check that older builds ignore ropes |
| 8.4.5 | Map eras | [345](../MANUAL_TEST_CHECKLIST.md?plain=1#L345) | | |
| 9.4.2 | Animated GIF and APNG in | [8](../MANUAL_TEST_CHECKLIST.md?plain=1#L8) | | |
| 9.4.3 | A licence ledger for all art | [11](../MANUAL_TEST_CHECKLIST.md?plain=1#L11) | | |
| 7.4.8 | Own parts in the character creators | [318](../MANUAL_TEST_CHECKLIST.md?plain=1#L318)–[320](../MANUAL_TEST_CHECKLIST.md?plain=1#L320) | | MZ, LPC and Memao creators |

## Session D — files in and out

Plain PC, plus Blender to open the .glb, and Tiled or LDtk files. For a first run, use the fixtures in
`scratch/fixtures/map_import/` and `scratch/fixtures/geo/village.osm`. Then test with files from a real project.

| ID | Feature | Steps | Result | Notes |
| --- | --- | --- | --- | --- |
| 7.1.6 | Bringing in Tiled and LDtk maps | [24](../MANUAL_TEST_CHECKLIST.md?plain=1#L24) | | Flipped/rotated tiles were never drawn in tests |
| 8.5.5 | A real place (OpenStreetMap / GeoJSON) | [351](../MANUAL_TEST_CHECKLIST.md?plain=1#L351) | | Check that no download is made |
| 8.5.4 | Maps inside maps (Places) | [347](../MANUAL_TEST_CHECKLIST.md?plain=1#L347) | | MZ must be closed while maps are written |
| 8.4.8 | The 3D map as a file (.glb) | [20](../MANUAL_TEST_CHECKLIST.md?plain=1#L20) | | Blender |

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
