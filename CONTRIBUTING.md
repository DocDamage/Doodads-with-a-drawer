# Contributing

1. Create a branch from `main`.
2. Add a focused regression under `scratch/test_*.js` before changing plugin behavior.
3. Run `npm run verify`.
4. Do not commit copyrighted RPG Maker assets, commercial game data, caches, recovery files, or credentials.
5. Describe any manual RPG Maker MZ/MV validation performed in the pull request.

Keep runtime and editor behavior in the single distributable `Docs-Doodads.js` file. Editor-only filesystem and DOM work must remain gated to NW.js playtest mode.
