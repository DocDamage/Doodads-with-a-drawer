> **Archived (October 2026).** This is the original phased plan for the asset workspace and editor, written before most of what the plugin does now (atmosphere, post-processing, VFX, sound, visual equipment, the 3D view). It is kept for history. For what the plugin is today, read the [User Guide](../../Docs_Doodads_Guide.md), the [Changelog](../../CHANGELOG.md) and [Recommendations](../../RECOMMENDATIONS.md); for how the code is laid out, see the README.

# Doc's Doodads
## Highly Detailed Phased Implementation Plan

**Project:** Doc's Doodads (began as an RPG Maker MZ enhancement of Qiu Jiu's QJ-Doodads)  
**Naming note:** This plan predates the rename. References to QJ-Doodads describe the upstream baseline the project grew from.  
**Primary source plugin:** `Docs-Doodads.js`  
**Primary target:** RPG Maker MZ  
**Secondary target:** RPG Maker MV where compatibility is practical and does not compromise MZ  
**Delivery model:** One installable JavaScript plugin file, with project-side JSON/cache files generated automatically  
**Working name:** **Doc's Doodads**  
**Document purpose:** Build-ready implementation handoff and phased development plan

---

# 1. Executive Summary

The goal is to evolve QJ-Doodads from an in-game doodad editor into an **MZ-native-feeling Asset Workspace** without attempting to replace RPG Maker MZ itself.

The upgraded plugin should preserve the existing strengths of QJ-Doodads:

- in-game/test-play editing
- free placement
- grid snapping
- doodad editing
- current map integration
- IconSet support
- tileset selection
- animated doodads
- doodad JSON persistence
- recursive filesystem access through NW.js/Node
- existing doodad runtime compatibility

The main improvements are:

1. **A dockable, movable, resizable visual asset drawer**
2. **Automatic sprite-sheet detection and slicing**
3. **Non-destructive slice metadata with optional PNG export**
4. **Fast search, tags, categories, favorites, collections, recent items, and filters**
5. **10,000+ asset scalability**
6. **Direct drag-and-drop from the asset drawer onto the map/workspace**
7. **Intelligent placement behavior**
8. **Automatic creation of real MZ events when needed**
9. **Reusable event templates**
10. **Collision presets and direct doodad collision**
11. **Multiple saved workspace layouts**
12. **Modern editor operations: undo/redo, duplicate, align, distribute, group, lock, hide, etc.**
13. **Direct Windows Explorer import**
14. **Strong project-file conflict protection, backups, atomic saves, and recovery**
15. **Editor-only asset tooling while retaining runtime doodad behavior in deployed games**
16. **Optional MV compatibility through a compatibility layer**

The project must remain focused. It is **not** intended to become a replacement database editor, dialogue editor, combat editor, quest editor, or full RPG Maker IDE.

---

# 2. Final Product Definition

## 2.1 Product statement

> **Doc's Doodads** is a visual asset-driven mapping and event-placement workspace for RPG Maker MZ that lets the user browse, search, preview, slice, organize, drag, drop, place, and configure project assets without relying on MZ's traditional sprite-sheet selection workflow.

The target experience should feel like **RPG Maker MZ with a much better asset browser and placement workflow**, not like Unity or Godot transplanted wholesale into RPG Maker.

---

# 3. Hard Scope Boundaries

## 3.1 In scope

- Doodad placement and editing
- normal MZ project asset folders
- visual asset browsing
- sprite-sheet detection
- atlas metadata parsing
- manual slice correction
- sprite-region persistence
- optional slice export
- character-sheet decomposition
- tileset region browsing
- event creation
- event templating
- direct map placement
- collision presets
- audio preview and event-command insertion
- drag-and-drop import
- asset metadata
- search/indexing
- custom collections
- favorites
- recent assets
- saved workspace layouts
- undo/redo
- safe writes to MZ map JSON
- autosave recovery
- backups
- change/conflict detection
- performance scaling for 10,000+ assets

## 3.2 Explicitly out of scope

Do not turn this project into:

- a replacement database editor
- a full MZ IDE
- an AI/cloud asset classifier
- a level scripting language
- a full animation editor
- a complete game-object/component system
- a general-purpose 2D engine
- a combat-system editor
- a dialogue editor
- a quest graph editor
- a plugin manager replacement
- a deployment/export manager
- a replacement autotile engine unless a proven improvement is found later

The product must remain centered on **asset discovery, slicing, placement, map editing, and event creation**.

---

# 4. Existing QJ-Doodads Baseline

The current plugin already provides a useful foundation.

Important existing capabilities include:

- editor activation through a hotkey
- editor-only behavior
- Upstream QJ-Doodads data structures
- recursive image-folder scanning
- Node `fs` usage
- doodad JSON save/load
- map-position and screen-position modes
- scaling
- rotation
- opacity
- color adjustments
- animation frame counts
- frame timing
- switch/condition visibility
- IconSet selection
- tileset region selection
- free map placement
- grid snapping
- multi-selection
- copy/paste
- delete
- map import of doodads
- current-map runtime rendering
- collision/body calculations through SAT-style geometry
- UltraMode7 compatibility hooks

The existing image selector is functionally closer to a folder list than a modern asset browser. The upgrade should replace that workflow while preserving compatibility with existing doodad data.

---

# 5. Core Architectural Rule: One Plugin, Internal Modules

The user wants one self-contained tool.

Therefore the deliverable should remain:

```text
js/plugins/Docs-Doodads.js
```

or a renamed successor if migration is desired later.

However, internally the file should be organized into clear logical modules.

Recommended namespace structure:

```text
DocsDoodads
DocsDoodads.Core
DocsDoodads.Compat
DocsDoodads.FS
DocsDoodads.AssetIndex
DocsDoodads.AssetCache
DocsDoodads.Metadata
DocsDoodads.Thumbnail
DocsDoodads.Search
DocsDoodads.Workspace
DocsDoodads.Layout
DocsDoodads.Drawer
DocsDoodads.Inspector
DocsDoodads.DragDrop
DocsDoodads.Placement
DocsDoodads.Events
DocsDoodads.EventTemplates
DocsDoodads.Collision
DocsDoodads.Slicing
DocsDoodads.Slicing.Metadata
DocsDoodads.Slicing.Grid
DocsDoodads.Slicing.Visual
DocsDoodads.Slicing.Editor
DocsDoodads.Audio
DocsDoodads.Import
DocsDoodads.Export
DocsDoodads.Undo
DocsDoodads.Persistence
DocsDoodads.Recovery
DocsDoodads.Diagnostics
```

The final JS may remain one physical file, but development should treat these as isolated subsystems.

---

# 6. Generated Project Files

The plugin itself remains one file, but runtime/editor metadata should not be forced into the plugin source.

Recommended generated files:

```text
data/
  DocsDoodads.json
  DocsDoodadsLibrary.json
  DocsDoodadsEventTemplates.json
  DocsDoodadsLayouts.json
  DocsDoodadsRecovery.json
```

Optional cache directory:

```text
data/docs_doodads_cache/
  thumbnails/
  analysis/
  temp/
```

If hidden folders create compatibility problems, use:

```text
data/docs_doodads_cache/
```

The cache must be disposable. Deleting it must not destroy authoring work.

---

# 7. Asset Library Data Model

## 7.1 `DocsDoodadsLibrary.json`

This becomes the central project metadata index.

Recommended top-level structure:

```json
{
  "version": 1,
  "projectId": "generated-project-id",
  "generatedAt": 0,
  "assets": {},
  "collections": {},
  "settings": {},
  "indexState": {}
}
```

## 7.2 Asset entry

Recommended conceptual shape:

```json
{
  "id": "stable-asset-id",
  "path": "img/characters/Monsters/Skeleton.png",
  "type": "character_sheet",
  "category": "Characters",
  "subcategories": ["Monsters", "Undead"],
  "fileName": "Skeleton.png",
  "extension": ".png",

  "mtimeMs": 0,
  "sizeBytes": 0,
  "hash": null,

  "width": 0,
  "height": 0,

  "tags": [],
  "autoTags": [],
  "favorite": false,
  "collections": [],

  "slice": {
    "status": "known|auto|manual|none",
    "method": "mz_standard|metadata|grid|visual|manual",
    "confidence": 0.0,
    "sourceHash": null,
    "regions": []
  },

  "animationGroups": [],
  "placement": {
    "defaultMode": "doodad|event|tile|picture|audio|ask",
    "rememberEventPrompt": null,
    "defaultAnchorX": 0.5,
    "defaultAnchorY": 1.0,
    "defaultScaleX": 1.0,
    "defaultScaleY": 1.0,
    "defaultZ": 0
  },

  "collision": {
    "preset": "none",
    "shape": null
  },

  "usage": {
    "lastUsedAt": 0,
    "useCount": 0
  },

  "notes": ""
}
```

## 7.3 Slice region

```json
{
  "id": "region-uuid",
  "name": "Skeleton_01",
  "x": 0,
  "y": 0,
  "w": 48,
  "h": 48,
  "pivotX": 0.5,
  "pivotY": 1.0,
  "rotated": false,
  "trimmed": false,
  "sourceW": 48,
  "sourceH": 48,
  "sourceOffsetX": 0,
  "sourceOffsetY": 0,
  "manual": false
}
```

## 7.4 Important persistence rule

Manual slice corrections are authoritative.

If:

```text
source PNG hash unchanged
```

then never silently replace a user's manual slice definition.

If the source changes:

```text
old hash != new hash
```

mark:

```text
Slice metadata stale
```

and offer:

- Re-analyze
- Keep old regions
- Compare
- Reset

---

# 8. Asset Indexing Strategy for 10,000+ Assets

The current recursive filesystem scan is useful but must be replaced with an incremental indexed model.

## 8.1 Indexed roots

At minimum:

```text
img/animations
img/battlebacks1
img/battlebacks2
img/characters
img/enemies
img/faces
img/parallaxes
img/pictures
img/sv_actors
img/sv_enemies
img/system
img/tilesets
img/titles1
img/titles2
img/doodads

audio/bgm
audio/bgs
audio/me
audio/se
```

The plugin should tolerate missing folders.

## 8.2 Index stages

### Stage A: ultra-fast file enumeration

Gather only:

- path
- filename
- extension
- file size
- modified time
- folder/category

Do not decode every image.

### Stage B: compare against cache

If:

```text
path + size + mtime unchanged
```

reuse cached metadata.

### Stage C: metadata queue

For new/changed files:

- determine dimensions
- determine basic type
- generate auto-tags
- detect known MZ naming conventions
- enqueue thumbnail generation

### Stage D: lazy heavy analysis

Only run heavy sprite analysis when:

- user opens a sheet
- user drags a sheet needing slices
- thumbnail requires region understanding
- asset is visible and missing analysis
- user explicitly selects Auto Slice

Do not visually analyze all 10,000 assets at launch.

---

# 9. Background Work Queue

Implement a lightweight cooperative job scheduler.

Example priorities:

```text
Priority 0: user-visible interaction
Priority 1: active asset analysis
Priority 2: visible drawer thumbnails
Priority 3: recent/favorite thumbnails
Priority 4: general metadata enrichment
Priority 5: idle cache generation
```

Jobs should be chunked so the game loop does not freeze.

Suggested update budget:

```text
2–6 ms of background work per frame
```

with an adjustable editor performance setting.

Heavy image analysis can use:

- Canvas `ImageData`
- typed arrays
- chunked loops
- optional Web Worker only if NW.js/MZ compatibility is proven stable

Do not make Web Workers a hard dependency.

---

# 10. Workspace UX

## 10.1 Default layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Toolbar / Search / Layout / Save / Undo / Redo              │
├────────────────┬───────────────────────────┬─────────────────┤
│ Asset Drawer   │                           │ Inspector       │
│                │       Map Workspace       │                 │
│ thumbnails     │                           │ selection props │
│ filters        │                           │ placement props │
│ collections    │                           │ collision       │
│ tags           │                           │ events          │
├────────────────┴───────────────────────────┴─────────────────┤
│ Status / tasks / analysis / warnings / coordinates          │
└──────────────────────────────────────────────────────────────┘
```

## 10.2 Panel capabilities

Every main panel should support:

- drag repositioning
- resize
- dock left
- dock right
- dock bottom
- collapse
- tabs
- close/hide
- restore
- persisted state

## 10.3 Multiple saved layouts

Built-in layouts:

- Mapping
- Events
- Characters
- Tiles
- Compact

User-defined layouts should also be supported.

Layout stores:

```json
{
  "name": "Mapping",
  "panels": {
    "drawer": {},
    "inspector": {},
    "status": {}
  },
  "thumbnailSize": 96,
  "drawerMode": "grid"
}
```

---

# 11. Asset Drawer

## 11.1 Core views

Support:

- thumbnail grid
- compact grid
- list mode
- collection mode
- folder tree mode

## 11.2 Thumbnail size

Adjustable slider, for example:

```text
32 px → 256 px
```

Recommended default:

```text
96 px
```

## 11.3 Card information

Each visual asset card can show:

- thumbnail
- filename
- category icon
- slice count
- animation badge
- favorite marker
- confidence indicator
- event placement indicator
- warning badge
- collision badge

Do not overload the card visually; details belong in hover tooltip/inspector.

## 11.4 Hover behavior

On hover:

- show larger preview
- show dimensions
- show category
- show tags
- show slice confidence
- animate detected animation only while hovered
- show usage count if desired

Animated previews should not run continuously for thousands of items.

---

# 12. Search and Filtering

## 12.1 Search requirements

Search must be:

- incremental
- fuzzy
- tag-aware
- category-aware
- folder-aware
- fast for 10,000+ entries

Examples:

```text
ske kni
tree forest -dead
type:character undead
tag:castle favorite:true
animated:true torch
folder:interior chair
```

## 12.2 Tokenized query language

Minimum operators:

```text
type:
tag:
folder:
favorite:
animated:
used:
confidence:
-event
```

Plain terms use fuzzy filename/tag matching.

## 12.3 Search indexing

Maintain lowercase normalized tokens:

```text
searchText
tagSet
folderTokens
fileNameTokens
```

Avoid repeatedly rebuilding strings during every keystroke.

---

# 13. Tags and Categories

## 13.1 Automatic tags

Derive initial tags from:

- MZ folder
- nested folders
- filename
- known naming patterns

Example:

```text
img/characters/Monsters/Undead/Skeleton_Knight.png
```

Auto-tags:

```text
character
characters
monster
monsters
undead
skeleton
knight
```

## 13.2 Manual tags

User tags should be stored separately from auto-tags so auto-index refreshes do not destroy them.

## 13.3 Virtual collections

An asset can appear in multiple collections without file duplication.

Examples:

```text
Castle Set
Forest Set
Dungeon Essentials
Town Props
Favorite NPCs
Boss Assets
```

---

# 14. Sprite Slicing System: Overall Priority

The slicing system must not rely on one algorithm.

Detection priority:

```text
1. Saved authoritative slice metadata
2. Known RPG Maker format
3. Sidecar atlas metadata
4. Fixed-grid inference
5. Visual auto-detection
6. Manual correction
```

This reduces false positives and unnecessary computation.

---

# 15. Known RPG Maker Format Detection

Implement exact or near-exact recognition for:

- `$Character.png`
- normal 8-character walking sheets
- single-character sheets
- `!` character naming behavior
- faces
- IconSet
- SV actors
- SV enemies where appropriate
- tileset formats
- animation sheets where structure is known

## 15.1 Character drawer behavior

A normal multi-character sheet should appear as individual logical character assets.

The physical file is not duplicated.

Example:

```text
People1.png
  ├─ People1 #1
  ├─ People1 #2
  ├─ ...
  └─ People1 #8
```

Dragging an individual logical character should preserve:

- correct character filename
- correct character index
- default direction
- default frame
- event graphic configuration

The user should not see MZ's normal character-sheet selection dialog.

---

# 16. Atlas Metadata Readers

Before visual analysis, inspect for sidecar metadata.

Initial support targets:

- Aseprite JSON array/hash
- TexturePacker JSON array/hash
- generic atlas JSON when recognizable
- `.saf.json` optionally
- Phaser-style JSON optionally

## 16.1 Metadata may provide

- frame name
- x/y
- width/height
- rotation
- trimming
- source size
- sprite source offset
- pivot
- animation/frame grouping

Exact metadata should outrank heuristic visual detection.

---

# 17. Fixed Grid Detector

The fixed-grid detector handles sheets with no transparent spacing.

It should consider candidate cell sizes based on:

- common MZ dimensions
- image divisors
- repeated vertical boundaries
- repeated horizontal boundaries
- repeated occupancy patterns
- repeated sprite extents
- rows/columns provided by user

## 17.1 Candidate scoring

For each grid candidate score:

- divisibility
- cell occupancy consistency
- alpha distribution consistency
- repeated frame dimensions
- row/column symmetry
- likely MZ format
- edge alignment

The best candidate can be shown as:

```text
Grid detected: 8 × 4
Confidence: 96%
```

---

# 18. Visual Detector

The main visual detector should use proven image-analysis techniques implemented in JavaScript/Canvas-compatible logic.

Do not blindly port SkiaSharp code.

The design should preserve the algorithmic ideas while remaining appropriate for RPG Maker/NW.js.

---

# 19. Visual Detector Pipeline

## 19.1 Step 1: Load image pixels

Use Canvas:

```js
ctx.drawImage(image, 0, 0);
const imageData = ctx.getImageData(0, 0, width, height);
const rgba = imageData.data;
```

Prefer typed-array processing.

## 19.2 Step 2: safety limits

Reject or warn on extremely large images.

Suggested defaults:

```text
max width: 16384
max height: 16384
max pixels: ~67 million
```

Allow configuration, but protect memory.

## 19.3 Step 3: determine background mode

Modes:

```text
Auto
Alpha Only
Border Connected
Grid
Manual
```

Auto logic:

```text
if border has meaningful transparency:
    use alpha foreground
else:
    attempt border-connected background removal
```

## 19.4 Step 4: adaptive alpha threshold

Implement alpha histogram analysis.

Goal:

- ignore faint background residue
- preserve semi-transparent sprite details
- avoid a sheet-wide low-alpha bridge

A practical implementation can adapt Otsu-style threshold selection.

Do not require the user to understand this setting.

Advanced slicer exposes:

```text
Alpha threshold
Auto threshold
```

## 19.5 Step 5: border-connected background removal

For opaque or colored backgrounds:

1. seed from image borders
2. flood through pixels close in color
3. allow transparent pixels as background
4. mark non-background opaque pixels as foreground

Configurable:

```text
background color tolerance
```

This helps with:

- white background sprite sheets
- gray backgrounds
- slightly noisy backgrounds
- exported atlas previews

## 19.6 Step 6: morphology/noise cleanup

Provide optional morphological opening:

```text
erode → dilate
```

Purpose:

- remove isolated pixels
- break one-pixel bridges
- reduce compression/noise artifacts

Presets:

```text
Pixel Art: radius 0
Clean: radius 0–1
Messy: radius 1
Aggressive: radius 2
```

Never default to destructive values for pixel art.

## 19.7 Step 7: connected components

Perform 4-connected component labeling.

For each component track:

```text
pixelCount
minX
minY
maxX
maxY
bounds
```

Reject tiny noise below `minimumArea`, but keep rejected components available for detached-detail recovery.

## 19.8 Step 8: proximity grouping

Nearby components may belong to one sprite.

Examples:

- sword separated from hand
- floating hair strand
- shadow
- antenna
- spark
- detached accessory

Use proximity and ownership rules.

Do not simply merge every rectangle within a fixed distance.

## 19.9 Step 9: unambiguous fragment ownership

For each small fragment:

```text
find nearby qualifying sprites
```

If exactly one valid owner:

```text
attach fragment
```

If multiple equal/near-equal owners:

```text
leave unassigned
```

This avoids merging adjacent characters through a shared fragment.

## 19.10 Step 10: seeded growth

For difficult semi-transparent sheets:

1. identify strong foreground markers
2. identify weaker support pixels
3. grow markers into support pixels
4. limit growth radius
5. avoid crossing into another owner

This is useful for:

- soft shadows
- glows
- smoke
- anti-aliased edges
- AI-generated sprite sheets

## 19.11 Step 11: detached detail recovery

After main regions exist, inspect nearby rejected foreground.

Attach only if ownership is unambiguous and detail size is reasonable.

## 19.12 Step 12: gutter splitting

Vertical low-occupancy gutters can separate difficult connected regions.

Our implementation should use this for:

- vertical gutters
- horizontal gutters

A valid gutter should consider:

- low occupancy
- minimum width/height
- meaningful content on both sides
- marker balance
- resulting region viability

This helps when two sprites are joined by:

- shadow
- glow
- stray pixel bridges
- near-touching artwork

## 19.13 Step 13: region expansion/padding

Optional source padding:

```text
0–N pixels
```

Clip to image bounds.

## 19.14 Step 14: sort regions

Default ordering:

```text
top-to-bottom
left-to-right
```

For strong grid inference, preserve row/column order.

---

# 20. Do Not Copy Art-Specific Heuristics Blindly

Some sprite detection tools contain color-specific glow recovery.

The implementation must remain general.

Use:

- alpha confidence
- local connectivity
- distance
- ownership
- edge strength
- region consistency

Do not make blue effects inherently easier to detect than orange, red, green, white, etc.

---

# 21. Detection Presets

User-facing presets:

## Auto

Automatically chooses strategy.

## MZ Format

For known RPG Maker structures.

## Clean Transparent

Fast alpha/component analysis.

## Pixel Art

- low/no morphology
- low minimum area
- preserve tiny components
- exact nearest-neighbor preview

## Opaque Background

Border flood removal.

## Messy / Generated

- adaptive threshold
- noise cleanup
- seeded growth
- detached recovery
- gutter analysis

## Grid

Rows/columns/cell structure.

## Irregular Atlas

Component/grouping-heavy mode.

## Manual

No auto-detection.

The default remains **Auto**.

---

# 22. Confidence Scoring

Every detection should return:

```text
method
confidence
warnings
metrics
```

Example:

```text
24 sprites detected
Confidence: 97%
Method: Grid + Alpha Validation
```

## 22.1 Confidence signals

Positive signals:

- repeated dimensions
- regular spacing
- exact MZ dimensions
- consistent row height
- consistent column width
- high explained pixel coverage
- metadata match
- animation-like repetition
- low ambiguity

Negative signals:

- unexplained visible pixels
- large ambiguous fragments
- overlapping regions
- giant connected regions
- inconsistent dimensions
- boundary clipping
- too many tiny components
- uncertain background
- suspicious gutter splits

## 22.2 UI thresholds

Example:

```text
90–100%  green / safe
75–89%   normal / review optional
50–74%   warning / review recommended
0–49%    manual review strongly recommended
```

Do not automatically hide low-confidence problems.

---

# 23. Sprite Sheet Editor

Double-clicking or choosing **Edit Slices** opens the slicer.

## 23.1 Layout

```text
┌────────────────────────────────────────────────────────┐
│ Auto Slice | Grid | Add | Delete | Merge | Split       │
├───────────────────────────────────┬────────────────────┤
│                                   │ Region List        │
│         Zoomable Canvas           │ X Y W H            │
│                                   │ Name               │
│       Detected Boundaries         │ Pivot              │
│                                   │ Animation Group    │
├───────────────────────────────────┴────────────────────┤
│ Zoom | Alpha | Merge Dist | Noise | Confidence         │
└────────────────────────────────────────────────────────┘
```

## 23.2 Canvas features

- zoom to at least 1600%
- pan
- checkerboard transparency
- pixel grid at high zoom
- region overlays
- selected region highlight
- labels
- guides
- snapping
- optional underlying grid

## 23.3 Region handles

Eight handles:

```text
top-left
top
top-right
right
bottom-right
bottom
bottom-left
left
```

## 23.4 Smart snapping

When resizing, snap to:

- image boundary
- neighboring region boundary
- detected grid
- original boundary
- user guides

Show alignment guide lines.

## 23.5 Manual operations

- add region
- delete region
- duplicate region
- merge regions
- split vertical
- split horizontal
- same width
- same height
- same size
- align left/right/top/bottom
- distribute horizontally
- distribute vertically
- rename
- reorder
- set pivot
- set padding
- make animation group
- remove from animation group

## 23.6 Undo

Every slicer operation must be undoable.

---

# 24. Animation Detection

## 24.1 Sources

Detect animation from:

- filename numbering
- metadata tags
- repeated region dimensions
- regular rows
- regular columns
- user grouping

## 24.2 Animation metadata

```json
{
  "id": "anim-id",
  "name": "Torch",
  "regions": ["r1", "r2", "r3", "r4"],
  "mode": "loop",
  "fps": 8,
  "direction": "forward"
}
```

Modes:

```text
loop
once
ping-pong
random
```

## 24.3 Drawer preview

Static normally.

Animate only:

- on hover
- when selected
- in inspector

---

# 25. Export Slices

Non-destructive region metadata is the default.

Actual PNG creation is an explicit command.

Supported export modes:

- selected region
- selected regions
- all regions
- animation strip
- individual PNG files
- new MZ-compatible character sheet where valid
- atlas/metadata export where practical

## 25.1 PNG export algorithm

For each region:

1. create offscreen canvas
2. set canvas to region width/height
3. draw source subrectangle
4. `toDataURL` or Blob/buffer conversion
5. write PNG through Node filesystem
6. handle filename collisions

Naming:

```text
Skeleton_000.png
Skeleton_001.png
...
```

or region names when defined.

---

# 26. Asset Placement Architecture

Dragging from the drawer should create a **placement payload**.

Example:

```js
{
  assetId,
  sourcePath,
  logicalRegionId,
  assetType,
  placementMode,
  eventTemplateId,
  collisionPreset,
  modifiers
}
```

The workspace interprets the drop destination.

---

# 27. Placement Modes

Every asset supports:

```text
Auto
Doodad
Event
Character
Picture
Tile
Audio
Other
```

Right-click:

```text
Place As →
```

always overrides automatic behavior.

---

# 28. Default Placement Behavior

## Doodad / decorative prop

Default:

```text
free placement
```

If the asset has not been classified before:

```text
Does this object need an event?
[Yes] [No] [Yes & Remember] [No & Remember]
```

If No:

```text
create doodad
```

If Yes:

```text
create real MZ event
```

## Character

Default:

```text
create real MZ event
```

with correct character sheet/index.

## Tile

Default:

```text
tile snapped
```

Use MZ tile rules where possible.

## Picture/UI

Default:

```text
free/pixel placement
```

## Audio

Never creates content merely because it was selected.

Drop behavior:

- BGM/BGS on map → offer event that plays it
- SE/ME on map → offer event command
- audio on existing event → offer append command
- click/hover → preview

---

# 29. Real MZ Event Creation

This is a critical feature.

Created events must be genuine entries in:

```text
data/MapXXX.json
```

so they remain editable in normal RPG Maker MZ.

## 29.1 Event creation must handle

- event ID allocation
- x/y
- name
- note
- pages
- page conditions
- image
- move type
- move route
- speed
- frequency
- walk animation
- step animation
- direction fix
- through
- priority type
- trigger
- event command list

## 29.2 Safe ID allocation

Find:

```text
first unused positive index
```

Do not assume:

```text
events.length
```

is always free.

---

# 30. Built-in Event Templates

Initial built-ins:

- NPC
- Door
- Transfer Door
- Chest
- Loot Pickup
- Sign
- Switch
- Lever
- Save Point
- Shopkeeper
- Enemy Encounter
- Harvestable
- Breakable Object
- Pushable Object
- Light Source
- Animated Prop
- Teleporter
- Ladder/Stairs
- Vehicle
- Decoration Event

Templates should be plain MZ event structures plus parameter placeholders.

---

# 31. Save Existing Event as Template

Right-click a map event:

```text
Save as Asset Template
```

Preserve:

- pages
- conditions
- movement routes
- event commands
- priority
- trigger
- speed
- frequency
- plugin commands
- self-switch references

Strip or remap:

- event ID
- x/y
- map-specific references where unsafe
- transfer destinations only when explicitly configured

---

# 32. Event Template Metadata

Example:

```json
{
  "id": "template-door",
  "name": "Door",
  "category": "Interaction",
  "source": "built-in",
  "event": {},
  "parameters": {
    "destinationMapId": null,
    "destinationX": null,
    "destinationY": null
  }
}
```

Custom templates can be exported/imported.

---

# 33. Collision System

## 33.1 Core rule

Non-event doodads should use direct doodad collision rather than invisible blocker events.

Example:

```text
Tree graphic
→ doodad
→ trunk collision rectangle
```

Interactive events continue using normal MZ event behavior as appropriate.

## 33.2 Presets

Initial presets:

```text
None
Full Bounds
Bottom Half
Bottom Third
Center Box
Trunk
Thin Wall
Wide Wall
Custom Rectangle
```

## 33.3 Collision editor

Inspector should expose a small visual resize box.

Store relative coordinates:

```json
{
  "x": 0.35,
  "y": 0.75,
  "w": 0.3,
  "h": 0.2
}
```

Relative values allow scale changes.

---

# 34. Click-to-Place and Brush Modes

## 34.1 Click-to-place

Select asset in drawer.

Click repeatedly on map.

Useful for:

- barrels
- grass
- lamps
- furniture
- props

Escape/right-click exits placement mode.

## 34.2 Scatter brush

Select one or multiple assets.

Settings:

- density
- spacing
- allowed rotation range
- scale variation
- random asset choice
- snap mode
- exclusion radius

Keep this simple. It is an editor convenience, not a procedural-generation framework.

---

# 35. Eyedropper

Recommended shortcut:

```text
Alt-click placed object
```

Behavior:

1. identify asset source
2. select corresponding drawer asset
3. scroll drawer into view
4. load its placement settings

This dramatically speeds iterative mapping.

---

# 36. Modern Editing Operations

Implement:

- Ctrl+Z undo
- Ctrl+Y redo
- Ctrl+D duplicate
- Ctrl+C copy
- Ctrl+V paste
- Delete
- arrow nudge
- Shift+arrow larger nudge
- marquee select
- multi-select
- align
- distribute
- bring forward
- send backward
- duplicate-drag
- lock
- hide
- group
- ungroup

These actions should operate on the workspace selection model, not directly on arbitrary PIXI children.

---

# 37. Undo/Redo Architecture

Use command objects.

Concept:

```js
{
  type: "move",
  before: ...,
  after: ...,
  apply(),
  revert()
}
```

Command families:

- add doodad
- remove doodad
- move
- resize
- rotate
- property change
- group
- ungroup
- add event
- delete event
- edit event
- add collision
- modify collision
- slice region changes
- tag changes
- collection changes

Set a configurable history limit.

Recommended:

```text
200–500 actions
```

---

# 38. Import from Windows Explorer

Support dropping:

- one file
- many files
- folders recursively

## 38.1 Supported media

Initial:

```text
PNG
JPG/JPEG where MZ allows/appropriate
WEBP only if engine compatibility is confirmed
OGG
M4A
WAV where appropriate
```

Prefer normal RPG Maker-supported formats.

## 38.2 Destination logic

If source type is obvious:

```text
character-like → img/characters
audio BGM → audio/bgm
```

If unknown:

```text
Choose destination category
```

Allow:

```text
Remember for this import batch
```

## 38.3 Collision handling

On filename conflict:

```text
Skip
Replace
Rename
Apply to All
```

Never replace silently.

---

# 39. Project Save Safety

The workspace will eventually modify real MZ project JSON.

This must be much safer than the current direct doodad write.

## 39.1 Session snapshot

At workspace open, capture for affected files:

```text
mtime
size
hash if needed
```

## 39.2 In-memory staging

Do not mutate MapXXX.json immediately for every event operation.

Maintain:

```text
working copy
dirty state
```

## 39.3 Explicit save

User chooses:

```text
Save Project Changes
```

## 39.4 Conflict check before save

Before writing:

```text
current file state == session snapshot?
```

If no:

```text
Project file changed externally.
Do not overwrite.
```

Offer:

- Reload external
- Compare/reapply workspace changes
- Cancel save

## 39.5 Backups

Before writes:

```text
Map001.json.bak
Map001.json.bak.1
```

or timestamped backup folder:

```text
data/docs_doodads_cache/backups/2026-09-03_193000/
```

Prefer timestamped backups.

## 39.6 Atomic writes

Write:

```text
Map001.json.tmp
```

Then:

1. validate JSON
2. fsync/close where practical
3. rename over target

Avoid partially written map files.

---

# 40. Autosave Recovery

Workspace edits live in memory, but periodic recovery snapshots should be written.

Example:

```text
data/DocsDoodadsRecovery.json
```

or cache folder.

Recovery should include:

- map ID
- session ID
- dirty doodad changes
- staged event changes
- layout
- selection if useful
- timestamp

On next editor launch:

```text
Unfinished workspace session found.
[Recover] [Discard] [Inspect]
```

Recovery is not the same as committing changes to the project.

---

# 41. MZ Editor Conflict Protection

Because the RPG Maker desktop editor can still have the same map loaded:

After a successful workspace save, show:

```text
Map data changed externally.
Reload the map/project in RPG Maker MZ before making additional edits there.
```

The plugin cannot force the native MZ editor to reload safely.

Prevent silent overwrites wherever possible.

---

# 42. Editor-Only vs Runtime

Asset Workspace functionality should be editor/test-play-only.

Runtime deployment should retain only what is necessary for doodad rendering/game behavior.

Guard editor functionality with checks such as:

```text
editorMode
Utils.isNwjs()
Utils.isOptionValid("test")
```

depending on compatibility.

Heavy modules should not initialize in production.

---

# 43. MV Compatibility Strategy

MZ is primary.

MV compatibility should be isolated behind:

```text
DocsDoodads.Compat
```

Do not scatter version checks everywhere.

Compatibility wrappers may include:

- rectangle/window constructors
- PIXI differences
- input behavior
- Window classes
- Scene lifecycle
- ImageManager differences
- filesystem path behavior

If a feature cannot reasonably support MV:

```text
disable that feature gracefully
```

Do not weaken the MZ implementation to chase full MV parity.

---

# 44. Diagnostics

Add a lightweight diagnostics panel.

Show:

```text
Indexed assets
Visible assets
Thumbnail queue
Analysis queue
Cache hits
Cache misses
Dirty project files
Undo depth
Recovery status
Current map
Memory estimate
Last error
```

Provide:

```text
Rebuild Asset Index
Clear Thumbnail Cache
Re-analyze Selected Asset
Validate Asset Library
Validate Current Map
```

---

# 45. Performance Targets

For a 10,000+ asset project:

## Startup

- interactive workspace should appear before heavy analysis completes
- initial filesystem index should avoid image decoding
- cached projects should load significantly faster than first scan

## Drawer

- scrolling must remain responsive
- virtualize card rendering
- do not create thousands of live PIXI sprites/windows at once

## Search

Target:

```text
<100 ms perceived response
```

for 10,000–20,000 indexed assets on normal desktop hardware.

## Thumbnails

Generate lazily.

Do not keep original full-size images loaded unnecessarily.

## Slicing

Large atlas analysis should show progress and remain cancellable.

---

# 46. Virtualized Asset Drawer

Critical for large libraries.

Only instantiate visual cards for:

```text
visible viewport + small overscan
```

Do not create one interactive window item per 10,000 assets if MZ's Window_Selectable rendering becomes expensive.

Recommended approach:

- custom PIXI container
- fixed/known card dimensions
- compute visible row range
- recycle card objects

---

# 47. Thumbnail Cache

Thumbnail cache key:

```text
source path + mtime/hash + region ID + thumbnail size
```

Support multiple size buckets if needed:

```text
64
96
128
192
```

Avoid regenerating every slider pixel size.

Nearest bucket can be scaled for display.

---

# 48. Licensing/Attribution

QJ-Doodads identifies itself as MIT licensed.

If implementation copies substantial code rather than only algorithmic ideas, preserve the required copyright/license notices.

Recommended approach:

- adapt concepts and architecture
- write JavaScript implementation suited to Canvas/NW.js
- include a `Third-Party Notices` section in plugin help/comments if substantial source-derived logic is reused

---

# 49. Phased Implementation Plan

The project should be built in phases with explicit exit criteria.

Do not attempt all features in one giant patch.

---

# PHASE 0 — Baseline Audit, Backup, and Refactor Scaffold

## Objective

Create a safe foundation without changing user-visible behavior.

## Tasks

1. Establish current QJ-Doodads behavior matrix.
2. Identify all editor-only code.
3. Identify runtime-only code.
4. Document data format.
5. Isolate existing filesystem scanning.
6. Isolate data save/load.
7. Create internal namespaces.
8. Add plugin version migration support.
9. Add diagnostics logger.
10. Add feature flags.
11. Add MZ/MV compatibility abstraction shell.
12. Add backup copy of original plugin for development.

## Deliverables

- refactored single JS
- no feature regression
- internal module boundaries
- compatibility helpers
- development diagnostics switch

## Exit criteria

- existing doodads load
- existing doodads save
- edit key works
- placement works
- animation works
- IconSet works
- tileset selection works
- UltraMode7 hook remains intact
- old DocsDoodads data requires no manual conversion

---

# PHASE 1 — Asset Index and Metadata Cache

## Objective

Replace the limited doodads-folder listing with a scalable project asset index.

## Tasks

1. Enumerate normal MZ image/audio roots.
2. Build incremental scanner.
3. Add path normalization.
4. Create stable asset IDs.
5. Build `DocsDoodadsLibrary.json`.
6. Add mtime/size cache invalidation.
7. Add auto-tag generation.
8. Add categories.
9. Add manual tags.
10. Add favorites.
11. Add virtual collections.
12. Add usage statistics.
13. Add recently-used tracking.
14. Add index rebuild command.
15. Add stale/missing file cleanup.

## Exit criteria

- 10,000 mock asset entries can be indexed
- unchanged assets do not require full re-analysis
- moved/deleted files are handled
- metadata writes are safe
- no doodad runtime regression

---

# PHASE 2 — Visual Asset Drawer

## Objective

Deliver the visible drawer that replaces filename-centric selection.

## Tasks

1. Build dockable drawer panel.
2. Add thumbnail grid.
3. Add list mode.
4. Add adjustable thumbnail slider.
5. Add folder navigation.
6. Add category tabs.
7. Add favorites.
8. Add collections.
9. Add recent strip.
10. Add hover preview.
11. Add lazy thumbnail generation.
12. Add virtualization.
13. Add selection model.
14. Add right-click context menu.
15. Add keyboard navigation.

## Exit criteria

- drawer can browse full project
- 10,000+ entries remain scrollable
- only visible thumbnails consume UI resources
- selected asset remains stable during filters
- old image selection path can still be temporarily accessed as fallback

---

# PHASE 3 — Search, Filters, and Saved Layouts

## Objective

Make the drawer practical at very large scale.

## Tasks

1. Fuzzy search.
2. Tokenized filters.
3. Negative terms.
4. Tag filter.
5. Type filter.
6. Folder filter.
7. Favorite filter.
8. Animated filter.
9. confidence filter.
10. saved searches if useful.
11. panel docking.
12. resizing.
13. collapsing.
14. tabbing.
15. layout persistence.
16. built-in layouts.
17. custom layouts.

## Exit criteria

- search remains fast at 10,000+ assets
- layout survives restart
- panels restore safely across different resolutions
- corrupt layout metadata falls back to default

---

# PHASE 4 — Known MZ Slicing and Grid Detection

## Objective

Handle the easiest and most common sheets before advanced visual analysis.

## Tasks

1. MZ character sheet recognition.
2. `$` character recognition.
3. face sheet recognition.
4. IconSet recognition.
5. tileset recognition.
6. SV actor recognition.
7. fixed row/column mode.
8. automatic divisor candidate search.
9. grid confidence scoring.
10. logical child assets for multi-character sheets.
11. direct individual-character previews.

## Exit criteria

- standard MZ characters need no manual sheet picker
- individual characters appear in drawer
- dragging a character preserves correct index
- grid-only sheets can be cut without transparency

---

# PHASE 5 — External Atlas Metadata Parsers

## Objective

Use exact data when available instead of heuristics.

## Tasks

1. Aseprite JSON parser.
2. TexturePacker JSON parser.
3. generic known JSON parser.
4. optional `.saf.json` parser.
5. trimmed-frame support.
6. pivot support.
7. rotated frame support if practical.
8. frame naming.
9. animation grouping.

## Exit criteria

- supported sidecars override visual detection
- malformed sidecars fail safely
- metadata does not alter source files
- user can ignore/reject detected sidecar

---

# PHASE 6 — Advanced Visual Auto-Slicer

## Objective

Implement the visual detector.

## Tasks

1. image pixel extraction.
2. memory limits.
3. transparent-border analysis.
4. adaptive alpha threshold.
5. border-connected background flood removal.
6. morphology.
7. connected components.
8. minimum-area filtering.
9. proximity grouping.
10. unambiguous small-fragment attachment.
11. seeded growth.
12. detached detail recovery.
13. vertical gutter splitting.
14. horizontal gutter splitting.
15. region padding.
16. confidence calculation.
17. cancellation/progress.
18. performance chunking.

## Exit criteria

Test against:

- transparent sheets
- opaque background sheets
- irregular sheets
- uneven sprite sizes
- touching sprites
- semi-transparent glows
- noisy generated sheets
- detached weapon/accessory fragments
- tiny pixel art

No single algorithm is expected to be perfect; low confidence must trigger review instead of pretending success.

---

# PHASE 7 — Sprite Sheet Editor

## Objective

Give the user fast correction when automation is imperfect.

## Tasks

1. zoom/pan.
2. region overlays.
3. 8-handle resize.
4. snapping.
5. guides.
6. numeric X/Y/W/H.
7. add/delete.
8. merge.
9. split.
10. align.
11. distribute.
12. rename.
13. pivot.
14. region ordering.
15. animation grouping.
16. undo/redo.
17. save authoritative manual metadata.
18. re-run Auto Slice without destroying saved manual data until confirmed.

## Exit criteria

- user can repair any failed auto-detection without external tools
- changes survive restart
- source PNG remains untouched
- stale slice definitions are detected when source changes

---

# PHASE 8 — Drag-and-Drop Doodad Placement

## Objective

Make decorative asset placement immediate.

## Tasks

1. drag payload.
2. workspace drop target.
3. ghost preview.
4. free placement.
5. context snapping.
6. click-to-place.
7. repeated stamping.
8. remembered placement defaults.
9. Place As override.
10. ask-event prompt.
11. yes/no remember.
12. eyedropper.
13. recent-use update.

## Exit criteria

User can:

```text
find asset → drag → drop → done
```

without going through the old image picker.

---

# PHASE 9 — Real MZ Event Creation and Templates

## Objective

Allow interactive assets to become genuine MZ events.

## Tasks

1. MapXXX working-copy loader.
2. safe event ID allocator.
3. event object factory.
4. character event factory.
5. built-in templates.
6. template parameter UI.
7. Save Event as Template.
8. custom template persistence.
9. import/export templates.
10. append audio command support.
11. plugin command preservation.
12. dirty map tracking.

## Exit criteria

- events created in workspace appear in MapXXX.json
- reopening MZ shows editable real events
- templates preserve pages/conditions/commands
- event creation is undoable before save
- no file write occurs until explicit save

---

# PHASE 10 — Collision System

## Objective

Make non-event environmental objects block correctly without hidden events.

## Tasks

1. collision metadata.
2. preset selector.
3. custom rectangle editor.
4. scale-aware collision.
5. runtime collision integration.
6. visualization toggle.
7. multi-selection collision editing if practical.

## Exit criteria

- doodad tree can use trunk-only collision
- decorative grass has no collision
- wall preset blocks correctly
- collision persists
- runtime remains performant

---

# PHASE 11 — Modern Map Editing Operations

## Objective

Bring the in-game editor up to modern workflow standards.

## Tasks

1. generalized selection manager.
2. undo/redo commands.
3. duplicate.
4. arrow nudge.
5. large nudge.
6. groups.
7. locking.
8. hiding.
9. align.
10. distribute.
11. z-order operations.
12. multi-asset drag if practical.
13. scatter brush.

## Exit criteria

- all destructive editor operations are undoable
- locked objects cannot be accidentally moved
- hidden editor objects can be restored
- group operations do not corrupt serialized data

---

# PHASE 12 — Explorer Import and Asset Ingestion

## Objective

Eliminate unnecessary external file-management steps.

**Implementation status (2026-09-03): Complete.** Explorer drops now pass through the reusable `DocsDoodads.Import` transaction layer. The workspace presents batch-wide destination and collision choices, supports optional slicer launch, reports incremental progress, permits cancellation, re-indexes successful imports, detects exact duplicates, and rolls back all earlier copies when a batch fails or is cancelled. Automated coverage is in `scratch/test_asset_import.js` and `scratch/test_asset_import_async.js`.

## Tasks

1. OS drag/drop listeners.
2. single file import.
3. batch import.
4. recursive folder import.
5. category destination dialog.
6. collision dialog.
7. apply-to-all behavior.
8. re-index after import.
9. optional auto-slice prompt.
10. rollback partially failed imports.

## Exit criteria

- user can drag a sprite sheet from Explorer into drawer
- imported asset appears without restarting
- collisions are never silently overwritten
- folder import remains responsive

---

# PHASE 13 — Audio Drawer Integration

## Objective

Make audio discoverable without expanding project scope excessively.

## Tasks

1. audio indexing.
2. audio search.
3. click preview.
4. stop preview.
5. BGM/BGS/ME/SE badges.
6. drop on event.
7. drop on map.
8. generate/append appropriate event commands.

## Exit criteria

- audio never auto-creates content accidentally
- preview has clear stop behavior
- event-command insertion is undoable

---

# PHASE 14 — Safe Save, Backup, Conflict Detection, Recovery

## Objective

Make map/event editing trustworthy.

**Implementation status (2026-09-03): Complete.** Map, doodad, and asset-library JSON now commit as one validated multi-file transaction. A failure restores every file already committed and preserves dirty state. Diagnostics exposes a confined, validated backup restore utility that creates a fresh safety backup before restoring. Existing conflict/recovery coverage plus `scratch/test_persistence_transactions.js` exercise external conflicts, corrupt JSON recovery, simulated mid-commit failure, rollback, invalid backup rejection, and restore-path confinement.

## Tasks

1. session file snapshots.
2. dirty file registry.
3. explicit save command.
4. pre-save conflict detection.
5. timestamped backups.
6. temp writes.
7. JSON validation.
8. atomic rename.
9. autosave recovery.
10. crash recovery dialog.
11. MZ reload warning.
12. restore backup utility.

## Exit criteria

Simulate:

- crash during edit
- crash during save preparation
- external map modification
- invalid JSON
- permission error
- disk write failure

No scenario should silently destroy the user's map.

---

# PHASE 15 — Performance Hardening

## Objective

Ensure real-world use with very large libraries.

## Tasks

1. profile index.
2. profile drawer.
3. profile thumbnails.
4. profile search.
5. profile slicing.
6. reduce allocations.
7. typed-array reuse.
8. cache eviction.
9. image unload policy.
10. job queue tuning.
11. virtual list tuning.
12. large-atlas cancellation.

## Test scales

```text
1,000 assets
5,000 assets
10,000 assets
25,000 assets
```

## Exit criteria

- usable at 10,000+
- no major memory leak during long editor session
- no permanent UI freeze during normal indexing
- cancelled slicer job actually stops

---

# PHASE 16 — MV Compatibility Pass

## Objective

Add practical MV compatibility without compromising MZ.

## Tasks

1. compatibility wrappers.
2. window API differences.
3. PIXI version differences.
4. rendering differences.
5. input differences.
6. test filesystem behavior.
7. disable unsupported features cleanly.

## Exit criteria

Document feature matrix:

```text
Feature                  MZ    MV
Asset Drawer             Yes   Yes/Partial
Auto Slicer              Yes   Yes if Canvas/NW stable
Event Creation           Yes   Yes/Partial
Layouts                  Yes   Yes
Collision                Yes   Yes/Partial
...
```

MZ remains the release-blocking target.

---

# PHASE 17 — QA, Migration, Documentation, Release

## Objective

Ship without breaking existing projects.

## Tasks

1. plugin parameter cleanup.
2. migration versioning.
3. old DocsDoodads compatibility.
4. old plugin setting migration.
5. corrupt metadata fallback.
6. empty project tests.
7. huge project tests.
8. save/reopen tests.
9. deployment tests.
10. documentation.
11. quick-start guide.
12. keyboard shortcut reference.
13. slicer guide.
14. template guide.
15. troubleshooting.
16. third-party notices.

## Release criteria

- no known data-loss issue
- no old doodad migration blocker
- no production-build editor leakage
- no critical UI freeze on normal project
- no critical event JSON corruption
- backups verified
- recovery verified

---

# 50. Recommended Milestone Grouping

For practical development, phases can be bundled into larger milestones.

## Milestone A — Foundation

Phases:

```text
0–3
```

Result:

- refactored safe base
- index
- drawer
- search
- layouts

This already provides major value.

## Milestone B — Sprite Intelligence

Phases:

```text
4–7
```

Result:

- MZ sheet recognition
- metadata parsing
- auto-slicing
- slicer editor

This delivers the requested automated sprite cutting.

## Milestone C — Placement Revolution

Phases:

```text
8–10
```

Result:

- drag/drop
- event creation
- templates
- collision

This delivers the requested "drag it onto the map and have the tool do the rest" workflow.

## Milestone D — Editor Quality

Phases:

```text
11–13
```

Result:

- modern editing
- Explorer import
- audio

## Milestone E — Production Hardening

Phases:

```text
14–17
```

Result:

- safety
- performance
- MV compatibility
- release readiness

---

# 51. Minimum Viable Upgrade

If scope needs to be controlled, the minimum version worth shipping is:

1. asset index
2. visual drawer
3. thumbnails
4. search
5. known MZ slicing
6. grid slicing
7. visual auto-slicing
8. slicer correction UI
9. non-destructive regions
10. drag/drop doodads
11. event yes/no prompt
12. real MZ event creation
13. explicit save
14. backups
15. conflict detection

Everything else can follow.

---

# 52. Features That Must Not Block the First Useful Release

These are valuable but should not delay the core workflow:

- scatter brush
- sophisticated collection UX
- advanced audio drag/drop
- many template types
- full MV parity
- every atlas metadata format
- rotated/trimmed atlas edge cases
- elaborate collision shapes
- advanced multi-object grouping

---

# 53. Test Matrix

## Sprite slicing fixtures

Create fixture sheets covering:

### Standard

- MZ 8-character sheet
- `$` character sheet
- face sheet
- IconSet-like grid
- regular animation strip

### Transparent irregular

- variable-sized props
- separated weapon parts
- detached shadows
- tiny particles

### Opaque background

- white background
- gray background
- gradient-like background
- mild texture/noise

### Difficult

- touching sprites
- one-pixel bridges
- glow
- smoke
- anti-aliased edges
- uneven spacing
- no spacing
- huge atlas
- sparse atlas
- tiny pixel art

For each fixture record expected rectangles.

---

# 54. Automated Testable Logic

Even inside a single plugin, pure logic should be written so it can be tested independently.

High-value test targets:

- path normalization
- asset ID generation
- query parsing
- fuzzy matching
- grid candidate scoring
- connected components
- component merge rules
- detached ownership
- gutter scoring
- confidence scoring
- event ID allocation
- event template expansion
- JSON conflict detection
- backup naming
- layout validation
- collision normalization

---

# 55. Manual QA Scenarios

## Scenario A — Decor prop

1. search `barrel`
2. drag barrel
3. choose `No & Remember`
4. place
5. move
6. undo
7. redo
8. save
9. relaunch

Expected:

- doodad survives
- event not created
- decision remembered

## Scenario B — NPC

1. search character
2. drag individual character
3. event auto-created
4. select NPC template
5. save
6. open map in MZ

Expected:

- normal MZ event exists
- correct character index
- editable in MZ

## Scenario C — Unknown atlas

1. import PNG
2. Auto Slice
3. inspect confidence
4. fix two boxes manually
5. save
6. restart

Expected:

- corrections survive
- no PNG duplication
- source unchanged

## Scenario D — External conflict

1. open workspace
2. modify Map001 externally
3. attempt workspace save

Expected:

- save blocked
- no overwrite
- conflict message shown

---

# 56. Data Migration Strategy

Maintain:

```text
plugin data version
asset library version
template version
layout version
```

Migration function style:

```js
migrateV1ToV2(data)
migrateV2ToV3(data)
```

Never make users manually rewrite JSON.

If metadata is newer than supported:

```text
refuse destructive save
```

and show clear version warning.

---

# 57. Error Handling Principles

Do not silently catch everything.

Classify errors:

```text
Recoverable
Warning
Blocking
Fatal
```

Examples:

### Recoverable

Thumbnail failed.

### Warning

Low slice confidence.

### Blocking

Map file changed externally.

### Fatal

Asset library JSON is unrecoverably corrupt and no backup exists.

Keep editor usable when non-critical subsystems fail.

---

# 58. UI Feedback Requirements

Long operations need visible status.

Examples:

```text
Indexing 3,210 / 12,442
Generating thumbnail 42 / 175
Analyzing atlas...
Detecting foreground
Grouping regions
Recovering details
Calculating confidence
```

Provide cancel for heavy analysis/import.

---

# 59. Keyboard Shortcut Plan

Suggested defaults:

```text
F10              Open/close workspace
Ctrl+Z           Undo
Ctrl+Y           Redo
Ctrl+D           Duplicate
Ctrl+C           Copy
Ctrl+V           Paste
Delete           Delete
Arrow            Nudge
Shift+Arrow      Larger nudge
Alt+Click        Eyedropper
G                 Grid toggle
H                 Hide/show inspector
F                 Focus search
Escape            Cancel tool / placement
Space+Drag        Pan slicer/map where appropriate
Mouse Wheel       Scroll
Ctrl+Wheel        Zoom where appropriate
```

Shortcuts should be configurable where conflicts arise.

---

# 60. Recommended Plugin Parameters

Keep plugin parameters focused.

Suggested:

```text
Editor Enabled
Open Workspace Key
Default Layout
Asset Cache Enabled
Thumbnail Cache Size
Background Work Budget
Autosave Recovery Interval
Backup Retention Count
Default Thumbnail Size
Default Doodad Snap
Default Event Snap
Enable MV Compatibility
Developer Diagnostics
```

Avoid exposing dozens of slicer internals in the plugin parameter UI.

Advanced slicer settings belong inside the slicer.

---

# 61. Recommended Internal APIs

Examples:

```js
DocsDoodads.AssetIndex.scan()
DocsDoodads.AssetIndex.refreshPath(path)

DocsDoodads.Search.query(text)

DocsDoodads.Slicing.analyze(asset, options)
DocsDoodads.Slicing.loadSaved(asset)
DocsDoodads.Slicing.saveRegions(asset, regions)

DocsDoodads.Placement.begin(asset, mode)
DocsDoodads.Placement.commit(position)

DocsDoodads.Events.createFromAsset(asset, position, template)
DocsDoodads.Events.stage(event)
DocsDoodads.Events.commitMap()

DocsDoodads.Persistence.saveAssetLibrary()
DocsDoodads.Persistence.saveWorkspace()

DocsDoodads.Undo.execute(command)
DocsDoodads.Undo.undo()
DocsDoodads.Undo.redo()
```

A clean internal API will prevent the single physical JS file from becoming unmaintainable.

---

# 62. Scope-Control Rules During Development

To prevent the project from exploding:

1. Every new feature must directly improve asset discovery, slicing, placement, or map/event authoring.
2. Do not build a subsystem already handled well by MZ unless the existing workflow blocks the core goal.
3. MZ compatibility outranks MV parity.
4. Offline/local operation is mandatory.
5. No AI/cloud requirement.
6. No external executable requirement.
7. No mandatory npm package installation.
8. Cache must remain disposable.
9. Authoritative user work must not live only in cache.
10. No destructive automatic reinterpretation of manually corrected slices.

---

# 63. Definition of Done

**Automated preflight status (2026-09-03): Complete.** Sixteen isolated Node.js regression suites cover the core algorithms, RPG Maker MZ/MV compatibility shims, incremental indexing, the visual slicing pipeline, transactional import, persistence rollback/recovery, event authoring, workspace operations, and production-mode isolation. The repository also has syntax/JSON/secret/artifact verification, a measured coverage gate, dependency locking, and Windows/Linux continuous integration. The remaining release gate is the engine-level workflow in `MANUAL_TEST_CHECKLIST.md`, including visual inspection, real NW.js input behavior, long-session memory profiling, and round-trip editing in RPG Maker.

The project is complete when the following workflow is reliable:

1. Start test play.
2. Press F10.
3. Full Asset Workspace opens.
4. Drawer displays project assets visually.
5. Search works immediately.
6. Select a sprite sheet.
7. Tool recognizes MZ structure or automatically slices it.
8. Low-confidence results can be corrected visually.
9. Drag one logical sprite to the map.
10. Tool previews placement.
11. For decorative objects, it asks whether an event is needed unless a remembered decision exists.
12. Doodad placement creates the correct doodad structure.
13. Event placement creates a real MZ event.
14. Collision can be assigned simply.
15. Undo/redo works.
16. Save Project Changes performs conflict detection.
17. Backups are created.
18. JSON writes are atomic.
19. Restarting preserves metadata, slices, tags, favorites, layouts, templates, and doodads.
20. Normal RPG Maker MZ can open the resulting project and edit created events.

---

# 64. Recommended Development Order

The best implementation order is:

```text
1. Refactor/scaffold
2. Asset index
3. Visual drawer
4. Search/layouts
5. MZ format slicer
6. Grid slicer
7. Metadata parsers
8. Advanced visual slicer
9. Slicer editor
10. Drag/drop doodads
11. Event creation
12. Templates
13. Collision
14. Undo/redo expansion
15. Explorer import
16. Audio
17. Save safety/recovery hardening
18. Performance hardening
19. MV compatibility
20. Release QA/docs
```

Do not begin with event automation before the asset index and slice identity model are stable.

---

# 65. Final Recommended Release Strategy

## Alpha 1

- refactor
- asset index
- basic drawer

## Alpha 2

- thumbnails
- search
- layouts

## Alpha 3

- known MZ slicing
- grid slicing

## Alpha 4

- advanced visual slicing
- confidence

## Alpha 5

- slicer editor

## Beta 1

- drag/drop doodads
- click-to-place

## Beta 2

- event creation
- templates

## Beta 3

- collision
- modern editor controls

## Beta 4

- Explorer import
- audio

## Release Candidate 1

- backups
- recovery
- conflict protection
- performance

## Release Candidate 2

- migration
- deployment checks
- MV compatibility pass
- documentation

## 1.0

Release only after map-file safety and recovery are proven.

---

# 66. Source References Used for This Plan

## QJ-Doodads

Primary user-provided plugin (upstream V1.2, kept as `QJ-Doodads.original.js`):

```text
QJ-Doodads.js
```

Key concepts inherited:

- in-game doodad editor
- recursive filesystem scanning
- direct Node filesystem access
- doodad data structure
- IconSet and tileset region selection
- animation frame data
- free/grid placement
- selection and editing
- map serialization

## Slice-AtlasSprites-as-png

Repository:

```text
https://github.com/DocDamage/Slice-AtlasSprites-as-png
```

Useful primarily as reference for:

- exporting already-known sprite regions to individual PNG files

It is not the main reference for automatic region detection.

---

# 67. Final Handoff Summary

The implementation should build on the strengths of QJ-Doodads while replacing its most dated workflow: asset discovery and sprite selection.

The final system should feel like this:

```text
Open Workspace
→ Search visually
→ Grab an asset
→ Auto-slice if necessary
→ Drag it to the map
→ Tool understands the correct region
→ Tool asks only when interaction/event behavior is ambiguous
→ Doodad or real MZ event is created
→ Collision/animation/defaults are applied
→ Save safely
```

That is the core product.

Everything in this plan should be judged by whether it makes that path faster, safer, and more reliable.

If a proposed feature does not improve that path, it should be deferred.
