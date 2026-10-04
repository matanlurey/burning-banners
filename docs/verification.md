# Verification record

Verified October 4, 2026. The strict TypeScript build and 30 automated tests pass. Tests run against the same compiled engine used by the browser; imported content is checked by the shared validator.

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

## Runtime and visual limits

The production bundle uses local JavaScript modules, system font fallbacks and 27 original generated WebP assets. Assets were visually inspected; generated terrain, troop and landmark files are inventoried with dimensions and hashes in the [asset manifest](../content/assets-manifest.json).

Browser interaction and rendered desktop/mobile visual QA were unavailable in this environment. No automated browser or human playtest has certified hit targets, keyboard focus, persistence across reloads, animation, audio or layout. Source inspection and deterministic engine simulations do not replace those checks. Verify those flows in a real browser before considering the app a complete reproduction.

Official opening/victory instructions, all-board topology, complete Advanced play and remote multiplayer remain absent. The enabled fixtures are explicitly original; importing a structurally valid pack does not certify source fidelity.
