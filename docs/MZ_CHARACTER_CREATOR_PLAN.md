# MZ Character Creator: Plan

**Status:** phase 1 done (2026-10-19).

**Goal:** a third character creator, built from the parts of **RPG Maker MZ's own Character Generator**. It uses
the same window, look and controls as the LPC and Memao creators (`docs/LPC_CHARACTER_CREATOR_PLAN.md`,
`docs/MEMAO_CHARACTER_CREATOR_PLAN.md`), and exports MZ's own layouts.

## 1. Licence

The generator parts come with RPG Maker MZ and are licensed for games made with it. They may not be
redistributed. So, as with the other two libraries:

- **Nothing shipped:** none of them ships with the plugin or goes into this repository.
- **Read in place:** the editor reads them from the MZ installation, `RPG Maker MZ/generator`. In a playtest that
  folder is found from the running `nw.exe` (`nwjs-win/nw.exe` → `../generator`); it can also be chosen.
- **What goes into the project:** only the index (file names and the colour ramps) goes in the editor's cache,
  `data/docs_doodads_cache/mzgen_index.json`, and only the exported sheets go into the game.
- **No editor code:** none of MZ's editor code is used. The format below was read from the files themselves.

## 2. The format (measured on MZ's generator folder, 2026-10-19)

- **Folders:** `TV` (walking, 144 × 192), `TVD` (damaged, 144 × 48), `SV` (the side-view battler, 576 × 384),
  `Face` (144 × 144; some layers are 160 × 160, centred on the face) and `Variation` (the editor's icons, not used).
  Each has `Male`, `Female` and `Kid`. There are 865 parts in 6,317 files.
- **Walking, damaged and battler parts:** `TV_Clothing2_p03.png` is a family (Clothing), its layer (2) and the
  part number (3).
  - Layer 2 of a family is drawn behind the body and layer 1 in front. That is how wings, tails, cloaks and rear
    hair go behind the body facing down and in front facing up. One part is all of a family's layers with its
    number.
  - Each has a mask `_c.png`: flat key colours saying which colour slot each pixel takes. White means fixed.
  - The base image comes already coloured in the part's own default colours.
- **Face parts:** `FG_Clothing2_p03_c4_m007.png` is the family and layer, the part, the layer within the part (c4),
  and the **colour slot** (m007). A file without `_m` has fixed colours, such as the whites of the eyes or a
  hat's lining.
  - Within a part, the highest c is drawn first, so c1 is on top. This was checked by eye: in the other order a
    helmet's trim and a goggle lens disappear.
  - At first `_m` looked like a depth. It is the colour slot: m003 is the hair of the front hair, the rear hair,
    the eyebrows and the beard alike.
- **Colour slots:**

  | Slot | Meaning | Slot | Meaning |
  | --- | --- | --- | --- |
  | m001 | skin | m011–m012 | cloak 1–2 |
  | m002 | eyes | m013–m015 | accessory A 1–3 |
  | m003 | hair | m016–m019 | accessory B 1–4 |
  | m004 | hair 2 | m020–m021 | glasses 1–2 |
  | m005 | facial mark | tail | tail (walking only) |
  | m006 | beast ears | wing | wing (walking only) |
  | m007–m010 | clothing 1–4 | | |

  - The walking, damaged and battler mask keys map to the same slots. This was measured by matching each key's
    colours to the same part's face files. For example `#fccb0a` is hair in 206 parts, and `#ae8682` is
    clothing 1. A few keys were settled by elimination within their group.
- **Ramps:** `grad_common.png`, `grad_skin.png`, `grad_hair.png` and `grad_eyes.png` are 4-pixel bands, one colour
  each, light (left) to dark (right). There are 18 common, 24 skin, 24 hair and 12 eye colours.
  - A part's default colours are not on these bands, and the mask keys aren't either. So the editor's exact
    recolouring rule can't be read from the files.
  - Doc's Doodads recolours by brightness. A slot left as drawn keeps the part's own colours. A slot given a ramp
    recolours each of its pixels to the ramp's colour of the same brightness, which keeps the shading.
- **Interlaced PNGs:** 27 of the files are interlaced (Adam7). `LpcCompose.decodePng` now reads interlaced PNGs,
  checked pixel for pixel against PIL on all 27.

## 3. Design

- **Modules:**
  - `src/23_mzgen_index.js` (`DocsDoodads.MzGen`): file names, slots, mask keys, ramps, the scan.
  - `src/23_mzgen_compositor.js` (`DocsDoodads.MzGenCompose`): each view's order, recolouring by brightness, and
    the composed sheets.
  - `src/23_mzgen_slots.js` (`DocsDoodads.MzGenSlots`): the pickers, and the character-wide colour slots
    (`channels`, `getColour`, `setColour`).
  - `src/23_mzgen_export.js` (`DocsDoodads.MzGenExport`): names.
  - `src/44_workspace_mzgen.js`: the folder (found or chosen), the scan, drawing, export, and the MZ part of More >
    Characters, which comes first on the card.
- **Drawing order, back to front:**
  - **Walking:** layer 2 of tail, wing, cloak, rear hair and front hair; then body, ears, facial mark, beard,
    clothing, cloak 1, rear hair 1, front hair 1, beast ears, accessory A, glasses, accessory B; then layer 1 of
    wing and tail.
  - **Battler and damaged:** wing and tail behind; otherwise the same.
  - **Face:** rear hair 2, cloak 2, body, face, ears, eyes, nose, mouth, eyebrows, facial mark, beard, clothing,
    cloak 1, rear hair 1, front hair, beast ears, accessory A, glasses, accessory B.
- **Window** (the kit `mz` in `44_workspace_creator_kits.js`):
  - **The window grew three things,** used when a kit provides them:
    - colour channels per part, with tabs in the palette (clothing has up to four slots);
    - a stage scale per sheet size;
    - frame sequences.
  - **Cards and tabs:**
    - **Body & face:**
      - **Body:** Body type (Male, Female, Kid), Skin, Face, Ears, Beast ears.
      - **Face:** Eyes, Eyebrows, Nose, Mouth, Facial mark.
      - **Hair:** Front hair, Rear hair, Beard.
    - **Outfit:**
      - **Clothes:** Clothing, Cloak.
      - **Head:** Accessory A, Accessory B, Glasses.
      - **Extras:** Wing, Tail.
  - **Colours:** a slot's colours are "as drawn" plus its ramps. Slots are shared, so the hair colour changes the
    front hair, rear hair, eyebrows and beard together, as in MZ's generator.
  - **The stage** plays:
    - **Walk** (0, 1, 2, 1, at 5×; 3× in MZ's window size);
    - **Damaged**;
    - **Face** (the portrait, at 2×);
    - **MZ's 18 battle motions** (64-pixel cells at 4×; 2× in MZ's window size).
- **Exports** are the views as composed, all MZ's own layouts:

  | Export | File | Size |
  | --- | --- | --- |
  | Walking character | `$Name.png` | 144 × 192 |
  | Damaged character | `$Name_damage[f3][d1].png` | 144 × 48 |
  | Side-view battler | `img/sv_actors/Name.png` | 576 × 384 |
  | Face | `img/faces/Name.png`, one of the sheet's 8 slots | 144 × 144 |

  The damaged row is for Play Character Action or an event. Characters are saved in
  `data/DocsDoodadsMzCharacters.json`, with their colours.

## 4. Checked

- **Tests:** `scratch/test_mzgen.js` builds a synthetic generator folder at the real sizes. It checks:
  - names, mask keys, and an interlaced PNG;
  - the scan: bases, ramps, layers and slots;
  - each view's order, with layer 2 behind and layer 1 in front;
  - colours: as drawn by default, a ramp at the pixel's own brightness, white in the mask fixed;
  - face layers by c, with whites kept and 160-pixel layers centred;
  - damage, and the battler motions;
  - the slots: channels, shared colours, bases, the dice, saving colours;
  - in the editor: the export, the window (stage scale per sheet, colour tabs, export ticks) and the card.
  - The LPC and Memao tests pass unchanged on the shared window.
- **The real folder:** 865 parts scanned in about 20 ms (about 70 ms through the card in MZ). The walker, battler
  and faces were composed and checked by eye for Male, Female and Kid, before and after recolouring.
- **In MZ (QA copy):**
  - The card found the generator folder from MZ's `nw.exe`, scanned it and opened the MZ Character Creator.
  - The clothing palette had tabs for Clothing 1, 2 and 4, and a colour picked on the second tab applied.
  - The stage showed the face and the battle swing.
  - Exporting "Rin" wrote 4 files in about 30 ms.
  - Try on the player walked her at MZ's own size, and in a side-view battle her battler swung.
  - No errors.

## 5. Later

- the Variation icons beside the part names in the pickers;
- a palette editor, and the exact colours of MZ's own generator if its rule is ever documented;
- generator parts added by DLC, if they follow the same names.
