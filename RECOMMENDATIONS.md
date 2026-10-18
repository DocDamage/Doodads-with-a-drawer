# Doc's Doodads: Recommendations

Status as of 18 October 2026 (after PR #40). Every item on the 17 October list is done, merged in PR #24 along with the fixes from its review and playtest (listed in [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md#review-fixes)), and in the PRs after it. What's left is at the bottom.

**S** = an afternoon, **M** = a PR like terrain or water, **L** = several PRs.

---

## 1. Before a release

| # | Recommendation | Status |
|---|---|---|
| 1.1 | Run the manual test checklist on a real project. | **Done.** A sampled run on a test project built from MZ's sample maps found and fixed four bugs (two crashes on scene changes, Effekseer placement in 3D, the airship in 3D); the areas it skipped were run next and eight more bugs fixed (PR #31). A 30-minute editing session showed no leak. See [docs/QA_2026-10-18.md](docs/QA_2026-10-18.md). |
| 1.2 | 3D performance pass. | **Done.** View 64 with terrain and a storm went from 18 to 54–58 fps. Numbers, including a simulated slow CPU, are in the QA record. |
| 1.3 | 3D quality presets. | **Done.** Effects Quality scales the 3D view (view distance and fog, weather, wakes, hill detail). |
| 1.4 | Deployed-build test. | **Done**, both with `npm run deploy` and with MZ's own Deployment dialog (encrypted, same key: every file identical except `System.json`). 3D, terrain, weather, standing tiles, models, the minimap and visual equipment work; the editor is unavailable and nothing is written. MZ's "Exclude unused files" leaves out `img/doodads`; the game now carries on without the missing art instead of stopping. |
| 1.5 | MV compatibility check, or narrow the claim. | **Done: the claim is narrowed to MZ.** MV was not available to test. |
| 1.6 | Raise test coverage from 65% to 75%. | **Done: 82%** (92 suites). Drawing code runs on a stand-in engine in Node (`scratch/engine/fake_engine.js`); the coverage gate is now 72%. |
| 1.7 | Audit: dead code, unfinished wiring, leaks. | **Done** (PR #37). The MV layer, SAT engine and other dead paths are gone; half-wired features (collections, Clear Cache, Move to Layer, event position and trigger, grid snap, search terms) are finished; leaks and bugs found are fixed. |
| 1.8 | An editor that's easy to pick up. | **Done** (PRs #38–#39). A bright, rounded, game-like look with named tools, Item Bag and Details panels that fold away, a hint bubble, a welcome card, pixel icons and its own font. |

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
| 3.1 | Split the source file. | **Done.** 50 parts in `src/`, built into the same single file by `npm run build`; verify checks they match. |
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
| 5.1 | Real 3D models (glTF) as doodads. | **Done.** Meshes with colours and textures, lit by the sun, sorted with billboards; animations, skins, materials, live reload and picking by shape. |
| 5.2 | Interiors in 3D. | **Done.** A4 walls and A3 roofs stand up with their face art, in Stepped and Smooth terrain, with decals kept on the floor. |
| 5.3 | Height-aware gameplay. | **Done.** Ledge drops, hopping up steps, a Store Ground Height command and a script helper. |
| 5.4 | 3D in battle. | **Done.** A per-map option uses the 3D map, from a low camera, as the battle background. |
| 5.5 | Minimap and world map. | **Done.** A corner minimap, and Show World Map with a globe on planets. |

---

## What's left

Done since the last update: model live reload, the 3D See-Through silhouette, standing tile and wall edge cases, the 3D camera following near map edges, floor decals under walls, the checklist findings, gear from Aseprite layers, animated and skinned models, a video sky, zoom and sound focus with ambience and footsteps, traversal (jump, glide, swim, dive, fly, climb, ice), the audit, the new editor look and font, `npm run deploy`, and deployed games carrying on when doodad art is missing. MV is no longer a goal: Doc's Doodads is for MZ.

| # | What | Why | Size |
|---|---|---|---|
| B | **A real lower-spec PC.** Slow machines were only simulated (4× CPU throttling). At High, a long view distance with terrain is heavy there (13–20 fps). Check that Medium is a good default suggestion. | Throttling doesn't model a weak GPU. | S |
| D | **Models: what's still open.** Morph targets (shape keys) and normal maps aren't read. Light is worked out per vertex, so a highlight on a flat face brightens the whole face. Models are posed and drawn on the CPU (a still view of a still model reuses the last frame), so keep them to a few hundred triangles. The selection box follows the rest pose, not the animation. | Enough for props and small characters; real games will show whether moving models to the GPU is worth it. | M |
| E | **Editor feedback from new users.** The new look was checked by its makers, not by someone opening the editor for the first time. Watch a new user place, paint and save, and fix where they get stuck. | The aim was "very easy to use"; only a fresh pair of eyes can say. | S |
