# Security Policy

Please report suspected vulnerabilities through GitHub's private vulnerability reporting or a private security advisory for this repository. Do not include real RPG Maker project data, commercial assets, credentials, or unpublished game content in a public issue.

The editor and filesystem features are intended to run only in NW.js playtest mode. A report that exposes those features in a deployed game should be treated as high priority.

Two safeguards back this up: every file write the plugin makes goes through a guard that refuses outside a playtest, and builds made with `npm run deploy` turn off the game's developer tools (`--disable-devtools`), as MZ's own Deployment does. A way past either is a security issue.

## Doodad data is code

A doodad's **condition** (Details > Show when) is JavaScript: it is compiled with `new Function` and runs in the
game, in playtests and in deployed games, the same way the events' Script commands do. So are the scripts in
Conditional Branch and the plugin's own API calls. The trust boundary is the project: whoever can change its
`data/` folder (the doodads file, the map files) can already run code in the game, as with any RPG Maker project.

What follows from it:

- Don't bring in a project's doodads, prefabs, rooms or packs from someone you wouldn't take a plugin from. A
  pack (`.ddpack`) carries doodads with their conditions; it is refused if it would write into `data/`, but the
  doodads it adds to a map can hold conditions.
- A deployed game reads only its own files: nothing a player types or downloads is ever compiled as a condition.
  A report of a way to make a deployed game compile text from outside its own `data/` is a security issue.
- Conditions that fail to compile or throw are treated as true and never stop the game; they are not a way to
  hide errors from the developer (Problems in More lists them).
