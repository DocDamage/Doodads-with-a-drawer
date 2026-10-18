# Doc's Doodads: Remaining Recommendations

What's left to do, as of 17 October 2026. Everything up to PR #21 is merged: the editor, atmosphere, post-processing, VFX, spatial sound, editor tools, visual equipment, the destination marker, and the 3D view with round worlds, terrain, water, weather, day and night, and the 3D height settings.

Items are grouped by priority. Each says why it matters and roughly how big it is (**S** = an afternoon, **M** = a PR like terrain or water, **L** = several PRs).

---

## 1. Before a release

These are about trust in what already exists, not new features.

| # | Recommendation | Why | Size |
|---|---|---|---|
| 1.1 | **Run the manual test checklist.** `MANUAL_TEST_CHECKLIST.md` has 111 unchecked items. Run it once on a copy of a real project, not only the test project. | Every feature was playtested as it was built, but never all together, in a real game, start to finish. | M |
| 1.2 | **3D performance pass.** Measure frame rate on a large map with view distance 40 and 64, terrain on, a storm, 100+ doodads and night lights. Lower-spec machines too. | Untested so far. Each frame redraws the ground texture and terrain mesh, sorts billboards, and steps up to 2,000 weather particles. | M |
| 1.3 | **3D quality presets.** Add Low / Medium / High under the Effects Quality option players already have. Low: shorter view distance, no wakes, fewer drops, no terrain subdivision. | Slower machines need a way down without the developer re-tuning every map. | S |
| 1.4 | **Deployed-build test.** Build a deployment (with encrypted images) and play the 3D, weather and visual equipment features in it. | The editor is removed from deployed games, and image loading differs there. Several features read art at runtime. | S |
| 1.5 | **MV compatibility check.** The README says MZ/MV. Either test the core workflow in MV or narrow the claim to MZ. | Nothing added since the rename has been tried in MV. Its renderer, scene code and animation system all differ. | S–M |
| 1.6 | **Raise test coverage** from 65% to 75%, starting with the runtime hooks: Sprite_Character layers, the 3D renderer, the Sprite_Destination override. | Most of the untested code is drawing code, which is where the bugs found in Playtests have been. | M |

## 2. 3D view: rough edges

Known limits that are documented but worth fixing.

| # | Recommendation | Why | Size |
|---|---|---|---|
| 2.1 | **Make tileset objects stand up.** Trees, roofs and walls drawn as B–E tiles always lie flat. Add an option to lift B–E "star" (☆) tiles into billboards, or a one-click "convert tiles to doodads" for a region. | This is the biggest gap between a hand-made MZ map and a good 3D look. Today the user has to rebuild objects as doodads. | M–L |
| 2.2 | **Effekseer depth.** MZ's own animations play at the right spot but don't shrink with distance. Scale the Effekseer camera per animation, or render each one to a texture and billboard it. | A fireball 20 tiles away looks as big as one next to the hero. | M |
| 2.3 | **Weather behind things.** Rain and snow draw over everything, even drops that are behind a tree or hill. Sort weather into the billboard order in a few depth bands. | It shows most at low camera angles and in snow. | S–M |
| 2.4 | **Gear in shadows.** Character sun shadows use only the body's outline, so a cape or hat doesn't change the shadow. Composite the gear layers into the shadow texture. | Small, but noticeable with long sunset shadows. | S |
| 2.5 | **Deep-sea boat test.** MZ's small boat can't enter deep water, so wakes on open sea were only checked with placed wake trails. Test with the ship and the airship (airship shadow, landing). | Vehicles were only partly checked in 3D. | S |
| 2.6 | **Mouse look and free camera** in the editor: orbit, pan and zoom with the mouse while editing in 3D. | Today the camera is set with sliders, Q/W, or plugin commands. | M |
| 2.7 | **Camera collision.** At low tilts on terrain, a hill between the camera and the player can hide the player. Fade or lower whatever is in the way, the way see-through works in 2D. | Terrain made this possible. | S–M |
| 2.8 | **Snow that settles.** Add a snow-cover look (whiten the ground and tree tops over time) tied to the snow weather and the season system. | It's the natural next step after 3D snow and seasons. | M |
| 2.9 | **Clouds and fog banks.** Add drifting cloud shadows on the ground, and low fog layers in valleys (they suit terrain height). | It makes day and night more alive, at low cost on the ground shader. | M |

## 3. Editor and workflow

| # | Recommendation | Why | Size |
|---|---|---|---|
| 3.1 | **Split the source file.** `Docs-Doodads.js` is about 21,000 lines. Keep shipping one plugin file, but write it as modules and build it with a simple concatenation script. | Every change now is search-and-replace in one huge file. Modules would make review, tests and contributions much easier. | M |
| 3.2 | **A 3D map preview in the asset drawer.** Show how a doodad will look standing in 3D, using the current 3D height setting. | Users can't judge whether tileset art suits 3D until they place it. | S |
| 3.3 | **A height brush preview.** Show the brush's radius and falloff on the ground before painting. | Today you only see the result after the stroke. | S |
| 3.4 | **A visual equipment sheet helper.** Turn an Aseprite layered file into one sheet per layer (body, hair, clothes and so on), already in MZ's frame layout. | The paper-doll system needs matching part sheets. Today that's manual export work. | M |
| 3.5 | **Undo history panel.** Show the undo stack as a list you can step back through. | The 300-step undo is invisible today. | S |
| 3.6 | **A settings search** in the map panel. | It now has more than 15 collapsible sections. | S |

## 4. Documentation

| # | Recommendation | Why | Size |
|---|---|---|---|
| 4.1 | **A "Your first 3D map" walkthrough** with screenshots, from a fresh map to terrain, water and day and night. | The 3D section of the guide is complete but reads like a reference. | S |
| 4.2 | **A notetag and plugin command cheat sheet**: one table of every tag (`<visual>`, `<shadow>`, `<sound>` and others) and every plugin command. | They're currently spread across about 10 guide sections. | S |
| 4.3 | **Short GIFs** for the 3D features in the README. | Weather, water and day and night are hard to judge from still images. | S |
| 4.4 | **Update or archive `Docs_Doodads_Implementation_Plan.md`.** It describes the original editor and none of the later work. | It can mislead contributors about what the plugin is. | S |

## 5. Ideas for later (bigger features)

| # | Idea | Notes | Size |
|---|---|---|---|
| 5.1 | **Real 3D models** (glTF) as doodads in the 3D view. | It's a big step. Only consider it once 2.1 is done, since billboards cover most RPG art. | L |
| 5.2 | **Interiors in 3D:** walls that stand up from wall tiles, with the camera inside rooms. | It needs 2.1 first. Interiors have different needs from overworld maps. | L |
| 5.3 | **Height-aware gameplay:** jumping between terrain levels, falling, a height condition in events. | Terrain height is visual only, apart from optional blocking. | M |
| 5.4 | **3D in battle:** a perspective battle background built from the map around the encounter. | It would complete the 3D look for front- and side-view battles. | L |
| 5.5 | **Minimap and world-map view** for 3D maps, including a globe view for round worlds. | Round worlds especially need one, to see the whole planet. | M |

---

## Suggested order

1. **Release readiness:** 1.1 to 1.5. Nothing new, just making sure what exists holds up.
2. **Tileset objects stand up (2.1):** the biggest visual gain for existing MZ maps.
3. **Split the source file (3.1):** before it gets any bigger.
4. **3D polish:** 2.2 to 2.7.
5. **Docs:** 4.1 to 4.4.
6. **Ideas for later:** as wanted.
