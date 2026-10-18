# Doc's Doodads — User Guide & Technical Reference

**Plugin:** `Docs-Doodads.js` (v2.0)  
**Compatibility:** RPG Maker MZ. MV is untested since 2.0 and unsupported (see the README).  
**License:** MIT License. Based on QJ-Doodads by Qiu Jiu.  

---

## 1. Overview & Vision

**Doc's Doodads** transforms the traditional RPG Maker in-game doodad editor into a high-performance visual asset management, placement, slicing, and event-authoring workspace. 

It eliminates the friction of traditional sprite-sheet pickers and multi-click file dialogue boxes by providing:
- **Instant visual browsing** with virtualized cards capable of smoothly scrolling 10,000+ assets.
- **Intelligent sprite sheet detection & slicing** (standard MZ formats, sidecar JSON atlas files, and automatic alpha-threshold visual detection).
- **Direct drag-and-drop placement** onto the live game map with real-time ghost previews.
- **Genuine RPG Maker MZ event creation** with 20 pre-built game event templates (NPCs, chests, doors, switches, teleporters, encounters) plus custom template saving.
- **Direct SAT physical collision** with interactive relative collision editing.
- **Modern editor operations**: Marquee selection box, Shift+Click multi-select, alignment, distribution, grouping, locking, hiding, Z-order layering, copy/paste, and 300-level command undo/redo.
- **Windows Explorer native file/folder drop import** with intelligent categorization and collision renaming.
- **Enterprise-grade project safety**: session snapshots, pre-save external conflict protection, timestamped backups in `data/docs_doodads_cache/backups/`, atomic writes, and crash autosave recovery.

---

## 2. Quick Installation & Setup

> **Coming from QJ-Doodads?** Remove `QJ-Doodads.js` from Plugin Manager and add `Docs-Doodads.js` in its place. Your existing `DoodadsQJ.json`, asset library, templates, layouts, backups, and plugin settings are read automatically and saved under the new names the next time you save.

1. Copy [`Docs-Doodads.js`](Docs-Doodads.js) into your RPG Maker project directory:
   ```text
   js/plugins/Docs-Doodads.js
   ```
2. Open RPG Maker MZ, go to **Plugin Manager**, and activate **`Docs-Doodads`**.
3. Launch Playtest (**F5**).
4. Press **F10** (or your configured `editKey`) while on any map to open the Asset Workspace!

> [!NOTE]
> All editor UI, indexing, and authoring tools are strictly isolated to Playtest mode (`Utils.isOptionValid("test")`). In production builds, the plugin operates purely as a lightweight doodad rendering and collision engine with zero editor memory overhead.

---

## 3. Plugin Parameters Reference

Configure these options directly inside RPG Maker's Plugin Manager:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Editor Toggle Key** (`editKey`) | Select | `F10` | Key to open/close the workspace (`F1`, `F6`-`F10`). |
| **Editor Enabled** (`editorMode`) | Boolean | `true` | Enables in-game asset workspace during playtest. |
| **Doodads Image Folder** (`folderName`) | Text | `doodads/` | Subfolder inside `img/` for standalone doodads. |
| **Doodads Data File Name** (`dataFileName`) | Text | `DocsDoodads` | JSON filename in `data/` (without `.json`). |
| **Texture Scaling Mode** (`doodadScaleMode`) | Boolean | `true` | `true` for Smooth / Linear, `false` for Pixelated / Nearest. |
| **Default Workspace Layout** (`defaultLayout`) | Select | `Mapping` | Startup layout preset (`Mapping`, `Events`, `Characters`, `Tiles`, `Compact`). |
| **Default Thumbnail Size** (`defaultThumbnailSize`) | Number | `96` | Initial card size in pixels (32 to 256). |
| **Asset Cache Enabled** (`cacheEnabled`) | Boolean | `true` | Caches metadata & disk thumbnails for instant opening. |
| **Background Work Budget** (`backgroundWorkBudget`) | Number | `4` | Milliseconds per frame dedicated to background scanning. |
| **Autosave Interval** (`autosaveRecoveryInterval`) | Number | `60` | Heartbeat interval (seconds) for crash recovery snapshots. |
| **Backup Retention Count** (`backupRetentionCount`) | Number | `10` | Number of timestamped backups retained in `data/docs_doodads_cache/backups/`. |
| **Enable MV Compatibility** (`enableMVCompatibility`) | Boolean | `true` | Enables the compatibility layer when running under RPG Maker MV. MV is untested since 2.0. |
| **Developer Diagnostics** (`devDiagnostics`) | Boolean | `false` | Enables detailed console logging in DevTools. |

---

## 4. Visual Asset Drawer & Search

The left panel is the **Asset Drawer**, providing virtualized access to all graphics and audio in your project.

### Navigation & Views
- **Category Tabs**: Switch between `All`, `Doodads`, `Characters`, `Tilesets`, `Pictures`, `Audio`, `★ Favs` (starred favorites), and `🕒 Recent` (recently used assets).
- **Virtual Collections**: Group assets into custom collections (e.g., "Castle Set", "Dungeon Props") without duplicating files on disk. Filter using `collection:"Castle Set"`.
- **Right-Click Card Context Menu**: Right-click any asset card to open an instant action menu:
  - *Place as Doodad* / *Place as Real MZ Event...*
  - *Add to Favorites / Remove from Favorites*
  - *Add to Collection...*
  - *Open in Slicing Modal* / *Export Slices to PNGs*
  - *Play Audio Preview* / *Stop Audio*
- **Thumbnail Slider**: Zoom cards smoothly between 48px and 160px.

### Tokenized Search Syntax
Type directly into the search bar (press **F** to focus). Search is evaluated dynamically in under 30ms across 25,000+ assets:
- `chest`: Finds any asset with "chest" in its name, tag, or path.
- `tag:nature` or `tag:"deep forest"`: Filters for assets with the manual or auto-tag.
- `collection:"Castle Set"`: Filters for assets belonging to a virtual collection.
- `type:character_sheet`: Filters specifically for character sheets.
- `category:Audio`: Filters for sound files.
- `favorite:true`: Shows only starred/favorite assets.
- `animated:true`: Shows only multi-frame or animated assets.
- `used:no` / `used:yes`: Files no map, event, database entry, doodad, or prefab uses (or that something does use).
- `-tree`: Negative search; excludes any asset matching "tree".
- **Combined Example**: `prop_123 tag:tree -dead category:Doodads collection:"Castle Set"`

---

## 5. Intelligent Slicing Engine & Slicer Modal

The workspace features a multi-tiered slicing engine that segments composite sheets into individual reusable assets:

1. **Known MZ Format Detector**: Automatically detects `$Single` character sheets (3x4), standard 8-character sheets (12x8), Face sheets (4x2), IconSet grids (32x32), and Sideview Battlers without manual configuration.
2. **Sidecar Atlas Parsers**: Reads Aseprite JSON, TexturePacker JSON, and `.saf.json` metadata when placed alongside the image.
3. **Canvas Visual Auto-Slicer**: Uses Otsu adaptive alpha thresholding, 4-connected component labeling, border flood background removal, morphological noise cleanup, and gutter splitting to isolate irregular sprites.
4. **Interactive Slicer Modal**:
   - Double-click any asset or click **Auto Slice** to open the 1600% zoomable slicer editor.
   - **8-Handle Drag & Resize**: Adjust region boundaries with sub-pixel precision.
   - **Smart Snapping**: Automatically snaps region edges to pixel gutters and nearby regions.
   - **Tools**: Split, Merge, Align, Distribute, Rename, and Set Pivots.
   - **Persistence**: Region definitions are saved non-destructively in `data/DocsDoodadsLibrary.json`. The original source PNG is never modified.
   - **Export**: Export sliced regions as standalone PNGs or animation strips directly to `img/doodads/` with one click.

---

## 6. Drag-and-Drop Placement & Modern Map Editing

### Placing Assets
- **Drag & Drop**: Drag any asset or slice from the Drawer directly onto the live game map. A translucent **Ghost Follower** tracks your mouse with exact dimensions.
- **Snapping**: Snaps to 48px tile coordinates by default. **Hold Alt** while dragging or dropping for free pixel-perfect placement.
- **Stamp Mode**: Click the **Stamp** tool in the toolbar to click-to-place repeated props (grass, barrels, trees) across the map. Press **Escape** or right-click to exit.
- **Scatter Brush & Settings**: Click the **Scatter Brush** tool to paint scattered props. A floating settings popover lets you tune **Radius**, **Density**, **Scale** and **Rotation Variation**, **Min Spacing** (props never land closer than this, including to props already there), **Flip Chance**, and **Hue Variation**. Rules keep props on chosen **regions** or **terrain tags** and can **skip impassable tiles** (water, walls).
- **Path Tool**: Click **Path**, then click points on the map (tile-snapped; hold **Alt** for free points). Double-click or press **Enter** to place the selected asset evenly along the line; **Backspace** removes the last point. Settings: spacing, random offset, turning pieces along the path, and smoothing. Choose separate **End** and **Corner** pieces from the drawer for fences, walls, and rows of lamps.
- **Prefabs**: Select doodads and click **Save Prefab** in the Inspector. Events under the selection can be included. The selection becomes the prefab's first linked copy. Place prefabs from the **Prefabs** tab by dragging, with **Stamp**, or **Place at Player**. Copies are grouped. Edit one copy and click **Update Prefab**, then **Sync Copies** to rebuild every copy on every map from the master. **Detach** unlinks a copy.
- **Eyedropper**: Hold **Alt and click** any placed doodad or MZ event on the map (or click the **Eyedropper** toolbar button) to automatically find and select that asset or event template in the Drawer.

### Selection, Multi-Selection & Right-Click Context Menu
- **Click**: Select a placed doodad or genuine MZ Event on the map.
- **Drag to Move**: Press on a doodad and drag. Pink **smart guides** snap its edges and centre to nearby doodads; orange guides show equal spacing between neighbours. Hold **Alt** to move freely or **Shift** to snap to the tile grid. A drag is one undo step.
- **Right-Click Canvas Context Menu**:
  - *On Doodad*: Bring Forward (+1 Z), Send Backward (-1 Z), Bring to Front, Send to Back, Duplicate (Ctrl+D), Lock/Unlock, Hide, Delete (Del).
  - *On MZ Event*: Save as Event Template..., Duplicate Event, Delete Event.
  - *On Empty Map*: Toggle Grid Overlay (G), Paste Copied Doodads (Ctrl+V), Stamp Asset Here.
- **Marquee Drag Box**: Click and drag on empty map space with the pointer tool to draw a blue selection box. All enclosed doodads are selected at once!
- **Shift + Click / Shift + Marquee**: Add or toggle doodads in the active multi-selection.
- **Nudge**: Press **Arrow Keys** to nudge selected doodads by 1 pixel (**Shift + Arrow Keys** for 16 pixels). Arrow keys also nudge selected MZ Events by 1 tile.
- **Duplicate**: Press **Ctrl + D** to duplicate all selected doodads (+16px offset) or selected event.
- **Copy / Paste**: Press **Ctrl + C** to copy selected doodads and **Ctrl + V** to paste them.
- **Delete**: Press **Delete** to remove selected doodad(s) or selected event.

### Alignment & Distribution
When 2 or more doodads are selected, the Inspector exposes one-click alignment tools:
- **Align**: Left, Center X, Right, Top, Center Y, Bottom.
- **Distribute**: Horizontal Distribution, Vertical Distribution.

### Organization & Layering
- **Grouping**: Click **Group** to link selected doodads (`d.groupId`). Clicking any member selects the entire group.
- **Locking**: Click **Lock** (or press lock in Inspector). Locked doodads cannot be nudged, dragged, or accidentally deleted.
- **Hiding**: Click **Hide** to toggle editor visibility of decorative layers without affecting runtime gameplay.
- **Z-Order Layering**: Use the Layering buttons in Inspector to adjust draw order:
  - **+1 Z (Bring Forward)**: Increments Z-order.
  - **-1 Z (Send Backward)**: Decrements Z-order.
  - **To Front**: Places selected doodad(s) on top of all other doodads on the map.
  - **To Back**: Places selected doodad(s) beneath all other doodads.

---

## 7. Depth, Appearance, Motion, Shadows & Lights

Select a placed doodad (or several) and open the Inspector's collapsible sections. Every change can be undone, and dragging a slider counts as a single step.

- **Depth**: *Below characters* (rugs, puddles, paths), *Sorted with characters* (trees, pillars, statues: the player walks behind them above the base line and in front below it), or *Above characters* (overhangs, canopies). **Base line offset** moves the sort line up or down. New placements guess from the file name, and each asset can set its own **Default Depth**. QJ-Doodads projects keep their old layering: z 0-2 maps to below, 3 to sorted, and 4+ to above.
- **Appearance**: opacity, blend mode (Normal, Add, Multiply, Screen), hue shift, colour tone, greyscale, blur, and horizontal/vertical flip.
- **Motion**: Sway (wind), Bob (float), Pulse, Flicker (flame), or Shimmer (water/heat), with amount and speed. Neighbouring props are offset in time so a forest doesn't sway in lockstep.
- **Shadow**: a soft silhouette built from the sprite's own transparency, with strength, length, lean, softness, and offset. It falls over floor decals and under characters.
- **Light**: colour, radius, intensity, flicker, a daylight glow, and offset. Lights shine through the map's ambient darkness.
- **Visibility**: show only while switches are set (`5:on, 6:off`) and/or while a JavaScript condition is true. The editor always shows conditional doodads, faded when their condition is false.

**Map lighting**: with nothing selected, the Inspector shows the map's settings. Set **Ambient Darkness** and colour, optionally only while a switch is ON (a night switch), and toggle **Preview lighting while editing**. During play, the plugin commands **Set Ambient Light** (darkness %, colour, fade frames) and **Reset Ambient Light** fade between moods.

---

## 8. World Atmosphere: Day & Night, Sun Shadows, See-Through, Water, Seasons, Motion Blur

These settings apply to the whole game. With nothing selected, the Inspector shows the map panel. Its sections marked **All maps** hold them, and the Lighting section has three per-map switches. Everything is undoable and saved in `data/DocsDoodads.json`.

### Day and Night
- **Clock**: *Off*, *Running clock* (game minutes pass while the player is on a map; saved with the game), or *Read from variables* (your own events set the hour and minute variables).
- The running clock writes the hour (and minute) into the variables you choose, so events can check the time.
- **Darkness through the day** is a list of keyframes (hour, darkness, colour). The map's darkness is blended between them, wrapping through midnight. The defaults go dark blue at night, orange at dawn and dusk, and clear by day.
- **Lamps**: set a doodad's Light to *After dark* and it fades on once darkness passes **Lamps switch on at darkness**, and off again in the morning.
- **Preview a time while editing** scrubs the clock without changing the game.
- **Per map**: *Day and night on this map* is *Auto* (follow the clock unless the map sets its own darkness, so caves stay dark), *Follow the clock*, or *Ignore (indoors)*.
- Plugin commands: **Set Time of Day**, **Pass Time**, **Clock Control** (pause, resume, speed), and **Set/Reset Ambient Light**, which still win over the clock while they are active.

### Sun and Shadows
- The sun rises in the east and sets in the west. Morning shadows point west, noon shadows are short and point up the screen, evening shadows point east, and a faint moon does the same at night. You can use a fixed direction or a variable (degrees) instead.
- **Characters cast shadows** gives the player, followers and events a soft shadow cut from their own sprite. It follows the sun, stays on the ground while jumping, and is correct in tall grass.
- **Which events**: every event that stands up (same priority as characters), or only tagged ones.
- **Stop shadows at regions**: list roof or overhang region IDs, and shadows end at their edge instead of being sliced by upper tiles.
- Doodad shadows can **Follow the sun** (Shadow section) instead of keeping a fixed lean.
- Event tags, in the note box or a comment on the active page: `<shadow>`, `<shadow: length 0.8, opacity 0.4>`, `<no shadow>`.
- Per map: *Character shadows on this map*.

### See-Through
When the player walks behind a tall doodad (a tree, a roof, a tower), it fades so the player stays visible. Or the player is drawn as a coloured outline, or both.
- **Auto** applies to standing doodads at least 1.5 tiles tall.
- Set **See-through** to *Always* or *Never* per doodad in its Atmosphere section.

### Water Reflections
- Characters and standing doodads get a rippling mirrored copy on the water tiles below them. Bridges over water are left alone.
- Add a **region** to treat painted areas (ponds drawn with B-E tiles) as water.
- **Shore margin** keeps a strip along the waterline clear, because MZ water tiles draw their own sand or grass edge. Reflections start where the water visibly begins.
- Turn it off per map, per doodad (**Reflect in water**), or per event with `<no reflection>`.

### Motion Blur
Moving characters blur along their direction, more when dashing; transfers and jumps never smear. Choose everyone or events tagged `<motion blur>` (`<no motion blur>` opts out). When it is on, players get a **Motion Blur** switch in the Options menu.

### Seasons
- **Current season from**: a variable, or the **Set Season** plugin command. Season names are editable.
- **Art swaps**: each row lists one prop's art per season, and every doodad using any image in the row shows the current season's version. Empty cells keep the original. Fill rows from the map panel, or select an asset in the drawer and use **Season Variant** to add it.
- **Preview while editing** shows any season in the editor.
- A doodad's **Only in ...** checkboxes limit it to some seasons (flowers in spring and summer, snowmen in winter).

### Appear and Disappear
Doodads hidden by a switch, condition or season can **Fade**, **Pop**, **Rise**, **Dissolve** or **Crumble** in and out over a set number of frames, instead of blinking.

### Turning effects off during play
**Set Atmosphere Effect** switches character shadows, motion blur, water reflections or see-through on or off for the current playthrough.

---

## 9. Post-Processing, Screen Effects & Map Image Export

Click **Post FX** in the toolbar to open the builder. Changes show live on the map behind it, and every edit can be undone (a slider drag counts as one step).

### Effects
- **Bloom**: bright areas glow. *Threshold* sets how bright a pixel must be to glow.
- **Colour Grading**: exposure (in stops), contrast, saturation, temperature, tint, and split toning (one colour in the shadows, another in the highlights).
- **Vignette**: darkens, or tints, the screen edges.
- **Film Grain**: animated or still.
- **Chromatic Aberration**: colour fringing towards the edges.
- **Lens Distortion**: barrel or pincushion.
- **CRT**: scanlines, screen curvature, and an RGB mask.
- **Pixelate**
- **Sharpen**
- **Tilt-Shift**: blurs above and below a sharp band, for a miniature look.

### Looks and presets
- **Editing: Game-wide look** applies to every map and to battles. **Editing: This map** chooses what the current map uses: *The game-wide look*, *No effects*, or *Its own look*. A map's own look starts as a copy of the game-wide one.
- **Presets**: Cinematic, Golden Hour, Dreamy, Retro CRT, Noir, Horror, Underwater, Miniature and Pixel Art. Apply one, then adjust it.
- **Hold to Compare** shows the map without effects while the button is held. **Show while editing** turns effects off in the editor only.
- **Affect pictures**: off by default, so pictures and the timer stay crisp. Message windows and menus are never affected.
- **Quality**: *Low* skips tilt-shift and uses a lighter bloom blur. Players also get an **Effects Quality** option in the Options menu (High, Medium, Low, Off). It can lower the project's quality, never raise it, and it also scales the 3D view down (section 14).

### During play
- **Set Post-Processing Look** fades to a preset, to no effects, or back to the map's own look, over a number of frames. Use it for flashbacks, poison, night vision or boss rooms.
- **Play Screen Effect** plays **Impact Zoom**, **Shockwave**, **Chromatic Punch** or **Bloom Flash**, centred on the player, an event, or the screen. Try them in the builder with **Play**.
- **Set Atmosphere Effect → Post-Processing** turns all looks off for the current playthrough.

### Export Map Image
Saves the whole map as one PNG in the project's `screenshots` folder and opens it in Explorer.
- **Scale**: 100%, 50% or 25%. The largest image is 16384 pixels on a side; the editor suggests a smaller scale if needed.
- **Characters**: include the player and events.
- **Lighting & colour**: include lighting, bloom and colour grading. Effects shaped by the screen (vignette, CRT, lens, aberration, grain, tilt-shift) are always left out, because they would repeat across the stitched image.

---

## 10. Particles, VFX & Character Animation

### Particles on doodads
Select a doodad and open **Particles** in the Inspector.
- **Emitter presets**: Smoke, Embers, Fire, Fireflies, Falling Leaves, Mist, Dust Motes, Sparkles, Snow, Bubbles and Magic.
- **Amount** scales the preset's rate.
- **Draw** places the particles above characters, or below them for ground mist.
- **Offsets** move the emitter from the doodad's centre.
- **Attached VFX** loops any effect from the VFX builder on the doodad, for example a magic circle on an altar.

Fire and embers combine well with a Light set to *After dark* (section 8).

### Grass that reacts
**Interaction → Bend when walked through** makes grass, bushes and reeds lean away from whoever passes and spring back. Faster walkers push harder. **Drop leaves when disturbed** shakes out a few leaves each time someone enters.

### VFX builder
Click **VFX** in the toolbar.
- An effect is a list of layers:
  - **Particles**: start from a preset, then adjust rate, burst, life, speed, direction, spread, gravity, wind, size, opacity, colours, blend, shape, spawn area, flutter, twinkle and stretch (elongates particles along their motion, for flames and sparks).
  - **Sprite sheet**: any image split into columns and rows, with frames per second, loop, scale, rotation, blend, tint and opacity.
- Each layer can start later than the others and sit at its own offset.
- **Emits for** sets how long emitters run. One-shot effects end once their particles have faded.
- **Built-in effects**: Explosion, Heal, Level Up, Smoke Puff, Magic Burst and Water Splash. Duplicate one to change it.
- **Preview at Player** plays the effect on the map. **Replay on change** plays it after every edit.
- Effects are saved with the project and ship with the game.

**Play VFX** (plugin command) plays an effect by name:
- on the player, this event, an event by ID, a map tile, or the screen centre;
- optionally following the character;
- optionally waiting until it finishes.

### Character animation
- **Sheet names set the layout**, so no notetags are needed:
  - `Hero[f8]`: 8 frames per row (any number up to 64). `%(8)` also works.
  - `Slime[f6][d1]`: a single row facing right, mirrored when facing left.
  - `Knight[d8][f4]`: 8 rows. Down, left, right and up come first, then down-left, down-right, up-left and up-right.
  - Tagged sheets hold one character, like `$` sheets.
- **Idle and run cycles**: open the map panel's **Characters** section.
  - Add a character's sheet name. Sheets named `Name_idle` and `Name_run` beside it are found automatically, or **Add All Detected** finds every pair at once.
  - Set how long a character must stand still before idling, and the idle and run frame rates.
  - Run plays while dashing, and for events with move speed 5 or more.
  - Variant sheets are preloaded when the map loads, so switching never blinks.
- **Diagonal movement (8 directions)** lets the player move diagonally with two keys held, sliding along walls. 8-direction sheets then show the diagonal rows.
- **Play Character Action** plays a sheet on the player or an event, such as drinking, sleeping, farming or a sword swing.
  - Set the frames per second and how many times it plays (0 = until cleared).
  - **Hold the Last Frame** keeps it there for sitting or sleeping.
  - The event can **wait** until the action finishes.
  - **Clear Character Action** returns the character to normal.

---

## 11. Spatial Sound

### Event sounds in the world
With **Spatial Sound** on (map panel, *All maps*), every **Play SE** run by a map event, and every SE in a movement route, is heard from where the event stands:
- Quieter with distance: full volume within *Full volume within* tiles, silent past *Silent beyond*.
- Panned left or right by direction: fully to one side at *Full left/right at* tiles.
- Slightly varied in pitch and volume each time (*Pitch variation*, *Volume variation*), so repeated footsteps, doors and barks never sound identical.

Sounds from the party stay centred. Choose *Only events tagged &lt;spatial&gt;* to opt events in one by one, or tag an event `<no spatial>` to opt it out. Nothing needs setting up on each event.

**Play SE At** (plugin command) plays a sound effect from the player, this event, an event by ID, or a map tile.

### Ambient sounds on doodads and events
A doodad's **Sound** section attaches a sound:
- **Background sounds** (rivers, fire, wind, machinery) loop.
- **Sound effects** (birds, drips, bells) repeat about every *N* seconds, at slightly irregular intervals.

Each has a volume, a pitch and a **Heard within** radius in tiles. Volume and pan follow the player as they move, and a sound stops when it is out of range. Events can do the same with a tag in their note or a page comment: `<sound: River, 80, 8>` (name, volume, radius) or `<sound: se/Bird1, 60, 10, 5>` (a sound effect repeating every 5 seconds).

### Echo
**Sound (this map) → Echo** adds an echo to the map's sound effects and background sounds, for caves, halls and canyons. Set the delay, how many times it repeats, and how loud it is. Music, jingles and menu sounds never echo.

### Background sound by region
Also in **Sound (this map)**: give a region ID a background sound with a volume and a fade time. When the player walks into the region the sound fades in. Walking out brings back whatever the map was playing. Use it for a waterfall's roar, a windy cliff, or the hum of a shop.

---

## 12. Editor Tools: Layers, Symmetry, Biomes, Dressing, History, Command Palette

### Layers
Every map has a **Main** layer. Add layers in the map panel under **Layers** (for example Ground Decor, Props, Canopy, Lights, Markers).
- The layer selected with the round button receives new doodads.
- **Ed** shows or hides a layer in the editor only, to work underneath a canopy.
- **Lk** locks a layer so its doodads can't be clicked, box-selected or dragged.
- **Gm** shows or hides a layer in the game. Use it for markers and notes you only want while editing.
- Move doodads between layers with **Editor layer** in their inspector (Depth section). Deleting a layer moves its doodads to Main.
- Everything is undoable.

### Symmetry
**Symmetry** (toolbar) mirrors placements left/right, top/bottom, or four ways, around axes at the map's centre or at any tile line you type. Stamps, the scatter brush and the biome brush all place the mirrored copies, flipped for left/right mirroring, in the same undo step. The axes show on the map as purple lines.

### Biome brush
A biome is a weighted mix of props: for example a forest of 3 oaks : 1 pine : 2 bushes, each with its own scale range.
- Make biomes in the map panel under **Biomes**, or select an asset and use **Add to Biome**.
- Each biome sets its **spacing**, how many props each dab tries, **thin at edge** (sparser at the rim of the brush) and **patchiness** (natural clumps and clearings).
- Choose **Biome** in the toolbar, pick a biome and a radius, and drag on the map.
- Impassable tiles can be skipped. A stroke is one undo step.

### Dressing rules
Rules read the map's tiles and place props where they belong. Each rule has a place, a chance per tile, spacing, and a list of art:
- **Along water edges**: reeds, rocks, lily pads.
- **At the foot of walls and cliffs**: barrels, crates, rubble.
- **Beside a region**: paint your paths with a region, and flowers or stones line them.
- **Inside a region**.
- **On a terrain tag**.
- **Open ground**.

Make rules in the map panel under **Dressing Rules**, or with **Add to Dressing Rule** on an asset. **Dress Map** applies every rule in one undo step. **Re-roll** clears the dressing and tries again, and **Clear** removes it. Dressed props are ordinary doodads you can move or delete. Dressing never stacks on top of existing props, and skips events and blank tiles.

### Save history
**History** (toolbar) lists the timestamped backups made each time you save.
- Pick a doodads backup to see this map's doodads that are new, changed or deleted since then. They are outlined on the map in green, amber and red.
- Pick a map backup to see its events.
- **Restore** puts back a deleted doodad or event, undoes a change, or removes something new. Each restore is a single undo step. Event restores are saved with Save Changes.

### Command palette (Ctrl+K)
Type a few letters of anything and press Enter:
- tools, panels, Save, Undo and Redo, Toggle Grid
- symmetry modes, Post FX presets, Play VFX for any effect
- layers, Go to map, and any asset by file name

Letters can be skipped (`ptfx` finds *Open Post FX*). Use the arrow keys to move through the results.

### Animated thumbnails
Hover a character sheet in the drawer to watch it walk, and a door or chest sheet to see it open. An image sliced into equal frames (an animation strip) plays its frames too.

---

## 13. Visual Equipment & the Map Destination Marker

### Visual equipment
Characters can be built from layered parts, like a paper doll. Give the actor a bare body as its character image, or no image and a `<visual base: Body>` layer. Then add hair, eyes and clothes as base parts, and let equipment swap them out.

A part sheet has the same layout as a character sheet: 8 characters (or `$` for one), 3 frames, 4 directions, or the `[fN]` / `[dN]` tags from section 10. Draw only that part, in the same frames as the body, on a transparent background, and put the sheets in `img/characters`. Layers can also go over a finished character sprite, for capes, hats or auras.

**Parts are slots.** When an item names a part the body already has, it replaces it. For example, a shirt (`part clothes`) on the actor is replaced by armor tagged `part clothes`. If two items fill the same slot, the one equipped in the later slot wins. Pieces from one item can share a slot (a cape's back and its collar). Layers without a part name never replace anything.

Notetags go on weapons, armors, states, actors and classes:

| Tag | What it does |
| :--- | :--- |
| `<visual: Cape_Red, z -1>` | Draws the layer. A negative `z` is behind the body; 0 or more is in front. Higher numbers are drawn over lower ones. |
| `<visual: Armor_Iron, part clothes>` | Names the part (slot). Replaces whatever else fills that slot, and is used by hide and colour tags. |
| `<visual: Cape, z -1, up 2>` | `up` is the order while facing up: behind the body from the front, over the back from behind. Also useful for shields and quivers. |
| `<visual: Armor_{alias}, sv SV_Armor_{alias}>` | `sv` is the matching side-view battler sheet in `img/sv_actors`. Layers without one don't show in battle. |
| `<visual: Wings, index 3>` | Uses character 3 of an 8-character layer sheet, instead of the body's index. |
| `<visual base: Hair_Short, part hair, z 2>` | On actors and classes: a layer the actor always wears (hair, ears, a tail). |
| `<visual hide: hair, ears>` | Hides other parts while this item is worn, so hair doesn't poke through a helmet. |
| `<visual alias: Elf>` | On actors: fills `{alias}` in image names. One armor tag then shows the right art for each body type. |
| `<visual color: hair, switch 12, hue 120>` | Shifts a part's hue while a switch is on. `variable 7` instead reads the hue from a variable. `tint #ff8800` multiplies the colour. |

The layers show:
- on the player and followers, while they use the actor's own image (changing the player's graphic to something else hides the gear);
- on events tagged in their note or in a comment on the current page, with `<visual: ...>` tags or `<visual actor: 4>` to wear actor 4's look (pages without an image show nothing);
- on side-view battlers, using each layer's `sv` sheet and following every battle motion;
- in water reflections, in the save and load screens, and on the equip screen. The equip screen shows the actor wearing the item you're highlighting before you equip it.

Plugin commands change an actor's look without equipment:
- **Set Visual Alias**: switch body type or outfit set.
- **Add Visual Layer** and **Remove Visual Layer**: for a costume, a quest hat or a disguise.
- **Set Visual Colour**: for hair dye or team colours.

In the editor, open **Visual Equipment** in the map panel to turn each place on or off, and to try gear on. Pick an actor, tick items, and watch the preview walk in any direction. The **notetag builder** writes the tags for you.

Character shadows use the body's outline only; gear layers don't add to them.

### Destination marker
The marker MZ shows where the player clicks or taps to walk can be restyled under **Destination Marker** in the map panel:
- **Marker:** MZ's square, a rounded square, circle, ring, diamond, cross or arrow drawn in any colour. It can also be an image from `img/system` (`Marker[f4]` plays four frames side by side), a database animation that loops, a VFX effect, or hidden.
- **Look:** opacity, blend (add, normal, multiply, screen), size, pulse (MZ's, breathe, ripple or still), spin and bob.
- **Drawn:** above characters, like MZ, or on the ground beneath them.
- **Path dots:** dots along the way the player will walk, spaced every N tiles.

The **Set Destination Marker** plugin command changes any of these mid-game. The change is saved with the game, and blank fields keep their current value. **Back to the Project's Marker** undoes it.

---

## 14. 3D View

Any map can be shown in 3D. Open **3D View (this map)** in the map panel and tick **Show this map in 3D**.
- The map's tiles lie on a ground plane seen in perspective.
- Characters, their gear and standing doodads (trees, lamps, statues, buildings) stand up as billboards. They shrink with distance and are drawn far to near.
- Floor doodads (the **Below characters** layer), shadows, water reflections, the click-to-walk marker and the editor grid lie on the ground with the tiles.

Tileset tiles lie flat by default, including tree tops and roofs from the B–E tiles. **Tileset objects** (below) can stand them up, or you can place things as doodads for full control.

### Camera
| Setting | What it does |
| :--- | :--- |
| Camera tilt | Degrees down from level: 89 looks straight down, 30 looks across the land. |
| Camera turn | Which way the camera faces: 0 looks north, 90 looks east. |
| Field of view | Wider shows more and exaggerates depth. |
| Zoom | The size of things at the middle of the screen. |
| View distance | How much ground is drawn, in tiles. More costs more each frame. |
| Fog starts / ends | Distant ground and billboards fade out between these distances, in tiles from the camera's target. The ground's edge never shows. |
| Fog colour | Fade into a colour instead of into the sky. |
| Sky colour | The colour above the horizon. A map's parallax becomes the sky instead, and turns with the camera. |
| Beyond the map edge | The colour of ground past the map's edges. |
| Round world | **Planet**: the ground curves away all round, like a small world. **Rolling log**: it curves away only ahead, so things rise over the horizon as you walk toward them. |
| Curvature | How round the world is: 0 is flat, 10 is gentle, 100 is a tiny planet. Moving it off 0 turns a flat map into a planet; the radius below follows it. |
| World radius | How tight the curve is, in tiles. 0 sizes a planet so one lap is the map's width: on a looping world map, walking all the way round brings you back. |
| Things lean with the curve | Standing things lean outwards with the ground. Turn it off to keep them upright. |
| Q / W turn the camera 90° | Players can turn the view. The arrow keys follow the camera (up walks away from it), and characters show the side facing it. |
| Rippling water | Water tiles move with gentle waves that bend what shows through them (including water reflections) and catch the light. Shores stay dry. |
| Ripple strength / speed / sparkle | How far the waves bend the water, how fast they move, and how bright the glints are. Glints dim at night. |
| Wakes behind boats and waders | Boats, ships and anything moving through water leave spreading rings with a little foam. |
| Tileset objects (B–E tiles) | *Lie flat* (default). *Objects with ☆ tiles*: anything with a ☆ (above characters) tile, like a tree top, stands up with the tile under it (the trunk); side-by-side columns of the same height stand as one wide object. *Every B–E tile*: also lifts every other B–E tile (barrels, signs, fences) as one-tile billboards. The map itself isn't changed: in 2D, or with this off, the tiles lie on the ground as before. They use the standing doodads' height setting. Roof edges and wall tops drawn with ☆ tiles stand up too, so check buildings. |
| Standing doodads / Characters: height in 3D | Shrink or grow things that stand up, in the 3D view only (the 2D map is unchanged). Tileset-sized art is often tall next to a one-tile hero: a 3-tile lamp at 0.65 stands about twice the hero's height. They stay on their feet, and gear, effects and balloons go with their owner. Editor clicks and selection boxes match. |
| Sky, sun, moon and stars follow the time of day | With the day/night clock running (section 8), the sky fades from blue by day to an orange sunrise and sunset and a dark night with twinkling stars. The sun and moon cross the sky on the same path the shadows use, low ones show near the horizon, hills are shaded from wherever the light is, and water glints toward the sun or moon. Ambient darkness and lamps work as on flat maps. A map's parallax still replaces the sky. |
| 3D rain and snow | MZ's **Set Weather Effect** (rain, storm, snow, power 1–9, with fades) falls through the 3D world around the camera: rain and storms slant with the wind and splash on the ground (raised terrain too), some drops ripple water, and snow drifts down. Trees, characters and hills in front hide the drops behind them. The screen dims with the weather like MZ's own. Off: MZ's flat weather is used instead. |
| Weather density | More or fewer drops and flakes than MZ's power alone gives. |
| Smooth distant ground | Blends distant pixels instead of keeping them crisp. |

On a round world, things past the horizon are hidden, and clicks, fog and editor boxes follow the curve.

### Quality on slower machines
When any map uses the 3D view, players get the **Effects Quality** option in the Options menu, the same one post-processing uses. It lowers the 3D detail you set, and never raises it:

| Effects Quality | 3D view |
| :--- | :--- |
| High | As you set it. |
| Medium | View distance at most 32 tiles, 60% of the weather, hills split 2 × 2 per tile instead of 4 × 4. |
| Low (and Off) | View distance at most 24 tiles, a third of the weather, no wakes, one piece per hill tile. |

When the view distance is shortened, the fog is pulled in by the same amount, so the ground's edge stays hidden. A map already set to a shorter view distance keeps its own. Off also turns post-processing off; the 3D view itself stays on. The editor always shows a map as you set it, whatever the option says.

### Terrain height
Mountains, hills and cliffs can rise out of the ground. Open **Terrain Height (this map)** in the map panel and tick **Raise the ground**. Heights are in tiles and come from four places. The higher one in this list wins:
1. **The Terrain brush** (toolbar). Raise, lower, flatten (to where the stroke started), set an exact height, or erase back to automatic. It has a strength and a radius, and each stroke is one undo step. Painting turns Terrain Height on for the map.
2. **Regions:** for example, region 5 is 2 tiles high.
3. **Terrain tags (1–7):** for example, tag 3 is 1 tile high.
4. **Automatic,** on world tilesets: mountain tiles (impassable ground) rise to the **Mountain height** (1 tile by default), and forests (where airships can't land) to the **Forest height**.

**Shape:**
- **Smooth** is for hills and mountains: the ground is rounded, so a range rises in gentle slopes to a broad top, and a lone mountain is a low mound.
- **Stepped** is for cliffs and plateaus: flat tops with shaded cliff walls.

**How things stand on it:**
- Characters and the click-to-walk marker stand on the raised ground. On smooth ground they rest on the highest point under their base, so a bump beside their feet doesn't swallow them.
- **Doodads stand on level ground only.** The stamp, brushes, paths, dressing and dragging all refuse mountains and slopes; level raised ground you made (a plateau) is fine. Doodads already on a mountain (placed before terrain was turned on) show a red box in the editor so you can move them.
- Hills hide whatever is behind them.
- Clicking finds the slope you clicked.
- Slopes are shaded by a light from the upper left, and fog fades distant hills.
- **Steep steps block walking:** characters can't climb or drop more than the **Highest step you can walk**.

Terrain height shows only in the 3D view. It works on round worlds too.

### What works in 3D
- **Lighting:** ambient darkness lights the ground, and lights pool around each lamp's base. Characters and doodads are lit by the lights near them.
- **Sun and doodad shadows** lie on the ground.
- **Particles, VFX, balloons and animations** stand with their character or doodad. Effekseer animations (MZ's own format) play where their target is drawn and shrink with distance like it; MV-style animations do too.
- **Post-processing and day/night tint** apply to the whole view.
- **Touch and mouse:** clicking the ground walks there.
- **Editor:**
  - Clicks go through to the ground.
  - Clicking a tree or lamp picks the nearest one drawn under the mouse.
  - The selection shows as a yellow box.
  - Dragging moves the doodad's base along the ground.
  - The grid, paths and guides are drawn on the ground.

### Plugin commands
- **Set Camera (3D):** tilt, turn, zoom, field of view, round-world shape and curvature, absolute or added to the current values, eased over a number of frames, with optional wait. Use it for cutscenes: ease a flat map into a planet to show the whole world, or set the shape to Flat to ease the curve back out.
- **Reset Camera (3D):** returns to the map's own camera.
- **Set 3D View:** turns 3D on or off for the current map, or back to the map's setting.

Camera changes last until the party leaves the map. Changing the 3D View settings in the editor clears them, so the preview always shows the map's own camera.

---

## 15. Genuine RPG Maker MZ Event Creation & Templates

When an asset is dropped with **Place As Event** (or prompted via the interactive placement dialog), the workspace creates a genuine RPG Maker MZ event stored directly inside the active `MapXXX.json` file.

### 20 Built-In Event Templates
Each template comes pre-configured with authentic MZ event pages, conditions, triggers, and event command sequences:
1. **NPC**: Action-button dialogue with face/character graphic and random movement options.
2. **Door**: Animated opening door with sound effect, passable transition, and transfer trigger.
3. **Transfer Door**: Seamless teleport transition to target map coordinates with fadeout.
4. **Chest**: Self-switch opening treasure chest granting gold or items with ME fanfare.
5. **Loot Drop**: Ground item pickup that disappears after player interaction.
6. **Sign / Message**: Readable inspection notice or lore plaque.
7. **Switch / Lever**: Toggleable switch controlling Game Switches (`$gameSwitches`).
8. **Save Point**: Interactive crystal/shrine triggering the game Save Screen.
9. **Shopkeeper**: NPC triggering the standard RPG Maker Shop processing window.
10. **Enemy Encounter**: Touch or action-triggered battle processing event with escape branches.
11. **Harvestable Resource**: Gathering node (plants, ores) that depletes and respawns.
12. **Breakable Prop**: Destructible obstacle requiring player action or tool.
13. **Pushable Block**: Sokoban-style pushable puzzle boulder.
14. **Light Source**: Decorative torch or brazier with flickering animation.
15. **Animated Prop**: Multi-frame looped ambient object (water wheel, machinery).
16. **Teleporter / Portal**: Step-on transfer pad with flash and sound effect.
17. **Ladder / Stairs**: Directional movement helper with passability overrides.
18. **Vehicle Spawner**: Spawns boat, ship, or airship at designated coordinates.
19. **Sound Trigger**: Plays localized environmental audio or ME upon player step.
20. **Decoration Event**: Lightweight event container for complex custom logic.

### Map Event Inspection & Custom Template Saving
- **Select Map Event**: Clicking any tile containing an MZ Event selects it and populates the Inspector.
- **Inspect & Edit**: Inspect and edit event Name, ID, Tile X/Y coordinates, Trigger type (Action Button, Player Touch, Event Touch, Autorun, Parallel), and Priority.
- **Save Event as Template**: Click **💾 Save as Event Template** in the Inspector (or right-click the event) to capture all pages, movement routes, script calls, and conditions into `data/DocsDoodadsEventTemplates.json` for reuse across any map in your project.
- **Duplicate & Delete**: Press **Duplicate Event** to duplicate with automatic safe ID allocation and tile offset, or **Delete Event** (with full undo/redo).

---

## 16. Direct SAT Physical Collision System

Doodads do not require invisible blocker events to obstruct the player. The workspace features direct Separating Axis Theorem (SAT) runtime physics:

- **Collision Presets**:
  - `None`: Completely passable (decorative flowers, grass, ceiling lamps).
  - `Full`: Blocks the entire doodad bounding box.
  - `Bottom Half`: Blocks the bottom 50% (ideal for tall statues, furniture, trees).
  - `Bottom Third`: Blocks the bottom 33% (ideal for trees, pillars).
  - `Trunk`: Narrow vertical trunk box at the base.
  - `Thin Wall`: Horizontal or vertical barrier.
  - `Wide Wall`: Thick horizontal barrier.
  - `Custom`: Interactive relative box.
- **Trace from Art**: Fits a custom collision box to the solid base of the image (a tree's trunk, a wall's foot), ignoring soft shadows. It works on placed doodads (one or many) and on drawer assets, so every new placement starts with it.
- **Visual Collision Editor**: When `Custom` is chosen, the Inspector displays a live 64x64 interactive canvas preview. Adjust `Rel X`, `Rel Y`, `Rel W`, and `Rel H` (0.0 to 1.0) to fit collision precisely to your art regardless of scaling.

---

## 17. Audio Drawer Integration

Click the **Audio** tab in the Drawer to browse BGM, BGS, ME, and SE files:
- **Click Preview**: Click any audio card to play live in-editor. An animated blue waveform indicator shows playback.
- **Stop**: Click again or click Stop to halt audio.
- **Drop on Map**: Dragging an audio track onto empty map tiles automatically creates a sound-trigger event, detecting whether it is BGM (`241`), BGS (`245`), ME (`249`), or SE (`250`).
- **Drop on Existing Event**: Dragging an audio track directly onto an existing event prompts to append the play sound command sequence directly into page 0 with full undo/redo!

---

## 18. Windows Explorer Native Drag-and-Drop Ingestion

Drag images or audio files directly from Windows Explorer (Desktop, Downloads, asset folders) and drop them anywhere onto the game window:
- **Recursive Directory Support**: Dragging an entire folder recursively imports all nested PNG, JPG, WEBP, and audio files.
- **Import Review Dialog**: Before copying begins, choose automatic routing or one fixed project folder for the whole batch.
- **Automatic Routing**:
  - Files matching `character` or starting with `$` $\rightarrow$ `img/characters/`
  - Files matching `face` $\rightarrow$ `img/faces/`
  - Files matching `tile` $\rightarrow$ `img/tilesets/`
  - Files matching `parall` $\rightarrow$ `img/parallaxes/`
  - Files matching `pic` $\rightarrow$ `img/pictures/`
  - Audio matching `bgm`/`bgs`/`me` $\rightarrow$ `audio/bgm/`, `audio/bgs/`, `audio/me/`
  - All other props $\rightarrow$ `img/doodads/`
- **Apply-to-All Collision Policy**: Choose **Keep Both**, **Skip**, **Overwrite**, or **Cancel on Collision** for the batch. Keep Both is the safe default and produces names such as `filename_1.ext`; byte-identical files are reported as duplicates instead of copied again.
- **Transactional Copy & Cancel**: Imports show per-file progress and may be cancelled. If any copy fails or the batch is cancelled, files already copied by that batch are rolled back; explicitly overwritten files are restored.
- **Optional Slicer Launch**: Enable the dialog checkbox to open the first imported image in the sprite slicer after indexing.
- **Auto Re-indexing**: The workspace refreshes immediately without requiring a game restart.

---

## 19. Maps: Switching, Cross-Map Editing, Neighbours & World View

The **Maps** section of the map panel (shown when nothing is selected):
- **Go to Map** moves the player there with the workspace still open. Undo history ends at a map change, because its steps belong to the old map. Unsaved event edits stay with their own map, and **Save** writes every map you changed to its own file.
- **Copy / Paste across maps**: Ctrl+C writes the clipboard to disk, so it survives map changes and restarts. Pasting on another map keeps the original position; pasting on the same map offsets the copy.
- **Copy to Map / Move to Map** (Inspector): send the selection to any map in one undoable step.
- **Neighbouring maps**: link maps north/south/east/west. **Mirror Edge Doodads** copies doodads hanging over an edge onto the neighbouring map as locked mirrors, so a tree on a border shows on both sides. Running it again replaces the old mirrors.
- **World View** draws the map and its linked neighbours to scale with their doodads; edge-crossing doodads are orange. Click a map to go there.
- Looping (world) maps wrap doodads, lights, outlines and clicks with the camera, the same way MZ's characters wrap.

---

## 20. Asset Management: Where Used, Rename/Move, Duplicates, Live Reload, Packing

- **Where Used** (asset Inspector) lists every map event, page, command, database entry (actors, enemies, tilesets, system, common events, troops), doodad, and prefab that uses the file.
- **Rename/Move** renames or moves the file and updates every reference in one transaction, backing up changed files first. RPG Maker refers to most files by name inside a fixed folder, so those can be renamed but not moved to another folder; doodad images can move anywhere under `img/`. Atlas metadata and the other audio format (`.ogg`/`.m4a`) move with the file. Save first; if the project is open in RPG Maker MZ, reload it there afterwards.
- **Asset Tools → Find Unused Files** lists files nothing references (engine system files are never listed). Plugins and scripts can also load files by name, so check before deleting.
- **Asset Tools → Find Duplicates** finds byte-identical files and near-identical images (resized or re-saved). **More Like This** shows the images that look most like the selected one. Image fingerprints are computed once and cached in the library.
- **Live Reload**: while the workspace is open, saving an image or sound in another program updates the drawer, thumbnails, and placed doodads within a moment.
- **Pack Map Art** (map panel → Performance): copies the art the map's doodads use into a few sheets in `img/doodads/_packed/` so deployed games load fewer textures. Playtests keep using the original files unless you tick **Use packed art in this playtest**. The panel warns when a source image has changed since packing; pack again before deploying.

---

## 21. Workspace Layouts & Custom Layout Persistence

Switch workspace layout presets in the top toolbar:
- **Mapping Preset**: Wide map viewport, compact drawer, full inspector.
- **Events Preset**: Focus on event templates and placement defaults.
- **Characters Preset**: Optimized for character sheet decomposition and NPC generation.
- **Tiles Preset**: Visual grid layout for decorative tiles.
- **Compact Preset**: Minimal UI footprint for small laptop screens.
- **Draggable Splitters**: Click and drag the vertical divider between the Drawer and Map or Inspector and Map to resize panels in real time (200px to 800px).
- **Save Custom Layouts**: Click **+ Layout** in the toolbar to save your current panel dimensions and thumbnail zoom as a named preset in `data/DocsDoodadsLayouts.json`.

---

## 22. Project Safety, Conflict Detection & Crash Recovery

Editing real map data in playtest mode requires rigorous file protection:

1. **Pre-Save Conflict Detection**: Before writing to `data/MapXXX.json` or `data/DocsDoodads.json`, the plugin checks whether the file was modified externally in RPG Maker MZ. If an external change occurred, it prompts you to review or reload instead of blindly overwriting.
2. **Timestamped Backups**: Every explicit save automatically writes a backup copy to:
   ```text
   data/docs_doodads_cache/backups/<filename>.<timestamp>.bak
   ```
   Retains the last 10 backups by default (configurable).
3. **Atomic Writes**: Data is serialized to `<filename>.tmp` and validated before performing an atomic filesystem rename, eliminating half-written corrupt files.
4. **Corrupt JSON Auto-Recovery**: If any project file is corrupted (e.g., due to an abrupt power cut), `DocsDoodads.FS` automatically identifies and restores the latest valid backup snapshot.
5. **Autosave Crash Recovery**: A background heartbeat writes current session staging data to `data/DocsDoodadsRecovery.json` every 60 seconds. If playtest is closed unexpectedly, the workspace offers to resume your unsaved changes upon restart.
6. **Transactional Multi-File Save**: Map, doodad, and asset-library changes are staged and validated together. If a later file cannot commit, earlier files are restored and the workspace remains dirty so the save can be retried.
7. **Manual Backup Restore**: Open **Diagnostics → Restore Project Backup…**, select the current map, doodad data, or asset library, and choose a snapshot. The backup JSON and path are validated, and the current file receives another timestamped safety backup before restoration.

---

## 23. Complete Keyboard Shortcuts Cheat Sheet

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| **F10** (or `editKey`) | Open / Close Asset Workspace | Global (Playtest) |
| **Ctrl + Z** | Undo last action (300-level command stack) | Workspace |
| **Ctrl + Y** | Redo last undone action | Workspace |
| **Ctrl + S** | Explicit Save (Atomic save with backups & conflict check) | Workspace |
| **Ctrl + D** | Duplicate selected doodad(s) (+16px offset) | Workspace |
| **Ctrl + C** | Copy selected doodad(s) to clipboard | Workspace |
| **Ctrl + V** | Paste copied doodad(s) | Workspace |
| **Ctrl + K** | Command palette: tools, panels, maps, assets, looks | Workspace |
| **Delete** | Delete selected doodad(s) | Workspace |
| **Arrow Keys** | Nudge selected doodad(s) by 1 pixel | Workspace |
| **Shift + Arrow Keys**| Nudge selected doodad(s) by 16 pixels | Workspace |
| **Shift + Click / Drag**| Marquee multi-select or toggle doodad selection | Map Canvas |
| **Alt + Click** | Eyedropper: Pick placed doodad to select in Drawer | Map Canvas |
| **Alt (Hold on Drag)**| Free pixel placement (bypasses 48px tile snap) | Map Canvas |
| **G** | Toggle 48px Tile Grid visual overlay | Workspace |
| **H** | Toggle Inspector panel visibility | Workspace |
| **F** | Focus Drawer search input | Workspace |
| **Escape** | Cancel active tool (Stamp/Brush/Path/Eyedropper) / Deselect / Close Modals | Workspace |
| **Enter** / **Double-click** | Place props along the path being drawn | Path tool |
| **Backspace** | Remove the last path point | Path tool |
| **Drag a doodad** | Move with smart guides (**Alt**: free, **Shift**: tile grid) | Map Canvas |
| **Mouse Wheel** | Scroll Asset Drawer / Pan Slicer | Drawer / Slicer |
| **Ctrl + Wheel** | Zoom Slicer Modal canvas (100% to 1600%) | Slicer Modal |

---

## 24. Troubleshooting & FAQ

### Q: Why isn't the Asset Workspace opening when I press F10?
- Verify that playtest is running under NW.js (not launched from an external standard browser without Node filesystem access).
- Verify in **Plugin Manager** that `Docs-Doodads` is turned **ON** and `Editor Enabled` is set to `true`.
- Check if another plugin intercepts `F10`; you can change the `editKey` parameter to `F6`, `F7`, `F8`, or `F9`.

### Q: Can I safely deploy my game to players?
- **Yes.** In deployed builds (`test: false`), all editor UI, DOM elements, filesystem listeners, and slicer modals are stripped from execution. Placed doodads, effects, lights and collision render normally. If you packed map art, pack again after changing source images; a pack built before a change keeps the old art.

### Q: Why do my house interiors get dark at night?
- The day/night clock applies to every map that doesn't set its own darkness. In the map panel, set **Day and night on this map** to *Ignore (indoors)* for interiors, or give the map its own ambient darkness.

### Q: Post-processing makes my game slow on older PCs or phones.
- Set **Quality** to *Low* in the Post FX builder (it skips tilt-shift and lightens bloom), use fewer effects, or let players pick a lower **Effects Quality** in Options.

### Q: The 3D view is slow on older PCs or phones.
- Lower **View distance** for the map, or let players pick a lower **Effects Quality** in Options: Medium and Low draw less ground, fewer weather drops and simpler hills, and Low drops wakes (see *Quality on slower machines* in section 14).

### Q: My character sheet with more frames shows the wrong part of the image.
- Put the layout in the file name: `[f8]` for frames per row and `[d1]`/`[d8]` for rows. A tagged sheet holds one character and is split evenly, so every frame must be the same size.

### Q: Will updating my maps in the RPG Maker MZ editor erase my doodads?
- **No.** Doodads are stored in `data/DocsDoodads.json` keyed by map ID (`$gameMap.mapId()`). They persist independently of map geometry changes.
- For events created through the workspace, remember to press **Ctrl + S** inside the workspace to commit them to `MapXXX.json`. Then reload the map in the RPG Maker MZ editor to view the new event nodes.

---

## 25. Credits & Licensing

- **Origins**: Doc's Doodads began as an upgrade of QJ-Doodads by Qiu Jiu (MIT License) and has grown into its own tool.
