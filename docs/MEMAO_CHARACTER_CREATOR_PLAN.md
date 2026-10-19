# Memao Character Creator: Plan

**Status:** phase 1 done (2026-10-19).

**Goal:** a second character creator beside the LPC one, built from the asset pack of the **Memao Sprite Sheet
Creator** by Sleeping Robot Games. It uses the same window, the same look and the same controls as the LPC
creator (`docs/LPC_CHARACTER_CREATOR_PLAN.md`), and exports MZ sheets the same way.

## 1. Licence (this decides the architecture)

The pack's `License.txt` (the same text ships with the tool) says:

- **Allowed:**
  - using the tool and its assets in personal and commercial games;
  - editing exported sprites;
  - putting exported sheets into game engines as part of a game;
  - publishing games that use them.
- **Not allowed:**
  - resharing or redistributing the tool or its assets, in part or whole;
  - sharing exported sheets as standalone assets;
  - AI training or AI-related services;
  - crypto, blockchain and NFT projects.
- **Credit:** credit to "Memao" is appreciated.

Doc's Doodads is MIT and public. So, as with LPC:

- None of the art ships with the plugin or goes into this repository.
- The editor reads the pack from a folder on the user's computer, kept per computer.
- Only the index (part names, file numbers, draw order) goes in the editor's cache, `data/docs_doodads_cache/memao_index.json`.
- Only the sheets made from the pack go into the game's `img/` folders, which the licence allows.
- The folder should be outside the project, because MZ's Deployment copies the whole project folder.
- None of the tool's code is used. The tool is a Godot build, and only its asset pack is read.

The owner confirmed (2026-10-19) that building this local tool for their own licensed use is fine under the AI
clause.

## 2. The format (measured on the pack, 2026-10-19)

- **Files:**
  - Three **sets**: `Main`, `Battle` and `Daily Life`.
  - Each set has a folder per part (`HairA/haira_007.png`); Godot `.import` files sit beside them.
  - The same file number is the same item in every set, for example the same hairstyle drawn for other
    animations.
  - Item layers exist only in the set that uses them: `Battle/Sword`, `Main/ChopA`, `Daily Life/Eat`.
  - A `000` file is "None", an empty sheet. Folders without one (Body, Head, Arms, Eyes, Bottom A) always have a
    pick.
- **Sheets** are 8 columns of 48 × 48 frames: Main and Battle are 384 × 960, Daily Life 384 × 816. Frames run
  left to right, then down.
  - The figure is about 16 × 32, standing with its feet at y 40.
  - Each animation is 4 facings × N frames, in the order **down, up, left, right**. Checked from the eyes: in a
    side frame they sit left or right of the head's middle.

| Set | Animations (frames per facing) | Frames |
| --- | --- | --- |
| Main | idle 4, walk 6, run 6, pick up 4, strike 4, chop 4, seed 3, water 4, reap 4 | 0–155 |
| Battle | slash 4, hurt 2, downed 2, death 3 | 0–43 |
| Daily Life | eat 3, drink 3, laugh 3, wave 4, think 4, shrug 4, sit 4, read 4, paint 4 (left and right only) | 0–131 |

  The animations and frame counts are the ones the tool's page lists. The starts follow from them, and every item
  layer's pixels fall exactly in its own animation: seed 112–123, water 124–139, sword 0–15, read 100–115.
- **Draw order:** `z_index_player_library.json` gives, per part folder, a number per facing (front, back, left,
  right). Higher is drawn on top. For example, the wings are 2 facing down and 31 facing up. Folders it doesn't
  name (Sword, Eat, Drink, Read, Paint) use its `Tool` entry.
- **Pairs:** some folders hold the frames of another part that need another depth, with the same file number:
  - Hair D goes with Hair B.
  - Back B goes with Back A.
  - Shoulder B goes with Shoulder A.
  - Chop B goes with Chop A.
  - Strike B goes with Strike A.
- **Sleeves** (Top B, Jacket B) come in one file per sleeve style and arm (Dainty, Average, Broad). The file
  follows the body's arms.
- **Names** come from the pack's `README.md`. Each part header is a line like `**Hair A** - ...`, and each item a
  line like `- 007 (015: Emo Left)`, giving the file number, then the tool's order and name. If the README can't be
  read, names fall back to the folder and number.
- **Colours:** the art is greyscale templates. Only opaque pixels in exactly these greys are recoloured; anything
  else, such as stripes, metal, food or translucent glass, is drawn as it is.
  - **Skin parts** (Body, Head, Arms, Ears): outline `#000000`, then `#545454`, `#aaaaaa` and `#ffffff`.
  - **The other parts:** `#000000`, then `#404040`, `#808080` and `#ffffff`.
  - The tool's own palettes are inside its program file and aren't used. Doc's Doodads has its own 3-tone ramps
    (skin, hair, eyes, cloth), and the three greys map onto them.
  - Eyes recolour only `#404040` and `#808080`, so their whites stay white.

## 3. Design

- **The pack:**
  - `src/23_memao_index.js` (`DocsDoodads.Memao`): the scan, README names, draw order and index.
  - `src/23_memao_compositor.js` (`DocsDoodads.MemaoCompose`): animations, layering per facing, recolouring, and
    our palettes. It composes into the same row layout as the LPC compositor (up, left, down, right; frames along
    the row; `sheet.frame = 48`), so the creator's stage and the export code read it the same way.
  - `src/23_memao_slots.js` (`DocsDoodads.MemaoSlots`): the creator's cards, tabs and slots, and saved characters
    in `data/DocsDoodadsMemaoCharacters.json`. It has the same functions as `LpcSlots`.
  - `src/23_memao_export.js` (`DocsDoodads.MemaoExport`): the MZ layouts.
- **One creator window for both:** `src/44_workspace_creator_kits.js` (`DocsDoodads.CreatorKits`) describes each
  library: its slots, index, compositor, animations, top-bar line, credits and export. The window
  (`44_workspace_lpc_creator.js`) asks the open kit, so both creators look and behave the same. LPC stays the
  default.
- **Workspace:** `src/44_workspace_memao.js`. It holds:
  - the folder (per computer) and the scan;
  - drawing from the pack, through one cache;
  - the export writing;
  - the Memao part of More > Characters.
- **Slots:**
  - **Body & face:**
    - **Body:** Body type (the arms: Average, Dainty, Broad), Skin, Head, Ears, Horns.
    - **Face:** Eyes, Eyebrows, Face (blush, goatee, beard).
    - **Hair:** Hair (A), Long hair (B), Side hair (C).
    - **Extras:** Glasses (Accessory A), Headwear (B), Headwear 2 (D), Back (A).
  - **Outfit:**
    - **Top:** Shirt, Sleeves, Jacket, Jacket sleeves. The sleeves take their garment's colour.
    - **Legs:** Bottom, Waist, Socks, Shoes.
    - **Gear:** Neck, Shoulders, Middle, Gloves.
    - **Tools:** Sword, Axe, Field tool (Strike A), Scythe, Seed bag, Watering can.
  - The props (Eat, Drink, Read, Paint) are drawn in their own animations whatever the character wears.
- **Exports** (48 px frames: MZ's own size):

  | Export | Name | Contents |
  | --- | --- | --- |
  | Classic walker | `$Name.png` | 3 × 4, works without the plugin |
  | Smooth walker | `$Name[f7][w2].png` | frame 0 stands (idle frame 0), then the 6 walk frames |
  | Idle and run | `$Name_idle[f4]`, `$Name_run[f6]` | with the animation set that plays them |
  | Actions | `$Name_wave[f4]` and so on | every animation, for Play Character Action |
  | Side-view battler | `img/sv_actors/Name.png` | 432 × 288, MZ's 18 motions from the animations facing left |
  | Face | `img/faces/Name.png` | the head scaled up whole pixels, in one of the sheet's 8 slots |

  Rows are in MZ's order (down, left, right, up). Paint has only side frames, so its down and up rows repeat the
  left and right ones.

## 4. Phase 1: what was built and checked

- **Built:** everything in §3. The figures are drawn 5 times on the stage (4 in MZ's own window size), and the
  stage's shadow sits under their feet.
- **Tests:** `scratch/test_memao.js` builds a synthetic pack at the real sheet sizes and checks:
  - README names, sleeves split by arm, and the draw order with its `Tool` fallback;
  - the scan: sets, None, pairs and channels;
  - frames per facing and animation, including paint;
  - recolouring: only opaque template greys change; outlines, the whites of the eyes and translucent pixels
    stay;
  - depth per facing, pairs, sleeves per arm, props, and missing sets;
  - the slots: first character, ◀ ▶ with None, arms, colours that follow, the dice, and saving;
  - every export layout;
  - in the editor: the scan, the export, the creator window in Memao mode, and the Characters card.
  - The LPC creator's tests pass unchanged on the shared window.
- **The real pack:** 237 parts in 3 sets, scanned in about 10 ms (about 50 ms through the card in MZ). An
  animation composes in about 90 ms the first time. The left and right rows were checked from the eyes.
- **In MZ (QA copy):**
  - The card scanned the pack and opened the Memao Creator.
  - The dice, a sword in the Tools tab, and Slash on the stage all worked.
  - Exporting "Mia" wrote 10 files in about 190 ms: `$Mia[f7][w2]` 336 × 192, a 432 × 288 battler, and a face.
  - **Try on the player:** Mia walked on 48 × 48 frames.
  - Play Character Action played `$Mia_wave[f4]` twice.
  - In a side-view battle, the swing showed the sword.
  - No errors.
- **Noticed:** in battle, MZ also draws its own weapon sprite for the equipped weapon. The guide says how to turn
  it off.

## 5. Later

- Visual Equipment parts, as LPC phase 6;
- a palette editor for your own ramps;
- the tool's later sets (Adventure, Battle 2) when they arrive, if their layout follows the same rules;
- a way to stand the 48-pixel frames lower: the feet are at y 40, so Memao characters stand a little above the
  tile's bottom edge, as the tool's own exports do.
