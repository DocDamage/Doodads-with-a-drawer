// @editor-only
// Guide headings and the first paragraph of each section. Run npm run help after editing the guide.
DocsDoodads.HelpIndex = [
    {
        "title": "Doc's Doodads — User Guide & Technical Reference",
        "anchor": "docs-doodads--user-guide--technical-reference",
        "firstParagraph": "Plugin: Docs-Doodads.js (v2.0) Compatibility: RPG Maker MZ. MV is untested since 2.0 and unsupported (see the README). Map dimensions: map/editor geometry reads MZ's live tile and screen sizes. Played in MZ with 32-pixel tiles at 1280 × 720 on an interior, town, looping field and cave, flat and in 3D; the earlier QA uses 48-pixel tiles. Automated tests also cover 16-pixel tiles, which have not been played in MZ. Art sizes and effect distances remain pixels by design. See the tile-size QA record for the checks. License: MIT License. Based on QJ-Doodads by Qiu Jiu. Quick reference: every notetag, image name tag and plugin command is listed in the Cheat Sheet."
    },
    {
        "title": "1. Overview & Vision",
        "anchor": "1-overview--vision",
        "firstParagraph": "Doc's Doodads transforms the traditional RPG Maker in-game doodad editor into a high-performance visual asset management, placement, slicing, and event-authoring workspace."
    },
    {
        "title": "2. Quick Installation & Setup",
        "anchor": "2-quick-installation--setup",
        "firstParagraph": "> Coming from QJ-Doodads? Remove QJ-Doodads.js from Plugin Manager and add Docs-Doodads.js in its place. Your existing DoodadsQJ.json, asset library, templates, layouts, backups, and plugin settings are read automatically and saved under the new names the next time you save."
    },
    {
        "title": "3. Plugin Parameters Reference",
        "anchor": "3-plugin-parameters-reference",
        "firstParagraph": "Configure these options directly inside RPG Maker's Plugin Manager:"
    },
    {
        "title": "4. The Item Bag & Search",
        "anchor": "4-the-item-bag--search",
        "firstParagraph": ""
    },
    {
        "title": "Guessed settings on new pictures",
        "anchor": "guessed-settings-on-new-pictures",
        "firstParagraph": "A picture with a clear name, tag or folder can start with useful settings: a lamp is lit after dark, a tree has gentle sway and see-through, and water sits below characters. Ambiguous names and unknown pictures receive no guess. Character sheets are excluded. Saved depth, collision and other item defaults take priority. Older collision defaults are preserved."
    },
    {
        "title": "The editor at a glance",
        "anchor": "the-editor-at-a-glance",
        "firstParagraph": "New installs start in Simple mode: Select, Stamp, Scatter and Tiles, with a short Details panel. Show Everything on the top bar brings back the full editor; Keep It Simple shortens it again. The same switch is in View → Look and Find a Tool. Ctrl+K and the keys still reach every tool. A hidden tool used that way stays on the bar until Done. Existing saved editor preferences keep the full editor on the first run after an update."
    },
    {
        "title": "Player Photo Mode",
        "anchor": "player-photo-mode",
        "firstParagraph": "During play, P opens Photo Mode on the current map. The map, events and timer pause while sprites keep rendering. Arrows move the flat camera within four tiles of the player, or turn the 3D view; the wheel zooms. Choose a screen look, hide the player and followers, then Save PNG. The controls stay out of the picture. Escape or Exit returns the exact camera, look, zoom and visibility from before composing. A failed capture also returns to play."
    },
    {
        "title": "Navigation & Views",
        "anchor": "navigation--views",
        "firstParagraph": "- Category Tabs: icon tabs for Doodads, People, Tiles, Pictures, Prefabs, Sounds, Favourites, Recently used, Everything, Faces, Battlers, Backdrops and System (hover for the name; the bag's title shows the open one). - Virtual Collections: Group assets into custom collections (e.g., \"Castle Set\", \"Dungeon Props\") without duplicating files on disk. Pick one in the collection list under the bag's search box or type collection:\"Castle Set\"; the ✕ beside the list deletes the shown collection (its assets stay). - Right-Click Card Context Menu: Right-click any asset card to open an instant action menu: - Place as Doodad / Place as Real MZ Event... - Add to Favorites / Remove from Favorites - Add to Collection... / Remove from \"Castle Set\" (one item per collection the asset is in) - Open in Slicing Modal / Export Slices to PNGs - Play Audio Preview / Stop Audio - Picking several: Ctrl+click cards to pick them one by one, Shift+click to pick the run from the last one clicked (the item shown in Details counts as the first). A bar above the cards then acts on all of them: Tag (adds tags), ★ (favourites; again to take the star off), Collection, Move (to another folder, updating every map, event and prefab that uses them, as Rename/Move does; save your changes first) and Delete (only files nothing uses: they go to data/docsdoodadscache/deleted/, from where you can put them back by hand). A plain click picks none again. - Thumbnail Slider: Zoom cards smoothly between 48px and 160px."
    },
    {
        "title": "Your first map",
        "anchor": "your-first-map",
        "firstParagraph": "The small corner card ticks off five steps as you do them: place three things, add a lamp, make it night with the preview clock, Play From Here, then reopen the editor and Save. Show me points at the next control and explains what to do. With no art, Add Sample Items supplies some. Not now hides the quest until the next editor open; Skip is remembered. Finished quests stay finished. How to Use and Find a Tool can replay it, starting fresh steps on the current map without changing its content."
    },
    {
        "title": "Tokenized Search Syntax",
        "anchor": "tokenized-search-syntax",
        "firstParagraph": "Type directly into the search bar (press F to focus). Search is evaluated dynamically in under 30ms across 25,000+ assets: - chest: Finds any asset with \"chest\" in its name, tag, or path. - tag:nature or tag:\"deep forest\": Filters for assets with the manual or auto-tag. - collection:\"Castle Set\": Filters for assets belonging to a virtual collection. - type:charactersheet: Filters specifically for character sheets. - category:Audio: Filters for sound files. - favorite:true: Shows only starred/favorite assets. - animated:true: Shows only multi-frame or animated assets. - used:no / used:yes: Files no map, event, database entry, doodad, or prefab uses (or that something does use). - -tree: Negative search; excludes any asset matching \"tree\". A minus works on the others too: -tag:\"deep forest\", -type:charactersheet, -folder:enemies, -collection:\"Castle Set\", -category:Audio. - Combined Example: prop123 tag:tree -dead category:Doodads collection:\"Castle Set\""
    },
    {
        "title": "5. Intelligent Slicing Engine & Cut Up Sheet",
        "anchor": "5-intelligent-slicing-engine--cut-up-sheet",
        "firstParagraph": "The workspace features a multi-tiered slicing engine that segments composite sheets into individual reusable assets:"
    },
    {
        "title": "6. Drag-and-Drop Placement & Modern Map Editing",
        "anchor": "6-drag-and-drop-placement--modern-map-editing",
        "firstParagraph": ""
    },
    {
        "title": "A picture preview on the map",
        "anchor": "a-picture-preview-on-the-map",
        "firstParagraph": "While placing a picture doodad, the preview is a translucent version of the real map sprite. It sorts behind and in front of scenery by its base, animates, and shows its light, shadow and reflection. Scatter, Paint and Path preview up to twelve of the next placements. Their preview plans keep the random sequence and path jitter used by the committed stroke. The small HTML picture still follows a bag drag before it reaches the map; event and prefab drags retain their existing preview."
    },
    {
        "title": "Placing Assets",
        "anchor": "placing-assets",
        "firstParagraph": "- Drag & Drop: Drag any asset or slice from the Item Bag directly onto the live game map. A translucent Ghost Follower tracks your mouse with exact dimensions. - Snapping: Snaps to the map's tiles by default (or the Grid Snap Width / Height parameters). Hold Alt while dragging or dropping for free pixel-perfect placement. - Stamp Mode: Click the Stamp tool in the top bar to click-to-place repeated props (grass, barrels, trees) across the map. Press Escape or right-click to exit. - Scatter & Settings: Click the Scatter tool to paint scattered props. Its card lets you tune Size, How many, Space between, and under Variety the size, tilt, flip and colour changes (props never land closer than Space between, including to props already there). Rules keep props on chosen regions or terrain tags and can skip impassable tiles (water, walls). A circle on the map shows the brush; right-drag erases the picked item inside it (one undo step a stroke; locked doodads and ones on hidden or locked layers stay). [ and ] make the brush smaller or bigger (Paint, Hills and Regions too). - Path Tool: Click Path, then click points on the map (tile-snapped; hold Alt for free points). Double-click or press Enter to place the selected asset evenly along the line; Backspace removes the last point. Settings: spacing, random offset, turning pieces along the path, and smoothing. Choose separate End and Corner pieces from the Item Bag for fences, walls, and rows of lamps. - Prefabs: Select doodads and click Save Prefab in Details. Events under the selection can be included. The selection becomes the prefab's first linked copy. Place prefabs from the Prefabs tab by dragging, with Stamp, or Place at Player. Copies are grouped. Edit one copy and click Update Prefab, then Sync Copies to rebuild every copy on every map from the master. Detach unlinks a copy. - A copy's own settings: change a setting in Details on one copy (a lamp's colour, a sign's switch, a Name) and it becomes that copy's own, marked ●: Sync Copies keeps it while the rest follows the master. Details lists a copy's own settings above its buttons; Use Prefab's gives one back to the master's value. Positions inside a copy always come from the prefab (move the whole copy, or Update Prefab). Update Prefab takes the copy's own settings into the master. - Prefabs inside prefabs: save a selection that holds a whole copy of another prefab and that prefab goes inside the new one (the new prefab's Details says what it holds, and the inner one's says what it is inside). Changing and syncing the inner prefab changes every copy of the prefabs that hold it too, and a copy's own settings for the inner doodads go in with it. Deleting an inner prefab leaves its doodads in the prefabs that held it. - Room stamps (Map → Rooms): Save a Room from the Map, then drag over part of the map. Its tiles (all four layers, shadows and regions), the doodads standing in it and the events on it become a room. Pick a room's Place and click where its top-left corner goes, on this map or any other; each placement is one undo step and is saved with the map. The ticks choose what to place (tiles, doodads, events). Keep tiles under empty ones (on by default) leaves the map's tile wherever the room has nothing on an upper layer. Parts that would fall off the map are left off; events get new ids. Autotile edges are copied as they were, so a room's border may want touching up in MZ. Rooms are kept in data/DocsDoodadsRooms.json. - Grab: Hold Alt and click any placed doodad or MZ event on the map (or use the Grab tool) to find and pick that asset or event template in the Item Bag."
    },
    {
        "title": "Selection, Multi-Selection & Right-Click Context Menu",
        "anchor": "selection-multi-selection--right-click-context-menu",
        "firstParagraph": "- Click: Select a placed doodad or genuine MZ Event on the map. - Drag to Move: Press on a doodad and drag. Pink smart guides snap its edges, centre and base line (where it stands) to nearby doodads; orange guides show equal spacing between neighbours; with nothing near, teal guides snap an edge or the base line to a tile line. A readout beside the cursor gives the position, tile and size in pixels and tiles. Hold Alt to move freely or Shift to snap to the tile grid. A drag is one undo step. - Show Collision (View, or Ctrl+K): every doodad's collision box, coloured by preset, with the tiles doodads block shaded red and the tiles the map itself blocks shaded grey, and a key to the colours. Doodads hidden in the game are drawn faintly and block nothing. Flat maps only; the choice is remembered. - Status bar (along the bottom of the map): the tile and pixel under the cursor, the map, what is picked, the layer new doodads go on, the zoom, and Not saved or the time of the last save. - Right-Click Canvas Context Menu: - On Doodad: Bring Forward (+1 Z), Send Backward (-1 Z), Bring to Front, Send to Back, Duplicate (Ctrl+D), Lock/Unlock, Hide, Move to Layer, Select Same Art, Select Everything on its layer, Replace Art..., Delete (Del). Right-clicking one of several picked doodads keeps them all picked, and every item acts on all of them (the Z order too). - On MZ Event: Save as Event Template..., Duplicate Event, Delete Event. - On Empty Map: Toggle Grid Overlay (G), Paste Copied Doodads (Ctrl+V), Paste in Place (Ctrl+Shift+V), Select All (Ctrl+A), Invert Selection, Show Hidden Doodads (when some are hidden), Stamp Asset Here, Play From Here (Ctrl+Enter). - Play From Here (right-click an empty tile, or Ctrl+Enter with the mouse over one, or Ctrl+K): the editor closes and the player stands on that tile, flat or in 3D, to try what you just built. Unsaved work is asked about first, as Done does. If the clock bar is previewing a time or a season, it asks whether to start then or at the game's own time. A tile the player can't stand on (off the map, a wall or water with no way on or off, or a doodad's collision) is refused with the reason, and the nearest free tile is offered. - Duplicate Event puts the copy one tile to the right, or on the nearest free tile inside the map when that one is off the edge or has an event. - Select All, Same Art, Layer, Invert: these pick only what Select can reach (not doodads hidden in the editor or on hidden or locked layers). Same Art matches the picture however its path is written. - Hidden doodads: a doodad hidden in the editor (Hide) can't be clicked or boxed. Show Hidden Doodads (right-click the empty map, Ctrl+K, or the button under Layers in the map's Details) shows them all again and picks them, in one step to undo. Layers counts them in brackets beside each layer. - Replace Art: a new picture for the picked doodads, or for every doodad showing the same picture on this map or on every map. Type or choose the picture (the last one picked in the Item Bag is suggested); position, size, depth, motion, lights and collision stay, the frame size follows the new picture, and locked doodads are left alone. It is one undo step. An Item Bag picture's right-click menu has Replace Art on Maps..., which pairs with Where Used. - Marquee Drag Box: Click and drag on empty map space with the pointer tool to draw a blue selection box: the doodads whose foot is inside it are picked. Ctrl + drag picks every doodad the box touches (a tall tree whose top is in the box), and Alt + drag draws a lasso around the feet to pick. Pick doodads in a region... (Ctrl+K) picks the doodads standing in a region. - Find Doodads (Map, or Ctrl+K): search this map or every map by words (the picture, the Name, a tag) and filters: tag:, name:, layer:, has:light, has:sound, has:collision, has:states, has:touch, is:locked, is:hidden, with - to leave out (tree has:light -is:hidden). Each result has Go To (other maps too); Pick All picks this map's results so Details changes them together, and Hide, Show, Lock and Unlock act on all of them as one undo step. - Outliner (Map, or Ctrl+K): this map's doodads by layer, each with Hide/Show and Lock/Unlock, a click to pick it (a hidden one is shown first), Show Hidden, and Solo to see only one layer while editing (nothing is saved; closing the outliner shows them all). - Shift + Click / Shift + Marquee: Add or toggle doodads in the active multi-selection. - Handles: a picked doodad (one, on a flat map) shows corner handles and a knob above it. Drag a corner to resize it around its foot (it stays standing where it was); Shift keeps its proportions. Drag the knob to turn it; Shift snaps to 15 degrees. Each drag is one undo step. - Animation (Details, for a doodad drawn as a strip of frames): frames across and down (the picture is split evenly), speed (game frames per picture; 0 holds still), the frame to start on, and Play: Loop, Back and forth, Once (when its switch turns on; again each time it turns on) or Hold one frame. - States (Details): give the doodad a Name (events find it by this; doodads with the same name follow together), then + Add State. State 0 is the doodad as placed; each other state can show another picture (Use Picked Art takes the one picked in the Item Bag) and can turn the doodad's Light and Collision off. Switched by: Events only, a switch (off shows state 0, on shows state 1) or a variable (its value picks the state). Crossfade is how many frames the old picture takes to fade. Preview shows a state on the map while editing (nothing is saved). Each state can play a Sound and an Effect (from the Effects Maker) when the doodad goes into it, and go Back after some seconds to the state it was in (a trap that resets, a door that swings shut); the countdown is kept in the save. - Touch (Details): a common event to run when the player presses Action facing the doodad (or clicks it), or, with Runs on: Walking into it, bumps into it or steps onto it. Also go to its next state makes a door that opens and closes with no event at all. Inside the common event, DocsDoodads.WorldState.touched() says which doodad it was (name, state) and where (mapId, and x, y: the tile its base stands on). Only once makes a chest: it runs one time, and the save remembers (DocsDoodads.api.resetTouch(name) lets it run again). Wait between touches keeps a lever from running twice in a row. Prompt (for example Open, Read or !) shows in a small bubble over the doodad while the player faces it. - Several picked: Details shows \"—\" where the picked doodads differ (a half-ticked box, a \"— mixed —\" choice); changing a field sets it on all of them. Placement sets their X, Y, Z-order, turn and size. - Number boxes in Details: drag the label left or right to change the number (Shift for bigger steps), or use the arrow keys. - Nudge: Press Arrow Keys to nudge selected doodads by 1 pixel (Shift + Arrow Keys for 16 pixels, Ctrl + Arrow Keys for a tile, refused where the 3D terrain is too steep for a doodad); a run of presses is one undo step. Arrow keys also nudge selected MZ Events by 1 tile (saved with the map, undoable). - Duplicate: Press Ctrl + D to duplicate all selected doodads (+16px offset) or selected event. - Copy / Paste: Press Ctrl + C to copy selected doodads and Ctrl + V to paste them. - Delete: Press Delete to remove selected doodad(s) or selected event."
    },
    {
        "title": "Alignment & Distribution",
        "anchor": "alignment--distribution",
        "firstParagraph": "When 2 or more doodads are selected, Details exposes one-click alignment tools: - Align: Left, Center X, Right, Top, Center Y, Bottom. - Distribute: Horizontal Distribution, Vertical Distribution, or in a row / column so many pixels apart. - Snap to Grid: each one's foot to the middle bottom of the grid cell it stands in."
    },
    {
        "title": "Organization & Layering",
        "anchor": "organization--layering",
        "firstParagraph": "- Grouping: Click Group to link selected doodads (d.groupId). Clicking any member selects the entire group. - Locking: Click Lock (or press lock in Details). Locked doodads cannot be nudged, dragged, or accidentally deleted. - Hiding: Click Hide to toggle editor visibility of decorative layers without affecting runtime gameplay. - Z-Order Layering: Use the Layering buttons in Details to adjust draw order: - +1 Z (Bring Forward): Increments Z-order. - -1 Z (Send Backward): Decrements Z-order. - To Front: Places selected doodad(s) on top of all other doodads on the map. - To Back: Places selected doodad(s) beneath all other doodads."
    },
    {
        "title": "7. Depth, Appearance, Motion, Shadows & Lights",
        "anchor": "7-depth-appearance-motion-shadows--lights",
        "firstParagraph": "Select a placed doodad (or several) and open Details' collapsible sections. Every change can be undone, and dragging a slider counts as a single step."
    },
    {
        "title": "8. World Atmosphere: Day & Night, Sun Shadows, See-Through, Water, Seasons, Motion Blur",
        "anchor": "8-world-atmosphere-day--night-sun-shadows-see-through-water-seasons-motion-blur",
        "firstParagraph": ""
    },
    {
        "title": "Seasonal climate and forecasts",
        "anchor": "seasonal-climate-and-forecasts",
        "firstParagraph": "Enable World → Climate → Weather follows the season and day and set a weather table for each named season. Each row chooses Clear, Rain, Storm, Snow, Fog or Windy, its power, chance and hours per spell. Chances are weights out of 100: an unassigned share is clear, and totals above 100 scale proportionally. Identical adjacent spells join. Fog adds temporary flat-map fog banks or closes in the 3D fog; Windy controls wind with MZ rain set to none. Authored picture layers stay intact."
    },
    {
        "title": "Day and Night",
        "anchor": "day-and-night",
        "firstParagraph": "- Clock: Off, Running clock (game minutes pass while the player is on a map; saved with the game), or Read from variables (your own events set the hour and minute variables). - The running clock writes the hour (and minute) into the variables you choose, so events can check the time. - Darkness through the day is a list of keyframes (hour, darkness, colour). The map's darkness is blended between them, wrapping through midnight. The defaults go dark blue at night, orange at dawn and dusk, and clear by day. - Lamps: set a doodad's Light to After dark and it fades on once darkness passes Lamps switch on at darkness, and off again in the morning. - Preview a time while editing scrubs the clock without changing the game. - Per map: Day and night on this map is Auto (follow the clock unless the map sets its own darkness, so caves stay dark), Follow the clock, or Ignore (indoors). - Plugin commands: Set Time of Day, Pass Time, Clock Control (pause, resume, speed), and Set/Reset Ambient Light, which still win over the clock while they are active. Set Time of Day keeps the day even when the new hour is earlier (give it a Day to change that); Pass Time past midnight starts the next day. - The clock outside the map: tick The clock runs in battles and in menus to keep time passing there, and set Minutes a battle takes to add that much when a battle ends (inns and sleep use Pass Time). - Calendar: the running clock counts days from day 1. Day variable and Weekday variable follow it (the weekday is 1 for the first name in Weekdays), and Named dates gives days a name (30 Harvest Festival; 1 Market every 7). The Calendar command goes to a day, moves days on, or puts the day, the weekday or the date's name in a variable; scripts use DocsDoodads.api.day(), weekday(), weekdayName(), dateName() and setDay(n). - Play Doodad Animation plays a named doodad's strip of frames once, now (a chest lid, a door), from and to the frames you give, holding the last one or going back to its own animation; with Wait the event goes on when it ends, and scripts hear animationEnd."
    },
    {
        "title": "Sun and Shadows",
        "anchor": "sun-and-shadows",
        "firstParagraph": "- The sun rises in the east and sets in the west. Morning shadows point west, noon shadows are short and point up the screen, evening shadows point east, and a faint moon does the same at night. You can use a fixed direction or a variable (degrees) instead. - Characters cast shadows gives the player, followers and events a soft shadow cut from their own sprite. It follows the sun, stays on the ground while jumping, and is correct in tall grass. - Which events: every event that stands up (same priority as characters), or only tagged ones. - Stop shadows at regions: list roof or overhang region IDs, and shadows end at their edge instead of being sliced by upper tiles. - Doodad shadows can Follow the sun (Shadow section) instead of keeping a fixed lean. - Event tags, in the note box or a comment on the active page: <shadow>, <shadow: length 0.8, opacity 0.4>, <no shadow>. - Per map: Character shadows on this map."
    },
    {
        "title": "See-Through",
        "anchor": "see-through",
        "firstParagraph": "When the player walks behind a tall doodad (a tree, a roof, a tower), it fades so the player stays visible. Or the player is drawn as a coloured outline, or both. - Auto applies to standing doodads at least 1.5 tiles tall. - Set See-through to Always or Never per doodad in its Atmosphere section. - In the 3D view, hills and standing tileset objects are revealed too (section 14). There the outline is drawn over whatever hides the player: the player and their gear as one shape in the Outline colour."
    },
    {
        "title": "Water Reflections",
        "anchor": "water-reflections",
        "firstParagraph": "- Characters and standing doodads get a rippling mirrored copy on the water tiles below them. Bridges over water are left alone. - Add a region to treat painted areas (ponds drawn with B-E tiles) as water. - Shore margin keeps a strip along the waterline clear, because MZ water tiles draw their own sand or grass edge. Reflections start where the water visibly begins. - Turn it off per map, per doodad (Reflect in water), or per event with <no reflection>."
    },
    {
        "title": "Normal maps on flat maps",
        "anchor": "normal-maps-on-flat-maps",
        "firstParagraph": "Enable World → Normal Maps to shade pictures and characters with nearby lamps. Put Treen.png beside Tree.png, with the same dimensions, or pick the art and choose Make Normal Map in Details for a rough map from its brightness and edges. Hand-painted normals give better results. Normal companions are hidden from the Item Bag and included in the required-art list for deployment. Renaming or moving a picture keeps its companion and manifest together."
    },
    {
        "title": "Generated maps",
        "anchor": "generated-maps",
        "firstParagraph": "Map → Generate Map builds a seeded Dungeon or Wilderness in an area that fits the current MZ map. Choose a seed, size and floor/wall/path tile IDs, then room stamps or biomes. Each wilderness biome can use a different tile ID. Preview changes nothing, Reroll advances the seed, and Apply writes autotile-shaped tiles, stamp events/doodads and seeded biome/dressing art as one undo step. Unchecked room stamps mean plain rooms. A selected stamp that is missing or has no compatible door openings stops generation without changing the map."
    },
    {
        "title": "Heat haze",
        "anchor": "heat-haze",
        "firstParagraph": "In a doodad's Heat haze section choose Campfire, Lava, Desert Road (a horizontal band) or Under Water (the whole screen), then adjust radius, strength and upward drift. The selected circle's radius shows on the map. The Heat Screen Look adds a road-like band. At most eight visible sources bend the map before bloom; Low/Off quality removes the pass, and Less Camera Motion halves it. Empty maps add no heat pass. This first version is flat-map only, and stitched map exports omit screen distortion. GPU appearance checks are pending."
    },
    {
        "title": "With the music",
        "anchor": "with-the-music",
        "firstParagraph": "In a doodad's Motion or Light section, With the music chooses Bass, Middle or Treble. Music strength blends between its usual amount and the music's energy. Plants can sway and lamps can pulse together. In Particles, Emits → On a music kick sends a burst at a bass onset. Only BGM drives these effects; sound effects do not. Silent or muted BGM gives zero energy. Scripts can read DocsDoodads.api.beat() for low, mid, high (0–1) and kick for this frame. One analyser is shared and released when unused."
    },
    {
        "title": "Motion Blur",
        "anchor": "motion-blur",
        "firstParagraph": "Moving characters blur along their direction, more when dashing; transfers and jumps never smear. Choose everyone or events tagged <motion blur> (<no motion blur> opts out). When it is on, players get a Motion Blur switch in the Options menu."
    },
    {
        "title": "Seasons",
        "anchor": "seasons",
        "firstParagraph": "- Current season from: a variable, or the Set Season plugin command. Season names are editable. - Art swaps: each row lists one prop's art per season, and every doodad using any image in the row shows the current season's version. Empty cells keep the original. Fill rows from the map panel, or select an asset in the Item Bag and use Season Variant to add it. - Preview while editing shows any season in the editor. - A doodad's Only in ... checkboxes limit it to some seasons (flowers in spring and summer, snowmen in winter)."
    },
    {
        "title": "Appear and Disappear",
        "anchor": "appear-and-disappear",
        "firstParagraph": "Doodads hidden by a switch, condition or season can Fade, Pop, Rise, Dissolve or Crumble in and out over a set number of frames, instead of blinking."
    },
    {
        "title": "Shaped lights, presets, the flashlight and wall shadows",
        "anchor": "shaped-lights-presets-the-flashlight-and-wall-shadows",
        "firstParagraph": "- In a doodad's Light section: Preset sets the colour, size, flicker and shape at once (Torch, Candle, Campfire, Lantern, Neon pink and blue, Crystal, Spotlight, Moonbeam, Window glow); change anything after. Shape: Cone points the light one way (Points: 0 right, 90 down, 180 left, 270 up) with a Cone width. - World → Lighting on Flat Maps → Walls stop light: light stops at tiles nobody can walk on, except water (and at any regions listed as walls), so walls cast dark edges. Each light can follow that, or always or never stop at walls (Walls stop it). Shadow detail is how many rays each light casts; outlines are worked out again only when a light or the map changes. - What else stops light (World → Lighting on Flat Maps): doodads with collision (a crate, a pillar) and events marked <block light> (in their note or a page comment: a door that opens). Outlines are traced again when they move. - A light per switch or condition: a doodad's Light can show only while a switch is on, or while a condition (JavaScript) is true, and fades in and out like a lamp after dark. - The flashlight: the player can carry one (World → Lighting on Flat Maps), only while a switch is on if you like. It points where the player faces and turns smoothly; walls stop it too. The Flashlight plugin command turns it on or off for the playthrough, or back to the setting. Lights show only where the map is dark (ambient darkness, night)."
    },
    {
        "title": "Layers, wind, lightning and the camera on flat maps",
        "anchor": "layers-wind-lightning-and-the-camera-on-flat-maps",
        "firstParagraph": "- Background and Overlay Layers (the map's settings, flat maps): any number of pictures from img/parallaxes, each behind the tiles (above MZ's own parallax) or over the map (over characters, under weather and pictures). Each has how much it follows the camera (0 = fixed to the screen, 1 = moves with the map, in between = far away), its own scroll across and down, zoom, opacity, blend (normal, add, multiply, screen) and whether it repeats across and down. Fog Banks adds soft fog drawn by the game (#fog as the picture) that drifts with the wind. Layers draw in the order listed (↑ moves one further back). The 3D view has its own sky and fog, so layers show on flat maps only. - World → Weather on Flat Maps: Wind (0 calm to 1 gale), its direction and gusts; rain and storms make it windier. The wind leans doodads that Sway, pushes particles (smoke, leaves, sparks) and fog layers, and can blow leaves across the screen (with their colour). Lightning in storms flashes the screen about every few seconds in a full storm (rarer in weaker ones), and the thunder comes after: soon for near strikes, up to the delay set for far ones. Set Wind changes the wind during play, easing over some frames. - World → Camera on Flat Maps: the camera can ease after the player instead of keeping them exactly centred, and look ahead of where they walk. In the map's Camera (flat map) settings, list region numbers: while the player stands on one of them, the view stays inside the area that region covers (a room, a corridor). 2D Camera Path glides the camera through tiles for a cutscene (waiting for it, if asked), then back to the player or staying put; 2D Camera Follow follows this event, another event, or the player again, or nothing: the camera stays put until a Follow for the player. Scroll Map works with the eased camera too: the view stays where Scroll Map (or a script's setDisplayPos) left it until the player takes a step. For a cutscene where the player moves but the camera mustn't, 2D Camera Follow → Nothing (or DocsDoodads.api.freeCamera()) keeps it where it is until a Follow for the player. Zoom to Point zooms the screen in on a tile, the player or an event over some frames (scale 1 goes back); scripts use api.zoomTo({ x, y } or a character, scale, frames)."
    },
    {
        "title": "Turning effects off during play",
        "anchor": "turning-effects-off-during-play",
        "firstParagraph": "Set Atmosphere Effect switches character shadows, motion blur, water reflections or see-through on or off for the current playthrough."
    },
    {
        "title": "9. Post-Processing, Screen Effects & Map Image Export",
        "anchor": "9-post-processing-screen-effects--map-image-export",
        "firstParagraph": "Open View → Screen Looks. Changes show live on the map behind it, and every edit can be undone (a slider drag counts as one step)."
    },
    {
        "title": "Effects",
        "anchor": "effects",
        "firstParagraph": "- Bloom: bright areas glow. Threshold sets how bright a pixel must be to glow. - Colour Grading: exposure (in stops), contrast, saturation, temperature, tint, and split toning (one colour in the shadows, another in the highlights). - Vignette: darkens, or tints, the screen edges. - Film Grain: animated or still. - Chromatic Aberration: colour fringing towards the edges. - Lens Distortion: barrel or pincushion. - CRT: scanlines, screen curvature, and an RGB mask. - Pixelate - Sharpen - Tilt-Shift: blurs above and below a sharp band, for a miniature look."
    },
    {
        "title": "Looks and presets",
        "anchor": "looks-and-presets",
        "firstParagraph": "Map → Moods opens bundles such as Rainy Forest, Cosy Night Village and Cave. Point or focus one to try it; leave to put the map back. Click to keep its light, look, fog and echo as one undo step. Other settings and your own picture layers stay as they were. Time, weather and wind are previews only: use the game's clock and weather commands for play. Save Current as a Mood keeps your own bundle in this project's map presets. - Editing: Game-wide look applies to every map and to battles. Editing: This map chooses what the current map uses: The game-wide look, No effects, or Its own look. A map's own look starts as a copy of the game-wide one. - Presets: Cinematic, Golden Hour, Dreamy, Retro CRT, Noir, Horror, Underwater, Miniature and Pixel Art. Apply one, then adjust it. - Hold to Compare shows the map without effects while the button is held. Show while editing turns effects off in the editor only. - Affect pictures: off by default, so pictures and the timer stay crisp. Message windows and menus are never affected. - Quality: Low skips tilt-shift and uses a lighter bloom blur. Players also get an Effects Quality option in the Options menu (High, Medium, Low, Off, Auto). It can lower the project's quality, never raise it, and it also scales the 3D view down (section 14). Auto ignores map warm-up and long stalls, waits before lowering detail, waits longer before raising it, and remembers the settled level. Changes use a half-second frame fade or wait for an already pending transfer. Start players on Auto in Plugin Manager is off by default; existing player choices take priority."
    },
    {
        "title": "Looks by time and by region",
        "anchor": "looks-by-time-and-by-region",
        "firstParagraph": "Under the effects, the card mixes looks in on top of the game-wide or map look: - Looks by time of day (game-wide): a look from one time to another (across midnight too), easing in and out over a fade in game minutes, with a strength. Add one for a warm dusk (Golden Hour from 17:00 to 19:30) or a blue night. The clock bar at the top of the map previews any time. - Looks by region: while the player stands on a region, its look fades in (over the seconds set) and fades out again on leaving. Game-wide ones apply on every map; with Editing: This map a map gets its own, which win over the game-wide ones for the same region number (a cold crypt on region 5). Paint regions with the Regions tool; the eye button previews a region's look while editing. A transfer into a region starts with its look already in. - Each entry's look is a preset, or Copy the look above to make it its own from the look being edited. - Looks by time of day on this map (with Editing: This map) is on by default; turn it off for interiors. A map set to No effects shows none of these. - Set Post-Processing Look during play still wins over all of them; going back to the map's look brings them back."
    },
    {
        "title": "During play",
        "anchor": "during-play",
        "firstParagraph": "- Set Post-Processing Look fades to a preset, to no effects, or back to the map's own look (with its looks by time and region), over a number of frames. Use it for flashbacks, poison, night vision or boss rooms. - Play Screen Effect plays Impact Zoom, Shockwave, Chromatic Punch or Bloom Flash, centred on the player, an event, or the screen. Try them in the builder with Play. - Set Atmosphere Effect → Post-Processing turns all looks off for the current playthrough."
    },
    {
        "title": "Export Map Image",
        "anchor": "export-map-image",
        "firstParagraph": "Saves the whole map as one PNG in the project's screenshots folder and opens it in Explorer. - Scale: 100%, 50% or 25%. The largest image is 16384 pixels on a side; the editor suggests a smaller scale if needed. - Characters: include the player and events. - Lighting & colour: include lighting, bloom and colour grading. Effects shaped by the screen (vignette, CRT, lens, aberration, grain, tilt-shift) are always left out, because they would repeat across the stitched image."
    },
    {
        "title": "10. Particles, VFX, Character Animation & Traversal",
        "anchor": "10-particles-vfx-character-animation--traversal",
        "firstParagraph": ""
    },
    {
        "title": "Particles on doodads",
        "anchor": "particles-on-doodads",
        "firstParagraph": "Select a doodad and open Particles in Details. - Emitter presets: Smoke, Embers, Fire, Fireflies, Falling Leaves, Mist, Dust Motes, Sparkles, Snow, Bubbles and Magic. - Amount scales the preset's rate. - Draw places the particles above characters, or below them for ground mist. - Offsets move the emitter from the doodad's centre. - Attached VFX loops any effect from the Effects Maker on the doodad, for example a magic circle on an altar."
    },
    {
        "title": "Grass that reacts",
        "anchor": "grass-that-reacts",
        "firstParagraph": "Interaction → Bend when walked through makes grass, bushes and reeds lean away from whoever passes and spring back. Faster walkers push harder. Drop leaves when disturbed shakes out a few leaves each time someone enters."
    },
    {
        "title": "Effects Maker (VFX)",
        "anchor": "effects-maker-vfx",
        "firstParagraph": "Open Art → Effects Maker. - An effect is a list of layers: - Particles: start from a preset, then adjust rate, burst, life, speed, direction, spread, gravity, wind, size, opacity, colours, blend, shape, spawn area, flutter, twinkle and stretch (elongates particles along their motion, for flames and sparks). - Sprite sheet: any image split into columns and rows, with frames per second, loop, scale, rotation, blend, tint and opacity. - Each layer can start later than the others and sit at its own offset. - Emits for sets how long emitters run. One-shot effects end once their particles have faded. - Built-in effects: Explosion, Heal, Level Up, Smoke Puff, Magic Burst and Water Splash. Duplicate one to change it. - Preview at Player plays the effect on the map. Replay on change plays it after every edit. - Effects are saved with the project and ship with the game."
    },
    {
        "title": "Character animation",
        "anchor": "character-animation",
        "firstParagraph": "- Sheet names set the layout, so no notetags are needed: - Hero[f8]: 8 frames per row (any number up to 64). %(8) also works. - Slime[f6][d1]: a single row facing right, mirrored when facing left. - Knight[d8][f4]: 8 rows. Down, left, right and up come first, then down-left, down-right, up-left and up-right. - Hero[f9][w2]: frame 0 is the standing pose and the others are the walk, one cycle every 2 tiles at any speed, so the feet keep up with the ground (the Character Creator's walkers use it). Needs more than 3 frames. - Ogresmash[f6][b32]: each frame has 32 pixels of art below the feet (a weapon swung down past them). The character still stands where it is; its shadow, reflection, bush and gear follow the feet. The Character Creator's big-weapon actions do the same without the tag (it notes them in the project's settings, so their names stay the same). - Tagged sheets hold one character, like $ sheets. - Idle and run cycles: open the map panel's Characters section. - Add a character's sheet name. Sheets named Nameidle and Namerun beside it are found automatically, or Add All Detected finds every pair at once. - Set how long a character must stand still before idling, and the idle and run frame rates. - Run plays while dashing, and for events with move speed 5 or more. - Variant sheets are preloaded when the map loads, so switching never blinks. - Diagonal movement (8 directions) lets the player move diagonally with two keys held, sliding along walls. 8-direction sheets then show the diagonal rows. - Play Character Action plays a sheet on the player or an event, such as drinking, sleeping, farming or a sword swing. - Set the frames per second and how many times it plays (0 = until cleared). - Hold the Last Frame keeps it there for sitting or sleeping. - The event can wait until the action finishes. - Clear Character Action returns the character to normal."
    },
    {
        "title": "Traversal",
        "anchor": "traversal",
        "firstParagraph": "Open Traversal in the map panel (All maps) to give the player more ways to get around. Each ability can need a switch (0 = always), and Set Traversal (plugin command) turns one on or off for this game, or back to these settings (the player learns to swim). Traversal Action makes the player jump, take off, land or dive from an event, as if they pressed the key. - Jump (C key): a hop forward, over gaps and fences up to Jump over gaps up to tiles, and up ledges as high as Jump up ledges (terrain height). It never lands on someone or a solid doodad, and ground that is too high stops it. Optional sound; No jumping into region blocks it. - Glide: jumping off high ground carries further, by tiles further per tile of height, up to a limit. - Swim: the player walks into water nobody could walk in and back out onto land. Slower (Swimming speed change), in the water up to the waist (in the water up to pixels), with an optional swimming sheet (the character's name plus a suffix such as swim, used when the file is there) and stroke sound. No swimming in region keeps them out. - Dive (C in deep water): to the map set under this one, and back up from an underwater map. Set both maps in the map panel's Sound (this map) section, under Diving. - Fly (F key; again to land): over everything but the map's edge and No flying over region, above tree tops, with a shadow below, and drawn up off the ground in 3D. No events trigger from the air, battles only if Random battles while flying is on, and the party lands only where it could stand. - Taking off, landing, diving: each can run a common event (and scripts hear takeOff, land, dive through DocsDoodads.api.on); Land only up to this terrain height keeps the party from landing on mountain tops in 3D. - Events swim or fly too: <docs swim> in an event's note (or a comment on its current page) lets it into water, <docs fly> (or <docs fly: 32>, its height in pixels) over everything, drawn up in the air. In a move route, Script: this.docsJump() makes a character jump the way it faces, as the player's Jump does (over gaps, with its sound). Followers already follow the player anywhere. - Climb: chosen regions or terrain tags climb like ladders, past terrain-height blocking. - Ice: chosen regions or terrain tags slide the player on until something stops them. - Gamepad and touch: jump (and dive) and fly (and land) also go on gamepad buttons MZ leaves free on the map: the right and left triggers unless you pick others (or None). On touch screens (or always, or never) round Jump and Fly buttons show in the bottom right while the player can move; they read Dive, Surface or Land when that is what they would do, and a tap on them never walks the player there."
    },
    {
        "title": "11. Spatial Sound",
        "anchor": "11-spatial-sound",
        "firstParagraph": ""
    },
    {
        "title": "Event sounds in the world",
        "anchor": "event-sounds-in-the-world",
        "firstParagraph": "With Spatial Sound on (map panel, All maps), every Play SE run by a map event, and every SE in a movement route, is heard from where the event stands: - Quieter with distance: full volume within Full volume within tiles, silent past Silent beyond. - Panned left or right by direction: fully to one side at Full left/right at tiles. - Optionally varied in pitch and volume each time (Pitch variation, Volume variation, both 0 until you set them), so repeated footsteps, doors and barks never sound identical. Tag an event <no variance> to keep its sounds as authored."
    },
    {
        "title": "Ambient sounds on doodads and events",
        "anchor": "ambient-sounds-on-doodads-and-events",
        "firstParagraph": "A doodad's Sound section attaches a sound: - Background sounds (rivers, fire, wind, machinery) loop. - Sound effects (birds, drips, bells) repeat about every N seconds, at slightly irregular intervals."
    },
    {
        "title": "Echo",
        "anchor": "echo",
        "firstParagraph": "Sound (this map) → Echo adds an echo to the map's sound effects and background sounds, for caves, halls and canyons. Set the delay, how many times it repeats, and how loud it is. Music, jingles and menu sounds never echo."
    },
    {
        "title": "Background sound by region",
        "anchor": "background-sound-by-region",
        "firstParagraph": "Also in Sound (this map): give a region ID a background sound with a volume and a fade time. When the player walks into the region the sound fades in. Walking out brings back whatever the map was playing. Use it for a waterfall's roar, a windy cliff, or the hum of a shop."
    },
    {
        "title": "Zoom and sound focus",
        "anchor": "zoom-and-sound-focus",
        "firstParagraph": "In the map panel's Zoom and Sound Focus section (All maps), let players zoom in on their character with the mouse wheel, the + and - keys, or both, up to Closest zoom. Set Zoom (plugin command) does it from an event, eased over a number of frames, with optional wait. The zoom is kept in save files. Flat maps zoom MZ's screen around the player; 3D maps move the camera in."
    },
    {
        "title": "Ambience layers",
        "anchor": "ambience-layers",
        "firstParagraph": "Add Ambience (same section) adds a looping background sound that is as loud as there is of its kind around the player, panned towards it: - near water (rivers, sea), near trees (forests, ☆ tree tops), out in the open (wind, louder up high on raised terrain); - near doodads whose picture name contains some text, near a region, or near a terrain tag."
    },
    {
        "title": "Footsteps",
        "anchor": "footsteps",
        "firstParagraph": "Tick Footsteps and add footstep sounds by ground: a region, a terrain tag, shallow water, bushes and tall grass, forest, or anywhere else (regions are checked first, then terrain tags, then the kind of ground). They are quiet at normal zoom (Footsteps at normal zoom), clear when zoomed in, louder when dashing, and optionally play for followers too, softer."
    },
    {
        "title": "12. Editor Tools: Layers, Symmetry, Biomes, Dressing, History, Command Palette",
        "anchor": "12-editor-tools-layers-symmetry-biomes-dressing-history-command-palette",
        "firstParagraph": ""
    },
    {
        "title": "Map settings: copying and presets",
        "anchor": "map-settings-copying-and-presets",
        "firstParagraph": "Map → Map Settings says which settings this map has of its own. Copy from Another Map... picks a map, then what to take from it: light, shadows and reflections; the screen look; layers; camera, 3D and the minimap; echo and region sounds; everything else; and (unticked at first) that map's ground: its heights, surfaces, neighbouring maps and where it leads. This map's settings of the kinds you tick are replaced, as one undo step. Save as Preset keeps this map's settings, without its ground, under a name in data/DocsDoodadsMapPresets.json; Use Here puts a preset on the map you are on (one undo step)."
    },
    {
        "title": "Trace a picture",
        "anchor": "trace-a-picture",
        "firstParagraph": "Map → Trace a Picture keeps a drawing under the editor's grid on a flat map. Choose or drop a PNG, JPEG or WebP (up to 4096 pixels on either side). Fit to Map centres it; unlock it to drag, pull the square corner to scale, or use the round handle to turn (Shift snaps to 15 degrees). Two-point Fit asks for two places on the picture, then the two tiles they should match. Each fit or drag is one undo step. Lock it to paint and place through it. Opacity and Show picture are in the card; View → Show / Hide Trace also toggles it. The copy stays in the disposable editor cache. It never appears in play, Capture, map exports or the required-art list, and the deploy script leaves the cache out. If the cache is cleared, choose the source picture again. In 3D the tracing layer is hidden; use a flat view for fitting and painting."
    },
    {
        "title": "Layers",
        "anchor": "layers",
        "firstParagraph": "Every map has a Main layer. Add layers in the map panel under Layers (for example Ground Decor, Props, Canopy, Lights, Markers). - The layer selected with the round button receives new doodads. - Ed shows or hides a layer in the editor only, to work underneath a canopy. - Lk locks a layer so its doodads can't be clicked, box-selected or dragged. - Gm shows or hides a layer in the game. Use it for markers and notes you only want while editing. - Move doodads between layers with Editor layer in their details (Depth section), or right-click one on the map: Move to Layer. Deleting a layer moves its doodads to Main. - Everything is undoable."
    },
    {
        "title": "Symmetry",
        "anchor": "symmetry",
        "firstParagraph": "Mirror (top bar) mirrors placements left/right, top/bottom, or four ways, around axes at the map's centre or at any tile line you type. Stamps, the scatter brush and the biome brush all place the mirrored copies, flipped for left/right mirroring, in the same undo step. The axes show on the map as purple lines."
    },
    {
        "title": "Biome brush",
        "anchor": "biome-brush",
        "firstParagraph": "A biome is a weighted mix of props: for example a forest of 3 oaks : 1 pine : 2 bushes, each with its own scale range. - Make biomes in the map panel under Biomes, or select an asset and use Add to Biome. - Each biome sets its spacing, how many props each dab tries, thin at edge (sparser at the rim of the brush) and patchiness (natural clumps and clearings). - Choose Paint in the top bar, pick a biome and a size, and drag on the map. - Impassable tiles can be skipped. A stroke is one undo step."
    },
    {
        "title": "Dressing rules",
        "anchor": "dressing-rules",
        "firstParagraph": "Rules read the map's tiles and place props where they belong. Each rule has a place, a chance per tile, spacing, and a list of art: - Along water edges: reeds, rocks, lily pads. - At the foot of walls and cliffs: barrels, crates, rubble. - Beside a region: paint your paths with a region, and flowers or stones line them. - Inside a region. - On a terrain tag. - Open ground."
    },
    {
        "title": "Save history",
        "anchor": "save-history",
        "firstParagraph": "More → Old Saves lists the timestamped backups made each time you save. - Pick a doodads backup to see this map's doodads that are new, changed or deleted since then. They are outlined on the map in green, amber and red. - Pick a map backup to see its events. - Restore puts back a deleted doodad or event, undoes a change, or removes something new. Each restore is a single undo step. Event restores are saved with Save Changes."
    },
    {
        "title": "Ruler and bookmarks",
        "anchor": "ruler-and-bookmarks",
        "firstParagraph": "- Ruler (M, Map → Ruler, or Ctrl+K): press on the map, drag and let go. A readout beside the mouse gives the tiles across and down, the walk (across plus down: the steps on the grid), the straight line in tiles, and the pixels. Hold Shift to snap both ends to tile middles. The measure stays until the next one or another tool; it changes nothing. In 3D it measures on the ground. - Bookmarks keep places on big maps to jump back to. Bookmark This View (View → Bookmarks, or Ctrl+K) asks for a name and keeps the map, the tile in the middle of the view and, in 3D, the camera. Each bookmark is in Ctrl+K as Go to: name; the first nine are Ctrl+1 to Ctrl+9. Going to one on another map opens that map first. The Bookmarks card renames (click the name), moves one up (to give it a lower number) and deletes. Bookmarks are saved with the doodads and never read by the game."
    },
    {
        "title": "Map notes",
        "anchor": "map-notes",
        "firstParagraph": "Notes and to-dos pinned to tiles (\"a chest here\", \"check this door\"), seen only in the editor. - Right-click an empty tile: Add Note Here... (the words and a colour). On a tile with a note: Edit Note..., Mark Done and Delete Note. An edit with no words deletes the note. - Each note shows as a pin in its tile's corner, faded once done; rest the mouse on the tile to read it. Pins are drawn on flat maps (not in the 3D view) and are never in a Capture. - Map → Notes lists this map's notes or every map's, with a tick for done, Go To (opening the map if needed), delete, and the words to click to edit. View → Hide Notes hides the pins (remembered on this computer). - Every change is one undo step. Notes are saved with the doodads (in the main DocsDoodads.json either way of saving); the game never shows or reads them."
    },
    {
        "title": "Searching the map panel",
        "anchor": "searching-the-map-panel",
        "firstParagraph": "The map panel has many sections. Type in Search settings at its top (for example fog, shadow or snow) to show only the sections that mention every word, opened; clear it to get the panel back as it was."
    },
    {
        "title": "Undo history",
        "anchor": "undo-history",
        "firstParagraph": "The Steps button next to Undo and Redo lists the undo steps by name (Place doodad, Move doodads, Terrain height, Dress map...), oldest first, with the current point highlighted. Click a step to go back to just after it, or forward again to a greyed-out step; (Start) undoes everything. Making a new change after going back drops the greyed-out steps, as Undo does. The list holds the last 300 steps."
    },
    {
        "title": "Tiles (painting MZ tiles)",
        "anchor": "tiles-painting-mz-tiles",
        "firstParagraph": "Tiles (top bar) paints the map's own tiles during a playtest, so a map can be finished without going back to MZ. The card shows the map's tileset: tabs A1 to E. On B to E and A5, click a tile or drag across several for a block; on A1 to A4, click an autotile. Then click or drag on the map. Autotiles (water, ground, roofs, walls, waterfalls) join up with their neighbours as you paint, the way MZ's editor does it, and the tiles around a painted one change shape to match. Layer: Automatic puts A tiles on the ground layers and B to E on the upper layers (a second upper tile goes over the first); or pick a layer. Eraser takes the top tile off. Alt+click picks up the tile under the cursor. Each stroke is one undo step; Save writes the tiles into the map file with the other map changes, and the MZ editor shows them once it reloads the project. Shadow pen and the MZ editor's special wall-joining rules are not copied."
    },
    {
        "title": "Regions",
        "anchor": "regions",
        "firstParagraph": "Each region in the legend has an Area name and Show once per save. The game shows the name in its map-name banner after the player stays inside for a short moment. Clear the name to stop showing it. Store Area Name writes it into a variable; DocsDoodads.api.area() reads it, and api.on('areaEnter', fn) hears a settled entry. Names accept MZ text codes. The Regions tool paints MZ region numbers onto the map's tiles, the ones dressing rules, biomes, region sounds, footsteps, ambience, climbing, ice, no-fly zones and terrain height read. Pick the number (0 rubs regions out) and the size (1 to 13 tiles across, [ and ]), then drag on the map; each stroke is one undo step and is saved into the map file with your other map edits. Alt+click a tile to pick up its region. While the tool is out, each painted tile shows its region's colour and number. The card's legend lists the regions on this map, how many tiles each covers and what the project uses it for; click one to paint with it. Show terrain tags marks tiles that have a terrain tag (T1, T2...). Terrain tags belong to the tileset in MZ's database, so they are shown here but changed in MZ."
    },
    {
        "title": "Command palette (Ctrl+K)",
        "anchor": "command-palette-ctrlk",
        "firstParagraph": "The ? in a panel's title opens its guide paragraph. Help: … entries in Find a Tool reach every heading. Open the Guide opens that heading in a local reader; keep DocsDoodadsGuide.md beside the game's index.html for the full guide. Type a few letters of anything and press Enter: - tools, panels, Save, Undo and Redo, Toggle Grid - mirror modes, Screen Look presets, Play Effect for any effect - layers, Go to map, and any asset by file name"
    },
    {
        "title": "Animated thumbnails",
        "anchor": "animated-thumbnails",
        "firstParagraph": "Hover a character sheet in the Item Bag to watch it walk, and a door or chest sheet to see it open. An image sliced into equal frames (an animation strip) plays its frames too."
    },
    {
        "title": "13. Visual Equipment & the Map Destination Marker",
        "anchor": "13-visual-equipment--the-map-destination-marker",
        "firstParagraph": ""
    },
    {
        "title": "Visual equipment",
        "anchor": "visual-equipment",
        "firstParagraph": "Characters can be built from layered parts, like a paper doll. Give the actor a bare body as its character image, or no image and a <visual base: Body> layer. Then add hair, eyes and clothes as base parts, and let equipment swap them out."
    },
    {
        "title": "Destination marker",
        "anchor": "destination-marker",
        "firstParagraph": "The marker MZ shows where the player clicks or taps to walk can be restyled under Destination Marker in the map panel: - Marker: MZ's square, a rounded square, circle, ring, diamond, cross or arrow drawn in any colour. It can also be an image from img/system (Marker[f4] plays four frames side by side), a database animation that loops, a VFX effect, or hidden. - Look: opacity, blend (add, normal, multiply, screen), size, pulse (MZ's, breathe, ripple or still), spin and bob. - Drawn: above characters, like MZ, or on the ground beneath them. - Path dots: dots along the way the player will walk, spaced every N tiles. - Where the player can't go (a wall, deep water, a doodad's collision), the marker is a cross in its own colour (A cross where the player can't go). - Clicking a doodad with a Touch walks the player up to it; once beside it they face it and touch it. - Each map can have its own marker and colour (the map's Minimap (this map) section, Click marker on this map)."
    },
    {
        "title": "14. 3D View",
        "anchor": "14-3d-view",
        "firstParagraph": ""
    },
    {
        "title": "First-person camera",
        "anchor": "first-person-camera",
        "firstParagraph": "In this map’s 3D settings, Camera → First person puts the camera at the player’s feet plus Eye height, measured in tiles above the terrain. Look tilt and field of view have their own first-person settings. Up walks forward, Down steps back without turning the player away from an action event, and Left/Right turn 90 degrees with a short ease. The player’s own billboard disappears; followers remain. Fade nearby billboards keeps close props from filling the view and does not affect orbit maps."
    },
    {
        "title": "Camera",
        "anchor": "camera",
        "firstParagraph": "| Setting | What it does | | :--- | :--- | | Camera tilt | Degrees down from level: 89 looks straight down, 30 looks across the land. | | Camera turn | Which way the camera faces: 0 looks north, 90 looks east. | | Field of view | Wider shows more and exaggerates depth. | | Zoom | The size of things at the middle of the screen. | | View distance | How much ground is drawn, in tiles. More costs more each frame. | | Fog starts / ends | Distant ground and billboards fade out between these distances, in tiles from the camera's target. The ground's edge never shows. | | Fog colour | Fade into a colour instead of into the sky. | | Sky colour | The colour above the horizon. A map's parallax becomes the sky instead, and turns with the camera. | | Sky video | A looping, muted movie as the sky, for example movies/Sky.webm (blank for none). It shows once the video has its first frame (the sky colour until then); the sun, moon and stars still draw over it. | | Sky video shape | 360° panorama: an equirectangular video (north in the middle) that turns with the camera, one camera turn being the whole video, its equator on the horizon. Fill the sky: stretched over the sky above the horizon and staying put. | | Sky video speed / follows day and night | Playback speed (1 is normal), and whether the video darkens at night with the sky light. | | Also show the sky video behind this map when it is flat | Uses the video in place of the parallax on the flat map too. | | Beyond the map edge | The colour of ground past the map's edges. | | Round world | Planet: the ground curves away all round, like a small world. Rolling log: it curves away only ahead, so things rise over the horizon as you walk toward them. | | Curvature | How round the world is: 0 is flat, 10 is gentle, 100 is a tiny planet. Moving it off 0 turns a flat map into a planet; the radius below follows it. | | World radius | How tight the curve is, in tiles. 0 sizes a planet so one lap is the map's width: on a looping world map, walking all the way round brings you back. | | Things lean with the curve | Standing things lean outwards with the ground. Turn it off to keep them upright. | | Q / W turn the camera 90° | Players can turn the view. The arrow keys follow the camera (up walks away from it), and characters show the side facing it. | | Rippling water | Water tiles move with gentle waves that bend what shows through them (including water reflections) and catch the light. Shores stay dry, and the waves stop at the 3D ground capture instead of repeating over the void outside it. | | Ripple strength / speed / sparkle | How far the waves bend the water, how fast they move, and how bright the glints are. Glints dim at night. | | Wakes behind boats and waders | Boats, ships and anything moving through water leave spreading rings with a little foam. | | Tileset objects (B–E tiles) | Lie flat (default). Objects with ☆ tiles: anything with a ☆ (above characters) tile, like a tree top, stands up with the tile under it (the trunk); side-by-side columns of the same height stand as one wide object. Every B–E tile: also lifts every other B–E tile (barrels, signs, fences) as one-tile billboards. The map itself isn't changed: in 2D, or with this off, the tiles lie on the ground as before. They use the standing doodads' height setting. Objects drawn entirely on roofs and walls (A3/A4: eaves, chimneys, windows) stay flat; a tree in front of a house still stands. Keep tileset objects flat in region keeps anything in that region flat. | | Standing doodads / Characters: height in 3D | Shrink or grow things that stand up, in the 3D view only (the 2D map is unchanged). Tileset-sized art is often tall next to a one-tile hero: a 3-tile lamp at 0.65 stands about twice the hero's height. They stay on their feet, and gear, effects and balloons go with their owner. Editor clicks and selection boxes match. | | Sky, sun, moon and stars follow the time of day | With the day/night clock running (section 8), the sky fades from blue by day to an orange sunrise and sunset and a dark night with twinkling stars. The sun and moon cross the sky on the same path the shadows use, low ones show near the horizon, hills are shaded from wherever the light is, and water glints toward the sun or moon. Ambient darkness and lamps work as on flat maps. A map's parallax still replaces the sky. | | 3D rain and snow | MZ's Set Weather Effect (rain, storm, snow, power 1–9, with fades) falls through the 3D world around the camera: rain and storms slant with the wind and splash on the ground (raised terrain too), some drops ripple water, and snow drifts down. Trees, characters and hills in front hide the drops behind them. The screen dims with the weather like MZ's own. Off: MZ's flat weather is used instead. | | Weather density | More or fewer drops and flakes than MZ's power alone gives. | | Snow settles | While 3D snow falls, the ground slowly turns white (heavy snow covers it in about a minute) and standing doodads and tileset objects get white tops; it melts over about two minutes once the snow stops. In a season named Winter (section 8) it stays mostly white. Water stays clear when Rippling water is on. The cover is kept in save files. | | Smooth distant ground | Blends distant pixels instead of keeping them crisp. | | Cloud shadows / size / speed | Soft cloud shadows drift across the ground in daylight (they fade out at night). Size is roughly one cloud's width in tiles. | | Low fog / height | Drifting patches of mist on the ground. With terrain height on, it lies in valleys and low ground, up to the height given (tiles above the lowest ground); hilltops stay clear. |"
    },
    {
        "title": "Quality on slower machines",
        "anchor": "quality-on-slower-machines",
        "firstParagraph": "When any map uses the 3D view, players get the Effects Quality option in the Options menu, the same one post-processing uses. It lowers the 3D detail you set, and never raises it:"
    },
    {
        "title": "Terrain height",
        "anchor": "terrain-height",
        "firstParagraph": "Mountains, hills and cliffs can rise out of the ground. Open Terrain Height (this map) in the map panel and tick Raise the ground. Heights are in tiles and come from four places. The higher one in this list wins: 1. The Hills tool (top bar). Raise, lower, flatten (to where the stroke started), set an exact height, or erase back to automatic. It has a strength and a radius, and each stroke is one undo step. Painting turns Terrain Height on for the map. Before you paint, the tiles under the brush are shown on the ground (over hills in 3D), stronger towards the centre, in the mode's colour, each with its height as a number. Edge is Soft (gentle slopes, less towards the rim) or Hard (the whole circle changes the same, for plateaus and steps). [ and ] change the size. 2. Regions: for example, region 5 is 2 tiles high. 3. Terrain tags (1–7): for example, tag 3 is 1 tile high. 4. Automatic, on world tilesets: mountain tiles (impassable ground) rise to the Mountain height (1 tile by default), and forests (where airships can't land) to the Forest height."
    },
    {
        "title": "What works in 3D",
        "anchor": "what-works-in-3d",
        "firstParagraph": "- See-through: with See-Through on (section 8), tall doodads and standing tileset objects between the camera and the player fade where they cover the player (Fade and Both), to the See-Through opacity. Outline and Both draw the player and their gear again on top as one outline in the Outline colour. Hills fade in every mode. - Lighting: ambient darkness lights the ground, and lights pool around each lamp's base. Characters and doodads are lit by the lights near them. - Sun and doodad shadows lie on the ground. - Particles, VFX, balloons and animations stand with their character or doodad. Effekseer animations (MZ's own format) play where their target is drawn and shrink with distance like it; MV-style animations do too. - Post-processing and day/night tint apply to the whole view. - Touch and mouse: clicking the ground walks there. - Editor: - Mouse look: middle-drag orbits the camera (left and right turn it, up and down tilt it), Shift + middle-drag pans across the ground, and the mouse wheel zooms. A middle click without dragging goes back to the map's own camera. Like Set Camera, this only changes the view while editing; the map's 3D View settings stay as they are. - Clicks go through to the ground. - Clicking a tree or lamp picks the nearest one drawn under the mouse. - The selection shows as a yellow box. - Dragging moves the doodad's base along the ground. - The grid, paths and guides are drawn on the ground."
    },
    {
        "title": "3D models",
        "anchor": "3d-models",
        "firstParagraph": "A doodad can be drawn as a real 3D model in the 3D view. Put a glTF 2.0 model (.glb, or .gltf with its files) in your project, for example in a models folder, select the doodad, and in its 3D Model section enter the path (models/Tree.glb), its Size (tiles per model unit: a 3-unit-tall tree at size 1 is 3 tiles tall) and its Turn. On a flat map and in 2D the doodad still shows its picture, so pick a picture that matches."
    },
    {
        "title": "Battles on 3D maps",
        "anchor": "battles-on-3d-maps",
        "firstParagraph": "Tick Battles show this map in 3D behind the fight in the 3D View panel to use the map itself as the battle background: when a battle starts, the 3D view around the encounter is drawn again from a low camera looking the same way, without characters, pictures or the minimap, and replaces the battlebacks for that battle. Enemies and side-view actors are drawn over it as usual."
    },
    {
        "title": "Minimap and world map",
        "anchor": "minimap-and-world-map",
        "firstParagraph": "Tick Minimap in the corner in the 3D View panel (on a flat map: World → Minimap → Minimap on flat maps too, or the map's own Minimap (this map) choice) to show a small map of the whole map in the top-right corner during play, with an arrow for the player. Tiles are coloured by what they are: water, blocked ground (mountains, walls), forest, objects and open ground, lighter where the ground is raised."
    },
    {
        "title": "Plugin commands",
        "anchor": "plugin-commands",
        "firstParagraph": "- Set Camera (3D): tilt, turn, zoom, field of view, round-world shape and curvature, absolute or added to the current values, eased over a number of frames, with optional wait. Use it for cutscenes: ease a flat map into a planet to show the whole world, or set the shape to Flat to ease the curve back out. - Reset Camera (3D): returns to the map's own camera. - Set 3D View: turns 3D on or off for the current map, or back to the map's setting. - Set Sky Video: another sky video for the rest of this visit, with its shape and speed; none for none, blank for the map's own. - Set Zoom: zooms in on the player (section 11); in 3D the camera moves in."
    },
    {
        "title": "15. Genuine RPG Maker MZ Event Creation & Templates",
        "anchor": "15-genuine-rpg-maker-mz-event-creation--templates",
        "firstParagraph": "When an asset is dropped with Place As Event (or prompted via the interactive placement dialog), the workspace creates a genuine RPG Maker MZ event stored directly inside the active MapXXX.json file."
    },
    {
        "title": "20 Built-In Event Templates",
        "anchor": "20-built-in-event-templates",
        "firstParagraph": "Each template comes pre-configured with authentic MZ event pages, conditions, triggers, and event command sequences: 1. NPC: Action-button dialogue with face/character graphic and random movement options. 2. Door: Animated opening door with sound effect, passable transition, and transfer trigger. 3. Transfer Door: Seamless teleport transition to target map coordinates with fadeout. 4. Chest: Self-switch opening treasure chest granting gold or items with ME fanfare. 5. Loot Drop: Ground item pickup that disappears after player interaction. 6. Sign / Message: Readable inspection notice or lore plaque. 7. Switch / Lever: Toggleable switch controlling Game Switches ($gameSwitches). 8. Save Point: Interactive crystal/shrine triggering the game Save Screen. 9. Shopkeeper: NPC triggering the standard RPG Maker Shop processing window. 10. Enemy Encounter: Touch or action-triggered battle processing event with escape branches. 11. Harvestable Resource: Gathering node (plants, ores) that depletes and respawns. 12. Breakable Prop: Destructible obstacle requiring player action or tool. 13. Pushable Block: Sokoban-style pushable puzzle boulder. 14. Light Source: Decorative torch or brazier with flickering animation. 15. Animated Prop: Multi-frame looped ambient object (water wheel, machinery). 16. Teleporter / Portal: Step-on transfer pad with flash and sound effect. 17. Ladder / Stairs: Directional movement helper with passability overrides. 18. Vehicle Spawner: Spawns boat, ship, or airship at designated coordinates. 19. Sound Trigger: Plays localized environmental audio or ME upon player step. 20. Decoration Event: Lightweight event container for complex custom logic."
    },
    {
        "title": "Map Event Inspection & Custom Template Saving",
        "anchor": "map-event-inspection--custom-template-saving",
        "firstParagraph": "- Select Map Event: Clicking any tile containing an MZ Event selects it and populates Details. - Inspect & Edit: See the event's name and ID; edit its Tile X/Y, Trigger type (Action Button, Player Touch, Event Touch, Autorun, Parallel) and Priority (first page). Edits are undoable and saved with the map. - Names and icons over events: Name over it and Icon in an event's Details put a name, an icon from your IconSet (its number, as in the database's icon picker) or both over the event in the game, flat and in 3D; they write <docs label: Blacksmith> and <docs icon: 87> into its note, so you can also type them there or in a comment on one page (that page only). Add <docs label range: 4> to show it only when the player is within 4 tiles; without it, it always shows. Labels hide while a message is on screen, go when the event is erased, and aren't shown for an event with no picture that blocks the way (an invisible event the player walks through, like a door or an exit, keeps its label). World → Event Labels sets the text size and colour and whether labels fade in and out; Show / Hide Event Labels turns them all off or on for a playthrough (saved). - Save Event as Template: Click 💾 Save as Event Template in Details (or right-click the event) to capture all pages, movement routes, script calls, and conditions into data/DocsDoodadsEventTemplates.json for reuse across any map in your project. - Duplicate & Delete: Press Duplicate Event to duplicate with automatic safe ID allocation and tile offset, or Delete Event (with full undo/redo). - Managing templates: Map → Templates lists your own templates by category, with Rename, Category (pick one or type a new one) and Delete (events made from a template stay as they are). The built-in ones can't be changed. Saving a template under a name already used asks before replacing it. Packs can carry your templates to another project (an identical one is not added twice; a different one with the same name comes in as \"Name 2\")."
    },
    {
        "title": "Editing what an event does",
        "anchor": "editing-what-an-event-does",
        "firstParagraph": "Pick an event and choose Edit Commands in Details. Page tabs switch between its pages; + Page, Copy Page and Delete Page are undoable, and deleting asks first. Conditions & Page edits switches, variables, self switches, item/actor conditions, trigger and priority. Switches and variables are listed by their database names."
    },
    {
        "title": "NPC schedules",
        "anchor": "npc-schedules",
        "firstParagraph": "Pick an event and open Schedule in Details. Each line gives optional comma-separated weekdays, a time and a tile, followed by walk, hide or face:2/4/6/8 if needed. Use this tile takes the next map click. Scheduled tiles show their times in the editor."
    },
    {
        "title": "Scripts and other plugins (DocsDoodads.api)",
        "anchor": "scripts-and-other-plugins-docsdoodadsapi",
        "firstParagraph": "Everything works on the map the player is on unless a map ID is given. Doodads are found by the Name given in Details (any case), or by a query object."
    },
    {
        "title": "16. Direct Physical Collision System",
        "anchor": "16-direct-physical-collision-system",
        "firstParagraph": "When the player is near in a doodad's Details sets a range in tiles (0 is off), the state on entering and leaving (a name, next or blank), and an optional common event. Leaving has half a tile of slack so standing at the edge does not repeatedly trigger it. Only the first visit can be kept in the save. The same doodad can also have Touch; range events are near and far on api.on. A busy or already reserved common event is not queued again."
    },
    {
        "title": "17. Sounds in the Item Bag",
        "anchor": "17-sounds-in-the-item-bag",
        "firstParagraph": "Click the Sounds tab in the Item Bag to browse BGM, BGS, ME, and SE files: - Click Preview: Click any audio card to play live in-editor. An animated blue waveform indicator shows playback. - Stop: Click again or click Stop to halt audio. - Drop on Map: Dragging an audio track onto empty map tiles automatically creates a sound-trigger event, detecting whether it is BGM (241), BGS (245), ME (249), or SE (250). - Drop on Existing Event: Dragging an audio track directly onto an existing event prompts to append the play sound command sequence directly into page 0 with full undo/redo!"
    },
    {
        "title": "18. Windows Explorer Native Drag-and-Drop Ingestion",
        "anchor": "18-windows-explorer-native-drag-and-drop-ingestion",
        "firstParagraph": ""
    },
    {
        "title": "Animated GIF and APNG",
        "anchor": "animated-gif-and-apng",
        "firstParagraph": "Drop a GIF or APNG (.png or .apng), or choose it in Add Files, to make a PNG frame sheet. The original stays intact. The imported item has its frames, commonest delay and exact frame count set, so a picture placement plays immediately; Cut Up Sheet opens it like other sheets. Packs carry these animation defaults. Converting an APNG already at the target path chooses an unused name even if Overwrite was selected."
    },
    {
        "title": "19. Maps: Switching, Cross-Map Editing, Neighbours & World View",
        "anchor": "19-maps-switching-cross-map-editing-neighbours--world-view",
        "firstParagraph": "The Maps section of the map panel (shown when nothing is selected): - Go to Map moves the player there with the workspace still open. Undo history ends at a map change, because its steps belong to the old map. Unsaved event edits stay with their own map, and Save writes every map you changed to its own file. - Copy / Paste across maps: Ctrl+C writes the clipboard to disk, so it survives map changes and restarts. Pasting on another map keeps the original position; pasting on the same map offsets the copy, and Paste in Place (Ctrl+Shift+V) keeps the position there too. - Copy to Map / Move to Map (Details): send the selection to any map in one undoable step. - Neighbouring maps: link maps north/south/east/west. Mirror Edge Doodads copies doodads hanging over an edge onto the neighbouring map as locked mirrors, so a tree on a border shows on both sides. Running it again replaces the old mirrors. - Map pictures: after a map has been opened, its tabs, Go to Map list, Go to map rows in Find a Tool and World View show a small picture of its tiles and doodads. A map without a cached picture has a plain tile with its name until it gets one. Pictures are refreshed when the map opens, is saved or is left; they are disposable files under data/docsdoodadscache/maps/ and are never added to the game's saved data. Unsaved pictures stay in memory and go away when changes are discarded. Saving changes to another map invalidates that map's old picture; it is redrawn when opened, while unchanged maps keep theirs. - World View draws the map and its linked neighbours to scale with their map pictures and edge-crossing doodads in orange. Click a map to go there. - Looping (world) maps wrap doodads, lights, outlines and clicks with the camera, the same way MZ's characters wrap."
    },
    {
        "title": "20. Asset Management: Where Used, Rename/Move, Duplicates, Live Reload, Packing",
        "anchor": "20-asset-management-where-used-renamemove-duplicates-live-reload-packing",
        "firstParagraph": ""
    },
    {
        "title": "Art credit ledger",
        "anchor": "art-credit-ledger",
        "firstParagraph": "An item’s Details has Set Credit… and Folder Credit…, and the multi-pick bar can set the same credit on several files. Record author, licence/terms, source and a note. A file’s own record wins; otherwise it takes the nearest folder’s. Clear this record / inherit folder removes an override. Moving an item preserves its inherited credit. Hover cards show the author and licence; searches accept author:, licence: (or license:), credit:none and their minus-prefixed exclusions."
    },
    {
        "title": "Character creators and My parts",
        "anchor": "character-creators-and-my-parts",
        "firstParagraph": "Art → Characters chooses the MZ, LPC or Memao creator and its source folders. A second My parts folder adds your own art alongside the library. Keep its native folder layout, scan again, then pick the added parts; unfamiliar kinds get an Extra tab named for the folder. Source folders stay outside the project, while exported characters go into the game."
    },
    {
        "title": "21. Workspace Layouts & Custom Layout Persistence",
        "anchor": "21-workspace-layouts--custom-layout-persistence",
        "firstParagraph": "Switch panel layout presets in View → Panel sizes: - Mapping Preset: Wide map viewport, compact bag, full details. - Events Preset: Focus on event templates and placement defaults. - Characters Preset: Optimized for character sheet decomposition and NPC generation. - Tiles Preset: Visual grid layout for decorative tiles. - Compact Preset: Minimal UI footprint for small laptop screens. - Draggable Splitters: Click and drag the vertical divider between the Item Bag and the map, or Details and the map to resize panels in real time (200px to 800px), or fold them away with their arrow buttons. - Save Custom Layouts: Click + beside the layout list in View to save your current panel dimensions, where the panels are docked and the thumbnail zoom as a named preset in data/DocsDoodadsLayouts.json. - Docking: drag the Item Bag or Details by its title to the left, the right or the bottom of the window (the drop zones light up), or pick Left, Right or Bottom for each in View → Look. A panel along the bottom resizes from its top edge; two panels on one side share it, one above the other; two along the bottom sit side by side. The map's status bar, hint and readouts move out of the way. Where the panels are is remembered for each layout on this computer."
    },
    {
        "title": "Accessibility",
        "anchor": "accessibility",
        "firstParagraph": "View → Look → Bigger window while editing fills the screen when F10 opens the editor, then restores the window on Done, close or reload. It leaves a window you already resized or maximised alone. Turn it off to keep the normal Playtest size."
    },
    {
        "title": "Editor language",
        "anchor": "editor-language",
        "firstParagraph": "The editor is in English. View → Look → Editor language lists any translations in data/DocsDoodadsLanguages: a file <code>.json (for example de.json) with \"language\" (its own name) and \"strings\", the English words with their translations. Words that hold values use {name} (\"Placed {n} doodad(s)\"), and the translation keeps it. Anything not translated stays English. npm run strings writes languages/template.json with every English string the editor shows, for a translator to fill in. Switching back to English shows every part in English after the editor is opened again."
    },
    {
        "title": "22. Project Safety, Conflict Detection & Crash Recovery",
        "anchor": "22-project-safety-conflict-detection--crash-recovery",
        "firstParagraph": "Editing real map data in playtest mode requires rigorous file protection:"
    },
    {
        "title": "Keeping released saves working",
        "anchor": "keeping-released-saves-working",
        "firstParagraph": "Before distributing a version, choose More → Mark as Released, save first if asked, and give the release a name. data/DocsDoodadsShipped.json records named doodads, their states and map sizes. Problems → Released saves then shows missing or apparently renamed names, removed/reordered states and resized maps. The deploy tool reminds you when recorded source data changed."
    },
    {
        "title": "23. Complete Keyboard Shortcuts Cheat Sheet",
        "anchor": "23-complete-keyboard-shortcuts-cheat-sheet",
        "firstParagraph": "Every key below except the fixed ones can be changed in More > Keys (or Keyboard Shortcuts in Ctrl+K): click a key, press the new keys, and Esc keeps the old ones. A key already in use asks before it moves. Your keys are kept on this computer; the tooltips, menus and the command palette show them. While you type in a field, keys with Ctrl or Alt and the F-keys still reach the editor (Ctrl+S saves what was just typed), except the field's own Ctrl+Z, Y, A, C, V and X. The table lists the keys the editor comes with, and the rows with no key are tools and views you can give one."
    },
    {
        "title": "24. Troubleshooting & FAQ",
        "anchor": "24-troubleshooting--faq",
        "firstParagraph": ""
    },
    {
        "title": "Save-file pictures and battle backgrounds",
        "anchor": "save-file-pictures-and-battle-backgrounds",
        "firstParagraph": "- In MZ's Plugin Manager, Pictures on save files adds a small picture, the area's name (or map display name), and day/time/season to the native save and load list. It is off by default. Each picture is a JPEG of at most 8 KB, made from MZ's existing map snapshot when opening the menu. Saves made without a fresh map snapshot, including initial autosaves, keep the native row. Old saves and unreadable pictures also use the native layout; custom save windows may use the docsShot, docsPlace and docsClock info fields themselves. - Map Settings → Battle background (flat map) lets a battle use this map's current light, weather and look without MZ's blur. Characters, their gear/shadows/reflections, pictures and the minimap are left out. A named battleback, including Change Battle Back, takes priority. A 3D map uses its existing setting under 3D View."
    },
    {
        "title": "Event sight and light levels",
        "anchor": "event-sight-and-light-levels",
        "firstParagraph": "- Pick an event and use Sight in Details to set range, spread, darkness sensitivity and either a self switch or common event. The cone is drawn while editing a flat map. A current page's sight tags take priority over note tags. Walls use World → Lighting wall regions, even when visual light occlusion is off. - Tags: <docs sight: 6, 90>, <docs sight light: 0.3>, and either <docs sight self switch: A> or <docs sight common event: 12>. Seeing triggers once until sight is lost; a busy common-event slot is retried. Darkness shortens the range to at least a quarter. - DocsDoodads.api.lightAt(tileX, tileY) reads brightness from 0 to 1; Store Light Level writes it to a variable. DocsDoodads.api.sees(eventId) checks a tagged event. World → Lighting can drive a chosen switch while the player is below a brightness threshold. Detection checks near-screen events five times per second, up to 24 per check, and does not depend on the player's Effects Quality."
    },
    {
        "title": "Plugins and local reports",
        "anchor": "plugins-and-local-reports",
        "firstParagraph": "Map → Problems has a Plugins group for known order advisories and hooks a later plugin appears to bypass. The check observes normal map updates without running gameplay as a probe. It waits for repeated calls before flagging a hook that never delegates; a removed observer is labelled as an unverified change. Listed later plugins are candidates to investigate. The generated plugin notes distinguish order advice from compatibility playtests, which are still pending."
    },
    {
        "title": "Q: Why isn't the editor opening when I press F10?",
        "anchor": "q-why-isnt-the-editor-opening-when-i-press-f10",
        "firstParagraph": "- Verify that playtest is running under NW.js (not launched from an external standard browser without Node filesystem access). - Verify in Plugin Manager that Docs-Doodads is turned ON and Editor Enabled is set to true. - Check if another plugin intercepts F10; you can change the editKey parameter to another key or a chord such as Ctrl+F10."
    },
    {
        "title": "Q: Can I safely deploy my game to players?",
        "anchor": "q-can-i-safely-deploy-my-game-to-players",
        "firstParagraph": "- Yes. In deployed builds (test: false), all editor UI, DOM elements, filesystem listeners, and slicer modals are stripped from execution. Placed doodads, effects, lights and collision render normally. If you packed map art, pack again after changing source images; a pack built before a change keeps the old art. - Release downloads also contain Docs-Doodads.game.js, a smaller runtime-only plugin for the copy you give players. In the deployed game's js/plugins/ folder, replace the full plugin with it and rename it to Docs-Doodads.js. Keep only one variant enabled: using the original filename is what preserves the plugin parameters and plugin-command identity. Continue to use the full plugin in the source project and playtests so F10 remains available. - The game-only build was played in encrypted MZ 1.10.0 on an interior, town, looping field and cave, flat and in 3D, at 32-pixel tiles and 1280 × 720. It is about one third of the full plugin's size. See the QA record for checks and limitations. - In File → Deployment, leave Exclude unused files off, or put the files back afterwards: MZ only knows the files its own database and events use, so it leaves out every doodad picture (all of img/doodads) and sounds that only Doc's Doodads uses. Each save in the editor writes data/DocsDoodadsRequired.json, the files the plugin draws (doodads, their states and seasons, picture layers, idle and run sheets, Visual Equipment layers, sky videos, models); after MZ's Deployment, npm run deploy -- --restore <project> <deployed folder> copies the missing ones in, encrypted with the build's key. If a doodad's picture is missing anyway, the game doesn't stop at MZ's \"Failed to load\" screen: that doodad is skipped and the console says which file it was. Image and audio encryption are fine; the plugin reads encrypted files. - The deploy script's build was checked against MZ's own (same key): every file is the same byte for byte, except data/System.json, which MZ writes again from the editor. - To try a deployed build without the editor, run npm run deploy -- <project folder> <output folder> in this repository. It makes a Windows build the way MZ's Deployment does with encryption on (Game.exe, encrypted img/ and audio/, the key in System.json, developer tools off); run its Game.exe. Add --game-build to replace only the output copy with the smaller runtime-only plugin, --no-encrypt for a plain build, --key <text> for your own key, --devtools to keep the developer tools, or --runtime <folder> if MZ's nwjs-win folder isn't found."
    },
    {
        "title": "Q: Why do my house interiors get dark at night?",
        "anchor": "q-why-do-my-house-interiors-get-dark-at-night",
        "firstParagraph": "- The day/night clock applies to every map that doesn't set its own darkness. In the map panel, set Day and night on this map to Ignore (indoors) for interiors, or give the map its own ambient darkness."
    },
    {
        "title": "Q: Post-processing makes my game slow on older PCs or phones.",
        "anchor": "q-post-processing-makes-my-game-slow-on-older-pcs-or-phones",
        "firstParagraph": "- Set Quality to Low in View → Screen Looks (it skips tilt-shift and lightens bloom), use fewer effects, or let players pick a lower Effects Quality in Options."
    },
    {
        "title": "Q: The 3D view is slow on older PCs or phones.",
        "anchor": "q-the-3d-view-is-slow-on-older-pcs-or-phones",
        "firstParagraph": "- Lower View distance for the map, or let players pick a lower Effects Quality in Options: Medium and Low draw less ground, fewer weather drops and simpler hills, and Low drops wakes (see Quality on slower machines in section 14)."
    },
    {
        "title": "Q: My character sheet with more frames shows the wrong part of the image.",
        "anchor": "q-my-character-sheet-with-more-frames-shows-the-wrong-part-of-the-image",
        "firstParagraph": "- Put the layout in the file name: [f8] for frames per row and [d1]/[d8] for rows. A tagged sheet holds one character and is split evenly, so every frame must be the same size."
    },
    {
        "title": "Q: Will updating my maps in the RPG Maker MZ editor erase my doodads?",
        "anchor": "q-will-updating-my-maps-in-the-rpg-maker-mz-editor-erase-my-doodads",
        "firstParagraph": "- No. Doodads are stored in data/DocsDoodads.json keyed by map ID ($gameMap.mapId()). They persist independently of map geometry changes. - For events created through the workspace, remember to press Ctrl + S inside the workspace to commit them to MapXXX.json. Then reload the map in the RPG Maker MZ editor to view the new event nodes."
    },
    {
        "title": "25. Credits & Licensing",
        "anchor": "25-credits--licensing",
        "firstParagraph": "- Origins: Doc's Doodads began as an upgrade of QJ-Doodads by Qiu Jiu (MIT License) and has grown into its own tool. - Font: the editor's font is Nunito, under the SIL Open Font License 1.1 (art/fonts/Nunito-OFL.txt)."
    }
];
