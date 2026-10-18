# Security Policy

Please report suspected vulnerabilities through GitHub's private vulnerability reporting or a private security advisory for this repository. Do not include real RPG Maker project data, commercial assets, credentials, or unpublished game content in a public issue.

The editor and filesystem features are intended to run only in NW.js playtest mode. A report that exposes those features in a deployed game should be treated as high priority.

Two safeguards back this up: every file write the plugin makes goes through a guard that refuses outside a playtest, and builds made with `npm run deploy` turn off the game's developer tools (`--disable-devtools`), as MZ's own Deployment does. A way past either is a security issue.
