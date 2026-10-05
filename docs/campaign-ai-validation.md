# Source campaign AI validation

26 complete deterministic self-plays passed. These check legal play, state validity, save/resume, and decision-loop completion. They do not establish a Hard win rate or faction balance.

Each action was compared to the engine’s legal action list. Every resulting state was validated, and each game was saved and imported every 50 actions. The initial pass precedes the final opening composition and C10 safety refinements; the current regressions include those refinements.

| Pass | Campaign | Difficulty | Seed | Actions | Result |
|---|---|---|---:|---:|---|
| initial source-policy pass | intro | easy | 931 | 66 | complete · invader |
| initial source-policy pass | intro | easy | 1327 | 81 | complete · invader |
| initial source-policy pass | intro | normal | 931 | 115 | complete · invader |
| initial source-policy pass | intro | normal | 1327 | 113 | complete · invader |
| initial source-policy pass | intro | hard | 931 | 67 | complete · invader |
| initial source-policy pass | intro | hard | 1327 | 73 | complete · invader |
| initial source-policy pass | campaign-3 | easy | 931 | 185 | complete · resistance |
| initial source-policy pass | campaign-3 | easy | 1327 | 194 | complete · resistance |
| initial source-policy pass | campaign-3 | normal | 931 | 362 | complete · resistance |
| initial source-policy pass | campaign-3 | normal | 1327 | 320 | complete · resistance |
| initial source-policy pass | campaign-3 | hard | 931 | 193 | complete · resistance |
| initial source-policy pass | campaign-3 | hard | 1327 | 170 | complete · resistance |
| initial source-policy pass | campaign-6 | easy | 931 | 162 | complete · resistance |
| initial source-policy pass | campaign-6 | easy | 1327 | 173 | complete · resistance |
| initial source-policy pass | campaign-6 | normal | 931 | 286 | complete · resistance |
| initial source-policy pass | campaign-6 | normal | 1327 | 261 | complete · resistance |
| initial source-policy pass | campaign-6 | hard | 931 | 234 | complete · resistance |
| initial source-policy pass | campaign-6 | hard | 1327 | 219 | complete · resistance |
| current regression | intro | hard | 931 | 73 | complete · invader |
| current regression | campaign-3 | hard | 931 | 200 | complete · resistance |
| current regression | campaign-6 | hard | 931 | 195 | complete · resistance |
| current regression | campaign-10 | hard | 931 | 522 | complete · resistance |
| current regression | campaign-10 | easy | 931 | 133 | complete · resistance |
| current regression | campaign-10 | normal | 931 | 200 | complete · resistance |
| final City-goal regression | campaign-17 | hard | 931 | 102 | complete · invader |
| final Huge and Hero-arrival regression | campaign-12 | hard | 931 | 560 | complete · resistance |

The C10 regression reproduced an opening trap: an opponent could besiege the Night’s preselected build town before its mandatory Hero deployment. The AI now chooses an opening anchor beyond opposing deployment reach. All three difficulties complete C10 with seed 931.

The completed baseline matrix ran 84 setups (28 starting positions × Easy, Normal, and Hard) and six source-goal fixtures: 87 tests passed and three failed. All three failures were Chronicle 8 recruitment: an allied kingdom used the restricted locations needed by the Empire's mandatory contingent. The AI now gives constrained mandatory contingents priority within an allied deployment group. The patched targeted matrix passed 32/32 tests in 359.325 seconds: all 21 affected setup cases (C9, C12, C13, and Chronicles 5–8 at every difficulty), nine source-goal fixtures, the C12 first-round regression, and the Chronicle 8 setup/first-round regression. The baseline's other 63 setup cases were not repeated because the changed contingent policy does not apply to them.

A Hard seed-931 sweep of all 28 starting positions completed 24 first rounds and one immediate source victory (C17, occupying hostile Drakenhold). Three attempts exposed dead ends: C12 at action 91, Chronicle 7 at action 172, and Chronicle 8 during recruitment at action 56. C12 exposed two Huge Army rules: a Hero cannot finish its Huge Army in a welcoming settlement, and a town cannot be recolonized while occupied by a Huge Army. The engine now enforces these constraints. Patched-build Chronicle 7 and 8 first-round replays passed at 176 and 209 actions respectively, and the C12 first-round fixture passed. This completes opening and first-turn coverage of all 28 starts across the baseline and affected-case replays.

The longer C12 replay exposed a foreign-contingent Hero stack mismatch at action 195: Strongheart placed an Oathborn Hero with an Army of a different printed faction. Hero arrival eligibility now checks faction compatibility, Huge restrictions, and readiness before offering a destination or drawing a Hero. The final C12 Hard seed-931 game completed legally after 560 actions, with a Resistance victory in year 2's autumn (turn 23), in 37.782 seconds.

Two final C17 strategy fixtures passed: the AI considers hostile nonplayer Cities and pursues a standing City over a nearby ruin. The sourceGoal filter previously assigned victory value to ruins even though the printed hostile-City condition requires a living City. Fresh conquest can win before mandatory razing; a Feral Army's attack on a living hostile City remains a valid C17 tactic.

The later C17 goal filter and Magic Hero eligibility changes are covered by those two fixtures, the final 102-action C17 game, the final 560-action C12 game, and the engine's dedicated Hero-arrival regressions. These scopes are recorded separately rather than describing every earlier run as one final-build matrix.

Targeted strategy fixtures cover source occupation goals (including hostile nonplayer Cities), loyalty filters, score scopes, Feral razing versus marker requirements, retained Army presence, exclusive allied banners, final Shashka markers, Shashka settlement decisions, and revolt suppression when net income determines the score. The optional C7 personal race is a small bonus after the shared campaign reward.

Reproduce full games with `node scripts/campaign-playtest.mjs report.json intro,campaign-3,campaign-6 easy,normal,hard 931,1327`. Run the setup and strategy checks with `node --test tests/campaign-ai.test.mjs`.

Exact game results and timings: [campaign-ai-validation.json](campaign-ai-validation.json).
