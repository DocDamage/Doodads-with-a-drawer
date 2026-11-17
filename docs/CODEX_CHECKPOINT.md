# Backlog 7–9 continuation

## Current milestone

Continue the 67 buildable rows in `BACKLOG_7_PLAN.md`, `BACKLOG_8_PLAN.md` and
`BACKLOG_9_PLAN.md` on local branch `feat/backlog-7-9`. Item 7.4.5 needs third-party
plugins for a truthful compatibility list. Nothing is pushed or published.

## Recovery

The Claude session “Project completion checklist” stopped at its usage limit while
starting 18 workers. Its automatic restart was turned off to avoid overlapping work.
The integration checkout was clean at `ee038ad`. Three unfinished worktrees remain:

- `agent-a585f00619c236f72`: 8.2.1, larger editing window (source and tests).
- `agent-aced89ada5d22b59f`: 8.1.2, Moods (plain rules only).
- `agent-a0202507cf2077b23`: 7.4.8, own character parts (MZ generator changes only).

Keep those worktrees until their useful changes are recovered and verified.

## Built locally

These rows have source and automated tests. Each still needs its MZ checks before being
called Done: 7.3.2 collision brush; 7.4.8 creator My parts; 8.1.1 Simple mode;
8.1.2 Moods; 8.1.5 context help; 8.2.1 editing window; 9.1.1 comfort options;
9.1.5 area names; 9.2.1 nearness triggers; 7.1.4 NPC schedules; 8.5.1 tracing pictures;
7.1.2 event pages and commands; 8.2.4 short searchable Details; 9.5.2 plugin checks and local reports;
7.1.5 flat-map normal lighting; 8.4.4 BGM-reactive motion/lights/particles; 8.1.4 first-map quest;
7.3.5 seeded generated maps; 9.5.3 save-safe changes; 9.3.3 heat haze;
8.1.3 guessed placement defaults; 8.3.6 player Photo Mode; 9.1.2 Auto Effects Quality;
7.3.8 first-person 3D camera; 9.4.3 art credit ledger; 9.2.6 seasonal climate;
8.2.2 real map placement previews; 9.4.2 animated GIF/APNG import;
9.1.4 save-file pictures; 9.1.7 flat-map battle backgrounds; 9.2.4 light and sight.

9.5.1 has a screenshot runner, driver, comparator and mocked-subprocess tests; review
fixes are complete. It has not run in real NW.js: references, repeatability and reintroducing
the water bug are still pending. Do not claim this row is Done.

## Active lanes

| Lane | Owner | Write surface | Verification |
| --- | --- | --- | --- |
| First integration wave | Complete locally | Nine features and screenshot tooling | Full suites, coverage and static gate passed |
| NPC schedules: 7.1.4 | Complete locally | Pure/runtime/editor schedule parts and targeted API/header hooks | Reviewed; walking continuity, page scope, save flags and targeted suites passed |
| Picture tracing: 8.5.1 | Complete locally | Trace parts, data codec, menu/capture/export and deploy cache hooks | Independent review fixes and fit/drag/import/capture/export/persistence/deploy tests passed |
| Event commands: 7.1.2 | Complete locally | New command logic and event editor parts | Reviewed; internal branch terminators, string choices and dialog identity fixed; targeted suites passed |
| Short Details: 8.2.4 | Complete locally | Simple mode rules and inspector display | Event grouping review fixed; pure rules, DOM More/search, usage, mixed-selection and related suites passed |
| Normal maps: 7.1.5 | Complete locally | New normal lighting parts and companion manifest hooks | Review fixes passed: alpha/depth ownership, rotated UVs, wall-mask contribution, shader precision and base-sprite zoom; real GPU pending |
| Plugin report: 9.5.2 | Complete locally | New clash/report parts and Info/Problems hooks | Reviewed; conditional-alias and removed-observer fixes pass regression tests |
| With the music: 8.4.4 | Complete locally | Beat game parts, Motion/Lighting, particles and API | Review fixes passed: real-emitter initial kick burst, read failures, stop/replacement and map-terminate cleanup |
| First-map quest: 8.1.4 | Complete locally | Pure steps, corner card, first-run hook and save/play observation | Review fixes passed: temporary Not Now, blocked storage fallback, async play, failed saves and map identity |
| Generated maps: 7.3.5 | Complete locally | Seeded pure/runtime/editor generator and room openings | Reviewed catalog/transactional behavior, save-load regeneration, alias readiness, shared placement code, full-frame art, viewport-bounded biome preview, live tile dimensions and stable room UIDs; targeted suites passed |
| Save-safe changes: 9.5.3 | Complete locally | Shipped snapshots, aliases, named state storage, release UI and deploy reminder | Independent review fixed UID reuse/ownership, stale delete target, inferred renames, coherent disk snapshots and generated-map readiness; targeted regressions GREEN |
| Heat haze: 9.3.3 | Complete locally | New pure/filter/editor parts and postFX hooks | Reviewed; anchor/rotation/zoom placement, export exclusion, pass order, quality and comfort tests GREEN; real GPU pending |
| Player photo mode: 8.3.6 | Complete locally | Shared capture game part, mode UI/lifecycle, narrow header/API/capture hooks | Reviewed; canonical screenshots path/no overwrites, browser save, capture failures, exact camera/look/visibility restoration, loop controls and game-only tests passed |
| Guessed defaults: 8.1.3 | Complete locally | Pure guesses, metadata, factory, Details, placement action and preferences | Reviewed; non-doodad exclusion, explicit defaults, reindex memory, language, map-safe Undo settings and adjacent asset/look suites passed |
| Auto quality: 9.1.2 | Complete locally | Pure hysteresis, shared resolved quality, sampling/fade and Options | Reviewed; fixed choices, last settled level, interrupted fades, config reload, pending transfer and adjacent normal/3D/Haze/comfort suites passed |
| First-person camera: 7.3.8 | Complete locally | Pure/runtime/editor camera and controls | Reviewed; orbit fade regression, sequential map yaw, Photo lock release and focused runtime/game-only suites passed; MZ/GPU pending |
| Art credits: 9.4.3 | Complete locally | Pure ledger, metadata/packs, search/import/Details and local credits output | Reviewed; indexed fallback clearing, inherited/fallback rename, room/state/model/normal refs, opt-in checks, supplied notes and adjacent pack/import/asset/Problems suites passed |
| Seasonal climate: 9.2.6 | Complete locally | Seeded spans, weather holds/interiors, ephemeral fog/wind, World tables/forecast strip and commands/API | Reviewed; cross-save wind ownership and prototype-named seasons fixed; pure/runtime, UI Undo and adjacent atmosphere/world/map tools suites passed |
| Placement preview: 8.2.2 | Complete locally | Real sprite pool, shared brush/path plans, capture/lifecycle hooks | Reviewed; stale pooled reflections and native fade preservation fixed; actual brush/Paint/path parity, pooling, capture and lifecycle targets passed |
| Animated import: 9.4.2 | Complete locally | Bounded GIF/APNG readers, PNG sheet, transactions, index/drag/pack metadata and exact runtime frame count | Reviewed CRC/order/probe budgets, common colour types/transparency, source alias preservation, real drawer drag and new actor-file default; author defaults preserved; targets passed |

| Save pictures: 9.1.4 | Complete locally | Bounded JPEG/info helpers, native map snapshot, save metadata, native list layout and parameter | Reviewed; image dimensions/size, asynchronous fallback, title preservation, subclass fallback and stale-cache targets passed |
| Flat battlebacks: 9.1.7 | Complete locally | Shared visibility helper, flat/3D capture, named priority and map settings | Reviewed; capture/projection failure restoration, reflections, native fallback, names, engine lifecycle/character targets passed |
| Light/sight: 9.2.4 | Complete locally | Shared light sum, raw gameplay snapshot, bounded LOS/actions, APIs/command, World darkness switch and event Details/cone | Root review fixed page precedence, stale API snapshots, reserved-common retry and inactive/editor pause; focused lighting, Perspective, UI and game-only suites passed |
| Title map: 9.1.3 | Specialist, active | New pure/runtime/editor title parts and test | Architecture accepted: isolated constructor-built game context for update/render; native commands outside context; RED/GREEN next |
| Plain words: 8.3.8 | Coordinator, active | Offline phrase rules and palette adapters | Offline phrase table, closed canonical commands, preview before Enter; RED/GREEN next |

The user requested continuous work through all remaining rows, with no stops after waves.
The session permits two active agents including the coordinator. Use successive
specialists, with disjoint files while both are editing. Do not run the full test
runner during edits: it checks that the entire repository stays unchanged.

## Decisions and limits

- Read the plan's own item and rules before building it; keep user flows complete.
- Runtime features work in the game-only build; editor parts start `// @editor-only`.
- Chromium 85 and MZ only. No external services enabled automatically.
- Do not start MZ, `Game.exe` or `nw.exe`; the owner handles real playtests.
- Mark implemented rows “Built; MZ playtest pending”, never “Done” without that evidence.
- Keep original art, private project data, configuration and existing work intact.
- When 8.4.1 Decorate and 8.4.2 remembering worlds are built, extend Shipped snapshots and
  runtime name cleanup to include their saved placement data.
- Preserve Doc and Qiu Jiu credits; do not add attribution trailers.

## Latest verification

- Current gate: static PASS (217 editor parts, 80 runtime parts, 1,618 strings).
  Full coverage PASS: 190/190 suites in 177.0 seconds; lines/statements 92.19%,
  branches 77.92%, functions 86.97%. All thresholds passed and the repository stayed
  unchanged. Save pictures, flat battlebacks and light/sight are included. Next small
  follow-up excludes screen-fixed/UI lamps from gameplay light queries.
- `npm audit --audit-level=moderate`: zero vulnerabilities (16 November 2026).
- Red/green runtime tests exist for each row listed above.
- Adjacent menus, weather/camera, postfx, inspector, regions, API and creator suites passed.
- Independent review fixed area-banner lifetime and help routing (537b748); creator and
  collision source reviewed separately. Simple mode review passed; late tool registrations
  have regression checks. Playtest cleanup, timeouts, preload errors, parallel events,
  reference transactions and canonical destination isolation were reviewed and tested.
- Initial verify without suites found the new API JSDoc was not in the generator's format;
  corrected it and generated types successfully. Repeat the gate after integration.
- 3,000-doodad stand-in benchmark (120 main frames, 60 moved/3D): baseline ee038ad
  9.21/7.05/11.62 ms; integration 7.05/7.38/12.22 ms. Wall-clock samples vary; these
  are not a GPU playtest or evidence of a speed improvement.
- Final `node scratch/verify-project.js --skip-tests`: PASS, including syntax, source/build
  match, game-only editor guards, lint, generated guide/translation/types, versions and scans.
- Final `npm run coverage`: 164/164 suites passed (162.9 seconds). Lines/statements 91.48%,
  branches 78.82%, functions 85.98%; all configured thresholds passed.
- `npm run build:game`: 51 runtime parts, with runtime/editor-absent tests in the full run.
- `git diff --check`: passed. First integration wave is committed locally at 038ef5a.

## Remaining work

Continue with 9.1.3 isolated title maps and 8.3.8 offline plain words, then follow
the dependency order in the three plans. These and later rows are not implemented merely
because their plain rules exist. The broad 67-row objective remains in progress.

There are 35 other buildable rows still open, plus the external-plugin compatibility
item 7.4.5. Preserve the original three partial Claude worktrees; recovery is integrated,
but they have not been deleted. Nothing has been pushed, opened as a PR or published.
