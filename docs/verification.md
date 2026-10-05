# Verification record

## Full tabletop and combat-odds completion — October 5, 2026 UTC

The strict TypeScript build and **178/178 automated tests** pass, with zero failures, skips or timeouts in the final suite (53.65 seconds). This includes analytic combat forecasts compared with 20,000 real engine battles, advanced effect interactions, private replay/briefing isolation, collapsed-kingdom and finished-stack AI regressions, human-only Winter rulings, nested manual responses, and finite tabletop inventories. The same compiled modules run in the browser.

The full tabletop exposes all **148 Magic cards, 38 named Heroes, 36 Monsters, 44 Army definitions and four Enslaved Hero markers**. A traversal test moves every Magic card/Hero/Monster through its physical inventory while validating the state. The automated Advanced preview now resolves **169/186 effect records**; **17** use human table resolution in full tabletop. [Runtime coverage](advanced-runtime-coverage.md) names each limit; [full tabletop](full-tabletop.md) explains setup, privacy, responses, adjudication and campaign victory.

The final [60-game Basic](ai-completion-basic-balance.json) and [36-game Advanced](ai-completion-advanced-balance.json) paired difficulty passes contain **96 terminal games**, with zero errors/timeouts. Hard won 26/32 against Easy and 22/32 against Normal across those passes. An additional [12-game regression subset](ai-completion-retest.json) also finished without errors/timeouts. These use two original digital scenarios and reused seeds; they do not establish expert-human strength or official faction/scenario balance. Earlier, larger baseline tournaments below are historical measurements from earlier source.

Real Chrome completed a human battle through Magic priority handoffs, Ambush, hit allocation, End Turn and every player's Arcane Study. Replay's Before/After, event selector, Next and Previous controls were exercised against public hit receipts. Full tabletop checks included a printed-stat Army/Hero stack, current-activation Ritual of Speed modifiers, private Spirit/Negation responses, sacrifice of the Negation Mage, a saved parent response restored through reload/import, dice receipts, and explicit human completion. Another fixture confirmed that all-AI play stops for an unsellable-only Winter holding-limit conflict. The engine does not invent an exception or let the AI approve it.

A representative six-seat table was imported through the ordinary browser file picker. Public map search and filters, per-member movement costs, normal/Ambush and Army-first/Hero-first forecasts, focus, keyboard pan, drag and wheel zoom were verified. Forecast selection/comparisons do not consume the random stream. Clipboard permission failure leaves visible selectable JSON; that text exported, validated and reloaded through the ordinary import UI. Native Blob download completion remains unconfirmed.

The four Table sections passed **28** responsive checks, combat forecasts passed **7**, and the longest six-kingdom setup passed **7**: **42 new layout checks** across 1280×800, 390×844, 360×740, 320×568, 768×1024, 844×390 and 736×414 CSS frames. Body overflow was zero and controls stayed in frame; the Start/Load controls remained reachable through native scrolling or keyboard focus. See [Table geometry](tabletop-responsive-geometry.json), [forecast geometry](qol-responsive-geometry.json), [setup geometry](setup-responsive-geometry.json) and [camera observations](qol-camera-geometry.json). The final review also fixed native focus scrolling behind the map camera and moved attached-Hero badges beside their own counters. Seven additional [focus/alignment checks](qol-focus-alignment.json) kept the selected counter in frame, its screen position within 0.51 px of the camera projection and every map-layer scroll offset at zero. This brings the new responsive/alignment checks to **49**. [Desktop forecast](screenshots/qol-desktop-forecast.jpg) and [phone forecast](screenshots/qol-phone-forecast.jpg) show the resulting interface.

These are real responsive browser frames, not physical touch-device emulation. Physical pinch/touch hardware, sound and expert-human AI strength remain unverified. Local Chrome exercised the release build; the existing owner-private production site requires the owner's sign-in, so deployment status and pushed-source/archive provenance are checked separately from local UI QA. Hosted async multiplayer, remote message delivery and closed-browser AI workers are deliberately deferred.

Official full Campaign Book setups and a calibrated four-board movement graph remain unavailable. Table templates expose the cataloged locations and separate editable boards; players must enter/calibrate the printed terrain, joins, opening forces and victory conditions. Cross-board joins can be adjudicated through table relocation until verified. Full save files contain all seats' private data and are suitable for trusted pass-and-play/file exchange, not secure competitive remote hosting. Older records below describe earlier milestones, not the current completeness claim.

## Earlier Campaign Desk baseline — October 5, 2026 UTC

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
