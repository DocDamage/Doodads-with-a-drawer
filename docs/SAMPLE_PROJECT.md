# The sample project

A small project that shows what Doc's Doodads does: a town at dusk, a field in the 3D view and a cave.

1. In RPG Maker MZ, make a new project (File > New Project) and close MZ.
2. Copy `Docs-Doodads.js` into its `js/plugins/` folder and turn it on in Plugin Manager (open MZ, add it, save, close MZ again).
3. From this repository: `npm run sample -- "<the new project's folder>"`.
4. Open the project in MZ and playtest. Walk east out of the town into the field, and to the cave in the field's top right corner.

What it writes:

- `img/doodads/samples/`: pictures drawn by the plugin's own code (a tree, a house with its door shut and open, a fence, a sign, a chest shut and open, a torch, a lamp, a bush, flowers, a rock, a bird and a butterfly). No one else's art is shipped.
- `data/Map002.json` (the field) and `data/Map003.json` (the cave), their MapInfos entries, and transfer events both ways (also one on Map001).
- The doodad data (`data/DoodadsQJ.json`, or the file named by the plugin's Data File parameter): the town at dusk with lamps that light after dark and a house whose door opens when touched; the field with wind, swaying trees and flowers, birds that land on a tree and butterflies, in the 3D view; the cave, dark, with the flashlight, echo and torches.
- `CREDITS_SAMPLE.txt`.

The maps use the new project's own tileset. The script refuses a project that already has doodad data, a Map002 or a Map003, so it never writes over your work.
