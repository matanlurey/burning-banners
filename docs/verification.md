# Verification record

Engine verification: October 4, 2026. UI review: October 5, 2026. The strict TypeScript build and 30 automated tests pass. Tests run against the same compiled engine used by the browser; imported content is checked by the shared validator. The UI revision leaves the rules engine and opponent behavior unchanged.

The tests cover terrain and ship movement, activation order, switching, army supply and recruitment, recovery, combat and critical confirmations, Stealth decisions, siege and garrison calculations, kingdom upkeep, finite Night control/Coven supply, content validation and save consistency. This is targeted regression coverage, not proof of every printed rule. The 35-row [coverage matrix](../rules/coverage-matrix.csv) identifies implementation limits and missing dedicated regressions.

## Complete computer games

Both original fixtures were simulated with all kingdoms controlled by the algorithmic opponent. Each accepted command was checked with `validateState`; terminal saves exported and imported exactly. The five automated fixtures also verify that a saved position resumes to the same next state with the same random outcomes.

| Fixture | Seed | Commands to terminal | Winner |
| --- | ---: | ---: | --- |
| Drefeld teaching | 1 | 72 | Resistance |
| Drefeld teaching | 1986 | 86 | Resistance |
| Drefeld teaching | 29 | 70 | Resistance |
| Six banners sandbox | 2026 | 470 | Resistance |
| Six banners sandbox | 20261004 | 470 | Resistance |

An additional interface integration sweep used seeds 20261004, 47 and 919: teaching games ended in 66, 79 and 81 commands; six-kingdom games ended in 470, 485 and 450 commands. Terminal saves passed validation and exact round trips. The largest observed turn had 44 computer commands, below the interface's 180-command pause guard. All these games ended in Resistance victories; these original setups have not been balanced or established as a challenge for a human.

## Browser interaction and visual checks

The production bundle uses local JavaScript modules, system font fallbacks and 27 original generated WebP assets. Assets were visually inspected; generated terrain, troop and landmark files are inventoried with dimensions and hashes in the [asset manifest](../content/assets-manifest.json).

Final real Chrome checks passed at 1280×800, 768×1024, 390×844, 360×740, 320×568, 844×390 and 736×414 CSS frame sizes. Body overflow was zero, map controls stayed within the board, and action bars stayed within the frame. These were rendered browser frames, not device emulation or physical phone tests. The initial short-landscape clipping was corrected and retested.

On the final UI build, teaching seed 6 completed human income collection, a pointer-selected Iron Legion move to `w-5-10`, the Rangers attack, forecast review, combat resolution and control of Far Tumed. Local saves survived reload through the subsequent Fjordland income phase. Ending a turn with ready armies opened one confirmation; Cancel preserved the turn and Confirm produced the human handoff screen.

Desktop camera checks measured a 60 CSS px drag as a 54.546-world-unit change at scale 1.1. Up/down wheel zoom around the pointer restored the camera, as did four plus/minus cycles. Enter selected a focused army marker; arrow keys panned the map. Opening Muster retained the camera exactly.

Independent source-level checks exercised the actual compiled camera functions with 162 zoom-anchor cases and 18 extreme pan-bound cases. Five handler cases covered three-finger pinch transitions, cancellation, lost capture, screen/world drag conversion and keyboard focus. Five mobile geometry cases checked the selected card/name against the inspector and heading. These isolated-function checks used controlled geometry and event inputs; they are not physical touch tests or a substitute for rendered-browser inspection.

The detailed [UI browser check record](ui-browser-checks.md) contains viewport results, before/after screenshots and completed acceptance checks. Crowded town labels, legal destination hit testing, SVG keyboard selection, compact phone focus and the eighteen-army overview were checked. See the [UI reference research](ui-reference-research.md) for the interaction and readability decisions. Physical touch hardware, audio and extended human playtesting remain unverified; AI strength and fixture balance were not evaluated by this UI work.

## Fidelity limits

Official opening/victory instructions, all-board topology, complete Advanced play and remote multiplayer remain absent. The enabled fixtures are explicitly original; importing a structurally valid pack does not certify source fidelity.
