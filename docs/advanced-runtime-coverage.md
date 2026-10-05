# Advanced runtime coverage

Completion audit: October 5, 2026 UTC. **Advanced preview** uses automated decks/Powers. **Full tabletop** includes every physical card/counter and records human resolution for effects outside the automatic engine. Catalog verification and complete executable behavior remain distinct.

| Content | Cataloged | Automated effects | Human table effects |
| --- | ---: | ---: | ---: |
| Spells | 52 | 52 | 0 |
| Treasures | 36 | 34 | 2 |
| Blessings | 60 | 51 | 9 |
| Hero effects | 38 | 32 | 6 |
| Total | 186 | 169 | 17 |

All 38 named Hero counters, all 44 Army types and all 36 Monsters are available. Supported Hero effects include passive/ongoing abilities, not only active buttons. Full tabletop additionally preserves the separate four Enslaved Hero markers. Six kingdom information cards bring the physical card inventory to 192.

Unsellable-only Treasure excess in Winter requires an explicit human table ruling. AI pauses for it; retaining excess is logged and is not asserted as an official disposal exception. None of the 36 final Advanced balance games required this ruling. The four affected Treasures' ordinary effects are supported; this unresolved combined holding-limit case remains disclosed.

## Effects requiring table adjudication

Generated from the compiled runtime's actual gate list. These are excluded from automated preview decks/Power choices, but available through Full tabletop. Human controls provide targets, dice/modifiers, counter changes, movement, hits, markers, private card zones and nested owner responses; they do not enforce each remaining lifecycle automatically.

| ID | Card / Hero | Remaining automatic decision flow |
| --- | --- | --- |
| blessing-goblins-05 | Spy Network | Returning the card to hand needs a combat result choice. |
| blessing-night-02 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-03 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-04 | Enslave | Enslaved Heroes require their separate four-counter supply and release lifecycle. |
| blessing-night-06 | Your True Rulers | Coven protection needs all build and discovery event hooks. |
| blessing-night-08 | Knives in the Dark | Coven discovery needs a Strike replacement window. |
| blessing-night-09 | Shapeshift | The Hero escape occurs after it is selected for elimination. |
| blessing-oathborn-06 | Fury of the Ancestors | The winner chooses an extra advance and attack. |
| blessing-orcs-01 | Whips of Grom | Movement must preserve a mandatory legal Attack action. |
| hero-empire-13 | Princess Sofia | Post-advance movement and extra Attack need a new activation window. |
| hero-fjordland-13 | Freyja | The save interrupts the chosen Hero’s elimination. |
| hero-goblins-16 | Siskar | Reroll selection must include every d6 event, including outside combat. |
| hero-night-12 | Luna, Mist Hunter | Assassination uses elimination instead of ordinary Strike hits. |
| hero-oathborn-11 | Haga-Tor, the Red Eagle | The defender needs optional advance and counterattack choices. |
| hero-orcs-12 | Spy-Master Kagash | The Power requires two separately chosen enemy targets. |
| treasure-05 | Horn of Udun | Interception before enemy entry needs a placement window. |
| treasure-12 | Ring of Invisibility | The Hero escape occurs after that Hero is chosen for a hit. |

## Completion expansion

The added flows include chosen Conscription/Song of the Valkyrie placements; Runestones/Yeti draw-discard choices; immediate Powerful and Eternal Study; Fear/Kovat owner retreat and Hero separation; Book of the Dead opponent selection; Encyclopedia Monster copying; separate Earthquake strikes; optional second Crushing Vines strike; Necromancy elimination snapshots/recovery; Moryana's Fury stack-hit allocation; Martyrdom Blessing choices; Lilith cast responses; Dominia's automatic Coven placement; Wave Strider transport allowance; Sneak Attack declaration benefits; Szark's Ambush successes; Demonic Possession; mining/loot/elimination event windows and the ordinary curse/fountain effects.

Saved pending flows validate bounded recursion, legal owners/choices, unique card/counter inventories and temporary movement across interrupted Sea crossings. A collapsed kingdom cannot use an elimination response to create a new Hero. Finished stacks cannot cycle join/drop, and an activating Army must leave a finished Hero behind before ending its activation.

## Source and play limits

Both supplied digital scenarios are original fixtures. Complete official campaign openings/victory rules, full mechanical board graphs, joined half-hex topology and non-Night physical control-marker totals remain unverified. Editable four-board templates retain known place inventories but require printed calibration; uncalibrated cross-board movement can be adjudicated with table relocation. Allied entry consent remains a human agreement. See [table guide](full-tabletop.md), [source gaps](../content/missing-content.md) and [rules questions](../rules/ambiguities.md).

Local briefings/replay and AI delegation remain client-side. Hosted async multiplayer is deferred. Full backups contain every seat's private state and require trusted exchange.
