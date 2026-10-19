# Doc's Doodads Cheat Sheet

Every notetag, image name tag, plugin command and script call on one page. The [User Guide](Docs_Doodads_Guide.md) explains each in full; section numbers below point there.

## Notetags

### Events (in a comment or the event's note)

| Tag | What it does | Guide |
| :--- | :--- | :--- |
| `<shadow>` | Gives the event a sun shadow even when the project's Which events setting leaves it out. | 8 |
| `<shadow: length 0.8, opacity 0.4>` | A shadow with its own length and strength. | 8 |
| `<no shadow>` | No sun shadow for this event. | 8 |
| `<motion blur>` / `<no motion blur>` | Turns motion blur on or off for this event. | 8 |
| `<no reflection>` | Not reflected in water. | 8 |
| `<spatial>` / `<no spatial>` | Its sound effects are, or aren't, placed in the world (distance and panning). | 11 |
| `<no variance>` | Its sound effects keep their authored pitch and volume (no random variation). | 11 |
| `<sound: River, 80, 8>` | A looping background sound heard within 8 tiles, at volume 80. | 11 |
| `<sound: se/Bird1, 60, 10, 5>` | A sound effect repeated about every 5 seconds, heard within 10 tiles. | 11 |
| `<visual actor: 4>` | Wears actor 4's look (layers and all). | 13 |
| `<visual: ...>` and the other visual tags below | Visual equipment drawn on the event. | 13 |

### Actors, classes, weapons, armors and states (visual equipment)

| Tag | What it does |
| :--- | :--- |
| `<visual: Cape_Red, z -1>` | Draws a layer; negative `z` is behind the body. |
| `<visual: Armor_Iron, part clothes>` | Names the part (slot); replaces anything else in that part. |
| `<visual: Cape, z -1, up 2>` | A different order while facing up (capes, shields, quivers). |
| `<visual: Wings, index 3>` | Uses character 3 of an 8-character sheet. |
| `<visual: Armor_{alias}, sv SV_Armor_{alias}>` | `{alias}` follows the actor's body type; `sv` is the side-view battler sheet. |
| `<visual: Hero.aseprite#Sword, z 1>` | A layer of a layered `.aseprite` walk cycle (in `img/characters`, or a project path like `art/Hero.aseprite`). In a playtest its sheet is made for you, and remade when you save the `.aseprite` again, so the character changes while the game runs. |
| `<visual base: Body>` | A base layer (paper doll), replaced by gear with the same part. |
| `<visual base: Hair_Short, part hair, z 2>` | A base layer with a part and order. |
| `<visual hide: hair, ears>` | Hides those parts while worn (helmets). |
| `<visual color: hair, switch 12, hue 120>` | Recolours a part while switch 12 is on (also `variable N`, `tint #rrggbb`). |
| `<visual alias: Elf>` | The actor's `{alias}` for image names. |

## Image name tags

| In the file name | Meaning | Guide |
| :--- | :--- | :--- |
| `[f8]` or `%(8)` | 8 frames per row instead of 3. | 10 |
| `[d1]` | One row, mirrored for the other side. | 10 |
| `[d8]` | Eight directions (diagonals). | 10 |
| `[w2]` | With `[fN]`: frame 0 stands, the rest walk, one cycle every 2 tiles. | 10 |
| `[b32]` | Each frame has 32 pixels of art below the feet (a weapon swung down); the character still stands on its feet. | 10 |
| `[h64]` | In a side-view battler's name: the figure is 64 pixels tall in a bigger cell, so battle animations play on the figure. | 20 |
| `Name_idle`, `Name_run` | Idle and run cycles for the sheet `Name`, found automatically. | 10 |
| `$Name` | One character on the sheet (MZ's own rule). | |

## Plugin commands

| Command | Arguments | What it does |
| :--- | :--- | :--- |
| Set Ambient Light | darkness, color, duration | Fades the map's darkness. |
| Reset Ambient Light | duration | Back to the map's own darkness. |
| Set Time of Day | hour, minute, day (optional) | Jumps the day/night clock; the day stays unless given. |
| Pass Time | hours, minutes | Moves the clock forward. |
| Calendar | action, value, variable | Go to a day, move days on, or put the day, weekday or named date in a variable. |
| Clock Control | action, speed | Pause, resume or change the clock's speed. |
| Set Season | season | Changes the season. |
| Set Atmosphere Effect | feature, enabled | Turns an effect on or off for this playthrough. |
| Set Post-Processing Look | look, duration | Fades to a look, to none, or back to the map's. |
| Play Screen Effect | effect, strength, duration, origin, eventId | Impact zoom, shockwave, chromatic punch, bloom flash. |
| Play VFX | effect, target, eventId, x, y, follow, wait | Plays a VFX on a character, tile or the screen. |
| Play Character Action | target, eventId, sheet, fps, loops, hold, wait | Plays a sheet on a character (drinking, sleeping...). |
| Clear Character Action | target, eventId | Back to walking and idling. |
| Play SE At | name, volume, pitch, target, eventId, x, y | A sound heard from a character or tile. |
| Set Visual Alias | actor, alias | Changes an actor's `{alias}`. |
| Add Visual Layer | actor, image, z, part, sv | A layer without equipment (costumes). |
| Remove Visual Layer | actor, part | Removes added layers. |
| Set Visual Colour | actor, part, hue, tint, reset | Recolours a part. |
| Set Destination Marker | style, color, opacity, blend, scale, pulse, spin, bob, layer, image, fps, animationId, vfx, pathDots, dotColor, reset | Restyles the click-to-walk marker. |
| Set Camera (3D) | pitch, yaw, zoom, fov, curve, curvature, relative, duration, wait | Moves the 3D camera (eased). |
| Reset Camera (3D) | duration | Back to the map's camera. |
| Set 3D View | mode | 3D on, off, or the map's setting. |
| Set Sky Video | video, mode, speed | A different sky video for this visit (`none` for none, blank for the map's own). |
| Set Zoom | level, duration, wait | Zooms in on the player (1 = normal); nearby sounds come forward. |
| Flashlight | state | The player's flashlight on, off, or back to World > Lighting; saved. |
| Set Wind | strength, direction, duration | Flat maps: wind for swaying doodads, particles, fog and leaves (0-1, or `world`). |
| 2D Camera Path | points, frames, ease, then, wait | Flat maps: glide the camera through tiles (`10,5; 20,8`), then back or stay. |
| 2D Camera Follow | target, eventId | Flat maps: the camera follows the player, this event, another event, or nothing (stays put). |
| Set Traversal | ability, state | Jump, glide, swim, dive, fly, climb or ice on, off or as in the World settings, for this game. |
| Traversal Action | action | The player jumps, takes off, lands or dives (if allowed). |
| Show World Map | | The whole map (a globe on planets) until OK or Cancel. |
| Store Ground Height | target, eventId, variableId | Terrain height under a character into a variable. |
| Set Doodad State | name, state, mapId, wait | Named doodads to a state (name, number, `next`, or blank to follow their switch or variable); saved. Wait: until the crossfade ends. |
| Zoom to Point | target, x, y, eventId, scale, frames, wait | The flat screen zooms in on a tile or a character; scale 1 goes back. |
| Play Doodad Animation | name, from, to, hold, wait | Named doodads play their strip of frames once, now; `animationEnd` when done. |
| Set Doodad Light | name, light, mapId | Named doodads' lights on, off or back to their own; saved. |
| Store Doodad State | name, variableId, mapId | A named doodad's state number (-1: none there) into a variable. |
| Show / Hide Minimap | show | The corner minimap off (cutscenes, dark caves) or back on; saved. |
| Explored Map | action, radius, region, variable, mapId | With fog of war: reveal a whole map, around the player or a region; how much is seen into a variable; or forget a map; saved. |

## Script calls

| Script | Use |
| :--- | :--- |
| `DocsDoodads.Terrain.heightOf($gamePlayer) >= 2` | Conditional Branch on the ground height under the player (or `this.character(0)`). |
| `DocsDoodads.WorldState.is('Front Door', 'Open')` | Conditional Branch on a named doodad's state. `state(name)` gives its state's name, `light(name)` whether its light is on. |
| `DocsDoodads.api.find('Street Lamp')` | Doodads by Name (or `{ art, near: { x, y, radius } }`); also `place`, `move`, `set`, `remove`, `setState`, `setLight`, `setTime`, `setSeason`, `ambient`, and `on('touch', fn)`. See the Guide, section 15. |
| `DocsDoodads.WorldState.touched().name` | In a doodad's touch common event: which doodad was touched (`name`, `state`, `mapId`, and its tile `x`, `y`). |

## Player keys

Each only when it is turned on in the map panel's World settings.

| Key | Does | Guide |
| :--- | :--- | :--- |
| C | Jump (Traversal); in deep water, dive | 10 |
| F | Take off and land (Traversal: Fly) | 10 |
| Mouse wheel, + and - | Zoom in on the player (Zoom and Sound Focus) | 11 |
| Q / W | Turn the 3D camera 90° (3D View) | 14 |

## Editor mouse in 3D

| Mouse | Does |
| :--- | :--- |
| Middle-drag | Orbit the camera |
| Shift + middle-drag | Pan across the ground |
| Wheel | Zoom |
| Middle click | Back to the map's camera |

The keyboard shortcuts are in the guide's [shortcut table](Docs_Doodads_Guide.md#23-complete-keyboard-shortcuts-cheat-sheet).
