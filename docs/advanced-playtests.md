# Advanced release playtests

Completion update: the latest build adds Full tabletop, 169 automated effects, 17 human effects and attack probability/navigation aids. See [current verification](verification.md), [coverage](advanced-runtime-coverage.md) and the [table guide](full-tabletop.md). The earlier measurements below remain historical.

Checked October 5, 2026 UTC against the production bundle. This record covers the Advanced expansion baseline. The subsequent [Campaign Desk, async interactions and difficulty evaluation](async-play.md) are recorded separately.

## Automated verification

The initial expansion’s strict TypeScript build and **72 checks** passed: 30 existing Basic/content checks, 15 Advanced checks and 27 Advanced interaction checks. Tests use the compiled engine shared with the UI. Accepted transitions are validated; portable saves preserve hidden zones and random continuation. Coverage is targeted, not proof of every printed rule or every supported card combination.

| Complete game profile | Original fixture | Seeds | Games |
| --- | --- | --- | ---: |
| Advanced | Drefeld teaching | 1, 29, 1986 | 3 |
| Advanced | Six banners sandbox | 5, 49, 20261005 | 3 |
| Basic | Drefeld teaching | 1, 1986, 29 | 3 |
| Basic | Six banners sandbox | 2026, 20261004 | 2 |
| Total | | | 11 |

All six Advanced games reached the scenario deadline, validating each accepted transition and periodic exact continuation through exported/imported pending decisions. The five Basic full-game regressions also completed. Completion demonstrates legal progress and save consistency; it does not establish challenge, faction balance or official scenario fidelity.

Meaningful Advanced regression cases include initial player hand ownership, exact deck/counter inventory, randomized Hero recruitment/recycling, Lock eligibility, independent pickup/dropoff movement, exhausted-member separation, Hero-led Army attacks and advance, Study thresholds, Battle Magic order, explicit two-card costs, canceled-card costs, Tome cancellation, Black Diamond confirmation chains, unit-before-stack dice modifiers, garrison conversion, per-hit Cure Wounds and surviving-Hero allocation, Monster/Lair rewards, Feral reward suppression after elimination, explicit three-command overflow, Satchel/Winter limits, withheld sales, Hand of the Emperor duration and Khazud collapse exclusions. Malformed hidden zones, duplicate cards/counters, invalid Hero links and deeply recursive decisions are rejected.

Reproduce the suite with:

```sh
npm run build
npm test
```

`tests/fixtures/browser-advanced.mjs` generates valid portable interaction saves for browser diagnostics. They use original teaching geometry, not official campaign setups. Importing these fixtures through Load Saved Game exercises the normal file input and validator.

## Browser play passes

Real Chrome actions used the production modules with the ordinary UI. State was not injected through page scripting. Diagnostic positions were loaded through the normal save-file picker.

| Pass | Actual interactions and observed result |
| --- | --- |
| Opening and stack | Collected Oathborn income, recruited Throndil, activated Iron Legion/Throndil, played Mountain Folk and observed the increased movement/dice. Summoned Ao-Bishi with Black Tide, then finished the activation. |
| Chosen costs and counter | Fjordland played Quest to the Western Isles using two different chosen Spells. The responding Oathborn handoff concealed/revealed the correct hand. Throndil cast Negation, sacrificing the Mage; the Quest was canceled and its paid costs remained spent. |
| Spell plus Tome | Imported the battle diagnostic. Selected Molten Hammer with Tablets of Amûn Koth, checked target-to-map focus and played it. The opponent's Negation canceled both the Spell and Tome. The parent battle continued without a blank extra reaction window. |
| Recovery between hits | Imported the two-hit diagnostic. Allocated the first hit to Sea Reavers, played Cure Wounds in the intervening Magic opportunity, then allocated the second hit. The Army survived weakened. |
| Winter holdings | Imported the Winter diagnostic. A player with five Treasures and owned Endless Satchel had to reduce holdings to four. Sold one for two gold, completed Winter and reached Spring of Year 2. The Winter panel shows holding/limit/excess counts. |
| Saved game continuity | Browser-local IndexedDB reload restored the game. A copied 64,813-character Advanced JSON backup validated and was reimported through the normal UI, preserving the campaign. |
| Private choices | Study and Magic-response handoffs concealed prior hands until the next participant revealed theirs. This is local courtesy privacy, not server authorization. |
| Preferences | Motion Off produced a zero transition; On produced a 0.15-second transition. Off survived reload. System was restored afterward. |

The explicit backup download link is present, but the browser automation download event timed out for native Blob downloads. **A completed native file download was not confirmed.** The copy/text fallback was verified by valid JSON import. The app handles unavailable Clipboard API with visible selected backup text instead of throwing. Final browser logs contained no errors attributable to the preview application's origin; unrelated browser-extension metadata errors were excluded.

## Responsive pass

The final build was rendered at all seven CSS frame sizes below. Body horizontal overflow was zero; modal and Hand bounds stayed within their frame. There is one internal scroller for the Winter panel. Short landscape and the smallest phone frame were included.

| Frame | CSS dimensions | Result |
| --- | ---: | --- |
| Desktop | 1280×800 | Passed |
| Phone | 390×844 | Passed |
| Small phone | 360×740 | Passed |
| Compact phone | 320×568 | Passed |
| Tablet | 768×1024 | Passed |
| Landscape phone | 844×390 | Passed |
| Small landscape phone | 736×414 | Passed |

Saved visual evidence: [desktop Army/Hero stack](screenshots/advanced-desktop-stack.jpg), [phone Winter cleanup](screenshots/advanced-phone-winter.jpg), [compact phone](screenshots/advanced-compact-phone.jpg) and [small landscape](screenshots/advanced-small-landscape.jpg). Measured records are in [responsive geometry](advanced-responsive-geometry.json) and [Hand geometry](advanced-hand-geometry.json). The Hand record’s `actionBar: null` is an unmatched measurement selector, so it does not certify action-bar bounds. The visible frame checks and prior UI check record provide that context.

These were genuine rendered-browser frames, not physical touchscreen hardware or mobile-device emulation. Earlier camera/zoom checks are preserved in [UI browser checks](ui-browser-checks.md); the first-paint/button-zoom review is recorded separately in [camera audit](camera-audit.md). The old four-cycle exact-restore result belongs to the earlier revision and is not claimed as a fresh result of this Advanced pass. The new Hand retains native labeled selectors for caster, target, Tome and costs; unavailable cards explain their restrictions. Separate Army/Hero map names, distinct Monster counters, stack-member movement, target focus and readable receipts support the Advanced decisions.

## Final integrated release pass

After the baseline above, the frozen source passed **137/137 full-suite tests**, including 42 Advanced interaction regressions. The final difficulty pass completed 120 Basic plus 24 Advanced paired games without errors/timeouts. Stress testing repaired command-limit handling, repeated free Ship use through alternate stack leaders, and magical Hero gain/readiness/finished-stack traps; joins remain limited to the Hero’s own kingdom even under shared player ownership. The final games were rerun against those repairs. Full metrics, action caps and the Campaign Desk’s 35 layout checks are recorded in [async play](async-play.md) and [verification](verification.md).

A normal-UI Regenerate fixture tested owner consent: during Oathborn’s turn, the weakened Goblin Hill Troll’s two-gold confirmation recovered it ready, spent Goblin gold from 18 to 16, retained Oathborn as current kingdom and recorded the event as Goblins. The copied backup confirmed the owner attribution.

## Limits

Physical touch/pinch hardware, audio output, long human games, expert-human difficulty strength and scenario balance have not been established by this baseline. The later local AI self-play and Campaign Desk checks are recorded in [async play](async-play.md) and do not replace those evaluations. Forty-five effects remain intentionally gated. Official campaign setups and complete four-board topology are absent. See [runtime coverage](advanced-runtime-coverage.md), [campaign/map audit](campaign-map-audit.md) and [rules uncertainties](../rules/ambiguities.md).
