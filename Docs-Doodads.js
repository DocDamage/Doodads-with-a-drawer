//==========================================================
// RPG Maker MZ & MV: Doc's Doodads
//==========================================================
/*:
 * @target MZ
 * @plugindesc Doc's Doodads - Asset Workspace & Doodad Engine [V2.0]
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
 * KEY CAPABILITIES:
 * 1. Visual Asset Drawer:
 *    - Virtualized browsing for 10,000+ assets with lightning performance.
 *    - Thumbnail slider (32px - 256px), list & grid views, folder hierarchy.
 *    - Real-time tokenized search (type:, tag:, folder:, favorite:, animated:, -neg).
 *    - Favorites, custom collections, and recently used asset tracking.
 *
 * 2. Intelligent Slicing Engine & Interactive Slicer Modal:
 *    - Automatic detection of standard MZ sheets ($Single, 8-character, Faces, IconSet, SV).
 *    - Divisor-based grid candidate scoring.
 *    - Sidecar atlas metadata parsing (Aseprite, TexturePacker, .saf.json).
 *    - Canvas visual auto-slicer with adaptive Otsu alpha thresholding, border flood,
 *      morphological cleanup, 4-connected components, and gutter splitting.
 *    - Interactive 1600% zoomable Slicer Modal with 8-handle drag/resize, smart snapping,
 *      alignment guides, region list sidebar, split, merge, align, distribute,
 *      and authoritative non-destructive slice metadata persistence.
 *    - PNG slice exporter (individual PNGs, batch, animation strips).
 *
 * 3. Drag-and-Drop Placement, Live Ghost Preview & Stamping:
 *    - Drag any asset or slice directly onto the map with live ghost preview.
 *    - Free placement or tile grid snapping (48px or custom, hold Alt for free).
 *    - Stamping mode (click repeatedly to place props).
 *    - Eyedropper tool (Alt+Click placed object to select in drawer).
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
 *    - Direct physical SAT collision without creating invisible blocker events.
 *    - Collision presets: Full Bounds, Bottom Half, Bottom Third, Center Box, Trunk, Wall.
 *    - Interactive visual collision rectangle editor in Inspector using relative coordinates.
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
 * 11. Post-Processing (toolbar: Post FX):
 *    - Bloom, colour grading, vignette, film grain, chromatic aberration, lens
 *      distortion, CRT, pixelate, sharpen and tilt-shift, with presets.
 *    - A game-wide look plus per-map looks; Set Post-Processing Look fades between
 *      them; Play Screen Effect for impact zoom, shockwaves and flashes.
 *    - Quality setting, an Effects Quality option for players, and full-map
 *      PNG export to the screenshots folder.
 *
 * 12. Particles, VFX & Character Animation (toolbar: VFX):
 *    - Particle emitters on doodads (smoke, embers, fire, fireflies, leaves,
 *      mist, dust, sparkles, snow, bubbles, magic); grass that bends when walked through.
 *    - VFX builder: particle and sprite-sheet layers; Play VFX plugin command.
 *    - Character sheets: [f8] frames per row, [d1] single row, [d8] 8 directions;
 *      Name_idle / Name_run cycles; Play Character Action; optional diagonal movement.
 *
 * 13. Spatial Sound (map panel: Spatial Sound, Sound (this map)):
 *    - Event and move-route sound effects are quieter far away and panned left/right,
 *      with slight random pitch/volume variation. <no spatial> opts an event out.
 *    - Ambient sounds on doodads and events (<sound: River, 80, 8>), cave echo,
 *      background sounds by region, and the Play SE At plugin command.
 *
 * 14. Editor Tools:
 *    - Layers per map (show/hide, lock, hide in game), Symmetry, Biome brush,
 *      Dressing Rules (water edges, wall bases, beside paths...), visual save History,
 *      animated drawer thumbnails, and the Ctrl+K command palette.
 *
 * 15. Visual Equipment & Destination Marker (map panel):
 *    - Paper-doll characters: a bare body plus parts. <visual: Sheet, z -1, part clothes>
 *      on weapons/armors/states draws a layer and replaces the body's part of the same
 *      name; "up N" is the order while facing up. Shows on the player, followers,
 *      events and side-view battlers (sv SheetName). Also
 *      <visual base: ...>, <visual hide: hair>, <visual color: hair, switch 12, hue 120>,
 *      <visual alias: Elf> ({alias} in image names) and <visual actor: N> on events.
 *    - The equip screen previews the highlighted item; save files show the gear.
 *    - The click-to-walk marker: shapes, images, animations or VFX, pulse, spin,
 *      bob, path dots; Set Destination Marker changes it mid-game.
 *
 * 16. Modern Operations & Safety:
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
 * - Alt + Click      : Eyedropper (pick placed object on map)
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
 * @type select
 * @option F1
 * @option F6
 * @option F7
 * @option F8
 * @option F9
 * @option F10
 * @default F10
 * @desc Key to open/close the Asset Workspace editor during test play.
 *
 * @param editorMode
 * @text Editor Enabled
 * @type boolean
 * @default true
 * @desc Enables the Asset Workspace and in-game editing tools during test play.
 *
 * @param folderName
 * @text Doodads Image Folder
 * @type text
 * @default doodads/
 * @desc Default subfolder inside img/ for decorative doodads.
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
 * @default 48
 * @desc Width of the placement snapping grid.
 *
 * @param gridSnapHeight
 * @text Grid Snap Height
 * @type number
 * @default 48
 * @desc Height of the placement snapping grid.
 *
 * @param enableMVCompatibility
 * @text Enable MV Compatibility
 * @type boolean
 * @default true
 * @desc Enable compatibility layer when running under RPG Maker MV.
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
 */

var DocsDoodads = (typeof window !== 'undefined' ? (window.DocsDoodads = window.DocsDoodads || { reWrite: {} }) : { reWrite: {} });
var Imported = (typeof window !== 'undefined' ? (window.Imported = window.Imported || {}) : {});
Imported.DocsDoodads = true;

function Sprite_DocsDoodad() {
    this.initialize(...arguments);
}
function Sprite_DocsDoodadsMouseCursor() {
    this.initialize(...arguments);
}

(($) => {
"use strict";


//==========================================================
// SECTION 1: CORE CONSTANTS & PARAMETERS
//==========================================================
const pluginName = "Docs-Doodads";

// Doc's Doodads began as QJ-Doodads. Names used by those builds are read as a fallback so
// existing projects keep their settings, data, backups, and recovery snapshots.
DocsDoodads.Legacy = {
    pluginName: 'QJ-Doodads',
    dataFileName: 'DoodadsQJ.json',
    backupDirectory: 'data/qj_asset_cache/backups',
    files: {
        'data/DocsDoodadsLibrary.json': 'data/QJAssetLibrary.json',
        'data/DocsDoodadsEventTemplates.json': 'data/QJEventTemplates.json',
        'data/DocsDoodadsLayouts.json': 'data/QJWorkspaceLayouts.json',
        'data/DocsDoodadsRecovery.json': 'data/QJAssetWorkspaceRecovery.json'
    },
    pathFor(filePath) {
        return this.files[String(filePath).replace(/\\/g, '/').replace(/^\.\//, '')] || null;
    }
};

function readPluginParameters() {
    if (typeof PluginManager === 'undefined' || !PluginManager.parameters) return {};
    const current = PluginManager.parameters(pluginName) || {};
    if (Object.keys(current).length > 0) return current;
    return PluginManager.parameters(DocsDoodads.Legacy.pluginName) || {};
}
const parameters = readPluginParameters();

function parseBooleanParameter(value, fallback) {
    if (typeof value === 'boolean') return value;
    if (value === undefined || value === null || value === '') return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
    return fallback;
}

function parseNumberParameter(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function safePluginFolder(value) {
    const segments = String(value || 'doodads').replace(/\\/g, '/').split('/')
        .filter(segment => segment && segment !== '.' && segment !== '..')
        .map(segment => segment.replace(/[<>:"|?*\x00-\x1f]/g, '_'))
        .filter(Boolean);
    return (segments.length ? segments.join('/') : 'doodads') + '/';
}

function safeDataBaseName(value) {
    const safe = String(value || 'DocsDoodads')
        .replace(/\.json$/i, '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/^\.+|\.+$/g, '');
    return safe || 'DocsDoodads';
}

DocsDoodads.Security = DocsDoodads.Security || {
    escapeHtml(value) {
        return String(value === undefined || value === null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }
};

const escapeHtml = DocsDoodads.Security.escapeHtml;
const editKey = String(parameters.editKey || "F10");
const folderName = "img/" + safePluginFolder(parameters.folderName);
const editorMode = parseBooleanParameter(parameters.editorMode, true);
const dataFileName = safeDataBaseName(parameters.dataFileName) + ".json";
const pluginVersion = 2.0;
const doodadScaleMode = parseBooleanParameter(parameters.doodadScaleMode, true);
const saveMode = parseBooleanParameter(parameters.saveMode, false);

const defaultLayoutName = String(parameters.defaultLayout || "Mapping");
const defaultThumbnailSize = parseNumberParameter(parameters.defaultThumbnailSize, 96, 32, 256);
const cacheEnabled = parseBooleanParameter(parameters.cacheEnabled, true);
const backgroundWorkBudget = parseNumberParameter(parameters.backgroundWorkBudget, 4, 1, 16);
const autosaveRecoveryInterval = parseNumberParameter(parameters.autosaveRecoveryInterval, 60, 0, 600);
const backupRetentionCount = Math.round(parseNumberParameter(parameters.backupRetentionCount, 10, 1, 50));
const enableMVCompatibility = parseBooleanParameter(parameters.enableMVCompatibility, true);
const devDiagnostics = parseBooleanParameter(parameters.devDiagnostics, false);

//==========================================================
// SECTION 2: STANDARD STRUCTS & RUNTIME DATA
//==========================================================
DocsDoodads.standardStructData = {
    bit: [1],
    index: 0,
    anchorX: 0.5,
    anchorY: 1,
    posMode: 1, // 0: screen, 1: map
    x: 0,
    y: 0,
    z: 0,
    depth: "sorted",
    sortOffsetY: 0,
    scaleX: 1,
    scaleY: 1,
    blend: 0,
    opacity: 1,
    rotation: 0,
    rotateSpeed: 0,
    r: 0,
    g: 0,
    b: 0,
    grey: 0,
    xFrame: 1,
    yFrame: 1,
    frameUpdate: 0,
    frameX: 0,
    frameY: 0,
    frameW: 32,
    frameH: 32,
    switch: [],
    condition: "",
    blur: 0,
    contrast: 0,
    sepia: false,
    hue: 0,
    bright: false,
    collision: {
        preset: "none",
        shape: null
    }
};

DocsDoodads.standardStruct = function() {
    return (typeof JsonEx !== 'undefined' && JsonEx.makeDeepCopy) ? 
        JsonEx.makeDeepCopy(DocsDoodads.standardStructData) : 
        JSON.parse(JSON.stringify(DocsDoodads.standardStructData));
};

DocsDoodads.initPluginData = {
    version: pluginVersion
};

//==========================================================
// SECTION 3: SEPARATING AXIS THEOREM (SAT.JS) PHYSICS ENGINE
//==========================================================
function SATVector(x, y) { this.x = x || 0; this.y = y || 0; }
SATVector.prototype.copy = function(other) { this.x = other.x; this.y = other.y; return this; };
SATVector.prototype.clone = function() { return new SATVector(this.x, this.y); };
SATVector.prototype.perp = function() { var x = this.x; this.x = this.y; this.y = -x; return this; };
SATVector.prototype.rotate = function(angle) { var x = this.x; var y = this.y; this.x = x * Math.cos(angle) - y * Math.sin(angle); this.y = x * Math.sin(angle) + y * Math.cos(angle); return this; };
SATVector.prototype.reverse = function() { this.x = -this.x; this.y = -this.y; return this; };
SATVector.prototype.normalize = function() { var d = this.len(); if (d > 0) { this.x = this.x / d; this.y = this.y / d; } return this; };
SATVector.prototype.add = function(other) { this.x += other.x; this.y += other.y; return this; };
SATVector.prototype.sub = function(other) { this.x -= other.x; this.y -= other.y; return this; };
SATVector.prototype.scale = function(x, y) { this.x *= x; this.y *= typeof y !== 'undefined' ? y : x; return this; };
SATVector.prototype.project = function(other) { var amt = this.dot(other) / other.len2(); this.x = amt * other.x; this.y = amt * other.y; return this; };
SATVector.prototype.projectN = function(other) { var amt = this.dot(other); this.x = amt * other.x; this.y = amt * other.y; return this; };
SATVector.prototype.reflect = function(axis) { var x = this.x; var y = this.y; this.project(axis).scale(2); this.x -= x; this.y -= y; return this; };
SATVector.prototype.reflectN = function(axis) { var x = this.x; var y = this.y; this.projectN(axis).scale(2); this.x -= x; this.y -= y; return this; };
SATVector.prototype.dot = function(other) { return this.x * other.x + this.y * other.y; };
SATVector.prototype.len2 = function() { return this.dot(this); };
SATVector.prototype.len = function() { return Math.sqrt(this.len2()); };

function SATCircle(pos, r) { this.pos = pos || new SATVector(); this.r = r || 0; this.offset = new SATVector(); }
SATCircle.prototype.getAABBAsBox = function() { var r = this.r; var corner = this.pos.clone().add(this.offset).sub(new SATVector(r, r)); return new SATBox(corner, r * 2, r * 2); };
SATCircle.prototype.getAABB = function() { return this.getAABBAsBox().toPolygon(); };
SATCircle.prototype.setOffset = function(offset) { this.offset = offset; return this; };

function SATPolygon(pos, points) { this.pos = pos || new SATVector(); this.angle = 0; this.offset = new SATVector(); this.setPoints(points || []); }
SATPolygon.prototype.setPoints = function(points) {
    var lengthChanged = !this.points || this.points.length !== points.length;
    if (lengthChanged) {
        var i;
        var calcPoints = this.calcPoints = [];
        var edges = this.edges = [];
        var normals = this.normals = [];
        for (i = 0; i < points.length; i++) {
            var p1 = points[i];
            var p2 = i < points.length - 1 ? points[i + 1] : points[0];
            if (p1 !== p2 && p1.x === p2.x && p1.y === p2.y) {
                points.splice(i, 1);
                i -= 1;
                continue;
            }
            calcPoints.push(new SATVector());
            edges.push(new SATVector());
            normals.push(new SATVector());
        }
    }
    this.points = points;
    this._recalc();
    return this;
};
SATPolygon.prototype.setAngle = function(angle) { this.angle = angle; this._recalc(); return this; };
SATPolygon.prototype.setOffset = function(offset) { this.offset = offset; return this; };
SATPolygon.prototype.rotate = function(angle) { for (var i = 0; i < this.points.length; i++) { this.points[i].rotate(angle); } this._recalc(); return this; };
SATPolygon.prototype.translate = function(x, y) { for (var i = 0; i < this.points.length; i++) { this.points[i].x += x; this.points[i].y += y; } this._recalc(); return this; };
SATPolygon.prototype._recalc = function() {
    var calcPoints = this.calcPoints, edges = this.edges, normals = this.normals, points = this.points, offset = this.offset, angle = this.angle;
    var len = points.length, i;
    for (i = 0; i < len; i++) {
        var calcPoint = calcPoints[i].copy(points[i]);
        calcPoint.x += offset.x; calcPoint.y += offset.y;
        if (angle !== 0) calcPoint.rotate(angle);
    }
    for (i = 0; i < len; i++) {
        var p1 = calcPoints[i];
        var p2 = i < len - 1 ? calcPoints[i + 1] : calcPoints[0];
        var e = edges[i].copy(p2).sub(p1);
        normals[i].copy(e).perp().normalize();
    }
    return this;
};
SATPolygon.prototype.getAABBAsBox = function() {
    var points = this.calcPoints, len = points.length;
    var xMin = points[0].x, yMin = points[0].y, xMax = points[0].x, yMax = points[0].y;
    for (var i = 1; i < len; i++) {
        var point = points[i];
        if (point.x < xMin) xMin = point.x; else if (point.x > xMax) xMax = point.x;
        if (point.y < yMin) yMin = point.y; else if (point.y > yMax) yMax = point.y;
    }
    return new SATBox(this.pos.clone().add(new SATVector(xMin, yMin)), xMax - xMin, yMax - yMin);
};
SATPolygon.prototype.getAABB = function() { return this.getAABBAsBox().toPolygon(); };
SATPolygon.prototype.getCentroid = function() {
    var points = this.calcPoints, len = points.length, cx = 0, cy = 0, ar = 0;
    for (var i = 0; i < len; i++) {
        var p1 = points[i];
        var p2 = i === len - 1 ? points[0] : points[i + 1];
        var a = p1.x * p2.y - p2.x * p1.y;
        cx += (p1.x + p2.x) * a; cy += (p1.y + p2.y) * a; ar += a;
    }
    ar = ar * 3;
    return new SATVector(cx / ar, cy / ar);
};

function SATBox(pos, w, h) { this.pos = pos || new SATVector(); this.w = w || 0; this.h = h || 0; }
SATBox.prototype.toPolygon = function() {
    var pos = this.pos, w = this.w, h = this.h;
    return new SATPolygon(new SATVector(pos.x, pos.y), [
        new SATVector(), new SATVector(w, 0), new SATVector(w, h), new SATVector(0, h)
    ]);
};

function SATResponse() {
    this.a = null; this.b = null; this.overlapN = new SATVector(); this.overlapV = new SATVector(); this.clear();
}
SATResponse.prototype.clear = function() {
    this.aInB = true; this.bInA = true; this.overlap = Number.MAX_VALUE; return this;
};

var TEST_POINT = new SATVector();
var RESPONSE = new SATResponse();
var T_VECTORS = [];
for (var i = 0; i < 10; i++) { T_VECTORS.push(new SATVector()); }
var T_ARRAYS = [];
for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE, max = -Number.MAX_VALUE, len = points.length, i;
    for (i = 0; i < len; i++) {
        var dot = points[i].dot(normal);
        if (dot < min) { min = dot; }
        if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
}

function isSeparatingAxis(aPos, bPos, aPoints, bPoints, normal, response) {
    var rangeA = T_ARRAYS[0], rangeB = T_ARRAYS[1];
    var offsetV = T_VECTORS[0].copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(normal);
    flattenPointsOn(aPoints, normal, rangeA);
    flattenPointsOn(bPoints, normal, rangeB);
    rangeB[0] += projectedOffset; rangeB[1] += projectedOffset;
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) { return true; }
    if (response) {
        var overlap = 0;
        if (rangeA[0] < rangeB[0]) {
            response.aInB = false;
            if (rangeA[1] < rangeB[1]) { overlap = rangeA[1] - rangeB[0]; response.bInA = false; }
            else { var o1 = rangeA[1] - rangeB[0], o2 = rangeB[1] - rangeA[0]; overlap = o1 < o2 ? o1 : -o2; }
        } else {
            response.bInA = false;
            if (rangeA[1] > rangeB[1]) { overlap = rangeA[0] - rangeB[1]; response.aInB = false; }
            else { var o1 = rangeA[1] - rangeB[0], o2 = rangeB[1] - rangeA[0]; overlap = o1 < o2 ? o1 : -o2; }
        }
        var absOverlap = Math.abs(overlap);
        if (absOverlap < response.overlap) {
            response.overlap = absOverlap;
            response.overlapN.copy(normal);
            if (overlap < 0) { response.overlapN.reverse(); }
        }
    }
    return false;
}

function testPolygonPolygon(a, b, response) {
    var aPoints = a.calcPoints, aLen = aPoints.length, bPoints = b.calcPoints, bLen = bPoints.length, i;
    if (response) { response.clear(); response.a = a; response.b = b; }
    for (i = 0; i < aLen; i++) { if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, a.normals[i], response)) { return false; } }
    for (i = 0; i < bLen; i++) { if (isSeparatingAxis(a.pos, b.pos, aPoints, bPoints, b.normals[i], response)) { return false; } }
    if (response) { response.overlapV.copy(response.overlapN).scale(response.overlap); }
    return true;
}

function testCirclePolygon(circle, polygon, response) {
    if (response) { response.clear(); response.a = circle; response.b = polygon; }
    var circlePos = circle.pos.clone().add(circle.offset);
    var radius = circle.r, radius2 = radius * radius;
    var points = polygon.calcPoints, len = points.length;
    var edge = T_VECTORS[0], point = T_VECTORS[1];
    for (var i = 0; i < len; i++) {
        var b = i === len - 1 ? points[0] : points[i + 1];
        var a = points[i];
        edge.copy(polygon.edges[i]);
        point.copy(circlePos).sub(polygon.pos).sub(a);
        if (response && point.len2() > radius2) { response.aInB = false; }
        var region = point.dot(edge);
        if (region < 0) {
            point.copy(circlePos).sub(polygon.pos).sub(a);
            var dist = point.len();
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(point.normalize()); }
            return true;
        } else if (region > edge.len2()) {
            point.copy(circlePos).sub(polygon.pos).sub(b);
            var dist = point.len();
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(point.normalize()); }
            return true;
        } else {
            var normal = polygon.normals[i];
            var dist = point.dot(normal);
            if (dist > radius) { return false; }
            else if (response) { response.bInA = false; response.overlap = radius - dist; response.overlapN.copy(normal); }
            return true;
        }
    }
    return true;
}

function testPolygonCircle(polygon, circle, response) {
    var result = testCirclePolygon(circle, polygon, response);
    if (result && response) {
        var a = response.a, aInB = response.aInB;
        response.overlapN.reverse();
        response.overlapV.reverse();
        response.a = response.b; response.b = a;
        response.aInB = response.bInA; response.bInA = aInB;
    }
    return result;
}

function testCircleCircle(a, b, response) {
    var aPos = a.pos.clone().add(a.offset), bPos = b.pos.clone().add(b.offset);
    var differenceV = T_VECTORS[0].copy(bPos).sub(aPos);
    var totalRadius = a.r + b.r, totalRadiusSq = totalRadius * totalRadius;
    var distSq = differenceV.len2();
    if (distSq > totalRadiusSq) { return false; }
    if (response) {
        var dist = Math.sqrt(distSq);
        response.clear(); response.a = a; response.b = b;
        response.overlap = totalRadius - dist;
        response.overlapN.copy(differenceV.normalize());
        response.overlapV.copy(response.overlapN).scale(response.overlap);
        response.aInB = a.r <= b.r && dist <= b.r - a.r;
        response.bInA = b.r <= a.r && dist <= a.r - b.r;
    }
    return true;
}

DocsDoodads.V = function(x, y) { return new SATVector(x, y); };
DocsDoodads.C = function(pos, r) { return new SATCircle(pos, r); };
DocsDoodads.B = function(pos, w, h) { return new SATBox(pos, w, h); };
DocsDoodads.P = function(pos, points) { return new SATPolygon(pos, points); };
DocsDoodads.box = function(x, y, w, h) {
    var b = new SATBox(new SATVector(x - w / 2, y - h / 2), w, h);
    return b.toPolygon();
};
DocsDoodads.circle = function(x, y, r) {
    return new SATCircle(new SATVector(x, y), r);
};
DocsDoodads.judge = function(a, b) {
    if (a instanceof SATPolygon && b instanceof SATPolygon) { return testPolygonPolygon(a, b); }
    if (a instanceof SATCircle && b instanceof SATPolygon) { return testCirclePolygon(a, b); }
    if (a instanceof SATPolygon && b instanceof SATCircle) { return testPolygonCircle(a, b); }
    if (a instanceof SATCircle && b instanceof SATCircle) { return testCircleCircle(a, b); }
    return false;
};


//==========================================================
// SECTION 4: DATA LOAD / SAVE & LEGACY VS TRANSLATION
//==========================================================
DocsDoodads.migrateData = function(data, type) {
    if (!data) return data;
    if (type === 'doodads') {
        for (var mapId in data) {
            var list = data[mapId];
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    var d = list[i];
                    if (!d.collision) d.collision = { preset: "none", shape: null };
                    if (d.scaleX === undefined) d.scaleX = 1;
                    if (d.scaleY === undefined) d.scaleY = 1;
                    if (d.anchorX === undefined) d.anchorX = 0.5;
                    if (d.anchorY === undefined) d.anchorY = 1.0;
                    if (d.opacity === undefined) d.opacity = 1.0;
                    if (d.posMode === undefined) d.posMode = 1;
                    if (d.rotation === undefined) d.rotation = 0;
                    if (d.rotateSpeed === undefined) d.rotateSpeed = 0;
                    if (!d.switch) d.switch = [];
                    if (d.condition === undefined) d.condition = "";
                    if (!DocsDoodads.Depth.modes.includes(d.depth)) d.depth = DocsDoodads.Depth.fromLegacyZ(d.z);
                }
            }
        }
    } else if (type === 'library') {
        if (!data.version || data.version < 2) {
            data.version = 2;
            data.settings = data.settings || {};
            data.collections = data.collections || {};
            data.assets = data.assets || {};
        }
    }
    return data;
};

if (typeof DataManager !== 'undefined') {
    $.DataManager_loadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        $.DataManager_loadDatabase.call(this);
        this.loadDocsDoodadsData();
    };

    DataManager.loadDocsDoodadsData = function() {
        // Projects saved by QJ-Doodads have DoodadsQJ.json until they are saved again.
        const candidates = ['data/' + dataFileName];
        if (dataFileName === 'DocsDoodads.json') candidates.push('data/' + DocsDoodads.Legacy.dataFileName);
        const tryLoad = (index) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', candidates[index]);
            xhr.overrideMimeType('application/json');
            const next = () => {
                if (index + 1 < candidates.length) {
                    tryLoad(index + 1);
                } else {
                    window.$dataDocsDoodads = {};
                    DataManager.checkDocsDoodadsData();
                }
            };
            xhr.onload = function() {
                if (xhr.status < 400) {
                    window.$dataDocsDoodads = JSON.parse(xhr.responseText);
                    DataManager.checkDocsDoodadsData();
                } else {
                    next();
                }
            };
            xhr.onerror = next;
            xhr.send();
        };
        tryLoad(0);
    };

    DataManager.loadDocsDoodadsPacked = function() {
        if (!DocsDoodads.Packer.shouldRequestManifest()) return;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', DocsDoodads.Packer.manifestPath);
        xhr.overrideMimeType('application/json');
        xhr.onload = function() {
            if (xhr.status < 400) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data && data.maps) DocsDoodads.Packer.data = data;
                } catch (e) {}
            }
        };
        xhr.onerror = function() {};
        xhr.send();
    };

    DataManager.checkDocsDoodadsData = function() {
        if (!window.$dataDocsDoodads) window.$dataDocsDoodads = {};
        DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
        DataManager.loadDocsDoodadsPacked();
    };

    DataManager.saveDocsDoodadsData = function() {
        if (typeof StorageManager !== 'undefined') {
            const fs = (typeof require !== 'undefined') ? require('fs') : null;
            if (fs) {
                const filePath = 'data/' + dataFileName;
                const content = saveMode ? JSON.stringify(window.$dataDocsDoodads) : JSON.stringify(window.$dataDocsDoodads, null, 2);
                fs.writeFileSync(filePath, content);
            }
        }
    };

    DataManager.loadMapDataSyncDocsDoodads = function(type, mapId) {
        const fs = (typeof require !== 'undefined') ? require('fs') : null;
        if (!fs) return null;
        const filePath = 'data/Map' + String(mapId).padStart(3, '0') + '.json';
        if (fs.existsSync(filePath)) {
            try {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch(e) {
                return null;
            }
        }
        return null;
    };
}

DocsDoodads.doodads = function(mapId) {
    if (typeof window === 'undefined' || !window.$dataDocsDoodads) return [];
    mapId = mapId || (window.$gameMap ? window.$gameMap.mapId() : 0);
    return window.$dataDocsDoodads[mapId] || [];
};

//==========================================================
// SECTION 5: BITMAP / TEXTURE PRELOADING
//==========================================================
DocsDoodads.loadBitmap = function(path) {
    if (typeof ImageManager === 'undefined') return null;
    const full = String(path).replace(/\\/g, '/');
    const versioned = DocsDoodads.LiveReload ? DocsDoodads.LiveReload.urlFor(full) : full;
    if (versioned !== full && typeof ImageManager.loadBitmapFromUrl === 'function') {
        return ImageManager.loadBitmapFromUrl(versioned);
    }
    if (path.startsWith('img/')) {
        path = path.slice(4);
    }
    const slash = path.indexOf('/');
    if (slash > -1) {
        const folder = 'img/' + path.slice(0, slash + 1);
        const file = path.slice(slash + 1).replace(/\.[^/.]+$/, "");
        return ImageManager.loadBitmap(folder, file);
    }
    return ImageManager.loadBitmap('img/', path.replace(/\.[^/.]+$/, ""));
};

//==========================================================
// SECTION 5B: RENDER EFFECTS (DEPTH, APPEARANCE, MOTION, SHADOWS, LIGHTS)
//==========================================================
// Doodads live in the tilemap beside the characters (as in QJ-Doodads), so the tilemap's
// z-then-y sort puts a "sorted" doodad in front of or behind the player by its base line.
DocsDoodads.Depth = {
    modes: ['below', 'sorted', 'above'],
    labels: { below: 'Below characters (floor decal)', sorted: 'Sorted with characters', above: 'Above characters (overhang)' },
    // Ground tiles are z 0, below/same/above-priority characters 1/3/5, upper tiles 4.
    bands: { below: 0.5, sorted: 3, above: 4.5 },
    shadowZ: 0.59,
    bandSpread: 0.08,

    // QJ-Doodads used z directly as the tilemap layer.
    fromLegacyZ(z) {
        z = Number(z) || 0;
        if (z < 3) return 'below';
        if (z === 3) return 'sorted';
        return 'above';
    },

    resolve(d) {
        return d && this.modes.includes(d.depth) ? d.depth : this.fromLegacyZ(d && d.z);
    },

    spriteZ(d) {
        const mode = this.resolve(d);
        if (mode === 'sorted') return this.bands.sorted;
        const order = Math.max(-this.bandSpread, Math.min(this.bandSpread, (Number(d.z) || 0) * 1e-4));
        return this.bands[mode] + order;
    },

    // Bottom edge of the image (map or screen space, same as d.y) plus the user's base-line offset.
    baseY(d) {
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const ay = d.anchorY !== undefined ? d.anchorY : 1;
        return d.y + h * (1 - ay) + (Number(d.sortOffsetY) || 0);
    },

    compareChildren(a, b) {
        if (a.z !== b.z) return a.z - b.z;
        const ay = a._docsSortY !== undefined ? a._docsSortY : a.y;
        const by = b._docsSortY !== undefined ? b._docsSortY : b.y;
        if (ay !== by) return ay - by;
        return (a.spriteId || 0) - (b.spriteId || 0);
    },

    // Flat things (rugs, puddles, paths) belong under the player; everything else stands up.
    suggestFor(asset) {
        const words = [String(asset && asset.fileName || '')].concat((asset && asset.tags) || [], (asset && asset.autoTags) || []).join(' ').toLowerCase();
        return /(^|[^a-z])(rugs?|carpets?|mats?|floor|decals?|puddles?|paths?|roads?|shadows?|stains?|cracks?|ground)([^a-z]|$)/.test(words) ? 'below' : 'sorted';
    }
};

DocsDoodads.Appearance = {
    // PIXI.BLEND_MODES values: NORMAL 0, ADD 1, MULTIPLY 2, SCREEN 3.
    blendModes: [
        { value: 0, label: 'Normal' }, { value: 1, label: 'Add (glow)' },
        { value: 2, label: 'Multiply (shade)' }, { value: 3, label: 'Screen (light)' }
    ],

    blendMode(d) {
        const value = Number(d && d.blend) || 0;
        return this.blendModes.some(mode => mode.value === value) ? value : 0;
    },

    // QJ stored "5|true~6|false"; newer data stores [[5, true]] or [{ id, value }].
    parseSwitches(input) {
        if (!input) return [];
        const out = [];
        const push = (id, value) => {
            id = parseInt(id, 10);
            if (id > 0) out.push([id, value]);
        };
        const truthy = value => value === true || /^(true|on|1)$/i.test(String(value).trim());
        if (typeof input === 'string') {
            for (const part of input.split('~')) {
                if (!part.trim()) continue;
                const [id, value] = part.split('|');
                push(id, value === undefined ? true : truthy(value));
            }
        } else if (Array.isArray(input)) {
            for (const item of input) {
                if (Array.isArray(item)) push(item[0], item[1] === undefined ? true : truthy(item[1]));
                else if (item && typeof item === 'object') push(item.id, item.value === undefined ? true : truthy(item.value));
                else push(item, true);
            }
        }
        return out;
    },

    // Inspector text such as "5:on, 6 off, 7".
    parseSwitchText(text) {
        const out = [];
        for (const part of String(text || '').split(/[,;]+/)) {
            const match = part.trim().match(/^(\d+)\s*[:=|\s]?\s*(on|off|true|false|1|0)?$/i);
            if (!match) continue;
            const id = parseInt(match[1], 10);
            if (id > 0) out.push([id, match[2] === undefined ? true : /^(on|true|1)$/i.test(match[2])]);
        }
        return out;
    },

    formatSwitches(list) {
        return this.parseSwitches(list).map(([id, value]) => `${id}:${value ? 'on' : 'off'}`).join(', ');
    },

    _conditionCache: {},

    // Conditions are JavaScript from the project's own data file, like QJ-Doodads; errors never hide a doodad.
    conditionPasses(condition) {
        const source = String(condition || '').trim();
        if (!source) return true;
        let fn = this._conditionCache[source];
        if (fn === undefined) {
            try { fn = new Function(`return (${source});`); } catch (error) { fn = null; }
            this._conditionCache[source] = fn;
        }
        if (!fn) return true;
        try { return Boolean(fn()); } catch (error) { return true; }
    },

    isVisible(d, ctx = {}) {
        if (ctx.editing) return true;
        const switchValue = ctx.switchValue || (id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false));
        for (const [id, value] of this.parseSwitches(d.switch)) {
            if (Boolean(switchValue(id)) !== value) return false;
        }
        if (Array.isArray(d.seasons) && d.seasons.length > 0) {
            const season = ctx.season !== undefined ? ctx.season : DocsDoodads.Atmosphere.season();
            if (!DocsDoodads.Seasons.visibleIn(d, season)) return false;
        }
        return this.conditionPasses(d.condition);
    },

    // Only conditional doodads need a per-frame visibility check.
    isConditional(d) {
        return this.parseSwitches(d.switch).length > 0 || Boolean(String(d.condition || '').trim())
            || (Array.isArray(d.seasons) && d.seasons.length > 0);
    },

    needsColorFilter(d) {
        return Boolean(Number(d.r) || Number(d.g) || Number(d.b) || Number(d.grey) || Number(d.hue));
    },

    // Fields that change the filter stack; position and scale are excluded so moving stays cheap.
    signature(d) {
        const m = d.motion && d.motion.type === 'shimmer' ? 'shimmer' + (d.motion.amount || 0) : '';
        return [d.r, d.g, d.b, d.grey, d.hue, d.blur, d.contrast, d.sepia, d.bright, d.blend, m].join('|');
    }
};

// PIXI's vertex shader declares inputSize as highp; a fragment shader reading it must match or WebGL refuses to link.
const fragmentPrecision = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif';

DocsDoodads.Motion = {
    types: [
        { value: 'none', label: 'None' }, { value: 'sway', label: 'Sway (wind)' }, { value: 'bob', label: 'Bob (float)' },
        { value: 'pulse', label: 'Pulse (breathe)' }, { value: 'flicker', label: 'Flicker (flame)' }, { value: 'shimmer', label: 'Shimmer (water/heat)' }
    ],

    normalize(m) {
        const type = m && this.types.some(t => t.value === m.type) ? m.type : 'none';
        const amount = m && m.amount !== undefined ? Math.max(0, Math.min(1, Number(m.amount) || 0)) : 0.5;
        const speed = m && m.speed !== undefined ? Math.max(0.05, Math.min(5, Number(m.speed) || 1)) : 1;
        return { type, amount, speed, phase: m && m.phase !== undefined ? Number(m.phase) || 0 : null };
    },

    // Smooth 1D value noise in [0, 1].
    noise(x) {
        const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
        const i = Math.floor(x), f = x - i;
        const t = f * f * (3 - 2 * f);
        return hash(i) * (1 - t) + hash(i + 1) * t;
    },

    // seed (usually the doodad's x + y) staggers the phase so neighbouring props don't move in lockstep.
    sample(m, time, seed) {
        const out = { skewX: 0, offsetY: 0, alphaMul: 1, scaleMul: 1 };
        if (!m || m.type === 'none' || !m.type) return out;
        const phase = m.phase !== null && m.phase !== undefined ? m.phase : (Number(seed) || 0) * 0.013;
        const wave = Math.sin(Math.PI * 2 * m.speed * 0.5 * time + phase);
        if (m.type === 'sway') out.skewX = wave * m.amount * 0.12;
        else if (m.type === 'bob') out.offsetY = wave * m.amount * 6;
        else if (m.type === 'pulse') out.scaleMul = 1 + wave * m.amount * 0.06;
        else if (m.type === 'flicker') out.alphaMul = 1 - m.amount * 0.35 * this.noise(time * m.speed * 8 + phase * 10);
        return out;
    },

    // Horizontal ripple for "shimmer"; inputSize is supplied by PIXI v5 filters.
    shimmerFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform float time;',
        'uniform float amount;',
        'void main(void) {',
        '    vec2 uv = vTextureCoord;',
        '    uv.x += sin(uv.y * inputSize.y / 7.0 + time * 3.0) * amount * 2.0 * inputSize.z;',
        '    gl_FragColor = texture2D(uSampler, uv);',
        '}'
    ].join('\n')
};

DocsDoodads.Shadow = {
    defaults: { enabled: false, opacity: 0.35, length: 0.45, angle: -35, blur: 2, offsetX: 0, offsetY: 0, followSun: false },

    normalize(s) {
        return Object.assign({}, this.defaults, s || {});
    },

    // A black silhouette of the same frame, squashed and leaning away from the camera, or, when it
    // follows the sun ({ angle, lengthMul, strength } from DocsDoodads.Sun), lying on the ground away from it.
    transform(d, sun) {
        if (!d || !d.shadow || !d.shadow.enabled) return null;
        const s = this.normalize(d.shadow);
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;
        const opacity = d.opacity !== undefined ? d.opacity : 1;
        if (s.followSun && sun) {
            const t = DocsDoodads.Sun.transform(sun, s);
            return { scaleX: sx, scaleY: Math.abs(sy) * t.scaleY, skewX: 0, rotation: t.rotation, alpha: t.alpha * opacity,
                offsetX: t.offsetX, offsetY: t.offsetY, blur: t.blur, followsSun: true };
        }
        return {
            rotation: 0,
            scaleX: sx,
            scaleY: sy * Math.max(0.05, Math.min(1.5, Number(s.length) || 0)),
            skewX: (Number(s.angle) || 0) * Math.PI / 180,
            alpha: Math.max(0, Math.min(1, Number(s.opacity) || 0)) * opacity,
            offsetX: Number(s.offsetX) || 0,
            offsetY: Number(s.offsetY) || 0,
            blur: Math.max(0, Number(s.blur) || 0)
        };
    }
};

DocsDoodads.Lighting = {
    lightDefaults: { enabled: false, color: '#ffd27f', radius: 144, intensity: 0.85, flicker: 0, glow: 0.25, offsetX: 0, offsetY: -24, when: 'always' },
    whenOptions: [{ value: 'always', label: 'Always on' }, { value: 'dark', label: 'After dark (lamps, windows)' }],
    ambientDefaults: { darkness: 0, color: '#101830', switchId: 0 },

    parseColor(value, fallback = 0xffffff) {
        if (typeof value === 'number' && isFinite(value)) return value & 0xffffff;
        const match = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i);
        return match ? parseInt(match[1], 16) : fallback;
    },

    channels(color) {
        const c = this.parseColor(color, 0);
        return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
    },

    // Per-map settings sit beside the numeric map keys in $dataDocsDoodads.
    mapSettings(mapId) {
        const data = typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
        if (!data || !data.mapSettings) return null;
        return data.mapSettings[mapId] || null;
    },

    setMapSettings(mapId, settings) {
        if (typeof window === 'undefined' || !window.$dataDocsDoodads) return null;
        const all = window.$dataDocsDoodads.mapSettings = window.$dataDocsDoodads.mapSettings || {};
        all[mapId] = Object.assign({}, all[mapId] || {}, settings);
        return all[mapId];
    },

    // runtimeOverride comes from the "Set Ambient Light" plugin command and wins over the map setting.
    ambientFor(settings, runtimeOverride, switchValue) {
        if (runtimeOverride) {
            return { darkness: Math.max(0, Math.min(1, Number(runtimeOverride.darkness) || 0)), color: runtimeOverride.color || this.ambientDefaults.color };
        }
        const ambient = Object.assign({}, this.ambientDefaults, settings && settings.ambient);
        const gated = Number(ambient.switchId) > 0 && !(switchValue && switchValue(Number(ambient.switchId)));
        return { darkness: gated ? 0 : Math.max(0, Math.min(1, Number(ambient.darkness) || 0)), color: ambient.color };
    },

    // Plugin command fade > day/night clock (on maps that follow it) > the map's own ambient.
    resolveAmbient({ world, minutes, mapSettings, override, switchValue } = {}) {
        if (override) return this.ambientFor(null, override);
        const time = world && world.time;
        if (time && time.source && time.source !== 'off' && minutes !== null && minutes !== undefined
            && DocsDoodads.TimeOfDay.appliesToMap(mapSettings)) {
            const a = DocsDoodads.TimeOfDay.ambientAt(minutes, time.keyframes);
            return { darkness: Math.max(0, Math.min(1, a.darkness)), color: a.color };
        }
        return this.ambientFor(mapSettings, null, switchValue);
    },

    lampTarget(light, darkness, threshold) {
        if (!light || light.when !== 'dark') return 1;
        return (Number(darkness) || 0) >= (threshold === undefined ? 0.3 : Number(threshold)) ? 1 : 0;
    },

    // Fade levels for "after dark" lamps, kept outside the doodad so they are never saved.
    _lampLevels: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    // The lightmap multiplies the scene: white where lit, the ambient colour where fully dark.
    lightmapBase(ambient) {
        const k = Math.max(0, Math.min(1, Number(ambient && ambient.darkness) || 0));
        return this.channels(ambient && ambient.color).map(c => (1 - k) + k * c);
    },

    flicker(time, seed, amount) {
        amount = Math.max(0, Math.min(1, Number(amount) || 0));
        if (!amount) return 1;
        return 1 - amount * DocsDoodads.Motion.noise(time * 6 + (Number(seed) || 0) * 3.7);
    },

    // display: the map's scroll in pixels ({ x, y }) or a map-to-screen function, so lights land in screen space.
    // ctx ({ darkness, threshold, step }) switches "after dark" lamps; without it every light shows (editor previews).
    collect(doodads, display = { x: 0, y: 0 }, ctx) {
        const toScreen = typeof display === 'function' ? display : (x, y) => ({ x: x - display.x, y: y - display.y });
        const out = [];
        for (const d of doodads || []) {
            if (!d || !d.light || !d.light.enabled) continue;
            const l = Object.assign({}, this.lightDefaults, d.light);
            let level = 1;
            if (ctx) {
                const target = this.lampTarget(l, ctx.darkness, ctx.threshold);
                const levels = this._lampLevels;
                level = levels && levels.has(d) ? levels.get(d) : target;
                const step = ctx.step > 0 ? ctx.step : 1;
                level = level < target ? Math.min(target, level + step) : Math.max(target, level - step);
                if (levels) levels.set(d, level);
                if (level <= 0) continue;
            }
            const at = d.posMode !== 0 ? toScreen(d.x, d.y) : { x: d.x, y: d.y };
            out.push({
                doodad: d,
                x: at.x + (Number(l.offsetX) || 0),
                y: at.y + (Number(l.offsetY) || 0),
                radius: Math.max(8, Number(l.radius) || 144),
                color: this.parseColor(l.color, 0xffd27f),
                intensity: Math.max(0, Math.min(1, Number(l.intensity) || 0)) * level,
                flicker: Number(l.flicker) || 0,
                glow: Math.max(0, Math.min(1, Number(l.glow) || 0)),
                seed: (d.x || 0) + (d.y || 0)
            });
        }
        return out;
    },

    mixColor(from, to, p) {
        const a = this.channels(from), b = this.channels(to);
        const mixed = a.map((c, i) => Math.round((c + (b[i] - c) * p) * 255));
        return '#' + mixed.map(c => c.toString(16).padStart(2, '0')).join('');
    },

    startFade(from, to, frames) {
        const total = Math.max(0, Math.round(Number(frames) || 0));
        const fade = { from: Object.assign({}, from), to: Object.assign({}, to), framesTotal: total, framesLeft: total, current: Object.assign({}, total ? from : to) };
        if (!total) fade.current = Object.assign({}, to);
        return fade;
    },

    stepFade(fade) {
        if (!fade || fade.framesLeft <= 0) return fade;
        fade.framesLeft--;
        const p = 1 - fade.framesLeft / fade.framesTotal;
        const a = Number(fade.from.darkness) || 0, b = Number(fade.to.darkness) || 0;
        fade.current = { darkness: fade.framesLeft === 0 ? b : a + (b - a) * p, color: this.mixColor(fade.from.color, fade.to.color, p) };
        return fade;
    }
};

//==========================================================
// SECTION 5C: WORLD ATMOSPHERE (DAY/NIGHT, SUN, CHARACTER FX, SEE-THROUGH, SEASONS, WATER)
//==========================================================
const cloneJson = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

// Project-wide settings, stored as $dataDocsDoodads.world beside the maps and the per-map settings.
DocsDoodads.World = {
    defaults: {
        time: {
            source: 'off', variableId: 0, minuteVariableId: 0, minutesPerSecond: 1, startHour: 8, lampThreshold: 0.3,
            keyframes: [
                { hour: 4, darkness: 0.65, color: '#0c1030' },
                { hour: 6, darkness: 0.3, color: '#ff8a50' },
                { hour: 8, darkness: 0, color: '#ffffff' },
                { hour: 17, darkness: 0, color: '#ffffff' },
                { hour: 19, darkness: 0.3, color: '#ff6a3a' },
                { hour: 21, darkness: 0.65, color: '#0c1030' }
            ]
        },
        sun: { source: 'time', angle: 30, variableId: 0 },
        characterShadows: { enabled: false, mode: 'all', includePlayer: true, opacity: 0.35, length: 0.6, blur: 1, offsetX: 0, offsetY: 0, occlusionRegions: [] },
        motionBlur: { enabled: false, mode: 'all', strength: 1 },
        seeThrough: { enabled: true, mode: 'fade', opacity: 0.4, speed: 0.1, silhouetteColor: '#7dd3fc' },
        reflections: { enabled: false, opacity: 0.4, ripple: 0.5, regionId: 0, shoreInset: 12 },
        seasons: { source: 'off', variableId: 0, names: ['Spring', 'Summer', 'Autumn', 'Winter'], sets: [] },
        postfx: { enabled: true, quality: 'high', includePictures: false, look: {} },
        vfx: { library: [] },
        characterAnim: { diagonal: false, sets: [] },
        sound: { mode: 'auto', near: 2, far: 14, panWidth: 8, pitchVariance: 5, volumeVariance: 8 },
        biomes: { list: [] },
        dress: { rules: [] },
        visualEquip: { enabled: true, followers: true, events: true, battlers: true, menus: true, equipPreview: true },
        destination: {}
    },

    _cache: null,
    _version: 0,

    data() {
        return typeof window !== 'undefined' ? window.$dataDocsDoodads : null;
    },

    // Merged with the defaults one group deep. The result is shared and cached: read it, never change it.
    settings() {
        const data = this.data();
        const stored = data && data.world && typeof data.world === 'object' ? data.world : null;
        const c = this._cache;
        if (c && c.data === data && c.stored === stored && c.version === this._version) return c.value;
        const value = {};
        for (const group of Object.keys(this.defaults)) {
            value[group] = Object.assign(cloneJson(this.defaults[group]), stored && stored[group] ? cloneJson(stored[group]) : {});
        }
        this._cache = { data, stored, version: this._version, value };
        return value;
    },

    get(path) {
        return String(path).split('.').reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), this.settings());
    },

    // The value saved in the project, or undefined when the default applies.
    raw(path) {
        const data = this.data();
        const [group, field] = String(path).split('.');
        const stored = data && data.world && data.world[group];
        return stored ? stored[field] : undefined;
    },

    // undefined removes the field (and empty groups) so the default applies again.
    set(path, value) {
        const data = this.data();
        if (!data) return;
        const [group, field] = String(path).split('.');
        if (value === undefined) {
            if (data.world && data.world[group]) {
                delete data.world[group][field];
                if (Object.keys(data.world[group]).length === 0) delete data.world[group];
                if (Object.keys(data.world).length === 0) delete data.world;
            }
        } else {
            data.world = data.world || {};
            data.world[group] = data.world[group] || {};
            data.world[group][field] = value;
        }
        this._version++;
    },

    invalidate() {
        this._version++;
    }
};

DocsDoodads.TimeOfDay = {
    sources: [
        { value: 'off', label: 'Off' },
        { value: 'clock', label: 'Running clock (saved with the game)' },
        { value: 'variable', label: 'Read from variables' }
    ],

    wrap(minutes) {
        return ((Number(minutes) % 1440) + 1440) % 1440;
    },

    format(minutes) {
        const m = Math.floor(this.wrap(minutes));
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    },

    parse(text) {
        const match = String(text || '').trim().match(/^(\d+)(?::(\d+))?$/);
        if (!match) return null;
        return this.wrap(parseInt(match[1], 10) * 60 + (match[2] ? parseInt(match[2], 10) : 0));
    },

    // Ambient darkness and colour between the two keyframes around the time, wrapping through midnight.
    ambientAt(minutes, keyframes) {
        const keys = (keyframes || [])
            .filter(k => k && isFinite(Number(k.hour)))
            .map(k => ({ m: this.wrap(Number(k.hour) * 60), darkness: clamp01(k.darkness), color: k.color || '#000000' }))
            .sort((a, b) => a.m - b.m);
        if (keys.length === 0) return { darkness: 0, color: '#ffffff' };
        if (keys.length === 1) return { darkness: keys[0].darkness, color: keys[0].color };
        const t = this.wrap(minutes);
        let prev = keys[keys.length - 1], next = keys[0];
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].m <= t) {
                prev = keys[i];
                next = keys[(i + 1) % keys.length];
            }
        }
        const span = this.wrap(next.m - prev.m) || 1440;
        const p = this.wrap(t - prev.m) / span;
        return {
            darkness: prev.darkness + (next.darkness - prev.darkness) * p,
            color: DocsDoodads.Lighting.mixColor(prev.color, next.color, p)
        };
    },

    newClock(minutes) {
        return { minutes: this.wrap(minutes || 0), day: 0, paused: false, speed: null };
    },

    advance(clock, frames, minutesPerSecond) {
        if (!clock || clock.paused) return clock;
        clock.minutes += (Number(frames) || 0) * (Number(minutesPerSecond) || 0) / 60;
        while (clock.minutes >= 1440) {
            clock.minutes -= 1440;
            clock.day = (clock.day || 0) + 1;
        }
        while (clock.minutes < 0) {
            clock.minutes += 1440;
            clock.day = Math.max(0, (clock.day || 0) - 1);
        }
        return clock;
    },

    // env: { variable(id), clock }. null means day/night is off.
    minutesNow(settings, env = {}) {
        const time = settings && settings.time;
        if (!time) return null;
        if (time.source === 'clock') return env.clock ? this.wrap(env.clock.minutes) : null;
        if (time.source === 'variable') {
            const read = id => (Number(id) > 0 && env.variable ? Number(env.variable(Number(id))) || 0 : 0);
            return this.wrap(read(time.variableId) * 60 + read(time.minuteVariableId));
        }
        return null;
    },

    // The running clock writes the hour (and minute) for events to read.
    syncVariables(settings, minutes, setVariable) {
        const time = settings && settings.time;
        if (!time || time.source !== 'clock' || !setVariable) return;
        const m = Math.floor(this.wrap(minutes));
        if (Number(time.variableId) > 0) setVariable(Number(time.variableId), Math.floor(m / 60));
        if (Number(time.minuteVariableId) > 0) setVariable(Number(time.minuteVariableId), m % 60);
    },

    mapModes: [
        { value: 'auto', label: 'Auto (unless the map sets its own darkness)' },
        { value: 'on', label: 'Follow the clock' },
        { value: 'off', label: 'Ignore (indoors)' }
    ],

    appliesToMap(mapSettings) {
        const mode = mapSettings && mapSettings.dayNight;
        if (mode === 'on') return true;
        if (mode === 'off') return false;
        return !(mapSettings && mapSettings.ambient && Number(mapSettings.ambient.darkness) > 0);
    }
};

// The sun crosses the sky from east to west: morning shadows point west, noon shadows point north
// (up the screen) and are shortest, evening shadows point east. A faint moon does the same at night.
DocsDoodads.Sun = {
    sources: [
        { value: 'time', label: 'Time of day' },
        { value: 'fixed', label: 'Fixed direction' },
        { value: 'variable', label: 'A variable (degrees)' }
    ],

    at(minutes) {
        const h = DocsDoodads.TimeOfDay.wrap(minutes) / 60;
        const day = h >= 6 && h < 18;
        const t = day ? (h - 6) / 12 : ((h + 6) % 24) / 12;
        const elevation = Math.sin(Math.PI * t);
        return {
            angle: (270 + 180 * t) % 360,
            lengthMul: 0.5 + 1.1 * (1 - elevation),
            strength: (day ? 1 : 0.3) * Math.min(1, elevation * 4)
        };
    },

    current(world, minutes, variable) {
        const s = Object.assign({ source: 'time', angle: 30, variableId: 0 }, world && world.sun);
        const wrap360 = a => ((Number(a) || 0) % 360 + 360) % 360;
        if (s.source === 'variable' && Number(s.variableId) > 0 && variable) {
            return { angle: wrap360(variable(Number(s.variableId))), lengthMul: 1, strength: 1 };
        }
        if (s.source === 'time' && minutes !== null && minutes !== undefined) return this.at(minutes);
        return { angle: wrap360(s.angle), lengthMul: 1, strength: 1 };
    },

    // A silhouette anchored at its base (feet) and rotated to lie along the shadow direction.
    transform(sun, style) {
        style = style || {};
        const length = Math.max(0.05, Math.min(2, (Number(style.length) || 0) * (Number(sun.lengthMul) || 1)));
        return {
            rotation: (Number(sun.angle) || 0) * Math.PI / 180,
            scaleY: length,
            alpha: clamp01(style.opacity) * clamp01(sun.strength),
            offsetX: Number(style.offsetX) || 0,
            offsetY: Number(style.offsetY) || 0,
            blur: Math.max(0, Number(style.blur) || 0)
        };
    }
};

// <shadow>, <shadow: length 0.8, opacity 0.4>, <no shadow>, <motion blur>, <no motion blur>, <no reflection>
// in an event's note or in comments on its active page.
DocsDoodads.CharacterTags = {
    _cache: typeof WeakMap !== 'undefined' ? new WeakMap() : null,

    parse(text) {
        const out = {};
        const re = /<\s*(no\s+)?(shadow|motion\s*blur|reflection|spatial)\s*(?::([^>]*))?>/gi;
        let match;
        while ((match = re.exec(String(text || '')))) {
            const on = !match[1];
            const kind = match[2].toLowerCase().replace(/\s+/g, '');
            if (kind === 'shadow') {
                out.shadow = on;
                if (on && match[3]) {
                    const length = /length\s*[:=]?\s*([\d.]+)/i.exec(match[3]);
                    const opacity = /opacity\s*[:=]?\s*([\d.]+)/i.exec(match[3]);
                    if (length) out.shadowLength = parseFloat(length[1]);
                    if (opacity) out.shadowOpacity = parseFloat(opacity[1]);
                }
            } else if (kind === 'motionblur') {
                out.motionBlur = on;
            } else if (kind === 'reflection') {
                out.reflect = on;
            } else if (kind === 'spatial') {
                out.spatial = on;
            }
        }
        const sound = /<\s*sound\s*:\s*([^>]+)>/i.exec(String(text || ''));
        if (sound) {
            const [name, volume, radius, every] = sound[1].split(',').map(p => p.trim());
            if (name) {
                out.sound = { file: /\//.test(name) ? name : 'bgs/' + name };
                if (volume) out.sound.volume = Number(volume);
                if (radius) out.sound.radius = Number(radius);
                if (every) out.sound.every = Number(every);
            }
        }
        return out;
    },

    forCharacter(character) {
        if (!character || typeof character.eventId !== 'function' || typeof character.event !== 'function') return {};
        const cache = this._cache;
        const page = character._pageIndex;
        const hit = cache ? cache.get(character) : null;
        if (hit && hit.page === page) return hit.tags;
        const data = character.event() || {};
        const lines = [data.note || ''];
        const list = typeof character.page === 'function' && character.page() ? character.page().list : null;
        for (const cmd of list || []) {
            if (cmd && (cmd.code === 108 || cmd.code === 408) && cmd.parameters) lines.push(String(cmd.parameters[0] || ''));
        }
        const tags = this.parse(lines.join('\n'));
        if (cache) cache.set(character, { page, tags });
        return tags;
    }
};

DocsDoodads.CharacterShadow = {
    modes: [{ value: 'all', label: 'Every event that stands up' }, { value: 'tagged', label: 'Only events tagged <shadow>' }],

    // info: { playerLike, priorityType, hasImage }
    enabledFor(settings, tags, info) {
        if (!settings || !settings.enabled || !info || !info.hasImage) return false;
        tags = tags || {};
        if (tags.shadow === false) return false;
        if (tags.shadow === true) return true;
        if (info.playerLike) return settings.includePlayer !== false;
        if (settings.mode === 'tagged') return false;
        return info.priorityType === 1;
    },

    styleFor(settings, tags) {
        tags = tags || {};
        return {
            opacity: tags.shadowOpacity !== undefined ? tags.shadowOpacity : settings.opacity,
            length: tags.shadowLength !== undefined ? tags.shadowLength : settings.length,
            blur: settings.blur,
            offsetX: settings.offsetX,
            offsetY: settings.offsetY
        };
    },

    // The character's whole frame. In tall grass MZ splits it into two half sprites and gives the main
    // sprite a zero-width frame, which would otherwise show the entire sheet.
    frameFor(sprite) {
        const f = sprite && sprite._frame;
        if (!f) return null;
        if (sprite._bushDepth > 0 && sprite._upperBody && sprite._upperBody._frame) {
            const u = sprite._upperBody._frame;
            const l = sprite._lowerBody && sprite._lowerBody._frame;
            if (u.width > 0) return { x: u.x, y: u.y, w: u.width, h: u.height + (l ? l.height : 0) };
        }
        if (!(f.width > 0) || !(f.height > 0)) return null;
        return { x: f.x, y: f.y, w: f.width, h: f.height };
    },

    // The shadow stops before it would run into a blocked point (roof regions), so it is never sliced by upper tiles.
    clipLength(footX, footY, angleDeg, lengthPx, isBlocked, step = 4) {
        if (!isBlocked || !(lengthPx > 0)) return Math.max(0, lengthPx || 0);
        if (isBlocked(footX, footY)) return 0;
        const rad = (Number(angleDeg) || 0) * Math.PI / 180;
        const dx = Math.sin(rad), dy = -Math.cos(rad);
        for (let d = step; d < lengthPx + step; d += step) {
            const dist = Math.min(d, lengthPx);
            if (isBlocked(footX + dx * dist, footY + dy * dist)) return Math.max(0, dist - step);
        }
        return lengthPx;
    }
};

DocsDoodads.MotionBlur = {
    maxLength: 24,
    modes: [{ value: 'all', label: 'Everyone who moves' }, { value: 'tagged', label: 'Only events tagged <motion blur>' }],

    // Blur vector (screen pixels) from one frame's movement in tiles.
    target(dxTiles, dyTiles, tileW, tileH, strength) {
        if (Math.abs(dxTiles) > 1 || Math.abs(dyTiles) > 1) return { x: 0, y: 0 };
        const vx = dxTiles * tileW, vy = dyTiles * tileH;
        const speed = Math.hypot(vx, vy);
        if (speed < 0.5) return { x: 0, y: 0 };
        const length = Math.min(this.maxLength, speed * 2 * Math.max(0, Number(strength) || 0));
        return { x: vx / speed * length, y: vy / speed * length };
    },

    step(current, target, rate = 0.5) {
        const x = current.x + (target.x - current.x) * rate;
        const y = current.y + (target.y - current.y) * rate;
        if (Math.abs(x) < 0.25 && Math.abs(y) < 0.25) return { x: 0, y: 0 };
        return { x, y };
    },

    enabledFor(settings, tags, playerLike, optionOn) {
        if (!settings || !settings.enabled || optionOn === false) return false;
        tags = tags || {};
        if (tags.motionBlur === false) return false;
        if (tags.motionBlur === true) return true;
        return settings.mode !== 'tagged';
    },

    // Samples trail behind the sprite along the movement; uVelocity is in pixels.
    fragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec2 uVelocity;',
        'void main(void) {',
        '    vec2 stepUv = uVelocity * inputSize.zw / 8.0;',
        '    vec4 color = texture2D(uSampler, vTextureCoord) * 0.24;',
        '    float total = 0.24;',
        '    for (int i = 1; i <= 8; i++) {',
        '        float w = 0.2 * (1.0 - float(i) / 9.0);',
        '        color += texture2D(uSampler, vTextureCoord + stepUv * float(i)) * w;',
        '        total += w;',
        '    }',
        '    gl_FragColor = color / total;',
        '}'
    ].join('\n')
};

DocsDoodads.SeeThrough = {
    modes: [
        { value: 'fade', label: 'Fade the doodad' },
        { value: 'silhouette', label: 'Show the player as an outline' },
        { value: 'both', label: 'Both' }
    ],
    options: [
        { value: 'auto', label: 'Auto (tall standing doodads)' },
        { value: 'on', label: 'Always' },
        { value: 'off', label: 'Never' }
    ],

    appliesTo(d, settings, tileH) {
        if (!settings || !settings.enabled || !d) return false;
        if (d.seeThrough === 'off') return false;
        if (d.seeThrough === 'on') return true;
        if (DocsDoodads.Depth.resolve(d) === 'below') return false;
        return (d.frameH || 0) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1) >= 1.5 * (tileH || 48);
    },

    // Hidden when at least a quarter of the player overlaps and the doodad draws over them.
    occludes(rect, baseY, depth, player, playerBaseY) {
        if (!rect || !player) return false;
        const ox = Math.min(rect.x + rect.w, player.x + player.w) - Math.max(rect.x, player.x);
        const oy = Math.min(rect.y + rect.h, player.y + player.h) - Math.max(rect.y, player.y);
        if (ox <= 0 || oy <= 0 || ox * oy < 0.25 * player.w * player.h) return false;
        if (depth === 'above') return true;
        return playerBaseY < baseY;
    },

    step(current, target, speed) {
        speed = Math.max(0.001, Number(speed) || 0.1);
        if (Math.abs(target - current) <= speed) return target;
        return current + (target > current ? speed : -speed);
    },

    silhouetteFragment: [
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec3 uColor;',
        'uniform float uAlpha;',
        'void main(void) {',
        '    float a = texture2D(uSampler, vTextureCoord).a;',
        '    gl_FragColor = vec4(uColor, 1.0) * a * uAlpha;',
        '}'
    ].join('\n')
};

// Animated show/hide for doodads controlled by switches, conditions or seasons. p runs 0 (hidden) to 1 (shown).
DocsDoodads.Transition = {
    types: [
        { value: 'none', label: 'Instant' }, { value: 'fade', label: 'Fade' }, { value: 'pop', label: 'Pop' },
        { value: 'rise', label: 'Rise' }, { value: 'dissolve', label: 'Dissolve' }, { value: 'crumble', label: 'Crumble' }
    ],
    defaults: { type: 'none', frames: 30 },

    sample(type, p) {
        p = clamp01(p);
        const out = { alphaMul: 1, scaleMul: 1, offsetY: 0, dissolve: 0 };
        switch (type) {
            case 'fade':
                out.alphaMul = p;
                break;
            case 'pop': {
                const c1 = 1.70158, c3 = c1 + 1;
                out.scaleMul = p <= 0 ? 0 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
                out.alphaMul = Math.min(1, p * 2);
                break;
            }
            case 'rise':
                out.offsetY = 16 * (1 - p);
                out.alphaMul = p;
                break;
            case 'dissolve':
                out.dissolve = 1 - p;
                break;
            case 'crumble':
                out.dissolve = 1 - p;
                out.offsetY = 10 * (1 - p);
                break;
            default:
                out.alphaMul = p >= 1 ? 1 : 0;
        }
        return out;
    },

    advance(progress, visible, frames) {
        const total = Math.round(Number(frames) || 0);
        if (total <= 0) return visible ? 1 : 0;
        const step = 1 / total;
        return visible ? Math.min(1, progress + step) : Math.max(0, progress - step);
    },

    // Pixels vanish in noisy order (blocks for crumble, which also drop as they go).
    dissolveFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform float uAmount;',
        'uniform float uBlock;',
        'uniform float uFall;',
        'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
        'void main(void) {',
        '    vec2 cell = floor(vTextureCoord * inputSize.xy / uBlock);',
        '    float n = hash(cell);',
        '    vec2 uv = vTextureCoord;',
        '    uv.y -= uAmount * uFall * (0.5 + n) * inputSize.w;',
        '    vec4 color = texture2D(uSampler, uv);',
        '    gl_FragColor = n < uAmount ? vec4(0.0) : color;',
        '}'
    ].join('\n')
};

// One table swaps art for every season across the whole game: each row lists the same prop per season.
DocsDoodads.Seasons = {
    sources: [
        { value: 'off', label: 'Off' },
        { value: 'variable', label: 'A variable (0 = first season)' },
        { value: 'system', label: 'Plugin command "Set Season"' }
    ],

    normalize(path) {
        return String(path || '').replace(/\\/g, '/');
    },

    resolve(path, season, sets) {
        if (!(season >= 0) || !Array.isArray(sets) || !path) return path;
        const key = this.normalize(path);
        for (const set of sets) {
            if (!set) continue;
            const members = Object.keys(set).map(k => this.normalize(set[k]));
            if (!members.includes(key)) continue;
            return set[season] ? this.normalize(set[season]) : key;
        }
        return path;
    },

    visibleIn(d, season) {
        if (!(season >= 0)) return true;
        const list = d && d.seasons;
        if (!Array.isArray(list) || list.length === 0) return true;
        return list.includes(season);
    },

    // env: { variable(id), system }
    current(settings, env = {}) {
        if (!settings) return -1;
        const count = Array.isArray(settings.names) && settings.names.length > 0 ? settings.names.length : 4;
        const wrap = v => ((Math.floor(Number(v) || 0) % count) + count) % count;
        if (settings.source === 'variable' && Number(settings.variableId) > 0 && env.variable) return wrap(env.variable(Number(settings.variableId)));
        if (settings.source === 'system') return wrap(env.system);
        return -1;
    }
};

DocsDoodads.Reflection = {
    options: [
        { value: 'auto', label: 'Auto (standing doodads)' },
        { value: 'on', label: 'Always' },
        { value: 'off', label: 'Never' }
    ],

    // layers: tile ids for z 0-3. Water on the ground layers with nothing else drawn over it, or the chosen region.
    // Coastlines put the sand/grass edge on layer 1 over the sea on layer 0; those tiles are shore, not water.
    isWaterAt(layers, regionId, settings, isWaterTile) {
        const region = Number(settings && settings.regionId) || 0;
        if (region > 0 && regionId === region) return true;
        if (!layers || !isWaterTile) return false;
        if (layers[2] || layers[3]) return false;
        if (layers[1]) return Boolean(isWaterTile(layers[1]));
        return Boolean(isWaterTile(layers[0]));
    },

    // Mask rectangles (pixels, relative to tile 0,0) for the water tiles on screen. Each side next to dry
    // land is pulled in by `inset`, because water autotiles draw their shore border inside the water tile.
    // isWaterAt is also asked about the tiles just outside the area. Neighbours with matching edges merge.
    maskRects(cols, rows, isWaterAt, tw, th, inset) {
        inset = Math.max(0, Math.min(Math.floor(Math.min(tw, th) / 2), Number(inset) || 0));
        const rects = [];
        for (let r = 0; r < rows; r++) {
            let open = null;
            for (let c = 0; c < cols; c++) {
                if (!isWaterAt(c, r)) {
                    open = null;
                    continue;
                }
                const top = isWaterAt(c, r - 1) ? 0 : inset;
                const bottom = isWaterAt(c, r + 1) ? 0 : inset;
                const left = isWaterAt(c - 1, r) ? 0 : inset;
                const right = isWaterAt(c + 1, r) ? 0 : inset;
                if (open && left === 0 && open.top === top && open.bottom === bottom) {
                    open.rect.w += tw - right;
                } else {
                    open = { top, bottom, rect: { x: c * tw + left, y: r * th + top, w: tw - left - right, h: th - top - bottom } };
                    rects.push(open.rect);
                }
                if (right > 0) open = null;
            }
        }
        return rects;
    },

    appliesTo(d, settings) {
        if (!settings || !settings.enabled || !d) return false;
        if (d.reflect === 'off') return false;
        if (d.reflect === 'on') return true;
        return DocsDoodads.Depth.resolve(d) !== 'below';
    },

    mapEnabled(settings, mapSettings) {
        return Boolean(settings && settings.enabled) && !(mapSettings && mapSettings.reflections === false);
    }
};

// Runtime state shared by sprites each frame: time, season, sun, and where the player is.
DocsDoodads.Atmosphere = {
    _playerRect: null,
    _playerHidden: false,

    env() {
        const vars = typeof $gameVariables !== 'undefined' ? $gameVariables : null;
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        return {
            variable: id => (vars && id > 0 ? vars.value(id) : 0),
            clock: this.clock(),
            system: system ? system._docsSeason || 0 : 0
        };
    },

    clock() {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        if (!system) return null;
        if (!system._docsClock) {
            system._docsClock = DocsDoodads.TimeOfDay.newClock((Number(DocsDoodads.World.settings().time.startHour) || 0) * 60);
        }
        return system._docsClock;
    },

    editorPreview(field) {
        const ws = DocsDoodads.Workspace;
        return ws && ws.mounted && ws[field] !== null && ws[field] !== undefined ? ws[field] : null;
    },

    minutes() {
        const preview = this.editorPreview('previewMinutes');
        if (preview !== null) return preview;
        return DocsDoodads.TimeOfDay.minutesNow(DocsDoodads.World.settings(), this.env());
    },

    season() {
        const preview = this.editorPreview('previewSeason');
        if (preview !== null) return preview;
        return DocsDoodads.Seasons.current(DocsDoodads.World.settings().seasons, this.env());
    },

    sun() {
        return DocsDoodads.Sun.current(DocsDoodads.World.settings(), this.minutes(), this.env().variable);
    },

    // "Set Feature" plugin command switches effects off for this save without touching the project.
    featureOn(name) {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        return !(system && system._docsFeatureOff && system._docsFeatureOff[name]);
    },

    // Runs with $gameMap.update: the clock only moves on the map, never while the editor is open.
    update(sceneActive) {
        const world = DocsDoodads.World.settings();
        if (world.time.source !== 'clock' || sceneActive === false) return;
        if (DocsDoodads.Workspace && DocsDoodads.Workspace.mounted) return;
        const clock = this.clock();
        if (!clock) return;
        const speed = clock.speed !== null && clock.speed !== undefined ? clock.speed : world.time.minutesPerSecond;
        DocsDoodads.TimeOfDay.advance(clock, 1, speed);
        const vars = typeof $gameVariables !== 'undefined' ? $gameVariables : null;
        if (vars) {
            DocsDoodads.TimeOfDay.syncVariables(world, clock.minutes, (id, value) => {
                if (vars.value(id) !== value) vars.setValue(id, value);
            });
        }
    }
};

//==========================================================
// SECTION 5D: POST-PROCESSING (LOOKS, PRESETS, PASSES, SCREEN EFFECTS, MAP IMAGE EXPORT)
//==========================================================
// A "look" is one setting per effect. The map layer (or the whole spriteset with pictures) is drawn
// through up to three passes: bloom, tilt-shift (two blur directions), then one "grade" pass that does
// colour, vignette, grain, aberration, lens, CRT, pixelate, sharpen, impact zoom and shockwaves at once.
DocsDoodads.PostFX = {
    // neutral: the value at which a parameter does nothing (used when blending an effect in or out).
    effects: [
        { id: 'bloom', label: 'Bloom', params: [
            { key: 'threshold', label: 'Threshold', min: 0, max: 1, step: 0.05, def: 0.7, neutral: 1 },
            { key: 'intensity', label: 'Intensity', min: 0, max: 3, step: 0.05, def: 0.8, neutral: 0 },
            { key: 'radius', label: 'Radius', min: 1, max: 30, step: 1, def: 8, neutral: 8 }
        ] },
        { id: 'color', label: 'Colour Grading', params: [
            { key: 'exposure', label: 'Exposure (stops)', min: -2, max: 2, step: 0.05, def: 0, neutral: 0 },
            { key: 'contrast', label: 'Contrast', min: 0.5, max: 2, step: 0.05, def: 1, neutral: 1 },
            { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.05, def: 1, neutral: 1 },
            { key: 'temperature', label: 'Temperature (cool - warm)', min: -1, max: 1, step: 0.05, def: 0, neutral: 0 },
            { key: 'tint', label: 'Tint (magenta - green)', min: -1, max: 1, step: 0.05, def: 0, neutral: 0 },
            { key: 'shadows', label: 'Shadow colour', type: 'color', def: '#808080', neutral: '#808080' },
            { key: 'highlights', label: 'Highlight colour', type: 'color', def: '#808080', neutral: '#808080' },
            { key: 'split', label: 'Split toning', min: 0, max: 1, step: 0.05, def: 0, neutral: 0 }
        ] },
        { id: 'vignette', label: 'Vignette', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.05, def: 0.4, neutral: 0 },
            { key: 'softness', label: 'Softness', min: 0.05, max: 1, step: 0.05, def: 0.45, neutral: 0.45 },
            { key: 'color', label: 'Colour', type: 'color', def: '#000000' }
        ] },
        { id: 'grain', label: 'Film Grain', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 1, step: 0.05, def: 0.15, neutral: 0 },
            { key: 'size', label: 'Size', min: 1, max: 4, step: 0.5, def: 1.5, neutral: 1.5 },
            { key: 'animated', label: 'Animated', type: 'checkbox', def: true }
        ] },
        { id: 'aberration', label: 'Chromatic Aberration', screenSpace: true, params: [
            { key: 'amount', label: 'Amount', min: 0, max: 3, step: 0.05, def: 0.5, neutral: 0 }
        ] },
        { id: 'lens', label: 'Lens Distortion', screenSpace: true, params: [
            { key: 'distortion', label: 'Barrel (+) / pincushion (-)', min: -0.5, max: 0.5, step: 0.01, def: 0.15, neutral: 0 }
        ] },
        { id: 'crt', label: 'CRT', screenSpace: true, params: [
            { key: 'scanlines', label: 'Scanlines', min: 0, max: 1, step: 0.05, def: 0.5, neutral: 0 },
            { key: 'curvature', label: 'Curvature', min: 0, max: 0.5, step: 0.01, def: 0.12, neutral: 0 },
            { key: 'mask', label: 'RGB mask', min: 0, max: 1, step: 0.05, def: 0.3, neutral: 0 }
        ] },
        { id: 'pixelate', label: 'Pixelate', params: [
            { key: 'size', label: 'Pixel size', min: 1, max: 12, step: 1, def: 3, neutral: 1 }
        ] },
        { id: 'sharpen', label: 'Sharpen', params: [
            { key: 'amount', label: 'Amount', min: 0, max: 2, step: 0.05, def: 0.4, neutral: 0 }
        ] },
        { id: 'tiltShift', label: 'Tilt-Shift (miniature)', screenSpace: true, params: [
            { key: 'blur', label: 'Blur', min: 0, max: 12, step: 0.5, def: 6, neutral: 0 },
            { key: 'focus', label: 'Focus line (0 top - 1 bottom)', min: 0, max: 1, step: 0.01, def: 0.55, neutral: 0.55 },
            { key: 'band', label: 'Sharp band', min: 0, max: 0.5, step: 0.01, def: 0.12, neutral: 0.12 }
        ] }
    ],

    presets: [
        { id: 'cinematic', label: 'Cinematic', look: {
            color: { enabled: true, contrast: 1.12, saturation: 0.92, shadows: '#1f6f8b', highlights: '#f0a35e', split: 0.35 },
            vignette: { enabled: true, amount: 0.35, softness: 0.5 }, grain: { enabled: true, amount: 0.06 } } },
        { id: 'golden', label: 'Golden Hour', look: {
            bloom: { enabled: true, threshold: 0.72, intensity: 0.7, radius: 10 },
            color: { enabled: true, temperature: 0.55, exposure: 0.15, saturation: 1.1 },
            vignette: { enabled: true, amount: 0.3, color: '#2a1200' } } },
        { id: 'dreamy', label: 'Dreamy', look: {
            bloom: { enabled: true, threshold: 0.6, intensity: 1, radius: 16 },
            color: { enabled: true, saturation: 1.15, contrast: 0.92, exposure: 0.1 },
            vignette: { enabled: true, amount: 0.25, softness: 0.7, color: '#fff0f8' } } },
        { id: 'retro', label: 'Retro CRT', look: {
            crt: { enabled: true, scanlines: 0.55, curvature: 0.12, mask: 0.35 }, aberration: { enabled: true, amount: 0.6 },
            grain: { enabled: true, amount: 0.12 }, vignette: { enabled: true, amount: 0.3 } } },
        { id: 'noir', label: 'Noir', look: {
            color: { enabled: true, saturation: 0, contrast: 1.35 }, grain: { enabled: true, amount: 0.2 },
            vignette: { enabled: true, amount: 0.55 } } },
        { id: 'horror', label: 'Horror', look: {
            color: { enabled: true, saturation: 0.45, tint: -0.35, contrast: 1.15, exposure: -0.25 },
            vignette: { enabled: true, amount: 0.7, color: '#200000' }, grain: { enabled: true, amount: 0.18 },
            aberration: { enabled: true, amount: 0.4 } } },
        { id: 'underwater', label: 'Underwater', look: {
            color: { enabled: true, temperature: -0.6, tint: 0.15, saturation: 0.9 }, lens: { enabled: true, distortion: 0.08 },
            aberration: { enabled: true, amount: 0.3 }, vignette: { enabled: true, amount: 0.4, color: '#001830' } } },
        { id: 'miniature', label: 'Miniature', look: {
            tiltShift: { enabled: true, blur: 7, focus: 0.55, band: 0.1 }, color: { enabled: true, saturation: 1.35, contrast: 1.1 },
            sharpen: { enabled: true, amount: 0.3 } } },
        { id: 'pixel', label: 'Pixel Art', look: {
            pixelate: { enabled: true, size: 3 }, color: { enabled: true, saturation: 1.1 } } }
    ],

    qualities: [
        { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low (no tilt-shift)' }, { value: 'off', label: 'Off' }
    ],

    normalizeParam(p, value) {
        if (p.type === 'color') return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : p.def;
        if (p.type === 'checkbox') return typeof value === 'boolean' ? value : p.def;
        const n = Number(value);
        if (value === undefined || value === null || value === '' || !isFinite(n)) return p.def;
        return Math.max(p.min, Math.min(p.max, n));
    },

    normalizeLook(look) {
        const out = {};
        for (const effect of this.effects) {
            const src = look && look[effect.id] && typeof look[effect.id] === 'object' ? look[effect.id] : {};
            const e = { enabled: src.enabled === true };
            for (const p of effect.params) e[p.key] = this.normalizeParam(p, src[p.key]);
            out[effect.id] = e;
        }
        return out;
    },

    defaultLook() {
        return this.normalizeLook(null);
    },

    isActive(look) {
        return Boolean(look) && this.effects.some(e => look[e.id] && look[e.id].enabled);
    },

    presetLook(id) {
        const preset = this.presets.find(p => p.id === id);
        return preset ? this.normalizeLook(cloneJson(preset.look)) : null;
    },

    // An effect missing on one side blends from/to its neutral value; it stays on until the blend ends.
    lerpLook(a, b, t) {
        a = this.normalizeLook(a);
        b = this.normalizeLook(b);
        t = clamp01(t);
        const out = {};
        for (const effect of this.effects) {
            const ea = a[effect.id], eb = b[effect.id];
            if (!ea.enabled && !eb.enabled) {
                out[effect.id] = eb;
                continue;
            }
            const e = { enabled: t >= 1 ? eb.enabled : t <= 0 ? ea.enabled : true };
            for (const p of effect.params) {
                // Parameters without a neutral value (a vignette's colour) borrow the enabled side's value.
                const side = (src, other) => (src.enabled ? src[p.key] : p.neutral !== undefined ? p.neutral : other[p.key]);
                const va = side(ea, eb), vb = side(eb, ea);
                if (p.type === 'color') e[p.key] = DocsDoodads.Lighting.mixColor(va, vb, t);
                else if (p.type === 'checkbox') e[p.key] = t < 0.5 ? va : vb;
                else e[p.key] = va + (vb - va) * t;
            }
            out[effect.id] = e;
        }
        return out;
    },

    fadeStart(from, to, frames) {
        const total = Math.max(0, Math.round(Number(frames) || 0));
        const fade = { from: this.normalizeLook(from), to: this.normalizeLook(to), framesTotal: total, framesLeft: total };
        fade.current = total ? cloneJson(fade.from) : cloneJson(fade.to);
        return fade;
    },

    fadeStep(fade) {
        if (!fade || fade.framesLeft <= 0) return fade;
        fade.framesLeft--;
        fade.current = this.lerpLook(fade.from, fade.to, 1 - fade.framesLeft / fade.framesTotal);
        return fade;
    },

    // runtime (plugin command) > the map's choice (off / its own look) > the game-wide look.
    resolveLook({ world, mapSettings, runtime } = {}) {
        if (runtime) {
            const look = this.normalizeLook(runtime);
            return this.isActive(look) ? look : null;
        }
        const pf = world && world.postfx;
        if (!pf || pf.enabled === false) return null;
        const mine = mapSettings && mapSettings.postfx;
        if (mine && mine.mode === 'off') return null;
        const look = this.normalizeLook(mine && mine.mode === 'custom' ? mine.look : pf.look);
        return this.isActive(look) ? look : null;
    },

    // The player's Options choice (0 high .. 3 off) can lower the project's quality, never raise it.
    effectiveQuality(project, playerOption) {
        const levels = ['high', 'medium', 'low', 'off'];
        const index = Math.max(Math.max(0, levels.indexOf(project)), Math.max(0, Math.min(3, Number(playerOption) || 0)));
        return levels[index];
    },

    bloomBlurQuality(quality) {
        return quality === 'low' ? 2 : quality === 'medium' ? 3 : 4;
    },

    gradeIds: ['color', 'vignette', 'grain', 'aberration', 'lens', 'crt', 'pixelate', 'sharpen'],

    passes(look, quality, anim) {
        if (quality === 'off') return [];
        const out = [];
        if ((look && look.bloom.enabled) || (anim && anim.bloom > 0)) out.push('bloom');
        if (look && look.tiltShift.enabled && quality !== 'low') out.push('tiltShift');
        const animated = anim && ((anim.zoom !== undefined && anim.zoom !== 1) || (anim.shock && anim.shock[3] > 0) || anim.aberration > 0);
        if ((look && this.gradeIds.some(id => look[id].enabled)) || animated) out.push('grade');
        return out;
    },

    // Grade-pass uniforms; disabled effects use their neutral values.
    uniforms(look, anim, time) {
        look = look || this.defaultLook();
        const v = (id, key) => {
            const effect = this.effects.find(e => e.id === id);
            const p = effect.params.find(q => q.key === key);
            return look[id].enabled || p.neutral === undefined ? look[id][key] : p.neutral;
        };
        const ch = c => DocsDoodads.Lighting.channels(c);
        return {
            uExposure: Math.pow(2, v('color', 'exposure')),
            uContrast: v('color', 'contrast'),
            uSaturation: v('color', 'saturation'),
            uTemperature: v('color', 'temperature'),
            uTint: v('color', 'tint'),
            uShadowColor: ch(v('color', 'shadows')),
            uHighlightColor: ch(v('color', 'highlights')),
            uSplit: v('color', 'split'),
            uVignette: v('vignette', 'amount'),
            uVignetteSoft: v('vignette', 'softness'),
            uVignetteColor: ch(look.vignette.color),
            uGrain: v('grain', 'amount'),
            uGrainSize: v('grain', 'size'),
            uTime: look.grain.animated ? (Number(time) || 0) : 0,
            uAberration: v('aberration', 'amount') + (anim && anim.aberration ? anim.aberration : 0),
            uDistortion: v('lens', 'distortion'),
            uScanlines: v('crt', 'scanlines'),
            uCurvature: v('crt', 'curvature'),
            uMask: v('crt', 'mask'),
            uPixel: v('pixelate', 'size'),
            uSharpen: v('sharpen', 'amount'),
            uZoom: anim && anim.zoom ? anim.zoom : 1,
            uZoomCenter: anim && anim.zoomCenter ? anim.zoomCenter : [0.5, 0.5],
            uShock: anim && anim.shock ? anim.shock : [0.5, 0.5, 0, 0]
        };
    },

    // Effects shaped by the screen would repeat on every screen-sized piece of an exported map image.
    exportLook(look) {
        const out = this.normalizeLook(look);
        for (const effect of this.effects) if (effect.screenSpace) out[effect.id].enabled = false;
        return out;
    },

    // Screen effects started by the "Play Screen Effect" command; positions are 0-1 across the screen.
    Animations: {
        types: [
            { value: 'zoomPunch', label: 'Impact Zoom' },
            { value: 'shockwave', label: 'Shockwave' },
            { value: 'chromaticPunch', label: 'Chromatic Punch' },
            { value: 'bloomFlash', label: 'Bloom Flash' }
        ],

        start(list, spec, frame) {
            if (!spec || !this.types.some(t => t.value === spec.type)) return null;
            const anim = {
                type: spec.type,
                strength: spec.strength !== undefined && isFinite(Number(spec.strength)) ? Number(spec.strength) : 1,
                duration: Math.max(1, Math.round(Number(spec.duration) || 30)),
                center: Array.isArray(spec.center) ? spec.center.slice(0, 2) : [0.5, 0.5],
                start: Number(frame) || 0
            };
            list.push(anim);
            return anim;
        },

        sample(list, frame) {
            const out = { zoom: 1, zoomCenter: [0.5, 0.5], shock: [0.5, 0.5, 0, 0], aberration: 0, bloom: 0 };
            for (let i = list.length - 1; i >= 0; i--) {
                const a = list[i];
                const t = (frame - a.start) / a.duration;
                if (t >= 1) {
                    list.splice(i, 1);
                    continue;
                }
                if (t < 0) continue;
                const fall = (1 - t) * (1 - t);
                if (a.type === 'zoomPunch') {
                    const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
                    out.zoom *= 1 + a.strength * env * env * (3 - 2 * env);
                    out.zoomCenter = a.center;
                } else if (a.type === 'shockwave') {
                    out.shock = [a.center[0], a.center[1], t * 0.9, a.strength * 0.06 * (1 - t)];
                } else if (a.type === 'chromaticPunch') {
                    out.aberration += a.strength * 3 * fall;
                } else if (a.type === 'bloomFlash') {
                    out.bloom += a.strength * 2 * fall;
                }
            }
            return out;
        }
    },

    gradeFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec4 outputFrame;',
        'uniform vec4 inputClamp;',
        'uniform float uTime;',
        'uniform float uExposure; uniform float uContrast; uniform float uSaturation; uniform float uTemperature; uniform float uTint;',
        'uniform vec3 uShadowColor; uniform vec3 uHighlightColor; uniform float uSplit;',
        'uniform float uVignette; uniform float uVignetteSoft; uniform vec3 uVignetteColor;',
        'uniform float uGrain; uniform float uGrainSize;',
        'uniform float uAberration; uniform float uDistortion;',
        'uniform float uScanlines; uniform float uCurvature; uniform float uMask;',
        'uniform float uPixel; uniform float uSharpen;',
        'uniform float uZoom; uniform vec2 uZoomCenter; uniform vec4 uShock;',
        'float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
        'vec2 toUv(vec2 n) { return clamp(n * outputFrame.zw * inputSize.zw, inputClamp.xy, inputClamp.zw); }',
        'vec4 tex(vec2 n) { return texture2D(uSampler, toUv(n)); }',
        'void main(void) {',
        '    vec2 screen = vTextureCoord * inputSize.xy / outputFrame.zw;',
        '    vec2 n = screen;',
        '    float aspect = outputFrame.z / outputFrame.w;',
        '    n = uZoomCenter + (n - uZoomCenter) / uZoom;',
        '    if (uShock.w > 0.0) {',
        '        vec2 d = (n - uShock.xy) * vec2(aspect, 1.0);',
        '        float dist = length(d);',
        '        float ring = 1.0 - smoothstep(0.0, 0.08, abs(dist - uShock.z));',
        '        if (dist > 0.0001) n -= normalize(d) / vec2(aspect, 1.0) * ring * uShock.w;',
        '    }',
        '    vec2 c = n - 0.5;',
        '    float r2 = dot(c, c);',
        '    n = 0.5 + c * (1.0 + (uDistortion + uCurvature) * r2 * 2.0);',
        '    bool outside = uCurvature > 0.0 && (n.x < 0.0 || n.x > 1.0 || n.y < 0.0 || n.y > 1.0);',
        '    if (uPixel > 1.0) { vec2 cells = outputFrame.zw / uPixel; n = (floor(n * cells) + 0.5) / cells; }',
        '    vec4 color = tex(n);',
        '    if (uAberration > 0.0) {',
        '        vec2 off = (n - 0.5) * uAberration * 0.012;',
        '        color.r = tex(n + off).r;',
        '        color.b = tex(n - off).b;',
        '    }',
        '    if (uSharpen > 0.0) {',
        '        vec2 px = 1.0 / outputFrame.zw;',
        '        vec4 around = (tex(n + vec2(px.x, 0.0)) + tex(n - vec2(px.x, 0.0)) + tex(n + vec2(0.0, px.y)) + tex(n - vec2(0.0, px.y))) * 0.25;',
        '        color.rgb += (color.rgb - around.rgb) * uSharpen;',
        '    }',
        '    float a = color.a;',
        '    vec3 rgb = a > 0.0 ? color.rgb / a : color.rgb;',
        '    rgb *= uExposure;',
        '    rgb *= vec3(1.0 + uTemperature * 0.2, 1.0 + uTint * 0.2, 1.0 - uTemperature * 0.2);',
        '    rgb = (rgb - 0.5) * uContrast + 0.5;',
        '    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));',
        '    rgb = mix(vec3(luma), rgb, uSaturation);',
        '    rgb += ((uShadowColor - 0.5) * (1.0 - luma) + (uHighlightColor - 0.5) * luma) * uSplit;',
        '    vec2 vc = (screen - 0.5) * vec2(aspect, 1.0) / sqrt(aspect * aspect * 0.25 + 0.25);',
        '    float vig = 1.0 - smoothstep(max(0.0, 1.0 - uVignetteSoft * 1.2), 1.05, length(vc));',
        '    rgb = mix(uVignetteColor, rgb, mix(1.0, vig, uVignette));',
        '    vec2 pix = screen * outputFrame.zw;',
        '    if (uScanlines > 0.0) rgb *= 1.0 - uScanlines * 0.4 * mod(floor(pix.y), 2.0);',
        '    if (uMask > 0.0) {',
        '        float m = mod(floor(pix.x), 3.0);',
        '        vec3 mask = m < 1.0 ? vec3(1.0, 0.7, 0.7) : (m < 2.0 ? vec3(0.7, 1.0, 0.7) : vec3(0.7, 0.7, 1.0));',
        '        rgb *= mix(vec3(1.0), mask, uMask);',
        '    }',
        '    if (uGrain > 0.0) rgb += (hash(floor(pix / uGrainSize) + fract(uTime * 7.31) * 113.0) - 0.5) * uGrain * 0.35;',
        '    if (outside) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
        '    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0) * a, a);',
        '}'
    ].join('\n'),

    bloomExtractFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform float uThreshold;',
        'void main(void) {',
        '    vec4 c = texture2D(uSampler, vTextureCoord);',
        '    float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));',
        // Only the light above the threshold glows, so mid-tones (grass, paving) stay as they are.
        '    float excess = max(l - uThreshold, 0.0) / max(1.0 - uThreshold, 0.0001);',
        '    gl_FragColor = c * clamp(excess, 0.0, 1.0);',
        '}'
    ].join('\n'),

    bloomCombineFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D uBloom;',
        'uniform float uIntensity;',
        'void main(void) {',
        '    vec4 base = texture2D(uSampler, vTextureCoord);',
        '    vec4 glow = texture2D(uBloom, vTextureCoord);',
        // Screen blend: the glow brightens without clipping everything to white.
        '    vec3 g = clamp(glow.rgb * uIntensity, 0.0, 1.0) * base.a;',
        '    gl_FragColor = vec4(base.rgb + g - base.rgb * g / max(base.a, 0.0001), base.a);',
        '}'
    ].join('\n'),

    // One blur direction per pass; the radius grows away from the sharp band.
    tiltFragment: [
        fragmentPrecision,
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform vec4 inputSize;',
        'uniform vec4 outputFrame;',
        'uniform vec4 inputClamp;',
        'uniform vec2 uDir;',
        'uniform float uBlur;',
        'uniform float uFocus;',
        'uniform float uBand;',
        'void main(void) {',
        '    vec2 screen = vTextureCoord * inputSize.xy / outputFrame.zw;',
        '    float d = max(0.0, abs(screen.y - uFocus) - uBand);',
        '    float r = clamp(d / 0.25, 0.0, 1.0) * uBlur;',
        '    vec4 sum = vec4(0.0);',
        '    float total = 0.0;',
        '    for (int i = -4; i <= 4; i++) {',
        '        float w = 1.0 - abs(float(i)) / 5.0;',
        '        vec2 uv = clamp(vTextureCoord + uDir * float(i) * r * 0.25 * inputSize.zw, inputClamp.xy, inputClamp.zw);',
        '        sum += texture2D(uSampler, uv) * w;',
        '        total += w;',
        '    }',
        '    gl_FragColor = sum / total;',
        '}'
    ].join('\n'),

    // Runtime: the plugin-command look fades once per frame.
    _anims: [],
    _runtimeFrame: -1,

    runtimeLook() {
        const system = typeof $gameSystem !== 'undefined' ? $gameSystem : null;
        const fade = system ? system._docsLook : null;
        if (!fade) return null;
        const frame = DocsDoodads.frameCount();
        if (frame !== this._runtimeFrame) {
            this._runtimeFrame = frame;
            this.fadeStep(fade);
            if (fade.framesLeft <= 0 && fade.clearWhenDone) {
                system._docsLook = null;
                return null;
            }
        }
        return fade.current;
    }
};

// Full-map image: the camera visits screen-sized pieces of the map and each is copied into one picture.
DocsDoodads.MapExport = {
    maxSide: 16384,

    plan(mapW, mapH, tileW, tileH, screenW, screenH, scale) {
        scale = Number(scale) || 1;
        const W = mapW * tileW, H = mapH * tileH;
        const width = Math.round(W * scale), height = Math.round(H * scale);
        if (width > this.maxSide || height > this.maxSide) {
            const fit = Math.floor(this.maxSide / Math.max(W, H) * 100) / 100;
            return { width, height, chunks: [], error: `The image would be ${width} x ${height} pixels; the limit is ${this.maxSide}. Choose a scale of ${fit} or less.` };
        }
        const axis = (total, view) => {
            const out = [];
            for (let at = 0; at < total; at += view) {
                const camera = Math.min(at, Math.max(0, total - view));
                const offset = at - camera;
                out.push({ camera, offset, size: Math.min(view - offset, total - at), at });
            }
            return out;
        };
        const chunks = [];
        for (const y of axis(H, screenH)) {
            for (const x of axis(W, screenW)) {
                chunks.push({ displayX: x.camera / tileW, displayY: y.camera / tileH, sx: x.offset, sy: y.offset, w: x.size, h: y.size, dx: x.at, dy: y.at });
            }
        }
        return { width, height, scale, chunks };
    },

    fileName(mapId, date) {
        const d = date || new Date();
        const p = (v, n = 2) => String(v).padStart(n, '0');
        return `Map${p(mapId, 3)}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
    }
};

//==========================================================
// SECTION 5E: PARTICLES, VFX, REACTIVE DOODADS & CHARACTER ANIMATION
//==========================================================
// Particles are simulated in pixels relative to their emitter, with a seeded random source so previews
// and tests repeat exactly. Rendering (pooled sprites) lives in Section 7.
DocsDoodads.Particles = {
    shapes: ['soft', 'circle', 'square', 'spark', 'leaf', 'star'],
    blends: ['normal', 'add', 'screen'],
    layers: [{ value: 'above', label: 'Above characters' }, { value: 'below', label: 'Below characters (ground)' }],
    defaults: {
        rate: 10, burst: 0, max: 120, lifetime: [1, 2], speed: [10, 30], angle: -90, spread: 30,
        gravity: 0, wind: 0, drag: 0, size: [6, 2], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#ffffff',
        blend: 'normal', shape: 'soft', area: [0, 0], spin: [0, 0], flutter: 0, twinkle: 0, stretch: 0
    },
    presets: [
        { id: 'smoke', label: 'Smoke', config: { rate: 6, lifetime: [2.5, 4], speed: [10, 22], spread: 20, gravity: -4, wind: 6, size: [8, 28], alpha: [0.45, 0], colorStart: '#9a9a9a', colorEnd: '#5a5a5a', area: [8, 4] } },
        { id: 'embers', label: 'Embers', config: { rate: 10, lifetime: [1, 2], speed: [25, 60], spread: 35, gravity: -10, size: [4, 1.5], stretch: 1.5, alpha: [1, 0], colorStart: '#ffd060', colorEnd: '#ff4010', blend: 'add', flutter: 6, area: [12, 4] } },
        { id: 'fire', label: 'Fire', config: { rate: 28, lifetime: [0.5, 0.9], speed: [35, 70], spread: 12, size: [12, 2], alpha: [0.55, 0], colorStart: '#ffb040', colorEnd: '#ff2000', blend: 'add', area: [16, 4], stretch: 1.2 } },
        { id: 'fireflies', label: 'Fireflies', config: { rate: 1.2, max: 20, lifetime: [4, 7], speed: [3, 10], spread: 360, size: [4, 4], alpha: [0.9, 0.9], colorStart: '#d8ff70', colorEnd: '#a0ff40', blend: 'add', area: [96, 64], flutter: 10, twinkle: 0.8 } },
        { id: 'leaves', label: 'Falling Leaves', config: { rate: 1.5, max: 30, lifetime: [4, 6], speed: [10, 25], angle: 100, spread: 30, gravity: 6, wind: 8, size: [7, 7], alpha: [1, 0], colorStart: '#d08a2a', colorEnd: '#a05010', shape: 'leaf', spin: [-120, 120], flutter: 14, area: [80, 10] } },
        { id: 'mist', label: 'Mist', config: { rate: 2, max: 40, lifetime: [5, 8], speed: [3, 8], angle: 0, spread: 30, size: [60, 90], alpha: [0.18, 0], area: [140, 30] } },
        { id: 'dust', label: 'Dust Motes', config: { rate: 3, max: 40, lifetime: [3, 5], speed: [2, 6], spread: 360, size: [2, 2], alpha: [0.6, 0], colorStart: '#fff4d0', colorEnd: '#fff4d0', blend: 'add', area: [80, 80], twinkle: 0.5 } },
        { id: 'sparkles', label: 'Sparkles', config: { rate: 8, lifetime: [0.4, 0.9], speed: [5, 20], spread: 360, size: [5, 0], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#a0e0ff', blend: 'add', shape: 'star', area: [24, 24], spin: [-180, 180] } },
        { id: 'snow', label: 'Snow', config: { rate: 6, max: 80, lifetime: [5, 8], speed: [15, 30], angle: 95, spread: 10, size: [3, 3], alpha: [0.9, 0], flutter: 10, area: [400, 0] } },
        { id: 'bubbles', label: 'Bubbles', config: { rate: 3, lifetime: [1.5, 3], speed: [12, 24], spread: 10, size: [3, 5], alpha: [0.8, 0], colorStart: '#c0f0ff', colorEnd: '#c0f0ff', shape: 'circle', flutter: 4, area: [20, 4] } },
        { id: 'magic', label: 'Magic', config: { rate: 14, lifetime: [0.8, 1.5], speed: [10, 30], spread: 360, gravity: -15, size: [6, 0], alpha: [1, 0], colorStart: '#c080ff', colorEnd: '#4060ff', blend: 'add', shape: 'star', spin: [-200, 200], area: [16, 16] } }
    ],

    normalize(config) {
        const src = config && typeof config === 'object' ? config : {};
        const preset = src.preset ? this.presets.find(p => p.id === src.preset) : null;
        const merged = Object.assign({}, this.defaults, preset ? preset.config : {}, src);
        const d = this.defaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === '' || v === null || v === undefined || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const pair = (v, def, min, max) => {
            if (typeof v === 'number') v = [v, v];
            if (!Array.isArray(v) || v.length === 0) return def.slice();
            const a = num(v[0], def[0], min, max);
            return [a, v.length > 1 ? num(v[1], a, min, max) : a];
        };
        const color = (v, def) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v).toLowerCase() : def);
        return {
            preset: preset ? preset.id : null,
            rate: num(merged.rate, d.rate, 0, 500),
            burst: Math.round(num(merged.burst, 0, 0, 1000)),
            max: Math.round(num(merged.max, d.max, 1, 1000)),
            lifetime: pair(merged.lifetime, d.lifetime, 0.05, 60),
            speed: pair(merged.speed, d.speed, 0, 2000),
            angle: num(merged.angle, d.angle, -360, 360),
            spread: num(merged.spread, d.spread, 0, 360),
            gravity: num(merged.gravity, 0, -2000, 2000),
            wind: num(merged.wind, 0, -2000, 2000),
            drag: num(merged.drag, 0, 0, 10),
            size: pair(merged.size, d.size, 0, 512),
            alpha: pair(merged.alpha, d.alpha, 0, 1),
            colorStart: color(merged.colorStart, d.colorStart),
            colorEnd: color(merged.colorEnd, color(merged.colorStart, d.colorEnd)),
            blend: this.blends.includes(merged.blend) ? merged.blend : d.blend,
            shape: this.shapes.includes(merged.shape) ? merged.shape : d.shape,
            area: pair(merged.area, d.area, 0, 4000),
            spin: pair(merged.spin, d.spin, -3600, 3600),
            flutter: num(merged.flutter, 0, 0, 200),
            twinkle: num(merged.twinkle, 0, 0, 1),
            // Elongates particles along their motion: flame tongues, spark streaks, rain.
            stretch: num(merged.stretch, 0, 0, 5)
        };
    },

    createState(config, seed) {
        return { config, particles: [], acc: 0, time: 0, rng: DocsDoodads.Scatter.rng(Number(seed) || 1) };
    },

    spawn(state) {
        const c = state.config, r = state.rng;
        if (state.particles.length >= c.max) return null;
        const between = range => range[0] + (range[1] - range[0]) * r();
        const angle = (c.angle + (r() - 0.5) * c.spread) * Math.PI / 180;
        const speed = between(c.speed);
        const p = {
            x: (r() - 0.5) * c.area[0], y: (r() - 0.5) * c.area[1],
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            age: 0, life: between(c.lifetime),
            rotation: r() * Math.PI * 2, spin: between(c.spin) * Math.PI / 180,
            phase: r() * Math.PI * 2
        };
        state.particles.push(p);
        return p;
    },

    burst(state, count) {
        for (let i = 0; i < count; i++) if (!this.spawn(state)) break;
        return state;
    },

    step(state, dt, emitting) {
        const c = state.config;
        state.time += dt;
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i];
            p.age += dt;
            if (p.age >= p.life) {
                state.particles.splice(i, 1);
                continue;
            }
            p.vx += c.wind * dt;
            p.vy += c.gravity * dt;
            if (c.drag > 0) {
                const k = Math.max(0, 1 - c.drag * dt);
                p.vx *= k;
                p.vy *= k;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.spin * dt;
        }
        if (emitting && c.rate > 0) {
            state.acc += c.rate * dt;
            while (state.acc >= 1) {
                state.acc -= 1;
                if (!this.spawn(state)) {
                    state.acc = 0;
                    break;
                }
            }
        }
        return state;
    },

    isIdle(state) {
        return !state || state.particles.length === 0;
    },

    // What each particle looks like now: size, alpha and colour blend over its life.
    view(state) {
        const c = state.config;
        const start = DocsDoodads.Lighting.parseColor(c.colorStart), end = DocsDoodads.Lighting.parseColor(c.colorEnd);
        const mix = (t) => {
            if (start === end) return start;
            const ch = (shift) => Math.round(((start >> shift) & 255) + ((((end >> shift) & 255) - ((start >> shift) & 255)) * t));
            return (ch(16) << 16) | (ch(8) << 8) | ch(0);
        };
        return state.particles.map(p => {
            const t = Math.min(1, p.age / p.life);
            let alpha = c.alpha[0] + (c.alpha[1] - c.alpha[0]) * t;
            if (c.twinkle > 0) alpha *= 1 - c.twinkle * (0.5 + 0.5 * Math.sin(p.age * 5 + p.phase));
            return {
                x: p.x + (c.flutter ? Math.sin(p.age * 3.8 + p.phase) * c.flutter : 0),
                y: p.y,
                size: c.size[0] + (c.size[1] - c.size[0]) * t,
                alpha: Math.max(0, Math.min(1, alpha)),
                rotation: c.stretch > 0 ? Math.atan2(p.vy, p.vx) + Math.PI / 2 : p.rotation,
                stretch: c.stretch,
                color: mix(t)
            };
        });
    }
};

// A VFX is a list of layers (particle emitters and sprite-sheet animations) with a shared clock.
DocsDoodads.Vfx = {
    layerTypes: [{ value: 'particles', label: 'Particles' }, { value: 'sheet', label: 'Sprite sheet' }],

    normalizeLayer(layer) {
        if (!layer || !this.layerTypes.some(t => t.value === layer.type)) return null;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const common = { type: layer.type, start: num(layer.start, 0, 0, 60), offsetX: num(layer.offsetX, 0, -2000, 2000), offsetY: num(layer.offsetY, 0, -2000, 2000) };
        if (layer.type === 'particles') {
            const emitter = Object.assign({}, layer.emitter || {});
            return Object.assign(common, { emitter: Object.assign({}, emitter, { burst: Math.round(num(emitter.burst, 0, 0, 1000)) }) });
        }
        const cols = Math.round(num(layer.cols, 5, 1, 64)), rows = Math.round(num(layer.rows, 1, 1, 64));
        return Object.assign(common, {
            image: String(layer.image || ''), cols, rows,
            frames: Math.round(num(layer.frames, cols * rows, 1, cols * rows)),
            fps: num(layer.fps, 15, 1, 120), loop: layer.loop === true,
            scale: num(layer.scale, 1, 0.05, 10), rotation: num(layer.rotation, 0, -360, 360),
            blend: DocsDoodads.Particles.blends.includes(layer.blend) ? layer.blend : 'normal',
            tint: /^#[0-9a-f]{6}$/i.test(String(layer.tint || '')) ? String(layer.tint).toLowerCase() : '#ffffff',
            alpha: num(layer.alpha, 1, 0, 1)
        });
    },

    normalize(def) {
        def = def || {};
        const num = Number(def.duration);
        return {
            id: String(def.id || ''),
            name: String(def.name || def.id || 'Effect'),
            duration: isFinite(num) && num > 0 ? Math.min(60, num) : 1,
            loop: def.loop === true,
            layers: (Array.isArray(def.layers) ? def.layers : []).map(l => this.normalizeLayer(l)).filter(Boolean)
        };
    },

    sheetLength(layer) {
        return layer.frames / layer.fps;
    },

    // Frame index at time t (seconds since the layer started), or -1 once a one-shot sheet has ended.
    sheetFrame(layer, t) {
        const index = Math.floor(Math.max(0, t) * layer.fps + 1e-9);
        if (index >= layer.frames) return layer.loop ? index % layer.frames : -1;
        return index;
    },

    emitting(def, layer, t) {
        if (t < layer.start) return false;
        return def.loop || t < def.duration;
    },

    isFinished(def, t, particlesAlive) {
        if (def.loop) return false;
        if (t < def.duration || particlesAlive > 0) return false;
        return def.layers.every(l => l.type !== 'sheet' || l.loop || t >= l.start + this.sheetLength(l));
    },

    builtIns: [],

    // The project's library first, then built-ins; matched by id, or by name ignoring case.
    find(key, library) {
        if (!key) return null;
        const k = String(key).toLowerCase();
        const all = (library || []).concat(this.builtIns);
        return all.find(d => d.id === key) || all.find(d => d.id.toLowerCase() === k || d.name.toLowerCase() === k) || null;
    },

    library() {
        return (DocsDoodads.World.get('vfx.library') || []).map(d => this.normalize(d));
    },

    _playing: [],

    // spec: { id, x, y (map pixels), follow (character), loop }. Rendering picks these up each frame.
    play(spec) {
        const def = this.find(spec && spec.id, this.library());
        if (!def) return null;
        const instance = { def: spec.loop ? Object.assign({}, def, { loop: true }) : def, x: Number(spec.x) || 0, y: Number(spec.y) || 0,
            follow: spec.follow || null, time: 0, seed: Math.floor(Math.random() * 1e9), done: false };
        this._playing.push(instance);
        return instance;
    }
};

DocsDoodads.Vfx.builtIns = [
    { id: 'explosion', name: 'Explosion', duration: 0.3, layers: [
        { type: 'particles', emitter: { preset: 'fire', rate: 0, burst: 40, speed: [60, 160], spread: 360, lifetime: [0.4, 0.9], size: [18, 2] } },
        { type: 'particles', emitter: { preset: 'smoke', rate: 0, burst: 14, speed: [20, 60], spread: 360, lifetime: [0.8, 1.6], size: [12, 36] } },
        { type: 'particles', emitter: { preset: 'embers', rate: 0, burst: 20, speed: [80, 200], spread: 360, gravity: 120 } }
    ] },
    { id: 'heal', name: 'Heal', duration: 0.8, layers: [
        { type: 'particles', emitter: { preset: 'sparkles', rate: 40, angle: -90, spread: 30, speed: [30, 60], colorStart: '#d0ffd0', colorEnd: '#40ff80', area: [40, 10], lifetime: [0.6, 1.2] } },
        { type: 'particles', emitter: { rate: 0, burst: 16, shape: 'soft', size: [10, 20], alpha: [0.6, 0], speed: [10, 30], spread: 360, colorStart: '#80ff90', blend: 'add', lifetime: [0.5, 0.9] } }
    ] },
    { id: 'levelup', name: 'Level Up', duration: 1, layers: [
        { type: 'particles', emitter: { preset: 'sparkles', rate: 50, angle: -90, spread: 20, speed: [60, 120], colorStart: '#fff3a0', colorEnd: '#ffb000', area: [36, 6], lifetime: [0.6, 1.1], size: [7, 0] } },
        { type: 'particles', emitter: { rate: 0, burst: 30, shape: 'star', speed: [80, 120], spread: 360, size: [6, 0], alpha: [1, 0], colorStart: '#ffffff', colorEnd: '#ffd040', blend: 'add', lifetime: [0.5, 0.8] } }
    ] },
    { id: 'smokepuff', name: 'Smoke Puff', duration: 0.2, layers: [
        { type: 'particles', emitter: { preset: 'smoke', rate: 0, burst: 12, speed: [15, 40], spread: 360, lifetime: [0.8, 1.4], size: [10, 30], alpha: [0.6, 0] } }
    ] },
    { id: 'magic', name: 'Magic Burst', duration: 0.6, layers: [
        { type: 'particles', emitter: { preset: 'magic', rate: 30, area: [30, 30] } },
        { type: 'particles', emitter: { preset: 'magic', rate: 0, burst: 24, speed: [60, 110], gravity: 0 } }
    ] },
    { id: 'splash', name: 'Water Splash', duration: 0.2, layers: [
        { type: 'particles', emitter: { rate: 0, burst: 26, shape: 'circle', angle: -90, spread: 120, speed: [60, 140], gravity: 320, size: [4, 2], alpha: [0.9, 0], colorStart: '#e0f8ff', colorEnd: '#80c8ff', lifetime: [0.4, 0.8] } }
    ] }
].map(def => DocsDoodads.Vfx.normalize(def));

// Grass and bushes that bend away from whoever walks through them, then spring back.
DocsDoodads.React = {
    defaults: { enabled: false, amount: 0.5, leaves: false },
    maxBend: 0.6,

    touching(d, charX, charBaseY, tileH) {
        const halfW = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1) * 0.5;
        const ax = d.anchorX !== undefined ? d.anchorX : 0.5;
        const centerX = d.x + (0.5 - ax) * halfW * 2;
        return Math.abs(charX - centerX) < halfW && Math.abs(charBaseY - DocsDoodads.Depth.baseY(d)) < (tileH || 48) * 0.6;
    },

    // Bend impulse (skew) pushing away from the walker; faster walkers push harder.
    push(d, charX, speedPx) {
        const amount = d.react && d.react.amount !== undefined ? Number(d.react.amount) || 0 : this.defaults.amount;
        const away = d.x >= charX ? 1 : -1;
        return away * amount * (0.03 + Math.abs(Number(speedPx) || 0) * 0.012);
    },

    step(state, impulse, stiffness = 0.12, damping = 0.18) {
        let vel = state.vel + (Number(impulse) || 0);
        vel += -stiffness * state.bend - damping * vel;
        const bend = Math.max(-this.maxBend, Math.min(this.maxBend, state.bend + vel));
        if (Math.abs(bend) < 1e-4 && Math.abs(vel) < 1e-4) return { bend: 0, vel: 0 };
        return { bend, vel };
    }
};

// Character sheets beyond MZ's 3 frames x 4 directions, idle/run cycles and one-shot actions.
DocsDoodads.CharacterAnim = {
    _parsed: {},

    // Cached: called several times per character per frame. Callers must not change the result.
    parseName(name) {
        name = String(name || '');
        if (this._parsed[name]) return this._parsed[name];
        const parsed = this.parseNameUncached(name);
        if (Object.keys(this._parsed).length > 2000) this._parsed = {};
        this._parsed[name] = parsed;
        return parsed;
    },

    parseNameUncached(name) {
        let frames = 3, dirs = 4, tagged = false;
        const f = name.match(/\[f(\d+)\]|%\((\d+)\)/i);
        if (f) {
            const n = parseInt(f[1] || f[2], 10);
            frames = n > 0 ? Math.min(64, n) : 3;
            tagged = true;
        }
        const d = name.match(/\[d([148])\]/i);
        if (d) {
            dirs = parseInt(d[1], 10);
            tagged = true;
        }
        const base = name.replace(/\[f\d+\]|%\(\d+\)|\[d[148]\]/gi, '');
        return { base, frames, dirs, tagged };
    },

    // Row in the sheet for a direction (1-9 numpad layout), and whether to mirror (single-row sheets face right).
    rowFor(dir, dirs) {
        const horizontalOf = { 1: 4, 7: 4, 3: 6, 9: 6 };
        if (dirs === 1) return { row: 0, mirror: [1, 4, 7].includes(dir) };
        if (dirs === 8) {
            const diag = { 1: 4, 3: 5, 7: 6, 9: 7 };
            if (diag[dir] !== undefined) return { row: diag[dir], mirror: false };
        }
        const d = horizontalOf[dir] || dir;
        return { row: Math.max(0, Math.min(3, (d - 2) / 2)), mirror: false };
    },

    walkFrame(pattern, frames) {
        if (frames === 3) return [0, 1, 2, 1][((pattern % 4) + 4) % 4];
        return ((pattern % frames) + frames) % frames;
    },

    standingFrame(frames) {
        return frames === 3 ? 1 : 0;
    },

    cycleFrame(elapsedFrames, fps, frames) {
        return Math.floor(Math.max(0, elapsedFrames) / 60 * fps + 1e-9) % Math.max(1, frames);
    },

    setFor(characterName, sets) {
        if (!characterName || !Array.isArray(sets)) return null;
        return sets.find(s => s && s.character === characterName) || null;
    },

    // info: { moving, dashing, stillFrames, action }
    stateFor(info, set) {
        if (info.action) return 'action';
        if (info.moving) return info.dashing && set && set.run ? 'run' : 'walk';
        if (set && set.idle && info.stillFrames >= (set.idleDelay !== undefined ? set.idleDelay : 90)) return 'idle';
        return 'stand';
    },

    sheetFor(state, characterName, set) {
        if (set && state === 'idle' && set.idle) return set.idle;
        if (set && state === 'run' && set.run) return set.run;
        return characterName;
    },

    // Finds "<base>_idle" and "<base>_run" sheets among the character files.
    autoDetect(characterName, fileNames) {
        const base = this.parseName(characterName).base;
        const pick = suffix => (fileNames || []).find(n => this.parseName(n).base.toLowerCase() === (base + suffix).toLowerCase()) || '';
        return { character: characterName, idle: pick('_idle'), run: pick('_run') };
    },

    newAction(spec) {
        const sheet = String(spec.sheet || '');
        const loops = Math.max(0, Math.round(Number(spec.loops !== undefined ? spec.loops : 1)));
        return { sheet, frames: this.parseName(sheet).frames, fps: Math.max(1, Number(spec.fps) || 8), loops, hold: spec.hold === true, elapsed: 0 };
    },

    // done: the action has finished (never for held or endlessly looping actions).
    actionFrame(action, elapsedFrames) {
        const index = Math.floor(Math.max(0, elapsedFrames) / 60 * action.fps + 1e-9);
        const total = action.frames * action.loops;
        if (action.loops === 0 || index < total) return { frame: index % action.frames, done: false };
        return { frame: action.frames - 1, done: !action.hold };
    },

    dir8(horz, vert) {
        return (vert === 2 ? 0 : 6) + (horz === 4 ? 1 : 3);
    },

    split8(dir) {
        const map = { 1: [4, 2], 3: [6, 2], 7: [4, 8], 9: [6, 8] };
        return map[dir] ? { horz: map[dir][0], vert: map[dir][1] } : null;
    }
};

//==========================================================
// SECTION 5F: SPATIAL SOUND (DISTANCE, PAN, VARIATION, EMITTERS, ECHO, REGION SOUNDS)
//==========================================================
// Distances are in tiles from the player. MZ pans with -100 (left) .. 100 (right).
DocsDoodads.SpatialSound = {
    modes: [
        { value: 'auto', label: 'Every event sound (not the party)' },
        { value: 'tagged', label: 'Only events tagged <spatial>' },
        { value: 'off', label: 'Off' }
    ],
    emitterDefaults: { file: '', volume: 80, pitch: 100, radius: 8, every: 4 },
    echoDefaults: { enabled: false, delay: 0.18, feedback: 0.35, mix: 0.3 },

    get defaults() {
        return DocsDoodads.World.defaults.sound;
    },

    gainAt(distance, s) {
        const near = Math.max(0, Number(s.near) || 0);
        const far = Math.max(near + 0.001, Number(s.far) || 14);
        if (distance <= near) return 1;
        if (distance >= far) return 0;
        const t = (distance - near) / (far - near);
        return (1 - t) * (1 - t);
    },

    panFor(dx, s) {
        const width = Math.max(0.5, Number(s.panWidth) || 8);
        return Math.round(Math.max(-1, Math.min(1, dx / width)) * 100);
    },

    // A copy of the sound as heard from dx, dy tiles away, or null when out of earshot.
    apply(se, dx, dy, s) {
        if (!se || !s || s.mode === 'off') return se;
        const gain = this.gainAt(Math.hypot(dx, dy), s);
        const volume = Math.round((Number(se.volume) || 0) * gain);
        if (gain <= 0 || volume <= 0) return null;
        const pan = Math.max(-100, Math.min(100, (Number(se.pan) || 0) + this.panFor(dx, s)));
        return { name: se.name, volume, pitch: se.pitch, pan };
    },

    // Pitch drifts both ways; volume only dips, so nothing gets louder than authored.
    vary(se, s, rng) {
        const pv = Math.max(0, Number(s && s.pitchVariance) || 0), vv = Math.max(0, Number(s && s.volumeVariance) || 0);
        if (!se || (!pv && !vv)) return se;
        const r = rng || Math.random;
        return Object.assign({}, se, {
            pitch: Math.round((Number(se.pitch) || 100) * (1 + (r() * 2 - 1) * pv / 100)),
            volume: Math.round((Number(se.volume) || 0) * (1 - r() * vv / 100))
        });
    },

    shouldSpatialize(s, tags, isPlayerLike) {
        if (!s || s.mode === 'off') return false;
        tags = tags || {};
        if (tags.spatial === false) return false;
        if (tags.spatial === true) return true;
        if (isPlayerLike) return false;
        return s.mode !== 'tagged';
    },

    // "bgs/River" or "se/Bird1"; a bare name is a background sound.
    splitFile(file) {
        const text = String(file || '').trim();
        if (!text) return null;
        const match = text.match(/^(bgs|se)\/(.+)$/i);
        return match ? { folder: match[1].toLowerCase(), name: match[2] } : { folder: 'bgs', name: text };
    },

    normalizeEmitter(src) {
        if (!src) return null;
        const file = this.splitFile(src.file);
        if (!file) return null;
        const d = this.emitterDefaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return {
            file: file.folder + '/' + file.name, folder: file.folder, name: file.name,
            volume: num(src.volume, d.volume, 0, 100), pitch: num(src.pitch, d.pitch, 50, 150),
            radius: num(src.radius, d.radius, 1, 60), every: num(src.every, d.every, 0.5, 120),
            loop: file.folder === 'bgs'
        };
    },

    // Gain and pan for each emitter; an emitter is silent beyond its own radius.
    planEmitters(list, s) {
        const out = {};
        for (const item of list || []) {
            if (!item || !item.emitter) continue;
            const near = Math.min(Number(s.near) || 0, item.emitter.radius * 0.25);
            out[item.key] = {
                gain: this.gainAt(Math.hypot(item.dx, item.dy), { near, far: item.emitter.radius }),
                pan: this.panFor(item.dx, s)
            };
        }
        return out;
    },

    // Repeating sound effects (birds, drips) wander around their interval.
    nextDelay(every, rng) {
        return Math.max(0.1, (Number(every) || 4) * (0.5 + (rng || Math.random)()));
    },

    echoFor(mapSettings) {
        const echo = mapSettings && mapSettings.echo;
        if (!echo || !echo.enabled) return null;
        const d = this.echoDefaults;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return { delay: num(echo.delay, d.delay, 0.02, 1), feedback: num(echo.feedback, d.feedback, 0, 0.9), mix: num(echo.mix, d.mix, 0, 1) };
    },

    regionSoundFor(list, regionId) {
        if (!(regionId > 0) || !Array.isArray(list)) return null;
        return list.find(e => e && Number(e.regionId) === regionId && e.name) || null;
    },

    regionStart() {
        return { key: null, saved: false, fade: 1 };
    },

    // What to do as the player's region changes: play a region's sound (remembering the map's own
    // first), or restore the map's sound on leaving.
    regionStep(state, list, regionId) {
        const entry = this.regionSoundFor(list, regionId);
        const key = entry ? entry.regionId + ':' + entry.name : null;
        if (key === state.key) return { state, action: null };
        if (entry) {
            return { state: { key, saved: true, fade: Number(entry.fade) || 1 }, action: { type: 'play', entry, save: !state.saved } };
        }
        return { state: this.regionStart(), action: state.key ? { type: 'restore', fade: state.fade } : null };
    }
};

//==========================================================
// SECTION 5G: EDITOR TOOLS (LAYERS, SYMMETRY, BIOMES, DRESSING, HISTORY, PALETTE, THUMBNAILS)
//==========================================================
// Layers are per map (map settings). A doodad's "layer" names one; no layer means Main.
DocsDoodads.Layers = {
    main: { id: 'main', name: 'Main', hidden: false, locked: false, gameHidden: false },

    list(mapSettings) {
        const own = mapSettings && Array.isArray(mapSettings.layers) ? mapSettings.layers.filter(l => l && l.id && l.id !== 'main') : [];
        return [Object.assign({}, this.main, mapSettings && mapSettings.mainLayer)].concat(own);
    },

    of(d) {
        return d && d.layer ? d.layer : 'main';
    },

    find(d, mapSettings) {
        const id = this.of(d);
        return this.list(mapSettings).find(l => l.id === id) || this.list(mapSettings)[0];
    },

    visibleInEditor(d, mapSettings) {
        return !this.find(d, mapSettings).hidden;
    },

    visibleInGame(d, mapSettings) {
        return !this.find(d, mapSettings).gameHidden;
    },

    isLocked(d, mapSettings) {
        return Boolean(this.find(d, mapSettings).locked);
    }
};

// Mirrored copies of a doodad across a vertical (x), horizontal (y) or both axes, in map pixels.
DocsDoodads.Symmetry = {
    modes: [
        { value: 'off', label: 'Off' }, { value: 'x', label: 'Mirror left/right' },
        { value: 'y', label: 'Mirror top/bottom' }, { value: 'xy', label: 'Mirror four ways' }
    ],

    defaultAxes(mapW, mapH, tileW, tileH) {
        return { axisX: mapW * tileW / 2, axisY: mapH * tileH / 2 };
    },

    mirrors(d, sym) {
        if (!sym || !sym.mode || sym.mode === 'off') return [];
        const out = [];
        const copy = (x, y, flip) => {
            const c = JSON.parse(JSON.stringify(d));
            delete c.uid;
            c.x = x;
            c.y = y;
            if (flip) c.scaleX = -(d.scaleX !== undefined ? d.scaleX : 1);
            out.push(c);
        };
        const mx = 2 * sym.axisX - d.x, my = 2 * sym.axisY - d.y;
        const onX = Math.abs(mx - d.x) < 1, onY = Math.abs(my - d.y) < 1;
        if ((sym.mode === 'x' || sym.mode === 'xy') && !onX) copy(mx, d.y, true);
        if ((sym.mode === 'y' || sym.mode === 'xy') && !onY) copy(d.x, my, false);
        if (sym.mode === 'xy' && !onX && !onY) copy(mx, my, true);
        return out;
    }
};

// 2D value noise in [0, 1], for patchy clusters.
const valueNoise2 = (x, y) => {
    const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
    const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
    return top * (1 - sy) + bottom * sy;
};

// Biomes: a weighted mix of art painted with spacing, thinner at the brush edge, in natural patches.
DocsDoodads.Biome = {
    normalizeEntry(e) {
        if (!e || !e.path) return null;
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const scaleMin = num(e.scaleMin, 1, 0.1, 5);
        return { path: String(e.path), weight: num(e.weight, 1, 0, 100), scaleMin, scaleMax: Math.max(scaleMin, num(e.scaleMax, scaleMin, 0.1, 5)) };
    },

    normalize(b) {
        b = b || {};
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        return {
            id: String(b.id || ''), name: String(b.name || 'Biome'),
            entries: (Array.isArray(b.entries) ? b.entries : []).map(e => this.normalizeEntry(e)).filter(Boolean),
            spacing: num(b.spacing, 40, 4, 500), density: Math.round(num(b.density, 6, 1, 60)),
            edgeThin: num(b.edgeThin, 0.5, 0, 1), cluster: num(b.cluster, 0.3, 0, 1),
            flip: b.flip !== false
        };
    },

    find(id, list) {
        return (list || []).find(b => b && b.id === id) || null;
    },

    pickEntry(entries, rng) {
        const total = (entries || []).reduce((n, e) => n + e.weight, 0);
        if (!(total > 0)) return null;
        let r = rng() * total;
        for (const e of entries) {
            r -= e.weight;
            if (r < 0) return e;
        }
        return entries[entries.length - 1];
    },

    keep(point, center, radius, biome, rng) {
        const d = Math.min(1, Math.hypot(point.x - center.x, point.y - center.y) / Math.max(1, radius));
        if (biome.cluster > 0 && valueNoise2(point.x / 96, point.y / 96) < biome.cluster * 0.6) return false;
        if (biome.edgeThin > 0 && rng() > 1 - biome.edgeThin * d * d) return false;
        return true;
    },

    // One dab of the brush: placements { path, x, y, scale, flipX }.
    paint(biome, center, radius, existing, rng) {
        const points = DocsDoodads.Scatter.candidates(center, radius, biome.spacing, existing, biome.density, rng);
        const out = [];
        for (const p of points) {
            if (!this.keep(p, center, radius, biome, rng)) continue;
            const entry = this.pickEntry(biome.entries, rng);
            if (!entry) continue;
            out.push({ path: entry.path, x: Math.round(p.x), y: Math.round(p.y),
                scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: biome.flip && rng() < 0.5 });
        }
        return out;
    }
};

// Map dressing rules: where props belong, read from the tiles.
DocsDoodads.Dress = {
    places: [
        { value: 'waterEdge', label: 'Along water edges' },
        { value: 'wallBase', label: 'At the foot of walls and cliffs' },
        { value: 'nearRegion', label: 'Beside a region (paths, roads)' },
        { value: 'region', label: 'Inside a region' },
        { value: 'terrain', label: 'On a terrain tag' },
        { value: 'open', label: 'Open ground' }
    ],

    normalize(rule) {
        rule = rule || {};
        const num = (v, def, min, max) => { const n = Number(v); return v === undefined || v === null || v === '' || !isFinite(n) ? def : Math.max(min, Math.min(max, n)); };
        const spacing = num(rule.spacing, 0, 0, 500);
        return {
            name: String(rule.name || 'Rule'),
            where: this.places.some(p => p.value === rule.where) ? rule.where : 'open',
            param: Math.round(num(rule.param, 0, 0, 255)),
            chance: num(rule.chance, 0.35, 0, 1),
            spacing,
            // Keeps clear of props already on the map, so dressing twice never stacks.
            minGap: Math.max(spacing, 40),
            entries: (Array.isArray(rule.entries) ? rule.entries : []).map(e => DocsDoodads.Biome.normalizeEntry(e)).filter(Boolean)
        };
    },

    // query: { width, height, isWater(x,y), isPassable(x,y), regionId(x,y), terrainTag(x,y), hasEvent(x,y), hasGround(x,y)? }
    tilesFor(rule, q) {
        const out = [];
        const inside = (x, y) => x >= 0 && y >= 0 && x < q.width && y < q.height;
        const near4 = (x, y, test) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inside(x + dx, y + dy) && test(x + dx, y + dy));
        for (let y = 0; y < q.height; y++) {
            for (let x = 0; x < q.width; x++) {
                if (!q.isPassable(x, y) || q.isWater(x, y) || q.hasEvent(x, y)) continue;
                if (q.hasGround && !q.hasGround(x, y)) continue;
                let ok = false;
                switch (rule.where) {
                    case 'waterEdge': ok = near4(x, y, q.isWater); break;
                    case 'wallBase': ok = inside(x, y - 1) && !q.isPassable(x, y - 1) && !q.isWater(x, y - 1); break;
                    case 'nearRegion': ok = q.regionId(x, y) !== rule.param && near4(x, y, (a, b) => q.regionId(a, b) === rule.param); break;
                    case 'region': ok = q.regionId(x, y) === rule.param; break;
                    case 'terrain': ok = q.terrainTag(x, y) === rule.param; break;
                    default: ok = q.regionId(x, y) === 0;
                }
                if (ok) out.push({ x, y });
            }
        }
        return out;
    },

    // Placements for every rule: { path, x, y, scale, flipX, rule }.
    plan(rules, q, existing, tileW, tileH, rng) {
        const out = [];
        const taken = (existing || []).map(p => ({ x: p.x, y: p.y, old: true }));
        for (const raw of rules || []) {
            const rule = this.normalize(raw);
            if (!rule.entries.length || rule.chance <= 0) continue;
            for (const t of this.tilesFor(rule, q)) {
                if (rng() >= rule.chance) continue;
                const p = { x: (t.x + 0.25 + 0.5 * rng()) * tileW, y: (t.y + 0.6 + 0.35 * rng()) * tileH };
                const crowded = taken.some(o => Math.hypot(o.x - p.x, o.y - p.y) < (o.old ? rule.minGap : rule.spacing));
                if (crowded) continue;
                const entry = DocsDoodads.Biome.pickEntry(rule.entries, rng);
                const placement = { path: entry.path, x: Math.round(p.x), y: Math.round(p.y),
                    scale: entry.scaleMin + (entry.scaleMax - entry.scaleMin) * rng(), flipX: rng() < 0.5, rule: rule.name };
                out.push(placement);
                taken.push({ x: placement.x, y: placement.y, old: false });
            }
        }
        return out;
    }
};

// What changed since a backup: doodads matched by uid (or art and position for older data), events by id.
DocsDoodads.History = {
    doodadKey(d) {
        return d.uid ? 'uid:' + d.uid : 'at:' + (d.bit ? d.bit[1] : '') + '@' + Math.round(d.x) + ',' + Math.round(d.y);
    },

    diffDoodads(current, backup) {
        const out = { added: [], removed: [], changed: [], unchanged: 0 };
        const before = new Map();
        for (const d of backup || []) if (d) before.set(this.doodadKey(d), d);
        const seen = new Set();
        for (const d of current || []) {
            if (!d) continue;
            const key = this.doodadKey(d);
            const old = before.get(key);
            if (!old) {
                out.added.push(d);
                continue;
            }
            seen.add(key);
            if (JSON.stringify(old) === JSON.stringify(d)) out.unchanged++;
            else out.changed.push({ current: d, backup: old });
        }
        for (const [key, d] of before) if (!seen.has(key)) out.removed.push(d);
        return out;
    },

    diffEvents(current, backup) {
        const out = { added: [], removed: [], changed: [], unchanged: 0 };
        const byId = list => new Map((list || []).filter(Boolean).map(e => [e.id, e]));
        const now = byId(current), then = byId(backup);
        for (const [id, e] of now) {
            const old = then.get(id);
            if (!old) out.added.push(e);
            else if (JSON.stringify(old) === JSON.stringify(e)) out.unchanged++;
            else out.changed.push({ current: e, backup: old });
        }
        for (const [id, e] of then) if (!now.has(id)) out.removed.push(e);
        return out;
    },

    backupLabel(backup) {
        const date = new Date(backup.mtimeMs || 0);
        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }
};

// Ctrl+K: letters in order match; word starts and unbroken runs score higher.
DocsDoodads.CommandPalette = {
    score(query, label) {
        const q = String(query || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const text = String(label || '').toLowerCase();
        if (!q) return 0;
        let score = 0, ti = 0, run = 0;
        for (const ch of q) {
            if (ch === ' ') { run = 0; continue; }
            const found = text.indexOf(ch, ti);
            if (found < 0) return -1;
            const wordStart = found === 0 || /[^a-z0-9]/.test(text[found - 1]);
            run = found === ti && ti > 0 ? run + 1 : 0;
            score += 1 + (wordStart ? 6 : 0) + run * 3 - Math.min(5, found - ti) * 0.2;
            ti = found + 1;
        }
        if (text.indexOf(q) >= 0) score += 15;
        return score - text.length * 0.01;
    },

    rank(query, items, limit) {
        return (items || [])
            .map(item => ({ item, score: this.score(query, item.label) }))
            .filter(r => r.score >= 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit || 50)
            .map(r => r.item);
    }
};

// Drawer thumbnails that play on hover: character walk cycles and equal-sized slice strips.
DocsDoodads.AnimatedThumb = {
    framesFor(asset) {
        if (!asset || !asset.width || !asset.height) return null;
        const path = String(asset.path || '').toLowerCase();
        const name = String(asset.fileName || '').replace(/\.[^.]+$/, '');
        const walk = [0, 1, 2, 1];
        if (path.indexOf('img/characters/') === 0) {
            const parsed = DocsDoodads.CharacterAnim.parseName(name);
            if (parsed.tagged) {
                const w = asset.width / parsed.frames, h = asset.height / parsed.dirs;
                return Array.from({ length: parsed.frames }, (_, i) => ({ x: i * w, y: 0, w, h }));
            }
            const big = asset.type === 'single_character' || name.startsWith('$') || name.startsWith('!$');
            const blockW = big ? asset.width : asset.width / 4, blockH = big ? asset.height : asset.height / 2;
            const w = blockW / 3, h = blockH / 4;
            return walk.map(i => ({ x: i * w, y: 0, w, h }));
        }
        const regions = asset.slice && Array.isArray(asset.slice.regions) ? asset.slice.regions : [];
        if (regions.length < 2) return null;
        const w = regions[0].w, h = regions[0].h;
        if (!regions.every(r => r.w === w && r.h === h)) return null;
        return regions.slice(0, 64).map(r => ({ x: r.x, y: r.y, w, h }));
    }
};

//==========================================================
// SECTION 5H: VISUAL EQUIPMENT & MAP DESTINATION
//==========================================================
// Gear drawn on characters. Notetags (weapons, armors, states, actors, classes, events):
//   <visual: image, z N, part P, index I, sv SVIMAGE>   a layer (z < 0 is behind the body)
//   <visual base: ...>                                  a layer the actor always wears (hair, ears)
//   <visual hide: part, part>                           parts this hides (a helmet hides the hair)
//   <visual color: part, switch N | variable N, hue N, tint #rrggbb>
//   <visual alias: X>                                   fills {alias} in image names (body types)
//   <visual actor: N>                                   an event wears actor N's look
DocsDoodads.VisualEquip = {
    _notes: {},

    parseLayer(text) {
        const parts = String(text || '').split(',').map(p => p.trim()).filter(Boolean);
        const image = parts.shift() || '';
        const layer = { image, z: 1, up: null, part: image, index: null, sv: '' };
        for (const p of parts) {
            const m = /^(z|up|part|index|sv)\s*[:=]?\s*(.+)$/i.exec(p);
            if (!m) continue;
            const key = m[1].toLowerCase(), value = m[2].trim();
            if (key === 'z') layer.z = Number(value) || 0;
            else if (key === 'up') layer.up = Number(value) || 0;
            else if (key === 'index') {
                const n = parseInt(value, 10);
                layer.index = n >= 0 && n < 8 ? n : null;
            } else layer[key] = value;
        }
        return layer;
    },

    parseColor(text) {
        const parts = String(text || '').split(',').map(p => p.trim()).filter(Boolean);
        const rule = { part: parts.shift() || '', switchId: 0, variableId: 0, hue: null, tint: null };
        for (const p of parts) {
            const m = /^(switch|variable|hue|tint)\s*[:=]?\s*(.+)$/i.exec(p);
            if (!m) continue;
            const key = m[1].toLowerCase(), value = m[2].trim();
            if (key === 'switch') rule.switchId = Math.max(0, parseInt(value, 10) || 0);
            else if (key === 'variable') rule.variableId = Math.max(0, parseInt(value, 10) || 0);
            else if (key === 'hue') rule.hue = Number(value) || 0;
            else {
                const hex = /^#?([0-9a-f]{6})$/i.exec(value);
                if (hex) rule.tint = parseInt(hex[1], 16);
            }
        }
        return rule;
    },

    // Cached by text: notes are read every frame. Callers must not change the result.
    parseNote(note) {
        const text = String(note || '');
        if (this._notes[text]) return this._notes[text];
        const out = { layers: [], base: [], hides: [], colors: [], alias: '', actorId: 0 };
        if (/<\s*visual/i.test(text)) {
            const re = /<\s*visual(?:\s+(base|hide|alias|colou?r|actor))?\s*:\s*([^>]*)>/gi;
            let m;
            while ((m = re.exec(text))) {
                const kind = (m[1] || '').toLowerCase(), body = m[2].trim();
                if (!kind) out.layers.push(this.parseLayer(body));
                else if (kind === 'base') out.base.push(this.parseLayer(body));
                else if (kind === 'hide') out.hides.push(...body.split(',').map(s => s.trim()).filter(Boolean));
                else if (kind === 'alias') out.alias = body;
                else if (kind === 'actor') out.actorId = Math.max(0, parseInt(body, 10) || 0);
                else out.colors.push(this.parseColor(body));
            }
        }
        if (Object.keys(this._notes).length > 2000) this._notes = {};
        this._notes[text] = out;
        return out;
    },

    // ctx: { actorNote, equipNotes[], extraNotes[], alias?, colors? { part: { hue, tint } } }
    // env: { switch(id), variable(id) }. Returns the layers to draw, back to front.
    resolve(ctx, env) {
        env = env || {};
        const sources = [this.parseNote(ctx.actorNote)]
            .concat((ctx.equipNotes || []).map(n => this.parseNote(n)), (ctx.extraNotes || []).map(n => this.parseNote(n)));
        const alias = ctx.alias ? String(ctx.alias) : sources.map(s => s.alias).filter(Boolean).pop() || '';
        const hides = new Set();
        const rules = [];
        const all = [];
        sources.forEach((s, source) => {
            s.hides.forEach(h => hides.add(h.toLowerCase()));
            rules.push(...s.colors);
            for (const layer of s.base.concat(s.layers)) all.push({ layer, source });
        });
        // Named parts are slots: the last item naming a part replaces earlier ones (a shirt by armor).
        // Pieces from the same item share a slot, and unnamed layers (part = image) never replace.
        const owner = {};
        for (const { layer, source } of all) {
            if (layer.part && layer.part !== layer.image) owner[String(layer.part).toLowerCase()] = source;
        }
        const fill = v => String(v || '').replace(/\{alias\}/gi, alias);
        const switchOn = id => (typeof env.switch === 'function' ? Boolean(env.switch(id)) : false);
        const variable = id => (typeof env.variable === 'function' ? Number(env.variable(id)) || 0 : 0);
        const overrides = ctx.colors || {};
        const out = [];
        for (const { layer, source } of all) {
            const part = String(layer.part || '').toLowerCase();
            if (!layer.image || hides.has(part)) continue;
            if (layer.part !== layer.image && owner[part] !== source) continue;
            let hue = 0, tint = null;
            for (const rule of rules) {
                if (String(rule.part).toLowerCase() !== part) continue;
                if (rule.switchId && !switchOn(rule.switchId)) continue;
                if (rule.variableId) hue = variable(rule.variableId);
                else if (rule.hue !== null) hue = rule.hue;
                if (rule.tint !== null) tint = rule.tint;
            }
            const set = Object.keys(overrides).find(k => k.toLowerCase() === part);
            if (set) {
                if (overrides[set].hue !== undefined && overrides[set].hue !== null) hue = Number(overrides[set].hue) || 0;
                if (overrides[set].tint !== undefined) tint = overrides[set].tint;
            }
            out.push({ image: fill(layer.image), z: layer.z, up: layer.up, part: layer.part, index: layer.index, sv: fill(layer.sv), hue, tint });
        }
        return out.sort((a, b) => a.z - b.z);
    },

    signature(layers) {
        return (layers || []).map(l => [l.image, l.z, l.up, l.index, l.sv, l.hue, l.tint].join(':')).join('|');
    },

    // The draw order for a facing: "up" replaces z while facing up (a cape goes in front of the back).
    zFor(layer, facing) {
        return [7, 8, 9].includes(facing) && layer.up !== null && layer.up !== undefined ? layer.up : layer.z;
    },

    // Tie-break offsets around the body's spriteId, back to front: behind from -0.5, in front from +0.01.
    orderFor(layers, facing) {
        const zs = layers.map(l => this.zFor(l, facing));
        const sorted = layers.map((_, i) => i).sort((a, b) => zs[a] - zs[b] || a - b);
        const out = new Array(layers.length);
        let behind = 0, front = 0;
        for (const i of sorted) out[i] = zs[i] < 0 ? -0.5 + (behind++) * 0.001 : 0.01 + (front++) * 0.001;
        return out;
    },

    // The cell of a layer sheet for frame column `col` and row `row`, laid out like a character sheet
    // ($ single sheets, 8-character sheets, or [fN]/[dN] tagged sheets).
    frameRect(name, width, height, index, col, row) {
        const layout = DocsDoodads.CharacterAnim.parseName(name);
        const single = layout.tagged || /^!?\$/.test(String(name || ''));
        const i = ((Number(index) || 0) % 8 + 8) % 8;
        const block = single ? { x: 0, y: 0, w: width, h: height } : { x: (i % 4) * width / 4, y: Math.floor(i / 4) * height / 2, w: width / 4, h: height / 2 };
        const pw = Math.floor(block.w / layout.frames), ph = Math.floor(block.h / layout.dirs);
        const f = ((Math.floor(col) % layout.frames) + layout.frames) % layout.frames;
        const r = Math.max(0, Math.min(layout.dirs - 1, Math.floor(row) || 0));
        return { x: block.x + f * pw, y: block.y + r * ph, w: pw, h: ph };
    },

    // Side-view battlers: the same cell of the layer's sheet, scaled when the layer is a different size.
    svRect(layerW, layerH, frame, baseW, baseH) {
        const sx = baseW > 0 ? layerW / baseW : 1, sy = baseH > 0 ? layerH / baseH : 1;
        return { x: Math.round(frame.x * sx), y: Math.round(frame.y * sy), w: Math.round(frame.width * sx), h: Math.round(frame.height * sy) };
    },

    savefileLayers(lists) {
        return (lists || []).map(list => (list || []).map(l => ({ image: l.image, z: l.z, index: l.index, hue: l.hue, tint: l.tint })));
    },

    // Hue rotation (like MZ's sprite hue) and a multiply tint on RGBA pixels, for drawing in windows.
    recolor(data, hue, tint) {
        hue = Number(hue) || 0;
        const tr = tint === null || tint === undefined ? 255 : (tint >> 16) & 255;
        const tg = tint === null || tint === undefined ? 255 : (tint >> 8) & 255;
        const tb = tint === null || tint === undefined ? 255 : tint & 255;
        if (!hue && tr === 255 && tg === 255 && tb === 255) return data;
        const shift = (((hue / 360) % 1) + 1) % 1;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;
            let r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
            if (shift) {
                const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
                if (d > 0) {
                    let h = max === r ? (((g - b) / d + 6) % 6) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
                    const s = l < 1 ? d / (1 - Math.abs(2 * l - 1)) : 0;
                    h = (h + shift) % 1;
                    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h * 6) % 2 - 1)), m = l - c / 2;
                    const k = Math.floor(h * 6);
                    [r, g, b] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][Math.min(5, k)].map(v => v + m);
                }
            }
            data[i] = Math.round(r * tr);
            data[i + 1] = Math.round(g * tg);
            data[i + 2] = Math.round(b * tb);
        }
        return data;
    }
};

// The marker where the player clicks or taps to walk.
DocsDoodads.Destination = {
    styles: [
        { value: 'default', label: 'MZ square' },
        { value: 'square', label: 'Rounded square' },
        { value: 'circle', label: 'Circle' },
        { value: 'ring', label: 'Ring' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'cross', label: 'Cross' },
        { value: 'arrow', label: 'Arrow' },
        { value: 'image', label: 'Image (img/system)' },
        { value: 'animation', label: 'Database animation' },
        { value: 'vfx', label: 'VFX effect' },
        { value: 'none', label: 'Hidden' }
    ],
    pulses: [
        { value: 'mz', label: 'MZ pulse' },
        { value: 'breathe', label: 'Breathe' },
        { value: 'ripple', label: 'Ripple' },
        { value: 'none', label: 'Still' }
    ],
    blends: [
        { value: 'add', label: 'Add (glow)' },
        { value: 'normal', label: 'Normal' },
        { value: 'multiply', label: 'Multiply' },
        { value: 'screen', label: 'Screen' }
    ],
    layers: [
        { value: 'above', label: 'Above characters (MZ)' },
        { value: 'ground', label: 'On the ground' }
    ],
    defaults: {
        style: 'default', color: '#ffffff', opacity: 120, blend: 'add', scale: 1, pulse: 'mz', spin: 0, bob: 0,
        layer: 'above', image: '', fps: 8, animationId: 0, vfx: '', pathDots: false, dotColor: '#ffffff', dotSpacing: 1
    },

    normalize(s) {
        s = s || {};
        const d = this.defaults;
        const pick = (list, v, fallback) => (list.some(o => o.value === v) ? v : fallback);
        const num = (v, fallback, min, max) => {
            const n = Number(v);
            return Number.isFinite(n) && v !== '' && v !== null ? Math.max(min, Math.min(max, n)) : fallback;
        };
        const color = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v || '')) ? String(v) : fallback);
        return {
            style: pick(this.styles, s.style, d.style),
            color: color(s.color, d.color),
            opacity: num(s.opacity, d.opacity, 0, 255),
            blend: pick(this.blends, s.blend, d.blend),
            scale: num(s.scale, d.scale, 0.1, 4),
            pulse: pick(this.pulses, s.pulse, d.pulse),
            spin: num(s.spin, d.spin, -720, 720),
            bob: num(s.bob, d.bob, 0, 48),
            layer: pick(this.layers, s.layer, d.layer),
            image: String(s.image || ''),
            fps: num(s.fps, d.fps, 1, 60) || 1,
            animationId: Math.max(0, Math.floor(Number(s.animationId) || 0)),
            vfx: String(s.vfx || ''),
            pathDots: s.pathDots === true,
            dotColor: color(s.dotColor, d.dotColor),
            dotSpacing: Math.max(1, Math.floor(num(s.dotSpacing, d.dotSpacing, 1, 8)))
        };
    },

    // The project's marker with mid-game changes from the plugin command on top.
    merge(project, override) {
        const out = Object.assign({}, project || {});
        for (const key of Object.keys(override || {})) {
            if (override[key] !== undefined && override[key] !== null) out[key] = override[key];
        }
        return this.normalize(out);
    },

    blendMode(blend) {
        return { normal: 0, add: 1, multiply: 2, screen: 3 }[blend] !== undefined ? { normal: 0, add: 1, multiply: 2, screen: 3 }[blend] : 1;
    },

    // Scale and opacity multipliers `frame` frames after the marker appeared.
    pulse(kind, frame) {
        frame = Math.max(0, Math.floor(frame) || 0);
        if (kind === 'mz') {
            const f = frame % 20;
            return { scale: 1 + f / 20, alpha: (20 - f) / 20 };
        }
        if (kind === 'breathe') {
            const w = Math.sin(frame / 60 * Math.PI * 2);
            return { scale: 1 + 0.08 * w, alpha: 0.8 + 0.2 * w };
        }
        if (kind === 'ripple') {
            const f = (frame % 60) / 60;
            return { scale: 0.6 + 0.9 * f, alpha: 1 - f };
        }
        return { scale: 1, alpha: 1 };
    },

    rotation(degreesPerSecond, frame) {
        return (Number(degreesPerSecond) || 0) * Math.PI / 180 * (Math.max(0, frame) / 60);
    },

    // Pixels up and down (negative is up), one bob a second.
    bob(height, frame) {
        if (!height) return 0;
        return -height * (0.5 - 0.5 * Math.cos(frame / 60 * Math.PI * 2));
    },

    // One row of frames: Marker[f4] is four frames side by side.
    imageFrame(name, width, height, frame, fps) {
        const layout = DocsDoodads.CharacterAnim.parseName(name);
        if (!layout.tagged) return { x: 0, y: 0, w: width, h: height };
        const w = Math.floor(width / layout.frames);
        const i = DocsDoodads.CharacterAnim.cycleFrame(frame, fps, layout.frames);
        return { x: i * w, y: 0, w, h: height };
    },

    // Breadth-first search like MZ's route search. canEnter(x, y, fromX, fromY, dir) says whether a step
    // is allowed; opts.wrap(x, y) handles looping maps; opts.distance(ax, ay, bx, by) measures closeness.
    // When the goal can't be reached, the path ends at the reachable tile closest to it (as MZ walks).
    path(start, goal, canEnter, limit, opts) {
        opts = opts || {};
        const wrap = opts.wrap || ((x, y) => ({ x, y }));
        const distance = opts.distance || ((ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by));
        const key = (x, y) => x + ',' + y;
        if (start.x === goal.x && start.y === goal.y) return [];
        const from = new Map([[key(start.x, start.y), null]]);
        const cost = new Map([[key(start.x, start.y), 0]]);
        const queue = [{ x: start.x, y: start.y }];
        let best = { x: start.x, y: start.y, h: distance(start.x, start.y, goal.x, goal.y) };
        let found = null;
        const steps = [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]];
        while (queue.length && !found) {
            const cur = queue.shift();
            const g = cost.get(key(cur.x, cur.y));
            if (g >= (limit || 12)) continue;
            for (const [dx, dy, dir] of steps) {
                const n = wrap(cur.x + dx, cur.y + dy);
                const k = key(n.x, n.y);
                if (from.has(k) || !canEnter(n.x, n.y, cur.x, cur.y, dir)) continue;
                from.set(k, cur);
                cost.set(k, g + 1);
                if (n.x === goal.x && n.y === goal.y) {
                    found = n;
                    break;
                }
                const h = distance(n.x, n.y, goal.x, goal.y);
                if (h < best.h) best = { x: n.x, y: n.y, h };
                queue.push(n);
            }
        }
        const end = found || best;
        if (end.x === start.x && end.y === start.y) return [];
        const out = [];
        for (let p = { x: end.x, y: end.y }; p && !(p.x === start.x && p.y === start.y); p = from.get(key(p.x, p.y))) out.unshift({ x: p.x, y: p.y });
        return out;
    },

    // Dots along a path, every `spacing` tiles, leaving the last tile for the marker.
    dots(path, spacing) {
        spacing = Math.max(1, Math.floor(spacing) || 1);
        return (path || []).slice(0, -1).filter((_, i) => (i + 1) % spacing === 0);
    },

    zFor(layer) {
        return layer === 'ground' ? 0.6 : 9;
    }
};

// A frame clipped to the image. Images replaced by smaller ones would otherwise make PIXI throw
// "frame does not fit inside the base Texture" and stop the game.
DocsDoodads.safeFrame = function(rect, width, height) {
    const x = Math.max(0, Math.floor(rect.x || 0)), y = Math.max(0, Math.floor(rect.y || 0));
    if (x >= width || y >= height) return { x: 0, y: 0, w: width, h: height };
    return { x, y, w: Math.max(1, Math.min(rect.w || width, width - x)), h: Math.max(1, Math.min(rect.h || height, height - y)) };
};

//==========================================================
// SECTION 6: SPRITE_DOCSDOODAD RUNTIME ENGINE
//==========================================================
// Map pixels to screen pixels. Looping maps wrap the camera, so this uses MZ's adjustX/adjustY
// exactly like Sprite_Character; a plain display offset would push doodads off-screen at the seam.
DocsDoodads.mapToScreen = function(x, y) {
    const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
    if (!gameMap) return { x, y };
    const tw = gameMap.tileWidth ? gameMap.tileWidth() : 48;
    const th = gameMap.tileHeight ? gameMap.tileHeight() : 48;
    const round = v => Math.round(v * 1000) / 1000;
    return {
        x: round(typeof gameMap.adjustX === 'function' ? gameMap.adjustX(x / tw) * tw : x - gameMap.displayX() * tw),
        y: round(typeof gameMap.adjustY === 'function' ? gameMap.adjustY(y / th) * th : y - gameMap.displayY() * th)
    };
};

// Screen pixels back to map pixels, wrapped into the map on looping maps.
DocsDoodads.screenToMap = function(screenX, screenY) {
    const gameMap = typeof window !== 'undefined' ? window.$gameMap : null;
    if (!gameMap) return { x: screenX, y: screenY };
    const tw = gameMap.tileWidth ? gameMap.tileWidth() : 48;
    const th = gameMap.tileHeight ? gameMap.tileHeight() : 48;
    let x = gameMap.displayX() * tw + screenX;
    let y = gameMap.displayY() * th + screenY;
    const wrap = (v, size) => ((v % size) + size) % size;
    if (gameMap.isLoopHorizontal && gameMap.isLoopHorizontal() && gameMap.width) x = wrap(x, gameMap.width() * tw);
    if (gameMap.isLoopVertical && gameMap.isLoopVertical() && gameMap.height) y = wrap(y, gameMap.height() * th);
    return { x, y };
};

DocsDoodads.frameCount = function() {
    return typeof Graphics !== 'undefined' && Graphics.frameCount !== undefined ? Graphics.frameCount : 0;
};

if (typeof PIXI !== 'undefined') {
    Sprite_DocsDoodad.prototype = Object.create(PIXI.Sprite.prototype);
    Sprite_DocsDoodad.prototype.constructor = Sprite_DocsDoodad;

    Sprite_DocsDoodad.prototype.initialize = function(data, spriteset) {
        PIXI.Sprite.call(this);
        this._data = data;
        this._spriteset = spriteset;
        // The tilemap breaks z/y ties by spriteId, like Sprite_Character.
        this.spriteId = typeof Sprite !== 'undefined' && Sprite._counter !== undefined ? Sprite._counter++ : 0;
        this._frameTimer = 0;
        this._currentFrame = 0;
        this._spin = 0;
        this._lastUpdateFrame = -1;
        this._appearanceSig = null;
        this._shadowSprite = null;
        this.loadTexture();
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.loadTexture = function() {
        if (!this._data || !this._data.bit) return;
        const bit = this._data.bit;
        let bmp = null;
        if (bit[0] === 1 && typeof ImageManager !== 'undefined') {
            bmp = ImageManager.loadSystem("IconSet");
        } else if (bit[0] === 2 && typeof $gameMap !== 'undefined' && $dataTilesets) {
            const tileset = $dataTilesets[$gameMap.tilesetId()];
            if (tileset && tileset.tilesetNames && tileset.tilesetNames[bit[1]]) {
                bmp = ImageManager.loadTileset(tileset.tilesetNames[bit[1]]);
            }
        } else if (bit[0] === 3) {
            const path = this.seasonPath();
            this._loadedPath = path;
            const packed = path === bit[1] && DocsDoodads.Packer.shouldUse() && typeof $gameMap !== 'undefined' && $gameMap
                ? DocsDoodads.Packer.resolve(DocsDoodads.Packer.forMap($gameMap.mapId()), this._data) : null;
            this._regionOrigin = packed ? { x: packed.x, y: packed.y } : null;
            this._regionSize = packed ? { w: packed.w, h: packed.h } : null;
            bmp = DocsDoodads.loadBitmap(packed ? packed.sheet : path);
        }
        if (bmp) {
            if (bmp.isReady()) {
                this.setupBitmap(bmp);
            } else {
                bmp.addLoadListener(() => this.setupBitmap(bmp));
            }
        }
    };

    // The art for the current season, re-resolved only when the season or the table changes.
    Sprite_DocsDoodad.prototype.seasonPath = function() {
        const bit = this._data && this._data.bit;
        if (!bit || bit[0] !== 3) return null;
        const season = DocsDoodads.Atmosphere.season();
        const sets = DocsDoodads.World.settings().seasons.sets;
        if (this._seasonKey !== season || this._seasonSets !== sets || this._seasonSource !== bit[1]) {
            this._seasonKey = season;
            this._seasonSets = sets;
            this._seasonSource = bit[1];
            this._seasonResolved = DocsDoodads.Seasons.resolve(bit[1], season, sets);
        }
        return this._seasonResolved;
    };

    Sprite_DocsDoodad.prototype.setupBitmap = function(bmp) {
        if (!bmp || !bmp._baseTexture) return;
        this._bmp = bmp;
        const fw = this._data.frameW || bmp.width;
        const fh = this._data.frameH || bmp.height;
        const fx = this._regionOrigin ? this._regionOrigin.x : (this._data.frameX || 0);
        const fy = this._regionOrigin ? this._regionOrigin.y : (this._data.frameY || 0);
        // A packed region may have been clipped to a smaller image; never read into its neighbours.
        const limitW = this._regionSize ? fx + Math.min(fw, this._regionSize.w) : bmp.width;
        const limitH = this._regionSize ? fy + Math.min(fh, this._regionSize.h) : bmp.height;
        const frame = DocsDoodads.safeFrame({ x: fx, y: fy, w: fw, h: fh }, Math.min(bmp.width, limitW), Math.min(bmp.height, limitH));
        this.texture = new PIXI.Texture(bmp._baseTexture, new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h));
        if (this._shadowSprite) this._shadowSprite.texture = this.texture;
    };

    // Called by the tilemap (which updates its children) and by Spriteset_Map; runs once per frame.
    Sprite_DocsDoodad.prototype.update = function() {
        if (!this._data) return;
        const frame = DocsDoodads.frameCount();
        if (frame === this._lastUpdateFrame && frame !== 0) return;
        this._lastUpdateFrame = frame;
        const d = this._data;
        if (d.rotateSpeed) this._spin += d.rotateSpeed * Math.PI / 180;
        if (d.frameUpdate && (d.xFrame > 1 || d.yFrame > 1)) {
            this._frameTimer++;
            if (this._frameTimer >= d.frameUpdate) {
                this._frameTimer = 0;
                this.updateFrameAnimation();
            }
        }
        if (d.bit && d.bit[0] === 3 && this._loadedPath !== undefined && this.seasonPath() !== this._loadedPath) this.loadTexture();
        this.updatePlacement();
    };

    Sprite_DocsDoodad.prototype.screenPosition = function() {
        const d = this._data;
        if (d.posMode === 1 && typeof $gameMap !== 'undefined' && $gameMap) {
            return DocsDoodads.mapToScreen(d.x, d.y);
        }
        return { x: d.x || 0, y: d.y || 0 };
    };

    Sprite_DocsDoodad.prototype.updatePlacement = function() {
        const d = this._data;
        const editing = Boolean(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        if (this._motionSource !== d.motion || editing) {
            this._motionSource = d.motion;
            this._motion = DocsDoodads.Motion.normalize(d.motion);
        }
        const motion = DocsDoodads.Motion.sample(this._motion, DocsDoodads.frameCount() / 60, (d.x || 0) + (d.y || 0));
        const pos = this.screenPosition();
        const sx = d.scaleX !== undefined ? d.scaleX : 1;
        const sy = d.scaleY !== undefined ? d.scaleY : 1;

        this.anchor.x = d.anchorX !== undefined ? d.anchorX : 0.5;
        this.anchor.y = d.anchorY !== undefined ? d.anchorY : 1.0;
        this.x = pos.x;
        this.y = pos.y + motion.offsetY;
        this.scale.x = sx * motion.scaleMul;
        this.scale.y = sy * motion.scaleMul;
        this.skew.x = motion.skewX;
        this.rotation = (d.rotation || 0) * Math.PI / 180 + this._spin;
        this.z = DocsDoodads.Depth.spriteZ(d);
        this._docsSortY = pos.y + (DocsDoodads.Depth.baseY(d) - d.y);

        let visible = true;
        let dim = 1;
        let fx = null;
        if (editing) {
            visible = !d.editorHidden;
            this._transitionP = null;
            // Conditional doodads stay editable but look faded while their condition is false.
            if (visible && DocsDoodads.Appearance.isConditional(d) && !DocsDoodads.Appearance.isVisible(d, {})) dim = 0.45;
        } else {
            const shown = DocsDoodads.Appearance.isConditional(d) ? DocsDoodads.Appearance.isVisible(d, {}) : true;
            const type = d.transition && d.transition.type;
            if (type && type !== 'none') {
                const frames = d.transition.frames !== undefined ? d.transition.frames : DocsDoodads.Transition.defaults.frames;
                // The first frame starts settled, so maps never open mid-transition.
                if (this._transitionP === null || this._transitionP === undefined) this._transitionP = shown ? 1 : 0;
                this._transitionP = DocsDoodads.Transition.advance(this._transitionP, shown, frames);
                fx = DocsDoodads.Transition.sample(type, this._transitionP);
                visible = this._transitionP > 0;
            } else {
                this._transitionP = null;
                visible = shown;
            }
        }
        if (fx) {
            this.y += fx.offsetY;
            this.scale.x *= fx.scaleMul;
            this.scale.y *= fx.scaleMul;
        }
        this._transitionAlpha = fx ? fx.alphaMul : 1;
        const layerSettings = DocsDoodads.Lighting.mapSettings(typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0);
        if (!(editing ? DocsDoodads.Layers.visibleInEditor(d, layerSettings) : DocsDoodads.Layers.visibleInGame(d, layerSettings))) visible = false;
        this.visible = visible;
        this.alpha = (d.opacity !== undefined ? d.opacity : 1) * motion.alphaMul * dim * this._transitionAlpha * this.updateSeeThrough(editing);

        this.refreshAppearance();
        this.updateDissolve(fx);
        if (this._shimmerFilter) {
            this._shimmerFilter.uniforms.time = DocsDoodads.frameCount() / 60;
        }
        this.updateShadow();
    };

    // Screen rectangle of the drawn frame.
    Sprite_DocsDoodad.prototype.screenRect = function() {
        const d = this._data;
        const w = (d.frameW || (this.texture ? this.texture.frame.width : 48)) * Math.abs(this.scale.x);
        const h = (d.frameH || (this.texture ? this.texture.frame.height : 48)) * Math.abs(this.scale.y);
        return { x: this.x - this.anchor.x * w, y: this.y - this.anchor.y * h, w, h };
    };

    // Fades a tall doodad while the player is hidden behind it (and flags the player for the silhouette).
    Sprite_DocsDoodad.prototype.updateSeeThrough = function(editing) {
        const settings = DocsDoodads.World.settings().seeThrough;
        const th = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        let target = 1;
        if (!editing && this.visible !== false && DocsDoodads.Atmosphere.featureOn('seeThrough') && DocsDoodads.SeeThrough.appliesTo(this._data, settings, th)) {
            const player = DocsDoodads.Atmosphere._playerRect;
            if (player && DocsDoodads.SeeThrough.occludes(this.screenRect(), this._docsSortY, DocsDoodads.Depth.resolve(this._data), player, player.baseY)) {
                DocsDoodads.Atmosphere._playerHidden = true;
                if (settings.mode !== 'silhouette') target = Math.max(0.05, Math.min(1, Number(settings.opacity)));
            }
        }
        const current = this._seeAlpha !== undefined ? this._seeAlpha : 1;
        this._seeAlpha = DocsDoodads.SeeThrough.step(current, target, settings.speed);
        return this._seeAlpha;
    };

    // Dissolve and crumble transitions add a noise filter only while they run.
    Sprite_DocsDoodad.prototype.updateDissolve = function(fx) {
        const active = Boolean(fx && fx.dissolve > 0 && fx.dissolve < 1);
        const filters = this.filters ? this.filters.slice() : [];
        const index = this._dissolveFilter ? filters.indexOf(this._dissolveFilter) : -1;
        if (!active) {
            if (index >= 0) {
                filters.splice(index, 1);
                this.filters = filters.length ? filters : null;
            }
            return;
        }
        if (!this._dissolveFilter) {
            try {
                this._dissolveFilter = new PIXI.Filter(undefined, DocsDoodads.Transition.dissolveFragment, { uAmount: 0, uBlock: 1, uFall: 0 });
                this._dissolveFilter.padding = 12;
            } catch (error) {
                return;
            }
        }
        const crumble = this._data.transition && this._data.transition.type === 'crumble';
        this._dissolveFilter.uniforms.uAmount = fx.dissolve;
        this._dissolveFilter.uniforms.uBlock = crumble ? 4 : 1;
        this._dissolveFilter.uniforms.uFall = crumble ? 10 : 0;
        if (index < 0) {
            filters.push(this._dissolveFilter);
            this.filters = filters;
        }
    };

    // Rebuilds the filter stack only when tint, hue, blur, blend or shimmer settings change.
    Sprite_DocsDoodad.prototype.refreshAppearance = function() {
        const d = this._data;
        const sig = DocsDoodads.Appearance.signature(d);
        if (sig === this._appearanceSig) return;
        this._appearanceSig = sig;
        this.blendMode = DocsDoodads.Appearance.blendMode(d);
        const filters = [];
        try {
            if (DocsDoodads.Appearance.needsColorFilter(d)) {
                const tone = [Number(d.r) || 0, Number(d.g) || 0, Number(d.b) || 0, Number(d.grey) || 0];
                if (typeof ColorFilter !== 'undefined') {
                    const filter = new ColorFilter();
                    filter.setColorTone(tone);
                    filter.setHue(Number(d.hue) || 0);
                    filters.push(filter);
                } else if (typeof ToneFilter !== 'undefined') {
                    const filter = new ToneFilter();
                    filter.adjustHue(Number(d.hue) || 0);
                    filter.adjustTone(tone[0], tone[1], tone[2]);
                    filter.adjustSaturation(-tone[3]);
                    filters.push(filter);
                }
            }
            if (Number(d.blur) > 0 && PIXI.filters && PIXI.filters.BlurFilter) {
                filters.push(new PIXI.filters.BlurFilter(Math.min(20, Number(d.blur))));
            }
            if ((Number(d.contrast) > 0 || d.sepia || d.bright) && PIXI.filters && PIXI.filters.ColorMatrixFilter) {
                const matrix = new PIXI.filters.ColorMatrixFilter();
                let multiply = false;
                if (Number(d.contrast) > 0) { matrix.contrast(Number(d.contrast) * 0.01, multiply); multiply = true; }
                if (d.sepia) { matrix.sepia(multiply); multiply = true; }
                if (d.bright) { matrix.brightness(1.6, multiply); multiply = true; }
                filters.push(matrix);
            }
            this._shimmerFilter = null;
            if (d.motion && d.motion.type === 'shimmer' && PIXI.Filter) {
                const motion = DocsDoodads.Motion.normalize(d.motion);
                const shimmer = new PIXI.Filter(undefined, DocsDoodads.Motion.shimmerFragment, { time: 0, amount: motion.amount });
                shimmer.padding = 4;
                this._shimmerFilter = shimmer;
                filters.push(shimmer);
            }
        } catch (error) {
            DocsDoodads.Core.log('Doodad filters could not be built; drawing without them.', error);
        }
        this.filters = filters.length > 0 ? filters : null;
    };

    // The shadow is a black silhouette sprite beside the doodad in the same tilemap.
    Sprite_DocsDoodad.prototype.updateShadow = function() {
        const followSun = this._data.shadow && this._data.shadow.followSun;
        const t = DocsDoodads.Shadow.transform(this._data, followSun ? DocsDoodads.Atmosphere.sun() : null);
        if (!t) {
            this.destroyShadow();
            return;
        }
        if (!this.parent) return;
        let shadow = this._shadowSprite;
        if (!shadow) {
            shadow = this._shadowSprite = new PIXI.Sprite(this.texture);
            shadow.tint = 0x000000;
            shadow.spriteId = this.spriteId;
            this.parent.addChild(shadow);
        }
        if (shadow.parent !== this.parent) this.parent.addChild(shadow);
        shadow.texture = this.texture;
        shadow.anchor.x = this.anchor.x;
        // Sun shadows pivot on the doodad's base so they lie along the ground.
        shadow.anchor.y = t.followsSun ? 1 : this.anchor.y;
        const pos = this.screenPosition();
        const d = this._data;
        const baseShift = t.followsSun
            ? (d.frameH || this.texture.frame.height) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1) * (1 - this.anchor.y) : 0;
        shadow.x = pos.x + t.offsetX;
        shadow.y = pos.y + baseShift + t.offsetY;
        shadow.scale.x = t.scaleX;
        shadow.scale.y = t.scaleY;
        shadow.skew.x = t.followsSun ? 0 : t.skewX + this.skew.x;
        shadow.rotation = t.rotation || 0;
        shadow.alpha = t.alpha * (this._transitionAlpha !== undefined ? this._transitionAlpha : 1);
        shadow.z = DocsDoodads.Depth.shadowZ;
        shadow._docsSortY = shadow.y;
        shadow.visible = this.visible;
        if (shadow._docsBlur !== t.blur) {
            shadow._docsBlur = t.blur;
            shadow.filters = t.blur > 0 && PIXI.filters && PIXI.filters.BlurFilter ? [new PIXI.filters.BlurFilter(Math.min(16, t.blur))] : null;
        }
    };

    Sprite_DocsDoodad.prototype.destroyShadow = function() {
        if (!this._shadowSprite) return;
        if (this._shadowSprite.parent) this._shadowSprite.parent.removeChild(this._shadowSprite);
        this._shadowSprite.destroy();
        this._shadowSprite = null;
    };

    Sprite_DocsDoodad.prototype.updateFrameAnimation = function() {
        if (!this._bmp || !this._bmp._baseTexture) return;
        const total = (this._data.xFrame || 1) * (this._data.yFrame || 1);
        this._currentFrame = (this._currentFrame + 1) % total;
        const xF = this._data.xFrame || 1;
        const col = this._currentFrame % xF;
        const row = Math.floor(this._currentFrame / xF);
        const fw = this._data.frameW || 32;
        const fh = this._data.frameH || 32;
        const startX = this._regionOrigin ? this._regionOrigin.x : (this._data.frameX || 0);
        const startY = this._regionOrigin ? this._regionOrigin.y : (this._data.frameY || 0);
        const frame = DocsDoodads.safeFrame({ x: startX + col * fw, y: startY + row * fh, w: fw, h: fh }, this._bmp.width, this._bmp.height);
        this.texture.frame = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
    };
}

//==========================================================
// SECTION 7: SPRITESET_MAP DOODAD LAYER HOOKS
//==========================================================
// Doodads with a base line need the tilemap's z/y sort; plain sprites keep MZ's default order.
if (typeof Tilemap !== 'undefined' && Tilemap.prototype._compareChildOrder) {
    $.Tilemap__compareChildOrder = Tilemap.prototype._compareChildOrder;
    Tilemap.prototype._compareChildOrder = function(a, b) {
        if (a._docsSortY === undefined && b._docsSortY === undefined) return $.Tilemap__compareChildOrder.call(this, a, b);
        return DocsDoodads.Depth.compareChildren(a, b);
    };
}

if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_createLowerLayer = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        $.Spriteset_Map_createLowerLayer.call(this);
        this.createDocsDoodadsLayer();
        this.createDocsLighting();
    };

    Spriteset_Map.prototype.createDocsDoodadsLayer = function() {
        this._docsDoodadSprites = [];
        // Sprites go into the tilemap with the characters; a plain container is the fallback.
        if (this._tilemap && typeof this._tilemap.addChild === 'function') {
            this._docsDoodadsContainer = this._tilemap;
        } else {
            this._docsDoodadsContainer = new PIXI.Container();
            this._baseSprite.addChild(this._docsDoodadsContainer);
        }
        this.addDocsDoodads();
    };

    Spriteset_Map.prototype.removeDocsDoodadSprites = function() {
        for (const sprite of this._docsDoodadSprites || []) {
            sprite.destroyShadow();
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy();
        }
        this._docsDoodadSprites = [];
    };

    Spriteset_Map.prototype.addDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        this.removeDocsDoodadSprites();
        const list = DocsDoodads.doodads();
        for (const data of list) {
            if (!data) continue;
            const spr = new Sprite_DocsDoodad(data, this);
            this._docsDoodadsContainer.addChild(spr);
            this._docsDoodadSprites.push(spr);
        }
        this.sortDocsDoodads();
    };

    Spriteset_Map.prototype.sortDocsDoodads = function() {
        if (!this._docsDoodadsContainer) return;
        for (const sprite of this._docsDoodadSprites || []) sprite.updatePlacement();
        // The tilemap re-sorts itself every frame; the fallback container needs an explicit sort.
        if (this._docsDoodadsContainer !== this._tilemap) {
            this._docsDoodadsContainer.children.sort(DocsDoodads.Depth.compareChildren);
        }
    };

    $.Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        this.captureDocsPlayer();
        $.Spriteset_Map_update.call(this);
        if (this._docsDoodadSprites) {
            for (let i = 0; i < this._docsDoodadSprites.length; i++) {
                this._docsDoodadSprites[i].update();
            }
        }
        this.updateDocsLighting();
        this.updateDocsReflections();
        this.updateDocsSilhouette();
        this.updateDocsEditorOverlay();
    };

    Spriteset_Map.prototype.docsPlayerSprite = function() {
        if (typeof $gamePlayer === 'undefined' || !this._characterSprites) return null;
        if (!this._docsPlayerSprite || this._docsPlayerSprite._character !== $gamePlayer) {
            this._docsPlayerSprite = this._characterSprites.find(s => s._character === $gamePlayer) || null;
        }
        return this._docsPlayerSprite;
    };

    // Where the player was drawn last frame, for see-through. Doodads flag _playerHidden as they update.
    Spriteset_Map.prototype.captureDocsPlayer = function() {
        const Atmosphere = DocsDoodads.Atmosphere;
        Atmosphere._playerHidden = false;
        Atmosphere._playerRect = null;
        const sprite = this.docsPlayerSprite();
        if (!sprite || !sprite.visible || !sprite._docsFrame) return;
        const w = sprite._docsFrame.w * Math.abs(sprite.scale.x), h = sprite._docsFrame.h * Math.abs(sprite.scale.y);
        Atmosphere._playerRect = { x: sprite.x - w * 0.5, y: sprite.y - h, w, h, baseY: sprite.y };
    };

    // Water reflections: mirrored copies of characters and doodads, masked to water tiles, with a ripple.
    Spriteset_Map.prototype.updateDocsReflections = function() {
        if (typeof $gameMap === 'undefined' || !$gameMap || !this._tilemap || typeof PIXI === 'undefined') return;
        const settings = DocsDoodads.World.settings().reflections;
        const on = DocsDoodads.Atmosphere.featureOn('reflections')
            && DocsDoodads.Reflection.mapEnabled(settings, DocsDoodads.Lighting.mapSettings($gameMap.mapId()));
        if (!on) {
            if (this._docsReflectLayer) this._docsReflectLayer.visible = false;
            return;
        }
        let layer = this._docsReflectLayer;
        if (!layer) {
            layer = this._docsReflectLayer = new PIXI.Container();
            layer.z = 0.2;
            layer._docsSortY = -1e9;
            layer._docsMask = new PIXI.Graphics();
            layer.addChild(layer._docsMask);
            layer.mask = layer._docsMask;
            layer._docsPool = [];
            try {
                layer._docsRipple = new PIXI.Filter(undefined, DocsDoodads.Motion.shimmerFragment, { time: 0, amount: 0.5 });
                layer._docsRipple.padding = 4;
                layer.filters = [layer._docsRipple];
            } catch (error) {
                layer._docsRipple = null;
            }
        }
        if (layer.parent !== this._tilemap) this._tilemap.addChild(layer);
        const water = this.updateDocsWaterMask(layer, settings);
        layer.visible = water;
        if (!water) return;
        if (layer._docsRipple) {
            layer._docsRipple.uniforms.time = DocsDoodads.frameCount() / 60;
            layer._docsRipple.uniforms.amount = Math.max(0, Math.min(1, Number(settings.ripple) || 0));
        }

        const sources = [];
        for (const sprite of this._characterSprites || []) {
            const ch = sprite._character;
            if (!sprite.visible || !sprite._docsFrameTexture || !ch) continue;
            if (DocsDoodads.CharacterTags.forCharacter(ch).reflect === false) continue;
            const jump = typeof ch.jumpHeight === 'function' ? ch.jumpHeight() : 0;
            const at = { x: sprite.x, y: sprite.y + jump * 2, sy: sprite.scale.y, anchorX: 0.5, alpha: sprite.opacity / 255, rotation: 0 };
            // Gear layers reflect too, behind and in front of the body.
            const gear = (sprite._docsVisualSprites || []).filter(l => l.visible);
            const layer = l => {
                const texture = sprite.docsVisualTexture(l);
                if (texture) sources.push(Object.assign({}, at, { texture, sx: l.scale.x, tint: l.tint }));
            };
            gear.filter(l => l._docsZ < 0).sort((a, b) => a._docsOrder - b._docsOrder).forEach(layer);
            sources.push(Object.assign({}, at, { texture: sprite._docsFrameTexture, sx: sprite.scale.x }));
            gear.filter(l => l._docsZ >= 0).sort((a, b) => a._docsOrder - b._docsOrder).forEach(layer);
        }
        for (const sprite of this._docsDoodadSprites || []) {
            const d = sprite._data;
            if (!sprite.visible || !sprite.texture || !sprite.texture.valid || !DocsDoodads.Reflection.appliesTo(d, settings)) continue;
            const h = sprite.texture.frame.height * Math.abs(sprite.scale.y);
            sources.push({ texture: sprite.texture, x: sprite.x, y: sprite.y + h * (1 - sprite.anchor.y), sx: sprite.scale.x, sy: Math.abs(sprite.scale.y),
                anchorX: sprite.anchor.x, alpha: sprite.alpha, rotation: -sprite.rotation });
        }
        const pool = layer._docsPool;
        while (pool.length < sources.length) {
            const s = new PIXI.Sprite(PIXI.Texture.EMPTY);
            layer.addChild(s);
            pool.push(s);
        }
        const opacity = Math.max(0, Math.min(1, Number(settings.opacity) || 0));
        pool.forEach((s, i) => {
            const src = sources[i];
            s.visible = Boolean(src);
            if (!src) return;
            s.texture = src.texture;
            s.anchor.set(src.anchorX, 1);
            s.x = src.x;
            s.y = src.y;
            s.scale.set(src.sx, -src.sy);
            s.rotation = src.rotation;
            s.alpha = src.alpha * opacity;
            s.tint = src.tint !== undefined ? src.tint : 0xffffff;
        });
    };

    // Rebuilds the water mask when the camera moves; false when no water is on screen.
    Spriteset_Map.prototype.updateDocsWaterMask = function(layer, settings) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const key = [$gameMap.mapId(), $gameMap.displayX(), $gameMap.displayY(), settings.regionId, settings.shoreInset, Math.floor(DocsDoodads.frameCount() / 30)].join('|');
        if (layer._docsMaskKey === key) return layer._docsHasWater;
        layer._docsMaskKey = key;
        const ox = Math.floor($gameMap.displayX()), oy = Math.floor($gameMap.displayY());
        const fx = ($gameMap.displayX() - ox) * tw, fy = ($gameMap.displayY() - oy) * th;
        const width = typeof Graphics !== 'undefined' ? Graphics.width : 816;
        const height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        const cols = Math.ceil(width / tw) + 1, rows = Math.ceil(height / th) + 1;
        const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
        const rects = DocsDoodads.Reflection.maskRects(cols, rows, (c, r) => {
            const x = $gameMap.roundX(ox + c), y = $gameMap.roundY(oy + r);
            if (!$gameMap.isValid(x, y)) return false;
            const layers = [0, 1, 2, 3].map(z => $gameMap.tileId(x, y, z));
            return DocsDoodads.Reflection.isWaterAt(layers, $gameMap.regionId(x, y), settings, isWaterTile);
        }, tw, th, settings.shoreInset);
        const g = layer._docsMask;
        g.clear();
        g.beginFill(0xffffff, 1);
        for (const rect of rects) g.drawRect(rect.x - fx, rect.y - fy, rect.w, rect.h);
        g.endFill();
        layer._docsHasWater = rects.length > 0;
        return layer._docsHasWater;
    };

    // The player drawn as a tinted outline above everything while hidden behind a doodad.
    Spriteset_Map.prototype.updateDocsSilhouette = function() {
        if (!this._baseSprite || typeof PIXI === 'undefined') return;
        const settings = DocsDoodads.World.settings().seeThrough;
        const sprite = this.docsPlayerSprite();
        const show = DocsDoodads.Atmosphere._playerHidden && settings.mode !== 'fade' && sprite && sprite._docsFrameTexture
            && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        let ghost = this._docsSilhouette;
        if (!show) {
            if (ghost) ghost.visible = false;
            return;
        }
        if (!ghost) {
            ghost = this._docsSilhouette = new PIXI.Sprite(PIXI.Texture.EMPTY);
            ghost.anchor.set(0.5, 1);
            try {
                ghost._docsFilter = new PIXI.Filter(undefined, DocsDoodads.SeeThrough.silhouetteFragment, { uColor: [0.5, 0.8, 1], uAlpha: 0.55 });
                ghost.filters = [ghost._docsFilter];
            } catch (error) {
                ghost.tint = 0x7dd3fc;
                ghost.alpha = 0.5;
            }
        }
        if (ghost.parent !== this._baseSprite) this._baseSprite.addChild(ghost);
        const parent = ghost.parent;
        if (this._tilemap && parent.children.indexOf(ghost) < parent.children.indexOf(this._tilemap)) parent.addChild(ghost);
        if (ghost._docsFilter) ghost._docsFilter.uniforms.uColor = DocsDoodads.Lighting.channels(settings.silhouetteColor);
        ghost.texture = sprite._docsFrameTexture;
        ghost.x = sprite.x;
        ghost.y = sprite.y;
        ghost.scale.set(sprite.scale.x, sprite.scale.y);
        ghost.visible = true;
    };

    // Lighting: a lightmap (ambient colour plus additive lights) is rendered off-screen and
    // multiplied over the tilemap, under weather and pictures. Glows add a halo in daylight too.
    Spriteset_Map.prototype.createDocsLighting = function() {
        if (typeof PIXI === 'undefined' || !PIXI.RenderTexture || !this._baseSprite) return;
        this._docsLightScene = new PIXI.Container();
        this._docsLightBase = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._docsLightScene.addChild(this._docsLightBase);
        this._docsLightSprites = [];
        this._docsGlowLayer = new PIXI.Container();
        this._docsGlowSprites = [];
        this._docsLightOverlay = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this._docsLightOverlay.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this._docsLightOverlay.visible = false;
        this._baseSprite.addChild(this._docsLightOverlay);
        this._baseSprite.addChild(this._docsGlowLayer);
    };

    Spriteset_Map.prototype.docsLightTexture = function() {
        if (!DocsDoodads._lightGradient && typeof document !== 'undefined') {
            const size = 128;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
            DocsDoodads._lightGradient = PIXI.Texture.from(canvas);
        }
        return DocsDoodads._lightGradient;
    };

    Spriteset_Map.prototype.docsSpritePool = function(pool, layer, count) {
        while (pool.length < count) {
            const sprite = new PIXI.Sprite(this.docsLightTexture());
            sprite.anchor.set(0.5, 0.5);
            sprite.blendMode = PIXI.BLEND_MODES.ADD;
            layer.addChild(sprite);
            pool.push(sprite);
        }
        for (let i = 0; i < pool.length; i++) pool[i].visible = i < count;
    };

    Spriteset_Map.prototype.updateDocsLighting = function() {
        if (!this._docsLightOverlay || typeof $gameMap === 'undefined' || !$gameMap) return;
        const Lighting = DocsDoodads.Lighting;
        const workspace = DocsDoodads.Workspace;
        const fade = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsAmbientFade : null;
        if (fade) {
            Lighting.stepFade(fade);
            if (fade.framesLeft <= 0 && fade.clearWhenDone) $gameSystem._docsAmbientFade = null;
        }
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        const world = DocsDoodads.World.settings();
        let ambient = Lighting.resolveAmbient({ world, minutes: DocsDoodads.Atmosphere.minutes(), mapSettings: Lighting.mapSettings($gameMap.mapId()),
            override: fade ? fade.current : null, switchValue });
        if (workspace.mounted && workspace.lightingPreview === false) ambient = { darkness: 0, color: '#000000' };

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const visibleData = (this._docsDoodadSprites || []).filter(s => s.visible).map(s => s._data);
        const lights = Lighting.collect(visibleData, (x, y) => DocsDoodads.mapToScreen(x, y),
            { darkness: ambient.darkness, threshold: world.time.lampThreshold, step: 1 / 30 });
        const time = DocsDoodads.frameCount() / 60;

        const glowing = lights.filter(l => l.glow > 0);
        this.docsSpritePool(this._docsGlowSprites, this._docsGlowLayer, glowing.length);
        glowing.forEach((l, i) => {
            const s = this._docsGlowSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.glow * l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });

        const renderer = DocsDoodads.Compat.getRenderer();
        if (ambient.darkness <= 0.001 || !renderer) {
            this._docsLightOverlay.visible = false;
            return;
        }
        const w = typeof Graphics !== 'undefined' ? Graphics.width : 816;
        const h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
        if (!this._docsLightTexture || this._docsLightTexture.width !== w || this._docsLightTexture.height !== h) {
            if (this._docsLightTexture) this._docsLightTexture.destroy(true);
            this._docsLightTexture = PIXI.RenderTexture.create({ width: w, height: h });
            this._docsLightOverlay.texture = this._docsLightTexture;
        }
        const base = Lighting.lightmapBase(ambient);
        this._docsLightBase.width = w;
        this._docsLightBase.height = h;
        this._docsLightBase.tint = (Math.round(base[0] * 255) << 16) | (Math.round(base[1] * 255) << 8) | Math.round(base[2] * 255);
        this.docsSpritePool(this._docsLightSprites, this._docsLightScene, lights.length);
        lights.forEach((l, i) => {
            const s = this._docsLightSprites[i];
            s.x = l.x; s.y = l.y;
            s.scale.set((l.radius * 2) / 128);
            s.tint = l.color;
            s.alpha = l.intensity * Lighting.flicker(time, l.seed, l.flicker);
        });
        renderer.render(this._docsLightScene, this._docsLightTexture, true);
        this._docsLightOverlay.visible = true;
        // Keep the lightmap directly above the tilemap and doodads after layers are rebuilt.
        const parent = this._docsLightOverlay.parent;
        if (parent && this._tilemap && parent.children.indexOf(this._docsLightOverlay) < parent.children.indexOf(this._tilemap)) {
            parent.addChild(this._docsLightOverlay);
            parent.addChild(this._docsGlowLayer);
        }
    };

    // Editor-only overlay above the doodad layer: placement grid, selection outlines and guides.
    Spriteset_Map.prototype.updateDocsEditorOverlay = function() {
        if (!this._docsDoodadsContainer || typeof PIXI === 'undefined' || !PIXI.Graphics) return;
        if (!this._docsSelectionOutline) {
            this._docsSelectionOutline = new PIXI.Graphics();
            this._baseSprite.addChild(this._docsSelectionOutline);
        }
        const outline = this._docsSelectionOutline;
        outline.clear();
        if (!DocsDoodads.Workspace.mounted) return;
        // Keep the outline above the doodad layer even after the layer is rebuilt.
        if (outline.parent && outline.parent.children[outline.parent.children.length - 1] !== outline) {
            outline.parent.addChild(outline);
        }
        const workspace = DocsDoodads.Workspace;
        if (workspace.gridSnapShow) {
            const width = typeof Graphics !== 'undefined' ? Graphics.width : 816;
            const height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            const grid = workspace.placementGridLines(width, height);
            outline.lineStyle(1, 0xffffff, 0.25);
            for (const x of grid.xs) { outline.moveTo(x, 0); outline.lineTo(x, height); }
            for (const y of grid.ys) { outline.moveTo(0, y); outline.lineTo(width, y); }
        }
        for (const rect of workspace.selectionScreenRects()) {
            outline.lineStyle(2, 0x38bdf8, 1);
            outline.drawRect(rect.x, rect.y, rect.w, rect.h);
        }
        if (typeof workspace.drawEditorOverlayExtras === 'function') workspace.drawEditorOverlayExtras(outline);
    };
}

// "Set Ambient Light" / "Reset Ambient Light" plugin commands fade the map's darkness.
DocsDoodads.setAmbient = function(target, frames, clearWhenDone) {
    if (typeof $gameSystem === 'undefined' || !$gameSystem || typeof $gameMap === 'undefined' || !$gameMap) return null;
    const Lighting = DocsDoodads.Lighting;
    const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
    const current = $gameSystem._docsAmbientFade ? $gameSystem._docsAmbientFade.current
        : DocsDoodads.currentAmbient(switchValue);
    const fade = Lighting.startFade(current, target, frames);
    fade.clearWhenDone = Boolean(clearWhenDone);
    $gameSystem._docsAmbientFade = fade;
    return fade;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setAmbient', args => {
        DocsDoodads.setAmbient({
            darkness: Math.max(0, Math.min(100, Number(args.darkness) || 0)) / 100,
            color: args.color || DocsDoodads.Lighting.ambientDefaults.color
        }, Number(args.duration) || 0, false);
    });
    PluginManager.registerCommand(pluginName, 'resetAmbient', args => {
        const switchValue = id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false);
        DocsDoodads.setAmbient(DocsDoodads.currentAmbient(switchValue), Number(args.duration) || 0, true);
    });

    // Time of day, seasons and effect switches.
    PluginManager.registerCommand(pluginName, 'setTime', args => {
        DocsDoodads.setTimeOfDay((Number(args.hour) || 0) * 60 + (Number(args.minute) || 0));
    });
    PluginManager.registerCommand(pluginName, 'addTime', args => {
        const now = DocsDoodads.Atmosphere.minutes();
        DocsDoodads.setTimeOfDay((now === null ? 0 : now) + (Number(args.hours) || 0) * 60 + (Number(args.minutes) || 0));
    });
    PluginManager.registerCommand(pluginName, 'clockControl', args => {
        const clock = DocsDoodads.Atmosphere.clock();
        if (!clock) return;
        if (args.action === 'pause') clock.paused = true;
        else if (args.action === 'resume') clock.paused = false;
        else if (args.action === 'speed') clock.speed = Math.max(0, Number(args.speed) || 0);
        else if (args.action === 'defaultSpeed') clock.speed = null;
    });
    PluginManager.registerCommand(pluginName, 'setSeason', args => {
        DocsDoodads.setSeason(Number(args.season) || 0);
    });
    PluginManager.registerCommand(pluginName, 'setFeature', args => {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return;
        const off = $gameSystem._docsFeatureOff = $gameSystem._docsFeatureOff || {};
        if (String(args.enabled) === 'false') off[args.feature] = true;
        else delete off[args.feature];
    });
}

// The ambient the map has right now without any plugin-command fade.
DocsDoodads.currentAmbient = function(switchValue) {
    const Lighting = DocsDoodads.Lighting;
    return Lighting.resolveAmbient({ world: DocsDoodads.World.settings(), minutes: DocsDoodads.Atmosphere.minutes(),
        mapSettings: Lighting.mapSettings($gameMap.mapId()), switchValue });
};

// Variable mode writes the variables; otherwise the running clock jumps.
DocsDoodads.setTimeOfDay = function(minutes) {
    const Time = DocsDoodads.TimeOfDay;
    const world = DocsDoodads.World.settings();
    const m = Time.wrap(minutes);
    if (world.time.source === 'variable' && typeof $gameVariables !== 'undefined' && $gameVariables) {
        if (Number(world.time.variableId) > 0) $gameVariables.setValue(Number(world.time.variableId), Math.floor(m / 60));
        if (Number(world.time.minuteVariableId) > 0) $gameVariables.setValue(Number(world.time.minuteVariableId), Math.floor(m % 60));
        return;
    }
    const clock = DocsDoodads.Atmosphere.clock();
    if (!clock) return;
    if (m < clock.minutes) clock.day = (clock.day || 0) + 1;
    clock.minutes = m;
    Time.syncVariables(world, m, (id, value) => { if ($gameVariables.value(id) !== value) $gameVariables.setValue(id, value); });
};

DocsDoodads.setSeason = function(season) {
    const settings = DocsDoodads.World.settings().seasons;
    if (settings.source === 'variable' && Number(settings.variableId) > 0 && typeof $gameVariables !== 'undefined' && $gameVariables) {
        $gameVariables.setValue(Number(settings.variableId), season);
    } else if (typeof $gameSystem !== 'undefined' && $gameSystem) {
        $gameSystem._docsSeason = season;
    }
};

// The clock moves with the map.
if (typeof Game_Map !== 'undefined') {
    $.Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        $.Game_Map_update.call(this, sceneActive);
        DocsDoodads.Atmosphere.update(sceneActive);
    };
}

// Players and events: sun shadows shaped like the sprite, and motion blur.
if (typeof Sprite_Character !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        $.Sprite_Character_update.call(this);
        this.updateDocsCharacterFx();
    };

    Sprite_Character.prototype.updateDocsCharacterFx = function() {
        const ch = this._character;
        if (!ch || typeof $gameMap === 'undefined' || !$gameMap) return;
        this.updateDocsFrameTexture();
        const world = DocsDoodads.World.settings();
        const isVehicle = typeof Game_Vehicle !== 'undefined' && ch instanceof Game_Vehicle;
        const playerLike = (typeof Game_Player !== 'undefined' && ch instanceof Game_Player)
            || (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower);
        const tags = DocsDoodads.CharacterTags.forCharacter(ch);
        const mapSettings = DocsDoodads.Lighting.mapSettings($gameMap.mapId());
        const hasImage = Boolean(this._docsFrameTexture) && this.visible && !(ch.isTransparent && ch.isTransparent())
            && Boolean((ch.characterName && ch.characterName()) || (ch.tileId && ch.tileId() > 0));
        const castShadow = !isVehicle && Boolean(this.parent) && DocsDoodads.Atmosphere.featureOn('characterShadows')
            && !(mapSettings && mapSettings.characterShadows === false)
            && DocsDoodads.CharacterShadow.enabledFor(world.characterShadows, tags, { playerLike, priorityType: ch._priorityType, hasImage });
        if (castShadow) this.updateDocsShadow(world.characterShadows, tags);
        else if (this._docsShadow) this._docsShadow.visible = false;
        this.updateDocsMotionBlur(world.motionBlur, tags, playerLike && !isVehicle);
    };

    // A texture for the whole current frame (the main sprite's frame is empty in tall grass).
    Sprite_Character.prototype.updateDocsFrameTexture = function() {
        const bitmap = this.bitmap;
        const frame = bitmap && bitmap.isReady() ? DocsDoodads.CharacterShadow.frameFor(this) : null;
        const base = bitmap ? (bitmap.baseTexture || bitmap._baseTexture) : null;
        if (!frame || !base) {
            this._docsFrame = null;
            this._docsFrameTexture = null;
            return;
        }
        const last = this._docsFrame;
        if (this._docsFrameTexture && last && this._docsFrameBase === base
            && last.x === frame.x && last.y === frame.y && last.w === frame.w && last.h === frame.h) return;
        const safe = DocsDoodads.safeFrame(frame, bitmap.width, bitmap.height);
        this._docsFrame = frame;
        this._docsFrameBase = base;
        this._docsFrameTexture = new PIXI.Texture(base, new PIXI.Rectangle(safe.x, safe.y, safe.w, safe.h));
    };

    Sprite_Character.prototype.updateDocsShadow = function(settings, tags) {
        let shadow = this._docsShadow;
        if (!shadow) {
            shadow = this._docsShadow = new PIXI.Sprite(PIXI.Texture.EMPTY);
            shadow.anchor.set(0.5, 1);
            shadow.tint = 0x000000;
            shadow.spriteId = this.spriteId;
        }
        if (shadow.parent !== this.parent) this.parent.addChild(shadow);
        const sun = DocsDoodads.Atmosphere.sun();
        const t = DocsDoodads.Sun.transform(sun, DocsDoodads.CharacterShadow.styleFor(settings, tags));
        const ch = this._character;
        const jump = typeof ch.jumpHeight === 'function' ? ch.jumpHeight() : 0;
        const footX = this.x + t.offsetX;
        const footY = this.y + jump + t.offsetY;
        let scaleY = t.scaleY;
        const regions = (settings.occlusionRegions || []).map(Number).filter(n => n > 0);
        if (regions.length > 0 && this._docsFrame) {
            const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
            const blocked = (x, y) => {
                const at = DocsDoodads.screenToMap(x, y);
                return regions.includes($gameMap.regionId(Math.floor(at.x / tw), Math.floor(at.y / th)));
            };
            const full = this._docsFrame.h * scaleY;
            scaleY = DocsDoodads.CharacterShadow.clipLength(footX, footY, sun.angle, full, blocked) / this._docsFrame.h;
        }
        shadow.texture = this._docsFrameTexture;
        shadow.x = footX;
        shadow.y = footY;
        shadow.rotation = t.rotation;
        shadow.scale.set(this.scale.x, scaleY * this.scale.y);
        shadow.alpha = t.alpha * (this.opacity / 255);
        shadow.visible = scaleY > 0.02 && shadow.alpha > 0.005;
        shadow.z = DocsDoodads.Depth.shadowZ;
        shadow._docsSortY = footY;
        if (shadow._docsBlur !== t.blur) {
            shadow._docsBlur = t.blur;
            shadow.filters = t.blur > 0 && PIXI.filters && PIXI.filters.BlurFilter ? [new PIXI.filters.BlurFilter(Math.min(16, t.blur))] : null;
        }
    };

    Sprite_Character.prototype.updateDocsMotionBlur = function(settings, tags, playerLike) {
        const ch = this._character;
        const optionOn = typeof ConfigManager === 'undefined' || ConfigManager.docsMotionBlur !== false;
        const enabled = DocsDoodads.Atmosphere.featureOn('motionBlur') && DocsDoodads.MotionBlur.enabledFor(settings, tags, playerLike, optionOn)
            && !(DocsDoodads.Workspace && DocsDoodads.Workspace.mounted);
        const real = { x: ch._realX, y: ch._realY };
        let target = { x: 0, y: 0 };
        if (enabled && this._docsLastReal) {
            target = DocsDoodads.MotionBlur.target(real.x - this._docsLastReal.x, real.y - this._docsLastReal.y,
                $gameMap.tileWidth(), $gameMap.tileHeight(), settings.strength);
        }
        this._docsLastReal = real;
        const blur = this._docsBlurVector = DocsDoodads.MotionBlur.step(this._docsBlurVector || { x: 0, y: 0 }, target, 0.5);
        const active = blur.x !== 0 || blur.y !== 0;
        // MZ replaces the filter list when it adds its colour filter, so membership is checked every frame.
        const filters = this.filters ? this.filters.slice() : [];
        const index = this._docsBlurFilter ? filters.indexOf(this._docsBlurFilter) : -1;
        if (!active) {
            if (index >= 0) {
                filters.splice(index, 1);
                this.filters = filters.length ? filters : null;
            }
            return;
        }
        if (!this._docsBlurFilter) {
            try {
                this._docsBlurFilter = new PIXI.Filter(undefined, DocsDoodads.MotionBlur.fragment, { uVelocity: [0, 0] });
                this._docsBlurFilter.padding = DocsDoodads.MotionBlur.maxLength + 2;
            } catch (error) {
                return;
            }
        }
        this._docsBlurFilter.uniforms.uVelocity = [blur.x, blur.y];
        if (index < 0) {
            filters.push(this._docsBlurFilter);
            this.filters = filters;
        }
    };
}

// Post-processing is offered in Options only when the project uses it.
DocsDoodads.PostFX.offeredInOptions = function() {
    const pf = DocsDoodads.World.settings().postfx;
    if (!pf.enabled) return false;
    if (this.isActive(this.normalizeLook(pf.look))) return true;
    const maps = (typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.mapSettings) || {};
    return Object.keys(maps).some(id => maps[id] && maps[id].postfx && maps[id].postfx.mode === 'custom' && this.isActive(this.normalizeLook(maps[id].postfx.look)));
};

// Options menu: players can switch motion blur off and lower the effects quality.
DocsDoodads.fxQualityLabels = ['High', 'Medium', 'Low', 'Off'];
if (typeof ConfigManager !== 'undefined') {
    ConfigManager.docsMotionBlur = true;
    ConfigManager.docsFxQuality = 0;
    $.ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = $.ConfigManager_makeData.call(this);
        config.docsMotionBlur = this.docsMotionBlur;
        config.docsFxQuality = this.docsFxQuality;
        return config;
    };
    $.ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        $.ConfigManager_applyData.call(this, config);
        this.docsMotionBlur = config && 'docsMotionBlur' in config ? Boolean(config.docsMotionBlur) : true;
        this.docsFxQuality = config && 'docsFxQuality' in config ? Math.max(0, Math.min(3, Number(config.docsFxQuality) || 0)) : 0;
    };
}
DocsDoodads.extraOptionCount = function() {
    return (DocsDoodads.World.settings().motionBlur.enabled ? 1 : 0) + (DocsDoodads.PostFX.offeredInOptions() ? 1 : 0);
};
if (typeof Window_Options !== 'undefined') {
    $.Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        $.Window_Options_addGeneralOptions.call(this);
        if (DocsDoodads.World.settings().motionBlur.enabled) this.addCommand('Motion Blur', 'docsMotionBlur');
        if (DocsDoodads.PostFX.offeredInOptions()) this.addCommand('Effects Quality', 'docsFxQuality');
    };
    // Effects Quality cycles High > Medium > Low > Off.
    $.Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        if (this.commandSymbol(index) === 'docsFxQuality') return DocsDoodads.fxQualityLabels[this.getConfigValue('docsFxQuality') || 0];
        return $.Window_Options_statusText.call(this, index);
    };
    const shiftQuality = (win, delta, wrap) => {
        const value = (win.getConfigValue('docsFxQuality') || 0) + delta;
        win.changeValue('docsFxQuality', wrap ? (value + 4) % 4 : Math.max(0, Math.min(3, value)));
    };
    $.Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, 1, true);
        $.Window_Options_processOk.call(this);
    };
    $.Window_Options_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, 1, false);
        $.Window_Options_cursorRight.apply(this, arguments);
    };
    $.Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function() {
        if (this.commandSymbol(this.index()) === 'docsFxQuality') return shiftQuality(this, -1, false);
        $.Window_Options_cursorLeft.apply(this, arguments);
    };
}
if (typeof Scene_Options !== 'undefined' && Scene_Options.prototype.maxCommands) {
    $.Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
    Scene_Options.prototype.maxCommands = function() {
        return $.Scene_Options_maxCommands.call(this) + DocsDoodads.extraOptionCount();
    };
}

// Post-processing runs on the map layer (or the whole spriteset with pictures), in battle too.
if (typeof Spriteset_Base !== 'undefined' && typeof PIXI !== 'undefined') {
    $.Spriteset_Base_update = Spriteset_Base.prototype.update;
    Spriteset_Base.prototype.update = function() {
        $.Spriteset_Base_update.call(this);
        this.updateDocsPostFx();
    };

    Spriteset_Base.prototype.createDocsPostFxFilters = function() {
        const P = DocsDoodads.PostFX;
        const f = {};
        try {
            f.grade = new PIXI.Filter(undefined, P.gradeFragment, P.uniforms(null, null, 0));
            f.tiltH = new PIXI.Filter(undefined, P.tiltFragment, { uDir: [1, 0], uBlur: 0, uFocus: 0.55, uBand: 0.12 });
            f.tiltV = new PIXI.Filter(undefined, P.tiltFragment, { uDir: [0, 1], uBlur: 0, uFocus: 0.55, uBand: 0.12 });
            const extract = new PIXI.Filter(undefined, P.bloomExtractFragment, { uThreshold: 0.6 });
            const blur = PIXI.filters && PIXI.filters.BlurFilter ? new PIXI.filters.BlurFilter(8, 4) : null;
            const combine = new PIXI.Filter(undefined, P.bloomCombineFragment, { uBloom: PIXI.Texture.EMPTY, uIntensity: 0.8 });
            const bloom = new PIXI.Filter(undefined, P.bloomExtractFragment, { uThreshold: 0.6 });
            // Bright parts are extracted, blurred and added back on top.
            bloom.apply = function(filterManager, input, output, clearMode) {
                const bright = filterManager.getFilterTexture(input);
                extract.apply(filterManager, input, bright, PIXI.CLEAR_MODES ? PIXI.CLEAR_MODES.CLEAR : true);
                if (blur) blur.apply(filterManager, bright, bright, PIXI.CLEAR_MODES ? PIXI.CLEAR_MODES.CLEAR : true);
                combine.uniforms.uBloom = bright;
                combine.apply(filterManager, input, output, clearMode);
                filterManager.returnFilterTexture(bright);
            };
            bloom._docsParts = { extract, blur, combine };
            f.bloom = bloom;
        } catch (error) {
            DocsDoodads.Core.log('Post-processing filters could not be built; the game is shown without them.', error);
            return null;
        }
        return f;
    };

    Spriteset_Base.prototype.updateDocsPostFx = function() {
        const P = DocsDoodads.PostFX;
        const world = DocsDoodads.World.settings();
        const ws = DocsDoodads.Workspace;
        const editing = Boolean(ws && ws.mounted);
        const hidden = (editing && (ws.postFxCompare || ws.postFxPreview === false)) || !DocsDoodads.Atmosphere.featureOn('postfx');
        const mapSettings = typeof $gameMap !== 'undefined' && $gameMap && $gameMap.mapId ? DocsDoodads.Lighting.mapSettings($gameMap.mapId()) : null;
        const runtime = P.runtimeLook();
        let look = hidden ? null : P.resolveLook({ world, mapSettings, runtime });
        let anim = P.Animations.sample(P._anims, DocsDoodads.frameCount());
        if (this._docsExportLook !== undefined) {
            look = this._docsExportLook;
            anim = null;
        }
        const option = typeof ConfigManager !== 'undefined' ? ConfigManager.docsFxQuality : 0;
        const quality = P.effectiveQuality(world.postfx.quality, option);
        const passes = hidden && this._docsExportLook === undefined ? [] : P.passes(look, quality, anim);
        const target = world.postfx.includePictures ? this : this._baseSprite;
        const other = target === this ? this._baseSprite : this;
        if (!target) return;
        if (passes.length && !this._docsPostFx) this._docsPostFx = this.createDocsPostFxFilters();
        const f = this._docsPostFx;
        const ours = [];
        if (f) {
            if (passes.includes('bloom')) {
                const bloom = P.normalizeLook(look).bloom;
                const parts = f.bloom._docsParts;
                parts.extract.uniforms.uThreshold = bloom.enabled ? bloom.threshold : 0.7;
                parts.combine.uniforms.uIntensity = (bloom.enabled ? bloom.intensity : 0) + (anim ? anim.bloom : 0);
                if (parts.blur) {
                    parts.blur.blur = bloom.enabled ? bloom.radius : 10;
                    parts.blur.quality = P.bloomBlurQuality(quality);
                }
                ours.push(f.bloom);
            }
            if (passes.includes('tiltShift')) {
                for (const tilt of [f.tiltH, f.tiltV]) {
                    tilt.uniforms.uBlur = look.tiltShift.blur;
                    tilt.uniforms.uFocus = look.tiltShift.focus;
                    tilt.uniforms.uBand = look.tiltShift.band;
                    ours.push(tilt);
                }
            }
            if (passes.includes('grade')) {
                const u = P.uniforms(look, anim, DocsDoodads.frameCount() / 60);
                for (const key of Object.keys(u)) f.grade.uniforms[key] = u[key];
                ours.push(f.grade);
            }
        }
        const all = f ? [f.bloom, f.tiltH, f.tiltV, f.grade] : [];
        const strip = list => (list || []).filter(filter => !all.includes(filter));
        // The other container may still hold our filters from before "Affect pictures" changed.
        if (other && other.filters && other.filters.some(filter => all.includes(filter))) other.filters = strip(other.filters);
        const kept = strip(target.filters);
        // Ours go after MZ's tone filter on the map layer, and before the fade/flash filter on the whole spriteset.
        const desired = target === this ? ours.concat(kept) : kept.concat(ours);
        const current = target.filters || [];
        if (desired.length !== current.length || desired.some((filter, i) => filter !== current[i])) {
            target.filters = desired.length ? desired : null;
        }
        if (ours.length) {
            const w = typeof Graphics !== 'undefined' ? Graphics.width : 816;
            const h = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            if (!target.filterArea || target.filterArea.width !== w || target.filterArea.height !== h) target.filterArea = new PIXI.Rectangle(0, 0, w, h);
        }
    };
}

// Where a character is on screen, 0-1, for screen effects centred on it.
DocsDoodads.PostFX.screenCenterOf = function(character) {
    if (!character || typeof Graphics === 'undefined') return [0.5, 0.5];
    const x = character.screenX() / Graphics.width;
    const y = (character.screenY() - 24) / Graphics.height;
    return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
};

DocsDoodads.PostFX.play = function(spec) {
    return this.Animations.start(this._anims, spec, DocsDoodads.frameCount());
};

// "Set Look" fades from what is on screen now to a preset, to no effects, or back to the map's own look.
DocsDoodads.PostFX.setLook = function(id, frames) {
    if (typeof $gameSystem === 'undefined' || !$gameSystem) return null;
    const world = DocsDoodads.World.settings();
    const mapSettings = typeof $gameMap !== 'undefined' && $gameMap ? DocsDoodads.Lighting.mapSettings($gameMap.mapId()) : null;
    const mapLook = this.resolveLook({ world, mapSettings }) || this.defaultLook();
    const current = $gameSystem._docsLook ? $gameSystem._docsLook.current : mapLook;
    const target = id === 'map' ? mapLook : id === 'none' ? this.defaultLook() : this.presetLook(id);
    if (!target) return null;
    const fade = this.fadeStart(current, target, frames);
    fade.clearWhenDone = id === 'map';
    $gameSystem._docsLook = fade;
    return fade;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'setLook', args => {
        DocsDoodads.PostFX.setLook(String(args.look || 'map'), Number(args.duration) || 0);
    });
    PluginManager.registerCommand(pluginName, 'playScreenEffect', args => {
        const P = DocsDoodads.PostFX;
        let center = [0.5, 0.5];
        if (args.origin === 'player' && typeof $gamePlayer !== 'undefined') center = P.screenCenterOf($gamePlayer);
        else if (args.origin === 'event' && typeof $gameMap !== 'undefined' && $gameMap) center = P.screenCenterOf($gameMap.event(Number(args.eventId) || 0));
        P.play({ type: args.effect, strength: Number(args.strength), duration: Number(args.duration) || 30, center });
    });
}

// Full-map image export: renders each screen-sized piece with the camera moved there, then restores everything.
DocsDoodads.MapExport.capture = function(spriteset, options = {}) {
    const renderer = DocsDoodads.Compat.getRenderer();
    if (!renderer || !spriteset || typeof $gameMap === 'undefined' || !$gameMap) throw new Error('The map is not ready.');
    const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
    const plan = this.plan($gameMap.width(), $gameMap.height(), tw, th, Graphics.width, Graphics.height, options.scale || 1);
    if (plan.error) throw new Error(plan.error);
    const canvas = document.createElement('canvas');
    canvas.width = plan.width;
    canvas.height = plan.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = plan.scale !== 1;
    const saved = { x: $gameMap._displayX, y: $gameMap._displayY, px: $gameMap._parallaxX, py: $gameMap._parallaxY };
    const P = DocsDoodads.PostFX;
    const look = options.includeEffects
        ? P.exportLook(P.resolveLook({ world: DocsDoodads.World.settings(), mapSettings: DocsDoodads.Lighting.mapSettings($gameMap.mapId()), runtime: P.runtimeLook() }))
        : null;
    spriteset._docsExportLook = look;
    const rt = PIXI.RenderTexture.create({ width: Graphics.width, height: Graphics.height });
    try {
        for (const chunk of plan.chunks) {
            $gameMap.setDisplayPos(chunk.displayX, chunk.displayY);
            spriteset.update();
            spriteset.scale.set(1, 1);
            spriteset.x = 0;
            spriteset.y = 0;
            if (spriteset._docsSelectionOutline) spriteset._docsSelectionOutline.visible = false;
            if (spriteset._docsSilhouette) spriteset._docsSilhouette.visible = false;
            if (spriteset._weather) spriteset._weather.visible = false;
            if (!options.includeEffects) {
                if (spriteset._docsLightOverlay) spriteset._docsLightOverlay.visible = false;
                if (spriteset._docsGlowLayer) spriteset._docsGlowLayer.visible = false;
            }
            if (!options.includeCharacters) {
                for (const sprite of spriteset._characterSprites || []) {
                    sprite.visible = false;
                    if (sprite._docsShadow) sprite._docsShadow.visible = false;
                }
                if (spriteset._docsReflectLayer) spriteset._docsReflectLayer.visible = false;
                if (spriteset._shadowSprite) spriteset._shadowSprite.visible = false;
            }
            renderer.render(spriteset, rt, true);
            const piece = renderer.extract.canvas(rt);
            // MZ centres maps smaller than the screen, so read where the camera really is.
            const sx = Math.round(chunk.dx - $gameMap.displayX() * tw), sy = Math.round(chunk.dy - $gameMap.displayY() * th);
            ctx.drawImage(piece, sx, sy, chunk.w, chunk.h,
                Math.round(chunk.dx * plan.scale), Math.round(chunk.dy * plan.scale), Math.round(chunk.w * plan.scale), Math.round(chunk.h * plan.scale));
        }
    } finally {
        rt.destroy(true);
        delete spriteset._docsExportLook;
        $gameMap._displayX = saved.x;
        $gameMap._displayY = saved.y;
        $gameMap._parallaxX = saved.px;
        $gameMap._parallaxY = saved.py;
        if (spriteset._weather) spriteset._weather.visible = true;
        if (spriteset._docsGlowLayer) spriteset._docsGlowLayer.visible = true;
        spriteset.update();
    }
    return { canvas, plan };
};

// ---- Particles, VFX and reactive doodads on the map ----
// Small white textures (one per shape), tinted per particle.
DocsDoodads.ParticleTextures = {
    _cache: {},
    size: 32,

    get(shape) {
        if (this._cache[shape]) return this._cache[shape];
        if (typeof document === 'undefined' || typeof PIXI === 'undefined') return null;
        const n = this.size, c = document.createElement('canvas');
        c.width = n;
        c.height = n;
        const g = c.getContext('2d');
        g.fillStyle = '#ffffff';
        const mid = n / 2;
        if (shape === 'soft') {
            const grad = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
            grad.addColorStop(0, 'rgba(255,255,255,1)');
            grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grad;
            g.fillRect(0, 0, n, n);
        } else if (shape === 'circle') {
            g.beginPath();
            g.arc(mid, mid, mid - 2, 0, Math.PI * 2);
            g.fill();
        } else if (shape === 'square') {
            g.fillRect(4, 4, n - 8, n - 8);
        } else if (shape === 'spark') {
            g.beginPath();
            g.ellipse(mid, mid, mid - 1, mid / 5, 0, 0, Math.PI * 2);
            g.fill();
        } else if (shape === 'leaf') {
            g.beginPath();
            g.moveTo(2, mid);
            g.quadraticCurveTo(mid, 2, n - 2, mid);
            g.quadraticCurveTo(mid, n - 2, 2, mid);
            g.fill();
        } else {
            g.beginPath();
            for (let i = 0; i < 8; i++) {
                const r = i % 2 === 0 ? mid - 1 : mid / 4;
                const a = i * Math.PI / 4;
                g.lineTo(mid + Math.cos(a) * r, mid + Math.sin(a) * r);
            }
            g.closePath();
            g.fill();
        }
        this._cache[shape] = PIXI.Texture.from(c);
        return this._cache[shape];
    }
};

if (typeof PIXI !== 'undefined' && PIXI.Container) {
    // One particle emitter drawn with pooled sprites, positioned relative to its container.
    window.Sprite_DocsParticles = function() { this.initialize(...arguments); };
    Sprite_DocsParticles.prototype = Object.create(PIXI.Container.prototype);
    Sprite_DocsParticles.prototype.constructor = Sprite_DocsParticles;

    Sprite_DocsParticles.prototype.initialize = function(config, seed) {
        PIXI.Container.call(this);
        this._pool = [];
        this.setConfig(config, seed);
    };

    Sprite_DocsParticles.prototype.setConfig = function(config, seed) {
        this._config = config;
        this._state = DocsDoodads.Particles.createState(config, seed || 1);
        this._bursted = false;
    };

    Sprite_DocsParticles.prototype.burstNow = function(count) {
        DocsDoodads.Particles.burst(this._state, count === undefined ? this._config.burst : count);
    };

    Sprite_DocsParticles.prototype.alive = function() {
        return this._state.particles.length;
    };

    Sprite_DocsParticles.prototype.stepAndDraw = function(dt, emitting) {
        const P = DocsDoodads.Particles;
        if (emitting && !this._bursted) {
            this._bursted = true;
            if (this._config.burst) this.burstNow();
        }
        P.step(this._state, dt, emitting);
        const views = P.view(this._state);
        const texture = DocsDoodads.ParticleTextures.get(this._config.shape);
        const blend = this._config.blend === 'add' ? PIXI.BLEND_MODES.ADD : this._config.blend === 'screen' ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.NORMAL;
        while (this._pool.length < views.length) {
            const s = new PIXI.Sprite(texture || PIXI.Texture.WHITE);
            s.anchor.set(0.5, 0.5);
            this.addChild(s);
            this._pool.push(s);
        }
        const unit = DocsDoodads.ParticleTextures.size;
        for (let i = 0; i < this._pool.length; i++) {
            const s = this._pool[i], v = views[i];
            s.visible = Boolean(v);
            if (!v) continue;
            if (texture && s.texture !== texture) s.texture = texture;
            s.x = v.x;
            s.y = v.y;
            s.scale.set(Math.max(0.001, v.size / unit), Math.max(0.001, v.size / unit) * (1 + v.stretch));
            s.alpha = v.alpha;
            s.rotation = v.rotation;
            s.tint = v.color;
            s.blendMode = blend;
        }
    };

    // A whole VFX: particle layers and sprite-sheet layers on one clock.
    window.Sprite_DocsVfx = function() { this.initialize(...arguments); };
    Sprite_DocsVfx.prototype = Object.create(PIXI.Container.prototype);
    Sprite_DocsVfx.prototype.constructor = Sprite_DocsVfx;

    Sprite_DocsVfx.prototype.initialize = function(def, seed) {
        PIXI.Container.call(this);
        this._def = def;
        this._time = 0;
        this._layers = def.layers.map((layer, i) => {
            if (layer.type === 'particles') {
                const view = new Sprite_DocsParticles(DocsDoodads.Particles.normalize(layer.emitter), (seed || 1) + i * 7919);
                view.x = layer.offsetX;
                view.y = layer.offsetY;
                this.addChild(view);
                return { layer, view };
            }
            const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
            sprite.anchor.set(0.5, 0.5);
            sprite.x = layer.offsetX;
            sprite.y = layer.offsetY;
            sprite.scale.set(layer.scale);
            sprite.rotation = layer.rotation * Math.PI / 180;
            sprite.alpha = layer.alpha;
            sprite.tint = DocsDoodads.Lighting.parseColor(layer.tint, 0xffffff);
            sprite.blendMode = layer.blend === 'add' ? PIXI.BLEND_MODES.ADD : layer.blend === 'screen' ? PIXI.BLEND_MODES.SCREEN : PIXI.BLEND_MODES.NORMAL;
            this.addChild(sprite);
            const entry = { layer, view: sprite, bitmap: layer.image ? DocsDoodads.loadBitmap(layer.image) : null };
            return entry;
        });
    };

    Sprite_DocsVfx.prototype.alive = function() {
        return this._layers.reduce((n, l) => n + (l.layer.type === 'particles' ? l.view.alive() : 0), 0);
    };

    Sprite_DocsVfx.prototype.isFinished = function() {
        return DocsDoodads.Vfx.isFinished(this._def, this._time, this.alive());
    };

    Sprite_DocsVfx.prototype.step = function(dt) {
        const V = DocsDoodads.Vfx;
        this._time += dt;
        // Looping effects restart their clock (and bursts) each cycle.
        if (this._def.loop && this._time >= this._def.duration) {
            this._time -= this._def.duration;
            for (const l of this._layers) if (l.layer.type === 'particles') l.view._bursted = false;
        }
        for (const l of this._layers) {
            const t = this._time - l.layer.start;
            if (l.layer.type === 'particles') {
                l.view.stepAndDraw(dt, V.emitting(this._def, l.layer, this._time));
                continue;
            }
            const frame = t >= 0 ? V.sheetFrame(l.layer, t) : -1;
            const bmp = l.bitmap;
            if (frame < 0 || !bmp || !bmp.isReady() || !(bmp.baseTexture || bmp._baseTexture)) {
                l.view.visible = false;
                continue;
            }
            const w = bmp.width / l.layer.cols, h = bmp.height / l.layer.rows;
            const rect = DocsDoodads.safeFrame({ x: (frame % l.layer.cols) * w, y: Math.floor(frame / l.layer.cols) * h, w, h }, bmp.width, bmp.height);
            if (!l.texture) l.texture = new PIXI.Texture(bmp.baseTexture || bmp._baseTexture, new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h));
            else l.texture.frame = new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h);
            l.view.texture = l.texture;
            l.view.visible = true;
        }
    };
}

// Where each walker is (map pixels) this frame, for grass and bushes that react.
DocsDoodads.React.walkers = function() {
    const frame = DocsDoodads.frameCount();
    if (this._walkersFrame === frame && this._walkers) return this._walkers;
    this._walkersFrame = frame;
    const out = [];
    if (typeof $gameMap !== 'undefined' && $gameMap && typeof $gamePlayer !== 'undefined' && $gamePlayer) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const add = ch => {
            if (!ch || (ch.isTransparent && ch.isTransparent())) return;
            const moving = ch.isMoving && ch.isMoving();
            out.push({ x: (ch._realX + 0.5) * tw, baseY: (ch._realY + 1) * th, speed: moving && ch.distancePerFrame ? ch.distancePerFrame() * tw : 0 });
        };
        add($gamePlayer);
        if ($gamePlayer.followers) $gamePlayer.followers().visibleFollowers().forEach(add);
        for (const ev of $gameMap.events()) if (ev.characterName() || ev.tileId() > 0) add(ev);
    }
    this._walkers = out;
    return out;
};

if (typeof Sprite_DocsDoodad !== 'undefined' && Sprite_DocsDoodad.prototype && Sprite_DocsDoodad.prototype.updatePlacement) {
    $.Sprite_DocsDoodad_updatePlacement = Sprite_DocsDoodad.prototype.updatePlacement;
    Sprite_DocsDoodad.prototype.updatePlacement = function() {
        $.Sprite_DocsDoodad_updatePlacement.call(this);
        this.updateDocsReact();
        this.updateDocsParticles();
    };

    // Bending: walkers inside the doodad's base push it away; a spring brings it back.
    Sprite_DocsDoodad.prototype.updateDocsReact = function() {
        const d = this._data;
        if (!d.react || !d.react.enabled) {
            this._react = null;
            return;
        }
        const R = DocsDoodads.React;
        const frame = DocsDoodads.frameCount();
        // The spring moves once per frame; the bend is applied on every placement pass.
        if (this._lastReactFrame !== frame || !this._react) {
            this._lastReactFrame = frame;
            const th = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.tileHeight() : 48;
            let impulse = 0, touching = false;
            for (const w of R.walkers()) {
                if (!R.touching(d, w.x, w.baseY, th)) continue;
                touching = true;
                if (w.speed > 0) impulse += R.push(d, w.x, w.speed) * 0.6;
            }
            if (touching && !this._reactTouching) {
                impulse += R.push(d, d.x - 1, 4) * 1.5 * (Math.random() < 0.5 ? -1 : 1);
                if (d.react.leaves) this.dropDocsLeaves();
            }
            this._reactTouching = touching;
            this._react = R.step(this._react || { bend: 0, vel: 0 }, impulse);
        }
        // A positive bend leans the top to the right; PIXI skews the top left for positive skew.x.
        this.skew.x -= this._react.bend;
    };

    Sprite_DocsDoodad.prototype.dropDocsLeaves = function() {
        if (!this.parent) return;
        if (!this._docsLeaves) {
            const d = this._data;
            const config = DocsDoodads.Particles.normalize({ preset: 'leaves', rate: 0, area: [(d.frameW || 48) * 0.6, 8], lifetime: [0.8, 1.4], speed: [20, 40], angle: -60, spread: 80, gravity: 60 });
            this._docsLeaves = new Sprite_DocsParticles(config, (d.x || 1) + (d.y || 1));
            this._docsLeaves.z = 5.5;
            this._docsLeaves._docsSortY = 0;
        }
        if (this._docsLeaves.parent !== this.parent) this.parent.addChild(this._docsLeaves);
        this._docsLeaves.burstNow(3);
    };

    // Emitters and attached VFX follow the doodad; "below" sits under characters, "above" over them.
    Sprite_DocsDoodad.prototype.updateDocsParticles = function() {
        const d = this._data;
        if (this._lastParticleFrame === DocsDoodads.frameCount() && DocsDoodads.frameCount() !== 0) return;
        this._lastParticleFrame = DocsDoodads.frameCount();
        const pos = this.screenPosition();
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const centerY = pos.y + h * (0.5 - (d.anchorY !== undefined ? d.anchorY : 1));
        const parent = this.parent;
        const wanted = d.particles && d.particles.preset && d.particles.preset !== 'none' ? d.particles : null;
        const sig = wanted ? JSON.stringify(wanted) : '';
        if (sig !== this._particleSig) {
            this._particleSig = sig;
            this.destroyDocsParticles();
            if (wanted && typeof Sprite_DocsParticles !== 'undefined') {
                const config = DocsDoodads.Particles.normalize(Object.assign({}, wanted, { preset: wanted.preset }));
                config.rate *= wanted.rateScale !== undefined ? Math.max(0, Number(wanted.rateScale) || 0) : 1;
                this._docsEmitter = new Sprite_DocsParticles(config, Math.round((d.x || 0) * 7 + (d.y || 0) * 13) + 1);
            }
        }
        if (this._docsEmitter && parent) {
            const e = this._docsEmitter;
            if (e.parent !== parent) parent.addChild(e);
            e.z = wanted && wanted.layer === 'below' ? 0.6 : 5.5;
            e._docsSortY = 0;
            e.x = pos.x + (Number(wanted.offsetX) || 0);
            e.y = centerY + (Number(wanted.offsetY) || 0);
            e.visible = this.visible;
            e.stepAndDraw(1 / 60, this.visible);
        }
        const vfxId = d.vfx || '';
        if (vfxId !== this._vfxId) {
            this._vfxId = vfxId;
            if (this._docsVfx) {
                if (this._docsVfx.parent) this._docsVfx.parent.removeChild(this._docsVfx);
                this._docsVfx.destroy({ children: true });
                this._docsVfx = null;
            }
            const def = vfxId ? DocsDoodads.Vfx.find(vfxId, DocsDoodads.Vfx.library()) : null;
            if (def && typeof Sprite_DocsVfx !== 'undefined') this._docsVfx = new Sprite_DocsVfx(Object.assign({}, def, { loop: true }), (d.x || 1) + (d.y || 1));
        }
        if (this._docsVfx && parent) {
            const v = this._docsVfx;
            if (v.parent !== parent) parent.addChild(v);
            v.z = 5.5;
            v._docsSortY = 0;
            v.x = pos.x;
            v.y = centerY;
            v.visible = this.visible;
            v.step(1 / 60);
        }
        if (this._docsLeaves && this._docsLeaves.parent) {
            this._docsLeaves.x = pos.x;
            this._docsLeaves.y = centerY;
            this._docsLeaves.stepAndDraw(1 / 60, false);
        }
    };

    Sprite_DocsDoodad.prototype.destroyDocsParticles = function() {
        if (this._docsEmitter) {
            if (this._docsEmitter.parent) this._docsEmitter.parent.removeChild(this._docsEmitter);
            this._docsEmitter.destroy({ children: true });
            this._docsEmitter = null;
        }
    };

    // Effects living beside the doodad in the tilemap go with it when the layer is rebuilt.
    Sprite_DocsDoodad.prototype.destroyDocsFx = function() {
        this.destroyDocsParticles();
        for (const key of ['_docsVfx', '_docsLeaves']) {
            if (this[key]) {
                if (this[key].parent) this[key].parent.removeChild(this[key]);
                this[key].destroy({ children: true });
                this[key] = null;
            }
        }
        this._particleSig = undefined;
        this._vfxId = undefined;
    };
}

if (typeof Spriteset_Map !== 'undefined') {
    $.Spriteset_Map_removeDocsDoodadSprites = Spriteset_Map.prototype.removeDocsDoodadSprites;
    Spriteset_Map.prototype.removeDocsDoodadSprites = function() {
        for (const sprite of this._docsDoodadSprites || []) if (sprite.destroyDocsFx) sprite.destroyDocsFx();
        $.Spriteset_Map_removeDocsDoodadSprites.call(this);
    };

    // Effects started by "Play VFX" belong to the map they started on; they survive the menu.
    $.Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        $.Spriteset_Map_createCharacters.call(this);
        const mapId = typeof $gameMap !== 'undefined' && $gameMap ? $gameMap.mapId() : 0;
        if (DocsDoodads.Vfx._mapId !== mapId) DocsDoodads.Vfx._playing = [];
        DocsDoodads.Vfx._mapId = mapId;
        for (const instance of DocsDoodads.Vfx._playing) instance.view = null;
        this._docsVfxViews = [];
        DocsDoodads.CharacterAnim.preload();
    };

    $.Spriteset_Map_update_vfx = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        $.Spriteset_Map_update_vfx.call(this);
        this.updateDocsVfx();
    };

    Spriteset_Map.prototype.updateDocsVfx = function() {
        if (!this._tilemap || typeof Sprite_DocsVfx === 'undefined') return;
        this._docsVfxViews = this._docsVfxViews || [];
        const playing = DocsDoodads.Vfx._playing;
        for (const instance of playing) {
            if (!instance.view) {
                instance.view = new Sprite_DocsVfx(instance.def, instance.seed);
                instance.view.z = 5.5;
                instance.view._docsSortY = 0;
                this._docsVfxViews.push(instance.view);
            }
            if (instance.view.parent !== this._tilemap) this._tilemap.addChild(instance.view);
            let at;
            const ch = instance.follow;
            if (ch && typeof ch.screenX === 'function') {
                at = { x: ch.screenX(), y: ch.screenY() - 24 };
            } else {
                at = DocsDoodads.mapToScreen(instance.x, instance.y);
            }
            instance.view.x = at.x;
            instance.view.y = at.y;
            instance.view.step(1 / 60);
            instance.time = instance.view._time;
            if (instance.view.isFinished()) instance.done = true;
        }
        for (let i = playing.length - 1; i >= 0; i--) {
            const instance = playing[i];
            if (!instance.done) continue;
            if (instance.view.parent) instance.view.parent.removeChild(instance.view);
            instance.view.destroy({ children: true });
            playing.splice(i, 1);
        }
    };
}

// ---- Character animation ----
DocsDoodads.CharacterAnim.sets = function() {
    return DocsDoodads.World.settings().characterAnim.sets || [];
};

// Loads idle and run sheets for characters on the map before they are needed, so switching never blinks.
DocsDoodads.CharacterAnim.preload = function() {
    if (typeof ImageManager === 'undefined' || typeof $gameMap === 'undefined' || !$gameMap) return;
    const sets = this.sets();
    if (!sets.length) return;
    const names = new Set();
    const add = ch => { if (ch && ch.characterName && ch.characterName()) names.add(ch.characterName()); };
    if (typeof $gamePlayer !== 'undefined' && $gamePlayer) {
        add($gamePlayer);
        if ($gamePlayer.followers) $gamePlayer.followers().data().forEach(add);
    }
    for (const ev of $gameMap.events()) add(ev);
    for (const name of names) {
        const set = this.setFor(name, sets);
        if (!set) continue;
        if (set.idle) ImageManager.loadCharacter(set.idle);
        if (set.run) ImageManager.loadCharacter(set.run);
    }
};

if (typeof Game_CharacterBase !== 'undefined') {
    const C = DocsDoodads.CharacterAnim;
    const walkFrames = ch => C.parseName(ch.characterName ? ch.characterName() : '').frames;

    $.Game_CharacterBase_update = Game_CharacterBase.prototype.update;
    Game_CharacterBase.prototype.update = function() {
        $.Game_CharacterBase_update.call(this);
        if (this.isMoving() || this.isJumping()) this._docsStill = 0;
        else this._docsStill = Math.min(100000, (this._docsStill || 0) + 1);
        this._docsAnimTimer = ((this._docsAnimTimer || 0) + 1) % 1000000;
        if (this._docsAction) {
            this._docsAction.elapsed++;
            if (C.actionFrame(this._docsAction, this._docsAction.elapsed).done) this._docsAction = null;
        }
    };

    // Sheets with more than 3 frames loop through every frame.
    $.Game_CharacterBase_maxPattern = Game_CharacterBase.prototype.maxPattern;
    Game_CharacterBase.prototype.maxPattern = function() {
        const frames = walkFrames(this);
        return frames === 3 ? $.Game_CharacterBase_maxPattern.call(this) : frames;
    };
    $.Game_CharacterBase_pattern = Game_CharacterBase.prototype.pattern;
    Game_CharacterBase.prototype.pattern = function() {
        const frames = walkFrames(this);
        return frames === 3 ? $.Game_CharacterBase_pattern.call(this) : ((this._pattern % frames) + frames) % frames;
    };
    $.Game_CharacterBase_resetPattern = Game_CharacterBase.prototype.resetPattern;
    Game_CharacterBase.prototype.resetPattern = function() {
        if (walkFrames(this) === 3) $.Game_CharacterBase_resetPattern.call(this);
        else this.setPattern(0);
    };
    $.Game_CharacterBase_isOriginalPattern = Game_CharacterBase.prototype.isOriginalPattern;
    Game_CharacterBase.prototype.isOriginalPattern = function() {
        return walkFrames(this) === 3 ? $.Game_CharacterBase_isOriginalPattern.call(this) : this.pattern() === 0;
    };

    // The facing used by 8-direction sheets (1, 3, 7, 9 after diagonal moves).
    $.Game_CharacterBase_setDirection = Game_CharacterBase.prototype.setDirection;
    Game_CharacterBase.prototype.setDirection = function(d) {
        $.Game_CharacterBase_setDirection.call(this, d);
        this._docsDir8 = this.direction();
    };
    $.Game_CharacterBase_moveDiagonally = Game_CharacterBase.prototype.moveDiagonally;
    Game_CharacterBase.prototype.moveDiagonally = function(horz, vert) {
        $.Game_CharacterBase_moveDiagonally.call(this, horz, vert);
        if (!this.isDirectionFixed()) this._docsDir8 = C.dir8(horz, vert);
    };
    Game_CharacterBase.prototype.docsFacing = function() {
        return this._docsDir8 || this.direction();
    };
}

// Optional diagonal movement for the player (and so 8-direction sheets show their diagonals).
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_getInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (DocsDoodads.World.settings().characterAnim.diagonal && typeof Input !== 'undefined') return Input.dir8;
        return $.Game_Player_getInputDirection.call(this);
    };
    $.Game_Player_executeMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function(direction) {
        const split = DocsDoodads.CharacterAnim.split8(direction);
        if (!split) return $.Game_Player_executeMove.call(this, direction);
        this.moveDiagonally(split.horz, split.vert);
        // Blocked diagonally: slide along whichever side is open.
        if (!this.isMovementSucceeded()) {
            this.moveStraight(split.horz);
            if (!this.isMovementSucceeded()) this.moveStraight(split.vert);
        }
    };
}

if (typeof Sprite_Character !== 'undefined') {
    const C = DocsDoodads.CharacterAnim;

    // Which sheet and frame a character shows, or null to let MZ draw it the usual way.
    Sprite_Character.prototype.docsAnimFrame = function() {
        const ch = this._character;
        if (!ch || !ch.characterName || ch.tileId() > 0) return null;
        const name = ch.characterName();
        if (!name) return null;
        const set = C.setFor(name, C.sets());
        const action = ch._docsAction;
        const parsedName = C.parseName(name);
        if (!action && !set && !parsedName.tagged) return null;
        const moving = ch.isMoving();
        const dashing = moving && ch.realMoveSpeed && ch.realMoveSpeed() >= 5;
        const state = C.stateFor({ moving, dashing, stillFrames: ch._docsStill || 0, action }, set);
        const sheet = state === 'action' ? action.sheet : C.sheetFor(state, name, set);
        const layout = C.parseName(sheet);
        let frame;
        if (state === 'action') frame = C.actionFrame(action, action.elapsed).frame;
        else if (state === 'idle') frame = C.cycleFrame(ch._docsStill - (set.idleDelay || 0), set.idleFps || 6, layout.frames);
        else if (state === 'run' && layout.frames !== parsedName.frames) frame = C.cycleFrame(ch._docsAnimTimer || 0, set.runFps || 12, layout.frames);
        else frame = layout.frames === 3 ? C.walkFrame(ch._pattern, 3) : ch.pattern() % layout.frames;
        const single = layout.tagged || sheet.startsWith('$') || (sheet.length > 1 && sheet[0] === '!' && sheet[1] === '$');
        return { sheet, frames: layout.frames, dirs: layout.dirs, frame, single, index: ch.characterIndex(), facing: ch.docsFacing ? ch.docsFacing() : ch.direction() };
    };

    $.Sprite_Character_updateBitmap = Sprite_Character.prototype.updateBitmap;
    Sprite_Character.prototype.updateBitmap = function() {
        const anim = this.docsAnimFrame();
        this._docsAnim = anim;
        if (!anim) {
            if (this._docsAnimSheet) {
                // Back to a normal sheet: make MZ reload it.
                this._docsAnimSheet = null;
                this._characterName = '';
                this.scale.x = Math.abs(this.scale.x);
            }
            return $.Sprite_Character_updateBitmap.call(this);
        }
        if (this._docsAnimSheet !== anim.sheet) {
            const bmp = ImageManager.loadCharacter(anim.sheet);
            // Keep the old frame on screen until the new sheet has loaded.
            if (bmp.isReady() || !this.bitmap) {
                this._docsAnimSheet = anim.sheet;
                this.bitmap = bmp;
                this._characterName = this._character.characterName();
                this._tileId = 0;
            }
        }
    };

    $.Sprite_Character_updateCharacterFrame = Sprite_Character.prototype.updateCharacterFrame;
    Sprite_Character.prototype.updateCharacterFrame = function() {
        const anim = this._docsAnim;
        if (!anim || !this.bitmap || !this.bitmap.isReady() || this._docsAnimSheet !== anim.sheet) {
            if (!anim) return $.Sprite_Character_updateCharacterFrame.call(this);
            return;
        }
        const W = this.bitmap.width, H = this.bitmap.height;
        const block = anim.single ? { x: 0, y: 0, w: W, h: H } : { x: (anim.index % 4) * W / 4, y: Math.floor(anim.index / 4) * H / 2, w: W / 4, h: H / 2 };
        const pw = Math.floor(block.w / anim.frames), ph = Math.floor(block.h / anim.dirs);
        const facing = C.rowFor(anim.facing, anim.dirs);
        const sx = block.x + Math.min(anim.frame, anim.frames - 1) * pw;
        const sy = block.y + Math.min(facing.row, anim.dirs - 1) * ph;
        this.scale.x = Math.abs(this.scale.x) * (facing.mirror ? -1 : 1);
        this.updateHalfBodySprites();
        if (this._bushDepth > 0) {
            const d = Math.min(this._bushDepth, ph);
            this._upperBody.setFrame(sx, sy, pw, ph - d);
            this._lowerBody.setFrame(sx, sy + ph - d, pw, d);
            this.setFrame(sx, sy, 0, ph);
        } else {
            this.setFrame(sx, sy, pw, ph);
        }
    };
}

// The interpreter can wait for an action or a VFX to finish.
if (typeof Game_Interpreter !== 'undefined') {
    $.Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'docsAction') {
            const waiting = Boolean(this._docsWaitCharacter && this._docsWaitCharacter._docsAction);
            if (!waiting) {
                this._waitMode = '';
                this._docsWaitCharacter = null;
            }
            return waiting;
        }
        if (this._waitMode === 'docsVfx') {
            const waiting = Boolean(this._docsWaitVfx && !this._docsWaitVfx.done && DocsDoodads.Vfx._playing.includes(this._docsWaitVfx));
            if (!waiting) {
                this._waitMode = '';
                this._docsWaitVfx = null;
            }
            return waiting;
        }
        return $.Game_Interpreter_updateWaitMode.call(this);
    };
}

// "this" event, the player, or an event by ID.
DocsDoodads.characterFor = function(interpreter, target, eventId) {
    if (target === 'player') return typeof $gamePlayer !== 'undefined' ? $gamePlayer : null;
    if (typeof $gameMap === 'undefined' || !$gameMap) return null;
    if (target === 'this') return interpreter && interpreter.eventId ? $gameMap.event(interpreter.eventId()) : null;
    return $gameMap.event(Number(eventId) || 0) || null;
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'characterAction', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        if (!ch) return;
        const action = DocsDoodads.CharacterAnim.newAction({ sheet: args.sheet, fps: Number(args.fps) || 8, loops: Number(args.loops), hold: String(args.hold) === 'true' });
        ch._docsAction = action;
        if (typeof ImageManager !== 'undefined') ImageManager.loadCharacter(action.sheet);
        if (String(args.wait) === 'true' && !action.hold && action.loops > 0 && this && this.setWaitMode) {
            this._docsWaitCharacter = ch;
            this.setWaitMode('docsAction');
        }
    });
    PluginManager.registerCommand(pluginName, 'clearCharacterAction', function(args) {
        const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
        if (ch) ch._docsAction = null;
    });
    PluginManager.registerCommand(pluginName, 'playVfx', function(args) {
        if (typeof $gameMap === 'undefined' || !$gameMap) return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const spec = { id: String(args.effect || '').trim() };
        if (args.target === 'tile') {
            spec.x = ((Number(args.x) || 0) + 0.5) * tw;
            spec.y = ((Number(args.y) || 0) + 0.5) * th;
        } else if (args.target === 'screen') {
            const at = DocsDoodads.screenToMap(Graphics.width / 2, Graphics.height / 2);
            spec.x = at.x;
            spec.y = at.y;
        } else {
            const ch = DocsDoodads.characterFor(this, args.target, args.eventId);
            if (!ch) return;
            if (String(args.follow) !== 'false') spec.follow = ch;
            spec.x = (ch._realX + 0.5) * tw;
            spec.y = (ch._realY + 0.5) * th;
        }
        const instance = DocsDoodads.Vfx.play(spec);
        if (instance && String(args.wait) === 'true' && this && this.setWaitMode) {
            this._docsWaitVfx = instance;
            this.setWaitMode('docsVfx');
        }
    });
}

// ---- Spatial sound ----
DocsDoodads.SpatialSound.settings = function() {
    return DocsDoodads.World.settings().sound;
};

// A sound effect from a character, varied and placed relative to the player.
DocsDoodads.SpatialSound.forCharacter = function(se, ch) {
    if (!se || !se.name) return se;
    const s = this.settings();
    const out = this.vary(se, s, Math.random);
    if (!ch || typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return out;
    const playerLike = ch === $gamePlayer || (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower);
    if (!this.shouldSpatialize(s, DocsDoodads.CharacterTags.forCharacter(ch), playerLike)) return out;
    return this.apply(out, $gameMap.deltaX(ch._realX, $gamePlayer._realX), $gameMap.deltaY(ch._realY, $gamePlayer._realY), s);
};

DocsDoodads.SpatialSound.forTile = function(se, x, y) {
    if (!se || typeof $gamePlayer === 'undefined' || !$gamePlayer || typeof $gameMap === 'undefined' || !$gameMap) return se;
    const s = this.settings();
    return this.apply(this.vary(se, s, Math.random), $gameMap.deltaX(x, $gamePlayer._realX), $gameMap.deltaY(y, $gamePlayer._realY), s);
};

if (typeof Game_Interpreter !== 'undefined') {
    // Play SE from a map event is heard from where the event stands.
    Game_Interpreter.prototype.command250 = function(params) {
        const sameMap = typeof $gameMap !== 'undefined' && $gameMap && this._mapId === $gameMap.mapId();
        const ch = sameMap && this.eventId() > 0 ? $gameMap.event(this.eventId()) : null;
        const se = DocsDoodads.SpatialSound.forCharacter(params[0], ch);
        if (se) AudioManager.playSe(se);
        return true;
    };
}

if (typeof Game_Character !== 'undefined') {
    // Move-route SE (footsteps, door creaks) too.
    $.Game_Character_processMoveCommand = Game_Character.prototype.processMoveCommand;
    Game_Character.prototype.processMoveCommand = function(command) {
        if (command && command.code === Game_Character.ROUTE_PLAY_SE) {
            const se = DocsDoodads.SpatialSound.forCharacter(command.parameters[0], this);
            if (se) AudioManager.playSe(se);
            return;
        }
        $.Game_Character_processMoveCommand.call(this, command);
    };
}

// Looping and repeating sounds on doodads and on events tagged <sound: ...>.
DocsDoodads.SoundEmitters = {
    _active: typeof Map !== 'undefined' ? new Map() : null,
    _mapId: null,

    sources() {
        const out = [];
        if (typeof $gameMap === 'undefined' || !$gameMap) return out;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const d of DocsDoodads.doodads()) {
            if (!d || !d.sound || !d.sound.file) continue;
            if (DocsDoodads.Appearance.isConditional(d) && !DocsDoodads.Appearance.isVisible(d, {})) continue;
            if (!DocsDoodads.Layers.visibleInGame(d, DocsDoodads.Lighting.mapSettings($gameMap.mapId()))) continue;
            const emitter = DocsDoodads.SpatialSound.normalizeEmitter(d.sound);
            // Doodads sit on their base line; characters' realY is their tile, feet at (realY + 1).
            if (emitter) out.push({ owner: d, emitter, x: d.x / tw - 0.5, y: d.y / th - 1 });
        }
        for (const ev of $gameMap.events()) {
            const tag = DocsDoodads.CharacterTags.forCharacter(ev).sound;
            const emitter = tag ? DocsDoodads.SpatialSound.normalizeEmitter(tag) : null;
            if (emitter) out.push({ owner: ev, emitter, x: ev._realX, y: ev._realY });
        }
        return out;
    },

    stop(owner) {
        const state = this._active.get(owner);
        if (state && state.buffer) state.buffer.stop();
        this._active.delete(owner);
    },

    stopAll() {
        if (!this._active) return;
        for (const owner of Array.from(this._active.keys())) this.stop(owner);
    },

    update() {
        if (!this._active || typeof AudioManager === 'undefined' || typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gameMap) return;
        if (this._mapId !== $gameMap.mapId()) {
            this.stopAll();
            this._mapId = $gameMap.mapId();
        }
        const SS = DocsDoodads.SpatialSound;
        const s = SS.settings();
        const sources = this.sources();
        const plan = SS.planEmitters(sources.map((src, i) => ({ key: i, emitter: src.emitter,
            dx: $gameMap.deltaX(src.x, $gamePlayer._realX), dy: $gameMap.deltaY(src.y, $gamePlayer._realY) })), s);
        const seen = new Set();
        sources.forEach((src, i) => {
            const p = plan[i];
            const e = src.emitter;
            const sig = e.file + '|' + e.loop;
            let state = this._active.get(src.owner);
            if (state && state.sig !== sig) {
                this.stop(src.owner);
                state = null;
            }
            if (!state) {
                state = { sig, buffer: null, timer: SS.nextDelay(e.every) * Math.random() };
                this._active.set(src.owner, state);
            }
            seen.add(src.owner);
            if (e.loop) {
                if (p.gain > 0.001) {
                    if (!state.buffer) {
                        state.buffer = AudioManager.createBuffer('bgs/', e.name);
                        state.buffer.play(true, 0);
                    }
                    AudioManager.updateBufferParameters(state.buffer, AudioManager._bgsVolume, { volume: e.volume * p.gain, pitch: e.pitch, pan: p.pan });
                } else if (state.buffer) {
                    state.buffer.stop();
                    state.buffer = null;
                }
                return;
            }
            state.timer -= 1 / 60;
            if (state.timer > 0) return;
            state.timer = SS.nextDelay(e.every);
            if (p.gain > 0.001) AudioManager.playSe(SS.vary({ name: e.name, volume: Math.round(e.volume * p.gain), pitch: e.pitch, pan: p.pan }, s, Math.random));
        });
        for (const owner of Array.from(this._active.keys())) if (!seen.has(owner)) this.stop(owner);
    }
};

// Region background sounds: the map's own BGS comes back when the player leaves the region.
DocsDoodads.RegionSounds = {
    _state: null,
    _mapId: null,
    _saved: null,

    update() {
        if (typeof AudioManager === 'undefined' || typeof $gamePlayer === 'undefined' || !$gamePlayer || !$gameMap) return;
        const SS = DocsDoodads.SpatialSound;
        if (this._mapId !== $gameMap.mapId() || !this._state) {
            this._mapId = $gameMap.mapId();
            this._state = SS.regionStart();
            this._saved = null;
        }
        const list = (DocsDoodads.Lighting.mapSettings($gameMap.mapId()) || {}).regionSounds;
        if (!Array.isArray(list) || list.length === 0) {
            if (!this._state.key) return;
        }
        const step = SS.regionStep(this._state, list || [], $gameMap.regionId($gamePlayer.x, $gamePlayer.y));
        this._state = step.state;
        const action = step.action;
        if (!action) return;
        if (action.type === 'play') {
            if (action.save) this._saved = AudioManager.saveBgs();
            AudioManager.playBgs({ name: action.entry.name, volume: Number(action.entry.volume) || 90, pitch: Number(action.entry.pitch) || 100, pan: 0 });
            AudioManager.fadeInBgs(Math.max(0, Number(action.entry.fade) || 0));
        } else if (action.type === 'restore') {
            if (this._saved && this._saved.name) {
                AudioManager.playBgs(this._saved, this._saved.pos);
                AudioManager.fadeInBgs(Math.max(0, Number(action.fade) || 0));
            } else {
                AudioManager.fadeOutBgs(Math.max(0, Number(action.fade) || 0));
            }
            this._saved = null;
        }
    }
};

// Cave echo: a shared delay line that map sound effects and background sounds feed into.
DocsDoodads.SpatialSound.echoBus = function() {
    if (typeof WebAudio === 'undefined' || !WebAudio._context || !WebAudio._masterGainNode) return null;
    if (!this._bus) {
        const c = WebAudio._context;
        const input = c.createGain(), delay = c.createDelay(1.5), feedback = c.createGain();
        input.gain.value = 0;
        input.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(WebAudio._masterGainNode);
        this._bus = { input, delay, feedback };
    }
    return this._bus;
};

DocsDoodads.SpatialSound.updateEcho = function() {
    const params = typeof $gameMap !== 'undefined' && $gameMap ? this.echoFor(DocsDoodads.Lighting.mapSettings($gameMap.mapId())) : null;
    const sig = params ? params.delay + '|' + params.feedback + '|' + params.mix : 'off';
    if (sig === this._echoSig) return;
    const bus = this.echoBus();
    if (!bus) return;
    this._echoSig = sig;
    bus.input.gain.value = params ? params.mix : 0;
    bus.feedback.gain.value = params ? params.feedback : 0;
    bus.delay.delayTime.value = params ? params.delay : 0.2;
};

if (typeof AudioManager !== 'undefined') {
    // Map sound effects and background sounds may echo; music, jingles and menu sounds never do.
    $.AudioManager_createBuffer = AudioManager.createBuffer;
    AudioManager.createBuffer = function(folder, name) {
        const buffer = $.AudioManager_createBuffer.call(this, folder, name);
        if (buffer) buffer._docsEchoable = folder === 'se/' || folder === 'bgs/';
        return buffer;
    };
    $.AudioManager_loadStaticSe = AudioManager.loadStaticSe;
    AudioManager.loadStaticSe = function(se) {
        $.AudioManager_loadStaticSe.call(this, se);
        for (const buffer of this._staticBuffers || []) buffer._docsEchoable = false;
    };
}
if (typeof WebAudio !== 'undefined' && WebAudio.prototype._createPannerNode) {
    $.WebAudio__createPannerNode = WebAudio.prototype._createPannerNode;
    WebAudio.prototype._createPannerNode = function() {
        $.WebAudio__createPannerNode.call(this);
        const bus = this._docsEchoable ? DocsDoodads.SpatialSound.echoBus() : null;
        if (bus && this._pannerNode) this._pannerNode.connect(bus.input);
    };
}

if (typeof Game_Map !== 'undefined') {
    $.Game_Map_update_sound = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        $.Game_Map_update_sound.call(this, sceneActive);
        DocsDoodads.SoundEmitters.update();
        DocsDoodads.RegionSounds.update();
        DocsDoodads.SpatialSound.updateEcho();
    };
}
if (typeof Scene_Map !== 'undefined') {
    // Emitters stop for menus and battles and start again on the map.
    $.Scene_Map_terminate_sound = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        $.Scene_Map_terminate_sound.call(this);
        DocsDoodads.SoundEmitters.stopAll();
    };
}

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    PluginManager.registerCommand(pluginName, 'playSeAt', function(args) {
        const se = { name: String(args.name || ''), volume: Number(args.volume) || 90, pitch: Number(args.pitch) || 100, pan: 0 };
        if (!se.name) return;
        let out;
        if (args.target === 'tile') out = DocsDoodads.SpatialSound.forTile(se, Number(args.x) || 0, Number(args.y) || 0);
        else out = DocsDoodads.SpatialSound.forCharacter(se, DocsDoodads.characterFor(this, args.target, args.eventId));
        if (out) AudioManager.playSe(out);
    });
}

//==========================================================
// SECTION 7H: VISUAL EQUIPMENT & MAP DESTINATION RUNTIME
//==========================================================
DocsDoodads.VisualEquip.settings = function() {
    return DocsDoodads.World.settings().visualEquip;
};

DocsDoodads.VisualEquip.env = function() {
    return {
        switch: id => (typeof $gameSwitches !== 'undefined' && $gameSwitches ? $gameSwitches.value(id) : false),
        variable: id => (typeof $gameVariables !== 'undefined' && $gameVariables ? $gameVariables.value(id) : 0)
    };
};

// Everything an actor wears: actor and class notes, equipment, states, and plugin-command changes.
DocsDoodads.VisualEquip.contextFor = function(actor, extraNotes) {
    const data = typeof actor.actor === 'function' ? actor.actor() : null;
    const cls = typeof actor.currentClass === 'function' ? actor.currentClass() : null;
    const v = actor._docsVisual || {};
    const equips = typeof actor.equips === 'function' ? actor.equips().filter(Boolean).map(e => e.note) : [];
    const states = typeof actor.states === 'function' ? actor.states().map(s => s.note) : [];
    return {
        actorNote: [data && data.note, cls && cls.note].filter(Boolean).join('\n'),
        equipNotes: equips.concat(states, v.notes || []),
        extraNotes: extraNotes || [],
        alias: v.alias || '',
        colors: v.colors || null
    };
};

DocsDoodads.VisualEquip.layersForActor = function(actor, extraNotes) {
    if (!actor) return extraNotes && extraNotes.length ? this.resolve({ extraNotes }, this.env()) : [];
    return this.resolve(this.contextFor(actor, extraNotes), this.env());
};

// An event's note and the comments on its current page.
DocsDoodads.VisualEquip._eventText = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
DocsDoodads.VisualEquip.eventText = function(ev) {
    const cache = this._eventText;
    const hit = cache ? cache.get(ev) : null;
    if (hit && hit.page === ev._pageIndex) return hit.text;
    const lines = [(ev.event() || {}).note || ''];
    const page = typeof ev.page === 'function' ? ev.page() : null;
    for (const cmd of (page && page.list) || []) {
        if (cmd && (cmd.code === 108 || cmd.code === 408) && cmd.parameters) lines.push(String(cmd.parameters[0] || ''));
    }
    const text = lines.join('\n');
    if (cache) cache.set(ev, { page: ev._pageIndex, text });
    return text;
};

// Gear shows while the character uses the actor's own image, so a transformation hides it.
DocsDoodads.VisualEquip.layersForCharacter = function(ch) {
    const s = this.settings();
    if (!s.enabled || !ch) return [];
    const sameImage = actor => actor && ch.characterName() === actor.characterName() && ch.characterIndex() === actor.characterIndex();
    if (typeof Game_Player !== 'undefined' && ch instanceof Game_Player) {
        const leader = $gameParty.leader();
        return sameImage(leader) ? this.layersForActor(leader) : [];
    }
    if (typeof Game_Follower !== 'undefined' && ch instanceof Game_Follower) {
        const actor = ch.actor();
        return s.followers && sameImage(actor) ? this.layersForActor(actor) : [];
    }
    if (typeof Game_Event !== 'undefined' && ch instanceof Game_Event && s.events) {
        // A page without an image (a hidden or removed NPC) shows no gear either.
        if (!ch.event() || !ch.characterName()) return [];
        const text = this.eventText(ch);
        if (!/<\s*visual/i.test(text)) return [];
        const note = this.parseNote(text);
        const actor = note.actorId && typeof $gameActors !== 'undefined' ? $gameActors.actor(note.actorId) : null;
        return this.layersForActor(actor, [text]);
    }
    return [];
};

// A layer sheet recoloured for drawing in windows (cached), or null while it loads.
DocsDoodads.VisualEquip._recolored = new Map();
DocsDoodads.VisualEquip.windowBitmap = function(layer, onReady) {
    const source = ImageManager.loadCharacter(layer.image);
    if (!source.isReady()) {
        if (onReady && !source.isError()) source.addLoadListener(onReady);
        return null;
    }
    if (!layer.hue && (layer.tint === null || layer.tint === undefined)) return source;
    const key = layer.image + '|' + layer.hue + '|' + layer.tint;
    let out = this._recolored.get(key);
    if (out && out._docsSource === source) return out;
    out = new Bitmap(source.width, source.height);
    out.blt(source, 0, 0, source.width, source.height, 0, 0);
    const ctx = out.context;
    const image = ctx.getImageData(0, 0, out.width, out.height);
    this.recolor(image.data, layer.hue, layer.tint);
    ctx.putImageData(image, 0, 0);
    out.baseTexture.update();
    out._docsSource = source;
    if (this._recolored.size > 64) this._recolored.clear();
    this._recolored.set(key, out);
    return out;
};

if (typeof Sprite_Character !== 'undefined' && typeof Sprite !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    const C = DocsDoodads.CharacterAnim;

    $.Sprite_Character_update_visual = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        $.Sprite_Character_update_visual.call(this);
        this.updateDocsVisual();
    };

    Sprite_Character.prototype.updateDocsVisual = function() {
        const ch = this._character;
        const layers = ch && this.parent && !(ch.tileId() > 0) ? VE.layersForCharacter(ch) : [];
        const sig = VE.signature(layers);
        if (sig !== this._docsVisualSig) {
            this._docsVisualSig = sig;
            this.rebuildDocsVisual(layers);
        }
        if (this._docsVisualSprites && this._docsVisualSprites.length) this.updateDocsVisualSprites();
    };

    Sprite_Character.prototype.removeDocsVisual = function() {
        for (const sprite of this._docsVisualSprites || []) {
            if (sprite.parent) sprite.parent.removeChild(sprite);
            sprite.destroy({ children: true });
        }
        this._docsVisualSprites = [];
    };

    Sprite_Character.prototype.rebuildDocsVisual = function(layers) {
        this.removeDocsVisual();
        for (const layer of layers) {
            const sprite = new Sprite(ImageManager.loadCharacter(layer.image));
            sprite.anchor.set(0.5, 1);
            sprite.setHue(layer.hue || 0);
            if (layer.tint !== null && layer.tint !== undefined) sprite.tint = layer.tint;
            sprite._docsLayer = layer;
            this._docsVisualSprites.push(sprite);
        }
    };

    // Bush depth: a translucent lower half, like MZ does for the body.
    Sprite_Character.prototype.docsVisualHalves = function(sprite) {
        if (!sprite._docsUpper) {
            sprite._docsUpper = new Sprite(sprite.bitmap);
            sprite._docsLower = new Sprite(sprite.bitmap);
            sprite._docsUpper.anchor.set(0.5, 1);
            sprite._docsLower.anchor.set(0.5, 1);
            sprite._docsLower.opacity = 128;
            sprite.addChild(sprite._docsUpper);
            sprite.addChild(sprite._docsLower);
        }
        return [sprite._docsUpper, sprite._docsLower];
    };

    Sprite_Character.prototype.updateDocsVisualSprites = function() {
        const ch = this._character;
        const anim = this._docsAnim;
        const facing = anim ? anim.facing : ch.direction();
        const col = anim ? anim.frame : this.characterPatternX();
        const visible = this.visible && !ch.isTransparent();
        // Ties in the tilemap sort break by spriteId: just under or just over the body.
        const order = VE.orderFor(this._docsVisualSprites.map(sp => sp._docsLayer), facing);
        this._docsVisualSprites.forEach((sp, i) => { sp._docsOrder = order[i]; sp._docsZ = VE.zFor(sp._docsLayer, facing); });
        for (const sprite of this._docsVisualSprites) {
            if (sprite.parent !== this.parent) this.parent.addChild(sprite);
            const layer = sprite._docsLayer;
            const bitmap = sprite.bitmap;
            sprite.visible = visible && bitmap.isReady();
            if (!sprite.visible) continue;
            const layout = C.parseName(layer.image);
            const row = C.rowFor(facing, layout.dirs);
            const rect = DocsDoodads.safeFrame(VE.frameRect(layer.image, bitmap.width, bitmap.height,
                layer.index !== null ? layer.index : ch.characterIndex(), col, row.row), bitmap.width, bitmap.height);
            const depth = this._bushDepth > 0 ? Math.min(this._bushDepth, rect.h) : 0;
            if (depth > 0) {
                const [upper, lower] = this.docsVisualHalves(sprite);
                upper.visible = lower.visible = true;
                sprite.setFrame(rect.x, rect.y, 0, rect.h);
                upper.setFrame(rect.x, rect.y, rect.w, rect.h - depth);
                upper.y = -depth;
                lower.setFrame(rect.x, rect.y + rect.h - depth, rect.w, depth);
            } else {
                if (sprite._docsUpper) sprite._docsUpper.visible = sprite._docsLower.visible = false;
                sprite.setFrame(rect.x, rect.y, rect.w, rect.h);
            }
            sprite._docsRect = rect;
            sprite.x = this.x;
            sprite.y = this.y;
            sprite.z = this.z;
            sprite.spriteId = this.spriteId + sprite._docsOrder;
            if (this._docsSortY !== undefined) sprite._docsSortY = this._docsSortY;
            sprite.scale.set(Math.abs(this.scale.x) * (row.mirror ? -1 : 1), this.scale.y);
            sprite.rotation = this.rotation;
            sprite.opacity = this.opacity;
            sprite.blendMode = this.blendMode;
            sprite.setBlendColor(this.getBlendColor());
            sprite.setColorTone(this.getColorTone());
        }
    };

    // A whole-frame texture for a layer (reflections draw it upside down).
    Sprite_Character.prototype.docsVisualTexture = function(sprite) {
        const rect = sprite._docsRect;
        const base = sprite.bitmap && sprite.bitmap.baseTexture;
        if (!rect || !base) return null;
        const last = sprite._docsFullRect;
        if (!sprite._docsFull || !last || last.x !== rect.x || last.y !== rect.y || last.w !== rect.w || last.h !== rect.h) {
            sprite._docsFull = new PIXI.Texture(base, new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h));
            sprite._docsFullRect = rect;
        }
        return sprite._docsFull;
    };
}

if (typeof Sprite_Actor !== 'undefined' && typeof Sprite !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;

    // Side-view battlers: layers from each item's "sv" sheet, in the same cell as the battler.
    $.Sprite_Actor_updateFrame = Sprite_Actor.prototype.updateFrame;
    Sprite_Actor.prototype.updateFrame = function() {
        $.Sprite_Actor_updateFrame.call(this);
        this.updateDocsVisual();
    };

    Sprite_Actor.prototype.updateDocsVisual = function() {
        const s = VE.settings();
        const main = this._mainSprite;
        if (!main) return;
        const layers = s.enabled && s.battlers && this._actor ? VE.layersForActor(this._actor).filter(l => l.sv) : [];
        const sig = VE.signature(layers);
        if (sig !== this._docsVisualSig) {
            this._docsVisualSig = sig;
            for (const sprite of this._docsVisualSprites || []) {
                if (sprite.parent) sprite.parent.removeChild(sprite);
                sprite.destroy();
            }
            this._docsVisualSprites = [];
            let front = 0;
            for (const layer of layers) {
                const sprite = new Sprite(ImageManager.loadSvActor(layer.sv));
                sprite.anchor.set(0.5, 1);
                sprite.setHue(layer.hue || 0);
                if (layer.tint !== null && layer.tint !== undefined) sprite.tint = layer.tint;
                const at = this.children.indexOf(main);
                if (layer.z < 0) this.addChildAt(sprite, at);
                else this.addChildAt(sprite, at + 1 + (front++));
                this._docsVisualSprites.push(sprite);
            }
        }
        const base = main.bitmap;
        for (const sprite of this._docsVisualSprites || []) {
            const bitmap = sprite.bitmap;
            sprite.visible = main.visible && Boolean(base) && base.isReady() && bitmap.isReady() && base.width > 0;
            if (!sprite.visible) continue;
            const rect = DocsDoodads.safeFrame(VE.svRect(bitmap.width, bitmap.height, main._frame, base.width, base.height), bitmap.width, bitmap.height);
            sprite.setFrame(rect.x, rect.y, rect.w, rect.h);
            sprite.x = main.x;
            sprite.y = main.y;
            sprite.scale.set(main.scale.x * base.width / bitmap.width, main.scale.y * base.height / bitmap.height);
            sprite.opacity = main.opacity;
            sprite.blendMode = main.blendMode;
        }
    };
}

// Menus and save files draw the same layers.
if (typeof Window_Base !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    const C = DocsDoodads.CharacterAnim;

    // Draws a character standing and facing down, with its layers; `zoom` scales it up.
    Window_Base.prototype.drawDocsCharacter = function(characterName, characterIndex, x, y, layers, zoom) {
        zoom = zoom || 1;
        const refresh = () => { if (typeof this.refresh === 'function' && !this._destroyed) this.refresh(); };
        const ctx = this.contents.context;
        const smooth = ctx.imageSmoothingEnabled;
        if (zoom !== 1) ctx.imageSmoothingEnabled = false;
        const drawSheet = (bitmap, name, index) => {
            const layout = C.parseName(name);
            const rect = VE.frameRect(name, bitmap.width, bitmap.height, index, C.standingFrame(layout.frames), C.rowFor(2, layout.dirs).row);
            const w = rect.w * zoom, h = rect.h * zoom;
            this.contents.blt(bitmap, rect.x, rect.y, rect.w, rect.h, x - w / 2, y - h, w, h);
        };
        const drawLayers = list => {
            for (const layer of list) {
                const bitmap = VE.windowBitmap(layer, refresh);
                if (bitmap) drawSheet(bitmap, layer.image, layer.index !== null && layer.index !== undefined ? layer.index : characterIndex);
            }
        };
        drawLayers(layers.filter(l => l.z < 0));
        if (characterName) {
            const body = ImageManager.loadCharacter(characterName);
            if (body.isReady()) drawSheet(body, characterName, characterIndex);
            else if (!body.isError()) body.addLoadListener(refresh);
        }
        drawLayers(layers.filter(l => l.z >= 0));
        ctx.imageSmoothingEnabled = smooth;
    };
}

if (typeof Window_StatusBase !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.Window_StatusBase_drawActorCharacter = Window_StatusBase.prototype.drawActorCharacter;
    Window_StatusBase.prototype.drawActorCharacter = function(actor, x, y) {
        const s = VE.settings();
        const layers = s.enabled && s.menus ? VE.layersForActor(actor) : [];
        if (!layers.length) return $.Window_StatusBase_drawActorCharacter.call(this, actor, x, y);
        this.drawDocsCharacter(actor.characterName(), actor.characterIndex(), x, y, layers);
    };
}

// The equip screen shows the actor wearing what is highlighted (try before you equip).
if (typeof Window_EquipStatus !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.Window_EquipStatus_refresh = Window_EquipStatus.prototype.refresh;
    Window_EquipStatus.prototype.refresh = function() {
        $.Window_EquipStatus_refresh.call(this);
        const s = VE.settings();
        const actor = this._tempActor || this._actor;
        if (!actor || !s.enabled || !s.equipPreview) return;
        const layers = VE.layersForActor(actor);
        const all = layers.length || VE.layersForActor(this._actor).length;
        if (!all) return;
        const left = this.itemPadding() + ImageManager.standardFaceWidth;
        const room = this.innerWidth - left;
        if (room < 60) return;
        const zoom = room >= 110 ? 2 : 1;
        this.drawDocsCharacter(actor.characterName(), actor.characterIndex(), left + room / 2, this.lineHeight() + ImageManager.standardFaceHeight, layers, zoom);
    };
}

if (typeof DataManager !== 'undefined') {
    const VE = DocsDoodads.VisualEquip;
    $.DataManager_makeSavefileInfo = DataManager.makeSavefileInfo;
    DataManager.makeSavefileInfo = function() {
        const info = $.DataManager_makeSavefileInfo.call(this);
        const s = VE.settings();
        if (s.enabled && s.menus && typeof $gameParty !== 'undefined' && $gameParty) {
            const lists = VE.savefileLayers($gameParty.battleMembers().map(a => VE.layersForActor(a)));
            if (lists.some(l => l.length)) info.docsVisual = lists;
        }
        return info;
    };
    $.DataManager_loadSavefileImages = DataManager.loadSavefileImages;
    DataManager.loadSavefileImages = function(info) {
        $.DataManager_loadSavefileImages.call(this, info);
        for (const list of (info && info.docsVisual) || []) for (const layer of list || []) ImageManager.loadCharacter(layer.image);
    };
}

if (typeof Window_SavefileList !== 'undefined') {
    $.Window_SavefileList_drawPartyCharacters = Window_SavefileList.prototype.drawPartyCharacters;
    Window_SavefileList.prototype.drawPartyCharacters = function(info, x, y) {
        if (!info.docsVisual || !info.characters) return $.Window_SavefileList_drawPartyCharacters.call(this, info, x, y);
        info.characters.forEach((data, i) => this.drawDocsCharacter(data[0], data[1], x + i * 48, y, info.docsVisual[i] || []));
    };
}

// ---- Map destination ----
DocsDoodads.World.defaults.destination = Object.assign({}, DocsDoodads.Destination.defaults);

DocsDoodads.Destination.current = function() {
    const project = DocsDoodads.World.settings().destination;
    const over = typeof $gameSystem !== 'undefined' && $gameSystem ? $gameSystem._docsDestination || null : null;
    const c = this._current;
    if (c && c.project === project && c.over === over) return c.value;
    const value = this.merge(project, over);
    this._current = { project, over, value };
    return value;
};

if (typeof Sprite_Destination !== 'undefined') {
    const D = DocsDoodads.Destination;

    $.Sprite_Destination_destroy = Sprite_Destination.prototype.destroy;
    Sprite_Destination.prototype.destroy = function(options) {
        this.stopDocsEffect();
        if (this._docsDots && this._docsDots.parent) this._docsDots.parent.removeChild(this._docsDots);
        if (this._docsAnchor && this._docsAnchor.parent) this._docsAnchor.parent.removeChild(this._docsAnchor);
        // Images from img/system are shared through ImageManager's cache; only drawn markers are ours.
        if (!this._docsOwnBitmap) this.bitmap = null;
        $.Sprite_Destination_destroy.call(this, options);
    };

    Sprite_Destination.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const s = D.current();
        this.updateDocsStyle(s);
        this.z = D.zFor(s.layer);
        if (!$gameTemp.isDestinationValid()) {
            this._frameCount = 0;
            this.visible = false;
            this._docsKey = null;
            this.stopDocsEffect();
            if (this._docsDots) this._docsDots.visible = false;
            return;
        }
        const key = $gameTemp.destinationX() + ',' + $gameTemp.destinationY() + ',' + s.style;
        if (key !== this._docsKey) {
            this._docsKey = key;
            this._frameCount = 0;
            this.stopDocsEffect();
        }
        this.updatePosition();
        this._frameCount++;
        const p = D.pulse(s.pulse, this._frameCount);
        const drawn = !['none', 'animation', 'vfx'].includes(s.style);
        this.visible = true;
        this.opacity = drawn ? s.opacity * p.alpha : 0;
        this.scale.set(s.scale * p.scale, s.scale * p.scale);
        this.rotation = D.rotation(s.spin, this._frameCount);
        this.y += D.bob(s.bob, this._frameCount);
        this.blendMode = D.blendMode(s.blend);
        if (s.style === 'image' && this.bitmap && this.bitmap.isReady()) {
            const f = D.imageFrame(s.image, this.bitmap.width, this.bitmap.height, this._frameCount, s.fps);
            this.setFrame(f.x, f.y, f.w, f.h);
        }
        this.updateDocsEffect(s);
        this.updateDocsDots(s);
    };

    // The marker's picture: a shape drawn in its colour, or an image.
    Sprite_Destination.prototype.updateDocsStyle = function(s) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const sig = [s.style, s.color, s.image, tw, th].join('|');
        if (sig === this._docsStyleSig) return;
        this._docsStyleSig = sig;
        if (this._docsOwnBitmap && this.bitmap) this.bitmap.destroy();
        this.tint = 0xffffff;
        if (s.style === 'image') {
            this._docsOwnBitmap = false;
            this.bitmap = s.image ? ImageManager.loadSystem(s.image) : new Bitmap(1, 1);
            this._docsOwnBitmap = !s.image;
            if (s.image) this.tint = parseInt(s.color.slice(1), 16);
        } else {
            this._docsOwnBitmap = true;
            this.bitmap = D.drawMarker(new Bitmap(tw, th), s.style, s.color);
            // An image style leaves its frame behind; drawn markers use the whole bitmap.
            this.setFrame(0, 0, tw, th);
        }
        this.anchor.set(0.5, 0.5);
    };

    Sprite_Destination.prototype.stopDocsEffect = function() {
        if (this._docsAnimation) {
            if (this._docsAnimation.parent) this._docsAnimation.parent.removeChild(this._docsAnimation);
            this._docsAnimation.destroy();
            this._docsAnimation = null;
        }
        if (this._docsVfx) {
            this._docsVfx.done = true;
            this._docsVfx = null;
        }
    };

    // A database animation (looped) or a VFX at the destination.
    Sprite_Destination.prototype.updateDocsEffect = function(s) {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const x = $gameTemp.destinationX(), y = $gameTemp.destinationY();
        if (s.style === 'vfx' && s.vfx) {
            if (!this._docsVfx || this._docsVfx.done) {
                this._docsVfx = DocsDoodads.Vfx.play({ id: s.vfx, x: (x + 0.5) * tw, y: (y + 0.5) * th, loop: true });
            }
            return;
        }
        if (s.style !== 'animation' || !this.parent || typeof $dataAnimations === 'undefined') return;
        const animation = $dataAnimations[s.animationId];
        if (!animation) return;
        if (!this._docsAnchor) {
            // Animations play centred on a tile-high target standing on the tile.
            this._docsAnchor = new Sprite(new Bitmap(1, th));
            this._docsAnchor.anchor.set(0.5, 1);
            this._docsAnchor.opacity = 0;
        }
        if (this._docsAnchor.parent !== this.parent) this.parent.addChild(this._docsAnchor);
        this._docsAnchor.x = ($gameMap.adjustX(x) + 0.5) * tw;
        this._docsAnchor.y = ($gameMap.adjustY(y) + 1) * th;
        this._docsAnchor.z = this.z;
        if (this._docsAnimation && !this._docsAnimation.isPlaying()) this.stopDocsEffect();
        if (!this._docsAnimation) {
            const mv = Boolean(animation.frames);
            const sprite = new (mv ? Sprite_AnimationMV : Sprite_Animation)();
            sprite.targetObjects = [];
            sprite.setup([this._docsAnchor], animation, false, 0, null);
            sprite.z = this.z + 0.01;
            this.parent.addChild(sprite);
            this._docsAnimation = sprite;
        }
    };

    // Dots along the way the player will walk.
    Sprite_Destination.prototype.updateDocsDots = function(s) {
        if (!s.pathDots || !this.parent || typeof PIXI === 'undefined') {
            if (this._docsDots) this._docsDots.visible = false;
            return;
        }
        if (!this._docsDots) {
            this._docsDots = new PIXI.Graphics();
            this._docsDots.z = D.zFor('ground');
            this._docsDots.blendMode = 0;
        }
        const dots = this._docsDots;
        if (dots.parent !== this.parent) this.parent.addChild(dots);
        dots.visible = true;
        const gx = $gameTemp.destinationX(), gy = $gameTemp.destinationY();
        const key = [gx, gy, $gamePlayer.x, $gamePlayer.y, s.dotSpacing].join(',');
        if (key !== this._docsPathKey) {
            this._docsPathKey = key;
            const path = D.path({ x: $gamePlayer.x, y: $gamePlayer.y }, { x: gx, y: gy },
                (nx, ny, fx, fy, d) => $gamePlayer.canPass(fx, fy, d), $gamePlayer.searchLimit(),
                { wrap: (nx, ny) => ({ x: $gameMap.roundX(nx), y: $gameMap.roundY(ny) }), distance: (ax, ay, bx, by) => $gameMap.distance(ax, ay, bx, by) });
            this._docsDotTiles = D.dots(path, s.dotSpacing);
        }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const color = parseInt(s.dotColor.slice(1), 16);
        const r = Math.max(3, Math.min(tw, th) * 0.11);
        dots.clear();
        (this._docsDotTiles || []).forEach((t, i) => {
            const fade = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin((this._frameCount - i * 6) / 60 * Math.PI * 2));
            dots.beginFill(color, fade);
            dots.drawCircle(($gameMap.adjustX(t.x) + 0.5) * tw, ($gameMap.adjustY(t.y) + 0.5) * th, r);
            dots.endFill();
        });
    };
}

DocsDoodads.Destination.drawMarker = function(bitmap, style, color) {
    const w = bitmap.width, h = bitmap.height, ctx = bitmap.context;
    const r = Math.min(w, h) / 2;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (style === 'default') {
        ctx.fillRect(0, 0, w, h);
    } else if (style === 'square') {
        const inset = 4, rad = Math.min(10, r / 2);
        ctx.moveTo(inset + rad, inset);
        ctx.arcTo(w - inset, inset, w - inset, h - inset, rad);
        ctx.arcTo(w - inset, h - inset, inset, h - inset, rad);
        ctx.arcTo(inset, h - inset, inset, inset, rad);
        ctx.arcTo(inset, inset, w - inset, inset, rad);
        ctx.fill();
    } else if (style === 'circle') {
        ctx.arc(w / 2, h / 2, r - 3, 0, Math.PI * 2);
        ctx.fill();
    } else if (style === 'ring') {
        ctx.lineWidth = Math.max(3, r * 0.18);
        ctx.arc(w / 2, h / 2, r - ctx.lineWidth, 0, Math.PI * 2);
        ctx.stroke();
    } else if (style === 'diamond') {
        ctx.moveTo(w / 2, 3);
        ctx.lineTo(w - 3, h / 2);
        ctx.lineTo(w / 2, h - 3);
        ctx.lineTo(3, h / 2);
        ctx.closePath();
        ctx.fill();
    } else if (style === 'cross') {
        ctx.lineWidth = Math.max(4, r * 0.25);
        const a = r * 0.45;
        ctx.moveTo(w / 2 - a, h / 2 - a);
        ctx.lineTo(w / 2 + a, h / 2 + a);
        ctx.moveTo(w / 2 + a, h / 2 - a);
        ctx.lineTo(w / 2 - a, h / 2 + a);
        ctx.stroke();
    } else if (style === 'arrow') {
        // Pointing down at the tile.
        ctx.moveTo(w / 2, h * 0.9);
        ctx.lineTo(w * 0.15, h * 0.45);
        ctx.lineTo(w * 0.36, h * 0.45);
        ctx.lineTo(w * 0.36, h * 0.1);
        ctx.lineTo(w * 0.64, h * 0.1);
        ctx.lineTo(w * 0.64, h * 0.45);
        ctx.lineTo(w * 0.85, h * 0.45);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    bitmap.baseTexture.update();
    return bitmap;
};

// Plugin commands.
DocsDoodads.VisualEquip.actorFor = function(args) {
    if (typeof $gameActors === 'undefined' || !$gameActors) return null;
    if (String(args.actor) === 'leader') return $gameParty.leader();
    return $gameActors.actor(Number(args.actorId) || 0);
};

if (typeof PluginManager !== 'undefined' && typeof PluginManager.registerCommand === 'function') {
    const VE = DocsDoodads.VisualEquip;
    const visual = actor => (actor._docsVisual = actor._docsVisual || {});
    PluginManager.registerCommand(pluginName, 'setVisualAlias', function(args) {
        const actor = VE.actorFor(args);
        if (actor) visual(actor).alias = String(args.alias || '').trim();
    });
    PluginManager.registerCommand(pluginName, 'addVisualLayer', function(args) {
        const actor = VE.actorFor(args);
        const image = String(args.image || '').trim();
        if (!actor || !image) return;
        const part = String(args.part || '').trim() || image;
        const v = visual(actor);
        v.notes = (v.notes || []).filter(n => VE.parseNote(n).layers.every(l => String(l.part).toLowerCase() !== part.toLowerCase()));
        const sv = String(args.sv || '').trim();
        v.notes.push(`<visual: ${image}, z ${Number(args.z) || 0}, part ${part}${sv ? ', sv ' + sv : ''}>`);
    });
    PluginManager.registerCommand(pluginName, 'removeVisualLayer', function(args) {
        const actor = VE.actorFor(args);
        const part = String(args.part || '').trim().toLowerCase();
        if (!actor || !actor._docsVisual) return;
        const v = actor._docsVisual;
        v.notes = part ? (v.notes || []).filter(n => VE.parseNote(n).layers.every(l => String(l.part).toLowerCase() !== part && String(l.image).toLowerCase() !== part)) : [];
    });
    PluginManager.registerCommand(pluginName, 'setVisualColor', function(args) {
        const actor = VE.actorFor(args);
        const part = String(args.part || '').trim();
        if (!actor || !part) return;
        const v = visual(actor);
        v.colors = Object.assign({}, v.colors);
        const tint = /^#?([0-9a-f]{6})$/i.exec(String(args.tint || '').trim());
        if (String(args.reset) === 'true') delete v.colors[part];
        else v.colors[part] = { hue: Number(args.hue) || 0, tint: tint ? parseInt(tint[1], 16) : null };
    });
    PluginManager.registerCommand(pluginName, 'setDestination', function(args) {
        if (typeof $gameSystem === 'undefined' || !$gameSystem) return;
        if (String(args.reset) === 'true') {
            $gameSystem._docsDestination = null;
            return;
        }
        const next = Object.assign({}, $gameSystem._docsDestination);
        const text = ['style', 'color', 'blend', 'pulse', 'layer', 'image', 'vfx', 'dotColor'];
        const numbers = ['opacity', 'scale', 'spin', 'bob', 'fps'];
        for (const key of text) if (String(args[key] || '').trim() !== '') next[key] = String(args[key]).trim();
        for (const key of numbers) if (String(args[key] === undefined ? '' : args[key]).trim() !== '') next[key] = Number(args[key]);
        if (Number(args.animationId) > 0) next.animationId = Number(args.animationId);
        if (args.pathDots === 'on' || args.pathDots === 'off') next.pathDots = args.pathDots === 'on';
        // A new object, so the cached marker settings refresh.
        $gameSystem._docsDestination = next;
    });
}

//==========================================================
// SECTION 8: DocsDoodads.CORE & DIAGNOSTICS
//==========================================================
DocsDoodads.Core = {
    version: pluginVersion,
    events: {},

    on(event, handler) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(handler);
    },

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(fn => fn(data));
        }
    },

    log() {
        if (devDiagnostics) {
            console.log("[DocsDoodads]", ...arguments);
        }
    }
};

//==========================================================
// SECTION 9: DocsDoodads.COMPAT (MZ & MV ABSTRACTION)
//==========================================================
DocsDoodads.Compat = {
    isMZ() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MZ";
    },
    isMV() {
        return typeof Utils !== 'undefined' && Utils.RPGMAKER_NAME === "MV";
    },
    isNwjs() {
        return typeof Utils !== 'undefined' && typeof Utils.isNwjs === 'function' ? Utils.isNwjs() : (typeof require !== 'undefined');
    },
    isTest() {
        return typeof Utils !== 'undefined' && typeof Utils.isOptionValid === 'function' ? Utils.isOptionValid("test") : true;
    },
    tileSize() {
        if (typeof $gameMap !== 'undefined' && $gameMap && $gameMap.tileWidth) {
            return $gameMap.tileWidth();
        }
        return 48;
    },
    createRectangle(x, y, w, h) {
        if (typeof Rectangle !== 'undefined') {
            return new Rectangle(x, y, w, h);
        }
        return { x: x, y: y, width: w, height: h };
    },
    createWindow(WindowClass, x, y, w, h) {
        if (this.isMZ()) {
            return new WindowClass(this.createRectangle(x, y, w, h));
        } else {
            return new WindowClass(x, y, w, h);
        }
    },
    getCanvas() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.view) return Graphics.app.view;
            if (Graphics._canvas) return Graphics._canvas;
        }
        if (typeof document !== 'undefined') {
            return document.getElementById('GameCanvas') || document.querySelector('canvas');
        }
        return null;
    },
    getStage() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.stage) return Graphics.app.stage;
            if (Graphics._stage) return Graphics._stage;
        }
        return null;
    },
    getRenderer() {
        if (typeof Graphics !== 'undefined') {
            if (Graphics.app && Graphics.app.renderer) return Graphics.app.renderer;
            if (Graphics._renderer) return Graphics._renderer;
        }
        return null;
    },
    boxWidth() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxWidth || Graphics.width || 816;
        }
        return 816;
    },
    boxHeight() {
        if (typeof Graphics !== 'undefined') {
            return Graphics.boxHeight || Graphics.height || 624;
        }
        return 624;
    },
    loadBitmap(folder, filename, hue = 0, smooth = true) {
        if (typeof ImageManager === 'undefined') return null;
        if (this.isMZ()) {
            return ImageManager.loadBitmap(folder, filename);
        }
        return ImageManager.loadBitmap(folder, filename, hue, smooth);
    },
    featureMatrix: {
        assetDrawer: { mz: true, mv: true, browser: "Read-only" },
        autoSlicer: { mz: true, mv: true, browser: true },
        slicerModal: { mz: true, mv: true, browser: true },
        realEvents: { mz: true, mv: true, browser: false },
        collisionSAT: { mz: true, mv: true, browser: true },
        audioPreview: { mz: true, mv: true, browser: true },
        explorerImport: { mz: true, mv: true, browser: false }
    }
};

//==========================================================
// SECTION 10: DocsDoodads.FS (FILESYSTEM, ATOMIC WRITES, BACKUPS)
//==========================================================
DocsDoodads.FS = {
    fs: (typeof require !== 'undefined') ? require('fs') : null,
    path: (typeof require !== 'undefined') ? require('path') : null,

    existsSync(filePath) {
        return this.fs && this.fs.existsSync(filePath);
    },

    readFileSync(filePath, encoding = 'utf8') {
        return this.fs ? this.fs.readFileSync(filePath, encoding) : null;
    },

    writeFileSync(filePath, data, encoding = 'utf8') {
        if (!this.fs) return;
        this.fs.writeFileSync(filePath, data, encoding);
    },

    atomicWriteJson(filePath, data, indent = 2) {
        if (!this.fs || !this.path) return false;
        const dir = this.path.dirname(filePath);
        if (!this.existsSync(dir)) {
            this.mkdirp(dir);
        }
        const tmpPath = filePath + '.tmp';
        const jsonStr = indent ? JSON.stringify(data, null, indent) : JSON.stringify(data);
        try {
            JSON.parse(jsonStr);
        } catch(e) {
            console.error("[DocsDoodads.FS] Validation failed for atomic JSON write:", e);
            return false;
        }
        try {
            this.fs.writeFileSync(tmpPath, jsonStr, 'utf8');
            this.fs.renameSync(tmpPath, filePath);
            return true;
        } catch(e) {
            // e.g. a read-only target: keep the original file and do not leave the temp copy behind.
            console.error(`[DocsDoodads.FS] Could not write ${filePath}:`, e);
            try { if (this.existsSync(tmpPath)) this.fs.unlinkSync(tmpPath); } catch(cleanupError) {}
            return false;
        }
    },

    createTimestampedBackup(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path || !this.existsSync(filePath)) return null;
        const cacheDir = backupDirectory;
        if (!this.existsSync(cacheDir)) {
            this.mkdirp(cacheDir);
        }
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const baseName = this.path.basename(filePath);
        let backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.bak`);
        let suffix = 0;
        while (this.existsSync(backupPath)) {
            suffix++;
            backupPath = this.path.join(cacheDir, `${baseName}.${stamp}.${suffix}.bak`);
        }
        this.fs.copyFileSync(filePath, backupPath);
        this.pruneBackups(cacheDir, baseName, backupRetentionCount);
        return backupPath;
    },

    pruneBackups(dir, prefix, maxCount) {
        if (!this.fs || !this.path || !this.existsSync(dir)) return;
        const files = this.fs.readdirSync(dir)
            .filter(f => f.startsWith(prefix) && f.endsWith('.bak'))
            .map(f => ({ name: f, time: this.fs.statSync(this.path.join(dir, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time);
        while (files.length > maxCount) {
            const toRemove = files.pop();
            try { this.fs.unlinkSync(this.path.join(dir, toRemove.name)); } catch(e) {}
        }
    },

    findLatestBackup(filePath) {
        if (!this.fs || !this.path) return null;
        const baseName = this.path.basename(filePath);
        const backups = [];
        for (const cacheDir of ['data/docs_doodads_cache/backups', DocsDoodads.Legacy.backupDirectory]) {
            if (!this.existsSync(cacheDir)) continue;
            for (const f of this.fs.readdirSync(cacheDir)) {
                if (f.startsWith(baseName) && f.endsWith('.bak')) {
                    backups.push({ path: this.path.join(cacheDir, f), time: this.fs.statSync(this.path.join(cacheDir, f)).mtimeMs });
                }
            }
        }
        backups.sort((a, b) => b.time - a.time);
        return backups.length > 0 ? backups[0].path : null;
    },

    listBackups(filePath, backupDirectory = 'data/docs_doodads_cache/backups') {
        if (!this.fs || !this.path) return [];
        const baseName = this.path.basename(filePath);
        const directories = [backupDirectory];
        if (backupDirectory === 'data/docs_doodads_cache/backups') directories.push(DocsDoodads.Legacy.backupDirectory);
        const backups = [];
        for (const directory of directories) {
            if (!this.existsSync(directory)) continue;
            for (const fileName of this.fs.readdirSync(directory)) {
                if (!fileName.startsWith(baseName + '.') || !fileName.endsWith('.bak')) continue;
                const backupPath = this.path.join(directory, fileName);
                const stat = this.fs.statSync(backupPath);
                backups.push({ path: backupPath, name: fileName, mtimeMs: stat.mtimeMs, size: stat.size });
            }
        }
        return backups.sort((a, b) => b.mtimeMs - a.mtimeMs);
    },

    atomicWriteManyJson(entries, options = {}) {
        const result = { ok: false, committed: [], error: null, rolledBack: false };
        if (!this.fs || !this.path || !Array.isArray(entries) || entries.length === 0) {
            result.error = 'No writable JSON entries were supplied.';
            return result;
        }

        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const prepared = [];
        const seenTargets = new Set();
        const rollbackRecords = [];
        try {
            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                if (!entry || !entry.path) throw new Error(`Entry ${index} has no target path.`);
                const targetPath = this.path.resolve(entry.path);
                const targetKey = typeof process !== 'undefined' && process.platform === 'win32' ? targetPath.toLowerCase() : targetPath;
                if (seenTargets.has(targetKey)) throw new Error(`Duplicate transaction target: ${entry.path}`);
                seenTargets.add(targetKey);

                const indent = entry.indent === undefined ? 2 : entry.indent;
                const json = indent ? JSON.stringify(entry.data, null, indent) : JSON.stringify(entry.data);
                JSON.parse(json);
                this.ensureDir(this.path.dirname(targetPath));
                const temporary = `${targetPath}.ddtxn-${transactionId}-${index}.tmp`;
                this.fs.writeFileSync(temporary, json, 'utf8');
                prepared.push({ targetPath, temporary, existed: this.existsSync(targetPath), rollback: null });
            }

            for (let index = 0; index < prepared.length; index++) {
                const item = prepared[index];
                if (item.existed) {
                    item.rollback = `${item.targetPath}.ddtxn-${transactionId}-${index}.rollback`;
                    this.fs.copyFileSync(item.targetPath, item.rollback);
                }
                if (typeof options.beforeCommit === 'function') options.beforeCommit(index, entries[index]);
                this.fs.renameSync(item.temporary, item.targetPath);
                // Only files that were actually replaced need restoring if a later file fails.
                rollbackRecords.push(item);
                result.committed.push(item.targetPath);
            }

            for (const item of rollbackRecords) {
                if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            for (let index = rollbackRecords.length - 1; index >= 0; index--) {
                const item = rollbackRecords[index];
                try {
                    if (item.existed && item.rollback && this.existsSync(item.rollback)) {
                        this.fs.copyFileSync(item.rollback, item.targetPath);
                    } else if (!item.existed && this.existsSync(item.targetPath)) {
                        this.fs.unlinkSync(item.targetPath);
                    }
                } catch (rollbackError) {
                    result.error += `; rollback failed for ${item.targetPath}: ${rollbackError.message || rollbackError}`;
                }
            }
            for (const item of prepared) {
                try { if (this.existsSync(item.temporary)) this.fs.unlinkSync(item.temporary); } catch (cleanupError) {}
                try { if (item.rollback && this.existsSync(item.rollback)) this.fs.unlinkSync(item.rollback); } catch (cleanupError) {}
            }
            result.committed = [];
            result.rolledBack = rollbackRecords.length > 0;
            return result;
        }
    },

    restoreBackup(filePath, backupPath, options = {}) {
        const result = { ok: false, restoredFrom: null, safetyBackup: null, error: null };
        if (!this.fs || !this.path) {
            result.error = 'Filesystem access is unavailable.';
            return result;
        }
        try {
            const backupDirectory = this.path.resolve(options.backupDir || 'data/docs_doodads_cache/backups');
            // listBackups also offers backups made by QJ-Doodads builds, so those must be restorable too.
            const allowedDirectories = [backupDirectory];
            if (!options.backupDir) allowedDirectories.push(this.path.resolve(DocsDoodads.Legacy.backupDirectory));
            const resolvedBackup = this.path.resolve(backupPath);
            const resolvedTarget = this.path.resolve(filePath);
            const expectedPrefix = this.path.basename(resolvedTarget) + '.';
            if (!allowedDirectories.includes(this.path.dirname(resolvedBackup)) ||
                !this.path.basename(resolvedBackup).startsWith(expectedPrefix) ||
                !resolvedBackup.endsWith('.bak')) {
                throw new Error('Selected backup does not belong to the target file.');
            }
            if (!this.existsSync(resolvedBackup)) throw new Error('Selected backup no longer exists.');

            const restoredData = JSON.parse(this.readFileSync(resolvedBackup, 'utf8'));
            result.safetyBackup = this.createTimestampedBackup(resolvedTarget, backupDirectory);
            const writeResult = this.atomicWriteManyJson([{ path: resolvedTarget, data: restoredData, indent: 2 }]);
            if (!writeResult.ok) throw new Error(writeResult.error || 'Restore write failed.');
            result.ok = true;
            result.restoredFrom = resolvedBackup;
            return result;
        } catch (error) {
            result.error = error && error.message ? error.message : String(error);
            return result;
        }
    },

    ensureDir(dirPath) {
        return this.mkdirp(dirPath);
    },

    mkdirp(dirPath) {
        if (!this.fs || !this.path) return;
        if (this.fs.existsSync(dirPath)) return;
        const parent = this.path.dirname(dirPath);
        if (!this.fs.existsSync(parent)) this.mkdirp(parent);
        this.fs.mkdirSync(dirPath);
    },

    readJson(filePath) {
        try {
            if (!this.existsSync(filePath)) {
                const legacyPath = DocsDoodads.Legacy.pathFor(filePath);
                if (!legacyPath || !this.existsSync(legacyPath)) return null;
                filePath = legacyPath;
            }
            return JSON.parse(this.readFileSync(filePath, 'utf8'));
        } catch(e) {
            console.warn(`[DocsDoodads.FS] Corrupt JSON encountered reading ${filePath}:`, e);
            const fallback = this.findLatestBackup(filePath);
            if (fallback) {
                try {
                    const recovered = JSON.parse(this.readFileSync(fallback, 'utf8'));
                    console.warn(`[DocsDoodads.FS] Automatically recovered ${filePath} from backup ${fallback}`);
                    this.recoveryNotices.push(`${filePath} was unreadable; loaded backup ${this.path.basename(fallback)}. Save to repair it.`);
                    return recovered;
                } catch(e2) {}
            }
            this.recoveryNotices.push(`${filePath} was unreadable and no backup exists; defaults were used.`);
            return null;
        }
    },

    // Unreadable-file fallbacks waiting to be shown to the user.
    recoveryNotices: [],

    takeRecoveryNotices() {
        const notices = this.recoveryNotices.slice();
        this.recoveryNotices.length = 0;
        return notices;
    },

    stat(filePath) {
        if (!this.fs || !this.existsSync(filePath)) return null;
        const s = this.fs.statSync(filePath);
        return { size: s.size, mtimeMs: s.mtimeMs };
    }
};

//==========================================================
// SECTION 11: DocsDoodads.ASSETINDEX & METADATA CACHE
//==========================================================
DocsDoodads.AssetIndex = {
    libraryPath: 'data/DocsDoodadsLibrary.json',
    supportedExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp', '.ogg', '.m4a', '.wav']),
    roots: [
        'img/characters', 'img/doodads', 'img/tilesets', 'img/pictures',
        'img/animations', 'img/battlebacks1', 'img/battlebacks2', 'img/enemies',
        'img/faces', 'img/parallaxes', 'img/sv_actors', 'img/sv_enemies',
        'img/system', 'img/titles1', 'img/titles2',
        'audio/bgm', 'audio/bgs', 'audio/me', 'audio/se'
    ],
    data: {
        version: 1,
        projectId: "docs_doodads_project",
        generatedAt: 0,
        assets: {},
        collections: {},
        settings: {}
    },
    list: [],
    // Bump when indexFile derives new fields so unchanged files are re-indexed once.
    entryRevision: 4,

    init() {
        const loaded = DocsDoodads.FS.readJson(this.libraryPath);
        if (loaded && loaded.version === 1) {
            this.data = loaded;
        }
        this.rebuildList();
    },

    rebuildList() {
        this.list = Object.values(this.data.assets);
    },

    isEntryCurrent(existing, stat) {
        return Boolean(existing && existing.mtimeMs === stat.mtimeMs && existing.sizeBytes === stat.size &&
            existing.entryRevision === this.entryRevision);
    },

    // Reads width/height from the PNG IHDR chunk without decoding the image.
    readImageSize(fullPath) {
        const fs = DocsDoodads.FS.fs;
        let fd = null;
        try {
            fd = fs.openSync(fullPath, 'r');
            const header = Buffer.alloc(24);
            if (fs.readSync(fd, header, 0, 24, 0) < 24) return null;
            const isPng = header.readUInt32BE(0) === 0x89504e47 && header.toString('ascii', 12, 16) === 'IHDR';
            if (!isPng) return null;
            return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
        } catch (error) {
            return null;
        } finally {
            if (fd !== null) {
                try { fs.closeSync(fd); } catch (error) {}
            }
        }
    },

    isIgnoredDirectory(name) {
        return name === '_packed' || String(name).startsWith('.');
    },

    isSupportedAssetFile(filePath) {
        if (!DocsDoodads.FS.path) return false;
        return this.supportedExtensions.has(DocsDoodads.FS.path.extname(filePath).toLowerCase());
    },

    scan() {
        if (!DocsDoodads.FS.fs) return;
        this.init();
        for (const r of this.roots) {
            this.scanDirectory(r);
        }
        this.save();
        this.rebuildList();
    },

    async scanAsync(options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const result = { cancelled: false, discovered: 0, indexed: 0, unchanged: 0, removed: 0, errors: [] };
        if (!fs || !path || !fs.promises) {
            result.errors.push('Filesystem access is unavailable.');
            return result;
        }
        if (options.loadCache !== false) this.init();

        const projectRoot = path.resolve(options.projectRoot || '.');
        const roots = (options.roots || this.roots)
            .map(root => String(root).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, ''));
        const batchSize = Math.max(1, options.batchSize || 100);
        const cancellationToken = options.cancellationToken || null;
        const isCancelled = () => Boolean(cancellationToken && (cancellationToken.cancelled || cancellationToken.isCancelled));
        const files = [];
        const directories = roots.map(root => ({ absolute: path.resolve(projectRoot, root), relative: root }));

        while (directories.length > 0) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const directory = directories.pop();
            try {
                const entries = await fs.promises.readdir(directory.absolute, { withFileTypes: true });
                entries.sort((a, b) => a.name.localeCompare(b.name));
                for (const entry of entries) {
                    const absolute = path.join(directory.absolute, entry.name);
                    const relative = `${directory.relative}/${entry.name}`.replace(/\\/g, '/');
                    if (entry.isDirectory()) {
                        if (!this.isIgnoredDirectory(entry.name)) directories.push({ absolute, relative });
                    }
                    else if (entry.isFile() && this.isSupportedAssetFile(entry.name)) files.push({ absolute, relative });
                }
            } catch (error) {
                if (!error || error.code !== 'ENOENT') result.errors.push(`${directory.relative}: ${error.message || error}`);
            }
            if (directories.length % batchSize === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }

        files.sort((a, b) => a.relative.localeCompare(b.relative));
        result.discovered = files.length;
        const seen = new Set();
        for (let index = 0; index < files.length; index++) {
            if (isCancelled()) { result.cancelled = true; return result; }
            const file = files[index];
            const assetPath = file.relative.replace(/\\/g, '/');
            const assetId = assetPath.toLowerCase();
            seen.add(assetId);
            try {
                const stat = await fs.promises.stat(file.absolute);
                const existing = this.data.assets[assetId];
                if (this.isEntryCurrent(existing, stat)) {
                    result.unchanged++;
                } else {
                    this.indexFile(file.absolute, path.basename(file.absolute), path.extname(file.absolute).toLowerCase(), assetPath, stat);
                    result.indexed++;
                }
            } catch (error) {
                result.errors.push(`${assetPath}: ${error.message || error}`);
            }
            if ((index + 1) % batchSize === 0 || index === files.length - 1) {
                if (typeof options.onProgress === 'function') {
                    options.onProgress({ completed: index + 1, total: files.length, path: assetPath });
                }
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        const rootPrefixes = roots.map(root => root.toLowerCase() + '/');
        for (const [assetId, asset] of Object.entries(this.data.assets)) {
            const normalizedPath = String(asset.path || assetId).replace(/\\/g, '/').toLowerCase();
            const inScannedRoot = rootPrefixes.some(prefix => normalizedPath.startsWith(prefix));
            if (inScannedRoot && !seen.has(assetId.toLowerCase())) {
                delete this.data.assets[assetId];
                result.removed++;
                for (const collection of Object.values(this.data.collections || {})) {
                    if (Array.isArray(collection)) {
                        const collectionIndex = collection.indexOf(assetId);
                        if (collectionIndex >= 0) collection.splice(collectionIndex, 1);
                    }
                }
            }
        }

        this.data.generatedAt = Date.now();
        this.rebuildList();
        if (options.save !== false) {
            const target = options.projectRoot
                ? path.join(projectRoot, options.libraryPath || this.libraryPath)
                : (options.libraryPath || this.libraryPath);
            DocsDoodads.FS.atomicWriteJson(target, this.data);
        }
        return result;
    },

    scanDirectory(dirPath) {
        const fs = DocsDoodads.FS.fs, path = DocsDoodads.FS.path;
        if (!fs || !fs.existsSync(dirPath)) return;
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const ent of entries) {
            const fullPath = path.join(dirPath, ent.name).replace(/\\/g, '/');
            if (ent.isDirectory()) {
                if (!this.isIgnoredDirectory(ent.name)) this.scanDirectory(fullPath);
            } else if (ent.isFile()) {
                const ext = path.extname(ent.name).toLowerCase();
                if (this.isSupportedAssetFile(ent.name)) {
                    this.indexFile(fullPath, ent.name, ext);
                }
            }
        }
    },

    indexFile(fullPath, fileName, ext, assetPath = fullPath, knownStat = null) {
        const fs = DocsDoodads.FS.fs;
        const stat = knownStat || fs.statSync(fullPath);
        const normalizedAssetPath = String(assetPath).replace(/\\/g, '/');
        const assetId = normalizedAssetPath.toLowerCase();

        let existing = this.data.assets[assetId];
        if (this.isEntryCurrent(existing, stat)) {
            return;
        }

        const category = this.detectCategory(normalizedAssetPath);
        const autoTags = this.generateAutoTags(normalizedAssetPath, fileName);
        const assetType = this.detectAssetType(normalizedAssetPath, fileName, ext);

        const newEntry = {
            id: assetId,
            path: normalizedAssetPath,
            type: assetType,
            category: category,
            fileName: fileName,
            extension: ext,
            mtimeMs: stat.mtimeMs,
            sizeBytes: stat.size,
            entryRevision: this.entryRevision,
            width: 0,
            height: 0,
            tags: existing ? existing.tags : [],
            autoTags: autoTags,
            favorite: existing ? existing.favorite : false,
            collections: existing ? existing.collections : [],
            slice: existing && existing.slice ? existing.slice : {
                status: "none",
                method: "none",
                confidence: 1.0,
                regions: []
            },
            placement: existing && existing.placement ? existing.placement : {
                defaultMode: assetType === 'character_sheet' ? 'event' : 'doodad'
            },
            collision: existing && existing.collision ? existing.collision : {
                preset: "none",
                shape: null
            },
            usage: existing && existing.usage ? existing.usage : { lastUsedAt: 0, useCount: 0 }
        };

        if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
            const size = this.readImageSize(fullPath);
            if (size) {
                newEntry.width = size.width;
                newEntry.height = size.height;
            }
            // Hand-edited slices are the user's work; detection only fills in slices that are not manual.
            const isManual = Boolean(existing && existing.slice && existing.slice.status === 'manual');
            if (!isManual) {
                const metadata = DocsDoodads.Slicing.Metadata.parse(fullPath);
                const known = metadata ? null : DocsDoodads.Slicing.Known.detect(newEntry);
                if (metadata) {
                    newEntry.slice = metadata;
                } else if (known) {
                    newEntry.slice = known;
                    newEntry.width = known.width;
                    newEntry.height = known.height;
                }
            }
        }

        this.data.assets[assetId] = newEntry;
    },

    detectCategory(filePath) {
        const lower = filePath.toLowerCase();
        if (lower.includes('img/characters')) return 'Characters';
        if (lower.includes('img/doodads')) return 'Doodads';
        if (lower.includes('img/tilesets')) return 'Tilesets';
        if (lower.includes('img/pictures')) return 'Pictures';
        if (lower.includes('img/faces')) return 'Faces';
        if (/img\/(enemies|sv_enemies|sv_actors)\//.test(lower)) return 'Battlers';
        if (/img\/(battlebacks1|battlebacks2|parallaxes|titles1|titles2)\//.test(lower)) return 'Backgrounds';
        if (lower.includes('img/system')) return 'System';
        if (lower.includes('audio/')) return 'Audio';
        return 'Other';
    },

    generateAutoTags(filePath, fileName) {
        const parts = filePath.toLowerCase().replace(/\\/g, '/').split('/');
        const tags = new Set();
        for (const p of parts) {
            if (!['img', 'audio', fileName.toLowerCase()].includes(p)) {
                tags.add(p);
            }
        }
        const nameParts = fileName.replace(/\.[^/.]+$/, "").split(/[ _-]+/);
        for (const np of nameParts) {
            if (np.length > 1) tags.add(np.toLowerCase());
        }
        return Array.from(tags);
    },

    detectAssetType(filePath, fileName, ext) {
        if (['.ogg', '.m4a', '.wav'].includes(ext)) return 'audio';
        if (filePath.includes('img/characters')) {
            return fileName.startsWith('$') ? 'single_character' : 'character_sheet';
        }
        if (filePath.includes('img/tilesets')) return 'tileset';
        if (filePath.includes('img/faces')) return 'faceset';
        return 'doodad';
    },

    save() {
        DocsDoodads.FS.atomicWriteJson(this.libraryPath, this.data);
    },

    // Accepts "a, b ,a" style input; stores lowercase, trimmed, de-duplicated tags.
    setTags(assetId, input) {
        const asset = this.data.assets[assetId];
        if (!asset) return;
        const raw = Array.isArray(input) ? input : String(input || '').split(',');
        asset.tags = [...new Set(raw.map(t => String(t).trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean))];
        this.save();
    },

    toggleFavorite(assetId) {
        if (this.data.assets[assetId]) {
            this.data.assets[assetId].favorite = !this.data.assets[assetId].favorite;
            this.save();
        }
    },

    recordUsage(assetId) {
        if (this.data.assets[assetId]) {
            const u = this.data.assets[assetId].usage;
            u.useCount = (u.useCount || 0) + 1;
            u.lastUsedAt = Date.now();
            this.save();
        }
    },

    createCollection(name) {
        this.data.collections = this.data.collections || {};
        if (!this.data.collections[name]) {
            this.data.collections[name] = [];
            this.save();
        }
    },

    deleteCollection(name) {
        if (this.data.collections && this.data.collections[name]) {
            delete this.data.collections[name];
            for (const a of this.list) {
                if (a.collections) {
                    a.collections = a.collections.filter(c => c !== name);
                }
            }
            this.save();
        }
    },

    addAssetToCollection(assetId, name) {
        this.createCollection(name);
        const asset = this.data.assets[assetId];
        if (asset) {
            asset.collections = asset.collections || [];
            if (!asset.collections.includes(name)) {
                asset.collections.push(name);
                if (!this.data.collections[name].includes(assetId)) {
                    this.data.collections[name].push(assetId);
                }
                this.save();
            }
        }
    },

    removeAssetFromCollection(assetId, name) {
        const asset = this.data.assets[assetId];
        if (asset && asset.collections) {
            asset.collections = asset.collections.filter(c => c !== name);
        }
        if (this.data.collections && this.data.collections[name]) {
            this.data.collections[name] = this.data.collections[name].filter(id => id !== assetId);
        }
        this.save();
    },

    getCollections() {
        return Object.keys(this.data.collections || {});
    }
};

//==========================================================
// SECTION 11B: ASSET MANAGEMENT (USAGE, FINGERPRINTS, LIVE RELOAD, PACKING)
//==========================================================
// Where every file is used. RPG Maker refers to most files by name inside a fixed folder
// ("name" references); doodads and prefabs store a full path ("path" references).
DocsDoodads.Usage = {
    lastIndex: null,

    keyOf(filePath) {
        return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\.[^/.]+$/, '').toLowerCase();
    },

    folderOf(key) {
        const i = key.lastIndexOf('/');
        return i >= 0 ? key.slice(0, i) : '';
    },

    isEngineReserved(asset) {
        return /^img\/system\//i.test(String(asset && asset.path || '').replace(/\\/g, '/'));
    },

    // Calls fn(ref) for every reference; ref.set(value) rewrites it (a bare name or a full path).
    visitSources(sources, fn) {
        const named = (folder, holder, field, source, label, display) => {
            const name = holder ? holder[field] : null;
            if (!name || typeof name !== 'string') return;
            fn({ key: `${folder}/${name}`.toLowerCase(), kind: 'name', folder, source, label, display: Boolean(display),
                set: value => { holder[field] = value; } });
        };
        const audio = (folder, holder, source, label, display) => named(folder, holder, 'name', source, label, display);
        const routeCommand = (cmd, source, label, display) => {
            if (!cmd || !cmd.parameters) return;
            if (cmd.code === 41) named('img/characters', cmd.parameters, 0, source, label + ' (move route image)', display);
            if (cmd.code === 44) audio('audio/se', cmd.parameters[0], source, label + ' (move route SE)', display);
        };
        const visitList = (list, source, label) => {
            for (const cmd of list || []) {
                if (!cmd || !cmd.parameters) continue;
                const p = cmd.parameters;
                switch (cmd.code) {
                    case 101: named('img/faces', p, 0, source, label + ' (Show Text face)'); break;
                    case 231: named('img/pictures', p, 1, source, label + ' (Show Picture)'); break;
                    case 241: case 132: audio('audio/bgm', p[0], source, label + ' (BGM)'); break;
                    case 140: audio('audio/bgm', p[1], source, label + ' (vehicle BGM)'); break;
                    case 245: audio('audio/bgs', p[0], source, label + ' (BGS)'); break;
                    case 249: case 133: case 139: audio('audio/me', p[0], source, label + ' (ME)'); break;
                    case 250: audio('audio/se', p[0], source, label + ' (SE)'); break;
                    case 322:
                        named('img/characters', p, 1, source, label + ' (actor image)');
                        named('img/faces', p, 3, source, label + ' (actor face)');
                        named('img/sv_actors', p, 5, source, label + ' (actor battler)');
                        break;
                    case 323: named('img/characters', p, 1, source, label + ' (vehicle image)'); break;
                    case 283:
                        named('img/battlebacks1', p, 0, source, label + ' (battleback)');
                        named('img/battlebacks2', p, 1, source, label + ' (battleback)');
                        break;
                    case 284: named('img/parallaxes', p, 0, source, label + ' (parallax)'); break;
                    case 205: for (const step of (p[1] && p[1].list) || []) routeCommand(step, source, label); break;
                    // 505 lines repeat a move route for the MZ editor's display: rewritten, not counted.
                    case 505: routeCommand(p[0], source, label, true); break;
                }
            }
        };
        const mapInfos = sources.mapInfos || [];
        const mapLabel = id => {
            const info = mapInfos[id];
            return `Map ${String(id).padStart(3, '0')}${info && info.name ? ` "${info.name}"` : ''}`;
        };

        for (const [id, map] of Object.entries(sources.maps || {})) {
            if (!map) continue;
            const source = `map:${id}`, base = mapLabel(id);
            named('img/parallaxes', map, 'parallaxName', source, base + ' (parallax)');
            named('img/battlebacks1', map, 'battleback1Name', source, base + ' (battleback)');
            named('img/battlebacks2', map, 'battleback2Name', source, base + ' (battleback)');
            audio('audio/bgm', map.bgm, source, base + ' (autoplay BGM)');
            audio('audio/bgs', map.bgs, source, base + ' (autoplay BGS)');
            for (const ev of map.events || []) {
                if (!ev) continue;
                const label = `${base} · EV${String(ev.id).padStart(3, '0')} "${ev.name || ''}"`;
                (ev.pages || []).forEach((page, i) => {
                    if (page.image) named('img/characters', page.image, 'characterName', source, `${label} page ${i + 1} image`);
                    visitList(page.list, source, `${label} page ${i + 1}`);
                });
            }
        }

        const db = sources.database || {};
        for (const actor of db.Actors || []) {
            if (!actor) continue;
            const label = `Actor ${actor.id} "${actor.name || ''}"`;
            named('img/characters', actor, 'characterName', 'database:Actors', label);
            named('img/faces', actor, 'faceName', 'database:Actors', label);
            named('img/sv_actors', actor, 'battlerName', 'database:Actors', label);
        }
        for (const enemy of db.Enemies || []) {
            if (!enemy) continue;
            const label = `Enemy ${enemy.id} "${enemy.name || ''}"`;
            named('img/enemies', enemy, 'battlerName', 'database:Enemies', label);
            named('img/sv_enemies', enemy, 'battlerName', 'database:Enemies', label);
        }
        for (const tileset of db.Tilesets || []) {
            if (!tileset || !tileset.tilesetNames) continue;
            tileset.tilesetNames.forEach((n, i) => named('img/tilesets', tileset.tilesetNames, i, 'database:Tilesets', `Tileset ${tileset.id} "${tileset.name || ''}"`));
        }
        const sys = db.System;
        if (sys) {
            named('img/titles1', sys, 'title1Name', 'database:System', 'System (title)');
            named('img/titles2', sys, 'title2Name', 'database:System', 'System (title frame)');
            named('img/battlebacks1', sys, 'battleback1Name', 'database:System', 'System (test battleback)');
            named('img/battlebacks2', sys, 'battleback2Name', 'database:System', 'System (test battleback)');
            for (const field of ['titleBgm', 'battleBgm']) audio('audio/bgm', sys[field], 'database:System', `System (${field})`);
            for (const field of ['victoryMe', 'defeatMe', 'gameoverMe']) audio('audio/me', sys[field], 'database:System', `System (${field})`);
            (sys.sounds || []).forEach((s, i) => audio('audio/se', s, 'database:System', `System (sound ${i})`));
            for (const vehicle of ['boat', 'ship', 'airship']) {
                if (!sys[vehicle]) continue;
                named('img/characters', sys[vehicle], 'characterName', 'database:System', `System (${vehicle})`);
                audio('audio/bgm', sys[vehicle].bgm, 'database:System', `System (${vehicle} BGM)`);
            }
        }
        for (const ce of db.CommonEvents || []) {
            if (ce) visitList(ce.list, 'database:CommonEvents', `Common Event ${ce.id} "${ce.name || ''}"`);
        }
        for (const troop of db.Troops || []) {
            if (!troop) continue;
            (troop.pages || []).forEach((page, i) => visitList(page.list, 'database:Troops', `Troop ${troop.id} "${troop.name || ''}" page ${i + 1}`));
        }

        const pathRef = (holder, field, source, label, display) => {
            const value = holder[field];
            if (!value || typeof value !== 'string') return;
            fn({ key: this.keyOf(value), kind: 'path', source, label, display: Boolean(display), set: v => { holder[field] = v; } });
        };
        for (const [id, list] of Object.entries(sources.doodads || {})) {
            if (!Array.isArray(list)) continue;
            list.forEach((d, i) => {
                if (d && d.bit && d.bit[0] === 3) pathRef(d.bit, 1, 'doodads', `${mapLabel(id)} · doodad #${i + 1}`);
            });
        }
        // Seasonal variants may only be reachable through the season table.
        const world = sources.doodads && sources.doodads.world;
        const seasonSets = world && world.seasons && Array.isArray(world.seasons.sets) ? world.seasons.sets : [];
        seasonSets.forEach((set, row) => {
            for (const season of Object.keys(set || {})) pathRef(set, season, 'doodads', `Season table row ${row + 1}`);
        });
        for (const prefab of sources.prefabs || []) {
            const label = `Prefab "${prefab.name}"`;
            (prefab.doodads || []).forEach(d => { if (d && d.bit && d.bit[0] === 3) pathRef(d.bit, 1, 'prefabs', label); });
            pathRef(prefab, 'thumbnail', 'prefabs', label + ' thumbnail', true);
        }
    },

    buildIndex(sources) {
        const index = new Map();
        this.visitSources(sources, ref => {
            if (ref.display) return;
            if (!index.has(ref.key)) index.set(ref.key, []);
            index.get(ref.key).push({ source: ref.source, label: ref.label, kind: ref.kind });
        });
        return index;
    },

    isUsed(asset, index = this.lastIndex) {
        return Boolean(index && index.has(this.keyOf(asset.path)));
    },

    unusedAssets(assets, index) {
        return (assets || []).filter(a => !this.isEngineReserved(a) && !index.has(this.keyOf(a.path)));
    },

    // Rewrites every reference from oldPath to newPath. Name references can only follow a rename
    // inside the same folder; a move to another folder is refused while any exist.
    rewrite(sources, oldPath, newPath) {
        const oldKey = this.keyOf(oldPath), newKey = this.keyOf(newPath);
        const newName = String(newPath).replace(/\\/g, '/').split('/').pop().replace(/\.[^/.]+$/, '');
        const matches = [];
        this.visitSources(sources, ref => { if (ref.key === oldKey) matches.push(ref); });
        const blocked = matches.filter(r => r.kind === 'name' && r.folder.toLowerCase() !== this.folderOf(newKey));
        if (blocked.length > 0) return { ok: false, blocked, changed: [], count: 0 };
        const changed = new Set();
        for (const ref of matches) {
            ref.set(ref.kind === 'name' ? newName : String(newPath).replace(/\\/g, '/'));
            changed.add(ref.source);
        }
        return { ok: true, blocked: [], changed: [...changed], count: matches.filter(r => !r.display).length };
    }
};

// 64-bit difference hashes (9x8 greyscale, left-vs-right) for duplicates and look-alikes.
DocsDoodads.Similarity = {
    grey(data, i) {
        const a = data[i + 3] / 255;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        return lum * a + 128 * (1 - a);
    },

    hashPixels(data, width, height, frame) {
        const f = frame || { x: 0, y: 0, w: width, h: height };
        const sums = new Float64Array(72), counts = new Float64Array(72);
        for (let y = 0; y < f.h; y++) {
            const cy = Math.min(7, Math.floor(y * 8 / f.h));
            for (let x = 0; x < f.w; x++) {
                const cx = Math.min(8, Math.floor(x * 9 / f.w));
                const cell = cy * 9 + cx;
                sums[cell] += this.grey(data, ((f.y + y) * width + f.x + x) * 4);
                counts[cell]++;
            }
        }
        let hex = '';
        for (let row = 0; row < 8; row++) {
            let byte = 0;
            for (let col = 0; col < 8; col++) {
                const left = sums[row * 9 + col] / Math.max(1, counts[row * 9 + col]);
                const right = sums[row * 9 + col + 1] / Math.max(1, counts[row * 9 + col + 1]);
                byte = (byte << 1) | (left < right - 0.5 ? 1 : 0);
            }
            hex += byte.toString(16).padStart(2, '0');
        }
        return hex;
    },

    popcount(n) {
        n = n - ((n >>> 1) & 0x55555555);
        n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
        return (((n + (n >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
    },

    hamming(a, b) {
        if (!a || !b) return 64;
        return this.popcount((parseInt(a.slice(0, 8), 16) ^ parseInt(b.slice(0, 8), 16)) >>> 0) +
            this.popcount((parseInt(a.slice(8, 16), 16) ^ parseInt(b.slice(8, 16), 16)) >>> 0);
    },

    bitsOf(hex) {
        let bits = '';
        for (const ch of hex) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
        return bits;
    },

    // Groups entries within maxDistance bits. Splitting the hash into maxDistance + 1 bands means
    // any close pair shares at least one band exactly, so only same-band buckets are compared.
    findDuplicates(entries, maxDistance = 4) {
        const items = (entries || []).filter(e => e && e.hash);
        const parent = items.map((_, i) => i);
        const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        const bandCount = Math.min(16, maxDistance + 1);
        const bandSize = Math.ceil(64 / bandCount);
        const bits = items.map(e => this.bitsOf(e.hash));
        const compared = new Set();
        for (let band = 0; band < bandCount; band++) {
            const buckets = new Map();
            items.forEach((e, i) => {
                const key = bits[i].slice(band * bandSize, (band + 1) * bandSize);
                if (!buckets.has(key)) buckets.set(key, []);
                buckets.get(key).push(i);
            });
            for (const bucket of buckets.values()) {
                for (let x = 0; x < bucket.length; x++) {
                    for (let y = x + 1; y < bucket.length; y++) {
                        const i = bucket[x], j = bucket[y];
                        const pairKey = i < j ? i * 1e6 + j : j * 1e6 + i;
                        if (compared.has(pairKey)) continue;
                        compared.add(pairKey);
                        if (this.hamming(items[i].hash, items[j].hash) <= maxDistance) parent[find(i)] = find(j);
                    }
                }
            }
        }
        const groups = new Map();
        items.forEach((e, i) => {
            const root = find(i);
            if (!groups.has(root)) groups.set(root, []);
            groups.get(root).push(e);
        });
        return [...groups.values()].filter(g => g.length > 1);
    },

    similarTo(hash, entries, limit = 50) {
        return (entries || []).filter(e => e && e.hash)
            .map(entry => ({ entry, distance: this.hamming(hash, entry.hash) }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);
    }
};

// Watches img/ and audio/ while the workspace is open, so saving in Aseprite or Photoshop
// updates the drawer and the placed doodads without restarting.
DocsDoodads.LiveReload = {
    watchers: [],
    pending: new Set(),
    timer: null,
    delay: 300,
    versions: {},

    classify(root, filename) {
        if (!filename) return null;
        const rel = String(filename).replace(/\\/g, '/').replace(/^\/+/, '');
        if (rel.split('/').some(part => part === '_packed' || part.startsWith('.'))) return null;
        if (/\.(tmp|bak)$|\.(dd|qj)(import|txn)-|~$/i.test(rel)) return null;
        if (!DocsDoodads.AssetIndex.isSupportedAssetFile(rel)) return null;
        return `${root}/${rel}`;
    },

    bump(assetPath) {
        this.versions[assetPath] = (this.versions[assetPath] || 0) + 1;
    },

    urlFor(assetPath) {
        const version = this.versions[assetPath];
        return version ? `${assetPath}?v=${version}` : assetPath;
    },

    process(paths, handlers) {
        const unique = [...new Set(paths)];
        const summary = { updated: [], removed: [] };
        for (const p of unique) {
            if (handlers.exists(p)) {
                handlers.index(p);
                summary.updated.push(p);
            } else {
                handlers.remove(p);
                summary.removed.push(p);
            }
            handlers.invalidate(p);
        }
        if (unique.length > 0) handlers.reloadSprites();
        return summary;
    },

    defaultHandlers() {
        const FS = DocsDoodads.FS;
        return {
            exists: p => FS.existsSync(p),
            index: p => {
                const stat = FS.fs.statSync(p);
                DocsDoodads.AssetIndex.indexFile(p, FS.path.basename(p), FS.path.extname(p).toLowerCase(), p, stat);
            },
            remove: p => { delete DocsDoodads.AssetIndex.data.assets[p.toLowerCase()]; },
            invalidate: p => {
                this.bump(p);
                DocsDoodads.Thumbnail.invalidate(p.toLowerCase());
                if (typeof ImageManager !== 'undefined' && ImageManager._cache) {
                    const encoded = typeof Utils !== 'undefined' && Utils.encodeURI ? Utils.encodeURI(p) : p;
                    for (const key of Object.keys(ImageManager._cache)) {
                        if (key === p || key === encoded || key.startsWith(p + '?')) delete ImageManager._cache[key];
                    }
                }
            },
            reloadSprites: () => DocsDoodads.Workspace.refreshSpriteset()
        };
    },

    queue(assetPath) {
        if (!assetPath) return;
        this.pending.add(assetPath);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.flush(), this.delay);
    },

    flush() {
        const paths = [...this.pending];
        this.pending.clear();
        if (paths.length === 0) return null;
        const summary = this.process(paths, this.defaultHandlers());
        DocsDoodads.AssetIndex.rebuildList();
        DocsDoodads.AssetIndex.save();
        DocsDoodads.Usage.lastIndex = null;
        const ws = DocsDoodads.Workspace;
        if (ws.mounted) {
            if (ws.selectedAsset && ws.selectedAsset.path) {
                const id = String(ws.selectedAsset.path).toLowerCase();
                if (summary.updated.some(p => p.toLowerCase() === id) || summary.removed.some(p => p.toLowerCase() === id)) {
                    ws.selectedAsset = DocsDoodads.AssetIndex.data.assets[id] || null;
                    ws.refreshInspector();
                }
            }
            ws.refreshDrawerCards();
            ws.updateIndexStatus();
            const names = summary.updated.concat(summary.removed).map(p => p.split('/').pop());
            ws.showToast(`Reloaded ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` and ${names.length - 3} more` : ''}.`);
        }
        return summary;
    },

    start() {
        this.stop();
        const fs = DocsDoodads.FS.fs;
        if (!fs || typeof fs.watch !== 'function') return false;
        for (const root of ['img', 'audio']) {
            if (!fs.existsSync(root)) continue;
            try {
                this.watchers.push(fs.watch(root, { recursive: true }, (event, file) => this.queue(this.classify(root, file))));
            } catch (error) {
                DocsDoodads.Core.log(`Live reload unavailable for ${root}`, error);
            }
        }
        return this.watchers.length > 0;
    },

    stop() {
        for (const watcher of this.watchers) {
            try { watcher.close(); } catch (error) {}
        }
        this.watchers = [];
        clearTimeout(this.timer);
        this.pending.clear();
    }
};

// Optional per-map texture packing: every image region a map's doodads use is copied into a few
// sheets so the deployed game loads and draws fewer textures. Playtests keep using the originals.
DocsDoodads.Packer = {
    manifestPath: 'data/DocsDoodadsPacked.json',
    sheetDirectory: 'img/doodads/_packed',
    data: { version: 1, maps: {} },
    previewInTest: false,

    shouldUse() {
        return !DocsDoodads.Compat.isTest() || this.previewInTest;
    },

    regionOf(d) {
        const xf = Math.max(1, d.xFrame || 1), yf = Math.max(1, d.yFrame || 1);
        return { x: d.frameX || 0, y: d.frameY || 0, w: (d.frameW || 48) * xf, h: (d.frameH || 48) * yf };
    },

    keyFor(d) {
        const r = this.regionOf(d);
        return `${String(d.bit[1]).replace(/\\/g, '/')}|${r.x}|${r.y}|${r.w}|${r.h}`;
    },

    regionsFor(doodads) {
        const seen = new Map();
        for (const d of doodads || []) {
            if (!d || !d.bit || d.bit[0] !== 3) continue;
            const key = this.keyFor(d);
            if (!seen.has(key)) seen.set(key, { key, path: String(d.bit[1]).replace(/\\/g, '/'), rect: this.regionOf(d) });
        }
        return [...seen.values()];
    },

    // Shelf packing, tallest first; anything larger than a sheet is left out (and keeps its original image).
    pack(rects, options = {}) {
        const maxSize = options.maxSize || 2048;
        const padding = options.padding !== undefined ? options.padding : 2;
        const sheets = [];
        const skipped = [];
        const order = rects.slice().sort((a, b) => (b.h - a.h) || (b.w - a.w) || String(a.key).localeCompare(String(b.key)));
        for (const rect of order) {
            if (rect.w > maxSize || rect.h > maxSize) { skipped.push(rect); continue; }
            let placed = false;
            for (const sheet of sheets) {
                for (const shelf of sheet.shelves) {
                    if (rect.h <= shelf.h && shelf.x + rect.w <= maxSize) {
                        sheet.items.push({ key: rect.key, x: shelf.x, y: shelf.y, w: rect.w, h: rect.h });
                        shelf.x += rect.w + padding;
                        placed = true;
                        break;
                    }
                }
                if (!placed && sheet.nextY + rect.h <= maxSize) {
                    const shelf = { y: sheet.nextY, h: rect.h, x: rect.w + padding };
                    sheet.shelves.push(shelf);
                    sheet.items.push({ key: rect.key, x: 0, y: shelf.y, w: rect.w, h: rect.h });
                    sheet.nextY += rect.h + padding;
                    placed = true;
                }
                if (placed) break;
            }
            if (!placed) {
                sheets.push({ shelves: [{ y: 0, h: rect.h, x: rect.w + padding }], nextY: rect.h + padding, items: [{ key: rect.key, x: 0, y: 0, w: rect.w, h: rect.h }] });
            }
        }
        return {
            sheets: sheets.map(s => ({
                w: Math.max(...s.items.map(i => i.x + i.w)),
                h: Math.max(...s.items.map(i => i.y + i.h)),
                items: s.items
            })),
            skipped
        };
    },

    buildManifest(mapId, regions, packed, mtimes) {
        const name = i => `${this.sheetDirectory}/Map${String(mapId).padStart(3, '0')}_${i}.png`;
        const frames = {};
        packed.sheets.forEach((sheet, i) => sheet.items.forEach(item => { frames[item.key] = { sheet: i, x: item.x, y: item.y, w: item.w, h: item.h }; }));
        const sources = {};
        for (const r of regions) if (frames[r.key]) sources[r.path] = mtimes[r.path] || 0;
        return { mapId: Number(mapId), builtAt: Date.now(), sheets: packed.sheets.map((s, i) => name(i)), sizes: packed.sheets.map(s => ({ w: s.w, h: s.h })), frames, sources };
    },

    forMap(mapId) {
        return this.data && this.data.maps ? this.data.maps[mapId] || null : null;
    },

    resolve(manifest, d) {
        if (!manifest || !d || !d.bit || d.bit[0] !== 3) return null;
        const entry = manifest.frames[this.keyFor(d)];
        return entry ? { sheet: manifest.sheets[entry.sheet], x: entry.x, y: entry.y, w: entry.w, h: entry.h } : null;
    },

    staleSources(manifest, mtimeOf) {
        if (!manifest) return [];
        return Object.keys(manifest.sources || {}).filter(p => mtimeOf(p) !== manifest.sources[p]);
    },

    manifestExists() {
        return Boolean(DocsDoodads.FS.fs && DocsDoodads.FS.existsSync(this.manifestPath));
    },

    // Desktop builds check the file directly; browser builds only ask when the doodads file says packing is used.
    shouldRequestManifest() {
        if (DocsDoodads.FS.fs) return this.manifestExists();
        return Boolean(typeof window !== 'undefined' && window.$dataDocsDoodads && window.$dataDocsDoodads.usesPacking);
    },

    clampRegions(regions, sizeOf) {
        return regions.map(r => {
            const size = sizeOf(r.path);
            return size ? Object.assign({}, r, { rect: DocsDoodads.safeFrame(r.rect, size.w, size.h) }) : r;
        });
    },

    load() {
        const loaded = DocsDoodads.FS.fs ? DocsDoodads.FS.readJson(this.manifestPath) : null;
        if (loaded && loaded.maps) this.data = loaded;
        return this.data;
    }
};

//==========================================================
// SECTION 12: DocsDoodads.SEARCH (TOKENIZED QUERY PARSER)
//==========================================================
DocsDoodads.Search = {
    parseQuery(queryString) {
        const tokens = {
            terms: [],
            types: [],
            tags: [],
            folders: [],
            favorite: null,
            animated: null,
            collections: [],
            used: null,
            negative: []
        };
        if (!queryString) return tokens;

        // Parse tokens supporting quoted phrases, e.g. collection:"Castle Set" or -tag:"deep woods"
        const parts = [];
        const regex = /(-?\w+:)?("[^"]*"|'[^']*'|[^\s]+)/g;
        let match;
        while ((match = regex.exec(queryString)) !== null) {
            const prefix = match[1] || '';
            const val = match[2].replace(/^["']|["']$/g, '');
            parts.push(prefix + val);
        }

        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('-')) {
                tokens.negative.push(p.slice(1).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('type:')) {
                tokens.types.push(p.slice(5).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('tag:')) {
                tokens.tags.push(p.slice(4).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('folder:')) {
                tokens.folders.push(p.slice(7).replace(/["']/g, '').toLowerCase());
            } else if (p.startsWith('favorite:')) {
                tokens.favorite = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('animated:')) {
                tokens.animated = p.slice(9).toLowerCase() === 'true';
            } else if (p.startsWith('used:')) {
                const value = p.slice(5).toLowerCase();
                tokens.used = /^(yes|true|1)$/.test(value) ? true : /^(no|false|0)$/.test(value) ? false : null;
            } else if (p.startsWith('collection:')) {
                tokens.collections.push(p.slice(11).replace(/["']/g, '').toLowerCase());
            } else {
                tokens.terms.push(p.toLowerCase());
            }
        }
        return tokens;
    },

    matches(asset, parsed) {
        for (const neg of parsed.negative) {
            if ((asset.fileName && asset.fileName.toLowerCase().includes(neg)) || (asset.path && asset.path.toLowerCase().includes(neg))) {
                return false;
            }
        }
        if (parsed.favorite !== null && asset.favorite !== parsed.favorite) return false;
        if (parsed.used !== null && parsed.used !== undefined && DocsDoodads.Usage.lastIndex) {
            const used = DocsDoodads.Usage.isUsed(asset);
            if (parsed.used && !used) return false;
            if (!parsed.used && (used || DocsDoodads.Usage.isEngineReserved(asset))) return false;
        }
        if (parsed.types.length > 0 && !parsed.types.includes((asset.type || '').toLowerCase())) return false;
        if (parsed.folders.length > 0) {
            const pathLower = (asset.path || '').toLowerCase();
            if (!parsed.folders.some(f => pathLower.includes(f))) return false;
        }
        if (parsed.tags.length > 0) {
            const combinedTags = [...(asset.tags || []), ...(asset.autoTags || [])].map(t => t.toLowerCase());
            if (!parsed.tags.some(t => combinedTags.includes(t))) return false;
        }
        if (parsed.collections && parsed.collections.length > 0) {
            const assetCols = (asset.collections || []).map(c => c.toLowerCase());
            if (!parsed.collections.some(c => assetCols.includes(c))) return false;
        }
        if (parsed.terms.length > 0) {
            const searchHaystack = (asset.fileName + " " + (asset.tags || []).join(" ") + " " + (asset.autoTags || []).join(" ")).toLowerCase();
            for (const t of parsed.terms) {
                if (!searchHaystack.includes(t)) return false;
            }
        }
        return true;
    },

    filter(assets, queryString) {
        const parsed = this.parseQuery(queryString);
        return assets.filter(a => this.matches(a, parsed));
    }
};

//==========================================================
// SECTION 13: DocsDoodads.THUMBNAIL (COOPERATIVE BACKGROUND QUEUE)
//==========================================================
DocsDoodads.Thumbnail = {
    cache: {},
    cacheOrder: [],
    maxCacheSize: 500,
    sizeBuckets: [64, 96, 128, 192],
    queue: [],
    busy: false,

    getBucketSize(size) {
        let best = this.sizeBuckets[0];
        let minDiff = Math.abs(size - best);
        for (let i = 1; i < this.sizeBuckets.length; i++) {
            const diff = Math.abs(size - this.sizeBuckets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                best = this.sizeBuckets[i];
            }
        }
        return best;
    },

    getDiskPath(key) {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `data/docs_doodads_cache/thumbnails/${safeKey}.txt`;
    },

    // The modified time is part of the key so a file changed while the game was closed gets a new thumbnail.
    keyFor(asset, bucket) {
        return `${asset.id}_${Math.round(asset.mtimeMs || 0)}_${bucket}`;
    },

    get(asset, size = 96, callback) {
        const bucket = this.getBucketSize(size);
        const key = this.keyFor(asset, bucket);

        // 1. In-memory LRU Cache check
        if (this.cache[key]) {
            // Touch key for LRU
            const idx = this.cacheOrder.indexOf(key);
            if (idx >= 0) this.cacheOrder.splice(idx, 1);
            this.cacheOrder.push(key);
            callback(this.cache[key]);
            return;
        }

        // 2. Disk Cache check
        if (cacheEnabled && DocsDoodads.FS.existsSync) {
            const diskFile = this.getDiskPath(key);
            if (DocsDoodads.FS.existsSync(diskFile)) {
                try {
                    const cachedData = DocsDoodads.FS.readFileSync(diskFile, 'utf8');
                    if (cachedData && cachedData.startsWith('data:image')) {
                        this.setCache(key, cachedData);
                        callback(cachedData);
                        return;
                    }
                } catch(e) {}
            }
        }

        this.queue.push({ asset, bucket, key, callback });
        this.processQueue();
    },

    setCache(key, dataUrl) {
        if (this.cacheOrder.length >= this.maxCacheSize) {
            const oldest = this.cacheOrder.shift();
            delete this.cache[oldest];
        }
        this.cache[key] = dataUrl;
        this.cacheOrder.push(key);
    },

    // Drops every cached size of one asset (memory and disk) so it is regenerated.
    invalidate(assetId) {
        const prefix = assetId + '_';
        this.cacheOrder = this.cacheOrder.filter(key => {
            if (!key.startsWith(prefix)) return true;
            delete this.cache[key];
            return false;
        });
        const dir = 'data/docs_doodads_cache/thumbnails';
        const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
        try {
            if (DocsDoodads.FS.existsSync(dir)) {
                for (const file of DocsDoodads.FS.fs.readdirSync(dir)) {
                    if (file.startsWith(safePrefix)) DocsDoodads.FS.fs.unlinkSync(`${dir}/${file}`);
                }
            }
        } catch (e) {}
    },

    clearCache() {
        this.cache = {};
        this.cacheOrder = [];
        this.queue = [];
        if (DocsDoodads.FS.fs) {
            const dir = 'data/docs_doodads_cache/thumbnails';
            if (DocsDoodads.FS.existsSync(dir)) {
                try {
                    const files = DocsDoodads.FS.fs.readdirSync(dir);
                    for (const f of files) {
                        DocsDoodads.FS.fs.unlinkSync(`${dir}/${f}`);
                    }
                } catch(e) {}
            }
        }
    },

    processQueue() {
        if (this.busy || this.queue.length === 0) return;
        this.busy = true;

        const startTime = Date.now();
        while (this.queue.length > 0 && (Date.now() - startTime) < backgroundWorkBudget) {
            const job = this.queue.shift();
            this.generate(job.asset, job.bucket, (dataUrl) => {
                this.setCache(job.key, dataUrl);
                job.callback(dataUrl);

                // Write to disk cache
                if (cacheEnabled && DocsDoodads.FS.fs && dataUrl) {
                    const diskFile = this.getDiskPath(job.key);
                    try {
                        const dir = 'data/docs_doodads_cache/thumbnails';
                        if (!DocsDoodads.FS.existsSync(dir)) DocsDoodads.FS.mkdirp(dir);
                        DocsDoodads.FS.writeFileSync(diskFile, dataUrl, 'utf8');
                    } catch(e) {}
                }
            });
        }

        this.busy = false;
        if (this.queue.length > 0) {
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.processQueue());
            } else {
                setTimeout(() => this.processQueue(), 16);
            }
        }
    },

    generate(asset, size, onComplete) {
        if (typeof Image === 'undefined' || typeof document === 'undefined') {
            onComplete('');
            return;
        }
        if (asset.category === 'Audio') {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♫', size / 2, size / 2);
            onComplete(canvas.toDataURL());
            return;
        }

        const img = new Image();
        img.src = DocsDoodads.LiveReload.urlFor(asset.path);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;

            let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
            if (asset.slice && asset.slice.regions && asset.slice.regions.length > 0) {
                const r0 = asset.slice.regions[0];
                sx = r0.x; sy = r0.y; sw = r0.w; sh = r0.h;
            }

            const scale = Math.min(size / sw, size / sh);
            const dw = sw * scale;
            const dh = sh * scale;
            const dx = (size - dw) / 2;
            const dy = (size - dh) / 2;

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            onComplete(canvas.toDataURL());
        };
        img.onerror = () => onComplete('');
    }
};



//==========================================================
// SECTION 14: DocsDoodads.SLICING (KNOWN, GRID, METADATA, VISUAL)
//==========================================================
DocsDoodads.Slicing = {};

// 14.1 Known RPG Maker MZ Detection
DocsDoodads.Slicing.Known = {
    detect(asset) {
        const path = (asset.path || "").toLowerCase();
        const fileName = asset.fileName || "";
        const w = asset.width || 576;
        const h = asset.height || 384;

        // Characters
        if (asset.type === 'single_character' || fileName.startsWith('$')) {
            const cw = w / 3, ch = h / 4;
            return {
                status: "known",
                method: "mz_single_character",
                confidence: 1.0,
                width: w, height: h,
                regions: [{
                    id: (asset.id || "char") + "_single",
                    name: fileName.split('.')[0],
                    x: 0, y: 0, w: w, h: h,
                    cellW: cw, cellH: ch,
                    characterName: fileName, characterIndex: 0,
                    pivotX: 0.5, pivotY: 1.0
                }]
            };
        } else if (asset.type === 'character_sheet' || path.includes('img/characters')) {
            const charW = w / 4, charH = h / 2;
            const cellW = charW / 3, cellH = charH / 4;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                const cx = (idx % 4) * charW;
                const cy = Math.floor(idx / 4) * charH;
                regions.push({
                    id: (asset.id || "char") + "_char" + idx,
                    name: fileName.split('.')[0] + " #" + (idx + 1),
                    x: cx, y: cy, w: charW, h: charH,
                    cellW: cellW, cellH: cellH,
                    characterName: fileName, characterIndex: idx,
                    pivotX: 0.5, pivotY: 1.0
                });
            }
            return {
                status: "known",
                method: "mz_standard_8character",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (asset.type === 'faceset' || path.includes('img/faces')) {
            const fw = w / 4, fh = h / 2;
            const regions = [];
            for (let idx = 0; idx < 8; idx++) {
                regions.push({
                    id: (asset.id || "face") + "_face" + idx,
                    name: fileName.split('.')[0] + " Face #" + (idx + 1),
                    x: (idx % 4) * fw, y: Math.floor(idx / 4) * fh,
                    w: fw, h: fh, faceIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_faceset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        } else if (fileName.toLowerCase() === 'iconset.png' || path.includes('iconset')) {
            const iconSize = 32;
            const cols = 16;
            const rows = Math.floor(h / iconSize);
            const regions = [];
            for (let idx = 0; idx < cols * rows; idx++) {
                const ix = (idx % cols) * iconSize;
                const iy = Math.floor(idx / cols) * iconSize;
                regions.push({
                    id: "icon_" + idx,
                    name: "Icon #" + idx,
                    x: ix, y: iy, w: iconSize, h: iconSize,
                    iconIndex: idx,
                    pivotX: 0.5, pivotY: 0.5
                });
            }
            return {
                status: "known",
                method: "mz_iconset",
                confidence: 1.0,
                width: w, height: h,
                regions: regions
            };
        }
        return null;
    }
};

// 14.2 Divisor Fixed Grid Slicing
DocsDoodads.Slicing.Grid = {
    findCandidates(width, height) {
        const candidates = [];
        const commonCellSizes = [16, 24, 32, 48, 64, 96, 128];
        for (const s of commonCellSizes) {
            if (width % s === 0 && height % s === 0) {
                const cols = width / s;
                const rows = height / s;
                candidates.push({ cellW: s, cellH: s, cols, rows, score: 0.9 });
            }
        }
        return candidates;
    },

    sliceToGrid(width, height, cols, rows) {
        const cellW = width / cols;
        const cellH = height / rows;
        const regions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                regions.push({
                    id: `grid_${r}_${c}`,
                    name: `Cell_${r + 1}_${c + 1}`,
                    x: Math.round(c * cellW),
                    y: Math.round(r * cellH),
                    w: Math.round(cellW),
                    h: Math.round(cellH),
                    pivotX: 0.5,
                    pivotY: 1.0
                });
            }
        }
        return regions;
    }
};

// 14.3 Sidecar Atlas Metadata Parsers
DocsDoodads.Slicing.Metadata = {
    parse(imagePath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return null;
        const candidates = [
            imagePath.replace(/\.[^/.]+$/, '.saf.json'),
            imagePath.replace(/\.[^/.]+$/, '.json')
        ];
        const jsonPath = candidates.find(candidate => fs.existsSync(candidate));
        if (!jsonPath) return null;

        try {
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (!data.frames || (typeof data.frames !== 'object')) return null;

            const entries = Array.isArray(data.frames)
                ? data.frames.map((frame, index) => [frame.filename || `frame_${index}`, frame])
                : Object.entries(data.frames);
            const regions = [];
            for (const [name, frameData] of entries) {
                const frame = frameData.frame || frameData;
                if (![frame.x, frame.y, frame.w, frame.h].every(Number.isFinite)) continue;
                const sourceSize = frameData.sourceSize || { w: frame.w, h: frame.h };
                const spriteSourceSize = frameData.spriteSourceSize || { x: 0, y: 0, w: frame.w, h: frame.h };
                const rotated = Boolean(frameData.rotated);
                // As in PIXI: a rotated frame's w/h are the unrotated sprite size, so it covers h x w on the sheet.
                regions.push({
                    id: name,
                    name,
                    x: frame.x,
                    y: frame.y,
                    w: rotated ? frame.h : frame.w,
                    h: rotated ? frame.w : frame.h,
                    pivotX: frameData.pivot && Number.isFinite(frameData.pivot.x) ? frameData.pivot.x : 0.5,
                    pivotY: frameData.pivot && Number.isFinite(frameData.pivot.y) ? frameData.pivot.y : 1.0,
                    rotated,
                    trimmed: Boolean(frameData.trimmed),
                    sourceSize: { w: sourceSize.w, h: sourceSize.h },
                    spriteSourceSize: {
                        x: spriteSourceSize.x || 0,
                        y: spriteSourceSize.y || 0,
                        w: spriteSourceSize.w,
                        h: spriteSourceSize.h
                    },
                    duration: Number.isFinite(frameData.duration) ? frameData.duration : 0
                });
            }
            if (regions.length === 0) return null;

            const frameTags = data.meta && Array.isArray(data.meta.frameTags) ? data.meta.frameTags : [];
            const animationGroups = frameTags.map(tag => ({
                name: tag.name || 'animation',
                direction: tag.direction || 'forward',
                frames: regions.slice(Math.max(0, tag.from || 0), Math.min(regions.length, (tag.to || 0) + 1)).map(region => region.id)
            })).filter(group => group.frames.length > 0);

            if (animationGroups.length === 0) {
                const inferred = {};
                for (const region of regions) {
                    const groupName = region.name.replace(/\.[^.]+$/, '').replace(/(?:[_\- ]?\d+)$/, '');
                    if (!inferred[groupName]) inferred[groupName] = [];
                    inferred[groupName].push(region.id);
                }
                for (const [name, frames] of Object.entries(inferred)) {
                    if (frames.length > 1) animationGroups.push({ name, direction: 'forward', frames });
                }
            }

            return {
                status: 'metadata',
                method: jsonPath.endsWith('.saf.json') ? 'saf_sidecar_json' : 'sidecar_atlas_json',
                confidence: 1.0,
                sourcePath: jsonPath,
                regions,
                animationGroups
            };
        } catch (error) {
            DocsDoodads.Core.log('Atlas sidecar parse failed.', jsonPath, error);
            return null;
        }
    }
};

// 14.4 Visual Auto-Slicer
DocsDoodads.Slicing.Visual = {
    analyze(imageElement, options = {}) {
        if (typeof document === 'undefined') return { status: "none", regions: [] };
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);

        const w = canvas.width, h = canvas.height;
        return this.analyzePixels(ctx.getImageData(0, 0, w, h).data, w, h, options);
    },

    analyzePixels(data, w, h, options = {}) {
        const pixelCount = w * h;
        const maxPixels = options.maxPixels || 16777216;
        if (!data || w <= 0 || h <= 0 || data.length < pixelCount * 4) {
            return { status: 'none', method: 'invalid_pixels', confidence: 0, backgroundMode: 'unknown', regions: [] };
        }
        if (pixelCount > maxPixels) {
            return { status: 'review', method: 'safety_limit', confidence: 0.1, backgroundMode: 'unknown', regions: [], reason: 'image_too_large' };
        }

        const background = this.detectBackground(data, w, h, options);
        let binary = this.buildForegroundMask(data, w, h, background, options);
        binary = this.cleanupMask(binary, w, h, options);
        const minArea = Math.max(1, options.minArea === undefined ? 12 : options.minArea);
        const detected = this.connectedComponents(binary, w, h, minArea);
        const grouping = this.attachDetachedFragments(detected, options);
        const padding = Math.max(0, options.padding === undefined ? 1 : options.padding);
        let regions = grouping.components.map(component => ({
            x: Math.max(0, component.minX - padding),
            y: Math.max(0, component.minY - padding),
            w: Math.min(w, component.maxX + padding + 1) - Math.max(0, component.minX - padding),
            h: Math.min(h, component.maxY + padding + 1) - Math.max(0, component.minY - padding),
            pixelCount: component.count,
            pivotX: 0.5,
            pivotY: 1.0
        }));
        const rowTolerance = regions.length > 0
            ? Math.max(2, regions.reduce((sum, region) => sum + region.h, 0) / regions.length * 0.35)
            : 2;
        regions.sort((a, b) => Math.abs(a.y - b.y) <= rowTolerance ? a.x - b.x : a.y - b.y);
        regions = regions.map((region, index) => ({
            id: `reg_${index + 1}`,
            name: `Sprite_${String(index + 1).padStart(2, '0')}`,
            ...region
        }));

        const foregroundPixels = binary.reduce((sum, value) => sum + value, 0);
        const occupancy = foregroundPixels / pixelCount;
        const confidence = this.scoreConfidence(regions, background, occupancy, grouping.ambiguousFragments);
        return {
            status: confidence >= 0.65 ? 'auto' : 'review',
            method: 'saf_visual',
            confidence,
            backgroundMode: background.mode,
            alphaThreshold: background.alphaThreshold,
            regions,
            diagnostics: {
                occupancy,
                backgroundConfidence: background.confidence,
                componentCount: detected.length,
                attachedFragments: grouping.attachedFragments,
                ambiguousFragments: grouping.ambiguousFragments
            }
        };
    },

    detectBackground(data, w, h, options = {}) {
        const border = [];
        for (let x = 0; x < w; x++) {
            border.push(x, (h - 1) * w + x);
        }
        for (let y = 1; y < h - 1; y++) {
            border.push(y * w, y * w + w - 1);
        }
        let transparentCount = 0;
        const buckets = new Map();
        for (const index of border) {
            const offset = index * 4;
            const alpha = data[offset + 3];
            if (alpha < 245) transparentCount++;
            const key = `${data[offset] >> 4},${data[offset + 1] >> 4},${data[offset + 2] >> 4},${alpha >> 4}`;
            let bucket = buckets.get(key);
            if (!bucket) bucket = { count: 0, r: 0, g: 0, b: 0, a: 0 };
            bucket.count++;
            bucket.r += data[offset]; bucket.g += data[offset + 1]; bucket.b += data[offset + 2]; bucket.a += alpha;
            buckets.set(key, bucket);
        }
        const transparentRatio = border.length ? transparentCount / border.length : 1;
        if (transparentRatio >= (options.transparentBorderRatio || 0.15)) {
            const hist = new Uint32Array(256);
            for (let offset = 3; offset < data.length; offset += 4) hist[data[offset]]++;
            const alphaThreshold = options.alphaThreshold || Math.max(8, this.otsuThreshold(hist));
            return { mode: 'transparent', alphaThreshold, confidence: Math.min(1, 0.65 + transparentRatio * 0.35) };
        }

        let dominant = { count: 0, r: 0, g: 0, b: 0, a: 255 };
        for (const bucket of buckets.values()) if (bucket.count > dominant.count) dominant = bucket;
        const divisor = dominant.count || 1;
        return {
            mode: 'opaque',
            alphaThreshold: 8,
            color: [dominant.r / divisor, dominant.g / divisor, dominant.b / divisor, dominant.a / divisor],
            confidence: border.length ? dominant.count / border.length : 0
        };
    },

    buildForegroundMask(data, w, h, background, options = {}) {
        const binary = new Uint8Array(w * h);
        if (background.mode === 'transparent') {
            for (let index = 0, offset = 3; index < binary.length; index++, offset += 4) {
                binary[index] = data[offset] >= background.alphaThreshold ? 1 : 0;
            }
            return binary;
        }

        const tolerance = options.colorTolerance || 36;
        const toleranceSq = tolerance * tolerance;
        const candidate = new Uint8Array(w * h);
        for (let index = 0, offset = 0; index < candidate.length; index++, offset += 4) {
            const dr = data[offset] - background.color[0];
            const dg = data[offset + 1] - background.color[1];
            const db = data[offset + 2] - background.color[2];
            candidate[index] = dr * dr + dg * dg + db * db <= toleranceSq ? 1 : 0;
        }
        const visited = new Uint8Array(w * h);
        const queue = [];
        for (let x = 0; x < w; x++) queue.push(x, (h - 1) * w + x);
        for (let y = 1; y < h - 1; y++) queue.push(y * w, y * w + w - 1);
        while (queue.length > 0) {
            const index = queue.pop();
            if (index < 0 || index >= visited.length || visited[index] || !candidate[index]) continue;
            visited[index] = 1;
            const x = index % w;
            const y = Math.floor(index / w);
            if (x > 0) queue.push(index - 1);
            if (x < w - 1) queue.push(index + 1);
            if (y > 0) queue.push(index - w);
            if (y < h - 1) queue.push(index + w);
        }
        for (let index = 0; index < binary.length; index++) {
            binary[index] = !visited[index] && data[index * 4 + 3] >= 8 ? 1 : 0;
        }
        return binary;
    },

    cleanupMask(binary, w, h, options = {}) {
        if (options.cleanup === false) return binary;
        const cleaned = binary.slice();
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const index = y * w + x;
                if (!binary[index]) continue;
                const neighbors = binary[index - 1] + binary[index + 1] + binary[index - w] + binary[index + w];
                if (neighbors === 0) cleaned[index] = 0;
            }
        }
        return cleaned;
    },

    connectedComponents(binary, w, h, minArea) {
        const visited = new Uint8Array(binary.length);
        const components = [];
        for (let start = 0; start < binary.length; start++) {
            if (!binary[start] || visited[start]) continue;
            const queue = [start];
            visited[start] = 1;
            const component = { minX: start % w, maxX: start % w, minY: Math.floor(start / w), maxY: Math.floor(start / w), count: 0 };
            while (queue.length > 0) {
                const index = queue.pop();
                const x = index % w;
                const y = Math.floor(index / w);
                component.count++;
                component.minX = Math.min(component.minX, x); component.maxX = Math.max(component.maxX, x);
                component.minY = Math.min(component.minY, y); component.maxY = Math.max(component.maxY, y);
                const neighbors = [x > 0 ? index - 1 : -1, x < w - 1 ? index + 1 : -1, y > 0 ? index - w : -1, y < h - 1 ? index + w : -1];
                for (const next of neighbors) {
                    if (next >= 0 && binary[next] && !visited[next]) { visited[next] = 1; queue.push(next); }
                }
            }
            if (component.count >= minArea) components.push(component);
        }
        return components;
    },

    componentDistance(a, b) {
        const dx = Math.max(0, a.minX - b.maxX - 1, b.minX - a.maxX - 1);
        const dy = Math.max(0, a.minY - b.maxY - 1, b.minY - a.maxY - 1);
        return Math.hypot(dx, dy);
    },

    attachDetachedFragments(components, options = {}) {
        if (components.length < 2) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: 0 };
        const largestArea = Math.max(...components.map(component => component.count));
        const ratio = options.fragmentMaxAreaRatio === undefined ? 0.12 : options.fragmentMaxAreaRatio;
        const maxDistance = options.fragmentAttachDistance === undefined ? 6 : options.fragmentAttachDistance;
        const majors = components.filter(component => component.count > largestArea * ratio).map(component => ({ ...component }));
        const fragments = components.filter(component => component.count <= largestArea * ratio);
        if (majors.length === 0) return { components: components.slice(), attachedFragments: 0, ambiguousFragments: fragments.length };
        let attachedFragments = 0;
        let ambiguousFragments = 0;
        const unattached = [];
        for (const fragment of fragments) {
            const ranked = majors.map((major, index) => ({ index, distance: this.componentDistance(fragment, major) })).sort((a, b) => a.distance - b.distance);
            const nearest = ranked[0];
            const second = ranked[1];
            const unambiguous = !second || second.distance - nearest.distance >= Math.max(2, nearest.distance * 0.5);
            if (nearest.distance <= maxDistance && unambiguous) {
                const major = majors[nearest.index];
                major.minX = Math.min(major.minX, fragment.minX); major.maxX = Math.max(major.maxX, fragment.maxX);
                major.minY = Math.min(major.minY, fragment.minY); major.maxY = Math.max(major.maxY, fragment.maxY);
                major.count += fragment.count;
                attachedFragments++;
            } else {
                unattached.push(fragment);
                if (!unambiguous) ambiguousFragments++;
            }
        }
        return { components: majors.concat(unattached), attachedFragments, ambiguousFragments };
    },

    scoreConfidence(regions, background, occupancy, ambiguousFragments) {
        if (regions.length === 0) return 0.1;
        let score = 0.58 + Math.min(0.24, background.confidence * 0.24);
        const averageSolidity = regions.reduce((sum, region) => sum + Math.min(1, region.pixelCount / Math.max(1, region.w * region.h)), 0) / regions.length;
        score += averageSolidity * 0.16;
        if (occupancy > 0.88) score -= 0.38;
        else if (occupancy < 0.0005) score -= 0.25;
        score -= Math.min(0.25, ambiguousFragments * 0.05);
        return Math.max(0.05, Math.min(0.99, Math.round(score * 1000) / 1000));
    },

    otsuThreshold(hist) {
        let total = 0;
        for (let i = 0; i < 256; i++) total += hist[i];
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * hist[i];
        let sumB = 0, wB = 0, varMax = 0, threshold = 0;

        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            const wF = total - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        return threshold;
    },

    gutterSplitRegions(regions, binary, w, h) {
        const out = [];
        for (const r of regions) {
            if (r.w > 64) {
                const colSums = new Int32Array(r.w);
                for (let x = 0; x < r.w; x++) {
                    for (let y = 0; y < r.h; y++) {
                        if (binary[(r.y + y) * w + (r.x + x)] === 1) {
                            colSums[x]++;
                        }
                    }
                }
                let splitCol = -1;
                for (let x = 8; x < r.w - 8; x++) {
                    if (colSums[x] === 0) {
                        splitCol = x;
                        break;
                    }
                }
                if (splitCol > 0) {
                    out.push({
                        id: r.id + '_a',
                        name: r.name + '_A',
                        x: r.x, y: r.y, w: splitCol, h: r.h,
                        pivotX: 0.5, pivotY: 1.0
                    });
                    out.push({
                        id: r.id + '_b',
                        name: r.name + '_B',
                        x: r.x + splitCol, y: r.y, w: r.w - splitCol, h: r.h,
                        pivotX: 0.5, pivotY: 1.0
                    });
                    continue;
                }
            }
            out.push(r);
        }
        return out;
    },

    analyzeAsync(imageElement, options = {}, onProgress = null, cancellationToken = null) {
        return new Promise((resolve, reject) => {
            if (cancellationToken && cancellationToken.isCancelled) {
                return resolve(null);
            }
            if (typeof document === 'undefined') {
                return resolve({ status: "none", regions: [] });
            }
            if (onProgress) onProgress("Loading Pixels", 10);

            const canvas = document.createElement('canvas');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageElement, 0, 0);

            const w = canvas.width, h = canvas.height;
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Calculating Threshold", 25);

            // Step 1: Alpha histogram and Otsu threshold
            const hist = new Uint32Array(256);
            for (let i = 3; i < data.length; i += 4) {
                hist[data[i]]++;
            }
            let threshold = this.otsuThreshold(hist);
            if (threshold < 8) threshold = 16;

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Binarizing Image", 40);

            // Step 2: Binary grid foreground
            const binary = new Uint8Array(w * h);
            for (let i = 0, p = 3; p < data.length; i++, p += 4) {
                binary[i] = data[p] >= threshold ? 1 : 0;
            }

            if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
            if (onProgress) onProgress("Connected Components Analysis", 60);

            // Step 3: Connected Components (4-connected)
            const labels = new Int32Array(w * h);
            let currentLabel = 1;
            const components = {};

            let y = 0;
            const processChunk = () => {
                const chunkStart = Date.now();
                while (y < h && (Date.now() - chunkStart < 12)) {
                    if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
                    for (let x = 0; x < w; x++) {
                        const idx = y * w + x;
                        if (binary[idx] === 1 && labels[idx] === 0) {
                            const comp = { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
                            const queue = [idx];
                            labels[idx] = currentLabel;

                            while (queue.length > 0) {
                                const cur = queue.pop();
                                const cx = cur % w;
                                const cy = Math.floor(cur / w);
                                comp.count++;

                                if (cx < comp.minX) comp.minX = cx;
                                if (cx > comp.maxX) comp.maxX = cx;
                                if (cy < comp.minY) comp.minY = cy;
                                if (cy > comp.maxY) comp.maxY = cy;

                                const nList = [
                                    cy > 0 ? (cy - 1) * w + cx : -1,
                                    cy < h - 1 ? (cy + 1) * w + cx : -1,
                                    cx > 0 ? cy * w + (cx - 1) : -1,
                                    cx < w - 1 ? cy * w + (cx + 1) : -1
                                ];
                                for (const nIdx of nList) {
                                    if (nIdx >= 0 && binary[nIdx] === 1 && labels[nIdx] === 0) {
                                        labels[nIdx] = currentLabel;
                                        queue.push(nIdx);
                                    }
                                }
                            }
                            if (comp.count > 12) {
                                components[currentLabel] = comp;
                            }
                            currentLabel++;
                        }
                    }
                    y++;
                }

                if (y < h) {
                    if (onProgress) onProgress("Connected Components Analysis", Math.round(60 + (y / h) * 25));
                    if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(processChunk);
                    else setTimeout(processChunk, 1);
                } else {
                    if (cancellationToken && cancellationToken.isCancelled) return resolve(null);
                    if (onProgress) onProgress("Splitting Gutters & Finalizing", 90);

                    if (onProgress) onProgress("Complete", 100);
                    resolve(this.analyzePixels(data, w, h, options));
                }
            };
            processChunk();
        });
    }
};

//==========================================================
// SECTION 15: DocsDoodads.EXPORT (PNG SLICE EXPORTER)
//==========================================================
DocsDoodads.Export = {
    safeFileName(name) {
        const baseName = String(name || 'slice').split(/[\\/]/).pop();
        return baseName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+$/, 'slice');
    },

    getRegionGeometry(region) {
        const atlasW = Math.max(1, Math.round(region.w));
        const atlasH = Math.max(1, Math.round(region.h));
        const rotated = Boolean(region.rotated);
        const contentW = rotated ? atlasH : atlasW;
        const contentH = rotated ? atlasW : atlasH;
        const trimmed = Boolean(region.trimmed);
        const sourceSize = region.sourceSize || {};
        const spriteSourceSize = region.spriteSourceSize || {};
        return {
            atlasW,
            atlasH,
            contentW,
            contentH,
            outputW: trimmed && Number.isFinite(sourceSize.w) ? sourceSize.w : contentW,
            outputH: trimmed && Number.isFinite(sourceSize.h) ? sourceSize.h : contentH,
            destinationX: trimmed && Number.isFinite(spriteSourceSize.x) ? spriteSourceSize.x : 0,
            destinationY: trimmed && Number.isFinite(spriteSourceSize.y) ? spriteSourceSize.y : 0,
            rotated
        };
    },

    exportSlices(asset, targetDir) {
        const fs = DocsDoodads.FS.fs, path = DocsDoodads.FS.path;
        if (!fs || !path) return false;
        if (!asset.slice || !asset.slice.regions || asset.slice.regions.length === 0) {
            alert("No slice regions defined for this asset.");
            return false;
        }

        const outDir = targetDir || path.join('img', 'doodads', 'sliced_' + asset.fileName.replace(/\.[^/.]+$/, ""));
        DocsDoodads.FS.mkdirp(outDir);

        const img = new Image();
        img.src = asset.path;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            let count = 0;

            for (let i = 0; i < asset.slice.regions.length; i++) {
                const r = asset.slice.regions[i];
                const geometry = this.getRegionGeometry(r);
                canvas.width = geometry.outputW;
                canvas.height = geometry.outputH;
                ctx.clearRect(0, 0, geometry.outputW, geometry.outputH);
                if (geometry.rotated) {
                    ctx.save();
                    ctx.translate(geometry.destinationX, geometry.destinationY + geometry.contentH);
                    ctx.rotate(-Math.PI / 2);
                    ctx.drawImage(img, r.x, r.y, geometry.atlasW, geometry.atlasH, 0, 0, geometry.atlasW, geometry.atlasH);
                    ctx.restore();
                } else {
                    ctx.drawImage(
                        img, r.x, r.y, geometry.atlasW, geometry.atlasH,
                        geometry.destinationX, geometry.destinationY, geometry.contentW, geometry.contentH
                    );
                }

                const dataUrl = canvas.toDataURL('image/png');
                const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const rawName = this.safeFileName(r.name || ('slice_' + (i + 1))).replace(/\.[^.]+$/, '');
                const sliceFileName = `${rawName || ('slice_' + (i + 1))}.png`;
                fs.writeFileSync(path.join(outDir, sliceFileName), buffer);
                count++;
            }
            DocsDoodads.Workspace.showToast(`Exported ${count} slices to ${outDir}`);
        };
        return true;
    }
};


//==========================================================
// SECTION 16: DocsDoodads.SLICING.EDITOR (FULL INTERACTIVE MODAL)
//==========================================================
DocsDoodads.Slicing.Editor = {
    modal: null,
    asset: null,
    img: null,
    canvas: null,
    ctx: null,
    regions: [],
    selectedRegionIdx: -1,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    isDraggingHandle: false,
    activeHandle: null, // 'nw','n','ne','e','se','s','sw','w','body'
    dragStartMouse: { x: 0, y: 0 },
    dragStartRegion: null,
    isCreatingRegion: false,
    createStart: { x: 0, y: 0 },
    createCurrent: { x: 0, y: 0 },
    activeGuides: [], // alignment guides
    undoStack: [],
    redoStack: [],

    open(asset) {
        if (!asset || !asset.path) return;
        this.asset = asset;
        this.regions = JSON.parse(JSON.stringify(asset.slice.regions || []));
        this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
        this.zoom = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.undoStack = [];
        this.redoStack = [];

        this.img = new Image();
        this.img.src = asset.path;
        this.img.onload = () => {
            this.buildUI();
            this.fitToScreen();
            this.render();
        };
    },

    saveState() {
        this.undoStack.push(JSON.stringify(this.regions));
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
        this.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.undoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push(JSON.stringify(this.regions));
        this.regions = JSON.parse(this.redoStack.pop());
        this.render();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-slicer-undo');
        const rBtn = document.getElementById('dd-slicer-redo');
        if (uBtn) uBtn.style.opacity = this.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
    },

    fitToScreen() {
        const vp = document.getElementById('dd-slicer-canvas-container');
        if (!vp || !this.img) return;
        const availW = vp.clientWidth - 40;
        const availH = vp.clientHeight - 40;
        const scaleW = availW / this.img.naturalWidth;
        const scaleH = availH / this.img.naturalHeight;
        this.zoom = Math.min(Math.max(Math.min(scaleW, scaleH), 0.25), 4.0);
        this.panX = (vp.clientWidth - this.img.naturalWidth * this.zoom) / 2;
        this.panY = (vp.clientHeight - this.img.naturalHeight * this.zoom) / 2;
    },

    buildUI() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }

        const modal = document.createElement('div');
        modal.id = 'dd-slicer-modal-root';
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 20px; left: 20px; right: 20px; bottom: 20px;
            z-index: 10005; display: flex; flex-direction: column; overflow: hidden;
            pointer-events: auto; font-family: 'Segoe UI', Roboto, sans-serif;
            border: 1px solid rgba(255,255,255,0.18);
        `;

        modal.innerHTML = `
            <!-- Top Toolbar -->
            <div style="height: 48px; background: rgba(15, 23, 42, 0.85); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: space-between; padding: 0 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: bold; color: #60a5fa; font-size: 13px;">SLICER: ${escapeHtml(this.asset.fileName)}</span>
                    <button class="dd-btn" id="dd-slicer-undo" title="Undo (Ctrl+Z)">Undo</button>
                    <button class="dd-btn" id="dd-slicer-redo" title="Redo (Ctrl+Y)">Redo</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-auto-btn" title="Detect sprite regions automatically">Auto-Slice</button>
                    <button class="dd-btn" id="dd-slicer-grid-btn" title="Slice into fixed grid">Fixed Grid</button>
                    <button class="dd-btn" id="dd-slicer-add-btn" title="Add region">Add Box</button>
                    <button class="dd-btn" id="dd-slicer-del-btn" title="Delete selected region">Delete</button>
                    <button class="dd-btn" id="dd-slicer-dup-btn" title="Duplicate selected">Duplicate</button>
                    <div style="width: 1px; height: 20px; background: rgba(255,255,255,0.1); margin: 0 4px;"></div>
                    <button class="dd-btn" id="dd-slicer-splitv-btn" title="Split vertical">Split Vert</button>
                    <button class="dd-btn" id="dd-slicer-splith-btn" title="Split horizontal">Split Horz</button>
                    <button class="dd-btn" id="dd-slicer-export-btn" title="Export individual PNG files">Export PNGs</button>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="dd-btn dd-btn-primary" id="dd-slicer-save-btn">Save Slices</button>
                    <button class="dd-btn" id="dd-slicer-close-btn" style="background: #ef4444; border-color: #dc2626;">Close</button>
                </div>
            </div>

            <!-- Workspace Body: Left Canvas Viewport + Right Region List -->
            <div style="flex: 1; display: flex; overflow: hidden; position: relative;">
                <!-- Canvas Container -->
                <div id="dd-slicer-canvas-container" style="flex: 1; background: #0b0f19; overflow: hidden; position: relative; cursor: default;">
                    <canvas id="dd-slicer-interactive-canvas" style="position: absolute; top: 0; left: 0;"></canvas>
                </div>

                <!-- Right Sidebar: Region List & Inspector -->
                <div style="width: 320px; background: rgba(15, 23, 42, 0.95); border-left: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; overflow: hidden;">
                    <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); font-weight: bold; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
                        <span>REGIONS (<span id="dd-region-count">0</span>)</span>
                        <span id="dd-slicer-zoom-indicator" style="color: #60a5fa;">100%</span>
                    </div>
                    <div id="dd-region-list" style="flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px;">
                    </div>
                    <!-- Selected Region Properties -->
                    <div id="dd-region-inspector" style="padding: 12px; background: #111827; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px;">
                        <div style="color: #64748b; text-align: center;">No region selected</div>
                    </div>
                </div>
            </div>

            <!-- Bottom Status Bar -->
            <div style="height: 26px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between; padding: 0 16px; font-size: 11px; color: #64748b;">
                <span id="dd-slicer-hint">Mouse Wheel: Zoom (25%-1600%) | Space+Drag / Middle Click: Pan | Drag handle: Resize | Drag inside: Move | Drag empty: Create</span>
                <span id="dd-slicer-img-dim">${this.img.naturalWidth} x ${this.img.naturalHeight} px</span>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        this.canvas = document.getElementById('dd-slicer-interactive-canvas');
        this.ctx = this.canvas.getContext('2d');
        const container = document.getElementById('dd-slicer-canvas-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        if (!this._windowResizeListenerBound) {
            this._windowResizeListenerBound = true;
            window.addEventListener('resize', () => {
                const current = document.getElementById('dd-slicer-canvas-container');
                if (this.modal && current) {
                    this.canvas.width = current.clientWidth;
                    this.canvas.height = current.clientHeight;
                    this.render();
                }
            });
        }

        this.bindEvents();
        this.updateRegionList();
        this.updateUndoButtons();
    },

    bindEvents() {
        const container = document.getElementById('dd-slicer-canvas-container');

        // Close & Save
        document.getElementById('dd-slicer-close-btn').onclick = () => this.close();
        document.getElementById('dd-slicer-save-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            this.asset.slice.status = "manual";
            DocsDoodads.AssetIndex.save();
            DocsDoodads.Workspace.refreshDrawerCards();
            DocsDoodads.Workspace.showToast("Slice Regions Saved!");
            this.close();
        };

        // Undo & Redo
        document.getElementById('dd-slicer-undo').onclick = () => this.undo();
        document.getElementById('dd-slicer-redo').onclick = () => this.redo();

        // Visual auto-slice
        document.getElementById('dd-slicer-auto-btn').onclick = () => {
            this.saveState();
            const res = DocsDoodads.Slicing.Visual.analyze(this.img);
            this.regions = res.regions;
            this.selectedRegionIdx = this.regions.length > 0 ? 0 : -1;
            this.render();
            this.updateRegionList();
            const confidence = Math.round((Number(res.confidence) || 0) * 100);
            const verdict = res.status === 'review' ? 'Review required' : 'Auto-slice complete';
            DocsDoodads.Workspace.showToast(`${verdict}: ${this.regions.length} regions (${confidence}% confidence)`);
        };

        // Fixed Grid
        document.getElementById('dd-slicer-grid-btn').onclick = () => {
            const input = prompt("Enter grid columns and rows (e.g. 8x4):", "4x2");
            if (!input) return;
            const parts = input.split(/[xX, ]+/);
            if (parts.length >= 2) {
                const cols = parseInt(parts[0], 10);
                const rows = parseInt(parts[1], 10);
                if (cols > 0 && rows > 0) {
                    this.saveState();
                    this.regions = DocsDoodads.Slicing.Grid.sliceToGrid(this.img.naturalWidth, this.img.naturalHeight, cols, rows);
                    this.selectedRegionIdx = 0;
                    this.render();
                    this.updateRegionList();
                    DocsDoodads.Workspace.showToast(`Sliced into ${cols}x${rows} Grid!`);
                }
            }
        };

        // Add, Delete, Duplicate
        document.getElementById('dd-slicer-add-btn').onclick = () => {
            this.saveState();
            const newReg = {
                id: 'reg_' + Date.now(),
                name: 'Region_' + (this.regions.length + 1),
                x: Math.round(this.img.naturalWidth / 2 - 24),
                y: Math.round(this.img.naturalHeight / 2 - 24),
                w: 48, h: 48,
                pivotX: 0.5, pivotY: 1.0
            };
            this.regions.push(newReg);
            this.selectedRegionIdx = this.regions.length - 1;
            this.render();
            this.updateRegionList();
        };

        document.getElementById('dd-slicer-del-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                this.regions.splice(this.selectedRegionIdx, 1);
                this.selectedRegionIdx = Math.min(this.selectedRegionIdx, this.regions.length - 1);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-dup-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const dup = JSON.parse(JSON.stringify(cur));
                dup.id = 'reg_' + Date.now();
                dup.name = dup.name + '_copy';
                dup.x += 16; dup.y += 16;
                this.regions.push(dup);
                this.selectedRegionIdx = this.regions.length - 1;
                this.render();
                this.updateRegionList();
            }
        };

        // Split
        document.getElementById('dd-slicer-splitv-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfW = Math.round(cur.w / 2);
                const a = { ...cur, w: halfW };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', x: cur.x + halfW, w: cur.w - halfW };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-splith-btn').onclick = () => {
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                this.saveState();
                const cur = this.regions[this.selectedRegionIdx];
                const halfH = Math.round(cur.h / 2);
                const a = { ...cur, h: halfH };
                const b = { ...cur, id: 'reg_' + Date.now(), name: cur.name + '_2', y: cur.y + halfH, h: cur.h - halfH };
                this.regions.splice(this.selectedRegionIdx, 1, a, b);
                this.render();
                this.updateRegionList();
            }
        };

        document.getElementById('dd-slicer-export-btn').onclick = () => {
            this.asset.slice.regions = this.regions;
            DocsDoodads.Export.exportSlices(this.asset);
        };

        // Mouse interactions on Canvas
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.15 : 0.87;
            const newZoom = Math.min(Math.max(this.zoom * factor, 0.25), 16.0);

            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom centered on cursor
            this.panX = mouseX - (mouseX - this.panX) * (newZoom / this.zoom);
            this.panY = mouseY - (mouseY - this.panY) * (newZoom / this.zoom);
            this.zoom = newZoom;

            const ind = document.getElementById('dd-slicer-zoom-indicator');
            if (ind) ind.textContent = Math.round(this.zoom * 100) + '%';
            this.render();
        });

        container.addEventListener('mousedown', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Middle click or Space held -> Pan
            if (e.button === 1 || e.spaceKey || e.altKey) {
                this.isPanning = true;
                this.panStartX = mouseX - this.panX;
                this.panStartY = mouseY - this.panY;
                container.style.cursor = 'grab';
                return;
            }

            if (e.button === 0) {
                // Check if over handle of selected region
                if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                    const r = this.regions[this.selectedRegionIdx];
                    const handle = this.hitTestHandles(mouseX, mouseY, r);
                    if (handle) {
                        this.saveState();
                        this.isDraggingHandle = true;
                        this.activeHandle = handle;
                        this.dragStartMouse = { x: mouseX, y: mouseY };
                        this.dragStartRegion = { ...r };
                        return;
                    }
                }

                // Check if clicking inside any region
                const clickedIdx = this.hitTestRegions(mouseX, mouseY);
                if (clickedIdx >= 0) {
                    this.saveState();
                    this.selectedRegionIdx = clickedIdx;
                    this.isDraggingHandle = true;
                    this.activeHandle = 'body';
                    this.dragStartMouse = { x: mouseX, y: mouseY };
                    this.dragStartRegion = { ...this.regions[clickedIdx] };
                    this.render();
                    this.updateRegionList();
                    return;
                }

                // Otherwise, start creating new region
                this.isCreatingRegion = true;
                const imgCoords = this.screenToImage(mouseX, mouseY);
                this.createStart = imgCoords;
                this.createCurrent = imgCoords;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.modal) return;
            const rect = container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanning) {
                this.panX = mouseX - this.panStartX;
                this.panY = mouseY - this.panStartY;
                this.render();
                return;
            }

            if (this.isDraggingHandle && this.dragStartRegion) {
                const imgNow = this.screenToImage(mouseX, mouseY);
                const imgStart = this.screenToImage(this.dragStartMouse.x, this.dragStartMouse.y);
                const dx = Math.round(imgNow.x - imgStart.x);
                const dy = Math.round(imgNow.y - imgStart.y);
                const r = this.regions[this.selectedRegionIdx];
                const s = this.dragStartRegion;

                this.activeGuides = [];
                let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

                if (this.activeHandle === 'body') {
                    nx = s.x + dx;
                    ny = s.y + dy;
                    // Snapping
                    nx = this.snapCoordX(nx, nw);
                    ny = this.snapCoordY(ny, nh);
                } else if (this.activeHandle === 'se') {
                    nw = Math.max(s.w + dx, 4);
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'e') {
                    nw = Math.max(s.w + dx, 4);
                } else if (this.activeHandle === 's') {
                    nh = Math.max(s.h + dy, 4);
                } else if (this.activeHandle === 'nw') {
                    nx = s.x + dx; ny = s.y + dy;
                    nw = s.w - dx; nh = s.h - dy;
                } else if (this.activeHandle === 'w') {
                    nx = s.x + dx; nw = s.w - dx;
                } else if (this.activeHandle === 'n') {
                    ny = s.y + dy; nh = s.h - dy;
                }

                r.x = Math.max(0, nx);
                r.y = Math.max(0, ny);
                r.w = Math.max(4, nw);
                r.h = Math.max(4, nh);
                this.render();
                this.updateInspectorValues();
                return;
            }

            if (this.isCreatingRegion) {
                this.createCurrent = this.screenToImage(mouseX, mouseY);
                this.render();
                return;
            }

            // Update hover cursor
            if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
                const h = this.hitTestHandles(mouseX, mouseY, this.regions[this.selectedRegionIdx]);
                if (h) {
                    container.style.cursor = h === 'body' ? 'move' : h + '-resize';
                    return;
                }
            }
            container.style.cursor = 'crosshair';
        });

        window.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                container.style.cursor = 'default';
            }
            if (this.isDraggingHandle) {
                this.isDraggingHandle = false;
                this.activeHandle = null;
                this.activeGuides = [];
                this.render();
                this.updateRegionList();
            }
            if (this.isCreatingRegion) {
                this.isCreatingRegion = false;
                const minX = Math.round(Math.min(this.createStart.x, this.createCurrent.x));
                const minY = Math.round(Math.min(this.createStart.y, this.createCurrent.y));
                const rw = Math.round(Math.abs(this.createCurrent.x - this.createStart.x));
                const rh = Math.round(Math.abs(this.createCurrent.y - this.createStart.y));

                if (rw >= 6 && rh >= 6) {
                    this.saveState();
                    const newReg = {
                        id: 'reg_' + Date.now(),
                        name: 'Region_' + (this.regions.length + 1),
                        x: Math.max(0, minX),
                        y: Math.max(0, minY),
                        w: rw, h: rh,
                        pivotX: 0.5, pivotY: 1.0
                    };
                    this.regions.push(newReg);
                    this.selectedRegionIdx = this.regions.length - 1;
                    this.render();
                    this.updateRegionList();
                } else {
                    this.render();
                }
            }
        });

        // bindEvents runs on every open; window listeners must only be registered once.
        if (!this._windowKeyListenerBound) {
            this._windowKeyListenerBound = true;
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        }
    },

    handleKeyDown(e) {
        if (!this.modal) return;
        if (e.key === 'Escape') {
            this.close();
            return;
        }
        if (DocsDoodads.isEditableTarget(e.target)) return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            document.getElementById('dd-slicer-del-btn').click();
        } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            this.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            this.redo();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            document.getElementById('dd-slicer-dup-btn').click();
        }
    },

    snapCoordX(x, w) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(x) < snapDist) {
            this.activeGuides.push({ type: 'v', x: 0 });
            return 0;
        }
        if (Math.abs(x + w - this.img.naturalWidth) < snapDist) {
            this.activeGuides.push({ type: 'v', x: this.img.naturalWidth });
            return this.img.naturalWidth - w;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(x - other.x) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x });
                return other.x;
            }
            if (Math.abs(x - (other.x + other.w)) < snapDist) {
                this.activeGuides.push({ type: 'v', x: other.x + other.w });
                return other.x + other.w;
            }
        }
        return x;
    },

    snapCoordY(y, h) {
        const snapDist = 6 / this.zoom;
        if (Math.abs(y) < snapDist) {
            this.activeGuides.push({ type: 'h', y: 0 });
            return 0;
        }
        if (Math.abs(y + h - this.img.naturalHeight) < snapDist) {
            this.activeGuides.push({ type: 'h', y: this.img.naturalHeight });
            return this.img.naturalHeight - h;
        }
        for (let i = 0; i < this.regions.length; i++) {
            if (i === this.selectedRegionIdx) continue;
            const other = this.regions[i];
            if (Math.abs(y - other.y) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y });
                return other.y;
            }
            if (Math.abs(y - (other.y + other.h)) < snapDist) {
                this.activeGuides.push({ type: 'h', y: other.y + other.h });
                return other.y + other.h;
            }
        }
        return y;
    },

    screenToImage(sx, sy) {
        return {
            x: (sx - this.panX) / this.zoom,
            y: (sy - this.panY) / this.zoom
        };
    },

    imageToScreen(ix, iy) {
        return {
            x: ix * this.zoom + this.panX,
            y: iy * this.zoom + this.panY
        };
    },

    hitTestRegions(sx, sy) {
        const img = this.screenToImage(sx, sy);
        for (let i = this.regions.length - 1; i >= 0; i--) {
            const r = this.regions[i];
            if (img.x >= r.x && img.x <= r.x + r.w && img.y >= r.y && img.y <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    },

    hitTestHandles(sx, sy, r) {
        const sTopLeft = this.imageToScreen(r.x, r.y);
        const sW = r.w * this.zoom;
        const sH = r.h * this.zoom;
        const hSize = 8;

        const handles = {
            nw: { x: sTopLeft.x, y: sTopLeft.y },
            ne: { x: sTopLeft.x + sW, y: sTopLeft.y },
            se: { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
            sw: { x: sTopLeft.x, y: sTopLeft.y + sH },
            n:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
            e:  { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
            s:  { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
            w:  { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
        };

        for (const k in handles) {
            const h = handles[k];
            if (Math.abs(sx - h.x) <= hSize && Math.abs(sy - h.y) <= hSize) {
                return k;
            }
        }
        if (sx >= sTopLeft.x && sx <= sTopLeft.x + sW && sy >= sTopLeft.y && sy <= sTopLeft.y + sH) {
            return 'body';
        }
        return null;
    },

    render() {
        if (!this.ctx || !this.img) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Checkerboard background pattern
        const chkSize = 16;
        for (let y = 0; y < h; y += chkSize) {
            for (let x = 0; x < w; x += chkSize) {
                ctx.fillStyle = ((x / chkSize + y / chkSize) % 2 === 0) ? '#0f172a' : '#1e293b';
                ctx.fillRect(x, y, chkSize, chkSize);
            }
        }

        ctx.save();
        ctx.translate(this.panX, this.panY);
        ctx.scale(this.zoom, this.zoom);

        // 2. Source Sprite Sheet Image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.img, 0, 0);

        // 3. Pixel grid at high zoom (>= 4.0)
        if (this.zoom >= 4.0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1 / this.zoom;
            for (let x = 0; x <= this.img.naturalWidth; x++) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.img.naturalHeight); ctx.stroke();
            }
            for (let y = 0; y <= this.img.naturalHeight; y++) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.img.naturalWidth, y); ctx.stroke();
            }
        }

        // 4. Draw Regions
        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const isSel = i === this.selectedRegionIdx;

            ctx.fillStyle = isSel ? 'rgba(234, 179, 8, 0.22)' : 'rgba(56, 189, 248, 0.18)';
            ctx.fillRect(r.x, r.y, r.w, r.h);

            ctx.strokeStyle = isSel ? '#eab308' : '#38bdf8';
            ctx.lineWidth = (isSel ? 2 : 1) / this.zoom;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Pivot Crosshair
            const px = r.x + (r.pivotX !== undefined ? r.pivotX : 0.5) * r.w;
            const py = r.y + (r.pivotY !== undefined ? r.pivotY : 1.0) * r.h;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1 / this.zoom;
            ctx.beginPath();
            ctx.moveTo(px - 4 / this.zoom, py); ctx.lineTo(px + 4 / this.zoom, py);
            ctx.moveTo(px, py - 4 / this.zoom); ctx.lineTo(px, py + 4 / this.zoom);
            ctx.stroke();

            // Label
            ctx.fillStyle = isSel ? '#fef08a' : '#e0f2fe';
            ctx.font = `bold ${Math.max(10 / this.zoom, 8)}px sans-serif`;
            ctx.fillText(`#${i + 1} ${r.w}x${r.h}`, r.x + 2 / this.zoom, r.y + 10 / this.zoom);
        }

        // Draw In-progress creation rectangle
        if (this.isCreatingRegion) {
            const minX = Math.min(this.createStart.x, this.createCurrent.x);
            const minY = Math.min(this.createStart.y, this.createCurrent.y);
            const rw = Math.abs(this.createCurrent.x - this.createStart.x);
            const rh = Math.abs(this.createCurrent.y - this.createStart.y);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.fillRect(minX, minY, rw, rh);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1 / this.zoom;
            ctx.strokeRect(minX, minY, rw, rh);
        }

        ctx.restore();

        // 5. Draw 8 Handles for Selected Region in Screen Space
        if (this.selectedRegionIdx >= 0 && this.selectedRegionIdx < this.regions.length) {
            const r = this.regions[this.selectedRegionIdx];
            const sTopLeft = this.imageToScreen(r.x, r.y);
            const sW = r.w * this.zoom;
            const sH = r.h * this.zoom;
            const hPoints = [
                { x: sTopLeft.x, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y },
                { x: sTopLeft.x + sW, y: sTopLeft.y + sH / 2 },
                { x: sTopLeft.x + sW / 2, y: sTopLeft.y + sH },
                { x: sTopLeft.x, y: sTopLeft.y + sH / 2 }
            ];

            ctx.fillStyle = '#eab308';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            for (const hp of hPoints) {
                ctx.fillRect(hp.x - 4, hp.y - 4, 8, 8);
                ctx.strokeRect(hp.x - 4, hp.y - 4, 8, 8);
            }
        }

        // 6. Draw Alignment Guides
        if (this.activeGuides.length > 0) {
            ctx.strokeStyle = '#ec4899';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            for (const g of this.activeGuides) {
                if (g.type === 'v') {
                    const scrX = this.imageToScreen(g.x, 0).x;
                    ctx.beginPath(); ctx.moveTo(scrX, 0); ctx.lineTo(scrX, h); ctx.stroke();
                } else if (g.type === 'h') {
                    const scrY = this.imageToScreen(0, g.y).y;
                    ctx.beginPath(); ctx.moveTo(0, scrY); ctx.lineTo(w, scrY); ctx.stroke();
                }
            }
            ctx.setLineDash([]);
        }
    },

    updateRegionList() {
        const countEl = document.getElementById('dd-region-count');
        if (countEl) countEl.textContent = this.regions.length;
        const listEl = document.getElementById('dd-region-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        for (let i = 0; i < this.regions.length; i++) {
            const r = this.regions[i];
            const item = document.createElement('div');
            item.className = 'dd-btn' + (i === this.selectedRegionIdx ? ' dd-btn-active' : '');
            item.style.cssText = `
                display: flex; align-items: center; justify-content: space-between;
                padding: 6px 8px; font-size: 11px; text-align: left;
            `;
            item.innerHTML = `
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">
                    <strong>#${i + 1}</strong> ${escapeHtml(r.name || 'Region')}
                    <span style="color: #64748b; margin-left: 4px;">(${r.w}x${r.h})</span>
                </div>
                <span style="color: #94a3b8; font-size: 10px;">${r.x},${r.y}</span>
            `;
            item.onclick = () => {
                this.selectedRegionIdx = i;
                this.render();
                this.updateRegionList();
            };
            listEl.appendChild(item);
        }
        this.updateInspectorValues();
    },

    updateInspectorValues() {
        const insp = document.getElementById('dd-region-inspector');
        if (!insp) return;
        if (this.selectedRegionIdx < 0 || this.selectedRegionIdx >= this.regions.length) {
            insp.innerHTML = '<div style="color: #64748b; text-align: center;">No region selected</div>';
            return;
        }

        const r = this.regions[this.selectedRegionIdx];
        insp.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; margin-bottom: 8px;">Region #${this.selectedRegionIdx + 1} Properties</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">X:</label>
                    <input type="number" id="dd-insp-rx" value="${r.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Y:</label>
                    <input type="number" id="dd-insp-ry" value="${r.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Width:</label>
                    <input type="number" id="dd-insp-rw" value="${r.w}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Height:</label>
                    <input type="number" id="dd-insp-rh" value="${r.h}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
            <div style="margin-top: 6px;">
                <label style="color: #94a3b8; font-size: 10px;">Name:</label>
                <input type="text" id="dd-insp-name" value="${escapeHtml(r.name || '')}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px;">
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot X:</label>
                    <input type="number" step="0.1" id="dd-insp-pivx" value="${r.pivotX !== undefined ? r.pivotX : 0.5}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
                <div>
                    <label style="color: #94a3b8; font-size: 10px;">Pivot Y:</label>
                    <input type="number" step="0.1" id="dd-insp-pivy" value="${r.pivotY !== undefined ? r.pivotY : 1.0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                </div>
            </div>
        `;

        const rx = document.getElementById('dd-insp-rx');
        const ry = document.getElementById('dd-insp-ry');
        const rw = document.getElementById('dd-insp-rw');
        const rh = document.getElementById('dd-insp-rh');
        const rname = document.getElementById('dd-insp-name');
        const pivx = document.getElementById('dd-insp-pivx');
        const pivy = document.getElementById('dd-insp-pivy');

        const applyInputs = () => {
            r.x = parseInt(rx.value, 10) || 0;
            r.y = parseInt(ry.value, 10) || 0;
            r.w = Math.max(4, parseInt(rw.value, 10) || 4);
            r.h = Math.max(4, parseInt(rh.value, 10) || 4);
            r.name = rname.value;
            // 0 is a valid pivot (left/top edge); only blank or invalid input falls back.
            const px = parseFloat(pivx.value), py = parseFloat(pivy.value);
            r.pivotX = Number.isFinite(px) ? px : 0.5;
            r.pivotY = Number.isFinite(py) ? py : 1.0;
            this.render();
        };

        rx.onchange = applyInputs;
        ry.onchange = applyInputs;
        rw.onchange = applyInputs;
        rh.onchange = applyInputs;
        rname.onchange = applyInputs;
        pivx.onchange = applyInputs;
        pivy.onchange = applyInputs;
    },

    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.modal = null;
    }
};


//==========================================================
// SECTION 17: DocsDoodads.EVENTS (REAL MZ EVENT CREATOR)
//==========================================================
DocsDoodads.Events = {
    allocateSafeId(mapData) {
        if (!mapData || !mapData.events) return 1;
        const events = mapData.events;
        for (let i = 1; i < events.length; i++) {
            if (!events[i]) return i;
        }
        return events.length > 0 ? events.length : 1;
    },

    // The MZ editor lists each Set Movement Route step as a 505 line after the 205 command and
    // stores route steps with indent: null. The game ignores 505s, but the editor needs them.
    withRouteDisplayLines(list) {
        const out = [];
        const source = JSON.parse(JSON.stringify(list));
        for (let i = 0; i < source.length; i++) {
            const command = source[i];
            out.push(command);
            if (command.code !== 205 || !command.parameters || !command.parameters[1] || !Array.isArray(command.parameters[1].list)) continue;
            const route = command.parameters[1].list;
            route.forEach(step => { if (step.code !== 0 && !('indent' in step)) step.indent = null; });
            if (source[i + 1] && source[i + 1].code === 505) continue; // already in editor form
            for (const step of route) {
                if (step.code === 0) continue;
                out.push({ code: 505, indent: command.indent || 0, parameters: [JSON.parse(JSON.stringify(step))] });
            }
        }
        return out;
    },

    createEventObject(id, x, y, options = {}) {
        const ev = {
            id: id,
            name: options.name || `EV${String(id).padStart(3, '0')}`,
            note: options.note || "",
            x: x,
            y: y,
            pages: [
                {
                    conditions: {
                        actorId: 1, actorValid: false,
                        itemId: 1, itemValid: false,
                        selfSwitchCh: "A", selfSwitchValid: false,
                        switch1Id: 1, switch1Valid: false,
                        switch2Id: 1, switch2Valid: false,
                        variableId: 1, variableValid: false, variableValue: 0
                    },
                    directionFix: options.directionFix !== undefined ? options.directionFix : false,
                    image: {
                        characterIndex: options.characterIndex !== undefined ? options.characterIndex : 0,
                        // MZ ImageManager appends ".png" itself.
                        characterName: String(options.characterName || "").replace(/\.png$/i, ""),
                        direction: options.direction || 2,
                        pattern: options.pattern || 1,
                        tileId: 0
                    },
                    list: this.withRouteDisplayLines(options.list || [{ code: 0, indent: 0, parameters: [] }]),
                    moveFrequency: 3,
                    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
                    moveSpeed: 3,
                    moveType: 0,
                    priorityType: options.priorityType !== undefined ? options.priorityType : 1,
                    stepAnime: options.stepAnime !== undefined ? options.stepAnime : false,
                    through: options.through !== undefined ? options.through : false,
                    trigger: options.trigger !== undefined ? options.trigger : 0,
                    walkAnime: options.walkAnime !== undefined ? options.walkAnime : true
                }
            ]
        };
        return ev;
    }
};

//==========================================================
// SECTION 18: DocsDoodads.EVENTTEMPLATES (ALL 20 BUILT-INS + CUSTOM)
//==========================================================
DocsDoodads.EventTemplates = {
    customPath: 'data/DocsDoodadsEventTemplates.json',
    templates: {
        npc: {
            name: "NPC (Talkable)",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "NPC"] },
                { code: 401, indent: 0, parameters: ["Hello! Safe travels on your adventure."] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        door: {
            name: "Door (Interactive)",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: false,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Open1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 17 }, { code: 18 }, { code: 0 }], repeat: false, skippable: false, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        transfer_door: {
            name: "Transfer Door",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Move1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 10, 10, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        chest: {
            name: "Treasure Chest",
            category: "Interaction",
            trigger: 0, priorityType: 1, directionFix: true,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Chest1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 125, indent: 0, parameters: [1, 0, 0, 100] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Found 100 Gold!"] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        loot_pickup: {
            name: "Loot Pickup",
            category: "Interaction",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item3", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
                { code: 401, indent: 0, parameters: ["Obtained a Potion!"] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        signpost: {
            name: "Signpost",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 101, indent: 0, parameters: ["", 0, 0, 2, "Notice"] },
                { code: 401, indent: 0, parameters: ["Beware of monsters ahead!"] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        floor_switch: {
            name: "Floor Switch",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        wall_lever: {
            name: "Wall Lever",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Switch2", pan: 0, pitch: 100, volume: 90 }] },
                { code: 121, indent: 0, parameters: [1, 1, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        save_point: {
            name: "Save Point",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Recovery", pan: 0, pitch: 100, volume: 90 }] },
                { code: 352, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        shopkeeper: {
            name: "Shopkeeper",
            category: "Interaction",
            trigger: 0, priorityType: 1,
            list: [
                { code: 302, indent: 0, parameters: [0, 1, 0, 0, false] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        enemy_encounter: {
            name: "Enemy Encounter",
            category: "Interaction",
            trigger: 1, priorityType: 1,
            list: [
                { code: 301, indent: 0, parameters: [0, 1, false, false] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        harvestable: {
            name: "Harvestable Herb/Ore",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Item1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 126, indent: 0, parameters: [1, 0, 0, 1] },
                { code: 123, indent: 0, parameters: ["A", 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        breakable: {
            name: "Breakable Object",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Collapse1", pan: 0, pitch: 100, volume: 90 }] },
                { code: 214, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        pushable: {
            name: "Pushable Boulder",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 205, indent: 0, parameters: [0, { list: [{ code: 14 }, { code: 0 }], repeat: false, skippable: true, wait: true }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        light_source: {
            name: "Light Source / Campfire",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        animated_prop: {
            name: "Animated Prop",
            category: "Atmosphere",
            trigger: 0, priorityType: 1, stepAnime: true, walkAnime: false,
            list: [{ code: 0, indent: 0, parameters: [] }]
        },
        teleporter: {
            name: "Magical Teleporter",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 250, indent: 0, parameters: [{ name: "Teleport", pan: 0, pitch: 100, volume: 90 }] },
                { code: 201, indent: 0, parameters: [0, 1, 5, 5, 2, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        ladder_stairs: {
            name: "Ladder / Stairs",
            category: "Mechanics",
            trigger: 1, priorityType: 0,
            list: [
                { code: 201, indent: 0, parameters: [0, 1, 8, 2, 8, 0] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        vehicle: {
            name: "Vehicle Boarding",
            category: "Mechanics",
            trigger: 0, priorityType: 1,
            list: [
                { code: 354, indent: 0, parameters: [] },
                { code: 0, indent: 0, parameters: [] }
            ]
        },
        decoration_event: {
            name: "Decoration Event (Passable)",
            category: "Atmosphere",
            trigger: 0, priorityType: 0, through: true,
            list: [{ code: 0, indent: 0, parameters: [] }]
        }
    },

    init() {
        const custom = DocsDoodads.FS.readJson(this.customPath);
        if (custom) {
            Object.assign(this.templates, custom);
        }
    },

    get(templateKey) {
        return this.templates[templateKey] || this.templates.npc;
    },

    saveCustomTemplate(name, eventObj, category = "Custom") {
        const key = 'custom_' + name.toLowerCase().replace(/\s+/g, '_');
        const page0 = eventObj.pages && eventObj.pages[0] ? eventObj.pages[0] : {};
        const tmpl = {
            name: name,
            category: category,
            trigger: page0.trigger !== undefined ? page0.trigger : 0,
            priorityType: page0.priorityType !== undefined ? page0.priorityType : 1,
            directionFix: page0.directionFix || false,
            stepAnime: page0.stepAnime || false,
            walkAnime: page0.walkAnime !== undefined ? page0.walkAnime : true,
            through: page0.through || false,
            list: JSON.parse(JSON.stringify(page0.list || [{ code: 0, indent: 0, parameters: [] }]))
        };
        this.templates[key] = tmpl;

        let customData = DocsDoodads.FS.readJson(this.customPath) || {};
        customData[key] = tmpl;
        DocsDoodads.FS.atomicWriteJson(this.customPath, customData);
        return key;
    }
};

DocsDoodads.EventTemplates.init();


//==========================================================
// SECTION 19: DocsDoodads.COLLISION (PRESETS & SAT RUNTIME)
//==========================================================
DocsDoodads.Collision = {
    presets: {
        none: null,
        full: { x: 0, y: 0, w: 1, h: 1 },
        bottomHalf: { x: 0, y: 0.5, w: 1, h: 0.5 },
        bottomThird: { x: 0, y: 0.67, w: 1, h: 0.33 },
        center: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
        trunk: { x: 0.35, y: 0.75, w: 0.3, h: 0.25 },
        thinWall: { x: 0, y: 0.4, w: 1, h: 0.2 },
        wideWall: { x: 0, y: 0.25, w: 1, h: 0.5 },
        custom: { x: 0.2, y: 0.2, w: 0.6, h: 0.6 }
    },

    getPresetShape(presetName) {
        return this.presets[presetName] || null;
    },

    // The solid footprint at the bottom of a sprite (a tree's trunk, a wall's base) as a shape
    // relative to the frame. Faint pixels such as soft shadows and anti-aliasing are ignored.
    footprintFromAlpha(data, width, height, options = {}) {
        const frame = options.frame || { x: 0, y: 0, w: width, h: height };
        const threshold = options.alphaThreshold !== undefined ? options.alphaThreshold : 48;
        const fw = Math.max(1, Math.min(frame.w, width - frame.x));
        const fh = Math.max(1, Math.min(frame.h, height - frame.y));
        const solid = (px, py) => data[((frame.y + py) * width + frame.x + px) * 4 + 3] >= threshold;

        let top = -1, bottom = -1;
        for (let py = 0; py < fh; py++) {
            for (let px = 0; px < fw; px++) {
                if (solid(px, py)) {
                    if (top < 0) top = py;
                    bottom = py;
                    break;
                }
            }
        }
        if (bottom < 0) return null;

        const contentH = bottom - top + 1;
        const ratio = options.bandRatio !== undefined ? options.bandRatio : 0.25;
        const minBand = options.minBandPx !== undefined ? options.minBandPx : 4;
        const maxBand = options.maxBandPx !== undefined ? options.maxBandPx : 32;
        const band = Math.max(1, Math.min(contentH, Math.max(minBand, Math.min(maxBand, Math.round(contentH * ratio)))));
        const bandTop = bottom - band + 1;
        const columnFill = options.columnFill !== undefined ? options.columnFill : 0.3;

        let minCol = -1, maxCol = -1;
        for (let px = 0; px < fw; px++) {
            let count = 0;
            for (let py = bandTop; py <= bottom; py++) if (solid(px, py)) count++;
            if (count / band >= columnFill) {
                if (minCol < 0) minCol = px;
                maxCol = px;
            }
        }
        if (minCol < 0) return null;
        const round = v => Math.round(v * 10000) / 10000;
        return { x: round(minCol / fw), y: round(bandTop / fh), w: round((maxCol - minCol + 1) / fw), h: round(band / fh) };
    }
};

if (typeof Game_CharacterBase !== 'undefined') {
    const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
    Game_CharacterBase.prototype.canPass = function(x, y, d) {
        if (!_Game_CharacterBase_canPass.apply(this, arguments)) return false;

        const doodads = DocsDoodads.doodads();
        if (!doodads || doodads.length === 0) return true;

        const targetMapX = $gameMap.roundXWithDirection(x, d);
        const targetMapY = $gameMap.roundYWithDirection(y, d);
        const targetPx = targetMapX * 48 + 24;
        const targetPy = targetMapY * 48 + 24;
        const playerSATBox = DocsDoodads.box(targetPx, targetPy, 32, 32);

        for (const dData of doodads) {
            if (dData.collision && dData.collision.preset !== "none") {
                const shape = dData.collision.shape || DocsDoodads.Collision.getPresetShape(dData.collision.preset);
                if (shape) {
                    const dw = (dData.frameW || 48) * (dData.scaleX || 1);
                    const dh = (dData.frameH || 48) * (dData.scaleY || 1);
                    const ax = dData.anchorX !== undefined ? dData.anchorX : 0.5;
                    const ay = dData.anchorY !== undefined ? dData.anchorY : 1.0;

                    const originX = dData.x - dw * ax;
                    const originY = dData.y - dh * ay;

                    const colX = originX + shape.x * dw + (shape.w * dw) / 2;
                    const colY = originY + shape.y * dh + (shape.h * dh) / 2;
                    const colW = shape.w * dw;
                    const colH = shape.h * dh;

                    const colBody = DocsDoodads.box(colX, colY, colW, colH);
                    if (DocsDoodads.judge(colBody, playerSATBox)) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
}

//==========================================================
// SECTION 19B: PLACEMENT TOOLS (PATHS, SCATTER, GUIDES, PREFABS, MAP LINKS)
//==========================================================
DocsDoodads.Paths = {
    // Catmull-Rom through the clicked points; the ends stay where they were clicked.
    smooth(points, steps = 8) {
        if (!points || points.length < 3) return (points || []).slice();
        const out = [];
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
            for (let s = 0; s < steps; s++) {
                const t = s / steps, t2 = t * t, t3 = t2 * t;
                const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
                out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
            }
        }
        out.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
        return out;
    },

    angleOf(a, b) {
        return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    },

    // Evenly spaced placements along the path. Sharp turns become "corner" pieces at the vertex,
    // and each straight run is spaced so its pieces meet the corners exactly.
    sample(points, spacing, options = {}) {
        const pts = (options.smooth ? this.smooth(points) : points || []).map(p => ({ x: p.x, y: p.y }));
        if (pts.length === 0) return [];
        if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y, angle: 0, kind: 'start' }];
        spacing = Math.max(4, Number(spacing) || 48);
        const cornerAngle = options.cornerAngle !== undefined ? options.cornerAngle : 35;

        // Split the polyline into runs at sharp vertices.
        const runs = [];
        let run = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
            run.push(pts[i]);
            if (i < pts.length - 1 && !options.smooth) {
                let turn = Math.abs(this.angleOf(pts[i], pts[i + 1]) - this.angleOf(pts[i - 1], pts[i])) % 360;
                if (turn > 180) turn = 360 - turn;
                if (turn >= cornerAngle) {
                    runs.push(run);
                    run = [pts[i]];
                }
            }
        }
        runs.push(run);

        const out = [];
        runs.forEach((r, runIndex) => {
            const lengths = [];
            let total = 0;
            for (let i = 1; i < r.length; i++) {
                const len = Math.hypot(r[i].x - r[i - 1].x, r[i].y - r[i - 1].y);
                lengths.push(len);
                total += len;
            }
            const n = Math.max(1, Math.round(total / spacing));
            const pointAt = (dist) => {
                let seg = 0;
                while (seg < lengths.length - 1 && dist > lengths[seg]) { dist -= lengths[seg]; seg++; }
                const a = r[seg], b = r[seg + 1];
                const k = lengths[seg] > 0 ? Math.min(1, dist / lengths[seg]) : 0;
                return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: this.angleOf(a, b) };
            };
            for (let i = runIndex === 0 ? 0 : 1; i <= n; i++) {
                const p = pointAt(total * i / n);
                const isFirst = runIndex === 0 && i === 0;
                const isLast = runIndex === runs.length - 1 && i === n;
                const kind = isFirst ? 'start' : isLast ? 'end' : i === n ? 'corner' : 'segment';
                out.push({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100, angle: Math.round(p.angle * 100) / 100, kind });
            }
        });
        return out;
    }
};

DocsDoodads.Scatter = {
    // Small seeded generator so a stroke can be reproduced in tests.
    rng(seed) {
        let a = (Number(seed) || 1) >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    },

    // Poisson-disk style dart throwing: no two props closer than minDistance, existing props included.
    candidates(center, radius, minDistance, existing, count, rng, maxAttempts) {
        const accepted = [];
        const others = (existing || []).slice();
        const attempts = maxAttempts || Math.max(30, count * 30);
        for (let i = 0; i < attempts && accepted.length < count; i++) {
            const angle = rng() * Math.PI * 2;
            const dist = radius * Math.sqrt(rng());
            const p = { x: center.x + Math.cos(angle) * dist, y: center.y + Math.sin(angle) * dist };
            if (minDistance > 0 && others.some(o => Math.hypot(o.x - p.x, o.y - p.y) < minDistance)) continue;
            accepted.push(p);
            others.push(p);
        }
        return accepted;
    },

    parseIdList(text) {
        return String(text || '').split(/[^0-9]+/).filter(Boolean).map(n => parseInt(n, 10)).filter(n => n > 0);
    },

    allowed(point, rules, query) {
        const tw = query.tileWidth || 48, th = query.tileHeight || 48;
        const tx = Math.floor(point.x / tw), ty = Math.floor(point.y / th);
        if (point.x < 0 || point.y < 0 || tx >= query.width || ty >= query.height) return false;
        rules = rules || {};
        if (rules.regions && rules.regions.length > 0 && !rules.regions.includes(query.regionId(tx, ty))) return false;
        if (rules.terrainTags && rules.terrainTags.length > 0 && !rules.terrainTags.includes(query.terrainTag(tx, ty))) return false;
        if (rules.avoidBlocked && !query.isPassable(tx, ty)) return false;
        return true;
    },

    variation(settings, rng) {
        const jitter = (amount) => (rng() * 2 - 1) * (Number(amount) || 0);
        return {
            scale: Math.round((1 + jitter(settings.scaleJitter)) * 100) / 100,
            rotation: Math.round(jitter(settings.rotateJitter)),
            flipX: rng() < (Number(settings.flipChance) || 0),
            hue: Math.round(jitter(settings.hueJitter))
        };
    }
};

DocsDoodads.Guides = {
    rectOf(d) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1);
        return { left, right: left + w, top, bottom: top + h, cx: left + w / 2, cy: top + h / 2 };
    },

    unionRect(rects) {
        const r = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        for (const x of rects) {
            r.left = Math.min(r.left, x.left); r.right = Math.max(r.right, x.right);
            r.top = Math.min(r.top, x.top); r.bottom = Math.max(r.bottom, x.bottom);
        }
        r.cx = (r.left + r.right) / 2;
        r.cy = (r.top + r.bottom) / 2;
        return r;
    },

    // Edge/centre alignment first; otherwise equal spacing between the nearest neighbours.
    snap(moving, others, threshold = 6) {
        const result = { dx: 0, dy: 0, lines: [] };
        const m = Object.assign({}, moving);
        if (m.cx === undefined) m.cx = (m.left + m.right) / 2;
        if (m.cy === undefined) m.cy = (m.top + m.bottom) / 2;
        const rects = (others || []).map(o => Object.assign({ cx: (o.left + o.right) / 2, cy: (o.top + o.bottom) / 2 }, o));

        const axis = (keys, crossFrom, crossTo, name) => {
            let best = null;
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        const diff = o[ok] - m[mk];
                        if (Math.abs(diff) <= threshold && (best === null || Math.abs(diff) < Math.abs(best))) best = diff;
                    }
                }
            }
            if (best === null) return null;
            const lines = [];
            for (const o of rects) {
                for (const mk of keys) {
                    for (const ok of keys) {
                        if (Math.abs(o[ok] - (m[mk] + best)) < 0.01) {
                            lines.push({ axis: name, at: o[ok], from: Math.min(o[crossFrom], m[crossFrom]), to: Math.max(o[crossTo], m[crossTo]) });
                        }
                    }
                }
            }
            return { delta: best, lines };
        };

        const spacing = (lo, hi, crossLo, crossHi, name) => {
            const overlapping = rects.filter(o => o[crossLo] < m[crossHi] && o[crossHi] > m[crossLo]);
            const before = overlapping.filter(o => o[hi] <= m[lo]).sort((a, b) => b[hi] - a[hi])[0];
            const after = overlapping.filter(o => o[lo] >= m[hi]).sort((a, b) => a[lo] - b[lo])[0];
            if (!before || !after) return null;
            const gap1 = m[lo] - before[hi], gap2 = after[lo] - m[hi];
            if (Math.abs(gap1 - gap2) > threshold * 2) return null;
            const delta = (gap2 - gap1) / 2;
            const mid = (m[crossLo] + m[crossHi]) / 2;
            return { delta, lines: [
                { axis: name, kind: 'spacing', at: mid, from: before[hi], to: m[lo] + delta },
                { axis: name, kind: 'spacing', at: mid, from: m[hi] + delta, to: after[lo] }
            ] };
        };

        const x = axis(['left', 'cx', 'right'], 'top', 'bottom', 'x') || spacing('left', 'right', 'top', 'bottom', 'x-gap');
        const y = axis(['top', 'cy', 'bottom'], 'left', 'right', 'y') || spacing('top', 'bottom', 'left', 'right', 'y-gap');
        if (x) { result.dx = x.delta; result.lines.push(...x.lines); }
        if (y) { result.dy = y.delta; result.lines.push(...y.lines); }
        return result;
    }
};

DocsDoodads.Prefabs = {
    filePath: 'data/DocsDoodadsPrefabs.json',
    list: [],
    loaded: false,

    load() {
        const data = DocsDoodads.FS.readJson(this.filePath);
        this.list = data && Array.isArray(data.prefabs) ? data.prefabs : [];
        this.loaded = true;
        return this.list;
    },

    ensureLoaded() {
        if (!this.loaded) this.load();
        return this.list;
    },

    save() {
        return DocsDoodads.FS.atomicWriteJson(this.filePath, { version: 1, prefabs: this.list });
    },

    get(id) {
        return this.ensureLoaded().find(p => p.id === id) || null;
    },

    add(prefab) {
        this.ensureLoaded().push(prefab);
        return prefab;
    },

    remove(id) {
        const index = this.ensureLoaded().findIndex(p => p.id === id);
        if (index >= 0) this.list.splice(index, 1);
        return index >= 0;
    },

    newId(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    },

    cleanDoodad(d) {
        const copy = JSON.parse(JSON.stringify(d));
        for (const key of ['groupId', 'prefabRef', 'locked', 'uid', 'mirrorOf', 'editorHidden']) delete copy[key];
        return copy;
    },

    // The origin is the bottom-centre of the doodads' anchor points; events keep tile offsets from it.
    originFor(doodads, events, tw, th) {
        if (doodads.length > 0) {
            const xs = doodads.map(d => d.x), ys = doodads.map(d => d.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2), y: Math.max(...ys) };
        }
        if (events.length > 0) {
            const xs = events.map(e => e.x), ys = events.map(e => e.y);
            return { x: Math.round((Math.min(...xs) + Math.max(...xs)) / 2 * tw + tw / 2), y: (Math.max(...ys) + 1) * th };
        }
        return { x: 0, y: 0 };
    },

    capture(name, doodads, events, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        doodads = (doodads || []).filter(Boolean);
        events = (events || []).filter(Boolean);
        const origin = this.originFor(doodads, events, tw, th);
        const originTile = { x: Math.floor(origin.x / tw), y: Math.floor((origin.y - 1) / th) };
        const first = doodads.find(d => d.bit && d.bit[0] === 3);
        return {
            id: this.newId('pf_'),
            name: String(name || 'Prefab').trim() || 'Prefab',
            createdAt: Date.now(),
            origin,
            thumbnail: first ? first.bit[1] : '',
            doodads: doodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - origin.x, y: d.y - origin.y })),
            events: events.map(e => Object.assign(JSON.parse(JSON.stringify(e)), { dx: e.x - originTile.x, dy: e.y - originTile.y }))
        };
    },

    instantiate(prefab, at, options = {}) {
        const tw = options.tileWidth || 48, th = options.tileHeight || 48;
        const instance = options.instance || this.newId('pi_');
        const groupId = options.groupId || ('grp_' + instance);
        const atTile = { x: Math.floor(at.x / tw), y: Math.floor((at.y - 1) / th) };
        const doodads = (prefab.doodads || []).map(src => {
            const d = JSON.parse(JSON.stringify(src));
            d.x = Math.round(at.x + src.x);
            d.y = Math.round(at.y + src.y);
            d.groupId = groupId;
            d.prefabRef = { id: prefab.id, instance, ox: at.x, oy: at.y };
            return d;
        });
        const events = (prefab.events || []).map(src => {
            const e = JSON.parse(JSON.stringify(src));
            e.x = atTile.x + src.dx;
            e.y = atTile.y + src.dy;
            delete e.dx;
            delete e.dy;
            e.id = options.allocateEventId ? options.allocateEventId(e) : null;
            return e;
        });
        return { instance, groupId, doodads, events };
    },

    // Recaptures the master's doodads from one placed copy (its events are left as they were).
    updateFromInstance(prefab, instanceDoodads) {
        if (!prefab || !instanceDoodads || instanceDoodads.length === 0) return null;
        const ref = instanceDoodads[0].prefabRef;
        prefab.doodads = instanceDoodads.map(d => Object.assign(this.cleanDoodad(d), { x: d.x - ref.ox, y: d.y - ref.oy }));
        const first = instanceDoodads.find(d => d.bit && d.bit[0] === 3);
        if (first) prefab.thumbnail = first.bit[1];
        prefab.updatedAt = Date.now();
        return prefab;
    }
};

DocsDoodads.MapLinks = {
    sides: ['east', 'west', 'north', 'south'],

    ensureUid(d) {
        if (!d.uid) d.uid = 'dd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        return d;
    },

    // World positions (pixels) of the current map and its linked neighbours, up to depth links away.
    layout(mapId, neighborsOf, sizeOf, depth = 2) {
        const start = sizeOf(mapId);
        if (!start) return [];
        const placed = [{ mapId, x: 0, y: 0, w: start.w, h: start.h, distance: 0 }];
        const seen = new Set([mapId]);
        for (let i = 0; i < placed.length; i++) {
            const m = placed[i];
            if (m.distance >= depth) continue;
            const links = neighborsOf(m.mapId) || {};
            for (const side of this.sides) {
                const id = Number(links[side]);
                if (!id || seen.has(id)) continue;
                const size = sizeOf(id);
                if (!size) continue;
                seen.add(id);
                const x = side === 'east' ? m.x + m.w : side === 'west' ? m.x - size.w : m.x;
                const y = side === 'south' ? m.y + m.h : side === 'north' ? m.y - size.h : m.y;
                placed.push({ mapId: id, x, y, w: size.w, h: size.h, distance: m.distance + 1 });
            }
        }
        return placed;
    },

    bounds(layout) {
        return {
            left: Math.min(...layout.map(m => m.x)), top: Math.min(...layout.map(m => m.y)),
            right: Math.max(...layout.map(m => m.x + m.w)), bottom: Math.max(...layout.map(m => m.y + m.h))
        };
    },

    // Copies of doodads that hang over this map's edges, shifted into each neighbouring map.
    edgeCopies(mapId, doodads, neighbors, sizeOf) {
        const out = [];
        const size = sizeOf(mapId);
        if (!size || !neighbors) return out;
        for (const d of doodads || []) {
            if (!d || d.mirrorOf || d.posMode === 0) continue;
            const r = DocsDoodads.Guides.rectOf(d);
            const shifts = [];
            if (neighbors.east && r.right > size.w) shifts.push({ mapId: neighbors.east, dx: -size.w, dy: 0 });
            if (neighbors.west && r.left < 0) { const s = sizeOf(neighbors.west); if (s) shifts.push({ mapId: neighbors.west, dx: s.w, dy: 0 }); }
            if (neighbors.south && r.bottom > size.h) shifts.push({ mapId: neighbors.south, dx: 0, dy: -size.h });
            if (neighbors.north && r.top < 0) { const s = sizeOf(neighbors.north); if (s) shifts.push({ mapId: neighbors.north, dx: 0, dy: s.h }); }
            for (const shift of shifts) {
                const copy = DocsDoodads.Prefabs.cleanDoodad(d);
                copy.x = d.x + shift.dx;
                copy.y = d.y + shift.dy;
                copy.mirrorOf = { mapId, uid: d.uid };
                out.push({ mapId: Number(shift.mapId), doodad: copy });
            }
        }
        return out;
    }
};

//==========================================================
// SECTION 20: DocsDoodads.UNDO (COMMAND-BASED HISTORY STACK)
//==========================================================
DocsDoodads.Undo = {
    undoStack: [],
    redoStack: [],
    maxDepth: 300,

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.updateUndoButtons();
    },

    execute(command) {
        if (!command || !command.apply || !command.revert) return;
        DocsDoodads.Usage.lastIndex = null;
        command.apply();
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) this.undoStack.shift();
        this.redoStack = [];
        DocsDoodads.Workspace.updateUndoButtons();
    },

    undo() {
        if (this.undoStack.length === 0) return false;
        const cmd = this.undoStack.pop();
        cmd.revert();
        this.redoStack.push(cmd);
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playCancel();
        return true;
    },

    redo() {
        if (this.redoStack.length === 0) return false;
        const cmd = this.redoStack.pop();
        cmd.apply();
        this.undoStack.push(cmd);
        DocsDoodads.Workspace.updateUndoButtons();
        if (DocsDoodads.Workspace.mounted) DocsDoodads.Workspace.refreshInspector();
        if (typeof SoundManager !== 'undefined') SoundManager.playOk();
        return true;
    }
};

//==========================================================
// SECTION 21: DocsDoodads.PERSISTENCE & RECOVERY
//==========================================================
DocsDoodads.Persistence = {
    sessionSnapshots: {},
    dirtyMap: false,
    dirtyDoodads: false,
    // Unsaved event edits for maps other than the current one, keyed by map id.
    stagedMaps: {},

    mapFilePath(mapId) {
        return `data/Map${String(mapId).padStart(3, '0')}.json`;
    },

    captureSession() {
        if (!window.$gameMap) return;
        const mapFile = this.mapFilePath($gameMap.mapId());
        this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
    },

    // The staged (editable) copy of a map's data, loaded from disk the first time it is needed.
    // It is tagged with its map id so edits can never be written into a different map's file.
    stagedFor(mapId) {
        const gameMap = window.$gameMap;
        if (!gameMap) return null;
        mapId = mapId || gameMap.mapId();
        // Untagged staged data predates map tagging and always belongs to the current map.
        const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
        if (gameMap._stagedMapData && owner === mapId) {
            gameMap._stagedMapDataId = mapId;
            return gameMap._stagedMapData;
        }
        if (gameMap._stagedMapData) this.stagedMaps[owner] = gameMap._stagedMapData;
        let data = this.stagedMaps[mapId];
        delete this.stagedMaps[mapId];
        if (!data) {
            const mapFile = this.mapFilePath(mapId);
            if (!this.sessionSnapshots[mapFile]) this.sessionSnapshots[mapFile] = DocsDoodads.FS.stat(mapFile);
            data = DocsDoodads.FS.readJson(mapFile) || { events: [null] };
        }
        gameMap._stagedMapData = data;
        gameMap._stagedMapDataId = mapId;
        return data;
    },

    // Called before the game loads another map: park this map's staged edits and bring back the next one's.
    onMapChanging(fromId, toId) {
        const gameMap = window.$gameMap;
        if (!gameMap || fromId === toId) return;
        // Undo commands capture the map they were made on; they must not run against another map.
        DocsDoodads.Undo.clear();
        if (gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : fromId;
            if (this.dirtyMap) this.stagedMaps[owner] = gameMap._stagedMapData;
        }
        gameMap._stagedMapData = this.stagedMaps[toId] || null;
        if (gameMap._stagedMapData) {
            gameMap._stagedMapDataId = toId;
            delete this.stagedMaps[toId];
        } else {
            delete gameMap._stagedMapDataId;
        }
    },

    // Every map file this save will write: the current map's staged data plus any parked maps.
    pendingMapEntries() {
        const entries = [];
        const gameMap = window.$gameMap;
        if (gameMap && gameMap._stagedMapData) {
            const owner = gameMap._stagedMapDataId !== undefined ? gameMap._stagedMapDataId : gameMap.mapId();
            entries.push({ mapId: owner, data: gameMap._stagedMapData });
        }
        for (const [mapId, data] of Object.entries(this.stagedMaps)) {
            if (!entries.some(e => String(e.mapId) === String(mapId))) entries.push({ mapId: Number(mapId), data });
        }
        return entries;
    },

    checkConflict() {
        if (!window.$gameMap) return false;
        const files = new Set([this.mapFilePath($gameMap.mapId())]);
        for (const entry of this.pendingMapEntries()) files.add(this.mapFilePath(entry.mapId));
        for (const mapFile of files) {
            const snap = this.sessionSnapshots[mapFile];
            if (!snap) continue;
            const current = DocsDoodads.FS.stat(mapFile);
            if (!current) continue;
            if (current.mtimeMs !== snap.mtimeMs || current.size !== snap.size) return true;
        }
        return false;
    },

    saveAll(force = false) {
        if (!window.$gameMap) return false;
        if (!force && this.checkConflict()) {
            DocsDoodads.Workspace.showConflictModal();
            return false;
        }

        const doodadFile = 'data/' + dataFileName;
        const mapEntries = this.pendingMapEntries().map(e => ({ path: this.mapFilePath(e.mapId), data: e.data, indent: 2 }));
        const entries = mapEntries.concat([
            { path: doodadFile, data: window.$dataDocsDoodads || {}, indent: saveMode ? 0 : 2 },
            { path: DocsDoodads.AssetIndex.libraryPath, data: DocsDoodads.AssetIndex.data, indent: 2 }
        ]);

        try {
            for (const entry of entries) DocsDoodads.FS.createTimestampedBackup(entry.path);
        } catch (error) {
            DocsDoodads.Core.log('Backup creation failed; save cancelled.', error);
            DocsDoodads.Workspace.showToast(`Save cancelled: backup failed (${error.message || error}).`);
            return false;
        }

        const saveResult = DocsDoodads.FS.atomicWriteManyJson(entries);
        if (!saveResult.ok) {
            DocsDoodads.Core.log('Project save transaction failed.', saveResult.error);
            DocsDoodads.Workspace.showToast(`Save failed${saveResult.rolledBack ? '; previous files restored' : ''}: ${saveResult.error}`);
            return false;
        }

        for (const entry of mapEntries) this.sessionSnapshots[entry.path] = DocsDoodads.FS.stat(entry.path);
        this.stagedMaps = {};

        this.dirtyMap = false;
        this.dirtyDoodads = false;
        this.clearRecovery();
        const extra = mapEntries.length > 1 ? ` (${mapEntries.length} maps)` : '';
        DocsDoodads.Workspace.showToast(`Project Saved${extra}! Reload maps in MZ before editing there.`);
        return true;
    },

    // Snapshots written during this Playtest run are its own autosaves, not crash leftovers.
    bootedAt: Date.now(),

    recoverableSnapshot() {
        const recovery = DocsDoodads.FS.readJson('data/DocsDoodadsRecovery.json');
        if (!recovery || !recovery.timestamp) return null;
        if (recovery.timestamp >= this.bootedAt) return null;
        if (this.bootedAt - recovery.timestamp >= 86400000) return null;
        if (recovery.timestamp === this.answeredRecovery) return null;
        return recovery;
    },

    // Accepted or declined: don't ask again about the same snapshot while this Playtest runs.
    markRecoveryAnswered(recovery) {
        this.answeredRecovery = recovery ? recovery.timestamp : null;
    },

    clearRecovery() {
        const recoveryPath = 'data/DocsDoodadsRecovery.json';
        for (const filePath of [recoveryPath, DocsDoodads.Legacy.pathFor(recoveryPath)]) {
            if (DocsDoodads.FS.fs && DocsDoodads.FS.fs.existsSync(filePath)) {
                try { DocsDoodads.FS.fs.unlinkSync(filePath); } catch(e) {}
            }
        }
    }
};

//==========================================================
// SECTION 22: DocsDoodads.LAYOUT (MULTIPLE SAVED LAYOUTS)
//==========================================================
DocsDoodads.Layout = {
    filePath: 'data/DocsDoodadsLayouts.json',
    presets: {
        Mapping: { drawerWidth: 360, inspectorWidth: 280, thumbSize: 96, viewMode: 'grid' },
        Events: { drawerWidth: 320, inspectorWidth: 380, thumbSize: 80, viewMode: 'grid' },
        Characters: { drawerWidth: 420, inspectorWidth: 260, thumbSize: 128, viewMode: 'grid' },
        Tiles: { drawerWidth: 380, inspectorWidth: 260, thumbSize: 48, viewMode: 'compact' },
        Compact: { drawerWidth: 280, inspectorWidth: 240, thumbSize: 64, viewMode: 'list' }
    },
    custom: {},
    current: defaultLayoutName,

    init() {
        try {
            const data = DocsDoodads.FS.readJson(this.filePath);
            if (data && typeof data === 'object') {
                this.custom = data;
            } else {
                this.custom = {};
            }
        } catch(e) {
            this.custom = {};
        }
    },

    get(layoutName) {
        return this.custom[layoutName] || this.presets[layoutName] || this.presets.Mapping;
    },

    getAllNames() {
        this.init();
        const pNames = Object.keys(this.presets);
        const cNames = Object.keys(this.custom);
        return [...pNames, ...cNames.filter(n => !pNames.includes(n))];
    },

    saveCurrentAs(name) {
        if (!name || name.trim() === '') return false;
        name = name.trim();
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        const zoom = document.getElementById('dd-thumb-zoom');
        const layoutData = {
            drawerWidth: drawer ? (parseInt(drawer.style.width, 10) || 360) : 360,
            inspectorWidth: inspector ? (parseInt(inspector.style.width, 10) || 280) : 280,
            thumbSize: zoom ? (parseInt(zoom.value, 10) || 96) : 96,
            viewMode: 'grid'
        };
        this.custom[name] = layoutData;
        DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
        this.current = name;
        return true;
    },

    deleteCustomLayout(name) {
        if (this.custom[name]) {
            delete this.custom[name];
            DocsDoodads.FS.atomicWriteJson(this.filePath, this.custom);
            if (this.current === name) this.apply('Mapping');
            return true;
        }
        return false;
    },

    apply(layoutName) {
        this.init();
        this.current = layoutName;
        const cfg = this.get(layoutName);
        const drawer = document.getElementById('dd-drawer-panel');
        const inspector = document.getElementById('dd-inspector-panel');
        if (drawer) drawer.style.width = cfg.drawerWidth + 'px';
        if (inspector) inspector.style.width = cfg.inspectorWidth + 'px';
        const zoom = document.getElementById('dd-thumb-zoom');
        if (zoom) {
            zoom.value = cfg.thumbSize;
            if (DocsDoodads.Workspace) {
                DocsDoodads.Workspace.thumbSize = cfg.thumbSize;
                DocsDoodads.Workspace.updateVirtualGrid(true);
            }
        }
        if (DocsDoodads.Workspace && typeof DocsDoodads.Workspace.refreshLayoutSelector === 'function') {
            DocsDoodads.Workspace.refreshLayoutSelector();
        }
    }
};

//==========================================================
// SECTION 23: DocsDoodads.AUDIO (PREVIEW & SOUND TRIGGERS)
//==========================================================
DocsDoodads.Audio = {
    currentPlaying: null,
    // The map's BGM/BGS from before the first BGM/BGS preview, restored when previews stop.
    _savedBackground: null,

    playPreview(asset) {
        if (!asset || asset.category !== 'Audio') return;
        const baseName = asset.fileName.replace(/\.[^/.]+$/, "");
        this.stopPreview();
        if (typeof AudioManager === 'undefined') return;

        const sound = { name: baseName, volume: 90, pitch: 100, pan: 0 };
        let type = 'se';
        if (asset.path.includes('/bgm/')) type = 'bgm';
        else if (asset.path.includes('/bgs/')) type = 'bgs';
        else if (asset.path.includes('/me/')) type = 'me';

        if ((type === 'bgm' || type === 'bgs') && !this._savedBackground) {
            this._savedBackground = { bgm: AudioManager.saveBgm(), bgs: AudioManager.saveBgs() };
        }
        if (type === 'bgm') AudioManager.playBgm(sound);
        else if (type === 'bgs') AudioManager.playBgs(sound);
        else if (type === 'me') AudioManager.playMe(sound); // MZ resumes the BGM after an ME
        else AudioManager.playSe(sound);
        this.currentPlaying = { type, name: baseName };
    },

    stopPreview() {
        const playing = this.currentPlaying;
        this.currentPlaying = null;
        if (!playing || typeof AudioManager === 'undefined') return;
        if (playing.type === 'se') AudioManager.stopSe();
        else if (playing.type === 'me') AudioManager.stopMe();
        else if (this._savedBackground) {
            const saved = this._savedBackground;
            this._savedBackground = null;
            AudioManager.replayBgm(saved.bgm);
            AudioManager.replayBgs(saved.bgs);
        }
    }
};

//==========================================================
// SECTION 24: DocsDoodads.IMPORT (TRANSACTIONAL EXPLORER INGESTION)
//==========================================================
DocsDoodads.Import = {
    imageExtensions: new Set(['.png', '.jpg', '.jpeg', '.webp']),
    audioExtensions: new Set(['.ogg', '.m4a', '.wav']),
    destinations: [
        'img/doodads', 'img/characters', 'img/faces', 'img/parallaxes',
        'img/pictures', 'img/tilesets', 'audio/bgm', 'audio/bgs',
        'audio/me', 'audio/se'
    ],

    isSupported(filePath) {
        if (!DocsDoodads.FS.path) return false;
        const ext = DocsDoodads.FS.path.extname(filePath).toLowerCase();
        return this.imageExtensions.has(ext) || this.audioExtensions.has(ext);
    },

    detectDestination(filePath) {
        const path = DocsDoodads.FS.path;
        if (!path) return null;
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName).toLowerCase();
        const lower = fileName.toLowerCase();
        const normalizedSource = String(filePath).replace(/\\/g, '/').toLowerCase();

        if (this.audioExtensions.has(ext)) {
            if (normalizedSource.includes('/bgm/') || /(^|[_\-.])bgm([_\-.]|$)/.test(lower)) return 'audio/bgm';
            if (normalizedSource.includes('/bgs/') || /(^|[_\-.])bgs([_\-.]|$)/.test(lower)) return 'audio/bgs';
            if (normalizedSource.includes('/me/') || /(^|[_\-.])me([_\-.]|$)/.test(lower)) return 'audio/me';
            return 'audio/se';
        }
        if (!this.imageExtensions.has(ext)) return null;

        if (normalizedSource.includes('/characters/') || lower.startsWith('$') || lower.includes('character') || lower.includes('actor')) return 'img/characters';
        if (normalizedSource.includes('/faces/') || lower.includes('face')) return 'img/faces';
        if (normalizedSource.includes('/parallaxes/') || lower.includes('parall')) return 'img/parallaxes';
        if (normalizedSource.includes('/pictures/') || /(^|[_\-.])pic(ture)?([_\-.]|$)/.test(lower)) return 'img/pictures';
        if (normalizedSource.includes('/tilesets/') || lower.includes('tile')) return 'img/tilesets';
        return 'img/doodads';
    },

    normalizeDestination(destination) {
        const normalized = String(destination || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
        return this.destinations.includes(normalized) ? normalized : null;
    },

    validateExecutionPlan(plan) {
        const path = DocsDoodads.FS.path;
        if (!path || !plan || !Array.isArray(plan.operations)) return 'Import plan is invalid.';
        const projectRoot = path.resolve(plan.projectRoot || '.');
        for (const operation of plan.operations) {
            if (!operation || !operation.source || !operation.destination || !this.isSupported(operation.source)) {
                return 'Import plan contains an invalid or unsupported operation.';
            }
            const destination = path.resolve(operation.destination);
            const relative = path.relative(projectRoot, destination).replace(/\\/g, '/');
            const insideProject = relative && !relative.startsWith('../') && relative !== '..' && !path.isAbsolute(relative);
            const insideAllowedFolder = this.destinations.some(folder => relative.startsWith(folder + '/'));
            if (!insideProject || !insideAllowedFolder) {
                return `Import destination is outside an allowed project asset folder: ${operation.destination}`;
            }
        }
        return null;
    },

    collectFiles(sourcePaths) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const files = [];
        const errors = [];
        // For files inside a dropped folder: their sub-folder path below that dropped folder ('' at its top level).
        const relativeDirs = new Map();
        if (!fs || !path) return { files, errors: [{ path: '', message: 'Filesystem access is unavailable.' }], relativeDirs };

        const pending = Array.from(sourcePaths || []).filter(Boolean).map(p => ({ current: path.resolve(String(p)), root: null }));
        while (pending.length > 0) {
            const { current, root } = pending.pop();
            try {
                const stat = fs.statSync(current);
                if (stat.isDirectory()) {
                    const children = fs.readdirSync(current).sort().reverse();
                    for (const child of children) pending.push({ current: path.join(current, child), root: root || current });
                } else if (stat.isFile()) {
                    files.push(current);
                    if (root) relativeDirs.set(current, path.relative(root, path.dirname(current)));
                }
            } catch (error) {
                errors.push({ path: current, message: error && error.message ? error.message : String(error) });
            }
        }
        files.sort((a, b) => a.localeCompare(b));
        return { files, errors, relativeDirs };
    },

    // Plain-language summary of a runAssetImport result for the toast.
    describeResult(result) {
        const path = DocsDoodads.FS.path;
        const baseName = (p) => path ? path.basename(String(p)) : String(p).split(/[\\/]/).pop();
        if (result.ok) {
            const parts = [`Imported ${result.imported.length} file(s)`];
            if (result.duplicates && result.duplicates.length) parts.push(`${result.duplicates.length} identical file(s) skipped`);
            if (result.skipped && result.skipped.length) parts.push(`${result.skipped.length} skipped because the name already exists`);
            return parts.join(', ') + '.';
        }
        if (result.cancelled) return `Import cancelled${result.rolledBack ? '; copied files were rolled back' : ''}.`;
        const collision = (result.errors || []).find(error => error.message === 'Destination already exists.');
        if (collision) return `Import cancelled: ${baseName(collision.destination || collision.path)} already exists. Nothing was imported.`;
        const reason = result.errors && result.errors[0] ? result.errors[0].message : 'Unknown import error';
        return `Import failed${result.rolledBack ? ' and was rolled back' : ''}: ${reason}`;
    },

    filesEqual(firstPath, secondPath) {
        const fs = DocsDoodads.FS.fs;
        if (!fs) return false;
        try {
            const firstStat = fs.statSync(firstPath);
            const secondStat = fs.statSync(secondPath);
            if (firstStat.size !== secondStat.size) return false;
            return fs.readFileSync(firstPath).equals(fs.readFileSync(secondPath));
        } catch (error) {
            return false;
        }
    },

    planBatch(sourcePaths, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const plan = {
            projectRoot: path ? path.resolve(options.projectRoot || '.') : '.',
            collisionPolicy: options.collisionPolicy || 'rename',
            operations: [], unsupported: [], duplicates: [], skipped: [], errors: []
        };
        if (!fs || !path) {
            plan.errors.push({ path: '', message: 'Filesystem access is unavailable.' });
            return plan;
        }

        const collected = this.collectFiles(sourcePaths);
        plan.errors.push(...collected.errors);
        const reserved = new Map();

        for (const source of collected.files) {
            if (!this.isSupported(source)) {
                plan.unsupported.push(source);
                continue;
            }

            const requestedDestination = options.destination && options.destination !== 'auto'
                ? options.destination
                : this.detectDestination(source);
            const relativeFolder = this.normalizeDestination(requestedDestination);
            if (!relativeFolder) {
                plan.errors.push({ path: source, message: `Unsupported destination: ${requestedDestination}` });
                continue;
            }

            let targetFolder = path.resolve(plan.projectRoot, relativeFolder);
            // img/doodads belongs to this plugin and is scanned recursively, so folders inside a dropped
            // folder are kept there; RPG Maker's own folders (characters, faces, audio...) stay flat.
            const droppedDir = collected.relativeDirs && collected.relativeDirs.get(source);
            if (droppedDir && relativeFolder === 'img/doodads') {
                const segments = droppedDir.split(/[\\/]+/)
                    .filter(segment => segment && segment !== '.' && segment !== '..')
                    .map(segment => segment.replace(/[<>:"|?*\x00-\x1f]/g, '_'));
                if (segments.length) targetFolder = path.join(targetFolder, ...segments);
            }
            const rootPrefix = plan.projectRoot.endsWith(path.sep) ? plan.projectRoot : plan.projectRoot + path.sep;
            if (targetFolder !== plan.projectRoot && !targetFolder.startsWith(rootPrefix)) {
                plan.errors.push({ path: source, message: 'Import destination escapes the project root.' });
                continue;
            }

            const fileName = path.basename(source);
            const ext = path.extname(fileName);
            const base = path.basename(fileName, ext);
            let destination = path.join(targetFolder, fileName);
            let overwrite = false;
            let suffix = 0;

            while (fs.existsSync(destination) || reserved.has(destination)) {
                const comparisonSource = reserved.has(destination) ? reserved.get(destination) : destination;
                if (this.filesEqual(source, comparisonSource)) {
                    plan.duplicates.push({ source, destination });
                    destination = null;
                    break;
                }

                const policy = typeof options.collisionPolicy === 'function'
                    ? options.collisionPolicy({ source, destination })
                    : plan.collisionPolicy;
                if (policy === 'skip') {
                    plan.skipped.push({ source, destination, reason: 'collision' });
                    destination = null;
                    break;
                }
                if (policy === 'overwrite') {
                    overwrite = true;
                    break;
                }
                if (policy === 'error') {
                    plan.errors.push({ path: source, destination, message: 'Destination already exists.' });
                    destination = null;
                    break;
                }
                suffix++;
                destination = path.join(targetFolder, `${base}_${suffix}${ext}`);
            }
            if (!destination) continue;

            reserved.set(destination, source);
            plan.operations.push({
                source,
                destination,
                relativeDestination: path.relative(plan.projectRoot, destination).replace(/\\/g, '/'),
                overwrite,
                kind: this.audioExtensions.has(path.extname(source).toLowerCase()) ? 'audio' : 'image'
            });
        }
        return plan;
    },

    executeBatch(plan) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const result = {
            ok: false,
            imported: [],
            overwritten: [],
            duplicates: (plan && plan.duplicates) ? plan.duplicates.slice() : [],
            skipped: (plan && plan.skipped) ? plan.skipped.slice() : [],
            unsupported: (plan && plan.unsupported) ? plan.unsupported.slice() : [],
            errors: (plan && plan.errors) ? plan.errors.slice() : [],
            rolledBack: false
        };
        if (!fs || !path || !plan || result.errors.length > 0) return result;
        const validationError = this.validateExecutionPlan(plan);
        if (validationError) {
            result.errors.push({ message: validationError });
            return result;
        }

        const completed = [];
        const tempFiles = [];
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try {
            for (let index = 0; index < plan.operations.length; index++) {
                const operation = plan.operations[index];
                DocsDoodads.FS.ensureDir(path.dirname(operation.destination));

                const existed = fs.existsSync(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.ddimport-${transactionId}.bak`;
                    fs.copyFileSync(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.ddimport-${transactionId}-${index}.tmp`;
                tempFiles.push(temporary);
                fs.copyFileSync(operation.source, temporary);
                if (existed) {
                    completed.push({ operation, existed, backup });
                    fs.copyFileSync(temporary, operation.destination);
                    fs.unlinkSync(temporary);
                } else {
                    fs.renameSync(temporary, operation.destination);
                    completed.push({ operation, existed, backup });
                }

                result.imported.push(operation.destination);
                if (existed) result.overwritten.push(operation.destination);
            }

            for (const record of completed) {
                if (record.backup && fs.existsSync(record.backup)) fs.unlinkSync(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.errors.push({ message: error && error.message ? error.message : String(error) });
            for (let index = completed.length - 1; index >= 0; index--) {
                const record = completed[index];
                try {
                    if (record.existed && record.backup && fs.existsSync(record.backup)) {
                        fs.copyFileSync(record.backup, record.operation.destination);
                    } else if (!record.existed && fs.existsSync(record.operation.destination)) {
                        fs.unlinkSync(record.operation.destination);
                    }
                } catch (rollbackError) {
                    result.errors.push({ path: record.operation.destination, message: `Rollback failed: ${rollbackError.message || rollbackError}` });
                }
            }
            for (const temporary of tempFiles) {
                try { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); } catch (cleanupError) {}
            }
            result.imported = [];
            result.overwritten = [];
            result.rolledBack = completed.length > 0;
            return result;
        }
    },

    async executeBatchAsync(plan, options = {}) {
        const fs = DocsDoodads.FS.fs;
        const path = DocsDoodads.FS.path;
        const fsp = fs && fs.promises;
        const result = {
            ok: false,
            imported: [],
            overwritten: [],
            duplicates: (plan && plan.duplicates) ? plan.duplicates.slice() : [],
            skipped: (plan && plan.skipped) ? plan.skipped.slice() : [],
            unsupported: (plan && plan.unsupported) ? plan.unsupported.slice() : [],
            errors: (plan && plan.errors) ? plan.errors.slice() : [],
            rolledBack: false,
            cancelled: false
        };
        if (!fs || !path || !fsp || !plan || result.errors.length > 0) return result;
        const validationError = this.validateExecutionPlan(plan);
        if (validationError) {
            result.errors.push({ message: validationError });
            return result;
        }

        const completed = [];
        const tempFiles = [];
        const cancellationToken = options.cancellationToken || null;
        const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const exists = async filePath => {
            try { await fsp.stat(filePath); return true; } catch (error) { return false; }
        };
        const removeIfPresent = async filePath => {
            try { await fsp.unlink(filePath); } catch (error) {
                if (!error || error.code !== 'ENOENT') throw error;
            }
        };

        try {
            for (let index = 0; index < plan.operations.length; index++) {
                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }

                const operation = plan.operations[index];
                await fsp.mkdir(path.dirname(operation.destination), { recursive: true });
                const existed = await exists(operation.destination);
                if (existed && !operation.overwrite) {
                    throw new Error(`Destination changed after import preview: ${operation.destination}`);
                }

                let backup = null;
                if (existed) {
                    backup = `${operation.destination}.ddimport-${transactionId}.bak`;
                    await fsp.copyFile(operation.destination, backup);
                    tempFiles.push(backup);
                }

                const temporary = `${operation.destination}.ddimport-${transactionId}-${index}.tmp`;
                tempFiles.push(temporary);
                await fsp.copyFile(operation.source, temporary);
                if (existed) {
                    completed.push({ operation, existed, backup });
                    await fsp.copyFile(temporary, operation.destination);
                    await removeIfPresent(temporary);
                } else {
                    await fsp.rename(temporary, operation.destination);
                    completed.push({ operation, existed, backup });
                }

                result.imported.push(operation.destination);
                if (existed) result.overwritten.push(operation.destination);
                if (typeof options.onProgress === 'function') {
                    options.onProgress({
                        completed: index + 1,
                        total: plan.operations.length,
                        source: operation.source,
                        destination: operation.destination
                    });
                }

                if (cancellationToken && cancellationToken.cancelled) {
                    const cancellation = new Error('Import cancelled.');
                    cancellation.code = 'DD_IMPORT_CANCELLED';
                    throw cancellation;
                }
            }

            for (const record of completed) {
                if (record.backup) await removeIfPresent(record.backup);
            }
            result.ok = true;
            return result;
        } catch (error) {
            result.cancelled = Boolean(error && error.code === 'DD_IMPORT_CANCELLED');
            result.errors.push({ message: error && error.message ? error.message : String(error) });
            for (let index = completed.length - 1; index >= 0; index--) {
                const record = completed[index];
                try {
                    if (record.existed && record.backup && await exists(record.backup)) {
                        await fsp.copyFile(record.backup, record.operation.destination);
                    } else if (!record.existed) {
                        await removeIfPresent(record.operation.destination);
                    }
                } catch (rollbackError) {
                    result.errors.push({ path: record.operation.destination, message: `Rollback failed: ${rollbackError.message || rollbackError}` });
                }
            }
            for (const temporary of tempFiles) {
                try { await removeIfPresent(temporary); } catch (cleanupError) {}
            }
            result.imported = [];
            result.overwritten = [];
            result.rolledBack = completed.length > 0;
            return result;
        }
    },

    importBatch(sourcePaths, options = {}) {
        return this.executeBatch(this.planBatch(sourcePaths, options));
    }
};


//==========================================================
// SECTION 25: DocsDoodads.WORKSPACE (GLASSMORPHIC WORKSPACE UI & TOOLS)
//==========================================================
DocsDoodads.Workspace = {
    mounted: false,
    // Editor-only previews of the time of day and the season (null = what the game says).
    previewMinutes: null,
    previewSeason: null,
    // Post-processing builder: which look is edited, hold-to-compare, and showing effects while editing.
    postFxTarget: 'world',
    postFxCompare: false,
    postFxPreview: true,
    container: null,
    drawerEl: null,
    inspectorEl: null,
    selectedAsset: null,
    selectedDoodad: null,
    selectedEvent: null,
    currentCategory: 'All',
    searchQuery: '',
    placementTool: null, // 'stamp', 'eyedropper', 'brush'
    brushSettings: { radius: 80, density: 3, scaleJitter: 0.15, rotateJitter: 25, minDistance: 32, flipChance: 0.5, hueJitter: 0, regions: '', terrainTags: '', avoidBlocked: false },
    activeDragPayload: null,
    ghostEl: null,
    isBrushActive: false,
    currentBrushBatch: [],
    gridSnapShow: false,
    _clipboardDoodads: [],
    selectedDoodads: [],

    toggle() {
        if (this.mounted) this.close(); else this.open();
    },

    // One placement tool at a time; keeps the toolbar highlight and brush popover in sync.
    setPlacementTool(tool) {
        this.placementTool = tool || null;
        const buttons = { eyedropper: 'dd-eyedropper-btn', stamp: 'dd-stamp-btn', brush: 'dd-brush-btn', path: 'dd-path-btn', biome: 'dd-biome-btn' };
        for (const [name, id] of Object.entries(buttons)) {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('dd-btn-active', this.placementTool === name);
        }
        const brushPopover = document.getElementById('dd-brush-popover');
        if (brushPopover) brushPopover.style.display = this.placementTool === 'brush' ? 'block' : 'none';
        const pathPopover = document.getElementById('dd-path-popover');
        if (pathPopover) pathPopover.style.display = this.placementTool === 'path' ? 'block' : 'none';
        const biomePopover = document.getElementById('dd-biome-popover');
        if (biomePopover) biomePopover.style.display = this.placementTool === 'biome' ? 'block' : 'none';
        if (this.placementTool === 'biome') this.refreshBiomeToolPicker();
        if (this.placementTool !== 'path') {
            this.pathPoints = [];
            this._pathHover = null;
        }
    },

    open() {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs() || this.mounted) return;
        DocsDoodads.Persistence.captureSession();
        DocsDoodads.AssetIndex.init();
        this.buildDom();
        this.attachCanvasListeners();
        this._onWindowResize = () => this.layoutPanels();
        window.addEventListener('resize', this._onWindowResize);
        this.mounted = true;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = true;
        }
        this.startAssetScan();
        DocsDoodads.LiveReload.start();
        this.showRecoveryNotices();

        // Check for recovery file
        const recovery = DocsDoodads.Persistence.recoverableSnapshot();
        if (recovery) {
            const dateStr = new Date(recovery.timestamp).toLocaleTimeString();
            DocsDoodads.Persistence.markRecoveryAnswered(recovery);
            if (confirm(`Unfinished session from ${dateStr} found. Would you like to recover it?`)) {
                this.applyRecovery(recovery);
                this.showToast(recovery.mapId && recovery.mapId !== this.currentMapId()
                    ? `Session recovered into map ${recovery.mapId}.` : "Session Recovered!");
            }
        }
    },

    close() {
        if (!this.mounted) return;
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        this.detachCanvasListeners();
        if (this._onWindowResize) window.removeEventListener('resize', this._onWindowResize);
        this.removeGhost();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        // Floating panels (Post FX, Asset Tools, World View...) are attached to the page, not the workspace.
        if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
            for (const panel of Array.from(document.querySelectorAll('body > .dd-glass'))) {
                if (panel.parentNode) panel.parentNode.removeChild(panel);
            }
        }
        this.postFxCompare = false;
        this.mounted = false;
        if (window.$gameSystem && window.$gameSystem.docsDoodads) {
            window.$gameSystem.docsDoodads.editing = false;
        }
        this.placementTool = null;
        DocsDoodads.LiveReload.stop();
        DocsDoodads.Audio.stopPreview();
    },

    // Puts a crash snapshot back on the map it was recorded on, never the map that happens to be open.
    applyRecovery(recovery) {
        if (!recovery || !window.$gameMap) return;
        const mapId = recovery.mapId || this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (Array.isArray(recovery.doodads)) {
            data[mapId] = recovery.doodads;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        if (recovery.mapSettings) data.mapSettings = recovery.mapSettings;
        if (recovery.world) {
            data.world = recovery.world;
            DocsDoodads.World.invalidate();
        }
        if (recovery.stagedMap) {
            if (mapId === this.currentMapId()) {
                $gameMap._stagedMapData = recovery.stagedMap;
                $gameMap._stagedMapDataId = mapId;
            } else {
                DocsDoodads.Persistence.stagedMaps[mapId] = recovery.stagedMap;
            }
            DocsDoodads.Persistence.dirtyMap = true;
        }
        this.refreshSpriteset();
    },

    async startAssetScan() {
        if (this._assetScanToken) this._assetScanToken.cancelled = true;
        const token = { cancelled: false };
        this._assetScanToken = token;
        const status = document.getElementById('dd-status-right');
        const result = await DocsDoodads.AssetIndex.scanAsync({
            loadCache: false,
            cancellationToken: token,
            onProgress: progress => {
                if (status && !token.cancelled) status.textContent = `Indexing assets ${progress.completed}/${progress.total}`;
            }
        });
        if (this._assetScanToken !== token || token.cancelled || result.cancelled) return result;
        this._assetScanToken = null;
        if (this.mounted) {
            this.refreshDrawerCards();
            this.updateIndexStatus(result.removed);
            if (result.errors.length > 0) this.showToast(`Asset scan completed with ${result.errors.length} warning(s).`);
        }
        return result;
    },

    buildDom() {
        const wrap = document.createElement('div');
        wrap.id = 'dd-asset-workspace-root';
        wrap.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none; z-index: 10000; font-family: 'Segoe UI', Roboto, sans-serif;
            user-select: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #dd-asset-workspace-root * { box-sizing: border-box; }
            .dd-glass {
                background: rgba(17, 24, 39, 0.92);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #e2e8f0;
                box-shadow: 0 12px 36px rgba(0,0,0,0.65);
                pointer-events: auto;
                /* Panels appended to the page (Asset Tools, Post FX) sit outside the workspace root. */
                font-family: 'Segoe UI', Roboto, sans-serif;
            }
            .dd-btn {
                background: #1f2937; color: #f1f5f9; border: 1px solid #374151;
                padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;
                transition: all 0.15s ease;
            }
            .dd-btn:hover { background: #374151; border-color: #60a5fa; }
            #dd-category-tabs .dd-btn { padding: 4px 8px; font-size: 11px; white-space: nowrap; }
            #dd-toolbar .dd-btn { padding: 5px 8px; white-space: nowrap; }
            #dd-toolbar > div { flex-wrap: wrap; row-gap: 6px; }
            .dd-btn-primary { background: #2563eb; border-color: #3b82f6; }
            .dd-btn-primary:hover { background: #1d4ed8; }
            .dd-btn-active { background: #059669 !important; border-color: #10b981 !important; color: #fff !important; }
            .dd-card {
                background: #18202f; border: 1px solid #283548; border-radius: 6px;
                cursor: pointer; position: relative; overflow: hidden; transition: transform 0.15s, border-color 0.15s;
            }
            .dd-card:hover { transform: translateY(-2px); border-color: #3b82f6; }
            .dd-card.selected { border: 2px solid #60a5fa; background: #1e293b; }
            .dd-badge {
                position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.75);
                padding: 2px 5px; border-radius: 3px; font-size: 10px; color: #93c5fd;
            }
        `;
        wrap.appendChild(style);

        // Top Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'dd-glass';
        toolbar.id = 'dd-toolbar';
        toolbar.style.cssText = `
            position: absolute; top: 10px; left: 10px; right: 10px; min-height: 50px; gap: 6px 10px;
            display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 6px 12px;
        `;
        toolbar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 14px; color: #60a5fa; letter-spacing: 0.5px;">DOC'S DOODADS</span>
                <input type="text" id="dd-search-input" placeholder="Search (e.g. tree tag:prop -dead)"
                    style="width: 200px; background: #0b1120; border: 1px solid #334155; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 12px;" />
                <select id="dd-layout-select" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 4px 8px; border-radius: 4px; font-size: 12px;"></select>
                <button class="dd-btn" id="dd-save-layout-btn" title="Save current panel sizes as custom layout">+ Layout</button>
                <button class="dd-btn" id="dd-del-layout-btn" title="Delete current custom layout" style="display: none; background: #7f1d1d; border-color: #991b1b; padding: 4px 8px;">✕</button>
                <button class="dd-btn" id="dd-undo-btn">Undo</button>
                <button class="dd-btn" id="dd-redo-btn">Redo</button>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <button class="dd-btn" id="dd-eyedropper-btn" title="Eyedropper: Alt+Click map object">Eyedropper</button>
                <button class="dd-btn" id="dd-stamp-btn" title="Stamp: Click repeatedly to place">Stamp</button>
                <button class="dd-btn" id="dd-brush-btn" title="Scatter Brush: Drag to scatter props">Scatter Brush</button>
                <div id="dd-brush-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BRUSH SETTINGS</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Radius:</span><span id="dd-brush-rad-val">80px</span>
                            </div>
                            <input type="range" id="dd-brush-rad" min="20" max="250" value="80" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Density:</span><span id="dd-brush-den-val">3</span>
                            </div>
                            <input type="range" id="dd-brush-den" min="1" max="10" value="3" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Scale Variation:</span><span id="dd-brush-scale-val">15%</span>
                            </div>
                            <input type="range" id="dd-brush-scale" min="0" max="50" value="15" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Rotation Variation:</span><span id="dd-brush-rot-val">25°</span>
                            </div>
                            <input type="range" id="dd-brush-rot" min="0" max="180" value="25" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Min Spacing:</span><span id="dd-brush-min-val">32px</span>
                            </div>
                            <input type="range" id="dd-brush-min" min="0" max="160" value="32" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Flip Chance:</span><span id="dd-brush-flip-val">50%</span>
                            </div>
                            <input type="range" id="dd-brush-flip" min="0" max="100" value="50" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;">
                                <span>Hue Variation:</span><span id="dd-brush-hue-val">0°</span>
                            </div>
                            <input type="range" id="dd-brush-hue" min="0" max="90" value="0" style="width: 100%;" />
                        </div>
                        <div style="color: #94a3b8;">Only on regions (e.g. 1, 2):
                            <input type="text" id="dd-brush-regions" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <div style="color: #94a3b8;">Only on terrain tags:
                            <input type="text" id="dd-brush-terrain" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-brush-avoid" /> Skip impassable tiles</label>
                    </div>
                </div>
                <button class="dd-btn" id="dd-biome-btn" title="Biome brush: paint a mix of props (set up biomes in the map panel)">Biome</button>
                <div id="dd-biome-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">BIOME BRUSH</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: #94a3b8;">
                        <select id="dd-biome-tool-pick" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;"></select>
                        <div>Radius: <span id="dd-biome-rad-val">96px</span><input type="range" id="dd-biome-rad" min="24" max="320" value="96" style="width: 100%;" /></div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-biome-avoid" checked /> Skip impassable tiles</label>
                        <div style="line-height: 1.4;">Drag on the map. Each biome's mix, spacing, edge thinning and patchiness are set in the map panel under Biomes.</div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-sym-btn" title="Symmetry: mirror placements">Symmetry</button>
                <div id="dd-sym-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 230px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 8px;">SYMMETRY</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px; color: #94a3b8;">
                        <select id="dd-sym-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;"></select>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                            <label>Axis X (tile)<input type="number" step="0.5" id="dd-sym-x" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" /></label>
                            <label>Axis Y (tile)<input type="number" step="0.5" id="dd-sym-y" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" /></label>
                        </div>
                        <button class="dd-btn" id="dd-sym-center">Centre of Map</button>
                        <div style="line-height: 1.4;">Stamps, the scatter brush and the biome brush place mirrored copies too.</div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-path-btn" title="Path: click points, double-click or Enter to place props along them">Path</button>
                <div id="dd-path-popover" class="dd-glass" style="display: none; position: absolute; top: calc(100% + 8px); right: 380px; width: 250px; padding: 12px; z-index: 10015;">
                    <div style="font-weight: bold; font-size: 11px; color: #38bdf8; margin-bottom: 6px;">PATH TOOL</div>
                    <div style="font-size: 10px; color: #94a3b8; margin-bottom: 8px; line-height: 1.4;">Click to add points. Double-click or Enter places the selected asset along them; Backspace removes the last point; Alt for off-grid points.</div>
                    <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Spacing:</span><span id="dd-path-spacing-val">48px</span></div>
                            <input type="range" id="dd-path-spacing" min="8" max="240" value="48" style="width: 100%;" />
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; color: #94a3b8;"><span>Random Offset:</span><span id="dd-path-jitter-val">0px</span></div>
                            <input type="range" id="dd-path-jitter" min="0" max="24" value="0" style="width: 100%;" />
                        </div>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-align" /> Turn pieces along the path</label>
                        <label style="color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="dd-path-smooth" /> Smooth curve</label>
                        <div style="color: #94a3b8;">End piece: <span id="dd-path-end-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-end-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-end-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="color: #94a3b8;">Corner piece: <span id="dd-path-corner-name" style="color: #e2e8f0;">same as path</span></div>
                        <div style="display: flex; gap: 4px;"><button class="dd-btn" id="dd-path-corner-btn" style="flex: 1; padding: 3px;">Use Selected</button><button class="dd-btn" id="dd-path-corner-clear" style="padding: 3px 6px;">Clear</button></div>
                        <div style="display: flex; gap: 4px; margin-top: 4px;"><button class="dd-btn dd-btn-primary" id="dd-path-place" style="flex: 1;">Place Path</button><button class="dd-btn" id="dd-path-clear">Clear Points</button></div>
                    </div>
                </div>
                <button class="dd-btn" id="dd-slicer-btn" title="Open Interactive Sprite Sheet Slicer">Slicer Modal</button>
                <button class="dd-btn" id="dd-stop-audio-btn" style="display: none; background: #be123c; border-color: #f43f5e;">⏹ Stop Audio</button>
                <button class="dd-btn" id="dd-tools-btn" title="Find duplicate and unused files">Asset Tools</button>
                <button class="dd-btn" id="dd-postfx-btn" title="Post-processing looks, screen effects and map image export">Post FX</button>
                <button class="dd-btn" id="dd-vfx-btn" title="Build particle and sprite-sheet effects">VFX</button>
                <button class="dd-btn" id="dd-history-btn" title="Compare with backups and restore single doodads or events">History</button>
                <button class="dd-btn" id="dd-diag-btn" title="Diagnostics">Diagnostics</button>
                <button class="dd-btn dd-btn-primary" id="dd-save-btn">Save Changes</button>
                <button class="dd-btn" id="dd-close-btn" style="background: #ef4444; border-color: #dc2626;">Close (F10)</button>
            </div>
        `;
        wrap.appendChild(toolbar);

        // Left Drawer (Virtualized Cards)
        const drawer = document.createElement('div');
        drawer.className = 'dd-glass';
        drawer.id = 'dd-drawer-panel';
        drawer.style.cssText = `
            position: absolute; top: 70px; left: 10px; bottom: 32px; width: 360px;
            display: flex; flex-direction: column; overflow: hidden;
        `;
        drawer.innerHTML = `
            <div id="dd-drawer-resizer" style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Drawer"></div>
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; flex-wrap: wrap; gap: 4px;" id="dd-category-tabs">
                <button class="dd-btn dd-btn-primary" data-cat="All">All</button>
                <button class="dd-btn" data-cat="Characters">Characters</button>
                <button class="dd-btn" data-cat="Doodads">Doodads</button>
                <button class="dd-btn" data-cat="Tilesets">Tiles</button>
                <button class="dd-btn" data-cat="Pictures">Pictures</button>
                <button class="dd-btn" data-cat="Faces">Faces</button>
                <button class="dd-btn" data-cat="Battlers">Battlers</button>
                <button class="dd-btn" data-cat="Backgrounds">Backgrounds</button>
                <button class="dd-btn" data-cat="System">System</button>
                <button class="dd-btn" data-cat="Audio">Audio</button>
                <button class="dd-btn" data-cat="Prefabs" title="Saved prefabs: groups of doodads and events">Prefabs</button>
                <button class="dd-btn" data-cat="Favorites" title="Show Favorited Assets">★ Favs</button>
                <button class="dd-btn" data-cat="Recent" title="Show Recently Used Assets">🕒 Recent</button>
            </div>
            <div style="padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <span style="font-size: 11px; color: #94a3b8;" id="dd-asset-count">Assets: 0</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; color: #94a3b8;">Zoom:</span>
                    <input type="range" id="dd-thumb-zoom" min="48" max="160" value="${defaultThumbnailSize}" style="width: 80px;" />
                </div>
            </div>
            <div id="dd-cards-container" style="flex: 1; overflow-y: auto; padding: 10px; position: relative;">
                <div id="dd-cards-sizer" style="width: 100%; position: relative;">
                    <div id="dd-cards-viewport" style="position: absolute; top: 0; left: 0; right: 0; display: grid; gap: 8px;">
                    </div>
                </div>
            </div>
        `;
        wrap.appendChild(drawer);

        // Right Inspector Panel
        const inspector = document.createElement('div');
        inspector.className = 'dd-glass';
        inspector.id = 'dd-inspector-panel';
        inspector.style.cssText = `
            position: absolute; top: 70px; right: 10px; bottom: 32px; width: 280px;
            padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;
        `;
        inspector.innerHTML = `
            <div id="dd-inspector-resizer" style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; cursor: ew-resize; z-index: 20; background: rgba(255,255,255,0.02);" title="Drag to resize Inspector"></div>
            <div style="font-weight: bold; font-size: 13px; color: #60a5fa; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
                INSPECTOR & PROPERTIES
            </div>
            <div id="dd-inspector-content" style="font-size: 12px; color: #94a3b8;">
                Select an asset in the drawer or click a placed doodad/event on the map.
            </div>
        `;
        wrap.appendChild(inspector);

        // Bottom Status Bar
        const statusBar = document.createElement('div');
        statusBar.className = 'dd-glass';
        statusBar.style.cssText = `
            position: absolute; bottom: 5px; left: 10px; right: 10px; height: 24px;
            display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #64748b;
        `;
        statusBar.innerHTML = `
            <span id="dd-status-left">Doc's Doodads v${pluginVersion} Ready | Hold Alt for free placement</span>
            <span id="dd-status-right">Map ID: ${$gameMap ? $gameMap.mapId() : 0} | Autosave Active</span>
        `;
        wrap.appendChild(statusBar);

        document.body.appendChild(wrap);
        this.container = wrap;
        this.drawerEl = drawer;
        this.inspectorEl = inspector;

        this.bindEvents();
        this.layoutPanels();
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    // The toolbar wraps onto more rows in narrow windows; the side panels start just below it.
    layoutPanels() {
        const toolbar = document.getElementById('dd-toolbar');
        if (!toolbar) return;
        const top = (toolbar.offsetTop || 10) + (toolbar.offsetHeight || 50) + 10;
        for (const id of ['dd-drawer-panel', 'dd-inspector-panel']) {
            const panel = document.getElementById(id);
            if (panel) panel.style.top = top + 'px';
        }
    },

    refreshLayoutSelector() {
        const layoutSel = document.getElementById('dd-layout-select');
        if (!layoutSel) return;
        const names = DocsDoodads.Layout.getAllNames();
        layoutSel.innerHTML = '';
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `Layout: ${name}`;
            if (name === DocsDoodads.Layout.current) opt.selected = true;
            layoutSel.appendChild(opt);
        }
        const delBtn = document.getElementById('dd-del-layout-btn');
        if (delBtn) {
            const isCustom = !DocsDoodads.Layout.presets[DocsDoodads.Layout.current];
            delBtn.style.display = isCustom ? 'inline-block' : 'none';
        }
    },

    bindEvents() {
        document.getElementById('dd-close-btn').onclick = () => this.close();
        document.getElementById('dd-save-btn').onclick = () => DocsDoodads.Persistence.saveAll();
        document.getElementById('dd-undo-btn').onclick = () => DocsDoodads.Undo.undo();
        document.getElementById('dd-redo-btn').onclick = () => DocsDoodads.Undo.redo();

        this.refreshLayoutSelector();
        const layoutSel = document.getElementById('dd-layout-select');
        if (layoutSel) {
            layoutSel.onchange = (e) => {
                DocsDoodads.Layout.apply(e.target.value);
            };
        }

        const saveLayoutBtn = document.getElementById('dd-save-layout-btn');
        if (saveLayoutBtn) {
            saveLayoutBtn.onclick = () => {
                const name = prompt("Enter a name for this custom layout:", "Custom Layout " + (Object.keys(DocsDoodads.Layout.custom).length + 1));
                if (name && name.trim()) {
                    DocsDoodads.Layout.saveCurrentAs(name.trim());
                    this.refreshLayoutSelector();
                    this.showToast(`Saved layout "${name.trim()}"!`);
                }
            };
        }

        const delLayoutBtn = document.getElementById('dd-del-layout-btn');
        if (delLayoutBtn) {
            delLayoutBtn.onclick = () => {
                const cur = DocsDoodads.Layout.current;
                if (confirm(`Delete custom layout "${cur}"?`)) {
                    DocsDoodads.Layout.deleteCustomLayout(cur);
                    this.refreshLayoutSelector();
                    this.showToast(`Deleted layout "${cur}".`);
                }
            };
        }

        // Draggable Drawer Resizer
        const drawerResizer = document.getElementById('dd-drawer-resizer');
        if (drawerResizer && this.drawerEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            drawerResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.drawerEl.style.width, 10) || 360;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(800, startWidth + (ev.clientX - startX)));
                    this.drawerEl.style.width = newW + 'px';
                    this.updateVirtualGrid(true);
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        // Draggable Inspector Resizer
        const inspectorResizer = document.getElementById('dd-inspector-resizer');
        if (inspectorResizer && this.inspectorEl) {
            let isResizing = false;
            let startX = 0;
            let startWidth = 0;
            inspectorResizer.onmousedown = (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startWidth = parseInt(this.inspectorEl.style.width, 10) || 280;
                const onMouseMove = (ev) => {
                    if (!isResizing) return;
                    const newW = Math.max(200, Math.min(600, startWidth - (ev.clientX - startX)));
                    this.inspectorEl.style.width = newW + 'px';
                };
                const onMouseUp = () => {
                    isResizing = false;
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
        }

        const searchInput = document.getElementById('dd-search-input');
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.refreshDrawerCards();
        };

        const container = document.getElementById('dd-cards-container');
        if (container) {
            container.onscroll = () => this.updateVirtualGrid();
        }

        const zoomSlider = document.getElementById('dd-thumb-zoom');
        zoomSlider.oninput = (e) => {
            this.thumbSize = Number(e.target.value);
            this.updateVirtualGrid(true);
        };

        const catTabs = document.getElementById('dd-category-tabs');
        catTabs.onclick = (e) => {
            if (e.target.dataset.cat) {
                catTabs.querySelectorAll('button').forEach(b => b.className = 'dd-btn');
                e.target.className = 'dd-btn dd-btn-primary';
                this.currentCategory = e.target.dataset.cat;
                this.refreshDrawerCards();
            }
        };

        document.getElementById('dd-slicer-btn').onclick = () => {
            if (this.selectedAsset) DocsDoodads.Slicing.Editor.open(this.selectedAsset);
            else alert("Please select a sprite sheet in the drawer first!");
        };

        document.getElementById('dd-diag-btn').onclick = () => this.openDiagnosticsModal();
        document.getElementById('dd-tools-btn').onclick = () => this.showAssetTools();
        document.getElementById('dd-postfx-btn').onclick = () => this.showPostFxBuilder();
        document.getElementById('dd-vfx-btn').onclick = () => this.showVfxBuilder();
        document.getElementById('dd-history-btn').onclick = () => this.showHistoryPanel();
        this.bindToolbarExtras();

        document.getElementById('dd-stop-audio-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            document.getElementById('dd-stop-audio-btn').style.display = 'none';
        };

        document.getElementById('dd-eyedropper-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'eyedropper' ? null : 'eyedropper');
            this.showToast(this.placementTool ? "Eyedropper Active: Click any object on map" : "Eyedropper Deactivated");
        };
        document.getElementById('dd-stamp-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'stamp' ? null : 'stamp');
            this.showToast(this.placementTool ? "Stamp Active: Click map to place repeatedly" : "Stamp Deactivated");
        };
        document.getElementById('dd-brush-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'brush' ? null : 'brush');
            this.showToast(this.placementTool ? "Scatter Brush Active: Drag map to scatter" : "Brush Deactivated");
        };

        const setupBrushSlider = (id, prop, valId, suffix, mult = 1) => {
            const el = document.getElementById(id);
            const valEl = document.getElementById(valId);
            if (el && valEl) {
                el.oninput = (ev) => {
                    const num = parseFloat(ev.target.value);
                    this.brushSettings[prop] = mult !== 1 ? num * mult : num;
                    valEl.textContent = num + suffix;
                };
            }
        };
        setupBrushSlider('dd-brush-rad', 'radius', 'dd-brush-rad-val', 'px');
        setupBrushSlider('dd-brush-den', 'density', 'dd-brush-den-val', '');
        setupBrushSlider('dd-brush-scale', 'scaleJitter', 'dd-brush-scale-val', '%', 0.01);
        setupBrushSlider('dd-brush-rot', 'rotateJitter', 'dd-brush-rot-val', '°');
        setupBrushSlider('dd-brush-min', 'minDistance', 'dd-brush-min-val', 'px');
        setupBrushSlider('dd-brush-flip', 'flipChance', 'dd-brush-flip-val', '%', 0.01);
        setupBrushSlider('dd-brush-hue', 'hueJitter', 'dd-brush-hue-val', '°');
        document.getElementById('dd-brush-regions').oninput = (ev) => { this.brushSettings.regions = ev.target.value; };
        document.getElementById('dd-brush-terrain').oninput = (ev) => { this.brushSettings.terrainTags = ev.target.value; };
        document.getElementById('dd-brush-avoid').onchange = (ev) => { this.brushSettings.avoidBlocked = Boolean(ev.target.checked); };

        document.getElementById('dd-path-btn').onclick = () => {
            this.setPlacementTool(this.placementTool === 'path' ? null : 'path');
            this.showToast(this.placementTool ? "Path Active: click points on the map" : "Path Deactivated");
        };
        const pathSlider = (id, prop) => {
            const input = document.getElementById(id);
            input.oninput = (ev) => {
                this.pathSettings[prop] = parseFloat(ev.target.value) || 0;
                document.getElementById(id + '-val').textContent = ev.target.value + 'px';
            };
        };
        pathSlider('dd-path-spacing', 'spacing');
        pathSlider('dd-path-jitter', 'jitter');
        document.getElementById('dd-path-align').onchange = (ev) => { this.pathSettings.alignToPath = Boolean(ev.target.checked); };
        document.getElementById('dd-path-smooth').onchange = (ev) => { this.pathSettings.smooth = Boolean(ev.target.checked); };
        const pieceButtons = (kind, prop) => {
            const label = document.getElementById(`dd-path-${kind}-name`);
            document.getElementById(`dd-path-${kind}-btn`).onclick = () => {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('Select an image asset in the drawer first.');
                    return;
                }
                this.pathSettings[prop] = this.selectedAsset;
                label.textContent = this.selectedAsset.fileName;
            };
            document.getElementById(`dd-path-${kind}-clear`).onclick = () => {
                this.pathSettings[prop] = null;
                label.textContent = 'same as path';
            };
        };
        pieceButtons('end', 'endAsset');
        pieceButtons('corner', 'cornerAsset');
        document.getElementById('dd-path-place').onclick = () => this.finishPath();
        document.getElementById('dd-path-clear').onclick = () => { this.pathPoints = []; };
    },

    refreshDrawerCards() {
        let filtered = DocsDoodads.AssetIndex.list;
        if (/(^|\s)used:/i.test(this.searchQuery || '') && !DocsDoodads.Usage.lastIndex) this.refreshUsageIndex();
        if (this.currentCategory === 'Similar') {
            filtered = this.similarResults || [];
        } else if (this.currentCategory === 'Prefabs') {
            filtered = this.prefabAssets();
        } else if (this.currentCategory === 'Favorites') {
            filtered = filtered.filter(a => a.favorite);
        } else if (this.currentCategory === 'Recent') {
            filtered = filtered.filter(a => a.usage && a.usage.lastUsedAt > 0)
                               .sort((a, b) => (b.usage.lastUsedAt || 0) - (a.usage.lastUsedAt || 0));
        } else if (this.currentCategory !== 'All') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        filtered = DocsDoodads.Search.filter(filtered, this.searchQuery);
        this.filteredAssets = filtered;

        const countEl = document.getElementById('dd-asset-count');
        if (countEl) countEl.textContent = this.currentCategory === 'Similar' && this.similarSource
            ? `Most like ${this.similarSource}: ${filtered.length}` : `Assets: ${filtered.length}`;

        const container = document.getElementById('dd-cards-container');
        if (container) container.scrollTop = 0;

        this.updateVirtualGrid(true);
    },

    updateVirtualGrid(forceRecalculate = false) {
        const container = document.getElementById('dd-cards-container');
        const sizer = document.getElementById('dd-cards-sizer');
        const viewport = document.getElementById('dd-cards-viewport');
        if (!container || !sizer || !viewport) return;

        const assets = this.filteredAssets || [];
        const totalCount = assets.length;
        if (totalCount === 0) {
            sizer.style.height = '0px';
            viewport.innerHTML = '<div style="color: #64748b; font-size: 12px; padding: 16px; text-align: center;">No matching assets found.</div>';
            return;
        }

        const size = this.thumbSize || defaultThumbnailSize;
        const gap = 8;
        const containerW = Math.max(120, container.clientWidth - 20);
        const cols = Math.max(1, Math.floor((containerW + gap) / (size + gap)));
        const colWidth = Math.floor((containerW - (cols - 1) * gap) / cols);
        const cardHeight = colWidth + 24;
        const rowHeight = cardHeight + gap;
        const totalRows = Math.ceil(totalCount / cols);
        const totalHeight = totalRows * rowHeight;

        sizer.style.height = totalHeight + 'px';
        viewport.style.gridTemplateColumns = `repeat(${cols}, ${colWidth}px)`;

        const scrollTop = container.scrollTop;
        const viewportH = container.clientHeight || 400;

        const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
        const endRow = Math.min(totalRows - 1, Math.ceil((scrollTop + viewportH) / rowHeight) + 2);

        const startIndex = startRow * cols;
        const endIndex = Math.min(totalCount, (endRow + 1) * cols);

        viewport.style.transform = `translateY(${startRow * rowHeight}px)`;
        viewport.innerHTML = '';

        for (let i = startIndex; i < endIndex; i++) {
            const asset = assets[i];
            const card = this.createCardElement(asset, cardHeight);
            viewport.appendChild(card);
        }
    },

    createCardElement(asset, cardHeight) {
        const card = document.createElement('div');
        card.className = 'dd-card' + (this.selectedAsset === asset ? ' selected' : '');
        card.style.cssText = `height: ${cardHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px;`;

        const imgEl = document.createElement('img');
        imgEl.style.cssText = 'max-width: 85%; max-height: 70%; object-fit: contain; image-rendering: pixelated;';
        DocsDoodads.Thumbnail.get(asset, this.thumbSize || 96, (dataUrl) => {
            imgEl.src = dataUrl;
        });
        card.appendChild(imgEl);
        this.attachThumbAnimation(card, imgEl, asset);

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 10px; color: #e2e8f0; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 3px;';
        title.textContent = asset.fileName;
        card.appendChild(title);

        if (asset.favorite) {
            const favBadge = document.createElement('span');
            favBadge.className = 'dd-badge';
            favBadge.textContent = '★';
            favBadge.style.color = '#fbbf24';
            card.appendChild(favBadge);
        }

        card.onclick = () => {
            this.selectAsset(asset);
            const container = document.getElementById('dd-cards-container');
            if (container) container.querySelectorAll('.dd-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (asset.category === 'Audio') {
                DocsDoodads.Audio.playPreview(asset);
                const stopBtn = document.getElementById('dd-stop-audio-btn');
                if (stopBtn) stopBtn.style.display = 'block';
            }
        };

        card.ondblclick = () => {
            if (asset.category !== 'Audio' && asset.type !== 'prefab') {
                DocsDoodads.Slicing.Editor.open(asset);
            }
        };

        card.oncontextmenu = (e) => {
            e.preventDefault();
            this.selectAsset(asset);
            if (asset.type === 'prefab') {
                this.showContextMenu(e.clientX, e.clientY, this.prefabMenuItems(asset));
                return;
            }
            const items = [
                { label: 'Place as Doodad', icon: '📌', onClick: () => this.placeAssetOnMapCenter(asset) },
                {
                    label: 'Place as Real MZ Event...', icon: '⚡', onClick: () => {
                        const templateKey = prompt("Enter Template Key (e.g. npc, door, chest, signpost, switch, save_point):", "npc") || "npc";
                        const prev = document.getElementById('dd-event-template');
                        if (prev) prev.value = templateKey;
                        this.commitPlacement(asset, this.clientToMapCoords(e.clientX, e.clientY), 'event');
                    }
                },
                { separator: true },
                {
                    label: asset.favorite ? 'Remove from Favorites' : 'Add to Favorites',
                    icon: '★',
                    onClick: () => {
                        DocsDoodads.AssetIndex.toggleFavorite(asset.id);
                        this.refreshInspector();
                        this.refreshDrawerCards();
                    }
                },
                {
                    label: 'Add to Collection...',
                    icon: '📁',
                    onClick: () => {
                        const colName = prompt("Enter Collection Name (e.g. Castle Set, Forest Props):", "Custom Collection");
                        if (colName && colName.trim()) {
                            DocsDoodads.AssetIndex.addAssetToCollection(asset.id, colName.trim());
                            this.showToast(`Added ${asset.fileName} to "${colName.trim()}"!`);
                        }
                    }
                },
                { separator: true }
            ];
            if (asset.category !== 'Audio') {
                items.push({ label: 'Open in Slicing Modal', icon: '✂️', onClick: () => DocsDoodads.Slicing.Editor.open(asset) });
                items.push({ label: 'Export Slices to PNGs', icon: '💾', onClick: () => DocsDoodads.Export.exportSlices(asset) });
            } else {
                items.push({ label: 'Play Audio Preview', icon: '▶️', onClick: () => DocsDoodads.Audio.playPreview(asset) });
                items.push({ label: 'Stop Audio', icon: '⏹', onClick: () => DocsDoodads.Audio.stopPreview() });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        card.draggable = true;
        card.ondragstart = (e) => {
            if (asset.type === 'prefab') {
                this.activeDragPayload = { type: 'prefab', prefabId: asset.prefabId, path: asset.path, fileName: asset.fileName, category: 'Prefabs' };
                e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
                return;
            }
            this.activeDragPayload = {
                assetId: asset.id,
                path: asset.path,
                fileName: asset.fileName,
                category: asset.category,
                type: asset.type,
                frameW: asset.width || 48,
                frameH: asset.height || 48,
                collision: asset.collision || { preset: "none" },
                characterIndex: asset.placement.characterIndex || 0,
                depth: asset.placement.depth,
                tags: asset.tags || [],
                autoTags: asset.autoTags || [],
                placementMode: asset.placement.defaultMode || (asset.type === 'character_sheet' ? 'event' : 'ask')
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(this.activeDragPayload));
        };

        card.ondragend = () => {
            this.removeGhost();
        };

        return card;
    },

    selectedDoodads: [],

    selectEvent(evInfo) {
        this.selectedEvent = evInfo;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedAsset = null;
        this.refreshInspector();
    },

    selectAsset(asset) {
        this.selectedAsset = asset;
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodad(doodad, isMulti) {
        if (!doodad) {
            this.selectedDoodad = null;
            this.selectedDoodads = [];
            this.refreshInspector();
            return;
        }

        // If doodad is part of a group and not multi-selecting, select all members in the group
        if (!isMulti && doodad.groupId) {
            const groupMembers = (DocsDoodads.doodads() || []).filter(d => d.groupId === doodad.groupId);
            if (groupMembers.length > 1) {
                this.selectedDoodads = groupMembers;
                this.selectedDoodad = doodad;
                this.selectedAsset = null;
                this.selectedEvent = null;
                this.refreshInspector();
                return;
            }
        }

        if (isMulti) {
            this.selectedDoodads = this.selectedDoodads || [];
            const idx = this.selectedDoodads.indexOf(doodad);
            if (idx >= 0) {
                this.selectedDoodads.splice(idx, 1);
            } else {
                this.selectedDoodads.push(doodad);
            }
            this.selectedDoodad = this.selectedDoodads[this.selectedDoodads.length - 1] || null;
        } else {
            this.selectedDoodads = [doodad];
            this.selectedDoodad = doodad;
        }
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    selectDoodads(doodads) {
        this.selectedDoodads = doodads || [];
        this.selectedDoodad = this.selectedDoodads[0] || null;
        this.selectedAsset = null;
        this.selectedEvent = null;
        this.refreshInspector();
    },

    refreshInspector() {
        const content = document.getElementById('dd-inspector-content');
        if (!content) return;

        // Case 0: MZ Map Event Selected
        if (this.selectedEvent) {
            const ev = this.selectedEvent.stagedEvent || (this.selectedEvent.gameEvent && this.selectedEvent.gameEvent.event());
            const ge = this.selectedEvent.gameEvent;
            const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
            const page0 = ev && ev.pages && ev.pages[0] ? ev.pages[0] : {};
            const triggerNames = ["Action Button", "Player Touch", "Event Touch", "Autorun", "Parallel"];
            const priorityNames = ["Below Characters", "Same as Characters", "Above Characters"];

            content.innerHTML = `
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MAP EVENT: ${escapeHtml(ev ? ev.name : ('EV' + evId))} (ID: ${evId})</div>
                <div style="font-size: 11px; margin-bottom: 4px;">Tile Coordinates: <span style="color: #fff;">[${ge ? ge.x : (ev ? ev.x : 0)}, ${ge ? ge.y : (ev ? ev.y : 0)}]</span></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile X:</label>
                        <input type="number" id="dd-ev-x" value="${ge ? ge.x : (ev ? ev.x : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Tile Y:</label>
                        <input type="number" id="dd-ev-y" value="${ge ? ge.y : (ev ? ev.y : 0)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Trigger:</label>
                    <select id="dd-ev-trigger" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${triggerNames.map((t, idx) => `<option value="${idx}" ${(page0.trigger === idx) ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Priority:</label>
                    <select id="dd-ev-priority" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; font-size: 11px;">
                        ${priorityNames.map((p, idx) => `<option value="${idx}" ${(page0.priorityType === idx) ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                </div>
                <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                    <button class="dd-btn dd-btn-primary" id="dd-ev-save-template-btn">💾 Save as Event Template</button>
                    <button class="dd-btn" id="dd-ev-dup-btn">Duplicate Event</button>
                    <button class="dd-btn" id="dd-ev-del-btn" style="background: #991b1b;">Delete Event</button>
                </div>
            `;

            document.getElementById('dd-ev-save-template-btn').onclick = () => {
                const name = prompt("Enter a name for this new Event Template:", ev.name || ("Template_" + evId));
                if (name && name.trim()) {
                    const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                    DocsDoodads.EventTemplates.saveCustomTemplate(name.trim(), ev, cat.trim());
                    this.showToast(`Saved template "${name.trim()}"!`);
                }
            };
            document.getElementById('dd-ev-del-btn').onclick = () => {
                this.deleteSelectedEvent();
            };
            document.getElementById('dd-ev-dup-btn').onclick = () => {
                this.duplicateSelectedEvent();
            };
            return;
        }

        // Case 1A: Multi-Selection (Multiple Doodads Selected)
        if (this.selectedDoodads && this.selectedDoodads.length > 1) {
            const items = this.selectedDoodads;
            const lockedCount = items.filter(d => d.locked).length;
            const hiddenCount = items.filter(d => d.editorHidden).length;
            const hasGroup = items.some(d => d.groupId);

            content.innerHTML = `
                <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MULTI-SELECTION (${items.length} DOODADS)</div>
                <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
                    ${lockedCount > 0 ? `🔒 ${lockedCount} locked | ` : ''}
                    ${hiddenCount > 0 ? `👁 ${hiddenCount} hidden | ` : ''}
                    ${hasGroup ? `📦 Grouped` : ''}
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">ALIGN</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-align-left" title="Align Left">Left</button>
                        <button class="dd-btn" id="dd-align-center-x" title="Align Center X">Center X</button>
                        <button class="dd-btn" id="dd-align-right" title="Align Right">Right</button>
                        <button class="dd-btn" id="dd-align-top" title="Align Top">Top</button>
                        <button class="dd-btn" id="dd-align-center-y" title="Align Center Y">Center Y</button>
                        <button class="dd-btn" id="dd-align-bottom" title="Align Bottom">Bottom</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">DISTRIBUTE</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-dist-h" title="Distribute Horizontally">Horizontal</button>
                        <button class="dd-btn" id="dd-dist-v" title="Distribute Vertically">Vertical</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-multi-z-fwd" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-back" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-multi-z-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-multi-z-bottom" title="Send to Back">To Back</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 6px;">ORGANIZATION</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                        <button class="dd-btn" id="dd-grp-btn">${hasGroup ? 'Ungroup' : 'Group'}</button>
                        <button class="dd-btn" id="dd-lock-btn">${lockedCount === items.length ? 'Unlock All' : 'Lock All'}</button>
                        <button class="dd-btn" id="dd-hide-btn">${hiddenCount === items.length ? 'Show All' : 'Hide All'}</button>
                        <button class="dd-btn" id="dd-dup-all-btn">Duplicate</button>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-bottom: 8px;">
                    <button class="dd-btn" id="dd-multi-trace-col" style="width: 100%;" title="Fit each doodad's collision to the solid base of its image">Trace Collision from Art</button>
                </div>
                ${this.renderSelectionTools(items)}
                ${this.renderEffectSections(items)}
                <div style="margin-top: 12px;">
                    <button class="dd-btn" id="dd-del-all-btn" style="width: 100%; background: #991b1b;">Delete Selection (${items.length})</button>
                </div>
            `;

            document.getElementById('dd-align-left').onclick = () => this.alignSelected('left');
            document.getElementById('dd-align-center-x').onclick = () => this.alignSelected('centerX');
            document.getElementById('dd-align-right').onclick = () => this.alignSelected('right');
            document.getElementById('dd-align-top').onclick = () => this.alignSelected('top');
            document.getElementById('dd-align-center-y').onclick = () => this.alignSelected('centerY');
            document.getElementById('dd-align-bottom').onclick = () => this.alignSelected('bottom');

            document.getElementById('dd-dist-h').onclick = () => this.distributeSelected('horizontal');
            document.getElementById('dd-dist-v').onclick = () => this.distributeSelected('vertical');

            document.getElementById('dd-multi-z-fwd').onclick = () => this.bringForward();
            document.getElementById('dd-multi-z-back').onclick = () => this.sendBackward();
            document.getElementById('dd-multi-z-front').onclick = () => this.bringToFront();
            document.getElementById('dd-multi-z-bottom').onclick = () => this.sendToBack();

            document.getElementById('dd-grp-btn').onclick = () => {
                if (hasGroup) this.ungroupSelected();
                else this.groupSelected();
            };
            document.getElementById('dd-lock-btn').onclick = () => {
                this.lockSelected(lockedCount !== items.length);
            };
            document.getElementById('dd-hide-btn').onclick = () => {
                this.hideSelected(hiddenCount !== items.length);
            };
            document.getElementById('dd-dup-all-btn').onclick = () => this.duplicateSelectedDoodad();
            document.getElementById('dd-multi-trace-col').onclick = () => this.traceCollision(items);
            this.bindEffectSections(items);
            this.bindSelectionTools(items);
            document.getElementById('dd-del-all-btn').onclick = () => this.deleteSelectedDoodad();
            return;
        }

        // Case 1B: Placed Doodad Selected (Single Doodad)
        if (this.selectedDoodad) {
            const d = this.selectedDoodad;
            const isLocked = !!d.locked;
            const isHidden = !!d.editorHidden;
            const isCustomCol = d.collision && d.collision.preset === 'custom';
            const shape = (d.collision && d.collision.shape) || { x: 0.2, y: 0.2, w: 0.6, h: 0.6 };

            content.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <div style="font-weight: bold; color: #38bdf8;">DOODAD PROPERTIES</div>
                    <div style="display: flex; gap: 4px;">
                        <button class="dd-btn" id="dd-doodad-lock-toggle" style="padding: 2px 6px; font-size: 11px;">${isLocked ? '🔒 Locked' : '🔓 Lock'}</button>
                        <button class="dd-btn" id="dd-doodad-hide-toggle" style="padding: 2px 6px; font-size: 11px;">${isHidden ? '👁 Hidden' : '👁 Hide'}</button>
                    </div>
                </div>
                <div style="font-size: 11px; margin-bottom: 4px;">Image: <span style="color: #fff;">${escapeHtml(d.bit ? d.bit[1] : 'Unknown')}</span></div>
                ${d.groupId ? `<div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px;">Group: ${escapeHtml(d.groupId)} <button class="dd-btn" id="dd-ungrp-single" style="padding: 1px 4px; font-size: 9px;">Ungroup</button></div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0;">
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">X:</label>
                        <input type="number" id="dd-prop-x" value="${d.x}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Y:</label>
                        <input type="number" id="dd-prop-y" value="${d.y}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Z-Order:</label>
                        <input type="number" id="dd-prop-z" value="${d.z || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Rotation (°):</label>
                        <input type="number" id="dd-prop-rot" value="${d.rotation || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale X:</label>
                        <input type="number" step="0.1" id="dd-prop-sx" value="${d.scaleX || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                    <div>
                        <label style="font-size: 10px; color: #94a3b8;">Scale Y:</label>
                        <input type="number" step="0.1" id="dd-prop-sy" value="${d.scaleY || 1}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" />
                    </div>
                </div>
                <div style="margin-top: 6px;">
                    <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                    <select id="dd-prop-col" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                        <option value="none">None (Passable)</option>
                        <option value="full">Full Bounds</option>
                        <option value="bottomHalf">Bottom Half</option>
                        <option value="bottomThird">Bottom Third</option>
                        <option value="trunk">Tree Trunk</option>
                        <option value="thinWall">Thin Wall</option>
                        <option value="wideWall">Wide Wall</option>
                        <option value="custom">Custom Rectangle</option>
                    </select>
                    <button class="dd-btn" id="dd-prop-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
                </div>

                <!-- Custom Collision Box Visual Editor -->
                <div id="dd-custom-col-editor" style="display: ${isCustomCol ? 'block' : 'none'}; margin-top: 8px; background: rgba(0,0,0,0.3); border: 1px solid #334155; padding: 8px; border-radius: 4px;">
                    <div style="font-size: 10px; color: #38bdf8; margin-bottom: 4px; font-weight: bold;">CUSTOM COLLISION BOX</div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <canvas id="dd-col-preview" width="64" height="64" style="background: #0b1120; border: 1px solid #475569; border-radius: 3px; flex-shrink: 0;"></canvas>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; flex: 1;">
                            <div>
                                <label style="color: #94a3b8;">Rel X:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-x" value="${shape.x.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel Y:</label>
                                <input type="number" step="0.05" min="0" max="1" id="dd-col-y" value="${shape.y.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel W:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-w" value="${shape.w.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                            <div>
                                <label style="color: #94a3b8;">Rel H:</label>
                                <input type="number" step="0.05" min="0.05" max="1" id="dd-col-h" value="${shape.h.toFixed(2)}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155;" />
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                    <div style="font-size: 11px; font-weight: bold; color: #94a3b8; margin-bottom: 4px;">LAYERING (Z-ORDER)</div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                        <button class="dd-btn" id="dd-prop-forward" title="Bring Forward (+1 Z)">+1 Z</button>
                        <button class="dd-btn" id="dd-prop-backward" title="Send Backward (-1 Z)">-1 Z</button>
                        <button class="dd-btn" id="dd-prop-to-front" title="Bring to Front">To Front</button>
                        <button class="dd-btn" id="dd-prop-to-back" title="Send to Back">To Back</button>
                    </div>
                </div>
                ${this.renderSelectionTools([d])}
                ${this.renderEffectSections([d])}
                <div style="display: flex; gap: 6px; margin-top: 8px;">
                    <button class="dd-btn" id="dd-prop-dup" style="flex: 1;">Duplicate (Ctrl+D)</button>
                    <button class="dd-btn" id="dd-prop-del" style="flex: 1; background: #991b1b;">Delete</button>
                </div>
            `;

            const renderColPreview = () => {
                const cvs = document.getElementById('dd-col-preview');
                if (!cvs || typeof cvs.getContext !== 'function') return;
                const ctx = cvs.getContext('2d');
                ctx.clearRect(0, 0, 64, 64);
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(4, 4, 56, 56);
                ctx.strokeStyle = '#64748b';
                ctx.strokeRect(4, 4, 56, 56);
                const s = d.collision && d.collision.shape ? d.collision.shape : shape;
                ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
                ctx.fillRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
                ctx.strokeStyle = '#22c55e';
                ctx.strokeRect(4 + s.x * 56, 4 + s.y * 56, s.w * 56, s.h * 56);
            };

            document.getElementById('dd-prop-col').value = (d.collision && d.collision.preset) ? d.collision.preset : "none";
            document.getElementById('dd-prop-col').onchange = (e) => {
                const val = e.target.value;
                const colEditor = document.getElementById('dd-custom-col-editor');
                if (val === 'custom') {
                    d.collision = { preset: 'custom', shape: shape };
                    if (colEditor) colEditor.style.display = 'block';
                    renderColPreview();
                } else {
                    d.collision = { preset: val, shape: null };
                    if (colEditor) colEditor.style.display = 'none';
                }
            };

            if (isCustomCol) renderColPreview();

            const updateCustomCol = () => {
                const cx = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-x').value) || 0));
                const cy = Math.max(0, Math.min(1, parseFloat(document.getElementById('dd-col-y').value) || 0));
                const cw = Math.max(0.05, Math.min(1 - cx, parseFloat(document.getElementById('dd-col-w').value) || 0.5));
                const ch = Math.max(0.05, Math.min(1 - cy, parseFloat(document.getElementById('dd-col-h').value) || 0.5));
                d.collision = { preset: 'custom', shape: { x: cx, y: cy, w: cw, h: ch } };
                renderColPreview();
            };
            ['dd-col-x', 'dd-col-y', 'dd-col-w', 'dd-col-h'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.oninput = updateCustomCol;
            });

            document.getElementById('dd-doodad-lock-toggle').onclick = () => {
                d.locked = !d.locked;
                this.refreshInspector();
            };
            document.getElementById('dd-doodad-hide-toggle').onclick = () => {
                d.editorHidden = !d.editorHidden;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
                this.refreshInspector();
            };
            const ungrpBtn = document.getElementById('dd-ungrp-single');
            if (ungrpBtn) {
                ungrpBtn.onclick = () => {
                    delete d.groupId;
                    this.refreshInspector();
                };
            }

            const applyDoodadInputs = () => {
                if (d.locked) return;
                d.x = parseInt(document.getElementById('dd-prop-x').value, 10) || 0;
                d.y = parseInt(document.getElementById('dd-prop-y').value, 10) || 0;
                d.z = parseInt(document.getElementById('dd-prop-z').value, 10) || 0;
                d.rotation = parseInt(document.getElementById('dd-prop-rot').value, 10) || 0;
                d.scaleX = parseFloat(document.getElementById('dd-prop-sx').value) || 1;
                d.scaleY = parseFloat(document.getElementById('dd-prop-sy').value) || 1;
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
            };

            ['dd-prop-x','dd-prop-y','dd-prop-z','dd-prop-rot','dd-prop-sx','dd-prop-sy'].forEach(id => {
                document.getElementById(id).onchange = applyDoodadInputs;
            });

            this.bindEffectSections([d]);
            this.bindSelectionTools([d]);
            document.getElementById('dd-prop-trace-col').onclick = () => this.traceCollision([d]);
            document.getElementById('dd-prop-forward').onclick = () => this.bringForward([d]);
            document.getElementById('dd-prop-backward').onclick = () => this.sendBackward([d]);
            document.getElementById('dd-prop-to-front').onclick = () => this.bringToFront([d]);
            document.getElementById('dd-prop-to-back').onclick = () => this.sendToBack([d]);
            document.getElementById('dd-prop-dup').onclick = () => {
                this.duplicateSelectedDoodad();
            };
            document.getElementById('dd-prop-del').onclick = () => {
                this.deleteSelectedDoodad();
            };
            return;
        }

        // Case 2: Drawer Asset Selected
        if (!this.selectedAsset) {
            this.renderMapPanel(content);
            return;
        }

        const a = this.selectedAsset;
        if (a.type === 'prefab') {
            this.renderPrefabInspector(content, a);
            return;
        }
        if (a.category === 'Audio') {
            this.renderAudioInspector(content, a);
            return;
        }
        const templates = DocsDoodads.EventTemplates.templates;
        let templateOptions = '';
        for (const key in templates) {
            templateOptions += `<option value="${escapeHtml(key)}">${escapeHtml(templates[key].name)}</option>`;
        }

        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">${escapeHtml(a.category)}</span></div>
            <div style="font-size: 11px; margin-bottom: 4px;">Dimensions: ${a.width} x ${a.height}</div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. forest, prop" style="width: 100%; box-sizing: border-box; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Placement Mode:</label>
                <select id="dd-place-mode" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="doodad">Decorative Doodad</option>
                    <option value="event">Real MZ Event</option>
                    <option value="ask">Ask Each Time</option>
                </select>
            </div>
            <div id="dd-template-group" style="margin-top: 8px; display: none;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Event Template:</label>
                <select id="dd-event-template" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${templateOptions}
                </select>
                ${a.type === 'character_sheet' ? `
                <label style="display: block; font-size: 11px; margin: 8px 0 3px;">Character on Sheet:</label>
                <select id="dd-char-index" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}">#${i + 1} (${i < 4 ? 'top' : 'bottom'} row, ${(i % 4) + 1} of 4)</option>`).join('')}
                </select>` : ''}
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Collision Preset:</label>
                <select id="dd-col-preset" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    <option value="none">None (Passable)</option>
                    <option value="full">Full Bounds</option>
                    <option value="bottomHalf">Bottom Half</option>
                    <option value="bottomThird">Bottom Third</option>
                    <option value="trunk">Tree Trunk</option>
                    <option value="thinWall">Thin Wall</option>
                    <option value="wideWall">Wide Wall</option>
                    <option value="custom">Custom (traced)</option>
                </select>
                <button class="dd-btn" id="dd-asset-trace-col" style="width: 100%; margin-top: 4px;" title="Fit the collision to the solid base of the image">Trace from Art</button>
            </div>
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Default Depth:</label>
                <select id="dd-asset-depth" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;">
                    ${DocsDoodads.Depth.modes.map(m => `<option value="${m}">${DocsDoodads.Depth.labels[m]}</option>`).join('')}
                </select>
            </div>
            ${this.renderAssetSeasonControl(a)}
            ${this.renderAssetPlacementTools(a)}
            ${this.renderUsagePanel(a)}
            <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-place-now-btn">Place on Map Center</button>
                <button class="dd-btn" id="dd-open-slicer-btn">Open Slicer</button>
            </div>
        `;

        const modeSel = document.getElementById('dd-place-mode');
        const templateGroup = document.getElementById('dd-template-group');
        modeSel.value = a.placement.defaultMode || "doodad";
        templateGroup.style.display = modeSel.value === "event" ? "block" : "none";

        modeSel.onchange = (e) => {
            a.placement.defaultMode = e.target.value;
            templateGroup.style.display = a.placement.defaultMode === "event" ? "block" : "none";
        };

        const charSel = document.getElementById('dd-char-index');
        if (charSel) {
            charSel.value = String(a.placement.characterIndex || 0);
            charSel.onchange = (e) => { a.placement.characterIndex = parseInt(e.target.value, 10) || 0; };
        }

        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };

        const colSel = document.getElementById('dd-col-preset');
        colSel.value = a.collision.preset || "none";
        colSel.onchange = (e) => {
            const shape = e.target.value === 'custom' ? (a.collision.shape || { x: 0.2, y: 0.6, w: 0.6, h: 0.4 }) : null;
            a.collision = { preset: e.target.value, shape };
            DocsDoodads.AssetIndex.save();
        };
        document.getElementById('dd-asset-trace-col').onclick = () => this.traceAssetCollision(a);
        const depthSel = document.getElementById('dd-asset-depth');
        depthSel.value = DocsDoodads.Depth.modes.includes(a.placement.depth) ? a.placement.depth : DocsDoodads.Depth.suggestFor(a);
        depthSel.onchange = (e) => {
            a.placement.depth = e.target.value;
            DocsDoodads.AssetIndex.save();
        };

        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };

        document.getElementById('dd-open-slicer-btn').onclick = () => {
            DocsDoodads.Slicing.Editor.open(a);
        };

        document.getElementById('dd-place-now-btn').onclick = () => {
            this.placeAssetOnMapCenter(a);
        };
        this.bindAssetSeasonControl(a);
        this.bindAssetPlacementTools(a);
        this.bindUsagePanel(a);
    },

    // ---- Undoable doodad property editing (inspector sections, tools) ----
    propertyDefaults() {
        return {
            shadow: DocsDoodads.Shadow.defaults,
            light: DocsDoodads.Lighting.lightDefaults,
            motion: { type: 'none', amount: 0.5, speed: 1 },
            transition: DocsDoodads.Transition.defaults,
            particles: { preset: 'none', rateScale: 1, layer: 'above', offsetX: 0, offsetY: 0 },
            sound: DocsDoodads.SpatialSound.emitterDefaults,
            react: DocsDoodads.React.defaults
        };
    },

    // Shown when a doodad has no value of its own.
    propertyFallbacks: { seeThrough: 'auto', reflect: 'auto', vfx: '' },

    getDoodadProperty(d, key) {
        if (key === 'flipX') return (d.scaleX !== undefined ? d.scaleX : 1) < 0;
        if (key === 'flipY') return (d.scaleY !== undefined ? d.scaleY : 1) < 0;
        if (key === 'switchText') return DocsDoodads.Appearance.formatSwitches(d.switch);
        if (key === 'depth') return DocsDoodads.Depth.resolve(d);
        if (key === 'layer') return DocsDoodads.Layers.of(d);
        if (key.indexOf('seasonIn.') === 0) return Array.isArray(d.seasons) && d.seasons.includes(Number(key.slice(9)));
        if (d[key] === undefined && this.propertyFallbacks[key] !== undefined) return this.propertyFallbacks[key];
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const value = d[group] ? d[group][field] : undefined;
            return value !== undefined ? value : (this.propertyDefaults()[group] || {})[field];
        }
        return d[key] !== undefined ? d[key] : DocsDoodads.standardStructData[key];
    },

    applyDoodadProperty(d, key, value) {
        if (key === 'flipX' || key === 'flipY') {
            const axis = key === 'flipX' ? 'scaleX' : 'scaleY';
            d[axis] = Math.abs(d[axis] !== undefined ? d[axis] : 1) * (value ? -1 : 1);
            return;
        }
        if (key === 'switchText') {
            d.switch = DocsDoodads.Appearance.parseSwitchText(value);
            return;
        }
        // "None" removes the emitter or attached effect rather than storing an empty one.
        if (key === 'particles.preset' && value === 'none') {
            delete d.particles;
            return;
        }
        if (key === 'vfx' && !value) {
            delete d.vfx;
            return;
        }
        if (key === 'sound.file' && !value) {
            delete d.sound;
            return;
        }
        if (key === 'layer' && (!value || value === 'main')) {
            delete d.layer;
            return;
        }
        // Season checkboxes: none ticked means every season.
        if (key.indexOf('seasonIn.') === 0) {
            const season = Number(key.slice(9));
            const list = new Set(Array.isArray(d.seasons) ? d.seasons : []);
            if (value) list.add(season); else list.delete(season);
            if (list.size > 0) d.seasons = Array.from(list).sort((a, b) => a - b);
            else delete d.seasons;
            return;
        }
        const dot = key.indexOf('.');
        if (dot > 0) {
            const group = key.slice(0, dot), field = key.slice(dot + 1);
            const next = Object.assign({}, this.propertyDefaults()[group] || {}, d[group] || {});
            next[field] = value;
            d[group] = next;
            return;
        }
        d[key] = value;
    },

    snapshotDoodads(items) {
        return items.map(d => JSON.parse(JSON.stringify(d)));
    },

    // Restores in place so selections and sprites keep pointing at the same objects.
    restoreDoodad(d, snapshot) {
        for (const key of Object.keys(d)) delete d[key];
        Object.assign(d, JSON.parse(JSON.stringify(snapshot)));
    },

    afterDoodadEdit() {
        DocsDoodads.Persistence.dirtyDoodads = true;
        this.refreshSpriteset(true);
    },

    // One undo step returning every item to its "before" snapshot (the change is already applied).
    recordDoodadEdit(items, before, type = 'edit_doodads') {
        const after = this.snapshotDoodads(items);
        DocsDoodads.Undo.execute({
            type,
            apply: () => { items.forEach((d, i) => this.restoreDoodad(d, after[i])); this.afterDoodadEdit(); },
            revert: () => { items.forEach((d, i) => this.restoreDoodad(d, before[i])); this.afterDoodadEdit(); }
        });
    },

    editDoodads(items, mutate, type) {
        items = (items || []).filter(Boolean);
        if (items.length === 0) return;
        const before = this.snapshotDoodads(items);
        items.forEach(mutate);
        this.recordDoodadEdit(items, before, type);
    },

    setDoodadProperty(items, key, value) {
        this.editDoodads(items, d => this.applyDoodadProperty(d, key, value), 'set_' + key);
    },

    // Slider drags preview live and become a single undo step when released.
    beginPropertyPreview(items) {
        this._propertyPreview = { items: items.slice(), before: this.snapshotDoodads(items) };
    },

    previewDoodadProperty(items, key, value) {
        if (!this._propertyPreview) this.beginPropertyPreview(items);
        items.forEach(d => this.applyDoodadProperty(d, key, value));
        this.refreshSpriteset(true);
    },

    commitPropertyPreview() {
        const preview = this._propertyPreview;
        this._propertyPreview = null;
        if (preview) this.recordDoodadEdit(preview.items, preview.before, 'adjust_doodads');
    },

    effectSections() {
        const D = DocsDoodads;
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        return [
            { title: 'Depth', fields: [
                { key: 'layer', label: 'Editor layer', type: 'select', options: D.Layers.list(D.Lighting.mapSettings(this.currentMapId())).map(l => ({ value: l.id, label: l.name })) },
                { key: 'depth', label: 'Draw order', type: 'select', options: D.Depth.modes.map(m => ({ value: m, label: D.Depth.labels[m] })) },
                number('sortOffsetY', 'Base line offset (px, negative = higher)')
            ] },
            { title: 'Appearance', fields: [
                range('opacity', 'Opacity', 0, 1, 0.05),
                { key: 'blend', label: 'Blend', type: 'select', options: D.Appearance.blendModes },
                range('hue', 'Hue shift', -180, 180, 1),
                range('r', 'Tone red', -255, 255, 1),
                range('g', 'Tone green', -255, 255, 1),
                range('b', 'Tone blue', -255, 255, 1),
                range('grey', 'Greyscale', 0, 255, 1),
                range('blur', 'Blur', 0, 20, 0.5),
                { key: 'flipX', label: 'Flip horizontally', type: 'checkbox' },
                { key: 'flipY', label: 'Flip vertically', type: 'checkbox' }
            ] },
            { title: 'Motion', fields: [
                { key: 'motion.type', label: 'Type', type: 'select', options: D.Motion.types },
                range('motion.amount', 'Amount', 0, 1, 0.05),
                range('motion.speed', 'Speed', 0.1, 3, 0.1),
                number('rotateSpeed', 'Spin (degrees per frame)', 0.5)
            ] },
            { title: 'Shadow', fields: [
                { key: 'shadow.enabled', label: 'Cast shadow', type: 'checkbox' },
                range('shadow.opacity', 'Strength', 0, 1, 0.05),
                range('shadow.length', 'Length', 0.1, 1.2, 0.05),
                range('shadow.angle', 'Lean (degrees)', -80, 80, 1),
                range('shadow.blur', 'Softness', 0, 10, 0.5),
                { key: 'shadow.followSun', label: 'Follow the sun (time of day)', type: 'checkbox' },
                number('shadow.offsetX', 'Offset X'),
                number('shadow.offsetY', 'Offset Y')
            ] },
            { title: 'Light', fields: [
                { key: 'light.enabled', label: 'Emit light', type: 'checkbox' },
                { key: 'light.when', label: 'When', type: 'select', options: D.Lighting.whenOptions },
                { key: 'light.color', label: 'Color', type: 'color' },
                range('light.radius', 'Radius', 16, 600, 4),
                range('light.intensity', 'Intensity', 0, 1, 0.05),
                range('light.flicker', 'Flicker', 0, 1, 0.05),
                range('light.glow', 'Daylight glow', 0, 1, 0.05),
                number('light.offsetX', 'Offset X'),
                number('light.offsetY', 'Offset Y')
            ] },
            { title: 'Visibility', fields: [
                { key: 'switchText', label: 'Switches (e.g. 5:on, 6:off)', type: 'text' },
                { key: 'condition', label: 'Condition (JavaScript, e.g. $gameVariables.value(3) > 2)', type: 'text' }
            ] },
            { title: 'Particles', fields: [
                { key: 'particles.preset', label: 'Emitter', type: 'select', options: [{ value: 'none', label: 'None' }].concat(D.Particles.presets.map(p => ({ value: p.id, label: p.label }))) },
                range('particles.rateScale', 'Amount (x preset rate)', 0, 5, 0.1),
                { key: 'particles.layer', label: 'Draw', type: 'select', options: D.Particles.layers },
                number('particles.offsetX', 'Offset X (from the centre)'),
                number('particles.offsetY', 'Offset Y (from the centre)'),
                { key: 'vfx', label: 'Attached VFX (loops)', type: 'select', options: [{ value: '', label: 'None' }]
                    .concat(D.Vfx.library().concat(D.Vfx.builtIns).map(v => ({ value: v.id, label: v.name }))) }
            ] },
            { title: 'Sound', fields: [
                { key: 'sound.file', label: 'Sound (background sounds loop; sound effects repeat)', type: 'select',
                    options: [{ value: '', label: 'None' }].concat(this.audioFileOptions()) },
                range('sound.volume', 'Volume', 0, 100, 1),
                range('sound.pitch', 'Pitch', 50, 150, 1),
                range('sound.radius', 'Heard within (tiles)', 1, 40, 1),
                number('sound.every', 'Sound effects: about every (seconds)', 0.5)
            ] },
            { title: 'Interaction', fields: [
                { key: 'react.enabled', label: 'Bend when walked through (grass, bushes, reeds)', type: 'checkbox' },
                range('react.amount', 'Strength', 0, 2, 0.05),
                { key: 'react.leaves', label: 'Drop leaves when disturbed', type: 'checkbox' }
            ] },
            { title: 'Atmosphere', fields: [
                { key: 'seeThrough', label: 'See-through when the player is behind', type: 'select', options: D.SeeThrough.options },
                { key: 'reflect', label: 'Reflect in water', type: 'select', options: D.Reflection.options },
                { key: 'transition.type', label: 'Appear / disappear', type: 'select', options: D.Transition.types },
                number('transition.frames', 'Transition length (frames)')
            ].concat(D.World.settings().seasons.names.map((name, i) => ({
                key: `seasonIn.${i}`, label: `Only in ${name}${i === 0 ? ' (none ticked = all seasons)' : ''}`, type: 'checkbox'
            }))) }
        ];
    },

    fieldHtml(id, f, value) {
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px; border-radius: 3px; font-size: 11px;';
        const label = `<label for="${id}" style="font-size: 10px; color: #94a3b8;">${escapeHtml(f.label)}${f.type === 'range' ? `: <span id="${id}-val" style="color: #e2e8f0;">${escapeHtml(String(value))}</span>` : ''}</label>`;
        if (f.type === 'checkbox') {
            return `<label style="font-size: 11px; color: #cbd5e1; display: flex; align-items: center; gap: 6px;"><input type="checkbox" id="${id}" ${value ? 'checked' : ''} /> ${escapeHtml(f.label)}</label>`;
        }
        if (f.type === 'select') {
            const options = f.options.map(o => `<option value="${escapeHtml(String(o.value))}" ${String(o.value) === String(value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('');
            return `<div>${label}<select id="${id}" style="${inputStyle}">${options}</select></div>`;
        }
        if (f.type === 'range') {
            return `<div>${label}<input type="range" id="${id}" min="${f.min}" max="${f.max}" step="${f.step}" value="${escapeHtml(String(value))}" style="width: 100%;" /></div>`;
        }
        if (f.type === 'color') {
            return `<div>${label}<input type="color" id="${id}" value="${escapeHtml(String(value))}" style="width: 100%; height: 22px; background: #0f172a; border: 1px solid #334155;" /></div>`;
        }
        const type = f.type === 'number' ? 'number' : 'text';
        return `<div>${label}<input type="${type}" id="${id}" ${f.step ? `step="${f.step}"` : ''} value="${escapeHtml(String(value === undefined || value === null ? '' : value))}" style="${inputStyle}" /></div>`;
    },

    renderEffectSections(items) {
        const first = items[0];
        this._openEffectSections = this._openEffectSections || {};
        return this.effectSections().map((section, si) => {
            const fields = section.fields.map((f, fi) => {
                const id = `dd-fx-${si}-${fi}`;
                const value = this.getDoodadProperty(first, f.key);
                return this.fieldHtml(id, f, value);
            }).join('');
            return `
                <details id="dd-fx-sec-${si}" ${this._openEffectSections[section.title] ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">${section.title}</summary>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}</div>
                </details>`;
        }).join('');
    },

    bindEffectSections(items) {
        this.effectSections().forEach((section, si) => {
            const details = document.getElementById(`dd-fx-sec-${si}`);
            if (details) details.ontoggle = () => { this._openEffectSections[section.title] = details.open; };
            section.fields.forEach((f, fi) => {
                const input = document.getElementById(`dd-fx-${si}-${fi}`);
                if (!input) return;
                const read = () => {
                    if (f.type === 'checkbox') return Boolean(input.checked);
                    if (f.type === 'range' || f.type === 'number') return parseFloat(input.value) || 0;
                    return input.value;
                };
                if (f.type === 'range') {
                    const label = document.getElementById(`dd-fx-${si}-${fi}-val`);
                    input.oninput = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.previewDoodadProperty(items, f.key, read());
                        this.commitPropertyPreview();
                    };
                } else {
                    input.onchange = () => this.setDoodadProperty(items, f.key, read());
                }
            });
        });
    },

    // ---- Map settings (lighting) ----
    currentMapId() {
        return window.$gameMap && typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
    },

    writeMapSettings(mapId, value) {
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        if (value && Object.keys(value).length > 0) {
            data.mapSettings = data.mapSettings || {};
            data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
        } else if (data.mapSettings) {
            delete data.mapSettings[mapId];
            if (Object.keys(data.mapSettings).length === 0) delete data.mapSettings;
        }
        DocsDoodads.Persistence.dirtyDoodads = true;
    },

    setMapAmbient(ambient, before) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = before !== undefined ? before
            : (data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null);
        const next = Object.assign({}, previous || {}, { ambient: Object.assign({}, ambient) });
        DocsDoodads.Undo.execute({ type: 'map_ambient', apply: () => this.writeMapSettings(mapId, next), revert: () => this.writeMapSettings(mapId, previous) });
    },

    // One per-map option (undefined restores the default). previousSettings: the map's settings before a live preview.
    setMapSetting(key, value, previousSettings) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads = window.$dataDocsDoodads || {};
        const previous = previousSettings !== undefined ? previousSettings
            : (data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null);
        const next = Object.assign({}, previous || {});
        if (value === undefined) delete next[key];
        else next[key] = value;
        DocsDoodads.Undo.execute({ type: 'map_setting', apply: () => this.writeMapSettings(mapId, next), revert: () => this.writeMapSettings(mapId, previous) });
    },

    // ---- World (project-wide) settings ----
    // previous: { value } when a live preview already changed the setting.
    setWorldSetting(key, value, previous) {
        const World = DocsDoodads.World;
        const copy = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
        const before = previous ? copy(previous.value) : copy(World.raw(key));
        const after = copy(value);
        const write = v => {
            World.set(key, copy(v));
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'world_setting', apply: () => write(after), revert: () => write(before) });
    },

    // ---- Layers (per map) ----
    activeLayer: 'main',

    mapSettingsCopy() {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        return settings ? JSON.parse(JSON.stringify(settings)) : null;
    },

    layersRaw() {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
        return JSON.parse(JSON.stringify(Array.isArray(settings.layers) ? settings.layers : []));
    },

    addLayer(name) {
        const layers = this.layersRaw();
        const id = DocsDoodads.Prefabs.newId('layer_');
        layers.push({ id, name: String(name || 'Layer ' + (layers.length + 2)) });
        this.setMapSetting('layers', layers);
        return id;
    },

    renameLayer(id, name) {
        if (id === 'main' || !String(name || '').trim()) return false;
        const layers = this.layersRaw();
        const layer = layers.find(l => l.id === id);
        if (!layer) return false;
        layer.name = String(name).trim();
        this.setMapSetting('layers', layers);
        return true;
    },

    // hidden (editor only), locked, gameHidden. Main keeps its flags under mainLayer.
    setLayerFlag(id, flag, value) {
        if (id === 'main') {
            const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {};
            this.setMapSetting('mainLayer', Object.assign({}, settings.mainLayer || {}, { [flag]: Boolean(value) }));
            return;
        }
        const layers = this.layersRaw();
        const layer = layers.find(l => l.id === id);
        if (!layer) return;
        layer[flag] = Boolean(value);
        this.setMapSetting('layers', layers);
    },

    // One step: the layer goes and its doodads move to Main.
    deleteLayer(id) {
        if (id === 'main') return false;
        const mapId = this.currentMapId();
        const previous = this.mapSettingsCopy();
        const next = Object.assign({}, previous || {}, { layers: this.layersRaw().filter(l => l.id !== id) });
        const moved = DocsDoodads.doodads(mapId).filter(d => d && d.layer === id);
        DocsDoodads.Undo.execute({
            type: 'delete_layer',
            apply: () => {
                this.writeMapSettings(mapId, next);
                moved.forEach(d => { delete d.layer; });
                if (this.activeLayer === id) this.activeLayer = 'main';
                this.afterDoodadEdit();
            },
            revert: () => {
                this.writeMapSettings(mapId, previous);
                moved.forEach(d => { d.layer = id; });
                this.afterDoodadEdit();
            }
        });
        return true;
    },

    moveSelectionToLayer(id) {
        const items = this.selectedDoodads && this.selectedDoodads.length ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        this.setDoodadProperty(items, 'layer', id);
    },

    layerAllowsEditing(d) {
        const settings = DocsDoodads.Lighting.mapSettings(this.currentMapId());
        return DocsDoodads.Layers.visibleInEditor(d, settings) && !DocsDoodads.Layers.isLocked(d, settings);
    },

    renderLayersPanel(mapSettings) {
        const layers = DocsDoodads.Layers.list(mapSettings);
        const counts = {};
        for (const d of DocsDoodads.doodads(this.currentMapId())) if (d) counts[DocsDoodads.Layers.of(d)] = (counts[DocsDoodads.Layers.of(d)] || 0) + 1;
        const active = layers.some(l => l.id === this.activeLayer) ? this.activeLayer : 'main';
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const rows = layers.map((l, i) => `
            <div style="display: grid; grid-template-columns: 16px 1fr 30px 18px 18px 18px 20px; gap: 3px; align-items: center; font-size: 10px; color: #cbd5e1;">
                <input type="radio" name="dd-layer-active" id="dd-layer-active-${i}" ${l.id === active ? 'checked' : ''} title="New doodads go on this layer" />
                ${l.id === 'main' ? `<span>${escapeHtml(l.name)}</span>` : `<input type="text" id="dd-layer-name-${i}" value="${escapeHtml(l.name)}" style="${inputStyle}" />`}
                <span style="color: #64748b;" title="Doodads on this layer">${counts[l.id] || 0}</span>
                <input type="checkbox" id="dd-layer-show-${i}" ${l.hidden ? '' : 'checked'} title="Show in the editor" />
                <input type="checkbox" id="dd-layer-lock-${i}" ${l.locked ? 'checked' : ''} title="Locked (can't be selected)" />
                <input type="checkbox" id="dd-layer-game-${i}" ${l.gameHidden ? '' : 'checked'} title="Show in the game" />
                ${l.id === 'main' ? '<span></span>' : `<button class="dd-btn" id="dd-layer-del-${i}" title="Delete (doodads move to Main)" style="padding: 0 4px;">&times;</button>`}
            </div>`).join('');
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;" ${this._openLayers ? 'open' : ''} id="dd-layers-sec">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Layers</summary>
                <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
                    <div style="display: grid; grid-template-columns: 16px 1fr 30px 18px 18px 18px 20px; gap: 3px; font-size: 9px; color: #64748b;"><span></span><span>Name</span><span>#</span><span>Ed</span><span>Lk</span><span>Gm</span><span></span></div>
                    ${rows}
                    <button class="dd-btn" id="dd-layer-add">Add Layer</button>
                    <div style="font-size: 10px; color: #64748b; line-height: 1.4;">The selected layer receives new doodads. Ed = shown while editing, Lk = locked, Gm = shown in the game. Move doodads with the Layer field in their inspector.</div>
                </div>
            </details>`;
    },

    bindLayersPanel(mapSettings) {
        const byId = id => document.getElementById(id);
        const sec = byId('dd-layers-sec');
        if (sec) sec.ontoggle = () => { this._openLayers = sec.open; };
        DocsDoodads.Layers.list(mapSettings).forEach((l, i) => {
            const on = (id, handler) => { const node = byId(id); if (node) node.onchange = handler; };
            on(`dd-layer-active-${i}`, () => { this.activeLayer = l.id; this.showToast(`New doodads go on ${l.name}.`); });
            on(`dd-layer-name-${i}`, e => this.renameLayer(l.id, e.target.value));
            on(`dd-layer-show-${i}`, e => { this.setLayerFlag(l.id, 'hidden', !e.target.checked); this.refreshSpriteset(true); });
            on(`dd-layer-lock-${i}`, e => this.setLayerFlag(l.id, 'locked', e.target.checked));
            on(`dd-layer-game-${i}`, e => this.setLayerFlag(l.id, 'gameHidden', !e.target.checked));
            const del = byId(`dd-layer-del-${i}`);
            if (del) del.onclick = () => { this.deleteLayer(l.id); this.refreshInspector(); };
        });
        const add = byId('dd-layer-add');
        if (add) add.onclick = () => { this.activeLayer = this.addLayer(); this._openLayers = true; this.refreshInspector(); };
    },

    // ---- Symmetry ----
    symmetry: { mode: 'off', axisX: null, axisY: null },

    symmetryFor() {
        const s = this.symmetry || { mode: 'off' };
        if (!s.mode || s.mode === 'off') return { mode: 'off' };
        const gm = window.$gameMap;
        const axes = gm && gm.width ? DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), gm.tileWidth(), gm.tileHeight()) : { axisX: 0, axisY: 0 };
        return { mode: s.mode, axisX: s.axisX !== null && s.axisX !== undefined ? s.axisX : axes.axisX, axisY: s.axisY !== null && s.axisY !== undefined ? s.axisY : axes.axisY };
    },

    setSymmetry(mode) {
        this.symmetry = Object.assign({}, this.symmetry, { mode });
        const btn = document.getElementById('dd-sym-btn');
        if (btn && btn.classList) btn.classList.toggle('dd-btn-active', mode !== 'off');
        this.showToast(mode === 'off' ? 'Symmetry off.' : `Symmetry: ${DocsDoodads.Symmetry.modes.find(m => m.value === mode).label.toLowerCase()}.`);
    },

    // Copies of a new doodad for symmetry, each with its own uid.
    withMirrors(d) {
        const copies = DocsDoodads.Symmetry.mirrors(d, this.symmetryFor());
        copies.forEach(c => DocsDoodads.MapLinks.ensureUid(c));
        return [d].concat(copies);
    },

    // ---- Biomes ----
    biomeSettings: { biomeId: '', radius: 96, avoidBlocked: true },

    biomesRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('biomes.list') || []));
    },

    newBiome(name) {
        const list = this.biomesRaw();
        const id = DocsDoodads.Prefabs.newId('biome_');
        list.push({ id, name: String(name || 'Biome ' + (list.length + 1)), entries: [], spacing: 40, density: 6, edgeThin: 0.5, cluster: 0.3 });
        this.setWorldSetting('biomes.list', list);
        if (!this.biomeSettings.biomeId) this.biomeSettings.biomeId = id;
        return id;
    },

    editBiome(id, mutate) {
        const list = this.biomesRaw();
        const biome = list.find(b => b.id === id);
        if (!biome) return false;
        mutate(biome, list);
        this.setWorldSetting('biomes.list', list);
        return true;
    },

    setBiomeField(id, field, value) {
        return this.editBiome(id, b => { b[field] = value; });
    },

    addBiomeEntry(id, path) {
        if (!path) return false;
        return this.editBiome(id, b => { b.entries = b.entries || []; b.entries.push({ path: String(path), weight: 1, scaleMin: 1, scaleMax: 1 }); });
    },

    setBiomeEntryField(id, index, field, value) {
        return this.editBiome(id, b => { if (b.entries && b.entries[index]) b.entries[index][field] = value; });
    },

    removeBiomeEntry(id, index) {
        return this.editBiome(id, b => { (b.entries || []).splice(index, 1); });
    },

    deleteBiome(id) {
        const list = this.biomesRaw().filter(b => b.id !== id);
        this.setWorldSetting('biomes.list', list);
    },

    assetByPath(path) {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? DocsDoodads.AssetIndex.data.assets || {} : {};
        return assets[path] || Object.values(assets).find(a => a && a.path === path) || { id: path, path, fileName: String(path).split('/').pop(), width: 48, height: 48, tags: [], autoTags: [], placement: {}, collision: {} };
    },

    // Tile rules shared by the scatter and biome brushes.
    scatterQuery() {
        const gameMap = window.$gameMap;
        return {
            tileWidth: gameMap && gameMap.tileWidth ? gameMap.tileWidth() : 48,
            tileHeight: gameMap && gameMap.tileHeight ? gameMap.tileHeight() : 48,
            width: gameMap && gameMap.width ? gameMap.width() : Infinity,
            height: gameMap && gameMap.height ? gameMap.height() : Infinity,
            regionId: (x, y) => (gameMap && gameMap.regionId ? gameMap.regionId(x, y) : 0),
            terrainTag: (x, y) => (gameMap && gameMap.terrainTag ? gameMap.terrainTag(x, y) : 0),
            isPassable: (x, y) => (gameMap && gameMap.isPassable ? [2, 4, 6, 8].some(d => gameMap.isPassable(x, y, d)) : true)
        };
    },

    biomePaintAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const s = this.biomeSettings;
        if (this._lastDab && Math.hypot(this._lastDab.x - coords.x, this._lastDab.y - coords.y) < s.radius * 0.4) return;
        this._lastDab = { x: coords.x, y: coords.y };
        const list = this.biomesRaw();
        const raw = DocsDoodads.Biome.find(s.biomeId, list) || list[0];
        const biome = raw ? DocsDoodads.Biome.normalize(raw) : null;
        if (!biome || biome.entries.length === 0) {
            if (!this._biomeWarned) this.showToast('Make a biome first (map panel > Biomes), then add art to it.', 'error');
            this._biomeWarned = true;
            return;
        }
        const mapId = this.currentMapId();
        const doodads = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const reach = s.radius + biome.spacing;
        const existing = doodads.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        this._biomeRng = this._biomeRng || DocsDoodads.Scatter.rng(Date.now());
        const rules = { regions: [], terrainTags: [], avoidBlocked: Boolean(s.avoidBlocked) };
        const query = this.scatterQuery();
        for (const p of DocsDoodads.Biome.paint(biome, coords, s.radius, existing, this._biomeRng)) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const d = this.newDoodadFromAsset(this.assetByPath(p.path), p.x, p.y);
            d.scaleX = p.scale * (p.flipX ? -1 : 1);
            d.scaleY = p.scale;
            for (const item of this.withMirrors(d)) {
                doodads.push(item);
                this.currentBrushBatch.push(item);
            }
        }
        this.refreshSpriteset();
    },

    // ---- Map dressing ----
    dressRulesRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('dress.rules') || []));
    },

    addDressRule(where) {
        const rules = this.dressRulesRaw();
        rules.push({ name: 'Rule ' + (rules.length + 1), where: where || 'waterEdge', param: 0, chance: 0.35, spacing: 0, entries: [] });
        this.setWorldSetting('dress.rules', rules);
        return rules.length - 1;
    },

    setDressRuleField(index, field, value) {
        const rules = this.dressRulesRaw();
        if (!rules[index]) return;
        rules[index][field] = value;
        this.setWorldSetting('dress.rules', rules);
    },

    addDressEntry(index, path) {
        const rules = this.dressRulesRaw();
        if (!rules[index] || !path) return;
        rules[index].entries = rules[index].entries || [];
        rules[index].entries.push({ path: String(path), weight: 1, scaleMin: 1, scaleMax: 1 });
        this.setWorldSetting('dress.rules', rules);
    },

    removeDressEntry(index, entry) {
        const rules = this.dressRulesRaw();
        if (!rules[index]) return;
        (rules[index].entries || []).splice(entry, 1);
        this.setWorldSetting('dress.rules', rules);
    },

    removeDressRule(index) {
        const rules = this.dressRulesRaw();
        rules.splice(index, 1);
        this.setWorldSetting('dress.rules', rules);
    },

    // The current map's tiles, as the dressing rules see them.
    dressQuery() {
        const gm = window.$gameMap;
        const isWaterTile = id => (typeof Tilemap !== 'undefined' && Tilemap.isWaterTile ? Tilemap.isWaterTile(id) : false);
        return {
            width: gm.width(), height: gm.height(),
            isWater: (x, y) => DocsDoodads.Reflection.isWaterAt([0, 1, 2, 3].map(z => gm.tileId(x, y, z)), 0, { regionId: 0 }, isWaterTile),
            isPassable: (x, y) => [2, 4, 6, 8].some(d => gm.isPassable(x, y, d)),
            regionId: (x, y) => gm.regionId(x, y),
            terrainTag: (x, y) => gm.terrainTag(x, y),
            hasEvent: (x, y) => gm.eventsXy(x, y).length > 0,
            // Blank tiles around a map are passable in MZ but have nothing to stand on.
            hasGround: (x, y) => gm.tileId(x, y, 0) > 0 || gm.tileId(x, y, 1) > 0
        };
    },

    // Places every rule's props in one undo step; returns how many.
    dressMap(seed) {
        const mapId = this.currentMapId();
        const gm = window.$gameMap;
        const tw = gm && gm.tileWidth ? gm.tileWidth() : 48, th = gm && gm.tileHeight ? gm.tileHeight() : 48;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const plan = DocsDoodads.Dress.plan(this.dressRulesRaw(), this.dressQuery(), list.map(d => ({ x: d.x, y: d.y })), tw, th,
            DocsDoodads.Scatter.rng(seed || Date.now()));
        const added = plan.map(p => {
            const d = this.newDoodadFromAsset(this.assetByPath(p.path), p.x, p.y);
            d.scaleX = p.scale * (p.flipX ? -1 : 1);
            d.scaleY = p.scale;
            d.dressed = true;
            return d;
        });
        if (added.length === 0) return 0;
        DocsDoodads.Undo.execute({
            type: 'dress_map',
            apply: () => { const l = window.$dataDocsDoodads[mapId]; added.forEach(d => { if (!l.includes(d)) l.push(d); }); this.afterDoodadEdit(); },
            revert: () => { const l = window.$dataDocsDoodads[mapId]; added.forEach(d => { const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); }); this.afterDoodadEdit(); }
        });
        return added.length;
    },

    clearDressing() {
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] || [];
        const removed = list.filter(d => d && d.dressed);
        if (removed.length === 0) return 0;
        const before = list.slice();
        DocsDoodads.Undo.execute({
            type: 'clear_dressing',
            apply: () => { const l = window.$dataDocsDoodads[mapId]; for (const d of removed) { const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); } this.afterDoodadEdit(); },
            revert: () => { window.$dataDocsDoodads[mapId].splice(0, Infinity, ...before); this.afterDoodadEdit(); }
        });
        return removed.length;
    },

    renderBiomeEditor() {
        const list = DocsDoodads.World.get('biomes.list') || [];
        const sel = DocsDoodads.Biome.find(this.biomeSettings.biomeId, list) || list[0] || null;
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const options = list.map(b => `<option value="${escapeHtml(b.id)}" ${sel && b.id === sel.id ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('');
        const b = sel ? DocsDoodads.Biome.normalize(sel) : null;
        const entries = sel ? (sel.entries || []).map((e, i) => `
            <div style="display: grid; grid-template-columns: 1fr 34px 34px 34px 20px; gap: 3px; align-items: center;">
                <input type="text" list="dd-doodad-files" id="dd-biome-e${i}-path" value="${escapeHtml(e.path || '')}" title="${escapeHtml(e.path || '')}" style="${inputStyle}" />
                <input type="number" min="0" step="0.5" id="dd-biome-e${i}-weight" value="${escapeHtml(String(e.weight === undefined ? 1 : e.weight))}" title="Weight" style="${inputStyle}" />
                <input type="number" min="0.1" step="0.05" id="dd-biome-e${i}-scaleMin" value="${escapeHtml(String(e.scaleMin === undefined ? 1 : e.scaleMin))}" title="Smallest scale" style="${inputStyle}" />
                <input type="number" min="0.1" step="0.05" id="dd-biome-e${i}-scaleMax" value="${escapeHtml(String(e.scaleMax === undefined ? 1 : e.scaleMax))}" title="Largest scale" style="${inputStyle}" />
                <button class="dd-btn" id="dd-biome-e${i}-del" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('') : '';
        return `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.4;">A biome is a mix of props painted with the Biome brush. Add art here or with "Add to Biome" on an asset.</div>
            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 4px;">
                <select id="dd-biome-pick" style="${inputStyle}">${options || '<option value="">(no biomes yet)</option>'}</select>
                <button class="dd-btn" id="dd-biome-new">New</button>
                <button class="dd-btn" id="dd-biome-del" ${sel ? '' : 'disabled'}>Delete</button>
            </div>
            ${b ? `
            <input type="text" id="dd-biome-name" value="${escapeHtml(b.name)}" style="${inputStyle}" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #94a3b8;">
                <label>Spacing (px)<input type="number" id="dd-biome-spacing" value="${b.spacing}" style="${inputStyle}" /></label>
                <label>Per dab<input type="number" id="dd-biome-density" value="${b.density}" style="${inputStyle}" /></label>
                <label>Thin at edge<input type="range" id="dd-biome-edgeThin" min="0" max="1" step="0.05" value="${b.edgeThin}" style="width: 100%;" /></label>
                <label>Patchiness<input type="range" id="dd-biome-cluster" min="0" max="1" step="0.05" value="${b.cluster}" style="width: 100%;" /></label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 34px 34px 34px 20px; gap: 3px; font-size: 9px; color: #64748b;"><span>Art</span><span>Weight</span><span>Min</span><span>Max</span><span></span></div>
            ${entries}
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                <input type="text" list="dd-doodad-files" id="dd-biome-add-path" placeholder="img/doodads/..." style="${inputStyle}" />
                <button class="dd-btn" id="dd-biome-add">Add</button>
            </div>` : ''}
            ${this.doodadFilesDatalist()}`;
    },

    doodadFilesDatalist() {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? Object.values(DocsDoodads.AssetIndex.data.assets || {}) : [];
        const paths = assets.filter(a => a && /\.png$/i.test(a.path || '') && !/^img\/(characters|faces|system|titles|battlebacks|sv_|enemies)/i.test(a.path)).map(a => a.path).slice(0, 3000);
        return `<datalist id="dd-doodad-files">${paths.map(p => `<option value="${escapeHtml(p)}"></option>`).join('')}</datalist>`;
    },

    bindBiomeEditor() {
        const byId = id => document.getElementById(id);
        const list = DocsDoodads.World.get('biomes.list') || [];
        const sel = DocsDoodads.Biome.find(this.biomeSettings.biomeId, list) || list[0] || null;
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-biome-pick', 'onchange', e => { this.biomeSettings.biomeId = e.target.value; this.refreshInspector(); });
        on('dd-biome-new', 'onclick', () => { this.biomeSettings.biomeId = this.newBiome(); this.refreshInspector(); });
        if (!sel) return;
        this.biomeSettings.biomeId = sel.id;
        on('dd-biome-del', 'onclick', () => { this.deleteBiome(sel.id); this.biomeSettings.biomeId = ''; this.refreshInspector(); });
        on('dd-biome-name', 'onchange', e => { this.setBiomeField(sel.id, 'name', e.target.value.trim() || sel.name); this.refreshInspector(); });
        for (const field of ['spacing', 'density', 'edgeThin', 'cluster']) on(`dd-biome-${field}`, 'onchange', e => this.setBiomeField(sel.id, field, parseFloat(e.target.value) || 0));
        (sel.entries || []).forEach((entry, i) => {
            on(`dd-biome-e${i}-path`, 'onchange', e => this.setBiomeEntryField(sel.id, i, 'path', e.target.value.trim()));
            for (const field of ['weight', 'scaleMin', 'scaleMax']) on(`dd-biome-e${i}-${field}`, 'onchange', e => this.setBiomeEntryField(sel.id, i, field, parseFloat(e.target.value) || 0));
            on(`dd-biome-e${i}-del`, 'onclick', () => { this.removeBiomeEntry(sel.id, i); this.refreshInspector(); });
        });
        on('dd-biome-add', 'onclick', () => { this.addBiomeEntry(sel.id, byId('dd-biome-add-path').value.trim()); this.refreshInspector(); });
    },

    renderDressEditor() {
        const rules = DocsDoodads.World.get('dress.rules') || [];
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const rows = rules.map((rule, r) => {
            const n = DocsDoodads.Dress.normalize(rule);
            const entries = (rule.entries || []).map((e, i) => `
                <div style="display: grid; grid-template-columns: 1fr 20px; gap: 3px;">
                    <span style="font-size: 10px; color: #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(e.path)}">${escapeHtml(String(e.path).split('/').pop())}</span>
                    <button class="dd-btn" id="dd-dress-${r}-e${i}-del" style="padding: 0 4px;">&times;</button>
                </div>`).join('');
            return `
                <div style="border: 1px solid #334155; border-radius: 4px; padding: 5px; display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: grid; grid-template-columns: 1fr 20px; gap: 3px;">
                        <input type="text" id="dd-dress-${r}-name" value="${escapeHtml(n.name)}" style="${inputStyle}" />
                        <button class="dd-btn" id="dd-dress-${r}-del" title="Remove rule" style="padding: 0 4px;">&times;</button>
                    </div>
                    <select id="dd-dress-${r}-where" style="${inputStyle}">${DocsDoodads.Dress.places.map(p => `<option value="${p.value}" ${p.value === n.where ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}</select>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; font-size: 9px; color: #94a3b8;">
                        <label>Region/tag<input type="number" id="dd-dress-${r}-param" value="${n.param}" style="${inputStyle}" /></label>
                        <label>Chance<input type="number" min="0" max="1" step="0.05" id="dd-dress-${r}-chance" value="${n.chance}" style="${inputStyle}" /></label>
                        <label>Spacing<input type="number" min="0" id="dd-dress-${r}-spacing" value="${n.spacing}" style="${inputStyle}" /></label>
                    </div>
                    ${entries}
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                        <input type="text" list="dd-doodad-files" id="dd-dress-${r}-add-path" placeholder="img/doodads/..." style="${inputStyle}" />
                        <button class="dd-btn" id="dd-dress-${r}-add">Add</button>
                    </div>
                </div>`;
        }).join('');
        return `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.4;">Rules read the map's tiles: reeds along water, barrels at wall bases, flowers beside a path region. Dressing is one undo step and dressed props can be cleared together.</div>
            ${rows}
            <button class="dd-btn" id="dd-dress-add-rule">Add Rule</button>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                <button class="dd-btn dd-btn-primary" id="dd-dress-run">Dress Map</button>
                <button class="dd-btn" id="dd-dress-reroll" title="Clear this map's dressing and dress it again">Re-roll</button>
                <button class="dd-btn" id="dd-dress-clear">Clear</button>
            </div>
            ${this.doodadFilesDatalist()}`;
    },

    bindDressEditor() {
        const byId = id => document.getElementById(id);
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        const rules = DocsDoodads.World.get('dress.rules') || [];
        rules.forEach((rule, r) => {
            on(`dd-dress-${r}-name`, 'onchange', e => this.setDressRuleField(r, 'name', e.target.value.trim() || rule.name));
            on(`dd-dress-${r}-where`, 'onchange', e => this.setDressRuleField(r, 'where', e.target.value));
            for (const field of ['param', 'chance', 'spacing']) on(`dd-dress-${r}-${field}`, 'onchange', e => this.setDressRuleField(r, field, parseFloat(e.target.value) || 0));
            on(`dd-dress-${r}-del`, 'onclick', () => { this.removeDressRule(r); this.refreshInspector(); });
            (rule.entries || []).forEach((entry, i) => on(`dd-dress-${r}-e${i}-del`, 'onclick', () => { this.removeDressEntry(r, i); this.refreshInspector(); }));
            on(`dd-dress-${r}-add`, 'onclick', () => { this.addDressEntry(r, byId(`dd-dress-${r}-add-path`).value.trim()); this.refreshInspector(); });
        });
        on('dd-dress-add-rule', 'onclick', () => { this.addDressRule(); this.refreshInspector(); });
        on('dd-dress-run', 'onclick', () => { const n = this.dressMap(); this.showToast(n ? `Dressed the map with ${n} prop(s).` : 'Nothing to add: check the rules have art and matching tiles.', n ? 'success' : 'info'); });
        on('dd-dress-reroll', 'onclick', () => { this.clearDressing(); const n = this.dressMap(); this.showToast(`Re-rolled: ${n} prop(s).`, 'success'); });
        on('dd-dress-clear', 'onclick', () => { const n = this.clearDressing(); this.showToast(`Removed ${n} dressed prop(s).`, 'info'); });
    },

    // Asset inspector: add the selected art to a biome or a dressing rule.
    renderAssetPlacementTools(a) {
        if (!a || !a.path || !/\.png$/i.test(a.path)) return '';
        const biomes = DocsDoodads.World.get('biomes.list') || [];
        const rules = DocsDoodads.World.get('dress.rules') || [];
        const selectStyle = 'flex: 1; min-width: 0; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 3px; border-radius: 4px; font-size: 11px;';
        return `
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 11px;">Add to Biome / Dressing Rule:</label>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-biome" style="${selectStyle}"><option value="new">New biome</option>${biomes.map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.name)}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-biome-add">Add</button>
                </div>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-dress" style="${selectStyle}"><option value="new">New rule</option>${rules.map((r, i) => `<option value="${i}">${escapeHtml(r.name || 'Rule ' + (i + 1))}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-dress-add">Add</button>
                </div>
            </div>`;
    },

    bindAssetPlacementTools(a) {
        const byId = id => document.getElementById(id);
        const biomeBtn = byId('dd-asset-biome-add');
        if (biomeBtn) biomeBtn.onclick = () => {
            let id = byId('dd-asset-biome').value;
            if (id === 'new') id = this.newBiome(String(a.fileName || 'Biome').replace(/\.[^.]+$/, '') + ' biome');
            this.addBiomeEntry(id, a.path);
            this.biomeSettings.biomeId = id;
            this.showToast('Added to the biome. Paint it with the Biome brush.', 'success');
        };
        const dressBtn = byId('dd-asset-dress-add');
        if (dressBtn) dressBtn.onclick = () => {
            let index = byId('dd-asset-dress').value;
            index = index === 'new' ? this.addDressRule() : parseInt(index, 10);
            this.addDressEntry(index, a.path);
            this.showToast('Added to the dressing rule. Run Dress Map from the map panel.', 'success');
        };
    },

    // ---- Visual save history ----
    historyBackups() {
        const FS = DocsDoodads.FS;
        const mapFile = DocsDoodads.Persistence.mapFilePath ? DocsDoodads.Persistence.mapFilePath(this.currentMapId()) : null;
        const doodadFile = 'data/' + dataFileName;
        const tag = (list, kind) => list.map(b => Object.assign({}, b, { kind }));
        return tag(FS.listBackups(doodadFile), 'doodads').concat(mapFile ? tag(FS.listBackups(mapFile), 'map') : [])
            .sort((a, b) => b.mtimeMs - a.mtimeMs);
    },

    loadHistoryDiff(backup) {
        const data = DocsDoodads.FS.readJson(backup.path);
        if (!data) return null;
        const mapId = this.currentMapId();
        if (backup.kind === 'map') {
            const staged = DocsDoodads.Persistence.stagedFor(mapId);
            const current = staged ? staged.events : (window.$dataMap ? window.$dataMap.events : []);
            return { kind: 'map', backup, events: DocsDoodads.History.diffEvents(current, data.events || []) };
        }
        return { kind: 'doodads', backup, doodads: DocsDoodads.History.diffDoodads(DocsDoodads.doodads(mapId), Array.isArray(data[mapId]) ? data[mapId] : []) };
    },

    // item.kind: added / removed / changed (doodads), addedEvent / removedEvent / changedEvent.
    restoreHistoryItem(item) {
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const exec = (apply, revert) => DocsDoodads.Undo.execute({ type: 'restore_history', apply: () => { apply(); this.afterDoodadEdit(); }, revert: () => { revert(); this.afterDoodadEdit(); } });
        if (item.kind === 'removed') {
            const copy = JSON.parse(JSON.stringify(item.backup));
            exec(() => list.push(copy), () => { const i = list.indexOf(copy); if (i >= 0) list.splice(i, 1); });
        } else if (item.kind === 'changed') {
            const now = JSON.parse(JSON.stringify(item.current)), then = JSON.parse(JSON.stringify(item.backup));
            exec(() => this.restoreDoodad(item.current, then), () => this.restoreDoodad(item.current, now));
        } else if (item.kind === 'added') {
            const at = list.indexOf(item.current);
            exec(() => { const i = list.indexOf(item.current); if (i >= 0) list.splice(i, 1); }, () => { if (!list.includes(item.current)) list.splice(Math.max(0, at), 0, item.current); });
        } else {
            const staged = DocsDoodads.Persistence.stagedFor(mapId);
            if (!staged) return;
            const ev = item.kind === 'addedEvent' ? item.current : item.backup;
            const before = staged.events[ev.id] ? JSON.parse(JSON.stringify(staged.events[ev.id])) : undefined;
            const after = item.kind === 'addedEvent' ? undefined : JSON.parse(JSON.stringify(item.backup));
            const write = value => {
                if (value) staged.events[ev.id] = JSON.parse(JSON.stringify(value));
                else delete staged.events[ev.id];
                DocsDoodads.Persistence.dirtyMap = true;
            };
            DocsDoodads.Undo.execute({ type: 'restore_event', apply: () => write(after), revert: () => write(before) });
        }
    },

    showHistoryPanel() {
        const existing = document.getElementById('dd-history');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-history';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 340px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        document.body.appendChild(panel);
        this._historyPanel = panel;
        this.refreshHistoryPanel();
    },

    refreshHistoryPanel() {
        const panel = this._historyPanel;
        if (!panel) return;
        const backups = this.historyBackups();
        const diff = this._historyDiff;
        const item = (kind, label, color, i) => `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 11px;">
                <span style="color: ${color}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(label)}</span>
                <button class="dd-btn dd-hist-restore" data-kind="${kind}" data-index="${i}" style="padding: 1px 6px; font-size: 10px;">Restore</button>
            </div>`;
        const name = d => String(d.bit ? d.bit[1] : '').split('/').pop() + ` @ ${Math.round(d.x)},${Math.round(d.y)}`;
        let body = '<div style="font-size: 11px; color: #94a3b8;">Pick a backup to see what changed on this map since then. Changes are outlined on the map: green new, amber changed, red deleted.</div>';
        if (diff && diff.doodads) {
            const d = diff.doodads;
            body = `<div style="font-size: 11px; color: #cbd5e1;">Doodads on this map: ${d.added.length} new, ${d.changed.length} changed, ${d.removed.length} deleted, ${d.unchanged} the same.</div>` +
                d.removed.map((x, i) => item('removed', 'Deleted: ' + name(x), '#f87171', i)).join('') +
                d.changed.map((x, i) => item('changed', 'Changed: ' + name(x.current), '#fbbf24', i)).join('') +
                d.added.map((x, i) => item('added', 'New: ' + name(x), '#4ade80', i)).join('');
        } else if (diff && diff.events) {
            const e = diff.events;
            const ev = x => `EV${String(x.id).padStart(3, '0')} "${x.name || ''}"`;
            body = `<div style="font-size: 11px; color: #cbd5e1;">Events on this map: ${e.added.length} new, ${e.changed.length} changed, ${e.removed.length} deleted, ${e.unchanged} the same.</div>` +
                e.removed.map((x, i) => item('removedEvent', 'Deleted: ' + ev(x), '#f87171', i)).join('') +
                e.changed.map((x, i) => item('changedEvent', 'Changed: ' + ev(x.current), '#fbbf24', i)).join('') +
                e.added.map((x, i) => item('addedEvent', 'New: ' + ev(x), '#4ade80', i)).join('');
        }
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; color: #60a5fa; font-size: 14px;">SAVE HISTORY</div>
                <button class="dd-btn" id="dd-hist-close">Close</button>
            </div>
            <select id="dd-hist-pick" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 3px; border-radius: 4px; font-size: 11px;">
                <option value="">Choose a backup...</option>
                ${backups.map((b, i) => `<option value="${i}" ${diff && diff.backup.path === b.path ? 'selected' : ''}>${escapeHtml(DocsDoodads.History.backupLabel(b))} - ${b.kind === 'map' ? 'events' : 'doodads'}</option>`).join('')}
            </select>
            ${backups.length ? '' : '<div style="font-size: 11px; color: #94a3b8;">No backups yet. Each save keeps one.</div>'}
            <div style="display: flex; flex-direction: column; gap: 4px;">${body}</div>
            <div style="font-size: 10px; color: #64748b;">Restores are undoable. Event restores are saved with Save Changes.</div>`;
        const byId = id => document.getElementById(id);
        byId('dd-hist-close').onclick = () => { this._historyDiff = null; if (panel.parentNode) panel.parentNode.removeChild(panel); this._historyPanel = null; };
        byId('dd-hist-pick').onchange = e => {
            const b = backups[parseInt(e.target.value, 10)];
            this._historyDiff = b ? this.loadHistoryDiff(b) : null;
            this.refreshHistoryPanel();
        };
        panel.querySelectorAll('.dd-hist-restore').forEach(btn => {
            btn.onclick = () => {
                const kind = btn.dataset.kind, i = parseInt(btn.dataset.index, 10);
                const source = diff.doodads || diff.events;
                const group = kind.replace('Event', '');
                const entry = source[group][i];
                const payload = group === 'changed' ? { kind, current: entry.current, backup: entry.backup } : group === 'added' ? { kind, current: entry } : { kind, backup: entry };
                this.restoreHistoryItem(payload);
                this._historyDiff = this.loadHistoryDiff(diff.backup);
                this.refreshHistoryPanel();
            };
        });
    },

    // Outlines for the history overlay, in screen pixels.
    historyOverlayRects() {
        const diff = this._historyDiff;
        if (!diff || !diff.doodads) return [];
        const rect = d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1), h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const at = DocsDoodads.mapToScreen(d.x, d.y);
            return { x: at.x - (d.anchorX !== undefined ? d.anchorX : 0.5) * w, y: at.y - (d.anchorY !== undefined ? d.anchorY : 1) * h, w, h };
        };
        return diff.doodads.added.map(d => Object.assign(rect(d), { color: 0x4ade80 }))
            .concat(diff.doodads.changed.map(c => Object.assign(rect(c.backup), { color: 0xfbbf24 })))
            .concat(diff.doodads.removed.map(d => Object.assign(rect(d), { color: 0xf87171 })));
    },

    // ---- Ctrl+K command palette ----
    paletteCommands() {
        const D = DocsDoodads;
        const out = [];
        const add = (label, run, group) => out.push({ label, run, group: group || 'Command' });
        add('Save Changes', () => D.Persistence.saveAll());
        add('Undo', () => D.Undo.undo());
        add('Redo', () => D.Undo.redo());
        add('Toggle Grid', () => this.toggleGrid());
        add('Open Post FX', () => this.showPostFxBuilder());
        add('Open VFX Builder', () => this.showVfxBuilder());
        add('Open Asset Tools', () => this.showAssetTools());
        add('Open Save History', () => this.showHistoryPanel());
        add('Open World View', () => this.showWorldView());
        add('Export Map Image', () => this.exportMapImage({ scale: 1, includeCharacters: true, includeEffects: true }));
        add('Dress This Map', () => {
            const n = this.dressMap();
            this.showToast(n ? `Dressed the map with ${n} prop(s).` : 'Nothing to add: check the rules have art and matching tiles.', n ? 'success' : 'info');
        });
        add('Clear Map Dressing', () => this.showToast(`Removed ${this.clearDressing()} dressed prop(s).`, 'info'));
        add('Tool: Eyedropper', () => this.setPlacementTool('eyedropper'));
        add('Tool: Stamp', () => this.setPlacementTool('stamp'));
        add('Tool: Scatter Brush', () => this.setPlacementTool('brush'));
        add('Tool: Biome Brush', () => this.setPlacementTool('biome'));
        add('Tool: Path', () => this.setPlacementTool('path'));
        add('Tool: None (select)', () => this.setPlacementTool(null));
        for (const m of D.Symmetry.modes) add(m.value === 'off' ? 'Symmetry: Off' : 'Symmetry: ' + m.label.replace('Mirror left/right', 'Mirror Left/Right').replace('Mirror top/bottom', 'Mirror Top/Bottom').replace('Mirror four ways', 'Mirror Four Ways'), () => this.setSymmetry(m.value));
        for (const p of D.PostFX.presets) add('Post FX: Apply ' + p.label, () => this.applyPreset('world', p.id), 'Look');
        for (const v of D.Vfx.library().concat(D.Vfx.builtIns)) add('Play VFX: ' + v.name, () => this.previewVfx(v.id), 'VFX');
        for (const l of D.Layers.list(D.Lighting.mapSettings(this.currentMapId()))) add('Layer: ' + l.name, () => { this.activeLayer = l.id; this.showToast(`New doodads go on ${l.name}.`); }, 'Layer');
        for (const m of this.mapEntries()) add(`Go to map: ${m.name}`, () => this.goToMap(m.id), 'Map');
        const assets = D.AssetIndex && D.AssetIndex.list ? D.AssetIndex.list : [];
        for (const a of assets) add('Asset: ' + a.fileName, () => this.selectAsset(a), 'Asset');
        return out;
    },

    showCommandPalette() {
        const existing = document.getElementById('dd-palette');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const commands = this.paletteCommands();
        const panel = document.createElement('div');
        panel.id = 'dd-palette';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 90px; left: 50%; transform: translateX(-50%); width: 520px; max-width: calc(100vw - 32px); padding: 10px; z-index: 10050; display: flex; flex-direction: column; gap: 6px;';
        panel.innerHTML = `
            <input type="text" id="dd-palette-input" placeholder="Type a command, map or asset..." style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #38bdf8; padding: 8px; border-radius: 6px; font-size: 13px;" />
            <div id="dd-palette-list" style="max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 1px;"></div>`;
        document.body.appendChild(panel);
        const input = document.getElementById('dd-palette-input');
        const listEl = document.getElementById('dd-palette-list');
        let results = [], index = 0;
        const close = () => { if (panel.parentNode) panel.parentNode.removeChild(panel); };
        const draw = () => {
            results = DocsDoodads.CommandPalette.rank(input.value, commands, 50);
            index = Math.min(index, Math.max(0, results.length - 1));
            listEl.innerHTML = results.map((c, i) => `
                <div class="dd-palette-row" data-i="${i}" style="display: flex; justify-content: space-between; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; ${i === index ? 'background: #1e3a5f; color: #fff;' : 'color: #cbd5e1;'}">
                    <span>${escapeHtml(c.label)}</span><span style="color: #64748b; font-size: 10px;">${escapeHtml(c.group)}</span>
                </div>`).join('') || '<div style="font-size: 12px; color: #64748b; padding: 6px;">No matches</div>';
            listEl.querySelectorAll('.dd-palette-row').forEach(row => {
                row.onmousedown = e => { e.preventDefault(); run(parseInt(row.dataset.i, 10)); };
            });
        };
        const run = i => {
            const c = results[i];
            close();
            if (c) {
                try { c.run(); } catch (error) { this.showToast(error.message || String(error), 'error'); }
            }
        };
        input.oninput = () => { index = 0; draw(); };
        input.onkeydown = e => {
            if (e.key === 'ArrowDown') { index = Math.min(results.length - 1, index + 1); draw(); e.preventDefault(); }
            else if (e.key === 'ArrowUp') { index = Math.max(0, index - 1); draw(); e.preventDefault(); }
            else if (e.key === 'Enter') { run(index); e.preventDefault(); }
            else if (e.key === 'Escape') { close(); e.preventDefault(); }
            e.stopPropagation();
        };
        input.onblur = () => setTimeout(close, 150);
        draw();
        input.focus();
    },

    // ---- Animated drawer thumbnails ----
    attachThumbAnimation(card, imgEl, asset) {
        const frames = DocsDoodads.AnimatedThumb.framesFor(asset);
        if (!frames || typeof Image === 'undefined') return;
        let timer = null, canvas = null;
        card.onmouseenter = () => {
            const img = new Image();
            img.onload = () => {
                if (!card.matches || !card.matches(':hover')) return;
                const box = imgEl.getBoundingClientRect ? imgEl.getBoundingClientRect() : { width: 64, height: 64 };
                const f0 = frames[0];
                const scale = Math.min((box.width || 64) / f0.w, (box.height || 64) / f0.h, 4);
                canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(f0.w * scale));
                canvas.height = Math.max(1, Math.round(f0.h * scale));
                canvas.style.cssText = 'image-rendering: pixelated; max-width: 85%; max-height: 70%;';
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                let i = 0;
                const step = () => {
                    const f = frames[i % frames.length];
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, f.x, f.y, f.w, f.h, 0, 0, canvas.width, canvas.height);
                    i++;
                };
                step();
                timer = setInterval(step, 140);
                imgEl.style.display = 'none';
                card.insertBefore(canvas, imgEl);
            };
            img.src = asset.path;
        };
        card.onmouseleave = () => {
            if (timer) clearInterval(timer);
            timer = null;
            if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
            canvas = null;
            imgEl.style.display = '';
        };
    },

    // The biome brush's list, filled whenever the tool turns on (toolbar or command palette).
    refreshBiomeToolPicker() {
        const pick = document.getElementById('dd-biome-tool-pick');
        const list = DocsDoodads.World.get('biomes.list') || [];
        if (!this.biomeSettings.biomeId && list[0]) this.biomeSettings.biomeId = list[0].id;
        if (pick) pick.innerHTML = list.length
            ? list.map(b => `<option value="${escapeHtml(b.id)}" ${b.id === this.biomeSettings.biomeId ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')
            : '<option value="">(no biomes yet)</option>';
    },

    bindToolbarExtras() {
        const byId = id => document.getElementById(id);
        const biomeBtn = byId('dd-biome-btn');
        if (biomeBtn) biomeBtn.onclick = () => {
            this.setPlacementTool(this.placementTool === 'biome' ? null : 'biome');
            this.showToast(this.placementTool ? 'Biome brush: drag on the map' : 'Biome brush off');
        };
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-biome-tool-pick', 'onchange', e => { this.biomeSettings.biomeId = e.target.value; });
        on('dd-biome-rad', 'oninput', e => { this.biomeSettings.radius = parseFloat(e.target.value) || 96; const v = byId('dd-biome-rad-val'); if (v) v.textContent = e.target.value + 'px'; });
        on('dd-biome-avoid', 'onchange', e => { this.biomeSettings.avoidBlocked = Boolean(e.target.checked); });
        const symPop = byId('dd-sym-popover');
        on('dd-sym-btn', 'onclick', () => {
            if (!symPop) return;
            const open = symPop.style.display !== 'block';
            symPop.style.display = open ? 'block' : 'none';
            if (!open) return;
            const s = this.symmetryFor();
            const gm = window.$gameMap;
            const tw = gm ? gm.tileWidth() : 48, th = gm ? gm.tileHeight() : 48;
            const axes = s.mode === 'off' ? Object.assign({}, s, gm ? DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), tw, th) : {}) : s;
            byId('dd-sym-mode').innerHTML = DocsDoodads.Symmetry.modes.map(m => `<option value="${m.value}" ${m.value === (this.symmetry.mode || 'off') ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('');
            byId('dd-sym-x').value = axes.axisX / tw;
            byId('dd-sym-y').value = axes.axisY / th;
        });
        on('dd-sym-mode', 'onchange', e => this.setSymmetry(e.target.value));
        const axisInput = (id, key, size) => on(id, 'onchange', e => {
            const gm = window.$gameMap;
            this.symmetry = Object.assign({}, this.symmetry, { [key]: (parseFloat(e.target.value) || 0) * (gm ? gm[size]() : 48) });
        });
        axisInput('dd-sym-x', 'axisX', 'tileWidth');
        axisInput('dd-sym-y', 'axisY', 'tileHeight');
        on('dd-sym-center', 'onclick', () => {
            this.symmetry = Object.assign({}, this.symmetry, { axisX: null, axisY: null });
            const s = this.symmetryFor();
            const gm = window.$gameMap;
            if (gm) {
                const axes = DocsDoodads.Symmetry.defaultAxes(gm.width(), gm.height(), gm.tileWidth(), gm.tileHeight());
                byId('dd-sym-x').value = axes.axisX / gm.tileWidth();
                byId('dd-sym-y').value = axes.axisY / gm.tileHeight();
            }
            return s;
        });
    },

    // ---- VFX library (stored in the project's world settings) ----
    vfxLibraryRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('vfx.library') || []));
    },

    newVfx(name) {
        const list = this.vfxLibraryRaw();
        const id = DocsDoodads.Prefabs.newId('vfx_');
        list.push({ id, name: String(name || 'New Effect'), duration: 1, loop: false, layers: [{ type: 'particles', emitter: { preset: 'sparkles' } }] });
        this.setWorldSetting('vfx.library', list);
        return id;
    },

    duplicateVfx(id) {
        const source = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
        if (!source) return null;
        const list = this.vfxLibraryRaw();
        const copy = JSON.parse(JSON.stringify(source));
        copy.id = DocsDoodads.Prefabs.newId('vfx_');
        copy.name = source.name + ' copy';
        list.push(copy);
        this.setWorldSetting('vfx.library', list);
        return copy.id;
    },

    renameVfx(id, name) {
        this.editVfx(id, def => { def.name = String(name || def.name); });
    },

    deleteVfx(id) {
        const list = this.vfxLibraryRaw();
        const index = list.findIndex(d => d.id === id);
        if (index < 0) return false;
        list.splice(index, 1);
        this.setWorldSetting('vfx.library', list);
        return true;
    },

    editVfx(id, mutate) {
        const list = this.vfxLibraryRaw();
        const def = list.find(d => d.id === id);
        if (!def) return false;
        mutate(def);
        this.setWorldSetting('vfx.library', list);
        return true;
    },

    addVfxLayer(id, type) {
        this.editVfx(id, def => {
            def.layers = def.layers || [];
            def.layers.push(type === 'sheet' ? { type: 'sheet', image: '', cols: 5, rows: 1, fps: 15 } : { type: 'particles', emitter: { preset: 'sparkles' } });
        });
    },

    removeVfxLayer(id, index) {
        this.editVfx(id, def => { (def.layers || []).splice(index, 1); });
    },

    // The effect with every layer's emitter filled in, for showing current values.
    vfxView(def) {
        const view = DocsDoodads.Vfx.normalize(def);
        view.layers = view.layers.map(l => (l.type === 'particles' ? Object.assign({}, l, { emitter: DocsDoodads.Particles.normalize(l.emitter) }) : l));
        return view;
    },

    getVfxValue(id, path) {
        const def = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
        if (!def) return undefined;
        return String(path).split('.').reduce((node, key) => (node === undefined || node === null ? undefined : node[key]), this.vfxView(def));
    },

    // path like "layers.0.emitter.rate" or "layers.0.emitter.size.1"; missing parts are filled from current values.
    setVfxField(id, path, value) {
        return this.editVfx(id, def => {
            const view = this.vfxView(def);
            const keys = String(path).split('.');
            let node = def, shown = view;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (node[key] === undefined || node[key] === null) node[key] = JSON.parse(JSON.stringify(shown ? shown[key] : {}));
                node = node[key];
                shown = shown ? shown[key] : undefined;
            }
            node[keys[keys.length - 1]] = value;
        });
    },

    previewVfx(id) {
        let x = 0, y = 0;
        if (typeof $gamePlayer !== 'undefined' && $gamePlayer && window.$gameMap) {
            x = ($gamePlayer._realX + 0.5) * $gameMap.tileWidth();
            y = ($gamePlayer._realY + 0.5) * $gameMap.tileHeight();
        }
        return DocsDoodads.Vfx.play({ id, x, y });
    },

    vfxLayerFields(layer) {
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        const select = (key, label, options) => ({ key, label, type: 'select', options });
        const P = DocsDoodads.Particles;
        const common = [number('start', 'Starts after (s)', 0.1), number('offsetX', 'Offset X'), number('offsetY', 'Offset Y')];
        if (layer.type === 'sheet') {
            return [
                { key: 'image', label: 'Image (e.g. img/animations/Fire1.png)', type: 'text' },
                number('cols', 'Columns'), number('rows', 'Rows'), number('frames', 'Frames used'),
                range('fps', 'Frames per second', 1, 60, 1), { key: 'loop', label: 'Loop', type: 'checkbox' },
                range('scale', 'Scale', 0.1, 4, 0.05), range('rotation', 'Rotation', -180, 180, 1),
                select('blend', 'Blend', P.blends.map(b => ({ value: b, label: b }))), { key: 'tint', label: 'Tint', type: 'color' },
                range('alpha', 'Opacity', 0, 1, 0.05)
            ].concat(common);
        }
        const e = key => 'emitter.' + key;
        return [
            select(e('preset'), 'Based on preset', P.presets.map(p => ({ value: p.id, label: p.label }))),
            range(e('rate'), 'Rate (per second)', 0, 200, 1), number(e('burst'), 'Burst at start'),
            number(e('lifetime.0'), 'Life min (s)', 0.1), number(e('lifetime.1'), 'Life max (s)', 0.1),
            number(e('speed.0'), 'Speed min'), number(e('speed.1'), 'Speed max'),
            range(e('angle'), 'Direction (degrees, -90 = up)', -180, 180, 1), range(e('spread'), 'Spread', 0, 360, 1),
            number(e('gravity'), 'Gravity'), number(e('wind'), 'Wind'),
            number(e('size.0'), 'Size start'), number(e('size.1'), 'Size end'),
            range(e('alpha.0'), 'Opacity start', 0, 1, 0.05), range(e('alpha.1'), 'Opacity end', 0, 1, 0.05),
            { key: e('colorStart'), label: 'Colour start', type: 'color' }, { key: e('colorEnd'), label: 'Colour end', type: 'color' },
            select(e('blend'), 'Blend', P.blends.map(b => ({ value: b, label: b }))),
            select(e('shape'), 'Shape', P.shapes.map(s => ({ value: s, label: s }))),
            number(e('area.0'), 'Spawn area width'), number(e('area.1'), 'Spawn area height'),
            range(e('flutter'), 'Flutter', 0, 60, 1), range(e('twinkle'), 'Twinkle', 0, 1, 0.05),
            range(e('stretch'), 'Stretch along motion', 0, 4, 0.1)
        ].concat(common);
    },

    renderVfxBuilder() {
        const V = DocsDoodads.Vfx;
        const library = V.library();
        const all = library.concat(V.builtIns);
        if (!this.vfxSelected || !V.find(this.vfxSelected, this.vfxLibraryRaw())) this.vfxSelected = all.length ? all[0].id : '';
        const isBuiltIn = !library.some(d => d.id === this.vfxSelected);
        const def = V.find(this.vfxSelected, this.vfxLibraryRaw());
        const selectStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 3px; border-radius: 4px; font-size: 11px;';
        const option = d => `<option value="${escapeHtml(d.id)}" ${d.id === this.vfxSelected ? 'selected' : ''}>${escapeHtml(d.name)}</option>`;
        const view = def ? this.vfxView(def) : null;
        const layers = view ? view.layers.map((layer, i) => {
            const fields = this.vfxLayerFields(layer).map((f, j) => {
                const value = String(f.key).split('.').reduce((n, k) => (n === undefined ? undefined : n[k]), layer);
                return this.fieldHtml(`dd-vfx-l${i}-${j}`, f, value);
            }).join('');
            const title = layer.type === 'sheet' ? `Sprite sheet ${escapeHtml(String(layer.image || '').split('/').pop() || '(no image)')}` : `Particles (${escapeHtml(layer.emitter.preset || 'custom')})`;
            return `
                <details ${this._openVfxLayer === i ? 'open' : ''} id="dd-vfx-sec-${i}" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 5px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">${i + 1}. ${title}</summary>
                    <fieldset ${isBuiltIn ? 'disabled' : ''} style="border: none; padding: 0; margin: 5px 0 0; display: flex; flex-direction: column; gap: 5px;">
                        ${fields}
                        <button class="dd-btn" id="dd-vfx-remove-${i}">Remove Layer</button>
                    </fieldset>
                </details>`;
        }).join('') : '';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; color: #60a5fa; font-size: 14px;">VFX BUILDER</div>
                <button class="dd-btn" id="dd-vfx-close">Close</button>
            </div>
            <select id="dd-vfx-pick" style="${selectStyle}">
                <optgroup label="Project">${library.map(option).join('')}</optgroup>
                <optgroup label="Built-in">${V.builtIns.map(option).join('')}</optgroup>
            </select>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                <button class="dd-btn" id="dd-vfx-new">New</button>
                <button class="dd-btn" id="dd-vfx-dup">Duplicate</button>
                <button class="dd-btn" id="dd-vfx-rename" ${isBuiltIn ? 'disabled' : ''}>Rename</button>
                <button class="dd-btn" id="dd-vfx-delete" ${isBuiltIn ? 'disabled' : ''}>Delete</button>
            </div>
            ${isBuiltIn ? '<div style="font-size: 11px; color: #94a3b8;">Built-in effects are read-only. Duplicate one to change it.</div>' : ''}
            ${view ? `
            <fieldset ${isBuiltIn ? 'disabled' : ''} style="border: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; align-items: end;">
                ${this.fieldHtml('dd-vfx-duration', { label: 'Emits for (s)', type: 'number', step: 0.1 }, view.duration)}
                ${this.fieldHtml('dd-vfx-loop', { label: 'Loop', type: 'checkbox' }, view.loop)}
            </fieldset>
            <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">${layers}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                <button class="dd-btn" id="dd-vfx-add-particles" ${isBuiltIn ? 'disabled' : ''}>+ Particles</button>
                <button class="dd-btn" id="dd-vfx-add-sheet" ${isBuiltIn ? 'disabled' : ''}>+ Sprite Sheet</button>
            </div>` : ''}
            <div style="display: flex; gap: 8px; align-items: center;">
                <button class="dd-btn dd-btn-primary" id="dd-vfx-preview">Preview at Player</button>
                <label style="font-size: 11px; color: #cbd5e1; display: flex; gap: 5px; align-items: center;"><input type="checkbox" id="dd-vfx-autoplay" ${this.vfxAutoPlay !== false ? 'checked' : ''} /> Replay on change</label>
            </div>
            <div style="font-size: 10px; color: #64748b; line-height: 1.4;">Play effects with the "Play VFX" plugin command (by name), or attach one to a doodad in its Particles section.</div>`;
    },

    showVfxBuilder() {
        const existing = document.getElementById('dd-vfx');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-vfx';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 330px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        panel.innerHTML = this.renderVfxBuilder();
        document.body.appendChild(panel);
        this._vfxPanel = panel;
        this.bindVfxBuilder();
    },

    refreshVfxBuilder() {
        if (!this._vfxPanel || !this._vfxPanel.parentNode) return;
        this._vfxPanel.innerHTML = this.renderVfxBuilder();
        this.bindVfxBuilder();
    },

    bindVfxBuilder() {
        const byId = id => document.getElementById(id);
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        const id = this.vfxSelected;
        const changed = () => {
            this.refreshVfxBuilder();
            if (this.vfxAutoPlay !== false) this.previewVfx(id);
        };
        on('dd-vfx-close', 'onclick', () => { if (this._vfxPanel && this._vfxPanel.parentNode) this._vfxPanel.parentNode.removeChild(this._vfxPanel); });
        on('dd-vfx-pick', 'onchange', e => { this.vfxSelected = e.target.value; this._openVfxLayer = null; this.refreshVfxBuilder(); });
        on('dd-vfx-new', 'onclick', () => { this.vfxSelected = this.newVfx('New Effect'); this.refreshVfxBuilder(); });
        on('dd-vfx-dup', 'onclick', () => { const copy = this.duplicateVfx(id); if (copy) this.vfxSelected = copy; this.refreshVfxBuilder(); });
        on('dd-vfx-rename', 'onclick', () => {
            const current = DocsDoodads.Vfx.find(id, this.vfxLibraryRaw());
            const name = prompt('Effect name:', current ? current.name : '');
            if (name) { this.renameVfx(id, name); this.refreshVfxBuilder(); }
        });
        on('dd-vfx-delete', 'onclick', () => { if (this.deleteVfx(id)) { this.vfxSelected = ''; this.refreshVfxBuilder(); } });
        on('dd-vfx-duration', 'onchange', e => { this.setVfxField(id, 'duration', parseFloat(e.target.value) || 1); changed(); });
        on('dd-vfx-loop', 'onchange', e => { this.setVfxField(id, 'loop', Boolean(e.target.checked)); changed(); });
        on('dd-vfx-add-particles', 'onclick', () => { this.addVfxLayer(id, 'particles'); this._openVfxLayer = (this.getVfxValue(id, 'layers') || []).length - 1; changed(); });
        on('dd-vfx-add-sheet', 'onclick', () => { this.addVfxLayer(id, 'sheet'); this._openVfxLayer = (this.getVfxValue(id, 'layers') || []).length - 1; changed(); });
        on('dd-vfx-preview', 'onclick', () => this.previewVfx(id));
        on('dd-vfx-autoplay', 'onchange', e => { this.vfxAutoPlay = Boolean(e.target.checked); });
        const layers = this.getVfxValue(id, 'layers') || [];
        layers.forEach((layer, i) => {
            const details = byId(`dd-vfx-sec-${i}`);
            if (details) details.ontoggle = () => { if (details.open) this._openVfxLayer = i; };
            on(`dd-vfx-remove-${i}`, 'onclick', () => { this.removeVfxLayer(id, i); this._openVfxLayer = null; changed(); });
            this.vfxLayerFields(layer).forEach((f, j) => {
                const input = byId(`dd-vfx-l${i}-${j}`);
                if (!input) return;
                input.onchange = () => {
                    const value = f.type === 'checkbox' ? Boolean(input.checked) : (f.type === 'range' || f.type === 'number') ? (parseFloat(input.value) || 0) : input.value;
                    this._openVfxLayer = i;
                    this.setVfxField(id, `layers.${i}.${f.key}`, value);
                    changed();
                };
            });
        });
    },

    // Background sounds and sound effects in the asset index, as "bgs/Name" and "se/Name".
    audioFileOptions() {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? Object.values(DocsDoodads.AssetIndex.data.assets || {}) : [];
        const pick = folder => assets
            .filter(a => a && new RegExp('^audio/' + folder + '/', 'i').test(a.path || ''))
            .map(a => folder + '/' + a.path.replace(new RegExp('^audio/' + folder + '/', 'i'), '').replace(/\.[^/.]+$/, ''))
            .filter((v, i, all) => all.indexOf(v) === i)
            .sort();
        return pick('bgs').concat(pick('se')).map(v => ({ value: v, label: v }));
    },

    // ---- Map sound: echo and region background sounds ----
    mapRegionSounds() {
        const list = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).regionSounds;
        return JSON.parse(JSON.stringify(Array.isArray(list) ? list : []));
    },

    addRegionSound() {
        const list = this.mapRegionSounds();
        list.push({ regionId: 1, name: '', volume: 90, pitch: 100, fade: 1 });
        this.setMapSetting('regionSounds', list);
    },

    setRegionSoundField(row, field, value) {
        const list = this.mapRegionSounds();
        if (!list[row]) return;
        list[row][field] = value;
        this.setMapSetting('regionSounds', list);
    },

    removeRegionSound(row) {
        const list = this.mapRegionSounds();
        if (!list[row]) return;
        list.splice(row, 1);
        this.setMapSetting('regionSounds', list);
    },

    renderMapSoundPanel(mapSettings) {
        const echo = Object.assign({}, DocsDoodads.SpatialSound.echoDefaults, mapSettings.echo || {});
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const bgs = this.audioFileOptions().filter(o => o.value.indexOf('bgs/') === 0).map(o => o.value.slice(4));
        const rows = (Array.isArray(mapSettings.regionSounds) ? mapSettings.regionSounds : []).map((r, i) => `
            <div style="display: grid; grid-template-columns: 38px 1fr 40px 36px 22px; gap: 3px; align-items: center;">
                <input type="number" min="1" max="255" id="dd-region-${i}-regionId" value="${escapeHtml(String(r.regionId))}" title="Region" style="${inputStyle}" />
                <input type="text" list="dd-bgs-files" id="dd-region-${i}-name" value="${escapeHtml(r.name || '')}" title="Background sound" placeholder="BGS name" style="${inputStyle}" />
                <input type="number" min="0" max="100" id="dd-region-${i}-volume" value="${escapeHtml(String(r.volume))}" title="Volume" style="${inputStyle}" />
                <input type="number" min="0" step="0.5" id="dd-region-${i}-fade" value="${escapeHtml(String(r.fade))}" title="Fade (seconds)" style="${inputStyle}" />
                <button class="dd-btn" id="dd-region-del-${i}" title="Remove" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Sound (this map)</summary>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-echo" ${echo.enabled ? 'checked' : ''} /> Echo (caves, halls)</label>
                    <div>Delay: ${echo.delay}s <input type="range" id="dd-map-echo-delay" min="0.05" max="1" step="0.01" value="${echo.delay}" style="width: 100%;" /></div>
                    <div>Repeats: ${echo.feedback} <input type="range" id="dd-map-echo-feedback" min="0" max="0.9" step="0.05" value="${echo.feedback}" style="width: 100%;" /></div>
                    <div>Echo volume: ${echo.mix} <input type="range" id="dd-map-echo-mix" min="0" max="1" step="0.05" value="${echo.mix}" style="width: 100%;" /></div>
                    <div style="margin-top: 4px;">Background sound by region (region, BGS, volume, fade s):</div>
                    ${rows}
                    <datalist id="dd-bgs-files">${bgs.map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
                    <button class="dd-btn" id="dd-region-add">Add Region Sound</button>
                </div>
            </details>`;
    },

    bindMapSoundPanel(mapSettings) {
        const echo = () => Object.assign({}, DocsDoodads.SpatialSound.echoDefaults, (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).echo || {});
        const byId = id => document.getElementById(id);
        const toggle = byId('dd-map-echo');
        if (toggle) toggle.onchange = () => this.setMapSetting('echo', Object.assign(echo(), { enabled: Boolean(toggle.checked) }));
        for (const field of ['delay', 'feedback', 'mix']) {
            const input = byId('dd-map-echo-' + field);
            if (input) input.onchange = () => { this.setMapSetting('echo', Object.assign(echo(), { [field]: parseFloat(input.value) || 0 })); this.refreshInspector(); };
        }
        const list = Array.isArray(mapSettings.regionSounds) ? mapSettings.regionSounds : [];
        list.forEach((r, i) => {
            for (const field of ['regionId', 'name', 'volume', 'fade']) {
                const input = byId(`dd-region-${i}-${field}`);
                if (input) input.onchange = () => this.setRegionSoundField(i, field, field === 'name' ? input.value.trim() : Math.max(0, parseFloat(input.value) || 0));
            }
            const del = byId(`dd-region-del-${i}`);
            if (del) del.onclick = () => { this.removeRegionSound(i); this.refreshInspector(); };
        });
        const add = byId('dd-region-add');
        if (add) add.onclick = () => { this.addRegionSound(); this.refreshInspector(); };
    },

    // ---- Character animation sets ----
    characterFileNames() {
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data ? Object.values(DocsDoodads.AssetIndex.data.assets || {}) : [];
        return assets.filter(a => a && /^img\/characters\//i.test(a.path || '') && /\.png$/i.test(a.path))
            .map(a => a.path.replace(/^img\/characters\//i, '').replace(/\.png$/i, '')).sort();
    },

    animationSetsRaw() {
        return JSON.parse(JSON.stringify(DocsDoodads.World.get('characterAnim.sets') || []));
    },

    addAnimationSet(characterName) {
        const name = String(characterName || '').trim();
        if (!name) return;
        const sets = this.animationSetsRaw();
        const found = DocsDoodads.CharacterAnim.autoDetect(name, this.characterFileNames());
        sets.push(Object.assign(found, { idleDelay: 90, idleFps: 6, runFps: 12 }));
        this.setWorldSetting('characterAnim.sets', sets);
    },

    // One step: a set for every sheet that has _idle or _run variants beside it.
    addDetectedAnimationSets() {
        const files = this.characterFileNames();
        const sets = this.animationSetsRaw();
        const have = new Set(sets.map(s => s.character));
        let added = 0;
        for (const name of files) {
            const base = DocsDoodads.CharacterAnim.parseName(name).base;
            if (/_(idle|run)$/i.test(base) || have.has(name)) continue;
            const found = DocsDoodads.CharacterAnim.autoDetect(name, files);
            if (!found.idle && !found.run) continue;
            sets.push(Object.assign(found, { idleDelay: 90, idleFps: 6, runFps: 12 }));
            added++;
        }
        if (added) this.setWorldSetting('characterAnim.sets', sets);
        return added;
    },

    setAnimationSetField(row, field, value) {
        const sets = this.animationSetsRaw();
        if (!sets[row]) return;
        sets[row][field] = value;
        this.setWorldSetting('characterAnim.sets', sets);
    },

    removeAnimationSet(row) {
        const sets = this.animationSetsRaw();
        if (!sets[row]) return;
        sets.splice(row, 1);
        this.setWorldSetting('characterAnim.sets', sets);
    },

    renderAnimSetEditor() {
        const sets = DocsDoodads.World.get('characterAnim.sets') || [];
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const cell = (r, field, value, type) => `<input type="${type || 'text'}" ${type ? '' : 'list="dd-char-files"'} id="dd-anim-${r}-${field}" value="${escapeHtml(String(value === undefined ? '' : value))}" title="${field}" style="${inputStyle}" />`;
        const rows = sets.map((s, r) => `
            <div style="border: 1px solid #334155; border-radius: 4px; padding: 4px; display: grid; grid-template-columns: 1fr 1fr 1fr 22px; gap: 3px; align-items: center;">
                ${cell(r, 'character', s.character)}${cell(r, 'idle', s.idle)}${cell(r, 'run', s.run)}
                <button class="dd-btn" id="dd-anim-del-${r}" title="Remove" style="padding: 0 4px;">&times;</button>
                <span style="font-size: 9px; color: #64748b;">idle after / idle fps / run fps</span>
                ${cell(r, 'idleDelay', s.idleDelay, 'number')}${cell(r, 'idleFps', s.idleFps, 'number')}${cell(r, 'runFps', s.runFps, 'number')}
            </div>`).join('');
        return `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.4;">Sheet names set the layout: <b>[f8]</b> = 8 frames per row, <b>[d1]</b> = one row (mirrored for left), <b>[d8]</b> = 8 direction rows. Name variants <b>Name_idle</b> and <b>Name_run</b> and they are found automatically.</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 22px; gap: 3px; font-size: 9px; color: #64748b;"><span>Character</span><span>Idle sheet</span><span>Run sheet</span><span></span></div>
            ${rows}
            <datalist id="dd-char-files">${this.characterFileNames().map(n => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px;">
                <input type="text" list="dd-char-files" id="dd-anim-new" placeholder="Character sheet name" style="${inputStyle}" />
                <button class="dd-btn" id="dd-anim-add">Add</button>
            </div>
            <button class="dd-btn" id="dd-anim-detect">Add All Detected</button>`;
    },

    bindAnimSetEditor() {
        const sets = DocsDoodads.World.get('characterAnim.sets') || [];
        sets.forEach((s, r) => {
            for (const field of ['character', 'idle', 'run', 'idleDelay', 'idleFps', 'runFps']) {
                const input = document.getElementById(`dd-anim-${r}-${field}`);
                if (!input) continue;
                input.onchange = () => this.setAnimationSetField(r, field, ['idleDelay', 'idleFps', 'runFps'].includes(field) ? Math.max(0, parseFloat(input.value) || 0) : input.value.trim());
            }
            const del = document.getElementById(`dd-anim-del-${r}`);
            if (del) del.onclick = () => { this.removeAnimationSet(r); this.refreshInspector(); };
        });
        const add = document.getElementById('dd-anim-add');
        if (add) add.onclick = () => { this.addAnimationSet(document.getElementById('dd-anim-new').value); this.refreshInspector(); };
        const detect = document.getElementById('dd-anim-detect');
        if (detect) detect.onclick = () => {
            const n = this.addDetectedAnimationSets();
            this.showToast(n ? `Added ${n} animation set(s).` : 'No _idle or _run sheets found beside your characters.', n ? 'success' : 'info');
            this.refreshInspector();
        };
    },

    // ---- Visual equipment try-on and notetag builder ----
    visualItems() {
        const out = [];
        const add = (list, kind) => (list || []).forEach(item => {
            if (item && /<\s*visual/i.test(item.note || '')) out.push({ key: kind + item.id, kind, id: item.id, name: item.name || `${kind} ${item.id}`, note: item.note });
        });
        add(typeof $dataWeapons !== 'undefined' ? $dataWeapons : null, 'w');
        add(typeof $dataArmors !== 'undefined' ? $dataArmors : null, 'a');
        return out;
    },

    // The items an actor starts with or (in a running game) has on.
    visualWornKeys(actorId) {
        const game = typeof $gameActors !== 'undefined' && $gameActors ? $gameActors.actor(actorId) : null;
        if (game && typeof game.equips === 'function') {
            return game.equips().filter(Boolean).map(e => (DataManager.isWeapon(e) ? 'w' : 'a') + e.id);
        }
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[actorId] : null;
        return ((data && data.equips) || []).map((id, slot) => (id > 0 ? (slot === 0 ? 'w' : 'a') + id : null)).filter(Boolean);
    },

    visualTryOnLayers(actorId, keys) {
        const VE = DocsDoodads.VisualEquip;
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[actorId] : null;
        const cls = data && typeof $dataClasses !== 'undefined' && $dataClasses ? $dataClasses[data.classId] : null;
        const items = this.visualItems();
        const game = typeof $gameActors !== 'undefined' && $gameActors ? $gameActors.actor(actorId) : null;
        const v = (game && game._docsVisual) || {};
        return VE.resolve({
            actorNote: [data && data.note, cls && cls.note].filter(Boolean).join('\n'),
            equipNotes: items.filter(i => (keys || []).includes(i.key)).map(i => i.note).concat(v.notes || []),
            alias: v.alias || '',
            colors: v.colors || null
        }, VE.env());
    },

    visualNotetag(spec) {
        const image = String(spec.image || '').trim();
        if (!image) return '';
        const bits = [image];
        const z = Number(spec.z);
        if (Number.isFinite(z) && z !== 1) bits.push('z ' + z);
        if (String(spec.up === undefined ? '' : spec.up).trim() !== '' && Number.isFinite(Number(spec.up))) bits.push('up ' + Number(spec.up));
        if (String(spec.part || '').trim()) bits.push('part ' + String(spec.part).trim());
        if (String(spec.sv || '').trim()) bits.push('sv ' + String(spec.sv).trim());
        const tags = [`<visual: ${bits.join(', ')}>`];
        const hides = String(spec.hide || '').split(',').map(h => h.trim()).filter(Boolean);
        if (hides.length) tags.push(`<visual hide: ${hides.join(', ')}>`);
        return tags.join('\n');
    },

    renderVisualTryOn() {
        const actors = (typeof $dataActors !== 'undefined' && $dataActors ? $dataActors : []).filter(a => a && a.name);
        const t = this._veTry = this._veTry || { actorId: actors[0] ? actors[0].id : 0, dir: 2, keys: null };
        if (t.keys === null) t.keys = this.visualWornKeys(t.actorId);
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const items = this.visualItems();
        const rows = items.map(i => `<label style="display: flex; gap: 6px; align-items: center; font-size: 10px; color: #cbd5e1;">
                <input type="checkbox" id="dd-ve-item-${escapeHtml(i.key)}" ${t.keys.includes(i.key) ? 'checked' : ''} /> <span title="${i.kind === 'w' ? 'Weapon' : 'Armor'} ${i.id}">${escapeHtml(i.name)}</span></label>`).join('');
        const layers = this.visualTryOnLayers(t.actorId, t.keys);
        const list = layers.map(l => `${escapeHtml(l.image)} <span style="color: #64748b;">z ${l.z}${l.hue ? ', hue ' + l.hue : ''}${l.tint !== null ? ', tint #' + ('000000' + l.tint.toString(16)).slice(-6) : ''}</span>`).join('<br>');
        return `
            <div style="font-size: 10px; color: #94a3b8; line-height: 1.4;">Tag weapons and armors with <b>&lt;visual: Sheet, z 1, part clothes&gt;</b>. Negative z draws behind the body. An item with the same part as the body's base part replaces it (armor over a shirt). Part sheets use the same layout as the body's sheet.</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Try on:</div>
            <select id="dd-ve-actor" style="${inputStyle}">${actors.map(a => `<option value="${a.id}" ${a.id === t.actorId ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}</select>
            <div style="display: grid; grid-template-columns: 96px 1fr; gap: 6px; align-items: start;">
                <div>
                    <canvas id="dd-ve-canvas" width="96" height="96" style="width: 96px; height: 96px; image-rendering: pixelated; background: #0f172a; border: 1px solid #334155; border-radius: 4px;"></canvas>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px;">
                        ${[[4, '&#9664;'], [2, '&#9660;'], [8, '&#9650;'], [6, '&#9654;']].map(([d, s]) => `<button class="dd-btn" id="dd-ve-dir-${d}" style="padding: 0;">${s}</button>`).join('')}
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; max-height: 140px; overflow: auto;">${rows || '<span style="font-size: 10px; color: #64748b;">No weapons or armors have &lt;visual&gt; tags yet.</span>'}</div>
            </div>
            <div id="dd-ve-layers" style="font-size: 10px; color: #cbd5e1;">${list || '<span style="color: #64748b;">No layers.</span>'}</div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">Notetag builder:</div>
            <div style="display: grid; grid-template-columns: 1fr 44px; gap: 3px;">
                <input type="text" list="dd-char-files" id="dd-ve-tag-image" placeholder="Layer sheet" style="${inputStyle}" />
                <input type="number" id="dd-ve-tag-z" value="1" title="Order (negative = behind)" style="${inputStyle}" />
                <input type="text" id="dd-ve-tag-part" placeholder="Part / slot (e.g. clothes, hair)" title="Gear with the same part replaces it" style="${inputStyle}" />
                <input type="number" id="dd-ve-tag-up" placeholder="up" title="Order while facing up (blank = same)" style="${inputStyle}" />
                <input type="text" id="dd-ve-tag-hide" placeholder="Hides parts (e.g. hair)" style="${inputStyle}" />
                <span></span>
                <input type="text" id="dd-ve-tag-sv" placeholder="Side-view sheet (optional)" style="${inputStyle}" />
                <span></span>
            </div>
            <textarea id="dd-ve-tag-out" readonly rows="2" style="${inputStyle} resize: vertical;"></textarea>
            <button class="dd-btn" id="dd-ve-tag-copy">Copy Notetag</button>`;
    },

    bindVisualTryOn() {
        const t = this._veTry;
        if (!t) return;
        const actor = document.getElementById('dd-ve-actor');
        if (actor) actor.onchange = () => {
            t.actorId = Number(actor.value) || 0;
            t.keys = this.visualWornKeys(t.actorId);
            this.refreshInspector();
        };
        for (const item of this.visualItems()) {
            const box = document.getElementById(`dd-ve-item-${item.key}`);
            if (box) box.onchange = () => {
                t.keys = box.checked ? t.keys.concat(item.key) : t.keys.filter(k => k !== item.key);
                this.refreshInspector();
            };
        }
        for (const d of [2, 4, 6, 8]) {
            const b = document.getElementById(`dd-ve-dir-${d}`);
            if (b) b.onclick = () => { t.dir = d; };
        }
        const read = id => (document.getElementById(id) || {}).value || '';
        const out = document.getElementById('dd-ve-tag-out');
        const update = () => {
            if (out) out.value = this.visualNotetag({ image: read('dd-ve-tag-image'), z: read('dd-ve-tag-z'), up: read('dd-ve-tag-up'), part: read('dd-ve-tag-part'), hide: read('dd-ve-tag-hide'), sv: read('dd-ve-tag-sv') });
        };
        for (const id of ['dd-ve-tag-image', 'dd-ve-tag-z', 'dd-ve-tag-up', 'dd-ve-tag-part', 'dd-ve-tag-hide', 'dd-ve-tag-sv']) {
            const input = document.getElementById(id);
            if (input) input.oninput = update;
        }
        const copy = document.getElementById('dd-ve-tag-copy');
        if (copy) copy.onclick = () => {
            if (!out || !out.value) return this.showToast('Choose a layer sheet first.', 'info');
            if (navigator.clipboard) navigator.clipboard.writeText(out.value);
            this.showToast('Notetag copied. Paste it into a weapon or armor note.', 'success');
        };
        this.startVisualPreview();
    },

    // Walks the try-on preview in the chosen direction until the panel closes.
    startVisualPreview() {
        if (this._veTimer) clearInterval(this._veTimer);
        let step = 0;
        const draw = () => {
            const canvas = document.getElementById('dd-ve-canvas');
            if (!canvas || !canvas.isConnected || typeof canvas.getContext !== 'function' || !this._veTry) {
                clearInterval(this._veTimer);
                this._veTimer = null;
                return;
            }
            this.drawVisualPreview(canvas, step++);
        };
        draw();
        this._veTimer = setInterval(draw, 200);
    },

    drawVisualPreview(canvas, step) {
        const VE = DocsDoodads.VisualEquip, C = DocsDoodads.CharacterAnim;
        const t = this._veTry;
        const data = typeof $dataActors !== 'undefined' && $dataActors ? $dataActors[t.actorId] : null;
        const ctx = canvas.getContext('2d');
        if (!ctx || typeof ImageManager === 'undefined') return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        const layers = this.visualTryOnLayers(t.actorId, t.keys);
        const body = data && data.characterName ? { image: data.characterName, index: data.characterIndex, hue: 0, tint: null } : null;
        const z = l => VE.zFor(l, t.dir);
        const byZ = list => list.slice().sort((a, b) => z(a) - z(b));
        const sheets = byZ(layers.filter(l => z(l) < 0)).concat(body ? [body] : [], byZ(layers.filter(l => z(l) >= 0)));
        for (const sheet of sheets) {
            const bitmap = VE.windowBitmap(sheet, null);
            if (!bitmap) continue;
            const layout = C.parseName(sheet.image);
            const row = C.rowFor(t.dir, layout.dirs);
            const rect = VE.frameRect(sheet.image, bitmap.width, bitmap.height,
                sheet.index !== null && sheet.index !== undefined ? sheet.index : (data ? data.characterIndex : 0), C.walkFrame(step, layout.frames), row.row);
            const zoom = Math.min(2, canvas.width / rect.w, canvas.height / rect.h);
            const w = rect.w * zoom, h = rect.h * zoom;
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height - (canvas.height - h) / 2);
            if (row.mirror) ctx.scale(-1, 1);
            ctx.drawImage(bitmap.canvas, rect.x, rect.y, rect.w, rect.h, -w / 2, -h, w, h);
            ctx.restore();
        }
    },

    // ---- Post-processing builder ----
    storedLook(target) {
        if (target === 'map') {
            const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
            if (mine && mine.look) return mine.look;
        }
        return DocsDoodads.World.get('postfx.look');
    },

    getLookValue(target, key) {
        const look = DocsDoodads.PostFX.normalizeLook(this.storedLook(target));
        const [id, field] = key.split('.');
        return look[id] ? look[id][field] : undefined;
    },

    lookWith(target, key, value) {
        const look = DocsDoodads.PostFX.normalizeLook(this.storedLook(target));
        const [id, field] = key.split('.');
        if (look[id]) look[id][field] = value;
        return look;
    },

    writeLook(target, look, previous) {
        if (target === 'map') {
            const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx || {};
            this.setMapSetting('postfx', Object.assign({}, mine, { mode: 'custom', look }), previous);
        } else {
            this.setWorldSetting('postfx.look', look, previous);
        }
    },

    setLookValue(target, key, value) {
        this.writeLook(target, this.lookWith(target, key, value));
    },

    // Slider drags change the look live; commitLookPreview records one undo step.
    previewLookValue(target, key, value) {
        const look = this.lookWith(target, key, value);
        if (!this._lookPreview) {
            const mapId = this.currentMapId();
            const settings = DocsDoodads.Lighting.mapSettings(mapId);
            this._lookPreview = target === 'map'
                ? { target, before: settings ? JSON.parse(JSON.stringify(settings)) : null }
                : { target, before: { value: DocsDoodads.World.raw('postfx.look') === undefined ? undefined : JSON.parse(JSON.stringify(DocsDoodads.World.raw('postfx.look'))) } };
        }
        if (target === 'map') {
            const mapId = this.currentMapId();
            const settings = Object.assign({}, DocsDoodads.Lighting.mapSettings(mapId) || {});
            settings.postfx = Object.assign({}, settings.postfx || {}, { mode: 'custom', look });
            this.writeMapSettings(mapId, settings);
        } else {
            DocsDoodads.World.set('postfx.look', look);
        }
    },

    commitLookPreview() {
        const preview = this._lookPreview;
        this._lookPreview = null;
        if (!preview) return;
        this.writeLook(preview.target, DocsDoodads.PostFX.normalizeLook(this.storedLook(preview.target)), preview.before);
    },

    applyPreset(target, id) {
        const look = DocsDoodads.PostFX.presetLook(id);
        if (look) this.writeLook(target, look);
    },

    mapPostFxMode() {
        const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
        return mine && mine.mode ? mine.mode : 'global';
    },

    // 'global' (the game-wide look), 'off', or 'custom' (seeded from the game-wide look the first time).
    setMapPostFxMode(mode) {
        const mine = (DocsDoodads.Lighting.mapSettings(this.currentMapId()) || {}).postfx;
        const look = mine && mine.look ? mine.look : (mode === 'custom' ? DocsDoodads.PostFX.normalizeLook(DocsDoodads.World.get('postfx.look')) : null);
        if (mode === 'global' && !look) this.setMapSetting('postfx', undefined);
        else this.setMapSetting('postfx', look ? { mode, look } : { mode });
    },

    setPostFxCompare(on) {
        this.postFxCompare = Boolean(on);
    },

    renderPostFxBuilder() {
        const P = DocsDoodads.PostFX;
        const target = this.postFxTarget === 'map' ? 'map' : 'world';
        const pf = DocsDoodads.World.settings().postfx;
        const mode = this.mapPostFxMode();
        const selectStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 3px; border-radius: 4px; font-size: 11px;';
        const option = (value, label, current) => `<option value="${escapeHtml(String(value))}" ${String(value) === String(current) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
        const check = (id, label, on, title) => `<label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #cbd5e1;" ${title ? `title="${escapeHtml(title)}"` : ''}><input type="checkbox" id="${id}" ${on ? 'checked' : ''} /> ${escapeHtml(label)}</label>`;
        this._openPostFx = this._openPostFx || {};
        const editable = target === 'world' || mode === 'custom';
        const effects = editable ? P.effects.map((effect, i) => {
            const on = this.getLookValue(target, effect.id + '.enabled');
            const fields = [{ key: effect.id + '.enabled', label: 'On', type: 'checkbox' }].concat(effect.params.map(p => Object.assign({ type: 'range' }, p, { key: effect.id + '.' + p.key })));
            return `
                <details id="dd-pfx-sec-${i}" ${this._openPostFx[effect.id] ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 5px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: ${on ? '#4ade80' : '#94a3b8'};">${escapeHtml(effect.label)}${on ? ' &middot; on' : ''}</summary>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px;">
                        ${fields.map((f, j) => this.fieldHtml(`dd-pfx-${i}-${j}`, f, this.getLookValue(target, f.key))).join('')}
                    </div>
                </details>`;
        }).join('') : `<div style="font-size: 11px; color: #94a3b8;">This map ${mode === 'off' ? 'shows no effects' : 'uses the game-wide look'}. Choose "Its own look" to give it a look of its own.</div>`;
        return `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; color: #60a5fa; font-size: 14px;">POST-PROCESSING</div>
                <button class="dd-btn" id="dd-pfx-close">Close</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <div style="font-size: 10px; color: #94a3b8;">Editing
                    <select id="dd-pfx-target" style="${selectStyle}">${option('world', 'Game-wide look', target)}${option('map', 'This map', target)}</select></div>
                <div style="font-size: 10px; color: #94a3b8; ${target === 'map' ? '' : 'visibility: hidden;'}">This map uses
                    <select id="dd-pfx-mapmode" style="${selectStyle}">${option('global', 'The game-wide look', mode)}${option('off', 'No effects', mode)}${option('custom', 'Its own look', mode)}</select></div>
            </div>
            <div style="display: flex; gap: 6px; align-items: flex-end;">
                <div style="flex: 1; font-size: 10px; color: #94a3b8;">Preset
                    <select id="dd-pfx-preset" style="${selectStyle}">${P.presets.map(p => option(p.id, p.label, '')).join('')}</select></div>
                <button class="dd-btn dd-btn-primary" id="dd-pfx-apply" ${editable ? '' : 'disabled'}>Apply</button>
                <button class="dd-btn" id="dd-pfx-compare" title="Hold to see the map without effects">Hold to Compare</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px;">
                ${check('dd-pfx-enabled', 'Post-processing on', pf.enabled, 'Switches every look off for the whole game')}
                ${check('dd-pfx-pictures', 'Affect pictures', pf.includePictures, 'Off: pictures and the timer are drawn without effects')}
                ${check('dd-pfx-preview', 'Show while editing', this.postFxPreview !== false)}
                <div style="font-size: 10px; color: #94a3b8;">Quality <select id="dd-pfx-quality" style="${selectStyle}">${P.qualities.map(q => option(q.value, q.label, pf.quality)).join('')}</select></div>
            </div>
            <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 4px; min-height: 80px;">${effects}</div>
            <div style="border-top: 1px solid rgba(255,255,255,0.12); padding-top: 6px; display: flex; gap: 6px; align-items: flex-end;">
                <div style="flex: 1; font-size: 10px; color: #94a3b8;">Screen effect (test)
                    <select id="dd-pfx-anim" style="${selectStyle}">${P.Animations.types.map(t => option(t.value, t.label, '')).join('')}</select></div>
                <button class="dd-btn" id="dd-pfx-play">Play</button>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.12); padding-top: 6px; display: flex; flex-direction: column; gap: 5px;">
                <div style="font-size: 11px; font-weight: bold; color: #94a3b8;">Export Map Image</div>
                <div style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #cbd5e1;">
                    Scale <select id="dd-pfx-export-scale" style="${selectStyle} width: auto;">${option(1, '100%', 1)}${option(0.5, '50%', 1)}${option(0.25, '25%', 1)}</select>
                    ${check('dd-pfx-export-chars', 'Characters', true)}
                    ${check('dd-pfx-export-fx', 'Lighting & colour', true)}
                </div>
                <button class="dd-btn dd-btn-primary" id="dd-pfx-export" title="Saves the whole map as one PNG in the project's screenshots folder">Export Map Image</button>
            </div>`;
    },

    showPostFxBuilder() {
        const existing = document.getElementById('dd-postfx');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const panel = document.createElement('div');
        panel.id = 'dd-postfx';
        panel.className = 'dd-glass';
        panel.style.cssText = 'position: fixed; top: 64px; right: 12px; width: 330px; max-height: calc(100vh - 90px); padding: 14px; z-index: 10030; display: flex; flex-direction: column; gap: 8px; overflow-y: auto;';
        panel.innerHTML = this.renderPostFxBuilder();
        document.body.appendChild(panel);
        this._postFxPanel = panel;
        this.bindPostFxBuilder();
    },

    refreshPostFxBuilder() {
        const panel = this._postFxPanel;
        if (!panel || !panel.parentNode) return;
        panel.innerHTML = this.renderPostFxBuilder();
        this.bindPostFxBuilder();
    },

    bindPostFxBuilder() {
        const P = DocsDoodads.PostFX;
        const byId = id => document.getElementById(id);
        const target = this.postFxTarget === 'map' ? 'map' : 'world';
        const on = (id, event, handler) => { const node = byId(id); if (node) node[event] = handler; };
        on('dd-pfx-close', 'onclick', () => {
            this.setPostFxCompare(false);
            if (this._postFxPanel && this._postFxPanel.parentNode) this._postFxPanel.parentNode.removeChild(this._postFxPanel);
        });
        on('dd-pfx-target', 'onchange', e => { this.postFxTarget = e.target.value; this.refreshPostFxBuilder(); });
        on('dd-pfx-mapmode', 'onchange', e => { this.setMapPostFxMode(e.target.value); this.refreshPostFxBuilder(); });
        on('dd-pfx-apply', 'onclick', () => { this.applyPreset(target, byId('dd-pfx-preset').value); this.refreshPostFxBuilder(); });
        const compare = byId('dd-pfx-compare');
        if (compare) {
            compare.onmousedown = () => this.setPostFxCompare(true);
            compare.onmouseup = compare.onmouseleave = () => this.setPostFxCompare(false);
        }
        on('dd-pfx-enabled', 'onchange', e => this.setWorldSetting('postfx.enabled', Boolean(e.target.checked)));
        on('dd-pfx-pictures', 'onchange', e => this.setWorldSetting('postfx.includePictures', Boolean(e.target.checked)));
        on('dd-pfx-preview', 'onchange', e => { this.postFxPreview = Boolean(e.target.checked); });
        on('dd-pfx-quality', 'onchange', e => this.setWorldSetting('postfx.quality', e.target.value));
        on('dd-pfx-play', 'onclick', () => {
            const center = typeof $gamePlayer !== 'undefined' ? P.screenCenterOf($gamePlayer) : [0.5, 0.5];
            P.play({ type: byId('dd-pfx-anim').value, strength: 1, duration: 40, center });
        });
        on('dd-pfx-export', 'onclick', () => {
            this.exportMapImage({
                scale: parseFloat(byId('dd-pfx-export-scale').value) || 1,
                includeCharacters: Boolean(byId('dd-pfx-export-chars').checked),
                includeEffects: Boolean(byId('dd-pfx-export-fx').checked)
            });
        });
        if (target === 'map' && this.mapPostFxMode() !== 'custom') return;
        P.effects.forEach((effect, i) => {
            const details = byId(`dd-pfx-sec-${i}`);
            if (details) details.ontoggle = () => { this._openPostFx[effect.id] = details.open; };
            const fields = [{ key: effect.id + '.enabled', type: 'checkbox' }].concat(effect.params.map(p => Object.assign({ type: 'range' }, p, { key: effect.id + '.' + p.key })));
            fields.forEach((f, j) => {
                const input = byId(`dd-pfx-${i}-${j}`);
                if (!input) return;
                const read = () => (f.type === 'checkbox' ? Boolean(input.checked) : f.type === 'color' ? input.value : parseFloat(input.value) || 0);
                if (f.type === 'range') {
                    const label = byId(`dd-pfx-${i}-${j}-val`);
                    input.oninput = () => {
                        this.previewLookValue(target, f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.previewLookValue(target, f.key, read());
                        this.commitLookPreview();
                    };
                } else {
                    input.onchange = () => {
                        this.setLookValue(target, f.key, read());
                        if (f.key.endsWith('.enabled')) this.refreshPostFxBuilder();
                    };
                }
            });
        });
    },

    exportMapImage(options) {
        const scene = typeof SceneManager !== 'undefined' ? SceneManager._scene : null;
        const spriteset = scene && scene._spriteset;
        if (!spriteset || typeof require === 'undefined') {
            this.showToast('Open a map in Playtest to export it.', 'error');
            return null;
        }
        try {
            const fsMod = require('fs');
            const pathMod = require('path');
            this.showToast('Rendering the map...', 'info');
            const { canvas, plan } = DocsDoodads.MapExport.capture(spriteset, options);
            fsMod.mkdirSync('screenshots', { recursive: true });
            const out = pathMod.join('screenshots', DocsDoodads.MapExport.fileName($gameMap.mapId()));
            fsMod.writeFileSync(out, Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64'));
            this.showToast(`Saved ${plan.width} x ${plan.height} image: ${out}`, 'success');
            try { if (typeof nw !== 'undefined' && nw.Shell) nw.Shell.showItemInFolder(pathMod.resolve(out)); } catch (error) {}
            return out;
        } catch (error) {
            this.showToast(error.message || String(error), 'error');
            return null;
        }
    },

    addSeasonSet() {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        sets.push({});
        this.setWorldSetting('seasons.sets', sets);
        return sets.length - 1;
    },

    setSeasonCell(row, season, path) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (!sets[row]) return;
        const value = DocsDoodads.Seasons.normalize(path).trim();
        if (value) sets[row][season] = value;
        else delete sets[row][season];
        this.setWorldSetting('seasons.sets', sets);
    },

    removeSeasonSet(row) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (!sets[row]) return;
        sets.splice(row, 1);
        this.setWorldSetting('seasons.sets', sets);
    },

    // One undo step: put an asset into a season cell, optionally in a new row.
    addAssetToSeasons(path, season, row) {
        const sets = JSON.parse(JSON.stringify(DocsDoodads.World.get('seasons.sets') || []));
        if (row === 'new' || !sets[row]) {
            sets.push({});
            row = sets.length - 1;
        }
        sets[row][season] = DocsDoodads.Seasons.normalize(path);
        this.setWorldSetting('seasons.sets', sets);
        return row;
    },

    worldSections() {
        const D = DocsDoodads;
        const range = (key, label, min, max, step) => ({ key, label, type: 'range', min, max, step });
        const number = (key, label, step = 1) => ({ key, label, type: 'number', step });
        const check = (key, label) => ({ key, label, type: 'checkbox' });
        const select = (key, label, options) => ({ key, label, type: 'select', options });
        return [
            { title: 'Day and Night', extra: 'keyframes', fields: [
                select('time.source', 'Clock', D.TimeOfDay.sources),
                number('time.variableId', 'Hour variable (the clock writes it; variable mode reads it)'),
                number('time.minuteVariableId', 'Minute variable (optional)'),
                range('time.minutesPerSecond', 'Game minutes per real second', 0.1, 60, 0.1),
                number('time.startHour', 'Starting hour for new games', 0.5),
                range('time.lampThreshold', 'Lamps switch on at darkness', 0, 1, 0.05)
            ] },
            { title: 'Sun and Shadows', fields: [
                select('sun.source', 'Shadow direction from', D.Sun.sources),
                range('sun.angle', 'Fixed direction (degrees, 0 = up, 90 = right)', 0, 359, 1),
                number('sun.variableId', 'Direction variable (degrees)'),
                check('characterShadows.enabled', 'Characters cast shadows'),
                select('characterShadows.mode', 'Which events', D.CharacterShadow.modes),
                check('characterShadows.includePlayer', 'Include the party'),
                range('characterShadows.opacity', 'Strength', 0, 1, 0.05),
                range('characterShadows.length', 'Length', 0.1, 1.5, 0.05),
                range('characterShadows.blur', 'Softness', 0, 8, 0.5),
                number('characterShadows.offsetX', 'Offset X'),
                number('characterShadows.offsetY', 'Offset Y'),
                { key: 'characterShadows.occlusionRegions', label: 'Stop shadows at regions (roofs, e.g. 5, 6)', type: 'text',
                    format: v => (v || []).join(', '), parse: t => String(t || '').split(/[^0-9]+/).map(Number).filter(n => n > 0) }
            ] },
            { title: 'Seasons', extra: 'seasons', fields: [
                select('seasons.source', 'Current season from', D.Seasons.sources),
                number('seasons.variableId', 'Season variable')
            ] },
            { title: 'Water Reflections', fields: [
                check('reflections.enabled', 'Reflect characters and doodads in water'),
                range('reflections.opacity', 'Strength', 0, 1, 0.05),
                range('reflections.ripple', 'Ripple', 0, 1, 0.05),
                number('reflections.regionId', 'Also treat this region as water (0 = none)'),
                number('reflections.shoreInset', 'Shore margin (px kept clear along the waterline)')
            ] },
            { title: 'See-Through', fields: [
                check('seeThrough.enabled', 'Reveal the player behind tall doodads'),
                select('seeThrough.mode', 'How', D.SeeThrough.modes),
                range('seeThrough.opacity', 'Faded opacity', 0.05, 1, 0.05),
                range('seeThrough.speed', 'Fade speed', 0.02, 0.5, 0.02),
                { key: 'seeThrough.silhouetteColor', label: 'Outline colour', type: 'color' }
            ] },
            { title: 'Characters', extra: 'animsets', fields: [
                check('characterAnim.diagonal', 'Diagonal movement (8 directions)')
            ] },
            { title: 'Visual Equipment', extra: 'visual', fields: [
                check('visualEquip.enabled', 'Draw gear layers from <visual> notetags'),
                check('visualEquip.followers', 'On followers'),
                check('visualEquip.events', 'On events with <visual> tags'),
                check('visualEquip.battlers', 'On side-view battlers (layers with an sv sheet)'),
                check('visualEquip.menus', 'In menus and save files'),
                check('visualEquip.equipPreview', 'Equip screen shows the highlighted item on the actor')
            ] },
            { title: 'Destination Marker', fields: [
                select('destination.style', 'Marker', D.Destination.styles),
                { key: 'destination.color', label: 'Colour', type: 'color' },
                range('destination.opacity', 'Opacity', 0, 255, 5),
                select('destination.blend', 'Blend', D.Destination.blends),
                range('destination.scale', 'Size (tiles)', 0.25, 3, 0.05),
                select('destination.pulse', 'Pulse', D.Destination.pulses),
                number('destination.spin', 'Spin (degrees per second)', 5),
                number('destination.bob', 'Bob height (pixels)'),
                select('destination.layer', 'Drawn', D.Destination.layers),
                { key: 'destination.image', label: 'Image in img/system (Name[f4] = 4 frames)', type: 'text' },
                number('destination.fps', 'Image frames per second'),
                select('destination.animationId', 'Database animation', [{ value: 0, label: '(none)' }].concat(
                    (typeof $dataAnimations !== 'undefined' && $dataAnimations ? $dataAnimations : []).filter(a => a).map(a => ({ value: a.id, label: `${a.id}: ${a.name || '(unnamed)'}` })))),
                select('destination.vfx', 'VFX effect', [{ value: '', label: '(none)' }].concat(
                    D.Vfx.builtIns.concat(D.Vfx.library()).map(v => ({ value: v.id, label: v.name || v.id })))),
                check('destination.pathDots', 'Dots along the path the player will walk'),
                { key: 'destination.dotColor', label: 'Dot colour', type: 'color' },
                number('destination.dotSpacing', 'Dot every N tiles')
            ] },
            { title: 'Biomes', extra: 'biomes', fields: [] },
            { title: 'Dressing Rules', extra: 'dress', fields: [] },
            { title: 'Spatial Sound', fields: [
                select('sound.mode', 'Event sounds heard from where they happen', D.SpatialSound.modes),
                number('sound.near', 'Full volume within (tiles)', 0.5),
                number('sound.far', 'Silent beyond (tiles)', 0.5),
                number('sound.panWidth', 'Full left/right at (tiles)', 0.5),
                range('sound.pitchVariance', 'Pitch variation (%)', 0, 30, 1),
                range('sound.volumeVariance', 'Volume variation (%)', 0, 50, 1)
            ] },
            { title: 'Motion Blur', fields: [
                check('motionBlur.enabled', 'Blur moving characters (players can turn it off in Options)'),
                select('motionBlur.mode', 'Who', D.MotionBlur.modes),
                range('motionBlur.strength', 'Strength', 0.1, 3, 0.1)
            ] }
        ];
    },

    renderWorldSections() {
        const World = DocsDoodads.World;
        this._openWorldSections = this._openWorldSections || {};
        return this.worldSections().map((section, si) => {
            const fields = section.fields.map((f, fi) => {
                const raw = World.get(f.key);
                return this.fieldHtml(`dd-world-${si}-${fi}`, f, f.format ? f.format(raw) : raw);
            }).join('');
            const extra = section.extra === 'keyframes' ? this.renderKeyframeEditor() : section.extra === 'seasons' ? this.renderSeasonEditor()
                : section.extra === 'animsets' ? this.renderAnimSetEditor() : section.extra === 'visual' ? this.renderVisualTryOn()
                : section.extra === 'biomes' ? this.renderBiomeEditor() : section.extra === 'dress' ? this.renderDressEditor() : '';
            return `
                <details id="dd-world-sec-${si}" ${this._openWorldSections[section.title] ? 'open' : ''} style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                    <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">${section.title}</summary>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px;">All maps</div>
                    <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 6px;">${fields}${extra}</div>
                </details>`;
        }).join('');
    },

    bindWorldSections() {
        const World = DocsDoodads.World;
        this.worldSections().forEach((section, si) => {
            const details = document.getElementById(`dd-world-sec-${si}`);
            if (details) details.ontoggle = () => { this._openWorldSections[section.title] = details.open; };
            section.fields.forEach((f, fi) => {
                const input = document.getElementById(`dd-world-${si}-${fi}`);
                if (!input) return;
                const read = () => {
                    if (f.type === 'checkbox') return Boolean(input.checked);
                    if (f.type === 'range' || f.type === 'number') return parseFloat(input.value) || 0;
                    return f.parse ? f.parse(input.value) : input.value;
                };
                if (f.type === 'range') {
                    let previous = null;
                    const label = document.getElementById(`dd-world-${si}-${fi}-val`);
                    input.oninput = () => {
                        if (!previous) previous = { value: World.raw(f.key) === undefined ? undefined : JSON.parse(JSON.stringify(World.raw(f.key))) };
                        World.set(f.key, read());
                        if (label) label.textContent = String(read());
                    };
                    input.onchange = () => {
                        this.setWorldSetting(f.key, read(), previous || undefined);
                        previous = null;
                    };
                } else {
                    input.onchange = () => {
                        this.setWorldSetting(f.key, read());
                        // Season names label the season checkboxes and columns.
                        if (f.key === 'seasons.source' || f.key === 'time.source') this.refreshInspector();
                    };
                }
            });
        });
        this.bindKeyframeEditor();
        this.bindSeasonEditor();
        this.bindAnimSetEditor();
        this.bindVisualTryOn();
        this.bindBiomeEditor();
        this.bindDressEditor();
    },

    renderKeyframeEditor() {
        const Time = DocsDoodads.TimeOfDay;
        const keys = DocsDoodads.World.get('time.keyframes') || [];
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 11px;';
        const rows = keys.map((k, i) => `
            <div style="display: grid; grid-template-columns: 48px 1fr 34px 24px; gap: 4px; align-items: center;">
                <input type="number" id="dd-kf-hour-${i}" min="0" max="23.75" step="0.25" value="${escapeHtml(String(k.hour))}" title="Hour" style="${inputStyle}" />
                <input type="range" id="dd-kf-dark-${i}" min="0" max="1" step="0.05" value="${escapeHtml(String(k.darkness))}" title="Darkness" />
                <input type="color" id="dd-kf-color-${i}" value="${escapeHtml(k.color || '#000000')}" title="Colour" style="width: 100%; height: 20px; background: #0f172a; border: 1px solid #334155;" />
                <button class="dd-btn" id="dd-kf-del-${i}" title="Remove this keyframe" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        const preview = this.previewMinutes !== null && this.previewMinutes !== undefined ? this.previewMinutes : 12 * 60;
        return `
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Darkness through the day (hour, darkness, colour):</div>
            ${rows}
            <button class="dd-btn" id="dd-kf-add">Add Keyframe</button>
            <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                <input type="checkbox" id="dd-time-preview-on" ${this.previewMinutes !== null && this.previewMinutes !== undefined ? 'checked' : ''} /> Preview a time while editing</label>
            <div style="font-size: 10px; color: #94a3b8;">Preview: <span id="dd-time-preview-val" style="color: #e2e8f0;">${Time.format(preview)}</span>
                <input type="range" id="dd-time-preview" min="0" max="1425" step="15" value="${preview}" style="width: 100%;" /></div>`;
    },

    bindKeyframeEditor() {
        const World = DocsDoodads.World;
        const current = () => JSON.parse(JSON.stringify(World.get('time.keyframes') || []));
        const commit = (next, previous) => this.setWorldSetting('time.keyframes', next, previous);
        current().forEach((k, i) => {
            const hour = document.getElementById(`dd-kf-hour-${i}`);
            if (hour) hour.onchange = () => {
                const next = current();
                next[i].hour = Math.max(0, Math.min(23.75, parseFloat(hour.value) || 0));
                commit(next);
            };
            const dark = document.getElementById(`dd-kf-dark-${i}`);
            if (dark) {
                let previous = null;
                dark.oninput = () => {
                    if (!previous) previous = { value: World.raw('time.keyframes') === undefined ? undefined : JSON.parse(JSON.stringify(World.raw('time.keyframes'))) };
                    const next = current();
                    next[i].darkness = parseFloat(dark.value) || 0;
                    World.set('time.keyframes', next);
                };
                dark.onchange = () => {
                    const next = current();
                    next[i].darkness = parseFloat(dark.value) || 0;
                    commit(next, previous || undefined);
                    previous = null;
                };
            }
            const color = document.getElementById(`dd-kf-color-${i}`);
            if (color) color.onchange = () => {
                const next = current();
                next[i].color = color.value;
                commit(next);
            };
            const del = document.getElementById(`dd-kf-del-${i}`);
            if (del) del.onclick = () => {
                const next = current();
                next.splice(i, 1);
                commit(next);
                this.refreshInspector();
            };
        });
        const add = document.getElementById('dd-kf-add');
        if (add) add.onclick = () => {
            commit(current().concat([{ hour: 12, darkness: 0, color: '#ffffff' }]));
            this.refreshInspector();
        };
        const toggle = document.getElementById('dd-time-preview-on');
        const slider = document.getElementById('dd-time-preview');
        const label = document.getElementById('dd-time-preview-val');
        if (toggle && slider) {
            toggle.onchange = () => { this.previewMinutes = toggle.checked ? (parseInt(slider.value, 10) || 0) : null; };
            slider.oninput = () => {
                const minutes = parseInt(slider.value, 10) || 0;
                if (label) label.textContent = DocsDoodads.TimeOfDay.format(minutes);
                if (toggle.checked) this.previewMinutes = minutes;
            };
        }
    },

    renderSeasonEditor() {
        const seasons = DocsDoodads.World.settings().seasons;
        const inputStyle = 'width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 1px 3px; border-radius: 3px; font-size: 10px;';
        const names = seasons.names.map((name, k) => `<input type="text" id="dd-season-name-${k}" value="${escapeHtml(name)}" style="${inputStyle}" />`).join('');
        const cols = `grid-template-columns: repeat(${seasons.names.length}, 1fr) 22px;`;
        const rows = seasons.sets.map((set, r) => `
            <div style="display: grid; ${cols} gap: 3px; align-items: center;">
                ${seasons.names.map((name, k) => `<input type="text" list="dd-season-assets" id="dd-season-cell-${r}-${k}" placeholder="${escapeHtml(name)}" title="${escapeHtml(name)}: ${escapeHtml(set[k] || '(unchanged)')}" value="${escapeHtml(set[k] || '')}" style="${inputStyle}" />`).join('')}
                <button class="dd-btn" id="dd-season-del-${r}" title="Remove this row" style="padding: 0 4px;">&times;</button>
            </div>`).join('');
        const assets = DocsDoodads.AssetIndex && DocsDoodads.AssetIndex.data && DocsDoodads.AssetIndex.data.assets
            ? Object.values(DocsDoodads.AssetIndex.data.assets).filter(a => a && a.path && /\.png$/i.test(a.path)).slice(0, 2000) : [];
        const preview = this.previewSeason !== null && this.previewSeason !== undefined ? this.previewSeason : -1;
        return `
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Season names:</div>
            <div style="display: grid; grid-template-columns: repeat(${seasons.names.length}, 1fr); gap: 3px;">${names}</div>
            <div style="font-size: 10px; color: #94a3b8;">Art swaps (each row is one prop; empty cells keep the original). Tip: select an asset and use "Season Variant".</div>
            ${rows}
            <datalist id="dd-season-assets">${assets.map(a => `<option value="${escapeHtml(a.path)}"></option>`).join('')}</datalist>
            <button class="dd-btn" id="dd-season-add">Add Row</button>
            <div style="font-size: 10px; color: #94a3b8;">Preview while editing
                <select id="dd-season-preview" style="${inputStyle}">
                    <option value="-1" ${preview < 0 ? 'selected' : ''}>As in the game</option>
                    ${seasons.names.map((name, k) => `<option value="${k}" ${preview === k ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
                </select></div>`;
    },

    bindSeasonEditor() {
        const seasons = DocsDoodads.World.settings().seasons;
        seasons.names.forEach((name, k) => {
            const input = document.getElementById(`dd-season-name-${k}`);
            if (input) input.onchange = () => {
                const names = DocsDoodads.World.get('seasons.names').slice();
                names[k] = input.value.trim() || name;
                this.setWorldSetting('seasons.names', names);
            };
        });
        seasons.sets.forEach((set, r) => {
            seasons.names.forEach((name, k) => {
                const input = document.getElementById(`dd-season-cell-${r}-${k}`);
                if (input) input.onchange = () => this.setSeasonCell(r, k, input.value);
            });
            const del = document.getElementById(`dd-season-del-${r}`);
            if (del) del.onclick = () => {
                this.removeSeasonSet(r);
                this.refreshInspector();
            };
        });
        const add = document.getElementById('dd-season-add');
        if (add) add.onclick = () => {
            this.addSeasonSet();
            this.refreshInspector();
        };
        const preview = document.getElementById('dd-season-preview');
        if (preview) preview.onchange = () => {
            const value = parseInt(preview.value, 10);
            this.previewSeason = value >= 0 ? value : null;
        };
    },

    renderAssetSeasonControl(a) {
        if (!a || !a.path || !/\.png$/i.test(a.path)) return '';
        const seasons = DocsDoodads.World.settings().seasons;
        const selectStyle = 'flex: 1; min-width: 0; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 3px; border-radius: 4px; font-size: 11px;';
        const rowLabel = (set, r) => {
            const first = Object.keys(set || {}).map(k => set[k])[0];
            return `Row ${r + 1}${first ? ' (' + String(first).split('/').pop() + ')' : ''}`;
        };
        return `
            <div style="margin-top: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Season Variant:</label>
                <div style="display: flex; gap: 4px;">
                    <select id="dd-asset-season" style="${selectStyle}">${seasons.names.map((n, k) => `<option value="${k}">${escapeHtml(n)}</option>`).join('')}</select>
                    <select id="dd-asset-season-row" style="${selectStyle}"><option value="new">New row</option>${seasons.sets.map((set, r) => `<option value="${r}">${escapeHtml(rowLabel(set, r))}</option>`).join('')}</select>
                    <button class="dd-btn" id="dd-asset-season-add" title="Use this image for that season in the season table">Add</button>
                </div>
            </div>`;
    },

    bindAssetSeasonControl(a) {
        const button = document.getElementById('dd-asset-season-add');
        if (!button) return;
        button.onclick = () => {
            const season = parseInt(document.getElementById('dd-asset-season').value, 10) || 0;
            const rowValue = document.getElementById('dd-asset-season-row').value;
            const row = this.addAssetToSeasons(a.path, season, rowValue === 'new' ? 'new' : parseInt(rowValue, 10));
            const name = DocsDoodads.World.settings().seasons.names[season] || 'that season';
            this.showToast(`Added as the ${name} art in season row ${row + 1}.`, 'success');
            this.refreshInspector();
        };
    },

    renderMapPanel(content) {
        const mapId = this.currentMapId();
        const ambient = Object.assign({}, DocsDoodads.Lighting.ambientDefaults, (DocsDoodads.Lighting.mapSettings(mapId) || {}).ambient);
        const mapSettings = DocsDoodads.Lighting.mapSettings(mapId) || {};
        content.innerHTML = `
            <div style="font-weight: bold; color: #38bdf8; margin-bottom: 6px;">MAP ${mapId} SETTINGS</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">Select an asset in the drawer or click an object on the map.</div>
            <details open style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Lighting</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <div>Ambient Darkness: <span id="dd-map-dark-val" style="color: #e2e8f0;">${Math.round(ambient.darkness * 100)}%</span>
                        <input type="range" id="dd-map-dark" min="0" max="1" step="0.05" value="${ambient.darkness}" style="width: 100%;" /></div>
                    <div>Ambient Color <input type="color" id="dd-map-color" value="${escapeHtml(ambient.color)}" style="width: 100%; height: 22px; background: #0f172a; border: 1px solid #334155;" /></div>
                    <div>Only while switch # is ON (0 = always)
                        <input type="number" id="dd-map-switch" min="0" value="${Number(ambient.switchId) || 0}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;" /></div>
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-preview" ${this.lightingPreview === false ? '' : 'checked'} /> Preview lighting while editing</label>
                    <div>Day and night on this map
                        <select id="dd-map-daynight" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px 4px;">
                            ${DocsDoodads.TimeOfDay.mapModes.map(m => `<option value="${m.value}" ${(mapSettings.dayNight || 'auto') === m.value ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('')}
                        </select></div>
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-reflections" ${mapSettings.reflections === false ? '' : 'checked'} /> Water reflections on this map</label>
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1; font-size: 11px;">
                        <input type="checkbox" id="dd-map-charshadows" ${mapSettings.characterShadows === false ? '' : 'checked'} /> Character shadows on this map</label>
                    <div style="color: #64748b; line-height: 1.4;">Give doodads a Light in their inspector. The "Set Ambient Light" plugin command changes darkness during play.</div>
                </div>
            </details>
            ${this.renderMapSoundPanel(mapSettings)}
            ${this.renderLayersPanel(mapSettings)}
            ${this.renderWorldSections()}
            ${this.renderMapNavigation()}
            ${this.renderPackingPanel()}`;

        const read = () => ({
            darkness: parseFloat(document.getElementById('dd-map-dark').value) || 0,
            color: document.getElementById('dd-map-color').value || ambient.color,
            switchId: Math.max(0, parseInt(document.getElementById('dd-map-switch').value, 10) || 0)
        });
        let previewBefore;
        const darkInput = document.getElementById('dd-map-dark');
        darkInput.oninput = () => {
            if (previewBefore === undefined) {
                const current = DocsDoodads.Lighting.mapSettings(mapId);
                previewBefore = current ? JSON.parse(JSON.stringify(current)) : null;
            }
            DocsDoodads.Lighting.setMapSettings(mapId, { ambient: read() });
            const label = document.getElementById('dd-map-dark-val');
            if (label) label.textContent = Math.round(read().darkness * 100) + '%';
        };
        darkInput.onchange = () => {
            this.setMapAmbient(read(), previewBefore);
            previewBefore = undefined;
        };
        document.getElementById('dd-map-color').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-switch').onchange = () => this.setMapAmbient(read());
        document.getElementById('dd-map-preview').onchange = (e) => { this.lightingPreview = Boolean(e.target.checked); };
        document.getElementById('dd-map-daynight').onchange = (e) => this.setMapSetting('dayNight', e.target.value === 'auto' ? undefined : e.target.value);
        document.getElementById('dd-map-reflections').onchange = (e) => this.setMapSetting('reflections', e.target.checked ? undefined : false);
        document.getElementById('dd-map-charshadows').onchange = (e) => this.setMapSetting('characterShadows', e.target.checked ? undefined : false);
        this.bindMapSoundPanel(mapSettings);
        this.bindLayersPanel(mapSettings);
        this.bindWorldSections();
        this.bindMapNavigation();
        this.bindPackingPanel();
    },

    // ---- Collision traced from the art ----
    loadPixels(path) {
        return new Promise((resolve, reject) => {
            if (typeof Image === 'undefined' || typeof document === 'undefined') return reject(new Error('Images cannot be read here.'));
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({ data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height });
            };
            img.onerror = () => reject(new Error(`Could not load ${path}`));
            img.src = path;
        });
    },

    async traceCollision(items, loader = (path) => this.loadPixels(path)) {
        const targets = (items || []).filter(d => d && d.bit && d.bit[0] === 3 && !d.locked);
        if (targets.length === 0) return 0;
        const before = this.snapshotDoodads(targets);
        const cache = {};
        let traced = 0;
        for (const d of targets) {
            try {
                const path = d.bit[1];
                const px = cache[path] || (cache[path] = await loader(path));
                const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height, {
                    frame: { x: d.frameX || 0, y: d.frameY || 0, w: d.frameW || px.width, h: d.frameH || px.height }
                });
                if (shape) {
                    d.collision = { preset: 'custom', shape };
                    traced++;
                }
            } catch (error) {
                DocsDoodads.Core.log('Collision tracing failed', error);
            }
        }
        if (traced > 0) this.recordDoodadEdit(targets, before, 'trace_collision');
        this.showToast(traced > 0 ? `Traced collision for ${traced} doodad(s) from their art.` : 'No solid footprint found in the art; collision unchanged.');
        if (traced > 0) this.refreshInspector();
        return traced;
    },

    // Saves the traced footprint on the library asset so every new placement starts with it.
    async traceAssetCollision(asset, loader = (path) => this.loadPixels(path)) {
        try {
            const px = await loader(asset.path);
            const shape = DocsDoodads.Collision.footprintFromAlpha(px.data, px.width, px.height);
            if (!shape) {
                this.showToast('No solid footprint found in the art.');
                return null;
            }
            asset.collision = { preset: 'custom', shape };
            DocsDoodads.AssetIndex.save();
            this.showToast(`Collision traced for ${asset.fileName}; new placements will use it.`);
            this.refreshInspector();
            return shape;
        } catch (error) {
            this.showToast(`Could not trace collision: ${error.message || error}`);
            return null;
        }
    },

    // A new doodad for an asset (library entry or drag payload) at a map position.
    newDoodadFromAsset(asset, x, y) {
        const d = DocsDoodads.standardStruct();
        d.bit = [3, asset.path];
        d.x = x;
        d.y = y;
        // Drag payloads carry frameW/frameH; library assets carry width/height.
        d.frameW = asset.frameW || asset.width || 48;
        d.frameH = asset.frameH || asset.height || 48;
        const preferredDepth = (asset.placement && asset.placement.depth) || asset.depth;
        d.depth = DocsDoodads.Depth.modes.includes(preferredDepth) ? preferredDepth : DocsDoodads.Depth.suggestFor(asset);
        const collision = asset.collision || {};
        d.collision = { preset: collision.preset || "none", shape: collision.shape ? JSON.parse(JSON.stringify(collision.shape)) : null };
        DocsDoodads.MapLinks.ensureUid(d);
        if (this.activeLayer && this.activeLayer !== 'main') d.layer = this.activeLayer;
        return d;
    },

    // ---- Prefab drawer entries and panels ----
    prefabAssets() {
        return DocsDoodads.Prefabs.ensureLoaded().map(p => ({
            id: `prefab:${p.id}:${p.updatedAt || p.createdAt || 0}`,
            prefabId: p.id,
            path: p.thumbnail || '',
            fileName: p.name,
            category: 'Prefabs',
            type: 'prefab',
            width: 0, height: 0,
            tags: [], autoTags: ['prefab'],
            favorite: false,
            placement: { defaultMode: 'doodad' },
            collision: { preset: 'none' },
            slice: null
        }));
    },

    renamePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return;
        const name = prompt('Prefab name:', prefab.name);
        if (!name || !name.trim()) return;
        prefab.name = name.trim();
        prefab.updatedAt = Date.now();
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    deletePrefab(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab || !confirm(`Delete prefab "${prefab.name}"? Copies already placed stay on the map.`)) return;
        DocsDoodads.Prefabs.remove(prefabId);
        DocsDoodads.Prefabs.save();
        this.selectedAsset = null;
        this.refreshDrawerCards();
        this.refreshInspector();
    },

    placePrefabAtPlayer(prefabId) {
        if (!window.$gamePlayer || !window.$gameMap) return;
        this.placePrefab(DocsDoodads.Prefabs.get(prefabId), this.snapToTile({ x: 0, y: 0, tileX: $gamePlayer.x, tileY: $gamePlayer.y }));
    },

    prefabMenuItems(asset) {
        return [
            { label: 'Place at Player', icon: '📌', onClick: () => this.placePrefabAtPlayer(asset.prefabId) },
            { label: 'Rename...', icon: '✏️', onClick: () => this.renamePrefab(asset.prefabId) },
            { separator: true },
            { label: 'Delete Prefab', icon: '🗑️', danger: true, onClick: () => this.deletePrefab(asset.prefabId) }
        ];
    },

    renderPrefabInspector(content, a) {
        const prefab = DocsDoodads.Prefabs.get(a.prefabId);
        if (!prefab) {
            content.innerHTML = 'This prefab no longer exists.';
            return;
        }
        const copies = Object.keys(window.$dataDocsDoodads || {}).reduce((n, key) => {
            const list = window.$dataDocsDoodads[key];
            if (!Array.isArray(list)) return n;
            return n + new Set(list.filter(d => d && d.prefabRef && d.prefabRef.id === prefab.id).map(d => d.prefabRef.instance)).size;
        }, 0);
        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(prefab.name)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Prefab &middot; ${prefab.doodads.length} doodad(s), ${prefab.events.length} event(s)</div>
            <div style="font-size: 11px; margin-bottom: 8px;">Placed copies: <span style="color: #60a5fa;">${copies}</span></div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-bottom: 8px;">Drag onto the map, or use Stamp and click. Copies are grouped; select one and use "Update Prefab" to change the master, then "Sync All Copies".</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="dd-btn dd-btn-primary" id="dd-prefab-place">Place at Player</button>
                <button class="dd-btn" id="dd-prefab-sync">Sync All Copies (${copies})</button>
                <button class="dd-btn" id="dd-prefab-rename">Rename</button>
                <button class="dd-btn" id="dd-prefab-delete" style="background: #991b1b;">Delete Prefab</button>
            </div>`;
        document.getElementById('dd-prefab-place').onclick = () => this.placePrefabAtPlayer(prefab.id);
        document.getElementById('dd-prefab-sync').onclick = () => { this.syncPrefabInstances(prefab.id); this.refreshInspector(); };
        document.getElementById('dd-prefab-rename').onclick = () => this.renamePrefab(prefab.id);
        document.getElementById('dd-prefab-delete').onclick = () => this.deletePrefab(prefab.id);
    },

    // Prefab, copy/move-to-map and prefab-instance actions shown above the effect sections.
    renderSelectionTools(items) {
        const instance = items.length > 0 && items[0].prefabRef ? items[0] : null;
        const prefab = instance ? DocsDoodads.Prefabs.get(instance.prefabRef.id) : null;
        const mirror = items.find(d => d.mirrorOf);
        return `
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 8px;">
                ${mirror ? `<div style="font-size: 10px; color: #f59e0b; margin-bottom: 6px;">Mirrored from map ${escapeHtml(String(mirror.mirrorOf.mapId))}; it is replaced when that map mirrors its edges again.</div>` : ''}
                ${prefab ? `
                <div style="font-size: 10px; color: #a78bfa; margin-bottom: 4px;">Prefab copy: ${escapeHtml(prefab.name)}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; margin-bottom: 6px;">
                    <button class="dd-btn" id="dd-sel-prefab-update" title="Make the master prefab match this copy" style="padding: 4px;">Update Prefab</button>
                    <button class="dd-btn" id="dd-sel-prefab-sync" title="Rebuild every copy from the master" style="padding: 4px;">Sync Copies</button>
                    <button class="dd-btn" id="dd-sel-prefab-detach" title="Stop linking this copy to the prefab" style="padding: 4px;">Detach</button>
                </div>` : ''}
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="dd-btn" id="dd-sel-save-prefab" style="padding: 4px;" title="Save the selection (and events under it) as a reusable prefab">Save Prefab</button>
                    <button class="dd-btn" id="dd-sel-copy-map" style="padding: 4px;">Copy to Map</button>
                    <button class="dd-btn" id="dd-sel-move-map" style="padding: 4px;">Move to Map</button>
                </div>
            </div>`;
    },

    bindSelectionTools(items) {
        const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
        on('dd-sel-save-prefab', () => {
            const name = prompt('Prefab name:', 'Prefab ' + (DocsDoodads.Prefabs.ensureLoaded().length + 1));
            if (!name || !name.trim()) return;
            const events = this.eventsWithin(items);
            const includeEvents = events.length === 0 || confirm(`Include the ${events.length} event(s) under the selection in the prefab?`);
            this.savePrefabFromSelection(name.trim(), includeEvents);
        });
        on('dd-sel-copy-map', () => this.showMapPicker('Copy selection to map', mapId => this.sendDoodadsToMap(items, mapId, 'copy')));
        on('dd-sel-move-map', () => this.showMapPicker('Move selection to map', mapId => { this.sendDoodadsToMap(items, mapId, 'move'); this.refreshInspector(); }));
        on('dd-sel-prefab-update', () => this.updatePrefabFromInstance(items[0]));
        on('dd-sel-prefab-sync', () => { if (items[0].prefabRef) this.syncPrefabInstances(items[0].prefabRef.id); this.refreshInspector(); });
        on('dd-sel-prefab-detach', () => { this.detachPrefabInstance(items[0]); this.refreshInspector(); });
    },

    // ---- Maps: switching, neighbours, picker ----
    mapEntries() {
        const infos = typeof window !== 'undefined' && window.$dataMapInfos ? window.$dataMapInfos : [];
        return infos.filter(Boolean).map(info => ({ id: info.id, name: info.name || `Map ${info.id}` }));
    },

    mapOptions(selected, includeNone) {
        const options = includeNone ? [`<option value="0">(none)</option>`] : [];
        for (const map of this.mapEntries()) {
            options.push(`<option value="${map.id}" ${Number(selected) === map.id ? 'selected' : ''}>${String(map.id).padStart(3, '0')}: ${escapeHtml(map.name)}</option>`);
        }
        return options.join('');
    },

    showMapPicker(title, onPick) {
        const existing = document.getElementById('dd-map-picker');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const modal = document.createElement('div');
        modal.id = 'dd-map-picker';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 340px; padding: 18px; z-index: 10030;';
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 13px; margin-bottom: 10px;">${escapeHtml(title)}</div>
            <select id="dd-map-picker-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; margin-bottom: 12px;">${this.mapOptions(0, false)}</select>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="dd-btn" id="dd-map-picker-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-map-picker-ok">OK</button>
            </div>`;
        document.body.appendChild(modal);
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-map-picker-cancel').onclick = close;
        document.getElementById('dd-map-picker-ok').onclick = () => {
            const mapId = parseInt(document.getElementById('dd-map-picker-select').value, 10);
            close();
            if (mapId) onPick(mapId);
        };
    },

    renderMapNavigation() {
        const neighbors = this.mapNeighbors();
        const side = (name, label) => `<div>${label}<select id="dd-map-nb-${name}" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px;">${this.mapOptions(neighbors[name] || 0, true)}</select></div>`;
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Maps</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <div>Go to map (keeps the editor open):
                        <select id="dd-map-goto" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 2px;">${this.mapOptions(this.currentMapId(), false)}</select>
                        <button class="dd-btn" id="dd-map-goto-btn" style="width: 100%; margin-top: 4px;">Go to Map</button></div>
                    <div style="margin-top: 4px; color: #cbd5e1;">Neighbouring maps (for doodads that cross the edge):</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">${side('north', 'North')}${side('south', 'South')}${side('west', 'West')}${side('east', 'East')}</div>
                    <button class="dd-btn" id="dd-map-mirror" title="Copy doodads hanging over an edge onto the neighbouring map">Mirror Edge Doodads</button>
                    <button class="dd-btn" id="dd-map-world" title="See this map and its linked neighbours together">World View</button>
                </div>
            </details>`;
    },

    bindMapNavigation() {
        const go = document.getElementById('dd-map-goto-btn');
        if (go) go.onclick = () => this.goToMap(parseInt(document.getElementById('dd-map-goto').value, 10));
        for (const name of DocsDoodads.MapLinks.sides) {
            const select = document.getElementById(`dd-map-nb-${name}`);
            if (!select) continue;
            select.onchange = () => {
                const next = {};
                for (const s of DocsDoodads.MapLinks.sides) {
                    const el = document.getElementById(`dd-map-nb-${s}`);
                    next[s] = el ? parseInt(el.value, 10) || 0 : 0;
                }
                this.setMapNeighbors(next);
            };
        }
        const mirror = document.getElementById('dd-map-mirror');
        if (mirror) mirror.onclick = () => this.mirrorEdgeDoodads();
        const world = document.getElementById('dd-map-world');
        if (world) world.onclick = () => this.showWorldView();
    },

    // A scaled overview of this map and its linked neighbours with their doodads; click a map to go there.
    showWorldView() {
        const existing = document.getElementById('dd-world-view');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const current = this.currentMapId();
        const layout = DocsDoodads.MapLinks.layout(current, id => this.mapNeighbors(id), id => this.mapSizeLookup(id), 2);
        if (layout.length === 0) return;
        const names = {};
        for (const m of this.mapEntries()) names[m.id] = m.name;
        const b = DocsDoodads.MapLinks.bounds(layout);
        const width = 720, height = 480;
        const scale = Math.min((width - 20) / (b.right - b.left), (height - 20) / (b.bottom - b.top));
        const toX = x => 10 + (x - b.left) * scale, toY = y => 10 + (y - b.top) * scale;

        const modal = document.createElement('div');
        modal.id = 'dd-world-view';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 16px; z-index: 10030;';
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="font-weight: bold; color: #60a5fa; font-size: 13px;">WORLD VIEW</div>
                <button class="dd-btn" id="dd-world-close">Close</button>
            </div>
            <canvas id="dd-world-canvas" width="${width}" height="${height}" style="background: #0b1120; border: 1px solid #334155; border-radius: 4px; cursor: pointer;"></canvas>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">${layout.length === 1 ? 'No neighbouring maps are linked yet; set them in Maps.' : 'Click a map to go there. Orange doodads cross an edge.'}</div>`;
        document.body.appendChild(modal);
        const canvas = document.getElementById('dd-world-canvas');
        const ctx = canvas.getContext('2d');
        for (const m of layout) {
            ctx.fillStyle = m.mapId === current ? '#1e3a5f' : '#16213a';
            ctx.fillRect(toX(m.x), toY(m.y), m.w * scale, m.h * scale);
            ctx.strokeStyle = m.mapId === current ? '#38bdf8' : '#475569';
            ctx.lineWidth = m.mapId === current ? 2 : 1;
            ctx.strokeRect(toX(m.x), toY(m.y), m.w * scale, m.h * scale);
            for (const d of DocsDoodads.doodads(m.mapId)) {
                if (!d || d.posMode === 0) continue;
                const r = DocsDoodads.Guides.rectOf(d);
                const crosses = r.left < 0 || r.top < 0 || r.right > m.w || r.bottom > m.h;
                ctx.fillStyle = d.mirrorOf ? 'rgba(148,163,184,0.6)' : crosses ? '#f59e0b' : '#22c55e';
                ctx.fillRect(toX(m.x + r.left), toY(m.y + r.top), Math.max(1.5, (r.right - r.left) * scale), Math.max(1.5, (r.bottom - r.top) * scale));
            }
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '11px sans-serif';
            ctx.fillText(`${String(m.mapId).padStart(3, '0')} ${names[m.mapId] || ''}`, toX(m.x) + 4, toY(m.y) + 13);
        }
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-world-close').onclick = close;
        canvas.onclick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const wx = (e.clientX - rect.left - 10) / scale + b.left, wy = (e.clientY - rect.top - 10) / scale + b.top;
            const hit = layout.find(m => wx >= m.x && wx <= m.x + m.w && wy >= m.y && wy <= m.y + m.h);
            if (hit && hit.mapId !== current) {
                close();
                this.goToMap(hit.mapId);
            }
        };
    },

    // Transfers the player; the workspace stays open and picks the new map up in onMapLoaded.
    goToMap(mapId) {
        if (!mapId || !window.$gamePlayer || !window.$gameMap || mapId === this.currentMapId()) return;
        const size = this.mapSizeLookup(mapId);
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const cols = size ? Math.max(1, Math.floor(size.w / tw)) : 1;
        const rows = size ? Math.max(1, Math.floor(size.h / th)) : 1;
        const x = Math.min(cols - 1, Math.max(0, $gamePlayer.x));
        const y = Math.min(rows - 1, Math.max(0, $gamePlayer.y));
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.selectedEvent = null;
        $gamePlayer.reserveTransfer(mapId, x, y, $gamePlayer.direction(), 2);
        this.showToast(`Going to map ${mapId}...`);
    },

    onMapLoaded() {
        if (!this.mounted) return;
        const persistence = DocsDoodads.Persistence;
        if (!persistence.sessionSnapshots[persistence.mapFilePath(this.currentMapId())]) persistence.captureSession();
        this.pathPoints = [];
        this.refreshInspector();
        const status = document.getElementById('dd-status-left');
        if (status) status.textContent = `Doc's Doodads v${pluginVersion} | Map ${this.currentMapId()} | Hold Alt for free placement`;
    },

    // ---- Where-used, unused report, safe rename/move ----
    databaseFiles: ['Actors', 'Enemies', 'Tilesets', 'System', 'CommonEvents', 'Troops'],

    // Fresh copies of everything that can reference a file: map and database files from disk,
    // doodads and prefabs from memory (cloned, so planning a rename never touches live data).
    loadUsageSources() {
        const FS = DocsDoodads.FS;
        const mapInfos = FS.readJson('data/MapInfos.json') || (window.$dataMapInfos || []);
        const maps = {};
        for (const info of mapInfos) {
            if (!info) continue;
            const map = FS.readJson(DocsDoodads.Persistence.mapFilePath(info.id));
            if (map) maps[info.id] = map;
        }
        const database = {};
        for (const name of this.databaseFiles) database[name] = FS.readJson(`data/${name}.json`);
        return {
            mapInfos,
            maps,
            database,
            doodads: JSON.parse(JSON.stringify(window.$dataDocsDoodads || {})),
            prefabs: JSON.parse(JSON.stringify(DocsDoodads.Prefabs.ensureLoaded()))
        };
    },

    refreshUsageIndex() {
        DocsDoodads.Usage.lastIndex = DocsDoodads.Usage.buildIndex(this.loadUsageSources());
        return DocsDoodads.Usage.lastIndex;
    },

    assetUsage(asset) {
        const index = DocsDoodads.Usage.lastIndex || this.refreshUsageIndex();
        return index.get(DocsDoodads.Usage.keyOf(asset.path)) || [];
    },

    // Files that move with an image or sound: atlas metadata, and the other audio format.
    companionFiles(oldPath, newPath) {
        const FS = DocsDoodads.FS;
        const out = [];
        const oldBase = oldPath.replace(/\.[^/.]+$/, ''), newBase = newPath.replace(/\.[^/.]+$/, '');
        const ext = (FS.path.extname(oldPath) || '').toLowerCase();
        const extras = ext === '.ogg' ? ['.m4a'] : ext === '.m4a' ? ['.ogg'] : ['.json'];
        for (const extra of extras) {
            if (FS.existsSync(oldBase + extra)) out.push({ from: oldBase + extra, to: newBase + extra });
        }
        return out;
    },

    // Renames or moves a file and rewrites every reference to it in one transaction. Name
    // references (events, database) only allow renames inside the same folder.
    renameAsset(asset, newPath) {
        const FS = DocsDoodads.FS;
        const persistence = DocsDoodads.Persistence;
        const fail = error => ({ ok: false, error });
        if (!FS.fs || !asset) return fail('Files cannot be renamed here.');
        if (persistence.dirtyDoodads || persistence.dirtyMap || Object.keys(persistence.stagedMaps).length > 0) {
            return fail('Save your changes first, then rename.');
        }
        const oldPath = String(asset.path).replace(/\\/g, '/');
        newPath = String(newPath || '').trim().replace(/\\/g, '/').replace(/^\.\//, '');
        if (!newPath || newPath === oldPath) return fail('Enter a new name or folder.');
        if (!/^(img|audio)\//i.test(newPath) || newPath.split('/').includes('..') || /[<>:"|?*\x00-\x1f]/.test(newPath)) {
            return fail('The new path must stay inside img/ or audio/ and use normal file name characters.');
        }
        if (FS.path.extname(newPath).toLowerCase() !== FS.path.extname(oldPath).toLowerCase()) return fail('Keep the same file extension.');
        if (FS.existsSync(newPath) && newPath.toLowerCase() !== oldPath.toLowerCase()) return fail(`${newPath} already exists.`);

        const sources = this.loadUsageSources();
        const plan = DocsDoodads.Usage.rewrite(sources, oldPath, newPath);
        if (!plan.ok) {
            const where = plan.blocked.slice(0, 3).map(r => r.label).join('; ');
            return fail(`It is referenced by name in ${plan.blocked.length} place(s) (${where}), so it can only be renamed inside ${plan.blocked[0].folder}/.`);
        }

        const entries = [];
        for (const source of plan.changed) {
            if (source.startsWith('map:')) {
                const id = source.slice(4);
                entries.push({ path: persistence.mapFilePath(id), data: sources.maps[id], indent: 2 });
            } else if (source.startsWith('database:')) {
                const name = source.slice(9);
                entries.push({ path: `data/${name}.json`, data: sources.database[name], indent: 0 });
            } else if (source === 'doodads') {
                entries.push({ path: 'data/' + dataFileName, data: sources.doodads, indent: saveMode ? 0 : 2 });
            } else if (source === 'prefabs') {
                entries.push({ path: DocsDoodads.Prefabs.filePath, data: { version: 1, prefabs: sources.prefabs }, indent: 2 });
            }
        }
        // The library entry keeps its tags, favourite, slices and collision under the new id.
        const library = JSON.parse(JSON.stringify(DocsDoodads.AssetIndex.data));
        const oldId = oldPath.toLowerCase(), newId = newPath.toLowerCase();
        const entry = library.assets[oldId] || JSON.parse(JSON.stringify(asset));
        delete library.assets[oldId];
        entry.id = newId;
        entry.path = newPath;
        entry.fileName = newPath.split('/').pop();
        entry.category = DocsDoodads.AssetIndex.detectCategory(newPath);
        library.assets[newId] = entry;
        for (const members of Object.values(library.collections || {})) {
            if (Array.isArray(members)) members.forEach((id, i) => { if (id === oldId) members[i] = newId; });
        }
        entries.push({ path: DocsDoodads.AssetIndex.libraryPath, data: library, indent: 2 });

        // Move the files first: undoing a rename is easy, undoing half-written data is not.
        const moves = [{ from: oldPath, to: newPath }].concat(this.companionFiles(oldPath, newPath));
        const done = [];
        const undoMoves = () => { for (const m of done.reverse()) { try { FS.fs.renameSync(m.to, m.from); } catch (e) {} } };
        try {
            for (const m of moves) {
                FS.mkdirp(FS.path.dirname(m.to));
                FS.fs.renameSync(m.from, m.to);
                done.push(m);
            }
        } catch (error) {
            undoMoves();
            return fail(`Could not move the file: ${error.message || error}`);
        }
        try {
            for (const e of entries) FS.createTimestampedBackup(e.path);
        } catch (error) {
            undoMoves();
            return fail(`Backup failed, nothing was changed: ${error.message || error}`);
        }
        const written = FS.atomicWriteManyJson(entries);
        if (!written.ok) {
            undoMoves();
            return fail(`Could not update the project files (${written.error}); the file was moved back.`);
        }

        // Bring the live game data in line with what is now on disk.
        DocsDoodads.Usage.rewrite({ doodads: window.$dataDocsDoodads || {}, prefabs: DocsDoodads.Prefabs.ensureLoaded() }, oldPath, newPath);
        const mapId = this.currentMapId();
        if (window.$dataMap && plan.changed.includes(`map:${mapId}`)) {
            DocsDoodads.Usage.rewrite({ maps: { [mapId]: window.$dataMap } }, oldPath, newPath);
        }
        for (const name of this.databaseFiles) {
            const live = window['$data' + name];
            if (live && plan.changed.includes(`database:${name}`)) DocsDoodads.Usage.rewrite({ database: { [name]: live } }, oldPath, newPath);
        }
        for (const e of entries) if (/data\/Map\d+\.json$/.test(e.path)) persistence.sessionSnapshots[e.path] = FS.stat(e.path);
        DocsDoodads.AssetIndex.data = library;
        DocsDoodads.AssetIndex.rebuildList();
        DocsDoodads.Thumbnail.invalidate(oldId);
        DocsDoodads.Usage.lastIndex = null;
        if (this.selectedAsset === asset) this.selectedAsset = library.assets[newId];
        this.refreshSpriteset();
        this.refreshDrawerCards();
        this.refreshInspector();
        const changedFiles = entries.map(e => e.path);
        this.showToast(`Renamed to ${entry.fileName}; updated ${plan.count} reference(s) in ${changedFiles.length - 1} file(s).`, 3500);
        return { ok: true, changedFiles, references: plan.count };
    },

    // ---- Fingerprints: duplicates and "more like this" ----
    async computeFingerprints(options = {}) {
        const assets = DocsDoodads.AssetIndex.list.filter(a => a.category !== 'Audio' && /\.(png|jpe?g|webp)$/i.test(a.path || ''));
        const todo = assets.filter(a => !a.fingerprint || a.fingerprint.mtimeMs !== a.mtimeMs);
        const crypto = typeof require !== 'undefined' ? require('crypto') : null;
        let done = 0;
        for (const asset of todo) {
            if (options.token && options.token.cancelled) break;
            try {
                const px = await this.loadPixels(DocsDoodads.LiveReload.urlFor(asset.path));
                const sha1 = crypto && DocsDoodads.FS.fs ? crypto.createHash('sha1').update(DocsDoodads.FS.fs.readFileSync(asset.path)).digest('hex') : null;
                asset.fingerprint = { hash: DocsDoodads.Similarity.hashPixels(px.data, px.width, px.height), sha1, mtimeMs: asset.mtimeMs };
            } catch (error) {
                asset.fingerprint = { hash: null, sha1: null, mtimeMs: asset.mtimeMs };
            }
            done++;
            if (options.onProgress && (done % 10 === 0 || done === todo.length)) options.onProgress(done, todo.length);
            if (done % 20 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }
        if (todo.length > 0) DocsDoodads.AssetIndex.save();
        return assets;
    },

    fingerprintEntries() {
        return DocsDoodads.AssetIndex.list.filter(a => a.fingerprint && a.fingerprint.hash)
            .map(a => ({ id: a.id, hash: a.fingerprint.hash, sha1: a.fingerprint.sha1, asset: a }));
    },

    async showSimilarTo(asset) {
        const status = document.getElementById('dd-status-right');
        await this.computeFingerprints({ onProgress: (n, total) => { if (status) status.textContent = `Fingerprinting ${n}/${total}`; } });
        this.updateIndexStatus();
        const target = DocsDoodads.AssetIndex.data.assets[asset.id];
        if (!target || !target.fingerprint || !target.fingerprint.hash) {
            this.showToast('This image could not be read.');
            return;
        }
        const results = DocsDoodads.Similarity.similarTo(target.fingerprint.hash, this.fingerprintEntries(), 60);
        this.similarResults = results.map(r => r.entry.asset);
        this.similarSource = asset.fileName;
        this.setCategory('Similar');
        this.showToast(`Showing images most like ${asset.fileName}.`);
    },

    setCategory(category) {
        this.currentCategory = category;
        if (category === 'Similar') {
            this.searchQuery = '';
            const input = document.getElementById('dd-search-input');
            if (input) input.value = '';
        }
        const tabs = document.getElementById('dd-category-tabs');
        if (tabs && tabs.querySelectorAll) tabs.querySelectorAll('button').forEach(b => { b.className = 'dd-btn' + (b.dataset && b.dataset.cat === category ? ' dd-btn-primary' : ''); });
        this.refreshDrawerCards();
    },

    // ---- Per-map art packing ----
    async packCurrentMap() {
        const FS = DocsDoodads.FS;
        const Packer = DocsDoodads.Packer;
        const mapId = this.currentMapId();
        const regions = Packer.regionsFor(DocsDoodads.doodads(mapId));
        if (regions.length === 0) {
            this.showToast('This map has no image doodads to pack.');
            return null;
        }
        const packed = Packer.pack(regions.map(r => ({ key: r.key, w: r.rect.w, h: r.rect.h })), { maxSize: 2048, padding: 2 });
        const images = {};
        for (const r of regions) {
            if (!images[r.path]) {
                images[r.path] = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error(`Could not load ${r.path}`));
                    img.src = DocsDoodads.LiveReload.urlFor(r.path);
                });
            }
        }
        const clipped = Packer.clampRegions(regions, p => (images[p] ? { w: images[p].naturalWidth, h: images[p].naturalHeight } : null));
        regions.splice(0, regions.length, ...clipped);
        packed.sheets.length = 0;
        Object.assign(packed, Packer.pack(regions.map(r => ({ key: r.key, w: r.rect.w, h: r.rect.h })), { maxSize: 2048, padding: 2 }));
        this.removePack(mapId, true);
        FS.mkdirp(Packer.sheetDirectory);
        const byKey = new Map(regions.map(r => [r.key, r]));
        const mtimes = {};
        for (const r of regions) { const st = FS.stat(r.path); mtimes[r.path] = st ? st.mtimeMs : 0; }
        const manifest = Packer.buildManifest(mapId, regions, packed, mtimes);
        packed.sheets.forEach((sheet, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = sheet.w;
            canvas.height = sheet.h;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            for (const item of sheet.items) {
                const r = byKey.get(item.key);
                ctx.drawImage(images[r.path], r.rect.x, r.rect.y, r.rect.w, r.rect.h, item.x, item.y, item.w, item.h);
            }
            const base64 = canvas.toDataURL('image/png').split(',')[1];
            FS.fs.writeFileSync(manifest.sheets[i], Buffer.from(base64, 'base64'));
        });
        Packer.data.maps[mapId] = manifest;
        FS.atomicWriteJson(Packer.manifestPath, Packer.data);
        // Browser builds can't check for the manifest file, so the doodads file records that packing is in use.
        if (!window.$dataDocsDoodads.usesPacking) {
            window.$dataDocsDoodads.usesPacking = true;
            DocsDoodads.Persistence.dirtyDoodads = true;
        }
        const skipped = packed.skipped.length ? `; ${packed.skipped.length} image(s) too large stay separate` : '';
        this.showToast(`Packed ${Object.keys(manifest.frames).length} image region(s) into ${manifest.sheets.length} sheet(s)${skipped}.`, 3500);
        this.refreshInspector();
        return manifest;
    },

    removePack(mapId = this.currentMapId(), quiet = false) {
        const FS = DocsDoodads.FS;
        const manifest = DocsDoodads.Packer.forMap(mapId);
        if (!manifest) return false;
        for (const sheet of manifest.sheets) { try { if (FS.existsSync(sheet)) FS.fs.unlinkSync(sheet); } catch (e) {} }
        delete DocsDoodads.Packer.data.maps[mapId];
        FS.atomicWriteJson(DocsDoodads.Packer.manifestPath, DocsDoodads.Packer.data);
        if (!quiet) {
            this.showToast('Removed packed art for this map.');
            this.refreshInspector();
        }
        return true;
    },

    renderPackingPanel() {
        const manifest = DocsDoodads.Packer.forMap(this.currentMapId());
        const stale = manifest ? DocsDoodads.Packer.staleSources(manifest, p => { const st = DocsDoodads.FS.stat(p); return st ? st.mtimeMs : 0; }) : [];
        const status = manifest
            ? `${Object.keys(manifest.frames).length} region(s) in ${manifest.sheets.length} sheet(s), built ${new Date(manifest.builtAt).toLocaleString()}.`
            : 'Not packed. Deployed games load each image separately.';
        return `
            <details style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; margin-top: 6px;">
                <summary style="cursor: pointer; font-size: 11px; font-weight: bold; color: #94a3b8;">Performance</summary>
                <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px; font-size: 10px; color: #94a3b8;">
                    <div>${escapeHtml(status)}</div>
                    ${stale.length ? `<div style="color: #f59e0b;">Out of date: ${escapeHtml(stale.slice(0, 3).join(', '))} changed. Pack again.</div>` : ''}
                    <div style="color: #64748b; line-height: 1.4;">Packing copies the art this map's doodads use into a few sheets in img/doodads/_packed for the deployed game. Playtests keep using the original files.</div>
                    <button class="dd-btn" id="dd-pack-map">${manifest ? 'Pack Again' : 'Pack Map Art'}</button>
                    ${manifest ? '<button class="dd-btn" id="dd-pack-remove">Remove Packed Art</button>' : ''}
                    <label style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;"><input type="checkbox" id="dd-pack-preview" ${DocsDoodads.Packer.previewInTest ? 'checked' : ''} /> Use packed art in this playtest</label>
                </div>
            </details>`;
    },

    bindPackingPanel() {
        const pack = document.getElementById('dd-pack-map');
        if (pack) pack.onclick = () => this.packCurrentMap().catch(error => this.showToast(`Packing failed: ${error.message || error}`));
        const remove = document.getElementById('dd-pack-remove');
        if (remove) remove.onclick = () => this.removePack();
        const preview = document.getElementById('dd-pack-preview');
        if (preview) preview.onchange = (e) => { DocsDoodads.Packer.previewInTest = Boolean(e.target.checked); this.refreshSpriteset(); };
    },

    // ---- Asset Tools: duplicates and unused files ----
    showAssetTools() {
        const existing = document.getElementById('dd-asset-tools');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
        const modal = document.createElement('div');
        modal.id = 'dd-asset-tools';
        modal.className = 'dd-glass';
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 560px; max-height: 80vh; padding: 18px; z-index: 10030; display: flex; flex-direction: column; gap: 10px;';
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; color: #60a5fa; font-size: 14px;">ASSET TOOLS</div>
                <button class="dd-btn" id="dd-tools-close">Close</button>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-tools-dupes" style="flex: 1;">Find Duplicates</button>
                <button class="dd-btn dd-btn-primary" id="dd-tools-unused" style="flex: 1;">Find Unused Files</button>
            </div>
            <div id="dd-tools-status" style="font-size: 11px; color: #94a3b8;">Duplicates compares every image's fingerprint (computed once, then cached). Unused checks maps, events, the database, doodads and prefabs.</div>
            <div id="dd-tools-results" style="overflow-y: auto; font-size: 11px; color: #cbd5e1; display: flex; flex-direction: column; gap: 8px;"></div>`;
        document.body.appendChild(modal);
        const statusEl = document.getElementById('dd-tools-status');
        const resultsEl = document.getElementById('dd-tools-results');
        const row = a => `<div style="display: flex; justify-content: space-between; gap: 8px;"><span>${escapeHtml(a.path)}</span><button class="dd-btn dd-tools-show" data-id="${escapeHtml(a.id)}" style="padding: 1px 6px; font-size: 10px;">Show</button></div>`;
        const bindShow = () => {
            resultsEl.querySelectorAll('.dd-tools-show').forEach(btn => {
                btn.onclick = () => {
                    const asset = DocsDoodads.AssetIndex.data.assets[btn.dataset.id];
                    if (asset) this.selectAsset(asset);
                };
            });
        };
        document.getElementById('dd-tools-close').onclick = () => modal.parentNode && modal.parentNode.removeChild(modal);
        document.getElementById('dd-tools-dupes').onclick = async () => {
            resultsEl.innerHTML = '';
            await this.computeFingerprints({ onProgress: (n, total) => { statusEl.textContent = `Fingerprinting images ${n}/${total}...`; } });
            const entries = this.fingerprintEntries();
            const exact = new Map();
            for (const e of entries) if (e.sha1) { if (!exact.has(e.sha1)) exact.set(e.sha1, []); exact.get(e.sha1).push(e); }
            const exactGroups = [...exact.values()].filter(g => g.length > 1);
            const exactIds = new Set(exactGroups.flat().map(e => e.id));
            const nearGroups = DocsDoodads.Similarity.findDuplicates(entries.filter(e => !exactIds.has(e.id)), 1);
            statusEl.textContent = `${exactGroups.length} group(s) of identical files, ${nearGroups.length} group(s) of near-identical images (from ${entries.length} images).`;
            resultsEl.innerHTML = exactGroups.map(g => `<div style="border: 1px solid #334155; border-radius: 4px; padding: 6px;"><div style="color: #f87171; margin-bottom: 4px;">Identical files</div>${g.map(e => row(e.asset)).join('')}</div>`).join('') +
                nearGroups.map(g => `<div style="border: 1px solid #334155; border-radius: 4px; padding: 6px;"><div style="color: #f59e0b; margin-bottom: 4px;">Near-identical (resized or re-saved)</div>${g.map(e => row(e.asset)).join('')}</div>`).join('');
            bindShow();
        };
        document.getElementById('dd-tools-unused').onclick = () => {
            statusEl.textContent = 'Checking maps, events, database, doodads and prefabs...';
            const index = this.refreshUsageIndex();
            const unused = DocsDoodads.Usage.unusedAssets(DocsDoodads.AssetIndex.list, index);
            statusEl.textContent = `${unused.length} file(s) are not referenced anywhere the editor can see. Plugins and scripts can also load files by name, so check before deleting. Search "used:no" lists them in the drawer.`;
            resultsEl.innerHTML = unused.slice(0, 500).map(row).join('') + (unused.length > 500 ? `<div>...and ${unused.length - 500} more.</div>` : '');
            bindShow();
        };
    },

    renderUsagePanel(a) {
        return `
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px;">
                    <button class="dd-btn" id="dd-asset-usage" style="padding: 4px;" title="List every map, event, database entry, doodad and prefab using this file">Where Used</button>
                    <button class="dd-btn" id="dd-asset-rename" style="padding: 4px;" title="Rename or move the file and update every reference">Rename/Move</button>
                    <button class="dd-btn" id="dd-asset-similar" style="padding: 4px;" title="Show the images that look most like this one">More Like This</button>
                </div>
                <div id="dd-asset-usage-list" style="font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.5;"></div>
            </div>`;
    },

    bindUsagePanel(a) {
        const list = document.getElementById('dd-asset-usage-list');
        document.getElementById('dd-asset-usage').onclick = () => {
            const refs = this.assetUsage(a);
            list.innerHTML = refs.length === 0
                ? 'Not used by any map, event, database entry, doodad or prefab.'
                : `<div style="color: #e2e8f0;">Used in ${refs.length} place(s):</div>` + refs.slice(0, 40).map(r => `<div>• ${escapeHtml(r.label)}</div>`).join('') + (refs.length > 40 ? `<div>...and ${refs.length - 40} more</div>` : '');
        };
        document.getElementById('dd-asset-rename').onclick = () => {
            const target = prompt('New path (rename or move; engine files must stay in their folder):', a.path);
            if (!target || target.trim() === a.path) return;
            const refs = this.assetUsage(a);
            if (!confirm(`Rename ${a.path} to ${target.trim()} and update ${refs.length} reference(s)? Changed files are backed up first. If this project is open in RPG Maker MZ, reload it there afterwards.`)) return;
            const result = this.renameAsset(a, target.trim());
            if (!result.ok) alert(result.error);
        };
        document.getElementById('dd-asset-similar').onclick = () => this.showSimilarTo(a);
    },

    updateIndexStatus(removed) {
        const status = document.getElementById('dd-status-right');
        if (!status) return;
        const count = DocsDoodads.AssetIndex.list.length;
        status.textContent = removed ? `Indexed ${count} assets | ${removed} stale removed` : `Indexed ${count} assets`;
    },

    renderAudioInspector(content, a) {
        const channel = /\/bgm\//i.test(a.path) ? 'BGM' : /\/bgs\//i.test(a.path) ? 'BGS' : /\/me\//i.test(a.path) ? 'ME' : 'SE';
        content.innerHTML = `
            <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${escapeHtml(a.fileName)}</div>
            <div style="font-size: 11px; margin-bottom: 4px;">Category: <span style="color: #60a5fa;">Audio</span> &middot; Channel: <span style="color: #60a5fa;">${channel}</span></div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn dd-btn-primary" id="dd-audio-preview-btn" style="flex: 1;">&#9654; Preview</button>
                <button class="dd-btn" id="dd-audio-stop-btn" style="flex: 1;">&#9632; Stop</button>
            </div>
            <div style="display: flex; gap: 6px; margin: 8px 0;">
                <button class="dd-btn" id="dd-fav-toggle" style="flex: 1;">${a.favorite ? '★ Favorited' : '☆ Favorite'}</button>
            </div>
            <div style="margin-bottom: 8px;">
                <label style="display: block; font-size: 11px; margin-bottom: 3px;">Tags (comma separated):</label>
                <input type="text" id="dd-asset-tags" value="${escapeHtml((a.tags || []).join(', '))}" placeholder="e.g. ambient, door" style="width: 100%; box-sizing: border-box; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 4px; border-radius: 4px;" />
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">Auto: ${escapeHtml((a.autoTags || []).join(', '))}</div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                Drag onto an empty tile to create a sound event, or onto an existing event to add a play command to it.
            </div>
            ${this.renderUsagePanel(a)}
        `;
        this.bindUsagePanel(a);
        document.getElementById('dd-asset-similar').style.display = 'none';
        document.getElementById('dd-audio-preview-btn').onclick = () => {
            DocsDoodads.Audio.playPreview(a);
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = '';
        };
        document.getElementById('dd-audio-stop-btn').onclick = () => {
            DocsDoodads.Audio.stopPreview();
            const stopAll = document.getElementById('dd-stop-audio-btn');
            if (stopAll) stopAll.style.display = 'none';
        };
        document.getElementById('dd-fav-toggle').onclick = () => {
            DocsDoodads.AssetIndex.toggleFavorite(a.id);
            this.refreshInspector();
            this.refreshDrawerCards();
        };
        const tagInput = document.getElementById('dd-asset-tags');
        tagInput.onchange = (e) => {
            DocsDoodads.AssetIndex.setTags(a.id, e.target.value);
            tagInput.value = (a.tags || []).join(', ');
        };
    },

    placeAssetOnMapCenter(asset) {
        if (!window.$gameMap || !window.$gamePlayer) return;
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapX = $gamePlayer.x * tw + tw / 2;
        const mapY = $gamePlayer.y * th + th;
        this.commitPlacement(asset, { x: mapX, y: mapY, tileX: $gamePlayer.x, tileY: $gamePlayer.y });
    },

    commitPlacement(asset, coords, modeOverride) {
        if (asset && asset.type === 'prefab') {
            this.placePrefab(DocsDoodads.Prefabs.get(asset.prefabId), coords);
            return;
        }
        const mode = modeOverride || asset.placement.defaultMode || "doodad";

        if (mode === "event" || asset.type === "character_sheet" || asset.type === "single_character") {
            const templateKey = document.getElementById('dd-event-template') ? document.getElementById('dd-event-template').value : 'npc';
            const template = DocsDoodads.EventTemplates.get(templateKey);
            const mapId = $gameMap.mapId();
            DocsDoodads.Persistence.stagedFor(mapId);
            const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

            const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
                characterName: asset.fileName,
                characterIndex: asset.type === 'character_sheet'
                    ? (asset.characterIndex !== undefined ? asset.characterIndex : ((asset.placement && asset.placement.characterIndex) || 0))
                    : 0,
                list: template.list,
                trigger: template.trigger,
                priorityType: template.priorityType
            });

            const cmd = {
                apply: () => {
                    $gameMap._stagedMapData.events[newId] = ev;
                    DocsDoodads.Persistence.dirtyMap = true;
                },
                revert: () => {
                    delete $gameMap._stagedMapData.events[newId];
                }
            };
            DocsDoodads.Undo.execute(cmd);
            this.showToast(`Created ${template.name} Event EV${String(newId).padStart(3, '0')}`);
        } else {
            const placed = this.withMirrors(this.newDoodadFromAsset(asset, coords.x, coords.y));

            const cmd = {
                apply: () => {
                    window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    placed.forEach(d => window.$dataDocsDoodads[$gameMap.mapId()].push(d));
                    DocsDoodads.Persistence.dirtyDoodads = true;
                    this.refreshSpriteset();
                },
                revert: () => {
                    const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                    placed.forEach(d => {
                        const idx = list.indexOf(d);
                        if (idx > -1) list.splice(idx, 1);
                    });
                    this.refreshSpriteset();
                }
            };
            DocsDoodads.Undo.execute(cmd);
            this.showToast("Placed Doodad on Map!");
        }
        DocsDoodads.AssetIndex.recordUsage(asset.id);
    },

    alignSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 2) return;
        const before = items.map(d => ({ doodad: d, x: d.x, y: d.y }));

        if (mode === 'left') {
            const minX = Math.min(...items.map(d => d.x));
            items.forEach(d => d.x = minX);
        } else if (mode === 'right') {
            const maxX = Math.max(...items.map(d => d.x));
            items.forEach(d => d.x = maxX);
        } else if (mode === 'top') {
            const minY = Math.min(...items.map(d => d.y));
            items.forEach(d => d.y = minY);
        } else if (mode === 'bottom') {
            const maxY = Math.max(...items.map(d => d.y));
            items.forEach(d => d.y = maxY);
        } else if (mode === 'centerX') {
            const avgX = Math.round(items.reduce((sum, d) => sum + d.x, 0) / items.length);
            items.forEach(d => d.x = avgX);
        } else if (mode === 'centerY') {
            const avgY = Math.round(items.reduce((sum, d) => sum + d.y, 0) / items.length);
            items.forEach(d => d.y = avgY);
        }

        const after = items.map(d => ({ doodad: d, x: d.x, y: d.y }));
        DocsDoodads.Undo.execute({
            type: 'align_doodads',
            apply: () => {
                after.forEach(a => { a.doodad.x = a.x; a.doodad.y = a.y; });
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => { b.doodad.x = b.x; b.doodad.y = b.y; });
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Aligned ${items.length} doodads (${mode}).`);
    },

    distributeSelected(mode) {
        const items = (this.selectedDoodads || []).filter(d => !d.locked);
        if (items.length < 3) {
            this.showToast("Select at least 3 doodads to distribute.");
            return;
        }
        const before = items.map(d => ({ doodad: d, x: d.x, y: d.y }));

        if (mode === 'horizontal') {
            items.sort((a, b) => a.x - b.x);
            const minX = items[0].x;
            const maxX = items[items.length - 1].x;
            const step = (maxX - minX) / (items.length - 1);
            items.forEach((d, idx) => { d.x = Math.round(minX + idx * step); });
        } else if (mode === 'vertical') {
            items.sort((a, b) => a.y - b.y);
            const minY = items[0].y;
            const maxY = items[items.length - 1].y;
            const step = (maxY - minY) / (items.length - 1);
            items.forEach((d, idx) => { d.y = Math.round(minY + idx * step); });
        }

        const after = items.map(d => ({ doodad: d, x: d.x, y: d.y }));
        DocsDoodads.Undo.execute({
            type: 'distribute_doodads',
            apply: () => {
                after.forEach(a => { a.doodad.x = a.x; a.doodad.y = a.y; });
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => { b.doodad.x = b.x; b.doodad.y = b.y; });
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Distributed ${items.length} doodads (${mode}).`);
    },

    groupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length < 2) return;
        const grpId = 'grp_' + Date.now();
        const before = items.map(d => ({ doodad: d, groupId: d.groupId }));
        items.forEach(d => d.groupId = grpId);
        DocsDoodads.Undo.execute({
            type: 'group_doodads',
            apply: () => { items.forEach(d => d.groupId = grpId); },
            revert: () => { before.forEach(b => { if (b.groupId) b.doodad.groupId = b.groupId; else delete b.doodad.groupId; }); }
        });
        this.refreshInspector();
        this.showToast(`Grouped ${items.length} doodads.`);
    },

    ungroupSelected() {
        const items = this.selectedDoodads || [];
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, groupId: d.groupId }));
        items.forEach(d => delete d.groupId);
        DocsDoodads.Undo.execute({
            type: 'ungroup_doodads',
            apply: () => { items.forEach(d => delete d.groupId); },
            revert: () => { before.forEach(b => { if (b.groupId) b.doodad.groupId = b.groupId; else delete b.doodad.groupId; }); }
        });
        this.refreshInspector();
        this.showToast(`Ungrouped ${items.length} doodads.`);
    },

    lockSelected(locked) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, locked: d.locked }));
        items.forEach(d => d.locked = !!locked);
        DocsDoodads.Undo.execute({
            type: 'lock_doodads',
            apply: () => { items.forEach(d => d.locked = !!locked); },
            revert: () => { before.forEach(b => b.doodad.locked = !!b.locked); }
        });
        this.refreshInspector();
        this.showToast(locked ? `Locked ${items.length} doodads.` : `Unlocked ${items.length} doodads.`);
    },

    hideSelected(hidden) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        const before = items.map(d => ({ doodad: d, editorHidden: d.editorHidden }));
        items.forEach(d => d.editorHidden = !!hidden);
        DocsDoodads.Undo.execute({
            type: 'hide_doodads',
            apply: () => {
                items.forEach(d => d.editorHidden = !!hidden);
                this.refreshSpriteset(true);
            },
            revert: () => {
                before.forEach(b => b.doodad.editorHidden = !!b.editorHidden);
                this.refreshSpriteset(true);
            }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(hidden ? `Hidden ${items.length} doodads in editor.` : `Showing ${items.length} doodads.`);
    },

    bringForward(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: (d.z || 0) + 1 }));
        DocsDoodads.Undo.execute({
            type: 'z_order_fwd',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Brought ${items.length} doodad(s) forward (+1 Z)`);
    },

    sendBackward(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: (d.z || 0) - 1 }));
        DocsDoodads.Undo.execute({
            type: 'z_order_back',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Sent ${items.length} doodad(s) backward (-1 Z)`);
    },

    bringToFront(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const all = DocsDoodads.doodads() || [];
        let maxZ = 0;
        all.forEach(d => { if ((d.z || 0) > maxZ) maxZ = d.z; });
        const targetZ = maxZ + 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        DocsDoodads.Undo.execute({
            type: 'z_order_front',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Brought ${items.length} doodad(s) to front (Z: ${targetZ})`);
    },

    sendToBack(items) {
        items = items || (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []));
        if (!items || items.length === 0) return;
        const all = DocsDoodads.doodads() || [];
        let minZ = 0;
        all.forEach(d => { if ((d.z || 0) < minZ) minZ = d.z; });
        const targetZ = minZ - 1;
        const before = items.map(d => ({ doodad: d, z: d.z || 0 }));
        const after = items.map(d => ({ doodad: d, z: targetZ }));
        DocsDoodads.Undo.execute({
            type: 'z_order_bottom',
            apply: () => { after.forEach(a => { a.doodad.z = a.z; }); this.refreshSpriteset(true); },
            revert: () => { before.forEach(b => { b.doodad.z = b.z; }); this.refreshSpriteset(true); }
        });
        this.refreshSpriteset(true);
        this.refreshInspector();
        this.showToast(`Sent ${items.length} doodad(s) to back (Z: ${targetZ})`);
    },

    // Copies are unlocked and get fresh ids; each copied group becomes one new, independent group.
    cloneDoodadsForCopy(items, offset = 16) {
        const groupIds = new Map();
        return items.map(orig => {
            const dup = JSON.parse(JSON.stringify(orig));
            dup.x += offset;
            dup.y += offset;
            dup.locked = false;
            delete dup.uid;
            delete dup.mirrorOf;
            if (orig.groupId) {
                if (!groupIds.has(orig.groupId)) groupIds.set(orig.groupId, 'grp_' + Date.now() + '_' + groupIds.size + '_' + Math.random().toString(36).slice(2, 6));
                dup.groupId = groupIds.get(orig.groupId);
            } else {
                delete dup.groupId;
            }
            return dup;
        });
    },

    clipboardPath: 'data/docs_doodads_cache/clipboard.json',

    // The clipboard is also written to disk so it survives map changes and Playtest restarts.
    copySelected() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return;
        this._clipboardDoodads = items.map(d => JSON.parse(JSON.stringify(d)));
        this._clipboardSourceMapId = this.currentMapId();
        DocsDoodads.FS.atomicWriteJson(this.clipboardPath, { sourceMapId: this._clipboardSourceMapId, doodads: this._clipboardDoodads });
        this.showToast(`Copied ${items.length} doodad(s) to clipboard`);
    },

    loadClipboard() {
        if (this._clipboardDoodads && this._clipboardDoodads.length > 0) return true;
        const saved = DocsDoodads.FS.existsSync(this.clipboardPath) ? DocsDoodads.FS.readJson(this.clipboardPath) : null;
        if (!saved || !Array.isArray(saved.doodads) || saved.doodads.length === 0) return false;
        this._clipboardDoodads = saved.doodads;
        this._clipboardSourceMapId = saved.sourceMapId;
        return true;
    },

    // Same map: the copy is offset so it is visible. Another map: it lands at the same position.
    pasteCopied() {
        if (!this.loadClipboard()) return;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const sameMap = this._clipboardSourceMapId === undefined || this._clipboardSourceMapId === mapId;
        const duplicates = this.cloneDoodadsForCopy(this._clipboardDoodads, sameMap ? 16 : 0);

        const cmd = {
            type: 'paste_doodads',
            apply: () => {
                duplicates.forEach(d => list.push(d));
                DocsDoodads.Persistence.dirtyDoodads = true;
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Pasted ${duplicates.length} doodad(s)${sameMap ? '' : ` from map ${this._clipboardSourceMapId}`}`);
    },

    // ---- Shared undo for whole per-map arrays (prefab sync, mirroring, send to map) ----
    recordMapListsEdit(beforeLists, type) {
        const data = window.$dataDocsDoodads;
        const afterLists = {};
        for (const mapId of Object.keys(beforeLists)) afterLists[mapId] = (data[mapId] || []).slice();
        const write = (lists) => {
            for (const [mapId, items] of Object.entries(lists)) {
                if (!items) { delete data[mapId]; continue; }
                const target = data[mapId] = data[mapId] || [];
                target.length = 0;
                items.forEach(d => target.push(d));
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
            this.refreshSpriteset();
        };
        DocsDoodads.Undo.execute({ type, apply: () => write(afterLists), revert: () => write(beforeLists) });
    },

    snapshotMapLists(mapIds) {
        const data = window.$dataDocsDoodads;
        const out = {};
        for (const mapId of mapIds) out[mapId] = data[mapId] ? data[mapId].slice() : null;
        return out;
    },

    sendDoodadsToMap(items, targetMapId, mode = 'copy') {
        items = (items || []).filter(d => d && (mode === 'copy' || !d.locked));
        const sourceMapId = this.currentMapId();
        targetMapId = Number(targetMapId);
        if (items.length === 0 || !targetMapId || targetMapId === sourceMapId) return 0;
        const data = window.$dataDocsDoodads;
        const before = this.snapshotMapLists([sourceMapId, targetMapId]);
        const target = data[targetMapId] = data[targetMapId] || [];
        if (mode === 'move') {
            const source = data[sourceMapId] || [];
            for (const d of items) {
                const i = source.indexOf(d);
                if (i > -1) source.splice(i, 1);
                target.push(d);
            }
            this.selectedDoodad = null;
            this.selectedDoodads = [];
        } else {
            this.cloneDoodadsForCopy(items, 0).forEach(d => target.push(d));
        }
        this.recordMapListsEdit(before, mode === 'move' ? 'move_to_map' : 'copy_to_map');
        this.showToast(`${mode === 'move' ? 'Moved' : 'Copied'} ${items.length} doodad(s) to map ${targetMapId}`);
        return items.length;
    },

    // Map pixel size; neighbouring maps are read from disk (overridable in tests).
    mapSizeLookup(mapId) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        if (window.$gameMap && $gameMap.mapId() === mapId && $gameMap.width) return { w: $gameMap.width() * tw, h: $gameMap.height() * th };
        const map = DocsDoodads.FS.readJson(DocsDoodads.Persistence.mapFilePath(mapId));
        return map && map.width ? { w: map.width * tw, h: map.height * th } : null;
    },

    mapNeighbors(mapId = this.currentMapId()) {
        const settings = DocsDoodads.Lighting.mapSettings(mapId);
        return (settings && settings.neighbors) || {};
    },

    setMapNeighbors(neighbors) {
        const mapId = this.currentMapId();
        const data = window.$dataDocsDoodads;
        const before = data.mapSettings && data.mapSettings[mapId] ? JSON.parse(JSON.stringify(data.mapSettings[mapId])) : null;
        const clean = {};
        for (const side of DocsDoodads.MapLinks.sides) if (Number(neighbors[side]) > 0) clean[side] = Number(neighbors[side]);
        const next = Object.assign({}, before || {}, { neighbors: clean });
        const write = (value) => {
            if (value) {
                data.mapSettings = data.mapSettings || {};
                data.mapSettings[mapId] = JSON.parse(JSON.stringify(value));
            } else if (data.mapSettings) {
                delete data.mapSettings[mapId];
            }
            DocsDoodads.Persistence.dirtyDoodads = true;
        };
        DocsDoodads.Undo.execute({ type: 'map_neighbors', apply: () => write(next), revert: () => write(before) });
    },

    // Doodads hanging over this map's edges get read-only copies on the neighbouring maps.
    mirrorEdgeDoodads() {
        const mapId = this.currentMapId();
        const neighbors = this.mapNeighbors(mapId);
        const data = window.$dataDocsDoodads;
        const own = data[mapId] || [];
        own.forEach(d => { if (!d.mirrorOf) DocsDoodads.MapLinks.ensureUid(d); });
        const copies = DocsDoodads.MapLinks.edgeCopies(mapId, own, neighbors, id => this.mapSizeLookup(id));
        const targets = new Set(Object.values(neighbors).map(Number).filter(Boolean));
        copies.forEach(c => targets.add(c.mapId));
        if (targets.size === 0) {
            this.showToast('Set neighbouring maps first.');
            return 0;
        }
        const before = this.snapshotMapLists([...targets]);
        for (const target of targets) {
            const list = data[target] = (data[target] || []).filter(d => !(d.mirrorOf && d.mirrorOf.mapId === mapId));
            copies.filter(c => c.mapId === target).forEach(c => list.push(Object.assign(c.doodad, { locked: true })));
        }
        this.recordMapListsEdit(before, 'mirror_edges');
        this.showToast(`Mirrored ${copies.length} edge doodad(s) to ${targets.size} neighbouring map(s).`);
        return copies.length;
    },

    // ---- Path tool ----
    pathSettings: { spacing: 48, alignToPath: false, smooth: false, jitter: 0, endAsset: null, cornerAsset: null },
    pathPoints: [],

    placePath(points, asset, settings = this.pathSettings) {
        if (!asset || !points || points.length === 0) return [];
        const samples = DocsDoodads.Paths.sample(points, settings.spacing, { smooth: settings.smooth });
        const rng = DocsDoodads.Scatter.rng(Date.now());
        const placed = samples.map(p => {
            const special = (p.kind === 'start' || p.kind === 'end') ? settings.endAsset : p.kind === 'corner' ? settings.cornerAsset : null;
            const jitter = Number(settings.jitter) || 0;
            const x = Math.round(p.x + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const y = Math.round(p.y + (jitter ? (rng() * 2 - 1) * jitter : 0));
            const d = this.newDoodadFromAsset(special || asset, x, y);
            if (settings.alignToPath) d.rotation = Math.round(p.angle);
            return d;
        });
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_path',
            apply: () => { placed.forEach(d => list.push(d)); DocsDoodads.Persistence.dirtyDoodads = true; this.refreshSpriteset(); },
            revert: () => { placed.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); }); this.refreshSpriteset(); }
        });
        DocsDoodads.AssetIndex.recordUsage(asset.id);
        this.showToast(`Placed ${placed.length} piece(s) along the path.`);
        return placed;
    },

    finishPath() {
        const points = this.pathPoints || [];
        this.pathPoints = [];
        if (points.length > 0 && this.selectedAsset && this.selectedAsset.category !== 'Audio') this.placePath(points, this.selectedAsset);
    },

    // ---- Prefabs ----
    prefabInstanceDoodads(d) {
        if (!d || !d.prefabRef) return [];
        return (DocsDoodads.doodads() || []).filter(x => x.prefabRef && x.prefabRef.instance === d.prefabRef.instance);
    },

    // Events inside the selection's tile bounds go into the prefab with the doodads.
    eventsWithin(items) {
        if (!items.length || !window.$gameMap) return [];
        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const r = DocsDoodads.Guides.unionRect(items.map(d => DocsDoodads.Guides.rectOf(d)));
        const staged = DocsDoodads.Persistence.stagedFor();
        return ((staged && staged.events) || []).filter(e => e &&
            (e.x + 0.5) * tw >= r.left && (e.x + 0.5) * tw <= r.right && (e.y + 0.5) * th >= r.top && (e.y + 0.5) * th <= r.bottom);
    },

    savePrefabFromSelection(name, includeEvents = true) {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const events = includeEvents ? this.eventsWithin(items) : [];
        const prefab = DocsDoodads.Prefabs.capture(name, items, events, { tileWidth: tw, tileHeight: th });
        DocsDoodads.Prefabs.add(prefab);
        DocsDoodads.Prefabs.save();
        // The selection itself becomes the prefab's first linked copy.
        const instance = DocsDoodads.Prefabs.newId('pi_');
        this.editDoodads(items, d => {
            d.prefabRef = { id: prefab.id, instance, ox: prefab.origin.x, oy: prefab.origin.y };
            d.groupId = 'grp_' + instance;
        }, 'link_prefab');
        this.showToast(`Saved prefab "${prefab.name}" (${prefab.doodads.length} doodads, ${prefab.events.length} events).`);
        if (this.currentCategory === 'Prefabs') this.refreshDrawerCards();
        return prefab;
    },

    placePrefab(prefab, at) {
        if (!prefab) return null;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const staged = prefab.events && prefab.events.length > 0 ? DocsDoodads.Persistence.stagedFor() : null;
        const reserved = [];
        const inst = DocsDoodads.Prefabs.instantiate(prefab, at, {
            tileWidth: tw, tileHeight: th,
            allocateEventId: () => {
                const id = DocsDoodads.Events.allocateSafeId(staged);
                staged.events[id] = { id, reserved: true };
                reserved.push(id);
                return id;
            }
        });
        reserved.forEach(id => { delete staged.events[id]; });
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        DocsDoodads.Undo.execute({
            type: 'place_prefab',
            apply: () => {
                inst.doodads.forEach(d => list.push(d));
                inst.events.forEach(e => { staged.events[e.id] = e; });
                DocsDoodads.Persistence.dirtyDoodads = true;
                if (inst.events.length) DocsDoodads.Persistence.dirtyMap = true;
                this.refreshSpriteset();
            },
            revert: () => {
                inst.doodads.forEach(d => { const i = list.indexOf(d); if (i > -1) list.splice(i, 1); });
                inst.events.forEach(e => { if (staged.events[e.id] === e) staged.events[e.id] = null; });
                this.refreshSpriteset();
            }
        });
        this.showToast(`Placed prefab "${prefab.name}"${inst.events.length ? ` with ${inst.events.length} event(s)` : ''}.`);
        if (this.selectedAsset && this.selectedAsset.type === 'prefab') this.refreshInspector();
        return inst;
    },

    updatePrefabFromInstance(d) {
        const prefab = d && d.prefabRef ? DocsDoodads.Prefabs.get(d.prefabRef.id) : null;
        if (!prefab) return null;
        DocsDoodads.Prefabs.updateFromInstance(prefab, this.prefabInstanceDoodads(d));
        DocsDoodads.Prefabs.save();
        this.showToast(`Updated prefab "${prefab.name}" from this copy.`);
        return prefab;
    },

    // Rebuilds every placed copy (on every map) from the master, keeping each copy's position and group.
    syncPrefabInstances(prefabId) {
        const prefab = DocsDoodads.Prefabs.get(prefabId);
        if (!prefab) return 0;
        const data = window.$dataDocsDoodads;
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapIds = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].some(d => d && d.prefabRef && d.prefabRef.id === prefabId));
        const before = this.snapshotMapLists(mapIds);
        let count = 0;
        for (const mapId of mapIds) {
            const next = [];
            const done = new Set();
            for (const d of data[mapId]) {
                if (!d || !d.prefabRef || d.prefabRef.id !== prefabId) { next.push(d); continue; }
                if (done.has(d.prefabRef.instance)) continue;
                done.add(d.prefabRef.instance);
                const rebuilt = DocsDoodads.Prefabs.instantiate(prefab, { x: d.prefabRef.ox, y: d.prefabRef.oy },
                    { tileWidth: tw, tileHeight: th, instance: d.prefabRef.instance, groupId: d.groupId });
                rebuilt.doodads.forEach(x => next.push(x));
                count++;
            }
            data[mapId].length = 0;
            next.forEach(d => data[mapId].push(d));
        }
        this.recordMapListsEdit(before, 'sync_prefab');
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.showToast(`Synced ${count} cop${count === 1 ? 'y' : 'ies'} of "${prefab.name}".`);
        return count;
    },

    detachPrefabInstance(d) {
        const items = this.prefabInstanceDoodads(d);
        this.editDoodads(items, x => { delete x.prefabRef; }, 'detach_prefab');
    },

    // ---- Dragging doodads with smart guides ----
    activeGuides: [],

    beginDoodadDrag(point) {
        const hit = this.doodadAt(point.x, point.y);
        if (!hit || hit.locked) return false;
        const selection = this.selectedDoodads && this.selectedDoodads.includes(hit) ? this.selectedDoodads : null;
        if (!selection) this.selectDoodad(hit);
        const items = (this.selectedDoodads && this.selectedDoodads.length ? this.selectedDoodads : [hit]).filter(d => !d.locked);
        if (items.length === 0) return false;
        const moving = new Set(items);
        this._drag = {
            start: { x: point.x, y: point.y },
            primary: hit,
            items,
            origin: items.map(d => ({ x: d.x, y: d.y })),
            before: this.snapshotDoodads(items),
            others: (DocsDoodads.doodads() || []).filter(d => !moving.has(d) && !d.editorHidden).map(d => DocsDoodads.Guides.rectOf(d)),
            moved: false
        };
        return true;
    },

    updateDoodadDrag(point, modifiers = {}) {
        const drag = this._drag;
        if (!drag) return;
        let dx = point.x - drag.start.x;
        let dy = point.y - drag.start.y;
        if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true;
        const primaryIndex = drag.items.indexOf(drag.primary);
        const primaryOrigin = drag.origin[primaryIndex >= 0 ? primaryIndex : 0];
        this.activeGuides = [];
        if (modifiers.shiftKey) {
            const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
            const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
            const px = primaryOrigin.x + dx, py = primaryOrigin.y + dy;
            dx += Math.round((px - tw / 2) / tw) * tw + tw / 2 - px;
            dy += Math.round(py / th) * th - py;
        } else if (!modifiers.altKey) {
            const rects = drag.items.map((d, i) => DocsDoodads.Guides.rectOf(Object.assign({}, d, { x: drag.origin[i].x + dx, y: drag.origin[i].y + dy })));
            const snap = DocsDoodads.Guides.snap(DocsDoodads.Guides.unionRect(rects), drag.others, 6);
            dx += snap.dx;
            dy += snap.dy;
            this.activeGuides = snap.lines;
        }
        drag.items.forEach((d, i) => {
            d.x = Math.round(drag.origin[i].x + dx);
            d.y = Math.round(drag.origin[i].y + dy);
        });
        this.refreshSpriteset(true);
    },

    endDoodadDrag() {
        const drag = this._drag;
        this._drag = null;
        this.activeGuides = [];
        if (!drag || !drag.moved) return false;
        this.recordDoodadEdit(drag.items, drag.before, 'move_doodads');
        this.refreshInspector();
        return true;
    },

    // Extra editor overlay drawing: smart guides and the path being drawn (screen space).
    drawEditorOverlayExtras(g) {
        // Offsets from the screen position of the map origin's nearest copy keep lines continuous on looping maps.
        const anchor = this._drag && this._drag.primary ? this._drag.primary : (this.pathPoints && this.pathPoints[0]) || { x: 0, y: 0 };
        const anchorScreen = DocsDoodads.mapToScreen(anchor.x, anchor.y);
        const ox = anchor.x - anchorScreen.x;
        const oy = anchor.y - anchorScreen.y;
        for (const line of this.activeGuides || []) {
            g.lineStyle(1, line.kind === 'spacing' ? 0xf59e0b : 0xec4899, 1);
            if (line.axis === 'x') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
            else if (line.axis === 'y') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'x-gap') { g.moveTo(line.from - ox, line.at - oy); g.lineTo(line.to - ox, line.at - oy); }
            else if (line.axis === 'y-gap') { g.moveTo(line.at - ox, line.from - oy); g.lineTo(line.at - ox, line.to - oy); }
        }
        const sym = this.symmetryFor();
        if (sym.mode !== 'off') {
            const at = DocsDoodads.mapToScreen(sym.axisX, sym.axisY);
            const width = typeof Graphics !== 'undefined' ? Graphics.width : 816, height = typeof Graphics !== 'undefined' ? Graphics.height : 624;
            g.lineStyle(1, 0xa78bfa, 0.9);
            if (sym.mode === 'x' || sym.mode === 'xy') { g.moveTo(at.x, 0); g.lineTo(at.x, height); }
            if (sym.mode === 'y' || sym.mode === 'xy') { g.moveTo(0, at.y); g.lineTo(width, at.y); }
        }
        for (const r of this.historyOverlayRects()) {
            g.lineStyle(2, r.color, 0.95);
            g.drawRect(r.x, r.y, r.w, r.h);
        }
        if (this.placementTool === 'path' && this.pathPoints && this.pathPoints.length > 0) {
            const points = this.pathPoints.concat(this._pathHover ? [this._pathHover] : []);
            g.lineStyle(2, 0x22d3ee, 0.9);
            points.forEach((p, i) => { if (i === 0) g.moveTo(p.x - ox, p.y - oy); else g.lineTo(p.x - ox, p.y - oy); });
            g.lineStyle(0);
            for (const s of DocsDoodads.Paths.sample(points, this.pathSettings.spacing, { smooth: this.pathSettings.smooth })) {
                g.beginFill(s.kind === 'segment' ? 0x22d3ee : 0xf59e0b, 0.9);
                g.drawCircle(s.x - ox, s.y - oy, s.kind === 'segment' ? 3 : 5);
                g.endFill();
            }
        }
    },

    // The grid itself is drawn by Spriteset_Map (updateDocsEditorOverlay) in map space so it stays
    // on tile edges at any window scale or scroll position; this only clears the old DOM overlay.
    renderPlacementGrid() {
        const gridEl = document.getElementById('dd-map-grid-overlay');
        if (gridEl && gridEl.parentNode) gridEl.parentNode.removeChild(gridEl);
    },

    // Screen-space x/y positions of tile edges for a width x height area at the current scroll.
    placementGridLines(width, height) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const ox = window.$gameMap ? $gameMap.displayX() * tw : 0;
        const oy = window.$gameMap ? $gameMap.displayY() * th : 0;
        const lines = (size, offset, limit) => {
            const out = [];
            let first = ((-offset % size) + size) % size;
            for (let p = first; p < limit; p += size) out.push(Math.round(p * 100) / 100);
            return out;
        };
        return { xs: lines(tw, ox, width), ys: lines(th, oy, height) };
    },

    toggleGrid() {
        this.gridSnapShow = !this.gridSnapShow;
        this.renderPlacementGrid();
        this.showToast(this.gridSnapShow ? "Grid Overlay Enabled" : "Grid Overlay Disabled");
    },

    toggleInspector() {
        const panel = document.getElementById('dd-inspector-panel');
        if (!panel) return;
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
        const resizer = document.getElementById('dd-inspector-resizer');
        if (resizer) resizer.style.display = isHidden ? 'block' : 'none';
        this.showToast(isHidden ? "Inspector Shown" : "Inspector Hidden");
    },

    focusSearch() {
        const inp = document.getElementById('dd-search-input');
        if (inp) {
            inp.focus();
            inp.select();
        }
    },

    refreshSpriteset(sortOnly) {
        if (typeof SceneManager !== 'undefined' && SceneManager._scene && SceneManager._scene._spriteset) {
            if (sortOnly) {
                SceneManager._scene._spriteset.sortDocsDoodads();
            } else {
                SceneManager._scene._spriteset.addDocsDoodads();
            }
        }
    },

    deleteSelectedDoodad() {
        const items = (this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : [])).filter(d => !d.locked);
        if (items.length === 0) {
            if (this.selectedDoodad && this.selectedDoodad.locked) {
                this.showToast("Cannot delete: Doodad is locked.");
            }
            return;
        }
        const mapId = (window.$gameMap && typeof window.$gameMap.mapId === 'function') ? window.$gameMap.mapId() : 0;
        const list = (window.$dataDocsDoodads && window.$dataDocsDoodads[mapId]) ? window.$dataDocsDoodads[mapId] : [];
        const toDelete = [...items];
        const deletedRecords = toDelete.map(d => ({ doodad: d, index: list.indexOf(d) })).filter(r => r.index > -1);

        const cmd = {
            apply: () => {
                toDelete.forEach(d => {
                    const idx = list.indexOf(d);
                    if (idx > -1) list.splice(idx, 1);
                });
                this.refreshSpriteset();
            },
            revert: () => {
                deletedRecords.forEach(r => {
                    if (!list.includes(r.doodad)) list.splice(r.index, 0, r.doodad);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectedDoodad = null;
        this.selectedDoodads = [];
        this.refreshInspector();
        this.showToast(`Deleted ${toDelete.length} Doodad(s)`);
    },

    duplicateSelectedDoodad() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0 ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        if (items.length === 0 || !window.$gameMap) return;
        const mapId = typeof window.$gameMap.mapId === 'function' ? window.$gameMap.mapId() : 0;
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        const duplicates = [];

        duplicates.push(...this.cloneDoodadsForCopy(items));

        const cmd = {
            apply: () => {
                duplicates.forEach(d => list.push(d));
                this.refreshSpriteset();
            },
            revert: () => {
                duplicates.forEach(d => {
                    const i = list.indexOf(d);
                    if (i > -1) list.splice(i, 1);
                });
                this.refreshSpriteset();
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectDoodads(duplicates);
        this.showToast(`Duplicated ${duplicates.length} Doodad(s)`);
    },

    // Ghost Follower Preview
    showGhost(asset, clientX, clientY, isAlt) {
        if (!this.ghostEl) {
            this.ghostEl = document.createElement('div');
            this.ghostEl.id = 'dd-map-ghost';
            this.ghostEl.style.cssText = `
                position: fixed; pointer-events: none; z-index: 10002;
                opacity: 0.65; transform: translate(-50%, -100%);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            `;
            const img = document.createElement('img');
            img.id = 'dd-ghost-img';
            img.style.cssText = 'image-rendering: pixelated; max-width: 144px; max-height: 144px;';
            this.ghostEl.appendChild(img);
            document.body.appendChild(this.ghostEl);
        }

        const img = document.getElementById('dd-ghost-img');
        if (img && img.src !== asset.path) img.src = asset.path;

        let posX = clientX;
        let posY = clientY;

        if (!isAlt && window.$gameMap) {
            const coords = this.clientToMapCoords(clientX, clientY);
            const canvas = document.getElementById('gameCanvas') || (Graphics.app && Graphics.app.view);
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
                const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
                const scaleX = rect.width / canvas.width;
                const scaleY = rect.height / canvas.height;
                const tileScreen = DocsDoodads.mapToScreen(coords.tileX * tw + tw / 2, coords.tileY * th + th);
                const screenTileX = tileScreen.x * scaleX + rect.left;
                const screenTileY = tileScreen.y * scaleY + rect.top;
                posX = screenTileX;
                posY = screenTileY;
            }
        }

        this.ghostEl.style.left = posX + 'px';
        this.ghostEl.style.top = posY + 'px';
    },

    removeGhost() {
        if (this.ghostEl && this.ghostEl.parentNode) {
            this.ghostEl.parentNode.removeChild(this.ghostEl);
        }
        this.ghostEl = null;
    },

    // Bottom-centre of the tile under a map point (the default placement spot).
    snapToTile(coords) {
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const tileX = coords.tileX !== undefined ? coords.tileX : Math.floor(coords.x / tw);
        const tileY = coords.tileY !== undefined ? coords.tileY : Math.floor(coords.y / th);
        return { x: tileX * tw + tw / 2, y: tileY * th + th, tileX, tileY };
    },

    clientToMapCoords(clientX, clientY) {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas || !window.$gameMap) return { x: 0, y: 0, tileX: 0, tileY: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = (canvas.width && rect.width) ? (canvas.width / rect.width) : 1;
        const scaleY = (canvas.height && rect.height) ? (canvas.height / rect.height) : 1;
        const screenX = (clientX - rect.left) * scaleX;
        const screenY = (clientY - rect.top) * scaleY;

        const tw = $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        const mapped = DocsDoodads.screenToMap(screenX, screenY);
        const mapPixelX = mapped.x;
        const mapPixelY = mapped.y;
        const tileX = Math.floor(mapPixelX / tw);
        const tileY = Math.floor(mapPixelY / th);
        return { x: mapPixelX, y: mapPixelY, tileX, tileY };
    },

    // Engine elements stacked above the canvas (MZ #gameVideo/#errorPrinter, MV #GameVideo/#ErrorPrinter)
    // would otherwise receive every drop and click aimed at the map.
    canvasOverlayIds: ['gameVideo', 'errorPrinter', 'GameVideo', 'ErrorPrinter'],

    setCanvasOverlaysPassthrough(enabled) {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
        if (enabled) {
            this._overlayPointerEvents = {};
            for (const id of this.canvasOverlayIds) {
                const el = document.getElementById(id);
                if (!el || !el.style) continue;
                this._overlayPointerEvents[id] = el.style.pointerEvents;
                el.style.pointerEvents = 'none';
            }
        } else if (this._overlayPointerEvents) {
            for (const [id, previous] of Object.entries(this._overlayPointerEvents)) {
                const el = document.getElementById(id);
                if (el && el.style) el.style.pointerEvents = previous;
            }
            this._overlayPointerEvents = null;
        }
    },

    attachCanvasListeners() {
        const canvas = DocsDoodads.Compat.getCanvas();
        if (!canvas) return;
        this.setCanvasOverlaysPassthrough(true);

        this._onDragOver = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.showGhost(this.activeDragPayload, e.clientX, e.clientY, e.altKey);
            }
        };

        this._onDrop = (e) => {
            if (this.activeDragPayload) {
                e.preventDefault();
                this.removeGhost();
                const payload = this.activeDragPayload;
                this.activeDragPayload = null;
                const coords = this.clientToMapCoords(e.clientX, e.clientY);

                if (payload.category === 'Audio') {
                    if (window.$gameMap && window.$gameMap.eventsXy) {
                        const existingEvents = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                        if (existingEvents && existingEvents.length > 0) {
                            const targetEv = existingEvents[0];
                            if (confirm(`Append sound command for ${payload.fileName} to existing Event EV${String(targetEv.eventId()).padStart(3, '0')} on this tile?`)) {
                                this.appendAudioCommandToEvent(payload, targetEv);
                                return;
                            }
                        }
                    }
                    if (confirm(`Create a sound trigger event for ${payload.fileName} at this tile?`)) {
                        this.createAudioEvent(payload, coords);
                    }
                    return;
                }

                if (payload.type === 'prefab') {
                    this.placePrefab(DocsDoodads.Prefabs.get(payload.prefabId), e.altKey ? coords : this.snapToTile(coords));
                    return;
                }
                if (payload.placementMode === 'ask') {
                    this.showAskEventModal(payload, coords, e.altKey);
                } else {
                    const snapCoords = e.altKey ? coords : {
                        x: coords.tileX * 48 + 24,
                        y: coords.tileY * 48 + 48,
                        tileX: coords.tileX,
                        tileY: coords.tileY
                    };
                    this.commitPlacement(payload, snapCoords, payload.placementMode);
                }
            }
        };

        this._onCanvasContextMenu = (e) => {
            if (!this.mounted) return;
            e.preventDefault();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);
            const items = [];

            // Check if right-clicking placed doodad
            const clickedDoodad = this.doodadAt(coords.x, coords.y);

            if (clickedDoodad) {
                this.selectDoodad(clickedDoodad);
                items.push({ label: 'Bring Forward (+1 Z)', icon: '⬆️', onClick: () => this.bringForward([clickedDoodad]) });
                items.push({ label: 'Send Backward (-1 Z)', icon: '⬇️', onClick: () => this.sendBackward([clickedDoodad]) });
                items.push({ label: 'Bring to Front', icon: '⏫', onClick: () => this.bringToFront([clickedDoodad]) });
                items.push({ label: 'Send to Back', icon: '⏬', onClick: () => this.sendToBack([clickedDoodad]) });
                items.push({ separator: true });
                items.push({ label: 'Duplicate (Ctrl+D)', icon: '📄', onClick: () => this.duplicateSelectedDoodad() });
                items.push({ label: clickedDoodad.locked ? 'Unlock' : 'Lock', icon: clickedDoodad.locked ? '🔓' : '🔒', onClick: () => { clickedDoodad.locked = !clickedDoodad.locked; this.refreshInspector(); } });
                items.push({ label: 'Hide in Editor', icon: '👁️', onClick: () => { clickedDoodad.editorHidden = true; this.refreshSpriteset(true); this.refreshInspector(); } });
                items.push({ label: 'Delete (Del)', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedDoodad() });
                this.showContextMenu(e.clientX, e.clientY, items);
                return;
            }

            // Check if right-clicking placed MZ Event
            if (window.$gameMap && window.$gameMap.eventsXy) {
                const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
                if (evs && evs.length > 0) {
                    const ge = evs[0];
                    const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                    const evObj = staged || ge.event();
                    this.selectEvent({ gameEvent: ge, stagedEvent: evObj });
                    items.push({
                        label: 'Save as Event Template...', icon: '💾', onClick: () => {
                            const name = prompt("Enter a name for this new Event Template:", evObj.name || ("Template_EV" + ge.eventId()));
                            if (name && name.trim()) {
                                const cat = prompt("Category (Interaction, Mechanics, Atmosphere, Custom):", "Custom") || "Custom";
                                DocsDoodads.EventTemplates.saveCustomTemplate(name.trim(), evObj, cat.trim());
                                this.showToast(`Saved template "${name.trim()}"!`);
                            }
                        }
                    });
                    items.push({ label: 'Duplicate Event', icon: '📄', onClick: () => this.duplicateSelectedEvent() });
                    items.push({ label: 'Delete Event', icon: '🗑️', danger: true, onClick: () => this.deleteSelectedEvent() });
                    this.showContextMenu(e.clientX, e.clientY, items);
                    return;
                }
            }

            // Right-clicking empty map
            items.push({ label: this.gridSnapShow ? 'Hide Grid Overlay (G)' : 'Show Grid Overlay (G)', icon: '📐', onClick: () => this.toggleGrid() });
            if (this._clipboardDoodads && this._clipboardDoodads.length > 0) {
                items.push({ label: `Paste ${this._clipboardDoodads.length} Doodad(s) (Ctrl+V)`, icon: '📑', onClick: () => this.pasteCopied() });
            }
            if (this.selectedAsset) {
                items.push({ label: `Stamp ${this.selectedAsset.fileName} Here`, icon: '📌', onClick: () => this.commitPlacement(this.selectedAsset, coords) });
            }
            this.showContextMenu(e.clientX, e.clientY, items);
        };

        this._onCanvasClick = (e) => {
            if (!this.mounted) return;
            if (this._suppressNextClick) {
                this._suppressNextClick = false;
                return;
            }
            this.closeContextMenu();
            const coords = this.clientToMapCoords(e.clientX, e.clientY);

            // 1. Eyedropper Tool or Alt held
            if (this.placementTool === 'eyedropper' || e.altKey) {
                this.handleEyedropper(coords);
                return;
            }

            // 2. Path Tool: collect points
            if (this.placementTool === 'path') {
                if (!this.selectedAsset || this.selectedAsset.category === 'Audio' || this.selectedAsset.type === 'prefab') {
                    this.showToast('Select an image asset in the drawer to draw a path with.');
                    return;
                }
                this.pathPoints.push(e.altKey ? { x: coords.x, y: coords.y } : this.snapToTile(coords));
                return;
            }

            // 3. Stamp Tool
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                const snapCoords = e.altKey ? coords : {
                    x: coords.tileX * 48 + 24,
                    y: coords.tileY * 48 + 48,
                    tileX: coords.tileX,
                    tileY: coords.tileY
                };
                this.commitPlacement(this.selectedAsset, snapCoords);
                return;
            }

            // 3. Normal Pointer: Select placed doodad or MZ event
            if (!this.placementTool) {
                this.handleDoodadSelection(coords, e.shiftKey);
            }
        };

        this._onCanvasMouseDown = (e) => {
            if (this.placementTool === 'brush' && this.selectedAsset) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this.scatterAt(e.clientX, e.clientY);
                return;
            }
            if (this.placementTool === 'biome' && e.button === 0) {
                this.isBrushActive = true;
                this.currentBrushBatch = [];
                this._lastDab = null;
                this.biomePaintAt(e.clientX, e.clientY);
                return;
            }
            if (!this.placementTool && e.button === 0 && !e.shiftKey && !e.altKey) {
                const point = this.clientToMapCoords(e.clientX, e.clientY);
                if (this.beginDoodadDrag(point)) {
                    this._dragClientStart = { x: e.clientX, y: e.clientY };
                    this._dragActive = false;
                    return;
                }
            }
            if (!this.placementTool && e.button === 0) {
                this.isMarqueeActive = true;
                this.marqueeStartClient = { x: e.clientX, y: e.clientY };
                this.marqueeStartMap = this.clientToMapCoords(e.clientX, e.clientY);
                this.marqueeShift = e.shiftKey;
                this.hasMarqueeMoved = false;
            }
        };

        this._onCanvasMouseMove = (e) => {
            if (this._drag) {
                // The mouse-up was missed (e.g. focus left the window): finish where the drag last was.
                if (e.buttons === 0) {
                    if (this.endDoodadDrag()) this._suppressNextClick = true;
                    this._dragActive = false;
                    return;
                }
                // A small wobble while clicking is not a move.
                if (!this._dragActive && Math.hypot(e.clientX - this._dragClientStart.x, e.clientY - this._dragClientStart.y) < 4) return;
                this._dragActive = true;
                this.updateDoodadDrag(this.clientToMapCoords(e.clientX, e.clientY), { shiftKey: e.shiftKey, altKey: e.altKey });
                return;
            }
            if (this.placementTool === 'path') {
                const hover = this.clientToMapCoords(e.clientX, e.clientY);
                this._pathHover = e.altKey ? { x: hover.x, y: hover.y } : this.snapToTile(hover);
                return;
            }
            if (this.placementTool === 'stamp' && this.selectedAsset) {
                this.showGhost(this.selectedAsset, e.clientX, e.clientY, e.altKey);
            } else if (this.isBrushActive && this.placementTool === 'brush' && this.selectedAsset) {
                this.scatterAt(e.clientX, e.clientY);
            } else if (this.isBrushActive && this.placementTool === 'biome') {
                this.biomePaintAt(e.clientX, e.clientY);
            } else if (this.isMarqueeActive && this.marqueeStartClient) {
                const dx = e.clientX - this.marqueeStartClient.x;
                const dy = e.clientY - this.marqueeStartClient.y;
                if (Math.hypot(dx, dy) > 5) {
                    this.hasMarqueeMoved = true;
                    let overlay = document.getElementById('dd-marquee-overlay');
                    if (!overlay) {
                        overlay = document.createElement('div');
                        overlay.id = 'dd-marquee-overlay';
                        overlay.style.cssText = `
                            position: fixed; pointer-events: none; z-index: 10006;
                            border: 1px dashed #38bdf8; background: rgba(56, 189, 248, 0.18);
                            box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
                            border-radius: 2px;
                        `;
                        document.body.appendChild(overlay);
                    }
                    const left = Math.min(this.marqueeStartClient.x, e.clientX);
                    const top = Math.min(this.marqueeStartClient.y, e.clientY);
                    overlay.style.left = left + 'px';
                    overlay.style.top = top + 'px';
                    overlay.style.width = Math.abs(dx) + 'px';
                    overlay.style.height = Math.abs(dy) + 'px';
                }
            }
        };

        this._onCanvasMouseUp = (e) => {
            if (this._drag) {
                if (this.endDoodadDrag()) this._suppressNextClick = true;
                this._dragActive = false;
                return;
            }
            if (this.isBrushActive) {
                this.isBrushActive = false;
                if (this.currentBrushBatch.length > 0) {
                    const batch = [...this.currentBrushBatch];
                    const cmd = {
                        apply: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                if (!list.includes(item)) list.push(item);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        },
                        revert: () => {
                            const list = window.$dataDocsDoodads[$gameMap.mapId()] || [];
                            batch.forEach(item => {
                                const i = list.indexOf(item);
                                if (i > -1) list.splice(i, 1);
                            });
                            if (SceneManager._scene && SceneManager._scene._spriteset) SceneManager._scene._spriteset.addDocsDoodads();
                        }
                    };
                    DocsDoodads.Undo.execute(cmd);
                    this.showToast(`Scattered ${batch.length} props!`);
                }
            }
            if (this.isMarqueeActive) {
                const overlay = document.getElementById('dd-marquee-overlay');
                if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
                if (this.hasMarqueeMoved && this.marqueeStartMap) {
                    const currentMap = this.clientToMapCoords(e.clientX, e.clientY);
                    const minX = Math.min(this.marqueeStartMap.x, currentMap.x);
                    const maxX = Math.max(this.marqueeStartMap.x, currentMap.x);
                    const minY = Math.min(this.marqueeStartMap.y, currentMap.y);
                    const maxY = Math.max(this.marqueeStartMap.y, currentMap.y);

                    const all = DocsDoodads.doodads() || [];
                    const enclosed = all.filter(d => !d.editorHidden && this.layerAllowsEditing(d) && d.x >= minX && d.x <= maxX && d.y >= minY && d.y <= maxY);

                    if (this.marqueeShift) {
                        const current = this.selectedDoodads ? [...this.selectedDoodads] : [];
                        enclosed.forEach(d => {
                            if (!current.includes(d)) current.push(d);
                        });
                        this.selectDoodads(current);
                    } else {
                        this.selectDoodads(enclosed);
                    }
                    this._suppressNextClick = true;
                    this.showToast(`Marquee: Selected ${enclosed.length} doodad(s)`);
                }
                this.isMarqueeActive = false;
            }
        };

        if (canvas && typeof canvas.addEventListener === 'function') {
            canvas.addEventListener('dragover', this._onDragOver);
            canvas.addEventListener('drop', this._onDrop);
            canvas.addEventListener('click', this._onCanvasClick);
            canvas.addEventListener('mousedown', this._onCanvasMouseDown);
            canvas.addEventListener('contextmenu', this._onCanvasContextMenu);
            this._onCanvasDblClick = (e) => {
                if (this.placementTool === 'path') {
                    e.preventDefault();
                    this.finishPath();
                }
            };
            canvas.addEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('mousemove', this._onCanvasMouseMove);
            window.addEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    detachCanvasListeners() {
        this.setCanvasOverlaysPassthrough(false);
        const canvas = DocsDoodads.Compat.getCanvas();
        if (canvas && typeof canvas.removeEventListener === 'function') {
            if (this._onDragOver) canvas.removeEventListener('dragover', this._onDragOver);
            if (this._onDrop) canvas.removeEventListener('drop', this._onDrop);
            if (this._onCanvasClick) canvas.removeEventListener('click', this._onCanvasClick);
            if (this._onCanvasMouseDown) canvas.removeEventListener('mousedown', this._onCanvasMouseDown);
            if (this._onCanvasContextMenu) canvas.removeEventListener('contextmenu', this._onCanvasContextMenu);
            if (this._onCanvasDblClick) canvas.removeEventListener('dblclick', this._onCanvasDblClick);
        }
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
            if (this._onCanvasMouseMove) window.removeEventListener('mousemove', this._onCanvasMouseMove);
            if (this._onCanvasMouseUp) window.removeEventListener('mouseup', this._onCanvasMouseUp);
        }
    },

    // Evenly spaced scatter: props keep minDistance from each other and from what is already there,
    // and only land where the region/terrain/passability rules allow.
    scatterAt(clientX, clientY) {
        const coords = this.clientToMapCoords(clientX, clientY);
        const asset = this.selectedAsset;
        const b = this.brushSettings;
        const mapId = this.currentMapId();
        const list = window.$dataDocsDoodads[mapId] = window.$dataDocsDoodads[mapId] || [];
        this._scatterRng = this._scatterRng || DocsDoodads.Scatter.rng(Date.now());
        const rng = this._scatterRng;
        const reach = b.radius + (b.minDistance || 0);
        const existing = list.filter(d => Math.abs(d.x - coords.x) <= reach && Math.abs(d.y - coords.y) <= reach).map(d => ({ x: d.x, y: d.y }));
        const points = DocsDoodads.Scatter.candidates(coords, b.radius, b.minDistance || 0, existing, b.density, rng);
        const rules = {
            regions: DocsDoodads.Scatter.parseIdList(b.regions),
            terrainTags: DocsDoodads.Scatter.parseIdList(b.terrainTags),
            avoidBlocked: Boolean(b.avoidBlocked)
        };
        const gameMap = window.$gameMap;
        const query = {
            tileWidth: gameMap && gameMap.tileWidth ? gameMap.tileWidth() : 48,
            tileHeight: gameMap && gameMap.tileHeight ? gameMap.tileHeight() : 48,
            width: gameMap && gameMap.width ? gameMap.width() : Infinity,
            height: gameMap && gameMap.height ? gameMap.height() : Infinity,
            regionId: (x, y) => (gameMap && gameMap.regionId ? gameMap.regionId(x, y) : 0),
            terrainTag: (x, y) => (gameMap && gameMap.terrainTag ? gameMap.terrainTag(x, y) : 0),
            isPassable: (x, y) => (gameMap && gameMap.isPassable ? [2, 4, 6, 8].some(d => gameMap.isPassable(x, y, d)) : true)
        };

        for (const p of points) {
            if (!DocsDoodads.Scatter.allowed(p, rules, query)) continue;
            const v = DocsDoodads.Scatter.variation(b, rng);
            const d = this.newDoodadFromAsset(asset, Math.round(p.x), Math.round(p.y));
            d.scaleX = v.scale * (v.flipX ? -1 : 1);
            d.scaleY = v.scale;
            d.rotation = v.rotation;
            if (v.hue) d.hue = v.hue;
            for (const item of this.withMirrors(d)) {
                list.push(item);
                this.currentBrushBatch.push(item);
            }
        }
        this.refreshSpriteset();
    },

    handleEyedropper(coords) {
        const d = this.doodadAt(coords.x, coords.y);
        if (d) {
            const sourcePath = d.bit && d.bit[0] === 3 ? String(d.bit[1]).replace(/\\/g, '/').toLowerCase() : null;
            const asset = sourcePath && DocsDoodads.AssetIndex.list.find(a => String(a.path || '').replace(/\\/g, '/').toLowerCase() === sourcePath);
            if (asset) {
                this.selectAsset(asset);
                this.showToast(`Eyedropper: Selected ${asset.fileName} in drawer`);
            } else {
                this.selectDoodad(d);
                this.showToast(`Eyedropper: Selected Placed Doodad`);
            }
            return;
        }
        if (window.$gameMap && window.$gameMap.eventsXy) {
            const evs = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (evs && evs.length > 0) {
                const ge = evs[0];
                const charName = ge.characterName ? ge.characterName() : '';
                if (charName) {
                    const matchedAsset = DocsDoodads.AssetIndex.list.find(a => a.fileName === charName || a.fileName === (charName + '.png'));
                    if (matchedAsset) {
                        this.selectAsset(matchedAsset);
                        this.showToast(`Eyedropper: Matched Character Sheet ${charName}`);
                        return;
                    }
                }
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Eyedropper: Selected Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        this.showToast("No doodad or event under cursor");
    },

    doodadContainsPoint(d, x, y) {
        const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
        const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
        const left = d.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5);
        const top = d.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0);
        if (x >= left && x <= left + w && y >= top && y <= top + h) return true;
        // Keep small props easy to click.
        return Math.hypot(d.x - x, d.y - y) < 40;
    },

    // Screen-space boxes for the selected doodads, matching Sprite_DocsDoodad placement.
    selectionScreenRects() {
        const items = this.selectedDoodads && this.selectedDoodads.length > 0
            ? this.selectedDoodads : (this.selectedDoodad ? [this.selectedDoodad] : []);
        const tw = window.$gameMap && $gameMap.tileWidth ? $gameMap.tileWidth() : 48;
        const th = window.$gameMap && $gameMap.tileHeight ? $gameMap.tileHeight() : 48;
        return items.filter(d => !d.editorHidden).map(d => {
            const w = (d.frameW || 48) * Math.abs(d.scaleX !== undefined ? d.scaleX : 1);
            const h = (d.frameH || 48) * Math.abs(d.scaleY !== undefined ? d.scaleY : 1);
            const at = d.posMode === 1 && window.$gameMap ? DocsDoodads.mapToScreen(d.x, d.y) : { x: d.x, y: d.y };
            return {
                x: at.x - w * (d.anchorX !== undefined ? d.anchorX : 0.5),
                y: at.y - h * (d.anchorY !== undefined ? d.anchorY : 1.0),
                w, h
            };
        });
    },

    // Topmost visible doodad whose image covers the map point.
    doodadAt(x, y) {
        const list = DocsDoodads.doodads() || [];
        for (let i = list.length - 1; i >= 0; i--) {
            const d = list[i];
            if (!d.editorHidden && this.layerAllowsEditing(d) && this.doodadContainsPoint(d, x, y)) return d;
        }
        return null;
    },

    handleDoodadSelection(coords, isMulti) {
        const hit = this.doodadAt(coords.x, coords.y);
        if (hit) {
            this.selectDoodad(hit, isMulti);
            return;
        }
        // If no doodad clicked, check for genuine MZ Event on that tile
        if (!isMulti && window.$gameMap && window.$gameMap.eventsXy) {
            const events = window.$gameMap.eventsXy(coords.tileX, coords.tileY);
            if (events && events.length > 0) {
                const ge = events[0];
                const staged = ($gameMap._stagedMapData && $gameMap._stagedMapData.events) ? $gameMap._stagedMapData.events[ge.eventId()] : null;
                this.selectEvent({ gameEvent: ge, stagedEvent: staged || ge.event() });
                this.showToast(`Selected Map Event EV${String(ge.eventId()).padStart(3, '0')}`);
                return;
            }
        }
        if (!isMulti) {
            this.selectDoodad(null);
            this.selectEvent(null);
        }
    },

    showAskEventModal(payload, coords, isAlt) {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 380px; padding: 20px; z-index: 10020; text-align: center;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 8px;">PLACEMENT DECISION</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 16px;">Does ${escapeHtml(payload.fileName)} need an interactive RPG Maker MZ event?</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <button class="dd-btn dd-btn-primary" id="dd-ask-yes">Yes (Create MZ Event)</button>
                <button class="dd-btn" id="dd-ask-no">No (Decorative Doodad)</button>
                <button class="dd-btn" id="dd-ask-yes-rem" style="font-size: 11px;">Yes & Remember</button>
                <button class="dd-btn" id="dd-ask-no-rem" style="font-size: 11px;">No & Remember</button>
            </div>
            <div style="margin-top: 12px;">
                <button class="dd-btn" id="dd-ask-cancel" style="width: 100%;">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);

        const snapCoords = isAlt ? coords : {
            x: coords.tileX * 48 + 24,
            y: coords.tileY * 48 + 48,
            tileX: coords.tileX,
            tileY: coords.tileY
        };

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-ask-yes').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no').onclick = () => {
            closeM();
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-yes-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'event';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'event');
        };
        document.getElementById('dd-ask-no-rem').onclick = () => {
            closeM();
            if (DocsDoodads.AssetIndex.data.assets[payload.assetId]) {
                DocsDoodads.AssetIndex.data.assets[payload.assetId].placement.defaultMode = 'doodad';
                DocsDoodads.AssetIndex.save();
            }
            this.commitPlacement(payload, snapCoords, 'doodad');
        };
        document.getElementById('dd-ask-cancel').onclick = closeM;
    },

    createAudioEvent(payload, coords) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);
        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const ev = DocsDoodads.Events.createEventObject(newId, coords.tileX, coords.tileY, {
            name: `Sound_${baseName}`,
            trigger: 1, // Player Touch
            priorityType: 0,
            through: true,
            list: [
                { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] },
                { code: 0, indent: 0, parameters: [] }
            ]
        });

        $gameMap._stagedMapData.events[newId] = ev;
        DocsDoodads.Persistence.dirtyMap = true;
        this.showToast(`Created Sound Event EV${String(newId).padStart(3, '0')}`);
    },

    deleteSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ge = evInfo.gameEvent;
        const ev = evInfo.stagedEvent || (ge && ge.event());
        const evId = ev ? ev.id : (ge ? ge.eventId() : 0);
        if (!evId) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const oldEv = $gameMap._stagedMapData.events[evId] || ev;

        const cmd = {
            type: 'delete_event',
            apply: () => {
                delete $gameMap._stagedMapData.events[evId];
                if (ge && ge._erased !== undefined) ge._erased = true;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                $gameMap._stagedMapData.events[evId] = oldEv;
                if (ge && ge._erased !== undefined) ge._erased = false;
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent(null);
        this.showToast(`Deleted Event EV${String(evId).padStart(3, '0')}`);
    },

    duplicateSelectedEvent() {
        if (!this.selectedEvent || !window.$gameMap) return;
        const evInfo = this.selectedEvent;
        const ev = evInfo.stagedEvent || (evInfo.gameEvent && evInfo.gameEvent.event());
        if (!ev) return;

        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const newId = DocsDoodads.Events.allocateSafeId($gameMap._stagedMapData);

        const dup = JSON.parse(JSON.stringify(ev));
        dup.id = newId;
        dup.name = (dup.name || ('EV' + newId)) + '_copy';
        dup.x = (dup.x || 0) + 1;

        const cmd = {
            type: 'duplicate_event',
            apply: () => {
                $gameMap._stagedMapData.events[newId] = dup;
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                delete $gameMap._stagedMapData.events[newId];
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.selectEvent({ stagedEvent: dup });
        this.showToast(`Duplicated to Event EV${String(newId).padStart(3, '0')}`);
    },

    showContextMenu(clientX, clientY, items) {
        this.closeContextMenu();
        if (!items || items.length === 0) return;
        const menu = document.createElement('div');
        menu.id = 'dd-context-menu';
        menu.className = 'dd-glass';
        menu.style.cssText = `
            position: fixed; z-index: 10050; min-width: 180px; padding: 4px;
            display: flex; flex-direction: column; gap: 2px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.7);
        `;
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.style.cssText = 'height: 1px; background: rgba(255,255,255,0.1); margin: 3px 0;';
                menu.appendChild(sep);
                return;
            }
            const row = document.createElement('button');
            row.className = 'dd-btn';
            row.style.cssText = `
                text-align: left; width: 100%; border: none; background: transparent;
                padding: 5px 10px; font-size: 11px; display: flex; align-items: center; gap: 6px;
                color: ${item.danger ? '#f87171' : '#e2e8f0'};
            `;
            row.innerHTML = `<span>${escapeHtml(item.icon || '•')}</span> <span>${escapeHtml(item.label)}</span>`;
            row.onmouseenter = () => { row.style.background = item.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.25)'; };
            row.onmouseleave = () => { row.style.background = 'transparent'; };
            row.onclick = (e) => {
                e.stopPropagation();
                this.closeContextMenu();
                if (item.onClick) item.onClick();
            };
            menu.appendChild(row);
        });
        document.body.appendChild(menu);

        const menuW = menu.offsetWidth || 180;
        const menuH = menu.offsetHeight || 200;
        const left = Math.min(clientX, (window.innerWidth || 1200) - menuW - 10);
        const top = Math.min(clientY, (window.innerHeight || 800) - menuH - 10);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';

        const onDismiss = (ev) => {
            if (menu.contains(ev.target)) return;
            this.closeContextMenu();
            window.removeEventListener('pointerdown', onDismiss);
        };
        setTimeout(() => window.addEventListener('pointerdown', onDismiss), 50);
    },

    closeContextMenu() {
        const existing = document.getElementById('dd-context-menu');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    },

    appendAudioCommandToEvent(payload, gameEvent) {
        const mapId = $gameMap.mapId();
        DocsDoodads.Persistence.stagedFor(mapId);
        const evId = gameEvent.eventId();
        const ev = $gameMap._stagedMapData.events[evId] || gameEvent.event();
        if (!ev || !ev.pages || !ev.pages[0]) return;

        const baseName = payload.fileName.replace(/\.[^/.]+$/, "");
        let code = 250;
        if (payload.path.includes('/bgm/')) code = 241;
        else if (payload.path.includes('/bgs/')) code = 245;
        else if (payload.path.includes('/me/')) code = 249;

        const soundCmd = { code: code, indent: 0, parameters: [{ name: baseName, volume: 90, pitch: 100, pan: 0 }] };
        const pageList = ev.pages[0].list;
        const insertIdx = Math.max(0, pageList.length - 1);

        const cmd = {
            type: 'append_audio_command',
            apply: () => {
                pageList.splice(insertIdx, 0, soundCmd);
                DocsDoodads.Persistence.dirtyMap = true;
            },
            revert: () => {
                const idx = pageList.indexOf(soundCmd);
                if (idx > -1) pageList.splice(idx, 1);
                DocsDoodads.Persistence.dirtyMap = true;
            }
        };
        DocsDoodads.Undo.execute(cmd);
        this.showToast(`Appended Sound Command to Event EV${String(evId).padStart(3, '0')}`);
    },

    async runAssetImport(sourcePaths, options = {}) {
        const plan = DocsDoodads.Import.planBatch(sourcePaths, options);
        const result = await DocsDoodads.Import.executeBatchAsync(plan, {
            cancellationToken: options.cancellationToken,
            onProgress: options.onProgress
        });
        if (!result.ok) return result;

        await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
        this.refreshDrawerCards();

        if (options.autoSlice) {
            const path = DocsDoodads.FS.path;
            const imported = new Set(result.imported.map(filePath => path.resolve(filePath).toLowerCase()));
            const firstImage = DocsDoodads.AssetIndex.list.find(asset =>
                asset.category !== 'Audio' && imported.has(path.resolve(asset.path).toLowerCase())
            );
            if (firstImage && typeof setTimeout === 'function') {
                setTimeout(() => DocsDoodads.Slicing.Editor.open(firstImage), 0);
            }
        }
        return result;
    },

    showAssetImportModal(sourcePaths) {
        if (!DocsDoodads.FS.fs || !DocsDoodads.FS.path) {
            this.showToast('Explorer import requires NW.js filesystem access.');
            return;
        }

        const collected = DocsDoodads.Import.collectFiles(sourcePaths);
        const supportedCount = collected.files.filter(filePath => DocsDoodads.Import.isSupported(filePath)).length;
        if (supportedCount === 0) {
            this.showToast('No supported image or audio files were found.');
            return;
        }

        const previous = document.getElementById('dd-import-modal');
        if (previous && previous.parentNode) previous.parentNode.removeChild(previous);

        const overlay = document.createElement('div');
        overlay.id = 'dd-import-modal';
        overlay.style.cssText = `
            position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 10030; display: flex;
            align-items: center; justify-content: center; background: rgba(2,6,23,0.72);
            pointer-events: auto;
        `;
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = 'width: 430px; padding: 20px; color: #e2e8f0;';
        const destinationOptions = DocsDoodads.Import.destinations
            .map(destination => `<option value="${destination}">${destination}</option>`)
            .join('');
        modal.innerHTML = `
            <div style="font-weight: bold; color: #60a5fa; font-size: 14px; margin-bottom: 6px;">IMPORT PROJECT ASSETS</div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 16px;">
                ${supportedCount} supported file(s) found${collected.files.length !== supportedCount ? `; ${collected.files.length - supportedCount} unsupported skipped` : ''}.
            </div>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">Destination</label>
            <select id="dd-import-destination" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="auto">Auto-route by asset type</option>
                ${destinationOptions}
            </select>
            <label style="display: block; font-size: 11px; margin-bottom: 5px; color: #cbd5e1;">When a filename already exists (apply to all)</label>
            <select id="dd-import-collision" style="width: 100%; margin-bottom: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                <option value="rename">Keep both (add numeric suffix)</option>
                <option value="skip">Skip incoming file</option>
                <option value="overwrite">Overwrite existing file</option>
                <option value="error">Cancel batch on collision</option>
            </select>
            <label style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #cbd5e1; margin-bottom: 16px;">
                <input id="dd-import-auto-slice" type="checkbox" /> Open the first imported image in the slicer
            </label>
            <div id="dd-import-warning" style="display: none; color: #fbbf24; font-size: 11px; margin: -6px 0 12px;">
                Overwrite is explicit and transactional; existing files are restored if the batch fails.
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-import-cancel">Cancel</button>
                <button class="dd-btn dd-btn-primary" id="dd-import-confirm">Import</button>
            </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.parentNode && overlay.parentNode.removeChild(overlay);
        const destination = document.getElementById('dd-import-destination');
        const collision = document.getElementById('dd-import-collision');
        const autoSlice = document.getElementById('dd-import-auto-slice');
        const warning = document.getElementById('dd-import-warning');
        const confirmButton = document.getElementById('dd-import-confirm');
        const cancelButton = document.getElementById('dd-import-cancel');
        let activeCancellation = null;

        collision.onchange = () => {
            warning.style.display = collision.value === 'overwrite' ? 'block' : 'none';
        };
        cancelButton.onclick = () => {
            if (activeCancellation) {
                activeCancellation.cancelled = true;
                cancelButton.disabled = true;
                cancelButton.textContent = 'Cancelling…';
            } else {
                close();
            }
        };
        confirmButton.onclick = async () => {
            activeCancellation = { cancelled: false };
            confirmButton.disabled = true;
            destination.disabled = true;
            collision.disabled = true;
            autoSlice.disabled = true;
            const result = await this.runAssetImport(sourcePaths, {
                destination: destination.value,
                collisionPolicy: collision.value,
                autoSlice: Boolean(autoSlice.checked),
                cancellationToken: activeCancellation,
                onProgress: progress => {
                    confirmButton.textContent = `Importing ${progress.completed}/${progress.total}…`;
                }
            });
            activeCancellation = null;
            close();
            this.showToast(DocsDoodads.Import.describeResult(result), result.ok ? 3500 : 6000);
            this.updateIndexStatus();
        };
        overlay.onclick = event => { if (event.target === overlay && !activeCancellation) close(); };
    },

    showConflictModal() {
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 440px; padding: 22px; z-index: 10025; text-align: center;
            border: 2px solid #ef4444;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #ef4444; font-size: 15px; margin-bottom: 10px;">EXTERNAL CONFLICT DETECTED</div>
            <div style="font-size: 12px; line-height: 1.6; color: #cbd5e1; margin-bottom: 18px;">
                The current map file was modified externally (e.g. in the RPG Maker MZ editor) since this workspace session began.<br><br>
                Overwriting now may erase external edits made in MZ.
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button class="dd-btn" id="dd-conf-force" style="background: #b91c1c;">Force Overwrite With Workspace Changes</button>
                <button class="dd-btn" id="dd-conf-reload">Reload Map from Disk (Discard Workspace Staged)</button>
                <button class="dd-btn" id="dd-conf-cancel">Cancel Save</button>
            </div>
        `;
        document.body.appendChild(modal);

        const closeM = () => modal.parentNode && modal.parentNode.removeChild(modal);

        document.getElementById('dd-conf-force').onclick = () => {
            closeM();
            DocsDoodads.Persistence.saveAll(true);
        };
        document.getElementById('dd-conf-reload').onclick = () => {
            closeM();
            const persistence = DocsDoodads.Persistence;
            for (const entry of persistence.pendingMapEntries()) {
                const file = persistence.mapFilePath(entry.mapId);
                persistence.sessionSnapshots[file] = DocsDoodads.FS.stat(file);
            }
            persistence.stagedMaps = {};
            if ($gameMap) { $gameMap._stagedMapData = null; delete $gameMap._stagedMapDataId; }
            persistence.dirtyMap = false;
            persistence.captureSession();
            this.showToast("External Map Data Reloaded!");
        };
        document.getElementById('dd-conf-cancel').onclick = closeM;
    },

    openDiagnosticsModal() {
        const diag = document.createElement('div');
        diag.className = 'dd-glass';
        diag.style.cssText = `
            position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
            width: 440px; padding: 20px; z-index: 10010;
        `;
        diag.innerHTML = `
            <div style="font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 12px;">SYSTEM DIAGNOSTICS</div>
            <div style="font-size: 12px; line-height: 1.8; color: #cbd5e1;">
                <div>Total Indexed Assets: <strong style="color: #fff;">${DocsDoodads.AssetIndex.list.length}</strong></div>
                <div>Thumbnail Cache Count: <strong style="color: #fff;">${Object.keys(DocsDoodads.Thumbnail.cache).length}</strong></div>
                <div>Background Work Queue: <strong style="color: #fff;">${DocsDoodads.Thumbnail.queue.length} jobs</strong></div>
                <div>Undo History Depth: <strong style="color: #fff;">${DocsDoodads.Undo.undoStack.length} actions</strong></div>
                <div>Current Map ID: <strong style="color: #fff;">${$gameMap ? $gameMap.mapId() : 0}</strong></div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="dd-btn dd-btn-primary" id="dd-rebuild-idx-btn" style="flex: 1;">Rebuild Index</button>
                <button class="dd-btn" id="dd-clear-cache-btn" style="flex: 1;">Clear Cache</button>
                <button class="dd-btn" id="dd-close-diag-btn">Close</button>
            </div>
            <button class="dd-btn" id="dd-restore-backup-btn" style="width: 100%; margin-top: 8px; border-color: #f59e0b; color: #fde68a;">Restore Project Backup…</button>
        `;
        document.body.appendChild(diag);

        document.getElementById('dd-rebuild-idx-btn').onclick = async () => {
            DocsDoodads.AssetIndex.data.assets = {};
            await DocsDoodads.AssetIndex.scanAsync({ loadCache: false });
            this.refreshDrawerCards();
            this.showToast("Asset Library Rebuilt!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-clear-cache-btn').onclick = () => {
            DocsDoodads.Thumbnail.cache = {};
            this.showToast("Thumbnail Cache Cleared!");
            diag.parentNode.removeChild(diag);
        };

        document.getElementById('dd-restore-backup-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
            this.showBackupRestoreModal();
        };

        document.getElementById('dd-close-diag-btn').onclick = () => {
            diag.parentNode.removeChild(diag);
        };
    },

    showBackupRestoreModal() {
        const mapFile = `data/Map${String($gameMap ? $gameMap.mapId() : 0).padStart(3, '0')}.json`;
        const targets = [
            { label: 'Current Map', path: mapFile },
            { label: 'Doodads', path: 'data/' + dataFileName },
            { label: 'Asset Library', path: DocsDoodads.AssetIndex.libraryPath }
        ];
        const modal = document.createElement('div');
        modal.className = 'dd-glass';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 480px; padding: 20px; z-index: 10035; border: 1px solid #f59e0b;
        `;
        modal.innerHTML = `
            <div style="font-weight: bold; color: #fde68a; font-size: 14px; margin-bottom: 8px;">RESTORE PROJECT BACKUP</div>
            <div style="font-size: 11px; line-height: 1.5; color: #cbd5e1; margin-bottom: 14px;">
                Backups are validated before restore. The current file is backed up again first so this action remains reversible.
            </div>
            <label style="font-size: 11px; color: #94a3b8;">Project file</label>
            <select id="dd-restore-target" style="width: 100%; margin: 5px 0 12px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;">
                ${targets.map(target => `<option value="${target.path}">${target.label} — ${target.path}</option>`).join('')}
            </select>
            <label style="font-size: 11px; color: #94a3b8;">Backup snapshot</label>
            <select id="dd-restore-source" style="width: 100%; margin: 5px 0 16px; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 7px;"></select>
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
                <button class="dd-btn" id="dd-restore-cancel">Cancel</button>
                <button class="dd-btn" id="dd-restore-confirm" style="background: #b45309;">Restore Selected Backup</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetSelect = document.getElementById('dd-restore-target');
        const backupSelect = document.getElementById('dd-restore-source');
        const restoreButton = document.getElementById('dd-restore-confirm');
        const close = () => modal.parentNode && modal.parentNode.removeChild(modal);
        const refreshBackups = () => {
            const backups = DocsDoodads.FS.listBackups(targetSelect.value);
            backupSelect.innerHTML = '';
            for (const backup of backups) {
                const option = document.createElement('option');
                option.value = backup.path;
                option.textContent = `${new Date(backup.mtimeMs).toLocaleString()} — ${Math.ceil(backup.size / 1024)} KB`;
                backupSelect.appendChild(option);
            }
            restoreButton.disabled = backups.length === 0;
            if (backups.length === 0) {
                const option = document.createElement('option');
                option.textContent = 'No backups available for this file';
                backupSelect.appendChild(option);
            }
        };
        targetSelect.onchange = refreshBackups;
        document.getElementById('dd-restore-cancel').onclick = close;
        restoreButton.onclick = () => {
            if (!backupSelect.value) return;
            const targetPath = targetSelect.value;
            if (!confirm(`Restore ${targetPath} from the selected backup?`)) return;
            const result = DocsDoodads.FS.restoreBackup(targetPath, backupSelect.value);
            if (!result.ok) {
                this.showToast(`Restore failed: ${result.error}`);
                return;
            }

            if (targetPath === DocsDoodads.AssetIndex.libraryPath) {
                DocsDoodads.AssetIndex.init();
                this.refreshDrawerCards();
            } else if (targetPath === 'data/' + dataFileName) {
                window.$dataDocsDoodads = DocsDoodads.FS.readJson(targetPath) || {};
                DocsDoodads.migrateData(window.$dataDocsDoodads, 'doodads');
                this.refreshSpriteset();
            } else if (targetPath === mapFile && window.$gameMap) {
                $gameMap._stagedMapData = DocsDoodads.FS.readJson(targetPath);
                $gameMap._stagedMapDataId = $gameMap.mapId();
                DocsDoodads.Persistence.captureSession();
            }
            close();
            this.showToast('Backup restored. Reload the current map before continuing edits.');
        };
        refreshBackups();
    },

    showRecoveryNotices() {
        const notices = DocsDoodads.FS.takeRecoveryNotices();
        if (notices.length > 0) this.showToast(notices.join(' '), 9000);
    },

    showToast(msg, duration = 2200) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #2563eb; color: #fff; padding: 8px 16px; border-radius: 20px;
            font-size: 12px; font-weight: bold; z-index: 10030; box-shadow: 0 4px 14px rgba(0,0,0,0.5);
            pointer-events: none; transition: opacity 0.3s;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.parentNode && toast.parentNode.removeChild(toast), 300);
        }, duration);
    },

    updateUndoButtons() {
        const uBtn = document.getElementById('dd-undo-btn');
        const rBtn = document.getElementById('dd-redo-btn');
        if (uBtn) uBtn.style.opacity = DocsDoodads.Undo.undoStack.length > 0 ? '1' : '0.5';
        if (rBtn) rBtn.style.opacity = DocsDoodads.Undo.redoStack.length > 0 ? '1' : '0.5';
    }
};

//==========================================================
// SECTION 25: SCENE_MAP INTEGRATION & KEY BINDINGS
//==========================================================
if (typeof Scene_Map !== 'undefined') {
    $.Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        $.Scene_Map_onMapLoaded.call(this);
        DocsDoodads.Workspace.onMapLoaded();
    };
}

DocsDoodads.isEditableTarget = function(target) {
    return Boolean(target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable));
};

// While the workspace is open the game world is frozen: clicks in editor panels must not
// walk the player, events must not wander or trigger, and the menu must stay closed.
if (typeof Game_Player !== 'undefined') {
    $.Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (DocsDoodads.Workspace.mounted) return false;
        return $.Game_Player_canMove.call(this);
    };
}
if (typeof Game_Event !== 'undefined') {
    $.Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        if (DocsDoodads.Workspace.mounted) return;
        $.Game_Event_updateSelfMovement.call(this);
    };
}
if (typeof Game_Map !== 'undefined') {
    // Staged event edits belong to the map they were made on; park them when another map loads.
    $.Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        if (this === window.$gameMap && this._mapId && this._mapId !== mapId) {
            DocsDoodads.Persistence.onMapChanging(this._mapId, mapId);
        }
        $.Game_Map_setup.call(this, mapId);
    };
    $.Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        if (DocsDoodads.Workspace.mounted) return true;
        return $.Game_Map_isEventRunning.call(this);
    };
}
// MZ's TouchInput cancels every wheel event on the document, which stops the asset grid,
// tab bar, and inspector lists from scrolling. The game has no use for the wheel while editing.
if (typeof TouchInput !== 'undefined' && typeof TouchInput._onWheel === 'function') {
    $.TouchInput__onWheel = TouchInput._onWheel;
    TouchInput._onWheel = function(event) {
        if (DocsDoodads.Workspace.mounted) return;
        $.TouchInput__onWheel.call(this, event);
    };
}
// MZ's Input listens on the whole document and prevents Backspace/arrows by default,
// which breaks typing in workspace fields and lets keystrokes drive the game.
if (typeof Input !== 'undefined' && typeof Input._onKeyDown === 'function') {
    $.Input__onKeyDown = Input._onKeyDown;
    Input._onKeyDown = function(event) {
        if (DocsDoodads.Workspace.mounted && DocsDoodads.isEditableTarget(event.target)) return;
        $.Input__onKeyDown.call(this, event);
    };
}

// Windows Explorer native drag and drop import listener with transactional options modal
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('dragover', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
        }
    });

    window.addEventListener('drop', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        if (DocsDoodads.Workspace.mounted) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const sourcePaths = [];
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const f = e.dataTransfer.files[i];
                    if (f.path) sourcePaths.push(f.path);
                }
                if (sourcePaths.length > 0) DocsDoodads.Workspace.showAssetImportModal(sourcePaths);
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!editorMode || !DocsDoodads.Compat.isTest() || !DocsDoodads.Compat.isNwjs()) return;
        // editKey is a KeyboardEvent.code ("F10"), which Input.keyMapper never reports, so opening is handled here.
        if (e.code === editKey) {
            const onMap = typeof Scene_Map !== 'undefined' && typeof SceneManager !== 'undefined' && SceneManager._scene instanceof Scene_Map;
            if (!DocsDoodads.Workspace.mounted && !onMap) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggle();
            return;
        }
        if (!DocsDoodads.Workspace.mounted || DocsDoodads.isEditableTarget(e.target)) return;
        if (DocsDoodads.Slicing.Editor.modal) return; // the slicer owns undo/delete while it is open
        if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
            e.preventDefault();
            DocsDoodads.Undo.undo();
        } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
            e.preventDefault();
            DocsDoodads.Undo.redo();
        } else if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            DocsDoodads.Persistence.saveAll();
        } else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
            e.preventDefault();
            DocsDoodads.Workspace.duplicateSelectedDoodad();
        } else if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            DocsDoodads.Workspace.showCommandPalette();
        } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
            e.preventDefault();
            DocsDoodads.Workspace.copySelected();
        } else if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            DocsDoodads.Workspace.pasteCopied();
        } else if (e.key === 'Delete') {
            if (DocsDoodads.Workspace.selectedEvent) {
                DocsDoodads.Workspace.deleteSelectedEvent();
            } else {
                DocsDoodads.Workspace.deleteSelectedDoodad();
            }
        } else if (e.key === 'g' || e.key === 'G') {
            e.preventDefault();
            DocsDoodads.Workspace.toggleGrid();
        } else if (e.key === 'h' || e.key === 'H') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.toggleInspector();
        } else if (e.key === 'f' || e.key === 'F') {
            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            e.preventDefault();
            DocsDoodads.Workspace.focusSearch();
        } else if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const items = (DocsDoodads.Workspace.selectedDoodads && DocsDoodads.Workspace.selectedDoodads.length > 0 ? DocsDoodads.Workspace.selectedDoodads : (DocsDoodads.Workspace.selectedDoodad ? [DocsDoodads.Workspace.selectedDoodad] : [])).filter(d => !d.locked);
            if (items.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 16 : 1;
                items.forEach(d => {
                    if (e.key === 'ArrowLeft') d.x -= step;
                    if (e.key === 'ArrowRight') d.x += step;
                    if (e.key === 'ArrowUp') d.y -= step;
                    if (e.key === 'ArrowDown') d.y += step;
                });
                if (SceneManager._scene && SceneManager._scene._spriteset) {
                    SceneManager._scene._spriteset.sortDocsDoodads();
                }
                DocsDoodads.Workspace.refreshInspector();
            } else if (DocsDoodads.Workspace.selectedEvent) {
                e.preventDefault();
                const evInfo = DocsDoodads.Workspace.selectedEvent;
                const ge = evInfo.gameEvent;
                const ev = evInfo.stagedEvent || (ge && ge.event());
                if (ev) {
                    const oldX = ev.x, oldY = ev.y;
                    let nx = ev.x, ny = ev.y;
                    if (e.key === 'ArrowLeft') nx--;
                    if (e.key === 'ArrowRight') nx++;
                    if (e.key === 'ArrowUp') ny--;
                    if (e.key === 'ArrowDown') ny++;
                    ev.x = nx; ev.y = ny;
                    if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; }
                    DocsDoodads.Undo.execute({
                        type: 'move_event',
                        apply: () => { ev.x = nx; ev.y = ny; if (ge) { ge._x = nx; ge._y = ny; ge._realX = nx; ge._realY = ny; } },
                        revert: () => { ev.x = oldX; ev.y = oldY; if (ge) { ge._x = oldX; ge._y = oldY; ge._realX = oldX; ge._realY = oldY; } }
                    });
                    DocsDoodads.Workspace.refreshInspector();
                }
            }
        } else if (DocsDoodads.Workspace.placementTool === 'path' && (e.key === 'Enter' || e.key === 'Backspace')) {
            e.preventDefault();
            if (e.key === 'Enter') DocsDoodads.Workspace.finishPath();
            else DocsDoodads.Workspace.pathPoints.pop();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            DocsDoodads.Workspace.setPlacementTool(null);
            DocsDoodads.Workspace.removeGhost();
            DocsDoodads.Workspace.selectDoodad(null);
        }
    });
}

// Auto-recovery heartbeat
if (autosaveRecoveryInterval > 0 && typeof window !== 'undefined') {
    const recoveryTimer = setInterval(() => {
        if (editorMode && DocsDoodads.Compat.isTest() && window.$gameMap && (DocsDoodads.Persistence.dirtyMap || DocsDoodads.Persistence.dirtyDoodads)) {
            const recoveryData = {
                timestamp: Date.now(),
                mapId: $gameMap.mapId(),
                doodads: DocsDoodads.doodads(),
                mapSettings: window.$dataDocsDoodads ? window.$dataDocsDoodads.mapSettings : undefined,
                world: window.$dataDocsDoodads ? window.$dataDocsDoodads.world : undefined,
                stagedMap: $gameMap._stagedMapData
            };
            DocsDoodads.FS.atomicWriteJson('data/DocsDoodadsRecovery.json', recoveryData);
        }
    }, autosaveRecoveryInterval * 1000);
    if (recoveryTimer && typeof recoveryTimer.unref === 'function') {
        recoveryTimer.unref();
    }
}

})(DocsDoodads.reWrite);
