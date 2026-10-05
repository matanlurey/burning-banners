# Advanced runtime coverage

Completion audit: October 5, 2026 UTC. **Advanced preview** uses automated decks/Powers. **Full tabletop** includes every physical card/counter and records human resolution for effects outside the automatic engine. Catalog verification and complete executable behavior remain distinct.

| Content | Cataloged | Automated effects | Human table effects |
| --- | ---: | ---: | ---: |
| Spells | 52 | 52 | 0 |
| Treasures | 36 | 36 | 0 |
| Blessings | 60 | 56 | 4 |
| Hero effects | 38 | 37 | 1 |
| Total | 186 | 181 | 5 |

All 38 named Hero counters, all 44 Army types and all 36 Monsters are available. Supported Hero effects include passive/ongoing abilities, not only active buttons. Full tabletop also preserves the separate four Enslaved Hero markers. Six kingdom information cards bring the physical card inventory to 192.

Unsellable-only Treasure excess in Winter requires an explicit human table ruling. AI pauses for it; retaining excess is logged and is not asserted as an official disposal exception. The four affected Treasures' ordinary effects are supported.

## Effects requiring table adjudication

Generated from the compiled runtime's actual gate list. These are excluded from automated preview decks/Power choices, but available through Full tabletop. Human controls provide targets, dice/modifiers, counter changes, movement, hits, markers, private card zones and nested owner responses; they do not enforce each remaining lifecycle automatically.

| ID | Card / Hero | Remaining automatic decision flow |
| --- | --- | --- |
| blessing-night-02 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-03 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-04 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-orcs-01 | Whips of Grom | Movement must preserve a mandatory legal Attack action. |
| hero-goblins-16 | Siskar | Reroll selection must include every d6 event, including outside combat. |

## Interrupt and extra-Attack expansion

Ring, Horn, Freyja, Shapeshift, Knives, Your True Rulers, Spy Network, Luna, Kagash, Sofia, Haga-Tor and Fury now have automatic decision flows. Their legal targets, timing, saved continuations, declined choices and AI decisions are integrated into the existing engine. Extra-Attack choices show expected hits and loss chances without advancing the random stream. See [the source and interaction record](advanced-interrupts.md).

## Completion expansion

The added flows include chosen Conscription/Song of the Valkyrie placements; Runestones/Yeti draw-discard choices; immediate Powerful and Eternal Study; Fear/Kovat owner retreat and Hero separation; Book of the Dead opponent selection; Encyclopedia Monster copying; separate Earthquake strikes; optional second Crushing Vines strike; Necromancy elimination snapshots/recovery; Moryana's Fury stack-hit allocation; Martyrdom Blessing choices; Lilith cast responses; Dominia's automatic Coven placement; Wave Strider transport allowance; Sneak Attack declaration benefits; Szark's Ambush successes; Demonic Possession; mining/loot/elimination event windows and the ordinary curse/fountain effects.

Saved pending flows validate bounded recursion, legal owners/choices, unique card/counter inventories and temporary movement across interrupted Sea crossings. A collapsed kingdom cannot use an elimination response to create a new Hero. Finished stacks cannot cycle join/drop, and an activating Army must leave a finished Hero behind before ending its activation.

## Source and play limits

Both supplied digital scenarios are original fixtures. Complete official campaign openings/victory rules, full mechanical board graphs, joined half-hex topology and non-Night physical control-marker totals remain unverified. Editable four-board templates retain known place inventories but require printed calibration; uncalibrated cross-board movement can be adjudicated with table relocation. Allied entry consent remains a human agreement. See [table guide](full-tabletop.md), [source gaps](../content/missing-content.md) and [rules questions](../rules/ambiguities.md).

Local briefings/replay and AI delegation remain client-side. Hosted async multiplayer is deferred. Full backups contain every seat's private state and require trusted exchange.
