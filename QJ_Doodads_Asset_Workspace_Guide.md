# QJ Doodads Asset Workspace — User Guide & Technical Reference

**Plugin:** `QJ-Doodads.js` (v2.0)  
**Compatibility:** RPG Maker MZ (Primary) & RPG Maker MV  
**License:** MIT License (Copyright (c) Qiu Jiu / Upgrades by Antigravity)  

---

## 1. Overview & Vision

**QJ Doodads Asset Workspace** transforms the traditional RPG Maker in-game doodad editor into a high-performance visual asset management, placement, slicing, and event-authoring workspace. 

It eliminates the friction of traditional sprite-sheet pickers and multi-click file dialogue boxes by providing:
- **Instant visual browsing** with virtualized cards capable of smoothly scrolling 10,000+ assets.
- **Intelligent sprite sheet detection & slicing** (standard MZ formats, sidecar JSON atlas files, and automatic alpha-threshold visual detection).
- **Direct drag-and-drop placement** onto the live game map with real-time ghost previews.
- **Genuine RPG Maker MZ event creation** with 20 pre-built game event templates (NPCs, chests, doors, switches, teleporters, encounters) plus custom template saving.
- **Direct SAT physical collision** with interactive relative collision editing.
- **Modern editor operations**: Marquee selection box, Shift+Click multi-select, alignment, distribution, grouping, locking, hiding, Z-order layering, copy/paste, and 300-level command undo/redo.
- **Windows Explorer native file/folder drop import** with intelligent categorization and collision renaming.
- **Enterprise-grade project safety**: session snapshots, pre-save external conflict protection, timestamped backups in `data/qj_asset_cache/backups/`, atomic writes, and crash autosave recovery.

---

## 2. Quick Installation & Setup

1. Copy [`QJ-Doodads.js`](file:///C:/Users/Doc/Desktop/doodads/QJ-Doodads.js) into your RPG Maker project directory:
   ```text
   js/plugins/QJ-Doodads.js
   ```
2. Open RPG Maker MZ (or MV), go to **Plugin Manager**, and activate **`QJ-Doodads`**.
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
| **Doodads Data File Name** (`dataFileName`) | Text | `DoodadsQJ` | JSON filename in `data/` (without `.json`). |
| **Texture Scaling Mode** (`doodadScaleMode`) | Boolean | `true` | `true` for Smooth / Linear, `false` for Pixelated / Nearest. |
| **Default Workspace Layout** (`defaultLayout`) | Select | `Mapping` | Startup layout preset (`Mapping`, `Events`, `Characters`, `Tiles`, `Compact`). |
| **Default Thumbnail Size** (`defaultThumbnailSize`) | Number | `96` | Initial card size in pixels (32 to 256). |
| **Asset Cache Enabled** (`cacheEnabled`) | Boolean | `true` | Caches metadata & disk thumbnails for instant opening. |
| **Background Work Budget** (`backgroundWorkBudget`) | Number | `4` | Milliseconds per frame dedicated to background scanning. |
| **Autosave Interval** (`autosaveRecoveryInterval`) | Number | `60` | Heartbeat interval (seconds) for crash recovery snapshots. |
| **Backup Retention Count** (`backupRetentionCount`) | Number | `10` | Number of timestamped backups retained in `data/qj_asset_cache/backups/`. |
| **Enable MV Compatibility** (`enableMVCompatibility`) | Boolean | `true` | Enables compatibility layer when running under RPG Maker MV. |
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
- `-tree`: Negative search; excludes any asset matching "tree".
- **Combined Example**: `prop_123 tag:tree -dead category:Doodads collection:"Castle Set"`

---

## 5. Intelligent Slicing Engine & Slicer Modal

The workspace features a multi-tiered slicing engine that segments composite sheets into individual reusable assets:

1. **Known MZ Format Detector**: Automatically detects `$Single` character sheets (3x4), standard 8-character sheets (12x8), Face sheets (4x2), IconSet grids (32x32), and Sideview Battlers without manual configuration.
2. **Sidecar Atlas Parsers**: Reads Aseprite JSON, TexturePacker JSON, and Sprite Atlas Forge (`.saf.json`) metadata when placed alongside the image.
3. **Canvas Visual Auto-Slicer**: Uses Otsu adaptive alpha thresholding, 4-connected component labeling, border flood background removal, morphological noise cleanup, and gutter splitting to isolate irregular sprites.
4. **Interactive Slicer Modal**:
   - Double-click any asset or click **Auto Slice** to open the 1600% zoomable slicer editor.
   - **8-Handle Drag & Resize**: Adjust region boundaries with sub-pixel precision.
   - **Smart Snapping**: Automatically snaps region edges to pixel gutters and nearby regions.
   - **Tools**: Split, Merge, Align, Distribute, Rename, and Set Pivots.
   - **Persistence**: Region definitions are saved non-destructively in `data/QJAssetLibrary.json`. The original source PNG is never modified.
   - **Export**: Export sliced regions as standalone PNGs or animation strips directly to `img/doodads/` with one click.

---

## 6. Drag-and-Drop Placement & Modern Map Editing

### Placing Assets
- **Drag & Drop**: Drag any asset or slice from the Drawer directly onto the live game map. A translucent **Ghost Follower** tracks your mouse with exact dimensions.
- **Snapping**: Snaps to 48px tile coordinates by default. **Hold Alt** while dragging or dropping for free pixel-perfect placement.
- **Stamp Mode**: Click the **Stamp** tool in the toolbar to click-to-place repeated props (grass, barrels, trees) across the map. Press **Escape** or right-click to exit.
- **Scatter Brush & Settings**: Click the **Scatter Brush** tool to paint scattered props. A floating settings popover lets you tune **Radius** (20px to 250px), **Density** (1 to 10 props), **Scale Jitter** (0% to 50%), and **Rotation Jitter** (0° to 180°) in real time.
- **Eyedropper**: Hold **Alt and click** any placed doodad or MZ event on the map (or click the **Eyedropper** toolbar button) to automatically find and select that asset or event template in the Drawer.

### Selection, Multi-Selection & Right-Click Context Menu
- **Click**: Select a placed doodad or genuine MZ Event on the map.
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

## 7. Genuine RPG Maker MZ Event Creation & Templates

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
- **Save Event as Template**: Click **💾 Save as Event Template** in the Inspector (or right-click the event) to capture all pages, movement routes, script calls, and conditions into `data/QJEventTemplates.json` for reuse across any map in your project.
- **Duplicate & Delete**: Press **Duplicate Event** to duplicate with automatic safe ID allocation and tile offset, or **Delete Event** (with full undo/redo).

---

## 8. Direct SAT Physical Collision System

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
- **Visual Collision Editor**: When `Custom` is chosen, the Inspector displays a live 64x64 interactive canvas preview. Adjust `Rel X`, `Rel Y`, `Rel W`, and `Rel H` (0.0 to 1.0) to fit collision precisely to your art regardless of scaling.

---

## 9. Audio Drawer Integration

Click the **Audio** tab in the Drawer to browse BGM, BGS, ME, and SE files:
- **Click Preview**: Click any audio card to play live in-editor. An animated blue waveform indicator shows playback.
- **Stop**: Click again or click Stop to halt audio.
- **Drop on Map**: Dragging an audio track onto empty map tiles automatically creates a sound-trigger event, detecting whether it is BGM (`241`), BGS (`245`), ME (`249`), or SE (`250`).
- **Drop on Existing Event**: Dragging an audio track directly onto an existing event prompts to append the play sound command sequence directly into page 0 with full undo/redo!

---

## 10. Windows Explorer Native Drag-and-Drop Ingestion

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

## 11. Workspace Layouts & Custom Layout Persistence

Switch workspace layout presets in the top toolbar:
- **Mapping Preset**: Wide map viewport, compact drawer, full inspector.
- **Events Preset**: Focus on event templates and placement defaults.
- **Characters Preset**: Optimized for character sheet decomposition and NPC generation.
- **Tiles Preset**: Visual grid layout for decorative tiles.
- **Compact Preset**: Minimal UI footprint for small laptop screens.
- **Draggable Splitters**: Click and drag the vertical divider between the Drawer and Map or Inspector and Map to resize panels in real time (200px to 800px).
- **Save Custom Layouts**: Click **+ Layout** in the toolbar to save your current panel dimensions and thumbnail zoom as a named preset in `data/QJWorkspaceLayouts.json`.

---

## 12. Project Safety, Conflict Detection & Crash Recovery

Editing real map data in playtest mode requires rigorous file protection:

1. **Pre-Save Conflict Detection**: Before writing to `data/MapXXX.json` or `data/DoodadsQJ.json`, the plugin checks whether the file was modified externally in RPG Maker MZ. If an external change occurred, it prompts you to review or reload instead of blindly overwriting.
2. **Timestamped Backups**: Every explicit save automatically writes a backup copy to:
   ```text
   data/qj_asset_cache/backups/<filename>.<timestamp>.bak
   ```
   Retains the last 10 backups by default (configurable).
3. **Atomic Writes**: Data is serialized to `<filename>.tmp` and validated before performing an atomic filesystem rename, eliminating half-written corrupt files.
4. **Corrupt JSON Auto-Recovery**: If any project file is corrupted (e.g., due to an abrupt power cut), `QJ.DD.FS` automatically identifies and restores the latest valid backup snapshot.
5. **Autosave Crash Recovery**: A background heartbeat writes current session staging data to `data/QJAssetWorkspaceRecovery.json` every 60 seconds. If playtest is closed unexpectedly, the workspace offers to resume your unsaved changes upon restart.
6. **Transactional Multi-File Save**: Map, doodad, and asset-library changes are staged and validated together. If a later file cannot commit, earlier files are restored and the workspace remains dirty so the save can be retried.
7. **Manual Backup Restore**: Open **Diagnostics → Restore Project Backup…**, select the current map, doodad data, or asset library, and choose a snapshot. The backup JSON and path are validated, and the current file receives another timestamped safety backup before restoration.

---

## 13. Complete Keyboard Shortcuts Cheat Sheet

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| **F10** (or `editKey`) | Open / Close Asset Workspace | Global (Playtest) |
| **Ctrl + Z** | Undo last action (300-level command stack) | Workspace |
| **Ctrl + Y** | Redo last undone action | Workspace |
| **Ctrl + S** | Explicit Save (Atomic save with backups & conflict check) | Workspace |
| **Ctrl + D** | Duplicate selected doodad(s) (+16px offset) | Workspace |
| **Ctrl + C** | Copy selected doodad(s) to clipboard | Workspace |
| **Ctrl + V** | Paste copied doodad(s) | Workspace |
| **Delete** | Delete selected doodad(s) | Workspace |
| **Arrow Keys** | Nudge selected doodad(s) by 1 pixel | Workspace |
| **Shift + Arrow Keys**| Nudge selected doodad(s) by 16 pixels | Workspace |
| **Shift + Click / Drag**| Marquee multi-select or toggle doodad selection | Map Canvas |
| **Alt + Click** | Eyedropper: Pick placed doodad to select in Drawer | Map Canvas |
| **Alt (Hold on Drag)**| Free pixel placement (bypasses 48px tile snap) | Map Canvas |
| **G** | Toggle 48px Tile Grid visual overlay | Workspace |
| **H** | Toggle Inspector panel visibility | Workspace |
| **F** | Focus Drawer search input | Workspace |
| **Escape** | Cancel active tool (Stamp/Brush/Eyedropper) / Deselect / Close Modals | Workspace |
| **Mouse Wheel** | Scroll Asset Drawer / Pan Slicer | Drawer / Slicer |
| **Ctrl + Wheel** | Zoom Slicer Modal canvas (100% to 1600%) | Slicer Modal |

---

## 14. Troubleshooting & FAQ

### Q: Why isn't the Asset Workspace opening when I press F10?
- Verify that playtest is running under NW.js (not launched from an external standard browser without Node filesystem access).
- Verify in **Plugin Manager** that `QJ-Doodads` is turned **ON** and `Editor Enabled` is set to `true`.
- Check if another plugin intercepts `F10`; you can change the `editKey` parameter to `F6`, `F7`, `F8`, or `F9`.

### Q: Can I safely deploy my game to players?
- **Yes.** In deployed builds (`test: false`), all editor UI, DOM elements, filesystem listeners, and slicer modals are stripped from execution. Placed doodads and collision render seamlessly with zero memory overhead.

### Q: Will updating my maps in the RPG Maker MZ editor erase my doodads?
- **No.** Doodads are stored in `data/DoodadsQJ.json` keyed by map ID (`$gameMap.mapId()`). They persist independently of map geometry changes.
- For events created through the workspace, remember to press **Ctrl + S** inside the workspace to commit them to `MapXXX.json`. Then reload the map in the RPG Maker MZ editor to view the new event nodes.

---

## 15. Credits & Licensing

- **Core Plugin**: QJ-Doodads by Qiu Jiu (MIT License).
- **Workspace Architecture & Enhancements**: Built by Antigravity (MIT License).
- **Slicing Algorithms**: Inspired by and adapted from Sprite Atlas Forge (MIT License).
