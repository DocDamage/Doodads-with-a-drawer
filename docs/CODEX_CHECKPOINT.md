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
7.1.5 flat-map normal lighting; 8.4.4 BGM-reactive motion/lights/particles; 8.1.4 first-map quest.

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
| Generated maps: 7.3.5 | Specialist | Seeded pure/runtime/editor generator and room openings | Architecture investigated; implementation starts after integration gate |

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
- Preserve Doc and Qiu Jiu credits; do not add attribution trailers.

## Latest verification

- Latest continuation gate: static verify PASS (181 editor parts, 57 runtime parts, 1,507 strings).
  Coverage ran 173 suites with 172 passing; the one failure was a legacy source-inspection assertion
  hidden by the plugin-report wrapper. Plugin findings now join the original Problems collector;
  LPC library, plugin reports and map-check suites pass after that integration. No repository files
  changed during the full run. Coverage passed: lines/statements 91.59%, branches 78.37%, functions 85.95%.
- Normal-test isolation fixed: `DD_REPO_ROOT` is for source reads; the new normal test now always
  creates its own temporary project. Confirmed fake-art/data artifacts were removed and the tracked
  library fixture restored. The corrected test passed with explicit checks that repository data/art
  stayed untouched. No user assets/configuration were intentionally changed.
- Beat and quest review regressions pass, including actual emitter burst suppression, throwing/closed
  audio, stop/map termination, blocked preferences, async Play From Here, unsuccessful saves and
  saving a different map. Next full run is after the next bounded implementation batch.
- Continuation static gate passed with 169 editor parts and 53 runtime parts. Coverage ran all
  168 suites: 161 passed; seven old source-inspection checks failed after a close-method wrapper
  and capture declaration changes. Integration moved the close hooks directly into the original
  method and reordered capture setup; all seven failed suites plus event commands and trace
  passed on targeted rerun. Full rerun is pending the next bounded batch. Coverage thresholds
  passed: lines/statements 91.39%, branches 78.39%, functions 85.63%.
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

Resume first-wave rows 7.3.5, 7.3.8 and 8.3.6. Then follow the
dependency order in the three plans. These and later rows are not implemented merely
because their plain rules exist. The broad 67-row objective remains in progress.

There are 49 other buildable rows still open, plus the external-plugin compatibility
item 7.4.5. Preserve the original three partial Claude worktrees; recovery is integrated,
but they have not been deleted. Nothing has been pushed, opened as a PR or published.
