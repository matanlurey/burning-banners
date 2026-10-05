# Advanced preview implementation

Release audit: October 5, 2026 UTC. **Advanced preview is enabled** for the two original digital fixtures. The rule systems below are executable; full official Advanced parity is not claimed. The complete catalog separates printed facts from runtime availability, and [5 effects remain reference-only](advanced-runtime-coverage.md).

Primary authority is the publisher's [Undying Rules v1.1](https://compassgamesbucket.s3.us-east-2.amazonaws.com/downloads/Undying%20Rules%20v1.1.pdf), especially §§13–18 and its card corrections. Printed faces and counter values were visually inspected in the [VASSAL v1.7 reference module](https://vassalengine.org/library/projects/Burning_Banners). The community module witnesses components; it is not an independent rules authority or an art redistribution grant. The [content audit](advanced-content-audit.md) records normalization and corrections.

## Ownership, Study and Winter

Cards belong to players, including players controlling several kingdoms. Starting hands contain three Spells and one Blessing per controlled kingdom. Full Strength is a draw threshold, not a maximum hand size. After every kingdom turn, all players receive Study. Glyph permits up to three different disciplines; Churn permits one. Spell/Blessing Study supports its optional discard, then draws to the applicable threshold. Treasure Study retrieves one owned Treasure, or two with the applicable Endless Satchel benefit.

The engine shuffles the finite Study-marker pool and assigns markers to live kingdom turns. Two kingdoms use two Glyphs/one Churn; three use three Glyphs/one Churn; larger games use four Glyphs/two Churns. Autumn adds a Churn; Winter removes it. Collapsed kingdoms receive no marker.

Played Treasures become face-up owned cards and can later return to hand through Study. Selling gives two gold, with timing eligibility checked. Sales remain withheld until the Treasure deck empties or the final Winter step. Winter retains commanded Monsters, reopens defeated Lairs and requires each player's held-plus-owned Treasures to fit the limit: two normally, four with owned Endless Satchel. Each player resolves excess explicitly before the final shuffle and next Spring. Newly acquired Satchel has its immediate store/sell choice. Ordinary curse/fountain effects run automatically. An unsellable-only excess pauses for a logged human ruling because no official disposal exception was verified.

## Combat decisions and Magic

Attacks open the ordered Battle Magic sequence: attacker Magic, defender-side Cantrips, then attacker-side Cantrips. Eligible allies follow explicit player order in each window. It is not an unlimited alternating response stack; the attacker's final window does not reopen the defender's window. Empty windows are skipped. Ordinary activation Magic, Cantrip permission, Mage requirements, printed ranges, legal targets and meaningful-effect checks use the same action generator as the UI and bots. Out-of-turn Regenerate requests now require the owning player’s confirmation before its resources are spent; AI healing choices are restricted to owned Armies.

Nested Negation/Orb responses preserve the parent decision. Chosen discard/gold/sacrifice costs are paid before counter cancellation. An accompanying Tome inherits its Spell's timing permission and is canceled with that Spell. Mage requirements and optional boosts are separate choices. Default effects expire when their activation ends; explicit printed durations override that default.

Dice are rolled before critical-response decisions. Receipts preserve raw dice and every confirmation in a critical chain. Hit allocation is individual, with Magic decisions between hits: Cure Wounds can recover an Army after its first hit so it survives its second. When an Army dies, remaining hits can still reach its surviving Hero. Unit dice modifiers resolve before stack modifiers; garrison dice use their separate base rating. Monster reward eligibility is retained through elimination so a defeated Feral attacker does not receive a reward after vanishing.

## Heroes and stacks

All 38 checked Hero counters enter their kingdom's randomized unbuilt pool. Hero cards with reference-only effects are still recruitable with their printed counter statistics; their unsupported Powers are unavailable. Eliminated Heroes return to the randomized pool at the end of a kingdom turn. Hero-card Lock changes Power availability independently from whether the unit has finished; locks clear at that Hero's next kingdom Activation Phase.

Army/Hero members track movement separately. A fast Hero can pick up a fresh Army, and dropping a member finishes that member while preserving the moving member's remaining allowance. A ready Army must separate from an exhausted Hero before activating alone. Flying requires the whole stack to qualify. The selected stack's displayed movement reflects current bonuses and member budgets. Hits, advances and Army attacks preserve a Hero-led activation's identity.

A lone Hero cannot attack or be attacked normally and is eliminated by enemy Army entry. A Hero in a Settlement can command its garrison. Applicable Hero abilities, Army/stack characteristics and Feral restrictions are included in legal actions and combat forecasts. The Siskar Power, Whips of Grom and three Enslave cards remain outside automatic parity; Full tabletop provides human resolution. The additional interrupt flows are documented in [advanced decisions](advanced-interrupts.md).

## Monsters and rewards

The finite pools contain 29 land and seven sea Monsters. Monsters are separate entities: they do not move, stack or advance. Unexplored Lair attacks reveal a Monster; units cannot enter Lairs. An opposing kingdom commands each revealed or summoned Monster, with the three-command limit resolved by an explicit Slink Away choice. A commanded Monster gets one Strike, Slink Away or Pass per turn.

Strike range is Sea four over Sea/coastal edges, Flying three, Mage two, otherwise one. Ordinary Strikes cannot target fortified Settlements. Eligible Mage Monsters can cast Spells but not Blessings/Treasures or effects forcing caster movement/elimination. Monsters take one hit. Defeating a Lair Monster in combat awards its printed gold and a Treasure; wandering Monsters award gold only. Ordinary out-of-combat elimination awards neither; the Four Fingered Fist's printed exception is explicit. Defeated Lairs reopen in Winter.

## Content, saves and interface

`content/advanced-catalog.json` contains all 186 game-card records and 36 Monster records. `build.mjs` generates `src/advanced-data.ts` for the browser bundle. `cards-index.json` preserves the 192-card inventory, including six information cards. `runtimeLimitations` is the executable gate list, independent of a record's `verified` printed-fact flag.

Advanced save shape validation checks bounded decisions, hidden zones, card duplication, counter inventories, Hero links and deterministic random state. Human handoffs conceal the previous hand until the next participant reveals theirs. This local courtesy screen is not an account-secured private projection. A copyable backup fallback complements the explicit JSON download link; copied text was reimported through the normal UI.

The Hand exposes only eligible plays and explains unavailable records, with separate caster, target, Tome, costs and effect choices. Show Target on Map focuses the relevant position. The Council shows stack members and movement; Monsters have distinct labeled counters. The Codex searches all cards, Heroes and Monsters and displays campaign/map references. Motion follows System or explicit On/Off preferences, with optional sound.

See [playtest evidence](advanced-playtests.md), [runtime coverage](advanced-runtime-coverage.md) and [remaining source/rule uncertainties](../rules/ambiguities.md). Official campaign setups, complete four-board mechanical geography, remote multiplayer and expert-human AI strength are not completed by this release record. The subsequent local async companion and difficulty evaluation are documented in [async play](async-play.md).
