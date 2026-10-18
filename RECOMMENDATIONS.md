# Doc's Doodads: Recommendations

Status as of 18 October 2026. The list from 17 October has been worked through on the `feat/recommendations` branch: every item is done or partly done. What is still open is at the bottom.

**S** = an afternoon, **M** = a PR like terrain or water, **L** = several PRs.

---

## 1. Before a release

| # | Recommendation | Status |
|---|---|---|
| 1.1 | Run the manual test checklist on a real project. | **Partly done.** A sampled run on a test project built from MZ's sample maps found and fixed four bugs (two crashes on scene changes, Effekseer placement in 3D, the airship in 3D). See [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md). The full checklist on a real game is still open. |
| 1.2 | 3D performance pass. | **Done.** View 64 with terrain and a storm went from 18 to 54–58 fps. Numbers, including a simulated slow CPU, are in the QA record. |
| 1.3 | 3D quality presets. | **Done.** Effects Quality scales the 3D view (view distance and fog, weather, wakes, hill detail). |
| 1.4 | Deployed-build test. | **Done**, with a scripted deployment in MZ's encrypted format (MZ's own Deploy dialog was not driven). 3D, terrain, weather, standing tiles, models, the minimap and visual equipment work; the editor is unavailable. |
| 1.5 | MV compatibility check, or narrow the claim. | **Done: the claim is narrowed to MZ.** MV was not available to test. |
| 1.6 | Raise test coverage from 65% to 75%. | **Done: 75.4%.** Drawing code runs on a stand-in engine in Node (`scratch/engine/fake_engine.js`); the coverage gate is now 72%. |

## 2. 3D view: rough edges

| # | Recommendation | Status |
|---|---|---|
| 2.1 | Make tileset objects stand up. | **Done.** A per-map option stands up B–E objects with ☆ tiles (with the tile under them) or every B–E tile, without changing the map. |
| 2.2 | Effekseer depth. | **Done.** Effekseer animations shrink with distance, and now also play on the target as drawn (they were off to one side). |
| 2.3 | Weather behind things. | **Done.** Drops are drawn in 8 depth bands sorted in with billboards and terrain. |
| 2.4 | Gear in shadows. | **Done.** |
| 2.5 | Deep-sea boat test. | **Done.** Ship wakes and airship flight and landing checked; the airship's sorting and shadow were fixed. |
| 2.6 | Mouse look in the editor. | **Done.** Middle-drag orbits, Shift + middle-drag pans, the wheel zooms, a middle click resets. |
| 2.7 | Camera collision. | **Done.** Hills, tall doodads and standing tiles fade where they cover the player (with See-Through on). |
| 2.8 | Snow that settles. | **Done.** Per map; ties into snow weather and a season named Winter. |
| 2.9 | Clouds and fog banks. | **Done.** Cloud shadows, and low fog that fills valleys on terrain. |

## 3. Editor and workflow

| # | Recommendation | Status |
|---|---|---|
| 3.1 | Split the source file. | **Done.** 46 parts in `src/`, built into the same single file by `npm run build`; verify checks they match. |
| 3.2 | A 3D preview in the asset drawer. | **Done.** |
| 3.3 | A height brush preview. | **Done.** |
| 3.4 | A visual equipment sheet helper from Aseprite. | **Done.** Make Layer Sheets from .aseprite, tested against Aseprite's own exports. |
| 3.5 | Undo history panel. | **Done.** |
| 3.6 | A settings search in the map panel. | **Done.** |

## 4. Documentation

| # | Recommendation | Status |
|---|---|---|
| 4.1 | "Your first 3D map" walkthrough. | **Done:** [docs/FIRST_3D_MAP.md](docs/FIRST_3D_MAP.md). |
| 4.2 | Notetag and plugin command cheat sheet. | **Done:** [CHEAT_SHEET.md](CHEAT_SHEET.md). |
| 4.3 | Short GIFs for the README. | **Done:** weather, day and night, and the camera. |
| 4.4 | Update or archive the implementation plan. | **Done:** archived in [docs/archive](docs/archive/Docs_Doodads_Implementation_Plan.md). |

## 5. Ideas for later

| # | Idea | Status |
|---|---|---|
| 5.1 | Real 3D models (glTF) as doodads. | **Done, first version.** Static meshes with colours and textures, lit by the sun, sorted with billboards. |
| 5.2 | Interiors in 3D. | **Done, first version.** A4 walls and A3 roofs stand up with their face art (Stepped terrain). |
| 5.3 | Height-aware gameplay. | **Done.** Ledge drops, hopping up steps, a Store Ground Height command and a script helper. |
| 5.4 | 3D in battle. | **Done.** A per-map option uses the 3D map, from a low camera, as the battle background. |
| 5.5 | Minimap and world map. | **Done.** A corner minimap, and Show World Map with a globe on planets. |

---

## Still open

| # | What | Why | Size |
|---|---|---|---|
| A | **Run the whole manual checklist on a real game**, including the parts the sampled run skipped (slicing, import, prefabs, dressing, packing, sound, seasons, collision, events, conflict and backup flows, scale), and with MZ's own Deploy dialog. | The sampled run found four bugs in an afternoon; the rest of the checklist will likely find more. | M |
| B | **A real lower-spec PC.** Slow machines were only simulated (4× CPU throttling). At High, a long view distance with terrain is heavy there (13–20 fps); check that Medium is a good default suggestion. | Throttling doesn't model a weak GPU. | S |
| C | **Models: the next steps.** Editor picking uses the doodad's picture, not the model; no animation, skinning or PBR materials; every model is drawn on the CPU each frame, so keep them to a few hundred triangles. | The first version is deliberately small. | M–L |
| D | **Standing tiles and walls: edge cases.** Roof edges drawn with ☆ tiles stand up too; interiors need the Stepped shape; wall faces always face south. | Maps vary; real maps will show which cases matter. | S–M |
| E | **MV**, only if MV support is wanted again. | Nothing since 2.0 has been tested there. | M |
