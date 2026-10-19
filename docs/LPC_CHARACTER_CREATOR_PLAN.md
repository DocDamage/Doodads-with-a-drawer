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
  - oversize and 128-pixel weapon art (`*_oversize`, `*_128`);
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

## 15. Open questions for the owner

1. ~~**The look:**~~ decided: option B, an opt-in Playful theme for the whole editor, plus the look inside the creator.
2. **Default licence policy:** phase 1 starts with the encrypt-safe switch **on**. It is a project setting
   (`lpc.safeOnly`) and can be turned off.
3. ~~**Library location:**~~ decided in phase 1: one folder outside the project, remembered per computer. A folder
   inside the project would be copied into the game by MZ's Deployment.
4. **Fork-specific additions:** does the DocDamage fork add parts or fields beyond the upstream generator that
   should be supported from day one?
