# Published campaign integration validation

On 5 October 2026, the source-integration build passed **99/99 native integration tests** in one run, with no failures, skips, cancellations, or pending tests. The run took 251.479 seconds. A separate set of **24 direct source-objective assertions** also passed. Exact counts, input SHA-256 hashes, and qualifications are recorded in [campaign-validation-results.json](campaign-validation-results.json).

This evidence covers the source-integration build identified by those hashes, before the subsequent C17 City/ruin timing and Huge/T33 lifecycle refinements. It is not a claim that the entire 99-case matrix was rerun after those refinements; their targeted verification is recorded separately.

The final lifecycle build passed **43/43 targeted cases**: 24 campaign/runtime cases, 16 map/shipping cases and three Full tabletop conversion/recovery cases. These cover Huge stack departure, prohibited settlement repair/build outcomes, Hero arrival readiness, Storm Giant’s Amulet razing on entry, fresh hostile City conquest before placing Razed, exclusion of existing ruins, fixed foreign defenders and gained Heroes, the explicit Enslave exception, and recorded recovery after a Horn interruption. Source/test hashes and commands are in [campaign-engine-validation.json](campaign-engine-validation.json).

Earlier in the same release pass, the core/odds/async/map suite passed 70/70 cases and the Advanced completion/interactions/interrupt suite passed 82/82. Those precede the final, narrowly scoped gained-Hero destination filter; the new filter is covered by the final targeted cases. These counts are separate runs, not additional campaign self-plays.

Seven existing Hero-gain, shared-player, elimination-window and teleport/Portal regressions were also rerun on the final build: 7/7 passed.

```sh
npm run build
node --test tests/published-campaigns.test.mjs
```

The book library contains **28 named starts**: the introduction, 17 standalone Scrolls, and 10 Chronicle starts. It also provides linked Chronicle and Bitter End modes. The principal complete source is the [60-page Spanish publisher review copy](https://edicionesmasqueoca.com/diarios/2025/06/12/a-punto-para-pre-produccion/), cross-checked against official English living rules and errata and the English Campaigns at a Glance reference. The publisher identifies this copy as pre-production, so its contradictions are retained as explicit choices or qualifications rather than silently resolved.

## What the passing run establishes

- **56 setup cases:** all 28 starts in Basic and Advanced profiles. Tests compare printed turn order, gold, income, revolt, and unambiguous initial Control counts against the independently transcribed source facts. Each opening resolves required choices, places mandatory free units, buys an Army per participating kingdom, checks physical supply and state validity, and saves/reloads every action deterministically. Basic deployments exclude Heroes; Advanced deployments check required and unavailable Heroes.
- **Victory conditions:** named settlement and City objectives, Army occupation versus Hero occupation, Control versus Coven counting, Razed eligibility, side-wide collapse, simultaneous conditions, source tie breakers, revolt-adjusted income, immediate versus kingdom-turn/season-end timing, and deadline-only conditions. Additional direct assertions cover all ten Chronicle Night-collapse conditions, the Chronicle two settlement/City requirement, chapters with no extra deadline objective, standalone collapse targets, and both First Among Equals occupation sides.
- **Source special rules:** optional Night Control-to-Coven exchange, interleaved allied deployments, foreign Fjord units and Hero reservations, no rebuilding foreign contingents, simultaneous ally switching and save/reload, nonparticipating kingdom postures, restored settlement loyalty, first-Autumn extra Churn, Night's corrected Control/Coven capacity, the fixed Oskolton Berserker, free Oathborn repair, and Osterlich's anchored fragile defender.
- **Linked play:** legal calendar progression exercises the Spring 593 Treaty, Spring 596 Fjord return and turn-order resumption, Winter 594 abandoned Lairs, Winter 598 Bitter End defender, and the following Spring. A complete Basic Bitter End dry run visits all **35 seasons**, preserving the original Army identities through chapter transitions. Its extra starting gold isolates the calendar; it is not a balance result.
- **Bounded play:** Basic AI completes the introductory start, For Eternal Glory, and Spire of Shadows through a legal early victory or the printed deadline. Broader policy and Advanced self-play results are documented separately in [campaign-ai-validation.md](campaign-ai-validation.md).

## Corrections found during integration

The source comparisons caught a substring match that omitted every printed Blackstone Fortress marker. Integration also exposed Basic references to fixed/unavailable Advanced unit definitions, blocked native Fjord recruitment after a foreign contingent, duplicate Hero reservation during interleaved deployment, missing first-Autumn extra Churn, omitted nonplayer Night control, and hostile treatment of nonplayer Oathborn control of Fjord's Belgunot. These defects were corrected and exercised in the final run. Targeted cases also verify that Night can release a Control during Income Actions to make Coven capacity available and that Osterlich cannot advance out of the Spire after winning a settlement attack.

## Limits of the evidence

The review copy has duplicate Control entries in late Chronicles and unresolved Oronar/Zarinar references. Automated tests explicitly select documented rulings for reproducibility; they do not turn those choices into an authoritative printed correction. Opening income remains the printed budget after such choices. Scenario 15's stated map and its western-entry description conflict; unverified Sea or Road entries are not invented. See [campaign-map-audit.md](campaign-map-audit.md) for source tracing and remaining map qualifications, and [campaign-ui-validation.md](campaign-ui-validation.md) for browser checks.

The publisher's advertised count of 29 campaigns does not name an additional distinct entry in the complete review copy. This validation therefore reports the 28 identifiable starts without manufacturing another scenario. It verifies local campaign integration and pass-and-play, not hosted async multiplayer, every map edge's visual interpretation, or every Advanced card effect.
