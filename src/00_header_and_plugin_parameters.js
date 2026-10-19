//==========================================================
// RPG Maker MZ: Doc's Doodads
//==========================================================
/*:
 * @target MZ
 * @plugindesc Doc's Doodads - Asset Workspace & Doodad Engine [V2.0.0-alpha.1]
 * @author Doc
 *
 * @help
 * ============================================================================
 * DOC'S DOODADS
 * ============================================================================
 * An advanced visual asset-driven mapping and placement workspace for RPG Maker MZ.
 * Doc's Doodads began as Qiu Jiu's QJ-Doodads (V1.2) and has grown into its own tool.
 * Projects saved by QJ-Doodads are read and migrated automatically.
 *
 * THE EDITOR (F10 in a playtest): a top bar of big tools (Select, Stamp, Scatter, Paint,
 * Path, Hills, Mirror, Grab, Undo, Redo, Steps, More, Save, Done), the Item Bag on the left,
 * Details on the right (both fold away), and a hint bubble saying what to do next. More holds
 * about twenty more: Cut Up Sheet, Screen Looks, Effects Maker, Old Saves, File Check, Info, the
 * grid, collision and sound views, Find a Tool, Messages, Look, Rooms, Packs, Characters (the
 * character creators), Keys, Capture, Problems, Listen, Show Speed, How to Use and the layouts.
 *
 * KEY CAPABILITIES:
 * 1. Item Bag (asset browser):
 *    - Virtualized browsing for 10,000+ assets with lightning performance.
 *    - Card size slider, icon tabs by kind, folder hierarchy.
 *    - Real-time tokenized search (type:, tag:, folder:, category:, collection:, favorite:,
 *      animated:, used:, and a minus on any of them).
 *    - Favorites, custom collections, and recently used asset tracking.
 *
 * 2. Intelligent Slicing Engine & Cut Up Sheet:
 *    - Automatic detection of standard MZ sheets ($Single, 8-character, Faces, IconSet, SV).
 *    - Divisor-based grid candidate scoring.
 *    - Sidecar atlas metadata parsing (Aseprite, TexturePacker, .saf.json).
 *    - Canvas visual auto-slicer with adaptive Otsu alpha thresholding, border flood,
 *      morphological cleanup, 4-connected components, and gutter splitting.
 *    - Cut Up Sheet: 1600% zoom, 8-handle drag/resize, smart snapping,
 *      alignment guides, region list sidebar, split, merge, align, distribute,
 *      and authoritative non-destructive slice metadata persistence.
 *    - PNG slice exporter (individual PNGs, batch, animation strips).
 *
 * 3. Drag-and-Drop Placement, Live Ghost Preview & Stamping:
 *    - Drag any asset or slice directly onto the map with live ghost preview.
 *    - Free placement or tile grid snapping (48px or custom, hold Alt for free).
 *    - Stamping mode (click repeatedly to place props).
 *    - Grab tool (Alt+Click a placed object to pick its art in the Item Bag).
 *    - Scatter brush with density, scale jitter, and rotation jitter.
 *    - In-map selection, arrow-key nudge (1px / 16px), Ctrl+D duplicate, Delete key,
 *      and Z-order layering.
 *
 * 4. Genuine RPG Maker MZ Event Creation:
 *    - Intelligently detects if an asset needs an event (Yes / No / Remember).
 *    - Allocates safe event IDs and generates genuine MZ events in MapXXX.json.
 *    - 20 Built-in Event Templates: NPC, Door, Transfer Door, Chest, Loot, Sign,
 *      Switch, Lever, Save Point, Shopkeeper, Enemy Encounter, Harvestable,
 *      Breakable, Pushable, Light Source, Animated Prop, Teleporter, Ladder/Stairs,
 *      Vehicle, Decoration Event.
 *    - "Save Event as Template" command to capture any map event for reuse.
 *
 * 5. Direct Physical Doodad Collision:
 *    - Direct box collision without creating invisible blocker events.
 *    - Collision presets: Full Bounds, Bottom Half, Bottom Third, Center Box, Trunk, Wall.
 *    - Interactive visual collision rectangle editor in Details using relative coordinates.
 *
 * 6. Audio Preview & Sound Triggers:
 *    - In-editor audio player with start/stop and animated playback indicators.
 *    - Drag audio onto map to create sound-trigger events (play BGM / SE).
 *    - Drag audio onto existing event to append sound commands.
 *
 * 7. Depth, Effects & Lighting:
 *    - Doodads sort in front of or behind characters by their base line.
 *    - Tint, hue, blend, blur, flip, motion (sway/bob/pulse/flicker/shimmer),
 *      shadows from sprite transparency, lights and map ambient darkness.
 *    - Switch/condition visibility; Set/Reset Ambient Light plugin commands.
 *
 * 8. Placement Tools & Maps:
 *    - Path tool, prefabs with sync, rule-based scatter, drag with smart guides.
 *    - Go to Map, cross-map clipboard, Copy/Move to Map, edge mirroring, World View.
 *
 * 9. Asset Management:
 *    - Where Used, safe Rename/Move, unused files, duplicates and look-alikes,
 *      live reload, and per-map art packing for deployed games.
 *
 * 10. World Atmosphere (map panel in the editor, with nothing selected):
 *    - Day/night clock (running or from variables) with darkness keyframes,
 *      lamps that switch on after dark, and a sun that turns every shadow.
 *    - Character shadows shaped like each sprite, cut short under roof regions.
 *    - See-through tall doodads (fade or outline), water reflections, motion blur
 *      (with an Options toggle), seasonal art swaps, animated appear/disappear.
 *    - Event tags (note or page comment): <shadow>, <shadow: length 0.8, opacity 0.4>,
 *      <no shadow>, <motion blur>, <no motion blur>, <no reflection>.
 *
 * 11. Post-Processing (More: Screen Looks):
 *    - Bloom, colour grading, vignette, film grain, chromatic aberration, lens
 *      distortion, CRT, pixelate, sharpen and tilt-shift, with presets.
 *    - A game-wide look plus per-map looks; Set Post-Processing Look fades between
 *      them; Play Screen Effect for impact zoom, shockwaves and flashes.
 *    - Quality setting, an Effects Quality option for players, and full-map
 *      PNG export to the screenshots folder.
 *
 * 12. Particles, VFX & Character Animation (More: Effects Maker):
 *    - Particle emitters on doodads (smoke, embers, fire, fireflies, leaves,
 *      mist, dust, sparkles, snow, bubbles, magic); grass that bends when walked through.
 *    - Effects Maker (VFX): particle and sprite-sheet layers; Play VFX plugin command.
 *    - Character sheets: [f8] frames per row, [d1] single row, [d8] 8 directions;
 *      Name_idle / Name_run cycles; Play Character Action; optional diagonal movement.
 *
 * 13. Spatial Sound (map panel: Spatial Sound, Sound (this map)):
 *    - Event and move-route sound effects are quieter far away and panned left/right,
 *      with optional random pitch/volume variation (off by default). <no spatial> opts an
 *      event out of placement, <no variance> out of variation.
 *    - Ambient sounds on doodads and events (<sound: River, 80, 8>), cave echo,
 *      background sounds by region, and the Play SE At plugin command.
 *
 * 14. Editor Tools:
 *    - Layers per map (show/hide, lock, hide in game), Symmetry, Biome brush,
 *      Dressing Rules (water edges, wall bases, beside paths...), visual save History,
 *      animated Item Bag cards, and the Ctrl+K command palette (More: Find a Tool).
 *
 * 15. Visual Equipment & Destination Marker (map panel):
 *    - Paper-doll characters: a bare body plus parts. <visual: Sheet, z -1, part clothes>
 *      on weapons/armors/states draws a layer and replaces the body's part of the same
 *      name; "up N" is the order while facing up. Shows on the player, followers,
 *      events and side-view battlers (sv SheetName). Also
 *      <visual base: ...>, <visual hide: hair>, <visual color: hair, switch 12, hue 120>,
 *      <visual alias: Elf> ({alias} in image names) and <visual actor: N> on events.
 *    - Straight from Aseprite: <visual: Hero.aseprite#Sword> draws a layer of a layered
 *      .aseprite walk cycle in img/characters. Its sheet is made in a playtest and
 *      remade when the .aseprite is saved again, while the game runs.
 *    - The equip screen previews the highlighted item; save files show the gear.
 *    - The click-to-walk marker: shapes, images, animations or VFX, pulse, spin,
 *      bob, path dots; Set Destination Marker changes it mid-game.
 *
 *    - Zoom and Sound Focus (World panel): players zoom in on their character with the mouse
 *      wheel or + and -, or Set Zoom does it. Zoomed in, the music drops, nearby sounds get
 *      louder and far ones fade sooner; ambience layers (water, trees, open ground and wind,
 *      doodads, regions, terrain tags) and footsteps by ground come forward.
 *
 *    - Traversal (World panel): jump with C (over gaps, up small ledges, gliding off high
 *      ground), swim through deep water (slower, in to the waist, an optional swimming
 *      sheet), dive with C to the map set under the water, fly with F (over everything,
 *      with a shadow, landing where you can stand), climb walls and cliffs in chosen regions
 *      or terrain tags, and slide on ice. Each can need a switch; Set Traversal and
 *      Traversal Action control them from events.
 *
 * 16. 3D View (map panel: 3D View (this map)):
 *    - Tiles, floor doodads, shadows and lighting lie on a perspective ground plane;
 *      characters, gear and standing doodads stand up as billboards, sorted by distance.
 *    - Camera tilt, turn, field of view, zoom, fog and sky; the parallax becomes the sky.
 *    - Round world: a planet or a rolling log; radius 0 fits a looping map in one lap.
 *    - Rippling water with glints and wakes behind boats and waders.
 *    - 3D rain, storms and snow from Set Weather Effect, splashing on the ground and water.
 *    - Day and night: a sky following the clock, sun, moon and stars, light from the sun.
 *    - Terrain height (map panel and the Terrain brush): automatic mountains and forests on
 *      world tilesets, heights by region or terrain tag, smooth or stepped, optional blocking.
 *    - Effects Quality in Options lowers 3D detail for slower machines (view distance,
 *      weather, wakes, hill detail).
 *    - Optional Q / W camera turning (arrow keys and facings follow the camera).
 *    - Set Camera / Reset Camera / Set 3D View plugin commands; touch and the editor click
 *      through the ground; selected doodads show 3D boxes.
 *    - A video sky: a looping movie (a 360° panorama turns with the camera, or one that
 *      fills the sky), tinted by day and night, optionally behind flat maps too; Set Sky
 *      Video changes it during play.
 *    - 3D models (glTF .glb/.gltf) on doodads (Details: 3D Model): colours, textures and
 *      vertex colours; metal, roughness, glow, cut-out and see-through materials, unlit;
 *      animations (pick one by name or number, set the speed) and skinned (rigged) models.
 *      They reload when re-exported while the editor is open, and the editor picks them by
 *      their shape. Light is worked out per vertex: keep models to a few hundred triangles.
 *
 * 17. Modern Operations & Safety:
 *    - 300-level command-based Undo / Redo (Ctrl+Z, Ctrl+Y).
 *    - Duplicate (Ctrl+D), Copy/Paste (Ctrl+C, Ctrl+V), Nudge (Arrows / Shift+Arrows).
 *    - Windows Explorer drag-and-drop file/folder import with destination routing & conflict dialog.
 *    - Safe persistence: Session snapshots, dirty tracking, pre-save external conflict
 *      detection, timestamped backups in data/docs_doodads_cache/backups/, and atomic writes.
 *    - Autosave crash recovery snapshots in data/DocsDoodadsRecovery.json.
 *    - Diagnostics panel with cache statistics, memory tracking, and validation tools.
 *
 * KEYBOARD SHORTCUTS:
 * - F10 / Editor Key : Open / Close Asset Workspace
 * - Ctrl + Z         : Undo
 * - Ctrl + Y         : Redo
 * - Ctrl + S         : Save Project Changes (Atomic with conflict detection & backups)
 * - Ctrl + D         : Duplicate selection
 * - Ctrl + C / V     : Copy / Paste doodad
 * - Ctrl + K         : Command palette (tools, panels, maps, assets, looks)
 * - Delete           : Delete selected doodad(s)
 * - Arrow Keys       : Nudge 1px (Shift + Arrow: 16px)
 * - Alt + Click      : Grab (pick a placed object's art)
 * - H                : Fold or open the Details panel
 * - G                : Toggle Grid display
 * - Escape           : Cancel current placement tool / close modals
 * - Enter/Backspace  : Path tool: place along the path / remove last point
 * - Drag a doodad    : Move with smart guides (Alt: free, Shift: tile grid)
 *
 * THIRD-PARTY NOTICES:
 * - Based on QJ-Doodads by Qiu Jiu, MIT License. Copyright (c) 2022 Qiu Jiu.
 * ============================================================================
 *
 * @param editKey
 * @text Editor Toggle Key
 * @type combo
 * @option F1
 * @option F6
 * @option F7
 * @option F8
 * @option F9
 * @option F10
 * @option Ctrl+F10
 * @option Shift+F10
 * @option Ctrl+E
 * @option `
 * @default F10
 * @desc Key to open/close the editor in test play. Any key, or a chord such as Ctrl+F10 or Ctrl+Shift+E.
 *
 * @param editorMode
 * @text Editor Enabled
 * @type boolean
 * @default true
 * @desc Enables the Asset Workspace and in-game editing tools during test play.
 *
 * @param dataFileName
 * @text Doodads Data File Name
 * @type text
 * @default DocsDoodads
 * @desc Name of the doodads json file in data/ (without .json).
 *
 * @param doodadScaleMode
 * @text Doodad Scaling Mode
 * @type boolean
 * @on Smooth / Linear
 * @off Pixelated / Nearest
 * @default true
 * @desc Texture scaling mode for doodad rendering.
 *
 * @param saveMode
 * @text Doodad JSON Formatting
 * @type boolean
 * @on Compact / Minified
 * @off Formatted / Indented
 * @default false
 * @desc Format style when saving DocsDoodads.json.
 *
 * @param splitByMap
 * @text Doodad Files
 * @type boolean
 * @on One file per map
 * @off One file
 * @default false
 * @desc One file per map (data/DocsDoodads/) keeps diffs and merges small when the project is in Git.
 *
 * @param defaultLayout
 * @text Default Workspace Layout
 * @type select
 * @option Mapping
 * @option Events
 * @option Characters
 * @option Tiles
 * @option Compact
 * @default Mapping
 * @desc Initial panel arrangement when launching the Asset Workspace.
 *
 * @param defaultThumbnailSize
 * @text Default Thumbnail Size
 * @type number
 * @min 32
 * @max 256
 * @default 96
 * @desc Default asset thumbnail card size in pixels.
 *
 * @param cacheEnabled
 * @text Asset Cache Enabled
 * @type boolean
 * @default true
 * @desc Cache asset metadata and thumbnails for instantaneous loading.
 *
 * @param backgroundWorkBudget
 * @text Background Work Budget (ms)
 * @type number
 * @min 1
 * @max 16
 * @default 4
 * @desc Maximum milliseconds per frame dedicated to background indexing and thumbnails.
 *
 * @param autosaveRecoveryInterval
 * @text Autosave Interval (sec)
 * @type number
 * @min 10
 * @max 600
 * @default 60
 * @desc Interval for writing autosave recovery snapshots (0 to disable).
 *
 * @param backupRetentionCount
 * @text Backup Retention Count
 * @type number
 * @min 1
 * @max 50
 * @default 10
 * @desc Number of timestamped project backups retained in data/docs_doodads_cache/backups/.
 *
 * @param gridSnapShow
 * @text Show Grid Snap
 * @type boolean
 * @default false
 * @desc Show visual grid overlay in editor by default.
 *
 * @param gridSnapWidth
 * @text Grid Snap Width
 * @type number
 * @min 0
 * @default 0
 * @desc Width of the placement snapping grid in pixels (0 = the map's tile width).
 *
 * @param gridSnapHeight
 * @text Grid Snap Height
 * @type number
 * @min 0
 * @default 0
 * @desc Height of the placement snapping grid in pixels (0 = the map's tile height).
 *
 * @param devDiagnostics
 * @text Developer Diagnostics
 * @type boolean
 * @default false
 * @desc Enable diagnostics logging in Developer Tools console.
 *
 * @command setAmbient
 * @text Set Ambient Light
 * @desc Fades the map's darkness (for night, caves, storms). Doodad lights shine through it.
 *
 * @arg darkness
 * @text Darkness (%)
 * @type number
 * @min 0
 * @max 100
 * @default 60
 * @desc 0 is full daylight, 100 is fully dark.
 *
 * @arg color
 * @text Ambient Color
 * @type text
 * @default #101830
 * @desc Colour of the darkness as #rrggbb (deep blue for night, brown for caves).
 *
 * @arg duration
 * @text Fade Duration (frames)
 * @type number
 * @min 0
 * @default 60
 * @desc 60 frames is one second.
 *
 * @command resetAmbient
 * @text Reset Ambient Light
 * @desc Fades back to the ambient light set for this map in the editor.
 *
 * @arg duration
 * @text Fade Duration (frames)
 * @type number
 * @min 0
 * @default 60
 *
 * @command setTime
 * @text Set Time of Day
 * @desc Jumps the day/night clock (or its variables) to a time.
 *
 * @arg hour
 * @text Hour
 * @type number
 * @min 0
 * @max 23
 * @default 8
 *
 * @arg minute
 * @text Minute
 * @type number
 * @min 0
 * @max 59
 * @default 0
 *
 * @arg day
 * @text Day
 * @desc The clock's day count. Leave blank to keep the day (an earlier hour doesn't start a new day).
 * @type string
 * @default
 *
 * @command addTime
 * @text Pass Time
 * @desc Moves the clock forward (for sleeping, waiting, travelling).
 *
 * @arg hours
 * @text Hours
 * @type number
 * @min 0
 * @default 1
 *
 * @arg minutes
 * @text Minutes
 * @type number
 * @min 0
 * @max 59
 * @default 0
 *
 * @command clockControl
 * @text Clock Control
 * @desc Pause, resume or change the speed of the running clock.
 *
 * @arg action
 * @text Action
 * @type select
 * @option Pause
 * @value pause
 * @option Resume
 * @value resume
 * @option Set Speed
 * @value speed
 * @option Back to Project Speed
 * @value defaultSpeed
 * @default pause
 *
 * @arg speed
 * @text Speed (game minutes per second)
 * @type number
 * @decimals 1
 * @min 0
 * @default 1
 *
 * @command setSeason
 * @text Set Season
 * @desc Changes the season (0 = first season in the editor's list).
 *
 * @arg season
 * @text Season
 * @type select
 * @option Spring (1st)
 * @value 0
 * @option Summer (2nd)
 * @value 1
 * @option Autumn (3rd)
 * @value 2
 * @option Winter (4th)
 * @value 3
 * @default 0
 *
 * @command setFeature
 * @text Set Atmosphere Effect
 * @desc Turns an effect on or off for this playthrough (saved with the game).
 *
 * @arg feature
 * @text Effect
 * @type select
 * @option Character Shadows
 * @value characterShadows
 * @option Motion Blur
 * @value motionBlur
 * @option Water Reflections
 * @value reflections
 * @option See-Through
 * @value seeThrough
 * @option Post-Processing
 * @value postfx
 * @default characterShadows
 *
 * @arg enabled
 * @text Enabled
 * @type boolean
 * @default true
 *
 * @command setLook
 * @text Set Post-Processing Look
 * @desc Fades to a preset look, to no effects, or back to the map's own look.
 *
 * @arg look
 * @text Look
 * @type select
 * @option Back to the map's look
 * @value map
 * @option No effects
 * @value none
 * @option Cinematic
 * @value cinematic
 * @option Golden Hour
 * @value golden
 * @option Dreamy
 * @value dreamy
 * @option Retro CRT
 * @value retro
 * @option Noir
 * @value noir
 * @option Horror
 * @value horror
 * @option Underwater
 * @value underwater
 * @option Miniature
 * @value miniature
 * @option Pixel Art
 * @value pixel
 * @default map
 *
 * @arg duration
 * @text Fade Duration (frames)
 * @type number
 * @min 0
 * @default 60
 *
 * @command playScreenEffect
 * @text Play Screen Effect
 * @desc A short effect for impacts, spells and reveals.
 *
 * @arg effect
 * @text Effect
 * @type select
 * @option Impact Zoom
 * @value zoomPunch
 * @option Shockwave
 * @value shockwave
 * @option Chromatic Punch
 * @value chromaticPunch
 * @option Bloom Flash
 * @value bloomFlash
 * @default shockwave
 *
 * @arg strength
 * @text Strength
 * @type number
 * @decimals 2
 * @min 0
 * @default 1
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 1
 * @default 40
 *
 * @arg origin
 * @text Centred On
 * @type select
 * @option Player
 * @value player
 * @option Event
 * @value event
 * @option Screen centre
 * @value screen
 * @default player
 *
 * @arg eventId
 * @text Event ID (when centred on an event)
 * @type number
 * @min 0
 * @default 0
 *
 * @command playVfx
 * @text Play VFX
 * @desc Plays an effect from the VFX builder (by name), on a character or a map tile.
 *
 * @arg effect
 * @text Effect Name
 * @type text
 * @default Explosion
 * @desc The name shown in the VFX builder. Built-ins: Explosion, Heal, Level Up, Smoke Puff, Magic Burst, Water Splash.
 *
 * @arg target
 * @text Where
 * @type select
 * @option Player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @option Map tile
 * @value tile
 * @option Screen centre
 * @value screen
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 0
 * @default 0
 *
 * @arg x
 * @text Tile X
 * @type number
 * @min 0
 * @default 0
 *
 * @arg y
 * @text Tile Y
 * @type number
 * @min 0
 * @default 0
 *
 * @arg follow
 * @text Follow the Character
 * @type boolean
 * @default true
 *
 * @arg wait
 * @text Wait for Completion
 * @type boolean
 * @default false
 *
 * @command characterAction
 * @text Play Character Action
 * @desc Plays a sheet (e.g. Hero_drink[f4]) on a character: drinking, sleeping, farming, swinging.
 *
 * @arg target
 * @text Character
 * @type select
 * @option Player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 0
 * @default 0
 *
 * @arg sheet
 * @text Sheet (img/characters)
 * @type file
 * @dir img/characters/
 * @require 1
 *
 * @arg fps
 * @text Frames per Second
 * @type number
 * @min 1
 * @default 8
 *
 * @arg loops
 * @text Times to Play (0 = until cleared)
 * @type number
 * @min 0
 * @default 1
 *
 * @arg hold
 * @text Hold the Last Frame
 * @type boolean
 * @default false
 * @desc Stays on the last frame until "Clear Character Action" (sleeping, sitting).
 *
 * @arg wait
 * @text Wait for Completion
 * @type boolean
 * @default true
 *
 * @command playSeAt
 * @text Play SE At
 * @desc Plays a sound effect heard from a character or a map tile (quieter with distance, panned).
 *
 * @arg name
 * @text Sound Effect
 * @type file
 * @dir audio/se/
 * @require 1
 *
 * @arg volume
 * @text Volume
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @arg pitch
 * @text Pitch
 * @type number
 * @min 50
 * @max 150
 * @default 100
 *
 * @arg target
 * @text Where
 * @type select
 * @option Player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @option Map tile
 * @value tile
 * @default this
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 0
 * @default 0
 *
 * @arg x
 * @text Tile X
 * @type number
 * @min 0
 * @default 0
 *
 * @arg y
 * @text Tile Y
 * @type number
 * @min 0
 * @default 0
 *
 * @command clearCharacterAction
 * @text Clear Character Action
 * @desc Returns a character to walking and idling.
 *
 * @arg target
 * @text Character
 * @type select
 * @option Player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @min 0
 * @default 0
 *
 * @command setVisualAlias
 * @text Set Visual Alias
 * @desc Changes the {alias} an actor's gear images use (body type, race, outfit set). Blank uses the notetag.
 *
 * @arg actor
 * @text Actor
 * @type select
 * @option Party leader
 * @value leader
 * @option Actor by ID
 * @value id
 * @default leader
 *
 * @arg actorId
 * @text Actor ID
 * @type actor
 * @default 0
 *
 * @arg alias
 * @text Alias
 * @type string
 * @default
 *
 * @command addVisualLayer
 * @text Add Visual Layer
 * @desc Puts a layer on an actor without equipment (a costume, a hat from a quest). Replaces a layer with the same part.
 *
 * @arg actor
 * @text Actor
 * @type select
 * @option Party leader
 * @value leader
 * @option Actor by ID
 * @value id
 * @default leader
 *
 * @arg actorId
 * @text Actor ID
 * @type actor
 * @default 0
 *
 * @arg image
 * @text Layer Sheet (img/characters)
 * @type file
 * @dir img/characters/
 * @require 1
 *
 * @arg z
 * @text Order (negative = behind the body)
 * @type number
 * @min -99
 * @max 99
 * @default 1
 *
 * @arg part
 * @text Part Name
 * @type string
 * @default
 * @desc Used by hide and colour tags, and by Remove Visual Layer. Blank uses the image name.
 *
 * @arg sv
 * @text Side-View Sheet (img/sv_actors)
 * @type file
 * @dir img/sv_actors/
 *
 * @command removeVisualLayer
 * @text Remove Visual Layer
 * @desc Removes layers added with Add Visual Layer, by part name (blank removes them all).
 *
 * @arg actor
 * @text Actor
 * @type select
 * @option Party leader
 * @value leader
 * @option Actor by ID
 * @value id
 * @default leader
 *
 * @arg actorId
 * @text Actor ID
 * @type actor
 * @default 0
 *
 * @arg part
 * @text Part Name
 * @type string
 * @default
 *
 * @command setVisualColor
 * @text Set Visual Colour
 * @desc Recolours one part of an actor's look (hair dye, team colours), over any colour tags.
 *
 * @arg actor
 * @text Actor
 * @type select
 * @option Party leader
 * @value leader
 * @option Actor by ID
 * @value id
 * @default leader
 *
 * @arg actorId
 * @text Actor ID
 * @type actor
 * @default 0
 *
 * @arg part
 * @text Part Name
 * @type string
 * @default hair
 *
 * @arg hue
 * @text Hue Shift (degrees)
 * @type number
 * @min -360
 * @max 360
 * @default 0
 *
 * @arg tint
 * @text Tint (#rrggbb, blank for none)
 * @type string
 * @default
 *
 * @arg reset
 * @text Back to the Notetags
 * @type boolean
 * @default false
 *
 * @command setDestination
 * @text Set Destination Marker
 * @desc Changes the marker shown where the player clicks to walk. Blank fields keep the current value.
 *
 * @arg style
 * @text Style
 * @type select
 * @option (keep)
 * @value
 * @option MZ square
 * @value default
 * @option Rounded square
 * @value square
 * @option Circle
 * @value circle
 * @option Ring
 * @value ring
 * @option Diamond
 * @value diamond
 * @option Cross
 * @value cross
 * @option Arrow
 * @value arrow
 * @option Image (img/system)
 * @value image
 * @option Database animation
 * @value animation
 * @option VFX effect
 * @value vfx
 * @option Hidden
 * @value none
 * @default
 *
 * @arg color
 * @text Colour (#rrggbb)
 * @type string
 * @default
 *
 * @arg opacity
 * @text Opacity (0-255)
 * @type string
 * @default
 *
 * @arg blend
 * @text Blend
 * @type select
 * @option (keep)
 * @value
 * @option Add (glow)
 * @value add
 * @option Normal
 * @value normal
 * @option Multiply
 * @value multiply
 * @option Screen
 * @value screen
 * @default
 *
 * @arg scale
 * @text Size (1 = one tile)
 * @type string
 * @default
 *
 * @arg pulse
 * @text Pulse
 * @type select
 * @option (keep)
 * @value
 * @option MZ pulse
 * @value mz
 * @option Breathe
 * @value breathe
 * @option Ripple
 * @value ripple
 * @option Still
 * @value none
 * @default
 *
 * @arg spin
 * @text Spin (degrees per second)
 * @type string
 * @default
 *
 * @arg bob
 * @text Bob Height (pixels)
 * @type string
 * @default
 *
 * @arg layer
 * @text Drawn
 * @type select
 * @option (keep)
 * @value
 * @option Above characters
 * @value above
 * @option On the ground
 * @value ground
 * @default
 *
 * @arg image
 * @text Image (img/system, name[f4] for 4 frames)
 * @type file
 * @dir img/system/
 *
 * @arg fps
 * @text Image Frames per Second
 * @type string
 * @default
 *
 * @arg animationId
 * @text Animation
 * @type animation
 * @default 0
 *
 * @arg vfx
 * @text VFX Effect ID
 * @type string
 * @default
 *
 * @arg pathDots
 * @text Path Dots
 * @type select
 * @option (keep)
 * @value
 * @option On
 * @value on
 * @option Off
 * @value off
 * @default
 *
 * @arg dotColor
 * @text Dot Colour (#rrggbb)
 * @type string
 * @default
 *
 * @arg reset
 * @text Back to the Project's Marker
 * @type boolean
 * @default false
 *
 * @command setCamera
 * @text Set Camera (3D)
 * @desc Moves the 3D camera. Blank fields keep their value.
 *
 * @arg pitch
 * @text Tilt (degrees down, 20-89)
 * @type string
 * @default
 *
 * @arg yaw
 * @text Turn (degrees, 0 = looking north)
 * @type string
 * @default
 *
 * @arg zoom
 * @text Zoom
 * @type string
 * @default
 *
 * @arg fov
 * @text Field of View
 * @type string
 * @default
 *
 * @arg curve
 * @text Round World
 * @type select
 * @option (keep)
 * @value
 * @option Flat (eases out)
 * @value flat
 * @option Planet
 * @value sphere
 * @option Rolling log
 * @value cylinder
 * @default
 *
 * @arg curvature
 * @text Curvature (0 = flat, 100 = tiny planet)
 * @type string
 * @default
 *
 * @arg relative
 * @text Add to the Current Tilt / Turn / Field of View / Curvature
 * @type boolean
 * @default false
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 0
 * @default 30
 *
 * @arg wait
 * @text Wait for Completion
 * @type boolean
 * @default false
 *
 * @command resetCamera
 * @text Reset Camera (3D)
 * @desc Returns the camera to this map's 3D View settings.
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 0
 * @default 30
 *
 * @command setPerspective
 * @text Set 3D View
 * @desc Turns the 3D view on or off for the current map, or back to the map's setting.
 *
 * @arg mode
 * @text 3D View
 * @type select
 * @option Use the map's setting
 * @value map
 * @option On
 * @value on
 * @option Off
 * @value off
 * @default map
 *
 * @command setTraversal
 * @text Set Traversal
 * @desc Turns a way of getting around on or off for this game (or back to the World settings),
 * e.g. when the hero learns to swim.
 *
 * @arg ability
 * @text Ability
 * @type select
 * @option Jump
 * @value jump
 * @option Glide
 * @value glide
 * @option Swim
 * @value swim
 * @option Dive
 * @value dive
 * @option Fly
 * @value fly
 * @option Climb
 * @value climb
 * @option Slide on ice
 * @value ice
 * @default swim
 *
 * @arg state
 * @text State
 * @type select
 * @option On
 * @value on
 * @option Off
 * @value off
 * @option As in the World settings
 * @value default
 * @default on
 *
 * @command traversalAction
 * @text Traversal Action
 * @desc The player jumps, takes off, lands or dives, as if they pressed the key (if allowed).
 *
 * @arg action
 * @text Action
 * @type select
 * @option Jump
 * @value jump
 * @option Take off
 * @value takeOff
 * @option Land
 * @value land
 * @option Dive / surface
 * @value dive
 * @default jump
 *
 * @command setZoom
 * @text Set Zoom
 * @desc Zooms in on the player (1 = normal, up to the Closest zoom setting). Zoomed in, the nearby
 * sound comes forward: music drops, close sounds, ambience and footsteps get louder.
 *
 * @arg level
 * @text Zoom
 * @type number
 * @decimals 2
 * @min 1
 * @default 1.5
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @min 0
 * @default 30
 *
 * @arg wait
 * @text Wait for completion
 * @type boolean
 * @default false
 *
 * @command setSkyVideo
 * @text Set Sky Video
 * @desc A different sky video for the rest of this visit to the map (3D sky, or behind a flat map
 * when the map's 3D settings show it there). Leave Video blank for the map's own; "none" for none.
 *
 * @arg video
 * @text Video
 * @type file
 * @dir movies
 * @desc A video in movies (or a project path), "none", or blank for the map's own.
 *
 * @arg mode
 * @text Shape
 * @type select
 * @option The map's setting
 * @value map
 * @option 360° panorama (turns with the camera)
 * @value panorama
 * @option Fill the sky
 * @value fill
 * @default map
 *
 * @arg speed
 * @text Speed
 * @desc Playback speed (1 = normal, 0 = paused); blank for the map's own.
 * @default
 *
 * @command showWorldMap
 * @text Show World Map
 * @desc Shows the whole map (a globe on planet-shaped 3D maps) with the player marked. Arrow keys turn the globe; OK or Cancel closes.
 *
 * @command storeHeight
 * @text Store Ground Height
 * @desc Stores the terrain height (tiles, rounded) under a character in a variable, for event conditions.
 *
 * @arg target
 * @text Character
 * @type select
 * @option Player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @default 0
 *
 * @arg variableId
 * @text Variable
 * @type variable
 * @default 1
 *
 * @command setDoodadState
 * @text Set Doodad State
 * @desc Puts named doodads in one of their states (saved with the game). Wins over their switch or variable until cleared.
 *
 * @arg name
 * @text Doodad Name
 * @desc The Name given in Details. Every doodad with this name on the map follows.
 * @default
 *
 * @arg state
 * @text State
 * @desc A state's name or number (0 = as placed), "next" for the next one, or blank to follow its switch or variable again.
 * @default next
 *
 * @arg mapId
 * @text Map
 * @type number
 * @desc 0 for this map.
 * @default 0
 *
 * @command setDoodadLight
 * @text Set Doodad Light
 * @desc Turns named doodads' lights on or off (saved with the game), or back to their own setting.
 *
 * @arg name
 * @text Doodad Name
 * @default
 *
 * @arg light
 * @text Light
 * @type select
 * @option On
 * @value on
 * @option Off
 * @value off
 * @option Its own setting
 * @value default
 * @default off
 *
 * @arg mapId
 * @text Map
 * @type number
 * @desc 0 for this map.
 * @default 0
 *
 * @command storeDoodadState
 * @text Store Doodad State
 * @desc Stores the number of a named doodad's state (0 = as placed; -1 when there is none) in a variable.
 *
 * @arg name
 * @text Doodad Name
 * @default
 *
 * @arg variableId
 * @text Variable
 * @type variable
 * @default 1
 *
 * @arg mapId
 * @text Map
 * @desc 0 = this map.
 * @type number
 * @min 0
 * @default 0
 *
 * @command setWind
 * @text Set Wind
 * @desc Changes the wind on flat maps (swaying doodads, particles, fog layers, blowing leaves) for this playthrough.
 *
 * @arg strength
 * @text Strength
 * @desc 0 (calm) to 1 (gale), or "world" to go back to World > Weather.
 * @default 0.5
 *
 * @arg direction
 * @text Direction
 * @type select
 * @option As it is
 * @value same
 * @option To the left
 * @value left
 * @option To the right
 * @value right
 * @default same
 *
 * @arg duration
 * @text Duration (frames)
 * @type number
 * @default 60
 *
 * @command cameraPath2d
 * @text 2D Camera Path
 * @desc On flat maps: glides the camera through tiles (the middle of the screen) for a cutscene, then back to the player or staying.
 *
 * @arg points
 * @text Points (tiles)
 * @desc x,y pairs, separated by ; for example: 10,5; 20,8
 * @default
 *
 * @arg frames
 * @text Frames per leg
 * @type number
 * @min 1
 * @default 90
 *
 * @arg ease
 * @text Easing
 * @type select
 * @option Smooth (ease in and out)
 * @value smooth
 * @option Even speed
 * @value linear
 * @default smooth
 *
 * @arg then
 * @text Then
 * @type select
 * @option Back to where it started (then follows the player)
 * @value return
 * @option Stay at the last point (until 2D Camera Follow)
 * @value stay
 * @default return
 *
 * @arg wait
 * @text Wait for it
 * @type boolean
 * @default true
 *
 * @command cameraFollow2d
 * @text 2D Camera Follow
 * @desc On flat maps: the camera follows the player (and stops a held path), this event, another event, or nothing (stays put for Scroll Map).
 *
 * @arg target
 * @text Follow
 * @type select
 * @option The player
 * @value player
 * @option This event
 * @value this
 * @option Event by ID
 * @value event
 * @option Nothing (stay put, for Scroll Map and scripts)
 * @value free
 * @default player
 *
 * @arg eventId
 * @text Event ID
 * @type number
 * @default 0
 *
 * @command flashlight
 * @text Flashlight
 * @desc The player's flashlight (World > Lighting) on or off for this playthrough, or back to its setting.
 *
 * @arg state
 * @text Flashlight
 * @type select
 * @option On
 * @value on
 * @option Off
 * @value off
 * @option As World > Lighting
 * @value world
 * @default on
 *
 * @command setMinimap
 * @text Show / Hide Minimap
 * @desc Hides the corner minimap for this playthrough (cutscenes, a dark cave), or shows it again on maps that have one.
 *
 * @arg show
 * @text Minimap
 * @type boolean
 * @on Show
 * @off Hide
 * @default true
 *
 * @command exploredMap
 * @text Explored Map
 * @desc With the minimap's fog of war on: reveal a whole map, reveal around the player, or forget what was seen (saved with the game).
 *
 * @arg action
 * @text Action
 * @type select
 * @option Reveal the whole map
 * @value all
 * @option Reveal around the player
 * @value around
 * @option Forget it (all unexplored again)
 * @value forget
 * @default all
 *
 * @arg radius
 * @text Radius (tiles)
 * @type number
 * @desc For "around the player".
 * @default 8
 *
 * @arg mapId
 * @text Map
 * @type number
 * @desc 0 for this map.
 * @default 0
 */

var DocsDoodads = (typeof window !== 'undefined' ? (window.DocsDoodads = window.DocsDoodads || { reWrite: {} }) : { reWrite: {} });
var Imported = (typeof window !== 'undefined' ? (window.Imported = window.Imported || {}) : {});
Imported.DocsDoodads = true;

function Sprite_DocsDoodad() {
    this.initialize(...arguments);
}

(($) => {
"use strict";


