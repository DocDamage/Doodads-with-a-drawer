# Doc's Doodads — User Guide & Technical Reference

**Plugin:** `Docs-Doodads.js` (v2.0)  
**Compatibility:** RPG Maker MZ. MV is untested since 2.0 and unsupported (see the README).  
**License:** MIT License. Based on QJ-Doodads by Qiu Jiu.  
**Quick reference:** every notetag, image name tag and plugin command is listed in the [Cheat Sheet](CHEAT_SHEET.md).  

---

## 1. Overview & Vision

**Doc's Doodads** transforms the traditional RPG Maker in-game doodad editor into a high-performance visual asset management, placement, slicing, and event-authoring workspace. 

It eliminates the friction of traditional sprite-sheet pickers and multi-click file dialogue boxes by providing:
- **A friendly, game-like editor**: big named tools in one top bar, an Item Bag to pick from, a Details panel for whatever is picked, a hint bubble that says what to do next, and a welcome card the first time.
- **Instant visual browsing** with virtualized cards capable of smoothly scrolling 10,000+ assets.
- **Intelligent sprite sheet detection & slicing** (standard MZ formats, sidecar JSON atlas files, and automatic alpha-threshold visual detection).
- **Direct drag-and-drop placement** onto the live game map with real-time ghost previews.
- **Genuine RPG Maker MZ event creation** with 20 pre-built game event templates (NPCs, chests, doors, switches, teleporters, encounters) plus custom template saving.
- **Direct physical collision** with interactive relative collision editing.
- **Modern editor operations**: Marquee selection box, Shift+Click multi-select, alignment, distribution, grouping, locking, hiding, Z-order layering, copy/paste, and 300-level command undo/redo.
- **Windows Explorer native file/folder drop import** with intelligent categorization and collision renaming.
- **A living world**: lights, day and night, shadows, weather, post-processing, particles and effects, spatial sound with ambience and footsteps, visual equipment, traversal (jump, glide, swim, dive, fly, climb, ice) and a full 3D view with terrain, walls, models and a video sky.
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
4. Press **F10** (or your configured `editKey`) while on any map to open the editor. The first time, a welcome card shows the first steps.

> [!NOTE]
> All editor UI, indexing, and authoring tools are strictly isolated to Playtest mode (`Utils.isOptionValid("test")`), and every file write goes through a guard that refuses outside a playtest. In production builds, the plugin operates purely as a lightweight doodad rendering and collision engine with zero editor memory overhead.

---

## 3. Plugin Parameters Reference

Configure these options directly inside RPG Maker's Plugin Manager:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Editor Toggle Key** (`editKey`) | Combo | `F10` | Key to open/close the workspace: any key (`F6`, `` ` ``, `E`, or a KeyboardEvent code such as `Numpad0`), or a chord such as `Ctrl+F10` or `Ctrl+Shift+E`. A key that types, like a letter, does nothing while a text field has focus. |
| **Editor Enabled** (`editorMode`) | Boolean | `true` | Enables in-game asset workspace during playtest. |
| **Doodads Data File Name** (`dataFileName`) | Text | `DocsDoodads` | JSON filename in `data/` (without `.json`). |
| **Doodad Files** (`splitByMap`) | Boolean | `false` | One file per map: the settings stay in the data file, and each map's doodads go in `data/DocsDoodads/DocsDoodads-Map003.json` (smaller diffs in Git). |
| **Texture Scaling Mode** (`doodadScaleMode`) | Boolean | `true` | `true` for Smooth / Linear, `false` for Pixelated / Nearest. |
| **Default Workspace Layout** (`defaultLayout`) | Select | `Mapping` | Startup layout preset (`Mapping`, `Events`, `Characters`, `Tiles`, `Compact`). |
| **Default Thumbnail Size** (`defaultThumbnailSize`) | Number | `96` | Initial card size in pixels (32 to 256). |
| **Asset Cache Enabled** (`cacheEnabled`) | Boolean | `true` | Caches metadata & disk thumbnails for instant opening. |
| **Background Work Budget** (`backgroundWorkBudget`) | Number | `4` | Milliseconds per frame dedicated to background scanning. |
| **Autosave Interval** (`autosaveRecoveryInterval`) | Number | `60` | Heartbeat interval (seconds) for crash recovery snapshots. |
| **Backup Retention Count** (`backupRetentionCount`) | Number | `10` | Number of timestamped backups retained in `data/docs_doodads_cache/backups/`. |
| **Show Grid Snap** (`gridSnapShow`) | Boolean | `false` | Shows the placement grid when the workspace opens (G toggles it). |
| **Grid Snap Width / Height** (`gridSnapWidth`, `gridSnapHeight`) | Number | `0` | The snapping grid in pixels; `0` uses the map's tiles. Events always go on tiles. |
| **Developer Diagnostics** (`devDiagnostics`) | Boolean | `false` | Enables detailed console logging in DevTools. |

---

## 4. The Item Bag & Search

### The editor at a glance
Press **F10** in a playtest. The first time, a short welcome card shows the three steps: pick something from the **Item Bag**, click the map to put it there, then **Save** and **Done**. From the card (More > How to Use) you can also **Add Sample Items** (four small pictures in `img/doodads/samples`, the Sample Garden and Sample Lamp Post prefabs and a Sample Meadow biome), **Replay Tool Tours**, and read **What's New**. The first time you pick each tool, a short tour shows how it works; "No more tours" turns them off. After an update, What's New shows once.

- **Top bar**: the tools, each a big button with its name under it: **Select** (click things to change them, drag to move), **Stamp**, **Scatter**, **Paint** (biomes), **Path**, **Hills** (terrain heights), **Regions** (region numbers), **Mirror** (symmetry) and **Grab** (the eyedropper). Then **Undo**, **Redo** and **Steps** (every step, to jump back to any of them), **More**, **Save** (an orange dot means something isn't saved yet) and **Done** (closes the editor).
- With unsaved changes, **Done**, the toggle key, closing the Playtest window and **F5** ask first: **Save**, **Don't Save** (the doodads and events go back to how they were last saved) or **Keep Editing**.
- Questions (names, "are you sure?") come up in a card: **Enter** answers with the main button and **Esc** cancels. Anything that can't easily be taken back has a red button.
- A tool's options open in a card under its button while it is on. **Esc** goes back to Select.
- **More** holds the rest: **Cut Up Sheet** (the slicer), **Screen Looks** (post-processing and map image export), **Effects Maker** (VFX), **Old Saves** (save history), **File Check** (duplicates and unused files), **Info** (numbers, cache and backups), **Show Grid**, **Sounds** on/off, **Find a Tool** (Ctrl+K), **Keys** (every keyboard shortcut, and changing them: section 23), **How to Use** (the welcome card again) and the panel layouts.
- **Item Bag** (left) and **Details** (right) fold away with their arrow buttons (or **H** for Details) to give the map room; click a folded strip to open it again. Folding, sounds and the welcome card are remembered on this computer.
- The **hint bubble** at the bottom always says what to do next for the tool or the thing you have picked.
- Rest the mouse on a button for its **tooltip**, with the shortcut in a key cap.
- **Clock** (top of the map panel, when nothing is picked): drag to see the map at any time of day, pick a season to see its art, ▶ to run the day fast, **Now** to go back to the game's own time. It only changes what the editor shows.
- **Show Sounds** (More): a circle for how far each sound source on a doodad or event reaches, and shaded tiles where a region sound plays. **Listen** (More): click a tile to hear what the player would hear there, sound sources, the region sound and ambience layers mixed at their volumes, with a list and Stop. Esc ends it.
- **Show Speed** (More): frames a second, draw calls a frame, pictures loaded, doodads and lights on the map; numbers over a typical budget turn red with a hint (for many draw calls, pack the map's art).
- **Command palette** (Ctrl+K or More > Find a Tool): words can come in any order; recently used commands come first; shortcuts show as key caps. Type a value to act on it straight away: `time 18:30` (or `6pm`) previews that time, `go to map 3` goes there, `season winter` previews a season, `size 125` sets the editor size.
- **Map tabs** (under the top bar, once you have opened two maps): click one to go there, × to take it out; a dot marks a map with unsaved changes.
- **Folder view** (the folder button beside the item count): the Item Bag's items in a tree of their folders; the search and tabs still narrow it.
- **Problems** (More): pictures (a state's own art too), common events and sounds missing from the project, doodads outside the map, lamps on maps that never get dark, events nobody can step on or that sit under a doodad's collision; for this map or every map. **Go To** shows each one; **Fix** (where there is a safe fix) replaces the art, removes the sound or moves the doodad inside.
- **Check Reach** (in Problems, or the palette): shades every tile the player can walk to from where they stand (or **From a Tile...**), past walls, doodad collision and characters, and lists the doors, chests and transfers out of reach. "Only a character stands in the way" means a character blocks the only path; it may move during play.
- **Capture** (More): **Save a Picture of the View** writes a PNG of the map as it is on screen (no editor outlines); **Orbit GIF (3D)** turns the 3D camera once round and saves a looping GIF (pick 12, 24 or 36 frames and a width). Both go into the project's `screenshots` folder.
- **Right-click menus** remember what you use: once a few actions repeat, longer menus open with a row of your most-used actions on top.
- **Look** (More): the editor's **size** (100, 125 or 150%), its **theme** (Light, Dark, High contrast, or **Playful**: cream cards, teal and coral, pill buttons, in the style of the coming Character Creator) and the **map colours**: Standard, or **Colour-blind safe** (colours that stay apart for red-green and blue-yellow colour blindness) for the selection, guides, mirror line, paths, Old Saves, brushes, collision and blocked tiles, with a key to what each colour means. Kept on this computer.
- **Details** remembers which sections you opened or closed. The ☆ on a section's title pins it to the top; ★ unpins it.
- **Messages** (More) lists every message the editor has shown, newest first. After deleting doodads, an event or a layer, erasing with Scatter, clearing map dressing or Replace Art, the message has an **Undo** button (it stays while the mouse is on it).
- **Long jobs** (finding art, packing, Auto-Slice, bringing in files) show a progress pill at the top right of the map with **Cancel**; you can keep working meanwhile.
- The editor carries its own rounded font (Nunito, under the SIL Open Font License; the licence is in `art/fonts`), so it looks the same on every computer. Letters it doesn't have, such as Japanese, use MZ's own font. Icons and the font are built from `art/` with `npm run icons` and `npm run fonts`.

The left panel is the **Item Bag**, providing virtualized access to all graphics and audio in your project. It opens on **Doodads** (or **Everything** in a project that has none yet).

- **Sort** (beside the item count): Best match, Name, Newest first, Biggest first, Most placed or Last placed. The choice is remembered; Recent and Look-alikes keep their own order.
- **Search chips**: a search with more than one term shows each term as a chip under the search box; × takes it out. **☆ Save search** keeps the search as a named chip (stored with the library, like collections); click it to search again, × to forget it. Saved searches are in the command palette too.
- **Hover card**: rest the mouse on an item for its size, frame count, default depth, times placed and where it is used, with **Details**, **Cut Up** and **Where Used** buttons.
- **Empty tabs** say what goes there, with a button: **Bring In Files...** (the same import as dropping files on the window), **Show Everything** or **Clear the Search**.

### Navigation & Views
- **Category Tabs**: icon tabs for Doodads, People, Tiles, Pictures, Prefabs, Sounds, Favourites, Recently used, Everything, Faces, Battlers, Backdrops and System (hover for the name; the bag's title shows the open one).
- **Virtual Collections**: Group assets into custom collections (e.g., "Castle Set", "Dungeon Props") without duplicating files on disk. Pick one in the collection list under the bag's search box or type `collection:"Castle Set"`; the ✕ beside the list deletes the shown collection (its assets stay).
- **Right-Click Card Context Menu**: Right-click any asset card to open an instant action menu:
  - *Place as Doodad* / *Place as Real MZ Event...*
  - *Add to Favorites / Remove from Favorites*
  - *Add to Collection...* / *Remove from "Castle Set"* (one item per collection the asset is in)
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
- `-tree`: Negative search; excludes any asset matching "tree". A minus works on the others too: `-tag:"deep forest"`, `-type:character_sheet`, `-folder:enemies`, `-collection:"Castle Set"`, `-category:Audio`.
- **Combined Example**: `prop_123 tag:tree -dead category:Doodads collection:"Castle Set"`

---

## 5. Intelligent Slicing Engine & Cut Up Sheet

The workspace features a multi-tiered slicing engine that segments composite sheets into individual reusable assets:

1. **Known MZ Format Detector**: Automatically detects `$Single` character sheets (3x4), standard 8-character sheets (12x8), Face sheets (4x2), IconSet grids (32x32), and Sideview Battlers without manual configuration.
2. **Sidecar Atlas Parsers**: Reads Aseprite JSON, TexturePacker JSON, and `.saf.json` metadata when placed alongside the image.
3. **Canvas Visual Auto-Slicer**: Uses Otsu adaptive alpha thresholding, 4-connected component labeling, border flood background removal, morphological noise cleanup, and gutter splitting to isolate irregular sprites.
4. **Cut Up Sheet** (More, or an image's Details):
   - Double-click any asset or click **Auto Slice** to open the 1600% zoomable slicer editor.
   - **8-Handle Drag & Resize**: Adjust region boundaries with sub-pixel precision.
   - **Smart Snapping**: Automatically snaps region edges to pixel gutters and nearby regions.
   - **Tools**: Split, Merge, Align, Distribute, Rename, and Set Pivots.
   - **Persistence**: Region definitions are saved non-destructively in `data/DocsDoodadsLibrary.json`. The original source PNG is never modified.
   - **Export**: Export sliced regions as standalone PNGs or animation strips directly to `img/doodads/` with one click.

---

## 6. Drag-and-Drop Placement & Modern Map Editing

### Placing Assets
- **Drag & Drop**: Drag any asset or slice from the Item Bag directly onto the live game map. A translucent **Ghost Follower** tracks your mouse with exact dimensions.
- **Snapping**: Snaps to the map's tiles by default (or the Grid Snap Width / Height parameters). **Hold Alt** while dragging or dropping for free pixel-perfect placement.
- **Stamp Mode**: Click the **Stamp** tool in the top bar to click-to-place repeated props (grass, barrels, trees) across the map. Press **Escape** or right-click to exit.
- **Scatter & Settings**: Click the **Scatter** tool to paint scattered props. Its card lets you tune **Size**, **How many**, **Space between**, and under **Variety** the size, tilt, flip and colour changes (props never land closer than Space between, including to props already there). Rules keep props on chosen **regions** or **terrain tags** and can **skip impassable tiles** (water, walls). A circle on the map shows the brush; **right-drag** erases the picked item inside it (one undo step a stroke; locked doodads and ones on hidden or locked layers stay). **[** and **]** make the brush smaller or bigger (Paint, Hills and Regions too).
- **Path Tool**: Click **Path**, then click points on the map (tile-snapped; hold **Alt** for free points). Double-click or press **Enter** to place the selected asset evenly along the line; **Backspace** removes the last point. Settings: spacing, random offset, turning pieces along the path, and smoothing. Choose separate **End** and **Corner** pieces from the Item Bag for fences, walls, and rows of lamps.
- **Prefabs**: Select doodads and click **Save Prefab** in Details. Events under the selection can be included. The selection becomes the prefab's first linked copy. Place prefabs from the **Prefabs** tab by dragging, with **Stamp**, or **Place at Player**. Copies are grouped. Edit one copy and click **Update Prefab**, then **Sync Copies** to rebuild every copy on every map from the master. **Detach** unlinks a copy.
  - **A copy's own settings**: change a setting in Details on one copy (a lamp's colour, a sign's switch, a Name) and it becomes that copy's own, marked **●**: Sync Copies keeps it while the rest follows the master. Details lists a copy's own settings above its buttons; **Use Prefab's** gives one back to the master's value. Positions inside a copy always come from the prefab (move the whole copy, or Update Prefab). Update Prefab takes the copy's own settings into the master.
  - **Prefabs inside prefabs**: save a selection that holds a whole copy of another prefab and that prefab goes inside the new one (the new prefab's Details says what it holds, and the inner one's says what it is inside). Changing and syncing the inner prefab changes every copy of the prefabs that hold it too, and a copy's own settings for the inner doodads go in with it. Deleting an inner prefab leaves its doodads in the prefabs that held it.
- **Room stamps** (More → **Rooms**): **Save a Room from the Map**, then drag over part of the map. Its tiles (all four layers, shadows and regions), the doodads standing in it and the events on it become a room. Pick a room's **Place** and click where its top-left corner goes, on this map or any other; each placement is one undo step and is saved with the map. The ticks choose what to place (tiles, doodads, events). **Keep tiles under empty ones** (on by default) leaves the map's tile wherever the room has nothing on an upper layer. Parts that would fall off the map are left off; events get new ids. Autotile edges are copied as they were, so a room's border may want touching up in MZ. Rooms are kept in `data/DocsDoodadsRooms.json`.
- **Grab**: Hold **Alt and click** any placed doodad or MZ event on the map (or use the **Grab** tool) to find and pick that asset or event template in the Item Bag.

### Selection, Multi-Selection & Right-Click Context Menu
- **Click**: Select a placed doodad or genuine MZ Event on the map.
- **Drag to Move**: Press on a doodad and drag. Pink **smart guides** snap its edges, centre and base line (where it stands) to nearby doodads; orange guides show equal spacing between neighbours; with nothing near, teal guides snap an edge or the base line to a tile line. A readout beside the cursor gives the position, tile and size in pixels and tiles. Hold **Alt** to move freely or **Shift** to snap to the tile grid. A drag is one undo step.
- **Show Collision** (More, or Ctrl+K): every doodad's collision box, coloured by preset, with the tiles doodads block shaded red and the tiles the map itself blocks shaded grey, and a key to the colours. Doodads hidden in the game are drawn faintly and block nothing. Flat maps only; the choice is remembered.
- **Status bar** (along the bottom of the map): the tile and pixel under the cursor, the map, what is picked, the layer new doodads go on, the zoom, and **Not saved** or the time of the last save.
- **Right-Click Canvas Context Menu**:
  - *On Doodad*: Bring Forward (+1 Z), Send Backward (-1 Z), Bring to Front, Send to Back, Duplicate (Ctrl+D), Lock/Unlock, Hide, Move to Layer, Select Same Art, Select Everything on its layer, Replace Art..., Delete (Del). Right-clicking one of several picked doodads keeps them all picked.
  - *On MZ Event*: Save as Event Template..., Duplicate Event, Delete Event.
  - *On Empty Map*: Toggle Grid Overlay (G), Paste Copied Doodads (Ctrl+V), Paste in Place (Ctrl+Shift+V), Select All (Ctrl+A), Invert Selection, Stamp Asset Here.
- **Select All, Same Art, Layer, Invert**: these pick only what Select can reach (not doodads hidden in the editor or on hidden or locked layers). Same Art matches the picture however its path is written.
- **Replace Art**: a new picture for the picked doodads, or for every doodad showing the same picture on this map or on every map. Type or choose the picture (the last one picked in the Item Bag is suggested); position, size, depth, motion, lights and collision stay, the frame size follows the new picture, and locked doodads are left alone. It is one undo step. An Item Bag picture's right-click menu has **Replace Art on Maps...**, which pairs with **Where Used**.
- **Marquee Drag Box**: Click and drag on empty map space with the pointer tool to draw a blue selection box. All enclosed doodads are selected at once!
- **Shift + Click / Shift + Marquee**: Add or toggle doodads in the active multi-selection.
- **Handles**: a picked doodad (one, on a flat map) shows corner handles and a knob above it. Drag a corner to resize it around its foot (it stays standing where it was); **Shift** keeps its proportions. Drag the knob to turn it; **Shift** snaps to 15 degrees. Each drag is one undo step.
- **Animation** (Details, for a doodad drawn as a strip of frames): frames across and down (the picture is split evenly), speed (game frames per picture; 0 holds still), the frame to start on, and Play: Loop, Back and forth, Once (when its switch turns on; again each time it turns on) or Hold one frame.
- **States** (Details): give the doodad a **Name** (events find it by this; doodads with the same name follow together), then **+ Add State**. State 0 is the doodad as placed; each other state can show another picture (**Use Picked Art** takes the one picked in the Item Bag) and can turn the doodad's **Light** and **Collision** off. **Switched by**: Events only, a switch (off shows state 0, on shows state 1) or a variable (its value picks the state). **Crossfade** is how many frames the old picture takes to fade. **Preview** shows a state on the map while editing (nothing is saved).
- **Touch** (Details): a **common event to run** when the player presses Action facing the doodad (or clicks it), or, with **Runs on: Walking into it**, bumps into it or steps onto it. **Also go to its next state** makes a door that opens and closes with no event at all. Inside the common event, `DocsDoodads.WorldState.touched()` says which doodad it was (`name`, `state`).
- **Several picked**: Details shows "—" where the picked doodads differ (a half-ticked box, a "— mixed —" choice); changing a field sets it on all of them. **Placement** sets their X, Y, Z-order, turn and size.
- **Number boxes** in Details: drag the label left or right to change the number (Shift for bigger steps), or use the arrow keys.
- **Nudge**: Press **Arrow Keys** to nudge selected doodads by 1 pixel (**Shift + Arrow Keys** for 16 pixels); a run of presses is one undo step. Arrow keys also nudge selected MZ Events by 1 tile (saved with the map, undoable).
- **Duplicate**: Press **Ctrl + D** to duplicate all selected doodads (+16px offset) or selected event.
- **Copy / Paste**: Press **Ctrl + C** to copy selected doodads and **Ctrl + V** to paste them.
- **Delete**: Press **Delete** to remove selected doodad(s) or selected event.

### Alignment & Distribution
When 2 or more doodads are selected, Details exposes one-click alignment tools:
- **Align**: Left, Center X, Right, Top, Center Y, Bottom.
- **Distribute**: Horizontal Distribution, Vertical Distribution.

### Organization & Layering
- **Grouping**: Click **Group** to link selected doodads (`d.groupId`). Clicking any member selects the entire group.
- **Locking**: Click **Lock** (or press lock in Details). Locked doodads cannot be nudged, dragged, or accidentally deleted.
- **Hiding**: Click **Hide** to toggle editor visibility of decorative layers without affecting runtime gameplay.
- **Z-Order Layering**: Use the Layering buttons in Details to adjust draw order:
  - **+1 Z (Bring Forward)**: Increments Z-order.
  - **-1 Z (Send Backward)**: Decrements Z-order.
  - **To Front**: Places selected doodad(s) on top of all other doodads on the map.
  - **To Back**: Places selected doodad(s) beneath all other doodads.

---

## 7. Depth, Appearance, Motion, Shadows & Lights

Select a placed doodad (or several) and open Details' collapsible sections. Every change can be undone, and dragging a slider counts as a single step.

- **Depth**: *Below characters* (rugs, puddles, paths), *Sorted with characters* (trees, pillars, statues: the player walks behind them above the base line and in front below it), or *Above characters* (overhangs, canopies). **Base line offset** moves the sort line up or down. New placements guess from the file name, and each asset can set its own **Default Depth**. QJ-Doodads projects keep their old layering: z 0-2 maps to below, 3 to sorted, and 4+ to above.
- **Appearance**: opacity, blend mode (Normal, Add, Multiply, Screen), hue shift, colour tone, greyscale, blur, and horizontal/vertical flip.
- **Motion**: Sway (wind), Bob (float), Pulse, Flicker (flame), or Shimmer (water/heat), with amount and speed. Neighbouring props are offset in time so a forest doesn't sway in lockstep.
- **Shadow**: a soft silhouette built from the sprite's own transparency, with strength, length, lean, softness, and offset. It falls over floor decals and under characters.
- **Light**: colour, radius, intensity, flicker, a daylight glow, and offset. Lights shine through the map's ambient darkness.
- **Visibility**: show only while switches are set (`5:on, 6:off`) and/or while a JavaScript condition is true. The editor always shows conditional doodads, faded when their condition is false.

**Map lighting**: with nothing selected, Details shows the map's settings. Set **Ambient Darkness** and colour, optionally only while a switch is ON (a night switch), and toggle **Preview lighting while editing**. During play, the plugin commands **Set Ambient Light** (darkness %, colour, fade frames) and **Reset Ambient Light** fade between moods.

**Doodad states and lights in saves**: **Set Doodad State** (a Name, then a state's name or number, `next`, or blank to follow its switch or variable again; on this map or another), **Set Doodad Light** (on, off, or its own setting) and **Store Doodad State** (its number into a variable) are kept with the save file, so the lamp the player smashed stays smashed. A saved state wins over the doodad's switch or variable. In a Conditional Branch script: `DocsDoodads.WorldState.is('Front Door', 'Open')`.

---

## 8. World Atmosphere: Day & Night, Sun Shadows, See-Through, Water, Seasons, Motion Blur

These settings apply to the whole game. With nothing selected, Details shows the map panel. Its sections marked **All maps** hold them, and the Lighting section has three per-map switches. Everything is undoable and saved in `data/DocsDoodads.json`.

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
- In the 3D view, hills and standing tileset objects are revealed too (section 14). There the outline is drawn over whatever hides the player: the player and their gear as one shape in the **Outline colour**.

### Water Reflections
- Characters and standing doodads get a rippling mirrored copy on the water tiles below them. Bridges over water are left alone.
- Add a **region** to treat painted areas (ponds drawn with B-E tiles) as water.
- **Shore margin** keeps a strip along the waterline clear, because MZ water tiles draw their own sand or grass edge. Reflections start where the water visibly begins.
- Turn it off per map, per doodad (**Reflect in water**), or per event with `<no reflection>`.

### Motion Blur
Moving characters blur along their direction, more when dashing; transfers and jumps never smear. Choose everyone or events tagged `<motion blur>` (`<no motion blur>` opts out). When it is on, players get a **Motion Blur** switch in the Options menu.

### Seasons
- **Current season from**: a variable, or the **Set Season** plugin command. Season names are editable.
- **Art swaps**: each row lists one prop's art per season, and every doodad using any image in the row shows the current season's version. Empty cells keep the original. Fill rows from the map panel, or select an asset in the Item Bag and use **Season Variant** to add it.
- **Preview while editing** shows any season in the editor.
- A doodad's **Only in ...** checkboxes limit it to some seasons (flowers in spring and summer, snowmen in winter).

### Appear and Disappear
Doodads hidden by a switch, condition or season can **Fade**, **Pop**, **Rise**, **Dissolve** or **Crumble** in and out over a set number of frames, instead of blinking.

### Shaped lights, presets, the flashlight and wall shadows
- In a doodad's **Light** section: **Preset** sets the colour, size, flicker and shape at once (Torch, Candle, Campfire, Lantern, Neon pink and blue, Crystal, Spotlight, Moonbeam, Window glow); change anything after. **Shape: Cone** points the light one way (**Points**: 0 right, 90 down, 180 left, 270 up) with a **Cone width**.
- **World → Lighting on Flat Maps → Walls stop light**: light stops at tiles nobody can walk on, except water (and at any regions listed as walls), so walls cast dark edges. Each light can follow that, or always or never stop at walls (**Walls stop it**). **Shadow detail** is how many rays each light casts; outlines are worked out again only when a light or the map changes.
- **The flashlight**: the player can carry one (World → Lighting on Flat Maps), only while a switch is on if you like. It points where the player faces and turns smoothly; walls stop it too. The **Flashlight** plugin command turns it on or off for the playthrough, or back to the setting. Lights show only where the map is dark (ambient darkness, night).

### Layers, wind, lightning and the camera on flat maps
- **Background and Overlay Layers** (the map's settings, flat maps): any number of pictures from `img/parallaxes`, each **behind the tiles** (above MZ's own parallax) or **over the map** (over characters, under weather and pictures). Each has how much it **follows the camera** (0 = fixed to the screen, 1 = moves with the map, in between = far away), its own **scroll** across and down, **zoom**, **opacity**, **blend** (normal, add, multiply, screen) and whether it **repeats** across and down. **Fog Banks** adds soft fog drawn by the game (`#fog` as the picture) that **drifts with the wind**. Layers draw in the order listed (↑ moves one further back). The 3D view has its own sky and fog, so layers show on flat maps only.
- **World → Weather on Flat Maps**: **Wind** (0 calm to 1 gale), its direction and **gusts**; rain and storms make it windier. The wind leans doodads that **Sway**, pushes particles (smoke, leaves, sparks) and fog layers, and can blow **leaves** across the screen (with their colour). **Lightning in storms** flashes the screen about every few seconds in a full storm (rarer in weaker ones), and the **thunder** comes after: soon for near strikes, up to the delay set for far ones. **Set Wind** changes the wind during play, easing over some frames.
- **World → Camera on Flat Maps**: the camera can **ease after the player** instead of keeping them exactly centred, and **look ahead** of where they walk. In the map's **Camera (flat map)** settings, list region numbers: while the player stands on one of them, the view stays inside the area that region covers (a room, a corridor). **2D Camera Path** glides the camera through tiles for a cutscene (waiting for it, if asked), then back to the player or staying put; **2D Camera Follow** follows this event, another event, or the player again.

### Turning effects off during play
**Set Atmosphere Effect** switches character shadows, motion blur, water reflections or see-through on or off for the current playthrough.

---

## 9. Post-Processing, Screen Effects & Map Image Export

Open **More → Screen Looks**. Changes show live on the map behind it, and every edit can be undone (a slider drag counts as one step).

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

### Looks by time and by region
Under the effects, the card mixes looks in on top of the game-wide or map look:
- **Looks by time of day** (game-wide): a look from one time to another (across midnight too), easing in and out over a fade in game minutes, with a strength. Add one for a warm dusk (Golden Hour from 17:00 to 19:30) or a blue night. The clock bar at the top of the map previews any time.
- **Looks by region**: while the player stands on a region, its look fades in (over the seconds set) and fades out again on leaving. Game-wide ones apply on every map; with **Editing: This map** a map gets its own, which win over the game-wide ones for the same region number (a cold crypt on region 5). Paint regions with the **Regions** tool; the eye button previews a region's look while editing. A transfer into a region starts with its look already in.
- Each entry's look is a preset, or **Copy the look above** to make it its own from the look being edited.
- **Looks by time of day on this map** (with Editing: This map) is on by default; turn it off for interiors. A map set to *No effects* shows none of these.
- **Set Post-Processing Look** during play still wins over all of them; going back to the map's look brings them back.

### During play
- **Set Post-Processing Look** fades to a preset, to no effects, or back to the map's own look (with its looks by time and region), over a number of frames. Use it for flashbacks, poison, night vision or boss rooms.
- **Play Screen Effect** plays **Impact Zoom**, **Shockwave**, **Chromatic Punch** or **Bloom Flash**, centred on the player, an event, or the screen. Try them in the builder with **Play**.
- **Set Atmosphere Effect → Post-Processing** turns all looks off for the current playthrough.

### Export Map Image
Saves the whole map as one PNG in the project's `screenshots` folder and opens it in Explorer.
- **Scale**: 100%, 50% or 25%. The largest image is 16384 pixels on a side; the editor suggests a smaller scale if needed.
- **Characters**: include the player and events.
- **Lighting & colour**: include lighting, bloom and colour grading. Effects shaped by the screen (vignette, CRT, lens, aberration, grain, tilt-shift) are always left out, because they would repeat across the stitched image.

---

## 10. Particles, VFX, Character Animation & Traversal

### Particles on doodads
Select a doodad and open **Particles** in Details.
- **Emitter presets**: Smoke, Embers, Fire, Fireflies, Falling Leaves, Mist, Dust Motes, Sparkles, Snow, Bubbles and Magic.
- **Amount** scales the preset's rate.
- **Draw** places the particles above characters, or below them for ground mist.
- **Offsets** move the emitter from the doodad's centre.
- **Attached VFX** loops any effect from the Effects Maker on the doodad, for example a magic circle on an altar.

Fire and embers combine well with a Light set to *After dark* (section 8).

### Grass that reacts
**Interaction → Bend when walked through** makes grass, bushes and reeds lean away from whoever passes and spring back. Faster walkers push harder. **Drop leaves when disturbed** shakes out a few leaves each time someone enters.

### Effects Maker (VFX)
Open **More → Effects Maker**.
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
  - `Hero[f9][w2]`: frame 0 is the standing pose and the others are the walk, one cycle every 2 tiles at any speed, so the feet keep up with the ground (the Character Creator's walkers use it). Needs more than 3 frames.
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

### Traversal
Open **Traversal** in the map panel (*All maps*) to give the player more ways to get around. Each ability can need a switch (0 = always), and **Set Traversal** (plugin command) turns one on or off for this game, or back to these settings (the player learns to swim). **Traversal Action** makes the player jump, take off, land or dive from an event, as if they pressed the key.
- **Jump** (C key): a hop forward, over gaps and fences up to *Jump over gaps up to* tiles, and up ledges as high as *Jump up ledges* (terrain height). It never lands on someone or a solid doodad, and ground that is too high stops it. Optional sound; *No jumping into region* blocks it.
- **Glide:** jumping off high ground carries further, by *tiles further per tile of height*, up to a limit.
- **Swim:** the player walks into water nobody could walk in and back out onto land. Slower (*Swimming speed change*), in the water up to the waist (*in the water up to* pixels), with an optional swimming sheet (the character's name plus a suffix such as `_swim`, used when the file is there) and stroke sound. *No swimming in region* keeps them out.
- **Dive** (C in deep water): to the map set under this one, and back up from an underwater map. Set both maps in the map panel's **Sound (this map)** section, under *Diving*.
- **Fly** (F key; again to land): over everything but the map's edge and *No flying over region*, above tree tops, with a shadow below, and drawn up off the ground in 3D. No events trigger from the air, battles only if *Random battles while flying* is on, and the party lands only where it could stand.
- **Climb:** chosen regions or terrain tags climb like ladders, past terrain-height blocking.
- **Ice:** chosen regions or terrain tags slide the player on until something stops them.
- **Gamepad and touch:** jump (and dive) and fly (and land) also go on gamepad buttons MZ leaves free on the map: the right and left triggers unless you pick others (or None). On touch screens (or always, or never) round **Jump** and **Fly** buttons show in the bottom right while the player can move; they read **Dive**, **Surface** or **Land** when that is what they would do, and a tap on them never walks the player there.

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

### Zoom and sound focus
In the map panel's **Zoom and Sound Focus** section (*All maps*), let players zoom in on their character with the mouse wheel, the **+** and **-** keys, or both, up to **Closest zoom**. **Set Zoom** (plugin command) does it from an event, eased over a number of frames, with optional wait. The zoom is kept in save files. Flat maps zoom MZ's screen around the player; 3D maps move the camera in.

With **Zooming in brings the nearby sound forward** on, zooming in lowers the music (*Music drops by*), makes sounds carry less far (*Sounds carry less far by*) and makes nearby ones louder (*Nearby sounds louder by*): event sounds, Play SE At and doodad sounds all follow it.

### Ambience layers
**Add Ambience** (same section) adds a looping background sound that is as loud as there is of its kind around the player, panned towards it:
- near water (rivers, sea), near trees (forests, ☆ tree tops), out in the open (wind, louder up high on raised terrain);
- near doodads whose picture name contains some text, near a region, or near a terrain tag.

Each layer has a sound, a volume, a **heard within** radius, its share at normal zoom (it swells as you zoom in) and a pitch.

### Footsteps
Tick **Footsteps** and add footstep sounds by ground: a region, a terrain tag, shallow water, bushes and tall grass, forest, or anywhere else (regions are checked first, then terrain tags, then the kind of ground). They are quiet at normal zoom (*Footsteps at normal zoom*), clear when zoomed in, louder when dashing, and optionally play for followers too, softer.

---

## 12. Editor Tools: Layers, Symmetry, Biomes, Dressing, History, Command Palette

### Layers
Every map has a **Main** layer. Add layers in the map panel under **Layers** (for example Ground Decor, Props, Canopy, Lights, Markers).
- The layer selected with the round button receives new doodads.
- **Ed** shows or hides a layer in the editor only, to work underneath a canopy.
- **Lk** locks a layer so its doodads can't be clicked, box-selected or dragged.
- **Gm** shows or hides a layer in the game. Use it for markers and notes you only want while editing.
- Move doodads between layers with **Editor layer** in their details (Depth section), or right-click one on the map: **Move to Layer**. Deleting a layer moves its doodads to Main.
- Everything is undoable.

### Symmetry
**Mirror** (top bar) mirrors placements left/right, top/bottom, or four ways, around axes at the map's centre or at any tile line you type. Stamps, the scatter brush and the biome brush all place the mirrored copies, flipped for left/right mirroring, in the same undo step. The axes show on the map as purple lines.

### Biome brush
A biome is a weighted mix of props: for example a forest of 3 oaks : 1 pine : 2 bushes, each with its own scale range.
- Make biomes in the map panel under **Biomes**, or select an asset and use **Add to Biome**.
- Each biome sets its **spacing**, how many props each dab tries, **thin at edge** (sparser at the rim of the brush) and **patchiness** (natural clumps and clearings).
- Choose **Paint** in the top bar, pick a biome and a size, and drag on the map.
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
**More → Old Saves** lists the timestamped backups made each time you save.
- Pick a doodads backup to see this map's doodads that are new, changed or deleted since then. They are outlined on the map in green, amber and red.
- Pick a map backup to see its events.
- **Restore** puts back a deleted doodad or event, undoes a change, or removes something new. Each restore is a single undo step. Event restores are saved with Save Changes.

### Searching the map panel
The map panel has many sections. Type in **Search settings** at its top (for example *fog*, *shadow* or *snow*) to show only the sections that mention every word, opened; clear it to get the panel back as it was.

### Undo history
The **Steps** button next to Undo and Redo lists the undo steps by name (Place doodad, Move doodads, Terrain height, Dress map...), oldest first, with the current point highlighted. Click a step to go back to just after it, or forward again to a greyed-out step; *(Start)* undoes everything. Making a new change after going back drops the greyed-out steps, as Undo does. The list holds the last 300 steps.

Each map keeps its own steps. Going to another map parks this map's steps; coming back brings them back, with a toast saying how many (Undo and Steps work there again). If the map file was changed in MZ meanwhile, its steps are let go instead. The last ten maps you left keep their steps; **Discard** clears them all.

### Tiles (painting MZ tiles)
**Tiles** (top bar) paints the map's own tiles during a playtest, so a map can be finished without going back to MZ. The card shows the map's tileset: tabs **A1** to **E**. On B to E and A5, click a tile or drag across several for a block; on A1 to A4, click an autotile. Then click or drag on the map. Autotiles (water, ground, roofs, walls, waterfalls) join up with their neighbours as you paint, the way MZ's editor does it, and the tiles around a painted one change shape to match. **Layer: Automatic** puts A tiles on the ground layers and B to E on the upper layers (a second upper tile goes over the first); or pick a layer. **Eraser** takes the top tile off. **Alt+click** picks up the tile under the cursor. Each stroke is one undo step; Save writes the tiles into the map file with the other map changes, and the MZ editor shows them once it reloads the project. Shadow pen and the MZ editor's special wall-joining rules are not copied.

### Regions
The **Regions** tool paints MZ region numbers onto the map's tiles, the ones dressing rules, biomes, region sounds, footsteps, ambience, climbing, ice, no-fly zones and terrain height read. Pick the number (0 rubs regions out) and the size (1 to 13 tiles across, **[** and **]**), then drag on the map; each stroke is one undo step and is saved into the map file with your other map edits. **Alt+click** a tile to pick up its region. While the tool is out, each painted tile shows its region's colour and number. The card's legend lists the regions on this map, how many tiles each covers and what the project uses it for; click one to paint with it. **Show terrain tags** marks tiles that have a terrain tag (T1, T2...). Terrain tags belong to the tileset in MZ's database, so they are shown here but changed in MZ.

### Command palette (Ctrl+K)
Type a few letters of anything and press Enter:
- tools, panels, Save, Undo and Redo, Toggle Grid
- mirror modes, Screen Look presets, Play Effect for any effect
- layers, Go to map, and any asset by file name

Letters can be skipped (`scrlk` finds *Screen Looks*). Use the arrow keys to move through the results.

### Animated thumbnails
Hover a character sheet in the Item Bag to watch it walk, and a door or chest sheet to see it open. An image sliced into equal frames (an animation strip) plays its frames too.

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
- with the body's idle, run and action sheets: while the character shows `$Hero_idle[f2]`, `$Hero_run[f8]` or an action such as `$Hero_slash[f6]`, a layer `Hat` draws `Hat_idle[f2]`, `Hat_run[f8]` or `Hat_slash[f6]` when that file is there (same ending and tags), and its usual sheet when not;
- in water reflections, in the save and load screens, and on the equip screen. The equip screen shows the actor wearing the item you're highlighting before you equip it.

Plugin commands change an actor's look without equipment:
- **Set Visual Alias**: switch body type or outfit set.
- **Add Visual Layer** and **Remove Visual Layer**: for a costume, a quest hat or a disguise.
- **Set Visual Colour**: for hair dye or team colours.

**LPC gear from the Character Creator.** Tick **Outfit as Visual Equipment parts** when exporting: the character's own sheets are then the body, hair and face only, and every piece it wears (shirt, trousers, shoes, hat, cape, weapon...) becomes part sheets named like `$LPC Shirt Longsleeve teal male[f9][w2]`, in the same layouts as the character (walker, idle, run, the ticked actions and a battler `sv` sheet), so the gear walks, breathes, runs, swings and fights with it. Pieces drawn behind the body (a quiver, the back of a cape) are a second layer in the same part. Each piece comes with its notetag; **Copy** it, or **Put it on** a weapon, an armour or an actor (data/Weapons.json, Armors.json or Actors.json are backed up first, and the running game picks it up at once). On an actor it is worn always, and an equipped item with the same part replaces it, so trousers on the actor give way to the armour's trousers. Parts are drawn for one body type; export again with another body for actors of that type. If MZ's editor has the project open, reopen the project there before saving, or it will put the old notes back.

In the editor, open **Visual Equipment** in the map panel to turn each place on or off, and to try gear on. Pick an actor, tick items, and watch the preview walk in any direction. The **notetag builder** writes the tags for you.

Character shadows include gear layers: a cape, hat or shield changes the shadow's shape.

**Layer sheets from Aseprite.** Draw the character once in Aseprite with a layer per part (body, hair, clothes...) and the walk cycle as frames: either tag the frames `down`, `left`, `right` and `up`, or put them in that order (three frames each). In the map panel's Visual Equipment section, **Make Layer Sheets from .aseprite…** writes one sheet per visible layer to `img/characters`, already in MZ's layout: `$Name_Body.png`, `$Name_Hair.png` and so on (single-character sheets; rows with other than three frames get `[fN]` in the name). Hidden layers and empty layers are skipped. RGB, grayscale and indexed files work.

**Gear straight from Aseprite.** Instead of making sheets first, name a layer of a layered `.aseprite` walk cycle in the tag: `<visual: Hero.aseprite#Sword, z 1>` (the file in `img/characters`, or a project path such as `art/Hero.aseprite`). In a playtest the layer's sheet is written to `img/characters` when it is missing or older than the `.aseprite`, and recorded in `data/DocsDoodadsAseprite.json`, so deployed and browser games find it. Save the `.aseprite` again while the game runs and its sheets are made again: everyone wearing it updates straight away. A layer that isn't in the file is skipped, with a console warning naming the layers it has. The notetag builder lists every layer of every `.aseprite` in `img/characters`.

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
New to the 3D view? [Your First 3D Map](docs/FIRST_3D_MAP.md) is a short walkthrough with screenshots.
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
| Sky video | A looping, muted movie as the sky, for example `movies/Sky.webm` (blank for none). It shows once the video has its first frame (the sky colour until then); the sun, moon and stars still draw over it. |
| Sky video shape | *360° panorama*: an equirectangular video (north in the middle) that turns with the camera, one camera turn being the whole video, its equator on the horizon. *Fill the sky*: stretched over the sky above the horizon and staying put. |
| Sky video speed / follows day and night | Playback speed (1 is normal), and whether the video darkens at night with the sky light. |
| Also show the sky video behind this map when it is flat | Uses the video in place of the parallax on the flat map too. |
| Beyond the map edge | The colour of ground past the map's edges. |
| Round world | **Planet**: the ground curves away all round, like a small world. **Rolling log**: it curves away only ahead, so things rise over the horizon as you walk toward them. |
| Curvature | How round the world is: 0 is flat, 10 is gentle, 100 is a tiny planet. Moving it off 0 turns a flat map into a planet; the radius below follows it. |
| World radius | How tight the curve is, in tiles. 0 sizes a planet so one lap is the map's width: on a looping world map, walking all the way round brings you back. |
| Things lean with the curve | Standing things lean outwards with the ground. Turn it off to keep them upright. |
| Q / W turn the camera 90° | Players can turn the view. The arrow keys follow the camera (up walks away from it), and characters show the side facing it. |
| Rippling water | Water tiles move with gentle waves that bend what shows through them (including water reflections) and catch the light. Shores stay dry. |
| Ripple strength / speed / sparkle | How far the waves bend the water, how fast they move, and how bright the glints are. Glints dim at night. |
| Wakes behind boats and waders | Boats, ships and anything moving through water leave spreading rings with a little foam. |
| Tileset objects (B–E tiles) | *Lie flat* (default). *Objects with ☆ tiles*: anything with a ☆ (above characters) tile, like a tree top, stands up with the tile under it (the trunk); side-by-side columns of the same height stand as one wide object. *Every B–E tile*: also lifts every other B–E tile (barrels, signs, fences) as one-tile billboards. The map itself isn't changed: in 2D, or with this off, the tiles lie on the ground as before. They use the standing doodads' height setting. Objects drawn entirely on roofs and walls (A3/A4: eaves, chimneys, windows) stay flat; a tree in front of a house still stands. **Keep tileset objects flat in region** keeps anything in that region flat. |
| Standing doodads / Characters: height in 3D | Shrink or grow things that stand up, in the 3D view only (the 2D map is unchanged). Tileset-sized art is often tall next to a one-tile hero: a 3-tile lamp at 0.65 stands about twice the hero's height. They stay on their feet, and gear, effects and balloons go with their owner. Editor clicks and selection boxes match. |
| Sky, sun, moon and stars follow the time of day | With the day/night clock running (section 8), the sky fades from blue by day to an orange sunrise and sunset and a dark night with twinkling stars. The sun and moon cross the sky on the same path the shadows use, low ones show near the horizon, hills are shaded from wherever the light is, and water glints toward the sun or moon. Ambient darkness and lamps work as on flat maps. A map's parallax still replaces the sky. |
| 3D rain and snow | MZ's **Set Weather Effect** (rain, storm, snow, power 1–9, with fades) falls through the 3D world around the camera: rain and storms slant with the wind and splash on the ground (raised terrain too), some drops ripple water, and snow drifts down. Trees, characters and hills in front hide the drops behind them. The screen dims with the weather like MZ's own. Off: MZ's flat weather is used instead. |
| Weather density | More or fewer drops and flakes than MZ's power alone gives. |
| Snow settles | While 3D snow falls, the ground slowly turns white (heavy snow covers it in about a minute) and standing doodads and tileset objects get white tops; it melts over about two minutes once the snow stops. In a season named Winter (section 8) it stays mostly white. Water stays clear when Rippling water is on. The cover is kept in save files. |
| Smooth distant ground | Blends distant pixels instead of keeping them crisp. |
| Cloud shadows / size / speed | Soft cloud shadows drift across the ground in daylight (they fade out at night). Size is roughly one cloud's width in tiles. |
| Low fog / height | Drifting patches of mist on the ground. With terrain height on, it lies in valleys and low ground, up to the height given (tiles above the lowest ground); hilltops stay clear. |

On a round world, things past the horizon are hidden, and clicks, fog and editor boxes follow the curve.

On a map shown in 3D, selecting an image in the Item Bag shows a small **3D preview**: the image standing beside the party leader, at this map's camera tilt and 3D height settings, so you can judge its size before placing it.

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
1. **The Hills tool** (top bar). Raise, lower, flatten (to where the stroke started), set an exact height, or erase back to automatic. It has a strength and a radius, and each stroke is one undo step. Painting turns Terrain Height on for the map. Before you paint, the tiles under the brush are shown on the ground (over hills in 3D), stronger towards the centre, in the mode's colour, each with its height as a number. **Edge** is **Soft** (gentle slopes, less towards the rim) or **Hard** (the whole circle changes the same, for plateaus and steps). **[** and **]** change the size.
2. **Regions:** for example, region 5 is 2 tiles high.
3. **Terrain tags (1–7):** for example, tag 3 is 1 tile high.
4. **Automatic,** on world tilesets: mountain tiles (impassable ground) rise to the **Mountain height** (1 tile by default), and forests (where airships can't land) to the **Forest height**.

**Shape:**
- **Smooth** is for hills and mountains: the ground is rounded, so a range rises in gentle slopes to a broad top, and a lone mountain is a low mound.
- **Stepped** is for cliffs and plateaus: flat tops with shaded cliff walls.

**How things stand on it:**
- Characters and the click-to-walk marker stand on the raised ground. On smooth ground they rest on the highest point under their base, so a bump beside their feet doesn't swallow them.
- **Doodads stand on level ground only.** The stamp, brushes, paths, dressing and dragging all refuse mountains and slopes; level raised ground you made (a plateau) is fine. Doodads already on a mountain (placed before terrain was turned on) show a red box in the editor so you can move them.
- Hills hide whatever is behind them, except the player: where a hill covers the player, it fades (see below).
- Clicking finds the slope you clicked.
- Slopes are shaded by a light from the upper left, and fog fades distant hills.
- **Steep steps block walking:** characters can't climb or drop more than the **Highest step you can walk**.
- **Walk off ledges:** with steep steps blocking, characters can still go off higher ground: they jump down to the tile below.
- **Hop up steps up to:** characters jump up a step no higher than this (tiles); 0 turns it off. Followers and events do the same.
- **Store Ground Height** (plugin command) puts the height under the player or an event (tiles, rounded) in a variable, for page conditions or branches. In a Conditional Branch script, `DocsDoodads.Terrain.heightOf($gamePlayer) >= 2` works too.

Terrain height shows only in the 3D view. It works on round worlds too.

**Interiors: walls stand up.** Tick **Walls stand up** to raise A4 walls and A3 roofs, in either shape (in Smooth the ground is rounded but walls stay sharp blocks): in each column the wall top and the wall face below it rise to the face's height (usually two tiles), the front of the wall shows the face art as drawn in 2D (decorations hung on it included), and the top shows the wall top. A wall top with no face below it uses **Wall height where there is no wall face**. Every exposed side of a wall shows the column's face art, so a turned camera sees walls, and a wall seen end-on borrows the face art of the nearest wall column. Floor decals (Below characters) that cross a wall stay on the floor. Painted and region heights win over walls. Use a fairly steep camera tilt inside rooms; with See-Through on, walls between the camera and the player fade where they cover the player.

### What works in 3D
- **See-through:** with See-Through on (section 8), tall doodads and standing tileset objects between the camera and the player fade where they cover the player (*Fade* and *Both*), to the See-Through opacity. *Outline* and *Both* draw the player and their gear again on top as one outline in the Outline colour. Hills fade in every mode.
- **Lighting:** ambient darkness lights the ground, and lights pool around each lamp's base. Characters and doodads are lit by the lights near them.
- **Sun and doodad shadows** lie on the ground.
- **Particles, VFX, balloons and animations** stand with their character or doodad. Effekseer animations (MZ's own format) play where their target is drawn and shrink with distance like it; MV-style animations do too.
- **Post-processing and day/night tint** apply to the whole view.
- **Touch and mouse:** clicking the ground walks there.
- **Editor:**
  - **Mouse look:** middle-drag orbits the camera (left and right turn it, up and down tilt it), Shift + middle-drag pans across the ground, and the mouse wheel zooms. A middle click without dragging goes back to the map's own camera. Like Set Camera, this only changes the view while editing; the map's 3D View settings stay as they are.
  - Clicks go through to the ground.
  - Clicking a tree or lamp picks the nearest one drawn under the mouse.
  - The selection shows as a yellow box.
  - Dragging moves the doodad's base along the ground.
  - The grid, paths and guides are drawn on the ground.

### 3D models
A doodad can be drawn as a real 3D model in the 3D view. Put a glTF 2.0 model (`.glb`, or `.gltf` with its files) in your project, for example in a `models` folder, select the doodad, and in its **3D Model** section enter the path (`models/Tree.glb`), its **Size** (tiles per model unit: a 3-unit-tall tree at size 1 is 3 tiles tall) and its **Turn**. On a flat map and in 2D the doodad still shows its picture, so pick a picture that matches.

Models are lit by the sun or moon, fade with the fog, take the lighting tint where they stand, and are sorted with the billboards, so characters walk in front of and behind them. They use the standing doodads' 3D height setting.

- **Animation:** a model's glTF animations play on their own. **Animation to play** takes a name or number (blank plays the first, `none` plays none), and **Animation speed** speeds it up or slows it down (0 holds the first pose). Translation, rotation and scale, with linear, step and cubic-spline easing, are read.
- **Skinned models** (characters, creatures) are posed from their joints, up to four weights a vertex.
- **Morph targets** (shape keys): a model's own weights, and animations of them (a face's expression, a squashing slime, a door bending), are read; they work with skins too.
- **Materials:** base colours and textures (embedded or next to the model), vertex colours, metal and roughness, **normal maps** (with their strength; tangents are worked out from the UVs), glow (emissive), cut-out (MASK) and see-through (BLEND) alpha, unlit (`KHR_materials_unlit`), and single- or double-sided faces. Light is worked out **per pixel**, so a smooth surface shows a small, sharp highlight wherever it falls.
- **Live reload:** while the editor is open, saving the model, its buffers or its textures in another program loads it again, and its doodads redraw.
- **In the editor**, a model doodad is picked by the triangles drawn under the mouse, and its selection box is the model's size as it is posed at that moment.
- **Drawing on the graphics card** (World → 3D Models, off by default while it is new): skinned models are posed, placed and projected on the GPU and each model is drawn into its own picture with a depth buffer, so big and moving models cost much less. On a round world, for skins with more than 32 joints, or if the graphics card refuses the shader, models are drawn the usual way. With it off, models are posed and drawn on the CPU (a still view of a still model reuses the last frame); a few hundred triangles each is comfortable.

### Battles on 3D maps
Tick **Battles show this map in 3D behind the fight** in the 3D View panel to use the map itself as the battle background: when a battle starts, the 3D view around the encounter is drawn again from a low camera looking the same way, without characters, pictures or the minimap, and replaces the battlebacks for that battle. Enemies and side-view actors are drawn over it as usual.

### Minimap and world map
Tick **Minimap in the corner** in the 3D View panel (on a flat map: **World → Minimap → Minimap on flat maps too**, or the map's own **Minimap (this map)** choice) to show a small map of the whole map in the top-right corner during play, with an arrow for the player. Tiles are coloured by what they are: water, blocked ground (mountains, walls), forest, objects and open ground, lighter where the ground is raised.

The **Show World Map** plugin command opens the whole map full screen with the player marked; OK, Cancel or a click closes it. On a planet-shaped map it is a **globe** facing the player; the left and right arrow keys turn it.

**Fog of war** (World → Minimap): the minimap and the world map show only the tiles the player has been near (**How far the player sees**, in tiles), and what was seen is kept per map in the save. **Show / Hide Minimap** hides it for a cutscene or a dark cave; **Explored Map** reveals a whole map (a bought map), reveals around the player, or forgets a map. **Minimap size** sets how big it is.

### Plugin commands
- **Set Camera (3D):** tilt, turn, zoom, field of view, round-world shape and curvature, absolute or added to the current values, eased over a number of frames, with optional wait. Use it for cutscenes: ease a flat map into a planet to show the whole world, or set the shape to Flat to ease the curve back out.
- **Reset Camera (3D):** returns to the map's own camera.
- **Set 3D View:** turns 3D on or off for the current map, or back to the map's setting.
- **Set Sky Video:** another sky video for the rest of this visit, with its shape and speed; `none` for none, blank for the map's own.
- **Set Zoom:** zooms in on the player (section 11); in 3D the camera moves in.

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
- **Select Map Event**: Clicking any tile containing an MZ Event selects it and populates Details.
- **Inspect & Edit**: See the event's name and ID; edit its Tile X/Y, Trigger type (Action Button, Player Touch, Event Touch, Autorun, Parallel) and Priority (first page). Edits are undoable and saved with the map.
- **Save Event as Template**: Click **💾 Save as Event Template** in Details (or right-click the event) to capture all pages, movement routes, script calls, and conditions into `data/DocsDoodadsEventTemplates.json` for reuse across any map in your project.
- **Duplicate & Delete**: Press **Duplicate Event** to duplicate with automatic safe ID allocation and tile offset, or **Delete Event** (with full undo/redo).

### Scripts and other plugins (`DocsDoodads.api`)

Everything works on the map the player is on unless a map ID is given. Doodads are found by the **Name** given in Details (any case), or by a query object.

| Call | Does |
| :--- | :--- |
| `find(query)`, `get(query)` | Doodads matching a Name, or `{ name, uid, art: 'Rock', near: { x, y, radius }, where: d => ... }` (`near` in tiles). `get` returns the first or `null`. |
| `doodads(mapId)`, `tileOf(query)` | A map's doodads; the tile a doodad stands on. |
| `place({ art, x, y, name, ... })` | Places a doodad (tiles; `tiles: false` for pixels) with any doodad fields (`light`, `states`, `touch`...). Returns it. |
| `move(query, x, y, { relative, tiles })`, `set(query, fields)`, `remove(query)` | Moves, changes (`art` for a new picture) or removes doodads. |
| `state(name)`, `setState(name, state)`, `stateNames(name)` | States, as Set Doodad State (kept in the save). |
| `light(name)`, `setLight(name, true / false / null)` | Lights, as Set Doodad Light (kept in the save). |
| `time()`, `setTime(h, m)`, `addTime(h, m)` | The time of day in minutes (`null` with the clock off). |
| `season()`, `seasonName()`, `setSeason(n or name)` | The season. |
| `ambient(darkness, color, frames)`, `ambient(null)` | Fades the ambient light (0 to 1), or back to the map's own. |
| `on('touch' / 'state' / 'light', fn)` | Calls `fn` with `{ doodad }`, `{ name, state }` or `{ name, on }` (and `mapId`); returns a function that stops it. |

Doodads placed, moved, changed or removed through the API change the game's copy of the map only: they last until the game is closed or reloaded and are never written to the project or to save files. States and lights are kept in the save file.

---

## 16. Direct Physical Collision System

Doodads do not require invisible blocker events to obstruct the player. Each doodad's collision box blocks the map tiles it covers at runtime:

- **Collision Presets**:
  - `None`: Completely passable (decorative flowers, grass, ceiling lamps).
  - `Full`: Blocks the entire doodad bounding box.
  - `Bottom Half`: Blocks the bottom 50% (ideal for tall statues, furniture, trees).
  - `Bottom Third`: Blocks the bottom 33% (ideal for trees, pillars).
  - `Trunk`: Narrow vertical trunk box at the base.
  - `Thin Wall`: Horizontal or vertical barrier.
  - `Wide Wall`: Thick horizontal barrier.
  - `Custom`: Interactive relative box.
- **Trace from Art**: Fits a custom collision box to the solid base of the image (a tree's trunk, a wall's foot), ignoring soft shadows. It works on placed doodads (one or many) and on assets in the Item Bag, so every new placement starts with it.
- **Visual Collision Editor**: When `Custom` is chosen, Details displays a live 64x64 interactive canvas preview. Adjust `Rel X`, `Rel Y`, `Rel W`, and `Rel H` (0.0 to 1.0) to fit collision precisely to your art regardless of scaling.

---

## 17. Sounds in the Item Bag

Click the **Sounds** tab in the Item Bag to browse BGM, BGS, ME, and SE files:
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
- **Copy / Paste across maps**: Ctrl+C writes the clipboard to disk, so it survives map changes and restarts. Pasting on another map keeps the original position; pasting on the same map offsets the copy, and **Paste in Place** (Ctrl+Shift+V) keeps the position there too.
- **Copy to Map / Move to Map** (Details): send the selection to any map in one undoable step.
- **Neighbouring maps**: link maps north/south/east/west. **Mirror Edge Doodads** copies doodads hanging over an edge onto the neighbouring map as locked mirrors, so a tree on a border shows on both sides. Running it again replaces the old mirrors.
- **World View** draws the map and its linked neighbours to scale with their doodads; edge-crossing doodads are orange. Click a map to go there.
- Looping (world) maps wrap doodads, lights, outlines and clicks with the camera, the same way MZ's characters wrap.

---

## 20. Asset Management: Where Used, Rename/Move, Duplicates, Live Reload, Packing

- **Where Used** (the asset's Details) lists every map event, page, command, database entry (actors, enemies, tilesets, system, common events, troops), doodad, and prefab that uses the file.
- **Rename/Move** renames or moves the file and updates every reference in one transaction, backing up changed files first. RPG Maker refers to most files by name inside a fixed folder, so those can be renamed but not moved to another folder; doodad images can move anywhere under `img/`. Atlas metadata and the other audio format (`.ogg`/`.m4a`) move with the file. Save first; if the project is open in RPG Maker MZ, reload it there afterwards.
- **More → File Check → Find Unused Files** lists files nothing references (engine system files are never listed). Plugins and scripts can also load files by name, so check before deleting.
- **More → File Check → Find Duplicates** finds byte-identical files and near-identical images (resized or re-saved). **More Like This** shows the images that look most like the selected one. Image fingerprints are computed once and cached in the library.
- **Live Reload**: while the workspace is open, saving an image or sound in another program updates the Item Bag, thumbnails, and placed doodads within a moment.
- **Characters** (More → **Characters**): where the **LPC character library** (a copy of the Universal LPC Spritesheet Character Generator) is on this computer. Keep it outside the project: MZ's Deployment copies everything in the project folder, and the card warns if it is inside. **Scan the Library** reads its parts, colours and credits into the editor's cache (it says when the library has changed since). **Only art that is safe to encrypt (CC0, OGA-BY)** is on for a new project: CC-BY and CC-BY-SA art may not be locked away, which "Encrypt image files" does. Every picture made from the library has its artists recorded in `data/DocsDoodadsCredits.json`; **Write CREDITS_LPC.txt** puts them in a file that ships with the game, and **Problems** says when it needs writing again and which pictures can't be encrypted. **Try it** shows a random character from the library walking (**Shuffle** for another, the arrows to turn it), to check the library reads and draws. **Open the Creator** makes a character: body, skin, head, ears and nose, face, hair and extras on the left; hat, mask, shirt, jacket, armour, cape, belt, gloves, trousers, shoes, weapons and back on the right, each with ◀ ▶ through what fits the body and a colour swatch (click it for every colour; right-click for the one before). The character walks on the stage; turn it, play its other animations (the parts that don't have one are named), and roll the dice for a new body or outfit. **Save** keeps it by name in `data/DocsDoodadsCharacters.json`; **Load** brings it back. **Credits** lists who drew what you are wearing. Keys: ↑ ↓ choose a row, ← → change it, Shift for its colour, Q/E tabs, Tab the other side, X/Y dice, Esc closes; a gamepad works the same way. In MZ's own window size the two sides take turns (Body & face / Outfit). **Export to RPG Maker** (name the character first) writes, as ticked: the **classic walker** `$Name.png` (MZ's 3-frame walk, which works without the plugin); the **smooth walker** `$Name[f9][w2].png` with `$Name_idle[f2].png` and `$Name_run[f8].png`, and the animation set that plays them (breathing after standing a moment, running when dashing); and the **face** in `img/faces/Name.png`, in the slot you pick (the sheet's other faces are kept; held weapons and back gear are left out of it). Pick the sheets in MZ's database as for any character. Every file's artists are recorded and `CREDITS_LPC.txt` is written again; a character using art that can't be encrypted says so. Exporting again asks before replacing pictures. **Try on the player** shows it on the player at once (this playtest only). Also in the export: a **side-view battler** (`img/sv_actors/Name.png`, MZ's 18 battle motions from the character's walk, idle, spellcast, guard, hurt, jump, thrust, slash, shoot and emote; pick it as the actor's battler) and **actions** for **Play Character Action**: `$Name_slash[f6]`, `$Name_thrust[f8]`, `$Name_spellcast[f7]`, `$Name_shoot[f13]`, `$Name_hurt[f6]` and others you tick (sit, emote, jump, climb...). Good speeds: slash and thrust 12 frames a second, shoot 14, spellcast 10, hurt 8 (Hold the Last Frame for a fall). LPC figures fill less of their frame than MZ's own battlers, so they look a little smaller in battle. Big weapon art drawn on larger frames (most swords and spears) isn't included yet; the dagger, wand, staff, bows and crossbow are.
- **Doodad Packs** (More → **Packs**): tick prefabs (the prefabs inside them come too), rooms, biomes, dressing rules and collections, name the pack and **Make Pack**. It is one `.ddpack` file in the project's `packs` folder with the art, state pictures, sounds and models they use and those files' Item Bag entries (cut-up slices, tags, collision). In another project, **Bring In a Pack...** shows what is in it and which files differ from yours: **Keep mine** (the default) or **Use the pack's** (yours are backed up first). Items whose ids are already used are added as new ones. Only files in the project's own folders (img, audio, models, movies, effects) are ever written.
- **Pack Map Art** (map panel → Performance): copies the art the map's doodads use into a few sheets in `img/doodads/_packed/` so deployed games load fewer textures. Playtests keep using the original files unless you tick **Use packed art in this playtest**. The panel warns when a source image has changed since packing; pack again before deploying.

---

## 21. Workspace Layouts & Custom Layout Persistence

Switch panel layout presets in **More → Panel sizes**:
- **Mapping Preset**: Wide map viewport, compact bag, full details.
- **Events Preset**: Focus on event templates and placement defaults.
- **Characters Preset**: Optimized for character sheet decomposition and NPC generation.
- **Tiles Preset**: Visual grid layout for decorative tiles.
- **Compact Preset**: Minimal UI footprint for small laptop screens.
- **Draggable Splitters**: Click and drag the vertical divider between the Item Bag and the map, or Details and the map to resize panels in real time (200px to 800px), or fold them away with their arrow buttons.
- **Save Custom Layouts**: Click **+** beside the layout list in More to save your current panel dimensions, where the panels are docked and the thumbnail zoom as a named preset in `data/DocsDoodadsLayouts.json`.
- **Docking**: drag the Item Bag or Details by its title to the left, the right or the bottom of the window (the drop zones light up), or pick **Left**, **Right** or **Bottom** for each in **More → Look**. A panel along the bottom resizes from its top edge; two panels on one side share it, one above the other; two along the bottom sit side by side. The map's status bar, hint and readouts move out of the way. Where the panels are is remembered for each layout on this computer.

### Accessibility
- Every control has a name for screen readers (icon buttons say their tooltip, fields their placeholder), the panels are named regions, and messages and the hint are read out as they come.
- **The keyboard**: Tab and Shift+Tab move through the controls with a visible ring; **F6** (Shift+F6 back) goes from the top bar to the Item Bag's search, the map and Details; in the Item Bag the **arrow keys** move between items (Home and End too) and **Enter** or Space picks one. Details sections open with Enter on their title.
- **Less motion** (More → Look), or the system's reduced-motion setting, stops the editor's animations and the moving thumbnails.

### Editor language
The editor is in English. **More → Look → Editor language** lists any translations in `data/DocsDoodadsLanguages`: a file `<code>.json` (for example `de.json`) with `"language"` (its own name) and `"strings"`, the English words with their translations. Words that hold values use `{name}` (`"Placed {n} doodad(s)"`), and the translation keeps it. Anything not translated stays English. `npm run strings` writes `languages/template.json` with every English string the editor shows, for a translator to fill in. Switching back to English shows every part in English after the editor is opened again.

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
5. **Autosave Crash Recovery**: A background heartbeat writes current session staging data to `data/DocsDoodadsRecovery.json` every 60 seconds. If playtest is closed unexpectedly, the workspace offers to resume your unsaved changes upon restart. Closing the window on purpose asks to save first; choosing **Don't Save** there also removes the snapshot, so it isn't offered again.
6. **Transactional Multi-File Save**: Map, doodad, and asset-library changes are staged and validated together. Doodad data is written with its keys in a fixed order, so the same data always gives the same file (small diffs in Git); with **Doodad Files: One file per map**, each map's doodads are their own file. If a later file cannot commit, earlier files are restored and the workspace remains dirty so the save can be retried.
7. **Manual Backup Restore**: Open **More → Info → Restore Project Backup…**, select the current map, doodad data (this map's file with **Doodad Files: One file per map**), or asset library, and choose a snapshot. The backup JSON and path are validated, and the current file receives another timestamped safety backup before restoration.

---

## 23. Complete Keyboard Shortcuts Cheat Sheet

Every key below except the *fixed* ones can be changed in **More > Keys** (or **Keyboard Shortcuts** in Ctrl+K): click a key, press the new keys, and Esc keeps the old ones. A key already in use asks before it moves. Your keys are kept on this computer; the tooltips, menus and the command palette show them. The table lists the keys the editor comes with, and the rows with no key are tools and views you can give one.

<!-- shortcuts:start (written by npm run shortcuts from src/11_shortcuts.js) -->
| Keys | What it does | Group |
| :--- | :--- | :--- |
| **F10** (the Editor Key parameter) | Open or close the editor | Playtest |
| **Ctrl** + **Z** | Undo | Editing |
| **Ctrl** + **Y** | Redo | Editing |
| **Ctrl** + **S** | Save everything | Editing |
| **Ctrl** + **D** | Duplicate the picked doodads | Editing |
| **Ctrl** + **C** | Copy the picked doodads | Editing |
| **Ctrl** + **V** | Paste beside the cursor | Editing |
| **Ctrl** + **Shift** + **V** | Paste in Place (where they were copied) | Editing |
| **Ctrl** + **A** | Select All | Editing |
| **Delete** | Delete the picked doodads or event | Editing |
| **Arrow keys** | Nudge the picked doodads 1 pixel (Shift: 16) or the event 1 tile *(fixed)* | Editing |
| **Ctrl** + **K** | Find a Tool (command palette) | Panels |
| **H** | Fold or open Details | Panels |
| **F** | Search the Item Bag | Panels |
| **Shift** + **/** | Keyboard Shortcuts (this list) | Panels |
| **F6** | Go to the next panel (top bar, Item Bag, map, Details) | Panels |
| **Shift** + **F6** | Go to the panel before | Panels |
| **Arrow keys, Enter** | In the Item Bag: arrows move between items, Enter picks one *(fixed)* | Panels |
| **G** | Show or hide the grid | View |
| *(no key)* | Show or hide collision | View |
| *(no key)* | Show or hide sounds | View |
| *(no key)* | Show or hide speed | View |
| *(no key)* | Select tool | Tools |
| *(no key)* | Stamp tool | Tools |
| *(no key)* | Scatter tool | Tools |
| *(no key)* | Paint tool (biomes) | Tools |
| *(no key)* | Path tool | Tools |
| *(no key)* | Hills tool | Tools |
| *(no key)* | Regions tool | Tools |
| *(no key)* | Tiles tool (MZ tiles) | Tools |
| *(no key)* | Grab tool | Tools |
| *(no key)* | Rooms (room stamps) | Tools |
| **[** | Smaller brush (Scatter, Paint, Hills, Regions) | Tools |
| **]** | Bigger brush | Tools |
| **Enter** | Place props along the path being drawn *(fixed)* | Tools |
| **Backspace** | Remove the last path point *(fixed)* | Tools |
| **Escape** | Stop the tool, unpick, close pop-ups *(fixed)* | Tools |
<!-- shortcuts:end -->

With the mouse:

| Mouse | What it does | Where |
| :--- | :--- | :--- |
| **Shift + Click / Drag** | Marquee multi-select or toggle doodad selection | Map |
| **Alt + Click** | Grab: pick a placed doodad's art in the Item Bag | Map |
| **Drag a doodad** | Move with smart guides (**Alt**: free, **Shift**: tile grid) | Map |
| **Right-drag** | Erase the picked item inside the brush | Scatter |
| **Double-click** | Place props along the path being drawn | Path tool |
| **Middle-drag** / **Shift + middle-drag** / **Wheel** | Orbit / pan / zoom the 3D view | Map (3D) |
| **Mouse Wheel** | Scroll the Item Bag | Item Bag |
| **Ctrl + Wheel** | Zoom the Cut Up Sheet canvas (100% to 1600%) | Cut Up Sheet |

---

## 24. Troubleshooting & FAQ

### Q: Why isn't the editor opening when I press F10?
- Verify that playtest is running under NW.js (not launched from an external standard browser without Node filesystem access).
- Verify in **Plugin Manager** that `Docs-Doodads` is turned **ON** and `Editor Enabled` is set to `true`.
- Check if another plugin intercepts `F10`; you can change the `editKey` parameter to another key or a chord such as `Ctrl+F10`.

### Q: Can I safely deploy my game to players?
- **Yes.** In deployed builds (`test: false`), all editor UI, DOM elements, filesystem listeners, and slicer modals are stripped from execution. Placed doodads, effects, lights and collision render normally. If you packed map art, pack again after changing source images; a pack built before a change keeps the old art.
- In **File → Deployment**, leave **Exclude unused files** off: MZ only knows the files its own database and events use, so it leaves out every doodad picture (all of `img/doodads`) and sounds that only Doc's Doodads uses. If a doodad's picture is missing anyway, the game doesn't stop at MZ's "Failed to load" screen: that doodad is skipped and the console says which file it was. Image and audio encryption are fine; the plugin reads encrypted files.
- The deploy script's build was checked against MZ's own (same key): every file is the same byte for byte, except `data/System.json`, which MZ writes again from the editor.
- To try a deployed build without the editor, run `npm run deploy -- <project folder> <output folder>` in this repository. It makes a Windows build the way MZ's Deployment does with encryption on (Game.exe, encrypted `img/` and `audio/`, the key in `System.json`, developer tools off); run its `Game.exe`. Add `--no-encrypt` for a plain build, `--key <text>` for your own key, `--devtools` to keep the developer tools, or `--runtime <folder>` if MZ's `nwjs-win` folder isn't found.

### Q: Why do my house interiors get dark at night?
- The day/night clock applies to every map that doesn't set its own darkness. In the map panel, set **Day and night on this map** to *Ignore (indoors)* for interiors, or give the map its own ambient darkness.

### Q: Post-processing makes my game slow on older PCs or phones.
- Set **Quality** to *Low* in **More → Screen Looks** (it skips tilt-shift and lightens bloom), use fewer effects, or let players pick a lower **Effects Quality** in Options.

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
- **Font**: the editor's font is Nunito, under the SIL Open Font License 1.1 (`art/fonts/Nunito-OFL.txt`).
