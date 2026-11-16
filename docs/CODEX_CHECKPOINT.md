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
9.1.5 area names; 9.2.1 nearness triggers.

9.5.1 has a screenshot runner, driver, comparator and mocked-subprocess tests, with review
fixes in progress. It has not run in real NW.js: references, repeatability and reintroducing
the water bug are still pending. Do not claim this row is Done.

## Active lanes

| Lane | Owner | Write surface | Verification |
| --- | --- | --- | --- |
| Integration | Coordinator | Docs, generated outputs, Simple mode | Targeted tests, then acceptance gate |
| Playtest review fixes: 9.5.1 | Existing specialist | scripts/playtest.js, driver/preloader, tests | Source isolation, cleanup, timeout, reference transactions |

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

- `npm audit --audit-level=moderate`: zero vulnerabilities (16 November 2026).
- Red/green runtime tests exist for each row listed above.
- Adjacent menus, weather/camera, postfx, inspector, regions, API and creator suites passed.
- Independent review fixed area-banner lifetime and help routing (537b748); creator and
  collision source reviewed separately. Simple mode review is pending.
- Initial verify without suites found the new API JSDoc was not in the generator's format;
  corrected it and generated types successfully. Repeat the gate after integration.
- 3,000-doodad stand-in benchmark (120 main frames, 60 moved/3D): baseline ee038ad
  9.21/7.05/11.62 ms; integration 7.05/7.38/12.22 ms. Wall-clock samples vary; these
  are not a GPU playtest or evidence of a speed improvement.
- Full acceptance (`verify`, `coverage`, game build) is pending integration.

## Remaining work

Finish the review fixes and acceptance gate, then resume first-wave rows 7.1.2,
7.1.4, 7.1.5, 7.3.5, 7.3.8, 8.3.6, 8.4.4 and 8.5.1. Then follow the
dependency order in the three plans. These and later rows are not implemented merely
because their plain rules exist. The broad 67-row objective remains in progress.
