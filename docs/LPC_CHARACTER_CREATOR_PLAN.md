# Plan: the LPC character collection and creator in Doc's Doodads

Status: accepted 2026-10-19. Decided: the creator gets the Nintendo look, and the whole editor gets an opt-in
**Playful** theme under Look (option B in section 7). Phase 0 (the spike) is under way.

Mockup of the creator (Nintendo-style look): https://claude.ai/artifact/TRBsCxAj4LnjWbAxFYSece

Source collection: [Universal LPC Spritesheet Character Generator](https://github.com/DocDamage/Universal-LPC-Spritesheet-Character-Generator)
(a fork of the Liberated Pixel Cup generator).

## 1. What we want

- A **Character Creator** inside the editor: pick a body, face, hair and outfit from the LPC collection, see the
  character walk, turn and act on a stage, roll the dice for a random one, and save the recipe.
- **Export straight to RPG Maker MZ**: a walking sheet the engine uses as it is, plus the Doc's Doodads extras
  (idle and run sheets, Character Action sheets, a side-view battler, a face, and Visual Equipment part sheets).
- **Credits that are right by default**: every exported image knows which artists made it and under which licence.
- A **friendlier, Nintendo-like look** for the creator: rounded cream cards, chunky pills, big ◀ ▶ pickers, bright
  teal, yellow and coral, soft "pressed" shadows. It can be used with a gamepad.

## 2. Licensing (this decides the architecture)

| Part | Licence | What it means for us |
| --- | --- | --- |
| Generator code (TypeScript, Mithril) | GPL-3.0 | We **do not copy it**. Doc's Doodads stays MIT, so our compositor is written from scratch against the data format. |
| `sheet_definitions/*.json`, `palette_definitions/*.json` | Part of the GPL repo | We **read them at edit time** from the user's own copy. We don't ship them in the plugin. |
| Art (`spritesheets/**.png`) | Each file has its own: CC0, OGA-BY, CC-BY, CC-BY-SA, GPL | Credits are required for everything except CC0. Some licences limit encryption (below). |

How it follows:

1. **The library stays outside the project and the plugin.** The user points the editor at a local copy (a
   clone or the ZIP), and the folder is remembered per computer. It is about 1.5 GB, so we never bundle or
   download it ourselves.
   - MZ's Deployment copies every file in the project folder, so a library inside the project would ship with
     the game. The editor warns when the chosen folder is inside it.
   - Only the **exported** sheets go into `img/`.
2. **Credits travel with each export.** Each exported PNG gets an entry in `data/DocsDoodadsCredits.json` listing
   the files used, their authors, licences, URLs and notes (copied from each part's `credits` block). There are
   also a **Credits** button in the creator and a `CREDITS_LPC.txt` beside the game, which ships with it.
   Problems says when that file needs writing again. An in-game credits scene is optional.
3. **Encryption filter.** CC-BY and CC-BY-SA (3.0 and 4.0) forbid "technological measures" that stop people
   reusing the work, and MZ's "Encrypt image files" is such a measure. CC0 and OGA-BY allow it, which is why
   OGA-BY exists.
   - The creator has an **"Only art safe to encrypt (CC0, OGA-BY)"** switch. It hides parts that don't qualify.
   - Every export records whether it is safe to encrypt.
   - The Deploy checklist warns when encryption is on and a project image is not safe to encrypt. It offers to
     leave that image unencrypted, or to point out the parts to swap.
   - GPL art is flagged too (it needs source available). It is off by default under the switch.
4. **Recipes are ours.** A saved character (`data/DocsDoodadsCharacters.json`) is a list of part ids, variants and
   colours. It holds no art, so it can be shared freely.

This is not legal advice. Before shipping the encryption warning we should check the wording against the LPC
project's own FAQ.

## 3. The data we read

What the format looks like, from the research:

- **Parts:** `sheet_definitions/<category>/<part>.json` holds:
  - `name` and `priority`;
  - `layer_1`…`layer_9`, each with a `zPos` and a path per body type (`male`, `muscular`, `female`, `pregnant`,
    `teen`, `child`);
  - `variants`, `match_body_color`, `animations`, and `credits[]`.
- **Palettes:** `palette_definitions/*.json` hold named hex ramps (for example `body_ulpc.json` and
  `body_lpcr.json`). Recolouring swaps a source ramp for a target ramp, with a small tolerance.
- **Images:** `spritesheets/<path>/<animation>.png`, made of 64×64 frames, 13 frames per row at most.
- **Directions:** the row order inside each animation is **up, left, down, right**.
- **Animation rows on the full sheet:**

  | Animation | Row |
  | --- | --- |
  | spellcast | 0 |
  | thrust | 4 |
  | walk | 8 |
  | slash | 12 |
  | shoot | 16 |
  | hurt | 20 (one row only) |
  | climb | 21 |
  | idle | 22 |
  | jump | 26 |
  | sit | 30 |
  | emote | 34 |
  | run | 38 |
  | combat | 42 |
  | 1h_slash | 46 |
  | 1h_halfslash | 50 |

- **Walk frames:** 0 is standing, and 1–8 are the cycle.

**The importer** (editor only, NW.js `fs`) walks a chosen library folder and writes the editor cache,
`data/docs_doodads_cache/lpc_index.json`. That is about 860 KB for 657 parts, and it sits beside the thumbnails:

- one record per part: id, category, name, body types, variants, layers with z, animations, licences, authors,
  and `safeToEncrypt`;
- palettes, by name.

Being an index means the creator opens instantly and never scans 1.5 GB twice. It is rebuilt with a **Rescan**
button and records the library's commit or date.

**Schema guard:** the importer checks the fields it knows about. If anything has changed upstream, it reports
"N parts skipped (unknown format)" instead of failing quietly. We pin to a known commit in the docs and test against
fixture files.

## 4. The compositor (clean-room)

Input is a recipe: a body type, and a list of `{part, variant, colour}`.

1. **Resolve layers.** For each chosen part, take every layer that exists for the body type, giving
   `(path, zPos)` pairs.
   - Drop a layer whose animation is missing. The fallback is a transparent gap and a warning in the creator.
2. **Sort by zPos**, using `priority` and then pick order to break ties.
3. **Load and recolour.** The image comes from the index path. The palette swap happens once per
   (image, palette) and is cached by key.
   - A part with `match_body_color` takes the body's skin ramp.
4. **Draw** onto one canvas per animation (64-pixel cells), then put them together into a full-sheet canvas.
5. **Toggles:**
   - **Show body** off: draws only the clothing layers, for Visual Equipment parts.
   - **Body add-ons** off: skips wings, tails, horns and similar.
   - **Cast shadow:** a soft ellipse layer, in the preview only.

The compositor runs inside the editor, on Canvas 2D. A full sheet is about 832×3456. That is cheap once images are
cached, and the stage draws only the current animation and direction.

## 5. Exports to MZ

Each export writes to `img/characters/` (or `img/sv_actors/`, or `img/faces/`) and records credits. The names
follow the tags Doc's Doodads already reads.

| Export | Layout | Notes |
| --- | --- | --- |
| **Map walker** `$Name.png` | 3 × 4 frames of 64×64 (192×256) | MZ rows are down, left, right, up (LPC is up, left, down, right). The pattern is step, stand, step: LPC walk frames ≈2 and ≈6 around stand frame 0. Which two frames to use is set per export and checked by eye. |
| **Smooth walker** `$Name[f9].png` | 9 × 4 | Every LPC walk frame. Uses the existing `[fN]` frame-count tag. |
| **Idle and run** `$Name_idle[fN].png`, `$Name_run[fN].png` | idle rows 22–25, run rows 38–41 | Uses the existing idle and run sheet names. |
| **Action sheets** `$Name_slash[f6].png` etc. | one sheet per animation | For Character Actions: slash, thrust, spellcast, shoot, hurt, sit, emote, climb, jump, combat, 1h_slash. A **ready-made Character Action** entry can be made for each. |
| **Side-view battler** `img/sv_actors/Name.png` | 9 × 6 frames of 64×64 (576×384) | MZ's battler frame is 64×64, an exact match. Motions face left (the LPC "left" row). See below for the mapping. |
| **Face** `img/faces/Name.png` slot | 144×144 | The head from down-facing frame 0, scaled up whole-pixel (nearest) onto a soft card background. Placed in the next free slot of an existing face sheet, or a new one. |
| **Visual Equipment parts** | one sheet per clothing part, body hidden | Same frame layout as the walker. Writes the matching Visual Equipment notetag into the clipboard, or straight onto the chosen armour or weapon. |

**SV motion map:**

| MZ motion | LPC animation |
| --- | --- |
| walk | walk |
| wait | idle (or combat) |
| chant | spellcast |
| guard | combat |
| damage | hurt, first frames |
| evade | jump |
| thrust | thrust |
| swing | slash |
| missile | shoot |
| skill | 1h_slash |
| spell | spellcast |
| item | emote |
| escape | run, mirrored |
| victory | emote |
| dying | hurt, middle frames |
| abnormal | sit |
| sleep | hurt, last frame |
| dead | hurt, last frame |

Each MZ motion has 3 frames, so we sample three evenly spaced LPC frames. The mapping is editable in the export
dialog.

**Size note:** LPC characters are 64 pixels tall and MZ tiles are 48 pixels. With `$` sheets MZ draws them
bottom-anchored, so they look tall but correct. We keep native 64 and don't offer scaling to 48, because 0.75
nearest-neighbour scaling ruins pixel art. The creator says so in a short note.

## 6. The creator UI

The mockup shows the target. The layout follows the user's reference screenshot, with a friendlier skin:

- **Top bar:**
  - a title pill;
  - the library's name and part count;
  - the **encryption-safe switch**;
  - a **Palette** picker (LPC Revised, ULPC);
  - an info button, and an optional music button.
- **Left card, "Body":** tabs for Body, Face, Hair and Extras.
  - Rows show `Label ◀ value ▶ [swatch]`.
  - Body type, Skin, Head, Ears, Nose, Eyes and colour, Expression, Facial hair, Hair and colour, Hair add-on,
    Wings, Tail, Horns, Body add-ons 1–3.
  - A row that doesn't apply to the current body is dimmed with its reason, never hidden.
- **Centre stage:**
  - the live composite at 3× or 4× whole-pixel scale, with a shadow;
  - **turn** ↺ ↻ buttons;
  - **animation chips** (Walk, Idle, Run, Slash, Spellcast, Shoot, Hurt, and so on);
  - two **dice**: shuffle the body, shuffle the outfit;
  - toggles: Show body, Body add-ons, Cast shadow.
- **Right card, "Outfit":** tabs for Head, Body, Legs and Gear.
  - Mask, Hat, Facial, Suit, Coverall, Shirt and colour, Gloves, Belt, Pants and colour, Shoes, Back, Main hand,
    Ammo, Off hand.
- **Swatch:** a click cycles colours, and a long press or right-click opens the palette grid.
- **Value pill:** a click opens a **picture grid** of every option, with thumbnails drawn by the compositor and
  cached. The grid has a search box and a licence badge on each tile.
- **Bottom bar:** Load, Save (recipes), **Credits · N artists**, and the primary **Export to RPG Maker** button,
  which opens a checklist of the exports in section 5.

**Nintendo-like details:**

- Baloo 2 headings and Nunito text. We bundle the fonts locally (OFL); MZ games run offline, and the editor
  should too.
- 3D "pressed" pill buttons, and 24–30 px corner radii.
- A cream dot-grid ground.
- Sounds on pick, turn, dice and export. They use the existing UI sound hook and respect the mute setting.
- Pickers bounce on change. Turned off under **Less motion**.
- **Gamepad and keyboard:**
  - D-pad or arrows move between rows; Left and Right change the value; A or Enter opens the grid; B or Esc goes back.
  - L and R switch tabs; X and Y roll the dice; Start exports.
  - Focus is always visible as a thick yellow ring.
- Screen-reader labels on every icon button (the existing screen-reader layer). Every string goes through the
  language layer (`36_ui_i18n`).

**Entry points:**

- **More > Character Creator**;
- the Item Bag **People** tab ("New character…", or "Edit look" on an exported one, which reopens its recipe);
- a "Make in creator" link in the Visual Equipment notetag helper.

## 7. Should the whole editor get this look?

The editor's colours are already only `--dd-*` tokens, switched by `data-dd-theme` (light, dark, contrast, in
`36_ui_theme_look.js`). That makes an editor-wide version cheap and safe:

- **Option A (recommended first):** the Nintendo look stays **inside the creator** only. That keeps this project
  focused, and the dense map tools stay compact.
- **Option B:** add a **"Playful" theme** to the existing theme list:
  - the cream, teal and coral tokens;
  - larger radii;
  - pill buttons;
  - Baloo 2 headings.

  It is opt-in under Look, so nobody's layout shifts, and it is one more PR after the creator lands.
- **Option C:** make Playful the default. Wait for a new-user test (backlog item E) before doing this.

## 8. Where the code goes

Following the part rules (`44_workspace_a*` and `44_workspace_b*` would land inside the Workspace literal, so the
new parts avoid them):

| Part | What it does |
| --- | --- |
| `src/23_lpc_index.js` | Index format, schema guard, licence classification (`safeToEncrypt`), credits merge. Pure functions, unit-testable. |
| `src/23_lpc_compositor.js` | Layer resolve and sort, palette swap, sheet assembly, export layouts (MZ walker, `[fN]`, actions, SV, face). Pure on canvas-like inputs. |
| `src/44_workspace_lpc_library.js` | Pick the folder, scan, Rescan, the progress card. |
| `src/44_workspace_lpc_creator.js` | The creator window, stage, pickers, grid, gamepad navigation. |
| `src/44_workspace_lpc_export.js` | The export checklist, file writes, credits file, Character Action and Visual Equipment hookups. |
| `src/36_ui_theme_playful.js` | Only if option B is chosen. |
| Deploy checklist | A new "not safe to encrypt" check. |

**Tests (node, like the other 119 suites):**

- fixture sheet definitions plus tiny generated PNGs (`scripts/make_lpc_fixtures.js`);
- tests for z-order, missing-animation fallback, body-type paths, palette swap with tolerance, the up/left/down/right
  to down/left/right/up remap, the SV motion map, licence classification, credits merge, and the schema-guard
  report;
- a playtest pass in MZ over the CDP method: export a character, walk it on a map, run it in a side-view battle, and
  check its face in a message.

## 9. Phases and PR sizes

| Phase | Contents | Size |
| --- | --- | --- |
| **0. Spike** | Read a local library, index 50 parts, composite one walker, see it walk in MZ. Throwaway, to prove the format and the frame choice. | 1 day |
| **1. Library and licences** | Importer, index file, schema guard, licence classes, credits file, CREDITS.txt export, Deploy warning. | M |
| **2. Compositor** | Layers, z-order, body types, palettes, `match_body_color`, caching, tests. | M |
| **3. Creator UI** | Window, cards, tabs, pickers, picture grid, stage, turn, animations, dice, toggles, recipes (Load and Save), gamepad, sounds, language strings. | L (split in two: stage and pickers, then the grid, gamepad and polish) |
| **4. Map exports** | `$` walker, `[f9]`, idle and run, face. | S–M |
| **5. Actions and battler** | Action sheets with ready-made Character Actions, SV battler with the editable motion map. | M |
| **6. Visual Equipment** | Body-hidden part sheets, notetag writing, "Make in creator" link. | M |
| **7. Optional Playful theme** | Option B above. | S |

Each phase is one PR, merged on green CI. Phase 3 is the user-visible milestone, and phases 4 and up make it
useful in games.

## 10. Risks

- **Library size and changes upstream:** we never bundle it; the schema guard and pinned commit protect us.
- **Licence mistakes:** we copy credits only from each part's own `credits` block, mark anything without credits
  as "unknown, do not ship", and show the count in the Export dialog.
- **Performance on a slow PC (backlog item B):** we cache recoloured layers, compose only the visible
  animation and direction on the stage, and build thumbnails lazily as the grid scrolls.
- **Missing animations:** some parts lack some animations. The creator marks them on the chips ("3 parts have no
  Shoot") so exports hold no surprises.
- **Frame choice for the 3-frame walker:** two LPC frames out of eight can look stiff. Offer the `[f9]` sheet as
  the recommended default when Doc's Doodads is present.

## 11. Phase 0 findings (2026-10-19)

The spike is `scripts/lpc_spike.js` (with `scripts/png_read.js`). It was run on the DocDamage fork at commit
`b2c85f9` (5 Aug 2026), then checked in MZ 1.10.0 (QA project copy).

- **Format:**
  - 657 part definitions: all have `name`, `layer_1`, `credits` and `type_name`, and none were skipped.
  - The fields seen, besides layers:
    - `animations`, `recolors` (424 parts), `variants` (233);
    - `priority`, `match_body_color`;
    - `tags` and `required_tags` (what a part needs, such as a kimono's sleeves trim);
    - `replace_in_path` with `${head}` templates (faces per head);
    - `custom_animation` layers (the wheelchair);
    - `aliases`, `preview_*`, `path`.
  - Indexing everything takes about 50 ms.
- **Images:** a layer's images are at `<path><anim>.png` (recoloured), or at `<path><anim>/<variant>.png` (fixed
  colours). Some file names differ from the animation names:
  - `combat` is `combat_idle`;
  - `1h_slash` is `slash`;
  - `1h_backslash` is `backslash`;
  - `1h_halfslash` is `halfslash`.

  The images are palette PNGs at 4 or 8 bits, or RGBA.
- **Recolouring is exact:**
  - The art is drawn in each material's base ramp. The material's `meta_<material>.json` names the base: body
    "light", hair "orange", cloth "white".
  - A recolour swaps those six colours for the chosen ramp's colours, so no tolerance was needed.
  - Parts with two colours (for example a head with skin and eyes) list `color_1`, `color_2` and so on, and an
    explicit `source` ramp when there is no base.
  - `match_body_color` parts take the body's skin ramp.
- **Licences:**
  - A credit block's `licenses` are alternatives: any one of them may be used.
  - Judge safety **per file used**, by the credit block whose `file` is the longest prefix of the image folder,
    not per part. Body Color lists blocks for every body type, and some of those offer no OGA-BY, but the male
    body's block does.
  - All six files of the test character are safe to encrypt (OGA-BY or CC0).
- **Compositing:** 6 layers for one walk sheet (576×256) took about 40 ms in Node, without caching. Sorting by
  `zPos` and then `priority` stacked them correctly.
- **In MZ:**
  - `$Spike[f9].png` (all 9 walk frames, rows reordered to down, left, right, up) and `$Spike.png` (3 frames:
    LPC 1, 0 and 5, picked as the widest strides) both load at 64×64 a frame and draw correctly. Characters stand
    a third taller than a 48-pixel tile, and that looks right.
  - **Problem 1:** Doc's Doodads plays an `[fN]` sheet at MZ's normal pace, one frame per 15 game frames at speed 4.
    Over 10 tiles the legs went through one and a half cycles of 9 frames, so the character seems to slide.
    LPC's cycle should fit about two tiles.
  - **Problem 2:** the cycle also passes through frame 0, the standing pose, which shows as a hitch.

  For phase 4, we need a walk pace per sheet, plus a way to leave the standing frame out of the cycle. Two
  candidates:
  - a `[w2]`-style "tiles per cycle" tag;
  - deriving it when the sheet is known to be LPC (a `_lpc` name or an entry in the index).

  Existing `[fN]` sheets must keep today's pace.

## 12. Phase 1 (done, 2026-10-19)

- **`src/23_lpc_index.js` (`DocsDoodads.Lpc`)** holds the pure parts, with the library read through an fs that is
  passed in:
  - the scan, with its schema guard: it skips with a reason, and reports fields it doesn't know;
  - palettes, the library's commit, and a "library inside the project" check;
  - licences per body type (`safeFor`), judged by the credit block of each layer folder;
  - credits per picture, and the text of `CREDITS_LPC.txt`. That file names the most open licence each artwork
    is offered under, then lists the others.
- **`src/44_workspace_lpc_library.js`**, the More > **Characters** card:
  - the folder (with a folder picker), Scan or Scan Again, and the status (parts, safe, colour sets, version,
    kinds, skipped, new fields);
  - a warning when the library has changed or moved since the scan;
  - the encrypt-safe switch;
  - credits, and Write `CREDITS_LPC.txt`.
- **`recordLpcImage(image, used)`** is the hook the exports will call (phase 4).
- **Problems** gets two project-wide groups, without Go To:
  - pictures that can't be encrypted;
  - `CREDITS_LPC.txt` missing or out of date, with **Write It**.
- **Checked in MZ:** the real library scanned from the card in about 1.3 s (it says "Scanning..." first). Credits
  for the spike's sheets were recorded, Problems listed the CC-BY-SA picture, and Write It wrote the file.

## 13. Phase 2 (done, 2026-10-19)

- **`src/23_lpc_compositor.js` (`DocsDoodads.LpcCompose`)** is pure, and works on `{ width, height, data }` images.
  - **`resolve(index, recipe, animation, exists)`** decides which files to stack, sorted by `zPos`, then
    `priority`, then pick order. It handles:
    - body types;
    - fixed-colour variants (`<anim>/<variant>.png`);
    - custom animations (`<variant>.png`);
    - `${head}` paths through `replace_in_path`, keyed by the head's name;
    - `required_tags`;
    - parts without the animation.

    Each problem becomes a plain warning, and it also lists the folders used, for credits.
  - **`compose`:**
    - recolours from the material's base ramp, from a channel's own `source` ramp, or from the body's skin (for
      `match_body_color`);
    - stacks with alpha;
    - caches recoloured layers by (file, colours), dropping the oldest past a limit;
    - leaves out layers drawn at another size (oversize weapons, 128 px sheets) with a warning, for now.
  - **`decodePng`:** the library's PNGs, read without packages. It matches the script decoder on 1,500 of the
    library's sheets.
  - **`randomRecipe`:** the dice. It picks a body, then a head that fits, then hair, a shirt, trousers and shoes,
    each by chance. It uses only parts with a walk for that body (and safe ones when asked), and skips parts that
    need tags.
- **Editor:**
  - `composeLpc(recipe, animation)` loads from the library folder, through one shared cache.
  - The Characters card has a **Try it** stage: a random character walking (stopped under Less motion), with
    Shuffle and turn.
- **Measured:**
  - In Node: the spike's recipe gives the same bytes as the phase 0 sheet. A cached second draw takes 1 ms, and
    40 random characters averaged 15 ms each with no warnings.
  - In MZ: a shuffle takes 30–75 ms, and all 16 animations of one character compose in 570 ms.
- **Left for later:**
  - ~~oversize and 128-pixel weapon art (`*_oversize`, `*_128`)~~: done, see §18;
  - `watering` and the tool animations;
  - an "only this part" view, for Visual Equipment (phase 6).

## 14. Phase 3 (done, 2026-10-19)

- **`src/23_lpc_slots.js` (`DocsDoodads.LpcSlots`, pure):**
  - **The cards:** Body has the tabs Body, Face, Hair and Extras; Outfit has Head, Body, Legs and Gear.
  - **Slots:** each is one kind of part (`type_name`s), and may be required (the skin and head) or a body add-on.
  - **Options:** a slot offers the parts with a walk for the body, safe ones when asked, sorted by name.
  - **◀ ▶ and "None":** stepping goes through the options, with "None" first unless the slot is required.
  - **Colours:** material ramps, or variants for fixed-colour parts. A part's first channel is not offered when
    it follows the skin, so a head offers only its eye colour.
  - **Swatches** show a ramp's middle colour, or a colour guessed from a variant's name.
  - **Changing the body** keeps what fits, and finds a new head when the old one doesn't.
  - **`toRecipe`** honours Show body and Body add-ons.
  - **Dice** for the body card or the outfit card, using only parts that need no others.
  - **Saved characters** go in `data/DocsDoodadsCharacters.json`, by name.
- **`src/44_workspace_lpc_creator.js`, the window, as in the mockup:**
  - a title pill, the library line, the encrypt-safe chip, and a close button;
  - the two cards with tab pills and `Label ◀ value ▶ swatch` rows, and a yellow cursor row;
  - **the stage:** a name field, dice, the character 4× on teal with a shadow, turning, 13 animation chips, the
    toggles, and the parts without the current animation named under it;
  - **the bottom bar:** Load (the saved list), Save, Credits (artists, and how many are not safe to encrypt), and
    Export (off until phase 4);
  - **the palette:** a grid of every colour when a swatch is clicked; right-click goes back one colour.
- **Small windows:** in MZ's own 816 × 624, one card shows at a time (a Body & face / Outfit switch) beside a
  smaller stage. Both cards show from 1120 px wide.
- **Keyboard:**
  - ↑ ↓ rows, ← → values, Shift+← → colours;
  - Q/E tabs, Tab the other card, X/Y dice, `,` and `.` turn;
  - Ctrl+S saves, Esc closes (a popover first).

  Every other key stops at the creator, so the map behind doesn't act, but dialogs and the name field still get
  their keys.
- **Gamepad (standard mapping):**
  - the d-pad or stick moves, repeating when held;
  - A changes the colour, B closes, X/Y are the dice;
  - LB/RB change tabs, LT/RT turn, Back is the other card, Start saves.
- **Sounds:** the project's own cursor, OK, cancel and save sounds (they follow More > Sounds).
- **Entry points:** Characters > Open the Creator, and "Character Creator (LPC)" in Find a Tool.
- **Checked in MZ:**
  - It opens in about 45 ms.
  - Clicking, the palette, save and load, credits, a simulated gamepad and every animation all worked.
  - Arrow keys don't scroll the map.
  - Both layouts were captured.
- **Left for later:**
  - a picture grid of every option (thumbnails), and the palette version (ULPC or LPC Revised);
  - parts that need other parts (hat trims, shield patterns, sleeves): 176 parts aren't in a slot yet, and 15 in a slot need another part first;
  - the Item Bag People tab entry, which waits for exports.

## 15. Phase 4 (done, 2026-10-19)

- **`src/23_lpc_export.js` (`DocsDoodads.LpcExport`, pure):**
  - Names: `$Name`, `$Name[f9][w2]`, `$Name_idle[f2]`, `$Name_run[f8]`, and `img/faces/Name`, cleaned for MZ and
    Windows.
  - Sheets in MZ's row order: down, left, right, up.
  - The classic walker's columns are LPC frames 1, 0 and 5 (the widest strides around the standing pose).
  - The face is the head found from the top of the down-facing standing frame, scaled 4× on a rounded card, in a
    576 × 288 face sheet that keeps its other faces.
  - The animation set: idle after 90 frames at 3 fps, run at 20 fps.
- **`src/44_workspace_lpc_export.js`:**
  - writes the ticked files, and clears MZ's image cache for them;
  - records each file's credits, and writes `CREDITS_LPC.txt` again;
  - adds or replaces the animation set, and keeps the character under its name;
  - leaves weapons and back gear out of the face;
  - works in a playtest only.
- **The creator's Export popover:** the three choices with their file names, the face slot, the encryption note,
  a question before replacing files, and **Try on the player**.
- **Runtime, `[wN]`:** with `[fN]`, frame 0 is the standing pose and walking cycles frames 1 to N−1. The pace
  follows the distance walked: MZ's animation wait becomes 1.5 × N / (frames − 1) / distance per frame. Sheets
  without the tag keep MZ's pace.
- **Fixes found while testing:**
  - Run sheets flashed back to the walk for one frame per tile, because a character is still between steps.
    That frame now counts as moving.
  - The library card's project setting wasn't marked as changed, so it could be lost. It now goes through the
    workspace's undoable setting.
- **Checked in MZ:**
  - The export takes 140 ms for 5 files.
  - The walk measures 3.8 frames per tile, and dashing 3.5 (one cycle per about 2 tiles at both speeds), never
    showing the standing frame while moving.
  - The run sheet plays continuously, and the idle sheet plays when still.
  - The face shows in a message window.
- **Left for later:**
  - Character Action sheets (slash, thrust, spellcast, shoot, hurt and the rest);
  - the side-view battler (phase 5);
  - Visual Equipment part sheets (phase 6);
  - an Item Bag People entry.

## 16. Phase 5 (done, 2026-10-19)

- **Action sheets:** `$Name_<anim>[fN]`, every frame in MZ's four rows. One-row animations (hurt, climb) fill all
  four rows. They are played with **Play Character Action**.
  - Offered: slash, thrust, spellcast, shoot, hurt, jump, sit, emote, climb, combat, backslash and halfslash.
  - Ticked by default: slash, thrust, spellcast, shoot and hurt.
- **Side-view battler:** `img/sv_actors/Name.png`, 576 × 384. Motion `i` sits in column group `i / 6`, row
  `i % 6`, facing left.
  - walk → walk (1, 0, 5)
  - wait → idle
  - chant → spellcast
  - guard → combat
  - damage → hurt (0, 1, 2)
  - evade → jump
  - thrust, swing, missile → thrust, slash, shoot (three frames spread evenly)
  - skill → halfslash
  - spell → spellcast
  - item → emote
  - escape → run, facing right
  - victory → jump (1, 2, 3)
  - dying → hurt (2, 3, 2)
  - abnormal → hurt (1, 2, 1)
  - sleep and dead → the last hurt frame

  When the parts lack an animation, the motion falls back (for example to walk or idle) and the export says so.
- **Compositor fixes found by the playtest:**
  - A part sold in fixed colours shows its first variant when a recipe names none.
  - A part is reported missing an animation only when none of its layers has it. A dagger's "behind" layer
    exists for fewer animations than its blade.
- **Checked in MZ:**
  - The export takes about 430 ms for 11 files.
  - Play Character Action with `$Robin_slash[f6]` played frames 0–5 twice, then went back to the idle sheet.
  - In a side-view battle, the 576 × 384 battler loaded and the swing motion played with the dagger.
- **Left for later:**
  - ~~Oversize weapon art (`slash_oversize`, `thrust_oversize` and `*_128`: most swords, spears and polearms) needs
    sheets with bigger frames.~~ Done, see §18.
  - Visual Equipment parts (phase 6).

## 17. Phase 6 (done, 2026-10-19)

The parts are ordinary Visual Equipment layers, so they work with everything from before: weapon and armour
notetags, part slots (the last item naming a part replaces earlier ones), `hide`, colours, battler `sv` layers,
the try-on preview and the equip screen.

- **Export option, "Outfit as Visual Equipment parts":**
  - The character's own sheets get the body card only: body, head, face, hair and add-ons.
  - Each outfit piece gets part sheets in the same ticked layouts: smooth or classic walker, idle, run, the ticked
    actions, and an `sv` battler.
  - They are named `$LPC <slot> <part> <colour> <body>`, plus ` behind` for layers under the body (library z below
    10). The colour is left out when a variant just repeats the part's name.
- **Notetags:** one `<visual: image, z, part <slot>, sv image>` line per piece.
  - z is the library's `zPos` − 10, so the library's order is kept and below 0 is behind the body.
  - Both pieces share the slot's part, so an item with the same part replaces both.
  - The notetag can be copied, or put on a weapon, armour or actor. That writes `data/Weapons.json`,
    `Armors.json` or `Actors.json` in MZ's layout after a timestamped backup, replaces an earlier LPC line for the
    same part, and updates the running game's database.
- **Runtime, `VisualEquip.stateSheetFor`:** while the body shows another of its own sheets (`_idle`, `_run`, or an
  action), each layer uses its sheet with the same ending and tags if it exists and has loaded. The idle and run
  variants load when the layers are built. This works for any gear art, not only LPC.
- **Checked in MZ:**
  - Two shirts went on two armours, the trousers and shoes on the actor, and the dagger on the Short Sword.
  - Swapping armour swapped the shirt.
  - Standing still, every layer with an idle sheet used it.
  - During the slash action, every layer used its `_slash` sheet.
  - The side-view battler wore all the layers in order.
  - No errors.
- **Left for later:**
  - parts for other body types in one export (`{alias}`);
  - `hide` rules, such as a hood hiding long hair;
  - an Item Bag People tab entry.

## 18. Oversize weapon art (done, 2026-10-19)

Most swords, spears and polearms have no art for the usual 64-pixel animations. The library draws them on bigger
frames as custom animations instead, so before this a character holding one swung empty-handed.

- **What the library has (checked on commit b2c85f9):** 26 parts use them.

  | Custom animation | Frame | Stands for | Notes |
  | --- | --- | --- | --- |
  | `slash_oversize` | 192 | slash | |
  | `slash_reverse_oversize` | 192 | slash | The body plays slash backwards (a return swing). The club and boomerang have only this. |
  | `thrust_oversize` | 192 | thrust | |
  | `walk_128` | 128 | walk | Polearms, katana, scimitar, bows. |
  | `slash_128` | 128 | slash | |
  | `backslash_128` | 128 | backslash | |
  | `halfslash_128` | 128 | halfslash | |

  - The sheets have the animation's frames in its order, in four direction rows. Some are padded with empty
    columns: every `walk_128` sheet, and the katana's `slash_128`, is 13 columns wide.
  - **Where the body goes:** the 64-pixel body sits in the middle of each bigger frame, at (64, 64) in 192 and
    (32, 32) in 128. This was checked by drawing the body's own frames under the art at both candidate places. In
    the middle, the hilt is in the hand in every frame. At the bottom it floats above the head.
- **Resolver:** `LpcCompose.oversize` maps each custom animation to the animation file it stands for, its frame,
  and whether it is drawn for the body playing backwards. `standIns(animation)` lists them by file, so
  `1h_backslash` finds `backslash_128`.
  - A part uses its bigger art only when it has no picture at the usual size for that animation. A bow's 64-pixel
    shoot wins, and a bow walks on `walk_128` because its universal folders have no walk.
  - **Which way the body plays:** the animation's own way, or backwards for a slash whose only big art is a return
    swing (the club, the boomerang). Big art drawn for the other way is played backwards (`layer.flip`), so it
    still follows the hand. With a longsword and a club, the body swings forward and the club's art is flipped.
  - `{ separateBody: true }` keeps the body's own way, for Visual Equipment parts, whose body is a sheet of its own.
  - The result has `frame` (64, 128 or 192), `reverse`, and `oversize` (the names used).
  - `{ oversize: false }` leaves the bigger art out.
- **Compositor:** with a bigger frame, the sheet is `frames × F` by `rows × F`, and `sheet.frame = F`.
  - Each 64-pixel layer's frames are drawn in the middle of the bigger cells, backwards when the body plays
    backwards.
  - The bigger art is drawn at its size, flipped when it is drawn for the other way.
  - Padded columns are ignored, at any size. The wand's 64-pixel slash is also 13 columns wide; it used to be
    left out as "another size".
  - Art whose height doesn't match its frame size is left out with a warning.
- **The return swing as an action:** `slash_reverse` (`$Name_slash_reverse[f6]`, **Backswing** on the stage,
  "slash reverse" among the export's actions). It is slash with every frame backwards. A part with a slash has
  one; the longsword uses its `slash_reverse_oversize` art as drawn, and forward-only art is flipped.
- **Exports (`LpcExport.cellOf`):** MZ stands every frame on its bottom edge, so a frame's feet must be at its
  bottom, as in a 64-pixel frame.
  - **Walkers and the battler** keep the full width and everything above the feet. A 192 frame becomes 192 × 128,
    and a 128 frame becomes 128 × 96. They have to work in MZ without the plugin, and they lose little: at most
    8 pixels for a `walk_128` walker, and at most 10 for the left-facing rows a battler uses.
  - The walkers (`$Name`, `$Name[f9][w2]`) get 128 × 96 frames when the weapon walks on `walk_128`. The idle and
    run sheets stay 64, and the feet stay at the same place.
  - **Action sheets** keep the whole frame (192 × 192), so a downward thrust keeps its tip (up to 57 pixels below
    the feet, on the down-facing row). Only this plugin plays them, so it can stand them on their feet: the
    export writes how far each reaches below the feet into the project's `characterAnim.feet` table
    (`{ "$Knight_slash[f6]": 64 }`). The names stay the same, and an entry goes when a sheet is exported again
    without big art.
- **Art below the feet at runtime:** `CharacterAnim.belowFor(sheet, table)` reads a sheet's `[bN]` tag, or the
  table. The character's sprite stands such a frame on its feet by its anchor (`footAnchor`), so its position, the
  map's sorting and everything else that uses the position stay the same.
  - The bush halves, the cast shadow and its gear parts, the reflection, the see-through silhouette, Visual
    Equipment layers (each by its own sheet), and characters drawn in menus follow the same feet.
  - The sprite goes back to anchor 1 when the sheet has none.
  - `[bN]` works for any artist's sheets, for example `Ogre_smash[f6][b32]`.
- **The side-view battler (decided: grow it).** A 64-pixel battler slot would cut the weapon off, and scaling it
  down would shrink the body. So when any motion uses oversize art, every cell grows to the biggest one needed
  (192 × 128 for a big swing, so the sheet is 1728 × 768).
  - Each motion stands at the bottom middle of its cell, so the body keeps its size and place.
  - MZ splits a battler evenly into 9 × 6 cells and stands it on the bottom, so this works without the plugin.
  - The cost: MZ centres battle animations on half the cell's height, so they show about 32 pixels higher on this
    battler.
- **Export result:** `oversize: [{ file, w, h, below }]` (the battler also lists its motions). The creator's
  popover says "Bigger frames for the weapon art: $Knight_slash[f6] 192 x 192 (64 below the feet), the battler
  192 x 128."
- **Creator stage:** with a bigger frame, the canvas grows around the same body (the same size and place) and the
  swing spills over the stage. The canvas lets clicks through, and the name, dice and turn buttons stay on top.
- **Visual Equipment parts:** a big weapon's part sheets get the same frames as the character's would. That means
  walkers on 128 × 96 frames, actions on whole frames written into `characterAnim.feet`, and a grown battler
  layer. They go over the 64-pixel body sheets because:
  - Visual Equipment draws each map layer at its own frame size, standing on the same feet.
  - A battler layer whose cells have another shape than the battler's is now drawn at its own pixel size
    (`VisualEquip.svScale`). Layers with the same shape are still scaled to the battler, for art drawn at another
    resolution.
  - A return swing is flipped to follow the body's own slash, because the body is a sheet of its own.
- **Checked:**
  - **Tests:** `scratch/test_lpc_compositor.js` and `scratch/test_lpc_export.js` use synthetic 64, 128 and
    192 sheets. `scratch/test_character_anim.js` checks `[bN]` and the table, and `scratch/test_visual_equipment.js`
    checks battler layer scaling.
  - **The real library:** scanned through More > Characters. All 26 oversize parts compose for each animation they
    stand in for, with no size warnings, in 20–70 ms each. Every weapon (328 compositions: slash, backswing,
    thrust and walk, each with the body together and separate) has no size warnings.
  - **In MZ (first pass):** the creator's stage showed the longsword's slash and the halberd's thrust. The export
    wrote the sheets and a 1728 × 768 battler in about 300 ms.
    - Play Character Action played the slash with the player's sprite at the same y.
    - In a side-view battle, the swing motion showed the longsword.
    - A long spear's `$Lance[f9][w2]` walked on 128 × 96 frames.
  - **In MZ (second pass):**
    - `$Lance_thrust[f8]` (1536 × 768) facing down showed the spear's tip below the feet, with the player at the
      same y (anchor 0.667).
    - The Squire's longsword, exported as parts and put on the actor's weapon, drew its 192-pixel `_slash` layers
      over the 64-pixel body, hilt in hand.
    - In battle, the part's 1728 × 768 `sv` layer was drawn at scale 1 over the 576 × 384 battler, the sword in the
      hand.
    - In a bush, the halves split at the feet for the body and for the layers. Shadow parts followed the feet.
    - Back on an ordinary sheet, the anchor was 1 again.
    - No errors.
- **Left for later:**
  - ~~a foot-offset tag, so that bigger frames could keep the art below the feet~~: done for action sheets (`[bN]` and
    `characterAnim.feet`). Walkers and battlers still stand on their bottom edge, because they work without the
    plugin;
  - ~~oversize art in Visual Equipment parts~~: done;
  - ~~the return swing as its own action~~: done (`slash_reverse`);
  - battle animations on a grown battler show a little high. MZ centres them on the cell, and a fix would mean
    patching `Sprite_Animation`.

## 19. Open questions for the owner

1. ~~**The look:**~~ decided: option B, an opt-in Playful theme for the whole editor, plus the look inside the creator.
2. **Default licence policy:** phase 1 starts with the encrypt-safe switch **on**. It is a project setting
   (`lpc.safeOnly`) and can be turned off.
3. ~~**Library location:**~~ decided in phase 1: one folder outside the project, remembered per computer. A folder
   inside the project would be copied into the game by MZ's Deployment.
4. **Fork-specific additions:** does the DocDamage fork add parts or fields beyond the upstream generator that
   should be supported from day one?
