# Verification record

## Final frozen source — October 5, 2026 UTC

The strict TypeScript build and **137/137 automated tests** passed, with zero failures or skips (about 61 seconds): 32 Basic/content checks, 15 Advanced checks, 42 Advanced interaction checks, 27 AI checks and 21 companion/desk checks. The 42-case Advanced interaction suite also passed separately. The final paired balance reports contain **144 terminal games**, with zero errors/timeouts: [120 Basic](ai-balance-report.json) and [24 Advanced](ai-advanced-balance-report.json). These use the two original fixtures; they do not certify unavailable official setups or all printed effects.

Hard won 33/40 versus Easy and 26/40 versus Normal in Basic; 6/8 versus Easy and 5/8 versus Normal in Advanced. The measured advantage has substantial seat bias and is not evidence of expert-human strength. Full matchup, action-cap and timing details are in [async play](async-play.md). The additional seed subset was reused after initial evaluation and is not an untouched final holdout.

## Advanced expansion baseline — October 5, 2026 UTC

The strict TypeScript build and **72 checks** passed, including six complete Advanced games and five complete Basic games with validated transitions and deterministic save continuation. Real Chrome passes exercised chosen Magic costs, nested Negation/Tome cancellation, recovery between hits, Monster summoning, Study handoffs, Winter sales, local reload and copied JSON import. Seven CSS frame sizes passed zero body overflow and in-frame Hand/modal checks. Motion On/Off and reload persistence were verified. See [Advanced playtests](advanced-playtests.md) for the actual seeds, interactions and limits.

The production asset inventory now contains **28 original generated WebP assets**. Advanced preview enables 141 of 186 card-effect records, with 45 reference-only effects gated; all 38 Hero counters and 36 Monsters are available. Four-board locations and 28 named campaign starts are cataloged, but no official campaign setup or complete four-board graph is certified. Remote multiplayer remains absent. This paragraph records the Advanced baseline; the subsequent Campaign Desk/difficulty pass is documented below.

Native Blob download completion was not confirmed because the automation download event timed out. The copy/text backup was validated and loaded through the ordinary UI. Physical touchscreen, audio and AI-strength testing remain outside this baseline.

## Campaign Desk and AI pass — October 5, 2026 UTC

Real Chrome loaded a recorded campaign through the normal UI and verified automatic return briefings, saved human messages, plain-text rendering of HTML input, an accurate map ping, private note visibility by seat and delegation during Study. After AI committed the Study step and the next human seat was revealed, a per-seat takeback restored Oathborn to Human. Replay Before/Next/Previous observations left the copied full save and random state exactly unchanged. All five desk tabs passed in-frame/zero-overflow geometry at seven CSS sizes, totaling **35 checks**; the [geometry record](async-responsive-geometry.json) and [async play record](async-play.md) contain the evidence and limits.

The companion model/renderer has **21 targeted checks** for privacy, audience filtering, bounded history, delegation/save invariants and safe text rendering. The final [120-game Basic AI tournament](ai-balance-report.json) completed with zero errors/timeouts. Hard won 59/80 appearances (73.75%): 33/40 versus Easy and 26/40 versus Normal. It won 40/40 Resistance assignments and 19/40 Invader assignments, so self-play does not establish expert-human strength or balanced official scenarios. The AI policy passed 27 regressions, including information isolation, Study/upkeep planning and allied-ping handling. The [24-game Advanced tournament](ai-advanced-balance-report.json) also completed without errors/timeouts; Hard won 11/16 appearances (68.75%).

The Campaign Desk is local and saves with the campaign. It does not provide live remote rooms, secure accounts, closed-browser AI workers or delivered push/email notices. Replay is observable history, not undo. Full save files retain private all-seat data and require trusted exchange. Physical touch, audio and expert-human difficulty assessment remain unverified.

## Earlier Basic and map UI verification — historical record

Earlier engine verification: October 4, 2026. Earlier UI review: October 5, 2026 UTC. The strict TypeScript build and 30 automated tests pass. Tests run against the same compiled engine used by the browser; imported content is checked by the shared validator. The UI revision leaves the rules engine and opponent behavior unchanged.

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

As of that Basic/map UI pass, official opening/victory instructions, all-board topology, complete Advanced play and remote multiplayer remained absent. The current Advanced preview coverage is recorded above. The enabled fixtures are explicitly original; importing a structurally valid pack does not certify source fidelity.
